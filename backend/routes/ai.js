const express = require('express');
const router = express.Router();
const fetch = require('node-fetch');
const Candidate = require('../models/Candidate');

const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;
const OPENROUTER_URL = 'https://openrouter.ai/api/v1/chat/completions';

// Free models in priority order
const FREE_MODELS = [
  'deepseek/deepseek-v4-flash:free',
  'openai/gpt-oss-20b:free',
  'meta-llama/llama-3.3-70b-instruct:free',
  'meta-llama/llama-3.2-3b-instruct:free'
];

const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

async function callOpenRouter(systemPrompt, userPrompt) {
  let lastError = null;

  for (const model of FREE_MODELS) {
    try {
      const response = await fetch(OPENROUTER_URL, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
          'Content-Type': 'application/json',
          'HTTP-Referer': process.env.FRONTEND_URL || 'http://localhost:3000',
          'X-Title': 'Candidate Shortlisting System'
        },
        body: JSON.stringify({
          model,
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userPrompt }
          ],
          temperature: 0.3,
          max_tokens: 2000
        })
      });

      if (response.status === 429 || response.status === 503) {
        const errText = await response.text();
        // Parse retry-after if available, wait that long then try next model
        let retryAfter = 15000;
        try {
          const parsed = JSON.parse(errText);
          const seconds = parsed?.error?.metadata?.retry_after_seconds;
          if (seconds) retryAfter = Math.min(seconds * 1000 + 2000, 62000); // wait full retry window
        } catch {}
        lastError = new Error(`Model ${model} rate limited`);
        console.warn(`Model ${model} rate limited, waiting ${retryAfter}ms...`);
        await sleep(retryAfter);
        continue;
      }

      if (!response.ok) {
        const errText = await response.text();
        lastError = new Error(`OpenRouter error ${response.status}: ${errText}`);
        console.warn(`Model ${model} error ${response.status}, trying next...`);
        continue;
      }

      const data = await response.json();
      const content = data.choices?.[0]?.message?.content;
      if (!content) {
        lastError = new Error(`Empty response from model ${model}`);
        continue;
      }

      console.log(`AI response from model: ${model}`);
      return { content, model };
    } catch (err) {
      lastError = err;
      console.warn(`Model ${model} threw: ${err.message}, trying next...`);
    }
  }

  throw lastError || new Error('All AI models are currently rate limited. Please wait 30 seconds and try again.');
}

function extractJSON(text) {
  // Try markdown code block first
  const codeBlock = text.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
  if (codeBlock) {
    try { return JSON.parse(codeBlock[1]); } catch {}
  }
  // Try raw JSON object
  const jsonStart = text.indexOf('{');
  const jsonEnd = text.lastIndexOf('}');
  if (jsonStart !== -1 && jsonEnd !== -1) {
    try { return JSON.parse(text.slice(jsonStart, jsonEnd + 1)); } catch {}
  }
  return null;
}

// POST /api/ai/shortlist
router.post('/shortlist', async (req, res) => {
  try {
    const { requiredSkills, minExperience, preferredSkills, jobTitle, jobDescription } = req.body;

    if (!requiredSkills || !Array.isArray(requiredSkills) || requiredSkills.length === 0) {
      return res.status(400).json({ error: 'requiredSkills array is required' });
    }

    const minExp = Number(minExperience) || 0;
    const candidates = await Candidate.find({ experience: { $gte: minExp } });

    if (candidates.length === 0) {
      return res.json({
        summary: 'No candidates meet the minimum experience requirement.',
        results: [],
        model: null
      });
    }

    const candidateList = candidates.map((c, i) =>
      `${i + 1}. ${c.name} | Skills: ${c.skills.join(', ')} | Experience: ${c.experience} years | Bio: ${c.bio || 'N/A'}`
    ).join('\n');

    const systemPrompt = 'You are an expert HR recruiter. Respond with valid JSON only — no markdown, no text outside the JSON object.';

    const userPrompt = `Rank these candidates for the job. Return ONLY a JSON object, nothing else.

Job:
- Title: ${jobTitle || 'Software Developer'}
- Required Skills: ${requiredSkills.join(', ')}
- Preferred Skills: ${(preferredSkills || []).join(', ') || 'None'}
- Min Experience: ${minExp} years
- Description: ${jobDescription || 'Not provided'}

Candidates:
${candidateList}

JSON format to return:
{
  "rankings": [
    {
      "rank": 1,
      "name": "exact name from list",
      "matchScore": 85,
      "matchLevel": "High",
      "strengths": "key strengths",
      "weaknesses": "gaps or concerns",
      "recommendation": "hiring recommendation",
      "interviewQuestions": ["Q1", "Q2", "Q3"]
    }
  ],
  "summary": "2-3 sentence summary"
}

Rules: matchScore 0-100, matchLevel is "High" (>=75), "Partial" (40-74), or "Low" (<40). Sort best to worst.`;

    const { content, model } = await callOpenRouter(systemPrompt, userPrompt);
    const parsed = extractJSON(content);

    if (!parsed) {
      // Return raw so frontend can at least show something
      return res.json({
        summary: 'AI responded but result could not be parsed.',
        rawResponse: content,
        results: [],
        model
      });
    }

    const enriched = (parsed.rankings || []).map(ranking => {
      const candidate = candidates.find(c =>
        c.name.toLowerCase().trim() === ranking.name.toLowerCase().trim()
      );
      return { ...ranking, candidateData: candidate || null };
    });

    res.json({
      summary: parsed.summary,
      results: enriched,
      model
    });
  } catch (err) {
    console.error('AI shortlist error:', err.message);
    res.status(503).json({
      error: err.message,
      hint: 'All free AI models are rate limited. Wait 30 seconds and try again.'
    });
  }
});

// POST /api/ai/interview-questions
router.post('/interview-questions', async (req, res) => {
  try {
    const { candidateId, jobTitle, requiredSkills } = req.body;

    if (!candidateId) {
      return res.status(400).json({ error: 'candidateId is required' });
    }

    const candidate = await Candidate.findById(candidateId);
    if (!candidate) {
      return res.status(404).json({ error: 'Candidate not found' });
    }

    const systemPrompt = 'You are an expert technical interviewer. Respond with valid JSON only.';

    const userPrompt = `Generate 5 interview questions for this candidate. Return ONLY JSON.

Candidate: ${candidate.name}
Skills: ${candidate.skills.join(', ')}
Experience: ${candidate.experience} years
Bio: ${candidate.bio || 'N/A'}
Job Title: ${jobTitle || 'Software Developer'}
Required Skills: ${(requiredSkills || []).join(', ') || 'General'}

JSON format:
{
  "questions": [
    { "question": "text", "category": "Technical", "difficulty": "Medium" }
  ]
}`;

    const { content, model } = await callOpenRouter(systemPrompt, userPrompt);
    const parsed = extractJSON(content);

    res.json({
      candidate: { name: candidate.name, skills: candidate.skills },
      questions: parsed?.questions || [],
      model
    });
  } catch (err) {
    console.error('Interview questions error:', err.message);
    res.status(503).json({
      error: err.message,
      hint: 'All free AI models are rate limited. Wait 30 seconds and try again.'
    });
  }
});

module.exports = router;

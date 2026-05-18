const express = require('express');
const router = express.Router();
const fetch = require('node-fetch');
const Candidate = require('../models/Candidate');

const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;
const OPENROUTER_URL = 'https://openrouter.ai/api/v1/chat/completions';

// Free models in priority order — if one fails/rate-limits, next is tried
const FREE_MODELS = [
  'meta-llama/llama-3.3-70b-instruct:free',
  'google/gemma-3-27b-it:free',
  'meta-llama/llama-3.2-3b-instruct:free',
  'nousresearch/hermes-3-llama-3.1-405b:free'
];

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
        // Rate limited or unavailable — try next model
        const errText = await response.text();
        lastError = new Error(`Model ${model} returned ${response.status}: ${errText}`);
        console.warn(`Model ${model} unavailable (${response.status}), trying next...`);
        continue;
      }

      if (!response.ok) {
        const errText = await response.text();
        lastError = new Error(`OpenRouter API error: ${response.status} - ${errText}`);
        console.warn(`Model ${model} error: ${response.status}, trying next...`);
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
      console.warn(`Model ${model} threw error: ${err.message}, trying next...`);
    }
  }

  throw lastError || new Error('All AI models failed');
}

function extractJSON(text) {
  // Try to extract JSON from markdown code blocks first
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

// POST /api/ai/shortlist - AI-based candidate shortlisting
router.post('/shortlist', async (req, res) => {
  try {
    const { requiredSkills, minExperience, preferredSkills, jobTitle, jobDescription } = req.body;

    if (!requiredSkills || !Array.isArray(requiredSkills) || requiredSkills.length === 0) {
      return res.status(400).json({ error: 'requiredSkills array is required' });
    }

    const minExp = Number(minExperience) || 0;
    const candidates = await Candidate.find({ experience: { $gte: minExp } });

    if (candidates.length === 0) {
      return res.json({ message: 'No candidates meet the minimum experience requirement', results: [] });
    }

    const candidateList = candidates.map((c, i) =>
      `${i + 1}. ${c.name} | Skills: ${c.skills.join(', ')} | Experience: ${c.experience} years | Bio: ${c.bio || 'N/A'}`
    ).join('\n');

    const systemPrompt = 'You are an expert HR recruiter AI assistant. Always respond with valid JSON only — no markdown, no explanation outside the JSON.';

    const userPrompt = `Analyze these candidates for the job and return ONLY a JSON object.

Job:
- Title: ${jobTitle || 'Software Developer'}
- Required Skills: ${requiredSkills.join(', ')}
- Preferred Skills: ${(preferredSkills || []).join(', ') || 'None'}
- Min Experience: ${minExp} years
- Description: ${jobDescription || 'Not provided'}

Candidates:
${candidateList}

Return this exact JSON structure:
{
  "rankings": [
    {
      "rank": 1,
      "name": "exact candidate name from list",
      "matchScore": 85,
      "matchLevel": "High",
      "strengths": "key strengths for this role",
      "weaknesses": "skill gaps or concerns",
      "recommendation": "concise hiring recommendation",
      "interviewQuestions": ["Q1", "Q2", "Q3"]
    }
  ],
  "summary": "2-3 sentence overall summary"
}

matchScore: 0-100. matchLevel: "High" (>=75), "Partial" (40-74), "Low" (<40). Rank best to worst.`;

    const { content, model } = await callOpenRouter(systemPrompt, userPrompt);

    const parsed = extractJSON(content);

    if (!parsed) {
      return res.json({
        rawResponse: content,
        message: 'AI responded but JSON could not be parsed. Raw response shown.',
        results: [],
        model
      });
    }

    // Merge AI rankings with candidate DB data
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
    res.status(500).json({ error: err.message });
  }
});

// POST /api/ai/interview-questions - Generate interview questions for a candidate
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

    const userPrompt = `Generate 5 targeted interview questions for this candidate.

Candidate: ${candidate.name}
Skills: ${candidate.skills.join(', ')}
Experience: ${candidate.experience} years
Bio: ${candidate.bio || 'N/A'}
Job Title: ${jobTitle || 'Software Developer'}
Required Skills: ${(requiredSkills || []).join(', ') || 'General'}

Return ONLY this JSON:
{
  "questions": [
    { "question": "Question text here", "category": "Technical", "difficulty": "Medium" }
  ]
}

category options: Technical, Behavioral, Situational
difficulty options: Easy, Medium, Hard`;

    const { content, model } = await callOpenRouter(systemPrompt, userPrompt);
    const parsed = extractJSON(content);

    if (!parsed) {
      return res.json({ rawResponse: content, questions: [] });
    }

    res.json({
      candidate: { name: candidate.name, skills: candidate.skills },
      questions: parsed.questions || [],
      model
    });
  } catch (err) {
    console.error('Interview questions error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;

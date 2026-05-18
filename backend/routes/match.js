const express = require('express');
const router = express.Router();
const Candidate = require('../models/Candidate');

// POST /api/match - Basic skill-based shortlisting
router.post('/', async (req, res) => {
  try {
    const { requiredSkills, minExperience, preferredSkills } = req.body;

    if (!requiredSkills || !Array.isArray(requiredSkills) || requiredSkills.length === 0) {
      return res.status(400).json({ error: 'requiredSkills array is required' });
    }

    const minExp = Number(minExperience) || 0;
    const normalizedRequired = requiredSkills.map(s => s.toLowerCase().trim());
    const normalizedPreferred = (preferredSkills || []).map(s => s.toLowerCase().trim());

    const candidates = await Candidate.find({ experience: { $gte: minExp } });

    const ranked = candidates.map(candidate => {
      const candidateSkills = candidate.skills.map(s => s.toLowerCase().trim());

      const matchedRequired = normalizedRequired.filter(skill =>
        candidateSkills.includes(skill)
      );
      const matchedPreferred = normalizedPreferred.filter(skill =>
        candidateSkills.includes(skill)
      );

      const requiredScore = matchedRequired.length / normalizedRequired.length;
      const preferredBonus = normalizedPreferred.length > 0
        ? (matchedPreferred.length / normalizedPreferred.length) * 0.2
        : 0;

      const totalScore = Math.min(requiredScore + preferredBonus, 1);

      let matchLevel = 'Low';
      if (totalScore >= 0.75) matchLevel = 'High';
      else if (totalScore >= 0.4) matchLevel = 'Partial';

      return {
        _id: candidate._id,
        name: candidate.name,
        email: candidate.email,
        skills: candidate.skills,
        experience: candidate.experience,
        bio: candidate.bio,
        matchScore: Math.round(totalScore * 100),
        matchedSkills: matchedRequired,
        matchedPreferredSkills: matchedPreferred,
        matchLevel
      };
    });

    const sorted = ranked.sort((a, b) => b.matchScore - a.matchScore);

    res.json({
      total: sorted.length,
      results: sorted
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;

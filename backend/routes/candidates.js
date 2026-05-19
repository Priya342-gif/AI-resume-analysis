const express = require('express');
const router = express.Router();
const Candidate = require('../models/Candidate');

// POST /api/candidates - Add a new candidate (belongs to logged-in user)
router.post('/', async (req, res) => {
  try {
    const { name, email, skills, experience, bio } = req.body;

    if (!name || !email || !skills || experience === undefined) {
      return res.status(400).json({ error: 'name, email, skills, and experience are required' });
    }

    const normalizedSkills = Array.isArray(skills)
      ? skills.map(s => s.trim())
      : skills.split(',').map(s => s.trim());

    const candidate = new Candidate({
      name: name.trim(),
      email: email.trim().toLowerCase(),
      skills: normalizedSkills,
      experience: Number(experience),
      bio: bio ? bio.trim() : '',
      createdBy: req.user._id   // link to logged-in user
    });

    const saved = await candidate.save();
    res.status(201).json({ message: 'Candidate added successfully', candidate: saved });
  } catch (err) {
    if (err.code === 11000) {
      return res.status(409).json({ error: 'You already added a candidate with this email' });
    }
    res.status(500).json({ error: err.message });
  }
});

// GET /api/candidates - Get only this user's candidates
router.get('/', async (req, res) => {
  try {
    const { search } = req.query;
    let query = { createdBy: req.user._id };

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { skills: { $elemMatch: { $regex: search, $options: 'i' } } }
      ];
    }

    const candidates = await Candidate.find(query).sort({ createdAt: -1 });
    res.json(candidates);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/candidates/:id - Delete only if it belongs to this user
router.delete('/:id', async (req, res) => {
  try {
    const deleted = await Candidate.findOneAndDelete({
      _id: req.params.id,
      createdBy: req.user._id
    });
    if (!deleted) return res.status(404).json({ error: 'Candidate not found' });
    res.json({ message: 'Candidate deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;

import { useState } from 'react';
import { addCandidate } from '../api';
import toast from 'react-hot-toast';
import { UserPlus } from 'lucide-react';

export default function CandidateForm({ onAdded }) {
  const [form, setForm] = useState({
    name: '',
    email: '',
    skills: '',
    experience: '',
    bio: ''
  });
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name || !form.email || !form.skills || form.experience === '') {
      toast.error('Please fill in all required fields');
      return;
    }

    setLoading(true);
    try {
      const skillsArray = form.skills.split(',').map(s => s.trim()).filter(Boolean);
      if (skillsArray.length === 0) {
        toast.error('Please enter at least one skill');
        return;
      }

      await addCandidate({
        name: form.name,
        email: form.email,
        skills: skillsArray,
        experience: Number(form.experience),
        bio: form.bio
      });

      toast.success(`${form.name} added successfully!`);
      setForm({ name: '', email: '', skills: '', experience: '', bio: '' });
      onAdded?.();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to add candidate');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="card">
      <div className="card-title">
        <UserPlus size={18} color="#38bdf8" />
        Add Candidate
      </div>
      <form onSubmit={handleSubmit}>
        <div className="form-grid">
          <div className="form-group">
            <label>Name *</label>
            <input
              name="name"
              value={form.name}
              onChange={handleChange}
              placeholder="e.g. Rahul Sharma"
            />
          </div>
          <div className="form-group">
            <label>Email *</label>
            <input
              name="email"
              type="email"
              value={form.email}
              onChange={handleChange}
              placeholder="e.g. rahul@gmail.com"
            />
          </div>
          <div className="form-group">
            <label>Skills * (comma-separated)</label>
            <input
              name="skills"
              value={form.skills}
              onChange={handleChange}
              placeholder="e.g. React, Node.js, MongoDB"
            />
          </div>
          <div className="form-group">
            <label>Experience (years) *</label>
            <input
              name="experience"
              type="number"
              min="0"
              step="0.5"
              value={form.experience}
              onChange={handleChange}
              placeholder="e.g. 2"
            />
          </div>
          <div className="form-group full-width">
            <label>Bio / Projects</label>
            <textarea
              name="bio"
              value={form.bio}
              onChange={handleChange}
              placeholder="Brief description of projects or background..."
            />
          </div>
        </div>
        <div style={{ marginTop: '1rem' }}>
          <button type="submit" className="btn btn-primary" disabled={loading}>
            {loading ? (
              <><span className="spinner" style={{ width: 16, height: 16, borderWidth: 2 }} /> Adding...</>
            ) : (
              <><UserPlus size={16} /> Add Candidate</>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}

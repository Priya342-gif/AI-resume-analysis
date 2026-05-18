import { useState } from 'react';
import { Briefcase } from 'lucide-react';

export default function JobForm({ onSubmit, loading, mode }) {
  const [form, setForm] = useState({
    jobTitle: '',
    jobDescription: '',
    requiredSkills: '',
    preferredSkills: '',
    minExperience: ''
  });

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const requiredSkills = form.requiredSkills.split(',').map(s => s.trim()).filter(Boolean);
    const preferredSkills = form.preferredSkills.split(',').map(s => s.trim()).filter(Boolean);

    if (requiredSkills.length === 0) {
      alert('Please enter at least one required skill');
      return;
    }

    onSubmit({
      jobTitle: form.jobTitle,
      jobDescription: form.jobDescription,
      requiredSkills,
      preferredSkills,
      minExperience: Number(form.minExperience) || 0
    });
  };

  return (
    <div className="card">
      <div className="card-title">
        <Briefcase size={18} color="#38bdf8" />
        Job Requirements
      </div>
      <form onSubmit={handleSubmit}>
        <div className="form-grid">
          <div className="form-group">
            <label>Job Title</label>
            <input
              name="jobTitle"
              value={form.jobTitle}
              onChange={handleChange}
              placeholder="e.g. Full Stack Developer"
            />
          </div>
          <div className="form-group">
            <label>Minimum Experience (years)</label>
            <input
              name="minExperience"
              type="number"
              min="0"
              step="0.5"
              value={form.minExperience}
              onChange={handleChange}
              placeholder="e.g. 1"
            />
          </div>
          <div className="form-group">
            <label>Required Skills * (comma-separated)</label>
            <input
              name="requiredSkills"
              value={form.requiredSkills}
              onChange={handleChange}
              placeholder="e.g. React, Node.js"
            />
          </div>
          <div className="form-group">
            <label>Preferred Skills (comma-separated)</label>
            <input
              name="preferredSkills"
              value={form.preferredSkills}
              onChange={handleChange}
              placeholder="e.g. AWS, Docker"
            />
          </div>
          <div className="form-group full-width">
            <label>Job Description</label>
            <textarea
              name="jobDescription"
              value={form.jobDescription}
              onChange={handleChange}
              placeholder="Describe the role and responsibilities..."
            />
          </div>
        </div>
        <div style={{ marginTop: '1rem' }}>
          <button
            type="submit"
            className={`btn ${mode === 'ai' ? 'btn-ai' : 'btn-primary'}`}
            disabled={loading}
          >
            {loading ? (
              <><span className="spinner" style={{ width: 16, height: 16, borderWidth: 2 }} />
                {mode === 'ai' ? 'AI Analyzing...' : 'Matching...'}</>
            ) : mode === 'ai' ? (
              <>🤖 AI Shortlist Candidates</>
            ) : (
              <><Briefcase size={16} /> Shortlist Candidates</>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}

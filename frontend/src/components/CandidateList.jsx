import { useState, useEffect, useCallback } from 'react';
import { getCandidates, deleteCandidate } from '../api';
import toast from 'react-hot-toast';
import { Users, Trash2, Search, RefreshCw } from 'lucide-react';

export default function CandidateList({ refreshTrigger }) {
  const [candidates, setCandidates] = useState([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [deleting, setDeleting] = useState(null);

  const fetchCandidates = useCallback(async () => {
    setLoading(true);
    try {
      const res = await getCandidates(search);
      setCandidates(res.data);
    } catch (err) {
      toast.error('Failed to fetch candidates');
    } finally {
      setLoading(false);
    }
  }, [search]);

  useEffect(() => {
    fetchCandidates();
  }, [fetchCandidates, refreshTrigger]);

  const handleDelete = async (id, name) => {
    if (!window.confirm(`Delete ${name}?`)) return;
    setDeleting(id);
    try {
      await deleteCandidate(id);
      toast.success(`${name} removed`);
      setCandidates(prev => prev.filter(c => c._id !== id));
    } catch (err) {
      toast.error('Failed to delete candidate');
    } finally {
      setDeleting(null);
    }
  };

  return (
    <div className="card">
      <div className="card-title">
        <Users size={18} color="#38bdf8" />
        All Candidates
        <span style={{ marginLeft: 'auto', fontSize: '0.8rem', color: '#64748b', fontWeight: 400 }}>
          {candidates.length} total
        </span>
      </div>

      <div className="search-bar">
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search by name or skill..."
        />
        <button className="btn btn-secondary btn-sm" onClick={fetchCandidates}>
          <RefreshCw size={14} />
        </button>
      </div>

      {loading ? (
        <div className="loading-spinner">
          <div className="spinner" />
          Loading candidates...
        </div>
      ) : candidates.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">👤</div>
          <div>No candidates found</div>
          <div style={{ fontSize: '0.8rem', marginTop: '0.5rem' }}>
            {search ? 'Try a different search term' : 'Add your first candidate above'}
          </div>
        </div>
      ) : (
        <div className="candidate-grid">
          {candidates.map(c => (
            <div key={c._id} className="candidate-card">
              <div className="candidate-card-header">
                <div>
                  <div className="candidate-name">{c.name}</div>
                  <div className="candidate-email">{c.email}</div>
                </div>
                <button
                  className="btn btn-danger btn-sm"
                  onClick={() => handleDelete(c._id, c.name)}
                  disabled={deleting === c._id}
                  title="Delete candidate"
                >
                  <Trash2 size={13} />
                </button>
              </div>
              <div className="candidate-exp">
                🕐 {c.experience} year{c.experience !== 1 ? 's' : ''} experience
              </div>
              {c.bio && (
                <div style={{ fontSize: '0.8rem', color: '#64748b', marginBottom: '0.5rem', lineHeight: 1.4 }}>
                  {c.bio.length > 80 ? c.bio.slice(0, 80) + '...' : c.bio}
                </div>
              )}
              <div className="skills-wrap">
                {c.skills.map(skill => (
                  <span key={skill} className="badge badge-skill">{skill}</span>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

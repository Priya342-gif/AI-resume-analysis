import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { TrendingUp } from 'lucide-react';

function ScoreBar({ score, level }) {
  const colorClass = level === 'High' ? 'score-high' : level === 'Partial' ? 'score-partial' : 'score-low';
  return (
    <div className="match-score-bar">
      <div className={`match-score-fill ${colorClass}`} style={{ width: `${score}%` }} />
    </div>
  );
}

function LevelBadge({ level }) {
  const cls = level === 'High' ? 'badge-high' : level === 'Partial' ? 'badge-partial' : 'badge-low';
  return <span className={`badge ${cls}`}>{level} Match</span>;
}

export default function MatchResults({ results, total }) {
  if (!results || results.length === 0) return null;

  const chartData = results.slice(0, 10).map(r => ({
    name: r.name.split(' ')[0],
    score: r.matchScore
  }));

  const barColor = (score) => {
    if (score >= 75) return '#4ade80';
    if (score >= 40) return '#fb923c';
    return '#f87171';
  };

  return (
    <div>
      {/* Stats */}
      <div className="stats-row">
        <div className="stat-card">
          <div className="stat-value">{total}</div>
          <div className="stat-label">Candidates Evaluated</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{results.filter(r => r.matchLevel === 'High').length}</div>
          <div className="stat-label">High Match</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{results.filter(r => r.matchLevel === 'Partial').length}</div>
          <div className="stat-label">Partial Match</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{results.filter(r => r.matchLevel === 'Low').length}</div>
          <div className="stat-label">Low Match</div>
        </div>
      </div>

      {/* Chart */}
      <div className="card">
        <div className="card-title">
          <TrendingUp size={18} color="#38bdf8" />
          Match Score Chart
        </div>
        <div className="chart-container">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
              <XAxis dataKey="name" tick={{ fill: '#94a3b8', fontSize: 12 }} />
              <YAxis domain={[0, 100]} tick={{ fill: '#94a3b8', fontSize: 12 }} />
              <Tooltip
                contentStyle={{ background: '#1e293b', border: '1px solid #334155', borderRadius: 8 }}
                labelStyle={{ color: '#f1f5f9' }}
                formatter={(val) => [`${val}%`, 'Match Score']}
              />
              <Bar dataKey="score" radius={[4, 4, 0, 0]}>
                {chartData.map((entry, i) => (
                  <Cell key={i} fill={barColor(entry.score)} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Results List */}
      <div className="card">
        <div className="card-title">Shortlisted Candidates</div>
        {results.map((r, i) => (
          <div key={r._id || i} className="match-card">
            <div className="match-card-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <div style={{
                  background: '#1e293b',
                  border: '1px solid #334155',
                  borderRadius: '50%',
                  width: 32,
                  height: 32,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: 700,
                  fontSize: '0.875rem',
                  color: '#38bdf8'
                }}>
                  #{i + 1}
                </div>
                <div>
                  <div style={{ fontWeight: 600, color: '#f1f5f9' }}>{r.name}</div>
                  <div style={{ fontSize: '0.8rem', color: '#64748b' }}>{r.email}</div>
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <span style={{ fontWeight: 700, fontSize: '1.1rem', color: '#38bdf8' }}>
                  {r.matchScore}%
                </span>
                <LevelBadge level={r.matchLevel} />
              </div>
            </div>

            <ScoreBar score={r.matchScore} level={r.matchLevel} />

            <div style={{ display: 'flex', gap: '1.5rem', fontSize: '0.8rem', color: '#94a3b8', margin: '0.5rem 0' }}>
              <span>🕐 {r.experience} yrs exp</span>
              <span>✅ {r.matchedSkills?.length || 0} required skills matched</span>
              {r.matchedPreferredSkills?.length > 0 && (
                <span>⭐ {r.matchedPreferredSkills.length} preferred matched</span>
              )}
            </div>

            <div style={{ marginTop: '0.5rem' }}>
              <div style={{ fontSize: '0.75rem', color: '#64748b', marginBottom: '0.35rem' }}>Matched Skills:</div>
              <div className="skills-wrap">
                {r.matchedSkills?.map(s => (
                  <span key={s} className="badge badge-high">{s}</span>
                ))}
                {r.skills?.filter(s => !r.matchedSkills?.map(m => m.toLowerCase()).includes(s.toLowerCase())).map(s => (
                  <span key={s} className="badge badge-skill">{s}</span>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

import { useState } from 'react';
import { getInterviewQuestions } from '../api';
import toast from 'react-hot-toast';
import { Bot, ChevronDown, ChevronUp, MessageSquare } from 'lucide-react';

function LevelBadge({ level }) {
  const cls = level === 'High' ? 'badge-high' : level === 'Partial' ? 'badge-partial' : 'badge-low';
  return <span className={`badge ${cls}`}>{level} Match</span>;
}

function CandidateAICard({ result, index, jobRequirements }) {
  const [expanded, setExpanded] = useState(index === 0);
  const [questions, setQuestions] = useState(result.interviewQuestions || []);
  const [loadingQ, setLoadingQ] = useState(false);

  const fetchMoreQuestions = async () => {
    if (!result.candidateData?._id) {
      toast.error('Candidate data not available');
      return;
    }
    setLoadingQ(true);
    try {
      const res = await getInterviewQuestions({
        candidateId: result.candidateData._id,
        jobTitle: jobRequirements?.jobTitle,
        requiredSkills: jobRequirements?.requiredSkills
      });
      setQuestions(res.data.questions?.map(q => q.question) || questions);
      toast.success('Interview questions generated!');
    } catch (err) {
      toast.error('Failed to generate questions');
    } finally {
      setLoadingQ(false);
    }
  };

  return (
    <div className="ai-result-card">
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
        <div className="ai-rank-badge">#{result.rank || index + 1}</div>
        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <div style={{ fontWeight: 600, color: '#f1f5f9', fontSize: '1rem' }}>{result.name}</div>
              {result.candidateData && (
                <div style={{ fontSize: '0.8rem', color: '#64748b' }}>{result.candidateData.email}</div>
              )}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <span style={{ fontWeight: 700, fontSize: '1.1rem', color: '#a78bfa' }}>
                {result.matchScore}%
              </span>
              <LevelBadge level={result.matchLevel} />
              <button
                className="btn btn-secondary btn-sm"
                onClick={() => setExpanded(!expanded)}
              >
                {expanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
              </button>
            </div>
          </div>
        </div>
      </div>

      {expanded && (
        <>
          {result.candidateData && (
            <div style={{ marginTop: '0.75rem' }}>
              <div className="skills-wrap">
                {result.candidateData.skills?.map(s => (
                  <span key={s} className="badge badge-skill">{s}</span>
                ))}
              </div>
              <div style={{ fontSize: '0.8rem', color: '#64748b', marginTop: '0.35rem' }}>
                🕐 {result.candidateData.experience} years experience
              </div>
            </div>
          )}

          {result.strengths && (
            <div className="ai-section">
              <div className="ai-section-title">✅ Strengths</div>
              <div className="ai-text">{result.strengths}</div>
            </div>
          )}

          {result.weaknesses && (
            <div className="ai-section">
              <div className="ai-section-title">⚠️ Gaps</div>
              <div className="ai-text">{result.weaknesses}</div>
            </div>
          )}

          {result.recommendation && (
            <div className="ai-section">
              <div className="ai-section-title">🤖 AI Recommendation</div>
              <div className="ai-text">{result.recommendation}</div>
            </div>
          )}

          {questions && questions.length > 0 && (
            <div className="ai-section">
              <div className="ai-section-title">
                <MessageSquare size={12} style={{ display: 'inline', marginRight: 4 }} />
                Interview Questions
              </div>
              {questions.map((q, i) => (
                <div key={i} className="interview-q">
                  <span className="interview-q-num">Q{i + 1}.</span>
                  <span>{typeof q === 'string' ? q : q.question}</span>
                </div>
              ))}
            </div>
          )}

          <div style={{ marginTop: '0.75rem' }}>
            <button
              className="btn btn-secondary btn-sm"
              onClick={fetchMoreQuestions}
              disabled={loadingQ}
            >
              {loadingQ ? (
                <><span className="spinner" style={{ width: 12, height: 12, borderWidth: 2 }} /> Generating...</>
              ) : (
                <><MessageSquare size={13} /> Generate Interview Questions</>
              )}
            </button>
          </div>
        </>
      )}
    </div>
  );
}

export default function AIResults({ data, jobRequirements }) {
  if (!data) return null;

  // Handle rate limit / error case
  if (data.error || (data.results && data.results.length === 0 && !data.summary?.includes('No candidates'))) {
    return (
      <div className="card" style={{ borderColor: '#f87171' }}>
        <div className="card-title">
          <Bot size={18} color="#f87171" />
          AI Shortlisting
        </div>
        <div style={{ background: '#450a0a', border: '1px solid #f87171', borderRadius: 8, padding: '1rem', color: '#fca5a5', lineHeight: 1.6 }}>
          <strong>⚠️ {data.error || 'No results returned'}</strong>
          {data.hint && <div style={{ marginTop: '0.5rem', fontSize: '0.875rem' }}>{data.hint}</div>}
          {data.rawResponse && (
            <details style={{ marginTop: '0.75rem' }}>
              <summary style={{ cursor: 'pointer', fontSize: '0.8rem' }}>Show raw AI response</summary>
              <pre style={{ marginTop: '0.5rem', fontSize: '0.75rem', whiteSpace: 'pre-wrap', color: '#94a3b8' }}>{data.rawResponse}</pre>
            </details>
          )}
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="card">
        <div className="card-title">
          <Bot size={18} color="#a78bfa" />
          AI Shortlisting Results
          <span style={{ marginLeft: 'auto', fontSize: '0.75rem', color: '#64748b', fontWeight: 400 }}>
            Powered by OpenRouter AI
          </span>
        </div>

        {data.summary && (
          <div className="summary-box">
            <strong style={{ color: '#c4b5fd' }}>AI Summary:</strong> {data.summary}
          </div>
        )}

        {data.results && data.results.length > 0 ? (
          data.results.map((result, i) => (
            <CandidateAICard
              key={i}
              result={result}
              index={i}
              jobRequirements={jobRequirements}
            />
          ))
        ) : (
          <div className="empty-state">
            <div className="empty-state-icon">🤖</div>
            <div>No AI results available</div>
          </div>
        )}
      </div>
    </div>
  );
}

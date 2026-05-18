import { useState } from 'react';
import { Toaster } from 'react-hot-toast';
import { Users, Briefcase, Bot, LogOut } from 'lucide-react';
import { useAuth } from './context/AuthContext';
import AuthPage from './pages/AuthPage';
import CandidateForm from './components/CandidateForm';
import CandidateList from './components/CandidateList';
import JobForm from './components/JobForm';
import MatchResults from './components/MatchResults';
import AIResults from './components/AIResults';
import { matchCandidates, aiShortlist } from './api';
import toast from 'react-hot-toast';

const TABS = [
  { id: 'candidates', label: 'Candidates', icon: Users },
  { id: 'match', label: 'Basic Match', icon: Briefcase },
  { id: 'ai', label: 'AI Shortlist', icon: Bot }
];

function MainApp() {
  const { user, logout } = useAuth();
  const [activeTab, setActiveTab] = useState('candidates');
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [matchResults, setMatchResults] = useState(null);
  const [aiResults, setAiResults] = useState(null);
  const [lastJobReq, setLastJobReq] = useState(null);
  const [matchLoading, setMatchLoading] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);

  const handleCandidateAdded = () => setRefreshTrigger(t => t + 1);

  const handleBasicMatch = async (jobData) => {
    setMatchLoading(true);
    setMatchResults(null);
    try {
      const res = await matchCandidates({
        requiredSkills: jobData.requiredSkills,
        preferredSkills: jobData.preferredSkills,
        minExperience: jobData.minExperience
      });
      setMatchResults(res.data);
      if (res.data.total === 0) toast('No candidates meet the criteria', { icon: 'ℹ️' });
      else toast.success(`Found ${res.data.total} candidates`);
    } catch (err) {
      toast.error(err.response?.data?.error || 'Matching failed');
    } finally {
      setMatchLoading(false);
    }
  };

  const handleAIShortlist = async (jobData) => {
    setAiLoading(true);
    setAiResults(null);
    setLastJobReq(jobData);
    try {
      const res = await aiShortlist(jobData);
      setAiResults(res.data);
      if (res.data.results?.length > 0) toast.success('AI analysis complete!');
      else toast(res.data.summary || 'No matching candidates found', { icon: 'ℹ️' });
    } catch (err) {
      const errData = err.response?.data;
      if (errData) setAiResults(errData);
      toast.error(errData?.hint || errData?.error || 'AI shortlisting failed');
    } finally {
      setAiLoading(false);
    }
  };

  const handleLogout = () => {
    logout();
    toast.success('Logged out');
  };

  return (
    <div className="app">
      {/* Navbar */}
      <nav className="navbar">
        <div className="navbar-brand">
          Candidate <span>Shortlisting</span> System
        </div>
        <div className="navbar-tabs">
          {TABS.map(tab => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                className={`nav-tab ${activeTab === tab.id ? 'active' : ''}`}
                onClick={() => setActiveTab(tab.id)}
              >
                <Icon size={15} />
                {tab.label}
              </button>
            );
          })}
        </div>
        {/* User info + logout */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <div style={{ fontSize: '0.8rem', color: '#94a3b8', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <div style={{
              width: 28, height: 28, borderRadius: '50%', background: '#0ea5e9',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontWeight: 700, fontSize: '0.75rem', color: 'white'
            }}>
              {user?.name?.charAt(0).toUpperCase()}
            </div>
            <span style={{ display: 'none' }} className="user-name">{user?.name}</span>
          </div>
          <button className="btn btn-secondary btn-sm" onClick={handleLogout} title="Logout">
            <LogOut size={14} /> Logout
          </button>
        </div>
      </nav>

      {/* Mobile tabs */}
      <div className="mobile-tabs">
        {TABS.map(tab => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              className={`nav-tab ${activeTab === tab.id ? 'active' : ''}`}
              onClick={() => setActiveTab(tab.id)}
              style={{ flex: 1, justifyContent: 'center' }}
            >
              <Icon size={15} />
              <span style={{ fontSize: '0.75rem' }}>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Main Content */}
      <main className="main-content">

        {activeTab === 'candidates' && (
          <>
            <CandidateForm onAdded={handleCandidateAdded} />
            <CandidateList refreshTrigger={refreshTrigger} />
          </>
        )}

        {activeTab === 'match' && (
          <>
            <JobForm onSubmit={handleBasicMatch} loading={matchLoading} mode="basic" />
            {matchLoading && (
              <div className="loading-spinner">
                <div className="spinner" />
                Matching candidates...
              </div>
            )}
            {matchResults && <MatchResults results={matchResults.results} total={matchResults.total} />}
          </>
        )}

        {activeTab === 'ai' && (
          <>
            <div className="card" style={{ borderColor: '#7c3aed', background: 'linear-gradient(135deg, #1e1b4b22, #1e293b)' }}>
              <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'flex-start' }}>
                <span style={{ fontSize: '1.5rem' }}>🤖</span>
                <div>
                  <div style={{ fontWeight: 600, color: '#c4b5fd', marginBottom: '0.25rem' }}>
                    AI-Powered Candidate Shortlisting
                  </div>
                  <div style={{ fontSize: '0.875rem', color: '#94a3b8', lineHeight: 1.5 }}>
                    Uses OpenRouter AI to analyze candidate profiles beyond simple keyword matching.
                    Get intelligent rankings, suitability explanations, and auto-generated interview questions.
                  </div>
                </div>
              </div>
            </div>
            <JobForm onSubmit={handleAIShortlist} loading={aiLoading} mode="ai" />
            {aiLoading && (
              <div className="loading-spinner">
                <div className="spinner" style={{ borderTopColor: '#a78bfa' }} />
                <div>
                  <div>AI is analyzing candidates...</div>
                  <div style={{ fontSize: '0.75rem', color: '#475569', marginTop: '0.25rem' }}>
                    This may take up to 60 seconds if models are busy
                  </div>
                </div>
              </div>
            )}
            {aiResults && <AIResults data={aiResults} jobRequirements={lastJobReq} />}
          </>
        )}
      </main>
    </div>
  );
}

export default function App() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', background: '#0f172a', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center', color: '#64748b' }}>
          <div className="spinner" style={{ margin: '0 auto 1rem' }} />
          <div>Loading...</div>
        </div>
      </div>
    );
  }

  return (
    <>
      <Toaster
        position="top-right"
        toastOptions={{
          style: { background: '#1e293b', color: '#e2e8f0', border: '1px solid #334155' }
        }}
      />
      {user ? <MainApp /> : <AuthPage />}
    </>
  );
}

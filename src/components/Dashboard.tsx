import React, { useState, useEffect } from 'react';
import type { DailyLog, WheelState, ChecklistItem } from '../types';
import { calculateEmpiricalWheel } from '../localAnalytics';
import { useAuth } from '../context/AuthContext';
import WheelOfLife from './WheelOfLife';
import QuickLogger from './QuickLogger';
import AnalyticsPanel from './AnalyticsPanel';
import AIAuditButton from './AIAuditButton';
import ThemeToggle from './ThemeToggle';

const INITIAL_HABITS: ChecklistItem[] = [
  { id: 'h1', label: '30m Workout', active: true },
  { id: 'h2', label: 'Read 10 Pages', active: true },
  { id: 'h3', label: 'Drink 3L Water', active: true },
  { id: 'h4', label: 'Meditate', active: true },
  { id: 'h5', label: 'Stretch/Mobility', active: true },
  { id: 'h6', label: 'Journaling', active: true },
  { id: 'h7', label: 'No Sugar', active: true },
  { id: 'h8', label: '8h Sleep', active: true },
];

const INITIAL_WHEEL: WheelState = {
  health: 6.0,
  wealth: 5.5,
  career: 7.0,
  relationships: 6.5,
  leisure: 6.0,
  growth: 6.5,
};

function getPastDate(daysAgo: number): string {
  const d = new Date();
  d.setDate(d.getDate() - daysAgo);
  return d.toISOString().split('T')[0];
}

export const Dashboard: React.FC = () => {
  const { user, logout, apiFetch } = useAuth();
  const [logs, setLogs] = useState<DailyLog[]>([]);
  const [wheelSelf, setWheelSelf] = useState<WheelState>(INITIAL_WHEEL);
  const [checklistItems, setChecklistItems] = useState<ChecklistItem[]>([]);
  const [selectedDate, setSelectedDate] = useState(() => getPastDate(0));
  
  const [loadingData, setLoadingData] = useState(true);
  const [syncError, setSyncError] = useState('');
  const [syncing, setSyncing] = useState(false);

  // Fetch all user audit metrics from the backend on mount
  useEffect(() => {
    const fetchUserData = async () => {
      setLoadingData(true);
      setSyncError('');
      try {
        const data = await apiFetch('/api/audit/data');
        
        // Populate state from API, fallback to default seed arrays if new account
        setLogs(data.logs?.length > 0 ? data.logs : []);
        setWheelSelf(data.wheelSelfAssessment?.health ? data.wheelSelfAssessment : INITIAL_WHEEL);
        setChecklistItems(data.checklistItems?.length > 0 ? data.checklistItems : INITIAL_HABITS);
      } catch (err: any) {
        console.error('Failed fetching user telemetry data', err);
        setSyncError(err.message || 'Connection error syncing logs.');
      } finally {
        setLoadingData(false);
      }
    };
    fetchUserData();
  }, []);

  const handleSaveLog = async (updatedLog: DailyLog) => {
    const newLogs = [...logs];
    const index = newLogs.findIndex((l) => l.date === updatedLog.date);
    if (index >= 0) {
      newLogs[index] = updatedLog;
    } else {
      newLogs.push(updatedLog);
    }
    newLogs.sort((a, b) => a.date.localeCompare(b.date));
    setLogs(newLogs);

    // Sync to database
    setSyncing(true);
    try {
      await apiFetch('/api/audit/logs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ logs: newLogs }),
      });
    } catch (err: any) {
      setSyncError('Logs failed to save to server.');
    } finally {
      setSyncing(false);
    }
  };

  const handleWheelChange = async (newWheel: WheelState) => {
    setWheelSelf(newWheel);

    // Sync to database
    setSyncing(true);
    try {
      await apiFetch('/api/audit/wheel', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ wheelSelfAssessment: newWheel }),
      });
    } catch (err: any) {
      setSyncError('Fulfillment wheel failed to save.');
    } finally {
      setSyncing(false);
    }
  };

  const handleUpdateChecklistItems = async (newItems: ChecklistItem[]) => {
    setChecklistItems(newItems);

    // Sync to database
    setSyncing(true);
    try {
      await apiFetch('/api/audit/habits', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ checklistItems: newItems }),
      });
    } catch (err: any) {
      setSyncError('Habit changes failed to save.');
    } finally {
      setSyncing(false);
    }
  };

  const handleResetData = async () => {
    if (window.confirm('Are you sure you want to reset all dashboard tracking data on the server?')) {
      setLogs([]);
      setWheelSelf(INITIAL_WHEEL);
      setChecklistItems(INITIAL_HABITS);

      setSyncing(true);
      try {
        await apiFetch('/api/audit/logs', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ logs: [] }),
        });
        await apiFetch('/api/audit/wheel', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ wheelSelfAssessment: INITIAL_WHEEL }),
        });
        await apiFetch('/api/audit/habits', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ checklistItems: INITIAL_HABITS }),
        });
      } catch (err: any) {
        setSyncError('Reset sync failed.');
      } finally {
        setSyncing(false);
      }
    }
  };

  const empiricalWheel = calculateEmpiricalWheel(logs);

  if (loadingData) {
    return (
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '100vh',
          background: 'var(--bg-primary)',
          gap: '1rem',
        }}
      >
        <div
          className="pulse"
          style={{
            width: '40px',
            height: '40px',
            borderRadius: '50%',
            background: 'var(--accent-purple)',
            boxShadow: '0 0 20px rgba(139, 92, 246, 0.4)',
          }}
        />
        <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
          Retrieving secure audit telemetry...
        </span>
      </div>
    );
  }

  return (
    <div className="dashboard-layout">
      {/* Sidebar Panel */}
      <aside className="sidebar">
        <div>
          <h2 style={{ fontSize: '1.25rem', letterSpacing: '-0.02em', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span style={{ color: 'var(--accent-purple)', fontWeight: 800 }}>⚡</span> Life Audit OS
          </h2>
          <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
            V1.2.0 • Secure JWT Edition
          </p>
        </div>

        <nav style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', flex: 1 }}>
          <div style={{ padding: '0.5rem', background: 'rgba(255,255,255,0.02)', borderRadius: '8px', fontSize: '0.85rem' }}>
            <strong style={{ color: 'var(--text-primary)' }}>Account Info:</strong>
            <p style={{ color: 'var(--text-secondary)', marginTop: '0.25rem', wordBreak: 'break-all', fontSize: '0.75rem' }}>
              👤 {user?.email}
            </p>
            {syncing && (
              <p style={{ color: 'var(--accent-blue)', marginTop: '0.5rem', fontSize: '0.75rem', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                <span className="pulse">●</span> Syncing with cloud...
              </p>
            )}
            {syncError && (
              <p style={{ color: 'var(--accent-rose)', marginTop: '0.5rem', fontSize: '0.75rem', fontWeight: 'bold' }}>
                ⚠️ {syncError}
              </p>
            )}
          </div>
        </nav>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          <button onClick={handleResetData} className="btn" style={{ fontSize: '0.8rem', padding: '0.5rem', justifyContent: 'center' }}>
            🔄 Reset server logs
          </button>
          <button
            onClick={logout}
            className="btn btn-primary"
            style={{
              fontSize: '0.8rem',
              padding: '0.5rem',
              justifyContent: 'center',
              background: 'rgba(244, 63, 94, 0.1)',
              color: 'var(--accent-rose)',
              border: '1px solid rgba(244, 63, 94, 0.2)',
            }}
          >
            🚪 Sign Out
          </button>
        </div>
      </aside>

      {/* Main Core Viewport */}
      <main className="main-content">
        <div className="header-container">
          <div>
            <h1 className="title-glow">Resource & Balance Audit</h1>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem' }}>
              Correlate time allocation, monetary spending, and focus levels.
            </p>
          </div>
          <ThemeToggle />
        </div>

        {/* Hero Grid Section: Draggable Wheel and Form Logs */}
        <div className="hero-grid">
          {/* Wheel of Life Interactive View */}
          <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <div style={{ width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <h2 style={{ fontSize: '1.25rem' }}>Fulfillment Wheel</h2>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                  Drag Purple nodes to self-assess. Green dash is empirical.
                </p>
              </div>
              <div style={{ display: 'flex', gap: '1rem', fontSize: '0.75rem', fontWeight: 600 }}>
                <span style={{ color: 'var(--accent-purple)', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                  ● Subjective
                </span>
                <span style={{ color: 'var(--accent-emerald)', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                  ◌ Log-Empirical
                </span>
              </div>
            </div>
            <WheelOfLife
              value={wheelSelf}
              onChange={handleWheelChange}
              empiricalValue={empiricalWheel}
            />
          </div>

          {/* Form input details */}
          <QuickLogger
            logs={logs}
            onSave={handleSaveLog}
            selectedDate={selectedDate}
            setSelectedDate={setSelectedDate}
            checklistItems={checklistItems}
            onUpdateChecklistItems={handleUpdateChecklistItems}
          />
        </div>

        {/* Detailed Analytics and Correlation Visuals */}
        <AnalyticsPanel logs={logs} />

        {/* Gemini API optional auditor section */}
        <AIAuditButton logs={logs} />
      </main>
    </div>
  );
};
export default Dashboard;

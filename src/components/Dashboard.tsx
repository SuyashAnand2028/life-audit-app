import React, { useState, useEffect } from 'react';
import type { DailyLog, WheelState } from '../types';
import { calculateEmpiricalWheel } from '../localAnalytics';
import WheelOfLife from './WheelOfLife';
import QuickLogger from './QuickLogger';
import AnalyticsPanel from './AnalyticsPanel';
import AIAuditButton from './AIAuditButton';
import ThemeToggle from './ThemeToggle';

// 5 Days of realistic seed data to make the initial experience rich and engaging
const INITIAL_LOGS: DailyLog[] = [
  {
    date: getPastDate(4),
    time: [
      { category: 'sleep', hours: 6.0 },
      { category: 'work', hours: 8.5 },
      { category: 'routine', hours: 1.5 },
      { category: 'leisure', hours: 4.0 },
      { category: 'distraction', hours: 4.0 },
    ],
    money: [
      { id: '1', category: 'needs', amount: 54.20, description: 'Groceries' },
      { id: '2', category: 'wants', amount: 35.00, description: 'Bar Dinner' },
      { id: '3', category: 'investments', amount: 20.00, description: 'Index Fund' },
    ],
    focus: 5,
    energy: 6,
    distractionFactor: 6,
    notes: 'Slept poorly. Heavy distraction drag in the afternoon browsing feeds.',
  },
  {
    date: getPastDate(3),
    time: [
      { category: 'sleep', hours: 7.5 },
      { category: 'work', hours: 7.0 },
      { category: 'routine', hours: 2.5 },
      { category: 'leisure', hours: 4.5 },
      { category: 'distraction', hours: 2.5 },
    ],
    money: [
      { id: '4', category: 'needs', amount: 120.00, description: 'Electric Bill' },
      { id: '5', category: 'wants', amount: 8.50, description: 'Fancy Coffee' },
      { id: '6', category: 'investments', amount: 150.00, description: 'Tech Stocks' },
    ],
    focus: 8,
    energy: 8,
    distractionFactor: 3,
    notes: 'Solid sleep, focus was sharp. Hit gym during routine hours.',
  },
  {
    date: getPastDate(2),
    time: [
      { category: 'sleep', hours: 5.0 },
      { category: 'work', hours: 9.0 },
      { category: 'routine', hours: 1.0 },
      { category: 'leisure', hours: 3.5 },
      { category: 'distraction', hours: 5.5 },
    ],
    money: [
      { id: '7', category: 'wants', amount: 99.00, description: 'Subscription Game' },
    ],
    focus: 4,
    energy: 4,
    distractionFactor: 8,
    notes: 'Extremely tired. Overworked to compensate but attention was completely scattered.',
  },
  {
    date: getPastDate(1),
    time: [
      { category: 'sleep', hours: 8.0 },
      { category: 'work', hours: 6.5 },
      { category: 'routine', hours: 3.0 },
      { category: 'leisure', hours: 5.0 },
      { category: 'distraction', hours: 1.5 },
    ],
    money: [
      { id: '8', category: 'needs', amount: 32.00, description: 'Weekly MetroCard' },
      { id: '9', category: 'wants', amount: 15.00, description: 'Movie ticket' },
      { id: '10', category: 'investments', amount: 200.00, description: 'Crypto allocation' },
    ],
    focus: 9,
    energy: 9,
    distractionFactor: 2,
    notes: 'Recovery day. Highly efficient working blocks, minimized mindless scrolling.',
  },
  {
    date: getPastDate(0),
    time: [
      { category: 'sleep', hours: 7.5 },
      { category: 'work', hours: 7.5 },
      { category: 'routine', hours: 2.0 },
      { category: 'leisure', hours: 4.5 },
      { category: 'distraction', hours: 2.5 },
    ],
    money: [
      { id: '11', category: 'needs', amount: 45.00, description: 'Fuel replenishment' },
      { id: '12', category: 'investments', amount: 50.00, description: 'ETF Deposit' },
    ],
    focus: 7,
    energy: 7,
    distractionFactor: 4,
    notes: 'Stable focus. Kept a healthy balance between leisure and work tasks.',
  },
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
  const [logs, setLogs] = useState<DailyLog[]>([]);
  const [wheelSelf, setWheelSelf] = useState<WheelState>(INITIAL_WHEEL);
  const [selectedDate, setSelectedDate] = useState(() => getPastDate(0));

  // Sync state with localStorage
  useEffect(() => {
    const savedLogs = localStorage.getItem('life_audit_logs');
    const savedWheel = localStorage.getItem('life_audit_wheel');

    if (savedLogs) {
      setLogs(JSON.parse(savedLogs));
    } else {
      setLogs(INITIAL_LOGS);
      localStorage.setItem('life_audit_logs', JSON.stringify(INITIAL_LOGS));
    }

    if (savedWheel) {
      setWheelSelf(JSON.parse(savedWheel));
    } else {
      setWheelSelf(INITIAL_WHEEL);
      localStorage.setItem('life_audit_wheel', JSON.stringify(INITIAL_WHEEL));
    }
  }, []);

  const handleSaveLog = (updatedLog: DailyLog) => {
    const newLogs = [...logs];
    const index = newLogs.findIndex((l) => l.date === updatedLog.date);
    if (index >= 0) {
      newLogs[index] = updatedLog;
    } else {
      newLogs.push(updatedLog);
    }
    // Sort chronological
    newLogs.sort((a, b) => a.date.localeCompare(b.date));
    setLogs(newLogs);
    localStorage.setItem('life_audit_logs', JSON.stringify(newLogs));
  };

  const handleWheelChange = (newWheel: WheelState) => {
    setWheelSelf(newWheel);
    localStorage.setItem('life_audit_wheel', JSON.stringify(newWheel));
  };

  const handleResetData = () => {
    if (window.confirm('Are you sure you want to reset all tracking logs to seed default data?')) {
      setLogs(INITIAL_LOGS);
      setWheelSelf(INITIAL_WHEEL);
      localStorage.setItem('life_audit_logs', JSON.stringify(INITIAL_LOGS));
      localStorage.setItem('life_audit_wheel', JSON.stringify(INITIAL_WHEEL));
    }
  };

  const empiricalWheel = calculateEmpiricalWheel(logs);

  return (
    <div className="dashboard-layout">
      {/* Sidebar Panel */}
      <aside className="sidebar">
        <div>
          <h2 style={{ fontSize: '1.25rem', letterSpacing: '-0.02em', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span style={{ color: 'var(--accent-purple)', fontWeight: 800 }}>⚡</span> Life Audit OS
          </h2>
          <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
            V1.0.0 • Offline Dashboard
          </p>
        </div>

        <nav style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', flex: 1 }}>
          <div style={{ padding: '0.5rem', background: 'rgba(255,255,255,0.02)', borderRadius: '8px', fontSize: '0.85rem' }}>
            <strong style={{ color: 'var(--text-primary)' }}>Instructions:</strong>
            <ol style={{ paddingLeft: '1.25rem', marginTop: '0.25rem', display: 'flex', flexDirection: 'column', gap: '0.25rem', color: 'var(--text-secondary)' }}>
              <li>Log time/money/focus on the right panels daily.</li>
              <li>Drag the knobs on the **Wheel of Life** to map your subjective fulfillment.</li>
              <li>Compare your subjective state (purple fill) against actual empirical logs (green dashed path).</li>
            </ol>
          </div>
        </nav>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          <button onClick={handleResetData} className="btn" style={{ fontSize: '0.8rem', padding: '0.5rem', justifyContent: 'center' }}>
            🔄 Reset default data
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

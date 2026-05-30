import React, { useState, useEffect } from 'react';
import type { DailyLog, WheelState, ChecklistItem } from '../types';
import { calculateEmpiricalWheel } from '../localAnalytics';
import WheelOfLife from './WheelOfLife';
import QuickLogger from './QuickLogger';
import AnalyticsPanel from './AnalyticsPanel';
import AIAuditButton from './AIAuditButton';
import ThemeToggle from './ThemeToggle';

// 8 Default habits preloaded
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

// Seed logs with daily checklist entries demonstrating positive correlation to focus scores
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
    checklist: [
      { itemId: 'h1', completed: true },
      { itemId: 'h2', completed: false },
      { itemId: 'h3', completed: true },
      { itemId: 'h4', completed: false },
      { itemId: 'h5', completed: true },
      { itemId: 'h6', completed: false },
      { itemId: 'h7', completed: false },
      { itemId: 'h8', completed: false },
    ],
    notes: 'Slept poorly. Heavy distraction drag. Only finished workout, water, and stretching.',
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
    checklist: [
      { itemId: 'h1', completed: true },
      { itemId: 'h2', completed: true },
      { itemId: 'h3', completed: true },
      { itemId: 'h4', completed: false },
      { itemId: 'h5', completed: true },
      { itemId: 'h6', completed: true },
      { itemId: 'h7', completed: false },
      { itemId: 'h8', completed: true },
    ],
    notes: 'Solid sleep, focus was sharp. Hit gym and journaled. 6/8 habits done.',
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
    checklist: [
      { itemId: 'h1', completed: false },
      { itemId: 'h2', completed: false },
      { itemId: 'h3', completed: true },
      { itemId: 'h4', completed: false },
      { itemId: 'h5', completed: false },
      { itemId: 'h6', completed: false },
      { itemId: 'h7', completed: true },
      { itemId: 'h8', completed: false },
    ],
    notes: 'Extremely tired. Overworked, skipped most habits. Heavy sugar intake.',
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
    checklist: [
      { itemId: 'h1', completed: true },
      { itemId: 'h2', completed: true },
      { itemId: 'h3', completed: true },
      { itemId: 'h4', completed: false },
      { itemId: 'h5', completed: true },
      { itemId: 'h6', completed: true },
      { itemId: 'h7', completed: true },
      { itemId: 'h8', completed: true },
    ],
    notes: 'Recovery day. Highly efficient working blocks, completed 7/8 habits. High clarity.',
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
    checklist: [
      { itemId: 'h1', completed: true },
      { itemId: 'h2', completed: true },
      { itemId: 'h3', completed: true },
      { itemId: 'h4', completed: false },
      { itemId: 'h5', completed: true },
      { itemId: 'h6', completed: false },
      { itemId: 'h7', completed: false },
      { itemId: 'h8', completed: true },
    ],
    notes: 'Balanced day. Kept habits steady, sleep was restorative.',
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
  const [checklistItems, setChecklistItems] = useState<ChecklistItem[]>([]);
  const [selectedDate, setSelectedDate] = useState(() => getPastDate(0));

  // Sync state with localStorage
  useEffect(() => {
    const savedLogs = localStorage.getItem('life_audit_logs');
    const savedWheel = localStorage.getItem('life_audit_wheel');
    const savedChecklist = localStorage.getItem('life_audit_checklist_items');

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

    if (savedChecklist) {
      setChecklistItems(JSON.parse(savedChecklist));
    } else {
      setChecklistItems(INITIAL_HABITS);
      localStorage.setItem('life_audit_checklist_items', JSON.stringify(INITIAL_HABITS));
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
    newLogs.sort((a, b) => a.date.localeCompare(b.date));
    setLogs(newLogs);
    localStorage.setItem('life_audit_logs', JSON.stringify(newLogs));
  };

  const handleWheelChange = (newWheel: WheelState) => {
    setWheelSelf(newWheel);
    localStorage.setItem('life_audit_wheel', JSON.stringify(newWheel));
  };

  const handleUpdateChecklistItems = (newItems: ChecklistItem[]) => {
    setChecklistItems(newItems);
    localStorage.setItem('life_audit_checklist_items', JSON.stringify(newItems));
  };

  const handleResetData = () => {
    if (window.confirm('Are you sure you want to reset all tracking logs and habits to seed default data?')) {
      setLogs(INITIAL_LOGS);
      setWheelSelf(INITIAL_WHEEL);
      setChecklistItems(INITIAL_HABITS);
      localStorage.setItem('life_audit_logs', JSON.stringify(INITIAL_LOGS));
      localStorage.setItem('life_audit_wheel', JSON.stringify(INITIAL_WHEEL));
      localStorage.setItem('life_audit_checklist_items', JSON.stringify(INITIAL_HABITS));
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
            V1.1.0 • Habit Checklist Edition
          </p>
        </div>

        <nav style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', flex: 1 }}>
          <div style={{ padding: '0.5rem', background: 'rgba(255,255,255,0.02)', borderRadius: '8px', fontSize: '0.85rem' }}>
            <strong style={{ color: 'var(--text-primary)' }}>Instructions:</strong>
            <ol style={{ paddingLeft: '1.25rem', marginTop: '0.25rem', display: 'flex', flexDirection: 'column', gap: '0.25rem', color: 'var(--text-secondary)' }}>
              <li>Tick daily habits on the **Checklist** tab in the logger.</li>
              <li>Add or edit habits inline to build your custom schedule.</li>
              <li>Observe how habit consistency scores correlate with your Focus scores in the charts below.</li>
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

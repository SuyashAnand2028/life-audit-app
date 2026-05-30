import React, { useState, useEffect } from 'react';
import type { DailyLog, MoneyEntry, TimeCategory, MoneyCategory, TimeEntry, ChecklistItem, DailyChecklistEntry } from '../types';

interface QuickLoggerProps {
  logs: DailyLog[];
  onSave: (log: DailyLog) => void;
  selectedDate: string;
  setSelectedDate: (date: string) => void;
  checklistItems: ChecklistItem[];
  onUpdateChecklistItems: (items: ChecklistItem[]) => void;
}

export const QuickLogger: React.FC<QuickLoggerProps> = ({
  logs,
  onSave,
  selectedDate,
  setSelectedDate,
  checklistItems,
  onUpdateChecklistItems,
}) => {
  const [activeTab, setActiveTab] = useState<'time' | 'money' | 'attention' | 'checklist'>('time');

  // Sliders for Time Allocations
  const [sleep, setSleep] = useState(7.5);
  const [work, setWork] = useState(8);
  const [routine, setRoutine] = useState(2);
  const [leisure, setLeisure] = useState(3.5);
  const [distraction, setDistraction] = useState(3);

  // Money Entries for the Day
  const [moneyEntries, setMoneyEntries] = useState<MoneyEntry[]>([]);
  const [newAmount, setNewAmount] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [newCat, setNewCat] = useState<MoneyCategory>('needs');

  // Attention Metrics
  const [focus, setFocus] = useState(7);
  const [energy, setEnergy] = useState(7);
  const [distractionFactor, setDistractionFactor] = useState(4);
  const [notes, setNotes] = useState('');

  // Daily Checklist Completion
  const [dailyChecklist, setDailyChecklist] = useState<DailyChecklistEntry[]>([]);

  // Master Habit Manager UI states
  const [showHabitManager, setShowHabitManager] = useState(false);
  const [newHabitLabel, setNewHabitLabel] = useState('');
  const [editingHabitId, setEditingHabitId] = useState<string | null>(null);
  const [editingLabel, setEditingLabel] = useState('');

  // Load checklist and details on selectedDate or checklistItems change
  useEffect(() => {
    const existingLog = logs.find((l) => l.date === selectedDate);

    const logChecklist = existingLog?.checklist || [];
    const logChecklistMap = new Map(logChecklist.map((c) => [c.itemId, c.completed]));

    // We want the daily checklist to show:
    // - Any master habit that is currently active (active: true)
    // - PLUS any habit that was already completed/recorded in this day's log
    const mergedChecklist = checklistItems
      .filter((item) => item.active || logChecklistMap.has(item.id))
      .map((item) => ({
        itemId: item.id,
        completed: logChecklistMap.get(item.id) || false,
      }));

    if (existingLog) {
      // Load Time
      const getHours = (cat: TimeCategory) => existingLog.time.find((t) => t.category === cat)?.hours ?? 0;
      setSleep(getHours('sleep'));
      setWork(getHours('work'));
      setRoutine(getHours('routine'));
      setLeisure(getHours('leisure'));
      setDistraction(getHours('distraction'));

      // Load Money & Attention
      setMoneyEntries(existingLog.money);
      setFocus(existingLog.focus);
      setEnergy(existingLog.energy);
      setDistractionFactor(existingLog.distractionFactor);
      setNotes(existingLog.notes);
    } else {
      // Reset to defaults
      setSleep(7.5);
      setWork(8);
      setRoutine(2);
      setLeisure(3.5);
      setDistraction(3);
      setMoneyEntries([]);
      setFocus(7);
      setEnergy(7);
      setDistractionFactor(4);
      setNotes('');
    }

    setDailyChecklist(mergedChecklist);
  }, [selectedDate, logs, checklistItems]);

  const totalTimeHours = sleep + work + routine + leisure + distraction;

  const handleAddExpense = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAmount || isNaN(Number(newAmount))) return;

    const newEntry: MoneyEntry = {
      id: crypto.randomUUID(),
      category: newCat,
      amount: parseFloat(newAmount),
      description: newDesc.trim() || 'Expense',
    };

    setMoneyEntries([...moneyEntries, newEntry]);
    setNewAmount('');
    setNewDesc('');
  };

  const handleRemoveExpense = (id: string) => {
    setMoneyEntries(moneyEntries.filter((m) => m.id !== id));
  };

  const handleToggleChecklist = (itemId: string) => {
    setDailyChecklist(
      dailyChecklist.map((c) =>
        c.itemId === itemId ? { ...c, completed: !c.completed } : c
      )
    );
  };

  // Master Habit Editor Handlers
  const handleCreateHabit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newHabitLabel.trim()) return;

    const newHabit: ChecklistItem = {
      id: crypto.randomUUID(),
      label: newHabitLabel.trim(),
      active: true,
    };

    onUpdateChecklistItems([...checklistItems, newHabit]);
    setNewHabitLabel('');
  };

  const handleToggleHabitActive = (id: string) => {
    onUpdateChecklistItems(
      checklistItems.map((item) =>
        item.id === id ? { ...item, active: !item.active } : item
      )
    );
  };

  const handleStartEditing = (id: string, label: string) => {
    setEditingHabitId(id);
    setEditingLabel(label);
  };

  const handleSaveRename = (id: string) => {
    if (!editingLabel.trim()) return;
    onUpdateChecklistItems(
      checklistItems.map((item) =>
        item.id === id ? { ...item, label: editingLabel.trim() } : item
      )
    );
    setEditingHabitId(null);
  };

  const handleSave = () => {
    const timeEntries: TimeEntry[] = [
      { category: 'sleep', hours: sleep },
      { category: 'work', hours: work },
      { category: 'routine', hours: routine },
      { category: 'leisure', hours: leisure },
      { category: 'distraction', hours: distraction },
    ];

    const finalLog: DailyLog = {
      date: selectedDate,
      time: timeEntries,
      money: moneyEntries,
      focus,
      energy,
      distractionFactor,
      checklist: dailyChecklist,
      notes: notes.trim(),
    };

    onSave(finalLog);
  };

  return (
    <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h2 style={{ fontSize: '1.25rem' }}>Daily Resource Log</h2>
        <input
          type="date"
          className="form-input"
          value={selectedDate}
          onChange={(e) => setSelectedDate(e.target.value)}
          style={{ width: 'auto', padding: '0.4rem 0.6rem' }}
        />
      </div>

      <div className="tab-headers">
        <button
          onClick={() => setActiveTab('time')}
          className={`tab-btn ${activeTab === 'time' ? 'active' : ''}`}
        >
          Time
        </button>
        <button
          onClick={() => setActiveTab('money')}
          className={`tab-btn ${activeTab === 'money' ? 'active' : ''}`}
        >
          Money
        </button>
        <button
          onClick={() => setActiveTab('attention')}
          className={`tab-btn ${activeTab === 'attention' ? 'active' : ''}`}
        >
          Attention
        </button>
        <button
          onClick={() => setActiveTab('checklist')}
          className={`tab-btn ${activeTab === 'checklist' ? 'active' : ''}`}
        >
          Checklist
        </button>
      </div>

      <div style={{ minHeight: '260px' }}>
        {/* TIME AUDIT TAB */}
        {activeTab === 'time' && (
          <div>
            <div className="slider-container">
              <div className="slider-header">
                <span className="form-label">Sleep (Rest & Recovery)</span>
                <span className="slider-val">{sleep}h</span>
              </div>
              <input
                type="range"
                min="0"
                max="16"
                step="0.5"
                value={sleep}
                onChange={(e) => setSleep(parseFloat(e.target.value))}
                className="slider-input"
              />
            </div>

            <div className="slider-container">
              <div className="slider-header">
                <span className="form-label">Work & Studies (Leverage)</span>
                <span className="slider-val">{work}h</span>
              </div>
              <input
                type="range"
                min="0"
                max="16"
                step="0.5"
                value={work}
                onChange={(e) => setWork(parseFloat(e.target.value))}
                className="slider-input"
              />
            </div>

            <div className="slider-container">
              <div className="slider-header">
                <span className="form-label">Routine (Fitness, Cooking, Chores)</span>
                <span className="slider-val">{routine}h</span>
              </div>
              <input
                type="range"
                min="0"
                max="16"
                step="0.5"
                value={routine}
                onChange={(e) => setRoutine(parseFloat(e.target.value))}
                className="slider-input"
              />
            </div>

            <div className="slider-container">
              <div className="slider-header">
                <span className="form-label">Active Leisure (Social, Hobbies)</span>
                <span className="slider-val">{leisure}h</span>
              </div>
              <input
                type="range"
                min="0"
                max="16"
                step="0.5"
                value={leisure}
                onChange={(e) => setLeisure(parseFloat(e.target.value))}
                className="slider-input"
              />
            </div>

            <div className="slider-container">
              <div className="slider-header">
                <span className="form-label">Passive Distraction (Social Feed, TV)</span>
                <span className="slider-val">{distraction}h</span>
              </div>
              <input
                type="range"
                min="0"
                max="16"
                step="0.5"
                value={distraction}
                onChange={(e) => setDistraction(parseFloat(e.target.value))}
                className="slider-input"
              />
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '1rem', fontSize: '0.85rem' }}>
              <span style={{ color: varTotalColor(totalTimeHours) }}>
                Total Allocated: {totalTimeHours}h / 24h
              </span>
              {totalTimeHours > 24 && (
                <span style={{ color: 'var(--accent-rose)', fontWeight: 'bold' }}>
                  ⚠️ Hours exceed 24!
                </span>
              )}
            </div>
          </div>
        )}

        {/* MONEY AUDIT TAB */}
        {activeTab === 'money' && (
          <div>
            <form onSubmit={handleAddExpense} style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem' }}>
              <input
                type="number"
                placeholder="Amount"
                className="form-input"
                value={newAmount}
                onChange={(e) => setNewAmount(e.target.value)}
                style={{ flex: 1 }}
                required
              />
              <input
                type="text"
                placeholder="Description"
                className="form-input"
                value={newDesc}
                onChange={(e) => setNewDesc(e.target.value)}
                style={{ flex: 2 }}
              />
              <select
                className="form-input"
                value={newCat}
                onChange={(e) => setNewCat(e.target.value as MoneyCategory)}
                style={{ flex: 1.5, background: 'var(--bg-primary)' }}
              >
                <option value="needs">Need</option>
                <option value="wants">Want</option>
                <option value="investments">Investment</option>
              </select>
              <button type="submit" className="btn btn-primary" style={{ padding: '0.5rem 1rem' }}>
                + Add
              </button>
            </form>

            <div style={{ maxHeight: '180px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {moneyEntries.length === 0 ? (
                <div style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '2rem 0' }}>
                  No transactions recorded today.
                </div>
              ) : (
                moneyEntries.map((m) => (
                  <div key={m.id} className="log-item" style={{ fontSize: '0.9rem' }}>
                    <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                      <span
                        style={{
                          fontSize: '0.7rem',
                          textTransform: 'uppercase',
                          fontWeight: 'bold',
                          padding: '0.15rem 0.35rem',
                          borderRadius: '4px',
                          background: m.category === 'needs' ? 'rgba(59, 130, 246, 0.1)' : m.category === 'wants' ? 'rgba(244, 63, 94, 0.1)' : 'rgba(16, 185, 129, 0.1)',
                          color: m.category === 'needs' ? 'var(--accent-blue)' : m.category === 'wants' ? 'var(--accent-rose)' : 'var(--accent-emerald)',
                        }}
                      >
                        {m.category}
                      </span>
                      <span>{m.description}</span>
                    </div>
                    <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                      <span style={{ fontWeight: 'bold' }}>${m.amount.toFixed(2)}</span>
                      <button
                        onClick={() => handleRemoveExpense(m.id)}
                        style={{ background: 'none', border: 'none', color: 'var(--accent-rose)', cursor: 'pointer', fontSize: '1rem' }}
                      >
                        &times;
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* ATTENTION AUDIT TAB */}
        {activeTab === 'attention' && (
          <div>
            <div className="slider-container">
              <div className="slider-header">
                <span className="form-label">Focus Score (Clarity & Flow)</span>
                <span className="slider-val">{focus}/10</span>
              </div>
              <input
                type="range"
                min="1"
                max="10"
                step="1"
                value={focus}
                onChange={(e) => setFocus(parseInt(e.target.value))}
                className="slider-input"
              />
            </div>

            <div className="slider-container">
              <div className="slider-header">
                <span className="form-label">Energy Level (Physical/Mental Drive)</span>
                <span className="slider-val">{energy}/10</span>
              </div>
              <input
                type="range"
                min="1"
                max="10"
                step="1"
                value={energy}
                onChange={(e) => setEnergy(parseInt(e.target.value))}
                className="slider-input"
              />
            </div>

            <div className="slider-container">
              <div className="slider-header">
                <span className="form-label">Distraction Drag (How pulled away you felt)</span>
                <span className="slider-val">{distractionFactor}/10</span>
              </div>
              <input
                type="range"
                min="1"
                max="10"
                step="1"
                value={distractionFactor}
                onChange={(e) => setDistractionFactor(parseInt(e.target.value))}
                className="slider-input"
              />
            </div>

            <div className="form-group">
              <span className="form-label">Daily Reflection Notes</span>
              <textarea
                className="form-input"
                rows={3}
                placeholder="What triggered distractions today? What went exceptionally well?"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                style={{ resize: 'none' }}
              />
            </div>
          </div>
        )}

        {/* CHECKLIST TAB */}
        {activeTab === 'checklist' && (
          <div>
            {!showHabitManager ? (
              <div>
                <div style={{ maxHeight: '200px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '0.5rem', marginBottom: '1rem' }}>
                  {dailyChecklist.length === 0 ? (
                    <div style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '2rem 0', fontSize: '0.9rem' }}>
                      No active habits defined. Click "Edit Habits" below to setup your list.
                    </div>
                  ) : (
                    dailyChecklist.map((item) => {
                      const master = checklistItems.find((m) => m.id === item.itemId);
                      if (!master) return null;
                      return (
                        <label
                          key={item.itemId}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.75rem',
                            padding: '0.5rem',
                            background: 'rgba(255,255,255,0.02)',
                            borderRadius: '6px',
                            cursor: 'pointer',
                            fontSize: '0.9rem',
                            textDecoration: item.completed ? 'line-through' : 'none',
                            color: item.completed ? 'var(--text-muted)' : 'var(--text-primary)',
                          }}
                        >
                          <input
                            type="checkbox"
                            checked={item.completed}
                            onChange={() => handleToggleChecklist(item.itemId)}
                            style={{
                              width: '18px',
                              height: '18px',
                              accentColor: 'var(--accent-purple)',
                              cursor: 'pointer',
                            }}
                          />
                          <span>{master.label}</span>
                        </label>
                      );
                    })
                  )}
                </div>

                <button
                  onClick={() => setShowHabitManager(true)}
                  className="btn"
                  style={{ width: '100%', fontSize: '0.8rem', padding: '0.5rem', justifyContent: 'center' }}
                >
                  ⚙️ Edit Checklist Habits
                </button>
              </div>
            ) : (
              <div>
                {/* Habit Manager UI */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                  <h4 style={{ fontSize: '0.9rem', color: 'var(--text-primary)' }}>Manage Master Checklist</h4>
                  <button
                    onClick={() => setShowHabitManager(false)}
                    style={{ background: 'none', border: 'none', color: 'var(--accent-blue)', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 'bold' }}
                  >
                    Done
                  </button>
                </div>

                <form onSubmit={handleCreateHabit} style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.75rem' }}>
                  <input
                    type="text"
                    placeholder="New habit label..."
                    className="form-input"
                    value={newHabitLabel}
                    onChange={(e) => setNewHabitLabel(e.target.value)}
                    style={{ padding: '0.4rem', fontSize: '0.85rem' }}
                  />
                  <button type="submit" className="btn btn-primary" style={{ padding: '0.4rem 0.8rem', fontSize: '0.85rem' }}>
                    Add
                  </button>
                </form>

                <div style={{ maxHeight: '140px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                  {checklistItems.map((item) => (
                    <div
                      key={item.id}
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        padding: '0.4rem 0.5rem',
                        background: 'rgba(0,0,0,0.1)',
                        borderRadius: '4px',
                        fontSize: '0.8rem',
                      }}
                    >
                      {editingHabitId === item.id ? (
                        <div style={{ display: 'flex', gap: '0.25rem', width: '100%' }}>
                          <input
                            type="text"
                            value={editingLabel}
                            onChange={(e) => setEditingLabel(e.target.value)}
                            className="form-input"
                            style={{ padding: '0.2rem', fontSize: '0.75rem' }}
                          />
                          <button
                            onClick={() => handleSaveRename(item.id)}
                            style={{ padding: '0.2rem 0.4rem', background: 'var(--accent-emerald)', border: 'none', borderRadius: '4px', color: '#fff', cursor: 'pointer' }}
                          >
                            Save
                          </button>
                          <button
                            onClick={() => setEditingHabitId(null)}
                            style={{ padding: '0.2rem 0.4rem', background: 'var(--bg-tertiary)', border: 'none', borderRadius: '4px', color: 'var(--text-secondary)', cursor: 'pointer' }}
                          >
                            X
                          </button>
                        </div>
                      ) : (
                        <>
                          <span style={{ color: item.active ? 'var(--text-primary)' : 'var(--text-muted)' }}>
                            {item.label} {!item.active && '(Archived)'}
                          </span>
                          <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                            <button
                              onClick={() => handleStartEditing(item.id, item.label)}
                              style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', fontSize: '0.75rem' }}
                              title="Rename"
                            >
                              ✏️
                            </button>
                            <button
                              onClick={() => handleToggleHabitActive(item.id)}
                              style={{
                                background: 'none',
                                border: 'none',
                                color: item.active ? 'var(--accent-rose)' : 'var(--accent-emerald)',
                                cursor: 'pointer',
                                fontSize: '0.75rem',
                              }}
                              title={item.active ? 'Archive' : 'Restore'}
                            >
                              {item.active ? 'Archive' : 'Restore'}
                            </button>
                          </div>
                        </>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      <button onClick={handleSave} className="btn btn-primary" style={{ width: '100%', justifyContent: 'center' }}>
        Save Entry for {selectedDate}
      </button>
    </div>
  );
};

function varTotalColor(hours: number): string {
  if (hours > 24) return 'var(--accent-rose)';
  if (hours === 24) return 'var(--accent-emerald)';
  return 'var(--text-secondary)';
}
export default QuickLogger;

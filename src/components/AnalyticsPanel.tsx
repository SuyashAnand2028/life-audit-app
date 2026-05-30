import React from 'react';
import type { DailyLog } from '../types';
import { calculateAverages, generateInsights, calculateCorrelation } from '../localAnalytics';

interface AnalyticsPanelProps {
  logs: DailyLog[];
}

export const AnalyticsPanel: React.FC<AnalyticsPanelProps> = ({ logs }) => {
  const avgs = calculateAverages(logs);
  const insights = generateInsights(logs);

  // Calculate Pearson Correlations
  const sleepHours = logs.map((l) => l.time.find((t) => t.category === 'sleep')?.hours || 0);
  const workHours = logs.map((l) => l.time.find((t) => t.category === 'work')?.hours || 0);
  const distractionHours = logs.map((l) => l.time.find((t) => t.category === 'distraction')?.hours || 0);
  const focusScores = logs.map((l) => l.focus);
  const energyScores = logs.map((l) => l.energy);

  const sleepFocusCorr = calculateCorrelation(sleepHours, focusScores);
  const distFocusCorr = calculateCorrelation(distractionHours, focusScores);
  const workEnergyCorr = calculateCorrelation(workHours, energyScores);

  // Distraction Cost Logic
  const hourlyRateValuation = 25; // default valuation per hour
  const distractionTimeWeekly = avgs.avgDistraction * 7;
  const lostEarningPotentialWeekly = distractionTimeWeekly * hourlyRateValuation;

  const renderCorrelationSlider = (label: string, value: number, description: string) => {
    // value goes from -1 to 1. Map to percentage (0% to 100%)
    const pct = ((value + 1) / 2) * 100;
    let color = 'var(--text-muted)';
    if (value > 0.3) color = 'var(--accent-emerald)';
    else if (value < -0.3) color = 'var(--accent-rose)';

    return (
      <div style={{ marginBottom: '1.25rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.25rem' }}>
          <span>{label}</span>
          <span style={{ color, fontWeight: 'bold' }}>{value > 0 ? '+' : ''}{value.toFixed(2)}</span>
        </div>
        <div style={{ width: '100%', height: '8px', background: 'var(--bg-primary)', borderRadius: '4px', position: 'relative' }}>
          <div
            style={{
              position: 'absolute',
              top: '-3px',
              left: `calc(${pct}% - 7px)`,
              width: '14px',
              height: '14px',
              borderRadius: '50%',
              background: color,
              border: '2px solid var(--text-primary)',
              transition: 'left 0.3s ease',
            }}
          />
          {/* Neutral center marker */}
          <div style={{ position: 'absolute', left: '50%', width: '1px', height: '8px', background: 'var(--glass-border)' }} />
        </div>
        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
          {description}
        </div>
      </div>
    );
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* Top Level Quick Metrics */}
      <div className="grid-cols-3">
        <div className="glass-card stat-box">
          <span className="stat-label">Daily Focus (Avg)</span>
          <span className="stat-val">{avgs.avgFocus.toFixed(1)}/10</span>
        </div>
        <div className="glass-card stat-box">
          <span className="stat-label">Weekly Distraction</span>
          <span className="stat-val" style={{ color: avgs.avgDistraction > 3 ? 'var(--accent-rose)' : 'var(--text-primary)' }}>
            {distractionTimeWeekly.toFixed(1)}h
          </span>
        </div>
        <div className="glass-card stat-box">
          <span className="stat-label">Savings Rate</span>
          <span className="stat-val" style={{ color: avgs.savingsRate >= 20 ? 'var(--accent-emerald)' : 'var(--accent-amber)' }}>
            {avgs.savingsRate.toFixed(0)}%
          </span>
        </div>
      </div>

      <div className="grid-cols-2">
        {/* Pearson Correlation Matrices */}
        <div className="glass-card">
          <h3 style={{ fontSize: '1.1rem', marginBottom: '1.25rem' }}>Resource Correlations</h3>
          {logs.length < 3 ? (
            <div style={{ textAlign: 'center', padding: '3rem 1rem', color: 'var(--text-muted)', fontSize: '0.9rem' }}>
              Correlation graphs require at least 3 days of tracked data to map trends.
            </div>
          ) : (
            <div>
              {renderCorrelationSlider(
                'Sleep ➔ Focus',
                sleepFocusCorr,
                'Measures if longer sleep translates to sharper clarity during work.'
              )}
              {renderCorrelationSlider(
                'Distraction ➔ Focus',
                distFocusCorr,
                'Measures the direct drag that distraction has on your attention span.'
              )}
              {renderCorrelationSlider(
                'Work Hours ➔ Energy',
                workEnergyCorr,
                'Measures if long work blocks deplete your general energy reserves.'
              )}
            </div>
          )}
        </div>

        {/* Cost of Distraction & Aggregates */}
        <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
          <div>
            <h3 style={{ fontSize: '1.1rem', marginBottom: '0.75rem' }}>Opportunity Cost Audit</h3>
            <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>
              Attention wasted on passive social feeds directly impacts your capital earning potential.
            </p>
          </div>
          <div>
            <div style={{ borderLeft: '3px solid var(--accent-rose)', paddingLeft: '0.75rem', marginBottom: '1rem' }}>
              <div style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--text-muted)' }}>
                Earning Leakage / Week
              </div>
              <div style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--accent-rose)' }}>
                ${lostEarningPotentialWeekly.toFixed(0)}
              </div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                Valued at ${hourlyRateValuation}/hour of distraction time
              </div>
            </div>

            <div style={{ borderLeft: '3px solid var(--accent-blue)', paddingLeft: '0.75rem' }}>
              <div style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--text-muted)' }}>
                Alternative Capital Growth
              </div>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>
                If redirected to **Investments**, this leakage could grow to{' '}
                <strong style={{ color: 'var(--accent-blue)' }}>
                  ${(lostEarningPotentialWeekly * 52 * 1.08).toFixed(0)}
                </strong>{' '}
                annually (assuming 8% return).
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Insights Engine Output */}
      <div className="glass-card">
        <h3 style={{ fontSize: '1.1rem', marginBottom: '1rem' }}>Local Audit Insights</h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {insights.map((insight, idx) => (
            <div
              key={idx}
              className={`insight-card insight-${insight.type}`}
              style={{ padding: '0.75rem 1rem', background: 'rgba(255, 255, 255, 0.01)', borderRadius: '4px' }}
            >
              <h4 style={{ fontSize: '0.95rem', fontWeight: 700, marginBottom: '0.25rem' }}>
                {insight.title}
              </h4>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: '1.4' }}>
                {insight.message}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
export default AnalyticsPanel;

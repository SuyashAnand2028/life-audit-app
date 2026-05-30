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
  
  const checklistRates = logs.map((l) => {
    const total = l.checklist?.length || 0;
    const completed = l.checklist?.filter((c) => c.completed).length || 0;
    return total > 0 ? (completed / total) * 100 : 0;
  });

  const focusScores = logs.map((l) => l.focus);
  const energyScores = logs.map((l) => l.energy);

  const sleepFocusCorr = calculateCorrelation(sleepHours, focusScores);
  const distFocusCorr = calculateCorrelation(distractionHours, focusScores);
  const workEnergyCorr = calculateCorrelation(workHours, energyScores);
  const checklistFocusCorr = calculateCorrelation(checklistRates, focusScores);

  // Distraction Cost Logic
  const hourlyRateValuation = 25; // default valuation per hour
  const distractionTimeWeekly = avgs.avgDistraction * 7;
  const lostEarningPotentialWeekly = distractionTimeWeekly * hourlyRateValuation;

  // SVG Chart Dimensions for Consistency Trend
  const last7 = logs.slice(-7);
  const chartW = 500;
  const chartH = 130;
  const paddingL = 35;
  const paddingB = 25;
  const paddingT = 15;

  const chartPoints = last7.map((log, index) => {
    const total = log.checklist?.length || 0;
    const completed = log.checklist?.filter((c) => c.completed).length || 0;
    const rate = total > 0 ? (completed / total) * 100 : 0;

    const x = paddingL + (index / Math.max(1, last7.length - 1)) * (chartW - paddingL - 15);
    const y = chartH - paddingB - (rate / 100) * (chartH - paddingB - paddingT);
    return { x, y, rate, date: log.date.substring(5) }; // MM-DD
  });

  const linePath = chartPoints.length > 0
    ? `M ${chartPoints.map((p) => `${p.x},${p.y}`).join(' L ')}`
    : '';

  const areaPath = chartPoints.length > 0
    ? `M ${chartPoints[0].x},${chartH - paddingB} L ${chartPoints.map((p) => `${p.x},${p.y}`).join(' L ')} L ${chartPoints[chartPoints.length - 1].x},${chartH - paddingB} Z`
    : '';

  const renderCorrelationSlider = (label: string, value: number, description: string) => {
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
          <span className="stat-label">Habit Consistency (Avg)</span>
          <span className="stat-val" style={{ color: avgs.avgChecklistCompletion >= 70 ? 'var(--accent-purple)' : 'var(--text-primary)' }}>
            {avgs.avgChecklistCompletion.toFixed(0)}%
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
                'Checklist ➔ Focus',
                checklistFocusCorr,
                'Measures if high habit completion boosts focus levels.'
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

        {/* Habit Checklist Consistency Chart */}
        <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          <div>
            <h3 style={{ fontSize: '1.1rem' }}>Habit Consistency Trend</h3>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
              Checklist completion percentages of your last 7 logs.
            </p>
          </div>

          {logs.length === 0 ? (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '140px', color: 'var(--text-muted)', fontSize: '0.9rem' }}>
              Awaiting logs to render trend graph.
            </div>
          ) : (
            <div style={{ width: '100%', position: 'relative' }}>
              <svg viewBox={`0 0 ${chartW} ${chartH}`} style={{ width: '100%', height: 'auto', maxHeight: '140px' }}>
                <defs>
                  <linearGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="var(--accent-purple)" stopOpacity="0.4" />
                    <stop offset="100%" stopColor="var(--accent-purple)" stopOpacity="0.0" />
                  </linearGradient>
                </defs>

                {/* Y-Axis Guideline grids (0%, 50%, 100%) */}
                {[0, 50, 100].map((val) => {
                  const y = chartH - paddingB - (val / 100) * (chartH - paddingB - paddingT);
                  return (
                    <g key={val}>
                      <line x1={paddingL} y1={y} x2={chartW - 10} y2={y} stroke="var(--glass-border)" strokeDasharray="3" />
                      <text x={paddingL - 8} y={y} textAnchor="end" dominantBaseline="central" fill="var(--text-muted)" fontSize="9">
                        {val}%
                      </text>
                    </g>
                  );
                })}

                {/* Filled Area */}
                {areaPath && <path d={areaPath} fill="url(#chartGradient)" />}

                {/* Main Trend Line */}
                {linePath && (
                  <path d={linePath} fill="none" stroke="var(--accent-purple)" strokeWidth="3" strokeLinecap="round" />
                )}

                {/* Individual Points and Labels */}
                {chartPoints.map((p, idx) => (
                  <g key={idx}>
                    <circle cx={p.x} cy={p.y} r="5" fill="var(--accent-purple)" stroke="var(--text-primary)" strokeWidth="1.5" />
                    <text x={p.x} y={chartH - 8} textAnchor="middle" fill="var(--text-muted)" fontSize="9">
                      {p.date}
                    </text>
                    {/* completion percentage indicator hover-label */}
                    <text x={p.x} y={p.y - 8} textAnchor="middle" fill="var(--text-primary)" fontSize="8" fontWeight="bold">
                      {p.rate.toFixed(0)}%
                    </text>
                  </g>
                ))}
              </svg>
            </div>
          )}
        </div>
      </div>

      <div className="grid-cols-2">
        {/* Opportunity Cost Audit */}
        <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div>
            <h3 style={{ fontSize: '1.1rem', marginBottom: '0.25rem' }}>Opportunity Cost Audit</h3>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
              Attention wasted on passive social feeds directly impacts your capital earning potential.
            </p>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            <div style={{ borderLeft: '3px solid var(--accent-rose)', paddingLeft: '0.75rem' }}>
              <div style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--text-muted)' }}>
                Earning Leakage / Week
              </div>
              <div style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--accent-rose)' }}>
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
              <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                If redirected to **Investments**, this leakage could grow to{' '}
                <strong style={{ color: 'var(--accent-blue)' }}>
                  ${(lostEarningPotentialWeekly * 52 * 1.08).toFixed(0)}
                </strong>{' '}
                annually (assuming 8% return).
              </p>
            </div>
          </div>
        </div>

        {/* Insights Engine Output */}
        <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          <h3 style={{ fontSize: '1.1rem' }}>Local Audit Insights</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', maxHeight: '200px', overflowY: 'auto' }}>
            {insights.map((insight, idx) => (
              <div
                key={idx}
                className={`insight-card insight-${insight.type}`}
                style={{ padding: '0.5rem 0.75rem', background: 'rgba(255, 255, 255, 0.01)', borderRadius: '4px' }}
              >
                <h4 style={{ fontSize: '0.85rem', fontWeight: 700, marginBottom: '0.15rem' }}>
                  {insight.title}
                </h4>
                <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', lineHeight: '1.3' }}>
                  {insight.message}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
export default AnalyticsPanel;

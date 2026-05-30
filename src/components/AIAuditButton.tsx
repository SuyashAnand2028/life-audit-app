import React, { useState } from 'react';
import type { DailyLog } from '../types';
import { calculateAverages } from '../localAnalytics';

interface AIAuditButtonProps {
  logs: DailyLog[];
}

export const AIAuditButton: React.FC<AIAuditButtonProps> = ({ logs }) => {
  const [apiKey, setApiKey] = useState(() => localStorage.getItem('gemini_api_key') || '');
  const [showKeyInput, setShowKeyInput] = useState(false);
  const [loading, setLoading] = useState(false);
  const [insightOutput, setInsightOutput] = useState<string>('');
  const [error, setError] = useState<string>('');

  const saveApiKey = (key: string) => {
    setApiKey(key);
    localStorage.setItem('gemini_api_key', key);
    setShowKeyInput(false);
  };

  const handleGenerateAudit = async (useRuleFallback = false) => {
    if (logs.length === 0) {
      setError('Please log at least one day of metrics to evaluate.');
      return;
    }

    setLoading(true);
    setError('');
    setInsightOutput('');

    const avgs = calculateAverages(logs);
    const summaryText = `
    DAILY AVERAGES SUMMARY:
    - Sleep Hours: ${avgs.avgSleep.toFixed(1)} hours/day
    - Deep Work Hours: ${avgs.avgWork.toFixed(1)} hours/day
    - Routine (fitness/chores) Hours: ${avgs.avgRoutine.toFixed(1)} hours/day
    - Active Leisure Hours: ${avgs.avgLeisure.toFixed(1)} hours/day
    - Screen Distractions Hours: ${avgs.avgDistraction.toFixed(1)} hours/day
    - Focus Level Score: ${avgs.avgFocus.toFixed(1)}/10
    - Energy Level Score: ${avgs.avgEnergy.toFixed(1)}/10
    - Distraction Drag Score: ${avgs.avgDistractionFactor.toFixed(1)}/10
    - Financial Needs: $${avgs.totalNeeds.toFixed(2)}
    - Financial Wants: $${avgs.totalWants.toFixed(2)}
    - Financial Investments: $${avgs.totalInvestments.toFixed(2)}
    - Savings Rate: ${avgs.savingsRate.toFixed(1)}%
    `;

    // Local heuristic engine if they choose to run without API Key
    if (useRuleFallback || !apiKey) {
      setTimeout(() => {
        let fallbackResult = `### 📋 Local Rule-Based Audit Report\n\n`;
        
        if (avgs.avgDistraction > 3) {
          fallbackResult += `* **Time Leak Alert:** Distractions are averaging ${avgs.avgDistraction.toFixed(1)}h daily. Redirecting 1 hour of this time into Deep Work could increase weekly productive output by 7 hours.\n`;
        } else {
          fallbackResult += `* **Focus discipline:** Great job limiting distraction time to ${avgs.avgDistraction.toFixed(1)}h. This maintains clean neural focus.\n`;
        }

        if (avgs.avgSleep < 6.5) {
          fallbackResult += `* **Sleep Deficit:** Sleep averages ${avgs.avgSleep.toFixed(1)}h. Focus scores typically fall by 25% on days following <7h of sleep. Target a consistent 7.5h window.\n`;
        } else {
          fallbackResult += `* **Recovery stability:** Sleep is healthy at ${avgs.avgSleep.toFixed(1)}h. This supports daily energy spikes.\n`;
        }

        if (avgs.savingsRate < 20) {
          fallbackResult += `* **Financial Pressure:** Savings rate is ${avgs.savingsRate.toFixed(0)}%. Reduce variable 'wants' spending ($${avgs.totalWants.toFixed(0)}) to bump your savings rate above the 20% security threshold.\n`;
        } else {
          fallbackResult += `* **Investment posture:** Excellent capital accumulation posture. Saving ${avgs.savingsRate.toFixed(0)}% of earnings.\n`;
        }

        setInsightOutput(fallbackResult);
        setLoading(false);
      }, 800);
      return;
    }

    // Call Gemini API client-side with minimal API call
    try {
      const prompt = `
      You are a high-performance executive Chief of Staff auditing a client's daily metrics. 
      Analyze the daily resource metrics below. Compare Time (limit 24h/day), Money, and Attention. 
      Identify 3 high-impact habits or lifestyle changes to optimize their focus, financial health, and time leverage.
      Keep it extremely concise (max 150 words total), professional, direct, and formatted in markdown lists. Do not use generic advice.
      
      Metrics:
      ${summaryText}
      `;

      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
          }),
        }
      );

      if (!response.ok) {
        throw new Error(`API returned error status: ${response.status}`);
      }

      const data = await response.json();
      const textResponse = data.candidates?.[0]?.content?.parts?.[0]?.text;
      if (textResponse) {
        setInsightOutput(textResponse);
      } else {
        throw new Error('Could not parse Gemini response contents.');
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred during API fetch.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h3 style={{ fontSize: '1.1rem' }}>AI Auditor Insights</h3>
        <button
          onClick={() => setShowKeyInput(!showKeyInput)}
          className="btn"
          style={{ padding: '0.25rem 0.5rem', fontSize: '0.75rem' }}
        >
          {apiKey ? 'Change Key' : 'Setup API Key'}
        </button>
      </div>

      {showKeyInput && (
        <div style={{ background: 'var(--bg-primary)', padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--glass-border)' }}>
          <label className="form-label">Gemini API Key</label>
          <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.25rem' }}>
            <input
              type="password"
              placeholder="Paste your key here..."
              className="form-input"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              style={{ fontSize: '0.8rem', padding: '0.4rem' }}
            />
            <button onClick={() => saveApiKey(apiKey)} className="btn btn-primary" style={{ padding: '0.4rem 0.75rem' }}>
              Save
            </button>
          </div>
          <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '0.5rem' }}>
            Key is stored locally in your browser's localStorage.
          </p>
        </div>
      )}

      {error && (
        <div style={{ color: 'var(--accent-rose)', fontSize: '0.85rem', fontWeight: 600 }}>
          ⚠️ {error}
        </div>
      )}

      <div style={{ display: 'flex', gap: '0.75rem' }}>
        <button
          onClick={() => handleGenerateAudit(false)}
          disabled={loading}
          className="btn btn-primary"
          style={{ flex: 1, justifyContent: 'center' }}
        >
          {loading ? 'Analyzing...' : apiKey ? '🔑 Run AI Audit' : '🤖 Run AI (No Key)'}
        </button>
        
        {apiKey && (
          <button
            onClick={() => handleGenerateAudit(true)}
            disabled={loading}
            className="btn"
            style={{ flex: 1, justifyContent: 'center' }}
          >
            Run Local Auditor
          </button>
        )}
      </div>

      {insightOutput && (
        <div
          style={{
            background: 'var(--bg-primary)',
            padding: '1rem',
            borderRadius: '8px',
            border: '1px solid var(--glass-border)',
            fontSize: '0.85rem',
            lineHeight: '1.5',
            color: 'var(--text-secondary)',
            whiteSpace: 'pre-wrap',
          }}
        >
          {insightOutput}
        </div>
      )}
    </div>
  );
};
export default AIAuditButton;

import type { DailyLog, WheelState } from './types';

// Helper to calculate Pearson correlation coefficient between two arrays of numbers
export function calculateCorrelation(x: number[], y: number[]): number {
  const n = x.length;
  if (n === 0 || n !== y.length) return 0;

  const sumX = x.reduce((a, b) => a + b, 0);
  const sumY = y.reduce((a, b) => a + b, 0);

  const sumXSq = x.reduce((a, b) => a + b * b, 0);
  const sumYSq = y.reduce((a, b) => a + b * b, 0);

  const pSum = x.map((val, idx) => val * y[idx]).reduce((a, b) => a + b, 0);

  const num = pSum - (sumX * sumY) / n;
  const den = Math.sqrt((sumXSq - (sumX * sumX) / n) * (sumYSq - (sumY * sumY) / n));

  if (den === 0) return 0;
  return num / den;
}

export interface PillarAverages {
  avgSleep: number;
  avgWork: number;
  avgRoutine: number;
  avgLeisure: number;
  avgDistraction: number;
  avgFocus: number;
  avgEnergy: number;
  avgDistractionFactor: number;
  totalNeeds: number;
  totalWants: number;
  totalInvestments: number;
  savingsRate: number; // percentage
  avgChecklistCompletion: number; // average percentage completed
}

export function calculateAverages(logs: DailyLog[]): PillarAverages {
  const count = logs.length;
  const defaults: PillarAverages = {
    avgSleep: 0,
    avgWork: 0,
    avgRoutine: 0,
    avgLeisure: 0,
    avgDistraction: 0,
    avgFocus: 0,
    avgEnergy: 0,
    avgDistractionFactor: 0,
    totalNeeds: 0,
    totalWants: 0,
    totalInvestments: 0,
    savingsRate: 0,
    avgChecklistCompletion: 0,
  };

  if (count === 0) return defaults;

  let sleepTotal = 0;
  let workTotal = 0;
  let routineTotal = 0;
  let leisureTotal = 0;
  let distractionTotal = 0;
  let focusTotal = 0;
  let energyTotal = 0;
  let distFactorTotal = 0;
  let needsTotal = 0;
  let wantsTotal = 0;
  let investmentsTotal = 0;
  let checklistCompletionTotal = 0;

  logs.forEach((log) => {
    log.time.forEach((t) => {
      if (t.category === 'sleep') sleepTotal += t.hours;
      if (t.category === 'work') workTotal += t.hours;
      if (t.category === 'routine') routineTotal += t.hours;
      if (t.category === 'leisure') leisureTotal += t.hours;
      if (t.category === 'distraction') distractionTotal += t.hours;
    });

    log.money.forEach((m) => {
      if (m.category === 'needs') needsTotal += m.amount;
      if (m.category === 'wants') wantsTotal += m.amount;
      if (m.category === 'investments') investmentsTotal += m.amount;
    });

    focusTotal += log.focus;
    energyTotal += log.energy;
    distFactorTotal += log.distractionFactor;

    const checklistLength = log.checklist?.length || 0;
    const completedCount = log.checklist?.filter((c) => c.completed).length || 0;
    const completionRate = checklistLength > 0 ? (completedCount / checklistLength) * 100 : 0;
    checklistCompletionTotal += completionRate;
  });

  const totalMoney = needsTotal + wantsTotal + investmentsTotal;

  return {
    avgSleep: sleepTotal / count,
    avgWork: workTotal / count,
    avgRoutine: routineTotal / count,
    avgLeisure: leisureTotal / count,
    avgDistraction: distractionTotal / count,
    avgFocus: focusTotal / count,
    avgEnergy: energyTotal / count,
    avgDistractionFactor: distFactorTotal / count,
    totalNeeds: needsTotal,
    totalWants: wantsTotal,
    totalInvestments: investmentsTotal,
    savingsRate: totalMoney > 0 ? (investmentsTotal / totalMoney) * 100 : 0,
    avgChecklistCompletion: checklistCompletionTotal / count,
  };
}

export function calculateEmpiricalWheel(logs: DailyLog[]): WheelState {
  if (logs.length === 0) {
    return { health: 1, wealth: 1, career: 1, relationships: 1, leisure: 1, growth: 1 };
  }

  const avgs = calculateAverages(logs);

  // Health: derived from sleep quality and routine activity
  // Sleep optimal around 7.5 hrs
  const sleepScore = Math.max(1, 10 - Math.abs(avgs.avgSleep - 7.5) * 2.5);
  // Routine hours (max out at 2 hours a day for score 10)
  const routineScore = Math.min(10, (avgs.avgRoutine / 2) * 10);
  const health = Math.round((sleepScore * 0.6 + routineScore * 0.4) * 10) / 10;

  // Wealth: Savings rate metric
  // 50% savings rate = 10, scale accordingly
  const wealth = Math.round(Math.min(10, (avgs.savingsRate / 50) * 10) * 10) / 10;

  // Career: focus hours + work volume
  // Optimal is 6-8 hrs work, average focus level 7+
  const workVolumeScore = Math.max(1, 10 - Math.abs(avgs.avgWork - 7) * 1.5);
  const focusScore = avgs.avgFocus;
  const career = Math.round((workVolumeScore * 0.4 + focusScore * 0.6) * 10) / 10;

  // Relationships: time spent in leisure and notes containing social triggers
  // We approximate based on a balanced Leisure & Routine, but limit distraction.
  const relationships = Math.round(Math.min(10, (avgs.avgLeisure / 3) * 10) * 10) / 10;

  // Leisure: balance between screen time distraction and active leisure
  const activeLeisureRatio = avgs.avgLeisure / (avgs.avgLeisure + avgs.avgDistraction + 0.1);
  const leisure = Math.round(Math.min(10, activeLeisureRatio * avgs.avgLeisure * 3.3) * 10) / 10;

  // Growth: high focus, low distraction factor, routine time
  const growth = Math.round(Math.min(10, (avgs.avgFocus + (10 - avgs.avgDistractionFactor)) / 2) * 10) / 10;

  return { health, wealth, career, relationships, leisure, growth };
}

export interface RuleInsight {
  type: 'positive' | 'negative' | 'neutral';
  pillar: 'time' | 'money' | 'attention';
  title: string;
  message: string;
  scoreImpact?: number;
}

export function generateInsights(logs: DailyLog[]): RuleInsight[] {
  const insights: RuleInsight[] = [];
  if (logs.length < 3) {
    insights.push({
      type: 'neutral',
      pillar: 'attention',
      title: 'Awaiting Data',
      message: 'Log at least 3 days of metrics to unlock deep cross-resource correlation insights.',
    });
    return insights;
  }

  const avgs = calculateAverages(logs);

  // Time & Attention correlations
  const sleepHours = logs.map((l) => l.time.find((t) => t.category === 'sleep')?.hours || 0);
  const focusScores = logs.map((l) => l.focus);
  const sleepFocusCorr = calculateCorrelation(sleepHours, focusScores);

  if (sleepFocusCorr > 0.4) {
    insights.push({
      type: 'positive',
      pillar: 'attention',
      title: 'Sleep-Focus Coupling',
      message: `There is a strong positive correlation (${sleepFocusCorr.toFixed(2)}) between your sleep and focus. Increasing sleep hours directly boosts your daily productivity.`,
    });
  } else if (sleepFocusCorr < -0.3) {
    insights.push({
      type: 'negative',
      pillar: 'attention',
      title: 'Oversleep Drag',
      message: `We noticed a negative correlation (${sleepFocusCorr.toFixed(2)}) between sleep and focus, suggesting that oversleeping might be causing morning brain-fog. Try keeping sleep around 7-8 hours.`,
    });
  }

  // Distraction Factor and Work Hours
  const avgDist = avgs.avgDistraction;
  if (avgDist > 3) {
    const costHourly = 25; // standard rate
    const weeklyLoss = avgDist * 7 * costHourly;
    insights.push({
      type: 'negative',
      pillar: 'time',
      title: 'High Distraction Leakage',
      message: `You average ${avgDist.toFixed(1)} hours of screen distraction daily. At a conservative valuation of $${costHourly}/hr, this is costing you ~$${weeklyLoss.toFixed(0)} of potential leverage each week.`,
    });
  } else if (avgDist < 1.5 && avgDist > 0) {
    insights.push({
      type: 'positive',
      pillar: 'time',
      title: 'Distraction Under Control',
      message: `Excellent focus discipline! You average only ${avgDist.toFixed(1)} hours of daily distraction, which is well below the common average.`,
    });
  }

  // Money Categories
  const moneyWants = logs.map((l) => l.money.filter((m) => m.category === 'wants').reduce((s, m) => s + m.amount, 0));
  const energyScores = logs.map((l) => l.energy);
  const wantsEnergyCorr = calculateCorrelation(moneyWants, energyScores);

  if (wantsEnergyCorr > 0.4) {
    insights.push({
      type: 'positive',
      pillar: 'money',
      title: 'High-Value Spending',
      message: `Discretionary spending is strongly linked to your energy level (${wantsEnergyCorr.toFixed(2)}). Your 'wants' purchases seem to be high-quality experiences that recharge you.`,
    });
  } else if (wantsEnergyCorr < -0.3) {
    insights.push({
      type: 'negative',
      pillar: 'money',
      title: 'Buyer\'s Remorse Signature',
      message: `Spending on discretionary 'wants' negatively correlates with your energy level (${wantsEnergyCorr.toFixed(2)}). You might be spending on instant-gratification items that leave you feeling depleted.`,
    });
  }

  // Financial Balance Check
  if (avgs.savingsRate < 20) {
    insights.push({
      type: 'negative',
      pillar: 'money',
      title: 'Savings Under Pressure',
      message: `Your savings rate is ${avgs.savingsRate.toFixed(1)}%, which is below the recommended 20% threshold. Focus on cutting variable expenses to fund investments.`,
    });
  } else if (avgs.savingsRate >= 35) {
    insights.push({
      type: 'positive',
      pillar: 'money',
      title: 'Super-Saver Status',
      message: `Outstanding savings rate of ${avgs.savingsRate.toFixed(1)}%! You are successfully building long-term financial security.`,
    });
  }

  // Checklist & Focus correlations
  const checklistCompletion = logs.map((l) => {
    const total = l.checklist?.length || 0;
    const completed = l.checklist?.filter((c) => c.completed).length || 0;
    return total > 0 ? (completed / total) * 100 : 0;
  });
  const checklistFocusCorr = calculateCorrelation(checklistCompletion, focusScores);

  if (checklistFocusCorr > 0.4) {
    insights.push({
      type: 'positive',
      pillar: 'attention',
      title: 'Habit Consistency Booster',
      message: `We found a strong positive correlation (${checklistFocusCorr.toFixed(2)}) between completing your habits and daily focus. Ticking off your tasks directly sets a productive tone.`,
    });
  }

  if (avgs.avgChecklistCompletion > 80) {
    insights.push({
      type: 'positive',
      pillar: 'attention',
      title: 'Habit Mastery',
      message: `Excellent consistency! You complete an average of ${avgs.avgChecklistCompletion.toFixed(0)}% of your habits daily. Keep this momentum.`,
    });
  } else if (avgs.avgChecklistCompletion < 50 && avgs.avgChecklistCompletion > 0) {
    insights.push({
      type: 'negative',
      pillar: 'attention',
      title: 'Checklist Slippage',
      message: `Your habit completion rate is averaging ${avgs.avgChecklistCompletion.toFixed(0)}%. Try archiving habits you do not need, and focus on consistently completing just 2 or 3 high-impact ones.`,
    });
  }

  return insights;
}

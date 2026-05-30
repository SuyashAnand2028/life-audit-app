export type TimeCategory = 'sleep' | 'work' | 'routine' | 'leisure' | 'distraction';
export type MoneyCategory = 'needs' | 'wants' | 'investments';

export interface TimeEntry {
  category: TimeCategory;
  hours: number;
}

export interface MoneyEntry {
  id: string;
  category: MoneyCategory;
  amount: number;
  description: string;
}

export interface ChecklistItem {
  id: string;
  label: string;
  active: boolean; // items can be archived if not active
}

export interface DailyChecklistEntry {
  itemId: string;
  completed: boolean;
}

export interface DailyLog {
  date: string; // YYYY-MM-DD
  time: TimeEntry[];
  money: MoneyEntry[];
  focus: number; // 1 to 10
  energy: number; // 1 to 10
  distractionFactor: number; // 1 to 10
  checklist: DailyChecklistEntry[];
  notes: string;
}

export interface WheelState {
  health: number;       // 1 to 10
  wealth: number;       // 1 to 10
  career: number;       // 1 to 10
  relationships: number; // 1 to 10
  leisure: number;      // 1 to 10
  growth: number;       // 1 to 10
}

export interface AuditDataState {
  logs: DailyLog[];
  wheelSelfAssessment: WheelState;
  checklistItems: ChecklistItem[];
}

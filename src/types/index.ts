import type { PetId } from './pet';

export type Priority = 'high' | 'medium' | 'low';

export type TaskType = 'daily_habit' | 'single_todo';

export interface TodoItem {
  id: string;
  title: string;
  completed: boolean;
  type: TaskType;
  priority: Priority;
  dueTime?: string; // "14:00"
  createdAt: string; // ISO string
  completedAt?: string; // ISO string
  targetDate: string; // "YYYY-MM-DD"
  startDate?: string; // "YYYY-MM-DD" for range tasks
  endDate?: string; // "YYYY-MM-DD" for range tasks
  habitId?: string; // references HabitItem if spawned from daily habit
}

export interface DateSchedule {
  mode: 'today' | 'specific' | 'range';
  targetDate?: string;
  startDate?: string;
  endDate?: string;
}

export interface HabitItem {
  id: string;
  title: string;
  priority: Priority;
  dueTime?: string;
  activeDays: number[]; // 0 = Sunday, 1 = Monday, ... 6 = Saturday. [1,2,3,4,5] = weekdays
  streak: number;
  lastCompletedDate?: string; // "YYYY-MM-DD"
  createdAt: string;
  archived?: boolean;
}

export interface ImportSummary {
  todoCount: number;
  habitCount: number;
  recordCount: number;
  exportDate?: string;
}

export interface DailyRecord {
  date: string; // "YYYY-MM-DD"
  totalTasks: number;
  completedTasks: number;
  rate: number; // 0 ~ 100
}

export interface AppSettings {
  theme: 'light' | 'dark' | 'system';
  opacity: number; // 0.3 ~ 1.0
  alwaysOnTop: boolean;
  isLocked: boolean;
  autoStart: boolean;
  edgeSnap: boolean;
  soundEnabled: boolean;
  notificationEnabled: boolean;
  confettiEnabled: boolean;
  hotkey: string;
  lastActiveDate: string; // "YYYY-MM-DD"
  widgetMode: 'list' | 'pet';
  selectedPet: PetId;
  petSpeechEnabled: boolean;
}

export interface ExportData {
  version: string;
  backupSchemaVersion?: number;
  exportDate: string;
  todos: TodoItem[];
  habits: HabitItem[];
  records: Record<string, DailyRecord>;
  settings: AppSettings;
}

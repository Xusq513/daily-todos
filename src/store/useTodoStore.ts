import { useState, useEffect, useCallback } from 'react';
import { TodoItem, HabitItem, DailyRecord, AppSettings, ExportData, Priority, TaskType, ImportSummary } from '../types';
import { getTodayDateStr, isTaskActiveToday } from '../utils/date';
import { isMacOS, isTauri } from '../utils/platform';
import { calculateHabitStreak } from '../utils/streak';
import {
  getAppStateIpc,
  addTodoIpc,
  toggleTodoIpc,
  deleteTodoIpc,
  updateTodoIpc,
  addHabitIpc,
  addHabitAndTodoIpc,
  archiveHabitIpc,
  unarchiveHabitIpc,
  deleteHabitPermanentlyIpc,
  updateSettingsIpc,
  updateHabitIpc,
  changeGlobalHotkeyIpc,
  exportBackupIpc,
  previewImportBackupIpc,
  executeImportBackupIpc,
  restoreBackupSnapshotIpc,
  triggerDailyRolloverIpc,
  listenStateChanged,
} from '../utils/tauriBridge';
import { PetId } from '../types/pet';
import { getAvailablePetIds, resolvePetId } from '../pets/registry';

const STORAGE_KEY = 'daily_todos_app_state_v1';
const BROADCAST_CHANNEL = 'daily_todos_sync_channel';

const defaultSettings: AppSettings = {
  theme: 'system',
  opacity: 0.88,
  alwaysOnTop: true,
  isLocked: false,
  autoStart: false,
  edgeSnap: true,
  soundEnabled: true,
  notificationEnabled: true,
  confettiEnabled: true,
  hotkey: isMacOS() ? 'CommandOrControl+Shift+T' : 'Alt+Shift+T',
  lastActiveDate: getTodayDateStr(),
  widgetMode: 'list',
  selectedPet: 'cat',
  petSpeechEnabled: true,
};

const initialHabits: HabitItem[] = [
  {
    id: 'habit_1',
    title: '晨间专注阅读 20 分钟',
    priority: 'medium',
    dueTime: '08:30',
    activeDays: [1, 2, 3, 4, 5, 6, 0],
    streak: 3,
    createdAt: new Date().toISOString(),
    archived: false,
  },
  {
    id: 'habit_2',
    title: '核心代码 Review 与站会',
    priority: 'high',
    dueTime: '10:00',
    activeDays: [1, 2, 3, 4, 5],
    streak: 5,
    createdAt: new Date().toISOString(),
    archived: false,
  },
];

const initialTodos: TodoItem[] = [
  {
    id: 'todo_init_1',
    title: '晨间专注阅读 20 分钟',
    completed: true,
    type: 'daily_habit',
    priority: 'medium',
    dueTime: '08:30',
    createdAt: new Date().toISOString(),
    completedAt: new Date().toISOString(),
    targetDate: getTodayDateStr(),
    habitId: 'habit_1',
  },
  {
    id: 'todo_init_2',
    title: '核心代码 Review 与站会',
    completed: false,
    type: 'daily_habit',
    priority: 'high',
    dueTime: '10:00',
    createdAt: new Date().toISOString(),
    targetDate: getTodayDateStr(),
    habitId: 'habit_2',
  },
  {
    id: 'todo_init_3',
    title: '完成桌面待办悬浮小组件的开发与自测',
    completed: false,
    type: 'single_todo',
    priority: 'high',
    createdAt: new Date().toISOString(),
    targetDate: getTodayDateStr(),
  },
];

interface AppState {
  todos: TodoItem[];
  habits: HabitItem[];
  records: Record<string, DailyRecord>;
  settings: AppSettings;
}

function loadInitialFallbackState(): AppState {
  if (typeof window === 'undefined') {
    return { todos: initialTodos, habits: initialHabits, records: {}, settings: defaultSettings };
  }

  try {
    if (!isTauri()) {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        return {
          todos: parsed.todos || initialTodos,
          habits: parsed.habits || initialHabits,
          records: parsed.records || {},
          settings: { ...defaultSettings, ...(parsed.settings || {}) },
        };
      }
    }
  } catch (e) {
    console.error('Failed to parse saved state:', e);
  }

  return {
    todos: initialTodos,
    habits: initialHabits,
    records: {},
    settings: defaultSettings,
  };
}

let globalState: AppState = loadInitialFallbackState();
const listeners = new Set<() => void>();
let broadcastChannel: BroadcastChannel | null = null;

function notifyListeners() {
  listeners.forEach((fn) => fn());
}

// Browser fallback storage
function saveFallbackAndNotify(newState: AppState) {
  globalState = newState;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(newState));
    if (broadcastChannel) {
      broadcastChannel.postMessage({ type: 'STATE_SYNC', state: newState });
    }
  } catch (e) {
    console.error('Failed to persist fallback state:', e);
  }
  notifyListeners();
}

// BroadcastChannel for browser-mode previews
if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
  broadcastChannel = new BroadcastChannel(BROADCAST_CHANNEL);
  broadcastChannel.onmessage = (event) => {
    if (event.data && event.data.type === 'STATE_SYNC') {
      globalState = event.data.state;
      notifyListeners();
    }
  };
}

// Initialize Tauri backend state sync & events
let tauriInitialized = false;
async function initTauriStateSync(retryCount = 0) {
  if (tauriInitialized || !isTauri()) return;

  try {
    // 1. Register listener FIRST to avoid missing intermediate events
    await listenStateChanged((newState: any) => {
      if (newState) {
        globalState = newState as AppState;
        notifyListeners();
      }
    });

    // 2. Fetch authoritative state from Rust
    const remoteState = await getAppStateIpc();
    if (remoteState) {
      globalState = remoteState as AppState;
      notifyListeners();
    }

    tauriInitialized = true;

    // Check midnight rollover on window focus
    window.addEventListener('focus', () => {
      triggerDailyRolloverIpc();
    });
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible') {
        triggerDailyRolloverIpc();
      }
    });
  } catch (e) {
    console.warn('Failed to init Tauri state sync, retry scheduled:', e);
    if (retryCount < 3) {
      setTimeout(() => initTauriStateSync(retryCount + 1), 500);
    }
  }
}

if (typeof window !== 'undefined') {
  initTauriStateSync();
}

/**
 * Fallback day rollover logic for browser environment
 */
function applyBrowserDailyRollover(state: AppState): AppState {
  const today = getTodayDateStr();
  const lastDate = state.settings.lastActiveDate;

  let newRecords = { ...state.records };
  let updatedTodos = state.todos;

  if (lastDate < today) {
    const prevDateTodos = state.todos.filter((t) => t.targetDate === lastDate);
    if (prevDateTodos.length > 0) {
      const total = prevDateTodos.length;
      const completed = prevDateTodos.filter((t) => t.completed).length;
      newRecords[lastDate] = {
        date: lastDate,
        totalTasks: total,
        completedTasks: completed,
        rate: Math.round((completed / total) * 100),
      };
    }

    updatedTodos = state.todos.map((todo) => {
      if (todo.type === 'single_todo' && !todo.completed && todo.targetDate < today) {
        return { ...todo, targetDate: today };
      }
      return todo;
    });
  }

  // Ensure active habits
  const currentDayOfWeek = new Date().getDay();
  const existingHabitIds = new Set(
    updatedTodos
      .filter((t) => t.targetDate === today && t.type === 'daily_habit' && t.habitId)
      .map((t) => t.habitId)
  );

  const newHabitTodos: TodoItem[] = [];
  state.habits.forEach((habit) => {
    if (habit.archived) return;
    if (habit.activeDays.includes(currentDayOfWeek) && !existingHabitIds.has(habit.id)) {
      newHabitTodos.push({
        id: `habit_todo_${habit.id}_${today}`,
        title: habit.title,
        completed: false,
        type: 'daily_habit',
        priority: habit.priority,
        dueTime: habit.dueTime,
        createdAt: new Date().toISOString(),
        targetDate: today,
        habitId: habit.id,
      });
    }
  });

  const allTodos = [...updatedTodos, ...newHabitTodos];

  // Refresh streaks
  const updatedHabits = state.habits.map((h) => {
    const { streak, lastCompletedDate } = calculateHabitStreak(h, allTodos, today);
    return { ...h, streak, lastCompletedDate };
  });

  return {
    ...state,
    todos: allTodos,
    habits: updatedHabits,
    records: newRecords,
    settings: {
      ...state.settings,
      lastActiveDate: today,
    },
  };
}

if (!isTauri()) {
  globalState = applyBrowserDailyRollover(globalState);
}

export function useTodoStore() {
  const [, setTick] = useState(0);

  useEffect(() => {
    const onChange = () => setTick((t) => t + 1);
    listeners.add(onChange);
    return () => {
      listeners.delete(onChange);
    };
  }, []);

  const today = getTodayDateStr();

  // Active habits (non-archived) vs archived habits
  const activeHabits = globalState.habits.filter((h) => !h.archived);
  const archivedHabits = globalState.habits.filter((h) => h.archived);

  // Active todos for today
  const todayTodos = globalState.todos
    .filter((t) => isTaskActiveToday(t, today))
    .sort((a, b) => {
      if (a.completed !== b.completed) {
        return a.completed ? 1 : -1;
      }
      const pMap = { high: 3, medium: 2, low: 1 };
      return pMap[b.priority] - pMap[a.priority];
    });

  // Upcoming / future tasks
  const upcomingTodos = globalState.todos
    .filter((t) => {
      if (t.completed) return false;
      if (t.startDate && t.endDate) {
        return t.endDate >= today;
      }
      return t.targetDate > today;
    })
    .sort((a, b) => {
      const dateA = a.startDate || a.targetDate;
      const dateB = b.startDate || b.targetDate;
      return dateA.localeCompare(dateB);
    });

  const completedCount = todayTodos.filter((t) => t.completed).length;
  const totalCount = todayTodos.length;
  const completionRate = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  const addTodo = useCallback(async (
    title: string,
    priority: Priority = 'medium',
    dueTime?: string,
    type: TaskType = 'single_todo',
    dateSchedule?: { targetDate?: string; startDate?: string; endDate?: string }
  ): Promise<{ success: boolean; error?: string }> => {
    if (!title.trim()) return { success: false, error: '待办标题不能为空' };

    const targetDate = dateSchedule?.targetDate || dateSchedule?.startDate || getTodayDateStr();
    const startDate = dateSchedule?.startDate;
    const endDate = dateSchedule?.endDate;

    if (isTauri()) {
      try {
        await addTodoIpc({
          title: title.trim(),
          priority,
          dueTime,
          todoType: type,
          targetDate,
          startDate,
          endDate,
        });
        return { success: true };
      } catch (err) {
        console.error('Failed to add todo:', err);
        return { success: false, error: String(err) };
      }
    }

    try {
      const newTodo: TodoItem = {
        id: 'todo_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7),
        title: title.trim(),
        completed: false,
        type,
        priority,
        dueTime,
        createdAt: new Date().toISOString(),
        targetDate,
        startDate,
        endDate,
      };

      saveFallbackAndNotify({
        ...globalState,
        todos: [newTodo, ...globalState.todos],
      });
      return { success: true };
    } catch (err) {
      return { success: false, error: String(err) };
    }
  }, []);

  const toggleTodo = useCallback((id: string) => {
    const todo = globalState.todos.find((t) => t.id === id);
    if (!todo) return false;
    const willComplete = !todo.completed;

    if (isTauri()) {
      // Optimistic update for zero-latency UI response with automatic rollback
      const previousTodos = globalState.todos;
      const updatedTodos = globalState.todos.map((t) =>
        t.id === id ? { ...t, completed: willComplete, completedAt: willComplete ? new Date().toISOString() : undefined } : t
      );
      globalState = { ...globalState, todos: updatedTodos };
      notifyListeners();

      toggleTodoIpc(id).catch((err) => {
        console.error('Failed to toggle todo on backend, rolling back state:', err);
        globalState = { ...globalState, todos: previousTodos };
        notifyListeners();
      });
      return willComplete;
    }

    const updatedTodos = globalState.todos.map((t) => {
      if (t.id === id) {
        return {
          ...t,
          completed: willComplete,
          completedAt: willComplete ? new Date().toISOString() : undefined,
        };
      }
      return t;
    });

    const updatedHabits = globalState.habits.map((h) => {
      const { streak, lastCompletedDate } = calculateHabitStreak(h, updatedTodos, getTodayDateStr());
      return { ...h, streak, lastCompletedDate };
    });

    saveFallbackAndNotify({
      ...globalState,
      todos: updatedTodos,
      habits: updatedHabits,
    });

    return willComplete;
  }, []);

  const deleteTodo = useCallback(async (id: string) => {
    if (isTauri()) {
      try {
        await deleteTodoIpc(id);
      } catch (err) {
        console.error('Failed to delete todo:', err);
      }
      return;
    }

    const updatedTodos = globalState.todos.filter((t) => t.id !== id);
    const updatedHabits = globalState.habits.map((h) => {
      const { streak, lastCompletedDate } = calculateHabitStreak(h, updatedTodos, getTodayDateStr());
      return { ...h, streak, lastCompletedDate };
    });

    saveFallbackAndNotify({
      ...globalState,
      todos: updatedTodos,
      habits: updatedHabits,
    });
  }, []);

  const updateTodo = useCallback(async (id: string, updates: Partial<TodoItem>): Promise<{ success: boolean; error?: string }> => {
    if (isTauri()) {
      try {
        await updateTodoIpc(id, updates);
        return { success: true };
      } catch (err) {
        console.error('Failed to update todo:', err);
        return { success: false, error: String(err) };
      }
    }

    try {
      saveFallbackAndNotify({
        ...globalState,
        todos: globalState.todos.map((t) => (t.id === id ? { ...t, ...updates } : t)),
      });
      return { success: true };
    } catch (err) {
      return { success: false, error: String(err) };
    }
  }, []);

  const addHabit = useCallback(async (
    title: string,
    priority: Priority = 'medium',
    dueTime?: string,
    activeDays: number[] = [0, 1, 2, 3, 4, 5, 6]
  ): Promise<{ success: boolean; error?: string }> => {
    if (!title.trim()) return { success: false, error: '习惯名称不能为空' };

    if (isTauri()) {
      try {
        await addHabitIpc({ title: title.trim(), priority, dueTime, activeDays });
        return { success: true };
      } catch (err) {
        console.error('Failed to add habit:', err);
        return { success: false, error: String(err) };
      }
    }

    try {
      const newHabit: HabitItem = {
        id: 'habit_' + Date.now(),
        title: title.trim(),
        priority,
        dueTime,
        activeDays,
        streak: 0,
        createdAt: new Date().toISOString(),
        archived: false,
      };

      const nextState = {
        ...globalState,
        habits: [...globalState.habits, newHabit],
      };

      saveFallbackAndNotify(applyBrowserDailyRollover(nextState));
      return { success: true };
    } catch (err) {
      return { success: false, error: String(err) };
    }
  }, []);

  // Creates both HabitItem and today's linked TodoItem (P1.6)
  const addHabitAndTodo = useCallback(async (
    title: string,
    priority: Priority = 'medium',
    dueTime?: string,
    activeDays: number[] = [0, 1, 2, 3, 4, 5, 6]
  ): Promise<{ success: boolean; error?: string }> => {
    if (!title.trim()) return { success: false, error: '习惯名称不能为空' };

    if (isTauri()) {
      try {
        await addHabitAndTodoIpc({ title: title.trim(), priority, dueTime, activeDays });
        return { success: true };
      } catch (err) {
        console.error('Failed to add habit and todo:', err);
        return { success: false, error: String(err) };
      }
    }

    try {
      const todayStr = getTodayDateStr();
      const newHabit: HabitItem = {
        id: 'habit_' + Date.now(),
        title: title.trim(),
        priority,
        dueTime,
        activeDays,
        streak: 0,
        createdAt: new Date().toISOString(),
        archived: false,
      };

      const newTodo: TodoItem = {
        id: `habit_todo_${newHabit.id}_${todayStr}`,
        title: newHabit.title,
        completed: false,
        type: 'daily_habit',
        priority: newHabit.priority,
        dueTime: newHabit.dueTime,
        createdAt: new Date().toISOString(),
        targetDate: todayStr,
        habitId: newHabit.id,
      };

      const nextState = {
        ...globalState,
        habits: [...globalState.habits, newHabit],
        todos: [newTodo, ...globalState.todos],
      };

      saveFallbackAndNotify(applyBrowserDailyRollover(nextState));
      return { success: true };
    } catch (err) {
      return { success: false, error: String(err) };
    }
  }, []);

  const updateHabit = useCallback(async (id: string, updates: Partial<HabitItem>): Promise<{ success: boolean; error?: string }> => {
    if (isTauri()) {
      try {
        await updateHabitIpc({ id, ...updates });
        return { success: true };
      } catch (err) {
        console.error('Failed to update habit on backend:', err);
        return { success: false, error: String(err) };
      }
    }
    try {
      saveFallbackAndNotify({
        ...globalState,
        habits: globalState.habits.map((h) => (h.id === id ? { ...h, ...updates } : h)),
      });
      return { success: true };
    } catch (err) {
      return { success: false, error: String(err) };
    }
  }, []);

  // Soft archive habit: preserves all history and calendar data (P1.4)
  const archiveHabit = useCallback(async (id: string) => {
    if (isTauri()) {
      try {
        await archiveHabitIpc(id);
      } catch (err) {
        console.error('Failed to archive habit:', err);
      }
      return;
    }

    saveFallbackAndNotify({
      ...globalState,
      habits: globalState.habits.map((h) => (h.id === id ? { ...h, archived: true } : h)),
    });
  }, []);

  const unarchiveHabit = useCallback(async (id: string) => {
    if (isTauri()) {
      try {
        await unarchiveHabitIpc(id);
      } catch (err) {
        console.error('Failed to unarchive habit:', err);
      }
      return;
    }

    const nextState = {
      ...globalState,
      habits: globalState.habits.map((h) => (h.id === id ? { ...h, archived: false } : h)),
    };
    saveFallbackAndNotify(applyBrowserDailyRollover(nextState));
  }, []);

  const deleteHabitPermanently = useCallback(async (id: string) => {
    if (isTauri()) {
      try {
        await deleteHabitPermanentlyIpc(id);
      } catch (err) {
        console.error('Failed to permanently delete habit:', err);
      }
      return;
    }

    saveFallbackAndNotify({
      ...globalState,
      habits: globalState.habits.filter((h) => h.id !== id),
      todos: globalState.todos.filter((t) => t.habitId !== id),
    });
  }, []);

  // Default deleteHabit calls soft archive for safety
  const deleteHabit = useCallback((id: string) => {
    archiveHabit(id);
  }, [archiveHabit]);

  const updateSettings = useCallback(async (updates: Partial<AppSettings>) => {
    const nextSettings = { ...globalState.settings, ...updates };
    if (isTauri()) {
      if (updates.hotkey && updates.hotkey !== globalState.settings.hotkey) {
        try {
          await changeGlobalHotkeyIpc(updates.hotkey);
        } catch (e) {
          console.warn('Failed to change hotkey in backend:', e);
        }
      }
      try {
        await updateSettingsIpc(nextSettings);
      } catch (e) {
        console.error('Failed to update settings in backend:', e);
      }
      return;
    }

    saveFallbackAndNotify({
      ...globalState,
      settings: nextSettings,
    });
  }, []);

  const exportBackup = useCallback(async (): Promise<string> => {
    if (isTauri()) {
      const exported = await exportBackupIpc();
      if (exported) return exported;
    }

    const data: ExportData = {
      version: '1.1.4',
      backupSchemaVersion: 1,
      exportDate: new Date().toISOString(),
      todos: globalState.todos,
      habits: globalState.habits,
      records: globalState.records,
      settings: globalState.settings,
    };
    return JSON.stringify(data, null, 2);
  }, []);

  // Preview import JSON and get summary without applying (P1.5)
  const previewImportBackup = useCallback(async (jsonStr: string): Promise<ImportSummary> => {
    if (isTauri()) {
      const summary = await previewImportBackupIpc(jsonStr);
      if (summary) return summary;
    }

    const parsed = JSON.parse(jsonStr);
    if (!parsed || !Array.isArray(parsed.todos) || !Array.isArray(parsed.habits)) {
      throw new Error('备份缺少有效的 todos 或 habits 列表');
    }
    return {
      todoCount: parsed.todos.length,
      habitCount: parsed.habits.length,
      recordCount: parsed.records ? Object.keys(parsed.records).length : 0,
      exportDate: parsed.exportDate,
    };
  }, []);

  // Apply import with pre-import snapshot protection (P1.5)
  const executeImportBackup = useCallback(async (jsonStr: string): Promise<boolean> => {
    if (isTauri()) {
      const res = await executeImportBackupIpc(jsonStr);
      if (res && res.settings?.hotkey) {
        changeGlobalHotkeyIpc(res.settings.hotkey).catch((err) => {
          console.warn('Failed to hot-reload imported hotkey:', err);
        });
      }
      return !!res;
    }

    try {
      const parsed = JSON.parse(jsonStr);
      const newState: AppState = {
        todos: parsed.todos,
        habits: parsed.habits,
        records: parsed.records || {},
        settings: { ...defaultSettings, ...(parsed.settings || {}) },
      };
      saveFallbackAndNotify(applyBrowserDailyRollover(newState));
      return true;
    } catch (e) {
      console.error('Import fallback error:', e);
      return false;
    }
  }, []);

  const restoreBackupSnapshot = useCallback(async (): Promise<boolean> => {
    if (isTauri()) {
      const res = await restoreBackupSnapshotIpc();
      return !!res;
    }
    return false;
  }, []);

  // Legacy importBackup wrapper
  const importBackup = useCallback(async (jsonStr: string): Promise<boolean> => {
    try {
      await previewImportBackup(jsonStr);
      return await executeImportBackup(jsonStr);
    } catch (e) {
      console.error('Failed to import backup:', e);
      return false;
    }
  }, [previewImportBackup, executeImportBackup]);

  const setWidgetMode = useCallback((mode: 'list' | 'pet') => {
    updateSettings({ widgetMode: mode });
  }, [updateSettings]);

  const setSelectedPet = useCallback((pet: PetId) => {
    updateSettings({ selectedPet: pet });
  }, [updateSettings]);

  const cyclePet = useCallback(() => {
    const pets = getAvailablePetIds();
    const current = resolvePetId(globalState.settings.selectedPet || 'cat');
    const nextIdx = (pets.indexOf(current) + 1) % pets.length;
    updateSettings({ selectedPet: pets[nextIdx] });
  }, [updateSettings]);

  const togglePetSpeech = useCallback(() => {
    updateSettings({ petSpeechEnabled: !globalState.settings.petSpeechEnabled });
  }, [updateSettings]);

  return {
    todos: globalState.todos,
    todayTodos,
    upcomingTodos,
    habits: globalState.habits,
    activeHabits,
    archivedHabits,
    records: globalState.records,
    settings: globalState.settings,
    completedCount,
    totalCount,
    completionRate,
    addTodo,
    toggleTodo,
    deleteTodo,
    updateTodo,
    addHabit,
    addHabitAndTodo,
    updateHabit,
    archiveHabit,
    unarchiveHabit,
    deleteHabitPermanently,
    deleteHabit,
    updateSettings,
    setWidgetMode,
    setSelectedPet,
    cyclePet,
    togglePetSpeech,
    exportBackup,
    previewImportBackup,
    executeImportBackup,
    restoreBackupSnapshot,
    importBackup,
  };
}

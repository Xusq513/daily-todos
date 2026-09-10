import { HabitItem, TodoItem } from '../types';

/**
 * Pure function to calculate habit streak respecting activeDays
 * Matches Rust backend algorithm
 */
export function calculateHabitStreak(
  habit: HabitItem,
  todos: TodoItem[],
  todayStr: string
): { streak: number; lastCompletedDate?: string } {
  const completedDates = new Set<string>();
  let latestCompleted: string | undefined;

  for (const todo of todos) {
    if (todo.habitId === habit.id && todo.completed) {
      completedDates.add(todo.targetDate);
      if (!latestCompleted || todo.targetDate > latestCompleted) {
        latestCompleted = todo.targetDate;
      }
    }
  }

  if (!habit.activeDays || habit.activeDays.length === 0) {
    return { streak: 0, lastCompletedDate: latestCompleted };
  }

  const parseDate = (str: string) => {
    const [y, m, d] = str.split('-').map(Number);
    return new Date(y, m - 1, d);
  };

  const formatDate = (date: Date) => {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  };

  const isDayActive = (date: Date) => {
    const dayOfWeek = date.getDay(); // 0 is Sunday, 1 is Monday ...
    return habit.activeDays.includes(dayOfWeek);
  };

  let streak = 0;
  const today = parseDate(todayStr);

  // If today is an active day and today's task is completed, count today
  if (isDayActive(today)) {
    if (completedDates.has(todayStr)) {
      streak += 1;
    }
  }

  // Walk backwards day by day
  const curDate = new Date(today);
  for (let i = 0; i < 365; i++) {
    curDate.setDate(curDate.getDate() - 1);
    const dateStr = formatDate(curDate);

    if (!isDayActive(curDate)) {
      // Inactive day (e.g. weekend): skip without breaking streak
      continue;
    }

    if (completedDates.has(dateStr)) {
      streak += 1;
    } else {
      // Missed active day: streak breaks!
      break;
    }
  }

  return { streak, lastCompletedDate: latestCompleted };
}

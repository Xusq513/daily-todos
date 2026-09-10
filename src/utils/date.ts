/**
 * Date, range and rollover utilities
 */
import { TodoItem } from '../types';

export interface CalendarDayInfo {
  dateStr: string; // YYYY-MM-DD
  dayNumber: number;
  isCurrentMonth: boolean;
  isToday: boolean;
  isPast: boolean;
  isFuture: boolean;
}

export function getTodayDateStr(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function getTomorrowDateStr(): string {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function getThisFridayDateStr(): string {
  const d = new Date();
  const currentDay = d.getDay(); // 0 is Sunday, 5 is Friday
  const diff = 5 - currentDay + (currentDay > 5 ? 7 : 0);
  d.setDate(d.getDate() + diff);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function getThisSundayDateStr(): string {
  const d = new Date();
  const currentDay = d.getDay();
  const diff = (7 - currentDay) % 7;
  d.setDate(d.getDate() + (diff === 0 ? 7 : diff));
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function formatDateChinese(dateStr: string): string {
  if (!dateStr) return '';
  const [year, month, day] = dateStr.split('-');
  const date = new Date(Number(year), Number(month) - 1, Number(day));
  const weekDays = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];
  const weekDay = weekDays[date.getDay()];
  return `${Number(month)}月${Number(day)}日 ${weekDay}`;
}

export function formatDateFullChinese(dateStr: string): string {
  if (!dateStr) return '';
  const [year, month, day] = dateStr.split('-');
  const date = new Date(Number(year), Number(month) - 1, Number(day));
  const weekDays = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];
  const weekDay = weekDays[date.getDay()];
  return `${year}年${Number(month)}月${Number(day)}日 ${weekDay}`;
}

export function formatDateShort(dateStr: string): string {
  if (!dateStr) return '';
  const [, month, day] = dateStr.split('-');
  return `${Number(month)}/${Number(day)}`;
}

export function formatDateRange(startDate?: string, endDate?: string): string {
  if (!startDate && !endDate) return '';
  if (startDate && endDate) {
    if (startDate === endDate) return formatDateShort(startDate);
    return `${formatDateShort(startDate)} ~ ${formatDateShort(endDate)}`;
  }
  return formatDateShort(startDate || endDate || '');
}

/**
 * Calculates remaining days from today to target/end date
 * returns 0 if today, positive if future, negative if overdue
 */
export function getDaysRemaining(endDateStr: string): number {
  const today = getTodayDateStr();
  const tTime = new Date(today).getTime();
  const eTime = new Date(endDateStr).getTime();
  return Math.round((eTime - tTime) / (1000 * 60 * 60 * 24));
}

export function getDaysDiff(date1Str: string, date2Str: string): number {
  const d1 = new Date(date1Str).getTime();
  const d2 = new Date(date2Str).getTime();
  const diffTime = Math.abs(d2 - d1);
  return Math.floor(diffTime / (1000 * 60 * 60 * 24));
}

/**
 * Determines whether a task should be active in today's floating widget:
 * 1. If it's a range task (has startDate and endDate):
 *    active if startDate <= today && today <= endDate
 * 2. If it's a single task:
 *    active if targetDate === today OR (uncompleted and targetDate < today)
 */
export function isTaskActiveToday(todo: TodoItem, today: string): boolean {
  if (todo.startDate && todo.endDate) {
    return todo.startDate <= today && today <= todo.endDate;
  }
  // 日常习惯仅在其指定日期当天生效，过往未打卡的日常习惯应留在历史中，不顺延堆叠到今日
  if (todo.type === 'daily_habit') {
    return todo.targetDate === today;
  }
  // 单次待办：当天任务，或过往未完成顺延的任务
  return todo.targetDate === today || (!todo.completed && todo.targetDate < today);
}

/**
 * Returns tasks applicable to a specific date:
 * - Single tasks whose targetDate matches
 * - Range tasks whose startDate <= dateStr <= endDate
 */
export function getTasksForDate(todos: TodoItem[], dateStr: string): TodoItem[] {
  return todos.filter((todo) => {
    if (todo.startDate && todo.endDate) {
      return todo.startDate <= dateStr && dateStr <= todo.endDate;
    }
    return todo.targetDate === dateStr;
  });
}

/**
 * Generates a full month calendar grid (starts on Monday, 35 or 42 cells)
 * month is 1-indexed (1 to 12)
 */
export function getMonthGrid(year: number, month: number): CalendarDayInfo[] {
  const today = getTodayDateStr();
  const firstDay = new Date(year, month - 1, 1);
  const daysInCurrentMonth = new Date(year, month, 0).getDate();
  const daysInPrevMonth = new Date(year, month - 1, 0).getDate();

  // JavaScript: 0 = Sun, 1 = Mon, ..., 6 = Sat
  // We want week to start on Monday: Mon=0, Tue=1, ..., Sun=6
  const firstDayOfWeek = firstDay.getDay();
  const leadDays = firstDayOfWeek === 0 ? 6 : firstDayOfWeek - 1;

  const result: CalendarDayInfo[] = [];

  // 1. Prev month lead days
  const prevMonth = month === 1 ? 12 : month - 1;
  const prevYear = month === 1 ? year - 1 : year;
  for (let i = leadDays - 1; i >= 0; i--) {
    const dayNum = daysInPrevMonth - i;
    const dateStr = `${prevYear}-${String(prevMonth).padStart(2, '0')}-${String(dayNum).padStart(2, '0')}`;
    result.push({
      dateStr,
      dayNumber: dayNum,
      isCurrentMonth: false,
      isToday: dateStr === today,
      isPast: dateStr < today,
      isFuture: dateStr > today,
    });
  }

  // 2. Current month days
  for (let day = 1; day <= daysInCurrentMonth; day++) {
    const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    result.push({
      dateStr,
      dayNumber: day,
      isCurrentMonth: true,
      isToday: dateStr === today,
      isPast: dateStr < today,
      isFuture: dateStr > today,
    });
  }

  // 3. Next month tail days (pad to multiple of 7, up to 35 or 42)
  const totalSoFar = result.length;
  const targetTotal = totalSoFar > 35 ? 42 : 35;
  const nextMonth = month === 12 ? 1 : month + 1;
  const nextYear = month === 12 ? year + 1 : year;
  const remaining = targetTotal - totalSoFar;

  for (let day = 1; day <= remaining; day++) {
    const dateStr = `${nextYear}-${String(nextMonth).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    result.push({
      dateStr,
      dayNumber: day,
      isCurrentMonth: false,
      isToday: dateStr === today,
      isPast: dateStr < today,
      isFuture: dateStr > today,
    });
  }

  return result;
}

/**
 * Returns an array of date strings for the past N days
 */
export function getPastDays(days: number): string[] {
  const dates: string[] = [];
  const now = new Date();
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(d.getDate() - i);
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    dates.push(`${y}-${m}-${day}`);
  }
  return dates;
}

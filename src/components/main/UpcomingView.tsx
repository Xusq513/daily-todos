import React, { useState } from 'react';
import { 
  CalendarClock, 
  Plus, 
  Check, 
  Trash2, 
  Clock, 
  CalendarRange, 
  Layers, 
  Sunrise, 
  Calendar as CalendarIcon 
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { useTodoStore } from '../../store/useTodoStore';
import { 
  getTodayDateStr, 
  getTomorrowDateStr, 
  getThisSundayDateStr,
  formatDateChinese, 
  formatDateRange, 
  getDaysRemaining 
} from '../../utils/date';
import { Priority, DateSchedule, TodoItem } from '../../types';
import { DatePickerPopover } from '../common/DatePickerPopover';
import { TimePickerPopover } from '../common/TimePickerPopover';
import { playSuccessChime } from '../../utils/sound';

export const UpcomingView: React.FC = () => {
  const { 
    upcomingTodos, 
    addTodo, 
    toggleTodo, 
    deleteTodo, 
    settings 
  } = useTodoStore();

  const [title, setTitle] = useState('');
  const [priority, setPriority] = useState<Priority>('medium');
  const [dueTime, setNewDueTime] = useState('');
  const [schedule, setSchedule] = useState<DateSchedule>({
    mode: 'specific',
    targetDate: getTomorrowDateStr(),
  });

  const today = getTodayDateStr();
  const tomorrow = getTomorrowDateStr();
  const thisSunday = getThisSundayDateStr();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || isSubmitting) return;

    setIsSubmitting(true);
    const res = await addTodo(
      title.trim(),
      priority,
      dueTime || undefined,
      'single_todo',
      {
        targetDate: schedule.mode === 'range' ? schedule.startDate : schedule.targetDate,
        startDate: schedule.mode === 'range' ? schedule.startDate : undefined,
        endDate: schedule.mode === 'range' ? schedule.endDate : undefined,
      }
    );
    setIsSubmitting(false);

    if (res.success) {
      setTitle('');
      setNewDueTime('');
    } else {
      alert(res.error || '创建待办失败，请重试');
    }
  };

  const handleToggle = (id: string) => {
    const willComplete = toggleTodo(id);
    if (willComplete) {
      if (settings.soundEnabled) playSuccessChime();
      if (settings.confettiEnabled) {
        confetti({
          particleCount: 35,
          spread: 45,
          origin: { y: 0.6 },
        });
      }
    }
  };

  // Group tasks into 4 clear buckets:
  // 1. activeRanges: startDate <= today && today <= endDate
  const activeRanges = upcomingTodos.filter((t) => t.startDate && t.endDate && t.startDate <= today && today <= t.endDate);

  // 2. tomorrowTasks: targetDate === tomorrow || (startDate === tomorrow)
  const tomorrowTasks = upcomingTodos.filter((t) => {
    if (activeRanges.includes(t)) return false;
    return t.targetDate === tomorrow || t.startDate === tomorrow;
  });

  // 3. thisWeekTasks: after tomorrow and <= thisSunday
  const thisWeekTasks = upcomingTodos.filter((t) => {
    if (activeRanges.includes(t) || tomorrowTasks.includes(t)) return false;
    const taskDate = t.startDate || t.targetDate;
    return taskDate > tomorrow && taskDate <= thisSunday;
  });

  // 4. laterTasks: > thisSunday
  const laterTasks = upcomingTodos.filter((t) => {
    if (activeRanges.includes(t) || tomorrowTasks.includes(t) || thisWeekTasks.includes(t)) return false;
    return true;
  });

  const renderTaskCard = (todo: TodoItem) => {
    const isRange = Boolean(todo.startDate && todo.endDate);
    const remainingDays = todo.endDate ? getDaysRemaining(todo.endDate) : todo.targetDate ? getDaysRemaining(todo.targetDate) : null;

    const priorityColors: Record<Priority, string> = {
      high: 'bg-rose-500',
      medium: 'bg-amber-400',
      low: 'bg-sky-400',
    };

    return (
      <div
        key={todo.id}
        className="group flex items-center justify-between p-3 rounded-2xl glass-card hover:shadow-md transition-all"
      >
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <button
            onClick={() => handleToggle(todo.id)}
            className={`w-5 h-5 rounded-full flex items-center justify-center transition-all ${
              todo.completed
                ? 'bg-emerald-500 text-white'
                : 'border-2 border-zinc-300 dark:border-zinc-600 hover:border-blue-500'
            }`}
          >
            {todo.completed && <Check size={12} strokeWidth={3} />}
          </button>

          <span className={`w-2 h-2 rounded-full shrink-0 ${priorityColors[todo.priority]}`} />

          <span
            className={`text-xs font-medium truncate flex-1 ${
              todo.completed ? 'line-through text-zinc-400' : 'text-zinc-800 dark:text-zinc-100'
            }`}
          >
            {todo.title}
          </span>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {/* Range badge */}
          {isRange ? (
            <span
              title={`有效时间: ${formatDateRange(todo.startDate, todo.endDate)}`}
              className="flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-lg bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 font-medium"
            >
              <CalendarRange size={11} />
              <span>{formatDateRange(todo.startDate, todo.endDate)}</span>
              {remainingDays !== null && (
                <b className="ml-1 opacity-90">({remainingDays === 0 ? '今日截止' : `剩${remainingDays}天`})</b>
              )}
            </span>
          ) : (
            <span className="flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-lg bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 font-medium">
              <CalendarIcon size={11} />
              <span>{formatDateChinese(todo.targetDate)}</span>
              {remainingDays !== null && remainingDays > 0 && (
                <span className="text-zinc-400 ml-0.5 font-normal">({remainingDays}天后)</span>
              )}
            </span>
          )}

          {/* Due Time */}
          {todo.dueTime && (
            <span className="flex items-center gap-0.5 text-[11px] text-zinc-400 px-1.5 py-0.5 font-mono">
              <Clock size={11} />
              {todo.dueTime}
            </span>
          )}

          {/* Delete */}
          <button
            onClick={() => deleteTodo(todo.id)}
            className="opacity-0 group-hover:opacity-100 p-1.5 text-zinc-400 hover:text-rose-500 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950/50 transition-all"
            title="删除"
          >
            <Trash2 size={13} />
          </button>
        </div>
      </div>
    );
  };

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden p-6 gap-6">
      {/* Header */}
      <div>
        <h2 className="text-xl font-bold text-zinc-800 dark:text-zinc-100 flex items-center gap-2">
          <span>日程排期与规划</span>
          <span className="text-xs font-normal px-2.5 py-1 rounded-full bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400">
            共 {upcomingTodos.length} 项未来待办
          </span>
        </h2>
        <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
          记录未来几天或时间范围内的待办事项，到了对应日期将自动推送到桌面悬浮小组件。
        </p>
      </div>

      {/* Add Upcoming Task Form */}
      <form 
        onSubmit={handleCreate}
        className="glass-panel p-4 rounded-2xl flex flex-wrap items-center gap-3 shadow-sm"
      >
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="安排未来某天或时间范围内的待办..."
          className="flex-1 min-w-[220px] px-3.5 py-2 rounded-xl bg-white/70 dark:bg-zinc-800/70 border border-zinc-200 dark:border-zinc-700/60 text-xs text-zinc-800 dark:text-zinc-100 placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-blue-500/30"
        />

        {/* Date Schedule Selector */}
        <DatePickerPopover schedule={schedule} onChange={setSchedule} />

        {/* Priority Select */}
        <select
          value={priority}
          onChange={(e) => setPriority(e.target.value as Priority)}
          className="px-3 py-2 rounded-xl bg-white/70 dark:bg-zinc-800/70 border border-zinc-200 dark:border-zinc-700/60 text-xs text-zinc-700 dark:text-zinc-200 focus:outline-none"
        >
          <option value="high">🔴 高优</option>
          <option value="medium">🟡 中优</option>
          <option value="low">🔵 低优</option>
        </select>

        {/* Due Time */}
        <TimePickerPopover
          value={dueTime}
          onChange={setNewDueTime}
          placeholder="提醒时间 (可选)"
          themeColor="blue"
        />

        {/* Submit */}
        <button
          type="submit"
          disabled={!title.trim()}
          className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-xl text-xs font-medium transition-all shadow-sm"
        >
          <Plus size={15} />
          <span>添加排期</span>
        </button>
      </form>

      {/* Task Groups */}
      <div className="flex-1 overflow-y-auto flex flex-col gap-6 pr-1">
        {upcomingTodos.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center p-12 text-zinc-400">
            <CalendarClock size={36} className="text-zinc-300 dark:text-zinc-600 mb-2" />
            <p className="text-sm font-medium">未来日程空空如也</p>
            <p className="text-xs text-zinc-400 mt-1">在上方安排未来某天或时间跨度内的阶段目标</p>
          </div>
        ) : (
          <>
            {/* 1. Active Ranges */}
            {activeRanges.length > 0 && (
              <div className="flex flex-col gap-2.5">
                <div className="flex items-center gap-2 text-xs font-bold text-blue-600 dark:text-blue-400">
                  <Layers size={14} />
                  <span>阶段进行中 (时间范围内 · 已常驻悬浮小组件)</span>
                  <span className="text-[11px] font-normal px-1.5 py-0.2 bg-blue-100 dark:bg-blue-950 rounded-full">
                    {activeRanges.length}
                  </span>
                </div>
                <div className="flex flex-col gap-2">
                  {activeRanges.map(renderTaskCard)}
                </div>
              </div>
            )}

            {/* 2. Tomorrow */}
            {tomorrowTasks.length > 0 && (
              <div className="flex flex-col gap-2.5">
                <div className="flex items-center gap-2 text-xs font-bold text-amber-600 dark:text-amber-400">
                  <Sunrise size={14} />
                  <span>明天安排 ({formatDateChinese(tomorrow)})</span>
                  <span className="text-[11px] font-normal px-1.5 py-0.2 bg-amber-100 dark:bg-amber-950 rounded-full">
                    {tomorrowTasks.length}
                  </span>
                </div>
                <div className="flex flex-col gap-2">
                  {tomorrowTasks.map(renderTaskCard)}
                </div>
              </div>
            )}

            {/* 3. This Week */}
            {thisWeekTasks.length > 0 && (
              <div className="flex flex-col gap-2.5">
                <div className="flex items-center gap-2 text-xs font-bold text-purple-600 dark:text-purple-400">
                  <CalendarIcon size={14} />
                  <span>本周稍后</span>
                  <span className="text-[11px] font-normal px-1.5 py-0.2 bg-purple-100 dark:bg-purple-950 rounded-full">
                    {thisWeekTasks.length}
                  </span>
                </div>
                <div className="flex flex-col gap-2">
                  {thisWeekTasks.map(renderTaskCard)}
                </div>
              </div>
            )}

            {/* 4. Later */}
            {laterTasks.length > 0 && (
              <div className="flex flex-col gap-2.5">
                <div className="flex items-center gap-2 text-xs font-bold text-zinc-600 dark:text-zinc-300">
                  <CalendarClock size={14} />
                  <span>未来更远</span>
                  <span className="text-[11px] font-normal px-1.5 py-0.2 bg-zinc-200 dark:bg-zinc-700 rounded-full">
                    {laterTasks.length}
                  </span>
                </div>
                <div className="flex flex-col gap-2">
                  {laterTasks.map(renderTaskCard)}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

import React, { useState } from 'react';
import { 
  Plus, 
  Check, 
  Trash2, 
  Clock, 
  Repeat, 
  CheckCircle2, 
  ListFilter,
  Flame,
  CalendarRange
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { useTodoStore } from '../../store/useTodoStore';
import { formatDateChinese, getTodayDateStr, formatDateRange, getDaysRemaining } from '../../utils/date';
import { Priority, TaskType, DateSchedule } from '../../types';
import { playSuccessChime } from '../../utils/sound';
import { DatePickerPopover } from '../common/DatePickerPopover';
import { TimePickerPopover } from '../common/TimePickerPopover';

export const TodayView: React.FC = () => {
  const { 
    todayTodos, 
    addTodo, 
    addHabitAndTodo,
    toggleTodo, 
    deleteTodo, 
    settings, 
    completedCount, 
    totalCount, 
    completionRate 
  } = useTodoStore();

  const [filter, setFilter] = useState<'all' | 'pending' | 'completed' | 'habits'>('all');
  const [newTitle, setNewTitle] = useState('');
  const [newPriority, setNewPriority] = useState<Priority>('medium');
  const [newDueTime, setNewDueTime] = useState('');
  const [newType, setNewType] = useState<TaskType>('single_todo');
  const [schedule, setSchedule] = useState<DateSchedule>({
    mode: 'today',
    targetDate: getTodayDateStr(),
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const todayStr = getTodayDateStr();

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim() || isSubmitting) return;

    setIsSubmitting(true);
    let res: { success: boolean; error?: string };
    if (newType === 'daily_habit') {
      res = await addHabitAndTodo(
        newTitle.trim(),
        newPriority,
        newDueTime || undefined
      );
    } else {
      res = await addTodo(
        newTitle.trim(), 
        newPriority, 
        newDueTime || undefined, 
        newType,
        {
          targetDate: schedule.mode === 'range' ? schedule.startDate : schedule.targetDate,
          startDate: schedule.mode === 'range' ? schedule.startDate : undefined,
          endDate: schedule.mode === 'range' ? schedule.endDate : undefined,
        }
      );
    }
    setIsSubmitting(false);

    if (res.success) {
      setNewTitle('');
      setNewDueTime('');
      setSchedule({ mode: 'today', targetDate: todayStr });
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
          particleCount: 40,
          spread: 50,
          origin: { y: 0.6 },
          colors: ['#3b82f6', '#10b981', '#f59e0b'],
        });
      }
    }
  };

  const filteredTodos = todayTodos.filter((t) => {
    if (filter === 'pending') return !t.completed;
    if (filter === 'completed') return t.completed;
    if (filter === 'habits') return t.type === 'daily_habit';
    return true;
  });

  const priorityLabels: Record<Priority, { label: string; bg: string; text: string }> = {
    high: { label: '高优', bg: 'bg-rose-50 dark:bg-rose-950/60', text: 'text-rose-600 dark:text-rose-400' },
    medium: { label: '中优', bg: 'bg-amber-50 dark:bg-amber-950/60', text: 'text-amber-600 dark:text-amber-400' },
    low: { label: '低优', bg: 'bg-sky-50 dark:bg-sky-950/60', text: 'text-sky-600 dark:text-sky-400' },
  };

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden p-6 gap-6">
      {/* Top Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-zinc-800 dark:text-zinc-100 flex items-center gap-2">
            <span>今日待办</span>
            <span className="text-xs font-normal px-2.5 py-1 rounded-full bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400">
              {formatDateChinese(todayStr)}
            </span>
          </h2>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
            专注当下每一刻，记录与完成今日任务及当前阶段事项
          </p>
        </div>

        {/* Stats Pills */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl glass-card">
            <CheckCircle2 size={16} className="text-emerald-500" />
            <span className="text-xs font-medium text-zinc-600 dark:text-zinc-300">
              完成率: <b className="text-zinc-900 dark:text-zinc-100">{completionRate}%</b>
            </span>
          </div>
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl glass-card">
            <Flame size={16} className="text-orange-500" />
            <span className="text-xs font-medium text-zinc-600 dark:text-zinc-300">
              达成: <b className="text-zinc-900 dark:text-zinc-100">{completedCount} / {totalCount}</b>
            </span>
          </div>
        </div>
      </div>

      {/* Quick Add Form */}
      <form 
        onSubmit={handleCreate}
        className="glass-panel p-4 rounded-2xl flex flex-wrap items-center gap-3 shadow-sm"
      >
        <input
          type="text"
          value={newTitle}
          onChange={(e) => setNewTitle(e.target.value)}
          placeholder="添加今日新任务或安排近期阶段事项..."
          className="flex-1 min-w-[220px] px-3.5 py-2 rounded-xl bg-white/70 dark:bg-zinc-800/70 border border-zinc-200 dark:border-zinc-700/60 text-xs text-zinc-800 dark:text-zinc-100 placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-blue-500/30"
        />

        {/* Date Schedule Selector */}
        <DatePickerPopover schedule={schedule} onChange={setSchedule} />

        {/* Priority Select */}
        <select
          value={newPriority}
          onChange={(e) => setNewPriority(e.target.value as Priority)}
          className="px-3 py-2 rounded-xl bg-white/70 dark:bg-zinc-800/70 border border-zinc-200 dark:border-zinc-700/60 text-xs text-zinc-700 dark:text-zinc-200 focus:outline-none"
        >
          <option value="high">🔴 高优先级</option>
          <option value="medium">🟡 中优先级</option>
          <option value="low">🔵 低优先级</option>
        </select>

        {/* Reminder Time */}
        <TimePickerPopover
          value={newDueTime}
          onChange={setNewDueTime}
          placeholder="提醒时间 (可选)"
          themeColor="blue"
        />

        {/* Task Type Switch */}
        <select
          value={newType}
          onChange={(e) => setNewType(e.target.value as TaskType)}
          className="px-3 py-2 rounded-xl bg-white/70 dark:bg-zinc-800/70 border border-zinc-200 dark:border-zinc-700/60 text-xs text-zinc-700 dark:text-zinc-200 focus:outline-none"
        >
          <option value="single_todo">单次待办</option>
          <option value="daily_habit">每日习惯</option>
        </select>

        {/* Add Button */}
        <button
          type="submit"
          disabled={!newTitle.trim()}
          className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-xl text-xs font-medium transition-all shadow-sm"
        >
          <Plus size={15} />
          <span>添加任务</span>
        </button>
      </form>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 border-b border-zinc-200 dark:border-zinc-800 pb-2">
        <ListFilter size={14} className="text-zinc-400" />
        <span className="text-xs text-zinc-400 mr-2">筛选:</span>
        {(['all', 'pending', 'completed', 'habits'] as const).map((fKey) => {
          const labels = {
            all: '全部',
            pending: '进行中',
            completed: '已完成',
            habits: '日常习惯',
          };
          return (
            <button
              key={fKey}
              onClick={() => setFilter(fKey)}
              className={`px-3 py-1 rounded-lg text-xs font-medium transition-all ${
                filter === fKey
                  ? 'bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 shadow-xs'
                  : 'text-zinc-600 dark:text-zinc-400 hover:bg-black/5 dark:hover:bg-white/5'
              }`}
            >
              {labels[fKey]}
            </button>
          );
        })}
      </div>

      {/* Todo Cards List */}
      <div className="flex-1 overflow-y-auto flex flex-col gap-2.5 pr-1">
        {filteredTodos.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center p-12 text-zinc-400">
            <p className="text-sm">暂无符合筛选条件的项目</p>
          </div>
        ) : (
          filteredTodos.map((todo) => {
            const isRange = Boolean(todo.startDate && todo.endDate);
            const remaining = todo.endDate ? getDaysRemaining(todo.endDate) : null;

            return (
              <div
                key={todo.id}
                className={`group flex items-center justify-between p-3.5 rounded-2xl transition-all ${
                  todo.completed
                    ? 'bg-zinc-100/60 dark:bg-zinc-900/40 opacity-60'
                    : 'glass-card hover:shadow-md'
                }`}
              >
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  {/* Custom Checkbox */}
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

                  {/* Title */}
                  <span
                    className={`text-sm font-medium truncate flex-1 ${
                      todo.completed
                        ? 'line-through text-zinc-400 dark:text-zinc-500'
                        : 'text-zinc-800 dark:text-zinc-100'
                    }`}
                  >
                    {todo.title}
                  </span>
                </div>

                {/* Tags and Operations */}
                <div className="flex items-center gap-2 shrink-0">
                  {/* Range Badge if Date Range Task */}
                  {isRange && remaining !== null && (
                    <span
                      title={`阶段跨度: ${formatDateRange(todo.startDate, todo.endDate)}`}
                      className={`flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-md font-medium ${
                        remaining <= 1
                          ? 'bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 font-bold animate-pulse-subtle'
                          : 'bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400'
                      }`}
                    >
                      <CalendarRange size={11} />
                      <span>{formatDateRange(todo.startDate, todo.endDate)}</span>
                      <span>({remaining === 0 ? '今日截止' : `剩${remaining}天`})</span>
                    </span>
                  )}

                  {/* Priority */}
                  <span
                    className={`text-[11px] px-2 py-0.5 rounded-md font-medium ${
                      priorityLabels[todo.priority].bg
                    } ${priorityLabels[todo.priority].text}`}
                  >
                    {priorityLabels[todo.priority].label}
                  </span>

                  {/* Habit indicator */}
                  {todo.type === 'daily_habit' && (
                    <span className="flex items-center gap-1 text-[11px] text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/60 px-2 py-0.5 rounded-md">
                      <Repeat size={11} />
                      日常
                    </span>
                  )}

                  {/* Due Time */}
                  {todo.dueTime && (
                    <span className="flex items-center gap-1 text-[11px] text-zinc-500 dark:text-zinc-400 bg-zinc-100 dark:bg-zinc-800 px-2 py-0.5 rounded-md font-mono">
                      <Clock size={11} />
                      {todo.dueTime}
                    </span>
                  )}

                  {/* Delete button */}
                  <button
                    onClick={() => deleteTodo(todo.id)}
                    className="opacity-0 group-hover:opacity-100 p-1.5 text-zinc-400 hover:text-rose-500 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950/50 transition-all"
                    title="删除"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

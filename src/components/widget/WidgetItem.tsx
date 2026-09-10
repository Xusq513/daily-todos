import React from 'react';
import { Check, Trash2, Repeat, Clock, CalendarRange } from 'lucide-react';
import confetti from 'canvas-confetti';
import { TodoItem } from '../../types';
import { useTodoStore } from '../../store/useTodoStore';
import { playSuccessChime } from '../../utils/sound';
import { getDaysRemaining, formatDateRange } from '../../utils/date';

interface WidgetItemProps {
  todo: TodoItem;
}

export const WidgetItem: React.FC<WidgetItemProps> = ({ todo }) => {
  const { toggleTodo, deleteTodo, settings, totalCount, completedCount } = useTodoStore();

  const handleToggle = (e: React.MouseEvent) => {
    e.stopPropagation();
    const willComplete = toggleTodo(todo.id);

    if (willComplete) {
      if (settings.soundEnabled) {
        playSuccessChime();
      }

      // If this completion brings completion to 100%, trigger celebratory confetti!
      if (settings.confettiEnabled) {
        const isLastOne = (completedCount + 1) >= totalCount;
        confetti({
          particleCount: isLastOne ? 60 : 25,
          spread: isLastOne ? 70 : 45,
          origin: { y: 0.75 },
          colors: ['#3b82f6', '#10b981', '#f59e0b', '#8b5cf6'],
          disableForReducedMotion: true,
        });
      }
    }
  };

  const priorityColors = {
    high: 'bg-rose-500',
    medium: 'bg-amber-400',
    low: 'bg-sky-400',
  };

  const isRangeTask = Boolean(todo.startDate && todo.endDate);
  const remainingDays = isRangeTask && todo.endDate ? getDaysRemaining(todo.endDate) : null;

  return (
    <div 
      className={`w-full group relative flex items-center justify-between gap-2.5 px-3 py-2 rounded-xl transition-all duration-200 ${
        todo.completed 
          ? 'bg-zinc-100/75 dark:bg-zinc-800/60 border border-black/5 dark:border-white/5 opacity-70' 
          : 'glass-card hover:bg-white/90 dark:hover:bg-zinc-800/75 shadow-xs'
      }`}
    >
      {/* Checkbox and Title */}
      <div className="flex items-center gap-2 flex-1 min-w-0">
        {/* Custom rounded checkbox */}
        <button
          onClick={handleToggle}
          className={`w-4 h-4 rounded-full flex items-center justify-center transition-all duration-200 shrink-0 ${
            todo.completed 
              ? 'bg-emerald-500 text-white shadow-xs' 
              : 'border-[1.5px] border-zinc-300 dark:border-zinc-600 hover:border-blue-500 dark:hover:border-blue-400'
          }`}
        >
          {todo.completed && <Check size={11} strokeWidth={3} className="animate-bounce-short" />}
        </button>

        {/* Priority dot */}
        <span 
          title={`优先级: ${todo.priority}`} 
          className={`w-2 h-2 rounded-full shrink-0 ${priorityColors[todo.priority]}`} 
        />

        {/* Text Title */}
        <span 
          title={todo.title}
          className={`text-xs font-medium truncate flex-1 min-w-0 text-zinc-800 dark:text-zinc-100 transition-all ${
            todo.completed ? 'line-through text-zinc-400 dark:text-zinc-500' : ''
          }`}
        >
          {todo.title}
        </span>
      </div>

      {/* Badges and Actions */}
      <div className="flex items-center gap-1.5 shrink-0">
        {/* Habit Tag */}
        {todo.type === 'daily_habit' && (
          <span 
            title="每日循环日常" 
            className="flex items-center gap-0.5 text-[10px] text-indigo-600 dark:text-indigo-400 bg-indigo-50/80 dark:bg-indigo-950/60 px-1.5 py-0.5 rounded-md font-medium"
          >
            <Repeat size={10} />
            <span className="hidden group-hover:inline transition-all">日常</span>
          </span>
        )}

        {/* Range Badge if Date Range Task */}
        {isRangeTask && remainingDays !== null && (
          <span
            title={`时间跨度: ${formatDateRange(todo.startDate, todo.endDate)}`}
            className={`flex items-center gap-0.5 text-[10px] px-1.5 py-0.5 rounded-md font-medium ${
              remainingDays < 0
                ? 'bg-rose-50 text-rose-600 dark:bg-rose-950/60 dark:text-rose-400'
                : remainingDays <= 1
                ? 'bg-amber-50 text-amber-600 dark:bg-amber-950/60 dark:text-amber-400 font-bold animate-pulse-subtle'
                : 'bg-blue-50 text-blue-600 dark:bg-blue-950/60 dark:text-blue-400'
            }`}
          >
            <CalendarRange size={10} />
            <span>
              {remainingDays < 0 ? `逾期${Math.abs(remainingDays)}天` : remainingDays === 0 ? '今日截止' : `剩${remainingDays}天`}
            </span>
          </span>
        )}

        {/* Due Time */}
        {todo.dueTime && (
          <span className="flex items-center gap-0.5 text-[10px] text-zinc-500 dark:text-zinc-400 bg-zinc-100/80 dark:bg-zinc-800/80 px-1.5 py-0.5 rounded-md font-mono">
            <Clock size={10} />
            {todo.dueTime}
          </span>
        )}

        {/* Delete action on hover */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            deleteTodo(todo.id);
          }}
          title="删除该待办"
          className="opacity-0 group-hover:opacity-100 p-1 text-zinc-400 hover:text-rose-500 rounded-md transition-all"
        >
          <Trash2 size={12} />
        </button>
      </div>
    </div>
  );
};

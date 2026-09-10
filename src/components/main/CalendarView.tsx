import React, { useState } from 'react';
import { 
  ChevronLeft, 
  ChevronRight, 
  Check, 
  Trash2, 
  Clock, 
  CalendarRange, 
  Plus, 
  Calendar as CalendarIcon
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { useTodoStore } from '../../store/useTodoStore';
import { 
  getTodayDateStr, 
  getMonthGrid, 
  getTasksForDate, 
  formatDateFullChinese, 
  formatDateRange 
} from '../../utils/date';
import { Priority } from '../../types';
import { playSuccessChime } from '../../utils/sound';
import { TimePickerPopover } from '../common/TimePickerPopover';

export const CalendarView: React.FC = () => {
  const { todos, addTodo, toggleTodo, deleteTodo, settings } = useTodoStore();
  const today = getTodayDateStr();

  const [currentYear, setCurrentYear] = useState(() => new Date().getFullYear());
  const [currentMonth, setCurrentMonth] = useState(() => new Date().getMonth() + 1);
  const [selectedDate, setSelectedDate] = useState<string>(today);

  // Quick add form state for the selected date
  const [quickTitle, setQuickTitle] = useState('');
  const [quickPriority, setQuickPriority] = useState<Priority>('medium');
  const [quickDueTime, setQuickDueTime] = useState('');

  // Month navigation
  const handlePrevMonth = () => {
    if (currentMonth === 1) {
      setCurrentYear(currentYear - 1);
      setCurrentMonth(12);
    } else {
      setCurrentMonth(currentMonth - 1);
    }
  };

  const handleNextMonth = () => {
    if (currentMonth === 12) {
      setCurrentYear(currentYear + 1);
      setCurrentMonth(1);
    } else {
      setCurrentMonth(currentMonth + 1);
    }
  };

  const handleGoToday = () => {
    const now = new Date();
    setCurrentYear(now.getFullYear());
    setCurrentMonth(now.getMonth() + 1);
    setSelectedDate(today);
  };

  const handleSelectDay = (dateStr: string) => {
    setSelectedDate(dateStr);
    const [y, m] = dateStr.split('-');
    const yearNum = Number(y);
    const monthNum = Number(m);
    if (yearNum !== currentYear || monthNum !== currentMonth) {
      setCurrentYear(yearNum);
      setCurrentMonth(monthNum);
    }
  };

  // Add task for the selected date
  const handleAddForSelectedDate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickTitle.trim()) return;

    addTodo(
      quickTitle.trim(),
      quickPriority,
      quickDueTime || undefined,
      'single_todo',
      { targetDate: selectedDate }
    );

    setQuickTitle('');
    setQuickDueTime('');
  };

  const handleToggle = (id: string) => {
    const willComplete = toggleTodo(id);
    if (willComplete) {
      if (settings.soundEnabled) playSuccessChime();
      if (settings.confettiEnabled) {
        confetti({
          particleCount: 30,
          spread: 40,
          origin: { y: 0.6 },
        });
      }
    }
  };

  const calendarDays = getMonthGrid(currentYear, currentMonth);
  const selectedDateTasks = getTasksForDate(todos, selectedDate);
  const selectedDateCompleted = selectedDateTasks.filter((t) => t.completed).length;
  const selectedDateTotal = selectedDateTasks.length;

  const priorityCycle: Record<Priority, Priority> = {
    low: 'medium',
    medium: 'high',
    high: 'low',
  };

  const priorityMeta: Record<Priority, { color: string; label: string }> = {
    high: { color: 'bg-rose-500', label: '高优' },
    medium: { color: 'bg-amber-400', label: '中优' },
    low: { color: 'bg-sky-400', label: '低优' },
  };

  const weekHeaders = ['一', '二', '三', '四', '五', '六', '日'];

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden p-5 gap-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-zinc-800 dark:text-zinc-100 flex items-center gap-2">
            <span>日程日历看板</span>
            <span className="text-xs font-normal px-2.5 py-0.5 rounded-full bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400">
              过去打卡 · 未来规划
            </span>
          </h2>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
            在全局月历中总览每一天的待办与时间跨度安排，点击任意日期即可回顾与即时排期。
          </p>
        </div>

        {/* Legend */}
        <div className="flex items-center gap-3 text-[11px] text-zinc-500 dark:text-zinc-400">
          <div className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
            <span>已达成</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-blue-500" />
            <span>计划任务</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-purple-500" />
            <span>跨期阶段</span>
          </div>
        </div>
      </div>

      {/* Main Content Area: Left Calendar Grid + Right Day Details */}
      <div className="flex-1 flex gap-4 overflow-hidden min-h-0">
        {/* Left: Interactive Month Calendar */}
        <div className="flex-1 glass-panel p-4 rounded-3xl flex flex-col gap-2.5 shadow-sm overflow-hidden min-h-0">
          {/* Calendar Top Controls */}
          <div className="flex items-center justify-between px-1 shrink-0">
            {/* Year & Month Title with Nav */}
            <div className="flex items-center gap-2">
              <button
                onClick={handlePrevMonth}
                title="上个月"
                className="p-1.5 rounded-xl hover:bg-black/5 dark:hover:bg-white/10 text-zinc-600 dark:text-zinc-300 transition-colors"
              >
                <ChevronLeft size={16} />
              </button>

              <span className="text-sm font-bold text-zinc-800 dark:text-zinc-100 min-w-[110px] text-center">
                {currentYear}年 {currentMonth}月
              </span>

              <button
                onClick={handleNextMonth}
                title="下个月"
                className="p-1.5 rounded-xl hover:bg-black/5 dark:hover:bg-white/10 text-zinc-600 dark:text-zinc-300 transition-colors"
              >
                <ChevronRight size={16} />
              </button>
            </div>

            {/* Jump to Today Button */}
            <button
              onClick={handleGoToday}
              className="px-3 py-1 rounded-xl text-xs font-semibold bg-white/80 dark:bg-zinc-800/80 border border-zinc-200 dark:border-zinc-700 hover:bg-blue-50 dark:hover:bg-blue-950/60 hover:text-blue-600 dark:hover:text-blue-400 text-zinc-700 dark:text-zinc-300 transition-all shadow-xs"
            >
              返回今天
            </button>
          </div>

          {/* Weekday Header */}
          <div className="grid grid-cols-7 gap-1.5 text-center font-semibold text-xs text-zinc-400 dark:text-zinc-500 py-1 border-b border-black/5 dark:border-white/5 shrink-0">
            {weekHeaders.map((w, idx) => (
              <span key={w} className={idx >= 5 ? 'text-amber-500/80' : ''}>
                周{w}
              </span>
            ))}
          </div>

          {/* 7-column x 6-row Balanced Calendar Cells */}
          <div className="flex-1 grid grid-cols-7 grid-rows-6 gap-1.5 min-h-0 overflow-hidden">
            {calendarDays.map((day) => {
              const dayTasks = getTasksForDate(todos, day.dateStr);
              const hasTasks = dayTasks.length > 0;
              const completedCount = dayTasks.filter((t) => t.completed).length;
              const isAllDone = hasTasks && completedCount === dayTasks.length;
              const isSelected = day.dateStr === selectedDate;

              // Check if any task is a range task spanning this day
              const hasRangeTask = dayTasks.some((t) => t.startDate && t.endDate);

              return (
                <button
                  key={day.dateStr}
                  onClick={() => handleSelectDay(day.dateStr)}
                  className={`relative p-1 rounded-xl flex flex-col items-center justify-center gap-1 transition-all h-full w-full min-h-0 ${
                    !day.isCurrentMonth
                      ? 'opacity-25 hover:opacity-60'
                      : 'hover:bg-black/5 dark:hover:bg-white/10'
                  } ${
                    isSelected
                      ? 'ring-2 ring-blue-600 bg-blue-50/90 dark:bg-blue-950/60 shadow-xs z-10'
                      : 'glass-card'
                  } ${
                    day.isToday && !isSelected
                      ? 'border border-blue-500/80 dark:border-blue-400/80 bg-blue-50/30'
                      : ''
                  }`}
                >
                  {/* Top: Day Number & Completion/Task Badge */}
                  <div className="flex items-center justify-center gap-1 w-full px-0.5">
                    <span
                      className={`text-xs font-bold leading-none ${
                        day.isToday
                          ? 'w-5 h-5 rounded-full bg-blue-600 text-white flex items-center justify-center text-[11px] shadow-xs'
                          : day.isCurrentMonth
                          ? 'text-zinc-800 dark:text-zinc-100'
                          : 'text-zinc-400 dark:text-zinc-600'
                      }`}
                    >
                      {day.dayNumber}
                    </span>

                    {/* Completion rate or Task Count Badge */}
                    {hasTasks && (
                      <span
                        className={`text-[9px] px-1 py-0.2 rounded font-bold leading-tight shrink-0 ${
                          isAllDone
                            ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300'
                            : day.isPast
                            ? 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300'
                            : 'bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300'
                        }`}
                      >
                        {day.isPast || day.isToday
                          ? `${completedCount}/${dayTasks.length}`
                          : `${dayTasks.length}项`}
                      </span>
                    )}
                  </div>

                  {/* Bottom: Range indicator & Priority Dots */}
                  <div className="flex items-center justify-center gap-1 h-2 w-full">
                    {hasRangeTask && (
                      <span className="w-2.5 h-1 bg-purple-500 rounded-full shrink-0" title="阶段跨期任务" />
                    )}

                    {hasTasks && (
                      <div className="flex items-center gap-0.5">
                        {dayTasks.slice(0, 3).map((t) => (
                          <span
                            key={t.id}
                            className={`w-1.5 h-1.5 rounded-full shrink-0 ${
                              t.completed
                                ? 'bg-emerald-500'
                                : priorityMeta[t.priority].color
                            }`}
                          />
                        ))}
                        {dayTasks.length > 3 && (
                          <span className="text-[8px] text-zinc-400 font-bold leading-none">+</span>
                        )}
                      </div>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Right: Selected Date Detail & Quick Add Panel */}
        <div className="w-72 glass-panel p-4 rounded-3xl flex flex-col gap-3 shadow-sm overflow-hidden shrink-0 min-h-0">
          {/* Selected Date Header */}
          <div className="border-b border-black/5 dark:border-white/10 pb-2.5 shrink-0">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-zinc-800 dark:text-zinc-100 flex items-center gap-1.5">
                <CalendarIcon size={15} className="text-blue-500" />
                <span>{formatDateFullChinese(selectedDate)}</span>
              </h3>
              {selectedDate === today && (
                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-blue-600 text-white">
                  今天
                </span>
              )}
            </div>

            <div className="flex items-center justify-between mt-1 text-[11px] text-zinc-400">
              <span>共 {selectedDateTotal} 项任务安排</span>
              {selectedDateTotal > 0 && (
                <span className="text-emerald-600 dark:text-emerald-400 font-semibold">
                  已完成 {selectedDateCompleted} 项
                </span>
              )}
            </div>
          </div>

          {/* Task List for Selected Date */}
          <div className="flex-1 overflow-y-auto flex flex-col gap-2 pr-1 min-h-0">
            {selectedDateTasks.length === 0 ? (
              <div className="flex-1 flex flex-col items-center justify-center p-6 text-zinc-400 text-center select-none">
                <Clock size={22} className="opacity-40 mb-1.5" />
                <p className="text-xs font-medium">该日暂无待办安排</p>
                <p className="text-[10px] mt-0.5 text-zinc-400">在下方输入框敲一条为该日排期</p>
              </div>
            ) : (
              selectedDateTasks.map((todo) => {
                const isRange = Boolean(todo.startDate && todo.endDate);
                return (
                  <div
                    key={todo.id}
                    className={`group flex items-center justify-between p-2.5 rounded-xl glass-card transition-all ${
                      todo.completed ? 'opacity-55' : 'hover:shadow-sm'
                    }`}
                  >
                    <div className="flex items-center gap-2 flex-1 min-w-0">
                      <button
                        onClick={() => handleToggle(todo.id)}
                        className={`w-4 h-4 rounded-full flex items-center justify-center transition-all shrink-0 ${
                          todo.completed
                            ? 'bg-emerald-500 text-white'
                            : 'border-[1.5px] border-zinc-300 dark:border-zinc-600 hover:border-blue-500'
                        }`}
                      >
                        {todo.completed && <Check size={10} strokeWidth={3} />}
                      </button>

                      <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${priorityMeta[todo.priority].color}`} />

                      <span
                        className={`text-xs truncate flex-1 ${
                          todo.completed
                            ? 'line-through text-zinc-400 dark:text-zinc-500'
                            : 'text-zinc-800 dark:text-zinc-100'
                        }`}
                      >
                        {todo.title}
                      </span>
                    </div>

                    <div className="flex items-center gap-1 shrink-0">
                      {isRange && (
                        <span
                          title={`阶段范围: ${formatDateRange(todo.startDate, todo.endDate)}`}
                          className="flex items-center gap-0.5 text-[9px] px-1 py-0.5 rounded bg-purple-50 text-purple-600 dark:bg-purple-950 dark:text-purple-400"
                        >
                          <CalendarRange size={9} />
                          <span>阶段</span>
                        </span>
                      )}

                      {todo.type === 'daily_habit' && (
                        <span className="text-[9px] text-indigo-600 dark:text-indigo-400 px-1">
                          日常
                        </span>
                      )}

                      {todo.dueTime && (
                        <span className="text-[10px] text-zinc-400 font-mono px-1">
                          {todo.dueTime}
                        </span>
                      )}

                      <button
                        onClick={() => deleteTodo(todo.id)}
                        className="opacity-0 group-hover:opacity-100 p-1 text-zinc-400 hover:text-rose-500 transition-opacity"
                        title="删除"
                      >
                        <Trash2 size={12} />
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Quick Add Form for this specific selected Date */}
          <form
            onSubmit={handleAddForSelectedDate}
            className="pt-2 border-t border-black/5 dark:border-white/10 flex flex-col gap-1.5 shrink-0"
          >
            <div className="flex items-center gap-1.5 bg-white/70 dark:bg-zinc-800/70 border border-black/10 dark:border-white/10 rounded-xl px-2.5 py-1.5 shadow-xs focus-within:ring-2 focus-within:ring-blue-500/30">
              <button
                type="button"
                onClick={() => setQuickPriority(priorityCycle[quickPriority])}
                title={`优先级: ${priorityMeta[quickPriority].label} (点击切换)`}
                className="p-0.5 hover:opacity-80 shrink-0"
              >
                <span className={`w-2 h-2 rounded-full block ${priorityMeta[quickPriority].color}`} />
              </button>

              <input
                type="text"
                value={quickTitle}
                onChange={(e) => setQuickTitle(e.target.value)}
                placeholder={`为该日添加待办，按 Enter...`}
                className="flex-1 min-w-0 bg-transparent text-xs text-zinc-800 dark:text-zinc-100 placeholder-zinc-400 focus:outline-none"
              />

              <TimePickerPopover
                value={quickDueTime}
                onChange={setQuickDueTime}
                compact
                align="right"
                placement="top"
                placeholder="时间"
                themeColor="blue"
              />

              <button
                type="submit"
                disabled={!quickTitle.trim()}
                className="p-1 text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-40 rounded-lg transition-all shadow-xs shrink-0"
              >
                <Plus size={13} />
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

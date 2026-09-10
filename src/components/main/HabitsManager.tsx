import React, { useState } from 'react';
import { Plus, Trash2, Repeat, Flame, Clock, Calendar, Archive, RotateCcw, ChevronDown, ChevronRight } from 'lucide-react';
import { useTodoStore } from '../../store/useTodoStore';
import { Priority } from '../../types';
import { TimePickerPopover } from '../common/TimePickerPopover';

export const HabitsManager: React.FC = () => {
  const { 
    activeHabits, 
    archivedHabits, 
    addHabit, 
    archiveHabit, 
    unarchiveHabit, 
    deleteHabitPermanently 
  } = useTodoStore();

  const [newTitle, setNewTitle] = useState('');
  const [newPriority, setNewPriority] = useState<Priority>('medium');
  const [newDueTime, setNewDueTime] = useState('');
  const [activeDays, setActiveDays] = useState<number[]>([1, 2, 3, 4, 5]); // default Mon-Fri
  const [showArchived, setShowArchived] = useState(false);

  const weekDayLabels = [
    { day: 1, label: '一' },
    { day: 2, label: '二' },
    { day: 3, label: '三' },
    { day: 4, label: '四' },
    { day: 5, label: '五' },
    { day: 6, label: '六' },
    { day: 0, label: '日' },
  ];

  const toggleDay = (day: number) => {
    if (activeDays.includes(day)) {
      if (activeDays.length > 1) {
        setActiveDays(activeDays.filter((d) => d !== day));
      }
    } else {
      setActiveDays([...activeDays, day]);
    }
  };
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim() || isSubmitting) return;

    setIsSubmitting(true);
    const res = await addHabit(newTitle.trim(), newPriority, newDueTime || undefined, activeDays);
    setIsSubmitting(false);

    if (res.success) {
      setNewTitle('');
      setNewDueTime('');
    } else {
      alert(res.error || '创建习惯失败，请重试');
    }
  };

  const handlePermanentDelete = (id: string, title: string) => {
    if (window.confirm(`确定要彻底删除习惯「${title}」吗？\n警告：这将连同该习惯在日历中的所有过往打卡记录一并删除！`)) {
      deleteHabitPermanently(id);
    }
  };

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden p-6 gap-6">
      {/* Header */}
      <div>
        <h2 className="text-xl font-bold text-zinc-800 dark:text-zinc-100 flex items-center gap-2">
          <span>每日循环习惯管理</span>
          <span className="text-xs font-normal px-2.5 py-1 rounded-full bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400">
            自动每日重置 · 历史保护
          </span>
        </h2>
        <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
          配置你每天需要坚持打卡的固定事项，每天零点系统将自动生成当天的打卡清单。删除习惯默认进行软归档，历史记录完好保存。
        </p>
      </div>

      {/* Add Habit Card */}
      <form
        onSubmit={handleAdd}
        className="glass-panel p-4 rounded-2xl flex flex-col gap-3 shadow-sm"
      >
        <div className="flex flex-wrap items-center gap-3">
          <input
            type="text"
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
            placeholder="输入新习惯名称，例如：晨跑 30 分钟、背单词、复盘日志..."
            className="flex-1 min-w-[240px] px-3.5 py-2 rounded-xl bg-white/70 dark:bg-zinc-800/70 border border-zinc-200 dark:border-zinc-700/60 text-xs text-zinc-800 dark:text-zinc-100 placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-blue-500/30"
          />

          <select
            value={newPriority}
            onChange={(e) => setNewPriority(e.target.value as Priority)}
            className="px-3 py-2 rounded-xl bg-white/70 dark:bg-zinc-800/70 border border-zinc-200 dark:border-zinc-700/60 text-xs text-zinc-700 dark:text-zinc-200 focus:outline-none"
          >
            <option value="high">🔴 高优</option>
            <option value="medium">🟡 中优</option>
            <option value="low">🔵 低优</option>
          </select>

          <TimePickerPopover
            value={newDueTime}
            onChange={setNewDueTime}
            placeholder="打卡时间 (可选)"
            themeColor="indigo"
          />

          <button
            type="submit"
            disabled={!newTitle.trim()}
            className="flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded-xl text-xs font-medium transition-all shadow-sm"
          >
            <Plus size={15} />
            <span>创建习惯</span>
          </button>
        </div>

        {/* Active Days Toggle */}
        <div className="flex items-center gap-2 pt-1 text-xs text-zinc-500">
          <span className="flex items-center gap-1">
            <Calendar size={13} />
            生效周期:
          </span>
          <div className="flex items-center gap-1.5">
            {weekDayLabels.map(({ day, label }) => {
              const isSelected = activeDays.includes(day);
              return (
                <button
                  key={day}
                  type="button"
                  onClick={() => toggleDay(day)}
                  className={`w-6 h-6 rounded-lg text-xs font-medium transition-all ${
                    isSelected
                      ? 'bg-indigo-600 text-white shadow-xs'
                      : 'bg-black/5 dark:bg-white/5 text-zinc-500 hover:text-zinc-800'
                  }`}
                >
                  {label}
                </button>
              );
            })}
            <button
              type="button"
              onClick={() => setActiveDays([0, 1, 2, 3, 4, 5, 6])}
              className="text-[11px] text-indigo-600 dark:text-indigo-400 ml-2 hover:underline"
            >
              每天
            </button>
            <button
              type="button"
              onClick={() => setActiveDays([1, 2, 3, 4, 5])}
              className="text-[11px] text-indigo-600 dark:text-indigo-400 ml-1 hover:underline"
            >
              工作日
            </button>
          </div>
        </div>
      </form>

      {/* Active Habits List */}
      <div className="flex-1 overflow-y-auto flex flex-col gap-3 pr-1">
        {activeHabits.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center p-12 text-zinc-400">
            <Repeat size={32} className="text-zinc-300 dark:text-zinc-600 mb-2" />
            <p className="text-sm">暂无进行中的习惯</p>
            <p className="text-xs text-zinc-400 mt-1">在上方创建属于你的日常自律清单</p>
          </div>
        ) : (
          activeHabits.map((habit) => (
            <div
              key={habit.id}
              className="glass-card p-4 rounded-2xl flex items-center justify-between hover:shadow-md transition-all group"
            >
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-indigo-50 dark:bg-indigo-950/70 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-bold">
                  <Repeat size={18} />
                </div>
                <div>
                  <h4 className="text-sm font-semibold text-zinc-800 dark:text-zinc-100">
                    {habit.title}
                  </h4>
                  <div className="flex items-center gap-2 mt-1 text-[11px] text-zinc-400">
                    {habit.dueTime && (
                      <span className="flex items-center gap-1 font-mono">
                        <Clock size={11} />
                        {habit.dueTime}
                      </span>
                    )}
                    <span>
                      生效日: {habit.activeDays.length === 7 ? '每天' : `${habit.activeDays.length} 天/周`}
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3">
                {/* Streak */}
                <div className="flex items-center gap-1 text-xs font-bold text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/50 px-2.5 py-1 rounded-xl">
                  <Flame size={14} className="fill-amber-500 text-amber-500" />
                  <span>连续 {habit.streak} 天</span>
                </div>

                {/* Archive Button (Soft Delete) */}
                <button
                  onClick={() => archiveHabit(habit.id)}
                  className="opacity-0 group-hover:opacity-100 p-2 text-zinc-400 hover:text-amber-600 rounded-xl hover:bg-amber-50 dark:hover:bg-amber-950/50 transition-all flex items-center gap-1 text-xs"
                  title="归档此习惯（保留历史记录，未来不再生成）"
                >
                  <Archive size={15} />
                  <span className="hidden sm:inline">归档</span>
                </button>
              </div>
            </div>
          ))
        )}

        {/* Archived Habits Collapsible Section */}
        {archivedHabits.length > 0 && (
          <div className="mt-4 pt-4 border-t border-zinc-200/60 dark:border-zinc-800">
            <button
              onClick={() => setShowArchived(!showArchived)}
              className="flex items-center gap-2 text-xs font-semibold text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200 transition-colors mb-3"
            >
              {showArchived ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
              <span>已归档的习惯 ({archivedHabits.length})</span>
            </button>

            {showArchived && (
              <div className="flex flex-col gap-2">
                {archivedHabits.map((habit) => (
                  <div
                    key={habit.id}
                    className="p-3 rounded-xl bg-zinc-50 dark:bg-zinc-900/50 border border-zinc-200/50 dark:border-zinc-800/50 flex items-center justify-between opacity-80 hover:opacity-100 transition-opacity"
                  >
                    <div className="flex items-center gap-2.5">
                      <Archive size={15} className="text-zinc-400" />
                      <div>
                        <span className="text-xs font-medium text-zinc-700 dark:text-zinc-300 line-through">
                          {habit.title}
                        </span>
                        <span className="text-[10px] text-zinc-400 block">已归档 · 历史记录已保存</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => unarchiveHabit(habit.id)}
                        className="flex items-center gap-1 px-2.5 py-1 text-xs font-medium text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-950/50 rounded-lg transition-all"
                        title="恢复此习惯"
                      >
                        <RotateCcw size={13} />
                        <span>恢复</span>
                      </button>

                      <button
                        onClick={() => handlePermanentDelete(habit.id, habit.title)}
                        className="flex items-center gap-1 px-2.5 py-1 text-xs font-medium text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/50 rounded-lg transition-all"
                        title="彻底永久删除（连同历史打卡）"
                      >
                        <Trash2 size={13} />
                        <span>彻底删除</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

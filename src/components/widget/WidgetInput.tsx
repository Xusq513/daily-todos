import React, { useState } from 'react';
import { Plus } from 'lucide-react';
import { useTodoStore } from '../../store/useTodoStore';
import { Priority } from '../../types';
import { TimePickerPopover } from '../common/TimePickerPopover';

export const WidgetInput: React.FC = () => {
  const { addTodo } = useTodoStore();
  const [title, setTitle] = useState('');
  const [priority, setPriority] = useState<Priority>('medium');
  const [dueTime, setDueTime] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || isSubmitting) return;

    setIsSubmitting(true);
    const res = await addTodo(
      title.trim(), 
      priority, 
      dueTime || undefined, 
      'single_todo'
    );
    setIsSubmitting(false);

    if (res.success) {
      setTitle('');
      setDueTime('');
    } else {
      alert(res.error || '创建待办失败，请重试');
    }
  };

  const cyclePriority = () => {
    const cycle: Record<Priority, Priority> = {
      low: 'medium',
      medium: 'high',
      high: 'low',
    };
    setPriority(cycle[priority]);
  };

  const priorityMeta = {
    high: { color: 'bg-rose-500', label: '高优' },
    medium: { color: 'bg-amber-400', label: '中优' },
    low: { color: 'bg-sky-400', label: '低优' },
  };

  return (
    <form 
      onSubmit={handleSubmit}
      className="p-2.5 pt-1.5 border-t border-black/5 dark:border-white/10 flex flex-col gap-1.5 no-drag"
    >
      <div className="flex items-center gap-2 bg-white/60 dark:bg-zinc-800/60 border border-black/5 dark:border-white/10 rounded-xl px-2.5 py-1.5 shadow-xs focus-within:ring-2 focus-within:ring-blue-500/30 transition-all">
        {/* Priority Quick Cycle Button */}
        <button
          type="button"
          onClick={cyclePriority}
          title={`当前优先级: ${priorityMeta[priority].label} (点击切换)`}
          className="flex items-center gap-1 p-0.5 text-zinc-500 dark:text-zinc-400 hover:opacity-80 transition-opacity shrink-0"
        >
          <span className={`w-2 h-2 rounded-full ${priorityMeta[priority].color}`} />
        </button>

        {/* Input */}
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="随手记今日待办，按 Enter 创建..."
          className="flex-1 min-w-0 bg-transparent text-xs text-zinc-800 dark:text-zinc-100 placeholder-zinc-400 dark:placeholder-zinc-500 focus:outline-none"
        />

        {/* Optional Time Picker */}
        <TimePickerPopover
          value={dueTime}
          onChange={setDueTime}
          compact
          align="right"
          placement="top"
          placeholder="时间"
          themeColor="blue"
        />

        {/* Submit button */}
        <button
          type="submit"
          disabled={!title.trim()}
          className="p-1 text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-40 disabled:hover:bg-blue-600 rounded-lg transition-all shadow-xs shrink-0"
        >
          <Plus size={14} />
        </button>
      </div>
    </form>
  );
};

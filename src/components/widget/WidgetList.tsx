import React from 'react';
import { CheckCheck, Coffee } from 'lucide-react';
import { useTodoStore } from '../../store/useTodoStore';
import { WidgetItem } from './WidgetItem';

export const WidgetList: React.FC = () => {
  const { todayTodos } = useTodoStore();

  const activeTodos = todayTodos.filter((t) => !t.completed);
  const completedTodos = todayTodos.filter((t) => t.completed);

  if (todayTodos.length === 0) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-6 text-center text-zinc-400 dark:text-zinc-500 select-none">
        <div className="w-10 h-10 rounded-full bg-black/5 dark:bg-white/5 flex items-center justify-center mb-2 text-zinc-400">
          <Coffee size={20} />
        </div>
        <p className="text-xs font-medium text-zinc-600 dark:text-zinc-400">今日暂无待办事项</p>
        <p className="text-[11px] mt-0.5 text-zinc-400 dark:text-zinc-500">在下方随手写下新任务开启高效一天</p>
      </div>
    );
  }

  return (
    <div className="w-full flex-1 overflow-y-auto px-2.5 py-1 flex flex-col gap-1.5 select-none no-drag">
      {/* Active items */}
      {activeTodos.map((todo) => (
        <WidgetItem key={todo.id} todo={todo} />
      ))}

      {/* Completed Section divider if any completed */}
      {completedTodos.length > 0 && (
        <div className="w-full pt-2">
          <div className="flex items-center gap-1.5 px-2 pb-1 text-[10px] font-semibold text-zinc-400 dark:text-zinc-500">
            <CheckCheck size={11} />
            <span>已完成 ({completedTodos.length})</span>
          </div>
          <div className="w-full flex flex-col gap-1.5">
            {completedTodos.map((todo) => (
              <WidgetItem key={todo.id} todo={todo} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

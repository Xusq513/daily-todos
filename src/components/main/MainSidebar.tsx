import React from 'react';
import { 
  CheckSquare, 
  CalendarClock,
  Calendar, 
  Repeat, 
  Settings, 
  Sparkles,
  Layers
} from 'lucide-react';
import { useTodoStore } from '../../store/useTodoStore';
import { closeMainAndShowWidget } from '../../utils/tauriBridge';

export type MainTab = 'today' | 'upcoming' | 'habits' | 'calendar' | 'settings';

interface MainSidebarProps {
  currentTab: MainTab;
  onSelectTab: (tab: MainTab) => void;
  onBackToWidget?: () => void;
}

export const MainSidebar: React.FC<MainSidebarProps> = ({ 
  currentTab, 
  onSelectTab, 
  onBackToWidget 
}) => {
  const { completionRate, completedCount, totalCount, upcomingTodos } = useTodoStore();

  const navItems = [
    { id: 'today' as MainTab, label: '今日待办', icon: CheckSquare, badge: null },
    { 
      id: 'upcoming' as MainTab, 
      label: '日程排期', 
      icon: CalendarClock, 
      badge: upcomingTodos.length > 0 ? upcomingTodos.length : null 
    },
    { id: 'habits' as MainTab, label: '循环习惯', icon: Repeat, badge: null },
    { id: 'calendar' as MainTab, label: '日程日历', icon: Calendar, badge: null },
    { id: 'settings' as MainTab, label: '偏好设置', icon: Settings, badge: null },
  ];

  return (
    <aside className="w-56 glass-panel border-r border-white/20 dark:border-white/10 flex flex-col justify-between p-4 select-none shrink-0">
      <div className="flex flex-col gap-6">
        {/* App Title and Logo */}
        <div className="flex items-center gap-2.5 px-2">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-500 flex items-center justify-center text-white shadow-md shadow-blue-500/20">
            <CheckSquare size={18} />
          </div>
          <div>
            <h1 className="text-sm font-bold text-zinc-800 dark:text-zinc-100 leading-tight">Daily Todos</h1>
            <p className="text-[10px] text-zinc-400 dark:text-zinc-500">桌面待办与习惯看板</p>
          </div>
        </div>

        {/* Navigation list */}
        <nav className="flex flex-col gap-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onSelectTab(item.id)}
                className={`flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium transition-all ${
                  isActive
                    ? 'bg-blue-600 text-white shadow-sm shadow-blue-600/30'
                    : 'text-zinc-600 dark:text-zinc-400 hover:bg-black/5 dark:hover:bg-white/5 hover:text-zinc-900 dark:hover:text-zinc-100'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <Icon size={16} />
                  <span>{item.label}</span>
                </div>
                {item.badge !== null && (
                  <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                    isActive 
                      ? 'bg-white/25 text-white' 
                      : 'bg-blue-100 dark:bg-blue-950 text-blue-600 dark:text-blue-400'
                  }`}>
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Bottom Completion Card & Switch back */}
      <div className="flex flex-col gap-3">
        {/* Mini Today Card */}
        <div className="glass-card p-3 rounded-2xl flex flex-col gap-2">
          <div className="flex items-center justify-between text-[11px] text-zinc-600 dark:text-zinc-400">
            <span className="flex items-center gap-1 font-medium">
              <Sparkles size={12} className="text-amber-500" />
              今日进度
            </span>
            <span className="font-bold text-zinc-800 dark:text-zinc-200">{completionRate}%</span>
          </div>
          <div className="w-full h-1.5 bg-zinc-200 dark:bg-zinc-700 rounded-full overflow-hidden">
            <div 
              className="h-full bg-gradient-to-r from-blue-500 to-emerald-400 transition-all duration-300"
              style={{ width: `${completionRate}%` }}
            />
          </div>
          <span className="text-[10px] text-zinc-400 dark:text-zinc-500">
            已达成 {completedCount} / {totalCount} 项
          </span>
        </div>

        {/* Switch back to widget */}
        <button
          onClick={() => {
            if (onBackToWidget) onBackToWidget();
            closeMainAndShowWidget();
          }}
          className="flex items-center justify-center gap-2 py-2 px-3 rounded-xl border border-zinc-200 dark:border-zinc-700/60 text-xs text-zinc-600 dark:text-zinc-300 hover:bg-black/5 dark:hover:bg-white/5 transition-colors cursor-pointer"
        >
          <Layers size={14} />
          <span>切回悬浮微件</span>
        </button>
      </div>
    </aside>
  );
};

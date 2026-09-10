import React, { useState } from 'react';
import { 
  Pin, 
  PinOff, 
  Lock, 
  Unlock, 
  Sliders, 
  LayoutDashboard, 
  Minus,
  Sparkles,
  PawPrint
} from 'lucide-react';
import { useTodoStore } from '../../store/useTodoStore';
import { formatDateChinese, getTodayDateStr } from '../../utils/date';
import { 
  toggleWindowAlwaysOnTop, 
  startWindowDragging, 
  openOrFocusMainWindow, 
  hideWidgetToTray,
  snapWindowToEdge 
} from '../../utils/tauriBridge';

export const WidgetHeader: React.FC = () => {
  const { settings, updateSettings, completionRate, completedCount, totalCount, setWidgetMode } = useTodoStore();
  const [showOpacitySlider, setShowOpacitySlider] = useState(false);

  const todayStr = getTodayDateStr();

  const handleTogglePin = async () => {
    const nextVal = !settings.alwaysOnTop;
    updateSettings({ alwaysOnTop: nextVal });
    await toggleWindowAlwaysOnTop(nextVal);
  };

  const handleToggleLock = () => {
    updateSettings({ isLocked: !settings.isLocked });
  };

  const handleOpenMain = () => {
    openOrFocusMainWindow();
  };

  const handleMinimizeToTray = () => {
    hideWidgetToTray();
  };

  // Shared button style with solid background, border, and shadow for crystal clarity on all wallpapers
  const buttonBaseClass = "flex items-center justify-center w-6 h-6 rounded-lg bg-white/85 dark:bg-zinc-800/90 border border-black/10 dark:border-white/15 shadow-xs transition-all cursor-pointer";

  return (
    <div 
      className={`relative px-3.5 pt-3 pb-2 flex flex-col gap-2 select-none ${
        settings.isLocked ? '' : 'drag-region'
      }`}
      onMouseDown={(e) => {
        const target = e.target as HTMLElement;
        if (
          !settings.isLocked && 
          e.button === 0 && 
          !target.closest('.no-drag, button, input, select, textarea, [role="button"]')
        ) {
          startWindowDragging();
        }
      }}
      onMouseUp={() => {
        if (settings.edgeSnap) {
          snapWindowToEdge();
        }
      }}
    >
      {/* Top action row */}
      <div className="flex items-center justify-between">
        {/* Date & Indicator */}
        <div className="flex items-center gap-2 shrink-0">
          <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse-subtle shrink-0" />
          <span className="text-xs font-semibold text-zinc-800 dark:text-zinc-100 tracking-wide whitespace-nowrap drop-shadow-xs">
            {formatDateChinese(todayStr)}
          </span>
        </div>

        {/* Action button cluster with distinct background cards */}
        <div className="flex items-center gap-1.5 shrink-0 no-drag">
          {/* Opacity slider popover button */}
          <div className="relative">
            <button
              onClick={() => setShowOpacitySlider(!showOpacitySlider)}
              title="调节悬浮窗透明度"
              className={`${buttonBaseClass} ${
                showOpacitySlider 
                  ? 'bg-blue-600 text-white border-blue-600 dark:bg-blue-600' 
                  : 'text-zinc-700 dark:text-zinc-200 hover:bg-blue-50 dark:hover:bg-zinc-700/80 hover:text-blue-600'
              }`}
            >
              <Sliders size={12} />
            </button>

            {showOpacitySlider && (
              <div 
                className="absolute right-0 top-8 z-50 p-3 w-44 glass-panel rounded-2xl shadow-2xl flex flex-col gap-2 border border-zinc-200/80 dark:border-zinc-700"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="flex justify-between text-[11px] font-medium text-zinc-700 dark:text-zinc-200">
                  <span>不透明度</span>
                  <span className="font-bold text-blue-600 dark:text-blue-400">{Math.round(settings.opacity * 100)}%</span>
                </div>
                <input
                  type="range"
                  min="0.35"
                  max="1.0"
                  step="0.05"
                  value={settings.opacity}
                  onChange={(e) => updateSettings({ opacity: parseFloat(e.target.value) })}
                  className="w-full h-1.5 bg-zinc-300 dark:bg-zinc-700 rounded-lg appearance-none cursor-pointer accent-blue-600"
                />
              </div>
            )}
          </div>

          {/* Always on top toggle */}
          <button
            onClick={handleTogglePin}
            title={settings.alwaysOnTop ? "已置顶 (浮于所有窗口上，点击取消)" : "贴紧桌面 (置于其他窗口下，点击置顶)"}
            className={`${buttonBaseClass} ${
              settings.alwaysOnTop 
                ? 'bg-blue-50/95 dark:bg-blue-950/80 text-blue-600 dark:text-blue-400 border-blue-200/80 dark:border-blue-800/80' 
                : 'text-zinc-600 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-700/80'
            }`}
          >
            {settings.alwaysOnTop ? <Pin size={12} /> : <PinOff size={12} />}
          </button>

          {/* Position lock toggle */}
          <button
            onClick={handleToggleLock}
            title={settings.isLocked ? "已锁定位置 (防误触拖拽，点击解锁)" : "未锁定 (可自由拖动，点击锁定)"}
            className={`${buttonBaseClass} ${
              settings.isLocked 
                ? 'bg-amber-50/95 dark:bg-amber-950/80 text-amber-600 dark:text-amber-400 border-amber-200/80 dark:border-amber-800/80' 
                : 'text-zinc-600 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-700/80'
            }`}
          >
            {settings.isLocked ? <Lock size={12} /> : <Unlock size={12} />}
          </button>

          {/* Switch to Pet Mode */}
          <button
            onClick={() => setWidgetMode('pet')}
            title="切换为桌面像素萌宠陪伴模式 (碎碎念/伴读)"
            className={`${buttonBaseClass} text-amber-600 dark:text-amber-400 hover:bg-amber-500 hover:text-white dark:hover:bg-amber-500 dark:hover:text-white hover:border-amber-500`}
          >
            <PawPrint size={12} />
          </button>

          {/* Open Main Window (Dedicated 960x680 Dashboard) */}
          <button
            onClick={handleOpenMain}
            title="打开全功能任务看板 (960×680 独立大窗口)"
            className={`${buttonBaseClass} text-zinc-700 dark:text-zinc-200 hover:bg-blue-600 hover:text-white dark:hover:bg-blue-500 dark:hover:text-white hover:border-blue-600`}
          >
            <LayoutDashboard size={12} />
          </button>

          {/* Minimize / Hide to Tray */}
          <button
            onClick={handleMinimizeToTray}
            title="收起至系统托盘 (可在屏幕右下角托盘点击重新唤出)"
            className={`${buttonBaseClass} text-zinc-700 dark:text-zinc-200 hover:bg-rose-500 hover:text-white dark:hover:bg-rose-500 dark:hover:text-white hover:border-rose-500`}
          >
            <Minus size={13} strokeWidth={2.5} />
          </button>
        </div>
      </div>

      {/* Progress & Stat Bar */}
      <div className="flex items-center justify-between gap-3 pt-0.5 no-drag">
        <div className="flex items-center gap-1.5 text-[11px] text-zinc-600 dark:text-zinc-300 font-medium">
          {completionRate === 100 && totalCount > 0 ? (
            <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-semibold">
              <Sparkles size={12} />
              全部达成!
            </span>
          ) : (
            <span>
              已达成 {completedCount} / {totalCount}
            </span>
          )}
        </div>

        {/* Sleek Mini Progress Bar */}
        <div className="flex-1 max-w-[120px] flex items-center gap-2">
          <div className="w-full h-1.5 bg-zinc-200/90 dark:bg-zinc-700/70 rounded-full overflow-hidden">
            <div 
              className={`h-full rounded-full transition-all duration-500 ease-out ${
                completionRate === 100 
                  ? 'bg-gradient-to-r from-emerald-500 to-teal-400' 
                  : 'bg-gradient-to-r from-blue-500 to-indigo-500'
              }`}
              style={{ width: `${completionRate}%` }}
            />
          </div>
          <span className="text-[10px] font-bold text-zinc-700 dark:text-zinc-300 min-w-[24px] text-right">
            {completionRate}%
          </span>
        </div>
      </div>
    </div>
  );
};

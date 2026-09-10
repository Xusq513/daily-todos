import React, { useState, useEffect } from 'react';
import { ChevronRight, CheckSquare } from 'lucide-react';
import { useTodoStore } from '../../store/useTodoStore';
import { WidgetHeader } from './WidgetHeader';
import { WidgetList } from './WidgetList';
import { WidgetInput } from './WidgetInput';
import { PetWidget } from '../pet/PetWidget';
import { resizeWidgetWindow } from '../../utils/tauriBridge';

export const FloatingWidget: React.FC = () => {
  const { settings, completionRate, setWidgetMode } = useTodoStore();
  const [isFolded, setIsFolded] = useState(false);

  const isPetMode = settings.widgetMode === 'pet';

  // Synchronize native window dimensions according to current display form factor
  useEffect(() => {
    if (isPetMode) {
      resizeWidgetWindow(190, 190, false);
    } else if (isFolded) {
      resizeWidgetWindow(56, 56, false);
    } else {
      resizeWidgetWindow(350, 500, true);
    }
  }, [isPetMode, isFolded]);

  // Form Factor 2: Desktop Pixel Pet Mode!
  if (isPetMode) {
    return <PetWidget onExpandToList={() => setWidgetMode('list')} />;
  }

  // Mini folded pill badge
  if (isFolded) {
    return (
      <div 
        onClick={() => setIsFolded(false)}
        className="w-10 h-10 rounded-2xl glass-panel shadow-lg flex items-center justify-center cursor-pointer hover:scale-105 active:scale-95 transition-all text-blue-600 dark:text-blue-400 group select-none"
        title="点击展开待办小组件"
        style={{ opacity: settings.opacity }}
      >
        <div className="relative flex items-center justify-center">
          <CheckSquare size={18} />
          <span className="absolute -top-1.5 -right-2 text-[9px] font-bold bg-blue-600 text-white rounded-full px-1">
            {completionRate}%
          </span>
        </div>
      </div>
    );
  }

  // Form Factor 1: Standard Todo List Glassmorphism Card
  return (
    <div 
      className="w-full h-full rounded-3xl glass-panel shadow-2xl flex flex-col overflow-hidden relative transition-opacity duration-200 border border-white/40 dark:border-white/10"
      style={{
        opacity: settings.opacity,
      }}
    >
      {/* Edge Fold Button on the right edge */}
      <button
        onClick={() => setIsFolded(true)}
        title="快速折叠为桌面微标"
        className="absolute right-1 bottom-14 z-30 p-1 rounded-l-md text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 bg-black/5 dark:bg-white/5 opacity-0 hover:opacity-100 transition-opacity"
      >
        <ChevronRight size={12} />
      </button>

      {/* Header */}
      <WidgetHeader />

      {/* Task List */}
      <WidgetList />

      {/* Inline Quick Input */}
      <WidgetInput />
    </div>
  );
};

import React, { useState, useEffect } from 'react';
import { RefreshCw, ListFilter, Minus, GripHorizontal } from 'lucide-react';
import { useTodoStore } from '../../store/useTodoStore';
import { PetAction } from '../../types/pet';
import { PixelPetCanvas } from './PixelPetCanvas';
import { PetSpeechBubble } from './PetSpeechBubble';
import { startWindowDragging, hideWidgetToTray, snapWindowToEdge } from '../../utils/tauriBridge';
import { resolvePetId } from '../../pets/registry';

interface PetWidgetProps {
  onExpandToList: () => void;
}

export const PetWidget: React.FC<PetWidgetProps> = ({ onExpandToList }) => {
  const { settings, cyclePet, completionRate, completedCount } = useTodoStore();
  const [action, setAction] = useState<PetAction>('idle');
  const [pokeCount, setPokeCount] = useState(0);

  const petId = resolvePetId(settings.selectedPet || 'cat');

  // Watch completion rate: if 100%, sleep happily
  useEffect(() => {
    if (completionRate === 100) {
      setAction('sleep');
    } else {
      setAction('idle');
    }
  }, [completionRate]);

  // When task is completed, trigger happy jump for 2 seconds
  useEffect(() => {
    if (completedCount > 0) {
      setAction('happy');
      const timer = setTimeout(() => {
        setAction(completionRate === 100 ? 'sleep' : 'idle');
      }, 2200);
      return () => clearTimeout(timer);
    }
  }, [completedCount]);

  const handlePoke = () => {
    setPokeCount((c) => c + 1);
    setAction('poke');
    setTimeout(() => {
      setAction(completionRate === 100 ? 'sleep' : 'idle');
    }, 1000);
  };

  const handleTopBarMouseDown = (e: React.MouseEvent) => {
    if (e.button === 0 && !settings.isLocked && !(e.target as HTMLElement).closest('.no-drag')) {
      startWindowDragging();
    }
  };

  const handleTopBarMouseUp = () => {
    if (settings.edgeSnap) {
      snapWindowToEdge();
    }
  };

  return (
    <div
      className="pet-widget-shell group relative w-[190px] h-[190px] select-none overflow-hidden bg-transparent"
      style={{ opacity: settings.opacity }}
    >
      {/* Hover-only drag and action bar */}
      <div 
        onMouseDown={handleTopBarMouseDown}
        onMouseUp={handleTopBarMouseUp}
        className="pet-ui-transition pointer-events-none absolute inset-x-2 top-1 z-30 flex h-7 -translate-y-1 items-center gap-1 rounded-xl border border-black/10 bg-white/65 px-1 opacity-0 shadow-sm backdrop-blur-md transition-all duration-200 drag-region select-none cursor-grab group-hover:pointer-events-auto group-hover:translate-y-0 group-hover:opacity-100 group-focus-within:pointer-events-auto group-focus-within:translate-y-0 group-focus-within:opacity-100 active:cursor-grabbing dark:border-white/10 dark:bg-zinc-900/70"
        title="按住此处拖拽移动桌面位置"
      >
        <button
          onClick={(e) => {
            e.stopPropagation();
            onExpandToList();
          }}
          title="展开为待办清单卡片"
          aria-label="展开为待办清单卡片"
          className="no-drag flex h-6 w-6 cursor-pointer items-center justify-center rounded-lg text-zinc-600 transition-colors hover:bg-blue-100/80 hover:text-blue-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 dark:text-zinc-300 dark:hover:bg-blue-950/80"
        >
          <ListFilter size={12} />
        </button>

        <div 
          className="flex h-6 flex-1 items-center justify-center rounded-lg text-zinc-400 drag-region dark:text-zinc-500"
          title="按住此处拖动桌宠"
        >
          <GripHorizontal size={13} className="text-zinc-500 dark:text-zinc-400" />
        </div>

        <div className="flex items-center gap-0.5 no-drag">
          <button
            onClick={(e) => {
              e.stopPropagation();
              cyclePet();
            }}
            title="换一只宠物"
            aria-label="换一只宠物"
            className="no-drag flex h-6 w-6 cursor-pointer items-center justify-center rounded-lg text-zinc-600 transition-colors hover:bg-amber-100/80 hover:text-amber-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 dark:text-zinc-300 dark:hover:bg-amber-950/80"
          >
            <RefreshCw size={11} />
          </button>

          <button
            onClick={(e) => {
              e.stopPropagation();
              hideWidgetToTray();
            }}
            title="收起隐藏至系统托盘"
            aria-label="收起隐藏至系统托盘"
            className="no-drag flex h-6 w-6 cursor-pointer items-center justify-center rounded-lg text-zinc-600 transition-colors hover:bg-rose-100/80 hover:text-rose-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-500 dark:text-zinc-300 dark:hover:bg-rose-950/80"
          >
            <Minus size={11} />
          </button>
        </div>
      </div>

      {/* Speech bubble sits above the pet without affecting its anchor point. */}
      <div className="absolute left-1/2 top-9 z-20 -translate-x-1/2">
        <PetSpeechBubble petId={petId} pokeTriggerCount={pokeCount} />
      </div>

      {/* Pet remains visually anchored to the bottom of the native window. */}
      <div 
        className="absolute bottom-0 left-1/2 z-10 -translate-x-1/2"
        title="点击摸摸我！"
      >
        <PixelPetCanvas
          petId={petId}
          action={action}
          onPoke={handlePoke}
        />
      </div>
    </div>
  );
};

import React, { useState, useRef, useEffect } from 'react';
import { Clock, X, Check, ChevronUp, ChevronDown } from 'lucide-react';

interface TimePickerPopoverProps {
  value?: string; // format: "HH:mm" or ""
  onChange: (val: string) => void;
  placeholder?: string;
  compact?: boolean;
  align?: 'left' | 'right';
  placement?: 'top' | 'bottom';
  themeColor?: 'indigo' | 'blue';
}

const PRESET_TIMES = [
  { time: '07:00', label: '晨起' },
  { time: '08:30', label: '早读/早会' },
  { time: '10:00', label: '上午专注' },
  { time: '12:00', label: '午休' },
  { time: '14:00', label: '下午开工' },
  { time: '16:30', label: '傍晚茶歇' },
  { time: '18:00', label: '下班复盘' },
  { time: '20:00', label: '晚间自律' },
  { time: '22:00', label: '睡前整理' },
];

const HOURS = Array.from({ length: 24 }, (_, i) => String(i).padStart(2, '0'));
const MINUTE_STEPS = ['00', '05', '10', '15', '20', '25', '30', '35', '40', '45', '50', '55'];

export const TimePickerPopover: React.FC<TimePickerPopoverProps> = ({
  value = '',
  onChange,
  placeholder = '设定时间',
  compact = false,
  align = 'left',
  placement = 'bottom',
  themeColor = 'indigo',
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Parse current value into HH and mm, or default to current local time if none
  const parseTime = (valStr: string) => {
    if (valStr && valStr.includes(':')) {
      const [h, m] = valStr.split(':');
      return {
        hour: String(Math.min(23, Math.max(0, parseInt(h, 10) || 0))).padStart(2, '0'),
        minute: String(Math.min(59, Math.max(0, parseInt(m, 10) || 0))).padStart(2, '0'),
      };
    }
    const now = new Date();
    return {
      hour: String(now.getHours()).padStart(2, '0'),
      minute: String(Math.floor(now.getMinutes() / 5) * 5).padStart(2, '0'),
    };
  };

  const [activeTab, setActiveTab] = useState<'presets' | 'custom'>('presets');
  const [selectedHour, setSelectedHour] = useState(() => parseTime(value).hour);
  const [selectedMinute, setSelectedMinute] = useState(() => parseTime(value).minute);

  // Sync internal state when value prop changes or popover opens
  useEffect(() => {
    if (isOpen) {
      const { hour, minute } = parseTime(value);
      setSelectedHour(hour);
      setSelectedMinute(minute);
    }
  }, [isOpen, value]);

  // Click outside to close
  useEffect(() => {
    if (!isOpen) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  const handleSelectPreset = (timeStr: string) => {
    onChange(timeStr);
    setIsOpen(false);
  };

  const handleConfirmCustom = () => {
    onChange(`${selectedHour}:${selectedMinute}`);
    setIsOpen(false);
  };

  const handleClear = (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    onChange('');
    setIsOpen(false);
  };

  const handleSetCurrentTime = () => {
    const now = new Date();
    const h = String(now.getHours()).padStart(2, '0');
    const m = String(now.getMinutes()).padStart(2, '0');
    onChange(`${h}:${m}`);
    setIsOpen(false);
  };

  const adjustHour = (delta: number) => {
    const cur = parseInt(selectedHour, 10) || 0;
    const next = (cur + delta + 24) % 24;
    setSelectedHour(String(next).padStart(2, '0'));
  };

  const adjustMinute = (delta: number) => {
    const cur = parseInt(selectedMinute, 10) || 0;
    const next = (cur + delta + 60) % 60;
    setSelectedMinute(String(next).padStart(2, '0'));
  };

  const activeColorClasses = themeColor === 'indigo'
    ? {
        text: 'text-indigo-600 dark:text-indigo-400',
        bg: 'bg-indigo-600 text-white',
        border: 'border-indigo-300 dark:border-indigo-700',
        softBg: 'bg-indigo-50 dark:bg-indigo-950/60',
        hover: 'hover:bg-indigo-50 dark:hover:bg-indigo-950/50',
      }
    : {
        text: 'text-blue-600 dark:text-blue-400',
        bg: 'bg-blue-600 text-white',
        border: 'border-blue-300 dark:border-blue-700',
        softBg: 'bg-blue-50 dark:bg-blue-950/60',
        hover: 'hover:bg-blue-50 dark:hover:bg-blue-950/50',
      };

  return (
    <div className="relative inline-block text-left shrink-0" ref={containerRef}>
      {/* Trigger Button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        title={value ? `提醒时间: ${value} (点击修改)` : '选择时间'}
        className={`group flex items-center gap-1.5 ${
          compact ? 'px-2 py-1 text-[11px]' : 'px-3 py-2 text-xs'
        } rounded-xl border transition-all ${
          value
            ? `${activeColorClasses.softBg} ${activeColorClasses.border} ${activeColorClasses.text} shadow-xs font-medium`
            : 'bg-white/70 dark:bg-zinc-800/70 border-zinc-200 dark:border-zinc-700/60 text-zinc-500 dark:text-zinc-400 hover:text-zinc-800 dark:hover:text-zinc-200 hover:border-zinc-300 dark:hover:border-zinc-600'
        }`}
      >
        <Clock size={compact ? 13 : 14} className={value ? activeColorClasses.text : 'text-zinc-400'} />
        <span className={value ? 'font-mono' : ''}>
          {value || placeholder}
        </span>

        {/* Clear Button right inside trigger when value exists */}
        {value && (
          <span
            onClick={handleClear}
            title="清除时间"
            className="p-0.5 ml-0.5 rounded-md hover:bg-black/10 dark:hover:bg-white/10 text-zinc-400 hover:text-rose-500 transition-colors"
          >
            <X size={12} />
          </span>
        )}
      </button>

      {/* Popover Dropdown Panel */}
      {isOpen && (
        <div
          className={`absolute ${align === 'right' ? 'right-0' : 'left-0'} ${
            placement === 'top' ? 'bottom-full mb-1.5' : 'top-full mt-1.5'
          } z-50 p-3.5 w-72 glass-panel rounded-2xl shadow-2xl border border-zinc-200/90 dark:border-zinc-700/80 flex flex-col gap-3 animate-in fade-in select-none`}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header & Digital Display */}
          <div className="flex items-center justify-between border-b border-zinc-200/60 dark:border-zinc-800 pb-2">
            <div className="flex items-center gap-1.5">
              <Clock size={14} className={activeColorClasses.text} />
              <span className="text-xs font-bold text-zinc-800 dark:text-zinc-100">
                选择执行时间
              </span>
            </div>

            {/* Stepper Digital Display */}
            <div className="flex items-center gap-1 bg-black/5 dark:bg-white/5 px-2 py-0.5 rounded-lg font-mono text-xs font-semibold text-zinc-800 dark:text-zinc-100">
              <div className="flex flex-col items-center">
                <button
                  type="button"
                  onClick={() => adjustHour(1)}
                  className="text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200"
                >
                  <ChevronUp size={10} />
                </button>
                <span>{selectedHour}</span>
                <button
                  type="button"
                  onClick={() => adjustHour(-1)}
                  className="text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200"
                >
                  <ChevronDown size={10} />
                </button>
              </div>
              <span className="opacity-50">:</span>
              <div className="flex flex-col items-center">
                <button
                  type="button"
                  onClick={() => adjustMinute(5)}
                  className="text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200"
                >
                  <ChevronUp size={10} />
                </button>
                <span>{selectedMinute}</span>
                <button
                  type="button"
                  onClick={() => adjustMinute(-5)}
                  className="text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200"
                >
                  <ChevronDown size={10} />
                </button>
              </div>
            </div>
          </div>

          {/* Mode Switch Tabs */}
          <div className="flex items-center gap-1 p-0.5 bg-black/5 dark:bg-white/5 rounded-xl text-xs">
            <button
              type="button"
              onClick={() => setActiveTab('presets')}
              className={`flex-1 py-1 rounded-lg text-center font-medium transition-all ${
                activeTab === 'presets'
                  ? 'bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 shadow-xs'
                  : 'text-zinc-500 hover:text-zinc-700'
              }`}
            >
              常用预设
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('custom')}
              className={`flex-1 py-1 rounded-lg text-center font-medium transition-all ${
                activeTab === 'custom'
                  ? 'bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 shadow-xs'
                  : 'text-zinc-500 hover:text-zinc-700'
              }`}
            >
              精确选时
            </button>
          </div>

          {/* Tab 1: Quick Presets */}
          {activeTab === 'presets' && (
            <div className="grid grid-cols-3 gap-1.5 max-h-48 overflow-y-auto pr-0.5">
              {PRESET_TIMES.map(({ time, label }) => {
                const isSelected = value === time;
                return (
                  <button
                    key={time}
                    type="button"
                    onClick={() => handleSelectPreset(time)}
                    className={`p-2 rounded-xl text-center flex flex-col items-center gap-0.5 transition-all ${
                      isSelected
                        ? `${activeColorClasses.bg} shadow-xs font-semibold`
                        : 'bg-black/5 dark:bg-white/5 hover:bg-black/10 dark:hover:bg-white/10 text-zinc-700 dark:text-zinc-200'
                    }`}
                  >
                    <span className="font-mono text-xs font-bold leading-none">{time}</span>
                    <span className={`text-[10px] ${isSelected ? 'opacity-90' : 'text-zinc-400 dark:text-zinc-500'} leading-tight`}>
                      {label}
                    </span>
                  </button>
                );
              })}
            </div>
          )}

          {/* Tab 2: Custom Hours & Minutes Grid */}
          {activeTab === 'custom' && (
            <div className="flex flex-col gap-2.5 max-h-48 overflow-y-auto pr-0.5">
              {/* Hours Grid */}
              <div>
                <span className="text-[10px] text-zinc-400 font-medium block mb-1">小时:</span>
                <div className="grid grid-cols-6 gap-1">
                  {HOURS.map((h) => (
                    <button
                      key={h}
                      type="button"
                      onClick={() => setSelectedHour(h)}
                      className={`h-6 rounded-lg text-[11px] font-mono font-medium transition-all ${
                        selectedHour === h
                          ? `${activeColorClasses.bg} shadow-xs`
                          : 'bg-black/5 dark:bg-white/5 hover:bg-black/10 dark:hover:bg-white/10 text-zinc-700 dark:text-zinc-200'
                      }`}
                    >
                      {h}
                    </button>
                  ))}
                </div>
              </div>

              {/* Minutes Grid */}
              <div>
                <span className="text-[10px] text-zinc-400 font-medium block mb-1">分钟:</span>
                <div className="grid grid-cols-6 gap-1">
                  {MINUTE_STEPS.map((m) => (
                    <button
                      key={m}
                      type="button"
                      onClick={() => setSelectedMinute(m)}
                      className={`h-6 rounded-lg text-[11px] font-mono font-medium transition-all ${
                        selectedMinute === m
                          ? `${activeColorClasses.bg} shadow-xs`
                          : 'bg-black/5 dark:bg-white/5 hover:bg-black/10 dark:hover:bg-white/10 text-zinc-700 dark:text-zinc-200'
                      }`}
                    >
                      {m}
                    </button>
                  ))}
                </div>
              </div>

              {/* Confirm Custom Selection Button */}
              <button
                type="button"
                onClick={handleConfirmCustom}
                className={`w-full py-1.5 ${activeColorClasses.bg} rounded-xl text-xs font-medium flex items-center justify-center gap-1 shadow-xs hover:opacity-90 transition-opacity`}
              >
                <Check size={12} />
                <span>设定为 {selectedHour}:{selectedMinute}</span>
              </button>
            </div>
          )}

          {/* Footer Actions */}
          <div className="flex items-center justify-between border-t border-zinc-200/60 dark:border-zinc-800 pt-2 text-[11px]">
            <button
              type="button"
              onClick={handleSetCurrentTime}
              className="text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200 transition-colors"
            >
              当前时间
            </button>

            <div className="flex items-center gap-2">
              {value && (
                <button
                  type="button"
                  onClick={() => handleClear()}
                  className="text-rose-500 hover:text-rose-600 transition-colors"
                >
                  清除
                </button>
              )}
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 transition-colors"
              >
                完成
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

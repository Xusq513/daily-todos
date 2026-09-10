import React, { useState } from 'react';
import { Calendar, Check } from 'lucide-react';
import { 
  getTodayDateStr, 
  getTomorrowDateStr, 
  getThisFridayDateStr, 
  getThisSundayDateStr,
  formatDateShort,
  formatDateRange 
} from '../../utils/date';
import { DateSchedule } from '../../types';

interface DatePickerPopoverProps {
  schedule: DateSchedule;
  onChange: (schedule: DateSchedule) => void;
  compact?: boolean;
}

export const DatePickerPopover: React.FC<DatePickerPopoverProps> = ({
  schedule,
  onChange,
  compact = false,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const today = getTodayDateStr();

  const handleSelectPreset = (preset: 'today' | 'tomorrow' | 'friday' | 'weekend') => {
    if (preset === 'today') {
      onChange({ mode: 'today', targetDate: today });
    } else if (preset === 'tomorrow') {
      onChange({ mode: 'specific', targetDate: getTomorrowDateStr() });
    } else if (preset === 'friday') {
      onChange({ mode: 'specific', targetDate: getThisFridayDateStr() });
    } else if (preset === 'weekend') {
      // Weekend as a range from Friday to Sunday or Saturday to Sunday
      onChange({ 
        mode: 'range', 
        startDate: getThisFridayDateStr(), 
        endDate: getThisSundayDateStr() 
      });
    }
    setIsOpen(false);
  };

  const getButtonLabel = () => {
    if (schedule.mode === 'today' || (!schedule.targetDate && !schedule.startDate)) {
      return '今天';
    }
    if (schedule.mode === 'range' && schedule.startDate && schedule.endDate) {
      return formatDateRange(schedule.startDate, schedule.endDate);
    }
    if (schedule.targetDate === getTomorrowDateStr()) {
      return '明天';
    }
    return formatDateShort(schedule.targetDate || '');
  };

  const isToday = schedule.mode === 'today' || (schedule.targetDate === today && !schedule.startDate);

  return (
    <div className="relative inline-block text-left shrink-0">
      {/* Trigger Button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        title="选择执行日期或时间范围"
        className={`flex items-center gap-1 ${
          compact ? 'px-1.5 py-0.5 text-[10px]' : 'px-2 py-1 text-xs'
        } rounded-lg font-medium border transition-all ${
          !isToday
            ? 'bg-blue-50 dark:bg-blue-950/70 border-blue-300 dark:border-blue-700 text-blue-600 dark:text-blue-400 shadow-xs'
            : 'bg-white/80 dark:bg-zinc-800/80 border-black/10 dark:border-white/10 text-zinc-600 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-700'
        }`}
      >
        <Calendar size={12} className={!isToday ? 'text-blue-500' : 'text-zinc-400'} />
        <span>{getButtonLabel()}</span>
      </button>

      {/* Popover Dropdown */}
      {isOpen && (
        <div 
          className="absolute left-0 bottom-8 z-50 p-3 w-64 glass-panel rounded-2xl shadow-2xl border border-zinc-200/90 dark:border-zinc-700/80 flex flex-col gap-2.5 animate-in fade-in"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-center justify-between border-b border-zinc-200/60 dark:border-zinc-800 pb-1.5">
            <span className="text-xs font-bold text-zinc-800 dark:text-zinc-100">待办日期排期</span>
            <button 
              type="button"
              onClick={() => setIsOpen(false)}
              className="text-[10px] text-zinc-400 hover:text-zinc-600"
            >
              关闭
            </button>
          </div>

          {/* Quick Presets */}
          <div className="grid grid-cols-2 gap-1.5">
            {[
              { id: 'today' as const, label: '今天' },
              { id: 'tomorrow' as const, label: '明天' },
              { id: 'friday' as const, label: '本周五' },
              { id: 'weekend' as const, label: '周末范围' },
            ].map(({ id, label }) => (
              <button
                key={id}
                type="button"
                onClick={() => handleSelectPreset(id)}
                className="px-2 py-1.5 rounded-lg text-xs font-medium bg-black/5 dark:bg-white/5 hover:bg-blue-600 hover:text-white dark:hover:bg-blue-500 text-zinc-700 dark:text-zinc-200 transition-all text-center"
              >
                {label}
              </button>
            ))}
          </div>

          {/* Mode Tabs */}
          <div className="flex items-center gap-1 p-0.5 bg-black/5 dark:bg-white/5 rounded-lg text-[11px]">
            <button
              type="button"
              onClick={() => onChange({ mode: 'specific', targetDate: schedule.targetDate || today })}
              className={`flex-1 py-1 rounded text-center font-medium transition-all ${
                schedule.mode !== 'range'
                  ? 'bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 shadow-xs'
                  : 'text-zinc-500'
              }`}
            >
              指定单天
            </button>
            <button
              type="button"
              onClick={() => onChange({ 
                mode: 'range', 
                startDate: schedule.startDate || today, 
                endDate: schedule.endDate || getTomorrowDateStr() 
              })}
              className={`flex-1 py-1 rounded text-center font-medium transition-all ${
                schedule.mode === 'range'
                  ? 'bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 shadow-xs'
                  : 'text-zinc-500'
              }`}
            >
              时间范围
            </button>
          </div>

          {/* Form Input based on Mode */}
          {schedule.mode !== 'range' ? (
            <div className="flex flex-col gap-1">
              <label className="text-[10px] text-zinc-500">执行日期:</label>
              <input
                type="date"
                value={schedule.targetDate || today}
                min={today}
                onChange={(e) => onChange({ mode: 'specific', targetDate: e.target.value })}
                className="px-2 py-1 text-xs bg-white/80 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg text-zinc-800 dark:text-zinc-100 focus:outline-none"
              />
            </div>
          ) : (
            <div className="flex flex-col gap-1.5">
              <div className="flex items-center gap-1.5">
                <div className="flex-1 flex flex-col gap-0.5">
                  <span className="text-[10px] text-zinc-500">开始日:</span>
                  <input
                    type="date"
                    value={schedule.startDate || today}
                    onChange={(e) => onChange({ 
                      mode: 'range', 
                      startDate: e.target.value, 
                      endDate: schedule.endDate || e.target.value 
                    })}
                    className="w-full px-1.5 py-1 text-xs bg-white/80 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg text-zinc-800 dark:text-zinc-100 focus:outline-none"
                  />
                </div>
                <span className="text-zinc-400 mt-3">~</span>
                <div className="flex-1 flex flex-col gap-0.5">
                  <span className="text-[10px] text-zinc-500">截止日:</span>
                  <input
                    type="date"
                    value={schedule.endDate || getTomorrowDateStr()}
                    min={schedule.startDate || today}
                    onChange={(e) => onChange({ 
                      mode: 'range', 
                      startDate: schedule.startDate || today, 
                      endDate: e.target.value 
                    })}
                    className="w-full px-1.5 py-1 text-xs bg-white/80 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg text-zinc-800 dark:text-zinc-100 focus:outline-none"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Confirm Button */}
          <button
            type="button"
            onClick={() => setIsOpen(false)}
            className="w-full mt-1 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-medium flex items-center justify-center gap-1 transition-all shadow-xs"
          >
            <Check size={12} />
            <span>确认排期</span>
          </button>
        </div>
      )}
    </div>
  );
};

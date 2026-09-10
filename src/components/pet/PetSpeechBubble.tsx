import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useTodoStore } from '../../store/useTodoStore';
import { isBuiltInPetId, type BuiltInPetId, type PetId } from '../../types/pet';
import { getLocalPetQuotes, resolvePetId } from '../../pets/registry';

const SPEECH_VISIBLE_MS = 5000;
const IDLE_SPEECH_INTERVAL_MS = 150000;

export const formatTaskTitle = (title: string, maxLength = 12): string =>
  title.length > maxLength ? `${title.slice(0, maxLength)}…` : title;

interface PetSpeechBubbleProps {
  petId: PetId;
  pokeTriggerCount: number;
}

export const PetSpeechBubble: React.FC<PetSpeechBubbleProps> = ({
  petId,
  pokeTriggerCount,
}) => {
  const { todayTodos, completionRate, completedCount, totalCount, settings } = useTodoStore();
  const [quote, setQuote] = useState<string>('');
  const [isVisible, setIsVisible] = useState<boolean>(false);
  const prevCompletedCountRef = useRef<number>(completedCount);
  const hideTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const pendingTodos = todayTodos.filter((t) => !t.completed);
  const nextTaskTitle = pendingTodos[0]?.title;

  const getRandomQuote = (type: 'idle' | 'celebrate' | 'poke' | 'alldone'): string => {
    const resolvedPetId = resolvePetId(petId);
    const quoteType = type === 'alldone' || (completionRate === 100 && totalCount > 0)
      ? 'alldone'
      : type;

    if (quoteType !== 'idle') {
      const localQuotes = getLocalPetQuotes(resolvedPetId, quoteType, {
        completionRate,
        completedCount,
        totalCount,
      });
      if (localQuotes?.length) {
        return localQuotes[Math.floor(Math.random() * localQuotes.length)];
      }
    }

    const builtInPetId: BuiltInPetId = isBuiltInPetId(resolvedPetId)
      ? resolvedPetId
      : 'cat';

    if (quoteType === 'alldone') {
      const allDoneQuotes: Record<BuiltInPetId, string[]> = {
        cat: ['呼噜呼噜...今日任务全清啦，来陪咪咪睡大觉~ 💤', '全达成！今天你最棒，奖励小鱼干一条喵！🐟'],
        dog: ['汪汪汪！太强了主人！今天的目标全消灭啦！🎉', '开心转圈圈！终于可以去草地上飞奔啦~ 🐕'],
        slime: ['Duang~ 100%达成！感觉身体变得超轻盈呢！✨', '全搞定啦！今天我们是无敌组合！🏆'],
        robot: ['[哔哔] 任务进度100%！系统资源调度完毕，建议关机休眠。⚡', '恭喜！本日生产力指标已满载达成！🚀'],
      };
      const list = allDoneQuotes[builtInPetId];
      return list[Math.floor(Math.random() * list.length)];
    }

    if (quoteType === 'celebrate') {
      const celebrateQuotes: Record<BuiltInPetId, string[]> = {
        cat: [
          `太棒喵！进度升到 ${completionRate}% 啦！🎉`,
          '又搞定一个！咪咪给你鼓掌掌~ 🐾',
          '好厉害！喝口水休息下继续做下一个喵！✨',
        ],
        dog: [
          `汪汪！漂亮！达成率 ${completionRate}% 啦！🔥`,
          '太棒啦主人！尾巴已经摇停不下来了！🐶',
          '冲冲冲！下一个任务交给我们吧！💪',
        ],
        slime: [
          `Duang~ 搞定一个！进度飙到 ${completionRate}% 啦！🧪`,
          '感觉身体膨胀了一点，充满力量呢！💖',
          '好耶！向着全清迈进一大步！🌟',
        ],
        robot: [
          `[系统提示] 任务消减成功！当前达成率 ${completionRate}% ⚡`,
          '执行效率评级：S级！继续保持运算~ 🤖',
          '待办矩阵正在瓦解，胜利就在眼前！🎯',
        ],
      };
      const list = celebrateQuotes[builtInPetId];
      return list[Math.floor(Math.random() * list.length)];
    }

    if (quoteType === 'poke') {
      const pokeQuotes: Record<BuiltInPetId, string[]> = {
        cat: ['喵呜？干嘛戳我呀，快去干活啦！🐱', '呼噜噜...痒痒的喵，别闹啦~', '再戳我就要把你的待办踩扁咯！🐾'],
        dog: ['汪！主人找我玩吗？快干完带我散步！🐶', '嘿嘿，蹭蹭你的手手！加油干活！🦴', '汪汪！哈希时刻准备着！'],
        slime: ['Duang~ 戳得我软乎乎的！好舒服呀~ 🧪', '哇！差点把我戳漏气啦！😆', '弹性十足！再来一下？'],
        robot: ['[警告] 遭遇未知触控干扰！正在重启情感模块... 🤖', '哔——！检测到主人互动，元气值充至100%！⚡', '指纹识别成功：工作加油！'],
      };
      const list = pokeQuotes[builtInPetId];
      return list[Math.floor(Math.random() * list.length)];
    }

    // Default Idle Quotes
    if (nextTaskTitle) {
      const taskReminders = [
        `接下来做：${formatTaskTitle(nextTaskTitle)}，加油！`,
        `还有 ${pendingTodos.length} 项没完成，先做「${formatTaskTitle(nextTaskTitle, 10)}」吧~`,
        `当前进度 ${completionRate}%，冲一把全清！`,
      ];
      return taskReminders[Math.floor(Math.random() * taskReminders.length)];
    }

    return '今天还没有安排待办呢，双击我记一条吧~ ✨';
  };

  const getRandomQuoteRef = useRef(getRandomQuote);
  getRandomQuoteRef.current = getRandomQuote;

  const clearHideTimer = useCallback(() => {
    if (hideTimerRef.current) {
      clearTimeout(hideTimerRef.current);
      hideTimerRef.current = null;
    }
  }, []);

  const showQuote = useCallback((nextQuote: string) => {
    clearHideTimer();
    setQuote(nextQuote);
    setIsVisible(true);
    hideTimerRef.current = setTimeout(() => {
      setIsVisible(false);
      hideTimerRef.current = null;
    }, SPEECH_VISIBLE_MS);
  }, [clearHideTimer]);

  // 1. Task Completion reaction
  useEffect(() => {
    if (settings.petSpeechEnabled && completedCount > prevCompletedCountRef.current) {
      const celebrateText = completionRate === 100 
        ? getRandomQuoteRef.current('alldone')
        : getRandomQuoteRef.current('celebrate');
      showQuote(celebrateText);
    }
    prevCompletedCountRef.current = completedCount;
  }, [completedCount, completionRate, petId, settings.petSpeechEnabled, showQuote]);

  // 2. Poke reaction
  useEffect(() => {
    if (settings.petSpeechEnabled && pokeTriggerCount > 0) {
      showQuote(getRandomQuoteRef.current('poke'));
    }
  }, [pokeTriggerCount, settings.petSpeechEnabled, showQuote]);

  // 3. Periodic idle chattering (every 2.5 minutes)
  useEffect(() => {
    if (!settings.petSpeechEnabled) {
      clearHideTimer();
      setIsVisible(false);
      return;
    }

    showQuote(getRandomQuoteRef.current(completionRate === 100 ? 'alldone' : 'idle'));
    const interval = setInterval(() => {
      showQuote(getRandomQuoteRef.current('idle'));
    }, IDLE_SPEECH_INTERVAL_MS);

    return () => clearInterval(interval);
  }, [petId, settings.petSpeechEnabled, showQuote, clearHideTimer]);

  useEffect(() => () => clearHideTimer(), [clearHideTimer]);

  if (!settings.petSpeechEnabled || !quote) return null;

  return (
    <div 
      onClick={() => showQuote(getRandomQuoteRef.current('idle'))}
      className={`pet-ui-transition relative w-max max-w-[174px] rounded-xl border border-black/10 bg-white/90 px-3 py-2 text-[11.5px] leading-[1.35] text-zinc-800 shadow-md backdrop-blur-md cursor-pointer select-none transition-all duration-300 dark:border-white/15 dark:bg-zinc-900/90 dark:text-zinc-100 ${
        isVisible ? 'pointer-events-auto opacity-100 scale-100' : 'pointer-events-none opacity-0 scale-95'
      }`}
      title="点击切换下一句台词"
      role="status"
      aria-live="polite"
    >
      <span className="line-clamp-2">{quote}</span>
      {/* Little triangle arrow pointing down to pet */}
      <div className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-0 h-0 border-l-[5px] border-l-transparent border-r-[5px] border-r-transparent border-t-[6px] border-t-white/90 dark:border-t-zinc-900/90" />
    </div>
  );
};

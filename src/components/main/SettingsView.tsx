import React, { useRef, useState, useEffect } from 'react';
import { 
  Sliders, 
  Sun, 
  Moon, 
  Laptop, 
  Sparkles, 
  Keyboard, 
  Download, 
  Upload, 
  Check, 
  ShieldCheck,
  PawPrint,
  AlertTriangle,
  RotateCcw,
  X
} from 'lucide-react';
import { useTodoStore } from '../../store/useTodoStore';
import { formatHotkeyDisplay, isTauri } from '../../utils/platform';
import { 
  toggleWindowAlwaysOnTop, 
  checkAutostartEnabled, 
  setAutostartEnabled 
} from '../../utils/tauriBridge';
import { PetId } from '../../types/pet';
import { AVAILABLE_PETS, resolvePetId } from '../../pets/registry';
import { ImportSummary } from '../../types';

export const SettingsView: React.FC = () => {
  const { 
    settings, 
    updateSettings, 
    exportBackup, 
    previewImportBackup, 
    executeImportBackup, 
    restoreBackupSnapshot, 
    setSelectedPet, 
    setWidgetMode 
  } = useTodoStore();

  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [importStatus, setImportStatus] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Import preview dialog state
  const [previewData, setPreviewData] = useState<{ summary: ImportSummary; jsonContent: string } | null>(null);

  // Check system autostart state on mount
  useEffect(() => {
    if (isTauri()) {
      checkAutostartEnabled().then((enabled) => {
        if (enabled !== settings.autoStart) {
          updateSettings({ autoStart: enabled });
        }
      });
    }
  }, []);

  const handleToggleAutostart = async () => {
    const nextVal = !settings.autoStart;
    updateSettings({ autoStart: nextVal });
    if (isTauri()) {
      const ok = await setAutostartEnabled(nextVal);
      if (!ok) {
        // Rollback if system denied
        updateSettings({ autoStart: !nextVal });
      }
    }
  };

  const handleExport = async () => {
    const jsonString = await exportBackup();
    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    link.href = url;
    link.download = `todos_backup_${dateStr}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      setErrorMessage('备份文件体积过大（不可超过 5MB）');
      setTimeout(() => setErrorMessage(null), 4000);
      if (fileInputRef.current) fileInputRef.current.value = '';
      return;
    }

    const reader = new FileReader();
    reader.onload = async (event) => {
      const content = event.target?.result as string;
      if (!content) return;

      try {
        const summary = await previewImportBackup(content);
        setPreviewData({ summary, jsonContent: content });
      } catch (err: any) {
        setErrorMessage(err.message || '文件格式不合法，无法解析');
        setTimeout(() => setErrorMessage(null), 4000);
      }
    };
    reader.readAsText(file);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleConfirmImport = async () => {
    if (!previewData) return;
    const ok = await executeImportBackup(previewData.jsonContent);
    if (ok) {
      setImportStatus('备份数据校验通过，恢复成功！已自动建立安全快照');
      setPreviewData(null);
      setTimeout(() => setImportStatus(null), 4000);
    } else {
      setErrorMessage('导入写入失败');
      setTimeout(() => setErrorMessage(null), 4000);
    }
  };

  const handleRestoreSnapshot = async () => {
    if (window.confirm('确定要恢复至上次导入备份前的数据快照吗？')) {
      const ok = await restoreBackupSnapshot();
      if (ok) {
        setImportStatus('已成功恢复导入前的状态快照！');
        setTimeout(() => setImportStatus(null), 4000);
      } else {
        setErrorMessage('恢复快照失败或快照文件不存在');
        setTimeout(() => setErrorMessage(null), 4000);
      }
    }
  };

  return (
    <div className="flex-1 flex flex-col h-full overflow-y-auto p-6 gap-6 relative">
      {/* Header */}
      <div>
        <h2 className="text-xl font-bold text-zinc-800 dark:text-zinc-100 flex items-center gap-2">
          <span>偏好设置与数据管理</span>
        </h2>
        <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
          个性化定制桌面悬浮挂件外观、快捷键与离线数据备份。
        </p>
      </div>

      <div className="flex flex-col gap-5 max-w-2xl">
        {/* 1. Appearance & Theme */}
        <div className="glass-panel p-5 rounded-2xl flex flex-col gap-4 shadow-sm">
          <h3 className="text-xs font-bold text-zinc-700 dark:text-zinc-200 flex items-center gap-2">
            <Sun size={15} className="text-amber-500" />
            外观与主题
          </h3>

          <div className="flex items-center justify-between">
            <span className="text-xs text-zinc-600 dark:text-zinc-300">界面配色主题</span>
            <div className="flex items-center gap-1.5 p-1 bg-black/5 dark:bg-white/5 rounded-xl">
              {[
                { id: 'system', label: '跟随系统', icon: Laptop },
                { id: 'light', label: '浅色', icon: Sun },
                { id: 'dark', label: '深色', icon: Moon },
              ].map(({ id, label, icon: Icon }) => (
                <button
                  key={id}
                  onClick={() => updateSettings({ theme: id as 'system' | 'light' | 'dark' })}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                    settings.theme === id
                      ? 'bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 shadow-xs'
                      : 'text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100'
                  }`}
                >
                  <Icon size={13} />
                  <span>{label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Opacity Slider */}
          <div className="flex items-center justify-between pt-2 border-t border-zinc-200/60 dark:border-zinc-800">
            <div>
              <span className="text-xs text-zinc-600 dark:text-zinc-300 block">小组件默认不透明度</span>
              <span className="text-[11px] text-zinc-400">调节桌面半透明玻璃质感融入壁纸</span>
            </div>
            <div className="flex items-center gap-3">
              <input
                type="range"
                min="0.35"
                max="1.0"
                step="0.05"
                value={settings.opacity}
                onChange={(e) => updateSettings({ opacity: parseFloat(e.target.value) })}
                className="w-32 h-1.5 bg-zinc-300 dark:bg-zinc-700 rounded-lg appearance-none cursor-pointer accent-blue-600"
              />
              <span className="text-xs font-mono font-bold text-zinc-700 dark:text-zinc-300 min-w-[36px] text-right">
                {Math.round(settings.opacity * 100)}%
              </span>
            </div>
          </div>
        </div>

        {/* 2. Desktop Behavior */}
        <div className="glass-panel p-5 rounded-2xl flex flex-col gap-4 shadow-sm">
          <h3 className="text-xs font-bold text-zinc-700 dark:text-zinc-200 flex items-center gap-2">
            <Sliders size={15} className="text-blue-500" />
            桌面专属交互
          </h3>

          {/* Always on top */}
          <div className="flex items-center justify-between">
            <div>
              <span className="text-xs text-zinc-600 dark:text-zinc-300 block">悬浮小组件总在最前</span>
              <span className="text-[11px] text-zinc-400">关闭后挂件将贴紧桌面，不遮挡工作窗口</span>
            </div>
            <button
              onClick={() => {
                const nextVal = !settings.alwaysOnTop;
                updateSettings({ alwaysOnTop: nextVal });
                toggleWindowAlwaysOnTop(nextVal);
              }}
              className={`w-11 h-6 rounded-full transition-colors relative ${
                settings.alwaysOnTop ? 'bg-blue-600' : 'bg-zinc-300 dark:bg-zinc-700'
              }`}
            >
              <div
                className={`w-4 h-4 rounded-full bg-white absolute top-1 transition-transform ${
                  settings.alwaysOnTop ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>

          {/* Edge Snap */}
          <div className="flex items-center justify-between pt-2 border-t border-zinc-200/60 dark:border-zinc-800">
            <div>
              <span className="text-xs text-zinc-600 dark:text-zinc-300 block">屏幕边缘自动磁吸</span>
              <span className="text-[11px] text-zinc-400">拖拽小组件靠近屏幕边缘时自动平滑吸附对齐</span>
            </div>
            <button
              onClick={() => updateSettings({ edgeSnap: !settings.edgeSnap })}
              className={`w-11 h-6 rounded-full transition-colors relative ${
                settings.edgeSnap ? 'bg-blue-600' : 'bg-zinc-300 dark:bg-zinc-700'
              }`}
            >
              <div
                className={`w-4 h-4 rounded-full bg-white absolute top-1 transition-transform ${
                  settings.edgeSnap ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>

          {/* Autostart (Real System Integration) */}
          <div className="flex items-center justify-between pt-2 border-t border-zinc-200/60 dark:border-zinc-800">
            <div>
              <span className="text-xs text-zinc-600 dark:text-zinc-300 block">开机自动启动</span>
              <span className="text-[11px] text-zinc-400">系统开机后自动在托盘静默启动悬浮小组件</span>
            </div>
            <button
              onClick={handleToggleAutostart}
              className={`w-11 h-6 rounded-full transition-colors relative ${
                settings.autoStart ? 'bg-blue-600' : 'bg-zinc-300 dark:bg-zinc-700'
              }`}
            >
              <div
                className={`w-4 h-4 rounded-full bg-white absolute top-1 transition-transform ${
                  settings.autoStart ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>

          {/* Hotkey */}
          <div className="flex items-center justify-between pt-2 border-t border-zinc-200/60 dark:border-zinc-800">
            <div>
              <span className="text-xs text-zinc-600 dark:text-zinc-300 block">全局呼出 / 隐藏快捷键</span>
              <span className="text-[11px] text-zinc-400">支持在任何工作窗口下一键显示或隐藏小组件</span>
            </div>
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 font-mono text-xs font-semibold text-zinc-800 dark:text-zinc-200">
              <Keyboard size={13} className="text-zinc-400" />
              <span>{formatHotkeyDisplay(settings.hotkey)}</span>
            </div>
          </div>
        </div>

        {/* 3. Desktop Pet Workshop */}
        <div className="glass-panel p-5 rounded-2xl flex flex-col gap-4 shadow-sm">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold text-zinc-700 dark:text-zinc-200 flex items-center gap-2">
              <PawPrint size={15} className="text-amber-500" />
              桌面像素萌宠伴侣工坊
            </h3>

            <button
              onClick={() => setWidgetMode(settings.widgetMode === 'pet' ? 'list' : 'pet')}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-semibold transition-all ${
                settings.widgetMode === 'pet'
                  ? 'bg-amber-500 text-white shadow-xs'
                  : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 hover:bg-amber-50 dark:hover:bg-amber-950/60'
              }`}
            >
              <span>{settings.widgetMode === 'pet' ? '🐾 当前处于桌宠模式' : '切换为桌宠模式'}</span>
            </button>
          </div>

          <p className="text-[11px] text-zinc-500 dark:text-zinc-400">
            专注办公时可将悬浮窗一键变身为极简像素萌宠，常驻播报待办进度，完成任务时跳跃庆祝。
          </p>

          <div className="grid grid-cols-2 gap-3">
            {AVAILABLE_PETS.map((pet) => {
              const petKey = pet.id as PetId;
              const isSelected = resolvePetId(settings.selectedPet || 'cat') === petKey;

              return (
                <button
                  key={petKey}
                  onClick={() => setSelectedPet(petKey)}
                  className={`p-3 rounded-2xl flex items-start gap-3 text-left transition-all relative ${
                    isSelected
                      ? 'bg-amber-50/80 dark:bg-amber-950/40 border-2 border-amber-500 shadow-xs'
                      : 'glass-card hover:bg-white/80 dark:hover:bg-zinc-800/80 border border-black/5 dark:border-white/5'
                  }`}
                >
                  <span className="text-2xl">{pet.emoji}</span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-zinc-800 dark:text-zinc-100">
                        {pet.name}
                      </span>
                      {isSelected && (
                        <span className="text-[10px] font-bold text-amber-600 dark:text-amber-400">
                          已出战
                        </span>
                      )}
                    </div>
                    <span className="text-[10px] text-zinc-400 block mt-0.5">{pet.species}</span>
                    <span className="text-[10px] text-zinc-500 dark:text-zinc-400 block mt-1 line-clamp-2">
                      {pet.tagline}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>

          <div className="flex items-center justify-between pt-2 border-t border-zinc-200/60 dark:border-zinc-800">
            <div>
              <span className="text-xs text-zinc-600 dark:text-zinc-300 block">开启头顶碎碎念气泡</span>
              <span className="text-[11px] text-zinc-400">宠物会根据待办完成度、超时、早晚问候进行智能互动发言</span>
            </div>
            <button
              onClick={() => updateSettings({ petSpeechEnabled: !settings.petSpeechEnabled })}
              className={`w-11 h-6 rounded-full transition-colors relative ${
                settings.petSpeechEnabled ? 'bg-blue-600' : 'bg-zinc-300 dark:bg-zinc-700'
              }`}
            >
              <div
                className={`w-4 h-4 rounded-full bg-white absolute top-1 transition-transform ${
                  settings.petSpeechEnabled ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>
        </div>

        {/* 4. Feedback & Sound */}
        <div className="glass-panel p-5 rounded-2xl flex flex-col gap-4 shadow-sm">
          <h3 className="text-xs font-bold text-zinc-700 dark:text-zinc-200 flex items-center gap-2">
            <Sparkles size={15} className="text-purple-500" />
            动效与提醒
          </h3>

          <div className="flex items-center justify-between">
            <div>
              <span className="text-xs text-zinc-600 dark:text-zinc-300 block">到期系统横幅通知</span>
              <span className="text-[11px] text-zinc-400">任务到达设定时间时推送系统原生通知（包含休眠补偿与智能聚合）</span>
            </div>
            <button
              onClick={() => updateSettings({ notificationEnabled: !settings.notificationEnabled })}
              className={`w-11 h-6 rounded-full transition-colors relative ${
                settings.notificationEnabled ? 'bg-blue-600' : 'bg-zinc-300 dark:bg-zinc-700'
              }`}
            >
              <div
                className={`w-4 h-4 rounded-full bg-white absolute top-1 transition-transform ${
                  settings.notificationEnabled ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>

          <div className="flex items-center justify-between pt-2 border-t border-zinc-200/60 dark:border-zinc-800">
            <div>
              <span className="text-xs text-zinc-600 dark:text-zinc-300 block">完成与操作音效</span>
              <span className="text-[11px] text-zinc-400">完成待办勾选及全量达成时播放清脆提示音</span>
            </div>
            <button
              onClick={() => updateSettings({ soundEnabled: !settings.soundEnabled })}
              className={`w-11 h-6 rounded-full transition-colors relative ${
                settings.soundEnabled ? 'bg-blue-600' : 'bg-zinc-300 dark:bg-zinc-700'
              }`}
            >
              <div
                className={`w-4 h-4 rounded-full bg-white absolute top-1 transition-transform ${
                  settings.soundEnabled ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>

          <div className="flex items-center justify-between pt-2 border-t border-zinc-200/60 dark:border-zinc-800">
            <span className="text-xs text-zinc-600 dark:text-zinc-300">全量达成时触发彩带粒子动效</span>
            <button
              onClick={() => updateSettings({ confettiEnabled: !settings.confettiEnabled })}
              className={`w-11 h-6 rounded-full transition-colors relative ${
                settings.confettiEnabled ? 'bg-blue-600' : 'bg-zinc-300 dark:bg-zinc-700'
              }`}
            >
              <div
                className={`w-4 h-4 rounded-full bg-white absolute top-1 transition-transform ${
                  settings.confettiEnabled ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>
        </div>

        {/* 5. Local Data & Backup */}
        <div className="glass-panel p-5 rounded-2xl flex flex-col gap-4 shadow-sm">
          <h3 className="text-xs font-bold text-zinc-700 dark:text-zinc-200 flex items-center gap-2">
            <ShieldCheck size={15} className="text-emerald-500" />
            数据持久化与安全备份 (多窗口同步 & 自动快照防护)
          </h3>

          <p className="text-[11px] text-zinc-500 dark:text-zinc-400">
            所有待办、习惯与历史打卡 100% 存储于本地独立数据源，双窗口操作实时强一致同步。导入备份前自动建立安全快照，杜绝数据损坏。
          </p>

          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={handleExport}
              className="flex items-center gap-1.5 px-4 py-2 bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 rounded-xl text-xs font-medium hover:opacity-90 transition-all shadow-xs"
            >
              <Download size={14} />
              <span>导出 JSON 备份</span>
            </button>

            <button
              onClick={() => fileInputRef.current?.click()}
              className="flex items-center gap-1.5 px-4 py-2 border border-zinc-200 dark:border-zinc-700 text-zinc-700 dark:text-zinc-200 hover:bg-black/5 dark:hover:bg-white/5 rounded-xl text-xs font-medium transition-all"
            >
              <Upload size={14} />
              <span>导入 JSON 恢复</span>
            </button>

            {isTauri() && (
              <button
                onClick={handleRestoreSnapshot}
                className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200 transition-colors"
                title="当误导入数据时，一键恢复至导入前的快照备份"
              >
                <RotateCcw size={13} />
                <span>撤回至上次导入前快照</span>
              </button>
            )}

            <input
              ref={fileInputRef}
              type="file"
              accept=".json"
              onChange={handleFileChange}
              className="hidden"
            />
          </div>

          {importStatus && (
            <div className="flex items-center gap-1.5 text-xs text-emerald-600 dark:text-emerald-400 font-medium">
              <Check size={14} />
              <span>{importStatus}</span>
            </div>
          )}

          {errorMessage && (
            <div className="flex items-center gap-1.5 text-xs text-rose-500 font-medium">
              <AlertTriangle size={14} />
              <span>{errorMessage}</span>
            </div>
          )}
        </div>
      </div>

      {/* Confirmation Modal for Import Preview (P1.5) */}
      {previewData && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="glass-panel max-w-md w-full p-6 rounded-3xl shadow-xl flex flex-col gap-4 border border-zinc-200/80 dark:border-zinc-700/80 bg-white/95 dark:bg-zinc-900/95">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-amber-500">
                <AlertTriangle size={20} />
                <h3 className="text-sm font-bold text-zinc-800 dark:text-zinc-100">确认覆盖并导入备份？</h3>
              </div>
              <button 
                onClick={() => setPreviewData(null)}
                className="p-1 rounded-lg text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200"
              >
                <X size={16} />
              </button>
            </div>

            <p className="text-xs text-zinc-500 dark:text-zinc-400">
              系统已对备份文件进行格式与安全性校验。导入后将完全替换当前的数据清单。
            </p>

            {/* Summary details */}
            <div className="grid grid-cols-3 gap-2 p-3 bg-zinc-50 dark:bg-zinc-800/60 rounded-2xl text-center">
              <div>
                <span className="text-[10px] text-zinc-400 block">待办事项</span>
                <span className="text-base font-bold text-blue-600 dark:text-blue-400">
                  {previewData.summary.todoCount} 条
                </span>
              </div>
              <div>
                <span className="text-[10px] text-zinc-400 block">循环习惯</span>
                <span className="text-base font-bold text-indigo-600 dark:text-indigo-400">
                  {previewData.summary.habitCount} 项
                </span>
              </div>
              <div>
                <span className="text-[10px] text-zinc-400 block">历史天数</span>
                <span className="text-base font-bold text-emerald-600 dark:text-emerald-400">
                  {previewData.summary.recordCount} 天
                </span>
              </div>
            </div>

            {previewData.summary.exportDate && (
              <p className="text-[11px] text-zinc-400">
                备份时间：{new Date(previewData.summary.exportDate).toLocaleString()}
              </p>
            )}

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => setPreviewData(null)}
                className="px-4 py-2 text-xs font-medium text-zinc-600 dark:text-zinc-300 hover:bg-black/5 dark:hover:bg-white/5 rounded-xl transition-all"
              >
                取消
              </button>
              <button
                onClick={handleConfirmImport}
                className="px-4 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-xl transition-all shadow-xs"
              >
                确认并替换当前数据
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

/**
 * Tauri desktop bridge with safe browser fallbacks
 */
import { isTauri } from './platform';
import { AppSettings, ImportSummary, TodoItem, HabitItem } from '../types';

export const STATE_CHANGED_EVENT = 'daily-todos://state-changed';

export async function toggleWindowAlwaysOnTop(alwaysOnTop: boolean) {
  if (!isTauri()) return;
  try {
    const { invoke } = await import('@tauri-apps/api/core');
    await invoke('set_widget_always_on_top', { alwaysOnTop });
  } catch (e) {
    console.warn('Failed to set always on top via invoke:', e);
  }
}

export async function setWindowClickThrough(ignoreCursor: boolean) {
  if (!isTauri()) return;
  try {
    const { getCurrentWebviewWindow } = await import('@tauri-apps/api/webviewWindow');
    const appWindow = getCurrentWebviewWindow();
    await appWindow.setIgnoreCursorEvents(ignoreCursor);
  } catch (e) {
    console.warn('Failed to set cursor ignore events:', e);
  }
}

export async function startWindowDragging() {
  if (!isTauri()) return;
  try {
    const { getCurrentWebviewWindow } = await import('@tauri-apps/api/webviewWindow');
    const appWindow = getCurrentWebviewWindow();
    await appWindow.startDragging();
  } catch (e) {
    console.warn('Failed to start dragging:', e);
  }
}

export async function hideWidgetToTray() {
  if (!isTauri()) return;
  try {
    const { invoke } = await import('@tauri-apps/api/core');
    await invoke('hide_widget_window');
  } catch (e) {
    console.warn('Failed to hide widget via invoke:', e);
  }
}

export async function minimizeCurrentWindow() {
  await hideWidgetToTray();
}

export async function openOrFocusMainWindow() {
  if (!isTauri()) {
    window.location.hash = '#/main';
    return;
  }
  try {
    const { invoke } = await import('@tauri-apps/api/core');
    await invoke('open_main_window');
  } catch (e) {
    console.warn('Failed to open main window via invoke:', e);
    window.location.hash = '#/main';
  }
}

export async function closeMainAndShowWidget() {
  if (!isTauri()) {
    window.location.hash = '#/widget';
    return;
  }
  try {
    const { invoke } = await import('@tauri-apps/api/core');
    await invoke('close_main_and_show_widget');
  } catch (e) {
    console.warn('Failed to close main and show widget via invoke:', e);
    window.location.hash = '#/widget';
  }
}

export async function resizeWidgetWindow(width: number, height: number, resizable: boolean) {
  if (!isTauri()) return;
  try {
    const { invoke } = await import('@tauri-apps/api/core');
    await invoke('resize_widget_window', { width, height, resizable });
  } catch (e) {
    console.warn('Failed to resize widget via invoke:', e);
  }
}

// ================= State Management IPC =================

export async function getAppStateIpc() {
  if (!isTauri()) return null;
  const { invoke } = await import('@tauri-apps/api/core');
  return await invoke('get_app_state');
}

export async function addTodoIpc(payload: {
  title: string;
  priority?: string;
  dueTime?: string;
  todoType?: string;
  targetDate?: string;
  startDate?: string;
  endDate?: string;
}): Promise<TodoItem | null> {
  if (!isTauri()) return null;
  const { invoke } = await import('@tauri-apps/api/core');
  return await invoke('add_todo', { payload });
}

export async function toggleTodoIpc(id: string): Promise<boolean | null> {
  if (!isTauri()) return null;
  const { invoke } = await import('@tauri-apps/api/core');
  return await invoke('toggle_todo', { id });
}

export async function deleteTodoIpc(id: string): Promise<void> {
  if (!isTauri()) return;
  const { invoke } = await import('@tauri-apps/api/core');
  await invoke('delete_todo', { id });
}

export async function updateTodoIpc(id: string, updates: Partial<TodoItem>): Promise<void> {
  if (!isTauri()) return;
  const { invoke } = await import('@tauri-apps/api/core');
  await invoke('update_todo', {
    payload: {
      id,
      title: updates.title,
      priority: updates.priority,
      dueTime: updates.dueTime,
      targetDate: updates.targetDate,
      startDate: updates.startDate,
      endDate: updates.endDate,
    },
  });
}

export async function updateHabitIpc(payload: {
  id: string;
  title?: string;
  priority?: string;
  dueTime?: string;
  activeDays?: number[];
}): Promise<void> {
  if (!isTauri()) return;
  const { invoke } = await import('@tauri-apps/api/core');
  await invoke('update_habit', { payload });
}

export async function changeGlobalHotkeyIpc(newHotkey: string): Promise<void> {
  if (!isTauri()) return;
  const { invoke } = await import('@tauri-apps/api/core');
  await invoke('change_global_hotkey', { newHotkey });
}

export async function addHabitIpc(payload: {
  title: string;
  priority?: string;
  dueTime?: string;
  activeDays?: number[];
}): Promise<HabitItem | null> {
  if (!isTauri()) return null;
  const { invoke } = await import('@tauri-apps/api/core');
  return await invoke('add_habit', payload);
}

export async function addHabitAndTodoIpc(payload: {
  title: string;
  priority?: string;
  dueTime?: string;
  activeDays?: number[];
}): Promise<TodoItem | null> {
  if (!isTauri()) return null;
  const { invoke } = await import('@tauri-apps/api/core');
  return await invoke('add_habit_and_todo', payload);
}

export async function archiveHabitIpc(id: string): Promise<void> {
  if (!isTauri()) return;
  const { invoke } = await import('@tauri-apps/api/core');
  await invoke('archive_habit', { id });
}

export async function unarchiveHabitIpc(id: string): Promise<void> {
  if (!isTauri()) return;
  const { invoke } = await import('@tauri-apps/api/core');
  await invoke('unarchive_habit', { id });
}

export async function deleteHabitPermanentlyIpc(id: string): Promise<void> {
  if (!isTauri()) return;
  const { invoke } = await import('@tauri-apps/api/core');
  await invoke('delete_habit_permanently', { id });
}

export async function updateSettingsIpc(settings: AppSettings): Promise<void> {
  if (!isTauri()) return;
  const { invoke } = await import('@tauri-apps/api/core');
  await invoke('update_settings', { settings });
}

export async function exportBackupIpc(): Promise<string | null> {
  if (!isTauri()) return null;
  const { invoke } = await import('@tauri-apps/api/core');
  return await invoke('export_backup_data');
}

export async function previewImportBackupIpc(jsonStr: string): Promise<ImportSummary | null> {
  if (!isTauri()) return null;
  const { invoke } = await import('@tauri-apps/api/core');
  return await invoke('preview_import_backup', { jsonStr });
}

export async function executeImportBackupIpc(jsonStr: string): Promise<any | null> {
  if (!isTauri()) return null;
  const { invoke } = await import('@tauri-apps/api/core');
  return await invoke('execute_import_backup', { jsonStr });
}

export async function restoreBackupSnapshotIpc(): Promise<any | null> {
  if (!isTauri()) return null;
  const { invoke } = await import('@tauri-apps/api/core');
  return await invoke('restore_backup_snapshot');
}

export async function triggerDailyRolloverIpc(): Promise<any | null> {
  if (!isTauri()) return null;
  const { invoke } = await import('@tauri-apps/api/core');
  return await invoke('trigger_daily_rollover');
}

export async function listenStateChanged(callback: (state: any) => void): Promise<(() => void) | null> {
  if (!isTauri()) return null;
  try {
    const { listen } = await import('@tauri-apps/api/event');
    const unlisten = await listen(STATE_CHANGED_EVENT, (event) => {
      callback(event.payload);
    });
    return unlisten;
  } catch (e) {
    console.warn('Failed to listen state changed event:', e);
    return null;
  }
}

// ================= Native Plugins Bridge =================

export async function checkAutostartEnabled(): Promise<boolean> {
  if (!isTauri()) return false;
  try {
    const { isEnabled } = await import('@tauri-apps/plugin-autostart');
    return await isEnabled();
  } catch (e) {
    console.warn('Failed to check autostart:', e);
    return false;
  }
}

export async function setAutostartEnabled(enable: boolean): Promise<boolean> {
  if (!isTauri()) return false;
  try {
    const { enable: enableAuto, disable: disableAuto } = await import('@tauri-apps/plugin-autostart');
    if (enable) {
      await enableAuto();
    } else {
      await disableAuto();
    }
    return true;
  } catch (e) {
    console.warn('Failed to toggle autostart:', e);
    return false;
  }
}

export interface WindowBounds {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface MonitorBounds {
  x: number;
  y: number;
  width: number;
  height: number;
}

export function calculateSnappedPosition(
  win: WindowBounds,
  monitor: MonitorBounds,
  threshold = 32
): { x: number; y: number; snapped: boolean } {
  const monitorLeft = monitor.x;
  const monitorTop = monitor.y;
  const monitorRight = monitorLeft + monitor.width;
  const monitorBottom = monitorTop + monitor.height;

  let newX = win.x;
  let newY = win.y;
  let snapped = false;

  if (Math.abs(win.x - monitorLeft) < threshold) {
    newX = monitorLeft;
    snapped = true;
  } else if (Math.abs(win.x + win.width - monitorRight) < threshold) {
    newX = monitorRight - win.width;
    snapped = true;
  }

  if (Math.abs(win.y - monitorTop) < threshold) {
    newY = monitorTop;
    snapped = true;
  } else if (Math.abs(win.y + win.height - monitorBottom) < threshold) {
    newY = monitorBottom - win.height;
    snapped = true;
  }

  return { x: newX, y: newY, snapped };
}

export async function snapWindowToEdge() {
  if (!isTauri()) return;
  try {
    const { getCurrentWebviewWindow } = await import('@tauri-apps/api/webviewWindow');
    const { currentMonitor } = await import('@tauri-apps/api/window');
    const { PhysicalPosition } = await import('@tauri-apps/api/dpi');

    const appWindow = getCurrentWebviewWindow();
    const monitor = await currentMonitor();
    if (!monitor) return;

    const pos = await appWindow.outerPosition();
    const size = await appWindow.outerSize();

    const result = calculateSnappedPosition(
      { x: pos.x, y: pos.y, width: size.width, height: size.height },
      { x: monitor.position.x, y: monitor.position.y, width: monitor.size.width, height: monitor.size.height },
      32
    );

    if (result.snapped) {
      await appWindow.setPosition(new PhysicalPosition(result.x, result.y));
    }
  } catch (e) {
    console.warn('Failed to snap window to edge:', e);
  }
}

/**
 * Platform utilities for Windows and macOS cross-platform compatibility
 */

export function isMacOS(): boolean {
  if (typeof window === 'undefined') return false;
  return /Mac|iPhone|iPod|iPad/i.test(navigator.platform || navigator.userAgent);
}

export function isWindows(): boolean {
  if (typeof window === 'undefined') return true;
  return /Win/i.test(navigator.platform || navigator.userAgent);
}

export function getPlatformModifierKey(): string {
  return isMacOS() ? '⌘' : 'Ctrl';
}

export function getPlatformAltKey(): string {
  return isMacOS() ? '⌥' : 'Alt';
}

/**
 * Formats a hotkey string like "CommandOrControl+Shift+T" or "Alt+Shift+T"
 * into friendly display text based on current OS
 */
export function formatHotkeyDisplay(hotkey: string): string {
  if (isMacOS()) {
    return hotkey
      .replace(/CommandOrControl|Ctrl|Cmd/gi, '⌘')
      .replace(/Alt|Option/gi, '⌥')
      .replace(/Shift/gi, '⇧')
      .replace(/\+/g, ' ');
  } else {
    return hotkey
      .replace(/CommandOrControl/gi, 'Ctrl')
      .replace(/Cmd/gi, 'Win')
      .replace(/\+/g, ' + ');
  }
}

/**
 * Checks if running inside Tauri desktop environment
 */
export function isTauri(): boolean {
  return typeof window !== 'undefined' && '__TAURI_INTERNALS__' in window;
}

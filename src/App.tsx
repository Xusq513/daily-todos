import { useState, useEffect } from 'react';
import { FloatingWidget } from './components/widget/FloatingWidget';
import { MainWindow } from './components/main/MainWindow';
import { useTodoStore } from './store/useTodoStore';
import { isTauri } from './utils/platform';

export function App() {
  const { settings } = useTodoStore();
  const [viewMode, setViewMode] = useState<'widget' | 'main'>('widget');

  // Check window label or hash on mount
  useEffect(() => {
    const checkWindowTarget = async () => {
      // 1. Check hash
      const hash = window.location.hash;
      if (hash.includes('/main')) {
        setViewMode('main');
        return;
      }

      // 2. Check Tauri window label
      if (isTauri()) {
        try {
          const { getCurrentWebviewWindow } = await import('@tauri-apps/api/webviewWindow');
          const currentWindow = getCurrentWebviewWindow();
          if (currentWindow.label === 'main') {
            setViewMode('main');
          } else {
            setViewMode('widget');
          }
        } catch (e) {
          console.warn('Could not determine tauri window label:', e);
        }
      }
    };

    checkWindowTarget();

    const handleHashChange = () => {
      if (window.location.hash.includes('/main')) {
        setViewMode('main');
      } else {
        setViewMode('widget');
      }
    };

    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  // Theme synchronization (light / dark / system)
  useEffect(() => {
    const root = document.documentElement;
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');

    const applyTheme = () => {
      if (settings.theme === 'dark') {
        root.classList.add('dark');
      } else if (settings.theme === 'light') {
        root.classList.remove('dark');
      } else {
        // System preference
        if (mediaQuery.matches) {
          root.classList.add('dark');
        } else {
          root.classList.remove('dark');
        }
      }
    };

    applyTheme();
    mediaQuery.addEventListener('change', applyTheme);
    return () => mediaQuery.removeEventListener('change', applyTheme);
  }, [settings.theme]);

  return (
    <div className="w-full h-full flex items-center justify-center select-none bg-transparent">
      {viewMode === 'widget' ? (
        <FloatingWidget />
      ) : (
        <MainWindow />
      )}
    </div>
  );
}

export default App;

import React, { useState } from 'react';
import { MainSidebar, MainTab } from './MainSidebar';
import { TodayView } from './TodayView';
import { UpcomingView } from './UpcomingView';
import { HabitsManager } from './HabitsManager';
import { CalendarView } from './CalendarView';
import { SettingsView } from './SettingsView';

interface MainWindowProps {
  onBackToWidget?: () => void;
}

export const MainWindow: React.FC<MainWindowProps> = ({ onBackToWidget }) => {
  const [currentTab, setCurrentTab] = useState<MainTab>('today');

  return (
    <div className="w-full h-full flex overflow-hidden bg-slate-50/80 dark:bg-zinc-950/80 backdrop-blur-xl">
      {/* Sidebar */}
      <MainSidebar 
        currentTab={currentTab} 
        onSelectTab={setCurrentTab} 
        onBackToWidget={onBackToWidget} 
      />

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col h-full overflow-hidden">
        {currentTab === 'today' && <TodayView />}
        {currentTab === 'upcoming' && <UpcomingView />}
        {currentTab === 'habits' && <HabitsManager />}
        {currentTab === 'calendar' && <CalendarView />}
        {currentTab === 'settings' && <SettingsView />}
      </main>
    </div>
  );
};

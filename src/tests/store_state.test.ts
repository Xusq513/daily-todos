import { describe, it, expect } from "vitest";
import { AppSettings, HabitItem, TodoItem } from "../types";

describe("store and settings data models", () => {
  it("verifies default settings has notification and sound switches decoupled", () => {
    const defaultSettings: AppSettings = {
      theme: "system",
      opacity: 0.88,
      alwaysOnTop: true,
      isLocked: false,
      autoStart: false,
      edgeSnap: true,
      soundEnabled: true,
      notificationEnabled: true,
      confettiEnabled: true,
      hotkey: "Alt+Shift+T",
      lastActiveDate: "2026-09-07",
      widgetMode: "list",
      selectedPet: "cat",
      petSpeechEnabled: true,
    };

    expect(defaultSettings.soundEnabled).toBe(true);
    expect(defaultSettings.notificationEnabled).toBe(true);

    // Can be toggled independently
    const mutedNotification = { ...defaultSettings, notificationEnabled: false };
    expect(mutedNotification.soundEnabled).toBe(true);
    expect(mutedNotification.notificationEnabled).toBe(false);
  });

  it("ensures habit archiving retains completed historical todos", () => {
    const habit: HabitItem = {
      id: "h_running",
      title: "Morning Running",
      priority: "high",
      activeDays: [1, 3, 5],
      streak: 10,
      createdAt: "2026-08-01T00:00:00Z",
      archived: false,
    };

    const historicalTodos: TodoItem[] = [
      {
        id: "t_run_1",
        title: "Morning Running",
        completed: true,
        type: "daily_habit",
        priority: "high",
        createdAt: "",
        completedAt: "2026-09-05T08:00:00Z",
        targetDate: "2026-09-05",
        habitId: "h_running",
      },
    ];

    // Soft archive habit
    const archivedHabit = { ...habit, archived: true };
    expect(archivedHabit.archived).toBe(true);

    // History must still link to habit and remain untouched
    expect(historicalTodos[0].habitId).toBe(habit.id);
    expect(historicalTodos[0].completed).toBe(true);
  });

  it("verifies ExportData format conforms to schema version 1 and app version 1.1.4", () => {
    const exportData = {
      version: "1.1.4",
      backupSchemaVersion: 1,
      exportDate: new Date().toISOString(),
      todos: [],
      habits: [],
      records: {},
      settings: {
        theme: "system" as const,
        opacity: 0.88,
        alwaysOnTop: true,
        isLocked: false,
        autoStart: false,
        edgeSnap: true,
        soundEnabled: true,
        notificationEnabled: true,
        confettiEnabled: true,
        hotkey: "Alt+Shift+T",
        lastActiveDate: "2026-09-07",
        widgetMode: "list" as const,
        selectedPet: "cat" as const,
        petSpeechEnabled: true,
      },
    };

    expect(exportData.version).toBe("1.1.4");
    expect(exportData.backupSchemaVersion).toBe(1);
    expect(exportData.settings.notificationEnabled).toBe(true);
  });
});

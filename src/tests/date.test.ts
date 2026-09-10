import { describe, it, expect } from "vitest";
import { isTaskActiveToday, getTodayDateStr, formatDateChinese } from "../utils/date";
import { TodoItem } from "../types";

describe("date utils", () => {
  it("getTodayDateStr returns YYYY-MM-DD formatted string", () => {
    const today = getTodayDateStr();
    expect(today).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });

  it("formatDateChinese returns proper Chinese date format", () => {
    const formatted = formatDateChinese("2026-09-07");
    expect(formatted).toContain("9月7日");
    expect(formatted).toContain("周一");
  });

  it("isTaskActiveToday correctly detects active date match", () => {
    const today = getTodayDateStr();
    const task: TodoItem = {
      id: "1",
      title: "Today task",
      completed: false,
      type: "single_todo",
      priority: "medium",
      createdAt: "",
      targetDate: today,
    };
    expect(isTaskActiveToday(task, today)).toBe(true);

    const futureTask: TodoItem = {
      ...task,
      targetDate: "2099-01-01",
    };
    expect(isTaskActiveToday(futureTask, today)).toBe(false);

    // Past uncompleted single_todo rolls over to today
    const pastIncompleteSingle: TodoItem = {
      ...task,
      targetDate: "2026-09-01",
      completed: false,
      type: "single_todo",
    };
    expect(isTaskActiveToday(pastIncompleteSingle, today)).toBe(true);

    // Past uncompleted daily_habit does NOT rollover to today
    const pastIncompleteHabit: TodoItem = {
      ...task,
      targetDate: "2026-09-01",
      completed: false,
      type: "daily_habit",
      habitId: "habit_1",
    };
    expect(isTaskActiveToday(pastIncompleteHabit, today)).toBe(false);

    // Today's daily_habit IS active today
    const todayHabit: TodoItem = {
      ...task,
      targetDate: today,
      completed: false,
      type: "daily_habit",
      habitId: "habit_1",
    };
    expect(isTaskActiveToday(todayHabit, today)).toBe(true);
  });
});

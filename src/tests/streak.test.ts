import { describe, it, expect } from "vitest";
import { calculateHabitStreak } from "../utils/streak";
import { HabitItem, TodoItem } from "../types";

describe("calculateHabitStreak algorithm", () => {
  const baseHabit: HabitItem = {
    id: "h1",
    title: "Read Book",
    priority: "medium",
    activeDays: [1, 2, 3, 4, 5], // Monday through Friday
    streak: 0,
    createdAt: "2026-09-01T00:00:00Z",
    archived: false,
  };

  it("calculates continuous streak across weekdays and skips weekend", () => {
    // 2026-09-07 is Monday (active)
    // 2026-09-06 is Sunday (inactive)
    // 2026-09-05 is Saturday (inactive)
    // 2026-09-04 is Friday (active)
    // 2026-09-03 is Thursday (active)
    const todos: TodoItem[] = [
      {
        id: "t1",
        title: "Read",
        completed: true,
        type: "daily_habit",
        priority: "medium",
        createdAt: "",
        targetDate: "2026-09-07",
        habitId: "h1",
      },
      {
        id: "t2",
        title: "Read",
        completed: true,
        type: "daily_habit",
        priority: "medium",
        createdAt: "",
        targetDate: "2026-09-04",
        habitId: "h1",
      },
      {
        id: "t3",
        title: "Read",
        completed: true,
        type: "daily_habit",
        priority: "medium",
        createdAt: "",
        targetDate: "2026-09-03",
        habitId: "h1",
      },
    ];

    const result = calculateHabitStreak(baseHabit, todos, "2026-09-07");
    expect(result.streak).toBe(3);
    expect(result.lastCompletedDate).toBe("2026-09-07");
  });

  it("breaks streak if an active weekday is missed", () => {
    // Monday (today) not completed yet, Friday was missed, Thursday was completed
    const todos: TodoItem[] = [
      {
        id: "t1",
        title: "Read",
        completed: false, // Today not done
        type: "daily_habit",
        priority: "medium",
        createdAt: "",
        targetDate: "2026-09-07",
        habitId: "h1",
      },
      // Friday 2026-09-04 missed!
      {
        id: "t3",
        title: "Read",
        completed: true,
        type: "daily_habit",
        priority: "medium",
        createdAt: "",
        targetDate: "2026-09-03",
        habitId: "h1",
      },
    ];

    const result = calculateHabitStreak(baseHabit, todos, "2026-09-07");
    // Friday missed, so streak is 0
    expect(result.streak).toBe(0);
  });

  it("returns 0 if activeDays is empty", () => {
    const habitNoDays = { ...baseHabit, activeDays: [] };
    const todos: TodoItem[] = [
      {
        id: "t1",
        title: "Read",
        completed: true,
        type: "daily_habit",
        priority: "medium",
        createdAt: "",
        targetDate: "2026-09-07",
        habitId: "h1",
      },
    ];
    const result = calculateHabitStreak(habitNoDays, todos, "2026-09-07");
    expect(result.streak).toBe(0);
  });
});

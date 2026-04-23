import { summarizeHabitProgress } from "@/features/today/progress";

import type { HabitLogRecord } from "@/features/habits/types";

function createLog(
  logDate: string,
  status: HabitLogRecord["status"],
): HabitLogRecord {
  return {
    created_at: `${logDate}T00:00:00.000Z`,
    habit_id: "habit-1",
    id: `${logDate}-${status}`,
    log_date: logDate,
    note: null,
    status,
    updated_at: `${logDate}T00:00:00.000Z`,
    user_id: "user-1",
  };
}

describe("summarizeHabitProgress", () => {
  const endDate = new Date("2026-04-23T10:30:00");

  it("counts consecutive done days and reports 100% consistency for done-only history", () => {
    const summary = summarizeHabitProgress({
      endDate,
      logs: [
        createLog("2026-04-23", "done"),
        createLog("2026-04-22", "done"),
        createLog("2026-04-21", "done"),
      ],
      windowDays: 30,
    });

    expect(summary).toEqual({
      consistencyRate: 1,
      skipCount: 0,
      streak: 3,
      todayStatus: "done",
    });
  });

  it("excludes skipped days from the consistency denominator and breaks the streak", () => {
    const summary = summarizeHabitProgress({
      endDate,
      logs: [
        createLog("2026-04-23", "done"),
        createLog("2026-04-22", "skipped"),
        createLog("2026-04-21", "done"),
      ],
      windowDays: 30,
    });

    expect(summary).toEqual({
      consistencyRate: 1,
      skipCount: 1,
      streak: 1,
      todayStatus: "done",
    });
  });

  it("includes missed days in consistency and breaks the streak on missed", () => {
    const summary = summarizeHabitProgress({
      endDate,
      logs: [
        createLog("2026-04-23", "done"),
        createLog("2026-04-22", "missed"),
        createLog("2026-04-21", "done"),
      ],
      windowDays: 30,
    });

    expect(summary).toEqual({
      consistencyRate: 2 / 3,
      skipCount: 0,
      streak: 1,
      todayStatus: "done",
    });
  });

  it("uses the final persisted same-day status in the summary", () => {
    const summary = summarizeHabitProgress({
      endDate,
      logs: [
        createLog("2026-04-23", "skipped"),
        createLog("2026-04-22", "done"),
      ],
      windowDays: 30,
    });

    expect(summary).toEqual({
      consistencyRate: 1,
      skipCount: 1,
      streak: 0,
      todayStatus: "skipped",
    });
  });

  it("returns zeros and a null today status for empty history", () => {
    const summary = summarizeHabitProgress({
      endDate,
      logs: [],
      windowDays: 30,
    });

    expect(summary).toEqual({
      consistencyRate: 0,
      skipCount: 0,
      streak: 0,
      todayStatus: null,
    });
  });
});

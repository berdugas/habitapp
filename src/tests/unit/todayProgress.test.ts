import { summarizeHabitProgress } from "@/features/today/progress";

import type { HabitLogRecord } from "@/features/habits/types";

function createLog(
  logDate: string,
  status: HabitLogRecord["status"],
  overrides: Partial<HabitLogRecord> = {},
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
    ...overrides,
  };
}

describe("summarizeHabitProgress", () => {
  const endDate = new Date("2026-04-23T10:30:00");

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

  it("counts skipped logs without including them in the consistency denominator", () => {
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

  it("returns 0 consistency for skipped-only history", () => {
    const summary = summarizeHabitProgress({
      endDate,
      logs: [
        createLog("2026-04-23", "skipped"),
        createLog("2026-04-22", "skipped"),
      ],
      windowDays: 30,
    });

    expect(summary).toEqual({
      consistencyRate: 0,
      skipCount: 2,
      streak: 0,
      todayStatus: "skipped",
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

  it("uses a missed log for today status and breaks the streak", () => {
    const summary = summarizeHabitProgress({
      endDate,
      logs: [
        createLog("2026-04-23", "missed"),
        createLog("2026-04-22", "done"),
      ],
      windowDays: 30,
    });

    expect(summary).toEqual({
      consistencyRate: 1 / 2,
      skipCount: 0,
      streak: 0,
      todayStatus: "missed",
    });
  });

  it("uses a skipped log for today status and breaks the streak", () => {
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

  it("treats a missing log today as no active streak", () => {
    const summary = summarizeHabitProgress({
      endDate,
      logs: [
        createLog("2026-04-22", "done"),
        createLog("2026-04-21", "done"),
      ],
      windowDays: 30,
    });

    expect(summary).toEqual({
      consistencyRate: 1,
      skipCount: 0,
      streak: 0,
      todayStatus: null,
    });
  });

  it("ignores logs outside the trailing window", () => {
    const summary = summarizeHabitProgress({
      endDate,
      logs: [
        createLog("2026-04-23", "done"),
        createLog("2026-03-25", "missed"),
        createLog("2026-03-24", "skipped"),
      ],
      windowDays: 30,
    });

    expect(summary).toEqual({
      consistencyRate: 1 / 2,
      skipCount: 0,
      streak: 1,
      todayStatus: "done",
    });
  });

  it("treats the start boundary as inclusive", () => {
    const summary = summarizeHabitProgress({
      endDate,
      logs: [
        createLog("2026-04-23", "done"),
        createLog("2026-03-25", "done"),
        createLog("2026-03-24", "missed"),
      ],
      windowDays: 30,
    });

    expect(summary).toEqual({
      consistencyRate: 1,
      skipCount: 0,
      streak: 1,
      todayStatus: "done",
    });
  });

  it("produces the same result for unsorted logs", () => {
    const summary = summarizeHabitProgress({
      endDate,
      logs: [
        createLog("2026-04-21", "done"),
        createLog("2026-04-23", "done"),
        createLog("2026-04-22", "done"),
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

  it("uses the newest persisted same-day record when duplicates appear", () => {
    const summary = summarizeHabitProgress({
      endDate,
      logs: [
        createLog("2026-04-23", "done", {
          id: "older-log",
          updated_at: "2026-04-23T09:00:00.000Z",
        }),
        createLog("2026-04-23", "missed", {
          id: "newer-log",
          updated_at: "2026-04-23T10:00:00.000Z",
        }),
        createLog("2026-04-22", "done"),
      ],
      windowDays: 30,
    });

    expect(summary).toEqual({
      consistencyRate: 1 / 2,
      skipCount: 0,
      streak: 0,
      todayStatus: "missed",
    });
  });
});

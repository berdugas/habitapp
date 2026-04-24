import { addDeviceDays, toDeviceDateString } from "@/utils/dates";

import type { HabitLogRecord } from "@/features/habits/types";

type SummarizeHabitProgressOptions = {
  endDate?: Date;
  logs: HabitLogRecord[];
  windowDays: number;
};

export type HabitProgressSummary = {
  consistencyRate: number;
  skipCount: number;
  streak: number;
  todayStatus: HabitLogRecord["status"] | null;
};

function getLogRecency(log: HabitLogRecord) {
  const updatedAt = Date.parse(log.updated_at);

  if (!Number.isNaN(updatedAt)) {
    return updatedAt;
  }

  const createdAt = Date.parse(log.created_at);

  if (!Number.isNaN(createdAt)) {
    return createdAt;
  }

  return 0;
}

export function summarizeHabitProgress({
  endDate = new Date(),
  logs,
  windowDays,
}: SummarizeHabitProgressOptions): HabitProgressSummary {
  const normalizedEndDate = new Date(endDate);
  normalizedEndDate.setHours(0, 0, 0, 0);
  const endDateString = toDeviceDateString(normalizedEndDate);
  const startDateString = toDeviceDateString(
    addDeviceDays(normalizedEndDate, -(windowDays - 1)),
  );
  const logsByDate = new Map<string, HabitLogRecord>();

  for (const log of logs) {
    if (log.log_date < startDateString || log.log_date > endDateString) {
      continue;
    }

    const existingLog = logsByDate.get(log.log_date);

    if (!existingLog || getLogRecency(log) >= getLogRecency(existingLog)) {
      logsByDate.set(log.log_date, log);
    }
  }

  const todayStatus = logsByDate.get(endDateString)?.status ?? null;

  let doneCount = 0;
  let missedCount = 0;
  let skipCount = 0;

  for (const log of logsByDate.values()) {
    if (log.status === "done") {
      doneCount += 1;
    } else if (log.status === "missed") {
      missedCount += 1;
    } else if (log.status === "skipped") {
      skipCount += 1;
    }
  }

  const consistencyDenominator = doneCount + missedCount;
  const consistencyRate =
    consistencyDenominator === 0 ? 0 : doneCount / consistencyDenominator;

  let streak = 0;

  for (let offset = 0; offset < windowDays; offset += 1) {
    const currentDateString = toDeviceDateString(
      addDeviceDays(normalizedEndDate, -offset),
    );
    const currentLog = logsByDate.get(currentDateString);

    if (!currentLog || currentLog.status !== "done") {
      break;
    }

    streak += 1;
  }

  return {
    consistencyRate,
    skipCount,
    streak,
    todayStatus,
  };
}

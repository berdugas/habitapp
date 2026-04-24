import {
  getTrailingDateRangeStrings,
  getWeekStartDateString,
  toDeviceDateString,
} from "@/utils/dates";

describe("date helpers", () => {
  it("uses device-local date formatting", () => {
    expect(toDeviceDateString(new Date("2026-04-21T10:30:00"))).toBe(
      "2026-04-21",
    );
  });

  it("returns the same date when Monday is the week start", () => {
    expect(getWeekStartDateString(new Date("2026-04-20T10:30:00"))).toBe(
      "2026-04-20",
    );
  });

  it("uses Monday as the week start from Tuesday through Sunday", () => {
    const expectedWeekStart = "2026-04-20";

    for (const day of [
      "2026-04-21",
      "2026-04-22",
      "2026-04-23",
      "2026-04-24",
      "2026-04-25",
      "2026-04-26",
    ]) {
      expect(getWeekStartDateString(new Date(`${day}T10:30:00`))).toBe(
        expectedWeekStart,
      );
    }
  });

  it("handles month boundaries when calculating week start", () => {
    expect(getWeekStartDateString(new Date("2026-05-01T10:30:00"))).toBe(
      "2026-04-27",
    );
  });

  it("handles year boundaries when calculating week start", () => {
    expect(getWeekStartDateString(new Date("2027-01-01T10:30:00"))).toBe(
      "2026-12-28",
    );
  });

  it("returns week start as YYYY-MM-DD", () => {
    expect(getWeekStartDateString(new Date("2026-04-22T10:30:00"))).toMatch(
      /^\d{4}-\d{2}-\d{2}$/,
    );
  });

  it("builds the last 30-day local date window inclusive of today", () => {
    expect(
      getTrailingDateRangeStrings(30, new Date("2026-04-23T10:30:00")),
    ).toEqual({
      endDate: "2026-04-23",
      startDate: "2026-03-25",
    });
  });
});

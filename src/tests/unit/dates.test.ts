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

  it("uses Monday as the week start", () => {
    expect(getWeekStartDateString(new Date("2026-04-22T10:30:00"))).toBe(
      "2026-04-20",
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

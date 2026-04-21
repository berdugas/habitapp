import { getWeekStartDateString, toDeviceDateString } from "@/utils/dates";

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
});

import { validateCreateHabitPayload } from "@/features/habits/validators";

describe("validateCreateHabitPayload", () => {
  it("rejects whitespace-only required fields", () => {
    expect(
      validateCreateHabitPayload({
        identityStatement: "",
        name: "   ",
        preferredTimeWindow: "",
        reminderEnabled: false,
        reminderTime: "",
        stackTrigger: "   ",
        tinyAction: "   ",
      }),
    ).toEqual({
      name: "Habit name is required.",
      stackTrigger: "Stack trigger is required.",
      tinyAction: "Tiny action is required.",
    });
  });

  it("rejects values that exceed the database-backed length limits", () => {
    expect(
      validateCreateHabitPayload({
        identityStatement: "",
        name: "a".repeat(121),
        preferredTimeWindow: "",
        reminderEnabled: false,
        reminderTime: "",
        stackTrigger: "b".repeat(241),
        tinyAction: "c".repeat(241),
      }),
    ).toEqual({
      name: "Habit name must stay under 120 characters.",
      stackTrigger: "Stack trigger must stay under 240 characters.",
      tinyAction: "Tiny action must stay under 240 characters.",
    });
  });

  it("requires a valid 24-hour reminder time when reminders are enabled", () => {
    expect(
      validateCreateHabitPayload({
        identityStatement: "",
        name: "Reading",
        preferredTimeWindow: "",
        reminderEnabled: true,
        reminderTime: "8pm",
        stackTrigger: "After breakfast",
        tinyAction: "Read 1 page",
      }),
    ).toEqual({
      reminderTime: "Use a valid 24-hour time like 20:00.",
    });
  });

  it("allows optional fields to be blank", () => {
    expect(
      validateCreateHabitPayload({
        identityStatement: "",
        name: "Reading",
        preferredTimeWindow: "",
        reminderEnabled: false,
        reminderTime: "",
        stackTrigger: "After breakfast",
        tinyAction: "Read 1 page",
      }),
    ).toEqual({});
  });

  it("requires reminder time when reminders are enabled even before format validation", () => {
    expect(
      validateCreateHabitPayload({
        identityStatement: "",
        name: "Reading",
        preferredTimeWindow: "",
        reminderEnabled: true,
        reminderTime: "   ",
        stackTrigger: "After breakfast",
        tinyAction: "Read 1 page",
      }),
    ).toEqual({
      reminderTime: "Pick a reminder time or turn reminders off.",
    });
  });
});

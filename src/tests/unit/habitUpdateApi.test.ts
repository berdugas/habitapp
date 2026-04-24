const mockUpdateSingle = jest.fn();
const mockUpdateSelect = jest.fn(() => ({
  single: mockUpdateSingle,
}));
const mockEqUser = jest.fn(() => ({
  select: mockUpdateSelect,
}));
const mockEqId = jest.fn(() => ({
  eq: mockEqUser,
}));
const mockUpdate = jest.fn(() => ({
  eq: mockEqId,
}));
const mockFrom = jest.fn((_table: string) => ({
  update: mockUpdate,
}));
const mockLoggerError = jest.fn();

jest.mock("@/lib/supabase/client", () => ({
  supabase: {
    from: (table: string) => mockFrom(table),
  },
}));

jest.mock("@/services/logger", () => ({
  logger: {
    error: (...args: unknown[]) => mockLoggerError(...args),
  },
}));

import {
  setHabitActiveState,
  updateHabit,
} from "@/features/habits/api";

describe("habit update api", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUpdateSingle.mockResolvedValue({
      data: {
        id: "habit-1",
        user_id: "user-1",
      },
      error: null,
    });
  });

  it("updates only editable setup fields and scopes by id plus user_id", async () => {
    await updateHabit("user-1", "habit-1", {
      identityStatement: "  ",
      name: "  Reading  ",
      preferredTimeWindow: "  Evening  ",
      reminderEnabled: false,
      reminderTime: " 20:00 ",
      stackTrigger: "  After breakfast ",
      tinyAction: "  Read 1 page ",
    });

    expect(mockFrom).toHaveBeenCalledWith("habits");
    expect(mockUpdate).toHaveBeenCalledWith({
      identity_statement: null,
      name: "Reading",
      preferred_time_window: "Evening",
      reminder_enabled: false,
      reminder_time: null,
      stack_trigger: "After breakfast",
      tiny_action: "Read 1 page",
    });
    expect(mockEqId).toHaveBeenCalledWith("id", "habit-1");
    expect(mockEqUser).toHaveBeenCalledWith("user_id", "user-1");
    expect(mockUpdate).not.toHaveBeenCalledWith(
      expect.objectContaining({
        created_at: expect.anything(),
        id: expect.anything(),
        start_date: expect.anything(),
        updated_at: expect.anything(),
        user_id: expect.anything(),
      }),
    );
  });

  it("logs and throws update failures", async () => {
    const updateError = new Error("permission denied");

    mockUpdateSingle.mockResolvedValue({
      data: null,
      error: updateError,
    });

    await expect(
      updateHabit("user-1", "habit-1", {
        identityStatement: "",
        name: "Reading",
        preferredTimeWindow: "",
        reminderEnabled: false,
        reminderTime: "",
        stackTrigger: "After breakfast",
        tinyAction: "Read 1 page",
      }),
    ).rejects.toBe(updateError);

    expect(mockLoggerError).toHaveBeenCalledWith("Failed to update habit", {
      error: updateError,
      habitId: "habit-1",
      userId: "user-1",
    });
  });

  it("updates only is_active for active-state changes", async () => {
    await setHabitActiveState("user-1", "habit-1", false);

    expect(mockFrom).toHaveBeenCalledWith("habits");
    expect(mockUpdate).toHaveBeenCalledWith({
      is_active: false,
    });
    expect(mockEqId).toHaveBeenCalledWith("id", "habit-1");
    expect(mockEqUser).toHaveBeenCalledWith("user_id", "user-1");
  });
});

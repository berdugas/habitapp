const mockInsert = jest.fn();
const mockInsertSelect = jest.fn();
const mockInsertSingle = jest.fn();
const mockSelect = jest.fn();
const mockEq = jest.fn();
const mockLte = jest.fn();
const mockGt = jest.fn();
const mockOrder = jest.fn();
const mockFrom = jest.fn();
const mockToDeviceDateString = jest.fn();

jest.mock("@/lib/supabase/client", () => ({
  supabase: {
    from: (table: string) => mockFrom(table),
  },
}));

jest.mock("@/utils/dates", () => ({
  toDeviceDateString: (date?: Date) => mockToDeviceDateString(date),
}));

import {
  createHabit,
  getEligibleHabits,
  getInactiveHabits,
  getUpcomingActiveHabits,
} from "@/features/habits/api";

describe("habit api", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockToDeviceDateString.mockReturnValue("2026-04-23");
  });

  it("writes start_date from the shared device-day helper when creating a habit", async () => {
    mockInsert.mockReturnValue({
      select: mockInsertSelect,
    });
    mockInsertSelect.mockReturnValue({
      single: mockInsertSingle,
    });
    mockInsertSingle.mockResolvedValue({
      data: {
        id: "habit-1",
        start_date: "2026-04-23",
      },
      error: null,
    });
    mockFrom.mockReturnValue({
      insert: mockInsert,
    });

    await createHabit("user-1", {
      identityStatement: "",
      name: " Reading ",
      preferredTimeWindow: "",
      reminderEnabled: false,
      reminderTime: "",
      stackTrigger: " After breakfast ",
      tinyAction: " Read 1 page ",
    });

    expect(mockToDeviceDateString).toHaveBeenCalled();
    expect(mockInsert).toHaveBeenCalledWith({
      identity_statement: null,
      name: "Reading",
      preferred_time_window: null,
      reminder_enabled: false,
      reminder_time: null,
      stack_trigger: "After breakfast",
      start_date: "2026-04-23",
      tiny_action: "Read 1 page",
      user_id: "user-1",
    });
  });

  it("trims and persists reminder time when reminders are enabled", async () => {
    mockInsert.mockReturnValue({
      select: mockInsertSelect,
    });
    mockInsertSelect.mockReturnValue({
      single: mockInsertSingle,
    });
    mockInsertSingle.mockResolvedValue({
      data: {
        id: "habit-2",
        start_date: "2026-04-23",
      },
      error: null,
    });
    mockFrom.mockReturnValue({
      insert: mockInsert,
    });

    await createHabit("user-1", {
      identityStatement: " Become a reader ",
      name: " Reading ",
      preferredTimeWindow: " Evening ",
      reminderEnabled: true,
      reminderTime: " 20:00 ",
      stackTrigger: " After dinner ",
      tinyAction: " Read 1 page ",
    });

    expect(mockInsert).toHaveBeenCalledWith({
      identity_statement: "Become a reader",
      name: "Reading",
      preferred_time_window: "Evening",
      reminder_enabled: true,
      reminder_time: "20:00",
      stack_trigger: "After dinner",
      start_date: "2026-04-23",
      tiny_action: "Read 1 page",
      user_id: "user-1",
    });
  });

  it("filters eligible habits by active and started", async () => {
    const result = {
      data: [{ id: "habit-1", start_date: "2026-04-23" }],
      error: null,
    };
    const builder = {
      eq: mockEq,
      lte: mockLte,
      order: mockOrder,
      select: mockSelect,
    };

    mockSelect.mockReturnValue(builder);
    mockEq.mockReturnValue(builder);
    mockLte.mockReturnValue(builder);
    mockOrder.mockResolvedValue(result);
    mockFrom.mockReturnValue({
      select: mockSelect,
    });

    const response = await getEligibleHabits("user-1", "2026-04-23");

    expect(mockFrom).toHaveBeenCalledWith("habits");
    expect(mockEq).toHaveBeenNthCalledWith(1, "user_id", "user-1");
    expect(mockEq).toHaveBeenNthCalledWith(2, "is_active", true);
    expect(mockLte).toHaveBeenCalledWith("start_date", "2026-04-23");
    expect(response).toEqual(result.data);
  });

  it("filters upcoming active habits by future start_date", async () => {
    const secondOrder = jest.fn().mockResolvedValue({
      data: [{ id: "habit-2", start_date: "2026-04-25" }],
      error: null,
    });
    const builder = {
      eq: mockEq,
      gt: mockGt,
      order: mockOrder,
      select: mockSelect,
    };

    mockSelect.mockReturnValue(builder);
    mockEq.mockReturnValue(builder);
    mockGt.mockReturnValue(builder);
    mockOrder.mockReturnValue({
      order: secondOrder,
    });
    mockFrom.mockReturnValue({
      select: mockSelect,
    });

    const response = await getUpcomingActiveHabits("user-1", "2026-04-23");

    expect(mockEq).toHaveBeenNthCalledWith(1, "user_id", "user-1");
    expect(mockEq).toHaveBeenNthCalledWith(2, "is_active", true);
    expect(mockGt).toHaveBeenCalledWith("start_date", "2026-04-23");
    expect(mockOrder).toHaveBeenCalledWith("start_date", { ascending: true });
    expect(secondOrder).toHaveBeenCalledWith("created_at", {
      ascending: true,
    });
    expect(response).toEqual([{ id: "habit-2", start_date: "2026-04-25" }]);
  });

  it("loads inactive habits separately from Today lists", async () => {
    const builder = {
      eq: mockEq,
      order: mockOrder,
      select: mockSelect,
    };

    mockSelect.mockReturnValue(builder);
    mockEq.mockReturnValue(builder);
    mockOrder.mockResolvedValue({
      data: [{ id: "habit-3", is_active: false }],
      error: null,
    });
    mockFrom.mockReturnValue({
      select: mockSelect,
    });

    const response = await getInactiveHabits("user-1");

    expect(mockFrom).toHaveBeenCalledWith("habits");
    expect(mockEq).toHaveBeenNthCalledWith(1, "user_id", "user-1");
    expect(mockEq).toHaveBeenNthCalledWith(2, "is_active", false);
    expect(mockOrder).toHaveBeenCalledWith("updated_at", { ascending: false });
    expect(response).toEqual([{ id: "habit-3", is_active: false }]);
  });
});

const mockSingle = jest.fn();
const mockOrder = jest.fn();
const mockLte = jest.fn();
const mockGte = jest.fn();
const mockEq = jest.fn();
const mockSelect = jest.fn();
const mockFrom = jest.fn();

jest.mock("@/lib/supabase/client", () => ({
  supabase: {
    from: (table: string) => mockFrom(table),
  },
}));

import {
  getHabitById,
  getHabitLogsForHabitInRange,
} from "@/features/habits/api";

describe("habit detail api", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("loads a habit detail record by id and user_id", async () => {
    const builder = {
      eq: mockEq,
      select: mockSelect,
      single: mockSingle,
    };

    mockSelect.mockReturnValue(builder);
    mockEq.mockReturnValue(builder);
    mockSingle.mockResolvedValue({
      data: { id: "habit-1", user_id: "user-1" },
      error: null,
    });
    mockFrom.mockReturnValue({
      select: mockSelect,
    });

    const result = await getHabitById("user-1", "habit-1");

    expect(mockFrom).toHaveBeenCalledWith("habits");
    expect(mockEq).toHaveBeenNthCalledWith(1, "id", "habit-1");
    expect(mockEq).toHaveBeenNthCalledWith(2, "user_id", "user-1");
    expect(result).toEqual({ id: "habit-1", user_id: "user-1" });
  });

  it("loads recent logs for one owned habit in descending date order", async () => {
    const builder = {
      eq: mockEq,
      gte: mockGte,
      lte: mockLte,
      order: mockOrder,
      select: mockSelect,
    };

    mockSelect.mockReturnValue(builder);
    mockEq.mockReturnValue(builder);
    mockGte.mockReturnValue(builder);
    mockLte.mockReturnValue(builder);
    mockOrder.mockResolvedValue({
      data: [{ id: "log-1", habit_id: "habit-1", log_date: "2026-04-24" }],
      error: null,
    });
    mockFrom.mockReturnValue({
      select: mockSelect,
    });

    const result = await getHabitLogsForHabitInRange(
      "user-1",
      "habit-1",
      "2026-03-26",
      "2026-04-24",
    );

    expect(mockFrom).toHaveBeenCalledWith("habit_logs");
    expect(mockEq).toHaveBeenNthCalledWith(1, "user_id", "user-1");
    expect(mockEq).toHaveBeenNthCalledWith(2, "habit_id", "habit-1");
    expect(mockGte).toHaveBeenCalledWith("log_date", "2026-03-26");
    expect(mockLte).toHaveBeenCalledWith("log_date", "2026-04-24");
    expect(mockOrder).toHaveBeenCalledWith("log_date", { ascending: false });
    expect(result).toEqual([
      { id: "log-1", habit_id: "habit-1", log_date: "2026-04-24" },
    ]);
  });
});

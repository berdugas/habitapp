const mockInvoke = jest.fn();

jest.mock("@/lib/supabase/client", () => ({
  supabase: {
    functions: {
      invoke: (...args: unknown[]) => mockInvoke(...args),
    },
  },
}));

import {
  GENERATE_HABIT_REWRITE_ERROR_MESSAGE,
  generateHabitRewrite,
  validateGenerateHabitRewriteResponse,
} from "@/features/recommendations/aiRewriteApi";

describe("ai rewrite api", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  const validResponse = {
    explanation:
      "This keeps the action small and connects it to a clear daily moment.",
    suggestedStackTrigger: "After breakfast",
    suggestedTinyAction: "Read one paragraph",
  };

  it("accepts valid function responses and trims values", () => {
    expect(
      validateGenerateHabitRewriteResponse({
        explanation: " Keep the habit easy to start. ",
        suggestedStackTrigger: " After breakfast ",
        suggestedTinyAction: " Read one paragraph ",
      }),
    ).toEqual({
      explanation: "Keep the habit easy to start.",
      suggestedStackTrigger: "After breakfast",
      suggestedTinyAction: "Read one paragraph",
    });
  });

  it("rejects missing keys", () => {
    expect(() =>
      validateGenerateHabitRewriteResponse({
        explanation: "Missing fields.",
        suggestedStackTrigger: null,
      }),
    ).toThrow(GENERATE_HABIT_REWRITE_ERROR_MESSAGE);
  });

  it("rejects extra keys", () => {
    expect(() =>
      validateGenerateHabitRewriteResponse({
        ...validResponse,
        extra: "nope",
      }),
    ).toThrow(GENERATE_HABIT_REWRITE_ERROR_MESSAGE);
  });

  it("rejects overlong strings", () => {
    expect(() =>
      validateGenerateHabitRewriteResponse({
        ...validResponse,
        suggestedTinyAction: "a".repeat(161),
      }),
    ).toThrow(GENERATE_HABIT_REWRITE_ERROR_MESSAGE);
  });

  it("rejects wrong field types", () => {
    expect(() =>
      validateGenerateHabitRewriteResponse({
        ...validResponse,
        suggestedStackTrigger: 123,
      }),
    ).toThrow(GENERATE_HABIT_REWRITE_ERROR_MESSAGE);
  });

  it("rejects empty explanations", () => {
    expect(() =>
      validateGenerateHabitRewriteResponse({
        ...validResponse,
        explanation: "   ",
      }),
    ).toThrow(GENERATE_HABIT_REWRITE_ERROR_MESSAGE);
  });

  it("invokes the Supabase function with only habit id and suggestion type", async () => {
    mockInvoke.mockResolvedValue({
      data: validResponse,
      error: null,
    });

    await expect(
      generateHabitRewrite({
        habitId: "habit-1",
        suggestionType: "change_trigger",
      }),
    ).resolves.toEqual(validResponse);

    expect(mockInvoke).toHaveBeenCalledWith("generate-habit-rewrite", {
      body: {
        habitId: "habit-1",
        suggestionType: "change_trigger",
      },
    });
  });

  it("maps Supabase function errors to friendly thrown errors", async () => {
    mockInvoke.mockResolvedValue({
      data: null,
      error: new Error("function failed"),
    });

    await expect(
      generateHabitRewrite({
        habitId: "habit-1",
        suggestionType: "change_trigger",
      }),
    ).rejects.toThrow(GENERATE_HABIT_REWRITE_ERROR_MESSAGE);
  });

  it("maps malformed function data to friendly thrown errors", async () => {
    mockInvoke.mockResolvedValue({
      data: {
        ...validResponse,
        unexpected: true,
      },
      error: null,
    });

    await expect(
      generateHabitRewrite({
        habitId: "habit-1",
        suggestionType: "change_trigger",
      }),
    ).rejects.toThrow(GENERATE_HABIT_REWRITE_ERROR_MESSAGE);
  });
});

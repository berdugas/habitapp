const mockUseMutation = jest.fn();

jest.mock("@tanstack/react-query", () => ({
  useMutation: (options: unknown) => mockUseMutation(options),
}));

jest.mock("@/features/recommendations/aiRewriteApi", () => ({
  generateHabitRewrite: jest.fn(),
}));

import { generateHabitRewrite } from "@/features/recommendations/aiRewriteApi";
import { useGenerateHabitRewriteMutation } from "@/features/recommendations/hooks";

describe("ai rewrite hooks", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUseMutation.mockImplementation((options: unknown) => options);
  });

  it("creates a mutation backed by generateHabitRewrite", () => {
    useGenerateHabitRewriteMutation();

    expect(mockUseMutation).toHaveBeenCalledWith({
      mutationFn: generateHabitRewrite,
    });
  });
});

import { render, screen } from "@testing-library/react-native";

import TodayScreen from "@/features/today/screens/TodayScreen";

jest.mock("@/features/today/hooks", () => ({
  useTodayHabits: jest.fn(),
}));

const { useTodayHabits } = jest.requireMock("@/features/today/hooks") as {
  useTodayHabits: jest.Mock;
};

describe("TodayScreen", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("renders the created habit in the today view", () => {
    useTodayHabits.mockReturnValue({
      error: null,
      habits: [
        {
          formula: "After I brush my teeth, I will Read 1 page.",
          id: "habit-1",
          name: "Reading",
        },
      ],
      isLoading: false,
    });

    render(<TodayScreen />);

    expect(screen.getByText("Reading")).toBeTruthy();
  });
});

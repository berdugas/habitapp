import { fireEvent, render, screen } from "@testing-library/react-native";

import SettingsScreen from "@/features/settings/screens/SettingsScreen";

const mockPush = jest.fn();
const mockReplace = jest.fn();
const mockSignOut = jest.fn();
const mockUseAuthSession = jest.fn();
const mockUseInactiveHabitsQuery = jest.fn();

jest.mock("expo-router", () => ({
  router: {
    push: (...args: unknown[]) => mockPush(...args),
    replace: (...args: unknown[]) => mockReplace(...args),
  },
}));

jest.mock("@/features/auth/hooks", () => ({
  useAuthSession: () => mockUseAuthSession(),
}));

jest.mock("@/features/auth/api", () => ({
  signOut: () => mockSignOut(),
}));

jest.mock("@/features/habits/hooks", () => ({
  useInactiveHabitsQuery: () => mockUseInactiveHabitsQuery(),
}));

describe("SettingsScreen", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockSignOut.mockResolvedValue(undefined);
    mockUseAuthSession.mockReturnValue({
      user: { email: "user@example.com" },
    });
    mockUseInactiveHabitsQuery.mockReturnValue({
      data: [],
    });
  });

  it("shows an empty inactive state when no inactive habits exist", () => {
    render(<SettingsScreen />);

    expect(screen.getByText("Inactive habits")).toBeTruthy();
    expect(screen.getByText("No inactive habits")).toBeTruthy();
  });

  it("shows inactive habits and opens detail from settings", () => {
    mockUseInactiveHabitsQuery.mockReturnValue({
      data: [
        {
          id: "habit-1",
          name: "Reading",
          stack_trigger: "After breakfast",
          tiny_action: "Read 1 page",
        },
      ],
    });

    render(<SettingsScreen />);

    expect(screen.getByText("Open any inactive habit to reactivate it from Habit Detail.")).toBeTruthy();

    fireEvent.press(screen.getByLabelText("Reading details"));

    expect(mockPush).toHaveBeenCalledWith("/(app)/habits/habit-1");
  });
});

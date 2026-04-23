import { render, screen } from "@testing-library/react-native";

import RootEntryScreen from "@/features/entry/screens/RootEntryScreen";

jest.mock("expo-router", () => ({
  Redirect: ({ href }: { href: string }) => {
    const { Text } = require("react-native");
    return <Text>{`redirect:${href}`}</Text>;
  },
}));

jest.mock("@/features/auth/hooks", () => ({
  useAuthSession: jest.fn(),
}));

jest.mock("@/features/habits/hooks", () => ({
  useActiveHabitsQuery: jest.fn(),
}));

const { useAuthSession } = jest.requireMock("@/features/auth/hooks") as {
  useAuthSession: jest.Mock;
};
const { useActiveHabitsQuery } = jest.requireMock("@/features/habits/hooks") as {
  useActiveHabitsQuery: jest.Mock;
};

describe("RootEntryScreen", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("shows welcome when no session exists", () => {
    useAuthSession.mockReturnValue({
      isBootstrapping: false,
      session: null,
    });
    useActiveHabitsQuery.mockReturnValue({
      data: [],
      isLoading: false,
    });

    render(<RootEntryScreen />);

    expect(
      screen.getByText(/build habits through small actions/i),
    ).toBeTruthy();
  });

  it("redirects authenticated users with no active habits to create", () => {
    useAuthSession.mockReturnValue({
      isBootstrapping: false,
      session: { user: { id: "user-1" } },
    });
    useActiveHabitsQuery.mockReturnValue({
      data: [],
      isLoading: false,
    });

    render(<RootEntryScreen />);

    expect(
      screen.getByText("redirect:/(app)/habits/create"),
    ).toBeTruthy();
  });

  it("redirects authenticated users with an active habit to today", () => {
    useAuthSession.mockReturnValue({
      isBootstrapping: false,
      session: { user: { id: "user-1" } },
    });
    useActiveHabitsQuery.mockReturnValue({
      data: [{ id: "habit-1" }],
      isLoading: false,
    });

    render(<RootEntryScreen />);

    expect(
      screen.getByText("redirect:/(app)/(tabs)/today"),
    ).toBeTruthy();
  });

  it("shows an error instead of misrouting when active habits fail to load", () => {
    useAuthSession.mockReturnValue({
      isBootstrapping: false,
      session: { user: { id: "user-1" } },
    });
    useActiveHabitsQuery.mockReturnValue({
      data: [],
      error: new Error("boom"),
      isLoading: false,
    });

    render(<RootEntryScreen />);

    expect(
      screen.getByText("We couldn't load your habits right now. Try again."),
    ).toBeTruthy();
  });

  it("shows loading while auth bootstraps", () => {
    useAuthSession.mockReturnValue({
      isBootstrapping: true,
      session: null,
    });
    useActiveHabitsQuery.mockReturnValue({
      data: [],
      isLoading: false,
    });

    render(<RootEntryScreen />);

    expect(screen.getByText(/checking your session/i)).toBeTruthy();
  });
});

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
  useEligibleHabitsQuery: jest.fn(),
  useUpcomingActiveHabitsQuery: jest.fn(),
}));

const { useAuthSession } = jest.requireMock("@/features/auth/hooks") as {
  useAuthSession: jest.Mock;
};
const {
  useEligibleHabitsQuery,
  useUpcomingActiveHabitsQuery,
} = jest.requireMock("@/features/habits/hooks") as {
  useEligibleHabitsQuery: jest.Mock;
  useUpcomingActiveHabitsQuery: jest.Mock;
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
    useEligibleHabitsQuery.mockReturnValue({
      data: [],
      isLoading: false,
    });
    useUpcomingActiveHabitsQuery.mockReturnValue({
      data: [],
      isLoading: false,
    });

    render(<RootEntryScreen />);

    expect(
      screen.getByText(/build habits through small actions/i),
    ).toBeTruthy();
  });

  it("redirects authenticated users with no eligible or upcoming habits to create", () => {
    useAuthSession.mockReturnValue({
      isBootstrapping: false,
      session: { user: { id: "user-1" } },
    });
    useEligibleHabitsQuery.mockReturnValue({
      data: [],
      isLoading: false,
    });
    useUpcomingActiveHabitsQuery.mockReturnValue({
      data: [],
      isLoading: false,
    });

    render(<RootEntryScreen />);

    expect(
      screen.getByText("redirect:/(app)/habits/create"),
    ).toBeTruthy();
  });

  it("redirects authenticated users with an eligible habit to today", () => {
    useAuthSession.mockReturnValue({
      isBootstrapping: false,
      session: { user: { id: "user-1" } },
    });
    useEligibleHabitsQuery.mockReturnValue({
      data: [{ id: "habit-1" }],
      isLoading: false,
    });
    useUpcomingActiveHabitsQuery.mockReturnValue({
      data: [],
      isLoading: false,
    });

    render(<RootEntryScreen />);

    expect(
      screen.getByText("redirect:/(app)/(tabs)/today"),
    ).toBeTruthy();
  });

  it("redirects authenticated users with only upcoming active habits to today", () => {
    useAuthSession.mockReturnValue({
      isBootstrapping: false,
      session: { user: { id: "user-1" } },
    });
    useEligibleHabitsQuery.mockReturnValue({
      data: [],
      isLoading: false,
    });
    useUpcomingActiveHabitsQuery.mockReturnValue({
      data: [{ id: "habit-2" }],
      isLoading: false,
    });

    render(<RootEntryScreen />);

    expect(
      screen.getByText("redirect:/(app)/(tabs)/today"),
    ).toBeTruthy();
  });

  it("shows an error instead of misrouting when habit queries fail", () => {
    useAuthSession.mockReturnValue({
      isBootstrapping: false,
      session: { user: { id: "user-1" } },
    });
    useEligibleHabitsQuery.mockReturnValue({
      data: [],
      error: new Error("boom"),
      isLoading: false,
    });
    useUpcomingActiveHabitsQuery.mockReturnValue({
      data: [],
      error: null,
      isLoading: false,
    });

    render(<RootEntryScreen />);

    expect(
      screen.getByText("We couldn't load your habits right now. Try again."),
    ).toBeTruthy();
  });

  it("shows loading while the eligible habits query is still resolving", () => {
    useAuthSession.mockReturnValue({
      isBootstrapping: false,
      session: { user: { id: "user-1" } },
    });
    useEligibleHabitsQuery.mockReturnValue({
      data: [],
      error: null,
      isLoading: true,
    });
    useUpcomingActiveHabitsQuery.mockReturnValue({
      data: [],
      error: null,
      isLoading: false,
    });

    render(<RootEntryScreen />);

    expect(screen.getByText(/loading your habits/i)).toBeTruthy();
  });

  it("shows loading while the upcoming habits query is still resolving", () => {
    useAuthSession.mockReturnValue({
      isBootstrapping: false,
      session: { user: { id: "user-1" } },
    });
    useEligibleHabitsQuery.mockReturnValue({
      data: [],
      error: null,
      isLoading: false,
    });
    useUpcomingActiveHabitsQuery.mockReturnValue({
      data: [],
      error: null,
      isLoading: true,
    });

    render(<RootEntryScreen />);

    expect(screen.getByText(/loading your habits/i)).toBeTruthy();
  });

  it("shows an error instead of misrouting when upcoming habits fail to load", () => {
    useAuthSession.mockReturnValue({
      isBootstrapping: false,
      session: { user: { id: "user-1" } },
    });
    useEligibleHabitsQuery.mockReturnValue({
      data: [],
      error: null,
      isLoading: false,
    });
    useUpcomingActiveHabitsQuery.mockReturnValue({
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
    useEligibleHabitsQuery.mockReturnValue({
      data: [],
      isLoading: false,
    });
    useUpcomingActiveHabitsQuery.mockReturnValue({
      data: [],
      isLoading: false,
    });

    render(<RootEntryScreen />);

    expect(screen.getByText(/checking your session/i)).toBeTruthy();
  });
});

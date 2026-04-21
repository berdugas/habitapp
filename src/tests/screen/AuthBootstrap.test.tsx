import { Text } from "react-native";
import { render, screen, waitFor } from "@testing-library/react-native";

import { useAuthSession } from "@/features/auth/hooks";
import { AuthBootstrap } from "@/providers/AuthBootstrap";

jest.mock("@/features/auth/api", () => ({
  getSession: jest.fn(),
  upsertUserProfile: jest.fn(),
}));

jest.mock("@/lib/supabase/auth", () => ({
  onSupabaseAuthStateChange: jest.fn(),
}));

const { getSession, upsertUserProfile } = jest.requireMock(
  "@/features/auth/api",
) as {
  getSession: jest.Mock;
  upsertUserProfile: jest.Mock;
};

const { onSupabaseAuthStateChange } = jest.requireMock(
  "@/lib/supabase/auth",
) as {
  onSupabaseAuthStateChange: jest.Mock;
};

function Probe() {
  const authSession = useAuthSession();
  return (
    <Text>{authSession.isBootstrapping ? "booting" : authSession.user?.id ?? "guest"}</Text>
  );
}

describe("AuthBootstrap", () => {
  let consoleWarnSpy: jest.SpyInstance;

  beforeEach(() => {
    jest.clearAllMocks();
    consoleWarnSpy = jest.spyOn(console, "warn").mockImplementation(() => undefined);
    onSupabaseAuthStateChange.mockReturnValue({
      data: {
        subscription: {
          unsubscribe: jest.fn(),
        },
      },
    });
  });

  afterEach(() => {
    consoleWarnSpy.mockRestore();
  });

  it("hydrates session and does not block on profile upsert failure", async () => {
    getSession.mockResolvedValue({
      data: {
        session: {
          user: {
            id: "user-1",
          },
        },
      },
      error: null,
    });
    upsertUserProfile.mockResolvedValue({
      error: new Error("profile failed"),
    });

    render(
      <AuthBootstrap>
        <Probe />
      </AuthBootstrap>,
    );

    await waitFor(() => {
      expect(screen.getByText("user-1")).toBeTruthy();
    });

    expect(upsertUserProfile).toHaveBeenCalledWith("user-1");
  });
});

import { fireEvent, render, screen, waitFor } from "@testing-library/react-native";

import SignInScreen from "@/features/auth/screens/SignInScreen";

const mockPush = jest.fn();
const mockReplace = jest.fn();
const mockSignInWithPassword = jest.fn();

jest.mock("expo-router", () => ({
  router: {
    push: (...args: unknown[]) => mockPush(...args),
    replace: (...args: unknown[]) => mockReplace(...args),
  },
}));

jest.mock("@/features/auth/api", () => ({
  signInWithPassword: (...args: unknown[]) => mockSignInWithPassword(...args),
}));

describe("SignInScreen", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("submits credentials and routes to root on success", async () => {
    mockSignInWithPassword.mockResolvedValue({
      error: null,
    });

    render(<SignInScreen />);

    fireEvent.changeText(screen.getByPlaceholderText("you@example.com"), "user@example.com");
    fireEvent.changeText(screen.getByPlaceholderText("Your password"), "password-123");
    fireEvent.press(screen.getByText("Sign In"));

    await waitFor(() => {
      expect(mockSignInWithPassword).toHaveBeenCalledWith(
        "user@example.com",
        "password-123",
      );
    });

    await waitFor(() => {
      expect(mockReplace).toHaveBeenCalledWith("/");
    });
  });
});

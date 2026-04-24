function getErrorMessage(error: unknown) {
  if (error instanceof Error) {
    return error.message;
  }

  if (
    typeof error === "object" &&
    error !== null &&
    "message" in error &&
    typeof error.message === "string"
  ) {
    return error.message;
  }

  return "";
}

export function isInvalidLoginCredentialsError(error: unknown) {
  return getErrorMessage(error).toLowerCase().includes("invalid login credentials");
}

export function isExpectedSignUpAuthError(error: unknown) {
  const message = getErrorMessage(error).toLowerCase();

  return (
    message.includes("already registered") ||
    message.includes("invalid email") ||
    message.includes("email is invalid") ||
    message.includes("password")
  );
}

export function getSignInErrorMessage(error: unknown) {
  const message = getErrorMessage(error).toLowerCase();

  if (message.includes("invalid login credentials")) {
    return "We couldn't sign you in. Check your email and password and try again.";
  }

  return "We couldn't sign you in right now. Try again.";
}

export function getSignUpErrorMessage(error: unknown) {
  const message = getErrorMessage(error).toLowerCase();

  if (message.includes("already registered")) {
    return "That email already has an account. Sign in instead or use a different email.";
  }

  if (message.includes("invalid email") || message.includes("email is invalid")) {
    return "Enter a valid email address and try again.";
  }

  if (message.includes("password")) {
    return "Choose a stronger password and try again.";
  }

  return "We couldn't create your account right now. Try again.";
}

export function getCreateHabitErrorMessage() {
  return "We couldn't save your habit right now. Try again.";
}

export function getRefreshHabitsErrorMessage() {
  return "We saved your habit, but we couldn't refresh Today right now. Try again.";
}

export function getLoadHabitsErrorMessage() {
  return "We couldn't load your habits right now. Try again.";
}

export function getLoadHabitDetailErrorMessage() {
  return "We couldn't load this habit right now. Try again.";
}

export function getLoadInactiveHabitsErrorMessage() {
  return "We couldn't load inactive habits right now. Try again.";
}

export function getSaveTodayStatusErrorMessage() {
  return "We couldn't save today's status right now. Try again.";
}

export function getUpdateHabitErrorMessage() {
  return "We couldn't save your changes right now. Try again.";
}

export function getUpdateHabitActiveStateErrorMessage() {
  return "We couldn't update this habit right now. Try again.";
}

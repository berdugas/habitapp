import { Redirect } from "expo-router";

import { ErrorState } from "@/components/feedback/ErrorState";
import { LoadingState } from "@/components/feedback/LoadingState";
import { useAuthSession } from "@/features/auth/hooks";
import { useActiveHabitsQuery } from "@/features/habits/hooks";
import { getLoadHabitsErrorMessage } from "@/utils/userFacingErrors";
import WelcomeScreen from "@/features/entry/screens/WelcomeScreen";

export default function RootEntryScreen() {
  const { isBootstrapping, session } = useAuthSession();
  const activeHabitsQuery = useActiveHabitsQuery();

  if (isBootstrapping) {
    return <LoadingState message="Checking your session..." />;
  }

  if (!session) {
    return <WelcomeScreen />;
  }

  if (activeHabitsQuery.isLoading) {
    return <LoadingState message="Loading your habits..." />;
  }

  if (activeHabitsQuery.error) {
    return <ErrorState message={getLoadHabitsErrorMessage()} />;
  }

  if ((activeHabitsQuery.data ?? []).length === 0) {
    return <Redirect href="/(app)/habits/create" />;
  }

  return <Redirect href="/(app)/(tabs)/today" />;
}

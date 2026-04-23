import { Redirect } from "expo-router";

import { ErrorState } from "@/components/feedback/ErrorState";
import { LoadingState } from "@/components/feedback/LoadingState";
import { useAuthSession } from "@/features/auth/hooks";
import {
  useEligibleHabitsQuery,
  useUpcomingActiveHabitsQuery,
} from "@/features/habits/hooks";
import { getLoadHabitsErrorMessage } from "@/utils/userFacingErrors";
import WelcomeScreen from "@/features/entry/screens/WelcomeScreen";

export default function RootEntryScreen() {
  const { isBootstrapping, session } = useAuthSession();
  const eligibleHabitsQuery = useEligibleHabitsQuery();
  const upcomingHabitsQuery = useUpcomingActiveHabitsQuery();

  if (isBootstrapping) {
    return <LoadingState message="Checking your session..." />;
  }

  if (!session) {
    return <WelcomeScreen />;
  }

  if (eligibleHabitsQuery.isLoading || upcomingHabitsQuery.isLoading) {
    return <LoadingState message="Loading your habits..." />;
  }

  if (eligibleHabitsQuery.error || upcomingHabitsQuery.error) {
    return <ErrorState message={getLoadHabitsErrorMessage()} />;
  }

  if (
    (eligibleHabitsQuery.data ?? []).length === 0 &&
    (upcomingHabitsQuery.data ?? []).length === 0
  ) {
    return <Redirect href="/(app)/habits/create" />;
  }

  return <Redirect href="/(app)/(tabs)/today" />;
}

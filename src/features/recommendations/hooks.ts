import { useMutation } from "@tanstack/react-query";

import { generateHabitRewrite } from "@/features/recommendations/aiRewriteApi";

export function useGenerateHabitRewriteMutation() {
  return useMutation({
    mutationFn: generateHabitRewrite,
  });
}

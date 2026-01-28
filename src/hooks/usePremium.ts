import { useAuth } from "./useAuth";

export function usePremium() {
  const { user } = useAuth();

  const isPremium = user?.isPremium ?? false;
  const subscriptionStatus = user?.subscriptionStatus ?? "free";
  const subscriptionExpiry = user?.subscriptionExpiry ?? null;

  const maxHands = isPremium ? 2 : 1;
  const maxVocabulary = isPremium ? 100 : 50;

  const isExpired = subscriptionExpiry
    ? new Date(subscriptionExpiry) < new Date()
    : false;

  return {
    isPremium: isPremium && !isExpired,
    subscriptionStatus,
    subscriptionExpiry,
    maxHands,
    maxVocabulary,
    isExpired,
  };
}

import { useAuth } from "./useAuth";

export function usePremium() {
  const { profile } = useAuth();

  // For now, premium is always false until we add subscription tables
  // In the future, this would check subscription status from the database
  const isPremium = false;
  const subscriptionStatus = "free";
  const subscriptionExpiry = null;

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

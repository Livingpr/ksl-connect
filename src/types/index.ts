export type UserRole = 'student' | 'teacher' | 'interpreter';

export type SubscriptionStatus = 'free' | 'premium_monthly' | 'premium_yearly';

export interface User {
  id: string;
  email: string;
  displayName: string;
  photoURL?: string;
  role: UserRole;
  createdAt: Date;
  isPremium?: boolean;
  subscriptionStatus?: SubscriptionStatus;
  subscriptionExpiry?: Date | null;
}

export interface SignResult {
  sign: string;
  confidence: number;
  timestamp: Date;
  isTwoHanded?: boolean;
}

export interface Translation {
  id?: number;
  text: string;
  confidence: number;
  timestamp: Date;
  isFavorite: boolean;
  synced: boolean;
  thumbnailUrl?: string;
  autoSaved?: boolean;
  duration?: number;
}

export interface TranslationStats {
  totalSigns: number;
  avgAccuracy: number;
  streakDays: number;
  todayCount: number;
}

export type ConfidenceLevel = 'high' | 'medium' | 'low';

export function getConfidenceLevel(confidence: number): ConfidenceLevel {
  if (confidence >= 80) return 'high';
  if (confidence >= 60) return 'medium';
  return 'low';
}

import { supabase } from '@/integrations/supabase/client';
import type { Translation } from '@/types';

export interface CloudTranslation {
  id: string;
  userId: string;
  signText: string;
  translatedSentence?: string;
  outputLanguage: 'english' | 'swahili';
  confidence: number;
  handType: 'Left' | 'Right' | 'Both';
  durationMs: number;
  gestureBuffer?: string[];
  isFavorite: boolean;
  createdAt: Date;
}

// Save translation to cloud database
export async function saveTranslationToCloud(translation: Omit<CloudTranslation, 'id' | 'userId' | 'createdAt'>): Promise<string | null> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data, error } = await supabase
    .from('translations')
    .insert({
      user_id: user.id,
      sign_text: translation.signText,
      translated_sentence: translation.translatedSentence,
      output_language: translation.outputLanguage,
      confidence: translation.confidence,
      hand_type: translation.handType,
      duration_ms: translation.durationMs,
      gesture_buffer: translation.gestureBuffer,
      is_favorite: translation.isFavorite,
    })
    .select('id')
    .single();

  if (error) {
    console.error('Error saving translation:', error);
    return null;
  }

  return data?.id || null;
}

// Get translations from cloud
export async function getCloudTranslations(limit?: number): Promise<CloudTranslation[]> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];

  let query = supabase
    .from('translations')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false });

  if (limit) {
    query = query.limit(limit);
  }

  const { data, error } = await query;

  if (error) {
    console.error('Error fetching translations:', error);
    return [];
  }

  return (data || []).map(t => ({
    id: t.id,
    userId: t.user_id,
    signText: t.sign_text,
    translatedSentence: t.translated_sentence || undefined,
    outputLanguage: t.output_language as 'english' | 'swahili',
    confidence: Number(t.confidence),
    handType: t.hand_type as 'Left' | 'Right' | 'Both',
    durationMs: t.duration_ms || 0,
    gestureBuffer: t.gesture_buffer || undefined,
    isFavorite: t.is_favorite,
    createdAt: new Date(t.created_at),
  }));
}

// Get translations by date range
export async function getCloudTranslationsByDate(startDate: Date, endDate: Date): Promise<CloudTranslation[]> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];

  const { data, error } = await supabase
    .from('translations')
    .select('*')
    .eq('user_id', user.id)
    .gte('created_at', startDate.toISOString())
    .lte('created_at', endDate.toISOString())
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching translations:', error);
    return [];
  }

  return (data || []).map(t => ({
    id: t.id,
    userId: t.user_id,
    signText: t.sign_text,
    translatedSentence: t.translated_sentence || undefined,
    outputLanguage: t.output_language as 'english' | 'swahili',
    confidence: Number(t.confidence),
    handType: t.hand_type as 'Left' | 'Right' | 'Both',
    durationMs: t.duration_ms || 0,
    gestureBuffer: t.gesture_buffer || undefined,
    isFavorite: t.is_favorite,
    createdAt: new Date(t.created_at),
  }));
}

// Get favorite translations
export async function getCloudFavorites(): Promise<CloudTranslation[]> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];

  const { data, error } = await supabase
    .from('translations')
    .select('*')
    .eq('user_id', user.id)
    .eq('is_favorite', true)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching favorites:', error);
    return [];
  }

  return (data || []).map(t => ({
    id: t.id,
    userId: t.user_id,
    signText: t.sign_text,
    translatedSentence: t.translated_sentence || undefined,
    outputLanguage: t.output_language as 'english' | 'swahili',
    confidence: Number(t.confidence),
    handType: t.hand_type as 'Left' | 'Right' | 'Both',
    durationMs: t.duration_ms || 0,
    gestureBuffer: t.gesture_buffer || undefined,
    isFavorite: t.is_favorite,
    createdAt: new Date(t.created_at),
  }));
}

// Toggle favorite status
export async function toggleCloudFavorite(id: string): Promise<boolean> {
  const { data: translation, error: fetchError } = await supabase
    .from('translations')
    .select('is_favorite')
    .eq('id', id)
    .single();

  if (fetchError || !translation) {
    console.error('Error fetching translation:', fetchError);
    return false;
  }

  const { error } = await supabase
    .from('translations')
    .update({ is_favorite: !translation.is_favorite })
    .eq('id', id);

  if (error) {
    console.error('Error toggling favorite:', error);
    return false;
  }

  return true;
}

// Delete translation
export async function deleteCloudTranslation(id: string): Promise<boolean> {
  const { error } = await supabase
    .from('translations')
    .delete()
    .eq('id', id);

  if (error) {
    console.error('Error deleting translation:', error);
    return false;
  }

  return true;
}

// Get user statistics from cloud
export async function getCloudStats(): Promise<{
  totalSigns: number;
  avgAccuracy: number;
  todayCount: number;
  streakDays: number;
}> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return { totalSigns: 0, avgAccuracy: 0, todayCount: 0, streakDays: 0 };
  }

  // Get statistics from user_statistics table
  const { data: statsData } = await supabase
    .from('user_statistics')
    .select('*')
    .eq('user_id', user.id)
    .maybeSingle();

  // Get today's count
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const { data: todayData } = await supabase
    .from('translations')
    .select('id', { count: 'exact' })
    .eq('user_id', user.id)
    .gte('created_at', today.toISOString());

  return {
    totalSigns: statsData?.total_signs_translated || 0,
    avgAccuracy: Number(statsData?.average_accuracy) || 0,
    streakDays: statsData?.streak_days || 0,
    todayCount: todayData?.length || 0,
  };
}

// Update user statistics
export async function updateCloudStats(newTranslation: { confidence: number }): Promise<void> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;

  // Get current stats
  const { data: currentStats } = await supabase
    .from('user_statistics')
    .select('*')
    .eq('user_id', user.id)
    .maybeSingle();

  if (!currentStats) return;

  const totalSigns = currentStats.total_signs_translated + 1;
  const currentAvg = Number(currentStats.average_accuracy) || 0;
  const newAvg = ((currentAvg * currentStats.total_signs_translated) + newTranslation.confidence) / totalSigns;

  // Check streak
  const lastActive = currentStats.last_active_date ? new Date(currentStats.last_active_date) : null;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  let streakDays = currentStats.streak_days;
  
  if (lastActive) {
    const lastActiveDate = new Date(lastActive);
    lastActiveDate.setHours(0, 0, 0, 0);
    
    const diffDays = Math.floor((today.getTime() - lastActiveDate.getTime()) / (1000 * 60 * 60 * 24));
    
    if (diffDays === 1) {
      streakDays += 1;
    } else if (diffDays > 1) {
      streakDays = 1;
    }
  } else {
    streakDays = 1;
  }

  await supabase
    .from('user_statistics')
    .update({
      total_signs_translated: totalSigns,
      average_accuracy: Math.round(newAvg * 100) / 100,
      streak_days: streakDays,
      last_active_date: today.toISOString().split('T')[0],
    })
    .eq('user_id', user.id);
}

// Search translations
export async function searchCloudTranslations(query: string): Promise<CloudTranslation[]> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];

  const { data, error } = await supabase
    .from('translations')
    .select('*')
    .eq('user_id', user.id)
    .or(`sign_text.ilike.%${query}%,translated_sentence.ilike.%${query}%`)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error searching translations:', error);
    return [];
  }

  return (data || []).map(t => ({
    id: t.id,
    userId: t.user_id,
    signText: t.sign_text,
    translatedSentence: t.translated_sentence || undefined,
    outputLanguage: t.output_language as 'english' | 'swahili',
    confidence: Number(t.confidence),
    handType: t.hand_type as 'Left' | 'Right' | 'Both',
    durationMs: t.duration_ms || 0,
    gestureBuffer: t.gesture_buffer || undefined,
    isFavorite: t.is_favorite,
    createdAt: new Date(t.created_at),
  }));
}

import Dexie, { type Table } from 'dexie';
import type { Translation } from '@/types';

export class KSLDatabase extends Dexie {
  translations!: Table<Translation>;

  constructor() {
    super('ksl-translator');
    this.version(1).stores({
      translations: '++id, text, confidence, timestamp, isFavorite, synced',
    });
  }
}

export const db = new KSLDatabase();

export async function addTranslation(translation: Omit<Translation, 'id'>): Promise<number> {
  return await db.translations.add(translation);
}

export async function getTranslations(limit?: number): Promise<Translation[]> {
  const query = db.translations.orderBy('timestamp').reverse();
  if (limit) {
    return await query.limit(limit).toArray();
  }
  return await query.toArray();
}

export async function getTranslationsByDate(startDate: Date, endDate: Date): Promise<Translation[]> {
  return await db.translations
    .where('timestamp')
    .between(startDate, endDate)
    .reverse()
    .toArray();
}

export async function getFavorites(): Promise<Translation[]> {
  return await db.translations
    .where('isFavorite')
    .equals(1)
    .reverse()
    .toArray();
}

export async function toggleFavorite(id: number): Promise<void> {
  const translation = await db.translations.get(id);
  if (translation) {
    await db.translations.update(id, { isFavorite: !translation.isFavorite });
  }
}

export async function deleteTranslation(id: number): Promise<void> {
  await db.translations.delete(id);
}

export async function getStats(): Promise<{
  totalSigns: number;
  avgAccuracy: number;
  todayCount: number;
}> {
  const all = await db.translations.toArray();
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const todayTranslations = all.filter(t => new Date(t.timestamp) >= today);
  const avgAccuracy = all.length > 0 
    ? all.reduce((sum, t) => sum + t.confidence, 0) / all.length 
    : 0;

  return {
    totalSigns: all.length,
    avgAccuracy: Math.round(avgAccuracy),
    todayCount: todayTranslations.length,
  };
}

export async function searchTranslations(query: string): Promise<Translation[]> {
  const lowerQuery = query.toLowerCase();
  return await db.translations
    .filter(t => t.text.toLowerCase().includes(lowerQuery))
    .reverse()
    .toArray();
}

import type { Base, ID, Instant } from '@/data/types';

/** Client-generated UUID: required for the future Supabase sync. */
export function newId(): ID {
  return crypto.randomUUID();
}

export function nowInstant(): Instant {
  return new Date().toISOString();
}

/** The audit fields every record carries. Soft delete only: `deletedAt` starts null. */
export function newBase(): Base {
  const now = nowInstant();
  return { id: newId(), createdAt: now, updatedAt: now, deletedAt: null };
}

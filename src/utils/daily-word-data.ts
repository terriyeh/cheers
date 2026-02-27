import type { DailyWordData } from '../types/settings';

/**
 * Parse and validate daily word data from persisted storage.
 * Returns a fresh default if `stored` is absent, from a previous day, or malformed.
 * All numeric fields are clamped to non-negative integers via `Math.max(0, Math.floor(v))`.
 *
 * @param stored - Raw value from `data.json`'s `daily` key (may be any shape)
 * @param today - ISO date string for today (YYYY-MM-DD), used to detect stale data
 */
export function parseDailyWordData(stored: unknown, today: string): DailyWordData {
	const defaultData: DailyWordData = {
		date: today,
		wordsAddedToday: 0,
		goalCelebrated: false,
		notesCreatedToday: 0,
		tasksCompletedToday: 0,
		linksCreatedToday: 0,
	};

	if (!stored || typeof stored !== 'object' || (stored as any).date !== today) {
		return defaultData;
	}

	const s = stored as any;
	const int = (v: unknown): number =>
		typeof v === 'number' ? Math.max(0, Math.floor(v)) : 0;

	return {
		date: today,
		wordsAddedToday: int(s.wordsAddedToday),
		goalCelebrated: s.goalCelebrated === true,
		notesCreatedToday: int(s.notesCreatedToday),
		tasksCompletedToday: int(s.tasksCompletedToday),
		linksCreatedToday: int(s.linksCreatedToday),
	};
}

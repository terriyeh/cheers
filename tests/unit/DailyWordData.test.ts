/**
 * Unit tests for parseDailyWordData utility
 * Tests the upgrade path, data clamping, and stale-date detection.
 */

import { parseDailyWordData } from '../../src/utils/daily-word-data';

const TODAY = '2026-02-24';

describe('parseDailyWordData', () => {
	describe('stale / missing data returns fresh defaults', () => {
		it('returns zeroed defaults when stored is null', () => {
			const result = parseDailyWordData(null, TODAY);
			expect(result).toEqual({
				date: TODAY,
				wordsAddedToday: 0,
				goalCelebrated: false,
				notesCreatedToday: 0,
				tasksCompletedToday: 0,
				linksCreatedToday: 0,
			});
		});

		it('returns zeroed defaults when stored is undefined', () => {
			const result = parseDailyWordData(undefined, TODAY);
			expect(result.notesCreatedToday).toBe(0);
			expect(result.tasksCompletedToday).toBe(0);
			expect(result.linksCreatedToday).toBe(0);
		});

		it('returns zeroed defaults when stored.date is a previous day', () => {
			const result = parseDailyWordData(
				{ date: '2020-01-01', wordsAddedToday: 500, notesCreatedToday: 3 },
				TODAY
			);
			expect(result.date).toBe(TODAY);
			expect(result.wordsAddedToday).toBe(0);
			expect(result.notesCreatedToday).toBe(0);
		});

		it('returns zeroed defaults when stored is a non-object', () => {
			expect(parseDailyWordData(42, TODAY).notesCreatedToday).toBe(0);
			expect(parseDailyWordData('2026-02-24', TODAY).notesCreatedToday).toBe(0);
			expect(parseDailyWordData(true, TODAY).notesCreatedToday).toBe(0);
		});
	});

	describe('restores counter fields from today\'s stored data', () => {
		const stored = {
			date: TODAY,
			wordsAddedToday: 150,
			goalCelebrated: true,
			notesCreatedToday: 3,
			tasksCompletedToday: 7,
			linksCreatedToday: 2,
		};

		it('restores wordsAddedToday', () => {
			expect(parseDailyWordData(stored, TODAY).wordsAddedToday).toBe(150);
		});

		it('restores goalCelebrated', () => {
			expect(parseDailyWordData(stored, TODAY).goalCelebrated).toBe(true);
		});

		it('restores notesCreatedToday', () => {
			expect(parseDailyWordData(stored, TODAY).notesCreatedToday).toBe(3);
		});

		it('restores tasksCompletedToday', () => {
			expect(parseDailyWordData(stored, TODAY).tasksCompletedToday).toBe(7);
		});

		it('restores linksCreatedToday', () => {
			expect(parseDailyWordData(stored, TODAY).linksCreatedToday).toBe(2);
		});
	});

	describe('upgrade path: counter fields absent from old data.json', () => {
		it('defaults notesCreatedToday to 0 when the field is missing', () => {
			const oldData = { date: TODAY, wordsAddedToday: 100, goalCelebrated: false };
			expect(parseDailyWordData(oldData, TODAY).notesCreatedToday).toBe(0);
		});

		it('defaults tasksCompletedToday to 0 when the field is missing', () => {
			const oldData = { date: TODAY, wordsAddedToday: 100, goalCelebrated: false };
			expect(parseDailyWordData(oldData, TODAY).tasksCompletedToday).toBe(0);
		});

		it('defaults linksCreatedToday to 0 when the field is missing', () => {
			const oldData = { date: TODAY, wordsAddedToday: 100, goalCelebrated: false };
			expect(parseDailyWordData(oldData, TODAY).linksCreatedToday).toBe(0);
		});
	});

	describe('data clamping via int() helper', () => {
		it('clamps negative notesCreatedToday to 0', () => {
			expect(parseDailyWordData({ date: TODAY, notesCreatedToday: -5 }, TODAY).notesCreatedToday).toBe(0);
		});

		it('floors fractional tasksCompletedToday', () => {
			expect(parseDailyWordData({ date: TODAY, tasksCompletedToday: 3.9 }, TODAY).tasksCompletedToday).toBe(3);
		});

		it('returns 0 for non-numeric counter values', () => {
			expect(parseDailyWordData({ date: TODAY, linksCreatedToday: 'five' }, TODAY).linksCreatedToday).toBe(0);
			expect(parseDailyWordData({ date: TODAY, linksCreatedToday: null }, TODAY).linksCreatedToday).toBe(0);
			expect(parseDailyWordData({ date: TODAY, linksCreatedToday: true }, TODAY).linksCreatedToday).toBe(0);
		});

		it('goalCelebrated requires strict true — other truthy values are treated as false', () => {
			expect(parseDailyWordData({ date: TODAY, goalCelebrated: 1 }, TODAY).goalCelebrated).toBe(false);
			expect(parseDailyWordData({ date: TODAY, goalCelebrated: 'true' }, TODAY).goalCelebrated).toBe(false);
			expect(parseDailyWordData({ date: TODAY, goalCelebrated: true }, TODAY).goalCelebrated).toBe(true);
		});
	});
});

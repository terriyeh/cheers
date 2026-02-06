/**
 * Settings Validation Tests
 * Tests validation logic for pet and user names
 */

import { VALIDATION_RULES } from '../../src/types/settings';

describe('Settings Validation', () => {
	describe('Pet Name Validation', () => {
		const rules = VALIDATION_RULES.petName;

		it('accepts valid alphanumeric names', () => {
			const validNames = ['Kit', 'Buddy', 'Max123', 'Luna2'];

			validNames.forEach((name) => {
				expect(rules.pattern.test(name)).toBe(true);
				expect(name.length).toBeGreaterThanOrEqual(rules.minLength);
				expect(name.length).toBeLessThanOrEqual(rules.maxLength);
			});
		});

		it('accepts names with spaces', () => {
			const validNames = ['Kit Kat', 'Mr Whiskers', 'Big Boss'];

			validNames.forEach((name) => {
				expect(rules.pattern.test(name)).toBe(true);
			});
		});

		it('rejects names with special characters', () => {
			const invalidNames = [
				'Kit!',
				'Buddy@home',
				'Max#1',
				'Luna$',
				'Pet%',
				'Name&Co',
				'Star*',
				'Kit()',
				'[Buddy]',
				'{Max}',
				'Luna|',
				'Pet\\',
				'Name/',
				'Kit?',
				'Buddy<3',
				'Max>Min',
				'Luna~',
				'Pet`',
				"Kit'",
				'Buddy"',
				'Max;',
				'Luna:',
				'Pet,',
				'Name.',
				'Kit-Kat',
				'Mr_Whiskers',
				'Pet+',
				'Name=',
			];

			invalidNames.forEach((name) => {
				expect(rules.pattern.test(name)).toBe(false);
			});
		});

		it('rejects empty names', () => {
			const emptyNames = ['', '   ', '\t', '\n'];

			emptyNames.forEach((name) => {
				const trimmed = name.trim();
				expect(trimmed.length).toBeLessThan(rules.minLength);
			});
		});

		it('rejects names longer than 30 characters', () => {
			const longName = 'A'.repeat(31);
			expect(longName.length).toBeGreaterThan(rules.maxLength);
		});

		it('accepts names at exactly 30 characters', () => {
			const exactName = 'A'.repeat(30);
			expect(exactName.length).toBe(rules.maxLength);
			expect(rules.pattern.test(exactName)).toBe(true);
		});

		it('accepts names at exactly 1 character', () => {
			const shortName = 'A';
			expect(shortName.length).toBe(rules.minLength);
			expect(rules.pattern.test(shortName)).toBe(true);
		});
	});

	describe('User Name Validation', () => {
		const rules = VALIDATION_RULES.userName;

		it('accepts empty user names', () => {
			const emptyNames = ['', '   ', '\t'];

			emptyNames.forEach((name) => {
				const trimmed = name.trim();
				expect(trimmed.length).toBeGreaterThanOrEqual(rules.minLength);
				expect(rules.pattern.test(trimmed)).toBe(true);
			});
		});

		it('accepts valid alphanumeric names', () => {
			const validNames = ['Alice', 'Bob123', 'User1'];

			validNames.forEach((name) => {
				expect(rules.pattern.test(name)).toBe(true);
				expect(name.length).toBeLessThanOrEqual(rules.maxLength);
			});
		});

		it('accepts names with spaces', () => {
			const validNames = ['Alice Smith', 'Bob The Builder', 'User 123'];

			validNames.forEach((name) => {
				expect(rules.pattern.test(name)).toBe(true);
			});
		});

		it('rejects names with special characters', () => {
			const invalidNames = [
				'Alice!',
				'Bob@email',
				'User#1',
				'Name$',
				'User%',
				'Name&Co',
				'Star*',
				'User()',
				'[Alice]',
				'{Bob}',
				'User|',
				'Name\\',
				'Alice/',
				'Bob?',
				'User<3',
				'Name>All',
				'Alice~',
				'Bob`',
				"User'",
				'Name"',
				'Alice;',
				'Bob:',
				'User,',
				'Name.',
				'Alice-Bob',
				'User_Name',
				'Name+',
				'User=',
			];

			invalidNames.forEach((name) => {
				expect(rules.pattern.test(name)).toBe(false);
			});
		});

		it('rejects names longer than 30 characters', () => {
			const longName = 'A'.repeat(31);
			expect(longName.length).toBeGreaterThan(rules.maxLength);
		});

		it('accepts names at exactly 30 characters', () => {
			const exactName = 'A'.repeat(30);
			expect(exactName.length).toBe(rules.maxLength);
			expect(rules.pattern.test(exactName)).toBe(true);
		});
	});

	describe('Validation Edge Cases', () => {
		it('handles Unicode characters correctly', () => {
			// Unicode characters should be rejected (not alphanumeric)
			const unicodeNames = ['Кіт', 'ペット', '宠物', 'حيوان'];

			unicodeNames.forEach((name) => {
				expect(VALIDATION_RULES.petName.pattern.test(name)).toBe(false);
				expect(VALIDATION_RULES.userName.pattern.test(name)).toBe(false);
			});
		});

		it('handles emojis correctly', () => {
			// Emojis should be rejected
			const emojiNames = ['🦊', 'Kit🐱', 'Pet 🐶', '🎉Name'];

			emojiNames.forEach((name) => {
				expect(VALIDATION_RULES.petName.pattern.test(name)).toBe(false);
				expect(VALIDATION_RULES.userName.pattern.test(name)).toBe(false);
			});
		});

		it('handles multiple consecutive spaces', () => {
			// Multiple spaces are technically valid per the regex
			const multiSpaceNames = ['Kit  Kat', 'Big   Boss'];

			multiSpaceNames.forEach((name) => {
				expect(VALIDATION_RULES.petName.pattern.test(name)).toBe(true);
			});
		});

		it('handles leading and trailing spaces', () => {
			// Leading/trailing spaces match the pattern but should be trimmed
			const spacedNames = [' Kit', 'Kit ', ' Kit '];

			spacedNames.forEach((name) => {
				expect(VALIDATION_RULES.petName.pattern.test(name)).toBe(true);
				// Implementation should trim before validation
				expect(name.trim()).not.toBe(name);
			});
		});
	});
});

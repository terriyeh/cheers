/**
 * Pure geometry helpers for the Stats ring component.
 *
 * Ring geometry:
 *   OUTER_RADIUS  = 80
 *   STROKE_WIDTH  = 12
 *   INNER_RADIUS  = 80 − 12/2 = 74
 *   CIRCUMFERENCE = 2π × 74 ≈ 464.96
 */

const OUTER_RADIUS = 80;
const STROKE_WIDTH = 12;
export const INNER_RADIUS = OUTER_RADIUS - STROKE_WIDTH / 2; // 74

export const CIRCUMFERENCE = 2 * Math.PI * INNER_RADIUS; // ~464.96

export interface StatsRingData {
	showOuterRing: boolean;
	showInnerCircle: boolean;
	showRingSection: boolean;
	dailyProgress: number;  // 0–1, capped at 1
	fileProgress: number;   // 0–1, capped at 1
	outerOffset: number;    // stroke-dashoffset value
}

/**
 * Compute all derived SVG values for the stats rings from raw props.
 *
 * @param wordsAddedToday - Cumulative words written today
 * @param dailyWordGoal   - Daily target (null or 0 = not set → outer ring hidden)
 * @param fileWordCount   - Current file word count (null = no active markdown editor)
 * @param fileWordGoal    - Per-file target from frontmatter (null or 0 = not set → inner circle hidden)
 */
export function computeRingData(
	wordsAddedToday: number,
	dailyWordGoal: number | null,
	fileWordCount: number | null,
	fileWordGoal: number | null,
): StatsRingData {
	const showOuterRing = dailyWordGoal !== null && dailyWordGoal > 0;
	const showInnerCircle = fileWordGoal !== null && fileWordGoal > 0 && fileWordCount !== null;
	const showRingSection = showOuterRing || showInnerCircle;

	const dailyProgress = showOuterRing
		? Math.min(wordsAddedToday / dailyWordGoal!, 1)
		: 0;

	const fileProgress = showInnerCircle
		? Math.min(fileWordCount! / fileWordGoal!, 1)
		: 0;

	const outerOffset = CIRCUMFERENCE * (1 - dailyProgress);

	return {
		showOuterRing,
		showInnerCircle,
		showRingSection,
		dailyProgress,
		fileProgress,
		outerOffset,
	};
}

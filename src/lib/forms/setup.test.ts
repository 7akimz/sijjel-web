import { describe, expect, it } from 'vitest';
import { nextSetupStep } from './setup';

const state = (hours: boolean, arenas: boolean, horses: boolean, plans = false) => ({
	hours: { done: hours },
	arenas: { done: arenas },
	horses: { done: horses },
	plans: { done: plans }
});

describe('nextSetupStep', () => {
	it('points to the first unfinished step after the current one', () => {
		expect(nextSetupStep(state(false, false, false), 'hours')).toBe('arenas');
		expect(nextSetupStep(state(true, false, false), 'arenas')).toBe('horses');
	});

	it('goes back to an earlier step that was skipped', () => {
		expect(nextSetupStep(state(false, false, false), 'horses')).toBe('hours');
		expect(nextSetupStep(state(false, true, false), 'arenas')).toBe('hours');
	});

	it('counts the current step as done even before the state catches up', () => {
		expect(nextSetupStep(state(true, true, true), 'plans')).toBe('invite');
		expect(nextSetupStep(state(true, true, false), 'horses')).toBe('plans');
	});

	it('moves on to inviting riders once every step is done', () => {
		expect(nextSetupStep(state(true, true, true, true), 'arenas')).toBe('invite');
	});
});

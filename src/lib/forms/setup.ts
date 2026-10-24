import type { SetupState } from '#lib/api/academy-types.js';

export type SetupStep = keyof SetupState;

export const SETUP_STEPS: SetupStep[] = ['hours', 'arenas', 'horses'];

export function nextSetupStep(state: SetupState, current: SetupStep): SetupStep | 'invite' {
	return SETUP_STEPS.find((step) => step !== current && !state[step].done) ?? 'invite';
}

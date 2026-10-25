import { afterEach, describe, expect, it, vi } from 'vitest';
import { reveal } from './reveal';

describe('reveal', () => {
	afterEach(() => vi.restoreAllMocks());

	it('scrolls the notice into view when it appears and again on each later save', () => {
		const node = document.createElement('div');
		const scroll = vi.fn();
		node.scrollIntoView = scroll;

		const action = reveal(node, 1);
		action.update(1);
		action.update(2);

		expect(scroll).toHaveBeenCalledTimes(2);
	});
});

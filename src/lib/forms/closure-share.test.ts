import { describe, expect, it } from 'vitest';
import { closureShareText } from './closure-share.js';

describe('closureShareText', () => {
	it('names one day and its reason', () => {
		expect(
			closureShareText(
				{ from: '2026-12-19', to: '2026-12-19', reason: 'Spring show' },
				'Al Faris',
				'en'
			)
		).toBe(
			'Al Faris is closed on Saturday 19 Dec: Spring show. Sessions that day are cancelled; please book another day in the app:'
		);
	});

	it('names the first and last day of a range', () => {
		expect(
			closureShareText(
				{ from: '2026-12-19', to: '2026-12-21', reason: 'Spring show' },
				'Al Faris',
				'en'
			)
		).toBe(
			'Al Faris is closed from Saturday 19 Dec to Monday 21 Dec: Spring show. Sessions on those days are cancelled; please book another day in the app:'
		);
	});

	it('leaves out the reason when there is none', () => {
		expect(
			closureShareText({ from: '2026-12-19', to: '2026-12-19', reason: null }, 'Al Faris', 'en')
		).toBe(
			'Al Faris is closed on Saturday 19 Dec. Sessions that day are cancelled; please book another day in the app:'
		);
	});
});

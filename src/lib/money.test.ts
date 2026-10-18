import { describe, expect, it } from 'vitest';
import { formatMoney } from './money';

describe('formatMoney', () => {
	it('shows the amount with grouping and the currency', () => {
		const text = formatMoney(1200, 'EGP', 'en');

		expect(text).toContain('1,200');
		expect(text).toContain('EGP');
	});

	it('uses Western digits in Arabic', () => {
		expect(formatMoney(1200, 'EGP', 'ar')).not.toMatch(/[٠-٩]/);
	});
});

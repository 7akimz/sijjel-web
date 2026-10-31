import { describe, expect, it } from 'vitest';
import { whatsappLink } from './share';

describe('whatsappLink', () => {
	it('opens a chat with the phone and an encoded message', () => {
		const link = whatsappLink('https://a.test/invite/x', 'أهلًا', '201012345678');

		expect(link.startsWith('https://wa.me/201012345678?text=')).toBe(true);
		expect(decodeURIComponent(link.split('text=')[1])).toBe('أهلًا https://a.test/invite/x');
	});

	it('lets the sender pick the chat when there is no phone', () => {
		expect(
			whatsappLink('https://a.test/invite/x', 'Hi', null).startsWith('https://wa.me/?text=')
		).toBe(true);
	});
});

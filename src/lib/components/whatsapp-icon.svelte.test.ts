import { describe, expect, it } from 'vitest';
import { render } from 'vitest-browser-svelte';
import WhatsAppIcon from './WhatsAppIcon.svelte';

describe('WhatsAppIcon', () => {
	it('draws the WhatsApp logo hidden from screen readers, so the link names itself', async () => {
		const { container } = render(WhatsAppIcon);
		const svg = container.querySelector('svg');

		expect(svg?.getAttribute('aria-hidden')).toBe('true');
		expect(svg?.querySelector('path')?.getAttribute('d')).toMatch(/^M17\.472 14\.382/);
	});
});

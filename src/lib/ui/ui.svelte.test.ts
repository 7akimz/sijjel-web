import { afterEach, describe, expect, it, vi } from 'vitest';
import { render } from 'vitest-browser-svelte';
import { createRawSnippet } from 'svelte';
import { AppShell, Banner, Button, Icon, SessionSlot, StatusChip, TextField } from './index';

const text = (value: string) => createRawSnippet(() => ({ render: () => `<span>${value}</span>` }));

describe('Button', () => {
	it('renders the variant class on a button', () => {
		const { container } = render(Button, { variant: 'danger', children: text('Cancel booking') });

		const button = container.querySelector('button');
		expect(button?.className).toContain('sj-btn--danger');
		expect(button?.getAttribute('type')).toBe('button');
	});

	it('renders a link when given an href', () => {
		const { container } = render(Button, {
			href: '/platform/academies',
			children: text('Academies')
		});

		const link = container.querySelector('a');
		expect(link?.getAttribute('href')).toBe('/platform/academies');
		expect(link?.className).toContain('sj-btn--primary');
	});
});

describe('TextField', () => {
	it('marks the input invalid and links the error message', () => {
		const { container } = render(TextField, {
			label: 'Email',
			value: 'nope',
			error: 'Enter a valid email address.'
		});

		const input = container.querySelector('input')!;
		expect(input.getAttribute('aria-invalid')).toBe('true');
		const describedBy = input.getAttribute('aria-describedby')!;
		expect(container.querySelector(`#${describedBy}`)?.textContent).toContain(
			'Enter a valid email address.'
		);
		expect(container.querySelector('label')?.getAttribute('for')).toBe(input.id);
	});
});

describe('StatusChip', () => {
	it('uses the tone and dot classes', () => {
		const { container } = render(StatusChip, {
			tone: 'pending',
			dot: true,
			children: text('Pending')
		});

		const chip = container.querySelector('.sj-chip')!;
		expect(chip.className).toContain('sj-chip--pending');
		expect(chip.className).toContain('sj-chip--status');
	});
});

describe('SessionSlot', () => {
	it('shows a closed slot with one marker per suitable horse, taken ones outlined', () => {
		const { container } = render(SessionSlot, {
			start: '20:00',
			end: '21:00',
			placesLeft: 4,
			capacity: 8,
			horsesFree: 0,
			horsesTotal: 2,
			state: 'no-horse',
			note: 'No suitable school horse.'
		});

		expect(container.querySelector('.sj-slot')?.className).toContain('sj-slot--closed');
		expect(container.querySelectorAll('.sj-horses__horse')).toHaveLength(2);
		expect(container.querySelectorAll('.sj-horses__horse--taken')).toHaveLength(2);
		expect(container.textContent).toContain('20:00');
	});
});

describe('Icon', () => {
	it('draws the horseshoe, which the icon font lacks, and fills it when active', async () => {
		const outline = render(Icon, { name: 'horseshoe' });
		const icon = outline.container.querySelector('.sj-icon');
		expect(icon?.querySelector('svg')).not.toBeNull();
		expect(icon?.textContent).toBe('');

		const filled = render(Icon, { name: 'horseshoe', filled: true });
		expect(filled.container.querySelector('svg path[fill-rule="evenodd"]')).not.toBeNull();

		const font = render(Icon, { name: 'home' });
		expect(font.container.querySelector('.sj-icon')?.textContent).toBe('home');
	});
});

describe('AppShell', () => {
	it('shows the academy logo instead of the initials', () => {
		const { container } = render(AppShell, {
			brand: { name: 'Orlando', mark: 'O', logo: '/api/files/x' },
			children: text('page')
		});

		const brand = container.querySelector('a.brand');
		const img = brand?.querySelector('img');
		expect(img?.getAttribute('src')).toBe('/api/files/x');
		expect(img?.getAttribute('alt')).toBe('');
		expect(brand?.textContent?.trim()).toBe('Orlando');
	});

	it('shows the initials without a logo', () => {
		const { container } = render(AppShell, {
			brand: { name: 'Orlando', mark: 'O', logo: null },
			children: text('page')
		});

		expect(container.querySelector('a.brand img')).toBeNull();
		expect(container.querySelector('a.brand .sj-mark')?.textContent).toBe('O');
	});

	it('shows a disabled nav item without making it a link', () => {
		const { container } = render(AppShell, {
			brand: { name: 'Al Faris', mark: 'A' },
			nav: [
				{ href: '/', label: 'Home', icon: 'home' },
				{ href: '/board', label: 'Board', icon: 'view_agenda', disabled: true }
			],
			children: text('page')
		});

		expect(container.querySelectorAll('a[href="/board"]')).toHaveLength(0);
		const disabled = container.querySelectorAll('[aria-disabled="true"]');
		expect(disabled).toHaveLength(2);
		expect(disabled[0].textContent).toContain('Board');
		expect(container.querySelectorAll('a[href="/"]').length).toBeGreaterThan(0);
	});
});

describe('Banner', () => {
	afterEach(() => vi.restoreAllMocks());

	it('scrolls an error into view when it appears, since the button that failed can sit far below it', () => {
		const scroll = vi.spyOn(Element.prototype, 'scrollIntoView').mockImplementation(() => {});

		const { container } = render(Banner, {
			tone: 'danger',
			icon: 'error',
			children: text('Failed')
		});

		expect(scroll).toHaveBeenCalledOnce();
		expect(scroll.mock.contexts[0]).toBe(container.querySelector('.sj-banner'));
	});

	it('leaves other notices where they are', () => {
		const scroll = vi.spyOn(Element.prototype, 'scrollIntoView').mockImplementation(() => {});

		render(Banner, { icon: 'check_circle', children: text('Saved') });

		expect(scroll).not.toHaveBeenCalled();
	});
});

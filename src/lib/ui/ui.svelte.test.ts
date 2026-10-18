import { describe, expect, it } from 'vitest';
import { render } from 'vitest-browser-svelte';
import { createRawSnippet } from 'svelte';
import { Button, Icon, SessionSlot, StatusChip, TextField } from './index';

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

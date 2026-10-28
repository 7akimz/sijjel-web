import { afterEach, describe, expect, it } from 'vitest';
import { render } from 'vitest-browser-svelte';
import AcademyCover from './AcademyCover.svelte';

const wrappers: HTMLElement[] = [];

function wrapper(dir: 'ltr' | 'rtl') {
	const element = document.createElement('div');
	element.dir = dir;
	element.style.inlineSize = '400px';
	document.body.append(element);
	wrappers.push(element);
	return element;
}

afterEach(() => wrappers.splice(0).forEach((element) => element.remove()));

const pixel =
	'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=';

describe('AcademyCover', () => {
	it('shows the cover photo and the logo', () => {
		const { container } = render(AcademyCover, {
			props: { cover: '/api/files/c', logo: '/api/files/l' }
		});

		const images = [...container.querySelectorAll('img')];
		expect(images.map((img) => img.getAttribute('src'))).toEqual(['/api/files/c', '/api/files/l']);
		expect(images.every((img) => img.getAttribute('alt') === '')).toBe(true);
	});

	it('shows the cover alone without a logo', () => {
		const { container } = render(AcademyCover, {
			props: { cover: '/api/files/c', logo: null }
		});

		expect(container.querySelectorAll('img')).toHaveLength(1);
	});

	it.each([
		['rtl', 'right'],
		['ltr', 'left']
	] as const)('puts the logo at the start side in %s', (dir, side) => {
		const target = wrapper(dir);
		const { container } = render(AcademyCover, {
			target,
			props: { cover: pixel, logo: pixel }
		});

		const box = target.getBoundingClientRect();
		const logo = container.querySelectorAll('img')[1].getBoundingClientRect();
		const gap = side === 'right' ? box.right - logo.right : logo.left - box.left;
		expect(gap).toBeGreaterThanOrEqual(0);
		expect(gap).toBeLessThanOrEqual(40);
	});
});

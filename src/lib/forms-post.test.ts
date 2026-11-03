import { describe, expect, it } from 'vitest';

// A form submitted before the page's script has loaded falls back to the browser's own submit.
// Without method="post" that is a GET, which puts every field, passwords included, in the URL.
const sources = import.meta.glob('/src/**/*.svelte', {
	query: '?raw',
	import: 'default',
	eager: true
}) as Record<string, string>;

describe('forms', () => {
	it('all post, so a submit before hydration never puts fields in the URL', () => {
		const getForms = Object.entries(sources).flatMap(([file, source]) =>
			[...source.matchAll(/<form\b[^>]*>/g)]
				.filter(([tag]) => !/\bmethod="post"/.test(tag))
				.map(() => file)
		);

		expect(Object.keys(sources).length).toBeGreaterThan(20);
		expect(getForms).toEqual([]);
	});
});

import { createRawSnippet } from 'svelte';
import { render } from 'svelte/server';
import { describe, expect, it } from 'vitest';
import Button from './Button.svelte';

const text = (value: string) => createRawSnippet(() => ({ render: () => `<span>${value}</span>` }));

describe('Button before the page has loaded', () => {
	it('renders a submit button disabled, so nothing is sent before the form can handle it', () => {
		const { body } = render(Button, { props: { type: 'submit', children: text('Sign in') } });

		expect(body).toMatch(/<button[^>]*\bdisabled\b/);
	});

	it('leaves other buttons alone', () => {
		const { body } = render(Button, { props: { children: text('Cancel') } });

		expect(body).not.toMatch(/<button[^>]*\bdisabled\b/);
	});
});

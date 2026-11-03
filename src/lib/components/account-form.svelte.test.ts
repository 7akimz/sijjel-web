import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { render } from 'vitest-browser-svelte';
import type { Me } from '#lib/api/types.js';
import AccountForm from './AccountForm.svelte';

type Call = { url: string; method: string; body: unknown };

const me: Me = {
	id: 'u1',
	phone: '201000000000',
	email: null,
	displayName: 'Layla',
	preferredLanguage: null,
	isPlatformAdmin: false
};

let calls: Call[];

function stubFetch(respond: (call: Call) => Response) {
	vi.stubGlobal(
		'fetch',
		vi.fn(async (url: string, init: RequestInit = {}) => {
			const body = typeof init.body === 'string' ? JSON.parse(init.body) : init.body;
			const call = { url, method: init.method ?? 'GET', body };
			calls.push(call);
			return respond(call);
		})
	);
}

const json = (status: number, body: object, type = 'application/json') =>
	new Response(JSON.stringify(body), { status, headers: { 'content-type': type } });

beforeEach(() => (calls = []));
afterEach(() => vi.unstubAllGlobals());

describe('AccountForm', () => {
	it('asks for a name before saving', async () => {
		stubFetch(() => json(200, me));
		const screen = render(AccountForm, { me, onsaved: vi.fn() });

		await screen.getByLabelText('Your name').fill('  ');
		await screen.getByRole('button', { name: 'Save' }).click();

		await expect.element(screen.getByText('Enter a name.')).toBeVisible();
		expect(calls).toHaveLength(0);
	});

	it('saves the account and says so', async () => {
		const saved = { ...me, phone: '201000000001' };
		stubFetch(() => json(200, saved));
		const onsaved = vi.fn();
		const screen = render(AccountForm, { me, onsaved });

		await screen.getByLabelText('Phone').fill('01000000001');
		await screen.getByRole('button', { name: 'Save' }).click();

		await expect.element(screen.getByText('Saved.')).toBeVisible();
		expect(calls).toHaveLength(1);
		expect(calls[0]).toMatchObject({
			method: 'PUT',
			body: { displayName: 'Layla', phone: '01000000001', email: null }
		});
		expect(onsaved).toHaveBeenCalledWith(saved);
	});

	it('shows the stored number with its + so it saves back unchanged', async () => {
		stubFetch(() => json(200, me));
		const screen = render(AccountForm, { me: { ...me, phone: '447700900123' }, onsaved: vi.fn() });

		await expect.element(screen.getByLabelText('Phone')).toHaveValue('+447700900123');
		await screen.getByRole('button', { name: 'Save' }).click();

		await expect.poll(() => calls[0]?.body).toMatchObject({ phone: '+447700900123' });
	});

	it('shows a taken phone under the phone field', async () => {
		stubFetch(() => json(409, { status: 409, code: 'phone_taken' }, 'application/problem+json'));
		const screen = render(AccountForm, { me, onsaved: vi.fn() });

		await screen.getByRole('button', { name: 'Save' }).click();

		await expect
			.element(screen.getByText('An account with this phone number already exists.'))
			.toBeVisible();
		await expect.element(screen.getByLabelText('Phone')).toHaveAttribute('aria-invalid', 'true');
	});

	it('asks for a phone before saving', async () => {
		stubFetch(() => json(200, me));
		const screen = render(AccountForm, { me, onsaved: vi.fn() });

		await screen.getByLabelText('Phone').fill('');
		await screen.getByRole('button', { name: 'Save' }).click();

		await expect
			.element(screen.getByText('Enter a phone number, like 010 1234 5678.'))
			.toBeVisible();
		expect(calls).toHaveLength(0);
	});
});

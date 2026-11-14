<script lang="ts">
	import { onMount, untrack } from 'svelte';
	import { resolve } from '$app/paths';
	import { ApiError, errorText } from '#lib/api/errors.js';
	import type { Locale } from '#lib/api/types.js';
	import { m } from '#lib/paraglide/messages.js';
	import { browserDevice, detectState, type Device, type ReminderState } from '#lib/push/device.js';
	import { Button } from '#lib/ui/index.js';

	type Props = { publicKey: string | null; locale: Locale; device?: Device };
	let { publicKey, locale, device = untrack(() => browserDevice(locale)) }: Props = $props();

	const LATER = 'sijjel_notify_later';

	let current = $state<ReminderState>();
	let hidden = $state(false);
	let busy = $state(false);
	let failure = $state('');

	function later(): boolean {
		try {
			return localStorage.getItem(LATER) === '1';
		} catch {
			return false;
		}
	}

	onMount(() => {
		if (!publicKey || later()) return;
		device
			.env()
			.then((env) => (current = detectState(env)))
			.catch(() => (current = 'unsupported'));
	});

	function notNow() {
		hidden = true;
		try {
			localStorage.setItem(LATER, '1');
		} catch {
			// Without storage the offer comes back next time, which is harmless.
		}
	}

	async function turnOn() {
		busy = true;
		failure = '';
		try {
			await device.subscribe(publicKey!, locale);
			hidden = true;
		} catch (e) {
			failure = errorText(e instanceof ApiError ? e.code : 'internal_error', locale);
		} finally {
			busy = false;
		}
	}
</script>

{#if !hidden && (current === 'off' || current === 'ios_install')}
	<div class="sj-stack offer">
		<p>{m.notify_offer({}, { locale })}</p>
		{#if failure}<p class="sj-small failure">{failure}</p>{/if}
		<div class="actions">
			{#if current === 'off'}
				<Button variant="secondary" icon="notifications_active" disabled={busy} onclick={turnOn}
					>{m.notify_turn_on_short({}, { locale })}</Button
				>
			{:else}
				<Button variant="secondary" icon="notifications_active" href={resolve('/account')}
					>{m.notify_how({}, { locale })}</Button
				>
			{/if}
			<Button variant="quiet" onclick={notNow}>{m.notify_later({}, { locale })}</Button>
		</div>
	</div>
{/if}

<style>
	.offer {
		gap: var(--space-3);
	}
	p {
		margin: 0;
	}
	.failure {
		color: var(--danger);
	}
	.actions {
		display: flex;
		flex-wrap: wrap;
		gap: var(--space-2);
	}
</style>

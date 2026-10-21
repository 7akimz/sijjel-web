<script lang="ts">
	import { onMount, untrack } from 'svelte';
	import { api } from '#lib/api/client.js';
	import { ApiError, errorText } from '#lib/api/errors.js';
	import type { Locale } from '#lib/api/types.js';
	import { m } from '#lib/paraglide/messages.js';
	import {
		browserDevice,
		detectState,
		isAndroid,
		type Device,
		type ReminderState
	} from '#lib/push/device.js';
	import { Banner, Button } from '#lib/ui/index.js';

	type Props = { publicKey: string | null; locale: Locale; device?: Device };
	let { publicKey, locale, device = untrack(() => browserDevice(locale)) }: Props = $props();

	let current = $state<ReminderState>();
	let android = $state(false);
	let justTurnedOn = $state(false);
	let busy = $state(false);
	let notice = $state('');
	let failure = $state('');

	async function refresh() {
		const env = await device.env();
		android = isAndroid(env.userAgent);
		current = detectState(env);
	}

	onMount(() => {
		if (publicKey) refresh().catch(() => (current = 'unsupported'));
	});

	async function run(action: () => Promise<void>) {
		busy = true;
		failure = '';
		notice = '';
		try {
			await action();
		} catch (e) {
			failure = errorText(e instanceof ApiError ? e.code : 'internal_error', locale);
		} finally {
			busy = false;
		}
	}

	const turnOn = () =>
		run(async () => {
			await device.subscribe(publicKey!, locale);
			await refresh();
			justTurnedOn = current === 'on';
		});

	const turnOff = () =>
		run(async () => {
			await device.unsubscribe();
			justTurnedOn = false;
			await refresh();
		});

	const sendTest = () =>
		run(async () => {
			const { sent } = await api<{ sent: number }>('/push/test', { method: 'POST', body: {} });
			if (sent > 0) notice = m.reminders_test_sent({}, { locale });
			else failure = m.reminders_test_none({}, { locale });
		});
</script>

<div class="sj-stack">
	<p>{m.reminders_intro({}, { locale })}</p>
	{#if failure}<Banner tone="danger" icon="error">{failure}</Banner>{/if}
	{#if notice}<Banner icon="check_circle">{notice}</Banner>{/if}

	{#if !publicKey}
		<Banner tone="pending" icon="notifications_off">{m.error_push_disabled({}, { locale })}</Banner>
	{:else if current === 'ios_install'}
		<Banner icon="ios_share">{m.reminders_ios_install({}, { locale })}</Banner>
	{:else if current === 'unsupported'}
		<Banner tone="pending" icon="notifications_off"
			>{m.reminders_unsupported({}, { locale })}</Banner
		>
	{:else if current === 'blocked'}
		<Banner tone="pending" icon="block">{m.reminders_blocked({}, { locale })}</Banner>
	{:else if current === 'off'}
		<div>
			<Button icon="notifications_active" disabled={busy} onclick={turnOn}
				>{m.reminders_turn_on({}, { locale })}</Button
			>
		</div>
	{:else if current === 'on'}
		<Banner icon="notifications_active">{m.reminders_on({}, { locale })}</Banner>
		{#if justTurnedOn && android}
			<p class="sj-hint">{m.reminders_battery_tip({}, { locale })}</p>
		{/if}
		<div class="actions">
			<Button variant="secondary" icon="send" disabled={busy} onclick={sendTest}
				>{m.reminders_test({}, { locale })}</Button
			>
			<Button variant="quiet" disabled={busy} onclick={turnOff}
				>{m.reminders_turn_off({}, { locale })}</Button
			>
		</div>
	{/if}
</div>

<style>
	p {
		margin: 0;
	}
	.actions {
		display: flex;
		flex-wrap: wrap;
		gap: var(--space-2);
	}
</style>

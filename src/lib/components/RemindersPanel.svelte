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

	// Staff get "Time's up" reminders; riders get told when the academy cancels their session.
	type Props = {
		publicKey: string | null;
		locale: Locale;
		device?: Device;
		audience?: 'staff' | 'rider';
	};
	let {
		publicKey,
		locale,
		device = untrack(() => browserDevice(locale)),
		audience = 'staff'
	}: Props = $props();

	const staffCopy = {
		intro: m.reminders_intro,
		iosInstall: m.reminders_ios_install,
		unsupported: m.reminders_unsupported,
		turnOn: m.reminders_turn_on,
		on: m.reminders_on,
		batteryTip: m.reminders_battery_tip,
		testNone: m.reminders_test_none
	};
	const riderCopy: typeof staffCopy = {
		intro: m.notify_intro,
		iosInstall: m.notify_ios_install,
		unsupported: m.notify_unsupported,
		turnOn: m.notify_turn_on,
		on: m.notify_on,
		batteryTip: m.notify_battery_tip,
		testNone: m.notify_test_none
	};
	const copy = $derived(audience === 'rider' ? riderCopy : staffCopy);

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
			else failure = copy.testNone({}, { locale });
		});
</script>

<div class="sj-stack">
	<p>{copy.intro({}, { locale })}</p>
	{#if failure}<Banner tone="danger" icon="error">{failure}</Banner>{/if}
	{#if notice}<Banner icon="check_circle">{notice}</Banner>{/if}

	{#if !publicKey}
		<Banner tone="pending" icon="notifications_off">{m.error_push_disabled({}, { locale })}</Banner>
	{:else if current === 'ios_install'}
		<Banner icon="ios_share">{copy.iosInstall({}, { locale })}</Banner>
	{:else if current === 'unsupported'}
		<Banner tone="pending" icon="notifications_off">{copy.unsupported({}, { locale })}</Banner>
	{:else if current === 'blocked'}
		<Banner tone="pending" icon="block">{m.reminders_blocked({}, { locale })}</Banner>
	{:else if current === 'off'}
		<div>
			<Button
				variant={audience === 'rider' ? 'secondary' : 'primary'}
				icon="notifications_active"
				disabled={busy}
				onclick={turnOn}>{copy.turnOn({}, { locale })}</Button
			>
		</div>
	{:else if current === 'on'}
		<Banner icon="notifications_active">{copy.on({}, { locale })}</Banner>
		{#if justTurnedOn && android}
			<p class="sj-hint">{copy.batteryTip({}, { locale })}</p>
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

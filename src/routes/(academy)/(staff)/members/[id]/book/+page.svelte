<script lang="ts">
	import { invalidateAll } from '$app/navigation';
	import { resolve } from '$app/paths';
	import WeekSlots from '#lib/components/WeekSlots.svelte';
	import { api } from '#lib/api/client.js';
	import { ApiError, errorText } from '#lib/api/errors.js';
	import type { BookingView, SlotView } from '#lib/api/member-types.js';
	import { bookingErrorText, dayName, warningTexts } from '#lib/forms/booking.js';
	import { m } from '#lib/paraglide/messages.js';
	import { Banner, Button } from '#lib/ui/index.js';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();

	let busy = $state(false);
	let notice = $state('');
	let failure = $state('');
	let warned = $state.raw<{ slot: SlotView; warnings: string[] } | null>(null);

	const rider = $derived(data.member.displayName);
	const school = $derived(data.member.horseSource !== 'own');
	const memberHref = $derived(resolve('/(academy)/(staff)/members/[id]', { id: data.member.id }));

	const inputs = (slot: SlotView) => ({
		rider,
		day: dayName(slot.date, data.locale),
		time: slot.start
	});

	async function book(slot: SlotView, confirm = false) {
		busy = true;
		notice = '';
		failure = '';
		warned = null;
		try {
			await api<BookingView>('/bookings', {
				method: 'POST',
				body: { date: slot.date, start: slot.start, riderId: data.member.id, confirm }
			});
			notice = m.staff_book_done(inputs(slot));
		} catch (e) {
			const warnings = e instanceof ApiError ? warningTexts(e, data.locale) : null;
			if (warnings) warned = { slot, warnings };
			else
				failure =
					e instanceof ApiError ? bookingErrorText(e, data.locale) : errorText('internal_error');
		} finally {
			busy = false;
			await invalidateAll();
		}
	}
</script>

<svelte:head>
	<title>{m.staff_book_title({ rider })}</title>
</svelte:head>

<div class="sj-page">
	<div class="sj-stack">
		<a class="sj-small" href={memberHref}>{m.staff_book_back({ rider })}</a>
		<h1 class="sj-title">{m.staff_book_title({ rider })}</h1>
	</div>

	{#if notice}<Banner icon="check_circle">{notice}</Banner>{/if}
	{#if failure}<Banner icon="error" tone="danger">{failure}</Banner>{/if}
	{#if warned}
		<Banner icon="warning" tone="pending">
			<div class="sj-stack">
				<span>{m.staff_book_warning({ rider })}</span>
				<ul>
					{#each warned.warnings as warning (warning)}<li>{warning}</li>{/each}
				</ul>
				<div class="sj-row">
					<Button disabled={busy} onclick={() => warned && book(warned.slot, true)}
						>{m.staff_book_anyway()}</Button
					>
					<Button variant="quiet" disabled={busy} onclick={() => (warned = null)}
						>{m.action_cancel()}</Button
					>
				</div>
			</div>
		</Banner>
	{/if}

	<WeekSlots
		slots={data.slots}
		week={data.week}
		firstWeek={data.firstWeek}
		{school}
		{busy}
		locale={data.locale}
		weekHref={(week) =>
			`${resolve('/(academy)/(staff)/members/[id]/book', { id: data.member.id })}?week=${week}`}
		confirmText={(slot) => m.staff_book_confirm(inputs(slot))}
		onbook={(slot) => book(slot)}
	/>
</div>

<style>
	ul {
		margin: 0;
		padding-inline-start: var(--space-4);
	}
</style>

<script lang="ts">
	import NotifyOffer from '#lib/components/NotifyOffer.svelte';
	import { invalidateAll } from '$app/navigation';
	import { resolve } from '$app/paths';
	import WeekSlots from '#lib/components/WeekSlots.svelte';
	import { api } from '#lib/api/client.js';
	import { ApiError, errorText } from '#lib/api/errors.js';
	import type { BookingView, SlotView } from '#lib/api/member-types.js';
	import {
		bookingErrorText,
		dayName,
		riderBlockReason,
		riderBlockText,
		windowText
	} from '#lib/forms/booking.js';
	import { m } from '#lib/paraglide/messages.js';
	import { Banner, Icon } from '#lib/ui/index.js';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();

	let busy = $state(false);
	let notice = $state('');
	let failure = $state('');

	const school = $derived(data.summary.horseSource !== 'own');
	const blocked = $derived(riderBlockReason(data.summary));

	function confirmText(slot: SlotView) {
		const inputs = { day: dayName(slot.date, data.locale), time: slot.start };
		return school ? m.book_confirm_school(inputs) : m.book_confirm_own(inputs);
	}

	async function book(slot: SlotView): Promise<null> {
		busy = true;
		notice = '';
		failure = '';
		try {
			await api<BookingView>('/bookings', {
				method: 'POST',
				body: { date: slot.date, start: slot.start }
			});
			notice = m.book_done({ day: dayName(slot.date, data.locale), time: slot.start });
		} catch (e) {
			failure =
				e instanceof ApiError ? bookingErrorText(e, data.locale) : errorText('internal_error');
		} finally {
			busy = false;
			await invalidateAll();
		}
		return null;
	}
</script>

<svelte:head>
	<title>{m.book_title()}</title>
</svelte:head>

<div class="sj-page">
	<div class="sj-stack">
		<h1 class="sj-title">{m.book_title()}</h1>
		<p class="sj-muted">
			{m.rider_plan_left({
				left: data.summary.leftThisMonth,
				total: data.summary.lessonsPerMonth
			})}
		</p>
		<p class="sj-muted window">
			<Icon name="event_available" size={20} />{windowText(
				data.summary.bookingWindowDays,
				data.locale
			)}
		</p>
	</div>

	{#if notice}
		<Banner icon="check_circle">
			<div class="sj-stack done">
				<strong>{notice}</strong>
				<NotifyOffer publicKey={data.publicKey} locale={data.locale} />
			</div>
		</Banner>
	{/if}
	{#if failure}<Banner icon="error" tone="danger">{failure}</Banner>{/if}
	{#if blocked}
		<Banner icon="info" tone="pending">{riderBlockText(blocked, data.locale)}</Banner>
	{/if}

	<WeekSlots
		slots={data.slots}
		week={data.page.start}
		firstWeek={data.today}
		end={data.page.end}
		last={data.page.last}
		empty={m.book_no_slots_open()}
		counts={false}
		{school}
		{busy}
		locale={data.locale}
		weekHref={(week) => resolve(`/(academy)/(rider)/book?week=${week}`)}
		{confirmText}
		onbook={book}
	/>
</div>

<style>
	.done {
		gap: var(--space-2);
	}
	.window {
		display: flex;
		align-items: center;
		gap: var(--space-1);
	}
</style>

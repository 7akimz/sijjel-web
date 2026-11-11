<script lang="ts">
	import { goto } from '$app/navigation';
	import { resolve } from '$app/paths';
	import BookMonth from '#lib/components/BookMonth.svelte';
	import type { MonthResult } from '#lib/api/member-types.js';
	import { formatMonth, formatMonthYear } from '#lib/format.js';
	import { sessionsText } from '#lib/forms/horse-rides.js';
	import { m } from '#lib/paraglide/messages.js';
	import { Button, Icon } from '#lib/ui/index.js';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();

	const rider = $derived(data.member.displayName);
	const memberHref = $derived(resolve('/(academy)/(staff)/members/[id]', { id: data.member.id }));
	const pageHref = $derived(
		resolve('/(academy)/(staff)/members/[id]/book-month', { id: data.member.id })
	);
	const onNext = $derived(data.month === data.nextMonth);

	async function booked(result: MonthResult) {
		const month = formatMonth(`${data.month}-01`, data.locale);
		const notice =
			result.booked.length > 0
				? m.book_month_done({
						sessions: sessionsText(result.booked.length, data.locale),
						rider,
						month
					})
				: m.book_month_none_booked({ rider, month });
		await goto(memberHref, { state: { notice, skipped: result.skipped } });
	}
</script>

<svelte:head>
	<title>{m.book_month_title({ rider })}</title>
</svelte:head>

<div class="sj-page">
	<div class="sj-stack">
		<a class="sj-small" href={memberHref}>{m.staff_book_back({ rider })}</a>
		<h1 class="sj-title">{m.book_month_title({ rider })}</h1>
	</div>

	<nav class="month" aria-label={m.book_month_nav()}>
		{#if onNext}
			<Button variant="quiet" href={`${pageHref}?month=${data.thisMonth}`}
				><Icon name="chevron_left" directional />{m.book_month_prev()}</Button
			>
		{:else}
			<Button variant="quiet" disabled
				><Icon name="chevron_left" directional />{m.book_month_prev()}</Button
			>
		{/if}
		<span class="sj-small range">{formatMonthYear(`${data.month}-01`, data.locale)}</span>
		{#if onNext}
			<Button variant="quiet" disabled
				>{m.book_month_next()}<Icon name="chevron_right" directional /></Button
			>
		{:else}
			<Button variant="quiet" href={`${pageHref}?month=${data.nextMonth}`}
				>{m.book_month_next()}<Icon name="chevron_right" directional /></Button
			>
		{/if}
	</nav>

	{#key data.month}
		<BookMonth
			view={data.view}
			memberId={data.member.id}
			{rider}
			locale={data.locale}
			onbooked={booked}
		/>
	{/key}
</div>

<style>
	.month {
		display: grid;
		grid-template-columns: auto auto;
		grid-template-areas: 'range range' 'prev next';
		justify-content: space-between;
		align-items: center;
		gap: var(--space-1) var(--space-2);
	}
	.month > :global(:first-child) {
		grid-area: prev;
	}
	.range {
		grid-area: range;
		justify-self: center;
		font-weight: 600;
	}
	.month > :global(:last-child) {
		grid-area: next;
	}
	@media (min-width: 720px) {
		.month {
			grid-template-columns: auto auto auto;
			grid-template-areas: 'prev range next';
		}
	}
</style>

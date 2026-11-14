<script lang="ts">
	import { untrack } from 'svelte';
	import { academyName } from '#lib/academy.js';
	import AffectedBookings from '#lib/components/AffectedBookings.svelte';
	import { api } from '#lib/api/client.js';
	import { ApiError, errorText, fieldText, type FieldErrors } from '#lib/api/errors.js';
	import type { ClosedRange } from '#lib/api/academy-types.js';
	import type { AffectedBooking } from '#lib/api/member-types.js';
	import {
		closedRangeErrors,
		formatRange,
		type DateRangeForm,
		splitByToday,
		toDateRangeInput
	} from '#lib/forms/closed-dates.js';
	import { closureShareText } from '#lib/forms/closure-share.js';
	import { focusFirstInvalid } from '#lib/forms/focus.js';
	import WhatsAppIcon from '#lib/components/WhatsAppIcon.svelte';
	import { whatsappLink } from '#lib/share.js';
	import { m } from '#lib/paraglide/messages.js';
	import { Banner, Button, Card, DateRangeField, EmptyState, TextField } from '#lib/ui/index.js';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();

	let closures = $state<ClosedRange[]>(untrack(() => data.closures));
	let from = $state('');
	let to = $state('');
	let reason = $state('');
	let errors = $state<FieldErrors>({});
	let failure = $state<string>();
	let saved = $state<{ range: ClosedRange; cancelled: boolean }>();
	let busy = $state(false);
	let affected = $state<{ bookings: AffectedBooking[]; form: DateRangeForm }>();
	let formElement = $state<HTMLFormElement>();

	const split = $derived(splitByToday(closures, data.today));
	const upcoming = $derived(split.upcoming);
	const past = $derived(split.past);
	const academy = $derived(data.tenant.kind === 'academy' ? data.tenant.academy : null);
	const shareText = $derived(
		saved && academy
			? closureShareText(saved.range, academyName(academy, data.locale), data.locale)
			: ''
	);

	function add(event: SubmitEvent) {
		event.preventDefault();
		return submit({ from, to, reason }, false);
	}

	// Confirming resends the range whose bookings were listed, even if the fields changed since.
	async function submit(form: DateRangeForm, confirm: boolean) {
		failure = undefined;
		saved = undefined;
		affected = undefined;
		errors = closedRangeErrors(form);
		if (Object.keys(errors).length > 0) return focusFirstInvalid(formElement);
		busy = true;
		try {
			const created = await api<ClosedRange>('/academy/closed-dates', {
				method: 'POST',
				body: toDateRangeInput(form, confirm)
			});
			closures = [...closures, created];
			from = to = reason = '';
			saved = { range: created, cancelled: confirm };
		} catch (e) {
			const error = e instanceof ApiError ? e : new ApiError(0, 'internal_error');
			errors = error.fields;
			if (error.code === 'bookings_affected')
				affected = {
					bookings: (error.extra.bookings as AffectedBooking[] | undefined) ?? [],
					form
				};
			else if (Object.keys(error.fields).length === 0) failure = errorText(error.code);
			else focusFirstInvalid(formElement);
		} finally {
			busy = false;
		}
	}

	async function remove(range: ClosedRange) {
		failure = undefined;
		saved = undefined;
		try {
			await api(`/academy/closed-dates/${range.id}`, { method: 'DELETE' });
			closures = closures.filter((r) => r.id !== range.id);
		} catch (e) {
			failure = errorText(e instanceof ApiError ? e.code : 'internal_error');
		}
	}
</script>

<svelte:head>
	<title>{m.closed_title()}</title>
</svelte:head>

{#snippet rangeList(ranges: ClosedRange[], muted: boolean)}
	<ul class="sj-list" role="list">
		{#each ranges as range (range.id)}
			{@const dates = formatRange(range, data.locale)}
			<li class="range" class:sj-muted={muted}>
				<div class="main">
					<span class="dates">{dates}</span>
					{#if range.reason}<span class="sj-small sj-muted">{range.reason}</span>{/if}
				</div>
				<Button
					variant="quiet"
					icon="delete"
					label={m.closed_delete({ dates })}
					onclick={() => remove(range)}
				/>
			</li>
		{/each}
	</ul>
{/snippet}

<div class="sj-page">
	<div class="sj-stack">
		<h1 class="sj-title">{m.closed_title()}</h1>
		<p class="sj-muted">{m.closed_intro()}</p>
	</div>

	{#if saved}
		<Banner icon="check_circle">
			<div class="sj-stack saved">
				<p>
					<strong>{m.closure_saved({ dates: formatRange(saved.range, data.locale) })}</strong>
					{saved.cancelled ? m.closure_saved_notified() : m.closure_saved_share()}
				</p>
				<p class="share sj-small">{shareText} {data.bookUrl}</p>
				<!-- wa.me is an external WhatsApp address, not a route of this app. -->
				<!-- eslint-disable svelte/no-navigation-without-resolve -->
				<a
					class="sj-btn sj-btn--secondary whatsapp"
					href={whatsappLink(data.bookUrl, shareText)}
					target="_blank"
					rel="noopener noreferrer"
				>
					<WhatsAppIcon />{m.closure_share_action()}
				</a>
				<!-- eslint-enable svelte/no-navigation-without-resolve -->
			</div>
		</Banner>
	{/if}
	{#if failure}<Banner tone="danger" icon="error">{failure}</Banner>{/if}
	{#if affected}
		<AffectedBookings
			bookings={affected.bookings}
			locale={data.locale}
			body={m.closed_affected_body()}
			confirmLabel={m.closed_affected_confirm()}
			onconfirm={() => affected && submit(affected.form, true)}
			oncancel={() => (affected = undefined)}
		/>
	{/if}

	<Card raised>
		<form method="post" class="sj-stack" bind:this={formElement} onsubmit={add} novalidate>
			<h2 class="sj-heading">{m.closed_add()}</h2>
			<DateRangeField
				label={m.closed_dates()}
				error={fieldText(errors, 'from') ?? fieldText(errors, 'to')}
				bind:from
				bind:to
			/>
			<TextField
				label={m.closed_reason()}
				hint={m.closed_reason_hint()}
				error={fieldText(errors, 'reason')}
				bind:value={reason}
			/>
			<div>
				<Button type="submit" icon="add" disabled={busy}>{m.closed_add()}</Button>
			</div>
		</form>
	</Card>

	{#if closures.length === 0}
		<EmptyState icon="event_busy" title={m.closed_empty_title()}>{m.closed_empty_body()}</EmptyState
		>
	{/if}
	{#if upcoming.length > 0}
		<section class="sj-stack">
			<h2 class="sj-heading">{m.closed_upcoming()}</h2>
			{@render rangeList(upcoming, false)}
		</section>
	{/if}
	{#if past.length > 0}
		<section class="sj-stack">
			<h2 class="sj-heading">{m.closed_past()}</h2>
			{@render rangeList(past, true)}
		</section>
	{/if}
</div>

<style>
	.saved {
		gap: var(--space-3);
	}
	.saved p {
		margin: 0;
	}
	.share {
		padding: var(--space-3);
		background: var(--surface);
		color: var(--ink);
		border: 1px solid var(--line);
		border-radius: var(--radius-md);
		white-space: pre-wrap;
	}
	.whatsapp {
		align-self: flex-start;
	}
	ul {
		margin: 0;
		padding: 0;
		list-style: none;
	}
	.range {
		display: flex;
		align-items: center;
		gap: var(--space-3);
		padding: var(--space-3) var(--space-4);
	}
	.range + .range {
		border-block-start: 1px solid var(--line);
	}
	.main {
		flex: 1;
		display: flex;
		flex-direction: column;
	}
	.dates {
		font-weight: 600;
	}
</style>

<script lang="ts">
	import { untrack } from 'svelte';
	import { api } from '#lib/api/client.js';
	import { ApiError, errorText, fieldText, type FieldErrors } from '#lib/api/errors.js';
	import type { ClosedRange } from '#lib/api/academy-types.js';
	import {
		closedRangeErrors,
		formatRange,
		isPast,
		toDateRangeInput
	} from '#lib/forms/closed-dates.js';
	import { focusFirstInvalid } from '#lib/forms/focus.js';
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
	let notice = $state<string>();
	let busy = $state(false);
	let formElement = $state<HTMLFormElement>();

	const sorted = $derived([...closures].sort((a, b) => a.from.localeCompare(b.from)));
	const upcoming = $derived(sorted.filter((r) => !isPast(r, data.today)));
	const past = $derived(sorted.filter((r) => isPast(r, data.today)).reverse());

	async function add(event: SubmitEvent) {
		event.preventDefault();
		failure = undefined;
		notice = undefined;
		const form = { from, to, reason };
		errors = closedRangeErrors(form);
		if (Object.keys(errors).length > 0) return focusFirstInvalid(formElement);
		busy = true;
		try {
			const created = await api<ClosedRange>('/academy/closed-dates', {
				method: 'POST',
				body: toDateRangeInput(form)
			});
			closures = [...closures, created];
			from = to = reason = '';
			notice = m.closed_added();
		} catch (e) {
			const error = e instanceof ApiError ? e : new ApiError(0, 'internal_error');
			errors = error.fields;
			if (Object.keys(error.fields).length === 0) failure = errorText(error.code);
			else focusFirstInvalid(formElement);
		} finally {
			busy = false;
		}
	}

	async function remove(range: ClosedRange) {
		failure = undefined;
		notice = undefined;
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

	{#if notice}<Banner icon="check_circle">{notice}</Banner>{/if}
	{#if failure}<Banner tone="danger" icon="error">{failure}</Banner>{/if}

	<Card raised>
		<form class="sj-stack" bind:this={formElement} onsubmit={add} novalidate>
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

	{#if sorted.length === 0}
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

<script lang="ts">
	import { tick } from 'svelte';
	import { api } from '#lib/api/client.js';
	import { ApiError, errorText, fieldText, type FieldErrors } from '#lib/api/errors.js';
	import type { Horse, Unavailable } from '#lib/api/academy-types.js';
	import type { Locale } from '#lib/api/types.js';
	import {
		closedRangeErrors,
		formatRange,
		splitByToday,
		toDateRangeInput
	} from '#lib/forms/closed-dates.js';
	import { focusFirstInvalid } from '#lib/forms/focus.js';
	import { m } from '#lib/paraglide/messages.js';
	import { Banner, Button, Card, DateRangeField, TextField } from '#lib/ui/index.js';

	type Props = {
		horse: Horse;
		/** The academy's date today, as YYYY-MM-DD. */
		today: string;
		locale: Locale;
		onchange: (horse: Horse) => void;
	};
	let { horse, today, locale, onchange }: Props = $props();

	let adding = $state(false);
	let from = $state('');
	let to = $state('');
	let reason = $state('');
	let errors = $state<FieldErrors>({});
	let failure = $state<string>();
	let busy = $state(false);
	let formElement = $state<HTMLFormElement>();

	const split = $derived(splitByToday(horse.unavailability, today));

	async function open() {
		failure = undefined;
		adding = true;
		await tick();
		formElement?.querySelector('input')?.focus();
	}

	function close() {
		adding = false;
		from = to = reason = '';
		errors = {};
	}

	async function add(event: SubmitEvent) {
		event.preventDefault();
		failure = undefined;
		const form = { from, to, reason };
		errors = closedRangeErrors(form);
		if (Object.keys(errors).length > 0) return focusFirstInvalid(formElement);
		busy = true;
		try {
			onchange(
				await api<Horse>(`/academy/horses/${horse.id}/unavailability`, {
					method: 'POST',
					body: toDateRangeInput(form)
				})
			);
			close();
		} catch (e) {
			const error = e instanceof ApiError ? e : new ApiError(0, 'internal_error');
			errors = error.fields;
			if (Object.keys(error.fields).length === 0) failure = errorText(error.code);
			else focusFirstInvalid(formElement);
		} finally {
			busy = false;
		}
	}

	async function remove(entry: Unavailable) {
		failure = undefined;
		try {
			onchange(
				await api<Horse>(`/academy/horses/${horse.id}/unavailability/${entry.id}`, {
					method: 'DELETE'
				})
			);
		} catch (e) {
			failure = errorText(e instanceof ApiError ? e.code : 'internal_error');
		}
	}
</script>

{#snippet entries(list: Unavailable[])}
	<ul class="sj-list" role="list">
		{#each list as entry (entry.id)}
			{@const dates = formatRange(entry, locale)}
			<li class="sj-list__row">
				<div class="sj-list__main">
					<span class="strong">{dates}</span>
					{#if entry.reason}<span class="sj-small sj-muted"><bdi>{entry.reason}</bdi></span>{/if}
				</div>
				<Button
					variant="quiet"
					icon="delete"
					label={m.closed_delete({ dates }, { locale })}
					onclick={() => remove(entry)}
				/>
			</li>
		{/each}
	</ul>
{/snippet}

<section class="sj-stack section">
	{#if !adding}
		<div>
			<Button variant="secondary" icon="event_busy" onclick={open}>
				{m.horse_unavailable_mark({}, { locale })}
			</Button>
		</div>
	{/if}

	{#if failure}<Banner tone="danger" icon="error">{failure}</Banner>{/if}

	{#if adding}
		<Card>
			<form method="post" class="sj-stack" bind:this={formElement} onsubmit={add} novalidate>
				<DateRangeField
					label={m.horse_unavailable_dates({}, { locale })}
					error={fieldText(errors, 'from') ?? fieldText(errors, 'to')}
					bind:from
					bind:to
				/>
				<TextField
					label={m.closed_reason({}, { locale })}
					error={fieldText(errors, 'reason')}
					bind:value={reason}
				/>
				<div class="sj-row">
					<Button type="submit" disabled={busy}>{m.horse_unavailable_add({}, { locale })}</Button>
					<Button variant="quiet" onclick={close}>{m.action_cancel({}, { locale })}</Button>
				</div>
			</form>
		</Card>
	{/if}

	{#if split.upcoming.length === 0}
		<p class="sj-muted">{m.horse_unavailable_none({}, { locale })}</p>
	{:else}
		{@render entries(split.upcoming)}
	{/if}

	{#if split.past.length > 0}
		<details>
			<summary class="sj-small">
				{m.horse_unavailable_earlier({ count: split.past.length }, { locale })}
			</summary>
			<div class="earlier">{@render entries(split.past)}</div>
		</details>
	{/if}
</section>

<style>
	.section {
		gap: var(--space-2);
	}
	ul {
		margin: 0;
		padding: 0;
		list-style: none;
	}
	.strong {
		font-weight: 600;
	}
	.sj-list__main > .strong {
		white-space: normal;
	}
	summary {
		cursor: pointer;
		color: var(--ink-muted);
	}
	.earlier {
		margin-block-start: var(--space-2);
	}
</style>

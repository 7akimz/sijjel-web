<script lang="ts">
	import { untrack } from 'svelte';
	import { resolve } from '$app/paths';
	import HorseForm from '#lib/components/HorseForm.svelte';
	import SetupNext from '#lib/components/SetupNext.svelte';
	import { api } from '#lib/api/client.js';
	import { ApiError, errorText, fieldText, type FieldErrors } from '#lib/api/errors.js';
	import type { Horse } from '#lib/api/academy-types.js';
	import { closedRangeErrors, formatRange, toDateRangeInput } from '#lib/forms/closed-dates.js';
	import { focusFirstInvalid } from '#lib/forms/focus.js';
	import { m } from '#lib/paraglide/messages.js';
	import { Banner, Button, Card, DateRangeField, StatusChip, TextField } from '#lib/ui/index.js';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();

	let horse = $state<Horse>(untrack(() => data.horse));
	let notice = $state<string>();
	let from = $state('');
	let to = $state('');
	let reason = $state('');
	let errors = $state<FieldErrors>({});
	let failure = $state<string>();
	let busy = $state(false);
	let formElement = $state<HTMLFormElement>();

	function onSaved(saved: Horse) {
		horse = saved;
		notice = m.horse_saved();
	}

	async function addDates(event: SubmitEvent) {
		event.preventDefault();
		failure = undefined;
		const form = { from, to, reason };
		errors = closedRangeErrors(form);
		if (Object.keys(errors).length > 0) return focusFirstInvalid(formElement);
		busy = true;
		try {
			horse = await api<Horse>(`/academy/horses/${horse.id}/unavailability`, {
				method: 'POST',
				body: toDateRangeInput(form)
			});
			from = to = reason = '';
		} catch (e) {
			const error = e instanceof ApiError ? e : new ApiError(0, 'internal_error');
			errors = error.fields;
			if (Object.keys(error.fields).length === 0) failure = errorText(error.code);
			else focusFirstInvalid(formElement);
		} finally {
			busy = false;
		}
	}

	async function removeDates(entryId: string) {
		failure = undefined;
		try {
			horse = await api<Horse>(`/academy/horses/${horse.id}/unavailability/${entryId}`, {
				method: 'DELETE'
			});
		} catch (e) {
			failure = errorText(e instanceof ApiError ? e.code : 'internal_error');
		}
	}
</script>

<svelte:head>
	<title>{horse.name}</title>
</svelte:head>

<div class="sj-page">
	<div>
		<Button variant="quiet" icon="arrow_back" href={resolve('/(academy)/(admin)/horses')}>
			{m.horse_back()}
		</Button>
	</div>
	<div class="sj-row">
		<h1 class="sj-title">{horse.name}</h1>
		{#if horse.unavailableToday}
			<StatusChip tone="pending" dot>{m.horse_unavailable_today()}</StatusChip>
		{/if}
		{#if !horse.isActive}<StatusChip tone="stone">{m.horse_inactive()}</StatusChip>{/if}
	</div>

	{#if notice}<Banner icon="check_circle">{notice}</Banner>{/if}
	{#if data.setup}<SetupNext state={data.setup} current="horses" />{/if}

	<Card>
		{#key horse.id}
			<HorseForm disciplines={data.disciplines} locale={data.locale} {horse} onsaved={onSaved} />
		{/key}
	</Card>

	<Card>
		<div class="sj-stack">
			<h2 class="sj-heading">{m.horse_unavailable_title()}</h2>
			<p class="sj-small sj-muted">{m.horse_unavailable_intro()}</p>
		</div>
		{#if failure}<Banner tone="danger" icon="error">{failure}</Banner>{/if}
		{#if horse.unavailability.length === 0}
			<p class="sj-muted">{m.horse_unavailable_none()}</p>
		{:else}
			<ul class="entries" role="list">
				{#each horse.unavailability as entry (entry.id)}
					{@const dates = formatRange(entry, data.locale)}
					<li>
						<div class="main">
							<span class="dates">{dates}</span>
							{#if entry.reason}<span class="sj-small sj-muted">{entry.reason}</span>{/if}
						</div>
						<Button
							variant="quiet"
							icon="delete"
							label={m.closed_delete({ dates })}
							onclick={() => removeDates(entry.id)}
						/>
					</li>
				{/each}
			</ul>
		{/if}
		<form class="sj-stack" bind:this={formElement} onsubmit={addDates} novalidate>
			<DateRangeField
				label={m.horse_unavailable_dates()}
				error={fieldText(errors, 'from') ?? fieldText(errors, 'to')}
				bind:from
				bind:to
			/>
			<TextField
				label={m.closed_reason()}
				error={fieldText(errors, 'reason')}
				bind:value={reason}
			/>
			<div>
				<Button type="submit" variant="secondary" icon="add" disabled={busy}>
					{m.horse_unavailable_add()}
				</Button>
			</div>
		</form>
	</Card>
</div>

<style>
	.entries {
		margin: 0;
		padding: 0;
		list-style: none;
	}
	.entries li {
		display: flex;
		align-items: center;
		gap: var(--space-3);
		padding-block: var(--space-2);
	}
	.entries li + li {
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

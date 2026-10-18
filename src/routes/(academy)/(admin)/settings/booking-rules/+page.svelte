<script lang="ts">
	import { untrack } from 'svelte';
	import { api } from '#lib/api/client.js';
	import { ApiError, errorText, fieldText, type FieldErrors } from '#lib/api/errors.js';
	import type { BookingRules } from '#lib/api/academy-types.js';
	import { bookingRulesErrors, wholeNumber } from '#lib/forms/booking-rules.js';
	import { focusFirstInvalid } from '#lib/forms/focus.js';
	import { m } from '#lib/paraglide/messages.js';
	import { Banner, Button, Card, TextField } from '#lib/ui/index.js';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();

	const initial = untrack(() => data.rules);
	let windowDays = $state<string | number>(initial.bookingWindowDays);
	let closesHours = $state<string | number>(initial.bookingClosesHours);
	let cutoffHours = $state<string | number>(initial.cancellationCutoffHours);
	let errors = $state<FieldErrors>({});
	let failure = $state<string>();
	let saved = $state(false);
	let busy = $state(false);
	let formElement = $state<HTMLFormElement>();

	const rules = $derived<BookingRules>({
		bookingWindowDays: wholeNumber(windowDays),
		bookingClosesHours: wholeNumber(closesHours),
		cancellationCutoffHours: wholeNumber(cutoffHours)
	});

	async function save(event: SubmitEvent) {
		event.preventDefault();
		saved = false;
		failure = undefined;
		errors = bookingRulesErrors(rules);
		if (Object.keys(errors).length > 0) return focusFirstInvalid(formElement);
		busy = true;
		try {
			await api('/academy/booking-rules', { method: 'PUT', body: rules });
			saved = true;
		} catch (e) {
			const error = e instanceof ApiError ? e : new ApiError(0, 'internal_error');
			errors = error.fields;
			if (Object.keys(error.fields).length === 0) failure = errorText(error.code);
			else focusFirstInvalid(formElement);
		} finally {
			busy = false;
		}
	}
</script>

<svelte:head>
	<title>{m.rules_title()}</title>
</svelte:head>

<div class="sj-page">
	<div class="sj-stack">
		<h1 class="sj-title">{m.rules_title()}</h1>
		<p class="sj-muted">{m.rules_intro()}</p>
	</div>

	{#if saved}<Banner icon="check_circle">{m.rules_saved()}</Banner>{/if}
	{#if failure}<Banner tone="danger" icon="error">{failure}</Banner>{/if}

	<form class="sj-stack" bind:this={formElement} onsubmit={save} novalidate>
		<Card>
			<TextField
				label={m.rules_window()}
				type="number"
				dir="ltr"
				hint={m.rules_window_hint({ count: rules.bookingWindowDays })}
				error={fieldText(errors, 'bookingWindowDays')}
				bind:value={windowDays}
			/>
			<TextField
				label={m.rules_closes()}
				type="number"
				dir="ltr"
				hint={m.rules_closes_hint({ count: rules.bookingClosesHours })}
				error={fieldText(errors, 'bookingClosesHours')}
				bind:value={closesHours}
			/>
			<TextField
				label={m.rules_cutoff()}
				type="number"
				dir="ltr"
				hint={m.rules_cutoff_hint({ count: rules.cancellationCutoffHours })}
				error={fieldText(errors, 'cancellationCutoffHours')}
				bind:value={cutoffHours}
			/>
		</Card>
		<div>
			<Button type="submit" disabled={busy}>{m.action_save()}</Button>
		</div>
	</form>
</div>

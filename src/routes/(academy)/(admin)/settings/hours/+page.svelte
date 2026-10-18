<script lang="ts">
	import { untrack } from 'svelte';
	import AffectedBookings from '#lib/components/AffectedBookings.svelte';
	import { api } from '#lib/api/client.js';
	import { ApiError, errorText, fieldText, type FieldErrors } from '#lib/api/errors.js';
	import type { DayPreview, Schedule } from '#lib/api/academy-types.js';
	import type { AffectedBooking } from '#lib/api/member-types.js';
	import { focusFirstInvalid } from '#lib/forms/focus.js';
	import {
		copyToOpenDays,
		hoursErrors,
		previewRequestFor,
		rowsFromSchedule,
		sessionSummary,
		toScheduleInput,
		WEEK_ORDER,
		breakChoices,
		sessionLengthChoices,
		type DayRow,
		type ScheduleBase
	} from '#lib/forms/hours.js';
	import { timeZoneOptions } from '#lib/forms/time-zones.js';
	import { m } from '#lib/paraglide/messages.js';
	import {
		Banner,
		Button,
		Card,
		CheckboxField,
		SelectField,
		TimeRangeField
	} from '#lib/ui/index.js';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();

	const PREVIEW_DELAY_MS = 400;
	const initial = untrack(() => data.schedule);

	let rows = $state<DayRow[]>(rowsFromSchedule(initial));
	let timeZone = $state(initial.timeZone);
	let sessionLength = $state(String(initial.sessionLengthMinutes));
	let breakLength = $state(String(initial.breakMinutes));
	let preview = $state<DayPreview[]>(initial.preview);
	let errors = $state<FieldErrors>({});
	let failure = $state<string>();
	let affected = $state<AffectedBooking[]>();
	let saved = $state(false);
	let busy = $state(false);
	let formElement = $state<HTMLFormElement>();

	const weekdayNames: Record<number, () => string> = {
		0: m.weekday_0,
		1: m.weekday_1,
		2: m.weekday_2,
		3: m.weekday_3,
		4: m.weekday_4,
		5: m.weekday_5,
		6: m.weekday_6
	};
	const sessionOptions = sessionLengthChoices(initial.sessionLengthMinutes).map((n) => ({
		value: String(n),
		label: m.hours_minutes({ count: n })
	}));
	const breakOptions = breakChoices(initial.breakMinutes).map((n) => ({
		value: String(n),
		label: n === 0 ? m.hours_no_break() : m.hours_minutes({ count: n })
	}));
	const timeZones = timeZoneOptions();

	const base = $derived<ScheduleBase>({
		timeZone,
		sessionLengthMinutes: Number(sessionLength),
		breakMinutes: Number(breakLength)
	});
	const rowInvalid = (row: DayRow) => hoursErrors([row], base).days !== undefined;
	const previewByDay = $derived(new Map(preview.map((p) => [p.weekday, p.starts])));
	const openRows = $derived(rows.filter((r) => r.open));

	// A newer preview request supersedes older ones, so a slow response never overwrites a newer one.
	let previewSequence = 0;
	$effect(() => {
		const request = previewRequestFor(rows, base);
		const clientErrors = request ? Object.keys(hoursErrors(rows, base)).length > 0 : true;
		if (!request || clientErrors) return;
		const sequence = ++previewSequence;
		const timer = setTimeout(async () => {
			try {
				const result = await api<Schedule>('/academy/schedule/preview', {
					method: 'POST',
					body: request
				});
				if (sequence === previewSequence) preview = result.preview;
			} catch {
				return;
			}
		}, PREVIEW_DELAY_MS);
		return () => clearTimeout(timer);
	});

	async function save(event: SubmitEvent) {
		event.preventDefault();
		saved = false;
		failure = undefined;
		affected = undefined;
		errors = hoursErrors(rows, base);
		if (Object.keys(errors).length > 0) return focusFirstInvalid(formElement);
		busy = true;
		try {
			const result = await api<Schedule>('/academy/schedule', {
				method: 'PUT',
				body: toScheduleInput(rows, base)
			});
			preview = result.preview;
			saved = true;
		} catch (e) {
			const error = e instanceof ApiError ? e : new ApiError(0, 'internal_error');
			errors = error.fields;
			const unexplained = error.fields.days && !rows.some((r) => r.open && rowInvalid(r));
			if (error.code === 'bookings_affected')
				affected = (error.extra.bookings as AffectedBooking[] | undefined) ?? [];
			else if (Object.keys(error.fields).length === 0 || unexplained)
				failure = errorText(error.code === 'validation_failed' ? 'hours_invalid' : error.code);
			else focusFirstInvalid(formElement);
		} finally {
			busy = false;
		}
	}
</script>

<svelte:head>
	<title>{m.hours_title()}</title>
</svelte:head>

<div class="sj-page">
	<div class="sj-stack">
		<h1 class="sj-title">{m.hours_title()}</h1>
		<p class="sj-muted">{m.hours_intro()}</p>
	</div>

	{#if saved}<Banner icon="check_circle">{m.hours_saved()}</Banner>{/if}
	{#if failure}<Banner tone="danger" icon="error">{failure}</Banner>{/if}
	{#if affected}
		<AffectedBookings
			bookings={affected}
			locale={data.locale}
			body={m.hours_affected_body()}
			oncancel={() => (affected = undefined)}
		/>
	{/if}

	<form class="sj-stack" bind:this={formElement} onsubmit={save} novalidate>
		<Card>
			<ul class="days" role="list">
				{#each rows as row (row.weekday)}
					{@const name = weekdayNames[row.weekday]()}
					<li class="day">
						<div class="day-head">
							<CheckboxField label={m.hours_open_day({ day: name })} bind:checked={row.open} />
						</div>
						{#if row.open}
							<TimeRangeField
								label={name}
								bind:opens={row.opensAt}
								bind:closes={row.closesAt}
								error={errors.days && rowInvalid(row) ? errorText('hours_invalid') : undefined}
							/>
							{#if openRows.length > 1}
								<div>
									<Button
										variant="quiet"
										icon="content_copy"
										label={m.hours_copy_from({ day: name })}
										onclick={() => (rows = copyToOpenDays(rows, row.weekday))}
									>
										{m.hours_copy()}
									</Button>
								</div>
							{/if}
						{:else}
							<span class="sj-small sj-muted">{m.hours_closed()}</span>
						{/if}
					</li>
				{/each}
			</ul>
		</Card>

		<Card>
			<SelectField
				label={m.hours_session_length()}
				options={sessionOptions}
				error={fieldText(errors, 'sessionLengthMinutes')}
				bind:value={sessionLength}
			/>
			<SelectField
				label={m.hours_break()}
				options={breakOptions}
				error={fieldText(errors, 'breakMinutes')}
				bind:value={breakLength}
			/>
			<SelectField
				label={m.hours_time_zone()}
				options={timeZones}
				error={fieldText(errors, 'timeZone')}
				bind:value={timeZone}
			/>
		</Card>

		<Card>
			<h2 class="sj-heading">{m.hours_preview_title()}</h2>
			<dl class="preview">
				{#each WEEK_ORDER.filter((w) => rows.find((r) => r.weekday === w)?.open) as weekday (weekday)}
					<dt>{weekdayNames[weekday]()}</dt>
					<dd dir="auto">{sessionSummary(previewByDay.get(weekday) ?? [])}</dd>
				{/each}
			</dl>
		</Card>

		<div>
			<Button type="submit" disabled={busy}>{m.action_save()}</Button>
		</div>
	</form>
</div>

<style>
	.days {
		margin: 0;
		padding: 0;
		list-style: none;
		display: flex;
		flex-direction: column;
	}
	.day {
		display: flex;
		flex-direction: column;
		gap: var(--space-2);
		padding-block: var(--space-3);
	}
	.day + .day {
		border-block-start: 1px solid var(--line);
	}
	.day-head {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: var(--space-3);
	}
	.preview {
		margin: 0;
		display: grid;
		grid-template-columns: auto 1fr;
		gap: var(--space-2) var(--space-4);
	}
	dt {
		font-weight: 600;
	}
	dd {
		margin: 0;
	}
</style>

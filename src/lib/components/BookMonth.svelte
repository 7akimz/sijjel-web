<script lang="ts">
	import { untrack } from 'svelte';
	import { api } from '#lib/api/client.js';
	import { ApiError, errorText } from '#lib/api/errors.js';
	import type { MonthResult, MonthView } from '#lib/api/member-types.js';
	import type { Locale } from '#lib/api/types.js';
	import { formatDayMonth, formatMonth, formatWeekday } from '#lib/format.js';
	import {
		firstName,
		fit,
		pickList,
		picksFrom,
		plannedDates,
		sessionCount,
		togglePick,
		type PlannedDate,
		type Picks
	} from '#lib/forms/book-month.js';
	import { bookingErrorText, slotReasonText, warningTexts } from '#lib/forms/booking.js';
	import { sessionsText } from '#lib/forms/horse-rides.js';
	import { m } from '#lib/paraglide/messages.js';
	import { Banner, Button, Icon } from '#lib/ui/index.js';

	type Props = {
		view: MonthView;
		memberId: string;
		rider: string;
		locale: Locale;
		onbooked: (result: MonthResult) => void;
	};
	let { view, memberId, rider, locale, onbooked }: Props = $props();

	type MessageFn = (inputs: object, options: { locale?: Locale }) => string;
	const messages = m as unknown as Record<string, MessageFn | undefined>;

	let picks = $state<Picks>(untrack(() => picksFrom(view.current)));
	let confirming = $state(false);
	let serverWarnings = $state<string[] | null>(null);
	let busy = $state(false);
	let failure = $state('');

	const first = $derived(firstName(rider));
	const monthName = $derived(formatMonth(`${view.month}-01`, locale));
	const planned = $derived(plannedDates(view, picks));
	const count = $derived(sessionCount(planned));
	const over = $derived(planned.filter((p) => p.status === 'over').length);
	const limit = $derived(view.limit.lessonsPerMonth);
	const unpaid = $derived(view.limit.monthUnpaid && count > 0);
	const problems = $derived(planned.filter((p) => p.status === 'over' || p.status === 'skip'));
	const localWarnings = $derived([
		...(over > 0 && limit !== null
			? [m.book_month_over({ sessions: sessionsText(over, locale), limit }, { locale })]
			: []),
		...(unpaid ? [slotReasonText('month_unpaid', locale)] : [])
	]);
	const warnings = $derived(serverWarnings ?? localWarnings);

	const dayName = (weekday: number) => messages[`weekday_${weekday}`]!({}, { locale });
	const dateLabel = (date: string) => {
		const iso = `${date}T00:00:00Z`;
		return `${formatWeekday(iso, locale)} ${formatDayMonth(iso, locale)}`;
	};
	// The reason follows in its own <bdi>, so the separator ends the label.
	const closedLabel = (date: string, withReason: boolean) => {
		const label = m.book_month_closed({ date: dateLabel(date) }, { locale });
		return withReason ? `${label} · ` : label;
	};
	const closedOn = (weekday: number) =>
		view.closed.filter((c) => new Date(`${c.date}T00:00:00Z`).getUTCDay() === weekday);

	function note(p: PlannedDate): string {
		if (p.status === 'over' && limit !== null) {
			return `${m.book_month_over_limit({ limit }, { locale })} · ${m.book_month_only_if({}, { locale })}`;
		}
		if (p.status === 'skip') {
			return `${slotReasonText(p.reason, locale)} · ${m.book_month_wont({}, { locale })}`;
		}
		if (p.status === 'have') return m.book_month_have({}, { locale });
		return '';
	}

	function tap(weekday: number, start: string) {
		picks = togglePick(picks, weekday, start);
		confirming = false;
		serverWarnings = null;
		failure = '';
	}

	async function book(confirm: boolean) {
		busy = true;
		failure = '';
		try {
			const result = await api<MonthResult>(`/academy/members/${memberId}/month-bookings`, {
				method: 'POST',
				body: { month: view.month, days: pickList(picks), confirm }
			});
			onbooked(result);
		} catch (e) {
			const found = e instanceof ApiError ? warningTexts(e, locale) : null;
			if (found) serverWarnings = found;
			else {
				confirming = false;
				failure =
					e instanceof ApiError ? bookingErrorText(e, locale) : errorText('internal_error', locale);
			}
		} finally {
			busy = false;
		}
	}
</script>

<p class="sj-small sj-muted hint">
	<Icon name="history" size={20} />
	<span
		>{view.current.length > 0
			? m.book_month_prefill({ first, month: monthName }, { locale })
			: m.book_month_hint({ first }, { locale })}</span
	>
</p>

{#if failure}<Banner icon="error" tone="danger">{failure}</Banner>{/if}

{#each view.days as day (day.weekday)}
	<section class="day">
		<h2 class="sj-heading">{dayName(day.weekday)}</h2>
		{#each closedOn(day.weekday) as closed (closed.date)}
			<p class="daynote sj-small">
				<Icon name="event_busy" size={20} />
				<span
					>{closedLabel(closed.date, !!closed.reason)}{#if closed.reason}<bdi>{closed.reason}</bdi
						>{/if}</span
				>
			</p>
		{/each}
		<div class="pills">
			{#each day.times as time (time.start)}
				{@const { free, total } = fit(time)}
				{@const on = picks[day.weekday] === time.start}
				<button
					type="button"
					class={['pill', on && 'pill--on', !on && free > 0 && free < total && 'pill--partial']}
					aria-pressed={on}
					disabled={busy || (free === 0 && !on)}
					onclick={() => tap(day.weekday, time.start)}
				>
					<span class="start" dir="ltr">{time.start}</span>
					<span class="fit">{m.book_month_fit({ free, total }, { locale })}</span>
				</button>
			{/each}
		</div>
	</section>
{/each}

{#if problems.length > 0 || unpaid}
	<section class="sj-stack check" aria-labelledby="book-month-check">
		<h2 class="sj-heading" id="book-month-check">{m.book_month_check({}, { locale })}</h2>
		<ul class="sj-list" role="list">
			{#if unpaid}
				<li class="sj-list__row row">
					<span class="mark mark--warn"><Icon name="warning" size={20} /></span>
					<div class="sj-list__main">
						<span class="strong">{slotReasonText('month_unpaid', locale)}</span>
						<span class="sj-small sj-muted">{m.book_month_only_if({}, { locale })}</span>
					</div>
				</li>
			{/if}
			{#each problems as p (p.date)}
				<li class="sj-list__row row">
					<span class={['mark', p.status === 'over' ? 'mark--warn' : 'mark--no']}
						><Icon name={p.status === 'over' ? 'warning' : 'block'} size={20} /></span
					>
					<div class="sj-list__main">
						<span class="strong">{dateLabel(p.date)} · <span dir="ltr">{p.start}</span></span>
						<span class="sj-small sj-muted">{note(p)}</span>
					</div>
				</li>
			{/each}
		</ul>
	</section>
{/if}

{#if planned.length > 0}
	<details class="all">
		<summary class="sj-small"
			><Icon name="expand_more" size={20} />{m.book_month_all(
				{ count: planned.length },
				{ locale }
			)}</summary
		>
		<ul class="sj-list" role="list">
			{#each planned as p (p.date)}
				<li class="sj-list__row row">
					<div class="sj-list__main">
						<span class="strong">{dateLabel(p.date)} · <span dir="ltr">{p.start}</span></span>
						{#if note(p)}<span class="sj-small sj-muted">{note(p)}</span>{/if}
					</div>
				</li>
			{/each}
		</ul>
	</details>
{/if}

<div class="bar" role="region" aria-label={m.book_month_title({ rider }, { locale })}>
	{#if confirming}
		<div class="confirm">
			<p class="strong">
				{m.book_month_confirm(
					{ sessions: sessionsText(count, locale), rider, month: monthName },
					{ locale }
				)}
			</p>
			{#if warnings.length > 0}
				<ul class="warnings" role="list">
					{#each warnings as warning (warning)}
						<li><Icon name="warning" size={20} />{warning}</li>
					{/each}
				</ul>
			{/if}
			<div class="sj-row">
				{#if warnings.length > 0}
					<Button disabled={busy} onclick={() => book(true)}
						>{m.staff_book_anyway({}, { locale })}</Button
					>
				{:else}
					<Button disabled={busy} onclick={() => book(false)}
						>{m.book_confirm_action({}, { locale })}</Button
					>
				{/if}
				<Button
					variant="quiet"
					disabled={busy}
					onclick={() => {
						confirming = false;
						serverWarnings = null;
					}}>{m.action_cancel({}, { locale })}</Button
				>
			</div>
		</div>
	{:else}
		<div class="bar__row">
			<div class="bar__what">
				<span class="strong"
					>{count > 0
						? sessionsText(count, locale)
						: m.book_month_none_chosen({}, { locale })}</span
				>
				<span class="sj-small sj-muted"
					>{m.book_month_in({ month: monthName }, { locale })} ·
					{limit !== null
						? m.book_month_plan({ count: limit }, { locale })
						: m.book_month_no_plan({}, { locale })}</span
				>
			</div>
			<Button disabled={busy || count === 0} onclick={() => (confirming = true)}
				>{m.book_month_book({ sessions: sessionsText(count, locale) }, { locale })}</Button
			>
		</div>
	{/if}
</div>

<style>
	.hint,
	.daynote {
		margin: 0;
		display: flex;
		align-items: flex-start;
		gap: var(--space-2);
	}
	.daynote {
		align-items: center;
		color: var(--ink-muted);
	}
	.day {
		display: flex;
		flex-direction: column;
		gap: var(--space-2);
	}
	.pills {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(76px, 1fr));
		gap: var(--space-2);
	}
	.pill {
		display: flex;
		flex-direction: column;
		align-items: flex-start;
		gap: 2px;
		min-block-size: 56px;
		padding: var(--space-2) var(--space-3);
		border-radius: var(--radius-md);
		border: 1px solid var(--line);
		background: var(--surface);
		color: var(--ink);
		font: inherit;
		cursor: pointer;
		transition: background-color 150ms ease-out;
	}
	.pill:hover:not(:disabled) {
		background-image: linear-gradient(var(--hover-veil), var(--hover-veil));
	}
	.pill:focus-visible {
		outline: 2px solid var(--focus);
		outline-offset: 2px;
	}
	.start {
		font: 600 16px/20px var(--font-display);
		font-variant-numeric: tabular-nums;
	}
	.fit {
		font-size: 13px;
		line-height: 18px;
		color: var(--ink-muted);
		font-variant-numeric: tabular-nums;
	}
	.pill--partial .fit {
		color: var(--brass);
		font-weight: 600;
	}
	.pill--on {
		background: var(--accent);
		border-color: var(--accent);
		color: var(--on-accent);
	}
	.pill--on .fit {
		color: var(--on-accent);
	}
	.pill:disabled {
		opacity: 0.45;
		cursor: not-allowed;
	}
	.check {
		gap: var(--space-2);
	}
	.row {
		gap: var(--space-3);
	}
	.row .sj-list__main span {
		white-space: normal;
		overflow: visible;
	}
	.mark {
		display: inline-flex;
	}
	.mark--no {
		color: var(--danger);
	}
	.mark--warn {
		color: var(--brass);
	}
	ul {
		margin: 0;
		padding: 0;
		list-style: none;
	}
	.strong {
		font-weight: 600;
	}
	.all summary {
		display: flex;
		align-items: center;
		gap: var(--space-1);
		min-block-size: 44px;
		color: var(--ink);
		font-weight: 500;
		cursor: pointer;
		list-style: none;
	}
	.all summary::-webkit-details-marker {
		display: none;
	}
	.all[open] summary :global(.sj-icon) {
		transform: rotate(180deg);
	}
	.bar {
		position: sticky;
		inset-block-end: var(--space-3);
		z-index: 30;
		padding: var(--space-3);
		background: var(--surface);
		border: 1px solid var(--line);
		border-radius: var(--radius-lg);
		box-shadow: var(--shadow-raised);
	}
	.bar__row {
		display: flex;
		align-items: center;
		gap: var(--space-3);
	}
	.bar__what {
		flex: 1;
		display: flex;
		flex-direction: column;
		min-width: 0;
	}
	.confirm {
		display: flex;
		flex-direction: column;
		gap: var(--space-2);
	}
	.confirm p {
		margin: 0;
	}
	.warnings {
		color: var(--brass);
	}
	.warnings li {
		display: flex;
		align-items: center;
		gap: var(--space-2);
	}
	@media (prefers-reduced-motion: reduce) {
		.pill {
			transition: none;
		}
	}
</style>

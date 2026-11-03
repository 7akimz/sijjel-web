<script lang="ts">
	import { localName } from '#lib/academy.js';
	import type { AcademyDisciplines } from '#lib/api/academy-types.js';
	import { api } from '#lib/api/client.js';
	import { ApiError, errorText } from '#lib/api/errors.js';
	import type { LevelChange, LevelStep, Member, Plan } from '#lib/api/member-types.js';
	import type { Locale } from '#lib/api/types.js';
	import { formatDayMonth } from '#lib/format.js';
	import { nextLevel } from '#lib/forms/move.js';
	import { m } from '#lib/paraglide/messages.js';
	import { Banner, Button, Card } from '#lib/ui/index.js';
	import MoveRider from './MoveRider.svelte';

	type Props = {
		member: Member;
		disciplines: AcademyDisciplines;
		plans: Plan[];
		today: string;
		locale: Locale;
		onchange: (member: Member) => void;
	};
	let { member, disciplines, plans, today, locale, onchange }: Props = $props();

	let moving = $state<{ target?: { disciplineId: string; levelId: string } }>();
	let failure = $state('');
	let busy = $state(false);

	const ladder = $derived(
		disciplines.enabled.find((d) => d.id === member.discipline?.id)?.levels ?? []
	);
	// A scheduled move is cancelled before another is made, so the button never contradicts it.
	const next = $derived(
		member.level && !member.comingMove ? nextLevel(ladder, member.level.id) : null
	);

	function stepText(step: LevelStep, withDiscipline: boolean) {
		const level = localName(step.level, locale);
		return withDiscipline ? `${localName(step.discipline, locale)} · ${level}` : level;
	}

	function historyText(change: LevelChange) {
		const date = formatDayMonth(change.startsOn, locale);
		if (!change.from)
			return m.member_history_started({ level: stepText(change.to, false), date }, { locale });
		const across = change.from.discipline.id !== change.to.discipline.id;
		const text = m.member_history_move(
			{ from: stepText(change.from, across), to: stepText(change.to, across), date },
			{ locale }
		);
		return change.madeBy ? `${text} · ${change.madeBy}` : text;
	}

	async function cancel(path: 'move' | 'coming-plan') {
		failure = '';
		busy = true;
		try {
			onchange(await api<Member>(`/academy/members/${member.id}/${path}`, { method: 'DELETE' }));
		} catch (e) {
			const code = e instanceof ApiError ? e.code : 'internal_error';
			failure =
				path === 'coming-plan' && code === 'plan_required'
					? m.member_plan_cancel_refused({}, { locale })
					: errorText(code, locale);
		} finally {
			busy = false;
		}
	}

	function moved(updated: Member) {
		moving = undefined;
		onchange(updated);
	}
</script>

<section class="sj-stack section">
	<h2 class="sj-heading">{m.member_level_title({}, { locale })}</h2>
	<Card>
		{#if member.discipline && member.level}
			<p>{stepText({ discipline: member.discipline, level: member.level }, true)}</p>
		{/if}
		{#if moving}
			<MoveRider
				{member}
				{disciplines}
				{plans}
				{today}
				{locale}
				target={moving.target}
				onmoved={moved}
				oncancel={() => (moving = undefined)}
			/>
		{:else}
			{#if member.comingMove}
				<div class="coming">
					<span
						>{m.member_move_coming(
							{
								discipline: localName(member.comingMove.discipline, locale),
								level: localName(member.comingMove.level, locale),
								date: formatDayMonth(member.comingMove.from, locale)
							},
							{ locale }
						)}</span
					>
					<Button variant="quiet" disabled={busy} onclick={() => cancel('move')}
						>{m.member_move_cancel({}, { locale })}</Button
					>
				</div>
			{/if}
			{#if member.comingPlan}
				<div class="coming">
					<span
						>{m.member_plan_coming(
							{
								plan: localName(member.comingPlan.plan, locale),
								date: formatDayMonth(member.comingPlan.from, locale)
							},
							{ locale }
						)}</span
					>
					<Button variant="quiet" disabled={busy} onclick={() => cancel('coming-plan')}
						>{m.member_plan_cancel({}, { locale })}</Button
					>
				</div>
			{/if}
			{#if failure}<Banner tone="danger" icon="error">{failure}</Banner>{/if}
			<div class="sj-row">
				{#if next && member.discipline}
					{@const disciplineId = member.discipline.id}
					<Button
						variant="secondary"
						icon="trending_up"
						onclick={() => (moving = { target: { disciplineId, levelId: next.id } })}
						>{m.member_move_to({ level: localName(next, locale) }, { locale })}</Button
					>
				{/if}
				{#if !member.comingMove}
					<Button variant="quiet" onclick={() => (moving = {})}
						>{m.member_change_level({}, { locale })}</Button
					>
				{/if}
			</div>
		{/if}
		{#if member.levelHistory?.length}
			<details>
				<summary class="sj-small"
					>{m.member_history_count({ count: member.levelHistory.length }, { locale })}</summary
				>
				<ul class="history" role="list">
					{#each member.levelHistory as change, i (i)}
						<li class="sj-small">{historyText(change)}</li>
					{/each}
				</ul>
			</details>
		{/if}
	</Card>
</section>

<style>
	.section {
		gap: var(--space-2);
	}
	p {
		margin: 0;
	}
	.coming {
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		justify-content: space-between;
		gap: var(--space-2);
		padding: var(--space-2) var(--space-3);
		border-radius: var(--radius-md);
		background: var(--surface);
		border: 1px solid var(--line);
	}
	summary {
		cursor: pointer;
		color: var(--ink-muted);
	}
	.history {
		margin-block-start: var(--space-2);
		display: grid;
		gap: var(--space-1);
		margin: 0;
		padding: 0;
		list-style: none;
	}
</style>

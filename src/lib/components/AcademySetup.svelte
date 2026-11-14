<script lang="ts">
	import type { Locale, SetupSummary } from '#lib/api/types.js';
	import { formatDayMonth } from '#lib/format.js';
	import { m } from '#lib/paraglide/messages.js';
	import { Card, Icon } from '#lib/ui/index.js';

	type Props = { setup: SetupSummary; locale: Locale };
	let { setup, locale }: Props = $props();

	const steps = $derived([
		{ done: setup.steps.hours, title: m.academy_setup_hours({}, { locale }) },
		{ done: setup.steps.arenas, title: m.academy_setup_arenas({}, { locale }) },
		{ done: setup.steps.horses, title: m.academy_setup_horses({}, { locale }) },
		{ done: setup.steps.plans, title: m.academy_setup_plans({}, { locale }) }
	]);
	const summary = $derived(
		!setup.finished
			? m.academy_setup_progress({ done: setup.done }, { locale })
			: setup.doneOn
				? m.academy_setup_done_on({ date: formatDayMonth(setup.doneOn, locale) }, { locale })
				: m.academy_setup_done({}, { locale })
	);
</script>

<Card>
	<div class="sj-stack">
		<h2 class="sj-heading">{m.academy_setup_title({}, { locale })}</h2>
		<p class="sj-muted">{summary}</p>
		{#if !setup.finished}
			<ul class="steps" role="list">
				{#each steps as step (step.title)}
					<li class:done={step.done}>
						<span aria-hidden="true">
							<Icon name={step.done ? 'check_circle' : 'radio_button_unchecked'} size={20} />
						</span>
						<span aria-hidden="true">{step.title}</span>
						<span class="sj-visually-hidden">
							{step.done
								? m.academy_setup_step_done({ step: step.title }, { locale })
								: m.academy_setup_step_todo({ step: step.title }, { locale })}
						</span>
					</li>
				{/each}
			</ul>
		{/if}
	</div>
</Card>

<style>
	.steps {
		margin: 0;
		padding: 0;
		list-style: none;
		display: grid;
		gap: var(--space-2);
	}
	li {
		display: flex;
		align-items: center;
		gap: var(--space-2);
		color: var(--ink-muted);
	}
	li.done {
		color: var(--ink);
	}
</style>

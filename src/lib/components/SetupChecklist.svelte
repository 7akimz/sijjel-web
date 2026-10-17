<script lang="ts">
	import { resolve } from '$app/paths';
	import type { SetupState } from '#lib/api/academy-types.js';
	import { m } from '#lib/paraglide/messages.js';
	import { Card, Icon, ProgressBar } from '#lib/ui/index.js';

	let { state, academyName }: { state: SetupState; academyName: string } = $props();

	const steps = $derived([
		{
			done: state.hours.done,
			href: resolve('/(academy)/(admin)/settings/hours'),
			title: m.setup_hours_title(),
			body: m.setup_hours_body()
		},
		{
			done: state.arenas.done,
			href: resolve('/(academy)/(admin)/settings/arenas'),
			title: m.setup_arenas_title(),
			body: m.setup_arenas_body()
		},
		{
			done: state.horses.done,
			href: resolve('/(academy)/(admin)/horses'),
			title: m.setup_horses_title(),
			body: m.setup_horses_body()
		}
	]);
	const doneCount = $derived(steps.filter((s) => s.done).length);
	const progress = $derived(m.setup_progress({ done: doneCount }));
</script>

{#if doneCount < steps.length}
	<Card raised>
		<div class="checklist">
			<div class="head sj-stack">
				<h2 class="sj-heading">{m.setup_title({ academy: academyName })}</h2>
				<ProgressBar value={doneCount} max={steps.length} label={progress} />
				<span class="sj-small sj-muted">{progress}</span>
			</div>
			<ol role="list">
				{#each steps as step, index (step.href)}
					<li>
						<a class="step" href={step.href}>
							{#if step.done}
								<span class="tick done"
									><Icon name="check" size={20} /><span class="sj-visually-hidden"
										>{m.setup_step_done()}</span
									></span
								>
							{:else}
								<span class="tick todo" aria-hidden="true">{index + 1}</span>
							{/if}
							<span class="main">
								<span class="step-title">{step.title}</span>
								<span class="sj-small sj-muted">{step.body}</span>
							</span>
							{#if !step.done}<Icon name="chevron_right" directional />{/if}
						</a>
					</li>
				{/each}
			</ol>
		</div>
	</Card>
{/if}

<style>
	.checklist {
		margin: calc(-1 * var(--space-4));
	}
	.head {
		padding: var(--space-4) var(--space-4) var(--space-3);
	}
	ol {
		margin: 0;
		padding: 0;
		list-style: none;
	}
	li {
		border-block-start: 1px solid var(--line);
	}
	.step {
		display: flex;
		align-items: center;
		gap: var(--space-3);
		min-block-size: 56px;
		padding: var(--space-3) var(--space-4);
		color: inherit;
		text-decoration: none;
	}
	.step:hover {
		background: var(--hover-veil);
	}
	.main {
		flex: 1;
		display: flex;
		flex-direction: column;
	}
	.step-title {
		font-weight: 600;
	}
	.tick {
		inline-size: 28px;
		block-size: 28px;
		border-radius: 50%;
		display: grid;
		place-items: center;
		flex: none;
	}
	.done {
		background: var(--paddock-soft);
		color: var(--paddock);
	}
	.todo {
		border: 2px solid var(--line-strong);
		color: var(--ink-muted);
		font-size: 13px;
		font-weight: 600;
	}
</style>

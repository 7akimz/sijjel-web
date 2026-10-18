<script lang="ts">
	import { tick } from 'svelte';
	import { errorText } from '#lib/api/errors.js';
	import { MAX_LEVELS, addRow, moveRow, removeRow, type LadderRow } from '#lib/forms/ladder.js';
	import { m } from '#lib/paraglide/messages.js';
	import { Button, Icon, TextField } from '#lib/ui/index.js';

	type Props = { rows: LadderRow[]; errors?: string[]; legend?: string };
	let { rows = $bindable(), errors = [], legend = m.discipline_levels() }: Props = $props();

	let container = $state<HTMLFieldSetElement>();

	// Keeps focus on the moved level; at either end its button disables, so use the other one.
	async function move(from: number, to: number) {
		rows = moveRow(rows, from, to);
		await tick();
		const number = to + 1;
		const labels = [
			to < from ? m.discipline_move_up({ number }) : m.discipline_move_down({ number }),
			to < from ? m.discipline_move_down({ number }) : m.discipline_move_up({ number })
		];
		for (const label of labels) {
			const button = container?.querySelector<HTMLButtonElement>(`button[aria-label="${label}"]`);
			if (button && !button.disabled) return button.focus();
		}
	}
</script>

<fieldset class="sj-stack" bind:this={container}>
	<legend class="sj-label">{legend}</legend>
	<ol class="sj-stack" role="list">
		{#each rows as row, index (row)}
			{@const number = index + 1}
			<li class="level">
				<span class="sj-numeral" aria-hidden="true">{number}</span>
				<div class="names">
					<TextField label={m.discipline_level_en({ number })} dir="ltr" bind:value={row.nameEn} />
					<TextField label={m.discipline_level_ar({ number })} dir="rtl" bind:value={row.nameAr} />
				</div>
				<div class="tools">
					<Button
						variant="quiet"
						icon="arrow_upward"
						label={m.discipline_move_up({ number })}
						disabled={index === 0}
						onclick={() => move(index, index - 1)}
					/>
					<Button
						variant="quiet"
						icon="arrow_downward"
						label={m.discipline_move_down({ number })}
						disabled={index === rows.length - 1}
						onclick={() => move(index, index + 1)}
					/>
					<Button
						variant="quiet"
						icon="delete"
						label={row.inUse
							? m.ladder_remove_in_use({ number })
							: m.discipline_remove_level({ number })}
						disabled={rows.length === 1 || row.inUse}
						onclick={() => (rows = removeRow(rows, index))}
					/>
				</div>
			</li>
		{/each}
	</ol>
	{#each errors as code (code)}
		<span class="sj-field-error"><Icon name="error" size={20} />{errorText(code)}</span>
	{/each}
	<div>
		<Button
			variant="secondary"
			icon="add"
			disabled={rows.length >= MAX_LEVELS}
			onclick={() => (rows = addRow(rows))}
		>
			{m.discipline_add_level()}
		</Button>
	</div>
</fieldset>

<style>
	fieldset {
		border: 0;
		margin: 0;
		padding: 0;
	}
	ol {
		margin: 0;
		padding: 0;
		list-style: none;
	}
	.level {
		display: grid;
		grid-template-columns: auto 1fr;
		gap: var(--space-2) var(--space-3);
		align-items: start;
		padding-block-end: var(--space-3);
		border-block-end: 1px solid var(--line);
	}
	.level .sj-numeral {
		padding-block-start: var(--space-8);
	}
	.names {
		display: grid;
		gap: var(--space-3);
	}
	.tools {
		grid-column: 2;
		display: flex;
		gap: var(--space-1);
	}
	@media (min-width: 720px) {
		.names {
			grid-template-columns: 1fr 1fr;
		}
	}
</style>

<script lang="ts">
	import type { Snippet } from 'svelte';
	import Icon from './Icon.svelte';

	type SlotState = 'open' | 'last-horse' | 'no-horse' | 'full' | 'booked';
	type Props = {
		start: string;
		end: string;
		placesLeft: number;
		capacity: number;
		horsesFree: number;
		horsesTotal: number;
		state: SlotState;
		note: string;
		placesLabel?: string;
		endLabel?: string;
		// A compact slot shows no counts, only its note, and keeps its action on the same row.
		compact?: boolean;
		action?: Snippet;
	};
	let {
		start,
		end,
		placesLeft,
		capacity,
		horsesFree,
		horsesTotal,
		state,
		note,
		placesLabel,
		endLabel,
		compact = false,
		action
	}: Props = $props();

	const closed = $derived(state === 'no-horse' || state === 'full');
	const noteColor = $derived(
		state === 'last-horse' ? 'var(--brass)' : closed ? 'var(--danger)' : undefined
	);
	const markers = $derived(Array.from({ length: horsesTotal }, (_, index) => index >= horsesFree));
</script>

<article
	class={[
		'sj-slot',
		closed && 'sj-slot--closed',
		state === 'booked' && 'sj-slot--booked',
		compact && 'sj-slot--compact'
	]}
>
	<div class="sj-slot__time">
		<span class="sj-numeral">{start}</span>
		<span class="sj-slot__end">{endLabel ?? end}</span>
	</div>
	<div class="sj-slot__body">
		{#if !compact}
			<span style="font-weight: 600">{placesLabel ?? `${placesLeft} / ${capacity}`}</span>
		{/if}
		{#if note}
			<div class="sj-slot__note" style:color={noteColor}>
				{#if closed}
					<Icon name="block" size={20} />
				{:else if state === 'booked'}
					<Icon name="check_circle" size={20} />
				{:else if horsesTotal > 0}
					<span class="sj-horses" aria-hidden="true">
						{#each markers as taken, index (index)}
							<i class={['sj-horses__horse', taken && 'sj-horses__horse--taken']}></i>
						{/each}
					</span>
				{/if}
				<span class={state === 'open' ? 'sj-muted' : undefined}>{note}</span>
			</div>
		{/if}
		{#if closed && horsesTotal > 0}
			<span class="sj-horses" aria-hidden="true">
				{#each markers as taken, index (index)}
					<i class={['sj-horses__horse', taken && 'sj-horses__horse--taken']}></i>
				{/each}
			</span>
		{/if}
	</div>
	{@render action?.()}
</article>

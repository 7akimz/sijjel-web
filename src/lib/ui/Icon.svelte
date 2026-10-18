<script lang="ts">
	type Props = { name: string; size?: 20 | 24; filled?: boolean; directional?: boolean };
	let { name, size = 24, filled = false, directional = false }: Props = $props();

	const shoe =
		'M4.6 21C3.3 17.5 3 13 3.6 10 4.5 5.6 7.8 3 12 3s7.5 2.6 8.4 7c.6 3 .3 7.5-1 11h-4c1-3 1.2-6.5.8-8.8C15.7 9.3 14.1 7.5 12 7.5S8.3 9.3 7.8 12.2c-.4 2.3-.2 5.8.8 8.8Z';
	const nails = [
		[5.9, 17.4],
		[5.6, 12.8],
		[7.4, 8.1],
		[18.1, 17.4],
		[18.4, 12.8],
		[16.6, 8.1]
	];
	const nailHoles = nails.map(([x, y]) => `M${x} ${y}m-.9 0a.9.9 0 1 0 1.8 0a.9.9 0 1 0-1.8 0Z`);
</script>

<span
	class={[
		'sj-icon',
		size === 20 && 'sj-icon--sm',
		filled && 'sj-icon--filled',
		directional && 'sj-icon--directional'
	]}
	aria-hidden="true"
>
	{#if name === 'horseshoe'}
		<!-- The icon font has no horse or hoof, so the horseshoe is drawn on the same 24px grid. -->
		<svg class="glyph" viewBox="0 0 24 24">
			{#if filled}
				<path fill="currentColor" fill-rule="evenodd" d={shoe + nailHoles.join('')} />
			{:else}
				<path d={shoe} fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round" />
				{#each nails as [cx, cy] (`${cx},${cy}`)}
					<circle {cx} {cy} r=".75" fill="currentColor" />
				{/each}
			{/if}
		</svg>
	{:else}
		{name}
	{/if}
</span>

<style>
	.glyph {
		display: block;
		inline-size: 1em;
		block-size: 1em;
	}
</style>

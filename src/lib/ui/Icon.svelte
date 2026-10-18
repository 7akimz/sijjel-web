<script lang="ts">
	type Props = { name: string; size?: 20 | 24; filled?: boolean; directional?: boolean };
	let { name, size = 24, filled = false, directional = false }: Props = $props();

	// A true arc with straight sides that lean in toward the heels, like the font's own icons.
	const shoe = 'M5 20.5 4 11a8 8 0 0 1 16 0l-1 9.5h-4.5l1-9.5a3.5 3.5 0 0 0-7 0l1 9.5Z';
	// Nails sit on the band's centre line, evenly spaced along it.
	const nails = [
		[7.73, 7.15],
		[6.43, 12.71],
		[6.97, 17.84],
		[16.27, 7.15],
		[17.57, 12.71],
		[17.03, 17.84]
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
					<circle {cx} {cy} r=".8" fill="currentColor" />
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

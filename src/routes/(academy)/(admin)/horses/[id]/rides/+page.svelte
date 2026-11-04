<script lang="ts">
	import HorseHeader from '#lib/components/HorseHeader.svelte';
	import HorseRides from '#lib/components/HorseRides.svelte';
	import { m } from '#lib/paraglide/messages.js';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();
</script>

<svelte:head>
	<title>{m.horse_rides_title({ name: data.horse.name })}</title>
</svelte:head>

<div class="sj-page">
	<HorseHeader horse={data.horse} locale={data.locale} current="rides" />
	{#key data.horse.id}
		<HorseRides horseId={data.horse.id} rides={data.rides} locale={data.locale} />
	{/key}
</div>

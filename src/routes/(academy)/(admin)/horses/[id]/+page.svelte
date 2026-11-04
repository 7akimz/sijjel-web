<script lang="ts">
	import { untrack } from 'svelte';
	import { page } from '$app/state';
	import HorseHeader from '#lib/components/HorseHeader.svelte';
	import HorseUnavailability from '#lib/components/HorseUnavailability.svelte';
	import SetupNext from '#lib/components/SetupNext.svelte';
	import type { Horse } from '#lib/api/academy-types.js';
	import { Banner } from '#lib/ui/index.js';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();

	let horse = $state<Horse>(untrack(() => data.horse));
	const notice = $derived(page.state.notice);
</script>

<svelte:head>
	<title>{horse.name}</title>
</svelte:head>

<div class="sj-page">
	<HorseHeader {horse} locale={data.locale} current="unavailable" />

	{#if notice}<Banner icon="check_circle">{notice}</Banner>{/if}
	{#if data.setup}<SetupNext state={data.setup} current="horses" />{/if}

	<HorseUnavailability
		{horse}
		today={data.today}
		locale={data.locale}
		onchange={(updated) => (horse = updated)}
	/>
</div>

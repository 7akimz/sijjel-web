<script lang="ts">
	import { goto } from '$app/navigation';
	import { resolve } from '$app/paths';
	import HorseForm from '#lib/components/HorseForm.svelte';
	import SetupNext from '#lib/components/SetupNext.svelte';
	import { reveal } from '#lib/reveal.js';
	import type { Horse } from '#lib/api/academy-types.js';
	import { m } from '#lib/paraglide/messages.js';
	import { Banner, Card } from '#lib/ui/index.js';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();

	let added = $state<string>();
	let saves = $state(0);
	let formKey = $state(0);

	// During setup the owner stays here to add the next horse or move on; otherwise the new horse's page opens.
	function onSaved(horse: Horse) {
		if (!data.setup) return goto(resolve('/(academy)/(admin)/horses/[id]', { id: horse.id }));
		added = horse.name;
		saves++;
		formKey++;
	}
</script>

<svelte:head>
	<title>{m.horse_new()}</title>
</svelte:head>

<div class="sj-page">
	<h1 class="sj-title">{m.horse_new()}</h1>
	{#if added}
		<div class="sj-stack" use:reveal={saves}>
			<Banner icon="check_circle">{m.horse_added({ name: added })}</Banner>
			{#if data.setup}<SetupNext state={data.setup} current="horses" />{/if}
		</div>
	{/if}
	<Card raised>
		{#key formKey}
			<HorseForm disciplines={data.disciplines} locale={data.locale} onsaved={onSaved} />
		{/key}
	</Card>
</div>

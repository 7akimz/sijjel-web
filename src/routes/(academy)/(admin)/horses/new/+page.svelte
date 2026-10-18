<script lang="ts">
	import { goto } from '$app/navigation';
	import { resolve } from '$app/paths';
	import HorseForm from '#lib/components/HorseForm.svelte';
	import type { Horse } from '#lib/api/academy-types.js';
	import { m } from '#lib/paraglide/messages.js';
	import { Card } from '#lib/ui/index.js';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();

	const onSaved = (horse: Horse) =>
		goto(resolve('/(academy)/(admin)/horses/[id]', { id: horse.id }));
</script>

<svelte:head>
	<title>{m.horse_new()}</title>
</svelte:head>

<div class="sj-page">
	<h1 class="sj-title">{m.horse_new()}</h1>
	<Card raised>
		<HorseForm disciplines={data.disciplines} locale={data.locale} onsaved={onSaved} />
	</Card>
</div>

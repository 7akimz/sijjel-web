<script lang="ts">
	import { resolve } from '$app/paths';
	import { goto } from '$app/navigation';
	import HorseForm from '#lib/components/HorseForm.svelte';
	import { m } from '#lib/paraglide/messages.js';
	import { Button, Card } from '#lib/ui/index.js';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();

	const profile = $derived(resolve('/(academy)/(admin)/horses/[id]', { id: data.horse.id }));
</script>

<svelte:head>
	<title>{m.horse_edit_title({ name: data.horse.name })}</title>
</svelte:head>

<div class="sj-page">
	<div>
		<Button variant="quiet" icon="arrow_back" href={profile}>{data.horse.name}</Button>
	</div>
	<h1 class="sj-title">{m.horse_edit_title({ name: data.horse.name })}</h1>
	<Card>
		<HorseForm
			disciplines={data.disciplines}
			locale={data.locale}
			horse={data.horse}
			onsaved={() => goto(profile, { state: { notice: m.horse_saved() } })}
		/>
	</Card>
</div>

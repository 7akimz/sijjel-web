<script lang="ts">
	import { untrack } from 'svelte';
	import { resolve } from '$app/paths';
	import { page } from '$app/state';
	import HorseUnavailability from '#lib/components/HorseUnavailability.svelte';
	import SetupNext from '#lib/components/SetupNext.svelte';
	import type { Horse } from '#lib/api/academy-types.js';
	import { localName } from '#lib/academy.js';
	import { rangeLabel } from '#lib/forms/horse.js';
	import { m } from '#lib/paraglide/messages.js';
	import { Banner, Button, StatusChip } from '#lib/ui/index.js';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();

	let horse = $state<Horse>(untrack(() => data.horse));
	const notice = $derived(page.state.notice);
</script>

<svelte:head>
	<title>{horse.name}</title>
</svelte:head>

<div class="sj-page">
	<div>
		<Button variant="quiet" icon="arrow_back" href={resolve('/(academy)/(admin)/horses')}>
			{m.horse_back()}
		</Button>
	</div>

	<header class="head">
		<div class="who">
			<h1 class="sj-title">{horse.name}</h1>
			<div class="sj-row">
				<StatusChip tone="level">{localName(horse.discipline, data.locale)}</StatusChip>
				<StatusChip tone="neutral">{rangeLabel(horse, data.locale)}</StatusChip>
				{#if horse.unavailableToday}
					<StatusChip tone="pending" dot>{m.horse_unavailable_today()}</StatusChip>
				{/if}
				{#if !horse.isActive}<StatusChip tone="stone">{m.horse_inactive()}</StatusChip>{/if}
			</div>
			<p class="sj-small sj-muted">
				{m.horses_sessions_per_day({ count: horse.maxSessionsPerDay })}
			</p>
			{#if horse.notes}<p class="sj-small"><bdi>{horse.notes}</bdi></p>{/if}
		</div>
		<Button
			variant="secondary"
			icon="edit"
			label={m.horse_edit()}
			href={resolve('/(academy)/(admin)/horses/[id]/edit', { id: horse.id })}
		/>
	</header>

	{#if notice}<Banner icon="check_circle">{notice}</Banner>{/if}
	{#if data.setup}<SetupNext state={data.setup} current="horses" />{/if}

	<HorseUnavailability
		{horse}
		today={data.today}
		locale={data.locale}
		onchange={(updated) => (horse = updated)}
	/>
</div>

<style>
	.head {
		display: flex;
		align-items: flex-start;
		justify-content: space-between;
		gap: var(--space-3);
	}
	.who {
		display: flex;
		flex-direction: column;
		gap: var(--space-2);
		min-width: 0;
	}
	.who p {
		margin: 0;
	}
</style>

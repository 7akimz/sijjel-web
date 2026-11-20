<script lang="ts">
	import { goto } from '$app/navigation';
	import { resolve } from '$app/paths';
	import { page } from '$app/state';
	import NewAcademyFlow from '#lib/components/NewAcademyFlow.svelte';
	import { m } from '#lib/paraglide/messages.js';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();

	function finish(id: string) {
		// The academy page shows the "is added" banner when it opens with added=1.
		// eslint-disable-next-line svelte/no-navigation-without-resolve
		goto(`${resolve('/(platform)/platform/academies/[id]', { id })}?added=1`);
	}
</script>

<svelte:head>
	<title>{m.academy_new()}</title>
</svelte:head>

<div class="sj-page">
	<NewAcademyFlow
		countries={data.countries}
		disciplines={data.disciplines}
		packages={data.packages}
		rootHost={page.url.host}
		locale={data.locale}
		onfinish={finish}
		oncancel={() => goto(resolve('/(platform)/platform/academies'))}
	/>
</div>

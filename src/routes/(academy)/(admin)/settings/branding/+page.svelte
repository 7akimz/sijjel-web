<script lang="ts">
	import { invalidateAll } from '$app/navigation';
	import BrandingForm from '#lib/components/BrandingForm.svelte';
	import { m } from '#lib/paraglide/messages.js';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();
</script>

<svelte:head>
	<title>{m.branding_title()}</title>
</svelte:head>

<div class="sj-page">
	<h1 class="sj-title">{m.branding_title()}</h1>
	<BrandingForm branding={data.branding} onsaved={() => invalidateAll()} />
</div>

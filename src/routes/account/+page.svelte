<script lang="ts">
	import { goto, invalidateAll } from '$app/navigation';
	import { resolve } from '$app/paths';
	import AccountForm from '#lib/components/AccountForm.svelte';
	import { m } from '#lib/paraglide/messages.js';
	import { Banner, Card } from '#lib/ui/index.js';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();

	async function saved() {
		await invalidateAll();
		if (data.addPhone) await goto(resolve('/'), { replaceState: true });
	}
</script>

<svelte:head>
	<title>{m.account_title()}</title>
</svelte:head>

<div class="sj-page account sj-stack">
	<h1 class="sj-title">{m.account_title()}</h1>
	{#if data.addPhone}<Banner icon="info">{m.account_add_phone()}</Banner>{/if}
	<Card>
		<AccountForm me={data.user} onsaved={saved} />
	</Card>
</div>

<style>
	.account {
		max-inline-size: 480px;
	}
</style>

<script lang="ts">
	import { resolve } from '$app/paths';
	import { m } from '#lib/paraglide/messages.js';
	import { Button, EmptyState } from '#lib/ui/index.js';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();
</script>

<svelte:head>
	<title>{m.app_name()}</title>
</svelte:head>

<div class="sj-page">
	<h1 class="sj-title">{m.platform_home_title()}</h1>
	{#if data.user}
		<EmptyState icon="link" title={data.user.displayName}>{m.platform_home_member()}</EmptyState>
	{:else}
		<EmptyState icon="login" title={m.platform_home_signed_out()}>
			{#snippet action()}
				<Button href={resolve('/login')}>{m.action_sign_in()}</Button>
			{/snippet}
		</EmptyState>
	{/if}
</div>

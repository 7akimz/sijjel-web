<script lang="ts">
	import { resolve } from '$app/paths';
	import { page } from '$app/state';
	import StatusPage from '#lib/components/StatusPage.svelte';
	import { m } from '#lib/paraglide/messages.js';
	import { Button, EmptyState } from '#lib/ui/index.js';
</script>

<svelte:head>
	{#if page.status === 404}<title>{m.invite_invalid_title()}</title>{/if}
</svelte:head>

{#if page.status === 404}
	<div class="sj-page">
		<EmptyState icon="link_off" title={m.invite_invalid_title()}>
			{m.invite_invalid_body()}
			{#snippet action()}
				<Button variant="secondary" href={resolve('/')}>{m.nav_home()}</Button>
			{/snippet}
		</EmptyState>
	</div>
{:else}
	<StatusPage
		icon="cloud_off"
		title={m.status_unavailable_title()}
		body={m.status_unavailable_body()}
	/>
{/if}

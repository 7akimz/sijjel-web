<script lang="ts">
	import { page } from '$app/state';
	import StatusPage from '#lib/components/StatusPage.svelte';
	import { m } from '#lib/paraglide/messages.js';

	const locale = $derived(page.data.locale ?? 'en');
	const forbidden = $derived(page.status === 403);
	const missing = $derived(page.status === 404);
</script>

{#if forbidden}
	<StatusPage
		icon="lock"
		title={m.status_forbidden_title({}, { locale })}
		body={m.status_forbidden_body({}, { locale })}
	/>
{:else if missing}
	<StatusPage
		icon="travel_explore"
		title={m.status_not_found_title({}, { locale })}
		body={m.status_not_found_body({}, { locale })}
	/>
{:else}
	<StatusPage
		icon="error"
		title={m.status_error_title({}, { locale })}
		body={m.error_internal_error({}, { locale })}
	/>
{/if}

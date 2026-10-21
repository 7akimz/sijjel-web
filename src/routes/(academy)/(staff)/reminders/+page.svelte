<script lang="ts">
	import RemindersPanel from '#lib/components/RemindersPanel.svelte';
	import { m } from '#lib/paraglide/messages.js';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();
</script>

<svelte:head>
	<title>{m.reminders_title()}</title>
</svelte:head>

<div class="sj-page">
	<div class="sj-page-head">
		<h1 class="sj-title">{m.reminders_title()}</h1>
	</div>
	<RemindersPanel publicKey={data.publicKey} locale={data.locale} />
</div>

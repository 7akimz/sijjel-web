<script lang="ts">
	import { api } from '#lib/api/client.js';
	import { ApiError, errorText } from '#lib/api/errors.js';
	import type { CreatedAcademyInvite } from '#lib/api/member-types.js';
	import type { Locale } from '#lib/api/types.js';
	import InviteShareCard from '#lib/components/InviteShareCard.svelte';
	import { m } from '#lib/paraglide/messages.js';
	import { Banner, Button } from '#lib/ui/index.js';

	type Props = {
		memberId: string;
		name: string;
		/** The academy's name in the language the message is shared in. */
		academy: string;
		shareLocale: Locale;
		locale: Locale;
	};
	let { memberId, name, academy, shareLocale, locale }: Props = $props();

	let invite = $state<CreatedAcademyInvite>();
	let busy = $state(false);
	let failure = $state<string>();

	async function makeInvite() {
		busy = true;
		failure = undefined;
		try {
			invite = await api<CreatedAcademyInvite>(`/academy/members/${memberId}/invite`, {
				method: 'POST'
			});
		} catch (e) {
			failure = errorText(e instanceof ApiError ? e.code : 'internal_error');
		} finally {
			busy = false;
		}
	}
</script>

<section class="sj-stack">
	<h2 class="sj-heading">{m.member_account_title({}, { locale })}</h2>
	{#if failure}<Banner tone="danger" icon="error">{failure}</Banner>{/if}
	{#if invite}
		<InviteShareCard
			{invite}
			{name}
			message={m.member_invite_share({ name, academy }, { locale: shareLocale })}
			phone={invite.phone}
			{locale}
		/>
	{:else}
		<p class="sj-muted">
			<strong>{m.member_no_account_lead({ name }, { locale })}</strong>
			<span>{m.member_no_account_body({ name }, { locale })}</span>
		</p>
		<div>
			<Button variant="secondary" icon="link" disabled={busy} onclick={makeInvite}
				>{m.member_send_invite({}, { locale })}</Button
			>
		</div>
	{/if}
</section>

<style>
	p {
		margin: 0;
	}
	strong {
		display: block;
		color: var(--ink);
	}
</style>

<script lang="ts">
	import { onMount } from 'svelte';
	import QRCode from 'qrcode';
	import InviteLink from '#lib/components/InviteLink.svelte';
	import type { CreatedAcademyInvite } from '#lib/api/member-types.js';
	import type { Locale } from '#lib/api/types.js';
	import { formatDate } from '#lib/format.js';
	import { m } from '#lib/paraglide/messages.js';
	import { whatsappLink } from '#lib/share.js';
	import { Banner } from '#lib/ui/index.js';

	type Props = {
		invite: CreatedAcademyInvite;
		name: string;
		message: string;
		phone: string | null;
		locale: Locale;
	};
	let { invite, name, message, phone, locale }: Props = $props();

	let qr = $state('');
	const whatsapp = $derived(whatsappLink(invite.url, message, phone));

	onMount(async () => {
		qr = await QRCode.toString(invite.url, { type: 'svg', margin: 1 });
	});
</script>

<div class="sj-stack">
	<Banner icon="check_circle">
		<strong>{m.invite_ready()}</strong>
		{m.invite_ready_body({ name, date: formatDate(invite.expiresAt, locale) })}
	</Banner>
	<!-- wa.me is an external WhatsApp address, not a route of this app. -->
	<!-- eslint-disable svelte/no-navigation-without-resolve -->
	<a
		class="sj-btn sj-btn--primary whatsapp"
		href={whatsapp}
		target="_blank"
		rel="noopener noreferrer"
	>
		<span class="sj-icon sj-icon--sm" aria-hidden="true">chat</span>{m.invite_whatsapp()}
	</a>
	<!-- eslint-enable svelte/no-navigation-without-resolve -->
	<InviteLink {invite} {locale} />
	{#if qr}
		<figure class="qr">
			<!-- The SVG comes from the qrcode library, generated here from the invitation URL. -->
			<!-- eslint-disable-next-line svelte/no-at-html-tags -->
			<div class="code" role="img" aria-label={m.invite_qr()}>{@html qr}</div>
			<figcaption class="sj-small sj-muted">{m.invite_qr()}</figcaption>
		</figure>
	{/if}
</div>

<style>
	.whatsapp {
		align-self: flex-start;
	}
	.qr {
		margin: 0;
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: var(--space-2);
	}
	.code {
		inline-size: 200px;
		padding: var(--space-2);
		background: var(--qr-ground);
		border-radius: var(--radius-sm);
	}
	.code :global(svg) {
		display: block;
		inline-size: 100%;
		block-size: auto;
	}
</style>

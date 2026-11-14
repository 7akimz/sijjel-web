<script lang="ts">
	import { untrack } from 'svelte';
	import InviteShareCard from '#lib/components/InviteShareCard.svelte';
	import OwnerInviteForm from '#lib/components/OwnerInviteForm.svelte';
	import { academyName } from '#lib/academy.js';
	import { api } from '#lib/api/client.js';
	import { ApiError, errorText } from '#lib/api/errors.js';
	import type { AcademySummary, CreatedInvite, Locale, OwnerStatus } from '#lib/api/types.js';
	import { formatDayMonth } from '#lib/format.js';
	import { ownerChip, pendingOwner, sentText } from '#lib/forms/owner-status.js';
	import { m } from '#lib/paraglide/messages.js';
	import { Banner, Button, Card, StatusChip } from '#lib/ui/index.js';

	type Props = { academy: AcademySummary; now: Date; locale: Locale };
	let { academy, now, locale }: Props = $props();

	let owner = $state<OwnerStatus>(untrack(() => academy.owner));
	let shared = $state<{ invite: CreatedInvite; name: string; renewed: boolean }>();
	let inviting = $state(false);
	let busy = $state(false);
	let failure = $state<string>();
	let notice = $state<string>();

	const chip = $derived(ownerChip(owner, now, locale));
	const name = $derived(academyName(academy, locale));
	const waiting = $derived(owner.state === 'pending' || owner.state === 'expired');

	const toError = (e: unknown) =>
		errorText(e instanceof ApiError ? e.code : 'internal_error', locale);

	async function sendAgain() {
		if (!owner.inviteId) return;
		failure = notice = undefined;
		busy = true;
		try {
			const invite = await api<CreatedInvite>(`/platform/invites/${owner.inviteId}/renew`, {
				method: 'POST'
			});
			shared = { invite, name: owner.name ?? '', renewed: true };
			owner = pendingOwner(invite, owner.name, now);
		} catch (e) {
			failure = toError(e);
		} finally {
			busy = false;
		}
	}

	async function cancel() {
		if (!owner.inviteId) return;
		failure = notice = undefined;
		busy = true;
		try {
			await api(`/platform/invites/${owner.inviteId}/revoke`, { method: 'POST' });
			owner = {
				...owner,
				state: 'none',
				inviteId: null,
				sentAt: null,
				expiresAt: null,
				name: null
			};
			shared = undefined;
			notice = m.invite_cancelled({}, { locale });
		} catch (e) {
			failure = toError(e);
		} finally {
			busy = false;
		}
	}

	function onInvited(invite: CreatedInvite, invitedName: string) {
		inviting = false;
		shared = { invite, name: invitedName, renewed: false };
		if (owner.state !== 'joined') owner = pendingOwner(invite, invitedName || null, now);
	}
</script>

<Card>
	<div class="sj-stack">
		<h2 class="sj-heading">{m.owner_title({}, { locale })}</h2>
		{#if failure}<Banner tone="danger" icon="error">{failure}</Banner>{/if}
		{#if notice}<Banner icon="check_circle">{notice}</Banner>{/if}

		{#if shared}
			<InviteShareCard
				invite={shared.invite}
				name={shared.name}
				message={m.invite_share_message_owner({ name: shared.name, academy: name }, { locale })}
				phone={shared.invite.phone}
				renewed={shared.renewed}
				{locale}
			/>
		{:else}
			<div class="sj-row">
				<StatusChip tone={chip.tone} dot>{chip.text}</StatusChip>
			</div>
			{#if waiting}
				<dl class="facts">
					{#if owner.name}
						<dt>{m.owner_invited({}, { locale })}</dt>
						<dd><bdi>{owner.name}</bdi></dd>
					{/if}
					{#if owner.sentAt}
						<dt>{m.owner_sent({}, { locale })}</dt>
						<dd>{sentText(owner.sentAt, now, locale)}</dd>
					{/if}
					{#if owner.expiresAt}
						<dt>
							{owner.state === 'expired'
								? m.owner_expired_on({}, { locale })
								: m.owner_link_until({}, { locale })}
						</dt>
						<dd>{formatDayMonth(owner.expiresAt, locale)}</dd>
					{/if}
				</dl>
			{:else if owner.state === 'joined' && owner.joinedAt}
				<p class="sj-muted">
					{m.owner_joined_on({ date: formatDayMonth(owner.joinedAt, locale) }, { locale })}
				</p>
			{/if}
		{/if}

		{#if inviting}
			<OwnerInviteForm
				academyId={academy.id}
				oncreated={(invite, form) => onInvited(invite, form.name.trim())}
				oncancel={() => (inviting = false)}
			/>
		{:else if waiting && !shared}
			<div class="sj-row">
				<Button variant="secondary" icon="send" disabled={busy} onclick={sendAgain}>
					{m.owner_send_again({}, { locale })}
				</Button>
				{#if owner.state === 'pending'}
					<Button variant="quiet" disabled={busy} onclick={cancel}>
						{m.owner_cancel_invite({}, { locale })}
					</Button>
				{/if}
			</div>
		{:else if owner.state === 'none' || owner.state === 'joined'}
			<div class="sj-row">
				<Button
					variant={owner.state === 'joined' ? 'quiet' : 'secondary'}
					icon="person_add"
					onclick={() => ((inviting = true), (shared = undefined), (notice = undefined))}
				>
					{m.academy_invite_owner({}, { locale })}
				</Button>
			</div>
		{/if}
	</div>
</Card>

<style>
	.facts {
		margin: 0;
		display: grid;
		grid-template-columns: max-content 1fr;
		gap: var(--space-1) var(--space-4);
	}
	dt {
		color: var(--ink-muted);
	}
	dd {
		margin: 0;
	}
</style>

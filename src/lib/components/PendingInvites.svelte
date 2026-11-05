<script lang="ts">
	import { untrack } from 'svelte';
	import InviteShareCard from '#lib/components/InviteShareCard.svelte';
	import { roleName } from '#lib/academy.js';
	import { api } from '#lib/api/client.js';
	import { ApiError, errorText } from '#lib/api/errors.js';
	import type { CreatedAcademyInvite, PendingInvite } from '#lib/api/member-types.js';
	import type { Locale } from '#lib/api/types.js';
	import { formatDate } from '#lib/format.js';
	import { m } from '#lib/paraglide/messages.js';
	import { Button, Card } from '#lib/ui/index.js';

	type Props = {
		invites: PendingInvite[];
		/** Name each invite's role; a list of one kind leaves it out. */
		showRole: boolean;
		/** The academy's name in the language its share messages are written in. */
		shareName: string;
		shareLocale: Locale;
		locale: Locale;
		onnotice: (text: string) => void;
		onfailure: (text: string) => void;
	};
	let { invites, showRole, shareName, shareLocale, locale, onnotice, onfailure }: Props = $props();

	let pending = $state<PendingInvite[]>(untrack(() => invites));
	let renewed = $state<{ id: string; invite: CreatedAcademyInvite }>();

	function shareMessage(invite: PendingInvite) {
		const values = { name: invite.name ?? '', academy: shareName };
		return invite.role === 'rider'
			? m.invite_share_message_rider(values, { locale: shareLocale })
			: m.invite_share_message_staff(values, { locale: shareLocale });
	}

	const toError = (e: unknown) => errorText(e instanceof ApiError ? e.code : 'internal_error');

	async function renew(invite: PendingInvite) {
		try {
			const created = await api<CreatedAcademyInvite>(`/academy/invites/${invite.id}/renew`, {
				method: 'POST'
			});
			pending = pending.map((p) =>
				p.id === invite.id ? { ...p, id: created.inviteId, expiresAt: created.expiresAt } : p
			);
			renewed = { id: created.inviteId, invite: created };
		} catch (e) {
			onfailure(toError(e));
		}
	}

	async function cancel(invite: PendingInvite) {
		try {
			await api(`/academy/invites/${invite.id}/revoke`, { method: 'POST' });
			pending = pending.filter((p) => p.id !== invite.id);
			onnotice(m.invite_cancelled({}, { locale }));
		} catch (e) {
			onfailure(toError(e));
		}
	}
</script>

{#if pending.length > 0}
	<Card>
		<h2 class="sj-heading">{m.members_pending({}, { locale })}</h2>
		<ul class="pending" role="list">
			{#each pending as invite (invite.id)}
				{@const expires = m.members_pending_expires(
					{ date: formatDate(invite.expiresAt, locale) },
					{ locale }
				)}
				<li>
					<div class="row">
						<div class="main">
							<span class="name"><bdi>{invite.name ?? '—'}</bdi></span>
							<span class="sj-small sj-muted">
								{showRole ? `${roleName(invite.role, locale)} · ${expires}` : expires}
							</span>
						</div>
						<div class="actions">
							<Button variant="quiet" icon="link" onclick={() => renew(invite)}>
								{m.members_copy_again({}, { locale })}
							</Button>
							<Button
								variant="quiet"
								icon="close"
								label={m.members_cancel_invite({}, { locale })}
								onclick={() => cancel(invite)}
							/>
						</div>
					</div>
					{#if renewed?.id === invite.id}
						<InviteShareCard
							invite={renewed.invite}
							name={invite.name ?? ''}
							message={shareMessage(invite)}
							phone={invite.phone}
							{locale}
						/>
					{/if}
				</li>
			{/each}
		</ul>
	</Card>
{/if}

<style>
	ul {
		margin: 0;
		padding: 0;
		list-style: none;
	}
	li {
		display: flex;
		flex-direction: column;
		gap: var(--space-2);
		padding-block: var(--space-2);
	}
	li + li {
		border-block-start: 1px solid var(--line);
	}
	.row {
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		gap: var(--space-2);
	}
	.main {
		flex: 1 1 12rem;
		display: flex;
		flex-direction: column;
		gap: var(--space-1);
		min-inline-size: 0;
	}
	.actions {
		display: flex;
		align-items: center;
		gap: var(--space-2);
	}
	.name {
		font-weight: 600;
	}
</style>

<script lang="ts">
	import { resolve } from '$app/paths';
	import { page } from '$app/state';
	import { academyMark, academyName, localName } from '#lib/academy.js';
	import InviteShareCard from '#lib/components/InviteShareCard.svelte';
	import OwnerInviteForm from '#lib/components/OwnerInviteForm.svelte';
	import { api } from '#lib/api/client.js';
	import { ApiError, errorText } from '#lib/api/errors.js';
	import type { AcademySummary, CreatedInvite, OwnerStatus } from '#lib/api/types.js';
	import { formatDayMonth } from '#lib/format.js';
	import {
		ownerChip,
		ownerRowAction,
		pendingOwner,
		setupChip,
		showsSetup
	} from '#lib/forms/owner-status.js';
	import {
		matchesFilter,
		monthsText,
		ridersText,
		sortByUrgency,
		statusFilters,
		statusText,
		statusTone,
		type StatusFilter
	} from '#lib/forms/subscription.js';
	import { m } from '#lib/paraglide/messages.js';
	import { Banner, Button, EmptyState, ListRow, SelectField, StatusChip } from '#lib/ui/index.js';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();

	let invites = $state<Record<string, { invite: CreatedInvite; name: string; renewed: boolean }>>(
		{}
	);
	let owners = $state<Record<string, OwnerStatus>>({});
	let sending = $state<string>();
	let failure = $state<string>();
	const now = new Date();
	let inviting = $state<string>();
	let filter = $state<StatusFilter>('all');

	const all = $derived(sortByUrgency(data.academies));
	const academies = $derived(all.filter((a) => matchesFilter(a, filter)));
	const filterOptions = $derived(
		statusFilters.map((f) => ({
			value: f,
			label:
				f === 'all'
					? m.subscription_filter_all()
					: f === 'blocked'
						? m.subscription_blocked()
						: statusText(f, data.locale)
		}))
	);
	const disciplineNames = $derived(
		new Map(
			data.disciplines.map((d) => [d.key, data.locale === 'ar' ? d.nameAr : d.nameEn] as const)
		)
	);

	const ownerOf = (a: AcademySummary) => owners[a.id] ?? a.owner;

	function onInvited(academy: AcademySummary, invite: CreatedInvite, name: string) {
		invites = { ...invites, [academy.id]: { invite, name, renewed: false } };
		owners = { ...owners, [academy.id]: pendingOwner(invite, name || null, now) };
		inviting = undefined;
	}

	async function sendAgain(academy: AcademySummary) {
		const owner = ownerOf(academy);
		if (!owner.inviteId) return;
		failure = undefined;
		sending = academy.id;
		try {
			const invite = await api<CreatedInvite>(`/platform/invites/${owner.inviteId}/renew`, {
				method: 'POST'
			});
			invites = { ...invites, [academy.id]: { invite, name: owner.name ?? '', renewed: true } };
			owners = { ...owners, [academy.id]: pendingOwner(invite, owner.name, now) };
		} catch (e) {
			failure = errorText(e instanceof ApiError ? e.code : 'internal_error');
		} finally {
			sending = undefined;
		}
	}
</script>

<svelte:head>
	<title>{m.academies_title()}</title>
</svelte:head>

<div class="sj-page">
	<div class="sj-page-head">
		<h1 class="sj-title">{m.academies_title()}</h1>
		<Button icon="add" href={resolve('/(platform)/platform/academies/new')}>
			{m.academy_new()}
		</Button>
	</div>

	{#if failure}<Banner tone="danger" icon="error">{failure}</Banner>{/if}

	{#if all.length > 0}
		<SelectField
			label={m.subscription_filter()}
			options={filterOptions}
			bind:value={() => filter, (v) => (filter = v as StatusFilter)}
		/>
	{/if}

	{#if all.length === 0}
		<EmptyState icon="domain" title={m.academies_empty_title()}>
			{m.academies_empty_body()}
		</EmptyState>
	{:else if academies.length === 0}
		<p class="sj-muted">{m.academies_filter_empty()}</p>
	{:else}
		<ul class="sj-list" role="list">
			{#each academies as academy (academy.id)}
				{@const name = academyName(academy, data.locale)}
				{@const owner = ownerOf(academy)}
				{@const chip = ownerChip(owner, now, data.locale)}
				{@const action = ownerRowAction(owner)}
				<li class="academy">
					<ListRow
						initials={academyMark(academy.nameEn)}
						title={name}
						subtitle="{academy.slug}.{page.url.host}"
						subtitleDir="ltr"
					>
						{#snippet trailing()}
							{#if action === 'send_again' && !invites[academy.id]}
								<Button
									variant="secondary"
									icon="send"
									disabled={sending === academy.id}
									onclick={() => sendAgain(academy)}
								>
									{m.owner_send_again()}
								</Button>
							{:else if action === 'invite'}
								<Button
									variant="secondary"
									icon="person_add"
									disabled={inviting === academy.id}
									onclick={() => (inviting = academy.id)}
								>
									{m.academy_invite_owner()}
								</Button>
							{/if}
						{/snippet}
					</ListRow>
					<div class="details sj-stack">
						<div class="sj-row">
							{#each academy.disciplines as key (key)}
								<StatusChip tone="level">{disciplineNames.get(key) ?? key}</StatusChip>
							{/each}
							<StatusChip tone={chip.tone} dot>{chip.text}</StatusChip>
							{#if showsSetup(owner)}
								<StatusChip tone="neutral">{setupChip(academy.setup, data.locale)}</StatusChip>
							{/if}
						</div>
						<div class="sj-row">
							{#if academy.package}
								<StatusChip tone="neutral">{localName(academy.package, data.locale)}</StatusChip>
							{/if}
							<StatusChip tone={statusTone(academy.status, false)}>
								{statusText(academy.status, data.locale)}
							</StatusChip>
							{#if academy.blocked}<StatusChip tone="danger">{m.subscription_blocked()}</StatusChip
								>{/if}
							<span class="sj-small sj-muted">{ridersText(academy.riders, data.locale)}</span>
						</div>
						{#if academy.monthsUnpaid > 0}
							<span class="sj-small">
								{m.subscription_unpaid_months({
									months: monthsText(academy.monthsUnpaid, data.locale)
								})}
							</span>
						{:else if academy.paidUntil}
							<span class="sj-small sj-muted">
								{m.subscription_paid_until({
									date: formatDayMonth(academy.paidUntil, data.locale)
								})}
							</span>
						{/if}
						<a
							class="sj-small"
							href={resolve('/(platform)/platform/academies/[id]', { id: academy.id })}
							aria-label={m.subscription_for({ name })}
						>
							{m.subscription_title()}
						</a>
						{#if inviting === academy.id}
							<OwnerInviteForm
								academyId={academy.id}
								oncreated={(invite, form) => onInvited(academy, invite, form.name.trim())}
								oncancel={() => (inviting = undefined)}
							/>
						{:else if invites[academy.id]}
							{@const sent = invites[academy.id]}
							<InviteShareCard
								invite={sent.invite}
								name={sent.name}
								message={m.invite_share_message_owner({ name: sent.name, academy: name })}
								phone={sent.invite.phone}
								renewed={sent.renewed}
								locale={data.locale}
							/>
						{/if}
					</div>
				</li>
			{/each}
		</ul>
	{/if}
</div>

<style>
	ul {
		margin: 0;
		padding: 0;
		list-style: none;
	}
	.academy + .academy {
		border-block-start: 1px solid var(--line);
	}
	.details {
		padding: 0 var(--space-4) var(--space-4);
		padding-inline-start: calc(var(--space-4) + 40px + var(--space-3));
	}
</style>

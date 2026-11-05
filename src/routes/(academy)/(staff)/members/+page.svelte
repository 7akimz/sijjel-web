<script lang="ts">
	import WhatsAppIcon from '#lib/components/WhatsAppIcon.svelte';
	import { resolve } from '$app/paths';
	import PendingInvites from '#lib/components/PendingInvites.svelte';
	import { inactiveLabel } from '#lib/forms/member.js';
	import { academyMark, academyName, localName } from '#lib/academy.js';
	import { ridersText } from '#lib/forms/subscription.js';
	import { m } from '#lib/paraglide/messages.js';
	import { Banner, Button, EmptyState, StatusChip } from '#lib/ui/index.js';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();

	let notice = $state<string>();
	let failure = $state<string>();

	const filters = $derived([
		{ id: null, label: m.members_filter_all(), href: resolve('/(academy)/(staff)/members') },
		{
			id: 'unpaid',
			label: m.members_filter_unpaid(),
			href: resolve('/(academy)/(staff)/members?filter=unpaid')
		}
	]);

	const academy = $derived(data.tenant.kind === 'academy' ? data.tenant.academy : null);
	const shareLocale = $derived(academy?.defaultLanguage ?? data.locale);
</script>

<svelte:head>
	<title>{m.members_title()}</title>
</svelte:head>

<div class="sj-page">
	<div class="sj-page-head">
		<div class="sj-stack">
			<h1 class="sj-title">{m.members_title()}</h1>
			<p class="sj-muted">{m.members_intro()}</p>
			{#if data.riders}<p class="sj-small">{ridersText(data.riders, data.locale)}</p>{/if}
		</div>
		{#if data.admin}
			<Button icon="person_add" href={resolve('/(academy)/(admin)/members/invite')}>
				{m.members_invite()}
			</Button>
		{/if}
	</div>

	{#if notice}<Banner icon="check_circle">{notice}</Banner>{/if}
	{#if failure}<Banner tone="danger" icon="error">{failure}</Banner>{/if}

	{#if data.admin}
		<PendingInvites
			invites={data.pending}
			showRole={false}
			shareName={academy ? academyName(academy, shareLocale) : ''}
			{shareLocale}
			locale={data.locale}
			onnotice={(text) => ((notice = text), (failure = undefined))}
			onfailure={(text) => ((failure = text), (notice = undefined))}
		/>
	{/if}

	{#if data.admin}
		<nav class="sj-row" aria-label={m.members_title()}>
			{#each filters as filter (filter.id)}
				<a
					class="filter"
					href={filter.href}
					aria-current={data.filter === filter.id ? 'page' : undefined}
				>
					{filter.label}
				</a>
			{/each}
		</nav>
	{/if}

	{#if data.members.length === 0}
		<EmptyState icon="group" title={m.members_empty_title()}>{m.members_empty_body()}</EmptyState>
	{:else}
		<ul class="sj-list" role="list">
			{#each data.members as member (member.id)}
				<li class="member-row">
					<a class="member" href={resolve('/(academy)/(staff)/members/[id]', { id: member.id })}>
						<span class="sj-avatar" aria-hidden="true">{academyMark(member.displayName)}</span>
						<span class="main">
							<span class="name">{member.displayName}</span>
							<span class="sj-row chips">
								{#if member.level && member.discipline}
									<StatusChip tone="level">
										{localName(member.discipline, data.locale)} · {localName(
											member.level,
											data.locale
										)}
									</StatusChip>
								{/if}
								{#if member.plan}
									<StatusChip tone="neutral">{localName(member.plan, data.locale)}</StatusChip>
								{/if}
								{#if member.paidThisMonth === false}
									<StatusChip tone="pending" dot>{m.member_unpaid()}</StatusChip>
								{/if}
								{#if inactiveLabel(member.status)}
									<StatusChip tone="stone">{inactiveLabel(member.status)}</StatusChip>
								{/if}
							</span>
						</span>
					</a>
					{#if member.phone}
						<!-- wa.me is an external WhatsApp address, not a route of this app. -->
						<!-- eslint-disable svelte/no-navigation-without-resolve -->
						<a
							class="sj-btn sj-btn--quiet whatsapp"
							href="https://wa.me/{member.phone}"
							target="_blank"
							rel="noopener noreferrer"
							aria-label={m.member_whatsapp_to({ name: member.displayName })}
						>
							<WhatsAppIcon />
						</a>
						<!-- eslint-enable svelte/no-navigation-without-resolve -->
					{/if}
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
	.sj-list li + li {
		border-block-start: 1px solid var(--line);
	}
	.member-row {
		display: flex;
		align-items: center;
	}
	.whatsapp {
		margin-inline-end: var(--space-3);
	}
	.member {
		flex: 1;
		min-inline-size: 0;
		display: flex;
		align-items: flex-start;
		gap: var(--space-3);
		padding: var(--space-3) var(--space-4);
		color: inherit;
		text-decoration: none;
	}
	.member:hover {
		background: var(--hover-veil);
	}
	.main {
		flex: 1;
		display: flex;
		flex-direction: column;
		gap: var(--space-1);
		min-inline-size: 0;
	}
	.name {
		font-weight: 600;
	}
	.filter {
		display: inline-flex;
		align-items: center;
		min-block-size: 44px;
		padding-inline: var(--space-4);
		border: 1px solid var(--line-strong);
		border-radius: 999px;
		color: inherit;
		text-decoration: none;
	}
	.filter[aria-current='page'] {
		background: var(--accent-soft);
		color: var(--on-accent-soft);
		border-color: transparent;
		font-weight: 600;
	}
</style>

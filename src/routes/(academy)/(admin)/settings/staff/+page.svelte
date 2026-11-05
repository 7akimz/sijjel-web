<script lang="ts">
	import { resolve } from '$app/paths';
	import PendingInvites from '#lib/components/PendingInvites.svelte';
	import WhatsAppIcon from '#lib/components/WhatsAppIcon.svelte';
	import { academyMark, academyName, roleName } from '#lib/academy.js';
	import { inactiveLabel } from '#lib/forms/member.js';
	import { m } from '#lib/paraglide/messages.js';
	import { Banner, Button, StatusChip } from '#lib/ui/index.js';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();

	let notice = $state<string>();
	let failure = $state<string>();

	const academy = $derived(data.tenant.kind === 'academy' ? data.tenant.academy : null);
	const shareLocale = $derived(academy?.defaultLanguage ?? data.locale);
	const staffRoles = ['admin', 'trainer'] as const;
</script>

<svelte:head>
	<title>{m.staff_title()}</title>
</svelte:head>

<div class="sj-page">
	<div>
		<Button variant="quiet" icon="arrow_back" href={resolve('/(academy)/(admin)/settings')}>
			{m.settings_title()}
		</Button>
	</div>

	<div class="sj-page-head">
		<div class="sj-stack">
			<h1 class="sj-title">{m.staff_title()}</h1>
			<p class="sj-muted">{m.staff_intro()}</p>
		</div>
		<Button icon="person_add" href={resolve('/(academy)/(admin)/members/invite?role=staff')}>
			{m.staff_invite()}
		</Button>
	</div>

	{#if notice}<Banner icon="check_circle">{notice}</Banner>{/if}
	{#if failure}<Banner tone="danger" icon="error">{failure}</Banner>{/if}

	<PendingInvites
		invites={data.pending}
		showRole={true}
		shareName={academy ? academyName(academy, shareLocale) : ''}
		{shareLocale}
		locale={data.locale}
		onnotice={(text) => ((notice = text), (failure = undefined))}
		onfailure={(text) => ((failure = text), (notice = undefined))}
	/>

	<ul class="sj-list" role="list">
		{#each data.staff as member (member.id)}
			<li class="member-row">
				<a
					class="member"
					href={resolve('/(academy)/(admin)/settings/staff/[id]', { id: member.id })}
				>
					<span class="sj-avatar" aria-hidden="true">{academyMark(member.displayName)}</span>
					<span class="main">
						<span class="name"><bdi>{member.displayName}</bdi></span>
						<span class="sj-row chips">
							{#each staffRoles.filter((role) => member.roles.includes(role)) as role (role)}
								<StatusChip tone="neutral">{roleName(role, data.locale)}</StatusChip>
							{/each}
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
</div>

<style>
	ul {
		margin: 0;
		padding: 0;
		list-style: none;
	}
	li + li {
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
</style>

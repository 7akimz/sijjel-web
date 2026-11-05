<script lang="ts">
	import { untrack } from 'svelte';
	import { resolve } from '$app/paths';
	import { page } from '$app/state';
	import AffectedBookings from '#lib/components/AffectedBookings.svelte';
	import WhatsAppIcon from '#lib/components/WhatsAppIcon.svelte';
	import { roleName } from '#lib/academy.js';
	import { api } from '#lib/api/client.js';
	import { ApiError, errorText } from '#lib/api/errors.js';
	import type { AffectedBooking, Member } from '#lib/api/member-types.js';
	import { inactiveLabel } from '#lib/forms/member.js';
	import { m } from '#lib/paraglide/messages.js';
	import { Banner, Button, MoreMenu, StatusChip, type MoreMenuItem } from '#lib/ui/index.js';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();

	let member = $state<Member>(untrack(() => data.member));
	let notice = $state<string | undefined>(untrack(() => page.state.notice));
	let failure = $state<string>();
	let affected = $state<{ bookings: AffectedBooking[]; retry: () => void }>();

	const abilities = { admin: m.staff_can_admin, trainer: m.staff_can_trainer };
	const roles = $derived((['admin', 'trainer'] as const).filter((r) => member.roles.includes(r)));

	// Suspending and marking as left stop the member the same way; only the status differs.
	const deactivations = {
		suspend: { confirm: m.member_suspend_confirm, done: m.member_suspended_notice },
		leave: { confirm: m.member_left_confirm, done: m.member_left_notice }
	};
	let deactivating = $state<keyof typeof deactivations>('suspend');

	function clear() {
		notice = failure = undefined;
		affected = undefined;
	}

	async function deactivate(action: keyof typeof deactivations, confirm = false) {
		clear();
		deactivating = action;
		try {
			member = await api<Member>(`/academy/members/${member.id}/${action}`, {
				method: 'POST',
				body: { confirm }
			});
			notice = deactivations[action].done();
		} catch (e) {
			const error = e instanceof ApiError ? e : new ApiError(0, 'internal_error');
			if (error.code === 'bookings_affected') {
				affected = {
					bookings: (error.extra.bookings as AffectedBooking[]) ?? [],
					retry: () => deactivate(action, true)
				};
			} else failure = errorText(error.code);
		}
	}

	async function reactivate() {
		clear();
		try {
			member = await api<Member>(`/academy/members/${member.id}/reactivate`, { method: 'POST' });
			notice = m.member_reactivated();
		} catch (e) {
			failure = errorText(e instanceof ApiError ? e.code : 'internal_error');
		}
	}

	const moreItems = $derived<MoreMenuItem[]>(
		member.status === 'active'
			? [
					{ label: m.member_mark_left(), onselect: () => deactivate('leave') },
					{ label: m.member_suspend(), onselect: () => deactivate('suspend'), danger: true }
				]
			: [{ label: m.member_reactivate(), onselect: reactivate }]
	);
</script>

<svelte:head>
	<title>{member.displayName}</title>
</svelte:head>

<div class="sj-page">
	<div>
		<Button variant="quiet" icon="arrow_back" href={resolve('/(academy)/(admin)/settings/staff')}>
			{m.staff_back()}
		</Button>
	</div>

	<header class="head">
		<div class="who">
			<h1 class="sj-title"><bdi>{member.displayName}</bdi></h1>
			<div class="sj-row">
				{#each roles as role (role)}
					<StatusChip tone="neutral">{roleName(role, data.locale)}</StatusChip>
				{/each}
				{#if inactiveLabel(member.status)}
					<StatusChip tone="stone" dot>{inactiveLabel(member.status)}</StatusChip>
				{/if}
			</div>
		</div>
		<div class="tools">
			{#if member.phone}
				<!-- wa.me is an external WhatsApp address, not a route of this app. -->
				<!-- eslint-disable svelte/no-navigation-without-resolve -->
				<a
					class="sj-btn sj-btn--secondary sj-btn--icon"
					href="https://wa.me/{member.phone}"
					target="_blank"
					rel="noopener noreferrer"
					aria-label={m.member_whatsapp_to({ name: member.displayName })}
				>
					<WhatsAppIcon />
				</a>
				<!-- eslint-enable svelte/no-navigation-without-resolve -->
			{/if}
			<Button
				variant="secondary"
				icon="edit"
				label={m.member_edit()}
				href={resolve('/(academy)/(admin)/members/[id]/edit', { id: member.id })}
			/>
			<MoreMenu label={m.member_more()} items={moreItems} />
		</div>
	</header>

	{#if notice}<Banner icon="check_circle">{notice}</Banner>{/if}
	{#if failure}<Banner tone="danger" icon="error">{failure}</Banner>{/if}
	{#if affected}
		<AffectedBookings
			bookings={affected.bookings}
			locale={data.locale}
			confirmLabel={deactivations[deactivating].confirm()}
			onconfirm={affected.retry}
			oncancel={() => (affected = undefined)}
		/>
	{/if}

	<section class="sj-stack section">
		<h2 class="sj-heading">{m.staff_can()}</h2>
		<ul class="sj-list" role="list">
			{#each roles as role (role)}
				<li class="sj-list__row">
					<div class="sj-list__main">
						<span class="strong">{roleName(role, data.locale)}</span>
						<span class="sj-small sj-muted can">{abilities[role]()}</span>
					</div>
				</li>
			{/each}
		</ul>
	</section>
</div>

<style>
	.head {
		display: flex;
		align-items: flex-start;
		justify-content: space-between;
		gap: var(--space-3);
	}
	.who {
		display: flex;
		flex-direction: column;
		gap: var(--space-2);
		min-width: 0;
	}
	.tools {
		display: flex;
		align-items: center;
		gap: var(--space-2);
		flex-shrink: 0;
	}
	.section {
		gap: var(--space-2);
	}
	ul {
		margin: 0;
		padding: 0;
		list-style: none;
	}
	.strong {
		font-weight: 600;
	}
	.sj-list__main > .can {
		white-space: normal;
	}
</style>

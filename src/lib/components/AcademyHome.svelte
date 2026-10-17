<script lang="ts">
	import { localName, roleName } from '#lib/academy.js';
	import type { Locale, Membership } from '#lib/api/types.js';
	import { m } from '#lib/paraglide/messages.js';
	import { Card, EmptyState, StatusChip } from '#lib/ui/index.js';

	let { membership, locale }: { membership: Membership; locale: Locale } = $props();
</script>

<Card>
	<div class="sj-stack">
		<h2 class="sj-heading">{m.home_membership()}</h2>
		<div class="sj-row">
			{#each membership.roles as role (role)}
				<StatusChip tone="active">{roleName(role, locale)}</StatusChip>
			{/each}
			{#if membership.discipline}
				<StatusChip tone="level">{localName(membership.discipline, locale)}</StatusChip>
			{/if}
			{#if membership.level}
				<StatusChip tone="level">{localName(membership.level, locale)}</StatusChip>
			{/if}
			{#if membership.status === 'suspended'}
				<StatusChip tone="danger" dot>{m.membership_suspended()}</StatusChip>
			{:else}
				<StatusChip tone="active" dot>{m.membership_active()}</StatusChip>
			{/if}
		</div>
	</div>
</Card>

<EmptyState icon="event_upcoming" title={m.home_booking_soon_title()}>
	{m.home_booking_soon_body()}
</EmptyState>

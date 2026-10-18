<script lang="ts">
	import type { AffectedBooking } from '#lib/api/member-types.js';
	import type { Locale } from '#lib/api/types.js';
	import { formatDate } from '#lib/format.js';
	import { m } from '#lib/paraglide/messages.js';
	import { Button } from '#lib/ui/index.js';

	type Props = {
		bookings: AffectedBooking[];
		locale: Locale;
		body?: string;
		confirmLabel?: string;
		onconfirm?: () => void;
		oncancel: () => void;
	};
	let { bookings, locale, body, confirmLabel, onconfirm, oncancel }: Props = $props();
</script>

<div class="sj-banner sj-banner--pending affected" role="alert">
	<div class="sj-stack">
		<strong>{body ?? m.error_bookings_affected()}</strong>
		<ul role="list">
			{#each bookings as booking (booking.id)}
				<li dir="auto">
					{booking.riderName} · {formatDate(`${booking.date}T00:00:00Z`, locale)}
					<span dir="ltr">{booking.startTime}</span>
				</li>
			{/each}
		</ul>
		<div class="sj-row">
			{#if onconfirm && confirmLabel}
				<Button variant="danger" onclick={onconfirm}>{confirmLabel}</Button>
			{/if}
			<Button variant="quiet" onclick={oncancel}>{m.action_cancel()}</Button>
		</div>
	</div>
</div>

<style>
	ul {
		margin: 0;
		padding-inline-start: var(--space-4);
	}
</style>

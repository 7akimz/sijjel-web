<script lang="ts">
	import { localName } from '#lib/academy.js';
	import { api } from '#lib/api/client.js';
	import { ApiError, errorText } from '#lib/api/errors.js';
	import type { AcademySubscription } from '#lib/api/subscription-types.js';
	import type { Locale } from '#lib/api/types.js';
	import { formatDate } from '#lib/format.js';
	import { packageLimitText, packagePriceText, unpaidText } from '#lib/forms/academy-page.js';
	import { waitingText } from '#lib/forms/subscription.js';
	import { m } from '#lib/paraglide/messages.js';
	import { Banner, Button, Card, Icon } from '#lib/ui/index.js';

	type Props = {
		academyId: string;
		subscription: AcademySubscription;
		/** Where the package is chosen: the academy's Subscription tab. */
		subscriptionHref: string;
		locale: Locale;
		onchange: (s: AcademySubscription) => void;
	};
	let { academyId, subscription: sub, subscriptionHref, locale, onchange }: Props = $props();

	let busy = $state(false);
	let failure = $state<string>();

	async function startTrial() {
		busy = true;
		failure = undefined;
		try {
			onchange(
				await api<AcademySubscription>(`/platform/academies/${academyId}/trial/start`, {
					method: 'POST'
				})
			);
		} catch (e) {
			failure = errorText(e instanceof ApiError ? e.code : 'internal_error', locale);
		} finally {
			busy = false;
		}
	}
</script>

<Card>
	<div class="sj-stack">
		<h2 class="sj-heading">{m.subscription_package({}, { locale })}</h2>
		{#if failure}<Banner tone="danger" icon="error">{failure}</Banner>{/if}
		{#if sub.package}
			<div class="line">
				<span><strong>{localName(sub.package, locale)}</strong></span>
				<span class="sj-muted">{packageLimitText(sub.package, locale)}</span>
				<span class="sj-muted">{packagePriceText(sub.package, locale)}</span>
			</div>
			{#if sub.trialDaysWaiting}
				<p class="sj-muted">{waitingText(sub.trialDaysWaiting, locale)}</p>
				<div class="sj-row">
					<Button variant="secondary" icon="play_arrow" disabled={busy} onclick={startTrial}>
						{m.subscription_start_trial_now({}, { locale })}
					</Button>
				</div>
			{:else if sub.status === 'unpaid'}
				<p class="owed">
					<Icon name="error" size={20} />
					<span>{unpaidText(sub, locale)}</span>
				</p>
			{:else if sub.paidUntil}
				<p class="sj-muted">
					{m.subscription_paid_until({ date: formatDate(sub.paidUntil, locale) }, { locale })}
				</p>
			{/if}
		{:else}
			<p class="sj-muted">{m.subscription_no_package_yet({}, { locale })}</p>
			<div class="sj-row">
				<Button variant="secondary" icon="sell" href={subscriptionHref}>
					{m.subscription_choose_package({}, { locale })}
				</Button>
			</div>
		{/if}
	</div>
</Card>

<style>
	.line {
		display: flex;
		flex-wrap: wrap;
		gap: var(--space-1) var(--space-3);
	}
	.owed {
		display: flex;
		align-items: center;
		gap: var(--space-2);
		margin: 0;
		color: var(--danger);
		font-weight: 600;
	}
</style>

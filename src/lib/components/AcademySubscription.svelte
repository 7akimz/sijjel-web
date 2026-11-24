<script lang="ts">
	import { tick, untrack } from 'svelte';
	import { localName } from '#lib/academy.js';
	import { api } from '#lib/api/client.js';
	import { ApiError, errorText, fieldText, type FieldErrors } from '#lib/api/errors.js';
	import type { AcademySubscription, Package, PaymentMethod } from '#lib/api/subscription-types.js';
	import type { Locale } from '#lib/api/types.js';
	import {
		packageLimitText,
		packageOptionText,
		packagePriceText,
		unpaidText
	} from '#lib/forms/academy-page.js';
	import { wholeNumber } from '#lib/forms/booking-rules.js';
	import {
		entryText,
		waitingText,
		methodText,
		paymentMethods,
		riderCountText
	} from '#lib/forms/subscription.js';
	import { m } from '#lib/paraglide/messages.js';
	import { Banner, Button, Card, CheckboxField, SelectField, TextField } from '#lib/ui/index.js';

	type Section = 'package' | 'paid' | 'free' | 'entries' | 'block';
	type Props = {
		academyId: string;
		subscription: AcademySubscription;
		packages: Package[];
		/** The academy's country: only its packages can be given. */
		country: string;
		locale: Locale;
		onchange: (s: AcademySubscription) => void;
	};
	let { academyId, subscription, packages, country, locale, onchange }: Props = $props();

	let sub = $state(untrack(() => subscription));
	let packageId = $state(untrack(() => subscription.package?.id ?? ''));
	let freeDays = $state<string | number | null>(untrack(() => subscription.trialDaysWaiting ?? 30));
	let startAfterSetup = $state(true);
	let amount = $state<string | number | null>(
		untrack(() => subscription.package?.monthlyPrice ?? '')
	);
	let method = $state<PaymentMethod>('instapay');
	let paidNote = $state('');
	let fromToday = $state(false);
	let days = $state<string | number | null>('');
	let freeNote = $state('');
	let confirming = $state(false);
	let editing = $state(untrack(() => !subscription.package));
	let giving = $state(false);
	let busy = $state(false);
	let section = $state<Section>();
	let errors = $state<FieldErrors>({});
	let failure = $state<string>();
	let notice = $state<string>();
	let blockCard = $state<HTMLElement>();

	const packageOptions = $derived([
		...(sub.package ? [] : [{ value: '', label: '—' }]),
		...packages
			.filter((p) => p.id === sub.package?.id || (p.isActive && p.country === country))
			.map((p) => ({ value: p.id, label: packageOptionText(p, locale) }))
	]);
	const chosen = $derived(packages.find((p) => p.id === packageId));
	const overLimit = $derived(
		chosen?.maxRiders != null && sub.riders.count > chosen.maxRiders ? chosen.maxRiders : null
	);
	const methodOptions = paymentMethods.map((value) => ({ value, label: methodText(value) }));

	const shown = (at: Section) => (section === at ? errors : {});

	function start(at: Section) {
		section = at;
		failure = notice = undefined;
		errors = {};
	}

	async function send(path: string, method: 'PUT' | 'POST' | 'DELETE', body?: unknown) {
		busy = true;
		try {
			sub = await api<AcademySubscription>(`/platform/academies/${academyId}${path}`, {
				method,
				body
			});
			notice = m.subscription_saved();
			onchange(sub);
			return true;
		} catch (e) {
			const error = e instanceof ApiError ? e : new ApiError(0, 'internal_error');
			errors = error.fields;
			if (Object.keys(error.fields).length === 0) failure = errorText(error.code, locale);
			return false;
		} finally {
			busy = false;
		}
	}

	const between = (n: number, min: number, max: number) =>
		Number.isInteger(n) && n >= min && n <= max;

	async function savePackage(event: SubmitEvent) {
		event.preventDefault();
		start('package');
		const free = String(freeDays ?? '').trim() === '' ? 0 : wholeNumber(freeDays);
		if (sub.entries.length === 0 && !between(free, 0, 366)) {
			errors = { freeDays: ['days_invalid'] };
			return;
		}
		const body =
			sub.entries.length === 0
				? { packageId: packageId || null, freeDays: free, startAfterSetup }
				: { packageId: packageId || null };
		if (!(await send('/package', 'PUT', body))) return;
		amount = sub.package?.monthlyPrice ?? '';
		editing = !sub.package;
	}

	function change(open: boolean) {
		editing = open;
		packageId = sub.package?.id ?? '';
		if (open) start('package');
	}

	async function markPaid(event: SubmitEvent) {
		event.preventDefault();
		start('paid');
		const paid = wholeNumber(amount);
		if (!between(paid, 0, Number.MAX_SAFE_INTEGER)) {
			errors = { amount: ['amount_invalid'] };
			return;
		}
		const body = {
			amount: paid,
			method,
			note: paidNote.trim() || null,
			fromToday: sub.status === 'unpaid' && fromToday
		};
		if (!(await send('/payments', 'POST', body))) return;
		amount = sub.package?.monthlyPrice ?? '';
		paidNote = '';
		fromToday = false;
	}

	async function giveFree(event: SubmitEvent) {
		event.preventDefault();
		start('free');
		const n = wholeNumber(days);
		if (!between(n, 1, 366)) {
			errors = { days: ['days_invalid'] };
			return;
		}
		if (!(await send('/free-time', 'POST', { days: n, note: freeNote.trim() || null }))) return;
		days = '';
		freeNote = '';
		giving = false;
	}

	function openFree(open: boolean) {
		giving = open;
		start('free');
		days = '';
		freeNote = '';
	}

	function startTrial() {
		start('package');
		send('/trial/start', 'POST');
	}

	function undo() {
		start('entries');
		send(`/entries/${sub.entries[0].id}`, 'DELETE');
	}

	async function confirm(open: boolean) {
		confirming = open;
		await tick();
		blockCard?.querySelector('button')?.focus();
	}

	async function setBlocked(blocked: boolean) {
		start('block');
		if (await send('/blocked', 'PUT', { blocked })) await confirm(false);
	}

	const owedText = $derived(unpaidText(sub, locale));
</script>

{#snippet status(at: Section)}
	{#if section === at}
		{#if failure}<Banner tone="danger" icon="error">{failure}</Banner>{/if}
		{#if notice}<Banner icon="check_circle">{notice}</Banner>{/if}
	{/if}
{/snippet}

<div class="sj-stack">
	{#if sub.status === 'unpaid'}
		<Banner tone="danger" icon="error">{owedText}</Banner>
	{/if}

	<Card>
		{#if editing}
			<form method="post" class="sj-stack" onsubmit={savePackage} novalidate>
				<h2 class="sj-heading">
					{sub.package
						? m.subscription_change_package({}, { locale })
						: m.subscription_choose_package({}, { locale })}
				</h2>
				{@render status('package')}
				<SelectField
					label={m.subscription_package()}
					options={packageOptions}
					error={fieldText(shown('package'), 'packageId')}
					bind:value={packageId}
				/>
				{#if overLimit !== null}
					<Banner tone="pending" icon="warning">
						{m.subscription_over_limit({
							riders: riderCountText(sub.riders.count, locale),
							limit: overLimit
						})}
					</Banner>
				{/if}
				{#if sub.entries.length === 0}
					<TextField
						label={m.subscription_free_days()}
						type="number"
						dir="ltr"
						error={fieldText(shown('package'), 'freeDays')}
						bind:value={freeDays}
					/>
					<CheckboxField
						label={m.subscription_start_after_setup()}
						bind:checked={startAfterSetup}
					/>
					<span class="sj-hint">{m.subscription_start_after_setup_hint()}</span>
				{/if}
				<div class="sj-row">
					<Button type="submit" variant={sub.package ? 'secondary' : 'primary'} disabled={busy}>
						{m.subscription_save_package()}
					</Button>
					{#if sub.package}
						<Button variant="quiet" onclick={() => change(false)}>{m.action_cancel()}</Button>
					{/if}
				</div>
			</form>
		{:else if sub.package}
			<div class="sj-stack">
				<div class="head">
					<h2 class="sj-heading">{m.subscription_package({}, { locale })}</h2>
					<Button variant="quiet" icon="edit" onclick={() => change(true)}>
						{m.action_change({}, { locale })}
					</Button>
				</div>
				{@render status('package')}
				<div class="line">
					<strong>{localName(sub.package, locale)}</strong>
					<span class="sj-muted">{packageLimitText(sub.package, locale)}</span>
					<span class="sj-muted">{packagePriceText(sub.package, locale)}</span>
				</div>
			</div>
		{/if}
	</Card>

	{#if sub.status === 'trial_waiting'}
		<Card>
			<div class="sj-stack">
				{#if sub.trialDaysWaiting}
					<p>{waitingText(sub.trialDaysWaiting, locale)}</p>
				{/if}
				<p class="sj-muted">{m.subscription_waiting_cards()}</p>
				<div class="sj-row">
					<Button variant="secondary" icon="play_arrow" disabled={busy} onclick={startTrial}>
						{m.subscription_start_trial_now()}
					</Button>
				</div>
			</div>
		</Card>
	{:else if sub.package}
		<Card>
			<form method="post" class="sj-stack" onsubmit={markPaid} novalidate>
				<h2 class="sj-heading">{m.subscription_mark_paid_title()}</h2>
				{@render status('paid')}
				<div class="fields">
					<TextField
						label={m.subscription_amount()}
						type="number"
						dir="ltr"
						error={fieldText(shown('paid'), 'amount')}
						bind:value={amount}
					/>
					<SelectField
						label={m.subscription_method()}
						options={methodOptions}
						error={fieldText(shown('paid'), 'method')}
						bind:value={() => method, (v) => (method = v as PaymentMethod)}
					/>
				</div>
				<TextField
					label={m.subscription_note()}
					error={fieldText(shown('paid'), 'note')}
					bind:value={paidNote}
				/>
				{#if sub.status === 'unpaid'}
					<CheckboxField label={m.subscription_from_today()} bind:checked={fromToday} />
					<span class="sj-hint">{m.subscription_from_today_hint()}</span>
					{#if fieldText(shown('paid'), 'fromToday')}
						<span class="sj-field-error">{fieldText(shown('paid'), 'fromToday')}</span>
					{/if}
				{/if}
				<div class="sj-row">
					<Button type="submit" icon="payments" disabled={busy}>{m.subscription_mark_paid()}</Button
					>
				</div>
			</form>
		</Card>
	{/if}

	<Card>
		<div class="sj-stack">
			<div class="head">
				<h2 class="sj-heading">{m.subscription_entries()}</h2>
				{#if sub.package && sub.status !== 'trial_waiting' && !giving}
					<Button variant="quiet" icon="redeem" onclick={() => openFree(true)}>
						{m.subscription_give_free()}
					</Button>
				{/if}
			</div>
			{@render status('entries')}
			{#if giving}
				<form method="post" class="sj-stack" onsubmit={giveFree} novalidate>
					{@render status('free')}
					<div class="fields">
						<TextField
							label={m.subscription_days()}
							type="number"
							dir="ltr"
							error={fieldText(shown('free'), 'days')}
							bind:value={days}
						/>
						<TextField
							label={m.subscription_note()}
							error={fieldText(shown('free'), 'note')}
							bind:value={freeNote}
						/>
					</div>
					<div class="sj-row">
						<Button type="submit" variant="secondary" icon="redeem" disabled={busy}>
							{m.subscription_give_free()}
						</Button>
						<Button variant="quiet" onclick={() => openFree(false)}>{m.action_cancel()}</Button>
					</div>
				</form>
			{:else}
				{@render status('free')}
			{/if}
			{#if sub.entries.length === 0}
				<p class="sj-muted">{m.subscription_entries_empty()}</p>
			{:else}
				<ul class="entries" role="list">
					{#each sub.entries as e, i (e.id)}
						<li class="entry">
							<div class="main">
								<span>{entryText(e, sub.currency, locale)}</span>
								{#if e.note}<span class="sj-hint">{e.note}</span>{/if}
							</div>
							{#if i === 0}
								<Button variant="quiet" icon="undo" disabled={busy} onclick={undo}>
									{m.subscription_undo()}
								</Button>
							{/if}
						</li>
					{/each}
				</ul>
			{/if}
		</div>
	</Card>

	<Card active={confirming}>
		<div class="sj-stack" bind:this={blockCard}>
			{@render status('block')}
			{#if sub.blocked}
				<p>{m.subscription_blocked_card({}, { locale })}</p>
				<div class="sj-row">
					<Button
						variant="secondary"
						icon="lock_open"
						disabled={busy}
						onclick={() => setBlocked(false)}
					>
						{m.subscription_unblock()}
					</Button>
				</div>
			{:else if confirming}
				<p>{m.subscription_block_confirm()}</p>
				<div class="sj-row">
					<Button variant="danger" disabled={busy} onclick={() => setBlocked(true)}>
						{m.subscription_block_yes()}
					</Button>
					<Button variant="quiet" onclick={() => confirm(false)}>{m.action_cancel()}</Button>
				</div>
			{:else}
				<p class="sj-muted">{m.subscription_block_card({}, { locale })}</p>
				<div class="sj-row">
					<Button variant="secondary" icon="block" onclick={() => confirm(true)}>
						{m.subscription_block()}
					</Button>
				</div>
			{/if}
		</div>
	</Card>
</div>

<style>
	.head {
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		justify-content: space-between;
		gap: var(--space-2);
	}
	.line {
		display: flex;
		flex-wrap: wrap;
		gap: var(--space-1) var(--space-3);
	}
	.fields {
		display: grid;
		gap: var(--space-3);
	}
	.entries {
		margin: 0;
		padding: 0;
		list-style: none;
	}
	.entry {
		display: flex;
		align-items: center;
		gap: var(--space-3);
		padding-block: var(--space-2);
	}
	.entry + .entry {
		border-block-start: 1px solid var(--line);
	}
	.main {
		flex: 1;
		display: flex;
		flex-direction: column;
		gap: var(--space-1);
	}
	@media (min-width: 720px) {
		.fields {
			grid-template-columns: 1fr 1fr;
		}
	}
</style>

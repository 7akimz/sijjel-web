<script lang="ts">
	import { tick, untrack } from 'svelte';
	import { localName } from '#lib/academy.js';
	import { api } from '#lib/api/client.js';
	import { ApiError, errorText, fieldText, type FieldErrors } from '#lib/api/errors.js';
	import type { AcademySubscription, Package, PaymentMethod } from '#lib/api/subscription-types.js';
	import type { Locale } from '#lib/api/types.js';
	import { wholeNumber } from '#lib/forms/booking-rules.js';
	import {
		entryText,
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
		locale: Locale;
		onchange: (s: AcademySubscription) => void;
	};
	let { academyId, subscription, packages, locale, onchange }: Props = $props();

	let sub = $state(untrack(() => subscription));
	let packageId = $state(untrack(() => subscription.package?.id ?? ''));
	let freeDays = $state<string | number | null>(30);
	let amount = $state<string | number | null>(
		untrack(() => subscription.package?.monthlyPrice ?? '')
	);
	let method = $state<PaymentMethod>('instapay');
	let paidNote = $state('');
	let fromToday = $state(false);
	let days = $state<string | number | null>('');
	let freeNote = $state('');
	let confirming = $state(false);
	let busy = $state(false);
	let section = $state<Section>();
	let errors = $state<FieldErrors>({});
	let failure = $state<string>();
	let notice = $state<string>();
	let blockCard = $state<HTMLElement>();

	const packageOptions = $derived([
		...(sub.package ? [] : [{ value: '', label: m.subscription_choose_package() }]),
		...packages
			.filter((p) => p.isActive || p.id === sub.package?.id)
			.map((p) => ({ value: p.id, label: localName(p, locale) }))
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
				? { packageId: packageId || null, freeDays: free }
				: { packageId: packageId || null };
		if (await send('/package', 'PUT', body)) amount = sub.package?.monthlyPrice ?? '';
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
</script>

{#snippet status(at: Section)}
	{#if section === at}
		{#if failure}<Banner tone="danger" icon="error">{failure}</Banner>{/if}
		{#if notice}<Banner icon="check_circle">{notice}</Banner>{/if}
	{/if}
{/snippet}

<div class="sj-stack">
	<Card>
		<form method="post" class="sj-stack" onsubmit={savePackage} novalidate>
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
			{/if}
			<div class="sj-row">
				<Button type="submit" disabled={busy}>{m.subscription_save_package()}</Button>
			</div>
		</form>
	</Card>

	{#if sub.package}
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

		<Card>
			<form method="post" class="sj-stack" onsubmit={giveFree} novalidate>
				<h2 class="sj-heading">{m.subscription_free_title()}</h2>
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
				</div>
			</form>
		</Card>
	{/if}

	<Card>
		<div class="sj-stack">
			<h2 class="sj-heading">{m.subscription_entries()}</h2>
			{@render status('entries')}
			{#if sub.entries.length === 0}
				<p class="sj-muted">{m.subscription_entries_empty()}</p>
			{:else}
				<ul class="entries" role="list">
					{#each sub.entries as e, i (e.id)}
						<li class="entry">
							<div class="main">
								<span>{entryText(e, locale)}</span>
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

	<Card>
		<div class="sj-stack" bind:this={blockCard}>
			{@render status('block')}
			{#if confirming}
				<p>{sub.blocked ? m.subscription_unblock_confirm() : m.subscription_block_confirm()}</p>
				<div class="sj-row">
					<Button
						variant={sub.blocked ? 'primary' : 'danger'}
						disabled={busy}
						onclick={() => setBlocked(!sub.blocked)}
					>
						{sub.blocked ? m.subscription_unblock_yes() : m.subscription_block_yes()}
					</Button>
					<Button variant="quiet" onclick={() => confirm(false)}>{m.action_cancel()}</Button>
				</div>
			{:else}
				<div class="sj-row">
					<Button
						variant={sub.blocked ? 'secondary' : 'danger'}
						icon={sub.blocked ? 'lock_open' : 'block'}
						onclick={() => confirm(true)}
					>
						{sub.blocked ? m.subscription_unblock() : m.subscription_block()}
					</Button>
				</div>
			{/if}
		</div>
	</Card>
</div>

<style>
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

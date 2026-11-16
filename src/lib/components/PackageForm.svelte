<script lang="ts">
	import { untrack } from 'svelte';
	import { api } from '#lib/api/client.js';
	import { ApiError, errorText, fieldText, type FieldErrors } from '#lib/api/errors.js';
	import type { Package, PackageInput } from '#lib/api/subscription-types.js';
	import type { Country, Locale } from '#lib/api/types.js';
	import { wholeNumber } from '#lib/forms/booking-rules.js';
	import { focusFirstInvalid } from '#lib/forms/focus.js';
	import { packageErrors } from '#lib/forms/package.js';
	import { m } from '#lib/paraglide/messages.js';
	import { Banner, Button, CheckboxField, SelectField, TextField } from '#lib/ui/index.js';

	type Props = {
		initial?: Package;
		/** The countries a new package can be for; an existing package keeps its own. */
		countries?: Country[];
		locale: Locale;
		onsaved: (saved: Package) => void;
		oncancel?: () => void;
	};
	let { initial, countries = [], locale, onsaved, oncancel }: Props = $props();

	const original = untrack(() => initial);
	let nameEn = $state(original?.nameEn ?? '');
	let nameAr = $state(original?.nameAr ?? '');
	let riders = $state<string | number | null>(original?.maxRiders ?? '');
	let price = $state<string | number | null>(original?.monthlyPrice ?? '');
	let active = $state(original?.isActive ?? true);
	let country = $state(original?.country ?? 'EG');
	const countryOptions = $derived(
		countries.map((c) => ({ value: c.code, label: locale === 'ar' ? c.nameAr : c.nameEn }))
	);
	const picked = $derived(countries.find((c) => c.code === country));
	const currency = $derived(original?.currency ?? picked?.currency ?? 'EGP');
	const priceHint = $derived(
		original && picked
			? m.package_price_hint_fixed({
					currency,
					country: locale === 'ar' ? picked.nameAr : picked.nameEn
				})
			: m.package_price_hint({ currency })
	);
	let errors = $state<FieldErrors>({});
	let failure = $state<string>();
	let busy = $state(false);
	let formElement = $state<HTMLFormElement>();

	async function submit(event: SubmitEvent) {
		event.preventDefault();
		failure = undefined;
		const body: PackageInput = {
			nameEn: nameEn.trim(),
			nameAr: nameAr.trim(),
			maxRiders: String(riders ?? '').trim() === '' ? null : wholeNumber(riders),
			monthlyPrice: wholeNumber(price),
			isActive: active,
			...(original || countries.length === 0 ? {} : { country })
		};
		errors = packageErrors(body);
		if (Object.keys(errors).length > 0) return focusFirstInvalid(formElement);
		busy = true;
		try {
			const saved = original
				? await api<Package>(`/platform/packages/${original.id}`, { method: 'PUT', body })
				: await api<Package>('/platform/packages', { method: 'POST', body });
			if (!original) {
				nameEn = nameAr = '';
				riders = price = '';
			}
			onsaved(saved);
		} catch (e) {
			const error = e instanceof ApiError ? e : new ApiError(0, 'internal_error');
			errors = error.fields;
			if (Object.keys(error.fields).length === 0) failure = errorText(error.code, locale);
			else focusFirstInvalid(formElement);
		} finally {
			busy = false;
		}
	}
</script>

<form method="post" class="sj-stack" bind:this={formElement} onsubmit={submit} novalidate>
	{#if failure}<Banner tone="danger" icon="error">{failure}</Banner>{/if}
	<div class="fields">
		<TextField
			label={m.package_name_en()}
			dir="ltr"
			error={fieldText(errors, 'nameEn')}
			bind:value={nameEn}
		/>
		<TextField
			label={m.package_name_ar()}
			dir="rtl"
			error={fieldText(errors, 'nameAr')}
			bind:value={nameAr}
		/>
		<TextField
			label={m.package_max_riders()}
			type="number"
			dir="ltr"
			error={fieldText(errors, 'maxRiders')}
			bind:value={riders}
		/>
		{#if !original && countries.length > 0}
			<SelectField
				label={m.academy_country()}
				options={countryOptions}
				error={fieldText(errors, 'country')}
				bind:value={country}
			/>
		{/if}
		<TextField
			label={m.package_price()}
			type="number"
			dir="ltr"
			hint={priceHint}
			error={fieldText(errors, 'monthlyPrice')}
			bind:value={price}
		/>
	</div>
	{#if original}<CheckboxField label={m.package_active()} bind:checked={active} />{/if}
	<div class="sj-row">
		<Button type="submit" icon={original ? undefined : 'add'} disabled={busy}>
			{original ? m.action_save() : m.package_add()}
		</Button>
		{#if oncancel}<Button variant="quiet" onclick={oncancel}>{m.action_cancel()}</Button>{/if}
	</div>
</form>

<style>
	.fields {
		display: grid;
		gap: var(--space-3);
	}
	@media (min-width: 720px) {
		.fields {
			grid-template-columns: 1fr 1fr;
		}
	}
</style>

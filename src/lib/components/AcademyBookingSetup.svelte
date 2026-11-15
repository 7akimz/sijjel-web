<script lang="ts">
	import { untrack } from 'svelte';
	import { api } from '#lib/api/client.js';
	import { ApiError, errorText } from '#lib/api/errors.js';
	import type { Country, Locale } from '#lib/api/types.js';
	import WhoBooksField from '#lib/components/WhoBooksField.svelte';
	import { m } from '#lib/paraglide/messages.js';
	import { Banner, Button, Card, SelectField } from '#lib/ui/index.js';

	type Props = {
		academyId: string;
		country: string;
		ridersBook: boolean;
		countries: Country[];
		locale: Locale;
	};
	let {
		academyId,
		country: savedCountry,
		ridersBook: savedRidersBook,
		countries,
		locale
	}: Props = $props();

	let saved = $state(untrack(() => ({ country: savedCountry, ridersBook: savedRidersBook })));
	let country = $state(untrack(() => savedCountry));
	let ridersBook = $state(untrack(() => savedRidersBook));
	let busy = $state(false);
	let done = $state(false);
	let failure = $state<string>();

	const options = $derived(
		countries.map((c) => ({ value: c.code, label: locale === 'ar' ? c.nameAr : c.nameEn }))
	);
	const picked = $derived(countries.find((c) => c.code === country));

	async function save(event: SubmitEvent) {
		event.preventDefault();
		busy = true;
		done = false;
		failure = undefined;
		try {
			if (country !== saved.country) {
				await api(`/platform/academies/${academyId}/country`, { method: 'PUT', body: { country } });
			}
			if (ridersBook !== saved.ridersBook) {
				await api(`/platform/academies/${academyId}/riders-book`, {
					method: 'PUT',
					body: { ridersBook }
				});
			}
			saved = { country, ridersBook };
			done = true;
		} catch (e) {
			failure = errorText(e instanceof ApiError ? e.code : 'internal_error');
		} finally {
			busy = false;
		}
	}
</script>

<Card>
	<form method="post" class="sj-stack" onsubmit={save} novalidate>
		<h2 class="sj-heading">{m.academy_booking_setup({}, { locale })}</h2>
		{#if done}<Banner icon="check_circle">{m.academy_booking_setup_saved({}, { locale })}</Banner
			>{/if}
		{#if failure}<Banner tone="danger" icon="error">{failure}</Banner>{/if}
		<SelectField
			label={m.academy_country({}, { locale })}
			{options}
			hint={picked
				? m.academy_country_hint(
						{ currency: picked.currency, callingCode: picked.callingCode },
						{ locale }
					)
				: undefined}
			bind:value={country}
		/>
		<WhoBooksField bind:ridersBook {locale} />
		<div>
			<Button type="submit" disabled={busy}>{m.action_save({}, { locale })}</Button>
		</div>
	</form>
</Card>

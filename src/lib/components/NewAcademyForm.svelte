<script lang="ts">
	import { onMount, untrack } from 'svelte';
	import { api } from '#lib/api/client.js';
	import { ApiError, errorText, type FieldErrors } from '#lib/api/errors.js';
	import type { AcademySummary, Discipline, Locale } from '#lib/api/types.js';
	import {
		academyFormErrors,
		toCreateAcademyRequest,
		type AcademyForm
	} from '#lib/forms/academy.js';
	import { m } from '#lib/paraglide/messages.js';
	import {
		Banner,
		Button,
		Card,
		CheckboxField,
		Icon,
		SelectField,
		TextField
	} from '#lib/ui/index.js';

	type Props = {
		disciplines: Discipline[];
		rootHost: string;
		locale: Locale;
		oncreated: (academy: AcademySummary) => void;
		oncancel: () => void;
	};
	let { disciplines, rootHost, locale, oncreated, oncancel }: Props = $props();

	const initialLanguage = untrack(() => locale);
	let form = $state<AcademyForm>({
		slug: '',
		nameEn: '',
		nameAr: '',
		timeZone: 'UTC',
		defaultLanguage: initialLanguage,
		disciplineIds: []
	});
	let language = $state<string>(initialLanguage);
	let picked = $state<Record<string, boolean>>(
		Object.fromEntries(untrack(() => disciplines).map((d) => [d.id, false]))
	);
	let errors = $state<FieldErrors>({});
	let failure = $state<string>();
	let busy = $state(false);

	const zones = Intl.supportedValuesOf('timeZone');
	const timeZones = (zones.includes('UTC') ? zones : ['UTC', ...zones]).map((zone) => ({
		value: zone,
		label: zone.replaceAll('_', ' ')
	}));
	const languages = [
		{ value: 'en', label: m.language_en() },
		{ value: 'ar', label: m.language_ar() }
	];
	// Isolated left-to-right so the address reads correctly inside Arabic text.
	const [isolateLtr, popIsolate] = [String.fromCodePoint(0x2066), String.fromCodePoint(0x2069)];
	const host = $derived(
		`${isolateLtr}${form.slug.trim().toLowerCase() || '…'}.${rootHost}${popIsolate}`
	);

	onMount(() => {
		const browserZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
		if (zones.includes(browserZone)) form.timeZone = browserZone;
	});

	const fieldError = (field: string) => {
		const code = errors[field]?.[0];
		return code ? errorText(code) : undefined;
	};

	async function submit(event: SubmitEvent) {
		event.preventDefault();
		form.defaultLanguage = language === 'ar' ? 'ar' : 'en';
		form.disciplineIds = disciplines.filter((d) => picked[d.id]).map((d) => d.id);
		failure = undefined;
		errors = academyFormErrors(form);
		if (Object.keys(errors).length > 0) return;

		busy = true;
		try {
			oncreated(
				await api<AcademySummary>('/platform/academies', {
					method: 'POST',
					body: toCreateAcademyRequest(form)
				})
			);
		} catch (e) {
			const error = e instanceof ApiError ? e : new ApiError(0, 'internal_error');
			errors = error.fields;
			if (Object.keys(error.fields).length === 0) failure = errorText(error.code);
		} finally {
			busy = false;
		}
	}
</script>

<Card raised>
	<form class="sj-stack" onsubmit={submit} novalidate>
		<h2 class="sj-heading">{m.academy_new()}</h2>
		{#if failure}<Banner tone="danger" icon="error">{failure}</Banner>{/if}
		<TextField
			label={m.academy_slug()}
			hint={m.academy_slug_hint({ host })}
			error={fieldError('slug')}
			dir="ltr"
			autocomplete="off"
			required
			bind:value={form.slug}
		/>
		<TextField
			label={m.academy_name_en()}
			error={fieldError('nameEn')}
			dir="ltr"
			required
			bind:value={form.nameEn}
		/>
		<TextField
			label={m.academy_name_ar()}
			error={fieldError('nameAr')}
			dir="rtl"
			required
			bind:value={form.nameAr}
		/>
		<SelectField
			label={m.academy_time_zone()}
			options={timeZones}
			error={fieldError('timeZone')}
			bind:value={form.timeZone}
		/>
		<SelectField
			label={m.academy_default_language()}
			options={languages}
			error={fieldError('defaultLanguage')}
			bind:value={language}
		/>
		<fieldset
			class="sj-stack"
			aria-describedby={errors.disciplineIds ? 'disciplines-error' : undefined}
		>
			<legend class="sj-label">{m.academy_disciplines()}</legend>
			{#each disciplines as discipline (discipline.id)}
				<CheckboxField
					label={locale === 'ar' ? discipline.nameAr : discipline.nameEn}
					bind:checked={picked[discipline.id]}
				/>
			{/each}
			{#if fieldError('disciplineIds')}
				<span class="sj-field-error" id="disciplines-error"
					><Icon name="error" size={20} />{fieldError('disciplineIds')}</span
				>
			{/if}
		</fieldset>
		<div class="sj-row">
			<Button type="submit" disabled={busy}>{m.academy_create()}</Button>
			<Button variant="quiet" onclick={oncancel}>{m.action_cancel()}</Button>
		</div>
	</form>
</Card>

<style>
	fieldset {
		border: 0;
		margin: 0;
		padding: 0;
	}
</style>

<script lang="ts">
	import { tick, untrack } from 'svelte';
	import { academyName, localName } from '#lib/academy.js';
	import { api } from '#lib/api/client.js';
	import { ApiError, errorText, fieldText, type FieldErrors } from '#lib/api/errors.js';
	import type { Package } from '#lib/api/subscription-types.js';
	import type {
		AcademySummary,
		Country,
		CreatedInvite,
		Discipline,
		Locale
	} from '#lib/api/types.js';
	import InviteShareCard from '#lib/components/InviteShareCard.svelte';
	import OwnerInviteForm from '#lib/components/OwnerInviteForm.svelte';
	import WhoBooksField from '#lib/components/WhoBooksField.svelte';
	import {
		STEP_ONE_FIELDS,
		academyFormErrors,
		academyStepOneErrors,
		initialDisciplinePicks,
		toCreateAcademyRequest,
		type AcademyForm
	} from '#lib/forms/academy.js';
	import { wholeNumber } from '#lib/forms/booking-rules.js';
	import { focusFirstInvalid } from '#lib/forms/focus.js';
	import { DEFAULT_TIME_ZONE, timeZoneOptions } from '#lib/forms/time-zones.js';
	import { m } from '#lib/paraglide/messages.js';
	import {
		Banner,
		Button,
		Card,
		CheckboxField,
		Icon,
		ProgressBar,
		SelectField,
		TextField
	} from '#lib/ui/index.js';

	type Step = 1 | 2 | 3 | 4;
	type Props = {
		countries: Country[];
		disciplines: Discipline[];
		packages: Package[];
		rootHost: string;
		locale: Locale;
		onfinish: (academyId: string) => void;
		oncancel: () => void;
	};
	let { countries, disciplines, packages, rootHost, locale, onfinish, oncancel }: Props = $props();

	const initialLanguage = untrack(() => locale);
	let step = $state<Step>(1);
	let academy = $state<AcademySummary>();
	let form = $state<AcademyForm>({
		slug: '',
		nameEn: '',
		nameAr: '',
		timeZone: DEFAULT_TIME_ZONE,
		defaultLanguage: initialLanguage,
		disciplineIds: [],
		country: 'EG',
		ridersBook: true
	});
	let language = $state<string>(initialLanguage);
	let picked = $state<Record<string, boolean>>(initialDisciplinePicks(untrack(() => disciplines)));
	let packageId = $state('');
	let freeDays = $state<string | number | null>(30);
	let startAfterSetup = $state(true);
	let shared = $state<{ invite: CreatedInvite; name: string }>();
	let errors = $state<FieldErrors>({});
	let failure = $state<string>();
	let busy = $state(false);
	let formElement = $state<HTMLFormElement>();

	const stepNames = $derived({
		1: m.flow_step_academy({}, { locale }),
		2: m.flow_step_runs({}, { locale }),
		3: m.flow_step_package({}, { locale }),
		4: m.flow_step_owner({}, { locale })
	});
	const progress = $derived(m.flow_step({ n: step, total: 4, name: stepNames[step] }, { locale }));
	const timeZones = timeZoneOptions();
	const countryOptions = $derived(
		countries.map((c) => ({ value: c.code, label: locale === 'ar' ? c.nameAr : c.nameEn }))
	);
	const country = $derived(countries.find((c) => c.code === form.country));
	const languages = [
		{ value: 'en', label: m.language_en() },
		{ value: 'ar', label: m.language_ar() }
	];
	// Isolated left-to-right so the address reads correctly inside Arabic text.
	const [isolateLtr, popIsolate] = [String.fromCodePoint(0x2066), String.fromCodePoint(0x2069)];
	const host = $derived(
		`${isolateLtr}${form.slug.trim().toLowerCase() || '…'}.${rootHost}${popIsolate}`
	);
	const packageOptions = $derived([
		{ value: '', label: m.subscription_choose_package({}, { locale }) },
		...packages
			.filter((p) => p.isActive && p.country === academy?.country)
			.map((p) => ({ value: p.id, label: localName(p, locale) }))
	]);
	const name = $derived(academy ? academyName(academy, locale) : '');

	const fieldError = (field: string) => {
		const code = errors[field]?.[0];
		return code ? errorText(code, locale) : undefined;
	};

	// The country decides the time zone a new academy starts with; it can still be changed after.
	function pickCountry() {
		if (country) form.timeZone = country.timeZone;
	}

	async function go(to: Step) {
		step = to;
		errors = {};
		failure = undefined;
		await tick();
		formElement?.querySelector<HTMLElement>('input, select')?.focus();
	}

	async function next(event: SubmitEvent) {
		event.preventDefault();
		errors = academyStepOneErrors(form);
		if (Object.keys(errors).length > 0) return focusFirstInvalid(formElement);
		go(2);
	}

	async function create(event: SubmitEvent) {
		event.preventDefault();
		form.defaultLanguage = language === 'ar' ? 'ar' : 'en';
		form.disciplineIds = disciplines.filter((d) => picked[d.id]).map((d) => d.id);
		failure = undefined;
		errors = academyFormErrors(form);
		if (Object.keys(errors).length > 0) return focusFirstInvalid(formElement);

		busy = true;
		try {
			academy = await api<AcademySummary>('/platform/academies', {
				method: 'POST',
				body: toCreateAcademyRequest(form)
			});
			go(3);
		} catch (e) {
			const error = e instanceof ApiError ? e : new ApiError(0, 'internal_error');
			const fields = error.fields;
			if (Object.keys(fields).length === 0) failure = errorText(error.code, locale);
			else if (STEP_ONE_FIELDS.some((f) => fields[f])) {
				step = 1;
				await tick();
				errors = fields;
				focusFirstInvalid(formElement);
			} else {
				errors = fields;
				focusFirstInvalid(formElement);
			}
		} finally {
			busy = false;
		}
	}

	async function savePackage(event: SubmitEvent) {
		event.preventDefault();
		if (!academy) return;
		failure = undefined;
		const free = String(freeDays ?? '').trim() === '' ? 0 : wholeNumber(freeDays);
		if (!(Number.isInteger(free) && free >= 0 && free <= 366)) {
			errors = { freeDays: ['days_invalid'] };
			return focusFirstInvalid(formElement);
		}
		busy = true;
		try {
			await api(`/platform/academies/${academy.id}/package`, {
				method: 'PUT',
				body: { packageId: packageId || null, freeDays: free, startAfterSetup }
			});
			go(4);
		} catch (e) {
			const error = e instanceof ApiError ? e : new ApiError(0, 'internal_error');
			errors = error.fields;
			if (Object.keys(error.fields).length === 0) failure = errorText(error.code, locale);
		} finally {
			busy = false;
		}
	}

	function leave() {
		if (academy) onfinish(academy.id);
		else oncancel();
	}
</script>

<div class="sj-stack">
	<div>
		<Button variant="quiet" icon="close" onclick={leave}>
			{academy ? m.flow_finish_later({}, { locale }) : m.nav_academies({}, { locale })}
		</Button>
	</div>
	<h1 class="sj-title">{m.academy_new({}, { locale })}</h1>
	<div class="progress">
		<ProgressBar value={step} max={4} label={progress} />
		<span class="sj-small sj-muted">{progress}</span>
	</div>
</div>

{#if step === 3}
	<Banner icon="check_circle">{m.academy_created_next({ name }, { locale })}</Banner>
{/if}
{#if failure}<Banner tone="danger" icon="error">{failure}</Banner>{/if}

{#if step === 1}
	<form method="post" class="sj-stack" bind:this={formElement} onsubmit={next} novalidate>
		<Card>
			<div class="sj-stack">
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
			</div>
		</Card>
		<div class="actions">
			<span class="end"><Button type="submit">{m.action_next({}, { locale })}</Button></span>
		</div>
	</form>
{:else if step === 2}
	<form method="post" class="sj-stack" bind:this={formElement} onsubmit={create} novalidate>
		<Card>
			<div class="sj-stack">
				<SelectField
					label={m.academy_country()}
					options={countryOptions}
					hint={country
						? m.academy_country_hint({
								currency: country.currency,
								callingCode: country.callingCode
							})
						: undefined}
					error={fieldError('country')}
					bind:value={form.country}
					onchange={pickCountry}
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
				<fieldset class="sj-stack">
					<legend class="sj-label">{m.academy_disciplines()}</legend>
					{#each disciplines as discipline (discipline.id)}
						<CheckboxField
							label={locale === 'ar' ? discipline.nameAr : discipline.nameEn}
							invalid={!!errors.disciplineIds}
							describedBy={errors.disciplineIds ? 'disciplines-error' : undefined}
							bind:checked={picked[discipline.id]}
						/>
					{/each}
					{#if fieldError('disciplineIds')}
						<span class="sj-field-error" id="disciplines-error"
							><Icon name="error" size={20} />{fieldError('disciplineIds')}</span
						>
					{/if}
				</fieldset>
				<WhoBooksField bind:ridersBook={form.ridersBook} {locale} />
			</div>
		</Card>
		<div class="actions">
			<Button variant="quiet" icon="arrow_back" onclick={() => go(1)}>
				{m.action_back({}, { locale })}
			</Button>
			<span class="end">
				<Button type="submit" disabled={busy}>{m.academy_create({}, { locale })}</Button>
			</span>
		</div>
	</form>
{:else if step === 3}
	<form method="post" class="sj-stack" bind:this={formElement} onsubmit={savePackage} novalidate>
		<Card>
			<div class="sj-stack">
				<SelectField
					label={m.subscription_package({}, { locale })}
					options={packageOptions}
					error={fieldText(errors, 'packageId')}
					bind:value={packageId}
				/>
				<TextField
					label={m.subscription_free_days({}, { locale })}
					type="number"
					dir="ltr"
					error={fieldText(errors, 'freeDays')}
					bind:value={freeDays}
				/>
				<CheckboxField
					label={m.subscription_start_after_setup({}, { locale })}
					bind:checked={startAfterSetup}
				/>
				<span class="sj-hint">{m.subscription_start_after_setup_hint({}, { locale })}</span>
			</div>
		</Card>
		<div class="actions">
			<Button variant="quiet" onclick={() => go(4)}>{m.action_skip({}, { locale })}</Button>
			<span class="end">
				<Button type="submit" disabled={busy}>{m.subscription_save_package({}, { locale })}</Button>
			</span>
		</div>
	</form>
{:else if academy}
	<Card>
		<div class="sj-stack">
			{#if shared}
				<InviteShareCard
					invite={shared.invite}
					name={shared.name}
					message={m.invite_share_message_owner({ name: shared.name, academy: name }, { locale })}
					phone={shared.invite.phone}
					{locale}
				/>
			{:else}
				<p class="sj-muted">{m.owner_step_intro({}, { locale })}</p>
				<OwnerInviteForm
					step
					academyId={academy.id}
					oncreated={(invite, f) => (shared = { invite, name: f.name.trim() })}
					oncancel={() => academy && onfinish(academy.id)}
				/>
			{/if}
		</div>
	</Card>
	{#if shared}
		<div class="actions">
			<span class="end">
				<Button
					variant="secondary"
					icon="arrow_forward"
					onclick={() => academy && onfinish(academy.id)}
				>
					{m.flow_go_to_academy({}, { locale })}
				</Button>
			</span>
		</div>
	{/if}
{/if}

<style>
	.progress {
		display: flex;
		flex-direction: column;
		gap: var(--space-2);
	}
	.actions {
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		gap: var(--space-2);
	}
	.end {
		margin-inline-start: auto;
	}
	fieldset {
		border: 0;
		margin: 0;
		padding: 0;
	}
</style>

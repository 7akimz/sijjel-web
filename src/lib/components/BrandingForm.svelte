<script lang="ts">
	import { onMount, untrack } from 'svelte';
	import { api, upload } from '#lib/api/client.js';
	import type { Branding } from '#lib/api/branding-types.js';
	import { ApiError, errorText, fieldText, type FieldErrors } from '#lib/api/errors.js';
	import { focusFirstInvalid } from '#lib/forms/focus.js';
	import { imagePixels, loadImage, resizeImage } from '#lib/forms/image.js';
	import { m } from '#lib/paraglide/messages.js';
	import { accentVars } from '#lib/theme/accent.js';
	import { suggestColours, swatchesFor } from '#lib/theme/logo-colours.js';
	import { Banner, Button, Card, Icon, StatusChip, TextField } from '#lib/ui/index.js';

	type Props = { branding: Branding; onsaved: (branding: Branding) => void };
	let { branding, onsaved }: Props = $props();

	type Slot = 'logo' | 'cover';
	type Pick = { blob: Blob; preview: string };

	const MAX_WELCOME = 200;
	const sizes: Record<Slot, number> = { logo: 512, cover: 1600 };

	let current = $state(untrack(() => branding));
	const storedColour = untrack(() => branding.primaryColor.toUpperCase());
	let colour = $state(storedColour);
	let suggested = $state<string[]>([]);
	let welcomeEn = $state(untrack(() => branding.welcomeTextEn ?? ''));
	let welcomeAr = $state(untrack(() => branding.welcomeTextAr ?? ''));
	let picked = $state<Record<Slot, Pick | null>>({ logo: null, cover: null });
	let removed = $state<Record<Slot, boolean>>({ logo: false, cover: false });
	let imageErrors = $state<Record<Slot, string | undefined>>({ logo: undefined, cover: undefined });
	let errors = $state<FieldErrors>({});
	let failure = $state<string>();
	let saved = $state(false);
	let busy = $state(false);
	let formElement = $state<HTMLFormElement>();

	const shown = (slot: Slot) =>
		picked[slot]?.preview ??
		(removed[slot] ? null : slot === 'logo' ? current.logoUrl : current.coverUrl);
	const swatches = $derived(swatchesFor(suggested, storedColour));
	const previewStyle = $derived(
		Object.entries(accentVars(colour).light)
			.map(([name, value]) => `${name}:${value}`)
			.join(';')
	);

	const coloursOf = async (source: ImageBitmap) => suggestColours(imagePixels(source));

	onMount(() => {
		const logo = current.logoUrl;
		if (!logo) return;
		fetch(logo)
			.then((response) => response.blob())
			.then(loadImage)
			.then(coloursOf)
			.then((colours) => (suggested = colours))
			.catch(() => {});
	});

	async function choose(slot: Slot, event: Event) {
		const input = event.currentTarget as HTMLInputElement;
		const file = input.files?.[0];
		input.value = '';
		if (!file) return;
		saved = false;
		imageErrors[slot] = undefined;
		try {
			const source = await loadImage(file);
			const blob = await resizeImage(source, sizes[slot], slot);
			if (picked[slot]) URL.revokeObjectURL(picked[slot].preview);
			picked[slot] = { blob, preview: URL.createObjectURL(blob) };
			removed[slot] = false;
			if (slot === 'logo') {
				suggested = await coloursOf(source);
				if (suggested.length > 0) colour = suggested[0];
				else if (!swatchesFor([], storedColour).includes(colour)) colour = storedColour;
			}
		} catch {
			imageErrors[slot] = errorText('image_invalid');
		}
	}

	function remove(slot: Slot) {
		if (picked[slot]) URL.revokeObjectURL(picked[slot].preview);
		picked[slot] = null;
		removed[slot] = true;
		imageErrors[slot] = undefined;
		saved = false;
	}

	function welcomeErrors(): FieldErrors {
		const out: FieldErrors = {};
		if ([...welcomeEn.trim()].length > MAX_WELCOME) out.welcomeTextEn = ['welcome_too_long'];
		if ([...welcomeAr.trim()].length > MAX_WELCOME) out.welcomeTextAr = ['welcome_too_long'];
		return out;
	}

	const asApiError = (e: unknown) =>
		e instanceof ApiError ? e : new ApiError(0, 'internal_error');

	// Images go first so a failed upload leaves the colour and welcome lines unsaved too.
	async function saveImages(): Promise<boolean> {
		for (const slot of ['logo', 'cover'] as const) {
			const pick = picked[slot];
			if (!pick && !removed[slot]) continue;
			try {
				current = pick
					? await upload<Branding>(`/academy/branding/${slot}`, pick.blob)
					: await api<Branding>(`/academy/branding/${slot}`, { method: 'DELETE' });
				if (pick) URL.revokeObjectURL(pick.preview);
				picked[slot] = null;
				removed[slot] = false;
			} catch (e) {
				imageErrors[slot] = errorText(asApiError(e).code);
				return false;
			}
		}
		return true;
	}

	async function save(event: SubmitEvent) {
		event.preventDefault();
		saved = false;
		failure = undefined;
		imageErrors = { logo: undefined, cover: undefined };
		errors = welcomeErrors();
		if (Object.keys(errors).length > 0) return focusFirstInvalid(formElement);
		busy = true;
		try {
			if (!(await saveImages())) return;
			current = await api<Branding>('/academy/branding', {
				method: 'PUT',
				body: { primaryColor: colour, welcomeTextEn: welcomeEn, welcomeTextAr: welcomeAr }
			});
			saved = true;
			onsaved(current);
		} catch (e) {
			const error = asApiError(e);
			errors = error.fields;
			if (Object.keys(error.fields).length === 0) failure = errorText(error.code);
			else focusFirstInvalid(formElement);
		} finally {
			busy = false;
		}
	}
</script>

{#snippet imageSection(slot: Slot, legend: string, uploadLabel: string, changeLabel: string)}
	{@const src = shown(slot)}
	<Card>
		<fieldset class="section">
			<legend class="sj-heading">{legend}</legend>
			{#if src}
				<img class={slot === 'logo' ? 'logo-preview' : 'cover-preview'} {src} alt="" />
			{:else}
				<div class={slot === 'logo' ? 'logo-preview empty' : 'cover-preview empty'}>
					<Icon name={slot === 'logo' ? 'shield' : 'image'} />
				</div>
			{/if}
			{#if imageErrors[slot]}<p class="sj-small error" role="alert">{imageErrors[slot]}</p>{/if}
			<div class="actions">
				<label class="sj-btn sj-btn--secondary picker">
					<input
						class="sj-visually-hidden"
						type="file"
						accept="image/*"
						onchange={(event) => choose(slot, event)}
					/>
					{src ? changeLabel : uploadLabel}
				</label>
				{#if src}
					<Button variant="quiet" onclick={() => remove(slot)}>{m.branding_remove()}</Button>
				{/if}
			</div>
		</fieldset>
	</Card>
{/snippet}

{#if saved}<Banner icon="check_circle">{m.branding_saved()}</Banner>{/if}
{#if failure}<Banner tone="danger" icon="error">{failure}</Banner>{/if}

<form class="sj-stack" bind:this={formElement} onsubmit={save} novalidate>
	{@render imageSection(
		'logo',
		m.branding_logo(),
		m.branding_upload_logo(),
		m.branding_change_logo()
	)}
	{@render imageSection(
		'cover',
		m.branding_cover(),
		m.branding_upload_cover(),
		m.branding_change_cover()
	)}

	<Card>
		<fieldset class="section">
			<legend class="sj-heading">{m.branding_colour()}</legend>
			<p class="sj-small sj-muted">{m.branding_colour_hint()}</p>
			<div class="swatches">
				{#each swatches as swatch, index (swatch)}
					<label class="swatch" style="--swatch: {swatch}">
						<input
							class="sj-visually-hidden"
							type="radio"
							name="colour"
							value={swatch}
							aria-label={m.branding_swatch({ n: index + 1 })}
							bind:group={colour}
						/>
						{#if colour === swatch}<Icon name="check" size={20} />{/if}
					</label>
				{/each}
			</div>
			{#if fieldText(errors, 'primaryColor')}
				<p class="sj-small error" role="alert">{fieldText(errors, 'primaryColor')}</p>
			{/if}
			<div class="preview" style={previewStyle} aria-hidden="true" inert>
				<Button>{m.book_title()}</Button>
				<StatusChip tone="active">{m.member_paid_chip()}</StatusChip>
			</div>
		</fieldset>
	</Card>

	<Card>
		<TextField
			label={m.branding_welcome_en()}
			dir="ltr"
			error={fieldText(errors, 'welcomeTextEn')}
			bind:value={welcomeEn}
		/>
		<TextField
			label={m.branding_welcome_ar()}
			dir="rtl"
			error={fieldText(errors, 'welcomeTextAr')}
			bind:value={welcomeAr}
		/>
	</Card>

	<div>
		<Button type="submit" disabled={busy}>{m.action_save()}</Button>
	</div>
</form>

<style>
	.section {
		margin: 0;
		padding: 0;
		border: 0;
		min-inline-size: 0;
		display: flex;
		flex-direction: column;
		gap: var(--space-3);
	}
	.section legend {
		padding: 0;
		margin-block-end: var(--space-3);
	}
	.logo-preview {
		inline-size: 96px;
		block-size: 96px;
		border-radius: var(--radius-lg);
		border: 1px solid var(--line);
		object-fit: cover;
	}
	.cover-preview {
		inline-size: 100%;
		block-size: 140px;
		border-radius: var(--radius-md);
		border: 1px solid var(--line);
		object-fit: cover;
	}
	.empty {
		display: grid;
		place-items: center;
		background: var(--surface-sunk);
		color: var(--ink-muted);
	}
	.actions {
		display: flex;
		flex-wrap: wrap;
		gap: var(--space-2);
	}
	.picker {
		cursor: pointer;
	}
	.picker:focus-within {
		outline: 2px solid var(--focus);
		outline-offset: 2px;
	}
	.swatches {
		display: flex;
		flex-wrap: wrap;
		gap: var(--space-3);
	}
	.swatch {
		inline-size: 40px;
		block-size: 40px;
		border-radius: var(--radius-pill);
		background: var(--swatch);
		border: 1px solid var(--line-strong);
		display: grid;
		place-items: center;
		color: #fff;
		cursor: pointer;
	}
	.swatch :global(.sj-icon) {
		filter: drop-shadow(0 0 1px rgb(0 0 0 / 0.8));
	}
	.swatch:focus-within {
		outline: 2px solid var(--focus);
		outline-offset: 2px;
	}
	.preview {
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		gap: var(--space-3);
		padding: var(--space-3);
		border-radius: var(--radius-md);
		background: var(--surface-sunk);
	}
	.error {
		color: var(--danger);
		margin: 0;
	}
</style>

<script lang="ts">
	import { untrack } from 'svelte';
	import { goto, invalidateAll } from '$app/navigation';
	import { resolve } from '$app/paths';
	import { page } from '$app/state';
	import { academyName, localName, roleName } from '#lib/academy.js';
	import { api } from '#lib/api/client.js';
	import { ApiError, errorText, type FieldErrors } from '#lib/api/errors.js';
	import { formatDate } from '#lib/format.js';
	import { focusFirstInvalid } from '#lib/forms/focus.js';
	import {
		existingAccount,
		inviteFormErrors,
		toSignUpRequest,
		type InviteSignUp
	} from '#lib/forms/invite.js';
	import { m } from '#lib/paraglide/messages.js';
	import { Banner, Button, Card, StatusChip, TextField } from '#lib/ui/index.js';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();

	const preview = $derived(data.preview);
	const academy = $derived(academyName(preview.academy, data.locale));
	const roles = $derived(preview.roles.map((role) => roleName(role, data.locale)).join(', '));
	const description = $derived(
		preview.discipline && preview.level
			? m.invite_og_description_rider({
					academy,
					discipline: localName(preview.discipline, data.locale),
					level: localName(preview.level, data.locale)
				})
			: m.invite_og_description_staff({ academy, role: roles })
	);
	const title = $derived(m.invite_page_title({ academy }));
	const signInAs = (identifier: string) => {
		const query = identifier
			? { returnTo: page.url.pathname, identifier }
			: { returnTo: page.url.pathname };
		return resolve(`/login?${new URLSearchParams(query)}`);
	};
	const signIn = $derived(signInAs(''));

	const initial = untrack(() => data.preview);
	let form = $state<InviteSignUp>({
		displayName: initial.name ?? '',
		phone: initial.phone ?? '',
		email: initial.email ?? '',
		password: ''
	});
	let errors = $state<FieldErrors>({});
	let failure = $state<string>();
	let hasAccount = $state<string | null>(null);
	let busy = $state(false);
	let formElement = $state<HTMLFormElement>();

	const fieldError = (field: string) => {
		const code = errors[field]?.[0];
		return code ? errorText(code) : undefined;
	};

	async function accept(body: object) {
		busy = true;
		failure = undefined;
		try {
			await api(`/invites/${encodeURIComponent(page.params.token ?? '')}/accept`, {
				method: 'POST',
				body
			});
			await invalidateAll();
			await goto(resolve('/'), { replaceState: true });
		} catch (e) {
			const error = e instanceof ApiError ? e : new ApiError(0, 'internal_error');
			if (error.code === 'already_member') {
				await goto(resolve('/?notice=already_member'), { replaceState: true });
				return;
			}
			hasAccount = existingAccount(error, form);
			if (hasAccount !== null) return;
			errors = error.fields;
			if (Object.keys(error.fields).length === 0) failure = errorText(error.code);
			else focusFirstInvalid(formElement);
		} finally {
			busy = false;
		}
	}

	function signUp(event: SubmitEvent) {
		event.preventDefault();
		errors = inviteFormErrors(form, preview);
		if (Object.keys(errors).length === 0) accept(toSignUpRequest(form));
		else focusFirstInvalid(formElement);
	}
</script>

<svelte:head>
	<title>{title}</title>
	<meta name="description" content={description} />
	<meta property="og:type" content="website" />
	<meta property="og:title" content={title} />
	<meta property="og:description" content={description} />
	<meta property="og:site_name" content={academy} />
</svelte:head>

<div class="sj-page invite">
	<Card raised>
		<div class="sj-stack">
			<h1 class="sj-title">{m.invite_title({ academy })}</h1>
			<p class="sj-muted">{m.invite_grants()}</p>
			<div class="sj-row">
				{#each preview.roles as role (role)}
					<StatusChip tone="active">{roleName(role, data.locale)}</StatusChip>
				{/each}
				{#if preview.discipline}
					<StatusChip tone="level">{localName(preview.discipline, data.locale)}</StatusChip>
				{/if}
				{#if preview.level}
					<StatusChip tone="level">{localName(preview.level, data.locale)}</StatusChip>
				{/if}
			</div>
			<p class="sj-small sj-muted">
				{m.invite_expires({ date: formatDate(preview.expiresAt, data.locale) })}
			</p>
			{#if failure}<Banner tone="danger" icon="error">{failure}</Banner>{/if}

			{#if hasAccount !== null}
				<Banner icon="account_circle">{m.invite_has_account({ academy })}</Banner>
				<Button block href={signInAs(hasAccount)}>{m.action_sign_in()}</Button>
			{:else if data.user}
				<Button block disabled={busy} onclick={() => accept({})}>{m.invite_accept()}</Button>
			{:else}
				<form class="sj-stack" bind:this={formElement} onsubmit={signUp} novalidate>
					<h2 class="sj-heading">{m.invite_sign_up()}</h2>
					<TextField
						label={m.field_display_name()}
						autocomplete="name"
						error={fieldError('displayName')}
						required
						bind:value={form.displayName}
					/>
					<TextField
						label={m.field_phone()}
						type="tel"
						autocomplete="tel"
						dir="ltr"
						error={fieldError('phone')}
						readonly={preview.phoneLocked}
						required
						bind:value={form.phone}
					/>
					<TextField
						label={m.field_email_optional()}
						type="email"
						autocomplete="email"
						dir="ltr"
						error={fieldError('email')}
						readonly={!!preview.email}
						bind:value={form.email}
					/>
					<TextField
						label={m.field_password()}
						type="password"
						autocomplete="new-password"
						dir="ltr"
						hint={m.error_password_too_short()}
						error={fieldError('password')}
						required
						bind:value={form.password}
					/>
					<Button type="submit" block disabled={busy}>{m.invite_sign_up()}</Button>
					<Button variant="quiet" href={signIn}>{m.invite_have_account()}</Button>
				</form>
			{/if}
		</div>
	</Card>
</div>

<style>
	.invite {
		max-inline-size: 480px;
	}
</style>

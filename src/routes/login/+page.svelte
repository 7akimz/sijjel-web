<script lang="ts">
	import { goto, invalidateAll } from '$app/navigation';
	import { academyName } from '#lib/academy.js';
	import { api } from '#lib/api/client.js';
	import { ApiError, errorText } from '#lib/api/errors.js';
	import { m } from '#lib/paraglide/messages.js';
	import { Banner, Button, Card, TextField } from '#lib/ui/index.js';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();

	let email = $state('');
	let password = $state('');
	let failure = $state<string>();
	let busy = $state(false);

	const intro = $derived(
		data.tenant.kind === 'academy'
			? m.login_academy_intro({ academy: academyName(data.tenant.academy, data.locale) })
			: m.login_platform_intro()
	);

	async function submit(event: SubmitEvent) {
		event.preventDefault();
		busy = true;
		failure = undefined;
		try {
			await api('/auth/login', { method: 'POST', body: { email: email.trim(), password } });
			await invalidateAll();
			// returnTo is a same-site path checked by safeReturnTo in the load function.
			// eslint-disable-next-line svelte/no-navigation-without-resolve
			await goto(data.returnTo, { replaceState: true });
		} catch (e) {
			failure = errorText(e instanceof ApiError ? e.code : 'internal_error');
		} finally {
			busy = false;
		}
	}
</script>

<svelte:head>
	<title>{m.login_title()}</title>
</svelte:head>

<div class="sj-page login">
	<Card raised>
		<form class="sj-stack" onsubmit={submit} novalidate>
			<h1 class="sj-title">{m.login_title()}</h1>
			<p class="sj-muted">{intro}</p>
			{#if failure}<Banner tone="danger" icon="error">{failure}</Banner>{/if}
			<TextField
				label={m.field_email()}
				type="email"
				name="email"
				autocomplete="email"
				dir="ltr"
				required
				bind:value={email}
			/>
			<TextField
				label={m.field_password()}
				type="password"
				name="password"
				autocomplete="current-password"
				dir="ltr"
				required
				bind:value={password}
			/>
			<Button type="submit" block disabled={busy}>{m.action_sign_in()}</Button>
		</form>
	</Card>
</div>

<style>
	.login {
		max-inline-size: 440px;
	}
</style>

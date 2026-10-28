<script lang="ts">
	import { goto, invalidateAll } from '$app/navigation';
	import { resolve } from '$app/paths';
	import { page } from '$app/state';
	import { academyMark, academyName } from '#lib/academy.js';
	import { isAcademyAdmin } from '#lib/academy/admin.js';
	import { isAcademyStaff } from '#lib/academy/staff.js';
	import { forgetDevice } from '#lib/push/device.js';
	import { isAcademyRider } from '#lib/academy/rider.js';
	import LanguageSwitch from '#lib/components/LanguageSwitch.svelte';
	import StatusPage from '#lib/components/StatusPage.svelte';
	import SubscriptionBanner from '#lib/components/SubscriptionBanner.svelte';
	import ThemeSwitch from '#lib/components/ThemeSwitch.svelte';
	import { api } from '#lib/api/client.js';
	import { ApiError, errorText } from '#lib/api/errors.js';
	import { m } from '#lib/paraglide/messages.js';
	import { AppShell, Banner, Button } from '#lib/ui/index.js';
	import favicon from '#lib/assets/favicon.svg';
	import type { LayoutProps } from './$types';
	import '#lib/styles/tokens.css';
	import '#lib/styles/base.css';
	import '#lib/styles/components.css';

	let { data, children }: LayoutProps = $props();

	const locale = $derived(data.locale);
	const tenant = $derived(data.tenant);
	const knownTenant = $derived(tenant.kind === 'platform' || tenant.kind === 'academy');

	const brand = $derived.by(() => {
		if (tenant.kind !== 'academy') return { name: m.app_name({}, { locale }), mark: 'س' };
		const name = academyName(tenant.academy, locale);
		return {
			name,
			mark: academyMark(tenant.academy.nameEn),
			logo: tenant.academy.logoUrl
		};
	});

	const nav = $derived.by(() => {
		const bookNav =
			tenant.kind === 'academy' && isAcademyRider(data.membership)
				? [
						{
							href: resolve('/(academy)/(rider)/book'),
							label: m.nav_book({}, { locale }),
							icon: 'event_available'
						}
					]
				: [];
		if (tenant.kind === 'platform' && data.user?.isPlatformAdmin) {
			return [
				{
					href: resolve('/(platform)/platform/academies'),
					label: m.nav_academies({}, { locale }),
					icon: 'domain'
				},
				{
					href: resolve('/(platform)/platform/packages'),
					label: m.nav_packages({}, { locale }),
					icon: 'sell'
				},
				{
					href: resolve('/(platform)/platform/disciplines'),
					label: m.nav_disciplines({}, { locale }),
					icon: 'format_list_numbered'
				}
			];
		}
		if (tenant.kind === 'academy' && isAcademyAdmin(data.membership)) {
			return [
				{ href: resolve('/'), label: m.nav_home({}, { locale }), icon: 'home' },
				{
					href: resolve('/(academy)/(staff)/board'),
					label: m.nav_board({}, { locale }),
					icon: 'view_agenda',
					disabled: !data.membership?.setupDone
				},
				...bookNav,
				{
					href: resolve('/(academy)/(staff)/members'),
					label: m.nav_members({}, { locale }),
					icon: 'group'
				},
				{
					href: resolve('/(academy)/(admin)/horses'),
					label: m.nav_horses({}, { locale }),
					icon: 'horseshoe'
				},
				{
					href: resolve('/(academy)/(admin)/settings'),
					label: m.nav_settings({}, { locale }),
					icon: 'settings'
				}
			];
		}
		if (tenant.kind === 'academy' && isAcademyStaff(data.membership)) {
			return [
				{ href: resolve('/'), label: m.nav_home({}, { locale }), icon: 'home' },
				{
					href: resolve('/(academy)/(staff)/board'),
					label: m.nav_board({}, { locale }),
					icon: 'view_agenda',
					disabled: !data.membership?.setupDone
				},
				...bookNav,
				{
					href: resolve('/(academy)/(staff)/members'),
					label: m.nav_members({}, { locale }),
					icon: 'group'
				}
			];
		}
		if (tenant.kind === 'academy' && data.membership) {
			return [{ href: resolve('/'), label: m.nav_home({}, { locale }), icon: 'home' }, ...bookNav];
		}
		return [];
	});

	let signOutFailure = $state<string>();

	async function signOut() {
		signOutFailure = undefined;
		await forgetDevice();
		try {
			await api('/auth/logout', { method: 'POST', body: {} });
		} catch (e) {
			signOutFailure = errorText(e instanceof ApiError ? e.code : 'internal_error');
			return;
		}
		await invalidateAll();
		await goto(resolve('/'));
	}
</script>

<svelte:head>
	<link rel="icon" href={favicon} />
	<link rel="manifest" href="/manifest.webmanifest" />
	<link rel="apple-touch-icon" href="/icons/apple-touch-icon.png" />
	<meta name="mobile-web-app-capable" content="yes" />
</svelte:head>

<AppShell {brand} {nav} current={page.url.pathname} navLabel={m.nav_main({}, { locale })}>
	{#snippet actions()}
		<LanguageSwitch {locale} />
		<ThemeSwitch theme={data.theme} {locale} />
		{#if knownTenant}
			{#if data.user}
				{#if tenant.kind === 'academy' && isAcademyStaff(data.membership)}
					<Button
						variant="quiet"
						icon="notifications"
						href={resolve('/(academy)/(staff)/reminders')}
						label={m.nav_reminders({}, { locale })}
					/>
				{/if}
				<Button
					variant="quiet"
					icon="logout"
					label={m.action_sign_out({}, { locale })}
					onclick={signOut}
				/>
			{:else if page.url.pathname !== '/login'}
				<Button variant="secondary" href={resolve('/login')}
					>{m.action_sign_in({}, { locale })}</Button
				>
			{/if}
		{/if}
	{/snippet}

	{#if signOutFailure}
		<div class="sj-page sign-out-failure">
			<Banner tone="danger" icon="error">{signOutFailure}</Banner>
		</div>
	{/if}
	{#if tenant.kind === 'unknown'}
		<StatusPage
			icon="travel_explore"
			title={m.status_unknown_title({}, { locale })}
			body={m.status_unknown_body({}, { locale })}
		/>
	{:else if tenant.kind === 'unavailable'}
		<StatusPage
			icon="cloud_off"
			title={m.status_unavailable_title({}, { locale })}
			body={m.status_unavailable_body({}, { locale })}
		/>
	{:else}
		{#if tenant.kind === 'academy'}
			<SubscriptionBanner membership={data.membership} {locale} />
		{/if}
		{@render children()}
	{/if}

	{#snippet footer()}
		{#if tenant.kind === 'academy'}{m.powered_by({}, { locale })}{/if}
	{/snippet}
</AppShell>

<style>
	.sign-out-failure {
		padding-block-end: 0;
	}
</style>

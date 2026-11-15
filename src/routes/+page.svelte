<script lang="ts">
	import { resolve } from '$app/paths';
	import { page } from '$app/state';
	import { academyName } from '#lib/academy.js';
	import AcademyCover from '#lib/components/AcademyCover.svelte';
	import AcademyHome from '#lib/components/AcademyHome.svelte';
	import MyAcademies from '#lib/components/MyAcademies.svelte';
	import RiderHome from '#lib/components/RiderHome.svelte';
	import SetupChecklist from '#lib/components/SetupChecklist.svelte';
	import StaffToday from '#lib/components/StaffToday.svelte';
	import { isAcademyAdmin } from '#lib/academy/admin.js';
	import { alreadyMemberText } from '#lib/forms/member.js';
	import { m } from '#lib/paraglide/messages.js';
	import { Banner, Button, EmptyState } from '#lib/ui/index.js';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();

	const academy = $derived(data.tenant.kind === 'academy' ? data.tenant.academy : null);
	const welcome = $derived(
		academy ? (data.locale === 'ar' ? academy.welcomeTextAr : academy.welcomeTextEn) : null
	);
	const name = $derived(academy ? academyName(academy, data.locale) : m.app_name());
	const alreadyMember = $derived(page.url.searchParams.get('notice') === 'already_member');
</script>

{#snippet signInPrompt(title: string)}
	<EmptyState icon="login" {title}>
		{#snippet action()}
			<Button href={resolve('/login')}>{m.action_sign_in()}</Button>
		{/snippet}
	</EmptyState>
{/snippet}

<svelte:head>
	<title>{name}</title>
	<meta property="og:title" content={name} />
	<meta property="og:site_name" content={name} />
	{#if academy?.coverUrl}
		<meta property="og:image" content={new URL(academy.coverUrl, page.url.origin).href} />
	{/if}
</svelte:head>

{#if academy}
	{#if academy.coverUrl}<AcademyCover
			cover={academy.coverUrl}
			logo={academy.logoUrl ?? null}
		/>{/if}
	<div class="sj-page">
		<div class="sj-stack">
			<h1 class="sj-title">{m.home_welcome({ academy: name })}</h1>
			{#if welcome}<p class="sj-muted">{welcome}</p>{/if}
		</div>
		{#if alreadyMember && data.membership}
			<Banner icon="info">{alreadyMemberText(data.membership.status)}</Banner>
		{/if}
		{#if data.setup}<SetupChecklist state={data.setup} academyName={name} />{/if}
		{#if data.rider}
			<RiderHome
				summary={data.rider.plan}
				bookings={data.rider.bookings}
				publicKey={data.rider.publicKey}
				locale={data.locale}
				ridersBook={data.membership?.ridersBook !== false}
			/>
		{:else if data.membership}
			<StaffToday
				board={data.board}
				setupDone={data.membership.setupDone}
				admin={isAcademyAdmin(data.membership)}
				ridersBook={data.membership.ridersBook}
			/>
			<AcademyHome membership={data.membership} locale={data.locale} />
		{:else if data.user}
			<EmptyState icon="lock" title={m.home_not_member()} />
		{:else}
			{@render signInPrompt(m.home_signed_out())}
		{/if}
	</div>
{:else if data.user && data.academies}
	<MyAcademies academies={data.academies} host={page.url.host} locale={data.locale} />
{:else}
	<div class="sj-page">
		<h1 class="sj-title">{m.platform_home_title()}</h1>
		{@render signInPrompt(m.platform_home_signed_out())}
	</div>
{/if}

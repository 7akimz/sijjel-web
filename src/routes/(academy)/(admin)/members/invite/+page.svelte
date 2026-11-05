<script lang="ts">
	import { invalidateAll } from '$app/navigation';
	import { resolve } from '$app/paths';
	import InviteMemberForm from '#lib/components/InviteMemberForm.svelte';
	import { ridersText } from '#lib/forms/subscription.js';
	import InviteShareCard from '#lib/components/InviteShareCard.svelte';
	import { academyName } from '#lib/academy.js';
	import type { CreatedAcademyInvite } from '#lib/api/member-types.js';
	import type { InviteMemberForm as InviteForm } from '#lib/forms/invite-member.js';
	import { m } from '#lib/paraglide/messages.js';
	import { Button, Card } from '#lib/ui/index.js';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();

	let created = $state<{ invite: CreatedAcademyInvite; form: InviteForm }>();
	let formKey = $state(0);

	const title = $derived(
		data.kind === 'staff' ? m.invite_page_title_staff() : m.invite_page_title_new()
	);
	const back = $derived(
		data.kind === 'staff'
			? { href: resolve('/(academy)/(admin)/settings/staff'), label: m.staff_back() }
			: { href: resolve('/(academy)/(staff)/members'), label: m.back_to_members() }
	);
	const academy = $derived(data.tenant.kind === 'academy' ? data.tenant.academy : null);
	const shareLocale = $derived(academy?.defaultLanguage ?? data.locale);
	const message = $derived.by(() => {
		if (!created || !academy) return '';
		const values = { name: created.form.name.trim(), academy: academyName(academy, shareLocale) };
		return created.form.role === 'rider'
			? m.invite_share_message_rider(values, { locale: shareLocale })
			: m.invite_share_message_staff(values, { locale: shareLocale });
	});
</script>

<svelte:head>
	<title>{title}</title>
</svelte:head>

<div class="sj-page narrow">
	<div>
		<Button variant="quiet" icon="arrow_back" href={back.href}>{back.label}</Button>
	</div>
	<div class="sj-stack">
		<h1 class="sj-title">{title}</h1>
		{#if data.kind === 'rider'}<p class="sj-muted">{ridersText(data.riders, data.locale)}</p>{/if}
	</div>
	<Card raised>
		{#if created}
			<InviteShareCard
				invite={created.invite}
				name={created.form.name.trim()}
				{message}
				phone={created.invite.phone}
				locale={data.locale}
			/>
			<div>
				<Button
					variant="secondary"
					icon="person_add"
					onclick={async () => {
						await invalidateAll();
						created = undefined;
						formKey++;
					}}
				>
					{m.invite_another()}
				</Button>
			</div>
		{:else}
			{#key formKey}
				<InviteMemberForm
					kind={data.kind}
					disciplines={data.disciplines}
					plans={data.plans}
					locale={data.locale}
					ridersAllowed={data.membership?.setupDone ?? false}
					riderLimitReached={data.riders.limit !== null && data.riders.count >= data.riders.limit}
					oncreated={(invite, form) => (created = { invite, form })}
				/>
			{/key}
		{/if}
	</Card>
</div>

<style>
	.narrow {
		max-inline-size: 560px;
	}
</style>

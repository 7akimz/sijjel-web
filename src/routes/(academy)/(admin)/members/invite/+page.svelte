<script lang="ts">
	import { invalidateAll } from '$app/navigation';
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
	<title>{m.invite_page_title_new()}</title>
</svelte:head>

<div class="sj-page narrow">
	<div class="sj-stack">
		<h1 class="sj-title">{m.invite_page_title_new()}</h1>
		<p class="sj-muted">{ridersText(data.riders, data.locale)}</p>
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
					disciplines={data.disciplines}
					plans={data.plans}
					rules={data.rules}
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

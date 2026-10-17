<script lang="ts">
	import { page } from '$app/state';
	import { academyMark, academyName } from '#lib/academy.js';
	import InviteLink from '#lib/components/InviteLink.svelte';
	import NewAcademyForm from '#lib/components/NewAcademyForm.svelte';
	import { api } from '#lib/api/client.js';
	import { ApiError, errorText } from '#lib/api/errors.js';
	import type { AcademySummary, CreatedInvite } from '#lib/api/types.js';
	import { m } from '#lib/paraglide/messages.js';
	import { Banner, Button, EmptyState, ListRow, StatusChip } from '#lib/ui/index.js';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();

	let created = $state<AcademySummary[]>([]);
	let creating = $state(false);
	let notice = $state<string>();
	let failure = $state<string>();
	let invites = $state<Record<string, CreatedInvite>>({});
	let inviting = $state<string>();

	const academies = $derived([
		...created,
		...data.academies.filter((a) => !created.some((c) => c.id === a.id))
	]);
	const disciplineNames = $derived(
		new Map(
			data.disciplines.map((d) => [d.key, data.locale === 'ar' ? d.nameAr : d.nameEn] as const)
		)
	);

	function onCreated(academy: AcademySummary) {
		created = [academy, ...created];
		creating = false;
		notice = m.academy_created();
	}

	async function inviteOwner(academy: AcademySummary) {
		inviting = academy.id;
		failure = undefined;
		try {
			const invite = await api<CreatedInvite>(`/platform/academies/${academy.id}/owner-invites`, {
				method: 'POST',
				body: {}
			});
			invites = { ...invites, [academy.id]: invite };
		} catch (e) {
			failure = errorText(e instanceof ApiError ? e.code : 'internal_error');
		} finally {
			inviting = undefined;
		}
	}
</script>

<svelte:head>
	<title>{m.academies_title()}</title>
</svelte:head>

<div class="sj-page">
	<div class="sj-page-head">
		<h1 class="sj-title">{m.academies_title()}</h1>
		{#if !creating}
			<Button icon="add" onclick={() => ((creating = true), (notice = undefined))}>
				{m.academy_new()}
			</Button>
		{/if}
	</div>

	{#if notice}<Banner icon="check_circle">{notice}</Banner>{/if}
	{#if failure}<Banner tone="danger" icon="error">{failure}</Banner>{/if}

	{#if creating}
		<NewAcademyForm
			disciplines={data.disciplines}
			rootHost={page.url.host}
			locale={data.locale}
			oncreated={onCreated}
			oncancel={() => (creating = false)}
		/>
	{/if}

	{#if academies.length === 0}
		{#if !creating}
			<EmptyState icon="domain" title={m.academies_empty_title()}>
				{m.academies_empty_body()}
			</EmptyState>
		{/if}
	{:else}
		<ul class="sj-list" role="list">
			{#each academies as academy (academy.id)}
				{@const name = academyName(academy, data.locale)}
				<li class="academy">
					<ListRow
						initials={academyMark(academy.nameEn)}
						title={name}
						subtitle="{academy.slug}.{page.url.host}"
						subtitleDir="ltr"
					>
						{#snippet trailing()}
							<Button
								variant="secondary"
								icon="person_add"
								disabled={inviting === academy.id}
								onclick={() => inviteOwner(academy)}
							>
								{m.academy_invite_owner()}
							</Button>
						{/snippet}
					</ListRow>
					<div class="details sj-stack">
						<div class="sj-row">
							{#each academy.disciplines as key (key)}
								<StatusChip tone="level">{disciplineNames.get(key) ?? key}</StatusChip>
							{/each}
							{#if academy.ownerCount > 0}
								<StatusChip tone="active" dot>
									{m.academy_owners({ count: academy.ownerCount })}
								</StatusChip>
							{:else}
								<StatusChip tone="pending" dot>{m.academy_no_owner()}</StatusChip>
							{/if}
						</div>
						{#if invites[academy.id]}
							<InviteLink invite={invites[academy.id]} locale={data.locale} />
						{/if}
					</div>
				</li>
			{/each}
		</ul>
	{/if}
</div>

<style>
	ul {
		margin: 0;
		padding: 0;
		list-style: none;
	}
	.academy + .academy {
		border-block-start: 1px solid var(--line);
	}
	.details {
		padding: 0 var(--space-4) var(--space-4);
		padding-inline-start: calc(var(--space-4) + 40px + var(--space-3));
	}
</style>

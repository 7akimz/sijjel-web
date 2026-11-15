<script lang="ts">
	import { resolve } from '$app/paths';
	import { academyMark, academyName, roleName } from '#lib/academy.js';
	import type { Locale, MyAcademy, Role } from '#lib/api/types.js';
	import { m } from '#lib/paraglide/messages.js';
	import { accentVars } from '#lib/theme/accent.js';
	import { EmptyState, Icon } from '#lib/ui/index.js';

	type Props = { academies: MyAcademy[]; host: string; locale: Locale };
	let { academies, host, locale }: Props = $props();

	const mainRole = (roles: Role[]): Role =>
		(['admin', 'trainer', 'rider'] as const).find((role) => roles.includes(role)) ?? roles[0];

	// Each mark wears its academy's own accent, as in that academy's app bar.
	function markStyle(colour: string): string {
		const { light, dark } = accentVars(colour);
		if (!light['--accent']) return '';
		return `--mark:${light['--accent']};--on-mark:${light['--on-accent']};--mark-dark:${dark['--accent']};--on-mark-dark:${dark['--on-accent']}`;
	}
</script>

<div class="sj-page">
	<h1 class="sj-title">{m.my_academies_title({}, { locale })}</h1>
	{#if academies.length === 0}
		<EmptyState icon="link" title={m.my_academies_empty_title({}, { locale })}>
			{m.my_academies_empty_body({}, { locale })}
		</EmptyState>
	{:else}
		<ul class="sj-list" role="list">
			{#each academies as academy (academy.slug)}
				<li>
					<a
						class="academy"
						href={resolve('/open/[slug]', { slug: academy.slug })}
						data-sveltekit-reload
						data-sveltekit-preload-data="off"
					>
						<span class="mark" style={markStyle(academy.primaryColor)} aria-hidden="true">
							{academyMark(academy.nameEn)}
						</span>
						<span class="main">
							<span class="name">{academyName(academy, locale)}</span>
							<span class="sub">
								<span class="sj-chip">{roleName(mainRole(academy.roles), locale)}</span>
								<span class="sj-small sj-muted" dir="ltr">{academy.slug}.{host}</span>
							</span>
						</span>
						<Icon name="chevron_right" size={20} directional />
					</a>
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
	li + li {
		border-block-start: 1px solid var(--line);
	}
	.academy {
		display: flex;
		align-items: center;
		gap: var(--space-3);
		padding: var(--space-3) var(--space-4);
		min-block-size: 64px;
		color: inherit;
		text-decoration: none;
	}
	.academy:hover {
		background: var(--hover-veil);
	}
	.mark {
		inline-size: 40px;
		block-size: 40px;
		border-radius: var(--radius-md);
		display: grid;
		place-items: center;
		flex: none;
		font: 700 15px/1 var(--font-display);
		background: var(--mark, var(--accent));
		color: var(--on-mark, var(--on-accent));
	}
	:global(:root[data-theme='dark']) .mark {
		background: var(--mark-dark, var(--accent));
		color: var(--on-mark-dark, var(--on-accent));
	}
	@media (prefers-color-scheme: dark) {
		:global(:root:not([data-theme='light'])) .mark {
			background: var(--mark-dark, var(--accent));
			color: var(--on-mark-dark, var(--on-accent));
		}
	}
	.main {
		flex: 1;
		display: flex;
		flex-direction: column;
		gap: var(--space-1);
		min-inline-size: 0;
	}
	.name {
		font-weight: 600;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}
	.sub {
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		gap: var(--space-2);
	}
	.academy :global(.sj-icon) {
		color: var(--ink-muted);
	}
</style>

<script lang="ts">
	import { resolve } from '$app/paths';
	import { m } from '#lib/paraglide/messages.js';
	import { Icon } from '#lib/ui/index.js';

	const rows = [
		{
			href: resolve('/(academy)/(admin)/settings/hours'),
			icon: 'schedule',
			title: m.settings_hours_title(),
			body: m.settings_hours_body()
		},
		{
			href: resolve('/(academy)/(admin)/settings/booking-rules'),
			icon: 'event_available',
			title: m.settings_rules_title(),
			body: m.settings_rules_body()
		},
		{
			href: resolve('/(academy)/(admin)/settings/plans'),
			icon: 'payments',
			title: m.settings_plans_title(),
			body: m.settings_plans_body()
		},
		{
			href: resolve('/(academy)/(admin)/settings/arenas'),
			icon: 'fence',
			title: m.settings_arenas_title(),
			body: m.settings_arenas_body()
		},
		{
			href: resolve('/(academy)/(admin)/settings/closed-dates'),
			icon: 'event_busy',
			title: m.settings_closed_title(),
			body: m.settings_closed_body()
		},
		{
			href: resolve('/(academy)/(admin)/settings/disciplines'),
			icon: 'format_list_numbered',
			title: m.settings_disciplines_title(),
			body: m.settings_disciplines_body()
		},
		{
			href: resolve('/(academy)/(admin)/settings/branding'),
			icon: 'palette',
			title: m.settings_branding_title(),
			body: m.settings_branding_body()
		},
		{
			href: resolve('/(academy)/(admin)/settings/subscription'),
			icon: 'receipt_long',
			title: m.settings_subscription_title(),
			body: m.settings_subscription_body()
		}
	];
</script>

<svelte:head>
	<title>{m.settings_title()}</title>
</svelte:head>

<div class="sj-page">
	<h1 class="sj-title">{m.settings_title()}</h1>
	<ul class="sj-list" role="list">
		{#each rows as row (row.href)}
			<li>
				<a class="sj-list__row row" href={row.href}>
					<span class="sj-avatar" aria-hidden="true"><Icon name={row.icon} size={20} /></span>
					<span class="sj-list__main">
						<span class="row-title">{row.title}</span>
						<span class="sj-small sj-muted">{row.body}</span>
					</span>
					<Icon name="chevron_right" directional />
				</a>
			</li>
		{/each}
	</ul>
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
	.row {
		color: inherit;
		text-decoration: none;
	}
	.row:hover {
		background: var(--hover-veil);
	}
	.row-title {
		font-weight: 600;
	}
</style>

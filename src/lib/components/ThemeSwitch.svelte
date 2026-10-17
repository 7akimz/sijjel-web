<script lang="ts">
	import type { Locale } from '#lib/api/types.js';
	import { m } from '#lib/paraglide/messages.js';
	import { nextTheme, type Theme } from '#lib/theme/theme.js';
	import { Button } from '#lib/ui/index.js';

	type Props = { theme: Theme; locale: Locale; save?: (theme: Theme) => Promise<void> };
	let { theme, locale, save = saveThemeCookie }: Props = $props();

	let current = $state<Theme>();
	const shown = $derived(current ?? theme);

	const names = {
		system: m.theme_system,
		light: m.theme_light,
		dark: m.theme_dark
	};
	const icons = { system: 'contrast', light: 'light_mode', dark: 'dark_mode' };

	async function saveThemeCookie(value: Theme) {
		await fetch('/theme', {
			method: 'POST',
			headers: { 'content-type': 'application/json' },
			body: JSON.stringify({ theme: value })
		});
	}

	function cycle() {
		const next = nextTheme(shown);
		current = next;
		if (next === 'system') document.documentElement.removeAttribute('data-theme');
		else document.documentElement.dataset.theme = next;
		save(next).catch(() => {});
	}
</script>

<Button
	variant="quiet"
	icon={icons[shown]}
	label={m.theme_switch_label({ theme: names[shown]({}, { locale }) }, { locale })}
	onclick={cycle}
/>

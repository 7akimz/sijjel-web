<script lang="ts">
	import type { Locale } from '#lib/api/types.js';
	import { m } from '#lib/paraglide/messages.js';
	import { setLocale } from '#lib/paraglide/runtime.js';

	let { locale }: { locale: Locale } = $props();

	const other = $derived<Locale>(locale === 'ar' ? 'en' : 'ar');
</script>

<button class="sj-btn sj-btn--quiet" type="button" lang={other} onclick={() => setLocale(other)}>
	{m.language_switch_label({}, { locale })}
</button>

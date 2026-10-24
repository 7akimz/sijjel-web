<script lang="ts">
	import { resolve } from '$app/paths';
	import type { SetupState } from '#lib/api/academy-types.js';
	import { nextSetupStep, type SetupStep } from '#lib/forms/setup.js';
	import { m } from '#lib/paraglide/messages.js';
	import { setupHref } from '#lib/setup.js';
	import { Button } from '#lib/ui/index.js';

	let { state, current }: { state: SetupState; current: SetupStep } = $props();

	const next = $derived(nextSetupStep(state, current));
	const labels: Record<SetupStep | 'invite', () => string> = {
		hours: m.setup_next_hours,
		arenas: m.setup_next_arenas,
		horses: m.setup_next_horses,
		invite: m.setup_next_invite
	};
	const href = $derived(
		next === 'invite' ? resolve('/(academy)/(admin)/members/invite') : setupHref(next)
	);
</script>

<div class="next">
	<Button {href}>{labels[next]()}</Button>
</div>

<style>
	.next {
		display: flex;
		justify-content: flex-end;
	}
</style>

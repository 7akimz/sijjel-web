<script lang="ts">
	import type { CreatedInvite, Locale } from '#lib/api/types.js';
	import { formatDate } from '#lib/format.js';
	import { m } from '#lib/paraglide/messages.js';
	import { Button } from '#lib/ui/index.js';

	let { invite, locale }: { invite: CreatedInvite; locale: Locale } = $props();

	const id = $props.id();
	let input = $state<HTMLInputElement>();
	let copied = $state(false);

	async function copy() {
		try {
			await navigator.clipboard.writeText(invite.url);
			copied = true;
		} catch {
			input?.select();
		}
	}
</script>

<div class="sj-field">
	<label class="sj-label" for={id}>{m.academy_invite_link()}</label>
	<div class="sj-row link">
		<input
			{id}
			bind:this={input}
			class="sj-input"
			dir="ltr"
			readonly
			value={invite.url}
			aria-describedby="{id}-expiry"
			onfocus={() => input?.select()}
		/>
		<Button variant="secondary" icon={copied ? 'check' : 'content_copy'} onclick={copy}>
			{copied ? m.action_copied() : m.action_copy()}
		</Button>
	</div>
	<span class="sj-hint" id="{id}-expiry">
		{m.academy_invite_expires({ date: formatDate(invite.expiresAt, locale) })}
	</span>
</div>

<style>
	.link {
		flex-wrap: nowrap;
	}
	.link input {
		flex: 1;
		min-inline-size: 0;
	}
</style>

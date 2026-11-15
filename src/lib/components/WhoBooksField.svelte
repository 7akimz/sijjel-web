<script lang="ts">
	import type { Locale } from '#lib/api/types.js';
	import { m } from '#lib/paraglide/messages.js';

	type Props = { ridersBook: boolean; locale: Locale };
	let { ridersBook = $bindable(), locale }: Props = $props();

	const name = $props.id();
	let choice = $derived(ridersBook ? 'riders' : 'staff');
</script>

<fieldset class="sj-stack">
	<legend class="sj-label">{m.academy_who_books({}, { locale })}</legend>
	<label class="choice">
		<input
			type="radio"
			{name}
			value="riders"
			checked={choice === 'riders'}
			onchange={() => (ridersBook = true)}
		/>
		<span class="text">
			{m.academy_riders_book({}, { locale })}
			<span class="sj-hint">{m.academy_riders_book_hint({}, { locale })}</span>
		</span>
	</label>
	<label class="choice">
		<input
			type="radio"
			{name}
			value="staff"
			checked={choice === 'staff'}
			onchange={() => (ridersBook = false)}
		/>
		<span class="text">
			{m.academy_staff_book({}, { locale })}
			<span class="sj-hint">{m.academy_staff_book_hint({}, { locale })}</span>
		</span>
	</label>
</fieldset>

<style>
	fieldset {
		border: 0;
		margin: 0;
		padding: 0;
	}
	.choice {
		display: flex;
		align-items: flex-start;
		gap: var(--space-3);
		padding: var(--space-3);
		border-radius: var(--radius-md);
		background: var(--surface);
		border: 1px solid var(--line);
		cursor: pointer;
	}
	.choice input {
		margin-block-start: 3px;
		inline-size: 20px;
		block-size: 20px;
		accent-color: var(--accent);
	}
	.choice:has(input:checked) {
		border-color: var(--accent);
		box-shadow: inset 0 0 0 1px var(--accent);
	}
	.text {
		display: flex;
		flex-direction: column;
		gap: 2px;
	}
</style>

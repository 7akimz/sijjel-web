<script lang="ts">
	type Props = { name: string; size?: 20 | 24; filled?: boolean; directional?: boolean };
	let { name, size = 24, filled = false, directional = false }: Props = $props();
</script>

<span
	class={[
		'sj-icon',
		size === 20 && 'sj-icon--sm',
		filled && 'sj-icon--filled',
		directional && 'sj-icon--directional'
	]}
	aria-hidden="true">{name}</span
>

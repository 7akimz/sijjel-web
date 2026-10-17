<script lang="ts">
	type Props = { label: string; checked?: boolean; name?: string; value?: string };
	let { label, checked = $bindable(false), name, value }: Props = $props();
</script>

<label class="sj-check"><input type="checkbox" {name} {value} bind:checked />{label}</label>

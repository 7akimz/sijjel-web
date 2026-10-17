<script lang="ts">
	type Props = {
		label: string;
		checked?: boolean;
		name?: string;
		value?: string;
		invalid?: boolean;
		describedBy?: string;
	};
	let {
		label,
		checked = $bindable(false),
		name,
		value,
		invalid = false,
		describedBy
	}: Props = $props();
</script>

<label class="sj-check"
	><input
		type="checkbox"
		{name}
		{value}
		aria-invalid={invalid ? 'true' : undefined}
		aria-describedby={describedBy}
		bind:checked
	/>{label}</label
>

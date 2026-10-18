<script lang="ts">
	type Props = {
		label: string;
		checked?: boolean;
		name?: string;
		value?: string;
		invalid?: boolean;
		describedBy?: string;
		onchange?: (checked: boolean) => void;
	};
	let {
		label,
		checked = $bindable(false),
		name,
		value,
		invalid = false,
		describedBy,
		onchange
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
		onchange={() => onchange?.(checked)}
	/>{label}</label
>

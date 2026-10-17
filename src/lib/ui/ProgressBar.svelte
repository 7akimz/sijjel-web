<script lang="ts">
	type Props = { value: number; max: number; label: string };
	let { value, max, label }: Props = $props();
</script>

<div
	class="bar"
	role="progressbar"
	aria-label={label}
	aria-valuemin="0"
	aria-valuemax={max}
	aria-valuenow={value}
>
	<span style:inline-size="{max > 0 ? (value / max) * 100 : 0}%"></span>
</div>

<style>
	.bar {
		block-size: 6px;
		border-radius: 3px;
		background: var(--surface-sunk);
		overflow: hidden;
	}
	span {
		display: block;
		block-size: 100%;
		background: var(--accent);
		transition: inline-size 200ms ease;
	}
</style>

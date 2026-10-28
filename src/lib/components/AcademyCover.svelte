<script lang="ts">
	type Props = { cover: string; logo: string | null };
	let { cover, logo }: Props = $props();
</script>

<div class="cover" class:has-logo={!!logo}>
	<img class="photo" src={cover} alt="" />
	{#if logo}
		<div class="inner">
			<img class="logo" src={logo} alt="" />
		</div>
	{/if}
</div>

<style>
	.cover {
		position: relative;
	}
	.cover.has-logo {
		margin-block-end: 36px;
	}
	.photo {
		display: block;
		inline-size: 100%;
		block-size: 160px;
		object-fit: cover;
		object-position: center;
		background: var(--surface-sunk);
	}
	.inner {
		position: absolute;
		inset-inline: 0;
		inset-block-end: 0;
		max-inline-size: var(--content-max);
		margin-inline: auto;
		padding-inline: var(--space-4);
	}
	.logo {
		display: block;
		inline-size: 72px;
		block-size: 72px;
		margin-block-end: -36px;
		border-radius: var(--radius-lg);
		border: 3px solid var(--ground);
		background: var(--surface);
		object-fit: cover;
	}
	@media (min-width: 720px) {
		.photo {
			block-size: 200px;
		}
	}
</style>

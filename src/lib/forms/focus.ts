import { tick } from 'svelte';

// Moves keyboard and screen-reader users to the first field that needs fixing.
export async function focusFirstInvalid(form: HTMLFormElement | undefined) {
	await tick();
	form?.querySelector<HTMLElement>('[aria-invalid="true"]')?.focus();
}

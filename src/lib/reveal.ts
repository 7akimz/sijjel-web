// Scrolls a notice that appears after saving into view, since the save button can sit far below
// it on a phone. Changing the parameter (a save count) scrolls again on the next save.
export function reveal(node: HTMLElement, saves: number) {
	const show = () => {
		const smooth = !matchMedia('(prefers-reduced-motion: reduce)').matches;
		node.scrollIntoView({ block: 'nearest', behavior: smooth ? 'smooth' : 'auto' });
	};
	show();
	return {
		update(next: number) {
			if (next === saves) return;
			saves = next;
			show();
		}
	};
}

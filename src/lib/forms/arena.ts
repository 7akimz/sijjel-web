import type { FieldErrors } from '#lib/api/errors.js';

export function arenaErrors(arena: { name: string; capacity: number }): FieldErrors {
	const errors: FieldErrors = {};
	const name = arena.name.trim();
	if (!name) errors.name = ['name_required'];
	else if ([...name].length > 60) errors.name = ['name_too_long'];
	if (!Number.isInteger(arena.capacity) || arena.capacity < 1 || arena.capacity > 50) {
		errors.capacity = ['capacity_invalid'];
	}
	return errors;
}

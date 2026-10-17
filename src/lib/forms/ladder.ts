export interface LadderRow {
	nameEn: string;
	nameAr: string;
}

export const MAX_LEVELS = 12;
const MAX_NAME_LENGTH = 40;

export function moveRow(rows: LadderRow[], from: number, to: number): LadderRow[] {
	if (to < 0 || to >= rows.length || from === to) return rows;
	const next = [...rows];
	const [row] = next.splice(from, 1);
	next.splice(to, 0, row);
	return next;
}

export function addRow(rows: LadderRow[]): LadderRow[] {
	return [...rows, { nameEn: '', nameAr: '' }];
}

export function removeRow(rows: LadderRow[], index: number): LadderRow[] {
	return rows.filter((_, i) => i !== index);
}

export function trimLadder(rows: LadderRow[]): LadderRow[] {
	return rows.map((row) => ({ nameEn: row.nameEn.trim(), nameAr: row.nameAr.trim() }));
}

export function ladderErrors(rows: LadderRow[]): string[] {
	const codes = new Set<string>();
	if (rows.length === 0 || rows.length > MAX_LEVELS) codes.add('levels_count_invalid');
	const seen = new Set<string>();
	for (const { nameEn, nameAr } of trimLadder(rows)) {
		if (!nameEn || !nameAr) codes.add('level_name_required');
		if ([...nameEn].length > MAX_NAME_LENGTH || [...nameAr].length > MAX_NAME_LENGTH) {
			codes.add('level_name_too_long');
		}
		const key = nameEn.toLowerCase();
		if (nameEn && seen.has(key)) codes.add('level_duplicate');
		seen.add(key);
	}
	return [...codes];
}

// normalizeTime turns shorthand such as "1800", "930" or "9:30" into 24-hour HH:MM, and leaves
// anything it can't read as a valid time unchanged for validation to report.
export function normalizeTime(value: string): string {
	const text = value.trim();
	const match = /^(\d{1,2}):?(\d{2})$/.exec(text) ?? /^(\d{1,2})()$/.exec(text);
	if (!match) return text;
	const hours = Number(match[1]);
	const minutes = Number(match[2] || '0');
	if (hours > 23 || minutes > 59) return text;
	return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
}

const ARABIC_ZERO = 0x0660;
const PERSIAN_ZERO = 0x06f0;

// Arabic-Indic and Persian keyboards type their own digits; times are stored with ASCII ones.
function asciiDigits(value: string): string {
	return value.replace(/[٠-٩۰-۹]/g, (c) => {
		const code = c.charCodeAt(0);
		return String(code - (code >= PERSIAN_ZERO ? PERSIAN_ZERO : ARABIC_ZERO));
	});
}

// normalizeTime turns shorthand such as "1800", "930", "9.30" or "24:00" into 24-hour HH:MM,
// and leaves anything it can't read as a valid time for validation to report.
export function normalizeTime(value: string): string {
	const text = asciiDigits(value.trim()).replace(/[.٫]/g, ':');
	const match = /^(\d{1,2}):?(\d{2})$/.exec(text) ?? /^(\d{1,2})()$/.exec(text);
	if (!match) return text;
	const hours = Number(match[1]);
	const minutes = Number(match[2] || '0');
	if (hours === 24 && minutes === 0) return '00:00';
	if (hours > 23 || minutes > 59) return text;
	return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
}

export function isValidTime(value: string): boolean {
	const match = /^(\d\d):(\d\d)$/.exec(value);
	return !!match && Number(match[1]) <= 23 && Number(match[2]) <= 59;
}

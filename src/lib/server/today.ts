// academyToday is the calendar date (YYYY-MM-DD) in the academy's time zone.
export function academyToday(timeZone: string, now = new Date()): string {
	return new Intl.DateTimeFormat('en-CA', { timeZone }).format(now);
}

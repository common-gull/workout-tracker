/**
 * Date utilities that handle timezone-safe date operations
 */

/**
 * Get the current date in YYYY-MM-DD format using local timezone
 * This avoids timezone offset issues when converting to ISO string
 */
export function getTodayLocalDate(): string {
	const now = new Date();
	const year = now.getFullYear();
	const month = String(now.getMonth() + 1).padStart(2, '0');
	const day = String(now.getDate()).padStart(2, '0');
	return `${year}-${month}-${day}`;
}

/**
 * Convert a Date object to YYYY-MM-DD format using local timezone
 * @param date The date to format
 * @returns Date string in YYYY-MM-DD format
 */
export function formatLocalDate(date: Date): string {
	const year = date.getFullYear();
	const month = String(date.getMonth() + 1).padStart(2, '0');
	const day = String(date.getDate()).padStart(2, '0');
	return `${year}-${month}-${day}`;
}

/**
 * Parse a YYYY-MM-DD string into a Date object at midnight local time
 * @param dateString Date string in YYYY-MM-DD format
 * @returns Date object set to midnight local time
 */
export function parseLocalDate(dateString: string): Date {
	const [year, month, day] = dateString.split('-').map(Number);
	return new Date(year, month - 1, day);
}

/**
 * Get tomorrow's date in YYYY-MM-DD format using local timezone
 */
export function getTomorrowLocalDate(): string {
	const tomorrow = new Date();
	tomorrow.setDate(tomorrow.getDate() + 1);
	return formatLocalDate(tomorrow);
}

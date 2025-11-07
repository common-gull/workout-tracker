/**
 * Calendar utility functions
 */

export interface CalendarDay {
	date: Date;
	dateString: string; // YYYY-MM-DD format
	day: number;
	isCurrentMonth: boolean;
	isToday: boolean;
}

/**
 * Get calendar days for a given month
 * Includes padding days from previous/next month
 */
export function getCalendarDays(year: number, month: number): CalendarDay[] {
	const days: CalendarDay[] = [];
	const firstDay = new Date(year, month, 1);
	const lastDay = new Date(year, month + 1, 0);
	const today = new Date();
	today.setHours(0, 0, 0, 0);

	// Get day of week for first day (0 = Sunday, 6 = Saturday)
	const startDayOfWeek = firstDay.getDay();

	// Add padding days from previous month
	const prevMonthLastDay = new Date(year, month, 0).getDate();
	for (let i = startDayOfWeek - 1; i >= 0; i--) {
		const date = new Date(year, month - 1, prevMonthLastDay - i);
		days.push({
			date,
			dateString: formatDateString(date),
			day: date.getDate(),
			isCurrentMonth: false,
			isToday: false
		});
	}

	// Add days of current month
	for (let day = 1; day <= lastDay.getDate(); day++) {
		const date = new Date(year, month, day);
		const isToday = date.getTime() === today.getTime();
		days.push({
			date,
			dateString: formatDateString(date),
			day,
			isCurrentMonth: true,
			isToday
		});
	}

	// Add padding days from next month to complete the grid
	const remainingDays = 42 - days.length; // 6 rows x 7 days
	for (let day = 1; day <= remainingDays; day++) {
		const date = new Date(year, month + 1, day);
		days.push({
			date,
			dateString: formatDateString(date),
			day,
			isCurrentMonth: false,
			isToday: false
		});
	}

	return days;
}

/**
 * Format date as YYYY-MM-DD
 */
export function formatDateString(date: Date): string {
	const year = date.getFullYear();
	const month = String(date.getMonth() + 1).padStart(2, '0');
	const day = String(date.getDate()).padStart(2, '0');
	return `${year}-${month}-${day}`;
}

/**
 * Get month name from month index
 */
export function getMonthName(month: number): string {
	const names = [
		'January',
		'February',
		'March',
		'April',
		'May',
		'June',
		'July',
		'August',
		'September',
		'October',
		'November',
		'December'
	];
	return names[month];
}

/**
 * Get short day names
 */
export function getDayNames(): string[] {
	return ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
}

/**
 * Get today's date string
 */
export function getTodayString(): string {
	return formatDateString(new Date());
}

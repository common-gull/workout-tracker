/**
 * Theme management utilities
 */

export type ThemePreference = 'light' | 'dark' | 'system';

const THEME_STORAGE_KEY = 'workout-tracker-theme';

/**
 * Get theme preference from localStorage (synchronous)
 */
export function getStoredTheme(): ThemePreference | null {
	if (typeof localStorage === 'undefined') return null;
	const stored = localStorage.getItem(THEME_STORAGE_KEY);
	if (stored === 'light' || stored === 'dark' || stored === 'system') {
		return stored;
	}
	return null;
}

/**
 * Store theme preference in localStorage (synchronous)
 */
export function storeTheme(preference: ThemePreference): void {
	if (typeof localStorage === 'undefined') return;
	localStorage.setItem(THEME_STORAGE_KEY, preference);
}

/**
 * Get the resolved theme (either 'light' or 'dark') based on preference
 */
export function getResolvedTheme(preference: ThemePreference): 'light' | 'dark' {
	if (preference === 'system') {
		// Check system preference
		if (typeof window !== 'undefined' && window.matchMedia) {
			return window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark';
		}
		// Default to dark if we can't detect system preference
		return 'dark';
	}
	return preference;
}

/**
 * Apply theme to document
 */
export function applyTheme(theme: 'light' | 'dark'): void {
	if (typeof document === 'undefined') return;

	if (theme === 'dark') {
		document.documentElement.classList.add('dark');
	} else {
		document.documentElement.classList.remove('dark');
	}
}

/**
 * Initialize theme on page load (should be called as early as possible)
 */
export function initializeThemeEarly(): void {
	const stored = getStoredTheme();
	if (stored) {
		const resolved = getResolvedTheme(stored);
		applyTheme(resolved);
	}
}

/**
 * Initialize theme based on preference
 */
export function initializeTheme(preference: ThemePreference): void {
	// Store in localStorage for next page load
	storeTheme(preference);

	const resolved = getResolvedTheme(preference);
	applyTheme(resolved);

	// Listen for system theme changes if using system preference
	if (preference === 'system' && typeof window !== 'undefined' && window.matchMedia) {
		const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
		const handleChange = (e: MediaQueryListEvent) => {
			applyTheme(e.matches ? 'dark' : 'light');
		};
		mediaQuery.addEventListener('change', handleChange);

		// Return cleanup function
		return () => mediaQuery.removeEventListener('change', handleChange);
	}
}

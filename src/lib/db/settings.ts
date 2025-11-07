import { db } from './database';
import type { Settings } from '$lib/types';
import { storeTheme } from '$lib/utils/theme';

const DEFAULT_SETTINGS: Omit<Settings, 'id' | 'createdAt' | 'updatedAt'> = {
	unitPreference: 'imperial',
	theme: 'system'
};

export async function getSettings(): Promise<Settings> {
	const settings = await db.settings.toArray();
	if (settings.length === 0) {
		// Create default settings
		const id = await db.settings.add({
			...DEFAULT_SETTINGS,
			createdAt: new Date(),
			updatedAt: new Date()
		});
		// Sync to localStorage
		storeTheme(DEFAULT_SETTINGS.theme);
		return { id, ...DEFAULT_SETTINGS, createdAt: new Date(), updatedAt: new Date() };
	}

	// Migrate existing settings if theme field is missing
	const existingSettings = settings[0];
	if (!existingSettings.theme) {
		existingSettings.theme = DEFAULT_SETTINGS.theme;
		if (existingSettings.id) {
			await db.settings.update(existingSettings.id, {
				theme: existingSettings.theme,
				updatedAt: new Date()
			});
		}
		// Sync to localStorage
		storeTheme(existingSettings.theme);
	}

	return existingSettings;
}

export async function updateSettings(
	updates: Partial<Omit<Settings, 'id' | 'createdAt'>>
): Promise<void> {
	const settings = await getSettings();
	if (settings.id) {
		await db.settings.update(settings.id, {
			...updates,
			updatedAt: new Date()
		});
		// Sync theme to localStorage if it was updated
		if (updates.theme) {
			storeTheme(updates.theme);
		}
	}
}

export async function resetSettings(): Promise<void> {
	await db.settings.clear();
	await getSettings(); // Creates default settings
}

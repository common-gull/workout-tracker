import { db } from './database';
import type { Settings } from '$lib/types';

const DEFAULT_SETTINGS: Omit<Settings, 'id' | 'createdAt' | 'updatedAt'> = {
	unitPreference: 'imperial'
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
		return { id, ...DEFAULT_SETTINGS, createdAt: new Date(), updatedAt: new Date() };
	}
	return settings[0];
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
	}
}

export async function resetSettings(): Promise<void> {
	await db.settings.clear();
	await getSettings(); // Creates default settings
}

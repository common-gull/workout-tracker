import { writable } from 'svelte/store';
import type { Settings } from '$lib/types';
import { getSettings } from '$lib/db';

// Create a writable store for settings
export const settingsStore = writable<Settings | null>(null);

// Initialize settings from database
export async function initSettings() {
	const settings = await getSettings();
	settingsStore.set(settings);
	return settings;
}

// Update settings in the store
export function updateSettingsStore(settings: Settings) {
	settingsStore.set(settings);
}

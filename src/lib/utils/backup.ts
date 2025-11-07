/**
 * Encrypted backup and restore utilities using Web Crypto API
 */

import { db } from '$lib/db/database';

interface BackupData {
	version: number;
	timestamp: string;
	exercises: unknown[];
	workouts: unknown[];
	workoutLogs: unknown[];
	settings: unknown[];
}

/**
 * Create an encrypted backup of all data
 */
export async function createEncryptedBackup(password: string): Promise<Blob> {
	// Gather all data
	const exercises = await db.exercises.toArray();
	const workouts = await db.workouts.toArray();
	const workoutLogs = await db.workoutLogs.toArray();
	const settings = await db.settings.toArray();

	const backupData: BackupData = {
		version: 1,
		timestamp: new Date().toISOString(),
		exercises,
		workouts,
		workoutLogs,
		settings
	};

	// Convert to JSON
	const jsonData = JSON.stringify(backupData);
	const dataBuffer = new TextEncoder().encode(jsonData);

	// Generate encryption key from password
	const key = await deriveKey(password);

	// Generate random IV (Initialization Vector)
	const iv = crypto.getRandomValues(new Uint8Array(12));

	// Encrypt data
	const encryptedData = await crypto.subtle.encrypt(
		{
			name: 'AES-GCM',
			iv
		},
		key,
		dataBuffer
	);

	// Combine IV and encrypted data
	const combined = new Uint8Array(iv.length + encryptedData.byteLength);
	combined.set(iv, 0);
	combined.set(new Uint8Array(encryptedData), iv.length);

	return new Blob([combined], { type: 'application/octet-stream' });
}

/**
 * Restore data from an encrypted backup
 */
export async function restoreFromEncryptedBackup(
	file: File,
	password: string
): Promise<{ success: boolean; error?: string }> {
	try {
		// Read file
		const arrayBuffer = await file.arrayBuffer();
		const data = new Uint8Array(arrayBuffer);

		// Extract IV and encrypted data
		const iv = data.slice(0, 12);
		const encryptedData = data.slice(12);

		// Derive key from password
		const key = await deriveKey(password);

		// Decrypt data
		let decryptedBuffer: ArrayBuffer;
		try {
			decryptedBuffer = await crypto.subtle.decrypt(
				{
					name: 'AES-GCM',
					iv
				},
				key,
				encryptedData
			);
		} catch {
			return { success: false, error: 'Incorrect password or corrupted backup file' };
		}

		// Parse JSON
		const jsonData = new TextDecoder().decode(decryptedBuffer);
		const backupData: BackupData = JSON.parse(jsonData);

		// Validate backup data
		if (!backupData.version || !backupData.exercises || !backupData.workouts) {
			return { success: false, error: 'Invalid backup file format' };
		}

		// Clear existing data
		await db.exercises.clear();
		await db.workouts.clear();
		await db.workoutLogs.clear();
		await db.settings.clear();

		// Restore data
		await db.exercises.bulkAdd(backupData.exercises);
		await db.workouts.bulkAdd(backupData.workouts);
		await db.workoutLogs.bulkAdd(backupData.workoutLogs);
		if (backupData.settings && backupData.settings.length > 0) {
			await db.settings.bulkAdd(backupData.settings);
		}

		return { success: true };
	} catch (error) {
		return {
			success: false,
			error: error instanceof Error ? error.message : 'Unknown error occurred'
		};
	}
}

/**
 * Derive encryption key from password using PBKDF2
 */
async function deriveKey(password: string): Promise<CryptoKey> {
	// Convert password to key material
	const passwordBuffer = new TextEncoder().encode(password);
	const passwordKey = await crypto.subtle.importKey(
		'raw',
		passwordBuffer,
		{ name: 'PBKDF2' },
		false,
		['deriveBits', 'deriveKey']
	);

	// Use a fixed salt for simplicity (in production, you might want to store this with the backup)
	const salt = new TextEncoder().encode('workout-tracker-backup-salt-v1');

	// Derive AES key
	return await crypto.subtle.deriveKey(
		{
			name: 'PBKDF2',
			salt,
			iterations: 100000,
			hash: 'SHA-256'
		},
		passwordKey,
		{ name: 'AES-GCM', length: 256 },
		false,
		['encrypt', 'decrypt']
	);
}

/**
 * Delete all data from the database
 */
export async function deleteAllData(): Promise<void> {
	await db.exercises.clear();
	await db.workouts.clear();
	await db.workoutLogs.clear();
	// Don't clear settings - they should persist
}

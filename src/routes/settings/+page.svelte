<script lang="ts">
	import { onMount } from 'svelte';
	import { getSettings, updateSettings, resetSettings } from '$lib/db';
	import type { Settings } from '$lib/types';
	import {
		exportExercisesToCSV,
		exportWorkoutsToCSV,
		importExercisesFromCSV,
		importWorkoutsFromCSV,
		downloadFile
	} from '$lib/utils/csv';
	import {
		createEncryptedBackup,
		restoreFromEncryptedBackup,
		deleteAllData
	} from '$lib/utils/backup';
	import { initializeTheme } from '$lib/utils/theme';
	import { getTodayLocalDate } from '$lib/utils/date';

	let settings = $state<Settings | null>(null);
	let loading = $state(true);
	let showDeleteModal = $state(false);
	let deleteConfirmText = $state('');
	let showBackupPasswordModal = $state(false);
	let showRestorePasswordModal = $state(false);
	let backupPassword = $state('');
	let restorePassword = $state('');
	let restoreFile = $state<File | null>(null);
	let statusMessage = $state<{ type: 'success' | 'error'; text: string } | null>(null);
	let processingBackup = $state(false);

	onMount(async () => {
		await loadSettings();
	});

	async function loadSettings() {
		loading = true;
		settings = await getSettings();
		loading = false;
	}

	async function handleUnitPreferenceChange(unit: 'metric' | 'imperial') {
		if (!settings) return;
		await updateSettings({ unitPreference: unit });
		settings = await getSettings();
		showStatus('success', 'Unit preference updated');
	}

	async function handleThemeChange(theme: 'light' | 'dark' | 'system') {
		if (!settings) return;
		await updateSettings({ theme });
		settings = await getSettings();
		initializeTheme(theme);
		showStatus('success', 'Theme updated');
	}

	async function handleExportExercises() {
		try {
			const csv = await exportExercisesToCSV();
			const timestamp = getTodayLocalDate();
			downloadFile(csv, `exercises-${timestamp}.csv`);
			showStatus('success', 'Exercises exported successfully');
		} catch (error) {
			showStatus(
				'error',
				`Failed to export exercises: ${error instanceof Error ? error.message : 'Unknown error'}`
			);
		}
	}

	async function handleExportWorkouts() {
		try {
			const csv = await exportWorkoutsToCSV();
			const timestamp = getTodayLocalDate();
			downloadFile(csv, `workouts-${timestamp}.csv`);
			showStatus('success', 'Workouts exported successfully');
		} catch (error) {
			showStatus(
				'error',
				`Failed to export workouts: ${error instanceof Error ? error.message : 'Unknown error'}`
			);
		}
	}

	async function handleImportExercises(event: Event) {
		const input = event.target as HTMLInputElement;
		const file = input.files?.[0];
		if (!file) return;

		try {
			const text = await file.text();
			const result = await importExercisesFromCSV(text);

			if (result.success > 0) {
				showStatus('success', `Successfully imported ${result.success} exercise(s)`);
			}

			if (result.errors.length > 0) {
				showStatus(
					'error',
					`Import completed with errors:\n${result.errors.slice(0, 5).join('\n')}${result.errors.length > 5 ? `\n... and ${result.errors.length - 5} more errors` : ''}`
				);
			}
		} catch (error) {
			showStatus(
				'error',
				`Failed to import exercises: ${error instanceof Error ? error.message : 'Unknown error'}`
			);
		}

		// Reset input
		input.value = '';
	}

	async function handleImportWorkouts(event: Event) {
		const input = event.target as HTMLInputElement;
		const file = input.files?.[0];
		if (!file) return;

		try {
			const text = await file.text();
			const result = await importWorkoutsFromCSV(text);

			if (result.success > 0) {
				showStatus('success', `Successfully imported ${result.success} workout(s)`);
			}

			if (result.errors.length > 0) {
				showStatus(
					'error',
					`Import completed with errors:\n${result.errors.slice(0, 5).join('\n')}${result.errors.length > 5 ? `\n... and ${result.errors.length - 5} more errors` : ''}`
				);
			}
		} catch (error) {
			showStatus(
				'error',
				`Failed to import workouts: ${error instanceof Error ? error.message : 'Unknown error'}`
			);
		}

		// Reset input
		input.value = '';
	}

	function handleCreateBackup() {
		backupPassword = '';
		showBackupPasswordModal = true;
	}

	async function confirmCreateBackup() {
		if (!backupPassword || backupPassword.length < 6) {
			showStatus('error', 'Password must be at least 6 characters');
			return;
		}

		processingBackup = true;
		try {
			const blob = await createEncryptedBackup(backupPassword);
			const timestamp = getTodayLocalDate();
			const url = URL.createObjectURL(blob);
			const link = document.createElement('a');
			link.href = url;
			link.download = `workout-backup-${timestamp}.backup`;
			document.body.appendChild(link);
			link.click();
			document.body.removeChild(link);
			URL.revokeObjectURL(url);

			showBackupPasswordModal = false;
			showStatus('success', 'Encrypted backup created successfully');
		} catch (error) {
			showStatus(
				'error',
				`Failed to create backup: ${error instanceof Error ? error.message : 'Unknown error'}`
			);
		} finally {
			processingBackup = false;
			backupPassword = '';
		}
	}

	function handleRestoreBackup(event: Event) {
		const input = event.target as HTMLInputElement;
		const file = input.files?.[0];
		if (!file) return;

		restoreFile = file;
		restorePassword = '';
		showRestorePasswordModal = true;

		// Reset input
		input.value = '';
	}

	async function confirmRestoreBackup() {
		if (!restoreFile || !restorePassword) return;

		processingBackup = true;
		try {
			const result = await restoreFromEncryptedBackup(restoreFile, restorePassword);

			if (result.success) {
				showRestorePasswordModal = false;
				await loadSettings();
				showStatus('success', 'Backup restored successfully. Reloading page...');
				setTimeout(() => window.location.reload(), 2000);
			} else {
				showStatus('error', result.error || 'Failed to restore backup');
			}
		} catch (error) {
			showStatus(
				'error',
				`Failed to restore backup: ${error instanceof Error ? error.message : 'Unknown error'}`
			);
		} finally {
			processingBackup = false;
			restorePassword = '';
			restoreFile = null;
		}
	}

	async function handleDeleteAllData() {
		if (deleteConfirmText !== 'DELETE') {
			showStatus('error', 'Please type DELETE to confirm');
			return;
		}

		try {
			await deleteAllData();
			await resetSettings();
			showDeleteModal = false;
			deleteConfirmText = '';
			showStatus('success', 'All data deleted successfully. Reloading page...');
			setTimeout(() => window.location.reload(), 2000);
		} catch (error) {
			showStatus(
				'error',
				`Failed to delete data: ${error instanceof Error ? error.message : 'Unknown error'}`
			);
		}
	}

	function showStatus(type: 'success' | 'error', text: string) {
		statusMessage = { type, text };
		setTimeout(() => {
			statusMessage = null;
		}, 5000);
	}
</script>

<div class="container mx-auto max-w-7xl px-4 py-8">
	<h1 class="mb-8 text-3xl font-bold text-gray-900 dark:text-gray-100">Settings</h1>

	{#if loading}
		<div class="flex items-center justify-center py-12">
			<div class="text-gray-500 dark:text-gray-400">Loading settings...</div>
		</div>
	{:else if settings}
		<!-- Status Message -->
		{#if statusMessage}
			<div
				class="mb-6 rounded-lg p-4"
				class:bg-green-50={statusMessage.type === 'success'}
				class:border-green-200={statusMessage.type === 'success'}
				class:text-green-800={statusMessage.type === 'success'}
				class:bg-red-50={statusMessage.type === 'error'}
				class:border-red-200={statusMessage.type === 'error'}
				class:text-red-800={statusMessage.type === 'error'}
				class:border={true}
			>
				<p class="break-words whitespace-pre-line">{statusMessage.text}</p>
			</div>
		{/if}

		<!-- Appearance -->
		<section
			class="mb-8 rounded-lg border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-800"
		>
			<h2 class="mb-4 text-xl font-semibold text-gray-900 dark:text-gray-100">Appearance</h2>
			<div class="space-y-4">
				<div>
					<span class="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">Theme</span>
					<div class="flex flex-wrap gap-4">
						<label class="flex cursor-pointer items-center">
							<input
								type="radio"
								name="theme"
								value="light"
								bind:group={settings.theme}
								onchange={() => handleThemeChange('light')}
								class="h-4 w-4 border-gray-300 text-blue-600 focus:ring-2 focus:ring-blue-500"
							/>
							<span class="ml-2 text-sm text-gray-900 dark:text-gray-100">Light</span>
						</label>
						<label class="flex cursor-pointer items-center">
							<input
								type="radio"
								name="theme"
								value="dark"
								bind:group={settings.theme}
								onchange={() => handleThemeChange('dark')}
								class="h-4 w-4 border-gray-300 text-blue-600 focus:ring-2 focus:ring-blue-500"
							/>
							<span class="ml-2 text-sm text-gray-900 dark:text-gray-100">Dark</span>
						</label>
						<label class="flex cursor-pointer items-center">
							<input
								type="radio"
								name="theme"
								value="system"
								bind:group={settings.theme}
								onchange={() => handleThemeChange('system')}
								class="h-4 w-4 border-gray-300 text-blue-600 focus:ring-2 focus:ring-blue-500"
							/>
							<span class="ml-2 text-sm text-gray-900 dark:text-gray-100">System</span>
						</label>
					</div>
				</div>
			</div>
		</section>

		<!-- Unit Preferences -->
		<section
			class="mb-8 rounded-lg border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-800"
		>
			<h2 class="mb-4 text-xl font-semibold text-gray-900 dark:text-gray-100">Unit Preferences</h2>
			<div class="space-y-4">
				<div>
					<span class="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300"
						>Weight Unit</span
					>
					<div class="flex gap-4">
						<label class="flex cursor-pointer items-center">
							<input
								type="radio"
								name="unit"
								value="imperial"
								bind:group={settings.unitPreference}
								onchange={() => handleUnitPreferenceChange('imperial')}
								class="h-4 w-4 border-gray-300 text-blue-600 focus:ring-2 focus:ring-blue-500"
							/>
							<span class="ml-2 text-sm text-gray-900 dark:text-gray-100">Imperial (lbs)</span>
						</label>
						<label class="flex cursor-pointer items-center">
							<input
								type="radio"
								name="unit"
								value="metric"
								bind:group={settings.unitPreference}
								onchange={() => handleUnitPreferenceChange('metric')}
								class="h-4 w-4 border-gray-300 text-blue-600 focus:ring-2 focus:ring-blue-500"
							/>
							<span class="ml-2 text-sm text-gray-900 dark:text-gray-100">Metric (kg)</span>
						</label>
					</div>
				</div>
			</div>
		</section>

		<!-- CSV Import/Export -->
		<section
			class="mb-8 rounded-lg border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-800"
		>
			<h2 class="mb-4 text-xl font-semibold text-gray-900 dark:text-gray-100">CSV Import/Export</h2>
			<div class="space-y-4">
				<div class="grid gap-4 sm:grid-cols-2">
					<!-- Export Exercises -->
					<div>
						<h3 class="mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">Exercises</h3>
						<div class="flex flex-col gap-2">
							<button
								onclick={handleExportExercises}
								class="rounded-lg border border-blue-600 bg-white px-4 py-2 text-sm font-medium text-blue-600 hover:bg-blue-50 dark:bg-gray-700 dark:hover:bg-gray-600"
							>
								Export Exercises
							</button>
							<label
								class="cursor-pointer rounded-lg border border-gray-300 bg-white px-4 py-2 text-center text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600"
							>
								Import Exercises
								<input type="file" accept=".csv" onchange={handleImportExercises} class="hidden" />
							</label>
						</div>
					</div>

					<!-- Export Workouts -->
					<div>
						<h3 class="mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">Workouts</h3>
						<div class="flex flex-col gap-2">
							<button
								onclick={handleExportWorkouts}
								class="rounded-lg border border-blue-600 bg-white px-4 py-2 text-sm font-medium text-blue-600 hover:bg-blue-50 dark:bg-gray-700 dark:hover:bg-gray-600"
							>
								Export Workouts
							</button>
							<label
								class="cursor-pointer rounded-lg border border-gray-300 bg-white px-4 py-2 text-center text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600"
							>
								Import Workouts
								<input type="file" accept=".csv" onchange={handleImportWorkouts} class="hidden" />
							</label>
						</div>
					</div>
				</div>
				<p class="text-xs text-gray-500 dark:text-gray-400">
					CSV format: Exercises (name, description, videoLink) | Workouts (date, workoutName,
					exerciseName, setNumber, weight, reps, notes)
				</p>
			</div>
		</section>

		<!-- Encrypted Backup -->
		<section
			class="mb-8 rounded-lg border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-800"
		>
			<h2 class="mb-4 text-xl font-semibold text-gray-900 dark:text-gray-100">Encrypted Backup</h2>
			<div class="space-y-4">
				<div class="flex flex-col gap-3 sm:flex-row">
					<button
						onclick={handleCreateBackup}
						class="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
					>
						Create Encrypted Backup
					</button>
					<label
						class="cursor-pointer rounded-lg border border-gray-300 bg-white px-4 py-2 text-center text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600"
					>
						Restore from Backup
						<input type="file" accept=".backup" onchange={handleRestoreBackup} class="hidden" />
					</label>
				</div>
				<p class="text-xs text-gray-500 dark:text-gray-400">
					Create a password-protected backup of all your data. Keep your password safe - it cannot
					be recovered!
				</p>
			</div>
		</section>

		<!-- Delete All Data -->
		<section
			class="rounded-lg border border-red-300 bg-red-50 p-6 shadow-sm dark:border-red-800 dark:bg-red-900/20"
		>
			<h2 class="mb-4 text-xl font-semibold text-red-900 dark:text-red-300">Danger Zone</h2>
			<div class="space-y-4">
				<p class="text-sm text-red-800 dark:text-red-300">
					Permanently delete all exercises, workouts, and workout logs. This action cannot be
					undone.
				</p>
				<button
					onclick={() => (showDeleteModal = true)}
					class="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700"
				>
					Delete All Data
				</button>
			</div>
		</section>
	{/if}
</div>

<!-- Backup Password Modal -->
{#if showBackupPasswordModal}
	<div
		class="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-4 backdrop-blur-sm"
		onclick={(e) => e.target === e.currentTarget && (showBackupPasswordModal = false)}
		onkeydown={(e) => e.key === 'Escape' && (showBackupPasswordModal = false)}
		role="dialog"
		aria-modal="true"
		tabindex="-1"
	>
		<div class="w-full max-w-md rounded-lg bg-white p-6 shadow-xl dark:bg-gray-800">
			<h3 class="mb-4 text-xl font-semibold text-gray-900 dark:text-gray-100">
				Create Encrypted Backup
			</h3>
			<p class="mb-4 text-sm text-gray-600 dark:text-gray-300">
				Enter a password to encrypt your backup. You'll need this password to restore your data.
			</p>
			<input
				type="password"
				bind:value={backupPassword}
				placeholder="Enter password (min 6 characters)"
				class="mb-4 w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 focus:outline-none dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 dark:placeholder-gray-400"
				onkeydown={(e) => e.key === 'Enter' && confirmCreateBackup()}
			/>
			<div class="flex gap-3">
				<button
					onclick={confirmCreateBackup}
					disabled={processingBackup}
					class="flex-1 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:bg-gray-400"
				>
					{processingBackup ? 'Creating...' : 'Create Backup'}
				</button>
				<button
					onclick={() => (showBackupPasswordModal = false)}
					disabled={processingBackup}
					class="flex-1 rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:bg-gray-100 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600"
				>
					Cancel
				</button>
			</div>
		</div>
	</div>
{/if}

<!-- Restore Password Modal -->
{#if showRestorePasswordModal}
	<div
		class="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-4 backdrop-blur-sm"
		onclick={(e) => e.target === e.currentTarget && (showRestorePasswordModal = false)}
		onkeydown={(e) => e.key === 'Escape' && (showRestorePasswordModal = false)}
		role="dialog"
		aria-modal="true"
		tabindex="-1"
	>
		<div class="w-full max-w-md rounded-lg bg-white p-6 shadow-xl dark:bg-gray-800">
			<h3 class="mb-4 text-xl font-semibold text-gray-900 dark:text-gray-100">
				Restore from Backup
			</h3>
			<p class="mb-4 text-sm font-medium text-red-600 dark:text-red-400">
				Warning: This will replace all your current data!
			</p>
			<input
				type="password"
				bind:value={restorePassword}
				placeholder="Enter backup password"
				class="mb-4 w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 focus:outline-none dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 dark:placeholder-gray-400"
				onkeydown={(e) => e.key === 'Enter' && confirmRestoreBackup()}
			/>
			<div class="flex gap-3">
				<button
					onclick={confirmRestoreBackup}
					disabled={processingBackup}
					class="flex-1 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:bg-gray-400"
				>
					{processingBackup ? 'Restoring...' : 'Restore'}
				</button>
				<button
					onclick={() => (showRestorePasswordModal = false)}
					disabled={processingBackup}
					class="flex-1 rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:bg-gray-100 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600"
				>
					Cancel
				</button>
			</div>
		</div>
	</div>
{/if}

<!-- Delete Confirmation Modal -->
{#if showDeleteModal}
	<div
		class="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-4 backdrop-blur-sm"
		onclick={(e) => e.target === e.currentTarget && (showDeleteModal = false)}
		onkeydown={(e) => e.key === 'Escape' && (showDeleteModal = false)}
		role="dialog"
		aria-modal="true"
		tabindex="-1"
	>
		<div class="w-full max-w-md rounded-lg bg-white p-6 shadow-xl dark:bg-gray-800">
			<h3 class="mb-4 text-xl font-semibold text-red-900 dark:text-red-300">Delete All Data</h3>
			<p class="mb-4 text-sm text-gray-700 dark:text-gray-300">
				This will permanently delete all exercises, workouts, and workout logs. This action cannot
				be undone.
			</p>
			<p class="mb-2 text-sm font-medium text-gray-900 dark:text-gray-100">
				Type <span class="font-bold text-red-600 dark:text-red-400">DELETE</span> to confirm:
			</p>
			<input
				type="text"
				bind:value={deleteConfirmText}
				placeholder="Type DELETE"
				class="mb-4 w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-red-500 focus:ring-2 focus:ring-red-200 focus:outline-none dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 dark:placeholder-gray-400"
				onkeydown={(e) => e.key === 'Enter' && handleDeleteAllData()}
			/>
			<div class="flex gap-3">
				<button
					onclick={handleDeleteAllData}
					disabled={deleteConfirmText !== 'DELETE'}
					class="flex-1 rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:bg-gray-400"
				>
					Delete Everything
				</button>
				<button
					onclick={() => {
						showDeleteModal = false;
						deleteConfirmText = '';
					}}
					class="flex-1 rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600"
				>
					Cancel
				</button>
			</div>
		</div>
	</div>
{/if}

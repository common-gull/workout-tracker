<script lang="ts">
	import { addExercise, updateExercise } from '$lib/db';
	import type { Exercise } from '$lib/types';
	import Modal from './Modal.svelte';

	interface Props {
		exercise?: Exercise | null;
		onSaved: () => void;
		onCancel: () => void;
	}

	let { exercise = null, onSaved, onCancel }: Props = $props();

	let name = $state(exercise?.name || '');
	let description = $state(exercise?.description || '');
	let videoLink = $state(exercise?.videoLink || '');
	let saving = $state(false);
	let errors = $state<{ name?: string; description?: string }>({});

	function validate() {
		errors = {};
		if (!name.trim()) {
			errors.name = 'Name is required';
		}
		if (!description.trim()) {
			errors.description = 'Description is required';
		}
		return Object.keys(errors).length === 0;
	}

	async function handleSubmit() {
		if (!validate()) return;

		saving = true;
		try {
			if (exercise?.id) {
				await updateExercise(exercise.id, {
					name: name.trim(),
					description: description.trim(),
					videoLink: videoLink.trim() || undefined
				});
			} else {
				await addExercise({
					name: name.trim(),
					description: description.trim(),
					videoLink: videoLink.trim() || undefined
				});
			}
			onSaved();
		} catch (error) {
			console.error('Failed to save exercise:', error);
		} finally {
			saving = false;
		}
	}
</script>

<Modal {onCancel} size="sm" ariaLabelledby="exercise-form-title">
	<div class="flex h-full flex-col sm:h-auto">
		<div class="flex-1 overflow-y-auto p-4 sm:p-6">
			<h2 id="exercise-form-title" class="mb-4 text-xl font-bold sm:text-2xl dark:text-gray-100">
				{exercise ? 'Edit Exercise' : 'Add Exercise'}
			</h2>

			<form
				onsubmit={(e) => {
					e.preventDefault();
					handleSubmit();
				}}
			>
				<!-- Name -->
				<div class="mb-4">
					<label for="name" class="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
						Exercise Name *
					</label>
					<input
						id="name"
						type="text"
						bind:value={name}
						placeholder="e.g. Bench Press"
						class="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 focus:outline-none dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 dark:placeholder-gray-400"
						class:border-red-500={errors.name}
					/>
					{#if errors.name}
						<p class="mt-1 text-sm text-red-600">{errors.name}</p>
					{/if}
				</div>

				<!-- Description -->
				<div class="mb-4">
					<label
						for="description"
						class="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300"
					>
						Description *
					</label>
					<textarea
						id="description"
						bind:value={description}
						placeholder="Describe the exercise..."
						rows="3"
						class="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 focus:outline-none dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 dark:placeholder-gray-400"
						class:border-red-500={errors.description}
					></textarea>
					{#if errors.description}
						<p class="mt-1 text-sm text-red-600">{errors.description}</p>
					{/if}
				</div>

				<!-- Video Link -->
				<div class="mb-6">
					<label
						for="videoLink"
						class="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300"
					>
						Video Link (optional)
					</label>
					<input
						id="videoLink"
						type="url"
						bind:value={videoLink}
						placeholder="https://youtube.com/watch?v=..."
						class="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 focus:outline-none dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 dark:placeholder-gray-400"
					/>
				</div>

				<!-- Actions -->
				<div
					class="mt-6 flex justify-end gap-3 border-t border-gray-200 pt-4 sm:mt-0 sm:border-t-0 sm:pt-0 dark:border-gray-700"
				>
					<button
						type="button"
						onclick={onCancel}
						disabled={saving}
						class="rounded-lg border border-gray-300 px-4 py-2 text-gray-700 hover:bg-gray-50 disabled:opacity-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
					>
						Cancel
					</button>
					<button
						type="submit"
						disabled={saving}
						class="rounded-lg bg-blue-600 px-4 py-2 text-white hover:bg-blue-700 disabled:opacity-50"
					>
						{saving ? 'Saving...' : exercise ? 'Update' : 'Add'}
					</button>
				</div>
			</form>
		</div>
	</div>
</Modal>

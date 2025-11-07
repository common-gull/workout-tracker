<script lang="ts">
	import { addExercise, updateExercise } from '$lib/db';
	import type { Exercise } from '$lib/types';

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

	function handleBackdropClick(event: MouseEvent) {
		if (event.target === event.currentTarget) {
			onCancel();
		}
	}
</script>

<!-- Modal Backdrop -->
<div
	class="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-4 backdrop-blur-sm"
	onclick={handleBackdropClick}
	role="dialog"
	aria-modal="true"
	aria-labelledby="form-title"
>
	<!-- Modal Content -->
	<div
		class="w-full max-w-md rounded-lg bg-white p-6 shadow-xl"
		onclick={(e) => e.stopPropagation()}
	>
		<h2 id="form-title" class="mb-4 text-2xl font-bold">
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
				<label for="name" class="mb-1 block text-sm font-medium text-gray-700">
					Exercise Name *
				</label>
				<input
					id="name"
					type="text"
					bind:value={name}
					placeholder="e.g. Bench Press"
					class="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 focus:outline-none"
					class:border-red-500={errors.name}
				/>
				{#if errors.name}
					<p class="mt-1 text-sm text-red-600">{errors.name}</p>
				{/if}
			</div>

			<!-- Description -->
			<div class="mb-4">
				<label for="description" class="mb-1 block text-sm font-medium text-gray-700">
					Description *
				</label>
				<textarea
					id="description"
					bind:value={description}
					placeholder="Describe the exercise..."
					rows="3"
					class="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 focus:outline-none"
					class:border-red-500={errors.description}
				></textarea>
				{#if errors.description}
					<p class="mt-1 text-sm text-red-600">{errors.description}</p>
				{/if}
			</div>

			<!-- Video Link -->
			<div class="mb-6">
				<label for="videoLink" class="mb-1 block text-sm font-medium text-gray-700">
					Video Link (optional)
				</label>
				<input
					id="videoLink"
					type="url"
					bind:value={videoLink}
					placeholder="https://youtube.com/watch?v=..."
					class="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 focus:outline-none"
				/>
			</div>

			<!-- Actions -->
			<div class="flex justify-end gap-3">
				<button
					type="button"
					onclick={onCancel}
					disabled={saving}
					class="rounded-lg border border-gray-300 px-4 py-2 text-gray-700 hover:bg-gray-50 disabled:opacity-50"
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

<script lang="ts">
	import type { Workout } from '$lib/types';
	import Modal from './Modal.svelte';

	interface Props {
		workout: Workout;
		onConfirm: (newDate: string) => void;
		onCancel: () => void;
	}

	let { workout, onConfirm, onCancel }: Props = $props();

	let moveDate = $state(workout.date);

	function handleConfirm() {
		if (moveDate && moveDate !== workout.date) {
			onConfirm(moveDate);
		}
	}
</script>

<Modal
	{onCancel}
	size="sm"
	ariaLabelledby="move-modal-title"
	ariaDescribedby="move-modal-description"
>
	<div class="p-6">
		<h2 id="move-modal-title" class="mb-4 text-xl font-bold text-gray-900 dark:text-gray-100">
			Move Workout
		</h2>
		<p id="move-modal-description" class="mb-4 text-sm text-gray-600 dark:text-gray-400">
			Move "{workout.name}" to a different date.
		</p>

		<div class="mb-6">
			<label
				for="move-date"
				class="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300"
			>
				New Date
			</label>
			<input
				id="move-date"
				type="date"
				bind:value={moveDate}
				class="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 focus:outline-none dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100"
			/>
		</div>

		<div class="flex justify-end gap-3">
			<button
				type="button"
				onclick={onCancel}
				class="rounded-lg border border-gray-300 px-4 py-2 text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
			>
				Cancel
			</button>
			<button
				type="button"
				onclick={handleConfirm}
				disabled={!moveDate || moveDate === workout.date}
				class="rounded-lg bg-amber-600 px-4 py-2 text-white hover:bg-amber-700 disabled:opacity-50"
			>
				Move Workout
			</button>
		</div>
	</div>
</Modal>

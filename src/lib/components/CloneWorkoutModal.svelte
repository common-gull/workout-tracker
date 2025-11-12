<script lang="ts">
	import type { Workout } from '$lib/types';
	import { getTomorrowDate } from '$lib/services/workoutOperations';
	import Modal from './Modal.svelte';

	interface Props {
		workout: Workout;
		onConfirm: (targetDate: string) => void;
		onCancel: () => void;
	}

	let { workout, onConfirm, onCancel }: Props = $props();

	let cloneDate = $state(getTomorrowDate());

	function handleConfirm() {
		if (cloneDate) {
			onConfirm(cloneDate);
		}
	}
</script>

<Modal
	{onCancel}
	size="sm"
	ariaLabelledby="clone-modal-title"
	ariaDescribedby="clone-modal-description"
>
	<div class="p-6">
		<h2 id="clone-modal-title" class="mb-4 text-xl font-bold text-gray-900 dark:text-gray-100">
			Clone Workout
		</h2>
		<p id="clone-modal-description" class="mb-4 text-sm text-gray-600 dark:text-gray-400">
			Clone "{workout.name}" to a new date. All exercises, sets, weights, and reps will be copied,
			but completion status will be reset.
		</p>

		<div class="mb-6">
			<label
				for="clone-date"
				class="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300"
			>
				Target Date
			</label>
			<input
				id="clone-date"
				type="date"
				bind:value={cloneDate}
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
				disabled={!cloneDate}
				class="rounded-lg bg-green-600 px-4 py-2 text-white hover:bg-green-700 disabled:opacity-50"
			>
				Clone Workout
			</button>
		</div>
	</div>
</Modal>

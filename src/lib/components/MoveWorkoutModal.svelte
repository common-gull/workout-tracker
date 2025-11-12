<script lang="ts">
	import type { Workout } from '$lib/types';

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

	function handleBackdropClick(event: MouseEvent) {
		if (event.target === event.currentTarget) {
			onCancel();
		}
	}

	function handleKeydown(event: KeyboardEvent) {
		if (event.key === 'Escape') {
			onCancel();
		}
	}
</script>

<div
	class="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-4 backdrop-blur-sm"
	onclick={handleBackdropClick}
	onkeydown={handleKeydown}
	role="dialog"
	aria-modal="true"
	tabindex="-1"
>
	<div class="w-full max-w-md rounded-lg bg-white p-6 shadow-xl dark:bg-gray-800">
		<h2 class="mb-4 text-xl font-bold text-gray-900 dark:text-gray-100">Move Workout</h2>
		<p class="mb-4 text-sm text-gray-600 dark:text-gray-400">
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
</div>

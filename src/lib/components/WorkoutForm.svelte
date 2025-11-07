<script lang="ts">
	import { onMount, tick } from 'svelte';
	import { addWorkout, updateWorkout, getAllExercises } from '$lib/db';
	import type { Workout, Exercise, WorkoutExercise } from '$lib/types';

	interface Props {
		workout?: Workout | null;
		date: string;
		onSaved: () => void;
		onCancel: () => void;
	}

	let { workout = null, date, onSaved, onCancel }: Props = $props();

	let name = $state(workout?.name || '');
	let notes = $state(workout?.notes || '');
	let selectedExercises = $state<WorkoutExercise[]>(workout?.exercises || []);
	let availableExercises = $state<Exercise[]>([]);
	let saving = $state(false);
	let errors = $state<{ name?: string }>({});
	let modalBodyRef: HTMLDivElement;

	onMount(async () => {
		availableExercises = await getAllExercises();
	});

	function validate() {
		errors = {};
		if (!name.trim()) {
			errors.name = 'Workout name is required';
		}
		return Object.keys(errors).length === 0;
	}

	async function addExercise() {
		if (availableExercises.length === 0) return;

		const exercise = availableExercises[0];
		selectedExercises = [
			...selectedExercises,
			{
				exerciseId: exercise.id!,
				exerciseName: exercise.name,
				sets: [{ weight: 0, reps: 0, completed: false }]
			}
		];

		// Wait for DOM update, then scroll to bottom
		await tick();
		if (modalBodyRef) {
			modalBodyRef.scrollTo({
				top: modalBodyRef.scrollHeight,
				behavior: 'smooth'
			});
		}
	}

	function removeExercise(index: number) {
		selectedExercises = selectedExercises.filter((_, i) => i !== index);
	}

	function addSet(exerciseIndex: number) {
		selectedExercises[exerciseIndex].sets.push({ weight: 0, reps: 0, completed: false });
		selectedExercises = [...selectedExercises];
	}

	function removeSet(exerciseIndex: number, setIndex: number) {
		selectedExercises[exerciseIndex].sets = selectedExercises[exerciseIndex].sets.filter(
			(_, i) => i !== setIndex
		);
		selectedExercises = [...selectedExercises];
	}

	async function handleSubmit() {
		if (!validate()) return;

		saving = true;
		try {
			// Convert reactive proxies to plain objects for IndexedDB
			const workoutData = {
				name: name.trim(),
				date,
				exercises: JSON.parse(JSON.stringify(selectedExercises)),
				notes: notes.trim() || undefined
			};

			if (workout?.id) {
				await updateWorkout(workout.id, workoutData);
			} else {
				await addWorkout(workoutData);
			}
			onSaved();
		} catch (error) {
			console.error('Failed to save workout:', error);
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
	class="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-0 backdrop-blur-sm sm:p-4"
	onclick={handleBackdropClick}
	onkeydown={(e) => e.key === 'Escape' && onCancel()}
	role="dialog"
	aria-modal="true"
	aria-labelledby="form-title"
	tabindex="-1"
>
	<!-- Modal Content -->
	<div
		class="flex h-full w-full max-w-2xl flex-col bg-white shadow-xl sm:h-auto sm:max-h-[90vh] sm:rounded-lg"
		role="document"
	>
		<!-- Modal Header (Fixed) -->
		<div class="flex-shrink-0 border-b border-gray-200 px-4 py-3 sm:px-6 sm:py-4">
			<h2 id="form-title" class="text-xl font-bold sm:text-2xl">
				{workout ? 'Edit Workout' : 'Add Workout'} - {date}
			</h2>
		</div>

		<!-- Modal Body (Scrollable) -->
		<div bind:this={modalBodyRef} class="flex-1 overflow-y-auto px-4 py-3 sm:px-6 sm:py-4">
			<form
				onsubmit={(e) => {
					e.preventDefault();
					handleSubmit();
				}}
			>
				<!-- Workout Name -->
				<div class="mb-4">
					<label for="name" class="mb-1 block text-sm font-medium text-gray-700">
						Workout Name *
					</label>
					<input
						id="name"
						type="text"
						bind:value={name}
						placeholder="e.g. Upper Body Day"
						class="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 focus:outline-none"
						class:border-red-500={errors.name}
					/>
					{#if errors.name}
						<p class="mt-1 text-sm text-red-600">{errors.name}</p>
					{/if}
				</div>

				<!-- Exercises -->
				<div class="mb-4">
					<div class="mb-2 flex items-center justify-between">
						<span class="block text-sm font-medium text-gray-700">Exercises</span>
						<button
							type="button"
							onclick={addExercise}
							disabled={availableExercises.length === 0}
							class="rounded bg-blue-600 px-3 py-1 text-sm text-white hover:bg-blue-700 disabled:opacity-50"
						>
							Add Exercise
						</button>
					</div>

					{#if availableExercises.length === 0}
						<p class="text-sm text-gray-500">No exercises available. Create exercises first.</p>
					{/if}

					{#each selectedExercises as exercise, exerciseIndex (exerciseIndex)}
						<div class="mb-4 rounded-lg border border-gray-200 p-4">
							<div class="mb-2 flex items-center justify-between">
								<select
									bind:value={exercise.exerciseId}
									onchange={() => {
										const selected = availableExercises.find((e) => e.id === exercise.exerciseId);
										if (selected) {
											exercise.exerciseName = selected.name;
											selectedExercises = [...selectedExercises];
										}
									}}
									class="flex-1 rounded-lg border border-gray-300 px-3 py-2 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 focus:outline-none"
								>
									{#each availableExercises as ex (ex.id)}
										<option value={ex.id}>{ex.name}</option>
									{/each}
								</select>
								<button
									type="button"
									onclick={() => removeExercise(exerciseIndex)}
									class="ml-2 text-red-600 hover:text-red-800"
									aria-label="Remove exercise"
								>
									<svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
										<path
											stroke-linecap="round"
											stroke-linejoin="round"
											stroke-width="2"
											d="M6 18L18 6M6 6l12 12"
										/>
									</svg>
								</button>
							</div>

							<!-- Sets -->
							<div class="space-y-2">
								<div class="flex items-center justify-between">
									<span class="text-sm font-medium text-gray-700">Sets</span>
									<button
										type="button"
										onclick={() => addSet(exerciseIndex)}
										class="text-sm text-blue-600 hover:text-blue-800"
									>
										+ Add Set
									</button>
								</div>

								{#each exercise.sets as set, setIndex (setIndex)}
									<div class="flex items-center gap-2">
										<span class="w-8 text-sm text-gray-600">{setIndex + 1}.</span>
										<input
											type="number"
											bind:value={set.weight}
											placeholder="Weight"
											min="0"
											class="w-24 rounded border border-gray-300 px-2 py-1 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-200 focus:outline-none"
										/>
										<span class="text-sm text-gray-600">lbs ×</span>
										<input
											type="number"
											bind:value={set.reps}
											placeholder="Reps"
											min="0"
											class="w-20 rounded border border-gray-300 px-2 py-1 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-200 focus:outline-none"
										/>
										<span class="text-sm text-gray-600">reps</span>
										<button
											type="button"
											onclick={() => removeSet(exerciseIndex, setIndex)}
											class="text-red-600 hover:text-red-800"
											aria-label="Remove set"
										>
											<svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
												<path
													stroke-linecap="round"
													stroke-linejoin="round"
													stroke-width="2"
													d="M6 18L18 6M6 6l12 12"
												/>
											</svg>
										</button>
									</div>
								{/each}
							</div>

							<!-- Exercise Notes -->
							<div class="mt-3">
								<label
									for="exercise-notes-{exerciseIndex}"
									class="mb-1 block text-xs font-medium text-gray-700"
								>
									Notes for this exercise
								</label>
								<textarea
									id="exercise-notes-{exerciseIndex}"
									bind:value={exercise.notes}
									placeholder="Add notes about form, difficulty, adjustments, etc..."
									rows="2"
									class="w-full rounded border border-gray-300 px-2 py-1 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-200 focus:outline-none"
								></textarea>
							</div>
						</div>
					{/each}
				</div>

				<!-- Notes -->
				<div class="mb-6">
					<label for="notes" class="mb-1 block text-sm font-medium text-gray-700">
						Notes (optional)
					</label>
					<textarea
						id="notes"
						bind:value={notes}
						placeholder="Any additional notes..."
						rows="2"
						class="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 focus:outline-none"
					></textarea>
				</div>
			</form>
		</div>

		<!-- Modal Footer (Fixed) -->
		<div class="flex-shrink-0 border-t border-gray-200 px-4 py-3 sm:px-6 sm:py-4">
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
					type="button"
					onclick={handleSubmit}
					disabled={saving}
					class="rounded-lg bg-blue-600 px-4 py-2 text-white hover:bg-blue-700 disabled:opacity-50"
				>
					{saving ? 'Saving...' : workout ? 'Update' : 'Add'}
				</button>
			</div>
		</div>
	</div>
</div>

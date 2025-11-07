<script lang="ts">
	import { onMount } from 'svelte';
	import {
		getWorkoutsByDate,
		updateWorkout,
		getWorkoutsSortedByDate,
		getAllExercises,
		getSettings
	} from '$lib/db';
	import type { Workout, Exercise, Settings } from '$lib/types';
	import WorkoutForm from '$lib/components/WorkoutForm.svelte';
	import ExerciseDetailModal from '$lib/components/ExerciseDetailModal.svelte';
	import { convertWeightToDisplay, convertWeightToStorage, getUnitLabel } from '$lib/utils/units';

	let today = $state(new Date().toISOString().split('T')[0]);
	let workouts = $state<Workout[]>([]);
	let previousWorkouts = $state<Workout[]>([]);
	let loading = $state(true);
	let showWorkoutForm = $state(false);
	let editingWorkout = $state<Workout | null>(null);
	// Track expanded exercises: workoutId -> array of exerciseIndexes
	let expandedExercises = $state<Record<number, number[]>>({});
	let selectedExerciseDetail = $state<Exercise | null>(null);
	let allExercises = $state<Exercise[]>([]);
	let settings = $state<Settings | null>(null);

	onMount(async () => {
		settings = await getSettings();
		await loadWorkouts();
		await loadPreviousWorkouts();
		allExercises = await getAllExercises();
	});

	async function loadWorkouts() {
		loading = true;
		try {
			workouts = await getWorkoutsByDate(today);
		} catch (error) {
			console.error('Failed to load workouts:', error);
		} finally {
			loading = false;
		}
	}

	async function loadPreviousWorkouts() {
		try {
			// Get all workouts before today, sorted by date descending
			const allWorkouts = await getWorkoutsSortedByDate(false);
			previousWorkouts = allWorkouts.filter((w) => w.date < today);
		} catch (error) {
			console.error('Failed to load previous workouts:', error);
		}
	}

	function getLastExercisePerformance(exerciseId: number): {
		sets: Array<{ weight: number; reps: number }>;
		date: string;
	} | null {
		// Search through previous workouts for this exercise
		for (const workout of previousWorkouts) {
			const exercise = workout.exercises.find((e) => e.exerciseId === exerciseId);
			if (exercise && exercise.sets.length > 0) {
				return {
					sets: exercise.sets.map((s) => ({ weight: s.weight, reps: s.reps })),
					date: workout.date
				};
			}
		}
		return null;
	}

	function getTodayFormatted(): string {
		const date = new Date();
		return date.toLocaleDateString('en-US', {
			weekday: 'long',
			year: 'numeric',
			month: 'long',
			day: 'numeric'
		});
	}

	async function toggleSetComplete(workout: Workout, exerciseIndex: number, setIndex: number) {
		if (!workout.id) return;

		// Clone workout to avoid mutating state
		const updatedWorkout = JSON.parse(JSON.stringify(workout));
		updatedWorkout.exercises[exerciseIndex].sets[setIndex].completed =
			!updatedWorkout.exercises[exerciseIndex].sets[setIndex].completed;

		try {
			await updateWorkout(workout.id, {
				exercises: updatedWorkout.exercises
			});
			await loadWorkouts();
		} catch (error) {
			console.error('Failed to update set:', error);
		}
	}

	async function updateSetValue(
		workout: Workout,
		exerciseIndex: number,
		setIndex: number,
		field: 'weight' | 'reps',
		value: number
	) {
		if (!workout.id || !settings) return;

		// Clone workout to avoid mutating state
		const updatedWorkout = JSON.parse(JSON.stringify(workout));

		// Convert weight to storage format (kg) if needed
		if (field === 'weight') {
			updatedWorkout.exercises[exerciseIndex].sets[setIndex][field] = convertWeightToStorage(
				value,
				settings.unitPreference
			);
		} else {
			updatedWorkout.exercises[exerciseIndex].sets[setIndex][field] = value;
		}

		try {
			await updateWorkout(workout.id, {
				exercises: updatedWorkout.exercises
			});
			await loadWorkouts();
		} catch (error) {
			console.error('Failed to update set:', error);
		}
	}

	async function updateExerciseNotes(workout: Workout, exerciseIndex: number, notes: string) {
		if (!workout.id) return;

		// Clone workout to avoid mutating state
		const updatedWorkout = JSON.parse(JSON.stringify(workout));
		updatedWorkout.exercises[exerciseIndex].notes = notes.trim() || undefined;

		try {
			await updateWorkout(workout.id, {
				exercises: updatedWorkout.exercises
			});
			await loadWorkouts();
		} catch (error) {
			console.error('Failed to update exercise notes:', error);
		}
	}

	function getCompletedSets(workout: Workout): { completed: number; total: number } {
		let completed = 0;
		let total = 0;
		for (const exercise of workout.exercises) {
			for (const set of exercise.sets) {
				total++;
				if (set.completed) completed++;
			}
		}
		return { completed, total };
	}

	function isWorkoutComplete(workout: Workout): boolean {
		const { completed, total } = getCompletedSets(workout);
		return total > 0 && completed === total;
	}

	function toggleExercise(workoutId: number, exerciseIndex: number) {
		const workoutExpanded = expandedExercises[workoutId] || [];
		if (workoutExpanded.includes(exerciseIndex)) {
			expandedExercises[workoutId] = workoutExpanded.filter((i) => i !== exerciseIndex);
		} else {
			expandedExercises[workoutId] = [...workoutExpanded, exerciseIndex];
		}
	}

	function isExerciseExpanded(workoutId: number, exerciseIndex: number): boolean {
		return expandedExercises[workoutId]?.includes(exerciseIndex) || false;
	}

	function viewExerciseDetail(exerciseId: number) {
		const exercise = allExercises.find((e) => e.id === exerciseId);
		if (exercise) {
			selectedExerciseDetail = exercise;
		}
	}

	function handleAddWorkout() {
		editingWorkout = null;
		showWorkoutForm = true;
	}

	function handleEditWorkout(workout: Workout) {
		editingWorkout = workout;
		showWorkoutForm = true;
	}

	async function handleWorkoutSaved() {
		showWorkoutForm = false;
		editingWorkout = null;
		await loadWorkouts();
		await loadPreviousWorkouts();
	}

	function handleCancel() {
		showWorkoutForm = false;
		editingWorkout = null;
	}
</script>

<div class="container mx-auto max-w-4xl p-4">
	<!-- Header -->
	<div class="mb-6">
		<h1 class="text-3xl font-bold text-gray-900">Today's Workouts</h1>
		<p class="mt-1 text-lg text-gray-600">{getTodayFormatted()}</p>
	</div>

	{#if loading}
		<div class="flex items-center justify-center py-12">
			<div class="text-gray-500">Loading...</div>
		</div>
	{:else if workouts.length === 0}
		<!-- Empty State -->
		<div class="rounded-lg border-2 border-dashed border-gray-300 bg-gray-50 p-12 text-center">
			<svg
				class="mx-auto mb-4 h-16 w-16 text-gray-400"
				fill="none"
				stroke="currentColor"
				viewBox="0 0 24 24"
			>
				<path
					stroke-linecap="round"
					stroke-linejoin="round"
					stroke-width="2"
					d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
				/>
			</svg>
			<h2 class="mb-2 text-xl font-semibold text-gray-900">No workouts scheduled for today</h2>
			<p class="mb-6 text-gray-600">Get started by adding a workout for today</p>
			<button
				onclick={handleAddWorkout}
				class="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-6 py-3 font-medium text-white hover:bg-blue-700"
			>
				<svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path
						stroke-linecap="round"
						stroke-linejoin="round"
						stroke-width="2"
						d="M12 4v16m8-8H4"
					/>
				</svg>
				Add Workout
			</button>
		</div>
	{:else}
		<!-- Workouts List -->
		<div class="space-y-4 sm:space-y-6">
			{#each workouts as workout (workout.id)}
				{@const stats = getCompletedSets(workout)}
				{@const isComplete = isWorkoutComplete(workout)}

				<div
					class="overflow-hidden rounded-lg border bg-white shadow-sm transition-shadow hover:shadow-md"
					class:border-green-500={isComplete}
					class:border-gray-200={!isComplete}
				>
					<!-- Workout Header -->
					<div
						class="border-b px-4 py-3 sm:px-6 sm:py-4"
						class:bg-green-50={isComplete}
						class:border-green-200={isComplete}
						class:bg-gray-50={!isComplete}
						class:border-gray-200={!isComplete}
					>
						<div class="flex items-center justify-between gap-2">
							<div class="flex min-w-0 flex-1 items-center gap-2 sm:gap-3">
								<h2 class="truncate text-xl font-bold text-gray-900 sm:text-2xl">{workout.name}</h2>
								{#if isComplete}
									<span
										class="flex flex-shrink-0 items-center gap-1 rounded-full bg-green-600 px-2 py-0.5 text-xs font-medium text-white sm:px-3 sm:py-1 sm:text-sm"
									>
										<svg
											class="h-3 w-3 sm:h-4 sm:w-4"
											fill="none"
											stroke="currentColor"
											viewBox="0 0 24 24"
										>
											<path
												stroke-linecap="round"
												stroke-linejoin="round"
												stroke-width="2"
												d="M5 13l4 4L19 7"
											/>
										</svg>
										<span class="hidden sm:inline">Complete</span>
									</span>
								{/if}
							</div>
							<button
								onclick={() => handleEditWorkout(workout)}
								class="flex-shrink-0 rounded-lg p-2 text-gray-600 hover:bg-gray-200"
								aria-label="Edit workout"
							>
								<svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
									<path
										stroke-linecap="round"
										stroke-linejoin="round"
										stroke-width="2"
										d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
									/>
								</svg>
							</button>
						</div>
						<div class="mt-2 flex items-center gap-4 text-sm text-gray-600">
							<span>
								{stats.completed} / {stats.total} sets completed
							</span>
							<div class="flex-1">
								<div class="h-2 overflow-hidden rounded-full bg-gray-200">
									<div
										class="h-full transition-all"
										class:bg-green-500={isComplete}
										class:bg-blue-500={!isComplete}
										style="width: {stats.total > 0 ? (stats.completed / stats.total) * 100 : 0}%"
									></div>
								</div>
							</div>
						</div>
					</div>

					<!-- Workout Notes -->
					{#if workout.notes}
						<div class="border-b border-gray-200 bg-blue-50 px-4 py-3 sm:px-6">
							<p class="text-sm text-gray-700">
								<span class="font-semibold text-gray-900">Workout Notes:</span>
								<span class="break-words">{workout.notes}</span>
							</p>
						</div>
					{/if}

					<!-- Exercises -->
					<div class="divide-y divide-gray-200">
						{#each workout.exercises as exercise, exerciseIndex (exercise.exerciseId)}
							{@const lastPerformance = getLastExercisePerformance(exercise.exerciseId)}
							{@const isExpanded = isExerciseExpanded(workout.id!, exerciseIndex)}
							{@const exerciseStats = {
								completed: exercise.sets.filter((s) => s.completed).length,
								total: exercise.sets.length
							}}
							{@const isExerciseComplete = exerciseStats.completed === exerciseStats.total}
							<div class="px-4 py-3 sm:px-6 sm:py-4">
								<!-- Exercise Header (Collapsible) -->
								<div class="flex items-center gap-2">
									<button
										onclick={() => toggleExercise(workout.id!, exerciseIndex)}
										class="flex min-w-0 flex-1 items-center justify-between gap-2 text-left sm:gap-3"
									>
										<div class="flex min-w-0 flex-1 items-center gap-2 sm:gap-3">
											<svg
												class="h-4 w-4 flex-shrink-0 text-gray-500 transition-transform sm:h-5 sm:w-5"
												class:rotate-90={isExpanded}
												fill="none"
												stroke="currentColor"
												viewBox="0 0 24 24"
											>
												<path
													stroke-linecap="round"
													stroke-linejoin="round"
													stroke-width="2"
													d="M9 5l7 7-7 7"
												/>
											</svg>
											<h3 class="truncate text-base font-semibold text-gray-900 sm:text-lg">
												{exercise.exerciseName}
											</h3>
											{#if isExerciseComplete}
												<span
													class="flex flex-shrink-0 items-center gap-1 rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-700"
												>
													<svg
														class="h-3 w-3"
														fill="none"
														stroke="currentColor"
														viewBox="0 0 24 24"
													>
														<path
															stroke-linecap="round"
															stroke-linejoin="round"
															stroke-width="2"
															d="M5 13l4 4L19 7"
														/>
													</svg>
													<span class="hidden sm:inline">Done</span>
												</span>
											{/if}
										</div>
										<span class="flex-shrink-0 text-xs text-gray-600 sm:text-sm">
											{exerciseStats.completed}/{exerciseStats.total}
										</span>
									</button>
									<button
										onclick={() => viewExerciseDetail(exercise.exerciseId)}
										class="flex-shrink-0 rounded-lg p-1.5 text-blue-600 hover:bg-blue-50"
										aria-label="View exercise details"
										title="View details & video"
									>
										<svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
											<path
												stroke-linecap="round"
												stroke-linejoin="round"
												stroke-width="2"
												d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
											/>
										</svg>
									</button>
								</div>

								<!-- Exercise Content (Collapsible) -->
								{#if isExpanded}
									<div class="mt-3">
										{#if lastPerformance}
											<div class="mb-3 rounded-md bg-gray-100 p-3">
												<p class="mb-2 text-xs font-medium tracking-wide text-gray-600 uppercase">
													Last workout ({new Date(lastPerformance.date).toLocaleDateString(
														'en-US',
														{
															month: 'short',
															day: 'numeric'
														}
													)}):
												</p>
												<div class="flex flex-wrap gap-2">
													{#each lastPerformance.sets as set, idx (idx)}
														<span
															class="inline-flex items-center rounded bg-gray-200 px-2 py-1 text-xs font-medium text-gray-700"
														>
															Set {idx + 1}: {settings
																? Math.round(
																		convertWeightToDisplay(set.weight, settings.unitPreference) * 10
																	) / 10
																: set.weight}
															{settings ? getUnitLabel(settings.unitPreference) : 'lbs'} × {set.reps}
															reps
														</span>
													{/each}
												</div>
											</div>
										{/if}

										<div class="space-y-2">
											{#each exercise.sets as set, setIndex (setIndex)}
												<div
													class="flex flex-col gap-2 rounded-lg border p-2 transition-colors sm:flex-row sm:items-center sm:justify-between sm:p-3"
													class:border-green-500={set.completed}
													class:bg-green-50={set.completed}
													class:border-gray-300={!set.completed}
													class:bg-white={!set.completed}
												>
													<!-- Top/Left: Checkbox and Label -->
													<div class="flex items-center gap-2 sm:gap-3">
														<button
															onclick={() => toggleSetComplete(workout, exerciseIndex, setIndex)}
															class="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full border-2 transition-colors"
															class:border-green-500={set.completed}
															class:bg-green-500={set.completed}
															class:border-gray-400={!set.completed}
															class:bg-white={!set.completed}
															aria-label="Toggle set completion"
														>
															{#if set.completed}
																<svg
																	class="h-4 w-4 text-white"
																	fill="none"
																	stroke="currentColor"
																	viewBox="0 0 24 24"
																>
																	<path
																		stroke-linecap="round"
																		stroke-linejoin="round"
																		stroke-width="3"
																		d="M5 13l4 4L19 7"
																	/>
																</svg>
															{/if}
														</button>
														<span class="text-sm font-medium text-gray-900 sm:text-base">
															Set {setIndex + 1}
														</span>
													</div>

													<!-- Bottom/Right: Inputs -->
													<div class="flex items-center gap-2 sm:gap-3">
														<!-- Weight Input -->
														<div class="flex flex-1 items-center gap-1.5 sm:flex-none sm:gap-2">
															<input
																type="number"
																value={settings
																	? Math.round(
																			convertWeightToDisplay(set.weight, settings.unitPreference) *
																				10
																		) / 10
																	: set.weight}
																onchange={(e) =>
																	updateSetValue(
																		workout,
																		exerciseIndex,
																		setIndex,
																		'weight',
																		Number(e.currentTarget.value)
																	)}
																onclick={(e) => e.stopPropagation()}
																class="w-full rounded border border-gray-300 px-2 py-1.5 text-center text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none sm:w-20"
																class:border-green-500={set.completed}
																class:bg-white={set.completed}
																min="0"
																step="5"
															/>
															<span class="text-xs text-gray-600 sm:text-sm"
																>{settings ? getUnitLabel(settings.unitPreference) : 'lbs'}</span
															>
														</div>

														<!-- Reps Input -->
														<div class="flex flex-1 items-center gap-1.5 sm:flex-none sm:gap-2">
															<input
																type="number"
																value={set.reps}
																onchange={(e) =>
																	updateSetValue(
																		workout,
																		exerciseIndex,
																		setIndex,
																		'reps',
																		Number(e.currentTarget.value)
																	)}
																onclick={(e) => e.stopPropagation()}
																class="w-full rounded border border-gray-300 px-2 py-1.5 text-center text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none sm:w-16"
																class:border-green-500={set.completed}
																class:bg-white={set.completed}
																min="0"
																step="1"
															/>
															<span class="text-sm text-gray-600">reps</span>
														</div>
													</div>
												</div>
											{/each}
										</div>

										<!-- Exercise Notes -->
										<div class="mt-3">
											<label
												for="exercise-notes-{workout.id}-{exerciseIndex}"
												class="mb-1 block text-sm font-medium text-gray-700"
											>
												Notes for this exercise
											</label>
											<textarea
												id="exercise-notes-{workout.id}-{exerciseIndex}"
												value={exercise.notes || ''}
												onchange={(e) =>
													updateExerciseNotes(workout, exerciseIndex, e.currentTarget.value)}
												placeholder="Add notes about form, difficulty, adjustments, etc..."
												rows="2"
												class="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none"
											></textarea>
										</div>
									</div>
								{/if}
							</div>
						{/each}
					</div>
				</div>
			{/each}

			<!-- Add Another Workout Button -->
			<button
				onclick={handleAddWorkout}
				class="flex w-full items-center justify-center gap-2 rounded-lg border-2 border-dashed border-gray-300 bg-white py-4 text-gray-600 transition-colors hover:border-blue-400 hover:bg-blue-50 hover:text-blue-600"
			>
				<svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path
						stroke-linecap="round"
						stroke-linejoin="round"
						stroke-width="2"
						d="M12 4v16m8-8H4"
					/>
				</svg>
				Add Another Workout
			</button>
		</div>
	{/if}
</div>

<!-- Modals -->
{#if showWorkoutForm}
	<WorkoutForm
		workout={editingWorkout}
		date={today}
		onSaved={handleWorkoutSaved}
		onCancel={handleCancel}
	/>
{/if}

{#if selectedExerciseDetail}
	<ExerciseDetailModal
		exercise={selectedExerciseDetail}
		onClose={() => (selectedExerciseDetail = null)}
	/>
{/if}

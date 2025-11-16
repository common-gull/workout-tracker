<script lang="ts">
	import { onMount } from 'svelte';
	import { liveQuery } from 'dexie';
	import { updateWorkout, getAllExercises, getSettings } from '$lib/db';
	import { db } from '$lib/db/database';
	import type { Workout, Exercise, Settings } from '$lib/types';
	import WorkoutForm from '$lib/components/WorkoutForm.svelte';
	import ExerciseDetailModal from '$lib/components/ExerciseDetailModal.svelte';
	import { convertWeightToDisplay, convertWeightToStorage, getUnitLabel } from '$lib/utils/units';
	import { getTodayLocalDate } from '$lib/utils/date';

	let today = $state(getTodayLocalDate());
	let showWorkoutForm = $state(false);
	let editingWorkout = $state<Workout | null>(null);
	let expandedExercises = $state<Record<number, number[]>>({});
	let selectedExerciseDetail = $state<Exercise | null>(null);
	let allExercises = $state<Exercise[]>([]);
	let settings = $state<Settings | null>(null);

	const workoutsQuery = liveQuery(() => db.workouts.where('date').equals(today).toArray());
	const previousWorkoutsQuery = liveQuery(async () => {
		const allWorkouts = await db.workouts.orderBy('date').reverse().toArray();
		return allWorkouts.filter((w) => w.date < today);
	});

	let workouts = $derived($workoutsQuery ?? []);
	let previousWorkouts = $derived($previousWorkoutsQuery ?? []);
	let loading = $derived($workoutsQuery === undefined);

	onMount(async () => {
		settings = await getSettings();
		allExercises = await getAllExercises();
	});

	function getLastExercisePerformance(exerciseId: number): {
		sets: Array<{ weight: number; reps: number }>;
		date: string;
	} | null {
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

		const updatedWorkout = JSON.parse(JSON.stringify(workout));

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
	}

	function handleCancel() {
		showWorkoutForm = false;
		editingWorkout = null;
	}
</script>

<div class="container mx-auto max-w-7xl p-4">
	<!-- Header -->
	<div class="mb-6">
		<h1 class="text-3xl font-bold text-gray-900 dark:text-gray-100">Today's Workouts</h1>
		<p class="mt-1 text-lg text-gray-600 dark:text-gray-400">{getTodayFormatted()}</p>
	</div>

	{#if loading}
		<div class="flex items-center justify-center py-12">
			<div class="text-gray-500 dark:text-gray-400">Loading...</div>
		</div>
	{:else if workouts.length === 0}
		<!-- Empty State -->
		<div
			class="rounded-lg border-2 border-dashed border-gray-300 bg-gray-50 p-12 text-center dark:border-gray-700 dark:bg-gray-800"
		>
			<svg
				class="mx-auto mb-4 h-16 w-16 text-gray-400 dark:text-gray-500"
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
			<h2 class="mb-2 text-xl font-semibold text-gray-900 dark:text-gray-100">
				No workouts scheduled for today
			</h2>
			<p class="mb-6 text-gray-600 dark:text-gray-400">Get started by adding a workout for today</p>
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
					class="overflow-hidden rounded-lg border bg-white shadow-sm transition-shadow hover:shadow-md dark:border-gray-700 dark:bg-gray-800"
					class:border-green-500={isComplete}
					class:border-gray-200={!isComplete}
				>
					<!-- Workout Header -->
					<div
						class="border-b px-4 py-3 sm:px-6 sm:py-4 {isComplete
							? 'border-green-200 bg-green-50 dark:bg-green-900/20'
							: 'border-gray-200 bg-gray-50 dark:border-gray-600 dark:bg-gray-700'}"
					>
						<div class="flex items-center justify-between gap-2">
							<div class="flex min-w-0 flex-1 items-center gap-2 sm:gap-3">
								<h2 class="truncate text-xl font-bold text-gray-900 sm:text-2xl dark:text-gray-100">
									{workout.name}
								</h2>
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
								class="flex-shrink-0 rounded-lg p-2 text-gray-600 hover:bg-gray-200 dark:text-gray-300 dark:hover:bg-gray-600"
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
						<div class="mt-2 flex items-center gap-4 text-sm text-gray-600 dark:text-gray-300">
							<span>
								{stats.completed} / {stats.total} sets completed
							</span>
							<div class="flex-1">
								<div class="h-2 overflow-hidden rounded-full bg-gray-200 dark:bg-gray-600">
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
						<div
							class="border-b border-gray-200 bg-blue-50 px-4 py-3 sm:px-6 dark:border-gray-600 dark:bg-blue-900/20"
						>
							<p class="text-sm text-gray-700 dark:text-gray-300">
								<span class="font-semibold text-gray-900 dark:text-gray-100">Workout Notes:</span>
								<span class="break-words whitespace-pre-wrap">{workout.notes}</span>
							</p>
						</div>
					{/if}

					<!-- Exercises -->
					<div class="divide-y divide-gray-200 dark:divide-gray-700">
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
												class="h-4 w-4 flex-shrink-0 text-gray-500 transition-transform sm:h-5 sm:w-5 dark:text-gray-400"
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
											<h3
												class="truncate text-base font-semibold text-gray-900 sm:text-lg dark:text-gray-100"
											>
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
										<span class="flex-shrink-0 text-xs text-gray-600 sm:text-sm dark:text-gray-400">
											{exerciseStats.completed}/{exerciseStats.total}
										</span>
									</button>
									<button
										onclick={() => viewExerciseDetail(exercise.exerciseId)}
										class="flex-shrink-0 rounded-lg p-1.5 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20"
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
										<!-- Instructions -->
										{#if exercise.instructions}
											<div class="mb-3 rounded-md bg-amber-50 p-3 dark:bg-amber-900/20">
												<p
													class="text-xs font-medium tracking-wide text-amber-800 uppercase dark:text-amber-400"
												>
													Instructions
												</p>
												<p
													class="mt-1 text-sm whitespace-pre-wrap text-amber-900 dark:text-amber-200"
												>
													{exercise.instructions}
												</p>
											</div>
										{/if}

										{#if lastPerformance}
											<div class="mb-3 rounded-md bg-gray-100 p-3 dark:bg-gray-700">
												<p
													class="mb-2 text-xs font-medium tracking-wide text-gray-600 uppercase dark:text-gray-400"
												>
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
															class="inline-flex items-center rounded bg-gray-200 px-2 py-1 text-xs font-medium text-gray-700 dark:bg-gray-600 dark:text-gray-200"
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
													class="flex flex-col gap-2 rounded-lg border p-2 transition-colors sm:flex-row sm:items-center sm:justify-between sm:p-3 {set.completed
														? 'border-green-500 bg-green-50 dark:bg-green-900/20'
														: 'border-gray-300 bg-white dark:border-gray-600 dark:bg-gray-700'}"
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
														<span
															class="text-sm font-medium text-gray-900 sm:text-base dark:text-gray-100"
														>
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
																class="w-full rounded border px-2 py-1.5 text-center text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none sm:w-20 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100 {set.completed
																	? 'border-green-500 bg-white dark:bg-gray-700'
																	: 'border-gray-300'}"
																min="0"
																step="5"
															/>
															<span class="text-xs text-gray-600 sm:text-sm dark:text-gray-300"
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
																class="w-full rounded border px-2 py-1.5 text-center text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none sm:w-16 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100 {set.completed
																	? 'border-green-500 bg-white dark:bg-gray-700'
																	: 'border-gray-300'}"
																min="0"
																step="1"
															/>
															<span class="text-sm text-gray-600 dark:text-gray-300">reps</span>
														</div>
													</div>
												</div>
											{/each}
										</div>

										<!-- Exercise Notes -->
										<div class="mt-3">
											<label
												for="exercise-notes-{workout.id}-{exerciseIndex}"
												class="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300"
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
												class="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100 dark:placeholder-gray-400"
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
				class="flex w-full items-center justify-center gap-2 rounded-lg border-2 border-dashed border-gray-300 bg-white py-4 text-gray-600 transition-colors hover:border-blue-400 hover:bg-blue-50 hover:text-blue-600 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300 dark:hover:border-blue-500 dark:hover:bg-blue-900/20 dark:hover:text-blue-400"
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

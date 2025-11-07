<script lang="ts">
	import { onMount } from 'svelte';
	import {
		getWorkoutsByDate,
		updateWorkout,
		getWorkoutsByDateRange,
		getWorkoutsSortedByDate
	} from '$lib/db';
	import type { Workout, WorkoutExercise } from '$lib/types';
	import WorkoutForm from '$lib/components/WorkoutForm.svelte';

	let today = $state(new Date().toISOString().split('T')[0]);
	let workouts = $state<Workout[]>([]);
	let previousWorkouts = $state<Workout[]>([]);
	let loading = $state(true);
	let showWorkoutForm = $state(false);
	let editingWorkout = $state<Workout | null>(null);

	onMount(async () => {
		await loadWorkouts();
		await loadPreviousWorkouts();
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
		if (!workout.id) return;

		// Clone workout to avoid mutating state
		const updatedWorkout = JSON.parse(JSON.stringify(workout));
		updatedWorkout.exercises[exerciseIndex].sets[setIndex][field] = value;

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
		<div class="space-y-6">
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
						class="border-b px-6 py-4"
						class:bg-green-50={isComplete}
						class:border-green-200={isComplete}
						class:bg-gray-50={!isComplete}
						class:border-gray-200={!isComplete}
					>
						<div class="flex items-center justify-between">
							<div class="flex items-center gap-3">
								<h2 class="text-2xl font-bold text-gray-900">{workout.name}</h2>
								{#if isComplete}
									<span
										class="flex items-center gap-1 rounded-full bg-green-600 px-3 py-1 text-sm font-medium text-white"
									>
										<svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
											<path
												stroke-linecap="round"
												stroke-linejoin="round"
												stroke-width="2"
												d="M5 13l4 4L19 7"
											/>
										</svg>
										Complete
									</span>
								{/if}
							</div>
							<button
								onclick={() => handleEditWorkout(workout)}
								class="rounded-lg p-2 text-gray-600 hover:bg-gray-200"
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

					<!-- Exercises -->
					<div class="divide-y divide-gray-200">
						{#each workout.exercises as exercise, exerciseIndex (exercise.exerciseId)}
							{@const lastPerformance = getLastExercisePerformance(exercise.exerciseId)}
							<div class="px-6 py-4">
								<div class="mb-3">
									<h3 class="text-lg font-semibold text-gray-900">{exercise.exerciseName}</h3>
									{#if lastPerformance}
										<div class="mt-2 rounded-md bg-gray-100 p-3">
											<p class="mb-2 text-xs font-medium tracking-wide text-gray-600 uppercase">
												Last workout ({new Date(lastPerformance.date).toLocaleDateString('en-US', {
													month: 'short',
													day: 'numeric'
												})}):
											</p>
											<div class="flex flex-wrap gap-2">
												{#each lastPerformance.sets as set, idx}
													<span
														class="inline-flex items-center rounded bg-gray-200 px-2 py-1 text-xs font-medium text-gray-700"
													>
														Set {idx + 1}: {set.weight} lbs × {set.reps} reps
													</span>
												{/each}
											</div>
										</div>
									{/if}
								</div>
								<div class="space-y-2">
									{#each exercise.sets as set, setIndex}
										<div
											class="flex items-center justify-between rounded-lg border p-3 transition-colors"
											class:border-green-500={set.completed}
											class:bg-green-50={set.completed}
											class:border-gray-300={!set.completed}
											class:bg-white={!set.completed}
										>
											<!-- Left side: Checkbox and Label -->
											<div class="flex items-center gap-3">
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
												<span class="font-medium text-gray-900">Set {setIndex + 1}</span>
											</div>

											<!-- Right side: Inputs -->
											<div class="flex items-center gap-3">
												<!-- Weight Input -->
												<div class="flex items-center gap-2">
													<input
														type="number"
														value={set.weight}
														onchange={(e) =>
															updateSetValue(
																workout,
																exerciseIndex,
																setIndex,
																'weight',
																Number(e.currentTarget.value)
															)}
														onclick={(e) => e.stopPropagation()}
														class="w-20 rounded border border-gray-300 px-2 py-1 text-center text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none"
														class:border-green-500={set.completed}
														class:bg-white={set.completed}
														min="0"
														step="5"
													/>
													<span class="text-sm text-gray-600">lbs</span>
												</div>

												<!-- Reps Input -->
												<div class="flex items-center gap-2">
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
														class="w-16 rounded border border-gray-300 px-2 py-1 text-center text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none"
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
									<label class="mb-1 block text-sm font-medium text-gray-700">
										Notes for this exercise
									</label>
									<textarea
										value={exercise.notes || ''}
										onchange={(e) =>
											updateExerciseNotes(workout, exerciseIndex, e.currentTarget.value)}
										placeholder="Add notes about form, difficulty, adjustments, etc..."
										rows="2"
										class="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none"
									></textarea>
								</div>
							</div>
						{/each}
					</div>

					<!-- Workout Notes -->
					{#if workout.notes}
						<div class="border-t border-gray-200 bg-gray-50 px-6 py-3">
							<p class="text-sm text-gray-600">
								<span class="font-medium">Notes:</span>
								{workout.notes}
							</p>
						</div>
					{/if}
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

<!-- Modal -->
{#if showWorkoutForm}
	<WorkoutForm
		workout={editingWorkout}
		date={today}
		onSaved={handleWorkoutSaved}
		onCancel={handleCancel}
	/>
{/if}

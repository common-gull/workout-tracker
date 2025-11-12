<script lang="ts">
	import { getWorkoutsByDateRange, deleteWorkout } from '$lib/db';
	import type { Workout } from '$lib/types';
	import WorkoutForm from '$lib/components/WorkoutForm.svelte';
	import DeleteModal from '$lib/components/DeleteModal.svelte';
	import MoveWorkoutModal from '$lib/components/MoveWorkoutModal.svelte';
	import CloneWorkoutModal from '$lib/components/CloneWorkoutModal.svelte';
	import { moveWorkout, cloneWorkout } from '$lib/services/workoutOperations';
	import { formatLocalDate, getTodayLocalDate } from '$lib/utils/date';

	let currentDate = $state(new Date());
	let workoutsByDate = $state<Record<string, Workout[]>>({});
	let selectedDate = $state<string | null>(null);
	let showWorkoutForm = $state(false);
	let editingWorkout = $state<Workout | null>(null);
	let deleteTarget = $state<Workout | null>(null);
	let cloneTarget = $state<Workout | null>(null);
	let moveTarget = $state<Workout | null>(null);
	let openMenuId = $state<number | null>(null);

	// Generate array of days for current month
	let daysInMonth = $derived(() => {
		const year = currentDate.getFullYear();
		const month = currentDate.getMonth();
		const lastDay = new Date(year, month + 1, 0);
		const days: Array<{ date: Date; dateString: string; dayName: string; isToday: boolean }> = [];

		for (let day = 1; day <= lastDay.getDate(); day++) {
			const date = new Date(year, month, day);
			const dateString = formatLocalDate(date);
			const dayName = date.toLocaleDateString('en-US', { weekday: 'short' });
			const todayString = getTodayLocalDate();
			const isToday = dateString === todayString;

			days.push({ date, dateString, dayName, isToday });
		}

		return days;
	});

	// Load workouts when month changes
	$effect(() => {
		const days = daysInMonth();
		if (days.length === 0) return;

		const firstDay = days[0].dateString;
		const lastDay = days[days.length - 1].dateString;

		void loadWorkouts(firstDay, lastDay);
	});

	async function loadWorkouts(firstDay: string, lastDay: string) {
		const workouts = await getWorkoutsByDateRange(firstDay, lastDay);

		// Group workouts by date
		const grouped: Record<string, Workout[]> = {};
		for (const workout of workouts) {
			if (!grouped[workout.date]) {
				grouped[workout.date] = [];
			}
			grouped[workout.date].push(workout);
		}

		workoutsByDate = grouped;
	}

	function previousMonth() {
		currentDate = new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1);
	}

	function nextMonth() {
		currentDate = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1);
	}

	function goToToday() {
		currentDate = new Date();
		// Scroll to today
		setTimeout(() => {
			const todayElement = document.querySelector('[data-is-today="true"]');
			todayElement?.scrollIntoView({ behavior: 'smooth', block: 'center' });
		}, 100);
	}

	function getMonthName(): string {
		return currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
	}

	function handleAddWorkout(dateString: string) {
		selectedDate = dateString;
		editingWorkout = null;
		showWorkoutForm = true;
	}

	function handleEditWorkout(workout: Workout) {
		selectedDate = workout.date;
		editingWorkout = workout;
		showWorkoutForm = true;
	}

	function handleDeleteWorkout(workout: Workout) {
		deleteTarget = workout;
	}

	async function confirmDelete() {
		if (deleteTarget?.id) {
			await deleteWorkout(deleteTarget.id);
			await reloadWorkouts();
			deleteTarget = null;
		}
	}

	function handleCloneWorkout(workout: Workout) {
		openMenuId = null;
		cloneTarget = workout;
	}

	function handleMoveWorkout(workout: Workout) {
		openMenuId = null;
		moveTarget = workout;
	}

	async function confirmClone(targetDate: string) {
		if (!cloneTarget) return;

		try {
			await cloneWorkout(cloneTarget, targetDate);
			await reloadWorkouts();
			cloneTarget = null;
		} catch (error) {
			console.error('Failed to clone workout:', error);
		}
	}

	async function confirmMove(newDate: string) {
		if (!moveTarget?.id) return;

		try {
			await moveWorkout(moveTarget.id, newDate);
			await reloadWorkouts();
			moveTarget = null;
		} catch (error) {
			console.error('Failed to move workout:', error);
		}
	}

	async function reloadWorkouts() {
		const days = daysInMonth();
		if (days.length > 0) {
			const firstDay = days[0].dateString;
			const lastDay = days[days.length - 1].dateString;
			await loadWorkouts(firstDay, lastDay);
		}
	}

	function toggleMenu(workoutId: number | undefined) {
		if (!workoutId) return;
		openMenuId = openMenuId === workoutId ? null : workoutId;
	}

	async function handleWorkoutSaved() {
		showWorkoutForm = false;
		editingWorkout = null;
		await reloadWorkouts();
	}

	function handleCancel() {
		showWorkoutForm = false;
		editingWorkout = null;
	}

	function getWorkouts(dateString: string): Workout[] {
		return workoutsByDate[dateString] || [];
	}

	function formatDate(date: Date): string {
		return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
	}
</script>

<div class="container mx-auto max-w-7xl p-4">
	<!-- Header -->
	<div class="mb-6 flex items-center justify-between">
		<h1 class="text-3xl font-bold text-gray-900 dark:text-gray-100">
			{getMonthName()}
		</h1>
		<div class="flex gap-2">
			<button
				onclick={previousMonth}
				class="rounded-lg border border-gray-300 bg-white p-2 hover:bg-gray-50 dark:border-gray-600 dark:bg-gray-800 dark:hover:bg-gray-700"
				aria-label="Previous month"
			>
				<svg
					class="h-5 w-5 dark:text-gray-100"
					fill="none"
					stroke="currentColor"
					viewBox="0 0 24 24"
				>
					<path
						stroke-linecap="round"
						stroke-linejoin="round"
						stroke-width="2"
						d="M15 19l-7-7 7-7"
					/>
				</svg>
			</button>
			<button
				onclick={goToToday}
				class="rounded-lg border border-gray-300 bg-white px-4 py-2 hover:bg-gray-50 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100 dark:hover:bg-gray-700"
			>
				Today
			</button>
			<button
				onclick={nextMonth}
				class="rounded-lg border border-gray-300 bg-white p-2 hover:bg-gray-50 dark:border-gray-600 dark:bg-gray-800 dark:hover:bg-gray-700"
				aria-label="Next month"
			>
				<svg
					class="h-5 w-5 dark:text-gray-100"
					fill="none"
					stroke="currentColor"
					viewBox="0 0 24 24"
				>
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
				</svg>
			</button>
		</div>
	</div>

	<!-- Days List -->
	<div
		class="divide-y divide-gray-200 rounded-lg border border-gray-200 bg-white shadow-sm dark:divide-gray-700 dark:border-gray-700 dark:bg-gray-800"
	>
		{#each daysInMonth() as day (day.dateString)}
			<div
				data-is-today={day.isToday}
				class="{day.isToday
					? 'bg-blue-50 dark:bg-blue-900/20'
					: 'bg-white dark:bg-gray-800'} px-4 py-6"
			>
				<!-- Day Header -->
				<div class="mb-4 flex items-center justify-between">
					<div class="flex items-center gap-4">
						<div class="text-center">
							<div
								class="text-xs font-bold tracking-wide uppercase {day.isToday
									? 'text-blue-600 dark:text-blue-400'
									: 'text-gray-500 dark:text-gray-400'}"
							>
								{day.dayName}
							</div>
							<div
								class="text-3xl font-bold {day.isToday
									? 'text-blue-600 dark:text-blue-400'
									: 'text-gray-900 dark:text-gray-100'}"
							>
								{day.date.getDate()}
							</div>
						</div>
						<div>
							<div
								class="text-xl font-semibold {day.isToday
									? 'text-blue-900 dark:text-blue-300'
									: 'text-gray-900 dark:text-gray-100'}"
							>
								{formatDate(day.date)}
							</div>
							{#if day.isToday}
								<div class="text-sm font-medium text-blue-600 dark:text-blue-400">Today</div>
							{/if}
						</div>
					</div>

					<button
						onclick={() => handleAddWorkout(day.dateString)}
						class="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
					>
						<svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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

				<!-- Workouts List -->
				{#if getWorkouts(day.dateString).length === 0}
					<p class="py-4 text-sm text-gray-500 dark:text-gray-400">No workouts scheduled</p>
				{:else}
					<div class="space-y-3">
						{#each getWorkouts(day.dateString) as workout (workout.id)}
							<div
								class="group/workout rounded-lg border border-blue-200 bg-blue-50 p-4 transition-all hover:border-blue-300 hover:bg-blue-100 dark:border-blue-800 dark:bg-blue-900/20 dark:hover:border-blue-700 dark:hover:bg-blue-900/30"
							>
								<div class="flex items-start justify-between gap-3">
									<button
										onclick={() => handleEditWorkout(workout)}
										class="min-w-0 flex-1 text-left"
									>
										<h3 class="text-lg font-semibold text-blue-900 dark:text-blue-200">
											{workout.name}
										</h3>
										{#if workout.exercises.length > 0}
											<div class="mt-2 space-y-2">
												{#each workout.exercises as exercise (exercise.exerciseId)}
													<div>
														<div class="text-sm text-blue-700 dark:text-blue-300">
															<span class="font-medium">{exercise.exerciseName}</span>
															<span class="text-blue-600 dark:text-blue-400">
																- {exercise.sets.length} set{exercise.sets.length !== 1 ? 's' : ''}
															</span>
														</div>
														{#if exercise.instructions}
															<div
																class="mt-1 text-xs whitespace-pre-wrap text-amber-700 dark:text-amber-400"
															>
																{exercise.instructions}
															</div>
														{/if}
														{#if exercise.notes}
															<div
																class="mt-1 text-xs whitespace-pre-wrap text-blue-600 italic dark:text-blue-400"
															>
																"{exercise.notes}"
															</div>
														{/if}
													</div>
												{/each}
											</div>
										{/if}
										{#if workout.notes}
											<p class="mt-2 text-sm whitespace-pre-wrap text-blue-600 dark:text-blue-400">
												{workout.notes}
											</p>
										{/if}
									</button>
									<div class="relative">
										<button
											onclick={() => toggleMenu(workout.id)}
											class="rounded-lg p-2 text-gray-600 hover:bg-gray-200 dark:text-gray-400 dark:hover:bg-gray-700"
											aria-label="Workout actions"
										>
											<svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
												<path
													stroke-linecap="round"
													stroke-linejoin="round"
													stroke-width="2"
													d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z"
												/>
											</svg>
										</button>

										{#if openMenuId === workout.id}
											<div
												class="absolute top-full right-0 z-10 mt-1 w-48 rounded-lg border border-gray-200 bg-white shadow-lg dark:border-gray-700 dark:bg-gray-800"
											>
												<button
													onclick={() => handleEditWorkout(workout)}
													class="flex w-full items-center gap-3 px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700"
												>
													<svg
														class="h-4 w-4"
														fill="none"
														stroke="currentColor"
														viewBox="0 0 24 24"
													>
														<path
															stroke-linecap="round"
															stroke-linejoin="round"
															stroke-width="2"
															d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
														/>
													</svg>
													Edit
												</button>
												<button
													onclick={() => handleMoveWorkout(workout)}
													class="flex w-full items-center gap-3 px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700"
												>
													<svg
														class="h-4 w-4"
														fill="none"
														stroke="currentColor"
														viewBox="0 0 24 24"
													>
														<path
															stroke-linecap="round"
															stroke-linejoin="round"
															stroke-width="2"
															d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4"
														/>
													</svg>
													Move
												</button>
												<button
													onclick={() => handleCloneWorkout(workout)}
													class="flex w-full items-center gap-3 px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700"
												>
													<svg
														class="h-4 w-4"
														fill="none"
														stroke="currentColor"
														viewBox="0 0 24 24"
													>
														<path
															stroke-linecap="round"
															stroke-linejoin="round"
															stroke-width="2"
															d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
														/>
													</svg>
													Clone
												</button>
												<button
													onclick={() => handleDeleteWorkout(workout)}
													class="flex w-full items-center gap-3 rounded-b-lg px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/30"
												>
													<svg
														class="h-4 w-4"
														fill="none"
														stroke="currentColor"
														viewBox="0 0 24 24"
													>
														<path
															stroke-linecap="round"
															stroke-linejoin="round"
															stroke-width="2"
															d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
														/>
													</svg>
													Delete
												</button>
											</div>
										{/if}
									</div>
								</div>
							</div>
						{/each}
					</div>
				{/if}
			</div>
		{/each}
	</div>
</div>

<!-- Modals -->
{#if showWorkoutForm && selectedDate}
	<WorkoutForm
		workout={editingWorkout}
		date={selectedDate}
		onSaved={handleWorkoutSaved}
		onCancel={handleCancel}
	/>
{/if}

{#if deleteTarget}
	<DeleteModal
		title="Delete Workout"
		message="Are you sure you want to delete '{deleteTarget.name}'? This action cannot be undone."
		onConfirm={confirmDelete}
		onCancel={() => (deleteTarget = null)}
	/>
{/if}

{#if moveTarget}
	<MoveWorkoutModal
		workout={moveTarget}
		onConfirm={confirmMove}
		onCancel={() => (moveTarget = null)}
	/>
{/if}

{#if cloneTarget}
	<CloneWorkoutModal
		workout={cloneTarget}
		onConfirm={confirmClone}
		onCancel={() => (cloneTarget = null)}
	/>
{/if}

<script lang="ts">
	import { getWorkoutsByDateRange, deleteWorkout } from '$lib/db';
	import type { Workout } from '$lib/types';
	import WorkoutForm from '$lib/components/WorkoutForm.svelte';
	import DeleteModal from '$lib/components/DeleteModal.svelte';

	let currentDate = $state(new Date());
	let workoutsByDate = $state<Record<string, Workout[]>>({});
	let selectedDate = $state<string | null>(null);
	let showWorkoutForm = $state(false);
	let editingWorkout = $state<Workout | null>(null);
	let deleteTarget = $state<Workout | null>(null);

	// Generate array of days for current month
	let daysInMonth = $derived(() => {
		const year = currentDate.getFullYear();
		const month = currentDate.getMonth();
		const firstDay = new Date(year, month, 1);
		const lastDay = new Date(year, month + 1, 0);
		const days: Array<{ date: Date; dateString: string; dayName: string; isToday: boolean }> = [];

		for (let day = 1; day <= lastDay.getDate(); day++) {
			const date = new Date(year, month, day);
			const dateString = date.toISOString().split('T')[0];
			const dayName = date.toLocaleDateString('en-US', { weekday: 'short' });
			const today = new Date();
			const isToday =
				date.getDate() === today.getDate() &&
				date.getMonth() === today.getMonth() &&
				date.getFullYear() === today.getFullYear();

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
			const days = daysInMonth();
			if (days.length > 0) {
				const firstDay = days[0].dateString;
				const lastDay = days[days.length - 1].dateString;
				await loadWorkouts(firstDay, lastDay);
			}
			deleteTarget = null;
		}
	}

	async function handleWorkoutSaved() {
		showWorkoutForm = false;
		editingWorkout = null;
		const days = daysInMonth();
		if (days.length > 0) {
			const firstDay = days[0].dateString;
			const lastDay = days[days.length - 1].dateString;
			await loadWorkouts(firstDay, lastDay);
		}
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

<div class="container mx-auto max-w-4xl p-4">
	<!-- Header -->
	<div class="mb-6 flex items-center justify-between">
		<h1 class="text-3xl font-bold text-gray-900">
			{getMonthName()}
		</h1>
		<div class="flex gap-2">
			<button
				onclick={previousMonth}
				class="rounded-lg border border-gray-300 bg-white p-2 hover:bg-gray-50"
				aria-label="Previous month"
			>
				<svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
				class="rounded-lg border border-gray-300 bg-white px-4 py-2 hover:bg-gray-50"
			>
				Today
			</button>
			<button
				onclick={nextMonth}
				class="rounded-lg border border-gray-300 bg-white p-2 hover:bg-gray-50"
				aria-label="Next month"
			>
				<svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
				</svg>
			</button>
		</div>
	</div>

	<!-- Days List -->
	<div class="divide-y divide-gray-200 rounded-lg border border-gray-200 bg-white shadow-sm">
		{#each daysInMonth() as day (day.dateString)}
			<div
				data-is-today={day.isToday}
				class="px-4 py-6"
				class:bg-blue-50={day.isToday}
				class:bg-white={!day.isToday}
			>
				<!-- Day Header -->
				<div class="mb-4 flex items-center justify-between">
					<div class="flex items-center gap-4">
						<div class="text-center">
							<div
								class="text-xs font-bold tracking-wide uppercase"
								class:text-blue-600={day.isToday}
								class:text-gray-500={!day.isToday}
							>
								{day.dayName}
							</div>
							<div
								class="text-3xl font-bold"
								class:text-blue-600={day.isToday}
								class:text-gray-900={!day.isToday}
							>
								{day.date.getDate()}
							</div>
						</div>
						<div>
							<div
								class="text-xl font-semibold"
								class:text-blue-900={day.isToday}
								class:text-gray-900={!day.isToday}
							>
								{formatDate(day.date)}
							</div>
							{#if day.isToday}
								<div class="text-sm font-medium text-blue-600">Today</div>
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
					<p class="py-4 text-sm text-gray-500">No workouts scheduled</p>
				{:else}
					<div class="space-y-3">
						{#each getWorkouts(day.dateString) as workout (workout.id)}
							<div
								class="group/workout rounded-lg border border-blue-200 bg-blue-50 p-4 transition-all hover:border-blue-300 hover:bg-blue-100"
							>
								<div class="flex items-start justify-between gap-3">
									<button
										onclick={() => handleEditWorkout(workout)}
										class="min-w-0 flex-1 text-left"
									>
										<h3 class="text-lg font-semibold text-blue-900">{workout.name}</h3>
										{#if workout.exercises.length > 0}
											<div class="mt-2 space-y-1">
												{#each workout.exercises as exercise}
													<div class="text-sm text-blue-700">
														<span class="font-medium">{exercise.exerciseName}</span>
														<span class="text-blue-600">
															- {exercise.sets.length} set{exercise.sets.length !== 1 ? 's' : ''}
														</span>
													</div>
												{/each}
											</div>
										{/if}
										{#if workout.notes}
											<p class="mt-2 text-sm text-blue-600">{workout.notes}</p>
										{/if}
									</button>
									<div class="flex gap-2">
										<button
											onclick={() => handleEditWorkout(workout)}
											class="rounded-lg p-2 text-blue-600 hover:bg-blue-200"
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
										<button
											onclick={() => handleDeleteWorkout(workout)}
											class="rounded-lg p-2 text-red-600 hover:bg-red-100"
											aria-label="Delete workout"
										>
											<svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
												<path
													stroke-linecap="round"
													stroke-linejoin="round"
													stroke-width="2"
													d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
												/>
											</svg>
										</button>
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

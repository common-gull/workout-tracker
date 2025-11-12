import { addWorkout, updateWorkout } from '$lib/db';
import type { Workout } from '$lib/types';

/**
 * Move a workout to a new date
 */
export async function moveWorkout(workoutId: number, newDate: string): Promise<void> {
	await updateWorkout(workoutId, { date: newDate });
}

/**
 * Clone a workout to a new date with all exercises and sets
 * Resets all completion status to false
 */
export async function cloneWorkout(workout: Workout, targetDate: string): Promise<void> {
	// Deep copy workout data
	const clonedWorkout = JSON.parse(JSON.stringify(workout));

	// Reset all completed flags to false
	for (const exercise of clonedWorkout.exercises) {
		for (const set of exercise.sets) {
			set.completed = false;
		}
	}

	// Create new workout with cloned data
	await addWorkout({
		name: clonedWorkout.name,
		date: targetDate,
		exercises: clonedWorkout.exercises,
		notes: clonedWorkout.notes
	});
}

/**
 * Get tomorrow's date as ISO string (YYYY-MM-DD)
 */
export function getTomorrowDate(): string {
	const today = new Date();
	const tomorrow = new Date(today.getTime() + 24 * 60 * 60 * 1000);
	return tomorrow.toISOString().split('T')[0];
}

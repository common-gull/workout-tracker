import { db } from './database';
import type { WorkoutLog } from '$lib/types';

export async function addWorkoutLog(log: Omit<WorkoutLog, 'id'>): Promise<number> {
	const id = await db.workoutLogs.add({
		...log,
		completedAt: log.completedAt || new Date()
	});
	return id;
}

export async function getWorkoutLogById(id: number): Promise<WorkoutLog | undefined> {
	return await db.workoutLogs.get(id);
}

export async function getLogsByWorkout(workoutId: number): Promise<WorkoutLog[]> {
	return await db.workoutLogs.where('workoutId').equals(workoutId).toArray();
}

export async function getLogsByExercise(exerciseId: number): Promise<WorkoutLog[]> {
	return await db.workoutLogs.where('exerciseId').equals(exerciseId).sortBy('completedAt');
}

export async function getLogsByExerciseAndDateRange(
	exerciseId: number,
	startDate: Date,
	endDate: Date
): Promise<WorkoutLog[]> {
	return await db.workoutLogs
		.where('exerciseId')
		.equals(exerciseId)
		.and((log) => log.completedAt >= startDate && log.completedAt <= endDate)
		.sortBy('completedAt');
}

export async function getAllWorkoutLogs(): Promise<WorkoutLog[]> {
	return await db.workoutLogs.toArray();
}

export async function getLastLogForExercise(exerciseId: number): Promise<WorkoutLog | undefined> {
	const logs = await db.workoutLogs
		.where('exerciseId')
		.equals(exerciseId)
		.reverse()
		.sortBy('completedAt');

	return logs[0];
}

export async function deleteWorkoutLog(id: number): Promise<void> {
	await db.workoutLogs.delete(id);
}

export async function deleteLogsByWorkout(workoutId: number): Promise<number> {
	return await db.workoutLogs.where('workoutId').equals(workoutId).delete();
}

export async function getLogsSortedByDate(ascending = false): Promise<WorkoutLog[]> {
	const logs = await db.workoutLogs.orderBy('completedAt').toArray();
	return ascending ? logs : logs.reverse();
}

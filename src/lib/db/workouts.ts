import { db } from './database';
import type { Workout } from '$lib/types';

export async function addWorkout(workout: Omit<Workout, 'id' | 'createdAt'>): Promise<number> {
	const id = await db.workouts.add({
		...workout,
		createdAt: new Date()
	});
	return id;
}

export async function getWorkoutById(id: number): Promise<Workout | undefined> {
	return await db.workouts.get(id);
}

export async function getWorkoutsByDate(date: string): Promise<Workout[]> {
	return await db.workouts.where('date').equals(date).toArray();
}

export async function getWorkoutsByDateRange(
	startDate: string,
	endDate: string
): Promise<Workout[]> {
	return await db.workouts.where('date').between(startDate, endDate, true, true).toArray();
}

export async function getAllWorkouts(): Promise<Workout[]> {
	return await db.workouts.toArray();
}

export async function updateWorkout(
	id: number,
	updates: Partial<Omit<Workout, 'id' | 'createdAt'>>
): Promise<number> {
	return await db.workouts.update(id, updates);
}

export async function deleteWorkout(id: number): Promise<void> {
	await db.workouts.delete(id);
}

export async function getWorkoutsSortedByDate(ascending = false): Promise<Workout[]> {
	const collection = db.workouts.orderBy('date');
	return ascending ? await collection.toArray() : await collection.reverse().toArray();
}

export async function hasWorkoutOnDate(date: string): Promise<boolean> {
	const count = await db.workouts.where('date').equals(date).count();
	return count > 0;
}

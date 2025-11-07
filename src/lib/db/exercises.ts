import { db } from './database';
import type { Exercise } from '$lib/types';

export async function addExercise(exercise: Omit<Exercise, 'id' | 'createdAt'>): Promise<number> {
	const id = await db.exercises.add({
		...exercise,
		createdAt: new Date()
	});
	return id;
}

export async function getExerciseById(id: number): Promise<Exercise | undefined> {
	return await db.exercises.get(id);
}

export async function getAllExercises(): Promise<Exercise[]> {
	return await db.exercises.toArray();
}

export async function updateExercise(
	id: number,
	updates: Partial<Omit<Exercise, 'id' | 'createdAt'>>
): Promise<number> {
	return await db.exercises.update(id, updates);
}

export async function deleteExercise(id: number): Promise<void> {
	await db.exercises.delete(id);
}

export async function searchExercises(query: string): Promise<Exercise[]> {
	const lowerQuery = query.toLowerCase();
	return await db.exercises
		.filter((exercise) => exercise.name.toLowerCase().includes(lowerQuery))
		.toArray();
}

export async function getExercisesSorted(): Promise<Exercise[]> {
	return await db.exercises.orderBy('name').toArray();
}

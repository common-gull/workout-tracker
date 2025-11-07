import './test-setup';
import { describe, it, expect, beforeEach } from 'vitest';
import { db } from './database';
import {
	addExercise,
	getExerciseById,
	getAllExercises,
	updateExercise,
	deleteExercise,
	searchExercises,
	getExercisesSorted
} from './exercises';

describe('Exercise CRUD Operations', () => {
	beforeEach(async () => {
		await db.exercises.clear();
	});

	describe('addExercise', () => {
		it('should add a new exercise', async () => {
			const id = await addExercise({
				name: 'Bench Press',
				description: 'Chest exercise'
			});

			expect(id).toBeGreaterThan(0);

			const exercise = await getExerciseById(id);
			expect(exercise).toBeDefined();
			expect(exercise?.name).toBe('Bench Press');
			expect(exercise?.description).toBe('Chest exercise');
			expect(exercise?.createdAt).toBeInstanceOf(Date);
		});

		it('should add exercise with video link', async () => {
			const id = await addExercise({
				name: 'Squat',
				description: 'Leg exercise',
				videoLink: 'https://youtube.com/watch?v=example'
			});

			const exercise = await getExerciseById(id);
			expect(exercise?.videoLink).toBe('https://youtube.com/watch?v=example');
		});
	});

	describe('getExerciseById', () => {
		it('should return exercise by id', async () => {
			const id = await addExercise({
				name: 'Deadlift',
				description: 'Back exercise'
			});

			const exercise = await getExerciseById(id);
			expect(exercise).toBeDefined();
			expect(exercise?.id).toBe(id);
		});

		it('should return undefined for non-existent id', async () => {
			const exercise = await getExerciseById(9999);
			expect(exercise).toBeUndefined();
		});
	});

	describe('getAllExercises', () => {
		it('should return all exercises', async () => {
			await addExercise({ name: 'Exercise 1', description: 'Desc 1' });
			await addExercise({ name: 'Exercise 2', description: 'Desc 2' });
			await addExercise({ name: 'Exercise 3', description: 'Desc 3' });

			const exercises = await getAllExercises();
			expect(exercises).toHaveLength(3);
		});

		it('should return empty array when no exercises', async () => {
			const exercises = await getAllExercises();
			expect(exercises).toHaveLength(0);
		});
	});

	describe('updateExercise', () => {
		it('should update exercise name', async () => {
			const id = await addExercise({
				name: 'Old Name',
				description: 'Description'
			});

			await updateExercise(id, { name: 'New Name' });

			const exercise = await getExerciseById(id);
			expect(exercise?.name).toBe('New Name');
			expect(exercise?.description).toBe('Description');
		});

		it('should update multiple fields', async () => {
			const id = await addExercise({
				name: 'Exercise',
				description: 'Old desc'
			});

			await updateExercise(id, {
				name: 'Updated Exercise',
				description: 'New desc',
				videoLink: 'https://example.com'
			});

			const exercise = await getExerciseById(id);
			expect(exercise?.name).toBe('Updated Exercise');
			expect(exercise?.description).toBe('New desc');
			expect(exercise?.videoLink).toBe('https://example.com');
		});
	});

	describe('deleteExercise', () => {
		it('should delete exercise by id', async () => {
			const id = await addExercise({
				name: 'To Delete',
				description: 'Will be removed'
			});

			await deleteExercise(id);

			const exercise = await getExerciseById(id);
			expect(exercise).toBeUndefined();
		});
	});

	describe('searchExercises', () => {
		beforeEach(async () => {
			await addExercise({ name: 'Bench Press', description: 'Chest' });
			await addExercise({ name: 'Incline Bench', description: 'Upper chest' });
			await addExercise({ name: 'Squat', description: 'Legs' });
			await addExercise({ name: 'Deadlift', description: 'Back' });
		});

		it('should search exercises by name', async () => {
			const results = await searchExercises('bench');
			expect(results).toHaveLength(2);
			expect(results.map((e) => e.name)).toContain('Bench Press');
			expect(results.map((e) => e.name)).toContain('Incline Bench');
		});

		it('should be case-insensitive', async () => {
			const results = await searchExercises('BENCH');
			expect(results).toHaveLength(2);
		});

		it('should return empty array for no matches', async () => {
			const results = await searchExercises('xyz');
			expect(results).toHaveLength(0);
		});
	});

	describe('getExercisesSorted', () => {
		it('should return exercises sorted by name', async () => {
			await addExercise({ name: 'Zebra Exercise', description: 'Z' });
			await addExercise({ name: 'Alpha Exercise', description: 'A' });
			await addExercise({ name: 'Beta Exercise', description: 'B' });

			const exercises = await getExercisesSorted();
			expect(exercises[0].name).toBe('Alpha Exercise');
			expect(exercises[1].name).toBe('Beta Exercise');
			expect(exercises[2].name).toBe('Zebra Exercise');
		});
	});
});

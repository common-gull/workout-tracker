import './test-setup';
import { describe, it, expect, beforeEach } from 'vitest';
import { db } from './database';
import {
	addWorkout,
	getWorkoutById,
	getWorkoutsByDate,
	getWorkoutsByDateRange,
	updateWorkout,
	deleteWorkout,
	getWorkoutsSortedByDate,
	hasWorkoutOnDate
} from './workouts';

describe('Workout CRUD Operations', () => {
	beforeEach(async () => {
		await db.workouts.clear();
	});

	describe('addWorkout', () => {
		it('should add a new workout', async () => {
			const id = await addWorkout({
				name: 'Morning Workout',
				date: '2025-01-15',
				exercises: [],
				notes: 'Test workout'
			});

			expect(id).toBeGreaterThan(0);

			const workout = await getWorkoutById(id);
			expect(workout).toBeDefined();
			expect(workout?.name).toBe('Morning Workout');
			expect(workout?.date).toBe('2025-01-15');
			expect(workout?.createdAt).toBeInstanceOf(Date);
		});

		it('should add workout with exercises', async () => {
			const id = await addWorkout({
				name: 'Chest Day',
				date: '2025-01-16',
				exercises: [
					{
						exerciseId: 1,
						exerciseName: 'Bench Press',
						sets: [
							{ weight: 135, reps: 10, completed: false },
							{ weight: 155, reps: 8, completed: false }
						]
					}
				]
			});

			const workout = await getWorkoutById(id);
			expect(workout?.exercises).toHaveLength(1);
			expect(workout?.exercises[0].exerciseName).toBe('Bench Press');
			expect(workout?.exercises[0].sets).toHaveLength(2);
		});
	});

	describe('getWorkoutsByDate', () => {
		beforeEach(async () => {
			await addWorkout({ name: 'W1', date: '2025-01-15', exercises: [] });
			await addWorkout({ name: 'W2', date: '2025-01-15', exercises: [] });
			await addWorkout({ name: 'W3', date: '2025-01-16', exercises: [] });
		});

		it('should return workouts for a specific date', async () => {
			const workouts = await getWorkoutsByDate('2025-01-15');
			expect(workouts).toHaveLength(2);
		});

		it('should return empty array for date with no workouts', async () => {
			const workouts = await getWorkoutsByDate('2025-12-25');
			expect(workouts).toHaveLength(0);
		});
	});

	describe('getWorkoutsByDateRange', () => {
		beforeEach(async () => {
			await addWorkout({ name: 'W1', date: '2025-01-10', exercises: [] });
			await addWorkout({ name: 'W2', date: '2025-01-15', exercises: [] });
			await addWorkout({ name: 'W3', date: '2025-01-20', exercises: [] });
			await addWorkout({ name: 'W4', date: '2025-01-25', exercises: [] });
		});

		it('should return workouts in date range', async () => {
			const workouts = await getWorkoutsByDateRange('2025-01-12', '2025-01-22');
			expect(workouts).toHaveLength(2);
			expect(workouts.map((w) => w.name)).toContain('W2');
			expect(workouts.map((w) => w.name)).toContain('W3');
		});

		it('should include start and end dates', async () => {
			const workouts = await getWorkoutsByDateRange('2025-01-10', '2025-01-20');
			expect(workouts).toHaveLength(3);
		});
	});

	describe('updateWorkout', () => {
		it('should update workout name', async () => {
			const id = await addWorkout({
				name: 'Old Name',
				date: '2025-01-15',
				exercises: []
			});

			await updateWorkout(id, { name: 'New Name' });

			const workout = await getWorkoutById(id);
			expect(workout?.name).toBe('New Name');
		});

		it('should update exercises', async () => {
			const id = await addWorkout({
				name: 'Workout',
				date: '2025-01-15',
				exercises: []
			});

			await updateWorkout(id, {
				exercises: [
					{
						exerciseId: 1,
						exerciseName: 'Squat',
						sets: [{ weight: 225, reps: 5, completed: true }]
					}
				]
			});

			const workout = await getWorkoutById(id);
			expect(workout?.exercises).toHaveLength(1);
			expect(workout?.exercises[0].exerciseName).toBe('Squat');
		});
	});

	describe('deleteWorkout', () => {
		it('should delete workout by id', async () => {
			const id = await addWorkout({
				name: 'To Delete',
				date: '2025-01-15',
				exercises: []
			});

			await deleteWorkout(id);

			const workout = await getWorkoutById(id);
			expect(workout).toBeUndefined();
		});
	});

	describe('getWorkoutsSortedByDate', () => {
		beforeEach(async () => {
			await addWorkout({ name: 'W1', date: '2025-01-20', exercises: [] });
			await addWorkout({ name: 'W2', date: '2025-01-10', exercises: [] });
			await addWorkout({ name: 'W3', date: '2025-01-15', exercises: [] });
		});

		it('should sort workouts by date descending by default', async () => {
			const workouts = await getWorkoutsSortedByDate();
			expect(workouts[0].date).toBe('2025-01-20');
			expect(workouts[1].date).toBe('2025-01-15');
			expect(workouts[2].date).toBe('2025-01-10');
		});

		it('should sort workouts by date ascending when specified', async () => {
			const workouts = await getWorkoutsSortedByDate(true);
			expect(workouts[0].date).toBe('2025-01-10');
			expect(workouts[1].date).toBe('2025-01-15');
			expect(workouts[2].date).toBe('2025-01-20');
		});
	});

	describe('hasWorkoutOnDate', () => {
		beforeEach(async () => {
			await addWorkout({ name: 'W1', date: '2025-01-15', exercises: [] });
		});

		it('should return true when workout exists', async () => {
			const exists = await hasWorkoutOnDate('2025-01-15');
			expect(exists).toBe(true);
		});

		it('should return false when no workout exists', async () => {
			const exists = await hasWorkoutOnDate('2025-12-25');
			expect(exists).toBe(false);
		});
	});
});

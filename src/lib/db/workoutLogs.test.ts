import './test-setup';
import { describe, it, expect, beforeEach } from 'vitest';
import { db } from './database';
import {
	addWorkoutLog,
	getWorkoutLogById,
	getLogsByWorkout,
	getLogsByExercise,
	getLogsByExerciseAndDateRange,
	getLastLogForExercise,
	deleteWorkoutLog,
	deleteLogsByWorkout,
	getLogsSortedByDate
} from './workoutLogs';

describe('WorkoutLog CRUD Operations', () => {
	beforeEach(async () => {
		await db.workoutLogs.clear();
	});

	describe('addWorkoutLog', () => {
		it('should add a new workout log', async () => {
			const completedAt = new Date('2025-01-15T10:00:00');
			const id = await addWorkoutLog({
				workoutId: 1,
				exerciseId: 1,
				sets: [
					{ weight: 135, reps: 10, completed: true },
					{ weight: 155, reps: 8, completed: true }
				],
				completedAt,
				notes: 'Great session'
			});

			expect(id).toBeGreaterThan(0);

			const log = await getWorkoutLogById(id);
			expect(log).toBeDefined();
			expect(log?.workoutId).toBe(1);
			expect(log?.exerciseId).toBe(1);
			expect(log?.sets).toHaveLength(2);
			expect(log?.notes).toBe('Great session');
		});

		it('should set completedAt to current date if not provided', async () => {
			const id = await addWorkoutLog({
				workoutId: 1,
				exerciseId: 1,
				sets: [],
				completedAt: new Date()
			});

			const log = await getWorkoutLogById(id);
			expect(log?.completedAt).toBeInstanceOf(Date);
		});
	});

	describe('getLogsByWorkout', () => {
		beforeEach(async () => {
			await addWorkoutLog({
				workoutId: 1,
				exerciseId: 1,
				sets: [],
				completedAt: new Date()
			});
			await addWorkoutLog({
				workoutId: 1,
				exerciseId: 2,
				sets: [],
				completedAt: new Date()
			});
			await addWorkoutLog({
				workoutId: 2,
				exerciseId: 1,
				sets: [],
				completedAt: new Date()
			});
		});

		it('should return all logs for a workout', async () => {
			const logs = await getLogsByWorkout(1);
			expect(logs).toHaveLength(2);
			expect(logs.every((log) => log.workoutId === 1)).toBe(true);
		});

		it('should return empty array for workout with no logs', async () => {
			const logs = await getLogsByWorkout(999);
			expect(logs).toHaveLength(0);
		});
	});

	describe('getLogsByExercise', () => {
		beforeEach(async () => {
			await addWorkoutLog({
				workoutId: 1,
				exerciseId: 1,
				sets: [],
				completedAt: new Date('2025-01-10')
			});
			await addWorkoutLog({
				workoutId: 2,
				exerciseId: 1,
				sets: [],
				completedAt: new Date('2025-01-15')
			});
			await addWorkoutLog({
				workoutId: 3,
				exerciseId: 2,
				sets: [],
				completedAt: new Date('2025-01-12')
			});
		});

		it('should return all logs for an exercise', async () => {
			const logs = await getLogsByExercise(1);
			expect(logs).toHaveLength(2);
			expect(logs.every((log) => log.exerciseId === 1)).toBe(true);
		});

		it('should sort logs by completedAt', async () => {
			const logs = await getLogsByExercise(1);
			expect(logs[0].completedAt.getTime()).toBeLessThan(logs[1].completedAt.getTime());
		});
	});

	describe('getLogsByExerciseAndDateRange', () => {
		beforeEach(async () => {
			await addWorkoutLog({
				workoutId: 1,
				exerciseId: 1,
				sets: [],
				completedAt: new Date('2025-01-05')
			});
			await addWorkoutLog({
				workoutId: 2,
				exerciseId: 1,
				sets: [],
				completedAt: new Date('2025-01-15')
			});
			await addWorkoutLog({
				workoutId: 3,
				exerciseId: 1,
				sets: [],
				completedAt: new Date('2025-01-25')
			});
		});

		it('should return logs within date range', async () => {
			const logs = await getLogsByExerciseAndDateRange(
				1,
				new Date('2025-01-10'),
				new Date('2025-01-20')
			);
			expect(logs).toHaveLength(1);
			expect(logs[0].completedAt.toISOString().startsWith('2025-01-15')).toBe(true);
		});

		it('should return empty array if no logs in range', async () => {
			const logs = await getLogsByExerciseAndDateRange(
				1,
				new Date('2025-02-01'),
				new Date('2025-02-28')
			);
			expect(logs).toHaveLength(0);
		});
	});

	describe('getLastLogForExercise', () => {
		beforeEach(async () => {
			await addWorkoutLog({
				workoutId: 1,
				exerciseId: 1,
				sets: [{ weight: 100, reps: 10, completed: true }],
				completedAt: new Date('2025-01-10')
			});
			await addWorkoutLog({
				workoutId: 2,
				exerciseId: 1,
				sets: [{ weight: 110, reps: 10, completed: true }],
				completedAt: new Date('2025-01-15')
			});
			await addWorkoutLog({
				workoutId: 3,
				exerciseId: 1,
				sets: [{ weight: 120, reps: 10, completed: true }],
				completedAt: new Date('2025-01-20')
			});
		});

		it('should return the most recent log', async () => {
			const log = await getLastLogForExercise(1);
			expect(log).toBeDefined();
			expect(log?.sets[0].weight).toBe(120);
			expect(log?.completedAt.toISOString().startsWith('2025-01-20')).toBe(true);
		});

		it('should return undefined for exercise with no logs', async () => {
			const log = await getLastLogForExercise(999);
			expect(log).toBeUndefined();
		});
	});

	describe('deleteWorkoutLog', () => {
		it('should delete a workout log', async () => {
			const id = await addWorkoutLog({
				workoutId: 1,
				exerciseId: 1,
				sets: [],
				completedAt: new Date()
			});

			await deleteWorkoutLog(id);

			const log = await getWorkoutLogById(id);
			expect(log).toBeUndefined();
		});
	});

	describe('deleteLogsByWorkout', () => {
		beforeEach(async () => {
			await addWorkoutLog({
				workoutId: 1,
				exerciseId: 1,
				sets: [],
				completedAt: new Date()
			});
			await addWorkoutLog({
				workoutId: 1,
				exerciseId: 2,
				sets: [],
				completedAt: new Date()
			});
			await addWorkoutLog({
				workoutId: 2,
				exerciseId: 1,
				sets: [],
				completedAt: new Date()
			});
		});

		it('should delete all logs for a workout', async () => {
			const deletedCount = await deleteLogsByWorkout(1);
			expect(deletedCount).toBe(2);

			const logs = await getLogsByWorkout(1);
			expect(logs).toHaveLength(0);
		});
	});

	describe('getLogsSortedByDate', () => {
		beforeEach(async () => {
			await addWorkoutLog({
				workoutId: 1,
				exerciseId: 1,
				sets: [],
				completedAt: new Date('2025-01-20')
			});
			await addWorkoutLog({
				workoutId: 2,
				exerciseId: 1,
				sets: [],
				completedAt: new Date('2025-01-10')
			});
			await addWorkoutLog({
				workoutId: 3,
				exerciseId: 1,
				sets: [],
				completedAt: new Date('2025-01-15')
			});
		});

		it('should sort logs by date descending by default', async () => {
			const logs = await getLogsSortedByDate();
			expect(logs[0].completedAt.toISOString().startsWith('2025-01-20')).toBe(true);
			expect(logs[1].completedAt.toISOString().startsWith('2025-01-15')).toBe(true);
			expect(logs[2].completedAt.toISOString().startsWith('2025-01-10')).toBe(true);
		});

		it('should sort logs by date ascending when specified', async () => {
			const logs = await getLogsSortedByDate(true);
			expect(logs[0].completedAt.toISOString().startsWith('2025-01-10')).toBe(true);
			expect(logs[1].completedAt.toISOString().startsWith('2025-01-15')).toBe(true);
			expect(logs[2].completedAt.toISOString().startsWith('2025-01-20')).toBe(true);
		});
	});
});

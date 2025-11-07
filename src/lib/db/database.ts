/**
 * Dexie database setup for the Workout Tracker app
 * Uses IndexedDB for local-first data storage
 */

import Dexie, { type Table } from 'dexie';
import type { Exercise, Workout, WorkoutLog } from '$lib/types';

export class WorkoutTrackerDB extends Dexie {
	exercises!: Table<Exercise>;
	workouts!: Table<Workout>;
	workoutLogs!: Table<WorkoutLog>;

	constructor() {
		super('WorkoutTrackerDB');

		this.version(1).stores({
			exercises: '++id, name, createdAt',
			workouts: '++id, name, date, createdAt',
			workoutLogs: '++id, workoutId, exerciseId, completedAt'
		});
	}
}

// Export a singleton instance
export const db = new WorkoutTrackerDB();

/**
 * Dexie database setup for the Workout Tracker app
 * Uses IndexedDB for local-first data storage
 */

import Dexie, { type Table } from 'dexie';
import type { Exercise, Workout, WorkoutLog, Settings } from '$lib/types';

export class WorkoutTrackerDB extends Dexie {
	exercises!: Table<Exercise>;
	workouts!: Table<Workout>;
	workoutLogs!: Table<WorkoutLog>;
	settings!: Table<Settings>;

	constructor() {
		super('WorkoutTrackerDB');

		this.version(1).stores({
			exercises: '++id, name, createdAt',
			workouts: '++id, name, date, createdAt',
			workoutLogs: '++id, workoutId, exerciseId, completedAt'
		});

		this.version(2).stores({
			exercises: '++id, name, createdAt',
			workouts: '++id, name, date, createdAt',
			workoutLogs: '++id, workoutId, exerciseId, completedAt',
			settings: '++id'
		});
	}
}

// Export a singleton instance
export const db = new WorkoutTrackerDB();

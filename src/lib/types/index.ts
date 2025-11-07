/**
 * Core TypeScript types for the Workout Tracker app
 */

// Exercise represents a single exercise in the library
export interface Exercise {
	id?: number;
	name: string;
	description: string;
	videoLink?: string;
	createdAt: Date;
}

// Set represents a single set within an exercise
export interface Set {
	weight: number;
	reps: number;
	completed: boolean;
}

// WorkoutExercise represents an exercise within a workout
export interface WorkoutExercise {
	exerciseId: number;
	exerciseName: string;
	sets: Set[];
	instructions?: string; // Programmatic instructions (tempo, technique, etc.)
	notes?: string; // User notes about the session
}

// Workout represents a planned or completed workout
export interface Workout {
	id?: number;
	name: string;
	date: string; // ISO date string (YYYY-MM-DD)
	exercises: WorkoutExercise[];
	notes?: string;
	createdAt: Date;
}

// WorkoutLog represents the log of a completed workout session
export interface WorkoutLog {
	id?: number;
	workoutId: number;
	exerciseId: number;
	sets: Set[];
	completedAt: Date;
	instructions?: string; // Programmatic instructions from the workout
	notes?: string; // User notes about the session
}

// CSV import row format
export interface CSVWorkoutRow {
	date: string;
	exercise_name: string;
	sets: number;
	reps: number;
	weight: number;
	notes?: string;
}

// Settings represents app-wide user preferences
export interface Settings {
	id?: number;
	unitPreference: 'metric' | 'imperial';
	theme: 'light' | 'dark' | 'system';
	createdAt?: Date;
	updatedAt?: Date;
}

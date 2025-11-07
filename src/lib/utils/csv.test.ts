import '$lib/db/test-setup';
import { describe, it, expect, beforeEach } from 'vitest';
import { importExercisesFromCSV, importWorkoutsFromCSV } from './csv';
import { db } from '$lib/db/database';
import { addExercise } from '$lib/db/exercises';

describe('CSV Import/Export Utilities', () => {
	beforeEach(async () => {
		// Clear all tables before each test
		await db.exercises.clear();
		await db.workouts.clear();
		await db.workoutLogs.clear();
	});

	describe('importExercisesFromCSV', () => {
		it('should import exercises from CSV with all fields', async () => {
			const csv = `name,description,videoLink
Bench Press,Chest exercise targeting pectorals,https://example.com/bench
Squat,Leg exercise targeting quads,https://example.com/squat`;

			const result = await importExercisesFromCSV(csv);

			expect(result.success).toBe(2);
			expect(result.errors).toHaveLength(0);

			const exercises = await db.exercises.toArray();
			expect(exercises).toHaveLength(2);
			expect(exercises[0].name).toBe('Bench Press');
			expect(exercises[0].description).toBe('Chest exercise targeting pectorals');
			expect(exercises[0].videoLink).toBe('https://example.com/bench');
		});

		it('should import exercises without video links', async () => {
			const csv = `name,description,videoLink
Deadlift,Back exercise,`;

			const result = await importExercisesFromCSV(csv);

			expect(result.success).toBe(1);
			expect(result.errors).toHaveLength(0);

			const exercises = await db.exercises.toArray();
			expect(exercises[0].videoLink).toBeUndefined();
		});

		it('should reject exercise with missing name', async () => {
			const csv = `name,description,videoLink
,Some description,https://example.com/video`;

			const result = await importExercisesFromCSV(csv);

			expect(result.success).toBe(0);
			expect(result.errors).toHaveLength(1);
			expect(result.errors[0]).toContain('Exercise name is required');
		});

		it('should reject exercise with missing description', async () => {
			const csv = `name,description,videoLink
Push-ups,,https://example.com/video`;

			const result = await importExercisesFromCSV(csv);

			expect(result.success).toBe(0);
			expect(result.errors).toHaveLength(1);
			expect(result.errors[0]).toContain('Exercise description is required');
		});

		it('should handle empty CSV file', async () => {
			const csv = `name,description,videoLink`;

			const result = await importExercisesFromCSV(csv);

			expect(result.success).toBe(0);
			expect(result.errors).toHaveLength(1);
			expect(result.errors[0]).toContain('empty or has no data rows');
		});
	});

	describe('importWorkoutsFromCSV - New Format with Weight Units', () => {
		beforeEach(async () => {
			// Add some exercises first
			await addExercise({ name: 'Bench Press', description: 'Chest exercise' });
			await addExercise({ name: 'Squat', description: 'Leg exercise' });
			await addExercise({ name: 'Running', description: 'Cardio' });
		});

		it('should import workouts with pounds (lb)', async () => {
			const csv = `date,workoutName,exerciseName,setNumber,weight,weightUnit,reps,duration,instructions,notes
2025-11-03,Upper Body,Bench Press,1,225,lb,5,,TEMPO - 3111,`;

			const result = await importWorkoutsFromCSV(csv);

			expect(result.success).toBe(1);
			expect(result.errors).toHaveLength(0);

			const workouts = await db.workouts.toArray();
			expect(workouts).toHaveLength(1);
			expect(workouts[0].name).toBe('Upper Body');
			expect(workouts[0].exercises[0].sets[0].weight).toBeCloseTo(102.06, 1); // 225 lb ≈ 102 kg
			expect(workouts[0].exercises[0].sets[0].reps).toBe(5);
		});

		it('should import workouts with kilograms (kg)', async () => {
			const csv = `date,workoutName,exerciseName,setNumber,weight,weightUnit,reps,duration,instructions,notes
2025-11-03,Lower Body,Squat,1,100,kg,8,,,`;

			const result = await importWorkoutsFromCSV(csv);

			expect(result.success).toBe(1);
			expect(result.errors).toHaveLength(0);

			const workouts = await db.workouts.toArray();
			expect(workouts[0].exercises[0].sets[0].weight).toBe(100); // No conversion needed
			expect(workouts[0].exercises[0].sets[0].reps).toBe(8);
		});

		it('should import workouts with duration for cardio exercises', async () => {
			const csv = `date,workoutName,exerciseName,setNumber,weight,weightUnit,reps,duration,instructions,notes
2025-11-05,Cardio Day,Running,1,0,lb,0,1800,30 minutes steady state,`;

			const result = await importWorkoutsFromCSV(csv);

			expect(result.success).toBe(1);
			expect(result.errors).toHaveLength(0);

			const workouts = await db.workouts.toArray();
			expect(workouts[0].exercises[0].sets[0].duration).toBe(1800);
			expect(workouts[0].exercises[0].sets[0].weight).toBe(0);
			expect(workouts[0].exercises[0].sets[0].reps).toBe(0);
		});

		it('should import multiple sets with different weights', async () => {
			const csv = `date,workoutName,exerciseName,setNumber,weight,weightUnit,reps,duration,instructions,notes
2025-11-03,Upper Body,Bench Press,1,135,lb,10,,Warm-up,
2025-11-03,Upper Body,Bench Press,2,185,lb,8,,,
2025-11-03,Upper Body,Bench Press,3,225,lb,5,,,`;

			const result = await importWorkoutsFromCSV(csv);

			expect(result.success).toBe(1);
			expect(result.errors).toHaveLength(0);

			const workouts = await db.workouts.toArray();
			expect(workouts[0].exercises[0].sets).toHaveLength(3);
			expect(workouts[0].exercises[0].sets[0].weight).toBeCloseTo(61.23, 1); // 135 lb
			expect(workouts[0].exercises[0].sets[1].weight).toBeCloseTo(83.91, 1); // 185 lb
			expect(workouts[0].exercises[0].sets[2].weight).toBeCloseTo(102.06, 1); // 225 lb
			expect(workouts[0].exercises[0].instructions).toBe('Warm-up');
		});

		it('should reject invalid weight unit', async () => {
			const csv = `date,workoutName,exerciseName,setNumber,weight,weightUnit,reps,duration,instructions,notes
2025-11-03,Upper Body,Bench Press,1,225,invalid,5,,,`;

			const result = await importWorkoutsFromCSV(csv);

			expect(result.success).toBe(0);
			expect(result.errors).toHaveLength(1);
			expect(result.errors[0]).toContain('Invalid weight unit');
		});

		it('should accept "lbs" as valid weight unit', async () => {
			const csv = `date,workoutName,exerciseName,setNumber,weight,weightUnit,reps,duration,instructions,notes
2025-11-03,Upper Body,Bench Press,1,225,lbs,5,,,`;

			const result = await importWorkoutsFromCSV(csv);

			expect(result.success).toBe(1);
			expect(result.errors).toHaveLength(0);

			const workouts = await db.workouts.toArray();
			expect(workouts[0].exercises[0].sets[0].weight).toBeCloseTo(102.06, 1);
		});
	});

	describe('importWorkoutsFromCSV - Backward Compatibility (Old Format)', () => {
		beforeEach(async () => {
			await addExercise({ name: 'Bench Press', description: 'Chest exercise' });
		});

		it('should import workouts in old 8-column format (defaults to pounds)', async () => {
			const csv = `date,workoutName,exerciseName,setNumber,weight,reps,instructions,notes
2025-11-03,Upper Body,Bench Press,1,225,5,TEMPO - 3111,`;

			const result = await importWorkoutsFromCSV(csv);

			expect(result.success).toBe(1);
			expect(result.errors).toHaveLength(0);

			const workouts = await db.workouts.toArray();
			expect(workouts[0].exercises[0].sets[0].weight).toBeCloseTo(102.06, 1); // 225 lb converted to kg
			expect(workouts[0].exercises[0].sets[0].reps).toBe(5);
			expect(workouts[0].exercises[0].sets[0].duration).toBeUndefined();
		});

		it('should handle old format with multiple sets', async () => {
			const csv = `date,workoutName,exerciseName,setNumber,weight,reps,instructions,notes
2025-11-03,Upper Body,Bench Press,1,135,10,,
2025-11-03,Upper Body,Bench Press,2,185,8,,
2025-11-03,Upper Body,Bench Press,3,225,5,,`;

			const result = await importWorkoutsFromCSV(csv);

			expect(result.success).toBe(1);
			expect(result.errors).toHaveLength(0);

			const workouts = await db.workouts.toArray();
			expect(workouts[0].exercises[0].sets).toHaveLength(3);
		});
	});

	describe('importWorkoutsFromCSV - Validation', () => {
		beforeEach(async () => {
			await addExercise({ name: 'Bench Press', description: 'Chest exercise' });
			await addExercise({ name: 'Running', description: 'Cardio' });
		});

		it('should reject invalid date format', async () => {
			const csv = `date,workoutName,exerciseName,setNumber,weight,weightUnit,reps,duration,instructions,notes
11/03/2025,Upper Body,Bench Press,1,225,lb,5,,,`;

			const result = await importWorkoutsFromCSV(csv);

			expect(result.success).toBe(0);
			expect(result.errors).toHaveLength(1);
			expect(result.errors[0]).toContain('Invalid date format');
		});

		it('should reject workout with non-existent exercise', async () => {
			const csv = `date,workoutName,exerciseName,setNumber,weight,weightUnit,reps,duration,instructions,notes
2025-11-03,Upper Body,Deadlift,1,315,lb,5,,,`;

			const result = await importWorkoutsFromCSV(csv);

			expect(result.success).toBe(0);
			expect(result.errors).toHaveLength(1);
			expect(result.errors[0]).toContain('Exercise "Deadlift" not found');
		});

		it('should reject invalid weight value', async () => {
			const csv = `date,workoutName,exerciseName,setNumber,weight,weightUnit,reps,duration,instructions,notes
2025-11-03,Upper Body,Bench Press,1,invalid,lb,5,,,`;

			const result = await importWorkoutsFromCSV(csv);

			expect(result.success).toBe(0);
			expect(result.errors).toHaveLength(1);
			expect(result.errors[0]).toContain('Invalid weight value');
		});

		it('should reject negative weight', async () => {
			const csv = `date,workoutName,exerciseName,setNumber,weight,weightUnit,reps,duration,instructions,notes
2025-11-03,Upper Body,Bench Press,1,-225,lb,5,,,`;

			const result = await importWorkoutsFromCSV(csv);

			expect(result.success).toBe(0);
			expect(result.errors).toHaveLength(1);
			expect(result.errors[0]).toContain('Invalid weight value');
		});

		it('should reject invalid reps value', async () => {
			const csv = `date,workoutName,exerciseName,setNumber,weight,weightUnit,reps,duration,instructions,notes
2025-11-03,Upper Body,Bench Press,1,225,lb,abc,,,`;

			const result = await importWorkoutsFromCSV(csv);

			expect(result.success).toBe(0);
			expect(result.errors).toHaveLength(1);
			expect(result.errors[0]).toContain('Invalid reps value');
		});

		it('should reject invalid set number', async () => {
			const csv = `date,workoutName,exerciseName,setNumber,weight,weightUnit,reps,duration,instructions,notes
2025-11-03,Upper Body,Bench Press,0,225,lb,5,,,`;

			const result = await importWorkoutsFromCSV(csv);

			expect(result.success).toBe(0);
			expect(result.errors).toHaveLength(1);
			expect(result.errors[0]).toContain('Invalid set number');
		});

		it('should reject invalid duration value', async () => {
			const csv = `date,workoutName,exerciseName,setNumber,weight,weightUnit,reps,duration,instructions,notes
2025-11-05,Cardio Day,Running,1,0,lb,0,invalid,,`;

			const result = await importWorkoutsFromCSV(csv);

			expect(result.success).toBe(0);
			expect(result.errors).toHaveLength(1);
			expect(result.errors[0]).toContain('Invalid duration value');
		});

		it('should reject negative duration', async () => {
			const csv = `date,workoutName,exerciseName,setNumber,weight,weightUnit,reps,duration,instructions,notes
2025-11-05,Cardio Day,Running,1,0,lb,0,-100,,`;

			const result = await importWorkoutsFromCSV(csv);

			expect(result.success).toBe(0);
			expect(result.errors).toHaveLength(1);
			expect(result.errors[0]).toContain('Invalid duration value');
		});

		it('should reject CSV with missing required fields', async () => {
			const csv = `date,workoutName,exerciseName,setNumber,weight
2025-11-03,Upper Body,Bench Press,1,225`;

			const result = await importWorkoutsFromCSV(csv);

			expect(result.success).toBe(0);
			expect(result.errors).toHaveLength(1);
			expect(result.errors[0]).toContain('Missing required fields');
		});
	});

	describe('importWorkoutsFromCSV - Complex Scenarios', () => {
		beforeEach(async () => {
			await addExercise({ name: 'Bench Press', description: 'Chest exercise' });
			await addExercise({ name: 'Squat', description: 'Leg exercise' });
			await addExercise({ name: 'Running', description: 'Cardio' });
		});

		it('should group multiple exercises into single workout', async () => {
			const csv = `date,workoutName,exerciseName,setNumber,weight,weightUnit,reps,duration,instructions,notes
2025-11-03,Full Body,Bench Press,1,225,lb,5,,,
2025-11-03,Full Body,Bench Press,2,225,lb,5,,,
2025-11-03,Full Body,Squat,1,315,lb,5,,,
2025-11-03,Full Body,Squat,2,315,lb,5,,,`;

			const result = await importWorkoutsFromCSV(csv);

			expect(result.success).toBe(1);
			expect(result.errors).toHaveLength(0);

			const workouts = await db.workouts.toArray();
			expect(workouts).toHaveLength(1);
			expect(workouts[0].exercises).toHaveLength(2);
			expect(workouts[0].exercises[0].exerciseName).toBe('Bench Press');
			expect(workouts[0].exercises[0].sets).toHaveLength(2);
			expect(workouts[0].exercises[1].exerciseName).toBe('Squat');
			expect(workouts[0].exercises[1].sets).toHaveLength(2);
		});

		it('should create separate workouts for different dates', async () => {
			const csv = `date,workoutName,exerciseName,setNumber,weight,weightUnit,reps,duration,instructions,notes
2025-11-03,Upper Body,Bench Press,1,225,lb,5,,,
2025-11-04,Lower Body,Squat,1,315,lb,5,,,`;

			const result = await importWorkoutsFromCSV(csv);

			expect(result.success).toBe(2);
			expect(result.errors).toHaveLength(0);

			const workouts = await db.workouts.toArray();
			expect(workouts).toHaveLength(2);
			expect(workouts[0].date).toBe('2025-11-03');
			expect(workouts[1].date).toBe('2025-11-04');
		});

		it('should mix weight training and cardio in same workout', async () => {
			const csv = `date,workoutName,exerciseName,setNumber,weight,weightUnit,reps,duration,instructions,notes
2025-11-03,Mixed,Bench Press,1,225,lb,5,,,
2025-11-03,Mixed,Running,1,0,lb,0,1800,,`;

			const result = await importWorkoutsFromCSV(csv);

			expect(result.success).toBe(1);
			expect(result.errors).toHaveLength(0);

			const workouts = await db.workouts.toArray();
			expect(workouts[0].exercises).toHaveLength(2);
			expect(workouts[0].exercises[0].sets[0].weight).toBeGreaterThan(0);
			expect(workouts[0].exercises[0].sets[0].duration).toBeUndefined();
			expect(workouts[0].exercises[1].sets[0].duration).toBe(1800);
		});

		it('should handle mix of metric and imperial in same CSV', async () => {
			const csv = `date,workoutName,exerciseName,setNumber,weight,weightUnit,reps,duration,instructions,notes
2025-11-03,Mixed Units,Bench Press,1,100,kg,5,,,
2025-11-03,Mixed Units,Squat,1,315,lb,5,,,`;

			const result = await importWorkoutsFromCSV(csv);

			expect(result.success).toBe(1);
			expect(result.errors).toHaveLength(0);

			const workouts = await db.workouts.toArray();
			expect(workouts[0].exercises[0].sets[0].weight).toBe(100); // kg stays as is
			expect(workouts[0].exercises[1].sets[0].weight).toBeCloseTo(142.88, 1); // 315 lb to kg
		});

		it('should preserve instructions and notes', async () => {
			const csv = `date,workoutName,exerciseName,setNumber,weight,weightUnit,reps,duration,instructions,notes
2025-11-03,Upper Body,Bench Press,1,225,lb,5,,TEMPO - 3111,Good form today`;

			const result = await importWorkoutsFromCSV(csv);

			expect(result.success).toBe(1);

			const workouts = await db.workouts.toArray();
			expect(workouts[0].exercises[0].instructions).toBe('TEMPO - 3111');
			expect(workouts[0].exercises[0].notes).toBe('Good form today');
		});

		it('should handle partial errors and report them', async () => {
			const csv = `date,workoutName,exerciseName,setNumber,weight,weightUnit,reps,duration,instructions,notes
2025-11-03,Upper Body,NonExistent,1,315,lb,5,,,`;

			const result = await importWorkoutsFromCSV(csv);

			expect(result.success).toBe(0);
			expect(result.errors.length).toBeGreaterThan(0);
			expect(result.errors[0]).toContain('NonExistent');
		});
	});
});

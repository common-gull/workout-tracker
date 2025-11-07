/**
 * CSV Import/Export utilities for exercises and workouts
 */

import Papa from 'papaparse';
import { addExercise, getAllExercises } from '$lib/db/exercises';
import { addWorkout, getAllWorkouts } from '$lib/db/workouts';
import { lbsToKg } from './units';

/**
 * Export exercises to CSV format
 */
export async function exportExercisesToCSV(): Promise<string> {
	const exercises = await getAllExercises();

	// CSV header
	const headers = ['name', 'description', 'videoLink'];
	const rows = [headers.join(',')];

	// CSV rows
	for (const exercise of exercises) {
		const row = [
			escapeCsvValue(exercise.name),
			escapeCsvValue(exercise.description),
			escapeCsvValue(exercise.videoLink || '')
		];
		rows.push(row.join(','));
	}

	return rows.join('\n');
}

/**
 * Export workouts to CSV format
 */
export async function exportWorkoutsToCSV(): Promise<string> {
	const workouts = await getAllWorkouts();

	// CSV header
	const headers = [
		'date',
		'workoutName',
		'exerciseName',
		'setNumber',
		'weight',
		'weightUnit',
		'reps',
		'duration',
		'instructions',
		'notes'
	];
	const rows = [headers.join(',')];

	// CSV rows
	for (const workout of workouts) {
		for (const exercise of workout.exercises) {
			for (let i = 0; i < exercise.sets.length; i++) {
				const set = exercise.sets[i];
				const row = [
					escapeCsvValue(workout.date),
					escapeCsvValue(workout.name),
					escapeCsvValue(exercise.exerciseName),
					String(i + 1),
					String(set.weight),
					'kg', // Always export as kg (internal storage format)
					String(set.reps),
					String(set.duration || ''), // Duration in seconds for cardio/timed exercises
					escapeCsvValue(exercise.instructions || ''),
					escapeCsvValue(exercise.notes || '')
				];
				rows.push(row.join(','));
			}
		}
	}

	return rows.join('\n');
}

/**
 * Import exercises from CSV content
 */
export async function importExercisesFromCSV(csvContent: string): Promise<{
	success: number;
	errors: string[];
}> {
	const parseResult = Papa.parse<string[]>(csvContent, {
		skipEmptyLines: true
	});

	if (parseResult.errors.length > 0) {
		return {
			success: 0,
			errors: parseResult.errors.map((err) => `Parse error at row ${err.row}: ${err.message}`)
		};
	}

	const lines = parseResult.data;
	if (lines.length < 2) {
		return { success: 0, errors: ['CSV file is empty or has no data rows'] };
	}

	// Skip header
	const dataLines = lines.slice(1);
	const errors: string[] = [];
	let success = 0;

	for (let i = 0; i < dataLines.length; i++) {
		const lineNum = i + 2; // +2 because we skip header and lines are 1-indexed
		try {
			const values = dataLines[i];

			if (values.length < 2) {
				errors.push(`Line ${lineNum}: Missing required fields (name, description)`);
				continue;
			}

			const [name, description, videoLink] = values;

			if (!name.trim()) {
				errors.push(`Line ${lineNum}: Exercise name is required`);
				continue;
			}

			if (!description.trim()) {
				errors.push(`Line ${lineNum}: Exercise description is required`);
				continue;
			}

			await addExercise({
				name: name.trim(),
				description: description.trim(),
				videoLink: videoLink?.trim() || undefined
			});

			success++;
		} catch (error) {
			errors.push(`Line ${lineNum}: ${error instanceof Error ? error.message : 'Unknown error'}`);
		}
	}

	return { success, errors };
}

/**
 * Import workouts from CSV content
 */
export async function importWorkoutsFromCSV(csvContent: string): Promise<{
	success: number;
	errors: string[];
}> {
	const parseResult = Papa.parse<string[]>(csvContent, {
		skipEmptyLines: true
	});

	if (parseResult.errors.length > 0) {
		return {
			success: 0,
			errors: parseResult.errors.map((err) => `Parse error at row ${err.row}: ${err.message}`)
		};
	}

	const lines = parseResult.data;
	if (lines.length < 2) {
		return { success: 0, errors: ['CSV file is empty or has no data rows'] };
	}

	// Get all exercises to validate exercise names
	const exercises = await getAllExercises();
	const exerciseMap = new Map(exercises.map((e) => [e.name.toLowerCase(), e]));

	// Skip header
	const dataLines = lines.slice(1);
	const errors: string[] = [];

	// Group rows by date and workout name
	interface WorkoutData {
		date: string;
		name: string;
		exercises: Map<
			string,
			Array<{
				weight: number;
				reps: number;
				setNumber: number;
				duration?: number;
				instructions?: string;
				notes?: string;
			}>
		>;
	}

	const workoutMap = new Map<string, WorkoutData>();

	for (let i = 0; i < dataLines.length; i++) {
		const lineNum = i + 2;
		try {
			const values = dataLines[i];

			if (values.length < 6) {
				errors.push(`Line ${lineNum}: Missing required fields`);
				continue;
			}

			// Support both old format (8 columns) and new format (10 columns)
			let date,
				workoutName,
				exerciseName,
				setNumberStr,
				weightStr,
				weightUnit,
				repsStr,
				durationStr,
				instructions,
				notes;

			if (values.length >= 10) {
				// New format: date,workoutName,exerciseName,setNumber,weight,weightUnit,reps,duration,instructions,notes
				[
					date,
					workoutName,
					exerciseName,
					setNumberStr,
					weightStr,
					weightUnit,
					repsStr,
					durationStr,
					instructions,
					notes
				] = values;
			} else {
				// Old format: date,workoutName,exerciseName,setNumber,weight,reps,instructions,notes
				[date, workoutName, exerciseName, setNumberStr, weightStr, repsStr, instructions, notes] =
					values;
				weightUnit = 'lb'; // Default to pounds for old format
				durationStr = '';
			}

			// Validate date format
			if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
				errors.push(`Line ${lineNum}: Invalid date format (use YYYY-MM-DD)`);
				continue;
			}

			// Validate exercise exists
			const exercise = exerciseMap.get(exerciseName.toLowerCase());
			if (!exercise) {
				errors.push(
					`Line ${lineNum}: Exercise "${exerciseName}" not found. Please import exercises first.`
				);
				continue;
			}

			const weightValue = parseFloat(weightStr);
			const reps = parseInt(repsStr, 10);
			const setNumber = parseInt(setNumberStr, 10);
			const duration = durationStr ? parseInt(durationStr, 10) : undefined;

			if (isNaN(weightValue) || weightValue < 0) {
				errors.push(`Line ${lineNum}: Invalid weight value`);
				continue;
			}

			// Convert weight to kg based on unit
			let weight: number;
			const unit = (weightUnit || 'lb').toLowerCase().trim();
			if (unit === 'lb' || unit === 'lbs') {
				weight = lbsToKg(weightValue);
			} else if (unit === 'kg') {
				weight = weightValue;
			} else {
				errors.push(`Line ${lineNum}: Invalid weight unit "${weightUnit}" (use "lb" or "kg")`);
				continue;
			}

			if (isNaN(reps) || reps < 0) {
				errors.push(`Line ${lineNum}: Invalid reps value`);
				continue;
			}

			if (isNaN(setNumber) || setNumber < 1) {
				errors.push(`Line ${lineNum}: Invalid set number`);
				continue;
			}

			if (duration !== undefined && (isNaN(duration) || duration < 0)) {
				errors.push(`Line ${lineNum}: Invalid duration value`);
				continue;
			}

			// Create workout key
			const workoutKey = `${date}|${workoutName}`;

			if (!workoutMap.has(workoutKey)) {
				workoutMap.set(workoutKey, {
					date,
					name: workoutName,
					exercises: new Map()
				});
			}

			const workout = workoutMap.get(workoutKey)!;

			if (!workout.exercises.has(exerciseName)) {
				workout.exercises.set(exerciseName, []);
			}

			workout.exercises.get(exerciseName)!.push({
				weight,
				reps,
				setNumber,
				duration,
				instructions: instructions?.trim(),
				notes: notes?.trim()
			});
		} catch (error) {
			errors.push(`Line ${lineNum}: ${error instanceof Error ? error.message : 'Unknown error'}`);
		}
	}

	// Create workouts
	let success = 0;
	for (const workout of workoutMap.values()) {
		try {
			const workoutExercises = Array.from(workout.exercises.entries()).map(
				([exerciseName, sets]) => {
					const exercise = exerciseMap.get(exerciseName.toLowerCase())!;

					// Sort sets by set number
					sets.sort((a, b) => a.setNumber - b.setNumber);

					return {
						exerciseId: exercise.id!,
						exerciseName: exercise.name,
						sets: sets.map((s) => ({
							weight: s.weight,
							reps: s.reps,
							duration: s.duration,
							completed: false
						})),
						instructions: sets[0]?.instructions,
						notes: sets[0]?.notes
					};
				}
			);

			await addWorkout({
				name: workout.name,
				date: workout.date,
				exercises: workoutExercises
			});

			success++;
		} catch (error) {
			errors.push(
				`Workout "${workout.name}" on ${workout.date}: ${error instanceof Error ? error.message : 'Unknown error'}`
			);
		}
	}

	return { success, errors };
}

/**
 * Download a string as a file
 */
export function downloadFile(
	content: string,
	filename: string,
	contentType: string = 'text/csv'
): void {
	const blob = new Blob([content], { type: contentType });
	const url = URL.createObjectURL(blob);
	const link = document.createElement('a');
	link.href = url;
	link.download = filename;
	document.body.appendChild(link);
	link.click();
	document.body.removeChild(link);
	URL.revokeObjectURL(url);
}

/**
 * Escape CSV value (handle commas, quotes, newlines)
 */
function escapeCsvValue(value: string): string {
	if (!value) return '';

	// If value contains comma, quote, or newline, wrap in quotes and escape internal quotes
	if (value.includes(',') || value.includes('"') || value.includes('\n')) {
		return `"${value.replace(/"/g, '""')}"`;
	}

	return value;
}

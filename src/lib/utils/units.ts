/**
 * Unit conversion utilities for weight measurements
 * All weights are stored internally in kilograms (kg)
 */

const KG_TO_LBS = 2.20462262185;
const LBS_TO_KG = 0.45359237;

/**
 * Convert pounds to kilograms
 */
export function lbsToKg(lbs: number): number {
	return lbs * LBS_TO_KG;
}

/**
 * Convert kilograms to pounds
 */
export function kgToLbs(kg: number): number {
	return kg * KG_TO_LBS;
}

/**
 * Convert weight from storage (kg) to display based on unit preference
 */
export function convertWeightToDisplay(kg: number, unit: 'metric' | 'imperial'): number {
	if (unit === 'imperial') {
		return kgToLbs(kg);
	}
	return kg;
}

/**
 * Convert weight from display to storage (kg) based on unit preference
 */
export function convertWeightToStorage(value: number, unit: 'metric' | 'imperial'): number {
	if (unit === 'imperial') {
		return lbsToKg(value);
	}
	return value;
}

/**
 * Format weight for display with proper rounding and unit label
 */
export function formatWeight(kg: number, unit: 'metric' | 'imperial'): string {
	const displayValue = convertWeightToDisplay(kg, unit);
	const rounded = Math.round(displayValue * 10) / 10; // Round to 1 decimal
	const unitLabel = unit === 'imperial' ? 'lbs' : 'kg';
	return `${rounded} ${unitLabel}`;
}

/**
 * Get the unit label for display
 */
export function getUnitLabel(unit: 'metric' | 'imperial'): string {
	return unit === 'imperial' ? 'lbs' : 'kg';
}

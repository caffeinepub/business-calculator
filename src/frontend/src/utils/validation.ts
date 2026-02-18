export interface ValidationResult {
  isValid: boolean;
  error?: string;
}

export function validateNumber(value: string, fieldName: string): ValidationResult {
  if (value === '' || value === null || value === undefined) {
    return { isValid: true };
  }

  const num = parseFloat(value);
  if (isNaN(num)) {
    return {
      isValid: false,
      error: `${fieldName} must be a valid number`,
    };
  }

  if (num < 0) {
    return {
      isValid: false,
      error: `${fieldName} cannot be negative`,
    };
  }

  return { isValid: true };
}

export function parseNumberSafe(value: string | number): number {
  if (typeof value === 'number') return value;
  const parsed = parseFloat(value);
  return isNaN(parsed) ? 0 : parsed;
}

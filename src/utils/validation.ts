/**
 * Centralized validation utilities for MedConnect EHR
 */

export const validation = {
  /**
   * Validate email format
   */
  email: (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  },

  /**
   * Validate phone number (basic validation)
   */
  phone: (phone: string): boolean => {
    const phoneRegex = /^[\+]?[1-9][\d]{0,15}$/;
    return phoneRegex.test(phone.replace(/[\s\-\(\)]/g, ''));
  },

  /**
   * Validate date is not in the future
   */
  dateNotInFuture: (dateString: string): boolean => {
    const date = new Date(dateString);
    const now = new Date();
    return date <= now;
  },

  /**
   * Validate required fields
   */
  required: (value: any): boolean => {
    if (typeof value === 'string') {
      return value.trim().length > 0;
    }
    return value != null && value !== undefined;
  },

  /**
   * Validate age is reasonable (0-150)
   */
  age: (age: number): boolean => {
    return age >= 0 && age <= 150;
  },

  /**
   * Validate quantity is positive
   */
  positiveNumber: (num: number): boolean => {
    return num > 0 && Number.isInteger(num);
  },

  /**
   * Validate patient ID format
   */
  patientId: (id: string): boolean => {
    return /^[A-Z]\d{5,}$/.test(id);
  }
};

/**
 * Validation error messages
 */
export const validationMessages = {
  email: 'Please enter a valid email address',
  phone: 'Please enter a valid phone number',
  dateNotInFuture: 'Date cannot be in the future',
  required: 'This field is required',
  age: 'Age must be between 0 and 150',
  positiveNumber: 'Must be a positive number',
  patientId: 'Invalid patient ID format'
};

/**
 * Validate a form field
 */
export function validateField(value: any, rules: Array<keyof typeof validation>): string[] {
  const errors: string[] = [];

  for (const rule of rules) {
    if (!validation[rule](value)) {
      errors.push(validationMessages[rule]);
    }
  }

  return errors;
}

/**
 * Validate entire form
 */
export function validateForm(formData: Record<string, any>, rules: Record<string, Array<keyof typeof validation>>): Record<string, string[]> {
  const errors: Record<string, string[]> = {};

  for (const [field, fieldRules] of Object.entries(rules)) {
    const fieldErrors = validateField(formData[field], fieldRules);
    if (fieldErrors.length > 0) {
      errors[field] = fieldErrors;
    }
  }

  return errors;
}
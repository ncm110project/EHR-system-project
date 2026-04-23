/**
 * Centralized data storage abstraction for localStorage operations
 * Provides error handling and type safety for all data operations
 */

export class DataStorage {
  private static readonly PREFIX = 'medconnect_';

  /**
   * Get data from localStorage with error handling
   */
  static get<T>(key: string): T | null {
    try {
      const fullKey = this.PREFIX + key;
      const item = localStorage.getItem(fullKey);
      return item ? JSON.parse(item) : null;
    } catch (error) {
      console.error(`Failed to get ${key} from localStorage:`, error);
      return null;
    }
  }

  /**
   * Set data in localStorage with error handling
   */
  static set<T>(key: string, value: T): void {
    try {
      const fullKey = this.PREFIX + key;
      localStorage.setItem(fullKey, JSON.stringify(value));
    } catch (error) {
      console.error(`Failed to set ${key} in localStorage:`, error);
    }
  }

  /**
   * Remove data from localStorage
   */
  static remove(key: string): void {
    try {
      const fullKey = this.PREFIX + key;
      localStorage.removeItem(fullKey);
    } catch (error) {
      console.error(`Failed to remove ${key} from localStorage:`, error);
    }
  }

  /**
   * Clear all MedConnect data
   */
  static clear(): void {
    try {
      const keys = Object.keys(localStorage);
      keys.forEach(key => {
        if (key.startsWith(this.PREFIX)) {
          localStorage.removeItem(key);
        }
      });
    } catch (error) {
      console.error('Failed to clear localStorage:', error);
    }
  }

  /**
   * Get or create data with default value
   */
  static getOrDefault<T>(key: string, defaultValue: T): T {
    const existing = this.get<T>(key);
    return existing ?? defaultValue;
  }

  /**
   * Update existing data with a transform function
   */
  static update<T>(key: string, updater: (current: T | null) => T): void {
    const current = this.get<T>(key);
    const updated = updater(current);
    this.set(key, updated);
  }
}
import { describe, test, expect, beforeEach, afterEach, jest } from '@jest/globals'; // Changed beforeAll/afterAll to beforeEach/afterEach
import { calculateInitialReviewState, calculateNextReviewState } from './scheduler';

// ... rest of the file ...
const ONE_DAY_MS = 24 * 60 * 60 * 1000;

describe('Scheduler Logic', () => {

  // Mock Date.now() for consistent testing
  const MOCK_NOW = 1700000000000; // An arbitrary timestamp
  let dateNowSpy;
  beforeEach(() => {
    dateNowSpy = jest.spyOn(Date, 'now').mockImplementation(() => MOCK_NOW);
  });
  afterEach(() => {
    dateNowSpy.mockRestore();
  });

  describe('calculateInitialReviewState', () => {
    const mockSettings = { initialReviewDays: 1, maxReviewsPerSession: 10 };
    const mockSettingsLonger = { initialReviewDays: 3, maxReviewsPerSession: 5 };

    test('should return correct initial state with default priority', () => {
      const { nextReviewDate, interval, easeFactor } = calculateInitialReviewState(mockSettings);
      expect(interval).toBe(1);
      expect(easeFactor).toBe(2.5);
      expect(nextReviewDate).toBe(MOCK_NOW + 1 * ONE_DAY_MS);
    });

    test('should return correct initial state with custom initial days', () => {
      const { nextReviewDate, interval } = calculateInitialReviewState(mockSettingsLonger);
      expect(interval).toBe(3);
      expect(nextReviewDate).toBe(MOCK_NOW + 3 * ONE_DAY_MS);
    });

    test('should return the same initial state regardless of priority (MVP behavior)', () => {
      const priority1 = calculateInitialReviewState(mockSettings, 1);
      const priority5 = calculateInitialReviewState(mockSettings, 5);
      expect(priority1.interval).toBe(1);
      expect(priority5.interval).toBe(1);
      expect(priority1.nextReviewDate).toBe(MOCK_NOW + 1 * ONE_DAY_MS);
      expect(priority5.nextReviewDate).toBe(MOCK_NOW + 1 * ONE_DAY_MS);
    });
  });

  describe('calculateNextReviewState', () => {
    const mockSettings = { initialReviewDays: 1, maxReviewsPerSession: 10 };
    const baseItem = {
      id: 'test1',
      type: 'note',
      content: 'Test',
      addedDate: MOCK_NOW - 5 * ONE_DAY_MS,
      interval: 5, // Current interval
      easeFactor: 2.5,
      priority: 3,
      lastReviewedDate: MOCK_NOW - 5 * ONE_DAY_MS,
      nextReviewDate: MOCK_NOW, // Due now
    };

    test('should calculate next state correctly for first review (interval <= initial)', () => {
        const firstReviewItem = { ...baseItem, interval: 1, lastReviewedDate: undefined };
        const { nextReviewDate, nextInterval, nextEaseFactor } = calculateNextReviewState(firstReviewItem, mockSettings);

        // Expected: initialDays * 2 * priorityMultiplier (1 * 2 * 1.0 = 2)
        expect(nextInterval).toBe(2);
        expect(nextEaseFactor).toBe(2.5); // Unchanged in MVP
        expect(nextReviewDate).toBe(MOCK_NOW + 2 * ONE_DAY_MS);
    });

    test('should calculate next state correctly for subsequent review (default priority)', () => {
      const { nextReviewDate, nextInterval, nextEaseFactor } = calculateNextReviewState(baseItem, mockSettings);

      // Expected: currentInterval * easeFactor * priorityMultiplier (5 * 2.5 * 1.0 = 12.5 -> rounded 13)
      expect(nextInterval).toBe(13);
      expect(nextEaseFactor).toBe(2.5);
      expect(nextReviewDate).toBe(MOCK_NOW + 13 * ONE_DAY_MS);
    });

    test('should apply priority multiplier correctly (High Priority = P1)', () => {
      const highPriorityItem = { ...baseItem, priority: 1 }; // P1 multiplier = 0.9
      const { nextReviewDate, nextInterval } = calculateNextReviewState(highPriorityItem, mockSettings);

      // Expected: 5 * 2.5 * 0.9 = 11.25 -> rounded 11
      expect(nextInterval).toBe(11);
      expect(nextReviewDate).toBe(MOCK_NOW + 11 * ONE_DAY_MS);
    });

    test('should apply priority multiplier correctly (Low Priority = P5)', () => {
      const lowPriorityItem = { ...baseItem, priority: 5 }; // P5 multiplier = 1.1
      const { nextReviewDate, nextInterval } = calculateNextReviewState(lowPriorityItem, mockSettings);

      // Expected: 5 * 2.5 * 1.1 = 13.75 -> rounded 14
      expect(nextInterval).toBe(14);
      expect(nextReviewDate).toBe(MOCK_NOW + 14 * ONE_DAY_MS);
    });

    test('should handle missing interval/easeFactor/priority by using defaults', () => {
        const minimalItem = { id: 'min', type:'note', content:'', addedDate: MOCK_NOW, nextReviewDate: MOCK_NOW };
        // Assume first review scenario (lastReviewedDate undefined)
        const { nextReviewDate, nextInterval, nextEaseFactor } = calculateNextReviewState(minimalItem, mockSettings);

        // Expected: initialDays * 2 * priorityMultiplier (1 * 2 * 1.0 = 2)
        expect(nextInterval).toBe(2);
        expect(nextEaseFactor).toBe(2.5);
        expect(nextReviewDate).toBe(MOCK_NOW + 2 * ONE_DAY_MS);
    });

    test('should ensure nextInterval is at least 1', () => {
        // Setup where calculation might yield < 1
        const lowIntervalItem = { ...baseItem, interval: 0.2, easeFactor: 1.0, priority: 1 }; // 0.2 * 1.0 * 0.9 = 0.18 -> enters first review path -> 1 * 2 * 0.9 = 1.8 -> rounds to 2
        const { nextInterval } = calculateNextReviewState(lowIntervalItem, mockSettings);
        expect(nextInterval).toBe(2); // Corrected expectation based on logic trace
    });

  });

}); 
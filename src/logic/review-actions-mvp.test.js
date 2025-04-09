import { describe, test, expect, beforeAll, beforeEach, afterEach, jest } from '@jest/globals'; // Changed scope

// --- Mock Setup --- Declare mocks *before* jest.mock
const mockGetReviewItem = jest.fn();
const mockSaveReviewItem = jest.fn();
const mockDeleteReviewItemStorage = jest.fn();
const mockGetSettings = jest.fn();
const mockCalculateNextReviewState = jest.fn();

jest.mock('../storage/storage', () => ({
  getReviewItem: mockGetReviewItem,
  saveReviewItem: mockSaveReviewItem,
  deleteReviewItem: mockDeleteReviewItemStorage,
  getSettings: mockGetSettings,
}));

jest.mock('./scheduler', () => ({
  calculateNextReviewState: mockCalculateNextReviewState,
}));
// --- End Mock Setup ---

// Import the module *after* mocking
// Moved import to inside describe block

const ONE_DAY_MS = 24 * 60 * 60 * 1000;

describe('Review Actions MVP Logic', () => {
  // Import here
  let postponeItem, markItemAsRead, deleteReviewItem;
  beforeAll(async () => {
      // Dynamically import the module after mocks are set
      const module = await import('./review-actions-mvp');
      postponeItem = module.postponeItem;
      markItemAsRead = module.markItemAsRead;
      deleteReviewItem = module.deleteReviewItem;
  });

  // Date mock using beforeEach/afterEach
  const MOCK_NOW = 1700000000000;
  let dateNowSpy;
  beforeEach(() => {
    dateNowSpy = jest.spyOn(Date, 'now').mockImplementation(() => MOCK_NOW);
    // Clear mocks here as well, ensuring clean state for each test
    jest.clearAllMocks();
  });
  afterEach(() => {
    dateNowSpy.mockRestore();
  });

  const mockItemId = 'item-123';
  const mockItem = {
    id: mockItemId,
    type: 'note',
    content: 'Test Note',
    addedDate: MOCK_NOW - 2 * ONE_DAY_MS,
    nextReviewDate: MOCK_NOW,
    interval: 2,
    easeFactor: 2.5,
    priority: 3,
  };
  const mockSettings = { initialReviewDays: 1, maxReviewsPerSession: 10, id: 'defaultSettings' };

  describe('postponeItem', () => {
    test('should get item, update nextReviewDate to tomorrow, and save', async () => {
      mockGetReviewItem.mockResolvedValue(mockItem);

      const result = await postponeItem(mockItemId);

      expect(mockGetReviewItem).toHaveBeenCalledWith(mockItemId);
      const expectedSavedItem = {
        ...mockItem,
        nextReviewDate: MOCK_NOW + ONE_DAY_MS,
      };
      expect(mockSaveReviewItem).toHaveBeenCalledWith(expectedSavedItem);
      expect(result).toEqual(expectedSavedItem);
    });

    test('should throw error if item not found', async () => {
      mockGetReviewItem.mockResolvedValue(undefined);
      await expect(postponeItem(mockItemId)).rejects.toThrow('Item with ID item-123 not found for postponing.');
      expect(mockSaveReviewItem).not.toHaveBeenCalled();
    });
  });

  describe('markItemAsRead', () => {
    const mockSchedulerResult = {
      nextReviewDate: MOCK_NOW + 5 * ONE_DAY_MS,
      nextInterval: 5,
      nextEaseFactor: 2.5,
    };

    test('should get item, get settings, calculate next state, update item, and save', async () => {
      mockGetReviewItem.mockResolvedValue(mockItem);
      mockGetSettings.mockResolvedValue(mockSettings);
      mockCalculateNextReviewState.mockReturnValue(mockSchedulerResult);

      const result = await markItemAsRead(mockItemId);

      expect(mockGetReviewItem).toHaveBeenCalledWith(mockItemId);
      expect(mockGetSettings).toHaveBeenCalled();
      expect(mockCalculateNextReviewState).toHaveBeenCalledWith(mockItem, mockSettings);

      const expectedSavedItem = {
        ...mockItem,
        lastReviewedDate: MOCK_NOW,
        nextReviewDate: mockSchedulerResult.nextReviewDate,
        interval: mockSchedulerResult.nextInterval,
        easeFactor: mockSchedulerResult.nextEaseFactor,
      };
      expect(mockSaveReviewItem).toHaveBeenCalledWith(expectedSavedItem);
      expect(result).toEqual(expectedSavedItem);
    });

    test('should throw error if item not found', async () => {
      mockGetReviewItem.mockResolvedValue(undefined);
      await expect(markItemAsRead(mockItemId)).rejects.toThrow('Item with ID item-123 not found for marking as read.');
      expect(mockGetSettings).not.toHaveBeenCalled();
      expect(mockCalculateNextReviewState).not.toHaveBeenCalled();
      expect(mockSaveReviewItem).not.toHaveBeenCalled();
    });

    test('should throw error if settings not found', async () => {
      mockGetReviewItem.mockResolvedValue(mockItem);
      mockGetSettings.mockResolvedValue(undefined);
      await expect(markItemAsRead(mockItemId)).rejects.toThrow('Settings not available for scheduling.');
      expect(mockCalculateNextReviewState).not.toHaveBeenCalled();
      expect(mockSaveReviewItem).not.toHaveBeenCalled();
    });
  });

  describe('deleteReviewItem', () => {
    test('should call the storage delete function', async () => {
      await deleteReviewItem(mockItemId);
      expect(mockDeleteReviewItemStorage).toHaveBeenCalledWith(mockItemId);
    });
  });
}); 
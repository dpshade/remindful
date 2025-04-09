import { getReviewItem, saveReviewItem, deleteReviewItem as storageDelete, getSettings } from '../storage/storage';
import { calculateNextReviewState } from '../logic/scheduler';

const ONE_DAY_MS = 24 * 60 * 60 * 1000;

/**
 * Postpones an item's review by one day.
 * @param {string} itemId - The ID of the item to postpone.
 * @returns {Promise<import('../types').ReviewItem>}
 */
export async function postponeItem(itemId) {
  const item = await getReviewItem(itemId);
  if (!item) {
    throw new Error(`Item with ID ${itemId} not found for postponing.`);
  }

  const updatedItem = {
    ...item,
    nextReviewDate: Date.now() + ONE_DAY_MS, // Postpone by 1 day from now
    // Note: We don't update lastReviewedDate or interval when postponing
  };

  await saveReviewItem(updatedItem);
  console.log(`Postponed item ${itemId} by 1 day.`);
  return updatedItem;
}

/**
 * Marks an item as read, updating its last reviewed date and calculating the next review date using the scheduler.
 * @param {string} itemId - The ID of the item to mark as read.
 * @returns {Promise<import('../types').ReviewItem>}
 */
export async function markItemAsRead(itemId) {
  const item = await getReviewItem(itemId);
  if (!item) {
    throw new Error(`Item with ID ${itemId} not found for marking as read.`);
  }
  const settings = await getSettings();
  if (!settings) {
    throw new Error("Settings not available for scheduling.");
  }

  const { nextReviewDate, nextInterval, nextEaseFactor } = calculateNextReviewState(item, settings);

  const updatedItem = {
    ...item,
    lastReviewedDate: Date.now(),
    nextReviewDate: nextReviewDate,
    interval: nextInterval,
    easeFactor: nextEaseFactor,
  };

  await saveReviewItem(updatedItem);
  console.log(`Marked item ${itemId} as read. Next review in ${updatedItem.interval} days.`);
  return updatedItem;
}

/**
 * Schedules a review item for a specific date, bypassing SRS calculation.
 * @param {string} itemId - The ID of the item to schedule.
 * @param {number} dateTimestamp - The timestamp (Date.now()) for the next review date.
 */
export async function scheduleItemForDate(itemId, dateTimestamp) {
  const item = await getReviewItem(itemId);
  if (!item) {
    throw new Error('Item not found for scheduling');
  }

  item.nextReviewDate = dateTimestamp;
  // Resetting interval/easeFactor might be desirable when manually scheduling
  // item.interval = 1; 
  // item.easeFactor = 2.5;

  await saveReviewItem(item);
  console.log(`Item ${itemId} scheduled for ${new Date(dateTimestamp).toLocaleDateString()}`);
}

/**
 * Deletes an item.
 * (This just re-exports the function from storage for logical grouping).
 * @param {string} itemId - The ID of the item to delete.
 * @returns {Promise<void>}
 */
export const deleteReviewItem = storageDelete; 

/**
 * Deletes a review item.
 * @param {string} itemId - The ID of the item to delete.
 */
export async function deleteReviewItemFromDb(itemId) {
  await deleteReviewItemFromDb(itemId);
  console.log(`Item ${itemId} deleted`);
} 
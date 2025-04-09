import { getAllReviewItems, getSettings, saveReviewItem, saveSettings } from '../storage/storage';
import { v4 as uuidv4 } from 'uuid'; // Needed for potential ID regeneration during import

/**
 * Generates a master JSON string containing all settings and review items.
 * @returns {Promise<string>} A JSON string representing the application state.
 */
export async function generateExportJson() {
  try {
    const settings = await getSettings();
    const items = await getAllReviewItems();

    const exportData = {
      version: 1, // Add a version number for future compatibility
      exportedAt: Date.now(),
      settings: settings || { id: 'defaultSettings', maxReviewsPerSession: 10, initialReviewDays: 1 }, // Include default if none exist
      reviewItems: items || [],
    };

    return JSON.stringify(exportData, null, 2); // Pretty print JSON
  } catch (error) {
    console.error("Error generating export data:", error);
    throw new Error("Failed to generate export data.");
  }
}

/**
 * Imports data from a JSON string, replacing existing settings and items.
 * Warning: This is a destructive operation.
 * @param {string} jsonString - The JSON string containing the exported data.
 * @returns {Promise<{itemsImported: number, settingsImported: boolean}>}
 */
export async function importFromJson(jsonString) {
  try {
    const importData = JSON.parse(jsonString);

    // Basic validation (can be expanded)
    if (!importData || typeof importData !== 'object') {
      throw new Error("Invalid import file format: Not an object.");
    }
    if (!importData.reviewItems || !Array.isArray(importData.reviewItems)) {
      throw new Error("Invalid import file format: Missing or invalid 'reviewItems' array.");
    }
    if (!importData.settings || typeof importData.settings !== 'object') {
        throw new Error("Invalid import file format: Missing or invalid 'settings' object.");
    }

    // TODO: Clear existing data? For MVP, we overwrite.
    // In a real app, provide options (merge, replace, etc.)
    // We need functions to clear stores if replacing fully.
    // For now, we rely on put() overwriting based on ID.

    let itemsImportedCount = 0;
    let settingsImported = false;

    // Import Settings (ensure ID is correct)
    const settingsToImport = { ...importData.settings, id: 'defaultSettings' };
    await saveSettings(settingsToImport);
    settingsImported = true;
    console.log("Imported settings.");

    // Import Items
    // Note: This simple import assumes IDs are unique. If importing from
    // another instance, ID clashes are possible. A more robust import
    // might regenerate IDs or offer merge strategies.
    for (const item of importData.reviewItems) {
      // Basic validation for each item (can be expanded)
      if (item && item.id && item.type && item.content) {
        // Ensure required fields like nextReviewDate, interval, easeFactor exist
        const validatedItem = {
            ...item,
            id: item.id || uuidv4(), // Keep original ID or generate if missing
            addedDate: item.addedDate || Date.now(),
            nextReviewDate: item.nextReviewDate || Date.now(),
            interval: item.interval || importData.settings.initialReviewDays || 1,
            easeFactor: item.easeFactor || 2.5,
            priority: item.priority || 3,
            // Ensure dates are numbers (timestamps)
            ...(item.addedDate && { addedDate: Number(item.addedDate) }),
            ...(item.nextReviewDate && { nextReviewDate: Number(item.nextReviewDate) }),
            ...(item.lastReviewedDate && { lastReviewedDate: Number(item.lastReviewedDate) }),
        };
        await saveReviewItem(validatedItem);
        itemsImportedCount++;
      } else {
        console.warn("Skipping invalid item during import:", item);
      }
    }
    console.log(`Imported ${itemsImportedCount} items.`);

    return {
      itemsImported: itemsImportedCount,
      settingsImported: settingsImported,
    };

  } catch (error) {
    console.error("Error importing data:", error);
    // Distinguish between parse error and other errors
    if (error instanceof SyntaxError) {
        throw new Error("Failed to import data: Invalid JSON format.");
    } else {
        throw new Error(`Failed to import data: ${error.message}`);
    }
  }
} 
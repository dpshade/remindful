const ONE_DAY_MS = 24 * 60 * 60 * 1000;

/**
 * Calculates the next review date based on priority and a modified interval doubling.
 * Lower priority numbers (e.g., 1) mean higher importance and potentially shorter initial intervals
 * or slower interval growth.
 *
 * This is an enhanced MVP scheduler, not a full SRS algorithm like SM-2.
 *
 * @param {import('../types').ReviewItem} item - The item being reviewed (must include interval, easeFactor, priority).
 * @param {import('../types').AppSettings} settings - App settings (currently uses initialReviewDays as a base).
 * @returns {{nextReviewDate: number, nextInterval: number, nextEaseFactor: number}} - Object containing calculated next values.
 */
export function calculateNextReviewState(item, settings) {
  // --- Parameters & Defaults ---
  const currentInterval = item.interval || settings.initialReviewDays || 1;
  const currentEaseFactor = item.easeFactor || 2.5; // Standard default
  const priority = item.priority || 3; // Default priority

  // --- Priority Modifier ---
  // Simple modifier: Higher priority (lower number) slows interval growth slightly.
  // Priority 1: 0.9x multiplier, Priority 3: 1.0x, Priority 5: 1.1x
  // Adjust this curve as needed.
  const priorityMultiplier = 1 + (priority - 3) * 0.05; // e.g., P1=0.9, P2=0.95, P3=1.0, P4=1.05, P5=1.1

  // --- Calculate New Interval ---
  // Basic approach: Multiply interval by ease factor, adjusted by priority.
  // For the very first review (interval === initialReviewDays), maybe use a simpler step?
  let nextInterval;
  if (item.lastReviewedDate === undefined || currentInterval <= settings.initialReviewDays) {
    // First successful review or based on initial setting
    // Use a slightly modified initial step based on priority?
    // Example: Base * (1 + (3-priority)*0.1) => P1=1.2, P2=1.1, P3=1.0, P4=0.9, P5=0.8
    // Let's keep it simpler for MVP: double the initial days, then apply priority.
    nextInterval = (settings.initialReviewDays || 1) * 2 * priorityMultiplier;
  } else {
    // Subsequent reviews: interval * ease * priority
    nextInterval = currentInterval * currentEaseFactor * priorityMultiplier;
  }

  // --- Interval Capping & Minimum ---
  nextInterval = Math.max(1, nextInterval); // Ensure interval is at least 1 day
  // Add a max interval cap? e.g., 365 days. Maybe not for MVP.
  // nextInterval = Math.min(365, nextInterval);

  // Round the interval for simplicity (optional)
  nextInterval = Math.round(nextInterval);

  // --- Ease Factor Adjustment (Simplified) ---
  // A real SRS would adjust ease based on recall quality (Easy, Good, Hard).
  // Since we only have "Read", we won't adjust ease in this MVP scheduler.
  const nextEaseFactor = currentEaseFactor;

  // --- Calculate Next Review Date ---
  const nextReviewDate = Date.now() + nextInterval * ONE_DAY_MS;

  console.log(`Scheduler: Item ${item.id}, P${priority}, Int ${currentInterval} -> ${nextInterval}, EF ${currentEaseFactor}`);

  return {
    nextReviewDate: Math.round(nextReviewDate),
    nextInterval: nextInterval,
    nextEaseFactor: nextEaseFactor,
  };
}

/**
 * Calculates the initial review state for a newly added item.
 * @param {import('../types').AppSettings} settings - Application settings.
 * @param {number} [priority=3] - The priority of the new item.
 * @returns {{nextReviewDate: number, interval: number, easeFactor: number}}
 */
export function calculateInitialReviewState(settings, priority = 3) {
    const initialDays = settings.initialReviewDays || 1;
    const easeFactor = 2.5; // Default

    // Apply priority modifier to the *first* interval?
    // Let's keep the *very first* interval fixed by the setting for simplicity.
    const interval = initialDays;
    const nextReviewDate = Date.now() + interval * ONE_DAY_MS;

    return {
        nextReviewDate: Math.round(nextReviewDate),
        interval: interval,
        easeFactor: easeFactor,
    };
} 
const ONE_DAY_MS = 24 * 60 * 60 * 1000;

/**
 * Calculates the next review date based on priority and a modified interval doubling.
 * Lower priority numbers (e.g., 1) mean higher importance and potentially shorter initial intervals
 * or slower interval growth.
 *
 * This is an enhanced MVP scheduler, incorporating recall quality feedback.
 *
 * @param {import('../types').ReviewItem} item - The item being reviewed (must include interval, easeFactor, priority).
 * @param {import('../types').AppSettings} settings - App settings (uses initialReviewDays).
 * @param {number} quality - The recall quality score (0-5, where 5 is best).
 * @returns {{nextReviewDate: number, nextInterval: number, nextEaseFactor: number}} - Object containing calculated next values.
 */
export function calculateNextReviewState(item, settings, quality) {
  const MIN_EASE = 1.3;
  const currentInterval = item.interval ?? settings.initialReviewDays ?? 1;
  const currentEaseFactor = item.easeFactor ?? 2.5;
  const priority = item.priority ?? 3; // Default priority 3 if undefined

  // Priority Modifier - Higher priority (lower number) slightly slows interval growth
  const priorityMultiplier = 1 + (priority - 3) * 0.05; // P1=0.9, P3=1.0, P5=1.1

  let nextInterval;
  let nextEaseFactor = currentEaseFactor;

  if (quality < 3) { // 'hard' (Quality 0, 1, 2) - Forget, reset interval, decrease ease
    nextInterval = settings.initialReviewDays || 1; // Reset to base interval
    nextEaseFactor = Math.max(MIN_EASE, currentEaseFactor - 0.20); // Decrease EF significantly
  } else { // 'good' or 'easy' (Quality 3, 4, 5)
    if (currentInterval <= (settings.initialReviewDays || 1) && !item.lastReviewedDate) {
       // First successful review of a new item
       // Use a base multiplier, boost significantly for 'easy'
       nextInterval = Math.round((settings.initialReviewDays || 1) * (quality === 5 ? 4 : 2.5));
    } else {
      // Subsequent reviews
      // Base interval calculation: current * ease * priority modifier
      nextInterval = Math.round(currentInterval * currentEaseFactor * priorityMultiplier);
    }
    // Adjust ease factor based on quality (SM-2 formula component)
    nextEaseFactor = currentEaseFactor + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02));
    nextEaseFactor = Math.max(MIN_EASE, nextEaseFactor); // Ensure ease doesn't drop too low
  }

  // Apply interval limits
  nextInterval = Math.max(1, nextInterval); // Ensure interval is at least 1 day
  // Consider adding a max interval if desired: nextInterval = Math.min(365, nextInterval);

  const nextReviewDate = Date.now() + nextInterval * ONE_DAY_MS;

  console.log(`Scheduler: Item ${item.id}, P${priority}, Q${quality}, Int ${currentInterval} -> ${nextInterval}, EF ${currentEaseFactor.toFixed(2)} -> ${nextEaseFactor.toFixed(2)}`);

  return {
    nextReviewDate: Math.round(nextReviewDate),
    nextInterval: nextInterval,
    nextEaseFactor: parseFloat(nextEaseFactor.toFixed(2)), // Keep reasonable precision
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
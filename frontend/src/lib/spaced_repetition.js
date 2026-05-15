// ─────────────────────────────────────────────────────────────
// SM-2 Spaced Repetition Algorithm
// Based on the SuperMemo SM-2 algorithm
//
// Each card has a "review record":
//   { cardId, easeFactor, interval, repetitions, nextReview, lastReview }
//
// When user answers:
//   quality 0-1 = didn't know (fail)
//   quality 2-3 = knew with difficulty
//   quality 4-5 = knew easily
// ─────────────────────────────────────────────────────────────

export const DEFAULT_EASE = 2.5
export const MIN_EASE = 1.3
export const MAX_INTERVAL = 365 // days

/**
 * Calculate next review date using SM-2
 * @param {object} record - existing review record (or null for new card)
 * @param {number} quality - 0 (forgot) to 5 (perfect)
 */
export function calculateNextReview(record, quality) {
  const now = new Date()

  let { easeFactor, interval, repetitions } = record || {
    easeFactor: DEFAULT_EASE,
    interval: 1,
    repetitions: 0,
  }

  if (quality >= 3) {
    // Correct response
    if (repetitions === 0) interval = 1
    else if (repetitions === 1) interval = 6
    else interval = Math.round(interval * easeFactor)

    repetitions += 1
  } else {
    // Incorrect — reset to beginning but keep ease factor penalty
    repetitions = 0
    interval = 1
  }

  // Update ease factor (SM-2 formula)
  easeFactor = Math.max(
    MIN_EASE,
    easeFactor + 0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02)
  )

  // Cap interval
  interval = Math.min(interval, MAX_INTERVAL)

  const nextReview = new Date(now)
  nextReview.setDate(nextReview.getDate() + interval)

  return {
    easeFactor: parseFloat(easeFactor.toFixed(2)),
    interval,
    repetitions,
    lastReview: now.toISOString(),
    nextReview: nextReview.toISOString(),
  }
}

/**
 * Given a map of all review records, return cards due today
 * @param {string[]} allCardIds
 * @param {object} reviewRecords - { [cardId]: { nextReview, ... } }
 */
export function getDueCards(allCardIds, reviewRecords) {
  const now = new Date()
  return allCardIds.filter(id => {
    const record = reviewRecords[id]
    if (!record) return true // never seen → due
    return new Date(record.nextReview) <= now
  })
}

/**
 * Return a colour/label for how mature a card is
 */
export function getCardMaturity(record) {
  if (!record || record.repetitions === 0) return { label: 'New', color: '#2196F3' }
  if (record.interval < 7) return { label: 'Learning', color: '#FF9800' }
  if (record.interval < 21) return { label: 'Young', color: '#4CAF50' }
  return { label: 'Mature', color: '#9C27B0' }
}

/**
 * Stats summary for a domain
 */
export function getDomainSRStats(cardIds, reviewRecords) {
  const now = new Date()
  let newCount = 0, dueCount = 0, learnedCount = 0

  for (const id of cardIds) {
    const r = reviewRecords[id]
    if (!r) { newCount++; continue }
    if (new Date(r.nextReview) <= now) dueCount++
    else learnedCount++
  }

  return { newCount, dueCount, learnedCount, total: cardIds.length }
}

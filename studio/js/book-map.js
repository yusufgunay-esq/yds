/* ==========================================================================
   book-map.js — Konu ve kaynak bölüm aralığı eşlemesi
   ========================================================================== */
/* © 2026 Yusuf GÜNAY — Tüm Hakları Saklıdır / All Rights Reserved. */

export const NO_BOOK_SUBJECTS = new Set();

const TOPIC_LOCATION = {};

export function bookLocationFor(topicId, subjectId) {
  if (topicId && TOPIC_LOCATION[topicId]) return TOPIC_LOCATION[topicId];
  return null;
}

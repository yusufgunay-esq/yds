/* ==========================================================================
   book-map.js — KONU → FİZİKSEL KİTAP SAYFASI EŞLEMESİ (YDS: boş)
   HMGS'deki hukuk kitabı sayfa eşlemesi YDS'de anlamsız olduğu için kaldırıldı.
   Arayüz sözleşmesi korunur: bookLocationFor() konum bilinmiyorsa null döner.
   YDS kitap içindekileri eklenirse TOPIC_LOCATION doldurulur; uydurma yok.
   ========================================================================== */
/* © 2026 Yusuf GÜNAY — Tüm Hakları Saklıdır / All Rights Reserved. */

export const NO_BOOK_SUBJECTS = new Set();

const TOPIC_LOCATION = {};

export function bookLocationFor(topicId, subjectId) {
  if (topicId && TOPIC_LOCATION[topicId]) return TOPIC_LOCATION[topicId];
  return null;
}

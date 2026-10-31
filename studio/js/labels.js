/* ==========================================================================
   labels.js — dinamik kaynak etiket motoru (YDS STÜDYO)
   Açık kaynak repoda YALNIZCA nötr kod adları barınır.
   Gerçek sınav ve yayın etiketleri KESİNLİKLE açık kodda tutulmaz;
   kullanıcı Google Drive kasasını bağladığında doğrudan şahsi Drive
   kasasından (IndexedDB / vaultData) dinamik olarak yüklenir.
   ========================================================================== */

/* © 2026 Yusuf GÜNAY — Tüm Hakları Saklıdır / All Rights Reserved.
   Bu dosya YDS Stüdyo projesinin tescilli kaynak kodudur. */

// ---- KOD ADLARI (açık repo / misafir modu fallbacks) --------------------

const DENEME_ALIAS = {
  deneme_1: 'YDS Deneme Seti 1',
  deneme_2: 'YDS Deneme Seti 2',
  deneme_3: 'YDS Deneme Seti 3',
  deneme_4: 'YDS Deneme Seti 4',
  deneme_5: 'YDS Deneme Seti 5',
};

const ARSIV_ALIAS = {
  yds_2023_01:    'YDS 2023 İlkbahar',
  yds_2023_02:    'YDS 2023 Sonbahar',
  yds_2024_01:    'YDS 2024 İlkbahar',
  yds_2024_02:    'YDS 2024 Sonbahar',
  yds_2025_01:    'YDS 2025 İlkbahar',
  yds_2025_02:    'YDS 2025 Sonbahar',
  yds_2026_01:    'YDS 2026 İlkbahar',
};

// ---- DİNAMİK KASA METADATASI (Google Drive kasasından gelir) ------------

let vaultMeta = null;

export function setVaultLabels(meta) {
  vaultMeta = meta || null;
}

// ---- BÖLÜM BAŞLIKLARI ---------------------------------------------------

export const SECTION = {
  arsiv: () => (vaultMeta && vaultMeta.sections && vaultMeta.sections.arsivTitle) || 'Arşiv Sınavları',
  arsivDesc: () => (vaultMeta && vaultMeta.sections && vaultMeta.sections.arsivDesc) || 'Orijinal soru sırasıyla sınav kağıtları.',
  denemeleri: () => (vaultMeta && vaultMeta.sections && vaultMeta.sections.denemeTitle) || 'Deneme Setleri',
  denemeDesc: () => (vaultMeta && vaultMeta.sections && vaultMeta.sections.denemeDesc) || '80 soru, 180 dakika tam sınav formatı.',
};

// ---- ETİKET FONKSİYONLARI -----------------------------------------------

export function denemeLabel(sourceId) {
  if (vaultMeta && vaultMeta.examLabels && vaultMeta.examLabels[sourceId]) {
    return vaultMeta.examLabels[sourceId];
  }
  return DENEME_ALIAS[sourceId] || sourceId || 'Deneme Seti';
}

export function arsivLabel(sourceId) {
  if (vaultMeta && vaultMeta.examLabels && vaultMeta.examLabels[sourceId]) {
    return vaultMeta.examLabels[sourceId];
  }
  return ARSIV_ALIAS[sourceId] || sourceId || 'Arşiv Sınavı';
}

export function denemeStartLabel(sourceId) {
  const lbl = denemeLabel(sourceId);
  return `${lbl} Başlat`;
}

export function arsivStartLabel(sourceId) {
  const lbl = arsivLabel(sourceId);
  return `${lbl} Başlat`;
}

/* ==========================================================================
   views/pratik.js — YDS HIZLI PRATİK VE ODAK LABORATUVARI
   10 Soru Tipinde Hızlı Odaklanma Sprintleri ve Mikro-Testler
   © 2026 Yusuf GÜNAY — Tüm Hakları Saklıdır.
   ========================================================================== */

import { questionsBySubject, QUESTIONS } from '../data.js';
import { startPracticeSession } from './practice.js';

export const DRILLS = [
  {
    id: 'drill_kelime',
    subjectId: 'kelime',
    title: 'Kelime & Phrasal Verb Sprinti',
    desc: 'Akademik sıfatlar, isimler ve en sık çıkan deyimsel fiiller.',
    count: 5,
    tag: 'Kelime Odaklı'
  },
  {
    id: 'drill_dilbilgisi',
    subjectId: 'dilbilgisi',
    title: 'Dilbilgisi, Zamanlar & Bağlaçlar',
    desc: 'Since kuralı, By the time, zıtlık bağlaçları ve edat kombinasyonları.',
    count: 5,
    tag: 'Gramer Odaklı'
  },
  {
    id: 'drill_cumle',
    subjectId: 'cumle_tamamlama',
    title: 'Cümle Tamamlama Mantık Matrisi',
    desc: 'Zıtlık, sebep-sonuç ve referans zamiri takibi ile hızlı tamamlama.',
    count: 5,
    tag: 'Mantık Köprüsü'
  },
  {
    id: 'drill_ceviri',
    subjectId: 'ceviri',
    title: 'Çeviri: Yüklem ve Özne Dedektifi',
    desc: 'İngilizce-Türkçe ve Türkçe-İngilizce cümlelerde formülle hızlı eleme.',
    count: 6,
    tag: 'Matematiksel Çeviri'
  },
  {
    id: 'drill_okuma',
    subjectId: 'okuma_parcalari',
    title: 'Okuma Parçası Hızlı Anlama',
    desc: 'Akademik metin, ana fikir, doğrudan detay ve çıkarım soruları.',
    count: 4,
    tag: 'Paragraf Çıkarımı'
  },
  {
    id: 'drill_diyalog',
    subjectId: 'diyalog',
    title: 'Diyalog Tamamlama & Ton Analizi',
    desc: 'Karşılıklı konuşmada bağlam, ima ve sonraki cümlenin tepkisi.',
    count: 5,
    tag: 'İletişim & Ton'
  },
  {
    id: 'drill_akisi_bozan',
    subjectId: 'akisi_bozan',
    title: 'Anlam Akışını Bozan Cümle Avı',
    desc: 'Konu kayması, aşırı genelleme ve referans zinciri kopukluğunu tespit et.',
    count: 5,
    tag: 'Akış Bütünlüğü'
  },
  {
    id: 'drill_es_anlam',
    subjectId: 'es_anlam',
    title: 'Eş Anlamlı Cümle (Restatement)',
    desc: 'Devrik koşul, zıtlık ve derece yapılarının anlamca eşdeğerleri.',
    count: 4,
    tag: 'Paraphrase'
  }
];

export function renderPratik() {
  const host = document.getElementById('view-pratik');
  if (!host) return;

  host.innerHTML = `
    <div class="wrap" style="padding-top:1.5rem;padding-bottom:3rem">
      <div style="margin-bottom:1.5rem">
        <h2 style="font-size:1.35rem;font-weight:700;color:var(--ink);letter-spacing:-0.01em">YDS Hızlı Pratik & Odak Laboratuvarı</h2>
        <p style="font-size:0.88rem;color:var(--ink-2);margin-top:0.3rem">
          Uzun denemelere girmeden önce hedef soru tiplerinde refleks kazanmak için tasarlanmış mikro testler.
        </p>
      </div>

      <div class="grid grid-2" style="gap:1rem">
        ${DRILLS.map(d => {
          const pool = questionsBySubject.get(d.subjectId) || [];
          const count = pool.length;
          return `
            <div class="card drill-card" style="display:flex;flex-direction:column;justify-content:space-between;padding:1.25rem">
              <div>
                <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:0.6rem">
                  <span class="chip" style="font-size:0.75rem;font-weight:600">${d.tag}</span>
                  <span style="font-size:0.75rem;color:var(--ink-3)">${count} soru havuzda</span>
                </div>
                <h3 style="font-size:1.05rem;font-weight:700;color:var(--ink);margin-bottom:0.4rem">${d.title}</h3>
                <p style="font-size:0.82rem;color:var(--ink-2);line-height:1.5;margin-bottom:1rem">${d.desc}</p>
              </div>
              <button class="btn btn-s btn-accent" style="width:100%" data-act="start-drill" data-subj="${d.subjectId}">
                Pratiği Başlat (${d.count} Soru)
              </button>
            </div>
          `;
        }).join('')}
      </div>
    </div>
  `;
}

export function registerPratikEvents() {
  const host = document.getElementById('view-pratik');
  if (!host || host.__pratikBound) return;
  host.__pratikBound = true;

  host.addEventListener('click', e => {
    const btn = e.target.closest('[data-act="start-drill"]');
    if (!btn) return;
    const subj = btn.getAttribute('data-subj');
    if (!subj) return;

    const pool = questionsBySubject.get(subj) || [];
    if (!pool.length) {
      alert('Bu alanda henüz soru bulunmuyor.');
      return;
    }

    // Switch to practice view
    if (typeof startPracticeSession === 'function') {
      startPracticeSession({ subjectId: subj, count: 5 });
    }
  });
}

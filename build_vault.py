# -*- coding: utf-8 -*-
"""
build_vault.py — YDS Stüdyo Tek Tıkla Kasa Derleyici
questions.js ve topics.js dosyalarındaki tüm verileri okuyup
telefona ve Google Drive'a yüklenecek 'yds_vault.json' dosyasını üretir.
"""

import os
import json
import re

ROOT = os.path.dirname(os.path.abspath(__file__))


def extract_js_data(filepath, var_name):
    if not os.path.exists(filepath):
        return []
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()

    # Regex ile const VAR_NAME = [...]; veya let VAR_NAME = [...]; eşleştir
    pattern = rf'(?:const|let|var)\s+{var_name}\s*=\s*(\[[\s\S]*?\]);'
    match = re.search(pattern, content)
    if match:
        try:
            return json.loads(match.group(1))
        except Exception:
            # Doğrudan json olmazsa eval / temizleme dene
            pass
    return []


def main():
    print("YDS Kasa paketi derleniyor...")
    topics = extract_js_data(os.path.join(ROOT, 'topics.js'), 'TOPICS_DATA')
    subjects = extract_js_data(os.path.join(ROOT, 'topics.js'), 'SUBJECTS_DATA')
    questions = extract_js_data(os.path.join(ROOT, 'questions.js'), 'QUESTIONS_DATA')
    ai_questions = extract_js_data(os.path.join(ROOT, 'questions_ai.js'), 'QUESTIONS_AI_DATA')

    seen_ids = set()
    merged_q = []
    for q in questions + ai_questions:
        qid = q.get('id')
        if qid and qid not in seen_ids:
            seen_ids.add(qid)
            merged_q.append(q)

    vault = {
        'source': 'yds_master_vault',
        'generatedAt': '2026-10-31T19:25:00Z',
        'subjects': subjects,
        'topics': topics,
        'questions': merged_q
    }

    out_file = os.path.join(ROOT, 'yds_vault.json')
    with open(out_file, 'w', encoding='utf-8') as f:
        json.dump(vault, f, ensure_ascii=False, indent=2)

    print(f"Başarılı: 'yds_vault.json' oluşturuldu.")
    print(f"Özet: {len(subjects)} ders/soru tipi, {len(topics)} konu, {len(merged_q)} soru.")
    print("Bu dosyayı Google Drive'daki 'YDS' klasörüne atarak telefondan anında eşitleyebilirsiniz.")


if __name__ == '__main__':
    main()

/* ==========================================================================
   YDS STÜDYO — KONU ANLATIMLARI VE DERS TAKSONOMİSİ (TOPICS.JS)
   ÖSYM YDS 80 Soru Formatı / Akademik İngilizce Çekirdek Müfredat
   © 2026 Yusuf GÜNAY — Tüm Hakları Saklıdır.
   ========================================================================== */

const SUBJECTS_DATA = [
  {
    "id": "okuma_parcalari",
    "name": "Okuma Parçaları (Reading Comprehension)",
    "tier": 1,
    "questionCount": 20,
    "priority": "🔴 Kritik Tier 1",
    "desc": "Akademik metinler, ana fikir, doğrudan detay, çıkarım ve yazar tutumu (5 metin x 4 soru)"
  },
  {
    "id": "dilbilgisi",
    "name": "Dilbilgisi & Zamanlar (Grammar)",
    "tier": 1,
    "questionCount": 10,
    "priority": "🔴 Kritik Tier 1",
    "desc": "Tenses, Modals, Passive/Causative, Conjunctions & Transitions, Prepositions"
  },
  {
    "id": "cumle_tamamlama",
    "name": "Cümle Tamamlama (Sentence Completion)",
    "tier": 1,
    "questionCount": 10,
    "priority": "🔴 Kritik Tier 1",
    "desc": "Neden-sonuç, zıtlık, koşul, zaman ve bağıl cümlecik tamamlamaları"
  },
  {
    "id": "cloze_test",
    "name": "Cloze Test (Paragraf Boşluk Doldurma)",
    "tier": 1,
    "questionCount": 10,
    "priority": "🔴 Kritik Tier 1",
    "desc": "Bağlam içi kelime, edat, bağlaç ve dilbilgisi boşluk tamamlama (2 metin x 5 soru)"
  },
  {
    "id": "kelime",
    "name": "Kelime Bilgisi (Vocabulary & Phrasal Verbs)",
    "tier": 2,
    "questionCount": 6,
    "priority": "🟠 Yüksek Tier 2",
    "desc": "Akademik isimler, fiiller, sıfatlar, zarflar ve en sık sorulan phrasal verb grupları"
  },
  {
    "id": "ceviri",
    "name": "Çeviri (İngilizce - Türkçe / Türkçe - İngilizce)",
    "tier": 2,
    "questionCount": 6,
    "priority": "🟠 Yüksek Tier 2",
    "desc": "Özne-yüklem analizi, zaman uyumu ve yapısal eşdeğerlik (3 ENG-TR + 3 TR-ENG)"
  },
  {
    "id": "diyalog",
    "name": "Diyalog Tamamlama (Dialogue Completion)",
    "tier": 2,
    "questionCount": 5,
    "priority": "🟠 Yüksek Tier 2",
    "desc": "Karşılıklı konuşmada ton, bağlam, soru-cevap ve ima analizi"
  },
  {
    "id": "akisi_bozan",
    "name": "Anlam Akışını Bozan Cümle (Irrelevant Sentence)",
    "tier": 2,
    "questionCount": 5,
    "priority": "🟠 Yüksek Tier 2",
    "desc": "Paragraftaki konu dışı, fazla genel/öznel veya zaman uyumsuzluğunu tespit etme"
  },
  {
    "id": "paragraf_tamamlama",
    "name": "Paragraf Tamamlama (Paragraph Completion)",
    "tier": 3,
    "questionCount": 4,
    "priority": "🟢 Tier 3",
    "desc": "Giriş, gelişme ve sonuç boşluklarında referans zamirleri ve geçiş bağlaçları takibi"
  },
  {
    "id": "es_anlam",
    "name": "Eş Anlamlı Cümle (Restatement / Paraphrase)",
    "tier": 3,
    "questionCount": 4,
    "priority": "🟢 Tier 3",
    "desc": "Verilen cümlenin anlamını bozmadan farklı yapılar ve sinonimlerle yeniden ifade etme"
  }
];

const TOPICS_DATA = [
  {
    "id": "tpc_kelime_001",
    "subjectId": "kelime",
    "title": "1. Akademik İsimler ve Sıfatlar (High-Yield Nouns & Adjectives)",
    "order": 1,
    "source": "yds_core",
    "legalBasis": [
      "ÖSYM YDS Soru 1-3 Formatı"
    ],
    "chunks": [
      {
        "legalRef": "Akademik Sıfatlar: Anlam ve Kolokasyonlar",
        "text": "YDS kelime sorularında sıfatlar doğrudan niteledikleri isimle (collocation) çözülür. 'Substantial increase' (önemli artış), 'plausible explanation' (akla yatkın açıklama), 'vulnerable to extinction' (yok olmaya karşı savunmasız) gibi kalıplar bağlamın anahtarıdır.",
        "highlights": [
          "Substantial (önemli, hatırı sayılır)",
          "Plausible (makul, mantıklı)",
          "Vulnerable to (-e karşı savunmasız)",
          "Incompatible with (-ile uyumsuz)"
        ],
        "detail": "Sınav tuzağı: 'Compulsory' (zorunlu) ve 'Arbitrary' (keyfi/rastgele) sıfatları bağlamdaki ton işaretlerine göre test edilir. Metinde bir kural veya kanun vurgusu varsa mandatory/compulsory; kişisel tercih varsa arbitrary aranır."
      },
      {
        "legalRef": "Akademik İsimler: Değişim, Etki ve Sonuç Bildirenler",
        "text": "Sınavda en sık sorulan soyut isimler genellikle bilimsel ve toplumsal süreçleri tanımlar: 'Deterioration' (kötüleşme), 'Disparity' (uçurum/farklılık), 'Prevalence' (yaygınlık), 'Compliance' (uyum/itaat).",
        "highlights": [
          "Deterioration (kötüleşme)",
          "Disparity (büyük fark/eşitsizlik)",
          "Prevalence (yaygınlık)",
          "Compliance with (uyum)"
        ],
        "detail": "İsim sorularında boşluktan sonra gelen edat (preposition) cevabı doğrudan verir. Örneğin boşluktan sonra 'between' geliyorsa disparity; 'to' geliyorsa susceptibility/adherence aranır."
      }
    ]
  },
  {
    "id": "tpc_kelime_002",
    "subjectId": "kelime",
    "title": "2. Phrasal Verbs (Deyimsel Fiiller ve Kritik Edat Kombinasyonları)",
    "order": 2,
    "source": "yds_core",
    "legalBasis": [
      "ÖSYM YDS Soru 5-6 Formatı"
    ],
    "chunks": [
      {
        "legalRef": "Akademik Metinlerde En Sık Çıkan 15 Phrasal Verb",
        "text": "YDS'de her sınavda en az 2 phrasal verb sorulur. 'Account for' (1. oluşturmak/oran tutmak, 2. açıklamak), 'Bring about' (neden olmak/ortaya çıkarmak), 'Cope with' (başa çıkmak), 'Stem from' (-den kaynaklanmak), 'Give rise to' (yol açmak), 'Wipe out' (yok etmek).",
        "highlights": [
          "Account for (% oran oluşturmak / açıklamak)",
          "Bring about (yol açmak / produce)",
          "Stem from (-den kaynaklanmak)",
          "Rule out (elemek, ihtimal dışı bırakmak)"
        ],
        "detail": "ÖSYM kuralı: Boşluğun arkasından bir yüzde veya oran geliyorsa (%30 of the total workforce) cevap istisnasız 'account for' veya 'make up' olur."
      }
    ]
  },
  {
    "id": "tpc_dilbilgisi_001",
    "subjectId": "dilbilgisi",
    "title": "1. Zaman Uyumu ve Kısaltmalar (Tense Harmony & Reductions)",
    "order": 1,
    "source": "yds_core",
    "legalBasis": [
      "ÖSYM YDS Soru 7-9 Formatı"
    ],
    "chunks": [
      {
        "legalRef": "Zaman Çizelgesi ve Tense Harmony İlkeleri",
        "text": "Zaman bağlaçlarının (when, after, before, as soon as, while) bulunduğu cümlelerde ana cümle ile yan cümle arasında zaman uyumu zorunludur: Present ile Present/Future; Past ile Past eşleşir. Present ile Past Perfect (had V3) ASLA birbirine bağlanamaz.",
        "highlights": [
          "Present ↔ Present/Future",
          "Past ↔ Past/Past Perfect",
          "Since + Past Simple, Present Perfect (have/has V3)",
          "By the time + V1, Future Perfect (will have V3)"
        ],
        "detail": "ÖSYM altın kuralı: 'Since' bağlacı zaman anlamındaysa kendisinden sonra kesinlikle Past Simple (V2), ana cümlede ise Present Perfect (have/has V3 veya have/has been Ving) ister."
      },
      {
        "legalRef": "Kısaltmalar (Participle Reductions: Ving vs Having V3 vs V3)",
        "text": "Özne ortak olan iki cümle bağlaçsız bağlandığında aktif eylemler 'Ving' ile, pasif eylemler 'V3' ile, ana eylemden daha önce gerçekleştiği vurgulanan aktif eylemler ise 'Having V3' ile kısaltılır.",
        "highlights": [
          "Aktif: Ving (Doing)",
          "Pasif: V3 (Done)",
          "Önceki eylem aktif: Having V3 (Having done)",
          "Önceki eylem pasif: Having been V3"
        ],
        "detail": "Boşluktan hemen sonra bir nesne (noun object) geliyorsa kısaltma aktiftir (Ving); boşluktan sonra edat (preposition) veya 'by' geliyorsa pasiftir (V3)."
      }
    ]
  },
  {
    "id": "tpc_dilbilgisi_002",
    "subjectId": "dilbilgisi",
    "title": "2. Bağlaçlar ve Geçiş Zarfları (Conjunctions, Transitions & Prepositions)",
    "order": 2,
    "source": "yds_core",
    "legalBasis": [
      "ÖSYM YDS Soru 10-16 Formatı"
    ],
    "chunks": [
      {
        "legalRef": "Zıtlık Bağlaçları: Tam Cümle Alanlar vs İsim/Öbek Alanlar",
        "text": "Zıtlık grubu ikiye ayrılır: 1) Tam Cümle Alanlar: Although, Even though, Though, While, Whereas. 2) İsim/Ving Alanlar: Despite, In spite of, Notwithstanding. Bu iki grubun şıklarda elenmesi tamamen boşluğun devamındaki yapıya bakar.",
        "highlights": [
          "Tam Cümle: Although + S + V + O",
          "İsim/Öbek: Despite + Noun / Ving",
          "Geçiş Zarfı: However, Nonetheless, Nevertheless (noktalı virgül veya iki virgül arası)",
          "Zıt Karşılaştırma: Whereas / While (X is A, whereas Y is B)"
        ],
        "detail": "Tuzağa düşme: 'Despite the fact that' yapısı 'the fact that' içerdiği için tam cümle alır. Sadece 'despite' ise isim/isim tamlaması alır."
      },
      {
        "legalRef": "Neden - Sonuç ve Koşul Bağlaçları",
        "text": "Neden bildirenler: Because, Since, As, Given that, Seeing that (tam cümle); Due to, Owing to, Because of, On account of (isim/öbek). Koşul bildirenler: Provided that, As long as, Unless (if not), In case (önlem bildirir).",
        "highlights": [
          "Unless = If not (içinde 'not' kullanılmaz)",
          "In case = -olur diye / ihtimaline karşı (önlem eylemi içerir)",
          "Due to = -den dolayı (isim alır)",
          "Given that = -göz önüne alındığında"
        ],
        "detail": "In case tuzağı: Ana cümlede her zaman tedbir/hazırlık eylemi aranır ('take an umbrella in case it rains'). 'If' ile karıştırmayın; 'in case' başa geldiğinde yağmur yağmasa bile şemsiye alınmıştır."
      }
    ]
  },
  {
    "id": "tpc_cloze_001",
    "subjectId": "cloze_test",
    "title": "1. Paragraf Boşluk Doldurma Teknikleri (Cloze Test Mastery)",
    "order": 1,
    "source": "yds_core",
    "legalBasis": [
      "ÖSYM YDS Soru 17-26 Formatı"
    ],
    "chunks": [
      {
        "legalRef": "Metin Bütünlüğü ve Boşluk Önü-Arası Sentezi",
        "text": "Cloze test sadece bir gramer testi değil, bağlam testidir. İlk boşluğu çözmeden önce metnin ilk 2-3 cümlesi mutlaka okunmalı ve metnin ana konusu (bilimsel gelişme mi, tarihsel olay mı, güncel çevre krizi mi) saptanmalıdır.",
        "highlights": [
          "Metnin zaman eksenini belirle (tarih var mı yoksa genel geçer present mı?)",
          "Boşluğun önündeki ve arkasındaki noktalama işaretlerine dikkat et",
          "Referans zamirlerinin işaret ettiği ismi bul",
          "5 soru birbiriyle tutarlı olmalıdır"
        ],
        "detail": "Tipik tuzak: Cloze testte yer alan bir sorunun ipucu iki cümle sonraki bağlaçta veya kelimede açıkça verilir. Soruları metinden koparıp tek cümle gibi okumayın."
      }
    ]
  },
  {
    "id": "tpc_cumle_001",
    "subjectId": "cumle_tamamlama",
    "title": "1. Yan Cümle - Ana Cümle Bağı ve Referans Takibi",
    "order": 1,
    "source": "yds_core",
    "legalBasis": [
      "ÖSYM YDS Soru 27-36 Formatı"
    ],
    "chunks": [
      {
        "legalRef": "Özne ve Zamir Uyumu (Pronoun-Antecedent Match)",
        "text": "Cümle tamamlama sorularında verilen yarıda 'they', 'this', 'such diseases', 'these findings' gibi işaret zamirleri varsa; aranacak öbür yarıda o zamirin gönderme yaptığı çoğul/tekil isim tamlaması bulunmalıdır.",
        "highlights": [
          "Zamir takibi (they -> plural subject)",
          "Zaman uyumu (Past yan cümle -> Past ana cümle)",
          "Zıtlık dengesi (+ / - kutup geçişi)",
          "Bağlaç mantığı (Although X is positive, Y is negative)"
        ],
        "detail": "Tuzak şıklar: Gramer olarak kusursuz görünen ama anlamca verilen yarıyı tekrarlayan (totoloji) veya zamir karşılığı bulunmayan şıklar çeldiricidir."
      }
    ]
  },
  {
    "id": "tpc_ceviri_001",
    "subjectId": "ceviri",
    "title": "1. Çeviri Sorularında Matematiksel Çözüm: Özne ve Yüklem Elemesi",
    "order": 1,
    "source": "yds_core",
    "legalBasis": [
      "ÖSYM YDS Soru 37-42 Formatı"
    ],
    "chunks": [
      {
        "legalRef": "Adım Adım Çeviri Algoritması (30 Saniyede Çözüm)",
        "text": "Çeviri soruları tercüme edilmez; formül gibi çözülür. 1) Orijinal cümlenin ANA ÖZNESİNİ bul. 2) Cümlenin ANA YÜKLEMİNİ (esas fiilini ve zamanını) bul. 3) Türkçe cümlede yüklem en sondadır; şıklarda yüklemi uymayan 3 seçeneği 5 saniyede ele. 4) Kalan iki şıkkı özne ve sıfat tamlaması açısından karşılaştır.",
        "highlights": [
          "1. Ana Yüklemi tespit et (Main Verb & Tense)",
          "2. Ana Özneyi tespit et (Main Subject)",
          "3. Yüklemi tutmayan şıkları doğrudan ele",
          "4. Sıfat ve zarf tamlamalarını eşleştir"
        ],
        "detail": "En yaygın çeldirici: Aktif fiili pasif yapmak (is considered -> düşünmektedir YANLIŞ, düşünülmektedir DOĞRU) veya modal değiştirmek (can lead to -> yol açacaktır YANLIŞ, yol açabilir DOĞRU)."
      }
    ]
  },
  {
    "id": "tpc_okuma_001",
    "subjectId": "okuma_parcalari",
    "title": "1. Akademik Paragraf Analizi ve Soru Tipleri",
    "order": 1,
    "source": "yds_core",
    "legalBasis": [
      "ÖSYM YDS Soru 43-62 Formatı"
    ],
    "chunks": [
      {
        "legalRef": "5 Soru Kalıbının Şifresi",
        "text": "Okuma parçalarında 4 soru genellikle şu kalıplarla gelir: 1) Doğrudan bilgi ('According to the passage, ...'): Metindeki ifadenin eş anlamlısı aranır. 2) Çıkarım ('It is inferred / understood from the passage that...'): Doğrudan yazmaz, mantıksal sonuçtur. 3) Ana Fikir ('The main purpose / title of the passage is...'): Giriş ve sonuç sentezi. 4) Yazar Tutumu ('The author's attitude towards X is...'): Tarafsız (objective), eleştirel (critical), takdir edici (appreciative).",
        "highlights": [
          "Extreme words (always, never, solely, only) çoğunlukla yanlıştır",
          "Paraphrase edilmiş seçenek doğrudur",
          "Kişisel yorum yasaktır; metne sadık kal",
          "Metnin ilk ve son cümlesi ana fikri verir"
        ],
        "detail": "Kural: Soru kökünü okumadan paragrafa başlama. Önce soru köklerindeki anahtar kelimeleri (isim, tarih, yer) zihnine kazı, sonra metni tarayarak oku."
      }
    ]
  },
  {
    "id": "tpc_diyalog_001",
    "subjectId": "diyalog",
    "title": "1. Diyalog Tamamlama ve İletişimsel Bağlam",
    "order": 1,
    "source": "yds_core",
    "legalBasis": [
      "ÖSYM YDS Soru 63-67 Formatı"
    ],
    "chunks": [
      {
        "legalRef": "Diyalogda Öncesi ve Sonrası (Blank Bridge)",
        "text": "Diyalog sorularında cevabı belirleyen en kritik yer, boşluktan HEMEN SONRA konuşan kişinin verdiği tepkidir. Örneğin son konuşan kişi 'I totally disagree with you' diyorsa, boşluktaki cümle iddialı bir sav içermek zorundadır.",
        "highlights": [
          "Boşluktan sonraki cümleye odaklan",
          "Karşılıklı hitap ve saygı düzeyini (register) koru",
          "Konu sapmalarına düşme",
          "Soru kökünün duygu durumunu yakala"
        ],
        "detail": "Tuzak: Boşluktan önceki cümleye harika bir yanıt olan ama boşluktan sonraki cümlenin anlamsız kalmasına yol açan şıklar tipik çeldiricidir."
      }
    ]
  },
  {
    "id": "tpc_akisi_bozan_001",
    "subjectId": "akisi_bozan",
    "title": "1. Anlam Akışını Bozan Cümleyi Ayıklama Teknikleri",
    "order": 1,
    "source": "yds_core",
    "legalBasis": [
      "ÖSYM YDS Soru 76-80 Formatı"
    ],
    "chunks": [
      {
        "legalRef": "Akış Bozan Cümlenin 3 Temel Kusuru",
        "text": "Akışı bozan cümle genellikle 3 yoldan biriyle kendini ele verir: 1) Kapsam Kayması: Metin 'çocuklarda obezite'yi anlatırken bir cümlenin 'yetişkinlerde kalp sağlığı'na geçmesi. 2) Ton Kayması: Tarafsız ve bilimsel giden bir metne aşırı öznel bir fikir girmesi. 3) Referans Kopukluğu: Kendisinden sonraki cümlenin zamir bağı ('this method') bozan cümle çıktığında bir önceki cümleye kusursuz bağlanması.",
        "highlights": [
          "Bozan cümleyi parmağınla kapat, metni (önceki + sonraki) peş peşe oku",
          "Akış pürüzsüz akıyorsa doğru adrestesin",
          "Özne veya zaman kaymalarını yakala",
          "Genelden özele / özelden genele ani sıçramalar"
        ],
        "detail": "İpucu: Genellikle III. veya IV. cümle akışı bozar (istatistiksel ağırlık), ancak her cümleyi referans zinciri açısından test etmek şarttır."
      }
    ]
  }
];

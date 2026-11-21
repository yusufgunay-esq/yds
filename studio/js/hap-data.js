/* ==========================================================================
   hap-data.js : YDS Sınav Öncesi Kritik Bilgi ve Strateji Kartları
   ÖSYM YDS Sınavlarında En Çok Sınanan Kurallar ve Çeldirici Tuzaklar
   © 2026 Yusuf GÜNAY — Tüm Hakları Saklıdır.
   ========================================================================== */

export const HAP = [
  {
    id: 'yds-since', d: 'dilbilgisi', k: 'Since ve Zaman Uyumu Kuralı', f: 'Her sınavda en az 1 soru',
    m: [
      'Since bağlacı zaman anlamındaysa kural kesindir: **Since + Past Simple (V2)**, ana cümlede **Present Perfect (have/has V3)**.',
      'Örnek: "Ever since the treaty was signed in 1994, international relations have improved."',
      'Tense uyumu: Present ile Past Perfect (had V3) ASLA aynı cümlede bağlanamaz.'
    ],
    t: 'Şıklarda "Since + Present Perfect" veya ana cümlede "will V1" görürseniz hemen eleyin. Since geçmişe sabitler, ana cümle günümüze uzanır.'
  },
  {
    id: 'yds-by-the-time', d: 'dilbilgisi', k: 'By the Time & By + Gelecek Zaman', f: 'Sık sorulan soru tipi',
    m: [
      '**By the time + V1/Present**, ana cümle: **will have V3 (Future Perfect)**.',
      '**By the time + V2/Past**, ana cümle: **had V3 (Past Perfect)**.',
      '**By + Gelecek Tarih** (By 2035, by the end of this century) = **will have V3**.'
    ],
    t: 'By the time cümlesinde ana eylem daha önce tamamlanmış olmalıdır; bu yüzden ana cümlede mutlaka "have/had + V3" aranır.'
  },
  {
    id: 'yds-despite-although', d: 'dilbilgisi', k: 'Zıtlık: Although (Cümle) vs Despite (İsim)', f: 'Her sınavda en az 2 soru',
    m: [
      '**Although, Even though, Though, While, Whereas** arkasından **Tam Cümle (Özne + Yüklem)** alır.',
      '**Despite, In spite of, Notwithstanding** arkasından **İsim / İsim Tamlaması / Ving** alır.',
      '**However, Nevertheless, Nonetheless** geçiş zarfıdır; noktalı virgül (;) veya iki virgül arasında kullanılır.'
    ],
    t: 'Boşluktan sonra "the fact that" geliyorsa yapı artık tam cümle alabilir; dolayısıyla "despite the fact that" tam cümle ile devam eder.'
  },
  {
    id: 'yds-in-case', d: 'dilbilgisi', k: 'In Case vs If Ayrımı', f: 'Klasik çeldirici kalıp',
    m: [
      '**In case** = "-olur diye, ihtimaline karşı" demektir ve bir **önlem/tedbir** eylemi bildirir.',
      'Örnek: "Scientists keep backup samples in case the original cultures are contaminated."',
      '**If** ise bir şarta bağlı eylemdir; olay gerçekleşirse eylem yapılır.'
    ],
    t: 'Ana cümlede bir önlem, sigorta, yedekleme veya hazırlık fiili varsa cevap kesinlikle "in case"tir.'
  },
  {
    id: 'yds-kisaltmalar', d: 'dilbilgisi', k: 'Kısaltmalar (Participle Reductions)', f: 'İleri düzey gramer',
    m: [
      'Boşluktan sonra doğrudan nesne (noun) geliyorsa aktif kısaltmadır: **Ving (Writing...)**.',
      'Boşluktan sonra edat (preposition: in, by, with) geliyorsa pasif kısaltmadır: **V3 (Written by...)**.',
      'Eylem ana eylemden daha önce olmuşsa: **Having V3 (Having completed the project, he resigned)**.'
    ],
    t: 'Öznesi ortak olmayan kısaltma kurulamaz (dangling modifier). Kısaltmanın öznesi virgülden sonra gelen ana cümlenin öznesi olmak zorundadır.'
  },
  {
    id: 'yds-phrasals', d: 'kelime', k: 'En Kritik 5 Phrasal Verb', f: 'Her sınavda garanti',
    m: [
      '**Account for**: 1. Açıklamak (explain), 2. Bir oranı/yüzdeyi oluşturmak (make up).',
      '**Bring about**: Neden olmak, yol açmak (lead to, cause).',
      '**Cope with / Deal with**: Başa çıkmak, üstesinden gelmek (overcome).',
      '**Stem from**: -den kaynaklanmak (arise from, originate from).',
      '**Rule out**: İhtimal dışı bırakmak, elemek (exclude).'
    ],
    t: 'Boşluk arkasından rakam veya yüzde (%30) geliyorsa "account for"; soyut bir sorun veya kriz geliyorsa "cope with" veya "stem from" test ediliyordur.'
  },
  {
    id: 'yds-ceviri-kurali', d: 'ceviri', k: 'Çeviri Sorularında 4 Adımlı Algoritma', f: '6 soru · tam puan hedefi',
    m: [
      '1. **Ana Yüklemi Bul**: Türkçe cümlenin sonundaki fiili ve zamanını (Present, Past, Passive, Modal) belirle.',
      '2. **Yüklemi Tutmayanları Ele**: Genellikle 5 şıktan 3\'ü sadece yüklem zamanı veya etken/edilgen uyumsuzluğundan 10 saniyede elenir.',
      '3. **Ana Özneyi Bul**: Cümlenin gerçek öznesini İngilizce karşılığıyla eşleştir.',
      '4. **Sıfat/Zarf Vurgusunu Kontrol Et**: Kalan iki şık arasındaki fark tek bir niteleme sıfatıdır.'
    ],
    t: 'Tercüme yapmaya çalışıp tüm cümleyi okumayın; yüklem ve özne filtrelemesiyle matematiksel çözün.'
  },
  {
    id: 'yds-reading-extreme', d: 'okuma_parcalari', k: 'Paragraf Sorularında "Extreme Words" Tuzağı', f: '20 soru · belirleyici blok',
    m: [
      'Şıklarda yer alan **solely, exclusively, always, never, undeniably, universally** gibi aşırı genelleme ifadeleri %90 oranında yanlıştır.',
      'ÖSYM akademik metinlerde temkinli (hedging) bir dil sever: **may, might, could, often, likely, tend to, largely** içeren seçenekler genellikle doğrudur.',
      'Paraphrase (eş anlamlısıyla yeniden ifade edilmiş) seçenek doğru cevaptır; metindeki aynı kelimeleri birebir kullanan şık genellikle tuzaktır.'
    ],
    t: 'Metinde geçen bir cümlenin kelimelerini aynen kopyalayan şık sizi çekmesin; metnin anlamını farklı kelimelerle koruyan şıkkı arayın.'
  }
];

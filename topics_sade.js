/* topics_sade.js - Hızlı okuma ve özet görünümü (20 YDS konusu) */
const TOPICS_SADE = [
  {
    "id": "tpc_kelime_001",
    "title": "1. Akademik İsimler, Sıfatlar ve Zarflar (High-Yield Vocabulary)",
    "subjectId": "kelime",
    "bullets": [
      "YDS kelime sorularında kelimeler tek başına değil, niteledikleri isimle birlikte çözülür. 'Substantial increase' (ciddi artış), 'plausible explanation' (akla...",
      "Sınav Tuzağı: Çeldirici şıklar genellikle hedef kelimenin zıt kutuptaki karşılığı veya benzer sesli kelimelerdir (ör. eligible vs illegible).",
      "Sınav Tuzağı: Bağlamdaki 'scarcely, barely, hardly' gibi yarı-olumsuz zarflar cümlenin anlamını olumsuza çevirir."
    ]
  },
  {
    "id": "tpc_kelime_002",
    "title": "2. Phrasal Verbs ve Kritik Edat Kombinasyonları (Prepositional Verbs)",
    "subjectId": "kelime",
    "bullets": [
      "'About' veya 'to' ile biten phrasal fiiller çoğunlukla bir sonuca veya sebep-sonuç ilişkisine yönelir (lead to, result in, bring about).",
      "Sınav Tuzağı: 'Call off' (iptal etmek) ile 'put off' (ertelemek) sürekli birbirinin çeldiricisi olarak verilir.",
      "Sınav Tuzağı: 'Rely on / depend on' haricinde 'rest on / hinge upon' yapılarının da -e dayanmak anlamına geldiğini unutmayın."
    ]
  },
  {
    "id": "tpc_dilbilgisi_001",
    "title": "1. Zaman Uyumu, Modals ve Kısaltmalar (Tense Harmony & Reductions)",
    "subjectId": "dilbilgisi",
    "bullets": [
      "Present Perfect (have/has V3) asla kesin geçmiş zaman zarflarıyla (in 1990, two days ago) kullanılmaz. Bu zarflar yalnızca Past Simple (V2) ister.",
      "Sınav Tuzağı: 'Since' bağlacı cümle başında veya ortasında 'den beri' anlamındaysa yanına V2, ana cümleye 'have/has V3' alır.",
      "Sınav Tuzağı: 'It is said that' gibi yapılardan sonra mastar kısaltması gelirse zaman farkında 'to have V3' aranır."
    ]
  },
  {
    "id": "tpc_dilbilgisi_002",
    "title": "2. Bağlaçlar, Geçiş Zarfları ve Edatlar (Conjunctions & Prepositions)",
    "subjectId": "dilbilgisi",
    "bullets": [
      "YDS'de bağlaç soruları polarite (artı-eksi) yöntemiyle çözülür. Yan cümle olumsuz, ana cümle olumlu ise zıtlık bağlacı (Although, In contrast) aranır.",
      "Sınav Tuzağı: 'Although' ile 'However' farkı: Although iki cümleyi tek noktada bağlar, However geçiş zarfıdır, noktalı virgül veya iki nokta arasında gelir.",
      "Sınav Tuzağı: 'Unless' zaten olumsuzluk içerir; kendi yan cümlesinde 'not' almaz (Unless it rains)."
    ]
  },
  {
    "id": "tpc_cloze_001",
    "title": "1. Cloze Testte Yapısal ve Gramer Analizi (Structural Mastery)",
    "subjectId": "cloze_test",
    "bullets": [
      "Cloze test sorularında 5 boşluğun en az 2'si bağlaç ve edat, 2'si zaman/kısaltma, 1'i ise kelime bilgisini ölçer.",
      "Sınav Tuzağı: Cloze testte bir önceki cümlenin zamanı ile boşluğun bulunduğu cümlenin zamanı zıtlık yoksa uyumlu olmalıdır.",
      "Sınav Tuzağı: Boşluktan hemen sonra gelen edat (preposition) doğru şıkkı saniyeler içinde verir."
    ]
  },
  {
    "id": "tpc_cloze_002",
    "title": "2. Cloze Testte Edat ve Sözcük Kombinasyonları (Lexical Flow)",
    "subjectId": "cloze_test",
    "bullets": [
      "Cloze testte kelime sorulduğunda, boşluktan sonraki edat seçeneklerdeki 4 kelimeyi anında eler.",
      "Sınav Tuzağı: 'Responsible' sıfatı 'for' alırken, 'response' ismi 'to' alır; kök benzerliği yanıltmamalıdır.",
      "Sınav Tuzağı: 'Susceptible' ve 'prone' sıfatları 'to' edatıyla -e yatkın/savunmasız anlamına gelir."
    ]
  },
  {
    "id": "tpc_cumle_001",
    "title": "1. Yan Cümle - Ana Cümle Bağı ve Referans Takibi",
    "subjectId": "cumle_tamamlama",
    "bullets": [
      "Cümle tamamlamanın yüzde ellisi doğru özne takibidir. Şıklar arasındaki özne farklılıkları en hızlı eleme aracıdır.",
      "Sınav Tuzağı: Kökteki tekil özne (a species), tamamlanan cümlede 'they' yerine 'it' olarak anılmalıdır.",
      "Sınav Tuzağı: 'So... that' kalıbında 'that'ten sonra tam cümle gelmesi zorunludur; eksik ögeli şıkları doğrudan eleyin."
    ]
  },
  {
    "id": "tpc_cumle_002",
    "title": "2. Zıtlık ve Neden-Sonuç İlişkilerinde Mantıksal Eleme",
    "subjectId": "cumle_tamamlama",
    "bullets": [
      "Cümle tamamlama sorularında her cümleye artı (+) veya eksi (-) işareti koymak çözümü hızlandırır.",
      "Sınav Tuzağı: 'Because' ile başlayan cümle köküne sonuç aranırken, sonuç cümlesinde 'therefore' gibi mükerrer bağlaç olamaz.",
      "Sınav Tuzağı: 'In contrast to' ile başlayan bir yapıda karşılaştırılan iki ögenin aynı türden olması şarttır (insan ile insan, kurum ile kurum)."
    ]
  },
  {
    "id": "tpc_ceviri_001",
    "title": "1. İngilizce - Türkçe Çeviride Özne ve Temel Yüklem Kilidi",
    "subjectId": "ceviri",
    "bullets": [
      "YDS çeviri soruları anlamsal değil, biçimsel ve yapısal matematik sorularıdır. Çevirinin tamamını okumak zaman kaybıdır.",
      "Sınav Tuzağı: 'Not only... but also' kalıbı Türkçeye 'yalnızca... değil, aynı zamanda...' olarak çevrilmelidir; 'veya' içeren şıkları eleyin.",
      "Sınav Tuzağı: Yüklemdeki modal'lar (may lead to -> yol açabilir) ile kesin yargı bildiren yüklemleri (leads to -> yol açar) birbirine karıştırmayın."
    ]
  },
  {
    "id": "tpc_ceviri_002",
    "title": "2. Türkçe - İngilizce Çeviride Yan Cümlecik ve Zaman Ayıklaması",
    "subjectId": "ceviri",
    "bullets": [
      "Türkçe cümlenin en sonundaki kelime ana yüklemdir. Bu yüklemin öznesi ise 'yapan kim/ne' sorusuyla bulunur.",
      "Sınav Tuzağı: Türkçedeki 'en önemli faktörlerden biridir' ifadesi İngilizcede 'is one of the most important factors' olmalıdır; 'one of' eksikse eleyin.",
      "Sınav Tuzağı: Zaman zarfı olan '-dığında' (When) ile şart olan '-sa' (If) çevirilerini birbirine karıştırmayın."
    ]
  },
  {
    "id": "tpc_okuma_001",
    "title": "1. Paragrafta Ana Fikir ve Doğrudan Detay Soruları (Scanning & Skimming)",
    "subjectId": "okuma_parcalari",
    "bullets": [
      "YDS okuma parçalarında 4 soru genellikle şu sırayla gelir: 1 doğrudan detay, 1 neden-sonuç detayı, 1 çıkarım (inference), 1 ana fikir veya başlık.",
      "Sınav Tuzağı: 'All, every, solely, only' gibi mutlaklık bildiren şıklar metinde açıkça kanıtlanmadıkça yanlıştır.",
      "Sınav Tuzağı: Metin doğru bir bilgi içerse bile, soru kökü 'paragraftan çıkarılabilir' diyorsa doğrudan yazılı olmayan mantıksal çıkarım aranır."
    ]
  },
  {
    "id": "tpc_okuma_002",
    "title": "2. Çıkarım, Yazar Tutumu ve Olumsuz Soru Kökleri (Inference & Tone)",
    "subjectId": "okuma_parcalari",
    "bullets": [
      "'It can be inferred from the passage that...' sorularında cevap metinde kelimesi kelimesine yazmaz; metindeki iki cümlenin birleşiminden doğan mantıksal sonu...",
      "Sınav Tuzağı: 'Which of the following is NOT true?' sorularında şıkların metindeki yerleri sırayla taranmalı ve bulunanlar hemen elenmelidir.",
      "Sınav Tuzağı: Yazarın tonu sorularında 'indifferent' (ilgisiz) hiçbir zaman doğru cevap olamaz; yazar metni yazacak kadar konuya ilgilidir."
    ]
  },
  {
    "id": "tpc_diyalog_001",
    "title": "1. Boşluktan Hemen Önceki ve Sonraki Cümlenin Tepki Analizi",
    "subjectId": "diyalog",
    "bullets": [
      "Diyalog sorularında kilit nokta 'Referans Takibi' ve 'Tepki Uyumu'dur. Karşı taraf şaşırmışsa boşlukta şaşırtıcı bir bilgi olmalıdır.",
      "Sınav Tuzağı: Diyalogda boşluğa gelen ifade iki tarafın da uzmanlık alanıyla ve konuşmanın resmiyet düzeyiyle uyumlu olmalıdır.",
      "Sınav Tuzağı: Sorulan soruya doğrudan değil de kaçamak cevap veren yanıtlara dikkat edin (That depends on...)."
    ]
  },
  {
    "id": "tpc_diyalog_002",
    "title": "2. Örtük Anlam, Kibarlık ve Durumsal İkna Stratejileri",
    "subjectId": "diyalog",
    "bullets": [
      "YDS diyaloglarında İngiliz dilinin nezaket yapıları (Would you mind, Could it be that, I was wondering) kritik rol oynar.",
      "Sınav Tuzağı: Diyalogdaki taraflardan biri hasta-doktor veya öğrenci-hoca ise mesleki hiyerarşi ve kibarlık korunur.",
      "Sınav Tuzağı: 'I suppose so' (Öyle sanırım) ile 'Definitely' (Kesinlikle) arasındaki kesinlik farkı diyalogun seyrini belirler."
    ]
  },
  {
    "id": "tpc_es_anlam_001",
    "title": "1. Restatement: Çekirdek Anlam, Derecelendirme ve Kapsam Koruması",
    "subjectId": "es_anlam",
    "bullets": [
      "Restatement sorularında en önemli kural: Ne bir eksik, ne bir fazla! Cümleye orijinalde olmayan yeni bir bilgi veya yorum katılamaz.",
      "Sınav Tuzağı: Derecelendirme zarfları (more than, the most, slightly) şıklarda birebir korunmalıdır.",
      "Sınav Tuzağı: Zıtlık bağlacı içeren cümlenin eşanlamlısı da mutlaka bir zıtlık veya ödünleşme (concession) içermelidir."
    ]
  },
  {
    "id": "tpc_es_anlam_002",
    "title": "2. Modals, Şart Cümleleri ve Zıtlık Kalıplarının Yeniden İfadesi",
    "subjectId": "es_anlam",
    "bullets": [
      "Bir cümlenin eşanlamlısı kurulurken zıtlık yapısı korunarak cümle etken-edilgen çatısıyla tersyüz edilebilir.",
      "Sınav Tuzağı: 'Can't have V3' (yapmış olamaz - kesin geçmiş çıkarım) ifadesi 'mustn't' ile değiştirilemez.",
      "Sınav Tuzağı: Koşul cümlelerinin (Type 2 ve Type 3) eşanlamlısı 'Without / But for' kalıplarıyla kurulabilir."
    ]
  },
  {
    "id": "tpc_paragraf_001",
    "title": "1. Paragraf Tamamlama: Zamir, Belirteç ve Kronolojik İpuçları",
    "subjectId": "paragraf_tamamlama",
    "bullets": [
      "Paragraf tamamlama sorularında boşluk bir yapboz parçasıdır. Kenarındaki tırnaklar önceki ve sonraki cümlenin dilbilgisel ve anlamsal uzantılarıdır.",
      "Sınav Tuzağı: Paragrafta kronolojik bir akış (tarihsel süreç) varsa, zaman sırasını bozan şıkları doğrudan eleyin.",
      "Sınav Tuzağı: Boşluktan sonraki cümlede geçen 'these, those, such' işaret zamirlerinin referansı boşluğa gelecek cümlede olmak zorundadır."
    ]
  },
  {
    "id": "tpc_paragraf_002",
    "title": "2. Giriş ve Sonuç Cümlesi Boşluklarında Kapsam Testi",
    "subjectId": "paragraf_tamamlama",
    "bullets": [
      "Paragrafın ilk cümlesi konunun sınırını çizer (Topic sentence). Son cümlesi ise genellikle bir özet veya geleceğe yönelik projeksiyondur.",
      "Sınav Tuzağı: Sonuç cümlesi boşsa, yeni bir alt konuya veya tartışmaya giren değil, paragrafın genel fikrini toparlayan cümle seçilmelidir.",
      "Sınav Tuzağı: Paragrafın tonu bilimsel ve mesafeli ise günlük konuşma dili içeren şıklar elenir."
    ]
  },
  {
    "id": "tpc_akisi_bozan_001",
    "title": "1. Akışı Bozan Cümle: Konudan ve Zamandan Sapma Tespiti",
    "subjectId": "akisi_bozan",
    "bullets": [
      "Paragraf tek bir konuyu savunur. Konuyla uzaktan ilgili dahi olsa, ana fikre doğrudan hizmet etmeyen veya aşırı detaya inen cümle akışı bozar.",
      "Sınav Tuzağı: Metin olumlu bir gelişmeyi anlatırken araya giren tek bir olumsuz eleştiri cümlesi (zıtlık bağlacı yoksa) akışı bozar.",
      "Sınav Tuzağı: İlk cümle (I numara) akışı bozabilir; sonraki 4 cümle bambaşka bir konudan bahsediyorsa ilk cümleyi işaretlemekten korkmayın."
    ]
  },
  {
    "id": "tpc_akisi_bozan_002",
    "title": "2. Yanıltıcı Anahtar Kelime Tuzakları ve Kapsam Aşımı",
    "subjectId": "akisi_bozan",
    "bullets": [
      "Soru yazarları akışı bozan cümleyi yazarken metinden cımbızla 3-4 kelimeyi o cümlenin içine serpiştirirler. Amaç zayıf adayları 'bu da konudan bahsediyor' di...",
      "Sınav Tuzağı: Bir cümlenin doğru olduğuna emin olmak için o cümleyi çıkardığınızda önceki ve sonraki cümlenin anlamsal boşluk hissettirip hissettirmediğine bakın.",
      "Sınav Tuzağı: 'For example' ile başlayan bir cümle akışı bozamaz gibi düşünülür; oysa önceki cümlenin değil bambaşka bir şeyin örneğiyse akışı bozar."
    ]
  }
];
if (typeof window !== 'undefined') window.TOPICS_SADE = TOPICS_SADE;

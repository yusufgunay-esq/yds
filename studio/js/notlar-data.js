/* ==========================================================================
   notlar-data.js : Konu ve Bölüm Bazlı YDS Notları & Stratejileri
   80 Soru · 180 Dakika · ÖSYM YDS Formatı
   © 2026 Yusuf GÜNAY — Tüm Hakları Saklıdır.
   ========================================================================== */

export const SINAV = { soru: 80, dakika: 180, saniye: 135 };

export const DERSLER = [
  {
    id: 'kelime', ad: 'Kelime Bilgisi & Phrasals', aralik: [1, 6], soru: 6, ters: 1,
    ozet: 'İsim, sıfat, zarf, fiil ve 2 phrasal verb. Bağlam ve edat uyumu çözdürür.',
    cikan: [
      ['Akademik Sıfatlar (Substantial, Plausible, Vulnerable)', 2, 4],
      ['Soyut İsimler (Deterioration, Disparity, Compliance)', 2, 4],
      ['Deyimsel Fiiller (Account for, Cope with, Bring about)', 2, 4],
    ],
    tuzak: [
      'Boşluktan sonraki edatı (preposition) kontrol etmeden işaretleme.',
      'Yüzde veya sayısal oran varsa cevap %90 "account for" veya "make up"tır.',
      { y: 'Arbitrary (zorunlu anlamında)', d: 'Arbitrary keyfi demektir; zorunlu olan compulsory veya mandatory\'dir.' },
    ],
    ezber: [
      ['Account for', 'Oran oluşturmak / hesap vermek'],
      ['Bring about', 'Yol açmak, sebep olmak (lead to)'],
      ['Cope with', 'Başa çıkmak (overcome, deal with)'],
      ['Stem from', '-den kaynaklanmak (originate from)'],
      ['Rule out', 'Elemek, saf dışı bırakmak (eliminate)'],
    ],
    yok: 'Günlük konuşma dili veya argo deyimler sorulmaz; akademik metin dili esastır.',
    sinavda: 'İlk 6 soruda 8 dakikayı geçme. Bilmediğin kelimeye takılıp kalma; cümlenin pozitif/negatif kutup işaretine bak.'
  },
  {
    id: 'dilbilgisi', ad: 'Dilbilgisi & Zamanlar', aralik: [7, 16], soru: 10, ters: 2,
    ozet: 'Tense uyumu, kısaltmalar, edatlar ve bağlaçlar. Formül kuralı uygulanır.',
    cikan: [
      ['Zaman uyumu (Since, By the time, As soon as)', 3, 4],
      ['Zıtlık bağlaçları (Although vs Despite, However)', 3, 4],
      ['Neden-sonuç ve koşul (Because, Provided that, In case)', 2, 4],
      ['Edatlar ve kolokasyonlar', 2, 4],
    ],
    tuzak: [
      'Present ile Past Perfect (had V3) ASLA birbirine bağlanamaz.',
      'Despite tam cümle ALMAZ; tam cümle geliyorsa Although veya Even though aranır.',
      { y: 'In case yağmur yağarsa şemsiye al anlamındadır.', d: 'In case yağmur yağar diye (önlem olarak) şemsiye al anlamındadır.' },
    ],
    ezber: [
      ['Since + V2', 'Ana cümle: have/has V3 (Present Perfect)'],
      ['By the time + V1', 'Ana cümle: will have V3 (Future Perfect)'],
      ['By the time + V2', 'Ana cümle: had V3 (Past Perfect)'],
      ['Unless', 'If not (-medikçe / -mezse), içinde not kullanılmaz'],
    ],
    yok: 'Eski gramer istisnaları sorulmaz; fonksiyonel bağlaç ve zaman ilişkisi ölçülür.',
    sinavda: 'Boşluğun sağındaki ve solundaki yapıyı matematiksel eşleştir. 10 soruyu 12-14 dakikada tamamla.'
  },
  {
    id: 'cloze_test', ad: 'Cloze Test (Boşluk Doldurma)', aralik: [17, 26], soru: 10, ters: 1,
    ozet: '2 akademik metin, her birinde 5 boşluk. Paragrafın bütünlüğü esastır.',
    cikan: [
      ['Bağlam içi kelime ve edat', 4, 4],
      ['Cümleler arası bağlaç ve geçiş ifadesi', 4, 4],
      ['Zaman ve gramer yapısı', 2, 4],
    ],
    tuzak: [
      'Boşlukları tek tek bağımsız cümle gibi çözme; metnin ana fikri şıkkı belirler.',
      'Bir sonraki cümlenin ilk kelimesindeki referans zamiri önceki boşluğun cevabını verir.',
    ],
    ezber: [
      ['Metin Taraması', 'İlk boşluğa geçmeden önce metnin ilk 2 cümlesini oku'],
      ['Zaman Ekseni', 'Metin tarihsel mi (Past) yoksa bilimsel gerçeklik mi (Present)'],
    ],
    yok: 'Edebi şiir veya kurgu metinleri sorulmaz; popüler bilim veya tarih metinleridir.',
    sinavda: 'Her cloze test için 6 dakika (toplam 12 dakika) ideal süredir.'
  },
  {
    id: 'cumle_tamamlama', ad: 'Cümle Tamamlama', aralik: [27, 36], soru: 10, ters: 2,
    ozet: 'Yan cümle ile ana cümle arasında bağlaç, zaman ve referans zamiri köprüsü.',
    cikan: [
      ['Zıtlık bağlaçlı tamamlama', 4, 4],
      ['Neden-sonuç ve amaç bağlaçlı tamamlama', 3, 4],
      ['Zaman ve koşul cümleleri', 3, 4],
    ],
    tuzak: [
      'Öznesi havada kalan veya zamir karşılığı olmayan şıklar güçlü çeldiricidir.',
      'Gramer olarak uyan ama soru köküyle aynı şeyi tekrarlayan totolojik şıklara kanma.',
    ],
    ezber: [
      ['Zıtlık Dengesi', '+ kutuptan - kutba veya tersi geçiş aranır'],
      ['Zamir Eşleşmesi', 'They / these görülen şıkta sorudaki çoğul özne aranır'],
    ],
    yok: 'Eksik yüklemli veya devrik şıklar doğru kabul edilmez.',
    sinavda: 'Soru kökündeki bağlacın altını çiz; aradığın mantıksal ilişkiyi kafanda kurup şıklara in.'
  },
  {
    id: 'ceviri', ad: 'Çeviri (ENG-TR & TR-ENG)', aralik: [37, 42], soru: 6, ters: 0,
    ozet: '3 İngilizce-Türkçe + 3 Türkçe-İngilizce. Yüklem ve özne analiziyle sıfır hata.',
    cikan: [
      ['İngilizce - Türkçe Çeviri', 3, 4],
      ['Türkçe - İngilizce Çeviri', 3, 4],
    ],
    tuzak: [
      'Tüm cümleyi okuyup tercüme etmeye çalışma; yüklemi tutmayan 3 şıkkı hemen ele.',
      'Etken fiili edilgen (passive) yapan şıklara dikkat et (is believed -> inanır değil, inanılır).',
    ],
    ezber: [
      ['Yüklem Kilidi', 'Türkçe cümlenin en sonundaki kelime ana yüklemdir'],
      ['Özne Kilidi', 'Virgülden önceki kısım genellikle ana öznedir'],
    ],
    yok: 'Yoruma dayalı serbest tercüme aranmaz; lafzi ve yapısal denklem aranır.',
    sinavda: 'Bu 6 soru en hızlı puan toplanan yerdir. Soru başı 45 saniyede çözülebilir.'
  },
  {
    id: 'okuma_parcalari', ad: 'Okuma Parçaları (5 Metin x 4 Soru)', aralik: [43, 62], soru: 20, ters: 5,
    ozet: 'Sınavın en belirleyici bloğu. Tarih, biyoloji, çevre, psikoloji ve teknoloji.',
    cikan: [
      ['Doğrudan bilgi ve detay (According to the passage)', 8, 4],
      ['Çıkarım ve mantıksal sonuç (It can be inferred that)', 6, 4],
      ['Ana fikir ve başlık (Primary purpose / best title)', 4, 4],
      ['Yazarın tutumu ve üslubu (Author attitude)', 2, 4],
    ],
    tuzak: [
      'Metindeki kelimelerin birebir aynısını içeren seçenekler çoğunlukla çeldiricidir.',
      'Solely, completely, only gibi aşırı ifadeler %90 elenir.',
    ],
    ezber: [
      ['Paraphrase Kuralı', 'Doğru şık metindeki fikrin farklı kelimelerle sunulmuş halidir'],
      ['Hedging', 'May, might, could, tend to içeren temkinli şıklar önceliklidir'],
    ],
    yok: 'Metin dışından genel kültürle soru çözülmez; her iddia metne dayandırılmalıdır.',
    sinavda: 'Metne başlamadan önce 4 sorunun kökünü oku. Her metne 10-12 dakika ayır.'
  },
  {
    id: 'diyalog', ad: 'Diyalog Tamamlama', aralik: [63, 67], soru: 5, ters: 1,
    ozet: 'İki kişi arasındaki konuşmada eksik replik. Boşluktan sonraki tepki anahtardır.',
    cikan: [
      ['Akademik ve mesleki diyaloglar', 3, 4],
      ['Günlük ve entelektüel tartışmalar', 2, 4],
    ],
    tuzak: [
      'Önceki cümleye uyan ama sonraki cümlenin tepkisiyle çelişen şık.',
    ],
    ezber: [
      ['Sonraki Cümle', 'Boşluktan hemen sonraki konuşmacının onay/itirazına odaklan'],
    ],
    yok: 'Düzensiz veya anlamsız diyalog akışı.',
    sinavda: 'Boşluktan sonraki repliği sanki cevabın gerekçesiymiş gibi oku.'
  },
  {
    id: 'es_anlam', ad: 'Eş Anlamlı Cümle (Restatement)', aralik: [68, 71], soru: 4, ters: 0,
    ozet: 'Verilen uzun ve karmaşık cümlenin aynı anlamı taşıyan eşdeğerini bulma.',
    cikan: [
      ['Koşul ve zıtlık yapılarının dönüşümü', 2, 4],
      ['Neden-sonuç ve karşılaştırma cümleleri', 2, 4],
    ],
    tuzak: [
      'Metinde olmayan yeni bir bilgi veya yargı ekleyen şıklar.',
      'Orijinal cümlenin vurguladığı ana mesajı yan mesaja dönüştüren seçenekler.',
    ],
    ezber: [
      ['Anlam Korunumu', 'Hiçbir bilgi eksilmemeli, hiçbir dış bilgi eklenmemelidir'],
    ],
    yok: 'Cümledeki derecelendirmeyi (more than, less than) bozan şıklar.',
    sinavda: 'Cümleyi parçala: Sebep ne? Sonuç ne? Şart ne? Şıklarda aynı 3 parçayı ara.'
  },
  {
    id: 'paragraf_tamamlama', ad: 'Paragraf Tamamlama', aralik: [72, 75], soru: 4, ters: 1,
    ozet: 'Paragrafın akışını tamamlayan eksik cümle. Öncesi ve sonrası arasındaki köprü.',
    cikan: [
      ['Gelişme bölümü boşlukları', 3, 4],
      ['Sonuç veya giriş cümlesi boşluğu', 1, 4],
    ],
    tuzak: [
      'Paragrafa çok güzel uyan ama boşluğun arkasındaki cümleyi askıda bırakan şık.',
    ],
    ezber: [
      ['Köprü Kuralı', 'Boşluğa koyduğun cümle hem sola hem sağa pürüzsüz bağlanmalıdır'],
    ],
    yok: 'Paragrafın genel konusundan sapan yan fikirler.',
    sinavda: 'Şıkkı boşluğa yerleştirip önceki ve sonraki cümleyle birlikte oku.'
  },
  {
    id: 'akisi_bozan', ad: 'Akışı Bozan Cümle', aralik: [76, 80], soru: 5, ters: 0,
    ozet: 'Paragraftaki konudan sapan, fazla genel/özel kalan veya zamanı bozan cümle.',
    cikan: [
      ['Kapsam ve konu kayması', 3, 4],
      ['Özne veya referans kopukluğu', 2, 4],
    ],
    tuzak: [
      'Paragraftaki aynı anahtar kelimeleri taşıdığı için ilgiliymiş gibi görünen yabancı cümle.',
    ],
    ezber: [
      ['Çıkar ve Oku', 'Şüphelendiğin cümleyi at, önceki ve sonraki cümleyi peş peşe oku'],
    ],
    yok: 'Birden fazla cümle akışı bozamaz; tek bir uyumsuz halka vardır.',
    sinavda: 'Genellikle III. veya IV. cümle bozar; ama I. cümlenin de bozabildiğini unutma.'
  }
];

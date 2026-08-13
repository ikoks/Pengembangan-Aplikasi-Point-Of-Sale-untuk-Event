/* ==========================================================================
   SELF-ORDERING QR EVENT WEB APP — APP.JS
   Engine Logika Bisnis, Adaptif Cabang, Multi-Language, Barcode & Real-Time Sync
   ========================================================================== */

// STATE SINKRONISASI GLOBAL
const state = {
  activeBranch: 'gelato-bdg', // Default branch
  activeBrand: 'GELATO',       // GELATO vs TERVE
  currentLang: 'ID',           // ID vs EN
  customerName: '',
  customerPhone: '',
  customerEmail: '',
  searchQuery: '',
  activeCategory: 'ALL',
  cart: [],
  orderNotes: '',
  activeOrder: null,
  selectedModifierItem: null,
  tempModifiers: {},
  userRating: 0
};

// DATA MENU LET'S GO GELATO (BANDUNG BENGAWAN)
const GELATO_MENU = [
  {
    id: 'g1',
    name: 'Single Scoop Cup',
    price: 30000,
    category: 'Gelato Cup',
    emoji: '🍨',
    isBestSeller: true,
    isPromo: false,
    isSoldOut: false,
    variantTag: '🍨 1 Scoop',
    modifierGroup: 'GELATO_SCOOP_1'
  },
  {
    id: 'g2',
    name: 'Double Scoop Cup',
    price: 45000,
    category: 'Gelato Cup',
    emoji: '🍧',
    isBestSeller: true,
    isPromo: true,
    isSoldOut: false,
    variantTag: '🍨 2 Scoops',
    modifierGroup: 'GELATO_SCOOP_2'
  },
  {
    id: 'g3',
    name: 'Triple Scoop Cup',
    price: 60000,
    category: 'Gelato Cup',
    emoji: '🍨',
    isBestSeller: false,
    isPromo: false,
    isSoldOut: false,
    variantTag: '🍨 3 Scoops',
    modifierGroup: 'GELATO_SCOOP_3'
  },
  {
    id: 'g4',
    name: 'Waffle Cone Double Scoop',
    price: 50000,
    category: 'Waffle Cone',
    emoji: '🍦',
    isBestSeller: true,
    isPromo: false,
    isSoldOut: false,
    variantTag: '🍦 Artisan Cone',
    modifierGroup: 'GELATO_SCOOP_2'
  },
  {
    id: 'g5',
    name: 'Mango Sorbet (Vegan)',
    price: 35000,
    category: 'Sorbet',
    emoji: '🥭',
    isBestSeller: false,
    isPromo: false,
    isSoldOut: false,
    variantTag: '🥭 100% Real Fruit',
    modifierGroup: null
  },
  {
    id: 'g6',
    name: 'Pistachio Supreme Scoop',
    price: 38000,
    category: 'Premium Gelato',
    emoji: '🥜',
    isBestSeller: true,
    isPromo: false,
    isSoldOut: false,
    variantTag: '⭐ Premium Flavor',
    modifierGroup: null
  },
  {
    id: 'g7',
    name: 'Waffle Bowl Extra Topping',
    price: 15000,
    category: 'Toppings',
    emoji: '🧇',
    isBestSeller: false,
    isPromo: false,
    isSoldOut: true,
    variantTag: '🧇 Extra Topping',
    modifierGroup: null
  }
];

// DATA MENU TERVE CHOCOLATE (JAKARTA CAFE)
const TERVE_MENU = [
  {
    id: 't1',
    name: 'Signature Dark Choco Drink',
    price: 35000,
    category: 'Drinks',
    emoji: '🥤',
    isBestSeller: true,
    isPromo: true,
    isSoldOut: false,
    variantTag: '🍫 70% Cocoa',
    modifierGroup: 'TERVE_CUSTOM'
  },
  {
    id: 't2',
    name: 'Artisan Hot Cocoa Blend',
    price: 38000,
    category: 'Drinks',
    emoji: '☕',
    isBestSeller: true,
    isPromo: false,
    isSoldOut: false,
    variantTag: '🍫 85% Extra Dark',
    modifierGroup: 'TERVE_CUSTOM'
  },
  {
    id: 't3',
    name: 'Single Origin Bali Chocolate Bar',
    price: 45000,
    category: 'Chocolate Bars',
    emoji: '🍫',
    isBestSeller: false,
    isPromo: false,
    isSoldOut: false,
    variantTag: '🍫 100% Organic Cocoa',
    modifierGroup: null
  },
  {
    id: 't4',
    name: 'Choco Croissant Artisan',
    price: 28000,
    category: 'Pastry',
    emoji: '🥐',
    isBestSeller: true,
    isPromo: false,
    isSoldOut: false,
    variantTag: '🍫 60% Milk Choco',
    modifierGroup: null
  },
  {
    id: 't5',
    name: 'Praline Gift Box 9 Pcs',
    price: 85000,
    category: 'Gift Set',
    emoji: '🎁',
    isBestSeller: false,
    isPromo: false,
    isSoldOut: false,
    variantTag: '🍫 75% Dark Selection',
    modifierGroup: null
  }
];

// DICTIONARY DUA BAHASA (MULTI-LANGUAGE NOMOR 11)
const I18N = {
  ID: {
    welcomeTitle: '👋 SELAMAT DATANG!',
    welcomeSub: 'Silakan masukkan data pemesan Anda sebelum memilih menu lezat di booth kami:',
    nameLabel: 'NAMA PEMESAN (WAJIB):',
    phoneLabel: 'NOMOR HP / WHATSAPP (WAJIB):',
    emailLabel: 'EMAIL (WAJIB):',
    namePlaceholder: 'Contoh: Siti Rahma...',
    phonePlaceholder: 'Contoh: 081234567890...',
    emailPlaceholder: 'Contoh: customer@email.com...',
    confirmNameBtn: 'MULAI PILIH MENU ➔',
    cartTitle: '🛒 KERANJANG PESANAN',
    notesLabel: '📝 CATATAN PESANAN (OPSIONAL):',
    notesPlaceholder: 'Misal: Less sugar / es sedikit / tanpa meses...',
    searchPlaceholder: 'Cari menu favorit...',
    subtotal: 'Subtotal:',
    tax: 'PPN (11%):',
    total: 'TOTAL TAGIHAN:',
    paymentInfo: 'Diterima di Kasir: Tunai, QRIS, EDC NFC Contactless, Debit/Kredit',
    checkoutBtn: 'Membuat Pesanan ➔',
    mobileCartCta: 'LIHAT KERANJANG ➔',
    receiptMainTitle: 'RINGKASAN PESANAN ANDA',
    receiptSubTitle: 'Pesanan siap dibayar di kasir',
    receiptCustLabel: 'PEMESAN:',
    receiptTotalLabel: 'TOTAL TAGIHAN:',
    barcodeHeader: 'BARCODE DRAF PESANAN UNTUK KASIR',
    barcodeFooter: 'Tunjukkan barcode ini ke kasir untuk di-scan saat membayar',
    noticeHeader: '🚨 PERHATIAN PENTING KEPADA PELANGGAN!',
    noticeSubheader: 'WAJIB SEGERA PEMBAYARAN KEPADA KASIR DENGAN MENUNJUKKAN BARCODE',
    noticeBody: 'Mohon tunjukkan barcode di atas dan <span style="text-decoration: underline !important; font-weight: 900 !important; color: #FFDD00 !important;">LAKUKAN PEMBAYARAN DI KASIR TERLEBIH DAHULU</span>. Pesanan Anda baru akan diproses dan dibuat oleh tim dapur setelah pembayaran terkonfirmasi.',
    statusCardTitle: '🔄 STATUS PENYIAPAN PESANAN REAL-TIME:',
    stepPending: 'Diterima',
    stepProgress: 'Sedang Dibuat',
    stepReady: 'Siap Disajikan',
    estWaitLabel: 'Estimasi Penyiapan:',
    estWaitValue: '~5–8 Menit',
    expWarning: 'Draf pesanan ini berlaku 45 menit. Segera lakukan pembayaran di booth kasir.',
    saveReceiptBtn: 'SIMPAN DRAF KE GALERI HP',
    newOrderBtn: 'BUAT PESANAN BARU',
    addModifierBtn: 'TAMBAH KE KERANJANG ➔',
    ratingTitle: '⭐ RATING & ULASAN BOOTH',
    ratingSub: 'Bagaimana pengalaman pemesanan Anda di booth kami?',
    feedbackPlaceholder: 'Berikan saran & ulasan singkat Anda...',
    submitRatingBtn: 'KIRIM ULASAN ➔',
    backToMenuBtn: '← Kembali Ke Menu',
    gelatoPromoTicker: '📢 PROMO SPECIAL BOOTH EVENT: BELI 2 GELATO DOUBLE SCOOP FREE 1 TOPPING WAFFLE! 🍦✨',
    tervePromoTicker: '📢 PROMO SPECIAL EVENT TERVE: BUY 1 GET 1 CHOCOLATE DRINK 🍫✨'
  },
  EN: {
    welcomeTitle: '👋 WELCOME!',
    welcomeSub: 'Please enter your details before selecting delicious menu items from our booth:',
    nameLabel: 'CUSTOMER NAME (REQUIRED):',
    phoneLabel: 'PHONE / WHATSAPP (REQUIRED):',
    emailLabel: 'EMAIL ADDRESS (REQUIRED):',
    namePlaceholder: 'e.g. Siti Rahma...',
    phonePlaceholder: 'e.g. 081234567890...',
    emailPlaceholder: 'e.g. customer@email.com...',
    confirmNameBtn: 'START SELECTING MENU ➔',
    cartTitle: '🛒 YOUR ORDER CART',
    notesLabel: '📝 ORDER NOTES (OPTIONAL):',
    notesPlaceholder: 'e.g. Less sugar / less ice / no topping...',
    searchPlaceholder: 'Search favorite menu...',
    subtotal: 'Subtotal:',
    tax: 'VAT (11%):',
    total: 'TOTAL BILL:',
    paymentInfo: 'Accepted at Cashier: Cash, QRIS, EDC NFC Contactless, Debit/Credit',
    checkoutBtn: 'Make Order ➔',
    mobileCartCta: 'VIEW CART ➔',
    receiptMainTitle: 'YOUR ORDER SUMMARY',
    receiptSubTitle: 'Order ready for payment at cashier booth',
    receiptCustLabel: 'CUSTOMER:',
    receiptTotalLabel: 'TOTAL BILL:',
    barcodeHeader: 'ORDER DRAFT BARCODE FOR CASHIER',
    barcodeFooter: 'Show this barcode to the cashier to scan when paying',
    noticeHeader: '🚨 IMPORTANT NOTICE TO CUSTOMER!',
    noticeSubheader: 'MANDATORY IMMEDIATE PAYMENT TO CASHIER BY SHOWING BARCODE',
    noticeBody: 'Please show the barcode above and <span style="text-decoration: underline !important; font-weight: 900 !important; color: #FFDD00 !important;">MAKE PAYMENT AT THE CASHIER FIRST</span>. Your order will only be prepared and made by the kitchen team after payment is confirmed.',
    statusCardTitle: '🔄 REAL-TIME ORDER PREPARATION STATUS:',
    stepPending: 'Received',
    stepProgress: 'In Progress',
    stepReady: 'Ready to Serve',
    estWaitLabel: 'Estimated Prep Time:',
    estWaitValue: '~5–8 Mins',
    expWarning: 'This draft order is valid for 45 minutes. Please make payment at cashier booth.',
    saveReceiptBtn: 'SAVE DRAFT TO HP GALLERY',
    newOrderBtn: 'PLACE NEW ORDER',
    addModifierBtn: 'ADD TO CART ➔',
    ratingTitle: '⭐ BOOTH RATING & REVIEWS',
    ratingSub: 'How was your ordering experience at our booth?',
    feedbackPlaceholder: 'Leave your short feedback & suggestions...',
    submitRatingBtn: 'SUBMIT REVIEW ➔',
    backToMenuBtn: '← Back To Menu',
    gelatoPromoTicker: '📢 SPECIAL BOOTH EVENT PROMO: BUY 2 GELATO DOUBLE SCOOP GET 1 FREE WAFFLE TOPPING! 🍦✨',
    tervePromoTicker: '📢 TERVE SPECIAL EVENT PROMO: BUY 1 GET 1 FREE CHOCOLATE DRINK 🍫✨'
  }
};

// INISIALISASI APLIKASI SANITIZED & SAFE
function initApp() {
  initBranchDetection();
  renderCategoryChips();
  renderMenuGrid();
  renderCart();
  checkStoredCustomerName();
  startStatusPolling();

  setTimeout(() => {
    const backBtn = document.getElementById('cartBackBtn');
    if (backBtn) {
      backBtn.onclick = function(e) {
        window.closeMobileCartDrawer(e);
      };
    }
  }, 100);
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initApp);
} else {
  initApp();
}

// 1. DETEKSI PARAMETER QR BRANCH & BRAND
function initBranchDetection() {
  const urlParams = new URLSearchParams(window.location.search);
  const pathName = window.location.pathname.toLowerCase();
  let branchParam = urlParams.get('branch') || '';

  if (!branchParam) {
    if (pathName.includes('bengawan')) branchParam = pathName.includes('terve') ? 'terve-bandung-bengawan' : 'gelato-bandung-bengawan';
    else if (pathName.includes('braga')) branchParam = pathName.includes('terve') ? 'terve-bandung-braga' : 'gelato-bandung-braga';
    else if (pathName.includes('kbp')) branchParam = 'terve-padalarang-kbp';
    else if (pathName.includes('cibubur')) branchParam = 'gelato-jakarta-cibubur';
    else if (pathName.includes('gandaria')) branchParam = 'gelato-jakarta-gandaria';
    else if (pathName.includes('gading')) branchParam = 'gelato-jakarta-gading';
    else if (pathName.includes('centralpark')) branchParam = 'gelato-jakarta-centralpark';
    else if (pathName.includes('bekasi')) branchParam = 'gelato-bekasi-summarecon';
    else if (pathName.includes('cibinong')) branchParam = 'gelato-bogor-cibinong';
    else if (pathName.includes('botani')) branchParam = 'gelato-bogor-botani';
    else if (pathName.includes('margocity')) branchParam = 'gelato-depok-margocity';
    else if (pathName.includes('karawaci')) branchParam = 'gelato-tangerang-karawaci';
    else if (pathName.includes('bintaro')) branchParam = 'gelato-tangerang-bintaro';
    else if (pathName.includes('malioboro')) branchParam = 'gelato-jogja-malioboro';
    else if (pathName.includes('simpanglima')) branchParam = 'gelato-semarang-simpanglima';
    else if (pathName.includes('solo')) branchParam = 'gelato-solo-paragon';
    else if (pathName.includes('tunjungan')) branchParam = 'gelato-surabaya-tunjungan';
    else if (pathName.includes('matos')) branchParam = 'gelato-malang-matos';
    else if (pathName.includes('seminyak')) branchParam = 'gelato-bali-seminyak';
    else if (pathName.includes('canggu')) branchParam = 'gelato-bali-canggu';
    else if (pathName.includes('beachwalk')) branchParam = 'gelato-bali-beachwalk';
    else if (pathName.includes('medan')) branchParam = 'gelato-medan-sunplaza';
    else if (pathName.includes('palembang')) branchParam = 'gelato-palembang-pim';
    else if (pathName.includes('makassar')) branchParam = 'gelato-makassar-tsm';
    else if (pathName.includes('balikpapan')) branchParam = 'gelato-balikpapan-pentacity';
    else branchParam = pathName.includes('terve') ? 'terve-bandung-bengawan' : 'gelato-bandung-bengawan';
  }

  state.activeBranch = branchParam;

  const branchDisplayNames = {
    'gelato-bandung-bengawan': "Bengawan (Bandung)",
    'gelato-bandung-braga': "Braga (Bandung)",
    'gelato-bandung-ciumbuleuit': "Ciumbuleuit (Bandung)",
    'gelato-bandung-pvj': "Paris Van Java (Bandung)",
    'gelato-bandung-summarecon': "Summarecon Mall Bandung",
    'gelato-jakarta-cibubur': "TSM Cibubur (Jakarta)",
    'gelato-jakarta-gandaria': "Gandaria City (Jakarta)",
    'gelato-jakarta-gading': "Mall Kelapa Gading (Jakarta)",
    'gelato-jakarta-centralpark': "Central Park (Jakarta)",
    'gelato-bekasi-summarecon': "Summarecon Mall Bekasi",
    'gelato-bekasi-grandmet': "Grand Metropolitan Bekasi",
    'gelato-bogor-cibinong': "Cibinong City Mall (Bogor)",
    'gelato-bogor-botani': "Botani Square (Bogor)",
    'gelato-depok-margocity': "Margo City (Depok)",
    'gelato-tangerang-karawaci': "Supermal Karawaci (Tangerang)",
    'gelato-tangerang-bintaro': "Bintaro Jaya Xchange (Tangsel)",
    'gelato-jogja-malioboro': "Malioboro (Yogyakarta)",
    'gelato-jogja-pakuwon': "Pakuwon Mall Jogja",
    'gelato-semarang-simpanglima': "Simpang Lima (Semarang)",
    'gelato-solo-paragon': "Solo Paragon (Solo)",
    'gelato-surabaya-tunjungan': "Tunjungan Plaza (Surabaya)",
    'gelato-surabaya-pakuwon': "Pakuwon Mall Surabaya",
    'gelato-malang-matos': "Malang Town Square (Malang)",
    'gelato-bali-seminyak': "Seminyak (Bali)",
    'gelato-bali-canggu': "Canggu (Bali)",
    'gelato-bali-beachwalk': "Beachwalk Kuta (Bali)",
    'gelato-medan-sunplaza': "Sun Plaza (Medan)",
    'gelato-palembang-pim': "Palembang Indah Mall",
    'gelato-makassar-tsm': "Trans Studio Mall Makassar",
    'gelato-balikpapan-pentacity': "Pentacity Mall (Balikpapan)",
    'terve-bandung-bengawan': "Bengawan (Bandung)",
    'terve-bandung-braga': "Braga (Bandung)",
    'terve-padalarang-kbp': "KBP (Padalarang)",
  };

  const branchTitle = branchDisplayNames[branchParam] || branchParam.replace(/-/g, ' ').toUpperCase();
  const subEl = document.getElementById('branchSubtitle');

  document.getElementById('brandEmoji').textContent = '🎪';
  document.getElementById('brandTitle').textContent = 'BOOTH EVENT';
  if (subEl) subEl.textContent = `📍 CABANG - ${branchTitle.toUpperCase()}`;
  document.getElementById('tickerText').textContent = I18N[state.currentLang].gelatoPromoTicker;
}

// 2. CHECK CUSTOMER DATA & WELCOME MODAL (MANDATORY ON EVERY SCAN/REFRESH)
function checkStoredCustomerName() {
  state.customerName = '';
  state.customerPhone = '';
  state.customerEmail = '';

  const nameInput = document.getElementById('customerNameInput');
  const phoneInput = document.getElementById('customerPhoneInput');
  const emailInput = document.getElementById('customerEmailInput');

  if (nameInput) nameInput.value = '';
  if (phoneInput) phoneInput.value = '';
  if (emailInput) emailInput.value = '';

  document.getElementById('displayCustomerName').textContent = '-';
  // POP UP WELCOME MODAL IMMEDIATELY ON FIRST WEB ENTRY!
  document.getElementById('welcomeModal').style.display = 'flex';
}

function confirmWelcomeName() {
  const name = (document.getElementById('customerNameInput')?.value || '').trim();
  const phone = (document.getElementById('customerPhoneInput')?.value || '').trim();
  const email = (document.getElementById('customerEmailInput')?.value || '').trim();

  if (!name) {
    alert(state.currentLang === 'ID' ? 'Mohon isi Nama Pemesan (Wajib)!' : 'Please enter Customer Name (Required)!');
    return;
  }
  if (!phone) {
    alert(state.currentLang === 'ID' ? 'Mohon isi Nomor HP / WhatsApp (Wajib)!' : 'Please enter Phone / WhatsApp Number (Required)!');
    return;
  }
  if (!email || !email.includes('@')) {
    alert(state.currentLang === 'ID' ? 'Mohon isi Alamat Email yang valid (Wajib)!' : 'Please enter a valid Email Address (Required)!');
    return;
  }

  state.customerName = name;
  state.customerPhone = phone;
  state.customerEmail = email;
  document.getElementById('displayCustomerName').textContent = name;

  // Close overlay modal and unlock interaction on Menu Utama
  document.getElementById('welcomeModal').style.display = 'none';

  const section = document.getElementById('cartSection');
  if (section) {
    section.classList.remove('mobile-open');
    section.style.setProperty('display', 'none', 'important');
  }
  document.body.classList.remove('mobile-cart-active');
  
  if (window.innerWidth <= 768) {
    const mobileBar = document.getElementById('mobileCartBar');
    if (mobileBar) mobileBar.style.setProperty('display', 'flex', 'important');
  }

  renderCategoryChips();
  renderMenuGrid();
  renderCart();
}

function openWelcomeModal() {
  if (document.getElementById('customerNameInput')) document.getElementById('customerNameInput').value = state.customerName;
  if (document.getElementById('customerPhoneInput')) document.getElementById('customerPhoneInput').value = state.customerPhone;
  if (document.getElementById('customerEmailInput')) document.getElementById('customerEmailInput').value = state.customerEmail;
  document.getElementById('welcomeModal').style.display = 'flex';
}

// 3. MULTI-LANGUAGE ENGINE TOGGLE (100% TEXT TRANSLATION COVERAGE)
function toggleLanguage() {
  state.currentLang = state.currentLang === 'ID' ? 'EN' : 'ID';
  document.getElementById('langFlag').textContent = state.currentLang === 'ID' ? '🇮🇩' : '🇬🇧';
  document.getElementById('langCode').textContent = state.currentLang;

  const t = I18N[state.currentLang];

  // Ticker Promo Text
  document.getElementById('tickerText').textContent = state.activeBrand === 'TERVE' ? t.tervePromoTicker : t.gelatoPromoTicker;

  // Welcome Modal
  if (document.getElementById('tWelcomeTitle')) document.getElementById('tWelcomeTitle').textContent = t.welcomeTitle;
  if (document.getElementById('tWelcomeSub')) document.getElementById('tWelcomeSub').textContent = t.welcomeSub;
  if (document.getElementById('tNameLabel')) document.getElementById('tNameLabel').textContent = t.nameLabel;
  if (document.getElementById('tPhoneLabel')) document.getElementById('tPhoneLabel').textContent = t.phoneLabel;
  if (document.getElementById('tEmailLabel')) document.getElementById('tEmailLabel').textContent = t.emailLabel;
  if (document.getElementById('customerNameInput')) document.getElementById('customerNameInput').placeholder = t.namePlaceholder;
  if (document.getElementById('customerPhoneInput')) document.getElementById('customerPhoneInput').placeholder = t.phonePlaceholder;
  if (document.getElementById('customerEmailInput')) document.getElementById('customerEmailInput').placeholder = t.emailPlaceholder;
  if (document.getElementById('tConfirmNameBtn')) document.getElementById('tConfirmNameBtn').textContent = t.confirmNameBtn;

  // Search & Cart Section
  document.getElementById('searchInput').placeholder = t.searchPlaceholder;
  document.getElementById('tCartTitle').textContent = t.cartTitle;
  document.getElementById('tNotesLabel').textContent = t.notesLabel;
  document.getElementById('orderNotesInput').placeholder = t.notesPlaceholder;
  document.getElementById('tSubtotal').textContent = t.subtotal;
  document.getElementById('tTax').textContent = t.tax;
  document.getElementById('tTotal').textContent = t.total;
  document.getElementById('tPaymentInfo').textContent = t.paymentInfo;
  document.getElementById('tCheckoutBtn').textContent = t.checkoutBtn;
  document.getElementById('tMobileCartCta').textContent = t.mobileCartCta;
  if (document.getElementById('tBackToMenuBtn')) {
    document.getElementById('tBackToMenuBtn').textContent = t.backToMenuBtn;
  }

  // Barcode & Receipt Summary Screen
  document.getElementById('tReceiptMainTitle').textContent = t.receiptMainTitle;
  document.getElementById('tReceiptSubTitle').textContent = t.receiptSubTitle;
  document.getElementById('tReceiptCustLabel').textContent = t.receiptCustLabel;
  document.getElementById('tReceiptTotalLabel').textContent = t.receiptTotalLabel;
  document.getElementById('tBarcodeHeader').textContent = t.barcodeHeader;
  document.getElementById('tBarcodeFooter').textContent = t.barcodeFooter;

  if (document.getElementById('tNoticeHeader')) document.getElementById('tNoticeHeader').textContent = t.noticeHeader;
  if (document.getElementById('tNoticeSubheader')) document.getElementById('tNoticeSubheader').textContent = t.noticeSubheader;
  if (document.getElementById('tNoticeBody')) document.getElementById('tNoticeBody').innerHTML = t.noticeBody;
  document.getElementById('tStatusCardTitle').textContent = t.statusCardTitle;
  document.getElementById('tStepPending').textContent = t.stepPending;
  document.getElementById('tStepProgress').textContent = t.stepProgress;
  document.getElementById('tStepReady').textContent = t.stepReady;
  document.getElementById('tEstWaitLabel').textContent = t.estWaitLabel;
  document.getElementById('tEstWaitValue').textContent = t.estWaitValue;
  document.getElementById('tExpWarning').textContent = t.expWarning;
  document.getElementById('tSaveReceiptBtn').textContent = t.saveReceiptBtn;
  document.getElementById('tNewOrderBtn').textContent = t.newOrderBtn;
  document.getElementById('tAddModifierBtn').textContent = t.addModifierBtn;

  // Rating Modal
  document.getElementById('tRatingTitle').textContent = t.ratingTitle;
  document.getElementById('tRatingSub').textContent = t.ratingSub;
  document.getElementById('feedbackComment').placeholder = t.feedbackPlaceholder;
  document.getElementById('tSubmitRatingBtn').textContent = t.submitRatingBtn;

  renderCategoryChips();
  renderMenuGrid();
  renderCart();
}

// 4. RENDER CATEGORY CHIPS & SEARCH
function getMenuList() {
  return [...GELATO_MENU, ...TERVE_MENU];
}

const CATEGORY_I18N = {
  ID: {
    'ALL': 'SEMUA MENU',
    'Drinks': 'Minuman Cokelat',
    'Chocolate Bars': 'Cokelat Batang',
    'Pastry': 'Pastry & Roti',
    'Gift Set': 'Kotak Hadiah',
    'Gelato Cup': 'Gelato Cup',
    'Waffle Cone': 'Waffle Cone',
    'Sorbet': 'Sorbet Buah',
    'Premium Gelato': 'Premium Gelato',
    'Toppings': 'Topping Waffle'
  },
  EN: {
    'ALL': 'ALL ITEMS',
    'Drinks': 'Chocolate Drinks',
    'Chocolate Bars': 'Chocolate Bars',
    'Pastry': 'Pastry & Bakery',
    'Gift Set': 'Gift Sets',
    'Gelato Cup': 'Gelato Cups',
    'Waffle Cone': 'Waffle Cones',
    'Sorbet': 'Fruit Sorbets',
    'Premium Gelato': 'Premium Gelato',
    'Toppings': 'Waffle Toppings'
  }
};

function renderCategoryChips() {
  const menuList = getMenuList();
  const categories = ['ALL', ...new Set(menuList.map(m => m.category))];
  const dict = CATEGORY_I18N[state.currentLang] || CATEGORY_I18N['ID'];

  const container = document.getElementById('categoryChips');
  container.innerHTML = categories.map(cat => {
    const label = dict[cat] || cat;
    return `
      <button class="chip-btn ${state.activeCategory === cat ? 'active' : ''}" onclick="selectCategory('${cat}')">
        ${label}
      </button>
    `;
  }).join('');
}

function selectCategory(cat) {
  state.activeCategory = cat;
  renderCategoryChips();
  renderMenuGrid();
}

function handleSearch() {
  const val = document.getElementById('searchInput').value.trim().toLowerCase();
  state.searchQuery = val;
  document.getElementById('clearSearchBtn').style.display = val ? 'block' : 'none';
  renderMenuGrid();
}

function clearSearch() {
  document.getElementById('searchInput').value = '';
  state.searchQuery = '';
  document.getElementById('clearSearchBtn').style.display = 'none';
  renderMenuGrid();
}

// 5. RENDER MENU GRID
function renderMenuGrid() {
  const menuList = getMenuList();
  const grid = document.getElementById('menuGrid');

  const searchQuery = (document.getElementById('searchInput')?.value || '').trim().toLowerCase();

  const filtered = menuList.filter(item => {
    const matchCat = state.activeCategory === 'ALL' || item.category === state.activeCategory;
    const matchSearch = !searchQuery || item.name.toLowerCase().includes(searchQuery);
    return matchCat && matchSearch;
  });

  if (filtered.length === 0) {
    grid.innerHTML = `<div class="empty-cart-msg">${state.currentLang === 'ID' ? 'Menu tidak ditemukan' : 'No menu items found'}</div>`;
    return;
  }

  const isEn = state.currentLang === 'EN';

  grid.innerHTML = filtered.map(item => `
    <div class="menu-card">
      <div class="card-top">
        <span class="product-emoji">${item.emoji}</span>
        <div class="product-details">
          <h3 class="product-name">${item.name}</h3>
          <span class="product-price">Rp ${item.price.toLocaleString('id-ID')}</span>
        </div>
      </div>

      <div class="product-badges-row">
        ${item.isBestSeller ? `<span class="badge-tag badge-bestseller">🔥 BEST SELLER</span>` : ''}
        ${item.isPromo ? `<span class="badge-tag badge-promo">${isEn ? '🏷️ SPECIAL OFFER' : '🏷️ PROMO'}</span>` : ''}
        ${item.isSoldOut ? `<span class="badge-tag badge-soldout">${isEn ? '❌ OUT OF STOCK' : '❌ STOK HABIS'}</span>` : ''}
        ${item.variantTag ? `<span class="badge-tag badge-variant">${item.variantTag}</span>` : ''}
      </div>

      <button class="add-item-btn" ${item.isSoldOut ? 'disabled' : ''} onclick="handleMenuClick('${item.id}')">
        ${item.isSoldOut ? (isEn ? 'SOLD OUT' : 'STOK HABIS') : (isEn ? '+ ADD' : '+ TAMBAH')}
      </button>
    </div>
  `).join('');
}

// 6. MENU CLICK & MODIFIER MODAL (NOMOR 12)
function handleMenuClick(itemId) {
  if (!state.customerName) {
    openWelcomeModal();
    return;
  }

  const menuList = getMenuList();
  const item = menuList.find(i => i.id === itemId);
  if (!item || item.isSoldOut) return;

  if (item.modifierGroup) {
    openModifierModal(item);
  } else {
    addToCart(item, {});
  }
}

function openModifierModal(item) {
  state.selectedModifierItem = item;
  state.tempModifiers = {};

  const modal = document.getElementById('modifierModal');
  const content = document.getElementById('modifierModalContent');
  const isEn = state.currentLang === 'EN';

  let html = '';

  if (item.modifierGroup.startsWith('GELATO_SCOOP')) {
    const scoopsCount = parseInt(item.modifierGroup.split('_')[2], 10);
    html += `<div class="mod-group">
      <h4 class="mod-group-title">${isEn ? `🍨 CHOOSE ${scoopsCount} GELATO FLAVORS:` : `🍨 PILIH ${scoopsCount} RASA GELATO:`}</h4>
      <div class="mod-options-list">
        ${['Belgian Dark Chocolate', 'Mango Sorbet', 'Pistachio Supreme', 'Matcha Green Tea', 'Cookies & Cream', 'Strawberry Shortcake'].map(flavor => `
          <button class="mod-option-btn" onclick="selectModifierOption('flavors', '${flavor}', this)">
            <span>${flavor}</span>
            <span>+Rp 0</span>
          </button>
        `).join('')}
      </div>
    </div>`;
  } else if (item.modifierGroup === 'TERVE_CUSTOM') {
    html += `
      <div class="mod-group">
        <h4 class="mod-group-title">${isEn ? '🍫 COCOA PERCENTAGE LEVEL:' : '🍫 TINGKAT KEPEKATAN COCOA:'}</h4>
        <div class="mod-options-list">
          <button class="mod-option-btn selected" onclick="selectSingleOption('cocoaPct', '50% Milk Choco', this)">50% Milk Chocolate (+Rp 0)</button>
          <button class="mod-option-btn" onclick="selectSingleOption('cocoaPct', '70% Dark Choco', this)">70% Dark Chocolate (+Rp 0)</button>
          <button class="mod-option-btn" onclick="selectSingleOption('cocoaPct', '85% Extra Dark', this)">85% Extra Dark (+Rp 5.000)</button>
        </div>
      </div>
      <div class="mod-group">
        <h4 class="mod-group-title">${isEn ? '🥛 MILK SELECTION:' : '🥛 PILIH SUSU (MILK OPTION):'}</h4>
        <div class="mod-options-list">
          <button class="mod-option-btn selected" onclick="selectSingleOption('milk', 'Fresh Milk', this)">Fresh Milk (+Rp 0)</button>
          <button class="mod-option-btn" onclick="selectSingleOption('milk', 'Oat Milk (Dairy-Free)', this)">Oat Milk (+Rp 7.000)</button>
        </div>
      </div>
      <div class="mod-group">
        <h4 class="mod-group-title">${isEn ? '🍬 SUGAR LEVEL:' : '🍬 TINGKAT GULA (SUGAR LEVEL):'}</h4>
        <div class="mod-options-list">
          <button class="mod-option-btn selected" onclick="selectSingleOption('sugar', 'Normal Sweet', this)">Normal Sweet</button>
          <button class="mod-option-btn" onclick="selectSingleOption('sugar', 'Less Sugar (50%)', this)">Less Sugar (50%)</button>
          <button class="mod-option-btn" onclick="selectSingleOption('sugar', 'No Added Sugar', this)">No Added Sugar</button>
        </div>
      </div>
      <div class="mod-group">
        <h4 class="mod-group-title">${isEn ? '🧊 ICE & TEMP LEVEL:' : '🧊 TINGKAT ES / SUHU:'}</h4>
        <div class="mod-options-list">
          <button class="mod-option-btn selected" onclick="selectSingleOption('ice', 'Normal Ice', this)">Normal Ice</button>
          <button class="mod-option-btn" onclick="selectSingleOption('ice', 'Less Ice', this)">Less Ice</button>
          <button class="mod-option-btn" onclick="selectSingleOption('ice', 'Hot (Panas)', this)">Hot (Panas)</button>
        </div>
      </div>
    `;
    state.tempModifiers = { cocoaPct: '50% Milk Choco', milk: 'Fresh Milk', sugar: 'Normal Sweet', ice: 'Normal Ice' };
  }

  content.innerHTML = html;
  modal.style.display = 'flex';
}

function selectSingleOption(group, value, btnElem) {
  state.tempModifiers[group] = value;
  const parent = btnElem.parentElement;
  Array.from(parent.children).forEach(child => child.classList.remove('selected'));
  btnElem.classList.add('selected');
}

function selectModifierOption(group, value, btnElem) {
  if (!state.tempModifiers[group]) state.tempModifiers[group] = [];
  
  if (btnElem.classList.contains('selected')) {
    btnElem.classList.remove('selected');
    state.tempModifiers[group] = state.tempModifiers[group].filter(v => v !== value);
  } else {
    btnElem.classList.add('selected');
    state.tempModifiers[group].push(value);
  }
}

function closeModifierModal() {
  document.getElementById('modifierModal').style.display = 'none';
}

function confirmModifierSelection() {
  if (state.selectedModifierItem) {
    addToCart(state.selectedModifierItem, { ...state.tempModifiers });
    closeModifierModal();
  }
}

// 7. CART STATE & RENDER
function addToCart(item, modifiers) {
  const existingIdx = state.cart.findIndex(c => c.id === item.id && JSON.stringify(c.modifiers) === JSON.stringify(modifiers));

  if (existingIdx >= 0) {
    state.cart[existingIdx].qty += 1;
  } else {
    state.cart.push({
      id: item.id,
      name: item.name,
      price: item.price,
      emoji: item.emoji,
      qty: 1,
      modifiers: modifiers
    });
  }

  renderCart();
}

function updateCartQty(index, change) {
  state.cart[index].qty += change;
  if (state.cart[index].qty <= 0) {
    state.cart.splice(index, 1);
  }
  renderCart();
}

function removeCartItem(index) {
  state.cart.splice(index, 1);
  renderCart();
}

function renderCart() {
  const list = document.getElementById('cartItemsList');

  if (state.cart.length === 0) {
    list.innerHTML = `<div class="empty-cart-msg">${state.currentLang === 'ID' ? 'Keranjang Anda masih kosong' : 'Your cart is empty'}</div>`;
    document.getElementById('valSubtotal').textContent = 'Rp 0';
    document.getElementById('valTax').textContent = 'Rp 0';
    document.getElementById('valTotal').textContent = 'Rp 0';
    document.getElementById('mobileCartCount').textContent = '0 Item';
    document.getElementById('mobileCartTotal').textContent = 'Rp 0';
    return;
  }

  let subtotal = 0;

  list.innerHTML = state.cart.map((item, idx) => {
    const itemSubtotal = item.price * item.qty;
    subtotal += itemSubtotal;

    const modText = Object.values(item.modifiers).flat().join(', ');

    return `
      <div class="cart-item-row">
        <div class="cart-item-info">
          <div class="cart-item-name">${item.emoji} ${item.name}</div>
          ${modText ? `<div class="cart-item-mods">└ ${modText}</div>` : ''}
        </div>
        <div class="cart-item-controls">
          <button class="qty-btn" onclick="updateCartQty(${idx}, -1)">−</button>
          <span class="cart-item-qty">${item.qty}</span>
          <button class="qty-btn" onclick="updateCartQty(${idx}, 1)">+</button>
          <span class="cart-item-price">Rp ${itemSubtotal.toLocaleString('id-ID')}</span>
          <button class="delete-item-btn" onclick="removeCartItem(${idx})">🗑️</button>
        </div>
      </div>
    `;
  }).join('');

  const tax = Math.round(subtotal * 0.11);
  const total = subtotal + tax;

  document.getElementById('valSubtotal').textContent = `Rp ${subtotal.toLocaleString('id-ID')}`;
  document.getElementById('valTax').textContent = `Rp ${tax.toLocaleString('id-ID')}`;
  document.getElementById('valTotal').textContent = `Rp ${total.toLocaleString('id-ID')}`;

  const totalItemsCount = state.cart.reduce((sum, item) => sum + item.qty, 0);
  document.getElementById('mobileCartCount').textContent = `${totalItemsCount} Item`;
  document.getElementById('mobileCartTotal').textContent = `Rp ${total.toLocaleString('id-ID')}`;
}

window.closeMobileCartDrawer = function(e) {
  if (e) {
    if (typeof e.stopPropagation === 'function') e.stopPropagation();
    if (typeof e.preventDefault === 'function') e.preventDefault();
  }

  const section = document.getElementById('cartSection');
  const mobileBar = document.getElementById('mobileCartBar');

  if (section) {
    section.classList.remove('mobile-open');
    section.style.setProperty('display', 'none', 'important');
  }

  document.body.classList.remove('mobile-cart-active');

  if (mobileBar) {
    mobileBar.style.setProperty('display', 'flex', 'important');
  }

  return false;
};

window.toggleMobileCartDrawer = function(e) {
  if (e) {
    if (typeof e.stopPropagation === 'function') e.stopPropagation();
    if (typeof e.preventDefault === 'function') e.preventDefault();
  }

  const section = document.getElementById('cartSection');
  const mobileBar = document.getElementById('mobileCartBar');
  if (!section) return false;

  const isCurrentlyOpen = section.classList.contains('mobile-open') || section.style.display === 'block';

  if (!isCurrentlyOpen && state.cart.length === 0) {
    alert(state.currentLang === 'ID'
      ? '⚠️ KERANJANG MASIH KOSONG!\n\nMohon pilih menu makanan/minuman terlebih dahulu sebelum melihat keranjang.'
      : '⚠️ YOUR CART IS EMPTY!\n\nPlease add menu items to your cart first.');
    return false;
  }

  if (isCurrentlyOpen) {
    window.closeMobileCartDrawer(e);
  } else {
    section.classList.add('mobile-open');
    section.style.setProperty('display', 'block', 'important');
    document.body.classList.add('mobile-cart-active');
    if (mobileBar) {
      mobileBar.style.setProperty('display', 'none', 'important');
    }
  }

  return false;
};

// 8. CHECKOUT & BARCODE CARD GENERATION (PRESI SESUAI GAMBAR REFERENSI - NOMOR 6)
function handleCheckout(e) {
  if (e) {
    if (typeof e.stopPropagation === 'function') e.stopPropagation();
    if (typeof e.preventDefault === 'function') e.preventDefault();
  }

  if (state.cart.length === 0) {
    alert(state.currentLang === 'ID'
      ? '⚠️ KERANJANG MASIH KOSONG!\n\nMohon pilih minimal 1 menu makanan/minuman terlebih dahulu sebelum melakukan pembayaran dan menampilkan Barcode.'
      : '⚠️ YOUR CART IS EMPTY!\n\nPlease select at least 1 menu item before proceeding to payment barcode.');
    return;
  }
  if (!state.customerName || !state.customerPhone || !state.customerEmail) {
    openWelcomeModal();
    return;
  }

  state.orderNotes = document.getElementById('orderNotesInput').value.trim();

  // Generate Queue Number & Order Code
  const lastQueueNum = parseInt(localStorage.getItem('pos_last_queue_no') || '24', 10) + 1;
  localStorage.setItem('pos_last_queue_no', lastQueueNum.toString());

  const prefix = state.activeBrand === 'TERVE' ? 'T' : 'A';
  const queueNo = `${prefix}-${String(lastQueueNum).padStart(3, '0')}`;
  const orderCode = `ORD-${Math.floor(100000 + Math.random() * 900000)}`;

  const subtotal = state.cart.reduce((sum, i) => sum + i.price * i.qty, 0);
  const tax = Math.round(subtotal * 0.11);
  const total = subtotal + tax;

  state.activeOrder = {
    orderCode: orderCode,
    queueNo: queueNo,
    customerName: state.customerName,
    customerPhone: state.customerPhone,
    customerEmail: state.customerEmail,
    notes: state.orderNotes,
    items: [...state.cart],
    totalAmount: total,
    createdAt: new Date().toISOString(),
    status: 'PENDING'
  };

  // Save to sync queue / localStorage so Cashier POS can pull/scan
  saveDraftOrderToStorage(state.activeOrder);

  // Render Barcode Screen
  renderReceiptScreen();
}

function saveDraftOrderToStorage(orderData) {
  const existingDrafts = JSON.parse(localStorage.getItem('pos_customer_drafts') || '[]');
  existingDrafts.unshift(orderData);
  localStorage.setItem('pos_customer_drafts', JSON.stringify(existingDrafts));
}

function renderReceiptScreen() {
  const o = state.activeOrder;
  if (!o) return;

  document.querySelector('.main-container').style.display = 'none';
  document.getElementById('mobileCartBar').style.display = 'none';
  document.getElementById('receiptScreen').style.display = 'block';

  document.getElementById('receiptCustomerName').textContent = o.customerName.toUpperCase();
  document.getElementById('receiptQueueBadgeTop').textContent = o.queueNo;
  document.getElementById('receiptQueueBadgeBig').textContent = o.queueNo;
  document.getElementById('receiptOrderCodeText').textContent = o.orderCode;
  document.getElementById('receiptTotalVal').textContent = `Rp ${o.totalAmount.toLocaleString('id-ID')}`;

  if (o.notes) {
    document.getElementById('receiptNotesLine').style.display = 'block';
    document.getElementById('receiptNotesText').textContent = o.notes;
  } else {
    document.getElementById('receiptNotesLine').style.display = 'none';
  }

  const listElem = document.getElementById('receiptItemsList');
  listElem.innerHTML = o.items.map(item => `
    <div class="receipt-item-row">
      <span>• ${item.qty}x ${item.name}</span>
      <span>Rp ${(item.price * item.qty).toLocaleString('id-ID')}</span>
    </div>
  `).join('');

  // Scroll to top
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

// 9. REAL-TIME STATUS POLLING & AUDIO CHIME (NOMOR 9, 19, 20)
function startStatusPolling() {
  setInterval(() => {
    if (!state.activeOrder) return;

    // Check localStorage for POS cashier status updates
    const existingDrafts = JSON.parse(localStorage.getItem('pos_customer_drafts') || '[]');
    const currentInStorage = existingDrafts.find(d => d.orderCode === state.activeOrder.orderCode);

    if (currentInStorage && currentInStorage.status !== state.activeOrder.status) {
      const prevStatus = state.activeOrder.status;
      state.activeOrder.status = currentInStorage.status;

      updateStatusUI(state.activeOrder.status);

      // Trigger Chime & Vibration on Status READY or COMPLETED
      if (currentInStorage.status === 'READY' || currentInStorage.status === 'COMPLETED') {
        playChimeSound();
        if (navigator.vibrate) navigator.vibrate([200, 100, 200]);

        if (currentInStorage.status === 'COMPLETED') {
          setTimeout(() => {
            openRatingModal();
          }, 1500);
        }
      }
    }
  }, 2000);
}

function updateStatusUI(status) {
  const p = document.getElementById('stepPending');
  const pr = document.getElementById('stepProgress');
  const r = document.getElementById('stepReady');
  const l1 = document.getElementById('line1');
  const l2 = document.getElementById('line2');

  p.classList.remove('active');
  pr.classList.remove('active');
  r.classList.remove('active');
  l1.classList.remove('active');
  l2.classList.remove('active');

  if (status === 'PENDING') {
    p.classList.add('active');
  } else if (status === 'IN_PROGRESS') {
    p.classList.add('active');
    l1.classList.add('active');
    pr.classList.add('active');
  } else if (status === 'READY' || status === 'COMPLETED') {
    p.classList.add('active');
    l1.classList.add('active');
    pr.classList.add('active');
    l2.classList.add('active');
    r.classList.add('active');
  }
}

function playChimeSound() {
  try {
    const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(587.33, audioCtx.currentTime); // D5
    osc.frequency.setValueAtTime(880, audioCtx.currentTime + 0.15); // A5

    gain.gain.setValueAtTime(0.3, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.5);

    osc.connect(gain);
    gain.connect(audioCtx.destination);

    osc.start();
    osc.stop(audioCtx.currentTime + 0.5);
  } catch (e) {}
}

// 10. SAVE / DOWNLOAD E-RECEIPT BARCODE IMAGE (NOMOR 14)
function saveReceiptImage() {
  const canvas = document.getElementById('screenshotCanvas');
  const ctx = canvas.getContext('2d');

  canvas.width = 400;
  canvas.height = 420;

  // Background
  ctx.fillStyle = state.activeBrand === 'TERVE' ? '#FDF8F5' : '#FFFBEA';
  ctx.fillRect(0, 0, 400, 420);

  // Border
  ctx.lineWidth = 4;
  ctx.strokeStyle = '#000000';
  ctx.strokeRect(2, 2, 396, 416);

  // Text Header
  ctx.fillStyle = '#666666';
  ctx.font = 'bold 12px Inter';
  ctx.textAlign = 'center';
  ctx.fillText('BARCODE DRAF PESANAN UNTUK KASIR', 200, 35);

  // Big Queue Number
  ctx.fillStyle = '#000000';
  ctx.font = '900 48px Inter';
  ctx.fillText(state.activeOrder.queueNo, 200, 95);

  // Customer Name & Total
  ctx.fillStyle = '#000000';
  ctx.font = 'bold 14px Inter';
  ctx.fillText(`PEMESAN: ${state.activeOrder.customerName.toUpperCase()}`, 200, 130);
  ctx.fillText(`TOTAL: Rp ${state.activeOrder.totalAmount.toLocaleString('id-ID')}`, 200, 155);

  // Visual Barcode Lines
  ctx.fillStyle = '#FFFFFF';
  ctx.fillRect(40, 180, 320, 140);
  ctx.strokeStyle = '#000000';
  ctx.lineWidth = 2;
  ctx.strokeRect(40, 180, 320, 140);

  ctx.fillStyle = '#000000';
  ctx.font = '36px "Libre Barcode 128", monospace';
  ctx.fillText('║▌║█║▌│║▌║▌█║▌', 200, 250);

  ctx.font = '900 16px Inter';
  ctx.fillText(state.activeOrder.orderCode, 200, 290);

  ctx.font = '10px Inter';
  ctx.fillStyle = '#555555';
  ctx.fillText('Tunjukkan barcode ini ke kasir untuk di-scan', 200, 380);

  // Download Trigger
  const link = document.createElement('a');
  link.download = `Draf-Pesanan-${state.activeOrder.orderCode}.png`;
  link.href = canvas.toDataURL('image/png');
  link.click();
}

function resetToNewOrder() {
  state.cart = [];
  state.activeOrder = null;
  state.orderNotes = '';
  state.customerName = '';
  state.customerPhone = '';
  state.customerEmail = '';

  // 1. Hide receipt screen and show main container (Menu Utama)
  const receipt = document.getElementById('receiptScreen');
  if (receipt) receipt.style.display = 'none';

  const mainContainer = document.querySelector('.main-container');
  if (mainContainer) mainContainer.style.display = 'flex';

  // 2. Force hide cart section completely so user lands on Menu Utama grid
  const section = document.getElementById('cartSection');
  if (section) {
    section.classList.remove('mobile-open');
    section.style.setProperty('display', 'none', 'important');
  }
  document.body.classList.remove('mobile-cart-active');

  // 3. Trigger Welcome Modal for entering customer name on new order
  checkStoredCustomerName();

  renderCategoryChips();
  renderMenuGrid();
  renderCart();

  // Scroll to top of catalog
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

// 11. RATING & FEEDBACK MODAL (NOMOR 16)
function openRatingModal() {
  document.getElementById('ratingModal').style.display = 'flex';
}

function closeRatingModal() {
  document.getElementById('ratingModal').style.display = 'none';
}

function setRating(stars) {
  state.userRating = stars;
  const starElems = document.getElementById('starRatingRow').children;
  for (let i = 0; i < 5; i++) {
    if (i < stars) starElems[i].classList.add('active');
    else starElems[i].classList.remove('active');
  }
}

function submitRating() {
  if (state.userRating === 0) {
    alert('Mohon pilih jumlah bintang rating!');
    return;
  }
  alert('Terima kasih atas ulasan dan ulasan bintang ' + state.userRating + ' Anda! 🙏✨');
  closeRatingModal();
}

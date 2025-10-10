export default {
  brand: { 
    name: 'Velora shoes', 
    tagline: 'Internet do\'koni',
    description: 'Sifatli va zamonaviy oyoq kiyimlar. Har bir qadamda qulaylik va stil.'
  },
  home: {
    heroLine1: 'Har bir qadamda',
    heroLine2: 'Qulaylik va Stil',
    heroSubtitle: 'Zamonaviy va sifatli oyoq kiyimlar to\'plamini kashf eting',
    heroSubtitleAlt: 'Eng mashhur to\'plamimizdan tanlang',
    viewCatalog: 'Katalogni ko\'rish',
    myOrders: 'Buyurtmalarim',
    categories: 'Kategoriyalar',
    popularProducts: 'Mashhur mahsulotlar',
    popularProductsSubtitle: 'Xaridorlarimiz ko\'proq tanlaydigan modellarni ko\'ring',
    viewAllProducts: 'Barcha mahsulotlarni ko\'rish',
    whyChooseUs: 'Nima uchun bizni tanlaydilar',
    features: {
      quality: { title: 'Sifat', description: 'Faqat tekshirilgan materiallar va ishlab chiqarish nazorati' },
      delivery: { title: 'Yetkazib berish', description: 'Tez va ishonchli yetkazib berish O\'zbekiston bo\'ylab' },
      support: { title: 'Qo\'llab-quvvatlash', description: 'Savollaringizga tezkor javob beramiz' },
      customers: { title: 'Mamnun mijozlar', description: 'Minglab xaridorlar bizga ishonadi' }
    },
    ctaTitle: 'Bugun yangi qadam tashlang',
    ctaSubtitle: 'Qulaylik va stil birlashadigan to\'plamni tanlang',
    ctaStartShopping: 'Xarid qilishni boshlash'
  },
  common: {
    home: 'Bosh sahifa',
    catalog: 'Katalog',
    adminPanel: 'Admin panel',
    profile: 'Profil',
    logout: 'Chiqish',
    cancel: 'Bekor qilish',
    confirm: 'Tasdiqlash',
    delete: 'O\'chirish',
    deleteQuestion: 'Ushbu mahsulotni o\'chirasizmi?',
    save: 'Saqlash',
    edit: 'Tahrirlash',
    cart: 'Savat',
    items: 'dona',
    yes: 'Ha',
    back: 'Orqaga',
    returnToCatalog: 'Katalogga qaytish',
    imageUnavailable: 'Rasm mavjud emas',
    previousImage: 'Oldingi rasm',
    nextImage: 'Keyingi rasm',
    showImage: 'Rasmni ko\'rsatish {index}',
    currencySom: 'so\'m',
  },
  auth: {
    login: 'Hisobga kirish',
    register: 'Hisob yaratish',
    name: 'Foydalanuvchi nomi',
    password: 'Parol',
    passwordPlaceholder: 'Kamida 8 ta belgi',
    confirmPassword: 'Parolni tasdiqlash',
    forgotPassword: 'Parolni unutdingizmi?',
    logoutConfirmTitle: 'Hisobdan chiqishni xohlaysizmi?',
    logoutConfirmMessage: 'Seansni tugatishga ishonchingiz komilmi?',
    logoutConfirmButton: 'Chiqish',
    namePlaceholder: 'Ismingizni kiriting',
    passwordInputPlaceholder: 'Parolni kiriting',
    confirmPasswordPlaceholder: 'Parolni takrorlang',
    phone: 'Telefon raqami',
    phonePlaceholder: '+998 90 123 45 67',
    orCreate: 'Yoki yangi hisob yarating',
    orLogin: 'Yoki mavjud hisobga kiring',
    loginProgress: 'Kirish...',
    registerProgress: 'Ro\'yxatdan o\'tish...',
    showPassword: 'Parolni ko\'rsatish',
    hidePassword: 'Parolni yashirish',
    toasts: {
      loginSuccess: 'Tizimga muvaffaqiyatli kirildi!',
      loginInvalid: 'Noto\'g\'ri login yoki parol',
      registrationSuccess: 'Ro\'yxatdan o\'tish muvaffaqiyatli!',
      logoutSuccess: 'Tizimdan chiqdingiz',
      passwordChangeSuccess: 'Parol muvaffaqiyatli o\'zgartirildi',
      userFoundEnterNewPassword: 'Foydalanuvchi topildi. Yangi parolni kiriting'
    },
    errors: {
      invalidServerResponse: 'Avtorizatsiya xatosi: noto\'g\'ri server javobi',
      passwordChangeFailed: 'Parolni o\'zgartirib bo\'lmadi',
      userSearchFailed: 'Foydalanuvchini qidirish xatosi',
      registrationFailed: 'Ro\'yxatdan o\'tish xatosi',
      existingPhone: 'Ushbu telefon raqami bilan foydalanuvchi allaqachon mavjud'
    },
    validation: {
      nameRequired: 'Ism majburiy',
      passwordMin: 'Parol kamida 8 ta belgidan iborat bo\'lishi kerak',
      surnameRequired: 'Familiya majburiy',
      phoneRequired: 'Telefon raqami majburiy',
      phoneFormat: 'Telefon raqami + bilan boshlanishi va 10-15 ta raqamdan iborat bo\'lishi kerak',
      confirmPasswordMin: 'Parolni tasdiqlash majburiy (kamida 8 ta belgi)',
      passwordsMismatch: 'Parollar mos kelmaydi'
    },
    forgot: {
      title: 'Parolni tiklash',
      instructions: 'Foydalanuvchi nomini va yangi parolni kiriting',
      newPassword: 'Yangi parol',
      confirmNewPassword: 'Parolni tasdiqlash',
      submit: 'Parolni o\'zgartirish',
      saving: 'Saqlash...',
      backToLogin: 'Kirishga qaytish'
    }
  },
  product: {
    size: 'O\'lcham',
    price: 'Narx',
    quantity: 'Miqdori',
    available: 'Mavjud',
    notAvailable: 'Mavjud emas',
    category: 'Kategoriya',
    addToCart: 'Savatga qo\'shish',
    description: 'Mahsulot tavsifi',
    quantityLabel: 'Miqdori',
    availableQuantity: 'Mavjud: {count}',
    insufficientStock: 'Mahsulot yetarli emas',
    insufficientForOrder: 'buyurtma uchun yetarli emas',
    insufficientStockTooltip: 'Mahsulot yetarli emas (minimum {min})',
    minimumOrderWarning: 'Minimal buyurtma {min}. Faqat {available} mavjud.'
  },
  productDetail: {
    notFound: 'Mahsulot topilmadi',
    imageGallery: 'Mahsulot rasmlari galereyasi ({count})',
    temporarilyOutOfStock: 'Mahsulot vaqtincha mavjud emas',
    thumbnail: 'Kichik rasm {index}'
  },
  cartPage: {
    emptyTitle: 'Savatingiz bo\'sh',
    emptySubtitle: 'Xaridni boshlash uchun katalogdan mahsulotlar qo\'shing',
    continueShopping: 'Xaridga o\'tish',
    continue: 'Xaridni davom ettirish',
    heading: 'Savat',
    itemsCount: '{count} ta mahsulot',
    clear: 'Savatni tozalash',
    orderSummary: 'Buyurtma jami',
    productsLine: 'Mahsulotlar ({count} dona)',
    total: 'Jami summa',
    emptyCart: 'Savat bo\'sh',
    checkout: 'Buyurtma berish',
    loginForCheckout: 'Tizimga kiring',
    loginForCheckoutSuffix: 'buyurtma berish uchun',
    processingBatch: 'Paket {current} / {total} qayta ishlanmoqda...',
    batchProcessingStart: 'Katta buyurtma qayta ishlanmoqda ({total} qism)...',
    batchProcessingFallback: 'Buyurtma qayta qayta ishlanmoqda ({total} qism)...',
    batchProcessingSuccess: 'Muvaffaqiyatli buyurtma',
    largeOrderNotice: {
      title: 'Katta buyurtma',
      message: 'Buyurtmangizda {total} ta mahsulot bor. U optimal ishlash uchun qismlarga ajratiladi.',
      extraLargeMessage: 'Juda katta buyurtma. Qayta ishlash bir necha daqiqa davom etishi mumkin.'
    },
    size: 'O\'lcham',
    color: 'Rang'
  },
  offer: {
    title: 'Ommaviy oferta',
    mustAccept: 'To\'lovga o\'tish uchun ommaviy oferta shartlarini qabul qilishingiz kerak.',
    acceptLabel: 'Men ommaviy oferta shartlari bilan tanishdim va qabul qilaman',
    viewLink: 'Ofertani ko\'rish'
  },
  cart: {
    inCart: 'Savatda',
    addToCart: 'Savatga',
    addMore: 'Yana qo\'shish',
    alreadyInCartAddMore: 'Mahsulot allaqachon savatda. Yana qo\'shish uchun bosing',
    addToCartHint: 'Savatga (minimum 60, qadam 6)',
    added: '{name}: +{qty} birlik qo\'shildi',
    removed: '{name}: o\'chirildi',
    cleared: 'Savat tozalandi',
    outOfStock: '{name} - mavjud emas',
    insufficientStock: '{name} - yetarli miqdor yo\'q (mavjud: {available})',
    limitedStock: '{name} - faqat {qty} qo\'shildi (mavjud: {available})',
    emptyCart: 'Savat bo\'sh'
  },
  payment: {
    processing: 'To\'lov qayta ishlanmoqda...',
    creatingOrder: 'Buyurtma yaratilmoqda...',
    processingLargeOrder: 'Katta buyurtma qayta ishlanmoqda...',
    creatingPayment: 'To\'lov yaratilmoqda...',
    redirecting: 'To\'lovga o\'tish...',
    checking: 'To\'lov holati tekshirilmoqda',
    pleaseWait: 'Iltimos, kuting',
    orderId: 'Buyurtma raqami',
    amount: 'Summa',
    status: 'Holat',
    orderDescription: '{customerName} uchun {itemCount} ta mahsulotdan iborat buyurtma',
    batchOrderDescription: '{customerName} uchun paket buyurtma ({itemCount} ta mahsulot, {batchCount} qism)',
    success: {
      title: 'To\'lov muvaffaqiyatli amalga oshirildi',
      message: 'To\'lovingiz muvaffaqiyatli qayta ishlandi. Xaridingiz uchun rahmat!'
    },
    pending: {
      title: 'To\'lov qayta ishlanmoqda',
      message: 'To\'lovingiz qayta ishlanmoqda. Natija haqida sizga xabar beramiz.'
    },
    failure: {
      title: 'To\'lov amalga oshmadi',
      message: 'Afsuski, to\'lovingizni qayta ishlab bo\'lmadi. Iltimos, qayta urinib ko\'ring.',
      retry: 'Qayta urinish'
    },
    error: {
      title: 'To\'lov xatosi',
      failed: 'To\'lov amalga oshmadi',
      statusCheck: 'To\'lov holatini tekshirib bo\'lmadi',
      initiation: 'To\'lovni boshlash amalga oshmadi'
    },
    continueShopping: 'Xaridni davom ettirish',
    viewOrders: 'Buyurtmalarni ko\'rish',
    orderCreated: 'Buyurtma muvaffaqiyatli yaratildi!',
    orderCreateError: 'Buyurtma yaratishda xatolik',
    noCancellationNotice: 'Diqqat! Muvaffaqiyatli to\'lovdan keyin buyurtmani bekor qilish yoki pulni qaytarish mumkin emas.'
  },
  ordersPage: {
    title: 'Mening buyurtmalarim',
    subtitle: 'Buyurtmalaringiz holati va xaridlar tarixini kuzating',
    historyUnavailable: 'Buyurtmalar tarixi mavjud emas',
    authRequiredTitle: 'Avtorizatsiya talab qilinadi',
    authRequiredMessage: 'Buyurtmalaringizni ko\'rish uchun tizimga kiring',
    notFound: 'Buyurtmalar topilmadi',
    noneYet: 'Sizda hali buyurtmalar yo\'q',
    tryAdjustSearch: 'Qidiruv shartlarini o\'zgartirib ko\'ring',
    startShopping: 'Katalogimizdan xaridni boshlang',
    resetFilters: 'Filtrlarni tiklash',
    goToCatalog: 'Katalogga o\'tish',
    status: {
      CREATED: 'Yaratildi',
      PENDING: 'Kutilmoqda',
      PAID: 'To\'landi',
      FAILED: 'Xato',
      CANCELLED: 'Bekor qilindi',
      REFUNDED: 'Qaytarildi',
      confirmed: 'Tasdiqlandi',
      pending: 'Kutilmoqda',
      processing: 'Qayta ishlanmoqda',
      shipped: 'Yuborildi',
      delivered: 'Yetkazildi',
      cancelled: 'Bekor qilindi'
    }
  },
  orders: {
    status: {
      created: 'Yaratildi',
      pending: 'Kutilmoqda',
      paid: 'To\'landi',
      failed: 'Xato',
      cancelled: 'Bekor qilindi',
      refunded: 'Qaytarildi',
      confirmed: 'Tasdiqlandi',
      processing: 'Qayta ishlanmoqda',
      shipped: 'Yuborildi',
      delivered: 'Yetkazildi'
    },
    itemCount: '{count} ta mahsulot',
    viewDetails: 'Batafsil',
    refund: {
      request: 'Qaytarish',
      requesting: 'So\'rov yuborilmoqda...',
      requestSuccess: 'Qaytarish so\'rovi yuborildi',
      requestError: 'Qaytarish so\'rovini yuborishda xato',
      confirmTitle: 'Qaytarishni tasdiqlash',
      confirmMessage: 'Ushbu buyurtma uchun qaytarishni so\'ramoqchimisiz?',
      amount: 'Summa',
      orderNumber: 'Buyurtma',
      pendingImplementation: 'Qaytarish tizimi joriy qilinmoqda. Iltimos, qo\'lda qayta ishlash uchun qo\'llab-quvvatlash xizmatiga murojaat qiling.',
      requestReceived: 'Qaytarish so\'rovi qabul qilindi. Siz bilan 24 soat ichida bog\'lanamiz.',
      requestSent: 'Qaytarish so\'rovi administratorga yuborildi. Siz bilan 24 soat ichida bog\'lanamiz.',
      confirmSubtitle: 'Qaytarish so\'rovini qayta ishlash',
      warningTitle: 'Muhim xabarnoma',
      orderDetails: 'Buyurtma tafsilotlari',
      itemCount: 'Mahsulotlar',
      refundAmount: 'Qaytarish summasi',
      processingNotice: 'Qaytarish 24-48 soat ichida qayta ishlanadi',
      confirmButton: 'Qaytarishni tasdiqlash',
      contactModal: {
        title: 'Pulni qaytarish',
        message: 'Agar pulni qaytarishni istasangiz, administrator bilan bog\'laning',
        contactInfo: 'Aloqa ma\'lumotlari:',
        phone: 'Telefon:',
        telegram: 'Telegram:',
        closeButton: 'Yopish'
      }
    },
    modal: {
      title: 'Buyurtma №{id}',
      client: 'Mijoz',
      status: 'Holat',
      shippingAddress: 'Yetkazib berish manzili',
      items: 'Mahsulotlar',
      quantity: 'Miqdori',
      price: 'Narx',
      size: 'O\'lcham',
      notes: 'Izoh',
      total: 'Jami'
    }
  },
  profilePage: {
    title: 'Mening profilim',
    roleAdmin: 'Administrator',
    roleUser: 'Foydalanuvchi',
    basicInfo: 'Asosiy ma\'lumot',
    phoneNumber: 'Telefon raqami',
    passwordChangeOptional: 'Parolni o\'zgartirish (ixtiyoriy)',
    currentPassword: 'Joriy parol',
    newPassword: 'Yangi parol',
    newPasswordPlaceholder: 'O\'zgartirmoqchi bo\'lmasangiz bo\'sh qoldiring',
    confirmNewPassword: 'Yangi parolni tasdiqlash',
    confirmNewPasswordPlaceholder: 'Yangi parolni takrorlang',
    updating: 'Saqlash...',
    toasts: {
      updateSuccess: 'Profil muvaffaqiyatli yangilandi!',
      updateError: 'Profilni yangilashda xato'
    },
    validation: {
      currentPasswordRequired: 'Parolni o\'zgartirish uchun joriy parol majburiy',
      newPasswordMin: 'Yangi parol kamida 8 ta belgidan iborat bo\'lishi kerak',
      allPasswordFieldsRequired: 'Parolni o\'zgartirish uchun barcha parol maydonlarini to\'ldiring'
    }
  },
  catalog: {
    title: 'Mahsulotlar kataloqi',
    subtitle: 'Sifatli uy ichki oyoq kiyimlar to\'plamimizdan ideal shippakni toping',
    pageStatus: 'Sahifa {page} / {totalPages}',
    notFoundTitle: 'Mahsulotlar topilmadi',
    notFoundSubtitle: 'Qidiruv parametrlari yoki filtrlarni o\'zgartirib ko\'ring'
  },
  errors: {
    serverUnavailable: 'Server vaqtincha mavjud emas',
    serverUnavailableLong: 'Server vaqtincha mavjud emas. Keyinroq urinib ko\'ring.',
    serverUnavailableRetry: 'Server vaqtincha mavjud emas. Bir necha daqiqadan keyin sahifani yangilashga harakat qiling.',
    categoriesLoad: 'Kategoriyalarni yuklashda xato',
    badGateway: 'Server shlyuz xatosi',
    badGatewayLong: 'Serverga ulanishda xato. Keyinroq urinib ko\'ring.',
    serverError: 'Server xatosi',
    serverErrorLong: 'Server xatosi. Keyinroq urinib ko\'ring.',
    tooManyRequests: 'Juda ko\'p so\'rovlar',
    tooManyRequestsLong: 'Juda ko\'p so\'rovlar. Biroz kuting va qayta urinib ko\'ring.',
    productsLoad: 'Mahsulotlarni yuklashda xato'
  },
  footer: {
    quickLinks: 'Tezkor havolalar',
    support: 'Qo\'llab-quvvatlash',
    about: 'Biz haqimizda',
    contact: 'Aloqa',
    help: 'Yordam',
    shipping: 'Yetkazib berish',
    returns: 'Qaytarish',
    privacy: 'Maxfiylik',
    rights: 'Barcha huquqlar himoyalangan.',
    followUs: 'Bizni kuzating',
    contactUs: 'Biz bilan bog\'laning',
    paymentMethods: 'To\'lov usullari'
  },
  offerPage: {
    title: 'Ommaviy oferta',
    updated: 'Yangilandi: 23.09.2025',
    intro1: 'Ushbu ommaviy oferta (keyingi o\'rinlarda - "Oferta") Velora shoes (keyingi o\'rinlarda - "Sotuvchi") tomonidan har qanday jismoniy shaxsga (keyingi o\'rinlarda - "Xaridor") quyida keltirilgan shartlarda mahsulotlar sotish / xizmatlar ko\'rsatish shartnomasi tuzishning rasmiy taklifdir.',
    intro2: 'Buyurtma berish va uni to\'lash Xaridorning ushbu Oferta shartlariga roziligini bildiradi.',
    sections: {
      orderPayment: {
        title: '1. Buyurtma berish va to\'lov usullari',
        li1: 'Buyurtmalar sayt orqali qabul qilinadi: https://www.optomoyoqkiyim.uz/',
        li2: 'To\'lov mumkin: bank kartasi orqali (UZCARD, HUMO, Visa, MasterCard) himoyalangan to\'lov xizmati orqali; saytda ko\'rsatilgan boshqa to\'lov usullari orqali.',
        li3: 'Barcha hisob-kitoblar O\'zbekiston Respublikasi so\'mida amalga oshiriladi.'
      },
      returns: {
        title: '2. Mahsulotni qaytarish, xizmatdan voz kechish va pulni qaytarish shartlari',
        li1: 'Xaridor O\'zbekiston Respublikasi qonunchiligida belgilangan muddat va tartibda mahsulot yoki xizmatdan voz kechish huquqiga ega.',
        li2: 'Mahsulot/xizmatdan voz kechganda pulni qaytarish to\'lov amalga oshirilgan usul bilan amalga oshiriladi.',
        li3: 'Pulni qaytarish muddati odatda 7 ish kunigacha, ammo ayrim hollarda bank va to\'lov tizimlarining ishiga qarab 30 ish kunigacha uzayishi mumkin.',
        li4: 'Bank kartasi orqali operatsiyani bekor qilish milliy va xalqaro to\'lov tizimlari qoidalariga muvofiq amalga oshiriladi.'
      },
      delivery: {
        title: '3. Mahsulotlarni yetkazib berish / xizmatlarni ko\'rsatish shartlari',
        li1: 'Toshkent shahri bo\'ylab mahsulotlar yetkazib berish bepul amalga oshiriladi.',
        li2: 'O\'zbekiston Respublikasining boshqa shaharlariga yetkazib berish shartnoma asosida amalga oshiriladi.',
        li3: 'Qozog\'iston, Qirg\'iziston va Tojikistonga yetkazib berish ham shartnoma asosida amalga oshiriladi.'
      },
      security: {
        title: '4. Operatsiyalar xavfsizligi',
        li1: 'Bank kartalari orqali to\'lov zamonaviy himoya usullaridan foydalanadigan himoyalangan to\'lov shlyuzi orqali amalga oshiriladi.',
        li2: 'Bank kartasi ma\'lumotlari faqat to\'lov xizmati tomonidan qayta ishlanadi va Sotuvchiga uzatilmaydi.',
        li3: 'Sotuvchi mijozlarning shaxsiy ma\'lumotlari himoyalanganligini va faqat shartnomani bajarish maqsadlarida foydalanilishini kafolatlaydi.'
      },
      privacy: {
        title: '5. Maxfiylik siyosati',
        li1: 'Xaridorning shaxsiy ma\'lumotlari 2019 yil 2 iyuldagi "Shaxsiy ma\'lumotlar to\'g\'risida"gi O\'zbekiston Respublikasi Qonuniga muvofiq qayta ishlanadi.',
        li2: 'Sotuvchi shaxsiy ma\'lumotlarni faqat Xaridor oldidagi o\'z majburiyatlarini bajarish uchun to\'playdi va foydalanadi.',
        li3: 'Sotuvchi Xaridorning shaxsiy ma\'lumotlarini uning roziligi b olan uchinchi shaxslarga oshkor qilmaslikka majburdir, O\'zbekiston Respublikasi qonunchiligi tomonidan nazarda tutilgan hollar bundan mustasno.',
        li4: 'Xaridor ko\'rsatilgan elektron pochta yoki telefonga axborot xabarlari (buyurtma haqida xabarnomalar, aksiyalar va h.k.) olishga roziligi bildiradi.'
      },
      seller: {
        title: '6. Sotuvchi rekvizitlari',
        name: 'Velora shoes',
        inn: 'STIR: 552430231',
        legalAddress: 'Yuridik manzil: Toshkent vil, Eshonguzar, X. Nigmon ko\'chasi',
        actualAddress: 'Haqiqiy manzil: Toshkent vil, Eshonguzar, X. Nigmon ko\'chasi',
        phone: 'Telefon: +998 95 021 02 07',
        email: 'E-mail: elbek1987101@icloud.com'
      }
    },
    notice: 'Buyurtmani rasmiylashtirish va to\'lovga o\'tishda davom etib, siz ushbu ommaviy oferta shartlari bilan tanishganingizni va qabul qilganingizni tasdiqlaysiz.'
  },
  admin: {
    nav: {
      home: 'Bosh sahifa',
      users: 'Foydalanuvchilar',
      products: 'Mahsulotlar',
      orders: 'Buyurtmalar'
    },
    header: {
      backToSite: 'Saytga',
      title: 'Boshqaruv paneli',
      welcome: 'Xush kelibsiz, {name}'
    },
    common: {
      close: 'Yopish',
      unspecified: 'Ko\'rsatilmagan',
      toggleAvailability: 'Mavjudligini almashtirish'
    },
    products: {
      title: 'Mahsulotlarni boshqarish',
      subtitle: 'Katalogdagi mahsulotlarni ko\'rish va boshqarish',
      add: 'Mahsulot qo\'shish',
      table: {
        product: 'Mahsulot',
        price: 'Narx',
        size: 'O\'lchamlar',
        status: 'Holat',
        actions: 'Amallar'
      },
      pagination: {
        shown: '{total} dan {count} ta ko\'rsatilmoqda'
      },
      empty: {
        title: 'Mahsulotlar topilmadi',
        subtitle: 'Qidiruv parametrlarini o\'zgartirib ko\'ring yoki yangi mahsulot qo\'shing'
      },
      status: {
        active: 'Faol',
        inactive: 'Nofaol'
      },
      dialogs: {
        deleteTitle: 'Mahsulotni o\'chirish: {name}?',
        deleteMessage: '"{name}" mahsulotini o\'chirishga ishonchingiz komilmi? Bu amalni bekor qilib bo\'lmaydi.'
      },
      deleteConfirm: {
        title: 'Mahsulotni o\'chirish',
        message: 'Ushbu mahsulotni o\'chirishga ishonchingiz komilmi? Bu amalni bekor qilib bo\'lmaydi.',
        confirm: 'O\'chirish'
      },
      form: {
        createTitle: 'Mahsulot yaratish',
        editTitle: 'Mahsulotni tahrirlash',
        fields: {
          name: 'Nomi',
          namePlaceholder: 'Nomini kiriting',
          price: 'Narx',
          quantity: 'Miqdori',
          size: 'O\'lchamlar',
          sizePlaceholder: 'Masalan 36-40',
          active: 'Faol mahsulot'
        },
        buttons: {
          saving: 'Saqlash...',
          update: 'Yangilash',
          create: 'Yaratish'
        }
      },
      images: {
        section: 'Rasmlar (ixtiyoriy)',
        single: 'Bitta rasm',
        multiple: 'Bir nechta rasm',
        recommendation: 'Tavsiya: 2MB gacha bo\'lgan rasmlar. Katta fayllar avtomatik siqiladi.',
        selectedFiles: 'Tanlangan fayllar: {count}',
        uploading: 'Rasmlar yuklanmoqda...',
        willUploadAfterCreate: 'Rasmlar mahsulot yaratilgandan keyin yuklanadi.',
        current: 'Joriy rasmlar',
        loading: 'Yuklanmoqda...',
        none: 'Saqlangan rasmlar yo\'q',
        primaryBadge: 'Asosiy',
        removeImageAria: 'Rasmni o\'chirish',
        addingHint: 'Yuqoridagi yangi fayllar qo\'shiladi - almashtirish uchun ortiqcha fayllarni o\'chirib, yangisini yuklang.',
        progress: '{current} / {total}',
        deleteConfirmTitle: 'Rasmni o\'chirish',
        deleteConfirmMessage: 'Ushbu rasmni o\'chirish?',
        deleteSuccess: 'Rasm o\'chirildi',
        deleteError: 'Rasmni o\'chirishda xato',
        uploadSingleSuccess: 'Rasm yuklandi ({field})',
        uploadAllSuccess: 'Barcha rasmlar yuklandi',
        uploadError: 'Rasmlarni yuklashda xato'
      },
      toasts: {
        loadError: 'Mahsulotlarni yuklashda xato',
        deleteSuccess: 'Mahsulot muvaffaqiyatli o\'chirildi',
        deleteAlreadyRemoved: 'Mahsulot allaqachon o\'chirilgan',
        deleteError: 'Mahsulotni o\'chirishda xato',
        saveError: 'Mahsulotni saqlashda xato',
        updateSuccess: 'Mahsulot yangilandi',
        createSuccess: 'Mahsulot yaratildi',
        statusUpdateSuccess: 'Mahsulot holati yangilandi',
        statusUpdateError: 'Holatni yangilashda xato'
      }
    },
    users: {
      title: 'Foydalanuvchilarni boshqarish',
      subtitle: 'Tizim foydalanuvchilarini ko\'rish va boshqarish',
      table: {
        user: 'Foydalanuvchi',
        phone: 'Telefon',
        role: 'Rol',
        registeredAt: 'Ro\'yxatdan o\'tgan sana'
      },
      empty: {
        title: 'Foydalanuvchilar topilmadi',
        subtitle: 'Qidiruv parametrlari yoki filtrlarni o\'zgartirib ko\'ring'
      },
      toasts: { loadError: 'Foydalanuvchilarni yuklashda xato' },
      role: { admin: 'Administrator', user: 'Foydalanuvchi' },
      dateNA: 'N/A'
    },
    orders: {
      title: 'Buyurtmalarni boshqarish',
      subtitle: 'Mijozlar buyurtmalarini ko\'rish va boshqarish',
      info: { orders: 'Buyurtmalar: {total}', page: 'Sahifa {page} / {pages}' },
      table: {
        order: 'Buyurtma',
        client: 'Mijoz',
        phone: 'Telefon',
        items: 'Mahsulotlar',
        amount: 'Summa',
        status: 'Holat',
        date: 'Sana',
        actions: 'Amallar'
      },
      createdAt: 'yaratilgan sana',
      actions: {
        refund: 'Qaytarish',
        refundRequest: 'Qaytarishni so\'rash',
        adminRefund: 'Pulni qaytarish'
      },
      refund: {
        request: 'Qaytarish',
        requesting: 'So\'rov yuborilmoqda...',
        requestSuccess: 'Qaytarish so\'rovi yuborildi',
        requestError: 'Qaytarish so\'rovini yuborishda xato',
        confirmTitle: 'Qaytarishni tasdiqlash',
        confirmMessage: 'Ushbu buyurtma uchun qaytarishni so\'ramoqchimisiz?',
        amount: 'Summa',
        orderNumber: 'Buyurtma',
        pendingImplementation: 'Qaytarish tizimi joriy qilinmoqda. Iltimos, qo\'lda qayta ishlash uchun qo\'llab-quvvatlash xizmatiga murojaat qiling.',
        requestReceived: 'Qaytarish so\'rovi qabul qilindi. Siz bilan 24 soat ichida bog\'lanamiz.',
        requestSent: 'Qaytarish so\'rovi administratorga yuborildi. Siz bilan 24 soat ichida bog\'lanamiz.',
        confirmSubtitle: 'Qaytarish so\'rovini qayta ishlash',
        warningTitle: 'Muhim xabarnoma',
        orderDetails: 'Buyurtma tafsilotlari',
        itemCount: 'Mahsulotlar',
        refundAmount: 'Qaytarish summasi',
        processingNotice: 'Qaytarish 24-48 soat ichida qayta ishlanadi',
        confirmButton: 'Qaytarishni tasdiqlash'
      },
      itemsCount: '{count} ta mahsulot',
      empty: {
        title: 'Buyurtmalar topilmadi',
        subtitle: 'Qidiruv parametrlarini o\'zgartirib ko\'ring'
      },
      status: {
        pending: 'Kutilmoqda',
        processing: 'Qayta ishlanmoqda',
        shipped: 'Yuborildi',
        delivered: 'Yetkazildi',
        cancelled: 'Bekor qilindi',
        confirmed: 'Tasdiqlandi',
        created: 'Yaratildi',
        paid: 'To\'landi',
        failed: 'Muvaffaqiyatsiz',
        refunded: 'Qaytarildi',
        PENDING: 'Kutilmoqda',
        PROCESSING: 'Qayta ishlanmoqda',
        SHIPPED: 'Yuborildi',
        DELIVERED: 'Yetkazildi',
        CANCELLED: 'Bekor qilindi',
        CONFIRMED: 'Tasdiqlandi',
        CREATED: 'Yaratildi',
        PAID: 'To\'landi',
        FAILED: 'Muvaffaqiyatsiz',
        REFUNDED: 'Qaytarildi'
      },
      toasts: {
        loadError: 'Buyurtmalarni yuklashda xato',
        statusUpdateSuccess: 'Buyurtma holati yangilandi',
        statusUpdateError: 'Holatni yangilashda xato',
        refundSuccess: 'Pul muvaffaqiyatli qaytarildi',
        refundError: 'Pulni qaytarishda xato',
        refundNotAllowed: 'Faqat tasdiqlangan buyurtmalar bo\'yicha pulni qaytarish mumkin'
      },
      refundConfirm: {
        title: 'Pulni qaytarishni tasdiqlash',
        message: 'Ushbu buyurtma uchun pulni qaytarishga ishonchingiz komilmi?',
        amount: 'Qaytarish summasi',
        paymentId: 'To\'lov ID',
        confirm: 'Qaytarishni tasdiqlash',
        cancel: 'Bekor qilish',
        successTitle: 'Qaytarish amalga oshirildi!',
        successMessage: '{amount} summa muvaffaqiyatli qaytarildi!',
        processingMessage: '#{orderId} buyurtma bo\'yicha qaytarish to\'lov tizimi tomonidan qayta ishlanmoqda.',
        refundInfo: 'Buyurtmaning to\'liq summasi #{orderId} buyurtma ID orqali qaytariladi',
        close: 'Yopish',
        processing: 'Qayta ishlanmoqda...',
        orderIdLabel: 'Buyurtma ID:',
        customerLabel: 'Mijoz:',
        originalAmountLabel: 'Asl summa:',
        statusLabel: 'Holat:'
      },
      unspecifiedUser: 'Ko\'rsatilmagan'
    },
    refunds: {
      title: 'Qaytarish so\'rovlari',
      subtitle: 'Pulni qaytarish so\'rovlarini qayta ishlash',
      table: {
        request: 'So\'rov',
        order: 'Buyurtma',
        user: 'Foydalanuvchi',
        amount: 'Summa',
        reason: 'Sabab',
        status: 'Holat',
        date: 'Sana',
        actions: 'Amallar'
      },
      status: {
        pending: 'Kutilmoqda',
        approved: 'Tasdiqlandi',
        rejected: 'Rad etildi'
      },
      actions: {
        approve: 'Tasdiqlash',
        reject: 'Rad etish',
        processing: 'Qayta ishlanmoqda...'
      },
      confirmDialog: {
        approve: {
          title: 'Qaytarishni tasdiqlashni xohlaysizmi?',
          message: 'Ushbu qaytarish so\'rovini tasdiqlashga ishonchingiz komilmi?'
        },
        reject: {
          title: 'Qaytarishni rad etishni xohlaysizmi?',
          message: 'Ushbu qaytarish so\'rovini rad etishga ishonchingiz komilmi?'
        }
      },
      toasts: {
        loadError: 'Qaytarish so\'rovlarini yuklashda xato',
        approveSuccess: 'Qaytarish tasdiqlandi',
        approveError: 'Qaytarishni tasdiqlashda xato',
        rejectSuccess: 'Qaytarish rad etildi',
        rejectError: 'Qaytarishni rad etishda xato'
      },
      empty: {
        title: 'Qaytarish so\'rovlari topilmadi',
        subtitle: 'Hozircha qaytarish so\'rovlari yo\'q'
      }
    },
    dashboard: {
      title: 'Administrator paneli',
      welcome: 'Internet do\'kon boshqaruv paneliga xush kelibsiz',
      loadError: 'Statistikani yuklashda xato',
      stats: {
        totalUsers: 'Jami foydalanuvchilar',
        totalProducts: 'Jami mahsulotlar',
        totalOrders: 'Jami buyurtmalar'
      },
      quickActions: {
        title: 'Tezkor amallar',
        products: { title: 'Mahsulotlarni boshqarish', subtitle: 'Mahsulotlarni qo\'shish, tahrirlash' },
        orders: { title: 'Buyurtmalarni boshqarish', subtitle: 'Buyurtmalarni ko\'rish va qayta ishlash' },
        users: { title: 'Foydalanuvchilarni boshqarish', subtitle: 'Foydalanuvchilarni ko\'rish' }
      }
    }
  }
} as const;

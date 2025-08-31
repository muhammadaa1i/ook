export default {
  brand: { name: 'Velora shoes', tagline: 'Internet doʻkoni' },
  common: {
    home: 'Bosh sahifa',
    catalog: 'Katalog',
    adminPanel: 'Admin panel',
    profile: 'Profil',
    logout: 'Chiqish',
    cancel: 'Bekor qilish',
    confirm: 'Tasdiqlash',
    delete: 'O‘chirish',
    deleteQuestion: 'Bu mahsulot o‘chirilsinmi?',
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
    showImage: 'Rasm {index} ni ko‘rsatish',
    currencySom: 'soʻm',
  },
  auth: {
    login: 'Akkauntga kirish',
    register: 'Roʻyxatdan oʻtish',
    name: 'Foydalanuvchi nomi',
    password: 'Parol',
    passwordPlaceholder: 'Kamida 8 ta belgi',
    confirmPassword: 'Parolni tasdiqlash',
    forgotPassword: 'Parolni unutdingizmi?',
    logoutConfirmTitle: 'Akkauntdan chiqish?',
    logoutConfirmMessage: 'Sessiyani yakunlamoqchimisiz?',
    logoutConfirmButton: 'Chiqish',
    namePlaceholder: 'Ismingizni kiriting',
    passwordInputPlaceholder: 'Parolni kiriting',
    confirmPasswordPlaceholder: 'Parolni takrorlang',
    phone: 'Telefon raqam',
    phonePlaceholder: '+998 90 123 45 67',
    orCreate: 'Yoki yangi akkaunt yarating',
    orLogin: 'Yoki mavjud akkauntga kiring',
    loginProgress: 'Kirish...',
    registerProgress: 'Roʻyxatdan oʻtish...',
    showPassword: 'Parolni koʻrsatish',
    hidePassword: 'Parolni yashirish',
    toasts: {
      loginSuccess: 'Tizimga muvaffaqiyatli kirdingiz!',
      loginInvalid: 'Login yoki parol noto‘g‘ri',
      registrationSuccess: 'Ro‘yxatdan o‘tish muvaffaqiyatli yakunlandi!',
      logoutSuccess: 'Tizimdan chiqdingiz',
      passwordChangeSuccess: 'Parol muvaffaqiyatli o‘zgartirildi',
      userFoundEnterNewPassword: 'Foydalanuvchi topildi. Yangi parolni kiriting'
    },
    errors: {
      invalidServerResponse: 'Avtorizatsiya xatosi: noto‘g‘ri server javobi',
      passwordChangeFailed: 'Parolni o‘zgartirish amalga oshmadi',
      userSearchFailed: 'Foydalanuvchini qidirishda xato',
      registrationFailed: 'Ro‘yxatdan o‘tishda xato'
    },
    validation: {
      nameRequired: 'Ism majburiy',
      passwordMin: 'Parol kamida 8 ta belgidan iborat bo‘lishi kerak',
      surnameRequired: 'Familiya majburiy',
      phoneRequired: 'Telefon raqam majburiy',
      phoneFormat: 'Telefon + bilan boshlanib 10-15 raqamdan iborat bo‘lishi kerak',
      confirmPasswordMin: 'Parolni tasdiqlash majburiy (kamida 8 ta belgi)',
      passwordsMismatch: 'Parollar mos emas'
    },
    forgot: {
      title: 'Parolni tiklash',
      instructions: 'Foydalanuvchi nomi va yangi parolni kiriting',
      newPassword: 'Yangi parol',
      confirmNewPassword: 'Parolni tasdiqlash',
      submit: 'Parolni almashtirish',
      saving: 'Saqlanmoqda...',
      backToLogin: 'Kirish sahifasiga qaytish'
    }
  },
  product: {
    size: 'Oʻlcham',
    price: 'Narx',
    available: 'Omborda',
    notAvailable: 'Mavjud emas',
    category: 'Kategoriya',
    addToCart: 'Savatga qoʻshish',
    description: 'Mahsulot tavsifi',
    quantityLabel: 'Miqdor',
  availableQuantity: 'Omborda: {count}'
  },
  productDetail: {
    notFound: 'Mahsulot topilmadi',
    imageGallery: 'Mahsulot rasmlari galereyasi ({count})',
    temporarilyOutOfStock: 'Mahsulot vaqtincha mavjud emas',
    thumbnail: 'Miniatura {index}'
  },
  cartPage: {
    emptyTitle: 'Savat bo‘sh',
    emptySubtitle: 'Xaridni boshlash uchun katalogdan mahsulot qo‘shing',
    continueShopping: 'Xarid qilishga qaytish',
    continue: 'Xaridni davom ettirish',
    heading: 'Savat',
    itemsCount: '{count} ta mahsulot',
    clear: 'Savatni tozalash',
    orderSummary: 'Buyurtma yakunlari',
    productsLine: 'Mahsulotlar ({count} dona)',
    total: 'Umumiy summa',
    checkout: 'Buyurtma berish',
    loginForCheckout: 'Tizimga kiring',
    loginForCheckoutSuffix: 'buyurtma berish uchun',
    size: 'O‘lcham',
    color: 'Rang'
  },
  cart: {
    inCart: 'Savatda',
    alreadyInCartAddMore: 'Mahsulot savatda. Yana qo‘shish uchun bosing',
  addToCartHint: 'Savatga qo‘shish (minimum 50, qadam 5)',
  added: '{name}: +{qty}',
  removed: '{name}: olib tashlandi',
  cleared: 'Savat tozalandi'
  },
  ordersPage: {
    title: 'Buyurtmalarim',
    subtitle: 'Buyurtmalaringiz holatini kuzating va xaridlar tarixini ko‘ring',
    historyUnavailable: 'Buyurtmalar tarixi mavjud emas',
    authRequiredTitle: 'Avtorizatsiya kerak',
    authRequiredMessage: 'Buyurtmalarni ko‘rish uchun tizimga kiring',
    notFound: 'Buyurtmalar topilmadi',
    noneYet: 'Hozircha buyurtmalaringiz yo‘q',
    tryAdjustSearch: 'Qidiruv mezonlarini o‘zgartirib ko‘ring',
    startShopping: 'Katalogimizda xaridni boshlang',
    resetFilters: 'Filtrlarni tiklash',
    goToCatalog: 'Katalogga o‘tish'
  },
  profilePage: {
    title: 'Profilim',
    roleAdmin: 'Administrator',
    roleUser: 'Foydalanuvchi',
    basicInfo: 'Asosiy maʼlumotlar',
    phoneNumber: 'Telefon raqam',
    passwordChangeOptional: 'Parolni almashtirish (majburiy emas)',
    currentPassword: 'Joriy parol',
    newPassword: 'Yangi parol',
    newPasswordPlaceholder: 'Oʻzgartirmoqchi boʻlmasangiz bo‘sh qoldiring',
    confirmNewPassword: 'Yangi parolni tasdiqlash',
    confirmNewPasswordPlaceholder: 'Yangi parolni takrorlang',
    updating: 'Saqlanmoqda...',
    toasts: {
      updateSuccess: 'Profil muvaffaqiyatli yangilandi!',
      updateError: 'Profilni yangilashda xato'
    },
    validation: {
      currentPasswordRequired: 'Parolni almashtirish uchun joriy parol talab qilinadi',
      newPasswordMin: 'Yangi parol kamida 8 ta belgidan iborat bo‘lishi kerak'
    }
  },
  catalog: {
    title: 'Mahsulotlar katalogi',
    subtitle: 'Uy sharoitida sifatli va qulay tapochkalar toʻplamimizdan ideal juftni toping',
    pageStatus: 'Sahifa {page} / {totalPages}',
    notFoundTitle: 'Mahsulot topilmadi',
    notFoundSubtitle: 'Qidiruv yoki filtr parametrlarini oʻzgartirib yana urinib koʻring'
  },
  errors: {
    serverUnavailable: 'Server vaqtincha mavjud emas',
    serverUnavailableLong: 'Server vaqtincha mavjud emas. Keyinroq urinib koʻring.',
    serverUnavailableRetry: 'Server vaqtincha mavjud emas. Bir necha daqiqadan soʻng sahifani yangilang.',
    categoriesLoad: 'Kategoriyalarni yuklashda xatolik',
    badGateway: 'Server shlyuzi xatoligi',
    badGatewayLong: 'Serverga ulanishda xato. Keyinroq urinib koʻring.',
    serverError: 'Server xatoligi',
    serverErrorLong: 'Server xatoligi. Keyinroq urinib koʻring.',
    tooManyRequests: 'Juda koʻp soʻrov',
    tooManyRequestsLong: 'Juda koʻp soʻrov yuborildi. Biroz kutib yana urinib koʻring.',
    productsLoad: 'Mahsulotlarni yuklashda xatolik'
  },
  footer: {
    quickLinks: 'Tezkor havolalar',
    support: 'Qoʻllab-quvvatlash',
    about: 'Biz haqimizda',
    contact: 'Aloqa',
    help: 'Yordam',
    shipping: 'Yetkazib berish',
    returns: 'Qaytarish',
    privacy: 'Maxfiylik',
    rights: 'Barcha huquqlar himoyalangan.'
  },
  home: {
    heroLine1: 'Oyoqlaringiz uchun',
    heroLine2: 'Qulaylik',
    heroSubtitle: 'Mukammal qulaylik va uslub uchun yaratilgan oyoq kiyimlar to‘plamini kashf qiling',
    heroSubtitleAlt: 'Sifatli va zamonaviy tapochkalar to‘plamini kashf qiling',
    viewCatalog: 'Katalogni ko‘rish',
    myOrders: 'Buyurtmalarim',
    categories: 'Kategoriyalar',
    popularProducts: 'Ommabop mahsulotlar',
    popularProductsSubtitle: 'Xaridorlarimiz tanlagan eng mashhur tapochka modellari',
    whyChooseUs: 'Nega bizni tanlashadi',
    ctaTitle: 'Mukammal tapochkani topishga tayyormisiz?',
    ctaSubtitle: 'Minglab mamnun xaridorlarga qo‘shiling',
    ctaStartShopping: 'Xaridni boshlash',
    viewAllProducts: 'Barcha mahsulotlarni ko‘rish',
    features: {
      quality: { title: 'Sifat kafolatlangan', description: 'Barcha mahsulotlar qatʼiy sifat nazoratidan oʻtadi' },
      delivery: { title: 'Tez yetkazib berish', description: 'Butun mamlakat boʻylab 1-3 kun ichida yetkazib berish' },
      support: { title: '24/7 yordam', description: 'Jamoamiz istalgan vaqtda yordam berishga tayyor' },
      customers: { title: 'Mamnun mijozlar', description: 'Minglab ijobiy sharhlar' },
      highQuality: { title: 'Yuqori sifat', description: 'Faqat eng yaxshi materiallar va ishonchli ishlab chiqaruvchilar' },
      fastDelivery: { title: 'Tez yetkazib berish', description: 'Butun Oʻzbekiston boʻylab qisqa muddatda yetkazib beramiz' },
      supportAlt: { title: '24/7 yordam', description: 'Yordam xizmati doimo yordamga tayyor' },
      bestPrices: { title: 'Eng yaxshi narxlar', description: 'Raqobatbardosh narxlar va muntazam chegirmalar' }
    }
  }
  ,
  admin: {
    nav: {
      home: 'Bosh sahifa',
      users: 'Foydalanuvchilar',
      products: 'Mahsulotlar',
      orders: 'Buyurtmalar'
    },
    header: {
      backToSite: 'Saytga qaytish',
      title: 'Administrator paneli',
      welcome: 'Xush kelibsiz, {name}'
    },
    common: {
      close: 'Yopish',
      unspecified: 'Ko‘rsatilmagan',
      toggleAvailability: 'Mavjudligini almashtirish'
    },
    products: {
      title: 'Mahsulotlarni boshqarish',
      subtitle: 'Katalogdagi mahsulotlarni ko‘rish va boshqarish',
      add: 'Mahsulot qo‘shish',
      table: {
        product: 'Mahsulot',
        price: 'Narx',
        size: 'O‘lchamlar',
        status: 'Holat',
        actions: 'Amallar'
      },
      pagination: {
        shown: '{count} ta / {total} ta mahsulot ko‘rsatildi'
      },
      empty: {
        title: 'Mahsulotlar topilmadi',
        subtitle: 'Qidiruv parametrlarini o‘zgartiring yoki yangi mahsulot qo‘shing'
      },
      status: {
        active: 'Faol',
        inactive: 'Faol emas'
      },
      deleteConfirm: {
        title: 'Mahsulotni o‘chirish',
        message: 'Ushbu mahsulotni o‘chiraysizmi? Bu amalni qaytarib bo‘lmaydi.',
        confirm: 'O‘chirish'
      },
      form: {
        createTitle: 'Mahsulot yaratish',
        editTitle: 'Mahsulotni tahrirlash',
        fields: {
          name: 'Nomi',
          namePlaceholder: 'Nomini kiriting',
          price: 'Narx',
          quantity: 'Miqdor',
          size: 'O‘lchamlar',
          sizePlaceholder: 'Masalan 36-40',
          active: 'Faol mahsulot'
        },
        buttons: {
          saving: 'Saqlanmoqda...',
          update: 'Yangilash',
          create: 'Yaratish'
        }
      },
      images: {
        section: 'Rasmlar (majburiy emas)',
        single: 'Bitta rasm',
        multiple: 'Bir nechta rasm',
        selectedFiles: 'Tanlangan fayllar: {count}',
        uploading: 'Rasmlar yuklanmoqda...',
        willUploadAfterCreate: 'Rasmlar mahsulot yaratilgandan so‘ng yuklanadi.',
        current: 'Joriy rasmlar',
        loading: 'Yuklanmoqda...',
        none: 'Saqlangan rasmlar yo‘q',
        primaryBadge: 'Asosiy',
        removeImageAria: 'Rasmni o‘chirish',
        addingHint: 'Yuqorida yangi fayllar qo‘shiladi — almashtirish uchun ortiqchalarini o‘chirib yangilarini yuklang.',
        progress: '{current} / {total}',
        deleteConfirmTitle: 'Rasmni o‘chirish',
        deleteConfirmMessage: 'Ushbu rasmni o‘chirilsinmi?',
        deleteSuccess: 'Rasm o‘chirildi',
        deleteError: 'Rasmni o‘chirishda xato',
        uploadSingleSuccess: 'Rasm yuklandi ({field})',
        uploadAllSuccess: 'Barcha rasmlar yuklandi',
        uploadError: 'Rasmlarni yuklashda xato'
      },
      toasts: {
        loadError: 'Mahsulotlarni yuklashda xato',
        deleteSuccess: 'Mahsulot muvaffaqiyatli o‘chirildi',
        deleteAlreadyRemoved: 'Mahsulot allaqachon o‘chirilgan',
        deleteError: 'Mahsulotni o‘chirishda xato',
        saveError: 'Mahsulotni saqlashda xato',
        updateSuccess: 'Mahsulot yangilandi',
        createSuccess: 'Mahsulot yaratildi',
        statusUpdateSuccess: 'Mahsulot holati yangilandi',
        statusUpdateError: 'Holatni yangilashda xato'
      }
    },
    users: {
      title: 'Foydalanuvchilarni boshqarish',
      subtitle: 'Tizim foydalanuvchilarini ko‘rish va boshqarish',
      table: {
        user: 'Foydalanuvchi',
        phone: 'Telefon',
        role: 'Rol',
        registeredAt: 'Ro‘yxatdan o‘tgan sana'
      },
      empty: {
        title: 'Foydalanuvchilar topilmadi',
        subtitle: 'Qidiruv yoki filtrlarni o‘zgartirib ko‘ring'
      },
      toasts: { loadError: 'Foydalanuvchilarni yuklashda xato' },
      role: { admin: 'Administrator', user: 'Foydalanuvchi' },
      dateNA: 'N/A'
    },
    orders: {
      title: 'Buyurtmalarni boshqarish',
      subtitle: 'Mijozlar buyurtmalarini ko‘rish va boshqarish',
      info: { orders: 'Buyurtmalar: {total}', page: 'Sahifa {page} / {pages}' },
      table: {
        order: 'Buyurtma',
        client: 'Mijoz',
        items: 'Mahsulotlar',
        amount: 'Summa',
        status: 'Holat',
        date: 'Sana',
        actions: 'Amallar'
      },
      itemsCount: '{count} ta mahsulot',
      empty: {
        title: 'Buyurtmalar topilmadi',
        subtitle: 'Qidiruv parametrlarini o‘zgartirib ko‘ring'
      },
      status: {
        pending: 'Kutilmoqda',
        processing: 'Qayta ishlanmoqda',
        shipped: 'Jo‘natildi',
        delivered: 'Yetkazildi',
        cancelled: 'Bekor qilindi'
      },
      toasts: {
        loadError: 'Buyurtmalarni yuklashda xato',
        statusUpdateSuccess: 'Buyurtma holati yangilandi',
        statusUpdateError: 'Holatni yangilashda xato'
      },
      unspecifiedUser: 'Ko‘rsatilmagan'
    },
    dashboard: {
      title: 'Administrator paneli',
      welcome: 'Internet-do‘kon boshqaruv paneliga xush kelibsiz',
      loadError: 'Statistikani yuklashda xato',
      stats: {
        totalUsers: 'Jami foydalanuvchilar',
        totalProducts: 'Jami mahsulotlar',
        totalOrders: 'Jami buyurtmalar',
        pendingOrders: 'Kutilayotgan buyurtmalar'
      },
      quickActions: {
        title: 'Tezkor amallar',
        products: { title: 'Mahsulotlarni boshqarish', subtitle: 'Mahsulot qo‘shish, tahrirlash' },
        orders: { title: 'Buyurtmalarni boshqarish', subtitle: 'Buyurtmalarni ko‘rish va qayta ishlash' },
        users: { title: 'Foydalanuvchilarni boshqarish', subtitle: 'Foydalanuvchilarni ko‘rish' }
      }
    }
  }
} as const;

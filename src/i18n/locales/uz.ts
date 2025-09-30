export default {
  brand: { 
    name: 'Velora shoes', 
    tagline: 'Internet doʻkoni',
    description: 'Sifatli va zamonaviy oyoq kiyimlar. Har bir qadamda qulaylik va stil.'
  },
  home: {
    heroLine1: 'Har bir qadamda',
    heroLine2: 'Qulaylik va Stil',
    heroSubtitle: 'Zamonaviy va sifatli oyoq kiyimlar toʻplamini kashf eting',
    viewCatalog: 'Katalogni koʻrish',
    myOrders: 'Buyurtmalarim'
  },
  common: {
    home: 'Bosh sahifa',
    catalog: 'Katalog',
    adminPanel: 'Admin panel',
    profile: 'Profil',
    logout: 'Chiqish',
    cancel: 'Bekor qilish',
    confirm: 'Tasdiqlash',
    delete: 'Oʻchirish',
    deleteQuestion: 'Ushbu mahsulotni oʻchirasizmi?',
    save: 'Saqlash',
    edit: 'Tahrirlash',
    cart: 'Savat',
    items: 'dona',
    yes: 'Ha',
    back: 'Orqaga',
    currencySom: 'soʻm'
  },
  catalog: {
    title: 'Katalog',
    subtitle: 'Bizning sifatli mahsulotlar toʻplamidan tanlang',
    pageStatus: 'Sahifa {page} / {totalPages}',
    viewDetails: 'Batafsil'
  },
  ordersPage: {
    title: 'Buyurtmalarim',
    subtitle: 'Buyurtmalaringiz holatini kuzating',
    authRequiredTitle: 'Avtorizatsiya talab qilinadi',
    authRequiredMessage: 'Buyurtmalaringizni koʻrish uchun tizimga kiring',
    status: {
      CREATED: 'Yaratilgan',
      PENDING: 'Kutilmoqda',
      PAID: 'Toʻlangan',
      FAILED: 'Muvaffaqiyatsiz',
      CANCELLED: 'Bekor qilingan',
      REFUNDED: 'Qaytarilgan'
    }
  },
  product: {
    size: 'Oʻlcham',
    price: 'Narx',
    available: 'Mavjud',
    notAvailable: 'Mavjud emas',
    category: 'Kategoriya',
    addToCart: 'Savatga qoʻshish',
    description: 'Mahsulot tavsifi',
    quantityLabel: 'Miqdor',
    availableQuantity: 'Mavjud: {count}',
    insufficientStock: 'Yetarli emas',
    insufficientForOrder: 'buyurtma uchun yetarli emas',
    insufficientStockTooltip: 'Yetarli mahsulot yoʻq (minimum {min})'
  },
  productDetail: {
    notFound: 'Mahsulot topilmadi',
    imageGallery: 'Mahsulot rasmlari galereyasi ({count})',
    temporarilyOutOfStock: 'Mahsulot vaqtincha mavjud emas',
    thumbnail: 'Kichik rasm {index}'
  },
  orders: {
    status: {
      created: 'Yaratilgan',
      pending: 'Kutilmoqda',
      paid: 'Toʻlangan',
      failed: 'Muvaffaqiyatsiz',
      cancelled: 'Bekor qilingan',
      refunded: 'Qaytarilgan',
      confirmed: 'Tasdiqlangan',
      processing: 'Tayyorlanmoqda',
      shipped: 'Yetkazilmoqda',
      delivered: 'Yetkazildi',
      CONFIRMED: 'Tasdiqlangan',
      PROCESSING: 'Tayyorlanmoqda',
      SHIPPED: 'Yetkazilmoqda',
      DELIVERED: 'Yetkazildi'
    },
    itemCount: '{count} ta mahsulot',
    viewDetails: 'Batafsil',
    refund: {
      request: 'Qaytarish',
      requesting: 'So\'ralmoqda...',
      requestSuccess: 'Qaytarish so\'rovi yuborildi',
      requestError: 'Qaytarish so\'rovini yuborishda xato',
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
      quantity: 'Miqdor',
      price: 'Narx',
      size: 'Oʻlcham',
      notes: 'Izoh',
      total: 'Jami'
    }
  },
  auth: {
    login: 'Tizimga kirish',
    register: 'Roʻyxatdan oʻtish',
    name: 'Foydalanuvchi nomi',
    namePlaceholder: 'Foydalanuvchi nomi',
    password: 'Parol',
    passwordPlaceholder: 'Kamida 8 ta belgi',
    passwordInputPlaceholder: 'Parolni kiriting',
    confirmPassword: 'Parolni tasdiqlash',
    confirmPasswordPlaceholder: 'Parolni qayta kiriting',
    phone: 'Telefon raqami',
    phonePlaceholder: '+998901234567',
    forgotPassword: 'Parolni unutdingizmi?',
    orCreate: 'Roʻyxatdan oʻting',
    orLogin: 'Tizimga kirish',
    logoutConfirmTitle: 'Tizimdan chiqishni xohlaysizmi?',
    logoutConfirmMessage: 'Sessiyani yakunlamoqchimisiz?',
    logoutConfirmButton: 'Chiqish',
    forgot: {
      title: 'Parolni tiklash',
      instructions: 'Foydalanuvchi nomini va yangi parolni kiriting',
      newPassword: 'Yangi parol',
      confirmNewPassword: 'Parolni tasdiqlash',
      submit: 'Parolni oʻzgartirish',
      backToLogin: 'Kirish sahifasiga qaytish'
    },
    validation: {
      nameRequired: 'Ism majburiy',
      passwordMin: 'Parol kamida 8 ta belgidan iborat boʻlishi kerak',
      surnameRequired: 'Familiya majburiy',
      phoneRequired: 'Telefon raqami majburiy',
      phoneFormat: 'Telefon + bilan boshlanib 10-15 ta raqamdan iborat boʻlishi kerak',
      confirmPasswordMin: 'Parolni tasdiqlash majburiy (kamida 8 ta belgi)',
      passwordsMismatch: 'Parollar mos kelmadi'
    },
    toasts: {
      loginSuccess: 'Muvaffaqiyatli tizimga kirildi!',
      loginInvalid: 'Notoʻgʻri login yoki parol',
      registrationSuccess: 'Roʻyxatdan oʻtish muvaffaqiyatli!',
      logoutSuccess: 'Tizimdan muvaffaqiyatli chiqildi',
      passwordChangeSuccess: 'Parol muvaffaqiyatli oʻzgartirildi',
      userFoundEnterNewPassword: 'Foydalanuvchi topildi. Yangi parolni kiriting'
    }
    ,
    errors: {
      registrationFailed: 'Roʻyxatdan oʻtishda xato',
      passwordChangeFailed: 'Parolni oʻzgartirishda xato',
      userSearchFailed: 'Foydalanuvchini topishda xato',
      invalidServerResponse: 'Notoʻgʻri server javobi',
      existingPhone: 'Bu telefon raqam bilan foydalanuvchi allaqachon mavjud'
    }
  },
  profilePage: {
    title: 'Mening profilim',
    roleUser: 'Foydalanuvchi',
    roleAdmin: 'Administrator',
    basicInfo: 'Asosiy maʻlumotlar',
    phoneNumber: 'Telefon raqami',
    passwordChangeOptional: 'Parolni oʻzgartirish (ixtiyoriy)',
    currentPassword: 'Joriy parol',
    newPassword: 'Yangi parol',
    newPasswordPlaceholder: 'Oʻzgartirishni istamasa boʻsh qoldiring',
    confirmNewPassword: 'Yangi parolni tasdiqlash',
    confirmNewPasswordPlaceholder: 'Yangi parolni qayta kiriting',
    updating: 'Saqlanmoqda...',
    toasts: {
      updateSuccess: 'Profil muvaffaqiyatli yangilandi!',
      updateError: 'Profilni yangilashda xato'
    },
    validation: {
      currentPasswordRequired: 'Parolni almashtirish uchun joriy parolni kiriting',
      newPasswordMin: 'Yangi parol kamida 8 ta belgidan iborat boʻlishi kerak',
      allPasswordFieldsRequired: 'Parolni oʻzgartirish uchun barcha parol maydonlarini toʻldiring'
    }
  },
  cart: {
    inCart: 'Savatda',
    added: '{name}: +{qty} dona qoʻshildi',
    removed: '{name}: olib tashlandi',
    emptyCart: 'Savat boʻsh',
    cleared: 'Savat tozalandi'
  },
  cartPage: {
    emptyTitle: 'Savat boʻsh',
    emptySubtitle: 'Xaridni boshlash uchun katalogdan mahsulot qoʻshing',
    continueShopping: 'Xaridni davom ettirish',
    continue: 'Xaridni davom ettirish',
    heading: 'Savat',
    itemsCount: '{count} ta mahsulot',
    clear: 'Savatni tozalash',
    orderSummary: 'Buyurtma yakuni',
    productsLine: 'Mahsulotlar ({count} ta)',
    total: 'Umumiy summa',
    emptyCart: 'Savat boʻsh',
    checkout: 'Buyurtma berish',
    loginForCheckout: 'Tizimga kiring',
    loginForCheckoutSuffix: 'buyurtma berish uchun',
    processingBatch: 'Paket {current}/{total} qayta ishlanmoqda...',
    batchProcessingStart: 'Katta buyurtma qayta ishlanmoqda ({total} ta qism)...',
    batchProcessingFallback: 'Buyurtma qayta qayta ishlanmoqda ({total} ta qism)...',
    batchProcessingSuccess: 'Buyurtma muvaffaqiyatli {count} ta qismga bo\'linadi!',
    largeOrderNotice: {
      title: 'Katta buyurtma',
      message: 'Sizning buyurtmangizda {total} ta mahsulot bor. Optimal qayta ishlash uchun qismlar bo\'yicha qayta ishlanadi.',
      extraLargeMessage: 'Juda katta buyurtma. Qayta ishlash bir necha daqiqa vaqt olishi mumkin.'
    },
    size: 'Oʻlcham',
    color: 'Rang'
  },
  payment: {
    processing: 'Toʻlov qayta ishlanmoqda...',
    checking: 'Toʻlov holatini tekshirish',
    pleaseWait: 'Iltimos, kuting',
    orderId: 'Buyurtma raqami',
    amount: 'Summa',
    status: 'Holat',
    orderDescription: '{customerName} uchun buyurtma ({itemCount} ta mahsulot)',
    batchOrderDescription: '{customerName} uchun paket buyurtma ({itemCount} ta mahsulot, {batchCount} ta qism)',
    success: {
      title: 'Toʻlov muvaffaqiyatli yakunlandi',
      message: 'Sizning buyurtmangiz qabul qilindi',
      orderNumber: 'Buyurtma raqami',
      returnToHome: 'Bosh sahifaga qaytish',
      viewOrders: 'Buyurtmalarni koʻrish'
    },
    failure: {
      title: 'Toʻlov muvaffaqiyatsiz',
      message: 'Toʻlovda xatolik yuz berdi',
      tryAgain: 'Qayta urinish',
      returnToCart: 'Savatga qaytish'
    }
  },
  admin: {
    nav: {
      home: 'Bosh sahifa',
      users: 'Foydalanuvchilar',
      products: 'Mahsulotlar',
      orders: 'Buyurtmalar'
    },
    header: {
      title: 'Boshqaruv paneli',
      welcome: 'Xush kelibsiz, {name}'
    },
    dashboard: {
      title: 'Boshqaruv paneli',
      welcome: 'Internet doʻkon boshqaruv paneliga xush kelibsiz',
      stats: {
        totalUsers: 'Jami foydalanuvchilar',
        totalProducts: 'Jami mahsulotlar',
        totalOrders: 'Jami buyurtmalar',
        pendingOrders: 'Kutilayotgan buyurtmalar'
      },
      quickActions: {
        title: 'Tezkor amallar',
        products: {
          title: 'Mahsulotlarni boshqarish',
          subtitle: 'Mahsulot qoʻshish, tahrirlash'
        },
        orders: {
          title: 'Buyurtmalarni boshqarish',
          subtitle: 'Buyurtmalarni koʻrish va qayta ishlash'
        },
        users: {
          title: 'Foydalanuvchilarni boshqarish',
          subtitle: 'Foydalanuvchilarni koʻrish'
        }
      }
    },
    users: {
      title: 'Foydalanuvchilarni boshqarish',
      subtitle: 'Tizim foydalanuvchilarini koʻrish va boshqarish',
      table: {
        user: 'Foydalanuvchi',
        phone: 'Telefon',
        role: 'Rol',
        registeredAt: 'Roʻyxatdan oʻtgan sana'
      },
      empty: {
        title: 'Foydalanuvchilar topilmadi',
        subtitle: 'Qidiruv parametrlarini yoki filtrlarni oʻzgartiring'
      },
      toasts: {
        loadError: 'Foydalanuvchilarni yuklashda xato'
      },
      role: {
        admin: 'Administrator',
        user: 'Foydalanuvchi'
      },
      dateNA: 'N/M'
    },
    products: {
      title: 'Mahsulotlarni boshqarish',
      subtitle: 'Katalogdagi mahsulotlarni koʻrish va boshqarish',
      add: 'Mahsulot qoʻshish',
      table: {
        product: 'Mahsulot',
        price: 'Narx',
        size: 'Oʻlchamlar',
        status: 'Holat',
        actions: 'Amallar'
      },
      pagination: {
        shown: '{total} mahsulotdan {count} tasi koʻrsatildi'
      },
      empty: {
        title: 'Mahsulotlar topilmadi',
        subtitle: 'Qidiruv parametrlarini oʻzgartiring yoki yangi mahsulot qoʻshing'
      },
      status: {
        active: 'Faol',
        inactive: 'Faol emas'
      },
      dialogs: {
        deleteTitle: 'Mahsulotni oʻchirish: {name}?',
        deleteMessage: '"{name}" mahsuloti oʻchirilsinmi? Bu amalni ortga qaytarib boʻlmaydi.'
      },
      deleteConfirm: {
        title: 'Mahsulotni oʻchirish',
        message: 'Ushbu mahsulotni oʻchirmoqchimisiz? Bu amalni ortga qaytarib boʻlmaydi.',
        confirm: 'Oʻchirish'
      },
      form: {
        createTitle: 'Mahsulot yaratish',
        editTitle: 'Mahsulotni tahrirlash',
        fields: {
          name: 'Nomi',
          namePlaceholder: 'Nomini kiriting',
          price: 'Narx',
          quantity: 'Miqdor',
          size: 'Oʻlchamlar',
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
        section: 'Rasmlar (ixtiyoriy)',
        single: 'Yakka rasm',
        multiple: 'Bir nechta rasm',
        recommendation: 'Tavsiya: rasmlar 2MB gacha. Katta fayllar avtomatik siqiladi.',
        selectedFiles: 'Tanlangan fayllar: {count}',
        uploading: 'Rasmlar yuklanmoqda...',
        willUploadAfterCreate: 'Rasmlar mahsulot yaratilgandan soʻng yuklanadi.',
        current: 'Joriy rasmlar',
        loading: 'Yuklanmoqda...',
        none: 'Saqlangan rasm yoʻq',
        primaryBadge: 'Asosiy',
        removeImageAria: 'Rasmni oʻchirish',
        addingHint: 'Yuqorida yangi fayllar qoʻshiladi — almashtirish uchun ortiqcha fayllarni oʻchirib yangi yuklang.',
        progress: '{current} / {total}',
        deleteConfirmTitle: 'Rasmni oʻchirish',
        deleteConfirmMessage: 'Ushbu rasm oʻchirilsinmi?',
        deleteSuccess: 'Rasm oʻchirildi',
        deleteError: 'Rasmni oʻchirishda xato',
        uploadSingleSuccess: 'Rasm yuklandi ({field})',
        uploadAllSuccess: 'Barcha rasmlar yuklandi',
        uploadError: 'Rasmlarni yuklashda xato'
      },
      toasts: {
        loadError: 'Mahsulotlarni yuklashda xato',
        deleteSuccess: 'Mahsulot muvaffaqiyatli oʻchirildi',
        deleteAlreadyRemoved: 'Mahsulot allaqachon oʻchirib tashlangan',
        deleteError: 'Mahsulotni oʻchirishda xato',
        saveError: 'Mahsulotni saqlashda xato',
        updateSuccess: 'Mahsulot yangilandi',
        createSuccess: 'Mahsulot yaratildi',
        statusUpdateSuccess: 'Mahsulot holati yangilandi',
        statusUpdateError: 'Holatni yangilashda xato'
      }
    },
    orders: {
      title: 'Buyurtmalarni boshqarish',
      subtitle: 'Mijozlar buyurtmalarini koʻrish va boshqarish',
      info: {
        orders: 'Buyurtmalar: {total}',
        page: 'Sahifa {page} / {pages}'
      },
      table: {
        order: 'Buyurtma',
        client: 'Mijoz',
        items: 'Mahsulotlar',
        amount: 'Summa',
        status: 'Holat',
        date: 'Sana'
      },
      createdAt: 'yaratilish sanasi',
      itemsCount: '{count} ta mahsulot',
      status: {
        pending: 'Kutilmoqda',
        processing: 'Qayta ishlanmoqda',
        shipped: 'Yuborildi',
        delivered: 'Yetkazildi',
        cancelled: 'Bekor qilindi',
        confirmed: 'Tasdiqlandi',
        created: 'Yaratildi',
        paid: 'Toʻlandi',
        failed: 'Muvaffaqiyatsiz',
        refunded: 'Qaytarildi',
        PENDING: 'Kutilmoqda',
        PROCESSING: 'Qayta ishlanmoqda',
        SHIPPED: 'Yuborildi',
        DELIVERED: 'Yetkazildi',
        CANCELLED: 'Bekor qilindi',
        CONFIRMED: 'Tasdiqlandi',
        CREATED: 'Yaratildi',
        PAID: 'Toʻlandi',
        FAILED: 'Muvaffaqiyatsiz',
        REFUNDED: 'Qaytarildi'
      },
      toasts: {
        loadError: 'Buyurtmalarni yuklashda xato',
        statusUpdateSuccess: 'Buyurtma holati yangilandi',
        statusUpdateError: 'Holatni yangilashda xato',
        refundSuccess: 'Pul muvaffaqiyatli qaytarildi',
        refundError: 'Pulni qaytarishda xato',
        refundNotAllowed: 'Faqat tasdiqlangan buyurtmalar uchun pul qaytarish mumkin'
      },
      actions: {
        refund: 'Qaytarish',
        refundRequest: 'Qaytarishni soʻrash',
        adminRefund: 'Pulni qaytarish'
      },
      refundConfirm: {
        title: 'Pulni qaytarishni tasdiqlang',
        message: 'Ushbu buyurtma uchun pulni qaytarishni xohlaysizmi?',
        amount: 'Qaytarish summasi',
        paymentId: 'Toʻlov IDsi',
        confirm: 'Qaytarishni tasdiqlang',
        cancel: 'Bekor qilish',
        successTitle: 'Pul qaytarildi!',
        successMessage: '{amount} summa muvaffaqiyatli qaytarildi!',
        processingMessage: '#{orderId} buyurtma boʻyicha qaytarish toʻlov tizimi tomonidan qayta ishlanmoqda.',
        refundInfo: 'Buyurtmaning toʻliq summasi buyurtma IDsi yordamida qaytariladi: #{orderId}',
        close: 'Yopish',
        processing: 'Qayta ishlanmoqda...',
        orderIdLabel: 'Buyurtma IDsi:',
        customerLabel: 'Mijoz:',
        originalAmountLabel: 'Asl summa:',
        statusLabel: 'Holat:'
      },
      unspecifiedUser: 'Koʻrsatilmagan'
    }
  },
  footer: {
    contactUs: 'Biz bilan bogʻlaning',
    followUs: 'Bizni kuzating',
    paymentMethods: 'Toʻlov usullari',
    rights: 'Barcha huquqlar himoyalangan.'
  },
  offer: {
    title: 'Ommaviy oferta',
    mustAccept: 'Toʻlash uchun ommaviy oferta shartlarini qabul qilish kerak.',
    acceptLabel: 'Men ommaviy oferta shartlarini oʻqib chiqdim va qabul qilaman',
    viewLink: 'Ofertani koʻrish'
  },
  offerPage: {
    title: 'Ommaviy oferta',
    updated: 'Yangilangan: 23.09.2025',
    intro1: 'Ushbu ommaviy oferta (bundan keyin – "Oferta") Velora shoes (bundan keyin – "Sotuvchi") tomonidan har qanday jismoniy shaxsga (bundan keyin – "Xaridor") quyida keltirilgan shartlar asosida tovarlar sotib olish / xizmatlardan foydalanish boʻyicha shartnoma tuzish taklifidir.',
    intro2: 'Buyurtma berish va uni toʻlash Xaridorning ushbu Oferta shartlariga roziligini bildiradi.',
    sections: {
      orderPayment: {
        title: '1. Buyurtma va toʻlov usullari',
        li1: 'Buyurtmalar veb-sayt orqali qabul qilinadi: https://www.optomoyoqkiyim.uz/',
        li2: 'Toʻlov mumkin: bank kartasi (UZCARD, HUMO, Visa, MasterCard) himoyalangan toʻlov xizmati orqali; saytda koʻrsatilgan boshqa toʻlov usullari.',
        li3: 'Barcha hisob-kitoblar Oʻzbekiston Respublikasi soʻmida amalga oshiriladi.'
      },
      returns: {
        title: '2. Mahsulotni qaytarish, xizmatdan voz kechish va pul qaytarish shartlari',
        li1: 'Xaridor Oʻzbekiston Respublikasi qonunchiligida belgilangan muddatlar va tartibda mahsulot yoki xizmatdan voz kechish huquqiga ega.',
        li2: 'Mahsulot/xizmatdan voz kechganda pul toʻlov amalga oshirilgan usul bilan qaytariladi.',
        li3: 'Pul qaytarish muddati odatda 7 ish kunigacha, lekin ayrim hollarda bank va toʻlov tizimlarining ishlashiga qarab 30 ish kunigacha choʻzilishi mumkin.',
        li4: 'Bank kartasi operatsiyasini bekor qilish milliy va xalqaro toʻlov tizimlarining qoidalariga muvofiq amalga oshiriladi.'
      },
      delivery: {
        title: '3. Mahsulotlarni yetkazib berish / xizmat koʻrsatish shartlari',
        li1: 'Toshkent shahriga mahsulot yetkazib berish bepul amalga oshiriladi.',
        li2: 'Oʻzbekiston Respublikasining boshqa shaharlariga yetkazib berish shartnoma asosida amalga oshiriladi.',
        li3: 'Qozogʻiston, Qirgʻiziston va Tojikistonga yetkazib berish ham shartnoma asosida amalga oshiriladi.'
      },
      security: {
        title: '4. Operatsiyalar xavfsizligi',
        li1: 'Bank kartalari bilan toʻlov zamonaviy himoya usullarini qoʻllaydigan himoyalangan toʻlov shlyuzi orqali amalga oshiriladi.',
        li2: 'Bank kartasi maʼlumotlari faqat toʻlov xizmati tomonidan qayta ishlanadi va Sotuvchiga uzatilmaydi.',
        li3: 'Sotuvchi mijozlarning shaxsiy maʼlumotlari himoyalanganligini va faqat shartnomani bajarish maqsadida ishlatilishini kafolatlaydi.'
      },
      privacy: {
        title: '5. Maxfiylik siyosati',
        li1: 'Xaridorning shaxsiy maʼlumotlari 2019 yil 2 iyuldagi "Shaxsiy maʼlumotlar toʻgʻrisida"gi OʻRQ-547-sonli Oʻzbekiston Respublikasi qonuniga muvofiq qayta ishlanadi.',
        li2: 'Sotuvchi shaxsiy maʼlumotlarni faqat Xaridor oldidagi majburiyatlarini bajarish uchun toʻplaydi va ishlatadi.',
        li3: 'Sotuvchi Xaridorning shaxsiy maʼlumotlarini uning roziligizsiz uchinchi shaxslarga oshkor qilmaslikni majburiyatini oladi, Oʻzbekiston Respublikasi qonunchiligida nazarda tutilgan hollar bundan mustasno.',
        li4: 'Xaridor koʻrsatgan elektron pochta yoki telefonga maʼlumot xabarlari (buyurtma haqida bildirishnomalar, aksiyalar va h.k.) olishga rozi boʻladi.'
      },
      seller: {
        title: '6. Sotuvchi rekvizitlari',
        name: 'Velora shoes',
        inn: 'STIR: 552430231',
        legalAddress: 'Yuridik manzil: Toshkent viloyati, Eshongʻozor, Xurshid Nigʻmon koʻchasi',
        actualAddress: 'Faktik manzil: Toshkent viloyati, Eshongʻozor, Xurshid Nigʻmon koʻchasi',
        phone: 'Telefon: +998 95 021 02 07',
        email: 'Elektron pochta: elbek1987101@icloud.com'
      }
    },
    notice: 'Buyurtmani davom ettirib va toʻlovga oʻtish orqali Siz ushbu ommaviy oferta shartlari bilan tanishganingiz va ularni qabul qilganingizni tasdiqlaysiz.'
  }
} as const;

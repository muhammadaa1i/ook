export default {
  brand: { name: 'Optom oyoq kiyim' },
  common: {
    home: 'Главная',
    catalog: 'Каталог',
    adminPanel: 'Админ панель',
    profile: 'Профиль',
    logout: 'Выйти',
    cancel: 'Отмена',
    confirm: 'Подтвердить',
  save: 'Сохранить',
  edit: 'Редактировать',
    cart: 'Корзина',
    items: 'шт.',
    yes: 'Да',
    back: 'Назад',
    returnToCatalog: 'Вернуться к каталогу',
    imageUnavailable: 'Изображение недоступно',
    previousImage: 'Предыдущее изображение',
    nextImage: 'Следующее изображение',
    showImage: 'Показать изображение {index}',
    currencySom: 'сум',
  },
  auth: {
    login: 'Войти в аккаунт',
    register: 'Создать аккаунт',
    name: 'Имя пользователя',
    password: 'Пароль',
    passwordPlaceholder: 'Минимум 8 символов',
    confirmPassword: 'Подтверждение пароля',
    forgotPassword: 'Забыли пароль?',
    logoutConfirmTitle: 'Выйти из аккаунта?',
    logoutConfirmMessage: 'Вы уверены, что хотите завершить сессию?',
    logoutConfirmButton: 'Выйти',
    namePlaceholder: 'Введите ваше имя',
    passwordInputPlaceholder: 'Введите пароль',
    confirmPasswordPlaceholder: 'Повторите пароль',
    phone: 'Номер телефона',
    phonePlaceholder: '+998 90 123 45 67',
    orCreate: 'Или создайте новый аккаунт',
    orLogin: 'Или войдите в существующий',
    loginProgress: 'Вход...',
    registerProgress: 'Регистрация...',
    showPassword: 'Показать пароль',
    hidePassword: 'Скрыть пароль',
    toasts: {
      loginSuccess: 'Успешный вход в систему!',
      loginInvalid: 'Неверный логин или пароль',
      registrationSuccess: 'Регистрация прошла успешно!',
      logoutSuccess: 'Вы вышли из системы',
      passwordChangeSuccess: 'Пароль успешно изменён',
      userFoundEnterNewPassword: 'Пользователь найден. Введите новый пароль'
    },
    errors: {
      invalidServerResponse: 'Ошибка авторизации: некорректный ответ сервера',
      passwordChangeFailed: 'Не удалось изменить пароль',
      userSearchFailed: 'Ошибка поиска пользователя',
      registrationFailed: 'Ошибка регистрации'
    },
    validation: {
      nameRequired: 'Имя обязательно',
      passwordMin: 'Пароль должен содержать минимум 8 символов',
      surnameRequired: 'Фамилия обязательна',
      phoneRequired: 'Номер телефона обязателен',
      phoneFormat: 'Номер телефона должен начинаться с + и содержать 10-15 цифр',
      confirmPasswordMin: 'Подтверждение пароля обязательно (минимум 8 символов)',
      passwordsMismatch: 'Пароли не совпадают'
    },
    forgot: {
      title: 'Восстановление пароля',
      instructions: 'Введите имя пользователя и новый пароль',
      newPassword: 'Новый пароль',
      confirmNewPassword: 'Подтверждение пароля',
      submit: 'Сменить пароль',
      saving: 'Сохранение...',
      backToLogin: 'Вернуться ко входу'
    }
  },
  product: {
    size: 'Размер',
    price: 'Цена',
    available: 'В наличии',
    notAvailable: 'Нет в наличии',
    category: 'Категория',
    addToCart: 'Добавить в корзину',
    description: 'Описание товара',
    quantityLabel: 'Количество',
  availableQuantity: 'В наличии: {count}'
  },
  productDetail: {
    notFound: 'Товар не найден',
    imageGallery: 'Галерея изображений товара ({count})',
    temporarilyOutOfStock: 'Товар временно отсутствует в наличии',
    thumbnail: 'Миниатюра {index}'
  },
  cartPage: {
    emptyTitle: 'Ваша корзина пуста',
    emptySubtitle: 'Добавьте товары из каталога, чтобы начать покупки',
    continueShopping: 'Перейти к покупкам',
    continue: 'Продолжить покупки',
    heading: 'Корзина',
    itemsCount: '{count} товаров',
    clear: 'Очистить корзину',
    orderSummary: 'Итого по заказу',
    productsLine: 'Товары ({count} шт.)',
    total: 'Общая сумма',
    checkout: 'Оформить заказ',
    loginForCheckout: 'Войдите в систему',
    loginForCheckoutSuffix: 'для оформления заказа',
    size: 'Размер',
    color: 'Цвет'
  },
  cart: {
    inCart: 'В корзине',
    alreadyInCartAddMore: 'Товар уже в корзине. Нажмите чтобы добавить ещё',
    addToCartHint: 'В корзину (минимум 50, шаг 5)'
  },
  ordersPage: {
    title: 'Мои заказы',
    subtitle: 'Отслеживайте статус ваших заказов и просматривайте историю покупок',
    historyUnavailable: 'История заказов недоступна',
    authRequiredTitle: 'Необходима авторизация',
    authRequiredMessage: 'Войдите в систему для просмотра ваших заказов',
    notFound: 'Заказы не найдены',
    noneYet: 'У вас пока нет заказов',
    tryAdjustSearch: 'Попробуйте изменить критерии поиска',
    startShopping: 'Начните покупки в нашем каталоге',
    resetFilters: 'Сбросить фильтры',
    goToCatalog: 'Перейти в каталог'
  },
  profilePage: {
    title: 'Мой профиль',
    roleAdmin: 'Администратор',
    roleUser: 'Пользователь',
    basicInfo: 'Основная информация',
    phoneNumber: 'Номер телефона',
    passwordChangeOptional: 'Смена пароля (необязательно)',
    currentPassword: 'Текущий пароль',
    newPassword: 'Новый пароль',
    newPasswordPlaceholder: 'Оставьте пустым, если не хотите менять',
    confirmNewPassword: 'Подтверждение нового пароля',
    confirmNewPasswordPlaceholder: 'Повторите новый пароль',
    updating: 'Сохранение...',
    toasts: {
      updateSuccess: 'Профиль успешно обновлён!',
      updateError: 'Ошибка обновления профиля'
    },
    validation: {
      currentPasswordRequired: 'Текущий пароль обязателен для смены пароля',
      newPasswordMin: 'Новый пароль должен содержать минимум 8 символов'
    }
  },
  catalog: {
    title: 'Каталог товаров',
    subtitle: 'Найдите идеальные тапочки из нашей коллекции качественной домашней обуви',
    pageStatus: 'Страница {page} из {totalPages}',
    notFoundTitle: 'Товары не найдены',
    notFoundSubtitle: 'Попробуйте изменить параметры поиска или фильтры'
  },
  errors: {
    serverUnavailable: 'Сервер временно недоступен',
    serverUnavailableLong: 'Сервер временно недоступен. Попробуйте позже.',
    serverUnavailableRetry: 'Сервер временно недоступен. Попробуйте обновить страницу через несколько минут.',
    categoriesLoad: 'Ошибка загрузки категорий',
    badGateway: 'Ошибка шлюза сервера',
    badGatewayLong: 'Ошибка подключения к серверу. Попробуйте позже.',
    serverError: 'Ошибка сервера',
    serverErrorLong: 'Ошибка сервера. Попробуйте позже.',
    tooManyRequests: 'Слишком много запросов',
    tooManyRequestsLong: 'Слишком много запросов. Подождите немного и попробуйте снова.',
    productsLoad: 'Ошибка загрузки товаров'
  },
  footer: {
    quickLinks: 'Быстрые ссылки',
    support: 'Поддержка',
    about: 'О нас',
    contact: 'Контакты',
    help: 'Помощь',
    shipping: 'Доставка',
    returns: 'Возврат',
    privacy: 'Конфиденциальность',
    rights: 'Все права защищены.'
  },
  home: {
    heroLine1: 'Комфорт для',
    heroLine2: 'ваших ног',
    heroSubtitle: 'Откройте для себя коллекцию премиальных тапочек, созданных для идеального комфорта и стиля',
    heroSubtitleAlt: 'Откройте для себя коллекцию качественных и стильных тапочек',
    viewCatalog: 'Посмотреть каталог',
    myOrders: 'Мои заказы',
    categories: 'Категории',
    popularProducts: 'Популярные товары',
    popularProductsSubtitle: 'Самые популярные модели тапочек, которые выбирают наши покупатели',
    whyChooseUs: 'Почему выбирают нас',
    ctaTitle: 'Готовы найти идеальные тапочки?',
    ctaSubtitle: 'Присоединяйтесь к тысячам довольных покупателей',
    ctaStartShopping: 'Начать покупки',
    viewAllProducts: 'Посмотреть все товары',
    features: {
      quality: { title: 'Качество гарантировано', description: 'Все товары проходят строгий контроль качества' },
      delivery: { title: 'Быстрая доставка', description: 'Доставка по всей стране в течение 1-3 дней' },
      support: { title: 'Поддержка 24/7', description: 'Наша команда готова помочь в любое время' },
      customers: { title: 'Довольные клиенты', description: 'Тысячи положительных отзывов от покупателей' },
      highQuality: { title: 'Высокое качество', description: 'Только лучшие материалы и проверенные производители' },
      fastDelivery: { title: 'Быстрая доставка', description: 'Доставляем по всему Узбекистану в кратчайшие сроки' },
      supportAlt: { title: 'Поддержка 24/7', description: 'Наша служба поддержки всегда готова помочь' },
      bestPrices: { title: 'Лучшие цены', description: 'Конкурентные цены и регулярные скидки' }
    }
  }
  ,
  admin: {
    nav: {
      home: 'Главная',
      users: 'Пользователи',
      products: 'Товары',
      orders: 'Заказы'
    },
    header: {
      backToSite: 'На сайт',
      title: 'Административная панель',
      welcome: 'Добро пожаловать, {name}'
    },
    common: {
      close: 'Закрыть',
      unspecified: 'Не указано',
      toggleAvailability: 'Переключить доступность'
    },
    products: {
      title: 'Управление товарами',
      subtitle: 'Просмотр и управление товарами в каталоге',
      add: 'Добавить товар',
      table: {
        product: 'Товар',
        price: 'Цена',
        size: 'Размеры',
        status: 'Статус',
        actions: 'Действия'
      },
      pagination: {
        shown: 'Показано {count} из {total} товаров'
      },
      empty: {
        title: 'Товары не найдены',
        subtitle: 'Попробуйте изменить параметры поиска или добавьте новый товар'
      },
      status: {
        active: 'Активный',
        inactive: 'Неактивный'
      },
      deleteConfirm: {
        title: 'Удалить товар',
        message: 'Вы уверены, что хотите удалить этот товар? Это действие нельзя отменить.',
        confirm: 'Удалить'
      },
      form: {
        createTitle: 'Создать товар',
        editTitle: 'Редактировать товар',
        fields: {
          name: 'Название',
          namePlaceholder: 'Введите название',
          price: 'Цена',
          quantity: 'Количество',
          size: 'Размеры',
          sizePlaceholder: 'Например 36-40',
          active: 'Активный товар'
        },
        buttons: {
          saving: 'Сохранение...',
          update: 'Обновить',
          create: 'Создать'
        }
      },
      images: {
        section: 'Изображения (опционально)',
        single: 'Одно изображение',
        multiple: 'Несколько изображений',
        selectedFiles: 'Выбрано файлов: {count}',
        uploading: 'Загрузка изображений...',
        willUploadAfterCreate: 'Изображения будут загружены после создания товара.',
        current: 'Текущие изображения',
        loading: 'Загрузка...',
        none: 'Нет сохранённых изображений',
        primaryBadge: 'Основное',
        removeImageAria: 'Удалить изображение',
        addingHint: 'Новые файлы выше будут добавлены — чтобы заменить, удалите лишние и загрузите новые.',
        progress: '{current} / {total}',
        deleteConfirmTitle: 'Удалить изображение',
        deleteConfirmMessage: 'Удалить это изображение?',
        deleteSuccess: 'Изображение удалено',
        deleteError: 'Ошибка удаления изображения',
        uploadSingleSuccess: 'Изображение загружено ({field})',
        uploadAllSuccess: 'Все изображения загружены',
        uploadError: 'Ошибка загрузки изображений'
      },
      toasts: {
        loadError: 'Ошибка загрузки товаров',
        deleteSuccess: 'Товар успешно удален',
        deleteAlreadyRemoved: 'Товар уже был удален',
        deleteError: 'Ошибка удаления товара',
        saveError: 'Ошибка сохранения товара',
        updateSuccess: 'Товар обновлен',
        createSuccess: 'Товар создан',
        statusUpdateSuccess: 'Статус товара обновлен',
        statusUpdateError: 'Ошибка обновления статуса'
      }
    },
    users: {
      title: 'Управление пользователями',
      subtitle: 'Просмотр и управление пользователями системы',
      table: {
        user: 'Пользователь',
        phone: 'Телефон',
        role: 'Роль',
        registeredAt: 'Дата регистрации'
      },
      empty: {
        title: 'Пользователи не найдены',
        subtitle: 'Попробуйте изменить параметры поиска или фильтры'
      },
      toasts: { loadError: 'Ошибка загрузки пользователей' },
      role: { admin: 'Администратор', user: 'Пользователь' },
      dateNA: 'Н/Д'
    },
    orders: {
      title: 'Управление заказами',
      subtitle: 'Просмотр и управление заказами клиентов',
      info: { orders: 'Заказов: {total}', page: 'Страница {page} из {pages}' },
      table: {
        order: 'Заказ',
        client: 'Клиент',
        items: 'Товары',
        amount: 'Сумма',
        status: 'Статус',
        date: 'Дата',
        actions: 'Действия'
      },
      itemsCount: '{count} товар(ов)',
      empty: {
        title: 'Заказы не найдены',
        subtitle: 'Попробуйте изменить параметры поиска'
      },
      status: {
        pending: 'Ожидает',
        processing: 'Обрабатывается',
        shipped: 'Отправлен',
        delivered: 'Доставлен',
        cancelled: 'Отменен'
      },
      toasts: {
        loadError: 'Ошибка загрузки заказов',
        statusUpdateSuccess: 'Статус заказа обновлен',
        statusUpdateError: 'Ошибка обновления статуса заказа'
      },
      unspecifiedUser: 'Не указано'
    },
    dashboard: {
      title: 'Панель администратора',
      welcome: 'Добро пожаловать в панель управления интернет-магазином',
      loadError: 'Ошибка загрузки статистики',
      stats: {
        totalUsers: 'Всего пользователей',
        totalProducts: 'Всего товаров',
        totalOrders: 'Всего заказов',
        pendingOrders: 'Ожидающие заказы'
      },
      quickActions: {
        title: 'Быстрые действия',
        products: { title: 'Управление товарами', subtitle: 'Добавить, редактировать товары' },
        orders: { title: 'Управление заказами', subtitle: 'Просмотр и обработка заказов' },
        users: { title: 'Управление пользователями', subtitle: 'Просмотр пользователей' }
      }
    }
  }
} as const;

export default {
  brand: { 
    name: 'Velora shoes', 
    tagline: 'Интернет магазин',
    description: 'Качественная и современная обувь. Комфорт и стиль в каждом шаге.'
  },
  home: {
    heroLine1: 'Комфорт в каждом',
    heroLine2: 'шаге',
    heroSubtitle: 'Откройте для себя коллекцию современной и качественной обуви',
    heroSubtitleAlt: 'Выберите из нашей самой популярной коллекции',
    viewCatalog: 'Перейти в каталог',
    myOrders: 'Мои заказы',
    categories: 'Категории',
    popularProducts: 'Популярные товары',
    popularProductsSubtitle: 'Оцените модели, которые чаще всего выбирают наши покупатели',
    viewAllProducts: 'Смотреть все товары',
    whyChooseUs: 'Почему выбирают нас',
    features: {
      quality: { title: 'Качество', description: 'Только проверенные материалы и контроль производства' },
      delivery: { title: 'Доставка', description: 'Быстрая и надежная доставка по всему Узбекистану' },
      support: { title: 'Поддержка', description: 'Оперативно отвечаем на ваши вопросы' },
      customers: { title: 'Довольные клиенты', description: 'Тысячи покупателей доверяют нам' }
    },
    ctaTitle: 'Сделайте новый шаг уже сегодня',
    ctaSubtitle: 'Выберите коллекцию, где комфорт сочетается со стилем',
    ctaStartShopping: 'Начать покупки'
  },
  common: {
    home: 'Главная',
    catalog: 'Каталог',
    adminPanel: 'Админ панель',
    profile: 'Профиль',
    logout: 'Выйти',
    cancel: 'Отмена',
  confirm: 'Подтвердить',
  delete: 'Удалить',
  deleteQuestion: 'Удалить этот товар?',
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
    login: 'Войдите в аккаунт',
    register: 'Создать аккаунт',
    name: 'Имя пользователя',
    password: 'Пароль',
    passwordPlaceholder: 'Минимум 8 символов',
    confirmPassword: 'Подтверждение пароля',
    forgotPassword: 'Забыли пароль?',
    logoutConfirmTitle: 'Выйти из аккаунта?',
  logoutConfirmMessage: '',
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
      registrationFailed: 'Ошибка регистрации',
      registrationFailedNetwork: 'Сетевая ошибка или CORS заблокировал запрос. Попробуйте позже или проверьте консоль браузера.',
      existingPhone: 'Пользователь с этим номером телефона уже существует'
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
    quantity: 'Количество',
    available: 'В наличии',
    notAvailable: 'Нет в наличии',
    category: 'Категория',
    addToCart: 'Добавить в корзину',
    description: 'Описание товара',
    quantityLabel: 'Количество',
    availableQuantity: 'В наличии: {count}',
    insufficientStock: 'Недостаточно товара',
    insufficientForOrder: 'недостаточно для заказа',
    insufficientStockTooltip: 'Недостаточно товара (минимум {min})',
    minimumOrderWarning: 'Минимальный заказ {min}. Доступно только {available}.'
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
  emptyCart: 'Корзина пуста',
    checkout: 'Оформить заказ',
    loginForCheckout: 'Войдите в систему',
    loginForCheckoutSuffix: 'для оформления заказа',
    processingBatch: 'Обработка пакета {current} из {total}...',
    batchProcessingStart: 'Обработка крупного заказа ({total} частей)...',
    batchProcessingFallback: 'Повторная обработка заказа ({total} частей)...',
    batchProcessingSuccess: 'Успешный заказ',
    largeOrderNotice: {
      title: 'Крупный заказ',
      message: 'В вашем заказе {total} товаров. Он будет обработан по частям для оптимальной обработки.',
      extraLargeMessage: 'Очень крупный заказ. Обработка может занять несколько минут.'
    },
    size: 'Размер',
    color: 'Цвет'
  },
  offer: {
    title: 'Публичная оферта',
    mustAccept: 'Для перехода к оплате необходимо принять условия публичной оферты.',
    acceptLabel: 'Я ознакомлен(а) и принимаю условия публичной оферты',
    viewLink: 'Посмотреть оферту'
  },
  cart: {
    inCart: 'В корзине',
    addToCart: 'В корзину',
    addMore: 'Добавить ещё',
    alreadyInCartAddMore: 'Товар уже в корзине. Нажмите чтобы добавить ещё',
    addToCartHint: 'Добавить в корзину',
    added: '{name}: +{qty} единиц добавлено',
    removed: '{name}: удалён',
    cleared: 'Корзина очищена',
    outOfStock: '{name} - нет в наличии',
    insufficientStock: '{name} - недостаточное количество (доступно: {available})',
    limitedStock: '{name} - добавлено только {qty} (доступно: {available})',
    emptyCart: 'Корзина пуста'
  },
  payment: {
    processing: 'Обработка платежа...',
    creatingOrder: 'Создание заказа...',
    processingLargeOrder: 'Обработка крупного заказа...',
    creatingPayment: 'Создание платежа...',
    redirecting: 'Переход к оплате...',
    checking: 'Проверка статуса платежа',
    pleaseWait: 'Пожалуйста, подождите',
    orderId: 'Номер заказа',
    amount: 'Сумма',
    status: 'Статус',
    orderDescription: 'Заказ из {itemCount} товаров для {customerName}',
    batchOrderDescription: 'Пакетный заказ для {customerName} ({itemCount} товаров, {batchCount} частей)',
    success: {
      title: 'Платеж успешно завершен',
      message: 'Ваш платеж обработан успешно. Спасибо за покупку!'
    },
    pending: {
      title: 'Платеж в обработке',
      message: 'Ваш платеж обрабатывается. Мы уведомим вас о результате.'
    },
    failure: {
      title: 'Платеж не удался',
      message: 'К сожалению, не удалось обработать ваш платеж. Пожалуйста, попробуйте еще раз.',
      retry: 'Попробовать снова'
    },
    error: {
      title: 'Ошибка платежа',
      failed: 'Платеж не удался',
      statusCheck: 'Не удалось проверить статус платежа',
      initiation: 'Не удалось инициировать платеж'
    },
    continueShopping: 'Продолжить покупки',
    viewOrders: 'Посмотреть заказы',
    orderCreated: 'Заказ успешно создан!',
    orderCreateError: 'Ошибка при создании заказа',
    noCancellationNotice: 'Внимание! После успешной оплаты отмена заказа или возврат средств невозможны.'
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
    goToCatalog: 'Перейти в каталог',
    status: {
      CREATED: 'Создан',
      PENDING: 'Ожидает',
      PAID: 'Оплачен',
      FAILED: 'Ошибка',
      CANCELLED: 'Отменён',
      REFUNDED: 'Возвращено',
      confirmed: 'Подтверждён',
      pending: 'Ожидает',
      processing: 'Обрабатывается',
      shipped: 'Отправлен',
      delivered: 'Доставлен',
      cancelled: 'Отменён'
    }
  },
  // Added orders.status.* section to mirror uz locale so that t('orders.status.*') works
  orders: {
    status: {
      created: 'Создан',
      pending: 'Ожидает',
      paid: 'Оплачен',
      failed: 'Ошибка',
      cancelled: 'Отменён',
      refunded: 'Возвращено',
      confirmed: 'Подтверждён',
      processing: 'Обрабатывается',
      shipped: 'Отправлен',
      delivered: 'Доставлен'
    },
    itemCount: '{count} товар(ов)',
    viewDetails: 'Подробнее',
    refund: {
      request: 'Возврат',
      requesting: 'Запрашиваем...',
      requestSuccess: 'Запрос на возврат отправлен',
      requestError: 'Ошибка отправки запроса на возврат',
      confirmTitle: 'Подтвердить возврат',
      confirmMessage: 'Вы уверены, что хотите запросить возврат для этого заказа?',
      amount: 'Сумма',
      orderNumber: 'Заказ',
      pendingImplementation: 'Система возвратов внедряется. Пожалуйста, обратитесь в поддержку для ручной обработки.',
      requestReceived: 'Запрос на возврат получен. С вами свяжутся в течение 24 часов.',
      confirmSubtitle: 'Обработка запроса на возврат',
      warningTitle: 'Важное уведомление',
      orderDetails: 'Детали заказа',
      itemCount: 'Товаров',
      refundAmount: 'Сумма возврата',
      processingNotice: 'Возврат будет обработан в течение 24-48 часов',
      confirmButton: 'Подтвердить возврат',
      contactModal: {
        title: 'Возврат средств',
        message: 'Если вы хотите вернуть деньги, свяжитесь с администратором',
        contactInfo: 'Контактная информация:',
        phone: 'Телефон:',
        telegram: 'Telegram:',
        closeButton: 'Закрыть'
      }
    },
    modal: {
      title: 'Заказ №{id}',
      client: 'Клиент',
      status: 'Статус',
      shippingAddress: 'Адрес доставки',
      items: 'Товары',
      quantity: 'Количество',
      price: 'Цена',
      size: 'Размер',
      itemsTotal: 'Общее количество',
      notes: 'Примечание',
      total: 'Итого'
    }
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
      newPasswordMin: 'Новый пароль должен содержать минимум 8 символов',
      allPasswordFieldsRequired: 'Для смены пароля заполните все поля пароля'
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
  errorPage: {
    default: {
      title: 'Что-то пошло не так',
      description: 'Произошла неизвестная ошибка. Попробуйте позже или обратитесь в поддержку.'
    },
    suggestions: {
      title: 'Что можно попробовать:',
      refresh: 'Попробуйте обновить страницу',
      checkConnection: 'Проверьте соединение с интернетом',
  contactSupport: '',
      tryLater: 'Попробуйте позже',
      waitFewMinutes: 'Подождите 2–3 минуты и попробуйте снова',
      slower: 'Попробуйте взаимодействовать с сайтом медленнее',
      refreshInMinute: 'Обновите страницу через минуту'
    },
    retry: 'Попробовать снова',
    goHome: 'Вернуться на главную',
    statusCode: 'Код ошибки'
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
    rights: 'Все права защищены.',
    followUs: 'Следите за нами',
    contactUs: 'Свяжитесь с нами',
    paymentMethods: 'Способы оплаты'
  },
  offerPage: {
    title: 'Публичная оферта',
    updated: 'Обновлено: 23.09.2025',
    intro1: 'Настоящая публичная оферта (далее — «Оферта») является официальным предложением Velora shoes (далее — «Продавец») любому физическому лицу (далее — «Покупатель») заключить договор купли-продажи товаров / оказания услуг на условиях, изложенных ниже.',
    intro2: 'Осуществление заказа и его оплата означает согласие Покупателя с условиями данной Оферты.',
    sections: {
      orderPayment: {
        title: '1. Способы заказа и оплаты',
        li1: 'Заказы принимаются через сайт: https://www.optomoyoqkiyim.uz/',
        li2: 'Оплата возможна: банковской картой (UZCARD, HUMO, Visa, MasterCard) через защищённый платёжный сервис; иными методами оплаты, указанными на сайте.',
        li3: 'Все расчёты производятся в сумах Республики Узбекистан.'
      },
      returns: {
        title: '2. Условия возврата товара, отказа от услуги и возврата денежных средств',
        li1: 'Покупатель вправе отказаться от товара или услуги в сроки и порядке, установленные законодательством Республики Узбекистан.',
        li2: 'При отказе от товара/услуги возврат денежных средств осуществляется тем же способом, которым была произведена оплата.',
        li3: 'Срок возврата денежных средств обычно составляет до 7 рабочих дней, однако в отдельных случаях может продлиться до 30 рабочих дней, в зависимости от работы банка и платёжных систем.',
        li4: 'Отмена операции по банковской карте производится в соответствии с правилами национальных и международных платёжных систем.'
      },
      delivery: {
        title: '3. Условия доставки товаров / оказания услуг',
        li1: 'Доставка товаров по городу Ташкент осуществляется бесплатно.',
        li2: 'Доставка в другие города Республики Узбекистан осуществляется на договорных условиях.',
        li3: 'Доставка в Казахстан, Киргизстан и Таджикистан также осуществляется на договорных условиях.'
      },
      security: {
        title: '4. Безопасность операций',
        li1: 'Оплата банковскими картами осуществляется через защищённый платёжный шлюз, который использует современные методы защиты.',
        li2: 'Данные банковской карты обрабатываются исключительно платёжным сервисом и не передаются Продавцу.',
        li3: 'Продавец гарантирует, что персональные данные клиентов защищены и используются только в целях исполнения договора.'
      },
      privacy: {
        title: '5. Политика конфиденциальности',
        li1: 'Персональные данные Покупателя обрабатываются в соответствии с Законом Республики Узбекистан «О персональных данных» №ЗРУ-547 от 2 июля 2019 года.',
        li2: 'Продавец собирает и использует персональные данные исключительно для выполнения своих обязательств перед Покупателем.',
        li3: 'Продавец обязуется не разглашать персональные данные Покупателя третьим лицам без его согласия, за исключением случаев, предусмотренных законодательством Республики Узбекистан.',
        li4: 'Покупатель соглашается на получение информационных сообщений (уведомлений о заказе, акциях и т.п.) на указанный им e-mail или телефон.'
      },
      seller: {
        title: '6. Реквизиты продавца',
        name: 'Velora shoes',
        inn: 'ИНН: 552430231',
        legalAddress: 'Юридический адрес: Ташкентский об, Эшонгузар, ул. Х. Нигмон',
        actualAddress: 'Фактический адрес: Ташкентский об, Эшонгузар, ул. Х. Нигмон',
        phone: 'Телефон: +998 95 021 02 07',
        email: 'E-mail: elbek1987101@icloud.com'
      }
    },
    notice: 'Продолжая оформление заказа и переходя к оплате, вы подтверждаете, что ознакомлены и принимаете условия данной публичной оферты.'
  },
  // duplicate home block removed (consolidated at top)
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
      dialogs: {
  deleteTitle: 'Удалить товар: {name}?',
  deleteMessage: 'Вы уверены, что хотите удалить "{name}"? Это действие нельзя отменить.'
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
        recommendation: 'Рекомендуется: изображения до 2МБ. Большие файлы будут автоматически сжаты.',
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
        phone: 'Телефон',
        items: 'Товары',
        amount: 'Сумма',
        status: 'Статус',
        date: 'Дата',
        actions: 'Действия'
      },
      createdAt: 'дата создания',
      actions: {
        refund: 'Возврат',
        refundRequest: 'Запросить возврат',
        adminRefund: 'Вернуть средства'
      },
      refund: {
        request: 'Возврат',
        requesting: 'Запрашиваем...',
        requestSuccess: 'Запрос на возврат отправлен',
        requestError: 'Ошибка отправки запроса на возврат',
        confirmTitle: 'Подтвердить возврат',
        confirmMessage: 'Вы уверены, что хотите запросить возврат для этого заказа?',
        amount: 'Сумма',
        orderNumber: 'Заказ',
        pendingImplementation: 'Система возвратов внедряется. Пожалуйста, обратитесь в поддержку для ручной обработки.',
        requestReceived: 'Запрос на возврат получен. С вами свяжутся в течение 24 часов.',
        requestSent: 'Запрос на возврат отправлен администратору. С вами свяжутся в течение 24 часов.',
        confirmSubtitle: 'Обработка запроса на возврат',
        warningTitle: 'Важное уведомление',
        orderDetails: 'Детали заказа',
        itemCount: 'Товаров',
        refundAmount: 'Сумма возврата',
        processingNotice: 'Возврат будет обработан в течение 24-48 часов',
        confirmButton: 'Подтвердить возврат'
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
        cancelled: 'Отменен',
        confirmed: 'Подтвержден',
        created: 'Создан',
        paid: 'Оплачен',
        failed: 'Неудачно',
        refunded: 'Возвращено',
        // Uppercase versions for backend compatibility
        PENDING: 'Ожидает',
        PROCESSING: 'Обрабатывается',
        SHIPPED: 'Отправлен',
        DELIVERED: 'Доставлен',
        CANCELLED: 'Отменен',
        CONFIRMED: 'Подтвержден',
        CREATED: 'Создан',
        PAID: 'Оплачен',
        FAILED: 'Неудачно',
        REFUNDED: 'Возвращено'
      },
      toasts: {
        loadError: 'Ошибка загрузки заказов',
        statusUpdateSuccess: 'Статус заказа обновлен',
        statusUpdateError: 'Ошибка обновления статуса заказа',
        refundSuccess: 'Возврат средств выполнен успешно',
        refundError: 'Ошибка при возврате средств',
        refundNotAllowed: 'Можно вернуть средства только по подтвержденным заказам'
      },
      refundConfirm: {
        title: 'Подтвердить возврат средств',
        message: 'Вы уверены, что хотите вернуть средства за этот заказ?',
        amount: 'Сумма возврата',
        paymentId: 'ID платежа',
        confirm: 'Подтвердить возврат',
        cancel: 'Отмена',
        successTitle: 'Возврат выполнен!',
        successMessage: 'Возврат на сумму {amount} успешно обработан!',
        processingMessage: 'Возврат по заказу #{orderId} обрабатывается платежной системой.',
        refundInfo: 'Полная сумма заказа будет возвращена с использованием ID заказа: #{orderId}',
        close: 'Закрыть',
        processing: 'Обработка...',
        orderIdLabel: 'ID заказа:',
        customerLabel: 'Клиент:',
        originalAmountLabel: 'Оригинальная сумма:',
        statusLabel: 'Статус:'
      },
      unspecifiedUser: 'Не указано'
    },
    refunds: {
      title: 'Запросы на возврат',
      subtitle: 'Обработка запросов на возврат средств',
      table: {
        request: 'Запрос',
        order: 'Заказ',
        user: 'Пользователь',
        amount: 'Сумма',
        reason: 'Причина',
        status: 'Статус',
        date: 'Дата',
        actions: 'Действия'
      },
      status: {
        pending: 'Ожидает',
        approved: 'Одобрено',
        rejected: 'Отклонено'
      },
      actions: {
        approve: 'Одобрить',
        reject: 'Отклонить',
        processing: 'Обработка...'
      },
      confirmDialog: {
        approve: {
          title: 'Одобрить возврат?',
          message: 'Вы уверены, что хотите одобрить этот запрос на возврат?'
        },
        reject: {
          title: 'Отклонить возврат?',
          message: 'Вы уверены, что хотите отклонить этот запрос на возврат?'
        }
      },
      toasts: {
        loadError: 'Ошибка загрузки запросов на возврат',
        approveSuccess: 'Возврат одобрен',
        approveError: 'Ошибка одобрения возврата',
        rejectSuccess: 'Возврат отклонен',
        rejectError: 'Ошибка отклонения возврата'
      },
      empty: {
        title: 'Запросы на возврат не найдены',
        subtitle: 'На данный момент нет запросов на возврат'
      }
    },
    dashboard: {
      title: 'Панель администратора',
      welcome: 'Добро пожаловать в панель управления интернет-магазином',
      loadError: 'Ошибка загрузки статистики',
      stats: {
        totalUsers: 'Всего пользователей',
        totalProducts: 'Всего товаров',
        totalOrders: 'Всего заказов'
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

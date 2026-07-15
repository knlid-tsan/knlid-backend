// ignore: unused_import
import 'package:intl/intl.dart' as intl;
import 'app_localizations.dart';

// ignore_for_file: type=lint

/// The translations for Russian (`ru`).
class AppLocalizationsRu extends AppLocalizations {
  AppLocalizationsRu([String locale = 'ru']) : super(locale);

  @override
  String get appSubtitle => 'ПЕРЕДАЧА ЛИДОВ МЕЖДУ СПЕЦИАЛИСТАМИ';

  @override
  String get btnLogin => 'Войти';

  @override
  String get btnRegister => 'Зарегистрироваться';

  @override
  String get btnContinue => 'Продолжить';

  @override
  String get btnSave => 'Сохранить';

  @override
  String get btnEdit => 'Изменить';

  @override
  String get btnCancel => 'Отмена';

  @override
  String get btnSend => 'Отправить';

  @override
  String get btnLater => 'Позже';

  @override
  String get btnAccept => 'Принять';

  @override
  String get btnDecline => 'Отклонить';

  @override
  String get btnLogout => 'Выйти';

  @override
  String get btnCancelAction => 'Отменить';

  @override
  String get btnRetry => 'Повторить';

  @override
  String get btnCreateLead => 'Создать лид';

  @override
  String get btnClose => '✓ Закрыть';

  @override
  String get btnCloseDeal => '✓ Закрыть сделку';

  @override
  String get btnOpenDispute => 'Открыть спор';

  @override
  String get btnGoVerify => 'Пройти верификацию';

  @override
  String get btnContract => '→ Договор';

  @override
  String get btnDeposit => '→ Задаток';

  @override
  String get btnConfirmClose => 'Подтвердить закрытие';

  @override
  String get btnConfirmPayment => 'Подтвердить получение';

  @override
  String get btnAttachProof => 'Прикрепить чек';

  @override
  String get btnAddPhoto => 'Добавить фото';

  @override
  String get btnEditProfile => 'Редактировать профиль';

  @override
  String get btnSelectCompany => 'Выбрать компанию';

  @override
  String get btnChangeCompany => 'Сменить компанию';

  @override
  String get btnRevokeChange => 'Отозвать заявку на смену';

  @override
  String get btnRevokeApplication => 'Отозвать заявку';

  @override
  String get btnViewLeads => 'Посмотреть лиды';

  @override
  String get btnUploadPhoto => 'Загрузить фото';

  @override
  String get btnCreateAnyway => 'Создать всё равно';

  @override
  String get btnGoVerification => 'Пройти верификацию →';

  @override
  String get btnReupload => 'Загрузить заново →';

  @override
  String get yes => 'Да';

  @override
  String get no => 'Нет';

  @override
  String get uploading => 'Загрузка...';

  @override
  String get uploadingPhoto => 'Загружаем...';

  @override
  String get sourceCamera => 'Камера';

  @override
  String get sourceGallery => 'Галерея';

  @override
  String get phoneTitle => 'Введите номер телефона';

  @override
  String get phoneHint => 'Вам будет отправлен код подтверждения в WhatsApp';

  @override
  String get phoneLabel => 'Номер телефона';

  @override
  String get phoneInvalid => 'Введите корректный номер';

  @override
  String get otpTitleLogin => 'Введите код';

  @override
  String get otpTitleRegister => 'Подтвердите номер';

  @override
  String otpHint(String phone) {
    return 'Код отправлен в WhatsApp на номер $phone';
  }

  @override
  String get otpDevHint =>
      'Режим разработки: код смотрите в логах бэкенда (npm run start)';

  @override
  String get otpCodeInvalid => 'Введите 6-значный код';

  @override
  String otpResendTimer(int seconds) {
    return 'Отправить повторно через $seconds с';
  }

  @override
  String get otpResend => 'Отправить повторно';

  @override
  String get otpRegisterHint => 'Зарегистрироваться с этим номером →';

  @override
  String get registerTitle => 'Расскажите о себе';

  @override
  String registerSubtitle(String phone) {
    return 'Номер $phone не зарегистрирован. Заполните профиль.';
  }

  @override
  String get labelFullName => 'Имя и фамилия';

  @override
  String get fullNameRequired => 'Введите имя и фамилию';

  @override
  String get labelSpecialization => 'Специализация';

  @override
  String get specRequired => 'Выберите специализацию';

  @override
  String get specRealtor => 'Риелтор';

  @override
  String get specMortgage => 'Ипотечный брокер';

  @override
  String get specLawyer => 'Юрист';

  @override
  String get labelCity => 'Город';

  @override
  String get cityPickerHint => 'Выберите город';

  @override
  String get cityRequired => 'Выберите город';

  @override
  String get citiesLoadError => 'Не удалось загрузить города';

  @override
  String get consentIAccept => 'Я принимаю';

  @override
  String get consentAnd => 'и';

  @override
  String get consentTerms => 'Пользовательское соглашение';

  @override
  String get consentPrivacy => 'Политику конфиденциальности';

  @override
  String get navHome => 'Главная';

  @override
  String get navCreated => 'Переданные';

  @override
  String get navCreatedShort => 'Переданные';

  @override
  String get navAssigned => 'Исполняю';

  @override
  String get navAssignedShort => 'Исполняю';

  @override
  String get navTariffs => 'Тарифы';

  @override
  String get navProfile => 'Профиль';

  @override
  String get bannerPending =>
      'Верификация на проверке. Пока вы не можете принимать лиды';

  @override
  String get bannerRejected => 'Верификация отклонена. Загрузите фото заново';

  @override
  String get bannerNotVerified =>
      'Вы не верифицированы — не можете принимать лиды';

  @override
  String get bannerCta => 'Пройти →';

  @override
  String get statsTitle => 'СТАТИСТИКА';

  @override
  String get statRating => 'Рейтинг';

  @override
  String get statSent => 'Передано';

  @override
  String get statReceived => 'Принято';

  @override
  String get statClosed => 'Закрыто';

  @override
  String get homeNoCreatedLeads => 'Вы ещё не передавали лиды';

  @override
  String get homeNoAssignedLeads => 'У вас нет лидов в работе';

  @override
  String get filterActive => 'Активные';

  @override
  String get filterDone => 'Завершённые';

  @override
  String get createdEmptyDoneTitle => 'Нет завершённых лидов';

  @override
  String get createdEmptyActiveTitle => 'Нет активных лидов';

  @override
  String get createdEmptyDoneHint => 'Завершённые лиды появятся здесь';

  @override
  String get createdEmptyActiveHint =>
      'Нажмите «Создать лид», чтобы передать первый';

  @override
  String get assignedEmptyActiveTitle => 'Нет активных лидов в работе';

  @override
  String get assignedEmptyActiveHint => 'Здесь появятся лиды, назначенные вам';

  @override
  String get noExecutor => 'Исполнитель не назначен';

  @override
  String get leadTypeOwner => 'Продажа';

  @override
  String get leadTypeBuyer => 'Покупка';

  @override
  String get leadTypeMortgage => 'Ипотека';

  @override
  String get leadTypeLegal => 'Юр. услуга';

  @override
  String get leadStatusNew => 'Ожидает подбора';

  @override
  String get leadStatusPendingAcceptance => 'Ожидает принятия';

  @override
  String get leadStatusInProgress => 'В работе';

  @override
  String get leadStatusContract => 'Договор';

  @override
  String get leadStatusDeposit => 'Задаток';

  @override
  String get leadStatusClosedSuccess => 'Закрыт успешно';

  @override
  String get leadStatusCancelled => 'Отменён';

  @override
  String get leadStatusDispute => 'Спор';

  @override
  String get leadStatusArchived => 'Архив';

  @override
  String get leadDetailTitle => 'Лид';

  @override
  String get sectionAuthor => 'Автор';

  @override
  String get sectionExecutor => 'Исполнитель';

  @override
  String get sectionClient => 'Клиент';

  @override
  String get sectionReward => 'Вознаграждение';

  @override
  String get sectionGuarantor => 'Гарант';

  @override
  String get sectionDescription => 'ОПИСАНИЕ';

  @override
  String get rowName => 'Имя';

  @override
  String get rowLeadType => 'Тип лида';

  @override
  String get rowCity => 'Город';

  @override
  String get rowCreated => 'Создан';

  @override
  String get rowClosed => 'Закрыт';

  @override
  String get rowPhone => 'Телефон';

  @override
  String get rowAmount => 'Сумма';

  @override
  String get rowPaid => 'Оплачено';

  @override
  String get rowCompany => 'Компания';

  @override
  String get notAssigned => 'Не назначен';

  @override
  String get clientDataLocked => 'Данные клиента откроются после принятия лида';

  @override
  String get historyTitle => 'ИСТОРИЯ СТАТУСОВ';

  @override
  String get tariffBannerTitle => 'Условия вознаграждения';

  @override
  String rewardAuthorLabel(String description) {
    return 'Вознаграждение автору: $description';
  }

  @override
  String get closeLeadTitle => 'Закрыть лид успешно';

  @override
  String get rewardFixedHint => 'Сумма фиксирована — вводить комиссию не нужно';

  @override
  String get commissionLabel => 'Ваша комиссия, ₸';

  @override
  String get commissionHint => 'Укажите вашу комиссию по сделке';

  @override
  String get percentCommissionHint =>
      'Вознаграждение автору рассчитается от этой суммы';

  @override
  String get fieldRequired => 'Обязательное поле';

  @override
  String get amountPositive => 'Введите сумму больше 0';

  @override
  String get declineLeadTitle => 'Отклонить лид';

  @override
  String get declineLeadHint => 'Укажите причину отклонения';

  @override
  String get cancelLeadTitle => 'Отменить лид';

  @override
  String get cancelLeadHint => 'Укажите причину отмены (обязательно)';

  @override
  String get openDisputeTitle => 'Открыть спор';

  @override
  String get openDisputeHint => 'Опишите причину спора подробно';

  @override
  String get verificationRequired => 'Требуется верификация';

  @override
  String get verificationRequiredBody =>
      'Для принятия лидов необходимо пройти верификацию личности.';

  @override
  String get proofAttachedSnack =>
      'Чек прикреплён — ожидаем подтверждения автора';

  @override
  String get paymentConfirmedSnack =>
      'Получение подтверждено — лид переведён в архив';

  @override
  String get leadAcceptedSnack => 'Лид принят — телефон клиента теперь виден';

  @override
  String get leadClosedSnack => 'Лид закрыт успешно — вознаграждение начислено';

  @override
  String get leadCancelledSnack => 'Лид отменён';

  @override
  String get disputeOpenedSnack => 'Спор открыт';

  @override
  String get paymentToAuthorTitle => 'ПЕРЕВОД АВТОРУ';

  @override
  String get paymentToAuthorPrefix => 'Переведите автору:';

  @override
  String get phoneCopied => 'Номер скопирован';

  @override
  String get copyPhoneHint => 'Нажмите на номер, чтобы скопировать';

  @override
  String get proofTitle => 'ПОДТВЕРЖДЕНИЕ ОПЛАТЫ';

  @override
  String get proofBody =>
      'Переведите деньги и прикрепите скриншот или фото чека.';

  @override
  String get receiptLoadFailed => 'Не удалось загрузить чек';

  @override
  String get autoConfirmHint =>
      'Если не подтвердите в течение 5 дней — подтвердится автоматически';

  @override
  String get paymentMarkedTitle => 'ИСПОЛНИТЕЛЬ ОТМЕТИЛ ОПЛАТУ';

  @override
  String get paymentMarkedBody =>
      'Исполнитель прикрепил чек. Проверьте и подтвердите получение.';

  @override
  String get createLeadTitle => 'Новый лид';

  @override
  String get labelLeadType => 'Тип лида';

  @override
  String get typePickerHint => 'Выберите тип';

  @override
  String get typeRequired => 'Выберите тип лида';

  @override
  String get labelClientPhone => 'Телефон клиента';

  @override
  String get phoneValidationFull => 'Введите полный номер телефона';

  @override
  String get checkingDuplicates => 'Проверяем дубли...';

  @override
  String get checkError => 'Ошибка проверки. Повторите.';

  @override
  String get createLeadError => 'Ошибка создания лида';

  @override
  String get dupWarningTitle => 'Возможный дубль';

  @override
  String dupWarningBody(String type, String statusPart) {
    return 'На этот номер уже есть активный лид типа «$type»$statusPart.';
  }

  @override
  String dupWarningStatusPart(String status) {
    return ' ($status)';
  }

  @override
  String get labelClientName => 'Имя клиента';

  @override
  String get clientNameRequired => 'Введите имя клиента';

  @override
  String get labelServiceCity => 'Город, где нужна услуга';

  @override
  String get serviceCityHint =>
      'Где находится объект или нужна услуга — по этому городу подбирается местный специалист';

  @override
  String get labelDescription => 'Описание / суть запроса';

  @override
  String get descriptionPlaceholder =>
      'Опишите задачу клиента подробно: что именно нужно, условия, пожелания…';

  @override
  String get descriptionRequired => 'Добавьте описание';

  @override
  String get clientConsentText =>
      'Я подтверждаю, что получил согласие клиента на передачу его контактных данных';

  @override
  String get noPaymentHint =>
      'Перед созданием потребуется указать платёжные реквизиты.';

  @override
  String get leadCreatedSuccess => 'Лид создан!';

  @override
  String get leadCreatedSuccessHint =>
      'Спасибо! Мы подберём исполнителя и уведомим вас.';

  @override
  String get labelRole => 'Роль';

  @override
  String get roleSpecialist => 'Специалист';

  @override
  String get roleAdmin => 'Администратор';

  @override
  String get roleModerator => 'Модератор';

  @override
  String get roleCompany => 'Компания';

  @override
  String get paymentDetailsTitle => 'Платёжные реквизиты';

  @override
  String get notSpecified => 'Не указаны';

  @override
  String get verifiedStatus => 'Верифицированы ✓';

  @override
  String get pendingVerifStatus => 'Фото на проверке';

  @override
  String get rejectedVerifStatus => 'Верификация отклонена';

  @override
  String get notVerifiedStatus => 'Не верифицированы';

  @override
  String reasonPrefix(String reason) {
    return 'Причина: $reason';
  }

  @override
  String get pendingVerifHint => 'Мы уведомим вас о результате проверки.';

  @override
  String get guarantorCompanyTitle => 'Компания-гарант';

  @override
  String get currentGuarantor => 'Текущий гарант';

  @override
  String get membershipActive => 'Активен';

  @override
  String get membershipPending => 'Заявка на рассмотрении';

  @override
  String get membershipChangeHint => 'Заявка на смену на рассмотрении:';

  @override
  String get noCompany => 'Вы не привязаны к компании';

  @override
  String get verifyFirst => 'Сначала пройдите верификацию';

  @override
  String get pickCompanyTitle => 'Выберите компанию';

  @override
  String get companiesLoadFailed => 'Не удалось загрузить список компаний';

  @override
  String get noCompaniesAvailable => 'Нет доступных компаний';

  @override
  String applicationSent(String name) {
    return 'Заявка в «$name» отправлена';
  }

  @override
  String get applicationRevoked => 'Заявка отозвана';

  @override
  String get applicationError => 'Ошибка отправки заявки';

  @override
  String get avatarUploadError => 'Ошибка загрузки фото';

  @override
  String get avatarNoPermission => 'Нет прав для загрузки аватара';

  @override
  String get editProfileTitle => 'Редактировать профиль';

  @override
  String get editProfileLocked =>
      'Сейчас профиль изменить нельзя. Имя и фамилия заморожены после верификации. Специализацию и город нельзя менять, пока у вас есть лиды в работе.';

  @override
  String get nameLockedHint =>
      'Имя и фамилию нельзя изменить после верификации';

  @override
  String get lockedLeadsHint => 'Недоступно: у вас есть лиды в работе';

  @override
  String get saveError => 'Ошибка сохранения';

  @override
  String get labelBank => 'Банк';

  @override
  String get bankPickerHint => 'Выберите банк';

  @override
  String get bankRequired => 'Выберите банк';

  @override
  String get labelPaymentPhone => 'Номер для перевода';

  @override
  String get paymentPhoneHint =>
      'По умолчанию подставлен ваш номер входа. Можно изменить.';

  @override
  String get phoneRequired => 'Введите номер';

  @override
  String get paymentFormHint =>
      'Укажите реквизиты, на которые вы получаете вознаграждение за переданные лиды.';

  @override
  String get banksLoadFailed => 'Не удалось загрузить список банков';

  @override
  String get verificationTitle => 'Верификация';

  @override
  String get verificationStepsTitle => 'Как пройти верификацию';

  @override
  String get verificationStep1 => 'Возьмите удостоверение личности';

  @override
  String get verificationStep2 =>
      'Сфотографируйтесь рядом с ним так, чтобы было видно лицо и документ';

  @override
  String get verificationStep3 =>
      'Загрузите фото — модератор проверит его в течение 24 часов';

  @override
  String get verificationConsentText =>
      'Я даю согласие на обработку изображения моего документа, удостоверяющего личность, для целей верификации';

  @override
  String get uploadError => 'Ошибка загрузки файла';

  @override
  String get verifActiveTitle => 'Вы верифицированы';

  @override
  String get verifPendingTitle => 'Фото на проверке';

  @override
  String get verifRejectedTitle => 'Верификация отклонена';

  @override
  String get verifNotStartedTitle => 'Подтвердите личность';

  @override
  String get verifActiveSubtitle =>
      'Ваш аккаунт подтверждён — вы можете принимать лиды.';

  @override
  String get verifPendingSubtitle =>
      'Фото отправлено на проверку модератору.\nОжидайте — мы уведомим вас о результате.';

  @override
  String get verifRejectedSubtitle =>
      'Загрузите новое фото с удостоверением личности.';

  @override
  String get verifNotStartedSubtitle =>
      'Чтобы принимать лиды, подтвердите личность: сфотографируйтесь рядом с удостоверением.';

  @override
  String get notificationsTitle => 'Уведомления';

  @override
  String get noNotifications => 'Уведомлений пока нет';

  @override
  String get relTimeJustNow => 'только что';

  @override
  String relTimeMinutes(int n) {
    return '$n мин. назад';
  }

  @override
  String relTimeHours(int n) {
    return '$n ч. назад';
  }

  @override
  String get relTimeYesterday => 'вчера';

  @override
  String relTimeDays(int n) {
    return '$n дн. назад';
  }

  @override
  String get supportTitle => 'Поддержка';

  @override
  String get supportEmpty => 'Напишите нам — мы поможем';

  @override
  String get messageSendFailed => 'Не удалось отправить сообщение';

  @override
  String get messageHint => 'Сообщение...';

  @override
  String get tariffsTitle => 'Тарифы';

  @override
  String get tariffsLoadError => 'Не удалось загрузить тарифы';

  @override
  String get tariffsExplanation =>
      'Вознаграждение начисляется только за лид, по которому состоялась сделка. Если партнёр не закрыл договор — выплаты нет.';

  @override
  String get tariffsCalculatorTitle => 'КАЛЬКУЛЯТОР';

  @override
  String get tariffBaseCityHint => 'Базовый тариф (любой город)';

  @override
  String get tariffBaseCityLabel => 'Базовый тариф';

  @override
  String get priceOnRequest => 'Цена уточняется';

  @override
  String get priceOnRequestHint =>
      'Обратитесь к администратору для уточнения условий.';

  @override
  String get fixedRewardLabel => 'фиксированное вознаграждение за лид';

  @override
  String get percentRewardLabel => 'от комиссии по сделке';

  @override
  String get settingsLanguage => 'Язык';

  @override
  String get langRussian => 'Русский';

  @override
  String get langKazakh => 'Қазақша';

  @override
  String get monthJan => 'янв';

  @override
  String get monthFeb => 'фев';

  @override
  String get monthMar => 'мар';

  @override
  String get monthApr => 'апр';

  @override
  String get monthMay => 'май';

  @override
  String get monthJun => 'июн';

  @override
  String get monthJul => 'июл';

  @override
  String get monthAug => 'авг';

  @override
  String get monthSep => 'сен';

  @override
  String get monthOct => 'окт';

  @override
  String get monthNov => 'ноя';

  @override
  String get monthDec => 'дек';

  @override
  String get registerAppBarTitle => 'Регистрация';

  @override
  String get rewardConfirmedBanner => 'Вознаграждение получено и подтверждено';

  @override
  String closedAtLabel(String date) {
    return 'Завершено $date';
  }

  @override
  String get statsCardTitle => 'Статистика';

  @override
  String get deleteAccountBtn => 'Удалить аккаунт';

  @override
  String get deleteAccountDialogTitle => 'Удалить аккаунт?';

  @override
  String get deleteAccountDialogBody =>
      'Это действие необратимо. Будут удалены:\n• Профиль и фото\n• Платёжные реквизиты\n• Данные верификации\n\nЗаписи о сделках и вознаграждениях сохраняются в обезличенном виде.';

  @override
  String get deleteAccountConfirm => 'Удалить';

  @override
  String get deleteAccountCancel => 'Отмена';

  @override
  String get deleteAccountSuccess => 'Аккаунт удалён';

  @override
  String get deleteAccountLink => 'Подробнее об удалении аккаунта';

  @override
  String get avatarCropTitle => 'Обрезка фото';

  @override
  String get avatarCropDone => 'Готово';

  @override
  String get avatarCropCancel => 'Отмена';
}

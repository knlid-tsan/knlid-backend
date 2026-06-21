// ignore: unused_import
import 'package:intl/intl.dart' as intl;
import 'app_localizations.dart';

// ignore_for_file: type=lint

/// The translations for Kazakh (`kk`).
class AppLocalizationsKk extends AppLocalizations {
  AppLocalizationsKk([String locale = 'kk']) : super(locale);

  @override
  String get appSubtitle => 'МАМАНДАР АРАСЫНДА ЛИДТЕРДІ БЕРУ';

  @override
  String get btnLogin => 'Кіру';

  @override
  String get btnRegister => 'Тіркелу';

  @override
  String get btnContinue => 'Жалғастыру';

  @override
  String get btnSave => 'Сақтау';

  @override
  String get btnEdit => 'Өзгерту';

  @override
  String get btnCancel => 'Болдырмау';

  @override
  String get btnSend => 'Жіберу';

  @override
  String get btnLater => 'Кейінірек';

  @override
  String get btnAccept => 'Қабылдау';

  @override
  String get btnDecline => 'Қабылдамау';

  @override
  String get btnLogout => 'Шығу';

  @override
  String get btnCancelAction => 'Бас тарту';

  @override
  String get btnRetry => 'Қайталау';

  @override
  String get btnCreateLead => 'Лид құру';

  @override
  String get btnClose => '✓ Жабу';

  @override
  String get btnCloseDeal => '✓ Мәмілені жабу';

  @override
  String get btnOpenDispute => 'Дау ашу';

  @override
  String get btnGoVerify => 'Верификациядан өту';

  @override
  String get btnContract => '→ Шарт';

  @override
  String get btnDeposit => '→ Кепілпұл';

  @override
  String get btnConfirmClose => 'Жабуды растау';

  @override
  String get btnConfirmPayment => 'Алынғанын растау';

  @override
  String get btnAttachProof => 'Түбіртек тіркеу';

  @override
  String get btnAddPhoto => 'Фото қосу';

  @override
  String get btnEditProfile => 'Профильді өңдеу';

  @override
  String get btnSelectCompany => 'Компанияны таңдау';

  @override
  String get btnChangeCompany => 'Компанияны ауыстыру';

  @override
  String get btnRevokeChange => 'Ауыстыру өтінімін қайтару';

  @override
  String get btnRevokeApplication => 'Өтінімді қайтару';

  @override
  String get btnViewLeads => 'Лидтерді көру';

  @override
  String get btnUploadPhoto => 'Фото жүктеу';

  @override
  String get btnCreateAnyway => 'Бәрібір құру';

  @override
  String get btnGoVerification => 'Верификациядан өту →';

  @override
  String get btnReupload => 'Қайта жүктеу →';

  @override
  String get yes => 'Иә';

  @override
  String get no => 'Жоқ';

  @override
  String get uploading => 'Жүктелуде...';

  @override
  String get uploadingPhoto => 'Жүктеудеміз...';

  @override
  String get sourceCamera => 'Камера';

  @override
  String get sourceGallery => 'Галерея';

  @override
  String get phoneTitle => 'Телефон нөмірін енгізіңіз';

  @override
  String get phoneHint => 'Сізге WhatsApp арқылы растау коды жіберіледі';

  @override
  String get phoneLabel => 'Телефон нөмірі';

  @override
  String get phoneInvalid => 'Дұрыс нөмір енгізіңіз';

  @override
  String get otpTitleLogin => 'Кодты енгізіңіз';

  @override
  String get otpTitleRegister => 'Нөмірді растаңыз';

  @override
  String otpHint(String phone) {
    return 'WhatsApp арқылы $phone нөміріне код жіберілді';
  }

  @override
  String get otpDevHint =>
      'Әзірлеу режимі: кодты бэкенд логтарынан қараңыз (npm run start)';

  @override
  String get otpCodeInvalid => '6 таңбалы кодты енгізіңіз';

  @override
  String otpResendTimer(int seconds) {
    return '$seconds с кейін қайта жіберу';
  }

  @override
  String get otpResend => 'Қайта жіберу';

  @override
  String get otpRegisterHint => 'Осы нөмірмен тіркелу →';

  @override
  String get registerTitle => 'Өзіңіз туралы айтыңыз';

  @override
  String registerSubtitle(String phone) {
    return '$phone нөмірі тіркелмеген. Профильді толтырыңыз.';
  }

  @override
  String get labelFullName => 'Аты-жөні';

  @override
  String get fullNameRequired => 'Аты-жөніңізді енгізіңіз';

  @override
  String get labelSpecialization => 'Мамандық';

  @override
  String get specRequired => 'Мамандықты таңдаңыз';

  @override
  String get specRealtor => 'Риелтор';

  @override
  String get specMortgage => 'Ипотекалық брокер';

  @override
  String get specLawyer => 'Заңгер';

  @override
  String get labelCity => 'Қала';

  @override
  String get cityPickerHint => 'Қаланы таңдаңыз';

  @override
  String get cityRequired => 'Қаланы таңдаңыз';

  @override
  String get citiesLoadError => 'Қалаларды жүктеу мүмкін болмады';

  @override
  String get consentIAccept => 'Мен қабылдаймын';

  @override
  String get consentAnd => 'және';

  @override
  String get consentTerms => 'Пайдаланушы келісімін';

  @override
  String get consentPrivacy => 'Құпиялылық саясатын';

  @override
  String get navHome => 'Басты';

  @override
  String get navCreated => 'Берілгендер';

  @override
  String get navCreatedShort => 'Берілген';

  @override
  String get navAssigned => 'Орындаудамын';

  @override
  String get navAssignedShort => 'Жұмыста';

  @override
  String get navTariffs => 'Тарифтер';

  @override
  String get navProfile => 'Профиль';

  @override
  String get bannerPending =>
      'Верификация тексерілуде. Әзірге лидтерді қабылдай алмайсыз';

  @override
  String get bannerRejected =>
      'Верификация қабылданбады. Фотоны қайта жүктеңіз';

  @override
  String get bannerNotVerified =>
      'Сіз верификациядан өтпегенсіз — лидтерді қабылдай алмайсыз';

  @override
  String get bannerCta => 'Өту →';

  @override
  String get statsTitle => 'СТАТИСТИКА';

  @override
  String get statRating => 'Рейтинг';

  @override
  String get statSent => 'Берілді';

  @override
  String get statReceived => 'Қабылданды';

  @override
  String get statClosed => 'Жабылды';

  @override
  String get homeNoCreatedLeads => 'Сіз әлі лид берген жоқсыз';

  @override
  String get homeNoAssignedLeads => 'Сізде жұмыстағы лидтер жоқ';

  @override
  String get filterActive => 'Белсенді';

  @override
  String get filterDone => 'Аяқталған';

  @override
  String get createdEmptyDoneTitle => 'Аяқталған лидтер жоқ';

  @override
  String get createdEmptyActiveTitle => 'Белсенді лидтер жоқ';

  @override
  String get createdEmptyDoneHint => 'Аяқталған лидтер осында пайда болады';

  @override
  String get createdEmptyActiveHint =>
      'Алғашқы лидті беру үшін «Лид құру» түймесін басыңыз';

  @override
  String get assignedEmptyActiveTitle => 'Жұмыста белсенді лидтер жоқ';

  @override
  String get assignedEmptyActiveHint =>
      'Сізге тағайындалған лидтер осында пайда болады';

  @override
  String get noExecutor => 'Орындаушы тағайындалмаған';

  @override
  String get leadTypeOwner => 'Сату';

  @override
  String get leadTypeBuyer => 'Сатып алу';

  @override
  String get leadTypeMortgage => 'Ипотека';

  @override
  String get leadTypeLegal => 'Заң қызметі';

  @override
  String get leadStatusNew => 'Таңдауды күтуде';

  @override
  String get leadStatusPendingAcceptance => 'Қабылдауды күтуде';

  @override
  String get leadStatusInProgress => 'Жұмыста';

  @override
  String get leadStatusContract => 'Шарт';

  @override
  String get leadStatusDeposit => 'Кепілпұл';

  @override
  String get leadStatusClosedSuccess => 'Сәтті жабылды';

  @override
  String get leadStatusCancelled => 'Бас тартылды';

  @override
  String get leadStatusDispute => 'Дау';

  @override
  String get leadStatusArchived => 'Мұрағат';

  @override
  String get leadDetailTitle => 'Лид';

  @override
  String get sectionAuthor => 'Автор';

  @override
  String get sectionExecutor => 'Орындаушы';

  @override
  String get sectionClient => 'Клиент';

  @override
  String get sectionReward => 'Сыйақы';

  @override
  String get sectionGuarantor => 'Кепілгер';

  @override
  String get sectionDescription => 'СИПАТТАМА';

  @override
  String get rowName => 'Аты';

  @override
  String get rowLeadType => 'Лид түрі';

  @override
  String get rowCity => 'Қала';

  @override
  String get rowCreated => 'Құрылды';

  @override
  String get rowClosed => 'Жабылды';

  @override
  String get rowPhone => 'Телефон';

  @override
  String get rowAmount => 'Сома';

  @override
  String get rowPaid => 'Төленді';

  @override
  String get rowCompany => 'Компания';

  @override
  String get notAssigned => 'Тағайындалмаған';

  @override
  String get clientDataLocked =>
      'Клиент деректері лид қабылданғаннан кейін ашылады';

  @override
  String get historyTitle => 'МӘРТЕБЕЛЕР ТАРИХЫ';

  @override
  String get tariffBannerTitle => 'Сыйақы шарттары';

  @override
  String rewardAuthorLabel(String description) {
    return 'Авторға сыйақы: $description';
  }

  @override
  String get closeLeadTitle => 'Лидті сәтті жабу';

  @override
  String get rewardFixedHint =>
      'Сома бекітілген — комиссияны енгізудің қажеті жоқ';

  @override
  String get commissionLabel => 'Сіздің комиссияңыз, ₸';

  @override
  String get commissionHint => 'Мәміле бойынша комиссияңызды көрсетіңіз';

  @override
  String get percentCommissionHint => 'Авторға сыйақы осы сомадан есептеледі';

  @override
  String get fieldRequired => 'Міндетті өріс';

  @override
  String get amountPositive => '0-ден үлкен соманы енгізіңіз';

  @override
  String get declineLeadTitle => 'Лидті қабылдамау';

  @override
  String get declineLeadHint => 'Қабылдамау себебін көрсетіңіз';

  @override
  String get cancelLeadTitle => 'Лидті болдырмау';

  @override
  String get cancelLeadHint => 'Болдырмау себебін көрсетіңіз (міндетті)';

  @override
  String get openDisputeTitle => 'Дау ашу';

  @override
  String get openDisputeHint => 'Дау себебін толық сипаттаңыз';

  @override
  String get verificationRequired => 'Верификация қажет';

  @override
  String get verificationRequiredBody =>
      'Лидтерді қабылдау үшін жеке басты верификациядан өткізу қажет.';

  @override
  String get proofAttachedSnack =>
      'Түбіртек тіркелді — автордың растауын күтудеміз';

  @override
  String get paymentConfirmedSnack =>
      'Алынғаны расталды — лид мұрағатқа жіберілді';

  @override
  String get leadAcceptedSnack =>
      'Лид қабылданды — клиент телефоны енді көрінеді';

  @override
  String get leadClosedSnack => 'Лид сәтті жабылды — сыйақы есептелді';

  @override
  String get leadCancelledSnack => 'Лид болдырылмады';

  @override
  String get disputeOpenedSnack => 'Дау ашылды';

  @override
  String get paymentToAuthorTitle => 'АВТОРҒА АУДАРУ';

  @override
  String get paymentToAuthorPrefix => 'Авторға аударыңыз:';

  @override
  String get phoneCopied => 'Нөмір көшірілді';

  @override
  String get copyPhoneHint => 'Көшіру үшін нөмірді басыңыз';

  @override
  String get proofTitle => 'ТӨЛЕМДІ РАСТАУ';

  @override
  String get proofBody =>
      'Ақшаны аударып, скриншот немесе түбіртек фотосын тіркеңіз.';

  @override
  String get receiptLoadFailed => 'Түбіртекті жүктеу мүмкін болмады';

  @override
  String get autoConfirmHint =>
      '5 күн ішінде растамасаңыз — автоматты түрде расталады';

  @override
  String get paymentMarkedTitle => 'ОРЫНДАУШЫ ТӨЛЕМДІ БЕЛГІЛЕДІ';

  @override
  String get paymentMarkedBody =>
      'Орындаушы түбіртек тіркеді. Тексеріп, алынғанын растаңыз.';

  @override
  String get createLeadTitle => 'Жаңа лид';

  @override
  String get labelLeadType => 'Лид түрі';

  @override
  String get typePickerHint => 'Түрін таңдаңыз';

  @override
  String get typeRequired => 'Лид түрін таңдаңыз';

  @override
  String get labelClientPhone => 'Клиент телефоны';

  @override
  String get phoneValidationFull => 'Толық телефон нөмірін енгізіңіз';

  @override
  String get checkingDuplicates => 'Қайталануларды тексереміз...';

  @override
  String get checkError => 'Тексеру қатесі. Қайталаңыз.';

  @override
  String get createLeadError => 'Лид құру қатесі';

  @override
  String get dupWarningTitle => 'Ықтимал қайталану';

  @override
  String dupWarningBody(String type, String statusPart) {
    return 'Бұл нөмірге «$type» түріндегі белсенді лид бұрыннан бар$statusPart.';
  }

  @override
  String dupWarningStatusPart(String status) {
    return ' ($status)';
  }

  @override
  String get labelClientName => 'Клиент аты';

  @override
  String get clientNameRequired => 'Клиент атын енгізіңіз';

  @override
  String get labelServiceCity => 'Қызмет қажет қала';

  @override
  String get serviceCityHint =>
      'Нысан қай жерде немесе қызмет қай қалада қажет — осы қала бойынша жергілікті маман таңдалады';

  @override
  String get labelDescription => 'Сипаттама / сұраныс мәні';

  @override
  String get descriptionPlaceholder =>
      'Клиент тапсырмасын толық сипаттаңыз: нақты не қажет, шарттар, тілектер…';

  @override
  String get descriptionRequired => 'Сипаттама қосыңыз';

  @override
  String get clientConsentText =>
      'Клиенттің байланыс деректерін беруге оның келісімін алғанымды растаймын';

  @override
  String get noPaymentHint =>
      'Құру алдында төлем деректемелерін көрсету қажет болады.';

  @override
  String get leadCreatedSuccess => 'Лид құрылды!';

  @override
  String get leadCreatedSuccessHint =>
      'Рахмет! Біз орындаушыны таңдап, сізге хабарлаймыз.';

  @override
  String get labelRole => 'Рөл';

  @override
  String get roleSpecialist => 'Маман';

  @override
  String get roleAdmin => 'Әкімші';

  @override
  String get roleModerator => 'Модератор';

  @override
  String get roleCompany => 'Компания';

  @override
  String get paymentDetailsTitle => 'Төлем деректемелері';

  @override
  String get notSpecified => 'Көрсетілмеген';

  @override
  String get verifiedStatus => 'Верификацияланған ✓';

  @override
  String get pendingVerifStatus => 'Фото тексерілуде';

  @override
  String get rejectedVerifStatus => 'Верификация қабылданбады';

  @override
  String get notVerifiedStatus => 'Верификацияланбаған';

  @override
  String reasonPrefix(String reason) {
    return 'Себебі: $reason';
  }

  @override
  String get pendingVerifHint => 'Тексеру нәтижесі туралы хабарлаймыз.';

  @override
  String get guarantorCompanyTitle => 'Кепілгер компания';

  @override
  String get currentGuarantor => 'Ағымдағы кепілгер';

  @override
  String get membershipActive => 'Белсенді';

  @override
  String get membershipPending => 'Өтінім қаралуда';

  @override
  String get membershipChangeHint => 'Ауыстыру өтінімі қаралуда:';

  @override
  String get noCompany => 'Сіз компанияға байланбағансыз';

  @override
  String get verifyFirst => 'Алдымен верификациядан өтіңіз';

  @override
  String get pickCompanyTitle => 'Компанияны таңдаңыз';

  @override
  String get companiesLoadFailed => 'Компаниялар тізімін жүктеу мүмкін болмады';

  @override
  String get noCompaniesAvailable => 'Қолжетімді компаниялар жоқ';

  @override
  String applicationSent(String name) {
    return '«$name» компаниясына өтінім жіберілді';
  }

  @override
  String get applicationRevoked => 'Өтінім қайтарылды';

  @override
  String get applicationError => 'Өтінім жіберу қатесі';

  @override
  String get avatarUploadError => 'Фото жүктеу қатесі';

  @override
  String get avatarNoPermission => 'Аватар жүктеуге рұқсат жоқ';

  @override
  String get editProfileTitle => 'Профильді өңдеу';

  @override
  String get editProfileLocked =>
      'Қазір профильді өзгерту мүмкін емес. Аты-жөні верификациядан кейін бекітілген. Жұмыста лидтер болғанда мамандық пен қаланы өзгертуге болмайды.';

  @override
  String get nameLockedHint =>
      'Аты-жөнін верификациядан кейін өзгертуге болмайды';

  @override
  String get lockedLeadsHint => 'Қолжетімсіз: сізде жұмыста лидтер бар';

  @override
  String get saveError => 'Сақтау қатесі';

  @override
  String get labelBank => 'Банк';

  @override
  String get bankPickerHint => 'Банкті таңдаңыз';

  @override
  String get bankRequired => 'Банкті таңдаңыз';

  @override
  String get labelPaymentPhone => 'Аудару нөмірі';

  @override
  String get paymentPhoneHint =>
      'Әдепкі бойынша кіру нөміріңіз қойылған. Өзгертуге болады.';

  @override
  String get phoneRequired => 'Нөмірді енгізіңіз';

  @override
  String get paymentFormHint =>
      'Берілген лидтер үшін сыйақы алатын деректемелерді көрсетіңіз.';

  @override
  String get banksLoadFailed => 'Банктер тізімін жүктеу мүмкін болмады';

  @override
  String get verificationTitle => 'Верификация';

  @override
  String get verificationStepsTitle => 'Верификациядан қалай өту керек';

  @override
  String get verificationStep1 => 'Жеке куәлігіңізді алыңыз';

  @override
  String get verificationStep2 =>
      'Бет-әлпетіңіз бен құжат көрінетіндей етіп қасында суретке түсіңіз';

  @override
  String get verificationStep3 =>
      'Фотоны жүктеңіз — модератор оны 24 сағат ішінде тексереді';

  @override
  String get verificationConsentText =>
      'Верификация мақсатында жеке басымды куәландыратын құжат бейнесін өңдеуге келісім беремін';

  @override
  String get uploadError => 'Файл жүктеу қатесі';

  @override
  String get verifActiveTitle => 'Сіз верификациядан өттіңіз';

  @override
  String get verifPendingTitle => 'Фото тексерілуде';

  @override
  String get verifRejectedTitle => 'Верификация қабылданбады';

  @override
  String get verifNotStartedTitle => 'Жеке басыңызды растаңыз';

  @override
  String get verifActiveSubtitle =>
      'Аккаунтыңыз расталды — сіз лидтерді қабылдай аласыз.';

  @override
  String get verifPendingSubtitle =>
      'Фото модераторға тексеруге жіберілді. Күтіңіз — нәтиже туралы хабарлаймыз.';

  @override
  String get verifRejectedSubtitle => 'Жеке куәлігіңізбен жаңа фото жүктеңіз.';

  @override
  String get verifNotStartedSubtitle =>
      'Лидтерді қабылдау үшін жеке басыңызды растаңыз: куәлігіңіздің қасында суретке түсіңіз.';

  @override
  String get notificationsTitle => 'Хабарландырулар';

  @override
  String get noNotifications => 'Әзірге хабарландырулар жоқ';

  @override
  String get relTimeJustNow => 'жаңа ғана';

  @override
  String relTimeMinutes(int n) {
    return '$n мин. бұрын';
  }

  @override
  String relTimeHours(int n) {
    return '$n сағ. бұрын';
  }

  @override
  String get relTimeYesterday => 'кеше';

  @override
  String relTimeDays(int n) {
    return '$n күн бұрын';
  }

  @override
  String get supportTitle => 'Қолдау';

  @override
  String get supportEmpty => 'Бізге жазыңыз — біз көмектесеміз';

  @override
  String get messageSendFailed => 'Хабарламаны жіберу мүмкін болмады';

  @override
  String get messageHint => 'Хабарлама...';

  @override
  String get tariffsTitle => 'Тарифтер';

  @override
  String get tariffsLoadError => 'Тарифтерді жүктеу мүмкін болмады';

  @override
  String get tariffsExplanation =>
      'Сыйақы тек мәміле жасалған лид үшін есептеледі. Егер серіктес шартты жаппаса — төлем жоқ.';

  @override
  String get tariffsCalculatorTitle => 'КАЛЬКУЛЯТОР';

  @override
  String get tariffBaseCityHint => 'Базалық тариф (кез келген қала)';

  @override
  String get tariffBaseCityLabel => 'Базалық тариф';

  @override
  String get priceOnRequest => 'Баға нақтыланады';

  @override
  String get priceOnRequestHint =>
      'Шарттарды нақтылау үшін әкімшіге хабарласыңыз.';

  @override
  String get fixedRewardLabel => 'лид үшін бекітілген сыйақы';

  @override
  String get percentRewardLabel => 'мәміле комиссиясынан';

  @override
  String get settingsLanguage => 'Тіл';

  @override
  String get langRussian => 'Русский';

  @override
  String get langKazakh => 'Қазақша';

  @override
  String get monthJan => 'қаң';

  @override
  String get monthFeb => 'ақп';

  @override
  String get monthMar => 'нау';

  @override
  String get monthApr => 'сәу';

  @override
  String get monthMay => 'мам';

  @override
  String get monthJun => 'мау';

  @override
  String get monthJul => 'шіл';

  @override
  String get monthAug => 'там';

  @override
  String get monthSep => 'қыр';

  @override
  String get monthOct => 'қаз';

  @override
  String get monthNov => 'қар';

  @override
  String get monthDec => 'желт';

  @override
  String get registerAppBarTitle => 'Тіркелу';

  @override
  String get rewardConfirmedBanner => 'Сыйақы алынды және расталды';

  @override
  String closedAtLabel(String date) {
    return '$date аяқталды';
  }

  @override
  String get statsCardTitle => 'Статистика';

  @override
  String get deleteAccountBtn => 'Аккаунтты жою';

  @override
  String get deleteAccountDialogTitle => 'Аккаунтты жою керек пе?';

  @override
  String get deleteAccountDialogBody =>
      'Бұл әрекетті қайтару мүмкін емес. Жойылады:\n• Профиль және фотолар\n• Төлем деректемелері\n• Верификация деректері\n\nМәмілелер мен сыйақылар туралы жазбалар жасырын түрде сақталады.';

  @override
  String get deleteAccountConfirm => 'Жою';

  @override
  String get deleteAccountCancel => 'Болдырмау';

  @override
  String get deleteAccountSuccess => 'Аккаунт жойылды';

  @override
  String get deleteAccountLink => 'Аккаунтты жою туралы толығырақ';
}

import 'dart:async';

import 'package:flutter/foundation.dart';
import 'package:flutter/widgets.dart';
import 'package:flutter_localizations/flutter_localizations.dart';
import 'package:intl/intl.dart' as intl;

import 'app_localizations_kk.dart';
import 'app_localizations_ru.dart';

// ignore_for_file: type=lint

/// Callers can lookup localized strings with an instance of AppLocalizations
/// returned by `AppLocalizations.of(context)`.
///
/// Applications need to include `AppLocalizations.delegate()` in their app's
/// `localizationDelegates` list, and the locales they support in the app's
/// `supportedLocales` list. For example:
///
/// ```dart
/// import 'l10n/app_localizations.dart';
///
/// return MaterialApp(
///   localizationsDelegates: AppLocalizations.localizationsDelegates,
///   supportedLocales: AppLocalizations.supportedLocales,
///   home: MyApplicationHome(),
/// );
/// ```
///
/// ## Update pubspec.yaml
///
/// Please make sure to update your pubspec.yaml to include the following
/// packages:
///
/// ```yaml
/// dependencies:
///   # Internationalization support.
///   flutter_localizations:
///     sdk: flutter
///   intl: any # Use the pinned version from flutter_localizations
///
///   # Rest of dependencies
/// ```
///
/// ## iOS Applications
///
/// iOS applications define key application metadata, including supported
/// locales, in an Info.plist file that is built into the application bundle.
/// To configure the locales supported by your app, you’ll need to edit this
/// file.
///
/// First, open your project’s ios/Runner.xcworkspace Xcode workspace file.
/// Then, in the Project Navigator, open the Info.plist file under the Runner
/// project’s Runner folder.
///
/// Next, select the Information Property List item, select Add Item from the
/// Editor menu, then select Localizations from the pop-up menu.
///
/// Select and expand the newly-created Localizations item then, for each
/// locale your application supports, add a new item and select the locale
/// you wish to add from the pop-up menu in the Value field. This list should
/// be consistent with the languages listed in the AppLocalizations.supportedLocales
/// property.
abstract class AppLocalizations {
  AppLocalizations(String locale)
    : localeName = intl.Intl.canonicalizedLocale(locale.toString());

  final String localeName;

  static AppLocalizations? of(BuildContext context) {
    return Localizations.of<AppLocalizations>(context, AppLocalizations);
  }

  static const LocalizationsDelegate<AppLocalizations> delegate =
      _AppLocalizationsDelegate();

  /// A list of this localizations delegate along with the default localizations
  /// delegates.
  ///
  /// Returns a list of localizations delegates containing this delegate along with
  /// GlobalMaterialLocalizations.delegate, GlobalCupertinoLocalizations.delegate,
  /// and GlobalWidgetsLocalizations.delegate.
  ///
  /// Additional delegates can be added by appending to this list in
  /// MaterialApp. This list does not have to be used at all if a custom list
  /// of delegates is preferred or required.
  static const List<LocalizationsDelegate<dynamic>> localizationsDelegates =
      <LocalizationsDelegate<dynamic>>[
        delegate,
        GlobalMaterialLocalizations.delegate,
        GlobalCupertinoLocalizations.delegate,
        GlobalWidgetsLocalizations.delegate,
      ];

  /// A list of this localizations delegate's supported locales.
  static const List<Locale> supportedLocales = <Locale>[
    Locale('kk'),
    Locale('ru'),
  ];

  /// No description provided for @appSubtitle.
  ///
  /// In ru, this message translates to:
  /// **'ПЕРЕДАЧА ЛИДОВ МЕЖДУ СПЕЦИАЛИСТАМИ'**
  String get appSubtitle;

  /// No description provided for @btnLogin.
  ///
  /// In ru, this message translates to:
  /// **'Войти'**
  String get btnLogin;

  /// No description provided for @btnRegister.
  ///
  /// In ru, this message translates to:
  /// **'Зарегистрироваться'**
  String get btnRegister;

  /// No description provided for @btnContinue.
  ///
  /// In ru, this message translates to:
  /// **'Продолжить'**
  String get btnContinue;

  /// No description provided for @btnSave.
  ///
  /// In ru, this message translates to:
  /// **'Сохранить'**
  String get btnSave;

  /// No description provided for @btnEdit.
  ///
  /// In ru, this message translates to:
  /// **'Изменить'**
  String get btnEdit;

  /// No description provided for @btnCancel.
  ///
  /// In ru, this message translates to:
  /// **'Отмена'**
  String get btnCancel;

  /// No description provided for @btnSend.
  ///
  /// In ru, this message translates to:
  /// **'Отправить'**
  String get btnSend;

  /// No description provided for @btnLater.
  ///
  /// In ru, this message translates to:
  /// **'Позже'**
  String get btnLater;

  /// No description provided for @btnAccept.
  ///
  /// In ru, this message translates to:
  /// **'Принять'**
  String get btnAccept;

  /// No description provided for @btnDecline.
  ///
  /// In ru, this message translates to:
  /// **'Отклонить'**
  String get btnDecline;

  /// No description provided for @btnLogout.
  ///
  /// In ru, this message translates to:
  /// **'Выйти'**
  String get btnLogout;

  /// No description provided for @btnCancelAction.
  ///
  /// In ru, this message translates to:
  /// **'Отменить'**
  String get btnCancelAction;

  /// No description provided for @btnRetry.
  ///
  /// In ru, this message translates to:
  /// **'Повторить'**
  String get btnRetry;

  /// No description provided for @btnCreateLead.
  ///
  /// In ru, this message translates to:
  /// **'Создать лид'**
  String get btnCreateLead;

  /// No description provided for @btnClose.
  ///
  /// In ru, this message translates to:
  /// **'✓ Закрыть'**
  String get btnClose;

  /// No description provided for @btnCloseDeal.
  ///
  /// In ru, this message translates to:
  /// **'✓ Закрыть сделку'**
  String get btnCloseDeal;

  /// No description provided for @btnOpenDispute.
  ///
  /// In ru, this message translates to:
  /// **'Открыть спор'**
  String get btnOpenDispute;

  /// No description provided for @btnGoVerify.
  ///
  /// In ru, this message translates to:
  /// **'Пройти верификацию'**
  String get btnGoVerify;

  /// No description provided for @btnContract.
  ///
  /// In ru, this message translates to:
  /// **'→ Договор'**
  String get btnContract;

  /// No description provided for @btnDeposit.
  ///
  /// In ru, this message translates to:
  /// **'→ Задаток'**
  String get btnDeposit;

  /// No description provided for @btnConfirmClose.
  ///
  /// In ru, this message translates to:
  /// **'Подтвердить закрытие'**
  String get btnConfirmClose;

  /// No description provided for @btnConfirmPayment.
  ///
  /// In ru, this message translates to:
  /// **'Подтвердить получение'**
  String get btnConfirmPayment;

  /// No description provided for @btnAttachProof.
  ///
  /// In ru, this message translates to:
  /// **'Прикрепить чек'**
  String get btnAttachProof;

  /// No description provided for @btnAddPhoto.
  ///
  /// In ru, this message translates to:
  /// **'Добавить фото'**
  String get btnAddPhoto;

  /// No description provided for @btnEditProfile.
  ///
  /// In ru, this message translates to:
  /// **'Редактировать профиль'**
  String get btnEditProfile;

  /// No description provided for @btnSelectCompany.
  ///
  /// In ru, this message translates to:
  /// **'Выбрать компанию'**
  String get btnSelectCompany;

  /// No description provided for @btnChangeCompany.
  ///
  /// In ru, this message translates to:
  /// **'Сменить компанию'**
  String get btnChangeCompany;

  /// No description provided for @btnRevokeChange.
  ///
  /// In ru, this message translates to:
  /// **'Отозвать заявку на смену'**
  String get btnRevokeChange;

  /// No description provided for @btnRevokeApplication.
  ///
  /// In ru, this message translates to:
  /// **'Отозвать заявку'**
  String get btnRevokeApplication;

  /// No description provided for @btnViewLeads.
  ///
  /// In ru, this message translates to:
  /// **'Посмотреть лиды'**
  String get btnViewLeads;

  /// No description provided for @btnUploadPhoto.
  ///
  /// In ru, this message translates to:
  /// **'Загрузить фото'**
  String get btnUploadPhoto;

  /// No description provided for @btnCreateAnyway.
  ///
  /// In ru, this message translates to:
  /// **'Создать всё равно'**
  String get btnCreateAnyway;

  /// No description provided for @btnGoVerification.
  ///
  /// In ru, this message translates to:
  /// **'Пройти верификацию →'**
  String get btnGoVerification;

  /// No description provided for @btnReupload.
  ///
  /// In ru, this message translates to:
  /// **'Загрузить заново →'**
  String get btnReupload;

  /// No description provided for @yes.
  ///
  /// In ru, this message translates to:
  /// **'Да'**
  String get yes;

  /// No description provided for @no.
  ///
  /// In ru, this message translates to:
  /// **'Нет'**
  String get no;

  /// No description provided for @uploading.
  ///
  /// In ru, this message translates to:
  /// **'Загрузка...'**
  String get uploading;

  /// No description provided for @uploadingPhoto.
  ///
  /// In ru, this message translates to:
  /// **'Загружаем...'**
  String get uploadingPhoto;

  /// No description provided for @sourceCamera.
  ///
  /// In ru, this message translates to:
  /// **'Камера'**
  String get sourceCamera;

  /// No description provided for @sourceGallery.
  ///
  /// In ru, this message translates to:
  /// **'Галерея'**
  String get sourceGallery;

  /// No description provided for @phoneTitle.
  ///
  /// In ru, this message translates to:
  /// **'Введите номер телефона'**
  String get phoneTitle;

  /// No description provided for @phoneHint.
  ///
  /// In ru, this message translates to:
  /// **'Вам будет отправлен код подтверждения в WhatsApp'**
  String get phoneHint;

  /// No description provided for @phoneLabel.
  ///
  /// In ru, this message translates to:
  /// **'Номер телефона'**
  String get phoneLabel;

  /// No description provided for @phoneInvalid.
  ///
  /// In ru, this message translates to:
  /// **'Введите корректный номер'**
  String get phoneInvalid;

  /// No description provided for @otpTitleLogin.
  ///
  /// In ru, this message translates to:
  /// **'Введите код'**
  String get otpTitleLogin;

  /// No description provided for @otpTitleRegister.
  ///
  /// In ru, this message translates to:
  /// **'Подтвердите номер'**
  String get otpTitleRegister;

  /// No description provided for @otpHint.
  ///
  /// In ru, this message translates to:
  /// **'Код отправлен в WhatsApp на номер {phone}'**
  String otpHint(String phone);

  /// No description provided for @otpDevHint.
  ///
  /// In ru, this message translates to:
  /// **'Режим разработки: код смотрите в логах бэкенда (npm run start)'**
  String get otpDevHint;

  /// No description provided for @otpCodeInvalid.
  ///
  /// In ru, this message translates to:
  /// **'Введите 6-значный код'**
  String get otpCodeInvalid;

  /// No description provided for @otpResendTimer.
  ///
  /// In ru, this message translates to:
  /// **'Отправить повторно через {seconds} с'**
  String otpResendTimer(int seconds);

  /// No description provided for @otpResend.
  ///
  /// In ru, this message translates to:
  /// **'Отправить повторно'**
  String get otpResend;

  /// No description provided for @otpRegisterHint.
  ///
  /// In ru, this message translates to:
  /// **'Зарегистрироваться с этим номером →'**
  String get otpRegisterHint;

  /// No description provided for @registerTitle.
  ///
  /// In ru, this message translates to:
  /// **'Расскажите о себе'**
  String get registerTitle;

  /// No description provided for @registerSubtitle.
  ///
  /// In ru, this message translates to:
  /// **'Номер {phone} не зарегистрирован. Заполните профиль.'**
  String registerSubtitle(String phone);

  /// No description provided for @labelFullName.
  ///
  /// In ru, this message translates to:
  /// **'Имя и фамилия'**
  String get labelFullName;

  /// No description provided for @fullNameRequired.
  ///
  /// In ru, this message translates to:
  /// **'Введите имя и фамилию'**
  String get fullNameRequired;

  /// No description provided for @labelSpecialization.
  ///
  /// In ru, this message translates to:
  /// **'Специализация'**
  String get labelSpecialization;

  /// No description provided for @specRequired.
  ///
  /// In ru, this message translates to:
  /// **'Выберите специализацию'**
  String get specRequired;

  /// No description provided for @specRealtor.
  ///
  /// In ru, this message translates to:
  /// **'Риелтор'**
  String get specRealtor;

  /// No description provided for @specMortgage.
  ///
  /// In ru, this message translates to:
  /// **'Ипотечный брокер'**
  String get specMortgage;

  /// No description provided for @specLawyer.
  ///
  /// In ru, this message translates to:
  /// **'Юрист'**
  String get specLawyer;

  /// No description provided for @labelCity.
  ///
  /// In ru, this message translates to:
  /// **'Город'**
  String get labelCity;

  /// No description provided for @cityPickerHint.
  ///
  /// In ru, this message translates to:
  /// **'Выберите город'**
  String get cityPickerHint;

  /// No description provided for @cityRequired.
  ///
  /// In ru, this message translates to:
  /// **'Выберите город'**
  String get cityRequired;

  /// No description provided for @citiesLoadError.
  ///
  /// In ru, this message translates to:
  /// **'Не удалось загрузить города'**
  String get citiesLoadError;

  /// No description provided for @consentIAccept.
  ///
  /// In ru, this message translates to:
  /// **'Я принимаю'**
  String get consentIAccept;

  /// No description provided for @consentAnd.
  ///
  /// In ru, this message translates to:
  /// **'и'**
  String get consentAnd;

  /// No description provided for @consentTerms.
  ///
  /// In ru, this message translates to:
  /// **'Пользовательское соглашение'**
  String get consentTerms;

  /// No description provided for @consentPrivacy.
  ///
  /// In ru, this message translates to:
  /// **'Политику конфиденциальности'**
  String get consentPrivacy;

  /// No description provided for @navHome.
  ///
  /// In ru, this message translates to:
  /// **'Главная'**
  String get navHome;

  /// No description provided for @navCreated.
  ///
  /// In ru, this message translates to:
  /// **'Переданные'**
  String get navCreated;

  /// No description provided for @navCreatedShort.
  ///
  /// In ru, this message translates to:
  /// **'Переданные'**
  String get navCreatedShort;

  /// No description provided for @navAssigned.
  ///
  /// In ru, this message translates to:
  /// **'Исполняю'**
  String get navAssigned;

  /// No description provided for @navAssignedShort.
  ///
  /// In ru, this message translates to:
  /// **'Исполняю'**
  String get navAssignedShort;

  /// No description provided for @navTariffs.
  ///
  /// In ru, this message translates to:
  /// **'Тарифы'**
  String get navTariffs;

  /// No description provided for @navProfile.
  ///
  /// In ru, this message translates to:
  /// **'Профиль'**
  String get navProfile;

  /// No description provided for @bannerPending.
  ///
  /// In ru, this message translates to:
  /// **'Верификация на проверке. Пока вы не можете принимать лиды'**
  String get bannerPending;

  /// No description provided for @bannerRejected.
  ///
  /// In ru, this message translates to:
  /// **'Верификация отклонена. Загрузите фото заново'**
  String get bannerRejected;

  /// No description provided for @bannerNotVerified.
  ///
  /// In ru, this message translates to:
  /// **'Вы не верифицированы — не можете принимать лиды'**
  String get bannerNotVerified;

  /// No description provided for @bannerCta.
  ///
  /// In ru, this message translates to:
  /// **'Пройти →'**
  String get bannerCta;

  /// No description provided for @statsTitle.
  ///
  /// In ru, this message translates to:
  /// **'СТАТИСТИКА'**
  String get statsTitle;

  /// No description provided for @statRating.
  ///
  /// In ru, this message translates to:
  /// **'Рейтинг'**
  String get statRating;

  /// No description provided for @statSent.
  ///
  /// In ru, this message translates to:
  /// **'Передано'**
  String get statSent;

  /// No description provided for @statReceived.
  ///
  /// In ru, this message translates to:
  /// **'Принято'**
  String get statReceived;

  /// No description provided for @statClosed.
  ///
  /// In ru, this message translates to:
  /// **'Закрыто'**
  String get statClosed;

  /// No description provided for @homeNoCreatedLeads.
  ///
  /// In ru, this message translates to:
  /// **'Вы ещё не передавали лиды'**
  String get homeNoCreatedLeads;

  /// No description provided for @homeNoAssignedLeads.
  ///
  /// In ru, this message translates to:
  /// **'У вас нет лидов в работе'**
  String get homeNoAssignedLeads;

  /// No description provided for @filterActive.
  ///
  /// In ru, this message translates to:
  /// **'Активные'**
  String get filterActive;

  /// No description provided for @filterDone.
  ///
  /// In ru, this message translates to:
  /// **'Завершённые'**
  String get filterDone;

  /// No description provided for @createdEmptyDoneTitle.
  ///
  /// In ru, this message translates to:
  /// **'Нет завершённых лидов'**
  String get createdEmptyDoneTitle;

  /// No description provided for @createdEmptyActiveTitle.
  ///
  /// In ru, this message translates to:
  /// **'Нет активных лидов'**
  String get createdEmptyActiveTitle;

  /// No description provided for @createdEmptyDoneHint.
  ///
  /// In ru, this message translates to:
  /// **'Завершённые лиды появятся здесь'**
  String get createdEmptyDoneHint;

  /// No description provided for @createdEmptyActiveHint.
  ///
  /// In ru, this message translates to:
  /// **'Нажмите «Создать лид», чтобы передать первый'**
  String get createdEmptyActiveHint;

  /// No description provided for @assignedEmptyActiveTitle.
  ///
  /// In ru, this message translates to:
  /// **'Нет активных лидов в работе'**
  String get assignedEmptyActiveTitle;

  /// No description provided for @assignedEmptyActiveHint.
  ///
  /// In ru, this message translates to:
  /// **'Здесь появятся лиды, назначенные вам'**
  String get assignedEmptyActiveHint;

  /// No description provided for @noExecutor.
  ///
  /// In ru, this message translates to:
  /// **'Исполнитель не назначен'**
  String get noExecutor;

  /// No description provided for @leadTypeOwner.
  ///
  /// In ru, this message translates to:
  /// **'Продажа'**
  String get leadTypeOwner;

  /// No description provided for @leadTypeBuyer.
  ///
  /// In ru, this message translates to:
  /// **'Покупка'**
  String get leadTypeBuyer;

  /// No description provided for @leadTypeMortgage.
  ///
  /// In ru, this message translates to:
  /// **'Ипотека'**
  String get leadTypeMortgage;

  /// No description provided for @leadTypeLegal.
  ///
  /// In ru, this message translates to:
  /// **'Юр. услуга'**
  String get leadTypeLegal;

  /// No description provided for @leadStatusNew.
  ///
  /// In ru, this message translates to:
  /// **'Ожидает подбора'**
  String get leadStatusNew;

  /// No description provided for @leadStatusPendingAcceptance.
  ///
  /// In ru, this message translates to:
  /// **'Ожидает принятия'**
  String get leadStatusPendingAcceptance;

  /// No description provided for @leadStatusInProgress.
  ///
  /// In ru, this message translates to:
  /// **'В работе'**
  String get leadStatusInProgress;

  /// No description provided for @leadStatusContract.
  ///
  /// In ru, this message translates to:
  /// **'Договор'**
  String get leadStatusContract;

  /// No description provided for @leadStatusDeposit.
  ///
  /// In ru, this message translates to:
  /// **'Задаток'**
  String get leadStatusDeposit;

  /// No description provided for @leadStatusClosedSuccess.
  ///
  /// In ru, this message translates to:
  /// **'Закрыт успешно'**
  String get leadStatusClosedSuccess;

  /// No description provided for @leadStatusCancelled.
  ///
  /// In ru, this message translates to:
  /// **'Отменён'**
  String get leadStatusCancelled;

  /// No description provided for @leadStatusDispute.
  ///
  /// In ru, this message translates to:
  /// **'Спор'**
  String get leadStatusDispute;

  /// No description provided for @leadStatusArchived.
  ///
  /// In ru, this message translates to:
  /// **'Архив'**
  String get leadStatusArchived;

  /// No description provided for @leadDetailTitle.
  ///
  /// In ru, this message translates to:
  /// **'Лид'**
  String get leadDetailTitle;

  /// No description provided for @sectionAuthor.
  ///
  /// In ru, this message translates to:
  /// **'Автор'**
  String get sectionAuthor;

  /// No description provided for @sectionExecutor.
  ///
  /// In ru, this message translates to:
  /// **'Исполнитель'**
  String get sectionExecutor;

  /// No description provided for @sectionClient.
  ///
  /// In ru, this message translates to:
  /// **'Клиент'**
  String get sectionClient;

  /// No description provided for @sectionReward.
  ///
  /// In ru, this message translates to:
  /// **'Вознаграждение'**
  String get sectionReward;

  /// No description provided for @sectionGuarantor.
  ///
  /// In ru, this message translates to:
  /// **'Гарант'**
  String get sectionGuarantor;

  /// No description provided for @sectionDescription.
  ///
  /// In ru, this message translates to:
  /// **'ОПИСАНИЕ'**
  String get sectionDescription;

  /// No description provided for @rowName.
  ///
  /// In ru, this message translates to:
  /// **'Имя'**
  String get rowName;

  /// No description provided for @rowLeadType.
  ///
  /// In ru, this message translates to:
  /// **'Тип лида'**
  String get rowLeadType;

  /// No description provided for @rowCity.
  ///
  /// In ru, this message translates to:
  /// **'Город'**
  String get rowCity;

  /// No description provided for @rowCreated.
  ///
  /// In ru, this message translates to:
  /// **'Создан'**
  String get rowCreated;

  /// No description provided for @rowClosed.
  ///
  /// In ru, this message translates to:
  /// **'Закрыт'**
  String get rowClosed;

  /// No description provided for @rowPhone.
  ///
  /// In ru, this message translates to:
  /// **'Телефон'**
  String get rowPhone;

  /// No description provided for @rowAmount.
  ///
  /// In ru, this message translates to:
  /// **'Сумма'**
  String get rowAmount;

  /// No description provided for @rowPaid.
  ///
  /// In ru, this message translates to:
  /// **'Оплачено'**
  String get rowPaid;

  /// No description provided for @rowCompany.
  ///
  /// In ru, this message translates to:
  /// **'Компания'**
  String get rowCompany;

  /// No description provided for @notAssigned.
  ///
  /// In ru, this message translates to:
  /// **'Не назначен'**
  String get notAssigned;

  /// No description provided for @clientDataLocked.
  ///
  /// In ru, this message translates to:
  /// **'Данные клиента откроются после принятия лида'**
  String get clientDataLocked;

  /// No description provided for @historyTitle.
  ///
  /// In ru, this message translates to:
  /// **'ИСТОРИЯ СТАТУСОВ'**
  String get historyTitle;

  /// No description provided for @tariffBannerTitle.
  ///
  /// In ru, this message translates to:
  /// **'Условия вознаграждения'**
  String get tariffBannerTitle;

  /// No description provided for @rewardAuthorLabel.
  ///
  /// In ru, this message translates to:
  /// **'Вознаграждение автору: {description}'**
  String rewardAuthorLabel(String description);

  /// No description provided for @closeLeadTitle.
  ///
  /// In ru, this message translates to:
  /// **'Закрыть лид успешно'**
  String get closeLeadTitle;

  /// No description provided for @rewardFixedHint.
  ///
  /// In ru, this message translates to:
  /// **'Сумма фиксирована — вводить комиссию не нужно'**
  String get rewardFixedHint;

  /// No description provided for @commissionLabel.
  ///
  /// In ru, this message translates to:
  /// **'Ваша комиссия, ₸'**
  String get commissionLabel;

  /// No description provided for @commissionHint.
  ///
  /// In ru, this message translates to:
  /// **'Укажите вашу комиссию по сделке'**
  String get commissionHint;

  /// No description provided for @percentCommissionHint.
  ///
  /// In ru, this message translates to:
  /// **'Вознаграждение автору рассчитается от этой суммы'**
  String get percentCommissionHint;

  /// No description provided for @fieldRequired.
  ///
  /// In ru, this message translates to:
  /// **'Обязательное поле'**
  String get fieldRequired;

  /// No description provided for @amountPositive.
  ///
  /// In ru, this message translates to:
  /// **'Введите сумму больше 0'**
  String get amountPositive;

  /// No description provided for @declineLeadTitle.
  ///
  /// In ru, this message translates to:
  /// **'Отклонить лид'**
  String get declineLeadTitle;

  /// No description provided for @declineLeadHint.
  ///
  /// In ru, this message translates to:
  /// **'Укажите причину отклонения'**
  String get declineLeadHint;

  /// No description provided for @cancelLeadTitle.
  ///
  /// In ru, this message translates to:
  /// **'Отменить лид'**
  String get cancelLeadTitle;

  /// No description provided for @cancelLeadHint.
  ///
  /// In ru, this message translates to:
  /// **'Укажите причину отмены (обязательно)'**
  String get cancelLeadHint;

  /// No description provided for @openDisputeTitle.
  ///
  /// In ru, this message translates to:
  /// **'Открыть спор'**
  String get openDisputeTitle;

  /// No description provided for @openDisputeHint.
  ///
  /// In ru, this message translates to:
  /// **'Опишите причину спора подробно'**
  String get openDisputeHint;

  /// No description provided for @verificationRequired.
  ///
  /// In ru, this message translates to:
  /// **'Требуется верификация'**
  String get verificationRequired;

  /// No description provided for @verificationRequiredBody.
  ///
  /// In ru, this message translates to:
  /// **'Для принятия лидов необходимо пройти верификацию личности.'**
  String get verificationRequiredBody;

  /// No description provided for @proofAttachedSnack.
  ///
  /// In ru, this message translates to:
  /// **'Чек прикреплён — ожидаем подтверждения автора'**
  String get proofAttachedSnack;

  /// No description provided for @paymentConfirmedSnack.
  ///
  /// In ru, this message translates to:
  /// **'Получение подтверждено — лид переведён в архив'**
  String get paymentConfirmedSnack;

  /// No description provided for @leadAcceptedSnack.
  ///
  /// In ru, this message translates to:
  /// **'Лид принят — телефон клиента теперь виден'**
  String get leadAcceptedSnack;

  /// No description provided for @leadClosedSnack.
  ///
  /// In ru, this message translates to:
  /// **'Лид закрыт успешно — вознаграждение начислено'**
  String get leadClosedSnack;

  /// No description provided for @leadCancelledSnack.
  ///
  /// In ru, this message translates to:
  /// **'Лид отменён'**
  String get leadCancelledSnack;

  /// No description provided for @disputeOpenedSnack.
  ///
  /// In ru, this message translates to:
  /// **'Спор открыт'**
  String get disputeOpenedSnack;

  /// No description provided for @paymentToAuthorTitle.
  ///
  /// In ru, this message translates to:
  /// **'ПЕРЕВОД АВТОРУ'**
  String get paymentToAuthorTitle;

  /// No description provided for @paymentToAuthorPrefix.
  ///
  /// In ru, this message translates to:
  /// **'Переведите автору:'**
  String get paymentToAuthorPrefix;

  /// No description provided for @phoneCopied.
  ///
  /// In ru, this message translates to:
  /// **'Номер скопирован'**
  String get phoneCopied;

  /// No description provided for @copyPhoneHint.
  ///
  /// In ru, this message translates to:
  /// **'Нажмите на номер, чтобы скопировать'**
  String get copyPhoneHint;

  /// No description provided for @proofTitle.
  ///
  /// In ru, this message translates to:
  /// **'ПОДТВЕРЖДЕНИЕ ОПЛАТЫ'**
  String get proofTitle;

  /// No description provided for @proofBody.
  ///
  /// In ru, this message translates to:
  /// **'Переведите деньги и прикрепите скриншот или фото чека.'**
  String get proofBody;

  /// No description provided for @receiptLoadFailed.
  ///
  /// In ru, this message translates to:
  /// **'Не удалось загрузить чек'**
  String get receiptLoadFailed;

  /// No description provided for @autoConfirmHint.
  ///
  /// In ru, this message translates to:
  /// **'Если не подтвердите в течение 5 дней — подтвердится автоматически'**
  String get autoConfirmHint;

  /// No description provided for @paymentMarkedTitle.
  ///
  /// In ru, this message translates to:
  /// **'ИСПОЛНИТЕЛЬ ОТМЕТИЛ ОПЛАТУ'**
  String get paymentMarkedTitle;

  /// No description provided for @paymentMarkedBody.
  ///
  /// In ru, this message translates to:
  /// **'Исполнитель прикрепил чек. Проверьте и подтвердите получение.'**
  String get paymentMarkedBody;

  /// No description provided for @createLeadTitle.
  ///
  /// In ru, this message translates to:
  /// **'Новый лид'**
  String get createLeadTitle;

  /// No description provided for @labelLeadType.
  ///
  /// In ru, this message translates to:
  /// **'Тип лида'**
  String get labelLeadType;

  /// No description provided for @typePickerHint.
  ///
  /// In ru, this message translates to:
  /// **'Выберите тип'**
  String get typePickerHint;

  /// No description provided for @typeRequired.
  ///
  /// In ru, this message translates to:
  /// **'Выберите тип лида'**
  String get typeRequired;

  /// No description provided for @labelClientPhone.
  ///
  /// In ru, this message translates to:
  /// **'Телефон клиента'**
  String get labelClientPhone;

  /// No description provided for @phoneValidationFull.
  ///
  /// In ru, this message translates to:
  /// **'Введите полный номер телефона'**
  String get phoneValidationFull;

  /// No description provided for @checkingDuplicates.
  ///
  /// In ru, this message translates to:
  /// **'Проверяем дубли...'**
  String get checkingDuplicates;

  /// No description provided for @checkError.
  ///
  /// In ru, this message translates to:
  /// **'Ошибка проверки. Повторите.'**
  String get checkError;

  /// No description provided for @createLeadError.
  ///
  /// In ru, this message translates to:
  /// **'Ошибка создания лида'**
  String get createLeadError;

  /// No description provided for @dupWarningTitle.
  ///
  /// In ru, this message translates to:
  /// **'Возможный дубль'**
  String get dupWarningTitle;

  /// No description provided for @dupWarningBody.
  ///
  /// In ru, this message translates to:
  /// **'На этот номер уже есть активный лид типа «{type}»{statusPart}.'**
  String dupWarningBody(String type, String statusPart);

  /// No description provided for @dupWarningStatusPart.
  ///
  /// In ru, this message translates to:
  /// **' ({status})'**
  String dupWarningStatusPart(String status);

  /// No description provided for @labelClientName.
  ///
  /// In ru, this message translates to:
  /// **'Имя клиента'**
  String get labelClientName;

  /// No description provided for @clientNameRequired.
  ///
  /// In ru, this message translates to:
  /// **'Введите имя клиента'**
  String get clientNameRequired;

  /// No description provided for @labelServiceCity.
  ///
  /// In ru, this message translates to:
  /// **'Город, где нужна услуга'**
  String get labelServiceCity;

  /// No description provided for @serviceCityHint.
  ///
  /// In ru, this message translates to:
  /// **'Где находится объект или нужна услуга — по этому городу подбирается местный специалист'**
  String get serviceCityHint;

  /// No description provided for @labelDescription.
  ///
  /// In ru, this message translates to:
  /// **'Описание / суть запроса'**
  String get labelDescription;

  /// No description provided for @descriptionPlaceholder.
  ///
  /// In ru, this message translates to:
  /// **'Опишите задачу клиента подробно: что именно нужно, условия, пожелания…'**
  String get descriptionPlaceholder;

  /// No description provided for @descriptionRequired.
  ///
  /// In ru, this message translates to:
  /// **'Добавьте описание'**
  String get descriptionRequired;

  /// No description provided for @clientConsentText.
  ///
  /// In ru, this message translates to:
  /// **'Я подтверждаю, что получил согласие клиента на передачу его контактных данных'**
  String get clientConsentText;

  /// No description provided for @noPaymentHint.
  ///
  /// In ru, this message translates to:
  /// **'Перед созданием потребуется указать платёжные реквизиты.'**
  String get noPaymentHint;

  /// No description provided for @leadCreatedSuccess.
  ///
  /// In ru, this message translates to:
  /// **'Лид создан!'**
  String get leadCreatedSuccess;

  /// No description provided for @leadCreatedSuccessHint.
  ///
  /// In ru, this message translates to:
  /// **'Спасибо! Мы подберём исполнителя и уведомим вас.'**
  String get leadCreatedSuccessHint;

  /// No description provided for @labelRole.
  ///
  /// In ru, this message translates to:
  /// **'Роль'**
  String get labelRole;

  /// No description provided for @roleSpecialist.
  ///
  /// In ru, this message translates to:
  /// **'Специалист'**
  String get roleSpecialist;

  /// No description provided for @roleAdmin.
  ///
  /// In ru, this message translates to:
  /// **'Администратор'**
  String get roleAdmin;

  /// No description provided for @roleModerator.
  ///
  /// In ru, this message translates to:
  /// **'Модератор'**
  String get roleModerator;

  /// No description provided for @roleCompany.
  ///
  /// In ru, this message translates to:
  /// **'Компания'**
  String get roleCompany;

  /// No description provided for @paymentDetailsTitle.
  ///
  /// In ru, this message translates to:
  /// **'Платёжные реквизиты'**
  String get paymentDetailsTitle;

  /// No description provided for @notSpecified.
  ///
  /// In ru, this message translates to:
  /// **'Не указаны'**
  String get notSpecified;

  /// No description provided for @verifiedStatus.
  ///
  /// In ru, this message translates to:
  /// **'Верифицированы ✓'**
  String get verifiedStatus;

  /// No description provided for @pendingVerifStatus.
  ///
  /// In ru, this message translates to:
  /// **'Фото на проверке'**
  String get pendingVerifStatus;

  /// No description provided for @rejectedVerifStatus.
  ///
  /// In ru, this message translates to:
  /// **'Верификация отклонена'**
  String get rejectedVerifStatus;

  /// No description provided for @notVerifiedStatus.
  ///
  /// In ru, this message translates to:
  /// **'Не верифицированы'**
  String get notVerifiedStatus;

  /// No description provided for @reasonPrefix.
  ///
  /// In ru, this message translates to:
  /// **'Причина: {reason}'**
  String reasonPrefix(String reason);

  /// No description provided for @pendingVerifHint.
  ///
  /// In ru, this message translates to:
  /// **'Мы уведомим вас о результате проверки.'**
  String get pendingVerifHint;

  /// No description provided for @guarantorCompanyTitle.
  ///
  /// In ru, this message translates to:
  /// **'Компания-гарант'**
  String get guarantorCompanyTitle;

  /// No description provided for @currentGuarantor.
  ///
  /// In ru, this message translates to:
  /// **'Текущий гарант'**
  String get currentGuarantor;

  /// No description provided for @membershipActive.
  ///
  /// In ru, this message translates to:
  /// **'Активен'**
  String get membershipActive;

  /// No description provided for @membershipPending.
  ///
  /// In ru, this message translates to:
  /// **'Заявка на рассмотрении'**
  String get membershipPending;

  /// No description provided for @membershipChangeHint.
  ///
  /// In ru, this message translates to:
  /// **'Заявка на смену на рассмотрении:'**
  String get membershipChangeHint;

  /// No description provided for @noCompany.
  ///
  /// In ru, this message translates to:
  /// **'Вы не привязаны к компании'**
  String get noCompany;

  /// No description provided for @verifyFirst.
  ///
  /// In ru, this message translates to:
  /// **'Сначала пройдите верификацию'**
  String get verifyFirst;

  /// No description provided for @pickCompanyTitle.
  ///
  /// In ru, this message translates to:
  /// **'Выберите компанию'**
  String get pickCompanyTitle;

  /// No description provided for @companiesLoadFailed.
  ///
  /// In ru, this message translates to:
  /// **'Не удалось загрузить список компаний'**
  String get companiesLoadFailed;

  /// No description provided for @noCompaniesAvailable.
  ///
  /// In ru, this message translates to:
  /// **'Нет доступных компаний'**
  String get noCompaniesAvailable;

  /// No description provided for @applicationSent.
  ///
  /// In ru, this message translates to:
  /// **'Заявка в «{name}» отправлена'**
  String applicationSent(String name);

  /// No description provided for @applicationRevoked.
  ///
  /// In ru, this message translates to:
  /// **'Заявка отозвана'**
  String get applicationRevoked;

  /// No description provided for @applicationError.
  ///
  /// In ru, this message translates to:
  /// **'Ошибка отправки заявки'**
  String get applicationError;

  /// No description provided for @avatarUploadError.
  ///
  /// In ru, this message translates to:
  /// **'Ошибка загрузки фото'**
  String get avatarUploadError;

  /// No description provided for @avatarNoPermission.
  ///
  /// In ru, this message translates to:
  /// **'Нет прав для загрузки аватара'**
  String get avatarNoPermission;

  /// No description provided for @editProfileTitle.
  ///
  /// In ru, this message translates to:
  /// **'Редактировать профиль'**
  String get editProfileTitle;

  /// No description provided for @editProfileLocked.
  ///
  /// In ru, this message translates to:
  /// **'Сейчас профиль изменить нельзя. Имя и фамилия заморожены после верификации. Специализацию и город нельзя менять, пока у вас есть лиды в работе.'**
  String get editProfileLocked;

  /// No description provided for @nameLockedHint.
  ///
  /// In ru, this message translates to:
  /// **'Имя и фамилию нельзя изменить после верификации'**
  String get nameLockedHint;

  /// No description provided for @lockedLeadsHint.
  ///
  /// In ru, this message translates to:
  /// **'Недоступно: у вас есть лиды в работе'**
  String get lockedLeadsHint;

  /// No description provided for @saveError.
  ///
  /// In ru, this message translates to:
  /// **'Ошибка сохранения'**
  String get saveError;

  /// No description provided for @labelBank.
  ///
  /// In ru, this message translates to:
  /// **'Банк'**
  String get labelBank;

  /// No description provided for @bankPickerHint.
  ///
  /// In ru, this message translates to:
  /// **'Выберите банк'**
  String get bankPickerHint;

  /// No description provided for @bankRequired.
  ///
  /// In ru, this message translates to:
  /// **'Выберите банк'**
  String get bankRequired;

  /// No description provided for @labelPaymentPhone.
  ///
  /// In ru, this message translates to:
  /// **'Номер для перевода'**
  String get labelPaymentPhone;

  /// No description provided for @paymentPhoneHint.
  ///
  /// In ru, this message translates to:
  /// **'По умолчанию подставлен ваш номер входа. Можно изменить.'**
  String get paymentPhoneHint;

  /// No description provided for @phoneRequired.
  ///
  /// In ru, this message translates to:
  /// **'Введите номер'**
  String get phoneRequired;

  /// No description provided for @paymentFormHint.
  ///
  /// In ru, this message translates to:
  /// **'Укажите реквизиты, на которые вы получаете вознаграждение за переданные лиды.'**
  String get paymentFormHint;

  /// No description provided for @banksLoadFailed.
  ///
  /// In ru, this message translates to:
  /// **'Не удалось загрузить список банков'**
  String get banksLoadFailed;

  /// No description provided for @verificationTitle.
  ///
  /// In ru, this message translates to:
  /// **'Верификация'**
  String get verificationTitle;

  /// No description provided for @verificationStepsTitle.
  ///
  /// In ru, this message translates to:
  /// **'Как пройти верификацию'**
  String get verificationStepsTitle;

  /// No description provided for @verificationStep1.
  ///
  /// In ru, this message translates to:
  /// **'Возьмите удостоверение личности'**
  String get verificationStep1;

  /// No description provided for @verificationStep2.
  ///
  /// In ru, this message translates to:
  /// **'Сфотографируйтесь рядом с ним так, чтобы было видно лицо и документ'**
  String get verificationStep2;

  /// No description provided for @verificationStep3.
  ///
  /// In ru, this message translates to:
  /// **'Загрузите фото — модератор проверит его в течение 24 часов'**
  String get verificationStep3;

  /// No description provided for @verificationConsentText.
  ///
  /// In ru, this message translates to:
  /// **'Я даю согласие на обработку изображения моего документа, удостоверяющего личность, для целей верификации'**
  String get verificationConsentText;

  /// No description provided for @uploadError.
  ///
  /// In ru, this message translates to:
  /// **'Ошибка загрузки файла'**
  String get uploadError;

  /// No description provided for @verifActiveTitle.
  ///
  /// In ru, this message translates to:
  /// **'Вы верифицированы'**
  String get verifActiveTitle;

  /// No description provided for @verifPendingTitle.
  ///
  /// In ru, this message translates to:
  /// **'Фото на проверке'**
  String get verifPendingTitle;

  /// No description provided for @verifRejectedTitle.
  ///
  /// In ru, this message translates to:
  /// **'Верификация отклонена'**
  String get verifRejectedTitle;

  /// No description provided for @verifNotStartedTitle.
  ///
  /// In ru, this message translates to:
  /// **'Подтвердите личность'**
  String get verifNotStartedTitle;

  /// No description provided for @verifActiveSubtitle.
  ///
  /// In ru, this message translates to:
  /// **'Ваш аккаунт подтверждён — вы можете принимать лиды.'**
  String get verifActiveSubtitle;

  /// No description provided for @verifPendingSubtitle.
  ///
  /// In ru, this message translates to:
  /// **'Фото отправлено на проверку модератору.\nОжидайте — мы уведомим вас о результате.'**
  String get verifPendingSubtitle;

  /// No description provided for @verifRejectedSubtitle.
  ///
  /// In ru, this message translates to:
  /// **'Загрузите новое фото с удостоверением личности.'**
  String get verifRejectedSubtitle;

  /// No description provided for @verifNotStartedSubtitle.
  ///
  /// In ru, this message translates to:
  /// **'Чтобы принимать лиды, подтвердите личность: сфотографируйтесь рядом с удостоверением.'**
  String get verifNotStartedSubtitle;

  /// No description provided for @notificationsTitle.
  ///
  /// In ru, this message translates to:
  /// **'Уведомления'**
  String get notificationsTitle;

  /// No description provided for @noNotifications.
  ///
  /// In ru, this message translates to:
  /// **'Уведомлений пока нет'**
  String get noNotifications;

  /// No description provided for @relTimeJustNow.
  ///
  /// In ru, this message translates to:
  /// **'только что'**
  String get relTimeJustNow;

  /// No description provided for @relTimeMinutes.
  ///
  /// In ru, this message translates to:
  /// **'{n} мин. назад'**
  String relTimeMinutes(int n);

  /// No description provided for @relTimeHours.
  ///
  /// In ru, this message translates to:
  /// **'{n} ч. назад'**
  String relTimeHours(int n);

  /// No description provided for @relTimeYesterday.
  ///
  /// In ru, this message translates to:
  /// **'вчера'**
  String get relTimeYesterday;

  /// No description provided for @relTimeDays.
  ///
  /// In ru, this message translates to:
  /// **'{n} дн. назад'**
  String relTimeDays(int n);

  /// No description provided for @supportTitle.
  ///
  /// In ru, this message translates to:
  /// **'Поддержка'**
  String get supportTitle;

  /// No description provided for @supportEmpty.
  ///
  /// In ru, this message translates to:
  /// **'Напишите нам — мы поможем'**
  String get supportEmpty;

  /// No description provided for @messageSendFailed.
  ///
  /// In ru, this message translates to:
  /// **'Не удалось отправить сообщение'**
  String get messageSendFailed;

  /// No description provided for @messageHint.
  ///
  /// In ru, this message translates to:
  /// **'Сообщение...'**
  String get messageHint;

  /// No description provided for @tariffsTitle.
  ///
  /// In ru, this message translates to:
  /// **'Тарифы'**
  String get tariffsTitle;

  /// No description provided for @tariffsLoadError.
  ///
  /// In ru, this message translates to:
  /// **'Не удалось загрузить тарифы'**
  String get tariffsLoadError;

  /// No description provided for @tariffsExplanation.
  ///
  /// In ru, this message translates to:
  /// **'Вознаграждение начисляется только за лид, по которому состоялась сделка. Если партнёр не закрыл договор — выплаты нет.'**
  String get tariffsExplanation;

  /// No description provided for @tariffsCalculatorTitle.
  ///
  /// In ru, this message translates to:
  /// **'КАЛЬКУЛЯТОР'**
  String get tariffsCalculatorTitle;

  /// No description provided for @tariffBaseCityHint.
  ///
  /// In ru, this message translates to:
  /// **'Базовый тариф (любой город)'**
  String get tariffBaseCityHint;

  /// No description provided for @tariffBaseCityLabel.
  ///
  /// In ru, this message translates to:
  /// **'Базовый тариф'**
  String get tariffBaseCityLabel;

  /// No description provided for @priceOnRequest.
  ///
  /// In ru, this message translates to:
  /// **'Цена уточняется'**
  String get priceOnRequest;

  /// No description provided for @priceOnRequestHint.
  ///
  /// In ru, this message translates to:
  /// **'Обратитесь к администратору для уточнения условий.'**
  String get priceOnRequestHint;

  /// No description provided for @fixedRewardLabel.
  ///
  /// In ru, this message translates to:
  /// **'фиксированное вознаграждение за лид'**
  String get fixedRewardLabel;

  /// No description provided for @percentRewardLabel.
  ///
  /// In ru, this message translates to:
  /// **'от комиссии по сделке'**
  String get percentRewardLabel;

  /// No description provided for @settingsLanguage.
  ///
  /// In ru, this message translates to:
  /// **'Язык'**
  String get settingsLanguage;

  /// No description provided for @langRussian.
  ///
  /// In ru, this message translates to:
  /// **'Русский'**
  String get langRussian;

  /// No description provided for @langKazakh.
  ///
  /// In ru, this message translates to:
  /// **'Қазақша'**
  String get langKazakh;

  /// No description provided for @monthJan.
  ///
  /// In ru, this message translates to:
  /// **'янв'**
  String get monthJan;

  /// No description provided for @monthFeb.
  ///
  /// In ru, this message translates to:
  /// **'фев'**
  String get monthFeb;

  /// No description provided for @monthMar.
  ///
  /// In ru, this message translates to:
  /// **'мар'**
  String get monthMar;

  /// No description provided for @monthApr.
  ///
  /// In ru, this message translates to:
  /// **'апр'**
  String get monthApr;

  /// No description provided for @monthMay.
  ///
  /// In ru, this message translates to:
  /// **'май'**
  String get monthMay;

  /// No description provided for @monthJun.
  ///
  /// In ru, this message translates to:
  /// **'июн'**
  String get monthJun;

  /// No description provided for @monthJul.
  ///
  /// In ru, this message translates to:
  /// **'июл'**
  String get monthJul;

  /// No description provided for @monthAug.
  ///
  /// In ru, this message translates to:
  /// **'авг'**
  String get monthAug;

  /// No description provided for @monthSep.
  ///
  /// In ru, this message translates to:
  /// **'сен'**
  String get monthSep;

  /// No description provided for @monthOct.
  ///
  /// In ru, this message translates to:
  /// **'окт'**
  String get monthOct;

  /// No description provided for @monthNov.
  ///
  /// In ru, this message translates to:
  /// **'ноя'**
  String get monthNov;

  /// No description provided for @monthDec.
  ///
  /// In ru, this message translates to:
  /// **'дек'**
  String get monthDec;

  /// No description provided for @registerAppBarTitle.
  ///
  /// In ru, this message translates to:
  /// **'Регистрация'**
  String get registerAppBarTitle;

  /// No description provided for @rewardConfirmedBanner.
  ///
  /// In ru, this message translates to:
  /// **'Вознаграждение получено и подтверждено'**
  String get rewardConfirmedBanner;

  /// No description provided for @closedAtLabel.
  ///
  /// In ru, this message translates to:
  /// **'Завершено {date}'**
  String closedAtLabel(String date);

  /// No description provided for @statsCardTitle.
  ///
  /// In ru, this message translates to:
  /// **'Статистика'**
  String get statsCardTitle;

  /// No description provided for @deleteAccountBtn.
  ///
  /// In ru, this message translates to:
  /// **'Удалить аккаунт'**
  String get deleteAccountBtn;

  /// No description provided for @deleteAccountDialogTitle.
  ///
  /// In ru, this message translates to:
  /// **'Удалить аккаунт?'**
  String get deleteAccountDialogTitle;

  /// No description provided for @deleteAccountDialogBody.
  ///
  /// In ru, this message translates to:
  /// **'Это действие необратимо. Будут удалены:\n• Профиль и фото\n• Платёжные реквизиты\n• Данные верификации\n\nЗаписи о сделках и вознаграждениях сохраняются в обезличенном виде.'**
  String get deleteAccountDialogBody;

  /// No description provided for @deleteAccountConfirm.
  ///
  /// In ru, this message translates to:
  /// **'Удалить'**
  String get deleteAccountConfirm;

  /// No description provided for @deleteAccountCancel.
  ///
  /// In ru, this message translates to:
  /// **'Отмена'**
  String get deleteAccountCancel;

  /// No description provided for @deleteAccountSuccess.
  ///
  /// In ru, this message translates to:
  /// **'Аккаунт удалён'**
  String get deleteAccountSuccess;

  /// No description provided for @deleteAccountLink.
  ///
  /// In ru, this message translates to:
  /// **'Подробнее об удалении аккаунта'**
  String get deleteAccountLink;
}

class _AppLocalizationsDelegate
    extends LocalizationsDelegate<AppLocalizations> {
  const _AppLocalizationsDelegate();

  @override
  Future<AppLocalizations> load(Locale locale) {
    return SynchronousFuture<AppLocalizations>(lookupAppLocalizations(locale));
  }

  @override
  bool isSupported(Locale locale) =>
      <String>['kk', 'ru'].contains(locale.languageCode);

  @override
  bool shouldReload(_AppLocalizationsDelegate old) => false;
}

AppLocalizations lookupAppLocalizations(Locale locale) {
  // Lookup logic when only language code is specified.
  switch (locale.languageCode) {
    case 'kk':
      return AppLocalizationsKk();
    case 'ru':
      return AppLocalizationsRu();
  }

  throw FlutterError(
    'AppLocalizations.delegate failed to load unsupported locale "$locale". This is likely '
    'an issue with the localizations generation tool. Please file an issue '
    'on GitHub with a reproducible sample app and the gen-l10n configuration '
    'that was used.',
  );
}

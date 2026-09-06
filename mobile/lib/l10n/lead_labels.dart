import 'app_localizations.dart';

String specializationLabel(AppLocalizations l, String spec) {
  switch (spec) {
    case 'realtor':
      return l.specRealtor;
    case 'mortgage':
      return l.specMortgage;
    case 'lawyer':
      return l.specLawyer;
    case 'other':
      return l.specOther;
    default:
      return spec;
  }
}

/// Лейбл специализации из объекта пользователя: для «Другое» показывает
/// уточнение из specialization_other, если оно заполнено.
String userSpecializationLabel(AppLocalizations l, Map<String, dynamic> user) {
  final spec = user['specialization'] as String? ?? '';
  if (spec == 'other') {
    final other = (user['specialization_other'] as String?)?.trim();
    if (other != null && other.isNotEmpty) return other;
  }
  return specializationLabel(l, spec);
}

String roleLabel(AppLocalizations l, String role) {
  switch (role) {
    case 'user':
      return l.roleSpecialist;
    case 'admin':
      return l.roleAdmin;
    case 'moderator':
      return l.roleModerator;
    case 'company':
      return l.roleCompany;
    default:
      return role;
  }
}

String leadTypeLabel(AppLocalizations l, String type) {
  switch (type) {
    case 'owner':
      return l.leadTypeOwner;
    case 'buyer':
      return l.leadTypeBuyer;
    case 'mortgage':
      return l.leadTypeMortgage;
    case 'legal':
      return l.leadTypeLegal;
    default:
      return type;
  }
}

String leadStatusLabel(AppLocalizations l, String status) {
  switch (status) {
    case 'pending_verification':
      return l.leadStatusPendingVerification;
    case 'new':
      return l.leadStatusNew;
    case 'pending_acceptance':
      return l.leadStatusPendingAcceptance;
    case 'in_progress':
      return l.leadStatusInProgress;
    case 'contract':
      return l.leadStatusContract;
    case 'deposit':
      return l.leadStatusDeposit;
    case 'closed_success':
      return l.leadStatusClosedSuccess;
    case 'cancelled':
      return l.leadStatusCancelled;
    case 'dispute':
      return l.leadStatusDispute;
    case 'archived':
      return l.leadStatusArchived;
    default:
      return status;
  }
}

String formatLeadDateL(DateTime dt, AppLocalizations l) {
  final months = [
    l.monthJan, l.monthFeb, l.monthMar, l.monthApr,
    l.monthMay, l.monthJun, l.monthJul, l.monthAug,
    l.monthSep, l.monthOct, l.monthNov, l.monthDec,
  ];
  return '${dt.day} ${months[dt.month - 1]} ${dt.year}';
}

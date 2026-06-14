import 'package:flutter/services.dart';

/// Formats a raw digit string as +7 XXX XXX XX XX for display.
String formatPhone(String? raw) {
  if (raw == null || raw.isEmpty) return '';
  final digits = raw.replaceAll(RegExp(r'\D'), '');
  // Normalise: strip leading 8 or 7 to get 10 local digits
  String local;
  if (digits.startsWith('8') && digits.length == 11) {
    local = digits.substring(1);
  } else if (digits.startsWith('7') && digits.length == 11) {
    local = digits.substring(1);
  } else if (digits.length == 10) {
    local = digits;
  } else {
    return raw; // unknown format — return as-is
  }
  // local is 10 digits: XXX XXX XX XX
  return '+7 ${local.substring(0, 3)} ${local.substring(3, 6)} '
      '${local.substring(6, 8)} ${local.substring(8, 10)}';
}

/// Live input formatter: +7 XXX XXX XX XX as user types.
class PhoneMaskFormatter extends TextInputFormatter {
  @override
  TextEditingValue formatEditUpdate(
    TextEditingValue oldValue,
    TextEditingValue newValue,
  ) {
    // Extract digits only
    String digits = newValue.text.replaceAll(RegExp(r'\D'), '');

    // Always start with 7 (normalise 8→7)
    if (digits.startsWith('8')) digits = '7${digits.substring(1)}';
    if (!digits.startsWith('7')) digits = '7$digits';

    // Cap at 11 digits
    if (digits.length > 11) digits = digits.substring(0, 11);

    // Build formatted string
    final buf = StringBuffer('+');
    for (var i = 0; i < digits.length; i++) {
      buf.write(digits[i]);
      if (i == 0) buf.write(' ');       // after country code
      if (i == 3) buf.write(' ');       // after area code XXX
      if (i == 6) buf.write(' ');       // after first group XXX
      if (i == 8) buf.write(' ');       // after second group XX
    }

    final formatted = buf.toString().trimRight();
    return TextEditingValue(
      text: formatted,
      selection: TextSelection.collapsed(offset: formatted.length),
    );
  }
}

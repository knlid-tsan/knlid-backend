// Phone formatting — matches mobile PhoneMaskFormatter logic
// Raw "+77051234567" → "+7 705 123 45 67"
export function formatPhone(raw: string | null | undefined): string {
  if (!raw) return '—';
  const digits = raw.replace(/\D/g, '');
  let local: string;
  if ((digits.startsWith('7') || digits.startsWith('8')) && digits.length === 11) {
    local = digits.slice(1);
  } else if (digits.length === 10) {
    local = digits;
  } else {
    return raw; // unknown format — return as-is
  }
  return `+7 ${local.slice(0, 3)} ${local.slice(3, 6)} ${local.slice(6, 8)} ${local.slice(8, 10)}`;
}

// Live input mask for phone field: formats as user types → "+7 XXX XXX XX XX"
export function maskPhoneInput(value: string): string {
  let digits = value.replace(/\D/g, '');
  if (digits.startsWith('8')) digits = '7' + digits.slice(1);
  if (!digits.startsWith('7')) digits = '7' + digits;
  if (digits.length > 11) digits = digits.slice(0, 11);
  let result = '+';
  for (let i = 0; i < digits.length; i++) {
    result += digits[i];
    if (i === 0) result += ' ';
    if (i === 3) result += ' ';
    if (i === 6) result += ' ';
    if (i === 8) result += ' ';
  }
  return result.trimEnd();
}

// Strip mask before sending to API: "+7 705 123 45 67" → "+77051234567"
export function stripPhone(phone: string): string {
  return phone.replace(/[^\d+]/g, '');
}

// Money formatting: "15000" or 15000 → "15 000 ₸"
export function formatMoney(amount: string | number | null | undefined): string {
  if (amount == null || amount === '') return '—';
  const n = Number(amount);
  if (isNaN(n)) return String(amount);
  return `${n.toLocaleString('ru-RU')} ₸`;
}

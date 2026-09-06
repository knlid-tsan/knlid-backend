export enum LeadType {
  OWNER = 'owner',
  BUYER = 'buyer',
  MORTGAGE = 'mortgage',
  LEGAL = 'legal',
}

// Человекочитаемые лейблы типа лида (для текста уведомлений).
// Значения enum в БД не меняются — это только отображение.
export const LEAD_TYPE_LABELS: Record<string, string> = {
  owner: 'Продавец',
  buyer: 'Покупатель',
  mortgage: 'Ипотека',
  legal: 'Юр. услуга',
};

export const leadTypeLabel = (type: string): string =>
  LEAD_TYPE_LABELS[type] ?? type;

export enum LeadStatus {
  NEW = 'new',
  PENDING_ACCEPTANCE = 'pending_acceptance',
  IN_PROGRESS = 'in_progress',
  CONTRACT = 'contract',
  DEPOSIT = 'deposit',
  CLOSED_SUCCESS = 'closed_success',
  CANCELLED = 'cancelled',
  DISPUTE = 'dispute',
  ARCHIVED = 'archived',
}

// Статусы, при которых лид считается "закрытым" — не учитывается в проверке дублей
export const TERMINAL_STATUSES = [
  LeadStatus.CLOSED_SUCCESS,
  LeadStatus.CANCELLED,
  LeadStatus.ARCHIVED,
];

// Статусы, в которых лид считается "активным" — допускают cancel/dispute
export const ACTIVE_STATUSES = [
  LeadStatus.NEW,
  LeadStatus.PENDING_ACCEPTANCE,
  LeadStatus.IN_PROGRESS,
  LeadStatus.CONTRACT,
  LeadStatus.DEPOSIT,
  LeadStatus.DISPUTE,
];

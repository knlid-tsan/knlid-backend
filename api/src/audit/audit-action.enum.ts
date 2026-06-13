// Действия аудит-лога. Строковый enum — значения хранятся как есть в audit_logs.action
export enum AuditAction {
  USER_REGISTERED = 'user_registered',

  LEAD_CREATED = 'lead_created',
  LEAD_ASSIGNED = 'lead_assigned',
  LEAD_ACCEPTED = 'lead_accepted',
  LEAD_DECLINED = 'lead_declined',
  LEAD_STATUS_CHANGED = 'lead_status_changed',
  VIEW_CLIENT_PHONE = 'view_client_phone',

  REWARD_CREATED = 'reward_created',
  REWARD_PAID = 'reward_paid',
  REWARD_DISPUTED = 'reward_disputed',

  DISPUTE_OPENED = 'dispute_opened',
  DISPUTE_RESOLVED = 'dispute_resolved',

  DOCUMENT_UPLOADED = 'document_uploaded',
  VERIFICATION_APPROVED = 'verification_approved',
  VERIFICATION_REJECTED = 'verification_rejected',
}

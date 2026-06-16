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

  TARIFF_UPSERT = 'tariff_upsert',
  TARIFF_DELETE = 'tariff_delete',

  USER_BLOCKED = 'user_blocked',
  USER_UNBLOCKED = 'user_unblocked',
  USER_ROLE_CHANGED = 'user_role_changed',
  USER_REVERIFICATION_REQUESTED = 'user_reverification_requested',

  COMPANY_REGISTERED = 'company_registered',
  COMPANY_CREATED_BY_MODERATOR = 'company_created_by_moderator',
  SPECIALIST_CREATED_BY_MODERATOR = 'specialist_created_by_moderator',
  COMPANY_DOCUMENT_UPLOADED = 'company_document_uploaded',
  COMPANY_APPROVED = 'company_approved',
  COMPANY_REJECTED = 'company_rejected',

  MEMBERSHIP_APPLIED = 'membership_applied',
  MEMBERSHIP_APPROVED = 'membership_approved',
  MEMBERSHIP_REJECTED = 'membership_rejected',
  MEMBERSHIP_LEFT = 'membership_left',
  MEMBERSHIP_REMOVED = 'membership_removed',
  MEMBERSHIP_AUTO_ENDED = 'membership_auto_ended',
  MEMBERSHIP_ASSIGNED_BY_MODERATOR = 'membership_assigned_by_moderator',
  MEMBERSHIP_REMOVED_BY_MODERATOR = 'membership_removed_by_moderator',

  REWARD_OVERDUE = 'reward_overdue',
  DEBT_TRANSFERRED_TO_COMPANY = 'debt_transferred_to_company',
  DEBT_PAID_BY_COMPANY = 'debt_paid_by_company',

  SETTING_UPDATED = 'setting_updated',

  ASSIGNMENT_OVERRIDE = 'assignment_override',

  REWARD_PROOF_ATTACHED = 'reward_proof_attached',
  REWARD_CONFIRMED = 'reward_confirmed',
  REWARD_AUTO_CONFIRMED = 'reward_auto_confirmed',
}

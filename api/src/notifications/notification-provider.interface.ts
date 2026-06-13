export const NOTIFICATION_PROVIDER = 'NOTIFICATION_PROVIDER';

export interface NotificationProvider {
  send(
    userId: string,
    title: string,
    body: string,
    data?: Record<string, unknown> | null,
  ): Promise<void>;
}

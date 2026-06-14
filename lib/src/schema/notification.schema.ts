export interface NotificationSchema {
  id: string;
  to: string;
  subject: string;
  body: string;
  sentAt: Date;
}

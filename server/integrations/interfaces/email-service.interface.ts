/**
 * Email Service Integration Interface
 * Defines the contract for email providers (SendGrid, AWS SES, etc.)
 */

export interface EmailProvider {
  /**
   * Send a single email
   */
  sendEmail(options: EmailOptions): Promise<EmailResponse>;

  /**
   * Send bulk emails
   */
  sendBulkEmails(options: EmailOptions[]): Promise<EmailResponse[]>;

  /**
   * Check if provider is available
   */
  isAvailable(): Promise<boolean>;
}

export interface EmailOptions {
  to: string | string[];
  cc?: string | string[];
  bcc?: string | string[];
  subject: string;
  text?: string;
  html?: string;
  from?: string;
  replyTo?: string;
  attachments?: EmailAttachment[];
  templateId?: string;
  templateData?: Record<string, any>;
  tags?: string[];
  metadata?: Record<string, string>;
}

export interface EmailAttachment {
  filename: string;
  content: string | Buffer;
  contentType?: string;
  disposition?: 'attachment' | 'inline';
}

export interface EmailResponse {
  success: boolean;
  messageId?: string;
  error?: string;
  provider?: string;
}

export interface EmailProviderConfig {
  provider: 'SendGrid' | 'AWSSES' | 'SMTP' | 'MOCK';
  apiKey?: string;
  apiSecret?: string;
  fromEmail?: string;
  fromName?: string;
  baseUrl?: string;
  region?: string; // For AWS SES
  smtpHost?: string;
  smtpPort?: number;
  smtpUser?: string;
  smtpPassword?: string;
}


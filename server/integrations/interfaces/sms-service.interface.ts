/**
 * SMS Service Integration Interface
 * Defines the contract for SMS providers (Twilio, AWS SNS, etc.)
 */

export interface SMSProvider {
  /**
   * Send a single SMS
   */
  sendSMS(options: SMSOptions): Promise<SMSResponse>;

  /**
   * Send bulk SMS
   */
  sendBulkSMS(options: SMSOptions[]): Promise<SMSResponse[]>;

  /**
   * Check SMS delivery status
   */
  checkDeliveryStatus(messageId: string): Promise<SMSDeliveryStatus>;

  /**
   * Check if provider is available
   */
  isAvailable(): Promise<boolean>;
}

export interface SMSOptions {
  to: string; // Phone number in E.164 format (e.g., +919876543210)
  message: string;
  from?: string; // Sender ID or phone number
  templateId?: string;
  templateData?: Record<string, string>;
  priority?: 'high' | 'normal' | 'low';
  scheduledAt?: Date;
}

export interface SMSResponse {
  success: boolean;
  messageId?: string;
  error?: string;
  provider?: string;
  cost?: number;
}

export interface SMSDeliveryStatus {
  messageId: string;
  status: 'queued' | 'sent' | 'delivered' | 'failed' | 'undelivered';
  deliveredAt?: Date;
  error?: string;
}

export interface SMSProviderConfig {
  provider: 'Twilio' | 'AWSSNS' | 'MSG91' | 'MOCK';
  apiKey?: string;
  apiSecret?: string;
  accountSid?: string; // For Twilio
  authToken?: string; // For Twilio
  fromNumber?: string;
  region?: string; // For AWS SNS
}


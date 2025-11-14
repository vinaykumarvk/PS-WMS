/**
 * Module 1.3: Email Notification Service
 * Sends email notifications for orders
 */

import sgMail from '@sendgrid/mail';
import { OrderRecord } from './order-service';

// Initialize SendGrid (will use environment variable)
if (process.env.SENDGRID_API_KEY) {
  sgMail.setApiKey(process.env.SENDGRID_API_KEY);
}

export interface EmailData {
  to: string;
  order: OrderRecord;
  clientName?: string;
  receiptPdf?: Buffer;
}

/**
 * Send order confirmation email
 */
export async function sendOrderConfirmationEmail(emailData: EmailData): Promise<void> {
  try {
    const { to, order, clientName, receiptPdf } = emailData;
    const orderFormData = order.orderFormData || (order as any).orderFormData;
    if (!orderFormData || !orderFormData.cartItems) {
      throw new Error('Order form data is missing or invalid');
    }
    const totalAmount = orderFormData.cartItems.reduce((sum: number, item: any) => sum + (item.amount || 0), 0);
    const submittedDate = new Date(order.submittedAt).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });

    const emailContent = generateEmailHTML(order, clientName, totalAmount, submittedDate);

    const msg: any = {
      to,
      from: process.env.SENDGRID_FROM_EMAIL || 'noreply@wealthrm.com',
      subject: `Order Confirmation - ${order.modelOrderId}`,
      html: emailContent,
    };

    // Attach PDF receipt if provided
    if (receiptPdf) {
      msg.attachments = [
        {
          content: receiptPdf.toString('base64'),
          filename: `order-receipt-${order.modelOrderId}.pdf`,
          type: 'application/pdf',
          disposition: 'attachment',
        },
      ];
    }

    // Only send if SendGrid is configured
    if (process.env.SENDGRID_API_KEY) {
      await sgMail.send(msg);
      console.log(`Order confirmation email sent to ${to} for order ${order.modelOrderId}`);
    } else {
      console.log(`[MOCK] Order confirmation email would be sent to ${to} for order ${order.modelOrderId}`);
      console.log(`[MOCK] Email content:`, emailContent.substring(0, 200) + '...');
    }
  } catch (error: any) {
    console.error('Email sending error:', error);
    throw new Error(`Failed to send email: ${error.message}`);
  }
}

/**
 * Generate HTML email content
 */
function generateEmailHTML(
  order: OrderRecord,
  clientName: string | undefined,
  totalAmount: number,
  submittedDate: string
): string {
  const orderFormData = order.orderFormData || (order as any).orderFormData;
  const clientDisplayName = clientName || 'Valued Customer';

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    body {
      font-family: Arial, sans-serif;
      line-height: 1.6;
      color: #333;
      max-width: 600px;
      margin: 0 auto;
      padding: 20px;
    }
    .header {
      background-color: #2563eb;
      color: white;
      padding: 20px;
      text-align: center;
      border-radius: 5px 5px 0 0;
    }
    .content {
      background-color: #f9fafb;
      padding: 30px;
      border: 1px solid #e5e7eb;
    }
    .order-details {
      background-color: white;
      padding: 20px;
      border-radius: 5px;
      margin: 20px 0;
    }
    .order-item {
      padding: 10px 0;
      border-bottom: 1px solid #e5e7eb;
    }
    .order-item:last-child {
      border-bottom: none;
    }
    .total {
      font-size: 18px;
      font-weight: bold;
      color: #2563eb;
      margin-top: 20px;
      padding-top: 20px;
      border-top: 2px solid #2563eb;
    }
    .footer {
      text-align: center;
      padding: 20px;
      color: #666;
      font-size: 12px;
    }
    .button {
      display: inline-block;
      padding: 12px 24px;
      background-color: #2563eb;
      color: white;
      text-decoration: none;
      border-radius: 5px;
      margin: 20px 0;
    }
  </style>
</head>
<body>
  <div class="header">
    <h1>Order Confirmation</h1>
  </div>
  
  <div class="content">
    <p>Dear ${clientDisplayName},</p>
    
    <p>Thank you for your order. We have successfully received your mutual fund investment order.</p>
    
    <div class="order-details">
      <h2>Order Details</h2>
      <p><strong>Order ID:</strong> ${order.modelOrderId}</p>
      <p><strong>Date:</strong> ${submittedDate}</p>
      <p><strong>Status:</strong> ${order.status}</p>
      
      <h3 style="margin-top: 20px;">Order Items:</h3>
      ${orderFormData.cartItems.map(item => `
        <div class="order-item">
          <strong>${item.schemeName}</strong><br>
          Transaction Type: ${item.transactionType}<br>
          Amount: ₹${item.amount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
        </div>
      `).join('')}
      
      <div class="total">
        Total Amount: ₹${totalAmount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
      </div>
    </div>
    
    <p>Your order is currently pending approval. You will receive another email once your order has been processed.</p>
    
    <p>If you have any questions or concerns, please don't hesitate to contact our support team.</p>
    
    <p>Best regards,<br>WealthRM Team</p>
  </div>
  
  <div class="footer">
    <p>This is an automated email. Please do not reply to this message.</p>
    <p>For support, please contact us through our website or customer service.</p>
  </div>
</body>
</html>
  `;
}


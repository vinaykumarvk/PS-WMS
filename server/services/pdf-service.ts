/**
 * Module 1.2: PDF Receipt Generation Service
 * Generates PDF receipts for orders
 */

import puppeteer from 'puppeteer';
import { OrderRecord } from './order-service';

export interface ReceiptData {
  order: OrderRecord;
  clientName?: string;
  clientEmail?: string;
  clientAddress?: string;
}

/**
 * Generate PDF receipt for an order
 */
export async function generateReceiptPDF(receiptData: ReceiptData): Promise<Buffer> {
  try {
    const html = generateReceiptHTML(receiptData);
    
    const browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
    });

    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: 'networkidle0' });
    
    const pdf = await page.pdf({
      format: 'A4',
      printBackground: true,
      margin: {
        top: '20mm',
        right: '15mm',
        bottom: '20mm',
        left: '15mm',
      },
    });

    await browser.close();
    return Buffer.from(pdf);
  } catch (error: any) {
    console.error('PDF generation error:', error);
    throw new Error(`Failed to generate PDF: ${error.message}`);
  }
}

/**
 * Generate HTML content for receipt
 */
function generateReceiptHTML(data: ReceiptData): string {
  const { order, clientName, clientEmail, clientAddress } = data;
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
  const submittedTime = new Date(order.submittedAt).toLocaleTimeString('en-IN', {
    hour: '2-digit',
    minute: '2-digit',
  });

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    body {
      font-family: 'Arial', sans-serif;
      font-size: 12px;
      line-height: 1.6;
      color: #333;
      padding: 20px;
    }
    .header {
      text-align: center;
      border-bottom: 2px solid #2563eb;
      padding-bottom: 20px;
      margin-bottom: 30px;
    }
    .header h1 {
      color: #2563eb;
      font-size: 24px;
      margin-bottom: 10px;
    }
    .header p {
      color: #666;
      font-size: 14px;
    }
    .receipt-info {
      display: flex;
      justify-content: space-between;
      margin-bottom: 30px;
    }
    .info-section {
      flex: 1;
    }
    .info-section h3 {
      font-size: 14px;
      color: #2563eb;
      margin-bottom: 10px;
      border-bottom: 1px solid #e5e7eb;
      padding-bottom: 5px;
    }
    .info-section p {
      margin: 5px 0;
      font-size: 12px;
    }
    .order-items {
      margin-bottom: 30px;
    }
    .order-items h3 {
      font-size: 14px;
      color: #2563eb;
      margin-bottom: 15px;
      border-bottom: 1px solid #e5e7eb;
      padding-bottom: 5px;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 20px;
    }
    th, td {
      padding: 10px;
      text-align: left;
      border-bottom: 1px solid #e5e7eb;
    }
    th {
      background-color: #f3f4f6;
      font-weight: bold;
      color: #374151;
    }
    .total-section {
      margin-top: 20px;
      padding-top: 20px;
      border-top: 2px solid #2563eb;
    }
    .total-row {
      display: flex;
      justify-content: space-between;
      font-size: 16px;
      font-weight: bold;
      padding: 10px 0;
    }
    .footer {
      margin-top: 40px;
      padding-top: 20px;
      border-top: 1px solid #e5e7eb;
      text-align: center;
      color: #666;
      font-size: 11px;
    }
    .status-badge {
      display: inline-block;
      padding: 4px 12px;
      border-radius: 4px;
      font-size: 11px;
      font-weight: bold;
      text-transform: uppercase;
    }
    .status-pending {
      background-color: #fef3c7;
      color: #92400e;
    }
    .status-approved {
      background-color: #d1fae5;
      color: #065f46;
    }
  </style>
</head>
<body>
  <div class="header">
    <h1>Order Receipt</h1>
    <p>Mutual Fund Investment Order Confirmation</p>
  </div>

  <div class="receipt-info">
    <div class="info-section">
      <h3>Order Details</h3>
      <p><strong>Order ID:</strong> ${order.modelOrderId}</p>
      <p><strong>Date:</strong> ${submittedDate}</p>
      <p><strong>Time:</strong> ${submittedTime}</p>
      <p><strong>Status:</strong> <span class="status-badge status-pending">${order.status}</span></p>
      ${order.traceId ? `<p><strong>Trace ID:</strong> ${order.traceId}</p>` : ''}
    </div>
    <div class="info-section">
      <h3>Client Information</h3>
      ${clientName ? `<p><strong>Name:</strong> ${clientName}</p>` : ''}
      ${clientEmail ? `<p><strong>Email:</strong> ${clientEmail}</p>` : ''}
      ${clientAddress ? `<p><strong>Address:</strong> ${clientAddress}</p>` : ''}
    </div>
  </div>

  <div class="order-items">
    <h3>Order Items</h3>
    <table>
      <thead>
        <tr>
          <th>Scheme Name</th>
          <th>Transaction Type</th>
          <th>Amount (₹)</th>
        </tr>
      </thead>
      <tbody>
        ${orderFormData.cartItems.map(item => `
          <tr>
            <td>${item.schemeName}</td>
            <td>${item.transactionType}</td>
            <td>${item.amount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
          </tr>
        `).join('')}
      </tbody>
    </table>
  </div>

  <div class="total-section">
    <div class="total-row">
      <span>Total Amount:</span>
      <span>₹${totalAmount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
    </div>
  </div>

  ${orderFormData.transactionMode ? `
  <div class="order-items">
    <h3>Transaction Mode</h3>
    <p><strong>Mode:</strong> ${orderFormData.transactionMode.mode}</p>
    ${orderFormData.transactionMode.email ? `<p><strong>Email:</strong> ${orderFormData.transactionMode.email}</p>` : ''}
    ${orderFormData.transactionMode.phoneNumber ? `<p><strong>Phone:</strong> ${orderFormData.transactionMode.phoneNumber}</p>` : ''}
  </div>
  ` : ''}

  ${orderFormData.nominees && orderFormData.nominees.length > 0 ? `
  <div class="order-items">
    <h3>Nominees</h3>
    <table>
      <thead>
        <tr>
          <th>Name</th>
          <th>Relationship</th>
          <th>Percentage</th>
        </tr>
      </thead>
      <tbody>
        ${orderFormData.nominees.map(nominee => `
          <tr>
            <td>${nominee.name}</td>
            <td>${nominee.relationship}</td>
            <td>${nominee.percentage}%</td>
          </tr>
        `).join('')}
      </tbody>
    </table>
  </div>
  ` : ''}

  <div class="footer">
    <p>This is a system-generated receipt. Please retain this for your records.</p>
    <p>For any queries, please contact our support team.</p>
  </div>
</body>
</html>
  `;
}


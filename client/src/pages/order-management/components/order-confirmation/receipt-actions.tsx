/**
 * Module 1.1: Receipt Actions Component
 * Provides actions for downloading receipt and sending email
 */

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Download, Mail, Loader2 } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import { Order } from '../../../types/order.types';

interface ReceiptActionsProps {
  orderId: number;
  order: Order;
}

export default function ReceiptActions({ orderId, order }: ReceiptActionsProps) {
  const [isGeneratingReceipt, setIsGeneratingReceipt] = useState(false);
  const [isSendingEmail, setIsSendingEmail] = useState(false);

  const handleDownloadReceipt = async () => {
    setIsGeneratingReceipt(true);
    try {
      const response = await apiRequest('POST', `/api/order-management/orders/${orderId}/generate-receipt`);
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || 'Failed to generate receipt');
      }

      // Get the PDF blob
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `order-receipt-${order.modelOrderId}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      toast({
        title: 'Receipt Downloaded',
        description: 'Your order receipt has been downloaded successfully.',
      });
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to download receipt',
        variant: 'destructive',
      });
    } finally {
      setIsGeneratingReceipt(false);
    }
  };

  const handleSendEmail = async () => {
    setIsSendingEmail(true);
    try {
      const response = await apiRequest('POST', `/api/order-management/orders/${orderId}/send-email`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to send email');
      }

      toast({
        title: 'Email Sent',
        description: 'Order confirmation email has been sent successfully.',
      });
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to send email',
        variant: 'destructive',
      });
    } finally {
      setIsSendingEmail(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Receipt & Email</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <Button
          onClick={handleDownloadReceipt}
          disabled={isGeneratingReceipt}
          className="w-full"
          variant="outline"
        >
          {isGeneratingReceipt ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Generating...
            </>
          ) : (
            <>
              <Download className="mr-2 h-4 w-4" />
              Download Receipt (PDF)
            </>
          )}
        </Button>

        <Button
          onClick={handleSendEmail}
          disabled={isSendingEmail}
          className="w-full"
          variant="outline"
        >
          {isSendingEmail ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Sending...
            </>
          ) : (
            <>
              <Mail className="mr-2 h-4 w-4" />
              Send Email Confirmation
            </>
          )}
        </Button>

        {order.orderFormData.transactionMode.email && (
          <p className="text-xs text-muted-foreground text-center mt-2">
            Email will be sent to: {order.orderFormData.transactionMode.email}
          </p>
        )}
      </CardContent>
    </Card>
  );
}


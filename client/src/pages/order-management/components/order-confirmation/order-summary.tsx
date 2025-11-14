/**
 * Module 1.1: Order Summary Component
 * Displays detailed order summary information
 */

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Order } from '../../../types/order.types';
import { format } from 'date-fns';
import { Package, User, CreditCard, FileText } from 'lucide-react';

interface OrderSummaryProps {
  order: Order;
}

export default function OrderSummary({ order }: OrderSummaryProps) {
  const { orderFormData } = order;
  const totalAmount = orderFormData.cartItems.reduce((sum, item) => sum + item.amount, 0);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Package className="h-5 w-5" />
          Order Summary
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Order Items */}
        <div>
          <h3 className="font-semibold mb-4">Order Items</h3>
          <div className="space-y-4">
            {orderFormData.cartItems.map((item, index) => (
              <div key={item.id || index}>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-medium">{item.schemeName}</span>
                      <Badge variant="outline" className="text-xs">
                        {item.transactionType}
                      </Badge>
                    </div>
                    {item.orderType && (
                      <p className="text-sm text-muted-foreground">
                        Type: {item.orderType}
                      </p>
                    )}
                    {item.units && (
                      <p className="text-sm text-muted-foreground">
                        Units: {item.units.toLocaleString('en-IN', { maximumFractionDigits: 4 })}
                      </p>
                    )}
                    {item.nav && (
                      <p className="text-sm text-muted-foreground">
                        NAV: ₹{item.nav.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 4 })}
                      </p>
                    )}
                  </div>
                  <div className="text-right">
                    <p className="font-semibold">
                      ₹{item.amount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </p>
                  </div>
                </div>
                {index < orderFormData.cartItems.length - 1 && <Separator className="mt-4" />}
              </div>
            ))}
          </div>
        </div>

        <Separator />

        {/* Transaction Mode */}
        <div>
          <h3 className="font-semibold mb-3 flex items-center gap-2">
            <CreditCard className="h-4 w-4" />
            Transaction Mode
          </h3>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Mode</span>
              <span className="capitalize">{orderFormData.transactionMode.mode}</span>
            </div>
            {orderFormData.transactionMode.email && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Email</span>
                <span>{orderFormData.transactionMode.email}</span>
              </div>
            )}
            {orderFormData.transactionMode.phoneNumber && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Phone</span>
                <span>{orderFormData.transactionMode.phoneNumber}</span>
              </div>
            )}
            {orderFormData.transactionMode.euin && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">EUIN</span>
                <span>{orderFormData.transactionMode.euin}</span>
              </div>
            )}
          </div>
        </div>

        {/* Nominees */}
        {orderFormData.nominees && orderFormData.nominees.length > 0 && (
          <>
            <Separator />
            <div>
              <h3 className="font-semibold mb-3 flex items-center gap-2">
                <User className="h-4 w-4" />
                Nominees
              </h3>
              <div className="space-y-3">
                {orderFormData.nominees.map((nominee, index) => (
                  <div key={nominee.id || index} className="text-sm">
                    <div className="flex justify-between mb-1">
                      <span className="font-medium">{nominee.name}</span>
                      <span>{nominee.percentage}%</span>
                    </div>
                    <div className="text-muted-foreground space-y-1">
                      <p>Relationship: {nominee.relationship}</p>
                      <p>PAN: {nominee.pan}</p>
                      {nominee.isMinor && nominee.guardianName && (
                        <p>Guardian: {nominee.guardianName}</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}

        {/* Total Amount */}
        <Separator />
        <div className="flex justify-between items-center pt-2">
          <span className="text-lg font-semibold">Total Amount</span>
          <span className="text-2xl font-bold">
            ₹{totalAmount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </span>
        </div>

        {/* Order Metadata */}
        <Separator />
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Order ID</span>
            <span className="font-mono">{order.modelOrderId}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Submitted At</span>
            <span>{format(new Date(order.submittedAt), 'PPp')}</span>
          </div>
          {order.traceId && (
            <div className="flex justify-between">
              <span className="text-muted-foreground">Trace ID</span>
              <span className="font-mono text-xs">{order.traceId}</span>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}


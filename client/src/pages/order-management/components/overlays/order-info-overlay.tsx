import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { CartItem, TransactionType, OrderType } from '../../types/order.types';

interface OrderInfoOverlayProps {
  cartItem: CartItem;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUpdate: (itemId: string, updates: Partial<CartItem>) => void;
}

export default function OrderInfoOverlay({ 
  cartItem, 
  open, 
  onOpenChange,
  onUpdate 
}: OrderInfoOverlayProps) {
  const [formData, setFormData] = useState({
    transactionType: cartItem.transactionType,
    orderType: cartItem.orderType || 'Initial Purchase' as OrderType,
    amount: cartItem.amount,
    units: cartItem.units || 0,
    settlementAccount: cartItem.settlementAccount || '',
    branchCode: cartItem.branchCode || '',
    mode: cartItem.mode || undefined,
    dividendInstruction: cartItem.dividendInstruction || '',
  });

  // Reset form data when cartItem changes
  React.useEffect(() => {
    if (open && cartItem) {
      setFormData({
        transactionType: cartItem.transactionType,
        orderType: cartItem.orderType || 'Initial Purchase' as OrderType,
        amount: cartItem.amount,
        units: cartItem.units || 0,
        settlementAccount: cartItem.settlementAccount || '',
        branchCode: cartItem.branchCode || '',
        mode: cartItem.mode || undefined,
        dividendInstruction: cartItem.dividendInstruction || '',
      });
    }
  }, [cartItem, open]);

  const handleSave = () => {
    onUpdate(cartItem.id, formData);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle className="text-xl sm:text-2xl">Order Information - {cartItem.schemeName}</DialogTitle>
          <DialogDescription className="text-sm sm:text-base">Edit order details</DialogDescription>
        </DialogHeader>

        <div className="space-y-4 mt-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="transaction-type">Transaction Type</Label>
              <Select
                value={formData.transactionType}
                onValueChange={(value) => setFormData({ ...formData, transactionType: value as TransactionType })}
              >
                <SelectTrigger id="transaction-type">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Purchase">Purchase</SelectItem>
                  <SelectItem value="Redemption">Redemption</SelectItem>
                  <SelectItem value="Switch">Switch</SelectItem>
                  <SelectItem value="Full Redemption">Full Redemption</SelectItem>
                  <SelectItem value="Full Switch">Full Switch</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Order Type for Purchase transactions */}
            {formData.transactionType === 'Purchase' && (
              <div className="space-y-2">
                <Label htmlFor="order-type">Order Type</Label>
                <Select
                  value={formData.orderType}
                  onValueChange={(value) => setFormData({ ...formData, orderType: value as OrderType })}
                >
                  <SelectTrigger id="order-type">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Initial Purchase">Initial Purchase</SelectItem>
                    <SelectItem value="Additional Purchase">Additional Purchase</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="amount">
                Amount <span className="text-destructive">*</span>
              </Label>
              <Input
                id="amount"
                type="number"
                step="0.01"
                min="0"
                value={formData.amount}
                onChange={(e) => {
                  const newAmount = parseFloat(e.target.value) || 0;
                  // Recalculate units if NAV is available
                  const newUnits = cartItem.nav && newAmount > 0 ? newAmount / cartItem.nav : formData.units;
                  setFormData({ ...formData, amount: newAmount, units: newUnits });
                }}
                aria-required="true"
                required
              />
            </div>

            {cartItem.nav && (
              <div className="space-y-2">
                <Label htmlFor="units">Units (calculated)</Label>
                <Input
                  id="units"
                  type="number"
                  step="0.0001"
                  value={formData.units.toFixed(4)}
                  disabled
                  className="bg-muted"
                  aria-label="Calculated units based on amount and NAV"
                />
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="settlement-account">Settlement Account</Label>
              <Select
                value={formData.settlementAccount}
                onValueChange={(value) => setFormData({ ...formData, settlementAccount: value })}
              >
                <SelectTrigger id="settlement-account">
                  <SelectValue placeholder="Select account" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="acc1">Account 1 - HDFC Bank</SelectItem>
                  <SelectItem value="acc2">Account 2 - ICICI Bank</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="branch-code">Branch Code</Label>
              <Select
                value={formData.branchCode}
                onValueChange={(value) => setFormData({ ...formData, branchCode: value })}
              >
                <SelectTrigger id="branch-code">
                  <SelectValue placeholder="Select branch" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="BR001">BR001 - Mumbai Main</SelectItem>
                  <SelectItem value="BR002">BR002 - Delhi Main</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="mode">Mode of Transaction</Label>
              <Select
                value={formData.mode}
                onValueChange={(value: any) => setFormData({ ...formData, mode: value })}
              >
                <SelectTrigger id="mode">
                  <SelectValue placeholder="Select mode" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Physical">Physical</SelectItem>
                  <SelectItem value="Email">Email</SelectItem>
                  <SelectItem value="Telephone">Telephone</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="dividend-instruction">Dividend Instruction</Label>
            <Textarea
              id="dividend-instruction"
              value={formData.dividendInstruction}
              onChange={(e) => setFormData({ ...formData, dividendInstruction: e.target.value })}
              placeholder="Enter dividend instruction"
              rows={3}
            />
          </div>
        </div>

        <DialogFooter className="flex-col sm:flex-row gap-2 sm:gap-0">
          <Button variant="outline" onClick={() => onOpenChange(false)} className="w-full sm:w-auto">
            Cancel
          </Button>
          <Button onClick={handleSave} className="w-full sm:w-auto">
            Save Changes
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}


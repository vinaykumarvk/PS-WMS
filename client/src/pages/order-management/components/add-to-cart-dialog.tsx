import React, { useState, useEffect } from 'react';
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
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Product, CartItem, TransactionType } from '../types/order.types';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertTriangle, Info, Loader2 } from 'lucide-react';
import type { AllocationRecommendation } from '../context/order-integration-context';

interface AddToCartDialogProps {
  product: Product | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAddToCart: (item: CartItem) => void;
  existingHoldings?: { productId: number; schemeName: string }[]; // For switch source selection
  onPreviewAllocation?: (
    item: Pick<CartItem, 'productId' | 'schemeName' | 'transactionType' | 'amount'>,
    product: Product
  ) => Promise<AllocationRecommendation | null>;
}

export default function AddToCartDialog({
  product,
  open,
  onOpenChange,
  onAddToCart,
  existingHoldings = [],
  onPreviewAllocation,
}: AddToCartDialogProps) {
  const [transactionType, setTransactionType] = useState<TransactionType>('Purchase');
  const [orderType, setOrderType] = useState<'Initial Purchase' | 'Additional Purchase'>('Initial Purchase');
  const [amount, setAmount] = useState<number>(0);
  const [units, setUnits] = useState<number>(0);
  const [sourceSchemeId, setSourceSchemeId] = useState<number | null>(null);
  const [isFullRedemption, setIsFullRedemption] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [recommendation, setRecommendation] = useState<AllocationRecommendation | null>(null);
  const [isRecommendationLoading, setIsRecommendationLoading] = useState(false);

  // Reset form when product changes
  useEffect(() => {
    if (product && open) {
      setAmount(product.minInvestment || 0);
      setTransactionType('Purchase');
      setOrderType('Initial Purchase');
      setUnits(0);
      setSourceSchemeId(null);
      setIsFullRedemption(false);
      setErrors({});
      setRecommendation(null);

      // Check if client has existing holdings for this product
      const hasHoldings = existingHoldings.some(h => h.productId === product.id);
      if (hasHoldings) {
        setOrderType('Additional Purchase');
      }
    }
  }, [product, open, existingHoldings]);

  // Recalculate units when amount or NAV changes
  useEffect(() => {
    if (product?.nav && amount > 0 && transactionType === 'Purchase') {
      const calculatedUnits = amount / product.nav;
      setUnits(calculatedUnits);
    }
  }, [amount, product?.nav, transactionType]);

  useEffect(() => {
    let isCancelled = false;
    const fetchRecommendation = async () => {
      if (!product || !onPreviewAllocation || !open) {
        setRecommendation(null);
        setIsRecommendationLoading(false);
        return;
      }

      if (amount <= 0) {
        setRecommendation(null);
        setIsRecommendationLoading(false);
        return;
      }

      setIsRecommendationLoading(true);
      try {
        const result = await onPreviewAllocation(
          {
            productId: product.id,
            schemeName: product.schemeName,
            transactionType,
            amount,
          },
          product
        );
        if (!isCancelled) {
          setRecommendation(result);
        }
      } catch (error) {
        if (!isCancelled) {
          console.error('Failed to load allocation recommendation:', error);
          setRecommendation(null);
        }
      } finally {
        if (!isCancelled) {
          setIsRecommendationLoading(false);
        }
      }
    };

    fetchRecommendation();

    return () => {
      isCancelled = true;
    };
  }, [amount, product, onPreviewAllocation, transactionType, open]);

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!product) {
      newErrors.product = 'Product is required';
    }

    if (amount <= 0) {
      newErrors.amount = 'Amount must be greater than 0';
    }

    if (product) {
      if (transactionType === 'Purchase' && amount < (product.minInvestment || 0)) {
        newErrors.amount = `Minimum investment is ₹${product.minInvestment?.toLocaleString()}`;
      }

      if (product.maxInvestment && amount > product.maxInvestment) {
        newErrors.amount = `Maximum investment is ₹${product.maxInvestment?.toLocaleString()}`;
      }
    }

    if (transactionType === 'Switch' && !sourceSchemeId) {
      newErrors.sourceScheme = 'Please select a source scheme for switch';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleAdd = () => {
    if (!product || !validate()) {
      return;
    }

    // Determine the final transaction type
    let finalTransactionType: TransactionType = transactionType;
    if (transactionType === 'Purchase') {
      finalTransactionType = orderType === 'Initial Purchase' ? 'Purchase' : 'Purchase';
      // We'll use a flag or different handling for initial vs additional
    }

    if (transactionType === 'Redemption' && isFullRedemption) {
      finalTransactionType = 'Full Redemption';
    }

    if (transactionType === 'Switch' && isFullRedemption) {
      finalTransactionType = 'Full Switch';
    }

    const cartItem: CartItem = {
      id: `${product.id}-${Date.now()}`,
      productId: product.id,
      schemeName: product.schemeName,
      transactionType: finalTransactionType,
      amount: amount,
      units: units > 0 ? units : undefined,
      nav: product.nav,
      // Store order type as metadata (we can extend CartItem type if needed)
    };

    // Add metadata for initial vs additional purchase
    if (transactionType === 'Purchase') {
      (cartItem as any).orderType = orderType;
    }

    // For switch, store source scheme info
    if (transactionType === 'Switch' && sourceSchemeId) {
      (cartItem as any).sourceSchemeId = sourceSchemeId;
      const sourceScheme = existingHoldings.find(h => h.productId === sourceSchemeId);
      if (sourceScheme) {
        (cartItem as any).sourceSchemeName = sourceScheme.schemeName;
      }
    }

    onAddToCart(cartItem);
    onOpenChange(false);
  };

  if (!product) {
    return null;
  }

  const hasExistingHoldings = existingHoldings.some(h => h.productId === product.id);
  const canSwitch = existingHoldings.length > 0;
  const canRedeem = hasExistingHoldings;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto w-[95vw] sm:w-full">
        <DialogHeader>
          <DialogTitle className="text-lg sm:text-xl md:text-2xl break-words">Add Order - {product.schemeName}</DialogTitle>
          <DialogDescription className="text-xs sm:text-sm md:text-base">
            Select order type and enter order details
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 sm:space-y-6 mt-4">
          {recommendation && (
            <Alert variant="default" className="border-primary/40 bg-primary/5">
              <Info className="h-4 w-4" aria-hidden="true" />
              <AlertDescription className="mt-2 space-y-1 text-xs sm:text-sm">
                <p className="font-semibold">AI Portfolio Recommendation</p>
                <p>{recommendation.explanation}</p>
                <p>
                  Suggested amount:{' '}
                  <button
                    type="button"
                    className="underline font-semibold"
                    onClick={() => setAmount(recommendation.recommendedAmount)}
                  >
                    ₹{recommendation.recommendedAmount.toLocaleString('en-IN')}
                  </button>
                  {recommendation.originalAmount !== recommendation.recommendedAmount && (
                    <span className="ml-1 text-muted-foreground">
                      (current ₹{recommendation.originalAmount.toLocaleString('en-IN')})
                    </span>
                  )}
                </p>
                {recommendation.policyHighlights.length > 0 && (
                  <ul className="list-disc list-inside text-muted-foreground">
                    {recommendation.policyHighlights.map((highlight, index) => (
                      <li key={index}>{highlight}</li>
                    ))}
                  </ul>
                )}
              </AlertDescription>
            </Alert>
          )}
          {isRecommendationLoading && (
            <Alert className="border-muted-foreground/40 bg-muted/10">
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
              <AlertDescription className="text-xs sm:text-sm">
                Calculating portfolio impact preview...
              </AlertDescription>
            </Alert>
          )}
          {/* Transaction Type Selection */}
          <div className="space-y-3">
            <Label className="text-sm sm:text-base font-semibold">
              Transaction Type <span className="text-destructive" aria-label="required">*</span>
            </Label>
            <RadioGroup
              value={transactionType}
              onValueChange={(value) => {
                setTransactionType(value as TransactionType);
                // Reset amount to minimum for purchases
                if (value === 'Purchase') {
                  setAmount(product.minInvestment || 0);
                } else {
                  setAmount(0);
                }
              }}
              className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3"
              aria-label="Select transaction type"
            >
              <div className="flex items-center space-x-2 min-h-[44px] touch-manipulation">
                <RadioGroupItem value="Purchase" id="purchase" className="h-5 w-5" />
                <Label htmlFor="purchase" className="cursor-pointer font-normal text-xs sm:text-sm">
                  Purchase
                </Label>
              </div>
              {canRedeem && (
                <div className="flex items-center space-x-2 min-h-[44px] touch-manipulation">
                  <RadioGroupItem value="Redemption" id="redemption" className="h-5 w-5" />
                  <Label htmlFor="redemption" className="cursor-pointer font-normal text-xs sm:text-sm">
                    Redemption
                  </Label>
                </div>
              )}
              {canSwitch && (
                <div className="flex items-center space-x-2 min-h-[44px] touch-manipulation">
                  <RadioGroupItem value="Switch" id="switch" className="h-5 w-5" />
                  <Label htmlFor="switch" className="cursor-pointer font-normal text-xs sm:text-sm">
                    Switch
                  </Label>
                </div>
              )}
            </RadioGroup>

            {!canRedeem && transactionType === 'Redemption' && (
              <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  No existing holdings found for this scheme. Redemption is not available.
                </AlertDescription>
              </Alert>
            )}

            {!canSwitch && transactionType === 'Switch' && (
              <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  No existing holdings found. Switch is not available.
                </AlertDescription>
              </Alert>
            )}
          </div>

          {/* Order Type for Purchase (Initial vs Additional) */}
          {transactionType === 'Purchase' && (
            <div className="space-y-3">
              <Label className="text-base font-semibold">Order Type <span className="text-destructive">*</span></Label>
              <RadioGroup
                value={orderType}
                onValueChange={(value) => setOrderType(value as 'Initial Purchase' | 'Additional Purchase')}
                className="flex gap-6"
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="Initial Purchase" id="initial" />
                  <Label htmlFor="initial" className="cursor-pointer font-normal">
                    Initial Purchase
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="Additional Purchase" id="additional" />
                  <Label htmlFor="additional" className="cursor-pointer font-normal">
                    Additional Purchase
                  </Label>
                </div>
              </RadioGroup>
              {orderType === 'Initial Purchase' && (
                <Alert>
                  <Info className="h-4 w-4" />
                  <AlertDescription>
                    This is the first purchase of this scheme. Nominee information may be required.
                  </AlertDescription>
                </Alert>
              )}
            </div>
          )}

          {/* Source Scheme Selection for Switch */}
          {transactionType === 'Switch' && (
            <div className="space-y-2">
              <Label htmlFor="source-scheme" className="text-base font-semibold">
                Source Scheme <span className="text-destructive">*</span>
              </Label>
              <Select
                value={sourceSchemeId?.toString() || ''}
                onValueChange={(value) => setSourceSchemeId(parseInt(value))}
              >
                <SelectTrigger id="source-scheme">
                  <SelectValue placeholder="Select source scheme" />
                </SelectTrigger>
                <SelectContent>
                  {existingHoldings.map((holding) => (
                    <SelectItem key={holding.productId} value={holding.productId.toString()}>
                      {holding.schemeName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.sourceScheme && (
                <p className="text-sm text-destructive">{errors.sourceScheme}</p>
              )}
            </div>
          )}

          {/* Amount Entry */}
          <div className="space-y-2">
            <Label htmlFor="amount" className="text-sm sm:text-base font-semibold">
              Amount (₹) <span className="text-destructive" aria-label="required">*</span>
            </Label>
            <Input
              id="amount"
              type="number"
              step="0.01"
              min="0"
              value={amount || ''}
              onChange={(e) => {
                const newAmount = parseFloat(e.target.value) || 0;
                setAmount(newAmount);
              }}
              placeholder="Enter amount"
              className={`min-h-[44px] text-base sm:text-sm ${errors.amount ? 'border-destructive' : ''}`}
              aria-invalid={errors.amount ? 'true' : 'false'}
              aria-describedby={errors.amount ? 'amount-error' : 'amount-help'}
            />
            {errors.amount && (
              <p id="amount-error" className="text-xs sm:text-sm text-destructive" role="alert">{errors.amount}</p>
            )}
            {product.minInvestment && (
              <p id="amount-help" className="text-xs sm:text-sm text-muted-foreground">
                Min: ₹{product.minInvestment.toLocaleString()}
                {product.maxInvestment && ` | Max: ₹${product.maxInvestment.toLocaleString()}`}
              </p>
            )}
          </div>

          {/* Units Display (calculated) */}
          {transactionType === 'Purchase' && product.nav && amount > 0 && (
            <div className="space-y-2">
              <Label htmlFor="units" className="text-base font-semibold">Units (Calculated)</Label>
              <Input
                id="units"
                type="number"
                step="0.0001"
                value={units.toFixed(4)}
                disabled
                className="bg-muted"
              />
              <p className="text-sm text-muted-foreground">
                Based on NAV: ₹{product.nav.toFixed(2)}
              </p>
            </div>
          )}

          {/* Full Redemption/Switch Toggle */}
          {(transactionType === 'Redemption' || transactionType === 'Switch') && (
            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="full-redemption"
                  checked={isFullRedemption}
                  onChange={(e) => setIsFullRedemption(e.target.checked)}
                  className="h-4 w-4 rounded border-gray-300"
                />
                <Label htmlFor="full-redemption" className="cursor-pointer font-normal">
                  Full {transactionType === 'Redemption' ? 'Redemption' : 'Switch'} (Close Account)
                </Label>
              </div>
              {isFullRedemption && (
                <Alert>
                  <Info className="h-4 w-4" />
                  <AlertDescription>
                    All units will be {transactionType === 'Redemption' ? 'redeemed' : 'switched'} and the account will be closed.
                  </AlertDescription>
                </Alert>
              )}
            </div>
          )}
        </div>

        <DialogFooter className="flex-col sm:flex-row gap-2 sm:gap-3">
          <Button 
            variant="outline" 
            onClick={() => onOpenChange(false)} 
            className="w-full sm:w-auto min-h-[44px] touch-manipulation"
            aria-label="Cancel adding to cart"
          >
            Cancel
          </Button>
          <Button 
            onClick={handleAdd} 
            className="w-full sm:w-auto min-h-[44px] touch-manipulation"
            aria-label="Add item to cart"
          >
            Add to Cart
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}


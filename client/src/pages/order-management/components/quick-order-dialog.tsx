/**
 * Quick Order Dialog Component
 * Module A: Quick Order Placement
 * Main dialog for quick order placement with favorites, recent orders, and amount presets
 */

import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Loader2, AlertTriangle } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import FavoritesList from './quick-order/favorites-list';
import RecentOrders from './quick-order/recent-orders';
import AmountPresets from './quick-order/amount-presets';
import {
  useFavorites,
  useAddFavorite,
  useRemoveFavorite,
  useRecentOrders,
  usePlaceQuickOrder,
} from '../hooks/use-quick-order';
import { Favorite, RecentOrder } from '../types/quick-order.types';
import { CartItem } from '../types/order.types';
import { useQuery } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { Product } from '../types/order.types';

interface QuickOrderDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAddToCart: (item: CartItem) => void;
}

export default function QuickOrderDialog({
  open,
  onOpenChange,
  onAddToCart,
}: QuickOrderDialogProps) {
  const [selectedAmount, setSelectedAmount] = useState<number | undefined>();
  const [customAmount, setCustomAmount] = useState<string>('');
  const [activeTab, setActiveTab] = useState<'favorites' | 'recent'>('favorites');
  const [selectedFavorite, setSelectedFavorite] = useState<Favorite | null>(null);
  const [selectedRecentOrder, setSelectedRecentOrder] = useState<RecentOrder | null>(null);
  const [errors, setErrors] = useState<string[]>([]);

  // Fetch data
  const { data: favorites = [], isLoading: favoritesLoading } = useFavorites();
  const { data: recentOrders = [], isLoading: recentLoading } = useRecentOrders(5);
  const addFavoriteMutation = useAddFavorite();
  const removeFavoriteMutation = useRemoveFavorite();
  const placeQuickOrderMutation = usePlaceQuickOrder();

  // Fetch products for validation
  const { data: products = [] } = useQuery<Product[]>({
    queryKey: ['/api/order-management/products'],
    queryFn: async () => {
      const response = await apiRequest('GET', '/api/order-management/products');
      const data = await response.json();
      return Array.isArray(data) ? data : [];
    },
  });

  // Reset state when dialog opens/closes
  useEffect(() => {
    if (open) {
      setSelectedAmount(undefined);
      setCustomAmount('');
      setSelectedFavorite(null);
      setSelectedRecentOrder(null);
      setErrors([]);
    }
  }, [open]);

  // Get current amount (preset or custom)
  const getCurrentAmount = (): number => {
    if (selectedAmount) return selectedAmount;
    if (customAmount) {
      const parsed = parseFloat(customAmount);
      return isNaN(parsed) ? 0 : parsed;
    }
    return 0;
  };

  // Validate amount
  const validateAmount = (amount: number, product?: Product): string[] => {
    const validationErrors: string[] = [];

    if (amount <= 0) {
      validationErrors.push('Amount must be greater than 0');
    }

    if (product) {
      if (amount < product.minInvestment) {
        validationErrors.push(
          `Minimum investment is ₹${product.minInvestment.toLocaleString()}`
        );
      }
      if (product.maxInvestment && amount > product.maxInvestment) {
        validationErrors.push(
          `Maximum investment is ₹${product.maxInvestment.toLocaleString()}`
        );
      }
    }

    return validationErrors;
  };

  // Handle quick invest from favorites
  const handleQuickInvestFromFavorite = async (favorite: Favorite) => {
    const amount = getCurrentAmount();
    if (amount <= 0) {
      setErrors(['Please select or enter an amount']);
      return;
    }

    const product = products.find((p) => p.id === favorite.productId);
    const validationErrors = validateAmount(amount, product);
    if (validationErrors.length > 0) {
      setErrors(validationErrors);
      return;
    }

    setErrors([]);
    setSelectedFavorite(favorite);

    try {
      const result = await placeQuickOrderMutation.mutateAsync({
        productId: favorite.productId,
        amount,
        transactionType: 'Purchase',
        orderType: 'Additional Purchase', // Default to additional purchase
      });

      if (result.success && result.data?.cartItem) {
        onAddToCart(result.data.cartItem);
        onOpenChange(false);
      }
    } catch (error) {
      // Error handling is done in the mutation
    }
  };

  // Handle reorder from recent orders
  const handleReorder = async (order: RecentOrder) => {
    setSelectedRecentOrder(order);
    setErrors([]);

    const product = products.find((p) => p.id === order.productId);
    const validationErrors = validateAmount(order.amount, product);
    if (validationErrors.length > 0) {
      setErrors(validationErrors);
      return;
    }

    try {
      const result = await placeQuickOrderMutation.mutateAsync({
        productId: order.productId,
        amount: order.amount,
        transactionType: order.transactionType as any,
      });

      if (result.success && result.data?.cartItem) {
        onAddToCart(result.data.cartItem);
        onOpenChange(false);
      }
    } catch (error) {
      // Error handling is done in the mutation
    }
  };

  // Handle remove favorite
  const handleRemoveFavorite = async (favoriteId: string) => {
    await removeFavoriteMutation.mutateAsync(favoriteId);
  };

  const currentAmount = getCurrentAmount();
  const isLoading =
    placeQuickOrderMutation.isPending ||
    addFavoriteMutation.isPending ||
    removeFavoriteMutation.isPending;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl sm:text-2xl">Quick Order</DialogTitle>
          <DialogDescription className="text-sm sm:text-base">
            Place orders quickly from favorites or recent orders
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 mt-4">
          {/* Amount Selection */}
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="amount" className="text-base font-semibold">
                Investment Amount (₹) <span className="text-destructive">*</span>
              </Label>
              <div className="space-y-3">
                <AmountPresets
                  selectedAmount={selectedAmount}
                  onSelectAmount={(amount) => {
                    setSelectedAmount(amount);
                    setCustomAmount('');
                  }}
                  disabled={isLoading}
                />
                <div className="flex items-center gap-2">
                  <Input
                    id="amount"
                    type="number"
                    step="100"
                    min="0"
                    placeholder="Or enter custom amount"
                    value={customAmount}
                    onChange={(e) => {
                      setCustomAmount(e.target.value);
                      setSelectedAmount(undefined);
                    }}
                    disabled={isLoading}
                    className="flex-1"
                  />
                  {currentAmount > 0 && (
                    <div className="text-sm font-medium text-muted-foreground whitespace-nowrap">
                      ₹{currentAmount.toLocaleString()}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Errors */}
            {errors.length > 0 && (
              <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  <ul className="list-disc list-inside space-y-1">
                    {errors.map((error, index) => (
                      <li key={index}>{error}</li>
                    ))}
                  </ul>
                </AlertDescription>
              </Alert>
            )}
          </div>

          {/* Tabs for Favorites and Recent Orders */}
          <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="favorites">Favorites</TabsTrigger>
              <TabsTrigger value="recent">Recent Orders</TabsTrigger>
            </TabsList>

            <TabsContent value="favorites" className="space-y-4 mt-4">
              <FavoritesList
                favorites={favorites}
                isLoading={favoritesLoading}
                onQuickInvest={handleQuickInvestFromFavorite}
                onRemoveFavorite={handleRemoveFavorite}
                isInvesting={isLoading && selectedFavorite !== null}
              />
            </TabsContent>

            <TabsContent value="recent" className="space-y-4 mt-4">
              <RecentOrders
                recentOrders={recentOrders}
                isLoading={recentLoading}
                onReorder={handleReorder}
                isReordering={isLoading && selectedRecentOrder !== null}
              />
            </TabsContent>
          </Tabs>
        </div>

        {/* Footer Actions */}
        <div className="flex justify-end gap-2 pt-4 border-t">
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isLoading}>
            Cancel
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}


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
import { Textarea } from '@/components/ui/textarea';
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
import { toast } from '@/hooks/use-toast';
import { useOrderIntegration } from '../context/order-integration-context';

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
  const { state, actions } = useOrderIntegration();
  const [selectedAmount, setSelectedAmount] = useState<number | undefined>();
  const [customAmount, setCustomAmount] = useState<string>('');
  const [activeTab, setActiveTab] = useState<'favorites' | 'recent'>('favorites');
  const [selectedFavorite, setSelectedFavorite] = useState<Favorite | null>(null);
  const [selectedRecentOrder, setSelectedRecentOrder] = useState<RecentOrder | null>(null);
  const [errors, setErrors] = useState<string[]>([]);
  const [nlCommand, setNlCommand] = useState('');
  const [nlProcessing, setNlProcessing] = useState(false);
  const [nlError, setNlError] = useState<string | null>(null);

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
      setNlCommand('');
      setNlError(null);
      setNlProcessing(false);
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

  const computeMatchScore = (haystack: string, command: string): number => {
    const normalizedHaystack = haystack.toLowerCase();
    const normalizedCommand = command.toLowerCase();
    let score = 0;
    if (normalizedCommand.includes(normalizedHaystack)) {
      score += normalizedHaystack.length * 2;
    }
    const words = normalizedHaystack.split(/\s+/).filter(word => word.length > 2);
    words.forEach(word => {
      if (normalizedCommand.includes(word)) {
        score += word.length;
      }
    });
    return score;
  };

  const findMatchingProduct = (command: string): Product | undefined => {
    let best: { product: Product; score: number } | undefined;
    products.forEach(product => {
      const score = computeMatchScore(product.schemeName, command);
      if (score > (best?.score ?? 0)) {
        best = { product, score };
      }
    });
    return best?.score ? best.product : undefined;
  };

  const findMatchingCartItem = (command: string): CartItem | undefined => {
    let best: { item: CartItem; score: number } | undefined;
    state.cartItems.forEach(item => {
      const score = computeMatchScore(item.schemeName, command);
      if (score > (best?.score ?? 0)) {
        best = { item, score };
      }
    });
    return best?.score ? best.item : undefined;
  };

  type ParsedCommand =
    | { action: 'add'; amount: number; product: Product }
    | { action: 'update'; amount: number; product?: Product; cartItem: CartItem }
    | { action: 'remove'; cartItem: CartItem; product?: Product };

  const parseNaturalLanguageCommand = (command: string): ParsedCommand | { error: string } => {
    const trimmed = command.trim();
    if (!trimmed) {
      return { error: 'Enter a command such as "Add 5000 to Axis Bluechip".' };
    }

    const lower = trimmed.toLowerCase();
    let action: ParsedCommand['action'] = 'add';
    if (/(remove|delete|drop|clear)/.test(lower)) {
      action = 'remove';
    } else if (/(update|change|set|adjust|increase|decrease|reduce)/.test(lower)) {
      action = 'update';
    }

    const amountMatch = lower.match(/(?:₹|rs\.?|inr)?\s*([0-9][0-9,]*(?:\.\d{1,2})?)/);
    const amount = amountMatch ? Number(amountMatch[1].replace(/,/g, '')) : undefined;

    const matchedCartItem = findMatchingCartItem(lower);
    const matchedProduct = findMatchingProduct(lower) || (matchedCartItem ? products.find(p => p.id === matchedCartItem.productId) : undefined);

    if (action === 'add') {
      if (!matchedProduct) {
        return { error: 'Unable to find a matching product in the catalog.' };
      }
      if (!amount || Number.isNaN(amount) || amount <= 0) {
        return { error: 'Please include a valid amount in your command.' };
      }
      return { action: 'add', amount, product: matchedProduct };
    }

    if (!matchedCartItem) {
      return { error: 'No matching cart item found for the requested action.' };
    }

    if (action === 'update') {
      if (!amount || Number.isNaN(amount) || amount <= 0) {
        return { error: 'Specify the target amount to update the cart item.' };
      }
      return { action: 'update', amount, cartItem: matchedCartItem, product: matchedProduct };
    }

    return { action: 'remove', cartItem: matchedCartItem, product: matchedProduct };
  };

  const handleNaturalLanguageSubmit = async () => {
    if (!nlCommand.trim()) {
      setNlError('Enter a command to interpret.');
      return;
    }

    setNlProcessing(true);
    setNlError(null);
    try {
      const parsed = parseNaturalLanguageCommand(nlCommand);
      if ('error' in parsed) {
        setNlError(parsed.error);
        return;
      }

      if (parsed.action === 'add') {
        const validationErrors = validateAmount(parsed.amount, parsed.product);
        if (validationErrors.length > 0) {
          setErrors(validationErrors);
          return;
        }

        const newItem: CartItem = {
          id: `${parsed.product.id}-${Date.now()}`,
          productId: parsed.product.id,
          schemeName: parsed.product.schemeName,
          transactionType: 'Purchase',
          amount: parsed.amount,
          nav: parsed.product.nav,
        };

        onAddToCart(newItem);
        toast({
          title: 'Item added to cart',
          description: `Added ₹${parsed.amount.toLocaleString('en-IN')} in ${parsed.product.schemeName}.`,
        });
        setNlCommand('');
        setErrors([]);
      } else if (parsed.action === 'update') {
        const product = parsed.product || products.find(p => p.id === parsed.cartItem.productId);
        const validationErrors = validateAmount(parsed.amount, product);
        if (validationErrors.length > 0) {
          setErrors(validationErrors);
          return;
        }

        const updatedItems = state.cartItems.map(item =>
          item.id === parsed.cartItem.id ? { ...item, amount: parsed.amount } : item
        );
        actions.updateCartItem(parsed.cartItem.id, { amount: parsed.amount });
        await actions.calculateImpactPreview(updatedItems);
        toast({
          title: 'Cart updated',
          description: `${parsed.cartItem.schemeName} set to ₹${parsed.amount.toLocaleString('en-IN')}.`,
        });
        setNlCommand('');
        setErrors([]);
      } else {
        const remainingItems = state.cartItems.filter(item => item.id !== parsed.cartItem.id);
        actions.removeFromCart(parsed.cartItem.id);
        await actions.calculateImpactPreview(remainingItems);
        toast({
          title: 'Item removed',
          description: `${parsed.cartItem.schemeName} removed from cart.`,
        });
        setNlCommand('');
        setErrors([]);
      }
    } finally {
      setNlProcessing(false);
    }
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
          {/* Natural Language Command */}
          <div className="space-y-2">
            <Label htmlFor="nl-command" className="text-base font-semibold">
              Natural Language Command
            </Label>
            <Textarea
              id="nl-command"
              placeholder="e.g. Add 5000 to Axis Bluechip or remove HDFC Balanced"
              value={nlCommand}
              onChange={(event) => setNlCommand(event.target.value)}
              disabled={nlProcessing}
              className="min-h-[80px]"
            />
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
              {nlError && <p className="text-xs text-destructive">{nlError}</p>}
              <div className="flex items-center gap-2 justify-end">
                <Button
                  onClick={handleNaturalLanguageSubmit}
                  disabled={nlProcessing || !nlCommand.trim()}
                  variant="outline"
                >
                  {nlProcessing ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" />
                      Interpreting...
                    </>
                  ) : (
                    'Interpret & Apply'
                  )}
                </Button>
              </div>
            </div>
            <p className="text-xs text-muted-foreground">
              Try commands like "Invest 10,000 in Balanced Advantage" or "Remove Axis Bluechip".
            </p>
          </div>

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


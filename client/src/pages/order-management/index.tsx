import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Loader2, AlertTriangle, X, TrendingUp } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import ProductList from './components/product-list';
import ProductCart from './components/product-cart';
import TransactionMode from './components/transaction-mode';
import NomineeForm from './components/nominee-form';
import FullSwitchRedemptionPanel from './components/full-switch-redemption-panel';
import OrderInfoOverlay from './components/overlays/order-info-overlay';
import DocumentsOverlay from './components/overlays/documents-overlay';
import DeviationsOverlay from './components/overlays/deviations-overlay';
import OrderBook from './components/order-book';
import AddToCartDialog from './components/add-to-cart-dialog';
import QuickOrderDialog from './components/quick-order-dialog';
import QuickInvestButton from './components/quick-order/quick-invest-button';
import PortfolioSidebar from './components/portfolio-sidebar';
import SwitchDialog from './components/switch-dialog';
import RedemptionDialog from './components/redemption-dialog';
import SIPDialog from './components/sip-dialog';
import { GoalSelector, GoalAllocation, GoalCreationWizard } from './components/goals';
import { OrderIntegrationProvider, useOrderIntegration } from './context/order-integration-context';
import { CartItem, TransactionModeData, Nominee, FullSwitchData, FullRedemptionData, Deviation, Order, Product } from './types/order.types';
import { apiRequest } from '@/lib/queryClient';
import { validateOrder, validateOrderWithProducts, validateNomineePercentages, validatePAN, validateGuardianInfo } from './utils/order-validations';
import { useQuery } from '@tanstack/react-query';

function OrderManagementPageContent() {
  const { state, actions } = useOrderIntegration();
  const cartItems = state.cartItems;
  const [transactionMode, setTransactionMode] = useState<TransactionModeData | null>(null);
  const [nominees, setNominees] = useState<Nominee[]>([]);
  const [optOutOfNomination, setOptOutOfNomination] = useState(false);
  const [fullSwitchData, setFullSwitchData] = useState<FullSwitchData | null>(null);
  const [fullRedemptionData, setFullRedemptionData] = useState<FullRedemptionData | null>(null);
  const [activeTab, setActiveTab] = useState('products');
  
  // Overlay states
  const [orderInfoOverlay, setOrderInfoOverlay] = useState<{open: boolean, cartItemId: string | null}>({open: false, cartItemId: null});
  const [documentsOverlay, setDocumentsOverlay] = useState<{open: boolean, productId: number | null}>({open: false, productId: null});
  const [deviationsOverlay, setDeviationsOverlay] = useState<{open: boolean, productId: number | null, deviations: Deviation[]}>({open: false, productId: null, deviations: []});
  const [addToCartDialog, setAddToCartDialog] = useState<{open: boolean, product: Product | null}>({open: false, product: null});
  const [clientId, setClientId] = useState<number | null>(null); // TODO: Get from route/context
  const [acknowledgedDeviations, setAcknowledgedDeviations] = useState<Set<string>>(new Set());
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const [validationWarnings, setValidationWarnings] = useState<string[]>([]);
  const [selectedGoalId, setSelectedGoalId] = useState<string | null>(null);
  const [showGoalAllocation, setShowGoalAllocation] = useState(false);
  const [showCreateGoalDialog, setShowCreateGoalDialog] = useState(false);

  // Fetch products for validation
  const { data: products = [] } = useQuery<Product[]>({
    queryKey: ['/api/order-management/products'],
    queryFn: async () => {
      const response = await apiRequest('GET', '/api/order-management/products');
      const data = await response.json();
      // Ensure we always return an array
      return Array.isArray(data) ? data : [];
    },
  });

  // Load portfolio data when client is selected
  useEffect(() => {
    if (clientId) {
      // Fetch portfolio data
      fetch('/api/portfolio/current-allocation', {
        headers: { 'Content-Type': 'application/json' },
      })
        .then(res => res.json())
        .then(data => {
          if (data.success && data.portfolio) {
            actions.setPortfolioData({
              currentAllocation: data.portfolio.allocation || {},
              holdings: data.portfolio.holdings || [],
            });
          }
        })
        .catch(err => console.error('Failed to load portfolio:', err));
    }
  }, [clientId, actions]);

  // Load favorites and recent orders
  useEffect(() => {
    // Fetch favorites
    fetch('/api/quick-order/favorites', {
      headers: { 'Content-Type': 'application/json' },
    })
      .then(res => res.json())
      .then(data => {
        if (data.success && data.favorites) {
          actions.setFavorites(data.favorites);
        }
      })
      .catch(err => console.error('Failed to load favorites:', err));

    // Fetch recent orders
    fetch('/api/quick-order/recent', {
      headers: { 'Content-Type': 'application/json' },
    })
      .then(res => res.json())
      .then(data => {
        if (data.success && data.recentOrders) {
          actions.setRecentOrders(data.recentOrders);
        }
      })
      .catch(err => console.error('Failed to load recent orders:', err));
  }, [actions]);

  // Use integration context actions
  const handleAddToCart = (product: Product) => {
    setAddToCartDialog({ open: true, product });
  };

  const handleConfirmAddToCart = (item: CartItem) => {
    actions.addToCart(item);
    setAddToCartDialog({ open: false, product: null });
    // Calculate portfolio impact when items are added
    if (state.portfolioData) {
      actions.calculateImpactPreview([...cartItems, item]);
    }
  };

  const handleRemoveFromCart = (itemId: string) => {
    actions.removeFromCart(itemId);
    // Recalculate portfolio impact
    if (state.portfolioData) {
      actions.calculateImpactPreview(cartItems.filter(item => item.id !== itemId));
    }
  };

  const handleUpdateCartItem = (itemId: string, updates: Partial<CartItem>) => {
    actions.updateCartItem(itemId, updates);
    // Recalculate portfolio impact
    if (state.portfolioData) {
      const updatedItems = cartItems.map(item => 
        item.id === itemId ? { ...item, ...updates } : item
      );
      actions.calculateImpactPreview(updatedItems);
    }
  };

  // Overlay handlers
  const handleOpenOrderInfo = (cartItemId: string) => {
    setOrderInfoOverlay({open: true, cartItemId});
  };

  const handleOpenDocuments = (productId: number) => {
    setDocumentsOverlay({open: true, productId});
  };

  const handleOpenDeviations = (productId: number) => {
    // Mock deviations - in real app, fetch from API
    const mockDeviations: Deviation[] = [
      {
        type: 'Amount Below Minimum' as const,
        description: 'Order amount is below the minimum investment requirement for this scheme.',
        impact: 'Order may be rejected by RTA',
        resolutionOptions: ['Increase order amount', 'Select different scheme'],
        acknowledged: acknowledgedDeviations.has(`amount-${productId}`),
      },
    ];
    setDeviationsOverlay({open: true, productId, deviations: mockDeviations});
  };

  const handleAcknowledgeDeviation = (deviationType: string) => {
    const key = `${deviationType}-${deviationsOverlay.productId}`;
    setAcknowledgedDeviations(new Set([...Array.from(acknowledgedDeviations), key]));
  };

  const handleSubmitOrder = async () => {
    // Comprehensive validation with product data and CRISIL rules
    // Mock market values - in production, fetch from holdings API
    const marketValues = new Map<number, number>();
    cartItems.forEach(item => {
      // Mock: assume market value is 2x the amount for redemption/switch
      // Note: Full Redemption/Switch don't need market value validation per BRD
      const transactionType = item.transactionType;
      if (transactionType === 'Redemption' || transactionType === 'Switch') {
        // Only regular redemption/switch, not full redemption/switch
        marketValues.set(item.productId, item.amount * 2);
      }
      // Full Redemption and Full Switch are handled separately and don't need market values
    });

    const validation = validateOrderWithProducts(
      cartItems,
      products,
      nominees,
      optOutOfNomination,
      transactionMode?.euin,
      marketValues
    );

    if (!validation.isValid) {
      setValidationErrors(validation.errors);
      setValidationWarnings(validation.warnings);
      // Scroll to top to show validation errors
      if (typeof window !== 'undefined') {
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
      toast({
        title: 'Validation Error',
        description: `Please fix ${validation.errors.length} error(s) before submitting.`,
        variant: 'destructive',
      });
      return;
    }

    if (validation.warnings.length > 0) {
      setValidationWarnings(validation.warnings);
      // Show warnings but allow submission
      validation.warnings.forEach(warning => {
        toast({
          title: 'Validation Warning',
          description: warning,
        });
      });
    } else {
      setValidationWarnings([]);
    }
    
    // Clear errors if validation passes
    setValidationErrors([]);

    // Additional checks
    if (!transactionMode || !transactionMode.mode) {
      setValidationErrors(['Please select a transaction mode.']);
      if (typeof window !== 'undefined') {
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
      toast({
        title: 'Validation Error',
        description: 'Please select a transaction mode.',
        variant: 'destructive',
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const orderData = {
        cartItems,
        transactionMode: {
          ...transactionMode,
          euin: transactionMode.euin || undefined,
        },
        nominees: optOutOfNomination ? [] : nominees,
        optOutOfNomination,
        fullSwitchData,
        fullRedemptionData,
        goalId: selectedGoalId || undefined,
      };

      // Submit to /orders/submit endpoint
      const response = await apiRequest('POST', '/api/order-management/orders/submit', orderData);
      const responseData = await response.json() as {success: boolean, message: string, data: Order};

      if (responseData.success && responseData.data) {
        toast({
          title: 'Order Submitted Successfully',
          description: `Order ${responseData.data.modelOrderId} has been submitted and is pending approval.`,
        });

        // Allocate to goal if selected
        if (selectedGoalId && responseData.data.id && clientId) {
          try {
            const totalAmount = cartItems.reduce((sum, item) => sum + item.amount, 0);
            await apiRequest('POST', `/api/goals/${selectedGoalId}/allocate`, {
              transactionId: responseData.data.id,
              amount: totalAmount,
              notes: `Order ${responseData.data.modelOrderId}`,
            });
            toast({
              title: 'Goal Updated',
              description: `Order amount has been allocated to the selected goal.`,
            });
          } catch (error) {
            console.error('Failed to allocate order to goal:', error);
            // Don't block order submission if goal allocation fails
            toast({
              title: 'Warning',
              description: 'Order submitted but goal allocation failed. You can allocate manually later.',
              variant: 'destructive',
            });
          }
        }

        // Clear validation messages
        setValidationErrors([]);
        setValidationWarnings([]);
        
        // Reset form
        actions.clearCart();
        setTransactionMode(null);
        setNominees([]);
        setOptOutOfNomination(false);
        setFullSwitchData(null);
        setFullRedemptionData(null);

        setSelectedGoalId(null);

        // Navigate to order confirmation page
        if (responseData.data.id) {
          window.location.hash = `#/order-management/orders/${responseData.data.id}/confirmation`;
        }
      }
    } catch (error: any) {
      // Handle structured error response
      let errorMessage = 'Failed to submit order. Please try again.';
      
      // apiRequest throws Error with message containing status and response text
      if (error.message) {
        try {
          // Try to parse error message for structured response
          const errorMatch = error.message.match(/\d+: (.+)/);
          if (errorMatch && errorMatch[1]) {
            const errorText = errorMatch[1];
            try {
              const errorData = JSON.parse(errorText);
              if (errorData.errors && Array.isArray(errorData.errors)) {
                errorMessage = errorData.errors.join('. ');
              } else if (errorData.message) {
                errorMessage = errorData.message;
              }
            } catch {
              // If not JSON, use the error text as-is
              errorMessage = errorText;
            }
          } else {
            errorMessage = error.message;
          }
        } catch {
          errorMessage = error.message || 'Failed to submit order. Please try again.';
        }
      }

      toast({
        title: 'Submission Failed',
        description: errorMessage,
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background px-3 sm:px-4 md:px-6 lg:px-8 xl:px-10 py-3 sm:py-4 md:py-6 lg:py-8">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-bold text-foreground mb-3 sm:mb-4 md:mb-6">
          Order Management
        </h1>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-3 sm:space-y-4 md:space-y-6">
          <TabsList className="grid grid-cols-2 sm:grid-cols-4 lg:flex w-full lg:w-auto gap-1 sm:gap-2">
            <TabsTrigger 
              value="products" 
              className="text-xs sm:text-sm px-2 sm:px-4 py-2 sm:py-2.5 min-h-[44px] touch-manipulation"
              aria-label="Products tab"
            >
              Products
            </TabsTrigger>
            <TabsTrigger 
              value="cart" 
              className="text-xs sm:text-sm px-2 sm:px-4 py-2 sm:py-2.5 min-h-[44px] touch-manipulation"
              aria-label={`Cart tab with ${cartItems.length} items`}
            >
              Cart <span className="ml-1 font-semibold">({cartItems.length})</span>
            </TabsTrigger>
            <TabsTrigger 
              value="review" 
              className="text-xs sm:text-sm px-2 sm:px-4 py-2 sm:py-2.5 min-h-[44px] touch-manipulation"
              aria-label="Review and submit tab"
            >
              Review & Submit
            </TabsTrigger>
            <TabsTrigger 
              value="order-book" 
              className="text-xs sm:text-sm px-2 sm:px-4 py-2 sm:py-2.5 min-h-[44px] touch-manipulation"
              aria-label="Order book tab"
            >
              Order Book
            </TabsTrigger>
          </TabsList>

          {/* Validation Errors Display */}
          {validationErrors.length > 0 && (
            <Card className="border-destructive/50 bg-destructive/5 dark:bg-destructive/10" role="alert" aria-live="polite" aria-atomic="true">
              <CardContent className="pt-4 sm:pt-6">
                <div className="space-y-3">
                  <div className="flex items-center justify-between gap-2">
                    <h3 className="font-semibold text-destructive dark:text-red-400 flex items-center gap-2 text-sm sm:text-base md:text-lg">
                      <AlertTriangle className="h-4 w-4 sm:h-5 sm:w-5 flex-shrink-0" aria-hidden="true" />
                      <span>Validation Errors ({validationErrors.length})</span>
                    </h3>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setValidationErrors([])}
                      aria-label="Dismiss validation errors"
                      className="h-8 w-8 sm:h-9 sm:w-9 flex-shrink-0 touch-manipulation"
                    >
                      <X className="h-4 w-4 sm:h-5 sm:w-5" aria-hidden="true" />
                    </Button>
                  </div>
                  <ul className="list-disc list-inside space-y-1.5 sm:space-y-2 text-xs sm:text-sm md:text-base text-destructive dark:text-red-300">
                    {validationErrors.map((error, index) => (
                      <li key={index} className="pl-1 sm:pl-2 break-words">{error}</li>
                    ))}
                  </ul>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Validation Warnings Display */}
          {validationWarnings.length > 0 && (
            <Card className="border-yellow-500 bg-yellow-500/5" role="alert" aria-live="polite" aria-atomic="true">
              <CardContent className="pt-4 sm:pt-6">
                <div className="space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <h3 className="font-semibold text-yellow-700 dark:text-yellow-500 flex items-center gap-2 text-sm sm:text-base">
                      <AlertTriangle className="h-4 w-4 sm:h-5 sm:w-5 flex-shrink-0" aria-hidden="true" />
                      <span>Validation Warnings ({validationWarnings.length})</span>
                    </h3>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setValidationWarnings([])}
                      aria-label="Dismiss validation warnings"
                      className="h-8 w-8 sm:h-9 sm:w-9 flex-shrink-0 touch-manipulation"
                    >
                      <X className="h-4 w-4 sm:h-5 sm:w-5" aria-hidden="true" />
                    </Button>
                  </div>
                  <ul className="list-disc list-inside space-y-1 text-xs sm:text-sm md:text-base text-yellow-700 dark:text-yellow-500">
                    {validationWarnings.map((warning, index) => (
                      <li key={index} className="pl-1 sm:pl-2 break-words">{warning}</li>
                    ))}
                  </ul>
                </div>
              </CardContent>
            </Card>
          )}

          <TabsContent value="products" className="space-y-3 sm:space-y-4 md:space-y-6">
            {/* Quick Actions Bar */}
            <div className="flex flex-wrap gap-2 sm:gap-3">
              <Button
                variant="outline"
                size="sm"
                onClick={actions.togglePortfolioSidebar}
                className="gap-2 min-h-[44px] touch-manipulation text-xs sm:text-sm"
                aria-label={state.showPortfolioSidebar ? 'Hide portfolio sidebar' : 'Show portfolio sidebar'}
              >
                <TrendingUp className="h-4 w-4 flex-shrink-0" aria-hidden="true" />
                <span className="hidden sm:inline">{state.showPortfolioSidebar ? 'Hide' : 'Show'} Portfolio</span>
                <span className="sm:hidden">Portfolio</span>
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => actions.openSwitchDialog()}
                disabled={!state.portfolioData || state.portfolioData.holdings.length === 0}
                className="min-h-[44px] touch-manipulation text-xs sm:text-sm"
                aria-label="Switch funds"
                aria-disabled={!state.portfolioData || state.portfolioData.holdings.length === 0}
              >
                Switch Funds
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => actions.openRedemptionDialog()}
                disabled={!state.portfolioData || state.portfolioData.holdings.length === 0}
                className="min-h-[44px] touch-manipulation text-xs sm:text-sm"
                aria-label="Redeem funds"
                aria-disabled={!state.portfolioData || state.portfolioData.holdings.length === 0}
              >
                Redeem
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={actions.openSIPDialog}
                className="min-h-[44px] touch-manipulation text-xs sm:text-sm"
                aria-label="Create SIP plan"
              >
                Create SIP
              </Button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 sm:gap-4 md:gap-6">
              <div className="lg:col-span-2 order-2 lg:order-1">
                <Card className="h-full">
                  <CardHeader className="pb-3 sm:pb-4">
                    <CardTitle className="text-base sm:text-lg md:text-xl">Product Selection</CardTitle>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <ProductList
                      onAddToCart={handleAddToCart}
                      onOpenDocuments={handleOpenDocuments}
                      onOpenDeviations={handleOpenDeviations}
                    />
                    
                    {/* Add to Cart Dialog */}
                    <AddToCartDialog
                      product={addToCartDialog.product}
                      open={addToCartDialog.open}
                      onOpenChange={(open) => setAddToCartDialog({ open, product: open ? addToCartDialog.product : null })}
                      onAddToCart={handleConfirmAddToCart}
                      existingHoldings={[]} // TODO: Fetch from API based on selected client
                    />
                  </CardContent>
                </Card>
              </div>
              <div className="order-1 lg:order-2">
                <Card className="sticky top-4 lg:top-6">
                  <CardHeader className="pb-3 sm:pb-4">
                    <CardTitle className="text-base sm:text-lg md:text-xl">Cart Summary</CardTitle>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <ProductCart 
                      items={cartItems}
                      onRemove={handleRemoveFromCart}
                      onUpdateQuantity={(id, quantity) => {
                        const item = cartItems.find(i => i.id === id);
                        if (item && item.nav) {
                          // Calculate amount based on quantity and NAV
                          const newAmount = quantity * item.nav;
                          handleUpdateCartItem(id, { 
                            amount: newAmount,
                            units: quantity
                          });
                        }
                      }}
                      onEdit={handleOpenOrderInfo}
                    />
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="cart" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2">
                <Card>
                  <CardHeader>
                    <CardTitle>Order Cart</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ProductCart 
                      items={cartItems}
                      onRemove={handleRemoveFromCart}
                      onUpdateQuantity={(id, quantity) => {
                        const item = cartItems.find(i => i.id === id);
                        if (item && item.nav) {
                          // Calculate amount based on quantity and NAV
                          const newAmount = quantity * item.nav;
                          handleUpdateCartItem(id, { 
                            amount: newAmount,
                            units: quantity
                          });
                        }
                      }}
                      onEdit={handleOpenOrderInfo}
                      editable
                    />
                  </CardContent>
                </Card>
              </div>
              <div>
                <Card>
                  <CardHeader>
                    <CardTitle>Cart Summary</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-medium text-muted-foreground">Total Items:</span>
                        <span className="text-sm font-semibold text-foreground">{cartItems.length}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-medium text-muted-foreground">Total Amount:</span>
                        <span className="text-lg font-bold text-foreground">
                          ₹{cartItems.reduce((sum, item) => sum + item.amount, 0).toLocaleString()}
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="review" className="space-y-3 sm:space-y-4 md:space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 sm:gap-4 md:gap-6">
              <Card>
                <CardHeader className="pb-3 sm:pb-4">
                  <CardTitle className="text-base sm:text-lg md:text-xl">Transaction Mode</CardTitle>
                </CardHeader>
                <CardContent className="pt-0">
                  <TransactionMode
                    value={transactionMode?.mode || null}
                    onChange={(mode, data) => {
                      if (mode) {
                        setTransactionMode({ mode, ...data, ...transactionMode });
                      }
                    }}
                    modeData={transactionMode || undefined}
                    onDataChange={(data) => {
                      if (transactionMode?.mode) {
                        setTransactionMode({ ...transactionMode, ...data, mode: transactionMode.mode });
                      }
                    }}
                    required
                  />
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3 sm:pb-4">
                  <CardTitle className="text-base sm:text-lg md:text-xl">Nominee Information</CardTitle>
                </CardHeader>
                <CardContent className="pt-0">
                  <NomineeForm
                    value={nominees}
                    onChange={setNominees}
                    optOut={optOutOfNomination}
                    onOptOutChange={setOptOutOfNomination}
                  />
                </CardContent>
              </Card>
            </div>

            {(fullSwitchData || fullRedemptionData) && (
              <Card>
                <CardHeader>
                  <CardTitle>
                    {fullSwitchData ? 'Full Switch Details' : 'Full Redemption Details'}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {fullSwitchData && (
                    <FullSwitchRedemptionPanel type="switch" data={fullSwitchData} />
                  )}
                  {fullRedemptionData && (
                    <FullSwitchRedemptionPanel type="redemption" data={fullRedemptionData} />
                  )}
                </CardContent>
              </Card>
            )}

            {/* Goal Allocation */}
            {clientId && (
              <Card>
                <CardHeader>
                  <CardTitle>Goal Allocation</CardTitle>
                </CardHeader>
                <CardContent>
                  <GoalSelector
                    clientId={clientId}
                    selectedGoalId={selectedGoalId || undefined}
                    onGoalSelect={(goalId) => setSelectedGoalId(goalId)}
                    onCreateGoal={() => setShowCreateGoalDialog(true)}
                  />
                </CardContent>
              </Card>
            )}

            {/* Submit Button */}
            <Card>
              <CardContent className="pt-4 sm:pt-6">
                <div className="flex flex-col-reverse sm:flex-row justify-end gap-3 sm:gap-4">
                  <Button
                    variant="outline"
                    onClick={() => setActiveTab('cart')}
                    disabled={isSubmitting}
                    className="w-full sm:w-auto min-h-[44px] touch-manipulation"
                    aria-label="Go back to cart"
                  >
                    Back to Cart
                  </Button>
                  <Button
                    onClick={handleSubmitOrder}
                    disabled={isSubmitting || cartItems.length === 0}
                    size="lg"
                    className="w-full sm:w-auto min-h-[44px] touch-manipulation"
                    aria-label={isSubmitting ? 'Submitting order' : 'Submit order'}
                    aria-disabled={isSubmitting || cartItems.length === 0}
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" />
                        Submitting...
                      </>
                    ) : (
                      'Submit Order'
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="order-book" className="space-y-6">
            <OrderBook 
              onViewOrder={(orderId) => {
                // Navigate to order details or show in overlay
                toast({
                  title: 'Order Details',
                  description: `Viewing order ${orderId}`,
                });
              }}
            />
          </TabsContent>
        </Tabs>

        {/* Overlays */}
        {orderInfoOverlay.cartItemId && (() => {
          const cartItem = cartItems.find(item => item.id === orderInfoOverlay.cartItemId);
          return cartItem ? (
            <OrderInfoOverlay
              cartItem={cartItem}
              open={orderInfoOverlay.open}
              onOpenChange={(open) => setOrderInfoOverlay({open, cartItemId: open ? orderInfoOverlay.cartItemId : null})}
              onUpdate={handleUpdateCartItem}
            />
          ) : null;
        })()}

        {documentsOverlay.productId !== null && (
          <DocumentsOverlay
            productId={documentsOverlay.productId}
            open={documentsOverlay.open}
            onOpenChange={(open) => setDocumentsOverlay({open, productId: open ? documentsOverlay.productId : null})}
          />
        )}

        {deviationsOverlay.productId !== null && (
          <DeviationsOverlay
            deviations={deviationsOverlay.deviations}
            open={deviationsOverlay.open}
            onOpenChange={(open) => setDeviationsOverlay({open, productId: open ? deviationsOverlay.productId : null, deviations: []})}
            onAcknowledge={handleAcknowledgeDeviation}
          />
        )}

        {/* Quick Order Dialog */}
        <QuickOrderDialog
          open={state.quickOrderDialogOpen}
          onOpenChange={actions.closeQuickOrderDialog}
          onAddToCart={handleConfirmAddToCart}
        />

        {/* Quick Invest Button */}
        <QuickInvestButton
          onClick={actions.openQuickOrderDialog}
          disabled={isSubmitting}
        />

        {/* Portfolio Sidebar */}
        {state.showPortfolioSidebar && (
          <div className="fixed right-0 top-0 h-full w-full sm:w-96 z-40 shadow-lg">
            <PortfolioSidebar
              clientId={null} // TODO: Get from context/route
              cartItems={cartItems}
            />
          </div>
        )}

        {/* Switch Dialog */}
        <SwitchDialog
          open={state.switchDialogOpen}
          onOpenChange={actions.closeSwitchDialog}
          sourceHoldings={state.portfolioData?.holdings.map(h => ({
            schemeId: h.schemeId,
            schemeName: h.schemeName,
            units: h.units,
            currentValue: h.currentValue,
            gainLoss: h.gainLoss,
          })) || []}
          targetProducts={products}
          clientId={clientId || undefined} // TODO: Get from context/route
        />

        {/* Redemption Dialog */}
        <RedemptionDialog
          open={state.redemptionDialogOpen}
          onOpenChange={actions.closeRedemptionDialog}
          onAddToCart={handleConfirmAddToCart}
          clientId={clientId || undefined} // TODO: Get from context/route
          schemeId={state.redemptionData?.schemeId}
          schemeName={state.redemptionData?.schemeId ? 
            products.find(p => p.id === state.redemptionData?.schemeId)?.schemeName : undefined}
        />

        {/* SIP Dialog */}
        <SIPDialog
          open={state.sipDialogOpen}
          onOpenChange={actions.closeSIPDialog}
          products={products}
          clientId={clientId || undefined} // TODO: Get from context/route
          onSIPCreated={(plan) => {
            actions.addSIPPlan(plan);
            toast({
              title: 'SIP Plan Created',
              description: 'Your SIP plan has been created successfully.',
            });
          }}
        />

        {/* Goal Creation Dialog */}
        {clientId && (
          <GoalCreationWizard
            clientId={clientId}
            open={showCreateGoalDialog}
            onOpenChange={setShowCreateGoalDialog}
            onSuccess={() => {
              setShowCreateGoalDialog(false);
            }}
          />
        )}
      </div>
    </div>
  );
}

export default function OrderManagementPage() {
  return (
    <OrderIntegrationProvider>
      <OrderManagementPageContent />
    </OrderIntegrationProvider>
  );
}


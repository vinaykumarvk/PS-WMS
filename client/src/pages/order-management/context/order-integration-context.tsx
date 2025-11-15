/**
 * Order Integration Context
 * 
 * Provides unified state management and cross-module communication
 * for all order management modules (Quick Order, Portfolio-Aware, SIP, Switch, Redemption)
 */

import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { CartItem, Product } from '../types/order.types';

const resolveApiUrl = (path: string): string => {
  if (/^https?:/i.test(path)) {
    return path;
  }
  const origin = typeof window !== 'undefined' && window.location?.origin
    ? window.location.origin
    : 'http://localhost';
  return new URL(path, origin).toString();
};

export interface PortfolioData {
  currentAllocation: Record<string, number>;
  holdings: Array<{
    schemeId: number;
    schemeName: string;
    units: number;
    currentValue: number;
    gainLoss: number;
  }>;
  impactPreview?: {
    newAllocation: Record<string, number>;
    changes: Array<{ category: string; change: number }>;
    recommendation?: AllocationRecommendation;
  };
}

export interface AllocationRecommendation {
  recommendedAmount: number;
  explanation: string;
  policyHighlights: string[];
  originalAmount: number;
  productId: number;
}

export interface SIPPlan {
  id: string;
  schemeId: number;
  schemeName: string;
  amount: number;
  frequency: 'monthly' | 'quarterly' | 'yearly';
  startDate: string;
  status: 'active' | 'paused' | 'cancelled';
}

export interface SwitchData {
  sourceSchemeId: number;
  targetSchemeIds: number[];
  amount?: number;
  units?: number;
  taxImplications?: {
    capitalGains: number;
    taxAmount: number;
  };
}

export interface RedemptionData {
  schemeId: number;
  amount?: number;
  units?: number;
  type: 'instant' | 'standard' | 'full';
  eligibility?: {
    instantAvailable: boolean;
    instantLimit: number;
  };
}

interface OrderIntegrationState {
  // Cart state
  cartItems: CartItem[];
  
  // Portfolio state
  portfolioData: PortfolioData | null;
  showPortfolioSidebar: boolean;
  
  // SIP state
  activeSIPPlans: SIPPlan[];
  sipDialogOpen: boolean;
  
  // Switch state
  switchDialogOpen: boolean;
  switchData: SwitchData | null;
  
  // Redemption state
  redemptionDialogOpen: boolean;
  redemptionData: RedemptionData | null;
  
  // Quick Order state
  quickOrderDialogOpen: boolean;
  favorites: Product[];
  recentOrders: CartItem[];
}

interface OrderIntegrationActions {
  // Cart actions
  addToCart: (item: CartItem) => void;
  removeFromCart: (itemId: string) => void;
  updateCartItem: (itemId: string, updates: Partial<CartItem>) => void;
  clearCart: () => void;

  // Portfolio actions
  setPortfolioData: (data: PortfolioData | null) => void;
  togglePortfolioSidebar: () => void;
  calculateImpactPreview: (items: CartItem[]) => Promise<void>;
  previewOptimizedAllocation: (
    item: Pick<CartItem, 'productId' | 'schemeName' | 'transactionType' | 'amount'> & { id?: string },
    product: Product
  ) => Promise<AllocationRecommendation | null>;
  
  // SIP actions
  setActiveSIPPlans: (plans: SIPPlan[]) => void;
  openSIPDialog: () => void;
  closeSIPDialog: () => void;
  addSIPPlan: (plan: SIPPlan) => void;
  
  // Switch actions
  openSwitchDialog: (data?: SwitchData) => void;
  closeSwitchDialog: () => void;
  setSwitchData: (data: SwitchData | null) => void;
  
  // Redemption actions
  openRedemptionDialog: (data?: RedemptionData) => void;
  closeRedemptionDialog: () => void;
  setRedemptionData: (data: RedemptionData | null) => void;
  
  // Quick Order actions
  openQuickOrderDialog: () => void;
  closeQuickOrderDialog: () => void;
  setFavorites: (favorites: Product[]) => void;
  setRecentOrders: (orders: CartItem[]) => void;
  addFavorite: (product: Product) => void;
  removeFavorite: (productId: number) => void;
}

interface OrderIntegrationContextValue {
  state: OrderIntegrationState;
  actions: OrderIntegrationActions;
}

const OrderIntegrationContext = createContext<OrderIntegrationContextValue | undefined>(undefined);

export function OrderIntegrationProvider({ children }: { children: ReactNode }) {
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [portfolioData, setPortfolioData] = useState<PortfolioData | null>(null);
  const [showPortfolioSidebar, setShowPortfolioSidebar] = useState(false);
  const [activeSIPPlans, setActiveSIPPlans] = useState<SIPPlan[]>([]);
  const [sipDialogOpen, setSIPDialogOpen] = useState(false);
  const [switchDialogOpen, setSwitchDialogOpen] = useState(false);
  const [switchData, setSwitchData] = useState<SwitchData | null>(null);
  const [redemptionDialogOpen, setRedemptionDialogOpen] = useState(false);
  const [redemptionData, setRedemptionData] = useState<RedemptionData | null>(null);
  const [quickOrderDialogOpen, setQuickOrderDialogOpen] = useState(false);
  const [favorites, setFavorites] = useState<Product[]>([]);
  const [recentOrders, setRecentOrders] = useState<CartItem[]>([]);

  // Cart actions
  const addToCart = useCallback((item: CartItem) => {
    setCartItems(prev => [...prev, item]);
  }, []);

  const removeFromCart = useCallback((itemId: string) => {
    setCartItems(prev => prev.filter(item => item.id !== itemId));
  }, []);

  const updateCartItem = useCallback((itemId: string, updates: Partial<CartItem>) => {
    setCartItems(prev => prev.map(item => 
      item.id === itemId ? { ...item, ...updates } : item
    ));
  }, []);

  const clearCart = useCallback(() => {
    setCartItems([]);
  }, []);

  // Portfolio actions
  const togglePortfolioSidebar = useCallback(() => {
    setShowPortfolioSidebar(prev => !prev);
  }, []);

  const calculateImpactPreview = useCallback(async (items: CartItem[]) => {
    try {
      const response = await fetch(resolveApiUrl('/api/portfolio/impact-preview'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cartItems: items }),
      });

      if (!response.ok) {
        return;
      }

      const data = await response.json();
      setPortfolioData((current) => {
        if (!current) {
          return current;
        }

        return {
          ...current,
          impactPreview: data.impactPreview,
        };
      });
    } catch (error) {
      console.error('Failed to calculate impact preview:', error);
    }
  }, []);

  const previewOptimizedAllocation = useCallback<
    OrderIntegrationActions['previewOptimizedAllocation']
  >(
    async (item, product) => {
      const payload = {
        cartItems: [
          ...cartItems,
          {
            id: item.id ?? `preview-${product.id}`,
            productId: item.productId,
            schemeName: item.schemeName,
            transactionType: item.transactionType,
            amount: item.amount,
          },
        ],
        optimize: true,
        portfolioSnapshot: portfolioData,
      };

      try {
        const response = await fetch(resolveApiUrl('/api/portfolio/impact-preview'), {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });

        if (response.ok) {
          const data = await response.json();
          const recommendation: AllocationRecommendation | null =
            data?.impactPreview?.recommendation ?? null;

          if (recommendation) {
            return recommendation;
          }
        }
      } catch (error) {
        console.error('Failed to fetch allocation recommendation:', error);
      }

      // Fallback recommendation based on portfolio tilt
      const currentShare = portfolioData?.currentAllocation[product.category] ?? 0;
      const desiredShare = 50;
      const remainingCapacity = Math.max(desiredShare - currentShare, 0);
      const scaledAmount =
        remainingCapacity > 0
          ? Math.max(
              product.minInvestment,
              Math.round((item.amount * remainingCapacity) / (currentShare || 10))
            )
          : Math.max(product.minInvestment, Math.round(item.amount * 0.75));

      const fallback: AllocationRecommendation = {
        recommendedAmount: product.maxInvestment
          ? Math.min(product.maxInvestment, scaledAmount)
          : scaledAmount,
        explanation:
          remainingCapacity > 0
            ? `Keeping ${product.category} exposure near ${desiredShare}% improves balance by closing a ${remainingCapacity.toFixed(
                1
              )}% gap.`
            : `${product.category} exposure is already heavy. Scaling back limits drift beyond policy guardrails.`,
        policyHighlights:
          remainingCapacity > 0
            ? [`Category gap of ${remainingCapacity.toFixed(1)}% identified.`]
            : ['Category overweight detected. Suggested to moderate allocation.'],
        originalAmount: item.amount,
        productId: product.id,
      };

      return fallback;
    },
    [cartItems, portfolioData]
  );

  // SIP actions
  const openSIPDialog = useCallback(() => {
    setSIPDialogOpen(true);
  }, []);

  const closeSIPDialog = useCallback(() => {
    setSIPDialogOpen(false);
  }, []);

  const addSIPPlan = useCallback((plan: SIPPlan) => {
    setActiveSIPPlans(prev => [...prev, plan]);
  }, []);

  // Switch actions
  const openSwitchDialog = useCallback((data?: SwitchData) => {
    setSwitchData(data || null);
    setSwitchDialogOpen(true);
  }, []);

  const closeSwitchDialog = useCallback(() => {
    setSwitchDialogOpen(false);
    setSwitchData(null);
  }, []);

  // Redemption actions
  const openRedemptionDialog = useCallback((data?: RedemptionData) => {
    setRedemptionData(data || null);
    setRedemptionDialogOpen(true);
  }, []);

  const closeRedemptionDialog = useCallback(() => {
    setRedemptionDialogOpen(false);
    setRedemptionData(null);
  }, []);

  // Quick Order actions
  const openQuickOrderDialog = useCallback(() => {
    setQuickOrderDialogOpen(true);
  }, []);

  const closeQuickOrderDialog = useCallback(() => {
    setQuickOrderDialogOpen(false);
  }, []);

  const addFavorite = useCallback((product: Product) => {
    setFavorites(prev => {
      if (prev.some(p => p.id === product.id)) {
        return prev;
      }
      return [...prev, product];
    });
  }, []);

  const removeFavorite = useCallback((productId: number) => {
    setFavorites(prev => prev.filter(p => p.id !== productId));
  }, []);

  const state: OrderIntegrationState = {
    cartItems,
    portfolioData,
    showPortfolioSidebar,
    activeSIPPlans,
    sipDialogOpen,
    switchDialogOpen,
    switchData,
    redemptionDialogOpen,
    redemptionData,
    quickOrderDialogOpen,
    favorites,
    recentOrders,
  };

  const actions: OrderIntegrationActions = {
    addToCart,
    removeFromCart,
    updateCartItem,
    clearCart,
    setPortfolioData,
    togglePortfolioSidebar,
    calculateImpactPreview,
    previewOptimizedAllocation,
    setActiveSIPPlans,
    openSIPDialog,
    closeSIPDialog,
    addSIPPlan,
    openSwitchDialog,
    closeSwitchDialog,
    setSwitchData,
    openRedemptionDialog,
    closeRedemptionDialog,
    setRedemptionData,
    openQuickOrderDialog,
    closeQuickOrderDialog,
    setFavorites,
    setRecentOrders,
    addFavorite,
    removeFavorite,
  };

  return (
    <OrderIntegrationContext.Provider value={{ state, actions }}>
      {children}
    </OrderIntegrationContext.Provider>
  );
}

export function useOrderIntegration() {
  const context = useContext(OrderIntegrationContext);
  if (!context) {
    throw new Error('useOrderIntegration must be used within OrderIntegrationProvider');
  }
  return context;
}


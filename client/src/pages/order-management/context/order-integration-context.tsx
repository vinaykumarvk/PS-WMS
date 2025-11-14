/**
 * Order Integration Context
 * 
 * Provides unified state management and cross-module communication
 * for all order management modules (Quick Order, Portfolio-Aware, SIP, Switch, Redemption)
 */

import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { CartItem, Product } from '../types/order.types';

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
  };
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
      // Call portfolio impact preview API
      const response = await fetch('/api/portfolio/impact-preview', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cartItems: items }),
      });
      
      if (response.ok) {
        const data = await response.json();
        if (portfolioData) {
          setPortfolioData({
            ...portfolioData,
            impactPreview: data.impactPreview,
          });
        }
      }
    } catch (error) {
      console.error('Failed to calculate impact preview:', error);
    }
  }, [portfolioData]);

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


import React, { createContext, useContext, useReducer, type ReactNode } from 'react';
import type { CartItem, Meal, SubscriptionPlan, Page, Order } from './types';
import type { Lang } from './i18n';
import { meals as initialMeals, subscriptionPlans as initialPlans } from './data';

interface AppState {
  currentPage: Page;
  cart: CartItem[];
  orderMode: 'alacarte' | 'subscription';
  subscriptionPlan: SubscriptionPlan | null;
  creditsRemaining: number;
  cartOpen: boolean;
  checkoutOpen: boolean;
  mobileMenuOpen: boolean;
  orderNumber: string | null;
  lang: Lang;
  orders: Order[];
  adminMeals: typeof initialMeals;
  adminPlans: SubscriptionPlan[];
  isAdmin: boolean;
}

type Action =
  | { type: 'SET_PAGE'; payload: Page }
  | { type: 'ADD_TO_CART'; payload: { meal: Meal; isCreditBased?: boolean } }
  | { type: 'REMOVE_FROM_CART'; payload: string }
  | { type: 'UPDATE_QUANTITY'; payload: { mealId: string; quantity: number } }
  | { type: 'CLEAR_CART' }
  | { type: 'SET_ORDER_MODE'; payload: 'alacarte' | 'subscription' }
  | { type: 'SELECT_PLAN'; payload: SubscriptionPlan }
  | { type: 'TOGGLE_CART'; payload?: boolean }
  | { type: 'TOGGLE_CHECKOUT'; payload?: boolean }
  | { type: 'TOGGLE_MOBILE_MENU'; payload?: boolean }
  | { type: 'SET_ORDER_NUMBER'; payload: string }
  | { type: 'COMPLETE_ORDER'; payload: Order }
  | { type: 'SET_LANG'; payload: Lang }
  | { type: 'UPDATE_ORDER_STATUS'; payload: { id: string; status: Order['status'] } }
  | { type: 'UPDATE_MEAL'; payload: Meal }
  | { type: 'ADD_MEAL'; payload: Meal }
  | { type: 'DELETE_MEAL'; payload: string }
  | { type: 'UPDATE_PLAN'; payload: SubscriptionPlan }
  | { type: 'ADD_PLAN'; payload: SubscriptionPlan }
  | { type: 'DELETE_PLAN'; payload: string }
  | { type: 'SET_ADMIN'; payload: boolean };

// Seed orders for demo
const seedOrders: Order[] = [
  {
    id: 'o1', orderNumber: 'FFF-1042', customerName: 'Ayşe Kaya', customerPhone: '+90 533 123 45 67',
    customerEmail: 'ayse@email.com', items: [], total: 6500, deliveryType: 'teslimat',
    address: 'Bağcılar Mah. No:12', district: 'İstanbul', deliveryDate: 'today',
    deliveryTime: '18:00 - 19:00', paymentMethod: 'cod', status: 'preparing',
    createdAt: new Date(Date.now() - 3600000).toISOString(), subscriptionPlan: initialPlans[0],
  },
  {
    id: 'o2', orderNumber: 'FFF-1041', customerName: 'Mehmet Demir', customerPhone: '+90 532 987 65 43',
    customerEmail: 'mehmet@email.com', items: [], total: 1170, deliveryType: 'gelal',
    address: '', district: '', deliveryDate: 'today',
    deliveryTime: '12:00 - 13:00', paymentMethod: 'card', status: 'delivered',
    createdAt: new Date(Date.now() - 86400000).toISOString(),
  },
  {
    id: 'o3', orderNumber: 'FFF-1040', customerName: 'Elena Ivanova', customerPhone: '+90 535 444 55 66',
    customerEmail: 'elena@email.com', items: [], total: 9450, deliveryType: 'teslimat',
    address: 'Nişantaşı Cad. No:5', district: 'Şişli', deliveryDate: 'day-1',
    deliveryTime: '10:00 - 11:00', paymentMethod: 'card', status: 'pending',
    createdAt: new Date(Date.now() - 1800000).toISOString(), subscriptionPlan: initialPlans[1],
  },
];

const initialState: AppState = {
  currentPage: 'home',
  cart: [],
  orderMode: 'alacarte',
  subscriptionPlan: null,
  creditsRemaining: 0,
  cartOpen: false,
  checkoutOpen: false,
  mobileMenuOpen: false,
  orderNumber: null,
  lang: 'tr',
  orders: seedOrders,
  adminMeals: [...initialMeals],
  adminPlans: [...initialPlans],
  isAdmin: false,
};

function reducer(state: AppState, action: Action): AppState {
  switch (action.type) {
    case 'SET_PAGE':
      return { ...state, currentPage: action.payload, mobileMenuOpen: false };
    case 'ADD_TO_CART': {
      const existing = state.cart.find(i => i.meal.id === action.payload.meal.id);
      if (existing) {
        return {
          ...state,
          cart: state.cart.map(i => i.meal.id === action.payload.meal.id ? { ...i, quantity: i.quantity + 1 } : i),
          creditsRemaining: action.payload.isCreditBased ? state.creditsRemaining - 1 : state.creditsRemaining,
        };
      }
      return {
        ...state,
        cart: [...state.cart, { meal: action.payload.meal, quantity: 1, isCreditBased: !!action.payload.isCreditBased }],
        creditsRemaining: action.payload.isCreditBased ? state.creditsRemaining - 1 : state.creditsRemaining,
      };
    }
    case 'REMOVE_FROM_CART': {
      const item = state.cart.find(i => i.meal.id === action.payload);
      return {
        ...state,
        cart: state.cart.filter(i => i.meal.id !== action.payload),
        creditsRemaining: item?.isCreditBased ? state.creditsRemaining + item.quantity : state.creditsRemaining,
      };
    }
    case 'UPDATE_QUANTITY': {
      if (action.payload.quantity <= 0) {
        const item = state.cart.find(i => i.meal.id === action.payload.mealId);
        return {
          ...state,
          cart: state.cart.filter(i => i.meal.id !== action.payload.mealId),
          creditsRemaining: item?.isCreditBased ? state.creditsRemaining + item.quantity : state.creditsRemaining,
        };
      }
      const item = state.cart.find(i => i.meal.id === action.payload.mealId);
      const diff = action.payload.quantity - (item?.quantity ?? 0);
      return {
        ...state,
        cart: state.cart.map(i => i.meal.id === action.payload.mealId ? { ...i, quantity: action.payload.quantity } : i),
        creditsRemaining: item?.isCreditBased ? state.creditsRemaining - diff : state.creditsRemaining,
      };
    }
    case 'CLEAR_CART':
      return { ...state, cart: [], creditsRemaining: state.subscriptionPlan?.mealCount ?? 0 };
    case 'SET_ORDER_MODE':
      return { ...state, orderMode: action.payload };
    case 'SELECT_PLAN':
      return { ...state, subscriptionPlan: action.payload, orderMode: 'subscription', creditsRemaining: action.payload.mealCount, cart: [], currentPage: 'menu' };
    case 'TOGGLE_CART':
      return { ...state, cartOpen: action.payload ?? !state.cartOpen };
    case 'TOGGLE_CHECKOUT':
      return { ...state, checkoutOpen: action.payload ?? !state.checkoutOpen, cartOpen: false };
    case 'TOGGLE_MOBILE_MENU':
      return { ...state, mobileMenuOpen: action.payload ?? !state.mobileMenuOpen };
    case 'SET_ORDER_NUMBER':
      return { ...state, orderNumber: action.payload };
    case 'COMPLETE_ORDER':
      return {
        ...state,
        orderNumber: action.payload.orderNumber,
        cart: [],
        checkoutOpen: false,
        cartOpen: false,
        currentPage: 'success',
        subscriptionPlan: null,
        orderMode: 'alacarte',
        creditsRemaining: 0,
        orders: [action.payload, ...state.orders],
      };
    case 'SET_LANG':
      return { ...state, lang: action.payload };
    case 'UPDATE_ORDER_STATUS':
      return { ...state, orders: state.orders.map(o => o.id === action.payload.id ? { ...o, status: action.payload.status } : o) };
    case 'UPDATE_MEAL':
      return { ...state, adminMeals: state.adminMeals.map(m => m.id === action.payload.id ? action.payload : m) };
    case 'ADD_MEAL':
      return { ...state, adminMeals: [...state.adminMeals, action.payload] };
    case 'DELETE_MEAL':
      return { ...state, adminMeals: state.adminMeals.filter(m => m.id !== action.payload) };
    case 'UPDATE_PLAN':
      return { ...state, adminPlans: state.adminPlans.map(p => p.id === action.payload.id ? action.payload : p) };
    case 'ADD_PLAN':
      return { ...state, adminPlans: [...state.adminPlans, action.payload] };
    case 'DELETE_PLAN':
      return { ...state, adminPlans: state.adminPlans.filter(p => p.id !== action.payload) };
    case 'SET_ADMIN':
      return { ...state, isAdmin: action.payload };
    default:
      return state;
  }
}

const AppContext = createContext<{ state: AppState; dispatch: React.Dispatch<Action> }>({ state: initialState, dispatch: () => {} });

export function AppProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, initialState);
  return <AppContext.Provider value={{ state, dispatch }}>{children}</AppContext.Provider>;
}

export function useApp() { return useContext(AppContext); }
export function useCartTotal(cart: CartItem[]) {
  return cart.reduce((sum, item) => sum + (item.isCreditBased ? 0 : item.meal.price * item.quantity), 0);
}
export function useCartItemCount(cart: CartItem[]) {
  return cart.reduce((sum, item) => sum + item.quantity, 0);
}

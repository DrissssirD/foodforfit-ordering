import React, { createContext, useContext, useReducer, useEffect, type ReactNode } from 'react';
import type { CartItem, Meal, SubscriptionPlan, Page, Order, ChatConversation, AgentSession, AgentMessage, RescheduleRequest } from './types';
import type { Lang } from './i18n';
import { meals as initialMeals, subscriptionPlans as initialPlans } from './data';
import { db } from './lib/database';

const STORAGE_KEY = 'foodforfit_state_v8';

const DEFAULT_AI_PROMPT = `You are FIT Assistant, a friendly nutrition and meal planning assistant for Food For Fit — a premium healthy meal delivery service in Turkey.

Context about our service:
- We offer weekly meal packages with free delivery
- We deliver to Istanbul, Monday-Saturday, 09:00-21:00
- Free delivery over ₺800, pick-up option available
- All meals show macros (calories, protein, carbs, fat)
- We have breakfast, main meals, bowls, and smoothies

Be warm, concise, and helpful. Help users choose packages, understand meals, or learn about delivery. Keep responses under 150 words. Use relevant emoji occasionally.`;

const initialAgentSession: AgentSession = {
  isOpen: false,
  messages: [],
  phase: 'greeting',
  discoveredGoals: [],
  suggestedPlanId: null,
};

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
  adminMeals: Meal[];
  adminPlans: SubscriptionPlan[];
  isAdmin: boolean;
  adminPassword: string;
  aiEnabled: boolean;
  aiSystemPrompt: string;
  aiQuickButtons: string[];
  chatHistory: ChatConversation[];
  trackingOrderNumber: string | null;
  aiAssistantEnabled: boolean;
  businessSettings: {
    businessName: string;
    phone: string;
    email: string;
    deliveryAreas: string;
    deliveryHours: string;
    minOrderAmount: number;
    freeDeliveryThreshold: number;
    deliveryFee: number;
    isAcceptingOrders: boolean;
    closedMessage: string;
  };
  myOrderNumbers: string[];
  agentSession: AgentSession;
  rescheduleRequests: RescheduleRequest[];
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
  | { type: 'SET_ADMIN'; payload: boolean }
  | { type: 'CHANGE_ADMIN_PASSWORD'; payload: string }
  | { type: 'SET_AI_ENABLED'; payload: boolean }
  | { type: 'SET_AI_SYSTEM_PROMPT'; payload: string }
  | { type: 'SET_AI_QUICK_BUTTONS'; payload: string[] }
  | { type: 'SET_TRACKING_ORDER'; payload: string }
  | { type: 'SET_AI_ASSISTANT_ENABLED'; payload: boolean }
  | { type: 'UPDATE_BUSINESS_SETTINGS'; payload: Partial<AppState['businessSettings']> }
  | { type: 'ADD_CHAT_CONVERSATION'; payload: ChatConversation }
  | { type: 'SYNC_STATE'; payload: AppState }
  | { type: 'UPDATE_ORDER_DELIVERY_STATUS'; payload: { orderId: string; deliveryId: string; status: 'pending' | 'preparing' | 'ready' | 'delivered' | 'cancelled' } }
  // ── Agent actions ──────────────────────────────────────────────────────────
  | { type: 'OPEN_AGENT' }
  | { type: 'CLOSE_AGENT' }
  | { type: 'ADD_AGENT_MESSAGE'; payload: AgentMessage }
  | { type: 'UPDATE_AGENT_MESSAGE'; payload: { id: string; updates: Partial<AgentMessage> } }
  | { type: 'SET_AGENT_PHASE'; payload: AgentSession['phase'] }
  | { type: 'SET_AGENT_GOALS'; payload: string[] }
  | { type: 'SET_AGENT_SUGGESTED_PLAN'; payload: string | null }
  | { type: 'RESET_AGENT' }
  // ── Reschedule actions ─────────────────────────────────────────────────────
  | { type: 'ADD_RESCHEDULE_REQUEST'; payload: RescheduleRequest }
  | { type: 'UPDATE_RESCHEDULE_REQUEST'; payload: { id: string; status: RescheduleRequest['status'] } }
  // ── Supabase sync ──────────────────────────────────────────────────────────
  | { type: 'SET_ORDERS'; payload: Order[] }
  | { type: 'SET_MEALS'; payload: Meal[] }
  | { type: 'SET_PLANS'; payload: SubscriptionPlan[] };

// Seed orders for demo
const seedOrders: Order[] = [
  {
    id: 'o1', orderNumber: 'FFF-1042', customerName: 'Ayşe Kaya', customerPhone: '+90 533 123 45 67',
    customerEmail: 'ayse@email.com',
    items: [
      { meal: initialMeals[0], quantity: 4, isCreditBased: true },
      { meal: initialMeals[5], quantity: 6, isCreditBased: true },
      { meal: initialMeals[9], quantity: 4, isCreditBased: true },
    ],
    total: 6500, deliveryType: 'teslimat',
    address: 'Bağcılar Mah. No:12', district: 'İstanbul', deliveryDate: new Date(Date.now() + 86400000).toISOString().split('T')[0],
    deliveryTime: '18:00 - 19:00', paymentMethod: 'cod', status: 'preparing',
    createdAt: new Date(Date.now() - 3600000).toISOString(), subscriptionPlan: initialPlans[0],
  },
  {
    id: 'o2', orderNumber: 'FFF-1041', customerName: 'Mehmet Demir', customerPhone: '+90 532 987 65 43',
    customerEmail: 'mehmet@email.com',
    items: [
      { meal: initialMeals[5], quantity: 1, isCreditBased: false },
      { meal: initialMeals[2], quantity: 1, isCreditBased: false },
    ],
    total: 1170, deliveryType: 'gelal',
    address: '', district: '', deliveryDate: new Date(Date.now() - 86400000).toISOString().split('T')[0],
    deliveryTime: '12:00 - 13:00', paymentMethod: 'card', status: 'delivered',
    createdAt: new Date(Date.now() - 86400000).toISOString(),
  },
  {
    id: 'o3', orderNumber: 'FFF-1040', customerName: 'Elena Ivanova', customerPhone: '+90 535 444 55 66',
    customerEmail: 'elena@email.com',
    items: [
      { meal: initialMeals[0], quantity: 3, isCreditBased: true },
      { meal: initialMeals[5], quantity: 5, isCreditBased: true },
      { meal: initialMeals[8], quantity: 4, isCreditBased: true },
      { meal: initialMeals[10], quantity: 5, isCreditBased: true },
      { meal: initialMeals[13], quantity: 4, isCreditBased: true },
    ],
    total: 9450, deliveryType: 'teslimat',
    address: 'Nişantaşı Cad. No:5', district: 'Şişli', deliveryDate: new Date(Date.now() + 86400000).toISOString().split('T')[0],
    deliveryTime: '10:00 - 11:00', paymentMethod: 'card', status: 'pending',
    createdAt: new Date(Date.now() - 1800000).toISOString(), subscriptionPlan: initialPlans[1],
  },
];

const initialState: AppState = {
  currentPage: 'home',
  cart: [],
  orderMode: 'subscription',
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
  adminPassword: 'admin123',
  aiEnabled: true,
  aiSystemPrompt: DEFAULT_AI_PROMPT,
  aiQuickButtons: ['🥗 Paket Öner', '🔥 Kalori sorusu', '🚚 Teslimat bilgisi'],
  chatHistory: [],
  trackingOrderNumber: null,
  aiAssistantEnabled: true,
  businessSettings: {
    businessName: 'FoodForFit',
    phone: '+90 212 000 00 00',
    email: 'info@foodforfitofficial.com',
    deliveryAreas: 'İstanbul (Avrupa Yakası)',
    deliveryHours: '09:00 - 21:00',
    minOrderAmount: 0,
    freeDeliveryThreshold: 800,
    deliveryFee: 50,
    isAcceptingOrders: true,
    closedMessage: 'Şu an sipariş almıyoruz. Yakında tekrar açılacağız.',
  },
  myOrderNumbers: [],
  agentSession: initialAgentSession,
  rescheduleRequests: [],
};

// Merge with localStorage if exists
function getInitialState(): AppState {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (!saved) return initialState;
    const parsed = JSON.parse(saved);
    return {
      ...initialState,
      ...parsed,
      cartOpen: false,
      checkoutOpen: false,
      mobileMenuOpen: false,
      isAdmin: parsed.isAdmin || false,
      agentSession: {
        ...initialAgentSession,
        ...(parsed.agentSession ?? {}),
        isOpen: false,
      },
    };
  } catch {
    return initialState;
  }
}

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
  if (!action.payload) return { ...state, subscriptionPlan: null, orderMode: 'alacarte', creditsRemaining: 0 };
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
        myOrderNumbers: [...(state.myOrderNumbers || []), action.payload.orderNumber],
      };
    case 'SET_LANG':
      return { ...state, lang: action.payload };
    case 'UPDATE_ORDER_STATUS':
      return { ...state, orders: state.orders.map(o => o.id === action.payload.id ? { ...o, status: action.payload.status } : o) };
    case 'UPDATE_ORDER_DELIVERY_STATUS':
      return {
        ...state,
        orders: state.orders.map(o => o.id === action.payload.orderId ? {
          ...o,
          deliveries: o.deliveries?.map(d => d.id === action.payload.deliveryId ? { ...d, status: action.payload.status } : d)
        } : o)
      };
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
    case 'CHANGE_ADMIN_PASSWORD':
      return { ...state, adminPassword: action.payload };
    case 'SET_AI_ENABLED':
      return { ...state, aiEnabled: action.payload };
    case 'SET_AI_SYSTEM_PROMPT':
      return { ...state, aiSystemPrompt: action.payload };
    case 'SET_AI_QUICK_BUTTONS':
      return { ...state, aiQuickButtons: action.payload };
    case 'SET_TRACKING_ORDER':
      return { ...state, trackingOrderNumber: action.payload };
    case 'SET_AI_ASSISTANT_ENABLED':
      return { ...state, aiAssistantEnabled: action.payload };
    case 'UPDATE_BUSINESS_SETTINGS':
      return { ...state, businessSettings: { ...state.businessSettings, ...action.payload } };
    case 'ADD_CHAT_CONVERSATION':
      return { ...state, chatHistory: [action.payload, ...state.chatHistory] };
    case 'SYNC_STATE':
      return { ...state, ...action.payload };

    // ── Supabase sync ────────────────────────────────────────────────────────
    case 'SET_ORDERS':
      return { ...state, orders: action.payload };
    case 'SET_MEALS':
      return { ...state, adminMeals: action.payload };
    case 'SET_PLANS':
      return { ...state, adminPlans: action.payload };

    // ── Agent cases ──────────────────────────────────────────────────────────
    case 'OPEN_AGENT':
      return {
        ...state,
        agentSession: {
          ...state.agentSession,
          isOpen: true,
          phase: state.agentSession.messages.length === 0 ? 'greeting' : state.agentSession.phase,
        },
      };
    case 'CLOSE_AGENT':
      return { ...state, agentSession: { ...state.agentSession, isOpen: false } };
    case 'ADD_AGENT_MESSAGE':
      return {
        ...state,
        agentSession: {
          ...state.agentSession,
          messages: [...state.agentSession.messages, action.payload],
        },
      };
    case 'UPDATE_AGENT_MESSAGE':
      return {
        ...state,
        agentSession: {
          ...state.agentSession,
          messages: state.agentSession.messages.map(m =>
            m.id === action.payload.id ? { ...m, ...action.payload.updates } : m
          ),
        },
      };
    case 'SET_AGENT_PHASE':
      return { ...state, agentSession: { ...state.agentSession, phase: action.payload } };
    case 'SET_AGENT_GOALS':
      return { ...state, agentSession: { ...state.agentSession, discoveredGoals: action.payload } };
    case 'SET_AGENT_SUGGESTED_PLAN':
      return { ...state, agentSession: { ...state.agentSession, suggestedPlanId: action.payload } };
    case 'RESET_AGENT':
      return {
        ...state,
        agentSession: { ...initialAgentSession, isOpen: state.agentSession.isOpen },
      };

    // ── Reschedule cases ─────────────────────────────────────────────────────
    case 'ADD_RESCHEDULE_REQUEST':
      return { ...state, rescheduleRequests: [...state.rescheduleRequests, action.payload] };
    case 'UPDATE_RESCHEDULE_REQUEST':
      return {
        ...state,
        rescheduleRequests: state.rescheduleRequests.map(r =>
          r.id === action.payload.id ? { ...r, status: action.payload.status } : r
        ),
      };

    default:
      return state;
  }
}

const AppContext = createContext<{ state: AppState; dispatch: React.Dispatch<Action> }>({ state: initialState, dispatch: () => {} });

export function AppProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, getInitialState());

  // ── On mount: load meals, plans, orders from Supabase ──────────────────────
  useEffect(() => {
    const loadFromSupabase = async () => {
      const [meals, plans, orders] = await Promise.all([
        db.getMeals(),
        db.getPlans(),
        db.getOrders(),
      ]);
      if (meals.length > 0) dispatch({ type: 'SET_MEALS', payload: meals });
      if (plans.length > 0) dispatch({ type: 'SET_PLANS', payload: plans });
      if (orders.length > 0) dispatch({ type: 'SET_ORDERS', payload: orders });
    };
    loadFromSupabase();
  }, []);

  // ── Save to localStorage whenever state changes ────────────────────────────
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }, [state]);

  // ── Sync state across tabs ─────────────────────────────────────────────────
  useEffect(() => {
    const handleStorage = (e: StorageEvent) => {
      if (e.key === STORAGE_KEY && e.newValue) {
        try {
          const newState = JSON.parse(e.newValue);
          dispatch({ type: 'SYNC_STATE', payload: newState });
        } catch (err) {
          console.error('Failed to sync state', err);
        }
      }
    };
    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }, []);

  return <AppContext.Provider value={{ state, dispatch }}>{children}</AppContext.Provider>;
}

export function useApp() { return useContext(AppContext); }
export function useCartTotal(cart: CartItem[]) {
  return cart.reduce((sum, item) => sum + (item.isCreditBased ? 0 : item.meal.price * item.quantity), 0);
}
export function useCartItemCount(cart: CartItem[]) {
  return cart.reduce((sum, item) => sum + item.quantity, 0);
}
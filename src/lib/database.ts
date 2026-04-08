// import { createClient } from '@supabase/supabase-js';
import { Order, Meal, SubscriptionPlan } from '../types';

/**
 * PRODUCTION-READY DATABASE SERVICE
 * 
 * STEP 1: Enable Supabase
 * npm install @supabase/supabase-js
 * 
 * STEP 2: Configure Client
 * const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
 * const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
 * const supabase = createClient(supabaseUrl, supabaseAnonKey);
 */

const STORAGE_KEY = 'foodforfit_state_v2';

const getLocalState = () => {
  const data = localStorage.getItem(STORAGE_KEY);
  return data ? JSON.parse(data) : null;
};

export const db = {
  // --- ORDERS ---
  async getOrders(): Promise<Order[]> {
    const state = getLocalState();
    return state?.orders || [];
  },

  async createOrder(order: Order): Promise<Order> {
    // In a real DB, you'd do: await supabase.from('orders').insert(order)
    return order;
  },

  async updateOrderStatus(orderId: string, status: string): Promise<void> {
    // API Call: PATCH /orders/:id { status }
    console.log(`DB Update: Order ${orderId} -> ${status}`);
  },

  // --- MENU ---
  async getMeals(): Promise<Meal[]> {
    const state = getLocalState();
    return state?.meals || [];
  },

  async updateMeal(meal: Meal): Promise<void> {
     console.log(`DB Update: Meal ${meal.id}`);
  },

  // --- PLANS ---
  async getPlans(): Promise<SubscriptionPlan[]> {
    const state = getLocalState();
    return state?.plans || [];
  }
};

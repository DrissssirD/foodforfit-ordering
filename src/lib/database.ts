import { createClient } from '@supabase/supabase-js';
import { Order, Meal, SubscriptionPlan } from '../types';

const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
);

// ─── ORDERS ───────────────────────────────────────────────────────────────────

export const db = {
  async getOrders(): Promise<Order[]> {
    const { data, error } = await supabase
      .from('orders')
      .select('*')
      .order('created_at', { ascending: false });
    if (error) { console.error('getOrders:', error); return []; }
    return (data || []).map(dbRowToOrder);
  },

  async createOrder(order: Order): Promise<Order> {
    const { error } = await supabase
      .from('orders')
      .insert(orderToDbRow(order));
    if (error) console.error('createOrder:', error);
    return order;
  },

  async updateOrderStatus(orderId: string, status: string): Promise<void> {
    const { error } = await supabase
      .from('orders')
      .update({ status })
      .eq('id', orderId);
    if (error) console.error('updateOrderStatus:', error);
  },

  // ─── MEALS ──────────────────────────────────────────────────────────────────

  async getMeals(): Promise<Meal[]> {
    const { data, error } = await supabase
      .from('meals')
      .select('*')
      .order('id');
    if (error) { console.error('getMeals:', error); return []; }
    return (data || []).map(dbRowToMeal);
  },

  async createMeal(meal: Meal): Promise<void> {
    const { error } = await supabase
      .from('meals')
      .insert(mealToDbRow(meal));
    if (error) console.error('createMeal:', error);
  },

  async updateMeal(meal: Meal): Promise<void> {
    const { error } = await supabase
      .from('meals')
      .update(mealToDbRow(meal))
      .eq('id', meal.id);
    if (error) console.error('updateMeal:', error);
  },

  async deleteMeal(mealId: string): Promise<void> {
    const { error } = await supabase
      .from('meals')
      .delete()
      .eq('id', mealId);
    if (error) console.error('deleteMeal:', error);
  },

  // ─── PLANS ──────────────────────────────────────────────────────────────────

  async getPlans(): Promise<SubscriptionPlan[]> {
    const { data, error } = await supabase
      .from('plans')
      .select('*')
      .order('meal_count');
    if (error) { console.error('getPlans:', error); return []; }
    return (data || []).map(dbRowToPlan);
  },

  async createPlan(plan: SubscriptionPlan): Promise<void> {
    const { error } = await supabase
      .from('plans')
      .insert(planToDbRow(plan));
    if (error) console.error('createPlan:', error);
  },

  async updatePlan(plan: SubscriptionPlan): Promise<void> {
    const { error } = await supabase
      .from('plans')
      .update(planToDbRow(plan))
      .eq('id', plan.id);
    if (error) console.error('updatePlan:', error);
  },

  async deletePlan(planId: string): Promise<void> {
    const { error } = await supabase
      .from('plans')
      .delete()
      .eq('id', planId);
    if (error) console.error('deletePlan:', error);
  },
};

// ─── MAPPERS (camelCase ↔ snake_case) ─────────────────────────────────────────

function orderToDbRow(o: Order) {
  return {
    id: o.id,
    order_number: o.orderNumber,
    customer_name: o.customerName,
    customer_phone: o.customerPhone,
    customer_email: o.customerEmail ?? null,
    items: o.items,
    deliveries: o.deliveries ?? [],
    total: o.total,
    delivery_type: o.deliveryType,
    address: o.address ?? null,
    district: o.district ?? null,
    delivery_date: o.deliveryDate,
    delivery_time: o.deliveryTime,
    payment_method: o.paymentMethod,
    status: o.status,
    created_at: o.createdAt,
    subscription_plan: o.subscriptionPlan ?? null,
    notes: o.notes ?? null,
  };
}

function dbRowToOrder(r: any): Order {
  return {
    id: r.id,
    orderNumber: r.order_number,
    customerName: r.customer_name,
    customerPhone: r.customer_phone,
    customerEmail: r.customer_email,
    items: r.items,
    deliveries: r.deliveries,
    total: r.total,
    deliveryType: r.delivery_type,
    address: r.address,
    district: r.district,
    deliveryDate: r.delivery_date,
    deliveryTime: r.delivery_time,
    paymentMethod: r.payment_method,
    status: r.status,
    createdAt: r.created_at,
    subscriptionPlan: r.subscription_plan,
    notes: r.notes,
  };
}

function mealToDbRow(m: Meal) {
  return {
    id: m.id,
    name: m.name,
    en_name: m.enName ?? null,
    ru_name: m.ruName ?? null,
    description: m.description,
    en_description: m.enDescription ?? null,
    ru_description: m.ruDescription ?? null,
    category: m.category,
    image_url: m.imageUrl,
    price: m.price,
    calories: m.calories,
    protein: m.protein,
    carbs: m.carbs,
    fat: m.fat,
    tags: m.tags,
    available: m.available,
    featured: m.featured,
  };
}

function dbRowToMeal(r: any): Meal {
  return {
    id: r.id,
    name: r.name,
    enName: r.en_name,
    ruName: r.ru_name,
    description: r.description,
    enDescription: r.en_description,
    ruDescription: r.ru_description,
    category: r.category,
    imageUrl: r.image_url,
    price: r.price,
    calories: r.calories,
    protein: r.protein,
    carbs: r.carbs,
    fat: r.fat,
    tags: r.tags,
    available: r.available,
    featured: r.featured,
  };
}

function planToDbRow(p: SubscriptionPlan) {
  return {
    id: p.id,
    name: p.name,
    en_name: p.enName ?? null,
    ru_name: p.ruName ?? null,
    meal_count: p.mealCount,
    price: p.price,
    price_per_meal: p.pricePerMeal,
    features: p.features,
    en_features: p.enFeatures ?? [],
    ru_features: p.ruFeatures ?? [],
    badge: p.badge ?? null,
    en_badge: p.enBadge ?? null,
    ru_badge: p.ruBadge ?? null,
    popular: p.popular ?? false,
    allowed_meal_ids: p.allowedMealIds ?? [],
  };
}

function dbRowToPlan(r: any): SubscriptionPlan {
  return {
    id: r.id,
    name: r.name,
    enName: r.en_name,
    ruName: r.ru_name,
    mealCount: r.meal_count,
    price: r.price,
    pricePerMeal: r.price_per_meal,
    features: r.features,
    enFeatures: r.en_features,
    ruFeatures: r.ru_features,
    badge: r.badge,
    enBadge: r.en_badge,
    ruBadge: r.ru_badge,
    popular: r.popular,
    allowedMealIds: r.allowed_meal_ids,
  };
}
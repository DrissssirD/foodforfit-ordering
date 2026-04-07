export interface Meal {
  id: string;
  name: string;
  description: string;
  category: 'kahvalti' | 'ana' | 'kase' | 'smoothie';
  imageUrl: string;
  price: number;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  tags: string[];
  available: boolean;
  featured: boolean;
}

export interface SubscriptionPlan {
  id: string;
  name: string;
  mealCount: number;
  price: number;
  pricePerMeal: number;
  features: string[];
  badge?: string;
  popular?: boolean;
}

export interface CartItem {
  meal: Meal;
  quantity: number;
  isCreditBased: boolean;
}

export interface Order {
  id: string;
  orderNumber: string;
  customerName: string;
  customerPhone: string;
  customerEmail: string;
  items: CartItem[];
  total: number;
  deliveryType: 'teslimat' | 'gelal';
  address?: string;
  district?: string;
  deliveryDate: string;
  deliveryTime: string;
  paymentMethod: 'cod' | 'card';
  status: 'pending' | 'preparing' | 'ready' | 'delivered' | 'cancelled';
  createdAt: string;
  subscriptionPlan?: SubscriptionPlan | null;
}

export interface CartState {
  items: CartItem[];
  orderMode: 'alacarte' | 'subscription';
  subscriptionPlan: SubscriptionPlan | null;
  creditsRemaining: number;
}

export type Page = 'home' | 'menu' | 'packages' | 'about' | 'success' | 'admin';

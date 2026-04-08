export interface Meal {
  id: string;
  name: string;
  description: string;
  category: 'kahvalti' | 'ana' | 'kase' | 'smoothie' | 'tatli';
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
  allowedMealIds?: string[]; // if non-empty, only these meals are available in the package
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
  notes?: string;
}

export interface CartState {
  items: CartItem[];
  orderMode: 'alacarte' | 'subscription';
  subscriptionPlan: SubscriptionPlan | null;
  creditsRemaining: number;
}

export type Page = 'home' | 'menu' | 'packages' | 'about' | 'success' | 'admin' | 'track';

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

export interface ChatConversation {
  id: string;
  startedAt: string;
  messages: ChatMessage[];
  lang: string;
}

export interface Meal {
  id: string;
  name: string;
  enName?: string;
  ruName?: string;
  description: string;
  enDescription?: string;
  ruDescription?: string;
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
  enName?: string;
  ruName?: string;
  mealCount: number;
  price: number;
  pricePerMeal: number;
  features: string[];
  enFeatures?: string[];
  ruFeatures?: string[];
  badge?: string;
  enBadge?: string;
  ruBadge?: string;
  popular?: boolean;
  allowedMealIds?: string[]; // if non-empty, only these meals are available in the package
}

export interface CartItem {
  meal: Meal;
  quantity: number;
  isCreditBased: boolean;
}

export interface DeliveryItem {
  meal: Meal;
  quantity: number;
}

// Typed time slot for per-meal scheduling
export type TimeSlot = 'morning' | 'lunch' | 'evening';

// Backward-compatible superset: legacy day-grouped fields (date, items) are retained as optional
// alongside the new per-meal fields (orderId, mealId, day, customerName, etc.).
// CheckoutModal and OrderTrackingPage continue to work unchanged.
// New per-meal delivery code uses the new fields.
export interface ScheduledDelivery {
  id: string;

  // ── Legacy fields (day-grouped delivery model) ──────────────────────────
  date?: string;          // YYYY-MM-DD format
  items?: DeliveryItem[]; // grouped items for the day

  // ── New per-meal delivery fields ─────────────────────────────────────────
  orderId?: string;
  mealId?: string;
  mealName?: string;
  day?: string;                   // YYYY-MM-DD (new model, mirrors date)
  timeSlot?: TimeSlot | string;   // typed slot or legacy "08:00 - 10:00" string
  status: 'pending' | 'preparing' | 'ready' | 'delivered' | 'cancelled'
        | 'scheduled' | 'out_for_delivery';
  customerName?: string;
  customerPhone?: string;
  customerAddress?: string;
  notes?: string;
}

export interface Order {
  id: string;
  orderNumber: string;
  customerName: string;
  customerPhone: string;
  customerEmail: string;
  items: CartItem[]; // used for alacarte or simple representation
  deliveries?: ScheduledDelivery[]; // used for scheduled / subscription orders
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

// ── Reschedule request — customer asks to move a meal to a different slot ──
export interface RescheduleRequest {
  id: string;
  orderId: string;
  deliveryId: string;
  mealName: string;
  customerName: string;
  customerPhone: string;
  originalDay: string;
  originalTimeSlot: TimeSlot;
  requestedDay: string;
  requestedTimeSlot: TimeSlot;
  reason: string;
  status: 'pending' | 'approved' | 'rejected';
  createdAt: string;
}

// ── AI Agent message — richer than ChatMessage, carries meal card refs ─────
export interface AgentMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  mealCards?: string[];       // meal IDs to render inline in chat
  suggestedPlanId?: string;   // subscription plan to highlight
  timestamp: number;
  loading?: boolean;
}

// ── AI Agent session — tracks the full conversational ordering flow ─────────
export interface AgentSession {
  isOpen: boolean;
  messages: AgentMessage[];
  phase: 'greeting' | 'discovery' | 'recommendation' | 'meal_selection' | 'ready_to_checkout';
  discoveredGoals: string[];
  suggestedPlanId: string | null;
}

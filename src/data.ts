import type { Meal, SubscriptionPlan } from './types';

export const meals: Meal[] = [
  {
    id: '1',
    name: 'Izgara Tavuk & Kinoa',
    description: 'Izgara tavuk göğsü, kinoa pilavı, buharda brokoli ve avokado sosu ile servis edilir.',
    category: 'ana',
    imageUrl: '',
    price: 550,
    calories: 520,
    protein: 42,
    carbs: 38,
    fat: 18,
    tags: ['yuksek-protein', 'gluten-free'],
    available: true,
    featured: true,
  },
  {
    id: '2',
    name: 'Somon Protein Kasesi',
    description: 'Fırında somon, esmer pirinç, edamame, avokado ve teriyaki sos.',
    category: 'kase',
    imageUrl: '',
    price: 620,
    calories: 580,
    protein: 45,
    carbs: 42,
    fat: 22,
    tags: ['yuksek-protein'],
    available: true,
    featured: true,
  },
  {
    id: '3',
    name: 'Vejetaryen Buddha Kasesi',
    description: 'Nohut, tatlı patates, avokado, ıspanak ve tahin sosu.',
    category: 'kase',
    imageUrl: '',
    price: 480,
    calories: 450,
    protein: 18,
    carbs: 52,
    fat: 16,
    tags: ['vejetaryen', 'vegan'],
    available: true,
    featured: true,
  },
  {
    id: '4',
    name: 'Protein Kahvaltı Tabağı',
    description: 'Yulaf ezmesi, Yunan yoğurdu, granola, taze meyveler ve bal.',
    category: 'kahvalti',
    imageUrl: '',
    price: 380,
    calories: 420,
    protein: 28,
    carbs: 48,
    fat: 12,
    tags: ['vejetaryen'],
    available: true,
    featured: true,
  },
  {
    id: '5',
    name: 'Yeşil Detox Smoothie',
    description: 'Ispanak, muz, avokado, chia tohumu ve badem sütü.',
    category: 'smoothie',
    imageUrl: '',
    price: 180,
    calories: 220,
    protein: 8,
    carbs: 28,
    fat: 10,
    tags: ['vegan', 'gluten-free'],
    available: true,
    featured: true,
  },
  {
    id: '6',
    name: 'Biftek & Tatlı Patates',
    description: 'Izgara dana biftek, fırında tatlı patates ve kuşkonmaz.',
    category: 'ana',
    imageUrl: '',
    price: 720,
    calories: 650,
    protein: 52,
    carbs: 35,
    fat: 28,
    tags: ['yuksek-protein', 'gluten-free'],
    available: true,
    featured: true,
  },
  {
    id: '7',
    name: 'Avokadolu Tost',
    description: 'Ekşi mayalı ekmek üzerinde avokado, poşe yumurta ve çeri domates.',
    category: 'kahvalti',
    imageUrl: '',
    price: 340,
    calories: 380,
    protein: 18,
    carbs: 32,
    fat: 20,
    tags: ['vejetaryen'],
    available: true,
    featured: true,
  },
  {
    id: '8',
    name: 'Tavuklu Sezar Salatası',
    description: 'Izgara tavuk, romaine marul, parmesan, kruton ve sezar sos.',
    category: 'kase',
    imageUrl: '',
    price: 450,
    calories: 420,
    protein: 35,
    carbs: 22,
    fat: 20,
    tags: ['yuksek-protein'],
    available: true,
    featured: false,
  },
  {
    id: '9',
    name: 'Mango Protein Smoothie',
    description: 'Mango, whey protein, Yunan yoğurdu ve hindistancevizi suyu.',
    category: 'smoothie',
    imageUrl: '',
    price: 200,
    calories: 280,
    protein: 24,
    carbs: 32,
    fat: 6,
    tags: ['vejetaryen', 'gluten-free'],
    available: true,
    featured: true,
  },
  {
    id: '10',
    name: 'Falafel Wrap',
    description: 'Ev yapımı falafel, humus, turşu sebzeler ve tahin sosu.',
    category: 'ana',
    imageUrl: '',
    price: 420,
    calories: 480,
    protein: 16,
    carbs: 52,
    fat: 22,
    tags: ['vegan'],
    available: true,
    featured: false,
  },
  {
    id: '11',
    name: 'Yüksek Proteinli Omlet',
    description: 'Yumurta beyazı omleti, ıspanak, mantar, domates ve lor peyniri.',
    category: 'kahvalti',
    imageUrl: '',
    price: 320,
    calories: 350,
    protein: 32,
    carbs: 12,
    fat: 18,
    tags: ['yuksek-protein', 'gluten-free', 'dusuk-yag'],
    available: true,
    featured: false,
  },
  {
    id: '12',
    name: 'Ton Balıklı Poke',
    description: 'Taze ton balığı, suşi pirinci, edamame, avokado ve soya sosu.',
    category: 'kase',
    imageUrl: '',
    price: 580,
    calories: 490,
    protein: 38,
    carbs: 45,
    fat: 14,
    tags: ['yuksek-protein'],
    available: true,
    featured: true,
  },
];

export const subscriptionPlans: SubscriptionPlan[] = [
  {
    id: 'plan-14',
    name: '14 Öğün Paketi',
    mealCount: 14,
    price: 6500,
    pricePerMeal: 464,
    features: ['Ücretsiz Teslimat', 'Makro Takibi', 'Esnek Menü', 'Haftalık Değişen Menü'],
    badge: 'En Popüler',
    popular: true,
    allowedMealIds: [],
  },
  {
    id: 'plan-21',
    name: '21 Öğün Paketi',
    mealCount: 21,
    price: 9450,
    pricePerMeal: 450,
    features: ['Ücretsiz Teslimat', 'Makro Takibi', 'Esnek Menü', 'Haftalık Değişen Menü', 'Diyetisyen Desteği'],
    badge: 'En Uygun',
    popular: false,
    allowedMealIds: [],
  },
  {
    id: 'plan-28',
    name: '28 Öğün Paketi',
    mealCount: 28,
    price: 12000,
    pricePerMeal: 429,
    features: ['Ücretsiz Teslimat', 'Makro Takibi', 'Esnek Menü', 'Haftalık Değişen Menü', 'Diyetisyen Desteği', 'Öncelikli Teslimat'],
    popular: false,
    allowedMealIds: [],
  },
];

export const categories = [
  { key: 'all', label: 'Tüm Menü', emoji: '🍴' },
  { key: 'kahvalti', label: 'Kahvaltılar', emoji: '🍳' },
  { key: 'ana', label: 'Ana Öğünler', emoji: '🍽️' },
  { key: 'kase', label: 'Kaseler', emoji: '🥗' },
  { key: 'smoothie', label: "Smoothie'ler", emoji: '🥤' },
];

export const tagOptions = [
  { key: 'vejetaryen', label: 'Vejetaryen' },
  { key: 'vegan', label: 'Vegan' },
  { key: 'yuksek-protein', label: 'Yüksek Protein' },
  { key: 'dusuk-yag', label: 'Düşük Yağ' },
  { key: 'gluten-free', label: 'Gluten-Free' },
];

// Generate meal gradient backgrounds based on category
export function getMealGradient(meal: Meal): string {
  switch (meal.category) {
    case 'kahvalti':
      return 'linear-gradient(135deg, #FDE68A 0%, #F59E0B 100%)';
    case 'ana':
      return 'linear-gradient(135deg, #6EE7B7 0%, #10B981 100%)';
    case 'kase':
      return 'linear-gradient(135deg, #93C5FD 0%, #3B82F6 100%)';
    case 'smoothie':
      return 'linear-gradient(135deg, #C4B5FD 0%, #8B5CF6 100%)';
    default:
      return 'linear-gradient(135deg, #E5E7EB 0%, #9CA3AF 100%)';
  }
}

export function getMealEmoji(meal: Meal): string {
  switch (meal.category) {
    case 'kahvalti': return '🍳';
    case 'ana': return '🍖';
    case 'kase': return '🥗';
    case 'smoothie': return '🥤';
    default: return '🍽️';
  }
}

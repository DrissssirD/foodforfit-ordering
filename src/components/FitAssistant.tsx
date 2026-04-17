import { useState, useRef, useEffect } from 'react';
import { X, Send, Sparkles, Check, Plus, ChevronDown, ChevronUp } from 'lucide-react';
import { useApp } from '../store';
import { useT } from '../i18n';
import type { SubscriptionPlan, Meal, Order, ScheduledDelivery, DeliveryItem } from '../types';
import { getMealEmoji, getMealGradient, categories as mealCategories } from '../data';

const GREEN = '#1E3F30';
const GOLD = '#C8A97A';
const BG = '#FDF6F2';

type Phase = 'A' | 'B' | 'C' | 'D' | 'E' | 'F' | 'G';

interface AgentMsg {
  id: string;
  role: 'agent' | 'user';
  text: string;
  widget?: Phase;
  loading?: boolean;
}

interface ScheduleSlot {
  key: string;
  meal: Meal;
  dayDate: string;
  timeSlot: string;
}

interface FormState {
  name: string;
  phone: string;
  email: string;
  deliveryType: 'teslimat' | 'gelal';
  address: string;
  district: string;
  postal: string;
  notes: string;
}

function getTimeSlots(lang: string) {
  if (lang === 'en') return [
    { key: 'morning', label: 'Morning 08-10', range: '08:00 - 10:00' },
    { key: 'noon',    label: 'Lunch 12-14',   range: '12:00 - 14:00' },
    { key: 'evening', label: 'Evening 18-20', range: '18:00 - 20:00' },
  ];
  if (lang === 'ru') return [
    { key: 'morning', label: 'Утро 08-10',  range: '08:00 - 10:00' },
    { key: 'noon',    label: 'Обед 12-14',  range: '12:00 - 14:00' },
    { key: 'evening', label: 'Вечер 18-20', range: '18:00 - 20:00' },
  ];
  return [
    { key: 'morning', label: 'Sabah 08-10', range: '08:00 - 10:00' },
    { key: 'noon',    label: 'Öğle 12-14',  range: '12:00 - 14:00' },
    { key: 'evening', label: 'Akşam 18-20', range: '18:00 - 20:00' },
  ];
}

function getNext7Days(lang: string): { label: string; date: string }[] {
  const days: { label: string; date: string }[] = [];
  const locale = lang === 'ru' ? 'ru-RU' : lang === 'en' ? 'en-US' : 'tr-TR';
  for (let i = 1; i <= 7; i++) {
    const d = new Date();
    d.setDate(d.getDate() + i);
    days.push({
      label: d.toLocaleDateString(locale, { weekday: 'short', day: 'numeric', month: 'short' }),
      date: d.toISOString().split('T')[0],
    });
  }
  return days;
}

function uid(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

export async function callClaude(
  messages: { role: 'user' | 'assistant'; content: string }[],
  _lang: string,
  _menuContext: string,
  systemPrompt: string,
): Promise<string> {
  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': import.meta.env.VITE_ANTHROPIC_API_KEY ?? '',
      'anthropic-version': '2023-06-01',
      'anthropic-dangerous-direct-browser-calls': 'true',
    },
    body: JSON.stringify({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 400,
      system: systemPrompt,
      messages,
    }),
  });
  const data = await response.json();
  return data.content?.[0]?.text ?? '...';
}

async function callAgent(
  messages: { role: 'user' | 'assistant'; content: string }[],
  systemPrompt: string,
): Promise<string> {
  return callClaude(messages, '', '', systemPrompt);
}

function pickBestPlan(plans: SubscriptionPlan[], goal: string): SubscriptionPlan {
  if (plans.length === 0) {
    return { id: 'default', name: '14 Öğün Paketi', mealCount: 14, price: 6500, pricePerMeal: 464, features: [] };
  }
  const g = goal.toLowerCase();
  if (g.includes('kilo') || g.includes('weight') || g.includes('похуд')) {
    return [...plans].sort((a, b) => a.price - b.price)[0];
  }
  if (g.includes('kas') || g.includes('muscle') || g.includes('мышц')) {
    return [...plans].sort((a, b) => b.mealCount - a.mealCount)[0];
  }
  return plans[Math.floor(plans.length / 2)] ?? plans[0];
}

function fieldStyle(hasError: boolean): React.CSSProperties {
  return {
    width: '100%',
    padding: '10px 14px',
    borderRadius: '10px',
    border: `1.5px solid ${hasError ? '#C0392B' : '#E5DDD0'}`,
    background: '#FFFFFF',
    fontSize: '13px',
    outline: 'none',
    fontFamily: "'Montserrat', sans-serif",
    color: '#1A1A1A',
    boxSizing: 'border-box',
  };
}

export default function FitAssistant() {
  const { state, dispatch } = useApp();
  const t = useT(state.lang);
  const lang = state.lang;

  const [isOpen, setIsOpen] = useState(false);
  const [msgs, setMsgs] = useState<AgentMsg[]>([]);
  const [phase, setPhase] = useState<Phase>('A');
  const [activeWidgetMsgId, setActiveWidgetMsgId] = useState<string | null>(null);
  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);

  const [userGoal, setUserGoal] = useState('');
  const [suggestedPlan, setSuggestedPlan] = useState<SubscriptionPlan | null>(null);
  const [showOtherPlans, setShowOtherPlans] = useState(false);
  const [catFilter, setCatFilter] = useState('all');
  const [scheduleSlots, setScheduleSlots] = useState<ScheduleSlot[]>([]);
  const next7Days = getNext7Days(lang);
  const TIME_SLOTS = getTimeSlots(lang);

  const [form, setForm] = useState<FormState>({
    name: '', phone: '', email: '',
    deliveryType: 'teslimat',
    address: '', district: '', postal: '', notes: '',
  });
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  const historyRef = useRef<{ role: 'user' | 'assistant'; content: string }[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const initializedRef = useRef(false);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [msgs, isTyping]);

  useEffect(() => {
    if (isOpen && !initializedRef.current) {
      initializedRef.current = true;
      const greeting = getGreeting();
      const id = uid();
      setMsgs([{ id, role: 'agent', text: greeting, widget: 'A' }]);
      setActiveWidgetMsgId(id);
      historyRef.current = [{ role: 'assistant', content: greeting }];
    }
    if (!isOpen) {
      initializedRef.current = false;
    }
  }, [isOpen]); // eslint-disable-line react-hooks/exhaustive-deps

  function getGreeting(): string {
    if (lang === 'en') return "Hi! 👋 I'm FIT Assistant. I'll build you a personalized meal plan and you can complete your order right here. To start — what's your goal?";
    if (lang === 'ru') return "Привет! 👋 Я FIT Ассистент. Создам тебе персональный план питания, и ты сможешь оформить заказ прямо здесь. Для начала — какова твоя цель?";
    return "Merhaba! 👋 Ben FIT Asistan. Sana özel bir yemek planı oluşturacağım ve siparişini buradan tamamlayabilirsin. Başlamak için hedefini söyle — ne için yemek planı istiyorsun?";
  }

  function handleClose() {
    setIsOpen(false);
    setMsgs([]);
    setPhase('A');
    setActiveWidgetMsgId(null);
    setUserGoal('');
    setSuggestedPlan(null);
    setShowOtherPlans(false);
    setCatFilter('all');
    setScheduleSlots([]);
    setForm({ name: '', phone: '', email: '', deliveryType: 'teslimat', address: '', district: '', postal: '', notes: '' });
    setFormErrors({});
    setIsTyping(false);
    historyRef.current = [];
  }

  function addAgentMsg(text: string, widget?: Phase) {
    const id = uid();
    setMsgs(prev => [...prev, { id, role: 'agent', text, widget }]);
    if (widget) setActiveWidgetMsgId(id);
    historyRef.current.push({ role: 'assistant', content: text });
  }

  function addUserMsg(text: string) {
    setMsgs(prev => [...prev, { id: uid(), role: 'user', text }]);
    historyRef.current.push({ role: 'user', content: text });
  }

  async function agentRespond(text: string, widget?: Phase, delay = 800) {
    setIsTyping(true);
    await new Promise(r => setTimeout(r, delay));
    setIsTyping(false);
    addAgentMsg(text, widget);
  }

  // ── PHASE HANDLERS ──────────────────────────────────────────────────────────

  async function handleGoalSelected(goal: string) {
    setUserGoal(goal);
    addUserMsg(goal);
    setPhase('B');

    const apiKey = import.meta.env.VITE_ANTHROPIC_API_KEY;
    let reply: string;

    if (apiKey) {
      const system = `You are FIT Asistan for FoodForFit, a premium Turkish meal delivery service.
Phase: B — acknowledge the customer's goal and ask about dietary restrictions.
Customer goal: ${goal}
Language: ${lang === 'tr' ? 'Turkish' : lang === 'ru' ? 'Russian' : 'English'} — ALWAYS respond in this language only.
Rules: max 2 sentences. Be warm and enthusiastic. End with a question about food allergies or restrictions.`;
      try { reply = await callAgent(historyRef.current, system); }
      catch { reply = fallbackB(goal); }
    } else {
      reply = fallbackB(goal);
    }
    await agentRespond(reply, 'B');
  }

  function fallbackB(goal: string): string {
    const g = goal.toLowerCase();
    if (g.includes('kilo') || g.includes('weight') || g.includes('похуд')) {
      if (lang === 'en') return "Great! I'll prepare low-calorie, high-protein meals for weight loss. 💪 Any food allergies or things you don't eat?";
      if (lang === 'ru') return "Отлично! Подберу низкокалорийные блюда с высоким содержанием белка. 💪 Есть пищевые ограничения или аллергии?";
      return "Harika! Kilo verme için düşük kalorili, yüksek proteinli öğünler hazırlayacağım. 💪 Herhangi bir gıda alerjin veya yemediğin bir şey var mı?";
    }
    if (g.includes('kas') || g.includes('muscle') || g.includes('мышц')) {
      if (lang === 'en') return "Perfect! I'll build a high-protein package for muscle gain. 🥩 Any dietary restrictions?";
      if (lang === 'ru') return "Отлично! Составлю высокобелковый план для набора мышечной массы. 🥩 Есть ограничения в питании?";
      return "Mükemmel! Kas yapmak için yüksek proteinli paket oluşturacağım. 🥩 Herhangi bir kısıtlaman var mı?";
    }
    if (g.includes('sağlık') || g.includes('sağlıklı') || g.includes('healthy') || g.includes('здоров')) {
      if (lang === 'en') return "Great goal! We'll choose balanced, nutrient-rich meals. 🌿 Is there anything you don't eat?";
      if (lang === 'ru') return "Хорошая цель! Выберем сбалансированные, питательные блюда. 🌿 Что-то не едите?";
      return "Güzel hedef! Dengeli ve besin değeri yüksek öğünler seçeceğiz. 🌿 Yemediğin bir şey var mı?";
    }
    if (lang === 'en') return "Understood! I'll find the most suitable plan for you. ⚡ Any dietary restrictions?";
    if (lang === 'ru') return "Понял! Подберу наиболее подходящий план. ⚡ Есть пищевые ограничения?";
    return "Anlıyorum! Sana en uygun planı bulacağım. ⚡ Herhangi bir gıda kısıtlaman var mı?";
  }

  async function handleRestrictionSelected(restriction: string) {
    addUserMsg(restriction);
    setPhase('C');

    const plan = pickBestPlan(state.adminPlans, userGoal);
    setSuggestedPlan(plan);

    const planName = lang === 'en' ? (plan.enName ?? plan.name) : lang === 'ru' ? (plan.ruName ?? plan.name) : plan.name;
    const apiKey = import.meta.env.VITE_ANTHROPIC_API_KEY;
    let reply: string;

    if (apiKey) {
      const system = `You are FIT Asistan for FoodForFit.
Phase: C — recommend a specific meal plan to the customer.
Customer goal: ${userGoal} | Restriction: ${restriction}
Recommended plan: ${planName} (${plan.mealCount} meals/week, ₺${plan.price})
Language: ${lang === 'tr' ? 'Turkish' : lang === 'ru' ? 'Russian' : 'English'} — ALWAYS respond in this language only.
Rules: exactly 2 sentences. First sentence: recommend this plan by name. Second sentence: one specific reason it suits their goal. No markdown.`;
      try { reply = await callAgent(historyRef.current, system); }
      catch { reply = fallbackC(planName); }
    } else {
      reply = fallbackC(planName);
    }
    await agentRespond(reply, 'C');
  }

  function fallbackC(planName: string): string {
    if (lang === 'en') return `I recommend the ${planName} for you. It perfectly matches your goal and gives you full flexibility to choose your meals every week!`;
    if (lang === 'ru') return `Рекомендую тебе пакет ${planName}. Он идеально подходит для твоей цели и даёт полную свободу в выборе блюд каждую неделю!`;
    return `Sana ${planName} paketini öneriyorum. Hedefine mükemmel uyum sağlıyor ve her hafta öğünlerini özgürce seçmeni sağlıyor!`;
  }

  async function handlePlanSelected(plan: SubscriptionPlan) {
    dispatch({ type: 'SELECT_PLAN', payload: plan });
    setSuggestedPlan(plan);
    const planName = lang === 'en' ? (plan.enName ?? plan.name) : lang === 'ru' ? (plan.ruName ?? plan.name) : plan.name;
    addUserMsg(`✓ ${planName}`);
    setPhase('D');

    let reply: string;
    if (lang === 'en') reply = `${planName} selected! 🍽️ You have ${plan.mealCount} meal credits. Now let's pick your meals!`;
    else if (lang === 'ru') reply = `${planName} выбран! 🍽️ У тебя ${plan.mealCount} кредитов. Давай выберем блюда!`;
    else reply = `${planName} paketinde ${plan.mealCount} yemek hakkın var. 🍽️ Şimdi hangi yemekleri istediğini seçelim!`;
    await agentRespond(reply, 'D');
  }

  async function handleMealsConfirmed() {
    const count = state.cart.reduce((s, i) => s + i.quantity, 0);
    let userMsg: string;
    if (lang === 'en') userMsg = `Meals selected (${count} meals)`;
    else if (lang === 'ru') userMsg = `Блюда выбраны (${count} блюд)`;
    else userMsg = `Yemeklerimi seçtim (${count} yemek)`;
    addUserMsg(userMsg);
    setPhase('E');

    const slots: ScheduleSlot[] = [];
    for (const item of state.cart) {
      for (let i = 0; i < item.quantity; i++) {
        slots.push({ key: `${item.meal.id}-${i}`, meal: item.meal, dayDate: next7Days[0]?.date ?? '', timeSlot: 'morning' });
      }
    }
    setScheduleSlots(slots);

    let reply: string;
    if (lang === 'en') reply = "Great choice! 🗓️ Now let's schedule when each meal will be delivered.";
    else if (lang === 'ru') reply = "Отличный выбор! 🗓️ Теперь назначим дни и время доставки каждого блюда.";
    else reply = "Harika seçim! 🗓️ Şimdi her yemeğin hangi gün ve saatte geleceğini ayarlayalım.";
    await agentRespond(reply, 'E');
  }

  async function handleScheduleConfirmed() {
    addUserMsg(lang === 'en' ? 'Delivery schedule set' : lang === 'ru' ? 'Расписание доставки составлено' : 'Teslimat planımı oluşturdum');
    setPhase('F');

    let reply: string;
    if (lang === 'en') reply = "Perfect! 🚀 Last step — enter your delivery info and your order is ready.";
    else if (lang === 'ru') reply = "Отлично! 🚀 Последний шаг — введи данные доставки и заказ готов.";
    else reply = "Mükemmel! 🚀 Son olarak teslimat bilgilerini girelim ve siparişin hazır.";
    await agentRespond(reply, 'F');
  }

  function validateForm(): boolean {
    const errors: Record<string, string> = {};
    if (!form.name.trim()) errors.name = t('err_name');
    if (!form.phone.trim()) errors.phone = t('err_phone');
    if (!form.email.includes('@')) errors.email = t('err_email');
    if (form.deliveryType === 'teslimat') {
      if (!form.address.trim()) errors.address = t('err_address');
      if (!form.district.trim()) errors.district = t('err_district');
    }
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  }

  function buildScheduledDeliveries(): ScheduledDelivery[] {
    const grouped = new Map<string, ScheduleSlot[]>();
    for (const slot of scheduleSlots) {
      const key = `${slot.dayDate}|${slot.timeSlot}`;
      if (!grouped.has(key)) grouped.set(key, []);
      grouped.get(key)!.push(slot);
    }
    const deliveries: ScheduledDelivery[] = [];
    for (const [key, slots] of grouped) {
      const [date, tsKey] = key.split('|');
      const ts = TIME_SLOTS.find(ts => ts.key === tsKey);
      const itemsMap = new Map<string, DeliveryItem>();
      for (const s of slots) {
        if (itemsMap.has(s.meal.id)) {
          itemsMap.get(s.meal.id)!.quantity++;
        } else {
          itemsMap.set(s.meal.id, { meal: s.meal, quantity: 1 });
        }
      }
      deliveries.push({
        id: `del-${Date.now()}-${deliveries.length}`,
        date: date ?? '',
        timeSlot: ts?.range ?? '08:00 - 10:00',
        status: 'pending',
        items: Array.from(itemsMap.values()),
      });
    }
    return deliveries.sort((a, b) => (a.date ?? '').localeCompare(b.date ?? ''));
  }

  async function handleFormSubmit() {
    if (!validateForm()) return;

    const orderNumber = `FFF-${1000 + Math.floor(Math.random() * 9000)}`;
    const deliveries = buildScheduledDeliveries();
    const firstDelivery = deliveries[0];

    const order: Order = {
      id: `order-${Date.now()}`,
      orderNumber,
      customerName: form.name,
      customerPhone: form.phone,
      customerEmail: form.email,
      items: state.cart,
      deliveries,
      total: suggestedPlan?.price ?? 0,
      deliveryType: form.deliveryType,
      address: form.address,
      district: form.district,
      deliveryDate: firstDelivery?.date ?? new Date().toISOString().split('T')[0],
      deliveryTime: firstDelivery?.timeSlot ?? '08:00 - 10:00',
      paymentMethod: 'cod',
      status: 'pending',
      createdAt: new Date().toISOString(),
      subscriptionPlan: suggestedPlan,
      notes: form.notes,
    };

    dispatch({ type: 'COMPLETE_ORDER', payload: order });
    setPhase('G');

    let confirmText: string;
    if (lang === 'en') confirmText = `Order received! 🎉 Order number: ${orderNumber}. Your meals will arrive according to your delivery schedule. Bon appétit! 🍽️`;
    else if (lang === 'ru') confirmText = `Заказ принят! 🎉 Номер заказа: ${orderNumber}. Блюда доставят согласно расписанию. Приятного аппетита! 🍽️`;
    else confirmText = `Siparişin alındı! 🎉 Sipariş numarası: ${orderNumber}. Teslimat planına göre yemeklerin gelecek. Afiyet olsun! 🍽️`;

    addUserMsg(lang === 'en' ? 'Order placed!' : lang === 'ru' ? 'Заказ оформлен!' : 'Siparişi tamamladım!');
    setIsTyping(true);
    await new Promise(r => setTimeout(r, 800));
    setIsTyping(false);
    addAgentMsg(confirmText);

    setTimeout(() => { handleClose(); }, 2000);
  }

  async function handleFreeText() {
    const text = inputText.trim();
    if (!text || isTyping) return;
    setInputText('');
    addUserMsg(text);

    const apiKey = import.meta.env.VITE_ANTHROPIC_API_KEY;
    if (apiKey) {
      setIsTyping(true);
      const system = `You are FIT Asistan for FoodForFit. Current ordering phase: ${phase}. Customer goal: "${userGoal}". Language: ${lang === 'tr' ? 'Turkish' : lang === 'ru' ? 'Russian' : 'English'} — respond only in this language. Rules: max 2 sentences, respond naturally and guide the customer back to the current step of the ordering process.`;
      try {
        const reply = await callAgent(historyRef.current, system);
        setIsTyping(false);
        addAgentMsg(reply, phase);
      } catch {
        setIsTyping(false);
        const fallback = lang === 'en' ? "I understand! Let me help you continue." : lang === 'ru' ? "Понял! Продолжим." : "Anlıyorum! Sana yardımcı olmaya devam edeyim.";
        addAgentMsg(fallback, phase);
      }
    } else {
      setIsTyping(true);
      await new Promise(r => setTimeout(r, 600));
      setIsTyping(false);
      const fallback = lang === 'en' ? "I understand! Let me help you continue." : lang === 'ru' ? "Понял! Продолжим." : "Anlıyorum! Sana yardımcı olmaya devam edeyim.";
      addAgentMsg(fallback, phase);
    }
  }

  // ── WIDGET RENDERERS ─────────────────────────────────────────────────────────

  const goalChips = [
    { emoji: '🏃', label: lang === 'en' ? 'Lose Weight' : lang === 'ru' ? 'Похудеть' : 'Kilo Vermek', sub: lang === 'en' ? 'Fat loss focused' : lang === 'ru' ? 'Сжигание жира' : 'Yağ yakımı odaklı' },
    { emoji: '💪', label: lang === 'en' ? 'Build Muscle' : lang === 'ru' ? 'Набрать мышцы' : 'Kas Yapmak', sub: lang === 'en' ? 'High protein' : lang === 'ru' ? 'Высокий белок' : 'Yüksek protein' },
    { emoji: '🥗', label: lang === 'en' ? 'Eat Healthy' : lang === 'ru' ? 'Здоровое питание' : 'Sağlıklı Beslenmek', sub: lang === 'en' ? 'Balanced meals' : lang === 'ru' ? 'Сбалансированно' : 'Dengeli beslenme' },
    { emoji: '⚡', label: lang === 'en' ? 'Quick Solution' : lang === 'ru' ? 'Быстрое решение' : 'Pratik Çözüm', sub: lang === 'en' ? 'Ready to eat' : lang === 'ru' ? 'Готовая еда' : 'Hazır yemek' },
  ];

  function renderGoalWidget(active: boolean) {
    return (
      <div className={`mt-3 grid grid-cols-2 gap-2 ${!active ? 'opacity-50 pointer-events-none' : ''}`}>
        {goalChips.map(chip => (
          <button
            key={chip.label}
            onClick={() => active && handleGoalSelected(chip.label)}
            className="flex flex-col items-start p-3 rounded-xl text-left cursor-pointer transition-transform hover:scale-[1.02] active:scale-[0.98]"
            style={{ background: '#FFFFFF', border: `1.5px solid ${GREEN}` }}
          >
            <span style={{ fontSize: '1.25rem' }}>{chip.emoji}</span>
            <span style={{ fontFamily: "'Montserrat', sans-serif", fontWeight: 700, fontSize: '0.78rem', color: GREEN, marginTop: 4 }}>{chip.label}</span>
            <span style={{ fontFamily: "'Montserrat', sans-serif", fontSize: '0.68rem', color: '#8A8A8A', marginTop: 2 }}>{chip.sub}</span>
          </button>
        ))}
      </div>
    );
  }

  const restrictionChips = [
    lang === 'en' ? 'No restrictions' : lang === 'ru' ? 'Без ограничений' : 'Yok, her şeyi yerim',
    lang === 'en' ? 'Vegetarian' : lang === 'ru' ? 'Вегетарианец' : 'Vejetaryen',
    'Gluten-free',
    'Lactose-free',
  ];

  function renderRestrictionWidget(active: boolean) {
    return (
      <div className={`mt-3 flex flex-wrap gap-2 ${!active ? 'opacity-50 pointer-events-none' : ''}`}>
        {restrictionChips.map(chip => (
          <button
            key={chip}
            onClick={() => active && handleRestrictionSelected(chip)}
            className="px-3 py-2 rounded-xl cursor-pointer transition-opacity hover:opacity-80"
            style={{ background: '#F0F5F0', border: `1px solid ${GREEN}66`, color: GREEN, fontFamily: "'Montserrat', sans-serif", fontWeight: 600, fontSize: '0.78rem' }}
          >
            {chip}
          </button>
        ))}
      </div>
    );
  }

  function renderOnePlanCard(plan: SubscriptionPlan, recommended: boolean, active: boolean) {
    const planName = lang === 'en' ? (plan.enName ?? plan.name) : lang === 'ru' ? (plan.ruName ?? plan.name) : plan.name;
    const features = (lang === 'en' ? (plan.enFeatures ?? plan.features) : lang === 'ru' ? (plan.ruFeatures ?? plan.features) : plan.features) ?? [];
    const badge = lang === 'en' ? (plan.enBadge ?? plan.badge) : lang === 'ru' ? (plan.ruBadge ?? plan.badge) : plan.badge;
    return (
      <div key={plan.id} className="rounded-2xl p-4 mb-3" style={{ background: recommended ? '#F0F5F0' : '#FAFAFA', border: `1.5px solid ${recommended ? GREEN : '#E5DDD0'}` }}>
        {recommended && (
          <div className="inline-block px-2 py-0.5 rounded-full text-xs font-bold mb-2" style={{ background: GOLD, color: '#fff', fontFamily: "'Montserrat', sans-serif" }}>
            ⭐ {lang === 'en' ? 'Recommended' : lang === 'ru' ? 'Рекомендуем' : 'Önerilen'}
          </div>
        )}
        {badge && !recommended && (
          <div className="inline-block px-2 py-0.5 rounded-full text-xs mb-2" style={{ background: '#E5DDD0', color: '#555', fontFamily: "'Montserrat', sans-serif" }}>{badge}</div>
        )}
        <div style={{ fontFamily: "'Montserrat', sans-serif", fontWeight: 800, fontSize: '1rem', color: GREEN }}>{planName}</div>
        <div style={{ fontFamily: "'Montserrat', sans-serif", fontWeight: 700, fontSize: '1.3rem', color: GOLD, marginTop: 2 }}>
          ₺{plan.price.toLocaleString()}
          <span style={{ fontSize: '0.7rem', color: '#8A8A8A' }}> / {lang === 'en' ? 'week' : lang === 'ru' ? 'нед.' : 'hafta'}</span>
        </div>
        <div style={{ fontSize: '0.73rem', color: '#8A8A8A', fontFamily: "'Montserrat', sans-serif", marginTop: 2 }}>
          {plan.mealCount} {lang === 'en' ? 'meals' : lang === 'ru' ? 'блюд' : 'öğün'} · ₺{plan.pricePerMeal}/{lang === 'en' ? 'meal' : lang === 'ru' ? 'блюдо' : 'öğün'}
        </div>
        <div className="mt-3 space-y-1.5">
          {features.slice(0, 4).map((f, i) => (
            <div key={i} className="flex items-center gap-1.5" style={{ fontSize: '0.75rem', fontFamily: "'Montserrat', sans-serif", color: '#333' }}>
              <Check size={11} style={{ color: GREEN, flexShrink: 0 }} />
              {f}
            </div>
          ))}
        </div>
        {active && (
          <button
            onClick={() => handlePlanSelected(plan)}
            className="mt-4 w-full py-2.5 rounded-xl font-bold cursor-pointer transition-opacity hover:opacity-90"
            style={{ background: GREEN, color: '#fff', fontFamily: "'Montserrat', sans-serif", fontSize: '0.85rem', border: 'none' }}
          >
            {recommended
              ? (lang === 'en' ? 'Select This Package →' : lang === 'ru' ? 'Выбрать этот пакет →' : 'Bu Paketi Seç →')
              : (lang === 'en' ? 'Select →' : lang === 'ru' ? 'Выбрать →' : 'Seç →')}
          </button>
        )}
      </div>
    );
  }

  function renderPlanWidget(active: boolean) {
    if (!suggestedPlan) return null;
    const otherPlans = state.adminPlans.filter(p => p.id !== suggestedPlan.id);
    return (
      <div className={`mt-3 ${!active ? 'opacity-60 pointer-events-none' : ''}`}>
        {renderOnePlanCard(suggestedPlan, true, active)}
        {otherPlans.length > 0 && (
          <>
            <button
              onClick={() => setShowOtherPlans(v => !v)}
              className="flex items-center gap-1 mb-2 cursor-pointer"
              style={{ color: '#8A8A8A', fontFamily: "'Montserrat', sans-serif", fontSize: '0.75rem', background: 'none', border: 'none', padding: 0 }}
            >
              {showOtherPlans
                ? (lang === 'en' ? 'Hide other packages' : lang === 'ru' ? 'Скрыть другие' : 'Diğer paketleri gizle')
                : (lang === 'en' ? 'See other packages' : lang === 'ru' ? 'Другие пакеты' : 'Diğer paketleri gör')}
              {showOtherPlans ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
            </button>
            {showOtherPlans && otherPlans.map(p => renderOnePlanCard(p, false, active))}
          </>
        )}
      </div>
    );
  }

  function renderMealWidget(active: boolean) {
    const plan = suggestedPlan;
    if (!plan) return null;

    const totalCredits = plan.mealCount;
    const usedCredits = totalCredits - state.creditsRemaining;
    const creditsFull = state.creditsRemaining <= 0;

    const available = state.adminMeals.filter(m => {
      if (!m.available) return false;
      if (plan.allowedMealIds && plan.allowedMealIds.length > 0) return plan.allowedMealIds.includes(m.id);
      return true;
    });
    const filtered = catFilter === 'all' ? available : available.filter(m => m.category === catFilter);

    const cats = [
      { key: 'all', label: lang === 'en' ? 'All' : lang === 'ru' ? 'Все' : 'Tümü', emoji: '🍽️' },
      ...mealCategories.filter(c => c.key !== 'all').map(c => ({
        key: c.key,
        label: lang === 'en' ? c.enLabel : lang === 'ru' ? c.ruLabel : c.label,
        emoji: c.emoji,
      })),
    ];

    const totalSelected = state.cart.reduce((s, i) => s + i.quantity, 0);

    return (
      <div className={`mt-3 ${!active ? 'opacity-60 pointer-events-none' : ''}`}>
        {/* Credit counter */}
        <div className="flex items-center justify-between mb-1">
          <span style={{ fontFamily: "'Montserrat', sans-serif", fontSize: '0.75rem', fontWeight: 600, color: '#333' }}>
            {usedCredits} / {totalCredits} {lang === 'en' ? 'selected' : lang === 'ru' ? 'выбрано' : 'seçildi'}
          </span>
          <span style={{ fontSize: '0.7rem', color: '#8A8A8A', fontFamily: "'Montserrat', sans-serif" }}>
            {state.creditsRemaining} {lang === 'en' ? 'remaining' : lang === 'ru' ? 'осталось' : 'kaldı'}
          </span>
        </div>
        {/* Progress bar */}
        <div className="rounded-full overflow-hidden mb-3" style={{ height: 4, background: '#E5DDD0' }}>
          <div className="h-full rounded-full transition-all" style={{ width: `${Math.min((usedCredits / totalCredits) * 100, 100)}%`, background: GOLD }} />
        </div>

        {/* Category filter */}
        <div className="flex gap-1.5 overflow-x-auto pb-2 mb-3" style={{ scrollbarWidth: 'none' }}>
          {cats.map(c => (
            <button
              key={c.key}
              onClick={() => setCatFilter(c.key)}
              className="flex-shrink-0 px-2.5 py-1 rounded-full cursor-pointer transition-all"
              style={{
                background: catFilter === c.key ? GREEN : '#F0F0F0',
                color: catFilter === c.key ? '#fff' : '#555',
                fontFamily: "'Montserrat', sans-serif",
                fontSize: '0.68rem',
                fontWeight: catFilter === c.key ? 700 : 400,
                border: 'none',
              }}
            >
              {c.emoji} {c.label}
            </button>
          ))}
        </div>

        {/* Meal grid */}
        <div className="grid grid-cols-2 gap-2 max-h-64 overflow-y-auto pr-0.5" style={{ scrollbarWidth: 'thin' }}>
          {filtered.map(meal => {
            const cartItem = state.cart.find(i => i.meal.id === meal.id);
            const inCart = !!cartItem;
            const qty = cartItem?.quantity ?? 0;
            const dimmed = creditsFull && !inCart;
            const emoji = getMealEmoji(meal);
            const gradient = getMealGradient(meal);
            const mealName = lang === 'en' ? (meal.enName ?? meal.name) : lang === 'ru' ? (meal.ruName ?? meal.name) : meal.name;
            return (
              <div
                key={meal.id}
                className="rounded-xl overflow-hidden transition-all"
                style={{ border: inCart ? `2px solid ${GREEN}` : '1.5px solid #E5DDD0', background: '#FFFFFF', opacity: dimmed ? 0.4 : 1 }}
              >
                <div className="flex items-center justify-center" style={{ height: 40, background: gradient }}>
                  <span style={{ fontSize: '1.2rem' }}>{emoji}</span>
                </div>
                <div className="p-2">
                  <div style={{ fontFamily: "'Montserrat', sans-serif", fontWeight: 700, fontSize: '0.68rem', color: '#1A1A1A', lineHeight: 1.3, minHeight: 28 }}>
                    {mealName.length > 30 ? mealName.slice(0, 28) + '…' : mealName}
                  </div>
                  <div style={{ fontSize: '0.63rem', color: '#8A8A8A', fontFamily: "'Montserrat', sans-serif", marginTop: 2 }}>
                    {meal.calories} kcal
                  </div>
                  <div className="flex gap-0.5 mt-1 flex-wrap">
                    <span className="px-1 py-0.5 rounded" style={{ background: '#E8F5E9', color: '#2E7D32', fontSize: '0.58rem', fontFamily: "'Montserrat', sans-serif" }}>P:{meal.protein}g</span>
                    <span className="px-1 py-0.5 rounded" style={{ background: '#FFF3E0', color: '#E65100', fontSize: '0.58rem', fontFamily: "'Montserrat', sans-serif" }}>K:{meal.carbs}g</span>
                    <span className="px-1 py-0.5 rounded" style={{ background: '#F3E5F5', color: '#6A1B9A', fontSize: '0.58rem', fontFamily: "'Montserrat', sans-serif" }}>Y:{meal.fat}g</span>
                  </div>
                  <button
                    disabled={dimmed}
                    onClick={() => {
                      if (inCart) {
                        dispatch({ type: 'REMOVE_FROM_CART', payload: meal.id });
                      } else if (!creditsFull) {
                        dispatch({ type: 'ADD_TO_CART', payload: { meal, isCreditBased: true } });
                      }
                    }}
                    className="mt-1.5 w-full py-1 rounded-lg flex items-center justify-center gap-1 cursor-pointer transition-all"
                    style={{
                      background: inCart ? GREEN : '#F0F5F0',
                      color: inCart ? '#fff' : GREEN,
                      fontFamily: "'Montserrat', sans-serif",
                      fontSize: '0.68rem',
                      fontWeight: 600,
                      border: `1px solid ${GREEN}55`,
                    }}
                  >
                    {inCart ? <><Check size={10} /> {qty}×</> : <><Plus size={10} /> {lang === 'en' ? 'Add' : lang === 'ru' ? 'Добавить' : 'Ekle'}</>}
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* Selected chips */}
        {state.cart.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-1.5">
            {state.cart.map(item => {
              const name = lang === 'en' ? (item.meal.enName ?? item.meal.name) : lang === 'ru' ? (item.meal.ruName ?? item.meal.name) : item.meal.name;
              return (
                <span key={item.meal.id} className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full" style={{ background: '#E8F0E8', color: GREEN, fontFamily: "'Montserrat', sans-serif", fontSize: '0.67rem' }}>
                  {name.length > 14 ? name.slice(0, 12) + '…' : name} ×{item.quantity}
                  <button onClick={() => dispatch({ type: 'REMOVE_FROM_CART', payload: item.meal.id })} style={{ background: 'none', border: 'none', color: GREEN, cursor: 'pointer', padding: 0, lineHeight: 1, fontSize: '0.9rem' }}>×</button>
                </span>
              );
            })}
          </div>
        )}

        {state.cart.length > 0 && active && (
          <button
            onClick={handleMealsConfirmed}
            className="mt-3 w-full py-2.5 rounded-xl font-bold cursor-pointer transition-opacity hover:opacity-90"
            style={{ background: GREEN, color: '#fff', fontFamily: "'Montserrat', sans-serif", fontSize: '0.82rem', border: 'none' }}
          >
            {lang === 'en' ? `Continue → (${totalSelected} meals)` : lang === 'ru' ? `Продолжить → (${totalSelected} блюд)` : `Devam Et → (${totalSelected} yemek seçildi)`}
          </button>
        )}
      </div>
    );
  }

  function renderScheduleWidget(active: boolean) {
    const slotCounts = new Map<string, number>();
    for (const slot of scheduleSlots) {
      const key = `${slot.dayDate}|${slot.timeSlot}`;
      slotCounts.set(key, (slotCounts.get(key) ?? 0) + 1);
    }
    const hasConflict = Array.from(slotCounts.values()).some(v => v > 1);
    const allAssigned = scheduleSlots.length > 0 && scheduleSlots.every(s => s.dayDate && s.timeSlot);

    return (
      <div className={`mt-3 ${!active ? 'opacity-60 pointer-events-none' : ''}`}>
        <div className="space-y-3 max-h-72 overflow-y-auto pr-0.5" style={{ scrollbarWidth: 'thin' }}>
          {scheduleSlots.map((slot, idx) => {
            const slotKey = `${slot.dayDate}|${slot.timeSlot}`;
            const isConflict = (slotCounts.get(slotKey) ?? 0) > 1;
            const mealName = lang === 'en' ? (slot.meal.enName ?? slot.meal.name) : lang === 'ru' ? (slot.meal.ruName ?? slot.meal.name) : slot.meal.name;
            const emoji = getMealEmoji(slot.meal);
            return (
              <div key={slot.key} className="p-3 rounded-xl" style={{ background: isConflict ? '#FFF3F0' : '#F8FAFA', border: `1px solid ${isConflict ? '#FF6B6B' : '#E5DDD0'}` }}>
                <div className="flex items-center gap-2 mb-2">
                  <span>{emoji}</span>
                  <span style={{ fontFamily: "'Montserrat', sans-serif", fontSize: '0.75rem', fontWeight: 700, color: '#1A1A1A', flex: 1 }}>
                    {mealName.length > 24 ? mealName.slice(0, 22) + '…' : mealName}
                  </span>
                  {isConflict && <span style={{ fontSize: '0.63rem', color: '#C0392B', fontFamily: "'Montserrat', sans-serif" }}>⚠️ {t('agent_conflict_label')}</span>}
                </div>
                {/* Day picker */}
                <div className="flex gap-1 overflow-x-auto mb-2 pb-0.5" style={{ scrollbarWidth: 'none' }}>
                  {next7Days.map(d => (
                    <button
                      key={d.date}
                      onClick={() => {
                        const updated = [...scheduleSlots];
                        updated[idx] = { ...updated[idx], dayDate: d.date };
                        setScheduleSlots(updated);
                      }}
                      className="flex-shrink-0 px-2 py-1 rounded-lg cursor-pointer transition-all"
                      style={{
                        background: slot.dayDate === d.date ? GREEN : '#F0F0F0',
                        color: slot.dayDate === d.date ? '#fff' : '#555',
                        fontFamily: "'Montserrat', sans-serif",
                        fontSize: '0.6rem',
                        fontWeight: slot.dayDate === d.date ? 700 : 400,
                        border: 'none',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {d.label}
                    </button>
                  ))}
                </div>
                {/* Time slots */}
                <div className="flex gap-1.5">
                  {TIME_SLOTS.map(ts => (
                    <button
                      key={ts.key}
                      onClick={() => {
                        const updated = [...scheduleSlots];
                        updated[idx] = { ...updated[idx], timeSlot: ts.key };
                        setScheduleSlots(updated);
                      }}
                      className="flex-1 py-1 rounded-lg cursor-pointer transition-all"
                      style={{
                        background: slot.timeSlot === ts.key ? GOLD : '#F0F0F0',
                        color: slot.timeSlot === ts.key ? '#fff' : '#555',
                        fontFamily: "'Montserrat', sans-serif",
                        fontSize: '0.6rem',
                        fontWeight: slot.timeSlot === ts.key ? 700 : 400,
                        border: 'none',
                      }}
                    >
                      {ts.label}
                    </button>
                  ))}
                </div>
              </div>
            );
          })}
        </div>

        {/* Mini weekly grid */}
        <div className="mt-3 overflow-x-auto rounded-xl p-2" style={{ background: '#F8FAFA', border: '1px solid #E5DDD0' }}>
          <div style={{ minWidth: 260 }}>
            <div className="flex gap-0.5 mb-1">
              <div style={{ width: 48, flexShrink: 0 }} />
              {next7Days.map(d => (
                <div key={d.date} className="flex-1 text-center" style={{ fontFamily: "'Montserrat', sans-serif", fontSize: '0.52rem', color: '#8A8A8A', fontWeight: 600 }}>
                  {d.label.split(' ')[0]}
                </div>
              ))}
            </div>
            {TIME_SLOTS.map(ts => (
              <div key={ts.key} className="flex gap-0.5 mb-0.5">
                <div className="flex-shrink-0 flex items-center" style={{ width: 48 }}>
                  <span style={{ fontFamily: "'Montserrat', sans-serif", fontSize: '0.52rem', color: '#8A8A8A' }}>{ts.label.split(' ')[0]}</span>
                </div>
                {next7Days.map(d => {
                  const inSlot = scheduleSlots.filter(s => s.dayDate === d.date && s.timeSlot === ts.key);
                  return (
                    <div
                      key={d.date}
                      className="flex-1 rounded flex items-center justify-center"
                      style={{ height: 22, background: inSlot.length > 1 ? '#FFEBEE' : inSlot.length === 1 ? '#E8F5E9' : '#EFEFEF', fontSize: '0.75rem' }}
                    >
                      {inSlot.length > 0 ? getMealEmoji(inSlot[0].meal) : ''}
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        </div>

        {hasConflict && (
          <div className="mt-2 p-2.5 rounded-xl" style={{ background: '#FFF3F0', border: '1px solid #FF6B6B' }}>
            <p style={{ fontFamily: "'Montserrat', sans-serif", fontSize: '0.72rem', color: '#C0392B' }}>
              ⚠️ {t('agent_conflict_msg')}
            </p>
          </div>
        )}

        {active && (
          <button
            onClick={handleScheduleConfirmed}
            disabled={hasConflict || !allAssigned}
            className="mt-3 w-full py-2.5 rounded-xl font-bold transition-opacity"
            style={{
              background: GREEN,
              color: '#fff',
              fontFamily: "'Montserrat', sans-serif",
              fontSize: '0.82rem',
              border: 'none',
              opacity: hasConflict || !allAssigned ? 0.5 : 1,
              cursor: hasConflict || !allAssigned ? 'not-allowed' : 'pointer',
            }}
          >
            {lang === 'en' ? 'Continue →' : lang === 'ru' ? 'Продолжить →' : 'Devam Et →'}
          </button>
        )}
      </div>
    );
  }

  function renderFormWidget(active: boolean) {
    const fStyle = (field: string): React.CSSProperties => fieldStyle(!!formErrors[field]);
    const taStyle = (field: string, extra: React.CSSProperties = {}): React.CSSProperties => ({ ...fStyle(field), ...extra });

    const lbl = (text: string) => (
      <div style={{ fontFamily: "'Montserrat', sans-serif", fontSize: '0.72rem', fontWeight: 600, color: '#333', marginBottom: 4 }}>{text}</div>
    );
    const err = (field: string) => formErrors[field] ? (
      <div style={{ color: '#C0392B', fontSize: '0.65rem', fontFamily: "'Montserrat', sans-serif", marginTop: 2 }}>{formErrors[field]}</div>
    ) : null;

    return (
      <div className={`mt-3 space-y-3 ${!active ? 'opacity-60 pointer-events-none' : ''}`}>
        {/* Delivery toggle */}
        <div className="flex rounded-xl overflow-hidden" style={{ border: `1.5px solid ${GREEN}` }}>
          {(['teslimat', 'gelal'] as const).map(type => (
            <button
              key={type}
              onClick={() => setForm(f => ({ ...f, deliveryType: type }))}
              className="flex-1 py-2 font-bold cursor-pointer transition-all"
              style={{ background: form.deliveryType === type ? GREEN : 'transparent', color: form.deliveryType === type ? '#fff' : GREEN, fontFamily: "'Montserrat', sans-serif", fontSize: '0.78rem', border: 'none' }}
            >
              {type === 'teslimat' ? (lang === 'en' ? '🚚 Delivery' : lang === 'ru' ? '🚚 Доставка' : '🚚 Teslimat') : (lang === 'en' ? '🏪 Pick Up' : lang === 'ru' ? '🏪 Самовывоз' : '🏪 Gel Al')}
            </button>
          ))}
        </div>

        <div>
          {lbl(t('chk_name'))}
          <input style={fStyle('name')} value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder={t('chk_name')} />
          {err('name')}
        </div>
        <div>
          {lbl(t('chk_phone'))}
          <input style={fStyle('phone')} value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} placeholder="+90 5XX XXX XX XX" type="tel" />
          {err('phone')}
        </div>
        <div>
          {lbl(t('chk_email'))}
          <input style={fStyle('email')} value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} placeholder="email@example.com" type="email" />
          {err('email')}
        </div>

        {form.deliveryType === 'teslimat' && (
          <>
            <div>
              {lbl(t('chk_address'))}
              <textarea style={taStyle('address', { minHeight: 72, resize: 'none' as const, display: 'block' })} value={form.address} onChange={e => setForm(f => ({ ...f, address: e.target.value }))} placeholder={t('chk_address')} />
              {err('address')}
            </div>
            <div>
              {lbl(t('chk_district'))}
              <input style={fStyle('district')} value={form.district} onChange={e => setForm(f => ({ ...f, district: e.target.value }))} placeholder={t('chk_district')} />
              {err('district')}
            </div>
            <div>
              {lbl(t('chk_postal'))}
              <input style={fStyle('postal')} value={form.postal} onChange={e => setForm(f => ({ ...f, postal: e.target.value }))} placeholder={t('chk_postal')} />
            </div>
          </>
        )}

        <div>
          {lbl(t('chk_notes'))}
          <textarea style={taStyle('notes', { minHeight: 60, resize: 'none' as const, display: 'block' })} value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} placeholder={t('chk_notes_placeholder')} />
        </div>

        {active && (
          <button
            onClick={handleFormSubmit}
            className="w-full py-3 rounded-xl font-bold cursor-pointer transition-opacity hover:opacity-90"
            style={{ background: GREEN, color: '#fff', fontFamily: "'Montserrat', sans-serif", fontSize: '0.9rem', border: 'none' }}
          >
            🎉 {lang === 'en' ? 'Complete Order' : lang === 'ru' ? 'Оформить заказ' : 'Siparişi Tamamla'}
          </button>
        )}
      </div>
    );
  }

  // ── RENDER ───────────────────────────────────────────────────────────────────

  if (!state.aiAssistantEnabled) return null;
  const hideTrigger = state.currentPage === 'admin' || state.currentPage === 'track';

  return (
    <>
      {/* ── FULLSCREEN OVERLAY ── */}
      {isOpen && (
        <div className="fixed inset-0 flex flex-col" style={{ zIndex: 9999, background: BG }}>
          {/* Header */}
          <div className="flex items-center justify-between px-5 py-4 flex-shrink-0" style={{ background: GREEN }}>
            <div className="flex items-center gap-2">
              <Sparkles size={18} style={{ color: GOLD }} />
              <span style={{ color: '#fff', fontFamily: "'Montserrat', sans-serif", fontWeight: 700, fontSize: '1.05rem' }}>
                ✨ {lang === 'en' ? 'FIT Assistant' : lang === 'ru' ? 'FIT Ассистент' : 'FIT Asistan'}
              </span>
            </div>
            <button
              onClick={handleClose}
              className="w-9 h-9 rounded-xl flex items-center justify-center cursor-pointer transition-opacity hover:opacity-70"
              style={{ background: 'rgba(255,255,255,0.15)', border: 'none' }}
            >
              <X size={18} style={{ color: '#fff' }} />
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto px-4 py-4" style={{ scrollbarWidth: 'thin' }}>
            <div className="flex flex-col gap-3 max-w-lg mx-auto w-full">
              {msgs.map(msg => (
                <div key={msg.id} className={`flex ${msg.role === 'agent' ? 'justify-start' : 'justify-end'}`}>
                  {msg.role === 'agent' ? (
                    <div
                      className="shadow-sm"
                      style={{
                        maxWidth: '85%',
                        background: '#FFFFFF',
                        border: '1px solid #E5DDD0',
                        borderRadius: '4px 18px 18px 18px',
                        padding: '12px 16px',
                        fontFamily: "'Montserrat', sans-serif",
                        fontSize: '0.88rem',
                        color: '#1A1A1A',
                        lineHeight: 1.55,
                      }}
                    >
                      {msg.loading ? (
                        <span className="flex gap-1 items-center" style={{ padding: '2px 0' }}>
                          <span className="w-2 h-2 rounded-full animate-bounce" style={{ background: '#8A8A8A', animationDelay: '0ms' }} />
                          <span className="w-2 h-2 rounded-full animate-bounce" style={{ background: '#8A8A8A', animationDelay: '150ms' }} />
                          <span className="w-2 h-2 rounded-full animate-bounce" style={{ background: '#8A8A8A', animationDelay: '300ms' }} />
                        </span>
                      ) : (
                        <>
                          <p style={{ whiteSpace: 'pre-line', margin: 0 }}>{msg.text}</p>
                          {msg.id === activeWidgetMsgId && msg.widget === 'A' && renderGoalWidget(phase === 'A')}
                          {msg.id === activeWidgetMsgId && msg.widget === 'B' && renderRestrictionWidget(phase === 'B')}
                          {msg.id === activeWidgetMsgId && msg.widget === 'C' && renderPlanWidget(phase === 'C')}
                          {msg.id === activeWidgetMsgId && msg.widget === 'D' && renderMealWidget(phase === 'D')}
                          {msg.id === activeWidgetMsgId && msg.widget === 'E' && renderScheduleWidget(phase === 'E')}
                          {msg.id === activeWidgetMsgId && msg.widget === 'F' && renderFormWidget(phase === 'F')}
                        </>
                      )}
                    </div>
                  ) : (
                    <div
                      style={{
                        maxWidth: '75%',
                        background: GREEN,
                        color: '#fff',
                        borderRadius: '18px 4px 18px 18px',
                        padding: '12px 16px',
                        fontFamily: "'Montserrat', sans-serif",
                        fontSize: '0.88rem',
                        lineHeight: 1.55,
                      }}
                    >
                      {msg.text}
                    </div>
                  )}
                </div>
              ))}

              {isTyping && (
                <div className="flex justify-start">
                  <div className="shadow-sm" style={{ background: '#FFFFFF', border: '1px solid #E5DDD0', borderRadius: '4px 18px 18px 18px', padding: '14px 18px' }}>
                    <span className="flex gap-1 items-center">
                      <span className="w-2 h-2 rounded-full animate-bounce" style={{ background: '#8A8A8A', animationDelay: '0ms' }} />
                      <span className="w-2 h-2 rounded-full animate-bounce" style={{ background: '#8A8A8A', animationDelay: '150ms' }} />
                      <span className="w-2 h-2 rounded-full animate-bounce" style={{ background: '#8A8A8A', animationDelay: '300ms' }} />
                    </span>
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>
          </div>

          {/* Input bar */}
          <div className="flex-shrink-0 px-4 py-3" style={{ background: '#FFFFFF', borderTop: '1px solid #E5DDD0' }}>
            <div className="flex items-center gap-2 max-w-lg mx-auto">
              <input
                type="text"
                value={inputText}
                onChange={e => setInputText(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && !isTyping && handleFreeText()}
                placeholder={t('ai_placeholder')}
                disabled={isTyping || phase === 'G'}
                className="flex-1 px-4 py-3 rounded-2xl focus:outline-none"
                style={{ background: '#F8F5F0', border: '1.5px solid #E5DDD0', fontFamily: "'Montserrat', sans-serif", color: '#1A1A1A', fontSize: '0.88rem' }}
              />
              <button
                onClick={handleFreeText}
                disabled={isTyping || !inputText.trim() || phase === 'G'}
                className="w-11 h-11 rounded-full flex items-center justify-center cursor-pointer transition-opacity flex-shrink-0"
                style={{ background: GREEN, opacity: isTyping || !inputText.trim() || phase === 'G' ? 0.45 : 1, border: 'none' }}
              >
                <Send size={16} style={{ color: '#fff' }} />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── FLOATING TRIGGER ── */}
      {!isOpen && !hideTrigger && (
        <button
          onClick={() => setIsOpen(true)}
          className="fixed flex items-center gap-2 cursor-pointer transition-transform hover:scale-105 active:scale-95"
          style={{
            bottom: 24,
            right: 24,
            zIndex: 50,
            background: GREEN,
            color: '#fff',
            borderRadius: 9999,
            padding: '12px 20px',
            fontFamily: "'Montserrat', sans-serif",
            fontWeight: 700,
            fontSize: '0.9rem',
            border: 'none',
            boxShadow: '0 4px 24px rgba(30,63,48,0.38)',
          }}
        >
          <Sparkles size={16} style={{ color: GOLD }} />
          ✨ {lang === 'en' ? 'FIT Assistant' : lang === 'ru' ? 'FIT Ассистент' : 'FIT Asistan'}
          <span
            className="absolute"
            style={{ top: -4, right: -4, width: 10, height: 10, borderRadius: '50%', background: GOLD, boxShadow: `0 0 0 3px ${GOLD}55`, animation: 'pulse 2s cubic-bezier(0.4,0,0.6,1) infinite' }}
          />
        </button>
      )}
    </>
  );
}

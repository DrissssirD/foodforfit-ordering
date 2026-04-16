import { useState, useEffect, useRef } from 'react';
import { X, Sparkles, Send, Check, Plus, ShoppingBag } from 'lucide-react';
import { useApp } from '../store';
import { useT } from '../i18n';
import { getMealEmoji } from '../data';
import type { AgentMessage, Meal, SubscriptionPlan } from '../types';

// ─── Anthropic API call ───────────────────────────────────────────────────────

async function callClaude(
  messages: { role: 'user' | 'assistant'; content: string }[],
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

export { callClaude };

// ─── Marker parser ────────────────────────────────────────────────────────────

function parseMarkers(raw: string): {
  cleanText: string;
  mealCards: string[];
  suggestedPlanId: string | null;
} {
  let cleanText = raw;
  const mealCards: string[] = [];
  let suggestedPlanId: string | null = null;

  const mealsMatch = raw.match(/##MEALS:([^#]+)##/);
  if (mealsMatch) {
    mealCards.push(...mealsMatch[1].split(',').map(s => s.trim()).filter(Boolean));
    cleanText = cleanText.replace(/##MEALS:[^#]+##/g, '').trim();
  }

  const planMatch = raw.match(/##PLAN:([^#]+)##/);
  if (planMatch) {
    suggestedPlanId = planMatch[1].trim();
    cleanText = cleanText.replace(/##PLAN:[^#]+##/g, '').trim();
  }

  return { cleanText, mealCards, suggestedPlanId };
}

// ─── System prompt builder ────────────────────────────────────────────────────

function buildSystemPrompt(
  phase: string,
  goals: string[],
  lang: string,
  meals: Meal[],
  plans: SubscriptionPlan[],
  cartSummary: string,
  creditsRemaining: number,
  basePrompt: string,
): string {
  const langName = lang === 'tr' ? 'Turkish' : lang === 'ru' ? 'Russian' : 'English';

  const mealsCtx = meals
    .filter(m => m.available)
    .map(m =>
      `ID:${m.id} | ${m.name} | ${m.calories}kcal | P:${m.protein}g C:${m.carbs}g F:${m.fat}g | ₺${m.price} | tags:${m.tags.join(',')}`
    )
    .join('\n');

  const plansCtx = plans
    .map(p =>
      `ID:${p.id} | ${p.name} | ₺${p.price} | ${p.mealCount} meals | ${p.features.join(', ')}`
    )
    .join('\n');

  return `${basePrompt}

CURRENT PHASE: ${phase}
CUSTOMER GOALS: ${goals.length ? goals.join(', ') : 'unknown'}
CREDITS REMAINING: ${creditsRemaining}
CURRENT CART: ${cartSummary || 'empty'}

AVAILABLE MEALS:
${mealsCtx}

SUBSCRIPTION PLANS:
${plansCtx}

STRICT RULES — follow every one:
1. Always respond in ${langName}. Never switch languages.
2. Keep responses to 2-3 sentences MAX. The UI renders cards separately.
3. When recommending specific meals output the marker ##MEALS:id1,id2,id3## — use real meal IDs from the list above.
4. When recommending a plan output the marker ##PLAN:planId## — use a real plan ID from the list above.
5. Never explain what ##MEALS## or ##PLAN## markers are.
6. Phase is "${phase}" — act accordingly: greeting→ask goal, discovery→ask restrictions/frequency, recommendation→suggest a plan, meal_selection→help choose meals, ready_to_checkout→encourage completing order.`;
}

// ─── Sub-components ───────────────────────────────────────────────────────────

const green = '#1E3F30';
const gold = '#C8A97A';
const cream = '#FDF6F2';

function InlinePlanCard({
  plan,
  lang,
  onSelect,
  onShowAll,
}: {
  plan: SubscriptionPlan;
  lang: string;
  onSelect: () => void;
  onShowAll: () => void;
}) {
  const name = lang === 'en' ? (plan.enName || plan.name) : lang === 'ru' ? (plan.ruName || plan.name) : plan.name;
  const features = lang === 'en' ? (plan.enFeatures || plan.features) : lang === 'ru' ? (plan.ruFeatures || plan.features) : plan.features;
  const selectLabel = lang === 'en' ? 'Select this plan' : lang === 'ru' ? 'Выбрать план' : 'Bu paketi seç';
  const otherLabel = lang === 'en' ? 'Other plans' : lang === 'ru' ? 'Другие планы' : 'Diğer paketler';

  return (
    <div
      className="mt-3 rounded-2xl overflow-hidden"
      style={{ border: `1.5px solid ${gold}`, background: '#FFFDF9', maxWidth: 300 }}
    >
      <div className="px-4 py-3" style={{ background: green }}>
        <p style={{ color: gold, fontFamily: "'Montserrat', sans-serif", fontWeight: 700, fontSize: '1rem' }}>{name}</p>
        <p style={{ color: 'rgba(255,255,255,0.7)', fontFamily: "'Montserrat', sans-serif", fontSize: '12px', marginTop: 2 }}>
          {plan.mealCount} {lang === 'ru' ? 'блюд' : lang === 'en' ? 'meals' : 'öğün'} · ₺{plan.price.toLocaleString('tr-TR')}
        </p>
      </div>
      <div className="px-4 py-3">
        <ul className="space-y-1 mb-3">
          {features.slice(0, 3).map((f, i) => (
            <li key={i} className="flex items-center gap-2 text-xs" style={{ color: '#4A4A4A', fontFamily: "'Montserrat', sans-serif" }}>
              <span style={{ color: green }}>✓</span> {f}
            </li>
          ))}
        </ul>
        <div className="flex gap-2">
          <button
            onClick={onSelect}
            className="flex-1 py-2 rounded-xl text-xs font-bold cursor-pointer transition-opacity hover:opacity-80"
            style={{ background: green, color: '#fff', fontFamily: "'Montserrat', sans-serif" }}
          >
            {selectLabel}
          </button>
          <button
            onClick={onShowAll}
            className="flex-1 py-2 rounded-xl text-xs font-bold cursor-pointer transition-opacity hover:opacity-80"
            style={{ background: '#E5DDD0', color: '#4A4A4A', fontFamily: "'Montserrat', sans-serif" }}
          >
            {otherLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

function InlineMealCard({
  meal,
  inCart,
  onAdd,
}: {
  meal: Meal;
  inCart: boolean;
  onAdd: () => void;
}) {
  return (
    <div
      className="flex-shrink-0 rounded-2xl overflow-hidden flex flex-col"
      style={{ width: 160, border: '1.5px solid #E5DDD0', background: '#FFFDF9' }}
    >
      <div
        className="w-full flex items-center justify-center text-3xl"
        style={{ height: 72, background: meal.imageUrl ? undefined : '#E8F0E8' }}
      >
        {meal.imageUrl ? (
          <img src={meal.imageUrl} alt={meal.name} className="w-full h-full object-cover" />
        ) : (
          getMealEmoji(meal)
        )}
      </div>
      <div className="px-2.5 py-2 flex flex-col gap-1 flex-1">
        <p className="text-xs font-bold leading-tight" style={{ color: '#1A1A1A', fontFamily: "'Montserrat', sans-serif" }}>
          {meal.name}
        </p>
        <p className="text-[10px]" style={{ color: '#8A8A8A', fontFamily: "'Montserrat', sans-serif" }}>
          {meal.calories} kcal · ₺{meal.price}
        </p>
        <div className="flex gap-1 text-[9px] mt-0.5" style={{ color: '#8A8A8A', fontFamily: "'Montserrat', sans-serif" }}>
          <span>P:{meal.protein}g</span>
          <span>C:{meal.carbs}g</span>
          <span>F:{meal.fat}g</span>
        </div>
      </div>
      <div className="px-2.5 pb-2.5">
        <button
          onClick={onAdd}
          disabled={inCart}
          className="w-full py-1.5 rounded-xl text-[11px] font-bold flex items-center justify-center gap-1 cursor-pointer transition-all disabled:opacity-70"
          style={{
            background: inCart ? '#E8F0E8' : green,
            color: inCart ? green : '#fff',
            fontFamily: "'Montserrat', sans-serif",
          }}
        >
          {inCart ? <Check size={11} /> : <Plus size={11} />}
          {inCart ? 'Eklendi' : 'Ekle'}
        </button>
      </div>
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function FitAssistant() {
  const { state, dispatch } = useApp();
  const t = useT(state.lang);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const { agentSession } = state;
  const { isOpen, messages, phase, discoveredGoals } = agentSession;

  if (!state.aiAssistantEnabled) return null;

  // Auto-scroll on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Send greeting when opened with empty messages
  useEffect(() => {
    if (isOpen && messages.length === 0) {
      const greetingMsg: AgentMessage = {
        id: `msg-${Date.now()}`,
        role: 'assistant',
        content: t('agent_greeting'),
        timestamp: Date.now(),
      };
      dispatch({ type: 'ADD_AGENT_MESSAGE', payload: greetingMsg });
    }
  }, [isOpen]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!isOpen) return null;

  // Build cart lookup for InlineMealCard
  const cartMealIds = new Set(state.cart.map(i => i.meal.id));

  // API history from store messages (exclude loading placeholders)
  const apiHistory = messages
    .filter(m => !m.loading && m.content.trim() !== '')
    .map(m => ({ role: m.role as 'user' | 'assistant', content: m.content }));

  const cartSummary = state.cart.length > 0
    ? state.cart.map(i => `${i.meal.name} x${i.quantity}`).join(', ')
    : '';

  const systemPrompt = buildSystemPrompt(
    phase,
    discoveredGoals,
    state.lang,
    state.adminMeals,
    state.adminPlans,
    cartSummary,
    state.creditsRemaining,
    state.aiSystemPrompt,
  );

  // ── Send a user message and get AI reply ───────────────────────────────────
  const sendMessage = async (text: string) => {
    if (!text.trim() || isLoading) return;
    setInput('');

    const userMsg: AgentMessage = {
      id: `msg-${Date.now()}-u`,
      role: 'user',
      content: text.trim(),
      timestamp: Date.now(),
    };
    dispatch({ type: 'ADD_AGENT_MESSAGE', payload: userMsg });

    const loadingId = `msg-${Date.now()}-l`;
    const loadingMsg: AgentMessage = {
      id: loadingId,
      role: 'assistant',
      content: '',
      timestamp: Date.now(),
      loading: true,
    };
    dispatch({ type: 'ADD_AGENT_MESSAGE', payload: loadingMsg });
    setIsLoading(true);

    try {
      const history = [...apiHistory, { role: 'user' as const, content: text.trim() }];
      const raw = await callClaude(history, systemPrompt);
      const { cleanText, mealCards, suggestedPlanId } = parseMarkers(raw);

      dispatch({
        type: 'UPDATE_AGENT_MESSAGE',
        payload: {
          id: loadingId,
          updates: { content: cleanText, loading: false, mealCards, suggestedPlanId: suggestedPlanId ?? undefined },
        },
      });

      if (suggestedPlanId) {
        dispatch({ type: 'SET_AGENT_SUGGESTED_PLAN', payload: suggestedPlanId });
        if (phase !== 'recommendation') dispatch({ type: 'SET_AGENT_PHASE', payload: 'recommendation' });
      }
      if (mealCards.length > 0 && phase !== 'meal_selection') {
        dispatch({ type: 'SET_AGENT_PHASE', payload: 'meal_selection' });
      }
    } catch {
      dispatch({
        type: 'UPDATE_AGENT_MESSAGE',
        payload: { id: loadingId, updates: { content: '⚠️ Bağlantı hatası. Tekrar deneyin.', loading: false } },
      });
    } finally {
      setIsLoading(false);
    }
  };

  // ── Goal quick-select ──────────────────────────────────────────────────────
  const handleGoalSelect = (goal: string) => {
    dispatch({ type: 'SET_AGENT_GOALS', payload: [goal] });
    dispatch({ type: 'SET_AGENT_PHASE', payload: 'discovery' });
    sendMessage(goal);
  };

  // ── Plan selection ─────────────────────────────────────────────────────────
  const handleSelectPlan = (plan: SubscriptionPlan) => {
    dispatch({ type: 'SELECT_PLAN', payload: plan });
    dispatch({ type: 'SET_AGENT_PHASE', payload: 'meal_selection' });
    dispatch({ type: 'SET_AGENT_SUGGESTED_PLAN', payload: plan.id });
    const confirmText = state.lang === 'en'
      ? `I selected the ${plan.name} plan. Please show me the available meals.`
      : state.lang === 'ru'
      ? `Я выбрал пакет ${plan.name}. Покажи доступные блюда.`
      : `${plan.name} paketini seçtim. Mevcut yemekleri göster.`;
    sendMessage(confirmText);
  };

  const handleShowAllPlans = () => {
    dispatch({ type: 'CLOSE_AGENT' });
    dispatch({ type: 'SET_PAGE', payload: 'packages' });
  };

  // ── Add meal to cart ───────────────────────────────────────────────────────
  const handleAddMeal = (meal: Meal) => {
    if (state.creditsRemaining <= 0) return;
    dispatch({ type: 'ADD_TO_CART', payload: { meal, isCreditBased: true } });
    // When cart fills up, move to ready_to_checkout
    if (state.creditsRemaining - 1 <= 0) {
      dispatch({ type: 'SET_AGENT_PHASE', payload: 'ready_to_checkout' });
      const fullMsg: AgentMessage = {
        id: `msg-${Date.now()}-full`,
        role: 'assistant',
        content: t('agent_cart_full'),
        timestamp: Date.now(),
      };
      dispatch({ type: 'ADD_AGENT_MESSAGE', payload: fullMsg });
    }
  };

  // ── Phase label ────────────────────────────────────────────────────────────
  const phaseLabel = () => {
    switch (phase) {
      case 'greeting': return t('agent_phase_greeting');
      case 'discovery': return t('agent_phase_discovery');
      case 'recommendation': return t('agent_phase_recommendation');
      case 'meal_selection': return t('agent_phase_meal_selection');
      case 'ready_to_checkout': return t('agent_phase_ready');
    }
  };

  // ── Resolve meal objects from IDs ──────────────────────────────────────────
  const resolveMeals = (ids: string[]): Meal[] =>
    ids.map(id => state.adminMeals.find(m => m.id === id)).filter((m): m is Meal => !!m && m.available);

  const resolvePlan = (id: string): SubscriptionPlan | undefined =>
    state.adminPlans.find(p => p.id === id);

  // ── Goal buttons (shown after first greeting message) ─────────────────────
  const goalButtons = [
    { key: 'weight', label: t('agent_goal_weight') },
    { key: 'muscle', label: t('agent_goal_muscle') },
    { key: 'healthy', label: t('agent_goal_healthy') },
    { key: 'practical', label: t('agent_goal_practical') },
  ];

  const isFirstGreeting = messages.length === 1 && messages[0].role === 'assistant' && phase === 'greeting';

  const creditsUsed = state.cart.reduce((s, i) => s + (i.isCreditBased ? i.quantity : 0), 0);
  const totalCredits = state.subscriptionPlan?.mealCount ?? 0;

  return (
    <div
      className="fixed inset-0 flex flex-col"
      style={{ zIndex: 9999, background: cream }}
    >
      {/* ── Header ── */}
      <div
        className="flex items-center justify-between px-5 py-4 flex-shrink-0"
        style={{ background: green }}
      >
        <div className="flex items-center gap-3">
          <Sparkles size={20} style={{ color: gold }} />
          <div>
            <p style={{ color: '#fff', fontFamily: "'Montserrat', sans-serif", fontWeight: 700, fontSize: '1rem', lineHeight: 1.2 }}>
              FIT Asistan
            </p>
            <span
              className="inline-block px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider mt-0.5"
              style={{ background: 'rgba(200,169,122,0.25)', color: gold, fontFamily: "'Montserrat', sans-serif" }}
            >
              {phaseLabel()}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {totalCredits > 0 && (
            <div className="flex items-center gap-2">
              <ShoppingBag size={14} style={{ color: 'rgba(255,255,255,0.7)' }} />
              <span style={{ color: 'rgba(255,255,255,0.85)', fontFamily: "'Montserrat', sans-serif", fontSize: '12px', fontWeight: 600 }}>
                {creditsUsed}/{totalCredits}
              </span>
            </div>
          )}
          <button
            onClick={() => dispatch({ type: 'CLOSE_AGENT' })}
            className="w-9 h-9 rounded-2xl flex items-center justify-center cursor-pointer transition-opacity hover:opacity-70"
            style={{ background: 'rgba(255,255,255,0.15)' }}
            aria-label="Close"
          >
            <X size={18} style={{ color: '#fff' }} />
          </button>
        </div>
      </div>

      {/* ── Messages ── */}
      <div className="flex-1 overflow-y-auto px-4 py-5 space-y-4">
        {messages.map((msg) => {
          const isBot = msg.role === 'assistant';
          const planObj = msg.suggestedPlanId ? resolvePlan(msg.suggestedPlanId) : undefined;
          const mealObjs = msg.mealCards ? resolveMeals(msg.mealCards) : [];

          return (
            <div key={msg.id} className={`flex ${isBot ? 'justify-start' : 'justify-end'}`}>
              <div className="max-w-[85%] flex flex-col gap-2">
                {/* Message bubble */}
                {(msg.loading || msg.content) && (
                  <div
                    className="px-4 py-3 rounded-2xl text-sm leading-relaxed whitespace-pre-line"
                    style={{
                      background: isBot ? '#FFFFFF' : green,
                      color: isBot ? '#1A1A1A' : '#fff',
                      border: isBot ? '1px solid #E5DDD0' : 'none',
                      fontFamily: "'Montserrat', sans-serif",
                      borderRadius: isBot ? '4px 18px 18px 18px' : '18px 4px 18px 18px',
                    }}
                  >
                    {msg.loading ? (
                      <span className="flex gap-1 items-center py-0.5">
                        <span className="w-2 h-2 rounded-full animate-bounce" style={{ background: '#C8A97A', animationDelay: '0ms' }} />
                        <span className="w-2 h-2 rounded-full animate-bounce" style={{ background: '#C8A97A', animationDelay: '150ms' }} />
                        <span className="w-2 h-2 rounded-full animate-bounce" style={{ background: '#C8A97A', animationDelay: '300ms' }} />
                      </span>
                    ) : msg.content}
                  </div>
                )}

                {/* Inline plan card */}
                {isBot && planObj && (
                  <InlinePlanCard
                    plan={planObj}
                    lang={state.lang}
                    onSelect={() => handleSelectPlan(planObj)}
                    onShowAll={handleShowAllPlans}
                  />
                )}

                {/* Inline meal cards row */}
                {isBot && mealObjs.length > 0 && (
                  <div className="flex gap-3 overflow-x-auto pb-1 pt-1" style={{ maxWidth: '80vw' }}>
                    {mealObjs.map(meal => (
                      <InlineMealCard
                        key={meal.id}
                        meal={meal}
                        inCart={cartMealIds.has(meal.id)}
                        onAdd={() => handleAddMeal(meal)}
                      />
                    ))}
                  </div>
                )}
              </div>
            </div>
          );
        })}

        {/* Goal quick-select buttons after greeting */}
        {isFirstGreeting && (
          <div className="flex flex-wrap gap-2 pl-1">
            {goalButtons.map(btn => (
              <button
                key={btn.key}
                onClick={() => handleGoalSelect(btn.label)}
                className="px-4 py-2.5 rounded-full text-sm font-semibold cursor-pointer transition-all hover:opacity-80"
                style={{ background: '#E8F0E8', color: green, border: `1.5px solid ${green}40`, fontFamily: "'Montserrat', sans-serif" }}
              >
                {btn.label}
              </button>
            ))}
          </div>
        )}

        {/* Ready-to-checkout CTA */}
        {phase === 'ready_to_checkout' && (
          <div className="flex flex-col gap-3 pt-2 px-1">
            <button
              onClick={() => {
                dispatch({ type: 'CLOSE_AGENT' });
                dispatch({ type: 'TOGGLE_CHECKOUT', payload: true });
              }}
              className="w-full py-4 rounded-2xl text-base font-bold cursor-pointer transition-transform active:scale-95"
              style={{ background: green, color: '#fff', fontFamily: "'Montserrat', sans-serif", boxShadow: `0 8px 24px ${green}40` }}
            >
              🛒 {t('agent_checkout_btn')}
            </button>
            <button
              onClick={() => dispatch({ type: 'SET_AGENT_PHASE', payload: 'meal_selection' })}
              className="w-full py-3 rounded-2xl text-sm font-semibold cursor-pointer transition-opacity hover:opacity-70"
              style={{ background: '#E5DDD0', color: '#4A4A4A', fontFamily: "'Montserrat', sans-serif" }}
            >
              {t('agent_edit_cart')}
            </button>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* ── Input ── */}
      <div
        className="flex-shrink-0 px-4 py-4 border-t"
        style={{ borderColor: '#E5DDD0', background: '#FFFDF9' }}
      >
        <div className="flex items-center gap-3">
          <input
            type="text"
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && sendMessage(input)}
            placeholder={t('agent_input_placeholder')}
            disabled={isLoading}
            className="flex-1 px-4 py-3 text-sm rounded-2xl focus:outline-none"
            style={{
              background: '#FFFFFF',
              border: '1.5px solid #E5DDD0',
              fontFamily: "'Montserrat', sans-serif",
              color: '#1A1A1A',
            }}
          />
          <button
            onClick={() => sendMessage(input)}
            disabled={isLoading || !input.trim()}
            className="w-12 h-12 rounded-full flex items-center justify-center cursor-pointer transition-opacity"
            style={{ background: green, opacity: isLoading || !input.trim() ? 0.4 : 1 }}
            aria-label="Send"
          >
            <Send size={16} style={{ color: '#fff' }} />
          </button>
        </div>
      </div>
    </div>
  );
}

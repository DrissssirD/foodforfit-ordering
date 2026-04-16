import { useState, useEffect, useRef } from 'react';
import { X, Sparkles, Send } from 'lucide-react';
import { useApp } from '../store';
import { useT } from '../i18n';
import type { ChatConversation, ChatMessage } from '../types';

interface Message {
  id: number;
  text: string;
  isBot: boolean;
  loading?: boolean;
}

async function callClaude(
  messages: { role: 'user' | 'assistant'; content: string }[],
  lang: string,
  menuContext: string,
  systemPrompt: string,
): Promise<string> {
  const fullPrompt = `${systemPrompt}

${menuContext}

Always respond in ${lang === 'tr' ? 'Turkish' : lang === 'ru' ? 'Russian' : 'English'}.`;

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
      max_tokens: 1000,
      system: fullPrompt,
      messages,
    }),
  });
  const data = await response.json();
  return data.content?.[0]?.text ?? '...';
}

export { callClaude };

const green = '#1E3F30';

export default function FitAssistant() {
  const { state, dispatch } = useApp();
  const t = useT(state.lang);
  const [isOpen, setIsOpen] = useState(false);
  const [showTooltip, setShowTooltip] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const msgIdRef = useRef(1);
  const historyRef = useRef<{ role: 'user' | 'assistant'; content: string }[]>([]);
  const conversationStartRef = useRef<string>('');

  // Don't render if admin has disabled the assistant
  if (!state.aiAssistantEnabled) return null;

  // Reset & welcome on open or lang change
  useEffect(() => {
    if (isOpen) {
      historyRef.current = [];
      conversationStartRef.current = new Date().toISOString();
      setMessages([{ id: msgIdRef.current++, text: t('ai_welcome'), isBot: true }]);
    }
  }, [isOpen, state.lang]);

  useEffect(() => {
    const a = setTimeout(() => setShowTooltip(true), 3500);
    const b = setTimeout(() => setShowTooltip(false), 9000);
    return () => { clearTimeout(a); clearTimeout(b); };
  }, []);

  useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

  const menuContext = [
    '=== MENU ===',
    state.adminMeals
      .filter(m => m.available)
      .map(m => `${m.name} | ${m.calories}kcal | P:${m.protein}g C:${m.carbs}g F:${m.fat}g | ₺${m.price} | tags: ${m.tags.join(', ')}`)
      .join('\n'),
    '',
    '=== CART ===',
    state.cart.length > 0
      ? state.cart.map(i => `${i.meal.name} × ${i.quantity}`).join(', ')
      : 'Empty cart',
    '',
    '=== SUBSCRIPTION PLAN ===',
    state.subscriptionPlan
      ? `${state.subscriptionPlan.name} | ${state.subscriptionPlan.mealCount} meals | ₺${state.subscriptionPlan.price} | Credits remaining: ${state.creditsRemaining}`
      : 'No plan selected',
    '',
    '=== BUSINESS INFO ===',
    `Delivery areas: ${state.businessSettings.deliveryAreas}`,
    `Hours: ${state.businessSettings.deliveryHours}`,
    `Accepting orders: ${state.businessSettings.isAcceptingOrders ? 'Yes' : 'No — ' + state.businessSettings.closedMessage}`,
    `Free delivery over: ₺${state.businessSettings.freeDeliveryThreshold}`,
    `Delivery fee: ₺${state.businessSettings.deliveryFee}`,
  ].join('\n');

  const handleClose = () => {
    // Save conversation to history if there were actual user messages
    if (historyRef.current.length > 0) {
      const conversation: ChatConversation = {
        id: `conv-${Date.now()}`,
        startedAt: conversationStartRef.current,
        lang: state.lang,
        messages: historyRef.current.map(m => ({ role: m.role, content: m.content } as ChatMessage)),
      };
      dispatch({ type: 'ADD_CHAT_CONVERSATION', payload: conversation });
    }
    setIsOpen(false);
  };

  const handleSend = async (overrideText?: string) => {
    const text = (overrideText !== undefined ? overrideText : input).trim();
    if (!text || isLoading) return;
    setInput('');

    const userMsg: Message = { id: msgIdRef.current++, text, isBot: false };
    setMessages(prev => [...prev, userMsg]);
    historyRef.current.push({ role: 'user', content: text });

    const loadingId = msgIdRef.current++;
    setMessages(prev => [...prev, { id: loadingId, text: '...', isBot: true, loading: true }]);
    setIsLoading(true);

    try {
      const reply = await callClaude(historyRef.current, state.lang, menuContext, state.aiSystemPrompt);
      historyRef.current.push({ role: 'assistant', content: reply });
      setMessages(prev => prev.map(m => m.id === loadingId ? { ...m, text: reply, loading: false } : m));
    } catch {
      setMessages(prev => prev.map(m => m.id === loadingId ? { ...m, text: t('ai_error'), loading: false } : m));
    } finally {
      setIsLoading(false);
    }
  };

  const quickButtons = [t('ai_quick_1'), t('ai_quick_2'), t('ai_quick_3')];

  return (
    <div className="fixed bottom-6 right-6 z-[1000]">
      {isOpen && (
        <div
          className="absolute bottom-20 right-0 w-[370px] max-w-[calc(100vw-40px)] rounded-3xl flex flex-col overflow-hidden animate-fade-in-up"
          style={{ height: 520, background: '#FDF6F2', boxShadow: '0 20px 60px rgba(0,0,0,0.18)', border: '1px solid #E5DDD0' }}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-5 py-4" style={{ background: green }}>
            <div className="flex items-center gap-2">
              <Sparkles size={17} style={{ color: '#C8A97A' }} />
              <span style={{ color: '#fff', fontFamily: "'Montserrat', sans-serif", fontWeight: 700, fontSize: '1rem' }}>
                {t('ai_title')}
              </span>
              <span className="w-2 h-2 rounded-full ml-1" style={{ background: '#4ade80' }} />
            </div>
            <button onClick={handleClose}
              className="w-8 h-8 rounded-xl flex items-center justify-center cursor-pointer transition-opacity hover:opacity-70"
              style={{ background: 'rgba(255,255,255,0.15)' }}>
              <X size={16} style={{ color: '#fff' }} />
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {messages.map(msg => (
              <div key={msg.id} className={`flex ${msg.isBot ? 'justify-start' : 'justify-end'}`}>
                <div
                  className="max-w-[85%] px-4 py-3 rounded-2xl text-sm leading-relaxed whitespace-pre-line"
                  style={{
                    background: msg.isBot ? '#FFFFFF' : green,
                    color: msg.isBot ? '#1A1A1A' : '#fff',
                    border: msg.isBot ? '1px solid #E5DDD0' : 'none',
                    fontFamily: "'Montserrat', sans-serif",
                    borderRadius: msg.isBot ? '4px 18px 18px 18px' : '18px 4px 18px 18px',
                    opacity: msg.loading ? 0.6 : 1,
                  }}
                >
                  {msg.loading ? (
                    <span className="flex gap-1 items-center">
                      <span className="w-1.5 h-1.5 rounded-full animate-bounce" style={{ background: '#8A8A8A', animationDelay: '0ms' }} />
                      <span className="w-1.5 h-1.5 rounded-full animate-bounce" style={{ background: '#8A8A8A', animationDelay: '150ms' }} />
                      <span className="w-1.5 h-1.5 rounded-full animate-bounce" style={{ background: '#8A8A8A', animationDelay: '300ms' }} />
                    </span>
                  ) : msg.text}
                </div>
              </div>
            ))}
            {/* Quick buttons after welcome */}
            {messages.length === 1 && (
              <div className="flex flex-wrap gap-2 mt-2">
                {quickButtons.map((btn, i) => (
                  <button key={i} onClick={() => handleSend(btn)}
                    className="px-3 py-2 text-xs font-medium rounded-full cursor-pointer transition-all"
                    style={{ background: '#E8F0E8', color: green, fontFamily: "'Montserrat', sans-serif", border: `1px solid ${green}33` }}
                  >
                    {btn}
                  </button>
                ))}
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div className="p-4 border-t" style={{ borderColor: '#E5DDD0' }}>
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleSend()}
                placeholder={t('ai_placeholder')}
                disabled={isLoading}
                className="flex-1 px-4 py-3 text-sm rounded-2xl focus:outline-none"
                style={{
                  background: '#FFFFFF', border: '1.5px solid #E5DDD0',
                  fontFamily: "'Montserrat', sans-serif", color: '#1A1A1A',
                }}
              />
              <button onClick={handleSend} disabled={isLoading || !input.trim()}
                className="w-10 h-10 rounded-full flex items-center justify-center cursor-pointer transition-opacity"
                style={{ background: green, opacity: isLoading || !input.trim() ? 0.5 : 1 }}
                aria-label="Send">
                <Send size={15} style={{ color: '#fff' }} />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Tooltip */}
      {showTooltip && !isOpen && (
        <div className="absolute bottom-20 right-0 px-4 py-2.5 rounded-2xl text-sm whitespace-nowrap animate-fade-in-up"
          style={{ background: '#FFFFFF', boxShadow: '0 4px 20px rgba(0,0,0,0.12)', border: '1px solid #E5DDD0', color: '#1A1A1A', fontFamily: "'Montserrat', sans-serif" }}>
          {t('ai_tooltip')}
          <div className="absolute -bottom-1.5 right-6 w-3 h-3 rotate-45" style={{ background: '#FFFFFF' }} />
        </div>
      )}

      {/* FAB */}
      <button
        onClick={() => { setIsOpen(!isOpen); setShowTooltip(false); }}
        className="w-15 h-15 rounded-full flex items-center justify-center cursor-pointer transition-all duration-300 relative"
        style={{ width: 60, height: 60, background: green, boxShadow: isOpen ? '0 4px 20px rgba(30,63,48,0.4)' : '0 4px 20px rgba(30,63,48,0.3)' }}
        aria-label={t('ai_title')}
      >
        {!isOpen && <span className="absolute inset-0 rounded-full animate-ping" style={{ background: 'rgba(30,63,48,0.3)' }} />}
        <Sparkles size={24} style={{ color: '#C8A97A', position: 'relative', zIndex: 10 }} />
      </button>
    </div>
  );
}

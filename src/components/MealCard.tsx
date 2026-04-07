import { Plus, Minus } from 'lucide-react';
import { useApp } from '../store';
import { useT } from '../i18n';
import type { Meal } from '../types';
import { getMealGradient, getMealEmoji } from '../data';

interface Props { meal: Meal; compact?: boolean; }

const green = '#1E3F30';

export default function MealCard({ meal, compact }: Props) {
  const { state, dispatch } = useApp();
  const t = useT(state.lang);
  const isSubscription = state.orderMode === 'subscription' && state.subscriptionPlan;
  const inCart = state.cart.find(item => item.meal.id === meal.id);

  const handleAdd = () => {
    if (isSubscription && state.creditsRemaining <= 0) return;
    dispatch({ type: 'ADD_TO_CART', payload: { meal, isCreditBased: !!isSubscription } });
  };
  const handleRemove = () => {
    if (inCart && inCart.quantity > 1) dispatch({ type: 'UPDATE_QUANTITY', payload: { mealId: meal.id, quantity: inCart.quantity - 1 } });
    else dispatch({ type: 'REMOVE_FROM_CART', payload: meal.id });
  };

  const tagLabels: Record<string, string> = {
    vejetaryen: state.lang === 'en' ? 'Vegetarian' : state.lang === 'ru' ? 'Вегетарианское' : 'Vejetaryen',
    vegan: state.lang === 'en' ? 'Vegan' : state.lang === 'ru' ? 'Веган' : 'Vegan',
    'yuksek-protein': state.lang === 'en' ? 'High Protein' : state.lang === 'ru' ? 'Высокий белок' : 'Yüksek Protein',
    'dusuk-yag': state.lang === 'en' ? 'Low Fat' : state.lang === 'ru' ? 'Мало жира' : 'Düşük Yağ',
    'gluten-free': 'Gluten-Free',
  };

  return (
    <div className={`group rounded-xl overflow-hidden transition-all duration-300 hover:-translate-y-1 ${compact ? 'min-w-[280px] snap-start' : ''}`}
      style={{ background: '#FFFFFF', border: '1.5px solid #E5DDD0', boxShadow: '0 2px 12px rgba(0,0,0,0.04)' }}
      onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.boxShadow = '0 12px 40px rgba(0,0,0,0.1)'; (e.currentTarget as HTMLDivElement).style.borderColor = '#C8A97A'; }}
      onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.boxShadow = '0 2px 12px rgba(0,0,0,0.04)'; (e.currentTarget as HTMLDivElement).style.borderColor = '#E5DDD0'; }}>
      <div className="relative aspect-[4/3] overflow-hidden" style={{ background: getMealGradient(meal) }}>
        <div className="absolute inset-0 flex items-center justify-center text-6xl group-hover:scale-110 transition-transform duration-500">
          {getMealEmoji(meal)}
        </div>
        {meal.tags.length > 0 && (
          <div className="absolute top-3 left-3 flex flex-wrap gap-1.5">
            {meal.tags.slice(0, 2).map(tag => (
              <span key={tag} className="px-2.5 py-1 text-xs font-medium rounded-full"
                style={{ background: 'rgba(253,246,242,0.92)', backdropFilter: 'blur(8px)', color: green, fontFamily: "'Montserrat', sans-serif" }}>
                {tagLabels[tag] || tag}
              </span>
            ))}
          </div>
        )}
      </div>
      <div className="p-5">
        <h3 className="text-lg font-bold mb-1 line-clamp-1" style={{ fontFamily: "'Montserrat', sans-serif", fontWeight: 700, color: '#1A1A1A' }}>{meal.name}</h3>
        <p className="text-xs mb-3 line-clamp-2" style={{ color: '#8A8A8A', fontFamily: "'Montserrat', sans-serif", lineHeight: '1.5' }}>{meal.description}</p>
        <div className="flex items-center gap-3 text-xs mb-4 flex-wrap" style={{ color: '#8A8A8A', fontFamily: "'Montserrat', sans-serif" }}>
          <span>🔥 {meal.calories} kcal</span><span>·</span>
          <span>💪 {meal.protein}g {state.lang === 'ru' ? 'белок' : state.lang === 'en' ? 'protein' : 'protein'}</span>
          <span>·</span><span>🌾 {meal.carbs}g</span>
        </div>
        <div className="flex items-center justify-between gap-2">
          {isSubscription
            ? <span className="text-sm font-semibold" style={{ color: green, fontFamily: "'Montserrat', sans-serif" }}>1 {t('meal_credit')}</span>
            : <span className="text-xl font-bold" style={{ fontFamily: "'Montserrat', sans-serif", fontWeight: 700, color: '#1A1A1A' }}>₺{meal.price}</span>}
          {inCart ? (
            <div className="flex items-center gap-2">
              <button onClick={handleRemove} className="w-8 h-8 rounded-full flex items-center justify-center cursor-pointer" style={{ background: '#F5ECD7', color: green }}><Minus size={14} /></button>
              <span className="w-6 text-center text-sm font-semibold" style={{ fontFamily: "'Montserrat', sans-serif", color: '#1A1A1A' }}>{inCart.quantity}</span>
              {/* In subscription mode, disable + when no credits left */}
              <button
                onClick={handleAdd}
                disabled={isSubscription ? state.creditsRemaining <= 0 : false}
                className="w-8 h-8 rounded-full flex items-center justify-center transition-all duration-200"
                style={{
                  background: (isSubscription && state.creditsRemaining <= 0) ? '#E5DDD0' : green,
                  color: '#fff',
                  cursor: (isSubscription && state.creditsRemaining <= 0) ? 'not-allowed' : 'pointer',
                  opacity: (isSubscription && state.creditsRemaining <= 0) ? 0.5 : 1,
                }}
              ><Plus size={14} /></button>
            </div>
          ) : (
            <button
              onClick={handleAdd}
              disabled={isSubscription ? state.creditsRemaining <= 0 : false}
              className="px-4 py-2 text-sm font-medium rounded-full flex items-center gap-1.5 transition-all duration-200"
              style={{
                background: (isSubscription && state.creditsRemaining <= 0) ? '#E5DDD0' : green,
                color: (isSubscription && state.creditsRemaining <= 0) ? '#8A8A8A' : '#fff',
                fontFamily: "'Montserrat', sans-serif",
                cursor: (isSubscription && state.creditsRemaining <= 0) ? 'not-allowed' : 'pointer',
                opacity: (isSubscription && state.creditsRemaining <= 0) ? 0.5 : 1,
              }}
            >
              <Plus size={14} />{t('meal_add')}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

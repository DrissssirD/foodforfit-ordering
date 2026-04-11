import { useState, useMemo } from 'react';
import { Search } from 'lucide-react';
import { categories, tagOptions } from '../data';
import { useApp } from '../store';
import { useT } from '../i18n';
import MealCard from './MealCard';

const green = '#1E3F30';

export default function MenuPage() {
  const { state, dispatch } = useApp();
  const t = useT(state.lang);
  const [activeCategory, setActiveCategory] = useState('all');
  const [activeTags, setActiveTags] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState('');

  const isSubscription = state.orderMode === 'subscription' && !!state.subscriptionPlan;
  const usedCredits = state.cart.reduce((sum, item) => sum + (item.isCreditBased ? item.quantity : 0), 0);
  const totalCredits = state.subscriptionPlan?.mealCount ?? 0;
  const creditProgress = totalCredits > 0 ? (usedCredits / totalCredits) * 100 : 0;

  const toggleTag = (tag: string) => setActiveTags(prev => prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]);

  const filteredMeals = useMemo(() => state.adminMeals.filter(meal => {
    if (!meal.available) return false;
    if (activeCategory !== 'all' && meal.category !== activeCategory) return false;
    if (activeTags.length > 0 && !activeTags.some(t => meal.tags.includes(t))) return false;
    if (searchQuery && !meal.name.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    
    // Filter by allowed meals in subscription plan
    if (isSubscription && state.subscriptionPlan?.allowedMealIds && state.subscriptionPlan.allowedMealIds.length > 0) {
      if (!state.subscriptionPlan.allowedMealIds.includes(meal.id)) return false;
    }
    
    return true;
  }), [activeCategory, activeTags, searchQuery, state.adminMeals, isSubscription, state.subscriptionPlan]);

  return (
    <div className="pt-[72px] min-h-screen" style={{ background: '#FDF6F2' }}>

      {/* Subscription banner — sits directly below the 72px header */}
      {isSubscription ? (
        <div className="sticky top-[72px] z-40 border-b" style={{ background: '#E8F0E8', borderColor: 'rgba(30,63,48,0.2)' }}>
          <div className="max-w-[1400px] mx-auto px-5 sm:px-8 lg:px-12 py-3 flex items-center justify-between gap-4">
            {/* Left: plan name + credit counts */}
            <div className="flex items-center gap-1.5 text-sm font-medium flex-wrap" style={{ color: '#1A1A1A', fontFamily: "'Montserrat', sans-serif" }}>
              <span>📦</span>
              <span style={{ fontWeight: 700, color: green }}>{state.subscriptionPlan!.name}</span>
              <span style={{ color: '#8A8A8A' }}>|</span>
              <span style={{ color: '#4A4A4A' }}>{t('menu_in_cart')} <strong>{usedCredits}</strong></span>
              <span style={{ color: '#8A8A8A' }}>|</span>
              <span style={{ color: green, fontWeight: 600 }}>{t('menu_remaining')} <strong>{state.creditsRemaining}</strong></span>
            </div>
            {/* Right: mini progress bar */}
            <div className="flex items-center gap-2 flex-shrink-0">
              <div className="w-24 h-2 rounded-full overflow-hidden" style={{ background: `${green}20` }}>
                <div className="h-full rounded-full transition-all duration-500" style={{ width: `${creditProgress}%`, background: green }} />
              </div>
              <span className="text-xs font-semibold" style={{ color: green, fontFamily: "'Montserrat', sans-serif" }}>
                {usedCredits}/{totalCredits}
              </span>
            </div>
          </div>
        </div>
      ) : (
        <div className="sticky top-[72px] z-40 border-b" style={{ background: '#FFFDF9', borderColor: '#C8A97A80' }}>
          <div className="max-w-[1400px] mx-auto px-5 sm:px-8 lg:px-12 py-4 flex flex-col sm:flex-row items-center justify-between gap-4 text-center sm:text-left">
            <div>
              <p className="font-bold text-[#1A1A1A] text-sm" style={{ fontFamily: "'Montserrat', sans-serif" }}>
                {t('menu_pkg_required')}
              </p>
              <p className="text-xs text-gray-500" style={{ fontFamily: "'Montserrat', sans-serif" }}>
                {t('menu_pkg_required_sub')}
              </p>
            </div>
            <button
              onClick={() => dispatch({ type: 'SET_PAGE', payload: 'packages' })}
              className="px-5 py-2 rounded-full text-xs font-bold text-white transition-transform active:scale-95"
              style={{ background: green, fontFamily: "'Montserrat', sans-serif" }}
            >
              {t('menu_pkg_browse')}
            </button>
          </div>
        </div>
      )}

      {/* Filter bar — top offset accounts for header (72px) + optional banner (~52px) */}
      <div className={`sticky ${isSubscription ? 'top-[124px]' : 'top-[72px]'} z-30 border-b`}
        style={{ background: 'rgba(253,246,242,0.96)', backdropFilter: 'blur(12px)', borderColor: '#E5DDD0' }}>
        <div className="max-w-[1400px] mx-auto px-5 sm:px-8 lg:px-12 py-4">
          <div className="relative mb-4">
            <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2" style={{ color: '#8A8A8A' }} />
            <input type="text" placeholder={t('menu_search')} value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
              className="w-full pl-11 pr-4 py-3 text-sm rounded-2xl focus:outline-none"
              style={{ background: '#FFFFFF', border: '1.5px solid #E5DDD0', fontFamily: "'Montserrat', sans-serif", color: '#1A1A1A' }} />
          </div>
          <div className="flex gap-2 overflow-x-auto no-scrollbar pb-2">
            {categories.map(cat => (
              <button key={cat.key} onClick={() => setActiveCategory(cat.key)}
                className="px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all cursor-pointer"
                style={{
                  background: activeCategory === cat.key ? green : '#FFFFFF',
                  color: activeCategory === cat.key ? '#fff' : '#4A4A4A',
                  border: activeCategory === cat.key ? 'none' : '1.5px solid #E5DDD0',
                  fontFamily: "'Montserrat', sans-serif",
                  boxShadow: activeCategory === cat.key ? '0 2px 8px rgba(30,63,48,0.2)' : 'none',
                }}>
                {cat.emoji} {state.lang === 'en' ? (cat as any).enLabel : state.lang === 'ru' ? (cat as any).ruLabel : cat.label}
              </button>
            ))}
          </div>
          <div className="flex gap-2 overflow-x-auto no-scrollbar mt-2">
            {tagOptions.map(tag => (
              <button key={tag.key} onClick={() => toggleTag(tag.key)}
                className="px-3 py-1.5 rounded-xl text-xs font-medium whitespace-nowrap transition-all cursor-pointer"
                style={{
                  background: activeTags.includes(tag.key) ? '#E8F0E8' : 'transparent',
                  color: activeTags.includes(tag.key) ? green : '#8A8A8A',
                  border: activeTags.includes(tag.key) ? `1.5px solid ${green}` : '1.5px solid transparent',
                  fontFamily: "'Montserrat', sans-serif",
                }}>
                {activeTags.includes(tag.key) && '✓ '}{state.lang === 'en' ? (tag as any).enLabel : state.lang === 'ru' ? (tag as any).ruLabel : tag.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="max-w-[1400px] mx-auto px-5 sm:px-8 lg:px-12 py-8">
        {filteredMeals.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {filteredMeals.map(meal => <MealCard key={meal.id} meal={meal} />)}
          </div>
        ) : (
          <div className="text-center py-20">
            <div className="text-5xl mb-4">🍽️</div>
            <h3 className="text-xl font-semibold mb-2" style={{ fontFamily: "'Montserrat', sans-serif", fontWeight: 700, color: '#1A1A1A' }}>{t('menu_no_result')}</h3>
            <p className="mb-4" style={{ color: '#8A8A8A', fontFamily: "'Montserrat', sans-serif" }}>{t('menu_no_result_sub')}</p>
            <button onClick={() => { setActiveCategory('all'); setActiveTags([]); setSearchQuery(''); }}
              className="text-sm font-medium hover:underline cursor-pointer" style={{ color: green, fontFamily: "'Montserrat', sans-serif" }}>
              {t('menu_clear')}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

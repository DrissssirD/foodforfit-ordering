import { useState, useMemo } from 'react';
import { Search } from 'lucide-react';
import { categories, tagOptions } from '../data';
import { useApp } from '../store';
import { useT } from '../i18n';
import MealCard from './MealCard';

const green = '#1E3F30';

export default function MenuPage() {
  const { state } = useApp();
  const t = useT(state.lang);
  const [activeCategory, setActiveCategory] = useState('all');
  const [activeTags, setActiveTags] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState('');

  const isSubscription = state.orderMode === 'subscription' && state.subscriptionPlan;
  const usedCredits = state.cart.reduce((sum, item) => sum + (item.isCreditBased ? item.quantity : 0), 0);

  const toggleTag = (tag: string) => setActiveTags(prev => prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]);

  const filteredMeals = useMemo(() => state.adminMeals.filter(meal => {
    if (!meal.available) return false;
    if (activeCategory !== 'all' && meal.category !== activeCategory) return false;
    if (activeTags.length > 0 && !activeTags.some(t => meal.tags.includes(t))) return false;
    if (searchQuery && !meal.name.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    return true;
  }), [activeCategory, activeTags, searchQuery, state.adminMeals]);

  return (
    <div className="pt-[72px] min-h-screen" style={{ background: '#FDF6F2' }}>
      {isSubscription && (
        <div className="sticky top-[72px] z-40 border-b" style={{ background: '#E8F0E8', borderColor: `rgba(30,63,48,0.15)` }}>
          <div className="max-w-[1400px] mx-auto px-5 sm:px-8 lg:px-12 py-3 flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm font-medium" style={{ color: '#1A1A1A', fontFamily: "'Montserrat', sans-serif" }}>
              <span>🎫</span>
              <span>{state.subscriptionPlan!.mealCount} {t('nav_packages')}</span>
              <span style={{ color: '#8A8A8A' }}>·</span>
              <span style={{ color: '#4A4A4A' }}>{t('menu_credits_used')} {usedCredits}</span>
            </div>
            <span className="text-sm font-semibold" style={{ color: green, fontFamily: "'Montserrat', sans-serif" }}>
              {state.creditsRemaining} {t('menu_credits')}
            </span>
          </div>
        </div>
      )}

      <div className={`sticky ${isSubscription ? 'top-[112px]' : 'top-[72px]'} z-30 border-b`}
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
                {cat.emoji} {cat.label}
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
                {activeTags.includes(tag.key) && '✓ '}{tag.label}
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

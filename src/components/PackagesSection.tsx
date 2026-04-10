import { Check, ArrowRight, Leaf } from 'lucide-react';
import { useApp } from '../store';
import { useT } from '../i18n';

interface Props { fullPage?: boolean; }

const green = '#1E3F30';

export default function PackagesSection({ fullPage }: Props) {
  const { state, dispatch } = useApp();
  const t = useT(state.lang);

  return (
    <section className={`${fullPage ? 'pt-28 pb-20' : 'py-20'} md:py-28`} style={{ background: '#FDF6F2' }}>
      <div className="max-w-[1400px] mx-auto px-5 sm:px-8 lg:px-12">
        {/* Closed Message Banner */}
        {!state.businessSettings.isAcceptingOrders && (
          <div className="mb-8 p-4 rounded-xl text-center" style={{ background: '#FEE2E2', border: '1.5px solid #C0392B' }}>
            <p style={{ color: '#C0392B', fontFamily: "'Montserrat', sans-serif", fontSize: '14px', fontWeight: 600 }}>
              {state.businessSettings.closedMessage}
            </p>
          </div>
        )}

        <div className="text-center mb-14 md:mb-18">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full mb-5 text-xs font-medium tracking-widest uppercase"
            style={{ background: '#E8F0E8', color: green, fontFamily: "'Montserrat', sans-serif" }}>
            <Leaf size={12} />{t('pkg_badge')}
          </div>
          <h1 className="text-3xl md:text-5xl font-bold mb-4 leading-tight"
            style={{ fontFamily: "'Montserrat', sans-serif", fontWeight: 700, color: '#1A1A1A', letterSpacing: '-0.02em' }}>
            {t('pkg_title')}<br />
            <span style={{ color: green }}>{t('pkg_title_em')}</span>
          </h1>
          <p className="text-base md:text-lg max-w-xl mx-auto leading-relaxed"
            style={{ color: '#8A8A8A', fontFamily: "'Montserrat', sans-serif", fontWeight: 400 }}>
            {t('pkg_subtitle')}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 max-w-5xl mx-auto">
          {state.adminPlans.map(plan => (
            <div key={plan.id} className="relative rounded-3xl p-7 md:p-8 transition-all duration-300 hover:-translate-y-1"
              style={{
                background: plan.popular ? green : '#FFFFFF',
                border: plan.popular ? 'none' : '1.5px solid #E5DDD0',
                boxShadow: plan.popular ? '0 20px 60px rgba(30,63,48,0.25)' : '0 4px 20px rgba(0,0,0,0.04)',
              }}>
              {/* Badges Localized */}
              {(plan.enBadge || plan.ruBadge || plan.badge) && (
                <div className="absolute -top-3.5 left-1/2 -translate-x-1/2">
                  <span className="px-4 py-1.5 text-xs font-semibold rounded-full uppercase tracking-wider"
                    style={{ background: plan.popular ? '#C8A97A' : green, color: '#fff', fontFamily: "'Montserrat', sans-serif" }}>
                    {state.lang === 'en' ? (plan.enBadge || plan.badge) : state.lang === 'ru' ? (plan.ruBadge || plan.badge) : plan.badge}
                  </span>
                </div>
              )}
              <div className="text-center mb-7 pt-1">
                <h3 className="text-xl md:text-2xl font-bold mb-2"
                  style={{ fontFamily: "'Montserrat', sans-serif", fontWeight: 700, color: plan.popular ? '#FFFFFF' : '#1A1A1A' }}>
                  {state.lang === 'en' ? (plan.enName || plan.name) : state.lang === 'ru' ? (plan.ruName || plan.name) : plan.name}
                </h3>
                <p className="text-sm" style={{ color: plan.popular ? 'rgba(255,255,255,0.6)' : '#8A8A8A', fontFamily: "'Montserrat', sans-serif" }}>
                  {plan.mealCount} {t('pkg_meals_per')}
                </p>
              </div>
              <div className="text-center mb-7">
                <div className="text-4xl md:text-5xl font-bold"
                  style={{ fontFamily: "'Montserrat', sans-serif", fontWeight: 700, color: plan.popular ? '#C8A97A' : '#1A1A1A' }}>
                  ₺{plan.price.toLocaleString('tr-TR')}
                </div>
                <p className="text-xs mt-1.5" style={{ color: plan.popular ? 'rgba(255,255,255,0.5)' : '#8A8A8A', fontFamily: "'Montserrat', sans-serif" }}>
                  ₺{plan.pricePerMeal} {t('pkg_per_meal')}
                </p>
              </div>
              <ul className="space-y-3 mb-8">
                {(state.lang === 'en' && plan.enFeatures ? plan.enFeatures : state.lang === 'ru' && plan.ruFeatures ? plan.ruFeatures : plan.features).map((feature, i) => (
                  <li key={i} className="flex items-center gap-3 text-sm"
                    style={{ color: plan.popular ? 'rgba(255,255,255,0.85)' : '#4A4A4A', fontFamily: "'Montserrat', sans-serif" }}>
                    <div className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0"
                      style={{ background: plan.popular ? 'rgba(200,169,122,0.3)' : '#E8F0E8' }}>
                      <Check size={11} style={{ color: plan.popular ? '#C8A97A' : green }} />
                    </div>
                    {feature}
                  </li>
                ))}
              </ul>
              <button
                onClick={() => !state.businessSettings.isAcceptingOrders || dispatch({ type: 'SELECT_PLAN', payload: plan })}
                disabled={!state.businessSettings.isAcceptingOrders}
                className="w-full py-3.5 rounded-full text-sm font-semibold transition-all duration-300 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                style={{ background: state.businessSettings.isAcceptingOrders ? (plan.popular ? '#C8A97A' : green) : '#CCC', color: '#fff', fontFamily: "'Montserrat', sans-serif" }}>
                {state.businessSettings.isAcceptingOrders ? (
                  <>
                    {t('pkg_select')} <ArrowRight size={16} />
                  </>
                ) : (
                  'Şu an kapalı'
                )}
              </button>
            </div>
          ))}
        </div>

        </div>
      </div>
    </section>
  );
}

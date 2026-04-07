import { CheckCircle, ArrowRight } from 'lucide-react';
import { useApp } from '../store';
import { useT } from '../i18n';

const green = '#1E3F30';

export default function SuccessPage() {
  const { state, dispatch } = useApp();
  const t = useT(state.lang);

  // The most recent order is always first in the array after COMPLETE_ORDER
  const lastOrder = state.orders[0];
  const planName = lastOrder?.subscriptionPlan?.name;

  return (
    <div className="min-h-screen flex items-center justify-center p-6" style={{ background: '#FDF6F2' }}>
      <div className="text-center max-w-md">
        <div className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6 animate-scale-in" style={{ background: '#E8F0E8' }}>
          <CheckCircle size={40} style={{ color: green }} />
        </div>
        <h1 className="mb-3" style={{ fontFamily: "'Montserrat', sans-serif", fontSize: '2rem', fontWeight: 700, color: '#1A1A1A' }}>{t('success_title')}</h1>
        {state.orderNumber && (
          <p className="text-sm mb-2 font-medium" style={{ color: green, fontFamily: "'Montserrat', sans-serif" }}>
            {t('success_order')} <strong>{state.orderNumber}</strong>
          </p>
        )}
        {planName && (
          <p className="text-sm mb-2 font-medium" style={{ color: '#4A4A4A', fontFamily: "'Montserrat', sans-serif" }}>
            📦 {t('success_plan')} <strong>{planName}</strong>
          </p>
        )}
        <p className="mb-8" style={{ color: '#8A8A8A', fontFamily: "'Montserrat', sans-serif", lineHeight: '1.6' }}>{t('success_sub')}</p>
        <button onClick={() => dispatch({ type: 'SET_PAGE', payload: 'packages' })}
          className="inline-flex items-center gap-2 px-6 py-3.5 rounded-full text-sm font-semibold cursor-pointer transition-all hover:opacity-85"
          style={{ background: green, color: '#fff', fontFamily: "'Montserrat', sans-serif" }}>
          {t('success_home')} <ArrowRight size={16} />
        </button>
      </div>
    </div>
  );
}

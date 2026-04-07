import { CheckCircle, ArrowRight } from 'lucide-react';
import { useApp } from '../store';
import { useT } from '../i18n';

export default function SuccessPage() {
  const { state, dispatch } = useApp();
  const t = useT(state.lang);
  return (
    <div className="min-h-screen flex items-center justify-center p-6" style={{ background: '#FAF7F2' }}>
      <div className="text-center max-w-md">
        <div className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6 animate-scale-in" style={{ background: '#E8F0E8' }}>
          <CheckCircle size={40} style={{ color: '#2C5F2E' }} />
        </div>
        <h1 className="mb-3" style={{ fontFamily: "'Playfair Display', serif", fontSize: '2rem', fontWeight: 700, color: '#1A1A1A' }}>{t('success_title')}</h1>
        {state.orderNumber && (
          <p className="text-sm mb-2 font-medium" style={{ color: '#2C5F2E', fontFamily: "'DM Sans', sans-serif" }}>
            {t('success_order')} <strong>{state.orderNumber}</strong>
          </p>
        )}
        <p className="mb-8" style={{ color: '#8A8A8A', fontFamily: "'DM Sans', sans-serif", lineHeight: '1.6' }}>{t('success_sub')}</p>
        <button onClick={() => dispatch({ type: 'SET_PAGE', payload: 'packages' })}
          className="inline-flex items-center gap-2 px-6 py-3.5 rounded-2xl text-sm font-semibold cursor-pointer transition-all hover:opacity-85"
          style={{ background: '#2C5F2E', color: '#fff', fontFamily: "'DM Sans', sans-serif" }}>
          {t('success_home')} <ArrowRight size={16} />
        </button>
      </div>
    </div>
  );
}

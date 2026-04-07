import { Leaf } from 'lucide-react';
import { useApp } from '../store';
import { useT } from '../i18n';

export default function Footer() {
  const { state, dispatch } = useApp();
  const t = useT(state.lang);
  return (
    <footer className="border-t py-10 px-5" style={{ borderColor: '#E5DDD0', background: '#FAF7F2' }}>
      <div className="max-w-[1400px] mx-auto sm:px-8 lg:px-12 flex flex-col sm:flex-row items-center justify-between gap-6">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: '#2C5F2E' }}>
            <Leaf size={14} style={{ color: '#C8A97A' }} />
          </div>
          <span style={{ fontFamily: "'Playfair Display', serif", fontWeight: 600, color: '#1A1A1A', fontSize: '1rem' }}>
            Food<span style={{ color: '#2C5F2E' }}>ForFit</span>
          </span>
        </div>
        <div className="flex items-center gap-6">
          {([['packages', t('nav_packages')], ['menu', t('nav_menu')]] as const).map(([page, label]) => (
            <button key={page} onClick={() => dispatch({ type: 'SET_PAGE', payload: page })}
              className="text-sm cursor-pointer hover:opacity-70 transition-opacity" style={{ color: '#8A8A8A', fontFamily: "'DM Sans', sans-serif" }}>
              {label}
            </button>
          ))}
        </div>
        <p className="text-xs" style={{ color: '#8A8A8A', fontFamily: "'DM Sans', sans-serif" }}>{t('footer_rights')}</p>
      </div>
    </footer>
  );
}

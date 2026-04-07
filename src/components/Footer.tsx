import { Leaf } from 'lucide-react';
import { useApp } from '../store';
import { useT } from '../i18n';

const green = '#1E3F30';

export default function Footer() {
  const { state, dispatch } = useApp();
  const t = useT(state.lang);
  return (
    <footer className="border-t py-10 px-5" style={{ borderColor: '#E5DDD0', borderTopWidth: '1px', background: '#FDF6F2' }}>
      <div className="max-w-[1400px] mx-auto sm:px-8 lg:px-12 flex flex-col sm:flex-row items-center justify-between gap-6">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: green }}>
            <Leaf size={14} style={{ color: '#C8A97A' }} />
          </div>
          <span style={{ fontFamily: "'Montserrat', sans-serif", fontWeight: 800, color: '#1A1A1A', fontSize: '1rem' }}>
            Food<span style={{ color: green }}>ForFit</span>
          </span>
        </div>
        <div className="flex items-center gap-6">
          {([['packages', t('nav_packages')], ['menu', t('nav_menu')]] as const).map(([page, label]) => (
            <button key={page} onClick={() => dispatch({ type: 'SET_PAGE', payload: page })}
              className="text-sm cursor-pointer transition-colors"
              style={{ color: '#8A8A8A', fontFamily: "'Montserrat', sans-serif" }}
              onMouseEnter={e => (e.currentTarget as HTMLButtonElement).style.color = green}
              onMouseLeave={e => (e.currentTarget as HTMLButtonElement).style.color = '#8A8A8A'}>
              {label}
            </button>
          ))}
        </div>
        <p className="text-xs" style={{ color: '#8A8A8A', fontFamily: "'Montserrat', sans-serif" }}>{t('footer_rights')}</p>
      </div>
    </footer>
  );
}

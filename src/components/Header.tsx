import { useState, useEffect } from 'react';
import { Menu, X, ShoppingCart, Globe } from 'lucide-react';
import { useApp, useCartItemCount } from '../store';
import { useT } from '../i18n';
import type { Lang } from '../i18n';

const LANGS: { code: Lang; label: string; flag: string }[] = [
  { code: 'tr', label: 'TR', flag: '🇹🇷' },
  { code: 'en', label: 'EN', flag: '🇬🇧' },
  { code: 'ru', label: 'RU', flag: '🇷🇺' },
];

const green = '#1E3F30';

export default function Header() {
  const { state, dispatch } = useApp();
  const t = useT(state.lang);
  const [scrolled, setScrolled] = useState(false);
  const [langOpen, setLangOpen] = useState(false);
  const itemCount = useCartItemCount(state.cart);

  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 10);
    window.addEventListener('scroll', fn);
    return () => window.removeEventListener('scroll', fn);
  }, []);

  const navLinks = [
    { page: 'packages' as const, label: t('nav_packages') },
    { page: 'menu' as const, label: t('nav_menu') },
    { page: 'track' as const, label: t('nav_track') },
  ];

  const isActive = (p: string) => state.currentPage === p || (state.currentPage === 'home' && p === 'packages');

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500`}
      style={{
        height: 72,
        background: '#FDF6F2',
        backdropFilter: 'blur(12px)',
        borderBottom: `3px solid ${green}`,
        boxShadow: scrolled ? '0 2px 20px rgba(0,0,0,0.06)' : 'none',
      }}
    >
      <div className="max-w-[1400px] mx-auto px-5 sm:px-8 lg:px-12 h-full flex items-center justify-between">
        {/* Logo */}
        <button onClick={() => dispatch({ type: 'SET_PAGE', payload: 'packages' })} className="flex items-center gap-3 cursor-pointer hover:opacity-75 transition-opacity">
          <div className="w-9 h-9 rounded-lg flex items-center justify-center" style={{ background: green }}>
            <span style={{ color: '#C8A97A', fontFamily: "'Montserrat', sans-serif", fontWeight: 800, fontSize: '1.1rem' }}>F</span>
          </div>
          <span style={{ fontFamily: "'Montserrat', sans-serif", fontWeight: 800, fontSize: '1.2rem', color: '#1A1A1A' }}>
            Food<span style={{ color: green }}>ForFit</span>
          </span>
        </button>

        {/* Desktop Nav */}
        <nav className="hidden md:flex items-center gap-8">
          {navLinks.map(link => (
            <button key={link.page} onClick={() => dispatch({ type: 'SET_PAGE', payload: link.page })}
              className="text-sm font-medium tracking-wide transition-colors cursor-pointer"
              style={{ color: isActive(link.page) ? green : '#4A4A4A', fontFamily: "'Montserrat', sans-serif", fontWeight: isActive(link.page) ? 700 : 500 }}>
              {link.label}
            </button>
          ))}
        </nav>

        {/* Right */}
        <div className="flex items-center gap-2">
          {/* Language Switcher */}
          <div className="relative">
            <button
              onClick={() => setLangOpen(!langOpen)}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl transition-colors cursor-pointer hover:opacity-75"
              style={{ fontFamily: "'Montserrat', sans-serif", fontSize: '13px', fontWeight: 500, color: '#4A4A4A' }}
            >
              <Globe size={15} style={{ color: '#8A8A8A' }} />
              {LANGS.find(l => l.code === state.lang)?.flag} {state.lang.toUpperCase()}
            </button>
            {langOpen && (
              <div
                className="absolute right-0 top-full mt-1 rounded-2xl overflow-hidden py-1 animate-fade-in-up"
                style={{ background: '#FFFFFF', border: '1.5px solid #E5DDD0', boxShadow: '0 8px 30px rgba(0,0,0,0.1)', minWidth: 110 }}
              >
                {LANGS.map(l => (
                  <button key={l.code} onClick={() => { dispatch({ type: 'SET_LANG', payload: l.code }); setLangOpen(false); }}
                    className="w-full flex items-center gap-2 px-4 py-2.5 text-sm transition-colors cursor-pointer"
                    style={{
                      background: state.lang === l.code ? '#E8F0E8' : 'transparent',
                      color: state.lang === l.code ? green : '#4A4A4A',
                      fontFamily: "'Montserrat', sans-serif", fontWeight: state.lang === l.code ? 600 : 400,
                    }}
                  >
                    {l.flag} {l.label}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Cart */}
          <button onClick={() => dispatch({ type: 'TOGGLE_CART', payload: true })}
            className="relative p-2.5 rounded-xl transition-colors cursor-pointer hover:opacity-75"
            aria-label={t('nav_cart')}
          >
            <ShoppingCart size={20} style={{ color: '#1A1A1A' }} />
            {itemCount > 0 && (
              <span className="absolute -top-1 -right-1 w-5 h-5 text-white text-xs font-bold rounded-full flex items-center justify-center"
                style={{ background: green, fontFamily: "'Montserrat', sans-serif" }}>
                {itemCount}
              </span>
            )}
          </button>

          {/* Mobile menu */}
          <button className="md:hidden p-2 rounded-xl cursor-pointer hover:opacity-75"
            onClick={() => dispatch({ type: 'TOGGLE_MOBILE_MENU' })}>
            {state.mobileMenuOpen ? <X size={22} style={{ color: '#1A1A1A' }} /> : <Menu size={22} style={{ color: '#1A1A1A' }} />}
          </button>
        </div>
      </div>

      {/* Mobile dropdown */}
      {state.mobileMenuOpen && (
        <div className="md:hidden border-t animate-fade-in-up" style={{ background: '#FDF6F2', borderColor: '#E5DDD0' }}>
          <nav className="px-5 py-4 flex flex-col gap-1">
            {navLinks.map(link => (
              <button key={link.page} onClick={() => dispatch({ type: 'SET_PAGE', payload: link.page })}
                className="text-left px-4 py-3 rounded-xl text-sm font-medium transition-colors cursor-pointer"
                style={{ background: isActive(link.page) ? '#E8F0E8' : 'transparent', color: isActive(link.page) ? green : '#4A4A4A', fontFamily: "'Montserrat', sans-serif" }}>
                {link.label}
              </button>
            ))}
          </nav>
        </div>
      )}
    </header>
  );
}

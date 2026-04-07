import { X, Plus, Minus, Trash2, ShoppingBag } from 'lucide-react';
import { useApp, useCartTotal, useCartItemCount } from '../store';
import { useT } from '../i18n';
import { getMealGradient, getMealEmoji } from '../data';

const FREE_DELIVERY_THRESHOLD = 800;
const DELIVERY_FEE = 50;

export default function CartDrawer() {
  const { state, dispatch } = useApp();
  const t = useT(state.lang);
  const total = useCartTotal(state.cart);
  const itemCount = useCartItemCount(state.cart);
  const deliveryFee = total >= FREE_DELIVERY_THRESHOLD ? 0 : DELIVERY_FEE;
  const remaining = Math.max(0, FREE_DELIVERY_THRESHOLD - total);
  const progress = Math.min(100, (total / FREE_DELIVERY_THRESHOLD) * 100);

  if (!state.cartOpen) return null;

  return (
    <>
      <div className="fixed inset-0 z-50" style={{ background: 'rgba(26,26,26,0.5)', backdropFilter: 'blur(4px)' }}
        onClick={() => dispatch({ type: 'TOGGLE_CART', payload: false })} />
      <div className="fixed right-0 top-0 bottom-0 w-full sm:w-[440px] z-50 flex flex-col"
        style={{ background: '#FAF7F2', animation: 'slideInRight 0.3s ease', boxShadow: '-8px 0 40px rgba(0,0,0,0.12)' }}>
        <div className="flex items-center justify-between px-6 py-5 border-b" style={{ borderColor: '#E5DDD0' }}>
          <div>
            <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: '1.2rem', color: '#1A1A1A', fontWeight: 600 }}>{t('cart_title')}</h2>
            <p className="text-xs mt-0.5" style={{ color: '#8A8A8A', fontFamily: "'DM Sans', sans-serif" }}>{itemCount} {t('cart_items')}</p>
          </div>
          <button onClick={() => dispatch({ type: 'TOGGLE_CART', payload: false })}
            className="w-9 h-9 rounded-2xl flex items-center justify-center cursor-pointer hover:opacity-70" style={{ background: '#E5DDD0' }}>
            <X size={18} style={{ color: '#1A1A1A' }} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-4">
          {state.cart.length === 0 ? (
            <div className="text-center py-16">
              <ShoppingBag size={40} style={{ color: '#C8A97A', margin: '0 auto 16px' }} />
              <p className="font-medium mb-1" style={{ fontFamily: "'Playfair Display', serif", color: '#1A1A1A' }}>{t('cart_empty')}</p>
              <p className="text-sm mb-5" style={{ color: '#8A8A8A', fontFamily: "'DM Sans', sans-serif" }}>{t('cart_empty_sub')}</p>
              <button onClick={() => { dispatch({ type: 'TOGGLE_CART', payload: false }); dispatch({ type: 'SET_PAGE', payload: 'menu' }); }}
                className="text-sm font-medium underline cursor-pointer hover:opacity-70" style={{ color: '#2C5F2E', fontFamily: "'DM Sans', sans-serif" }}>
                {t('cart_browse')}
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {!state.subscriptionPlan && remaining > 0 && (
                <div className="p-3.5 rounded-2xl mb-2" style={{ background: '#FFFDF9', border: '1px solid #E5DDD0' }}>
                  <p className="text-xs mb-2" style={{ color: '#4A4A4A', fontFamily: "'DM Sans', sans-serif" }}>₺{remaining} {t('cart_free_delivery')}</p>
                  <div className="h-1.5 rounded-full overflow-hidden" style={{ background: '#E5DDD0' }}>
                    <div className="h-full rounded-full transition-all duration-500" style={{ width: `${progress}%`, background: '#2C5F2E' }} />
                  </div>
                </div>
              )}
              {state.cart.map(item => (
                <div key={item.meal.id} className="flex items-center gap-3 p-3.5 rounded-2xl"
                  style={{ background: '#FFFDF9', border: '1px solid #E5DDD0' }}>
                  <div className="w-14 h-14 rounded-xl flex items-center justify-center text-2xl flex-shrink-0"
                    style={{ background: getMealGradient(item.meal) }}>
                    {getMealEmoji(item.meal)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="text-sm font-semibold truncate" style={{ fontFamily: "'DM Sans', sans-serif", color: '#1A1A1A' }}>{item.meal.name}</h4>
                    <p className="text-xs mt-0.5" style={{ color: '#8A8A8A', fontFamily: "'DM Sans', sans-serif" }}>
                      {item.isCreditBased ? `${item.quantity} ${t('meal_credit')}` : `₺${item.meal.price}`}
                    </p>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <button onClick={() => dispatch({ type: 'UPDATE_QUANTITY', payload: { mealId: item.meal.id, quantity: item.quantity - 1 } })}
                      className="w-7 h-7 rounded-lg flex items-center justify-center cursor-pointer" style={{ background: '#F5ECD7' }}>
                      {item.quantity === 1 ? <Trash2 size={12} style={{ color: '#C0392B' }} /> : <Minus size={12} style={{ color: '#2C5F2E' }} />}
                    </button>
                    <span className="w-5 text-center text-sm font-semibold" style={{ fontFamily: "'DM Sans', sans-serif", color: '#1A1A1A' }}>{item.quantity}</span>
                    <button onClick={() => dispatch({ type: 'ADD_TO_CART', payload: { meal: item.meal, isCreditBased: item.isCreditBased } })}
                      className="w-7 h-7 rounded-lg flex items-center justify-center cursor-pointer" style={{ background: '#2C5F2E', color: '#fff' }}>
                      <Plus size={12} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {state.cart.length > 0 && (
          <div className="px-6 py-5 border-t" style={{ borderColor: '#E5DDD0' }}>
            {!state.subscriptionPlan && (
              <div className="space-y-2 mb-4">
                <div className="flex justify-between text-sm" style={{ fontFamily: "'DM Sans', sans-serif" }}>
                  <span style={{ color: '#8A8A8A' }}>{t('cart_subtotal')}</span>
                  <span style={{ color: '#1A1A1A' }}>₺{total.toLocaleString('tr-TR')}</span>
                </div>
                <div className="flex justify-between text-sm" style={{ fontFamily: "'DM Sans', sans-serif" }}>
                  <span style={{ color: '#8A8A8A' }}>{t('cart_delivery')}</span>
                  <span style={{ color: deliveryFee === 0 ? '#2C5F2E' : '#1A1A1A' }}>{deliveryFee === 0 ? t('cart_free') : `₺${deliveryFee}`}</span>
                </div>
                <div className="flex justify-between font-semibold pt-2 border-t" style={{ borderColor: '#E5DDD0' }}>
                  <span style={{ fontFamily: "'Playfair Display', serif", color: '#1A1A1A', fontSize: '1rem' }}>{t('cart_total')}</span>
                  <span style={{ fontFamily: "'Playfair Display', serif", color: '#1A1A1A', fontSize: '1rem' }}>₺{(total + deliveryFee).toLocaleString('tr-TR')}</span>
                </div>
              </div>
            )}
            <button onClick={() => dispatch({ type: 'TOGGLE_CHECKOUT', payload: true })}
              className="w-full py-3.5 rounded-2xl text-sm font-semibold cursor-pointer"
              style={{ background: '#2C5F2E', color: '#fff', fontFamily: "'DM Sans', sans-serif" }}>
              {t('cart_checkout')}
            </button>
          </div>
        )}
      </div>
    </>
  );
}

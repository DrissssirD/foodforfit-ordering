import { getMealGradient, getMealEmoji } from '../data';
import { useState } from 'react';
import { ArrowLeft, Package, UtensilsCrossed, ShoppingBag, Plus, Trash2, Edit3, Check, X, Eye, EyeOff } from 'lucide-react';
import { useApp } from '../store';
import { useT } from '../i18n';
import type { Meal, SubscriptionPlan, Order } from '../types';

const ADMIN_PASSWORD = 'admin123';
const green = '#1E3F30';
const gold = '#C8A97A';

type AdminTab = 'orders' | 'menu' | 'packages';

const STATUS_COLORS: Record<Order['status'], { bg: string; color: string; label: string }> = {
  pending:   { bg: '#FEF9C3', color: '#854D0E', label: 'Bekliyor' },
  preparing: { bg: '#DBEAFE', color: '#1E40AF', label: 'Hazırlanıyor' },
  ready:     { bg: '#D1FAE5', color: '#065F46', label: 'Hazır' },
  delivered: { bg: '#E8F0E8', color: '#1E3F30', label: 'Teslim Edildi' },
  cancelled: { bg: '#FEE2E2', color: '#991B1B', label: 'İptal' },
};

// ─────────────────────────────────────────
// LOGIN SCREEN
// ─────────────────────────────────────────
function AdminLogin({ onLogin }: { onLogin: () => void }) {
  const [pass, setPass] = useState('');
  const [error, setError] = useState(false);
  const [show, setShow] = useState(false);

  const attempt = () => {
    if (pass === ADMIN_PASSWORD) onLogin();
    else setError(true);
  };

  return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: '#FDF6F2' }}>
      <div className="w-full max-w-sm p-8 rounded-3xl" style={{ background: '#FFFFFF', border: '1.5px solid #E5DDD0', boxShadow: '0 8px 40px rgba(0,0,0,0.08)' }}>
        <div className="text-center mb-8">
          <div className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-4" style={{ background: green }}>
            <span style={{ color: gold, fontFamily: "'Montserrat', sans-serif", fontWeight: 800, fontSize: '1.5rem' }}>F</span>
          </div>
          <h1 style={{ fontFamily: "'Montserrat', sans-serif", fontWeight: 700, fontSize: '1.4rem', color: '#1A1A1A' }}>Yönetim Paneli</h1>
          <p style={{ fontFamily: "'Montserrat', sans-serif", fontSize: '13px', color: '#8A8A8A', marginTop: '4px' }}>FoodForFit işletme girişi</p>
        </div>
        <div className="space-y-4">
          <div className="relative">
            <input
              type={show ? 'text' : 'password'}
              placeholder="Şifre"
              value={pass}
              onChange={e => { setPass(e.target.value); setError(false); }}
              onKeyDown={e => e.key === 'Enter' && attempt()}
              className="w-full px-4 py-3 rounded-2xl text-sm focus:outline-none"
              style={{ background: '#FDF6F2', border: `1.5px solid ${error ? '#C0392B' : '#E5DDD0'}`, fontFamily: "'Montserrat', sans-serif", color: '#1A1A1A' }}
            />
            <button onClick={() => setShow(!show)} className="absolute right-3 top-1/2 -translate-y-1/2 cursor-pointer" style={{ color: '#8A8A8A' }}>
              {show ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
          {error && (
            <p style={{ color: '#C0392B', fontSize: '12px', fontFamily: "'Montserrat', sans-serif" }}>Yanlış şifre. Tekrar deneyin.</p>
          )}
          <button
            onClick={attempt}
            className="w-full py-3 rounded-full text-sm font-semibold cursor-pointer"
            style={{ background: green, color: '#fff', fontFamily: "'Montserrat', sans-serif" }}
          >
            Giriş Yap
          </button>
        </div>
        <p className="text-center mt-4 text-xs" style={{ color: '#8A8A8A', fontFamily: "'Montserrat', sans-serif" }}>
          Demo şifre: admin123
        </p>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────
// ORDERS TAB
// ─────────────────────────────────────────
function OrdersTab() {
  const { state, dispatch } = useApp();
  const statuses: Order['status'][] = ['pending', 'preparing', 'ready', 'delivered', 'cancelled'];

  return (
    <div>
      <h2 style={{ fontFamily: "'Montserrat', sans-serif", fontWeight: 700, fontSize: '1.2rem', color: '#1A1A1A', marginBottom: '20px' }}>
        Siparişler
      </h2>

      {state.orders.length === 0 && (
        <div className="text-center py-16">
          <ShoppingBag size={36} style={{ color: '#E5DDD0', margin: '0 auto 12px' }} />
          <p style={{ color: '#8A8A8A', fontFamily: "'Montserrat', sans-serif" }}>Henüz sipariş yok</p>
        </div>
      )}

      <div className="space-y-4">
        {state.orders.map(order => {
          const sc = STATUS_COLORS[order.status];
          return (
            <div key={order.id} className="p-5 rounded-xl" style={{ background: '#FFFFFF', border: '1.5px solid #E5DDD0' }}>
              {/* Top row: order number + status + total */}
              <div className="flex flex-wrap items-start justify-between gap-3 mb-2">
                <div className="flex items-center gap-3 flex-wrap">
                  <span style={{ fontFamily: "'Montserrat', sans-serif", fontWeight: 700, color: '#1A1A1A', fontSize: '1rem' }}>
                    {order.orderNumber}
                  </span>
                  <span className="px-2.5 py-1 rounded-full text-xs font-semibold"
                    style={{ background: sc.bg, color: sc.color, fontFamily: "'Montserrat', sans-serif" }}>
                    {sc.label}
                  </span>
                </div>
                <div className="text-right">
                  <p style={{ fontFamily: "'Montserrat', sans-serif", fontWeight: 700, fontSize: '1.1rem', color: '#1A1A1A' }}>
                    ₺{order.total.toLocaleString('tr-TR')}
                  </p>
                  <p style={{ fontFamily: "'Montserrat', sans-serif", fontSize: '11px', color: '#8A8A8A', marginTop: '2px' }}>
                    {new Date(order.createdAt).toLocaleString('tr-TR')}
                  </p>
                </div>
              </div>

              {/* Customer info */}
              <p style={{ fontFamily: "'Montserrat', sans-serif", fontSize: '14px', color: '#4A4A4A', marginBottom: '2px' }}>
                {order.customerName} · {order.customerPhone}
              </p>
              <p style={{ fontFamily: "'Montserrat', sans-serif", fontSize: '12px', color: '#8A8A8A', marginBottom: '2px' }}>
                {order.deliveryType === 'teslimat' ? 'Teslimat' : 'Gel-Al'}
                {order.district ? ` · ${order.district}` : ''} · {order.deliveryTime}
              </p>
              {order.subscriptionPlan && (
                <p style={{ fontFamily: "'Montserrat', sans-serif", fontSize: '12px', color: green, marginBottom: '2px' }}>
                  📦 {order.subscriptionPlan.name}
                </p>
              )}

              {/* Status buttons */}
              <div className="flex flex-wrap gap-2 mt-4 pt-4 border-t" style={{ borderColor: '#F0EDE8' }}>
                {statuses.map(s => {
                  const sc2 = STATUS_COLORS[s];
                  const isActive = order.status === s;
                  return (
                    <button
                      key={s}
                      onClick={() => dispatch({ type: 'UPDATE_ORDER_STATUS', payload: { id: order.id, status: s } })}
                      className="px-3 py-1.5 rounded-xl text-xs font-medium cursor-pointer transition-all"
                      style={{
                        background: isActive ? sc2.bg : '#F5F5F5',
                        color: isActive ? sc2.color : '#8A8A8A',
                        border: `1px solid ${isActive ? sc2.color + '40' : 'transparent'}`,
                        fontFamily: "'Montserrat', sans-serif",
                        fontWeight: isActive ? 600 : 400,
                      }}
                    >
                      {sc2.label}
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────
// MEAL FORM
// ─────────────────────────────────────────
const emptyMeal = (): Meal => ({
  id: '', name: '', description: '', category: 'ana', imageUrl: '',
  price: 0, calories: 0, protein: 0, carbs: 0, fat: 0, tags: [], available: true, featured: false,
});

function MealForm({ meal, onSave, onCancel }: { meal: Meal; onSave: (m: Meal) => void; onCancel: () => void }) {
  const [form, setForm] = useState<Meal>({ ...meal });
  const f = (k: keyof Meal, v: any) => setForm(p => ({ ...p, [k]: v }));

  const iStyle = {
    width: '100%', padding: '10px 14px', borderRadius: '12px',
    border: '1.5px solid #E5DDD0', background: '#FDF6F2',
    fontFamily: "'Montserrat', sans-serif", fontSize: '13px', color: '#1A1A1A',
  };
  const lStyle = {
    fontSize: '11px', fontWeight: 600, color: '#8A8A8A', fontFamily: "'Montserrat', sans-serif",
    textTransform: 'uppercase' as const, letterSpacing: '0.05em', display: 'block', marginBottom: '5px',
  };

  return (
    <div className="p-5 rounded-2xl mb-4" style={{ background: '#F5ECD7', border: '1.5px solid #C8A97A' }}>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="sm:col-span-2">
          <label style={lStyle}>Öğün Adı</label>
          <input value={form.name} onChange={e => f('name', e.target.value)} style={iStyle} placeholder="Öğün adını girin" />
        </div>
        <div className="sm:col-span-2">
          <label style={lStyle}>Açıklama</label>
          <textarea value={form.description} onChange={e => f('description', e.target.value)} rows={2} style={{ ...iStyle, resize: 'none' }} placeholder="Kısa açıklama" />
        </div>
        <div>
          <label style={lStyle}>Kategori</label>
          <select value={form.category} onChange={e => f('category', e.target.value)} style={{ ...iStyle, cursor: 'pointer' }}>
            <option value="kahvalti">Kahvaltı</option>
            <option value="ana">Ana Öğün</option>
            <option value="kase">Kase</option>
            <option value="smoothie">Smoothie</option>
          </select>
        </div>
        <div>
          <label style={lStyle}>Fiyat (₺)</label>
          <input type="number" value={form.price} onChange={e => f('price', +e.target.value)} style={iStyle} min={0} />
        </div>
        <div>
          <label style={lStyle}>Kalori (kcal)</label>
          <input type="number" value={form.calories} onChange={e => f('calories', +e.target.value)} style={iStyle} min={0} />
        </div>
        <div>
          <label style={lStyle}>Protein (g)</label>
          <input type="number" value={form.protein} onChange={e => f('protein', +e.target.value)} style={iStyle} min={0} />
        </div>
        <div>
          <label style={lStyle}>Karbonhidrat (g)</label>
          <input type="number" value={form.carbs} onChange={e => f('carbs', +e.target.value)} style={iStyle} min={0} />
        </div>
        <div>
          <label style={lStyle}>Yağ (g)</label>
          <input type="number" value={form.fat} onChange={e => f('fat', +e.target.value)} style={iStyle} min={0} />
        </div>
        <div className="flex items-center gap-5 pt-2">
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" checked={form.available} onChange={e => f('available', e.target.checked)} style={{ accentColor: green }} />
            <span style={{ fontFamily: "'Montserrat', sans-serif", fontSize: '13px', color: '#4A4A4A' }}>Aktif</span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" checked={form.featured} onChange={e => f('featured', e.target.checked)} style={{ accentColor: green }} />
            <span style={{ fontFamily: "'Montserrat', sans-serif", fontSize: '13px', color: '#4A4A4A' }}>Öne Çıkan</span>
          </label>
        </div>
      </div>
      <div className="flex gap-3 mt-5">
        <button onClick={() => onSave(form)} className="flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-semibold cursor-pointer"
          style={{ background: green, color: '#fff', fontFamily: "'Montserrat', sans-serif" }}>
          <Check size={14} /> Kaydet
        </button>
        <button onClick={onCancel} className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium cursor-pointer"
          style={{ background: '#E5DDD0', color: '#4A4A4A', fontFamily: "'Montserrat', sans-serif" }}>
          <X size={14} /> İptal
        </button>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────
// MENU MANAGEMENT TAB
// ─────────────────────────────────────────
function MenuTab() {
  const { state, dispatch } = useApp();
  const [editing, setEditing] = useState<string | null>(null);
  const [adding, setAdding] = useState(false);

  return (
    <div>
      <div className="flex items-center justify-between mb-5">
        <h2 style={{ fontFamily: "'Montserrat', sans-serif", fontWeight: 700, fontSize: '1.2rem', color: '#1A1A1A' }}>
          Menü Yönetimi
        </h2>
        <button
          onClick={() => { setAdding(true); setEditing(null); }}
          className="flex items-center gap-2 px-4 py-2.5 rounded-full text-sm font-semibold cursor-pointer"
          style={{ background: green, color: '#fff', fontFamily: "'Montserrat', sans-serif" }}
        >
          <Plus size={14} /> Yeni Öğün Ekle
        </button>
      </div>

      {adding && (
        <MealForm
          meal={emptyMeal()}
          onSave={m => {
            dispatch({ type: 'ADD_MEAL', payload: { ...m, id: `meal-${Date.now()}` } });
            setAdding(false);
          }}
          onCancel={() => setAdding(false)}
        />
      )}

      <div className="space-y-3">
        {state.adminMeals.map(meal => (
          <div key={meal.id}>
            {editing === meal.id ? (
              <MealForm
                meal={meal}
                onSave={m => { dispatch({ type: 'UPDATE_MEAL', payload: m }); setEditing(null); }}
                onCancel={() => setEditing(null)}
              />
            ) : (
              <div
                className="flex items-center gap-4 p-4 rounded-xl"
                style={{ background: '#FFFFFF', border: '1.5px solid #E5DDD0', opacity: meal.available ? 1 : 0.6 }}
              >
                <div className="w-14 h-14 rounded-xl flex items-center justify-center text-2xl flex-shrink-0"
                  style={{ background: getMealGradient(meal) }}>
                  {getMealEmoji(meal)}
                </div>
                <div className="flex-1 min-w-0">
                  <p style={{ fontFamily: "'Montserrat', sans-serif", fontWeight: 600, color: '#1A1A1A', fontSize: '14px' }}>
                    {meal.name}
                  </p>
                  <p style={{ fontFamily: "'Montserrat', sans-serif", fontSize: '12px', color: '#8A8A8A', marginTop: '2px' }}>
                    ₺{meal.price} · {meal.calories} kcal · {meal.category}
                  </p>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <span className="px-2.5 py-1 rounded-lg text-xs font-medium"
                    style={{ background: meal.available ? '#E8F0E8' : '#F5F5F5', color: meal.available ? green : '#8A8A8A', fontFamily: "'Montserrat', sans-serif" }}>
                    {meal.available ? 'Aktif' : 'Gizli'}
                  </span>
                  <button onClick={() => { setEditing(meal.id); setAdding(false); }}
                    className="w-8 h-8 rounded-xl flex items-center justify-center cursor-pointer hover:opacity-70"
                    style={{ background: '#F5ECD7', color: gold }}>
                    <Edit3 size={14} />
                  </button>
                  <button
                    onClick={() => { if (window.confirm('Bu öğünü silmek istediğinizden emin misiniz?')) dispatch({ type: 'DELETE_MEAL', payload: meal.id }); }}
                    className="w-8 h-8 rounded-xl flex items-center justify-center cursor-pointer hover:opacity-70"
                    style={{ background: '#FEE2E2', color: '#C0392B' }}>
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────
// PLAN FORM
// ─────────────────────────────────────────
const emptyPlan = (): SubscriptionPlan => ({
  id: '', name: '', mealCount: 14, price: 0, pricePerMeal: 0, features: [''], popular: false,
});

function PlanForm({ plan, onSave, onCancel }: { plan: SubscriptionPlan; onSave: (p: SubscriptionPlan) => void; onCancel: () => void }) {
  const [form, setForm] = useState<SubscriptionPlan>({ ...plan, features: [...plan.features] });
  const f = (k: keyof SubscriptionPlan, v: any) => setForm(p => ({ ...p, [k]: v }));

  const iStyle = {
    width: '100%', padding: '10px 14px', borderRadius: '12px',
    border: '1.5px solid #E5DDD0', background: '#FDF6F2',
    fontFamily: "'Montserrat', sans-serif", fontSize: '13px', color: '#1A1A1A',
  };
  const lStyle = {
    fontSize: '11px', fontWeight: 600, color: '#8A8A8A', fontFamily: "'Montserrat', sans-serif",
    textTransform: 'uppercase' as const, letterSpacing: '0.05em', display: 'block', marginBottom: '5px',
  };

  return (
    <div className="p-5 rounded-2xl mb-4" style={{ background: '#F5ECD7', border: '1.5px solid #C8A97A' }}>
      <div className="grid grid-cols-2 gap-4">
        <div className="col-span-2">
          <label style={lStyle}>Paket Adı</label>
          <input value={form.name} onChange={e => f('name', e.target.value)} style={iStyle} placeholder="Ör: 14 Öğün Paketi" />
        </div>
        <div>
          <label style={lStyle}>Öğün Sayısı</label>
          <input type="number" value={form.mealCount} onChange={e => f('mealCount', +e.target.value)} style={iStyle} min={1} />
        </div>
        <div>
          <label style={lStyle}>Fiyat (₺)</label>
          <input type="number" value={form.price} onChange={e => f('price', +e.target.value)} style={iStyle} min={0} />
        </div>
        <div>
          <label style={lStyle}>Öğün Başı Fiyat (₺)</label>
          <input type="number" value={form.pricePerMeal} onChange={e => f('pricePerMeal', +e.target.value)} style={iStyle} min={0} />
        </div>
        <div>
          <label style={lStyle}>Rozet (opsiyonel)</label>
          <input value={form.badge ?? ''} onChange={e => f('badge', e.target.value || undefined)} style={iStyle} placeholder="Ör: En Popüler" />
        </div>
        <div className="col-span-2">
          <label style={lStyle}>Özellikler</label>
          {form.features.map((feat, i) => (
            <div key={i} className="flex gap-2 mb-2">
              <input
                value={feat}
                onChange={e => { const nf = [...form.features]; nf[i] = e.target.value; f('features', nf); }}
                style={{ ...iStyle, flex: 1 }}
                placeholder={`Özellik ${i + 1}`}
              />
              <button
                onClick={() => f('features', form.features.filter((_, j) => j !== i))}
                className="w-9 h-9 rounded-xl flex items-center justify-center cursor-pointer flex-shrink-0"
                style={{ background: '#FEE2E2', color: '#C0392B' }}
              >
                <Trash2 size={13} />
              </button>
            </div>
          ))}
          <button
            onClick={() => f('features', [...form.features, ''])}
            className="px-3 py-2 rounded-xl text-xs font-medium cursor-pointer mt-1"
            style={{ background: '#E8F0E8', color: green, fontFamily: "'Montserrat', sans-serif" }}
          >
            + Özellik Ekle
          </button>
        </div>
        <div className="col-span-2">
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" checked={!!form.popular} onChange={e => f('popular', e.target.checked)} style={{ accentColor: green }} />
            <span style={{ fontFamily: "'Montserrat', sans-serif", fontSize: '13px', color: '#4A4A4A' }}>
              Popüler (koyu arka plan)
            </span>
          </label>
        </div>
      </div>
      <div className="flex gap-3 mt-5">
        <button onClick={() => onSave(form)} className="flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-semibold cursor-pointer"
          style={{ background: green, color: '#fff', fontFamily: "'Montserrat', sans-serif" }}>
          <Check size={14} /> Kaydet
        </button>
        <button onClick={onCancel} className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium cursor-pointer"
          style={{ background: '#E5DDD0', color: '#4A4A4A', fontFamily: "'Montserrat', sans-serif" }}>
          <X size={14} /> İptal
        </button>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────
// PACKAGES MANAGEMENT TAB
// ─────────────────────────────────────────
function PackagesTab() {
  const { state, dispatch } = useApp();
  const [editing, setEditing] = useState<string | null>(null);
  const [adding, setAdding] = useState(false);

  return (
    <div>
      <div className="flex items-center justify-between mb-5">
        <h2 style={{ fontFamily: "'Montserrat', sans-serif", fontWeight: 700, fontSize: '1.2rem', color: '#1A1A1A' }}>
          Paket Yönetimi
        </h2>
        <button
          onClick={() => { setAdding(true); setEditing(null); }}
          className="flex items-center gap-2 px-4 py-2.5 rounded-full text-sm font-semibold cursor-pointer"
          style={{ background: green, color: '#fff', fontFamily: "'Montserrat', sans-serif" }}
        >
          <Plus size={14} /> Yeni Paket Ekle
        </button>
      </div>

      {adding && (
        <PlanForm
          plan={emptyPlan()}
          onSave={p => {
            dispatch({ type: 'ADD_PLAN', payload: { ...p, id: `plan-${Date.now()}` } });
            setAdding(false);
          }}
          onCancel={() => setAdding(false)}
        />
      )}

      <div className="space-y-3">
        {state.adminPlans.map(plan => (
          <div key={plan.id}>
            {editing === plan.id ? (
              <PlanForm
                plan={plan}
                onSave={p => { dispatch({ type: 'UPDATE_PLAN', payload: p }); setEditing(null); }}
                onCancel={() => setEditing(null)}
              />
            ) : (
              <div className="p-5 rounded-xl" style={{ background: plan.popular ? green : '#FFFFFF', border: `1.5px solid ${plan.popular ? green : '#E5DDD0'}` }}>
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <p style={{ fontFamily: "'Montserrat', sans-serif", fontWeight: 700, color: plan.popular ? '#FFFFFF' : '#1A1A1A', fontSize: '1rem' }}>
                      {plan.name}
                    </p>
                    <p style={{ fontFamily: "'Montserrat', sans-serif", fontSize: '13px', color: plan.popular ? 'rgba(255,255,255,0.7)' : '#8A8A8A', marginTop: '3px' }}>
                      {plan.mealCount} öğün · ₺{plan.price.toLocaleString('tr-TR')} · ₺{plan.pricePerMeal}/öğün
                    </p>
                    {plan.badge && (
                      <span className="inline-block mt-2 px-2.5 py-1 rounded-full text-xs font-semibold"
                        style={{ background: gold, color: '#fff', fontFamily: "'Montserrat', sans-serif" }}>
                        {plan.badge}
                      </span>
                    )}
                    {plan.features.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 mt-3">
                        {plan.features.filter(Boolean).map((feat, i) => (
                          <span key={i} className="px-2.5 py-1 rounded-lg text-xs"
                            style={{ background: plan.popular ? 'rgba(255,255,255,0.15)' : '#E8F0E8', color: plan.popular ? 'rgba(255,255,255,0.85)' : green, fontFamily: "'Montserrat', sans-serif" }}>
                            ✓ {feat}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                  <div className="flex gap-2 flex-shrink-0">
                    <button onClick={() => { setEditing(plan.id); setAdding(false); }}
                      className="w-8 h-8 rounded-xl flex items-center justify-center cursor-pointer hover:opacity-70"
                      style={{ background: plan.popular ? 'rgba(200,169,122,0.3)' : '#F5ECD7', color: gold }}>
                      <Edit3 size={14} />
                    </button>
                    <button
                      onClick={() => { if (window.confirm('Bu paketi silmek istediğinizden emin misiniz?')) dispatch({ type: 'DELETE_PLAN', payload: plan.id }); }}
                      className="w-8 h-8 rounded-xl flex items-center justify-center cursor-pointer hover:opacity-70"
                      style={{ background: plan.popular ? 'rgba(255,100,100,0.2)' : '#FEE2E2', color: '#C0392B' }}>
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────
// MAIN DASHBOARD
// ─────────────────────────────────────────
export default function AdminDashboard() {
  const { state, dispatch } = useApp();
  const t = useT(state.lang);
  const [tab, setTab] = useState<AdminTab>('orders');
  const [loggedIn, setLoggedIn] = useState(state.isAdmin);

  const handleLogin = () => {
    setLoggedIn(true);
    dispatch({ type: 'SET_ADMIN', payload: true });
    window.history.pushState({}, '', '/admin');
  };

  const handleLogout = () => {
    setLoggedIn(false);
    dispatch({ type: 'SET_ADMIN', payload: false });
    window.history.pushState({}, '', '/');
    dispatch({ type: 'SET_PAGE', payload: 'packages' });
  };

  if (!loggedIn) return <AdminLogin onLogin={handleLogin} />;

  const tabs: { id: AdminTab; label: string; icon: React.ReactNode }[] = [
    { id: 'orders',   label: 'Siparişler',      icon: <ShoppingBag size={16} /> },
    { id: 'menu',     label: 'Menü Yönetimi',   icon: <UtensilsCrossed size={16} /> },
    { id: 'packages', label: 'Paket Yönetimi',  icon: <Package size={16} /> },
  ];

  const pendingCount = state.orders.filter(o => o.status === 'pending').length;

  return (
    <div className="min-h-screen" style={{ background: '#FDF6F2' }}>

      {/* ── Top bar ── */}
      <div className="sticky top-0 z-50 border-b" style={{ background: 'rgba(253,246,242,0.97)', backdropFilter: 'blur(12px)', borderColor: '#E5DDD0' }}>
        <div className="max-w-[1400px] mx-auto px-5 sm:px-8 h-16 flex items-center justify-between">
          {/* Left: back arrow + title */}
          <div className="flex items-center gap-3">
            <button
              onClick={handleLogout}
              className="w-9 h-9 rounded-xl flex items-center justify-center cursor-pointer hover:opacity-70"
              style={{ background: '#E5DDD0' }}
              title="Çıkış yap ve ana sayfaya dön"
            >
              <ArrowLeft size={16} style={{ color: '#4A4A4A' }} />
            </button>
            <span style={{ fontFamily: "'Montserrat', sans-serif", fontWeight: 700, color: '#1A1A1A', fontSize: '1.1rem' }}>
              Yönetim Paneli
            </span>
          </div>

          {/* Right: pending badge + logout */}
          <div className="flex items-center gap-3">
            {pendingCount > 0 && (
              <span className="px-2.5 py-1 rounded-full text-xs font-bold"
                style={{ background: '#FEF9C3', color: '#854D0E', fontFamily: "'Montserrat', sans-serif" }}>
                {pendingCount} bekliyor
              </span>
            )}
            <button
              onClick={handleLogout}
              className="px-4 py-2 rounded-full text-sm font-semibold cursor-pointer hover:opacity-80"
              style={{ background: '#FEE2E2', color: '#C0392B', fontFamily: "'Montserrat', sans-serif" }}
            >
              {t('admin_logout')}
            </button>
          </div>
        </div>
      </div>

      {/* ── Content ── */}
      <div className="max-w-[1400px] mx-auto px-5 sm:px-8 py-6">
        <div className="flex flex-col lg:flex-row gap-6">

          {/* Sidebar */}
          <div className="lg:w-56 flex-shrink-0">
            <div className="flex lg:flex-col gap-2 overflow-x-auto lg:overflow-visible pb-2 lg:pb-0 no-scrollbar">
              {tabs.map(tb => (
                <button
                  key={tb.id}
                  onClick={() => setTab(tb.id)}
                  className="flex items-center gap-2.5 px-4 py-3 rounded-2xl text-sm font-medium cursor-pointer transition-all whitespace-nowrap"
                  style={{
                    background: tab === tb.id ? green : '#FFFFFF',
                    color: tab === tb.id ? '#fff' : '#4A4A4A',
                    border: `1.5px solid ${tab === tb.id ? green : '#E5DDD0'}`,
                    fontFamily: "'Montserrat', sans-serif",
                  }}
                >
                  {tb.icon}
                  {tb.label}
                  {tb.id === 'orders' && pendingCount > 0 && (
                    <span className="ml-auto w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0"
                      style={{
                        background: tab === 'orders' ? 'rgba(255,255,255,0.3)' : '#FEF9C3',
                        color: tab === 'orders' ? '#fff' : '#854D0E',
                      }}>
                      {pendingCount}
                    </span>
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Main content card */}
          <div className="flex-1 min-w-0">
            <div className="p-5 sm:p-6 rounded-3xl" style={{ background: '#FFFFFF', border: '1.5px solid #E5DDD0' }}>
              {tab === 'orders'   && <OrdersTab />}
              {tab === 'menu'     && <MenuTab />}
              {tab === 'packages' && <PackagesTab />}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

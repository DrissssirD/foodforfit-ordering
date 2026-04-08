import { getMealGradient, getMealEmoji } from '../data';
import { useState } from 'react';
import { ArrowLeft, Package, UtensilsCrossed, ShoppingBag, Plus, Trash2, Edit3, Check, X, Eye, EyeOff, BarChart2, Bot, Settings, ImagePlus } from 'lucide-react';
import { useApp } from '../store';
import { useT } from '../i18n';
import type { Meal, SubscriptionPlan, Order } from '../types';

const green = '#1E3F30';
const gold = '#C8A97A';

type AdminTab = 'orders' | 'menu' | 'packages' | 'analytics' | 'ai' | 'settings';

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
function AdminLogin({ onLogin, adminPassword }: { onLogin: () => void; adminPassword: string }) {
  const [pass, setPass] = useState('');
  const [error, setError] = useState(false);
  const [show, setShow] = useState(false);

  const attempt = () => {
    if (pass === adminPassword) onLogin();
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
              <div className="mt-2 space-y-1">
                <p style={{ fontFamily: "'Montserrat', sans-serif", fontSize: '14px', color: '#1A1A1A', fontWeight: 600 }}>
                  {order.customerName}
                </p>
                <p style={{ fontFamily: "'Montserrat', sans-serif", fontSize: '13px', color: '#4A4A4A' }}>
                  📞 {order.customerPhone} | 📧 {order.customerEmail}
                </p>
                <p style={{ fontFamily: "'Montserrat', sans-serif", fontSize: '13px', color: '#4A4A4A' }}>
                  📍 {order.deliveryType === 'teslimat' ? 'Teslimat' : 'Gel-Al'}
                  {order.address ? ` - ${order.address}` : ''}
                  {order.district ? ` (${order.district})` : ''}
                </p>
                <p style={{ fontFamily: "'Montserrat', sans-serif", fontSize: '13px', color: '#4A4A4A' }}>
                  ⏰ {order.deliveryTime}
                </p>
              </div>

              {order.notes && (
                <div className="mt-3 p-3 rounded-lg" style={{ background: '#FDF6F2', border: '1px solid #E5DDD0' }}>
                  <p style={{ fontFamily: "'Montserrat', sans-serif", fontSize: '11px', fontWeight: 700, color: '#8A8A8A', textTransform: 'uppercase', marginBottom: '4px' }}>
                    Müşteri Notu
                  </p>
                  <p style={{ fontFamily: "'Montserrat', sans-serif", fontSize: '13px', color: '#4A4A4A', fontStyle: 'italic' }}>
                    "{order.notes}"
                  </p>
                </div>
              )}

              {/* Order Items */}
              <div className="mt-4">
                <p style={{ fontFamily: "'Montserrat', sans-serif", fontSize: '11px', fontWeight: 700, color: '#8A8A8A', textTransform: 'uppercase', marginBottom: '8px' }}>
                  Sipariş İçeriği
                </p>
                <div className="space-y-2">
                  {order.items.map((item, idx) => (
                    <div key={idx} className="flex items-center justify-between text-sm" style={{ fontFamily: "'Montserrat', sans-serif" }}>
                      <div className="flex items-center gap-2">
                        <span className="w-6 h-6 rounded flex items-center justify-center text-[10px] font-bold" style={{ background: '#F5ECD7', color: gold }}>
                          {item.quantity}x
                        </span>
                        <span style={{ color: '#1A1A1A' }}>{item.meal.name}</span>
                        {item.isCreditBased && <span className="text-[10px] px-1.5 py-0.5 rounded bg-green-100 text-green-800">Paket</span>}
                      </div>
                      <span style={{ color: '#8A8A8A' }}>
                        {item.isCreditBased ? '—' : `₺${(item.meal.price * item.quantity).toLocaleString('tr-TR')}`}
                      </span>
                    </div>
                  ))}
                  {order.subscriptionPlan && (
                    <div className="flex items-center gap-2 p-2 rounded-lg mt-1" style={{ background: '#E8F0E8', border: `1px solid ${green}20` }}>
                      <Package size={14} style={{ color: green }} />
                      <span style={{ fontFamily: "'Montserrat', sans-serif", fontSize: '13px', fontWeight: 600, color: green }}>
                        {order.subscriptionPlan.name} (Paket Satın Alımı)
                      </span>
                    </div>
                  )}
                </div>
              </div>

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
  const [imageError, setImageError] = useState('');
  const [imageLoading, setImageLoading] = useState(false);
  const [dragActive, setDragActive] = useState(false);
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

  const handleImageFile = (file: File) => {
    setImageError('');
    if (file.size > 2 * 1024 * 1024) {
      setImageError('Dosya 2MB\'dan küçük olmalıdır');
      return;
    }
    if (!file.type.startsWith('image/')) {
      setImageError('Sadece görsel dosyası yükleyebilirsiniz');
      return;
    }
    setImageLoading(true);
    const reader = new FileReader();
    reader.onload = (e) => {
      const base64 = e.target?.result as string;
      f('imageUrl', base64);
      setImageLoading(false);
    };
    reader.readAsDataURL(file);
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
        <div className="sm:col-span-2">
          <label style={lStyle}>Öğün Görseli</label>
          {form.imageUrl ? (
            <div>
              <img src={form.imageUrl} alt="Preview" style={{ maxHeight: '160px', borderRadius: '12px', objectFit: 'cover', width: '100%' }} />
              <div className="flex gap-2 mt-3">
                <button
                  type="button"
                  onClick={() => { const input = document.createElement('input'); input.type = 'file'; input.accept = 'image/*'; input.onchange = (e) => { const file = (e.target as HTMLInputElement).files?.[0]; if (file) handleImageFile(file); }; input.click(); }}
                  className="px-3 py-1.5 text-xs font-medium rounded-full cursor-pointer"
                  style={{ background: '#E5DDD0', color: '#4A4A4A', fontFamily: "'Montserrat', sans-serif" }}
                >
                  Görseli Değiştir
                </button>
                <button
                  type="button"
                  onClick={() => f('imageUrl', '')}
                  className="px-3 py-1.5 text-xs font-medium cursor-pointer"
                  style={{ color: '#C0392B', fontFamily: "'Montserrat', sans-serif" }}
                >
                  Görseli Kaldır
                </button>
              </div>
            </div>
          ) : (
            <div>
              <div
                onDragOver={(e) => { e.preventDefault(); setDragActive(true); }}
                onDragLeave={() => setDragActive(false)}
                onDrop={(e) => { e.preventDefault(); setDragActive(false); const file = e.dataTransfer.files?.[0]; if (file) handleImageFile(file); }}
                onClick={() => { const input = document.createElement('input'); input.type = 'file'; input.accept = 'image/*'; input.onchange = (e) => { const file = (e.target as HTMLInputElement).files?.[0]; if (file) handleImageFile(file); }; input.click(); }}
                className="border-2 border-dashed rounded-xl p-8 text-center cursor-pointer"
                style={{ borderColor: dragActive ? '#1E3F30' : '#E5DDD0', transition: 'all 0.3s ease' }}
              >
                <ImagePlus size={32} style={{ margin: '0 auto 12px', color: '#8A8A8A' }} />
                <p style={{ fontFamily: "'Montserrat', sans-serif", fontWeight: 600, color: '#4A4A4A', marginBottom: '4px' }}>Görsel yüklemek için tıklayın veya sürükleyin</p>
                <p style={{ fontFamily: "'Montserrat', sans-serif", fontSize: '12px', color: '#8A8A8A' }}>PNG, JPG, WEBP — Maks 2MB</p>
              </div>
              {imageLoading && <p style={{ marginTop: '8px', fontFamily: "'Montserrat', sans-serif", fontSize: '13px', color: '#8A8A8A' }}>Yükleniyor...</p>}
              {imageError && <p style={{ marginTop: '8px', fontFamily: "'Montserrat', sans-serif", fontSize: '13px', color: '#C0392B' }}>{imageError}</p>}
            </div>
          )}
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
                <div className="w-14 h-14 rounded-xl flex-shrink-0 overflow-hidden"
                  style={{ background: getMealGradient(meal) }}>
                  {meal.imageUrl ? (
                    <img src={meal.imageUrl} alt={meal.name} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-2xl">
                      {getMealEmoji(meal)}
                    </div>
                  )}
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
  id: '', name: '', mealCount: 14, price: 0, pricePerMeal: 0, features: [''], popular: false, allowedMealIds: [],
});

function PlanForm({ plan, onSave, onCancel }: { plan: SubscriptionPlan; onSave: (p: SubscriptionPlan) => void; onCancel: () => void }) {
  const { state } = useApp();
  const [form, setForm] = useState<SubscriptionPlan>({ ...plan, features: [...plan.features], allowedMealIds: plan.allowedMealIds || [] });
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
          <label style={lStyle}>Paket İçeriği (İzin Verilen Öğünler)</label>
          <p style={{ fontSize: '11px', color: '#8A8A8A', marginBottom: '10px' }}>
            Boş bırakılırsa tüm menü öğeleri seçilebilir olur.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-48 overflow-y-auto p-2 rounded-xl" style={{ background: '#FFFFFF', border: '1.5px solid #E5DDD0' }}>
            {state.adminMeals.map(meal => {
              const checked = form.allowedMealIds?.includes(meal.id);
              return (
                <label key={meal.id} className="flex items-center gap-2 p-2 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors">
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={() => {
                      const current = form.allowedMealIds || [];
                      const next = checked ? current.filter(id => id !== meal.id) : [...current, meal.id];
                      f('allowedMealIds', next);
                    }}
                    style={{ accentColor: green }}
                  />
                  <span style={{ fontFamily: "'Montserrat', sans-serif", fontSize: '12px', color: '#4A4A4A' }}>
                    {meal.name}
                  </span>
                </label>
              );
            })}
          </div>
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
// ANALYTICS TAB
// ─────────────────────────────────────────
function AnalyticsTab() {
  const { state } = useApp();

  // Calculate metrics
  const totalRevenue = state.orders
    .filter(o => o.status !== 'cancelled')
    .reduce((sum, o) => sum + o.total, 0);

  const weekAgoTime = Date.now() - 7 * 24 * 60 * 60 * 1000;
  const weekRevenue = state.orders
    .filter(o => o.status !== 'cancelled' && new Date(o.createdAt).getTime() > weekAgoTime)
    .reduce((sum, o) => sum + o.total, 0);

  const deliveredCount = state.orders.filter(o => o.status === 'delivered').length;
  const pendingCount = state.orders.filter(o => o.status === 'pending').length;

  // Top meals calculation
  const mealCounts: Record<string, number> = {};
  state.orders.forEach(order => {
    order.items.forEach(item => {
      mealCounts[item.meal.id] = (mealCounts[item.meal.id] || 0) + item.quantity;
    });
  });

  const topMeals = Object.entries(mealCounts)
    .map(([mealId, count]) => {
      const meal = state.adminMeals.find(m => m.id === mealId);
      return { name: meal?.name || 'Unknown', count };
    })
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);

  const maxMealCount = Math.max(...topMeals.map(m => m.count), 1);

  // Subscription plan distribution
  const planCounts: Record<string, number> = {};
  let singleOrderCount = 0;

  state.orders.forEach(order => {
    if (order.subscriptionPlan) {
      planCounts[order.subscriptionPlan.name] = (planCounts[order.subscriptionPlan.name] || 0) + 1;
    } else {
      singleOrderCount++;
    }
  });

  const totalOrders = state.orders.length;

  // Stat card component
  const StatCard = ({ title, value, subtext, icon: Icon, accentColor }: any) => (
    <div className="p-5 rounded-xl relative" style={{ background: '#FFFFFF', border: '1.5px solid #E5DDD0' }}>
      <p style={{ fontFamily: "'Montserrat', sans-serif", fontSize: '12px', color: '#8A8A8A', marginBottom: '12px' }}>
        {title}
      </p>
      <p style={{ fontFamily: "'Montserrat', sans-serif", fontSize: '1.8rem', fontWeight: 700, color: '#1A1A1A', marginBottom: '2px' }}>
        {value}
      </p>
      {subtext && (
        <p style={{ fontFamily: "'Montserrat', sans-serif", fontSize: '12px', color: '#D4A574' }}>
          {subtext}
        </p>
      )}
      {Icon && (
        <div
          className="absolute top-5 right-5 w-10 h-10 rounded-lg flex items-center justify-center"
          style={{ background: accentColor ? `${accentColor}20` : '#F5ECD7' }}
        >
          <Icon size={18} style={{ color: accentColor || gold }} />
        </div>
      )}
    </div>
  );

  return (
    <div>
      <h2 style={{ fontFamily: "'Montserrat', sans-serif", fontWeight: 700, fontSize: '1.2rem', color: '#1A1A1A', marginBottom: '20px' }}>
        Analitik Özeti
      </h2>

      {/* ROW 1 - 4 Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard title="Toplam Ciro" value={`₺${totalRevenue.toLocaleString('tr-TR')}`} icon={() => null} accentColor={green} />
        <div>
          <StatCard
            title="Toplam Sipariş"
            value={totalOrders}
            subtext={pendingCount > 0 ? `${pendingCount} bekliyor` : undefined}
          />
        </div>
        <StatCard title="Bu Hafta Ciro" value={`₺${weekRevenue.toLocaleString('tr-TR')}`} />
        <StatCard title="Teslim Edildi" value={deliveredCount} accentColor={green} />
      </div>

      {/* ROW 2 - Two panels */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Top Meals */}
        <div className="p-5 rounded-xl" style={{ background: '#FFFFFF', border: '1.5px solid #E5DDD0' }}>
          <h3 style={{ fontFamily: "'Montserrat', sans-serif", fontWeight: 700, fontSize: '1rem', color: '#1A1A1A', marginBottom: '16px' }}>
            En Çok Sipariş Edilen Öğünler
          </h3>
          {topMeals.length === 0 ? (
            <p style={{ fontFamily: "'Montserrat', sans-serif", fontSize: '14px', color: '#8A8A8A', textAlign: 'center', padding: '20px 0' }}>
              Henüz sipariş verisi yok
            </p>
          ) : (
            <div className="space-y-3">
              {topMeals.map(meal => (
                <div key={meal.name} className="flex items-center gap-3">
                  <span style={{ fontFamily: "'Montserrat', sans-serif", fontSize: '13px', color: '#4A4A4A', minWidth: '100px' }}>
                    {meal.name.substring(0, 20)}
                  </span>
                  <div
                    className="flex-1 h-6 rounded-full overflow-hidden"
                    style={{ background: '#E5DDD0' }}
                  >
                    <div
                      className="h-full rounded-full"
                      style={{ width: `${(meal.count / maxMealCount) * 100}%`, background: green }}
                    />
                  </div>
                  <span style={{ fontFamily: "'Montserrat', sans-serif", fontSize: '13px', fontWeight: 600, color: '#1A1A1A', minWidth: '30px', textAlign: 'right' }}>
                    {meal.count}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Plan Distribution */}
        <div className="p-5 rounded-xl" style={{ background: '#FFFFFF', border: '1.5px solid #E5DDD0' }}>
          <h3 style={{ fontFamily: "'Montserrat', sans-serif", fontWeight: 700, fontSize: '1rem', color: '#1A1A1A', marginBottom: '16px' }}>
            Paket Dağılımı
          </h3>
          <div className="space-y-3">
            {singleOrderCount > 0 && (
              <div className="flex items-center justify-between mb-3">
                <span style={{ fontFamily: "'Montserrat', sans-serif", fontSize: '13px', color: '#4A4A4A' }}>
                  Tekli Sipariş
                </span>
                <span style={{ fontFamily: "'Montserrat', sans-serif", fontSize: '13px', fontWeight: 600, color: '#1A1A1A' }}>
                  {singleOrderCount} ({totalOrders > 0 ? Math.round((singleOrderCount / totalOrders) * 100) : 0}%)
                </span>
              </div>
            )}
            {Object.entries(planCounts).map(([planName, count]) => (
              <div key={planName} className="flex items-center justify-between">
                <span style={{ fontFamily: "'Montserrat', sans-serif", fontSize: '13px', color: '#4A4A4A' }}>
                  {planName}
                </span>
                <span style={{ fontFamily: "'Montserrat', sans-serif", fontSize: '13px', fontWeight: 600, color: '#1A1A1A' }}>
                  {count} ({totalOrders > 0 ? Math.round((count / totalOrders) * 100) : 0}%)
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ROW 3 - Recent Orders */}
      <div className="p-5 rounded-xl" style={{ background: '#FFFFFF', border: '1.5px solid #E5DDD0' }}>
        <h3 style={{ fontFamily: "'Montserrat', sans-serif", fontWeight: 700, fontSize: '1rem', color: '#1A1A1A', marginBottom: '16px' }}>
          Son Siparişler
        </h3>
        {state.orders.length === 0 ? (
          <p style={{ fontFamily: "'Montserrat', sans-serif", fontSize: '14px', color: '#8A8A8A', textAlign: 'center', padding: '20px 0' }}>
            Sipariş yok
          </p>
        ) : (
          <div className="space-y-0 divide-y" style={{ borderColor: '#E5DDD0' }}>
            {state.orders.slice(0, 5).map(order => {
              const sc = STATUS_COLORS[order.status];
              return (
                <div key={order.id} className="py-3 first:pt-0 last:pb-0">
                  <div className="flex flex-wrap items-center justify-between gap-2 text-sm">
                    <span style={{ fontFamily: "'Montserrat', sans-serif", fontWeight: 700, color: '#1A1A1A' }}>
                      {order.orderNumber}
                    </span>
                    <span style={{ fontFamily: "'Montserrat', sans-serif", fontSize: '13px', color: '#4A4A4A' }}>
                      {order.customerName}
                    </span>
                    <span style={{ fontFamily: "'Montserrat', sans-serif", fontSize: '13px', color: '#8A8A8A' }}>
                      {order.subscriptionPlan ? order.subscriptionPlan.name : 'Tekli'}
                    </span>
                    <span style={{ fontFamily: "'Montserrat', sans-serif", fontWeight: 600, color: '#1A1A1A' }}>
                      ₺{order.total.toLocaleString('tr-TR')}
                    </span>
                    <span
                      className="px-2.5 py-1 rounded-full text-xs font-semibold"
                      style={{ background: sc.bg, color: sc.color, fontFamily: "'Montserrat', sans-serif" }}
                    >
                      {sc.label}
                    </span>
                    <span style={{ fontFamily: "'Montserrat', sans-serif", fontSize: '11px', color: '#8A8A8A' }}>
                      {new Date(order.createdAt).toLocaleDateString('tr-TR')}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────
// AI ASSISTANT TAB
// ─────────────────────────────────────────
function AIAssistantTab() {
  const { state, dispatch } = useApp();
  const [newButtonInput, setNewButtonInput] = useState('');
  const [saveMessage, setSaveMessage] = useState('');
  const [tempPrompt, setTempPrompt] = useState(state.aiSystemPrompt);
  const [tempButtons, setTempButtons] = useState([...state.aiQuickButtons]);

  const handleToggleAI = () => {
    dispatch({ type: 'SET_AI_ASSISTANT_ENABLED', payload: !state.aiAssistantEnabled });
  };

  const handleSavePrompt = () => {
    dispatch({ type: 'SET_AI_SYSTEM_PROMPT', payload: tempPrompt });
    setSaveMessage('Kaydedildi ✓');
    setTimeout(() => setSaveMessage(''), 2000);
  };

  const handleAddButton = () => {
    if (newButtonInput.trim() && tempButtons.length < 5) {
      setTempButtons([...tempButtons, newButtonInput]);
      setNewButtonInput('');
    }
  };

  const handleDeleteButton = (index: number) => {
    setTempButtons(tempButtons.filter((_, i) => i !== index));
  };

  const handleSaveButtons = () => {
    dispatch({ type: 'SET_AI_QUICK_BUTTONS', payload: tempButtons });
    setSaveMessage('Kaydedildi ✓');
    setTimeout(() => setSaveMessage(''), 2000);
  };

  return (
    <div>
      <h2 style={{ fontFamily: "'Montserrat', sans-serif", fontWeight: 700, fontSize: '1.2rem', color: '#1A1A1A', marginBottom: '20px' }}>
        AI Asistan Yönetimi
      </h2>

      {/* Section 1 - Status Toggle */}
      <div className="mb-6 p-5 rounded-xl" style={{ background: '#FFFFFF', border: '1.5px solid #E5DDD0' }}>
        <h3 style={{ fontFamily: "'Montserrat', sans-serif", fontWeight: 700, fontSize: '1rem', color: '#1A1A1A', marginBottom: '16px' }}>
          Asistan Durumu
        </h3>
        <button
          onClick={handleToggleAI}
          className="flex items-center gap-3 p-4 rounded-xl w-full cursor-pointer"
          style={{
            background: state.aiAssistantEnabled ? '#E8F0E8' : '#F5F5F5',
            border: `1.5px solid ${state.aiAssistantEnabled ? green : '#E5DDD0'}`,
          }}
        >
          <div
            className="w-12 h-6 rounded-full flex items-center transition-all relative"
            style={{
              background: state.aiAssistantEnabled ? green : '#CCC',
            }}
          >
            <div
              className="w-5 h-5 rounded-full"
              style={{
                background: '#fff',
                marginLeft: state.aiAssistantEnabled ? '20px' : '2px',
                transition: 'margin 0.3s',
              }}
            />
          </div>
          <span style={{ fontFamily: "'Montserrat', sans-serif", fontWeight: 600, color: state.aiAssistantEnabled ? green : '#8A8A8A' }}>
            {state.aiAssistantEnabled ? 'Asistan Aktif' : 'Asistan Kapalı'}
          </span>
        </button>
      </div>

      {/* Section 2 - System Prompt */}
      <div className="mb-6 p-5 rounded-xl" style={{ background: '#FFFFFF', border: '1.5px solid #E5DDD0' }}>
        <h3 style={{ fontFamily: "'Montserrat', sans-serif", fontWeight: 700, fontSize: '1rem', color: '#1A1A1A', marginBottom: '4px' }}>
          Sistem Mesajı
        </h3>
        <p style={{ fontFamily: "'Montserrat', sans-serif", fontSize: '13px', color: '#8A8A8A', marginBottom: '12px' }}>
          Asistanın nasıl davranacağını ve ne bildiğini buradan düzenleyebilirsiniz.
        </p>
        <textarea
          value={tempPrompt}
          onChange={e => setTempPrompt(e.target.value)}
          rows={8}
          style={{
            width: '100%',
            padding: '12px 16px',
            borderRadius: '12px',
            border: '1.5px solid #E5DDD0',
            background: '#FDF6F2',
            fontFamily: "'Montserrat', sans-serif",
            fontSize: '13px',
            color: '#1A1A1A',
            resize: 'none',
            outline: 'none',
          }}
        />
        <div className="flex items-center justify-between mt-4">
          <button
            onClick={handleSavePrompt}
            className="px-6 py-3 rounded-full text-sm font-semibold cursor-pointer"
            style={{ background: green, color: '#fff', fontFamily: "'Montserrat', sans-serif" }}
          >
            Kaydet
          </button>
          {saveMessage && (
            <span style={{ color: green, fontFamily: "'Montserrat', sans-serif", fontSize: '13px', fontWeight: 600 }}>
              {saveMessage}
            </span>
          )}
        </div>
      </div>

      {/* Section 3 - Quick Buttons */}
      <div className="mb-6 p-5 rounded-xl" style={{ background: '#FFFFFF', border: '1.5px solid #E5DDD0' }}>
        <h3 style={{ fontFamily: "'Montserrat', sans-serif", fontWeight: 700, fontSize: '1rem', color: '#1A1A1A', marginBottom: '4px' }}>
          Hızlı Yanıtlar
        </h3>
        <p style={{ fontFamily: "'Montserrat', sans-serif", fontSize: '13px', color: '#8A8A8A', marginBottom: '12px' }}>
          Müşterilerin chat'te göreceği hızlı soru butonları
        </p>
        <div className="space-y-2 mb-4">
          {tempButtons.map((btn, i) => (
            <div key={i} className="flex gap-2">
              <input
                type="text"
                value={btn}
                readOnly
                style={{
                  flex: 1,
                  padding: '10px 14px',
                  borderRadius: '12px',
                  border: '1.5px solid #E5DDD0',
                  background: '#FDF6F2',
                  fontFamily: "'Montserrat', sans-serif",
                  fontSize: '13px',
                  color: '#1A1A1A',
                }}
              />
              <button
                onClick={() => handleDeleteButton(i)}
                className="w-10 h-10 rounded-lg flex items-center justify-center cursor-pointer"
                style={{ background: '#FEE2E2', color: '#C0392B' }}
              >
                <X size={16} />
              </button>
            </div>
          ))}
        </div>
        {tempButtons.length < 5 && (
          <div className="flex gap-2 mb-4">
            <input
              type="text"
              placeholder="Yeni buton metni"
              value={newButtonInput}
              onChange={e => setNewButtonInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleAddButton()}
              style={{
                flex: 1,
                padding: '10px 14px',
                borderRadius: '12px',
                border: '1.5px solid #E5DDD0',
                background: '#FDF6F2',
                fontFamily: "'Montserrat', sans-serif",
                fontSize: '13px',
                color: '#1A1A1A',
                outline: 'none',
              }}
            />
            <button
              onClick={handleAddButton}
              className="px-4 py-2 rounded-lg text-sm font-medium cursor-pointer"
              style={{ background: '#E8F0E8', color: green, fontFamily: "'Montserrat', sans-serif" }}
            >
              + Ekle
            </button>
          </div>
        )}
        <button
          onClick={handleSaveButtons}
          className="px-6 py-3 rounded-full text-sm font-semibold cursor-pointer"
          style={{ background: green, color: '#fff', fontFamily: "'Montserrat', sans-serif" }}
        >
          Kaydet
        </button>
      </div>

      {/* Section 4 - API Status */}
      <div className="p-5 rounded-xl" style={{ background: '#FFFFFF', border: '1.5px solid #E5DDD0' }}>
        <h3 style={{ fontFamily: "'Montserrat', sans-serif", fontWeight: 700, fontSize: '1rem', color: '#1A1A1A', marginBottom: '16px' }}>
          API Bağlantısı
        </h3>
        <div className="flex items-start gap-3 mb-4">
          <div className="w-2.5 h-2.5 rounded-full mt-1" style={{ background: '#FF9800' }} />
          <div>
            <p style={{ fontFamily: "'Montserrat', sans-serif", fontWeight: 600, color: '#1A1A1A', marginBottom: '2px' }}>
              Anthropic API
            </p>
            <p style={{ fontFamily: "'Montserrat', sans-serif", fontSize: '13px', color: '#8A8A8A' }}>
              API anahtarı bekleniyor
            </p>
            <p style={{ fontFamily: "'Montserrat', sans-serif", fontSize: '12px', color: '#8A8A8A', marginTop: '8px' }}>
              Ödeme onaylandıktan sonra API anahtarı eklenecek ve asistan aktif hale gelecektir.
            </p>
          </div>
        </div>
        <div
          className="p-3 rounded-xl mb-4"
          style={{
            background: '#FDF6F2',
            border: '1px solid #E5DDD0',
            fontFamily: "'Montserrat', sans-serif",
            fontSize: '12px',
            color: '#4A4A4A',
            overflow: 'auto',
          }}
        >
          VITE_ANTHROPIC_API_KEY=••••••••
        </div>
        <p style={{ fontFamily: "'Montserrat', sans-serif", fontSize: '12px', color: '#8A8A8A' }}>
          Bu anahtarı Vercel dashboard → Environment Variables bölümünden ekleyin.
        </p>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────
// SETTINGS TAB
// ─────────────────────────────────────────
function SettingsTab() {
  const { state, dispatch } = useApp();
  const [tempSettings, setTempSettings] = useState(state.businessSettings);
  const [currentPass, setCurrentPass] = useState('');
  const [newPass, setNewPass] = useState('');
  const [confirmPass, setConfirmPass] = useState('');
  const [passError, setPassError] = useState('');
  const [passSuccess, setPassSuccess] = useState('');
  const [saveMessage, setSaveMessage] = useState('');
  const [showCurrentPass, setShowCurrentPass] = useState(false);
  const [showNewPass, setShowNewPass] = useState(false);
  const [showConfirmPass, setShowConfirmPass] = useState(false);

  const handleSettingChange = (key: keyof typeof tempSettings, value: any) => {
    setTempSettings({ ...tempSettings, [key]: value });
  };

  const handleSaveSettings = () => {
    dispatch({ type: 'UPDATE_BUSINESS_SETTINGS', payload: tempSettings });
    setSaveMessage('Kaydedildi ✓');
    setTimeout(() => setSaveMessage(''), 2000);
  };

  const handleChangePassword = () => {
    setPassError('');
    setPassSuccess('');

    if (currentPass !== state.adminPassword) {
      setPassError('Mevcut şifre hatalı');
      return;
    }
    if (newPass.length < 6) {
      setPassError('Yeni şifre en az 6 karakter olmalı');
      return;
    }
    if (newPass !== confirmPass) {
      setPassError('Yeni şifreler eşleşmiyor');
      return;
    }

    dispatch({ type: 'CHANGE_ADMIN_PASSWORD', payload: newPass });
    setCurrentPass('');
    setNewPass('');
    setConfirmPass('');
    setPassSuccess('Şifre değiştirildi ✓');
    setTimeout(() => setPassSuccess(''), 3000);
  };

  return (
    <div>
      <h2 style={{ fontFamily: "'Montserrat', sans-serif", fontWeight: 700, fontSize: '1.2rem', color: '#1A1A1A', marginBottom: '20px' }}>
        İşletme Ayarları
      </h2>

      {/* Section 1 - Order Status */}
      <div className="mb-6 p-5 rounded-xl" style={{ background: '#FFFFFF', border: '1.5px solid #E5DDD0' }}>
        <h3 style={{ fontFamily: "'Montserrat', sans-serif", fontWeight: 700, fontSize: '1rem', color: '#1A1A1A', marginBottom: '16px' }}>
          Sipariş Durumu
        </h3>
        <button
          onClick={() => handleSettingChange('isAcceptingOrders', !tempSettings.isAcceptingOrders)}
          className="flex items-center gap-3 p-4 rounded-xl w-full mb-4 cursor-pointer"
          style={{
            background: tempSettings.isAcceptingOrders ? '#E8F0E8' : '#FEE2E2',
            border: `1.5px solid ${tempSettings.isAcceptingOrders ? green : '#C0392B'}`,
          }}
        >
          <div
            className="w-12 h-6 rounded-full flex items-center transition-all relative"
            style={{
              background: tempSettings.isAcceptingOrders ? green : '#CCC',
            }}
          >
            <div
              className="w-5 h-5 rounded-full"
              style={{
                background: '#fff',
                marginLeft: tempSettings.isAcceptingOrders ? '20px' : '2px',
                transition: 'margin 0.3s',
              }}
            />
          </div>
          <span style={{ fontFamily: "'Montserrat', sans-serif", fontWeight: 600, color: tempSettings.isAcceptingOrders ? green : '#C0392B' }}>
            {tempSettings.isAcceptingOrders ? 'Sipariş Alınıyor' : 'Siparişe Kapalı'}
          </span>
        </button>
        <div>
          <label style={{ fontFamily: "'Montserrat', sans-serif", fontSize: '12px', color: '#8A8A8A', display: 'block', marginBottom: '8px' }}>
            Kapalı Mesajı
          </label>
          <textarea
            value={tempSettings.closedMessage}
            onChange={e => handleSettingChange('closedMessage', e.target.value)}
            rows={2}
            style={{
              width: '100%',
              padding: '10px 14px',
              borderRadius: '12px',
              border: '1.5px solid #E5DDD0',
              background: '#FDF6F2',
              fontFamily: "'Montserrat', sans-serif",
              fontSize: '13px',
              color: '#1A1A1A',
              resize: 'none',
              outline: 'none',
            }}
          />
        </div>
      </div>

      {/* Section 2 - Business Info */}
      <div className="mb-6 p-5 rounded-xl" style={{ background: '#FFFFFF', border: '1.5px solid #E5DDD0' }}>
        <h3 style={{ fontFamily: "'Montserrat', sans-serif", fontWeight: 700, fontSize: '1rem', color: '#1A1A1A', marginBottom: '16px' }}>
          İşletme Bilgileri
        </h3>
        <div className="space-y-4">
          {[
            { key: 'businessName', label: 'İşletme Adı' },
            { key: 'phone', label: 'Telefon' },
            { key: 'email', label: 'Email' },
            { key: 'deliveryAreas', label: 'Teslimat Bölgeleri' },
            { key: 'deliveryHours', label: 'Teslimat Saatleri' },
          ].map(({ key, label }) => (
            <div key={key}>
              <label style={{ fontFamily: "'Montserrat', sans-serif", fontSize: '12px', color: '#8A8A8A', display: 'block', marginBottom: '6px' }}>
                {label}
              </label>
              <input
                type="text"
                value={String(tempSettings[key as keyof typeof tempSettings] || '')}
                onChange={e => handleSettingChange(key as keyof typeof tempSettings, e.target.value)}
                style={{
                  width: '100%',
                  padding: '10px 14px',
                  borderRadius: '12px',
                  border: '1.5px solid #E5DDD0',
                  background: '#FDF6F2',
                  fontFamily: "'Montserrat', sans-serif",
                  fontSize: '13px',
                  color: '#1A1A1A',
                  outline: 'none',
                }}
              />
            </div>
          ))}
        </div>
        <button
          onClick={handleSaveSettings}
          className="mt-4 px-6 py-3 rounded-full text-sm font-semibold cursor-pointer"
          style={{ background: green, color: '#fff', fontFamily: "'Montserrat', sans-serif" }}
        >
          Kaydet
        </button>
      </div>

      {/* Section 3 - Delivery Settings */}
      <div className="mb-6 p-5 rounded-xl" style={{ background: '#FFFFFF', border: '1.5px solid #E5DDD0' }}>
        <h3 style={{ fontFamily: "'Montserrat', sans-serif", fontWeight: 700, fontSize: '1rem', color: '#1A1A1A', marginBottom: '16px' }}>
          Teslimat & Ödeme Ayarları
        </h3>
        <div className="space-y-4">
          {[
            { key: 'minOrderAmount', label: 'Min. Sipariş Tutarı (₺)' },
            { key: 'freeDeliveryThreshold', label: 'Ücretsiz Teslimat Sınırı (₺)' },
            { key: 'deliveryFee', label: 'Teslimat Ücreti (₺)' },
          ].map(({ key, label }) => (
            <div key={key}>
              <label style={{ fontFamily: "'Montserrat', sans-serif", fontSize: '12px', color: '#8A8A8A', display: 'block', marginBottom: '6px' }}>
                {label}
              </label>
              <input
                type="number"
                value={Number(tempSettings[key as keyof typeof tempSettings] || 0)}
                onChange={e => handleSettingChange(key as keyof typeof tempSettings, +e.target.value)}
                min={0}
                style={{
                  width: '100%',
                  padding: '10px 14px',
                  borderRadius: '12px',
                  border: '1.5px solid #E5DDD0',
                  background: '#FDF6F2',
                  fontFamily: "'Montserrat', sans-serif",
                  fontSize: '13px',
                  color: '#1A1A1A',
                  outline: 'none',
                }}
              />
            </div>
          ))}
        </div>
        <p style={{ fontFamily: "'Montserrat', sans-serif", fontSize: '12px', color: '#8A8A8A', marginTop: '12px' }}>
          Bu değerler sepet hesaplamalarına otomatik olarak yansır.
        </p>
        <button
          onClick={handleSaveSettings}
          className="mt-4 px-6 py-3 rounded-full text-sm font-semibold cursor-pointer"
          style={{ background: green, color: '#fff', fontFamily: "'Montserrat', sans-serif" }}
        >
          Kaydet
        </button>
        {saveMessage && (
          <p style={{ color: green, fontFamily: "'Montserrat', sans-serif", fontSize: '13px', fontWeight: 600, marginTop: '8px' }}>
            {saveMessage}
          </p>
        )}
      </div>

      {/* Section 4 - Admin Password */}
      <div className="p-5 rounded-xl" style={{ background: '#FFFFFF', border: '1.5px solid #E5DDD0' }}>
        <h3 style={{ fontFamily: "'Montserrat', sans-serif", fontWeight: 700, fontSize: '1rem', color: '#1A1A1A', marginBottom: '16px' }}>
          Admin Şifresi Değiştir
        </h3>
        <div className="space-y-4">
          <div className="relative">
            <label style={{ fontFamily: "'Montserrat', sans-serif", fontSize: '12px', color: '#8A8A8A', display: 'block', marginBottom: '6px' }}>
              Mevcut Şifre
            </label>
            <input
              type={showCurrentPass ? 'text' : 'password'}
              value={currentPass}
              onChange={e => { setCurrentPass(e.target.value); setPassError(''); }}
              style={{
                width: '100%',
                padding: '10px 14px',
                borderRadius: '12px',
                border: `1.5px solid ${passError ? '#C0392B' : '#E5DDD0'}`,
                background: '#FDF6F2',
                fontFamily: "'Montserrat', sans-serif",
                fontSize: '13px',
                color: '#1A1A1A',
                outline: 'none',
              }}
            />
            <button
              onClick={() => setShowCurrentPass(!showCurrentPass)}
              className="absolute right-3 top-1/3 cursor-pointer"
              style={{ color: '#8A8A8A' }}
            >
              {showCurrentPass ? <EyeOff size={14} /> : <Eye size={14} />}
            </button>
          </div>
          <div className="relative">
            <label style={{ fontFamily: "'Montserrat', sans-serif", fontSize: '12px', color: '#8A8A8A', display: 'block', marginBottom: '6px' }}>
              Yeni Şifre
            </label>
            <input
              type={showNewPass ? 'text' : 'password'}
              value={newPass}
              onChange={e => { setNewPass(e.target.value); setPassError(''); }}
              style={{
                width: '100%',
                padding: '10px 14px',
                borderRadius: '12px',
                border: `1.5px solid ${passError ? '#C0392B' : '#E5DDD0'}`,
                background: '#FDF6F2',
                fontFamily: "'Montserrat', sans-serif",
                fontSize: '13px',
                color: '#1A1A1A',
                outline: 'none',
              }}
            />
            <button
              onClick={() => setShowNewPass(!showNewPass)}
              className="absolute right-3 top-1/3 cursor-pointer"
              style={{ color: '#8A8A8A' }}
            >
              {showNewPass ? <EyeOff size={14} /> : <Eye size={14} />}
            </button>
          </div>
          <div className="relative">
            <label style={{ fontFamily: "'Montserrat', sans-serif", fontSize: '12px', color: '#8A8A8A', display: 'block', marginBottom: '6px' }}>
              Şifreyi Onayla
            </label>
            <input
              type={showConfirmPass ? 'text' : 'password'}
              value={confirmPass}
              onChange={e => { setConfirmPass(e.target.value); setPassError(''); }}
              style={{
                width: '100%',
                padding: '10px 14px',
                borderRadius: '12px',
                border: `1.5px solid ${passError ? '#C0392B' : '#E5DDD0'}`,
                background: '#FDF6F2',
                fontFamily: "'Montserrat', sans-serif",
                fontSize: '13px',
                color: '#1A1A1A',
                outline: 'none',
              }}
            />
            <button
              onClick={() => setShowConfirmPass(!showConfirmPass)}
              className="absolute right-3 top-1/3 cursor-pointer"
              style={{ color: '#8A8A8A' }}
            >
              {showConfirmPass ? <EyeOff size={14} /> : <Eye size={14} />}
            </button>
          </div>
        </div>
        {passError && (
          <p style={{ color: '#C0392B', fontFamily: "'Montserrat', sans-serif", fontSize: '12px', marginTop: '8px' }}>
            {passError}
          </p>
        )}
        {passSuccess && (
          <p style={{ color: green, fontFamily: "'Montserrat', sans-serif", fontSize: '12px', fontWeight: 600, marginTop: '8px' }}>
            {passSuccess}
          </p>
        )}
        <button
          onClick={handleChangePassword}
          className="mt-4 px-6 py-3 rounded-full text-sm font-semibold cursor-pointer"
          style={{ background: green, color: '#fff', fontFamily: "'Montserrat', sans-serif" }}
        >
          Şifreyi Güncelle
        </button>
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

  if (!loggedIn) return <AdminLogin onLogin={handleLogin} adminPassword={state.adminPassword} />;

  const tabs: { id: AdminTab; label: string; icon: React.ReactNode }[] = [
    { id: 'orders',   label: 'Siparişler',      icon: <ShoppingBag size={16} /> },
    { id: 'menu',     label: 'Menü Yönetimi',   icon: <UtensilsCrossed size={16} /> },
    { id: 'packages', label: 'Paket Yönetimi',  icon: <Package size={16} /> },
    { id: 'analytics', label: 'Analitik',       icon: <BarChart2 size={16} /> },
    { id: 'ai',       label: 'AI Asistan',      icon: <Bot size={16} /> },
    { id: 'settings', label: 'Ayarlar',         icon: <Settings size={16} /> },
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
              {tab === 'orders'    && <OrdersTab />}
              {tab === 'menu'      && <MenuTab />}
              {tab === 'packages'  && <PackagesTab />}
              {tab === 'analytics' && <AnalyticsTab />}
              {tab === 'ai'        && <AIAssistantTab />}
              {tab === 'settings'  && <SettingsTab />}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

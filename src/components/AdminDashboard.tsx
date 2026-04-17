import { getMealGradient, getMealEmoji } from '../data';
import { useState } from 'react';
import { ArrowLeft, Package, UtensilsCrossed, ShoppingBag, Plus, Trash2, Edit3, Check, X, Eye, EyeOff, BarChart2, Bot, Settings, ImagePlus, Truck, CreditCard } from 'lucide-react';
import { useApp } from '../store';
import { useT, type TKey } from '../i18n';
import type { Meal, SubscriptionPlan, Order, RescheduleRequest, TimeSlot, ScheduledDelivery } from '../types';

const green = '#1E3F30';
const gold = '#C8A97A';

type AdminTab = 'orders' | 'menu' | 'packages' | 'analytics' | 'ai' | 'settings' | 'production' | 'delivery';

const STATUS_BG_COLOR: Record<Order['status'], { bg: string; color: string }> = {
  pending:   { bg: '#FEF9C3', color: '#854D0E' },
  preparing: { bg: '#DBEAFE', color: '#1E40AF' },
  ready:     { bg: '#D1FAE5', color: '#065F46' },
  delivered: { bg: '#E8F0E8', color: '#1E3F30' },
  cancelled: { bg: '#FEE2E2', color: '#991B1B' },
};

const dayKeyMap: Record<number, TKey> = {
  0: 'chk_day_sun', 1: 'chk_day_mon', 2: 'chk_day_tue',
  3: 'chk_day_wed', 4: 'chk_day_thu', 5: 'chk_day_fri', 6: 'chk_day_sat',
};

// ─────────────────────────────────────────
// LOGIN SCREEN
// ─────────────────────────────────────────
function AdminLogin({ onLogin, adminPassword }: { onLogin: () => void; adminPassword: string }) {
  const { state } = useApp();
  const t = useT(state.lang);
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
          <h1 style={{ fontFamily: "'Montserrat', sans-serif", fontWeight: 700, fontSize: '1.4rem', color: '#1A1A1A' }}>{t('admin_title')}</h1>
          <p style={{ fontFamily: "'Montserrat', sans-serif", fontSize: '13px', color: '#8A8A8A', marginTop: '4px' }}>{t('admin_login_subtitle')}</p>
        </div>
        <div className="space-y-4">
          <div className="relative">
            <input
              type={show ? 'text' : 'password'}
              placeholder={t('admin_pass')}
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
            <p style={{ color: '#C0392B', fontSize: '12px', fontFamily: "'Montserrat', sans-serif" }}>{t('admin_wrong_pass')}</p>
          )}
          <button
            onClick={attempt}
            className="w-full py-3 rounded-full text-sm font-semibold cursor-pointer"
            style={{ background: green, color: '#fff', fontFamily: "'Montserrat', sans-serif" }}
          >
            {t('admin_login_btn')}
          </button>
        </div>
        <p className="text-center mt-4 text-xs" style={{ color: '#8A8A8A', fontFamily: "'Montserrat', sans-serif" }}>
          {t('admin_login_demo')}
        </p>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────
// RESCHEDULE REQUESTS SUB-TAB
// ─────────────────────────────────────────
function RescheduleRequestsSubTab() {
  const { state, dispatch } = useApp();
  const t = useT(state.lang);

  const requests = [...state.rescheduleRequests].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );

  const formatSlot = (slot: string): string => {
    if (slot === 'morning') return t('chk_slot_morning');
    if (slot === 'lunch') return t('chk_slot_lunch');
    if (slot === 'evening') return t('chk_slot_evening');
    return slot;
  };

  const formatDay = (day: string): string => {
    const d = new Date(day + 'T00:00:00');
    const key = dayKeyMap[d.getDay()];
    return `${key ? t(key) : day} ${d.getDate()}`;
  };

  const approve = (req: RescheduleRequest) => {
    dispatch({ type: 'UPDATE_RESCHEDULE_REQUEST', payload: { id: req.id, status: 'approved' } });
    dispatch({ type: 'UPDATE_ORDER_DELIVERY', payload: {
      orderId: req.orderId,
      deliveryId: req.deliveryId,
      day: req.requestedDay,
      timeSlot: req.requestedTimeSlot as TimeSlot,
    }});
  };

  const reject = (req: RescheduleRequest) => {
    dispatch({ type: 'UPDATE_RESCHEDULE_REQUEST', payload: { id: req.id, status: 'rejected' } });
  };

  if (requests.length === 0) {
    return (
      <div className="text-center py-16">
        <p style={{ color: '#8A8A8A', fontFamily: "'Montserrat', sans-serif" }}>{t('admin_reschedule_empty')}</p>
      </div>
    );
  }

  const rescheduleStatusLabel = (s: RescheduleRequest['status']) => {
    if (s === 'approved') return state.lang === 'en' ? 'Approved' : state.lang === 'ru' ? 'Одобрено' : 'Onaylandı';
    if (s === 'rejected') return state.lang === 'en' ? 'Rejected' : state.lang === 'ru' ? 'Отклонено' : 'Reddedildi';
    return t('admin_status_pending');
  };
  const statusColors: Record<RescheduleRequest['status'], { bg: string; color: string }> = {
    pending:  { bg: '#FEF9C3', color: '#854D0E' },
    approved: { bg: '#D1FAE5', color: '#065F46' },
    rejected: { bg: '#FEE2E2', color: '#991B1B' },
  };

  return (
    <div className="space-y-4">
      {requests.map(req => {
        const sc = statusColors[req.status];
        return (
          <div key={req.id} className="p-5 rounded-xl" style={{ background: '#FFFFFF', border: '1.5px solid #E5DDD0' }}>
            <div className="flex flex-wrap items-start justify-between gap-3 mb-3">
              <div>
                <p style={{ fontFamily: "'Montserrat', sans-serif", fontWeight: 700, fontSize: '14px', color: '#1A1A1A' }}>
                  {req.customerName}
                </p>
                <p style={{ fontFamily: "'Montserrat', sans-serif", fontSize: '12px', color: '#8A8A8A' }}>
                  {req.customerPhone}
                </p>
              </div>
              <span className="px-2.5 py-1 rounded-full text-[11px] font-bold"
                style={{ background: sc.bg, color: sc.color, fontFamily: "'Montserrat', sans-serif" }}>
                {rescheduleStatusLabel(req.status)}
              </span>
            </div>

            <p style={{ fontFamily: "'Montserrat', sans-serif", fontWeight: 700, fontSize: '13px', color: green, marginBottom: '8px' }}>
              🍽️ {req.mealName}
            </p>

            <div className="grid grid-cols-2 gap-3 mb-3">
              <div className="p-3 rounded-lg" style={{ background: '#FDF6F2', border: '1px solid #E5DDD0' }}>
                <p style={{ fontFamily: "'Montserrat', sans-serif", fontSize: '10px', fontWeight: 700, color: '#8A8A8A', textTransform: 'uppercase', marginBottom: '4px' }}>
                  {t('admin_reschedule_original')}
                </p>
                <p style={{ fontFamily: "'Montserrat', sans-serif", fontSize: '13px', color: '#1A1A1A', fontWeight: 600 }}>
                  {formatDay(req.originalDay)}
                </p>
                <p style={{ fontFamily: "'Montserrat', sans-serif", fontSize: '12px', color: '#4A4A4A' }}>
                  {formatSlot(req.originalTimeSlot)}
                </p>
              </div>
              <div className="p-3 rounded-lg" style={{ background: '#EBF5EB', border: '1px solid #B7DDB7' }}>
                <p style={{ fontFamily: "'Montserrat', sans-serif", fontSize: '10px', fontWeight: 700, color: '#8A8A8A', textTransform: 'uppercase', marginBottom: '4px' }}>
                  {t('admin_reschedule_requested')}
                </p>
                <p style={{ fontFamily: "'Montserrat', sans-serif", fontSize: '13px', color: '#1A1A1A', fontWeight: 600 }}>
                  {formatDay(req.requestedDay)}
                </p>
                <p style={{ fontFamily: "'Montserrat', sans-serif", fontSize: '12px', color: '#4A4A4A' }}>
                  {formatSlot(req.requestedTimeSlot)}
                </p>
              </div>
            </div>

            {req.reason && (
              <p style={{ fontFamily: "'Montserrat', sans-serif", fontSize: '12px', color: '#4A4A4A', fontStyle: 'italic', marginBottom: '12px' }}>
                "{req.reason}"
              </p>
            )}

            {req.status === 'pending' && (
              <div className="flex gap-2">
                <button
                  onClick={() => approve(req)}
                  className="flex-1 py-2 rounded-xl text-[12px] font-bold cursor-pointer"
                  style={{ background: '#D1FAE5', color: '#065F46', fontFamily: "'Montserrat', sans-serif" }}
                >
                  {t('admin_reschedule_approve')}
                </button>
                <button
                  onClick={() => reject(req)}
                  className="flex-1 py-2 rounded-xl text-[12px] font-bold cursor-pointer"
                  style={{ background: '#FEE2E2', color: '#991B1B', fontFamily: "'Montserrat', sans-serif" }}
                >
                  {t('admin_reschedule_reject')}
                </button>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

// ─────────────────────────────────────────
// ORDERS TAB
// ─────────────────────────────────────────
function OrdersTab() {
  const { state, dispatch } = useApp();
  const t = useT(state.lang);
  const [subTab, setSubTab] = useState<'orders' | 'reschedule'>('orders');
  const [filter, setFilter] = useState<'all' | 'active' | 'completed' | 'cancelled'>('active');
  const statuses: Order['status'][] = ['pending', 'preparing', 'ready', 'delivered', 'cancelled'];
  const statusLabel = (s: Order['status']) => {
    if (s === 'pending')   return t('admin_status_pending');
    if (s === 'preparing') return t('admin_status_preparing');
    if (s === 'ready')     return t('admin_status_ready');
    if (s === 'delivered') return t('admin_status_delivered');
    return t('admin_status_cancelled');
  };

  const pendingReschedules = state.rescheduleRequests.filter(r => r.status === 'pending').length;

  const filteredOrders = state.orders.filter(o => {
    if (filter === 'all') return true;
    if (filter === 'active') return ['pending', 'preparing', 'ready'].includes(o.status);
    if (filter === 'completed') return o.status === 'delivered';
    if (filter === 'cancelled') return o.status === 'cancelled';
    return true;
  });

  return (
    <div>
      {/* Sub-tab switcher */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div className="flex gap-2">
          <button
            onClick={() => setSubTab('orders')}
            className="px-4 py-2 rounded-xl text-sm font-bold cursor-pointer transition-all"
            style={{
              background: subTab === 'orders' ? green : '#F5F5F5',
              color: subTab === 'orders' ? '#fff' : '#8A8A8A',
              fontFamily: "'Montserrat', sans-serif",
            }}
          >
            {t('admin_orders_tab')}
          </button>
          <button
            onClick={() => setSubTab('reschedule')}
            className="px-4 py-2 rounded-xl text-sm font-bold cursor-pointer transition-all flex items-center gap-2"
            style={{
              background: subTab === 'reschedule' ? green : '#F5F5F5',
              color: subTab === 'reschedule' ? '#fff' : '#8A8A8A',
              fontFamily: "'Montserrat', sans-serif",
            }}
          >
            {t('admin_reschedule_tab')}
            {pendingReschedules > 0 && (
              <span className="w-5 h-5 rounded-full text-[10px] font-bold flex items-center justify-center"
                style={{ background: subTab === 'reschedule' ? '#C8A97A' : '#C0392B', color: '#fff' }}>
                {pendingReschedules}
              </span>
            )}
          </button>
        </div>

        {/* Order filters — only visible in orders sub-tab */}
        {subTab === 'orders' && (
          <div className="flex bg-[#F5F5F5] p-1 rounded-xl border border-[#E5DDD0]">
            {(['active', 'completed', 'cancelled', 'all'] as const).map(f => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className="px-4 py-1.5 rounded-lg text-xs font-bold transition-all capitalize"
                style={{
                  background: filter === f ? '#FFFFFF' : 'transparent',
                  color: filter === f ? green : '#8A8A8A',
                  boxShadow: filter === f ? '0 2px 4px rgba(0,0,0,0.05)' : 'none',
                  fontFamily: "'Montserrat', sans-serif"
                }}
              >
                {f === 'active' ? t('admin_filter_active') : f === 'completed' ? t('admin_filter_completed') : f === 'cancelled' ? t('admin_filter_cancelled') : t('admin_filter_all')}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Reschedule sub-tab */}
      {subTab === 'reschedule' && <RescheduleRequestsSubTab />}

      {/* Orders list */}
      {subTab === 'orders' && filteredOrders.length === 0 && (
        <div className="text-center py-16">
          <ShoppingBag size={36} style={{ color: '#E5DDD0', margin: '0 auto 12px' }} />
          <p style={{ color: '#8A8A8A', fontFamily: "'Montserrat', sans-serif" }}>{t('admin_no_orders')}</p>
        </div>
      )}

      {subTab === 'orders' && <div className="space-y-4">
        {filteredOrders.map(order => {
          const sc = STATUS_BG_COLOR[order.status];
          return (
            <div key={order.id} className="p-5 rounded-xl transition-all hover:shadow-md" style={{ background: '#FFFFFF', border: '1.5px solid #E5DDD0' }}>
              {/* Top row: order number + status + total */}
              <div className="flex flex-wrap items-start justify-between gap-3 mb-2">
                <div className="flex items-center gap-3 flex-wrap">
                  <span style={{ fontFamily: "'Montserrat', sans-serif", fontWeight: 700, color: '#1A1A1A', fontSize: '1rem' }}>
                    {order.orderNumber}
                  </span>
                  <span className="px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider"
                    style={{ background: sc.bg, color: sc.color, fontFamily: "'Montserrat', sans-serif" }}>
                    {statusLabel(order.status)}
                  </span>
                  {order.subscriptionPlan && (
                    <span className="px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-green-50 text-green-700 border border-green-100 flex items-center gap-1">
                      <Package size={10} /> {order.subscriptionPlan.name}
                    </span>
                  )}
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
                  <span className="font-bold">📍 {t('admin_address_label')}:</span> {order.deliveryType === 'teslimat' ? (
                    <>
                      {order.address || t('admin_delivery_no_address')}
                      {order.district ? ` (${order.district})` : ''}
                    </>
                  ) : (
                    <span className="text-amber-600 font-bold italic">{t('admin_pickup_store')}</span>
                  )}
                </p>
                <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
                  <p style={{ fontFamily: "'Montserrat', sans-serif", fontSize: '13px', color: '#4A4A4A' }}>
                    📞 {order.customerPhone}
                  </p>
                  <p style={{ fontFamily: "'Montserrat', sans-serif", fontSize: '13px', color: '#4A4A4A' }}>
                    📧 {order.customerEmail}
                  </p>
                </div>
                
                <div className="flex flex-wrap items-center gap-4 mt-2">
                  <p style={{ fontFamily: "'Montserrat', sans-serif", fontSize: '13px', color: gold, fontWeight: 700 }}>
                    ⏰ {order.deliveryTime || t('admin_pref_prefix') + (order.deliveries?.[0]?.timeSlot || t('admin_not_specified'))}
                  </p>
                  <div className="flex items-center gap-2" style={{ fontFamily: "'Montserrat', sans-serif", fontSize: '13px', color: green, fontWeight: 600 }}>
                    {order.paymentMethod === 'cod' ? (
                      <><Truck size={14} /> {t('admin_payment_cod_label')}</>
                    ) : (
                      <><CreditCard size={14} /> {t('admin_payment_card_label')}</>
                    )}
                  </div>
                </div>
              </div>

              {order.notes && (
                <div className="mt-3 p-3 rounded-lg" style={{ background: '#FDF6F2', border: '1px solid #E5DDD0' }}>
                  <p style={{ fontFamily: "'Montserrat', sans-serif", fontSize: '11px', fontWeight: 700, color: '#8A8A8A', textTransform: 'uppercase', marginBottom: '4px' }}>
                    {t('admin_customer_note')}
                  </p>
                  <p style={{ fontFamily: "'Montserrat', sans-serif", fontSize: '13px', color: '#4A4A4A', fontStyle: 'italic' }}>
                    "{order.notes}"
                  </p>
                </div>
              )}

              {/* Order Items */}
              <div className="mt-4 p-4 rounded-xl" style={{ background: '#F8F9FA', border: '1.5px solid #E5DDD0' }}>
                <div className="flex justify-between items-center mb-3">
                  <p style={{ fontFamily: "'Montserrat', sans-serif", fontSize: '11px', fontWeight: 800, color: '#1A1A1A', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    📦 {t('admin_pkg_details')}
                  </p>
                  {order.deliveries && (
                    <span className="text-[10px] font-bold text-gray-400">
                      {order.deliveries.length} {t('admin_delivery_days_label')}
                    </span>
                  )}
                </div>
                <div className="space-y-3">
                  {order.items.map((item, idx) => (
                    <div key={idx} className="flex items-center justify-between text-sm" style={{ fontFamily: "'Montserrat', sans-serif" }}>
                      <div className="flex items-center gap-3">
                        <span className="w-7 h-7 rounded-lg flex items-center justify-center text-[11px] font-bold" style={{ background: green, color: '#fff' }}>
                          {item.quantity}x
                        </span>
                        <div>
                          <p className="font-bold text-[#1A1A1A]">{item.meal.name}</p>
                          {item.isCreditBased && <p className="text-[10px] text-green-700 font-semibold">{t('admin_pkg_credit')}</p>}
                        </div>
                      </div>
                      <span className="font-bold text-[#1A1A1A]">
                        {item.isCreditBased ? '—' : `₺${(item.meal.price * item.quantity).toLocaleString('tr-TR')}`}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Status buttons */}
              <div className="flex flex-wrap gap-2 mt-4 pt-4 border-t" style={{ borderColor: '#F0EDE8' }}>
                {statuses.map(s => {
                  const sc2 = STATUS_BG_COLOR[s];
                  const isActive = order.status === s;
                  return (
                    <button
                      key={s}
                      onClick={() => dispatch({ type: 'UPDATE_ORDER_STATUS', payload: { id: order.id, status: s } })}
                      className="px-3 py-1.5 rounded-xl text-[11px] font-bold cursor-pointer transition-all border"
                      style={{
                        background: isActive ? sc2.bg : '#FFFFFF',
                        color: isActive ? sc2.color : '#8A8A8A',
                        borderColor: isActive ? sc2.color + '40' : '#E5DDD0',
                        fontFamily: "'Montserrat', sans-serif",
                        textTransform: 'uppercase'
                      }}
                    >
                      {statusLabel(s)}
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>}
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
  const { state } = useApp();
  const t = useT(state.lang);
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
      setImageError(t('admin_meal_form_image_err_size'));
      return;
    }
    if (!file.type.startsWith('image/')) {
      setImageError(t('admin_meal_form_image_err_type'));
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
          <label style={lStyle}>{t('admin_meal_form_name')}</label>
          <input value={form.name} onChange={e => f('name', e.target.value)} style={iStyle} placeholder={t('admin_meal_form_name_placeholder')} />
        </div>
        <div className="sm:col-span-2">
          <label style={lStyle}>{t('admin_meal_form_desc')}</label>
          <textarea value={form.description} onChange={e => f('description', e.target.value)} rows={2} style={{ ...iStyle, resize: 'none' }} placeholder={t('admin_meal_form_desc_placeholder')} />
        </div>
        <div className="sm:col-span-2">
          <label style={lStyle}>{t('admin_meal_form_image')}</label>
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
                  {t('admin_meal_form_image_change')}
                </button>
                <button
                  type="button"
                  onClick={() => f('imageUrl', '')}
                  className="px-3 py-1.5 text-xs font-medium cursor-pointer"
                  style={{ color: '#C0392B', fontFamily: "'Montserrat', sans-serif" }}
                >
                  {t('admin_meal_form_image_remove')}
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
                <p style={{ fontFamily: "'Montserrat', sans-serif", fontWeight: 600, color: '#4A4A4A', marginBottom: '4px' }}>{t('admin_meal_form_image_drag')}</p>
                <p style={{ fontFamily: "'Montserrat', sans-serif", fontSize: '12px', color: '#8A8A8A' }}>{t('admin_meal_form_image_hint')}</p>
              </div>
              {imageLoading && <p style={{ marginTop: '8px', fontFamily: "'Montserrat', sans-serif", fontSize: '13px', color: '#8A8A8A' }}>{t('admin_meal_form_image_loading')}</p>}
              {imageError && <p style={{ marginTop: '8px', fontFamily: "'Montserrat', sans-serif", fontSize: '13px', color: '#C0392B' }}>{imageError}</p>}
            </div>
          )}
        </div>
        <div>
          <label style={lStyle}>{t('admin_meal_form_category')}</label>
          <select value={form.category} onChange={e => f('category', e.target.value)} style={{ ...iStyle, cursor: 'pointer' }}>
            <option value="kahvalti">{t('admin_cat_kahvalti')}</option>
            <option value="ana">{t('admin_cat_ana')}</option>
            <option value="kase">{t('admin_cat_kase')}</option>
            <option value="smoothie">{t('admin_cat_smoothie')}</option>
            <option value="tatli">{t('admin_cat_tatli')}</option>
          </select>
        </div>
        <div>
          <label style={lStyle}>{t('admin_meal_form_price')}</label>
          <input type="number" value={form.price} onChange={e => f('price', +e.target.value)} style={iStyle} min={0} />
        </div>
        <div>
          <label style={lStyle}>{t('admin_meal_form_calories')}</label>
          <input type="number" value={form.calories} onChange={e => f('calories', +e.target.value)} style={iStyle} min={0} />
        </div>
        <div>
          <label style={lStyle}>{t('admin_meal_form_protein')}</label>
          <input type="number" value={form.protein} onChange={e => f('protein', +e.target.value)} style={iStyle} min={0} />
        </div>
        <div>
          <label style={lStyle}>{t('admin_meal_form_carbs')}</label>
          <input type="number" value={form.carbs} onChange={e => f('carbs', +e.target.value)} style={iStyle} min={0} />
        </div>
        <div>
          <label style={lStyle}>{t('admin_meal_form_fat')}</label>
          <input type="number" value={form.fat} onChange={e => f('fat', +e.target.value)} style={iStyle} min={0} />
        </div>
        <div className="flex items-center gap-5 pt-2">
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" checked={form.available} onChange={e => f('available', e.target.checked)} style={{ accentColor: green }} />
            <span style={{ fontFamily: "'Montserrat', sans-serif", fontSize: '13px', color: '#4A4A4A' }}>{t('admin_meal_form_available')}</span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" checked={form.featured} onChange={e => f('featured', e.target.checked)} style={{ accentColor: green }} />
            <span style={{ fontFamily: "'Montserrat', sans-serif", fontSize: '13px', color: '#4A4A4A' }}>{t('admin_meal_form_featured')}</span>
          </label>
        </div>
      </div>
      <div className="flex gap-3 mt-5">
        <button onClick={() => onSave(form)} className="flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-semibold cursor-pointer"
          style={{ background: green, color: '#fff', fontFamily: "'Montserrat', sans-serif" }}>
          <Check size={14} /> {t('admin_save')}
        </button>
        <button onClick={onCancel} className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium cursor-pointer"
          style={{ background: '#E5DDD0', color: '#4A4A4A', fontFamily: "'Montserrat', sans-serif" }}>
          <X size={14} /> {t('admin_cancel')}
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
  const t = useT(state.lang);
  const [editing, setEditing] = useState<string | null>(null);
  const [adding, setAdding] = useState(false);

  return (
    <div>
      <div className="flex items-center justify-between mb-5">
        <h2 style={{ fontFamily: "'Montserrat', sans-serif", fontWeight: 700, fontSize: '1.2rem', color: '#1A1A1A' }}>
          {t('admin_meal_management')}
        </h2>
        <button
          onClick={() => { setAdding(true); setEditing(null); }}
          className="flex items-center gap-2 px-4 py-2.5 rounded-full text-sm font-semibold cursor-pointer"
          style={{ background: green, color: '#fff', fontFamily: "'Montserrat', sans-serif" }}
        >
          <Plus size={14} /> {t('admin_meal_add')}
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
                    {meal.available ? t('admin_active_label') : t('admin_hidden_label')}
                  </span>
                  <button onClick={() => { setEditing(meal.id); setAdding(false); }}
                    className="w-8 h-8 rounded-xl flex items-center justify-center cursor-pointer hover:opacity-70"
                    style={{ background: '#F5ECD7', color: gold }}>
                    <Edit3 size={14} />
                  </button>
                  <button
                    onClick={() => { if (window.confirm(t('admin_meal_confirm_delete'))) dispatch({ type: 'DELETE_MEAL', payload: meal.id }); }}
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
  const t = useT(state.lang);
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
          <label style={lStyle}>{t('admin_plan_form_name')}</label>
          <input value={form.name} onChange={e => f('name', e.target.value)} style={iStyle} placeholder={t('admin_plan_form_name_placeholder')} />
        </div>
        <div>
          <label style={lStyle}>{t('admin_plan_form_meal_count')}</label>
          <input type="number" value={form.mealCount} onChange={e => f('mealCount', +e.target.value)} style={iStyle} min={1} />
        </div>
        <div>
          <label style={lStyle}>{t('admin_plan_form_price')}</label>
          <input type="number" value={form.price} onChange={e => f('price', +e.target.value)} style={iStyle} min={0} />
        </div>
        <div>
          <label style={lStyle}>{t('admin_plan_form_price_per_meal')}</label>
          <input type="number" value={form.pricePerMeal} onChange={e => f('pricePerMeal', +e.target.value)} style={iStyle} min={0} />
        </div>
        <div>
          <label style={lStyle}>{t('admin_plan_form_badge')}</label>
          <input value={form.badge ?? ''} onChange={e => f('badge', e.target.value || undefined)} style={iStyle} placeholder="Ör: En Popüler" />
        </div>
        <div className="col-span-2">
          <label style={lStyle}>{t('admin_plan_form_features')}</label>
          {form.features.map((feat, i) => (
            <div key={i} className="flex gap-2 mb-2">
              <input
                value={feat}
                onChange={e => { const nf = [...form.features]; nf[i] = e.target.value; f('features', nf); }}
                style={{ ...iStyle, flex: 1 }}
                placeholder={`${t('admin_plan_form_feature_placeholder')} ${i + 1}`}
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
            {t('admin_plan_form_add_feature')}
          </button>
        </div>
        <div className="col-span-2">
          <label style={lStyle}>{t('admin_plan_form_allowed_meals')}</label>
          <p style={{ fontSize: '11px', color: '#8A8A8A', marginBottom: '10px' }}>
            {t('admin_plan_form_allowed_desc')}
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
              {t('admin_plan_form_popular')}
            </span>
          </label>
        </div>
      </div>
      <div className="flex gap-3 mt-5">
        <button onClick={() => onSave(form)} className="flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-semibold cursor-pointer"
          style={{ background: green, color: '#fff', fontFamily: "'Montserrat', sans-serif" }}>
          <Check size={14} /> {t('admin_save')}
        </button>
        <button onClick={onCancel} className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium cursor-pointer"
          style={{ background: '#E5DDD0', color: '#4A4A4A', fontFamily: "'Montserrat', sans-serif" }}>
          <X size={14} /> {t('admin_cancel')}
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
  const t = useT(state.lang);
  const [editing, setEditing] = useState<string | null>(null);
  const [adding, setAdding] = useState(false);

  return (
    <div>
      <div className="flex items-center justify-between mb-5">
        <h2 style={{ fontFamily: "'Montserrat', sans-serif", fontWeight: 700, fontSize: '1.2rem', color: '#1A1A1A' }}>
          {t('admin_plan_management')}
        </h2>
        <button
          onClick={() => { setAdding(true); setEditing(null); }}
          className="flex items-center gap-2 px-4 py-2.5 rounded-full text-sm font-semibold cursor-pointer"
          style={{ background: green, color: '#fff', fontFamily: "'Montserrat', sans-serif" }}
        >
          <Plus size={14} /> {t('admin_plan_add')}
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
                      {plan.mealCount} {t('admin_plan_meals_count')} · ₺{plan.price.toLocaleString('tr-TR')} · ₺{plan.pricePerMeal}/{t('admin_plan_meals_count')}
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
                      onClick={() => { if (window.confirm(t('admin_plan_confirm_delete'))) dispatch({ type: 'DELETE_PLAN', payload: plan.id }); }}
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
  const t = useT(state.lang);
  const statusLabel = (s: Order['status']) => {
    if (s === 'pending')   return t('admin_status_pending');
    if (s === 'preparing') return t('admin_status_preparing');
    if (s === 'ready')     return t('admin_status_ready');
    if (s === 'delivered') return t('admin_status_delivered');
    return t('admin_status_cancelled');
  };

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
        {t('admin_analytics_title')}
      </h2>

      {/* ROW 1 - 4 Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard title={t('admin_analytics_revenue')} value={`₺${totalRevenue.toLocaleString('tr-TR')}`} icon={() => null} accentColor={green} />
        <div>
          <StatCard
            title={t('admin_stat_orders')}
            value={totalOrders}
            subtext={pendingCount > 0 ? `${pendingCount} ${t('admin_pending_badge')}` : undefined}
          />
        </div>
        <StatCard title={t('admin_analytics_week_revenue')} value={`₺${weekRevenue.toLocaleString('tr-TR')}`} />
        <StatCard title={t('admin_status_delivered')} value={deliveredCount} accentColor={green} />
      </div>

      {/* ROW 2 - Two panels */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Top Meals */}
        <div className="p-5 rounded-xl" style={{ background: '#FFFFFF', border: '1.5px solid #E5DDD0' }}>
          <h3 style={{ fontFamily: "'Montserrat', sans-serif", fontWeight: 700, fontSize: '1rem', color: '#1A1A1A', marginBottom: '16px' }}>
            {t('admin_analytics_top_meals')}
          </h3>
          {topMeals.length === 0 ? (
            <p style={{ fontFamily: "'Montserrat', sans-serif", fontSize: '14px', color: '#8A8A8A', textAlign: 'center', padding: '20px 0' }}>
              {t('admin_analytics_no_meals')}
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
            {t('admin_analytics_plan_dist')}
          </h3>
          <div className="space-y-3">
            {singleOrderCount > 0 && (
              <div className="flex items-center justify-between mb-3">
                <span style={{ fontFamily: "'Montserrat', sans-serif", fontSize: '13px', color: '#4A4A4A' }}>
                  {t('admin_analytics_single')}
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
          {t('admin_analytics_recent')}
        </h3>
        {state.orders.length === 0 ? (
          <p style={{ fontFamily: "'Montserrat', sans-serif", fontSize: '14px', color: '#8A8A8A', textAlign: 'center', padding: '20px 0' }}>
            {t('admin_analytics_no_orders')}
          </p>
        ) : (
          <div className="space-y-0 divide-y" style={{ borderColor: '#E5DDD0' }}>
            {state.orders.slice(0, 5).map(order => {
              const sc = STATUS_BG_COLOR[order.status];
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
                      {order.subscriptionPlan ? order.subscriptionPlan.name : t('admin_analytics_single_label')}
                    </span>
                    <span style={{ fontFamily: "'Montserrat', sans-serif", fontWeight: 600, color: '#1A1A1A' }}>
                      ₺{order.total.toLocaleString('tr-TR')}
                    </span>
                    <span
                      className="px-2.5 py-1 rounded-full text-xs font-semibold"
                      style={{ background: sc.bg, color: sc.color, fontFamily: "'Montserrat', sans-serif" }}
                    >
                      {statusLabel(order.status)}
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
  const t = useT(state.lang);
  const [newButtonInput, setNewButtonInput] = useState('');
  const [saveMessage, setSaveMessage] = useState('');
  const [tempPrompt, setTempPrompt] = useState(state.aiSystemPrompt);
  const [tempButtons, setTempButtons] = useState([...state.aiQuickButtons]);

  const handleToggleAI = () => {
    dispatch({ type: 'SET_AI_ASSISTANT_ENABLED', payload: !state.aiAssistantEnabled });
  };

  const handleSavePrompt = () => {
    dispatch({ type: 'SET_AI_SYSTEM_PROMPT', payload: tempPrompt });
    setSaveMessage(t('admin_ai_prompt_saved') + ' ✓');
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
    setSaveMessage(t('admin_ai_prompt_saved') + ' ✓');
    setTimeout(() => setSaveMessage(''), 2000);
  };

  return (
    <div>
      <h2 style={{ fontFamily: "'Montserrat', sans-serif", fontWeight: 700, fontSize: '1.2rem', color: '#1A1A1A', marginBottom: '20px' }}>
        {t('admin_ai_title_tab')}
      </h2>

      {/* Section 1 - Status Toggle */}
      <div className="mb-6 p-5 rounded-xl" style={{ background: '#FFFFFF', border: '1.5px solid #E5DDD0' }}>
        <h3 style={{ fontFamily: "'Montserrat', sans-serif", fontWeight: 700, fontSize: '1rem', color: '#1A1A1A', marginBottom: '16px' }}>
          {t('admin_ai_status_section')}
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
            {state.aiAssistantEnabled ? t('admin_ai_on') : t('admin_ai_off')}
          </span>
        </button>
      </div>

      {/* Section 2 - System Prompt */}
      <div className="mb-6 p-5 rounded-xl" style={{ background: '#FFFFFF', border: '1.5px solid #E5DDD0' }}>
        <h3 style={{ fontFamily: "'Montserrat', sans-serif", fontWeight: 700, fontSize: '1rem', color: '#1A1A1A', marginBottom: '4px' }}>
          {t('admin_ai_system_section')}
        </h3>
        <p style={{ fontFamily: "'Montserrat', sans-serif", fontSize: '13px', color: '#8A8A8A', marginBottom: '12px' }}>
          {t('admin_ai_system_desc')}
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
            {t('admin_save')}
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
          {t('admin_ai_quick_section')}
        </h3>
        <p style={{ fontFamily: "'Montserrat', sans-serif", fontSize: '13px', color: '#8A8A8A', marginBottom: '12px' }}>
          {t('admin_ai_quick_desc')}
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
              placeholder={t('admin_ai_add_button_placeholder')}
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
              {t('admin_ai_add')}
            </button>
          </div>
        )}
        <button
          onClick={handleSaveButtons}
          className="px-6 py-3 rounded-full text-sm font-semibold cursor-pointer"
          style={{ background: green, color: '#fff', fontFamily: "'Montserrat', sans-serif" }}
        >
          {t('admin_save')}
        </button>
      </div>

      {/* Section 4 - API Status */}
      <div className="p-5 rounded-xl" style={{ background: '#FFFFFF', border: '1.5px solid #E5DDD0' }}>
        <h3 style={{ fontFamily: "'Montserrat', sans-serif", fontWeight: 700, fontSize: '1rem', color: '#1A1A1A', marginBottom: '16px' }}>
          {t('admin_ai_api_section')}
        </h3>
        <div className="flex items-start gap-3 mb-4">
          <div className="w-2.5 h-2.5 rounded-full mt-1" style={{ background: '#FF9800' }} />
          <div>
            <p style={{ fontFamily: "'Montserrat', sans-serif", fontWeight: 600, color: '#1A1A1A', marginBottom: '2px' }}>
              Anthropic API
            </p>
            <p style={{ fontFamily: "'Montserrat', sans-serif", fontSize: '13px', color: '#8A8A8A' }}>
              {t('admin_ai_api_waiting')}
            </p>
            <p style={{ fontFamily: "'Montserrat', sans-serif", fontSize: '12px', color: '#8A8A8A', marginTop: '8px' }}>
              {t('admin_ai_api_desc')}
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
          {t('admin_ai_api_note')}
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
  const t = useT(state.lang);
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
    setSaveMessage(t('admin_ai_prompt_saved') + ' ✓');
    setTimeout(() => setSaveMessage(''), 2000);
  };

  const handleChangePassword = () => {
    setPassError('');
    setPassSuccess('');

    if (currentPass !== state.adminPassword) {
      setPassError(t('admin_settings_pass_current_wrong'));
      return;
    }
    if (newPass.length < 6) {
      setPassError(t('admin_settings_pass_minlen'));
      return;
    }
    if (newPass !== confirmPass) {
      setPassError(t('admin_pass_mismatch'));
      return;
    }

    dispatch({ type: 'CHANGE_ADMIN_PASSWORD', payload: newPass });
    setCurrentPass('');
    setNewPass('');
    setConfirmPass('');
    setPassSuccess(t('admin_settings_pass_changed_ok'));
    setTimeout(() => setPassSuccess(''), 3000);
  };

  return (
    <div>
      <h2 style={{ fontFamily: "'Montserrat', sans-serif", fontWeight: 700, fontSize: '1.2rem', color: '#1A1A1A', marginBottom: '20px' }}>
        {t('admin_settings_title')}
      </h2>

      {/* Section 1 - Order Status */}
      <div className="mb-6 p-5 rounded-xl" style={{ background: '#FFFFFF', border: '1.5px solid #E5DDD0' }}>
        <h3 style={{ fontFamily: "'Montserrat', sans-serif", fontWeight: 700, fontSize: '1rem', color: '#1A1A1A', marginBottom: '16px' }}>
          {t('admin_settings_order_section')}
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
            {tempSettings.isAcceptingOrders ? t('admin_settings_accepting') : t('admin_settings_closed_state')}
          </span>
        </button>
        <div>
          <label style={{ fontFamily: "'Montserrat', sans-serif", fontSize: '12px', color: '#8A8A8A', display: 'block', marginBottom: '8px' }}>
            {t('admin_settings_closed_msg')}
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
          {t('admin_settings_business_section')}
        </h3>
        <div className="space-y-4">
          {[
            { key: 'businessName', label: t('admin_settings_field_name') },
            { key: 'phone', label: t('admin_settings_field_phone') },
            { key: 'email', label: t('admin_settings_field_email') },
            { key: 'deliveryAreas', label: t('admin_settings_field_areas') },
            { key: 'deliveryHours', label: t('admin_settings_field_hours') },
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
          {t('admin_save')}
        </button>
      </div>

      {/* Section 3 - Delivery Settings */}
      <div className="mb-6 p-5 rounded-xl" style={{ background: '#FFFFFF', border: '1.5px solid #E5DDD0' }}>
        <h3 style={{ fontFamily: "'Montserrat', sans-serif", fontWeight: 700, fontSize: '1rem', color: '#1A1A1A', marginBottom: '16px' }}>
          {t('admin_settings_delivery_section')}
        </h3>
        <div className="space-y-4">
          {[
            { key: 'minOrderAmount', label: t('admin_settings_field_min_order') },
            { key: 'freeDeliveryThreshold', label: t('admin_settings_field_free_delivery') },
            { key: 'deliveryFee', label: t('admin_settings_field_delivery_fee') },
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
          {t('admin_settings_delivery_note')}
        </p>
        <button
          onClick={handleSaveSettings}
          className="mt-4 px-6 py-3 rounded-full text-sm font-semibold cursor-pointer"
          style={{ background: green, color: '#fff', fontFamily: "'Montserrat', sans-serif" }}
        >
          {t('admin_save')}
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
          {t('admin_settings_pass_section')}
        </h3>
        <div className="space-y-4">
          <div className="relative">
            <label style={{ fontFamily: "'Montserrat', sans-serif", fontSize: '12px', color: '#8A8A8A', display: 'block', marginBottom: '6px' }}>
              {t('admin_settings_curr_pass')}
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
              {t('admin_settings_new_pass')}
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
              {t('admin_settings_confirm_pass')}
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
          {t('admin_settings_pass_update')}
        </button>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────
// PRODUCTION & DELIVERY TAB
// ─────────────────────────────────────────
function ProductionTab() {
  const { state, dispatch } = useApp();
  const t = useT(state.lang);
  const statusLabel = (s: string) => {
    if (s === 'pending')   return t('admin_status_pending');
    if (s === 'preparing') return t('admin_status_preparing');
    if (s === 'ready')     return t('admin_status_ready');
    if (s === 'delivered') return t('admin_status_delivered');
    if (s === 'cancelled') return t('admin_status_cancelled');
    return s;
  };
  const [dateStr, setDateStr] = useState<string>(new Date().toISOString().split('T')[0]);

  // Find deliveries for this date
  const todaysDeliveries: { order: Order; delivery: any; isAlacarte: boolean }[] = [];

  state.orders.forEach(order => {
    if (order.status === 'cancelled') return;

    if (order.deliveries && order.deliveries.length > 0) {
      const match = order.deliveries.find(d => d.date === dateStr);
      if (match) {
        todaysDeliveries.push({ order, delivery: match, isAlacarte: false });
      }
    } else {
      // Ala-carte orders uses `deliveryDate` (Legacy support)
      const oDate = order.deliveryDate || order.createdAt.split('T')[0];
      if (oDate === dateStr) {
        todaysDeliveries.push({ 
          order, 
          delivery: { id: order.id, date: oDate, status: order.status, items: order.items, timeSlot: order.deliveryTime }, 
          isAlacarte: true 
        });
      }
    }
  });

  // Sort by time slot
  todaysDeliveries.sort((a, b) => (a.delivery.timeSlot || '').localeCompare(b.delivery.timeSlot || ''));

  // Calculate aggregated meal production list
  const productionMap = new Map<string, { meal: Meal, count: number }>();
  todaysDeliveries.forEach(d => {
    d.delivery.items.forEach((item: any) => {
      const existing = productionMap.get(item.meal.id);
      if (existing) {
        existing.count += item.quantity;
      } else {
        productionMap.set(item.meal.id, { meal: item.meal, count: item.quantity });
      }
    });
  });

  const productionList = Array.from(productionMap.values()).sort((a,b) => b.count - a.count);

  const statuses = ['pending', 'preparing', 'ready', 'delivered', 'cancelled'] as const;

  return (
    <div>
      <div className="flex items-center justify-between mb-5">
        <h2 style={{ fontFamily: "'Montserrat', sans-serif", fontWeight: 700, fontSize: '1.2rem', color: '#1A1A1A' }}>
          {t('admin_production_title')}
        </h2>
        <input 
          type="date" 
          value={dateStr} 
          onChange={e => setDateStr(e.target.value)}
          className="px-4 py-2 border rounded-xl outline-none"
          style={{ borderColor: '#E5DDD0', background: '#FFFFFF', fontFamily: "'Montserrat', sans-serif" }}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Üretim Listesi - Mutfak */}
        <div className="lg:col-span-1 p-5 rounded-2xl h-fit" style={{ background: '#FFFFFF', border: '1.5px solid #E5DDD0' }}>
          <h3 className="font-bold mb-4" style={{ color: '#1A1A1A', fontFamily: "'Montserrat', sans-serif" }}>{t('admin_production_kitchen')}</h3>
          {productionList.length === 0 ? (
            <p className="text-sm text-gray-500">{t('admin_production_no_items')}</p>
          ) : (
            <div className="space-y-3">
              {productionList.map(p => (
                <div key={p.meal.id} className="flex justify-between items-center p-3 rounded-xl bg-gray-50 border border-gray-100">
                  <span className="text-sm font-semibold">{p.meal.name}</span>
                  <span className="w-8 h-8 rounded-lg flex items-center justify-center text-white font-bold" style={{ background: green }}>
                    {p.count}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Dağıtım Listesi - Kurye */}
        <div className="lg:col-span-2 p-5 rounded-2xl" style={{ background: '#FFFFFF', border: '1.5px solid #E5DDD0' }}>
          <h3 className="font-bold mb-4" style={{ color: '#1A1A1A', fontFamily: "'Montserrat', sans-serif" }}>{t('admin_production_delivery_list')}</h3>
          {todaysDeliveries.length === 0 ? (
            <p className="text-sm text-gray-500">{t('admin_production_no_deliveries')}</p>
          ) : (
            <div className="space-y-4">
              {todaysDeliveries.map((td, i) => {
                const sc = STATUS_BG_COLOR[td.delivery.status as keyof typeof STATUS_BG_COLOR] || STATUS_BG_COLOR.pending;
                return (
                  <div key={i} className="p-4 rounded-xl border" style={{ borderColor: '#E5DDD0', background: '#FAFAFA' }}>
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-bold text-[#1A1A1A] text-lg">{td.order.customerName}</span>
                          <span className="text-[10px] uppercase font-bold bg-[#E5DDD0] px-2 py-0.5 rounded-full text-[#4A4A4A]">{td.isAlacarte ? t('admin_alacarte_label') : t('admin_subscription_label')}</span>
                          {td.delivery.timeSlot && (
                            <span className="text-[10px] font-bold text-green-700 bg-green-50 px-2 py-0.5 rounded-full border border-green-100">
                              ⏰ {td.delivery.timeSlot}
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-gray-500 max-w-sm mb-1">{td.order.address} {td.order.district ? `(${td.order.district})` : ''}</p>
                        <p className="text-xs text-gray-400 mb-2">📞 {td.order.customerPhone}</p>
                        <p className="text-xs font-semibold text-green-700">{td.delivery.items.map((it: any) => `${it.quantity}x ${it.meal.name}`).join(', ')}</p>
                      </div>
                      <span className="px-2.5 py-1 rounded-full text-[10px] font-bold uppercase" style={{ background: sc.bg, color: sc.color }}>
                        {statusLabel(td.delivery.status)}
                      </span>
                    </div>

                    {/* Status Toggle */}
                    <div className="flex flex-wrap gap-2 pt-3 border-t border-gray-200">
                      {statuses.map(s => {
                        const sc2 = STATUS_BG_COLOR[s];
                        const isActive = td.delivery.status === s;
                        return (
                          <button
                            key={s}
                            onClick={() => {
                              if (td.isAlacarte) {
                                dispatch({ type: 'UPDATE_ORDER_STATUS', payload: { id: td.order.id, status: s } });
                              } else {
                                dispatch({ type: 'UPDATE_ORDER_DELIVERY_STATUS', payload: { orderId: td.order.id, deliveryId: td.delivery.id, status: s } });
                              }
                            }}
                            className="px-3 py-1 text-[11px] rounded-lg cursor-pointer transition-all border"
                            style={{
                              background: isActive ? sc2.bg : '#FFFFFF',
                              color: isActive ? sc2.color : '#8A8A8A',
                              borderColor: isActive ? sc2.color : '#E5DDD0',
                              fontWeight: isActive ? 700 : 500
                            }}
                          >
                            {statusLabel(s)}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────
// DELIVERY BOARD TAB
// ─────────────────────────────────────────
function DeliveryBoardTab() {
  const { state, dispatch } = useApp();
  const t = useT(state.lang);

  const todayStr = new Date().toISOString().split('T')[0];
  const [selectedDate, setSelectedDate] = useState<string>(todayStr);

  const locale = state.lang === 'tr' ? 'tr-TR' : state.lang === 'ru' ? 'ru-RU' : 'en-US';

  const goDay = (offset: number) => {
    const d = new Date(selectedDate + 'T00:00:00');
    d.setDate(d.getDate() + offset);
    setSelectedDate(d.toISOString().split('T')[0]);
  };

  const friendlyDate = new Date(selectedDate + 'T00:00:00').toLocaleDateString(locale, {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
  });

  type DeliveryEntry = {
    orderId: string;
    deliveryId: string;
    mealName: string;
    mealId?: string;
    timeSlot: string;
    status: ScheduledDelivery['status'];
    customerName: string;
    customerPhone: string;
    address: string;
    orderNumber: string;
  };

  const allDeliveries: DeliveryEntry[] = [];
  state.orders.forEach(order => {
    if (!order.deliveries?.length) return;
    order.deliveries.forEach(del => {
      const delDay = del.day ?? del.date ?? '';
      if (delDay !== selectedDate) return;
      allDeliveries.push({
        orderId: order.id,
        deliveryId: del.id,
        mealName: del.mealName ?? del.items?.map(i => i.meal.name).join(', ') ?? '',
        mealId: del.mealId,
        timeSlot: del.timeSlot ?? '',
        status: del.status,
        customerName: order.customerName,
        customerPhone: order.customerPhone,
        address: order.deliveryType === 'teslimat'
          ? [order.address, order.district].filter(Boolean).join(', ')
          : '',
        orderNumber: order.orderNumber,
      });
    });
  });

  const totalCount = allDeliveries.length;
  const deliveredCount = allDeliveries.filter(d => d.status === 'delivered').length;
  const pendingCount = allDeliveries.filter(d => d.status !== 'delivered' && d.status !== 'cancelled').length;

  const SLOT_COLORS: Record<string, string> = { morning: '#FEF9C3', lunch: '#DBEAFE', evening: '#F3E8FF' };
  const SLOT_TEXT: Record<string, string> = { morning: '#854D0E', lunch: '#1E40AF', evening: '#6B21A8' };

  const DELIVERY_STATUS: Record<ScheduledDelivery['status'], { bg: string; color: string; label: string }> = {
    scheduled:        { bg: '#EEF2FF', color: '#4338CA', label: 'Planlandı' },
    pending:          { bg: '#FEF9C3', color: '#854D0E', label: t('admin_delivery_pending') },
    preparing:        { bg: '#DBEAFE', color: '#1E40AF', label: t('admin_delivery_preparing') },
    ready:            { bg: '#D1FAE5', color: '#065F46', label: 'Hazır' },
    out_for_delivery: { bg: '#BFDBFE', color: '#1D4ED8', label: t('admin_delivery_on_the_way') },
    delivered:        { bg: '#E8F0E8', color: '#1E3F30', label: t('admin_delivery_delivered') },
    cancelled:        { bg: '#FEE2E2', color: '#991B1B', label: t('admin_delivery_cancelled') },
  };

  const ACTION_BUTTONS: Array<{ status: ScheduledDelivery['status']; bg: string; color: string; label: string }> = [
    { status: 'preparing',        bg: '#FEF9C3', color: '#854D0E', label: t('admin_delivery_preparing') },
    { status: 'out_for_delivery', bg: '#BFDBFE', color: '#1D4ED8', label: t('admin_delivery_on_the_way') },
    { status: 'delivered',        bg: '#D1FAE5', color: '#065F46', label: t('admin_delivery_delivered') },
    { status: 'cancelled',        bg: '#FEE2E2', color: '#991B1B', label: t('admin_delivery_cancelled') },
  ];

  const visibleButtons = (current: ScheduledDelivery['status']) => {
    if (current === 'delivered' || current === 'cancelled') return [];
    if (current === 'out_for_delivery') return ACTION_BUTTONS.filter(b => b.status !== 'preparing');
    if (current === 'preparing') return ACTION_BUTTONS.filter(b => b.status !== 'preparing');
    return ACTION_BUTTONS;
  };

  const getMealEmojiLocal = (mealId?: string): string => {
    const meal = mealId ? state.adminMeals.find(m => m.id === mealId) : undefined;
    if (meal) return getMealEmoji(meal);
    return '🍽️';
  };

  const slots: Array<{ key: 'morning' | 'lunch' | 'evening'; label: string; range: string }> = [
    { key: 'morning', label: t('chk_slot_morning'), range: '08:00–10:00' },
    { key: 'lunch',   label: t('chk_slot_lunch'),   range: '12:00–14:00' },
    { key: 'evening', label: t('chk_slot_evening'), range: '18:00–20:00' },
  ];

  return (
    <div>
      {/* Summary counters */}
      <div className="grid grid-cols-3 gap-3 mb-6">
        {[
          { label: t('admin_delivery_total'),     value: totalCount,     bg: '#F8F9FA', color: '#1A1A1A' },
          { label: t('admin_delivery_delivered'),  value: deliveredCount, bg: '#D1FAE5', color: '#065F46' },
          { label: t('admin_delivery_pending'),    value: pendingCount,   bg: '#FEF9C3', color: '#854D0E' },
        ].map(({ label, value, bg, color }) => (
          <div key={label} className="p-4 rounded-2xl text-center" style={{ background: bg, border: '1.5px solid #E5DDD0' }}>
            <p style={{ fontFamily: "'Montserrat', sans-serif", fontSize: '1.8rem', fontWeight: 800, color }}>{value}</p>
            <p style={{ fontFamily: "'Montserrat', sans-serif", fontSize: '11px', fontWeight: 600, color, textTransform: 'uppercase', letterSpacing: '0.05em', marginTop: '2px' }}>{label}</p>
          </div>
        ))}
      </div>

      {/* Date navigation */}
      <div className="flex items-center gap-3 mb-6 p-4 rounded-2xl" style={{ background: '#FFFFFF', border: '1.5px solid #E5DDD0' }}>
        <button
          onClick={() => goDay(-1)}
          className="w-9 h-9 rounded-xl flex items-center justify-center cursor-pointer hover:opacity-70 flex-shrink-0"
          style={{ background: '#F5F5F5', color: '#4A4A4A', fontSize: '1.1rem', fontWeight: 700 }}
        >
          ‹
        </button>
        <div className="flex-1 text-center">
          <p style={{ fontFamily: "'Montserrat', sans-serif", fontWeight: 700, fontSize: '15px', color: '#1A1A1A', textTransform: 'capitalize' }}>
            {friendlyDate}
          </p>
          {selectedDate !== todayStr && (
            <button
              onClick={() => setSelectedDate(todayStr)}
              className="mt-1 px-3 py-0.5 rounded-full text-xs font-bold cursor-pointer"
              style={{ background: '#E8F0E8', color: green, fontFamily: "'Montserrat', sans-serif" }}
            >
              {t('admin_delivery_today')}
            </button>
          )}
        </div>
        <button
          onClick={() => goDay(1)}
          className="w-9 h-9 rounded-xl flex items-center justify-center cursor-pointer hover:opacity-70 flex-shrink-0"
          style={{ background: '#F5F5F5', color: '#4A4A4A', fontSize: '1.1rem', fontWeight: 700 }}
        >
          ›
        </button>
      </div>

      {/* Time slot sections */}
      {slots.map(slot => {
        const slotDeliveries = allDeliveries.filter(d => d.timeSlot === slot.key);
        return (
          <div key={slot.key} className="mb-6">
            {/* Slot header */}
            <div className="flex items-center gap-3 mb-3 px-1">
              <span className="px-3 py-1.5 rounded-xl text-xs font-bold"
                style={{ background: SLOT_COLORS[slot.key] ?? '#F5F5F5', color: SLOT_TEXT[slot.key] ?? '#4A4A4A', fontFamily: "'Montserrat', sans-serif" }}>
                {slot.label}
              </span>
              <span style={{ fontFamily: "'Montserrat', sans-serif", fontSize: '12px', color: '#8A8A8A', fontWeight: 600 }}>
                {slot.range}
              </span>
              {slotDeliveries.length > 0 && (
                <span className="w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold"
                  style={{ background: green, color: '#fff', fontFamily: "'Montserrat', sans-serif" }}>
                  {slotDeliveries.length}
                </span>
              )}
            </div>

            {slotDeliveries.length === 0 ? (
              <div className="py-4 px-5 rounded-xl" style={{ background: '#F8F9FA', border: '1.5px dashed #E5DDD0' }}>
                <p style={{ fontFamily: "'Montserrat', sans-serif", fontSize: '13px', color: '#8A8A8A', textAlign: 'center' }}>
                  {t('admin_delivery_empty_slot')}
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {slotDeliveries.map(del => {
                  const sc = DELIVERY_STATUS[del.status] ?? DELIVERY_STATUS.pending;
                  const btns = visibleButtons(del.status);
                  return (
                    <div key={del.deliveryId} className="p-4 rounded-xl" style={{ background: '#FFFFFF', border: '1.5px solid #E5DDD0' }}>
                      {/* Top row */}
                      <div className="flex flex-wrap items-start justify-between gap-2 mb-3">
                        <div className="flex items-center gap-2">
                          <span style={{ fontSize: '1.4rem' }}>{getMealEmojiLocal(del.mealId)}</span>
                          <div>
                            <p style={{ fontFamily: "'Montserrat', sans-serif", fontWeight: 700, fontSize: '15px', color: '#1A1A1A' }}>
                              {del.mealName || '—'}
                            </p>
                            <p style={{ fontFamily: "'Montserrat', sans-serif", fontSize: '11px', color: '#8A8A8A' }}>
                              {del.orderNumber}
                            </p>
                          </div>
                        </div>
                        <span className="px-2.5 py-1 rounded-full text-[11px] font-bold flex-shrink-0"
                          style={{ background: sc.bg, color: sc.color, fontFamily: "'Montserrat', sans-serif" }}>
                          {sc.label}
                        </span>
                      </div>

                      {/* Customer info */}
                      <div className="mb-3 space-y-0.5">
                        <p style={{ fontFamily: "'Montserrat', sans-serif", fontSize: '13px', fontWeight: 600, color: '#1A1A1A' }}>
                          {del.customerName}
                        </p>
                        <p style={{ fontFamily: "'Montserrat', sans-serif", fontSize: '12px', color: '#4A4A4A' }}>
                          📞 {del.customerPhone}
                        </p>
                        <p style={{ fontFamily: "'Montserrat', sans-serif", fontSize: '12px', color: '#4A4A4A' }}>
                          📍 {del.address || t('admin_delivery_no_address')}
                        </p>
                      </div>

                      {/* Action buttons */}
                      {btns.length > 0 && (
                        <div className="flex flex-wrap gap-2 pt-3 border-t" style={{ borderColor: '#F0EDE8' }}>
                          {btns.map(btn => (
                            <button
                              key={btn.status}
                              onClick={() => dispatch({ type: 'UPDATE_DELIVERY_STATUS', payload: { orderId: del.orderId, deliveryId: del.deliveryId, status: btn.status } })}
                              className="px-3 py-1.5 rounded-xl text-[11px] font-bold cursor-pointer border transition-all"
                              style={{
                                background: del.status === btn.status ? btn.bg : '#FFFFFF',
                                color: del.status === btn.status ? btn.color : '#8A8A8A',
                                borderColor: del.status === btn.status ? btn.color + '60' : '#E5DDD0',
                                fontFamily: "'Montserrat', sans-serif",
                              }}
                            >
                              {btn.label}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        );
      })}
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
    { id: 'orders',     label: t('admin_orders_tab'),      icon: <ShoppingBag size={16} /> },
    { id: 'delivery',   label: t('admin_delivery_board'),  icon: <Truck size={16} /> },
    { id: 'production', label: t('admin_production'),      icon: <Truck size={16} /> },
    { id: 'menu',       label: t('admin_meal_management'), icon: <UtensilsCrossed size={16} /> },
    { id: 'packages',   label: t('admin_plan_management'), icon: <Package size={16} /> },
    { id: 'analytics',  label: t('admin_analytics'),       icon: <BarChart2 size={16} /> },
    { id: 'ai',         label: t('admin_assistant'),       icon: <Bot size={16} /> },
    { id: 'settings',   label: t('admin_settings'),        icon: <Settings size={16} /> },
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
              title={t('admin_logout')}
            >
              <ArrowLeft size={16} style={{ color: '#4A4A4A' }} />
            </button>
            <span style={{ fontFamily: "'Montserrat', sans-serif", fontWeight: 700, color: '#1A1A1A', fontSize: '1.1rem' }}>
              {t('admin_title')}
            </span>
          </div>

          {/* Right: pending badge + logout */}
          <div className="flex items-center gap-3">
            {pendingCount > 0 && (
              <span className="px-2.5 py-1 rounded-full text-xs font-bold"
                style={{ background: '#FEF9C3', color: '#854D0E', fontFamily: "'Montserrat', sans-serif" }}>
                {pendingCount} {t('admin_pending_badge')}
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
              {/* Production Readiness Banner */}
              <div className="mb-6 p-4 rounded-2xl flex items-center justify-between border" style={{ background: '#FFFDF9', borderColor: gold }}>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full flex items-center justify-center bg-amber-100">
                    <Settings size={20} className="text-amber-600 animate-spin-slow" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-[#1A1A1A]">{t('admin_db_banner_title')}</p>
                    <p className="text-xs text-[#8A8A8A]">{t('admin_db_banner_desc')}</p>
                  </div>
                </div>
                <button 
                  onClick={() => setTab('settings')}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-white transition-transform active:scale-95" 
                  style={{ background: gold }}
                >
                  {t('admin_db_connect')}
                </button>
              </div>

              {tab === 'orders'     && <OrdersTab />}
              {tab === 'delivery'   && <DeliveryBoardTab />}
              {tab === 'production' && <ProductionTab />}
              {tab === 'menu'       && <MenuTab />}
              {tab === 'packages'   && <PackagesTab />}
              {tab === 'analytics'  && <AnalyticsTab />}
              {tab === 'ai'         && <AIAssistantTab />}
              {tab === 'settings'   && <SettingsTab />}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

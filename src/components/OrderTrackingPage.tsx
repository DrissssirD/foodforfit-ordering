import { useState, useEffect, useMemo } from 'react';
import { useApp } from '../store';
import { useT, type TKey } from '../i18n';
import type { Order, RescheduleRequest, TimeSlot } from '../types';
import { ChevronRight } from 'lucide-react';

const green = '#1E3F30';

type OrderStatus = 'pending' | 'preparing' | 'ready' | 'delivered' | 'cancelled';

const dayKeyMap: Record<number, TKey> = {
  0: 'chk_day_sun', 1: 'chk_day_mon', 2: 'chk_day_tue',
  3: 'chk_day_wed', 4: 'chk_day_thu', 5: 'chk_day_fri', 6: 'chk_day_sat',
};

const isTypedSlot = (s: unknown): s is TimeSlot =>
  s === 'morning' || s === 'lunch' || s === 'evening';

export default function OrderTrackingPage() {
  const { state, dispatch } = useApp();
  const t = useT(state.lang);
  const [searchInput, setSearchInput] = useState(state.trackingOrderNumber || '');
  const [foundOrder, setFoundOrder] = useState<Order | null>(null);
  const [searchAttempted, setSearchAttempted] = useState(false);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  const [trackingOrderNumber, setTrackingOrderNumber] = useState<string | null>(state.trackingOrderNumber);

  // Reschedule state
  const [openRescheduleId, setOpenRescheduleId] = useState<string | null>(null);
  const [rescheduleDay, setRescheduleDay] = useState('');
  const [rescheduleSlot, setRescheduleSlot] = useState<TimeSlot | ''>('');
  const [rescheduleReason, setRescheduleReason] = useState('');
  const [rescheduleError, setRescheduleError] = useState('');
  const [successDeliveryIds, setSuccessDeliveryIds] = useState<Set<string>>(new Set());

  const sevenDays = useMemo(() => {
    const days: Date[] = [];
    const base = new Date();
    for (let i = 1; i <= 7; i++) {
      const d = new Date(base);
      d.setDate(base.getDate() + i);
      days.push(d);
    }
    return days;
  }, []);

  const localeLang = state.lang === 'tr' ? 'tr-TR' : state.lang === 'ru' ? 'ru-RU' : 'en-US';
  const formatDayOption = (d: Date) =>
    `${t(dayKeyMap[d.getDay()])} ${d.getDate()} ${d.toLocaleDateString(localeLang, { month: 'short' })}`;

  const slotLabel = (slot: string) =>
    slot === 'morning' ? t('chk_slot_morning')
    : slot === 'lunch' ? t('chk_slot_lunch')
    : slot === 'evening' ? t('chk_slot_evening')
    : slot;

  const STATUS_COLORS: Record<OrderStatus, { bg: string; color: string }> = {
    pending: { bg: '#F5ECD7', color: '#C8A97A' },
    preparing: { bg: '#E8F0E8', color: '#1E3F30' },
    ready: { bg: '#E0F2FE', color: '#0369A1' },
    delivered: { bg: '#DCFCE7', color: '#15803D' },
    cancelled: { bg: '#FEE2E2', color: '#C0392B' },
  };

  const statusLabel = (s: OrderStatus) => {
    switch (s) {
      case 'pending': return t('status_pending');
      case 'preparing': return t('status_preparing');
      case 'ready': return t('status_ready');
      case 'delivered': return t('status_delivered');
      case 'cancelled': return t('status_cancelled');
    }
  };

  const steps: { key: OrderStatus; icon: string }[] = [
    { key: 'pending', icon: '📝' },
    { key: 'preparing', icon: '👨‍🍳' },
    { key: 'ready', icon: '🥡' },
    { key: 'delivered', icon: '🚚' },
  ];

  useEffect(() => {
    if (trackingOrderNumber) {
      const order = state.orders.find(o => o.orderNumber.toUpperCase() === trackingOrderNumber.toUpperCase());
      setFoundOrder(order || null);
      if (order) setLastUpdate(new Date());
    }
  }, [trackingOrderNumber, state.orders]);

  useEffect(() => {
    const interval = setInterval(() => {
      if (trackingOrderNumber) {
        const updated = state.orders.find(o => o.orderNumber.toUpperCase() === trackingOrderNumber.toUpperCase());
        if (updated) {
          setFoundOrder(updated);
          setLastUpdate(new Date());
        }
      }
    }, 30000);
    return () => clearInterval(interval);
  }, [trackingOrderNumber, state.orders]);

  const handleSearch = () => {
    const query = searchInput.trim().toUpperCase();
    if (!query) {
      setFoundOrder(null);
      setTrackingOrderNumber(null);
      setSearchAttempted(false);
      return;
    }
    setTrackingOrderNumber(query);
    setSearchAttempted(true);
  };

  const getStepStatus = (stepKey: OrderStatus) => {
    if (!foundOrder) return 'upcoming';
    const statusOrder: OrderStatus[] = ['pending', 'preparing', 'ready', 'delivered'];
    const stepIndex = statusOrder.indexOf(stepKey);
    const currentIndex = statusOrder.indexOf(foundOrder.status as OrderStatus);
    if (foundOrder.status === 'delivered') return 'completed';
    if (stepIndex < currentIndex) return 'completed';
    if (stepIndex === currentIndex) return 'active';
    return 'upcoming';
  };

  const openReschedule = (deliveryId: string) => {
    setOpenRescheduleId(deliveryId);
    setRescheduleDay('');
    setRescheduleSlot('');
    setRescheduleReason('');
    setRescheduleError('');
  };

  const submitReschedule = (order: Order, delId: string, currentDay: string, currentSlot: TimeSlot, mealName: string) => {
    if (!rescheduleDay || !rescheduleSlot) {
      setRescheduleError(t('track_reschedule_invalid'));
      return;
    }
    if (rescheduleDay === currentDay && rescheduleSlot === currentSlot) {
      setRescheduleError(t('track_reschedule_invalid'));
      return;
    }
    const req: RescheduleRequest = {
      id: `rr-${Date.now()}-${Math.random().toString(36).slice(2)}`,
      orderId: order.id,
      deliveryId: delId,
      mealName,
      customerName: order.customerName,
      customerPhone: order.customerPhone,
      originalDay: currentDay,
      originalTimeSlot: currentSlot,
      requestedDay: rescheduleDay,
      requestedTimeSlot: rescheduleSlot,
      reason: rescheduleReason,
      status: 'pending',
      createdAt: new Date().toISOString(),
    };
    dispatch({ type: 'ADD_RESCHEDULE_REQUEST', payload: req });
    setSuccessDeliveryIds(prev => new Set([...prev, delId]));
    setOpenRescheduleId(null);
    setRescheduleDay('');
    setRescheduleSlot('');
    setRescheduleReason('');
    setRescheduleError('');
  };

  const iStyle = {
    width: '100%', padding: '8px 12px', borderRadius: '10px',
    border: '1.5px solid #E5DDD0', background: '#FFFFFF',
    fontSize: '13px', fontFamily: "'Montserrat', sans-serif",
    color: '#1A1A1A', outline: 'none',
  };

  return (
    <div className="pb-16 px-5" style={{ background: '#FDF6F2' }}>
      <div className="max-w-lg mx-auto pt-8">
        {/* Page Title */}
        <div className="mb-10">
          <h1 style={{ fontFamily: "'Montserrat', sans-serif", fontSize: '1.8rem', color: '#1A1A1A', fontWeight: 800 }}>
            {t('track_title')}
          </h1>
        </div>

        {/* My Orders Section */}
        {state.myOrderNumbers && state.myOrderNumbers.length > 0 && !foundOrder && (
          <div className="mb-8">
            <h3 style={{ fontFamily: "'Montserrat', sans-serif", fontSize: '12px', fontWeight: 700, color: '#8A8A8A', textTransform: 'uppercase', marginBottom: '12px', letterSpacing: '0.05em' }}>
              {t('track_recent')}
            </h3>
            <div className="grid grid-cols-1 gap-3">
              {state.orders
                .filter(o => state.myOrderNumbers.includes(o.orderNumber))
                .slice(0, 3)
                .map(order => (
                  <button
                    key={order.id}
                    onClick={() => {
                      setSearchInput(order.orderNumber);
                      setTrackingOrderNumber(order.orderNumber);
                    }}
                    className="flex items-center justify-between p-4 rounded-2xl transition-all cursor-pointer text-left bg-white border border-[#E5DDD0] hover:border-[#1E3F30] hover:shadow-md"
                  >
                    <div>
                      <div className="font-bold text-sm" style={{ color: '#1A1A1A' }}>{order.orderNumber}</div>
                      <div className="text-xs text-gray-400 mt-1">{new Date(order.createdAt).toLocaleDateString(localeLang)}</div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-[10px] font-bold px-2.5 py-1 rounded-full uppercase" style={{
                        background: STATUS_COLORS[order.status]?.bg || '#F5F5F5',
                        color: STATUS_COLORS[order.status]?.color || '#8A8A8A'
                      }}>
                        {statusLabel(order.status)}
                      </span>
                      <ChevronRight size={16} color="#8A8A8A" />
                    </div>
                  </button>
                ))}
            </div>
          </div>
        )}

        {/* Search Box */}
        <div className="mb-10">
          <div className="flex gap-2">
            <input
              type="text"
              placeholder={t('track_search_placeholder')}
              value={searchInput}
              onChange={e => setSearchInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSearch()}
              style={{
                flex: 1, padding: '14px 20px', borderRadius: '16px',
                border: '1.5px solid #E5DDD0', background: '#FFFFFF',
                fontSize: '15px', fontFamily: "'Montserrat', sans-serif",
                color: '#1A1A1A', outline: 'none',
              }}
            />
            <button
              onClick={handleSearch}
              className="px-6 py-3 rounded-full font-bold cursor-pointer transition-transform active:scale-95"
              style={{ background: green, color: '#fff', fontFamily: "'Montserrat', sans-serif", fontSize: '15px' }}
            >
              {t('track_search')}
            </button>
          </div>
        </div>

        {/* Not Found Message */}
        {searchAttempted && !foundOrder && (
          <div className="text-center p-8 rounded-3xl" style={{ background: '#FFF', border: '1.5px solid #FEE2E2' }}>
            <p style={{ color: '#C0392B', fontSize: '15px', fontWeight: 600, fontFamily: "'Montserrat', sans-serif" }}>
              {t('track_not_found')}
            </p>
            <p style={{ color: '#8A8A8A', fontSize: '13px', marginTop: '4px', fontFamily: "'Montserrat', sans-serif" }}>
              {t('track_not_found_sub')}
            </p>
          </div>
        )}

        {/* Order Details */}
        {foundOrder && (
          <div className="animate-fade-in">
            <div className="mb-6 p-6 rounded-3xl" style={{ background: '#FFFFFF', border: '1.5px solid #E5DDD0' }}>
              <div className="flex justify-between items-start mb-6 pb-6 border-b border-[#F0EDE8]">
                <div>
                  <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-1">{t('track_status')}</p>
                  <p className="font-bold text-lg" style={{ color: STATUS_COLORS[foundOrder.status].color }}>
                    {statusLabel(foundOrder.status)}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-1">{t('track_order_no')}</p>
                  <p className="font-bold text-lg text-[#1A1A1A]">{foundOrder.orderNumber}</p>
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex justify-between items-center text-sm">
                  <span className="text-gray-500">{t('track_customer')}</span>
                  <span className="font-semibold text-gray-900">{foundOrder.customerName}</span>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span className="text-gray-500">{t('track_total')}</span>
                  <span className="font-bold text-gray-900">₺{foundOrder.total.toLocaleString('tr-TR')}</span>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span className="text-gray-500">{t('track_payment')}</span>
                  <span className="text-gray-900 font-medium">
                    {foundOrder.paymentMethod === 'cod' ? t('track_payment_cod') : t('track_payment_card')}
                  </span>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span className="text-gray-500">{t('track_date')}</span>
                  <span className="text-gray-900">{new Date(foundOrder.createdAt).toLocaleString(localeLang)}</span>
                </div>
              </div>
            </div>

            {/* Visual Tracker - Ala carte orders */}
            {(!foundOrder.deliveries || foundOrder.deliveries.length === 0) && foundOrder.status !== 'cancelled' && (
              <div className="p-6 rounded-3xl bg-white border border-[#E5DDD0]">
                <div className="flex flex-col gap-8 relative">
                  {steps.map((step, i) => {
                    const status = getStepStatus(step.key);
                    const isCompleted = status === 'completed';
                    const isActive = status === 'active';
                    return (
                      <div key={step.key} className="flex items-center gap-4 relative z-10">
                        <div
                          className="w-12 h-12 rounded-2xl flex items-center justify-center text-xl transition-all duration-500"
                          style={{
                            background: isCompleted || isActive ? green : '#F5F5F5',
                            color: isCompleted || isActive ? '#fff' : '#8A8A8A',
                            boxShadow: isActive ? `0 8px 24px ${green}40` : 'none',
                            transform: isActive ? 'scale(1.1)' : 'scale(1)',
                          }}
                        >
                          {isCompleted ? '✓' : step.icon}
                        </div>
                        <div>
                          <p className={`font-bold text-sm ${isActive ? 'text-gray-900' : 'text-gray-500'}`} style={{ color: isActive ? green : undefined }}>
                            {statusLabel(step.key)}
                          </p>
                          {isActive && <p className="text-[11px] text-[#1E3F30] font-semibold animate-pulse">{t('track_processing')}</p>}
                        </div>
                        {i < steps.length - 1 && (
                          <div className="absolute left-6 top-10 w-0.5 h-10 -z-10" style={{ background: isCompleted ? green : '#F0EDE8' }} />
                        )}
                      </div>
                    );
                  })}
                </div>
                <div className="mt-8 pt-6 border-t border-[#F0EDE8] text-center">
                  <p className="text-[11px] text-gray-400 font-medium">
                    {t('track_last_update')} {lastUpdate ? lastUpdate.toLocaleTimeString(localeLang) : t('track_loading')}
                  </p>
                </div>
              </div>
            )}

            {/* Daily Tracker - Subscription Scheduled Orders */}
            {foundOrder.deliveries && foundOrder.deliveries.length > 0 && foundOrder.status !== 'cancelled' && (
              <div className="p-6 rounded-3xl bg-white border border-[#E5DDD0]">
                <h3 className="font-bold text-[#1A1A1A] mb-4" style={{ fontFamily: "'Montserrat', sans-serif" }}>{t('track_schedule')}</h3>
                <div className="flex flex-col gap-4">
                  {foundOrder.deliveries
                    .slice()
                    .sort((a, b) => new Date(a.date ?? a.day ?? '').getTime() - new Date(b.date ?? b.day ?? '').getTime())
                    .map((del, idx) => {
                      const sc = STATUS_COLORS[del.status as keyof typeof STATUS_COLORS] || STATUS_COLORS.pending;
                      const deliveryDate = del.date ?? del.day ?? '';
                      const deliveryItems = (del.items && del.items.length > 0)
                        ? del.items.map(i => `${i.quantity}x ${i.meal.name}`).join(' • ')
                        : del.mealName ?? '—';
                      const canReschedule = del.status === 'scheduled' && isTypedSlot(del.timeSlot);
                      const currentDay = del.day ?? del.date ?? '';
                      const currentSlot = del.timeSlot as TimeSlot;
                      const mealDisplayName = del.mealName ?? (del.items?.[0]?.meal.name ?? '');

                      return (
                        <div key={del.id}>
                          <div className="p-4 rounded-xl border flex flex-col gap-2 relative overflow-hidden transition-all"
                            style={{ background: del.status === 'delivered' ? '#F4FBF6' : '#FFFFFF', borderColor: del.status === 'delivered' ? `${green}40` : '#F0EDE8' }}>
                            {del.status === 'delivered' && <div className="absolute top-0 right-0 w-1.5 h-full" style={{ background: green }} />}

                            <div className="flex justify-between items-center">
                              <span className="font-bold text-sm text-[#1A1A1A]" style={{ fontFamily: "'Montserrat', sans-serif" }}>
                                {t('track_week_day')} / {idx + 1}. {t('track_day')}
                                <span className="text-gray-400 font-normal ml-1">
                                  — {deliveryDate ? new Date(deliveryDate).toLocaleDateString(localeLang, { day: 'numeric', month: 'short' }) : ''}
                                </span>
                              </span>
                              <div className="flex items-center gap-2 flex-shrink-0">
                                {isTypedSlot(del.timeSlot) && (
                                  <span className="px-2 py-0.5 text-[10px] font-bold rounded-full" style={{ background: '#E8F0E8', color: green, fontFamily: "'Montserrat', sans-serif" }}>
                                    {slotLabel(del.timeSlot)}
                                  </span>
                                )}
                                <span className="px-2.5 py-1 text-[10px] font-bold rounded-full uppercase" style={{ background: sc.bg, color: sc.color, fontFamily: "'Montserrat', sans-serif" }}>
                                  {statusLabel(del.status as OrderStatus)}
                                </span>
                              </div>
                            </div>

                            <div className="text-xs text-gray-500 font-medium leading-relaxed" style={{ fontFamily: "'Montserrat', sans-serif" }}>
                              {deliveryItems}
                            </div>

                            {/* Reschedule button */}
                            {canReschedule && !successDeliveryIds.has(del.id) && (
                              <div className="pt-1">
                                <button
                                  onClick={() => openRescheduleId === del.id ? setOpenRescheduleId(null) : openReschedule(del.id)}
                                  className="text-xs font-bold px-3 py-1.5 rounded-lg cursor-pointer transition-all"
                                  style={{
                                    background: openRescheduleId === del.id ? '#E5DDD0' : '#F5ECD7',
                                    color: '#C8A97A',
                                    fontFamily: "'Montserrat', sans-serif",
                                    border: '1px solid #E5DDD0',
                                  }}
                                >
                                  📅 {t('track_reschedule_btn')}
                                </button>
                              </div>
                            )}
                          </div>

                          {/* Success banner */}
                          {successDeliveryIds.has(del.id) && (
                            <div className="mt-2 px-4 py-3 rounded-xl" style={{ background: '#E8F5E9', border: '1px solid #A5D6A7' }}>
                              <p style={{ color: '#1B5E20', fontSize: '12px', fontWeight: 600, fontFamily: "'Montserrat', sans-serif" }}>
                                ✓ {t('track_reschedule_success')}
                              </p>
                            </div>
                          )}

                          {/* Reschedule panel */}
                          {openRescheduleId === del.id && (
                            <div className="mt-2 p-4 rounded-xl" style={{ background: '#F5F0EB', border: '1.5px solid #E5DDD0' }}>
                              {/* Current delivery info */}
                              <p style={{ fontSize: '11px', fontWeight: 700, color: '#8A8A8A', fontFamily: "'Montserrat', sans-serif", textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '8px' }}>
                                {t('track_reschedule_current')}
                              </p>
                              <p style={{ fontSize: '13px', color: '#1A1A1A', fontFamily: "'Montserrat', sans-serif", fontWeight: 600, marginBottom: '16px' }}>
                                {mealDisplayName && `${mealDisplayName} — `}
                                {deliveryDate ? new Date(deliveryDate).toLocaleDateString(localeLang, { weekday: 'short', day: 'numeric', month: 'short' }) : deliveryDate}
                                {isTypedSlot(del.timeSlot) ? ` — ${slotLabel(del.timeSlot)}` : ''}
                              </p>

                              {/* New day */}
                              <label style={{ fontSize: '11px', fontWeight: 700, color: '#8A8A8A', fontFamily: "'Montserrat', sans-serif", textTransform: 'uppercase', letterSpacing: '0.04em', display: 'block', marginBottom: '6px' }}>
                                {t('track_reschedule_new_day')}
                              </label>
                              <select
                                value={rescheduleDay}
                                onChange={e => { setRescheduleDay(e.target.value); setRescheduleError(''); }}
                                style={{ ...iStyle, marginBottom: '12px', cursor: 'pointer' }}
                              >
                                <option value="" disabled>─</option>
                                {sevenDays.map(d => {
                                  const ds = d.toISOString().split('T')[0];
                                  return <option key={ds} value={ds}>{formatDayOption(d)}</option>;
                                })}
                              </select>

                              {/* New time slot */}
                              <label style={{ fontSize: '11px', fontWeight: 700, color: '#8A8A8A', fontFamily: "'Montserrat', sans-serif", textTransform: 'uppercase', letterSpacing: '0.04em', display: 'block', marginBottom: '6px' }}>
                                {t('track_reschedule_new_time')}
                              </label>
                              <div style={{ display: 'flex', gap: '6px', marginBottom: '12px' }}>
                                {(['morning', 'lunch', 'evening'] as const).map(slot => {
                                  const isActive = rescheduleSlot === slot;
                                  return (
                                    <button key={slot}
                                      onClick={() => { setRescheduleSlot(slot); setRescheduleError(''); }}
                                      style={{
                                        flex: 1, padding: '8px 4px', fontSize: '11px', fontWeight: 700,
                                        borderRadius: '8px', cursor: 'pointer',
                                        background: isActive ? green : '#FFFFFF',
                                        color: isActive ? '#fff' : '#4A4A4A',
                                        border: `1.5px solid ${isActive ? green : '#E5DDD0'}`,
                                        fontFamily: "'Montserrat', sans-serif",
                                      }}>
                                      {slotLabel(slot)}
                                    </button>
                                  );
                                })}
                              </div>

                              {/* Reason */}
                              <input
                                type="text"
                                value={rescheduleReason}
                                onChange={e => setRescheduleReason(e.target.value)}
                                placeholder={t('track_reschedule_reason')}
                                style={{ ...iStyle, marginBottom: '12px' }}
                              />

                              {/* Error */}
                              {rescheduleError && (
                                <p style={{ color: '#C0392B', fontSize: '12px', fontFamily: "'Montserrat', sans-serif", fontWeight: 600, marginBottom: '10px' }}>
                                  ⚠ {rescheduleError}
                                </p>
                              )}

                              {/* Action buttons */}
                              <div style={{ display: 'flex', gap: '8px' }}>
                                <button
                                  onClick={() => submitReschedule(foundOrder, del.id, currentDay, currentSlot, mealDisplayName)}
                                  className="flex-1 py-2.5 rounded-xl text-sm font-bold cursor-pointer transition-all active:scale-95"
                                  style={{ background: green, color: '#fff', fontFamily: "'Montserrat', sans-serif" }}
                                >
                                  {t('track_reschedule_submit')}
                                </button>
                                <button
                                  onClick={() => setOpenRescheduleId(null)}
                                  className="px-5 py-2.5 rounded-xl text-sm font-medium cursor-pointer transition-all"
                                  style={{ background: '#E5DDD0', color: '#4A4A4A', fontFamily: "'Montserrat', sans-serif" }}
                                >
                                  {t('track_reschedule_cancel')}
                                </button>
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                </div>
              </div>
            )}

            <button
              onClick={() => { setFoundOrder(null); setTrackingOrderNumber(null); setSearchInput(''); }}
              className="w-full mt-6 py-4 rounded-2xl font-bold text-sm border border-[#E5DDD0] text-gray-400 hover:bg-white hover:text-gray-600 transition-all"
            >
              {t('track_query_other')}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

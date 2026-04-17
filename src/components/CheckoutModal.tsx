import { useState, useMemo } from 'react';
import { X, Truck, MapPin, CreditCard } from 'lucide-react';
import { useApp, useCartTotal } from '../store';
import { useT, type TKey } from '../i18n';
import type { Order, ScheduledDelivery, TimeSlot, Meal } from '../types';

const green = '#1E3F30';

interface FormData {
  deliveryType: 'teslimat' | 'gelal';
  name: string; phone: string; email: string;
  address: string; district: string; postalCode: string;
  paymentMethod: 'cod' | 'card';
  cardNumber: string; cardExpiry: string; cardCvv: string;
  notes: string;
}

const initialForm: FormData = {
  deliveryType: 'teslimat', name: '', phone: '', email: '',
  address: '', district: '', postalCode: '',
  paymentMethod: 'cod', cardNumber: '', cardExpiry: '', cardCvv: '',
  notes: '',
};

const iStyle = (err: boolean) => ({
  width: '100%', padding: '12px 16px', borderRadius: '12px',
  border: `1.5px solid ${err ? '#C0392B' : '#E5DDD0'}`,
  background: '#FFFFFF', fontSize: '14px', outline: 'none',
  fontFamily: "'Montserrat', sans-serif", color: '#1A1A1A', transition: 'border-color 0.2s',
});

const getMealEmoji = (category: string): string => {
  const map: Record<string, string> = {
    kahvalti: '☕', ana: '🍽️', kase: '🥗', smoothie: '🥤', tatli: '🍰',
  };
  return map[category] ?? '🍱';
};

const dayKeyMap: Record<number, TKey> = {
  0: 'chk_day_sun', 1: 'chk_day_mon', 2: 'chk_day_tue',
  3: 'chk_day_wed', 4: 'chk_day_thu', 5: 'chk_day_fri', 6: 'chk_day_sat',
};

export default function CheckoutModal() {
  const { state, dispatch } = useApp();
  const t = useT(state.lang);
  const [step, setStep] = useState(1);
  const [form, setForm] = useState<FormData>(initialForm);
  const [errors, setErrors] = useState<Partial<Record<keyof FormData, string>>>({});

  const alacarteTotal = useCartTotal(state.cart);
  const isSubscription = !!state.subscriptionPlan;
  const FREE_DELIVERY_THRESHOLD = state.businessSettings.freeDeliveryThreshold;
  const DELIVERY_FEE = state.businessSettings.deliveryFee;
  const deliveryFee = isSubscription ? 0 : (alacarteTotal >= FREE_DELIVERY_THRESHOLD ? 0 : DELIVERY_FEE);
  const orderTotal = isSubscription ? (state.subscriptionPlan?.price ?? 0) : alacarteTotal + deliveryFee;

  const mealInstances = useMemo(() => {
    const arr: Meal[] = [];
    for (const item of state.cart)
      for (let i = 0; i < item.quantity; i++) arr.push(item.meal);
    return arr;
  }, [state.cart]);

  const [mealAssignments, setMealAssignments] = useState<Array<{ day: string; timeSlot: string }>>(
    () => mealInstances.map(() => ({ day: '', timeSlot: '' }))
  );
  const [step2Error, setStep2Error] = useState('');

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

  const conflictMap = useMemo(() => {
    const map: Record<string, number[]> = {};
    mealInstances.forEach((_, i) => {
      const a = mealAssignments[i];
      if (a?.day && a?.timeSlot) {
        const key = `${a.day}-${a.timeSlot}`;
        if (!map[key]) map[key] = [];
        map[key].push(i);
      }
    });
    return map;
  }, [mealInstances, mealAssignments]);

  if (!state.checkoutOpen) return null;

  const formatDay = (d: Date) =>
    `${t(dayKeyMap[d.getDay()])} ${d.getDate()} ${d.toLocaleDateString(localeLang, { month: 'short' })}`;

  const update = (key: keyof FormData, value: any) => {
    setForm(p => ({ ...p, [key]: value }));
    if (errors[key]) setErrors(p => { const n = { ...p }; delete n[key]; return n; });
  };

  const formatPhone = (v: string) => {
    const d = v.replace(/\D/g, '');
    if (d.length <= 2) return d;
    if (d.length <= 5) return `+${d.slice(0,2)} (${d.slice(2)}`;
    if (d.length <= 8) return `+${d.slice(0,2)} (${d.slice(2,5)}) ${d.slice(5)}`;
    if (d.length <= 10) return `+${d.slice(0,2)} (${d.slice(2,5)}) ${d.slice(5,8)} ${d.slice(8)}`;
    return `+${d.slice(0,2)} (${d.slice(2,5)}) ${d.slice(5,8)} ${d.slice(8,10)} ${d.slice(10,12)}`;
  };
  const formatCard = (v: string) => v.replace(/\D/g,'').slice(0,16).replace(/(.{4})/g,'$1 ').trim();
  const formatExp = (v: string) => { const d = v.replace(/\D/g,'').slice(0,4); return d.length > 2 ? `${d.slice(0,2)}/${d.slice(2)}` : d; };

  const validateStep1 = () => {
    const errs: Partial<Record<keyof FormData, string>> = {};
    if (!form.name.trim()) errs.name = t('err_name');
    if (!form.phone || form.phone.replace(/\D/g,'').length < 12) errs.phone = t('err_phone');
    if (!form.email || !/^\S+@\S+\.\S+$/.test(form.email)) errs.email = t('err_email');
    if (form.deliveryType === 'teslimat') {
      if (!form.address.trim()) errs.address = t('err_address');
      if (!form.district.trim()) errs.district = t('err_district');
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const validateStep2 = (): boolean => {
    if (!mealInstances.every((_, i) => mealAssignments[i]?.day && mealAssignments[i]?.timeSlot)) {
      setStep2Error(t('chk_schedule_incomplete'));
      return false;
    }
    const slots = mealInstances.map((_, i) => `${mealAssignments[i].day}-${mealAssignments[i].timeSlot}`);
    if (new Set(slots).size !== slots.length) {
      setStep2Error(t('chk_schedule_conflict'));
      return false;
    }
    setStep2Error('');
    return true;
  };

  const updateAssignment = (idx: number, key: 'day' | 'timeSlot', value: string) => {
    setMealAssignments(prev => prev.map((a, i) => i === idx ? { ...a, [key]: value } : a));
    if (step2Error) setStep2Error('');
  };

  const handleSubmit = () => {
    const errs: Partial<Record<keyof FormData, string>> = {};
    if (form.paymentMethod === 'card') {
      if (form.cardNumber.replace(/\s/g,'').length < 16) errs.cardNumber = t('err_card');
      if (form.cardExpiry.length < 5) {
        errs.cardExpiry = t('err_expiry');
      } else {
        const [mm, yy] = form.cardExpiry.split('/').map(Number);
        const now = new Date();
        const expYear = 2000 + yy;
        const expMonth = mm;
        if (mm < 1 || mm > 12 || expYear < now.getFullYear() || (expYear === now.getFullYear() && expMonth < now.getMonth() + 1)) {
          errs.cardExpiry = t('err_expiry');
        }
      }
      if (form.cardCvv.length < 3) errs.cardCvv = t('err_cvv');
    }
    setErrors(errs);
    if (Object.keys(errs).length === 0) {
      const orderNum = `FFF-${Math.floor(1000 + Math.random() * 9000)}`;
      const scheduledDeliveries: ScheduledDelivery[] = isSubscription
        ? mealInstances.map((meal, i) => ({
            id: `del-${Date.now()}-${i}`,
            mealId: meal.id,
            mealName: meal.name,
            day: mealAssignments[i]?.day ?? '',
            date: mealAssignments[i]?.day ?? '',
            timeSlot: (mealAssignments[i]?.timeSlot ?? 'morning') as TimeSlot,
            status: 'scheduled' as const,
          }))
        : [];
      const order: Order = {
        id: `order-${Date.now()}`, orderNumber: orderNum,
        customerName: form.name, customerPhone: form.phone, customerEmail: form.email,
        items: [...state.cart],
        deliveries: isSubscription ? scheduledDeliveries : undefined,
        total: orderTotal,
        deliveryType: form.deliveryType, address: form.address, district: form.district,
        deliveryDate: mealAssignments[0]?.day ?? '', deliveryTime: '',
        paymentMethod: form.paymentMethod, status: 'pending',
        createdAt: new Date().toISOString(), subscriptionPlan: state.subscriptionPlan,
        notes: form.notes.trim() || undefined,
      };
      dispatch({ type: 'COMPLETE_ORDER', payload: order });
    }
  };

  const labelStyle = { fontSize: '13px', fontWeight: 500, color: '#1A1A1A', fontFamily: "'Montserrat', sans-serif", marginBottom: '8px', display: 'block' };
  const errStyle = { color: '#C0392B', fontSize: '11px', marginTop: '4px', fontFamily: "'Montserrat', sans-serif" };

  const finalStepNum = isSubscription ? 3 : 2;
  const stepsList = isSubscription
    ? [{ n: 1, label: t('chk_info') }, { n: 2, label: t('chk_schedule') }, { n: 3, label: t('chk_payment') }]
    : [{ n: 1, label: t('chk_info') }, { n: 2, label: t('chk_payment') }];

  return (
    <>
      <div className="fixed inset-0 z-[60] flex items-center justify-center p-4"
        style={{ background: 'rgba(26,26,26,0.55)', backdropFilter: 'blur(6px)' }}
        onClick={() => dispatch({ type: 'TOGGLE_CHECKOUT', payload: false })}>
        <div className="w-full max-w-[580px] max-h-[90vh] flex flex-col rounded-3xl overflow-hidden animate-fade-in-up"
          style={{ background: '#FDF6F2', boxShadow: '0 24px 80px rgba(0,0,0,0.2)' }}
          onClick={e => e.stopPropagation()}>

          <div className="flex items-center justify-between px-6 py-5 border-b" style={{ borderColor: '#E5DDD0' }}>
            <h2 style={{ fontFamily: "'Montserrat', sans-serif", fontSize: '1.2rem', color: '#1A1A1A', fontWeight: 700 }}>{t('chk_title')}</h2>
            <button onClick={() => dispatch({ type: 'TOGGLE_CHECKOUT', payload: false })}
              className="w-9 h-9 rounded-2xl flex items-center justify-center cursor-pointer hover:opacity-70" style={{ background: '#E5DDD0' }}>
              <X size={16} style={{ color: '#1A1A1A' }} />
            </button>
          </div>

          <div className="px-6 pt-5 pb-1 flex items-center justify-center gap-2">
            {stepsList.map((s, i) => (
              <div key={s.n} className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-semibold"
                  style={{ background: step >= s.n ? green : '#E5DDD0', color: step >= s.n ? '#fff' : '#8A8A8A', fontFamily: "'Montserrat', sans-serif" }}>
                  {s.n}
                </div>
                <span className="text-xs font-medium" style={{ color: step >= s.n ? green : '#8A8A8A', fontFamily: "'Montserrat', sans-serif", display: window.innerWidth < 400 && i !== step - 1 ? 'none' : 'block' }}>{s.label}</span>
                {i < stepsList.length - 1 && <div className="w-6 h-px mx-1" style={{ background: step > i + 1 ? green : '#E5DDD0' }} />}
              </div>
            ))}
          </div>

          <div className="flex-1 overflow-y-auto px-6 py-5">
            {step === 1 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
                <div>
                  <label style={labelStyle}>{t('chk_delivery_pref')}</label>
                  <div className="grid grid-cols-2 gap-3">
                    {[{ value: 'teslimat' as const, icon: <Truck size={16} />, label: t('chk_delivery') }, { value: 'gelal' as const, icon: <MapPin size={16} />, label: t('chk_pickup') }].map(opt => (
                      <button key={opt.value} onClick={() => update('deliveryType', opt.value)}
                        className="flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-medium cursor-pointer"
                        style={{ border: `1.5px solid ${form.deliveryType === opt.value ? green : '#E5DDD0'}`, background: form.deliveryType === opt.value ? '#E8F0E8' : '#FFFFFF', color: form.deliveryType === opt.value ? green : '#4A4A4A', fontFamily: "'Montserrat', sans-serif" }}>
                        {opt.icon}{opt.label}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label style={labelStyle}>{t('chk_contact')}</label>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    <div><input type="text" placeholder={t('chk_name')} value={form.name} onChange={e => update('name', e.target.value)} style={iStyle(!!errors.name)} />{errors.name && <p style={errStyle}>{errors.name}</p>}</div>
                    <div><input type="tel" placeholder={t('chk_phone')} value={form.phone} onChange={e => update('phone', formatPhone(e.target.value))} style={iStyle(!!errors.phone)} />{errors.phone && <p style={errStyle}>{errors.phone}</p>}</div>
                    <div><input type="email" placeholder={t('chk_email')} value={form.email} onChange={e => update('email', e.target.value)} style={iStyle(!!errors.email)} />{errors.email && <p style={errStyle}>{errors.email}</p>}</div>
                  </div>
                </div>
                {form.deliveryType === 'teslimat' && (
                  <div>
                    <label style={labelStyle}>{t('chk_address_title')}</label>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                      <div><textarea placeholder={t('chk_address')} rows={3} value={form.address} onChange={e => update('address', e.target.value)} style={{ ...iStyle(!!errors.address), resize: 'none' }} />{errors.address && <p style={errStyle}>{errors.address}</p>}</div>
                      <div className="grid grid-cols-2 gap-3">
                        <div><input placeholder={t('chk_district')} value={form.district} onChange={e => update('district', e.target.value)} style={iStyle(!!errors.district)} />{errors.district && <p style={errStyle}>{errors.district}</p>}</div>
                        <input placeholder={t('chk_postal')} value={form.postalCode} onChange={e => update('postalCode', e.target.value)} style={iStyle(false)} />
                      </div>
                    </div>
                  </div>
                )}
                <div>
                  <label style={labelStyle}>{t('chk_notes')}</label>
                  <textarea
                    placeholder={t('chk_notes_placeholder')}
                    rows={2}
                    value={form.notes}
                    onChange={e => update('notes', e.target.value)}
                    style={{ ...iStyle(false), resize: 'none' }}
                  />
                </div>
              </div>
            )}

            {step === 2 && isSubscription && (
              <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div>
                  <h3 style={{ fontSize: '15px', fontWeight: 700, color: '#1A1A1A', fontFamily: "'Montserrat', sans-serif", marginBottom: '4px' }}>
                    {t('chk_schedule_title')}
                  </h3>
                  <p style={{ fontSize: '12px', color: '#8A8A8A', fontFamily: "'Montserrat', sans-serif" }}>
                    {t('chk_schedule_subtitle')}
                  </p>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {mealInstances.map((meal, i) => (
                    <div key={i} style={{ padding: '12px', border: '1.5px solid #E5DDD0', borderRadius: '14px', background: '#FFFFFF', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ fontSize: '18px', lineHeight: '1', flexShrink: 0 }}>{getMealEmoji(meal.category)}</span>
                        <span style={{ fontSize: '13px', fontWeight: 600, color: '#1A1A1A', fontFamily: "'Montserrat', sans-serif", overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {meal.name}
                        </span>
                      </div>
                      <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                        <select
                          value={mealAssignments[i]?.day ?? ''}
                          onChange={e => updateAssignment(i, 'day', e.target.value)}
                          style={{ flex: 1, padding: '7px 8px', borderRadius: '8px', border: '1.5px solid #E5DDD0', fontSize: '12px', fontFamily: "'Montserrat', sans-serif", background: '#FFFFFF', color: '#1A1A1A', outline: 'none', cursor: 'pointer', minWidth: 0 }}
                        >
                          <option value="" disabled>─</option>
                          {sevenDays.map(d => {
                            const ds = d.toISOString().split('T')[0];
                            return <option key={ds} value={ds}>{formatDay(d)}</option>;
                          })}
                        </select>
                        {(['morning', 'lunch', 'evening'] as const).map(slot => {
                          const isActive = mealAssignments[i]?.timeSlot === slot;
                          const lbl = slot === 'morning' ? t('chk_slot_morning') : slot === 'lunch' ? t('chk_slot_lunch') : t('chk_slot_evening');
                          return (
                            <button key={slot} onClick={() => updateAssignment(i, 'timeSlot', slot)}
                              style={{ padding: '7px 6px', fontSize: '10px', fontWeight: 700, borderRadius: '8px', cursor: 'pointer',
                                background: isActive ? green : '#FFFFFF', color: isActive ? '#fff' : '#4A4A4A',
                                border: `1.5px solid ${isActive ? green : '#E5DDD0'}`, fontFamily: "'Montserrat', sans-serif",
                                whiteSpace: 'nowrap', lineHeight: 1.3, flexShrink: 0 }}>
                              {lbl}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>

                {step2Error && (
                  <p style={{ color: '#C0392B', fontSize: '12px', fontFamily: "'Montserrat', sans-serif", fontWeight: 600 }}>
                    ⚠ {step2Error}
                  </p>
                )}

                <div>
                  <h4 style={{ fontSize: '13px', fontWeight: 700, color: '#1A1A1A', fontFamily: "'Montserrat', sans-serif", marginBottom: '8px' }}>
                    {t('chk_schedule_summary')}
                  </h4>
                  <div style={{ overflowX: 'auto' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '40px repeat(7, 1fr)', gap: '3px', minWidth: '320px' }}>
                      <div />
                      {sevenDays.map((d, di) => (
                        <div key={di} style={{ textAlign: 'center', fontSize: '10px', fontWeight: 700, color: '#4A4A4A', fontFamily: "'Montserrat', sans-serif", padding: '3px 2px', lineHeight: 1.4 }}>
                          {t(dayKeyMap[d.getDay()])}<br />{d.getDate()}
                        </div>
                      ))}
                      {(['morning', 'lunch', 'evening'] as const).flatMap(slot => {
                        const slotTime = slot === 'morning' ? '08-10' : slot === 'lunch' ? '12-14' : '18-20';
                        return [
                          <div key={`lbl-${slot}`} style={{ fontSize: '9px', fontWeight: 700, color: '#8A8A8A', fontFamily: "'Montserrat', sans-serif", display: 'flex', alignItems: 'center', justifyContent: 'flex-end', paddingRight: '3px' }}>
                            {slotTime}
                          </div>,
                          ...sevenDays.map((d, di) => {
                            const ds = d.toISOString().split('T')[0];
                            const key = `${ds}-${slot}`;
                            const indices = conflictMap[key] ?? [];
                            const isConflict = indices.length > 1;
                            const hasOne = indices.length === 1;
                            return (
                              <div key={`${slot}-${di}`} style={{
                                textAlign: 'center', borderRadius: '6px', fontSize: '13px',
                                background: isConflict ? '#FFDDD0' : hasOne ? '#E8F5E9' : '#F5F0EB',
                                border: `1px solid ${isConflict ? '#C0392B' : '#E5DDD0'}`,
                                minHeight: '26px', display: 'flex', alignItems: 'center', justifyContent: 'center',
                              }}>
                                {indices.map(idx => getMealEmoji(mealInstances[idx].category)).join('')}
                              </div>
                            );
                          }),
                        ];
                      })}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {step === finalStepNum && (
              <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <label style={labelStyle}>{t('chk_payment_method')}</label>
                {[{ value: 'cod' as const, icon: <Truck size={16} />, title: t('chk_cod'), desc: t('chk_cod_desc') }, { value: 'card' as const, icon: <CreditCard size={16} />, title: t('chk_card'), desc: t('chk_card_desc') }].map(opt => (
                  <button key={opt.value} onClick={() => update('paymentMethod', opt.value)}
                    className="flex items-center gap-4 p-4 rounded-xl text-left cursor-pointer w-full transition-all"
                    style={{ border: `1.5px solid ${form.paymentMethod === opt.value ? green : '#E5DDD0'}`, background: form.paymentMethod === opt.value ? '#E8F0E8' : '#FFFFFF' }}>
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center transition-all" style={{ background: form.paymentMethod === opt.value ? green : '#F5ECD7', color: form.paymentMethod === opt.value ? '#fff' : '#C8A97A' }}>{opt.icon}</div>
                    <div><div style={{ fontSize: '14px', fontWeight: 600, color: '#1A1A1A', fontFamily: "'Montserrat', sans-serif" }}>{opt.title}</div><div style={{ fontSize: '12px', color: '#8A8A8A', fontFamily: "'Montserrat', sans-serif" }}>{opt.desc}</div></div>
                  </button>
                ))}
                {form.paymentMethod === 'card' && (
                  <div className="p-4 rounded-xl animate-fade-in-up" style={{ background: '#FFFFFF', border: '1px solid #E5DDD0' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                      <div><input placeholder={t('chk_card_num')} value={form.cardNumber} onChange={e => update('cardNumber', formatCard(e.target.value))} maxLength={19} style={iStyle(!!errors.cardNumber)} />{errors.cardNumber && <p style={errStyle}>{errors.cardNumber}</p>}</div>
                      <div className="grid grid-cols-2 gap-3">
                        <div><input placeholder={t('chk_expiry')} value={form.cardExpiry} onChange={e => update('cardExpiry', formatExp(e.target.value))} maxLength={5} style={iStyle(!!errors.cardExpiry)} />{errors.cardExpiry && <p style={errStyle}>{errors.cardExpiry}</p>}</div>
                        <div><input placeholder={t('chk_cvv')} value={form.cardCvv} onChange={e => update('cardCvv', e.target.value.replace(/\D/g,'').slice(0,3))} maxLength={3} type="password" style={iStyle(!!errors.cardCvv)} />{errors.cardCvv && <p style={errStyle}>{errors.cardCvv}</p>}</div>
                      </div>
                      <p style={{ fontSize: '11px', color: '#8A8A8A', fontFamily: "'Montserrat', sans-serif", marginTop: '4px' }}>🔒 {t('chk_ssl')}</p>
                    </div>
                  </div>
                )}
                <div className="p-4 rounded-xl" style={{ background: '#FFFFFF', border: '1px solid #E5DDD0' }}>
                  <h4 style={{ fontSize: '14px', fontWeight: 700, color: '#1A1A1A', fontFamily: "'Montserrat', sans-serif", marginBottom: '12px' }}>{t('chk_summary')}</h4>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {isSubscription ? (
                      <div className="flex justify-between" style={{ fontSize: '13px', color: '#4A4A4A', fontFamily: "'Montserrat', sans-serif" }}>
                        <span className="font-semibold text-green-800">📦 {state.subscriptionPlan!.name}</span>
                        <span>{state.subscriptionPlan!.mealCount} {t('cart_items')}</span>
                      </div>
                    ) : (
                      state.cart.map(item => (
                        <div key={item.meal.id} className="flex justify-between" style={{ fontSize: '13px', color: '#4A4A4A', fontFamily: "'Montserrat', sans-serif" }}>
                          <span>{item.meal.name} × {item.quantity}</span>
                          <span className="font-semibold">₺{(item.meal.price * item.quantity).toLocaleString('tr-TR')}</span>
                        </div>
                      ))
                    )}
                    <div style={{ borderTop: '1px solid #E5DDD0', paddingTop: '10px', marginTop: '4px' }}>
                      <div className="flex justify-between" style={{ fontSize: '13px', color: '#8A8A8A', fontFamily: "'Montserrat', sans-serif", marginBottom: '4px' }}>
                        <span>{t('cart_delivery')}</span>
                        <span style={{ color: deliveryFee === 0 ? green : '#1A1A1A', fontWeight: deliveryFee===0 ? 700 : 500 }}>{deliveryFee === 0 ? t('cart_free') : `₺${deliveryFee}`}</span>
                      </div>
                      <div className="flex justify-between" style={{ fontSize: '16px', fontWeight: 800, color: '#1A1A1A', fontFamily: "'Montserrat', sans-serif", paddingTop: '4px' }}>
                        <span>{t('cart_total')}</span><span style={{ color: green }}>₺{orderTotal.toLocaleString('tr-TR')}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="px-6 py-4 border-t flex items-center justify-between gap-3" style={{ borderColor: '#E5DDD0', background: '#FFFFFF' }}>
            {step === 1 ? (
              <>
                <button onClick={() => { dispatch({ type: 'TOGGLE_CHECKOUT', payload: false }); dispatch({ type: 'TOGGLE_CART', payload: true }); }}
                  className="px-5 py-3 text-sm font-medium cursor-pointer hover:bg-gray-50 rounded-xl transition-all" style={{ color: '#4A4A4A', fontFamily: "'Montserrat', sans-serif" }}>{t('chk_back_cart')}</button>
                <button onClick={() => { if (validateStep1()) setStep(2); }}
                  className="px-6 py-3 rounded-full text-sm font-semibold cursor-pointer transition-transform active:scale-95 shadow-md flex-1 text-center"
                  style={{ background: green, color: '#fff', fontFamily: "'Montserrat', sans-serif" }}>{t('chk_continue')}</button>
              </>
            ) : (
              <>
                <button onClick={() => setStep(step - 1)} className="px-5 py-3 text-sm font-medium cursor-pointer hover:bg-gray-50 rounded-xl transition-all" style={{ color: '#4A4A4A', fontFamily: "'Montserrat', sans-serif" }}>{t('chk_back')}</button>
                {step === finalStepNum ? (
                  <button onClick={handleSubmit} className="px-6 py-3 rounded-full text-sm font-semibold cursor-pointer transition-transform active:scale-95 shadow-md flex-1 text-center" style={{ background: green, color: '#fff', fontFamily: "'Montserrat', sans-serif" }}>{t('chk_confirm')}</button>
                ) : (
                  <button
                    onClick={() => {
                      if (step === 2 && isSubscription) {
                        if (validateStep2()) setStep(step + 1);
                      } else {
                        setStep(step + 1);
                      }
                    }}
                    className="px-6 py-3 rounded-full text-sm font-semibold cursor-pointer transition-transform active:scale-95 shadow-md flex-1 text-center"
                    style={{ background: green, color: '#fff', fontFamily: "'Montserrat', sans-serif" }}>{t('chk_continue')}</button>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </>
  );
}

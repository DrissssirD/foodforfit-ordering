import { useState } from 'react';
import { X, Truck, MapPin, CreditCard, Clock } from 'lucide-react';
import { useApp, useCartTotal } from '../store';
import { useT } from '../i18n';
import type { Order } from '../types';

const FREE_DELIVERY_THRESHOLD = 800;
const DELIVERY_FEE = 50;

interface FormData {
  deliveryType: 'teslimat' | 'gelal';
  name: string; phone: string; email: string;
  address: string; district: string; postalCode: string;
  deliveryDate: string; deliveryTime: string;
  paymentMethod: 'cod' | 'card';
  cardNumber: string; cardExpiry: string; cardCvv: string;
}

const initialForm: FormData = {
  deliveryType: 'teslimat', name: '', phone: '', email: '',
  address: '', district: '', postalCode: '',
  deliveryDate: 'today', deliveryTime: '18:00 - 19:00',
  paymentMethod: 'cod', cardNumber: '', cardExpiry: '', cardCvv: '',
};

function getDeliveryDates(lang: string) {
  const dates = []; const today = new Date();
  const dayNamesTR = ['Pazar','Pazartesi','Salı','Çarşamba','Perşembe','Cuma','Cumartesi'];
  const dayNamesEN = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
  const dayNamesRU = ['Вск','Пн','Вт','Ср','Чт','Пт','Сб'];
  const monthsTR = ['Ocak','Şubat','Mart','Nisan','Mayıs','Haziran','Temmuz','Ağustos','Eylül','Ekim','Kasım','Aralık'];
  const monthsEN = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  const monthsRU = ['Янв','Фев','Мар','Апр','Май','Июн','Июл','Авг','Сен','Окт','Ноя','Дек'];
  const days = lang === 'en' ? dayNamesEN : lang === 'ru' ? dayNamesRU : dayNamesTR;
  const months = lang === 'en' ? monthsEN : lang === 'ru' ? monthsRU : monthsTR;
  const todayLabel = lang === 'en' ? 'Today' : lang === 'ru' ? 'Сегодня' : 'Bugün';
  const tmrLabel = lang === 'en' ? 'Tomorrow' : lang === 'ru' ? 'Завтра' : 'Yarın';
  for (let i = 0; i < 5; i++) {
    const d = new Date(today); d.setDate(d.getDate() + i);
    const label = i === 0 ? `${todayLabel} (${d.getDate()} ${months[d.getMonth()]})` : i === 1 ? `${tmrLabel} (${d.getDate()} ${months[d.getMonth()]})` : `${d.getDate()} ${months[d.getMonth()]} ${days[d.getDay()]}`;
    dates.push({ value: i === 0 ? 'today' : `day-${i}`, label });
  }
  return dates;
}

const timeSlots = ['09:00 - 10:00','10:00 - 11:00','11:00 - 12:00','12:00 - 13:00','13:00 - 14:00','14:00 - 15:00','15:00 - 16:00','16:00 - 17:00','17:00 - 18:00','18:00 - 19:00','19:00 - 20:00','20:00 - 21:00'];

const iStyle = (err: boolean) => ({
  width: '100%', padding: '12px 16px', borderRadius: '14px',
  border: `1.5px solid ${err ? '#C0392B' : '#E5DDD0'}`,
  background: '#FFFDF9', fontSize: '14px', outline: 'none',
  fontFamily: "'DM Sans', sans-serif", color: '#1A1A1A', transition: 'border-color 0.2s',
});

export default function CheckoutModal() {
  const { state, dispatch } = useApp();
  const t = useT(state.lang);
  const [step, setStep] = useState(1);
  const [form, setForm] = useState<FormData>(initialForm);
  const [errors, setErrors] = useState<Partial<Record<keyof FormData, string>>>({});

  const total = useCartTotal(state.cart);
  const deliveryFee = total >= FREE_DELIVERY_THRESHOLD ? 0 : DELIVERY_FEE;
  const deliveryDates = getDeliveryDates(state.lang);
  const green = '#2C5F2E';

  if (!state.checkoutOpen) return null;

  const update = (key: keyof FormData, value: string) => {
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

  const handleSubmit = () => {
    const errs: Partial<Record<keyof FormData, string>> = {};
    if (form.paymentMethod === 'card') {
      if (form.cardNumber.replace(/\s/g,'').length < 16) errs.cardNumber = t('err_card');
      if (form.cardExpiry.length < 5) errs.cardExpiry = t('err_expiry');
      if (form.cardCvv.length < 3) errs.cardCvv = t('err_cvv');
    }
    setErrors(errs);
    if (Object.keys(errs).length === 0) {
      const orderNum = `FFF-${Math.floor(1000 + Math.random() * 9000)}`;
      const order: Order = {
        id: `order-${Date.now()}`, orderNumber: orderNum,
        customerName: form.name, customerPhone: form.phone, customerEmail: form.email,
        items: [...state.cart], total: total + deliveryFee,
        deliveryType: form.deliveryType, address: form.address, district: form.district,
        deliveryDate: form.deliveryDate, deliveryTime: form.deliveryTime,
        paymentMethod: form.paymentMethod, status: 'pending',
        createdAt: new Date().toISOString(), subscriptionPlan: state.subscriptionPlan,
      };
      dispatch({ type: 'COMPLETE_ORDER', payload: order });
    }
  };

  const labelStyle = { fontSize: '13px', fontWeight: 500, color: '#1A1A1A', fontFamily: "'DM Sans', sans-serif", marginBottom: '8px', display: 'block' };
  const errStyle = { color: '#C0392B', fontSize: '11px', marginTop: '4px', fontFamily: "'DM Sans'" };

  return (
    <>
      <div className="fixed inset-0 z-[60] flex items-center justify-center p-4"
        style={{ background: 'rgba(26,26,26,0.55)', backdropFilter: 'blur(6px)' }}
        onClick={() => dispatch({ type: 'TOGGLE_CHECKOUT', payload: false })}>
        <div className="w-full max-w-[580px] max-h-[90vh] flex flex-col rounded-3xl overflow-hidden animate-fade-in-up"
          style={{ background: '#FAF7F2', boxShadow: '0 24px 80px rgba(0,0,0,0.2)' }}
          onClick={e => e.stopPropagation()}>

          <div className="flex items-center justify-between px-6 py-5 border-b" style={{ borderColor: '#E5DDD0' }}>
            <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: '1.2rem', color: '#1A1A1A', fontWeight: 600 }}>{t('chk_title')}</h2>
            <button onClick={() => dispatch({ type: 'TOGGLE_CHECKOUT', payload: false })}
              className="w-9 h-9 rounded-2xl flex items-center justify-center cursor-pointer hover:opacity-70" style={{ background: '#E5DDD0' }}>
              <X size={16} style={{ color: '#1A1A1A' }} />
            </button>
          </div>

          <div className="px-6 pt-5 pb-1 flex items-center justify-center gap-2">
            {[{ n: 1, label: t('chk_info') }, { n: 2, label: t('chk_payment') }].map((s, i) => (
              <div key={s.n} className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-semibold"
                  style={{ background: step >= s.n ? green : '#E5DDD0', color: step >= s.n ? '#fff' : '#8A8A8A', fontFamily: "'DM Sans'" }}>
                  {s.n}
                </div>
                <span className="text-xs font-medium" style={{ color: step >= s.n ? green : '#8A8A8A', fontFamily: "'DM Sans'" }}>{s.label}</span>
                {i === 0 && <div className="w-8 h-px mx-1" style={{ background: step >= 2 ? green : '#E5DDD0' }} />}
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
                        className="flex items-center justify-center gap-2 py-3 rounded-2xl text-sm font-medium cursor-pointer"
                        style={{ border: `1.5px solid ${form.deliveryType === opt.value ? green : '#E5DDD0'}`, background: form.deliveryType === opt.value ? '#E8F0E8' : '#FFFDF9', color: form.deliveryType === opt.value ? green : '#4A4A4A', fontFamily: "'DM Sans'" }}>
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
                  <label style={{ ...labelStyle, display: 'flex', alignItems: 'center', gap: '6px' }}><Clock size={14} />{t('chk_time')}</label>
                  <div className="grid grid-cols-2 gap-3">
                    <select value={form.deliveryDate} onChange={e => update('deliveryDate', e.target.value)} style={{ ...iStyle(false), cursor: 'pointer' }}>
                      {deliveryDates.map(d => <option key={d.value} value={d.value}>{d.label}</option>)}
                    </select>
                    <select value={form.deliveryTime} onChange={e => update('deliveryTime', e.target.value)} style={{ ...iStyle(false), cursor: 'pointer' }}>
                      {timeSlots.map(ts => <option key={ts} value={ts}>{ts}</option>)}
                    </select>
                  </div>
                </div>
              </div>
            )}

            {step === 2 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <label style={labelStyle}>{t('chk_payment_method')}</label>
                {[{ value: 'cod' as const, icon: <Truck size={16} />, title: t('chk_cod'), desc: t('chk_cod_desc') }, { value: 'card' as const, icon: <CreditCard size={16} />, title: t('chk_card'), desc: t('chk_card_desc') }].map(opt => (
                  <button key={opt.value} onClick={() => update('paymentMethod', opt.value)}
                    className="flex items-center gap-4 p-4 rounded-2xl text-left cursor-pointer w-full"
                    style={{ border: `1.5px solid ${form.paymentMethod === opt.value ? green : '#E5DDD0'}`, background: form.paymentMethod === opt.value ? '#E8F0E8' : '#FFFDF9' }}>
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: form.paymentMethod === opt.value ? green : '#F5ECD7', color: form.paymentMethod === opt.value ? '#fff' : '#C8A97A' }}>{opt.icon}</div>
                    <div><div style={{ fontSize: '14px', fontWeight: 600, color: '#1A1A1A', fontFamily: "'DM Sans'" }}>{opt.title}</div><div style={{ fontSize: '12px', color: '#8A8A8A', fontFamily: "'DM Sans'" }}>{opt.desc}</div></div>
                  </button>
                ))}
                {form.paymentMethod === 'card' && (
                  <div className="p-4 rounded-2xl" style={{ background: '#FFFDF9', border: '1px solid #E5DDD0' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                      <div><input placeholder={t('chk_card_num')} value={form.cardNumber} onChange={e => update('cardNumber', formatCard(e.target.value))} maxLength={19} style={iStyle(!!errors.cardNumber)} />{errors.cardNumber && <p style={errStyle}>{errors.cardNumber}</p>}</div>
                      <div className="grid grid-cols-2 gap-3">
                        <div><input placeholder={t('chk_expiry')} value={form.cardExpiry} onChange={e => update('cardExpiry', formatExp(e.target.value))} maxLength={5} style={iStyle(!!errors.cardExpiry)} />{errors.cardExpiry && <p style={errStyle}>{errors.cardExpiry}</p>}</div>
                        <div><input placeholder={t('chk_cvv')} value={form.cardCvv} onChange={e => update('cardCvv', e.target.value.replace(/\D/g,'').slice(0,3))} maxLength={3} type="password" style={iStyle(!!errors.cardCvv)} />{errors.cardCvv && <p style={errStyle}>{errors.cardCvv}</p>}</div>
                      </div>
                      <p style={{ fontSize: '11px', color: '#8A8A8A', fontFamily: "'DM Sans'" }}>🔒 {t('chk_ssl')}</p>
                    </div>
                  </div>
                )}
                <div className="p-4 rounded-2xl" style={{ background: '#FFFDF9', border: '1px solid #E5DDD0' }}>
                  <h4 style={{ fontSize: '14px', fontWeight: 600, color: '#1A1A1A', fontFamily: "'Playfair Display', serif", marginBottom: '12px' }}>{t('chk_summary')}</h4>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {state.cart.map(item => (
                      <div key={item.meal.id} className="flex justify-between" style={{ fontSize: '13px', color: '#4A4A4A', fontFamily: "'DM Sans'" }}>
                        <span>{item.meal.name} × {item.quantity}</span>
                        <span>{item.isCreditBased ? `${item.quantity} ${t('meal_credit')}` : `₺${(item.meal.price * item.quantity).toLocaleString('tr-TR')}`}</span>
                      </div>
                    ))}
                    <div style={{ borderTop: '1px solid #E5DDD0', paddingTop: '10px', marginTop: '4px' }}>
                      <div className="flex justify-between" style={{ fontSize: '13px', color: '#8A8A8A', fontFamily: "'DM Sans'", marginBottom: '4px' }}>
                        <span>{t('cart_delivery')}</span><span>{deliveryFee === 0 ? t('cart_free') : `₺${deliveryFee}`}</span>
                      </div>
                      <div className="flex justify-between" style={{ fontSize: '15px', fontWeight: 600, color: '#1A1A1A', fontFamily: "'Playfair Display', serif" }}>
                        <span>{t('cart_total')}</span><span>₺{(total + deliveryFee).toLocaleString('tr-TR')}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="px-6 py-4 border-t flex items-center justify-between gap-3" style={{ borderColor: '#E5DDD0' }}>
            {step === 1 ? (
              <>
                <button onClick={() => { dispatch({ type: 'TOGGLE_CHECKOUT', payload: false }); dispatch({ type: 'TOGGLE_CART', payload: true }); }}
                  className="px-5 py-3 text-sm font-medium cursor-pointer hover:opacity-70" style={{ color: '#4A4A4A', fontFamily: "'DM Sans'" }}>{t('chk_back_cart')}</button>
                <button onClick={() => { if (validateStep1()) setStep(2); }}
                  className="px-6 py-3 rounded-2xl text-sm font-semibold cursor-pointer"
                  style={{ background: green, color: '#fff', fontFamily: "'DM Sans'" }}>{t('chk_continue')}</button>
              </>
            ) : (
              <>
                <button onClick={() => setStep(1)} className="px-5 py-3 text-sm font-medium cursor-pointer hover:opacity-70" style={{ color: '#4A4A4A', fontFamily: "'DM Sans'" }}>{t('chk_back')}</button>
                <button onClick={handleSubmit} className="px-6 py-3 rounded-2xl text-sm font-semibold cursor-pointer" style={{ background: green, color: '#fff', fontFamily: "'DM Sans'" }}>{t('chk_confirm')}</button>
              </>
            )}
          </div>
        </div>
      </div>
    </>
  );
}

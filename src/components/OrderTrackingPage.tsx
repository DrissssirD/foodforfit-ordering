import { useState, useEffect } from 'react';
import { useApp } from '../store';
import type { Order } from '../types';
import { ChevronRight } from 'lucide-react';

const green = '#1E3F30';

const STATUS_COLORS = {
  pending: { bg: '#F5ECD7', color: '#C8A97A', label: 'Sipariş Alındı' },
  preparing: { bg: '#E8F0E8', color: '#1E3F30', label: 'Hazırlanıyor' },
  ready: { bg: '#E0F2FE', color: '#0369A1', label: 'Hazır' },
  delivered: { bg: '#DCFCE7', color: '#15803D', label: 'Teslim Edildi' },
  cancelled: { bg: '#FEE2E2', color: '#C0392B', label: 'İptal Edildi' },
};

type OrderStatus = 'pending' | 'preparing' | 'ready' | 'delivered' | 'cancelled';

interface Step {
  key: OrderStatus;
  icon: string;
  label: string;
}

const steps: Step[] = [
  { key: 'pending', icon: '📝', label: 'Sipariş Alındı' },
  { key: 'preparing', icon: '👨‍🍳', label: 'Hazırlanıyor' },
  { key: 'ready', icon: '🥡', label: 'Hazır' },
  { key: 'delivered', icon: '🚚', label: 'Teslim Edildi' },
];

export default function OrderTrackingPage() {
  const { state, dispatch } = useApp();
  const [searchInput, setSearchInput] = useState(state.trackingOrderNumber || '');
  const [foundOrder, setFoundOrder] = useState<Order | null>(null);
  const [searchAttempted, setSearchAttempted] = useState(false);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);

  // Tracking a specific order
  const [trackingOrderNumber, setTrackingOrderNumber] = useState<string | null>(state.trackingOrderNumber);

  useEffect(() => {
    if (trackingOrderNumber) {
      const order = state.orders.find(o => o.orderNumber.toUpperCase() === trackingOrderNumber.toUpperCase());
      setFoundOrder(order || null);
      if (order) setLastUpdate(new Date());
    }
  }, [trackingOrderNumber, state.orders]);

  // Auto-refresh logic
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
    const currentIndex = statusOrder.indexOf(foundOrder.status as any);
    
    if (foundOrder.status === 'delivered') return 'completed';
    if (stepIndex < currentIndex) return 'completed';
    if (stepIndex === currentIndex) return 'active';
    return 'upcoming';
  };

  return (
    <div className="min-h-screen pt-12 pb-16 px-5" style={{ background: '#FDF6F2' }}>
      <div className="max-w-lg mx-auto">
        {/* Header */}
        <div className="text-center mb-10">
          <div className="flex items-center justify-center gap-1.5 mb-6">
            <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ background: green }}>
              <span style={{ color: '#C8A97A', fontFamily: "'Montserrat', sans-serif", fontWeight: 800, fontSize: '1.2rem' }}>F</span>
            </div>
            <span style={{ color: '#1A1A1A', fontFamily: "'Montserrat', sans-serif", fontWeight: 700, fontSize: '1.1rem' }}>
              Food<span style={{ color: green }}>ForFit</span>
            </span>
          </div>
          <div className="flex items-center justify-between">
            <h1 style={{ fontFamily: "'Montserrat', sans-serif", fontSize: '1.8rem', color: '#1A1A1A', fontWeight: 800 }}>
              Sipariş Takibi
            </h1>
            <button
              onClick={() => dispatch({ type: 'SET_PAGE', payload: 'home' })}
              className="px-4 py-2 rounded-xl text-sm font-semibold cursor-pointer hover:bg-gray-100 transition-colors"
              style={{ color: '#4A4A4A', fontFamily: "'Montserrat', sans-serif", background: '#E5DDD0' }}
            >
              ← Geri Dön
            </button>
          </div>
        </div>

        {/* My Orders Section */}
        {state.myOrderNumbers && state.myOrderNumbers.length > 0 && !foundOrder && (
          <div className="mb-8">
            <h3 style={{ fontFamily: "'Montserrat', sans-serif", fontSize: '12px', fontWeight: 700, color: '#8A8A8A', textTransform: 'uppercase', marginBottom: '12px', letterSpacing: '0.05em' }}>
              Son Siparişleriniz
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
                      <div className="text-xs text-gray-400 mt-1">{new Date(order.createdAt).toLocaleDateString('tr-TR')}</div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-[10px] font-bold px-2.5 py-1 rounded-full uppercase" style={{ 
                        background: STATUS_COLORS[order.status]?.bg || '#F5F5F5', 
                        color: STATUS_COLORS[order.status]?.color || '#8A8A8A' 
                      }}>
                        {STATUS_COLORS[order.status]?.label || order.status}
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
              placeholder="Sipariş No (örn: FFF-1042)"
              value={searchInput}
              onChange={e => setSearchInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSearch()}
              style={{
                flex: 1,
                padding: '14px 20px',
                borderRadius: '16px',
                border: '1.5px solid #E5DDD0',
                background: '#FFFFFF',
                fontSize: '15px',
                fontFamily: "'Montserrat', sans-serif",
                color: '#1A1A1A',
                outline: 'none',
              }}
            />
            <button
              onClick={handleSearch}
              className="px-6 py-3 rounded-full font-bold cursor-pointer transition-transform active:scale-95"
              style={{ background: green, color: '#fff', fontFamily: "'Montserrat', sans-serif", fontSize: '15px' }}
            >
              Ara
            </button>
          </div>
        </div>

        {/* Not Found Message */}
        {searchAttempted && !foundOrder && (
          <div className="text-center p-8 rounded-3xl" style={{ background: '#FFF', border: '1.5px solid #FEE2E2' }}>
            <p style={{ color: '#C0392B', fontSize: '15px', fontWeight: 600, fontFamily: "'Montserrat', sans-serif" }}>
              Sipariş bulunamadı.
            </p>
            <p style={{ color: '#8A8A8A', fontSize: '13px', marginTop: '4px', fontFamily: "'Montserrat', sans-serif" }}>
              Lütfen sipariş numaranızı kontrol edip tekrar deneyin.
            </p>
          </div>
        )}

        {/* Order Details */}
        {foundOrder && (
          <div className="animate-fade-in">
            <div className="mb-6 p-6 rounded-3xl" style={{ background: '#FFFFFF', border: '1.5px solid #E5DDD0' }}>
              <div className="flex justify-between items-start mb-6 pb-6 border-b border-[#F0EDE8]">
                <div>
                  <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-1">DURUM</p>
                  <p className="font-bold text-lg" style={{ color: STATUS_COLORS[foundOrder.status].color }}>
                    {STATUS_COLORS[foundOrder.status].label}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-1">SİPARİŞ NO</p>
                  <p className="font-bold text-lg text-[#1A1A1A]">{foundOrder.orderNumber}</p>
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex justify-between items-center text-sm">
                  <span className="text-gray-500">Müşteri</span>
                  <span className="font-semibold text-gray-900">{foundOrder.customerName}</span>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span className="text-gray-500">Toplam Tutar</span>
                  <span className="font-bold text-gray-900">₺{foundOrder.total.toLocaleString('tr-TR')}</span>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span className="text-gray-500">Ödeme Yöntemi</span>
                  <span className="text-gray-900 font-medium">
                    {foundOrder.paymentMethod === 'cod' ? 'Kapıda Nakit/Kart' : 'Online Kredi Kartı'}
                  </span>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span className="text-gray-500">Tarih</span>
                  <span className="text-gray-900">{new Date(foundOrder.createdAt).toLocaleString('tr-TR')}</span>
                </div>
              </div>
            </div>

            {/* Visual Tracker */}
            {foundOrder.status !== 'cancelled' && (
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
                            {step.label}
                          </p>
                          {isActive && <p className="text-[11px] text-[#1E3F30] font-semibold animate-pulse">İşlemde...</p>}
                        </div>
                        
                        {/* Vertical line between steps */}
                        {i < steps.length - 1 && (
                          <div className="absolute left-6 top-10 w-0.5 h-10 -z-10" style={{ background: isCompleted ? green : '#F0EDE8' }} />
                        )}
                      </div>
                    );
                  })}
                </div>
                
                <div className="mt-8 pt-6 border-t border-[#F0EDE8] text-center">
                  <p className="text-[11px] text-gray-400 font-medium">
                    Son güncelleme: {lastUpdate ? lastUpdate.toLocaleTimeString('tr-TR') : 'Yükleniyor...'}
                  </p>
                </div>
              </div>
            )}
            
            <button 
              onClick={() => { setFoundOrder(null); setTrackingOrderNumber(null); setSearchInput(''); }}
              className="w-full mt-6 py-4 rounded-2xl font-bold text-sm border border-[#E5DDD0] text-gray-400 hover:bg-white hover:text-gray-600 transition-all"
            >
              Başka Bir Sipariş Sorgula
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

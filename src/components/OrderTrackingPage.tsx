import { useState, useEffect } from 'react';
import { useApp } from '../store';
import type { Order } from '../types';

const green = '#1E3F30';

type OrderStatus = 'pending' | 'preparing' | 'ready' | 'delivered' | 'cancelled';

interface Step {
  key: OrderStatus;
  icon: string;
  label: string;
}

const steps: Step[] = [
  { key: 'pending', icon: '📋', label: 'Sipariş Alındı' },
  { key: 'preparing', icon: '👨‍🍳', label: 'Hazırlanıyor' },
  { key: 'ready', icon: '📦', label: 'Hazır' },
  { key: 'delivered', icon: '✅', label: 'Teslim Edildi' },
];

export default function OrderTrackingPage() {
  const { state, dispatch } = useApp();
  const [searchInput, setSearchInput] = useState(state.trackingOrderNumber || '');
  const [foundOrder, setFoundOrder] = useState<Order | null>(null);
  const [searchAttempted, setSearchAttempted] = useState(false);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);

  // Auto-refresh every 30 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      if (foundOrder) {
        const updated = state.orders.find(o => o.orderNumber === foundOrder.orderNumber);
        if (updated) {
          setFoundOrder(updated);
          setLastUpdate(new Date());
        }
      }
    }, 30000);
    return () => clearInterval(interval);
  }, [foundOrder, state.orders]);

  const handleSearch = () => {
    const query = searchInput.trim().toUpperCase();
    if (!query) {
      setFoundOrder(null);
      setSearchAttempted(false);
      return;
    }
    const order = state.orders.find(o => o.orderNumber.toUpperCase() === query);
    setFoundOrder(order || null);
    setSearchAttempted(true);
    if (order) setLastUpdate(new Date());
  };

  const handleBackHome = () => {
    dispatch({ type: 'SET_PAGE', payload: 'packages' });
    window.history.pushState({}, '', '/');
  };

  const getStepStatus = (stepKey: OrderStatus) => {
    if (!foundOrder) return 'upcoming';
    const stepIndex = steps.findIndex(s => s.key === stepKey);
    const currentIndex = steps.findIndex(s => s.key === foundOrder.status);
    if (stepIndex < currentIndex) return 'completed';
    if (stepIndex === currentIndex) return 'active';
    return 'upcoming';
  };

  return (
    <div className="min-h-screen pt-12 pb-16 px-5" style={{ background: '#FDF6F2' }}>
      <div className="max-w-lg mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-1.5 mb-4">
            <div
              className="w-10 h-10 rounded-lg flex items-center justify-center"
              style={{ background: green }}
            >
              <span style={{ color: '#C8A97A', fontFamily: "'Montserrat', sans-serif", fontWeight: 800, fontSize: '1.2rem' }}>F</span>
            </div>
            <span style={{ color: '#1A1A1A', fontFamily: "'Montserrat', sans-serif", fontWeight: 700, fontSize: '1.1rem' }}>
              Food<span style={{ color: green }}>ForFit</span>
            </span>
          </div>
          <h1 style={{ fontFamily: "'Montserrat', sans-serif", fontWeight: 700, fontSize: '1.4rem', color: '#1A1A1A', marginBottom: '4px' }}>
            Sipariş Takip
          </h1>
          <button
            onClick={handleBackHome}
            style={{ color: '#8A8A8A', fontSize: '13px', fontFamily: "'Montserrat', sans-serif", cursor: 'pointer', background: 'none', border: 'none', padding: 0 }}
            className="hover:opacity-70"
          >
            ← Ana Sayfaya Dön
          </button>
        </div>

        {/* Search Box */}
        <div className="mb-6">
          <div className="flex gap-2">
            <input
              type="text"
              placeholder="Sipariş numaranızı girin (örn: FFF-1042)"
              value={searchInput}
              onChange={e => setSearchInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSearch()}
              style={{
                flex: 1,
                padding: '12px 16px',
                borderRadius: '12px',
                border: '1.5px solid #E5DDD0',
                background: '#FFFFFF',
                fontSize: '14px',
                fontFamily: "'Montserrat', sans-serif",
                color: '#1A1A1A',
                outline: 'none',
              }}
            />
            <button
              onClick={handleSearch}
              className="px-5 py-3 rounded-full font-semibold cursor-pointer transition-opacity hover:opacity-90"
              style={{ background: green, color: '#fff', fontFamily: "'Montserrat', sans-serif", fontSize: '14px' }}
            >
              Ara
            </button>
          </div>
        </div>

        {/* Not Found Message */}
        {searchAttempted && !foundOrder && (
          <div className="mb-6 p-4 rounded-xl" style={{ background: '#FEE2E2', border: '1.5px solid #C0392B' }}>
            <p style={{ color: '#C0392B', fontSize: '14px', fontFamily: "'Montserrat', sans-serif" }}>
              Sipariş bulunamadı. Lütfen numarayı kontrol edin.
            </p>
          </div>
        )}

        {/* Order Found */}
        {foundOrder && (
          <>
            {/* Order Info Card */}
            <div className="mb-6 p-5 rounded-xl" style={{ background: '#FFFFFF', border: '1.5px solid #E5DDD0' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px', fontFamily: "'Montserrat', sans-serif" }}>
                  <span style={{ color: '#8A8A8A' }}>Sipariş No:</span>
                  <span style={{ color: '#1A1A1A', fontWeight: 700 }}>{foundOrder.orderNumber}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px', fontFamily: "'Montserrat', sans-serif" }}>
                  <span style={{ color: '#8A8A8A' }}>Müşteri:</span>
                  <span style={{ color: '#1A1A1A', fontWeight: 600 }}>{foundOrder.customerName}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px', fontFamily: "'Montserrat', sans-serif" }}>
                  <span style={{ color: '#8A8A8A' }}>Toplam:</span>
                  <span style={{ color: '#1A1A1A', fontWeight: 700 }}>₺{foundOrder.total.toLocaleString('tr-TR')}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px', fontFamily: "'Montserrat', sans-serif" }}>
                  <span style={{ color: '#8A8A8A' }}>Ödeme:</span>
                  <span style={{ color: '#1A1A1A' }}>
                    {foundOrder.paymentMethod === 'cod' ? 'Kapıda Ödeme' : 'Kredi Kartı'}
                  </span>
                </div>
                {foundOrder.subscriptionPlan && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px', fontFamily: "'Montserrat', sans-serif" }}>
                    <span style={{ color: '#8A8A8A' }}>📦 Paket:</span>
                    <span style={{ color: '#1A1A1A' }}>{foundOrder.subscriptionPlan.name}</span>
                  </div>
                )}
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px', fontFamily: "'Montserrat', sans-serif" }}>
                  <span style={{ color: '#8A8A8A' }}>Tarih:</span>
                  <span style={{ color: '#1A1A1A' }}>
                    {new Date(foundOrder.createdAt).toLocaleString('tr-TR')}
                  </span>
                </div>
              </div>
            </div>

            {/* Status Tracker */}
            {foundOrder.status === 'cancelled' ? (
              <div className="mb-6 p-4 rounded-xl" style={{ background: '#FEE2E2', border: '1.5px solid #C0392B' }}>
                <p style={{ color: '#C0392B', fontSize: '14px', fontFamily: "'Montserrat', sans-serif", textAlign: 'center' }}>
                  Bu sipariş iptal edilmiştir.
                </p>
              </div>
            ) : (
              <div className="mb-6 p-5 rounded-xl" style={{ background: '#FFFFFF', border: '1.5px solid #E5DDD0' }}>
                {/* Status steps */}
                <div className="flex flex-col sm:flex-row gap-2 sm:gap-0">
                  {steps.map((step, i) => {
                    const status = getStepStatus(step.key);
                    const isCompleted = status === 'completed';
                    const isActive = status === 'active';

                    return (
                      <div key={step.key} className="flex-1">
                        {/* Step circle */}
                        <div className="flex flex-col items-center">
                          <div
                            className="w-12 h-12 rounded-full flex items-center justify-center text-xl mb-2 relative transition-all"
                            style={{
                              background: isCompleted || isActive ? green : '#E5DDD0',
                              color: isCompleted || isActive ? '#fff' : '#8A8A8A',
                              boxShadow: isActive ? `0 0 0 6px ${green}33` : 'none',
                              animation: isActive ? 'pulse 2s infinite' : 'none',
                            }}
                          >
                            {isCompleted ? '✓' : step.icon}
                          </div>
                          <p
                            style={{
                              fontSize: '12px',
                              fontFamily: "'Montserrat', sans-serif",
                              color: isCompleted || isActive ? green : '#8A8A8A',
                              fontWeight: isActive ? 700 : isCompleted ? 600 : 400,
                              textAlign: 'center',
                              maxWidth: '70px',
                            }}
                          >
                            {step.label}
                          </p>
                        </div>

                        {/* Connector line */}
                        {i < steps.length - 1 && (
                          <div
                            className="hidden sm:block h-1 mx-auto mt-3 mb-6 flex-1"
                            style={{
                              width: 'calc(100% + 20px)',
                              background: isCompleted || (isActive && getStepStatus(steps[i + 1].key) === 'completed') ? green : '#E5DDD0',
                              opacity: 0.5,
                            }}
                          />
                        )}
                      </div>
                    );
                  })}
                </div>

                {/* Last update time */}
                <div style={{ textAlign: 'center', marginTop: '16px' }}>
                  <p
                    style={{
                      fontSize: '11px',
                      color: '#8A8A8A',
                      fontFamily: "'Montserrat', sans-serif",
                    }}
                  >
                    Son güncelleme: {lastUpdate ? lastUpdate.toLocaleTimeString('tr-TR') : 'bilinmiyor'}
                  </p>
                  <p
                    style={{
                      fontSize: '11px',
                      color: '#8A8A8A',
                      fontFamily: "'Montserrat', sans-serif",
                      marginTop: '4px',
                    }}
                  >
                    Otomatik güncelleniyor...
                  </p>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.7; }
        }
      `}</style>
    </div>
  );
}

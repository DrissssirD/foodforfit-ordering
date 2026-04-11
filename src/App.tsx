import { useEffect } from 'react';
import { AppProvider, useApp } from './store';
import Header from './components/Header';
import PackagesSection from './components/PackagesSection';
import MenuPage from './components/MenuPage';
import CartDrawer from './components/CartDrawer';
import CheckoutModal from './components/CheckoutModal';
import SuccessPage from './components/SuccessPage';
import Footer from './components/Footer';
import FitAssistant from './components/FitAssistant';
import AdminDashboard from './components/AdminDashboard';
import OrderTrackingPage from './components/OrderTrackingPage';

function AppContent() {
  const { state, dispatch } = useApp();

  // Route to tracking or admin panel based on URL
  useEffect(() => {
    if (window.location.pathname.startsWith('/track/')) {
      const orderNum = window.location.pathname.split('/track/')[1]?.toUpperCase();
      if (orderNum) {
        dispatch({ type: 'SET_TRACKING_ORDER', payload: orderNum });
        dispatch({ type: 'SET_PAGE', payload: 'track' });
      }
    } else if (window.location.pathname === '/admin') {
      dispatch({ type: 'SET_PAGE', payload: 'admin' });
    }
  }, []);

  useEffect(() => { window.scrollTo({ top: 0, behavior: 'smooth' }); }, [state.currentPage]);

  if (state.currentPage === 'admin') {
    return <AdminDashboard />;
  }

  if (state.currentPage === 'track') {
    return (
      <div className="min-h-screen flex flex-col" style={{ background: '#FDF6F2' }}>
        <Header />
        <main className="flex-1 pt-[72px]"><OrderTrackingPage /></main>
        <Footer />
        <FitAssistant />
      </div>
    );
  }

  const renderPage = () => {
    switch (state.currentPage) {
      case 'menu': return <MenuPage />;
      case 'success': return <SuccessPage />;
      default: return <PackagesSection fullPage />;
    }
  };

  return (
    <div className="min-h-screen flex flex-col" style={{ background: '#FDF6F2' }}>
      <Header />
      <main className="flex-1">{renderPage()}</main>
      {state.currentPage !== 'success' && <Footer />}
      <CartDrawer />
      <CheckoutModal />
      <FitAssistant />
    </div>
  );
}

export default function App() {
  return <AppProvider><AppContent /></AppProvider>;
}

import React, { useState, useEffect } from 'react';
import { useAuth, AuthProvider } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import { Rail, RailCategory } from './components/Layout/Rail';
import { Sidebar } from './components/Layout/Sidebar';
import { Navbar } from './components/Layout/Navbar';
import { LoginPage } from './pages/LoginPage';
import { DashboardPage } from './pages/DashboardPage';
import { CustomersPage } from './pages/CustomersPage';
import { CustomerDetailPage } from './pages/CustomerDetailPage';
import { NewExaminationPage } from './pages/NewExaminationPage';
import { LensIQPage } from './pages/LensIQPage';
import { LensIQReviewsPage } from './pages/LensIQReviewsPage';
import { OptoForecastPage } from './pages/OptoForecastPage';
import { OptoRecallPage } from './pages/OptoRecallPage';
import { UserManagementPage } from './pages/UserManagementPage';
import { SettingsPage } from './pages/SettingsPage';
import { ReportsPage } from './pages/ReportsPage';
import { NewSalePage } from './pages/NewSalePage';
import { SalesOrdersPage } from './pages/SalesOrdersPage';
import { ProductsPage } from './pages/ProductsPage';
import { InventoryPage } from './pages/InventoryPage';
import { SuppliersPage } from './pages/SuppliersPage';
import { MessagesPage } from './pages/MessagesPage';
import { InvoiceViewModal } from './pages/InvoiceViewModal';

const AppContent: React.FC = () => {
  const { user, loading, isAdmin } = useAuth();

  const [currentPage, setCurrentPage] = useState<string>('dashboard');
  const [selectedCustomerId, setSelectedCustomerId] = useState<number | null>(null);
  const [selectedExamCustomerId, setSelectedExamCustomerId] = useState<number | null>(null);
  const [selectedSaleCustomerId, setSelectedSaleCustomerId] = useState<number | undefined>(undefined);
  const [selectedSaleLensId, setSelectedSaleLensId] = useState<number | undefined>(undefined);
  const [lensIQParams, setLensIQParams] = useState<{ customerId?: number; prescriptionId?: number }>({});
  const [activeInvoiceSaleId, setActiveInvoiceSaleId] = useState<number | null>(null);

  const [pendingReviewsCount, setPendingReviewsCount] = useState<number>(() => {
    try {
      const stored = localStorage.getItem('optopick_lens_reviews');
      if (stored) {
        const parsed = JSON.parse(stored);
        return parsed.filter((r: any) => r.status === 'PENDING').length;
      }
    } catch (e) {}
    return 3;
  });

  useEffect(() => {
    const handleReviewsUpdate = () => {
      try {
        const stored = localStorage.getItem('optopick_lens_reviews');
        if (stored) {
          const parsed = JSON.parse(stored);
          setPendingReviewsCount(parsed.filter((r: any) => r.status === 'PENDING').length);
        }
      } catch (e) {}
    };
    window.addEventListener('optopick_reviews_updated', handleReviewsUpdate);
    return () => window.removeEventListener('optopick_reviews_updated', handleReviewsUpdate);
  }, []);

  if (loading) {
    return (
      <div
        style={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: 'var(--bg-glass, #E9F1F7)',
        }}
      >
        <div style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
          <div className="mark" style={{ width: 52, height: 52 }}>
            <i style={{ width: 22, height: 22 }} />
          </div>
          <h2 className="serif" style={{ fontSize: 22, margin: 0 }}>OptoPick</h2>
          <div className="sub">Connecting to Indian Optician practice systems...</div>
        </div>
      </div>
    );
  }

  if (!user) {
    return <LoginPage />;
  }

  const navigateTo = (page: string) => {
    // Role guard check for restricted pages
    if ((page === 'forecast' || page === 'users' || page === 'settings' || page === 'reports' || page === 'lens-iq-reviews' || page === 'new-exam') && !isAdmin) {
      setCurrentPage('dashboard');
      return;
    }
    setCurrentPage(page);
  };

  // Map active page to 72px rail category
  const getActiveRailCategory = (): RailCategory => {
    switch (currentPage) {
      case 'dashboard':
        return 'overview';
      case 'customers':
      case 'customer-detail':
      case 'examinations':
      case 'new-exam':
        return 'clinical';
      case 'sales':
      case 'new-sale':
      case 'products':
      case 'inventory':
      case 'suppliers':
        return 'store';
      case 'lens-iq':
      case 'lens-iq-reviews':
      case 'forecast':
      case 'recall':
        return 'decision';
      case 'users':
      case 'reports':
      case 'settings':
      case 'messages':
        return 'admin';
      default:
        return 'overview';
    }
  };

  const handleSelectRailCategory = (cat: RailCategory) => {
    switch (cat) {
      case 'overview':
        navigateTo('dashboard');
        break;
      case 'clinical':
        navigateTo('customers');
        break;
      case 'store':
        navigateTo('sales');
        break;
      case 'decision':
        navigateTo(isAdmin ? 'lens-iq-reviews' : 'lens-iq');
        break;
      case 'admin':
        navigateTo(isAdmin ? 'users' : 'messages');
        break;
    }
  };

  const getPageTitle = (): { title: string; subtitle?: string } => {
    switch (currentPage) {
      case 'dashboard':
        return {
          title: isAdmin ? `Good morning, ${user?.full_name || 'Mr. Musthaq'}` : `Hello, ${user?.full_name || 'Front Desk'}`,
          subtitle: isAdmin ? 'Optometrist & Administrator · Indian Optician, Nintavur' : 'Optical Staff · Front Desk & Customer Outbox',
        };
      case 'customers':
        return { title: 'Customers', subtitle: 'Customer directory & optical clinical registry' };
      case 'customer-detail':
        return { title: 'Customer Profile', subtitle: 'Chronological prescription history & duochrome comparison' };
      case 'examinations':
      case 'new-exam':
        return { title: 'Record Eye Examination', subtitle: 'Clinical subjective refraction by registered optometrist' };
      case 'products':
        return { title: 'Frames & Lenses', subtitle: 'Store · Catalogue, specifications and stock levels' };
      case 'inventory':
        return { title: 'Stock Ledger & Goods Receipt', subtitle: 'Store · Real-time stock movements and audit trail' };
      case 'sales':
        return { title: 'Sales & Billing', subtitle: 'Store · Optical dispensing orders and workshop tracking' };
      case 'new-sale':
        return { title: 'Sales & Billing', subtitle: 'New optical dispensing order and payment allocation' };
      case 'lens-iq':
        return { title: 'LensIQ Lens Suggestions', subtitle: 'AI decision support · Patient lifestyle compatibility filter' };
      case 'lens-iq-reviews':
        return { title: 'LensIQ Reviews', subtitle: 'Optometrist clinical approval queue for AI suggestions' };
      case 'forecast':
        return { title: 'OptoForecast', subtitle: 'Inventory demand insights & sales velocity 90-day signals' };
      case 'recall':
        return { title: 'OptoRecall Follow-ups', subtitle: 'AI decision support · Order collection & annual review recall' };
      case 'suppliers':
        return { title: 'Suppliers', subtitle: 'Store · Optical frames, lenses, and lab vendors' };
      case 'messages':
        return { title: 'Messages', subtitle: 'Optical Staff · Customer communication outbox for approved SMS' };
      case 'users':
        return { title: 'Users & Roles', subtitle: 'Administration · Optometrist & optical staff access control' };
      case 'reports':
        return { title: 'Management Reports', subtitle: 'Administration · Revenue breakdown, sales & stock audit' };
      case 'settings':
        return { title: 'Settings', subtitle: 'Administration · Clinic profile, follow-up rules & AI features' };
      default:
        return { title: 'OptoPick', subtitle: 'Indian Optician, Nintavur' };
    }
  };

  const { title, subtitle } = getPageTitle();

  return (
    <div className="refraction-app">
      {/* 72px Dark Icon Rail */}
      <Rail
        activeCategory={getActiveRailCategory()}
        onSelectCategory={handleSelectRailCategory}
        onLogoClick={() => navigateTo('dashboard')}
      />

      {/* Contextual Sub-Nav */}
      <Sidebar
        activeCategory={getActiveRailCategory()}
        currentPage={currentPage}
        onNavigate={navigateTo}
        reviewCounts={{ lensIQReviews: pendingReviewsCount, optoRecall: 8, messages: 4 }}
      />

      {/* Main Viewport */}
      <main className="main">
        <Navbar
          title={title}
          subtitle={subtitle}
          onNavigate={navigateTo}
          onSearch={(q) => {
            if (q && currentPage !== 'customers' && currentPage !== 'sales' && currentPage !== 'products') {
              navigateTo('customers');
            }
          }}
        />

        <div className="content">
          {currentPage === 'dashboard' && <DashboardPage onNavigate={navigateTo} />}

          {currentPage === 'customers' && (
            <CustomersPage
              onSelectCustomer={(cid) => {
                setSelectedCustomerId(cid);
                setCurrentPage('customer-detail');
              }}
              onNewExam={(cid) => {
                setSelectedExamCustomerId(cid);
                setCurrentPage('new-exam');
              }}
              onNewSale={(cid) => {
                setSelectedSaleCustomerId(cid);
                setCurrentPage('new-sale');
              }}
              onLaunchLensIQ={(cid) => {
                setLensIQParams({ customerId: cid });
                setCurrentPage('lens-iq');
              }}
            />
          )}

          {currentPage === 'customer-detail' && selectedCustomerId && (
            <CustomerDetailPage
              customerId={selectedCustomerId}
              onBack={() => setCurrentPage('customers')}
              onNewExam={(cid) => {
                setSelectedExamCustomerId(cid);
                setCurrentPage('new-exam');
              }}
              onNewSale={(cid) => {
                setSelectedSaleCustomerId(cid);
                setCurrentPage('new-sale');
              }}
              onLaunchLensIQ={(cid, rxId) => {
                setLensIQParams({ customerId: cid, prescriptionId: rxId });
                setCurrentPage('lens-iq');
              }}
            />
          )}

          {currentPage === 'new-exam' && (
            <NewExaminationPage
              customerId={selectedExamCustomerId || selectedCustomerId || 1}
              onCancel={() => {
                if (selectedCustomerId) setCurrentPage('customer-detail');
                else setCurrentPage('customers');
              }}
              onSuccess={(cid) => {
                setSelectedCustomerId(cid);
                setCurrentPage('customer-detail');
              }}
              onLaunchLensIQ={(cid) => {
                setLensIQParams({ customerId: cid });
                setCurrentPage('lens-iq');
              }}
              onNewSale={(cid) => {
                setSelectedSaleCustomerId(cid);
                setCurrentPage('new-sale');
              }}
            />
          )}

          {currentPage === 'products' && <ProductsPage />}

          {currentPage === 'inventory' && <InventoryPage />}

          {currentPage === 'suppliers' && <SuppliersPage />}

          {currentPage === 'messages' && <MessagesPage />}

          {currentPage === 'sales' && (
            <SalesOrdersPage
              onNewSale={() => {
                setSelectedSaleCustomerId(undefined);
                setSelectedSaleLensId(undefined);
                setCurrentPage('new-sale');
              }}
            />
          )}

          {currentPage === 'new-sale' && (
            <NewSalePage
              initialCustomerId={selectedSaleCustomerId}
              initialLensId={selectedSaleLensId}
              onCancel={() => {
                setSelectedSaleLensId(undefined);
                setCurrentPage('sales');
              }}
              onSuccess={(saleId) => {
                setSelectedSaleLensId(undefined);
                setActiveInvoiceSaleId(saleId);
                setCurrentPage('sales');
              }}
              onLaunchLensIQ={(cid, rxId) => {
                setLensIQParams({ customerId: cid, prescriptionId: rxId });
                setCurrentPage('lens-iq');
              }}
            />
          )}

          {currentPage === 'lens-iq' && (
            <LensIQPage
              initialCustomerId={lensIQParams.customerId}
              initialPrescriptionId={lensIQParams.prescriptionId}
              onApplyLensToSale={(cid, lensId) => {
                setSelectedSaleCustomerId(cid);
                setSelectedSaleLensId(lensId);
                setCurrentPage('new-sale');
              }}
            />
          )}

          {currentPage === 'lens-iq-reviews' && isAdmin && (
            <LensIQReviewsPage
              onApplyToSale={(cid, lensId) => {
                setSelectedSaleCustomerId(cid);
                setSelectedSaleLensId(lensId);
                setCurrentPage('new-sale');
              }}
            />
          )}

          {currentPage === 'forecast' && isAdmin && <OptoForecastPage />}

          {currentPage === 'recall' && <OptoRecallPage />}

          {currentPage === 'users' && isAdmin && <UserManagementPage />}

          {currentPage === 'reports' && isAdmin && <ReportsPage />}

          {currentPage === 'settings' && isAdmin && <SettingsPage />}
        </div>
      </main>

      {/* Printable Tax Invoice Modal */}
      {activeInvoiceSaleId && (
        <InvoiceViewModal
          saleId={activeInvoiceSaleId}
          onClose={() => setActiveInvoiceSaleId(null)}
        />
      )}
    </div>
  );
};

export const App: React.FC = () => {
  return (
    <ThemeProvider>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </ThemeProvider>
  );
};

export default App;

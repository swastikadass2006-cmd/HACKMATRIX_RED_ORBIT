import React, { useState, useEffect, useCallback } from 'react';
import { Topbar } from './components/layout/Topbar';
import { Sidebar } from './components/layout/Sidebar';
import { DashboardHeader } from './components/dashboard/DashboardHeader';
import { FraudCard } from './components/dashboard/FraudCard';
import { LiveTransactions } from './components/dashboard/LiveTransactions';
import { TransactionChart } from './components/dashboard/TransactionChart';
import { RightColumnCards } from './components/dashboard/RightColumnCards';
import { TransactionDrawer } from './components/dashboard/TransactionDrawer';
import { TransactionsView } from './components/views/TransactionsView';
import { AnalyticsView } from './components/views/AnalyticsView';
import { PolicyView } from './components/views/PolicyView';
import { AlertsView } from './components/views/AlertsView';
import { ContactsView } from './components/views/ContactsView';
import { SettingsView } from './components/views/SettingsView';
import { SimulatorView } from './components/views/SimulatorView';
import { 
  fetchMetrics, 
  fetchTransactions, 
  fetchAlerts 
} from './api/client';
import { createTransactionStream } from './api/sse';

export default function App() {
  const [activeView, setActiveView] = useState('dashboard');
  const [dateRange, setDateRange] = useState({
    id: 'quarter',
    label: '29 Jun, 2025 - 29 August, 2025'
  });
  const [metrics, setMetrics] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [selectedTxn, setSelectedTxn] = useState(null);

  const loadData = useCallback(async () => {
    try {
      const [m, txnsRes, alt] = await Promise.all([
        fetchMetrics().catch(() => null),
        fetchTransactions({ page: 1, limit: 30 }).catch(() => ({ transactions: [] })),
        fetchAlerts().catch(() => [])
      ]);
      if (m) setMetrics(m);
      if (txnsRes?.transactions) setTransactions(txnsRes.transactions);
      if (alt) setAlerts(alt);
    } catch (err) {
      console.error('Error loading dashboard data:', err);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Subscribe to real-time SSE stream
  useEffect(() => {
    const unsubscribe = createTransactionStream({
      onTransaction: (newTxn) => {
        setTransactions((prev) => [newTxn, ...prev]);
        fetchMetrics().then(setMetrics).catch(() => {});
        fetchAlerts().then(setAlerts).catch(() => {});
      }
    });

    return () => unsubscribe();
  }, []);

  // View router renderer
  const renderCurrentView = () => {
    switch (activeView) {
      case 'transactions':
        return (
          <TransactionsView 
            transactions={transactions} 
            onSelectTransaction={setSelectedTxn}
            onBackToDashboard={() => setActiveView('dashboard')}
          />
        );
      case 'analytics':
        return (
          <AnalyticsView 
            metrics={metrics}
            onBackToDashboard={() => setActiveView('dashboard')}
          />
        );
      case 'policy':
        return (
          <PolicyView 
            onBackToDashboard={() => setActiveView('dashboard')}
          />
        );
      case 'alerts':
        return (
          <AlertsView 
            alerts={alerts}
            onBackToDashboard={() => setActiveView('dashboard')}
          />
        );
      case 'contacts':
        return (
          <ContactsView 
            onBackToDashboard={() => setActiveView('dashboard')}
          />
        );
      case 'simulator':
        return (
          <SimulatorView 
            onBackToDashboard={() => setActiveView('dashboard')}
            onSimulationDone={(res) => {
              if (res?.transaction) {
                setTransactions((prev) => [res.transaction, ...prev]);
                loadData();
              }
            }}
          />
        );
      case 'settings':
        return (
          <SettingsView 
            onBackToDashboard={() => setActiveView('dashboard')}
          />
        );
      case 'dashboard':
      default:
        return (
          <main className="dashboard-grid-3col">
            {/* Column 1: Payment Goal Card with Emerald RuPay Card + Payment History */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <FraudCard 
                metrics={metrics} 
                onViewDetails={() => setActiveView('analytics')}
              />
              <LiveTransactions 
                transactions={transactions} 
                onSelectTransaction={setSelectedTxn} 
                onViewAll={() => setActiveView('transactions')}
              />
            </div>

            {/* Column 2: Engagement Rate Chart (Striped Mint Bars) + Operational Controls */}
            <div style={{ minWidth: 0 }}>
              <TransactionChart 
                dateRange={dateRange}
                onDateRangeChange={setDateRange}
                onSimulationTriggered={(res) => {
                  if (res?.transaction) {
                    setTransactions((prev) => [res.transaction, ...prev]);
                    loadData();
                  }
                }} 
                onViewAnalytics={() => setActiveView('analytics')}
              />
            </div>

            {/* Column 3: Payment Goal Wave Chart + Amount of Credit + Mandatory Payments Avatars */}
            <div style={{ minWidth: 0 }}>
              <RightColumnCards 
                metrics={metrics} 
                alert={alerts[0]} 
                onTriggerAlert={() => setActiveView('alerts')}
                onViewAnalytics={() => setActiveView('analytics')}
              />
            </div>
          </main>
        );
    }
  };

  return (
    <div className="app-container">
      {/* Top Navigation Bar with active navigation tracking */}
      <Topbar 
        activeView={activeView} 
        onSelectView={setActiveView} 
        unreadAlertCount={alerts.length}
      />

      {/* Greeting & Date Header (only on dashboard view) */}
      {activeView === 'dashboard' && (
        <DashboardHeader 
          userName="Sujon"
          dateRange={dateRange}
          onDateRangeChange={(newRange) => {
            setDateRange(newRange);
            loadData();
          }}
          onAddAction={() => setActiveView('simulator')} 
        />
      )}

      {/* Main Layout: Slim Floating Dock + Active View */}
      <div className="dashboard-main-layout">
        {/* Left Slim Floating Rail */}
        <Sidebar 
          activeView={activeView} 
          onSelectView={setActiveView} 
        />

        {/* Dynamic Interactive View */}
        {renderCurrentView()}
      </div>

      {/* Transaction Inspection Drawer */}
      <TransactionDrawer 
        transaction={selectedTxn} 
        onClose={() => setSelectedTxn(null)} 
      />
    </div>
  );
}

import React, { useState, useEffect, useCallback } from 'react';
import { Topbar } from './components/layout/Topbar';
import { Sidebar } from './components/layout/Sidebar';
import { DashboardHeader } from './components/dashboard/DashboardHeader';
import { FraudCard } from './components/dashboard/FraudCard';
import { LiveTransactions } from './components/dashboard/LiveTransactions';
import { TransactionChart } from './components/dashboard/TransactionChart';
import { RightColumnCards } from './components/dashboard/RightColumnCards';
import { TransactionDrawer } from './components/dashboard/TransactionDrawer';
import { 
  fetchMetrics, 
  fetchTransactions, 
  fetchAlerts 
} from './api/client';
import { createTransactionStream } from './api/sse';

export default function App() {
  const [activeTab, setActiveTab] = useState('Dashboard');
  const [activeNav, setActiveNav] = useState('dashboard');
  const [metrics, setMetrics] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [selectedTxn, setSelectedTxn] = useState(null);

  const loadData = useCallback(async () => {
    try {
      const [m, txnsRes, alt] = await Promise.all([
        fetchMetrics().catch(() => null),
        fetchTransactions({ page: 1, limit: 15 }).catch(() => ({ transactions: [] })),
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

  return (
    <div className="app-container">
      {/* Top Navigation Bar */}
      <Topbar 
        activeTab={activeTab} 
        onSelectTab={setActiveTab} 
      />

      {/* Greeting & Date Header */}
      <DashboardHeader 
        onAddAction={() => {
          if (transactions.length > 0) setSelectedTxn(transactions[0]);
        }} 
      />

      {/* Main Layout: Slim Floating Dock + 3-Column Content Grid */}
      <div className="dashboard-main-layout">
        {/* Left Slim Floating Rail */}
        <Sidebar 
          activeNav={activeNav} 
          onSelectNav={setActiveNav} 
        />

        {/* 3-Column Grid */}
        <main className="dashboard-grid-3col">
          {/* Column 1: Payment Goal Card with Emerald Visa + Payment History */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <FraudCard metrics={metrics} />
            <LiveTransactions 
              transactions={transactions} 
              onSelectTransaction={setSelectedTxn} 
            />
          </div>

          {/* Column 2: Engagement Rate Chart (Striped Mint Bars) + Operational Controls */}
          <div>
            <TransactionChart 
              onSimulationTriggered={(res) => {
                if (res?.transaction) {
                  setTransactions((prev) => [res.transaction, ...prev]);
                  loadData();
                }
              }} 
            />
          </div>

          {/* Column 3: Payment Goal Wave Chart + Amount of Credit + Mandatory Payments Avatars */}
          <div>
            <RightColumnCards 
              metrics={metrics} 
              alert={alerts[0]} 
              onTriggerAlert={() => {
                if (transactions.length > 0) setSelectedTxn(transactions[0]);
              }} 
            />
          </div>
        </main>
      </div>

      {/* Transaction Inspection Drawer */}
      <TransactionDrawer 
        transaction={selectedTxn} 
        onClose={() => setSelectedTxn(null)} 
      />
    </div>
  );
}

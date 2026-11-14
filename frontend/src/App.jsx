import React, { useState, useEffect, useCallback } from 'react';
import { Sidebar } from './components/layout/Sidebar';
import { Topbar } from './components/layout/Topbar';
import { DashboardHeader } from './components/dashboard/DashboardHeader';
import { MetricCard } from './components/dashboard/MetricCard';
import { TransactionChart } from './components/dashboard/TransactionChart';
import { RiskDistribution } from './components/dashboard/RiskDistribution';
import { LiveTransactions } from './components/dashboard/LiveTransactions';
import { TransactionDrawer } from './components/dashboard/TransactionDrawer';
import { PolicyControls } from './components/dashboard/PolicyControls';
import { AttackSimulator } from './components/dashboard/AttackSimulator';
import { RecentAlerts } from './components/dashboard/RecentAlerts';
import { 
  fetchMetrics, 
  fetchAnalytics, 
  fetchRiskDistribution, 
  fetchTransactions, 
  fetchPolicy, 
  fetchAlerts 
} from './api/client';
import { createTransactionStream } from './api/sse';

export default function App() {
  const [activeNav, setActiveNav] = useState('overview');
  const [timeframe, setTimeframe] = useState('24h');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedTxn, setSelectedTxn] = useState(null);

  // Connection & sync state
  const [isConnected, setIsConnected] = useState(true);
  const [lastSyncTime, setLastSyncTime] = useState(new Date());

  // Data state
  const [metrics, setMetrics] = useState(null);
  const [analytics, setAnalytics] = useState(null);
  const [riskDist, setRiskDist] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [policy, setPolicy] = useState(null);
  const [alerts, setAlerts] = useState([]);
  const [isLoadingTxns, setIsLoadingTxns] = useState(true);

  // Load dashboard data
  const loadDashboardData = useCallback(async () => {
    try {
      const [m, a, r, p, alt] = await Promise.all([
        fetchMetrics().catch(() => null),
        fetchAnalytics(timeframe).catch(() => null),
        fetchRiskDistribution().catch(() => null),
        fetchPolicy().catch(() => null),
        fetchAlerts().catch(() => [])
      ]);

      if (m) setMetrics(m);
      if (a) setAnalytics(a);
      if (r) setRiskDist(r);
      if (p) setPolicy(p);
      if (alt) setAlerts(alt);
      setLastSyncTime(new Date());
    } catch (err) {
      console.error('Error loading dashboard data:', err);
    }
  }, [timeframe]);

  // Load transactions based on search and filters
  const loadTransactions = useCallback(async () => {
    setIsLoadingTxns(true);
    try {
      const res = await fetchTransactions({
        search: searchQuery,
        status: statusFilter,
        page: 1,
        limit: 25
      });
      setTransactions(res.transactions || []);
    } catch (err) {
      console.error('Failed to load transactions:', err);
    } finally {
      setIsLoadingTxns(false);
    }
  }, [searchQuery, statusFilter]);

  // Initial load
  useEffect(() => {
    loadDashboardData();
  }, [loadDashboardData]);

  useEffect(() => {
    loadTransactions();
  }, [loadTransactions]);

  // Subscribe to real-time SSE stream
  useEffect(() => {
    const unsubscribe = createTransactionStream({
      onTransaction: (newTxn) => {
        // Prepend new transaction in real-time
        setTransactions((prev) => {
          const exists = prev.some((t) => t.id === newTxn.id);
          if (exists) return prev;
          return [newTxn, ...prev];
        });
        setLastSyncTime(new Date());

        // Refresh metrics lightly
        fetchMetrics().then(setMetrics).catch(() => {});
        fetchRiskDistribution().then(setRiskDist).catch(() => {});
        fetchAlerts().then(setAlerts).catch(() => {});
      },
      onStatusChange: ({ connected, lastConnected }) => {
        setIsConnected(connected);
        if (lastConnected) setLastSyncTime(lastConnected);
      }
    });

    return () => unsubscribe();
  }, []);

  return (
    <div className="app-layout">
      {/* Sidebar Navigation */}
      <Sidebar
        activeNav={activeNav}
        onSelectNav={setActiveNav}
        isConnected={isConnected}
      />

      {/* Main Content Area */}
      <div className="main-wrapper">
        {/* Topbar */}
        <Topbar
          isConnected={isConnected}
          lastSyncTime={lastSyncTime}
          searchValue={searchQuery}
          onSearch={setSearchQuery}
          alertCount={alerts.length}
        />

        {/* Dashboard Body */}
        <main className="dashboard-content">
          {/* Header */}
          <DashboardHeader
            timeframe={timeframe}
            onTimeframeChange={setTimeframe}
          />

          {/* 4 Summary KPI Cards */}
          <section className="kpi-grid">
            <MetricCard
              type="transactions"
              title="Transactions today"
              value={metrics?.transactions_today?.value?.toLocaleString() || '24,780'}
              changePercent={metrics?.transactions_today?.change_percent ?? 12.5}
              sparkline={metrics?.transactions_today?.sparkline || [22100, 22800, 23400, 23900, 24200, 24500, 24780]}
            />
            <MetricCard
              type="flagged"
              title="Flagged for review"
              value={metrics?.flagged_for_review?.value?.toLocaleString() || '126'}
              changePercent={metrics?.flagged_for_review?.change_percent ?? 8.2}
              sparkline={metrics?.flagged_for_review?.sparkline || [110, 114, 118, 122, 119, 123, 126]}
            />
            <MetricCard
              type="blocked"
              title="Fraud blocked"
              value={metrics?.fraud_blocked?.value_formatted || '₹4.82L'}
              changePercent={metrics?.fraud_blocked?.change_percent ?? 18.7}
              sparkline={metrics?.fraud_blocked?.sparkline || [3.9, 4.1, 4.25, 4.4, 4.6, 4.75, 4.82]}
            />
            <MetricCard
              type="latency"
              title="Avg scoring latency"
              value={metrics?.avg_scoring_latency?.value_formatted || '128 ms'}
              changePercent={metrics?.avg_scoring_latency?.change_percent ?? -21.3}
              sparkline={metrics?.avg_scoring_latency?.sparkline || [165, 154, 148, 138, 132, 130, 128]}
            />
          </section>

          {/* Mid Section: Transaction Activity Chart & Risk Distribution */}
          <section className="analytics-grid">
            <TransactionChart
              analyticsData={analytics}
              timeframe={timeframe}
              onTimeframeChange={setTimeframe}
            />
            <RiskDistribution
              distributionData={riskDist}
            />
          </section>

          {/* Operations Grid: Live Transactions Table & Right Controls */}
          <section className="operations-grid">
            {/* Live Transactions Table */}
            <LiveTransactions
              transactions={transactions}
              isLoading={isLoadingTxns}
              searchTerm={searchQuery}
              onSearchChange={setSearchQuery}
              statusFilter={statusFilter}
              onStatusFilterChange={setStatusFilter}
              onSelectTransaction={setSelectedTxn}
            />

            {/* Right Controls Column */}
            <div className="operations-controls-col">
              <PolicyControls
                initialPolicy={policy}
                onPolicySaved={(p) => setPolicy(p)}
              />

              <AttackSimulator
                onSimulationResult={(res) => {
                  if (res?.transaction) {
                    setTransactions((prev) => [res.transaction, ...prev]);
                    loadDashboardData();
                  }
                }}
              />

              <RecentAlerts
                alerts={alerts}
                onAlertClick={(alert) => {
                  // If alert matches a transaction, open drawer or focus
                }}
              />
            </div>
          </section>
        </main>
      </div>

      {/* Transaction Details Inspection Drawer */}
      <TransactionDrawer
        transaction={selectedTxn}
        onClose={() => setSelectedTxn(null)}
      />
    </div>
  );
}

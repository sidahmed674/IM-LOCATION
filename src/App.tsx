/**
 * IM LOCATION - Main Application Entrypoint
 * Professional Car Rental & Fleet POS for the Algerian Market
 */

import React from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { Header } from './components/common/Header';
import { Sidebar } from './components/common/Sidebar';
import { PinLockScreen } from './components/common/PinLockScreen';

// Views
import { DashboardView } from './components/dashboard/DashboardView';
import { FleetView } from './components/fleet/FleetView';
import { FleetCalendarView } from './components/fleet/FleetCalendarView';
import { MaintenanceView } from './components/maintenance/MaintenanceView';
import { CustomersView } from './components/customers/CustomersView';
import { RentalsView } from './components/rentals/RentalsView';
import { InvoicesView } from './components/invoices/InvoicesView';
import { FinanceView } from './components/finance/FinanceView';
import { ReportsView } from './components/reports/ReportsView';
import { SettingsBackupView } from './components/settings/SettingsBackupView';

// Modals
import { NewRentalModal } from './components/rentals/NewRentalModal';
import { ReturnModal } from './components/returns/ReturnModal';
import { ContractPrintView } from './components/contracts/ContractPrintView';
import { InvoicePrintView } from './components/invoices/InvoicePrintView';
import { CheckCircle2, AlertCircle, AlertTriangle, Info, X } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';

const pageVariants = {
  initial: { opacity: 0, y: 14, scale: 0.995 },
  animate: { opacity: 1, y: 0, scale: 1 },
  exit: { opacity: 0, y: -10, scale: 0.995 }
};

const pageTransition = {
  type: 'spring' as const,
  stiffness: 380,
  damping: 28,
  mass: 0.6
};

const AppContent: React.FC = () => {
  const { activeTab, toasts, removeToast, isLocked } = useApp();

  return (
    <div className="min-h-screen bg-neutral-100 dark:bg-neutral-950 text-neutral-900 dark:text-neutral-100 flex flex-col font-sans transition-colors duration-200">
      {/* PIN Security Lock Screen (Passcode: 0000) */}
      <AnimatePresence>
        {isLocked && <PinLockScreen />}
      </AnimatePresence>

      {/* Top Application Header */}
      <Header />

      {/* Main Workspace Canvas: Sidebar + Scrollable Viewport */}
      <div className="flex-1 flex overflow-hidden">
        <Sidebar />

        <main className="flex-1 overflow-y-auto p-3 sm:p-6 lg:p-8 pb-24 lg:pb-8">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              variants={pageVariants}
              initial="initial"
              animate="animate"
              exit="exit"
              transition={pageTransition}
              className="max-w-7xl mx-auto"
            >
              {activeTab === 'dashboard' && <DashboardView />}
              {activeTab === 'fleet' && <FleetView />}
              {activeTab === 'fleet_calendar' && <FleetCalendarView />}
              {activeTab === 'maintenance' && <MaintenanceView />}
              {activeTab === 'customers' && <CustomersView />}
              {activeTab === 'rentals' && <RentalsView />}
              {activeTab === 'invoices' && <InvoicesView />}
              {activeTab === 'finance' && <FinanceView />}
              {activeTab === 'reports' && <ReportsView />}
              {activeTab === 'backup' && <SettingsBackupView initialTab="BACKUP" />}
              {activeTab === 'settings' && <SettingsBackupView initialTab="SETTINGS" />}
            </motion.div>
          </AnimatePresence>
        </main>
      </div>

      {/* Global Interactive Modals */}
      <NewRentalModal />
      <ReturnModal />
      <ContractPrintView />
      <InvoicePrintView />

      {/* Toast Notifications Overlay with Spring Animation */}
      <div className="fixed bottom-4 end-4 z-50 flex flex-col gap-2 max-w-sm pointer-events-none">
        <AnimatePresence>
          {toasts.map(t => (
            <motion.div
              key={t.id}
              initial={{ opacity: 0, y: 25, scale: 0.92 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 15, scale: 0.92 }}
              transition={{ type: 'spring', stiffness: 450, damping: 25 }}
              className={`pointer-events-auto flex items-center justify-between gap-3 p-3.5 rounded-xl shadow-xl text-sm font-semibold border backdrop-blur-md transition-colors ${
                t.type === 'success'
                  ? 'bg-neutral-900/95 border-emerald-500/40 text-emerald-400'
                  : t.type === 'error'
                  ? 'bg-neutral-900/95 border-red-500/40 text-red-400'
                  : t.type === 'warning'
                  ? 'bg-neutral-900/95 border-amber-500/40 text-amber-400'
                  : 'bg-neutral-900/95 border-neutral-700 text-neutral-200'
              }`}
            >
              <div className="flex items-center gap-2.5">
                {t.type === 'success' && <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />}
                {t.type === 'error' && <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />}
                {t.type === 'warning' && <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />}
                {t.type === 'info' && <Info className="w-4 h-4 text-neutral-400 shrink-0" />}
                <span>{t.message}</span>
              </div>
              <button
                onClick={() => removeToast(t.id)}
                className="text-neutral-500 hover:text-white cursor-pointer p-0.5 rounded-lg hover:bg-white/10"
              >
                <X className="w-4 h-4" />
              </button>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default function App() {
  return (
    <AppProvider>
      <AppContent />
    </AppProvider>
  );
}

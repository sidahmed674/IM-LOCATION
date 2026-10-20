import React from 'react';
import { 
  LayoutDashboard, Car, Calendar, Wrench, 
  Users, Key, FileCheck, Wallet, BarChart3, 
  Database, Settings, Plus, RotateCcw, X, Menu, Check
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { dbStore } from '../../db/store';
import { NavigationTab } from '../../types';

interface SidebarContentProps {
  onItemClick?: () => void;
}

const SidebarContent: React.FC<SidebarContentProps> = ({ onItemClick }) => {
  const { activeTab, setActiveTab, t, openNewRentalModal, language } = useApp();

  const vehicles = dbStore.getVehicles();
  const rentals = dbStore.getRentals();
  const maintenance = dbStore.getMaintenanceRecords();

  const availableCount = vehicles.filter(v => v.status === 'AVAILABLE').length;
  const rentedCount = vehicles.filter(v => v.status === 'RENTED').length;
  const maintCount = vehicles.filter(v => v.status === 'MAINTENANCE').length;

  const sections: {
    category?: string;
    items: {
      id: NavigationTab;
      label: string;
      icon: React.ElementType;
      badge?: number;
      badgeColor?: string;
    }[];
  }[] = [
    {
      items: [
        { id: 'dashboard', label: t.navDashboard, icon: LayoutDashboard }
      ]
    },
    {
      category: t.groupFlotte,
      items: [
        { id: 'fleet', label: t.navFlotteAutomobile, icon: Car, badge: vehicles.length > 0 ? vehicles.length : undefined },
        { id: 'fleet_calendar', label: t.navCalendrierFlotte, icon: Calendar },
        { id: 'maintenance', label: t.navEntretienVidange, icon: Wrench, badge: maintCount > 0 ? maintCount : undefined, badgeColor: 'bg-amber-500/20 text-amber-400' }
      ]
    },
    {
      category: t.groupLocations,
      items: [
        { id: 'customers', label: t.navFichierClients, icon: Users },
        { id: 'rentals', label: t.navLocationsReservations, icon: Key, badge: rentedCount > 0 ? rentedCount : undefined, badgeColor: 'bg-blue-500/20 text-blue-400' },
        { id: 'invoices', label: t.navContratsFactures, icon: FileCheck }
      ]
    },
    {
      category: t.groupComptabilite,
      items: [
        { id: 'finance', label: t.navCaisseFinance, icon: Wallet },
        { id: 'reports', label: t.navRapportsStatistiques, icon: BarChart3 }
      ]
    },
    {
      category: t.groupSysteme,
      items: [
        { id: 'backup', label: t.navSauvegardeDonnees, icon: Database },
        { id: 'settings', label: t.navParametresAgence, icon: Settings }
      ]
    }
  ];

  return (
    <div className="flex-1 flex flex-col justify-between overflow-y-auto">
      <div>
        {/* Prominent New Contract Button */}
        <div className="p-3 pb-1 pt-3.5">
          <button
            onClick={() => {
              openNewRentalModal();
              if (onItemClick) onItemClick();
            }}
            className="w-full flex items-center justify-center gap-2.5 px-4 py-3 rounded-2xl bg-gradient-to-r from-amber-500 via-amber-400 to-yellow-400 hover:from-amber-400 hover:to-yellow-300 active:scale-97 text-neutral-950 font-black text-xs sm:text-sm transition-all shadow-md shadow-amber-500/30 border-2 border-amber-300 font-bukra italic cursor-pointer group"
          >
            <div className="w-6 h-6 rounded-lg bg-neutral-950/15 flex items-center justify-center shrink-0">
              <Plus className="w-3.5 h-3.5 stroke-[3] text-neutral-950 group-hover:rotate-90 transition-transform duration-200" />
            </div>
            <span className="truncate tracking-tight font-extrabold">{t.actionNouveauContrat}</span>
          </button>
        </div>

        {/* Navigation Sections */}
        <nav className="p-3 pt-2 space-y-3.5">
          {sections.map((sec, idx) => (
            <div key={idx} className="space-y-0.5">
              {sec.category && (
                <div className="px-3 pt-2 pb-1 text-[10px] font-bold tracking-wider uppercase text-neutral-500 dark:text-neutral-400 font-bukra italic">
                  {sec.category}
                </div>
              )}

              {sec.items.map((item) => {
                const Icon = item.icon;
                const isActive = activeTab === item.id;

                return (
                  <button
                    key={item.id}
                    onClick={() => {
                      setActiveTab(item.id);
                      if (onItemClick) onItemClick();
                    }}
                    className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer group ${
                      isActive
                        ? 'bg-amber-500 text-neutral-950 font-bold shadow-md shadow-amber-500/20 border border-amber-400/60 font-bukra italic'
                        : 'text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 hover:text-neutral-950 dark:hover:text-white'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <Icon
                        className={`w-4 h-4 shrink-0 transition-colors ${
                          isActive ? 'text-neutral-950' : 'text-neutral-400 group-hover:text-amber-500'
                        }`}
                      />
                      <span className="truncate">{item.label}</span>
                    </div>

                    {item.badge !== undefined && (
                      <span
                        className={`px-1.5 py-0.5 rounded text-[10px] font-mono font-bold tabular-nums shrink-0 ${
                          isActive
                            ? 'bg-neutral-950/20 text-neutral-950'
                            : item.badgeColor || 'bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400'
                        }`}
                      >
                        {item.badge}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          ))}
        </nav>
      </div>

      {/* Mini Fleet Status Gauge Box */}
      <div className="p-3 border-t border-neutral-200 dark:border-neutral-800/80 bg-neutral-50 dark:bg-neutral-950/50 mt-4">
        <div className="text-[11px] font-bold text-neutral-700 dark:text-neutral-400 mb-2 flex items-center justify-between font-bukra italic">
          <span>{t.navFlotteAutomobile}</span>
          <span className="font-mono text-neutral-900 dark:text-neutral-300 text-xs font-bold">{vehicles.length}</span>
        </div>

        <div className="space-y-1.5 text-xs">
          <div className="flex items-center justify-between text-neutral-700 dark:text-neutral-300">
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block" />
              <span>{t.statusAvailable}</span>
            </div>
            <span className="font-mono tabular-nums font-bold text-emerald-600 dark:text-emerald-400">{availableCount}</span>
          </div>

          <div className="flex items-center justify-between text-neutral-700 dark:text-neutral-300">
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-blue-500 inline-block" />
              <span>{t.statusRented}</span>
            </div>
            <span className="font-mono tabular-nums font-bold text-blue-600 dark:text-blue-400">{rentedCount}</span>
          </div>

          <div className="flex items-center justify-between text-neutral-700 dark:text-neutral-300">
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-amber-500 inline-block" />
              <span>{t.statusMaintenance}</span>
            </div>
            <span className="font-mono tabular-nums font-bold text-amber-600 dark:text-amber-400">{maintCount}</span>
          </div>
        </div>

        <div className="mt-2.5 pt-2 border-t border-neutral-200 dark:border-neutral-800 text-[10px] text-neutral-500 dark:text-neutral-400 flex items-center justify-between font-mono">
          <span>DZD (د.ج)</span>
          <span className="text-emerald-600 dark:text-emerald-400 font-bold flex items-center gap-1">
            <span>Système Prêt</span>
            <Check className="w-3 h-3 stroke-[3]" />
          </span>
        </div>
      </div>
    </div>
  );
};

export const Sidebar: React.FC = () => {
  const { 
    activeTab, setActiveTab, t, 
    openNewRentalModal, isMobileMenuOpen, 
    setIsMobileMenuOpen, language 
  } = useApp();

  return (
    <>
      {/* 1. Desktop Static Sidebar (Visible on lg and larger screens) */}
      <aside className="hidden lg:flex w-64 xl:w-68 bg-white dark:bg-neutral-900 border-e border-neutral-200 dark:border-neutral-800 text-neutral-800 dark:text-neutral-300 flex-col shrink-0 select-none transition-colors">
        <SidebarContent />
      </aside>

      {/* 2. Mobile Drawer Slide-out (Smooth backdrop & drawer for phones & tablets) */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 z-50 lg:hidden flex">
          {/* Backdrop overlay */}
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity duration-200 animate-fadeIn"
            onClick={() => setIsMobileMenuOpen(false)}
          />

          {/* Drawer container */}
          <div className="relative w-72 max-w-[85vw] bg-white dark:bg-neutral-900 text-neutral-800 dark:text-neutral-200 h-full flex flex-col z-10 shadow-2xl overflow-y-auto">
            {/* Drawer Top Header */}
            <div className="p-3.5 border-b border-neutral-200 dark:border-neutral-800 flex items-center justify-between bg-neutral-50 dark:bg-neutral-950/50">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-red-600 to-amber-600 flex items-center justify-center text-white font-black font-bukra italic text-sm">
                  IM
                </div>
                <div>
                  <div className="font-bold font-bukra italic text-xs text-neutral-900 dark:text-white">
                    IM LOCATION
                  </div>
                  <div className="text-[10px] text-neutral-500 font-mono">
                    Navigation & Menu
                  </div>
                </div>
              </div>

              <button
                onClick={() => setIsMobileMenuOpen(false)}
                className="p-1.5 rounded-lg text-neutral-500 hover:text-neutral-900 dark:hover:text-white hover:bg-neutral-200 dark:hover:bg-neutral-800 cursor-pointer"
                title="Fermer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Navigation in Drawer */}
            <SidebarContent onItemClick={() => setIsMobileMenuOpen(false)} />
          </div>
        </div>
      )}

      {/* 3. Mobile Bottom Navigation Bar (Fixed for 1-tap thumb navigation on smartphones) */}
      <nav className="lg:hidden fixed bottom-0 inset-x-0 z-40 bg-white/95 dark:bg-neutral-900/95 backdrop-blur-md border-t border-neutral-200 dark:border-neutral-800 shadow-xl px-2 py-1.5 flex items-center justify-around select-none">
        {/* 1. Dashboard */}
        <button
          onClick={() => setActiveTab('dashboard')}
          className={`flex flex-col items-center justify-center py-1 px-2 rounded-xl text-[10px] font-semibold transition-all cursor-pointer ${
            activeTab === 'dashboard' ? 'text-amber-500 font-bold' : 'text-neutral-600 dark:text-neutral-400'
          }`}
        >
          <LayoutDashboard className="w-4 h-4 mb-0.5" />
          <span className="truncate max-w-[55px] font-bukra italic text-[9px]">{t.navDashboard}</span>
        </button>

        {/* 2. Fleet */}
        <button
          onClick={() => setActiveTab('fleet')}
          className={`flex flex-col items-center justify-center py-1 px-2 rounded-xl text-[10px] font-semibold transition-all cursor-pointer ${
            activeTab === 'fleet' || activeTab === 'fleet_calendar' ? 'text-amber-500 font-bold' : 'text-neutral-600 dark:text-neutral-400'
          }`}
        >
          <Car className="w-4 h-4 mb-0.5" />
          <span className="truncate max-w-[55px] font-bukra italic text-[9px]">{t.navFlotteAutomobile}</span>
        </button>

        {/* Center Prominent Floating Action: New Contract */}
        <button
          onClick={() => openNewRentalModal()}
          className="flex flex-col items-center justify-center -mt-5 w-12 h-12 rounded-full bg-gradient-to-tr from-amber-500 via-amber-400 to-yellow-400 text-neutral-950 shadow-lg shadow-amber-500/40 border-2 border-white dark:border-neutral-900 cursor-pointer active:scale-95 transition-transform"
          title={t.actionNouveauContrat}
        >
          <Plus className="w-6 h-6 stroke-[3]" />
        </button>

        {/* 3. Rentals */}
        <button
          onClick={() => setActiveTab('rentals')}
          className={`flex flex-col items-center justify-center py-1 px-2 rounded-xl text-[10px] font-semibold transition-all cursor-pointer ${
            activeTab === 'rentals' || activeTab === 'invoices' ? 'text-amber-500 font-bold' : 'text-neutral-600 dark:text-neutral-400'
          }`}
        >
          <Key className="w-4 h-4 mb-0.5" />
          <span className="truncate max-w-[55px] font-bukra italic text-[9px]">{t.navLocationsReservations}</span>
        </button>

        {/* 4. More Menu Drawer */}
        <button
          onClick={() => setIsMobileMenuOpen(true)}
          className={`flex flex-col items-center justify-center py-1 px-2 rounded-xl text-[10px] font-semibold transition-all cursor-pointer ${
            isMobileMenuOpen ? 'text-amber-500 font-bold' : 'text-neutral-600 dark:text-neutral-400'
          }`}
        >
          <Menu className="w-4 h-4 mb-0.5" />
          <span className="truncate max-w-[55px] font-bukra italic text-[9px]">
            {language === 'ar' ? 'القائمة' : 'Menu'}
          </span>
        </button>
      </nav>
    </>
  );
};

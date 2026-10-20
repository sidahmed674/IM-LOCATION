import React, { createContext, useContext, useState, useEffect } from 'react';
import { Language, translations } from '../locales/translations';
import { dbStore } from '../db/store';
import { RentalContract, SmartAlert, Invoice, NavigationTab } from '../types';

export interface ToastMessage {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  message: string;
}

interface AppContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: typeof translations['ar'];
  theme: 'dark' | 'light';
  toggleTheme: () => void;
  activeTab: NavigationTab;
  setActiveTab: (tab: NavigationTab) => void;
  isMobileMenuOpen: boolean;
  setIsMobileMenuOpen: (open: boolean) => void;
  toggleMobileMenu: () => void;
  
  // Security & PIN Lock State (0000)
  isLocked: boolean;
  unlockWithPin: (pin: string) => boolean;
  lockSession: () => void;

  // Modals & Triggers
  isNewRentalModalOpen: boolean;
  rentalModalMode: 'RENTAL' | 'RESERVATION';
  setRentalModalMode: (mode: 'RENTAL' | 'RESERVATION') => void;
  openNewRentalModal: (preselectedVehicleId?: string, mode?: 'RENTAL' | 'RESERVATION', initialDate?: string) => void;
  openNewReservationModal: (initialDate?: string) => void;
  closeNewRentalModal: () => void;
  preselectedVehicleId: string | null;
  preselectedDate: string | null;

  isReturnModalOpen: boolean;
  openReturnModal: (preselectedContractId?: string) => void;
  closeReturnModal: () => void;
  preselectedContractId: string | null;

  contractToPrint: RentalContract | null;
  setContractToPrint: (c: RentalContract | null) => void;

  invoiceToPrint: Invoice | null;
  setInvoiceToPrint: (inv: Invoice | null) => void;

  // Search & Alerts
  globalSearch: string;
  setGlobalSearch: (q: string) => void;
  alerts: SmartAlert[];
  unreadAlertsCount: number;

  // Desktop Fullscreen
  isFullscreen: boolean;
  toggleFullscreen: () => void;

  // Feedback Toasts
  toasts: ToastMessage[];
  addToast: (msg: string, type?: 'success' | 'error' | 'warning' | 'info') => void;
  removeToast: (id: string) => void;

  // Store sync
  storeVersion: number;
  triggerStoreRefresh: () => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguageState] = useState<Language>(() => {
    return (localStorage.getItem('im_location_lang') as Language) || 'fr';
  });

  const [theme, setThemeState] = useState<'dark' | 'light'>(() => {
    return (localStorage.getItem('im_location_theme') as 'dark' | 'light') || 'dark';
  });

  // Security Lock Gate (Requires PIN: 0000)
  const [isLocked, setIsLocked] = useState<boolean>(() => {
    const sessionUnlocked = sessionStorage.getItem('im_location_session_unlocked');
    return sessionUnlocked !== 'true';
  });

  const [activeTab, setActiveTabState] = useState<NavigationTab>('dashboard');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const toggleMobileMenu = () => setIsMobileMenuOpen(prev => !prev);
  const setActiveTab = (tab: NavigationTab) => {
    setActiveTabState(tab);
    setIsMobileMenuOpen(false);
  };
  const [isNewRentalModalOpen, setIsNewRentalModalOpen] = useState(false);
  const [rentalModalMode, setRentalModalMode] = useState<'RENTAL' | 'RESERVATION'>('RENTAL');
  const [preselectedVehicleId, setPreselectedVehicleId] = useState<string | null>(null);
  const [preselectedDate, setPreselectedDate] = useState<string | null>(null);

  const [isReturnModalOpen, setIsReturnModalOpen] = useState(false);
  const [preselectedContractId, setPreselectedContractId] = useState<string | null>(null);

  const [contractToPrint, setContractToPrint] = useState<RentalContract | null>(null);
  const [invoiceToPrint, setInvoiceToPrint] = useState<Invoice | null>(null);
  const [globalSearch, setGlobalSearch] = useState('');
  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  const [storeVersion, setStoreVersion] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Sync Language & RTL/LTR direction
  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    localStorage.setItem('im_location_lang', lang);
  };

  useEffect(() => {
    document.documentElement.lang = language;
    document.documentElement.dir = language === 'ar' ? 'rtl' : 'ltr';
    if (language === 'ar') {
      document.body.style.fontFamily = "'29LT Bukra', 'Cairo', 'Changa', -apple-system, BlinkMacSystemFont, sans-serif";
    } else {
      document.body.style.fontFamily = "'Plus Jakarta Sans', '29LT Bukra', -apple-system, BlinkMacSystemFont, sans-serif";
    }
  }, [language]);

  // Sync Theme
  const toggleTheme = () => {
    const nextTheme = theme === 'dark' ? 'light' : 'dark';
    setThemeState(nextTheme);
    localStorage.setItem('im_location_theme', nextTheme);
    if (nextTheme === 'dark') {
      document.documentElement.classList.add('dark');
      document.body.classList.add('dark');
      document.documentElement.setAttribute('data-theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      document.body.classList.remove('dark');
      document.documentElement.setAttribute('data-theme', 'light');
    }
  };

  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
      document.body.classList.add('dark');
      document.documentElement.setAttribute('data-theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      document.body.classList.remove('dark');
      document.documentElement.setAttribute('data-theme', 'light');
    }
  }, [theme]);

  // DB subscription
  useEffect(() => {
    const unsubscribe = dbStore.subscribe(() => {
      setStoreVersion(v => v + 1);
    });
    return unsubscribe;
  }, []);

  const triggerStoreRefresh = () => {
    setStoreVersion(v => v + 1);
  };

  const unlockWithPin = (pin: string): boolean => {
    if (pin === '0000') {
      setIsLocked(false);
      sessionStorage.setItem('im_location_session_unlocked', 'true');
      return true;
    }
    return false;
  };

  const lockSession = () => {
    setIsLocked(true);
    sessionStorage.removeItem('im_location_session_unlocked');
  };

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().then(() => setIsFullscreen(true)).catch(() => {});
    } else {
      document.exitFullscreen().then(() => setIsFullscreen(false)).catch(() => {});
    }
  };

  const alerts = dbStore.getSmartAlerts();
  const unreadAlertsCount = alerts.length;

  const t = translations[language] || translations['fr'];

  const addToast = (message: string, type: 'success' | 'error' | 'warning' | 'info' = 'success') => {
    const id = `toast-${Date.now()}-${Math.random()}`;
    setToasts(prev => [...prev, { id, type, message }]);
    setTimeout(() => {
      removeToast(id);
    }, 4000);
  };

  const removeToast = (id: string) => {
    setToasts(prev => prev.filter(item => item.id !== id));
  };

  const openNewRentalModal = (vehicleId?: string, mode: 'RENTAL' | 'RESERVATION' = 'RENTAL', initialDate?: string) => {
    setRentalModalMode(mode);
    setPreselectedVehicleId(vehicleId || null);
    setPreselectedDate(initialDate || null);
    setIsNewRentalModalOpen(true);
  };

  const openNewReservationModal = (initialDate?: string) => {
    openNewRentalModal(undefined, 'RESERVATION', initialDate);
  };

  const closeNewRentalModal = () => {
    setIsNewRentalModalOpen(false);
    setPreselectedVehicleId(null);
    setPreselectedDate(null);
  };

  const openReturnModal = (contractId?: string) => {
    setPreselectedContractId(contractId || null);
    setIsReturnModalOpen(true);
  };

  const closeReturnModal = () => {
    setIsReturnModalOpen(false);
    setPreselectedContractId(null);
  };

  return (
    <AppContext.Provider
      value={{
        language,
        setLanguage,
        t,
        theme,
        toggleTheme,
        activeTab,
        setActiveTab,
        isMobileMenuOpen,
        setIsMobileMenuOpen,
        toggleMobileMenu,
        isLocked,
        unlockWithPin,
        lockSession,
        isNewRentalModalOpen,
        rentalModalMode,
        setRentalModalMode,
        openNewRentalModal,
        openNewReservationModal,
        closeNewRentalModal,
        preselectedVehicleId,
        preselectedDate,
        isReturnModalOpen,
        openReturnModal,
        closeReturnModal,
        preselectedContractId,
        contractToPrint,
        setContractToPrint,
        invoiceToPrint,
        setInvoiceToPrint,
        globalSearch,
        setGlobalSearch,
        alerts,
        unreadAlertsCount,
        isFullscreen,
        toggleFullscreen,
        toasts,
        addToast,
        removeToast,
        storeVersion,
        triggerStoreRefresh,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) throw new Error('useApp must be used within an AppProvider');
  return context;
};

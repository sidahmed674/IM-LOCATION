import React, { useState, useEffect } from 'react';
import { 
  Car, Bell, Sun, Moon, Search, PlusCircle, RotateCcw, 
  Globe, AlertTriangle, Clock, Lock, Maximize, Minimize, Plus, Menu
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { Language } from '../../locales/translations';

export const Header: React.FC = () => {
  const { 
    language, setLanguage, t, theme, toggleTheme, 
    alerts, unreadAlertsCount, setActiveTab,
    openNewRentalModal, openReturnModal,
    globalSearch, setGlobalSearch,
    lockSession, isFullscreen, toggleFullscreen,
    toggleMobileMenu
  } = useApp();

  const [currentTime, setCurrentTime] = useState<string>('');
  const [currentDateFormatted, setCurrentDateFormatted] = useState<string>('');
  const [showAlertsDropdown, setShowAlertsDropdown] = useState(false);

  useEffect(() => {
    const updateClock = () => {
      const now = new Date();
      setCurrentTime(
        now.toLocaleTimeString(language === 'ar' ? 'ar-DZ' : (language === 'fr' ? 'fr-DZ' : 'en-US'), {
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
          hour12: false,
        })
      );
      setCurrentDateFormatted(
        now.toLocaleDateString(language === 'ar' ? 'ar-DZ' : (language === 'fr' ? 'fr-DZ' : 'en-US'), {
          weekday: 'short',
          day: 'numeric',
          month: 'short',
        })
      );
    };
    updateClock();
    const timer = setInterval(updateClock, 1000);
    return () => clearInterval(timer);
  }, [language]);

  return (
    <header className="sticky top-0 z-30 bg-white dark:bg-neutral-900 border-b border-neutral-200 dark:border-neutral-800 text-neutral-800 dark:text-neutral-100 select-none transition-colors shadow-xs">
      {/* Top Desktop & Mobile Windows Bar with CLOCK and LOCK BUTTON */}
      <div className="flex items-center justify-between px-2.5 sm:px-4 py-1 sm:py-1.5 bg-neutral-100 dark:bg-neutral-950 text-neutral-600 dark:text-neutral-400 text-xs border-b border-neutral-200 dark:border-neutral-800/80">
        <div className="flex items-center gap-1.5 sm:gap-2">
          <div className="w-2 h-2 sm:w-2.5 sm:h-2.5 rounded-full bg-emerald-500 animate-pulse" />
          <Car className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-amber-500" />
          <span className="font-bold text-neutral-800 dark:text-neutral-200 font-bukra italic text-[10px] sm:text-xs">
            IM LOCATION · POS Algérie
          </span>
          <span className="hidden sm:inline text-neutral-400 dark:text-neutral-600">|</span>
          <span className="text-neutral-500 dark:text-neutral-400 text-[11px] hidden md:inline">
            RC: 16/01-4962353A20
          </span>
        </div>

        {/* Center/Right: CLOCK DISPLAY & LOCK BUTTON */}
        <div className="flex items-center gap-1.5 sm:gap-3">
          <div className="flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-3.5 py-1 sm:py-1.5 rounded-xl sm:rounded-2xl bg-white dark:bg-neutral-900 border-2 border-amber-500/40 shadow-xs shadow-amber-500/10">
            <Clock className="w-4 h-4 sm:w-5 sm:h-5 text-amber-500 shrink-0" />
            <div className="flex items-baseline gap-1.5 sm:gap-2 font-mono">
              <span className="text-sm sm:text-lg md:text-xl font-black tracking-wider sm:tracking-widest text-amber-600 dark:text-amber-400">
                {currentTime}
              </span>
              <span className="text-xs text-neutral-500 font-sans font-semibold hidden md:inline">
                {currentDateFormatted}
              </span>
            </div>
          </div>

          {/* PROMINENT LOCK BUTTON */}
          <button
            onClick={lockSession}
            className="flex items-center gap-1 sm:gap-1.5 px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 active:scale-95 text-rose-600 dark:text-rose-400 border border-rose-500/30 text-xs font-bold transition-all cursor-pointer font-bukra italic"
            title={t.lockApp}
          >
            <Lock className="w-3.5 h-3.5 stroke-[2.5]" />
            <span className="hidden xs:inline">{t.lockApp}</span>
          </button>

          {/* Fullscreen F11 Toggle */}
          <button
            onClick={toggleFullscreen}
            className="hidden sm:flex p-1.5 text-neutral-500 hover:text-neutral-900 dark:hover:text-white transition-colors cursor-pointer rounded-lg hover:bg-neutral-200 dark:hover:bg-neutral-800"
            title="Plein écran (F11)"
          >
            {isFullscreen ? <Minimize className="w-3.5 h-3.5" /> : <Maximize className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>

      {/* Main Header Bar */}
      <div className="flex items-center justify-between px-2.5 sm:px-4 py-2 sm:py-2.5 gap-2 sm:gap-3">
        {/* Left: Mobile Hamburger Toggle + Brand Identity */}
        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          {/* Mobile Hamburger Drawer Button */}
          <button
            onClick={toggleMobileMenu}
            className="lg:hidden p-2 rounded-xl bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-700 text-neutral-800 dark:text-neutral-200 cursor-pointer border border-neutral-300 dark:border-neutral-700 transition-colors"
            title="Menu"
            aria-label="Toggle navigation menu"
          >
            <Menu className="w-5 h-5" />
          </button>

          <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-br from-red-600 via-red-600 to-amber-600 flex items-center justify-center shadow-md shadow-red-900/30 text-white font-black text-lg sm:text-xl tracking-wider font-bukra italic shrink-0">
            IM
          </div>
          <div>
            <div className="flex items-center gap-1.5 sm:gap-2">
              <h1 className="text-sm sm:text-base font-black font-bukra italic tracking-tight text-neutral-900 dark:text-white leading-tight">
                IM LOCATION
              </h1>
              <span className="text-[9px] sm:text-[10px] font-mono uppercase px-1.5 py-0.5 rounded bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30 font-bold hidden xs:inline">
                DZD · POS
              </span>
            </div>
            <p className="text-[10px] sm:text-[11px] text-neutral-500 dark:text-neutral-400 leading-tight hidden md:block">
              LOCATION DE VOITURE AVEC OU SANS CHAUFFEUR
            </p>
          </div>
        </div>

        {/* Center: THE PRIMARY CTA BUTTON */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          <button
            onClick={() => openNewRentalModal()}
            className="flex items-center gap-1.5 sm:gap-2 px-3 sm:px-5 py-2 sm:py-2.5 rounded-xl bg-gradient-to-r from-amber-500 via-amber-400 to-yellow-400 hover:from-amber-400 hover:to-yellow-300 active:scale-98 text-neutral-950 font-black text-xs sm:text-sm transition-all shadow-md shadow-amber-500/30 cursor-pointer whitespace-nowrap border border-amber-300 font-bukra italic"
          >
            <Plus className="w-4 h-4 stroke-[3]" />
            <span className="hidden xs:inline">{t.actionNouveauContrat}</span>
            <span className="xs:hidden">{language === 'ar' ? 'عقد جديد' : 'Contrat'}</span>
          </button>

          {/* Quick Return Check-in Button */}
          <button
            onClick={() => openReturnModal()}
            className="hidden sm:flex items-center gap-1.5 px-3 py-2 rounded-xl bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-700 active:scale-98 text-neutral-800 dark:text-neutral-200 border border-neutral-300 dark:border-neutral-700 font-semibold text-xs transition-all cursor-pointer whitespace-nowrap shadow-xs"
          >
            <RotateCcw className="w-3.5 h-3.5 text-emerald-500" />
            <span>{t.actionQuickReturn}</span>
          </button>
        </div>

        {/* Right: Quick Search, Trilingual Switcher, Day/Night Theme, Alerts */}
        <div className="flex items-center gap-1 sm:gap-2 shrink-0">
          {/* Global Quick Search */}
          <div className="relative hidden lg:block w-44">
            <Search className="w-3.5 h-3.5 absolute top-1/2 -translate-y-1/2 text-neutral-400 start-2.5 pointer-events-none" />
            <input
              type="text"
              value={globalSearch}
              onChange={(e) => setGlobalSearch(e.target.value)}
              placeholder={t.search}
              className="w-full bg-neutral-100 dark:bg-neutral-800/80 border border-neutral-300 dark:border-neutral-700 rounded-lg py-1.5 ps-8 pe-2.5 text-xs text-neutral-900 dark:text-neutral-200 placeholder-neutral-500 focus:outline-none focus:border-amber-500"
            />
          </div>

          {/* Trilingual Selector: AR / FR / EN */}
          <div className="flex items-center p-0.5 rounded-lg bg-neutral-100 dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-700 text-xs font-semibold">
            <button
              onClick={() => setLanguage('fr')}
              className={`px-2 py-1 rounded-md transition-colors cursor-pointer ${
                language === 'fr' ? 'bg-amber-500 text-neutral-950 font-bold' : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white'
              }`}
              title="Français"
            >
              FR
            </button>
            <button
              onClick={() => setLanguage('ar')}
              className={`px-2 py-1 rounded-md transition-colors cursor-pointer font-bukra ${
                language === 'ar' ? 'bg-amber-500 text-neutral-950 font-bold' : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white'
              }`}
              title="العربية"
            >
              عربي
            </button>
            <button
              onClick={() => setLanguage('en')}
              className={`px-2 py-1 rounded-md transition-colors cursor-pointer ${
                language === 'en' ? 'bg-amber-500 text-neutral-950 font-bold' : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white'
              }`}
              title="English"
            >
              EN
            </button>
          </div>

          {/* Theme Toggle (Day / Night Mode: Working 100%) */}
          <button
            onClick={toggleTheme}
            className="p-1.5 rounded-lg bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-700 border border-neutral-300 dark:border-neutral-700 text-neutral-700 dark:text-neutral-300 transition-colors cursor-pointer"
            title={theme === 'dark' ? 'Mode Jour / نهار' : 'Mode Nuit / ليل'}
          >
            {theme === 'dark' ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-blue-600" />}
          </button>

          {/* Alerts Bell */}
          <div className="relative">
            <button
              onClick={() => setShowAlertsDropdown(prev => !prev)}
              className="p-1.5 rounded-lg bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-700 border border-neutral-300 dark:border-neutral-700 text-neutral-700 dark:text-neutral-300 transition-colors relative cursor-pointer"
              title={t.alertsCount}
            >
              <Bell className="w-4 h-4" />
              {unreadAlertsCount > 0 && (
                <span className="absolute -top-1 -end-1 w-4 h-4 bg-rose-600 text-white rounded-full text-[10px] font-bold flex items-center justify-center font-mono">
                  {unreadAlertsCount}
                </span>
              )}
            </button>

            {/* Dropdown Alert Panel */}
            {showAlertsDropdown && (
              <div className="absolute end-0 mt-2 w-80 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-2xl shadow-2xl p-4 z-50 space-y-3">
                <div className="flex items-center justify-between pb-2 border-b border-neutral-200 dark:border-neutral-800">
                  <span className="font-bold text-xs text-neutral-900 dark:text-white font-bukra italic">{t.alertsCount}</span>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-amber-500/20 text-amber-600 dark:text-amber-400 font-bold">
                    {alerts.length}
                  </span>
                </div>

                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {alerts.length === 0 ? (
                    <div className="text-center py-4 text-xs text-neutral-500">
                      {language === 'ar' ? 'لا توجد تنبيهات عاجلة' : 'Aucune alerte urgente'}
                    </div>
                  ) : (
                    alerts.map(a => (
                      <div
                        key={a.id}
                        className={`p-2.5 rounded-xl border text-xs space-y-1 ${
                          a.severity === 'CRITICAL'
                            ? 'bg-rose-50 dark:bg-rose-500/10 border-rose-200 dark:border-rose-500/30 text-rose-800 dark:text-rose-300'
                            : 'bg-amber-50 dark:bg-amber-500/10 border-amber-200 dark:border-amber-500/30 text-amber-800 dark:text-amber-300'
                        }`}
                      >
                        <div className="flex items-center gap-1.5 font-bold">
                          <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                          <span>{a.title}</span>
                        </div>
                        <div className="text-[11px] opacity-90">{a.description}</div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

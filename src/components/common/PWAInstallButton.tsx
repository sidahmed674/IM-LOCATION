import React, { useState } from 'react';
import { Download, Monitor, CheckCircle, X, Terminal, Sparkles, ExternalLink, ShieldCheck } from 'lucide-react';
import { usePWAInstall } from '../../hooks/usePWAInstall';
import { useApp } from '../../context/AppContext';

export const PWAInstallButton: React.FC = () => {
  const { isInstallable, isInstalled, install } = usePWAInstall();
  const { language, t } = useApp();
  const [showDesktopGuide, setShowDesktopGuide] = useState(false);

  // If already installed and running in native standalone window, show desktop status badge
  if (isInstalled) {
    return (
      <div className="hidden lg:flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 text-[11px] font-mono font-bold">
        <Monitor className="w-3.5 h-3.5" />
        <span>Desktop App ✓</span>
      </div>
    );
  }

  const handleInstallClick = async () => {
    if (isInstallable) {
      await install();
    } else {
      setShowDesktopGuide(true);
    }
  };

  const buttonText = language === 'ar' 
    ? 'تثبيت على سطح المكتب' 
    : (language === 'fr' ? 'Installer sur le Bureau' : 'Install Desktop App');

  return (
    <>
      <button
        onClick={handleInstallClick}
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs shadow-md shadow-emerald-950/40 border border-emerald-400/40 transition-all cursor-pointer font-bukra italic"
        title="Installer l'application sur Windows Desktop"
      >
        <Monitor className="w-3.5 h-3.5 text-emerald-200" />
        <span className="hidden md:inline">{buttonText}</span>
        <span className="md:hidden">Desktop</span>
      </button>

      {/* Interactive Desktop Packaging & Installation Modal */}
      {showDesktopGuide && (
        <div className="fixed inset-0 z-50 bg-neutral-950/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="w-full max-w-xl bg-neutral-900 border border-neutral-700 rounded-3xl p-6 shadow-2xl space-y-5 text-neutral-100 max-h-[90vh] overflow-y-auto">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-amber-500 to-amber-600 flex items-center justify-center text-neutral-950 font-black text-xl shadow-lg shadow-amber-500/20 font-bukra italic">
                  IM
                </div>
                <div>
                  <h3 className="text-base font-bold font-bukra italic text-white">
                    {language === 'ar' ? 'تشغيل وتثبيت التطبيق على سطح المكتب (Windows)' : 'Installation Application Bureau Windows'}
                  </h3>
                  <p className="text-xs text-neutral-400">
                    {language === 'ar' ? 'لديك خياران رسميان لتشغيل IM LOCATION كتطبيق مكتبي مستقل:' : 'Deux méthodes officielles pour exécuter IM LOCATION comme logiciel de bureau :'}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowDesktopGuide(false)}
                className="p-1.5 rounded-lg text-neutral-400 hover:text-white hover:bg-neutral-800 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Option 1: PWA Desktop 1-Click Install */}
            <div className="p-4 rounded-2xl bg-neutral-800/80 border border-neutral-700/80 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-emerald-500 text-neutral-950 font-bold text-xs flex items-center justify-center">1</span>
                  <h4 className="font-bold text-sm text-white font-bukra italic">
                    {language === 'ar' ? 'تثبيت فوري مباشر (Google Chrome / MS Edge)' : 'Installation Immédiate 1-Clic (PWA Standalone)'}
                  </h4>
                </div>
                <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 font-bold">
                  {language === 'ar' ? 'مستحسن وفوري' : 'Recommandé & Instantané'}
                </span>
              </div>
              <p className="text-xs text-neutral-300 leading-relaxed">
                {language === 'ar' 
                  ? 'من خلال متصفح Chrome أو Edge على جهاز الكمبيوتر الخاص بك، انقر على أيقونة التثبيت في شريط العنوان أو في القائمة (⋮) ثم اختر "تثبيت IM LOCATION". سيظهر البرنامج مباشرة على سطح المكتب وفي قائمة إبدأ كنافذة تطبيق مستقلة بدون شريط متصفح وبدعم كامل للعمل دون اتصال بالإنترنت (Offline).'
                  : 'Dans votre navigateur Chrome ou Edge sur PC, cliquez sur l’icône d’installation dans la barre d’adresse ou le menu (⋮) puis choisissez « Installer IM LOCATION ». L’application s’ouvrira dans sa propre fenêtre bureau sans barre de navigation et fonctionnera 100% hors-ligne.'}
              </p>
            </div>

            {/* Option 2: Native Electron Packaging */}
            <div className="p-4 rounded-2xl bg-neutral-800/80 border border-neutral-700/80 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-amber-500 text-neutral-950 font-bold text-xs flex items-center justify-center">2</span>
                  <h4 className="font-bold text-sm text-white font-bukra italic">
                    {language === 'ar' ? 'حزمة Electron وملف التثبيت التنفيذي (IM LOCATION.exe)' : 'Package Electron Natif (.EXE Windows)'}
                  </h4>
                </div>
                <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded bg-amber-500/20 text-amber-400 font-bold">
                  Electron Ready
                </span>
              </div>
              <p className="text-xs text-neutral-300 leading-relaxed">
                {language === 'ar'
                  ? 'تم تجهيز ملفات Electron الرسمية داخل المشروع (`electron/main.cjs` و `preload.cjs`). لتحويل المشروع إلى ملف `.exe` على حاسوبك:'
                  : 'Les fichiers Electron sont déjà configurés (`electron/main.cjs` et `preload.cjs`). Pour générer le fichier d’installation .exe sur votre PC :'}
              </p>

              <div className="p-3 rounded-xl bg-neutral-950 font-mono text-xs text-amber-400 space-y-1.5 border border-neutral-800">
                <div className="text-neutral-500"># 1. Installer Electron & Electron-Builder</div>
                <div>npm install electron electron-builder concurrently --save-dev</div>
                <div className="text-neutral-500 mt-2"># 2. Lancer en mode bureau Windows local</div>
                <div>npm run electron:dev</div>
                <div className="text-neutral-500 mt-2"># 3. Compiler l'installateur Windows (.exe)</div>
                <div>npm run electron:build</div>
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                onClick={() => setShowDesktopGuide(false)}
                className="px-5 py-2.5 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-white font-bold text-xs cursor-pointer"
              >
                {t.close}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

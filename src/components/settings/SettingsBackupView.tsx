import React, { useState, useEffect } from 'react';
import { 
  Database, Download, Upload, RefreshCw, 
  Settings, Building, FileCode, Check, Shield
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { dbStore } from '../../db/store';
import { ERD_SPECIFICATION, API_ENDPOINTS_SPECIFICATION } from '../../db/api_spec';

interface SettingsBackupViewProps {
  initialTab?: 'SETTINGS' | 'BACKUP' | 'ERD';
}

export const SettingsBackupView: React.FC<SettingsBackupViewProps> = ({ initialTab }) => {
  const { t, language, addToast, triggerStoreRefresh, activeTab } = useApp();
  const currentSettings = dbStore.getSettings();

  const [agencyData, setAgencyData] = useState({ ...currentSettings });
  const [activeSubTab, setActiveSubTab] = useState<'SETTINGS' | 'ERD' | 'BACKUP'>(() => {
    if (activeTab === 'backup') return 'BACKUP';
    if (activeTab === 'settings') return 'SETTINGS';
    return initialTab || 'SETTINGS';
  });

  useEffect(() => {
    if (activeTab === 'backup') setActiveSubTab('BACKUP');
    else if (activeTab === 'settings') setActiveSubTab('SETTINGS');
  }, [activeTab]);

  const handleSaveSettings = (e: React.FormEvent) => {
    e.preventDefault();
    dbStore.updateSettings(agencyData);
    addToast(language === 'ar' ? 'تم حفظ إعدادات الوكالة بنجاح' : 'Paramètres enregistrés avec succès', 'success');
  };

  const handleExportSql = () => {
    const sql = dbStore.exportSqlDump();
    const blob = new Blob([sql], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `im_location_dump_${new Date().toISOString().split('T')[0]}.sql`;
    link.click();
    addToast(language === 'ar' ? 'تم تحميل ملف SQLite SQL بنجاح' : 'Dump SQL exporté avec succès', 'success');
  };

  const handleExportJson = () => {
    const json = dbStore.exportJson();
    const blob = new Blob([json], { type: 'application/json;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `im_location_backup_${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    addToast(language === 'ar' ? 'تم تصدير ملف النسخة الاحتياطية JSON' : 'Sauvegarde JSON téléchargée', 'success');
  };

  const handleImportJson = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const content = event.target?.result as string;
        dbStore.importJson(content);
        triggerStoreRefresh();
        addToast(language === 'ar' ? 'تمت استعادة البيانات بنجاح' : 'Données restaurées avec succès', 'success');
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : 'Erreur de lecture';
        addToast(msg, 'error');
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-neutral-200 dark:border-neutral-800">
        <div>
          <h2 className="text-xl font-bold font-bukra italic tracking-tight text-neutral-900 dark:text-white">
            {activeSubTab === 'BACKUP' ? t.navSauvegardeDonnees : t.navParametresAgence}
          </h2>
          <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">
            {language === 'ar'
              ? 'إدارة قاعدة بيانات SQLite المحلية، النسخ الاحتياطي، وإعدادات الوكالة والعقود'
              : 'Base de données SQLite locale, sauvegardes et configuration de l’agence'}
          </p>
        </div>

        {/* Sub-tab selection */}
        <div className="flex items-center gap-1 p-1 bg-neutral-100 dark:bg-neutral-800 rounded-xl text-xs font-semibold self-start sm:self-auto font-bukra italic">
          <button
            onClick={() => setActiveSubTab('BACKUP')}
            className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${
              activeSubTab === 'BACKUP' ? 'bg-amber-500 text-neutral-950 font-bold shadow-xs' : 'text-neutral-500 hover:text-white'
            }`}
          >
            {t.navSauvegardeDonnees}
          </button>
          <button
            onClick={() => setActiveSubTab('SETTINGS')}
            className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${
              activeSubTab === 'SETTINGS' ? 'bg-amber-500 text-neutral-950 font-bold shadow-xs' : 'text-neutral-500 hover:text-white'
            }`}
          >
            {t.navParametresAgence}
          </button>
          <button
            onClick={() => setActiveSubTab('ERD')}
            className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${
              activeSubTab === 'ERD' ? 'bg-amber-500 text-neutral-950 font-bold shadow-xs' : 'text-neutral-500 hover:text-white'
            }`}
          >
            {language === 'ar' ? 'مخطط العلاقات (ERD)' : 'Schéma ERD & API'}
          </button>
        </div>
      </div>

      {/* Subtab 1: Agency Settings */}
      {activeSubTab === 'SETTINGS' && (
        <form onSubmit={handleSaveSettings} className="space-y-4 text-xs">
          <div className="p-5 rounded-2xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 shadow-xs space-y-4">
            <h3 className="font-bold text-sm text-neutral-900 dark:text-white flex items-center gap-2 font-bukra italic">
              <Building className="w-4 h-4 text-amber-500" />
              <span>{language === 'ar' ? 'بيانات وكالة تأجير السيارات (تظهر في رأس العقد والفاتورة A4)' : 'Coordonnées de l’Agence (Entête de Contrat & Facture)'}</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-neutral-700 dark:text-neutral-300 font-medium mb-1">
                  Nom de l'Agence
                </label>
                <input
                  type="text"
                  required
                  value={agencyData.agencyName}
                  onChange={(e) => setAgencyData({ ...agencyData, agencyName: e.target.value })}
                  className="w-full bg-neutral-50 dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-700 rounded-lg p-2 font-bold"
                />
              </div>

              <div>
                <label className="block text-neutral-700 dark:text-neutral-300 font-medium mb-1">
                  Slogan / Activité
                </label>
                <input
                  type="text"
                  value={agencyData.brandSlogan}
                  onChange={(e) => setAgencyData({ ...agencyData, brandSlogan: e.target.value })}
                  className="w-full bg-neutral-50 dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-700 rounded-lg p-2"
                />
              </div>

              <div>
                <label className="block text-neutral-700 dark:text-neutral-300 font-medium mb-1">
                  Adresse & Ville
                </label>
                <input
                  type="text"
                  value={agencyData.address}
                  onChange={(e) => setAgencyData({ ...agencyData, address: e.target.value })}
                  className="w-full bg-neutral-50 dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-700 rounded-lg p-2"
                />
              </div>

              <div>
                <label className="block text-neutral-700 dark:text-neutral-300 font-medium mb-1">
                  Wilaya
                </label>
                <input
                  type="text"
                  value={agencyData.wilaya}
                  onChange={(e) => setAgencyData({ ...agencyData, wilaya: e.target.value })}
                  className="w-full bg-neutral-50 dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-700 rounded-lg p-2"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-neutral-700 dark:text-neutral-300 font-medium mb-1">
                  NIF (الرقم التعريفي الجبائي)
                </label>
                <input
                  type="text"
                  value={agencyData.nif}
                  onChange={(e) => setAgencyData({ ...agencyData, nif: e.target.value })}
                  className="w-full bg-neutral-50 dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-700 rounded-lg p-2 font-mono"
                />
              </div>

              <div>
                <label className="block text-neutral-700 dark:text-neutral-300 font-medium mb-1">
                  RC (السجل التجاري)
                </label>
                <input
                  type="text"
                  value={agencyData.rc}
                  onChange={(e) => setAgencyData({ ...agencyData, rc: e.target.value })}
                  className="w-full bg-neutral-50 dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-700 rounded-lg p-2 font-mono"
                />
              </div>

              <div>
                <label className="block text-neutral-700 dark:text-neutral-300 font-medium mb-1">
                  Téléphone Principal
                </label>
                <input
                  type="text"
                  value={agencyData.phone1}
                  onChange={(e) => setAgencyData({ ...agencyData, phone1: e.target.value })}
                  className="w-full bg-neutral-50 dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-700 rounded-lg p-2 font-mono"
                />
              </div>
            </div>
          </div>

          {/* Operational & Penalty Rules */}
          <div className="p-5 rounded-2xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 shadow-xs space-y-4">
            <h3 className="font-bold text-sm text-neutral-900 dark:text-white flex items-center gap-2 font-bukra italic">
              <Settings className="w-4 h-4 text-amber-500" />
              <span>{language === 'ar' ? 'قواعد التسعير والوديعة والغرامات الافتراضية' : 'Barèmes de Caution, Kilométrage et Carburant'}</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
              <div>
                <label className="block text-neutral-700 dark:text-neutral-300 font-medium mb-1">
                  {language === 'ar' ? 'الوديعة الافتراضية (DZD)' : 'Caution par Défaut (DZD)'}
                </label>
                <input
                  type="number"
                  step="5000"
                  value={agencyData.defaultCautionDzd}
                  onChange={(e) => setAgencyData({ ...agencyData, defaultCautionDzd: parseFloat(e.target.value) || 0 })}
                  className="w-full bg-neutral-50 dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-700 rounded-lg p-2 font-mono font-bold text-blue-500"
                />
              </div>

              <div>
                <label className="block text-neutral-700 dark:text-neutral-300 font-medium mb-1">
                  {language === 'ar' ? 'كيلومتر مجاني/يوم' : 'KM Inclus / Jour'}
                </label>
                <input
                  type="number"
                  value={agencyData.freeKmPerDay}
                  onChange={(e) => setAgencyData({ ...agencyData, freeKmPerDay: parseInt(e.target.value) || 0 })}
                  className="w-full bg-neutral-50 dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-700 rounded-lg p-2 font-mono"
                />
              </div>

              <div>
                <label className="block text-neutral-700 dark:text-neutral-300 font-medium mb-1">
                  {language === 'ar' ? 'غرامة الكيلومتر الزائد (DZD)' : 'Tarif KM Supplémentaire (DZD)'}
                </label>
                <input
                  type="number"
                  value={agencyData.penaltyPerExcessKmDzd}
                  onChange={(e) => setAgencyData({ ...agencyData, penaltyPerExcessKmDzd: parseFloat(e.target.value) || 0 })}
                  className="w-full bg-neutral-50 dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-700 rounded-lg p-2 font-mono"
                />
              </div>

              <div>
                <label className="block text-neutral-700 dark:text-neutral-300 font-medium mb-1">
                  {language === 'ar' ? 'سعر لتر الوقود Naftal (DZD)' : 'Prix Carburant / Litre (DZD)'}
                </label>
                <input
                  type="number"
                  value={agencyData.fuelPricePerLiterDzd}
                  onChange={(e) => setAgencyData({ ...agencyData, fuelPricePerLiterDzd: parseFloat(e.target.value) || 0 })}
                  className="w-full bg-neutral-50 dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-700 rounded-lg p-2 font-mono"
                />
              </div>
            </div>
          </div>

          <div className="flex justify-end">
            <button
              type="submit"
              className="px-6 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-neutral-950 font-bold transition-colors cursor-pointer shadow-sm font-bukra italic"
            >
              {t.save}
            </button>
          </div>
        </form>
      )}

      {/* Subtab 2: Backup & Restore & Data Management */}
      {activeSubTab === 'BACKUP' && (
        <div className="space-y-4 text-xs">
          <div className="p-5 rounded-2xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 shadow-xs space-y-4">
            <h3 className="font-bold text-sm text-neutral-900 dark:text-white flex items-center gap-2 font-bukra italic">
              <Database className="w-4 h-4 text-amber-500" />
              <span>{t.databaseTitle}</span>
            </h3>
            <p className="text-neutral-500 leading-relaxed">
              {t.sqliteNotice}
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
              <button
                onClick={handleExportSql}
                className="flex items-center justify-center gap-2 p-3.5 rounded-xl bg-neutral-900 dark:bg-neutral-800 hover:bg-neutral-800 text-white font-semibold cursor-pointer border border-neutral-700 transition-colors"
              >
                <Download className="w-4 h-4 text-amber-500" />
                <span>{t.exportSqlDump}</span>
              </button>

              <button
                onClick={handleExportJson}
                className="flex items-center justify-center gap-2 p-3.5 rounded-xl bg-neutral-900 dark:bg-neutral-800 hover:bg-neutral-800 text-white font-semibold cursor-pointer border border-neutral-700 transition-colors"
              >
                <Download className="w-4 h-4 text-blue-400" />
                <span>{t.exportJsonBackup}</span>
              </button>

              <label className="flex items-center justify-center gap-2 p-3.5 rounded-xl bg-neutral-900 dark:bg-neutral-800 hover:bg-neutral-800 text-white font-semibold cursor-pointer border border-neutral-700 transition-colors">
                <Upload className="w-4 h-4 text-emerald-400" />
                <span>{t.importBackup}</span>
                <input
                  type="file"
                  accept=".json"
                  onChange={handleImportJson}
                  className="hidden"
                />
              </label>
            </div>
          </div>
        </div>
      )}

      {/* Subtab 3: ERD & API Specifications */}
      {activeSubTab === 'ERD' && (
        <div className="space-y-4 text-xs">
          <div className="p-5 rounded-2xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-sm text-neutral-900 dark:text-white flex items-center gap-2 font-bukra italic">
                <FileCode className="w-4 h-4 text-amber-500" />
                <span>{ERD_SPECIFICATION.title}</span>
              </h3>
              <span className="font-mono text-neutral-500">{ERD_SPECIFICATION.database}</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {ERD_SPECIFICATION.entities.map(e => (
                <div key={e.name} className="p-3 rounded-xl bg-neutral-50 dark:bg-neutral-800/50 border border-neutral-200 dark:border-neutral-700 space-y-2">
                  <div className="font-bold text-amber-600 dark:text-amber-400 font-mono text-[13px]">
                    TABLE: {e.name}
                  </div>
                  <div className="text-neutral-600 dark:text-neutral-400 text-[11px] leading-tight">
                    {e.description}
                  </div>
                  <div className="font-mono text-[10px] text-neutral-500">
                    <strong>PK:</strong> {e.primaryKey}
                  </div>
                  {e.foreignKeys.length > 0 && (
                    <div className="font-mono text-[10px] text-blue-500">
                      <strong>FK:</strong> {e.foreignKeys.join(', ')}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

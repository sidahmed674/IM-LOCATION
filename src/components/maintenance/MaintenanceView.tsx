import React, { useState } from 'react';
import { 
  Wrench, Plus, CheckCircle2, Clock, Car, 
  AlertCircle, DollarSign, X, Check
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { dbStore } from '../../db/store';
import { MaintenanceRecord } from '../../types';

export const MaintenanceView: React.FC = () => {
  const { t, language, addToast } = useApp();
  const records = dbStore.getMaintenanceRecords();
  const vehicles = dbStore.getVehicles();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedVehicleId, setSelectedVehicleId] = useState('');
  const [maintenanceType, setMaintenanceType] = useState<MaintenanceRecord['type']>('OIL_CHANGE');
  const [description, setDescription] = useState('');
  const [costDzd, setCostDzd] = useState<number>(8500);
  const [performedAtKm, setPerformedAtKm] = useState<number>(30000);
  const [garageName, setGarageName] = useState('Station Naftal / Atelier Central');
  const [maintStatus, setMaintStatus] = useState<MaintenanceRecord['status']>('IN_PROGRESS');

  const handleOpenAdd = () => {
    if (vehicles.length > 0) {
      setSelectedVehicleId(vehicles[0].id);
      setPerformedAtKm(vehicles[0].currentKm);
    }
    setDescription('');
    setCostDzd(8500);
    setMaintStatus('IN_PROGRESS');
    setIsModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const vehicle = dbStore.getVehicleById(selectedVehicleId);
    if (!vehicle) {
      addToast(language === 'ar' ? 'يرجى اختيار مركبة' : 'Veuillez sélectionner un véhicule', 'error');
      return;
    }

    try {
      dbStore.addMaintenanceRecord({
        vehicleId: selectedVehicleId,
        vehicleMatricule: vehicle.matricule,
        type: maintenanceType,
        description,
        costDzd: Number(costDzd) || 0,
        performedAtKm: Number(performedAtKm) || vehicle.currentKm,
        garageName,
        date: new Date().toISOString().split('T')[0],
        status: maintStatus,
      });

      addToast(
        language === 'ar' 
          ? `تم تسجيل الصيانة للمركبة ${vehicle.matricule} وتحديث حالتها` 
          : `Maintenance enregistrée pour ${vehicle.matricule}`,
        'success'
      );
      setIsModalOpen(false);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Erreur';
      addToast(msg, 'error');
    }
  };

  const handleComplete = (id: string, matricule: string) => {
    try {
      dbStore.completeMaintenance(id);
      addToast(
        language === 'ar' 
          ? `تم إنهاء الصيانة وإعادة المركبة (${matricule}) إلى الحالة المتاحة`
          : `Maintenance terminée pour ${matricule}. Véhicule disponible.`,
        'success'
      );
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Erreur';
      addToast(msg, 'error');
    }
  };

  const formatDzd = (n: number) => {
    return new Intl.NumberFormat(language === 'ar' ? 'ar-DZ' : 'fr-FR', {
      maximumFractionDigits: 0
    }).format(n) + ' ' + t.currency;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-neutral-200 dark:border-neutral-800">
        <div>
          <h2 className="text-xl font-bold font-bukra italic tracking-tight text-neutral-900 dark:text-white">
            {t.navEntretienVidange}
          </h2>
          <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">
            {language === 'ar'
              ? 'تتبع تغيير الزيت (Vidange)، الإطارات، الفرامل، ومنع تأجير المركبات قيد الصيانة'
              : 'Gestion des vidanges, pneumatiques, plaquettes et verrouillage des véhicules en atelier'}
          </p>
        </div>

        <button
          onClick={handleOpenAdd}
          className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-neutral-950 font-bold text-xs transition-colors shadow-sm cursor-pointer self-start sm:self-auto font-bukra italic"
        >
          <Plus className="w-4 h-4" />
          <span>{t.scheduleMaintenance}</span>
        </button>
      </div>

      {/* Maintenance Cards & Table */}
      <div className="rounded-xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          {records.length === 0 ? (
            <div className="p-12 text-center text-neutral-400 text-xs">
              {t.noData}
            </div>
          ) : (
            <table className="w-full min-w-[700px] text-xs text-start">
              <thead className="bg-neutral-50 dark:bg-neutral-800/50 text-neutral-500 dark:text-neutral-400 font-medium border-b border-neutral-200 dark:border-neutral-800">
                <tr>
                  <th className="px-4 py-3 text-start">{t.date}</th>
                  <th className="px-4 py-3 text-start">{language === 'ar' ? 'المركبة واللوحة' : 'Véhicule & Matricule'}</th>
                  <th className="px-4 py-3 text-start">{t.maintenanceType}</th>
                  <th className="px-4 py-3 text-start">{language === 'ar' ? 'الوصف والتفاصيل' : 'Détails des Travaux'}</th>
                  <th className="px-4 py-3 text-start">{t.garageName}</th>
                  <th className="px-4 py-3 text-end">{t.costDzd}</th>
                  <th className="px-4 py-3 text-center">{t.status}</th>
                  <th className="px-4 py-3 text-center">{t.actions}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-200 dark:divide-neutral-800 text-neutral-800 dark:text-neutral-200">
                {records.map(rec => (
                  <tr key={rec.id} className="hover:bg-neutral-50/50 dark:hover:bg-neutral-800/30 transition-colors">
                    <td className="px-4 py-3 font-mono tabular-nums text-neutral-500">
                      {rec.date}
                    </td>
                    <td className="px-4 py-3 font-mono font-bold text-amber-600 dark:text-amber-400">
                      {rec.vehicleMatricule}
                    </td>
                    <td className="px-4 py-3 font-medium">
                      {rec.type === 'OIL_CHANGE' && t.oilChange}
                      {rec.type === 'BRAKES' && t.brakes}
                      {rec.type === 'TYRES' && t.tyres}
                      {rec.type === 'BODY_REPAIR' && t.bodyRepair}
                      {rec.type === 'ROUTINE_INSPECTION' && t.routineInspection}
                      {rec.type === 'OTHER' && (language === 'ar' ? 'أخرى' : 'Autre')}
                    </td>
                    <td className="px-4 py-3 max-w-xs truncate">
                      {rec.description}
                    </td>
                    <td className="px-4 py-3 text-neutral-500">
                      {rec.garageName} ({rec.performedAtKm} KM)
                    </td>
                    <td className="px-4 py-3 text-end font-mono font-semibold tabular-nums text-red-500">
                      {formatDzd(rec.costDzd)}
                    </td>
                    <td className="px-4 py-3 text-center">
                      {rec.status === 'COMPLETED' ? (
                        <span className="text-emerald-500 font-semibold flex items-center justify-center gap-1">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>{language === 'ar' ? 'مكتمل' : 'Clôturé'}</span>
                        </span>
                      ) : (
                        <span className="text-amber-500 font-semibold flex items-center justify-center gap-1">
                          <Clock className="w-3.5 h-3.5" />
                          <span>{language === 'ar' ? 'قيد الإنجاز' : 'En cours'}</span>
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-center">
                      {rec.status !== 'COMPLETED' && (
                        <button
                          onClick={() => handleComplete(rec.id, rec.vehicleMatricule)}
                          className="px-2.5 py-1 rounded bg-emerald-600 hover:bg-emerald-500 text-white font-medium text-[11px] transition-colors cursor-pointer flex items-center gap-1 mx-auto"
                        >
                          <Check className="w-3 h-3" />
                          <span>{language === 'ar' ? 'إنهاء الصيانة' : 'Terminer'}</span>
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Add Maintenance Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="w-full max-w-lg bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-2xl p-6 shadow-2xl space-y-4 my-8 text-xs">
            <div className="flex items-center justify-between pb-3 border-b border-neutral-200 dark:border-neutral-800">
              <div className="flex items-center gap-2">
                <Wrench className="w-5 h-5 text-amber-500" />
                <h3 className="font-bold text-base text-neutral-900 dark:text-white">
                  {t.scheduleMaintenance}
                </h3>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-neutral-400 hover:text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-3.5">
              <div>
                <label className="block text-neutral-700 dark:text-neutral-300 font-medium mb-1">
                  {language === 'ar' ? 'المركبة' : 'Véhicule'} *
                </label>
                <select
                  required
                  value={selectedVehicleId}
                  onChange={(e) => {
                    setSelectedVehicleId(e.target.value);
                    const v = dbStore.getVehicleById(e.target.value);
                    if (v) setPerformedAtKm(v.currentKm);
                  }}
                  className="w-full bg-neutral-50 dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-700 rounded-lg p-2 font-mono text-neutral-900 dark:text-white"
                >
                  {vehicles.map(v => (
                    <option key={v.id} value={v.id}>
                      {v.matricule} - {v.brand} {v.model} ({v.currentKm} KM)
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-neutral-700 dark:text-neutral-300 font-medium mb-1">
                    {t.maintenanceType} *
                  </label>
                  <select
                    value={maintenanceType}
                    onChange={(e) => setMaintenanceType(e.target.value as MaintenanceRecord['type'])}
                    className="w-full bg-neutral-50 dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-700 rounded-lg p-2 text-neutral-900 dark:text-white"
                  >
                    <option value="OIL_CHANGE">{t.oilChange}</option>
                    <option value="BRAKES">{t.brakes}</option>
                    <option value="TYRES">{t.tyres}</option>
                    <option value="BODY_REPAIR">{t.bodyRepair}</option>
                    <option value="ROUTINE_INSPECTION">{t.routineInspection}</option>
                    <option value="OTHER">{language === 'ar' ? 'أخرى' : 'Autre'}</option>
                  </select>
                </div>

                <div>
                  <label className="block text-neutral-700 dark:text-neutral-300 font-medium mb-1">
                    {t.costDzd} (DZD) *
                  </label>
                  <input
                    type="number"
                    required
                    step="500"
                    value={costDzd}
                    onChange={(e) => setCostDzd(parseFloat(e.target.value) || 0)}
                    className="w-full bg-neutral-50 dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-700 rounded-lg p-2 font-mono font-bold text-red-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-neutral-700 dark:text-neutral-300 font-medium mb-1">
                  {language === 'ar' ? 'وصف العمل المنجز أو القطع المستبدلة' : 'Description des travaux'} *
                </label>
                <textarea
                  required
                  rows={2}
                  placeholder="Vidange huile 5W40 + Filtre, disques de freins..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full bg-neutral-50 dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-700 rounded-lg p-2 text-neutral-900 dark:text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-neutral-700 dark:text-neutral-300 font-medium mb-1">
                    {t.garageName}
                  </label>
                  <input
                    type="text"
                    value={garageName}
                    onChange={(e) => setGarageName(e.target.value)}
                    className="w-full bg-neutral-50 dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-700 rounded-lg p-2 text-neutral-900 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-neutral-700 dark:text-neutral-300 font-medium mb-1">
                    {t.performedAtKm} (KM)
                  </label>
                  <input
                    type="number"
                    value={performedAtKm}
                    onChange={(e) => setPerformedAtKm(parseInt(e.target.value) || 0)}
                    className="w-full bg-neutral-50 dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-700 rounded-lg p-2 font-mono text-neutral-900 dark:text-white"
                  />
                </div>
              </div>

              <div className="p-2.5 rounded-lg bg-amber-500/10 border border-amber-500/30 text-[11px] text-amber-500">
                {language === 'ar'
                  ? 'ملاحظة: سيتم تلقائياً حجب المركبة وتغيير حالتها إلى "قيد الصيانة" حتى لا تظهر متاحة للتأجير.'
                  : 'Note : Le statut du véhicule passera automatiquement en "En Maintenance" pour empêcher sa location.'}
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-neutral-200 dark:border-neutral-800">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-lg bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 font-semibold cursor-pointer"
                >
                  {t.cancel}
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-lg bg-amber-500 hover:bg-amber-400 text-neutral-950 font-bold cursor-pointer transition-colors shadow-sm"
                >
                  {t.confirm}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

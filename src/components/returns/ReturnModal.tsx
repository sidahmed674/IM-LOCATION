import React, { useState, useEffect } from 'react';
import { 
  X, RotateCcw, Gauge, Fuel, Clock, AlertTriangle, 
  ShieldAlert, DollarSign, Check, Plus, Trash2, CheckCircle2, Printer
} from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import { useApp } from '../../context/AppContext';
import { dbStore } from '../../db/store';
import { RentalContract, FuelLevel, DamageReportItem } from '../../types';

export const ReturnModal: React.FC = () => {
  const { 
    isReturnModalOpen, closeReturnModal, 
    preselectedContractId, t, language, addToast, setContractToPrint 
  } = useApp();

  const rentals = dbStore.getRentals().filter(r => r.status === 'ACTIVE' || r.status === 'OVERDUE');
  const settings = dbStore.getSettings();

  const [selectedContractId, setSelectedContractId] = useState<string>('');
  const [returnKm, setReturnKm] = useState<number>(0);
  const [returnFuel, setReturnFuel] = useState<FuelLevel>('8/8');
  
  const now = new Date();
  const todayStr = now.toISOString().split('T')[0];
  const timeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
  
  const [actualReturnDate, setActualReturnDate] = useState(todayStr);
  const [actualReturnTime, setActualReturnTime] = useState(timeStr);
  const [cleaningFeeDzd, setCleaningFeeDzd] = useState<number>(0);
  const [damages, setDamages] = useState<DamageReportItem[]>([]);
  const [returnedByStaff, setReturnedByStaff] = useState('Agent IM LOCATION');
  const [settlementNotes, setSettlementNotes] = useState('');

  // Damage entry inputs
  const [newDamageLocation, setNewDamageLocation] = useState<DamageReportItem['location']>('FRONT_BUMPER');
  const [newDamageType, setNewDamageType] = useState<DamageReportItem['damageType']>('SCRATCH');
  const [newDamageDesc, setNewDamageDesc] = useState('');
  const [newDamageCost, setNewDamageCost] = useState<number>(5000);

  // Set default selected contract
  useEffect(() => {
    if (preselectedContractId) {
      setSelectedContractId(preselectedContractId);
    } else if (rentals.length > 0 && !selectedContractId) {
      setSelectedContractId(rentals[0].id);
    }
  }, [preselectedContractId, rentals]);

  // Current contract under return
  const currentContract = rentals.find(r => r.id === selectedContractId);

  // Initialize return KM & Fuel from contract
  useEffect(() => {
    if (currentContract) {
      setReturnKm(currentContract.startKm + currentContract.durationDays * 120);
      setReturnFuel(currentContract.startFuel);
    }
  }, [selectedContractId]);

  // --------------------------------------------------------------------------
  // CALCULATIONS (Excess KM, Fuel Difference, Late Delay, Damages)
  // --------------------------------------------------------------------------
  const startKm = currentContract ? currentContract.startKm : 0;
  const kmDriven = Math.max(0, returnKm - startKm);
  const allowedKm = currentContract ? currentContract.durationDays * settings.freeKmPerDay : 0;
  const excessKm = Math.max(0, kmDriven - allowedKm);
  const excessKmPenaltyDzd = excessKm * settings.penaltyPerExcessKmDzd;

  // Fuel difference penalty
  const fuelToNum = (f: FuelLevel) => parseInt(f.split('/')[0], 10);
  const startFuelNum = currentContract ? fuelToNum(currentContract.startFuel) : 8;
  const returnFuelNum = fuelToNum(returnFuel);
  let fuelPenaltyDzd = 0;
  if (returnFuelNum < startFuelNum) {
    const missingEighths = startFuelNum - returnFuelNum;
    const liters = missingEighths * 6.25;
    fuelPenaltyDzd = Math.round(liters * settings.fuelPricePerLiterDzd + 600);
  }

  // Late return hours and penalties
  let lateHours = 0;
  let latePenaltyDzd = 0;
  let isLate = false;
  if (currentContract) {
    const expDate = new Date(`${currentContract.expectedEndDate}T${currentContract.expectedEndTime}`);
    const actDate = new Date(`${actualReturnDate}T${actualReturnTime}`);
    const diff = actDate.getTime() - expDate.getTime();
    if (diff > 0) {
      lateHours = Math.ceil(diff / (1000 * 60 * 60));
      if (lateHours > 2) { // 2 hours grace period
        isLate = true;
        if (lateHours <= 6) {
          latePenaltyDzd = Math.round(currentContract.dailyRateDzd * 0.5);
        } else {
          const daysLate = Math.ceil(lateHours / 24);
          latePenaltyDzd = daysLate * currentContract.dailyRateDzd;
        }
      }
    }
  }

  // Damage sum
  const damageTotalDzd = damages.reduce((sum, d) => sum + d.estimatedCostDzd, 0);

  // Total Penalties
  const totalPenaltiesDzd = excessKmPenaltyDzd + fuelPenaltyDzd + latePenaltyDzd + cleaningFeeDzd + damageTotalDzd;

  // Final Settlement (Sans Caution)
  const remainingRentBalanceDzd = currentContract ? currentContract.remainingBalanceDzd : 0;
  const totalSettlementDueDzd = remainingRentBalanceDzd + totalPenaltiesDzd;

  const handleAddDamage = () => {
    if (!newDamageDesc) {
      addToast(language === 'ar' ? 'يرجى كتابة وصف الضرر' : 'Veuillez saisir la description du dommage', 'error');
      return;
    }
    const newD: DamageReportItem = {
      id: `dmg-${Date.now()}`,
      location: newDamageLocation,
      damageType: newDamageType,
      description: newDamageDesc,
      estimatedCostDzd: Number(newDamageCost) || 0,
    };
    setDamages(prev => [...prev, newD]);
    setNewDamageDesc('');
    setNewDamageCost(5000);
  };

  const handleRemoveDamage = (id: string) => {
    setDamages(prev => prev.filter(d => d.id !== id));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentContract) return;

    if (returnKm < currentContract.startKm) {
      addToast(
        language === 'ar' 
          ? 'عداد الكيلومتر عند الإرجاع لا يمكن أن يكون أقل من عداد البدء' 
          : 'Le kilométrage de retour ne peut pas être inférieur au départ',
        'error'
      );
      return;
    }

    try {
      const updatedContract = dbStore.processReturnSettlement(currentContract.id, {
        returnKm,
        returnFuel,
        actualReturnDate,
        actualReturnTime,
        newDamages: damages,
        cleaningFeeDzd,
        returnedByStaffName: returnedByStaff,
        settlementNotes,
      });

      addToast(
        language === 'ar'
          ? `تم إغلاق العقد ${currentContract.contractNumber} واستلام المركبة بنجاح`
          : `Contrat ${currentContract.contractNumber} clôturé avec succès. Véhicule réceptionné.`,
        'success'
      );

      closeReturnModal();
      setContractToPrint(updatedContract);
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
    <AnimatePresence>
      {isReturnModalOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.18 }}
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto"
        >
          <motion.div
            initial={{ scale: 0.94, opacity: 0, y: 16 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.94, opacity: 0, y: 14 }}
            transition={{ type: 'spring', stiffness: 420, damping: 28 }}
            className="w-full max-w-4xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-2xl p-6 shadow-2xl space-y-4 my-8 text-xs"
          >
            {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-neutral-200 dark:border-neutral-800">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-emerald-600 text-white">
              <RotateCcw className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base text-neutral-900 dark:text-white">
                {t.returnSettlementTitle}
              </h3>
              <p className="text-xs text-neutral-500">
                {language === 'ar' 
                  ? 'محرك التسوية: حساب فوارق الكيلومتر والوقود والتأخير، واقتطاع الأضرار من الوديعة' 
                  : 'Moteur de restitution : Écart KM, carburant, retard et arbitrage de caution'}
              </p>
            </div>
          </div>
          <button
            onClick={closeReturnModal}
            className="text-neutral-400 hover:text-white cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {rentals.length === 0 ? (
          <div className="p-8 text-center text-neutral-400">
            {language === 'ar' ? 'لا توجد عقود نشطة حالياً للإرجاع.' : 'Aucun contrat en cours à clôturer.'}
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Step 1: Contract Select */}
            <div className="p-3.5 rounded-xl bg-neutral-50 dark:bg-neutral-800/40 border border-neutral-200 dark:border-neutral-700">
              <label className="block text-neutral-700 dark:text-neutral-300 font-bold mb-1">
                {t.selectContractToReturn} *
              </label>
              <select
                required
                value={selectedContractId}
                onChange={(e) => setSelectedContractId(e.target.value)}
                className="w-full bg-white dark:bg-neutral-900 border border-neutral-300 dark:border-neutral-700 rounded-lg p-2.5 text-neutral-900 dark:text-white font-mono"
              >
                {rentals.map(r => (
                  <option key={r.id} value={r.id}>
                    {r.contractNumber} — {r.customerSnapshot.fullName} ({r.vehicleSnapshot.brand} {r.vehicleSnapshot.model} - {r.vehicleSnapshot.matricule})
                  </option>
                ))}
              </select>

              {currentContract && (
                <div className="mt-2 pt-2 border-t border-neutral-200 dark:border-neutral-700 grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs text-neutral-600 dark:text-neutral-400">
                  <div>{t.initialKm}: <span className="font-mono font-bold text-neutral-900 dark:text-white">{currentContract.startKm} KM</span></div>
                  <div>{t.initialFuel}: <span className="font-mono font-bold text-amber-500">{currentContract.startFuel}</span></div>
                  <div>{language === 'ar' ? 'إجمالي العقد:' : 'Total Contrat:'} <span className="font-mono font-bold text-neutral-900 dark:text-white">{formatDzd(currentContract.totalRentDzd)}</span></div>
                  <div>{t.remainingBalance}: <span className="font-mono font-bold text-red-500">{formatDzd(currentContract.remainingBalanceDzd)}</span></div>
                </div>
              )}
            </div>

            {/* Step 2: Inspection Data (Return KM & Fuel & Date) */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {/* Odometer */}
              <div className="p-3 rounded-xl bg-neutral-50 dark:bg-neutral-800/40 border border-neutral-200 dark:border-neutral-700 space-y-2">
                <label className="block font-semibold text-neutral-800 dark:text-neutral-200 flex items-center gap-1.5">
                  <Gauge className="w-4 h-4 text-neutral-400" />
                  <span>{t.returnKm} (KM) *</span>
                </label>
                <input
                  type="number"
                  required
                  value={returnKm}
                  onChange={(e) => setReturnKm(parseInt(e.target.value) || 0)}
                  className="w-full bg-white dark:bg-neutral-900 border border-neutral-300 dark:border-neutral-700 rounded-lg p-2 font-mono font-bold text-neutral-900 dark:text-white"
                />
                <div className="text-[11px] space-y-0.5 text-neutral-500">
                  <div>{t.kmDifference}: <span className="font-mono font-semibold">{kmDriven} KM</span></div>
                  {excessKm > 0 && (
                    <div className="text-red-500 font-semibold font-mono">
                      +{excessKm} KM {language === 'ar' ? 'زائد' : 'excédent'} = +{formatDzd(excessKmPenaltyDzd)}
                    </div>
                  )}
                </div>
              </div>

              {/* Fuel Level */}
              <div className="p-3 rounded-xl bg-neutral-50 dark:bg-neutral-800/40 border border-neutral-200 dark:border-neutral-700 space-y-2">
                <label className="block font-semibold text-neutral-800 dark:text-neutral-200 flex items-center gap-1.5">
                  <Fuel className="w-4 h-4 text-amber-500" />
                  <span>{t.returnFuel} *</span>
                </label>
                <select
                  value={returnFuel}
                  onChange={(e) => setReturnFuel(e.target.value as FuelLevel)}
                  className="w-full bg-white dark:bg-neutral-900 border border-neutral-300 dark:border-neutral-700 rounded-lg p-2 font-mono font-bold text-neutral-900 dark:text-white"
                >
                  <option value="8/8">8/8 (Plein)</option>
                  <option value="7/8">7/8</option>
                  <option value="6/8">6/8</option>
                  <option value="5/8">5/8</option>
                  <option value="4/8">4/8 (Moitié)</option>
                  <option value="3/8">3/8</option>
                  <option value="2/8">2/8</option>
                  <option value="1/8">1/8</option>
                  <option value="0/8">0/8 (Vide)</option>
                </select>
                <div className="text-[11px] text-neutral-500">
                  {fuelPenaltyDzd > 0 ? (
                    <span className="text-red-500 font-semibold font-mono">
                      {t.fuelPenalty}: +{formatDzd(fuelPenaltyDzd)}
                    </span>
                  ) : (
                    <span className="text-emerald-500 font-semibold flex items-center gap-1">
                      <Check className="w-3.5 h-3.5 stroke-[3]" />
                      <span>{language === 'ar' ? 'مستوى الوقود سليم' : 'Niveau de carburant conforme'}</span>
                    </span>
                  )}
                </div>
              </div>

              {/* Date & Time */}
              <div className="p-3 rounded-xl bg-neutral-50 dark:bg-neutral-800/40 border border-neutral-200 dark:border-neutral-700 space-y-2">
                <label className="block font-semibold text-neutral-800 dark:text-neutral-200 flex items-center gap-1.5">
                  <Clock className="w-4 h-4 text-blue-500" />
                  <span>{t.actualReturnDateTime}</span>
                </label>
                <div className="grid grid-cols-2 gap-1.5">
                  <input
                    type="date"
                    required
                    value={actualReturnDate}
                    onChange={(e) => setActualReturnDate(e.target.value)}
                    className="w-full bg-white dark:bg-neutral-900 border border-neutral-300 dark:border-neutral-700 rounded-lg p-1.5 font-mono"
                  />
                  <input
                    type="time"
                    required
                    value={actualReturnTime}
                    onChange={(e) => setActualReturnTime(e.target.value)}
                    className="w-full bg-white dark:bg-neutral-900 border border-neutral-300 dark:border-neutral-700 rounded-lg p-1.5 font-mono"
                  />
                </div>
                <div className="text-[11px] text-neutral-500">
                  {isLate ? (
                    <span className="text-red-500 font-semibold font-mono">
                      {lateHours}h {language === 'ar' ? 'تأخر' : 'retard'} = +{formatDzd(latePenaltyDzd)}
                    </span>
                  ) : (
                    <span className="text-emerald-500 font-semibold flex items-center gap-1">
                      <Check className="w-3.5 h-3.5 stroke-[3]" />
                      <span>{language === 'ar' ? 'في الموعد المحدد' : 'Dans les délais'}</span>
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Step 3: Damage Inspection & Hotspot Checklist */}
            <div className="p-4 rounded-xl bg-neutral-50 dark:bg-neutral-800/40 border border-neutral-200 dark:border-neutral-700 space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="font-bold text-neutral-900 dark:text-white flex items-center gap-2">
                  <ShieldAlert className="w-4 h-4 text-amber-500" />
                  <span>{t.damageInspection}</span>
                </h4>
                <div className="flex items-center gap-2">
                  <label className="flex items-center gap-1.5 cursor-pointer text-neutral-700 dark:text-neutral-300">
                    <input
                      type="checkbox"
                      checked={cleaningFeeDzd > 0}
                      onChange={(e) => setCleaningFeeDzd(e.target.checked ? 2000 : 0)}
                      className="rounded text-amber-500"
                    />
                    <span>{t.cleaningFee} (2 000 DZD)</span>
                  </label>
                </div>
              </div>

              {/* Add damage spot form */}
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-2 p-2.5 rounded-lg bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800">
                <div>
                  <label className="block text-[10px] text-neutral-500 mb-0.5">{t.damageLocation}</label>
                  <select
                    value={newDamageLocation}
                    onChange={(e) => setNewDamageLocation(e.target.value as DamageReportItem['location'])}
                    className="w-full bg-neutral-50 dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-700 rounded p-1 text-[11px]"
                  >
                    <option value="FRONT_BUMPER">{language === 'ar' ? 'الصدام الأمامي' : 'Pare-chocs avant'}</option>
                    <option value="REAR_BUMPER">{language === 'ar' ? 'الصدام الخلفي' : 'Pare-chocs arrière'}</option>
                    <option value="HOOD">{language === 'ar' ? 'غطاء المحرك' : 'Capot'}</option>
                    <option value="LEFT_FRONT_DOOR">{language === 'ar' ? 'الباب الأمامي أيسر' : 'Porte avant gauche'}</option>
                    <option value="RIGHT_FRONT_DOOR">{language === 'ar' ? 'الباب الأمامي أيمن' : 'Porte avant droite'}</option>
                    <option value="LEFT_REAR_DOOR">{language === 'ar' ? 'الباب الخلفي أيسر' : 'Porte arrière gauche'}</option>
                    <option value="RIGHT_REAR_DOOR">{language === 'ar' ? 'الباب الخلفي أيمن' : 'Porte arrière droite'}</option>
                    <option value="WINDSHIELD">{language === 'ar' ? 'الزجاج والواجهة' : 'Pare-brise'}</option>
                    <option value="TYRES">{language === 'ar' ? 'الإطارات والعجلات' : 'Pneumatiques'}</option>
                    <option value="INTERIOR">{language === 'ar' ? 'المقصورة والفرش' : 'Habitacle / Sellerie'}</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] text-neutral-500 mb-0.5">{t.damageType}</label>
                  <select
                    value={newDamageType}
                    onChange={(e) => setNewDamageType(e.target.value as DamageReportItem['damageType'])}
                    className="w-full bg-neutral-50 dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-700 rounded p-1 text-[11px]"
                  >
                    <option value="SCRATCH">{language === 'ar' ? 'خدش (Rayure)' : 'Rayure'}</option>
                    <option value="DENT">{language === 'ar' ? 'صدمة/انبعاج (Choc)' : 'Enfoncement / Choc'}</option>
                    <option value="CRACK">{language === 'ar' ? 'شرخ زجاج (Fissure)' : 'Fissure vitrage'}</option>
                    <option value="BROKEN">{language === 'ar' ? 'كسر/استبدال (Casse)' : 'Casse / Pièce à changer'}</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] text-neutral-500 mb-0.5">{t.damageEstimatedCost} (DZD)</label>
                  <input
                    type="number"
                    step="500"
                    value={newDamageCost}
                    onChange={(e) => setNewDamageCost(parseFloat(e.target.value) || 0)}
                    className="w-full bg-neutral-50 dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-700 rounded p-1 font-mono text-[11px] font-bold text-red-500"
                  />
                </div>

                <div className="flex items-end gap-1">
                  <input
                    type="text"
                    placeholder={language === 'ar' ? 'وصف الضرر...' : 'Détail du dommage...'}
                    value={newDamageDesc}
                    onChange={(e) => setNewDamageDesc(e.target.value)}
                    className="w-full bg-neutral-50 dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-700 rounded p-1 text-[11px]"
                  />
                  <button
                    type="button"
                    onClick={handleAddDamage}
                    className="px-2.5 py-1 bg-amber-500 hover:bg-amber-400 text-neutral-950 font-bold rounded text-[11px] cursor-pointer shrink-0"
                  >
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Recorded damages list */}
              {damages.length > 0 && (
                <div className="space-y-1.5">
                  {damages.map(d => (
                    <div key={d.id} className="flex items-center justify-between p-2 rounded bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800/40 text-[11px]">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-red-700 dark:text-red-400 font-mono">[{d.location}]</span>
                        <span className="text-neutral-800 dark:text-neutral-200">{d.description}</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="font-mono font-bold text-red-600 dark:text-red-400">{formatDzd(d.estimatedCostDzd)}</span>
                        <button
                          type="button"
                          onClick={() => handleRemoveDamage(d.id)}
                          className="text-neutral-400 hover:text-red-500 cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Step 4: Transparent Financial Balance Sheet (Sans Caution) */}
            <div className="p-4 rounded-xl bg-neutral-900 text-white border border-neutral-800 space-y-3">
              <h4 className="font-bold text-sm text-amber-400 flex items-center justify-between">
                <span>{language === 'ar' ? 'جدول التسوية المالية واستلام المستحقات' : 'Décompte Financier de Restitution'}</span>
                <span className="font-mono text-xs">{currentContract?.contractNumber}</span>
              </h4>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-3.5 rounded-xl bg-neutral-950/70 border border-neutral-800 font-mono text-xs">
                <div>
                  <span className="text-neutral-400 block text-xs mb-1">{t.remainingBalance} (المتبقي من الإيجار)</span>
                  <span className="font-bold text-amber-400 text-base">{formatDzd(remainingRentBalanceDzd)}</span>
                </div>
                <div>
                  <span className="text-neutral-400 block text-xs mb-1">{t.totalPenalties} (الفوارق والغرامات)</span>
                  <span className="font-bold text-red-400 text-base">{formatDzd(totalPenaltiesDzd)}</span>
                </div>
                <div>
                  <span className="text-neutral-400 block text-xs mb-1">{language === 'ar' ? 'الإجمالي المطلوب دفعه' : 'Total Net à Payer'}</span>
                  <span className="font-black text-emerald-400 text-lg">{formatDzd(totalSettlementDueDzd)}</span>
                </div>
              </div>

              {/* Settlement Outcome */}
              <div className="pt-2 border-t border-neutral-800 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div className="text-xs text-neutral-400">
                  {language === 'ar' 
                    ? 'المبلغ الصافي المطلوب استلامه نقداً في الصندوق عند استرجاع السيارة' 
                    : 'Montant net à encaisser en caisse à la réception du véhicule'}
                </div>

                <div className="text-end font-mono">
                  <span className="text-xl font-black text-emerald-400">{formatDzd(totalSettlementDueDzd)}</span>
                </div>
              </div>
            </div>

            {/* Staff & Notes */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-neutral-700 dark:text-neutral-300 font-medium mb-1">
                  {t.returnedByStaff} *
                </label>
                <input
                  type="text"
                  required
                  value={returnedByStaff}
                  onChange={(e) => setReturnedByStaff(e.target.value)}
                  className="w-full bg-neutral-50 dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-700 rounded-lg p-2 text-neutral-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-neutral-700 dark:text-neutral-300 font-medium mb-1">
                  {t.notes}
                </label>
                <input
                  type="text"
                  placeholder={language === 'ar' ? 'ملاحظات تسليم المركبة أو السداد...' : 'Observations de clôture...'}
                  value={settlementNotes}
                  onChange={(e) => setSettlementNotes(e.target.value)}
                  className="w-full bg-neutral-50 dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-700 rounded-lg p-2 text-neutral-900 dark:text-white"
                />
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center justify-end gap-2 pt-3 border-t border-neutral-200 dark:border-neutral-800">
              <button
                type="button"
                onClick={closeReturnModal}
                className="px-4 py-2 rounded-lg bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 font-semibold cursor-pointer"
              >
                {t.cancel}
              </button>
              <button
                type="submit"
                className="px-5 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold cursor-pointer transition-colors shadow-sm flex items-center gap-1.5"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>{t.completeReturnAndSettle}</span>
              </button>
            </div>
          </form>
        )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

import React, { useState, useEffect } from 'react';
import { 
  X, Car, Calendar, DollarSign, 
  Fuel, Gauge, Shield, Printer, Check, Plus, Users, Sparkles, MapPin, UserCheck, FileText, Clock
} from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import { useApp } from '../../context/AppContext';
import { dbStore } from '../../db/store';
import { FuelLevel, Vehicle } from '../../types';

import { getTodayLocalDate, getTomorrowLocalDate, addDaysToDate, formatDateDisplay } from '../../utils/dateUtils';

export const NewRentalModal: React.FC = () => {
  const { 
    isNewRentalModalOpen, closeNewRentalModal, 
    preselectedVehicleId, preselectedDate, preselectedEndDate, rentalModalMode, setRentalModalMode,
    t, language, addToast, setContractToPrint 
  } = useApp();

  const allVehicles = dbStore.getVehicles();
  const existingCustomers = dbStore.getCustomers();

  const todayStr = getTodayLocalDate();
  const tomorrowStr = getTomorrowLocalDate();

  // Mode: RENTAL vs RESERVATION
  const [mode, setMode] = useState<'RENTAL' | 'RESERVATION'>('RENTAL');

  // Customer Direct Fields (No independent customer file required!)
  const [customerFullName, setCustomerFullName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerLicense, setCustomerLicense] = useState('');
  const [customerLicenseDate, setCustomerLicenseDate] = useState('2020-01-01');
  const [customerCin, setCustomerCin] = useState('');
  const [customerWilaya, setCustomerWilaya] = useState('16 - Alger');
  const [customerAddress, setCustomerAddress] = useState('');
  const [customerBirthDate, setCustomerBirthDate] = useState('1992-06-15');
  const [customerBirthPlace, setCustomerBirthPlace] = useState('Alger');

  // Vehicles Multi-Selection (كراء متعدد لزبون واحد)
  const [selectedVehicleIds, setSelectedVehicleIds] = useState<string[]>([]);

  // Dates & Wedding / Journee Options
  const [startDate, setStartDate] = useState(todayStr);
  const [startTime, setStartTime] = useState('09:00');
  const [expectedEndDate, setExpectedEndDate] = useState(tomorrowStr);
  const [expectedEndTime, setExpectedEndTime] = useState('09:00');
  const [isJournee, setIsJournee] = useState(false); // نظام اليومية للأعراس
  const [eventLocation, setEventLocation] = useState('');
  const [includesDriver, setIncludesDriver] = useState(false);

  // Financials (No caution / بدون ضمان)
  const [advancePaymentDzd, setAdvancePaymentDzd] = useState<number>(5000);
  const [customDailyRate, setCustomDailyRate] = useState<number | null>(null);
  const [initialNotes, setInitialNotes] = useState('');

  // Primary vehicle status meters (odometer & fuel)
  const [startKm, setStartKm] = useState<number>(0);
  const [startFuel, setStartFuel] = useState<FuelLevel>('8/8');

  // Sync mode and preselectedDate from context
  useEffect(() => {
    if (rentalModalMode) {
      setMode(rentalModalMode);
    }
    if (preselectedDate) {
      setStartDate(preselectedDate);
      if (preselectedEndDate) {
        setExpectedEndDate(preselectedEndDate);
      } else if (rentalModalMode === 'RESERVATION' || isJournee) {
        setExpectedEndDate(preselectedDate);
      } else {
        setExpectedEndDate(addDaysToDate(preselectedDate, 1));
      }
    } else if (preselectedEndDate) {
      setExpectedEndDate(preselectedEndDate);
    }
  }, [rentalModalMode, preselectedDate, preselectedEndDate, isNewRentalModalOpen]);

  // Preselected vehicle handler
  useEffect(() => {
    if (preselectedVehicleId && !selectedVehicleIds.includes(preselectedVehicleId)) {
      setSelectedVehicleIds([preselectedVehicleId]);
      const v = dbStore.getVehicleById(preselectedVehicleId);
      if (v) {
        setStartKm(v.currentKm);
        setStartFuel(v.currentFuel);
      }
    } else if (allVehicles.length > 0 && selectedVehicleIds.length === 0) {
      const firstDispo = allVehicles.find(v => v.status === 'AVAILABLE') || allVehicles[0];
      if (firstDispo) {
        setSelectedVehicleIds([firstDispo.id]);
        setStartKm(firstDispo.currentKm);
        setStartFuel(firstDispo.currentFuel);
      }
    }
  }, [preselectedVehicleId, allVehicles]);

  // Toggle vehicle in multi-selection
  const toggleVehicleSelection = (vehicleId: string) => {
    setSelectedVehicleIds(prev => {
      if (prev.includes(vehicleId)) {
        if (prev.length === 1) return prev; // Keep at least one
        return prev.filter(id => id !== vehicleId);
      } else {
        return [...prev, vehicleId];
      }
    });
  };

  // Quick auto-fill if customer matches known phone or name
  const handlePhoneChange = (val: string) => {
    setCustomerPhone(val);
    if (val.length >= 8) {
      const match = existingCustomers.find(c => c.phone.replace(/\s+/g, '') === val.replace(/\s+/g, ''));
      if (match) {
        setCustomerFullName(match.fullName);
        setCustomerLicense(match.drivingLicenseNumber);
        setCustomerCin(match.cinOrPassport);
        setCustomerWilaya(match.wilaya);
        setCustomerAddress(match.address);
        if (match.birthDate) setCustomerBirthDate(match.birthDate);
        if (match.birthPlace) setCustomerBirthPlace(match.birthPlace);
      }
    }
  };

  // Duration calculation
  let durationDays = 1;
  if (isJournee) {
    durationDays = 1;
  } else {
    const startD = new Date(`${startDate}T${startTime}`);
    const endD = new Date(`${expectedEndDate}T${expectedEndTime}`);
    const diffTime = Math.max(0, endD.getTime() - startD.getTime());
    durationDays = Math.max(1, Math.ceil(diffTime / (1000 * 60 * 60 * 24)));
  }

  // Selected vehicles objects and rate
  const selectedVehiclesList = allVehicles.filter(v => selectedVehicleIds.includes(v.id));
  const autoCalculatedDailyRate = selectedVehiclesList.reduce((sum, v) => sum + (v.dailyRate || 0), 0);
  const activeDailyRate = customDailyRate !== null ? customDailyRate : autoCalculatedDailyRate;
  const totalRentDzd = activeDailyRate * durationDays;
  const remainingBalanceDzd = Math.max(0, totalRentDzd - advancePaymentDzd);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!customerFullName.trim()) {
      addToast(language === 'ar' ? 'يرجى إدخال اسم ولقب الزبون' : 'Veuillez renseigner le nom du client', 'error');
      return;
    }

    if (selectedVehicleIds.length === 0) {
      addToast(language === 'ar' ? 'يرجى اختيار سيارة واحدة على الأقل' : 'Veuillez sélectionner au moins un véhicule', 'error');
      return;
    }

    const effectiveTargetEnd = isJournee ? startDate : expectedEndDate;

    // Check each selected vehicle for temporal conflict
    for (const vId of selectedVehicleIds) {
      const schedule = dbStore.getVehicleAvailabilitySchedule(vId, startDate, effectiveTargetEnd);
      if (!schedule.isAvailable) {
        const vObj = dbStore.getVehicleById(vId);
        const name = vObj ? `${vObj.brand} ${vObj.model}` : 'المركبة';
        addToast(
          language === 'ar'
            ? `تنبيه: ${name} ${schedule.conflictReason || 'غير متاحة في هذه الفترة المحددة لوجود حجز مسبق'}`
            : `Attention : ${name} ${schedule.conflictReason || 'est indisponible sur cette période'}`,
          'error'
        );
        return;
      }
    }

    try {
      const contract = dbStore.createRentalContract({
        directCustomer: {
          fullName: customerFullName.trim(),
          phone: customerPhone.trim() || '0550 00 00 00',
          drivingLicenseNumber: customerLicense.trim() || '16/00000',
          drivingLicenseIssueDate: customerLicenseDate,
          cinOrPassport: customerCin.trim() || '16-000000',
          wilaya: customerWilaya,
          address: customerAddress || customerWilaya,
          birthDate: customerBirthDate,
          birthPlace: customerBirthPlace,
        },
        vehicleId: selectedVehicleIds[0],
        vehicleIds: selectedVehicleIds,
        contractType: mode,
        isJournee,
        eventLocation,
        includesDriver,
        startDate,
        startTime,
        expectedEndDate: isJournee ? startDate : expectedEndDate,
        expectedEndTime: isJournee ? '23:59' : expectedEndTime,
        durationDays,
        startKm,
        startFuel,
        dailyRateDzd: activeDailyRate,
        advancePaymentDzd: Number(advancePaymentDzd) || 0,
        cautionDzd: 0, // No Caution
        cautionPaymentMethod: 'CASH',
        initialNotes,
        customTag: isJournee ? 'Mariage / Journée' : (selectedVehicleIds.length > 1 ? 'Cortège Multi-Véhicules' : undefined),
      });

      addToast(
        language === 'ar' 
          ? (mode === 'RESERVATION' ? `تم تسجيل الحجز ${contract.contractNumber} بنجاح` : `تم إنشاء العقد ${contract.contractNumber} بنجاح`)
          : (mode === 'RESERVATION' ? `Réservation ${contract.contractNumber} enregistrée` : `Contrat ${contract.contractNumber} créé avec succès`),
        'success'
      );

      closeNewRentalModal();
      // Open instant print
      setContractToPrint(contract);
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
      {isNewRentalModalOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.18 }}
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4 overflow-y-auto"
        >
          <motion.div
            initial={{ scale: 0.94, opacity: 0, y: 16 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.95, opacity: 0, y: 14 }}
            transition={{ type: 'spring', stiffness: 420, damping: 28 }}
            className="w-full max-w-4xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-3xl p-4 sm:p-6 shadow-2xl space-y-4 my-auto max-h-[94vh] overflow-y-auto"
          >
            {/* Top Header & Mode Switcher */}
        <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-neutral-200 dark:border-neutral-800">
          <div className="flex items-center gap-3">
            <div className={`p-2.5 rounded-2xl ${mode === 'RESERVATION' ? 'bg-purple-500 text-white shadow-md shadow-purple-500/20' : 'bg-amber-500 text-neutral-950 shadow-md shadow-amber-500/20'}`}>
              <Car className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-extrabold text-base sm:text-lg text-neutral-900 dark:text-white font-bukra italic">
                {mode === 'RESERVATION' 
                  ? (language === 'ar' ? 'حجز مسبق جديد (Nouvelle Réservation)' : 'Nouvelle Réservation (Cortège / Mariage)')
                  : (language === 'ar' ? 'عقد إيجار جديد (Nouveau Contrat)' : 'Nouveau Contrat de Location')}
              </h3>
              <p className="text-xs text-neutral-500 dark:text-neutral-400">
                {language === 'ar' ? 'إدخال فوري للزبون، كراء متعدد للسيارات، ونظام مالي بدون ضمان (Avance / Reste)' : 'Saisie directe client, multi-véhicules, système sans caution'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Mode Switcher */}
            <div className="flex items-center p-1 bg-neutral-100 dark:bg-neutral-800 rounded-xl text-xs font-bold font-bukra italic border border-neutral-200 dark:border-neutral-700">
              <button
                type="button"
                onClick={() => setMode('RENTAL')}
                className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                  mode === 'RENTAL' ? 'bg-amber-500 text-neutral-950 shadow-xs' : 'text-neutral-500 hover:text-neutral-900 dark:hover:text-white'
                }`}
              >
                {language === 'ar' ? 'عقد تسليم فوري' : 'Contrat Immédiat'}
              </button>
              <button
                type="button"
                onClick={() => setMode('RESERVATION')}
                className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                  mode === 'RESERVATION' ? 'bg-purple-600 text-white shadow-xs' : 'text-neutral-500 hover:text-neutral-900 dark:hover:text-white'
                }`}
              >
                {language === 'ar' ? 'حجز مسبق / عرس' : 'Réservation / Mariage'}
              </button>
            </div>

            <button
              onClick={closeNewRentalModal}
              className="p-2 rounded-xl text-neutral-400 hover:text-neutral-900 dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-neutral-800 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 text-xs font-sans">
          {/* SECTION 1: DIRECT CUSTOMER DETAILS (NO EXTRA STEPS) */}
          <div className="p-4 rounded-2xl bg-neutral-50 dark:bg-neutral-800/40 border border-neutral-200 dark:border-neutral-700/80 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-amber-500" />
                <h4 className="font-bold text-xs uppercase tracking-wider text-neutral-900 dark:text-white font-bukra italic">
                  {language === 'ar' ? 'بيانات الزبون المباشرة (Saisie Directe)' : 'Informations du Client'}
                </h4>
              </div>
              <span className="text-[10px] text-neutral-500">
                {language === 'ar' ? 'يتم حفظ وتحديث ملف الزبون آلياً' : 'Enregistrement automatique'}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
              <div>
                <label className="block text-neutral-600 dark:text-neutral-400 mb-1 font-semibold">
                  {language === 'ar' ? 'الاسم واللقب *' : 'Nom & Prénom *'}
                </label>
                <input
                  type="text"
                  required
                  value={customerFullName}
                  onChange={(e) => setCustomerFullName(e.target.value)}
                  placeholder="Ex: Karim Belkacem"
                  className="w-full bg-white dark:bg-neutral-900 border border-neutral-300 dark:border-neutral-700 rounded-xl px-3 py-2 font-bold text-neutral-900 dark:text-white focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="block text-neutral-600 dark:text-neutral-400 mb-1 font-semibold">
                  {language === 'ar' ? 'رقم الهاتف *' : 'Téléphone *'}
                </label>
                <input
                  type="tel"
                  required
                  value={customerPhone}
                  onChange={(e) => handlePhoneChange(e.target.value)}
                  placeholder="Ex: 0550 12 34 56"
                  className="w-full bg-white dark:bg-neutral-900 border border-neutral-300 dark:border-neutral-700 rounded-xl px-3 py-2 font-mono font-bold text-neutral-900 dark:text-white focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="block text-neutral-600 dark:text-neutral-400 mb-1 font-semibold">
                  {language === 'ar' ? 'رقم رخصة السياقة' : 'N° Permis de Conduire'}
                </label>
                <input
                  type="text"
                  value={customerLicense}
                  onChange={(e) => setCustomerLicense(e.target.value)}
                  placeholder="Ex: 16/094821"
                  className="w-full bg-white dark:bg-neutral-900 border border-neutral-300 dark:border-neutral-700 rounded-xl px-3 py-2 font-mono text-neutral-900 dark:text-white focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="block text-neutral-600 dark:text-neutral-400 mb-1 font-semibold">
                  {language === 'ar' ? 'بطاقة التعريف (CIN) / جواز' : 'CIN / Passeport'}
                </label>
                <input
                  type="text"
                  value={customerCin}
                  onChange={(e) => setCustomerCin(e.target.value)}
                  placeholder="Ex: 1120934812"
                  className="w-full bg-white dark:bg-neutral-900 border border-neutral-300 dark:border-neutral-700 rounded-xl px-3 py-2 font-mono text-neutral-900 dark:text-white focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="block text-neutral-600 dark:text-neutral-400 mb-1 font-semibold">
                  {language === 'ar' ? 'الولاية' : 'Wilaya'}
                </label>
                <input
                  type="text"
                  value={customerWilaya}
                  onChange={(e) => setCustomerWilaya(e.target.value)}
                  placeholder="Ex: 16 - Alger, 34 - BBA..."
                  className="w-full bg-white dark:bg-neutral-900 border border-neutral-300 dark:border-neutral-700 rounded-xl px-3 py-2 text-neutral-900 dark:text-white focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="block text-neutral-600 dark:text-neutral-400 mb-1 font-semibold">
                  {language === 'ar' ? 'العنوان' : 'Adresse'}
                </label>
                <input
                  type="text"
                  value={customerAddress}
                  onChange={(e) => setCustomerAddress(e.target.value)}
                  placeholder="Ex: Rue Didouche Mourad"
                  className="w-full bg-white dark:bg-neutral-900 border border-neutral-300 dark:border-neutral-700 rounded-xl px-3 py-2 text-neutral-900 dark:text-white focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="block text-neutral-600 dark:text-neutral-400 mb-1 font-semibold">
                  {language === 'ar' ? 'تاريخ الميلاد' : 'Date de Naissance'}
                </label>
                <input
                  type="date"
                  value={customerBirthDate}
                  onChange={(e) => setCustomerBirthDate(e.target.value)}
                  className="w-full bg-white dark:bg-neutral-900 border border-neutral-300 dark:border-neutral-700 rounded-xl px-3 py-2 font-mono text-neutral-900 dark:text-white focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="block text-neutral-600 dark:text-neutral-400 mb-1 font-semibold">
                  {language === 'ar' ? 'مكان الميلاد' : 'Lieu de Naissance'}
                </label>
                <input
                  type="text"
                  value={customerBirthPlace}
                  onChange={(e) => setCustomerBirthPlace(e.target.value)}
                  placeholder="Ex: Alger"
                  className="w-full bg-white dark:bg-neutral-900 border border-neutral-300 dark:border-neutral-700 rounded-xl px-3 py-2 text-neutral-900 dark:text-white focus:outline-none focus:border-amber-500"
                />
              </div>
            </div>
          </div>

          {/* SECTION 2: MULTI-VEHICLE SELECTION (كراء عدة سيارات لنفس الزبون) */}
          <div className="p-4 rounded-2xl bg-neutral-50 dark:bg-neutral-800/40 border border-neutral-200 dark:border-neutral-700/80 space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <Car className="w-4 h-4 text-amber-500" />
                <h4 className="font-bold text-xs uppercase tracking-wider text-neutral-900 dark:text-white font-bukra italic">
                  {language === 'ar' ? 'اختيار السيارات (Multi-Véhicules)' : 'Sélection des Véhicules'}
                </h4>
                <span className="px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-600 dark:text-amber-400 font-bold text-[10px]">
                  {selectedVehicleIds.length} {language === 'ar' ? 'سيارة مختارة' : 'sélectionnée(s)'}
                </span>
              </div>
              <span className="text-[11px] text-neutral-500">
                {language === 'ar' ? 'انقر لاختيار سيارة أو عدة سيارات (مواكب الأعراس والمناسبات)' : 'Sélectionnez une ou plusieurs voitures pour le même contrat'}
              </span>
            </div>

            {/* Vehicle Selection Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5 max-h-56 overflow-y-auto p-1">
              {allVehicles.map(v => {
                const isSelected = selectedVehicleIds.includes(v.id);
                const effectiveTargetEnd = isJournee ? startDate : expectedEndDate;
                const schedule = dbStore.getVehicleAvailabilitySchedule(v.id, startDate, effectiveTargetEnd);
                const isOperational = v.status !== 'MAINTENANCE' && v.status !== 'INSPECTION';
                const canSelect = isOperational && (schedule.isAvailable || isSelected);

                return (
                  <div
                    key={v.id}
                    onClick={() => {
                      if (canSelect) toggleVehicleSelection(v.id);
                    }}
                    className={`p-2.5 rounded-xl border flex flex-col justify-between transition-all select-none ${
                      isSelected
                        ? 'border-amber-500 bg-amber-500/10 shadow-xs'
                        : canSelect
                        ? 'border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 hover:border-amber-400 cursor-pointer'
                        : 'border-neutral-200 dark:border-neutral-800 opacity-60 bg-neutral-100 dark:bg-neutral-800/50 cursor-not-allowed'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2 min-w-0">
                        <div className={`w-4 h-4 rounded-md border flex items-center justify-center shrink-0 ${
                          isSelected ? 'bg-amber-500 border-amber-500 text-neutral-950' : 'border-neutral-400'
                        }`}>
                          {isSelected && <Check className="w-3 h-3 stroke-[3]" />}
                        </div>

                        <div className="truncate">
                          <div className="font-bold text-neutral-900 dark:text-white truncate text-xs">
                            {v.brand} {v.model}
                          </div>
                          <div className="font-mono text-[10px] text-neutral-500">
                            {v.matricule}
                          </div>
                        </div>
                      </div>

                      <div className="text-end shrink-0">
                        <div className="font-mono font-bold text-amber-600 dark:text-amber-400 text-xs">
                          {v.dailyRate.toLocaleString()} DA
                        </div>
                      </div>
                    </div>

                    {/* Smart Reservation / Gap Badge */}
                    <div className="mt-2 pt-1.5 border-t border-neutral-200/60 dark:border-neutral-700/60 text-[10px]">
                      {schedule.isAvailable ? (
                        schedule.nextUpcomingReservation ? (
                          <div className="text-amber-600 dark:text-amber-400 flex items-center justify-between font-semibold">
                            <span>📅 حجز قادم: {schedule.nextUpcomingReservation.startDate}</span>
                            <span className="text-[9px] bg-amber-500/20 px-1.5 py-0.2 rounded text-amber-500">متاحة حتى {schedule.maxAllowedEndDate}</span>
                          </div>
                        ) : (
                          <div className="text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-1">
                            <span>✓ {language === 'ar' ? 'متاحة تماماً' : 'Totalement disponible'}</span>
                          </div>
                        )
                      ) : (
                        <div className="space-y-1">
                          <div className="text-red-500 font-semibold truncate" title={schedule.conflictReason}>
                            ⚠️ {schedule.conflictReason}
                          </div>
                          {schedule.maxAllowedEndDate && schedule.maxAllowedEndDate >= startDate && (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setExpectedEndDate(schedule.maxAllowedEndDate!);
                                if (!selectedVehicleIds.includes(v.id)) {
                                  toggleVehicleSelection(v.id);
                                }
                              }}
                              className="w-full text-center py-0.5 px-1 bg-amber-500/20 hover:bg-amber-500/30 text-amber-600 dark:text-amber-400 font-bold rounded text-[9px] cursor-pointer"
                            >
                              {language === 'ar' ? `اضبط الإرجاع على ${schedule.maxAllowedEndDate} للكراء` : `Ajuster retour au ${schedule.maxAllowedEndDate}`}
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* SECTION 3: DATES, JOURNÉE (MARIAGE) & OPTIONS */}
          <div className="p-4 rounded-2xl bg-neutral-50 dark:bg-neutral-800/40 border border-neutral-200 dark:border-neutral-700/80 space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-amber-500" />
                <h4 className="font-bold text-xs uppercase tracking-wider text-neutral-900 dark:text-white font-bukra italic">
                  {language === 'ar' ? 'التوقيت، المناسبة ونظام اليومية (Journée)' : 'Période & Système Journée'}
                </h4>
              </div>

              {/* Journee Toggle (Wedding Full-Day) */}
              <label className="flex items-center gap-2 cursor-pointer bg-white dark:bg-neutral-900 px-3 py-1.5 rounded-xl border border-neutral-300 dark:border-neutral-700">
                <input
                  type="checkbox"
                  checked={isJournee}
                  onChange={(e) => {
                    const checked = e.target.checked;
                    setIsJournee(checked);
                    if (checked) {
                      setExpectedEndDate(startDate);
                    }
                  }}
                  className="rounded text-amber-500 focus:ring-0"
                />
                <span className="font-bold text-neutral-900 dark:text-white font-bukra italic text-[11px]">
                  {language === 'ar' ? 'نظام اليوم الكامل / عرس (Journée)' : 'Formule Journée / Mariage'}
                </span>
              </label>
            </div>

            {/* Quick Duration Presets for 100% Error-Free Booking */}
            <div className="flex items-center gap-1.5 flex-wrap pt-1">
              <span className="text-[10px] text-neutral-500 font-semibold font-bukra italic me-1">
                {language === 'ar' ? 'تحديد المدة السريع:' : 'Durée rapide :'}
              </span>
              <button
                type="button"
                onClick={() => {
                  setIsJournee(true);
                  setExpectedEndDate(startDate);
                }}
                className={`px-2.5 py-1 rounded-lg text-[10px] font-bold cursor-pointer transition-all ${
                  isJournee
                    ? 'bg-amber-500 text-neutral-950 font-black shadow-xs'
                    : 'bg-white dark:bg-neutral-900 border border-neutral-300 dark:border-neutral-700 text-neutral-700 dark:text-neutral-300 hover:border-amber-400'
                }`}
              >
                {language === 'ar' ? 'عرس / نفس اليوم (Journée)' : 'Journée (Même jour)'}
              </button>
              <button
                type="button"
                onClick={() => {
                  setIsJournee(false);
                  setExpectedEndDate(addDaysToDate(startDate, 1));
                }}
                className={`px-2.5 py-1 rounded-lg text-[10px] font-bold cursor-pointer transition-all ${
                  !isJournee && expectedEndDate === addDaysToDate(startDate, 1)
                    ? 'bg-amber-500 text-neutral-950 font-black shadow-xs'
                    : 'bg-white dark:bg-neutral-900 border border-neutral-300 dark:border-neutral-700 text-neutral-700 dark:text-neutral-300 hover:border-amber-400'
                }`}
              >
                {language === 'ar' ? '24 ساعة (يوم كامل)' : '24h (1 Jour)'}
              </button>
              <button
                type="button"
                onClick={() => {
                  setIsJournee(false);
                  setExpectedEndDate(addDaysToDate(startDate, 2));
                }}
                className={`px-2.5 py-1 rounded-lg text-[10px] font-bold cursor-pointer transition-all ${
                  !isJournee && expectedEndDate === addDaysToDate(startDate, 2)
                    ? 'bg-amber-500 text-neutral-950 font-black shadow-xs'
                    : 'bg-white dark:bg-neutral-900 border border-neutral-300 dark:border-neutral-700 text-neutral-700 dark:text-neutral-300 hover:border-amber-400'
                }`}
              >
                {language === 'ar' ? 'يومان (2 Jours)' : '2 Jours'}
              </button>
              <button
                type="button"
                onClick={() => {
                  setIsJournee(false);
                  setExpectedEndDate(addDaysToDate(startDate, 3));
                }}
                className={`px-2.5 py-1 rounded-lg text-[10px] font-bold cursor-pointer transition-all ${
                  !isJournee && expectedEndDate === addDaysToDate(startDate, 3)
                    ? 'bg-amber-500 text-neutral-950 font-black shadow-xs'
                    : 'bg-white dark:bg-neutral-900 border border-neutral-300 dark:border-neutral-700 text-neutral-700 dark:text-neutral-300 hover:border-amber-400'
                }`}
              >
                {language === 'ar' ? '3 أيام' : '3 Jours'}
              </button>
              <button
                type="button"
                onClick={() => {
                  setIsJournee(false);
                  setExpectedEndDate(addDaysToDate(startDate, 7));
                }}
                className={`px-2.5 py-1 rounded-lg text-[10px] font-bold cursor-pointer transition-all ${
                  !isJournee && expectedEndDate === addDaysToDate(startDate, 7)
                    ? 'bg-amber-500 text-neutral-950 font-black shadow-xs'
                    : 'bg-white dark:bg-neutral-900 border border-neutral-300 dark:border-neutral-700 text-neutral-700 dark:text-neutral-300 hover:border-amber-400'
                }`}
              >
                {language === 'ar' ? 'أسبوع (7 Jours)' : '1 Semaine'}
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
              <div>
                <label className="block text-neutral-600 dark:text-neutral-400 mb-1 font-semibold text-xs">
                  {language === 'ar' ? 'تاريخ الانطلاق' : 'Date de Départ'}
                </label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => {
                    const val = e.target.value;
                    setStartDate(val);
                    if (isJournee || mode === 'RESERVATION' || expectedEndDate < val) {
                      setExpectedEndDate(val);
                    }
                  }}
                  className="w-full bg-white dark:bg-neutral-900 border border-neutral-300 dark:border-neutral-700 rounded-xl px-3 py-2 font-mono text-neutral-900 dark:text-white focus:outline-none focus:border-amber-500 font-bold"
                />
              </div>

              <div>
                <label className="block text-neutral-600 dark:text-neutral-400 mb-1 font-semibold text-xs">
                  {language === 'ar' ? 'ساعة الانطلاق' : 'Heure de Départ'}
                </label>
                <input
                  type="time"
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                  className="w-full bg-white dark:bg-neutral-900 border border-neutral-300 dark:border-neutral-700 rounded-xl px-3 py-2 font-mono text-neutral-900 dark:text-white focus:outline-none focus:border-amber-500"
                />
              </div>

              {!isJournee && (
                <>
                  <div>
                    <label className="block text-neutral-600 dark:text-neutral-400 mb-1 font-semibold text-xs">
                      {language === 'ar' ? 'تاريخ العودة المتوقع' : 'Date de Retour'}
                    </label>
                    <input
                      type="date"
                      min={startDate}
                      value={expectedEndDate}
                      onChange={(e) => setExpectedEndDate(e.target.value)}
                      className="w-full bg-white dark:bg-neutral-900 border border-neutral-300 dark:border-neutral-700 rounded-xl px-3 py-2 font-mono text-neutral-900 dark:text-white focus:outline-none focus:border-amber-500 font-bold"
                    />
                  </div>

                  <div>
                    <label className="block text-neutral-600 dark:text-neutral-400 mb-1 font-semibold text-xs">
                      {language === 'ar' ? 'ساعة العودة' : 'Heure de Retour'}
                    </label>
                    <input
                      type="time"
                      value={expectedEndTime}
                      onChange={(e) => setExpectedEndTime(e.target.value)}
                      className="w-full bg-white dark:bg-neutral-900 border border-neutral-300 dark:border-neutral-700 rounded-xl px-3 py-2 font-mono text-neutral-900 dark:text-white focus:outline-none focus:border-amber-500"
                    />
                  </div>
                </>
              )}

              {isJournee && (
                <>
                  <div>
                    <label className="block text-neutral-600 dark:text-neutral-400 mb-1 font-semibold">
                      {language === 'ar' ? 'مكان العرس / القاعة' : 'Lieu / Salle des fêtes'}
                    </label>
                    <input
                      type="text"
                      value={eventLocation}
                      onChange={(e) => setEventLocation(e.target.value)}
                      placeholder="Ex: Salle El Bahia, BBA"
                      className="w-full bg-white dark:bg-neutral-900 border border-neutral-300 dark:border-neutral-700 rounded-xl px-3 py-2 text-neutral-900 dark:text-white focus:outline-none focus:border-amber-500"
                    />
                  </div>

                  <div className="flex items-center pt-6">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={includesDriver}
                        onChange={(e) => setIncludesDriver(e.target.checked)}
                        className="rounded text-amber-500 focus:ring-0"
                      />
                      <span className="font-bold text-neutral-800 dark:text-neutral-200">
                        {language === 'ar' ? 'مع سائق (Avec Chauffeur)' : 'Avec chauffeur'}
                      </span>
                    </label>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* SECTION 4: FINANCIAL BREAKDOWN (NO CAUTION REQUIRED) */}
          <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <DollarSign className="w-5 h-5 text-amber-500" />
                <h4 className="font-bold text-xs uppercase tracking-wider text-neutral-900 dark:text-white font-bukra italic">
                  {language === 'ar' ? 'الحساب المالي (بدون ضمان / بدون Caution)' : 'Règlement Financier (Sans Caution)'}
                </h4>
              </div>
              <span className="text-[10px] text-amber-700 dark:text-amber-400 font-bold font-mono">
                {durationDays} {language === 'ar' ? 'يوم' : 'Jour(s)'} × {selectedVehicleIds.length} {language === 'ar' ? 'سيارات' : 'voiture(s)'}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="p-3 rounded-xl bg-white dark:bg-neutral-900 border border-neutral-300 dark:border-neutral-700">
                <div className="text-[10px] uppercase font-bold text-neutral-500">
                  {language === 'ar' ? 'المجموع الكلي للإيجار' : 'TOTAL LOCATION'}
                </div>
                <div className="text-lg font-black font-mono text-amber-600 dark:text-amber-400 mt-1">
                  {formatDzd(totalRentDzd)}
                </div>
              </div>

              <div className="p-3 rounded-xl bg-white dark:bg-neutral-900 border border-neutral-300 dark:border-neutral-700">
                <label className="block text-[10px] uppercase font-bold text-emerald-600 dark:text-emerald-400 mb-1">
                  {language === 'ar' ? 'العربون المدفوع (Avance) *' : 'AVANCE VERSÉE (DA) *'}
                </label>
                <input
                  type="number"
                  min="0"
                  step="500"
                  value={advancePaymentDzd}
                  onChange={(e) => setAdvancePaymentDzd(Number(e.target.value) || 0)}
                  className="w-full bg-neutral-50 dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-700 rounded-lg px-2.5 py-1 text-base font-black font-mono text-emerald-600 focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="p-3 rounded-xl bg-white dark:bg-neutral-900 border border-neutral-300 dark:border-neutral-700">
                <div className="text-[10px] uppercase font-bold text-red-500">
                  {language === 'ar' ? 'المبلغ المتبقي (Reste à payer)' : 'RESTE À PAYER'}
                </div>
                <div className="text-lg font-black font-mono text-red-600 dark:text-red-400 mt-1">
                  {formatDzd(remainingBalanceDzd)}
                </div>
              </div>
            </div>
          </div>

          {/* Action Submit Buttons */}
          <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-neutral-200 dark:border-neutral-800">
            <div className="text-[11px] text-neutral-500 font-mono flex items-center gap-1.5">
              <FileText className="w-4 h-4 text-amber-500" />
              <span>
                {mode === 'RESERVATION' 
                  ? (language === 'ar' ? 'سيتم إصدار وصل حجز رسمي A4 فوراً' : 'Bon de Réservation A4 généré')
                  : (language === 'ar' ? 'سيتم إصدار عقد كراء رسمي A4 مع تسليم السيارات' : 'Contrat de Location A4 généré')}
              </span>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={closeNewRentalModal}
                className="px-4 py-2 rounded-xl bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-700 text-neutral-700 dark:text-neutral-300 font-bold text-xs cursor-pointer font-bukra italic"
              >
                {t.cancel}
              </button>

              <button
                type="submit"
                className={`px-5 py-2.5 rounded-xl font-black text-xs cursor-pointer shadow-md flex items-center gap-2 font-bukra italic ${
                  mode === 'RESERVATION'
                    ? 'bg-purple-600 hover:bg-purple-500 text-white shadow-purple-600/30'
                    : 'bg-amber-500 hover:bg-amber-400 text-neutral-950 shadow-amber-500/30'
                }`}
              >
                <Printer className="w-4 h-4 stroke-[2.5]" />
                <span>
                  {mode === 'RESERVATION' 
                    ? (language === 'ar' ? 'تأكيد الحجز وطباعة الوصل (A4)' : 'Confirmer & Imprimer Bon (A4)')
                    : (language === 'ar' ? 'تأكيد العقد وطباعته (A4)' : 'Créer Contrat & Imprimer (A4)')}
                </span>
              </button>
            </div>
          </div>
        </form>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

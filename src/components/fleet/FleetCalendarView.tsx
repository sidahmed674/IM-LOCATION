import React, { useState } from 'react';
import { 
  Calendar as CalendarIcon, ChevronLeft, ChevronRight, 
  Car, Clock, Plus, Key, CheckCircle2, RotateCcw,
  ArrowUpRight, ArrowDownLeft, AlertTriangle, Eye,
  Check, User, Phone, Sparkles, Filter, FileText
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { dbStore } from '../../db/store';
import { RentalContract, Vehicle } from '../../types';
import { formatLocalDate, getTodayLocalDate, formatDateDisplay, formatDateFull, subtractDaysFromDate, getDaysDifference } from '../../utils/dateUtils';

export const FleetCalendarView: React.FC = () => {
  const { t, language, openNewRentalModal, openReturnModal, setContractToPrint } = useApp();
  const vehicles = dbStore.getVehicles();
  const rentals = dbStore.getRentals();

  // Tab: 'MONTH' (True Monthly Grid) vs 'TIMELINE' (Gantt)
  const [calendarMode, setCalendarMode] = useState<'MONTH' | 'TIMELINE'>('MONTH');

  // Currently viewed month/year (Always initialized at noon to avoid timezone/DST shifts)
  const [viewDate, setViewDate] = useState(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1, 12, 0, 0);
  });
  
  // Selected day for the Day Inspector (defaults to today's local date)
  const todayYMD = getTodayLocalDate();
  const [selectedDayYMD, setSelectedDayYMD] = useState<string>(todayYMD);

  const year = viewDate.getFullYear();
  const month = viewDate.getMonth(); // 0-indexed

  // Navigation handlers
  const handlePrevMonth = () => {
    const prev = new Date(year, month - 1, 1, 12, 0, 0);
    setViewDate(prev);
    setSelectedDayYMD(formatLocalDate(prev));
  };

  const handleNextMonth = () => {
    const next = new Date(year, month + 1, 1, 12, 0, 0);
    setViewDate(next);
    setSelectedDayYMD(formatLocalDate(next));
  };

  const handleToday = () => {
    const today = new Date();
    const normalizedToday = new Date(today.getFullYear(), today.getMonth(), 1, 12, 0, 0);
    setViewDate(normalizedToday);
    setSelectedDayYMD(getTodayLocalDate());
  };

  // Month Title
  const monthTitle = viewDate.toLocaleDateString(language === 'ar' ? 'ar-DZ' : (language === 'fr' ? 'fr-DZ' : 'en-US'), {
    month: 'long',
    year: 'numeric'
  });

  // Days of the week headers (Saturday first as standard in Algerian commercial calendars)
  const weekDaysAr = ['السبت', 'الأحد', 'الإثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة'];
  const weekDaysFr = ['Samedi', 'Dimanche', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi'];
  const weekDayLabels = language === 'ar' ? weekDaysAr : weekDaysFr;

  // Build true month calendar grid
  // Saturday is column 0
  const firstDayOfMonth = new Date(year, month, 1, 12, 0, 0);
  const lastDayOfMonth = new Date(year, month + 1, 0, 12, 0, 0);
  const totalDaysInMonth = lastDayOfMonth.getDate();

  const getDayOffsetSaturdayFirst = (d: Date) => {
    const jsDay = d.getDay();
    return (jsDay + 1) % 7;
  };

  const startOffset = getDayOffsetSaturdayFirst(firstDayOfMonth);

  // Month grid days array
  interface MonthCell {
    date: Date;
    dayNumber: number;
    isCurrentMonth: boolean;
    ymd: string;
  }

  const calendarCells: MonthCell[] = [];

  // Previous month padding days
  const prevMonthLastDay = new Date(year, month, 0, 12, 0, 0).getDate();
  for (let i = startOffset - 1; i >= 0; i--) {
    const dayNum = prevMonthLastDay - i;
    const d = new Date(year, month - 1, dayNum, 12, 0, 0);
    calendarCells.push({
      date: d,
      dayNumber: dayNum,
      isCurrentMonth: false,
      ymd: formatLocalDate(d)
    });
  }

  // Current month days
  for (let d = 1; d <= totalDaysInMonth; d++) {
    const dateObj = new Date(year, month, d, 12, 0, 0);
    calendarCells.push({
      date: dateObj,
      dayNumber: d,
      isCurrentMonth: true,
      ymd: formatLocalDate(dateObj)
    });
  }

  // Next month padding days to complete grid to 35 or 42 cells
  const remainingCells = (7 - (calendarCells.length % 7)) % 7;
  for (let i = 1; i <= remainingCells; i++) {
    const d = new Date(year, month + 1, i, 12, 0, 0);
    calendarCells.push({
      date: d,
      dayNumber: i,
      isCurrentMonth: false,
      ymd: formatLocalDate(d)
    });
  }

  // Helper to query contracts that cover a specific YMD
  const getRentalsForDate = (ymd: string) => {
    return rentals.filter(r => {
      if (r.status === 'CANCELLED') return false;
      return ymd >= r.startDate && ymd <= r.expectedEndDate;
    });
  };

  // Helper to get ALL vehicle IDs rented/reserved on a specific date (supports multi-vehicle rentals)
  const getRentedVehicleIdsForDate = (ymd: string) => {
    const dayRentals = getRentalsForDate(ymd);
    const ids = new Set<string>();
    dayRentals.forEach(r => {
      if (r.vehicleId) ids.add(r.vehicleId);
      const multiIds = r.vehicleIds || r.selectedVehicleIds;
      if (multiIds && Array.isArray(multiIds)) {
        multiIds.forEach((id: string) => ids.add(id));
      }
      if (r.vehicleSnapshots && Array.isArray(r.vehicleSnapshots)) {
        r.vehicleSnapshots.forEach(v => ids.add(v.id));
      }
    });
    return ids;
  };

  // Helper to query departures on a date
  const getDeparturesForDate = (ymd: string) => {
    return rentals.filter(r => r.status !== 'CANCELLED' && r.startDate === ymd);
  };

  // Helper to query expected returns on a date
  const getReturnsForDate = (ymd: string) => {
    return rentals.filter(r => r.status !== 'CANCELLED' && r.expectedEndDate === ymd);
  };

  // Today Fleet KPIs
  const totalVehiclesCount = vehicles.length;
  const todayRentedVehicleIds = getRentedVehicleIdsForDate(todayYMD);
  const rentedTodayCount = todayRentedVehicleIds.size;
  const availableTodayCount = Math.max(0, totalVehiclesCount - rentedTodayCount);
  const returnsToday = getReturnsForDate(todayYMD);
  const departuresToday = getDeparturesForDate(todayYMD);

  // Selected Day Details for Inspector Panel
  const selectedDayRentals = getRentalsForDate(selectedDayYMD);
  const selectedDayDepartures = getDeparturesForDate(selectedDayYMD);
  const selectedDayReturns = getReturnsForDate(selectedDayYMD);
  const selectedDayRentedVehicleIds = getRentedVehicleIdsForDate(selectedDayYMD);
  const selectedDayAvailableVehicles = vehicles.filter(v => !selectedDayRentedVehicleIds.has(v.id) && v.status !== 'MAINTENANCE');

  // Timeline (Gantt) 14 days strictly using local dates
  const timelineDays: Date[] = [];
  const startTimeline = new Date(viewDate.getFullYear(), viewDate.getMonth(), 1, 12, 0, 0);
  for (let i = 0; i < 15; i++) {
    const d = new Date(startTimeline.getFullYear(), startTimeline.getMonth(), startTimeline.getDate() + i, 12, 0, 0);
    timelineDays.push(d);
  }

  const formatDzd = (n: number) => {
    return new Intl.NumberFormat(language === 'ar' ? 'ar-DZ' : 'fr-FR', {
      maximumFractionDigits: 0
    }).format(n) + ' ' + t.currency;
  };

  return (
    <div className="space-y-6">
      {/* Real-time Fleet Availability KPI Header Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-5 gap-3">
        <div className="p-3.5 rounded-2xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 shadow-xs">
          <div className="text-xs text-neutral-500 flex items-center justify-between">
            <span className="font-bukra italic">{language === 'ar' ? 'إجمالي الأسطول' : 'Flotte Totale'}</span>
            <Car className="w-4 h-4 text-neutral-400" />
          </div>
          <div className="text-2xl font-black font-mono mt-1 text-neutral-900 dark:text-white">
            {totalVehiclesCount} <span className="text-xs font-sans text-neutral-400 font-normal">{language === 'ar' ? 'مركبة' : 'véhicules'}</span>
          </div>
        </div>

        <div className="p-3.5 rounded-2xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 shadow-xs">
          <div className="text-xs text-neutral-500 flex items-center justify-between">
            <span className="font-bukra italic">{language === 'ar' ? 'متاح للتأجير الفوري' : 'Disponibles'}</span>
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
          </div>
          <div className="text-2xl font-black font-mono mt-1 text-emerald-600 dark:text-emerald-400">
            {availableTodayCount} <span className="text-xs font-sans text-neutral-400 font-normal">{language === 'ar' ? 'جاهزة' : 'prêtes'}</span>
          </div>
        </div>

        <div className="p-3.5 rounded-2xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 shadow-xs">
          <div className="text-xs text-neutral-500 flex items-center justify-between">
            <span className="font-bukra italic">{language === 'ar' ? 'مؤجرة / محجوزة' : 'En Location / Réservées'}</span>
            <span className="w-2.5 h-2.5 rounded-full bg-blue-500" />
          </div>
          <div className="text-2xl font-black font-mono mt-1 text-blue-600 dark:text-blue-400">
            {rentedTodayCount} <span className="text-xs font-sans text-neutral-400 font-normal">{language === 'ar' ? 'في حركة' : 'en route'}</span>
          </div>
        </div>

        <div className="p-3.5 rounded-2xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 shadow-xs">
          <div className="text-xs text-neutral-500 flex items-center justify-between">
            <span className="font-bukra italic">{language === 'ar' ? 'خروج اليوم' : 'Départs Aujourd’hui'}</span>
            <ArrowUpRight className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="text-2xl font-black font-mono mt-1 text-neutral-900 dark:text-white">
            {departuresToday.length}
          </div>
        </div>

        <div className="p-3.5 rounded-2xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 shadow-xs col-span-2 sm:col-span-1">
          <div className="text-xs text-neutral-500 flex items-center justify-between">
            <span className="font-bukra italic">{language === 'ar' ? 'استرجاع متوقع اليوم' : 'Retours Attendus'}</span>
            <RotateCcw className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-2xl font-black font-mono mt-1 text-amber-500">
            {returnsToday.length}
          </div>
        </div>
      </div>

      {/* Main Calendar Viewport Container */}
      <div className="rounded-3xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 shadow-sm overflow-hidden">
        {/* Navigation Toolbar */}
        <div className="p-4 sm:p-5 border-b border-neutral-200 dark:border-neutral-800 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-amber-500 text-neutral-950 font-bold shadow-md shadow-amber-500/20">
              <CalendarIcon className="w-5 h-5 stroke-[2.5]" />
            </div>
            <div>
              <h2 className="text-lg sm:text-xl font-black font-bukra italic text-neutral-900 dark:text-white capitalize">
                {monthTitle}
              </h2>
              <p className="text-xs text-neutral-500">
                {language === 'ar' 
                  ? 'انقر على أي تاريخ لمعاينة وتفقد جميع السيارات المحجوزة والمؤجرة فيه بدقة تامة'
                  : 'Cliquez sur n’importe quelle date pour afficher toutes les voitures louées ou réservées ce jour'}
              </p>
            </div>
          </div>

          <div className="flex items-center flex-wrap gap-2">
            {/* View Mode Switcher */}
            <div className="flex items-center p-1 bg-neutral-100 dark:bg-neutral-800 rounded-xl text-xs font-bold font-bukra italic border border-neutral-200 dark:border-neutral-700">
              <button
                onClick={() => setCalendarMode('MONTH')}
                className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${
                  calendarMode === 'MONTH'
                    ? 'bg-amber-500 text-neutral-950 font-bold shadow-xs'
                    : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white'
                }`}
              >
                {language === 'ar' ? 'تقويم شهري كامل' : 'Vue Mensuelle'}
              </button>

              <button
                onClick={() => setCalendarMode('TIMELINE')}
                className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${
                  calendarMode === 'TIMELINE'
                    ? 'bg-amber-500 text-neutral-950 font-bold shadow-xs'
                    : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white'
                }`}
              >
                {language === 'ar' ? 'مخطط الأسطول الزمني' : 'Planning Flotte'}
              </button>
            </div>

            {/* Navigation Controls */}
            <button
              onClick={handleToday}
              className="px-3.5 py-1.5 rounded-xl bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-700 text-xs font-bold text-neutral-800 dark:text-neutral-200 cursor-pointer transition-colors"
            >
              {t.today}
            </button>

            <div className="flex items-center border border-neutral-200 dark:border-neutral-700 rounded-xl overflow-hidden">
              <button
                onClick={handlePrevMonth}
                className="p-2 hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-600 dark:text-neutral-300 cursor-pointer"
                title="Mois précédent"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                onClick={handleNextMonth}
                className="p-2 hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-600 dark:text-neutral-300 cursor-pointer"
                title="Mois suivant"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* =========================================================================
            MODE 1: TRUE REAL MONTH CALENDAR GRID
            ========================================================================= */}
        {calendarMode === 'MONTH' && (
          <div className="p-2 sm:p-5 overflow-x-auto">
            <div className="min-w-[620px] sm:min-w-0">
              {/* Weekday Headers */}
              <div className="grid grid-cols-7 gap-1.5 sm:gap-2 mb-2">
                {weekDayLabels.map((dayName, idx) => (
                  <div
                    key={idx}
                    className="py-2.5 text-center text-xs font-bold text-neutral-500 uppercase tracking-wider font-bukra italic bg-neutral-50 dark:bg-neutral-800/40 rounded-xl"
                  >
                    {dayName}
                  </div>
                ))}
              </div>

              {/* Month Day Cells */}
              <div className="grid grid-cols-7 gap-1.5 sm:gap-2">
                {calendarCells.map((cell, idx) => {
                  const isToday = cell.ymd === todayYMD;
                  const isSelected = cell.ymd === selectedDayYMD;
                  const dayRentals = getRentalsForDate(cell.ymd);
                  const dayDepartures = getDeparturesForDate(cell.ymd);
                  const dayReturns = getReturnsForDate(cell.ymd);
                  const rentedIds = getRentedVehicleIdsForDate(cell.ymd);
                  const rentedCount = rentedIds.size;
                  const availableCount = Math.max(0, vehicles.length - rentedCount);

                  // Differentiate reservations vs active rentals
                  const dayReservations = dayRentals.filter(r => r.contractType === 'RESERVATION');
                  const dayActiveRentals = dayRentals.filter(r => r.contractType !== 'RESERVATION');

                  return (
                    <div
                      key={idx}
                      onClick={() => setSelectedDayYMD(cell.ymd)}
                      className={`min-h-[115px] sm:min-h-[125px] p-2 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between select-none ${
                        isSelected
                          ? 'border-amber-500 ring-2 ring-amber-500/40 bg-amber-500/10 shadow-md scale-[1.01]'
                          : isToday
                          ? 'border-amber-400 bg-amber-500/5'
                          : cell.isCurrentMonth
                          ? 'border-neutral-200 dark:border-neutral-800 hover:border-neutral-300 dark:hover:border-neutral-700 bg-white dark:bg-neutral-900/60'
                          : 'border-neutral-100 dark:border-neutral-800/40 bg-neutral-50/40 dark:bg-neutral-950/40 opacity-40'
                      }`}
                    >
                      {/* Top Row: Day Number & Today/Selected Tag */}
                      <div className="flex items-center justify-between">
                        <span
                          className={`w-6 h-6 rounded-full flex items-center justify-center font-mono text-xs font-bold ${
                            isToday
                              ? 'bg-amber-500 text-neutral-950 font-black'
                              : isSelected
                              ? 'bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 font-bold'
                              : 'text-neutral-700 dark:text-neutral-300'
                          }`}
                        >
                          {cell.dayNumber}
                        </span>

                        {isToday && (
                          <span className="text-[9px] font-bold text-amber-600 dark:text-amber-400 px-1 font-bukra italic">
                            {t.today}
                          </span>
                        )}
                      </div>

                      {/* Middle: Rental Badges */}
                      <div className="space-y-1 my-1 overflow-hidden">
                        {/* Reservations Badges (Purple with Sparkles) */}
                        {dayReservations.slice(0, 1).map(res => (
                          <div
                            key={`res-${res.id}`}
                            className="px-1.5 py-0.5 rounded-md bg-purple-500/15 border border-purple-500/30 text-purple-700 dark:text-purple-300 text-[10px] font-bold truncate flex items-center gap-1"
                            title={`Réservation: ${res.vehicleSnapshot?.model || 'Voiture'}`}
                          >
                            <Sparkles className="w-2.5 h-2.5 shrink-0 text-purple-500" />
                            <span className="truncate">{res.vehicleSnapshot?.model || 'Réservation'}</span>
                          </div>
                        ))}

                        {/* Active Rentals Badges (Blue with Key) */}
                        {dayActiveRentals.slice(0, 1).map(dep => (
                          <div
                            key={`rent-${dep.id}`}
                            className="px-1.5 py-0.5 rounded-md bg-blue-500/15 border border-blue-500/30 text-blue-700 dark:text-blue-300 text-[10px] font-bold truncate flex items-center gap-1"
                            title={`Location: ${dep.vehicleSnapshot?.model || 'Voiture'}`}
                          >
                            <Key className="w-2.5 h-2.5 shrink-0 text-blue-500" />
                            <span className="truncate">{dep.vehicleSnapshot?.model || 'Location'}</span>
                          </div>
                        ))}

                        {/* If more than 2 vehicles */}
                        {dayRentals.length > 2 && (
                          <div className="text-[9px] font-mono text-neutral-500 dark:text-neutral-400 px-1 font-bold">
                            +{dayRentals.length - 2} {language === 'ar' ? 'أخرى' : 'autres'}
                          </div>
                        )}
                      </div>

                      {/* Bottom: Availability Status */}
                      <div className="text-[10px] font-medium text-neutral-500 pt-1 border-t border-neutral-100 dark:border-neutral-800/60 flex items-center justify-between font-mono">
                        <span className="truncate">
                          {availableCount > 0 ? (
                            <span className="text-emerald-600 dark:text-emerald-400 font-bold">
                              {availableCount} {language === 'ar' ? 'متاحة' : 'disp.'}
                            </span>
                          ) : (
                            <span className="text-red-500 font-bold">
                              {language === 'ar' ? 'ممتلئ' : 'Complet'}
                            </span>
                          )}
                        </span>

                        {rentedCount > 0 && (
                          <span className="text-blue-500 font-bold">
                            {rentedCount} {language === 'ar' ? 'مكرية' : 'engagée'}
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* =========================================================================
            MODE 2: PLANNING FLOTTE GANTT TIMELINE
            ========================================================================= */}
        {calendarMode === 'TIMELINE' && (
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-start border-collapse">
              <thead>
                <tr className="bg-neutral-50 dark:bg-neutral-800/60 border-b border-neutral-200 dark:border-neutral-800 text-neutral-600 dark:text-neutral-300 font-semibold">
                  <th className="p-3.5 text-start min-w-[220px] sticky start-0 bg-neutral-50 dark:bg-neutral-800/90 backdrop-blur-xs z-10 border-e border-neutral-200 dark:border-neutral-800 font-bukra italic text-xs">
                    {t.matricule}
                  </th>
                  {timelineDays.map((day, idx) => {
                    const ymd = formatLocalDate(day);
                    const isToday = ymd === todayYMD;
                    return (
                      <th
                        key={idx}
                        className={`p-2.5 text-center min-w-[75px] font-mono text-xs border-e border-neutral-100 dark:border-neutral-800/60 ${
                          isToday ? 'bg-amber-500/15 text-amber-500 font-bold' : ''
                        }`}
                      >
                        <div className="uppercase text-[10px] text-neutral-400">
                          {day.toLocaleDateString(language === 'ar' ? 'ar-DZ' : 'fr-FR', { weekday: 'short' })}
                        </div>
                        <div className="font-bold">{day.getDate()}</div>
                      </th>
                    );
                  })}
                </tr>
              </thead>

              <tbody className="divide-y divide-neutral-200 dark:divide-neutral-800 text-neutral-800 dark:text-neutral-200">
                {vehicles.map((v) => (
                  <tr key={v.id} className="hover:bg-neutral-50/50 dark:hover:bg-neutral-800/30 transition-colors">
                    {/* Car Info Column */}
                    <td className="p-3 sticky start-0 bg-white dark:bg-neutral-900 border-e border-neutral-200 dark:border-neutral-800 font-semibold z-10">
                      <div className="flex items-center gap-2">
                        <div className={`w-2.5 h-2.5 rounded-full shrink-0 ${v.status === 'AVAILABLE' ? 'bg-emerald-500' : 'bg-blue-500'}`} />
                        <div>
                          <div className="font-bold font-bukra italic text-neutral-900 dark:text-white text-xs">
                            {v.brand} {v.model}
                          </div>
                          <div className="font-mono text-[11px] text-amber-500 font-bold">
                            {v.matricule}
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* Timeline Days */}
                    {timelineDays.map((day, idx) => {
                      const ymd = formatLocalDate(day);
                      // Check if vehicle is rented on this day (including multi-vehicle rentals)
                      const activeRental = rentals.find(r => {
                        if (r.status === 'CANCELLED') return false;
                        const multiIds = r.vehicleIds || r.selectedVehicleIds;
                        const hasCar = r.vehicleId === v.id || 
                          (multiIds && multiIds.includes(v.id)) ||
                          (r.vehicleSnapshots && r.vehicleSnapshots.some(s => s.id === v.id));
                        return hasCar && (ymd >= r.startDate && ymd <= r.expectedEndDate);
                      });

                      return (
                        <td
                          key={idx}
                          className="p-1 border-e border-neutral-100 dark:border-neutral-800/60 text-center relative"
                        >
                          {activeRental ? (
                            <div
                              onClick={() => {
                                setSelectedDayYMD(ymd);
                              }}
                              className={`py-1.5 px-1 rounded-md text-[10px] font-bold truncate cursor-pointer transition-transform hover:scale-105 shadow-2xs ${
                                activeRental.contractType === 'RESERVATION'
                                  ? 'bg-purple-500 text-white'
                                  : 'bg-blue-600 text-white'
                              }`}
                              title={`${activeRental.customerSnapshot?.fullName} (${activeRental.startDate} → ${activeRental.expectedEndDate})`}
                            >
                              {activeRental.customerSnapshot?.fullName?.split(' ')[0] || 'Client'}
                            </div>
                          ) : (
                            <div 
                              onClick={() => {
                                setSelectedDayYMD(ymd);
                              }}
                              className="w-full h-7 rounded hover:bg-emerald-500/10 cursor-pointer flex items-center justify-center text-[10px] text-neutral-300 dark:text-neutral-700"
                            >
                              ·
                            </div>
                          )}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* =========================================================================
          THE DAY INSPECTOR: ALL CARS RENTED OR RESERVED ON THIS SPECIFIC DATE
          ========================================================================= */}
      <div className="rounded-3xl bg-white dark:bg-neutral-900 border-2 border-amber-500/40 p-5 sm:p-6 shadow-md space-y-5">
        {/* Header Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-neutral-200 dark:border-neutral-800 gap-3">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-2xl bg-amber-500 text-neutral-950 font-bold shadow-md shadow-amber-500/20">
              <CalendarIcon className="w-6 h-6 stroke-[2.5]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-black text-base sm:text-lg text-neutral-900 dark:text-white font-bukra italic">
                  {language === 'ar' ? 'فحص حركة وحجوزات يوم:' : 'Mouvements & Réservations du :'}
                </h3>
                <span className="font-mono font-black text-amber-600 dark:text-amber-400 text-base sm:text-lg bg-amber-500/10 px-2.5 py-0.5 rounded-lg border border-amber-500/20">
                  {formatDateFull(selectedDayYMD, language)}
                </span>
              </div>
              <p className="text-xs text-neutral-500 mt-1">
                {selectedDayRentals.length} {language === 'ar' ? 'عقود وحجوزات قائمة' : 'contrats & réservations'} · {selectedDayRentedVehicleIds.size} {language === 'ar' ? 'سيارات مكرية' : 'véhicules engagés'} · {selectedDayAvailableVehicles.length} {language === 'ar' ? 'سيارات متاحة فوراً' : 'véhicules libres'}
              </p>
            </div>
          </div>

          {/* Quick Booking Button For This Exact Date */}
          <button
            onClick={() => openNewRentalModal(undefined, 'RENTAL', selectedDayYMD)}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 via-amber-400 to-yellow-400 hover:from-amber-400 hover:to-yellow-300 text-neutral-950 font-black text-xs sm:text-sm cursor-pointer shadow-md font-bukra italic self-start sm:self-auto"
          >
            <Plus className="w-4 h-4 stroke-[3]" />
            <span>{language === 'ar' ? 'كراء / حجز جديد في هذا اليوم' : 'Nouveau Contrat pour ce jour'}</span>
          </button>
        </div>

        {/* 2-Column Split: Rented/Reserved vs Available */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          {/* Column 1: ALL Rented & Reserved Vehicles for this specific date */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-black text-neutral-900 dark:text-white uppercase tracking-wider flex items-center gap-2 font-bukra italic">
                <Car className="w-4 h-4 text-blue-500" />
                <span>{language === 'ar' ? 'السيارات المكرية والمحجوزة في هذا التاريخ' : 'Véhicules Loués / Réservés ce jour'}</span>
              </h4>
              <span className="px-2.5 py-1 rounded-full bg-blue-500/15 text-blue-600 dark:text-blue-400 font-mono font-bold text-xs">
                {selectedDayRentedVehicleIds.size} {language === 'ar' ? 'سيارة' : 'voiture(s)'}
              </span>
            </div>

            {selectedDayRentals.length === 0 ? (
              <div className="p-8 text-center bg-neutral-50 dark:bg-neutral-800/40 rounded-2xl border border-dashed border-neutral-200 dark:border-neutral-800 space-y-2">
                <CheckCircle2 className="w-10 h-10 text-emerald-500/70 mx-auto" />
                <div className="font-bold text-neutral-800 dark:text-neutral-200 text-sm">
                  {language === 'ar' ? 'لا توجد سيارات مكرية أو محجوزة في هذا اليوم' : 'Aucun véhicule loué ou réservé à cette date'}
                </div>
                <div className="text-xs text-neutral-500">
                  {language === 'ar' ? 'كامل الأسطول متاح وجاهز للتأجير الفوري' : 'L’ensemble de votre parc est disponible'}
                </div>
              </div>
            ) : (
              <div className="space-y-3 max-h-[520px] overflow-y-auto pe-1">
                {selectedDayRentals.map(rental => {
                  const isDeparture = rental.startDate === selectedDayYMD;
                  const isReturn = rental.expectedEndDate === selectedDayYMD;
                  const carList = rental.vehicleSnapshots && rental.vehicleSnapshots.length > 0
                    ? rental.vehicleSnapshots
                    : [rental.vehicleSnapshot];

                  return (
                    <div
                      key={rental.id}
                      className="p-4 rounded-2xl bg-neutral-50 dark:bg-neutral-800/60 border border-neutral-200 dark:border-neutral-700 space-y-3 transition-all hover:border-amber-400/80 shadow-xs"
                    >
                      {/* Top Badges & Contract Number */}
                      <div className="flex flex-wrap items-center justify-between gap-2 pb-2 border-b border-neutral-200 dark:border-neutral-700">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="font-mono font-black text-xs text-neutral-900 dark:text-white">
                            {rental.contractNumber}
                          </span>

                          {rental.contractType === 'RESERVATION' ? (
                            <span className="px-2 py-0.5 rounded-full text-[10px] bg-purple-500/20 text-purple-600 dark:text-purple-400 font-bold flex items-center gap-1 font-bukra italic">
                              <Sparkles className="w-2.5 h-2.5" />
                              <span>{language === 'ar' ? 'حجز مسبق' : 'Réservation'}</span>
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 rounded-full text-[10px] bg-blue-500/20 text-blue-600 dark:text-blue-400 font-bold flex items-center gap-1 font-bukra italic">
                              <Key className="w-2.5 h-2.5" />
                              <span>{language === 'ar' ? 'عقد كراء' : 'Location'}</span>
                            </span>
                          )}

                          {rental.isJournee && (
                            <span className="px-2 py-0.5 rounded-full text-[10px] bg-amber-500/20 text-amber-600 dark:text-amber-400 font-bold font-bukra italic">
                              {language === 'ar' ? 'عرس / يومية' : 'Cortège / Journée'}
                            </span>
                          )}

                          {isDeparture && (
                            <span className="px-1.5 py-0.5 rounded text-[9px] bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 font-bold">
                              {language === 'ar' ? 'انطلاق اليوم' : 'Départ ce jour'}
                            </span>
                          )}

                          {isReturn && (
                            <span className="px-1.5 py-0.5 rounded text-[9px] bg-amber-500/15 text-amber-600 dark:text-amber-400 font-bold">
                              {language === 'ar' ? 'استرجاع اليوم' : 'Retour ce jour'}
                            </span>
                          )}
                        </div>

                        {/* Print Button */}
                        <button
                          onClick={() => setContractToPrint(rental)}
                          className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-neutral-200 dark:bg-neutral-700 hover:bg-neutral-300 dark:hover:bg-neutral-600 text-neutral-800 dark:text-neutral-200 font-bold text-xs cursor-pointer shadow-xs transition-colors"
                          title="Imprimer A4"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>{language === 'ar' ? 'معاينة وطباعة A4' : 'Aperçu A4'}</span>
                        </button>
                      </div>

                      {/* Cars in Contract */}
                      <div className="space-y-1.5">
                        <div className="text-[10px] uppercase font-bold text-neutral-400 font-bukra italic">
                          {carList.length > 1 
                            ? (language === 'ar' ? `السيارات المسجلة في العقد (${carList.length} سيارات):` : `Véhicules du contrat (${carList.length}) :`)
                            : (language === 'ar' ? 'السيارة المؤجرة:' : 'Véhicule :')}
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          {carList.map((c, cIdx) => (
                            <div key={cIdx} className="p-2 rounded-xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 flex items-center gap-2">
                              <Car className="w-4 h-4 text-amber-500 shrink-0" />
                              <div className="truncate">
                                <div className="font-bold text-xs text-neutral-900 dark:text-white truncate">
                                  {c.brand} {c.model}
                                </div>
                                <div className="font-mono text-[10px] text-amber-600 dark:text-amber-400 font-bold">
                                  {c.matricule}
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Customer Details */}
                      <div className="p-2.5 rounded-xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 flex flex-wrap items-center justify-between gap-2 text-xs">
                        <div className="flex items-center gap-2 font-bold text-neutral-900 dark:text-white">
                          <User className="w-3.5 h-3.5 text-neutral-400" />
                          <span>{rental.customerSnapshot?.fullName || 'Client'}</span>
                        </div>
                        <div className="flex items-center gap-2 font-mono text-neutral-600 dark:text-neutral-400">
                          <Phone className="w-3.5 h-3.5 text-neutral-400" />
                          <span>{rental.customerSnapshot?.phone || '0550 00 00 00'}</span>
                        </div>
                      </div>

                      {/* Schedule Timetable */}
                      <div className="text-[11px] font-mono text-neutral-500 flex items-center justify-between">
                        <div className="flex items-center gap-1.5">
                          <Clock className="w-3.5 h-3.5 text-amber-500" />
                          <span>{rental.startDate} ({rental.startTime}) → {rental.expectedEndDate} ({rental.expectedEndTime})</span>
                        </div>
                        <span className="font-bold text-neutral-800 dark:text-neutral-200">
                          {rental.durationDays} {language === 'ar' ? 'يوم' : 'j'}
                        </span>
                      </div>

                      {/* Financials (Sans Caution) */}
                      <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/20 grid grid-cols-3 gap-2 text-xs font-mono">
                        <div>
                          <div className="text-[9px] uppercase text-neutral-500 font-sans font-bold">
                            {language === 'ar' ? 'المجموع' : 'Total'}
                          </div>
                          <div className="font-black text-neutral-900 dark:text-white">
                            {formatDzd(rental.totalRentDzd)}
                          </div>
                        </div>

                        <div>
                          <div className="text-[9px] uppercase text-emerald-600 font-sans font-bold">
                            {language === 'ar' ? 'العربون' : 'Avance'}
                          </div>
                          <div className="font-black text-emerald-600 dark:text-emerald-400">
                            {formatDzd(rental.advancePaymentDzd)}
                          </div>
                        </div>

                        <div>
                          <div className="text-[9px] uppercase text-red-500 font-sans font-bold">
                            {language === 'ar' ? 'المتبقي' : 'Reste'}
                          </div>
                          <div className="font-black text-red-600 dark:text-red-400">
                            {formatDzd(rental.remainingBalanceDzd)}
                          </div>
                        </div>
                      </div>

                      {/* Return Action if Return Day */}
                      {isReturn && (rental.status === 'ACTIVE' || rental.status === 'OVERDUE') && (
                        <button
                          onClick={() => openReturnModal(rental.id)}
                          className="w-full py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs cursor-pointer shadow-sm flex items-center justify-center gap-1.5 font-bukra italic"
                        >
                          <RotateCcw className="w-3.5 h-3.5" />
                          <span>{language === 'ar' ? 'استلام المركبة وتسوية الحساب' : 'Restituer le Véhicule'}</span>
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Column 2: Free & Available Vehicles on this specific date */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-black text-neutral-900 dark:text-white uppercase tracking-wider flex items-center gap-2 font-bukra italic">
                <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                <span>{language === 'ar' ? 'سيارات متاحة وجاهزة للتأجير في هذا التاريخ' : 'Véhicules Disponibles à cette Date'}</span>
              </h4>
              <span className="px-2.5 py-1 rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 font-mono font-bold text-xs">
                {selectedDayAvailableVehicles.length} {language === 'ar' ? 'جاهزة' : 'libre(s)'}
              </span>
            </div>

            {selectedDayAvailableVehicles.length === 0 ? (
              <div className="p-8 text-center bg-red-50 dark:bg-red-950/20 rounded-2xl border border-dashed border-red-200 dark:border-red-800 space-y-2">
                <AlertTriangle className="w-10 h-10 text-red-500/70 mx-auto" />
                <div className="font-bold text-red-700 dark:text-red-300 text-sm">
                  {language === 'ar' ? 'كل أسطول السيارات محجوز بالكامل في هذا التاريخ!' : 'Tout le parc automobile est réservé pour cette date !'}
                </div>
              </div>
            ) : (
              <div className="space-y-2.5 max-h-[520px] overflow-y-auto pe-1">
                {selectedDayAvailableVehicles.map(veh => {
                  const upcomingRes = dbStore.getNextUpcomingReservation(veh.id, selectedDayYMD);
                  const maxDateBeforeRes = upcomingRes ? subtractDaysFromDate(upcomingRes.startDate, 1) : '';
                  const hasGapBeforeRes = upcomingRes && maxDateBeforeRes >= selectedDayYMD;
                  const daysUntil = upcomingRes ? Math.max(0, getDaysDifference(selectedDayYMD, upcomingRes.startDate)) : 0;

                  return (
                    <div
                      key={veh.id}
                      className="p-3.5 rounded-2xl bg-white dark:bg-neutral-800/40 border border-neutral-200 dark:border-neutral-700 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs hover:border-emerald-500/50 transition-colors shadow-xs"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-3 h-3 rounded-full bg-emerald-500 shrink-0" />
                        <div>
                          <div className="font-bold text-neutral-900 dark:text-white font-bukra italic text-sm">
                            {veh.brand} {veh.model}
                          </div>
                          <div className="font-mono text-[11px] text-neutral-500">
                            {veh.matricule} · <strong className="text-amber-500 font-bold">{veh.dailyRate.toLocaleString()} DZD/j</strong>
                          </div>

                          {/* Gap notice if upcoming reservation */}
                          {hasGapBeforeRes && (
                            <div className="mt-1 text-[10px] text-amber-600 dark:text-amber-400 font-semibold flex items-center gap-1.5">
                              <span>📅 حجز قادم: {upcomingRes.startDate} ({daysUntil}j)</span>
                              <span className="bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 px-1.5 py-0.2 rounded font-mono font-bold">
                                شاغرة حتى {maxDateBeforeRes}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5 shrink-0 self-end sm:self-auto">
                        {hasGapBeforeRes ? (
                          <button
                            onClick={() => openNewRentalModal(veh.id, 'RENTAL', selectedDayYMD, maxDateBeforeRes)}
                            className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-400 text-neutral-950 font-black text-xs cursor-pointer shadow-xs font-bukra italic"
                            title={`كراء مؤقت حتى ${maxDateBeforeRes}`}
                          >
                            {language === 'ar' ? `كراء حتى ${maxDateBeforeRes}` : `Louer jusqu'au ${maxDateBeforeRes}`}
                          </button>
                        ) : (
                          <button
                            onClick={() => openNewRentalModal(veh.id, 'RENTAL', selectedDayYMD)}
                            className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs cursor-pointer shadow-xs font-bukra italic"
                          >
                            {language === 'ar' ? 'كراء' : 'Louer'}
                          </button>
                        )}

                        <button
                          onClick={() => openNewRentalModal(veh.id, 'RESERVATION', selectedDayYMD)}
                          className="px-3 py-1.5 rounded-xl bg-purple-600/15 hover:bg-purple-600 text-purple-700 hover:text-white dark:text-purple-300 font-bold text-xs cursor-pointer transition-colors font-bukra italic"
                        >
                          {language === 'ar' ? 'حجز' : 'Réserver'}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

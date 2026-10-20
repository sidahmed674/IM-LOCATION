import React, { useState } from 'react';
import { 
  FileText, Plus, Search, Filter, RotateCcw, 
  Printer, CheckCircle2, AlertTriangle, Eye, Calendar, DollarSign, Key
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { dbStore } from '../../db/store';
import { RentalContract, RentalStatus } from '../../types';
import { getTodayLocalDate, subtractDaysFromDate, getDaysDifference } from '../../utils/dateUtils';

export const RentalsView: React.FC = () => {
  const { 
    t, language, openNewRentalModal, openReturnModal, 
    setContractToPrint 
  } = useApp();

  const rentals = dbStore.getRentals();
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedContractForDetails, setSelectedContractForDetails] = useState<RentalContract | null>(null);

  const todayStr = getTodayLocalDate();

  const filteredRentals = rentals.filter(r => {
    let matchesStatus = statusFilter === 'ALL' || r.status === statusFilter;
    if (statusFilter === 'RESERVED') {
      matchesStatus = r.contractType === 'RESERVATION' || r.status === 'RESERVED';
    }
    const matchesSearch = 
      r.contractNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.customerSnapshot.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.customerSnapshot.phone.includes(searchQuery) ||
      r.vehicleSnapshot.matricule.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.vehicleSnapshot.model.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  const formatDzd = (n: number) => {
    return new Intl.NumberFormat(language === 'ar' ? 'ar-DZ' : 'fr-FR', {
      maximumFractionDigits: 0
    }).format(n) + ' ' + t.currency;
  };

  const getStatusBadge = (status: RentalStatus, contractType?: string) => {
    if (contractType === 'RESERVATION' || status === 'RESERVED') {
      return <span className="text-purple-500 font-semibold">{t.statusReserved}</span>;
    }
    switch (status) {
      case 'ACTIVE':
        return <span className="text-blue-500 font-semibold">{t.statusActive}</span>;
      case 'OVERDUE':
        return <span className="text-red-500 font-semibold">{t.statusOverdue}</span>;
      case 'COMPLETED':
        return <span className="text-emerald-500 font-semibold">{t.statusCompleted}</span>;
      case 'CANCELLED':
        return <span className="text-neutral-500 font-semibold">{t.statusCancelled}</span>;
      default:
        return <span>{status}</span>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-neutral-200 dark:border-neutral-800">
        <div>
          <h2 className="text-xl font-bold font-bukra italic tracking-tight text-neutral-900 dark:text-white">
            {t.navLocationsReservations}
          </h2>
          <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">
            {language === 'ar'
              ? 'سجل عقود الإيجار، تتبع التسليم والاستلام، والتسوية المالية للودائع'
              : 'Journal des contrats de location, suivi des départs/retours et états de caution'}
          </p>
        </div>

        <button
          onClick={() => openNewRentalModal()}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-neutral-950 font-bold text-xs transition-colors shadow-sm cursor-pointer self-start sm:self-auto font-bukra italic"
        >
          <Plus className="w-4 h-4" />
          <span>{t.actionNouveauContrat}</span>
        </button>
      </div>

      {/* Filter Toolbar */}
      <div className="p-3 rounded-xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 flex flex-col md:flex-row items-center justify-between gap-3 shadow-xs">
        <div className="flex items-center gap-1 overflow-x-auto w-full md:w-auto">
          {[
            { id: 'ALL', label: t.all },
            { id: 'ACTIVE', label: t.statusActive },
            { id: 'RESERVED', label: language === 'ar' ? 'حجوزات مسبقة' : 'Réservations' },
            { id: 'OVERDUE', label: t.statusOverdue },
            { id: 'COMPLETED', label: t.statusCompleted },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setStatusFilter(tab.id)}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors cursor-pointer shrink-0 ${
                statusFilter === tab.id
                  ? 'bg-amber-500 text-neutral-950 font-bold shadow-xs'
                  : 'text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder={language === 'ar' ? 'بحث برقم العقد، العميل، أو السيارة...' : 'Rechercher contrat, client ou véhicule...'}
          className="w-full md:w-80 bg-neutral-50 dark:bg-neutral-800/80 border border-neutral-200 dark:border-neutral-700/80 rounded-lg px-3 py-1.5 text-xs text-neutral-900 dark:text-neutral-200 focus:outline-none focus:border-amber-500"
        />
      </div>

      {/* Contracts Table */}
      <div className="rounded-xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          {filteredRentals.length === 0 ? (
            <div className="p-12 text-center text-neutral-400 text-xs">
              {t.noData}
            </div>
          ) : (
            <table className="w-full min-w-[760px] text-xs text-start">
              <thead className="bg-neutral-50 dark:bg-neutral-800/50 text-neutral-500 dark:text-neutral-400 font-medium border-b border-neutral-200 dark:border-neutral-800">
                <tr>
                  <th className="px-4 py-3 text-start">{t.contractNumber}</th>
                  <th className="px-4 py-3 text-start">{t.customer}</th>
                  <th className="px-4 py-3 text-start">{language === 'ar' ? 'المركبة' : 'Véhicule'}</th>
                  <th className="px-4 py-3 text-start">{t.rentalPeriod}</th>
                  <th className="px-4 py-3 text-end">{language === 'ar' ? 'إجمالي الإيجار' : 'Total Loyer'}</th>
                  <th className="px-4 py-3 text-end">{t.advancePayment}</th>
                  <th className="px-4 py-3 text-end">{language === 'ar' ? 'المتبقي للدفع' : 'Reste à Payer'}</th>
                  <th className="px-4 py-3 text-center">{t.status}</th>
                  <th className="px-4 py-3 text-center">{t.actions}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-200 dark:divide-neutral-800 text-neutral-800 dark:text-neutral-200">
                {filteredRentals.map(contract => {
                  const isOverdue = contract.status === 'ACTIVE' && new Date(`${contract.expectedEndDate}T${contract.expectedEndTime}`) < new Date();

                  return (
                    <tr key={contract.id} className="hover:bg-neutral-50/50 dark:hover:bg-neutral-800/30 transition-colors">
                      <td className="px-4 py-3 font-mono font-bold text-amber-600 dark:text-amber-400">
                        {contract.contractNumber}
                      </td>
                      <td className="px-4 py-3">
                        <div className="font-semibold text-neutral-900 dark:text-white">
                          {contract.customerSnapshot.fullName}
                        </div>
                        <div className="font-mono text-[11px] text-neutral-500">
                          {contract.customerSnapshot.phone}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="font-medium">
                          {contract.vehicleSnapshot.brand} {contract.vehicleSnapshot.model}
                        </div>
                        <div className="font-mono text-[11px] text-neutral-500">
                          {contract.vehicleSnapshot.matricule}
                        </div>
                      </td>
                      <td className="px-4 py-3 font-mono tabular-nums">
                        <div>{contract.startDate} → {contract.expectedEndDate}</div>
                        <div className="text-[11px] text-neutral-500">
                          {contract.durationDays} {language === 'ar' ? 'أيام' : 'jours'}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-end font-mono font-semibold tabular-nums">
                        {formatDzd(contract.totalRentDzd)}
                      </td>
                      <td className="px-4 py-3 text-end font-mono tabular-nums text-emerald-500 font-medium">
                        {formatDzd(contract.advancePaymentDzd)}
                      </td>
                      <td className="px-4 py-3 text-end font-mono tabular-nums text-red-500 font-bold">
                        {formatDzd(contract.remainingBalanceDzd)}
                      </td>
                      <td className="px-4 py-3 text-center">
                        {isOverdue ? (
                          <span className="text-red-500 font-bold flex items-center justify-center gap-1">
                            <AlertTriangle className="w-3 h-3" /> {t.statusOverdue}
                          </span>
                        ) : (
                          getStatusBadge(contract.status, contract.contractType)
                        )}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          {/* Quick Rent Car Before Future Reservation Delivery */}
                          {(() => {
                            const isFutureRes = (contract.contractType === 'RESERVATION' || contract.status === 'RESERVED') && contract.startDate > todayStr;
                            if (!isFutureRes) return null;
                            const maxDateBeforeRes = subtractDaysFromDate(contract.startDate, 1);
                            const daysRemaining = Math.max(0, getDaysDifference(todayStr, contract.startDate));
                            if (maxDateBeforeRes < todayStr) return null;

                            return (
                              <button
                                onClick={() => openNewRentalModal(contract.vehicleId, 'RENTAL', todayStr, maxDateBeforeRes)}
                                className="px-2.5 py-1 rounded bg-gradient-to-r from-amber-500 to-yellow-400 hover:from-amber-400 hover:to-yellow-300 text-neutral-950 font-bold text-[11px] transition-all cursor-pointer flex items-center gap-1 shadow-xs font-bukra italic"
                                title={language === 'ar' ? `كراء السيارة في الفترة الشاغرة حتى ${maxDateBeforeRes}` : `Louer avant réservation jusqu'au ${maxDateBeforeRes}`}
                              >
                                <Key className="w-3 h-3" />
                                <span>{language === 'ar' ? `كراء قبل الحجز (${daysRemaining}j)` : `Louer avant`}</span>
                              </button>
                            );
                          })()}

                          {/* If Active -> Show Quick Return Button */}
                          {(contract.status === 'ACTIVE' || contract.status === 'OVERDUE') && (
                            <button
                              onClick={() => openReturnModal(contract.id)}
                              className="px-2.5 py-1 rounded bg-emerald-600 hover:bg-emerald-500 text-white font-medium text-[11px] transition-colors cursor-pointer flex items-center gap-1 shadow-xs"
                              title={t.actionQuickReturn}
                            >
                              <RotateCcw className="w-3 h-3" />
                              <span>{language === 'ar' ? 'استلام' : 'Restitution'}</span>
                            </button>
                          )}

                          {/* Print A4 Contract */}
                          <button
                            onClick={() => setContractToPrint(contract)}
                            className="p-1.5 rounded bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-700 text-neutral-600 dark:text-neutral-300 transition-colors cursor-pointer"
                            title={t.print}
                          >
                            <Printer className="w-3.5 h-3.5" />
                          </button>

                          {/* View Audit Details */}
                          <button
                            onClick={() => setSelectedContractForDetails(contract)}
                            className="p-1.5 rounded bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-700 text-neutral-600 dark:text-neutral-300 transition-colors cursor-pointer"
                            title={t.details}
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Contract Details / Return Audit Modal */}
      {selectedContractForDetails && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="w-full max-w-2xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-2xl p-6 shadow-2xl space-y-4 my-8 text-xs">
            <div className="flex items-center justify-between pb-3 border-b border-neutral-200 dark:border-neutral-800">
              <div className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-amber-500" />
                <h3 className="font-bold text-base text-neutral-900 dark:text-white">
                  {language === 'ar' ? 'تفاصيل العقد والمحضر' : 'Fiche Contrat & PV Restitution'} - {selectedContractForDetails.contractNumber}
                </h3>
              </div>
              <button
                onClick={() => setSelectedContractForDetails(null)}
                className="text-neutral-400 hover:text-white cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 text-neutral-700 dark:text-neutral-300">
              <div className="grid grid-cols-2 gap-3 p-3 rounded-xl bg-neutral-50 dark:bg-neutral-800/50">
                <div>
                  <span className="font-semibold block text-neutral-500">{t.customer}:</span>
                  <span className="font-bold text-neutral-900 dark:text-white">{selectedContractForDetails.customerSnapshot.fullName}</span>
                  <div className="text-[11px] font-mono">{selectedContractForDetails.customerSnapshot.phone} · CIN: {selectedContractForDetails.customerSnapshot.cinOrPassport}</div>
                </div>

                <div>
                  <span className="font-semibold block text-neutral-500">{language === 'ar' ? 'المركبة' : 'Véhicule'}:</span>
                  <span className="font-bold text-neutral-900 dark:text-white">{selectedContractForDetails.vehicleSnapshot.brand} {selectedContractForDetails.vehicleSnapshot.model}</span>
                  <div className="text-[11px] font-mono text-amber-500 font-bold">{selectedContractForDetails.vehicleSnapshot.matricule}</div>
                </div>
              </div>

              {/* Delivery Data */}
              <div className="p-3 rounded-xl bg-neutral-50 dark:bg-neutral-800/50 space-y-1.5">
                <h4 className="font-bold text-neutral-900 dark:text-white">
                  {language === 'ar' ? 'بيانات التسليم (Livraison):' : 'Données de Départ (Livraison) :'}
                </h4>
                <div className="grid grid-cols-3 gap-2 font-mono">
                  <div>{t.initialKm}: <span className="font-bold">{selectedContractForDetails.startKm} KM</span></div>
                  <div>{t.initialFuel}: <span className="font-bold text-amber-500">{selectedContractForDetails.startFuel}</span></div>
                  <div>{language === 'ar' ? 'المتبقي:' : 'Reste:'} <span className="font-bold text-red-500">{formatDzd(selectedContractForDetails.remainingBalanceDzd)}</span></div>
                </div>
              </div>

              {/* If Returned -> Show Return & Settlement Details */}
              {selectedContractForDetails.returnDetails && (
                <div className="p-4 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/60 space-y-2">
                  <h4 className="font-bold text-emerald-900 dark:text-emerald-300 flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4" />
                    <span>{t.returnSettlementTitle}</span>
                  </h4>

                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 font-mono text-[11px]">
                    <div>{t.returnKm}: <span className="font-bold">{selectedContractForDetails.returnDetails.returnKm} KM</span></div>
                    <div>{t.returnFuel}: <span className="font-bold">{selectedContractForDetails.returnDetails.returnFuel}</span></div>
                    <div>{t.excessKm}: <span className="font-bold">{selectedContractForDetails.returnDetails.excessKm} KM</span></div>
                    <div>{t.excessKmFee}: <span className="font-bold">{formatDzd(selectedContractForDetails.returnDetails.excessKmPenaltyDzd)}</span></div>
                    <div>{t.fuelPenalty}: <span className="font-bold">{formatDzd(selectedContractForDetails.returnDetails.fuelPenaltyDzd)}</span></div>
                    <div>{t.damageEstimatedCost}: <span className="font-bold">{formatDzd(selectedContractForDetails.returnDetails.damagePenaltyDzd)}</span></div>
                    <div>{t.cleaningFee}: <span className="font-bold">{formatDzd(selectedContractForDetails.returnDetails.cleaningPenaltyDzd)}</span></div>
                    <div>{t.totalPenalties}: <span className="font-bold text-red-500">{formatDzd(selectedContractForDetails.returnDetails.totalPenaltiesDzd)}</span></div>
                  </div>

                  <div className="pt-2 border-t border-emerald-200 dark:border-emerald-800 flex items-center justify-between font-bold text-sm">
                    <span>{t.cautionRefundAmount}:</span>
                    <span className="font-mono text-emerald-500">
                      {formatDzd(selectedContractForDetails.returnDetails.cautionRefundedDzd)}
                    </span>
                  </div>
                  {selectedContractForDetails.returnDetails.additionalPaidByClientDzd > 0 && (
                    <div className="flex items-center justify-between font-bold text-sm text-red-500">
                      <span>{t.additionalClientPay}:</span>
                      <span className="font-mono">
                        {formatDzd(selectedContractForDetails.returnDetails.additionalPaidByClientDzd)}
                      </span>
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-neutral-200 dark:border-neutral-800">
              <button
                onClick={() => {
                  setContractToPrint(selectedContractForDetails);
                  setSelectedContractForDetails(null);
                }}
                className="px-4 py-2 rounded-lg bg-amber-500 hover:bg-amber-400 text-neutral-950 font-bold flex items-center gap-1.5 cursor-pointer"
              >
                <Printer className="w-4 h-4" />
                <span>{t.print}</span>
              </button>
              <button
                onClick={() => setSelectedContractForDetails(null)}
                className="px-4 py-2 rounded-lg bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 font-semibold cursor-pointer"
              >
                {t.close}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

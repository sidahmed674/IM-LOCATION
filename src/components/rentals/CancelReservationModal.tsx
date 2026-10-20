import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { 
  X, Ban, AlertTriangle, DollarSign, Calendar, 
  Car, User, Phone, CheckCircle2, RotateCcw, ShieldCheck
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { dbStore } from '../../db/store';

export const CancelReservationModal: React.FC = () => {
  const { 
    reservationToCancel, 
    closeCancelReservationModal, 
    language, 
    t, 
    addToast,
    triggerStoreRefresh
  } = useApp();

  const [refundAdvance, setRefundAdvance] = useState(true);
  const [refundAmountDzd, setRefundAmountDzd] = useState(0);
  const [reason, setReason] = useState('طلب من الزبون');
  const [customNote, setCustomNote] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (reservationToCancel) {
      setRefundAdvance(reservationToCancel.advancePaymentDzd > 0);
      setRefundAmountDzd(reservationToCancel.advancePaymentDzd || 0);
      setReason(language === 'ar' ? 'طلب من الزبون' : 'Demande du client');
      setCustomNote('');
      setIsSubmitting(false);
    }
  }, [reservationToCancel, language]);

  if (!reservationToCancel) return null;

  const contract = reservationToCancel;
  const vehicle = contract.vehicleSnapshot;
  const customer = contract.customerSnapshot;

  const quickReasons = language === 'ar' ? [
    'طلب من الزبون',
    'عدم حضور الزبون (No-show)',
    'تغيير موعد الحجز',
    'صيانة أو عطل طارئ بالمركبة',
    'إلغاء باتفاق الطرفين'
  ] : [
    'Demande du client',
    'Client non présenté (No-show)',
    'Changement de dates',
    'Panne / Maintenance véhicule',
    'Accord mutuel'
  ];

  const formatDzd = (n: number) => {
    return new Intl.NumberFormat(language === 'ar' ? 'ar-DZ' : 'fr-FR', {
      maximumFractionDigits: 0
    }).format(n) + ' ' + t.currency;
  };

  const handleConfirmCancel = () => {
    try {
      setIsSubmitting(true);
      const fullReason = customNote ? `${reason} - ${customNote}` : reason;

      dbStore.cancelReservation(contract.id, {
        reason: fullReason,
        refundAdvance: refundAdvance && refundAmountDzd > 0,
        refundAmountDzd: refundAdvance ? Number(refundAmountDzd) : 0,
        recordedBy: 'IM LOCATION POS',
      });

      addToast(
        language === 'ar'
          ? `تم إلغاء الحجز (${contract.contractNumber}) بنجاح وأصبحت المركبة متاحة للكراء فوراً`
          : `Réservation ${contract.contractNumber} annulée avec succès, véhicule disponible`,
        'success'
      );

      triggerStoreRefresh();
      closeCancelReservationModal();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Erreur';
      addToast(msg, 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const modalContent = (
    <div 
      className="fixed inset-0 z-[9999] bg-black/80 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto"
      onClick={(e) => {
        if (e.target === e.currentTarget) closeCancelReservationModal();
      }}
    >
      <div 
        className="w-full max-w-lg bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-3xl p-5 sm:p-6 shadow-2xl space-y-4 my-auto animate-in fade-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-neutral-200 dark:border-neutral-800">
          <div className="flex items-center gap-2.5">
            <div className="p-2.5 rounded-2xl bg-red-500/10 text-red-500">
              <Ban className="w-5 h-5 stroke-[2.5]" />
            </div>
            <div>
              <h3 className="font-extrabold text-base text-neutral-900 dark:text-white font-bukra italic">
                {language === 'ar' ? 'إلغاء حجز مسبق' : 'Annuler la Réservation'}
              </h3>
              <p className="text-xs font-mono text-neutral-500">
                {contract.contractNumber}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={closeCancelReservationModal}
            className="p-1.5 rounded-xl text-neutral-400 hover:text-neutral-700 dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Vehicle & Customer Summary */}
        <div className="p-3.5 rounded-2xl bg-neutral-50 dark:bg-neutral-800/60 border border-neutral-200 dark:border-neutral-700 space-y-2 text-xs">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 font-bold text-neutral-900 dark:text-white">
              <Car className="w-4 h-4 text-amber-500" />
              <span>{vehicle.brand} {vehicle.model}</span>
            </div>
            <span className="font-mono font-bold text-amber-600 dark:text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/30">
              {vehicle.matricule}
            </span>
          </div>

          <div className="flex items-center justify-between text-neutral-600 dark:text-neutral-300 pt-1 border-t border-neutral-200/60 dark:border-neutral-700/60">
            <div className="flex items-center gap-1.5 font-medium">
              <User className="w-3.5 h-3.5 text-neutral-400" />
              <span>{customer.fullName}</span>
            </div>
            <div className="flex items-center gap-1 font-mono text-neutral-500">
              <Phone className="w-3.5 h-3.5 text-neutral-400" />
              <span>{customer.phone}</span>
            </div>
          </div>

          <div className="flex items-center justify-between text-neutral-500 dark:text-neutral-400 font-mono text-[11px] pt-1">
            <span className="flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5 text-neutral-400" />
              <span>{contract.startDate} → {contract.expectedEndDate}</span>
            </span>
            <span className="font-bold text-neutral-800 dark:text-neutral-200">
              {contract.durationDays} {language === 'ar' ? 'أيام' : 'j'}
            </span>
          </div>
        </div>

        {/* Advance Payment & Refund Settlement Section */}
        {contract.advancePaymentDzd > 0 ? (
          <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-neutral-800 dark:text-neutral-200 flex items-center gap-1.5 font-bukra italic">
                <DollarSign className="w-4 h-4 text-amber-500" />
                <span>{language === 'ar' ? 'العربون المقبوض عند الحجز:' : 'Acompte versé à la réservation :'}</span>
              </span>
              <span className="text-sm font-mono font-black text-amber-600 dark:text-amber-400">
                {formatDzd(contract.advancePaymentDzd)}
              </span>
            </div>

            <div className="space-y-2 text-xs">
              <label className="block text-neutral-700 dark:text-neutral-300 font-semibold">
                {language === 'ar' ? 'تسوية العربون مع الزبون:' : 'Traitement de l\'acompte :'}
              </label>

              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setRefundAdvance(true);
                    setRefundAmountDzd(contract.advancePaymentDzd);
                  }}
                  className={`p-2.5 rounded-xl border text-start transition-all cursor-pointer ${
                    refundAdvance
                      ? 'bg-emerald-500/15 border-emerald-500 text-emerald-800 dark:text-emerald-300 font-bold'
                      : 'bg-white dark:bg-neutral-800 border-neutral-200 dark:border-neutral-700 text-neutral-600 dark:text-neutral-400'
                  }`}
                >
                  <div className="flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                    <span>{language === 'ar' ? 'استرجاع العربون' : 'Rembourser l\'acompte'}</span>
                  </div>
                  <div className="text-[10px] text-neutral-500 mt-1">
                    {language === 'ar' ? 'إعادة المبلغ للزبون نقداً' : 'Restitution en espèces'}
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setRefundAdvance(false);
                    setRefundAmountDzd(0);
                  }}
                  className={`p-2.5 rounded-xl border text-start transition-all cursor-pointer ${
                    !refundAdvance
                      ? 'bg-red-500/15 border-red-500 text-red-800 dark:text-red-300 font-bold'
                      : 'bg-white dark:bg-neutral-800 border-neutral-200 dark:border-neutral-700 text-neutral-600 dark:text-neutral-400'
                  }`}
                >
                  <div className="flex items-center gap-1.5">
                    <Ban className="w-3.5 h-3.5 text-red-500 shrink-0" />
                    <span>{language === 'ar' ? 'غير مسترد (تعويض)' : 'Non remboursable'}</span>
                  </div>
                  <div className="text-[10px] text-neutral-500 mt-1">
                    {language === 'ar' ? 'احتفاظ بالعربون للوكالة' : 'Conservé par l\'agence'}
                  </div>
                </button>
              </div>

              {refundAdvance && (
                <div className="pt-2 space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-neutral-600 dark:text-neutral-400">
                      {language === 'ar' ? 'المبلغ المسترجع للزبون (DZD):' : 'Montant remboursé (DZD) :'}
                    </span>
                    <button
                      type="button"
                      onClick={() => setRefundAmountDzd(contract.advancePaymentDzd)}
                      className="text-[10px] text-amber-500 hover:underline cursor-pointer"
                    >
                      {language === 'ar' ? 'المبلغ كاملاً' : 'Totalité'}
                    </button>
                  </div>
                  <input
                    type="number"
                    min="0"
                    max={contract.advancePaymentDzd}
                    step="500"
                    value={refundAmountDzd}
                    onChange={(e) => setRefundAmountDzd(Math.min(contract.advancePaymentDzd, Math.max(0, Number(e.target.value))))}
                    className="w-full bg-white dark:bg-neutral-900 border border-neutral-300 dark:border-neutral-700 rounded-xl p-2 font-mono font-bold text-neutral-900 dark:text-white"
                  />
                  <p className="text-[10px] text-neutral-500">
                    {language === 'ar'
                      ? '💡 سيتم تسجيل حركة صرف نقدي من الصندوق لتوثيق خروج المبلغ في إقفال اليومية.'
                      : '💡 Une sortie de caisse sera enregistrée pour la clôture financière.'}
                  </p>
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="p-3 rounded-2xl bg-neutral-100 dark:bg-neutral-800/50 border border-neutral-200 dark:border-neutral-700 text-xs text-neutral-600 dark:text-neutral-400 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
            <span>{language === 'ar' ? 'لا يوجد عربون مسجل على هذا الحجز (0 دج)' : 'Aucun acompte versé sur cette réservation (0 DZD)'}</span>
          </div>
        )}

        {/* Cancellation Reason */}
        <div className="space-y-2 text-xs">
          <label className="block text-neutral-700 dark:text-neutral-300 font-semibold">
            {language === 'ar' ? 'سبب إلغاء الحجز:' : 'Motif de l\'annulation :'}
          </label>

          {/* Quick reason chips */}
          <div className="flex flex-wrap gap-1.5">
            {quickReasons.map((r, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => setReason(r)}
                className={`px-2.5 py-1 rounded-lg text-xs transition-colors cursor-pointer ${
                  reason === r
                    ? 'bg-amber-500 text-neutral-950 font-bold'
                    : 'bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-700 text-neutral-700 dark:text-neutral-300'
                }`}
              >
                {r}
              </button>
            ))}
          </div>

          <input
            type="text"
            placeholder={language === 'ar' ? 'ملاحظة إضافية اختيارية حول الإلغاء...' : 'Remarque additionnelle (optionnelle)...'}
            value={customNote}
            onChange={(e) => setCustomNote(e.target.value)}
            className="w-full bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl p-2 text-neutral-900 dark:text-white text-xs"
          />
        </div>

        {/* Immediate Availability Notice */}
        <div className="p-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-xs text-emerald-800 dark:text-emerald-300 flex items-start gap-2 font-medium">
          <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
          <span>
            {language === 'ar'
              ? 'بمجرد التأكيد، ستعود السيارة فوراً للحالة المتاحة (AVAILABLE) ليتمكن أي زبون آخر من كرائها فوراً دون قيود.'
              : 'Dès confirmation, le véhicule redeviendra immédiatement libre (AVAILABLE) pour toute nouvelle location.'}
          </span>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-end gap-2 pt-3 border-t border-neutral-200 dark:border-neutral-800">
          <button
            type="button"
            onClick={closeCancelReservationModal}
            disabled={isSubmitting}
            className="px-4 py-2 rounded-xl bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-700 text-neutral-700 dark:text-neutral-300 font-semibold text-xs cursor-pointer transition-colors"
          >
            {t.cancel}
          </button>

          <button
            type="button"
            onClick={handleConfirmCancel}
            disabled={isSubmitting}
            className="px-5 py-2 rounded-xl bg-red-600 hover:bg-red-500 text-white font-bold text-xs flex items-center gap-1.5 shadow-md shadow-red-600/20 cursor-pointer transition-all font-bukra italic"
          >
            <Ban className="w-3.5 h-3.5 stroke-[2.5]" />
            <span>{language === 'ar' ? 'تأكيد إلغاء الحجز' : 'Confirmer l\'annulation'}</span>
          </button>
        </div>
      </div>
    </div>
  );

  return typeof document !== 'undefined' ? createPortal(modalContent, document.body) : modalContent;
};

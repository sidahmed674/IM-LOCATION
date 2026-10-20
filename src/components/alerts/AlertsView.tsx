import React from 'react';
import { 
  Bell, AlertTriangle, AlertCircle, Shield, 
  Calendar, Car, User, Clock, CheckCircle2
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { dbStore } from '../../db/store';

export const AlertsView: React.FC = () => {
  const { t, language, setActiveTab, openReturnModal } = useApp();
  const alerts = dbStore.getSmartAlerts();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-neutral-200 dark:border-neutral-800">
        <div>
          <h2 className="text-xl font-bold font-bukra italic tracking-tight text-neutral-900 dark:text-white">
            {t.alertsCount}
          </h2>
          <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">
            {language === 'ar'
              ? 'نظام التنبيهات الذكي: تنبيهات قبل 7 أيام من انتهاء الوثائق وتأخر إرجاع السيارات'
              : 'Système d’alertes intelligentes : Préavis de 7 jours (Documents, Permis, Vidanges et Retards)'}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="px-3 py-1 rounded-full bg-amber-500/20 text-amber-500 font-mono text-xs font-bold">
            {alerts.length} {language === 'ar' ? 'تنبيهات قائمة' : 'alertes en cours'}
          </span>
        </div>
      </div>

      {alerts.length === 0 ? (
        <div className="p-16 rounded-xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 text-center space-y-3">
          <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto" />
          <h3 className="font-bold text-base text-neutral-900 dark:text-white">
            {language === 'ar' ? 'جميع الوثائق والعقود في حالة سليمة!' : 'Toutes les formalités administratives sont à jour !'}
          </h3>
          <p className="text-xs text-neutral-500 max-w-md mx-auto">
            {language === 'ar'
              ? 'لا توجد أي وثائق منتهية أو قريبة الانتهاء، ولا توجد سيارات متأخرة في الإرجاع حالياً.'
              : 'Aucun document n’expire sous 7 jours et aucune voiture n’est en retard.'}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {alerts.map(alert => {
            const isCritical = alert.severity === 'CRITICAL';

            return (
              <div
                key={alert.id}
                className={`p-4 rounded-xl border shadow-xs transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
                  isCritical
                    ? 'bg-red-50/60 dark:bg-red-950/20 border-red-200 dark:border-red-900/60'
                    : 'bg-amber-50/60 dark:bg-amber-950/20 border-amber-200 dark:border-amber-900/60'
                }`}
              >
                <div className="flex items-start gap-3">
                  <div
                    className={`p-2.5 rounded-lg shrink-0 ${
                      isCritical
                        ? 'bg-red-500 text-white'
                        : 'bg-amber-500 text-neutral-950'
                    }`}
                  >
                    {alert.type === 'RETURN_OVERDUE' ? (
                      <Clock className="w-5 h-5" />
                    ) : alert.type === 'DRIVING_LICENSE_EXPIRING' ? (
                      <User className="w-5 h-5" />
                    ) : (
                      <Shield className="w-5 h-5" />
                    )}
                  </div>

                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="font-bold text-sm text-neutral-900 dark:text-white">
                        {alert.title}
                      </h4>
                      {alert.daysRemaining !== undefined && (
                        <span className="font-mono text-[11px] font-semibold text-amber-600 dark:text-amber-400">
                          {alert.daysRemaining < 0 
                            ? `(${Math.abs(alert.daysRemaining)}j ${language === 'ar' ? 'تأخر' : 'retard'})`
                            : `(${alert.daysRemaining}j ${language === 'ar' ? 'متبقية' : 'restants'})`}
                        </span>
                      )}
                    </div>

                    <p className="text-xs text-neutral-600 dark:text-neutral-400 mt-1">
                      {alert.description}
                    </p>

                    <div className="flex items-center gap-3 text-[11px] text-neutral-500 mt-2 font-mono">
                      <span>Échéance: {alert.dueDate}</span>
                      <span>·</span>
                      <span>Cible: {alert.targetMatriculeOrName}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  {alert.type === 'RETURN_OVERDUE' && (
                    <button
                      onClick={() => openReturnModal(alert.targetId)}
                      className="px-3.5 py-1.5 rounded-lg bg-red-600 hover:bg-red-500 text-white font-bold text-xs cursor-pointer shadow-xs"
                    >
                      {language === 'ar' ? 'استلام فوري للسيارة' : 'Réceptionner véhicule'}
                    </button>
                  )}

                  {alert.type.includes('EXPIRING') && alert.type.startsWith('INSURANCE') && (
                    <button
                      onClick={() => setActiveTab('fleet')}
                      className="px-3.5 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-neutral-950 font-bold text-xs cursor-pointer shadow-xs"
                    >
                      {language === 'ar' ? 'تحديث التأمين في الأسطول' : 'Gérer dans le parc'}
                    </button>
                  )}

                  {alert.type === 'DRIVING_LICENSE_EXPIRING' && (
                    <button
                      onClick={() => setActiveTab('customers')}
                      className="px-3.5 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-neutral-950 font-bold text-xs cursor-pointer shadow-xs"
                    >
                      {language === 'ar' ? 'تحديث ملف العميل' : 'Fiche client'}
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

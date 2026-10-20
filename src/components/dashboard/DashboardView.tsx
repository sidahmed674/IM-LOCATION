import React from 'react';
import { 
  Car, AlertTriangle, TrendingUp, Key,
  Calendar, ArrowUpRight, Plus, RotateCcw,
  CheckCircle2, Printer, Users, FileText
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { dbStore } from '../../db/store';
import { getTodayLocalDate, subtractDaysFromDate, getDaysDifference } from '../../utils/dateUtils';

export const DashboardView: React.FC = () => {
  const { 
    t, language, setActiveTab, 
    openNewRentalModal, openReturnModal, 
    setContractToPrint, alerts, triggerStoreRefresh, addToast 
  } = useApp();

  const vehicles = dbStore.getVehicles();
  const customers = dbStore.getCustomers();
  const rentals = dbStore.getRentals();
  const finance = dbStore.getFinancialSummary();

  const todayStr = getTodayLocalDate();
  const availableVehicles = vehicles.filter(v => v.status === 'AVAILABLE');
  const rentedVehicles = vehicles.filter(v => v.status === 'RENTED');
  const maintVehicles = vehicles.filter(v => v.status === 'MAINTENANCE');
  const activeRentals = rentals.filter(r => r.status === 'ACTIVE' || r.status === 'OVERDUE');
  const upcomingReservations = rentals.filter(r => 
    (r.contractType === 'RESERVATION' || r.status === 'RESERVED') && 
    r.startDate > todayStr && 
    r.status !== 'CANCELLED'
  );
  const totalRemainingBalances = rentals
    .filter(r => r.status === 'ACTIVE' || r.status === 'OVERDUE' || r.status === 'RESERVED')
    .reduce((sum, r) => sum + (r.remainingBalanceDzd || 0), 0);

  const formatDzd = (val: number) => {
    return new Intl.NumberFormat(language === 'ar' ? 'ar-DZ' : 'fr-FR', {
      maximumFractionDigits: 0,
    }).format(val) + ' ' + t.currency;
  };

  return (
    <div className="space-y-6">
      {/* Welcome & Quick Action Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-neutral-200 dark:border-neutral-800">
        <div>
          <h2 className="text-xl font-bold font-bukra italic tracking-tight text-neutral-900 dark:text-white">
            {t.navDashboard}
          </h2>
          <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">
            {t.appSubname}
          </p>
        </div>

        {/* Top Highlighted Action Buttons */}
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => openNewRentalModal()}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 via-amber-400 to-yellow-400 hover:from-amber-400 hover:to-yellow-300 text-neutral-950 font-black text-xs sm:text-sm transition-all shadow-md shadow-amber-500/20 cursor-pointer font-bukra italic"
          >
            <Plus className="w-4 h-4 stroke-[3]" />
            <span>{t.actionNouveauContrat}</span>
          </button>

          <button
            onClick={() => openReturnModal()}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-700 text-neutral-800 dark:text-neutral-200 border border-neutral-300 dark:border-neutral-700 text-xs font-semibold transition-colors cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5 text-emerald-500" />
            <span>{t.actionQuickReturn}</span>
          </button>
        </div>
      </div>

      {/* When Database is 100% Empty -> Show Vibrant Quick Start Onboarding Card */}
      {vehicles.length === 0 && customers.length === 0 && (
        <div className="p-6 rounded-3xl bg-gradient-to-br from-amber-500/15 via-amber-500/5 to-transparent border border-amber-500/30 space-y-4">
          <div className="flex items-start justify-between gap-4">
            <div className="space-y-1">
              <span className="px-2.5 py-1 rounded-full bg-amber-500/20 text-amber-500 font-bold text-[10px] font-bukra italic">
                {language === 'ar' ? 'البداية السريعة' : 'Démarrage Rapide'}
              </span>
              <h3 className="text-base font-bold font-bukra italic text-neutral-900 dark:text-white">
                {language === 'ar' ? 'مرحباً بك في IM LOCATION! النظام جاهز ونظيف لبدء الاستخدام' : 'Bienvenue sur IM LOCATION ! Votre système est prêt et vierge.'}
              </h3>
              <p className="text-xs text-neutral-600 dark:text-neutral-400 max-w-2xl">
                {language === 'ar' 
                  ? 'تم تهيئة قاعدة البيانات وهي جاهزة تماماً لإدخال أسطول المركبات والعملاء وبدء تحرير العقود فوراً عبر الأزرار السريعة أدناه.'
                  : 'La base de données est vierge et prête. Enregistrez vos véhicules, vos clients ou créez votre premier contrat ci-dessous.'}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
            <button
              onClick={() => setActiveTab('fleet')}
              className="p-3.5 rounded-xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 hover:border-amber-400 text-start flex items-center gap-3 transition-colors cursor-pointer group"
            >
              <div className="p-2 rounded-lg bg-amber-500 text-neutral-950">
                <Car className="w-4 h-4" />
              </div>
              <div>
                <div className="font-bold text-xs text-neutral-900 dark:text-white group-hover:text-amber-500">
                  {t.actionAddVehicle}
                </div>
                <div className="text-[10px] text-neutral-500">
                  {language === 'ar' ? 'تسجيل رقم اللوحة والوثائق' : 'Matricule, tarifs & documents'}
                </div>
              </div>
            </button>

            <button
              onClick={() => setActiveTab('customers')}
              className="p-3.5 rounded-xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 hover:border-blue-400 text-start flex items-center gap-3 transition-colors cursor-pointer group"
            >
              <div className="p-2 rounded-lg bg-blue-600 text-white">
                <Users className="w-4 h-4" />
              </div>
              <div>
                <div className="font-bold text-xs text-neutral-900 dark:text-white group-hover:text-blue-500">
                  {t.actionAddCustomer}
                </div>
                <div className="text-[10px] text-neutral-500">
                  {language === 'ar' ? 'بطاقة التعريف ورخصة السياقة' : 'CIN, permis & téléphone'}
                </div>
              </div>
            </button>

            <button
              onClick={() => openNewRentalModal()}
              className="p-3.5 rounded-xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 hover:border-emerald-400 text-start flex items-center gap-3 transition-colors cursor-pointer group"
            >
              <div className="p-2 rounded-lg bg-emerald-600 text-white">
                <FileText className="w-4 h-4" />
              </div>
              <div>
                <div className="font-bold text-xs text-neutral-900 dark:text-white group-hover:text-emerald-500">
                  {t.actionNouveauContrat}
                </div>
                <div className="text-[10px] text-neutral-500">
                  {language === 'ar' ? 'تسليم فوري للمركبة وعقد A4' : 'Création de contrat'}
                </div>
              </div>
            </button>
          </div>
        </div>
      )}

      {/* Real-time KPI Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* KPI 1: Fleet Availability */}
        <div className="p-4 rounded-2xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 shadow-xs">
          <div className="flex items-center justify-between text-neutral-500 dark:text-neutral-400 text-xs font-bukra italic">
            <span>{language === 'ar' ? 'الأسطول المتاح للكرية' : 'Véhicules Disponibles'}</span>
            <Car className="w-5 h-5 text-amber-500" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-3xl sm:text-4xl font-black font-mono tabular-nums text-neutral-900 dark:text-white">
              {availableVehicles.length}
            </span>
            <span className="text-xs text-neutral-500 font-mono">
              / {vehicles.length} {language === 'ar' ? 'سيارة' : 'au total'}
            </span>
          </div>
          <div className="mt-3 flex items-center gap-2 text-xs text-neutral-500 dark:text-neutral-400">
            <span className="text-blue-500 font-bold font-mono">{rentedVehicles.length} {t.statusRented}</span>
            <span>·</span>
            <span className="text-amber-500 font-bold font-mono">{maintVehicles.length} {t.statusMaintenance}</span>
          </div>
        </div>

        {/* KPI 2: Active Rentals */}
        <div className="p-4 rounded-2xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 shadow-xs">
          <div className="flex items-center justify-between text-neutral-500 dark:text-neutral-400 text-xs font-bukra italic">
            <span>{language === 'ar' ? 'عقود الإيجار الجارية' : 'Contrats en Cours'}</span>
            <Key className="w-5 h-5 text-blue-500" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-3xl sm:text-4xl font-black font-mono tabular-nums text-neutral-900 dark:text-white">
              {activeRentals.length}
            </span>
            <span className="text-xs text-emerald-500 flex items-center font-bold">
              <ArrowUpRight className="w-4 h-4 inline" /> {rentals.length} {language === 'ar' ? 'إجمالي العقود' : 'au total'}
            </span>
          </div>
          <div className="mt-3 text-xs text-neutral-500 dark:text-neutral-400">
            {language === 'ar' ? 'سيارات مسلّمة حالياً مع الزبائن' : 'Véhicules actuellement sur la route'}
          </div>
        </div>

        {/* KPI 3: Monthly Revenue */}
        <div className="p-4 rounded-2xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 shadow-xs">
          <div className="flex items-center justify-between text-neutral-500 dark:text-neutral-400 text-xs font-bukra italic">
            <span>{t.monthlyRevenue}</span>
            <TrendingUp className="w-5 h-5 text-emerald-500" />
          </div>
          <div className="mt-2">
            <span className="text-2xl sm:text-3xl font-black font-mono tabular-nums text-neutral-900 dark:text-white">
              {formatDzd(finance.totalIncome)}
            </span>
          </div>
          <div className="mt-3 text-xs text-neutral-500 dark:text-neutral-400">
            {language === 'ar' ? 'صافي الدخل التشغيلي المحصل' : 'Chiffre d’affaires encaissé'}
          </div>
        </div>

        {/* KPI 4: Remaining Balances from Clients (Sans Caution) */}
        <div className="p-4 rounded-2xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 shadow-xs">
          <div className="flex items-center justify-between text-neutral-500 dark:text-neutral-400 text-xs font-bukra italic">
            <span>{language === 'ar' ? 'مستحقات ومتبقيات الزبائن' : 'Reste à Recouvrer'}</span>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-red-500/10 text-red-500 border border-red-500/20 font-bold">
              {language === 'ar' ? 'متبقي' : 'Créances'}
            </span>
          </div>
          <div className="mt-2">
            <span className="text-2xl sm:text-3xl font-black font-mono tabular-nums text-red-600 dark:text-red-400">
              {formatDzd(totalRemainingBalances)}
            </span>
          </div>
          <div className="mt-3 text-xs text-neutral-400 dark:text-neutral-500 leading-tight">
            {language === 'ar'
              ? 'مبالغ متبقية تستوفى عند استرجاع المركبة'
              : 'Soldes restants à encaisser lors des restitutions'}
          </div>
        </div>
      </div>

      {/* Critical 7-Day Alerts Notification Banner */}
      {alerts.length > 0 && (
        <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/60">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2 text-amber-900 dark:text-amber-300 font-semibold text-xs font-bukra italic">
              <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400" />
              <span>{t.alertsCount} ({alerts.length}) — {t.alertDocNotice}</span>
            </div>
            <button
              onClick={() => setActiveTab('fleet')}
              className="text-xs text-amber-700 dark:text-amber-400 hover:underline font-medium cursor-pointer"
            >
              {language === 'ar' ? 'عرض في الأسطول ←' : 'Vérifier dans le parc →'}
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
            {alerts.slice(0, 3).map(a => (
              <div 
                key={a.id} 
                className="p-2.5 rounded-xl bg-white dark:bg-neutral-900 border border-amber-200/80 dark:border-amber-900/40 text-xs"
              >
                <div className="font-semibold text-neutral-900 dark:text-white truncate">
                  {a.title}
                </div>
                <div className="text-[11px] text-neutral-600 dark:text-neutral-400 mt-1 line-clamp-1">
                  {a.description}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Upcoming Future Reservations (Cars Are Available to Rent Before Delivery!) */}
      {upcomingReservations.length > 0 && (
        <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-purple-500/10 via-amber-500/10 to-transparent border border-purple-500/30 dark:border-purple-500/20 space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-purple-500/20">
            <div className="flex items-center gap-2">
              <Calendar className="w-5 h-5 text-purple-500" />
              <h3 className="font-bold text-sm text-neutral-900 dark:text-white font-bukra italic">
                {language === 'ar' ? 'حجوزات مسبقة قادمة (السيارات شاغرة ومتاحة للكراء الآن حتى موعد التسليم)' : 'Réservations futures (Véhicules disponibles à la location avant livraison)'}
              </h3>
            </div>
            <span className="px-2.5 py-0.5 rounded-full bg-purple-500/20 text-purple-600 dark:text-purple-400 font-mono font-bold text-xs self-start sm:self-auto">
              {upcomingReservations.length} {language === 'ar' ? 'حجز مستقبلي' : 'réservation(s)'}
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {upcomingReservations.map(res => {
              const maxDateBeforeRes = subtractDaysFromDate(res.startDate, 1);
              const daysRemaining = Math.max(0, getDaysDifference(todayStr, res.startDate));
              const canRentGap = maxDateBeforeRes >= todayStr;

              return (
                <div
                  key={res.id}
                  className="p-3.5 rounded-xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 shadow-xs flex flex-col justify-between space-y-2.5 hover:border-amber-400 transition-colors"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="font-bold text-xs text-neutral-900 dark:text-white font-bukra italic">
                        {res.vehicleSnapshot?.brand} {res.vehicleSnapshot?.model}
                      </div>
                      <div className="font-mono text-[10px] text-neutral-500">
                        {res.vehicleSnapshot?.matricule}
                      </div>
                    </div>
                    <span className="px-2 py-0.5 rounded text-[10px] bg-purple-500/15 text-purple-600 dark:text-purple-400 font-bold font-mono">
                      {daysRemaining} {language === 'ar' ? 'يوم متبقي' : 'j restants'}
                    </span>
                  </div>

                  <div className="text-[11px] space-y-1 bg-neutral-50 dark:bg-neutral-800/40 p-2 rounded-lg">
                    <div className="flex justify-between text-neutral-600 dark:text-neutral-400">
                      <span>{language === 'ar' ? 'تاريخ الحجز:' : 'Date réservation:'}</span>
                      <span className="font-mono font-bold text-neutral-900 dark:text-white">{res.startDate}</span>
                    </div>
                    <div className="flex justify-between text-neutral-600 dark:text-neutral-400">
                      <span>{language === 'ar' ? 'الزبون الحائز:' : 'Client:'}</span>
                      <span className="font-semibold text-neutral-800 dark:text-neutral-200 truncate max-w-[120px]">{res.customerSnapshot?.fullName}</span>
                    </div>
                    <div className="flex justify-between text-emerald-600 dark:text-emerald-400 font-bold border-t border-neutral-200/60 dark:border-neutral-700/60 pt-1">
                      <span>{language === 'ar' ? 'متاحة تماماً حتى:' : 'Libre jusqu\'au:'}</span>
                      <span className="font-mono">{maxDateBeforeRes}</span>
                    </div>
                  </div>

                  {canRentGap && (
                    <button
                      onClick={() => openNewRentalModal(res.vehicleId, 'RENTAL', todayStr, maxDateBeforeRes)}
                      className="w-full py-1.5 px-3 rounded-lg bg-gradient-to-r from-amber-500 via-amber-400 to-yellow-400 hover:from-amber-400 hover:to-yellow-300 text-neutral-950 font-black text-xs flex items-center justify-center gap-1.5 cursor-pointer shadow-xs font-bukra italic"
                    >
                      <Key className="w-3.5 h-3.5" />
                      <span>{language === 'ar' ? `تأجير السيارة حتى ${maxDateBeforeRes}` : `Louer jusqu'au ${maxDateBeforeRes}`}</span>
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Active Rentals Table */}
      <div className="rounded-2xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 shadow-xs overflow-hidden">
        <div className="p-4 border-b border-neutral-200 dark:border-neutral-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-amber-500" />
            <h3 className="font-bold text-sm text-neutral-900 dark:text-white font-bukra italic">
              {language === 'ar' ? 'عقود الإيجار النشطة حالياً' : 'Contrats de Location en Cours'}
            </h3>
          </div>
          <button
            onClick={() => setActiveTab('rentals')}
            className="text-xs text-amber-600 dark:text-amber-400 hover:underline cursor-pointer font-medium"
          >
            {language === 'ar' ? 'عرض كل العقود' : 'Voir tous les contrats'}
          </button>
        </div>

        <div className="overflow-x-auto">
          {activeRentals.length === 0 ? (
            <div className="p-8 text-center text-neutral-400 text-xs">
              {language === 'ar' ? 'لا توجد سيارات مؤجرة حالياً في هذا الوقت.' : 'Aucune location en cours pour le moment.'}
            </div>
          ) : (
            <table className="w-full text-xs text-start">
              <thead className="bg-neutral-50 dark:bg-neutral-800/50 text-neutral-500 dark:text-neutral-400 font-medium border-b border-neutral-200 dark:border-neutral-800">
                <tr>
                  <th className="px-4 py-2.5 text-start">{t.contractNumber}</th>
                  <th className="px-4 py-2.5 text-start">{t.customer}</th>
                  <th className="px-4 py-2.5 text-start">{language === 'ar' ? 'السيارة واللوحة' : 'Véhicule & Matricule'}</th>
                  <th className="px-4 py-2.5 text-start">{language === 'ar' ? 'تاريخ الإرجاع' : 'Retour prévu'}</th>
                  <th className="px-4 py-2.5 text-end">{t.remainingBalance}</th>
                  <th className="px-4 py-2.5 text-center">{t.actions}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-200 dark:divide-neutral-800 text-neutral-800 dark:text-neutral-200">
                {activeRentals.map(rental => {
                  const isOverdue = new Date(`${rental.expectedEndDate}T${rental.expectedEndTime}`) < new Date();
                  return (
                    <tr key={rental.id} className="hover:bg-neutral-50/50 dark:hover:bg-neutral-800/30 transition-colors">
                      <td className="px-4 py-3 font-mono font-semibold text-amber-600 dark:text-amber-400">
                        {rental.contractNumber}
                      </td>
                      <td className="px-4 py-3">
                        <div className="font-medium text-neutral-900 dark:text-white">
                          {rental.customerSnapshot.fullName}
                        </div>
                        <div className="text-[11px] text-neutral-500 font-mono">
                          {rental.customerSnapshot.phone}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="font-medium">
                          {rental.vehicleSnapshot.brand} {rental.vehicleSnapshot.model}
                        </div>
                        <div className="font-mono text-[11px] text-neutral-500">
                          {rental.vehicleSnapshot.matricule}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="font-mono tabular-nums">
                          {rental.expectedEndDate} · {rental.expectedEndTime}
                        </div>
                        {isOverdue && (
                          <span className="text-[10px] text-red-500 font-semibold flex items-center gap-1 mt-0.5">
                            <AlertTriangle className="w-3 h-3" /> {t.statusOverdue}
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-end font-mono font-semibold tabular-nums">
                        {formatDzd(rental.remainingBalanceDzd)}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            onClick={() => openReturnModal(rental.id)}
                            className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-medium text-[11px] transition-colors cursor-pointer flex items-center gap-1"
                            title={t.actionQuickReturn}
                          >
                            <RotateCcw className="w-3 h-3" />
                            <span>{language === 'ar' ? 'استلام' : 'Retour'}</span>
                          </button>
                          <button
                            onClick={() => setContractToPrint(rental)}
                            className="p-1 rounded-lg bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-700 text-neutral-600 dark:text-neutral-300 transition-colors cursor-pointer"
                            title={t.print}
                          >
                            <Printer className="w-3.5 h-3.5" />
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
    </div>
  );
};

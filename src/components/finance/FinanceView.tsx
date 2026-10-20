import React, { useState } from 'react';
import { 
  Wallet, TrendingUp, TrendingDown, Shield, 
  Plus, Calendar, DollarSign, X, CheckCircle2,
  Receipt, ArrowUpRight, ArrowDownLeft, Filter, Printer, FileText, Check, Copy
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { dbStore } from '../../db/store';
import { FinancialTransaction } from '../../types';
import { printElement } from '../../utils/printPdf';

export const FinanceView: React.FC = () => {
  const { t, language, addToast } = useApp();
  const summary = dbStore.getFinancialSummary();
  const transactions = dbStore.getTransactions();
  const vehicles = dbStore.getVehicles();
  const rentals = dbStore.getRentals();
  const settings = dbStore.getSettings();

  const [isExpenseModalOpen, setIsExpenseModalOpen] = useState(false);
  const [isClotureModalOpen, setIsClotureModalOpen] = useState(false);
  const [clotureFormat, setClotureFormat] = useState<'TICKET_80MM' | 'RAPPORT_A4'>('TICKET_80MM');

  // Filters: Period
  const [periodFilter, setPeriodFilter] = useState<'TODAY' | 'WEEK' | 'MONTH' | 'ALL'>('ALL');
  const [typeFilter, setTypeFilter] = useState<'ALL' | 'INCOME' | 'EXPENSE'>('ALL');

  // New Expense form
  const [expenseType, setExpenseType] = useState<FinancialTransaction['type']>('EXPENSE_MAINTENANCE');
  const [expenseAmount, setExpenseAmount] = useState<number>(5000);
  const [expenseDescription, setExpenseDescription] = useState('');
  const [expenseMethod, setExpenseMethod] = useState<'CASH' | 'VIREMENT' | 'CHEQUE'>('CASH');
  const [associatedVehicleId, setAssociatedVehicleId] = useState<string>('');

  const todayStr = new Date().toISOString().split('T')[0];

  // Helper date filtering
  const filterByPeriod = (txDateStr: string) => {
    if (periodFilter === 'ALL') return true;
    if (periodFilter === 'TODAY') return txDateStr === todayStr;

    const txDate = new Date(txDateStr);
    const now = new Date();

    if (periodFilter === 'WEEK') {
      const diffMs = now.getTime() - txDate.getTime();
      return diffMs >= 0 && diffMs <= 7 * 86400000;
    }
    if (periodFilter === 'MONTH') {
      return txDate.getFullYear() === now.getFullYear() && txDate.getMonth() === now.getMonth();
    }
    return true;
  };

  const filteredTransactions = transactions.filter(tx => {
    const matchesPeriod = filterByPeriod(tx.date);
    if (!matchesPeriod) return false;

    if (typeFilter === 'INCOME') return tx.type.startsWith('INCOME_');
    if (typeFilter === 'EXPENSE') return tx.type.startsWith('EXPENSE_');
    return true;
  });

  // Calculate Real Serious Metrics
  let totalPeriodIncome = 0;
  let totalPeriodExpenses = 0;
  let cashInDrawer = 0;
  let bankAndCheques = 0;

  transactions.forEach(tx => {
    const isIncome = tx.type.startsWith('INCOME_');
    const isExpense = tx.type.startsWith('EXPENSE_');

    if (isIncome) {
      if (filterByPeriod(tx.date)) totalPeriodIncome += tx.amountDzd;
      if (tx.paymentMethod === 'CASH') {
        cashInDrawer += tx.amountDzd;
      } else {
        bankAndCheques += tx.amountDzd;
      }
    } else if (isExpense) {
      if (filterByPeriod(tx.date)) totalPeriodExpenses += tx.amountDzd;
      if (tx.paymentMethod === 'CASH') {
        cashInDrawer -= tx.amountDzd;
      } else {
        bankAndCheques -= tx.amountDzd;
      }
    }
  });

  // Remaining balances from active or reserved contracts (Sans caution)
  const totalRemainingBalances = rentals
    .filter(r => r.status === 'ACTIVE' || r.status === 'OVERDUE' || r.status === 'RESERVED')
    .reduce((sum, r) => sum + (r.remainingBalanceDzd || 0), 0);

  // Escrow / Security deposits (Cautions sous séquestre)
  const cautionsInEscrow = rentals
    .filter(r => r.status === 'ACTIVE' || r.status === 'OVERDUE' || r.status === 'RESERVED')
    .reduce((sum, r) => sum + (r.cautionDzd || 0), 0);

  const netPeriodProfit = totalPeriodIncome - totalPeriodExpenses;

  const handleAddExpense = (e: React.FormEvent) => {
    e.preventDefault();
    if (!expenseDescription || expenseAmount <= 0) {
      addToast(language === 'ar' ? 'يرجى إدخال الوصف والمبلغ' : 'Veuillez renseigner le montant et la description', 'error');
      return;
    }

    dbStore.addTransaction({
      type: expenseType,
      amountDzd: Number(expenseAmount),
      description: expenseDescription,
      paymentMethod: expenseMethod,
      relatedVehicleId: associatedVehicleId || undefined,
      date: new Date().toISOString().split('T')[0],
      recordedBy: 'Comptable IM LOCATION',
    });

    addToast(language === 'ar' ? 'تم تسجيل المعاملة في الصندوق بنجاح' : 'Opération enregistrée en caisse avec succès', 'success');
    setIsExpenseModalOpen(false);
    setExpenseDescription('');
    setExpenseAmount(5000);
    setAssociatedVehicleId('');
  };

  const handlePrintCloture = () => {
    const targetId = clotureFormat === 'TICKET_80MM' ? 'printable-cloture-ticket' : 'printable-cloture-a4';
    printElement(targetId, `Cloture-Caisse-${todayStr}`);
  };

  const handleCopyReport = () => {
    const cashIn = transactions.filter(t => t.type.startsWith('INCOME_') && t.paymentMethod === 'CASH').reduce((sum, t) => sum + t.amountDzd, 0);
    const cashOut = transactions.filter(t => t.type.startsWith('EXPENSE_') && t.paymentMethod === 'CASH').reduce((sum, t) => sum + t.amountDzd, 0);
    
    const text = `* تقرير إقفال الصندوق اليومي · IM LOCATION *
التاريخ: ${todayStr} — ${new Date().toLocaleTimeString()}
الوكالة: ${settings.agencyName || 'IM LOCATION'}
━━━━━━━━━━━━━━━━━━
المقبوضات النقدية: +${cashIn.toLocaleString()} د.ج
المصروفات النقدية: -${cashOut.toLocaleString()} د.ج
━━━━━━━━━━━━━━━━━━
الرصيد النقدي في الدرج: ${cashInDrawer.toLocaleString()} د.ج
مستحقات ومتبقيات الزبائن: ${totalRemainingBalances.toLocaleString()} د.ج
━━━━━━━━━━━━━━━━━━
[ تم التدقيق والإقفال بنجاح ]`;

    navigator.clipboard.writeText(text);
    addToast(language === 'ar' ? 'تم نسخ التقرير المالي للحافظة' : 'Rapport copié dans le presse-papiers', 'success');
  };

  const formatDzd = (n: number) => {
    return new Intl.NumberFormat(language === 'ar' ? 'ar-DZ' : 'fr-FR', {
      maximumFractionDigits: 0
    }).format(n) + ' ' + t.currency;
  };

  const getTransactionLabel = (type: FinancialTransaction['type']) => {
    switch (type) {
      case 'INCOME_RENT': return language === 'ar' ? 'مقبوضات إيجار' : 'Loyer de Location';
      case 'INCOME_PENALTY': return language === 'ar' ? 'غرامات وتأخير' : 'Pénalités & Dégâts';
      case 'EXPENSE_MAINTENANCE': return language === 'ar' ? 'صيانة وقطع غيار' : 'Entretien & Réparations';
      case 'EXPENSE_INSURANCE': return language === 'ar' ? 'تأمين وفحص فني' : 'Assurance & Contrôle';
      case 'EXPENSE_FUEL': return language === 'ar' ? 'وقود وسيرغاز' : 'Carburant';
      case 'EXPENSE_CLEANING': return language === 'ar' ? 'غسيل وتنظيف' : 'Lavage & Nettoyage';
      default: return language === 'ar' ? 'مصاريف عامة' : 'Charges Diverses';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-neutral-200 dark:border-neutral-800">
        <div>
          <h2 className="text-xl font-bold font-bukra italic tracking-tight text-neutral-900 dark:text-white">
            {t.navCaisseFinance}
          </h2>
          <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">
            {language === 'ar'
              ? 'إدارة الصندوق النقدي الفعلي، الإيرادات والمصروفات، وفصل مبالغ الودائع (Caution) عن الأرباح'
              : 'Trésorerie réelle en caisse, grand livre des recettes/dépenses et séquestre des dépôts'}
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          {/* Daily Cash Reconciliation Button */}
          <button
            onClick={() => setIsClotureModalOpen(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 text-amber-600 dark:text-amber-400 border border-amber-500/30 text-xs font-bold transition-all cursor-pointer font-bukra italic"
          >
            <Receipt className="w-4 h-4" />
            <span>{language === 'ar' ? 'إقفال الصندوق اليومي' : 'Clôture de Caisse'}</span>
          </button>

          {/* Add Expense Button */}
          <button
            onClick={() => setIsExpenseModalOpen(true)}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-neutral-900 dark:bg-neutral-800 hover:bg-neutral-800 dark:hover:bg-neutral-700 text-white border border-neutral-700 text-xs font-bold transition-colors cursor-pointer shadow-sm font-bukra italic"
          >
            <Plus className="w-4 h-4 text-amber-400" />
            <span>{language === 'ar' ? 'تسجيل مصروف' : 'Nouvelle Dépense'}</span>
          </button>
        </div>
      </div>

      {/* Real Serious Cash & Profit Metrics (4 Columns) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Metric 1: Real Cash in Hand (Espèces en Caisse) */}
        <div className="p-4 rounded-2xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 shadow-xs relative overflow-hidden">
          <div className="flex items-center justify-between text-neutral-500 text-xs">
            <span className="font-semibold">{language === 'ar' ? 'سيولة الصندوق النقدية (الدرج)' : 'Espèces en Caisse (Tiroir)'}</span>
            <Wallet className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="mt-2 text-2xl font-black font-mono tabular-nums text-emerald-600 dark:text-emerald-400">
            {formatDzd(cashInDrawer)}
          </div>
          <div className="mt-2 text-[11px] text-neutral-500">
            {language === 'ar' ? 'المبلغ الفعلي الموجود نقداً في الخزينة' : 'Total cash disponible immédiatement'}
          </div>
        </div>

        {/* Metric 2: Net Profit for selected period */}
        <div className="p-4 rounded-2xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 shadow-xs">
          <div className="flex items-center justify-between text-neutral-500 text-xs">
            <span className="font-semibold">{t.netProfit}</span>
            <TrendingUp className="w-4 h-4 text-amber-500" />
          </div>
          <div className="mt-2 text-2xl font-black font-mono tabular-nums text-neutral-900 dark:text-white">
            {formatDzd(netPeriodProfit)}
          </div>
          <div className="mt-2 text-[11px] text-neutral-500">
            {language === 'ar' ? 'مداخيل الفترة - مصاريف الفترة' : 'Recettes période - Dépenses'}
          </div>
        </div>

        {/* Metric 3: Total Expenses */}
        <div className="p-4 rounded-2xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 shadow-xs">
          <div className="flex items-center justify-between text-neutral-500 text-xs">
            <span className="font-semibold">{t.totalExpenses}</span>
            <TrendingDown className="w-4 h-4 text-red-500" />
          </div>
          <div className="mt-2 text-2xl font-black font-mono tabular-nums text-red-500">
            {formatDzd(totalPeriodExpenses)}
          </div>
          <div className="mt-2 text-[11px] text-neutral-500">
            {language === 'ar' ? 'صيانة، زيوت، وقود وتكاليف' : 'Charges d’exploitation'}
          </div>
        </div>

        {/* Metric 4: Total Remaining Balances from Clients (Sans caution) */}
        <div className="p-4 rounded-2xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 shadow-xs">
          <div className="flex items-center justify-between text-neutral-500 text-xs font-bukra italic">
            <span className="font-semibold">{language === 'ar' ? 'مستحقات ومتبقيات الزبائن' : 'Créances Clients (Reste)'}</span>
            <DollarSign className="w-4 h-4 text-red-500" />
          </div>
          <div className="mt-2 text-2xl font-black font-mono tabular-nums text-red-600 dark:text-red-400">
            {formatDzd(totalRemainingBalances)}
          </div>
          <div className="mt-2 text-[11px] text-neutral-400">
            {language === 'ar' ? 'مبالغ متبقية تستوفى عند استرجاع السيارات' : 'Soldes restants à encaisser'}
          </div>
        </div>
      </div>

      {/* Period & Category Filters Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 rounded-2xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 shadow-xs text-xs">
        {/* Period Selector */}
        <div className="flex items-center gap-1.5 overflow-x-auto">
          <span className="text-neutral-400 font-semibold me-1 shrink-0">
            <Calendar className="w-3.5 h-3.5 inline me-1" />
            {language === 'ar' ? 'الفترة:' : 'Période :'}
          </span>
          {[
            { id: 'ALL', label: t.all },
            { id: 'TODAY', label: language === 'ar' ? 'اليوم' : 'Aujourd’hui' },
            { id: 'WEEK', label: language === 'ar' ? 'آخر 7 أيام' : '7 derniers jours' },
            { id: 'MONTH', label: language === 'ar' ? 'هذا الشهر' : 'Ce Mois' },
          ].map(p => (
            <button
              key={p.id}
              onClick={() => setPeriodFilter(p.id as any)}
              className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer shrink-0 ${
                periodFilter === p.id
                  ? 'bg-amber-500 text-neutral-950 font-bold shadow-xs'
                  : 'text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800'
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>

        {/* Type Selector: All, Incomes, Expenses */}
        <div className="flex items-center gap-1.5 shrink-0">
          <button
            onClick={() => setTypeFilter('ALL')}
            className={`px-2.5 py-1 rounded-lg cursor-pointer ${
              typeFilter === 'ALL' ? 'bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 font-bold' : 'text-neutral-500 hover:text-neutral-800 dark:hover:text-neutral-200'
            }`}
          >
            {language === 'ar' ? 'الكل' : 'Tous'}
          </button>
          <button
            onClick={() => setTypeFilter('INCOME')}
            className={`px-2.5 py-1 rounded-lg cursor-pointer ${
              typeFilter === 'INCOME' ? 'bg-emerald-600 text-white font-bold' : 'text-emerald-500 hover:bg-emerald-50 dark:hover:bg-emerald-950/20'
            }`}
          >
            {language === 'ar' ? '+ المقبوضات' : '+ Recettes'}
          </button>
          <button
            onClick={() => setTypeFilter('EXPENSE')}
            className={`px-2.5 py-1 rounded-lg cursor-pointer ${
              typeFilter === 'EXPENSE' ? 'bg-red-600 text-white font-bold' : 'text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20'
            }`}
          >
            {language === 'ar' ? '- المصروفات' : '- Dépenses'}
          </button>
        </div>
      </div>

      {/* Transactions Journal Table */}
      <div className="rounded-2xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 overflow-hidden shadow-xs">
        <div className="p-4 border-b border-neutral-200 dark:border-neutral-800 flex items-center justify-between">
          <h3 className="font-bold text-sm text-neutral-900 dark:text-white font-bukra italic">
            {language === 'ar' ? 'دفتر العمليات والحركات المالية' : 'Journal des Mouvements de Caisse'}
          </h3>
          <span className="text-xs text-neutral-400 font-mono">
            {filteredTransactions.length} {language === 'ar' ? 'عملية' : 'opérations'}
          </span>
        </div>

        <div className="overflow-x-auto">
          {filteredTransactions.length === 0 ? (
            <div className="p-12 text-center text-neutral-400 text-xs">{t.noData}</div>
          ) : (
            <table className="w-full min-w-[650px] text-xs text-start">
              <thead className="bg-neutral-50 dark:bg-neutral-800/50 text-neutral-500 font-medium border-b border-neutral-200 dark:border-neutral-800">
                <tr>
                  <th className="px-4 py-3 text-start">{t.date}</th>
                  <th className="px-4 py-3 text-start">{language === 'ar' ? 'طبيعة العملية' : 'Nature de l’Opération'}</th>
                  <th className="px-4 py-3 text-start">{language === 'ar' ? 'البيان والتفاصيل' : 'Libellé & Détails'}</th>
                  <th className="px-4 py-3 text-start">{language === 'ar' ? 'طريقة الدفع' : 'Mode'}</th>
                  <th className="px-4 py-3 text-end">{language === 'ar' ? 'المبلغ (DZD)' : 'Montant (DZD)'}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-200 dark:divide-neutral-800 text-neutral-800 dark:text-neutral-200">
                {filteredTransactions.map(tx => {
                  const isIncome = tx.type.startsWith('INCOME_');
                  return (
                    <tr key={tx.id} className="hover:bg-neutral-50/50 dark:hover:bg-neutral-800/30 transition-colors">
                      <td className="px-4 py-3 font-mono text-neutral-500">
                        {tx.date}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          isIncome 
                            ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20'
                            : 'bg-red-500/10 text-red-600 dark:text-red-400 border border-red-500/20'
                        }`}>
                          {getTransactionLabel(tx.type)}
                        </span>
                      </td>
                      <td className="px-4 py-3 font-medium text-neutral-900 dark:text-white">
                        <div>{tx.description}</div>
                        <div className="text-[10px] text-neutral-400 font-mono">
                          {tx.recordedBy}
                        </div>
                      </td>
                      <td className="px-4 py-3 font-mono text-[11px]">
                        <span className="px-1.5 py-0.5 rounded bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-300">
                          {tx.paymentMethod === 'CASH' ? (language === 'ar' ? 'نقداً (Espèces)' : 'Espèces') : (tx.paymentMethod === 'CHEQUE' ? 'Chèque' : 'Virement')}
                        </span>
                      </td>
                      <td className={`px-4 py-3 text-end font-mono font-bold text-sm ${
                        isIncome ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-500'
                      }`}>
                        {isIncome ? '+' : '-'}{formatDzd(tx.amountDzd)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Modal 1: Register New Expense */}
      {isExpenseModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="w-full max-w-md bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-3xl p-6 shadow-2xl space-y-4 my-8">
            <div className="flex items-center justify-between pb-3 border-b border-neutral-200 dark:border-neutral-800">
              <div className="flex items-center gap-2">
                <TrendingDown className="w-5 h-5 text-red-500" />
                <h3 className="font-bold text-base text-neutral-900 dark:text-white font-bukra italic">
                  {language === 'ar' ? 'تسجيل مصروف جديد بالصندوق' : 'Enregistrer une Dépense'}
                </h3>
              </div>
              <button
                onClick={() => setIsExpenseModalOpen(false)}
                className="text-neutral-400 hover:text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddExpense} className="space-y-3.5 text-xs">
              <div>
                <label className="block text-neutral-700 dark:text-neutral-300 font-medium mb-1">
                  {language === 'ar' ? 'نوع المصروف' : 'Catégorie de Dépense'} *
                </label>
                <select
                  value={expenseType}
                  onChange={(e) => setExpenseType(e.target.value as any)}
                  className="w-full bg-neutral-50 dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-700 rounded-xl p-2.5 text-neutral-900 dark:text-white font-medium"
                >
                  <option value="EXPENSE_MAINTENANCE">{language === 'ar' ? 'صيانة وقطع غيار (Vidange, Freins)' : 'Entretien & Réparations'}</option>
                  <option value="EXPENSE_FUEL">{language === 'ar' ? 'وقود وسيرغاز (Essence, GPL)' : 'Carburant'}</option>
                  <option value="EXPENSE_CLEANING">{language === 'ar' ? 'غسيل وتنظيف المركبات (Lavage)' : 'Lavage & Nettoyage'}</option>
                  <option value="EXPENSE_INSURANCE">{language === 'ar' ? 'تأمين وفحص فني دوري' : 'Assurance & Contrôle'}</option>
                  <option value="EXPENSE_OTHER">{language === 'ar' ? 'مصاريف تسيير وإيجار المحل' : 'Charges & Divers'}</option>
                </select>
              </div>

              <div>
                <label className="block text-neutral-700 dark:text-neutral-300 font-medium mb-1">
                  {language === 'ar' ? 'المبلغ (بالدينار الجزائري DZD)' : 'Montant (DZD)'} *
                </label>
                <input
                  type="number"
                  min="1"
                  required
                  value={expenseAmount}
                  onChange={(e) => setExpenseAmount(Number(e.target.value))}
                  className="w-full bg-neutral-50 dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-700 rounded-xl p-2.5 font-mono text-base font-bold text-neutral-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-neutral-700 dark:text-neutral-300 font-medium mb-1">
                  {language === 'ar' ? 'طريقة الدفع' : 'Mode de Paiement'} *
                </label>
                <select
                  value={expenseMethod}
                  onChange={(e) => setExpenseMethod(e.target.value as any)}
                  className="w-full bg-neutral-50 dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-700 rounded-xl p-2.5 text-neutral-900 dark:text-white"
                >
                  <option value="CASH">{language === 'ar' ? 'نقداً من الصندوق (Espèces)' : 'Espèces (Caisse)'}</option>
                  <option value="CHEQUE">{language === 'ar' ? 'شيك بنكي (Chèque)' : 'Chèque Bancaire'}</option>
                  <option value="VIREMENT">{language === 'ar' ? 'تحويل بنكي (Virement)' : 'Virement'}</option>
                </select>
              </div>

              <div>
                <label className="block text-neutral-700 dark:text-neutral-300 font-medium mb-1">
                  {language === 'ar' ? 'السيارة المعنية (اختياري)' : 'Véhicule Concerné (Optionnel)'}
                </label>
                <select
                  value={associatedVehicleId}
                  onChange={(e) => setAssociatedVehicleId(e.target.value)}
                  className="w-full bg-neutral-50 dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-700 rounded-xl p-2.5 text-neutral-900 dark:text-white font-mono"
                >
                  <option value="">{language === 'ar' ? '— بدون تحديد سيارة —' : '— Aucun véhicule spécifique —'}</option>
                  {vehicles.map(v => (
                    <option key={v.id} value={v.id}>
                      {v.brand} {v.model} ({v.matricule})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-neutral-700 dark:text-neutral-300 font-medium mb-1">
                  {language === 'ar' ? 'بيان المصروف والوصل' : 'Libellé / Justificatif'} *
                </label>
                <input
                  type="text"
                  required
                  placeholder={language === 'ar' ? 'مثال: تغيير زيت 10W40 + فلتر للسيارة...' : 'Ex: Vidange moteur 10W40...'}
                  value={expenseDescription}
                  onChange={(e) => setExpenseDescription(e.target.value)}
                  className="w-full bg-neutral-50 dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-700 rounded-xl p-2.5 text-neutral-900 dark:text-white"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-neutral-200 dark:border-neutral-800">
                <button
                  type="button"
                  onClick={() => setIsExpenseModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 font-medium cursor-pointer"
                >
                  {t.cancel}
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-red-600 hover:bg-red-500 text-white font-bold cursor-pointer font-bukra italic"
                >
                  {language === 'ar' ? 'تأكيد وصرف المبلغ' : 'Valider la Dépense'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal 2: Clôture de Caisse Journalière (Reconciliation Ticket & A4 Report) */}
      {isClotureModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4 overflow-y-auto print-document-overlay">
          <div className="w-full max-w-2xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-3xl p-4 sm:p-6 shadow-2xl space-y-4 my-8">
            <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-neutral-200 dark:border-neutral-800 print:hidden">
              <div className="flex items-center gap-2">
                <Receipt className="w-5 h-5 text-amber-500" />
                <h3 className="font-bold text-base text-neutral-900 dark:text-white font-bukra italic">
                  {language === 'ar' ? 'محضر إقفال الصندوق اليومي' : 'Procès-Verbal de Clôture de Caisse'}
                </h3>
              </div>

              {/* Format Toggle: Ticket Thermique vs Rapport A4 */}
              <div className="flex items-center gap-1 bg-neutral-100 dark:bg-neutral-800 p-1 rounded-xl text-xs font-bold font-bukra italic">
                <button
                  type="button"
                  onClick={() => setClotureFormat('TICKET_80MM')}
                  className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                    clotureFormat === 'TICKET_80MM'
                      ? 'bg-amber-500 text-neutral-950 shadow-xs'
                      : 'text-neutral-600 dark:text-neutral-400'
                  }`}
                >
                  {language === 'ar' ? 'تذكرة حرارية (80mm)' : 'Ticket POS (80mm)'}
                </button>
                <button
                  type="button"
                  onClick={() => setClotureFormat('RAPPORT_A4')}
                  className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                    clotureFormat === 'RAPPORT_A4'
                      ? 'bg-amber-500 text-neutral-950 shadow-xs'
                      : 'text-neutral-600 dark:text-neutral-400'
                  }`}
                >
                  {language === 'ar' ? 'تقرير A4 رسمي' : 'Rapport A4 Officiel'}
                </button>
              </div>

              <button
                onClick={() => setIsClotureModalOpen(false)}
                className="text-neutral-400 hover:text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* FORMAT 1: TICKET THERMIQUE 80MM */}
            {clotureFormat === 'TICKET_80MM' && (
              <div className="flex justify-center">
                <div id="printable-cloture-ticket" className="w-full max-w-[80mm] p-4 bg-white text-neutral-900 border border-neutral-300 rounded-xl space-y-3 text-xs font-mono select-text shadow-sm">
                  <div className="text-center border-b border-dashed border-neutral-400 pb-2.5">
                    <h4 className="font-black text-sm text-neutral-950 font-bukra italic">
                      {settings.agencyName || 'IM LOCATION'}
                    </h4>
                    <div className="text-[10px] text-neutral-600 font-mono mt-0.5">
                      LOCATION DE VOITURES DZ
                    </div>
                    <div className="text-[9px] text-neutral-500 font-mono">
                      RC: {settings.rc} · Tél: {settings.phone1}
                    </div>
                    <div className="mt-1 font-bold text-[11px] uppercase tracking-wider text-neutral-950">
                      TICKET DE CLÔTURE DE CAISSE
                    </div>
                    <div className="text-[10px] text-neutral-500">
                      {todayStr} — {new Date().toLocaleTimeString()}
                    </div>
                  </div>

                  <div className="space-y-1.5 text-[11px]">
                    <div className="flex justify-between py-0.5 border-b border-dotted border-neutral-300">
                      <span>Total Espèces In:</span>
                      <span className="font-bold text-emerald-700">
                        +{formatDzd(transactions.filter(t => t.type.startsWith('INCOME_') && t.paymentMethod === 'CASH').reduce((sum, t) => sum + t.amountDzd, 0))}
                      </span>
                    </div>

                    <div className="flex justify-between py-0.5 border-b border-dotted border-neutral-300">
                      <span>Total Sorties Espèces:</span>
                      <span className="font-bold text-red-600">
                        -{formatDzd(transactions.filter(t => t.type.startsWith('EXPENSE_') && t.paymentMethod === 'CASH').reduce((sum, t) => sum + t.amountDzd, 0))}
                      </span>
                    </div>

                    <div className="flex justify-between py-1.5 bg-neutral-100 px-2 rounded font-black text-xs">
                      <span>SOLDE EN CAISSE:</span>
                      <span className="text-neutral-950">{formatDzd(cashInDrawer)}</span>
                    </div>

                    <div className="flex justify-between py-0.5 text-[10px] text-neutral-600">
                      <span>Cautions Séquestre:</span>
                      <span className="font-bold">{formatDzd(cautionsInEscrow)}</span>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-dashed border-neutral-400 text-center text-[9px] text-neutral-500 space-y-1">
                    <div>Opérations du jour : {transactions.filter(t => t.date === todayStr).length}</div>
                    <div className="font-bold text-neutral-800">*** CLÔTURE VALIDÉE ***</div>
                    <div className="italic">Visa Caissier / Gérant</div>
                  </div>
                </div>
              </div>
            )}

            {/* FORMAT 2: RAPPORT A4 OFFICIEL */}
            {clotureFormat === 'RAPPORT_A4' && (
              <div id="printable-cloture-a4" className="p-6 bg-white text-neutral-900 rounded-2xl border border-neutral-300 space-y-4 text-xs font-sans select-text">
                <div className="flex items-start justify-between border-b-2 border-neutral-900 pb-3">
                  <div>
                    <h4 className="font-black text-lg text-neutral-950 font-bukra italic">
                      {settings.agencyName || 'IM LOCATION'}
                    </h4>
                    <p className="text-[10px] text-neutral-500 font-mono">
                      RC: {settings.rc} · NIF: {settings.nif} · Tél: {settings.phone1}
                    </p>
                  </div>
                  <div className="text-end">
                    <span className="font-bold text-xs uppercase px-2 py-1 bg-neutral-900 text-white rounded">
                      RAPPORT D'ÉMARGEMENT FINANCIER A4
                    </span>
                    <div className="text-[10px] text-neutral-500 font-mono mt-1">
                      Date : {todayStr} — {new Date().toLocaleTimeString()}
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-3 text-center">
                  <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200">
                    <div className="text-[10px] uppercase font-bold text-emerald-800">Mouvements Entrées</div>
                    <div className="text-base font-black font-mono text-emerald-700 mt-0.5">
                      +{formatDzd(transactions.filter(t => t.type.startsWith('INCOME_') && t.paymentMethod === 'CASH').reduce((sum, t) => sum + t.amountDzd, 0))}
                    </div>
                  </div>

                  <div className="p-3 bg-red-50 rounded-xl border border-red-200">
                    <div className="text-[10px] uppercase font-bold text-red-800">Dépenses & Sorties</div>
                    <div className="text-base font-black font-mono text-red-600 mt-0.5">
                      -{formatDzd(transactions.filter(t => t.type.startsWith('EXPENSE_') && t.paymentMethod === 'CASH').reduce((sum, t) => sum + t.amountDzd, 0))}
                    </div>
                  </div>

                  <div className="p-3 bg-amber-50 rounded-xl border border-amber-200">
                    <div className="text-[10px] uppercase font-bold text-amber-800">Solde Liquide Net</div>
                    <div className="text-base font-black font-mono text-amber-700 mt-0.5">
                      {formatDzd(cashInDrawer)}
                    </div>
                  </div>
                </div>

                <div className="p-3 bg-neutral-50 rounded-xl border border-neutral-200 text-xs">
                  <div className="flex justify-between items-center text-neutral-700 font-mono">
                    <span>Garanties & Cautions sous Séquestre (Non comptabilisées en CA) :</span>
                    <span className="font-bold text-blue-600">{formatDzd(cautionsInEscrow)}</span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 pt-3 border-t border-dashed border-neutral-300 text-center text-[10px]">
                  <div className="p-3 border rounded-xl border-neutral-300 min-h-[75px] flex flex-col justify-between">
                    <span className="font-bold uppercase text-neutral-600">Le Caissier / Agent</span>
                    <span className="italic text-neutral-400">Signature</span>
                  </div>
                  <div className="p-3 border rounded-xl border-neutral-300 min-h-[75px] flex flex-col justify-between">
                    <span className="font-bold uppercase text-neutral-600">Le Gérant de l'Agence</span>
                    <span className="italic text-neutral-400">Cachet & Visa officiel</span>
                  </div>
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex flex-wrap items-center justify-between gap-2 pt-3 border-t border-neutral-200 dark:border-neutral-800 print:hidden">
              <button
                onClick={handleCopyReport}
                className="px-3.5 py-2 rounded-xl bg-neutral-100 hover:bg-neutral-200 dark:bg-neutral-800 dark:hover:bg-neutral-700 text-neutral-800 dark:text-neutral-200 font-bold text-xs cursor-pointer shadow-xs flex items-center gap-1.5 font-bukra italic"
                title="Copier le texte"
              >
                <Copy className="w-4 h-4 text-amber-500" />
                <span>{language === 'ar' ? 'نسخ ملخص اليومية' : 'Copier le résumé'}</span>
              </button>

              <div className="flex items-center gap-2">
                <button
                  onClick={handlePrintCloture}
                  className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-neutral-950 font-black text-xs cursor-pointer shadow-sm flex items-center gap-1.5 font-bukra italic"
                >
                  <Printer className="w-4 h-4" />
                  <span>{language === 'ar' ? 'طباعة المحضر' : 'Imprimer'}</span>
                </button>
                <button
                  onClick={() => setIsClotureModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 font-semibold text-xs cursor-pointer"
                >
                  {t.close}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

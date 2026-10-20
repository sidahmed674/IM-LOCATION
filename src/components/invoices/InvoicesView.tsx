import React, { useState } from 'react';
import { 
  FileCheck, Printer, CheckCircle2, AlertCircle, 
  Search, Filter, DollarSign, Eye, Plus, ArrowUpRight
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { dbStore } from '../../db/store';
import { Invoice } from '../../types';

export const InvoicesView: React.FC = () => {
  const { t, language, setInvoiceToPrint, openNewRentalModal, addToast, setContractToPrint } = useApp();
  const invoices = dbStore.getInvoices();
  const contracts = dbStore.getRentals();

  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  const formatDzd = (n: number) => {
    return new Intl.NumberFormat(language === 'ar' ? 'ar-DZ' : 'fr-FR', {
      maximumFractionDigits: 0
    }).format(n) + ' ' + t.currency;
  };

  const handleMarkPaid = (id: string) => {
    dbStore.markInvoicePaid(id);
    addToast(language === 'ar' ? 'تم تعيين الفاتورة كمدفوعة بالكامل' : 'Facture marquée comme réglée', 'success');
  };

  const filteredInvoices = invoices.filter(inv => {
    const matchesStatus = statusFilter === 'ALL' || inv.status === statusFilter;
    const matchesSearch = 
      inv.invoiceNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      inv.customerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      inv.vehicleMatricule.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-neutral-200 dark:border-neutral-800">
        <div>
          <h2 className="text-xl font-bold font-bukra italic tracking-tight text-neutral-900 dark:text-white">
            {t.navContratsFactures}
          </h2>
          <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">
            {language === 'ar'
              ? 'إدارة فواتير تأجير السيارات، حساب الرسم على القيمة المضافة (TVA 19%) والطابع الجبائي'
              : 'Facturation officielle de location avec TVA (19%), droit de timbre fiscal et état des paiements'}
          </p>
        </div>

        <button
          onClick={() => openNewRentalModal()}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-neutral-950 font-bold text-xs transition-colors cursor-pointer shadow-sm self-start sm:self-auto font-bukra italic"
        >
          <Plus className="w-4 h-4" />
          <span>{t.actionNouveauContrat}</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="p-3 rounded-2xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 flex flex-col md:flex-row items-center justify-between gap-3 shadow-xs">
        <div className="flex items-center gap-1 overflow-x-auto w-full md:w-auto">
          {[
            { id: 'ALL', label: t.all },
            { id: 'PAID', label: t.paid },
            { id: 'PARTIALLY_PAID', label: language === 'ar' ? 'مدفوعة جزئياً' : 'Partielle' },
            { id: 'UNPAID', label: t.unpaid },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setStatusFilter(tab.id)}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors cursor-pointer shrink-0 ${
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
          placeholder={language === 'ar' ? 'بحث برقم الفاتورة، العميل، أو اللوحة...' : 'Rechercher facture, client, matricule...'}
          className="w-full md:w-80 bg-neutral-50 dark:bg-neutral-800/80 border border-neutral-200 dark:border-neutral-700/80 rounded-lg px-3 py-1.5 text-xs text-neutral-900 dark:text-neutral-200 focus:outline-none focus:border-amber-500"
        />
      </div>

      {/* Invoices Table */}
      <div className="rounded-2xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          {filteredInvoices.length === 0 ? (
            <div className="p-12 text-center text-neutral-400 text-xs space-y-2">
              <FileCheck className="w-10 h-10 mx-auto text-neutral-400" />
              <p>{t.noData}</p>
              <p className="text-[11px] text-neutral-500">
                {language === 'ar'
                  ? 'يتم إصدار الفواتير الرسمية تلقائياً عند إنشاء أي عقد إيجار جديد.'
                  : 'Les factures sont créées automatiquement dès la génération d’un contrat de location.'}
              </p>
            </div>
          ) : (
            <table className="w-full min-w-[720px] text-xs text-start">
              <thead className="bg-neutral-50 dark:bg-neutral-800/50 text-neutral-500 dark:text-neutral-400 font-semibold border-b border-neutral-200 dark:border-neutral-800">
                <tr>
                  <th className="px-4 py-3 text-start">{t.invoiceNumber}</th>
                  <th className="px-4 py-3 text-start">{t.customer}</th>
                  <th className="px-4 py-3 text-start">{language === 'ar' ? 'السيارة' : 'Véhicule'}</th>
                  <th className="px-4 py-3 text-start">{t.invoiceDate}</th>
                  <th className="px-4 py-3 text-end">{language === 'ar' ? 'المبلغ قبل الضريبة' : 'Montant HT'}</th>
                  <th className="px-4 py-3 text-end">{t.tva}</th>
                  <th className="px-4 py-3 text-end">{language === 'ar' ? 'الإجمالي TTC' : 'Total TTC'}</th>
                  <th className="px-4 py-3 text-center">{t.status}</th>
                  <th className="px-4 py-3 text-center">{t.actions}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-200 dark:divide-neutral-800 text-neutral-800 dark:text-neutral-200">
                {filteredInvoices.map(inv => {
                  return (
                    <tr key={inv.id} className="hover:bg-neutral-50/50 dark:hover:bg-neutral-800/30 transition-colors">
                      <td className="px-4 py-3 font-mono font-bold text-amber-600 dark:text-amber-400">
                        {inv.invoiceNumber}
                      </td>
                      <td className="px-4 py-3 font-semibold text-neutral-900 dark:text-white">
                        {inv.customerName}
                      </td>
                      <td className="px-4 py-3">
                        <div>{inv.vehicleModel}</div>
                        <div className="font-mono text-[10px] text-neutral-400">{inv.vehicleMatricule}</div>
                      </td>
                      <td className="px-4 py-3 font-mono tabular-nums text-neutral-500">
                        {inv.date}
                      </td>
                      <td className="px-4 py-3 text-end font-mono tabular-nums">
                        {formatDzd(inv.subtotalDzd)}
                      </td>
                      <td className="px-4 py-3 text-end font-mono tabular-nums text-neutral-500">
                        {formatDzd(inv.tvaAmountDzd)}
                      </td>
                      <td className="px-4 py-3 text-end font-mono font-bold tabular-nums text-neutral-900 dark:text-white">
                        {formatDzd(inv.totalAmountDzd)}
                      </td>
                      <td className="px-4 py-3 text-center">
                        {inv.status === 'PAID' ? (
                          <span className="px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 font-bold text-[10px] font-mono">
                            {t.paid}
                          </span>
                        ) : inv.status === 'PARTIALLY_PAID' ? (
                          <span className="px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-400 font-bold text-[10px] font-mono">
                            {language === 'ar' ? 'جزئي' : 'Partiel'}
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded-full bg-rose-500/15 text-rose-400 font-bold text-[10px] font-mono">
                            {t.unpaid}
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            onClick={() => setInvoiceToPrint(inv)}
                            className="p-1.5 rounded-lg bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-700 text-neutral-700 dark:text-neutral-200 transition-colors cursor-pointer"
                            title={t.printInvoice}
                          >
                            <Printer className="w-3.5 h-3.5" />
                          </button>
                          {inv.status !== 'PAID' && (
                            <button
                              onClick={() => handleMarkPaid(inv.id)}
                              className="px-2 py-1 rounded bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-[10px] transition-colors cursor-pointer"
                              title={language === 'ar' ? 'تسوية الفاتورة' : 'Régler'}
                            >
                              ✓
                            </button>
                          )}
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

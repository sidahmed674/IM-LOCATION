import React, { useState } from 'react';
import { 
  BarChart3, TrendingUp, Car, Users, DollarSign, 
  Calendar, Download, ArrowUpRight, Award, Shield,
  FileSpreadsheet, Filter, Search, CheckCircle2, AlertTriangle, Eye, Loader2, Sparkles
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { dbStore } from '../../db/store';
import { RentalContract } from '../../types';
import { generateStyledFinancialWorkbook } from '../../utils/excelReportGenerator';

export const ReportsView: React.FC = () => {
  const { t, language, addToast, setContractToPrint } = useApp();
  const [isGeneratingExcel, setIsGeneratingExcel] = useState(false);
  const vehicles = dbStore.getVehicles();
  const customers = dbStore.getCustomers();
  const rentals = dbStore.getRentals();
  const summary = dbStore.getFinancialSummary();
  const transactions = dbStore.getTransactions();

  const [searchQuery, setSearchQuery] = useState('');
  const [reportTab, setReportTab] = useState<'CONTRACTS' | 'FLEET' | 'FINANCE'>('CONTRACTS');

  const formatDzd = (n: number) => {
    return new Intl.NumberFormat(language === 'ar' ? 'ar-DZ' : 'fr-FR', {
      maximumFractionDigits: 0
    }).format(n) + ' ' + t.currency;
  };

  // Occupancy rate calculation
  const rentedCount = vehicles.filter(v => v.status === 'RENTED').length;
  const occupancyPercent = vehicles.length > 0 ? Math.round((rentedCount / vehicles.length) * 100) : 0;

  // Filter rentals for live table
  const filteredRentals = rentals.filter(r => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      r.contractNumber.toLowerCase().includes(q) ||
      r.customerSnapshot.fullName.toLowerCase().includes(q) ||
      r.customerSnapshot.phone.includes(q) ||
      r.customerSnapshot.cinOrPassport.toLowerCase().includes(q) ||
      r.vehicleSnapshot.matricule.toLowerCase().includes(q) ||
      r.vehicleSnapshot.brand.toLowerCase().includes(q) ||
      r.vehicleSnapshot.model.toLowerCase().includes(q)
    );
  });

  // Top vehicles by revenue
  const vehicleEarnings: { [matricule: string]: { name: string; earnings: number; count: number } } = {};
  rentals.forEach(r => {
    const mat = r.vehicleSnapshot.matricule;
    if (!vehicleEarnings[mat]) {
      vehicleEarnings[mat] = {
        name: `${r.vehicleSnapshot.brand} ${r.vehicleSnapshot.model}`,
        earnings: 0,
        count: 0
      };
    }
    vehicleEarnings[mat].earnings += r.totalRentDzd;
    vehicleEarnings[mat].count += 1;
  });

  const sortedVehicles = Object.entries(vehicleEarnings)
    .map(([mat, data]) => ({ mat, ...data }))
    .sort((a, b) => b.earnings - a.earnings);

  // -------------------------------------------------------------------------
  // EXPORT 1: COMPREHENSIVE CONTRACTS CSV (Exact structure matching Algerian standard)
  // -------------------------------------------------------------------------
  const handleExportContractsCsv = () => {
    // UTF-8 BOM ensures Microsoft Excel in Windows displays Arabic and French without encoding errors
    const BOM = '\uFEFF';
    const headers = [
      'N° Contrat (رقم العقد)',
      'Client Nom & Prénom (العميل)',
      'Date de Naissance (تاريخ الميلاد)',
      'Lieu de Naissance (مكان الميلاد)',
      'N° CIN / Passeport (بطاقة التعريف/جواز)',
      'N° Permis de Conduire (رقم رخصة السياقة)',
      'Téléphone (الهاتف)',
      'Véhicule Marque & Modèle (المركبة)',
      'Immatriculation DZ (رقم اللوحة)',
      'Date Départ (تاريخ الخروج)',
      'Heure Départ (وقت الخروج)',
      'Date Retour Prévue (تاريخ الإرجاع المتوقع)',
      'Date Retour Réelle (تاريخ الإرجاع الفعلي)',
      'Durée Jours (عدد الأيام)',
      'Tarif Journalier DZD (السعر اليومي)',
      'Total Location DZD (إجمالي الإيجار)',
      'Avance Versée DZD (الدفعة المقدمة)',
      'Reste à Payer DZD (المتبقي)',
      'Caution DZD (مبلغ الضمان)',
      'Mode Caution (طريقة الضمان)',
      'Km Départ (عداد البداية)',
      'Km Retour (عداد النهاية)',
      'Km Supplémentaires (الكيلومتر الزائد)',
      'Total Pénalités DZD (إجمالي الغرامات)',
      'Caution Restituée DZD (الضمان المسترجع)',
      'Statut Contrat (حالة العقد)',
      'Date Enregistrement (تاريخ التسجيل)'
    ];

    let csvContent = BOM + headers.join(';') + '\n';

    rentals.forEach(r => {
      const row = [
        `"${r.contractNumber}"`,
        `"${r.customerSnapshot.fullName}"`,
        `"${r.customerSnapshot.birthDate || '—'}"`,
        `"${r.customerSnapshot.birthPlace || r.customerSnapshot.wilaya || '—'}"`,
        `"${r.customerSnapshot.cinOrPassport}"`,
        `"${r.customerSnapshot.drivingLicenseNumber}"`,
        `"${r.customerSnapshot.phone}"`,
        `"${r.vehicleSnapshot.brand} ${r.vehicleSnapshot.model}"`,
        `"${r.vehicleSnapshot.matricule}"`,
        `"${r.startDate}"`,
        `"${r.startTime || '09:00'}"`,
        `"${r.expectedEndDate}"`,
        `"${r.actualReturnDate || 'En cours'}"`,
        r.durationDays,
        r.dailyRateDzd,
        r.totalRentDzd,
        r.advancePaymentDzd,
        r.remainingBalanceDzd,
        r.cautionDzd,
        `"${r.cautionPaymentMethod}"`,
        r.startKm,
        r.returnDetails?.returnKm || '—',
        r.returnDetails?.excessKm || 0,
        r.returnDetails?.totalPenaltiesDzd || 0,
        r.returnDetails?.cautionRefundedDzd ?? r.cautionDzd,
        `"${r.status}"`,
        `"${r.createdAt}"`
      ];
      csvContent += row.join(';') + '\n';
    });

    downloadCsvBlob(csvContent, `im_location_contrats_${new Date().toISOString().split('T')[0]}.csv`);
    addToast(language === 'ar' ? 'تم تصدير تقرير العقود بصيغة Excel/CSV بنجاح' : 'Rapport complet des contrats exporté avec succès', 'success');
  };

  // -------------------------------------------------------------------------
  // EXPORT 2: FLEET INVENTORY CSV
  // -------------------------------------------------------------------------
  const handleExportFleetCsv = () => {
    const BOM = '\uFEFF';
    const headers = [
      'Immatriculation DZ (رقم اللوحة)',
      'Marque (الماركة)',
      'Modèle (الموديل)',
      'Année (السنة)',
      'Catégorie (الصنف)',
      'Carburant (نوع الوقود)',
      'Transmission (علبة السرعة)',
      'Tarif Journalier DZD (السعر اليومي)',
      'Kilométrage Actuel (العداد الحالي)',
      'Niveau Carburant (مستوى الوقود)',
      'Statut (الحالة)',
      'N° Police Assurance (رقم التأمين)',
      'Échéance Assurance (انتهاء التأمين)',
      'N° Carte Grise (البطاقة الرمادية)',
      'Échéance Contrôle Tech (الفحص الفني)',
      'Prochaine Vidange Km (موعد تغيير الزيت)'
    ];

    let csvContent = BOM + headers.join(';') + '\n';

    vehicles.forEach(v => {
      const row = [
        `"${v.matricule}"`,
        `"${v.brand}"`,
        `"${v.model}"`,
        v.year,
        `"${v.category}"`,
        `"${v.fuelType}"`,
        `"${v.transmission}"`,
        v.dailyRate,
        v.currentKm,
        `"${v.currentFuel}"`,
        `"${v.status}"`,
        `"${v.documents.assurance.number}"`,
        `"${v.documents.assurance.expiryDate}"`,
        `"${v.documents.carteGrise.number}"`,
        `"${v.documents.controleTechnique.expiryDate}"`,
        v.nextOilChangeKm || '—'
      ];
      csvContent += row.join(';') + '\n';
    });

    downloadCsvBlob(csvContent, `im_location_flotte_${new Date().toISOString().split('T')[0]}.csv`);
    addToast(language === 'ar' ? 'تم تصدير جرد الأسطول بنجاح' : 'Inventaire de la flotte exporté avec succès', 'success');
  };

  // -------------------------------------------------------------------------
  // EXPORT 3: CASHBOX JOURNAL CSV
  // -------------------------------------------------------------------------
  const handleExportFinanceCsv = () => {
    const BOM = '\uFEFF';
    const headers = [
      'Date (التاريخ)',
      'Type d’Opération (نوع العملية)',
      'Libellé / Justificatif (البيان والتفاصيل)',
      'Mode de Paiement (طريقة الدفع)',
      'Montant DZD (المبلغ بالدينار)',
      'Enregistré Par (سجل بواسطة)'
    ];

    let csvContent = BOM + headers.join(';') + '\n';

    transactions.forEach(tx => {
      const isIncome = tx.type.startsWith('INCOME_');
      const row = [
        `"${tx.date}"`,
        `"${tx.type}"`,
        `"${tx.description}"`,
        `"${tx.paymentMethod}"`,
        isIncome ? tx.amountDzd : -tx.amountDzd,
        `"${tx.recordedBy}"`
      ];
      csvContent += row.join(';') + '\n';
    });

    downloadCsvBlob(csvContent, `im_location_caisse_journal_${new Date().toISOString().split('T')[0]}.csv`);
    addToast(language === 'ar' ? 'تم تصدير دفتر الصندوق بنجاح' : 'Grand livre de caisse exporté avec succès', 'success');
  };

  // -------------------------------------------------------------------------
  // EXPORT 4: COMPREHENSIVE ANALYTICAL & FINANCIAL STATS CSV (Exact match to User Request)
  // -------------------------------------------------------------------------
  const handleExportAnalyticalFinanceCsv = () => {
    const BOM = '\uFEFF';
    const today = new Date().toISOString().split('T')[0];

    let csv = BOM;

    // --- Section 1: Executive Financial Overview ---
    csv += '=== RAPPORT ANALYTIQUE & STATISTIQUES FINANCIÈRES - IM LOCATION ===\n';
    csv += `Date d'exportation;${today}\n`;
    csv += `Devise d'exploitation;Dinar Algérien (DZD / دج)\n`;
    csv += `Chiffre d'Affaires Global (DZD);${summary.totalIncome}\n`;
    csv += `Total Dépenses d'Exploitation (DZD);${summary.totalExpenses}\n`;
    csv += `Bénéfice Net Réalisé (DZD);${summary.netProfit}\n`;
    csv += `Total Cautions en Séquestre (DZD);${summary.totalCautionsInEscrow}\n`;
    csv += `Taux d'Occupation du Parc;${occupancyPercent}%\n`;
    csv += `Total Véhicules en Flotte;${vehicles.length}\n`;
    csv += `Total Contrats Réalisés;${rentals.length}\n\n`;

    // --- Section 2: Fleet Performance & Rentability ---
    csv += '=== ANALYSE DE RENTABILITÉ DE LA FLOTTE (PERFORMANCE PAR VÉHICULE) ===\n';
    csv += 'Matricule DZ;Marque & Modèle;Catégorie;Tarif Journalier (DZD);Contrats Réalisés;Jours Loués;CA Brut (DZD);Frais Entretien (DZD);Marge Nette (DZD);Statut Actuel\n';
    
    vehicles.forEach(v => {
      const vehRentals = rentals.filter(r => r.vehicleId === v.id && r.status !== 'CANCELLED');
      const totalDays = vehRentals.reduce((sum, r) => sum + r.durationDays, 0);
      const grossIncome = vehRentals.reduce((sum, r) => sum + r.totalRentDzd, 0);
      
      const maintenanceTxs = transactions.filter(t => t.relatedVehicleId === v.id && t.type === 'EXPENSE_MAINTENANCE');
      const totalMaint = maintenanceTxs.reduce((sum, t) => sum + t.amountDzd, 0);
      const netMargin = grossIncome - totalMaint;

      csv += `"${v.matricule}";"${v.brand} ${v.model}";"${v.category}";${v.dailyRate};${vehRentals.length};${totalDays};${grossIncome};${totalMaint};${netMargin};"${v.status}"\n`;
    });
    csv += '\n';

    // --- Section 3: Detailed Ledger of All Rentals & Contracts ---
    csv += '=== GRAND LIVRE CHRONOLOGIQUE DES CONTRATS & CLIENTS ===\n';
    csv += 'N° Contrat;Client;Date Naissance;Lieu Naissance;CIN/Passeport;N° Permis;Téléphone;Véhicule;Matricule;Date Départ;Heure;Date Retour Prévue;Retour Réel;Durée (Jours);Tarif/Jour;Total TTC (DZD);Avance (DZD);Reste Dû (DZD);Caution (DZD);Mode Caution;Km Départ;Km Retour;Pénalités (DZD);Statut\n';

    rentals.forEach(r => {
      csv += `"${r.contractNumber}";"${r.customerSnapshot.fullName}";"${r.customerSnapshot.birthDate || '—'}";"${r.customerSnapshot.birthPlace || r.customerSnapshot.wilaya || '—'}";"${r.customerSnapshot.cinOrPassport}";"${r.customerSnapshot.drivingLicenseNumber}";"${r.customerSnapshot.phone}";"${r.vehicleSnapshot.brand} ${r.vehicleSnapshot.model}";"${r.vehicleSnapshot.matricule}";"${r.startDate}";"${r.startTime || '09:00'}";"${r.expectedEndDate}";"${r.actualReturnDate || 'En cours'}";${r.durationDays};${r.dailyRateDzd};${r.totalRentDzd};${r.advancePaymentDzd};${r.remainingBalanceDzd};${r.cautionDzd};"${r.cautionPaymentMethod}";${r.startKm};${r.returnDetails?.returnKm || '—'};${r.returnDetails?.totalPenaltiesDzd || 0};"${r.status}"\n`;
    });
    csv += '\n';

    // --- Section 4: Cash Register Breakdown (Flux de Trésorerie) ---
    csv += '=== DÉTAIL DES FLUX FINANCIERS DE CAISSE (ENTRÉES & SORTIES) ===\n';
    csv += 'Date;Type Opération;Désignation;Mode Règlement;Entrée (DZD);Sortie (DZD);Opérateur\n';

    transactions.forEach(t => {
      const isInc = t.type.startsWith('INCOME_');
      csv += `"${t.date}";"${t.type}";"${t.description}";"${t.paymentMethod}";${isInc ? t.amountDzd : 0};${!isInc ? t.amountDzd : 0};"${t.recordedBy}"\n`;
    });

    downloadCsvBlob(csv, `im_location_statistiques_financieres_analytiques_${today}.csv`);
    addToast(language === 'ar' ? 'تم تصدير التقرير التحليلي والإحصائيات المالية بصيغة Excel/CSV بنجاح' : 'Rapport financier analytique exporté avec succès', 'success');
  };

  const handleExportStyledExcel = async () => {
    setIsGeneratingExcel(true);
    try {
      const blob = await generateStyledFinancialWorkbook();
      const today = new Date().toISOString().split('T')[0];
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `IM_LOCATION_RAPPORT_FINANCIER_ANALYTIQUE_${today}.xlsx`;
      link.click();
      URL.revokeObjectURL(url);
      addToast(
        language === 'ar' 
          ? 'تم تصدير ملف Excel (.XLSX) الاحترافي بالألوان والتنسيقات بنجاح!' 
          : 'Rapport Excel officiel (.XLSX) généré avec succès !', 
        'success'
      );
    } catch (err) {
      console.error('Excel generation error:', err);
      addToast(
        language === 'ar' ? 'حدث خطأ أثناء إنشاء ملف Excel' : 'Erreur lors de la génération Excel', 
        'error'
      );
    } finally {
      setIsGeneratingExcel(false);
    }
  };

  const downloadCsvBlob = (content: string, filename: string) => {
    const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-neutral-200 dark:border-neutral-800">
        <div>
          <h2 className="text-xl font-bold font-bukra italic tracking-tight text-neutral-900 dark:text-white">
            {t.reportsTitle}
          </h2>
          <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">
            {language === 'ar' 
              ? 'تقارير ديناميكية متوافقة 100% مع قوالب Excel و CSV الرسمية مع المعالجة اللحظية للبيانات'
              : 'Analyses statistiques et exports conformes Excel / CSV avec mise à jour dynamique des données'}
          </p>
        </div>

        {/* Quick Exporters Menu */}
        <div className="flex flex-wrap items-center gap-2 self-start sm:self-auto">
          {/* THE MASTER BUTTON: Styled Excel (.XLSX) identical to user attachment */}
          <button
            onClick={handleExportStyledExcel}
            disabled={isGeneratingExcel}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 via-emerald-500 to-teal-500 hover:from-emerald-500 hover:to-teal-400 active:scale-98 text-white font-black text-xs cursor-pointer shadow-md shadow-emerald-600/30 font-bukra italic transition-all disabled:opacity-50"
            title="Télécharger le fichier Excel (.XLSX) officiel avec design, couleurs et 4 feuilles"
          >
            {isGeneratingExcel ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <FileSpreadsheet className="w-4 h-4 stroke-[2.5]" />
            )}
            <span>{language === 'ar' ? 'تصدير ملف Excel الملون (.XLSX)' : 'Exporter Excel (.XLSX)'}</span>
          </button>

          {/* Analytical CSV */}
          <button
            onClick={handleExportAnalyticalFinanceCsv}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-neutral-950 font-bold text-xs cursor-pointer shadow-xs font-bukra italic"
            title="Exporter le rapport analytique et financier en CSV"
          >
            <Download className="w-3.5 h-3.5 stroke-[2.5]" />
            <span>{language === 'ar' ? 'التقرير التحليلي (CSV)' : 'Analytique (CSV)'}</span>
          </button>

          <button
            onClick={handleExportContractsCsv}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-neutral-900 dark:bg-neutral-800 hover:bg-neutral-800 dark:hover:bg-neutral-700 text-white font-bold text-xs border border-neutral-700 cursor-pointer shadow-xs font-bukra italic"
            title="Exporter modèle complet des contrats"
          >
            <FileSpreadsheet className="w-4 h-4 text-amber-400" />
            <span>{language === 'ar' ? 'جدول العقود' : 'Contrats'}</span>
          </button>

          <button
            onClick={handleExportFleetCsv}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-700 text-neutral-800 dark:text-neutral-200 font-semibold text-xs border border-neutral-300 dark:border-neutral-700 cursor-pointer shadow-xs"
            title="Exporter l'inventaire du parc"
          >
            <Car className="w-4 h-4 text-emerald-500" />
            <span>{language === 'ar' ? 'جرد الأسطول' : 'Parc Auto'}</span>
          </button>

          <button
            onClick={handleExportFinanceCsv}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-700 text-neutral-800 dark:text-neutral-200 font-semibold text-xs border border-neutral-300 dark:border-neutral-700 cursor-pointer shadow-xs"
            title="Exporter le journal de caisse"
          >
            <DollarSign className="w-4 h-4 text-blue-500" />
            <span>{language === 'ar' ? 'دفتر الصندوق' : 'Caisse'}</span>
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 rounded-2xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 shadow-xs">
          <div className="flex items-center justify-between text-neutral-500 text-xs">
            <span className="font-semibold">{t.occupancyRate}</span>
            <TrendingUp className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="mt-2 text-2xl font-black font-mono tabular-nums text-neutral-900 dark:text-white">
            {occupancyPercent}%
          </div>
          <div className="mt-2 text-[11px] text-neutral-500">
            {rentedCount} / {vehicles.length} {language === 'ar' ? 'مركبات في الطريق' : 'véhicules loués'}
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 shadow-xs">
          <div className="flex items-center justify-between text-neutral-500 text-xs">
            <span className="font-semibold">{t.totalRevenue}</span>
            <DollarSign className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="mt-2 text-2xl font-black font-mono tabular-nums text-emerald-600 dark:text-emerald-400">
            {formatDzd(summary.totalIncome)}
          </div>
          <div className="mt-2 text-[11px] text-neutral-500">
            {language === 'ar' ? 'إجمالي المداخيل المحصلة' : 'Chiffre d’affaires global'}
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 shadow-xs">
          <div className="flex items-center justify-between text-neutral-500 text-xs">
            <span className="font-semibold">{t.totalRentals}</span>
            <Calendar className="w-4 h-4 text-blue-500" />
          </div>
          <div className="mt-2 text-2xl font-black font-mono tabular-nums text-neutral-900 dark:text-white">
            {rentals.length}
          </div>
          <div className="mt-2 text-[11px] text-neutral-500">
            {language === 'ar' ? 'عقود مسجلة بالنظام' : 'Contrats au total'}
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 shadow-xs">
          <div className="flex items-center justify-between text-neutral-500 text-xs">
            <span className="font-semibold">{t.totalCautionsHeld}</span>
            <Shield className="w-4 h-4 text-amber-500" />
          </div>
          <div className="mt-2 text-2xl font-black font-mono tabular-nums text-amber-500">
            {formatDzd(summary.totalCautionsInEscrow)}
          </div>
          <div className="mt-2 text-[11px] text-neutral-500">
            {language === 'ar' ? 'ودائع محتجزة قيد الأمانة' : 'Garanties sous séquestre'}
          </div>
        </div>
      </div>

      {/* Live Interactive Data Table (Exact Replica of the requested CSV Columns) */}
      <div className="rounded-3xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 shadow-sm overflow-hidden space-y-4 p-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-neutral-200 dark:border-neutral-800">
          <div>
            <h3 className="font-bold text-sm text-neutral-900 dark:text-white font-bukra italic flex items-center gap-2">
              <FileSpreadsheet className="w-4 h-4 text-amber-500" />
              <span>{language === 'ar' ? 'معاينة القالب الحي للبيانات (CSV Manifest Viewer)' : 'Tableau de Synthèse du Manifeste CSV'}</span>
            </h3>
            <p className="text-xs text-neutral-500">
              {language === 'ar'
                ? 'يتطابق تماماً مع ملف CSV المطلوب مع إمكانية التصفية المباشرة'
                : 'Conforme point par point à la structure CSV demandée avec filtres en temps réel'}
            </p>
          </div>

          <div className="relative w-full sm:w-72">
            <Search className="w-3.5 h-3.5 absolute top-1/2 -translate-y-1/2 text-neutral-400 start-3 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={language === 'ar' ? 'بحث بالعميل، العقد، اللوحة...' : 'Filtrer contrat, client, matricule...'}
              className="w-full bg-neutral-50 dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-700 rounded-xl py-2 ps-9 pe-3 text-xs text-neutral-900 dark:text-white focus:outline-none focus:border-amber-500"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          {filteredRentals.length === 0 ? (
            <div className="p-12 text-center text-neutral-400 text-xs">{t.noData}</div>
          ) : (
            <table className="w-full min-w-[850px] text-xs text-start border-collapse">
              <thead className="bg-neutral-50 dark:bg-neutral-800/60 text-neutral-600 dark:text-neutral-300 font-semibold border-b border-neutral-200 dark:border-neutral-800 text-[11px]">
                <tr>
                  <th className="p-3 text-start">{language === 'ar' ? 'رقم العقد' : 'N° Contrat'}</th>
                  <th className="p-3 text-start">{language === 'ar' ? 'العميل والميلاد' : 'Client & État Civil'}</th>
                  <th className="p-3 text-start">{language === 'ar' ? 'الهاتف والـ CIN' : 'Contact & Pièce'}</th>
                  <th className="p-3 text-start">{language === 'ar' ? 'السيارة واللوحة' : 'Véhicule'}</th>
                  <th className="p-3 text-start">{language === 'ar' ? 'فترة الإيجار' : 'Dates (Départ → Retour)'}</th>
                  <th className="p-3 text-end">{language === 'ar' ? 'الإجمالي (DZD)' : 'Total DZD'}</th>
                  <th className="p-3 text-end">{language === 'ar' ? 'التسبيق (DZD)' : 'Avance DZD'}</th>
                  <th className="p-3 text-end">{language === 'ar' ? 'المتبقي (DZD)' : 'Reste DZD'}</th>
                  <th className="p-3 text-center">{language === 'ar' ? 'الحالة' : 'Statut'}</th>
                  <th className="p-3 text-center print:hidden">{t.actions}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-200 dark:divide-neutral-800 text-neutral-800 dark:text-neutral-200">
                {filteredRentals.map(rental => (
                  <tr key={rental.id} className="hover:bg-neutral-50/50 dark:hover:bg-neutral-800/30 transition-colors">
                    <td className="p-3 font-mono font-bold text-amber-600 dark:text-amber-400 whitespace-nowrap">
                      {rental.contractNumber}
                    </td>

                    <td className="p-3">
                      <div className="font-bold text-neutral-900 dark:text-white">
                        {rental.customerSnapshot.fullName}
                      </div>
                      <div className="text-[10px] text-neutral-500 flex items-center gap-1 mt-0.5">
                        <Calendar className="w-3 h-3 text-neutral-400 shrink-0" />
                        <span>{rental.customerSnapshot.birthDate || '—'} ({rental.customerSnapshot.birthPlace || rental.customerSnapshot.wilaya || 'Alger'})</span>
                      </div>
                    </td>

                    <td className="p-3">
                      <div className="font-mono">{rental.customerSnapshot.phone}</div>
                      <div className="text-[10px] text-neutral-400 font-mono">CIN: {rental.customerSnapshot.cinOrPassport}</div>
                    </td>

                    <td className="p-3">
                      <div className="font-medium">{rental.vehicleSnapshot.brand} {rental.vehicleSnapshot.model}</div>
                      <div className="font-mono text-[10px] text-neutral-500">{rental.vehicleSnapshot.matricule}</div>
                    </td>

                    <td className="p-3 font-mono text-[11px] whitespace-nowrap">
                      <div>{rental.startDate} → {rental.expectedEndDate}</div>
                      <div className="text-[10px] text-neutral-400">{rental.durationDays} {language === 'ar' ? 'أيام' : 'jours'}</div>
                    </td>

                    <td className="p-3 text-end font-mono font-bold">
                      {formatDzd(rental.totalRentDzd)}
                    </td>

                    <td className="p-3 text-end font-mono text-emerald-500 font-medium">
                      {formatDzd(rental.advancePaymentDzd)}
                    </td>

                    <td className="p-3 text-end font-mono text-red-500 font-bold">
                      {formatDzd(rental.remainingBalanceDzd)}
                    </td>

                    <td className="p-3 text-center whitespace-nowrap">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        rental.status === 'ACTIVE'
                          ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20'
                          : rental.status === 'COMPLETED'
                          ? 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20'
                          : 'bg-red-500/10 text-red-600 dark:text-red-400 border border-red-500/20'
                      }`}>
                        {rental.status}
                      </span>
                    </td>

                    <td className="p-3 text-center print:hidden">
                      <button
                        onClick={() => setContractToPrint(rental)}
                        className="p-1.5 rounded-lg bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-700 text-neutral-600 dark:text-neutral-300 transition-colors cursor-pointer"
                        title="Imprimer A4"
                      >
                        <Eye className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Top vehicles ranking */}
      <div className="rounded-3xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 p-6 shadow-xs space-y-4">
        <h3 className="font-bold text-sm text-neutral-900 dark:text-white flex items-center gap-2 font-bukra italic">
          <Award className="w-4 h-4 text-amber-500" />
          <span>{t.topVehicles}</span>
        </h3>

        {sortedVehicles.length === 0 ? (
          <div className="text-center py-6 text-neutral-400 text-xs">{t.noData}</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {sortedVehicles.slice(0, 6).map((veh, idx) => (
              <div 
                key={veh.mat}
                className="p-3.5 rounded-2xl bg-neutral-50 dark:bg-neutral-800/40 border border-neutral-200 dark:border-neutral-700/60 flex items-center justify-between text-xs"
              >
                <div className="flex items-center gap-2.5">
                  <span className={`w-6 h-6 rounded-lg flex items-center justify-center font-bold text-xs ${
                    idx === 0 
                      ? 'bg-amber-500 text-neutral-950 font-black shadow-xs' 
                      : 'bg-neutral-200 dark:bg-neutral-700 text-neutral-700 dark:text-neutral-200'
                  }`}>
                    {idx + 1}
                  </span>
                  <div>
                    <div className="font-bold font-bukra italic text-neutral-900 dark:text-white">{veh.name}</div>
                    <div className="font-mono text-[10px] text-neutral-400">{veh.mat}</div>
                  </div>
                </div>

                <div className="text-end">
                  <div className="font-bold font-mono text-emerald-600 dark:text-emerald-400">{formatDzd(veh.earnings)}</div>
                  <div className="text-[10px] text-neutral-400">{veh.count} {language === 'ar' ? 'إيجار' : 'locations'}</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

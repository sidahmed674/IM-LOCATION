/**
 * IM LOCATION - Daily Cashbox Closure & Owner Gmail Reporting
 * Prepares the complete daily operational ledger, builds the styled Excel (.xlsx) file,
 * formats the executive email report, and launches Gmail integration.
 */

import ExcelJS from 'exceljs';
import { dbStore } from '../db/store';

export interface DailyClosureData {
  todayStr: string;
  agencyName: string;
  recipientEmail: string;
  cashInDrawer: number;
  bankAndCheques: number;
  totalIncomeToday: number;
  totalExpenseToday: number;
  netDayProfit: number;
  cautionsInEscrow: number;
  rentalsToday: ReturnType<typeof dbStore.getRentals>;
  returnsToday: ReturnType<typeof dbStore.getRentals>;
  transactionsToday: ReturnType<typeof dbStore.getTransactions>;
}

export function getDailyClosureData(targetDate?: string): DailyClosureData {
  const todayStr = targetDate || new Date().toISOString().split('T')[0];
  const settings = dbStore.getSettings();
  const rentals = dbStore.getRentals();
  const transactions = dbStore.getTransactions();

  // Filter rentals created or started today
  const rentalsToday = rentals.filter(r => r.startDate === todayStr || r.createdAt.startsWith(todayStr));
  
  // Filter returns that took place today
  const returnsToday = rentals.filter(r => r.actualReturnDate === todayStr);

  // Filter financial transactions for today
  const transactionsToday = transactions.filter(t => t.date === todayStr);

  let totalIncomeToday = 0;
  let totalExpenseToday = 0;
  let cashInDrawer = 0;
  let bankAndCheques = 0;

  transactions.forEach(t => {
    const isInc = t.type.startsWith('INCOME_');
    const amt = isInc ? t.amountDzd : -t.amountDzd;
    
    // Overall balance
    if (t.paymentMethod === 'CASH') {
      cashInDrawer += amt;
    } else {
      bankAndCheques += amt;
    }

    // Today's specific totals
    if (t.date === todayStr) {
      if (isInc) totalIncomeToday += t.amountDzd;
      else totalExpenseToday += t.amountDzd;
    }
  });

  const cautionsInEscrow = rentals
    .filter(r => r.status === 'ACTIVE' || r.status === 'OVERDUE')
    .reduce((sum, r) => sum + (r.cautionDzd || 0), 0);

  const netDayProfit = totalIncomeToday - totalExpenseToday;

  return {
    todayStr,
    agencyName: settings.agencyName,
    recipientEmail: settings.email || 'imlocationbbh@gmail.com',
    cashInDrawer,
    bankAndCheques,
    totalIncomeToday,
    totalExpenseToday,
    netDayProfit,
    cautionsInEscrow,
    rentalsToday,
    returnsToday,
    transactionsToday,
  };
}

/**
 * Format email text body for owner's Gmail
 */
export function buildDailyClosureEmailBody(data: DailyClosureData, language: 'ar' | 'fr' = 'ar'): { subject: string; body: string } {
  const formatDzd = (n: number) => new Intl.NumberFormat('fr-FR', { maximumFractionDigits: 0 }).format(n) + ' DZD';

  const subject = `[IM LOCATION] Rapport de Clôture Journalière - ${data.todayStr}`;

  let body = '';
  if (language === 'ar') {
    body += `تقرير إقفال الصندوق والنشاط اليومي - ${data.agencyName}\n`;
    body += `تاريخ اليوم: ${data.todayStr}\n`;
    body += `══════════════════════════════════════════\n\n`;

    body += `[1. ملخص حركة الصندوق والسيولة النقدية اليومية]:\n`;
    body += `• إجمالي مقبوضات اليوم: +${formatDzd(data.totalIncomeToday)}\n`;
    body += `• إجمالي مصاريف اليوم: -${formatDzd(data.totalExpenseToday)}\n`;
    body += `• صافي حركة اليوم: ${formatDzd(data.netDayProfit)}\n`;
    body += `• الرصيد النقدي المتوفر حالياً بالدرج (Espèces): ${formatDzd(data.cashInDrawer)}\n`;
    body += `• الأرصدة البنكية وشيكات CCP: ${formatDzd(data.bankAndCheques)}\n\n`;

    body += `[2. كراءات وعقود اليوم (${data.rentalsToday.length} عقد)]:\n`;
    if (data.rentalsToday.length === 0) {
      body += `• لا توجد عقود كراء جديدة مفتوحة اليوم.\n`;
    } else {
      data.rentalsToday.forEach((r, idx) => {
        body += `  ${idx + 1}. [${r.contractNumber}] ${r.customerSnapshot.fullName} | ${r.vehicleSnapshot.brand} ${r.vehicleSnapshot.model} (${r.vehicleSnapshot.matricule}) | إجمالي: ${formatDzd(r.totalRentDzd)} | تسبيق: ${formatDzd(r.advancePaymentDzd)} | متبقي: ${formatDzd(r.remainingBalanceDzd)}\n`;
      });
    }
    body += `\n`;

    body += `[3. السيارات المسترجعة ومحاضر اليوم (${data.returnsToday.length} سيارة)]:\n`;
    if (data.returnsToday.length === 0) {
      body += `• لم يتم استرجاع أي سيارة اليوم.\n`;
    } else {
      data.returnsToday.forEach((r, idx) => {
        body += `  ${idx + 1}. [${r.contractNumber}] ${r.vehicleSnapshot.brand} ${r.vehicleSnapshot.model} | العميل: ${r.customerSnapshot.fullName} | عداد الإرجاع: ${r.returnDetails?.returnKm || '—'} KM | غرامات إضافية: ${formatDzd(r.returnDetails?.totalPenaltiesDzd || 0)}\n`;
      });
    }
    body += `\n`;

    body += `[4. تفاصيل العمليات والمصاريف المسجلة بالصندوق اليوم]:\n`;
    if (data.transactionsToday.length === 0) {
      body += `• لا توجد عمليات إضافية مسجلة.\n`;
    } else {
      data.transactionsToday.forEach((t, idx) => {
        const sign = t.type.startsWith('INCOME_') ? '+' : '-';
        body += `  ${idx + 1}. [${t.paymentMethod}] ${t.description}: ${sign}${formatDzd(t.amountDzd)} (سجل بواسطة: ${t.recordedBy})\n`;
      });
    }
    body += `\n`;
    body += `══════════════════════════════════════════\n`;
    body += `تم توليد هذا التقرير تلقائياً وتصدير ملف Excel (.XLSX) المرفق عبر نظام IM LOCATION POS.\n`;
  } else {
    body += `PROCÈS-VERBAL DE CLÔTURE DE CAISSE JOURNALIÈRE - ${data.agencyName}\n`;
    body += `Date : ${data.todayStr}\n`;
    body += `══════════════════════════════════════════\n\n`;

    body += `[1. SYNTHÈSE DE LA CAISSE DU JOUR] :\n`;
    body += `• Recettes du jour : +${formatDzd(data.totalIncomeToday)}\n`;
    body += `• Dépenses du jour : -${formatDzd(data.totalExpenseToday)}\n`;
    body += `• Marge nette du jour : ${formatDzd(data.netDayProfit)}\n`;
    body += `• Espèces disponibles en caisse (Tiroir) : ${formatDzd(data.cashInDrawer)}\n`;
    body += `• Avoirs bancaires & Chèques : ${formatDzd(data.bankAndCheques)}\n\n`;

    body += `[2. CONTRATS DE LOCATION DU JOUR (${data.rentalsToday.length})] :\n`;
    if (data.rentalsToday.length === 0) {
      body += `• Aucune nouvelle location aujourd'hui.\n`;
    } else {
      data.rentalsToday.forEach((r, idx) => {
        body += `  ${idx + 1}. [${r.contractNumber}] ${r.customerSnapshot.fullName} | ${r.vehicleSnapshot.brand} ${r.vehicleSnapshot.model} (${r.vehicleSnapshot.matricule}) | Total : ${formatDzd(r.totalRentDzd)} | Avance : ${formatDzd(r.advancePaymentDzd)} | Reste : ${formatDzd(r.remainingBalanceDzd)}\n`;
      });
    }
    body += `\n`;

    body += `[3. VÉHICULES RESTITUÉS DU JOUR (${data.returnsToday.length})] :\n`;
    if (data.returnsToday.length === 0) {
      body += `• Aucune restitution enregistrée aujourd'hui.\n`;
    } else {
      data.returnsToday.forEach((r, idx) => {
        body += `  ${idx + 1}. [${r.contractNumber}] ${r.vehicleSnapshot.brand} ${r.vehicleSnapshot.model} | Client : ${r.customerSnapshot.fullName} | Km Retour : ${r.returnDetails?.returnKm || '—'} KM | Pénalités : ${formatDzd(r.returnDetails?.totalPenaltiesDzd || 0)}\n`;
      });
    }
    body += `\n`;

    body += `[4. DÉTAIL DES TRANSACTIONS DE CAISSE DU JOUR] :\n`;
    data.transactionsToday.forEach((t, idx) => {
      const sign = t.type.startsWith('INCOME_') ? '+' : '-';
      body += `  ${idx + 1}. [${t.paymentMethod}] ${t.description} : ${sign}${formatDzd(t.amountDzd)} (${t.recordedBy})\n`;
    });
    body += `\n`;
    body += `══════════════════════════════════════════\n`;
    body += `Document généré automatiquement avec fichier Excel (.XLSX) joint par IM LOCATION POS.\n`;
  }

  return { subject, body };
}

/**
 * Generate a dedicated styled Excel workbook for Today's Closure
 */
export async function generateDailyClosureExcelBlob(data: DailyClosureData): Promise<Blob> {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'IM LOCATION - Clôture Caisse';
  workbook.created = new Date();

  const COLORS = {
    dark: '0F172A',
    navy: '1E293B',
    amber: 'F59E0B',
    white: 'FFFFFF',
    border: 'CBD5E1',
    light: 'F8FAFC',
    greenFill: 'DCFCE7',
    greenText: '166534',
    redFill: 'FEE2E2',
    redText: '991B1B',
  };

  const ws = workbook.addWorksheet('Clôture du Jour', {
    views: [{ showGridLines: true }]
  });

  // Title
  ws.mergeCells('A1:F1');
  const title = ws.getCell('A1');
  title.value = `IM LOCATION — CLÔTURE DE CAISSE & AUDIT DU JOUR (${data.todayStr})`;
  title.font = { name: 'Segoe UI', size: 14, bold: true, color: { argb: COLORS.white } };
  title.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: COLORS.dark } };
  title.alignment = { horizontal: 'center', vertical: 'middle' };
  ws.getRow(1).height = 32;

  // Subtitle
  ws.mergeCells('A2:F2');
  const sub = ws.getCell('A2');
  sub.value = `Agence: ${data.agencyName} | Date: ${data.todayStr} | Destinataire: ${data.recipientEmail}`;
  sub.font = { italic: true, size: 10, color: { argb: '64748B' } };
  sub.alignment = { horizontal: 'center', vertical: 'middle' };
  ws.getRow(2).height = 20;

  // Section 1: Financial Summary
  ws.getCell('A4').value = '1. RÉSUMÉ DE LA CAISSE ET DES FLUX DU JOUR';
  ws.getCell('A4').font = { bold: true, color: { argb: COLORS.amber } };

  const summaryData = [
    ['Recettes du Jour (Total Entrées)', data.totalIncomeToday, '#,##0 "DZD"'],
    ['Dépenses du Jour (Total Sorties)', data.totalExpenseToday, '#,##0 "DZD"'],
    ['Marge Nette du Jour', data.netDayProfit, '#,##0 "DZD"'],
    ['Solde Total Espèces en Caisse (Tiroir)', data.cashInDrawer, '#,##0 "DZD"'],
    ['Avoirs Bancaires & Chèques CCP', data.bankAndCheques, '#,##0 "DZD"'],
    ['Cautions en Séquestre', data.cautionsInEscrow, '#,##0 "DZD"'],
  ];

  summaryData.forEach((row, i) => {
    const r = ws.getRow(5 + i);
    r.getCell(1).value = row[0];
    r.getCell(1).font = { bold: true };
    r.getCell(2).value = row[1];
    r.getCell(2).numFmt = row[2] as string;
    r.getCell(2).font = { bold: true };
    r.getCell(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: i % 2 === 0 ? COLORS.white : COLORS.light } };
    r.getCell(2).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: i % 2 === 0 ? COLORS.white : COLORS.light } };
  });

  // Section 2: Contrats du Jour
  let curRow = 13;
  ws.getCell(`A${curRow}`).value = `2. CONTRATS DE LOCATION DU JOUR (${data.rentalsToday.length})`;
  ws.getCell(`A${curRow}`).font = { bold: true, color: { argb: COLORS.amber } };
  curRow++;

  const contHeaders = ['N° Contrat', 'Client', 'Véhicule', 'Matricule DZ', 'Total DZD', 'Avance DZD', 'Reste DZD', 'Caution DZD'];
  const contHeaderRow = ws.getRow(curRow);
  contHeaders.forEach((h, idx) => {
    const c = contHeaderRow.getCell(idx + 1);
    c.value = h;
    c.font = { bold: true, color: { argb: COLORS.white }, size: 9 };
    c.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: COLORS.navy } };
    c.alignment = { horizontal: 'center' };
  });
  curRow++;

  if (data.rentalsToday.length === 0) {
    ws.getCell(`A${curRow}`).value = 'Aucun nouveau contrat aujourd’hui.';
    curRow++;
  } else {
    data.rentalsToday.forEach(r => {
      const row = ws.getRow(curRow);
      row.getCell(1).value = r.contractNumber;
      row.getCell(2).value = r.customerSnapshot.fullName;
      row.getCell(3).value = `${r.vehicleSnapshot.brand} ${r.vehicleSnapshot.model}`;
      row.getCell(4).value = r.vehicleSnapshot.matricule;
      row.getCell(5).value = r.totalRentDzd;
      row.getCell(5).numFmt = '#,##0 "DZD"';
      row.getCell(6).value = r.advancePaymentDzd;
      row.getCell(6).numFmt = '#,##0 "DZD"';
      row.getCell(7).value = r.remainingBalanceDzd;
      row.getCell(7).numFmt = '#,##0 "DZD"';
      row.getCell(8).value = r.cautionDzd;
      row.getCell(8).numFmt = '#,##0 "DZD"';
      curRow++;
    });
  }

  // Section 3: Transactions du Jour
  curRow += 2;
  ws.getCell(`A${curRow}`).value = `3. DÉTAIL DES FLUX DE CAISSE DU JOUR (${data.transactionsToday.length})`;
  ws.getCell(`A${curRow}`).font = { bold: true, color: { argb: COLORS.amber } };
  curRow++;

  const txHeaders = ['Date', 'Type', 'Libellé', 'Mode', 'Montant DZD', 'Responsable'];
  const txHeaderRow = ws.getRow(curRow);
  txHeaders.forEach((h, idx) => {
    const c = txHeaderRow.getCell(idx + 1);
    c.value = h;
    c.font = { bold: true, color: { argb: COLORS.white }, size: 9 };
    c.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: COLORS.navy } };
    c.alignment = { horizontal: 'center' };
  });
  curRow++;

  data.transactionsToday.forEach(tx => {
    const row = ws.getRow(curRow);
    const isInc = tx.type.startsWith('INCOME_');
    row.getCell(1).value = tx.date;
    row.getCell(2).value = tx.type;
    row.getCell(3).value = tx.description;
    row.getCell(4).value = tx.paymentMethod;
    row.getCell(5).value = isInc ? tx.amountDzd : -tx.amountDzd;
    row.getCell(5).numFmt = '#,##0 "DZD"';
    row.getCell(5).font = { bold: true, color: { argb: isInc ? COLORS.greenText : COLORS.redText } };
    row.getCell(6).value = tx.recordedBy;
    curRow++;
  });

  ws.columns = [
    { width: 20 },
    { width: 25 },
    { width: 30 },
    { width: 18 },
    { width: 18 },
    { width: 18 },
    { width: 18 },
    { width: 18 },
  ];

  const buffer = await workbook.xlsx.writeBuffer();
  return new Blob([buffer], { 
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' 
  });
}

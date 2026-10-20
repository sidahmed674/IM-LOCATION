/**
 * IM LOCATION - Professional Excel (.XLSX) Multi-Sheet Analytical & Financial Generator
 * Generates styled, color-formatted, high-fidelity Excel workbooks with custom fonts,
 * cell fills, borders, number formatting, formulas, and auto-adjusted column widths.
 */

import ExcelJS from 'exceljs';
import { dbStore } from '../db/store';

export async function generateStyledFinancialWorkbook(): Promise<Blob> {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'IM LOCATION - Car Rental POS';
  workbook.created = new Date();
  workbook.modified = new Date();

  const vehicles = dbStore.getVehicles();
  const customers = dbStore.getCustomers();
  const rentals = dbStore.getRentals();
  const summary = dbStore.getFinancialSummary();
  const transactions = dbStore.getTransactions();
  const settings = dbStore.getSettings();

  const todayStr = new Date().toISOString().split('T')[0];

  // Common Color Palette matching IM LOCATION Brand & Executive Financial Spreadsheets
  const COLORS = {
    brandDark: '0F172A',      // Slate 900
    brandNavy: '1E293B',      // Slate 800
    brandRed: 'DC2626',       // Red 600
    brandAmber: 'F59E0B',     // Amber 500
    lightBg: 'F8FAFC',        // Slate 50
    zebraRow: 'F1F5F9',       // Slate 100
    white: 'FFFFFF',
    borderGray: 'CBD5E1',     // Slate 300
    darkBorder: '334155',     // Slate 700
    greenFill: 'DCFCE7',      // Emerald 100
    greenText: '166534',      // Emerald 800
    blueFill: 'DBEAFE',       // Blue 100
    blueText: '1E40AF',       // Blue 800
    redFill: 'FEE2E2',        // Red 100
    redText: '991B1B',        // Red 800
    amberFill: 'FEF3C7',      // Amber 100
    amberText: '92400E',      // Amber 800
  };

  const BORDER_THIN: Partial<ExcelJS.Borders> = {
    top: { style: 'thin', color: { argb: COLORS.borderGray } },
    left: { style: 'thin', color: { argb: COLORS.borderGray } },
    bottom: { style: 'thin', color: { argb: COLORS.borderGray } },
    right: { style: 'thin', color: { argb: COLORS.borderGray } }
  };

  const BORDER_TOTAL: Partial<ExcelJS.Borders> = {
    top: { style: 'thin', color: { argb: COLORS.brandNavy } },
    bottom: { style: 'double', color: { argb: COLORS.brandNavy } },
    left: { style: 'thin', color: { argb: COLORS.brandNavy } },
    right: { style: 'thin', color: { argb: COLORS.brandNavy } }
  };

  // ===========================================================================
  // SHEET 1: SYNTHÈSE & KPI FINANCIERS (الملخص التنفيذي والإحصائيات العامة)
  // ===========================================================================
  const wsKpi = workbook.addWorksheet('1. Synthèse Financière & KPI', {
    properties: { tabColor: { argb: COLORS.brandAmber } },
    views: [{ showGridLines: true }]
  });

  // Title Banner
  wsKpi.mergeCells('A1:F1');
  const titleCell = wsKpi.getCell('A1');
  titleCell.value = 'IM LOCATION — RAPPORT FINANCIER & ANALYTIQUE DE GESTION';
  titleCell.font = { name: 'Segoe UI', size: 16, bold: true, color: { argb: COLORS.white } };
  titleCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: COLORS.brandDark } };
  titleCell.alignment = { horizontal: 'center', vertical: 'middle' };
  wsKpi.getRow(1).height = 36;

  // Subtitle info
  wsKpi.mergeCells('A2:F2');
  const subCell = wsKpi.getCell('A2');
  subCell.value = `Agence: ${settings.agencyName} | RC: ${settings.rc} | Tél: ${settings.phone1} | Date d'export: ${todayStr} | Devise: Dinar Algérien (DZD)`;
  subCell.font = { name: 'Segoe UI', size: 10, italic: true, color: { argb: '64748B' } };
  subCell.alignment = { horizontal: 'center', vertical: 'middle' };
  wsKpi.getRow(2).height = 20;

  // KPI Section Header
  wsKpi.getCell('A4').value = '1. INDICATEURS CLÉS DE PERFORMANCE (KPI)';
  wsKpi.getCell('A4').font = { name: 'Segoe UI', size: 12, bold: true, color: { argb: COLORS.brandRed } };
  wsKpi.getRow(4).height = 24;

  const kpiTableHeaders = ['Indicateur Financier / Stratégique', 'Valeur Réalisée', 'Unité / Devise', 'Commentaires & Statut'];
  const row5 = wsKpi.getRow(5);
  kpiTableHeaders.forEach((h, idx) => {
    const c = row5.getCell(idx + 1);
    c.value = h;
    c.font = { name: 'Segoe UI', size: 10, bold: true, color: { argb: COLORS.white } };
    c.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: COLORS.brandNavy } };
    c.alignment = { horizontal: idx === 0 ? 'left' : 'center', vertical: 'middle' };
  });
  row5.height = 24;

  const rentedVehiclesCount = vehicles.filter(v => v.status === 'RENTED').length;
  const occupancyRate = vehicles.length > 0 ? (rentedVehiclesCount / vehicles.length) : 0;

  let liquidCash = 0;
  let bankAndCheques = 0;
  transactions.forEach(tx => {
    const isInc = tx.type.startsWith('INCOME_');
    const amt = isInc ? tx.amountDzd : -tx.amountDzd;
    if (tx.paymentMethod === 'CASH') {
      liquidCash += amt;
    } else {
      bankAndCheques += amt;
    }
  });

  const kpis = [
    { label: "Chiffre d'Affaires Global (CA Brut)", val: summary.totalIncome, unit: 'DZD', note: 'Total des loyers et pénalités facturés', format: '#,##0 "DZD"' },
    { label: "Total des Dépenses d'Exploitation", val: summary.totalExpenses, unit: 'DZD', note: 'Entretien, carburant, assurances, frais divers', format: '#,##0 "DZD"' },
    { label: "Bénéfice Net d'Exploitation", val: summary.netProfit, unit: 'DZD', note: 'Marge bénéficiaire nette réalisée', format: '#,##0 "DZD"' },
    { label: "Liquidités Disponibles en Caisse (Espèces)", val: liquidCash, unit: 'DZD', note: 'Fonds disponibles au tiroir-caisse', format: '#,##0 "DZD"' },
    { label: "Avoirs Bancaires & Chèques CCP", val: bankAndCheques, unit: 'DZD', note: 'Paiements par virements et chèques', format: '#,##0 "DZD"' },
    { label: "Total Cautions Actives sous Séquestre", val: summary.totalCautionsInEscrow, unit: 'DZD', note: 'Dépôts de garantie conservés pour les locations en cours', format: '#,##0 "DZD"' },
    { label: "Taux d'Occupation Actuel de la Flotte", val: occupancyRate, unit: '%', note: `${rentedVehiclesCount} véhicules loués sur ${vehicles.length} au total`, format: '0.0%' },
    { label: "Nombre Total de Locations Traitées", val: rentals.length, unit: 'Contrats', note: 'Historique des contrats signés', format: '#,##0' },
    { label: "Taille Totale du Parc Automobile", val: vehicles.length, unit: 'Véhicules', note: 'Véhicules actifs gérés dans le système', format: '#,##0' },
  ];

  kpis.forEach((item, i) => {
    const row = wsKpi.getRow(6 + i);
    row.height = 20;

    const c1 = row.getCell(1);
    c1.value = item.label;
    c1.font = { name: 'Segoe UI', size: 10, bold: i === 2 || i === 0 };
    c1.border = BORDER_THIN;
    c1.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: i % 2 === 0 ? COLORS.white : COLORS.lightBg } };

    const c2 = row.getCell(2);
    c2.value = item.val;
    c2.font = { name: 'Segoe UI', size: 10, bold: true, color: { argb: i === 2 ? COLORS.greenText : COLORS.brandNavy } };
    c2.numFmt = item.format;
    c2.alignment = { horizontal: 'right' };
    c2.border = BORDER_THIN;
    c2.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: i === 2 ? COLORS.greenFill : (i % 2 === 0 ? COLORS.white : COLORS.lightBg) } };

    const c3 = row.getCell(3);
    c3.value = item.unit;
    c3.font = { name: 'Segoe UI', size: 10, italic: true };
    c3.alignment = { horizontal: 'center' };
    c3.border = BORDER_THIN;
    c3.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: i % 2 === 0 ? COLORS.white : COLORS.lightBg } };

    const c4 = row.getCell(4);
    c4.value = item.note;
    c4.font = { name: 'Segoe UI', size: 9, color: { argb: '64748B' } };
    c4.border = BORDER_THIN;
    c4.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: i % 2 === 0 ? COLORS.white : COLORS.lightBg } };
  });

  wsKpi.getColumn(1).width = 42;
  wsKpi.getColumn(2).width = 24;
  wsKpi.getColumn(3).width = 16;
  wsKpi.getColumn(4).width = 52;


  // ===========================================================================
  // SHEET 2: RENTABILITÉ DE LA FLOTTE (الأداء والمردودية حسب كل سيارة)
  // ===========================================================================
  const wsFleet = workbook.addWorksheet('2. Rentabilité Flotte', {
    properties: { tabColor: { argb: COLORS.brandRed } },
    views: [{ state: 'frozen', ySplit: 2, showGridLines: true }]
  });

  // Title
  wsFleet.mergeCells('A1:L1');
  const fleetTitle = wsFleet.getCell('A1');
  fleetTitle.value = "ANALYSE DE RENTABILITÉ DE LA FLOTTE & ROTATION DU PARC AUTOMOBILE (IM LOCATION)";
  fleetTitle.font = { name: 'Segoe UI', size: 12, bold: true, color: { argb: COLORS.white } };
  fleetTitle.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: COLORS.brandDark } };
  fleetTitle.alignment = { horizontal: 'center', vertical: 'middle' };
  wsFleet.getRow(1).height = 30;

  const fleetHeaders = [
    'N°', 'Immatriculation DZ', 'Marque & Modèle', 'Catégorie', 'Année',
    'Tarif Journalier', 'Nb Locations', 'Jours Facturés', 'CA Brut (DZD)',
    'Frais Entretien (DZD)', 'Marge Nette (DZD)', 'Statut Actuel'
  ];

  const fleetHRow = wsFleet.getRow(2);
  fleetHRow.height = 26;
  fleetHeaders.forEach((h, idx) => {
    const c = fleetHRow.getCell(idx + 1);
    c.value = h;
    c.font = { name: 'Segoe UI', size: 10, bold: true, color: { argb: COLORS.white } };
    c.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: COLORS.brandNavy } };
    c.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
  });

  let fleetRowIdx = 3;
  vehicles.forEach((v, idx) => {
    const vehRentals = rentals.filter(r => r.vehicleId === v.id && r.status !== 'CANCELLED');
    const totalDays = vehRentals.reduce((sum, r) => sum + r.durationDays, 0);
    const grossIncome = vehRentals.reduce((sum, r) => sum + r.totalRentDzd, 0);
    const maintTxs = transactions.filter(t => t.relatedVehicleId === v.id && t.type === 'EXPENSE_MAINTENANCE');
    const totalMaint = maintTxs.reduce((sum, t) => sum + t.amountDzd, 0);
    const netMargin = grossIncome - totalMaint;

    const row = wsFleet.getRow(fleetRowIdx);
    row.height = 22;
    const isEven = idx % 2 === 0;
    const rowBg = isEven ? COLORS.white : COLORS.lightBg;

    row.getCell(1).value = idx + 1;
    row.getCell(1).alignment = { horizontal: 'center' };

    row.getCell(2).value = v.matricule;
    row.getCell(2).font = { name: 'Consolas', size: 10, bold: true };
    row.getCell(2).alignment = { horizontal: 'center' };

    row.getCell(3).value = `${v.brand} ${v.model}`;
    row.getCell(3).font = { name: 'Segoe UI', size: 10, bold: true };

    row.getCell(4).value = v.category;
    row.getCell(4).alignment = { horizontal: 'center' };

    row.getCell(5).value = v.year;
    row.getCell(5).alignment = { horizontal: 'center' };

    row.getCell(6).value = v.dailyRate;
    row.getCell(6).numFmt = '#,##0 "DZD"';

    row.getCell(7).value = vehRentals.length;
    row.getCell(7).alignment = { horizontal: 'center' };

    row.getCell(8).value = totalDays;
    row.getCell(8).alignment = { horizontal: 'center' };

    row.getCell(9).value = grossIncome;
    row.getCell(9).numFmt = '#,##0 "DZD"';
    row.getCell(9).font = { bold: true };

    row.getCell(10).value = totalMaint;
    row.getCell(10).numFmt = '#,##0 "DZD"';
    row.getCell(10).font = { color: { argb: totalMaint > 0 ? COLORS.redText : '64748B' } };

    row.getCell(11).value = netMargin;
    row.getCell(11).numFmt = '#,##0 "DZD"';
    row.getCell(11).font = { bold: true, color: { argb: netMargin >= 0 ? COLORS.greenText : COLORS.redText } };

    row.getCell(12).value = v.status;
    row.getCell(12).alignment = { horizontal: 'center' };
    row.getCell(12).font = { bold: true, size: 9 };
    if (v.status === 'AVAILABLE') {
      row.getCell(12).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: COLORS.greenFill } };
      row.getCell(12).font = { bold: true, color: { argb: COLORS.greenText }, size: 9 };
    } else if (v.status === 'RENTED') {
      row.getCell(12).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: COLORS.blueFill } };
      row.getCell(12).font = { bold: true, color: { argb: COLORS.blueText }, size: 9 };
    } else {
      row.getCell(12).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: COLORS.amberFill } };
      row.getCell(12).font = { bold: true, color: { argb: COLORS.amberText }, size: 9 };
    }

    // Apply borders and fill
    for (let c = 1; c <= 11; c++) {
      const cell = row.getCell(c);
      cell.border = BORDER_THIN;
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: rowBg } };
    }
    row.getCell(12).border = BORDER_THIN;

    fleetRowIdx++;
  });

  // Total Summary Row
  const totalFleetRow = wsFleet.getRow(fleetRowIdx);
  totalFleetRow.height = 26;
  totalFleetRow.getCell(1).value = '';
  totalFleetRow.getCell(2).value = '';
  totalFleetRow.getCell(3).value = 'TOTAL GÉNÉRAL DU PARC';
  totalFleetRow.getCell(3).font = { name: 'Segoe UI', size: 10, bold: true, color: { argb: COLORS.white } };
  totalFleetRow.getCell(7).value = { formula: `SUM(G3:G${fleetRowIdx - 1})` };
  totalFleetRow.getCell(8).value = { formula: `SUM(H3:H${fleetRowIdx - 1})` };
  totalFleetRow.getCell(9).value = { formula: `SUM(I3:I${fleetRowIdx - 1})` };
  totalFleetRow.getCell(10).value = { formula: `SUM(J3:J${fleetRowIdx - 1})` };
  totalFleetRow.getCell(11).value = { formula: `SUM(K3:K${fleetRowIdx - 1})` };

  [7, 8].forEach(c => {
    totalFleetRow.getCell(c).font = { bold: true, color: { argb: COLORS.white } };
    totalFleetRow.getCell(c).alignment = { horizontal: 'center' };
  });

  [9, 10, 11].forEach(c => {
    const cell = totalFleetRow.getCell(c);
    cell.font = { bold: true, color: { argb: COLORS.brandAmber } };
    cell.numFmt = '#,##0 "DZD"';
  });

  for (let c = 1; c <= 12; c++) {
    const cell = totalFleetRow.getCell(c);
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: COLORS.brandDark } };
    cell.border = BORDER_TOTAL;
  }

  // Adjust column widths
  wsFleet.columns = [
    { width: 6 },   // N°
    { width: 18 },  // Immatriculation DZ
    { width: 26 },  // Marque & Modèle
    { width: 14 },  // Catégorie
    { width: 8 },   // Année
    { width: 16 },  // Tarif Journalier
    { width: 14 },  // Nb Locations
    { width: 14 },  // Jours Facturés
    { width: 18 },  // CA Brut
    { width: 18 },  // Frais Entretien
    { width: 18 },  // Marge Nette
    { width: 16 },  // Statut Actuel
  ];


  // ===========================================================================
  // SHEET 3: GRAND LIVRE DES CONTRATS (سجل العقود الشامل والتفصيلي)
  // ===========================================================================
  const wsContracts = workbook.addWorksheet('3. Grand Livre Contrats', {
    properties: { tabColor: { argb: COLORS.brandNavy } },
    views: [{ state: 'frozen', ySplit: 2, showGridLines: true }]
  });

  // Title
  wsContracts.mergeCells('A1:U1');
  const contractsTitle = wsContracts.getCell('A1');
  contractsTitle.value = "GRAND LIVRE OFFICIEL DES CONTRATS DE LOCATION & AUDIT CLIENTS (IM LOCATION)";
  contractsTitle.font = { name: 'Segoe UI', size: 12, bold: true, color: { argb: COLORS.white } };
  contractsTitle.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: COLORS.brandDark } };
  contractsTitle.alignment = { horizontal: 'center', vertical: 'middle' };
  wsContracts.getRow(1).height = 30;

  const contractHeaders = [
    'N° Contrat', 'Nom & Prénom Client', 'Date Naissance', 'Lieu Naissance',
    'N° CIN / Passeport', 'N° Permis', 'Téléphone', 'Véhicule',
    'Immatriculation DZ', 'Date Départ', 'Date Retour Prévue', 'Retour Réel',
    'Durée (J)', 'Tarif / J', 'Total TTC (DZD)', 'Avance Versée',
    'Reste à Payer', 'Caution DZD', 'Mode Caution', 'Km Départ', 'Statut Contrat'
  ];

  const contHRow = wsContracts.getRow(2);
  contHRow.height = 26;
  contractHeaders.forEach((h, idx) => {
    const c = contHRow.getCell(idx + 1);
    c.value = h;
    c.font = { name: 'Segoe UI', size: 9, bold: true, color: { argb: COLORS.white } };
    c.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: COLORS.brandNavy } };
    c.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
  });

  let contRowIdx = 3;
  rentals.forEach((r, idx) => {
    const row = wsContracts.getRow(contRowIdx);
    row.height = 20;
    const isEven = idx % 2 === 0;
    const rowBg = isEven ? COLORS.white : COLORS.lightBg;

    row.getCell(1).value = r.contractNumber;
    row.getCell(1).font = { name: 'Consolas', size: 9, bold: true, color: { argb: COLORS.brandRed } };
    row.getCell(1).alignment = { horizontal: 'center' };

    row.getCell(2).value = r.customerSnapshot.fullName;
    row.getCell(2).font = { name: 'Segoe UI', size: 9, bold: true };

    row.getCell(3).value = r.customerSnapshot.birthDate || '—';
    row.getCell(3).alignment = { horizontal: 'center' };

    row.getCell(4).value = r.customerSnapshot.birthPlace || r.customerSnapshot.wilaya || '—';

    row.getCell(5).value = r.customerSnapshot.cinOrPassport;
    row.getCell(5).font = { name: 'Consolas', size: 9 };
    row.getCell(5).alignment = { horizontal: 'center' };

    row.getCell(6).value = r.customerSnapshot.drivingLicenseNumber;
    row.getCell(6).font = { name: 'Consolas', size: 9 };
    row.getCell(6).alignment = { horizontal: 'center' };

    row.getCell(7).value = r.customerSnapshot.phone;
    row.getCell(7).alignment = { horizontal: 'center' };

    row.getCell(8).value = `${r.vehicleSnapshot.brand} ${r.vehicleSnapshot.model}`;
    row.getCell(9).value = r.vehicleSnapshot.matricule;
    row.getCell(9).font = { name: 'Consolas', size: 9, bold: true };
    row.getCell(9).alignment = { horizontal: 'center' };

    row.getCell(10).value = r.startDate;
    row.getCell(10).alignment = { horizontal: 'center' };

    row.getCell(11).value = r.expectedEndDate;
    row.getCell(11).alignment = { horizontal: 'center' };

    row.getCell(12).value = r.actualReturnDate || 'En cours';
    row.getCell(12).alignment = { horizontal: 'center' };

    row.getCell(13).value = r.durationDays;
    row.getCell(13).alignment = { horizontal: 'center' };

    row.getCell(14).value = r.dailyRateDzd;
    row.getCell(14).numFmt = '#,##0 "DZD"';

    row.getCell(15).value = r.totalRentDzd;
    row.getCell(15).numFmt = '#,##0 "DZD"';
    row.getCell(15).font = { bold: true };

    row.getCell(16).value = r.advancePaymentDzd;
    row.getCell(16).numFmt = '#,##0 "DZD"';
    row.getCell(16).font = { color: { argb: COLORS.greenText } };

    row.getCell(17).value = r.remainingBalanceDzd;
    row.getCell(17).numFmt = '#,##0 "DZD"';
    row.getCell(17).font = { color: { argb: r.remainingBalanceDzd > 0 ? COLORS.redText : '64748B' }, bold: r.remainingBalanceDzd > 0 };

    row.getCell(18).value = r.cautionDzd;
    row.getCell(18).numFmt = '#,##0 "DZD"';
    row.getCell(18).font = { color: { argb: COLORS.amberText } };

    row.getCell(19).value = r.cautionPaymentMethod;
    row.getCell(19).alignment = { horizontal: 'center' };

    row.getCell(20).value = r.startKm;
    row.getCell(20).numFmt = '#,##0 "KM"';
    row.getCell(20).alignment = { horizontal: 'right' };

    row.getCell(21).value = r.status;
    row.getCell(21).alignment = { horizontal: 'center' };
    row.getCell(21).font = { bold: true, size: 8 };

    if (r.status === 'ACTIVE') {
      row.getCell(21).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: COLORS.greenFill } };
      row.getCell(21).font = { bold: true, color: { argb: COLORS.greenText }, size: 8 };
    } else if (r.status === 'COMPLETED') {
      row.getCell(21).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: COLORS.blueFill } };
      row.getCell(21).font = { bold: true, color: { argb: COLORS.blueText }, size: 8 };
    } else {
      row.getCell(21).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: COLORS.redFill } };
      row.getCell(21).font = { bold: true, color: { argb: COLORS.redText }, size: 8 };
    }

    for (let c = 1; c <= 20; c++) {
      const cell = row.getCell(c);
      cell.border = BORDER_THIN;
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: rowBg } };
    }
    row.getCell(21).border = BORDER_THIN;

    contRowIdx++;
  });

  // Total summary row
  const totalContRow = wsContracts.getRow(contRowIdx);
  totalContRow.height = 26;
  totalContRow.getCell(2).value = 'TOTAUX DES CONTRATS';
  totalContRow.getCell(2).font = { name: 'Segoe UI', size: 10, bold: true, color: { argb: COLORS.white } };
  totalContRow.getCell(13).value = { formula: `SUM(M3:M${contRowIdx - 1})` };
  totalContRow.getCell(15).value = { formula: `SUM(O3:O${contRowIdx - 1})` };
  totalContRow.getCell(16).value = { formula: `SUM(P3:P${contRowIdx - 1})` };
  totalContRow.getCell(17).value = { formula: `SUM(Q3:Q${contRowIdx - 1})` };
  totalContRow.getCell(18).value = { formula: `SUM(R3:R${contRowIdx - 1})` };

  [15, 16, 17, 18].forEach(c => {
    const cell = totalContRow.getCell(c);
    cell.font = { bold: true, color: { argb: COLORS.brandAmber } };
    cell.numFmt = '#,##0 "DZD"';
  });

  for (let c = 1; c <= 21; c++) {
    const cell = totalContRow.getCell(c);
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: COLORS.brandDark } };
    cell.border = BORDER_TOTAL;
  }

  // Column widths
  wsContracts.columns = [
    { width: 14 },  // N° Contrat
    { width: 22 },  // Client
    { width: 14 },  // Date Naissance
    { width: 16 },  // Lieu Naissance
    { width: 16 },  // CIN
    { width: 16 },  // Permis
    { width: 15 },  // Tél
    { width: 22 },  // Véhicule
    { width: 16 },  // Matricule
    { width: 13 },  // Départ
    { width: 13 },  // Retour Prévu
    { width: 13 },  // Retour Réel
    { width: 10 },  // Durée
    { width: 14 },  // Tarif/J
    { width: 16 },  // Total
    { width: 15 },  // Avance
    { width: 15 },  // Reste
    { width: 15 },  // Caution
    { width: 14 },  // Mode Caution
    { width: 13 },  // Km Départ
    { width: 13 },  // Statut
  ];


  // ===========================================================================
  // SHEET 4: JOURNAL DES FLUX DE CAISSE (حركات وتدفقات الصندوق)
  // ===========================================================================
  const wsCash = workbook.addWorksheet('4. Flux & Journal Caisse', {
    properties: { tabColor: { argb: '10B981' } },
    views: [{ state: 'frozen', ySplit: 2, showGridLines: true }]
  });

  // Title
  wsCash.mergeCells('A1:G1');
  const cashTitle = wsCash.getCell('A1');
  cashTitle.value = "JOURNAL GÉNÉRAL DES FLUX DE TRÉSORERIE & OPÉRATIONS DE CAISSE (IM LOCATION)";
  cashTitle.font = { name: 'Segoe UI', size: 12, bold: true, color: { argb: COLORS.white } };
  cashTitle.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: COLORS.brandDark } };
  cashTitle.alignment = { horizontal: 'center', vertical: 'middle' };
  wsCash.getRow(1).height = 30;

  const cashHeaders = [
    'Date Opération', 'Type d’Opération', 'Libellé & Justificatif',
    'Mode de Paiement', 'Entrées / Recettes (DZD)', 'Sorties / Dépenses (DZD)', 'Opérateur / Responsable'
  ];

  const cashHRow = wsCash.getRow(2);
  cashHRow.height = 26;
  cashHeaders.forEach((h, idx) => {
    const c = cashHRow.getCell(idx + 1);
    c.value = h;
    c.font = { name: 'Segoe UI', size: 10, bold: true, color: { argb: COLORS.white } };
    c.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: COLORS.brandNavy } };
    c.alignment = { horizontal: 'center', vertical: 'middle' };
  });

  let cashRowIdx = 3;
  transactions.forEach((tx, idx) => {
    const row = wsCash.getRow(cashRowIdx);
    row.height = 20;
    const isEven = idx % 2 === 0;
    const rowBg = isEven ? COLORS.white : COLORS.lightBg;
    const isIncome = tx.type.startsWith('INCOME_');

    row.getCell(1).value = tx.date;
    row.getCell(1).alignment = { horizontal: 'center' };

    row.getCell(2).value = tx.type;
    row.getCell(2).font = { name: 'Consolas', size: 9 };

    row.getCell(3).value = tx.description;
    row.getCell(3).font = { name: 'Segoe UI', size: 9 };

    row.getCell(4).value = tx.paymentMethod;
    row.getCell(4).alignment = { horizontal: 'center' };
    row.getCell(4).font = { bold: true, size: 9 };

    row.getCell(5).value = isIncome ? tx.amountDzd : 0;
    row.getCell(5).numFmt = '#,##0 "DZD"';
    row.getCell(5).font = { bold: isIncome, color: { argb: isIncome ? COLORS.greenText : '94A3B8' } };

    row.getCell(6).value = !isIncome ? tx.amountDzd : 0;
    row.getCell(6).numFmt = '#,##0 "DZD"';
    row.getCell(6).font = { bold: !isIncome, color: { argb: !isIncome ? COLORS.redText : '94A3B8' } };

    row.getCell(7).value = tx.recordedBy;
    row.getCell(7).font = { italic: true, size: 9 };

    for (let c = 1; c <= 7; c++) {
      const cell = row.getCell(c);
      cell.border = BORDER_THIN;
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: rowBg } };
    }

    cashRowIdx++;
  });

  // Total Summary
  const totalCashRow = wsCash.getRow(cashRowIdx);
  totalCashRow.height = 26;
  totalCashRow.getCell(3).value = 'TOTAUX DES FLUX DE CAISSE';
  totalCashRow.getCell(3).font = { name: 'Segoe UI', size: 10, bold: true, color: { argb: COLORS.white } };
  totalCashRow.getCell(5).value = { formula: `SUM(E3:E${cashRowIdx - 1})` };
  totalCashRow.getCell(6).value = { formula: `SUM(F3:F${cashRowIdx - 1})` };

  [5, 6].forEach(c => {
    const cell = totalCashRow.getCell(c);
    cell.font = { bold: true, color: { argb: COLORS.brandAmber } };
    cell.numFmt = '#,##0 "DZD"';
  });

  for (let c = 1; c <= 7; c++) {
    const cell = totalCashRow.getCell(c);
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: COLORS.brandDark } };
    cell.border = BORDER_TOTAL;
  }

  // Column widths
  wsCash.columns = [
    { width: 14 },  // Date
    { width: 24 },  // Type
    { width: 42 },  // Libellé
    { width: 18 },  // Mode
    { width: 22 },  // Entrées
    { width: 22 },  // Sorties
    { width: 24 },  // Opérateur
  ];

  // Write and return buffer
  const buffer = await workbook.xlsx.writeBuffer();
  return new Blob([buffer], { 
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' 
  });
}

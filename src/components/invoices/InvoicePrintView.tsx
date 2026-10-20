import React, { useState } from 'react';
import { Printer, X, Download, Loader2 } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { dbStore } from '../../db/store';
import { printElement, downloadElementAsPdf } from '../../utils/printPdf';
import { tafqeetArabic, numberToWordsFrench } from '../../utils/numberToWords';

export const InvoicePrintView: React.FC = () => {
  const { invoiceToPrint, setInvoiceToPrint, t, language, addToast } = useApp();
  const settings = dbStore.getSettings();
  const [isDownloadingPdf, setIsDownloadingPdf] = useState(false);

  if (!invoiceToPrint) return null;

  const handlePrint = () => {
    printElement('printable-invoice', `Facture-${invoiceToPrint.invoiceNumber}`);
  };

  const handleDownloadPdf = async () => {
    setIsDownloadingPdf(true);
    try {
      const ok = await downloadElementAsPdf('printable-invoice', `Facture-${invoiceToPrint.invoiceNumber}`);
      if (ok) {
        addToast(language === 'ar' ? 'تم تنزيل الفاتورة بصيغة PDF' : 'Facture PDF téléchargée avec succès', 'success');
      }
    } catch {
      addToast(language === 'ar' ? 'حدث خطأ أثناء تنزيل الفاتورة' : 'Erreur téléchargement facture', 'error');
    } finally {
      setIsDownloadingPdf(false);
    }
  };

  const formatDzd = (n: number) => {
    return new Intl.NumberFormat('fr-FR', {
      maximumFractionDigits: 0
    }).format(n) + ' DZD';
  };

  const customer = dbStore.getCustomerById(invoiceToPrint.customerId);
  const frenchTafqeet = numberToWordsFrench(invoiceToPrint.totalAmountDzd);
  const arabicTafqeet = tafqeetArabic(invoiceToPrint.totalAmountDzd);

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4 overflow-y-auto print-document-overlay">
      {/* Floating Toolbar */}
      <div className="fixed top-4 z-50 flex items-center gap-2 print:hidden bg-neutral-900/90 border border-neutral-700 p-2 rounded-xl shadow-xl">
        <button
          onClick={handlePrint}
          className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-amber-500 hover:bg-amber-400 text-neutral-950 font-bold text-xs cursor-pointer shadow-md font-bukra italic"
        >
          <Printer className="w-4 h-4 stroke-[2.5]" />
          <span>{t.printInvoice} (A4)</span>
        </button>

        <button
          onClick={handleDownloadPdf}
          disabled={isDownloadingPdf}
          className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs cursor-pointer shadow-md font-bukra italic disabled:opacity-50"
        >
          {isDownloadingPdf ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Download className="w-4 h-4 stroke-[2.5]" />
          )}
          <span>{language === 'ar' ? 'تنزيل PDF' : 'Télécharger PDF'}</span>
        </button>

        <button
          onClick={() => setInvoiceToPrint(null)}
          className="p-2 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-neutral-300 cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* A4 Sheet Container (Single Page Guaranteed) */}
      <div 
        id="printable-invoice"
        className="w-full max-w-[210mm] h-[297mm] max-h-[297mm] bg-white text-neutral-900 p-6 sm:p-8 rounded-xl shadow-2xl my-4 print:m-0 print:p-[6mm_8mm] print:w-[210mm] print:h-[297mm] print:max-h-[297mm] print:shadow-none print:rounded-none select-text font-sans text-xs leading-normal border border-neutral-200 overflow-hidden box-border flex flex-col justify-between"
      >
        {/* Top Dark Bar - Tax & Registration Identifiers */}
        <div className="bg-neutral-950 text-white px-4 py-2 rounded-md flex items-center justify-between font-sans shrink-0">
          <div className="flex items-center gap-4 text-[9px] font-mono">
            <div>
              <span className="text-neutral-400 uppercase block">RC :</span>
              <span className="font-bold">{settings.rc || '16/01-4962353A20'}</span>
            </div>
            <div>
              <span className="text-neutral-400 uppercase block">NIF :</span>
              <span className="font-bold">{settings.nif || '002016014962353'}</span>
            </div>
            <div>
              <span className="text-neutral-400 uppercase block">NIS :</span>
              <span className="font-bold">{settings.nis || '199216010045231'}</span>
            </div>
          </div>
          <div className="text-end text-[9px] font-mono">
            <span className="text-neutral-400 uppercase block">CONTACT :</span>
            <span className="font-bold text-xs">{settings.phone1 || '0551 96 29 74'}</span>
          </div>
        </div>

        {/* Logo & Invoice Title Header */}
        <div className="flex items-center justify-between py-2 border-b border-neutral-200 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 bg-red-600 rounded-lg flex items-center justify-center text-white font-black text-xl italic font-bukra shrink-0">
              IM
            </div>
            <div>
              <h1 className="text-2xl font-black tracking-tight text-neutral-950 font-bukra italic leading-tight">
                IM LOCATION
              </h1>
              <p className="text-[9px] tracking-widest uppercase text-neutral-600 font-bold font-sans">
                LOCATION DE VÉHICULES SANS CHAUFFEUR · KRAA DE VOITURES
              </p>
              <p className="text-[9px] text-neutral-500 font-sans">
                {settings.address || 'Bordj Bou Arreridj / Alger'} — {settings.city}
              </p>
            </div>
          </div>

          <div className="border border-neutral-300 rounded-lg px-4 py-2 text-center bg-white min-w-[210px] shrink-0">
            <div className="text-xs font-black tracking-wider uppercase text-neutral-900 font-sans">
              FACTURE OFFICIELLE
            </div>
            <div className="text-xs font-mono font-bold text-neutral-700 mt-0.5">
              N° : <span className="text-neutral-900 font-extrabold tracking-wide">{invoiceToPrint.invoiceNumber}</span>
            </div>
            <div className="text-[10px] text-neutral-500 font-mono mt-0.5">
              Date : {invoiceToPrint.date}
            </div>
          </div>
        </div>

        {/* Main Content Blocks */}
        <div className="space-y-2.5 flex-1 flex flex-col justify-around py-1">
          {/* Box 1: INFORMATION CLIENT & FACTURATION */}
          <div className="border border-neutral-300 rounded-lg p-2.5 bg-white">
            <div className="flex items-center gap-1.5 mb-1.5">
              <span className="w-1.5 h-3.5 bg-red-600 rounded-xs inline-block" />
              <h3 className="text-[11px] font-black tracking-wider uppercase text-neutral-900">
                DOIT / FACTURÉ À (CLIENT)
              </h3>
            </div>
            <div className="grid grid-cols-4 gap-2 text-[11px]">
              <div>
                <span className="text-[9px] uppercase text-neutral-500 block font-semibold">NOM ET PRÉNOM / RAISON</span>
                <span className="font-bold text-neutral-900 block truncate">{invoiceToPrint.customerName || 'Client Particulier'}</span>
              </div>
              <div>
                <span className="text-[9px] uppercase text-neutral-500 block font-semibold">TÉLÉPHONE</span>
                <span className="font-mono font-bold text-neutral-900 block">{customer?.phone || settings.phone1}</span>
              </div>
              <div>
                <span className="text-[9px] uppercase text-neutral-500 block font-semibold">CIN / PASSEPORT</span>
                <span className="font-mono text-neutral-800 block">{customer?.cinOrPassport || '16-092812'}</span>
              </div>
              <div>
                <span className="text-[9px] uppercase text-neutral-500 block font-semibold">ADRESSE & WILAYA</span>
                <span className="font-medium text-neutral-800 block truncate">{customer?.address || 'Alger'} ({customer?.wilaya || '16'})</span>
              </div>
            </div>
          </div>

          {/* Box 2: PRESTATION & VÉHICULE */}
          <div className="border border-neutral-300 rounded-lg p-2.5 bg-white">
            <div className="flex items-center gap-1.5 mb-1.5">
              <span className="w-1.5 h-3.5 bg-red-600 rounded-xs inline-block" />
              <h3 className="text-[11px] font-black tracking-wider uppercase text-neutral-900">
                VÉHICULE ET DÉTAILS DU CONTRAT
              </h3>
            </div>
            <div className="grid grid-cols-4 gap-2 text-[11px]">
              <div>
                <span className="text-[9px] uppercase text-neutral-500 block font-semibold">MARQUE & MODÈLE</span>
                <span className="font-bold text-neutral-900 block truncate">{invoiceToPrint.vehicleModel}</span>
              </div>
              <div>
                <span className="text-[9px] uppercase text-neutral-500 block font-semibold">IMMATRICULATION DZ</span>
                <span className="font-black font-mono text-neutral-900 block">{invoiceToPrint.vehicleMatricule}</span>
              </div>
              <div>
                <span className="text-[9px] uppercase text-neutral-500 block font-semibold">N° CONTRAT ASSOCIÉ</span>
                <span className="font-mono text-neutral-800 block">{invoiceToPrint.contractId || 'CTR-2026-DZ'}</span>
              </div>
              <div>
                <span className="text-[9px] uppercase text-neutral-500 block font-semibold">MODE DE RÈGLEMENT</span>
                <span className="font-bold text-neutral-900 block">{invoiceToPrint.paymentMethod || 'Espèces / Virement'}</span>
              </div>
            </div>
          </div>

          {/* Box 3: TABLE DÉTAIL DE FACTURATION */}
          <div className="rounded-lg overflow-hidden border border-neutral-950">
            <div className="grid grid-cols-12 bg-neutral-950 text-white text-[10px] font-black tracking-wider uppercase py-2 px-3">
              <div className="col-span-6">DÉSIGNATION DE LA PRESTATION</div>
              <div className="col-span-2 text-end">MONTANT HT</div>
              <div className="col-span-2 text-end">TVA ({invoiceToPrint.tvaRatePercent || 19}%)</div>
              <div className="col-span-2 text-end">TOTAL TTC</div>
            </div>
            <div className="grid grid-cols-12 py-2.5 px-3 text-xs bg-white border-t border-neutral-200 items-center">
              <div className="col-span-6 font-bold text-neutral-900 truncate">
                Location de véhicule automobile sans chauffeur ({invoiceToPrint.vehicleModel} - {invoiceToPrint.vehicleMatricule})
              </div>
              <div className="col-span-2 text-end font-mono font-medium">
                {formatDzd(invoiceToPrint.subtotalDzd)}
              </div>
              <div className="col-span-2 text-end font-mono text-neutral-700">
                {formatDzd(invoiceToPrint.tvaAmountDzd)}
              </div>
              <div className="col-span-2 text-end font-mono font-black text-neutral-950">
                {formatDzd(invoiceToPrint.totalAmountDzd)}
              </div>
            </div>
          </div>

          {/* Box 4: TOTAL BREAKDOWN & TAFQEET */}
          <div className="grid grid-cols-12 gap-3 items-start">
            {/* Left: Official Tafqeet (Arrete la présente facture / أوقفت الفاتورة) */}
            <div className="col-span-7 border border-neutral-300 rounded-lg p-2.5 bg-neutral-50/50 space-y-1.5">
              <div className="text-[10px] font-black uppercase text-neutral-700">
                ARRÊTÉ DE LA FACTURE EN TOUTES LETTRES / التفقيط الرسمي :
              </div>
              <div className="text-[10px] text-neutral-800 font-medium italic border-b border-neutral-200 pb-1">
                {frenchTafqeet}
              </div>
              <div className="text-[10px] text-neutral-900 font-bold font-bukra italic pt-0.5 text-end" dir="rtl">
                {arabicTafqeet}
              </div>
            </div>

            {/* Right: Numerical Breakdown */}
            <div className="col-span-5 border border-neutral-300 rounded-lg overflow-hidden bg-white text-xs">
              <div className="p-2 space-y-1">
                <div className="flex items-center justify-between pb-1 border-b border-neutral-200 text-neutral-700">
                  <span className="font-medium">Total Hors Taxe (HT) :</span>
                  <span className="font-mono font-bold">{formatDzd(invoiceToPrint.subtotalDzd)}</span>
                </div>
                <div className="flex items-center justify-between pb-1 border-b border-neutral-200 text-neutral-700">
                  <span className="font-medium">TVA Réglementaire (19%) :</span>
                  <span className="font-mono font-bold">{formatDzd(invoiceToPrint.tvaAmountDzd)}</span>
                </div>
                <div className="flex items-center justify-between text-neutral-700">
                  <span className="font-medium">Droit de Timbre Fiscal :</span>
                  <span className="font-mono font-bold">{formatDzd(invoiceToPrint.timbreFiscalDzd || 0)}</span>
                </div>
              </div>
              <div className="bg-neutral-950 text-white px-3 py-2 flex items-center justify-between font-black">
                <span className="text-xs uppercase tracking-wider">NET À PAYER (TTC) :</span>
                <span className="font-mono text-sm tracking-wide text-amber-400">
                  {formatDzd(invoiceToPrint.totalAmountDzd)}
                </span>
              </div>
            </div>
          </div>

          {/* Signature Area */}
          <div className="grid grid-cols-2 gap-4">
            <div className="border border-neutral-300 rounded-lg p-2.5 h-22 flex flex-col justify-between bg-white">
              <span className="font-black uppercase text-neutral-900 text-[11px]">CACHE ET SIGNATURE GÉRANT</span>
              <span className="text-neutral-400 italic text-[9px] text-end">Pour IM LOCATION</span>
            </div>

            <div className="border border-neutral-300 rounded-lg p-2.5 h-22 flex flex-col justify-between bg-white">
              <span className="font-black uppercase text-neutral-900 text-[11px]">SIGNATURE DU CLIENT (BON POUR ACCORD)</span>
              <span className="text-neutral-400 italic text-[9px] text-end">Lu et approuvé</span>
            </div>
          </div>

          {/* Mandatory Footer Banner */}
          <div className="border border-red-300 bg-red-50/40 rounded-lg py-1.5 px-4 text-center font-bold text-red-600 text-xs tracking-wide shrink-0">
            * MERCI DE VOTRE CONFIANCE - IM LOCATION LOCATION DE VÉHICULES *
          </div>
        </div>
      </div>
    </div>
  );
};

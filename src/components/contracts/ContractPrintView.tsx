import React, { useState, useEffect } from 'react';
import { 
  Printer, X, FileText, Receipt, Download, Loader2,
  User, Phone, Car, DollarSign, Calendar, MapPin
} from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import { useApp } from '../../context/AppContext';
import { dbStore } from '../../db/store';
import { printElement, downloadElementAsPdf } from '../../utils/printPdf';

// SVG Icons matching the official template
const FacebookSvg = () => (
  <svg className="w-4 h-4 fill-white" viewBox="0 0 24 24">
    <path d="M22 12c0-5.523-4.477-10-10-10S2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.878v-6.987h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.988C18.343 21.128 22 16.991 22 12z" />
  </svg>
);

const InstagramSvg = () => (
  <svg className="w-4 h-4 fill-white" viewBox="0 0 24 24">
    <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
  </svg>
);

const WhatsAppSvg = () => (
  <svg className="w-4 h-4 fill-white" viewBox="0 0 24 24">
    <path d="M12.031 6.172c-3.181 0-5.767 2.586-5.768 5.766-.001 1.298.38 2.27 1.019 3.287l-.711 2.599 2.679-.702c.972.53 1.765.819 2.78.82 3.18 0 5.767-2.587 5.768-5.766.001-3.182-2.585-5.804-5.767-5.804zm8.681 5.765c-.002 4.808-3.91 8.716-8.718 8.717-1.536 0-2.987-.404-4.254-1.107l-4.74 1.243 1.265-4.618c-.782-1.319-1.229-2.846-1.231-4.235.002-4.809 3.91-8.717 8.718-8.717 4.808 0 8.76 3.908 8.76 8.717z" />
  </svg>
);

// Matching Money Bag icon on Bon de Versement
const MoneyBagSvg = () => (
  <div className="w-5 h-5 rounded-full bg-black text-white flex items-center justify-center shrink-0">
    <svg className="w-3.5 h-3.5 fill-white" viewBox="0 0 24 24">
      <path d="M12 2a4 4 0 0 0-3.8 2.8L6.7 10H5a3 3 0 0 0-3 3v6a3 3 0 0 0 3 3h14a3 3 0 0 0 3-3v-6a3 3 0 0 0-3-3h-1.7l-1.5-5.2A4 4 0 0 0 12 2zm0 2c1 0 1.9.6 2.2 1.5L15.3 10H8.7l1.1-4.5c.3-.9 1.2-1.5 2.2-1.5zM12 12a3 3 0 0 1 3 3c0 1.2-.7 2.2-1.8 2.7l.8 2.3h-2l-.6-2h-.8v2h-1.5v-2H8v-1.5h3.2c.7 0 1.3-.4 1.3-1s-.6-1-1.3-1c-1.5 0-2.2-.8-2.2-2 0-1.2.7-2.2 1.8-2.7l-.8-2.3h2l.6 2h.8v-2h1.5v2h1.1v1.5h-3.2c-.7 0-1.3.4-1.3 1z" />
    </svg>
  </div>
);

// Matching Hand Coin icon on Bon de Versement
const HandCoinSvg = () => (
  <div className="w-5 h-5 rounded-full bg-black text-white flex items-center justify-center shrink-0">
    <svg className="w-3.5 h-3.5 fill-white" viewBox="0 0 24 24">
      <path d="M12 2a5 5 0 1 0 5 5 5 5 0 0 0-5-5zm0 2a3 3 0 1 1-3 3 3 3 0 0 1 3-3zm0 2a1 1 0 0 0-1 1v2a1 1 0 0 0 2 0V7a1 1 0 0 0-1-1zM2 14v8h6v-2H4v-4h2.5l3.5 2h5.5l5.5-2.5-1-1.8L15 15h-4l-3-1.7A3 3 0 0 0 6.5 14H2z" />
    </svg>
  </div>
);

// Angled stripes decorative component ///
const AngledStripes = ({ count = 3, className = '' }: { count?: number; className?: string }) => (
  <div className={`flex items-center gap-1 ${className}`}>
    {Array.from({ length: count }).map((_, i) => (
      <span
        key={i}
        className="inline-block w-2.5 h-6 bg-red-600 transform -skew-x-[25deg]"
      />
    ))}
  </div>
);

export const ContractPrintView: React.FC = () => {
  const { contractToPrint, setContractToPrint, t, language, addToast } = useApp();
  const [docType, setDocType] = useState<'CONTRAT' | 'BON_RESERVATION'>('CONTRAT');
  const [isDownloadingPdf, setIsDownloadingPdf] = useState(false);

  useEffect(() => {
    if (contractToPrint) {
      if (contractToPrint.contractType === 'RESERVATION') {
        setDocType('BON_RESERVATION');
      } else {
        setDocType('CONTRAT');
      }
    }
  }, [contractToPrint]);

  if (!contractToPrint) return null;

  const vehicle = dbStore.getVehicleById(contractToPrint.vehicleId) || contractToPrint.vehicleSnapshot;
  const customer = dbStore.getCustomerById(contractToPrint.customerId) || contractToPrint.customerSnapshot;
  const settings = dbStore.getSettings();

  const vehiclesList = contractToPrint.vehicleSnapshots && contractToPrint.vehicleSnapshots.length > 0
    ? contractToPrint.vehicleSnapshots
    : [vehicle];

  const handlePrint = () => {
    const targetId = docType === 'CONTRAT' ? 'printable-contract' : 'printable-bon-reservation';
    const prefix = docType === 'CONTRAT' ? 'Contrat-Location' : 'Bon-Versement';
    printElement(targetId, `${prefix}-${contractToPrint.contractNumber}`);
  };

  const handleDownloadPdf = async () => {
    const targetId = docType === 'CONTRAT' ? 'printable-contract' : 'printable-bon-reservation';
    const prefix = docType === 'CONTRAT' ? 'Contrat-Location' : 'Bon-Versement';
    const fileName = `${prefix}-${contractToPrint.contractNumber}`;
    setIsDownloadingPdf(true);
    try {
      const ok = await downloadElementAsPdf(targetId, fileName);
      if (ok) {
        addToast(language === 'ar' ? 'تم تنزيل المستند بنجاح' : 'Document PDF téléchargé avec succès', 'success');
      }
    } catch {
      addToast(language === 'ar' ? 'حدث خطأ أثناء تنزيل PDF' : 'Erreur lors du téléchargement PDF', 'error');
    } finally {
      setIsDownloadingPdf(false);
    }
  };

  const formatDzd = (n: number) => {
    return new Intl.NumberFormat('fr-FR', {
      maximumFractionDigits: 0
    }).format(n) + ' DA';
  };

  // Primary vehicle details
  const primaryVehicle = vehiclesList[0] || vehicle;

  return (
    <AnimatePresence>
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.18 }}
        className="fixed inset-0 z-50 bg-black/85 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4 overflow-y-auto print-document-overlay"
      >
        {/* Floating Toolbar (Hidden on Print) */}
        <motion.div 
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ type: 'spring', stiffness: 400, damping: 25 }}
          className="fixed top-4 z-50 flex flex-wrap items-center justify-center gap-2 print:hidden bg-neutral-900/95 border border-neutral-700 p-2 rounded-2xl shadow-2xl backdrop-blur-md max-w-full"
        >
          {/* Document Type Switcher */}
          <div className="flex items-center p-1 bg-neutral-800 rounded-xl border border-neutral-700 text-xs font-bold font-bukra italic">
            <button
              onClick={() => setDocType('CONTRAT')}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg transition-all cursor-pointer ${
                docType === 'CONTRAT'
                  ? 'bg-red-600 text-white shadow-sm'
                  : 'text-neutral-300 hover:text-white'
              }`}
            >
              <FileText className="w-4 h-4" />
              <span>1. Contrat de Location (A4)</span>
            </button>

            <button
              onClick={() => setDocType('BON_RESERVATION')}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg transition-all cursor-pointer ${
                docType === 'BON_RESERVATION'
                  ? 'bg-red-600 text-white shadow-sm'
                  : 'text-neutral-300 hover:text-white'
              }`}
            >
              <Receipt className="w-4 h-4" />
              <span>2. Bon de Versement / Réservation</span>
            </button>
          </div>

          {/* Direct Print A4 */}
          <button
            onClick={handlePrint}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-red-600 to-red-500 hover:from-red-500 hover:to-red-400 text-white font-black text-xs cursor-pointer shadow-md font-bukra italic"
            title={language === 'ar' ? 'طباعة مباشرة A4' : 'Imprimer directement A4'}
          >
            <Printer className="w-4 h-4 stroke-[2.5]" />
            <span>{t.print} (A4)</span>
          </button>

          {/* Download PDF button */}
          <button
            onClick={handleDownloadPdf}
            disabled={isDownloadingPdf}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-white font-bold text-xs cursor-pointer shadow-md transition-all font-bukra italic disabled:opacity-50"
            title={language === 'ar' ? 'تحميل كملف PDF' : 'Télécharger en PDF'}
          >
            {isDownloadingPdf ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Download className="w-4 h-4 stroke-[2.5]" />
            )}
            <span>{language === 'ar' ? 'تنزيل PDF' : 'Télécharger PDF'}</span>
          </button>

          <button
            onClick={() => setContractToPrint(null)}
            className="p-2 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-neutral-300 hover:text-white cursor-pointer"
            title={t.cancel}
          >
            <X className="w-5 h-5" />
          </button>
        </motion.div>

        {/* =========================================================================
            TEMPLATE 1: CONTRAT DE LOCATION (EXACT REPLICA OF image_9a9e3096.png)
            ========================================================================= */}
        {docType === 'CONTRAT' && (
          <div 
            id="printable-contract"
            className="w-[210mm] min-w-[210mm] max-w-[210mm] h-[297mm] min-h-[297mm] max-h-[297mm] bg-white text-black p-[8mm] shadow-2xl my-8 print:m-0 print:p-[8mm] print:shadow-none select-text font-sans text-xs leading-tight relative overflow-hidden box-border flex flex-col justify-between"
            style={{ border: '2.5px solid #dc2626' }}
          >
            {/* Top Header */}
            <div>
              <div className="flex items-center justify-between pb-3 border-b-2 border-red-600">
                {/* Official Logo on Left */}
                <div className="w-48 h-16 flex items-center">
                  <img 
                    src="/assets/im_logo.png" 
                    alt="IM LOCATION" 
                    className="max-h-16 w-auto object-contain"
                  />
                </div>

                {/* Right: Showroom Banner */}
                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-1">
                    <span className="inline-block w-2.5 h-6 bg-red-600 transform -skew-x-[25deg]" />
                    <span className="inline-block w-2.5 h-6 bg-red-600 transform -skew-x-[25deg]" />
                  </div>
                  <div className="border border-neutral-300 rounded px-2.5 py-1 text-center bg-white">
                    <div className="text-[11px] font-black uppercase tracking-wider text-black">
                      SHOWROOM DE LOCATION
                    </div>
                    <div className="text-[10px] font-mono font-bold text-neutral-700 flex items-center justify-center gap-1 mt-0.5">
                      <div className="w-3.5 h-3.5 rounded-full bg-red-600 flex items-center justify-center text-white">
                        <Phone className="w-2 h-2" />
                      </div>
                      <span>{settings.phone1 || '05-51-96-29-74'}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <span className="inline-block w-2.5 h-6 bg-red-600 transform -skew-x-[25deg]" />
                    <span className="inline-block w-2.5 h-6 bg-red-600 transform -skew-x-[25deg]" />
                  </div>
                </div>
              </div>

              {/* SECTION 1: INFORMATION CLIENT */}
              <div className="mt-3.5 space-y-1">
                {/* Section Header with Angled Red Stripes and Black Center */}
                <div className="flex items-center">
                  <div className="flex items-center gap-1 pe-2">
                    <span className="inline-block w-3 h-5 bg-red-600 transform -skew-x-[25deg]" />
                    <span className="inline-block w-3 h-5 bg-red-600 transform -skew-x-[25deg]" />
                  </div>
                  <div className="flex-1 bg-black text-white text-center py-1 text-xs font-black uppercase tracking-wider">
                    INFORMATION CLIENT
                  </div>
                  <div className="flex items-center gap-1 ps-2">
                    <span className="inline-block w-3 h-5 bg-red-600 transform -skew-x-[25deg]" />
                    <span className="inline-block w-3 h-5 bg-red-600 transform -skew-x-[25deg]" />
                  </div>
                </div>

                {/* 4-column Table */}
                <table className="w-full border-collapse border-2 border-black text-center text-xs">
                  <thead>
                    <tr className="bg-black text-white font-black text-[11px]">
                      <th className="border border-black py-1.5 px-2 w-1/4">NOM ET PRÉNOM</th>
                      <th className="border border-black py-1.5 px-2 w-1/4">DATE</th>
                      <th className="border border-black py-1.5 px-2 w-1/4">LIEU</th>
                      <th className="border border-black py-1.5 px-2 w-1/4">TÉLÉPHONE</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="font-bold text-black text-xs bg-white">
                      <td className="border border-black py-2.5 px-2 uppercase font-black">{customer?.fullName || '—'}</td>
                      <td className="border border-black py-2.5 px-2 font-mono">{customer?.birthDate || '15/06/1992'}</td>
                      <td className="border border-black py-2.5 px-2">{customer?.birthPlace || customer?.wilaya || 'Alger'}</td>
                      <td className="border border-black py-2.5 px-2 font-mono font-black">{customer?.phone || '0550 00 00 00'}</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* SECTION 2: INFORMATION PERMIS */}
              <div className="mt-3.5 space-y-1">
                <div className="flex items-center">
                  <div className="flex items-center gap-1 pe-2">
                    <span className="inline-block w-3 h-5 bg-red-600 transform -skew-x-[25deg]" />
                    <span className="inline-block w-3 h-5 bg-red-600 transform -skew-x-[25deg]" />
                  </div>
                  <div className="flex-1 bg-black text-white text-center py-1 text-xs font-black uppercase tracking-wider">
                    INFORMATION PERMIS
                  </div>
                  <div className="flex items-center gap-1 ps-2">
                    <span className="inline-block w-3 h-5 bg-red-600 transform -skew-x-[25deg]" />
                    <span className="inline-block w-3 h-5 bg-red-600 transform -skew-x-[25deg]" />
                  </div>
                </div>

                <table className="w-full border-collapse border-2 border-black text-center text-xs">
                  <thead>
                    <tr className="bg-black text-white font-black text-[11px]">
                      <th className="border border-black py-1.5 px-2 w-1/4">Numéro de permis</th>
                      <th className="border border-black py-1.5 px-2 w-1/4">DÉLIVRÉ LE</th>
                      <th className="border border-black py-1.5 px-2 w-1/4">Jusqu'au</th>
                      <th className="border border-black py-1.5 px-2 w-1/4">LIEU</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="font-bold text-black text-xs bg-white">
                      <td className="border border-black py-2.5 px-2 font-mono font-black">{customer?.drivingLicenseNumber || '16/094821'}</td>
                      <td className="border border-black py-2.5 px-2 font-mono">{customer?.drivingLicenseIssueDate || '01/01/2020'}</td>
                      <td className="border border-black py-2.5 px-2 font-mono">{customer?.drivingLicenseExpiryDate || '01/01/2030'}</td>
                      <td className="border border-black py-2.5 px-2">{customer?.wilaya || 'Alger'}</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* SECTION 3: VÉHICULE (With Multi-Vehicle support) */}
              <div className="mt-3.5 space-y-1">
                <div className="flex items-center">
                  <div className="flex items-center gap-1 pe-2">
                    <span className="inline-block w-3 h-5 bg-red-600 transform -skew-x-[25deg]" />
                    <span className="inline-block w-3 h-5 bg-red-600 transform -skew-x-[25deg]" />
                  </div>
                  <div className="flex-1 bg-black text-white text-center py-1 text-xs font-black uppercase tracking-wider">
                    VÉHICULE {vehiclesList.length > 1 ? `(${vehiclesList.length} VOITURES)` : ''}
                  </div>
                  <div className="flex items-center gap-1 ps-2">
                    <span className="inline-block w-3 h-5 bg-red-600 transform -skew-x-[25deg]" />
                    <span className="inline-block w-3 h-5 bg-red-600 transform -skew-x-[25deg]" />
                  </div>
                </div>

                <table className="w-full border-collapse border-2 border-black text-center text-xs">
                  <thead>
                    <tr className="bg-black text-white font-black text-[11px]">
                      <th className="border border-black py-1.5 px-2 w-1/4">MARQUE</th>
                      <th className="border border-black py-1.5 px-2 w-1/4">NUMÉRO DE CHÂSSIS</th>
                      <th className="border border-black py-1.5 px-2 w-1/4">COULEUR</th>
                      <th className="border border-black py-1.5 px-2 w-1/4">IMMATRICULATION</th>
                    </tr>
                  </thead>
                  <tbody>
                    {vehiclesList.map((v, vIdx) => (
                      <tr key={vIdx} className="font-bold text-black text-xs bg-white">
                        <td className="border border-black py-2 px-2 uppercase font-black">{v.brand} {v.model} ({v.year})</td>
                        <td className="border border-black py-2 px-2 font-mono text-[10px]">{v.chassisNumber || 'VF15R00006789123'}</td>
                        <td className="border border-black py-2 px-2 capitalize">{v.color || 'Blanc'}</td>
                        <td className="border border-black py-2 px-2 font-mono font-black text-sm">{v.matricule}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* SECTION 4: DURÉE DE LA LOCATION */}
              <div className="mt-3.5 space-y-1">
                <div className="flex items-center">
                  <div className="flex items-center gap-1 pe-2">
                    <span className="inline-block w-3 h-5 bg-red-600 transform -skew-x-[25deg]" />
                    <span className="inline-block w-3 h-5 bg-red-600 transform -skew-x-[25deg]" />
                  </div>
                  <div className="flex-1 bg-black text-white text-center py-1 text-xs font-black uppercase tracking-wider">
                    DURÉE DE LA LOCATION
                  </div>
                  <div className="flex items-center gap-1 ps-2">
                    <span className="inline-block w-3 h-5 bg-red-600 transform -skew-x-[25deg]" />
                    <span className="inline-block w-3 h-5 bg-red-600 transform -skew-x-[25deg]" />
                  </div>
                </div>

                <table className="w-full border-collapse border-2 border-black text-center text-xs">
                  <thead>
                    <tr className="bg-black text-white font-black text-[11px]">
                      <th className="border border-black py-1.5 px-2 w-1/4">Kilométrage</th>
                      <th className="border border-black py-1.5 px-2 w-1/4">Date de sortie</th>
                      <th className="border border-black py-1.5 px-2 w-1/4">Heure de sortie</th>
                      <th className="border border-black py-1.5 px-2 w-1/4">Date de retour</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="font-bold text-black text-xs bg-white">
                      <td className="border border-black py-2.5 px-2 font-mono font-black">{contractToPrint.startKm.toLocaleString()} KM</td>
                      <td className="border border-black py-2.5 px-2 font-mono font-black">{contractToPrint.startDate}</td>
                      <td className="border border-black py-2.5 px-2 font-mono font-black">{contractToPrint.startTime}</td>
                      <td className="border border-black py-2.5 px-2 font-mono font-black">{contractToPrint.expectedEndDate} ({contractToPrint.expectedEndTime})</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            {/* Bottom Signatures & Footer Section */}
            <div className="space-y-4 pt-2">
              {/* Signatures Row */}
              <div className="flex items-center justify-between px-6 pt-2">
                <div className="text-center">
                  <div className="font-black text-xs uppercase text-black underline">
                    Signature gérant
                  </div>
                  <div className="h-16 w-48 mt-2 border-b border-black flex items-end justify-center pb-1 text-[10px] text-neutral-400">
                    Cachet et signature
                  </div>
                </div>

                <div className="text-center">
                  <div className="font-black text-xs uppercase text-black underline">
                    Signature client
                  </div>
                  <div className="h-16 w-48 mt-2 border-b border-black flex items-end justify-center pb-1 text-[10px] text-neutral-400">
                    Lu et approuvé
                  </div>
                </div>
              </div>

              {/* Legal Warning Notice */}
              <div className="text-center">
                <p className="text-[11px] font-black italic uppercase text-red-600 tracking-wider">
                  * JE SIGNE APRÈS AVOIR LU LES CONDITIONS *
                </p>
              </div>

              {/* Social Media Footer Row */}
              <div className="flex items-center justify-between pt-2 border-t border-neutral-200">
                {/* Bottom Left Corner Angled Stripes */}
                <div className="flex items-center gap-1">
                  <span className="inline-block w-3 h-5 bg-red-600 transform -skew-x-[25deg]" />
                  <span className="inline-block w-3 h-5 bg-black transform -skew-x-[25deg]" />
                  <span className="inline-block w-3 h-5 bg-red-600 transform -skew-x-[25deg]" />
                </div>

                {/* Center Social Circles */}
                <div className="flex items-center gap-3">
                  <div className="w-6 h-6 rounded-full bg-black flex items-center justify-center">
                    <FacebookSvg />
                  </div>
                  <span className="text-neutral-400">|</span>
                  <div className="w-6 h-6 rounded-full bg-black flex items-center justify-center">
                    <InstagramSvg />
                  </div>
                  <span className="text-neutral-400">|</span>
                  <div className="w-6 h-6 rounded-full bg-black flex items-center justify-center">
                    <WhatsAppSvg />
                  </div>
                </div>

                {/* Bottom Right Corner Angled Stripes */}
                <div className="flex items-center gap-1">
                  <span className="inline-block w-3 h-5 bg-red-600 transform -skew-x-[25deg]" />
                  <span className="inline-block w-3 h-5 bg-black transform -skew-x-[25deg]" />
                  <span className="inline-block w-3 h-5 bg-red-600 transform -skew-x-[25deg]" />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* =========================================================================
            TEMPLATE 2: BON DE VERSEMENT / RÉSERVATION (EXACT REPLICA OF image_79979007.png)
            ========================================================================= */}
        {docType === 'BON_RESERVATION' && (
          <div 
            id="printable-bon-reservation"
            className="w-[210mm] min-w-[210mm] max-w-[210mm] h-[297mm] min-h-[297mm] max-h-[297mm] bg-white text-black p-[8mm] shadow-2xl my-8 print:m-0 print:p-[8mm] print:shadow-none select-text font-sans text-xs leading-tight relative overflow-hidden box-border flex flex-col justify-between"
          >
            {/* Top Header */}
            <div>
              {/* Dual Logo Top Row */}
              <div className="flex items-center justify-between pb-2">
                <div className="w-40 h-14 flex items-center">
                  <img src="/assets/im_logo.png" alt="IM LOCATION" className="max-h-14 w-auto object-contain" />
                </div>
                <div className="w-40 h-14 flex items-center justify-end">
                  <img src="/assets/im_logo.png" alt="IM LOCATION" className="max-h-14 w-auto object-contain" />
                </div>
              </div>

              {/* Red Spanning Bar */}
              <div className="w-full h-1 bg-red-600 my-1" />

              {/* Center Black Capsule */}
              <div className="flex justify-center -mt-3 mb-1">
                <div className="bg-[#1f2421] text-white px-8 py-2 rounded-2xl text-center shadow-md">
                  <h1 className="text-xl sm:text-2xl font-black uppercase tracking-wider font-bukra italic">
                    IM LOCATION DE VOITURE
                  </h1>
                </div>
              </div>

              {/* Slanted Red Banner: BON DE VERSEMENT */}
              <div className="flex justify-center my-2">
                <div className="relative">
                  {/* Black accent lines */}
                  <div className="absolute -top-1 inset-x-0 h-0.5 bg-black" />
                  <div 
                    className="bg-red-600 text-white px-12 py-1.5 font-black text-xl sm:text-2xl uppercase tracking-widest text-center shadow-lg transform -skew-x-[20deg]"
                  >
                    <span className="inline-block transform skew-x-[20deg] font-bukra italic">
                      BON DE VERSEMENT
                    </span>
                  </div>
                </div>
              </div>

              {/* MAIN CONTENT BOX (Thick Red Border with Watermark) */}
              <div 
                className="mt-3 p-6 sm:p-7 rounded-3xl relative overflow-hidden"
                style={{ border: '3.5px solid #dc2626' }}
              >
                {/* Background Watermark */}
                <div 
                  className="absolute inset-0 flex items-center justify-center opacity-10 pointer-events-none select-none transform -rotate-12 scale-125"
                >
                  <img src="/assets/im_logo.png" alt="" className="w-96 max-w-full" />
                </div>

                {/* Dotted Form Rows with Black SVG Icons */}
                <div className="space-y-4 text-sm font-bold relative z-10">
                  {/* Row 1: Nom et prénom */}
                  <div className="flex items-center gap-2">
                    <User className="w-5 h-5 text-black shrink-0" />
                    <span className="font-extrabold text-black shrink-0 whitespace-nowrap">Nom et prénom :</span>
                    <div className="flex-1 flex items-baseline border-b-2 border-dotted border-black/80 px-2 font-black text-base uppercase text-neutral-900">
                      {customer?.fullName || '—'}
                    </div>
                  </div>

                  {/* Row 2: Numero de tel */}
                  <div className="flex items-center gap-2">
                    <Phone className="w-5 h-5 text-black shrink-0" />
                    <span className="font-extrabold text-black shrink-0 whitespace-nowrap">Numero de tel :</span>
                    <div className="flex-1 flex items-baseline border-b-2 border-dotted border-black/80 px-2 font-mono font-black text-base text-neutral-900">
                      {customer?.phone || '—'}
                    </div>
                  </div>

                  {/* Row 3: Véhicule */}
                  <div className="flex items-center gap-2">
                    <Car className="w-5 h-5 text-black shrink-0" />
                    <span className="font-extrabold text-black shrink-0 whitespace-nowrap">Véhicule :</span>
                    <div className="flex-1 flex items-baseline border-b-2 border-dotted border-black/80 px-2 font-black text-base uppercase text-neutral-900">
                      {vehiclesList.map(v => `${v.brand} ${v.model} (${v.matricule})`).join(' + ')}
                    </div>
                  </div>

                  {/* Row 4: Prix de location */}
                  <div className="flex items-center gap-2">
                    <MoneyBagSvg />
                    <span className="font-extrabold text-black shrink-0 whitespace-nowrap">Prix de location :</span>
                    <div className="flex-1 flex items-baseline border-b-2 border-dotted border-black/80 px-2 font-mono font-black text-base text-neutral-900">
                      {formatDzd(contractToPrint.totalRentDzd)}
                    </div>
                  </div>

                  {/* Row 5: Montant versé */}
                  <div className="flex items-center gap-2">
                    <HandCoinSvg />
                    <span className="font-extrabold text-black shrink-0 whitespace-nowrap">Montant versé :</span>
                    <div className="flex-1 flex items-baseline border-b-2 border-dotted border-black/80 px-2 font-mono font-black text-lg text-emerald-700">
                      {formatDzd(contractToPrint.advancePaymentDzd)}
                    </div>
                  </div>

                  {/* Row 6: Date de versement */}
                  <div className="flex items-center gap-2">
                    <Calendar className="w-5 h-5 text-black shrink-0" />
                    <span className="font-extrabold text-black shrink-0 whitespace-nowrap">Date de versement :</span>
                    <div className="flex-1 flex items-baseline border-b-2 border-dotted border-black/80 px-2 font-mono font-bold text-base text-neutral-900">
                      {contractToPrint.startDate}
                    </div>
                  </div>

                  {/* Row 7: Date de départ */}
                  <div className="flex items-center gap-2">
                    <Calendar className="w-5 h-5 text-black shrink-0" />
                    <span className="font-extrabold text-black shrink-0 whitespace-nowrap">Date de départ :</span>
                    <div className="flex-1 flex items-baseline border-b-2 border-dotted border-black/80 px-2 font-mono font-bold text-base text-neutral-900">
                      {contractToPrint.startDate} à {contractToPrint.startTime}
                    </div>
                  </div>

                  {/* Row 8: Date de retour */}
                  <div className="flex items-center gap-2">
                    <Calendar className="w-5 h-5 text-black shrink-0" />
                    <span className="font-extrabold text-black shrink-0 whitespace-nowrap">Date de retour :</span>
                    <div className="flex-1 flex items-baseline border-b-2 border-dotted border-black/80 px-2 font-mono font-bold text-base text-neutral-900">
                      {contractToPrint.expectedEndDate} à {contractToPrint.expectedEndTime}
                    </div>
                  </div>

                  {/* Bottom Right: Frais de livraison Box */}
                  <div className="flex justify-end pt-2">
                    <div className="w-48 border-2 border-red-600 rounded-lg overflow-hidden text-center bg-white shadow-xs">
                      <div className="bg-white border-b-2 border-red-600 py-1 font-black text-xs uppercase text-black">
                        Frais de livraison
                      </div>
                      <div className="py-2.5 font-mono font-black text-sm text-neutral-900">
                        {contractToPrint.remainingBalanceDzd > 0 ? `Reste: ${formatDzd(contractToPrint.remainingBalanceDzd)}` : '0 DA'}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Bottom Warning, Signatures & Footer Banner */}
            <div className="space-y-4 pt-3">
              {/* Red Bold Underlined Warning */}
              <div className="text-center">
                <p className="text-xs sm:text-sm font-black text-red-600 uppercase tracking-wide underline">
                  TOUTE ANNULATION EFFECTUEE PAR LE CLIENT EST NON REMBOURSABLE
                </p>
              </div>

              {/* Signatures */}
              <div className="flex items-center justify-between px-10 pt-1">
                <div className="text-center">
                  <div className="font-black text-sm uppercase text-black underline">
                    Signature gèrent
                  </div>
                  <div className="h-14 w-44 mt-1 border-b border-black/60" />
                </div>

                <div className="text-center">
                  <div className="font-black text-sm uppercase text-black underline">
                    Signature client
                  </div>
                  <div className="h-14 w-44 mt-1 border-b border-black/60" />
                </div>
              </div>

              {/* Bottom Black Slanted Polygon Banner */}
              <div className="relative mt-2">
                <div className="w-full h-1 bg-red-600 mb-0.5" />
                <div 
                  className="bg-black text-white px-8 py-3 flex items-center justify-between font-bold text-sm"
                  style={{ clipPath: 'polygon(0 0, 100% 0, 97% 100%, 0% 100%)' }}
                >
                  <div className="flex items-center gap-2">
                    <MapPin className="w-5 h-5 text-white shrink-0" />
                    <span className="font-extrabold text-base tracking-wide">Baba hassen</span>
                  </div>

                  <div className="flex items-center gap-2">
                    <Phone className="w-5 h-5 text-white shrink-0" />
                    <span className="font-mono font-black text-base tracking-widest">05-51-96-29-74</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </motion.div>
    </AnimatePresence>
  );
};

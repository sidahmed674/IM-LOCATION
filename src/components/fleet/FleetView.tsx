import React, { useState } from 'react';
import { 
  Car, Plus, Filter, Gauge, Fuel, Shield, 
  FileCheck, Calendar, Wrench, Edit, Trash2, Key, X, Check,
  Upload, Image as ImageIcon, Camera, Sparkles, FileText
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { dbStore } from '../../db/store';
import { Vehicle, VehicleStatus, VehicleCategory, FuelLevel } from '../../types';

export const PRESET_CAR_PHOTOS = [
  { name: 'Renault Clio 5', url: '/src/assets/images/fleet_renault_clio_1791762677953.jpg' },
  { name: 'Hyundai Tucson', url: '/src/assets/images/fleet_hyundai_tucson_1791762689871.jpg' },
  { name: 'VW Golf 8 R-Line', url: '/src/assets/images/fleet_golf_rline_1791762702073.jpg' },
  { name: 'Dacia Sandero Stepway', url: '/src/assets/images/fleet_dacia_sandero_1792104002370.jpg' },
  { name: 'Peugeot 208 GT', url: '/src/assets/images/fleet_peugeot_208_1792104015275.jpg' },
];

export const FleetView: React.FC = () => {
  const { t, language, openNewRentalModal, addToast } = useApp();
  const vehicles = dbStore.getVehicles();

  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [categoryFilter, setCategoryFilter] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingVehicle, setEditingVehicle] = useState<Vehicle | null>(null);

  // Form states for Add/Edit Vehicle
  const [formData, setFormData] = useState({
    matricule: '',
    brand: '',
    model: '',
    year: 2024,
    category: 'ECONOMY' as VehicleCategory,
    transmission: 'MANUAL' as 'MANUAL' | 'AUTO',
    fuelType: 'ESSENCE' as 'ESSENCE' | 'DIESEL' | 'GPL',
    color: 'Blanc',
    dailyRate: 6500,
    currentKm: 25000,
    currentFuel: '8/8' as FuelLevel,
    status: 'AVAILABLE' as VehicleStatus,
    imageUrl: PRESET_CAR_PHOTOS[0].url,
    assuranceNumber: '',
    assuranceExpiry: '',
    carteGriseNumber: '',
    carteGriseExpiry: '',
    controleTechNumber: '',
    controleTechExpiry: '',
    nextOilChangeKm: 30000,
  });

  const handleOpenAdd = () => {
    setEditingVehicle(null);
    setFormData({
      matricule: '',
      brand: '',
      model: '',
      year: new Date().getFullYear(),
      category: 'ECONOMY',
      transmission: 'MANUAL',
      fuelType: 'ESSENCE',
      color: 'Blanc',
      dailyRate: 6000,
      currentKm: 20000,
      currentFuel: '8/8',
      status: 'AVAILABLE',
      imageUrl: PRESET_CAR_PHOTOS[0].url,
      assuranceNumber: 'SAA-' + Math.floor(100000 + Math.random() * 900000),
      assuranceExpiry: new Date(Date.now() + 300 * 86400000).toISOString().split('T')[0],
      carteGriseNumber: 'CG-16-' + Math.floor(100000 + Math.random() * 900000),
      carteGriseExpiry: new Date(Date.now() + 700 * 86400000).toISOString().split('T')[0],
      controleTechNumber: 'CT-ENACT-' + Math.floor(10000 + Math.random() * 90000),
      controleTechExpiry: new Date(Date.now() + 180 * 86400000).toISOString().split('T')[0],
      nextOilChangeKm: 25000,
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (v: Vehicle) => {
    setEditingVehicle(v);
    setFormData({
      matricule: v.matricule,
      brand: v.brand,
      model: v.model,
      year: v.year,
      category: v.category,
      transmission: v.transmission,
      fuelType: v.fuelType,
      color: v.color,
      dailyRate: v.dailyRate,
      currentKm: v.currentKm,
      currentFuel: v.currentFuel,
      status: v.status,
      imageUrl: v.imageUrl || PRESET_CAR_PHOTOS[0].url,
      assuranceNumber: v.documents.assurance.number,
      assuranceExpiry: v.documents.assurance.expiryDate,
      carteGriseNumber: v.documents.carteGrise.number,
      carteGriseExpiry: v.documents.carteGrise.expiryDate,
      controleTechNumber: v.documents.controleTechnique.number,
      controleTechExpiry: v.documents.controleTechnique.expiryDate,
      nextOilChangeKm: v.nextOilChangeKm || v.currentKm + 5000,
    });
    setIsModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.matricule || !formData.brand || !formData.model) {
      addToast(language === 'ar' ? 'يرجى ملء جميع الحقول الإلزامية' : 'Veuillez remplir tous les champs obligatoires', 'error');
      return;
    }

    try {
      if (editingVehicle) {
        dbStore.updateVehicle(editingVehicle.id, {
          matricule: formData.matricule,
          brand: formData.brand,
          model: formData.model,
          year: Number(formData.year),
          category: formData.category,
          transmission: formData.transmission,
          fuelType: formData.fuelType,
          color: formData.color,
          dailyRate: Number(formData.dailyRate),
          currentKm: Number(formData.currentKm),
          currentFuel: formData.currentFuel,
          status: formData.status,
          imageUrl: formData.imageUrl,
          documents: {
            assurance: {
              number: formData.assuranceNumber,
              issueDate: editingVehicle.documents.assurance.issueDate,
              expiryDate: formData.assuranceExpiry,
            },
            carteGrise: {
              number: formData.carteGriseNumber,
              issueDate: editingVehicle.documents.carteGrise.issueDate,
              expiryDate: formData.carteGriseExpiry,
            },
            controleTechnique: {
              number: formData.controleTechNumber,
              issueDate: editingVehicle.documents.controleTechnique.issueDate,
              expiryDate: formData.controleTechExpiry,
            },
          },
          nextOilChangeKm: Number(formData.nextOilChangeKm),
        });
        addToast(language === 'ar' ? 'تم تحديث بيانات المركبة بنجاح' : 'Véhicule mis à jour avec succès', 'success');
      } else {
        dbStore.addVehicle({
          matricule: formData.matricule,
          brand: formData.brand,
          model: formData.model,
          year: Number(formData.year),
          category: formData.category,
          transmission: formData.transmission,
          fuelType: formData.fuelType,
          color: formData.color,
          dailyRate: Number(formData.dailyRate),
          currentKm: Number(formData.currentKm),
          currentFuel: formData.currentFuel,
          status: formData.status,
          imageUrl: formData.imageUrl,
          documents: {
            assurance: {
              number: formData.assuranceNumber,
              issueDate: new Date().toISOString().split('T')[0],
              expiryDate: formData.assuranceExpiry,
            },
            carteGrise: {
              number: formData.carteGriseNumber,
              issueDate: new Date().toISOString().split('T')[0],
              expiryDate: formData.carteGriseExpiry,
            },
            controleTechnique: {
              number: formData.controleTechNumber,
              issueDate: new Date().toISOString().split('T')[0],
              expiryDate: formData.controleTechExpiry,
            },
          },
          nextOilChangeKm: Number(formData.nextOilChangeKm),
        });
        addToast(language === 'ar' ? 'تمت إضافة المركبة إلى الأسطول بنجاح' : 'Véhicule ajouté au parc avec succès', 'success');
      }
      setIsModalOpen(false);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Erreur inconnue';
      addToast(msg, 'error');
    }
  };

  const handleDelete = (id: string, matricule: string) => {
    if (window.confirm(language === 'ar' ? `هل أنت متأكد من حذف المركبة (${matricule})؟` : `Confirmer la suppression du véhicule ${matricule} ?`)) {
      try {
        dbStore.deleteVehicle(id);
        addToast(language === 'ar' ? 'تم حذف المركبة بنجاح' : 'Véhicule supprimé avec succès', 'success');
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : 'Erreur';
        addToast(msg, 'error');
      }
    }
  };

  // Filter logic
  const filteredVehicles = vehicles.filter(v => {
    const matchesStatus = statusFilter === 'ALL' || v.status === statusFilter;
    const matchesCategory = categoryFilter === 'ALL' || v.category === categoryFilter;
    const matchesSearch = 
      v.matricule.toLowerCase().includes(searchQuery.toLowerCase()) ||
      v.brand.toLowerCase().includes(searchQuery.toLowerCase()) ||
      v.model.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesStatus && matchesCategory && matchesSearch;
  });

  const getStatusBadge = (status: VehicleStatus) => {
    switch (status) {
      case 'AVAILABLE':
        return <span className="text-emerald-500 font-semibold">{t.statusAvailable}</span>;
      case 'RENTED':
        return <span className="text-blue-500 font-semibold">{t.statusRented}</span>;
      case 'MAINTENANCE':
        return <span className="text-amber-500 font-semibold">{t.statusMaintenance}</span>;
      case 'INSPECTION':
        return <span className="text-purple-500 font-semibold">{t.statusInspection}</span>;
      case 'RESERVED':
        return <span className="text-cyan-500 font-semibold">{t.statusReserved}</span>;
      default:
        return <span>{status}</span>;
    }
  };

  const formatDzd = (n: number) => {
    return new Intl.NumberFormat(language === 'ar' ? 'ar-DZ' : 'fr-FR', {
      maximumFractionDigits: 0
    }).format(n) + ' ' + t.currency;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-neutral-200 dark:border-neutral-800">
        <div>
          <h2 className="text-xl font-bold font-bukra italic tracking-tight text-neutral-900 dark:text-white">
            {t.navFlotteAutomobile}
          </h2>
          <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">
            {language === 'ar' 
              ? 'مراقبة دورة حياة المركبات (متاح، مؤجر، فحص، صيانة)، والوثائق الرسمية'
              : 'Cycle de vie du parc (Disponible, En location, Inspection, Maintenance) et documents légaux'}
          </p>
        </div>

        <button
          onClick={handleOpenAdd}
          className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-neutral-950 font-bold text-xs transition-colors shadow-sm cursor-pointer self-start sm:self-auto font-bukra italic"
        >
          <Plus className="w-4 h-4" />
          <span>{t.actionAddVehicle}</span>
        </button>
      </div>

      {/* Filter Toolbar (Segmented Controls & Search) */}
      <div className="p-3 rounded-xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 flex flex-col md:flex-row items-center justify-between gap-3 shadow-xs">
        {/* Status Segmented Buttons */}
        <div className="flex items-center gap-1 overflow-x-auto w-full md:w-auto pb-1 md:pb-0">
          {[
            { id: 'ALL', label: t.all },
            { id: 'AVAILABLE', label: t.statusAvailable },
            { id: 'RENTED', label: t.statusRented },
            { id: 'MAINTENANCE', label: t.statusMaintenance },
            { id: 'INSPECTION', label: t.statusInspection },
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

        {/* Search input & Category dropdown */}
        <div className="flex items-center gap-2 w-full md:w-auto">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={language === 'ar' ? 'بحث باللوحة أو الموديل...' : 'Recherche matricule ou modèle...'}
            className="w-full md:w-56 bg-neutral-50 dark:bg-neutral-800/80 border border-neutral-200 dark:border-neutral-700/80 rounded-lg px-3 py-1.5 text-xs text-neutral-900 dark:text-neutral-200 focus:outline-none focus:border-amber-500"
          />

          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="bg-neutral-50 dark:bg-neutral-800/80 border border-neutral-200 dark:border-neutral-700/80 rounded-lg px-2.5 py-1.5 text-xs text-neutral-900 dark:text-neutral-200 focus:outline-none cursor-pointer"
          >
            <option value="ALL">{language === 'ar' ? 'جميع الفئات' : 'Toutes catégories'}</option>
            <option value="ECONOMY">{t.catEconomy}</option>
            <option value="SEDAN">{t.catSedan}</option>
            <option value="SUV">{t.catSuv}</option>
            <option value="COMMERCIAL">{t.catCommercial}</option>
            <option value="PREMIUM">{t.catPremium}</option>
          </select>
        </div>
      </div>

      {/* Fleet Cards Grid or Empty State */}
      {filteredVehicles.length === 0 ? (
        <div className="p-12 text-center rounded-2xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 space-y-3">
          <Car className="w-12 h-12 text-neutral-400 mx-auto" />
          <h3 className="font-bold text-sm text-neutral-900 dark:text-white font-bukra italic">
            {t.noData}
          </h3>
          <p className="text-xs text-neutral-500 max-w-sm mx-auto">
            {language === 'ar' ? 'لم تقم بإضافة أي مركبة بعد. اضغط على الزر لإضافة أول سيارة لأسطولك.' : 'Aucun véhicule enregistré. Cliquez ci-dessous pour ajouter votre première voiture.'}
          </p>
          <button
            onClick={handleOpenAdd}
            className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-neutral-950 font-bold text-xs cursor-pointer shadow-sm inline-flex items-center gap-1.5 font-bukra italic"
          >
            <Plus className="w-4 h-4" />
            <span>{t.actionAddVehicle}</span>
          </button>
        </div>
      ) : (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {filteredVehicles.map(vehicle => {
          // Check documents expiry with 15-day threshold
          const assuranceDays = Math.ceil((new Date(vehicle.documents.assurance.expiryDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
          const ctDays = Math.ceil((new Date(vehicle.documents.controleTechnique.expiryDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
          const cgDays = vehicle.documents.carteGrise?.expiryDate 
            ? Math.ceil((new Date(vehicle.documents.carteGrise.expiryDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
            : 365;

          const kmUntilOil = vehicle.nextOilChangeKm ? vehicle.nextOilChangeKm - vehicle.currentKm : null;

          return (
            <div
              key={vehicle.id}
              className="rounded-xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 overflow-hidden shadow-xs hover:border-neutral-300 dark:hover:border-neutral-700 transition-all flex flex-col"
            >
              {/* Vehicle Photo or Fallback */}
              <div className="h-44 w-full relative bg-neutral-100 dark:bg-neutral-950 overflow-hidden">
                {vehicle.imageUrl ? (
                  <img
                    src={vehicle.imageUrl}
                    alt={`${vehicle.brand} ${vehicle.model}`}
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center text-neutral-400">
                    <Car className="w-12 h-12 mb-1" />
                    <span className="text-xs">{vehicle.brand} {vehicle.model}</span>
                  </div>
                )}

                {/* Floating Algerian Matricule Badge */}
                <div className="absolute top-2.5 start-2.5 px-2.5 py-1 rounded bg-neutral-900/90 text-amber-400 border border-neutral-700/80 font-mono text-xs font-bold tracking-wider backdrop-blur-xs shadow-md">
                  {vehicle.matricule}
                </div>

                {/* Status Badge */}
                <div className="absolute top-2.5 end-2.5 px-2 py-0.5 rounded bg-black/70 backdrop-blur-xs text-[11px]">
                  {getStatusBadge(vehicle.status)}
                </div>

                {/* Daily Price Tag */}
                <div className="absolute bottom-2.5 end-2.5 px-2.5 py-1 rounded bg-amber-500 text-neutral-950 font-bold font-mono text-xs shadow-md">
                  {formatDzd(vehicle.dailyRate)} <span className="text-[10px] font-sans font-normal">/ {language === 'ar' ? 'يوم' : 'jour'}</span>
                </div>
              </div>

              {/* Vehicle Specs & Condition Body */}
              <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
                <div>
                  <div className="flex items-baseline justify-between">
                    <h3 className="font-bold text-sm text-neutral-900 dark:text-white">
                      {vehicle.brand} {vehicle.model}
                    </h3>
                    <span className="text-xs text-neutral-500 font-mono">{vehicle.year}</span>
                  </div>

                  <div className="flex items-center gap-2 text-xs text-neutral-500 dark:text-neutral-400 mt-1">
                    <span>{vehicle.category}</span>
                    <span aria-hidden="true">·</span>
                    <span>{vehicle.transmission === 'AUTO' ? t.auto : t.manual}</span>
                    <span aria-hidden="true">·</span>
                    <span>{vehicle.fuelType}</span>
                    <span aria-hidden="true">·</span>
                    <span>{vehicle.color}</span>
                  </div>
                </div>

                {/* Odometer & Fuel Level Meters */}
                <div className="grid grid-cols-2 gap-2 p-2.5 rounded-lg bg-neutral-50 dark:bg-neutral-800/40 text-xs">
                  <div className="flex items-center gap-2">
                    <Gauge className="w-4 h-4 text-neutral-400" />
                    <div>
                      <div className="text-[10px] text-neutral-400">{t.odometer}</div>
                      <div className="font-mono font-semibold text-neutral-800 dark:text-neutral-200">
                        {vehicle.currentKm.toLocaleString()} KM
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <Fuel className="w-4 h-4 text-amber-500" />
                    <div>
                      <div className="text-[10px] text-neutral-400">{t.fuelLevel}</div>
                      <div className="font-mono font-semibold text-amber-500">
                        {vehicle.currentFuel}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Vidange / Oil Change Status */}
                {kmUntilOil !== null && (
                  <div className={`flex items-center justify-between px-2.5 py-1.5 rounded-lg text-[11px] font-mono border ${
                    kmUntilOil <= 0 
                      ? 'bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/30 font-bold' 
                      : kmUntilOil <= 1000 
                      ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30' 
                      : 'bg-neutral-50 dark:bg-neutral-800/30 text-neutral-600 dark:text-neutral-400 border-neutral-200 dark:border-neutral-700/60'
                  }`}>
                    <span className="flex items-center gap-1.5 font-sans">
                      <Wrench className="w-3.5 h-3.5" />
                      {language === 'ar' ? 'موعد تغيير الزيت (Vidange):' : 'Prochaine Vidange:'}
                    </span>
                    <span className="font-bold">
                      {kmUntilOil <= 0 
                        ? (language === 'ar' ? 'تجاوز الموعد !' : 'Dépassé !') 
                        : `${kmUntilOil.toLocaleString()} KM`}
                    </span>
                  </div>
                )}

                {/* Algerian Document Radar (15-day warning threshold) */}
                <div className="space-y-1 text-[11px] border-t border-neutral-100 dark:border-neutral-800/80 pt-2 text-neutral-600 dark:text-neutral-400">
                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-1">
                      <Shield className="w-3 h-3 text-neutral-400" />
                      {t.assurance}:
                    </span>
                    <span className={`font-mono ${assuranceDays <= 0 ? 'text-red-600 font-bold' : assuranceDays <= 15 ? 'text-amber-500 font-bold' : 'text-neutral-500'}`}>
                      {vehicle.documents.assurance.expiryDate} {assuranceDays <= 15 && (assuranceDays <= 0 ? '(منتهي)' : `(${assuranceDays}j)`)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-1">
                      <FileCheck className="w-3 h-3 text-neutral-400" />
                      {t.controleTech}:
                    </span>
                    <span className={`font-mono ${ctDays <= 0 ? 'text-red-600 font-bold' : ctDays <= 15 ? 'text-amber-500 font-bold' : 'text-neutral-500'}`}>
                      {vehicle.documents.controleTechnique.expiryDate} {ctDays <= 15 && (ctDays <= 0 ? '(منتهي)' : `(${ctDays}j)`)}
                    </span>
                  </div>
                  {vehicle.documents.carteGrise?.expiryDate && (
                    <div className="flex items-center justify-between">
                      <span className="flex items-center gap-1">
                        <FileText className="w-3 h-3 text-neutral-400" />
                        {language === 'ar' ? 'البطاقة الرمادية:' : 'Carte Grise:'}
                      </span>
                      <span className={`font-mono ${cgDays <= 0 ? 'text-red-600 font-bold' : cgDays <= 15 ? 'text-amber-500 font-bold' : 'text-neutral-500'}`}>
                        {vehicle.documents.carteGrise.expiryDate} {cgDays <= 15 && (cgDays <= 0 ? '(منتهي)' : `(${cgDays}j)`)}
                      </span>
                    </div>
                  )}
                </div>

                {/* Action Buttons */}
                <div className="flex items-center gap-2 pt-2 border-t border-neutral-100 dark:border-neutral-800">
                  {vehicle.status === 'AVAILABLE' ? (
                    <button
                      onClick={() => openNewRentalModal(vehicle.id)}
                      className="flex-1 py-1.5 px-3 rounded-lg bg-amber-500 hover:bg-amber-400 text-neutral-950 font-bold text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                    >
                      <Key className="w-3.5 h-3.5" />
                      <span>{language === 'ar' ? 'تأجير الآن' : 'Louer'}</span>
                    </button>
                  ) : (
                    <div className="flex-1 py-1.5 text-center text-xs font-semibold text-neutral-400 bg-neutral-100 dark:bg-neutral-800 rounded-lg">
                      {getStatusBadge(vehicle.status)}
                    </div>
                  )}

                  <button
                    onClick={() => handleOpenEdit(vehicle)}
                    className="p-1.5 rounded-lg bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-700 text-neutral-600 dark:text-neutral-300 transition-colors cursor-pointer"
                    title={t.edit}
                  >
                    <Edit className="w-3.5 h-3.5" />
                  </button>

                  <button
                    onClick={() => handleDelete(vehicle.id, vehicle.matricule)}
                    className="p-1.5 rounded-lg bg-neutral-100 dark:bg-neutral-800 hover:bg-red-500/20 text-neutral-600 dark:text-neutral-400 hover:text-red-400 transition-colors cursor-pointer"
                    title={t.delete}
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
      )}

      {/* Add / Edit Vehicle Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="w-full max-w-2xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-2xl p-6 shadow-2xl space-y-4 my-8">
            <div className="flex items-center justify-between pb-3 border-b border-neutral-200 dark:border-neutral-800">
              <div className="flex items-center gap-2">
                <Car className="w-5 h-5 text-amber-500" />
                <h3 className="font-bold text-base text-neutral-900 dark:text-white">
                  {editingVehicle 
                    ? (language === 'ar' ? 'تعديل بيانات المركبة' : 'Modifier le Véhicule')
                    : t.actionAddVehicle}
                </h3>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-neutral-400 hover:text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4 text-xs">
              {/* Photo du Véhicule (Showroom & Upload) */}
              <div className="p-3.5 rounded-xl bg-neutral-100 dark:bg-neutral-800/60 border border-neutral-200 dark:border-neutral-700/80 space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-neutral-800 dark:text-neutral-200 font-bold flex items-center gap-1.5 font-bukra italic">
                    <ImageIcon className="w-4 h-4 text-amber-500" />
                    <span>{language === 'ar' ? 'صورة السيارة الاحترافية (اختر نموذجاً أو ارفع صورتك)' : 'Photo Professionnelle du Véhicule'}</span>
                  </label>
                  <label className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-white dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-700 hover:border-amber-400 text-neutral-800 dark:text-neutral-200 font-bold text-[11px] cursor-pointer shadow-xs transition-colors">
                    <Upload className="w-3.5 h-3.5 text-amber-500" />
                    <span>{language === 'ar' ? 'رفع صورة من جهازك' : 'Importer depuis PC'}</span>
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          const reader = new FileReader();
                          reader.onload = (event) => {
                            if (event.target?.result) {
                              setFormData({ ...formData, imageUrl: event.target.result as string });
                            }
                          };
                          reader.readAsDataURL(file);
                        }
                      }}
                    />
                  </label>
                </div>

                {/* Preset Showcase Buttons */}
                <div className="space-y-1.5">
                  <span className="text-[10px] text-neutral-500 block font-semibold">
                    {language === 'ar' ? 'نماذج جاهزة عالية الجودة من أشهر سيارات الأسطول الجزائري:' : 'Modèles courants prêts du parc algérien :'}
                  </span>
                  <div className="grid grid-cols-5 gap-2">
                    {PRESET_CAR_PHOTOS.map((preset) => {
                      const isSelected = formData.imageUrl === preset.url;
                      return (
                        <button
                          key={preset.name}
                          type="button"
                          onClick={() => setFormData({ ...formData, imageUrl: preset.url })}
                          className={`group relative rounded-lg overflow-hidden border-2 transition-all p-0.5 text-start cursor-pointer ${
                            isSelected
                              ? 'border-amber-500 ring-2 ring-amber-500/30'
                              : 'border-neutral-300 dark:border-neutral-700 hover:border-neutral-400'
                          }`}
                        >
                          <img
                            src={preset.url}
                            alt={preset.name}
                            className="w-full h-12 object-cover rounded-md"
                          />
                          <div className="text-[9px] font-bold truncate text-neutral-700 dark:text-neutral-300 mt-1 px-1">
                            {preset.name}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Live Preview & Custom URL */}
                <div className="flex items-center gap-3 pt-1">
                  {formData.imageUrl && (
                    <div className="w-20 h-12 rounded-lg overflow-hidden border border-neutral-300 dark:border-neutral-700 shrink-0 relative shadow-xs">
                      <img
                        src={formData.imageUrl}
                        alt="Preview"
                        className="w-full h-full object-cover"
                      />
                    </div>
                  )}
                  <input
                    type="text"
                    placeholder={language === 'ar' ? 'أو الصق رابط صورة مخصص (URL)...' : 'Ou coller l’URL d’une photo...'}
                    value={formData.imageUrl}
                    onChange={(e) => setFormData({ ...formData, imageUrl: e.target.value })}
                    className="flex-1 bg-white dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-700 rounded-lg p-2 text-xs font-mono text-neutral-900 dark:text-white"
                  />
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-neutral-700 dark:text-neutral-300 font-medium mb-1">
                    {t.matricule} *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="00142-123-16"
                    value={formData.matricule}
                    onChange={(e) => setFormData({ ...formData, matricule: e.target.value })}
                    className="w-full bg-neutral-50 dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-700 rounded-lg p-2 font-mono text-neutral-900 dark:text-white focus:outline-none focus:border-amber-500"
                  />
                  <span className="text-[10px] text-neutral-500">Ex: 00124-122-16 (Alger)</span>
                </div>

                <div>
                  <label className="block text-neutral-700 dark:text-neutral-300 font-medium mb-1">
                    {t.brand} *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Renault, Hyundai, Dacia..."
                    value={formData.brand}
                    onChange={(e) => setFormData({ ...formData, brand: e.target.value })}
                    className="w-full bg-neutral-50 dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-700 rounded-lg p-2 text-neutral-900 dark:text-white focus:outline-none focus:border-amber-500"
                  />
                </div>

                <div>
                  <label className="block text-neutral-700 dark:text-neutral-300 font-medium mb-1">
                    {t.model} *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Clio 5, Tucson, Sandero..."
                    value={formData.model}
                    onChange={(e) => setFormData({ ...formData, model: e.target.value })}
                    className="w-full bg-neutral-50 dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-700 rounded-lg p-2 text-neutral-900 dark:text-white focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div>
                  <label className="block text-neutral-700 dark:text-neutral-300 font-medium mb-1">
                    {t.year}
                  </label>
                  <input
                    type="number"
                    min="2015"
                    max="2027"
                    value={formData.year}
                    onChange={(e) => setFormData({ ...formData, year: parseInt(e.target.value) })}
                    className="w-full bg-neutral-50 dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-700 rounded-lg p-2 font-mono text-neutral-900 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-neutral-700 dark:text-neutral-300 font-medium mb-1">
                    {t.category}
                  </label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value as VehicleCategory })}
                    className="w-full bg-neutral-50 dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-700 rounded-lg p-2 text-neutral-900 dark:text-white"
                  >
                    <option value="ECONOMY">{t.catEconomy}</option>
                    <option value="SEDAN">{t.catSedan}</option>
                    <option value="SUV">{t.catSuv}</option>
                    <option value="COMMERCIAL">{t.catCommercial}</option>
                    <option value="PREMIUM">{t.catPremium}</option>
                  </select>
                </div>

                <div>
                  <label className="block text-neutral-700 dark:text-neutral-300 font-medium mb-1">
                    {t.transmission}
                  </label>
                  <select
                    value={formData.transmission}
                    onChange={(e) => setFormData({ ...formData, transmission: e.target.value as 'MANUAL' | 'AUTO' })}
                    className="w-full bg-neutral-50 dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-700 rounded-lg p-2 text-neutral-900 dark:text-white"
                  >
                    <option value="MANUAL">{t.manual}</option>
                    <option value="AUTO">{t.auto}</option>
                  </select>
                </div>

                <div>
                  <label className="block text-neutral-700 dark:text-neutral-300 font-medium mb-1">
                    {t.fuelType}
                  </label>
                  <select
                    value={formData.fuelType}
                    onChange={(e) => setFormData({ ...formData, fuelType: e.target.value as 'ESSENCE' | 'DIESEL' | 'GPL' })}
                    className="w-full bg-neutral-50 dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-700 rounded-lg p-2 text-neutral-900 dark:text-white"
                  >
                    <option value="ESSENCE">{t.gasoline}</option>
                    <option value="DIESEL">{t.diesel}</option>
                    <option value="GPL">{t.gpl}</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div>
                  <label className="block text-neutral-700 dark:text-neutral-300 font-medium mb-1">
                    {t.dailyRate} (DZD) *
                  </label>
                  <input
                    type="number"
                    required
                    step="500"
                    value={formData.dailyRate}
                    onChange={(e) => setFormData({ ...formData, dailyRate: parseFloat(e.target.value) })}
                    className="w-full bg-neutral-50 dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-700 rounded-lg p-2 font-mono font-bold text-amber-500"
                  />
                </div>

                <div>
                  <label className="block text-neutral-700 dark:text-neutral-300 font-medium mb-1">
                    {t.odometer} (KM) *
                  </label>
                  <input
                    type="number"
                    required
                    value={formData.currentKm}
                    onChange={(e) => setFormData({ ...formData, currentKm: parseInt(e.target.value) })}
                    className="w-full bg-neutral-50 dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-700 rounded-lg p-2 font-mono text-neutral-900 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-neutral-700 dark:text-neutral-300 font-medium mb-1">
                    {t.fuelLevel}
                  </label>
                  <select
                    value={formData.currentFuel}
                    onChange={(e) => setFormData({ ...formData, currentFuel: e.target.value as FuelLevel })}
                    className="w-full bg-neutral-50 dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-700 rounded-lg p-2 font-mono text-neutral-900 dark:text-white"
                  >
                    <option value="8/8">8/8 (Plein)</option>
                    <option value="7/8">7/8</option>
                    <option value="6/8">6/8</option>
                    <option value="5/8">5/8</option>
                    <option value="4/8">4/8 (Moitié)</option>
                    <option value="3/8">3/8</option>
                    <option value="2/8">2/8</option>
                    <option value="1/8">1/8</option>
                  </select>
                </div>

                <div>
                  <label className="block text-neutral-700 dark:text-neutral-300 font-medium mb-1">
                    {t.status}
                  </label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value as VehicleStatus })}
                    className="w-full bg-neutral-50 dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-700 rounded-lg p-2 text-neutral-900 dark:text-white"
                  >
                    <option value="AVAILABLE">{t.statusAvailable}</option>
                    <option value="RENTED">{t.statusRented}</option>
                    <option value="INSPECTION">{t.statusInspection}</option>
                    <option value="MAINTENANCE">{t.statusMaintenance}</option>
                  </select>
                </div>
              </div>

              {/* Algerian Documents Tracking Section */}
              <div className="pt-2 border-t border-neutral-200 dark:border-neutral-800 space-y-2">
                <h4 className="font-bold text-neutral-900 dark:text-white flex items-center gap-1.5">
                  <Shield className="w-4 h-4 text-amber-500" />
                  <span>{t.documents} (التأمين، البطاقة الرمادية، الفحص الفني)</span>
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="p-2.5 rounded-lg bg-neutral-50 dark:bg-neutral-800/50 border border-neutral-200 dark:border-neutral-700">
                    <span className="font-semibold block mb-1 text-neutral-800 dark:text-neutral-200">{t.assurance}</span>
                    <input
                      type="date"
                      required
                      value={formData.assuranceExpiry}
                      onChange={(e) => setFormData({ ...formData, assuranceExpiry: e.target.value })}
                      className="w-full bg-white dark:bg-neutral-900 border border-neutral-300 dark:border-neutral-700 rounded p-1.5 font-mono text-neutral-900 dark:text-white"
                    />
                  </div>

                  <div className="p-2.5 rounded-lg bg-neutral-50 dark:bg-neutral-800/50 border border-neutral-200 dark:border-neutral-700">
                    <span className="font-semibold block mb-1 text-neutral-800 dark:text-neutral-200">{t.carteGrise}</span>
                    <input
                      type="date"
                      required
                      value={formData.carteGriseExpiry}
                      onChange={(e) => setFormData({ ...formData, carteGriseExpiry: e.target.value })}
                      className="w-full bg-white dark:bg-neutral-900 border border-neutral-300 dark:border-neutral-700 rounded p-1.5 font-mono text-neutral-900 dark:text-white"
                    />
                  </div>

                  <div className="p-2.5 rounded-lg bg-neutral-50 dark:bg-neutral-800/50 border border-neutral-200 dark:border-neutral-700">
                    <span className="font-semibold block mb-1 text-neutral-800 dark:text-neutral-200">{t.controleTech}</span>
                    <input
                      type="date"
                      required
                      value={formData.controleTechExpiry}
                      onChange={(e) => setFormData({ ...formData, controleTechExpiry: e.target.value })}
                      className="w-full bg-white dark:bg-neutral-900 border border-neutral-300 dark:border-neutral-700 rounded p-1.5 font-mono text-neutral-900 dark:text-white"
                    />
                  </div>
                </div>
              </div>

              {/* Submit Buttons */}
              <div className="flex items-center justify-end gap-2 pt-3 border-t border-neutral-200 dark:border-neutral-800">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-lg bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-700 text-neutral-700 dark:text-neutral-300 font-semibold cursor-pointer"
                >
                  {t.cancel}
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-lg bg-amber-500 hover:bg-amber-400 text-neutral-950 font-bold cursor-pointer transition-colors shadow-sm"
                >
                  {editingVehicle ? t.save : t.confirm}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

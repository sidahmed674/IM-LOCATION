import React, { useState } from 'react';
import { 
  Users, Plus, Phone, MapPin, 
  CreditCard, ShieldCheck, AlertCircle, Edit, Trash2, X, Building, User, Calendar
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { dbStore } from '../../db/store';
import { Customer, CustomerType } from '../../types';

export const CustomersView: React.FC = () => {
  const { t, language, addToast } = useApp();
  const customers = dbStore.getCustomers();

  const [typeFilter, setTypeFilter] = useState<'ALL' | 'INDIVIDUAL' | 'COMPANY'>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);

  const [formData, setFormData] = useState({
    type: 'INDIVIDUAL' as CustomerType,
    fullName: '',
    phone: '',
    email: '',
    address: '',
    wilaya: '16 - Alger',
    birthDate: '',
    birthPlace: '',
    cinOrPassport: '',
    cinExpiryDate: '',
    drivingLicenseNumber: '',
    drivingLicenseIssueDate: '',
    drivingLicenseExpiryDate: '',
    companyRegNumber: '',
    notes: '',
  });

  const handleOpenAdd = () => {
    setEditingCustomer(null);
    setFormData({
      type: 'INDIVIDUAL',
      fullName: '',
      phone: '0550 ',
      email: '',
      address: '',
      wilaya: '16 - Alger',
      birthDate: '1992-06-15',
      birthPlace: 'Alger Centre',
      cinOrPassport: '',
      cinExpiryDate: new Date(Date.now() + 500 * 86400000).toISOString().split('T')[0],
      drivingLicenseNumber: '',
      drivingLicenseIssueDate: new Date(Date.now() - 1500 * 86400000).toISOString().split('T')[0],
      drivingLicenseExpiryDate: new Date(Date.now() + 600 * 86400000).toISOString().split('T')[0],
      companyRegNumber: '',
      notes: '',
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (c: Customer) => {
    setEditingCustomer(c);
    setFormData({
      type: c.type,
      fullName: c.fullName,
      phone: c.phone,
      email: c.email || '',
      address: c.address,
      wilaya: c.wilaya,
      birthDate: c.birthDate || '',
      birthPlace: c.birthPlace || '',
      cinOrPassport: c.cinOrPassport,
      cinExpiryDate: c.cinExpiryDate,
      drivingLicenseNumber: c.drivingLicenseNumber,
      drivingLicenseIssueDate: c.drivingLicenseIssueDate,
      drivingLicenseExpiryDate: c.drivingLicenseExpiryDate,
      companyRegNumber: c.companyRegNumber || '',
      notes: c.notes || '',
    });
    setIsModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.fullName || !formData.phone || !formData.cinOrPassport || !formData.drivingLicenseNumber) {
      addToast(language === 'ar' ? 'يرجى ملء جميع الحقول الإلزامية' : 'Veuillez remplir les champs obligatoires', 'error');
      return;
    }

    try {
      if (editingCustomer) {
        dbStore.updateCustomer(editingCustomer.id, {
          type: formData.type,
          fullName: formData.fullName,
          phone: formData.phone,
          email: formData.email,
          address: formData.address,
          wilaya: formData.wilaya,
          birthDate: formData.birthDate,
          birthPlace: formData.birthPlace,
          cinOrPassport: formData.cinOrPassport,
          cinExpiryDate: formData.cinExpiryDate,
          drivingLicenseNumber: formData.drivingLicenseNumber,
          drivingLicenseIssueDate: formData.drivingLicenseIssueDate,
          drivingLicenseExpiryDate: formData.drivingLicenseExpiryDate,
          companyRegNumber: formData.companyRegNumber,
          notes: formData.notes,
        });
        addToast(language === 'ar' ? 'تم تحديث ملف العميل بنجاح' : 'Fiche client mise à jour avec succès', 'success');
      } else {
        dbStore.addCustomer({
          type: formData.type,
          fullName: formData.fullName,
          phone: formData.phone,
          email: formData.email,
          address: formData.address,
          wilaya: formData.wilaya,
          birthDate: formData.birthDate,
          birthPlace: formData.birthPlace,
          cinOrPassport: formData.cinOrPassport,
          cinExpiryDate: formData.cinExpiryDate,
          drivingLicenseNumber: formData.drivingLicenseNumber,
          drivingLicenseIssueDate: formData.drivingLicenseIssueDate,
          drivingLicenseExpiryDate: formData.drivingLicenseExpiryDate,
          companyRegNumber: formData.companyRegNumber,
          notes: formData.notes,
        });
        addToast(language === 'ar' ? 'تم تسجيل العميل بنجاح' : 'Client enregistré avec succès', 'success');
      }
      setIsModalOpen(false);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Erreur';
      addToast(msg, 'error');
    }
  };

  const handleDelete = (id: string, name: string) => {
    if (window.confirm(language === 'ar' ? `هل أنت متأكد من حذف العميل (${name})؟` : `Supprimer le client ${name} ?`)) {
      try {
        dbStore.deleteCustomer(id);
        addToast(language === 'ar' ? 'تم حذف العميل' : 'Client supprimé', 'success');
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : 'Erreur';
        addToast(msg, 'error');
      }
    }
  };

  const filteredCustomers = customers.filter(c => {
    const matchesType = typeFilter === 'ALL' || c.type === typeFilter;
    const matchesSearch = 
      c.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.phone.includes(searchQuery) ||
      c.cinOrPassport.includes(searchQuery) ||
      c.drivingLicenseNumber.includes(searchQuery);
    return matchesType && matchesSearch;
  });

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
            {t.navFichierClients}
          </h2>
          <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">
            {language === 'ar'
              ? 'دليل العملاء (أفراد وشركات) وتتبع صلاحية بطاقة التعريف ورخصة القيادة'
              : 'Gestion des particuliers et entreprises, suivi de validité CIN & permis de conduire'}
          </p>
        </div>

        <button
          onClick={handleOpenAdd}
          className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-neutral-950 font-bold text-xs transition-colors shadow-sm cursor-pointer self-start sm:self-auto font-bukra italic"
        >
          <Plus className="w-4 h-4" />
          <span>{t.actionAddCustomer}</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="p-3 rounded-2xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 flex flex-col md:flex-row items-center justify-between gap-3 shadow-xs">
        <div className="flex items-center gap-1 w-full md:w-auto">
          {[
            { id: 'ALL', label: t.all },
            { id: 'INDIVIDUAL', label: t.individual },
            { id: 'COMPANY', label: t.company },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setTypeFilter(tab.id as 'ALL' | 'INDIVIDUAL' | 'COMPANY')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors cursor-pointer ${
                typeFilter === tab.id
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
          placeholder={language === 'ar' ? 'بحث بالاسم، الهاتف، بطاقة التعريف أو الرخصة...' : 'Recherche nom, téléphone, CIN, permis...'}
          className="w-full md:w-80 bg-neutral-50 dark:bg-neutral-800/80 border border-neutral-200 dark:border-neutral-700/80 rounded-lg px-3 py-1.5 text-xs text-neutral-900 dark:text-neutral-200 focus:outline-none focus:border-amber-500"
        />
      </div>

      {/* Customers List Cards or Empty State */}
      {filteredCustomers.length === 0 ? (
        <div className="p-12 text-center rounded-2xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 space-y-3">
          <Users className="w-12 h-12 text-neutral-400 mx-auto" />
          <h3 className="font-bold text-sm text-neutral-900 dark:text-white font-bukra italic">
            {t.noData}
          </h3>
          <p className="text-xs text-neutral-500 max-w-sm mx-auto">
            {language === 'ar' ? 'لم يتم تسجيل أي عميل بعد. يمكنك البدء بإضافة ملف العميل الأول.' : 'Aucun client enregistré pour l’instant. Cliquez ci-dessous pour ajouter un client.'}
          </p>
          <button
            onClick={handleOpenAdd}
            className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-neutral-950 font-bold text-xs cursor-pointer shadow-sm inline-flex items-center gap-1.5 font-bukra italic"
          >
            <Plus className="w-4 h-4" />
            <span>{t.actionAddCustomer}</span>
          </button>
        </div>
      ) : (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredCustomers.map(customer => {
          const licenseDays = Math.ceil((new Date(customer.drivingLicenseExpiryDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
          const isLicenseExpiring = licenseDays <= 7;

          return (
            <div
              key={customer.id}
              className="p-4 rounded-xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 shadow-xs flex flex-col justify-between space-y-3"
            >
              <div>
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <div className="p-2 rounded-lg bg-neutral-100 dark:bg-neutral-800 text-amber-500">
                      {customer.type === 'COMPANY' ? <Building className="w-4 h-4" /> : <User className="w-4 h-4" />}
                    </div>
                    <div>
                      <h3 className="font-bold text-sm text-neutral-900 dark:text-white">
                        {customer.fullName}
                      </h3>
                      <span className="text-[10px] text-neutral-400 uppercase font-mono">
                        {customer.type === 'COMPANY' ? t.company : t.individual}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleOpenEdit(customer)}
                      className="p-1 rounded bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-700 text-neutral-600 dark:text-neutral-300 transition-colors cursor-pointer"
                      title={t.edit}
                    >
                      <Edit className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleDelete(customer.id, customer.fullName)}
                      className="p-1 rounded bg-neutral-100 dark:bg-neutral-800 hover:bg-red-500/20 text-neutral-600 dark:text-neutral-400 hover:text-red-400 transition-colors cursor-pointer"
                      title={t.delete}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Details */}
                <div className="space-y-1.5 text-xs text-neutral-600 dark:text-neutral-400 mt-3">
                  <div className="flex items-center gap-1.5">
                    <Phone className="w-3.5 h-3.5 text-neutral-400" />
                    <span className="font-mono text-neutral-800 dark:text-neutral-200 font-semibold">{customer.phone}</span>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-neutral-400" />
                    <span className="truncate">{customer.address} ({customer.wilaya})</span>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <CreditCard className="w-3.5 h-3.5 text-neutral-400" />
                    <span>CIN: <span className="font-mono">{customer.cinOrPassport}</span></span>
                  </div>

                  {(customer.birthDate || customer.birthPlace) && (
                    <div className="flex items-center gap-1.5 text-[11px] text-neutral-500">
                      <Calendar className="w-3.5 h-3.5 text-neutral-400 shrink-0" />
                      <span>
                        {language === 'ar' ? 'الميلاد: ' : 'Né(e) le : '}
                        <span className="font-semibold text-neutral-800 dark:text-neutral-200">
                          {customer.birthDate || '—'}
                        </span>
                        {customer.birthPlace ? ` (${customer.birthPlace})` : ''}
                      </span>
                    </div>
                  )}

                  <div className="flex items-center justify-between p-2 rounded bg-neutral-50 dark:bg-neutral-800/40 text-[11px] mt-2">
                    <span className="flex items-center gap-1 text-neutral-700 dark:text-neutral-300">
                      <ShieldCheck className="w-3.5 h-3.5 text-amber-500" />
                      {t.drivingLicense}: <span className="font-mono">{customer.drivingLicenseNumber}</span>
                    </span>
                    <span className={`font-mono font-semibold ${isLicenseExpiring ? 'text-red-500' : 'text-emerald-500'}`}>
                      {customer.drivingLicenseExpiryDate}
                      {isLicenseExpiring && ` (${licenseDays}j)`}
                    </span>
                  </div>
                </div>
              </div>

              {/* History Footnotes */}
              <div className="pt-2 border-t border-neutral-100 dark:border-neutral-800 flex items-center justify-between text-xs font-mono text-neutral-500">
                <span>{customer.totalRentals} {language === 'ar' ? 'عقود' : 'locations'}</span>
                <span className="font-semibold text-neutral-800 dark:text-neutral-200">
                  {formatDzd(customer.totalSpentDzd)}
                </span>
              </div>
            </div>
          );
        })}
      </div>
      )}

      {/* Add / Edit Customer Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="w-full max-w-xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-2xl p-6 shadow-2xl space-y-4 my-8">
            <div className="flex items-center justify-between pb-3 border-b border-neutral-200 dark:border-neutral-800">
              <div className="flex items-center gap-2">
                <Users className="w-5 h-5 text-amber-500" />
                <h3 className="font-bold text-base text-neutral-900 dark:text-white">
                  {editingCustomer 
                    ? (language === 'ar' ? 'تعديل بيانات العميل' : 'Modifier la Fiche Client')
                    : t.actionAddCustomer}
                </h3>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-neutral-400 hover:text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-3.5 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-neutral-700 dark:text-neutral-300 font-medium mb-1">
                    {t.customerType} *
                  </label>
                  <select
                    value={formData.type}
                    onChange={(e) => setFormData({ ...formData, type: e.target.value as CustomerType })}
                    className="w-full bg-neutral-50 dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-700 rounded-lg p-2 text-neutral-900 dark:text-white"
                  >
                    <option value="INDIVIDUAL">{t.individual}</option>
                    <option value="COMPANY">{t.company}</option>
                  </select>
                </div>

                <div>
                  <label className="block text-neutral-700 dark:text-neutral-300 font-medium mb-1">
                    {t.fullName} *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Karim Belkacem / SARL..."
                    value={formData.fullName}
                    onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                    className="w-full bg-neutral-50 dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-700 rounded-lg p-2 text-neutral-900 dark:text-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-neutral-700 dark:text-neutral-300 font-medium mb-1">
                    {t.phone} *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="0550 12 34 56"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full bg-neutral-50 dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-700 rounded-lg p-2 font-mono text-neutral-900 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-neutral-700 dark:text-neutral-300 font-medium mb-1">
                    {t.email}
                  </label>
                  <input
                    type="email"
                    placeholder="client@mail.dz"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full bg-neutral-50 dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-700 rounded-lg p-2 text-neutral-900 dark:text-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-neutral-700 dark:text-neutral-300 font-medium mb-1">
                    {t.address} *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="14 Rue Didouche Mourad..."
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    className="w-full bg-neutral-50 dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-700 rounded-lg p-2 text-neutral-900 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-neutral-700 dark:text-neutral-300 font-medium mb-1">
                    {t.wilaya} *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="16 - Alger / 31 - Oran"
                    value={formData.wilaya}
                    onChange={(e) => setFormData({ ...formData, wilaya: e.target.value })}
                    className="w-full bg-neutral-50 dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-700 rounded-lg p-2 text-neutral-900 dark:text-white"
                  />
                </div>
              </div>

              {/* État Civil / Birth Information (USER REQUIREMENT: تاريخ ومكان الميلاد لكي تظهر في العقد مباشرة) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3 rounded-xl bg-amber-500/10 border border-amber-500/30">
                <div>
                  <label className="block text-neutral-800 dark:text-neutral-200 font-bold mb-1">
                    {language === 'ar' ? 'تاريخ الميلاد' : 'Date de Naissance'} *
                  </label>
                  <input
                    type="date"
                    required
                    value={formData.birthDate}
                    onChange={(e) => setFormData({ ...formData, birthDate: e.target.value })}
                    className="w-full bg-white dark:bg-neutral-900 border border-neutral-300 dark:border-neutral-700 rounded-lg p-2 font-mono text-neutral-900 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-neutral-800 dark:text-neutral-200 font-bold mb-1">
                    {language === 'ar' ? 'مكان الميلاد (البلدية / الولاية)' : 'Lieu de Naissance (Commune / Wilaya)'} *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder={language === 'ar' ? 'مثال: الجزائر الوسطى، وهران، البليدة...' : 'Ex: Alger Centre, Oran, Blida...'}
                    value={formData.birthPlace}
                    onChange={(e) => setFormData({ ...formData, birthPlace: e.target.value })}
                    className="w-full bg-white dark:bg-neutral-900 border border-neutral-300 dark:border-neutral-700 rounded-lg p-2 text-neutral-900 dark:text-white"
                  />
                </div>
              </div>

              {/* Algerian Identity Section */}
              <div className="p-3 rounded-xl bg-neutral-50 dark:bg-neutral-800/40 border border-neutral-200 dark:border-neutral-700 space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-neutral-700 dark:text-neutral-300 font-medium mb-1">
                      {t.cin} *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="1120934812"
                      value={formData.cinOrPassport}
                      onChange={(e) => setFormData({ ...formData, cinOrPassport: e.target.value })}
                      className="w-full bg-white dark:bg-neutral-900 border border-neutral-300 dark:border-neutral-700 rounded-lg p-2 font-mono text-neutral-900 dark:text-white"
                    />
                  </div>

                  <div>
                    <label className="block text-neutral-700 dark:text-neutral-300 font-medium mb-1">
                      {t.cinExpiry} *
                    </label>
                    <input
                      type="date"
                      required
                      value={formData.cinExpiryDate}
                      onChange={(e) => setFormData({ ...formData, cinExpiryDate: e.target.value })}
                      className="w-full bg-white dark:bg-neutral-900 border border-neutral-300 dark:border-neutral-700 rounded-lg p-2 font-mono text-neutral-900 dark:text-white"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-neutral-700 dark:text-neutral-300 font-medium mb-1">
                      {t.licenseNumber} *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="16/94821"
                      value={formData.drivingLicenseNumber}
                      onChange={(e) => setFormData({ ...formData, drivingLicenseNumber: e.target.value })}
                      className="w-full bg-white dark:bg-neutral-900 border border-neutral-300 dark:border-neutral-700 rounded-lg p-2 font-mono text-neutral-900 dark:text-white"
                    />
                  </div>

                  <div>
                    <label className="block text-neutral-700 dark:text-neutral-300 font-medium mb-1">
                      {t.licenseIssue}
                    </label>
                    <input
                      type="date"
                      value={formData.drivingLicenseIssueDate}
                      onChange={(e) => setFormData({ ...formData, drivingLicenseIssueDate: e.target.value })}
                      className="w-full bg-white dark:bg-neutral-900 border border-neutral-300 dark:border-neutral-700 rounded-lg p-2 font-mono text-neutral-900 dark:text-white"
                    />
                  </div>

                  <div>
                    <label className="block text-neutral-700 dark:text-neutral-300 font-medium mb-1">
                      {t.licenseExpiry} *
                    </label>
                    <input
                      type="date"
                      required
                      value={formData.drivingLicenseExpiryDate}
                      onChange={(e) => setFormData({ ...formData, drivingLicenseExpiryDate: e.target.value })}
                      className="w-full bg-white dark:bg-neutral-900 border border-neutral-300 dark:border-neutral-700 rounded-lg p-2 font-mono text-neutral-900 dark:text-white"
                    />
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-neutral-200 dark:border-neutral-800">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-lg bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 font-semibold cursor-pointer"
                >
                  {t.cancel}
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-lg bg-amber-500 hover:bg-amber-400 text-neutral-950 font-bold cursor-pointer transition-colors shadow-sm"
                >
                  {editingCustomer ? t.save : t.confirm}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

/**
 * IM LOCATION - Core Types & Data Models
 * Specifically tailored for the Algerian Car Rental & Fleet Market
 */

export type NavigationTab = 
  | 'dashboard' 
  // FLOTTE AUTOMOBILE
  | 'fleet' 
  | 'fleet_calendar' 
  | 'maintenance'
  // LOCATIONS & CLIENTS
  | 'customers' 
  | 'rentals' 
  | 'invoices'
  // COMPTABILITE & CAISSE
  | 'finance' 
  | 'reports'
  // SYSTEME & DONNEES
  | 'backup' 
  | 'settings';

export type VehicleStatus = 
  | 'AVAILABLE'     // متاح / Disponible
  | 'RESERVED'      // محجوز / Réservé
  | 'RENTED'        // مؤجر / En location
  | 'RETURNED'      // مُعاد / Restitué
  | 'INSPECTION'    // قيد الفحص / En inspection
  | 'MAINTENANCE';  // قيد الصيانة / En maintenance

export type FuelLevel = '0/8' | '1/8' | '2/8' | '3/8' | '4/8' | '5/8' | '6/8' | '7/8' | '8/8';

export type VehicleCategory = 
  | 'ECONOMY'       // إقتصادية / Économique (Symbol, Clio, 208, Sandero)
  | 'SEDAN'         // برلين / Berline (Megane, Accent, Octavia)
  | 'SUV'           // دفع رباعي / SUV (Tucson, Sportage, Duster)
  | 'COMMERCIAL'    // نفعية / Utilitaire (Hilux, Berlingo, Partner)
  | 'PREMIUM';      // فاخرة / Prestige (Golf 8, Audi, Mercedes)

export interface VehicleDocument {
  number: string;
  issueDate: string;
  expiryDate: string;
  notes?: string;
  isExpired?: boolean;
  daysUntilExpiry?: number;
}

export interface Vehicle {
  id: string;
  matricule: string;              // رقم التسجيل الجزائري: e.g. 00124-122-16
  brand: string;                  // الماركة: Renault, Hyundai, etc.
  model: string;                  // الموديل: Clio 5, Tucson, etc.
  year: number;                   // سنة الصنع: 2023, 2024
  category: VehicleCategory;
  transmission: 'MANUAL' | 'AUTO';// يدوي / أوتوماتيكي
  fuelType: 'ESSENCE' | 'DIESEL' | 'GPL';
  color: string;
  dailyRate: number;              // السعر اليومي بالدينار الجزائري (DZD)
  currentKm: number;              // عداد الكيلومتر الحالي
  currentFuel: FuelLevel;         // مستوى الوقود الحالي
  status: VehicleStatus;
  imageUrl?: string;
  chassisNumber?: string;         // رقم الهيكل N° Châssis
  
  // Algerian Legal Documents Tracker
  documents: {
    assurance: VehicleDocument;         // التأمين
    carteGrise: VehicleDocument;        // البطاقة الرمادية
    controleTechnique: VehicleDocument; // الفحص الفني الدوري
  };
  
  nextOilChangeKm?: number;             // الكيلومتر الموصى به لتغيير الزيت (Vidange)
  createdAt: string;
  updatedAt: string;
}

export type CustomerType = 'INDIVIDUAL' | 'COMPANY';

export interface Customer {
  id: string;
  type: CustomerType;
  fullName: string;              // الاسم الكامل / Raison Sociale
  phone: string;                 // رقم الهاتف (e.g., 0550 12 34 56)
  email?: string;
  address: string;               // العنوان
  wilaya: string;                // الولاية (16 Alger, 31 Oran, 25 Constantine...)
  
  // Identity & Driving License
  cinOrPassport: string;         // رقم بطاقة التعريف الوطنية أو جواز السفر
  cinExpiryDate: string;
  birthDate?: string;            // تاريخ الميلاد
  birthPlace?: string;           // مكان الميلاد
  drivingLicenseNumber: string;  // رقم رخصة القيادة
  drivingLicenseIssueDate: string; // تاريخ الإصدار
  drivingLicenseExpiryDate: string; // تاريخ الانتهاء
  licenseIssuePlace?: string;    // دائرة / مكان تسليم الرخصة
  
  companyRegNumber?: string;     // RC / NIF للشركات
  totalRentals: number;
  totalSpentDzd: number;
  notes?: string;
  isBlacklisted?: boolean;
  createdAt: string;
}

export type RentalStatus = 
  | 'ACTIVE'      // جاري / En cours
  | 'RESERVED'    // محجوز / Réservé
  | 'COMPLETED'   // مكتمل / Clôturé
  | 'CANCELLED'   // ملغى / Annulé
  | 'OVERDUE';    // متأخر في الإرجاع / En retard

export interface DamageReportItem {
  id: string;
  location: 'FRONT_BUMPER' | 'REAR_BUMPER' | 'HOOD' | 'TRUNK' | 'LEFT_FRONT_DOOR' | 'LEFT_REAR_DOOR' | 'RIGHT_FRONT_DOOR' | 'RIGHT_REAR_DOOR' | 'ROOF' | 'WINDSHIELD' | 'TYRES' | 'INTERIOR';
  damageType: 'SCRATCH' | 'DENT' | 'CRACK' | 'BROKEN' | 'DIRT'; // خدش، صدمة، كسر، اتساخ
  description: string;
  estimatedCostDzd: number;      // تكلفة الإصلاح المقدرة بالدينار الجزائري
  photoUrl?: string;
}

export interface RentalContract {
  id: string;
  contractNumber: string;        // رقم العقد: CT-2026-0042 أو RES-2026-0012
  contractType?: 'RENTAL' | 'RESERVATION'; // عقد كراء أو وصل حجز مسبق
  customerId: string;
  vehicleId: string;             // السيارة الرئيسية
  
  // Multi-vehicle support (كراء متعدد لزبون واحد)
  vehicleIds?: string[];
  selectedVehicleIds?: string[];
  vehicleSnapshots?: Vehicle[];
  isMultiVehicle?: boolean;

  // Wedding & Event flexibility (نظام الأعراس واليومية)
  isJournee?: boolean;           // نظام اليوم الكامل (Journée complète)
  eventLocation?: string;        // مكان المناسبة أو العرس (Salle des fêtes, Ville...)
  includesDriver?: boolean;      // مع سائق (Chauffeur / Suiveur)
  
  // Snapshots for document integrity
  customerSnapshot: Customer;
  vehicleSnapshot: Vehicle;
  
  // Rental timeline
  startDate: string;             // YYYY-MM-DD
  startTime: string;             // HH:mm
  expectedEndDate: string;       // YYYY-MM-DD
  expectedEndTime: string;       // HH:mm
  actualReturnDate?: string;
  actualReturnTime?: string;
  
  durationDays: number;
  
  // Initial condition at delivery (تسليم المركبة)
  startKm: number;
  startFuel: FuelLevel;
  initialNotes?: string;
  initialDamages: DamageReportItem[];
  
  // Financial Structure (DZD) - No Caution required by default
  dailyRateDzd: number;
  totalRentDzd: number;          // إجمالي سعر الإيجار = مجموع أسعار السيارات × الأيام
  advancePaymentDzd: number;     // العربون / الدفعة المقدمة (Avance)
  remainingBalanceDzd: number;   // المبلغ المتبقي (Reste à payer) = الإجمالي - العربون
  deliveryFeeDzd?: number;       // مصاريف التوصيل
  cautionDzd?: number;           // اختياري (0 إذا تم إلغاؤه)
  cautionPaymentMethod?: 'CASH' | 'CHEQUE' | 'CARD';
  customTag?: string;            // مثل Heureux Mariage, Cortège, etc.
  
  // Return & Settlement details (عند استلام المركبة)
  returnDetails?: {
    returnKm: number;
    excessKm: number;
    excessKmPenaltyDzd: number;
    
    returnFuel: FuelLevel;
    fuelPenaltyDzd: number;
    
    isLate: boolean;
    lateHours: number;
    latePenaltyDzd: number;
    
    cleaningPenaltyDzd: number;
    newDamages: DamageReportItem[];
    damagePenaltyDzd: number;
    
    // Settlement calculations
    totalPenaltiesDzd: number;    // مجموع الغرامات والأضرار
    netSettlementDzd: number;     // الناتج النهائي للتسوية المالية
    cautionRefundedDzd: number;   // المبلغ المسترجع من الوديعة
    additionalPaidByClientDzd: number; // المبلغ الإضافي المدفوع من العميل إن فاقت الغرامات الوديعة
    
    returnedByStaffName: string;
    returnTimestamp: string;
    settlementNotes?: string;
  };
  
  status: RentalStatus;
  createdAt: string;
  updatedAt: string;
}

export interface Invoice {
  id: string;
  invoiceNumber: string;         // FACT-2026-0012
  contractId: string;
  customerId: string;
  customerName: string;
  vehicleMatricule: string;
  vehicleModel: string;
  date: string;
  dueDate: string;
  subtotalDzd: number;
  tvaRatePercent: number;        // e.g. 19% or 0%
  tvaAmountDzd: number;
  timbreFiscalDzd: number;       // Timbre fiscal algérien (e.g. 100 DZD ou 1%)
  totalAmountDzd: number;
  paidAmountDzd: number;
  status: 'PAID' | 'PARTIALLY_PAID' | 'UNPAID';
  paymentMethod: 'CASH' | 'CHEQUE' | 'VIREMENT';
}

export interface MaintenanceRecord {
  id: string;
  vehicleId: string;
  vehicleMatricule: string;
  type: 'OIL_CHANGE' | 'TYRES' | 'BRAKES' | 'BODY_REPAIR' | 'ROUTINE_INSPECTION' | 'OTHER';
  description: string;
  costDzd: number;
  performedAtKm: number;
  garageName: string;
  date: string;
  invoiceNumber?: string;
  status: 'SCHEDULED' | 'IN_PROGRESS' | 'COMPLETED';
}

export interface FinancialTransaction {
  id: string;
  type: 'INCOME_RENT' | 'INCOME_PENALTY' | 'EXPENSE_MAINTENANCE' | 'EXPENSE_INSURANCE' | 'EXPENSE_FUEL' | 'EXPENSE_CLEANING' | 'EXPENSE_OTHER';
  amountDzd: number;
  relatedContractId?: string;
  relatedVehicleId?: string;
  description: string;
  paymentMethod: 'CASH' | 'VIREMENT' | 'CHEQUE';
  date: string;
  recordedBy: string;
}

export interface SmartAlert {
  id: string;
  type: 'INSURANCE_EXPIRING' | 'CARTE_GRISE_EXPIRING' | 'CONTROLE_TECH_EXPIRING' | 'DRIVING_LICENSE_EXPIRING' | 'RETURN_OVERDUE' | 'OIL_CHANGE_DUE';
  title: string;
  description: string;
  severity: 'WARNING' | 'CRITICAL';
  targetId: string;
  targetMatriculeOrName: string;
  daysRemaining?: number;
  dueDate: string;
}

export interface AgencySettings {
  agencyName: string;
  brandSlogan: string;
  legalForm: string;             // e.g. SARL, EURL
  address: string;
  city: string;
  wilaya: string;
  phone1: string;
  phone2: string;
  email: string;
  nif: string;                   // الرقم التعريفي الجبائي
  nis: string;                   // الرقم الإحصائي
  rc: string;                    // السجل التجاري
  rib: string;                   // الحساب البنكي الجزائري
  defaultCautionDzd: number;     // مبلغ الوديعة الافتراضي (e.g. 50,000 DZD)
  freeKmPerDay: number;          // الكيلومتر المجاني اليومي (e.g. 250 KM)
  penaltyPerExcessKmDzd: number; // غرامة الكيلومتر الزائد (e.g. 15 DZD)
  fuelPricePerLiterDzd: number;  // سعر الوقود للتر (e.g. 45 DZD)
  tvaPercent: number;            // 19%
}

/**
 * IM LOCATION - Offline-First SQLite Reactive Data Store
 * Default state is 100% CLEAN & EMPTY as requested by the user.
 * Users populate their own cars, customers, and agreements.
 * Includes optional Algerian demo dataset loader and complete database wipe.
 */

import { 
  Vehicle, Customer, RentalContract, MaintenanceRecord, 
  FinancialTransaction, SmartAlert, AgencySettings, DamageReportItem, 
  FuelLevel, Invoice, VehicleStatus
} from '../types';
import { getDaysDifference, subtractDaysFromDate } from '../utils/dateUtils';

const STORAGE_KEYS = {
  VEHICLES: 'im_location_vehicles_clean_v3',
  CUSTOMERS: 'im_location_customers_clean_v3',
  RENTALS: 'im_location_rentals_clean_v3',
  INVOICES: 'im_location_invoices_clean_v3',
  MAINTENANCE: 'im_location_maintenance_clean_v3',
  TRANSACTIONS: 'im_location_transactions_clean_v3',
  SETTINGS: 'im_location_settings_clean_v3',
  INITIALIZED_FLAG: 'im_location_clean_v3_ready'
};

export const DEFAULT_AGENCY_SETTINGS: AgencySettings = {
  agencyName: 'IM LOCATION',
  brandSlogan: 'LOCATION DE VOITURE AVEC OU SANS CHAUFFEUR',
  legalForm: 'Location de Voitures Touristiques & Utilitaires',
  address: 'Bab Ezzouar, Alger',
  city: 'Bab Ezzouar',
  wilaya: '16 - Alger',
  phone1: '0551 96 29 74',
  phone2: '0551-96-29-74',
  email: 'imlocationbbh@gmail.com',
  nif: '001916012485931',
  nis: '001616090023451',
  rc: '16/01-4962353A20',
  rib: '002 00045 0452001948 22 (BEA Alger)',
  defaultCautionDzd: 50000,
  freeKmPerDay: 250,
  penaltyPerExcessKmDzd: 15,
  fuelPricePerLiterDzd: 45,
  tvaPercent: 19,
};

// Demo datasets for optional 1-click test loading
export const DEMO_VEHICLES: Vehicle[] = [
  {
    id: 'veh-demo-01',
    matricule: '00142-123-16', // Alger
    brand: 'Renault',
    model: 'Clio 5 Intens',
    year: 2023,
    category: 'ECONOMY',
    transmission: 'MANUAL',
    fuelType: 'ESSENCE',
    color: 'Gris Titanium',
    dailyRate: 6500,
    currentKm: 34500,
    currentFuel: '6/8',
    status: 'AVAILABLE',
    imageUrl: '/src/assets/images/fleet_renault_clio_1791762677953.jpg',
    documents: {
      assurance: {
        number: 'SAA-ALG-984210',
        issueDate: '2023-10-15',
        expiryDate: new Date(Date.now() + 5 * 86400000).toISOString().split('T')[0], // 5 days -> Alert!
      },
      carteGrise: {
        number: 'CG-16-009128',
        issueDate: '2023-03-15',
        expiryDate: '2027-03-15',
      },
      controleTechnique: {
        number: 'CT-ENACT-44109',
        issueDate: '2024-04-10',
        expiryDate: '2026-11-20',
      }
    },
    nextOilChangeKm: 38000,
    createdAt: '2023-03-20',
    updatedAt: new Date().toISOString().split('T')[0],
  },
  {
    id: 'veh-demo-02',
    matricule: '02819-124-16', // Alger
    brand: 'Hyundai',
    model: 'Tucson N-Line 2.0 CRDi',
    year: 2024,
    category: 'SUV',
    transmission: 'AUTO',
    fuelType: 'DIESEL',
    color: 'Blanc Polaire',
    dailyRate: 13500,
    currentKm: 28450,
    currentFuel: '7/8',
    status: 'AVAILABLE',
    imageUrl: '/src/assets/images/fleet_hyundai_tucson_1791762689871.jpg',
    documents: {
      assurance: {
        number: 'CAAT-DZ-192834',
        issueDate: '2024-01-10',
        expiryDate: '2027-01-10',
      },
      carteGrise: {
        number: 'CG-16-044812',
        issueDate: '2024-01-10',
        expiryDate: '2028-01-10',
      },
      controleTechnique: {
        number: 'CT-ENACT-88219',
        issueDate: '2024-01-10',
        expiryDate: '2026-12-10',
      }
    },
    nextOilChangeKm: 30000,
    createdAt: '2024-01-15',
    updatedAt: new Date().toISOString().split('T')[0],
  },
  {
    id: 'veh-demo-03',
    matricule: '01934-122-31', // Oran
    brand: 'Volkswagen',
    model: 'Golf 8 R-Line 2.0 TDI',
    year: 2023,
    category: 'PREMIUM',
    transmission: 'AUTO',
    fuelType: 'DIESEL',
    color: 'Argent Réflexe Métallisé',
    dailyRate: 12000,
    currentKm: 42100,
    currentFuel: '8/8',
    status: 'AVAILABLE',
    imageUrl: '/src/assets/images/fleet_golf_rline_1791762702073.jpg',
    documents: {
      assurance: {
        number: 'CIAR-ORN-774012',
        issueDate: '2023-05-12',
        expiryDate: '2027-05-12',
      },
      carteGrise: {
        number: 'CG-31-018274',
        issueDate: '2023-05-12',
        expiryDate: '2027-05-12',
      },
      controleTechnique: {
        number: 'CT-VERITAS-33109',
        issueDate: '2023-05-12',
        expiryDate: '2026-11-05',
      }
    },
    nextOilChangeKm: 45000,
    createdAt: '2023-05-20',
    updatedAt: new Date().toISOString().split('T')[0],
  },
  {
    id: 'veh-demo-04',
    matricule: '04821-123-16', // Alger
    brand: 'Dacia',
    model: 'Sandero Stepway',
    year: 2023,
    category: 'ECONOMY',
    transmission: 'MANUAL',
    fuelType: 'ESSENCE',
    color: 'Bleu Azur',
    dailyRate: 7000,
    currentKm: 19500,
    currentFuel: '8/8',
    status: 'AVAILABLE',
    imageUrl: '/src/assets/images/fleet_dacia_sandero_1792104002370.jpg',
    documents: {
      assurance: {
        number: 'SAA-ALG-110293',
        issueDate: '2023-08-10',
        expiryDate: '2027-08-10',
      },
      carteGrise: {
        number: 'CG-16-092834',
        issueDate: '2023-08-10',
        expiryDate: '2028-08-10',
      },
      controleTechnique: {
        number: 'CT-ENACT-77123',
        issueDate: '2023-08-10',
        expiryDate: '2027-02-10',
      }
    },
    nextOilChangeKm: 25000,
    createdAt: '2023-08-15',
    updatedAt: new Date().toISOString().split('T')[0],
  },
  {
    id: 'veh-demo-05',
    matricule: '09124-124-06', // Béjaïa
    brand: 'Peugeot',
    model: '208 GT Line',
    year: 2024,
    category: 'ECONOMY',
    transmission: 'AUTO',
    fuelType: 'ESSENCE',
    color: 'Blanc Nacré',
    dailyRate: 8500,
    currentKm: 12000,
    currentFuel: '7/8',
    status: 'AVAILABLE',
    imageUrl: '/src/assets/images/fleet_peugeot_208_1792104015275.jpg',
    documents: {
      assurance: {
        number: 'AXA-DZ-884120',
        issueDate: '2024-03-01',
        expiryDate: '2027-03-01',
      },
      carteGrise: {
        number: 'CG-06-033918',
        issueDate: '2024-03-01',
        expiryDate: '2028-03-01',
      },
      controleTechnique: {
        number: 'CT-ENACT-99120',
        issueDate: '2024-03-01',
        expiryDate: '2027-03-01',
      }
    },
    nextOilChangeKm: 20000,
    createdAt: '2024-03-10',
    updatedAt: new Date().toISOString().split('T')[0],
  }
];

export const DEMO_CUSTOMERS: Customer[] = [
  {
    id: 'cust-demo-01',
    type: 'INDIVIDUAL',
    fullName: 'Karim Belkacem / كريم بلقاسم',
    phone: '0550 12 34 56',
    email: 'k.belkacem@gmail.com',
    address: '14 Rue Didouche Mourad',
    wilaya: '16 - Alger',
    birthDate: '1988-06-15',
    birthPlace: 'Alger Centre',
    cinOrPassport: '1120934812',
    cinExpiryDate: '2028-04-12',
    drivingLicenseNumber: '16/94821',
    drivingLicenseIssueDate: '2016-04-12',
    drivingLicenseExpiryDate: '2029-04-12',
    totalRentals: 0,
    totalSpentDzd: 0,
    createdAt: '2024-01-10',
  },
  {
    id: 'cust-demo-02',
    type: 'COMPANY',
    fullName: 'SARL ATLAS LOGISTIQUE',
    phone: '0661 45 78 90',
    email: 'direction@atlas-logistique-dz.com',
    address: 'Zone Industrielle Es-Sénia',
    wilaya: '31 - Oran',
    birthDate: '1982-11-20',
    birthPlace: 'Oran',
    cinOrPassport: '3109281744',
    cinExpiryDate: '2027-09-15',
    drivingLicenseNumber: '31/00827',
    drivingLicenseIssueDate: '2012-09-15',
    drivingLicenseExpiryDate: '2028-09-15',
    companyRegNumber: 'RC: 31/00-112093B / NIF: 001831092819',
    totalRentals: 0,
    totalSpentDzd: 0,
    createdAt: '2023-11-05',
  }
];

class DataStore {
  private vehicles: Vehicle[] = [];
  private customers: Customer[] = [];
  private rentals: RentalContract[] = [];
  private invoices: Invoice[] = [];
  private maintenance: MaintenanceRecord[] = [];
  private transactions: FinancialTransaction[] = [];
  private settings: AgencySettings = DEFAULT_AGENCY_SETTINGS;
  private subscribers: Array<() => void> = [];

  constructor() {
    this.loadFromStorage();
    this.syncVehicleStatuses();
  }

  private loadFromStorage() {
    try {
      // Purge any legacy sample/testing keys from previous sessions to guarantee 100% clean data
      const legacyKeys = [
        'im_location_vehicles', 'im_location_customers', 'im_location_rentals',
        'im_location_vehicles_v2', 'im_location_customers_v2', 'im_location_rentals_v2',
        'im_location_invoices_v2', 'im_location_maintenance_v2', 'im_location_transactions_v2'
      ];
      legacyKeys.forEach(k => {
        try { localStorage.removeItem(k); } catch {}
      });

      const v = localStorage.getItem(STORAGE_KEYS.VEHICLES);
      this.vehicles = v ? JSON.parse(v) : [];

      const c = localStorage.getItem(STORAGE_KEYS.CUSTOMERS);
      this.customers = c ? JSON.parse(c) : [];

      const r = localStorage.getItem(STORAGE_KEYS.RENTALS);
      this.rentals = r ? JSON.parse(r) : [];

      const inv = localStorage.getItem(STORAGE_KEYS.INVOICES);
      this.invoices = inv ? JSON.parse(inv) : [];

      const m = localStorage.getItem(STORAGE_KEYS.MAINTENANCE);
      this.maintenance = m ? JSON.parse(m) : [];

      const t = localStorage.getItem(STORAGE_KEYS.TRANSACTIONS);
      this.transactions = t ? JSON.parse(t) : [];

      const s = localStorage.getItem(STORAGE_KEYS.SETTINGS);
      this.settings = s ? JSON.parse(s) : DEFAULT_AGENCY_SETTINGS;
      if (this.settings.rc === '16/00-0984721B21' || !this.settings.email.includes('imlocationbbh')) {
        this.settings = { ...this.settings, ...DEFAULT_AGENCY_SETTINGS };
        this.saveToStorage();
      }
    } catch {
      this.clearAllData();
    }
  }

  private saveToStorage() {
    try {
      localStorage.setItem(STORAGE_KEYS.VEHICLES, JSON.stringify(this.vehicles));
      localStorage.setItem(STORAGE_KEYS.CUSTOMERS, JSON.stringify(this.customers));
      localStorage.setItem(STORAGE_KEYS.RENTALS, JSON.stringify(this.rentals));
      localStorage.setItem(STORAGE_KEYS.INVOICES, JSON.stringify(this.invoices));
      localStorage.setItem(STORAGE_KEYS.MAINTENANCE, JSON.stringify(this.maintenance));
      localStorage.setItem(STORAGE_KEYS.TRANSACTIONS, JSON.stringify(this.transactions));
      localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(this.settings));
    } catch (e) {
      console.error('Storage save error:', e);
    }
    this.notifySubscribers();
  }

  public subscribe(cb: () => void) {
    this.subscribers.push(cb);
    return () => {
      this.subscribers = this.subscribers.filter(s => s !== cb);
    };
  }

  private notifySubscribers() {
    this.subscribers.forEach(cb => cb());
  }

  // Synchronizes vehicle statuses based on today's active rentals and reservations
  // If a vehicle has a future reservation (startDate > today), it remains AVAILABLE today for rental!
  public syncVehicleStatuses() {
    const todayStr = new Date().toISOString().split('T')[0];
    let changed = false;

    this.vehicles.forEach(v => {
      if (v.status === 'MAINTENANCE' || v.status === 'INSPECTION') return;

      // Find contracts physically active covering today
      const activeContractToday = this.rentals.find(r => {
        if (r.status === 'CANCELLED' || r.status === 'COMPLETED') return false;
        const matchesCar = r.vehicleId === v.id || (r.vehicleIds && r.vehicleIds.includes(v.id));
        if (!matchesCar) return false;
        return r.startDate <= todayStr && (r.expectedEndDate >= todayStr || r.status === 'OVERDUE');
      });

      if (activeContractToday) {
        const expectedStatus: VehicleStatus = activeContractToday.contractType === 'RESERVATION' ? 'RESERVED' : 'RENTED';
        if (v.status !== expectedStatus) {
          v.status = expectedStatus;
          changed = true;
        }
      } else {
        // No active contract covering today.
        // Even if there is a reservation scheduled for next week or next month, the vehicle is AVAILABLE to rent now!
        if (v.status === 'RENTED' || v.status === 'RESERVED') {
          v.status = 'AVAILABLE';
          changed = true;
        }
      }
    });

    if (changed) {
      this.saveToStorage();
    }
  }

  // WIPE ALL DATA TO ZERO (Requested: Empty database by default)
  public clearAllData() {
    this.vehicles = [];
    this.customers = [];
    this.rentals = [];
    this.invoices = [];
    this.maintenance = [];
    this.transactions = [];
    this.saveToStorage();
  }

  // OPTIONAL: Load Algerian Demo Dataset for evaluation/testing
  public loadSampleDemoData() {
    this.vehicles = [...DEMO_VEHICLES];
    this.customers = [...DEMO_CUSTOMERS];
    this.rentals = [];
    this.invoices = [];
    this.maintenance = [];
    this.transactions = [];
    this.saveToStorage();
  }

  // --------------------------------------------------------------------------
  // FLEET MANAGEMENT (CRUD)
  // --------------------------------------------------------------------------
  public getVehicles(): Vehicle[] {
    return [...this.vehicles];
  }

  public getVehicleById(id: string): Vehicle | undefined {
    return this.vehicles.find(v => v.id === id);
  }

  public addVehicle(vehicleData: Omit<Vehicle, 'id' | 'createdAt' | 'updatedAt'>): Vehicle {
    const todayStr = new Date().toISOString().split('T')[0];
    const newVehicle: Vehicle = {
      ...vehicleData,
      id: `veh-${Date.now()}`,
      createdAt: todayStr,
      updatedAt: todayStr,
    };
    this.vehicles.unshift(newVehicle);
    this.saveToStorage();
    return newVehicle;
  }

  public updateVehicle(id: string, updates: Partial<Vehicle>): Vehicle {
    const index = this.vehicles.findIndex(v => v.id === id);
    if (index === -1) throw new Error('Véhicule introuvable');

    if (updates.status === 'AVAILABLE') {
      const hasActiveMaint = this.maintenance.some(
        m => m.vehicleId === id && (m.status === 'IN_PROGRESS' || m.status === 'SCHEDULED')
      );
      if (hasActiveMaint) {
        throw new Error('Impossible de rendre le véhicule disponible tant qu’une maintenance est en cours');
      }
    }

    this.vehicles[index] = {
      ...this.vehicles[index],
      ...updates,
      updatedAt: new Date().toISOString().split('T')[0],
    };
    this.saveToStorage();
    return this.vehicles[index];
  }

  public deleteVehicle(id: string): void {
    const hasActiveRental = this.rentals.some(r => 
      (r.vehicleId === id || (r.vehicleIds && r.vehicleIds.includes(id))) && 
      (r.status === 'ACTIVE' || r.status === 'OVERDUE')
    );
    if (hasActiveRental) {
      throw new Error('لا يمكن حذف المركبة لوجود عقد كراء نشط أو متأخر حالياً. يرجى تسوية واسترجاع المركبة أولاً.');
    }

    // Safely auto-cancel any pending reservations for this vehicle so no orphan contracts remain
    const todayStr = new Date().toISOString().split('T')[0];
    this.rentals.forEach(r => {
      const matchesCar = r.vehicleId === id || (r.vehicleIds && r.vehicleIds.includes(id));
      if (matchesCar && (r.status === 'RESERVED' || r.contractType === 'RESERVATION')) {
        r.status = 'CANCELLED';
        r.initialNotes = (r.initialNotes ? r.initialNotes + ' | ' : '') + '[إلغاء تلقائي: تم حذف المركبة من الأسطول]';
        r.updatedAt = todayStr;
      }
    });

    // Remove maintenance records for this vehicle or mark completed
    this.maintenance = this.maintenance.filter(m => m.vehicleId !== id || m.status === 'COMPLETED');

    this.vehicles = this.vehicles.filter(v => v.id !== id);
    this.saveToStorage();
    this.syncVehicleStatuses();
  }

  // --------------------------------------------------------------------------
  // CUSTOMERS (CRUD)
  // --------------------------------------------------------------------------
  public getCustomers(): Customer[] {
    return [...this.customers];
  }

  public getCustomerById(id: string): Customer | undefined {
    return this.customers.find(c => c.id === id);
  }

  public addCustomer(customerData: Omit<Customer, 'id' | 'totalRentals' | 'totalSpentDzd' | 'createdAt'>): Customer {
    const newCustomer: Customer = {
      ...customerData,
      id: `cust-${Date.now()}`,
      totalRentals: 0,
      totalSpentDzd: 0,
      createdAt: new Date().toISOString().split('T')[0],
    };
    this.customers.unshift(newCustomer);
    this.saveToStorage();
    return newCustomer;
  }

  public updateCustomer(id: string, updates: Partial<Customer>): Customer {
    const index = this.customers.findIndex(c => c.id === id);
    if (index === -1) throw new Error('Client introuvable');
    this.customers[index] = { ...this.customers[index], ...updates };
    this.saveToStorage();
    return this.customers[index];
  }

  public deleteCustomer(id: string): void {
    const hasActiveRentals = this.rentals.some(r => r.customerId === id && (r.status === 'ACTIVE' || r.status === 'OVERDUE'));
    if (hasActiveRentals) {
      throw new Error('Impossible de supprimer un client ayant une location en cours');
    }
    this.customers = this.customers.filter(c => c.id !== id);
    this.saveToStorage();
  }

  // --------------------------------------------------------------------------
  // RENTALS & CONTRACTS
  // --------------------------------------------------------------------------
  public getRentals(): RentalContract[] {
    return [...this.rentals];
  }

  public getRentalById(id: string): RentalContract | undefined {
    return this.rentals.find(r => r.id === id);
  }

  public createRentalContract(data: {
    customerId?: string;
    directCustomer?: {
      fullName: string;
      phone: string;
      address?: string;
      wilaya?: string;
      drivingLicenseNumber?: string;
      drivingLicenseIssueDate?: string;
      drivingLicenseExpiryDate?: string;
      cinOrPassport?: string;
      birthDate?: string;
      birthPlace?: string;
    };
    vehicleId: string;
    vehicleIds?: string[];
    contractType?: 'RENTAL' | 'RESERVATION';
    isJournee?: boolean;
    eventLocation?: string;
    includesDriver?: boolean;
    startDate: string;
    startTime: string;
    expectedEndDate: string;
    expectedEndTime: string;
    durationDays: number;
    startKm: number;
    startFuel: FuelLevel;
    dailyRateDzd?: number;
    advancePaymentDzd: number;
    cautionDzd?: number;
    cautionPaymentMethod?: 'CASH' | 'CHEQUE' | 'CARD';
    initialNotes?: string;
    initialDamages?: DamageReportItem[];
    customTag?: string;
  }): RentalContract {
    // 1. Resolve or Create Customer directly
    let customer: Customer | undefined;
    if (data.customerId) {
      customer = this.getCustomerById(data.customerId);
    }
    
    if (!customer && data.directCustomer && data.directCustomer.fullName) {
      // Check if customer exists by phone or CIN
      const existing = this.customers.find(c => 
        (data.directCustomer!.phone && c.phone === data.directCustomer!.phone) ||
        (data.directCustomer!.cinOrPassport && c.cinOrPassport === data.directCustomer!.cinOrPassport)
      );

      if (existing) {
        customer = this.updateCustomer(existing.id, {
          fullName: data.directCustomer.fullName,
          phone: data.directCustomer.phone || existing.phone,
          address: data.directCustomer.address || existing.address,
          wilaya: data.directCustomer.wilaya || existing.wilaya,
          drivingLicenseNumber: data.directCustomer.drivingLicenseNumber || existing.drivingLicenseNumber,
          drivingLicenseIssueDate: data.directCustomer.drivingLicenseIssueDate || existing.drivingLicenseIssueDate,
          cinOrPassport: data.directCustomer.cinOrPassport || existing.cinOrPassport,
          birthDate: data.directCustomer.birthDate || existing.birthDate,
          birthPlace: data.directCustomer.birthPlace || existing.birthPlace,
        });
      } else {
        customer = this.addCustomer({
          type: 'INDIVIDUAL',
          fullName: data.directCustomer.fullName,
          phone: data.directCustomer.phone || '0550 00 00 00',
          address: data.directCustomer.address || 'Algérie',
          wilaya: data.directCustomer.wilaya || '16 - Alger',
          drivingLicenseNumber: data.directCustomer.drivingLicenseNumber || '16/00000',
          drivingLicenseIssueDate: data.directCustomer.drivingLicenseIssueDate || '2020-01-01',
          drivingLicenseExpiryDate: data.directCustomer.drivingLicenseExpiryDate || '2030-01-01',
          cinOrPassport: data.directCustomer.cinOrPassport || '16-000000',
          cinExpiryDate: '2030-01-01',
          birthDate: data.directCustomer.birthDate || '1990-01-01',
          birthPlace: data.directCustomer.birthPlace || 'Alger',
        });
      }
    }

    if (!customer) {
      // Fallback customer
      customer = this.addCustomer({
        type: 'INDIVIDUAL',
        fullName: 'Client IM LOCATION',
        phone: '0550 00 00 00',
        address: 'Bordj Bou Arreridj / Alger',
        wilaya: '16 - Alger',
        drivingLicenseNumber: '16/00000',
        drivingLicenseIssueDate: '2020-01-01',
        drivingLicenseExpiryDate: '2030-01-01',
        cinOrPassport: '16-000000',
        cinExpiryDate: '2030-01-01',
      });
    }

    // 2. Resolve Vehicles (Single or Multi-Vehicle)
    const targetVehicleIds = data.vehicleIds && data.vehicleIds.length > 0 
      ? Array.from(new Set([data.vehicleId, ...data.vehicleIds]))
      : [data.vehicleId];

    const resolvedVehicles: Vehicle[] = [];
    for (const vId of targetVehicleIds) {
      const v = this.getVehicleById(vId);
      if (v) resolvedVehicles.push(v);
    }

    if (resolvedVehicles.length === 0) {
      throw new Error('Aucun véhicule valide sélectionné');
    }

    const primaryVehicle = resolvedVehicles[0];

    // Calculate daily rate = sum of all vehicles
    const combinedDailyRate = resolvedVehicles.reduce((sum, v) => sum + (v.dailyRate || 0), 0);
    const finalDailyRate = data.dailyRateDzd && data.dailyRateDzd > 0 ? data.dailyRateDzd : combinedDailyRate;

    // Calculation: if Journee, duration is 1 day
    const effectiveDays = data.isJournee ? 1 : Math.max(1, data.durationDays);
    const totalRentDzd = finalDailyRate * effectiveDays;
    const advancePaymentDzd = Number(data.advancePaymentDzd) || 0;
    const remainingBalanceDzd = Math.max(0, totalRentDzd - advancePaymentDzd);

    const isReservation = data.contractType === 'RESERVATION';
    const prefix = isReservation ? 'RES' : 'CT';
    const contractNumber = `${prefix}-${new Date().getFullYear()}-${String(this.rentals.length + 1).padStart(4, '0')}`;
    const todayStr = new Date().toISOString().split('T')[0];

    const newContract: RentalContract = {
      id: `${isReservation ? 'res' : 'rent'}-${Date.now()}`,
      contractNumber,
      contractType: data.contractType || 'RENTAL',
      customerId: customer.id,
      vehicleId: primaryVehicle.id,
      vehicleIds: targetVehicleIds,
      vehicleSnapshots: resolvedVehicles.map(v => ({ ...v })),
      isMultiVehicle: resolvedVehicles.length > 1,
      isJournee: data.isJournee || false,
      eventLocation: data.eventLocation,
      includesDriver: data.includesDriver || false,
      customerSnapshot: { ...customer },
      vehicleSnapshot: { ...primaryVehicle },
      startDate: data.startDate,
      startTime: data.startTime,
      expectedEndDate: data.expectedEndDate,
      expectedEndTime: data.expectedEndTime,
      durationDays: effectiveDays,
      startKm: data.startKm,
      startFuel: data.startFuel,
      initialNotes: data.initialNotes,
      initialDamages: data.initialDamages || [],
      dailyRateDzd: finalDailyRate,
      totalRentDzd,
      advancePaymentDzd,
      remainingBalanceDzd,
      cautionDzd: data.cautionDzd || 0,
      cautionPaymentMethod: data.cautionPaymentMethod || 'CASH',
      customTag: data.customTag || (data.isJournee ? 'Mariage / Journée' : undefined),
      status: isReservation ? 'RESERVED' : 'ACTIVE',
      createdAt: todayStr,
      updatedAt: todayStr,
    };

    // Update statuses for all selected vehicles
    // If it is a reservation starting in the future (startDate > todayStr), keep status as AVAILABLE
    // so the vehicle can be rented out during the period before delivery!
    const isFutureReservation = isReservation && data.startDate > todayStr;
    const targetStatus: VehicleStatus = isFutureReservation 
      ? 'AVAILABLE' 
      : (isReservation ? 'RESERVED' : 'RENTED');

    resolvedVehicles.forEach(v => {
      if (v.status === 'MAINTENANCE' || v.status === 'INSPECTION') return;
      this.updateVehicle(v.id, {
        status: targetStatus,
        currentKm: v.id === primaryVehicle.id ? data.startKm : v.currentKm,
        currentFuel: v.id === primaryVehicle.id ? data.startFuel : v.currentFuel,
      });
    });

    // Record Advance Payment in Finance if > 0
    if (advancePaymentDzd > 0) {
      this.transactions.unshift({
        id: `tx-${Date.now()}`,
        type: 'INCOME_RENT',
        amountDzd: advancePaymentDzd,
        relatedContractId: newContract.id,
        relatedVehicleId: primaryVehicle.id,
        description: `${isReservation ? 'عربون حجز مسبق' : 'دفعة مقدمة لعقد'} ${contractNumber} (${customer.fullName} - ${resolvedVehicles.map(v => v.model).join(', ')})`,
        paymentMethod: 'CASH',
        date: todayStr,
        recordedBy: 'IM LOCATION POS',
      });
    }

    // Automatically generate an associated Invoice
    const subtotal = totalRentDzd;
    const tva = Math.round(subtotal * (this.settings.tvaPercent / 100));
    const timbre = 100; // Algerian timbre fiscal standard
    const totalAmount = subtotal + tva + timbre;

    const newInvoice: Invoice = {
      id: `inv-${Date.now()}`,
      invoiceNumber: `FACT-${new Date().getFullYear()}-${String(this.invoices.length + 1).padStart(4, '0')}`,
      contractId: newContract.id,
      customerId: customer.id,
      customerName: customer.fullName,
      vehicleMatricule: resolvedVehicles.map(v => v.matricule).join(' / '),
      vehicleModel: resolvedVehicles.map(v => `${v.brand} ${v.model}`).join(' + '),
      date: todayStr,
      dueDate: data.expectedEndDate,
      subtotalDzd: subtotal,
      tvaRatePercent: this.settings.tvaPercent,
      tvaAmountDzd: tva,
      timbreFiscalDzd: timbre,
      totalAmountDzd: totalAmount,
      paidAmountDzd: advancePaymentDzd,
      status: advancePaymentDzd >= totalAmount ? 'PAID' : (advancePaymentDzd > 0 ? 'PARTIALLY_PAID' : 'UNPAID'),
      paymentMethod: 'CASH',
    };
    this.invoices.unshift(newInvoice);

    this.rentals.unshift(newContract);
    this.saveToStorage();
    return newContract;
  }

  // --------------------------------------------------------------------------
  // RETURN & SETTLEMENT ENGINE
  // --------------------------------------------------------------------------
  public processReturnSettlement(contractId: string, returnData: {
    returnKm: number;
    returnFuel: FuelLevel;
    actualReturnDate: string;
    actualReturnTime: string;
    newDamages: DamageReportItem[];
    cleaningFeeDzd: number;
    returnedByStaffName: string;
    settlementNotes?: string;
  }): RentalContract {
    const contractIndex = this.rentals.findIndex(r => r.id === contractId);
    if (contractIndex === -1) throw new Error('Contrat introuvable');
    const contract = this.rentals[contractIndex];

    const vehicle = this.getVehicleById(contract.vehicleId);
    if (!vehicle) throw new Error('Véhicule associé introuvable');

    // 1. KM difference & Excess
    const kmDriven = Math.max(0, returnData.returnKm - contract.startKm);
    const allowedKm = contract.durationDays * this.settings.freeKmPerDay;
    const excessKm = Math.max(0, kmDriven - allowedKm);
    const excessKmPenaltyDzd = excessKm * this.settings.penaltyPerExcessKmDzd;

    // 2. Fuel difference
    const fuelToNumber = (f: FuelLevel): number => parseInt(f.split('/')[0], 10);
    const startFuelNum = fuelToNumber(contract.startFuel);
    const returnFuelNum = fuelToNumber(returnData.returnFuel);
    let fuelPenaltyDzd = 0;
    if (returnFuelNum < startFuelNum) {
      const missingEighths = startFuelNum - returnFuelNum;
      const missingLiters = missingEighths * 6.25;
      fuelPenaltyDzd = Math.round(missingLiters * this.settings.fuelPricePerLiterDzd + 600);
    }

    // 3. Late Check
    const expectedReturnDateTime = new Date(`${contract.expectedEndDate}T${contract.expectedEndTime}`);
    const actualReturnDateTime = new Date(`${returnData.actualReturnDate}T${returnData.actualReturnTime}`);
    const diffMs = actualReturnDateTime.getTime() - expectedReturnDateTime.getTime();
    const lateHours = diffMs > 0 ? Math.ceil(diffMs / (1000 * 60 * 60)) : 0;
    let latePenaltyDzd = 0;
    const isLate = lateHours > 2;
    if (isLate) {
      if (lateHours <= 6) {
        latePenaltyDzd = Math.round(contract.dailyRateDzd * 0.5);
      } else {
        const lateDays = Math.ceil(lateHours / 24);
        latePenaltyDzd = lateDays * contract.dailyRateDzd;
      }
    }

    // 4. Damage penalties
    const damagePenaltyDzd = returnData.newDamages.reduce((sum, d) => sum + (d.estimatedCostDzd || 0), 0);

    // 5. Total Penalties
    const totalPenaltiesDzd = excessKmPenaltyDzd + fuelPenaltyDzd + latePenaltyDzd + returnData.cleaningFeeDzd + damagePenaltyDzd;

    // 6. Net Caution Settlement
    const totalOwedDzd = contract.remainingBalanceDzd + totalPenaltiesDzd;
    const currentCaution = contract.cautionDzd || 0;
    let cautionRefundedDzd = 0;
    let additionalPaidByClientDzd = 0;

    if (currentCaution >= totalOwedDzd) {
      cautionRefundedDzd = currentCaution - totalOwedDzd;
      additionalPaidByClientDzd = 0;
    } else {
      cautionRefundedDzd = 0;
      additionalPaidByClientDzd = totalOwedDzd - currentCaution;
    }

    const netSettlementDzd = cautionRefundedDzd - additionalPaidByClientDzd;

    contract.returnDetails = {
      returnKm: returnData.returnKm,
      excessKm,
      excessKmPenaltyDzd,
      returnFuel: returnData.returnFuel,
      fuelPenaltyDzd,
      isLate,
      lateHours,
      latePenaltyDzd,
      cleaningPenaltyDzd: returnData.cleaningFeeDzd,
      newDamages: returnData.newDamages,
      damagePenaltyDzd,
      totalPenaltiesDzd,
      netSettlementDzd,
      cautionRefundedDzd,
      additionalPaidByClientDzd,
      returnedByStaffName: returnData.returnedByStaffName,
      returnTimestamp: new Date().toISOString(),
      settlementNotes: returnData.settlementNotes,
    };

    contract.actualReturnDate = returnData.actualReturnDate;
    contract.actualReturnTime = returnData.actualReturnTime;
    contract.status = 'COMPLETED';
    contract.updatedAt = new Date().toISOString().split('T')[0];

    const nextVehicleStatus = returnData.newDamages.length > 0 ? 'INSPECTION' : 'AVAILABLE';
    this.updateVehicle(contract.vehicleId, {
      currentKm: returnData.returnKm,
      currentFuel: returnData.returnFuel,
      status: nextVehicleStatus,
    });

    const customer = this.getCustomerById(contract.customerId);
    if (customer) {
      this.updateCustomer(customer.id, {
        totalRentals: customer.totalRentals + 1,
        totalSpentDzd: customer.totalSpentDzd + contract.totalRentDzd + totalPenaltiesDzd,
      });
    }

    // Record settlement in Finance
    const finalPaymentReceived = contract.remainingBalanceDzd + totalPenaltiesDzd;
    if (finalPaymentReceived > 0) {
      this.transactions.unshift({
        id: `tx-${Date.now()}`,
        type: totalPenaltiesDzd > 0 ? 'INCOME_PENALTY' : 'INCOME_RENT',
        amountDzd: finalPaymentReceived,
        relatedContractId: contract.id,
        relatedVehicleId: vehicle.id,
        description: `Règlement final restitution ${contract.contractNumber} (Solde: ${contract.remainingBalanceDzd} DZD + Pénalités: ${totalPenaltiesDzd} DZD)`,
        paymentMethod: 'CASH',
        date: returnData.actualReturnDate,
        recordedBy: returnData.returnedByStaffName,
      });
    }

    // Update invoice status to PAID
    const relatedInvoice = this.invoices.find(inv => inv.contractId === contract.id);
    if (relatedInvoice) {
      relatedInvoice.paidAmountDzd = relatedInvoice.totalAmountDzd;
      relatedInvoice.status = 'PAID';
    }

    this.rentals[contractIndex] = contract;
    this.saveToStorage();
    this.syncVehicleStatuses();
    return contract;
  }

  // Cancel an existing reservation with optional advance payment refund
  public cancelReservation(contractId: string, options?: {
    reason?: string;
    refundAdvance?: boolean;
    refundAmountDzd?: number;
    recordedBy?: string;
  }): RentalContract {
    const contractIndex = this.rentals.findIndex(r => r.id === contractId);
    if (contractIndex === -1) throw new Error('Contrat / Réservation introuvable');
    const contract = this.rentals[contractIndex];

    const todayStr = new Date().toISOString().split('T')[0];
    contract.status = 'CANCELLED';
    contract.updatedAt = todayStr;

    if (options?.reason) {
      contract.initialNotes = (contract.initialNotes ? contract.initialNotes + ' | ' : '') + `[إلغاء: ${options.reason}]`;
    }

    // Process optional refund of advance payment
    const refundAmount = options?.refundAmountDzd ?? contract.advancePaymentDzd;
    if (options?.refundAdvance && refundAmount > 0) {
      this.transactions.unshift({
        id: `tx-${Date.now()}`,
        type: 'EXPENSE_OTHER',
        amountDzd: refundAmount,
        relatedContractId: contract.id,
        relatedVehicleId: contract.vehicleId,
        description: `استرجاع عربون حجز ملغى رقم ${contract.contractNumber} (${contract.customerSnapshot?.fullName || 'الزبون'})`,
        paymentMethod: 'CASH',
        date: todayStr,
        recordedBy: options.recordedBy || 'IM LOCATION POS',
      });
    }

    // Update related invoice status if exists
    const relatedInvoice = this.invoices.find(inv => inv.contractId === contract.id);
    if (relatedInvoice) {
      relatedInvoice.status = 'UNPAID';
    }

    this.rentals[contractIndex] = contract;
    this.saveToStorage();
    this.syncVehicleStatuses();
    return contract;
  }

  // --------------------------------------------------------------------------
  // TEMPORAL AVAILABILITY & UPCOMING RESERVATION RADAR
  // --------------------------------------------------------------------------

  // Get all upcoming future reservations for a specific vehicle
  public getUpcomingReservations(vehicleId: string, fromDate?: string): RentalContract[] {
    const checkFrom = fromDate || new Date().toISOString().split('T')[0];
    return this.rentals
      .filter(r => {
        if (r.status === 'CANCELLED' || r.status === 'COMPLETED') return false;
        const matchesCar = r.vehicleId === vehicleId || (r.vehicleIds && r.vehicleIds.includes(vehicleId));
        if (!matchesCar) return false;
        // Contracts that start on or after checkFrom
        return (r.contractType === 'RESERVATION' || r.status === 'RESERVED' || r.startDate >= checkFrom) && r.startDate >= checkFrom;
      })
      .sort((a, b) => a.startDate.localeCompare(b.startDate));
  }

  // Get next upcoming reservation starting from today or a given date
  public getNextUpcomingReservation(vehicleId: string, fromDate?: string): RentalContract | undefined {
    const list = this.getUpcomingReservations(vehicleId, fromDate);
    return list.length > 0 ? list[0] : undefined;
  }

  // Check if a vehicle is free during an interval, and provide maximum allowed end date before next reservation
  public getVehicleAvailabilitySchedule(
    vehicleId: string, 
    startDate: string, 
    endDate: string, 
    excludeContractId?: string
  ): {
    isAvailable: boolean;
    conflictContract?: RentalContract;
    conflictReason?: string;
    nextUpcomingReservation?: RentalContract;
    maxAllowedEndDate?: string;
    freeDaysBeforeNextRes?: number;
  } {
    // Find any contract physically overlapping [startDate, endDate]
    const conflicting = this.rentals.find(r => {
      if (r.id === excludeContractId) return false;
      if (r.status === 'CANCELLED' || r.status === 'COMPLETED') return false;
      const matchesCar = r.vehicleId === vehicleId || (r.vehicleIds && r.vehicleIds.includes(vehicleId));
      if (!matchesCar) return false;

      // Overlap: start1 <= end2 && end1 >= start2
      const contractEnd = r.expectedEndDate;
      return !(endDate < r.startDate || startDate > contractEnd);
    });

    // Find next upcoming reservation starting strictly after startDate
    const upcomingRes = this.getUpcomingReservations(vehicleId, startDate)
      .find(r => r.id !== excludeContractId && r.startDate > startDate);

    let maxAllowedEndDate: string | undefined = undefined;
    let freeDaysBeforeNextRes: number | undefined = undefined;

    if (upcomingRes) {
      maxAllowedEndDate = subtractDaysFromDate(upcomingRes.startDate, 1);
      freeDaysBeforeNextRes = Math.max(0, getDaysDifference(startDate, upcomingRes.startDate));
    }

    if (conflicting) {
      const isRes = conflicting.contractType === 'RESERVATION';
      const reason = isRes
        ? `محجوزة مسبقاً من ${conflicting.startDate} إلى ${conflicting.expectedEndDate} للزبون (${conflicting.customerSnapshot?.fullName || 'حجز مؤكد'})`
        : `قيد الإيجار حالياً من ${conflicting.startDate} إلى ${conflicting.expectedEndDate}`;

      return {
        isAvailable: false,
        conflictContract: conflicting,
        conflictReason: reason,
        nextUpcomingReservation: upcomingRes,
        maxAllowedEndDate,
        freeDaysBeforeNextRes,
      };
    }

    return {
      isAvailable: true,
      nextUpcomingReservation: upcomingRes,
      maxAllowedEndDate,
      freeDaysBeforeNextRes,
    };
  }

  // --------------------------------------------------------------------------
  // INVOICES (CONTRATS & FACTURES)
  // --------------------------------------------------------------------------
  public getInvoices(): Invoice[] {
    return [...this.invoices];
  }

  public markInvoicePaid(id: string): void {
    const inv = this.invoices.find(i => i.id === id);
    if (inv) {
      inv.status = 'PAID';
      inv.paidAmountDzd = inv.totalAmountDzd;
      this.saveToStorage();
    }
  }

  // --------------------------------------------------------------------------
  // MAINTENANCE & ATELIER
  // --------------------------------------------------------------------------
  public getMaintenanceRecords(): MaintenanceRecord[] {
    return [...this.maintenance];
  }

  public addMaintenanceRecord(data: Omit<MaintenanceRecord, 'id'>): MaintenanceRecord {
    const record: MaintenanceRecord = {
      ...data,
      id: `maint-${Date.now()}`,
    };
    this.maintenance.unshift(record);

    if (data.status === 'IN_PROGRESS' || data.status === 'SCHEDULED') {
      const v = this.getVehicleById(data.vehicleId);
      if (v) {
        this.updateVehicle(v.id, { status: 'MAINTENANCE' });
      }
    }

    if (data.costDzd > 0) {
      this.transactions.unshift({
        id: `tx-${Date.now()}`,
        type: 'EXPENSE_MAINTENANCE',
        amountDzd: data.costDzd,
        relatedVehicleId: data.vehicleId,
        description: `Entretien ${data.type}: ${data.description} (${data.vehicleMatricule})`,
        paymentMethod: 'CASH',
        date: data.date,
        recordedBy: 'Chef d’atelier',
      });
    }

    this.saveToStorage();
    return record;
  }

  public completeMaintenance(id: string): void {
    const idx = this.maintenance.findIndex(m => m.id === id);
    if (idx === -1) return;
    this.maintenance[idx].status = 'COMPLETED';
    
    const vehicleId = this.maintenance[idx].vehicleId;
    const stillHasActive = this.maintenance.some(
      m => m.vehicleId === vehicleId && m.id !== id && (m.status === 'IN_PROGRESS' || m.status === 'SCHEDULED')
    );
    if (!stillHasActive) {
      this.updateVehicle(vehicleId, { status: 'AVAILABLE' });
    }
    this.saveToStorage();
  }

  // --------------------------------------------------------------------------
  // FINANCIAL TRANSACTIONS & SUMMARY
  // --------------------------------------------------------------------------
  public getTransactions(): FinancialTransaction[] {
    return [...this.transactions];
  }

  public addTransaction(data: Omit<FinancialTransaction, 'id'>): FinancialTransaction {
    const tx: FinancialTransaction = {
      ...data,
      id: `tx-${Date.now()}`,
    };
    this.transactions.unshift(tx);
    this.saveToStorage();
    return tx;
  }

  public getFinancialSummary() {
    let totalIncome = 0;
    let totalExpenses = 0;
    let totalCautionsInEscrow = 0;

    this.transactions.forEach(tx => {
      if (tx.type.startsWith('INCOME_')) {
        totalIncome += tx.amountDzd;
      } else if (tx.type.startsWith('EXPENSE_')) {
        totalExpenses += tx.amountDzd;
      }
    });

    this.rentals.forEach(r => {
      if (r.status === 'ACTIVE' || r.status === 'OVERDUE') {
        totalCautionsInEscrow += r.cautionDzd || 0;
      }
    });

    return {
      totalIncome,
      totalExpenses,
      netProfit: totalIncome - totalExpenses,
      totalCautionsInEscrow,
    };
  }

  // --------------------------------------------------------------------------
  // SMART 7-DAY COMPLIANCE ALERTS
  // --------------------------------------------------------------------------
  public getSmartAlerts(): SmartAlert[] {
    const alerts: SmartAlert[] = [];
    const now = new Date();

    const getDaysDiff = (targetDateStr: string): number => {
      if (!targetDateStr) return 999;
      const target = new Date(targetDateStr);
      const diffTime = target.getTime() - now.getTime();
      return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    };

    this.vehicles.forEach(v => {
      const daysAssurance = getDaysDiff(v.documents.assurance.expiryDate);
      if (daysAssurance <= 7) {
        alerts.push({
          id: `alert-assur-${v.id}`,
          type: 'INSURANCE_EXPIRING',
          title: `Échéance Assurance: ${v.brand} ${v.model} (${v.matricule})`,
          description: daysAssurance < 0 
            ? `Police d'assurance expirée depuis ${Math.abs(daysAssurance)} jours !`
            : `L'assurance expire dans ${daysAssurance} jours (${v.documents.assurance.expiryDate})`,
          severity: daysAssurance < 0 ? 'CRITICAL' : 'WARNING',
          targetId: v.id,
          targetMatriculeOrName: v.matricule,
          daysRemaining: daysAssurance,
          dueDate: v.documents.assurance.expiryDate,
        });
      }

      const daysCt = getDaysDiff(v.documents.controleTechnique.expiryDate);
      if (daysCt <= 7) {
        alerts.push({
          id: `alert-ct-${v.id}`,
          type: 'CONTROLE_TECH_EXPIRING',
          title: `Échéance Contrôle Tech: ${v.brand} ${v.model} (${v.matricule})`,
          description: daysCt < 0
            ? `Contrôle technique expiré depuis ${Math.abs(daysCt)} jours !`
            : `Le contrôle technique expire dans ${daysCt} jours (${v.documents.controleTechnique.expiryDate})`,
          severity: daysCt < 0 ? 'CRITICAL' : 'WARNING',
          targetId: v.id,
          targetMatriculeOrName: v.matricule,
          daysRemaining: daysCt,
          dueDate: v.documents.controleTechnique.expiryDate,
        });
      }

      if (v.nextOilChangeKm && v.currentKm >= v.nextOilChangeKm - 500) {
        alerts.push({
          id: `alert-oil-${v.id}`,
          type: 'OIL_CHANGE_DUE',
          title: `Vidange requise: ${v.brand} ${v.model} (${v.matricule})`,
          description: `Compteur à ${v.currentKm} KM. Seuil de vidange fixé à ${v.nextOilChangeKm} KM.`,
          severity: v.currentKm >= v.nextOilChangeKm ? 'CRITICAL' : 'WARNING',
          targetId: v.id,
          targetMatriculeOrName: v.matricule,
          dueDate: new Date().toISOString().split('T')[0],
        });
      }
    });

    this.customers.forEach(c => {
      const daysLicense = getDaysDiff(c.drivingLicenseExpiryDate);
      if (daysLicense <= 7) {
        alerts.push({
          id: `alert-lic-${c.id}`,
          type: 'DRIVING_LICENSE_EXPIRING',
          title: `Permis de conduire client à renouveler: ${c.fullName}`,
          description: daysLicense < 0
            ? `Permis expiré depuis ${Math.abs(daysLicense)} jours !`
            : `Le permis expire dans ${daysLicense} jours (${c.drivingLicenseExpiryDate})`,
          severity: daysLicense < 0 ? 'CRITICAL' : 'WARNING',
          targetId: c.id,
          targetMatriculeOrName: c.fullName,
          daysRemaining: daysLicense,
          dueDate: c.drivingLicenseExpiryDate,
        });
      }
    });

    this.rentals.forEach(r => {
      if (r.status === 'ACTIVE') {
        const expectedDate = new Date(`${r.expectedEndDate}T${r.expectedEndTime}`);
        if (now > expectedDate) {
          const hoursLate = Math.round((now.getTime() - expectedDate.getTime()) / (1000 * 60 * 60));
          alerts.push({
            id: `alert-overdue-${r.id}`,
            type: 'RETURN_OVERDUE',
            title: `Retard de restitution: Contrat ${r.contractNumber}`,
            description: `Le véhicule ${r.vehicleSnapshot.brand} ${r.vehicleSnapshot.model} (${r.vehicleSnapshot.matricule}) devait être rendu à ${r.expectedEndTime} (${hoursLate}h de retard).`,
            severity: 'CRITICAL',
            targetId: r.id,
            targetMatriculeOrName: r.vehicleSnapshot.matricule,
            dueDate: `${r.expectedEndDate} ${r.expectedEndTime}`,
          });
        }
      }
    });

    return alerts;
  }

  // --------------------------------------------------------------------------
  // SETTINGS & BACKUPS (SQL / JSON)
  // --------------------------------------------------------------------------
  public getSettings(): AgencySettings {
    return { ...this.settings };
  }

  public updateSettings(updates: Partial<AgencySettings>): void {
    this.settings = { ...this.settings, ...updates };
    this.saveToStorage();
  }

  public exportJson(): string {
    const backup = {
      system: 'IM LOCATION',
      version: '2.5.0',
      exportedAt: new Date().toISOString(),
      vehicles: this.vehicles,
      customers: this.customers,
      rentals: this.rentals,
      invoices: this.invoices,
      maintenance: this.maintenance,
      transactions: this.transactions,
      settings: this.settings,
    };
    return JSON.stringify(backup, null, 2);
  }

  public importJson(jsonStr: string): void {
    const data = JSON.parse(jsonStr);
    this.vehicles = data.vehicles || [];
    this.customers = data.customers || [];
    this.rentals = data.rentals || [];
    this.invoices = data.invoices || [];
    this.maintenance = data.maintenance || [];
    this.transactions = data.transactions || [];
    this.settings = data.settings || DEFAULT_AGENCY_SETTINGS;
    this.saveToStorage();
  }

  public exportSqlDump(): string {
    let sql = `-- ==========================================================\n`;
    sql += `-- IM LOCATION POS - SQLite Database Dump Export\n`;
    sql += `-- Export Date: ${new Date().toISOString()}\n`;
    sql += `-- Total Vehicles: ${this.vehicles.length} | Customers: ${this.customers.length} | Contracts: ${this.rentals.length}\n`;
    sql += `-- ==========================================================\n\n`;
    sql += `PRAGMA foreign_keys = OFF;\nBEGIN TRANSACTION;\n\n`;

    this.vehicles.forEach(v => {
      sql += `INSERT OR REPLACE INTO vehicles (id, matricule, brand, model, year, category, transmission, fuel_type, color, daily_rate, current_km, current_fuel, status, assurance_expiry, carte_grise_expiry, controle_tech_expiry, next_oil_change_km) VALUES ('${v.id}', '${v.matricule}', '${v.brand}', '${v.model}', ${v.year}, '${v.category}', '${v.transmission}', '${v.fuelType}', '${v.color}', ${v.dailyRate}, ${v.currentKm}, '${v.currentFuel}', '${v.status}', '${v.documents.assurance.expiryDate}', '${v.documents.carteGrise.expiryDate}', '${v.documents.controleTechnique.expiryDate}', ${v.nextOilChangeKm || 'NULL'});\n`;
    });

    this.customers.forEach(c => {
      sql += `INSERT OR REPLACE INTO customers (id, type, full_name, phone, address, wilaya, cin_or_passport, cin_expiry_date, driving_license_number, driving_license_issue_date, driving_license_expiry_date, total_rentals, total_spent_dzd) VALUES ('${c.id}', '${c.type}', '${c.fullName.replace(/'/g, "''")}', '${c.phone}', '${c.address.replace(/'/g, "''")}', '${c.wilaya}', '${c.cinOrPassport}', '${c.cinExpiryDate}', '${c.drivingLicenseNumber}', '${c.drivingLicenseIssueDate}', '${c.drivingLicenseExpiryDate}', ${c.totalRentals}, ${c.totalSpentDzd});\n`;
    });

    this.rentals.forEach(r => {
      sql += `INSERT OR REPLACE INTO rental_contracts (id, contract_number, customer_id, vehicle_id, start_date, start_time, expected_end_date, expected_end_time, duration_days, start_km, start_fuel, daily_rate_dzd, total_rent_dzd, advance_payment_dzd, remaining_balance_dzd, caution_dzd, status) VALUES ('${r.id}', '${r.contractNumber}', '${r.customerId}', '${r.vehicleId}', '${r.startDate}', '${r.startTime}', '${r.expectedEndDate}', '${r.expectedEndTime}', ${r.durationDays}, ${r.startKm}, '${r.startFuel}', ${r.dailyRateDzd}, ${r.totalRentDzd}, ${r.advancePaymentDzd}, ${r.remainingBalanceDzd}, ${r.cautionDzd}, '${r.status}');\n`;
    });

    sql += `\nCOMMIT;\nPRAGMA foreign_keys = ON;\n`;
    return sql;
  }
}

export const dbStore = new DataStore();

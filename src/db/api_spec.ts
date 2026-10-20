/**
 * IM LOCATION - Architectural Specifications
 * 1. Database Entity Relationship Diagram (ERD)
 * 2. Complete RESTful API Endpoints (CRUD & Business Actions)
 */

export const ERD_SPECIFICATION = {
  title: 'IM LOCATION - Relational ERD Schema Architecture',
  database: 'SQLite 3 (Offline-First, Zero-Latency, ACID Compliant)',
  currency: 'DZD (Algerian Dinar)',
  entities: [
    {
      name: 'vehicles (مركبات الأسطول)',
      description: 'Stores fleet assets, Algeria matricule, rates, odometer, and statutory document renewals.',
      primaryKey: 'id (UUID)',
      foreignKeys: [],
      fields: ['matricule (UNIQUE)', 'brand', 'model', 'year', 'category', 'transmission', 'daily_rate', 'current_km', 'current_fuel', 'status', 'assurance_expiry', 'carte_grise_expiry', 'controle_tech_expiry'],
      relations: [
        '1:N with rental_contracts (One vehicle has multiple rental contracts)',
        '1:N with maintenance_records (One vehicle has multiple service logs)',
      ]
    },
    {
      name: 'customers (العملاء)',
      description: 'Directory of Algerian individuals and enterprises with CIN, Permis de conduire, and billing data.',
      primaryKey: 'id (UUID)',
      foreignKeys: [],
      fields: ['type (INDIVIDUAL/COMPANY)', 'full_name', 'phone', 'address', 'wilaya', 'cin_or_passport', 'cin_expiry_date', 'driving_license_number', 'driving_license_expiry_date'],
      relations: [
        '1:N with rental_contracts (One customer can have multiple contracts over time)'
      ]
    },
    {
      name: 'rental_contracts (عقود التأجير)',
      description: 'Core transaction linking Customer + Vehicle with dates, advance payment, caution, and statuses.',
      primaryKey: 'id (UUID)',
      foreignKeys: [
        'customer_id -> customers.id (ON DELETE RESTRICT)',
        'vehicle_id -> vehicles.id (ON DELETE RESTRICT)'
      ],
      fields: ['contract_number', 'start_date', 'start_km', 'start_fuel', 'expected_end_date', 'daily_rate_dzd', 'total_rent_dzd', 'advance_payment_dzd', 'remaining_balance_dzd', 'caution_dzd', 'status'],
      relations: [
        '1:1 with return_settlements (A contract has one final check-in settlement upon return)',
        '1:N with contract_damages (Damage spots logged at delivery or return)'
      ]
    },
    {
      name: 'return_settlements (محاضر الاستلام والتسوية)',
      description: 'Audited restitution calculation: late fees, fuel shortages, excess mileage, damage deductions, and net caution refund.',
      primaryKey: 'id (UUID)',
      foreignKeys: [
        'contract_id -> rental_contracts.id (ON DELETE CASCADE)',
        'vehicle_id -> vehicles.id'
      ],
      fields: ['return_km', 'excess_km_penalty_dzd', 'return_fuel', 'fuel_penalty_dzd', 'is_late', 'late_penalty_dzd', 'damage_penalty_dzd', 'caution_refunded_dzd', 'additional_paid_by_client_dzd']
    },
    {
      name: 'contract_damages (الأضرار والصدمات)',
      description: 'Graphic hotspot damage logs with photo inspection support and repair cost estimations.',
      primaryKey: 'id (UUID)',
      foreignKeys: ['contract_id -> rental_contracts.id'],
      fields: ['location', 'damage_type', 'description', 'estimated_cost_dzd', 'is_pre_existing']
    },
    {
      name: 'maintenance_records (الصيانة والورشة)',
      description: 'Vehicle maintenance history preventing fleet assignment while active.',
      primaryKey: 'id (UUID)',
      foreignKeys: ['vehicle_id -> vehicles.id'],
      fields: ['type', 'description', 'cost_dzd', 'performed_at_km', 'garage_name', 'date', 'status']
    },
    {
      name: 'financial_transactions (السجل المالي)',
      description: 'Ledger tracking all incoming rents, penalties, and outgoing operational expenses in DZD.',
      primaryKey: 'id (UUID)',
      foreignKeys: [],
      fields: ['type', 'amount_dzd', 'description', 'payment_method', 'date', 'recorded_by']
    }
  ]
};

export const API_ENDPOINTS_SPECIFICATION = [
  // Fleet CRUD
  { method: 'GET', path: '/api/fleet', desc: 'Retrieve all vehicles with optional filters (category, status, search matricule)' },
  { method: 'POST', path: '/api/fleet', desc: 'Add new vehicle with Algerian document tracking' },
  { method: 'GET', path: '/api/fleet/:id', desc: 'Get single vehicle details and rental history' },
  { method: 'PUT', path: '/api/fleet/:id', desc: 'Update vehicle details, odometer, rate or documents' },
  { method: 'DELETE', path: '/api/fleet/:id', desc: 'Delete vehicle (Protected: fails if active contracts exist)' },

  // Customers CRUD
  { method: 'GET', path: '/api/customers', desc: 'Retrieve customers list with search by name/CIN/phone' },
  { method: 'POST', path: '/api/customers', desc: 'Register individual or company client' },
  { method: 'GET', path: '/api/customers/:id', desc: 'Get customer profile and full contract archive' },
  { method: 'PUT', path: '/api/customers/:id', desc: 'Update customer contact info or license details' },
  { method: 'DELETE', path: '/api/customers/:id', desc: 'Delete customer (fails if active rental exists)' },

  // Rentals & POS Core Endpoints
  { method: 'GET', path: '/api/rentals', desc: 'Retrieve contracts (filter by ACTIVE, OVERDUE, COMPLETED)' },
  { method: 'POST', path: '/api/rentals/checkout', desc: 'Create contract & deliver car: reserves car, locks deposit, records advance payment' },
  { method: 'GET', path: '/api/rentals/:id', desc: 'Get complete contract with vehicle, client and inspection snapshot' },
  { method: 'POST', path: '/api/rentals/:id/return', desc: 'Core Return Engine: calculates KM excess, fuel difference, delay penalty, damage costs, and performs financial settlement against caution' },

  // Maintenance CRUD
  { method: 'GET', path: '/api/maintenance', desc: 'List maintenance history and scheduled interventions' },
  { method: 'POST', path: '/api/maintenance', desc: 'Schedule or record maintenance (sets vehicle status to MAINTENANCE)' },
  { method: 'PUT', path: '/api/maintenance/:id/complete', desc: 'Mark maintenance as completed and release vehicle to AVAILABLE' },

  // Alerts & Compliance
  { method: 'GET', path: '/api/alerts', desc: 'Retrieve 7-day expiration alerts for Carte Grise, Assurance, Contrôle Tech & Driving licenses' },

  // Finance & POS Ledger
  { method: 'GET', path: '/api/finance/stats', desc: 'Summary of daily/monthly revenue, caution held in escrow, expenses and profit' },
  { method: 'POST', path: '/api/finance/expense', desc: 'Record operational expense (insurance, parts, fuel, garage)' },

  // Offline-First & Backup
  { method: 'GET', path: '/api/backup/export', desc: 'Export full database snapshot as SQL script or JSON file' },
  { method: 'POST', path: '/api/backup/restore', desc: 'Restore database from backup file' }
];

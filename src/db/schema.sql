-- ==============================================================================
-- IM LOCATION - Car Rental POS & Fleet Management Database Schema (SQLite)
-- Designed for Algerian POS Offline-First & Desktop Architecture
-- Currency: DZD | Matricules: Algerian Standards (e.g. 00124-122-16)
-- ==============================================================================

PRAGMA foreign_keys = ON;

-- 1. VEHICLES TABLE (إدارة أسطول المركبات)
CREATE TABLE IF NOT EXISTS vehicles (
    id TEXT PRIMARY KEY,
    matricule TEXT NOT NULL UNIQUE,          -- رقم اللوحة الجزائري: e.g. 00142-123-16
    brand TEXT NOT NULL,                     -- الماركة: Renault, Hyundai, Dacia...
    model TEXT NOT NULL,                     -- الموديل: Clio 5, Tucson, Sandero...
    year INTEGER NOT NULL,                   -- سنة الصنع
    category TEXT CHECK(category IN ('ECONOMY', 'SEDAN', 'SUV', 'COMMERCIAL', 'PREMIUM')) NOT NULL,
    transmission TEXT CHECK(transmission IN ('MANUAL', 'AUTO')) DEFAULT 'MANUAL',
    fuel_type TEXT CHECK(fuel_type IN ('ESSENCE', 'DIESEL', 'GPL')) DEFAULT 'ESSENCE',
    color TEXT NOT NULL,
    daily_rate REAL NOT NULL,                -- السعر اليومي بالدينار الجزائري (DZD)
    current_km INTEGER NOT NULL DEFAULT 0,
    current_fuel TEXT CHECK(current_fuel IN ('0/8','1/8','2/8','3/8','4/8','5/8','6/8','7/8','8/8')) DEFAULT '8/8',
    status TEXT CHECK(status IN ('AVAILABLE', 'RESERVED', 'RENTED', 'RETURNED', 'INSPECTION', 'MAINTENANCE')) DEFAULT 'AVAILABLE',
    image_url TEXT,
    
    -- Algerian Document Tracking (التأمين، البطاقة الرمادية، الفحص الفني)
    assurance_num TEXT,
    assurance_expiry TEXT NOT NULL,          -- YYYY-MM-DD
    carte_grise_num TEXT,
    carte_grise_expiry TEXT,                 -- YYYY-MM-DD
    controle_tech_num TEXT,
    controle_tech_expiry TEXT,               -- YYYY-MM-DD
    
    next_oil_change_km INTEGER,              -- موعد تغيير الزيت القادم
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_vehicles_status ON vehicles(status);
CREATE INDEX IF NOT EXISTS idx_vehicles_matricule ON vehicles(matricule);

-- 2. CUSTOMERS TABLE (إدارة الزبائن - أفراد وشركات)
CREATE TABLE IF NOT EXISTS customers (
    id TEXT PRIMARY KEY,
    type TEXT CHECK(type IN ('INDIVIDUAL', 'COMPANY')) NOT NULL,
    full_name TEXT NOT NULL,
    phone TEXT NOT NULL,                     -- e.g. 0550 12 34 56 / 0770 99 88 77
    email TEXT,
    address TEXT NOT NULL,
    wilaya TEXT NOT NULL,                    -- 16 Alger, 31 Oran, 09 Blida...
    
    -- Identity & Driving License (بطاقة التعريف الوطنية ورخصة السياقة)
    cin_or_passport TEXT NOT NULL UNIQUE,
    cin_expiry_date TEXT NOT NULL,
    driving_license_number TEXT NOT NULL,
    driving_license_issue_date TEXT NOT NULL,
    driving_license_expiry_date TEXT NOT NULL,
    company_reg_number TEXT,                 -- NIF / RC للشركات
    
    total_rentals INTEGER DEFAULT 0,
    total_spent_dzd REAL DEFAULT 0,
    is_blacklisted INTEGER DEFAULT 0,        -- 0 = No, 1 = Blacklisted
    notes TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_customers_phone ON customers(phone);
CREATE INDEX IF NOT EXISTS idx_customers_cin ON customers(cin_or_passport);

-- 3. RENTAL CONTRACTS TABLE (عقود التأجير والتسليم)
CREATE TABLE IF NOT EXISTS rental_contracts (
    id TEXT PRIMARY KEY,
    contract_number TEXT NOT NULL UNIQUE,    -- CT-2026-0001
    customer_id TEXT NOT NULL,
    vehicle_id TEXT NOT NULL,
    
    start_date TEXT NOT NULL,                -- YYYY-MM-DD
    start_time TEXT NOT NULL,                -- HH:mm
    expected_end_date TEXT NOT NULL,         -- YYYY-MM-DD
    expected_end_time TEXT NOT NULL,         -- HH:mm
    actual_return_date TEXT,
    actual_return_time TEXT,
    duration_days INTEGER NOT NULL,
    
    -- Initial Condition at Pickup (عند التسليم)
    start_km INTEGER NOT NULL,
    start_fuel TEXT NOT NULL,
    initial_notes TEXT,
    
    -- Financial Details in DZD
    daily_rate_dzd REAL NOT NULL,
    total_rent_dzd REAL NOT NULL,            -- duration_days * daily_rate
    advance_payment_dzd REAL NOT NULL DEFAULT 0, -- التسبيق المدفوع
    remaining_balance_dzd REAL NOT NULL,     -- total_rent - advance_payment
    caution_dzd REAL NOT NULL DEFAULT 50000, -- الوديعة / مبلغ الضمان (وديعة مستردة)
    caution_payment_method TEXT CHECK(caution_payment_method IN ('CASH', 'CHEQUE', 'CARD')) DEFAULT 'CASH',
    
    status TEXT CHECK(status IN ('ACTIVE', 'COMPLETED', 'CANCELLED', 'OVERDUE')) DEFAULT 'ACTIVE',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY(customer_id) REFERENCES customers(id) ON DELETE RESTRICT,
    FOREIGN KEY(vehicle_id) REFERENCES vehicles(id) ON DELETE RESTRICT
);

CREATE INDEX IF NOT EXISTS idx_contracts_status ON rental_contracts(status);
CREATE INDEX IF NOT EXISTS idx_contracts_dates ON rental_contracts(start_date, expected_end_date);

-- 4. RETURN INSPECTIONS & SETTLEMENTS (محاضر استلام المركبة والتسوية المالية)
CREATE TABLE IF NOT EXISTS return_settlements (
    id TEXT PRIMARY KEY,
    contract_id TEXT NOT NULL UNIQUE,
    vehicle_id TEXT NOT NULL,
    
    return_km INTEGER NOT NULL,
    excess_km INTEGER NOT NULL DEFAULT 0,
    excess_km_penalty_dzd REAL DEFAULT 0,
    
    return_fuel TEXT NOT NULL,
    fuel_penalty_dzd REAL DEFAULT 0,
    
    is_late INTEGER DEFAULT 0,
    late_hours INTEGER DEFAULT 0,
    late_penalty_dzd REAL DEFAULT 0,
    
    cleaning_penalty_dzd REAL DEFAULT 0,
    damage_penalty_dzd REAL DEFAULT 0,
    
    total_penalties_dzd REAL NOT NULL DEFAULT 0,
    
    -- Financial settlement formula:
    -- Net Caution Refund = Caution - (Remaining Rent Balance + Total Penalties)
    -- If negative, customer pays additional: ABS(Net)
    caution_refunded_dzd REAL NOT NULL DEFAULT 0,
    additional_paid_by_client_dzd REAL NOT NULL DEFAULT 0,
    
    returned_by_staff TEXT NOT NULL,
    settlement_notes TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY(contract_id) REFERENCES rental_contracts(id) ON DELETE CASCADE,
    FOREIGN KEY(vehicle_id) REFERENCES vehicles(id) ON DELETE RESTRICT
);

-- 5. DAMAGE ITEMS (قائمة الأضرار والصدمات المكتشفة)
CREATE TABLE IF NOT EXISTS contract_damages (
    id TEXT PRIMARY KEY,
    contract_id TEXT NOT NULL,
    is_pre_existing INTEGER NOT NULL DEFAULT 0, -- 1 = موجودة مسبقاً عند التسليم، 0 = جديدة عند الإرجاع
    location TEXT CHECK(location IN ('FRONT_BUMPER', 'REAR_BUMPER', 'HOOD', 'TRUNK', 'LEFT_FRONT_DOOR', 'LEFT_REAR_DOOR', 'RIGHT_FRONT_DOOR', 'RIGHT_REAR_DOOR', 'ROOF', 'WINDSHIELD', 'TYRES', 'INTERIOR')) NOT NULL,
    damage_type TEXT CHECK(damage_type IN ('SCRATCH', 'DENT', 'CRACK', 'BROKEN', 'DIRT')) NOT NULL,
    description TEXT,
    estimated_cost_dzd REAL NOT NULL DEFAULT 0,
    photo_url TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY(contract_id) REFERENCES rental_contracts(id) ON DELETE CASCADE
);

-- 6. MAINTENANCE RECORDS (سجل صيانة وإصلاحات المركبات)
CREATE TABLE IF NOT EXISTS maintenance_records (
    id TEXT PRIMARY KEY,
    vehicle_id TEXT NOT NULL,
    type TEXT CHECK(type IN ('OIL_CHANGE', 'TYRES', 'BRAKES', 'BODY_REPAIR', 'ROUTINE_INSPECTION', 'OTHER')) NOT NULL,
    description TEXT NOT NULL,
    cost_dzd REAL NOT NULL,
    performed_at_km INTEGER NOT NULL,
    garage_name TEXT NOT NULL,
    date TEXT NOT NULL,
    invoice_number TEXT,
    status TEXT CHECK(status IN ('SCHEDULED', 'IN_PROGRESS', 'COMPLETED')) DEFAULT 'COMPLETED',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY(vehicle_id) REFERENCES vehicles(id) ON DELETE RESTRICT
);

-- 7. FINANCIAL TRANSACTIONS LEDGER (سجل الإيرادات والمصروفات المالية)
CREATE TABLE IF NOT EXISTS financial_transactions (
    id TEXT PRIMARY KEY,
    type TEXT CHECK(type IN ('INCOME_RENT', 'INCOME_PENALTY', 'EXPENSE_MAINTENANCE', 'EXPENSE_INSURANCE', 'EXPENSE_FUEL', 'EXPENSE_CLEANING', 'EXPENSE_OTHER')) NOT NULL,
    amount_dzd REAL NOT NULL,
    related_contract_id TEXT,
    related_vehicle_id TEXT,
    description TEXT NOT NULL,
    payment_method TEXT CHECK(payment_method IN ('CASH', 'VIREMENT', 'CHEQUE')) DEFAULT 'CASH',
    date TEXT NOT NULL,
    recorded_by TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 8. SYSTEM TRIGGERS FOR DATA INTEGRITY
-- Trigger 1: Prevent changing vehicle status to 'AVAILABLE' if vehicle is currently in scheduled/in-progress maintenance
CREATE TRIGGER IF NOT EXISTS trg_prevent_available_if_maintenance
BEFORE UPDATE OF status ON vehicles
WHEN NEW.status = 'AVAILABLE' AND EXISTS (
    SELECT 1 FROM maintenance_records 
    WHERE vehicle_id = NEW.id AND status IN ('SCHEDULED', 'IN_PROGRESS')
)
BEGIN
    SELECT RAISE(ABORT, 'Cannot mark vehicle as AVAILABLE while active maintenance is in progress');
END;

-- Trigger 2: Update vehicle odometer and fuel automatically upon return settlement
CREATE TRIGGER IF NOT EXISTS trg_update_vehicle_on_return
AFTER INSERT ON return_settlements
BEGIN
    UPDATE vehicles
    SET current_km = NEW.return_km,
        current_fuel = NEW.return_fuel,
        updated_at = CURRENT_TIMESTAMP
    WHERE id = NEW.vehicle_id;
END;

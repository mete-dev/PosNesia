

import {
    Product, Customer, Sale, Vendor, Staff, Asset, PurchaseOrder, Promotion, StockMovement, CompanyInfo, Page, Investor, CapitalTransaction, ProfitDistribution, AttendanceRecord, Account, AccountType, TaxRate, Shelf, ProductCategory, Principal, PaymentMethod, PaymentTerm, EcommerceSettings, ReportLayoutSettings, PosSessionSummary, Role, Branch, CashierStation, Warehouse, InventoryLevel, StockTransfer, VendorBill, CustomerBill, ReturnOrder, PayrollSettings, PointsSettings, Lead, Opportunity, HelpdeskTicket, Project, ProjectTask, JobApplicant, TimeOffRequest, ApprovalRequest, BlogPost, BlogCategory, Brand, Course, CourseClass, ManufacturingOrder, MaintenanceRequest, Vehicle, Event, EventTicketSale, CustomerPlan, PlanTemplate, Enrollment, WebsiteSettingsConfig, ForumPost, BillOfMaterial, WorkCenter, ProductDesign, EngineeringChangeOrder, MaintenanceScheduleItem, MaintenanceTeam, Driver, VehicleLog, AssetCategory, Mentee, MenteeAttendance, CourseTest, MenteeTestAnswer, ElearningPeriods, JobOpening, IncomingLetter, OutgoingLetter, CompanyEvent, Room, RoomOrder, RentalOrder, DepositTransaction, DepositWithdrawalToken, Province, City, District, Village,
    CustomAssessment, CustomAssessmentGrade,
    JournalEntry,
    ProductTypeLocation,
    BranchType,
    WarehouseType
} from '../types';
import { indonesiaRegions } from './regionData';
import { generateId } from '../services/serviceUtils';

// --- GENERATE REGION DATA ---
let provinceCounter = 0;
let cityCounter = 0;
let districtCounter = 0;
let villageCounter = 0;

// --- HELPER FOR UNIQUE CITY CODES ---
const generatedCityCodes = new Set<string>();
const generateUniqueCityCode = (cityName: string): string => {
    const parts = cityName.split(' ');
    let code = '';
    if (parts.length > 1) {
        // e.g., "Jakarta Pusat" -> "JPU"
        code = (parts[0].charAt(0) + parts[1].substring(0, 2)).toUpperCase();
    } else {
        // e.g., "Bandung" -> "BAN"
        code = cityName.substring(0, 3).toUpperCase();
    }

    // If code is still not 3 chars, pad it
    if (code.length < 3) {
        code = cityName.replace(/\s/g, '').substring(0,3).toUpperCase();
    }

    // Ensure uniqueness
    if (generatedCityCodes.has(code)) {
        let i = 2;
        let originalCode = code.substring(0, 2);
        while(generatedCityCodes.has(code)) {
            code = originalCode + i;
            i++;
        }
    }
    generatedCityCodes.add(code);
    return code;
};

// --- HELPER FOR UNIQUE DISTRICT CODES ---
const generatedDistrictCodes = new Set<string>();
const generateUniqueDistrictCode = (districtName: string): string => {
    let code = districtName.replace(/\s/g, '').substring(0, 3).toUpperCase();
     if (code.length < 3) code = code.padEnd(3, 'X');
    if (generatedDistrictCodes.has(code)) {
        let i = 2;
        let originalCode = code.substring(0, 2);
        while(generatedDistrictCodes.has(code)) {
            code = originalCode + i;
            i++;
        }
    }
    generatedDistrictCodes.add(code);
    return code;
};


export const initialProvinces: Province[] = Object.keys(indonesiaRegions).map(provName => ({
    id: `prov${++provinceCounter}`,
    name: provName,
}));

export const initialCities: City[] = initialProvinces.flatMap(province => {
    return indonesiaRegions[province.name].cities.map(cityName => ({
        id: `city${++cityCounter}`,
        provinceId: province.id,
        name: cityName,
        code: generateUniqueCityCode(cityName),
    }));
});

export const initialDistricts: District[] = initialCities.flatMap(city => {
    const districtsInCity = indonesiaRegions[initialProvinces.find(p => p.id === city.provinceId)!.name].districts[city.name] || [];
    return districtsInCity.map(districtName => ({
        id: `dist${++districtCounter}`,
        cityId: city.id,
        name: districtName,
        code: generateUniqueDistrictCode(districtName),
    }));
});

export const initialVillages: Village[] = initialDistricts.flatMap(district => {
    const province = initialProvinces.find(p => p.id === initialCities.find(c => c.id === district.cityId)!.provinceId)!;
    const villagesInDistrict = indonesiaRegions[province.name].villages[district.name] || [];
    return villagesInDistrict.map(villageName => ({
        id: `vill${++villageCounter}`,
        districtId: district.id,
        name: villageName,
    }));
});


// --- MOCK DATA EXPORTS ---

export const initialBranchTypes: BranchType[] = [
    { id: 'bt1', name: 'Toko Utama' },
    { id: 'bt2', name: 'Kios' },
    { id: 'bt3', name: 'Kantor Cabang' },
];

export const initialWarehouseTypes: WarehouseType[] = [
    { id: 'wt1', name: 'Gudang Pusat' },
    { id: 'wt2', name: 'Gudang Cabang' },
    { id: 'wt3', name: 'Gudang Transit' },
];

export const initialProducts: Product[] = [];
export const initialProductTypeLocations: ProductTypeLocation[] = [];
export const initialCustomers: Customer[] = [
    { 
        id: 'cust1', 
        name: 'Customer Demo', 
        email: 'customer@demo.com', 
        phone: '2222', 
        joinDate: new Date().toISOString(), 
        pin: '123456', 
        customerType: 'Perorangan', 
        depositBalance: 100000, 
        points: 500, 
        status: 'active', 
        addresses: [] 
    }
];
export const initialSales: Sale[] = [];
export const initialVendors: Vendor[] = [];
export const initialPurchases: PurchaseOrder[] = [];
export const initialStaff: Staff[] = [
    { id: 'admin.dev', name: 'Admin Dev', roleId: 'admin', email: 'admin@dev.com', phone: '111', salary: 5000000, pin: '123456', status: 'active', branchId: 'CAB-JPSTNH01', depositBalance: 0 },
    { id: '1111', name: 'Developer', roleId: 'admin', email: 'dev@seryon.com', phone: '1111', salary: 10000000, pin: '123456', status: 'active', branchId: 'CAB-JPSTNH01', depositBalance: 0 }
];
export const initialAssets: Asset[] = [];
export const initialPromotions: Promotion[] = [];
export const initialStockMovements: StockMovement[] = [];
export const initialCompanyInfo: CompanyInfo = { name: 'Pos Nesia', logoUrl: '/logoposnesia.png', address: 'Lumajang, Jawa Timur, Indonesia', email: 'support@posnesia.com', phone: '085852488293' };
export const initialInvestors: Investor[] = [];
export const initialCapitalTransactions: CapitalTransaction[] = [];
export const initialProfitDistributions: ProfitDistribution[] = [];
export const initialAttendance: AttendanceRecord[] = [];
export const initialAccounts: Account[] = [
    // ASET (ASSET) - Kode 1xxx
    { id: '1010', name: 'Kasir', type: AccountType.Asset, balance: 0, isCashAccount: true, cashAccountType: 'Tunai' },
    { id: '1020', name: 'Brankas', type: AccountType.Asset, balance: 0, isCashAccount: true, cashAccountType: 'Tunai' },
    { id: '1110', name: 'Piutang Usaha', type: AccountType.Asset, balance: 0 },
    { id: '1120', name: 'Cadangan Kerugian Piutang', type: AccountType.Asset, balance: 0 },
    { id: '1210', name: 'Persediaan Barang Dagang', type: AccountType.Asset, balance: 0 },
    { id: '1310', name: 'Perlengkapan Toko', type: AccountType.Asset, balance: 0 },
    { id: '1320', name: 'Sewa Dibayar di Muka', type: AccountType.Asset, balance: 0 },
    { id: '1510', name: 'Aset Tetap - Peralatan Toko', type: AccountType.Asset, balance: 0 },
    { id: '1511', name: 'Akumulasi Penyusutan Peralatan', type: AccountType.Asset, balance: 0 },
    { id: '1520', name: 'Aset Tetap - Kendaraan Operasional', type: AccountType.Asset, balance: 0 },
    { id: '1521', name: 'Akumulasi Penyusutan Kendaraan', type: AccountType.Asset, balance: 0 },
    { id: '1530', name: 'Aset Tetap - Bangunan Toko', type: AccountType.Asset, balance: 0 },

    // LIABILITAS (LIABILITY / UTANG) - Kode 2xxx
    { id: '2010', name: 'Utang Usaha', type: AccountType.Liability, balance: 0 },
    { id: '2020', name: 'Utang Gaji & Upah', type: AccountType.Liability, balance: 0 },
    { id: '2030', name: 'Utang Beban Operasional', type: AccountType.Liability, balance: 0 },
    { id: '2110', name: 'Simpanan Pelanggan (Deposit)', type: AccountType.Liability, balance: 0 },
    { id: '2210', name: 'PPN Keluaran', type: AccountType.Liability, balance: 0 },
    { id: '2310', name: 'Utang Bank / Pinjaman Usaha', type: AccountType.Liability, balance: 0 },

    // EKUITAS (EQUITY / MODAL) - Kode 3xxx
    { id: '3010', name: 'Modal Disetor / Modal Pemilik', type: AccountType.Equity, balance: 0 },
    { id: '3020', name: 'Prive Pemilik', type: AccountType.Equity, balance: 0 },
    { id: '3030', name: 'Laba Ditahan', type: AccountType.Equity, balance: 0 },

    // PENDAPATAN (REVENUE) - Kode 4xxx
    { id: '4010', name: 'Pendapatan Penjualan Barang', type: AccountType.Revenue, balance: 0 },
    { id: '4011', name: 'Diskon Penjualan', type: AccountType.Revenue, balance: 0 },
    { id: '4012', name: 'Retur Penjualan', type: AccountType.Revenue, balance: 0 },
    { id: '4020', name: 'Keuntungan Penjualan Aset', type: AccountType.Revenue, balance: 0 },
    { id: '4030', name: 'Pendapatan Ongkos Kirim / Jasa', type: AccountType.Revenue, balance: 0 },
    { id: '4040', name: 'Pendapatan Lain-lain', type: AccountType.Revenue, balance: 0 },

    // BEBAN (EXPENSE / BIAYA) - Kode 5xxx
    { id: '5010', name: 'Beban Pokok Penjualan (HPP)', type: AccountType.Expense, balance: 0 },
    { id: '5020', name: 'Beban Gaji & Bonus Staf', type: AccountType.Expense, balance: 0 },
    { id: '5030', name: 'Beban Sewa Tempat / Toko', type: AccountType.Expense, balance: 0 },
    { id: '5040', name: 'Beban Listrik, Air & Internet', type: AccountType.Expense, balance: 0 },
    { id: '5050', name: 'Beban Pemasaran & Promo', type: AccountType.Expense, balance: 0 },
    { id: '5060', name: 'Beban Penyusutan Aset Tetap', type: AccountType.Expense, balance: 0 },
    { id: '5070', name: 'Kerugian Penjualan Aset', type: AccountType.Expense, balance: 0 },
    { id: '5090', name: 'Beban Operasional Lainnya', type: AccountType.Expense, balance: 0 }
];
export const initialJournalEntries: JournalEntry[] = [];
export const initialTaxRates: TaxRate[] = [{ id: 'tax1', name: 'PPN', rate: 0.11, isDefault: true }];
export const initialShelves: Shelf[] = [];
export const initialProductCategories: ProductCategory[] = [];
export const initialPrincipals: Principal[] = [];
export const initialBrands: Brand[] = [];
export const initialPaymentMethods: PaymentMethod[] = [
    { id: 'pm1', name: 'Tunai - Kasir', type: 'cash', linkedAccountId: '1010' }
];
export const initialPaymentTerms: PaymentTerm[] = [{ id: 'pt1', name: 'Langsung', days: 0 }];
export const initialEcommerceSettings: EcommerceSettings = { deliveryFeeStandard: 10000, deliveryFeeExpress: 25000, minTransactionForDelivery: 50000, maxDeliveryDistanceKm: 15 };
export const initialReportLayoutSettings: ReportLayoutSettings = { 
    posReceiptSize: '80mm', 
    salesInvoiceSize: 'A4', 
    purchaseOrderSize: 'A4',
    printerConnectionType: 'browser',
    bluetoothDeviceName: '',
    bluetoothMacAddress: '',
    usbVendorId: '',
    usbProductId: '',
    networkPrinterIp: '',
    networkPrinterPort: 9100,
    autoPrintOnCheckout: true,
    cutPaperAfterPrint: true,
    printCopies: 1
};
export const initialPosSessionSummaries: PosSessionSummary[] = [];
export const initialBranches: Branch[] = [{ id: 'CAB-JPSTNH01', name: 'Toko Pusat Tanah Abang', branchTypeId: 'bt1', provinceId: 'prov1', cityId: 'city1', districtId: 'dist2', villageId: 'vill1', detail: 'Blok A Lt. 1 No. 1', safeAccountId: '1020' }];
export const initialCashierStations: CashierStation[] = [
    { id: 'station-1', name: 'Kasir 1', branchId: 'CAB-JPSTNH01', cashInHandAccountId: '1010', allowedPaymentMethodIds: ['pm1', 'pm2', 'pm3'] }
];
export const initialRoles: Role[] = [{ id: 'admin', name: 'Admin', permissions: Object.values(Page) }];
export const initialWarehouses: Warehouse[] = [
    { id: 'wh_c1', name: 'Gudang Sentral Jakarta', address: 'Jl. Gudang Raya No. 1', warehouseTypeId: 'wt1' },
    { id: 'wh_b1', name: 'Gudang - Toko Pusat Tanah Abang', address: 'Blok A Lt. 1 No. 1', warehouseTypeId: 'wt2', branchId: 'CAB-JPSTNH01' }
];
export const initialInventoryLevels: InventoryLevel[] = [];
export const initialStockTransfers: StockTransfer[] = [];
export const initialVendorBills: VendorBill[] = [];
export const initialCustomerBills: CustomerBill[] = [];
export const initialReturnOrders: ReturnOrder[] = [];
export const initialPayrollSettings: PayrollSettings = { payrollDate: 25 };
export const initialPointsSettings: PointsSettings = { pointToRupiahExchangeRate: 1, minPurchaseForRedemption: 0, maxRedemptionType: 'percentage', maxRedemptionValue: 50 };
export const initialLeads: Lead[] = [];
export const initialOpportunities: Opportunity[] = [];
export const initialHelpdeskTickets: HelpdeskTicket[] = [];
export const initialProjects: Project[] = [];
export const initialProjectTasks: ProjectTask[] = [];
export const initialJobApplicants: JobApplicant[] = [];
export const initialTimeOffRequests: TimeOffRequest[] = [];
export const initialApprovalRequests: ApprovalRequest[] = [];
export const initialBlogCategories: BlogCategory[] = [];
export const initialBlogPosts: BlogPost[] = [];
export const initialCourses: Course[] = [];
export const initialCourseClasses: CourseClass[] = [];
export const initialManufacturingOrders: ManufacturingOrder[] = [];
export const initialMaintenanceRequests: MaintenanceRequest[] = [];
export const initialVehicles: Vehicle[] = [];
export const initialEvents: Event[] = [];
export const initialTicketSales: EventTicketSale[] = [];
export const initialCustomerPlans: CustomerPlan[] = [];
export const initialPlanTemplates: PlanTemplate[] = [];
export const initialEnrollments: Enrollment[] = [];
export const initialWebsiteSettings: WebsiteSettingsConfig = { siteTitle: 'PosNesia', tagline: 'Aplikasi Kasir, Purchase, Inventori, dan Laporan Keuangan Gratis & Terlengkap', ecommerceEnabled: true, elearningEnabled: true, eventsEnabled: true, blogEnabled: true, forumEnabled: true, careersEnabled: true, templateName: 'default', fontFamily: 'Inter', baseFontSize: 16, colors: { background: '#FFFFFF', text: '#1F2937', primary: '#2563EB', secondary: '#9333EA' } };
export const initialForumPosts: ForumPost[] = [];
export const initialBOMs: BillOfMaterial[] = [];
export const initialWorkCenters: WorkCenter[] = [];
export const initialProductDesigns: ProductDesign[] = [];
export const initialECOs: EngineeringChangeOrder[] = [];
export const initialMaintenanceSchedule: MaintenanceScheduleItem[] = [];
export const initialMaintenanceTeams: MaintenanceTeam[] = [];
export const initialDrivers: Driver[] = [];
export const initialVehicleLogs: VehicleLog[] = [];
export const initialAssetCategories: AssetCategory[] = [
    { id: 'ac1', name: 'Peralatan Toko', code: 'PT' },
    { id: 'ac2', name: 'Kendaraan', code: 'KD' },
    { id: 'ac3', name: 'Elektronik', code: 'EL' },
    { id: 'ac4', name: 'Gedung & Bangunan', code: 'GB' },
    { id: 'ac5', name: 'Kamar', code: 'KM' },
];
export const initialMentees: Mentee[] = [
    {
        id: '3333',
        name: 'Mentee Demo',
        email: 'mentee@demo.com',
        phone: '3333',
        pin: '123456',
        status: 'active'
    }
];
export const initialMenteeAttendances: MenteeAttendance[] = [];
export const initialCourseTests: CourseTest[] = [];
export const initialMenteeTestAnswers: MenteeTestAnswer[] = [];
export const initialCustomAssessments: CustomAssessment[] = [];
export const initialCustomAssessmentGrades: CustomAssessmentGrade[] = [];
export const initialElearningPeriods: ElearningPeriods = { registrationStart: '', registrationEnd: '', courseStart: '', courseEnd: '', testStart: '', testEnd: '', gradingStart: '', gradingEnd: '', resultsRelease: '' };
export const initialJobOpenings: JobOpening[] = [];
export const initialIncomingLetters: IncomingLetter[] = [];
export const initialOutgoingLetters: OutgoingLetter[] = [];
export const initialInstalledModules: Record<string, boolean> = {
    dashboard: true, calendar: true, companyInfo: true, documents: true, website: true, ecommerce: true, pos: true, sales: true, crm: true, purchase: true, inventory: true, room: true, elearning: true, event: true, project: true, maintenance: true, finance: true, hrm: true, marketing: true, reports: true,
};
export const initialCompanyEvents: CompanyEvent[] = [];
export const initialRooms: Room[] = [];
export const initialRoomOrders: RoomOrder[] = [];
export const initialRentalOrders: RentalOrder[] = [];
export const initialDepositTransactions: DepositTransaction[] = [];
export const initialDepositWithdrawalTokens: DepositWithdrawalToken[] = [];
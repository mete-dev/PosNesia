

import React from 'react';

export enum Language {
  English = 'en',
  Indonesian = 'id',
}

export enum Theme {
  Light = 'light',
  Dark = 'dark',
}

export type AccentColor = 'blue' | 'sky' | 'green' | 'teal' | 'lime' | 'yellow' | 'orange' | 'indigo' | 'purple' | 'violet' | 'red' | 'rose' | 'pink' | 'brown' | 'sunshineYellow' | 'bellaRed' | 'armyGreen' | 'brightGreen' | 'saltedEggBlue' | 'brightOrange' | 'lightBrown' | 'coffeeMilk';

export interface SingleColorTheme {
    mode: 'single';
    color: AccentColor;
}
export interface GradientTheme {
    mode: 'gradient';
    name: string;
    colors: [AccentColor, AccentColor];
}
export interface ManualTheme {
    mode: 'manual';
    colors: {
        bg: string;
        text: string;
        icon: string;
        primary: string;
    };
}

export type ThemeConfig = SingleColorTheme | GradientTheme | ManualTheme;
export type Status = 'active' | 'inactive' | 'archived';
export type PaperSize = 'A4' | 'Letter' | '80mm' | '58mm';
export type FulfillmentStatus = 'Pending' | 'Fulfilled' | 'Shipped' | 'Delivered' | 'N/A';

export interface Attachment {
    name: string;
    url: string;
}

export enum Page {
  Dashboard = 'Dashboard',
  Calendar = 'Calendar', // New
  // --- New Management Pages ---
  LocationManagement = 'LocationManagement',
  AreaManagement = 'AreaManagement', // New
  CashierStationManagement = 'CashierStationManagement',
  RoleManagement = 'RoleManagement',
  BrandManagement = 'BrandManagement', // New
  LayananPelanggan = 'LayananPelanggan',
  // --- Website Pages ---
  BlogList = 'BlogList',
  BlogCategoryManagement = 'BlogCategoryManagement',
  ForumList = 'ForumList',
  WebsiteSettings = 'WebsiteSettings',
  Website = 'Website',

  // --- E-commerce Pages ---
  EcommerceStorefront = 'EcommerceStorefront',
  OrderFulfillment = 'OrderFulfillment',
  EcommercePortalSettings = 'EcommercePortalSettings', // Renamed
  // --- CRM Pages ---
  CRM = 'CRM', // Existing, but now a main module
  LeadManagement = 'LeadManagement',
  OpportunityManagement = 'OpportunityManagement',
  // --- E-learning Pages ---
  ElearningStorefront = 'ElearningStorefront', // New
  ElearningCourseList = 'ElearningCourseList',
  ElearningMenteeListPage = 'ElearningMenteeListPage', // Renamed from ElearningStudentList
  ElearningCourseGroups = 'ElearningCourseGroups',
  ElearningAttendanceReport = 'ElearningAttendanceReport',
  ElearningTestManagement = 'ElearningTestManagement',
  ElearningGrading = 'ElearningGrading', // New
  ElearningPeriods = 'ElearningPeriods', // New
  Enrollments = 'Enrollments',
  ElearningPortalSettings = 'ElearningPortalSettings', // Renamed
  // --- Manufacturing Pages ---
  ManufacturingOrderList = 'ManufacturingOrderList',
  BillOfMaterials = 'BillOfMaterials',
  WorkCenters = 'WorkCenters',
  ManufacturingSettings = 'ManufacturingSettings',
  // --- PLM Pages ---
  ProductDesigns = 'ProductDesigns',
  EngineeringChangeOrders = 'EngineeringChangeOrders',
  ProductVersions = 'ProductVersions',
  // --- Maintenance Pages ---
  MaintenanceRequests = 'MaintenanceRequests',
  MaintenanceSchedule = 'MaintenanceSchedule',
  MaintenanceTeams = 'MaintenanceTeams',
  // --- Event Pages ---
  EventManagement = 'EventManagement',
  CreateEvent = 'CreateEvent',
  TicketSales = 'TicketSales',
  AudienceList = 'AudienceList', // Renamed from AttendeeList
  EventPortalSettings = 'EventPortalSettings', // Renamed
  // --- Project Pages ---
  Projects = 'Projects', // Existing
  ProjectTasks = 'ProjectTasks',
  // --- Planning Pages ---
  CustomerPlans = 'CustomerPlans',
  CreatePlan = 'CreatePlan',
  PlanTemplates = 'PlanTemplates',
  // --- Sales Pages (now a focused module) ---
  SalesList = 'SalesList',
  CreateManualSale = 'CreateManualSale', // New
  // --- Product Pages ---
  ProductList = 'ProductList',
  SetPricing = 'SetPricing',
  // --- Inventory Pages ---
  ManageShelves = 'ManageShelves',
  ProductCategories = 'ProductCategories',
  InventoryAdjustment = 'InventoryAdjustment',
  GoodsReceipt = 'GoodsReceipt', // Page for receiving POs at Warehouse
  StockTransfer = 'StockTransfer', // New Page
  ReturnManagement = 'ReturnManagement',
  // --- Purchase Pages ---
  PurchaseList = 'PurchaseList',
  AddPurchase = 'AddPurchase',
  // --- Billing Pages (under Finance) ---
  VendorBillList = 'VendorBillList',
  CustomerBillList = 'CustomerBillList',
  // --- Customer Pages ---
  CustomerList = 'CustomerList',
  // --- Principal Pages ---
  PrincipalList = 'PrincipalList',
  Vendors = 'Vendors',
  // --- Staff Pages ---
  StaffList = 'StaffList',
  Payroll = 'Payroll',
  StaffAttendance = 'StaffAttendance',
  StaffAttendanceReport = 'StaffAttendanceReport',
  StaffPermissions = 'StaffPermissions', // Can be deprecated for RoleManagement
  Recruitment = 'Recruitment', // Existing
  JobOpeningManagement = 'JobOpeningManagement', // New
  TimeOff = 'TimeOff', // Existing
  // --- Finance Pages ---
  CashAccountList = 'CashAccountList',
  CashTransaction = 'CashTransaction',
  CashTransfer = 'CashTransfer',
  CashierDepositVerification = 'CashierDepositVerification',
  ChartOfAccounts = 'ChartOfAccounts',
  GeneralJournal = 'GeneralJournal',
  Ledger = 'Ledger',
  PaymentMethods = 'PaymentMethods',
  PaymentTerms = 'PaymentTerms',
  // --- Asset Pages ---
  AssetList = 'AssetList',
  AssetPurchase = 'AssetPurchase',
  AssetSale = 'AssetSale',
  AssetCategoryManagement = 'AssetCategoryManagement', // New
  // --- Tax Pages ---
  TaxSummary = 'TaxSummary',
  InputTaxReport = 'InputTaxReport',
  OutputTaxReport = 'OutputTaxReport',
  TaxSettings = 'TaxSettings',
  Capital = 'Capital',
  // --- Report Pages ---
  SalesReport = 'SalesReport',
  PurchaseReport = 'PurchaseReport',
  ProductPerformanceReport = 'ProductPerformanceReport',
  CashierDepositReport = 'CashierDepositReport',
  ProductStockReport = 'ProductStockReport',
  IncomeStatementReport = 'IncomeStatementReport',
  FinancialPositionReport = 'FinancialPositionReport',
  GoodsReport = 'GoodsReport', // New
  FinancialInventoryReport = 'FinancialInventoryReport', // New
  // --- Settings Pages ---
  CompanyInformationSettings = 'CompanyInformationSettings',
  BackupRestore = 'BackupRestore',
  DisplaySettings = 'DisplaySettings',
  ReportSizesSettings = 'ReportSizesSettings',
  About = 'About',
  // --- Document Pages (New) ---
  IncomingLetters = 'IncomingLetters',
  OutgoingLetters = 'OutgoingLetters',
  // --- Other ---
  Approvals = 'Approvals', // Existing
  POS = 'POS',
  Promotions = 'Promotions',
  PromotionsVoucher = 'PromotionsVoucher',
  PromotionsPoints = 'PromotionsPoints',
  Helpdesk = 'Helpdesk',
  PrintPriceLabels = 'PrintPriceLabels', // New
  // --- Room Pages (New) ---
  RoomAssetList = 'RoomAssetList',
  RoomOrderList = 'RoomOrderList',
  CreateRoomOrder = 'CreateRoomOrder',
  // --- Rental Pages (New) ---
  RentalAssetList = 'RentalAssetList',
  RentalOrderList = 'RentalOrderList',
  CreateRentalOrder = 'CreateRentalOrder',
}


export interface CompanyInfo {
  name: string;
  logoUrl: string;
  address: string;
  email: string;
  phone: string;
  businessType?: 'retail' | 'production_retail' | 'qsr' | 'fsr' | 'service_job' | 'appointment_commission';
}

export interface EcommerceSettings {
    deliveryFeeStandard: number;
    deliveryFeeExpress: number;

    minTransactionForDelivery: number;
    maxDeliveryDistanceKm: number;
}

export interface ReportLayoutSettings {
    posReceiptSize: PaperSize;
    salesInvoiceSize: PaperSize;
    purchaseOrderSize: PaperSize;
    // --- Connection & Hardware Printer Settings ---
    printerConnectionType?: PrinterConnectionType;
    bluetoothDeviceName?: string;
    bluetoothMacAddress?: string;
    usbVendorId?: string;
    usbProductId?: string;
    networkPrinterIp?: string;
    networkPrinterPort?: number;
    autoPrintOnCheckout?: boolean;
    cutPaperAfterPrint?: boolean;
    printCopies?: number;
}

// --- NEW AREA MANAGEMENT TYPES ---
export interface Province {
    id: string;
    name: string;
}

export interface City {
    id: string;
    provinceId: string;
    name: string;
    code: string; // 3-letter code
}

export interface District {
    id: string;
    cityId: string;
    name: string;
    code: string;
}

export interface Village {
    id: string;
    districtId: string;
    name: string;
}

// --- NEW LOCATION MANAGEMENT TYPES ---
export interface BranchType {
    id: string;
    name: string;
}

export interface WarehouseType {
    id: string;
    name: string;
}

// --- UPDATED Branch type ---
export interface Branch {
    id: string; // This will now be the generated code, e.g., CAB-JKT...
    name: string;
    branchTypeId: string;
    provinceId: string;
    cityId: string;
    districtId: string;
    villageId: string;
    detail: string;
    safeAccountId: string;
}

// --- UPDATED CashierStation type ---
export interface CashierStation {
    id: string; // This will now be the generated code, e.g., POS/CAB.../01
    name: string;
    branchId: string; // This will be the branch code
    cashInHandAccountId: string;
    allowedPaymentMethodIds: string[];
}

export interface ProductUnitTier {
  id: string;
  unitName: string; // e.g. Pack, Box, Karton
  conversionQty: number; // e.g. 12 (1 Box = 12 Pcs)
  price: number; // Harga jual per satuan tingkat ini
  cost?: number;
  barcode?: string;
}

export interface Product { 
  id: string; 
  name: string; 
  barcode?: string; 
  sku?: string;
  unit?: string;
  unitTiers?: ProductUnitTier[];
  imageUrl?: string; 
  price: number; 
  cost: number; 
  wholesalePrice?: number;
  wholesaleMinQty?: number;
  initialStock?: number;
  description?: string; 
  categoryId?: string; 
  principalId?: string; 
  brandId?: string; 
  vendorId?: string; 
  isTaxable: boolean; 
  pricingType: 'manual' | 'auto'; 
  status: Status; 
  reorderPoint?: number; 
}
export interface ProductTypeLocation { id: string; productId: string; locationTypeId: string; locationType: 'branch' | 'warehouse'; shelfId?: string; shelvingNumber?: string; }
export interface CustomerAddress { id: string; label: string; province: string; city: string; district: string; village: string; detail: string; isPrimary: boolean; }
export interface Customer { id: string; name: string; email: string; phone: string; joinDate: string; pin: string; customerType: 'Perorangan' | 'Perusahaan'; depositBalance: number; points: number; status: Status; addresses: CustomerAddress[]; companyDetails?: { companyName: string; taxId: string; address: string; }; }
export interface SalePayment { paymentMethodId: string; amount: number; }
export interface DeliveryInfo { type: 'pickup' | 'delivery'; address?: string; deliveryFee: number; estimatedTime: string; }
export interface SaleItem { productId: string; productName: string; quantity: number; price: number; cost: number; discount: number; }
export interface Sale { id: string; branchId: string; sourceLocationId: string; date: string; items: SaleItem[]; subtotal: number; discount: number; taxAmount: number; grandTotal: number; customerId?: string; customerName: string; payments: SalePayment[]; paymentTermId: string; dueDate: string; status: 'Paid' | 'Unpaid' | 'Cancelled'; saleChannel: 'POS' | 'E-commerce' | 'Manual'; fulfillmentStatus: FulfillmentStatus; staffId?: string; pointsEarned?: number; pointsUsed?: number; depositUsed?: number; amountPaid?: number; change?: number; codAmount?: number; deliveryInfo?: DeliveryInfo; attachments?: Attachment[]; posSessionId?: string; }
export interface Vendor { id: string; name: string; contactPerson?: string; email?: string; phone?: string; ownerName?: string; companyAddress?: string; taxId?: string; bankAccount?: string; paymentTerm: number; status: Status; }
export interface Staff { id: string; name: string; roleId: string; email: string; phone: string; salary: number; pin: string; status: Status; branchId: string; cashierStationId?: string; depositBalance: number; }
export interface Asset { id: string; name: string; assetCategoryId: string; purchaseDate: string; value: number; status: Status; branchId: string; }
export interface PurchaseOrderItem { productId: string; productName: string; quantity: number; cost: number; }
export interface PurchaseOrder { id: string; destinationType: 'warehouse' | 'branch'; destinationId: string; vendorId: string; vendorName: string; orderDate: string; expectedDelivery: string; dueDate?: string; invoiceNumber?: string; vendorNoteNumber?: string; status: 'Pending' | 'Received' | 'Cancelled'; items: PurchaseOrderItem[]; taxType: 'inclusive' | 'exclusive' | 'none'; taxRate: number; subtotal: number; taxAmount: number; grandTotal: number; attachments?: Attachment[]; }
export interface PromotionBenefit { type: 'percentage_discount' | 'fixed_discount' | 'bogo'; value: number; discountType?: 'percentage' | 'nominal'; freeProductId?: string; freeProductQuantity?: number; }
export interface PromotionCondition { applyBy: 'product' | 'category' | 'principal' | 'brand'; appliesToIds: string[]; minProductQuantity?: number; minPurchaseValue?: number; }
export interface PromotionCustomerTarget { applyTo: 'all_customers' | 'members_only' | 'new_customers' | 'birthday_customers' | 'exclude_customers'; excludedCustomerIds?: string[]; }
export interface Promotion { id: string; name: string; promoCategory: 'Promosi' | 'Voucher' | 'Program Poin'; benefit: PromotionBenefit; condition: PromotionCondition; customerTarget: PromotionCustomerTarget; startDate: string; endDate: string; voucherCode?: string; status: Status; }
export interface StockMovement { id: string; date: string; locationId: string; productId: string; productName: string; type: 'Sale' | 'Purchase' | 'Adjustment' | 'Transfer In' | 'Transfer Out' | 'Return'; quantityChange: number; newStockLevel: number; notes: string; referenceId?: string; partnerId?: string; staffId?: string; }
export interface Investor { id: string; name: string; email: string; phone: string; ownershipPercentage: number; }
export interface CapitalTransaction { id: string; investorId: string; investorName: string; date: string; type: 'Deposit' | 'Withdrawal'; amount: number; }
export interface ProfitDistribution { id: string; date: string; totalProfitDistributed: number; distributions: { investorId: string, investorName: string, amount: number }[]; }
export interface AttendanceRecord { id: string; staffId: string; staffName: string; date: string; status: 'Present' | 'Absent' | 'On Leave'; }
export enum AccountType { Asset = 'Asset', Liability = 'Liability', Equity = 'Equity', Revenue = 'Revenue', Expense = 'Expense' }
export interface Account { id: string; name: string; type: AccountType; balance: number; isCashAccount?: boolean; cashAccountType?: 'Tunai' | 'Rekening' | 'Brankas' | 'Lainnya'; branchId?: string; }
export interface JournalEntryLine { accountId: string; accountName: string; type: 'debit' | 'credit'; amount: number; }
export interface JournalEntry { id: string; date: string; description: string; lines: JournalEntryLine[]; branchId: string; reference?: string; posSessionId?: string; }
export interface TaxRate { id: string; name: string; rate: number; isDefault?: boolean; }
export interface Shelf { id: string; code: string; description?: string; shelvingCount: number; locationType: 'warehouse' | 'branch'; locationId: string; }
export interface ProductCategory { id: string; name: string; parentId?: string; }
export interface Principal { id: string; name: string; contactPerson?: string; email?: string; phone?: string; status: Status; }
export interface PaymentMethod { 
  id: string; 
  name: string; 
  type: 'cash' | 'ewallet' | 'bank_transfer' | 'qris' | 'edc' | 'other' | 'bank' | 'customer_deposit' | 'accounts_receivable'; 
  linkedAccountId?: string; 
  adminFeeType?: 'fixed' | 'percentage';
  adminFeeValue?: number;
}
export interface PaymentTerm { id: string; name: string; days: number; }
export interface PosSession { id: string; startTime: string; endTime?: string; staffId: string; cashierStationId: string; branchId: string; startCash: number; }
export interface PosSessionSummary { id: string; sessionId: string; date: string; branchId: string; cashierStationId: string; cashierId: string; cashierName: string; expectedCash: number; countedCash: number; variance: number; paymentBreakdown: Record<string, number>; status: 'pending' | 'verified'; verifiedBy?: string; verifiedDate?: string; depositToAccountId?: string; }
export interface Role { 
    id: string; 
    name: string; 
    permissions: Page[]; 
    baseSalary?: number; 
    featurePermissions?: Record<string, { create: boolean; read: boolean; update: boolean; delete: boolean }>;
}
export interface Warehouse { id: string; name: string; address: string; warehouseTypeId: string; branchId?: string; }
export interface InventoryLevel { locationId: string; productId: string; quantity: number; }
export interface StockTransfer { id: string; requestDate: string; fromWarehouseId: string; toBranchId: string; items: { productId: string, quantity: number }[]; status: 'Pending' | 'Received' | 'Cancelled'; }
export interface VendorBill { id: string; purchaseOrderId: string; vendorId: string; vendorName: string; billDate: string; dueDate: string; amount: number; status: 'Unpaid' | 'Paid'; paymentDate?: string; paymentAccountId?: string; }
export interface CustomerBill { id: string; sourceType: 'Sale' | 'ElearningEnrollment' | 'EventTicketSale' | 'Deposit' | 'RoomOrder' | 'RentalOrder'; sourceId: string; description: string; customerId: string; customerName: string; billDate: string; dueDate: string; amount: number; status: 'Unpaid' | 'Paid'; paidDate?: string; paymentAccountId?: string; virtualAccountNumber?: string; }
export interface ReturnOrderItem { 
  productId: string; 
  productName: string; 
  quantity: number; 
  price: number; 
  originalQty?: number;
  condition?: string;
}
export interface ReturnOrder { 
  id: string; 
  date: string; 
  type: 'Sale' | 'Purchase'; 
  originalOrderId: string; 
  customerOrVendorName?: string;
  vendorId?: string;
  items: ReturnOrderItem[]; 
  returnLocationId: string; 
  reason?: string; 
  refundAccountId?: string;
  totalRefundAmount?: number;
  status: 'Pending' | 'Completed' | 'Rejected'; 
}
export interface PayrollSettings { payrollDate: number; }
export interface PointsSettings { pointToRupiahExchangeRate: number; minPurchaseForRedemption: number; maxRedemptionType: 'points' | 'percentage'; maxRedemptionValue: number; }
export interface Lead { id: string; name: string; contact: string; source: string; assignedToId?: string; status: 'New' | 'Contacted' | 'Qualified' | 'Lost'; }
export interface Opportunity { id: string; leadId: string; name: string; amount: number; closeDate: string; stage: 'Prospecting' | 'Proposal' | 'Negotiation' | 'Closed Won' | 'Closed Lost'; assignedToId?: string; }
export interface ChatMessage { id: string; text: string; sender: 'user' | 'cs'; timestamp: string; }
export interface HelpdeskTicket { id: string; customerId: string; subject: string; createdDate: string; status: 'Open' | 'In Progress' | 'Closed'; priority: 'Low' | 'Medium' | 'High'; assignedToId?: string; messages: ChatMessage[]; }
export interface Project { id: string; name: string; description: string; status: 'Not Started' | 'In Progress' | 'Completed' | 'On Hold'; startDate: string; deadline: string; budget: number; }
export interface ProjectTask { id: string; projectId: string; title: string; status: 'To Do' | 'In Progress' | 'Done'; assignedToId?: string; startDate?: string; dueDate?: string; }
export interface JobApplicant { id: string; name: string; email: string; phone: string; position: string; appliedDate: string; status: 'Applied' | 'Interviewing' | 'Offered' | 'Hired' | 'Rejected'; notes?: string; cv?: Attachment; }
export interface TimeOffRequest { id: string; staffId: string; startDate: string; endDate: string; reason: string; status: 'Pending' | 'Approved' | 'Rejected'; }
export interface ApprovalRequest { id: string; requesterId: string; type: string; referenceId: string; details: string; status: 'Pending' | 'Approved' | 'Rejected'; }
export interface BlogCategory { id: string; name: string; }
export interface BlogPost { id: string; title: string; content: string; authorId: string; publishedDate: string; categoryId: string; imageUrl?: string; tags?: string[]; layout: 'standard' | 'image-header'; }
export interface Brand { id: string; name: string; principalId: string; }
export interface Course { id: string; title: string; description: string; creatorId: string; }
export interface CourseSchedule { id: string; dateTime: string; location: string; }
export interface CourseClass { id: string; name: string; courseId: string; mentorId: string; schedules: CourseSchedule[]; price: number; }
export interface ManufacturingOrder { id: string; productId: string; quantity: number; dueDate: string; status: 'Pending' | 'In Progress' | 'Completed'; }
export interface MaintenanceRequest { id: string; assetId: string; issue: string; requestDate: string; reportedById: string; status: 'Pending' | 'In Progress' | 'Completed'; }
export interface Vehicle { id: string; name: string; licensePlate: string; driverId?: string; status: 'Available' | 'On Trip' | 'Under Maintenance'; ownership: 'Milik' | 'Sewa'; purchaseDate?: string; value?: number; sourceAccountId?: string; assetId: string; }
export interface TicketTier { id: string; name: string; price: number; capacity: number; }
export interface Event { id: string; name: string; date: string; startTime: string; endTime: string; ticketTiers: TicketTier[]; }
export interface EventTicketSale { id: string; eventId: string; ticketTierId: string; customerId?: string; customerName?: string; quantity: number; totalPrice: number; purchaseDate: string; }
export interface CustomerPlan { id: string; customerId: string; title: string; activities: { title: string, completed: boolean }[]; }
export interface PlanTemplate { id: string; name: string; activities: { title: string }[]; }
export interface Enrollment { id: string; courseClassId: string; menteeId: string; enrollmentDate: string; selectedScheduleId?: string; }
export interface WebsiteSettingsConfig { siteTitle: string; tagline: string; ecommerceEnabled: boolean; elearningEnabled: boolean; eventsEnabled: boolean; blogEnabled: boolean; forumEnabled: boolean; careersEnabled: boolean; templateName: string; fontFamily: string; baseFontSize: number; colors: { background: string; text: string; primary: string; secondary: string; }; }
export interface ForumReply { id: string; content: string; authorId: string; timestamp: string; }
export interface ForumPost { id: string; title: string; content: string; authorId: string; timestamp: string; replies: ForumReply[]; }
export interface BillOfMaterial { id: string; productId: string; items: { materialId: string, quantity: number }[]; }
export interface WorkCenter { id: string; name: string; description: string; capacity: number; }
export interface ProductDesign { id: string; name: string; version: string; status: 'Draft' | 'Released' | 'Obsolete'; }
export interface EngineeringChangeOrder { id: string; productDesignId: string; reason: string; status: 'Pending' | 'Approved' | 'Rejected'; }
export interface MaintenanceScheduleItem { id: string; assetId: string; task: string; scheduledDate: string; teamId?: string; status: 'Scheduled' | 'Completed'; }
export interface MaintenanceTeam { id: string; name: string; memberIds: string[]; }
export interface Driver { id: string; staffId: string; licenseNumber: string; licenseExpiry: string; }
export interface VehicleLog { id: string; vehicleId: string; date: string; type: 'Fuel' | 'Trip' | 'Maintenance'; details: string; cost: number; }
export interface AssetCategory { id: string; name: string; code: string; }
export interface Mentee { id: string; name: string; email?: string; phone?: string; pin: string; status: Status; }
export interface MenteeAttendance { id: string; enrollmentId: string; scheduleId: string; status: 'Present' | 'Absent'; }
export enum QuestionFormat { MultipleChoice = 'multiple_choice', Checkbox = 'checkbox', Dropdown = 'dropdown', Essay = 'essay' }
export interface TestQuestion { id: string; questionText: string; format: QuestionFormat; options?: string[]; correctAnswers: string[]; }
export interface CourseTest { id: string; title: string; courseClassId: string; type: 'Test' | 'Tugas'; questions: TestQuestion[]; availableFrom: string; availableTo: string; durationMinutes?: number; scheduleId?: string; }
export interface MenteeTestAnswer { id: string; testId: string; enrollmentId: string; menteeId: string; answers: { questionId: string, answer: string }[]; score: number; manualGrade?: number; submittedDate: string; }
export interface ElearningPeriods { registrationStart: string; registrationEnd: string; courseStart: string; courseEnd: string; testStart: string; testEnd: string; gradingStart: string; gradingEnd: string; resultsRelease: string; }
export interface JobOpening { id: string; title: string; description: string; location: string; type: 'Full-time' | 'Part-time' | 'Contract'; status: 'Open' | 'Closed'; }
export interface IncomingLetter { id: string; referenceNumber: string; letterDate: string; dateReceived: string; sender: string; subject: string; dispositionTo: string[]; notes?: string; attachments?: Attachment[]; }
export interface OutgoingLetter { id: string; referenceNumber: string; letterDate: string; dateSent: string; recipient: string; subject: string; createdBy: string; attachments?: Attachment[]; }
export interface CompanyEvent { id: string; title: string; description?: string; start: string; end: string; color: 'blue' | 'green' | 'red' | 'yellow' | 'purple'; }
export interface Room { id: string; assetId: string; name: string; type: string; dailyRate: number; status: 'Available' | 'Occupied' | 'Under Maintenance'; branchId: string; }
export interface RoomOrder { id: string; customerId: string; roomId: string; startDate: string; endDate: string; totalPrice: number; status: 'Booked' | 'Checked-in' | 'Checked-out' | 'Cancelled'; }
export interface RentalOrder { id: string; customerId: string; vehicleId: string; startDate: string; endDate: string; totalPrice: number; status: 'Booked' | 'Rented' | 'Returned' | 'Cancelled'; }
export interface DepositWithdrawalToken { id: string; customerId: string; amount: number; createdAt: string; expiresAt: string; status: 'pending' | 'redeemed' | 'expired'; redeemedByStaffId?: string; redeemedAtPosSessionId?: string; }
export interface DepositTransaction { id: string; customerId: string; date: string; type: 'Deposit' | 'Withdrawal' | 'Purchase' | 'Refund'; amount: number; description: string; endingBalance: number; }
export interface CustomAssessment { id: string; courseClassId: string; title: string; }
export interface CustomAssessmentGrade { id: string; assessmentId: string; enrollmentId: string; grade: number; }
export interface CartItem { product: Product; productId: string; productName: string; price: number; cost: number; quantity: number; discount: number; isFreebie: boolean; }

// --- App State ---
export interface AppState {
    theme: Theme;
    themeConfig: ThemeConfig;
    currentPage: Page;
    currentUser: Staff | null;
    currentCustomer: Customer | null;
    currentMentee: Mentee | null;
    isLoginPageVisible: boolean;
    currentBranchId: string | null;
    companyInfo: CompanyInfo;
    isTaxEnabled: boolean;
    installedModules: Record<string, boolean>;
    provinces: Province[];
    cities: City[];
    districts: District[];
    villages: Village[];
    branches: Branch[];
    branchTypes: BranchType[];
    cashierStations: CashierStation[];
    roles: Role[];
    products: Product[];
    productTypeLocations: ProductTypeLocation[];
    principals: Principal[];
    brands: Brand[];
    customers: Customer[];
    sales: Sale[];
    vendors: Vendor[];
    purchases: PurchaseOrder[];
    vendorBills: VendorBill[];
    lastGeneratedVendorBill: VendorBill | null;
    customerBills: CustomerBill[];
    staff: Staff[];
    assets: Asset[];
    assetCategories: AssetCategory[];
    promotions: Promotion[];
    stockMovements: StockMovement[];
    investors: Investor[];
    capitalTransactions: CapitalTransaction[];
    profitDistributions: ProfitDistribution[];
    attendance: AttendanceRecord[];
    accounts: Account[];
    journalEntries: JournalEntry[];
    taxRates: TaxRate[];
    shelves: Shelf[];
    productCategories: ProductCategory[];
    warehouses: Warehouse[];
    warehouseTypes: WarehouseType[];
    inventoryLevels: InventoryLevel[];
    stockTransfers: StockTransfer[];
    paymentMethods: PaymentMethod[];
    paymentTerms: PaymentTerm[];
    ecommerceSettings: EcommerceSettings;
    reportLayoutSettings: ReportLayoutSettings;
    cart: Omit<CartItem, 'discount' | 'isFreebie'>[];
    isPosModeActive: boolean;
    posSession: PosSession | null;
    lastTransaction: Sale | null;
    lastTicketSale: EventTicketSale | null;
    lastPaidBill: (CustomerBill & { amountPaid?: number, change?: number }) | null;
    isSidebarCollapsed: boolean;
    posSessionSummaries: PosSessionSummary[];
    returnOrders: ReturnOrder[];
    payrollSettings: PayrollSettings;
    pointsSettings: PointsSettings;
    printSelection: { type: 'products' | 'promo'; ids: string[] } | null;
    leads: Lead[];
    opportunities: Opportunity[];
    helpdeskTickets: HelpdeskTicket[];
    projects: Project[];
    projectTasks: ProjectTask[];
    jobOpenings: JobOpening[];
    jobApplicants: JobApplicant[];
    timeOffRequests: TimeOffRequest[];
    approvalRequests: ApprovalRequest[];
    incomingLetters: IncomingLetter[];
    outgoingLetters: OutgoingLetter[];
    mentees: Mentee[];
    menteeAttendances: MenteeAttendance[];
    courseTests: CourseTest[];
    menteeTestAnswers: MenteeTestAnswer[];
    customAssessments: CustomAssessment[];
    customAssessmentGrades: CustomAssessmentGrade[];
    courses: Course[];
    courseClasses: CourseClass[];
    enrollments: Enrollment[];
    elearningPeriods: ElearningPeriods;
    blogCategories: BlogCategory[];
    blogPosts: BlogPost[];
    rooms: Room[];
    roomOrders: RoomOrder[];
    boms: BillOfMaterial[];
    workCenters: WorkCenter[];
    manufacturingOrders: ManufacturingOrder[];
    productDesigns: ProductDesign[];
    ecos: EngineeringChangeOrder[];
    maintenanceRequests: MaintenanceRequest[];
    maintenanceSchedule: MaintenanceScheduleItem[];
    maintenanceTeams: MaintenanceTeam[];
    drivers: Driver[];
    vehicles: Vehicle[];
    vehicleLogs: VehicleLog[];
    events: Event[];
    ticketSales: EventTicketSale[];
    customerPlans: CustomerPlan[];
    planTemplates: PlanTemplate[];
    forumPosts: ForumPost[];
    websiteSettings: WebsiteSettingsConfig;
    currentWebsitePage: 'home' | 'toko' | 'kursus' | 'acara' | 'blog' | 'forum' | 'karir';
    lastRegisteredMentee: { id: string, pin: string } | null;
    lastCreatedBill: CustomerBill | null;
    companyEvents: CompanyEvent[];
    depositWithdrawalTokens: DepositWithdrawalToken[];
    depositTransactions: DepositTransaction[];
    lastWithdrawalToken: DepositWithdrawalToken | null;
    lastWithdrawalReceipt: { customerName: string; amount: number } | null;
    rentalOrders: RentalOrder[];
    mobileMenuCategory: string | null;
}
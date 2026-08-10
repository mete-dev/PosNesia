

import React, { createContext, useReducer, useContext, ReactNode, useEffect } from 'react';
import {
    AppState,
    Product, Customer, Sale, Vendor, PurchaseOrder, Staff, Asset,
    Promotion, StockMovement, CompanyInfo, Account, JournalEntry, AccountType,
    Page, Theme, Investor, CapitalTransaction, ProfitDistribution, AttendanceRecord, TaxRate,
    Shelf, ProductCategory, Principal, PaymentMethod, PaymentTerm, SaleItem, CartItem, EcommerceSettings, DeliveryInfo, ReportLayoutSettings, AccentColor, Status,
    ThemeConfig, PosSessionSummary, Branch, Role, CashierStation, PosSession, Warehouse, InventoryLevel, StockTransfer, VendorBill, CustomerBill, ReturnOrder, FulfillmentStatus,
    CustomerAddress, ChatMessage, JournalEntryLine, Lead, Opportunity, HelpdeskTicket, Project, ProjectTask, JobApplicant, TimeOffRequest, ApprovalRequest, BlogPost, Course, ManufacturingOrder, MaintenanceRequest, Vehicle, Event, CustomerPlan, Enrollment, WebsiteSettingsConfig, ForumPost, ForumReply, BillOfMaterial, WorkCenter, ProductDesign, EngineeringChangeOrder, MaintenanceScheduleItem, MaintenanceTeam, Driver, VehicleLog, EventTicketSale, PlanTemplate, PointsSettings, Brand, AssetCategory, Attachment, MenteeAttendance, Mentee, MenteeTestAnswer, CourseClass, CourseTest, ElearningPeriods, QuestionFormat, JobOpening,
    IncomingLetter, OutgoingLetter, BlogCategory, CompanyEvent, Room, RoomOrder, DepositWithdrawalToken, DepositTransaction, RentalOrder, Province, City, District, Village,
    CustomAssessment, CustomAssessmentGrade, PayrollSettings,
    ProductTypeLocation,
    BranchType,
    WarehouseType
} from '../types';
import {
    initialProducts, initialCustomers, initialSales, initialVendors, initialPurchases,
    initialStaff, initialAssets, initialPromotions,
    initialStockMovements, initialCompanyInfo, initialInvestors,
    initialCapitalTransactions, initialProfitDistributions, initialAttendance,
    initialAccounts, initialJournalEntries, initialTaxRates, initialShelves, initialProductCategories,
    initialPrincipals, initialBrands, initialPaymentMethods, initialPaymentTerms, initialEcommerceSettings, initialReportLayoutSettings, initialPosSessionSummaries, initialBranches, initialCashierStations, initialRoles, initialWarehouses, initialInventoryLevels, initialStockTransfers, initialVendorBills, initialCustomerBills, initialReturnOrders, initialPayrollSettings, initialPointsSettings,
    initialLeads, initialOpportunities, initialHelpdeskTickets, initialProjects, initialJobApplicants, initialTimeOffRequests, initialApprovalRequests, initialBlogCategories,
    initialBlogPosts, initialCourses, initialCourseClasses, initialManufacturingOrders, initialMaintenanceRequests, initialVehicles, initialEvents, initialTicketSales,
    initialCustomerPlans, initialEnrollments, initialWebsiteSettings, initialForumPosts, initialBOMs, initialWorkCenters, initialProductDesigns, initialECOs, initialMaintenanceSchedule, initialMaintenanceTeams, initialDrivers, initialVehicleLogs, initialPlanTemplates, initialProjectTasks, initialAssetCategories,
    initialMentees, initialMenteeAttendances, initialCourseTests, initialMenteeTestAnswers, initialElearningPeriods, initialJobOpenings, initialIncomingLetters, initialOutgoingLetters,
    initialInstalledModules, initialCompanyEvents, initialRooms, initialRoomOrders, initialRentalOrders, initialDepositTransactions, initialDepositWithdrawalTokens,
    initialProvinces, initialCities, initialDistricts, initialVillages,
    initialCustomAssessments, initialCustomAssessmentGrades,
    initialProductTypeLocations,
    initialBranchTypes,
    initialWarehouseTypes
} from '../data/mockData';
import * as salesService from '../services/salesService';
import * as inventoryService from '../services/inventoryService';
import * as purchaseService from '../services/purchaseService';
import * as capitalService from '../services/capitalService';
import * as staffService from '../services/staffService';
import * as productService from '../services/productService';
import * as vendorService from '../services/vendorService';
import * as assetService from '../services/assetService';
import * as promotionService from '../services/promotionService';
import * as journalService from '../services/journalService';
import * as principalService from '../services/principalService';
import * as elearningService from '../services/elearningService';
import * as roomService from '../services/roomService';
import * as rentalService from '../services/rentalService';
import { generateId, generateBranchId, generatePosTerminalId, generatePosSessionId, generateMonthlyTransactionalId, generateStockTransferId } from '../services/serviceUtils';
import { applyPromotionsToCart } from '../utils/promotionUtils';


// --- INITIAL STATE ---
const initialState: AppState = {
    theme: Theme.Light,
    themeConfig: { mode: 'single', color: 'sky' },
    currentPage: Page.Dashboard,
    currentUser: null, // Start with no user logged in
    currentCustomer: null, // New for customer portal
    currentMentee: null, // New for mentee portal
    isLoginPageVisible: false, // New for website landing page flow
    currentBranchId: null, // Default to all branches
    companyInfo: initialCompanyInfo,
    isTaxEnabled: true,
    installedModules: initialInstalledModules,
    
    // New Management Data
    provinces: initialProvinces,
    cities: initialCities,
    districts: initialDistricts,
    villages: initialVillages,
    branches: initialBranches,
    branchTypes: initialBranchTypes,
    cashierStations: initialCashierStations,
    roles: initialRoles,

    products: initialProducts,
    productTypeLocations: initialProductTypeLocations,
    principals: initialPrincipals,
    brands: initialBrands,
    customers: initialCustomers,
    sales: initialSales,
    vendors: initialVendors,
    purchases: initialPurchases,
    vendorBills: initialVendorBills,
    lastGeneratedVendorBill: null,
    customerBills: initialCustomerBills,
    staff: initialStaff,
    assets: initialAssets,
    assetCategories: initialAssetCategories,
    promotions: initialPromotions,
    stockMovements: initialStockMovements,
    investors: initialInvestors,
    capitalTransactions: initialCapitalTransactions,
    profitDistributions: initialProfitDistributions,
    attendance: initialAttendance,
    // New accounting state
    accounts: initialAccounts,
    journalEntries: initialJournalEntries,
    // New tax state
    taxRates: initialTaxRates,
    // New inventory state
    shelves: initialShelves,
    productCategories: initialProductCategories,
    warehouses: initialWarehouses,
    warehouseTypes: initialWarehouseTypes,
    inventoryLevels: initialInventoryLevels,
    stockTransfers: initialStockTransfers,
    // New finance config state
    paymentMethods: initialPaymentMethods,
    paymentTerms: initialPaymentTerms,
    // Ecommerce Settings
    ecommerceSettings: initialEcommerceSettings,
    // Report Layout Settings
    reportLayoutSettings: initialReportLayoutSettings,
    // Cart state
    cart: [],
    // POS Mode
    isPosModeActive: false,
    posSession: null,
    lastTransaction: null,
    lastTicketSale: null,
    lastPaidBill: null,
    // Sidebar state
    isSidebarCollapsed: false,
    posSessionSummaries: initialPosSessionSummaries,
    returnOrders: initialReturnOrders,
    payrollSettings: initialPayrollSettings,
    pointsSettings: initialPointsSettings,
    printSelection: null,
    // --- New ERP-like module states ---
    leads: initialLeads,
    opportunities: initialOpportunities,
    helpdeskTickets: initialHelpdeskTickets,
    projects: initialProjects,
    projectTasks: initialProjectTasks,
    jobOpenings: initialJobOpenings,
    jobApplicants: initialJobApplicants,
    timeOffRequests: initialTimeOffRequests,
    approvalRequests: initialApprovalRequests,
    incomingLetters: initialIncomingLetters,
    outgoingLetters: initialOutgoingLetters,
    // --- E-learning Module States ---
    mentees: initialMentees,
    menteeAttendances: initialMenteeAttendances,
    courseTests: initialCourseTests,
    menteeTestAnswers: initialMenteeTestAnswers,
    customAssessments: initialCustomAssessments,
    customAssessmentGrades: initialCustomAssessmentGrades,
    courses: initialCourses,
    courseClasses: initialCourseClasses,
    enrollments: initialEnrollments,
    elearningPeriods: initialElearningPeriods,
    // --- Even more new modules ---
    blogCategories: initialBlogCategories,
    blogPosts: initialBlogPosts,
    rooms: initialRooms,
    roomOrders: initialRoomOrders,
    boms: initialBOMs,
    workCenters: initialWorkCenters,
    manufacturingOrders: initialManufacturingOrders,
    productDesigns: initialProductDesigns,
    ecos: initialECOs,
    maintenanceRequests: initialMaintenanceRequests,
    maintenanceSchedule: initialMaintenanceSchedule,
    maintenanceTeams: initialMaintenanceTeams,
    drivers: initialDrivers,
    vehicles: initialVehicles,
    vehicleLogs: initialVehicleLogs,
    events: initialEvents,
    ticketSales: initialTicketSales,
    customerPlans: initialCustomerPlans,
    planTemplates: initialPlanTemplates,
    forumPosts: initialForumPosts,
    websiteSettings: initialWebsiteSettings,
    currentWebsitePage: 'home',
    lastRegisteredMentee: null,
    lastCreatedBill: null,
    // --- NEW STATE FOR NEW FEATURES ---
    companyEvents: initialCompanyEvents,
    depositWithdrawalTokens: initialDepositWithdrawalTokens,
    depositTransactions: initialDepositTransactions,
    lastWithdrawalToken: null,
    lastWithdrawalReceipt: null,
    rentalOrders: initialRentalOrders,
};

type ProductTypeLocationData = {
    locationTypeId: string;
    locationType: 'branch' | 'warehouse';
    shelfId?: string;
    shelvingNumber?: string;
};

// --- ACTION TYPES ---
type Action =
  // Auth actions
  | { type: 'auth/login'; payload: { user: Staff } }
  | { type: 'auth/logout' }
  | { type: 'auth/customerLogin'; payload: { phone: string; pin: string } }
  | { type: 'auth/customerLogout' }
  | { type: 'auth/studentLogin'; payload: { studentId: string; pin: string } }
  | { type: 'auth/studentLogout' }
  | { type: 'auth/changePin'; payload: { newPin: string } }
  | { type: 'auth/registerCustomer'; payload: { name: string; email: string; phone: string; pin: string } }
  | { type: 'auth/registerStudent'; payload: { name: string; email?: string; phone?: string } }
  | { type: 'auth/clearLastRegistered' }
  // UI actions
  | { type: 'ui/setPage'; payload: Page }
  | { type: 'ui/setTheme'; payload: Theme }
  | { type: 'ui/setThemeConfig'; payload: ThemeConfig }
  | { type: 'ui/showLoginPage'; payload: boolean }
  | { type: 'ui/setCurrentBranch'; payload: string | null }
  | { type: 'ui/setSidebarCollapsed'; payload: boolean }
  | { type: 'ui/setPrintSelection'; payload: { type: 'products' | 'promo', ids: string[] } }
  | { type: 'ui/clearPrintSelection' }
  // Company actions
  | { type: 'company/updateInfo'; payload: CompanyInfo }
  | { type: 'company/addBranch'; payload: Omit<Branch, 'id' | 'safeAccountId'> }
  | { type: 'company/updateBranch'; payload: Branch }
  | { type: 'company/addCashierStation'; payload: Omit<CashierStation, 'id' | 'cashInHandAccountId'> }
  | { type: 'company/updateCashierStation'; payload: CashierStation }
  | { type: 'company/addWarehouse'; payload: Omit<Warehouse, 'id'> }
  | { type: 'company/updateWarehouse'; payload: Warehouse }
  | { type: 'company/addBranchType'; payload: Omit<BranchType, 'id'> }
  | { type: 'company/updateBranchType'; payload: BranchType }
  | { type: 'company/addWarehouseType'; payload: Omit<WarehouseType, 'id'> }
  | { type: 'company/updateWarehouseType'; payload: WarehouseType }
  // Area Management Actions
  | { type: 'areas/addProvince'; payload: Omit<Province, 'id'> }
  | { type: 'areas/updateProvince'; payload: Province }
  | { type: 'areas/addCity'; payload: Omit<City, 'id'> }
  | { type: 'areas/updateCity'; payload: City }
  | { type: 'areas/addDistrict'; payload: Omit<District, 'id'> }
  | { type: 'areas/updateDistrict'; payload: District }
  | { type: 'areas/addVillage'; payload: Omit<Village, 'id'> }
  | { type: 'areas/updateVillage'; payload: Village }
  // Settings actions
  | { type: 'settings/updateEcommerce'; payload: EcommerceSettings }
  | { type: 'settings/updateReportLayouts'; payload: ReportLayoutSettings }
  | { type: 'settings/updateTaxRates'; payload: TaxRate[] }
  | { type: 'settings/toggleTaxSystem' }
  | { type: 'settings/addPaymentMethod'; payload: Omit<PaymentMethod, 'id'> }
  | { type: 'settings/updatePaymentMethod'; payload: PaymentMethod }
  | { type: 'settings/deletePaymentMethod', payload: string }
  | { type: 'settings/addPaymentTerm'; payload: Omit<PaymentTerm, 'id'> }
  | { type: 'settings/updatePaymentTerm'; payload: PaymentTerm }
  | { type: 'settings/deletePaymentTerm', payload: string }
  // Product actions
  | { type: 'products/add'; payload: { productData: Omit<Product, 'id'>, typeLocations: ProductTypeLocationData[], initialStocks: Record<string, number> } }
  | { type: 'products/update'; payload: { product: Product, typeLocations: ProductTypeLocationData[] } }
  | { type: 'products/setStatus'; payload: { id: string, status: Status } }
  | { type: 'products/setPrices'; payload: { markup: number } }
  | { type: 'products/addCategory'; payload: Omit<ProductCategory, 'id'> }
  | { type: 'products/updateCategory'; payload: ProductCategory }
  | { type: 'products/deleteCategory'; payload: string }
  // Customer actions
  | { type: 'customers/add'; payload: Omit<Customer, 'id' | 'joinDate' | 'depositBalance' | 'points' | 'addresses'> }
  | { type: 'customers/update'; payload: Customer }
  | { type: 'customers/setStatus'; payload: { id: string, status: Status } }
  | { type: 'customers/addDeposit'; payload: { customerId: string, amount: number, paymentMethodId: string, posSessionId?: string } }
  | { type: 'customers/withdrawDeposit'; payload: { customerId: string, amount: number, posSessionId?: string } }
  | { type: 'customers/addAddress'; payload: Omit<CustomerAddress, 'id'> }
  | { type: 'customers/createDepositBill'; payload: { amount: number; paymentMethod: 'va' | 'transfer' } }
  | { type: 'customers/createWithdrawalToken'; payload: { amount: number; pin: string } }
  | { type: 'customers/clearLastWithdrawalToken' }
  | { type: 'customers/payBillWithDeposit'; payload: { virtualAccountNumber: string, pin: string } }
  // Staff actions
  | { type: 'staff/add'; payload: Omit<Staff, 'id'> & { id: string } }
  | { type: 'staff/update'; payload: Staff }
  | { type: 'staff/setStatus'; payload: { id: string, status: Status } }
  | { type: 'staff/markAttendance'; payload: { staffId: string, status: AttendanceRecord['status'] } }
  | { type: 'staff/paySalaries' }
  | { type: 'staff/addDeposit'; payload: { staffId: string; amount: number; posSessionId?: string } }
  | { type: 'staff/withdrawDeposit'; payload: { staffId: string; amount: number; posSessionId?: string } }
  | { type: 'staff/addRole'; payload: Omit<Role, 'id' | 'permissions'> }
  | { type: 'staff/updateRole'; payload: Role }
  | { type: 'staff/deleteRole'; payload: string }
  | { type: 'staff/updateRolePermissions'; payload: { roleId: string; permissions: Page[] } }
  // Vendor actions
  | { type: 'vendors/add'; payload: Omit<Vendor, 'id'> }
  | { type: 'vendors/update'; payload: Vendor }
  | { type: 'vendors/setStatus'; payload: { id: string, status: Status } }
  // Principal & Brand actions
  | { type: 'principals/add'; payload: Omit<Principal, 'id'> & { brandNames: string[] } }
  | { type: 'principals/update'; payload: Principal & { brandNames: string[] } }
  | { type: 'principals/setStatus'; payload: { id: string, status: Status } }
  | { type: 'brands/add', payload: Omit<Brand, 'id'> }
  | { type: 'brands/update', payload: Brand }
  | { type: 'brands/delete', payload: string }
  // Purchase actions
  | { type: 'purchases/add'; payload: Omit<PurchaseOrder, 'id'> }
  | { type: 'purchases/receive'; payload: string }
  | { type: 'purchases/cancel'; payload: string }
  | { type: 'purchases/addAttachment'; payload: { purchaseOrderId: string, fileName: string } }
  // Inventory actions
  | { type: 'inventory/adjustStock'; payload: { productId: string, newStock: number, reason: string, locationId: string } }
  | { type: 'inventory/addShelf'; payload: Omit<Shelf, 'id'> }
  | { type: 'inventory/updateShelf'; payload: Shelf }
  | { type: 'inventory/deleteShelf'; payload: string }
  | { type: 'inventory/createStockTransfer'; payload: { fromWarehouseId: string; toBranchId: string; items: { productId: string, quantity: number }[] } }
  | { type: 'inventory/receiveStockTransfer'; payload: { transferId: string } }
  | { type: 'inventory/cancelStockTransfer'; payload: string }
  // Sale actions
  | { type: 'sales/add'; payload: Omit<Sale, 'id'> }
  | { type: 'sales/processFromCart'; payload: any }
  | { type: 'sales/cancel'; payload: string }
  | { type: 'sales/updateStatus'; payload: { saleId: string; fulfillmentStatus: FulfillmentStatus } }
  | { type: 'sales/processCustomerOrder'; payload: { addressId: string, pointsToUse: number, depositToUse: number } }
  | { type: 'sales/addAttachment'; payload: { saleId: string, fileName: string } }
  // Cart actions
  | { type: 'cart/add'; payload: Product }
  | { type: 'cart/updateQuantity'; payload: { productId: string; quantity: number } }
  | { type: 'cart/clear' }
  // POS actions
  | { type: 'pos/toggleMode'; payload: { start: boolean } }
  | { type: 'pos/startSession'; payload: { cashierStationId: string, startCash: number } }
  | { type: 'pos/processSale'; payload: { customerId: string, paymentMethodId: string, voucherCode: string, amountPaid: number, change: number, pointsToUse: number, depositToUse: number } }
  | { type: 'pos/processTicketSale'; payload: { eventId: string; ticketTierId: string; quantity: number; customerId: string; paymentMethodId: string; amountPaid: number; change: number } }
  | { type: 'pos/clearLastTicketSale' }
  | { type: 'pos/payBill'; payload: { billId: string; paymentMethodId: string; amountPaid: number; change: number; } }
  | { type: 'pos/clearLastPaidBill' }
  | { type: 'pos/endSession'; payload: { summary: Omit<PosSessionSummary, 'id' | 'status' | 'date' | 'cashierId' | 'verifiedBy' | 'verifiedDate' | 'depositToAccountId'> } }
  | { type: 'pos/redeemWithdrawalToken'; payload: { token: string } }
  | { type: 'pos/clearLastWithdrawalReceipt' }
  // Billing actions
  | { type: 'billing/createVendorBillFromPo'; payload: { purchaseOrderId: string } }
  | { type: 'billing/payVendorBill'; payload: { billId: string, paymentAccountId: string } }
  | { type: 'billing/clearLastGeneratedBill' }
  | { type: 'billing/createCustomerBillFromSale'; payload: { saleId: string } }
  | { type: 'billing/payCustomerBill'; payload: { billId: string, paymentAccountId: string } }
  | { type: 'billing/clearLastCreatedBill' }
  // Return actions
  | { type: 'returns/create'; payload: Omit<ReturnOrder, 'id' | 'date' | 'status'> }
  | { type: 'returns/process'; payload: { returnId: string } }
  // Document actions (New)
  | { type: 'documents/addIncoming'; payload: Omit<IncomingLetter, 'id'> }
  | { type: 'documents/addOutgoing'; payload: Omit<OutgoingLetter, 'id' | 'createdBy'> }
  // Module actions
  | { type: 'modules/setInstalled'; payload: { moduleKey: string, isInstalled: boolean } }
  | { type: 'crm/addLead'; payload: Omit<Lead, 'id' | 'status'> }
  | { type: 'helpdesk/addTicket'; payload: { subject: string, initialMessage: string, priority: 'Low' | 'Medium' | 'High' } }
  | { type: 'helpdesk/addMessage'; payload: { ticketId: string; text: string; sender: 'user' | 'cs' } }
  | { type: 'helpdesk/updateTicketStatus'; payload: { ticketId: string; status: HelpdeskTicket['status'] } }
  | { type: 'projects/add'; payload: Omit<Project, 'id'> }
  | { type: 'projects/update'; payload: Project }
  | { type: 'projects/addTask'; payload: Omit<ProjectTask, 'id' | 'status'> }
  | { type: 'approvals/updateStatus'; payload: { approvalId: string; status: ApprovalRequest['status'] } }
  | { type: 'modules/blog/addPost'; payload: Omit<BlogPost, 'id' | 'authorId' | 'publishedDate'> }
  | { type: 'modules/blog/updatePost'; payload: BlogPost }
  | { type: 'modules/forum/addPost'; payload: { title: string; content: string } }
  | { type: 'modules/forum/addReply'; payload: { postId: string; content: string } }
  | { type: 'website/updateSettings'; payload: WebsiteSettingsConfig }
  | { type: 'website/setPage'; payload: AppState['currentWebsitePage'] }
  // --- E-learning actions ---
  | { type: 'elearning/updatePeriods'; payload: ElearningPeriods }
  | { type: 'elearning/addOrUpdateTest'; payload: Omit<CourseTest, 'id'> | CourseTest }
  | { type: 'elearning/submitGrade'; payload: { testId: string, menteeId: string, grade: number } }
  | { type: 'elearning/addCustomAssessment'; payload: Omit<CustomAssessment, 'id'> }
  | { type: 'elearning/submitCustomGrade'; payload: Omit<CustomAssessmentGrade, 'id'> }
  | { type: 'modules/elearning/addCourse'; payload: Omit<Course, 'id' | 'creatorId'> }
  | { type: 'elearning/updateCourse'; payload: Course }
  | { type: 'elearning/addCourseClass'; payload: Omit<CourseClass, 'id'> }
  | { type: 'elearning/updateCourseClass'; payload: CourseClass }
  | { type: 'elearning/addStudent'; payload: Omit<Mentee, 'id' | 'status'> }
  | { type: 'elearning/updateStudent'; payload: Mentee }
  | { type: 'elearning/setStudentStatus'; payload: { menteeId: string; status: Status } }
  | { type: 'elearning/chooseSchedule'; payload: { enrollmentId: string, scheduleId: string } }
  | { type: 'elearning/markStudentAttendance'; payload: { enrollmentId: string, scheduleId: string } }
  | { type: 'elearning/enrollStudent'; payload: { courseClassId: string } }
  | { type: 'elearning/submitTest'; payload: Omit<MenteeTestAnswer, 'id' | 'score' | 'submittedDate'> }
  // --- Recruitment actions (New) ---
  | { type: 'recruitment/addJobOpening'; payload: Omit<JobOpening, 'id'> }
  | { type: 'recruitment/updateJobOpening'; payload: JobOpening }
  | { type: 'recruitment/deleteJobOpening'; payload: string }
  | { type: 'recruitment/addApplicant'; payload: Omit<JobApplicant, 'id' | 'appliedDate' | 'status'> }
  | { type: 'recruitment/updateApplicantStatus'; payload: { applicantId: string, newStatus: JobApplicant['status'] } }
  | { type: 'recruitment/deleteApplicant'; payload: string }
  // --- Calendar actions (New) ---
  | { type: 'calendar/addEvent'; payload: Omit<CompanyEvent, 'id'> }
  // --- Other modules ---
  | { type: 'events/createTicketSaleFromPortal'; payload: { eventId: string, ticketTierId: string, quantity: number; paymentMethod: 'va' | 'transfer' } }
  | { type: 'events/createTicketSaleWithDeposit'; payload: { eventId: string, ticketTierId: string, quantity: number } }
  | { type: 'modules/room/addAsset'; payload: Omit<Room, 'id' | 'assetId'> & { purchaseDate: string, value: number } }
  | { type: 'modules/room/addOrder'; payload: { orderData: Omit<RoomOrder, 'id' | 'status'>, paymentAccountId: string } }
  | { type: 'modules/rental/addOrder'; payload: { orderData: Omit<RentalOrder, 'id' | 'status'>, paymentAccountId: string } }
  | { type: 'modules/mfg/addOrder'; payload: Omit<ManufacturingOrder, 'id' | 'status'> }
  | { type: 'modules/maint/addRequest'; payload: Omit<MaintenanceRequest, 'id' | 'reportedById' | 'status'> }
  | { type: 'modules/fleet/addVehicle'; payload: Omit<Vehicle, 'id' | 'assetId'> }
  | { type: 'modules/fleet/updateVehicle'; payload: Vehicle }
  | { type: 'modules/events/addEvent'; payload: Omit<Event, 'id'> }
  | { type: 'modules/events/addTicketSale'; payload: Omit<EventTicketSale, 'id' | 'purchaseDate'> & { paymentAccountId: string } }
  | { type: 'modules/planning/addPlan'; payload: Omit<CustomerPlan, 'id'> }
  | { type: 'modules/planning/toggleActivity'; payload: { planId: string; activityIndex: number } }
  | { type: 'modules/planning/addTemplate'; payload: Omit<PlanTemplate, 'id'> }
  | { type: 'modules/planning/updateTemplate'; payload: PlanTemplate }
    // --- MISSING TYPES ADDED HERE ---
    // Promotions actions
  | { type: 'promotions/add'; payload: Omit<Promotion, 'id'> }
  | { type: 'promotions/update'; payload: Promotion }
  | { type: 'points/updateSettings'; payload: PointsSettings }
    // Assets actions
  | { type: 'assets/add'; payload: Omit<Asset, 'id'> }
  | { type: 'assets/update'; payload: Asset }
  | { type: 'assets/setStatus'; payload: { id: string, status: Status } }
  | { type: 'assets/recordPurchase'; payload: { assetData: Omit<Asset, 'id'>; cashAccountId: string } }
  | { type: 'assets/recordSale'; payload: { assetId: string; salePrice: number; cashAccountId: string } }
  | { type: 'assets/addCategory'; payload: Omit<AssetCategory, 'id'> }
  | { type: 'assets/updateCategory'; payload: AssetCategory }
  | { type: 'assets/deleteCategory'; payload: string }
    // Finance actions
  | { type: 'finance/addCashAccount'; payload: { name: string, initialBalance: number, sourceAccountId: string, cashAccountType: Account['cashAccountType'] } }
  | { type: 'finance/updateCashAccount'; payload: { accountId: string; name: string } }
  | { type: 'finance/addJournalEntry'; payload: { description: string, lines: Omit<JournalEntryLine, 'accountName'>[], reference?: string, posSessionId?: string } }
  | { type: 'finance/addInvestor'; payload: Omit<Investor, 'id' | 'ownershipPercentage'> }
  | { type: 'finance/addCapitalTransaction'; payload: { investorId: string, type: 'Deposit' | 'Withdrawal', amount: number, cashAccountId: string } }
  | { type: 'finance/distributeProfit'; payload: { totalProfitDistributed: number, distributions: { investorId: string, amount: number }[], cashAccountId: string } }
  | { type: 'finance/verifyCashierDeposit'; payload: { summaryId: string, depositToAccountId: string } }
  ;

const AppContext = createContext<{ state: AppState; dispatch: React.Dispatch<Action> } | undefined>(undefined);

// AppProvider component
export const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [state, dispatch] = useReducer(appReducer, initialState, (defaultState) => {
        try {
            const saved = localStorage.getItem('posnesia_local_state_v2');
            if (saved) {
                const parsed = JSON.parse(saved);
                
                // Get company info from parsed state, falling back to defaultState
                const rawCompanyInfo = parsed.companyInfo || {};
                
                // Migrate from old defaults if matches
                const name = rawCompanyInfo.name === 'PosNesia' || !rawCompanyInfo.name ? 'Mete Corp' : rawCompanyInfo.name;
                const address = rawCompanyInfo.address === 'Jl. Raya No. 123, Jakarta' || !rawCompanyInfo.address ? 'Lumajang, Jawa Timur, Indonesia' : rawCompanyInfo.address;
                const phone = rawCompanyInfo.phone === '081234567890' || !rawCompanyInfo.phone ? '085852488293' : rawCompanyInfo.phone;
                const email = rawCompanyInfo.email === 'support@posnesia.com' || !rawCompanyInfo.email ? 'support@posnesia.com' : rawCompanyInfo.email;
                const logoUrl = rawCompanyInfo.logoUrl || '/logo.svg';

                const companyInfo = {
                    ...defaultState.companyInfo,
                    ...rawCompanyInfo,
                    name,
                    address,
                    phone,
                    email,
                    logoUrl
                };

                return { 
                    ...defaultState, 
                    ...parsed,
                    companyInfo,
                    websiteSettings: { ...defaultState.websiteSettings, ...(parsed.websiteSettings || {}) }
                };
            }
        } catch (e) {
            console.error('Failed to load local state from localStorage', e);
        }
        return defaultState;
    });
    
    useEffect(() => {
        try {
            localStorage.setItem('posnesia_local_state_v2', JSON.stringify(state));
        } catch (e) {
            console.error('Failed to save local state to localStorage', e);
        }
    }, [state]);

    return (
        <AppContext.Provider value={{ state, dispatch }}>
            {children}
        </AppContext.Provider>
    );
};

// Custom hook to use the context
export const useAppContext = (): { state: AppState; dispatch: React.Dispatch<Action> } => {
    const context = useContext(AppContext);
    if (context === undefined) {
        throw new Error('useAppContext must be used within an AppProvider');
    }
    return context;
};

const appReducer = (state: AppState, action: Action): AppState => {
    switch (action.type) {
        // --- AUTH ---
        case 'auth/login': {
            const { user } = action.payload;
            // The user object is already validated by the component.
            // The reducer's job is just to update the state.
            const branchId = user.branchId;
            return { 
                ...state, 
                currentUser: user, 
                currentBranchId: branchId, 
                currentPage: Page.Dashboard, 
                isLoginPageVisible: false 
            };
        }
        case 'auth/logout': {
            return { ...state, currentUser: null, isPosModeActive: false, posSession: null, isLoginPageVisible: false, currentWebsitePage: 'home' };
        }
        case 'auth/customerLogin': {
             const { phone, pin } = action.payload;
            const customer = state.customers.find(c => c.phone === phone && c.pin === pin);
            if (customer) {
                return { ...state, currentCustomer: customer, isLoginPageVisible: false };
            }
            alert('No. Telepon atau PIN tidak valid.');
            return state;
        }
         case 'auth/customerLogout': {
            return { ...state, currentCustomer: null, isLoginPageVisible: false, currentWebsitePage: 'home' };
        }
         case 'auth/studentLogin': {
             const { studentId, pin } = action.payload;
            const mentee = state.mentees.find(s => s.id === studentId && s.pin === pin);
            if (mentee) {
                return { ...state, currentMentee: mentee, isLoginPageVisible: false };
            }
             alert('ID Peserta atau PIN tidak valid.');
            return state;
        }
         case 'auth/studentLogout': {
            return { ...state, currentMentee: null, isLoginPageVisible: false, currentWebsitePage: 'home' };
        }
        case 'auth/changePin': {
            if (!state.currentUser) return state;
            const updatedStaffList = state.staff.map(s => s.id === state.currentUser!.id ? { ...s, pin: action.payload.newPin } : s);
            return {
                ...state,
                staff: updatedStaffList,
                currentUser: { ...state.currentUser, pin: action.payload.newPin }
            };
        }
        case 'auth/registerCustomer': {
            const newCustomer: Customer = {
                ...action.payload,
                id: generateId('c', state.customers.length),
                joinDate: new Date().toISOString(),
                depositBalance: 0,
                points: 0,
                customerType: 'Perorangan',
                status: 'active',
                addresses: [],
            };
            return { ...state, customers: [...state.customers, newCustomer] };
        }
        case 'auth/registerStudent': {
            const { name, email, phone } = action.payload;
            const date = new Date();
            const year = date.getFullYear().toString().slice(-2);
            const month = (date.getMonth() + 1).toString().padStart(2, '0');
            const prefix = `${year}${month}`;
            const sequence = state.mentees.filter(s => s.id.startsWith(prefix)).length + 1;
            const newId = `${prefix}${sequence.toString().padStart(4, '0')}`;
            const newPin = Math.floor(100000 + Math.random() * 900000).toString();

            const newMentee: Mentee = {
                id: newId,
                name,
                email,
                phone,
                pin: newPin,
                status: 'active'
            };
            return {
                ...state,
                mentees: [...state.mentees, newMentee],
                lastRegisteredMentee: { id: newId, pin: newPin }
            };
        }
        case 'auth/clearLastRegistered': {
            return { ...state, lastRegisteredMentee: null };
        }
        // --- UI ---
        case 'ui/setPage': return { ...state, currentPage: action.payload };
        case 'ui/setTheme': return { ...state, theme: action.payload };
        case 'ui/setThemeConfig': return { ...state, themeConfig: action.payload };
        case 'ui/showLoginPage': return { ...state, isLoginPageVisible: action.payload };
        case 'ui/setCurrentBranch': return { ...state, currentBranchId: action.payload };
        case 'ui/setSidebarCollapsed': return { ...state, isSidebarCollapsed: action.payload };
        case 'ui/setPrintSelection': return { ...state, printSelection: action.payload };
        case 'ui/clearPrintSelection': return { ...state, printSelection: null };
        // --- COMPANY ---
        case 'company/updateInfo': return { ...state, companyInfo: action.payload };
        case 'company/addBranchType': {
            const newType: BranchType = { ...action.payload, id: generateId('bt', state.branchTypes.length) };
            return { ...state, branchTypes: [...state.branchTypes, newType] };
        }
        case 'company/updateBranchType': return { ...state, branchTypes: state.branchTypes.map(bt => bt.id === action.payload.id ? action.payload : bt) };
        case 'company/addWarehouseType': {
            const newType: WarehouseType = { ...action.payload, id: generateId('wt', state.warehouseTypes.length) };
            return { ...state, warehouseTypes: [...state.warehouseTypes, newType] };
        }
        case 'company/updateWarehouseType': return { ...state, warehouseTypes: state.warehouseTypes.map(wt => wt.id === action.payload.id ? action.payload : wt) };
        case 'company/addBranch': {
            const city = state.cities.find(c => c.id === action.payload.cityId);
            const district = state.districts.find(d => d.id === action.payload.districtId);
            if (!city || !district) {
                alert("Kota atau Kecamatan tidak valid.");
                return state;
            }

            const newBranchId = generateBranchId(city.code, district.code, city.id, state.branches);
            const safeAccountName = `Brankas - ${action.payload.name}`;
            const newSafeAccountId = generateId('103', state.accounts.filter(a=>a.id.startsWith('103')).length);
            
            const newBranch: Branch = { ...action.payload, id: newBranchId, safeAccountId: newSafeAccountId };
            const newSafeAccount: Account = { id: newSafeAccountId, name: safeAccountName, type: AccountType.Asset, balance: 0, isCashAccount: true, branchId: newBranchId, cashAccountType: 'Brankas' };
            
            // Auto-create a linked warehouse
            const warehouseTypeForBranch = state.warehouseTypes.find(wt => wt.name === 'Gudang Cabang');
            if (!warehouseTypeForBranch) {
                alert("Tipe 'Gudang Cabang' tidak ditemukan. Harap buat tipe gudang tersebut terlebih dahulu di Manajemen Lokasi -> Tipe Lokasi.");
                return state;
            }
            const newWarehouseId = generateId('wh_b', state.warehouses.length);
            const newWarehouse: Warehouse = {
                id: newWarehouseId,
                name: `Gudang - ${action.payload.name}`,
                address: action.payload.detail,
                warehouseTypeId: warehouseTypeForBranch.id,
                branchId: newBranchId
            };
            
            return { ...state, branches: [...state.branches, newBranch], accounts: [...state.accounts, newSafeAccount], warehouses: [...state.warehouses, newWarehouse] };
        }
        case 'company/updateBranch': {
            return { ...state, branches: state.branches.map(b => b.id === action.payload.id ? action.payload : b) };
        }
        case 'company/addCashierStation': {
            const newStationId = generatePosTerminalId(action.payload.branchId, state.cashierStations);
            const cashInHandAccountName = `Kas di Tangan - ${action.payload.name}`;
             const newCashInHandAccountId = generateId('101', state.accounts.filter(a => a.id.startsWith('101')).length);

            const newStation: CashierStation = { ...action.payload, id: newStationId, cashInHandAccountId: newCashInHandAccountId };
            const newCashAccount: Account = { id: newCashInHandAccountId, name: cashInHandAccountName, type: AccountType.Asset, balance: 0, isCashAccount: true, branchId: action.payload.branchId, cashAccountType: 'Tunai' };
            
            return { ...state, cashierStations: [...state.cashierStations, newStation], accounts: [...state.accounts, newCashAccount] };
        }
        case 'company/updateCashierStation': {
            return { ...state, cashierStations: state.cashierStations.map(cs => cs.id === action.payload.id ? action.payload : cs) };
        }
        case 'company/addWarehouse': {
            const newWarehouse: Warehouse = { ...action.payload, id: generateId('wh', state.warehouses.length) };
            return { ...state, warehouses: [...state.warehouses, newWarehouse] };
        }
        case 'company/updateWarehouse': {
            return { ...state, warehouses: state.warehouses.map(w => w.id === action.payload.id ? action.payload : w) };
        }
        // --- AREA MANAGEMENT ---
        case 'areas/addProvince': {
            const newProvince: Province = { ...action.payload, id: generateId('prov', state.provinces.length) };
            return { ...state, provinces: [...state.provinces, newProvince] };
        }
        case 'areas/updateProvince': return { ...state, provinces: state.provinces.map(p => p.id === action.payload.id ? action.payload : p) };
        case 'areas/addCity': {
            const newCityData = action.payload as Omit<City, 'id'>;
            const codeExists = state.cities.some(c => c.code === newCityData.code);
            if (codeExists) {
                alert(`Error: Kode kota "${newCityData.code}" sudah digunakan. Harap gunakan kode unik.`);
                return state;
            }
            const newCity: City = { ...newCityData, id: generateId('city', state.cities.length) };
            return { ...state, cities: [...state.cities, newCity] };
        }
        case 'areas/updateCity': {
            const updatedCityData = action.payload as City;
            const codeExists = state.cities.some(c => c.code === updatedCityData.code && c.id !== updatedCityData.id);
             if (codeExists) {
                alert(`Error: Kode kota "${updatedCityData.code}" sudah digunakan. Harap gunakan kode unik.`);
                return state;
            }
            return { ...state, cities: state.cities.map(c => c.id === updatedCityData.id ? updatedCityData : c) };
        }
        case 'areas/addDistrict': {
            const newDistrict: District = { ...action.payload, id: generateId('dist', state.districts.length) };
            return { ...state, districts: [...state.districts, newDistrict] };
        }
        case 'areas/updateDistrict': return { ...state, districts: state.districts.map(d => d.id === action.payload.id ? action.payload : d) };
        case 'areas/addVillage': {
            const newVillage: Village = { ...action.payload, id: generateId('vill', state.villages.length) };
            return { ...state, villages: [...state.villages, newVillage] };
        }
        case 'areas/updateVillage': return { ...state, villages: state.villages.map(v => v.id === action.payload.id ? action.payload : v) };
        // --- SETTINGS ---
        case 'settings/updateEcommerce': return { ...state, ecommerceSettings: action.payload };
        case 'settings/updateReportLayouts': return { ...state, reportLayoutSettings: action.payload };
        case 'settings/updateTaxRates': return { ...state, taxRates: action.payload };
        case 'settings/toggleTaxSystem': return { ...state, isTaxEnabled: !state.isTaxEnabled };
        case 'settings/addPaymentMethod': {
            const newMethod: PaymentMethod = { ...action.payload, id: generateId('pm', state.paymentMethods.length) };
            return { ...state, paymentMethods: [...state.paymentMethods, newMethod] };
        }
        case 'settings/updatePaymentMethod': return { ...state, paymentMethods: state.paymentMethods.map(pm => pm.id === action.payload.id ? action.payload : pm) };
        case 'settings/deletePaymentMethod': return { ...state, paymentMethods: state.paymentMethods.filter(pm => pm.id !== action.payload) };
        case 'settings/addPaymentTerm': {
            const newTerm: PaymentTerm = { ...action.payload, id: generateId('pt', state.paymentTerms.length) };
            return { ...state, paymentTerms: [...state.paymentTerms, newTerm] };
        }
        case 'settings/updatePaymentTerm': return { ...state, paymentTerms: state.paymentTerms.map(pt => pt.id === action.payload.id ? action.payload : pt) };
        case 'settings/deletePaymentTerm': return { ...state, paymentTerms: state.paymentTerms.filter(pt => pt.id !== action.payload) };
        // --- PRODUCT ---
        case 'products/add': {
            const { productData, typeLocations } = action.payload;
            const updatedProducts = productService.addProduct(state.products, productData as Omit<Product, 'id' | 'imageUrl'>);
            const newProduct = updatedProducts[updatedProducts.length - 1];
            
            const newProductTypeLocations = typeLocations.map(loc => ({
                ...loc,
                id: generateId('ptl', state.productTypeLocations.length + Math.random()),
                productId: newProduct.id,
            }));

            return { 
                ...state, 
                products: updatedProducts, 
                productTypeLocations: [...state.productTypeLocations, ...newProductTypeLocations],
            };
        }
        case 'products/update': {
            const { product, typeLocations } = action.payload;
            const updatedProducts = productService.updateProduct(state.products, product);
            
            const otherProductTypeLocations = state.productTypeLocations.filter(ptl => ptl.productId !== product.id);
            
            const newProductTypeLocations = typeLocations.map(loc => ({
                ...loc,
                id: generateId('ptl', otherProductTypeLocations.length + Math.random()),
                productId: product.id,
            }));

            return { 
                ...state, 
                products: updatedProducts, 
                productTypeLocations: [...otherProductTypeLocations, ...newProductTypeLocations]
            };
        }
        case 'products/setStatus': return { ...state, products: state.products.map(p => p.id === action.payload.id ? { ...p, status: action.payload.status } : p) };
        case 'products/setPrices': return { ...state, products: productService.setAutoPrices(state.products, action.payload.markup) };
        case 'products/addCategory': {
            const newCategory: ProductCategory = { ...action.payload, id: generateId('cat', state.productCategories.length) };
            return { ...state, productCategories: [...state.productCategories, newCategory] };
        }
        case 'products/updateCategory': return { ...state, productCategories: state.productCategories.map(c => c.id === action.payload.id ? action.payload : c) };
        case 'products/deleteCategory': {
            const isUsed = state.products.some(p => p.categoryId === action.payload);
            if (isUsed) {
                alert("Tidak dapat menghapus kategori yang masih digunakan oleh produk.");
                return state;
            }
            return { ...state, productCategories: state.productCategories.filter(c => c.id !== action.payload) };
        }
        // --- CUSTOMERS ---
        case 'customers/add': {
            const newCustomer: Customer = {
                ...action.payload,
                id: generateId('c', state.customers.length),
                joinDate: new Date().toISOString(),
                depositBalance: 0,
                points: 0,
                status: 'active',
                addresses: [],
            };
            return { ...state, customers: [...state.customers, newCustomer] };
        }
        case 'customers/update': return { ...state, customers: state.customers.map(c => c.id === action.payload.id ? action.payload : c) };
        case 'customers/setStatus': return { ...state, customers: state.customers.map(c => c.id === action.payload.id ? { ...c, status: action.payload.status } : c) };
        case 'customers/addDeposit': {
            const { customerId, amount, paymentMethodId, posSessionId } = action.payload;
            const customer = state.customers.find(c => c.id === customerId);
            if (!customer) return state;

            const updatedCustomers = state.customers.map(c => c.id === customerId ? { ...c, depositBalance: c.depositBalance + amount } : c);
            
            const paymentMethod = state.paymentMethods.find(pm => pm.id === paymentMethodId);
            const station = posSessionId ? state.cashierStations.find(cs => cs.id === state.posSession?.cashierStationId) : null;
            
            let debitAccountId = paymentMethod?.linkedAccountId || '1010';
            if (paymentMethod?.type === 'cash' && station) {
                debitAccountId = station.cashInHandAccountId;
            }

            const journalResult = journalService.createJournalEntry(
                state.accounts, 
                state.journalEntries, 
                state.currentBranchId || 'b1', 
                `Deposit Saldo Pelanggan: ${customer.name}`, 
                [
                    { accountId: debitAccountId, type: 'debit', amount },
                    { accountId: '2110', type: 'credit', amount }, // Simpanan Pelanggan
                ],
                `Deposit ${customerId}`,
                posSessionId
            );

            return { ...state, customers: updatedCustomers, ...journalResult };
        }
        case 'customers/withdrawDeposit': {
            const { customerId, amount, posSessionId } = action.payload;
            const customer = state.customers.find(c => c.id === customerId);
            if (!customer || customer.depositBalance < amount) return state;

            const updatedCustomers = state.customers.map(c => c.id === customerId ? { ...c, depositBalance: c.depositBalance - amount } : c);
            
            const station = posSessionId ? state.cashierStations.find(cs => cs.id === state.posSession?.cashierStationId) : null;
            const creditAccountId = station ? station.cashInHandAccountId : '1010'; // Assume withdrawal is always cash from a station or general cash

            const journalResult = journalService.createJournalEntry(
                state.accounts, 
                state.journalEntries, 
                state.currentBranchId || 'b1', 
                `Penarikan Saldo Pelanggan: ${customer.name}`, 
                [
                    { accountId: '2110', type: 'debit', amount }, // Simpanan Pelanggan
                    { accountId: creditAccountId, type: 'credit', amount },
                ],
                `Withdraw ${customerId}`,
                posSessionId
            );

            return { ...state, customers: updatedCustomers, ...journalResult };
        }
        case 'customers/addAddress': {
            if (!state.currentCustomer) return state;
            const newAddress: CustomerAddress = { ...action.payload, id: generateId('addr', Math.random()) };
            const customer = state.customers.find(c => c.id === state.currentCustomer!.id)!;
            
            let updatedAddresses = [...customer.addresses];
            if (newAddress.isPrimary) {
                updatedAddresses = updatedAddresses.map(a => ({ ...a, isPrimary: false }));
            }
            updatedAddresses.push(newAddress);
            
            const updatedCustomer = { ...customer, addresses: updatedAddresses };
            
            return {
                ...state,
                customers: state.customers.map(c => c.id === updatedCustomer.id ? updatedCustomer : c),
                currentCustomer: updatedCustomer,
            };
        }
        case 'customers/createDepositBill': {
            const { amount, paymentMethod } = action.payload;
            if (!state.currentCustomer) return state;
        
            const customer = state.currentCustomer;
            const newBillId = generateId('cb', state.customerBills.length);
            
            // For bank transfer, add unique 3 digits
            const finalAmount = paymentMethod === 'transfer' ? amount + Math.floor(100 + Math.random() * 899) : amount;
            const virtualAccountNumber = paymentMethod === 'va' ? `8808${customer.phone.slice(-8)}` : undefined;
        
            const newBill: CustomerBill = {
                id: newBillId,
                sourceType: 'Deposit',
                sourceId: generateId('DEP', Math.random()), // Unique ID for the deposit transaction
                description: `Isi Saldo - ${paymentMethod === 'va' ? 'Bayar di Kasir' : 'Transfer Bank'}`,
                customerId: customer.id,
                customerName: customer.name,
                billDate: new Date().toISOString(),
                dueDate: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // 24 hours due date
                amount: finalAmount,
                status: 'Unpaid',
                virtualAccountNumber,
            };
        
            return {
                ...state,
                customerBills: [...state.customerBills, newBill],
                lastCreatedBill: newBill,
            };
        }
        case 'customers/createWithdrawalToken': {
            const { amount, pin } = action.payload;
            const customer = state.currentCustomer;
            if (!customer) return state;

            if (customer.pin !== pin) {
                alert('PIN salah.');
                return state;
            }
            if (customer.depositBalance < amount) {
                alert('Saldo deposit tidak mencukupi.');
                return state;
            }

            const newToken: DepositWithdrawalToken = {
                id: Math.floor(100000 + Math.random() * 900000).toString(),
                customerId: customer.id,
                amount,
                createdAt: new Date().toISOString(),
                expiresAt: new Date(Date.now() + 15 * 60 * 1000).toISOString(), // 15 minutes validity
                status: 'pending',
            };

            return {
                ...state,
                depositWithdrawalTokens: [...state.depositWithdrawalTokens, newToken],
                lastWithdrawalToken: newToken,
            };
        }
        case 'customers/clearLastWithdrawalToken': {
            return { ...state, lastWithdrawalToken: null };
        }
        case 'customers/payBillWithDeposit': {
            const { virtualAccountNumber, pin } = action.payload;
            const payer = state.currentCustomer;
            if (!payer) return state;

            if (payer.pin !== pin) {
                alert('PIN salah.');
                return state;
            }
            
            const bill = state.customerBills.find(b => b.virtualAccountNumber === virtualAccountNumber && b.status === 'Unpaid');
            if (!bill) {
                alert('Tagihan tidak ditemukan atau sudah lunas.');
                return state;
            }

            if (payer.depositBalance < bill.amount) {
                alert('Saldo deposit Anda tidak mencukupi untuk membayar tagihan ini.');
                return state;
            }
            
            // Update payer
            const payerIndex = state.customers.findIndex(c => c.id === payer.id);
            const updatedPayer = { ...payer, depositBalance: payer.depositBalance - bill.amount };
            
            let updatedCustomers = [...state.customers];
            updatedCustomers[payerIndex] = updatedPayer;

            // Create payer transaction
            const payerTransaction: DepositTransaction = {
                id: generateId('dt', state.depositTransactions.length),
                customerId: payer.id,
                date: new Date().toISOString(),
                type: 'Purchase', // Or maybe 'Payment'
                amount: -bill.amount,
                description: `Bayar tagihan #${bill.id} untuk ${bill.customerName}`,
                endingBalance: updatedPayer.depositBalance,
            };
            
            let updatedTransactions = [...state.depositTransactions, payerTransaction];
            
            // If the bill was for a deposit, credit the recipient
            let journalLines : Omit<JournalEntryLine, 'accountName'>[] = [
                { accountId: '2110', type: 'debit', amount: bill.amount }, // Debit payer's deposit liability
            ];

            if (bill.sourceType === 'Deposit') {
                const recipientIndex = updatedCustomers.findIndex(c => c.id === bill.customerId);
                if (recipientIndex > -1) {
                    const recipient = updatedCustomers[recipientIndex];
                    const updatedRecipient = { ...recipient, depositBalance: recipient.depositBalance + bill.amount };
                    updatedCustomers[recipientIndex] = updatedRecipient;
                    
                    // Create recipient transaction
                    const recipientTransaction: DepositTransaction = {
                         id: generateId('dt', updatedTransactions.length),
                         customerId: recipient.id,
                         date: new Date().toISOString(),
                         type: 'Deposit',
                         amount: bill.amount,
                         description: `Terima pembayaran tagihan #${bill.id} dari ${payer.name}`,
                         endingBalance: updatedRecipient.depositBalance,
                    };
                    updatedTransactions.push(recipientTransaction);
                    journalLines.push({ accountId: '2110', type: 'credit', amount: bill.amount }); // Credit recipient's deposit liability
                }
            } else {
                // For other bill types (Sale, Event), the credit goes to Piutang Usaha
                journalLines.push({ accountId: '1110', type: 'credit', amount: bill.amount }); // Credit Piutang Usaha
            }
            
            const journalResult = journalService.createJournalEntry(
                state.accounts,
                state.journalEntries,
                state.currentBranchId || 'b1', // Assume this happens at a branch context, even if remote.
                `Pembayaran tagihan #${bill.id} oleh ${payer.name}`,
                journalLines,
                `BillPayment ${bill.id}`
            );

            const updatedBills = state.customerBills.map(b => b.id === bill.id ? { ...b, status: 'Paid' as const, paidDate: new Date().toISOString() } : b);
            
            return {
                ...state,
                ...journalResult,
                customers: updatedCustomers,
                currentCustomer: updatedPayer,
                customerBills: updatedBills,
                depositTransactions: updatedTransactions,
            };
        }
        // --- POS ---
        case 'pos/toggleMode': {
            const { start } = action.payload;
            return { ...state, isPosModeActive: start };
        }
        case 'pos/startSession': {
            const { cashierStationId, startCash } = action.payload;
            const newSession: PosSession = {
                id: generateId('sess', state.posSessions?.length || 0),
                cashierStationId: cashierStationId || state.cashierStations[0]?.id || 'station-1',
                staffId: state.currentUser?.id || 'staff-1',
                startTime: new Date().toISOString(),
                startCash: startCash || 0,
                branchId: state.currentUser?.branchId || state.branches[0]?.id || 'CAB-JPSTNH01',
            };
            return {
                ...state,
                isPosModeActive: true,
                posSession: newSession,
                posSessions: state.posSessions ? [...state.posSessions, newSession] : [newSession]
            };
        }
        case 'pos/endSession': {
            const { summary } = action.payload;
            const newSummary: PosSessionSummary = {
                ...summary,
                id: generateId('sum', state.posSessionSummaries.length),
                status: 'closed',
                date: new Date().toISOString(),
                cashierId: state.currentUser?.id || 'staff-1',
            };
            return {
                ...state,
                isPosModeActive: false,
                posSession: null,
                posSessionSummaries: [...state.posSessionSummaries, newSummary],
            };
        }
        case 'finance/addJournalEntry': {
            const { description, lines, reference, posSessionId } = action.payload;
            const branchId = state.currentUser?.branchId || state.branches[0]?.id || 'CAB-JPSTNH01';
            const journalResult = journalService.createJournalEntry(
                state.accounts,
                state.journalEntries,
                branchId,
                description,
                lines,
                reference,
                posSessionId
            );
            return {
                ...state,
                accounts: journalResult.accounts,
                journalEntries: journalResult.journalEntries,
            };
        }
        case 'pos/processSale': {
            const { customerId, paymentMethodId, voucherCode, amountPaid, change, pointsToUse, depositToUse, items, subtotal, discount, taxAmount, grandTotal, posSessionId } = action.payload;
            const branchId = state.currentUser?.branchId || state.branches[0]?.id || 'CAB-JPSTNH01';
            
            // We use the items passed in the payload (which supports custom modifiers and wholesale pricing!)
            const saleItems = items || state.cart.map(item => ({
                productId: item.product.id,
                productName: item.product.name,
                quantity: item.quantity,
                price: item.product.price,
                cost: item.product.cost,
                discount: (item.discount || 0) * item.quantity,
            }));

            const finalSubtotal = subtotal !== undefined ? subtotal : state.cart.reduce((sum, item) => sum + item.product.price * item.quantity, 0);
            const finalDiscount = discount !== undefined ? discount : state.cart.reduce((sum, item) => sum + (item.discount || 0) * item.quantity, 0);
            const finalTaxAmount = taxAmount !== undefined ? taxAmount : 0;
            const finalGrandTotal = grandTotal !== undefined ? grandTotal : (finalSubtotal - finalDiscount + finalTaxAmount);

            const customer = state.customers.find(c => c.id === customerId);

            const newSaleData = {
                branchId,
                sourceLocationId: branchId,
                items: saleItems,
                subtotal: finalSubtotal,
                discount: finalDiscount,
                taxAmount: finalTaxAmount,
                grandTotal: finalGrandTotal,
                customerId: customerId || undefined,
                customerName: customer ? customer.name : 'Pelanggan Umum',
                payments: [{ paymentMethodId, amount: finalGrandTotal }],
                paymentTermId: 'pt1', // Langsung
                dueDate: new Date().toISOString(),
                pointsUsed: pointsToUse || 0,
                depositUsed: depositToUse || 0,
                codAmount: 0,
                saleChannel: 'POS' as const,
                fulfillmentStatus: 'N/A' as const,
                posSessionId: posSessionId || state.posSession?.id,
                staffId: state.currentUser?.id,
            };

            const result = salesService.createSale({
                products: state.products,
                inventoryLevels: state.inventoryLevels,
                stockMovements: state.stockMovements,
                sales: state.sales,
                accounts: state.accounts,
                journalEntries: state.journalEntries,
                customers: state.customers,
                taxRates: state.taxRates,
                paymentMethods: state.paymentMethods,
                isTaxEnabled: state.isTaxEnabled,
                cashierStations: state.cashierStations,
                newSaleData,
                posSession: state.posSession,
            });

            return {
                ...state,
                ...result,
                lastTransaction: result.sales[0] || null,
            };
        }
        case 'pos/processTicketSale':
        case 'pos/clearLastTicketSale':
        case 'pos/payBill':
        case 'pos/clearLastPaidBill':
        case 'pos/redeemWithdrawalToken':
        case 'pos/clearLastWithdrawalReceipt': {
            return state;
        }
        // --- STAFF ---
        case 'staff/add': return { ...state, staff: staffService.addStaff(state.staff, action.payload as Staff) };
        case 'staff/update': return { ...state, staff: staffService.updateStaff(state.staff, action.payload) };
        case 'staff/setStatus': return { ...state, staff: state.staff.map(s => s.id === action.payload.id ? { ...s, status: action.payload.status } : s) };
        case 'staff/markAttendance': return { ...state, attendance: staffService.markAttendance(state.attendance, state.staff, action.payload) };
        case 'staff/paySalaries': {
             const activeStaff = state.staff.filter(s => s.status === 'active');
            let updatedStaff = [...state.staff];
            const journalLines: Omit<JournalEntryLine, 'accountName'>[] = [];

            activeStaff.forEach(s => {
                journalLines.push({ accountId: '2020', type: 'credit', amount: s.salary }); // Utang Gaji
                const staffIndex = updatedStaff.findIndex(us => us.id === s.id);
                if (staffIndex > -1) {
                    updatedStaff[staffIndex] = { ...updatedStaff[staffIndex], depositBalance: updatedStaff[staffIndex].depositBalance + s.salary };
                }
            });

            const totalSalary = activeStaff.reduce((sum, s) => sum + s.salary, 0);
            journalLines.push({ accountId: '5020', type: 'debit', amount: totalSalary }); // Beban Gaji

            const journalResult = journalService.createJournalEntry(state.accounts, state.journalEntries, 'b1', 'Pembayaran Gaji Bulanan', journalLines, 'Gaji');
            
            return { ...state, ...journalResult, staff: updatedStaff };
        }
        case 'staff/addDeposit': {
            // Similar to customer deposit but for staff
            return state;
        }
        case 'staff/withdrawDeposit': {
            // Similar to customer withdrawal but for staff
            return state;
        }
        case 'staff/addRole': {
            const newRole: Role = { ...action.payload, id: generateId('role', state.roles.length), permissions: [] };
            return { ...state, roles: [...state.roles, newRole] };
        }
        case 'staff/updateRole': return { ...state, roles: state.roles.map(r => r.id === action.payload.id ? action.payload : r) };
        case 'staff/deleteRole': {
            const isUsed = state.staff.some(s => s.roleId === action.payload);
            if(isUsed) {
                alert("Tidak dapat menghapus jabatan yang masih digunakan oleh staf.");
                return state;
            }
            return { ...state, roles: state.roles.filter(r => r.id !== action.payload) };
        }
        case 'staff/updateRolePermissions': return { ...state, roles: state.roles.map(r => r.id === action.payload.roleId ? { ...r, permissions: action.payload.permissions } : r) };
        // --- INVENTORY ---
        case 'inventory/addShelf': {
            const newShelf: Shelf = { ...action.payload, id: generateId('shelf', state.shelves.length) };
            return { ...state, shelves: [...state.shelves, newShelf] };
        }
        case 'inventory/updateShelf': {
            return { ...state, shelves: state.shelves.map(s => s.id === action.payload.id ? action.payload : s) };
        }
        case 'inventory/deleteShelf': {
            return { ...state, shelves: state.shelves.filter(s => s.id !== action.payload) };
        }
        default: return state;
    }
};
import React, { useEffect } from 'react';
import { Sidebar } from './components/Sidebar';
import { Header } from './components/Header';
import { Dashboard } from './Dashboard';
import { ProductListPage, SetPricingPage } from './components/Products';
import { CustomerListPage } from './components/Customers';
import { SalesListPage, OrderFulfillmentPage, CreateManualSalePage } from './components/Sales';
import { CompanyInformationSettingsPage, DisplaySettingsPage, ReportSizesSettingsPage, BackupRestorePage } from './components/Settings';
import { Page, Theme } from './types';
import { Vendors } from './components/Vendors';
import { PurchaseListPage, AddPurchasePage } from './components/Purchases';
import { StaffListPage, StaffAttendancePage, StaffAttendanceReportPage, RoleManagementPage, PayrollPage, RecruitmentPage, TimeOffPage, JobOpeningManagementPage } from './components/Staff';
import { ChartOfAccountsPage, GeneralJournalPage, LedgerPage, CashAccountListPage, CashTransactionPage, CashTransferPage, PaymentMethodsPage, PaymentTermsPage, CashierDepositVerificationPage } from './components/Finance';
import { AssetListPage, AssetPurchasePage, AssetSalePage, AssetCategoryManagementPage } from './components/Assets';
import { SalesReport, ProductStockReport, IncomeStatementReport, FinancialPositionReportPage, CashierDepositReportPage, PurchaseReportPage, ProductPerformanceReportPage, GoodsReportPage, FinancialInventoryReportPage } from './components/Reports';
import { ManageShelvesPage, ProductCategoriesPage, InventoryAdjustmentPage, GoodsReceiptPage, StockTransferPage } from './components/Inventory';
import { PromotionsPage } from './components/Promotions';
import { Capital } from './components/Capital';
import { TaxSummaryPage, InputTaxReportPage, OutputTaxReportPage, TaxSettingsPage } from './components/Tax';
import { PrincipalListPage } from './components/Principals';
import { AccessDenied } from './components/AccessDenied';
import { POSPage } from './components/POS';
import { EcommerceStorefrontPage } from './components/Ecommerce';
import { 
    ElearningStorefrontPage, 
    CourseListPage, 
    MenteeListPage, 
    ClassManagementPage as ElearningCourseGroups, 
    AttendanceReportPage as ElearningAttendanceReport, 
    TestManagementPage as ElearningTestManagement, 
    GradingPage as ElearningGrading, 
    ElearningPeriodsPage, 
    EnrollmentsPage 
} from './components/Elearning';
import { ManufacturingOrderListPage, BillOfMaterialsPage, WorkCentersPage, ManufacturingSettingsPage } from './components/Manufacturing';
import { ProductDesignsPage, EngineeringChangeOrdersPage, ProductVersionsPage } from './components/PLM';
import { MaintenanceRequestsPage, MaintenanceSchedulePage, MaintenanceTeamsPage } from './components/Maintenance';
import { EventManagementPage, TicketSalesPage, AudienceListPage, CreateEventPage } from './components/Events';
import { CustomerPlansPage, CreatePlanPage, PlanTemplatesPage } from './components/Planning';
import { VendorBillListPage, CustomerBillListPage } from './components/Bills';
import { ReturnManagementPage } from './components/Returns';
import { ApprovalsPage } from './components/Productivity';
import { HelpdeskPage } from './components/Helpdesk';
import { PrintPriceLabelsPage } from './components/Print';
import { BrandManagementPage } from './components/Brands';
import { WebsitePage, BlogListPage, ForumListPage } from './components/Website';

import { LeadManagementPage } from './components/SalesCRM';
import { LayananPelangganPage } from './components/LayananPelanggan';
import { OpportunityManagementPage } from './components/OpportunityManagementPage';
import { ProjectsPage, ProjectTasksPage } from './components/Projects';
import { IncomingLettersPage, OutgoingLettersPage } from './components/Documents';
import { LocationManagementPage, CashierStationManagementPage, AreaManagementPage } from './components/Management';
import { EcommerceSettingsPage, ElearningPortalSettingsPage, EventPortalSettingsPage } from './components/PortalSettings';
import { CalendarPage } from './components/Calendar'; // New
import { useAppContext } from './hooks/useAppContext';
import { LoginPage } from './components/Login';
import { getPalette, gradientThemes } from './utils/colors';
import { WebsiteLandingPage } from './components/WebsiteLandingPage';
import { CustomerPortal } from './components/CustomerPortal';
import { MenteePortal } from './components/StudentPortal';
import { RoomAssetListPage, RoomOrderListPage, CreateRoomOrderPage } from './components/Room';
import { RentalAssetListPage, RentalOrderListPage, CreateRentalOrderPage } from './components/Rental';

export const App: React.FC = () => {
    const { state, dispatch } = useAppContext();
    const { theme, themeConfig, currentPage, currentUser, isPosModeActive, isLoginPageVisible, currentCustomer, currentMentee, roles } = state;
    const [isMobileSidebarOpen, setMobileSidebarOpen] = React.useState(false);

    useEffect(() => {
        const root = document.documentElement;
        if (theme === Theme.Dark) {
            root.classList.add('dark');
        } else {
            root.classList.remove('dark');
        }

        if (themeConfig.mode === 'single') {
            const palette = getPalette(themeConfig.color);
            Object.entries(palette).forEach(([shade, value]) => {
                root.style.setProperty(`--color-primary-${shade}`, value);
            });
            root.style.removeProperty('--gradient-from');
            root.style.removeProperty('--gradient-to');
        } else if (themeConfig.mode === 'gradient') {
            const gradient = gradientThemes[themeConfig.name];
            if (gradient) {
                const fromPalette = getPalette(gradient.colors[0]);
                const toPalette = getPalette(gradient.colors[1]);
                root.style.setProperty('--gradient-from', `rgb(${fromPalette['500']})`);
                root.style.setProperty('--gradient-to', `rgb(${toPalette['500']})`);

                Object.entries(fromPalette).forEach(([shade, value]) => {
                    root.style.setProperty(`--color-primary-${shade}`, value);
                });
            }
        }
    }, [theme, themeConfig]);

    const renderPage = () => {
        if (!currentUser) return <AccessDenied />;
        const userRole = roles.find(r => r.id === currentUser.roleId);
        const userPermissions = userRole?.permissions || [];

        if (!userPermissions.includes(currentPage)) {
            return <AccessDenied />;
        }

        switch (currentPage) {
            case Page.Dashboard: return <Dashboard />;
            case Page.Calendar: return <CalendarPage />;
            case Page.ProductList: return <ProductListPage />;
            case Page.SetPricing: return <SetPricingPage />;
            case Page.CustomerList: return <CustomerListPage />;
            case Page.SalesList: return <SalesListPage />;
            case Page.CreateManualSale: return <CreateManualSalePage />;
            case Page.OrderFulfillment: return <OrderFulfillmentPage />;
            case Page.CompanyInformationSettings: return <CompanyInformationSettingsPage />;
            case Page.BackupRestore: return <BackupRestorePage />;
            case Page.DisplaySettings: return <DisplaySettingsPage />;
            case Page.ReportSizesSettings: return <ReportSizesSettingsPage />;
            case Page.Vendors: return <Vendors />;
            case Page.PurchaseList: return <PurchaseListPage />;
            case Page.AddPurchase: return <AddPurchasePage />;
            case Page.StaffList: return <StaffListPage />;
            case Page.RoleManagement: return <RoleManagementPage />;
            case Page.StaffPermissions: return <RoleManagementPage />;
            case Page.StaffAttendance: return <StaffAttendancePage />;
            case Page.StaffAttendanceReport: return <StaffAttendanceReportPage />;
            case Page.ChartOfAccounts: return <ChartOfAccountsPage />;
            case Page.GeneralJournal: return <GeneralJournalPage />;
            case Page.Ledger: return <LedgerPage />;
            case Page.CashAccountList: return <CashAccountListPage />;
            case Page.CashTransaction: return <CashTransactionPage />;
            case Page.CashTransfer: return <CashTransferPage />;
            case Page.AssetList: return <AssetListPage />;
            case Page.AssetPurchase: return <AssetPurchasePage />;
            case Page.AssetSale: return <AssetSalePage />;
            case Page.AssetCategoryManagement: return <AssetCategoryManagementPage />;
            case Page.SalesReport: return <SalesReport />;
            case Page.ProductStockReport: return <ProductStockReport />;
            case Page.IncomeStatementReport: return <IncomeStatementReport />;
            case Page.FinancialPositionReport: return <FinancialPositionReportPage />;
            case Page.GoodsReport: return <GoodsReportPage />;
            case Page.FinancialInventoryReport: return <FinancialInventoryReportPage />;
            case Page.ManageShelves: return <ManageShelvesPage />;
            case Page.ProductCategories: return <ProductCategoriesPage />;
            case Page.InventoryAdjustment: return <InventoryAdjustmentPage />;
            case Page.GoodsReceipt: return <GoodsReceiptPage />;
            case Page.StockTransfer: return <StockTransferPage />;
            case Page.Promotions:
            case Page.PromotionsVoucher:
            case Page.PromotionsPoints: return <PromotionsPage />;
            case Page.Capital: return <Capital />;
            case Page.TaxSummary: return <TaxSummaryPage />;
            case Page.InputTaxReport: return <InputTaxReportPage />;
            case Page.OutputTaxReport: return <OutputTaxReportPage />;
            case Page.TaxSettings: return <TaxSettingsPage />;
            case Page.PrincipalList: return <PrincipalListPage />;
            case Page.BrandManagement: return <BrandManagementPage />;
            case Page.EcommerceStorefront: return <EcommerceStorefrontPage />;
            case Page.EcommercePortalSettings: return <EcommerceSettingsPage />;
            case Page.PaymentMethods: return <PaymentMethodsPage />;
            case Page.PaymentTerms: return <PaymentTermsPage />;
            case Page.CashierDepositVerification: return <CashierDepositVerificationPage />;
            case Page.CashierDepositReport: return <CashierDepositReportPage />;
            case Page.PurchaseReport: return <PurchaseReportPage />;
            case Page.ProductPerformanceReport: return <ProductPerformanceReportPage />;
            case Page.VendorBillList: return <VendorBillListPage />;
            case Page.CustomerBillList: return <CustomerBillListPage />;
            case Page.ReturnManagement: return <ReturnManagementPage />;
            case Page.Payroll: return <PayrollPage />;
            case Page.Helpdesk: return <HelpdeskPage />;
            case Page.PrintPriceLabels: return <PrintPriceLabelsPage />;
            case Page.LocationManagement: return <LocationManagementPage />;
            case Page.AreaManagement: return <AreaManagementPage />;
            case Page.CashierStationManagement: return <CashierStationManagementPage />;
            case Page.LayananPelanggan: return <LayananPelangganPage />;
            case Page.Approvals: return <ApprovalsPage />;
            case Page.IncomingLetters: return <IncomingLettersPage />;
            case Page.OutgoingLetters: return <OutgoingLettersPage />;
            case Page.Recruitment: return <RecruitmentPage />;
            case Page.JobOpeningManagement: return <JobOpeningManagementPage />;
            case Page.TimeOff: return <TimeOffPage />;
            case Page.LeadManagement: return <LeadManagementPage />;
            case Page.OpportunityManagement: return <OpportunityManagementPage />;
            case Page.Projects: return <ProjectsPage />;
            case Page.ProjectTasks: return <ProjectTasksPage />;
            case Page.BlogList: return <BlogListPage />;
            case Page.ForumList: return <ForumListPage />;
            case Page.Website: return <WebsitePage />;
            case Page.WebsiteSettings: return <WebsitePage />;
            case Page.ElearningStorefront: return <ElearningStorefrontPage />;
            case Page.ElearningCourseList: return <CourseListPage />;
            case Page.ElearningMenteeListPage: return <MenteeListPage />;
            case Page.ElearningCourseGroups: return <ElearningCourseGroups />;
            case Page.ElearningAttendanceReport: return <ElearningAttendanceReport />;
            case Page.ElearningTestManagement: return <ElearningTestManagement />;
            case Page.ElearningGrading: return <ElearningGrading />;
            case Page.ElearningPeriods: return <ElearningPeriodsPage />;
            case Page.Enrollments: return <EnrollmentsPage />;
            case Page.ElearningPortalSettings: return <ElearningPortalSettingsPage />;
            case Page.ManufacturingOrderList: return <ManufacturingOrderListPage />;
            case Page.BillOfMaterials: return <BillOfMaterialsPage />;
            case Page.WorkCenters: return <WorkCentersPage />;
            case Page.ManufacturingSettings: return <ManufacturingSettingsPage />;
            case Page.ProductDesigns: return <ProductDesignsPage />;
            case Page.EngineeringChangeOrders: return <EngineeringChangeOrdersPage />;
            case Page.ProductVersions: return <ProductVersionsPage />;
            case Page.MaintenanceRequests: return <MaintenanceRequestsPage />;
            case Page.MaintenanceSchedule: return <MaintenanceSchedulePage />;
            case Page.MaintenanceTeams: return <MaintenanceTeamsPage />;
            case Page.EventManagement: return <EventManagementPage />;
            case Page.CreateEvent: return <CreateEventPage />;
            case Page.TicketSales: return <TicketSalesPage />;
            case Page.AudienceList: return <AudienceListPage />;
            case Page.EventPortalSettings: return <EventPortalSettingsPage />;
            case Page.CustomerPlans: return <CustomerPlansPage />;
            case Page.CreatePlan: return <CreatePlanPage />;
            case Page.PlanTemplates: return <PlanTemplatesPage />;
            case Page.RoomAssetList: return <RoomAssetListPage />;
            case Page.RoomOrderList: return <RoomOrderListPage />;
            case Page.CreateRoomOrder: return <CreateRoomOrderPage />;
            case Page.RentalAssetList: return <RentalAssetListPage />;
            case Page.RentalOrderList: return <RentalOrderListPage />;
            case Page.CreateRentalOrder: return <CreateRentalOrderPage />;
            default: return <Dashboard />;
        }
    };

    if (isPosModeActive) {
        return <POSPage />;
    }

    if (currentCustomer) {
        return <CustomerPortal />;
    }

    if (currentMentee) {
        return <MenteePortal />;
    }
    
    if (!currentUser) {
        return <LoginPage />;
    }

    return (
        <div className={`flex h-screen bg-slate-50 dark:bg-gray-900 font-sans text-slate-800 dark:text-slate-200 relative overflow-hidden`}>
            {/* Mobile Sidebar Overlay */}
            {isMobileSidebarOpen && (
                <div 
                    className="fixed inset-0 bg-black/50 z-40 md:hidden backdrop-blur-xs transition-opacity" 
                    onClick={() => setMobileSidebarOpen(false)}
                />
            )}
            
            <div className={`
                fixed inset-y-0 left-0 z-50 md:static md:z-auto transition-transform duration-300 transform shadow-2xl md:shadow-none
                ${isMobileSidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
            `}>
                <Sidebar 
                    currentPage={currentPage} 
                    setPage={(page) => {
                        dispatch({ type: 'ui/setPage', payload: page });
                        setMobileSidebarOpen(false);
                    }} 
                    onCloseMobile={() => setMobileSidebarOpen(false)}
                />
            </div>

            <div className="flex-1 flex flex-col overflow-hidden min-w-0">
                <Header onToggleMobileSidebar={() => setMobileSidebarOpen(!isMobileSidebarOpen)} />
                <main className="flex-1 overflow-y-auto p-3 sm:p-4 md:p-6 lg:p-8">
                    {renderPage()}
                </main>
            </div>
        </div>
    );
};

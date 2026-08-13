import React from 'react';
import { Page } from '../types';
import { useAppContext } from '../hooks/useAppContext';
import { 
    LayoutDashboard, 
    ShoppingCart, 
    TrendingUp, 
    ShoppingBag, 
    Boxes, 
    Wallet, 
    UserCheck, 
    BarChart3, 
    Settings, 
    LogOut
} from 'lucide-react';

export const Sidebar: React.FC<{ currentPage: Page; setPage: (page: Page) => void; onCloseMobile?: () => void; }> = ({ currentPage, setPage, onCloseMobile }) => {
    const { state, dispatch } = useAppContext();
    const { currentUser } = state;

    const handlePosClick = () => {
        dispatch({ type: 'pos/toggleMode', payload: { start: true } });
        if (onCloseMobile) onCloseMobile();
    };

    const wrappedSetPage = (page: Page) => {
        setPage(page);
        if (onCloseMobile) onCloseMobile();
    };

    const navItems = [
        { icon: <ShoppingCart />, label: 'Point of Sales', page: Page.POS },
        { icon: <TrendingUp />, label: 'Penjualan', page: Page.SalesList },
        { icon: <ShoppingBag />, label: 'Pembelian', page: Page.PurchaseList },
        { icon: <Boxes />, label: 'Inventaris', page: Page.ProductList },
        { icon: <Wallet />, label: 'Keuangan', page: Page.ChartOfAccounts },
        { icon: <UserCheck />, label: 'Karyawan', page: Page.StaffList },
        { icon: <BarChart3 />, label: 'Laporan', page: Page.SalesReport },
        { icon: <Settings />, label: 'Pengaturan', page: Page.CompanyInformationSettings },
    ];

    // Helper to check if current module category is active
    const isModuleActive = (itemPage: Page) => {
        if (itemPage === Page.POS && currentPage === Page.POS) return true;
        if (itemPage === Page.SalesList && [Page.SalesList, Page.CustomerList, Page.Promotions, Page.PromotionsVoucher, Page.PromotionsPoints].includes(currentPage)) return true;
        if (itemPage === Page.PurchaseList && [Page.PurchaseList, Page.Vendors].includes(currentPage)) return true;
        if (itemPage === Page.ProductList && [Page.ProductList, Page.InventoryAdjustment, Page.GoodsReceipt, Page.ReturnManagement, Page.ProductCategories].includes(currentPage)) return true;
        if (itemPage === Page.ChartOfAccounts && [Page.ChartOfAccounts, Page.CashAccountList, Page.CashTransaction, Page.CashTransfer, Page.VendorBillList, Page.CustomerBillList, Page.Capital, Page.PaymentMethods, Page.PaymentTerms].includes(currentPage)) return true;
        if (itemPage === Page.StaffList && currentPage === Page.StaffList) return true;
        if (itemPage === Page.SalesReport && [Page.SalesReport, Page.PurchaseReport, Page.GoodsReport, Page.FinancialInventoryReport, Page.CashierDepositReport, Page.IncomeStatementReport, Page.FinancialPositionReport].includes(currentPage)) return true;
        if (itemPage === Page.CompanyInformationSettings && [Page.CompanyInformationSettings, Page.BackupRestore, Page.ReportSizesSettings, Page.About].includes(currentPage)) return true;
        return false;
    };

    return (
        <aside className="flex-shrink-0 h-full max-h-screen transition-all duration-200 bg-slate-900 text-white border-r border-slate-800 flex flex-col items-center w-14 overflow-hidden shadow-md">
            {/* Top Brand Grid Icon */}
            <div className="h-12 w-full flex items-center justify-center border-b border-slate-800/80 shrink-0">
                <button 
                    onClick={() => wrappedSetPage(Page.Dashboard)}
                    className="w-8 h-8 rounded-lg bg-slate-800 hover:bg-slate-700 flex items-center justify-center transition-transform active:scale-95 overflow-hidden p-1 shadow-xs"
                    title="PosNesia Dashboard"
                >
                    <img src="/pwa-icon.png" alt="PosNesia" className="w-full h-full object-contain" />
                </button>
            </div>

            {/* Vertical Module Icon Rail */}
            <nav className="flex-1 w-full overflow-y-auto no-scrollbar py-3 space-y-1.5 px-1.5">
                {navItems.map((item) => {
                    const active = isModuleActive(item.page);
                    return (
                        <button
                            key={item.label}
                            onClick={() => {
                                if (item.page === Page.POS) {
                                    handlePosClick();
                                } else {
                                    wrappedSetPage(item.page);
                                }
                            }}
                            className={`w-11 h-11 mx-auto rounded-xl flex items-center justify-center transition-all group relative ${
                                active
                                    ? 'bg-primary-600 text-white shadow-md font-bold'
                                    : 'text-slate-400 hover:bg-slate-800 hover:text-white'
                            }`}
                            title={item.label}
                        >
                            {React.cloneElement(item.icon, {
                                className: `w-5 h-5 transition-transform group-hover:scale-110 ${active ? 'text-white' : 'text-slate-400 group-hover:text-white'}`
                            })}

                            {/* Floating Tooltip label */}
                            <div className="absolute left-full top-1/2 -translate-y-1/2 ml-2 hidden group-hover:flex items-center z-50 pointer-events-none">
                                <div className="bg-slate-800 text-white text-[11px] font-bold px-2.5 py-1 rounded-lg shadow-xl whitespace-nowrap border border-slate-700">
                                    {item.label}
                                </div>
                            </div>
                        </button>
                    );
                })}
            </nav>

            {/* Bottom Logout */}
            <div className="p-2 border-t border-slate-800 shrink-0 w-full flex justify-center">
                <button
                    type="button"
                    onClick={() => dispatch({ type: 'auth/logout' })}
                    className="w-10 h-10 rounded-xl bg-slate-800/80 text-red-400 hover:bg-red-950/60 hover:text-red-300 flex items-center justify-center transition-colors"
                    title={`Keluar (${currentUser?.name})`}
                >
                    <LogOut className="w-4 h-4" />
                </button>
            </div>
        </aside>
    );
};
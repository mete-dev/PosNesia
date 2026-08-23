import React, { useState, useMemo } from 'react';
import { Page } from '../types';
import { useAppContext } from '../hooks/useAppContext';
import { 
    ShoppingCart, 
    TrendingUp, 
    ShoppingBag, 
    Boxes, 
    Wallet, 
    UserCheck, 
    BarChart3, 
    Settings, 
    LogOut,
    ChevronDown,
    ChevronRight,
    Store
} from 'lucide-react';

interface SubMenuItem {
    label: string;
    page: Page;
}

interface MenuItem {
    icon: React.ReactNode;
    label: string;
    page?: Page;
    pages?: Page[];
    subItems?: SubMenuItem[];
}

export const Sidebar: React.FC<{ currentPage: Page; setPage: (page: Page) => void; onCloseMobile?: () => void; }> = ({ currentPage, setPage, onCloseMobile }) => {
    const { state, dispatch } = useAppContext();
    const { currentUser, companyInfo } = state;

    // Single accordion open behavior (only 1 menu open at a time)
    const [openMenuLabel, setOpenMenuLabel] = useState<string | null>(() => {
        // Auto-expand module matching currentPage initially
        if ([Page.SalesList, Page.CustomerList, Page.Promotions, Page.PromotionsVoucher, Page.PromotionsPoints].includes(currentPage)) return 'Penjualan';
        if ([Page.PurchaseList, Page.Vendors].includes(currentPage)) return 'Pembelian';
        if ([Page.ProductList, Page.InventoryAdjustment, Page.GoodsReceipt, Page.ReturnManagement, Page.ProductCategories].includes(currentPage)) return 'Inventaris';
        if ([Page.ChartOfAccounts, Page.CashAccountList, Page.CashTransaction, Page.CashTransfer, Page.VendorBillList, Page.CustomerBillList, Page.Capital, Page.PaymentMethods, Page.PaymentTerms].includes(currentPage)) return 'Keuangan';
        if ([Page.SalesReport, Page.PurchaseReport, Page.GoodsReport, Page.FinancialInventoryReport, Page.CashierDepositReport, Page.IncomeStatementReport, Page.FinancialPositionReport].includes(currentPage)) return 'Laporan';
        if ([Page.CompanyInformationSettings, Page.BackupRestore, Page.ReportSizesSettings, Page.About].includes(currentPage)) return 'Pengaturan';
        return 'Penjualan';
    });

    const toggleSubMenu = (label: string) => {
        setOpenMenuLabel(prev => prev === label ? null : label);
    };

    const handlePosClick = () => {
        dispatch({ type: 'pos/toggleMode', payload: { start: true } });
        if (onCloseMobile) onCloseMobile();
    };

    const wrappedSetPage = (page: Page) => {
        setPage(page);
        if (onCloseMobile) onCloseMobile();
    };

    const menuItems: MenuItem[] = [
        {
            icon: <ShoppingCart className="w-4 h-4" />,
            label: 'Point of Sales',
            page: Page.POS
        },
        {
            icon: <TrendingUp className="w-4 h-4" />,
            label: 'Penjualan',
            pages: [Page.SalesList, Page.CustomerList, Page.Promotions, Page.PromotionsVoucher, Page.PromotionsPoints],
            subItems: [
                { label: 'Penjualan', page: Page.SalesList },
                { label: 'Data Pelanggan', page: Page.CustomerList },
                { label: 'Promosi', page: Page.Promotions },
            ]
        },
        {
            icon: <ShoppingBag className="w-4 h-4" />,
            label: 'Pembelian',
            pages: [Page.PurchaseList, Page.Vendors],
            subItems: [
                { label: 'Pembelian', page: Page.PurchaseList },
                { label: 'Vendor', page: Page.Vendors },
            ]
        },
        {
            icon: <Boxes className="w-4 h-4" />,
            label: 'Inventaris',
            pages: [Page.ProductList, Page.InventoryAdjustment, Page.ReturnManagement, Page.ManageShelves, Page.ProductCategories],
            subItems: [
                { label: 'Data Produk', page: Page.ProductList },
                { label: 'Kategori Produk', page: Page.ProductCategories },
                { label: 'Penyesuaian Stok', page: Page.InventoryAdjustment },
                { label: 'Manajemen Retur', page: Page.ReturnManagement },
                { label: 'Kelola Rak', page: Page.ManageShelves },
            ]
        },
        {
            icon: <Wallet className="w-4 h-4" />,
            label: 'Keuangan',
            pages: [Page.ChartOfAccounts, Page.CashAccountList, Page.AccountStatement, Page.Capital, Page.PaymentMethods, Page.PaymentTerms],
            subItems: [
                { label: 'Dompet & Kas', page: Page.CashAccountList },
                { label: 'Bagan Akun', page: Page.ChartOfAccounts },
                { label: 'Metode Bayar', page: Page.PaymentMethods },
            ]
        },
        {
            icon: <UserCheck className="w-4 h-4" />,
            label: 'Karyawan',
            page: Page.StaffList
        },
        {
            icon: <BarChart3 className="w-4 h-4" />,
            label: 'Laporan',
            pages: [Page.SalesReport, Page.GoodsReport, Page.FinancialInventoryReport, Page.CashierDepositReport, Page.IncomeStatementReport, Page.FinancialPositionReport],
            subItems: [
                { label: 'Laporan Penjualan', page: Page.SalesReport },
                { label: 'Setoran Kasir', page: Page.CashierDepositReport },
                { label: 'Laporan Laba Rugi', page: Page.IncomeStatementReport },
                { label: 'Posisi Keuangan', page: Page.FinancialPositionReport },
            ]
        },
        {
            icon: <Settings className="w-4 h-4" />,
            label: 'Pengaturan',
            pages: [Page.CompanyInformationSettings, Page.BackupRestore, Page.ReportSizesSettings, Page.About],
            subItems: [
                { label: 'Informasi Perusahaan', page: Page.CompanyInformationSettings },
                { label: 'Database', page: Page.BackupRestore },
                { label: 'Printer', page: Page.ReportSizesSettings },
                { label: 'Tentang', page: Page.About },
            ]
        },
    ];

    return (
        <aside className="w-56 flex-shrink-0 h-full max-h-screen bg-white dark:bg-zinc-900 border-r border-slate-200/80 dark:border-zinc-800 flex flex-col shadow-2xs z-20">
            {/* BRAND HEADER */}
            <div className="h-14 px-3.5 border-b border-slate-100 dark:border-zinc-800/80 flex items-center justify-between shrink-0">
                <div 
                    onClick={() => wrappedSetPage(Page.Dashboard)}
                    className="flex items-center gap-2 cursor-pointer hover:opacity-85 transition-opacity truncate"
                    title="PosNesia Dashboard"
                >
                    <img 
                        src="/logoposnesia.png" 
                        alt={companyInfo.name || 'PosNesia'} 
                        className="h-7 max-w-[150px] object-contain" 
                        onError={(e) => {
                            e.currentTarget.style.display = 'none';
                        }}
                    />
                </div>
            </div>

            {/* NAVIGATION MENU LIST */}
            <nav className="flex-1 overflow-y-auto p-2.5 space-y-1 text-xs no-scrollbar">
                {menuItems.map((item) => {
                    const hasSub = item.subItems && item.subItems.length > 0;
                    const isParentActive = item.pages ? item.pages.includes(currentPage) : currentPage === item.page;
                    const isOpen = openMenuLabel === item.label;

                    if (!hasSub) {
                        return (
                            <button
                                key={item.label}
                                onClick={() => {
                                    if (item.page === Page.POS) {
                                        handlePosClick();
                                    } else if (item.page) {
                                        wrappedSetPage(item.page);
                                    }
                                }}
                                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                                    isParentActive
                                        ? 'bg-blue-600 text-white shadow-2xs'
                                        : 'text-slate-700 dark:text-zinc-300 hover:bg-slate-100 dark:hover:bg-zinc-800/80'
                                }`}
                            >
                                <span className="shrink-0">{item.icon}</span>
                                <span className="truncate text-[13px]">{item.label}</span>
                            </button>
                        );
                    }

                    return (
                        <div key={item.label} className="space-y-1">
                            {/* Parent Header */}
                            <button
                                type="button"
                                onClick={() => toggleSubMenu(item.label)}
                                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                                    isParentActive
                                        ? 'text-blue-600 dark:text-blue-400 bg-blue-50/60 dark:bg-blue-950/30'
                                        : 'text-slate-700 dark:text-zinc-300 hover:bg-slate-100 dark:hover:bg-zinc-800/80'
                                }`}
                            >
                                <div className="flex items-center gap-3 truncate">
                                    <span className="shrink-0">{item.icon}</span>
                                    <span className="truncate text-[13px]">{item.label}</span>
                                </div>
                                <span className="shrink-0 text-slate-400">
                                    {isOpen ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
                                </span>
                            </button>

                            {/* Submenu Children Items */}
                            {isOpen && (
                                <div className="pl-8 pr-1 space-y-0.5 py-0.5">
                                    {item.subItems!.map((sub) => {
                                        const isChildActive = currentPage === sub.page;
                                        return (
                                            <button
                                                key={sub.label}
                                                onClick={() => wrappedSetPage(sub.page)}
                                                className={`w-full text-left px-3 py-2 rounded-md font-semibold transition-all cursor-pointer text-xs block truncate ${
                                                    isChildActive
                                                        ? 'bg-blue-600 text-white shadow-2xs font-bold'
                                                        : 'text-slate-600 dark:text-zinc-400 hover:bg-slate-100 dark:hover:bg-zinc-800/60 hover:text-slate-900 dark:hover:text-white'
                                                }`}
                                            >
                                                {sub.label}
                                            </button>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    );
                })}
            </nav>

            {/* USER PROFILE FOOTER */}
            <div className="p-2.5 border-t border-slate-100 dark:border-zinc-800 shrink-0 bg-slate-50/50 dark:bg-zinc-900/50">
                <div className="flex items-center justify-between gap-2 p-2 rounded-lg bg-white dark:bg-zinc-800 border border-slate-200/80 dark:border-zinc-700/80 shadow-2xs">
                    <div className="flex items-center gap-2.5 min-w-0">
                        <div className="w-7 h-7 rounded-md bg-blue-600 text-white flex items-center justify-center font-black text-xs shrink-0 shadow-2xs">
                            {currentUser?.name?.charAt(0).toUpperCase() || 'U'}
                        </div>
                        <div className="truncate">
                            <p className="text-xs font-black text-slate-900 dark:text-white leading-tight truncate">
                                {currentUser?.name || 'User'}
                            </p>
                            <p className="text-[10px] text-slate-400 dark:text-zinc-400 capitalize truncate">
                                Admin
                            </p>
                        </div>
                    </div>

                    <button
                        type="button"
                        onClick={() => dispatch({ type: 'auth/logout' })}
                        className="p-1.5 rounded-md text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40 transition-colors shrink-0 cursor-pointer"
                        title="Keluar"
                    >
                        <LogOut className="w-4 h-4" />
                    </button>
                </div>
            </div>
        </aside>
    );
};
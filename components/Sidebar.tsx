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

    // Track open submenus. By default, auto-expand module matching currentPage.
    const [openMenus, setOpenMenus] = useState<Record<string, boolean>>({
        'Penjualan': true,
        'Pembelian': true,
        'Inventaris': true,
        'Keuangan': true,
        'Laporan': true,
        'Pengaturan': true,
    });

    const toggleSubMenu = (label: string) => {
        setOpenMenus(prev => ({ ...prev, [label]: !prev[label] }));
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
                { label: 'Pesanan Pembelian', page: Page.PurchaseList },
                { label: 'Vendor', page: Page.Vendors },
            ]
        },
        {
            icon: <Boxes className="w-4 h-4" />,
            label: 'Inventaris',
            pages: [Page.ProductList, Page.InventoryAdjustment, Page.GoodsReceipt, Page.ReturnManagement, Page.ProductCategories],
            subItems: [
                { label: 'Data Produk', page: Page.ProductList },
                { label: 'Kategori Produk', page: Page.ProductCategories },
                { label: 'Penyesuaian Stok', page: Page.InventoryAdjustment },
                { label: 'Penerimaan Barang', page: Page.GoodsReceipt },
                { label: 'Manajemen Retur', page: Page.ReturnManagement },
            ]
        },
        {
            icon: <Wallet className="w-4 h-4" />,
            label: 'Keuangan',
            pages: [Page.ChartOfAccounts, Page.CashAccountList, Page.CashTransaction, Page.CashTransfer, Page.VendorBillList, Page.CustomerBillList, Page.Capital, Page.PaymentMethods, Page.PaymentTerms],
            subItems: [
                { label: 'Dompet & Kas', page: Page.CashAccountList },
                { label: 'Tagihan Vendor', page: Page.VendorBillList },
                { label: 'Tagihan Pelanggan', page: Page.CustomerBillList },
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
            pages: [Page.SalesReport, Page.PurchaseReport, Page.GoodsReport, Page.FinancialInventoryReport, Page.CashierDepositReport, Page.IncomeStatementReport, Page.FinancialPositionReport],
            subItems: [
                { label: 'Laporan Penjualan', page: Page.SalesReport },
                { label: 'Laporan Pembelian', page: Page.PurchaseReport },
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
        <aside className="w-52 flex-shrink-0 h-full max-h-screen bg-white dark:bg-zinc-900 border-r border-slate-200/80 dark:border-zinc-800 flex flex-col shadow-2xs z-20">
            {/* BRAND HEADER */}
            <div className="h-14 px-3 border-b border-slate-100 dark:border-zinc-800/80 flex items-center justify-between shrink-0">
                <div 
                    onClick={() => wrappedSetPage(Page.Dashboard)}
                    className="flex items-center gap-2 cursor-pointer hover:opacity-85 transition-opacity truncate"
                    title="PosNesia Dashboard"
                >
                    <img 
                        src="/logoposnesia.png" 
                        alt={companyInfo.name || 'PosNesia'} 
                        className="h-7 max-w-[140px] object-contain" 
                        onError={(e) => {
                            e.currentTarget.style.display = 'none';
                        }}
                    />
                </div>
            </div>

            {/* NAVIGATION MENU LIST */}
            <nav className="flex-1 overflow-y-auto p-2 space-y-0.5 text-xs no-scrollbar">
                {menuItems.map((item) => {
                    const hasSub = item.subItems && item.subItems.length > 0;
                    const isParentActive = item.pages ? item.pages.includes(currentPage) : currentPage === item.page;
                    const isOpen = openMenus[item.label] ?? isParentActive;

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
                                className={`w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-[11px] font-bold transition-all cursor-pointer ${
                                    isParentActive
                                        ? 'bg-blue-600 text-white shadow-2xs'
                                        : 'text-slate-700 dark:text-zinc-300 hover:bg-slate-100 dark:hover:bg-zinc-800/80'
                                }`}
                            >
                                <span className="shrink-0">{item.icon}</span>
                                <span className="truncate">{item.label}</span>
                            </button>
                        );
                    }

                    return (
                        <div key={item.label} className="space-y-0.5">
                            {/* Parent Header */}
                            <button
                                type="button"
                                onClick={() => toggleSubMenu(item.label)}
                                className={`w-full flex items-center justify-between px-2.5 py-2 rounded-lg text-[11px] font-bold transition-all cursor-pointer ${
                                    isParentActive
                                        ? 'text-blue-600 dark:text-blue-400 bg-blue-50/60 dark:bg-blue-950/30'
                                        : 'text-slate-700 dark:text-zinc-300 hover:bg-slate-100 dark:hover:bg-zinc-800/80'
                                }`}
                            >
                                <div className="flex items-center gap-2.5 truncate">
                                    <span className="shrink-0">{item.icon}</span>
                                    <span className="truncate">{item.label}</span>
                                </div>
                                <span className="shrink-0 text-slate-400">
                                    {isOpen ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
                                </span>
                            </button>

                            {/* Submenu Children Items */}
                            {isOpen && (
                                <div className="pl-7 pr-1 space-y-0.5 py-0.5">
                                    {item.subItems!.map((sub) => {
                                        const isChildActive = currentPage === sub.page;
                                        return (
                                            <button
                                                key={sub.label}
                                                onClick={() => wrappedSetPage(sub.page)}
                                                className={`w-full text-left px-2.5 py-1.5 rounded-md font-semibold transition-all cursor-pointer text-[10.5px] block truncate ${
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
            <div className="p-2 border-t border-slate-100 dark:border-zinc-800 shrink-0 bg-slate-50/50 dark:bg-zinc-900/50">
                <div className="flex items-center justify-between gap-1.5 p-1.5 rounded-lg bg-white dark:bg-zinc-800 border border-slate-200/80 dark:border-zinc-700/80 shadow-2xs">
                    <div className="flex items-center gap-2 min-w-0">
                        <div className="w-6 h-6 rounded-md bg-blue-600 text-white flex items-center justify-center font-black text-[10px] shrink-0 shadow-2xs">
                            {currentUser?.name?.charAt(0).toUpperCase() || 'U'}
                        </div>
                        <div className="truncate">
                            <p className="text-[11px] font-black text-slate-900 dark:text-white leading-tight truncate">
                                {currentUser?.name || 'User'}
                            </p>
                            <p className="text-[9px] text-slate-400 dark:text-zinc-400 capitalize truncate">
                                Admin
                            </p>
                        </div>
                    </div>

                    <button
                        type="button"
                        onClick={() => dispatch({ type: 'auth/logout' })}
                        className="p-1 rounded-md text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40 transition-colors shrink-0 cursor-pointer"
                        title="Keluar"
                    >
                        <LogOut className="w-3.5 h-3.5" />
                    </button>
                </div>
            </div>
        </aside>
    );
};
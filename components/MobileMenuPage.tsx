import React from 'react';
import { Page } from '../types';
import { useAppContext } from '../hooks/useAppContext';

interface SubItem {
    label: string;
    page?: Page;
    icon: React.ReactNode;
    isPOS?: boolean;
    subItems?: SubItem[];
}

interface MenuCategory {
    label: string;
    color: string;
    icon: React.ReactNode;
    subItems: SubItem[];
}

interface Props {
    category: string;
    onBack: () => void;
}

// Icon helpers — plain SVG to avoid lucide import size concerns
const Ico = ({ d, d2 }: { d: string; d2?: string }) => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={d} />
        {d2 && <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={d2} />}
    </svg>
);

export const MOBILE_MENU_CATEGORIES: MenuCategory[] = [
    {
        label: 'Point of Sales',
        color: 'from-emerald-500 to-teal-600',
        icon: <Ico d="M9 7H6a2 2 0 00-2 2v9a2 2 0 002 2h9a2 2 0 002-2v-3m-7-4l4 4m0 0l7-7m-7 7V3" />,
        subItems: [
            { label: 'Buka Kasir', isPOS: true, icon: <Ico d="M9 7H6a2 2 0 00-2 2v9a2 2 0 002 2h9a2 2 0 002-2v-3m-7-4l4 4m0 0l7-7m-7 7V3" /> },
            { label: 'Produk', page: Page.ProductList, icon: <Ico d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" /> },
            { label: 'Setoran Kasir', page: Page.CashierDepositReport, icon: <Ico d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" /> },
        ],
    },
    {
        label: 'Sales & Pelanggan',
        color: 'from-blue-500 to-indigo-600',
        icon: <Ico d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />,
        subItems: [
            { label: 'Penjualan', page: Page.SalesList, icon: <Ico d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /> },
            { label: 'Data Pelanggan', page: Page.CustomerList, icon: <Ico d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" /> },
            { label: 'Data Produk', page: Page.ProductList, icon: <Ico d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" /> },
            { label: 'Promosi', page: Page.Promotions, icon: <Ico d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z" /> },
        ],
    },
    {
        label: 'Purchase',
        color: 'from-orange-500 to-amber-600',
        icon: <Ico d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />,
        subItems: [
            { label: 'Pesanan Pembelian', page: Page.PurchaseList, icon: <Ico d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /> },
            { label: 'Vendor', page: Page.Vendors, icon: <Ico d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /> },
            { label: 'Data Produk', page: Page.ProductList, icon: <Ico d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" /> },
        ],
    },
    {
        label: 'Inventory',
        color: 'from-purple-500 to-violet-600',
        icon: <Ico d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />,
        subItems: [
            { label: 'Data Produk', page: Page.ProductList, icon: <Ico d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" /> },
            { label: 'Penyesuaian Stok', page: Page.InventoryAdjustment, icon: <Ico d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" /> },
            { label: 'Penerimaan Barang', page: Page.GoodsReceipt, icon: <Ico d="M5 13l4 4L19 7" /> },
            { label: 'Manajemen Retur', page: Page.ReturnManagement, icon: <Ico d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" /> },
            { label: 'Kategori Produk', page: Page.ProductCategories, icon: <Ico d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" /> },
        ],
    },
    {
        label: 'Keuangan',
        color: 'from-teal-500 to-cyan-600',
        icon: <Ico d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />,
        subItems: [
            { label: 'Bagan Akun', page: Page.ChartOfAccounts, icon: <Ico d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" /> },
            { label: 'Daftar Rekening', page: Page.CashAccountList, icon: <Ico d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" /> },
            { label: 'Transaksi', page: Page.CashTransaction, icon: <Ico d="M7 16V4m0 0L3 8m4-4l4 4M17 8v12m0 0l4-4m-4 4l-4-4" /> },
            { label: 'Transfer', page: Page.CashTransfer, icon: <Ico d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" /> },
            { label: 'Modal', page: Page.Capital, icon: <Ico d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /> },
            { label: 'Metode Bayar', page: Page.PaymentMethods, icon: <Ico d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" /> },
        ],
    },
    {
        label: 'Karyawan',
        color: 'from-pink-500 to-rose-600',
        icon: <Ico d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />,
        subItems: [
            { label: 'Data Karyawan', page: Page.StaffList, icon: <Ico d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" /> },
            { label: 'Absensi', page: Page.StaffAttendance, icon: <Ico d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" /> },
            { label: 'Laporan Absensi', page: Page.StaffAttendanceReport, icon: <Ico d="M16 8v8m-4-5v5m-4-2v2m-2 4h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /> },
            { label: 'Manajemen Role', page: Page.RoleManagement, icon: <Ico d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /> },
        ],
    },
    {
        label: 'Laporan',
        color: 'from-indigo-500 to-blue-600',
        icon: <Ico d="M16 8v8m-4-5v5m-4-2v2m-2 4h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />,
        subItems: [
            { label: 'Penjualan', page: Page.SalesReport, icon: <Ico d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /> },
            { label: 'Laporan Barang', page: Page.GoodsReport, icon: <Ico d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" /> },
            { label: 'Keuangan Inventaris', page: Page.FinancialInventoryReport, icon: <Ico d="M16 8v8m-4-5v5m-4-2v2m-2 4h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /> },
            { label: 'Setoran Kasir', page: Page.CashierDepositReport, icon: <Ico d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" /> },
            { label: 'Laba Rugi', page: Page.IncomeStatementReport, icon: <Ico d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" /> },
            { label: 'Posisi Keuangan', page: Page.FinancialPositionReport, icon: <Ico d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" /> },
        ],
    },
    {
        label: 'Pengaturan',
        color: 'from-zinc-600 to-slate-700',
        icon: <Ico d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" d2="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />,
        subItems: [
            { label: 'Informasi Perusahaan', page: Page.CompanyInformationSettings, icon: <Ico d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /> },
            { label: 'Database', page: Page.BackupRestore, icon: <Ico d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4m0 5c0 2.21-3.582 4-8 4s-8-1.79-8-4" /> },
            { label: 'Printer', page: Page.ReportSizesSettings, icon: <Ico d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" /> },
            { label: 'Tentang', page: Page.About, icon: <Ico d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /> },
        ],
    },
];

export const MobileMenuPage: React.FC<Props> = ({ category, onBack }) => {
    const { dispatch } = useAppContext();
    const cat = MOBILE_MENU_CATEGORIES.find(c => c.label === category);

    if (!cat) return null;

    const navigate = (item: SubItem) => {
        dispatch({ type: 'ui/setMobileMenu', payload: null });
        if (item.isPOS) {
            dispatch({ type: 'pos/toggleMode', payload: { start: true } });
        } else if (item.page !== undefined) {
            dispatch({ type: 'ui/setPage', payload: item.page });
        }
    };

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-gray-950 pb-24">
            {/* Header */}
            <div className={`bg-gradient-to-r ${cat.color} text-white px-4 pt-12 pb-8 relative overflow-hidden`}>
                <div className="absolute inset-0 opacity-10"
                    style={{ backgroundImage: 'radial-gradient(circle at 80% 20%, white 1px, transparent 1px)', backgroundSize: '24px 24px' }} />
                <button
                    onClick={() => {
                        dispatch({ type: 'ui/setMobileMenu', payload: null });
                        onBack();
                    }}
                    type="button"
                    className="flex items-center gap-2 text-white bg-white/10 hover:bg-white/20 active:scale-95 px-3 py-1.5 rounded-xl text-sm font-semibold mb-4 transition-all border border-white/20 cursor-pointer z-20 relative"
                >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" />
                    </svg>
                    Kembali
                </button>
                <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center shadow-lg">
                        {cat.icon}
                    </div>
                    <div>
                        <h1 className="text-2xl font-black">{cat.label}</h1>
                        <p className="text-white/70 text-sm">{cat.subItems.length} menu tersedia</p>
                    </div>
                </div>
            </div>

            {/* Sub-items grid */}
            <div className="px-4 py-6 space-y-3">
                {cat.subItems.map((item) => (
                    <button
                        key={item.label}
                        onClick={() => navigate(item)}
                        className="w-full flex items-center gap-4 bg-white dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800 rounded-2xl px-4 py-4 text-left hover:shadow-md active:scale-[0.98] transition-all group"
                    >
                        <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${cat.color} text-white flex items-center justify-center shadow-md flex-shrink-0 group-hover:scale-110 transition-transform`}>
                            {item.icon}
                        </div>
                        <div className="flex-1">
                            <p className="text-sm font-bold text-zinc-800 dark:text-zinc-100">{item.label}</p>
                        </div>
                        <svg className="w-4 h-4 text-zinc-400 group-hover:text-zinc-600 transition-colors flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                    </button>
                ))}
            </div>
        </div>
    );
};

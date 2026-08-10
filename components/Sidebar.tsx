import React, { useState, useMemo, useEffect } from 'react';
import { Page, CashierStation } from '../types';
import {
    DashboardIcon, ProductListIcon, SetPricingIcon, CustomerListIcon, SalesIcon, SettingsIcon, StoreIcon,
    VendorIcon, PurchaseListIcon, AddPurchaseIcon, StaffIcon, FinanceIcon, AssetIcon, ReportIcon,
    InventoryAdjustmentIcon, PromotionIcon, CapitalIcon, ChevronDownIcon, FinancialPositionIcon,
    IncomeStatementIcon, ProductStockIcon, AssetListIcon, AssetPurchaseIcon, AssetSaleIcon,
    ChartOfAccountsIcon, LedgerIcon, JournalEntryIcon, CashAccountListIcon, CashTransactionIcon, CashTransferIcon,
    TaxIcon, ShelfIcon, CategoryIcon, BarcodeIcon, PrincipalIcon, POSIcon, EcommerceIcon, LogoutIcon, PrinterIcon, ClipboardCheckIcon, ShieldCheckIcon,
    CollapseIcon, ExpandIcon, ColorPaletteIcon, ChatIcon, TicketIcon, StarIcon,
    CrmIcon, ServiceIcon, HelpdeskIcon, ProjectIcon, RecruitmentIcon, TimeOffIcon, ProductivityIcon, ApprovalsIcon,
    WebsiteIcon, ElearningIcon, ManufacturingIcon, PlmIcon, MaintenanceIcon, EventIcon, PlanningIcon,
    CompanyIcon, BillIcon, TagIcon, BookOpenIcon, ArrowLeftIcon, UserCircleIcon, ArrowDownTrayIcon, ArrowUpTrayIcon, DocumentTextIcon,
    CubeTransparentIcon, HomeModernIcon, CalendarDaysIcon, DepositIcon, NewspaperIcon, RentalIcon, GlobeAltIcon
} from './icons';
import { useAppContext } from '../hooks/useAppContext';

const PosStartSessionModal: React.FC<{
    isOpen: boolean;
    onCancel: () => void;
    onConfirm: (startCash: number) => void;
}> = ({ isOpen, onCancel, onConfirm }) => {
    const [startCash, setStartCash] = useState('0');

    useEffect(() => {
        if (isOpen) {
            setStartCash('0');
        }
    }, [isOpen]);

    if (!isOpen) return null;
    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center z-50 p-4">
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl p-6 w-full max-w-sm text-center border border-gray-100 dark:border-gray-700 animate-in fade-in zoom-in-95 duration-200">
                <div className="w-12 h-12 bg-primary-100 dark:bg-primary-500/20 text-primary-600 dark:text-primary-400 rounded-full flex items-center justify-center mx-auto mb-4">
                    <POSIcon className="w-6 h-6" />
                </div>
                <h2 className="text-xl font-bold mb-1 text-gray-900 dark:text-white">Buka Kasir POS</h2>
                <p className="text-gray-500 dark:text-gray-400 text-xs mb-5">
                    Tentukan modal awal uang tunai di laci kasir untuk mulai melayani transaksi.
                </p>
                <div className="mb-5 text-left">
                     <label className="block text-xs font-semibold uppercase tracking-wider text-gray-600 dark:text-gray-400 mb-1.5">Modal Awal Kasir (Rp)</label>
                     <div className="relative">
                         <span className="absolute left-3.5 top-3 text-gray-400 font-bold">Rp</span>
                         <input
                            type="number"
                            value={startCash}
                            onChange={e => setStartCash(e.target.value)}
                            placeholder="0"
                            className="w-full pl-10 pr-3 py-2.5 rounded-xl bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 font-bold text-lg text-gray-900 dark:text-white"
                            required
                         />
                     </div>
                     <div className="grid grid-cols-4 gap-1.5 mt-2.5">
                         {[0, 200000, 500000, 1000000].map(amt => (
                             <button
                                 key={amt}
                                 type="button"
                                 onClick={() => setStartCash(amt.toString())}
                                 className="py-1.5 text-xs font-semibold bg-gray-100 dark:bg-gray-700 hover:bg-primary-50 dark:hover:bg-primary-900/40 text-gray-700 dark:text-gray-300 rounded-lg border border-gray-200 dark:border-gray-600 transition-colors"
                             >
                                 {amt === 0 ? 'Rp0' : `${amt / 1000}rb`}
                             </button>
                         ))}
                     </div>
                </div>
                <div className="flex space-x-2.5">
                    <button onClick={onCancel} className="flex-1 py-2.5 rounded-xl text-gray-700 bg-gray-100 dark:text-gray-200 dark:bg-gray-700 font-semibold hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors text-sm">
                        Batal
                    </button>
                    <button
                        onClick={() => onConfirm(Number(startCash) || 0)}
                        className="flex-1 py-2.5 rounded-xl text-white bg-primary-600 hover:bg-primary-700 font-semibold shadow-lg shadow-primary-500/25 transition-all text-sm"
                    >
                        Mulai Kasir
                    </button>
                </div>
            </div>
        </div>
    );
};


const NavItem: React.FC<{
  icon: React.ReactElement;
  label: string;
  isActive: boolean;
  onClick: () => void;
  isCollapsed: boolean;
  indentationLevel?: number;
}> = ({ icon, label, isActive, onClick, isCollapsed, indentationLevel = 0 }) => {
    const paddingLeft = 12 + (indentationLevel * 16);
    return (
        <li>
            <a
                href="#"
                onClick={(e) => {
                    e.preventDefault();
                    onClick();
                }}
                className={`flex items-center p-2 rounded-md text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-gray-700 group ${isActive ? 'bg-primary-100 dark:bg-primary-500/10 text-primary-600 dark:text-primary-400 font-semibold' : 'font-normal'} ${isCollapsed ? 'justify-center' : ''}`}
                style={{ paddingLeft: isCollapsed ? undefined : `${paddingLeft}px` }}
                title={isCollapsed ? label : ''}
            >
                {React.cloneElement<{ className?: string }>(icon, { className: `w-5 h-5 transition duration-75 shrink-0 ${isActive ? 'text-primary-600 dark:text-primary-400' : 'text-gray-400 dark:text-gray-500 group-hover:text-slate-800 dark:group-hover:text-slate-200'}` })}
                {!isCollapsed && <span className="ms-3 flex-1 whitespace-nowrap">{label}</span>}
            </a>
        </li>
    );
};

const isPageInSubItems = (subItems: any[], page: Page): boolean => {
    return subItems.some(item => {
        if (item.isDropdown) {
            return isPageInSubItems(item.subItems, page);
        }
        return item.page === page;
    });
};

const DropdownNavItem: React.FC<{
    icon: React.ReactElement;
    label: string;
    subItems?: any[];
    currentPage: Page;
    setPage: (page: Page) => void;
    userPermissions: Page[];
    isCollapsed: boolean;
    handlePosClick: () => void;
    indentationLevel?: number;
    openDropdowns: Record<string, boolean>;
    toggleDropdown: (label: string) => void;
    openFlyouts: Record<string, boolean>;
    toggleFlyout: (label: string) => void;
}> = ({ icon, label, subItems, currentPage, setPage, userPermissions, isCollapsed, handlePosClick, indentationLevel = 0, openDropdowns, toggleDropdown, openFlyouts, toggleFlyout }) => {
    const { state } = useAppContext();
    const { posSession } = state;
    
    const processedSubItems = useMemo(() => {
        if (!subItems) return [];
        if (label === 'Point of Sale') {
            return subItems.map(item => {
                if (item && item.page === Page.POS) {
                    return { ...item, label: posSession ? 'Lanjutkan Sesi' : 'Buka Kasir' };
                }
                return item;
            });
        }
        return subItems;
    }, [subItems, label, posSession]);

    let visibleSubItems = processedSubItems.filter(item => {
        if (!item) return false;
        if (item.isDropdown) {
             return item.subItems.some((sub: any) => userPermissions.includes(sub.page));
        }
        if (!userPermissions.includes(item.page)) return false;

        if (label === 'Pajak' || (item.label && item.label === 'Pajak')) {
            if (item.page === Page.TaxSettings) return true;
            return state.isTaxEnabled;
        }
        return true;
    });

    const isParentActive = isPageInSubItems(visibleSubItems, currentPage);

    if (visibleSubItems.length === 0) {
        return null;
    }
    
    const isOpen = openDropdowns[label] || false;
    const paddingLeft = 12 + (indentationLevel * 16);
    const isFlyoutOpen = openFlyouts[label] || false;

    if (isCollapsed) {
        return (
            <li className="relative">
                <button
                    type="button"
                    onClick={() => toggleFlyout(label)}
                    className={`flex items-center justify-center w-full p-3 rounded-lg text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-gray-700 group ${isParentActive ? 'bg-primary-100 dark:bg-gray-700' : ''}`}
                    title={label}
                >
                    {React.cloneElement<{ className?: string }>(icon, { className: `w-5 h-5 transition duration-75 text-gray-400 dark:text-gray-500 group-hover:text-slate-800 dark:group-hover:text-slate-200 ${isParentActive ? 'text-primary-600 dark:text-primary-400' : ''}` })}
                </button>
                {isFlyoutOpen && (
                    <div className="absolute left-full top-0 ml-2 z-20 w-56 bg-white dark:bg-gray-800 rounded-lg shadow-lg border dark:border-gray-700">
                        <div className="p-2 space-y-1">
                            <p className="px-2 py-1 text-sm font-semibold text-gray-500 dark:text-gray-400">{label}</p>
                            <ul>
                                {visibleSubItems.map((item) => (
                                    <li key={item.label}>
                                        <a
                                            href="#"
                                            onClick={(e) => {
                                                e.preventDefault();
                                                if (item.page === Page.POS) {
                                                  handlePosClick();
                                                } else {
                                                  setPage(item.page);
                                                }
                                                toggleFlyout(label);
                                            }}
                                            className={`flex items-center p-2 rounded-md text-sm ${currentPage === item.page ? 'font-semibold text-primary-600 dark:text-primary-400' : 'font-normal text-slate-700 dark:text-slate-300'} hover:bg-slate-100 dark:hover:bg-gray-700`}
                                        >
                                            {item.label}
                                        </a>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    </div>
                )}
            </li>
        )
    }

    return (
        <li>
            <button
                type="button"
                onClick={() => toggleDropdown(label)}
                className={`flex items-center w-full p-2 text-base text-gray-900 transition duration-75 rounded-lg group hover:bg-gray-100 dark:text-white dark:hover:bg-gray-700`}
                style={{ paddingLeft: `${paddingLeft}px` }}
            >
                {React.cloneElement<{ className?: string }>(icon, { className: `w-5 h-5 transition duration-75 shrink-0 text-gray-400 dark:text-gray-500 group-hover:text-slate-800 dark:group-hover:text-slate-200 ${isParentActive ? 'text-primary-600 dark:text-primary-400' : ''}` })}
                <span className="flex-1 ms-3 text-left rtl:text-right whitespace-nowrap text-slate-700 dark:text-slate-300">{label}</span>
                <ChevronDownIcon className={`w-5 h-5 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
            </button>
            {isOpen && (
                <ul className="py-2 space-y-2">
                    {visibleSubItems.map((item) => {
                        if (item.isDropdown) {
                            return <DropdownNavItem key={item.label} {...item} currentPage={currentPage} setPage={setPage} userPermissions={userPermissions} isCollapsed={isCollapsed} handlePosClick={handlePosClick} indentationLevel={indentationLevel + 1} openDropdowns={openDropdowns} toggleDropdown={toggleDropdown} openFlyouts={openFlyouts} toggleFlyout={toggleFlyout} />;
                        }
                        return <NavItem key={item.label} {...item} isActive={currentPage === item.page} onClick={() => item.page === Page.POS ? handlePosClick() : setPage(item.page)} isCollapsed={isCollapsed} indentationLevel={indentationLevel + 1} />;
                    })}
                </ul>
            )}
        </li>
    );
};


export const Sidebar: React.FC<{ currentPage: Page; setPage: (page: Page) => void; onCloseMobile?: () => void; }> = ({ currentPage, setPage, onCloseMobile }) => {
    const { state, dispatch } = useAppContext();
    const { companyInfo, currentUser, roles, isSidebarCollapsed, cashierStations, posSession } = state;
    const [openDropdowns, setOpenDropdowns] = useState<Record<string, boolean>>({});
    const [openFlyouts, setOpenFlyouts] = useState<Record<string, boolean>>({});

    const userRole = roles.find(r => r.id === currentUser?.roleId);
    const userPermissions = userRole?.permissions || [];
    const availableCashierStations = cashierStations.filter(cs => cs.branchId === currentUser?.branchId);
    
    const handlePosClick = () => {
        dispatch({ type: 'pos/toggleMode', payload: { start: true } });
        if (onCloseMobile) onCloseMobile();
    };

    const wrappedSetPage = (page: Page) => {
        setPage(page);
        if (onCloseMobile) onCloseMobile();
    };

    const toggleDropdown = (label: string) => {
        setOpenDropdowns(prev => ({ ...prev, [label]: !prev[label] }));
    };

    const toggleFlyout = (label: string) => {
        setOpenFlyouts(prev => ({ [label]: !prev[label] }));
    };

    const navItems = [
        // Main
        { icon: <DashboardIcon />, label: 'Dashboard', page: Page.Dashboard },
        // POS & Sales
        { icon: <POSIcon />, label: 'Point of Sales', page: Page.POS },
        {
            isDropdown: true, icon: <SalesIcon />, label: 'Sales & Pelanggan', subItems: [
                { label: 'Penjualan', page: Page.SalesList, icon: <SalesIcon /> },
                { label: 'Data Pelanggan', page: Page.CustomerList, icon: <CustomerListIcon /> },
                { label: 'Data Produk', page: Page.ProductList, icon: <ProductListIcon /> },
            ]
        },
        // Purchase & Inventory
        {
            isDropdown: true, icon: <PurchaseListIcon />, label: 'Purchase', subItems: [
                { label: 'Pesanan Pembelian', page: Page.PurchaseList, icon: <PurchaseListIcon /> },
                { label: 'Buat Pembelian', page: Page.AddPurchase, icon: <AddPurchaseIcon /> },
                { label: 'Vendor', page: Page.Vendors, icon: <VendorIcon /> },
                { label: 'Data Produk', page: Page.ProductList, icon: <ProductListIcon /> },
            ]
        },
        {
            isDropdown: true, icon: <ProductListIcon />, label: 'Inventory', subItems: [
                { label: 'Data Produk', page: Page.ProductList, icon: <ProductListIcon /> },
                { label: 'Penyesuaian Stok', page: Page.InventoryAdjustment, icon: <InventoryAdjustmentIcon /> },
                { label: 'Penerimaan Barang', page: Page.GoodsReceipt, icon: <ArrowDownTrayIcon /> },
                { label: 'Manajemen Retur', page: Page.ReturnManagement, icon: <ArrowLeftIcon /> },
                { label: 'Kategori Produk', page: Page.ProductCategories, icon: <CategoryIcon /> },
                { label: 'Cetak Label Harga', page: Page.PrintPriceLabels, icon: <PrinterIcon /> },
            ]
        },
        // Finance
        {
            isDropdown: true, icon: <FinanceIcon />, label: 'Keuangan', subItems: [
                { label: 'Bagan Akun', page: Page.ChartOfAccounts, icon: <ChartOfAccountsIcon /> },
                {
                    isDropdown: true, label: 'Dompet', icon: <CashAccountListIcon />, subItems: [
                        { label: 'Daftar Rekening', page: Page.CashAccountList, icon: <CashAccountListIcon /> },
                        { label: 'Transaksi', page: Page.CashTransaction, icon: <CashTransactionIcon /> },
                        { label: 'Transfer', page: Page.CashTransfer, icon: <CashTransferIcon /> },
                    ]
                },
                 {
                    isDropdown: true, label: 'Tagihan', icon: <BillIcon />, subItems: [
                        { label: 'Tagihan Vendor', page: Page.VendorBillList, icon: <ArrowUpTrayIcon /> },
                        { label: 'Tagihan Pelanggan', page: Page.CustomerBillList, icon: <ArrowDownTrayIcon /> },
                    ]
                },

                { label: 'Modal', page: Page.Capital, icon: <CapitalIcon /> },
                {
                    isDropdown: true, label: 'Konfigurasi', icon: <SettingsIcon />, subItems: [
                         { label: 'Metode Bayar', page: Page.PaymentMethods, icon: <CashAccountListIcon /> },
                         { label: 'Tempo Bayar', page: Page.PaymentTerms, icon: <ChatIcon /> },
                    ]
                },
            ]
        },
        // HR
        {
            isDropdown: true, icon: <StaffIcon />, label: 'SDM (HRM)', subItems: [
                 { label: 'Daftar Staf', page: Page.StaffList, icon: <StaffIcon /> },
                 { label: 'Jabatan & Gaji', page: Page.RoleManagement, icon: <ShieldCheckIcon /> },
            ]
        },
        // Marketing
        {
            isDropdown: true, icon: <PromotionIcon />, label: 'Pemasaran', subItems: [
                { label: 'Promosi', page: Page.Promotions, icon: <PromotionIcon /> },
                { label: 'Voucher', page: Page.PromotionsVoucher, icon: <TicketIcon /> },
                { label: 'Poin', page: Page.PromotionsPoints, icon: <StarIcon /> },
            ]
        },
        // Reports
        {
            isDropdown: true, icon: <ReportIcon />, label: 'Laporan', subItems: [
                { label: 'Penjualan', page: Page.SalesReport, icon: <SalesIcon /> },
                { label: 'Pembelian', page: Page.PurchaseReport, icon: <PurchaseListIcon /> },
                { label: 'Laporan Barang', page: Page.GoodsReport, icon: <ProductStockIcon /> },
                { label: 'Keuangan Inventaris', page: Page.FinancialInventoryReport, icon: <ChartOfAccountsIcon /> },
                { label: 'Setoran Kasir', page: Page.CashierDepositReport, icon: <DepositIcon /> },
                { label: 'Laba Rugi', page: Page.IncomeStatementReport, icon: <IncomeStatementIcon /> },
                { label: 'Posisi Keuangan', page: Page.FinancialPositionReport, icon: <FinancialPositionIcon /> },
            ]
        },
        // Settings
        {
            isDropdown: true, icon: <SettingsIcon />, label: 'Pengaturan', subItems: [
                { label: 'Informasi Perusahaan', page: Page.CompanyInformationSettings, icon: <CompanyIcon /> },
                { label: 'Tampilan', page: Page.DisplaySettings, icon: <ColorPaletteIcon /> },
                { label: 'Ukuran Report', page: Page.ReportSizesSettings, icon: <PrinterIcon /> },
            ]
        }
    ];

    
    return (
        <>
            <aside className={`flex-shrink-0 transition-all duration-300 bg-white dark:bg-gray-800 border-r border-slate-200 dark:border-gray-700 ${isSidebarCollapsed ? 'w-20' : 'w-64'}`}>
                <div className="flex flex-col h-full">
                    {/* Header */}
                     <div className={`flex items-center justify-between h-16 border-b border-slate-200 dark:border-gray-700 px-4 ${isSidebarCollapsed ? 'px-2 justify-center' : ''}`}>
                         {companyInfo.logoUrl ? (
                             <img src={companyInfo.logoUrl} alt="Logo" className={isSidebarCollapsed ? 'h-8 w-8 object-contain' : 'h-9 max-w-[190px] object-contain'} />
                         ) : (
                             <h1 className="text-xl font-bold text-gray-800 dark:text-white ml-2 flex-grow">{companyInfo.name}</h1>
                         )}
                    </div>
                     {/* Navigation */}
                    <nav className="flex-grow px-2 py-4 space-y-2 overflow-y-auto">
                        <ul>
                            {navItems.map(item => {
                                if (item.isDropdown) {
                                    return <DropdownNavItem key={item.label} {...item} currentPage={currentPage} setPage={wrappedSetPage} userPermissions={userPermissions} isCollapsed={isSidebarCollapsed} handlePosClick={handlePosClick} openDropdowns={openDropdowns} toggleDropdown={toggleDropdown} openFlyouts={openFlyouts} toggleFlyout={toggleFlyout} />;
                                }
                                const hasPermission = userPermissions.includes(item.page);
                                if (!hasPermission) return null;
                                return <NavItem key={item.label} {...item} isActive={currentPage === item.page} onClick={() => item.page === Page.POS ? handlePosClick() : wrappedSetPage(item.page)} isCollapsed={isSidebarCollapsed} />;
                            })}
                        </ul>
                    </nav>
                     {/* Footer */}
                    {/* Collapse Button */}
                    <div className="px-4 py-3 border-t border-slate-200 dark:border-gray-700">
                        <button onClick={() => dispatch({ type: 'ui/setSidebarCollapsed', payload: !isSidebarCollapsed })} className="w-full flex items-center justify-center p-2 rounded-md text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-gray-700">
                            {isSidebarCollapsed ? <ExpandIcon className="w-6 h-6"/> : <CollapseIcon className="w-6 h-6"/>}
                        </button>
                    </div>
                </div>
            </aside>
        </>
    );
};
import React, { useState, useMemo } from 'react';
import { Page } from '../types';
import { useAppContext } from '../hooks/useAppContext';
import { 
    LayoutDashboard, 
    ShoppingCart, 
    TrendingUp, 
    Users, 
    Package, 
    ShoppingBag, 
    PlusCircle, 
    Building, 
    Boxes, 
    SlidersHorizontal, 
    PackageCheck, 
    Undo2, 
    FolderTree, 
    Printer, 
    Wallet, 
    BookOpen, 
    CreditCard, 
    FileText, 
    Coins, 
    Sliders, 
    UserCheck, 
    ShieldCheck, 
    Megaphone, 
    Ticket, 
    Star, 
    BarChart3, 
    Settings, 
    Building2, 
    Palette, 
    ChevronDown, 
    ChevronRight, 
    Store, 
    PanelLeftClose, 
    PanelLeftOpen,
    Receipt,
    FileSpreadsheet,
    ArrowDownLeft,
    ArrowUpRight,
    Database
} from 'lucide-react';

const NavItem: React.FC<{
  icon: React.ReactElement;
  label: string;
  isActive: boolean;
  onClick: () => void;
  isCollapsed: boolean;
  indentationLevel?: number;
}> = ({ icon, label, isActive, onClick, isCollapsed, indentationLevel = 0 }) => {
    const paddingLeft = 14 + (indentationLevel * 16);
    return (
        <li>
            <a
                href="#"
                onClick={(e) => {
                    e.preventDefault();
                    onClick();
                }}
                className={`flex items-center p-3 rounded-xl text-sm transition-all duration-150 group relative ${
                    isActive 
                        ? 'bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 font-bold shadow-xs' 
                        : 'text-slate-700 dark:text-slate-200 font-semibold hover:bg-slate-100/80 dark:hover:bg-gray-800/60 hover:text-slate-900 dark:hover:text-white'
                } ${isCollapsed ? 'justify-center px-2' : ''}`}
                style={{ paddingLeft: isCollapsed ? undefined : `${paddingLeft}px` }}
                title={isCollapsed ? label : ''}
            >
                {isActive && !isCollapsed && (
                    <span className="absolute left-0 top-2.5 bottom-2.5 w-1 bg-blue-600 dark:bg-blue-400 rounded-r-full" />
                )}
                {React.cloneElement<{ className?: string }>(icon, { 
                    className: `w-5 h-5 transition duration-150 shrink-0 ${
                        isActive 
                            ? 'text-blue-600 dark:text-blue-400' 
                            : 'text-slate-400 dark:text-slate-400 group-hover:text-slate-700 dark:group-hover:text-slate-200'
                    }` 
                })}
                {!isCollapsed && <span className="ms-3.5 flex-1 whitespace-nowrap truncate">{label}</span>}
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
    const paddingLeft = 14 + (indentationLevel * 16);
    const isFlyoutOpen = openFlyouts[label] || false;

    if (isCollapsed) {
        return (
            <li className="relative">
                <button
                    type="button"
                    onClick={() => toggleFlyout(label)}
                    className={`flex items-center justify-center w-full p-3 rounded-xl text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-gray-800 transition-colors group ${
                        isParentActive ? 'bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 font-bold' : ''
                    }`}
                    title={label}
                >
                    {React.cloneElement<{ className?: string }>(icon, { 
                        className: `w-5 h-5 transition duration-150 ${
                            isParentActive ? 'text-blue-600 dark:text-blue-400' : 'text-slate-400 dark:text-slate-400 group-hover:text-slate-700 dark:group-hover:text-slate-200'
                        }` 
                    })}
                </button>
                {isFlyoutOpen && (
                    <div className="absolute left-full top-0 ml-2 z-30 w-60 bg-white dark:bg-gray-900 rounded-2xl shadow-xl border border-slate-200 dark:border-gray-800 p-2.5 animate-in fade-in zoom-in-95 duration-150">
                        <p className="px-3 py-1.5 text-xs font-black text-slate-400 dark:text-gray-500 uppercase tracking-wider border-b border-slate-100 dark:border-gray-800 mb-1.5">
                            {label}
                        </p>
                        <ul className="space-y-1">
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
                                        className={`flex items-center space-x-2 px-3 py-2 rounded-xl text-sm ${
                                            currentPage === item.page 
                                                ? 'font-bold bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400' 
                                                : 'font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-gray-800'
                                        }`}
                                    >
                                        {item.icon && React.cloneElement<{ className?: string }>(item.icon, { className: 'w-4 h-4 opacity-70' })}
                                        <span>{item.label}</span>
                                    </a>
                                </li>
                            ))}
                        </ul>
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
                className={`flex items-center w-full p-3 text-sm rounded-xl transition duration-150 group hover:bg-slate-100/80 dark:hover:bg-gray-800/60 ${
                    isParentActive ? 'text-blue-600 dark:text-blue-400 font-bold' : 'text-slate-700 dark:text-slate-200 font-semibold'
                }`}
                style={{ paddingLeft: `${paddingLeft}px` }}
            >
                {React.cloneElement<{ className?: string }>(icon, { 
                    className: `w-5 h-5 transition duration-150 shrink-0 ${
                        isParentActive ? 'text-blue-600 dark:text-blue-400' : 'text-slate-400 dark:text-slate-400 group-hover:text-slate-700 dark:group-hover:text-slate-200'
                    }` 
                })}
                <span className="flex-1 ms-3.5 text-left truncate">{label}</span>
                <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform duration-200 ${isOpen ? 'rotate-180 text-blue-600 dark:text-blue-400' : ''}`} />
            </button>
            {isOpen && (
                <ul className="py-1 space-y-1 relative">
                    <span className="absolute left-6 top-2 bottom-2 w-px bg-slate-200 dark:bg-gray-800" style={{ left: `${paddingLeft + 9}px` }} />
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
    const { companyInfo, currentUser, roles, isSidebarCollapsed } = state;
    const [openDropdowns, setOpenDropdowns] = useState<Record<string, boolean>>({});
    const [openFlyouts, setOpenFlyouts] = useState<Record<string, boolean>>({});
    const [imgError, setImgError] = useState(false);

    const userRole = roles.find(r => r.id === currentUser?.roleId);
    const userPermissions = userRole?.permissions || [];
    
    const handlePosClick = () => {
        dispatch({ type: 'pos/toggleMode', payload: { start: true } });
        if (onCloseMobile) onCloseMobile();
    };

    const wrappedSetPage = (page: Page) => {
        setPage(page);
        if (onCloseMobile) onCloseMobile();
    };

    // Auto-close accordion toggle: Opening one dropdown closes all other open dropdowns automatically
    const toggleDropdown = (label: string) => {
        setOpenDropdowns(prev => {
            const isCurrentlyOpen = prev[label];
            if (isCurrentlyOpen) {
                return {}; // Close all
            }
            return { [label]: true }; // Open only clicked dropdown
        });
    };

    const toggleFlyout = (label: string) => {
        setOpenFlyouts(prev => {
            const isCurrentlyOpen = prev[label];
            if (isCurrentlyOpen) {
                return {};
            }
            return { [label]: true };
        });
    };

    // Modern Lucide Icons for Menubar
    const navItems = [
        { icon: <LayoutDashboard />, label: 'Dashboard', page: Page.Dashboard },
        { icon: <ShoppingCart />, label: 'Point of Sales', page: Page.POS },
        {
            isDropdown: true, icon: <TrendingUp />, label: 'Sales & Pelanggan', subItems: [
                { label: 'Penjualan', page: Page.SalesList, icon: <Receipt /> },
                { label: 'Data Pelanggan', page: Page.CustomerList, icon: <Users /> },
                { label: 'Data Produk', page: Page.ProductList, icon: <Package /> },
            ]
        },
        {
            isDropdown: true, icon: <ShoppingBag />, label: 'Purchase', subItems: [
                { label: 'Pesanan Pembelian', page: Page.PurchaseList, icon: <FileSpreadsheet /> },
                { label: 'Buat Pembelian', page: Page.AddPurchase, icon: <PlusCircle /> },
                { label: 'Vendor', page: Page.Vendors, icon: <Building /> },
                { label: 'Data Produk', page: Page.ProductList, icon: <Package /> },
            ]
        },
        {
            isDropdown: true, icon: <Boxes />, label: 'Inventory', subItems: [
                { label: 'Data Produk', page: Page.ProductList, icon: <Package /> },
                { label: 'Penyesuaian Stok', page: Page.InventoryAdjustment, icon: <SlidersHorizontal /> },
                { label: 'Penerimaan Barang', page: Page.GoodsReceipt, icon: <PackageCheck /> },
                { label: 'Manajemen Retur', page: Page.ReturnManagement, icon: <Undo2 /> },
                { label: 'Kategori Produk', page: Page.ProductCategories, icon: <FolderTree /> },
                { label: 'Cetak Label Harga', page: Page.PrintPriceLabels, icon: <Printer /> },
            ]
        },
        {
            isDropdown: true, icon: <Wallet />, label: 'Keuangan', subItems: [
                { label: 'Bagan Akun', page: Page.ChartOfAccounts, icon: <BookOpen /> },
                {
                    isDropdown: true, label: 'Dompet', icon: <CreditCard />, subItems: [
                        { label: 'Daftar Rekening', page: Page.CashAccountList, icon: <CreditCard /> },
                        { label: 'Transaksi', page: Page.CashTransaction, icon: <ArrowDownLeft /> },
                        { label: 'Transfer', page: Page.CashTransfer, icon: <ArrowUpRight /> },
                    ]
                },
                {
                    isDropdown: true, label: 'Tagihan', icon: <FileText />, subItems: [
                        { label: 'Tagihan Vendor', page: Page.VendorBillList, icon: <FileText /> },
                        { label: 'Tagihan Pelanggan', page: Page.CustomerBillList, icon: <FileText /> },
                    ]
                },
                { label: 'Modal', page: Page.Capital, icon: <Coins /> },
                {
                    isDropdown: true, label: 'Konfigurasi', icon: <Sliders />, subItems: [
                         { label: 'Metode Bayar', page: Page.PaymentMethods, icon: <CreditCard /> },
                         { label: 'Tempo Bayar', page: Page.PaymentTerms, icon: <FileText /> },
                    ]
                },
            ]
        },
        {
            isDropdown: true, icon: <UserCheck />, label: 'SDM (HRM)', subItems: [
                 { label: 'Daftar Staf', page: Page.StaffList, icon: <UserCheck /> },
                 { label: 'Jabatan & Gaji', page: Page.RoleManagement, icon: <ShieldCheck /> },
            ]
        },
        {
            isDropdown: true, icon: <Megaphone />, label: 'Pemasaran', subItems: [
                { label: 'Promosi', page: Page.Promotions, icon: <Megaphone /> },
                { label: 'Voucher', page: Page.PromotionsVoucher, icon: <Ticket /> },
                { label: 'Poin', page: Page.PromotionsPoints, icon: <Star /> },
            ]
        },
        {
            isDropdown: true, icon: <BarChart3 />, label: 'Laporan', subItems: [
                { label: 'Penjualan', page: Page.SalesReport, icon: <Receipt /> },
                { label: 'Pembelian', page: Page.PurchaseReport, icon: <ShoppingBag /> },
                { label: 'Laporan Barang', page: Page.GoodsReport, icon: <Boxes /> },
                { label: 'Keuangan Inventaris', page: Page.FinancialInventoryReport, icon: <BarChart3 /> },
                { label: 'Setoran Kasir', page: Page.CashierDepositReport, icon: <Wallet /> },
                { label: 'Laba Rugi', page: Page.IncomeStatementReport, icon: <TrendingUp /> },
                { label: 'Posisi Keuangan', page: Page.FinancialPositionReport, icon: <BookOpen /> },
            ]
        },
        {
            isDropdown: true, icon: <Settings />, label: 'Pengaturan', subItems: [
                { label: 'Informasi Perusahaan', page: Page.CompanyInformationSettings, icon: <Building2 /> },
                { label: 'Backup & Restore', page: Page.BackupRestore, icon: <Database /> },
                { label: 'Tampilan', page: Page.DisplaySettings, icon: <Palette /> },
                { label: 'Ukuran Report', page: Page.ReportSizesSettings, icon: <Printer /> },
            ]
        }
    ];

    const displayLogo = companyInfo.logoUrl && !imgError;

    return (
        <aside className={`flex-shrink-0 transition-all duration-300 bg-white dark:bg-gray-900 border-r border-slate-200/80 dark:border-gray-800 ${isSidebarCollapsed ? 'w-20' : 'w-64'}`}>
            <div className="flex flex-col h-full">
                
                {/* BRAND HEADER */}
                <div className={`flex items-center h-16 border-b border-slate-100 dark:border-gray-800/80 px-4 ${isSidebarCollapsed ? 'justify-center px-2' : 'justify-between'}`}>
                    <div className="flex items-center space-x-3 truncate">
                        <img 
                            src="/logoposnesia.png" 
                            alt={companyInfo.name || 'Pos Nesia'} 
                            className={isSidebarCollapsed ? 'h-8 w-8 object-contain' : 'h-10 max-w-[180px] object-contain'} 
                        />
                        
                        {!isSidebarCollapsed && (
                            <span className="font-black text-xl bg-gradient-to-r from-slate-900 via-slate-800 to-blue-700 dark:from-white dark:to-slate-300 bg-clip-text text-transparent tracking-tight truncate">
                                {companyInfo.name || 'Pos Nesia'}
                            </span>
                        )}
                    </div>
                </div>

                {/* NAVIGATION ITEMS */}
                <nav className="flex-grow px-3 py-4 space-y-1 overflow-y-auto custom-scrollbar">
                    <ul className="space-y-1">
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

                {/* FOOTER & COLLAPSE TOGGLE */}
                <div className="p-3 border-t border-slate-100 dark:border-gray-800/80 bg-slate-50/50 dark:bg-gray-900/50">
                    <button 
                        onClick={() => dispatch({ type: 'ui/setSidebarCollapsed', payload: !isSidebarCollapsed })} 
                        className="w-full flex items-center justify-center p-2.5 rounded-xl text-slate-500 dark:text-slate-400 hover:bg-white dark:hover:bg-gray-800 hover:text-blue-600 dark:hover:text-blue-400 border border-transparent hover:border-slate-200 dark:hover:border-gray-700 transition-all shadow-2xs"
                        title={isSidebarCollapsed ? 'Buka Sidebar' : 'Tutup Sidebar'}
                    >
                        {isSidebarCollapsed ? <PanelLeftOpen className="w-5 h-5"/> : <PanelLeftClose className="w-5 h-5"/>}
                    </button>
                </div>

            </div>
        </aside>
    );
};
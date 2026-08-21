

import React, { useState, useRef, useEffect, useMemo } from 'react';
import { useAppContext } from '../hooks/useAppContext';
import { Theme, Page, Role } from '../types';
import { LogoutIcon, KeyIcon, SettingsIcon } from './icons';
import { Modal, Button } from './ui';

const ChangePinModal: React.FC<{
    isOpen: boolean;
    onClose: () => void;
}> = ({ isOpen, onClose }) => {
    const { state, dispatch } = useAppContext();
    const [oldPin, setOldPin] = useState('');
    const [newPin, setNewPin] = useState('');
    const [confirmPin, setConfirmPin] = useState('');
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setSuccess('');

        if (state.currentUser?.pin !== oldPin) {
            setError('PIN lama salah.');
            return;
        }
        if (newPin !== confirmPin) {
            setError('PIN baru tidak cocok.');
            return;
        }
        if (!/^\d{6}$/.test(newPin)) {
            setError('PIN baru harus 6 digit angka.');
            return;
        }

        dispatch({ type: 'auth/changePin', payload: { newPin } });
        setSuccess('PIN berhasil diubah!');
        setTimeout(() => {
            onClose();
        }, 1500);
    };

    useEffect(() => {
        if (isOpen) {
            setOldPin('');
            setNewPin('');
            setConfirmPin('');
            setError('');
            setSuccess('');
        }
    }, [isOpen]);

    const footer = (
        <>
            <button type="button" onClick={onClose} className="px-4 py-2 rounded-md text-gray-700 dark:text-gray-200 bg-gray-200 dark:bg-gray-600">Batal</button>
            <Button type="submit" onClick={handleSubmit}>Simpan</Button>
        </>
    );

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title="Ganti PIN"
            footer={footer}
            maxWidth="max-w-md"
        >
            <form onSubmit={handleSubmit}>
                {error && <div className="mb-4 p-3 text-sm text-red-700 bg-red-100 rounded-lg dark:bg-red-900/50 dark:text-red-300">{error}</div>}
                {success && <div className="mb-4 p-3 text-sm text-green-700 bg-green-100 rounded-lg dark:bg-green-900/50 dark:text-green-300">{success}</div>}
                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">PIN Lama</label>
                        <input type="password" value={oldPin} onChange={e => setOldPin(e.target.value)} required className="mt-1 w-full rounded-md bg-gray-100 dark:bg-gray-700 border-transparent"/>
                    </div>
                        <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">PIN Baru</label>
                        <input type="password" value={newPin} onChange={e => setNewPin(e.target.value)} required className="mt-1 w-full rounded-md bg-gray-100 dark:bg-gray-700 border-transparent" pattern="\d{6}" title="PIN harus 6 digit angka." maxLength={6}/>
                    </div>
                        <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Konfirmasi PIN Baru</label>
                        <input type="password" value={confirmPin} onChange={e => setConfirmPin(e.target.value)} required className="mt-1 w-full rounded-md bg-gray-100 dark:bg-gray-700 border-transparent" pattern="\d{6}" title="PIN harus 6 digit angka." maxLength={6}/>
                    </div>
                </div>
            </form>
        </Modal>
    );
}


// M2 grouped structure for modules that have 2-level navigation
const keuanganGroups = [
    {
        key: 'dompet',
        label: 'Dompet',
        defaultPage: Page.CashAccountList,
        pages: [Page.Capital, Page.CashAccountList, Page.CashTransfer, Page.CashTransaction],
        subItems: [
            { label: 'Modal', page: Page.Capital },
            { label: 'Daftar Dompet', page: Page.CashAccountList },
            { label: 'Transfer', page: Page.CashTransfer },
            { label: 'Transaksi', page: Page.CashTransaction },
        ]
    {
        key: 'konfigurasi',
        label: 'Konfigurasi',
        defaultPage: Page.PaymentMethods,
        pages: [Page.PaymentMethods, Page.PaymentTerms, Page.ChartOfAccounts],
        subItems: [
            { label: 'Metode Bayar', page: Page.PaymentMethods },
            { label: 'Tempo Bayar', page: Page.PaymentTerms },
            { label: 'Bagan Akun', page: Page.ChartOfAccounts },
        ]
    },
];

// Laporan Groups (M2/M3)
const laporanGroups = [
    {
        key: 'operasional',
        label: 'Operasional',
        defaultPage: Page.SalesReport,
        pages: [Page.SalesReport, Page.CashierDepositReport],
        subItems: [
            { label: 'Laporan Penjualan', page: Page.SalesReport },
            { label: 'Setoran Kasir', page: Page.CashierDepositReport },
        ]
    },
    {
        key: 'akuntansi',
        label: 'Akuntansi',
        defaultPage: Page.IncomeStatementReport,
        pages: [Page.IncomeStatementReport, Page.FinancialPositionReport, Page.GoodsReport, Page.FinancialInventoryReport],
        subItems: [
            { label: 'Laba Rugi', page: Page.IncomeStatementReport },
            { label: 'Posisi Keuangan', page: Page.FinancialPositionReport },
            { label: 'Laporan Barang', page: Page.GoodsReport },
            { label: 'Keuangan Inventaris', page: Page.FinancialInventoryReport },
        ]
    },
];

// Penjualan: M2 flat (Penjualan, Pelanggan, Promosi). Promosi punya M3 sub-bar.
const penjualanGroups = [
    {
        key: 'penjualan',
        label: 'Penjualan',
        defaultPage: Page.SalesList,
        pages: [Page.SalesList],
        subItems: [] as { label: string; page: Page }[]
    },
    {
        key: 'pelanggan',
        label: 'Pelanggan',
        defaultPage: Page.CustomerList,
        pages: [Page.CustomerList],
        subItems: [] as { label: string; page: Page }[]
    },
    {
        key: 'promosi',
        label: 'Promosi',
        defaultPage: Page.Promotions,
        pages: [Page.Promotions, Page.PromotionsVoucher, Page.PromotionsPoints],
        subItems: [
            { label: 'Promosi', page: Page.Promotions },
            { label: 'Voucher', page: Page.PromotionsVoucher },
            { label: 'Poin', page: Page.PromotionsPoints },
        ]
    },
];

// Helper to find parent module label for current page
const getModuleInfoForPage = (currentPage: Page, userPermissions: Page[]) => {
    const navModules = [
        {
            key: 'Dashboard',
            label: 'Dashboard',
            icon: '📊',
            page: Page.Dashboard,
            subItems: [],
            groups: null,
        },
        {
            key: 'POS',
            label: 'Point of Sales',
            icon: '🛒',
            page: Page.POS,
            subItems: [
                { label: 'Buka Kasir', page: Page.POS }
            ],
            groups: null,
        },
        {
            key: 'Penjualan',
            label: 'Penjualan',
            icon: '📈',
            subItems: penjualanGroups.flatMap(g => g.subItems),
            groups: penjualanGroups,
        },
        {
            key: 'Pembelian',
            label: 'Pembelian',
            icon: '🛍️',
            subItems: [
                { label: 'Pesanan Pembelian', page: Page.PurchaseList },
                { label: 'Vendor', page: Page.Vendors }
            ],
            groups: null,
        },
        {
            key: 'Inventaris',
            label: 'Inventaris',
            icon: '📦',
            subItems: [
                { label: 'Data Produk', page: Page.ProductList },
                { label: 'Penyesuaian Stok', page: Page.InventoryAdjustment },
                { label: 'Penerimaan Barang', page: Page.GoodsReceipt },
                { label: 'Manajemen Retur', page: Page.ReturnManagement },
                { label: 'Kategori Produk', page: Page.ProductCategories }
            ],
            groups: null,
        },
        {
            key: 'Keuangan',
            label: 'Keuangan',
            icon: '💳',
            // flat subItems = all pages for module detection
            subItems: keuanganGroups.flatMap(g => g.subItems),
            groups: keuanganGroups,
        },
        {
            key: 'Karyawan',
            label: 'Karyawan',
            icon: '👤',
            page: Page.StaffList,
            subItems: [],
            groups: null,
        },
        {
            key: 'Laporan',
            label: 'Laporan',
            icon: '📊',
            subItems: laporanGroups.flatMap(g => g.subItems),
            groups: laporanGroups,
        },
        {
            key: 'Pengaturan',
            label: 'Pengaturan',
            icon: '⚙️',
            subItems: [
                { label: 'Informasi Perusahaan', page: Page.CompanyInformationSettings },
                { label: 'Database', page: Page.BackupRestore },
                { label: 'Printer', page: Page.ReportSizesSettings },
                { label: 'Tentang', page: Page.About }
            ],
            groups: null,
        }
    ];

    let currentModule = navModules.find(mod => {
        if ((mod as any).page === currentPage) return true;
        if (mod.groups) return mod.groups.some(g => g.pages.includes(currentPage));
        return mod.subItems.some(sub => sub.page === currentPage);
    }) || navModules[0];

    // Find active M2 group if module has groups
    const activeGroup = currentModule.groups
        ? currentModule.groups.find(g => g.pages.includes(currentPage)) || currentModule.groups[0]
        : null;

    return { navModules, currentModule, activeGroup };
};

export const Header: React.FC<{ onToggleMobileSidebar?: () => void }> = ({ onToggleMobileSidebar }) => {
    const { state, dispatch } = useAppContext();
    const { currentUser, roles, currentPage, posSession } = state;
    const [isDropdownOpen, setDropdownOpen] = useState(false);
    const [isSettingsOpen, setSettingsOpen] = useState(false);
    const [isPinModalOpen, setPinModalOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);
    const settingsRef = useRef<HTMLDivElement>(null);

    const userRole = roles.find(r => r.id === currentUser?.roleId);
    const userPermissions = userRole?.permissions || [];

    const { navModules, currentModule, activeGroup } = useMemo(() => getModuleInfoForPage(currentPage, userPermissions), [currentPage, userPermissions]);

    const handleLogout = () => {
        dispatch({ type: 'auth/logout' });
    };

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setDropdownOpen(false);
            }
            if (settingsRef.current && !settingsRef.current.contains(event.target as Node)) {
                setSettingsOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    if (!currentUser) return null;

    return (
        <header className="bg-slate-900 border-b border-slate-800 sticky top-0 z-30 shadow-md text-white">
            <div className="max-w-full mx-auto px-3 sm:px-4">
                <div className="flex justify-between items-center h-12 gap-2">
                    {/* Left: Mobile Toggle + Logo + Module Name + Horizontal Submenu Tabs */}
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                         <button
                             onClick={onToggleMobileSidebar}
                             className="p-1.5 rounded-lg text-slate-300 hover:bg-slate-800 md:hidden focus:outline-none shrink-0"
                             aria-label="Toggle Menu"
                          >
                             <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                             </svg>
                          </button>

                          {/* Active Module Title (Odoo Style) */}
                          <div className="flex items-center gap-2 shrink-0">
                              <h1 className="text-sm font-black tracking-tight text-white flex items-center gap-1.5 shrink-0">
                                  <span>{currentModule.icon}</span>
                                  <span>{currentModule.label}</span>
                              </h1>
                          </div>

                          {/* M2 tabs — flat for normal modules, grouped for modules with groups (e.g. Keuangan) */}
                          {currentModule.groups ? (
                              <nav className="hidden md:flex items-center gap-1.5 overflow-x-auto no-scrollbar ms-3">
                                  {currentModule.groups.map((group) => {
                                      const isActive = activeGroup?.key === group.key;
                                      return (
                                          <button
                                              key={group.key}
                                              onClick={() => dispatch({ type: 'ui/setPage', payload: group.defaultPage })}
                                              className={`px-3 py-1 rounded-lg text-xs font-bold whitespace-nowrap transition-all ${
                                                  isActive
                                                      ? 'bg-primary-600 text-white shadow-xs'
                                                      : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                                              }`}
                                          >
                                              {group.label}
                                          </button>
                                      );
                                  })}
                              </nav>
                          ) : currentModule.subItems.length > 0 ? (
                              <nav className="hidden md:flex items-center gap-1.5 overflow-x-auto no-scrollbar ms-3">
                                  {currentModule.subItems.map((sub, idx) => {
                                      const isActive = currentPage === sub.page;
                                      return (
                                          <button
                                              key={idx}
                                              onClick={() => {
                                                  if (sub.page === Page.POS) {
                                                      dispatch({ type: 'pos/toggleMode', payload: { start: true } });
                                                  } else {
                                                      dispatch({ type: 'ui/setPage', payload: sub.page });
                                                  }
                                              }}
                                              className={`px-3 py-1 rounded-lg text-xs font-bold whitespace-nowrap transition-all ${
                                                  isActive
                                                      ? 'bg-primary-600 text-white shadow-xs'
                                                      : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                                              }`}
                                          >
                                              {sub.label}
                                          </button>
                                      );
                                  })}
                              </nav>
                          ) : null}
                    </div>

                    {/* Right side Profile & Quick Actions */}
                    <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
                        <button
                            onClick={() => dispatch({ type: 'ui/setPage', payload: Page.CompanyInformationSettings })}
                            className="flex items-center gap-1 px-2 py-1 rounded-lg bg-white/10 hover:bg-white/20 text-white font-medium text-xs transition-all border border-white/10"
                            title="Cek Pembaruan Aplikasi"
                        >
                            <span>🔄</span>
                            <span className="hidden lg:inline text-[11px]">Update</span>
                        </button>

                        {/* User Avatar / Dropdown */}
                        <div className="relative" ref={dropdownRef}>
                            <button
                                onClick={() => setDropdownOpen(!isDropdownOpen)}
                                className="flex items-center gap-1.5 p-1 rounded-lg hover:bg-white/10 transition-colors focus:outline-none"
                            >
                                <div className="w-7 h-7 rounded-full bg-emerald-500 flex items-center justify-center text-white text-xs font-black shrink-0 shadow-2xs">
                                    {currentUser.name?.charAt(0).toUpperCase() || 'U'}
                                </div>
                                <span className="text-xs font-semibold text-white hidden sm:inline max-w-[100px] truncate">{currentUser.name}</span>
                                <svg className="w-3.5 h-3.5 text-primary-200 hidden sm:block" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                            </button>

                            {isDropdownOpen && (
                                <div className="origin-top-right absolute right-0 mt-2 w-52 rounded-xl shadow-xl bg-white dark:bg-zinc-800 text-slate-800 dark:text-slate-100 ring-1 ring-black dark:ring-zinc-700 ring-opacity-5 z-50 border border-slate-100 dark:border-zinc-700 overflow-hidden">
                                    <div className="px-4 py-2.5 border-b dark:border-zinc-700 bg-slate-50 dark:bg-zinc-800/60">
                                        <p className="text-xs font-bold truncate">{currentUser.name}</p>
                                        <p className="text-[10px] text-slate-500 dark:text-slate-400 truncate">{currentUser.email}</p>
                                    </div>
                                    <div className="py-1">
                                        <button onClick={() => { setPinModalOpen(true); setDropdownOpen(false); }} className="w-full text-left flex items-center gap-2.5 px-3 py-2 text-xs hover:bg-slate-100 dark:hover:bg-zinc-700 font-medium">
                                            <KeyIcon className="w-4 h-4 text-slate-400" />
                                            Ganti PIN
                                        </button>
                                        <button onClick={handleLogout} className="w-full text-left flex items-center gap-2.5 px-3 py-2 text-xs text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30 font-medium">
                                            <LogoutIcon className="w-4 h-4" />
                                            Keluar
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* M3 Sub-bar — shown only for modules with groups (e.g. Keuangan) */}
            {activeGroup && activeGroup.subItems.length > 0 && (
                <div className="bg-slate-800/70 border-t border-slate-700/60 px-4">
                    <nav className="hidden md:flex items-center gap-1 overflow-x-auto no-scrollbar h-8">
                        {activeGroup.subItems.map((sub, idx) => {
                            const isActive = currentPage === sub.page;
                            return (
                                <button
                                    key={idx}
                                    onClick={() => dispatch({ type: 'ui/setPage', payload: sub.page })}
                                    className={`px-2.5 py-0.5 rounded-md text-[11px] font-semibold whitespace-nowrap transition-all ${
                                        isActive
                                            ? 'bg-white/15 text-white'
                                            : 'text-slate-400 hover:bg-white/10 hover:text-white'
                                    }`}
                                >
                                    {sub.label}
                                </button>
                            );
                        })}
                    </nav>
                </div>
            )}
            <ChangePinModal isOpen={isPinModalOpen} onClose={() => setPinModalOpen(false)} />
        </header>
    );
};

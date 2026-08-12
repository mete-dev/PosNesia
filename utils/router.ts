import { Page } from '../types';

// Map URL path (e.g., 'penjualan/daftar', 'karyawan/jabatan', 'kasir') to Page enum
export const PATH_TO_PAGE_MAP: Record<string, Page> = {
    // POS & Dashboard
    'kasir': Page.POS,
    'dashboard': Page.Dashboard,

    // Penjualan (/pos/penjualan/...)
    'penjualan': Page.SalesList,
    'penjualan/daftar': Page.SalesList,
    'penjualan/tambah': Page.CreateManualSale,
    'penjualan/pelanggan': Page.CustomerList,
    'penjualan/produk': Page.ProductList,
    'penjualan/promosi': Page.Promotions,
    'penjualan/set-harga': Page.SetPricing,

    // Pembelian (/pos/pembelian/...)
    'pembelian': Page.PurchaseList,
    'pembelian/daftar': Page.PurchaseList,
    'pembelian/tambah': Page.AddPurchase,
    'pembelian/vendor': Page.Vendors,

    // Inventaris (/pos/inventaris/...)
    'inventaris': Page.ProductList,
    'inventaris/produk': Page.ProductList,
    'inventaris/penyesuaian-stok': Page.InventoryAdjustment,
    'inventaris/penerimaan-barang': Page.GoodsReceipt,
    'inventaris/retur': Page.ReturnManagement,
    'inventaris/kategori-produk': Page.ProductCategories,
    'inventaris/cetak-label-harga': Page.PrintPriceLabels,

    // Keuangan (/pos/keuangan/...)
    'keuangan': Page.ChartOfAccounts,
    'keuangan/bagan-akun': Page.ChartOfAccounts,
    'keuangan/rekening': Page.CashAccountList,
    'keuangan/transaksi': Page.CashTransaction,
    'keuangan/transfer': Page.CashTransfer,
    'keuangan/tagihan-vendor': Page.VendorBillList,
    'keuangan/tagihan-pelanggan': Page.CustomerBillList,
    'keuangan/modal': Page.Capital,
    'keuangan/metode-bayar': Page.PaymentMethods,
    'keuangan/tempo-bayar': Page.PaymentTerms,

    // Karyawan (/pos/karyawan/...)
    'karyawan': Page.StaffList,
    'karyawan/daftar': Page.StaffList,
    'karyawan/absensi': Page.StaffAttendance,
    'karyawan/laporan-absensi': Page.StaffAttendanceReport,
    'karyawan/jabatan': Page.RoleManagement,
    'karyawan/hak-akses': Page.RoleManagement,

    // Laporan (/pos/laporan/...)
    'laporan': Page.SalesReport,
    'laporan/penjualan': Page.SalesReport,
    'laporan/pembelian': Page.PurchaseReport,
    'laporan/barang': Page.GoodsReport,
    'laporan/keuangan-inventaris': Page.FinancialInventoryReport,
    'laporan/setoran-kasir': Page.CashierDepositReport,
    'laporan/laba-rugi': Page.IncomeStatementReport,
    'laporan/posisi-keuangan': Page.FinancialPositionReport,

    // Pengaturan (/pos/pengaturan/...)
    'pengaturan': Page.CompanyInformationSettings,
    'pengaturan/informasi-perusahaan': Page.CompanyInformationSettings,
    'pengaturan/database': Page.BackupRestore,
    'pengaturan/printer': Page.ReportSizesSettings,
    'pengaturan/ukuran-report': Page.ReportSizesSettings,
    'pengaturan/pembaruan': Page.AppUpdate,

    // Legacy Fallback Slugs
    'pos': Page.POS,
    'produk': Page.ProductList,
    'set-harga': Page.SetPricing,
    'pesanan-pembelian': Page.PurchaseList,
    'tambah-pembelian': Page.AddPurchase,
    'vendor': Page.Vendors,
    'pelanggan': Page.CustomerList,
    'absensi-karyawan': Page.StaffAttendance,
    'laporan-absensi': Page.StaffAttendanceReport,
    'jabatan': Page.RoleManagement,
    'laporan-penjualan': Page.SalesReport,
    'laporan-pembelian': Page.PurchaseReport,
    'laporan-barang': Page.GoodsReport,
    'laporan-setoran-kasir': Page.CashierDepositReport,
    'laporan-laba-rugi': Page.IncomeStatementReport,
    'laporan-posisi-keuangan': Page.FinancialPositionReport,
    'laporan-keuangan-inventaris': Page.FinancialInventoryReport,
    'penyesuaian-stok': Page.InventoryAdjustment,
    'penerimaan-barang': Page.GoodsReceipt,
    'kategori-produk': Page.ProductCategories,
    'retur': Page.ReturnManagement,
    'bagan-akun': Page.ChartOfAccounts,
    'rekening': Page.CashAccountList,
    'transaksi-kas': Page.CashTransaction,
    'transfer-kas': Page.CashTransfer,
    'tagihan-vendor': Page.VendorBillList,
    'tagihan-pelanggan': Page.CustomerBillList,
    'modal': Page.Capital,
    'metode-bayar': Page.PaymentMethods,
    'tempo-bayar': Page.PaymentTerms,
    'informasi-perusahaan': Page.CompanyInformationSettings,
    'database': Page.BackupRestore,
    'ukuran-report': Page.ReportSizesSettings,
    'pembaruan': Page.AppUpdate,
    'promosi': Page.Promotions,
    'cetak-label-harga': Page.PrintPriceLabels,
};

// Primary URL path slug for each Page enum
export const PAGE_TO_PATH_MAP: Record<Page, string> = {
    [Page.POS]: 'kasir',
    [Page.Dashboard]: 'dashboard',
    [Page.SalesList]: 'penjualan/daftar',
    [Page.CreateManualSale]: 'penjualan/tambah',
    [Page.CustomerList]: 'penjualan/pelanggan',
    [Page.ProductList]: 'penjualan/produk',
    [Page.Promotions]: 'penjualan/promosi',
    [Page.SetPricing]: 'penjualan/set-harga',
    
    [Page.PurchaseList]: 'pembelian/daftar',
    [Page.AddPurchase]: 'pembelian/tambah',
    [Page.Vendors]: 'pembelian/vendor',

    [Page.InventoryAdjustment]: 'inventaris/penyesuaian-stok',
    [Page.GoodsReceipt]: 'inventaris/penerimaan-barang',
    [Page.ReturnManagement]: 'inventaris/retur',
    [Page.ProductCategories]: 'inventaris/kategori-produk',
    [Page.PrintPriceLabels]: 'inventaris/cetak-label-harga',

    [Page.ChartOfAccounts]: 'keuangan/bagan-akun',
    [Page.CashAccountList]: 'keuangan/rekening',
    [Page.CashTransaction]: 'keuangan/transaksi',
    [Page.CashTransfer]: 'keuangan/transfer',
    [Page.VendorBillList]: 'keuangan/tagihan-vendor',
    [Page.CustomerBillList]: 'keuangan/tagihan-pelanggan',
    [Page.Capital]: 'keuangan/modal',
    [Page.PaymentMethods]: 'keuangan/metode-bayar',
    [Page.PaymentTerms]: 'keuangan/tempo-bayar',

    [Page.StaffList]: 'karyawan/daftar',
    [Page.StaffAttendance]: 'karyawan/absensi',
    [Page.StaffAttendanceReport]: 'karyawan/laporan-absensi',
    [Page.RoleManagement]: 'karyawan/jabatan',
    [Page.StaffPermissions]: 'karyawan/hak-akses',

    [Page.SalesReport]: 'laporan/penjualan',
    [Page.PurchaseReport]: 'laporan/pembelian',
    [Page.GoodsReport]: 'laporan/barang',
    [Page.FinancialInventoryReport]: 'laporan/keuangan-inventaris',
    [Page.CashierDepositReport]: 'laporan/setoran-kasir',
    [Page.IncomeStatementReport]: 'laporan/laba-rugi',
    [Page.FinancialPositionReport]: 'laporan/posisi-keuangan',

    [Page.CompanyInformationSettings]: 'pengaturan/informasi-perusahaan',
    [Page.BackupRestore]: 'pengaturan/database',
    [Page.ReportSizesSettings]: 'pengaturan/printer',
    [Page.DisplaySettings]: 'pengaturan/tampilan',
    [Page.AppUpdate]: 'pengaturan/pembaruan',
    
    // Additional pages fallback
    [Page.Calendar]: 'kalender',
    [Page.OrderFulfillment]: 'pemenuhan-pesanan',
    [Page.GeneralJournal]: 'keuangan/jurnal-umum',
    [Page.Ledger]: 'keuangan/buku-besar',
    [Page.CashAccountTransactionHistory]: 'keuangan/riwayat-rekening',
    [Page.AssetList]: 'aset/daftar',
    [Page.AssetPurchase]: 'aset/pembelian',
    [Page.AssetSale]: 'aset/penjualan',
    [Page.AssetCategoryManagement]: 'aset/kategori',
    [Page.ManageShelves]: 'inventaris/rak',
    [Page.Recruitment]: 'karyawan/rekrutmen',
    [Page.JobOpeningManagement]: 'karyawan/lowongan',
    [Page.JobApplicantManagement]: 'karyawan/pelamar',
    [Page.TimeOff]: 'karyawan/cuti',
    [Page.Payroll]: 'karyawan/penggajian',
    [Page.VendorBillPayment]: 'keuangan/bayar-tagihan-vendor',
    [Page.CustomerBillPayment]: 'keuangan/bayar-tagihan-pelanggan',
    [Page.InvestorManagement]: 'keuangan/investor',
    [Page.CapitalTransactionManagement]: 'keuangan/transaksi-modal',
    [Page.ProfitDistributionManagement]: 'keuangan/bagi-hasil',
    [Page.CashierDepositVerification]: 'keuangan/verifikasi-setoran',
    [Page.AuditTrail]: 'pengaturan/audit-trail',
    [Page.TaxSettings]: 'pengaturan/pajak',
    [Page.TaxReport]: 'laporan/pajak',
    [Page.StockTransfer]: 'inventaris/transfer-stok',
    [Page.BranchManagement]: 'pengaturan/cabang',
    [Page.WarehouseManagement]: 'pengaturan/gudang',
    [Page.WarehouseTypeManagement]: 'pengaturan/tipe-gudang',
    [Page.InventoryLevelManagement]: 'inventaris/stok-gudang',
    [Page.BranchTypeManagement]: 'pengaturan/tipe-cabang',
    [Page.CashierStationManagement]: 'pengaturan/kasir-stasiun',
};

// Get current path slug from window.location
export const getPageFromUrl = (): Page => {
    const rawPath = window.location.pathname.replace(/^\/pos\/?/, '').replace(/^\//, '').toLowerCase();
    if (!rawPath) return Page.Dashboard;
    if (PATH_TO_PAGE_MAP[rawPath]) {
        return PATH_TO_PAGE_MAP[rawPath];
    }
    // Try matching subpath
    const parts = rawPath.split('/');
    if (parts.length > 1 && PATH_TO_PAGE_MAP[parts[parts.length - 1]]) {
        return PATH_TO_PAGE_MAP[parts[parts.length - 1]];
    }
    return Page.Dashboard;
};

// Navigate to URL path
export const navigateToPath = (page: Page) => {
    const slug = PAGE_TO_PATH_MAP[page] || 'dashboard';
    const newPath = `/pos/${slug}`;
    if (window.location.pathname !== newPath) {
        window.history.pushState({ page }, '', newPath);
    }
};

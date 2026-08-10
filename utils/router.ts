import { Page } from '../types';

// Map URL path slug (e.g., 'produk') to Page enum
export const PATH_TO_PAGE_MAP: Record<string, Page> = {
    'pos': Page.POS,
    'dashboard': Page.Dashboard,
    'produk': Page.ProductList,
    'set-harga': Page.SetPricing,
    'penjualan': Page.SalesList,
    'tambah-penjualan': Page.CreateManualSale,
    'pesanan-pembelian': Page.PurchaseList,
    'tambah-pembelian': Page.AddPurchase,
    'vendor': Page.Vendors,
    'pelanggan': Page.CustomerList,
    'karyawan': Page.StaffList,
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
    'promosi': Page.Promotions,
    'cetak-label-harga': Page.PrintPriceLabels,
};

// Map Page enum to URL path slug (e.g., Page.ProductList -> 'produk')
export const PAGE_TO_PATH_MAP: Record<Page, string> = Object.entries(PATH_TO_PAGE_MAP).reduce((acc, [path, page]) => {
    acc[page] = path;
    return acc;
}, {} as Record<Page, string>);

// Get current path slug from window.location
export const getPageFromUrl = (): Page => {
    const path = window.location.pathname.replace(/^\/pos\/?/, '').replace(/^\//, '').toLowerCase();
    if (!path || path === '' || path === 'pos') {
        if (window.location.pathname.startsWith('/pos/')) {
            const subPath = window.location.pathname.replace(/^\/pos\//, '').toLowerCase();
            if (PATH_TO_PAGE_MAP[subPath]) {
                return PATH_TO_PAGE_MAP[subPath];
            }
        }
    }
    return PATH_TO_PAGE_MAP[path] || Page.Dashboard;
};

// Navigate to URL path
export const navigateToPath = (page: Page) => {
    const slug = PAGE_TO_PATH_MAP[page] || 'dashboard';
    const newPath = `/pos/${slug}`;
    if (window.location.pathname !== newPath) {
        window.history.pushState({ page }, '', newPath);
    }
};

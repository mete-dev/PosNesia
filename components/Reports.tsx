import React, { useState, useMemo } from 'react';
import { useAppContext } from '../hooks/useAppContext';
import { Sale, Product, StockMovement, AccountType, JournalEntry, Account, PurchaseOrder, PosSessionSummary, ProductCategory, Shelf, InventoryLevel, ProductTypeLocation } from '../types';
import { Card, Button, Label, Select, DateRangeFilter, PageHeader, Table, Thead, Tbody, Tr, Th, Td, Input, Badge, Modal } from './ui';
import { TrendingUp, Package, ShoppingCart, DollarSign, Wallet, FileText, ArrowRightLeft, Percent, Layers, PieChart, Filter, CheckCircle2, Eye, Printer } from 'lucide-react';
import { Receipt } from './Receipt';

// --- Consolidated Goods Report ---
export const GoodsReportPage: React.FC = () => {
    const { state } = useAppContext();
    const { products, sales, inventoryLevels, productCategories, shelves, productTypeLocations, warehouses, branches } = state;

    type ReportType = 'Persediaan' | 'Penjualan' | 'Stok Minus';
    type FilterType = 'Semua Barang' | 'Kategori' | 'Rak';
    type QuantityFilterType = 'Semua Barang' | 'Paling Sedikit' | 'Paling Banyak';

    const today = new Date().toISOString().split('T')[0];
    const pastDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

    const [startDate, setStartDate] = useState(pastDate);
    const [endDate, setEndDate] = useState(today);
    const [isFilterOpen, setIsFilterOpen] = useState(false);

    const [reportType, setReportType] = useState<ReportType>('Persediaan');
    const [filterType, setFilterType] = useState<FilterType>('Semua Barang');
    const [filterId, setFilterId] = useState('');
    const [locationFilterId, setLocationFilterId] = useState('');
    const [quantityFilter, setQuantityFilter] = useState<QuantityFilterType>('Semua Barang');
    const [quantityLimit, setQuantityLimit] = useState<number | string>(10);
    const [reportData, setReportData] = useState<any[]>([]);
    const [reportTitle, setReportTitle] = useState('Laporan Barang');

    const handleGenerateReport = (start: string, end: string) => {
        const startD = new Date(start);
        const endD = new Date(end);
        let data: any[] = [];
        let title = `Laporan ${reportType}`;

        let filteredProducts = products;
        if (filterType === 'Kategori' && filterId) {
            filteredProducts = products.filter(p => p.categoryId === filterId);
            title += ` - Kategori: ${productCategories.find(c => c.id === filterId)?.name}`;
        } else if (filterType === 'Rak' && filterId) {
            const productIdsOnShelf = new Set(productTypeLocations.filter(pl => pl.shelfId === filterId).map(pl => pl.productId));
            filteredProducts = products.filter(p => productIdsOnShelf.has(p.id));
            title += ` - Rak: ${shelves.find(s => s.id === filterId)?.code}`;
        }
        const filteredProductIds = new Set(filteredProducts.map(p => p.id));
        
        if (locationFilterId) {
            const loc = [...warehouses, ...branches].find(l => l.id === locationFilterId);
            if (loc) title += ` - Lokasi: ${loc.name}`;
        }

        const stockMap = new Map<string, number>();
        inventoryLevels
            .filter(inv => !locationFilterId || inv.locationId === locationFilterId)
            .forEach(inv => {
                stockMap.set(inv.productId, (stockMap.get(inv.productId) || 0) + inv.quantity);
            });
        
        const ptlMap = new Map<string, ProductTypeLocation>();
        productTypeLocations.forEach(ptl => {
            if (!ptlMap.has(ptl.productId)) {
                ptlMap.set(ptl.productId, ptl);
            }
        });

        switch (reportType) {
            case 'Persediaan':
                data = filteredProducts.map(p => {
                    const location = ptlMap.get(p.id);
                    const shelf = location?.shelfId ? shelves.find(s => s.id === location.shelfId) : null;
                    return {
                        Nama: p.name,
                        Kategori: productCategories.find(c => c.id === p.categoryId)?.name || '-',
                        Rak: shelf?.code || '-',
                        Stok: stockMap.get(p.id) || 0,
                    };
                });
                break;
            
            case 'Stok Minus':
                title = 'Laporan Stok Minus';
                data = filteredProducts
                    .map(p => {
                        const location = ptlMap.get(p.id);
                        const shelf = location?.shelfId ? shelves.find(s => s.id === location.shelfId) : null;
                        return {
                            Nama: p.name,
                            Kategori: productCategories.find(c => c.id === p.categoryId)?.name || '-',
                            Rak: shelf?.code || '-',
                            Stok: stockMap.get(p.id) || 0,
                        };
                    })
                    .filter(item => item.Stok < 0);
                break;
            
            case 'Penjualan':
                const salesInRange = sales.filter(s => {
                    const saleDate = new Date(s.date);
                    const inDate = saleDate >= startD && saleDate <= endD;
                    const inLocation = !locationFilterId || s.branchId === locationFilterId;
                    return inDate && inLocation;
                });
                const salesByProduct = salesInRange.flatMap(s => s.items).reduce((acc, item) => {
                    if (filteredProductIds.has(item.productId)) {
                        const existing = acc[item.productId] || { Nama: item.productName, Kuantitas: 0, Total: 0 };
                        existing.Kuantitas += item.quantity;
                        existing.Total += (item.price * item.quantity) - item.discount;
                        acc[item.productId] = existing;
                    }
                    return acc;
                }, {} as Record<string, { Nama: string, Kuantitas: number, Total: number }>);
                data = Object.values(salesByProduct);
                break;
        }

        const limit = Number(quantityLimit) > 0 ? Number(quantityLimit) : data.length;

        if (quantityFilter !== 'Semua Barang') {
            const sortKey = reportType === 'Penjualan' ? 'Kuantitas' : 'Stok';
            if (quantityFilter === 'Paling Sedikit') {
                data.sort((a, b) => a[sortKey] - b[sortKey]);
            } else {
                data.sort((a, b) => b[sortKey] - a[sortKey]);
            }
            data = data.slice(0, limit);
            title += ` (${quantityFilter} ${limit} item)`;
        }

        setReportData(data);
        setReportTitle(title);
    };

    const handleApplyFilter = () => {
        handleGenerateReport(startDate, endDate);
        setIsFilterOpen(false);
    };

    React.useEffect(() => {
        handleGenerateReport(startDate, endDate);
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const renderFilterDropdown = () => {
        if (filterType === 'Kategori') {
            return <Select value={filterId} onChange={e => setFilterId(e.target.value)} className="text-xs py-1.5 w-full"><option value="">Pilih Kategori</option>{productCategories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}</Select>;
        }
        if (filterType === 'Rak') {
            return <Select value={filterId} onChange={e => setFilterId(e.target.value)} className="text-xs py-1.5 w-full"><option value="">Pilih Rak</option>{shelves.map(s => <option key={s.id} value={s.id}>{s.code} - {s.description}</option>)}</Select>;
        }
        return null;
    };

    const columns = reportData.length > 0 ? Object.keys(reportData[0]) : [];

    return (
        <div className="w-full h-full flex flex-col p-4 md:p-6 space-y-3 overflow-hidden">
            {/* Header Bar */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 shrink-0">
                <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-xl bg-primary-50 dark:bg-primary-950/60 text-primary-600 dark:text-primary-400 flex items-center justify-center shrink-0">
                        <Package className="w-5 h-5" />
                    </div>
                    <div>
                        <h1 className="text-lg font-black text-slate-900 dark:text-white leading-tight">
                            Laporan Barang
                        </h1>
                    </div>
                </div>

                <div className="flex items-center gap-2 text-xs shrink-0 self-end sm:self-center">
                    <div className="px-2.5 py-1.5 rounded-lg bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 font-medium">
                        <span className="text-[10px] text-slate-500 dark:text-slate-400 uppercase font-bold">Total Item:</span>{" "}
                        <span className="font-bold font-mono">{reportData.length}</span>
                    </div>

                    <Button onClick={() => setIsFilterOpen(true)} className="gap-2 text-xs py-1.5 px-3 shadow-xs">
                        <Filter className="w-4 h-4" />
                        Buat Laporan / Filter
                    </Button>
                </div>
            </div>

            {/* Table Area (Maximizes vertical height) */}
            <div className="flex-1 min-h-0 bg-white dark:bg-zinc-900 rounded-xl border border-slate-200/80 dark:border-zinc-800 shadow-2xs overflow-hidden flex flex-col">
                <div className="overflow-x-auto flex-1">
                    <Table>
                        <Thead>
                            <Tr>
                                {columns.map(col => <Th key={col} className={typeof reportData[0]?.[col] === 'number' ? 'text-right' : 'text-left'}>{col}</Th>)}
                            </Tr>
                        </Thead>
                        <Tbody>
                            {reportData.length === 0 ? (
                                <Tr>
                                    <Td colSpan={columns.length || 4} className="text-center py-12 text-slate-400">
                                        Tidak ada data barang yang sesuai filter. Klik "Buat Laporan / Filter" untuk memilih kriteria.
                                    </Td>
                                </Tr>
                            ) : (
                                reportData.map((row, index) => (
                                    <Tr key={index}>
                                        {columns.map(col => (
                                            <Td key={col} className={typeof row[col] === 'number' ? 'text-right font-mono' : 'text-left'}>
                                                {typeof row[col] === 'number' ? row[col].toLocaleString('id-ID') : row[col]}
                                            </Td>
                                        ))}
                                    </Tr>
                                ))
                            )}
                        </Tbody>
                    </Table>
                </div>
            </div>

            {/* Pop-up Filter Modal */}
            <Modal
                isOpen={isFilterOpen}
                onClose={() => setIsFilterOpen(false)}
                title="Filter & Buat Laporan Barang"
                maxWidth="max-w-lg"
                footer={
                    <div className="flex justify-end gap-2 w-full">
                        <Button variant="secondary" onClick={() => setIsFilterOpen(false)}>Batal</Button>
                        <Button onClick={handleApplyFilter} className="gap-1.5">
                            <Filter className="w-4 h-4" />
                            Generate Laporan
                        </Button>
                    </div>
                }
            >
                <div className="space-y-4 text-sm">
                    {/* Periode Tanggal */}
                    <div className="bg-slate-50 dark:bg-zinc-800/60 p-3 rounded-xl border border-slate-200/60 dark:border-zinc-700/60 space-y-2">
                        <Label className="font-bold text-slate-800 dark:text-zinc-200 text-xs">Periode Tanggal Laporan</Label>
                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <Label htmlFor="goods_start" className="text-xs text-slate-500">Tanggal Mulai</Label>
                                <Input id="goods_start" type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className="text-xs py-1.5" />
                            </div>
                            <div>
                                <Label htmlFor="goods_end" className="text-xs text-slate-500">Tanggal Selesai</Label>
                                <Input id="goods_end" type="date" value={endDate} onChange={e => setEndDate(e.target.value)} className="text-xs py-1.5" />
                            </div>
                        </div>
                    </div>

                    {/* Filter Options */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                            <Label className="text-xs font-semibold mb-1">Jenis Laporan</Label>
                            <Select value={reportType} onChange={e => setReportType(e.target.value as ReportType)} className="text-xs py-1.5">
                                <option value="Persediaan">Persediaan</option>
                                <option value="Penjualan">Penjualan</option>
                                <option value="Stok Minus">Stok Minus</option>
                            </Select>
                        </div>

                        <div>
                            <Label className="text-xs font-semibold mb-1">Lokasi Pengecekan</Label>
                            <Select value={locationFilterId} onChange={e => setLocationFilterId(e.target.value)} className="text-xs py-1.5">
                                <option value="">Semua Lokasi</option>
                                {warehouses.map(w => <option key={w.id} value={w.id}>{w.name}</option>)}
                                {branches.map(b => <option key={b.id} value={b.id}>Toko: {b.name}</option>)}
                            </Select>
                        </div>

                        <div>
                            <Label className="text-xs font-semibold mb-1">Filter Kuantitas</Label>
                            <Select value={quantityFilter} onChange={e => setQuantityFilter(e.target.value as QuantityFilterType)} className="text-xs py-1.5">
                                <option value="Semua Barang">Semua Barang</option>
                                <option value="Paling Sedikit">Paling Sedikit</option>
                                <option value="Paling Banyak">Paling Banyak</option>
                            </Select>
                        </div>

                        {(quantityFilter === 'Paling Sedikit' || quantityFilter === 'Paling Banyak') && (
                            <div>
                                <Label className="text-xs font-semibold mb-1">Batas Jumlah Item</Label>
                                <Input type="number" value={quantityLimit} onChange={e => setQuantityLimit(e.target.value)} className="text-xs py-1.5" placeholder="10" />
                            </div>
                        )}

                        <div>
                            <Label className="text-xs font-semibold mb-1">Kategori / Rak</Label>
                            <Select value={filterType} onChange={e => {setFilterType(e.target.value as FilterType); setFilterId('');}} className="text-xs py-1.5">
                                <option value="Semua Barang">Semua Barang</option>
                                <option value="Kategori">Berdasarkan Kategori</option>
                                <option value="Rak">Berdasarkan Rak</option>
                            </Select>
                        </div>

                        {(filterType === 'Kategori' || filterType === 'Rak') && (
                            <div>
                                <Label className="text-xs font-semibold mb-1">Pilih {filterType}</Label>
                                {renderFilterDropdown()}
                            </div>
                        )}
                    </div>
                </div>
            </Modal>
        </div>
    );
};

// --- Financial Inventory Report ---

interface CategoryFinancials {
    id: string;
    name: string;
    level: number;
    inventoryValue: number;
    salesValue: number;
    children: CategoryFinancials[];
}

export const FinancialInventoryReportPage: React.FC = () => {
    const { state } = useAppContext();
    const { products, productCategories, inventoryLevels, sales } = state;
    const [reportData, setReportData] = useState<CategoryFinancials[]>([]);
    
    const today = new Date().toISOString().split('T')[0];
    const pastDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

    const [startDate, setStartDate] = useState(pastDate);
    const [endDate, setEndDate] = useState(today);
    const [isFilterOpen, setIsFilterOpen] = useState(false);

    const handleFilter = (start: string, end: string) => {
        const startD = new Date(start);
        startD.setHours(0, 0, 0, 0);
        const endD = new Date(end);
        endD.setHours(23, 59, 59, 999);

        const salesInRange = sales.filter(s => {
            const saleDate = new Date(s.date);
            return saleDate >= startD && saleDate <= endD;
        });

        const stockMap = new Map<string, number>();
        inventoryLevels.forEach(inv => {
            stockMap.set(inv.productId, (stockMap.get(inv.productId) || 0) + inv.quantity);
        });

        const salesValueMap = new Map<string, number>();
        salesInRange.flatMap(s => s.items).forEach(item => {
            salesValueMap.set(item.productId, (salesValueMap.get(item.productId) || 0) + (item.price * item.quantity - item.discount));
        });

        const buildTree = (parentId: string | undefined = undefined, level: number = 0): CategoryFinancials[] => {
            const children = productCategories.filter(c => c.parentId === parentId);
            
            return children.map(cat => {
                const childResult = buildTree(cat.id, level + 1);
                
                const productsInCategory = products.filter(p => p.categoryId === cat.id);
                
                let directInventoryValue = productsInCategory.reduce((sum, p) => sum + ((stockMap.get(p.id) || 0) * p.cost), 0);
                let directSalesValue = productsInCategory.reduce((sum, p) => sum + (salesValueMap.get(p.id) || 0), 0);

                const totalInventoryValue = directInventoryValue + childResult.reduce((sum, c) => sum + c.inventoryValue, 0);
                const totalSalesValue = directSalesValue + childResult.reduce((sum, c) => sum + c.salesValue, 0);

                return {
                    id: cat.id,
                    name: cat.name,
                    level,
                    inventoryValue: totalInventoryValue,
                    salesValue: totalSalesValue,
                    children: childResult,
                };
            });
        };

        setReportData(buildTree());
    };

    const handleApplyFilter = () => {
        handleFilter(startDate, endDate);
        setIsFilterOpen(false);
    };

    React.useEffect(() => {
        handleFilter(startDate, endDate);
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const renderRow = (cat: CategoryFinancials) => (
        <React.Fragment key={cat.id}>
            <Tr className="bg-gray-50 dark:bg-gray-700/50">
                <Td style={{ paddingLeft: `${1.5 + cat.level * 1.5}rem` }} className="font-semibold">{cat.name}</Td>
                <Td className="text-right font-semibold">Rp{cat.inventoryValue.toLocaleString('id-ID')}</Td>
                <Td className="text-right font-semibold">Rp{cat.salesValue.toLocaleString('id-ID')}</Td>
            </Tr>
            {cat.children.map(renderRow)}
        </React.Fragment>
    );

    return (
        <div className="w-full h-full flex flex-col p-4 md:p-6 space-y-3 overflow-hidden">
            {/* Header Bar */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 shrink-0">
                <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-xl bg-primary-50 dark:bg-primary-950/60 text-primary-600 dark:text-primary-400 flex items-center justify-center shrink-0">
                        <PieChart className="w-5 h-5" />
                    </div>
                    <div>
                        <h1 className="text-lg font-black text-slate-900 dark:text-white leading-tight">
                            Laporan Keuangan Inventaris per Kategori
                        </h1>
                    </div>
                </div>

                <div className="shrink-0">
                    <Button onClick={() => setIsFilterOpen(true)} className="gap-2 text-xs py-1.5 px-3 shadow-xs">
                        <Filter className="w-4 h-4" />
                        Buat Laporan / Filter
                    </Button>
                </div>
            </div>

            {/* Table Area */}
            <div className="flex-1 min-h-0 bg-white dark:bg-zinc-900 rounded-xl border border-slate-200/80 dark:border-zinc-800 shadow-2xs overflow-hidden flex flex-col">
                <div className="overflow-x-auto flex-1">
                    <Table>
                        <Thead>
                            <Tr>
                                <Th>Kategori Produk</Th>
                                <Th className="text-right">Total Nilai Persediaan (HPP)</Th>
                                <Th className="text-right">Total Nilai Penjualan</Th>
                            </Tr>
                        </Thead>
                        <Tbody>
                            {reportData.length === 0 ? (
                                <Tr>
                                    <Td colSpan={3} className="text-center py-12 text-slate-400">
                                        Tidak ada data inventaris pada periode ini. Klik "Buat Laporan / Filter" untuk memilih periode.
                                    </Td>
                                </Tr>
                            ) : (
                                reportData.map(renderRow)
                            )}
                        </Tbody>
                    </Table>
                </div>
            </div>

            {/* Pop-up Filter Modal */}
            <Modal
                isOpen={isFilterOpen}
                onClose={() => setIsFilterOpen(false)}
                title="Filter & Buat Laporan Keuangan Inventaris"
                maxWidth="max-w-md"
                footer={
                    <div className="flex justify-end gap-2 w-full">
                        <Button variant="secondary" onClick={() => setIsFilterOpen(false)}>Batal</Button>
                        <Button onClick={handleApplyFilter} className="gap-1.5">
                            <Filter className="w-4 h-4" />
                            Generate Laporan
                        </Button>
                    </div>
                }
            >
                <div className="space-y-4 text-sm">
                    <div className="bg-slate-50 dark:bg-zinc-800/60 p-3 rounded-xl border border-slate-200/60 dark:border-zinc-700/60 space-y-2">
                        <Label className="font-bold text-slate-800 dark:text-zinc-200 text-xs">Periode Tanggal Laporan</Label>
                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <Label htmlFor="fin_start" className="text-xs text-slate-500">Tanggal Mulai</Label>
                                <Input id="fin_start" type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className="text-xs py-1.5" />
                            </div>
                            <div>
                                <Label htmlFor="fin_end" className="text-xs text-slate-500">Tanggal Selesai</Label>
                                <Input id="fin_end" type="date" value={endDate} onChange={e => setEndDate(e.target.value)} className="text-xs py-1.5" />
                            </div>
                        </div>
                    </div>
                </div>
            </Modal>
        </div>
    );
};


// --- Sales Report ---

export const SalesReport: React.FC = () => {
    const { state } = useAppContext();
    const { sales, staff, customers, currentBranchId, posSessionSummaries, companyInfo, reportLayoutSettings } = state;
    const [filteredSales, setFilteredSales] = useState<Sale[]>([]);

    const [viewMode, setViewMode] = useState<'transaction' | 'product'>('transaction');
    const [filterPeriodType, setFilterPeriodType] = useState<'day' | 'session' | 'custom'>('day');
    const [selectedSessionId, setSelectedSessionId] = useState<string>('all');
    const [selectedSingleDate, setSelectedSingleDate] = useState<string>(new Date().toISOString().split('T')[0]);

    const [saleChannel, setSaleChannel] = useState('all');
    const [cashierId, setCashierId] = useState('all');
    const [customerType, setCustomerType] = useState<'all' | 'Perorangan' | 'Perusahaan'>('all');
    
    const today = new Date().toISOString().split('T')[0];
    const pastDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

    const [dateRange, setDateRange] = useState<{ start: string, end: string }>({ start: pastDate, end: today });
    const [isFilterOpen, setIsFilterOpen] = useState(false);
    const [selectedSaleForReceipt, setSelectedSaleForReceipt] = useState<Sale | null>(null);

    const applyAllFilters = () => {
        let tempSales = [...sales];

        if (filterPeriodType === 'day') {
            tempSales = tempSales.filter(s => s.date.startsWith(selectedSingleDate));
        } else if (filterPeriodType === 'session') {
            if (selectedSessionId !== 'all') {
                const targetSession = posSessionSummaries.find(ps => ps.id === selectedSessionId || ps.sessionId === selectedSessionId);
                if (targetSession) {
                    tempSales = tempSales.filter(s => {
                        const sTime = new Date(s.date).getTime();
                        const sessDate = new Date(targetSession.date).getTime();
                        const isSameCashier = s.staffId === targetSession.cashierId || !s.staffId;
                        return isSameCashier && Math.abs(sTime - sessDate) <= 24 * 60 * 60 * 1000;
                    });
                }
            }
        } else {
            const startDate = new Date(dateRange.start);
            startDate.setHours(0, 0, 0, 0);
            const endDate = new Date(dateRange.end);
            endDate.setHours(23, 59, 59, 999);
            tempSales = tempSales.filter(sale => {
                const saleDate = new Date(sale.date);
                return saleDate >= startDate && saleDate <= endDate;
            });
        }

        if (currentBranchId) tempSales = tempSales.filter(s => s.branchId === currentBranchId);
        if (saleChannel !== 'all') tempSales = tempSales.filter(s => s.saleChannel === saleChannel);
        if (cashierId !== 'all') tempSales = tempSales.filter(s => s.staffId === cashierId);
        if (customerType !== 'all') {
            tempSales = tempSales.filter(s => {
                const customer = customers.find(c => c.id === s.customerId);
                return customer?.customerType === customerType;
            });
        }
        
        setFilteredSales(tempSales);
    };

    const handleConfirmFilter = () => {
        applyAllFilters();
        setIsFilterOpen(false);
    };
    
    React.useEffect(() => {
        applyAllFilters();
    }, [sales, currentBranchId, dateRange, filterPeriodType, selectedSessionId, selectedSingleDate, saleChannel, cashierId, customerType]);

    const reportData = useMemo(() => {
        const totalRevenue = filteredSales.reduce((sum, sale) => sum + sale.grandTotal, 0);
        const totalTransactions = filteredSales.length;
        const averageSale = totalTransactions > 0 ? totalRevenue / totalTransactions : 0;
        return { totalRevenue, totalTransactions, averageSale };
    }, [filteredSales]);

    // Product breakdown data grouping
    const productBreakdownData = useMemo(() => {
        const map = new Map<string, { productId: string; productName: string; quantity: number; totalRevenue: number; avgPrice: number }>();
        filteredSales.forEach(sale => {
            sale.items.forEach(item => {
                const existing = map.get(item.productId);
                const itemNetTotal = (item.price * item.quantity) - item.discount;
                if (existing) {
                    existing.quantity += item.quantity;
                    existing.totalRevenue += itemNetTotal;
                    existing.avgPrice = existing.totalRevenue / existing.quantity;
                } else {
                    map.set(item.productId, {
                        productId: item.productId,
                        productName: item.productName,
                        quantity: item.quantity,
                        totalRevenue: itemNetTotal,
                        avgPrice: item.price
                    });
                }
            });
        });
        return Array.from(map.values()).sort((a, b) => b.totalRevenue - a.totalRevenue);
    }, [filteredSales]);

    return (
        <div className="w-full h-full flex flex-col p-4 md:p-6 space-y-3 overflow-hidden">
            {/* Header Bar */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 shrink-0">
                <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-xl bg-primary-50 dark:bg-primary-950/60 text-primary-600 dark:text-primary-400 flex items-center justify-center shrink-0">
                        <TrendingUp className="w-5 h-5" />
                    </div>
                    <div>
                        <h1 className="text-lg font-black text-slate-900 dark:text-white leading-tight">
                            Rekap Penjualan
                        </h1>
                    </div>
                </div>

                <div className="flex flex-wrap items-center gap-2 text-xs shrink-0 self-end sm:self-center">
                    {/* View Mode Toggle: Per Transaksi vs Per Produk */}
                    <div className="flex items-center bg-slate-100 dark:bg-zinc-800 p-0.5 rounded-lg border border-slate-200 dark:border-zinc-700">
                        <button
                            type="button"
                            onClick={() => setViewMode('transaction')}
                            className={`px-2.5 py-1 rounded-md text-xs font-bold transition-all ${
                                viewMode === 'transaction' 
                                    ? 'bg-white dark:bg-zinc-900 text-slate-900 dark:text-white shadow-2xs' 
                                    : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
                            }`}
                        >
                            Per Transaksi
                        </button>
                        <button
                            type="button"
                            onClick={() => setViewMode('product')}
                            className={`px-2.5 py-1 rounded-md text-xs font-bold transition-all ${
                                viewMode === 'product' 
                                    ? 'bg-white dark:bg-zinc-900 text-slate-900 dark:text-white shadow-2xs' 
                                    : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
                            }`}
                        >
                            Per Produk Terjual
                        </button>
                    </div>

                    <div className="px-2.5 py-1.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 font-medium">
                        <span className="text-[10px] text-slate-500 dark:text-slate-400 uppercase font-bold">Total Pendapatan:</span>{" "}
                        <span className="font-bold font-mono">Rp{reportData.totalRevenue.toLocaleString('id-ID')}</span>
                    </div>

                    <div className="px-2.5 py-1.5 rounded-lg bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 font-medium">
                        <span className="text-[10px] uppercase font-bold">Transaksi:</span>{" "}
                        <span className="font-bold font-mono">{reportData.totalTransactions}</span>
                    </div>

                    <Button onClick={() => setIsFilterOpen(true)} className="gap-2 text-xs py-1.5 px-3 shadow-xs">
                        <Filter className="w-4 h-4" />
                        Buat Laporan / Filter
                    </Button>
                </div>
            </div>

            {/* Table Area */}
            <div className="flex-1 min-h-0 bg-white dark:bg-zinc-900 rounded-xl border border-slate-200/80 dark:border-zinc-800 shadow-2xs overflow-hidden flex flex-col">
                <div className="overflow-x-auto flex-1">
                    {viewMode === 'transaction' ? (
                        <Table>
                            <Thead>
                                <Tr>
                                    <Th>ID Transaksi</Th>
                                    <Th>Tanggal & Waktu</Th>
                                    <Th>Pelanggan</Th>
                                    <Th>Kasir / Staff</Th>
                                    <Th>Saluran</Th>
                                    <Th className="text-right">Total Transaksi</Th>
                                    <Th className="text-center">Struk Nota</Th>
                                </Tr>
                            </Thead>
                            <Tbody>
                                {filteredSales.length === 0 ? (
                                    <Tr>
                                        <Td colSpan={7} className="text-center py-12 text-slate-400">
                                            Tidak ada data transaksi penjualan pada periode ini. Klik "Buat Laporan / Filter" untuk memilih kriteria.
                                        </Td>
                                    </Tr>
                                ) : (
                                    filteredSales.map((sale) => {
                                        const cashierStaff = staff.find(s => s.id === sale.staffId);
                                        return (
                                            <Tr key={sale.id}>
                                                <Td className="font-mono text-xs font-bold text-slate-900 dark:text-white">{sale.id}</Td>
                                                <Td className="text-slate-600 dark:text-slate-400">{new Date(sale.date).toLocaleString('id-ID')}</Td>
                                                <Td className="font-semibold text-slate-800 dark:text-zinc-200">{sale.customerName || 'Pelanggan Umum'}</Td>
                                                <Td className="text-slate-600 dark:text-slate-400">{cashierStaff?.name || '-'}</Td>
                                                <Td>{sale.saleChannel === 'E-commerce' ? <Badge variant="info">E-commerce</Badge> : <Badge variant="success">POS Kasir</Badge>}</Td>
                                                <Td className="text-right font-mono font-bold text-emerald-600 dark:text-emerald-400">
                                                    Rp{sale.grandTotal.toLocaleString('id-ID')}
                                                </Td>
                                                <Td className="text-center">
                                                    <Button 
                                                        onClick={() => setSelectedSaleForReceipt(sale)} 
                                                        variant="secondary" 
                                                        className="text-[11px] py-1 px-2.5 gap-1.5"
                                                    >
                                                        <Eye className="w-3.5 h-3.5" />
                                                        Lihat Nota
                                                    </Button>
                                                </Td>
                                            </Tr>
                                        );
                                    })
                                )}
                            </Tbody>
                        </Table>
                    ) : (
                        <Table>
                            <Thead>
                                <Tr>
                                    <Th>Nama Produk</Th>
                                    <Th className="text-center">Total Terjual (Qty)</Th>
                                    <Th className="text-right">Harga Rata-rata</Th>
                                    <Th className="text-right">Total Pendapatan Produk</Th>
                                </Tr>
                            </Thead>
                            <Tbody>
                                {productBreakdownData.length === 0 ? (
                                    <Tr>
                                        <Td colSpan={4} className="text-center py-12 text-slate-400">
                                            Tidak ada data produk terjual pada periode ini.
                                        </Td>
                                    </Tr>
                                ) : (
                                    productBreakdownData.map((p) => (
                                        <Tr key={p.productId}>
                                            <Td className="font-semibold text-slate-900 dark:text-white">{p.productName}</Td>
                                            <Td className="text-center font-mono font-bold text-blue-600 dark:text-blue-400">{p.quantity}</Td>
                                            <Td className="text-right font-mono text-slate-500">Rp{Math.round(p.avgPrice).toLocaleString('id-ID')}</Td>
                                            <Td className="text-right font-mono font-bold text-emerald-600 dark:text-emerald-400">
                                                Rp{p.totalRevenue.toLocaleString('id-ID')}
                                            </Td>
                                        </Tr>
                                    ))
                                )}
                            </Tbody>
                        </Table>
                    )}
                </div>
            </div>

            {/* Receipt Modal */}
            <Modal
                isOpen={!!selectedSaleForReceipt}
                onClose={() => setSelectedSaleForReceipt(null)}
                title={`Nota Pembayaran #${selectedSaleForReceipt?.id}`}
                maxWidth="max-w-md"
                footer={
                    <div className="flex justify-between items-center w-full">
                        <Button variant="secondary" onClick={() => setSelectedSaleForReceipt(null)}>Tutup</Button>
                        <Button onClick={() => window.print()} className="gap-1.5 bg-blue-600 hover:bg-blue-700 text-white">
                            <Printer className="w-4 h-4" />
                            Cetak Nota
                        </Button>
                    </div>
                }
            >
                {selectedSaleForReceipt && (
                    <div className="p-2 border border-slate-200 rounded-xl bg-white text-black">
                        <Receipt sale={selectedSaleForReceipt} companyInfo={companyInfo} settings={reportLayoutSettings} />
                    </div>
                )}
            </Modal>

            {/* Filter Modal Pop-up */}
            <Modal
                isOpen={isFilterOpen}
                onClose={() => setIsFilterOpen(false)}
                title="Filter & Buat Laporan Penjualan"
                maxWidth="max-w-md"
                footer={
                    <div className="flex justify-end gap-2 w-full">
                        <Button variant="secondary" onClick={() => setIsFilterOpen(false)}>Batal</Button>
                        <Button onClick={handleConfirmFilter} className="gap-1.5">
                            <Filter className="w-4 h-4" />
                            Generate Laporan
                        </Button>
                    </div>
                }
            >
                <div className="space-y-4 text-sm">
                    {/* Filter Mode Selector: Per Hari / Per Sesi / Custom */}
                    <div className="space-y-2">
                        <Label className="font-bold text-slate-800 dark:text-zinc-200 text-xs">Filter Berdasarkan</Label>
                        <Select value={filterPeriodType} onChange={e => setFilterPeriodType(e.target.value as any)} className="text-xs py-1.5">
                            <option value="day">📅 Per Hari (Tanggal Spesifik)</option>
                            <option value="session">🏬 Per Sesi Kasir</option>
                            <option value="custom">📆 Rentang Tanggal (Custom)</option>
                        </Select>
                    </div>

                    {filterPeriodType === 'day' && (
                        <div className="bg-slate-50 dark:bg-zinc-800/60 p-3 rounded-xl border border-slate-200/60 dark:border-zinc-700/60 space-y-1.5">
                            <Label htmlFor="single_date" className="text-xs text-slate-500 font-bold">Pilih Tanggal Hari Ini / Spesifik</Label>
                            <Input id="single_date" type="date" value={selectedSingleDate} onChange={e => setSelectedSingleDate(e.target.value)} className="text-xs py-1.5" />
                        </div>
                    )}

                    {filterPeriodType === 'session' && (
                        <div className="bg-slate-50 dark:bg-zinc-800/60 p-3 rounded-xl border border-slate-200/60 dark:border-zinc-700/60 space-y-1.5">
                            <Label className="text-xs text-slate-500 font-bold">Pilih Sesi Kasir</Label>
                            <Select value={selectedSessionId} onChange={e => setSelectedSessionId(e.target.value)} className="text-xs py-1.5">
                                <option value="all">Semua Sesi Kasir</option>
                                {posSessionSummaries.map(ps => (
                                    <option key={ps.id} value={ps.id}>
                                        Sesi: {ps.cashierName} ({new Date(ps.date).toLocaleString('id-ID')}) - Rp{ps.countedCash.toLocaleString('id-ID')}
                                    </option>
                                ))}
                            </Select>
                        </div>
                    )}

                    {filterPeriodType === 'custom' && (
                        <div className="bg-slate-50 dark:bg-zinc-800/60 p-3 rounded-xl border border-slate-200/60 dark:border-zinc-700/60 space-y-2">
                            <Label className="font-bold text-slate-800 dark:text-zinc-200 text-xs">Periode Tanggal Laporan</Label>
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <Label htmlFor="sales_start" className="text-xs text-slate-500">Tanggal Mulai</Label>
                                    <Input id="sales_start" type="date" value={dateRange.start} onChange={e => setDateRange(prev => ({ ...prev, start: e.target.value }))} className="text-xs py-1.5" />
                                </div>
                                <div>
                                    <Label htmlFor="sales_end" className="text-xs text-slate-500">Tanggal Selesai</Label>
                                    <Input id="sales_end" type="date" value={dateRange.end} onChange={e => setDateRange(prev => ({ ...prev, end: e.target.value }))} className="text-xs py-1.5" />
                                </div>
                            </div>
                        </div>
                    )}

                    <div className="space-y-3 pt-2 border-t border-slate-200 dark:border-zinc-700">
                        <div>
                            <Label className="text-xs font-semibold mb-1">Saluran Penjualan</Label>
                            <Select value={saleChannel} onChange={e => setSaleChannel(e.target.value)} className="text-xs py-1.5">
                                <option value="all">Semua Saluran</option>
                                <option value="POS">POS Kasir</option>
                                <option value="E-commerce">E-commerce</option>
                            </Select>
                        </div>

                        <div>
                            <Label className="text-xs font-semibold mb-1">Kasir / Staff</Label>
                            <Select value={cashierId} onChange={e => setCashierId(e.target.value)} className="text-xs py-1.5">
                                <option value="all">Semua Kasir</option>
                                {staff.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                            </Select>
                        </div>

                        <div>
                            <Label className="text-xs font-semibold mb-1">Tipe Pelanggan</Label>
                            <Select value={customerType} onChange={e => setCustomerType(e.target.value as any)} className="text-xs py-1.5">
                                <option value="all">Semua Pelanggan</option>
                                <option value="Perorangan">Perorangan</option>
                                <option value="Perusahaan">Perusahaan</option>
                            </Select>
                        </div>
                    </div>
                </div>
            </Modal>
        </div>
    );
};

// --- New Reports ---
export const PurchaseReportPage: React.FC = () => {
    const { state } = useAppContext();
    const [filteredPurchases, setFilteredPurchases] = useState<PurchaseOrder[]>([]);

    const today = new Date().toISOString().split('T')[0];
    const pastDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

    const [startDate, setStartDate] = useState(pastDate);
    const [endDate, setEndDate] = useState(today);
    const [isFilterOpen, setIsFilterOpen] = useState(false);

    const handleFilter = (start: string, end: string) => {
        const startD = new Date(start);
        startD.setHours(0, 0, 0, 0);
        const endD = new Date(end);
        endD.setHours(23, 59, 59, 999);
        setFilteredPurchases(state.purchases.filter(p => {
            const pDate = new Date(p.orderDate);
            return pDate >= startD && pDate <= endD;
        }));
    };

    const handleApplyFilter = () => {
        handleFilter(startDate, endDate);
        setIsFilterOpen(false);
    };

    React.useEffect(() => {
        handleFilter(startDate, endDate);
    }, [state.purchases, startDate, endDate]);

    const totalPurchaseValue = filteredPurchases.reduce((sum, p) => sum + p.grandTotal, 0);

    return (
        <div className="w-full h-full flex flex-col p-4 md:p-6 space-y-3 overflow-hidden">
            {/* Header Bar */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 shrink-0">
                <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-xl bg-primary-50 dark:bg-primary-950/60 text-primary-600 dark:text-primary-400 flex items-center justify-center shrink-0">
                        <ShoppingCart className="w-5 h-5" />
                    </div>
                    <div>
                        <h1 className="text-lg font-black text-slate-900 dark:text-white leading-tight">
                            Rekap Pembelian
                        </h1>
                    </div>
                </div>

                <div className="flex items-center gap-2 text-xs shrink-0 self-end sm:self-center">
                    <div className="px-2.5 py-1.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 font-medium">
                        <span className="text-[10px] text-slate-500 dark:text-slate-400 uppercase font-bold">Total Pembelian:</span>{" "}
                        <span className="font-bold font-mono">Rp{totalPurchaseValue.toLocaleString('id-ID')}</span>
                    </div>
                    <div className="px-2.5 py-1.5 rounded-lg bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 font-medium">
                        <span className="text-[10px] uppercase font-bold">Total PO:</span>{" "}
                        <span className="font-bold font-mono">{filteredPurchases.length}</span>
                    </div>

                    <Button onClick={() => setIsFilterOpen(true)} className="gap-2 text-xs py-1.5 px-3 shadow-xs">
                        <Filter className="w-4 h-4" />
                        Buat Laporan / Filter
                    </Button>
                </div>
            </div>

            {/* Table Area */}
            <div className="flex-1 min-h-0 bg-white dark:bg-zinc-900 rounded-xl border border-slate-200/80 dark:border-zinc-800 shadow-2xs overflow-hidden flex flex-col">
                <div className="overflow-x-auto flex-1">
                    <Table>
                        <Thead>
                            <Tr>
                                <Th>ID PO</Th>
                                <Th>Tanggal PO</Th>
                                <Th>Nama Vendor / Supplier</Th>
                                <Th className="text-right">Total Pembelian</Th>
                            </Tr>
                        </Thead>
                        <Tbody>
                            {filteredPurchases.length === 0 ? (
                                <Tr>
                                    <Td colSpan={4} className="text-center py-12 text-slate-400">
                                        Tidak ada data pembelian pada periode ini. Klik "Buat Laporan / Filter" untuk memilih periode.
                                    </Td>
                                </Tr>
                            ) : (
                                filteredPurchases.map(p => (
                                    <Tr key={p.id}>
                                        <Td className="font-mono text-xs font-bold text-slate-900 dark:text-white">{p.id}</Td>
                                        <Td className="text-slate-600 dark:text-slate-400">{new Date(p.orderDate).toLocaleDateString('id-ID')}</Td>
                                        <Td className="font-semibold text-slate-800 dark:text-zinc-200">{p.vendorName}</Td>
                                        <Td className="text-right font-mono font-bold text-emerald-600 dark:text-emerald-400">
                                            Rp{p.grandTotal.toLocaleString('id-ID')}
                                        </Td>
                                    </Tr>
                                ))
                            )}
                        </Tbody>
                    </Table>
                </div>
            </div>

            {/* Pop-up Filter Modal */}
            <Modal
                isOpen={isFilterOpen}
                onClose={() => setIsFilterOpen(false)}
                title="Filter & Buat Laporan Pembelian"
                maxWidth="max-w-md"
                footer={
                    <div className="flex justify-end gap-2 w-full">
                        <Button variant="secondary" onClick={() => setIsFilterOpen(false)}>Batal</Button>
                        <Button onClick={handleApplyFilter} className="gap-1.5">
                            <Filter className="w-4 h-4" />
                            Generate Laporan
                        </Button>
                    </div>
                }
            >
                <div className="space-y-4 text-sm">
                    <div className="bg-slate-50 dark:bg-zinc-800/60 p-3 rounded-xl border border-slate-200/60 dark:border-zinc-700/60 space-y-2">
                        <Label className="font-bold text-slate-800 dark:text-zinc-200 text-xs">Periode Tanggal Laporan</Label>
                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <Label htmlFor="pur_start" className="text-xs text-slate-500">Tanggal Mulai</Label>
                                <Input id="pur_start" type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className="text-xs py-1.5" />
                            </div>
                            <div>
                                <Label htmlFor="pur_end" className="text-xs text-slate-500">Tanggal Selesai</Label>
                                <Input id="pur_end" type="date" value={endDate} onChange={e => setEndDate(e.target.value)} className="text-xs py-1.5" />
                            </div>
                        </div>
                    </div>
                </div>
            </Modal>
        </div>
    );
};

interface ProductPerformance {
    name: string;
    quantity: number;
    revenue: number;
    cost: number;
    profit: number;
}

export const ProductPerformanceReportPage: React.FC = () => {
    const { state } = useAppContext();
    const [reportData, setReportData] = useState<ProductPerformance[]>([]);

    const today = new Date().toISOString().split('T')[0];
    const pastDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

    const [startDate, setStartDate] = useState(pastDate);
    const [endDate, setEndDate] = useState(today);
    const [isFilterOpen, setIsFilterOpen] = useState(false);

    const handleFilter = (start: string, end: string) => {
        const startD = new Date(start);
        startD.setHours(0, 0, 0, 0);
        const endD = new Date(end);
        endD.setHours(23, 59, 59, 999);
        const salesInRange = state.sales.filter(s => {
            const sDate = new Date(s.date);
            return sDate >= startD && sDate <= endD;
        });

        const performance = salesInRange.flatMap(s => s.items).reduce((acc, item) => {
            if (!acc[item.productId]) {
                acc[item.productId] = { name: item.productName, quantity: 0, revenue: 0, cost: 0, profit: 0 };
            }
            const revenue = item.price * item.quantity - item.discount;
            const cost = item.cost * item.quantity;
            acc[item.productId].quantity += item.quantity;
            acc[item.productId].revenue += revenue;
            acc[item.productId].cost += cost;
            acc[item.productId].profit += (revenue - cost);
            return acc;
        }, {} as Record<string, ProductPerformance>);
        setReportData((Object.values(performance) as ProductPerformance[]).sort((a: ProductPerformance, b: ProductPerformance) => b.profit - a.profit));
    };

    const handleApplyFilter = () => {
        handleFilter(startDate, endDate);
        setIsFilterOpen(false);
    };

    React.useEffect(() => {
        handleFilter(startDate, endDate);
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    return (
        <div className="w-full h-full flex flex-col p-4 md:p-6 space-y-3 overflow-hidden">
            {/* Header Bar */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 shrink-0">
                <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-xl bg-primary-50 dark:bg-primary-950/60 text-primary-600 dark:text-primary-400 flex items-center justify-center shrink-0">
                        <Layers className="w-5 h-5" />
                    </div>
                    <div>
                        <h1 className="text-lg font-black text-slate-900 dark:text-white leading-tight">
                            Rekap Performa Produk
                        </h1>
                    </div>
                </div>

                <div className="flex items-center gap-2 text-xs shrink-0 self-end sm:self-center">
                    <div className="px-2.5 py-1.5 rounded-lg bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 font-medium">
                        <span className="text-[10px] text-slate-500 dark:text-slate-400 uppercase font-bold">Produk Teranalisis:</span>{" "}
                        <span className="font-bold font-mono">{reportData.length}</span>
                    </div>

                    <Button onClick={() => setIsFilterOpen(true)} className="gap-2 text-xs py-1.5 px-3 shadow-xs">
                        <Filter className="w-4 h-4" />
                        Buat Laporan / Filter
                    </Button>
                </div>
            </div>

            {/* Table Area */}
            <div className="flex-1 min-h-0 bg-white dark:bg-zinc-900 rounded-xl border border-slate-200/80 dark:border-zinc-800 shadow-2xs overflow-hidden flex flex-col">
                <div className="overflow-x-auto flex-1">
                    <Table>
                        <Thead>
                            <Tr>
                                <Th>Nama Produk</Th>
                                <Th className="text-center">Qty Terjual</Th>
                                <Th className="text-right">Total Pendapatan</Th>
                                <Th className="text-right">Profit / Keuntungan</Th>
                            </Tr>
                        </Thead>
                        <Tbody>
                            {reportData.length === 0 ? (
                                <Tr>
                                    <Td colSpan={4} className="text-center py-12 text-slate-400">
                                        Tidak ada data performa produk pada periode ini. Klik "Buat Laporan / Filter" untuk memilih periode.
                                    </Td>
                                </Tr>
                            ) : (
                                reportData.map(p => (
                                    <Tr key={p.name}>
                                        <Td className="font-semibold text-slate-800 dark:text-zinc-200">{p.name}</Td>
                                        <Td className="text-center font-bold font-mono">{p.quantity}</Td>
                                        <Td className="text-right font-mono">Rp{p.revenue.toLocaleString('id-ID')}</Td>
                                        <Td className="text-right font-mono font-bold text-emerald-600 dark:text-emerald-400">
                                            Rp{p.profit.toLocaleString('id-ID')}
                                        </Td>
                                    </Tr>
                                ))
                            )}
                        </Tbody>
                    </Table>
                </div>
            </div>

            {/* Pop-up Filter Modal */}
            <Modal
                isOpen={isFilterOpen}
                onClose={() => setIsFilterOpen(false)}
                title="Filter & Buat Laporan Performa Produk"
                maxWidth="max-w-md"
                footer={
                    <div className="flex justify-end gap-2 w-full">
                        <Button variant="secondary" onClick={() => setIsFilterOpen(false)}>Batal</Button>
                        <Button onClick={handleApplyFilter} className="gap-1.5">
                            <Filter className="w-4 h-4" />
                            Generate Laporan
                        </Button>
                    </div>
                }
            >
                <div className="space-y-4 text-sm">
                    <div className="bg-slate-50 dark:bg-zinc-800/60 p-3 rounded-xl border border-slate-200/60 dark:border-zinc-700/60 space-y-2">
                        <Label className="font-bold text-slate-800 dark:text-zinc-200 text-xs">Periode Tanggal Laporan</Label>
                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <Label htmlFor="perf_start" className="text-xs text-slate-500">Tanggal Mulai</Label>
                                <Input id="perf_start" type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className="text-xs py-1.5" />
                            </div>
                            <div>
                                <Label htmlFor="perf_end" className="text-xs text-slate-500">Tanggal Selesai</Label>
                                <Input id="perf_end" type="date" value={endDate} onChange={e => setEndDate(e.target.value)} className="text-xs py-1.5" />
                            </div>
                        </div>
                    </div>
                </div>
            </Modal>
        </div>
    );
};

export const CashierDepositReportPage: React.FC = () => {
    const { state, dispatch } = useAppContext();
    const { posSessionSummaries, sales, accounts, currentUser, companyInfo, reportLayoutSettings } = state;
    const [filteredSummaries, setFilteredSummaries] = useState<PosSessionSummary[]>([]);

    const today = new Date().toISOString().split('T')[0];
    const pastDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

    const [startDate, setStartDate] = useState(pastDate);
    const [endDate, setEndDate] = useState(today);
    const [isFilterOpen, setIsFilterOpen] = useState(false);

    // Modal verification state
    const [selectedSummary, setSelectedSummary] = useState<PosSessionSummary | null>(null);
    const [targetAccountId, setTargetAccountId] = useState<string>('');

    // Session Transaction List Modal state
    const [viewingSession, setViewingSession] = useState<PosSessionSummary | null>(null);
    const [selectedSaleForReceipt, setSelectedSaleForReceipt] = useState<Sale | null>(null);

    const userIsCashier = currentUser?.roleId === 'kasir.toko';
    const cashAccounts = useMemo(() => accounts.filter(a => a.isCashAccount && a.id !== '1010'), [accounts]);

    const handleFilter = (start: string, end: string) => {
        const startD = new Date(start);
        startD.setHours(0, 0, 0, 0);
        const endD = new Date(end);
        endD.setHours(23, 59, 59, 999);
        let summaries = posSessionSummaries.filter(s => {
            const sDate = new Date(s.date);
            return sDate >= startD && sDate <= endD;
        });
        if (userIsCashier) {
            summaries = summaries.filter(s => s.cashierId === currentUser.id);
        }
        setFilteredSummaries(summaries);
    };

    const handleApplyFilter = () => {
        handleFilter(startDate, endDate);
        setIsFilterOpen(false);
    };

    const handleOpenVerifyModal = (summary: PosSessionSummary) => {
        setSelectedSummary(summary);
        const defaultAcc = cashAccounts.find(a => a.id !== '1010')?.id || cashAccounts[0]?.id || '1020';
        setTargetAccountId(summary.depositToAccountId || defaultAcc);
    };

    const handleConfirmVerification = () => {
        if (!selectedSummary) return;
        dispatch({
            type: 'finance/verifyCashierDeposit',
            payload: {
                summaryId: selectedSummary.id,
                depositToAccountId: targetAccountId
            }
        });
        setSelectedSummary(null);
    };

    // Calculate sales belonging to the clicked session
    const sessionSales = useMemo(() => {
        if (!viewingSession) return [];
        const sessTime = new Date(viewingSession.date).getTime();
        return sales.filter(s => {
            const sTime = new Date(s.date).getTime();
            const isSameCashier = s.staffId === viewingSession.cashierId || !s.staffId;
            return isSameCashier && Math.abs(sTime - sessTime) <= 24 * 60 * 60 * 1000;
        });
    }, [viewingSession, sales]);

    React.useEffect(() => {
        handleFilter(startDate, endDate);
    }, [posSessionSummaries, startDate, endDate]);

    return (
        <div className="w-full h-full flex flex-col p-4 md:p-6 space-y-3 overflow-hidden">
            {/* Header Bar */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 shrink-0">
                <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-xl bg-primary-50 dark:bg-primary-950/60 text-primary-600 dark:text-primary-400 flex items-center justify-center shrink-0">
                        <Wallet className="w-5 h-5" />
                    </div>
                    <div>
                        <h1 className="text-lg font-black text-slate-900 dark:text-white leading-tight">
                            Rekap Setoran Kasir
                        </h1>
                    </div>
                </div>

                <div className="shrink-0">
                    <Button onClick={() => setIsFilterOpen(true)} className="gap-2 text-xs py-1.5 px-3 shadow-xs">
                        <Filter className="w-4 h-4" />
                        Buat Laporan / Filter
                    </Button>
                </div>
            </div>

            {/* Table Area */}
            <div className="flex-1 min-h-0 bg-white dark:bg-zinc-900 rounded-xl border border-slate-200/80 dark:border-zinc-800 shadow-2xs overflow-hidden flex flex-col">
                <div className="overflow-x-auto flex-1">
                    <Table>
                        <Thead>
                            <Tr>
                                <Th>Tanggal Sesi</Th>
                                <Th>Kasir</Th>
                                <Th className="text-right">Kas Dihitung</Th>
                                <Th className="text-right">Kas Seharusnya</Th>
                                <Th className="text-right">Selisih</Th>
                                <Th className="text-center">Tujuan Dompet / Kas</Th>
                                <Th className="text-center">Status</Th>
                                <Th className="text-right">Aksi</Th>
                            </Tr>
                        </Thead>
                        <Tbody>
                            {filteredSummaries.length === 0 ? (
                                <Tr>
                                    <Td colSpan={8} className="text-center py-12 text-slate-400">
                                        Tidak ada data setoran kasir pada periode ini. Klik "Buat Laporan / Filter" untuk memilih periode.
                                    </Td>
                                </Tr>
                            ) : (
                                filteredSummaries.map(s => {
                                    const destAccount = accounts.find(a => a.id === s.depositToAccountId);
                                    return (
                                        <Tr 
                                            key={s.id}
                                            className="hover:bg-slate-50/80 dark:hover:bg-zinc-800/50 cursor-pointer transition-colors"
                                            onClick={() => setViewingSession(s)}
                                        >
                                            <Td className="text-slate-600 dark:text-slate-400 font-medium">
                                                {new Date(s.date).toLocaleString('id-ID')}
                                            </Td>
                                            <Td className="font-semibold text-slate-800 dark:text-zinc-200">{s.cashierName}</Td>
                                            <Td className="text-right font-mono font-bold">Rp{s.countedCash.toLocaleString('id-ID')}</Td>
                                            <Td className="text-right font-mono text-slate-500">Rp{s.expectedCash.toLocaleString('id-ID')}</Td>
                                            <Td className={`text-right font-mono font-bold ${s.variance < 0 ? 'text-rose-600' : 'text-emerald-600'}`}>
                                                Rp{s.variance.toLocaleString('id-ID')}
                                            </Td>
                                            <Td className="text-center text-xs font-medium">
                                                {destAccount ? (
                                                    <span className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-zinc-800 text-slate-700 dark:text-zinc-300 font-mono">
                                                        🏦 {destAccount.name}
                                                    </span>
                                                ) : (
                                                    <span className="text-slate-400 italic">-</span>
                                                )}
                                            </Td>
                                            <Td className="text-center">
                                                {s.status === 'verified' ? <Badge variant="success">Terverifikasi</Badge> : <Badge variant="warning">Pending</Badge>}
                                            </Td>
                                            <Td className="text-right" onClick={e => e.stopPropagation()}>
                                                <div className="flex items-center justify-end gap-1.5">
                                                    <Button
                                                        onClick={() => setViewingSession(s)}
                                                        variant="secondary"
                                                        className="text-[11px] py-1 px-2.5 shadow-2xs gap-1"
                                                    >
                                                        <Eye className="w-3.5 h-3.5" />
                                                        List Transaksi
                                                    </Button>
                                                    <Button 
                                                        onClick={() => handleOpenVerifyModal(s)}
                                                        variant={s.status === 'verified' ? 'secondary' : 'primary'}
                                                        className="text-[11px] py-1 px-2.5 shadow-2xs"
                                                    >
                                                        {s.status === 'verified' ? 'Ubah Dompet' : 'Validasi Setoran'}
                                                    </Button>
                                                </div>
                                            </Td>
                                        </Tr>
                                    );
                                })
                            )}
                        </Tbody>
                    </Table>
                </div>
            </div>

            {/* Session Transaction List Modal */}
            <Modal
                isOpen={!!viewingSession}
                onClose={() => setViewingSession(null)}
                title={`Daftar Transaksi Sesi Kasir (${viewingSession?.cashierName} - ${viewingSession ? new Date(viewingSession.date).toLocaleString('id-ID') : ''})`}
                maxWidth="max-w-3xl"
                footer={
                    <div className="flex justify-end gap-2 w-full">
                        <Button variant="secondary" onClick={() => setViewingSession(null)}>Tutup</Button>
                    </div>
                }
            >
                {viewingSession && (
                    <div className="space-y-3">
                        <div className="bg-slate-50 dark:bg-zinc-800/60 p-3 rounded-xl border border-slate-200/60 dark:border-zinc-700/60 flex flex-wrap justify-between items-center text-xs">
                            <div>
                                <span className="text-slate-500">Kasir Sesi: </span>
                                <strong className="text-slate-900 dark:text-white">{viewingSession.cashierName}</strong>
                            </div>
                            <div>
                                <span className="text-slate-500">Total Kas Dihitung: </span>
                                <strong className="font-mono text-emerald-600 dark:text-emerald-400">Rp{viewingSession.countedCash.toLocaleString('id-ID')}</strong>
                            </div>
                            <div>
                                <span className="text-slate-500">Jumlah Transaksi: </span>
                                <strong className="font-mono text-blue-600 dark:text-blue-400">{sessionSales.length} Transaksi</strong>
                            </div>
                        </div>

                        <div className="overflow-x-auto max-h-[350px] border border-slate-200 dark:border-zinc-800 rounded-xl">
                            <Table>
                                <Thead>
                                    <Tr>
                                        <Th>ID Transaksi</Th>
                                        <Th>Waktu</Th>
                                        <Th>Pelanggan</Th>
                                        <Th className="text-right font-mono">Total (Rp)</Th>
                                        <Th className="text-center">Nota / Struk</Th>
                                    </Tr>
                                </Thead>
                                <Tbody>
                                    {sessionSales.length === 0 ? (
                                        <Tr>
                                            <Td colSpan={5} className="text-center py-8 text-slate-400">
                                                Tidak ada transaksi yang tercatat dalam sesi ini.
                                            </Td>
                                        </Tr>
                                    ) : (
                                        sessionSales.map(sale => (
                                            <Tr 
                                                key={sale.id}
                                                className="hover:bg-slate-50 dark:hover:bg-zinc-800/50 cursor-pointer"
                                                onClick={() => setSelectedSaleForReceipt(sale)}
                                            >
                                                <Td className="font-mono text-xs font-bold text-slate-900 dark:text-white">{sale.id}</Td>
                                                <Td className="text-slate-600 dark:text-slate-400">{new Date(sale.date).toLocaleTimeString('id-ID')}</Td>
                                                <Td className="font-semibold text-slate-800 dark:text-zinc-200">{sale.customerName || 'Pelanggan Umum'}</Td>
                                                <Td className="text-right font-mono font-bold text-emerald-600 dark:text-emerald-400">
                                                    Rp{sale.grandTotal.toLocaleString('id-ID')}
                                                </Td>
                                                <Td className="text-center" onClick={e => e.stopPropagation()}>
                                                    <Button
                                                        onClick={() => setSelectedSaleForReceipt(sale)}
                                                        variant="secondary"
                                                        className="text-[11px] py-1 px-2.5 gap-1.5"
                                                    >
                                                        <Eye className="w-3.5 h-3.5 text-blue-600" />
                                                        Tampilkan Nota
                                                    </Button>
                                                </Td>
                                            </Tr>
                                        ))
                                    )}
                                </Tbody>
                            </Table>
                        </div>
                    </div>
                )}
            </Modal>

            {/* Receipt Modal */}
            <Modal
                isOpen={!!selectedSaleForReceipt}
                onClose={() => setSelectedSaleForReceipt(null)}
                title={`Nota Pembayaran #${selectedSaleForReceipt?.id}`}
                maxWidth="max-w-md"
                footer={
                    <div className="flex justify-between items-center w-full">
                        <Button variant="secondary" onClick={() => setSelectedSaleForReceipt(null)}>Tutup</Button>
                        <Button onClick={() => window.print()} className="gap-1.5 bg-blue-600 hover:bg-blue-700 text-white">
                            <Printer className="w-4 h-4" />
                            Cetak Nota
                        </Button>
                    </div>
                }
            >
                {selectedSaleForReceipt && (
                    <div className="p-2 border border-slate-200 rounded-xl bg-white text-black">
                        <Receipt sale={selectedSaleForReceipt} companyInfo={companyInfo} settings={reportLayoutSettings} />
                    </div>
                )}
            </Modal>

            {/* Pop-up Filter Modal */}
            <Modal
                isOpen={isFilterOpen}
                onClose={() => setIsFilterOpen(false)}
                title="Filter & Buat Laporan Setoran Kasir"
                maxWidth="max-w-md"
                footer={
                    <div className="flex justify-end gap-2 w-full">
                        <Button variant="secondary" onClick={() => setIsFilterOpen(false)}>Batal</Button>
                        <Button onClick={handleApplyFilter} className="gap-1.5">
                            <Filter className="w-4 h-4" />
                            Generate Laporan
                        </Button>
                    </div>
                }
            >
                <div className="space-y-4 text-sm">
                    <div className="bg-slate-50 dark:bg-zinc-800/60 p-3 rounded-xl border border-slate-200/60 dark:border-zinc-700/60 space-y-2">
                        <Label className="font-bold text-slate-800 dark:text-zinc-200 text-xs">Periode Tanggal Laporan</Label>
                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <Label htmlFor="dep_start" className="text-xs text-slate-500">Tanggal Mulai</Label>
                                <Input id="dep_start" type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className="text-xs py-1.5" />
                            </div>
                            <div>
                                <Label htmlFor="dep_end" className="text-xs text-slate-500">Tanggal Selesai</Label>
                                <Input id="dep_end" type="date" value={endDate} onChange={e => setEndDate(e.target.value)} className="text-xs py-1.5" />
                            </div>
                        </div>
                    </div>
                </div>
            </Modal>

            {/* Verification / Wallet Adjust Modal */}
            <Modal
                isOpen={!!selectedSummary}
                onClose={() => setSelectedSummary(null)}
                title="Validasi & Adjust Dompet Setoran Kasir"
                maxWidth="max-w-md"
                footer={
                    <div className="flex justify-end gap-2 w-full">
                        <Button variant="secondary" onClick={() => setSelectedSummary(null)}>Batal</Button>
                        <Button onClick={handleConfirmVerification} className="gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white">
                            <CheckCircle2 className="w-4 h-4" />
                            Simpan & Validasi
                        </Button>
                    </div>
                }
            >
                {selectedSummary && (
                    <div className="space-y-4 text-xs">
                        <div className="bg-slate-50 dark:bg-zinc-800/60 p-3 rounded-xl border border-slate-200/60 dark:border-zinc-700/60 space-y-1.5">
                            <div className="flex justify-between">
                                <span className="text-slate-500">Kasir:</span>
                                <span className="font-bold text-slate-900 dark:text-white">{selectedSummary.cashierName}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-slate-500">Tanggal Sesi:</span>
                                <span className="font-mono text-slate-700 dark:text-zinc-300">{new Date(selectedSummary.date).toLocaleString('id-ID')}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-slate-500">Nominal Kas Dihitung:</span>
                                <span className="font-mono font-black text-emerald-600 dark:text-emerald-400">Rp{selectedSummary.countedCash.toLocaleString('id-ID')}</span>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label className="font-bold text-slate-800 dark:text-zinc-200">
                                Pilih Dompet / Rekening Tujuan Penyetoran
                            </Label>
                            <Select
                                value={targetAccountId}
                                onChange={e => setTargetAccountId(e.target.value)}
                                className="w-full text-xs py-2"
                            >
                                {cashAccounts.map(account => (
                                    <option key={account.id} value={account.id}>
                                        🏦 {account.name} ({account.cashAccountType || 'Kas'})
                                    </option>
                                ))}
                            </Select>
                            <p className="text-[11px] text-slate-500 italic">
                                Uang tunai setoran kasir akan otomatis disesuaikan (*adjust*) dan dibukukan ke akun/dompet yang dipilih di atas.
                            </p>
                        </div>
                    </div>
                )}
            </Modal>
        </div>
    );
};


// --- Product Stock Report ---

interface ProductStockInfo {
    productName: string;
    startStock: number;
    stockIn: number;
    stockOut: number;
    endStock: number;
}

export const ProductStockReport: React.FC = () => {
    const { state } = useAppContext();
    const { products, stockMovements, currentBranchId } = state;
    const [reportData, setReportData] = useState<ProductStockInfo[]>([]);

    const today = new Date().toISOString().split('T')[0];
    const pastDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

    const [startDate, setStartDate] = useState(pastDate);
    const [endDate, setEndDate] = useState(today);
    const [isFilterOpen, setIsFilterOpen] = useState(false);

    const handleFilter = (start: string, end: string) => {
        const startD = new Date(start);
        startD.setHours(0, 0, 0, 0);
        const endD = new Date(end);
        endD.setHours(23, 59, 59, 999);
        
        const branchMovements = currentBranchId 
            ? stockMovements.filter(m => m.locationId === currentBranchId)
            : stockMovements;

        const data: ProductStockInfo[] = products.map(product => {
            const productMovements = branchMovements.filter(m => m.productId === product.id);
            
            const movementsBefore = productMovements.filter(m => new Date(m.date) < startD);
            const movementsDuring = productMovements.filter(m => {
                const mDate = new Date(m.date);
                return mDate >= startD && mDate <= endD;
            });

            // Base stock is initialStock or total movement history
            const baseStock = product.initialStock || 0;
            const startStock = baseStock + movementsBefore.reduce((sum, m) => sum + m.quantityChange, 0);
            const stockIn = movementsDuring.filter(m => m.quantityChange > 0).reduce((sum, m) => sum + m.quantityChange, 0);
            const stockOut = movementsDuring.filter(m => m.quantityChange < 0).reduce((sum, m) => sum + m.quantityChange, 0);
            const endStock = startStock + stockIn + stockOut;

            return {
                productName: product.name,
                startStock,
                stockIn,
                stockOut,
                endStock,
            };
        });
        setReportData(data);
    };

    const handleApplyFilter = () => {
        handleFilter(startDate, endDate);
        setIsFilterOpen(false);
    };

    React.useEffect(() => {
        handleFilter(startDate, endDate);
    }, [products, stockMovements, currentBranchId, startDate, endDate]);
    
    return (
        <div className="w-full h-full flex flex-col p-4 md:p-6 space-y-3 overflow-hidden">
            {/* Header Bar */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 shrink-0">
                <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-xl bg-primary-50 dark:bg-primary-950/60 text-primary-600 dark:text-primary-400 flex items-center justify-center shrink-0">
                        <ArrowRightLeft className="w-5 h-5" />
                    </div>
                    <div>
                        <h1 className="text-lg font-black text-slate-900 dark:text-white leading-tight">
                            Laporan Stok Produk
                        </h1>
                    </div>
                </div>

                <div className="shrink-0">
                    <Button onClick={() => setIsFilterOpen(true)} className="gap-2 text-xs py-1.5 px-3 shadow-xs">
                        <Filter className="w-4 h-4" />
                        Buat Laporan / Filter
                    </Button>
                </div>
            </div>

            {/* Table Area */}
            <div className="flex-1 min-h-0 bg-white dark:bg-zinc-900 rounded-xl border border-slate-200/80 dark:border-zinc-800 shadow-2xs overflow-hidden flex flex-col">
                <div className="overflow-x-auto flex-1">
                    <Table>
                        <Thead>
                            <Tr>
                                <Th>Nama Produk</Th>
                                <Th className="text-center">Stok Awal</Th>
                                <Th className="text-center">Masuk</Th>
                                <Th className="text-center">Keluar</Th>
                                <Th className="text-center">Stok Akhir</Th>
                            </Tr>
                        </Thead>
                        <Tbody>
                            {reportData.length === 0 ? (
                                <Tr>
                                    <Td colSpan={5} className="text-center py-12 text-slate-400">
                                        Tidak ada pergerakan stok pada periode ini. Klik "Buat Laporan / Filter" untuk memilih periode.
                                    </Td>
                                </Tr>
                            ) : (
                                reportData.map((data, index) => (
                                    <Tr key={index}>
                                        <Td className="font-semibold text-slate-900 dark:text-white">{data.productName}</Td>
                                        <Td className="text-center font-mono">{data.startStock}</Td>
                                        <Td className="text-center font-mono font-bold text-emerald-600 dark:text-emerald-400">+{data.stockIn}</Td>
                                        <Td className="text-center font-mono font-bold text-rose-600 dark:text-rose-400">{data.stockOut}</Td>
                                        <Td className="text-center font-mono font-bold text-slate-900 dark:text-white">{data.endStock}</Td>
                                    </Tr>
                                ))
                            )}
                        </Tbody>
                    </Table>
                </div>
            </div>

            {/* Pop-up Filter Modal */}
            <Modal
                isOpen={isFilterOpen}
                onClose={() => setIsFilterOpen(false)}
                title="Filter & Buat Laporan Mutasi Stok"
                maxWidth="max-w-md"
                footer={
                    <div className="flex justify-end gap-2 w-full">
                        <Button variant="secondary" onClick={() => setIsFilterOpen(false)}>Batal</Button>
                        <Button onClick={handleApplyFilter} className="gap-1.5">
                            <Filter className="w-4 h-4" />
                            Generate Laporan
                        </Button>
                    </div>
                }
            >
                <div className="space-y-4 text-sm">
                    <div className="bg-slate-50 dark:bg-zinc-800/60 p-3 rounded-xl border border-slate-200/60 dark:border-zinc-700/60 space-y-2">
                        <Label className="font-bold text-slate-800 dark:text-zinc-200 text-xs">Periode Tanggal Laporan</Label>
                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <Label htmlFor="stk_start" className="text-xs text-slate-500">Tanggal Mulai</Label>
                                <Input id="stk_start" type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className="text-xs py-1.5" />
                            </div>
                            <div>
                                <Label htmlFor="stk_end" className="text-xs text-slate-500">Tanggal Selesai</Label>
                                <Input id="stk_end" type="date" value={endDate} onChange={e => setEndDate(e.target.value)} className="text-xs py-1.5" />
                            </div>
                        </div>
                    </div>
                </div>
            </Modal>
        </div>
    );
};


// --- Income Statement Report ---
export const IncomeStatementReport: React.FC = () => {
    const { state } = useAppContext();
    const { journalEntries, accounts, currentBranchId } = state;

    const today = new Date().toISOString().split('T')[0];
    const pastDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

    const [startDate, setStartDate] = useState(pastDate);
    const [endDate, setEndDate] = useState(today);
    const [isFilterOpen, setIsFilterOpen] = useState(false);

    const [reportData, setReportData] = useState<{
        revenue: number,
        cogs: number,
        grossProfit: number,
        expenses: number,
        netIncome: number
    } | null>(null);

    const handleFilter = (start: string, end: string) => {
        const startD = new Date(start);
        startD.setHours(0, 0, 0, 0);
        const endD = new Date(end);
        endD.setHours(23, 59, 59, 999);
        
        const entriesInDateRange = journalEntries.filter(entry => {
            const entryDate = new Date(entry.date);
            const isInDate = entryDate >= startD && entryDate <= endD;
            const isInBranch = !currentBranchId || entry.branchId === currentBranchId;
            return isInDate && isInBranch;
        });

        let revenue = 0;
        let cogs = 0;
        let expenses = 0;
        
        entriesInDateRange.forEach(entry => {
            entry.lines.forEach(line => {
                const account = accounts.find(a => a.id === line.accountId);
                if (account) {
                    const amount = line.type === 'credit' ? line.amount : -line.amount;
                    if (account.type === AccountType.Revenue) revenue -= amount;
                    if (account.id === '5010') cogs -= amount;
                    if (account.type === AccountType.Expense && account.id !== '5010') expenses -= amount;
                }
            });
        });
        
        const grossProfit = revenue - cogs;
        const netIncome = grossProfit - expenses;
        setReportData({ revenue, cogs, grossProfit, expenses, netIncome });
    };

    const handleApplyFilter = () => {
        handleFilter(startDate, endDate);
        setIsFilterOpen(false);
    };

    React.useEffect(() => {
        handleFilter(startDate, endDate);
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const grossMarginPercent = reportData && reportData.revenue > 0 
        ? ((reportData.grossProfit / reportData.revenue) * 100).toFixed(1) 
        : '0.0';
    const netMarginPercent = reportData && reportData.revenue > 0 
        ? ((reportData.netIncome / reportData.revenue) * 100).toFixed(1) 
        : '0.0';

    return (
        <div className="w-full h-full flex flex-col p-4 md:p-6 space-y-4 overflow-hidden">
            {/* Header Bar */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 shrink-0">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-primary-500 to-indigo-600 text-white flex items-center justify-center shadow-xs shrink-0">
                        <FileText className="w-5 h-5" />
                    </div>
                    <div>
                        <h1 className="text-xl font-black text-slate-900 dark:text-white leading-tight">
                            Laporan Laba Rugi
                        </h1>
                    </div>
                </div>

                <div className="flex flex-wrap items-center gap-2 text-xs shrink-0 self-end sm:self-center">
                    {reportData && (
                        <>
                            <div className="px-3 py-1.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200/60 dark:border-emerald-800/60 text-emerald-700 dark:text-emerald-300 font-medium">
                                <span className="text-[10px] text-slate-500 dark:text-slate-400 uppercase font-bold">Pendapatan:</span>{" "}
                                <span className="font-bold font-mono">Rp{reportData.revenue.toLocaleString('id-ID')}</span>
                            </div>

                            <div className="px-3 py-1.5 rounded-xl bg-indigo-50 dark:bg-indigo-950/50 border border-indigo-200/60 dark:border-indigo-800/60 text-indigo-700 dark:text-indigo-300 font-medium">
                                <span className="text-[10px] uppercase font-bold">Laba Bersih:</span>{" "}
                                <span className="font-bold font-mono">Rp{reportData.netIncome.toLocaleString('id-ID')}</span>
                            </div>
                        </>
                    )}

                    <Button onClick={() => setIsFilterOpen(true)} className="gap-2 text-xs py-1.5 px-3.5 shadow-xs">
                        <Filter className="w-4 h-4" />
                        Buat Laporan / Filter
                    </Button>
                </div>
            </div>

            {/* Mode Sederhana Notice */}
            {state.businessSettings?.trackHppAndProfit === false && (
                <div className="bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/60 rounded-xl p-3 flex items-center justify-between text-xs text-amber-900 dark:text-amber-200 shrink-0">
                    <div className="flex items-center gap-2">
                        <span className="text-base">🏬</span>
                        <div>
                            <span className="font-bold">Mode Bisnis Sederhana Aktif:</span> Perhitungan modal produk (HPP) dinonaktifkan. Laporan dioptimalkan untuk Total Omset Penjualan &amp; Arus Kas Masuk.
                        </div>
                    </div>
                </div>
            )}

            {/* Content Area */}
            {reportData && (
                <div className="flex-1 min-h-0 overflow-y-auto space-y-4 pr-1">
                    {/* Metric Cards Grid */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        <div className="bg-white dark:bg-zinc-900 p-3.5 rounded-2xl border border-slate-200/80 dark:border-zinc-800 shadow-2xs flex items-center justify-between">
                            <div>
                                <span className="text-[11px] font-bold text-slate-500 dark:text-zinc-400 uppercase tracking-wide">Marjin Laba Kotor</span>
                                <div className="text-xl font-black text-slate-900 dark:text-white font-mono mt-0.5">{grossMarginPercent}%</div>
                            </div>
                            <div className="w-9 h-9 rounded-xl bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 flex items-center justify-center font-bold text-xs">
                                <Percent className="w-4 h-4" />
                            </div>
                        </div>

                        <div className="bg-white dark:bg-zinc-900 p-3.5 rounded-2xl border border-slate-200/80 dark:border-zinc-800 shadow-2xs flex items-center justify-between">
                            <div>
                                <span className="text-[11px] font-bold text-slate-500 dark:text-zinc-400 uppercase tracking-wide">Marjin Laba Bersih</span>
                                <div className="text-xl font-black text-emerald-600 dark:text-emerald-400 font-mono mt-0.5">{netMarginPercent}%</div>
                            </div>
                            <div className="w-9 h-9 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold text-xs">
                                <TrendingUp className="w-4 h-4" />
                            </div>
                        </div>

                        <div className="bg-white dark:bg-zinc-900 p-3.5 rounded-2xl border border-slate-200/80 dark:border-zinc-800 shadow-2xs flex items-center justify-between">
                            <div>
                                <span className="text-[11px] font-bold text-slate-500 dark:text-zinc-400 uppercase tracking-wide">Total Beban Usaha</span>
                                <div className="text-xl font-black text-rose-600 dark:text-rose-400 font-mono mt-0.5">
                                    Rp{(reportData.cogs + reportData.expenses).toLocaleString('id-ID')}
                                </div>
                            </div>
                            <div className="w-9 h-9 rounded-xl bg-rose-50 dark:bg-rose-950/50 text-rose-600 dark:text-rose-400 flex items-center justify-center font-bold text-xs">
                                <DollarSign className="w-4 h-4" />
                            </div>
                        </div>
                    </div>

                    {/* Detailed Income Statement Breakdown Card */}
                    <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-slate-200/80 dark:border-zinc-800 shadow-2xs overflow-hidden">
                        <div className="px-5 py-3.5 bg-slate-50/70 dark:bg-zinc-800/40 border-b border-slate-200/80 dark:border-zinc-800 flex justify-between items-center">
                            <h3 className="font-bold text-slate-900 dark:text-white text-sm flex items-center gap-2">
                                <FileText className="w-4 h-4 text-primary-500" />
                                Rincian Laporan Laba Rugi
                            </h3>
                            <span className="text-xs text-slate-500 dark:text-zinc-400 font-mono">
                                Periode: {new Date(startDate).toLocaleDateString('id-ID')} - {new Date(endDate).toLocaleDateString('id-ID')}
                            </span>
                        </div>

                        <div className="p-5 space-y-4 text-sm">
                            {/* Section 1: Pendapatan */}
                            <div className="space-y-2">
                                <div className="flex justify-between items-center font-bold text-slate-900 dark:text-white pb-1 border-b border-slate-100 dark:border-zinc-800 text-xs uppercase tracking-wider text-primary-600 dark:text-primary-400">
                                    <span>Pendapatan Usaha</span>
                                    <span>Nominal</span>
                                </div>
                                <div className="flex justify-between items-center py-1.5 px-3 rounded-lg hover:bg-slate-50 dark:hover:bg-zinc-800/50 text-slate-700 dark:text-zinc-300">
                                    <span>Penjualan Bersih & Pendapatan Operasional</span>
                                    <span className="font-mono font-semibold text-slate-900 dark:text-white">Rp{reportData.revenue.toLocaleString('id-ID')}</span>
                                </div>
                            </div>

                            {/* Section 2: HPP */}
                            <div className="space-y-2">
                                <div className="flex justify-between items-center font-bold text-slate-900 dark:text-white pb-1 border-b border-slate-100 dark:border-zinc-800 text-xs uppercase tracking-wider text-rose-600 dark:text-rose-400">
                                    <span>Beban Pokok Penjualan (HPP)</span>
                                    <span>Nominal</span>
                                </div>
                                <div className="flex justify-between items-center py-1.5 px-3 rounded-lg hover:bg-slate-50 dark:hover:bg-zinc-800/50 text-slate-700 dark:text-zinc-300">
                                    <span>Harga Pokok Penjualan Produk (COGS)</span>
                                    <span className="font-mono text-rose-600 dark:text-rose-400">(Rp{reportData.cogs.toLocaleString('id-ID')})</span>
                                </div>
                            </div>

                            {/* Subtotal: Laba Kotor */}
                            <div className="flex justify-between items-center py-3 px-4 rounded-xl bg-blue-50/70 dark:bg-blue-950/40 border border-blue-200/70 dark:border-blue-800/60 font-bold text-blue-900 dark:text-blue-200">
                                <span className="text-sm">LABA KOTOR (GROSS PROFIT)</span>
                                <span className="font-mono text-base">Rp{reportData.grossProfit.toLocaleString('id-ID')}</span>
                            </div>

                            {/* Section 3: Beban Operasional */}
                            <div className="space-y-2 pt-2">
                                <div className="flex justify-between items-center font-bold text-slate-900 dark:text-white pb-1 border-b border-slate-100 dark:border-zinc-800 text-xs uppercase tracking-wider text-amber-600 dark:text-amber-400">
                                    <span>Beban Operasional & Lain-lain</span>
                                    <span>Nominal</span>
                                </div>
                                <div className="flex justify-between items-center py-1.5 px-3 rounded-lg hover:bg-slate-50 dark:hover:bg-zinc-800/50 text-slate-700 dark:text-zinc-300">
                                    <span>Beban Gaji, Listrik, Sewa, & Operasional Toko</span>
                                    <span className="font-mono text-rose-600 dark:text-rose-400">(Rp{reportData.expenses.toLocaleString('id-ID')})</span>
                                </div>
                            </div>

                            {/* Hero Highlight: Laba Bersih */}
                            <div className="pt-3">
                                <div className="flex justify-between items-center py-4 px-5 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 dark:from-emerald-700 dark:to-teal-800 text-white shadow-md">
                                    <div>
                                        <div className="text-xs uppercase font-bold text-emerald-100 tracking-wider">HASIL AKHIR PERIODE</div>
                                        <div className="text-lg font-black mt-0.5">LABA / (RUGI) BERSIH</div>
                                    </div>
                                    <div className="text-2xl font-black font-mono tracking-tight">
                                        Rp{reportData.netIncome.toLocaleString('id-ID')}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Pop-up Filter Modal */}
            <Modal
                isOpen={isFilterOpen}
                onClose={() => setIsFilterOpen(false)}
                title="Filter & Buat Laporan Laba Rugi"
                maxWidth="max-w-md"
                footer={
                    <div className="flex justify-end gap-2 w-full">
                        <Button variant="secondary" onClick={() => setIsFilterOpen(false)}>Batal</Button>
                        <Button onClick={handleApplyFilter} className="gap-1.5">
                            <Filter className="w-4 h-4" />
                            Generate Laporan
                        </Button>
                    </div>
                }
            >
                <div className="space-y-4 text-sm">
                    <div className="bg-slate-50 dark:bg-zinc-800/60 p-3 rounded-xl border border-slate-200/60 dark:border-zinc-700/60 space-y-2">
                        <Label className="font-bold text-slate-800 dark:text-zinc-200 text-xs">Periode Tanggal Laporan</Label>
                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <Label htmlFor="inc_start" className="text-xs text-slate-500">Tanggal Mulai</Label>
                                <Input id="inc_start" type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className="text-xs py-1.5" />
                            </div>
                            <div>
                                <Label htmlFor="inc_end" className="text-xs text-slate-500">Tanggal Selesai</Label>
                                <Input id="inc_end" type="date" value={endDate} onChange={e => setEndDate(e.target.value)} className="text-xs py-1.5" />
                            </div>
                        </div>
                    </div>
                </div>
            </Modal>
        </div>
    );
};

export const FinancialPositionReportPage: React.FC = () => {
    const { state } = useAppContext();
    const { accounts, currentBranchId } = state;

    const today = new Date().toISOString().split('T')[0];
    const [asOfDate, setAsOfDate] = useState(today);
    const [isFilterOpen, setIsFilterOpen] = useState(false);

    const reportData = useMemo(() => {
        const branchAccounts = currentBranchId 
            ? accounts.filter(a => a.branchId === currentBranchId || !a.branchId)
            : accounts;

        const assets = branchAccounts.filter(a => a.type === AccountType.Asset).reduce((sum, a) => sum + a.balance, 0);
        const liabilities = branchAccounts.filter(a => a.type === AccountType.Liability).reduce((sum, a) => sum + Math.abs(a.balance), 0);
        const equity = branchAccounts.filter(a => a.type === AccountType.Equity).reduce((sum, a) => sum + Math.abs(a.balance), 0);

        // Net income = Revenue (credit-normal, stored as negative) - Expenses (debit-normal, stored as positive)
        // Revenue accounts have negative balance (credits reduce balance in our system)
        const revenueTotal = branchAccounts.filter(a => a.type === AccountType.Revenue).reduce((sum, a) => sum + Math.abs(a.balance), 0);
        const expenseTotal = branchAccounts.filter(a => a.type === AccountType.Expense).reduce((sum, a) => sum + a.balance, 0);
        const netIncome = revenueTotal - expenseTotal;

        return {
            assets,
            liabilities,
            equity,
            netIncome,
            revenueAccounts: branchAccounts.filter(a => a.type === AccountType.Revenue),
            expenseAccounts: branchAccounts.filter(a => a.type === AccountType.Expense),
        };
    }, [accounts, currentBranchId]);


    const isBalanced = Math.abs(reportData.assets - (reportData.liabilities + reportData.equity + reportData.netIncome)) < 1;

    return (
        <div className="w-full h-full flex flex-col p-4 md:p-6 space-y-4 overflow-hidden">
            {/* Header Bar */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 shrink-0">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 text-white flex items-center justify-center shadow-xs shrink-0">
                        <DollarSign className="w-5 h-5" />
                    </div>
                    <div>
                        <h1 className="text-xl font-black text-slate-900 dark:text-white leading-tight">
                            Laporan Posisi Keuangan (Neraca)
                        </h1>
                    </div>
                </div>

                <div className="flex flex-wrap items-center gap-2 text-xs shrink-0 self-end sm:self-center">
                    <div className="px-3 py-1.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200/60 dark:border-emerald-800/60 text-emerald-700 dark:text-emerald-300 font-medium">
                        <span className="text-[10px] text-slate-500 dark:text-slate-400 uppercase font-bold">Total Aset:</span>{" "}
                        <span className="font-bold font-mono">Rp{reportData.assets.toLocaleString('id-ID')}</span>
                    </div>

                    <div className="px-3 py-1.5 rounded-xl bg-amber-50 dark:bg-amber-950/50 border border-amber-200/60 dark:border-amber-800/60 text-amber-700 dark:text-amber-300 font-medium">
                        <span className="text-[10px] uppercase font-bold">Total Liabilitas:</span>{" "}
                        <span className="font-bold font-mono">Rp{reportData.liabilities.toLocaleString('id-ID')}</span>
                    </div>

                    <div className="px-3 py-1.5 rounded-xl bg-blue-50 dark:bg-blue-950/50 border border-blue-200/60 dark:border-blue-800/60 text-blue-700 dark:text-blue-300 font-medium">
                        <span className="text-[10px] uppercase font-bold">Total Ekuitas:</span>{" "}
                        <span className="font-bold font-mono">Rp{(reportData.equity + reportData.netIncome).toLocaleString('id-ID')}</span>
                    </div>

                    <Button onClick={() => setIsFilterOpen(true)} className="gap-2 text-xs py-1.5 px-3.5 shadow-xs">
                        <Filter className="w-4 h-4" />
                        Buat Laporan / Filter
                    </Button>
                </div>
            </div>

            {/* Content Area */}
            <div className="flex-1 min-h-0 overflow-y-auto space-y-4 pr-1">
                {/* 2-Column Balance Sheet Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Card 1: ASET (Aktiva) */}
                    <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-slate-200/80 dark:border-zinc-800 shadow-2xs overflow-hidden flex flex-col justify-between">
                        <div>
                            <div className="px-5 py-3.5 bg-emerald-50/70 dark:bg-emerald-950/30 border-b border-emerald-100 dark:border-emerald-900/50 flex justify-between items-center">
                                <h3 className="font-extrabold text-emerald-900 dark:text-emerald-300 text-sm uppercase tracking-wide flex items-center gap-2">
                                    <Wallet className="w-4 h-4 text-emerald-600" />
                                    ASET (AKTIVA)
                                </h3>
                                <Badge variant="success">Aktiva Operasional</Badge>
                            </div>

                            <div className="p-4 space-y-2">
                                <table className="w-full text-xs">
                                    <thead>
                                        <tr className="border-b border-slate-100 dark:border-zinc-800 text-slate-400 text-left">
                                            <th className="py-2 font-semibold">Nama Akun / Rekening</th>
                                            <th className="py-2 text-right font-semibold">Saldo</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100 dark:divide-zinc-800/60">
                                        {accounts.filter(a => a.type === AccountType.Asset).map(acc => (
                                            <tr key={acc.id} className="hover:bg-slate-50 dark:hover:bg-zinc-800/40">
                                                <td className="py-2.5 text-slate-800 dark:text-zinc-200 font-medium">
                                                    <span className="font-mono text-slate-400 mr-2">{acc.id}</span>
                                                    {acc.name}
                                                </td>
                                                <td className="py-2.5 text-right font-mono font-bold text-slate-900 dark:text-white">
                                                    Rp{acc.balance.toLocaleString('id-ID')}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>

                        <div className="p-4 bg-emerald-50/80 dark:bg-emerald-950/40 border-t border-emerald-100 dark:border-emerald-900/60 flex justify-between items-center font-bold text-emerald-900 dark:text-emerald-200 text-sm">
                            <span>TOTAL ASET (AKTIVA)</span>
                            <span className="font-mono text-base">Rp{reportData.assets.toLocaleString('id-ID')}</span>
                        </div>
                    </div>

                    {/* Card 2: LIABILITAS & EKUITAS (Pasiva) */}
                    <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-slate-200/80 dark:border-zinc-800 shadow-2xs overflow-hidden flex flex-col justify-between">
                        <div>
                            <div className="px-5 py-3.5 bg-blue-50/70 dark:bg-blue-950/30 border-b border-blue-100 dark:border-blue-900/50 flex justify-between items-center">
                                <h3 className="font-extrabold text-blue-900 dark:text-blue-300 text-sm uppercase tracking-wide flex items-center gap-2">
                                    <PieChart className="w-4 h-4 text-blue-600" />
                                    LIABILITAS & EKUITAS (PASIVA)
                                </h3>
                                <Badge variant="info">Kewajiban & Modal</Badge>
                            </div>

                            <div className="p-4 space-y-4">
                                {/* Sub-section: Liabilitas */}
                                <div>
                                    <h4 className="text-[11px] font-bold text-amber-600 dark:text-amber-400 uppercase tracking-wider mb-1.5 pb-1 border-b border-slate-100 dark:border-zinc-800">
                                        Liabilitas (Kewajiban)
                                    </h4>
                                    <table className="w-full text-xs">
                                        <tbody className="divide-y divide-slate-100 dark:divide-zinc-800/60">
                                            {accounts.filter(a => a.type === AccountType.Liability).map(acc => (
                                                <tr key={acc.id} className="hover:bg-slate-50 dark:hover:bg-zinc-800/40">
                                                    <td className="py-2 text-slate-800 dark:text-zinc-200 font-medium">
                                                        <span className="font-mono text-slate-400 mr-2">{acc.id}</span>
                                                        {acc.name}
                                                    </td>
                                                    <td className="py-2 text-right font-mono font-bold text-amber-600 dark:text-amber-400">
                                                        Rp{Math.abs(acc.balance).toLocaleString('id-ID')}
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>

                                {/* Sub-section: Ekuitas */}
                                <div>
                                    <h4 className="text-[11px] font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wider mb-1.5 pb-1 border-b border-slate-100 dark:border-zinc-800">
                                        Ekuitas (Modal Bisnis)
                                    </h4>
                                    <table className="w-full text-xs">
                                        <tbody className="divide-y divide-slate-100 dark:divide-zinc-800/60">
                                            {accounts.filter(a => a.type === AccountType.Equity).map(acc => (
                                                <tr key={acc.id} className="hover:bg-slate-50 dark:hover:bg-zinc-800/40">
                                                    <td className="py-2 text-slate-800 dark:text-zinc-200 font-medium">
                                                        <span className="font-mono text-slate-400 mr-2">{acc.id}</span>
                                                        {acc.name}
                                                    </td>
                                                    <td className="py-2 text-right font-mono font-bold text-blue-600 dark:text-blue-400">
                                                        Rp{Math.abs(acc.balance).toLocaleString('id-ID')}
                                                    </td>
                                                </tr>
                                            ))}
                                            {/* Laba / Rugi Berjalan = Revenue - Expense */}
                                            <tr className={`hover:bg-slate-50 dark:hover:bg-zinc-800/40 font-semibold ${reportData.netIncome >= 0 ? 'text-emerald-700 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
                                                <td className="py-2">
                                                    <span className="font-mono text-slate-400 mr-2">3999</span>
                                                    Laba / Rugi Berjalan
                                                </td>
                                                <td className="py-2 text-right font-mono font-bold">
                                                    {reportData.netIncome < 0 ? '-' : ''}Rp{Math.abs(reportData.netIncome).toLocaleString('id-ID')}
                                                </td>
                                            </tr>
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>

                        <div className="p-4 bg-blue-50/80 dark:bg-blue-950/40 border-t border-blue-100 dark:border-blue-900/60 flex justify-between items-center font-bold text-blue-900 dark:text-blue-200 text-sm">
                            <span>TOTAL LIABILITAS & EKUITAS</span>
                            <span className="font-mono text-base">Rp{(reportData.liabilities + reportData.equity + reportData.netIncome).toLocaleString('id-ID')}</span>
                        </div>
                    </div>
                </div>

                {/* Bottom Balance Verification Card */}
                <div className={`p-4 rounded-2xl border flex flex-col sm:flex-row items-center justify-between gap-3 ${
                    isBalanced 
                        ? 'bg-emerald-50/90 dark:bg-emerald-950/40 border-emerald-200/80 dark:border-emerald-800/60 text-emerald-900 dark:text-emerald-200' 
                        : 'bg-rose-50/90 dark:bg-rose-950/40 border-rose-200/80 dark:border-rose-800/60 text-rose-900 dark:text-rose-200'
                }`}>
                    <div className="flex items-center gap-3">
                        <div className={`w-8 h-8 rounded-xl flex items-center justify-center font-bold text-white ${isBalanced ? 'bg-emerald-600' : 'bg-rose-600'}`}>
                            {isBalanced ? '✓' : '!'}
                        </div>
                        <div>
                            <div className="font-black text-sm">
                                {isBalanced ? 'Status Neraca: Seimbang (Balanced)' : 'Status Neraca: Tidak Seimbang (Unbalanced)'}
                            </div>
                            <div className="text-xs opacity-80">
                                Formulasi Akuntansi: Aset (Rp{reportData.assets.toLocaleString('id-ID')}) = Liabilitas + Ekuitas (Rp{(reportData.liabilities + reportData.equity + reportData.netIncome).toLocaleString('id-ID')})
                            </div>
                        </div>
                    </div>

                    <div className="font-mono font-extrabold text-sm px-3 py-1 rounded-lg bg-white/70 dark:bg-zinc-800/70 shrink-0">
                        Selisih: Rp{Math.abs(reportData.assets - (reportData.liabilities + reportData.equity + reportData.netIncome)).toLocaleString('id-ID')}
                    </div>
                </div>
            </div>

            {/* Pop-up Filter Modal */}
            <Modal
                isOpen={isFilterOpen}
                onClose={() => setIsFilterOpen(false)}
                title="Filter & Buat Laporan Neraca"
                maxWidth="max-w-md"
                footer={
                    <div className="flex justify-end gap-2 w-full">
                        <Button variant="secondary" onClick={() => setIsFilterOpen(false)}>Batal</Button>
                        <Button onClick={() => setIsFilterOpen(false)} className="gap-1.5">
                            <Filter className="w-4 h-4" />
                            Generate Laporan
                        </Button>
                    </div>
                }
            >
                <div className="space-y-4 text-sm">
                    <div className="bg-slate-50 dark:bg-zinc-800/60 p-3 rounded-xl border border-slate-200/60 dark:border-zinc-700/60 space-y-2">
                        <Label className="font-bold text-slate-800 dark:text-zinc-200 text-xs">Per Tanggal (As of Date)</Label>
                        <Input type="date" value={asOfDate} onChange={e => setAsOfDate(e.target.value)} className="text-xs py-1.5" />
                    </div>
                </div>
            </Modal>
        </div>
    );
};
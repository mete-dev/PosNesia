import React, { useState, useMemo } from 'react';
import { useAppContext } from '../hooks/useAppContext';
import { Sale, Product, StockMovement, AccountType, JournalEntry, Account, PurchaseOrder, PosSessionSummary, ProductCategory, Shelf, InventoryLevel, ProductTypeLocation } from '../types';
import { Card, Button, Label, Select, DateRangeFilter, PageHeader, Table, Thead, Tbody, Tr, Th, Td, Input } from './ui';

// --- Consolidated Goods Report ---
export const GoodsReportPage: React.FC = () => {
    const { state } = useAppContext();
    const { products, sales, inventoryLevels, productCategories, shelves, productTypeLocations, warehouses, branches } = state;

    type ReportType = 'Persediaan' | 'Penjualan' | 'Stok Minus';
    type FilterType = 'Semua Barang' | 'Kategori' | 'Rak';
    type QuantityFilterType = 'Semua Barang' | 'Paling Sedikit' | 'Paling Banyak';


    const [reportType, setReportType] = useState<ReportType>('Persediaan');
    const [filterType, setFilterType] = useState<FilterType>('Semua Barang');
    const [filterId, setFilterId] = useState('');
    const [locationFilterId, setLocationFilterId] = useState(''); // New state for location filter
    const [quantityFilter, setQuantityFilter] = useState<QuantityFilterType>('Semua Barang');
    const [quantityLimit, setQuantityLimit] = useState<number | string>(10);
    const [reportData, setReportData] = useState<any[]>([]);
    const [reportTitle, setReportTitle] = useState('Laporan Barang');

    const handleGenerateReport = (start: string, end: string) => {
        const startDate = new Date(start);
        const endDate = new Date(end);
        let data: any[] = [];
        let title = `Laporan ${reportType}`;

        // --- Step 1: Filter products by category/shelf ---
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
        
        // Add location to title if selected
        if(locationFilterId) {
            const loc = [...warehouses, ...branches].find(l => l.id === locationFilterId);
            if(loc) title += ` - Lokasi: ${loc.name}`;
        }


        // --- Step 2: Get base data based on reportType ---
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
                    const inDate = saleDate >= startDate && saleDate <= endDate;
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

        // --- Step 3: Apply quantity filter (sort & slice) ---
        const limit = Number(quantityLimit) > 0 ? Number(quantityLimit) : data.length;

        if (quantityFilter !== 'Semua Barang') {
            const sortKey = reportType === 'Penjualan' ? 'Kuantitas' : 'Stok';
            if (quantityFilter === 'Paling Sedikit') {
                data.sort((a, b) => a[sortKey] - b[sortKey]);
            } else { // Paling Banyak
                data.sort((a, b) => b[sortKey] - a[sortKey]);
            }
            data = data.slice(0, limit);
            title += ` (${quantityFilter} ${limit} item)`;
        }

        setReportData(data);
        setReportTitle(title);
    };


    const renderFilterDropdown = () => {
        if (filterType === 'Kategori') {
            return <Select value={filterId} onChange={e => setFilterId(e.target.value)}><option value="">Pilih Kategori</option>{productCategories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}</Select>;
        }
        if (filterType === 'Rak') {
            return <Select value={filterId} onChange={e => setFilterId(e.target.value)}><option value="">Pilih Rak</option>{shelves.map(s => <option key={s.id} value={s.id}>{s.code} - {s.description}</option>)}</Select>;
        }
        return <Input disabled className="bg-gray-200 dark:bg-gray-700/50" />;
    };

    const columns = reportData.length > 0 ? Object.keys(reportData[0]) : [];

    return (
        <div className="p-8 h-full flex flex-col">
            <PageHeader title="Laporan Barang" />
            <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-md mb-6">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-4">
                    <div>
                        <Label>Jenis Laporan</Label>
                        <Select value={reportType} onChange={e => setReportType(e.target.value as ReportType)}>
                            <option value="Persediaan">Persediaan</option>
                            <option value="Penjualan">Penjualan</option>
                            <option value="Stok Minus">Stok Minus</option>
                        </Select>
                    </div>
                     <div className="flex gap-4 items-end">
                        <div className="flex-grow">
                            <Label>Filter Kuantitas</Label>
                            <Select value={quantityFilter} onChange={e => setQuantityFilter(e.target.value as QuantityFilterType)}>
                                <option value="Semua Barang">Semua Barang</option>
                                <option value="Paling Sedikit">Paling Sedikit</option>
                                <option value="Paling Banyak">Paling Banyak</option>
                            </Select>
                        </div>
                        {(quantityFilter === 'Paling Sedikit' || quantityFilter === 'Paling Banyak') && (
                            <div className="flex-shrink-0">
                                <Label>Jumlah</Label>
                                <Input type="number" value={quantityLimit} onChange={e => setQuantityLimit(e.target.value)} className="w-24" />
                            </div>
                        )}
                    </div>
                     <div className="flex gap-4 items-end">
                        <div className="flex-grow">
                            <Label>Berdasarkan</Label>
                            <Select value={filterType} onChange={e => {setFilterType(e.target.value as FilterType); setFilterId('');}}>
                                <option value="Semua Barang">Semua Barang</option>
                                <option value="Kategori">Kategori</option>
                                <option value="Rak">Rak</option>
                            </Select>
                        </div>
                        <div className="flex-grow">
                             {(filterType === 'Kategori' || filterType === 'Rak') && <Label>Filter Spesifik</Label>}
                            {renderFilterDropdown()}
                        </div>
                    </div>
                     {/* New Location Filter */}
                    <div className="lg:col-span-3">
                        <Label>Lokasi Pengecekan</Label>
                        <Select value={locationFilterId} onChange={e => setLocationFilterId(e.target.value)}>
                            <option value="">Semua Lokasi</option>
                            {warehouses.map(w => <option key={w.id} value={w.id}>Gudang: {w.name}</option>)}
                            {branches.map(b => <option key={b.id} value={b.id}>Toko: {b.name}</option>)}
                        </Select>
                    </div>
                </div>
            </div>
            <DateRangeFilter onFilter={handleGenerateReport} defaultRange={30} />
            <Card className="flex-grow overflow-y-auto">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">{reportTitle}</h3>
                <Table>
                    <Thead>
                        <Tr>
                            {columns.map(col => <Th key={col} className={typeof reportData[0]?.[col] === 'number' ? 'text-right' : 'text-left'}>{col}</Th>)}
                        </Tr>
                    </Thead>
                    <Tbody>
                        {reportData.map((row, index) => (
                            <Tr key={index}>
                                {columns.map(col => (
                                    <Td key={col} className={typeof row[col] === 'number' ? 'text-right font-mono' : 'text-left'}>
                                        {typeof row[col] === 'number' ? row[col].toLocaleString('id-ID') : row[col]}
                                    </Td>
                                ))}
                            </Tr>
                        ))}
                    </Tbody>
                </Table>
            </Card>
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
    
    const handleFilter = (start: string, end: string) => {
        const startDate = new Date(start);
        const endDate = new Date(end);

        const salesInRange = sales.filter(s => {
            const saleDate = new Date(s.date);
            return saleDate >= startDate && saleDate <= endDate;
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
        <div className="p-8 h-full flex flex-col">
            <PageHeader title="Laporan Keuangan Inventaris per Kategori" />
            <DateRangeFilter onFilter={handleFilter} />
            <Card className="flex-grow overflow-y-auto">
                <Table>
                    <Thead>
                        <Tr>
                            <Th>Kategori Produk</Th>
                            <Th className="text-right">Total Nilai Persediaan (HPP)</Th>
                            <Th className="text-right">Total Nilai Penjualan</Th>
                        </Tr>
                    </Thead>
                    <Tbody>
                        {reportData.map(renderRow)}
                    </Tbody>
                </Table>
            </Card>
        </div>
    );
};


// --- Sales Report ---

export const SalesReport: React.FC = () => {
    const { state } = useAppContext();
    const { sales, staff, customers, currentBranchId } = state;
    const [filteredSales, setFilteredSales] = useState<Sale[]>([]);

    const [saleChannel, setSaleChannel] = useState('all');
    const [cashierId, setCashierId] = useState('all');
    const [customerType, setCustomerType] = useState<'all' | 'Perorangan' | 'Perusahaan'>('all');
    
    const [dateRange, setDateRange] = useState<{ start: string, end: string }>({ start: '', end: '' });

    const handleDateFilter = (start: string, end: string) => {
        setDateRange({ start, end });
    };

    const applyAllFilters = () => {
        const startDate = new Date(dateRange.start);
        startDate.setHours(0, 0, 0, 0);
        const endDate = new Date(dateRange.end);
        endDate.setHours(23, 59, 59, 999);

        let tempSales = sales.filter(sale => {
            const saleDate = new Date(sale.date);
            return saleDate >= startDate && saleDate <= endDate;
        });

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
    
    React.useEffect(() => {
        if (dateRange.start && dateRange.end) {
            applyAllFilters();
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [dateRange, saleChannel, cashierId, customerType, currentBranchId]);


    const reportData = useMemo(() => {
        const totalRevenue = filteredSales.reduce((sum, sale) => sum + sale.grandTotal, 0);
        const totalTransactions = filteredSales.length;
        const averageSale = totalTransactions > 0 ? totalRevenue / totalTransactions : 0;
        return { totalRevenue, totalTransactions, averageSale };
    }, [filteredSales]);

    return (
        <div className="p-8 space-y-8 overflow-y-auto">
            <PageHeader title="Rekap Penjualan" />
            <DateRangeFilter onFilter={handleDateFilter} defaultRange={7} />
             <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-md mb-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                        <Label>Saluran Penjualan</Label>
                        <Select value={saleChannel} onChange={e => setSaleChannel(e.target.value)}>
                            <option value="all">Semua</option>
                            <option value="POS">POS</option>
                            <option value="E-commerce">E-commerce</option>
                        </Select>
                    </div>
                     <div>
                        <Label>Kasir</Label>
                        <Select value={cashierId} onChange={e => setCashierId(e.target.value)}>
                            <option value="all">Semua Kasir</option>
                            {staff.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                        </Select>
                    </div>
                     <div>
                        <Label>Tipe Pelanggan</Label>
                        <Select value={customerType} onChange={e => setCustomerType(e.target.value as any)}>
                            <option value="all">Semua</option>
                            <option value="Perorangan">Perorangan</option>
                            <option value="Perusahaan">Perusahaan</option>
                        </Select>
                    </div>
                </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card>
                    <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Total Pendapatan</h3>
                    <p className="text-3xl font-bold text-green-500">Rp{reportData.totalRevenue.toLocaleString('id-ID')}</p>
                </Card>
                 <Card>
                    <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Jumlah Transaksi</h3>
                    <p className="text-3xl font-bold">{reportData.totalTransactions}</p>
                </Card>
                 <Card>
                    <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Rata-rata Penjualan</h3>
                    <p className="text-3xl font-bold">Rp{reportData.averageSale.toLocaleString('id-ID')}</p>
                </Card>
            </div>
            <Card>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Detail Penjualan</h3>
                 <div className="overflow-x-auto max-h-96">
                    <Table>
                      <Thead>
                        <Tr>
                          <Th>ID</Th>
                          <Th>Tanggal</Th>
                          <Th>Pelanggan</Th>
                          <Th>Total</Th>
                        </Tr>
                      </Thead>
                      <Tbody>
                        {filteredSales.map((sale) => (
                          <Tr key={sale.id}>
                            <Td>{sale.id}</Td>
                            <Td>{new Date(sale.date).toLocaleString('id-ID')}</Td>
                            <Td>{sale.customerName}</Td>
                            <Td className="font-semibold">Rp{sale.grandTotal.toLocaleString('id-ID')}</Td>
                          </Tr>
                        ))}
                      </Tbody>
                    </Table>
                </div>
            </Card>
        </div>
    );
};

// --- New Reports ---
export const PurchaseReportPage: React.FC = () => {
    const { state } = useAppContext();
    const [filteredPurchases, setFilteredPurchases] = useState<PurchaseOrder[]>([]);

    const handleFilter = (start: string, end: string) => {
        const startDate = new Date(start);
        const endDate = new Date(end);
        setFilteredPurchases(state.purchases.filter(p => {
            const pDate = new Date(p.orderDate);
            return pDate >= startDate && pDate <= endDate;
        }));
    };
    return (
        <div className="p-8">
            <PageHeader title="Rekap Pembelian" />
            <DateRangeFilter onFilter={handleFilter} />
            <Card>
                <Table>
                    <Thead>
                        <Tr>
                            <Th>ID</Th>
                            <Th>Vendor</Th>
                            <Th>Total</Th>
                        </Tr>
                    </Thead>
                    <Tbody>
                        {filteredPurchases.map(p => <Tr key={p.id}><Td>{p.id}</Td><Td>{p.vendorName}</Td><Td>Rp{p.grandTotal.toLocaleString('id-ID')}</Td></Tr>)}
                    </Tbody>
                </Table>
            </Card>
        </div>
    );
}

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

    const handleFilter = (start: string, end: string) => {
         const startDate = new Date(start);
        const endDate = new Date(end);
        const salesInRange = state.sales.filter(s => new Date(s.date) >= startDate && new Date(s.date) <= endDate);

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

    return (
        <div className="p-8">
            <PageHeader title="Rekap Performa Produk" />
            <DateRangeFilter onFilter={handleFilter} />
            <Card>
                <Table>
                     <Thead>
                         <Tr>
                             <Th>Produk</Th>
                             <Th>Qty Terjual</Th>
                             <Th>Pendapatan</Th>
                             <Th>Profit</Th>
                         </Tr>
                    </Thead>
                     <Tbody>
                        {reportData.map(p => <Tr key={p.name}><Td>{p.name}</Td><Td>{p.quantity}</Td><Td>Rp{p.revenue.toLocaleString('id-ID')}</Td><Td>Rp{p.profit.toLocaleString('id-ID')}</Td></Tr>)}
                     </Tbody>
                </Table>
            </Card>
        </div>
    );
};

export const CashierDepositReportPage: React.FC = () => {
    const { state } = useAppContext();
    const { posSessionSummaries, currentUser } = state;
    const [filteredSummaries, setFilteredSummaries] = useState<PosSessionSummary[]>([]);

    const userIsCashier = currentUser?.roleId === 'kasir.toko';

    const handleFilter = (start: string, end: string) => {
        const startDate = new Date(start);
        const endDate = new Date(end);
        let summaries = posSessionSummaries.filter(s => new Date(s.date) >= startDate && new Date(s.date) <= endDate);
        if (userIsCashier) {
            summaries = summaries.filter(s => s.cashierId === currentUser.id);
        }
        setFilteredSummaries(summaries);
    };

    return (
         <div className="p-8">
            <PageHeader title="Rekap Setoran Kasir" />
            <DateRangeFilter onFilter={handleFilter} />
            <Card>
                 <Table>
                    <Thead>
                        <Tr>
                            <Th>Tanggal</Th>
                            <Th>Kasir</Th>
                            <Th>Kas Dihitung</Th>
                            <Th>Kas Seharusnya</Th>
                            <Th>Selisih</Th>
                            <Th>Status</Th>
                        </Tr>
                    </Thead>
                    <Tbody>
                        {filteredSummaries.map(s => (
                            <Tr key={s.id}>
                                <Td>{new Date(s.date).toLocaleString('id-ID')}</Td>
                                <Td>{s.cashierName}</Td>
                                <Td>Rp{s.countedCash.toLocaleString('id-ID')}</Td>
                                <Td>Rp{s.expectedCash.toLocaleString('id-ID')}</Td>
                                <Td className={`font-bold ${s.variance < 0 ? 'text-red-500' : 'text-green-500'}`}>Rp{s.variance.toLocaleString('id-ID')}</Td>
                                <Td>{s.status}</Td>
                            </Tr>
                        ))}
                    </Tbody>
                </Table>
            </Card>
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

    const handleFilter = (start: string, end: string) => {
        const startDate = new Date(start);
        startDate.setHours(0, 0, 0, 0);
        const endDate = new Date(end);
        endDate.setHours(23, 59, 59, 999);
        
        const branchMovements = currentBranchId 
            ? stockMovements.filter(m => m.locationId === currentBranchId)
            : stockMovements;

        const data: ProductStockInfo[] = products.map(product => {
            const productMovements = branchMovements.filter(m => m.productId === product.id);
            
            const movementsBefore = productMovements.filter(m => new Date(m.date) < startDate);
            const movementsDuring = productMovements.filter(m => new Date(m.date) >= startDate && new Date(m.date) <= endDate);

            const startStock = movementsBefore.reduce((sum, m) => sum + m.quantityChange, 0);
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
    
    return (
        <div className="p-8 h-full flex flex-col">
            <PageHeader title="Laporan Stok Produk" />
            <DateRangeFilter onFilter={handleFilter} defaultRange={30}/>
             <div className="flex-grow bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-y-auto">
                 <Table>
                  <Thead>
                    <Tr>
                      <Th>Nama Produk</Th>
                      <Th>Stok Awal</Th>
                      <Th>Masuk</Th>
                      <Th>Keluar</Th>
                      <Th>Stok Akhir</Th>
                    </Tr>
                  </Thead>
                  <Tbody>
                    {reportData.map((data, index) => (
                      <Tr key={index}>
                        <Td className="font-medium text-gray-900 dark:text-white">{data.productName}</Td>
                        <Td>{data.startStock}</Td>
                        <Td className="text-green-500">{data.stockIn}</Td>
                        <Td className="text-red-500">{data.stockOut}</Td>
                        <Td className="font-bold">{data.endStock}</Td>
                      </Tr>
                    ))}
                  </Tbody>
                </Table>
            </div>
        </div>
    );
};


// --- Income Statement Report ---
export const IncomeStatementReport: React.FC = () => {
    const { state } = useAppContext();
    const { journalEntries, accounts, currentBranchId } = state;
    const [reportData, setReportData] = useState<{
        revenue: number,
        cogs: number,
        grossProfit: number,
        expenses: number,
        netIncome: number
    } | null>(null);

    const handleFilter = (start: string, end: string) => {
        const startDate = new Date(start);
        const endDate = new Date(end);
        
        const entriesInDateRange = journalEntries.filter(entry => {
            const entryDate = new Date(entry.date);
            const isInDate = entryDate >= startDate && entryDate <= endDate;
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

    return (
        <div className="p-8">
            <PageHeader title="Laporan Laba Rugi" />
            <DateRangeFilter onFilter={handleFilter} />
            {reportData && (
                <Card>
                    <div className="space-y-4">
                        <div className="flex justify-between"><span>Pendapatan</span> <span>Rp{reportData.revenue.toLocaleString('id-ID')}</span></div>
                        <div className="flex justify-between"><span>Beban Pokok Penjualan</span> <span>(Rp{reportData.cogs.toLocaleString('id-ID')})</span></div>
                        <div className="flex justify-between font-bold border-t pt-2"><span>Laba Kotor</span> <span>Rp{reportData.grossProfit.toLocaleString('id-ID')}</span></div>
                        <div className="flex justify-between"><span>Beban Operasional</span> <span>(Rp{reportData.expenses.toLocaleString('id-ID')})</span></div>
                        <div className="flex justify-between font-bold text-xl border-t pt-2"><span>Laba Bersih</span> <span>Rp{reportData.netIncome.toLocaleString('id-ID')}</span></div>
                    </div>
                </Card>
            )}
        </div>
    );
};

export const FinancialPositionReportPage: React.FC = () => {
    const { state } = useAppContext();
    const { accounts, currentBranchId } = state;

    const reportData = useMemo(() => {
        const branchAccounts = currentBranchId 
            ? accounts.filter(a => a.branchId === currentBranchId || !a.branchId)
            : accounts;

        const assets = branchAccounts.filter(a => a.type === AccountType.Asset).reduce((sum, a) => sum + a.balance, 0);
        const liabilities = branchAccounts.filter(a => a.type === AccountType.Liability).reduce((sum, a) => sum + a.balance, 0);
        const equity = branchAccounts.filter(a => a.type === AccountType.Equity).reduce((sum, a) => sum + a.balance, 0);

        return {
            assets,
            liabilities: Math.abs(liabilities),
            equity: Math.abs(equity),
        };
    }, [accounts, currentBranchId]);

    return (
        <div className="p-8 h-full flex flex-col">
            <PageHeader title="Laporan Posisi Keuangan (Neraca)" />
            <Card className="flex-grow">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div>
                        <h3 className="text-lg font-semibold mb-2">Aset</h3>
                        <table className="w-full text-sm">
                            <tbody>
                                {accounts.filter(a => a.type === AccountType.Asset).map(acc => (
                                    <tr key={acc.id} className="border-b dark:border-gray-700">
                                        <td className="py-2">{acc.name}</td>
                                        <td className="py-2 text-right">Rp{acc.balance.toLocaleString('id-ID')}</td>
                                    </tr>
                                ))}
                            </tbody>
                            <tfoot>
                                <tr className="font-bold border-t-2 dark:border-gray-500">
                                    <td className="py-2">Total Aset</td>
                                    <td className="py-2 text-right">Rp{reportData.assets.toLocaleString('id-ID')}</td>
                                </tr>
                            </tfoot>
                        </table>
                    </div>
                    <div>
                         <h3 className="text-lg font-semibold mb-2">Liabilitas dan Ekuitas</h3>
                         <table className="w-full text-sm">
                            <tbody>
                                {accounts.filter(a => a.type === AccountType.Liability || a.type === AccountType.Equity).map(acc => (
                                    <tr key={acc.id} className="border-b dark:border-gray-700">
                                        <td className="py-2">{acc.name}</td>
                                        <td className="py-2 text-right">Rp{Math.abs(acc.balance).toLocaleString('id-ID')}</td>
                                    </tr>
                                ))}
                            </tbody>
                            <tfoot>
                                <tr className="font-bold border-t-2 dark:border-gray-500">
                                    <td className="py-2">Total Liabilitas dan Ekuitas</td>
                                    <td className="py-2 text-right">Rp{(reportData.liabilities + reportData.equity).toLocaleString('id-ID')}</td>
                                </tr>
                            </tfoot>
                        </table>
                    </div>
                </div>
            </Card>
        </div>
    );
};
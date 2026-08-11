import React, { useMemo } from 'react';
import { 
    BarChart, 
    Bar, 
    XAxis, 
    YAxis, 
    CartesianGrid, 
    Tooltip, 
    ResponsiveContainer, 
    PieChart, 
    Pie, 
    Cell 
} from 'recharts';
import { useAppContext } from './hooks/useAppContext';
import { AccountType, JournalEntry, Sale, PurchaseOrder, Customer, Page } from './types';
import { MOBILE_MENU_CATEGORIES } from './components/MobileMenuPage';
import { 
    IncomeStatementIcon, 
    FinancialPositionIcon, 
    BillIcon, 
    ProductStockIcon 
} from './components/icons';
import { 
    TrendingUp, 
    TrendingDown,
    ShoppingCart, 
    Package, 
    Users, 
    Calendar, 
    Plus, 
    AlertTriangle, 
    CheckCircle2, 
    Receipt, 
    ArrowRight,
    Sparkles,
    Building2,
    Activity,
    Layers,
    UserCheck,
    ClipboardList,
    Box,
    Wallet,
    FileWarning,
    PackageX,
    BarChart3
} from 'lucide-react';

export const Dashboard: React.FC = () => {
    const { state, dispatch } = useAppContext();
    const { 
        sales, customers, purchases, currentBranchId, branches,
        accounts, products, inventoryLevels, customerBills, staff, attendance, journalEntries, currentUser
    } = state;

    const currentBranchName = useMemo(() => {
        if (!currentBranchId) return 'Semua Cabang';
        const b = branches.find(branch => branch.id === currentBranchId);
        return b ? b.name : 'Cabang Utama';
    }, [branches, currentBranchId]);

    // --- FILTERS ---
    const filterByBranch = <T extends { branchId?: string; destinationId?: string; }>(items: T[], branchIdField: keyof T): T[] => {
        if (!currentBranchId) return items;
        return items.filter(item => item[branchIdField] === currentBranchId);
    };

    const filteredSales = useMemo(() => filterByBranch(sales, 'branchId'), [sales, currentBranchId]);
    const filteredPurchases = useMemo(() => filterByBranch(purchases, 'destinationId'), [purchases, currentBranchId]);
    const filteredJournals = useMemo(() => filterByBranch(journalEntries, 'branchId'), [journalEntries, currentBranchId]);

    // --- CALCULATIONS ---
    const financialStats = useMemo(() => {
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        const recentJournals = filteredJournals.filter((j: JournalEntry) => new Date(j.date) >= thirtyDaysAgo);
        
        let totalRevenue = 0;
        let totalExpense = 0;

        recentJournals.forEach((entry: JournalEntry) => {
            entry.lines.forEach(line => {
                const account = accounts.find(a => a.id === line.accountId);
                if (account) {
                    if (account.type === AccountType.Revenue) totalRevenue += line.type === 'credit' ? line.amount : -line.amount;
                    else if (account.type === AccountType.Expense) totalExpense += line.type === 'debit' ? line.amount : -line.amount;
                }
            });
        });
        
        if (totalRevenue === 0 && filteredSales.length > 0) {
            totalRevenue = filteredSales.reduce((sum, s) => sum + s.grandTotal, 0);
        }

        const netIncome = totalRevenue - totalExpense;
        return { netIncome, totalRevenue, totalExpense };
    }, [accounts, filteredJournals, filteredSales]);

    const operationalStats = useMemo(() => {
        const unpaidInvoices = customerBills.filter(b => b.status === 'Unpaid').length;
        const pendingPOs = purchases.filter(p => p.status === 'Pending').length;
        
        const stockMap = new Map<string, number>();
        inventoryLevels.forEach(inv => {
            const currentStock = stockMap.get(inv.productId) || 0;
            stockMap.set(inv.productId, currentStock + inv.quantity);
        });

        const lowStockItems = products.filter(p => {
            const stock = stockMap.get(p.id) || 0;
            return p.reorderPoint !== undefined && stock > 0 && stock <= p.reorderPoint;
        }).length;

        return { unpaidInvoices, pendingPOs, lowStockItems };
    }, [customerBills, purchases, products, inventoryLevels]);

    const hrmStats = useMemo(() => {
        const todayStr = new Date().toISOString().split('T')[0];
        const todaysRecords = attendance.filter(a => a.date === todayStr);
        const present = todaysRecords.filter(a => a.status === 'Present').length;
        const activeStaff = staff.filter(s => s.status === 'active').length;
        return { present, activeStaff };
    }, [attendance, staff]);

    const recentActivities = useMemo(() => {
        const saleActivities = filteredSales.slice(0, 5).map((s: Sale) => ({
            date: new Date(s.date), 
            type: 'Penjualan', 
            icon: <ShoppingCart className="w-4 h-4 text-emerald-500" />,
            bgColor: 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200/60 dark:border-emerald-800/40',
            description: `Penjualan #${s.id.slice(-6)}`,
            amount: `Rp${s.grandTotal.toLocaleString('id-ID')}`
        }));
        const purchaseActivities = filteredPurchases.slice(0, 5).map((p: PurchaseOrder) => ({
            date: new Date(p.orderDate), 
            type: 'Pembelian', 
            icon: <Package className="w-4 h-4 text-blue-500" />,
            bgColor: 'bg-blue-50 dark:bg-blue-950/40 border-blue-200/60 dark:border-blue-800/40',
            description: `PO #${p.id.slice(-6)}: ${p.vendorName}`,
            amount: ''
        }));
        const customerActivities = customers.slice(0, 5).map((c: Customer) => ({
            date: new Date(c.joinDate), 
            type: 'Pelanggan', 
            icon: <Users className="w-4 h-4 text-indigo-500" />,
            bgColor: 'bg-indigo-50 dark:bg-indigo-950/40 border-indigo-200/60 dark:border-indigo-800/40',
            description: `Pelanggan: ${c.name}`,
            amount: ''
        }));

        return [...saleActivities, ...purchaseActivities, ...customerActivities]
            .sort((a, b) => b.date.getTime() - a.date.getTime())
            .slice(0, 5);
    }, [filteredSales, filteredPurchases, customers]);

    const salesByDayChart = useMemo(() => {
        const days = ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'];
        const dataMap: Record<string, number> = {};
        
        for (let i = 6; i >= 0; i--) {
            const d = new Date();
            d.setDate(d.getDate() - i);
            const dayName = days[d.getDay()];
            dataMap[dayName] = 0;
        }

        filteredSales.forEach((sale: Sale) => {
            const saleDate = new Date(sale.date);
            const diffDays = Math.floor((new Date().getTime() - saleDate.getTime()) / (1000 * 3600 * 24));
            if (diffDays <= 7) {
                const dayName = days[saleDate.getDay()];
                dataMap[dayName] = (dataMap[dayName] || 0) + sale.grandTotal;
            }
        });

        return Object.keys(dataMap).map(day => ({ name: day, Sales: dataMap[day] }));
    }, [filteredSales]);

    const salesByChannelData = useMemo(() => {
        const channels = filteredSales.reduce((acc, sale: Sale) => {
            const channel = sale.saleChannel || 'Kasir (POS)';
            acc[channel] = (acc[channel] || 0) + 1;
            return acc;
        }, {} as Record<string, number>);

        if (Object.keys(channels).length === 0) {
            return [
                { name: 'Kasir (POS)', value: 1 },
                { name: 'Toko Online', value: 0 }
            ];
        }
        return Object.entries(channels).map(([name, value]) => ({ name, value }));
    }, [filteredSales]);
    
    const pieColors = ['#3b82f6', '#10b981', '#6366f1', '#f59e0b', '#ec4899'];
    const formattedDate = new Date().toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });

    return (
        <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto font-sans">
            
            {/* HERO WELCOME BANNER — Simple & Clean without subtitle */}
            <div className="bg-gradient-to-r from-blue-600 via-indigo-600 to-slate-900 rounded-2xl p-5 sm:p-7 text-white shadow-md relative overflow-hidden flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div className="absolute top-0 right-0 -mr-16 -mt-16 w-72 h-72 bg-white/10 rounded-full blur-3xl pointer-events-none"></div>
                <div className="absolute bottom-0 left-1/3 -mb-16 w-56 h-56 bg-emerald-400/10 rounded-full blur-2xl pointer-events-none"></div>

                <div className="relative z-10 space-y-1">
                    <div className="flex items-center gap-2">
                        <span className="bg-white/20 text-white text-[11px] font-bold px-2.5 py-0.5 rounded-full backdrop-blur-sm flex items-center gap-1.5">
                            <Building2 className="w-3 h-3" />
                            {currentBranchName}
                        </span>
                        <span className="text-white/70 text-xs font-medium flex items-center gap-1">
                            <Calendar className="w-3 h-3 opacity-70" />
                            {formattedDate}
                        </span>
                    </div>
                    <h1 className="text-xl sm:text-3xl font-extrabold tracking-tight">
                        Selamat Datang, {currentUser?.name || 'Admin'}
                    </h1>
                </div>

                {/* Quick Actions */}
                <div className="relative z-10 flex flex-wrap items-center gap-2.5">
                    <button
                        onClick={() => dispatch({ type: 'ui/togglePosMode', payload: true })}
                        className="bg-emerald-500 hover:bg-emerald-600 text-white font-bold px-4 py-2.5 rounded-xl shadow-md shadow-emerald-500/20 transition-all hover:scale-105 active:scale-95 flex items-center gap-2 text-xs sm:text-sm"
                    >
                        <ShoppingCart className="w-4 h-4" />
                        <span>Buka Kasir (POS)</span>
                    </button>

                    <button
                        onClick={() => dispatch({ type: 'ui/setPage', payload: Page.ProductList })}
                        className="bg-white/15 hover:bg-white/25 text-white font-semibold px-3.5 py-2.5 rounded-xl backdrop-blur-md transition-all flex items-center gap-1.5 text-xs sm:text-sm border border-white/20"
                    >
                        <Plus className="w-4 h-4" />
                        <span>Tambah Produk</span>
                    </button>
                </div>
            </div>

            {/* MOBILE QUICK MENU GRID */}
            <div className="grid grid-cols-4 gap-2.5 sm:hidden">
                {MOBILE_MENU_CATEGORIES.map((cat) => (
                    <button
                        key={cat.label}
                        onClick={() => {
                            if (cat.label === 'Point of Sales') {
                                dispatch({ type: 'pos/toggleMode', payload: { start: true } });
                            } else {
                                dispatch({ type: 'ui/setMobileMenu', payload: cat.label });
                            }
                        }}
                        className="flex flex-col items-center gap-1.5 py-2.5 px-1 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200/70 dark:border-zinc-800 hover:scale-105 active:scale-95 transition-all shadow-2xs"
                    >
                        <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${cat.color} text-white flex items-center justify-center shadow-sm`}>
                            {cat.icon}
                        </div>
                        <span className="text-[10px] font-bold text-zinc-700 dark:text-zinc-300 text-center leading-tight">{cat.label}</span>
                    </button>
                ))}
            </div>

            {/* KPI STAT CARDS GRID */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">

                {/* 1. Pendapatan */}
                <div className="relative rounded-2xl overflow-hidden group cursor-default">
                    <div className="absolute inset-0 bg-gradient-to-br from-blue-500 to-indigo-600"></div>
                    <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_rgba(255,255,255,0.2)_0%,_transparent_55%)]"></div>
                    <div className="absolute bottom-0 left-0 w-32 h-32 bg-black/10 rounded-full blur-2xl -mb-10 -ml-10 pointer-events-none"></div>
                    <div className="relative z-10 p-4 sm:p-5">
                        <div className="flex items-start justify-between mb-5">
                            <div className="relative">
                                <div className="w-12 h-12 rounded-2xl bg-white/15 ring-2 ring-white/25 flex items-center justify-center group-hover:scale-110 group-hover:bg-white/25 transition-all duration-300 shadow-lg">
                                    <Wallet strokeWidth={1.75} className="w-6 h-6 text-white drop-shadow" />
                                </div>
                            </div>
                            <span className="text-white/60 text-[10px] font-bold tracking-widest uppercase mt-1 bg-white/10 px-2 py-0.5 rounded-full">30 Hari</span>
                        </div>
                        <div className="text-white/75 text-[11px] font-extrabold tracking-widest uppercase mb-1.5">Pendapatan</div>
                        <div className="text-white text-xl sm:text-2xl font-black tracking-tight leading-none drop-shadow-sm">
                            Rp{financialStats.totalRevenue.toLocaleString('id-ID')}
                        </div>
                    </div>
                </div>

                {/* 2. Laba Bersih */}
                <div className="relative rounded-2xl overflow-hidden group cursor-default">
                    <div className="absolute inset-0 bg-gradient-to-br from-emerald-500 to-teal-600"></div>
                    <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_rgba(255,255,255,0.2)_0%,_transparent_55%)]"></div>
                    <div className="absolute bottom-0 left-0 w-32 h-32 bg-black/10 rounded-full blur-2xl -mb-10 -ml-10 pointer-events-none"></div>
                    <div className="relative z-10 p-4 sm:p-5">
                        <div className="flex items-start justify-between mb-5">
                            <div className="relative">
                                <div className="w-12 h-12 rounded-2xl bg-white/15 ring-2 ring-white/25 flex items-center justify-center group-hover:scale-110 group-hover:bg-white/25 transition-all duration-300 shadow-lg">
                                    <TrendingUp strokeWidth={1.75} className="w-6 h-6 text-white drop-shadow" />
                                </div>
                            </div>
                            <span className="text-white/60 text-[10px] font-bold tracking-widest uppercase mt-1 bg-white/10 px-2 py-0.5 rounded-full">30 Hari</span>
                        </div>
                        <div className="text-white/75 text-[11px] font-extrabold tracking-widest uppercase mb-1.5">Laba Bersih</div>
                        <div className="text-white text-xl sm:text-2xl font-black tracking-tight leading-none drop-shadow-sm">
                            Rp{financialStats.netIncome.toLocaleString('id-ID')}
                        </div>
                    </div>
                </div>

                {/* 3. Tagihan Belum Lunas */}
                <div className="relative rounded-2xl overflow-hidden group cursor-default">
                    <div className="absolute inset-0 bg-gradient-to-br from-amber-500 to-orange-500"></div>
                    <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_rgba(255,255,255,0.2)_0%,_transparent_55%)]"></div>
                    <div className="absolute bottom-0 left-0 w-32 h-32 bg-black/10 rounded-full blur-2xl -mb-10 -ml-10 pointer-events-none"></div>
                    <div className="relative z-10 p-4 sm:p-5">
                        <div className="flex items-start justify-between mb-5">
                            <div className="relative">
                                <div className="w-12 h-12 rounded-2xl bg-white/15 ring-2 ring-white/25 flex items-center justify-center group-hover:scale-110 group-hover:bg-white/25 transition-all duration-300 shadow-lg">
                                    <FileWarning strokeWidth={1.75} className="w-6 h-6 text-white drop-shadow" />
                                </div>
                            </div>
                            <span className="text-white/60 text-[10px] font-bold tracking-widest uppercase mt-1 bg-white/10 px-2 py-0.5 rounded-full">Faktur</span>
                        </div>
                        <div className="text-white/75 text-[11px] font-extrabold tracking-widest uppercase mb-1.5">Tagihan Belum Lunas</div>
                        <div className="text-white text-xl sm:text-2xl font-black tracking-tight leading-none drop-shadow-sm flex items-baseline gap-1.5">
                            {operationalStats.unpaidInvoices}
                            <span className="text-sm font-semibold text-white/65">faktur</span>
                        </div>
                    </div>
                </div>

                {/* 4. Stok Rendah */}
                <div className="relative rounded-2xl overflow-hidden group cursor-default">
                    <div className="absolute inset-0 bg-gradient-to-br from-rose-500 to-pink-600"></div>
                    <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_rgba(255,255,255,0.2)_0%,_transparent_55%)]"></div>
                    <div className="absolute bottom-0 left-0 w-32 h-32 bg-black/10 rounded-full blur-2xl -mb-10 -ml-10 pointer-events-none"></div>
                    <div className="relative z-10 p-4 sm:p-5">
                        <div className="flex items-start justify-between mb-5">
                            <div className="relative">
                                <div className="w-12 h-12 rounded-2xl bg-white/15 ring-2 ring-white/25 flex items-center justify-center group-hover:scale-110 group-hover:bg-white/25 transition-all duration-300 shadow-lg">
                                    <PackageX strokeWidth={1.75} className="w-6 h-6 text-white drop-shadow" />
                                </div>
                            </div>
                            <span className="text-white/60 text-[10px] font-bold tracking-widest uppercase mt-1 bg-white/10 px-2 py-0.5 rounded-full">Produk</span>
                        </div>
                        <div className="text-white/75 text-[11px] font-extrabold tracking-widest uppercase mb-1.5">Stok Rendah</div>
                        <div className="text-white text-xl sm:text-2xl font-black tracking-tight leading-none drop-shadow-sm flex items-baseline gap-1.5">
                            {operationalStats.lowStockItems}
                            <span className="text-sm font-semibold text-white/65">produk</span>
                        </div>
                    </div>
                </div>

            </div>

            {/* CHARTS SECTION */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
                
                {/* Main Sales Trend Chart */}
                <div className="lg:col-span-8 bg-white dark:bg-zinc-900 rounded-2xl p-5 border border-zinc-200/80 dark:border-zinc-800 shadow-2xs">
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-base font-extrabold text-zinc-900 dark:text-white flex items-center gap-2">
                            <Activity className="w-4 h-4 text-blue-600" />
                            <span>Tren Penjualan Minggu Ini</span>
                        </h2>
                        <button
                            onClick={() => dispatch({ type: 'ui/setPage', payload: Page.SalesList })}
                            className="text-xs font-bold text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1"
                        >
                            <span>Lihat Semua</span>
                            <ArrowRight className="w-3.5 h-3.5" />
                        </button>
                    </div>

                    <div className="h-64 w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={salesByDayChart} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                <XAxis dataKey="name" tickLine={false} axisLine={false} tick={{ fill: '#64748b', fontSize: 12, fontWeight: 600 }} />
                                <YAxis 
                                    tickLine={false} 
                                    axisLine={false} 
                                    tick={{ fill: '#64748b', fontSize: 11 }} 
                                    tickFormatter={(val) => `Rp${(val / 1000).toFixed(0)}k`} 
                                />
                                <Tooltip 
                                    contentStyle={{ 
                                        backgroundColor: '#0f172a', 
                                        border: 'none', 
                                        borderRadius: '12px', 
                                        color: '#fff', 
                                        boxShadow: '0 10px 25px -5px rgba(0,0,0,0.3)',
                                        fontSize: '12px',
                                        fontWeight: 600
                                    }} 
                                    formatter={(value) => [`Rp${(value as number).toLocaleString('id-ID')}`, 'Penjualan']} 
                                />
                                <Bar dataKey="Sales" fill="#2563eb" radius={[6, 6, 0, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Sales Channels Donut Chart */}
                <div className="lg:col-span-4 bg-white dark:bg-zinc-900 rounded-2xl p-5 border border-zinc-200/80 dark:border-zinc-800 shadow-2xs flex flex-col justify-between">
                    <h2 className="text-base font-extrabold text-zinc-900 dark:text-white flex items-center gap-2 mb-2">
                        <Layers className="w-4 h-4 text-indigo-600" />
                        <span>Saluran Penjualan</span>
                    </h2>

                    <div className="h-48 w-full relative flex items-center justify-center my-1">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie 
                                    data={salesByChannelData} 
                                    dataKey="value" 
                                    nameKey="name" 
                                    cx="50%" 
                                    cy="50%" 
                                    innerRadius={50}
                                    outerRadius={75} 
                                    paddingAngle={4}
                                >
                                    {salesByChannelData.map((_, index) => (
                                        <Cell key={`cell-${index}`} fill={pieColors[index % pieColors.length]} />
                                    ))}
                                </Pie>
                                <Tooltip formatter={(val) => [`${val} transaksi`, 'Volume']} />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>

                    <div className="space-y-1.5 pt-3 border-t border-zinc-100 dark:border-zinc-800">
                        {salesByChannelData.map((item, idx) => (
                            <div key={item.name} className="flex items-center justify-between text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                                <span className="flex items-center gap-2">
                                    <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: pieColors[idx % pieColors.length] }}></span>
                                    <span>{item.name}</span>
                                </span>
                                <span className="font-mono text-zinc-500">{item.value} tx</span>
                            </div>
                        ))}
                    </div>
                </div>

            </div>

            {/* LOWER SECTION: OPERATIONAL SUMMARY & RECENT ACTIVITIES */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
                
                {/* Operational Quick Stats */}
                <div className="lg:col-span-5 bg-white dark:bg-zinc-900 rounded-2xl p-5 border border-zinc-200/80 dark:border-zinc-800 shadow-2xs space-y-4">
                    <h2 className="text-base font-extrabold text-zinc-900 dark:text-white border-b border-zinc-100 dark:border-zinc-800 pb-3 flex items-center gap-2">
                        <Sparkles className="w-4 h-4 text-amber-500" />
                        <span>Ringkasan Operasional</span>
                    </h2>

                    <div className="space-y-2.5">
                        <div className="flex items-center justify-between p-3 bg-zinc-50 dark:bg-zinc-850 rounded-xl border border-zinc-100 dark:border-zinc-800">
                            <span className="text-xs font-bold text-zinc-600 dark:text-zinc-300 flex items-center gap-2">
                                <UserCheck className="w-4 h-4 text-blue-500" />
                                Kehadiran Staf Hari Ini
                            </span>
                            <span className="text-xs font-extrabold text-blue-600 dark:text-blue-400 font-mono">
                                {hrmStats.present} / {hrmStats.activeStaff} Orang
                            </span>
                        </div>

                        <div className="flex items-center justify-between p-3 bg-zinc-50 dark:bg-zinc-850 rounded-xl border border-zinc-100 dark:border-zinc-800">
                            <span className="text-xs font-bold text-zinc-600 dark:text-zinc-300 flex items-center gap-2">
                                <ClipboardList className="w-4 h-4 text-amber-500" />
                                PO Pembelian Pending
                            </span>
                            <span className="text-xs font-extrabold text-amber-600 dark:text-amber-400 font-mono">
                                {operationalStats.pendingPOs} PO
                            </span>
                        </div>

                        <div className="flex items-center justify-between p-3 bg-zinc-50 dark:bg-zinc-850 rounded-xl border border-zinc-100 dark:border-zinc-800">
                            <span className="text-xs font-bold text-zinc-600 dark:text-zinc-300 flex items-center gap-2">
                                <Users className="w-4 h-4 text-emerald-500" />
                                Total Pelanggan Terdaftar
                            </span>
                            <span className="text-xs font-extrabold text-emerald-600 dark:text-emerald-400 font-mono">
                                {customers.length} Pelanggan
                            </span>
                        </div>

                        <div className="flex items-center justify-between p-3 bg-zinc-50 dark:bg-zinc-850 rounded-xl border border-zinc-100 dark:border-zinc-800">
                            <span className="text-xs font-bold text-zinc-600 dark:text-zinc-300 flex items-center gap-2">
                                <Box className="w-4 h-4 text-indigo-500" />
                                Total Katalog Produk
                            </span>
                            <span className="text-xs font-extrabold text-indigo-600 dark:text-indigo-400 font-mono">
                                {products.length} SKU
                            </span>
                        </div>
                    </div>
                </div>

                {/* Recent Activities Timeline */}
                <div className="lg:col-span-7 bg-white dark:bg-zinc-900 rounded-2xl p-5 border border-zinc-200/80 dark:border-zinc-800 shadow-2xs">
                    <div className="flex items-center justify-between mb-4 border-b border-zinc-100 dark:border-zinc-800 pb-3">
                        <h2 className="text-base font-extrabold text-zinc-900 dark:text-white flex items-center gap-2">
                            <Activity className="w-4 h-4 text-emerald-500" />
                            <span>Aktivitas Terkini</span>
                        </h2>
                        <span className="text-[11px] font-semibold text-zinc-400">Live</span>
                    </div>

                    <div className="space-y-2.5">
                        {recentActivities.map((act, i) => (
                            <div key={i} className="flex items-center justify-between p-2.5 bg-zinc-50 dark:bg-zinc-850 rounded-xl border border-zinc-100 dark:border-zinc-800/80 hover:bg-zinc-100/80 dark:hover:bg-zinc-800 transition-colors">
                                <div className="flex items-center gap-3">
                                    <div className={`p-2 rounded-lg border ${act.bgColor}`}>
                                        {act.icon}
                                    </div>
                                    <div>
                                        <p className="text-xs font-bold text-zinc-900 dark:text-white">
                                            {act.description}
                                        </p>
                                        <p className="text-[10px] text-zinc-400 font-medium">
                                            {act.date.toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'short' })}
                                        </p>
                                    </div>
                                </div>
                                {act.amount && (
                                    <span className="text-xs font-black text-emerald-600 dark:text-emerald-400 font-mono">
                                        {act.amount}
                                    </span>
                                )}
                            </div>
                        ))}
                    </div>
                </div>

            </div>

        </div>
    );
};
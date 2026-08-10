import React, { useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { useAppContext } from './hooks/useAppContext';
import { getChartColors } from './utils/colors';
import { StatCard, Card } from './components/ui';
import { AccountType, JournalEntry, Sale, PurchaseOrder, Customer } from './types';
import { SalesIcon, PurchaseListIcon, CustomerListIcon, IncomeStatementIcon, FinancialPositionIcon, BillIcon, ProductStockIcon } from './components/icons';

export const Dashboard: React.FC = () => {
    const { state } = useAppContext();
    const { 
        sales, customers, purchases, themeConfig, currentBranchId, 
        accounts, products, inventoryLevels, customerBills, staff, attendance, journalEntries 
    } = state;

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
        const netIncome = totalRevenue - totalExpense;
        return { netIncome, totalRevenue };
    }, [accounts, filteredJournals]);

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
            date: new Date(s.date), type: 'Penjualan', icon: <SalesIcon className="w-5 h-5 text-green-500" />,
            description: `Penjualan #${s.id} sebesar Rp${s.grandTotal.toLocaleString('id-ID')}`
        }));
        const purchaseActivities = filteredPurchases.slice(0, 5).map((p: PurchaseOrder) => ({
            date: new Date(p.orderDate), type: 'Pembelian', icon: <PurchaseListIcon className="w-5 h-5 text-blue-500" />,
            description: `PO #${p.id} kepada ${p.vendorName}`
        }));
        const customerActivities = customers.slice(0, 5).map((c: Customer) => ({
            date: new Date(c.joinDate), type: 'Pelanggan', icon: <CustomerListIcon className="w-5 h-5 text-indigo-500" />,
            description: `Pelanggan baru: ${c.name}`
        }));

        return [...saleActivities, ...purchaseActivities, ...customerActivities]
            .sort((a, b) => b.date.getTime() - a.date.getTime())
            .slice(0, 7);
    }, [filteredSales, filteredPurchases, customers]);

    const salesByDayChart = useMemo(() => {
        const salesLast7Days = filteredSales.filter((sale: Sale) => new Date(sale.date) >= new Date(new Date().setDate(new Date().getDate() - 7)));
        const data = salesLast7Days.reduce((acc, sale: Sale) => {
            const day = new Date(sale.date).toLocaleDateString('id-ID', { weekday: 'short' });
            acc[day] = (acc[day] || 0) + sale.grandTotal;
            return acc;
        }, {} as Record<string, number>);
        return Object.keys(data).map(day => ({ name: day, Sales: data[day] }));
    }, [filteredSales]);

    const salesByChannelData = useMemo(() => {
        const channels = filteredSales.reduce((acc, sale: Sale) => {
            const channel = sale.saleChannel || 'Manual';
            acc[channel] = (acc[channel] || 0) + 1;
            return acc;
        }, {} as Record<string, number>);
        return Object.entries(channels).map(([name, value]) => ({ name, value }));
    }, [filteredSales]);
    
    const pieChartColors = getChartColors(themeConfig, 5);
    const barChartColor = getChartColors(themeConfig, 1)[0];
    const backgroundGradient = themeConfig.mode === 'gradient' ? 'bg-gradient-to-br from-gradient-from to-gradient-to' : 'bg-primary-500';

    return (
        <div className="p-3 sm:p-6 lg:p-8 space-y-6 overflow-y-auto">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Dasbor Sistem</h1>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard title="Pendapatan (30 Hari)" value={`Rp${financialStats.totalRevenue.toLocaleString('id-ID')}`} icon={<IncomeStatementIcon/>}/>
                <StatCard title="Laba Bersih (30 Hari)" value={`Rp${financialStats.netIncome.toLocaleString('id-ID')}`} icon={<FinancialPositionIcon/>} />
                <StatCard title="Tagihan Belum Lunas" value={operationalStats.unpaidInvoices.toString()} icon={<BillIcon/>}/>
                <StatCard title="Stok Rendah" value={operationalStats.lowStockItems.toString()} icon={<ProductStockIcon/>}/>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <Card className="lg:col-span-1 space-y-4">
                    <h3 className="font-semibold text-lg">Ringkasan Operasional</h3>
                    <div className="flex justify-between items-center"><span>PO Tertunda:</span><span className="font-bold">{operationalStats.pendingPOs}</span></div>
                    <div className="flex justify-between items-center"><span>Staf Hadir Hari Ini:</span><span className="font-bold">{hrmStats.present} / {hrmStats.activeStaff}</span></div>
                    <div className="flex justify-between items-center"><span>Total Pelanggan:</span><span className="font-bold">{customers.length}</span></div>
                </Card>
                <Card className="lg:col-span-2">
                    <h3 className="font-semibold text-lg mb-2">Aktivitas Terkini</h3>
                    <ul className="space-y-3">
                        {recentActivities.map((act, i) => (
                            <li key={i} className="flex items-center gap-4">
                                <div className="p-2 bg-slate-100 dark:bg-gray-700/50 rounded-full">{act.icon}</div>
                                <div className="flex-grow">
                                    <p className="text-sm">{act.description}</p>
                                    <p className="text-xs text-gray-500">{act.date.toLocaleString('id-ID')}</p>
                                </div>
                            </li>
                        ))}
                    </ul>
                </Card>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className={`lg:col-span-2 p-6 rounded-xl shadow-sm border border-slate-200 dark:border-gray-700 ${backgroundGradient}`}>
                    <h3 className="text-lg font-semibold text-white mb-4">Penjualan Minggu Ini</h3>
                    <ResponsiveContainer width="100%" height={300}>
                        <BarChart data={salesByDayChart}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.2)" />
                            <XAxis dataKey="name" tick={{ fill: 'rgba(255,255,255,0.8)' }} />
                            <YAxis tick={{ fill: 'rgba(255,255,255,0.8)' }} tickFormatter={(value) => new Intl.NumberFormat('id-ID', { notation: 'compact', compactDisplay: 'short' }).format(value as number)} />
                            <Tooltip contentStyle={{ backgroundColor: 'rgba(31, 41, 55, 0.8)', border: 'none', color: '#fff', borderRadius: '0.5rem' }} formatter={(value) => `Rp${(value as number).toLocaleString('id-ID')}`} />
                            <Bar dataKey="Sales" fill={barChartColor} radius={[4, 4, 0, 0]} />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
                <Card>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Penjualan per Saluran</h3>
                    <ResponsiveContainer width="100%" height={300}>
                        <PieChart>
                            <Pie data={salesByChannelData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={100} labelLine={false} label={({ name, percent }) => `${name} (${((percent || 0) * 100).toFixed(0)}%)`}>
                                {salesByChannelData.map((entry, index) => <Cell key={`cell-${index}`} fill={pieChartColors[index % pieChartColors.length]} />)}
                            </Pie>
                            <Tooltip formatter={(value) => `${value} transaksi`} />
                        </PieChart>
                    </ResponsiveContainer>
                </Card>
            </div>
        </div>
    );
};
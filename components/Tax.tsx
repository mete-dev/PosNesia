import React, { useState, useMemo } from 'react';
import { useAppContext } from '../hooks/useAppContext';
import { AccountType, TaxRate } from '../types';

// --- Shared Components ---
const Card: React.FC<{ title: string; value: string; className?: string }> = ({ title, value, className = '' }) => (
    <div className={`bg-white dark:bg-gray-800 p-6 rounded-xl shadow-md ${className}`}>
        <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">{title}</h3>
        <p className="mt-1 text-3xl font-semibold text-gray-900 dark:text-white">{value}</p>
    </div>
);

const DateRangeFilter: React.FC<{
    onFilter: (startDate: string, endDate: string) => void;
    title?: string;
    defaultRange?: number; // in days
}> = ({ onFilter, title = "Periode Laporan", defaultRange = 30 }) => {
    const today = new Date();
    const pastDate = new Date();
    pastDate.setDate(today.getDate() - defaultRange);

    const [startDate, setStartDate] = useState(pastDate.toISOString().split('T')[0]);
    const [endDate, setEndDate] = useState(today.toISOString().split('T')[0]);

    const handleApplyFilter = () => {
        onFilter(startDate, endDate);
    };

    React.useEffect(() => {
        handleApplyFilter();
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    return (
        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-md mb-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">{title}</h3>
            <div className="flex flex-wrap items-end gap-4">
                <div>
                    <label htmlFor="start_date" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Tanggal Mulai</label>
                    <input type="date" id="start_date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="mt-1 block w-full rounded-md bg-gray-100 dark:bg-gray-700 border-transparent"/>
                </div>
                <div>
                    <label htmlFor="end_date" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Tanggal Selesai</label>
                    <input type="date" id="end_date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="mt-1 block w-full rounded-md bg-gray-100 dark:bg-gray-700 border-transparent"/>
                </div>
                <button onClick={handleApplyFilter} className="px-4 py-2 bg-primary-600 text-white rounded-lg font-semibold hover:bg-primary-700 self-end">
                    Terapkan
                </button>
            </div>
        </div>
    );
};


// --- Tax Summary Page ---
export const TaxSummaryPage: React.FC = () => {
    const { state } = useAppContext();
    const { accounts, isTaxEnabled } = state;
    
    if (!isTaxEnabled) {
        return (
            <div className="p-8 text-center">
                <h2 className="text-xl font-semibold text-gray-700 dark:text-gray-300">Sistem Pajak Dinonaktifkan</h2>
                <p className="text-gray-500 mt-2">Aktifkan sistem pajak di Pengaturan Pajak untuk melihat ringkasan.</p>
            </div>
        );
    }

    const ppnMasukan = accounts.find(a => a.id === '1220')?.balance || 0;
    const ppnKeluaran = Math.abs(accounts.find(a => a.id === '2210')?.balance || 0);
    const taxPosition = ppnMasukan - ppnKeluaran;

    return (
        <div className="p-8 space-y-8 overflow-y-auto">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Ringkasan Pajak</h1>
            <p className="text-gray-500 dark:text-gray-400">Ringkasan posisi PPN berdasarkan semua data transaksi yang tercatat.</p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card title="Total PPN Masukan (VAT In)" value={`Rp${ppnMasukan.toLocaleString('id-ID')}`} className="text-blue-500" />
                <Card title="Total PPN Keluaran (VAT Out)" value={`Rp${ppnKeluaran.toLocaleString('id-ID')}`} className="text-orange-500" />
                <Card 
                    title={taxPosition > 0 ? "PPN Lebih Bayar" : "PPN Kurang Bayar"} 
                    value={`Rp${Math.abs(taxPosition).toLocaleString('id-ID')}`} 
                    className={taxPosition > 0 ? "text-green-500" : "text-red-500"}
                />
            </div>
            <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-md">
                <h3 className="text-lg font-semibold">Cara Kerja</h3>
                <p className="mt-2 text-gray-600 dark:text-gray-400">
                    <strong>PPN Masukan</strong> adalah PPN yang Anda bayar saat membeli barang/jasa dari vendor. Ini adalah aset Anda.<br/>
                    <strong>PPN Keluaran</strong> adalah PPN yang Anda pungut dari pelanggan saat menjual barang/jasa. Ini adalah liabilitas (utang) Anda kepada negara.<br/>
                    <strong>Posisi PPN</strong> dihitung dari <code className="text-sm bg-gray-200 dark:bg-gray-700 px-1 py-0.5 rounded">PPN Masukan - PPN Keluaran</code>.<br/>
                    - Jika hasilnya positif (Lebih Bayar), Anda memiliki klaim restitusi dari negara.<br/>
                    - Jika hasilnya negatif (Kurang Bayar), Anda harus menyetorkan selisihnya ke negara.
                </p>
            </div>
        </div>
    );
};

// --- Input Tax Report Page ---
export const InputTaxReportPage: React.FC = () => {
    const { state } = useAppContext();
    const [filteredPurchases, setFilteredPurchases] = useState(state.purchases);
    
     if (!state.isTaxEnabled) {
        return (
            <div className="p-8 text-center">
                <h2 className="text-xl font-semibold text-gray-700 dark:text-gray-300">Sistem Pajak Dinonaktifkan</h2>
            </div>
        );
    }

    const handleFilter = (start: string, end: string) => {
        const startDate = new Date(start);
        startDate.setHours(0, 0, 0, 0);
        const endDate = new Date(end);
        endDate.setHours(23, 59, 59, 999);
        const filtered = state.purchases.filter(p => new Date(p.orderDate) >= startDate && new Date(p.orderDate) <= endDate && p.taxAmount > 0);
        setFilteredPurchases(filtered);
    };

    return (
        <div className="p-8 h-full flex flex-col">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-6">Laporan PPN Masukan</h1>
            <DateRangeFilter onFilter={handleFilter} />
            <div className="flex-grow bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-y-auto">
                <table className="w-full text-sm text-left text-gray-500 dark:text-gray-400">
                    <thead className="text-xs text-gray-700 uppercase bg-gray-50 dark:bg-gray-700 dark:text-gray-400 sticky top-0">
                        <tr>
                            <th scope="col" className="px-6 py-3">Tanggal</th>
                            <th scope="col" className="px-6 py-3">ID Pembelian</th>
                            <th scope="col" className="px-6 py-3">Vendor</th>
                            <th scope="col" className="px-6 py-3 text-right">Dasar Pengenaan Pajak (DPP)</th>
                            <th scope="col" className="px-6 py-3 text-right">PPN Masukan</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredPurchases.map(p => (
                            <tr key={p.id} className="bg-white dark:bg-gray-800 border-b dark:border-gray-700">
                                <td className="px-6 py-4">{new Date(p.orderDate).toLocaleDateString('id-ID')}</td>
                                <td className="px-6 py-4 font-medium">{p.id}</td>
                                <td className="px-6 py-4">{p.vendorName}</td>
                                <td className="px-6 py-4 text-right">Rp{p.subtotal.toLocaleString('id-ID')}</td>
                                <td className="px-6 py-4 text-right font-semibold">Rp{p.taxAmount.toLocaleString('id-ID')}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

// --- Output Tax Report Page ---
export const OutputTaxReportPage: React.FC = () => {
    const { state } = useAppContext();
    const [filteredSales, setFilteredSales] = useState(state.sales);

     if (!state.isTaxEnabled) {
        return (
            <div className="p-8 text-center">
                <h2 className="text-xl font-semibold text-gray-700 dark:text-gray-300">Sistem Pajak Dinonaktifkan</h2>
            </div>
        );
    }
    
    const handleFilter = (start: string, end: string) => {
        const startDate = new Date(start);
        startDate.setHours(0, 0, 0, 0);
        const endDate = new Date(end);
        endDate.setHours(23, 59, 59, 999);
        const filtered = state.sales.filter(s => new Date(s.date) >= startDate && new Date(s.date) <= endDate && s.taxAmount > 0);
        setFilteredSales(filtered);
    };

    return (
        <div className="p-8 h-full flex flex-col">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-6">Laporan PPN Keluaran</h1>
            <DateRangeFilter onFilter={handleFilter} />
            <div className="flex-grow bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-y-auto">
                <table className="w-full text-sm text-left text-gray-500 dark:text-gray-400">
                    <thead className="text-xs text-gray-700 uppercase bg-gray-50 dark:bg-gray-700 dark:text-gray-400 sticky top-0">
                        <tr>
                            <th scope="col" className="px-6 py-3">Tanggal</th>
                            <th scope="col" className="px-6 py-3">ID Penjualan</th>
                            <th scope="col" className="px-6 py-3">Pelanggan</th>
                            <th scope="col" className="px-6 py-3 text-right">Dasar Pengenaan Pajak (DPP)</th>
                            <th scope="col" className="px-6 py-3 text-right">PPN Keluaran</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredSales.map(s => (
                            <tr key={s.id} className="bg-white dark:bg-gray-800 border-b dark:border-gray-700">
                                <td className="px-6 py-4">{new Date(s.date).toLocaleDateString('id-ID')}</td>
                                <td className="px-6 py-4 font-medium">{s.id}</td>
                                <td className="px-6 py-4">{s.customerName}</td>
                                <td className="px-6 py-4 text-right">Rp{(s.subtotal - s.discount).toLocaleString('id-ID')}</td>
                                <td className="px-6 py-4 text-right font-semibold">Rp{s.taxAmount.toLocaleString('id-ID')}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

// --- Tax Settings Page ---
export const TaxSettingsPage: React.FC = () => {
    const { state, dispatch } = useAppContext();
    const [rates, setRates] = useState<TaxRate[]>(state.taxRates);

    const handleRateChange = (id: string, newRate: string) => {
        const updatedRates = rates.map(r => r.id === id ? { ...r, rate: parseFloat(newRate) / 100 } : r);
        setRates(updatedRates);
    };
    
    const handleSave = () => {
        dispatch({ type: 'settings/updateTaxRates', payload: rates });
        alert("Pengaturan pajak disimpan!");
    };
    
    const handleToggleTaxSystem = () => {
        dispatch({ type: 'settings/toggleTaxSystem' });
    };

    return (
        <div className="p-8 space-y-8 overflow-y-auto">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Pengaturan Pajak</h1>
            
            <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-md max-w-lg mx-auto">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Status Sistem Pajak</h3>
                <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                    <p className="font-medium">
                        Sistem Pajak saat ini: <span className={state.isTaxEnabled ? "text-green-500 font-bold" : "text-red-500 font-bold"}>{state.isTaxEnabled ? "AKTIF" : "NON-AKTIF"}</span>
                    </p>
                     <label className="relative inline-flex items-center cursor-pointer">
                        <input type="checkbox" checked={state.isTaxEnabled} onChange={handleToggleTaxSystem} className="sr-only peer" />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-primary-600"></div>
                    </label>
                </div>
                <p className="text-xs text-gray-500 mt-2">Jika dinonaktifkan, semua perhitungan dan kolom terkait pajak akan disembunyikan di seluruh sistem.</p>
            </div>

            <div className={`bg-white dark:bg-gray-800 p-6 rounded-xl shadow-md max-w-lg mx-auto transition-opacity ${!state.isTaxEnabled && 'opacity-50 pointer-events-none'}`}>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Tarif Pajak</h3>
                <div className="space-y-4">
                    {rates.map(rate => (
                        <div key={rate.id} className="flex items-center justify-between">
                            <label htmlFor={`rate-${rate.id}`} className="font-medium">{rate.name} {rate.isDefault && "(Default)"}</label>
                            <div className="flex items-center">
                                <input 
                                    type="number" 
                                    id={`rate-${rate.id}`}
                                    value={(rate.rate * 100).toFixed(2)}
                                    onChange={e => handleRateChange(rate.id, e.target.value)}
                                    className="w-24 text-right rounded-md bg-gray-100 dark:bg-gray-700 border-transparent focus:border-primary-500"
                                    disabled={!state.isTaxEnabled}
                                />
                                <span className="ml-2">%</span>
                            </div>
                        </div>
                    ))}
                </div>
                 <div className="flex justify-end mt-6">
                    <button onClick={handleSave} className="px-6 py-2 bg-primary-600 text-white rounded-lg font-semibold hover:bg-primary-700" disabled={!state.isTaxEnabled}>
                        Simpan Perubahan
                    </button>
                </div>
            </div>
        </div>
    );
};
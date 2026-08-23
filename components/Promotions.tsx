
import React, { useState, useEffect, useMemo } from 'react';
import { Promotion, Product, Customer, ProductCategory, Principal, Status, Page, PointsSettings, PromotionBenefit, PromotionCondition, PromotionCustomerTarget, Brand } from '../types';
import { useAppContext } from '../hooks/useAppContext';
import { Modal, Button, Input, Label, Select, Textarea } from './ui';

const PromotionModal: React.FC<{
    isOpen: boolean;
    onClose: () => void;
    promoCategory: Promotion['promoCategory'];
    existingPromo: Promotion | null;
}> = ({ isOpen, onClose, promoCategory, existingPromo }) => {
    const { state, dispatch } = useAppContext();
    const { products, productCategories, brands, principals } = state;

    // Form state initialization
    const [name, setName] = useState('');
    const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
    const [endDate, setEndDate] = useState('');
    const [voucherCode, setVoucherCode] = useState('');
    const [discountType, setDiscountType] = useState<'percentage' | 'nominal'>('percentage');
    const [discountValue, setDiscountValue] = useState<number | string>('');
    const [maxDiscountAmount, setMaxDiscountAmount] = useState<number | string>('');
    const [minPurchaseValue, setMinPurchaseValue] = useState<number | string>('');
    const [applyBy, setApplyBy] = useState<PromotionCondition['applyBy']>('all_products');
    const [appliesToIds, setAppliesToIds] = useState<string[]>([]);

    useEffect(() => {
        if (isOpen) {
            if (existingPromo) {
                // Populate form with existing data
                setName(existingPromo.name);
                setStartDate(existingPromo.startDate.split('T')[0]);
                setEndDate(existingPromo.endDate.split('T')[0]);
                setVoucherCode(existingPromo.voucherCode || '');
                setDiscountType(existingPromo.benefit.discountType || 'percentage');
                setDiscountValue(existingPromo.benefit.value);
                setMaxDiscountAmount(existingPromo.benefit.maxDiscountAmount || '');
                setMinPurchaseValue(existingPromo.condition.minPurchaseValue || '');
                setApplyBy(existingPromo.condition.applyBy || 'all_products');
                setAppliesToIds(existingPromo.condition.appliesToIds || []);
            } else {
                // Reset form for new entry
                setName('');
                setStartDate(new Date().toISOString().split('T')[0]);
                const nextMonth = new Date();
                nextMonth.setMonth(nextMonth.getMonth() + 1);
                setEndDate(nextMonth.toISOString().split('T')[0]);
                setVoucherCode('');
                setDiscountType('percentage');
                setDiscountValue('');
                setMaxDiscountAmount('');
                setMinPurchaseValue('');
                setApplyBy('all_products');
                setAppliesToIds([]);
            }
        }
    }, [isOpen, existingPromo]);

    const getApplicableItems = () => {
        switch (applyBy) {
            case 'product': return products;
            case 'category': return productCategories;
            case 'brand': return brands;
            case 'principal': return principals;
            default: return [];
        }
    };
    
    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        
        const benefit: PromotionBenefit = {
            type: discountType === 'percentage' ? 'percentage_discount' : 'fixed_discount',
            discountType: discountType,
            value: Number(discountValue),
            maxDiscountAmount: maxDiscountAmount ? Number(maxDiscountAmount) : undefined,
        };
        const condition: PromotionCondition = { 
            applyBy, 
            appliesToIds: applyBy === 'all_products' ? [] : appliesToIds,
            minPurchaseValue: minPurchaseValue ? Number(minPurchaseValue) : undefined,
        };
        const customerTarget: PromotionCustomerTarget = { applyTo: 'all_customers' };

        const promoData: Omit<Promotion, 'id'> = {
            name,
            promoCategory,
            benefit,
            condition,
            customerTarget,
            startDate,
            endDate,
            status: 'active',
            ...(promoCategory === 'Voucher' && { voucherCode: voucherCode.toUpperCase() })
        };
        
        if (existingPromo) {
            dispatch({ type: 'promotions/update', payload: { ...promoData, id: existingPromo.id } });
        } else {
            dispatch({ type: 'promotions/add', payload: promoData });
        }
        onClose();
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={`Buat ${promoCategory} Baru`} maxWidth="max-w-3xl">
            <form onSubmit={handleSubmit} className="space-y-4 text-xs">
                <Input value={name} onChange={e => setName(e.target.value)} placeholder="Nama Promosi / Voucher" required />
                {promoCategory === 'Voucher' && (
                    <Input 
                        value={voucherCode} 
                        onChange={e => setVoucherCode(e.target.value)} 
                        placeholder="Kode Voucher (Contoh: DISKON20)" 
                        className="font-mono uppercase font-bold"
                        required 
                    />
                )}
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <Label>Tanggal Mulai</Label>
                        <Input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} required />
                    </div>
                    <div>
                        <Label>Tanggal Selesai</Label>
                        <Input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} required />
                    </div>
                </div>

                {/* Section Benefit Diskon */}
                <div className="p-4 border rounded-xl dark:border-gray-700 bg-slate-50/50 dark:bg-zinc-800/40 space-y-3">
                    <h3 className="font-extrabold text-sm text-slate-800 dark:text-zinc-200">Keuntungan Diskon (Benefit)</h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                        <div>
                            <Label>Tipe Diskon</Label>
                            <Select value={discountType} onChange={e => setDiscountType(e.target.value as any)}>
                                <option value="percentage">Persentase (%)</option>
                                <option value="nominal">Nominal (Rp)</option>
                            </Select>
                        </div>
                        <div>
                            <Label>{discountType === 'percentage' ? 'Nilai Diskon (%)' : 'Nilai Potongan (Rp)'}</Label>
                            <Input type="number" value={discountValue} onChange={e => setDiscountValue(e.target.value)} placeholder={discountType === 'percentage' ? 'Misal: 20' : 'Misal: 50000'} required />
                        </div>
                        {discountType === 'percentage' && (
                            <div>
                                <Label>Maksimal Diskon Rp (Opsional)</Label>
                                <Input type="number" value={maxDiscountAmount} onChange={e => setMaxDiscountAmount(e.target.value)} placeholder="Misal: 25000" />
                            </div>
                        )}
                    </div>
                </div>

                {/* Section Cakupan & Syarat Voucher */}
                <div className="p-4 border rounded-xl dark:border-gray-700 bg-slate-50/50 dark:bg-zinc-800/40 space-y-3">
                     <h3 className="font-extrabold text-sm text-slate-800 dark:text-zinc-200">Cakupan Produk & Syarat Minimal Belanja</h3>
                     <div className="space-y-3">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            <div>
                                <Label>Cakupan Voucher (Berlaku Untuk)</Label>
                                <Select value={applyBy} onChange={e => {setApplyBy(e.target.value as any); setAppliesToIds([]);}}>
                                    <option value="all_products">Semua Produk (Default)</option>
                                    <option value="category">Kategori Tertentu</option>
                                    <option value="product">Produk Tertentu</option>
                                    <option value="brand">Merk Tertentu</option>
                                    <option value="principal">Principal Tertentu</option>
                                </Select>
                            </div>
                            <div>
                                <Label>Minimum Transaksi Produk Promo (Rp)</Label>
                                <Input type="number" value={minPurchaseValue} onChange={e => setMinPurchaseValue(e.target.value)} placeholder="0 (Tanpa minimum)" />
                            </div>
                        </div>

                        {applyBy !== 'all_products' && (
                            <div>
                                <Label>Pilih {applyBy === 'category' ? 'Kategori' : applyBy === 'product' ? 'Produk' : applyBy === 'brand' ? 'Merk' : 'Principal'} yang Memenuhi Syarat (Pilih satu atau lebih)</Label>
                                <select 
                                    multiple 
                                    value={appliesToIds} 
                                    onChange={e => setAppliesToIds(Array.from(e.target.selectedOptions, option => option.value))} 
                                    className="h-28 mt-1 block w-full rounded-xl bg-white dark:bg-zinc-900 border border-slate-300 dark:border-zinc-700 p-2 font-mono text-xs focus:ring-2 focus:ring-purple-500"
                                >
                                    {getApplicableItems().map(item => (
                                        <option key={item.id} value={item.id} className="p-1 hover:bg-purple-100 dark:hover:bg-zinc-800">
                                            {item.name}
                                        </option>
                                    ))}
                                </select>
                                <p className="text-[10px] text-slate-400 mt-1">Tekan `Ctrl` (Windows) / `Cmd` (Mac) untuk memilih lebih dari satu item.</p>
                            </div>
                        )}
                    </div>
                </div>

                <div className="flex justify-end gap-2 pt-2">
                    <Button type="button" variant="secondary" onClick={onClose}>Batal</Button>
                    <Button type="submit" className="bg-purple-600 hover:bg-purple-700 text-white font-bold">Simpan Voucher / Promo</Button>
                </div>
            </form>
        </Modal>
    );
};

// --- MAIN PAGE COMPONENT ---
export const PromotionsPage: React.FC = () => {
    const { state } = useAppContext();
    const { currentPage } = state;
    
    const getInitialView = () => {
        if (currentPage === Page.PromotionsVoucher) return 'voucher';
        if (currentPage === Page.PromotionsPoints) return 'poin';
        return 'promosi';
    };
    
    const [view, setView] = useState<'promosi' | 'voucher' | 'poin'>(getInitialView());

    const renderView = () => {
        switch (view) {
            case 'promosi': return <StandardPromotionsView />;
            case 'voucher': return <VoucherPromotionsView />;
            case 'poin': return <PointsProgramView />;
            default: return <StandardPromotionsView />;
        }
    };

    return (
        <div className="p-8 h-full flex flex-col">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">Pemasaran</h1>
            <div className="flex space-x-2 border-b dark:border-gray-700 mb-6">
                <button onClick={() => setView('promosi')} className={`py-2 px-4 text-sm font-medium ${view === 'promosi' ? 'border-b-2 border-primary-500 text-primary-500' : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'}`}>Promosi</button>
                <button onClick={() => setView('voucher')} className={`py-2 px-4 text-sm font-medium ${view === 'voucher' ? 'border-b-2 border-primary-500 text-primary-500' : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'}`}>Voucher</button>
                <button onClick={() => setView('poin')} className={`py-2 px-4 text-sm font-medium ${view === 'poin' ? 'border-b-2 border-primary-500 text-primary-500' : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'}`}>Poin</button>
            </div>
            <div className="flex-grow overflow-y-auto">
                {renderView()}
            </div>
        </div>
    );
};

// --- Points Program View ---
const PointsProgramView: React.FC = () => {
    const { state, dispatch } = useAppContext();
    const [settings, setSettings] = useState<PointsSettings>(state.pointsSettings);

    const handleSaveSettings = () => {
        dispatch({ type: 'points/updateSettings', payload: settings });
        alert('Pengaturan poin berhasil disimpan!');
    };

    return (
        <div className="space-y-6">
            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
                <h2 className="text-xl font-semibold mb-4">Pengaturan Penukaran Poin (Redeem)</h2>
                <div className="space-y-4">
                    <div>
                        <Label>Nilai Tukar Poin (1 Poin = ... Rupiah)</Label>
                        <Input type="number" value={settings.pointToRupiahExchangeRate} onChange={e => setSettings({...settings, pointToRupiahExchangeRate: Number(e.target.value)})} />
                    </div>
                    <div>
                        <Label>Minimal Belanja untuk Penukaran (Rp)</Label>
                        <Input type="number" value={settings.minPurchaseForRedemption} onChange={e => setSettings({...settings, minPurchaseForRedemption: Number(e.target.value)})} />
                    </div>
                     <div className="grid grid-cols-2 gap-4">
                        <div>
                            <Label>Maksimal Penukaran per Transaksi</Label>
                            <Select value={settings.maxRedemptionType} onChange={e => setSettings({...settings, maxRedemptionType: e.target.value as any})}>
                                <option value="points">Berdasarkan Poin</option>
                                <option value="percentage">Berdasarkan Persentase Belanja</option>
                            </Select>
                        </div>
                        <div>
                            <Label>Nilai Maksimal</Label>
                            <Input type="number" value={settings.maxRedemptionValue} onChange={e => setSettings({...settings, maxRedemptionValue: Number(e.target.value)})} />
                        </div>
                    </div>
                     <div className="flex justify-end">
                        <Button onClick={handleSaveSettings}>Simpan Pengaturan Poin</Button>
                    </div>
                </div>
            </div>
            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
                 <h2 className="text-xl font-semibold mb-4">Program Perolehan Poin (Reward)</h2>
                 <p className="text-sm text-gray-500 mb-4">Buat aturan untuk bagaimana pelanggan mendapatkan poin, seperti promo double poin, dll.</p>
                 {/* This would render a table similar to promotions/vouchers, but filtered for 'Program Poin' */}
                 <div className="text-center p-4 border-2 border-dashed rounded-lg">
                    <p className="text-gray-500">Tabel Program Poin akan ditampilkan di sini.</p>
                     <Button className="mt-2">Buat Program Poin Baru</Button>
                 </div>
            </div>
        </div>
    );
};

// --- Promotions & Voucher Views ---
const StandardPromotionsView: React.FC = () => {
  const { state } = useAppContext();
  const promotions = useMemo(() => state.promotions.filter(p => p.promoCategory === 'Promosi'), [state.promotions]);
  return <PromotionListTable promotions={promotions} title="Promosi" promoCategory="Promosi" />;
};
const VoucherPromotionsView: React.FC = () => {
  const { state } = useAppContext();
  const promotions = useMemo(() => state.promotions.filter(p => p.promoCategory === 'Voucher'), [state.promotions]);
  return <PromotionListTable promotions={promotions} title="Voucher" promoCategory="Voucher" />;
};

const PromotionListTable: React.FC<{ promotions: Promotion[], title: string, promoCategory: Promotion['promoCategory'] }> = ({ promotions, title, promoCategory }) => {
    const { dispatch } = useAppContext();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingPromo, setEditingPromo] = useState<Promotion | null>(null);

    const handleOpenModal = (promo: Promotion | null) => {
        setEditingPromo(promo);
        setIsModalOpen(true);
    };
    
    const handlePrint = (promo: Promotion) => {
        dispatch({ type: 'ui/setPrintSelection', payload: { type: 'promo', ids: [promo.id] } });
        dispatch({ type: 'ui/setPage', payload: Page.PrintPriceLabels });
    };
    
    return (
        <div>
            <div className="flex justify-between items-center mb-4">
                 <h2 className="text-xl font-semibold">{title}</h2>
                 <Button onClick={() => handleOpenModal(null)}>Buat {title} Baru</Button>
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-x-auto">
                <table className="w-full text-sm text-left text-gray-500 dark:text-gray-400">
                    <thead className="text-xs text-gray-700 uppercase bg-gray-50 dark:bg-gray-700 dark:text-gray-400">
                        <tr>
                            <th className="px-6 py-3">Nama</th>
                            {promoCategory === 'Voucher' && <th className="px-6 py-3">Kode</th>}
                            <th className="px-6 py-3">Tipe</th>
                            <th className="px-6 py-3">Periode</th>
                            <th className="px-6 py-3">Status</th>
                            <th className="px-6 py-3">Aksi</th>
                        </tr>
                    </thead>
                    <tbody>
                        {promotions.map(promo => (
                            <tr key={promo.id} className="border-b dark:border-gray-700">
                                <td className="px-6 py-4 font-medium">{promo.name}</td>
                                {promoCategory === 'Voucher' && <td className="px-6 py-4 font-mono">{promo.voucherCode}</td>}
                                <td className="px-6 py-4">{promo.benefit.discountType}</td>
                                <td className="px-6 py-4">{new Date(promo.startDate).toLocaleDateString()} - {new Date(promo.endDate).toLocaleDateString()}</td>
                                <td className="px-6 py-4">{promo.status}</td>
                                <td className="px-6 py-4">
                                    <Button onClick={() => handlePrint(promo)} variant="secondary" size="sm">Cetak Label Promo</Button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
            <PromotionModal 
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                promoCategory={promoCategory}
                existingPromo={editingPromo}
            />
        </div>
    );
};
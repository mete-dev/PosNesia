import React, { useState, useMemo, useEffect, useRef } from 'react';
import { PurchaseOrder, Vendor, Product, PurchaseOrderItem, Page } from '../types';
import { useAppContext } from '../hooks/useAppContext';
import { ActionsDropdown, DropdownItem, Modal, Button, Input } from './ui';
import { VendorBillModal } from './Bills';
import { ProductModal } from './Products';


export const PurchaseOrderDetailsPage: React.FC<{ purchaseOrderId?: string, onBack?: () => void }> = ({ purchaseOrderId, onBack }) => {
    const { state, dispatch } = useAppContext();
    const { purchases, paymentMethods, accounts, selectedPurchaseOrderId } = state;

    const targetId = purchaseOrderId || selectedPurchaseOrderId;
    const purchaseOrder = useMemo(() => purchases.find(p => p.id === targetId), [purchases, targetId]);

    const [activeTab, setActiveTab] = useState<'pesanan' | 'pembayaran'>('pesanan');
    const [isPayModalOpen, setPayModalOpen] = useState(false);
    const [isPartialModalOpen, setPartialModalOpen] = useState(false);

    // Form bayar cicilan/lunas
    const [payAmount, setPayAmount] = useState<number>(0);
    const [selectedPaymentMethodId, setSelectedPaymentMethodId] = useState('');
    const [selectedAccountId, setSelectedAccountId] = useState('');
    const [payNotes, setPayNotes] = useState('');

    // Partial receive form
    const [partialQtys, setPartialQtys] = useState<Record<string, number>>({});

    useEffect(() => {
        if (purchaseOrder) {
            const remaining = purchaseOrder.grandTotal - (purchaseOrder.amountPaid || 0);
            setPayAmount(Math.max(0, remaining));
            if (paymentMethods.length > 0) setSelectedPaymentMethodId(paymentMethods[0].id);
            if (accounts.length > 0) setSelectedAccountId(accounts.find(a => a.isCashAccount)?.id || accounts[0].id);

            const initialQtys: Record<string, number> = {};
            purchaseOrder.items.forEach(i => {
                const unrec = i.quantity - (i.receivedQuantity || 0);
                initialQtys[i.productId] = Math.max(0, unrec);
            });
            setPartialQtys(initialQtys);
        }
    }, [purchaseOrder, paymentMethods, accounts]);

    const handleGoBack = () => {
        if (onBack) onBack();
        else dispatch({ type: 'ui/setPage', payload: Page.PurchaseList });
    };

    if (!purchaseOrder) {
        return (
            <div className="p-6 text-center space-y-4">
                <p className="text-slate-400">Data pembelian tidak ditemukan.</p>
                <Button onClick={handleGoBack}>Kembali ke Daftar Pembelian</Button>
            </div>
        );
    }

    const subtotal = purchaseOrder.items.reduce((sum, item) => sum + (item.cost * item.quantity), 0);
    const amountPaid = purchaseOrder.amountPaid || 0;
    const remainingBalance = Math.max(0, purchaseOrder.grandTotal - amountPaid);

    const handleConfirmPayment = (e: React.FormEvent) => {
        e.preventDefault();
        if (payAmount <= 0) {
            alert('Nominal pembayaran harus lebih dari 0.');
            return;
        }
        dispatch({
            type: 'purchases/addPayment',
            payload: {
                poId: purchaseOrder.id,
                amount: payAmount,
                paymentMethodId: selectedPaymentMethodId,
                sourceAccountId: selectedAccountId,
                notes: payNotes,
            }
        });
        setPayModalOpen(false);
        setPayNotes('');
    };

    const handleConfirmPartialReceive = (e: React.FormEvent) => {
        e.preventDefault();
        const payloadItems = Object.entries(partialQtys).map(([productId, receivedQty]) => ({ productId, receivedQty: Number(receivedQty) || 0 }));
        dispatch({
            type: 'purchases/partialReceive',
            payload: { poId: purchaseOrder.id, items: payloadItems }
        });
        setPartialModalOpen(false);
    };

    return (
        <div className="w-full h-full flex flex-col p-4 md:p-6 space-y-4 overflow-y-auto bg-slate-50 dark:bg-zinc-950">
            {/* Top Toolbar Navigation */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 shrink-0 bg-white dark:bg-zinc-900 p-4 rounded-xl border border-slate-200/80 dark:border-zinc-800 shadow-2xs">
                <div>
                    <nav className="flex items-center gap-1.5 text-xs text-slate-400 dark:text-zinc-400 mb-1">
                        <span onClick={handleGoBack} className="hover:underline cursor-pointer">Data Pembelian</span>
                        <span>/</span>
                        <span className="font-bold text-slate-700 dark:text-zinc-200">Detail #{purchaseOrder.id}</span>
                    </nav>
                    <h1 className="text-xl font-black text-slate-900 dark:text-white leading-tight flex items-center gap-2">
                        Pembelian #{purchaseOrder.id}
                    </h1>
                </div>

                <div className="flex items-center gap-2">
                    <Button type="button" variant="secondary" onClick={handleGoBack} className="text-xs py-1.5 px-3">
                        ← Kembali
                    </Button>
                </div>
            </div>

            {/* Document Details Sheet */}
            <div className="bg-white dark:bg-zinc-900 rounded-xl shadow-xs border border-slate-200 dark:border-zinc-800 p-5 md:p-6 space-y-5 text-xs">
                {/* Header Summary Card */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 bg-slate-50 dark:bg-zinc-800/60 p-4 rounded-xl border border-slate-200 dark:border-zinc-700">
                    <div><p className="text-[11px] text-slate-400 font-bold uppercase">Vendor</p><p className="font-extrabold text-sm text-slate-900 dark:text-white">{purchaseOrder.vendorName}</p></div>
                    <div><p className="text-[11px] text-slate-400 font-bold uppercase">Tgl. Pesan</p><p className="font-bold font-mono text-sm">{new Date(purchaseOrder.orderDate).toLocaleDateString('id-ID')}</p></div>
                    <div><p className="text-[11px] text-slate-400 font-bold uppercase">Status Barang</p><p className="font-bold text-sm text-blue-600">{purchaseOrder.itemStatus || 'Draft'}</p></div>
                    <div><p className="text-[11px] text-slate-400 font-bold uppercase">Status Bayar</p><p className={`font-bold text-sm ${purchaseOrder.paymentStatus === 'Lunas' ? 'text-emerald-600' : 'text-rose-600'}`}>{purchaseOrder.paymentStatus || 'Belum Lunas'}</p></div>
                </div>

                {/* 2 Tabs Header */}
                <div className="flex border-b border-slate-200 dark:border-zinc-800">
                    <button
                        type="button"
                        onClick={() => setActiveTab('pesanan')}
                        className={`pb-3 px-5 font-bold text-xs border-b-2 transition-colors ${activeTab === 'pesanan' ? 'border-purple-600 text-purple-600 dark:text-purple-400' : 'border-transparent text-slate-400 hover:text-slate-700'}`}
                    >
                        📦 Detail Pesanan & Penerimaan Barang
                    </button>
                    <button
                        type="button"
                        onClick={() => setActiveTab('pembayaran')}
                        className={`pb-3 px-5 font-bold text-xs border-b-2 transition-colors ${activeTab === 'pembayaran' ? 'border-purple-600 text-purple-600 dark:text-purple-400' : 'border-transparent text-slate-400 hover:text-slate-700'}`}
                    >
                        💳 Detail & Riwayat Pembayaran
                    </button>
                </div>

                {/* TAB 1: Detail Pesanan */}
                {activeTab === 'pesanan' && (
                    <div className="space-y-4">
                        <div className="flex justify-between items-center">
                            <h3 className="font-bold text-sm text-slate-800 dark:text-zinc-200">Daftar Produk yang Dipesan</h3>
                            {purchaseOrder.itemStatus !== 'Barang Diterima' && (
                                <Button onClick={() => setPartialModalOpen(true)} size="sm" className="text-xs bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-1.5 px-3">
                                    📦 Catat Penerimaan Barang (Sebagian / Full)
                                </Button>
                            )}
                        </div>

                        <table className="w-full text-xs text-left">
                            <thead className="bg-slate-100 dark:bg-zinc-800 uppercase font-bold text-slate-600 dark:text-zinc-400">
                                <tr>
                                    <th className="p-3">Produk</th>
                                    <th className="p-3 text-center">Dipesan</th>
                                    <th className="p-3 text-center">Diterima</th>
                                    <th className="p-3 text-right">Harga Satuan</th>
                                    <th className="p-3 text-right">Subtotal</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 dark:divide-zinc-800">
                                {purchaseOrder.items.map(item => (
                                    <tr key={item.productId}>
                                        <td className="p-3 font-medium text-slate-800 dark:text-zinc-200">{item.productName}</td>
                                        <td className="p-3 text-center font-mono font-bold">{item.quantity}</td>
                                        <td className="p-3 text-center font-mono font-bold text-emerald-600">{item.receivedQuantity || 0}</td>
                                        <td className="p-3 text-right font-mono">Rp{item.cost.toLocaleString('id-ID')}</td>
                                        <td className="p-3 text-right font-mono font-bold">Rp{(item.cost * item.quantity).toLocaleString('id-ID')}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>

                        <div className="space-y-1 text-right font-medium mt-4 bg-slate-50 dark:bg-zinc-800/40 p-4 rounded-xl border border-slate-200 dark:border-zinc-800">
                            <p className="text-slate-600 dark:text-zinc-400">Subtotal: <span className="font-mono font-bold text-slate-900 dark:text-white">Rp{subtotal.toLocaleString('id-ID')}</span></p>
                            <p className="text-lg font-black text-purple-700 dark:text-purple-400 pt-1 border-t border-slate-200 dark:border-zinc-700">Grand Total: Rp{subtotal.toLocaleString('id-ID')}</p>
                        </div>
                    </div>
                )}

                {/* TAB 2: Detail Pembayaran */}
                {activeTab === 'pembayaran' && (
                    <div className="space-y-4">
                        <div className="flex justify-between items-center bg-purple-50 dark:bg-purple-950/20 p-4 rounded-xl border border-purple-200 dark:border-purple-900/60">
                            <div>
                                <p className="text-[10px] text-purple-600 dark:text-purple-400 font-bold uppercase">Sisa Tagihan Pembelian</p>
                                <p className="text-xl font-black text-purple-900 dark:text-purple-200 font-mono">Rp{remainingBalance.toLocaleString('id-ID')}</p>
                                <p className="text-xs text-slate-500">Sudah Dibayar: <span className="font-bold text-emerald-600">Rp{amountPaid.toLocaleString('id-ID')}</span> dari Total Rp{purchaseOrder.grandTotal.toLocaleString('id-ID')}</p>
                            </div>
                            {remainingBalance > 0 && (
                                <Button onClick={() => setPayModalOpen(true)} className="bg-purple-700 hover:bg-purple-800 text-white font-bold px-4 py-2.5 text-xs rounded-xl shadow-xs">
                                    💳 Bayar / Catat Cicilan
                                </Button>
                            )}
                        </div>

                        <h4 className="font-bold text-slate-800 dark:text-zinc-200 border-b pb-2 text-sm">Riwayat Pembayaran</h4>
                        {(!purchaseOrder.paymentHistory || purchaseOrder.paymentHistory.length === 0) ? (
                            <p className="text-slate-400 italic text-center py-6">Belum ada riwayat pembayaran yang dicatat.</p>
                        ) : (
                            <table className="w-full text-xs text-left">
                                <thead className="bg-slate-100 dark:bg-zinc-800 uppercase font-bold text-slate-600 dark:text-zinc-400">
                                    <tr>
                                        <th className="p-3">Tgl. Bayar</th>
                                        <th className="p-3">Sumber Saldo/Akun</th>
                                        <th className="p-3 text-right">Nominal</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100 dark:divide-zinc-800">
                                    {purchaseOrder.paymentHistory.map(pay => (
                                        <tr key={pay.id}>
                                            <td className="p-3 font-mono">{new Date(pay.date).toLocaleString('id-ID')}</td>
                                            <td className="p-3 text-slate-500">{pay.sourceAccountName || pay.paymentMethodName || '-'}</td>
                                            <td className="p-3 text-right font-mono font-bold text-emerald-600">Rp{pay.amount.toLocaleString('id-ID')}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        )}
                    </div>
                )}
            </div>

            {/* Modal Pop-up Bayar / Cicilan */}
            <Modal isOpen={isPayModalOpen} onClose={() => setPayModalOpen(false)} title="Catat Pembayaran / Cicilan Pembelian" maxWidth="max-w-md">
                <form onSubmit={handleConfirmPayment} className="space-y-4 text-xs">
                    <div>
                        <label className="block font-bold text-slate-700 dark:text-zinc-300 mb-1">Nominal yang Dibayarkan (Rp)</label>
                        <Input 
                            type="number" 
                            value={payAmount} 
                            onChange={e => setPayAmount(Number(e.target.value))} 
                            required 
                            className="text-sm font-mono font-bold"
                        />
                        <p className="text-[10px] text-slate-400 mt-1">Sisa tagihan saat ini: Rp{remainingBalance.toLocaleString('id-ID')}</p>
                    </div>

                    <div>
                        <label className="block font-bold text-slate-700 dark:text-zinc-300 mb-1">Sumber Saldo / Dompet Kas</label>
                        <select 
                            value={selectedAccountId} 
                            onChange={e => setSelectedAccountId(e.target.value)}
                            required
                            className="w-full rounded-lg border border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-xs p-2 font-semibold outline-none"
                        >
                            {accounts.filter(a => a.isCashAccount).map(a => (
                                <option key={a.id} value={a.id}>{a.name} (Saldo: Rp{a.balance.toLocaleString('id-ID')})</option>
                            ))}
                        </select>
                    </div>

                    <div>
                        <label className="block font-bold text-slate-700 dark:text-zinc-300 mb-1">Catatan / Keterangan (Opsional)</label>
                        <Input value={payNotes} onChange={e => setPayNotes(e.target.value)} placeholder="Contoh: Cicilan tahap 1 via Kasir" className="text-xs" />
                    </div>

                    <div className="flex justify-end gap-2 pt-2 border-t dark:border-zinc-800">
                        <Button type="button" variant="secondary" onClick={() => setPayModalOpen(false)}>Batal</Button>
                        <Button type="submit" className="bg-purple-700 hover:bg-purple-800 text-white font-bold">Proses Pembayaran</Button>
                    </div>
                </form>
            </Modal>

            {/* Modal Pop-up Terima Barang Sebagian */}
            <Modal isOpen={isPartialModalOpen} onClose={() => setPartialModalOpen(false)} title="Catat Penerimaan Barang (Sebagian / Full)" maxWidth="max-w-lg">
                <form onSubmit={handleConfirmPartialReceive} className="space-y-4 text-xs">
                    <p className="text-slate-500">Masukkan jumlah unit barang yang baru saja diterima di lokasi toko/gudang:</p>
                    <table className="w-full text-xs text-left">
                        <thead className="bg-slate-100 dark:bg-zinc-800 font-bold">
                            <tr>
                                <th className="p-2">Produk</th>
                                <th className="p-2 text-center">Dipesan</th>
                                <th className="p-2 text-center">Sudah Diterima</th>
                                <th className="p-2 text-center">Terima Sekarang</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-zinc-800">
                            {purchaseOrder.items.map(item => {
                                const maxAllowed = item.quantity - (item.receivedQuantity || 0);
                                return (
                                    <tr key={item.productId}>
                                        <td className="p-2 font-semibold">{item.productName}</td>
                                        <td className="p-2 text-center font-mono">{item.quantity}</td>
                                        <td className="p-2 text-center font-mono text-emerald-600">{item.receivedQuantity || 0}</td>
                                        <td className="p-2 text-center">
                                            <input 
                                                type="number"
                                                min={0}
                                                max={maxAllowed}
                                                value={partialQtys[item.productId] ?? 0}
                                                onChange={e => setPartialQtys({ ...partialQtys, [item.productId]: Math.min(maxAllowed, Math.max(0, Number(e.target.value))) })}
                                                className="w-16 text-center font-bold font-mono border rounded p-1 bg-white dark:bg-zinc-800"
                                            />
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>

                    <div className="flex justify-end gap-2 pt-2 border-t dark:border-zinc-800">
                        <Button type="button" variant="secondary" onClick={() => setPartialModalOpen(false)}>Batal</Button>
                        <Button type="submit" className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold">Simpan Penerimaan Stok</Button>
                    </div>
                </form>
            </Modal>
        </div>
    );
};

// --- Page 2: Add Purchase Page (New complex component) ---
export const AddPurchasePage: React.FC = () => {
    const { state, dispatch } = useAppContext();
    const { vendors, products, taxRates, warehouses, accounts, paymentMethods } = state;
    const cashAccounts = useMemo(() => accounts.filter(a => a.isCashAccount || a.type === 'Asset'), [accounts]);
    
    const [vendorId, setVendorId] = useState('');
    const [destinationId, setDestinationId] = useState(warehouses[0]?.id || 'wh_c1');

    useEffect(() => {
        if (warehouses.length > 0 && !destinationId) {
            setDestinationId(warehouses[0].id);
        }
    }, [warehouses]);
    const [invoiceNumber, setInvoiceNumber] = useState('');
    const [vendorNoteNumber, setVendorNoteNumber] = useState('');
    const [billingType, setBillingType] = useState<'cash' | 'tempo'>('tempo');
    const [selectedAccountId, setSelectedAccountId] = useState(cashAccounts[0]?.id || '1010');
    const [selectedPaymentMethodId, setSelectedPaymentMethodId] = useState(paymentMethods[0]?.id || 'pm-1');
    const [orderDate, setOrderDate] = useState(new Date().toISOString().split('T')[0]);
    const [dueDate, setDueDate] = useState('');
    const [expectedDelivery, setExpectedDelivery] = useState('');
    const [items, setItems] = useState<Partial<PurchaseOrderItem>[]>([{ productId: '', quantity: 1, cost: 0 }]);
    const [taxType, setTaxType] = useState<'exclusive' | 'inclusive' | 'none'>('none');
    const [vendorSearch, setVendorSearch] = useState('');
    const [isVendorSuggestionOpen, setVendorSuggestionOpen] = useState(false);

    const vendorSuggestions = useMemo(() => {
        if (!vendorSearch) return vendors;
        const query = vendorSearch.toLowerCase();
        return vendors.filter(v => v.name.toLowerCase().includes(query) || v.phone?.includes(query));
    }, [vendorSearch, vendors]);

    const handleVendorSelect = (vendor: Vendor) => {
        setVendorId(vendor.id);
        setVendorSearch(vendor.name);
        setVendorSuggestionOpen(false);
    };

    const [productSearch, setProductSearch] = useState<string[]>(['']);
    const [activeSuggestionBox, setActiveSuggestionBox] = useState<number | null>(null);
    const [isProductModalOpen, setProductModalOpen] = useState(false);
    const [creatingProductForIndex, setCreatingProductForIndex] = useState<number | null>(null);

    const defaultTax = useMemo(() => taxRates.find(t => t.isDefault), [taxRates]);

    const handleAddItem = () => {
        setItems([...items, { productId: '', quantity: 1, cost: 0 }]);
        setProductSearch([...productSearch, '']);
    };
    
    const handleItemChange = (index: number, field: keyof PurchaseOrderItem, value: any) => {
        const newItems = [...items];
        (newItems[index] as any)[field] = value;
        setItems(newItems);
    };

    const handleProductSelect = (index: number, product: Product) => {
        const newItems = [...items];
        newItems[index] = {
            productId: product.id,
            productName: product.name,
            quantity: newItems[index].quantity || 1,
            cost: product.cost
        };
        setItems(newItems);
        
        const newSearch = [...productSearch];
        newSearch[index] = product.name;
        setProductSearch(newSearch);
        setActiveSuggestionBox(null);
    };

    const handleRemoveItem = (index: number) => {
        setItems(items.filter((_, i) => i !== index));
        setProductSearch(productSearch.filter((_, i) => i !== index));
    };

    const productSuggestions = useMemo(() => {
        if (activeSuggestionBox === null) return [];
        const query = productSearch[activeSuggestionBox]?.toLowerCase();
        if (!query) return [];
        return products.filter(p => p.name.toLowerCase().includes(query) || p.barcode?.includes(query));
    }, [activeSuggestionBox, productSearch, products]);

    const totals = useMemo(() => {
        const lineTotal = items.reduce((sum, item) => sum + (Number(item.cost) || 0) * (Number(item.quantity) || 0), 0);
        
        let subtotal = 0;
        let taxAmount = 0;
        const taxRate = taxType !== 'none' ? (defaultTax?.rate || 0) : 0;
        
        if (taxType === 'inclusive') {
            subtotal = lineTotal / (1 + taxRate);
            taxAmount = lineTotal - subtotal;
        } else { // 'exclusive' or 'none'
            subtotal = lineTotal;
            taxAmount = subtotal * taxRate;
        }

        const grandTotal = subtotal + taxAmount;

        return { subtotal, taxAmount, grandTotal };
    }, [items, taxType, defaultTax]);
    
    const resetForm = () => {
        setVendorId('');
        setDestinationId('');
        setInvoiceNumber('');
        setVendorNoteNumber('');
        setBillingType('tempo');
        setOrderDate(new Date().toISOString().split('T')[0]);
        setDueDate('');
        setExpectedDelivery('');
        setItems([{ productId: '', quantity: 1, cost: 0 }]);
        setProductSearch(['']);
        setTaxType('exclusive');
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const vendor = vendors.find(v => v.id === vendorId);
        const finalItems = items.filter(i => i.productId && i.quantity && i.quantity > 0 && i.cost !== undefined) as PurchaseOrderItem[];

        if (!vendor || finalItems.length === 0 || !destinationId) {
            alert("Harap pilih Vendor, Tujuan, dan pastikan semua item produk valid dari daftar.");
            return;
        }
        if (billingType === 'tempo' && !dueDate) {
            alert("Harap isi Tanggal Jatuh Tempo untuk transaksi Kredit / Tempo Vendor.");
            return;
        }
        
        const purchaseData: Omit<PurchaseOrder, 'id'> & { sourceAccountId?: string; paymentMethodId?: string; billingType?: string } = {
            destinationType: 'warehouse',
            destinationId,
            vendorId,
            vendorName: vendor.name,
            orderDate,
            expectedDelivery,
            dueDate: dueDate || orderDate,
            invoiceNumber,
            vendorNoteNumber,
            status: 'Pending',
            items: finalItems,
            taxType,
            taxRate: taxType !== 'none' ? (defaultTax?.rate || 0) : 0,
            subtotal: totals.subtotal,
            taxAmount: totals.taxAmount,
            grandTotal: totals.grandTotal,
            billingType,
        };
        
        dispatch({ type: 'purchases/add', payload: purchaseData as any });

        // Auto-create Vendor Bill if transaction is Tempo
        if (billingType === 'tempo') {
            dispatch({ type: 'billing/createVendorBillFromPo', payload: { purchaseOrderId: purchaseData as any } });
        }

        alert(`Purchase Order (${billingType === 'cash' ? 'Tunai Lunas' : 'Tagihan Tempo Vendor'}) berhasil dibuat!`);
        resetForm();
        dispatch({ type: 'ui/setPage', payload: Page.PurchaseList });
    };

    return (
        <div className="w-full h-full flex flex-col p-4 md:p-6 space-y-4 overflow-y-auto bg-slate-50 dark:bg-zinc-950">
            {/* Top Action Breadcrumb & Action Toolbar */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 shrink-0 bg-white dark:bg-zinc-900 p-4 rounded-xl border border-slate-200/80 dark:border-zinc-800 shadow-2xs">
                <div>
                    <nav className="flex items-center gap-1.5 text-xs text-slate-400 dark:text-zinc-400 mb-1">
                        <span onClick={() => dispatch({ type: 'ui/setPage', payload: Page.PurchaseList })} className="hover:underline cursor-pointer">Purchase Orders</span>
                        <span>/</span>
                        <span className="font-bold text-slate-700 dark:text-zinc-200">New Request for Quotation</span>
                    </nav>
                    <h1 className="text-xl font-black text-slate-900 dark:text-white leading-tight flex items-center gap-2">
                        Draft Purchase Order
                    </h1>
                </div>

                <div className="flex items-center gap-2">
                    <Button 
                        type="button"
                        variant="secondary"
                        onClick={() => dispatch({ type: 'ui/setPage', payload: Page.PurchaseList })}
                        className="text-xs py-1.5 px-3"
                    >
                        Batal
                    </Button>
                    <Button 
                        type="button"
                        onClick={handleSubmit} 
                        className="text-xs py-1.5 px-4 bg-purple-600 hover:bg-purple-700 text-white font-bold shadow-2xs"
                    >
                        Simpan Purchase Order
                    </Button>
                </div>
            </div>

            {/* Odoo Style Document Sheet Container */}
            <form onSubmit={handleSubmit} className="bg-white dark:bg-zinc-900 rounded-xl shadow-xs border border-slate-200 dark:border-zinc-800 p-5 md:p-6 space-y-4">
                
                {/* Header Information Grid (2 Side-by-Side Columns) */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-3 pb-4 border-b border-slate-100 dark:border-zinc-800 text-xs">
                    {/* Left Side */}
                    <div className="space-y-3">
                        <div className="grid grid-cols-12 items-center gap-2 relative">
                            <label className="col-span-4 font-bold text-slate-700 dark:text-zinc-300">
                                Vendor <span className="text-rose-500">*</span>
                            </label>
                            <div className="col-span-8 relative">
                                <input 
                                    type="text"
                                    value={vendorSearch} 
                                    onChange={e => {
                                        setVendorSearch(e.target.value);
                                        setVendorSuggestionOpen(true);
                                    }}
                                    onFocus={() => setVendorSuggestionOpen(true)}
                                    onBlur={() => setTimeout(() => setVendorSuggestionOpen(false), 200)}
                                    placeholder="Ketik nama / no. vendor..." 
                                    required 
                                    className="w-full rounded-lg border border-purple-200 dark:border-purple-900/60 bg-purple-50/30 dark:bg-purple-950/20 text-xs font-semibold p-2 text-slate-900 dark:text-white focus:ring-2 focus:ring-purple-500 outline-none"
                                />
                                {isVendorSuggestionOpen && vendorSuggestions.length > 0 && (
                                    <div className="absolute z-30 top-full left-0 right-0 mt-1 bg-white dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 rounded-xl shadow-2xl max-h-52 overflow-y-auto p-1">
                                        {vendorSuggestions.map(v => (
                                            <div 
                                                key={v.id} 
                                                onMouseDown={() => handleVendorSelect(v)} 
                                                className="p-2 hover:bg-purple-50 dark:hover:bg-zinc-700 rounded-lg cursor-pointer flex justify-between items-center text-xs transition-colors"
                                            >
                                                <span className="font-bold text-slate-900 dark:text-white">{v.name}</span>
                                                {v.phone && <span className="text-[10px] text-slate-400 font-mono">{v.phone}</span>}
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="grid grid-cols-12 items-center gap-2">
                            <label className="col-span-4 text-slate-600 dark:text-zinc-400 font-medium">
                                No. Faktur
                            </label>
                            <input 
                                type="text" 
                                value={invoiceNumber} 
                                onChange={e => setInvoiceNumber(e.target.value)} 
                                placeholder="Ref Faktur Pembelian"
                                className="col-span-8 rounded-lg border border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-xs p-2 text-slate-900 dark:text-white focus:ring-2 focus:ring-purple-500 outline-none"
                            />
                        </div>

                        <div className="grid grid-cols-12 items-center gap-2">
                            <label className="col-span-4 text-slate-600 dark:text-zinc-400 font-medium">
                                No. Nota Vendor
                            </label>
                            <input 
                                type="text" 
                                value={vendorNoteNumber} 
                                onChange={e => setVendorNoteNumber(e.target.value)} 
                                placeholder="Ref Surat Jalan / Nota"
                                className="col-span-8 rounded-lg border border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-xs p-2 text-slate-900 dark:text-white focus:ring-2 focus:ring-purple-500 outline-none"
                            />
                        </div>
                    </div>

                    {/* Right Side */}
                    <div className="space-y-3">
                        <div className="grid grid-cols-12 items-center gap-2">
                            <label className="col-span-4 font-bold text-slate-700 dark:text-zinc-300">
                                Tanggal Pesan <span className="text-rose-500">*</span>
                            </label>
                            <input 
                                type="date" 
                                value={orderDate} 
                                onChange={e => setOrderDate(e.target.value)} 
                                required 
                                className="col-span-8 rounded-lg border border-purple-200 dark:border-purple-900/60 bg-purple-50/30 dark:bg-purple-950/20 text-xs font-semibold p-2 text-slate-900 dark:text-white focus:ring-2 focus:ring-purple-500 outline-none"
                            />
                        </div>

                        <div className="grid grid-cols-12 items-center gap-2">
                            <label className="col-span-4 font-bold text-slate-700 dark:text-zinc-300">
                                Perkiraan Tiba <span className="text-rose-500">*</span>
                            </label>
                            <input 
                                type="date" 
                                value={expectedDelivery} 
                                onChange={e => setExpectedDelivery(e.target.value)} 
                                required 
                                className="col-span-8 rounded-lg border border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-xs p-2 text-slate-900 dark:text-white focus:ring-2 focus:ring-purple-500 outline-none"
                            />
                        </div>

                        <div className="grid grid-cols-12 items-center gap-2">
                            <label className="col-span-4 font-bold text-slate-700 dark:text-zinc-300">
                                Jenis Pembayaran <span className="text-rose-500">*</span>
                            </label>
                            <select 
                                value={billingType} 
                                onChange={e => setBillingType(e.target.value as any)} 
                                required 
                                className="col-span-8 rounded-lg border border-purple-200 dark:border-purple-900/60 bg-purple-50/30 dark:bg-purple-950/20 text-xs font-semibold p-2 text-slate-900 dark:text-white focus:ring-2 focus:ring-purple-500 outline-none"
                            >
                                <option value="cash">Tunai (Cash / Direct)</option>
                                <option value="tempo">Tagihan Tempo (Kredit / Hutang Vendor)</option>
                            </select>
                        </div>


                        <div className="grid grid-cols-12 items-center gap-2">
                            <label className="col-span-4 text-slate-600 dark:text-zinc-400 font-medium">
                                Jatuh Tempo {billingType === 'tempo' && <span className="text-rose-500">*</span>}
                            </label>
                            <input 
                                type="date" 
                                value={dueDate} 
                                onChange={e => setDueDate(e.target.value)} 
                                required={billingType === 'tempo'}
                                className="col-span-8 rounded-lg border border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-xs p-2 text-slate-900 dark:text-white focus:ring-2 focus:ring-purple-500 outline-none"
                            />
                        </div>
                    </div>
                </div>

                {/* Products Table */}
                <div className="space-y-2 pt-2">
                    <div className="flex items-center gap-6 border-b border-slate-200 dark:border-zinc-800">
                        <button type="button" className="pb-1 text-xs font-black text-purple-700 dark:text-purple-400 border-b-2 border-purple-600 uppercase tracking-wider">
                            Products
                        </button>
                    </div>

                    {/* Products Table */}
                    <div className="w-full">
                        <table className="w-full text-xs">
                            <thead>
                                <tr className="bg-slate-50 dark:bg-zinc-800/80 text-slate-600 dark:text-zinc-400 font-bold border-y border-slate-200 dark:border-zinc-700 uppercase text-[11px] tracking-wide">
                                    <th className="p-2.5 text-left w-5/12">Product</th>
                                    <th className="p-2.5 text-center w-2/12">Quantity</th>
                                    <th className="p-2.5 text-right w-2/12">Unit Price</th>
                                    <th className="p-2.5 text-right w-2/12">Subtotal</th>
                                    <th className="p-2.5 text-center w-1/12"></th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 dark:divide-zinc-800/60">
                                {items.map((item, index) => (
                                    <tr key={index} className="hover:bg-slate-50/50 dark:hover:bg-zinc-800/40">
                                        {/* Product Input with Autocomplete */}
                                        <td className="p-2 relative">
                                            <input
                                                type="text"
                                                value={productSearch[index]}
                                                onChange={e => { 
                                                    const newSearch = [...productSearch]; 
                                                    newSearch[index] = e.target.value; 
                                                    setProductSearch(newSearch); 
                                                    setActiveSuggestionBox(index); 
                                                }}
                                                onFocus={() => setActiveSuggestionBox(index)}
                                                onBlur={() => setTimeout(() => setActiveSuggestionBox(null), 200)}
                                                placeholder="[Code] Product Name..."
                                                className="w-full rounded-md border border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-xs px-2.5 py-1.5 font-medium focus:ring-1 focus:ring-purple-500 outline-none"
                                            />
                                            {activeSuggestionBox === index && (
                                                <div className="absolute z-30 top-full left-2 right-2 mt-1 bg-white dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 rounded-xl shadow-2xl max-h-60 overflow-y-auto p-1">
                                                    {productSuggestions.length > 0 ? productSuggestions.map(p => (
                                                        <div 
                                                            key={p.id} 
                                                            onMouseDown={() => handleProductSelect(index, p)} 
                                                            className="p-2.5 hover:bg-purple-50 dark:hover:bg-zinc-700 rounded-lg cursor-pointer flex justify-between items-center text-xs transition-colors"
                                                        >
                                                            <div>
                                                                <strong className="block text-slate-900 dark:text-white font-bold">{p.name}</strong>
                                                                <span className="text-[11px] font-mono text-slate-400">Kode: {p.barcode || p.id}</span>
                                                            </div>
                                                            <span className="font-mono text-purple-600 dark:text-purple-400 font-bold text-xs">
                                                                Rp{(p.cost || p.price)?.toLocaleString('id-ID')}
                                                            </span>
                                                        </div>
                                                    )) : (
                                                        <div className="p-3 text-center text-slate-400 text-xs flex justify-between items-center">
                                                            <span>Produk tidak ditemukan</span>
                                                            <button 
                                                                type="button"
                                                                onMouseDown={() => { setActiveSuggestionBox(null); setProductModalOpen(true); }}
                                                                className="text-purple-600 font-bold hover:underline"
                                                            >
                                                                + Buat Produk
                                                            </button>
                                                        </div>
                                                    )}
                                                </div>
                                            )}
                                        </td>

                                        {/* Qty Input */}
                                        <td className="p-2">
                                            <input 
                                                type="number" 
                                                placeholder="1" 
                                                value={item.quantity || ''} 
                                                onChange={e => handleItemChange(index, 'quantity', parseInt(e.target.value) || 0)} 
                                                required 
                                                min="1" 
                                                className="w-full rounded-md border border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-xs p-1.5 text-center font-mono font-bold focus:ring-1 focus:ring-purple-500 outline-none" 
                                            />
                                        </td>

                                        {/* Unit Price */}
                                        <td className="p-2">
                                            <input 
                                                type="number" 
                                                placeholder="0" 
                                                step="1" 
                                                value={item.cost ?? ''} 
                                                onChange={e => handleItemChange(index, 'cost', parseFloat(e.target.value) || 0)} 
                                                required 
                                                className="w-full rounded-md border border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-xs p-1.5 text-right font-mono font-bold focus:ring-1 focus:ring-purple-500 outline-none" 
                                            />
                                        </td>

                                        {/* Subtotal */}
                                        <td className="p-2 text-right font-mono font-bold text-slate-900 dark:text-white text-xs">
                                            Rp{((item.quantity || 0) * (item.cost || 0)).toLocaleString('id-ID')}
                                        </td>

                                        {/* Remove Action */}
                                        <td className="p-2 text-center">
                                            <button 
                                                type="button" 
                                                onClick={() => handleRemoveItem(index)} 
                                                className="text-slate-400 hover:text-rose-600 font-bold text-sm transition-colors"
                                                title="Remove line"
                                            >
                                                🗑️
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    <button 
                        type="button" 
                        onClick={handleAddItem} 
                        className="text-xs font-bold text-purple-700 dark:text-purple-400 hover:underline inline-flex items-center gap-1 py-1"
                    >
                        + Add a product
                    </button>
                </div>

                {/* Bottom Section (Terms & Conditions + Totals Summary) */}
                <div className="pt-4 border-t border-slate-100 dark:border-zinc-800 grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
                    {/* Left: Notes */}
                    <div className="space-y-3">
                        <div>
                            <textarea 
                                placeholder="Define your terms and conditions..."
                                rows={3}
                                className="w-full rounded-lg border border-slate-200 dark:border-zinc-700 bg-slate-50/50 dark:bg-zinc-800/40 p-2.5 text-xs text-slate-800 dark:text-zinc-200 outline-none focus:ring-1 focus:ring-purple-500"
                            />
                        </div>
                    </div>

                    {/* Right: Summary Totals */}
                    <div className="space-y-2 text-xs font-medium w-full max-w-xs ml-auto bg-slate-50/50 dark:bg-zinc-800/30 p-4 rounded-xl border border-slate-100 dark:border-zinc-800/80">
                        <div className="flex justify-between items-center text-slate-600 dark:text-zinc-400">
                            <span>Subtotal:</span>
                            <span className="font-mono font-bold text-slate-900 dark:text-white">Rp {totals.subtotal.toLocaleString('id-ID')}</span>
                        </div>
                        <div className="flex justify-between items-center text-sm font-black pt-2 border-t border-slate-200 dark:border-zinc-700 text-slate-900 dark:text-white">
                            <span>Total:</span>
                            <span className="font-mono text-purple-700 dark:text-purple-400 text-base">Rp {totals.subtotal.toLocaleString('id-ID')}</span>
                        </div>
                    </div>
                </div>
            </form>

            {creatingProductForIndex !== null && (
                <ProductModal
                    isOpen={isProductModalOpen}
                    onClose={() => setProductModalOpen(false)}
                    existingProduct={null}
                    onSaveSuccess={(newProduct) => {
                        if (creatingProductForIndex !== null) {
                            handleProductSelect(creatingProductForIndex, newProduct);
                        }
                    }}
                />
            )}
        </div>
    );
};


// --- Page 1: Purchase List Page ---
export const PurchaseListPage: React.FC = () => {
  const { state, dispatch } = useAppContext();
  const { purchases, vendorBills, lastGeneratedVendorBill } = state;
  const [isDetailsModalOpen, setDetailsModalOpen] = useState(false);
  const [isBillModalOpen, setBillModalOpen] = useState(false);
  const [selectedPO, setSelectedPO] = useState<PurchaseOrder | null>(null);

  useEffect(() => {
    if (lastGeneratedVendorBill) {
        setBillModalOpen(true);
    }
  }, [lastGeneratedVendorBill]);

  const handleCloseBillModal = () => {
    setBillModalOpen(false);
    dispatch({ type: 'billing/clearLastGeneratedBill' });
  };

  const getItemStatusChip = (status?: PurchaseItemStatus) => {
    switch(status || 'Draft') {
        case 'Draft': return 'bg-slate-100 text-slate-700 border border-slate-300';
        case 'Validasi': return 'bg-blue-100 text-blue-800 border border-blue-300';
        case 'Menunggu Kedatangan': return 'bg-amber-100 text-amber-800 border border-amber-300';
        case 'Barang Diterima': return 'bg-emerald-100 text-emerald-800 border border-emerald-300';
    }
  };

  const getPaymentStatusChip = (status?: PurchasePaymentStatus) => {
    switch(status || 'Belum Lunas') {
        case 'Belum Lunas': return 'bg-rose-100 text-rose-800 border border-rose-300';
        case 'Dicicil': return 'bg-purple-100 text-purple-800 border border-purple-300';
        case 'Lunas': return 'bg-emerald-100 text-emerald-800 border border-emerald-300';
    }
  };

  const handleUpdateItemStatus = (poId: string, itemStatus: PurchaseItemStatus) => {
    dispatch({ type: 'purchases/updateStatuses', payload: { poId, itemStatus } });
    if (itemStatus === 'Barang Diterima') {
        dispatch({ type: 'purchases/receive', payload: poId });
    }
  };

  const handleUpdatePaymentStatus = (poId: string, paymentStatus: PurchasePaymentStatus) => {
    dispatch({ type: 'purchases/updateStatuses', payload: { poId, paymentStatus } });
  };

  const handleDeletePO = (poId: string) => {
    if (window.confirm("Apakah Anda yakin ingin menghapus data pembelian ini?")) {
        dispatch({ type: 'purchases/delete', payload: poId });
    }
  };

  const handleViewDetails = (po: PurchaseOrder) => {
    dispatch({ type: 'purchases/setSelectedId', payload: po.id });
    dispatch({ type: 'ui/setPage', payload: Page.PurchaseDetailsPage });
  };

  return (
    <div className="p-3 md:p-5 h-full flex flex-col gap-3 overflow-hidden bg-slate-50 dark:bg-zinc-950">
      {/* Top Header Control Bar */}
      <div className="bg-white dark:bg-zinc-900 px-4 py-2.5 rounded-2xl border border-zinc-200/80 dark:border-zinc-800 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-3 shrink-0">
        {/* Title & Count */}
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400 flex items-center justify-center font-black text-sm shrink-0">
            🛍️
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base font-black text-slate-900 dark:text-white tracking-tight">Data Pembelian</h1>
              <span className="bg-slate-100 dark:bg-zinc-800 text-slate-600 dark:text-slate-400 text-[10px] font-bold px-2 py-0.5 rounded-full font-mono">{purchases.length}</span>
            </div>
            <p className="text-[10px] text-slate-400 dark:text-slate-500 font-medium">Faktur pesanan & penerimaan stok vendor</p>
          </div>
        </div>

        {/* Top Right Action Button */}
        <div className="flex items-center gap-2 justify-end">
          <Button 
            onClick={() => dispatch({ type: 'ui/setPage', payload: Page.AddPurchase })}
            className="text-xs h-8 px-3 font-bold bg-purple-700 hover:bg-purple-800 text-white rounded-xl shadow-xs shrink-0 flex items-center gap-1.5 whitespace-nowrap ml-auto"
          >
            <span>+ Buat Pembelian Baru</span>
          </Button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 min-h-0 overflow-y-auto">
        {/* 1. DESKTOP VIEW: Table Layout */}
        <div className="hidden md:block bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200/80 dark:border-zinc-800 shadow-xs overflow-hidden h-full">
          <table className="w-full text-xs text-left text-gray-500 dark:text-gray-400">
            <thead className="text-[11px] font-extrabold text-gray-700 uppercase bg-slate-50 dark:bg-zinc-800/60 dark:text-gray-400 sticky top-0 border-b border-zinc-200/80 dark:border-zinc-800">
              <tr>
                <th scope="col" className="px-4 py-3">ID Pesanan</th>
                <th scope="col" className="px-4 py-3">Vendor</th>
                <th scope="col" className="px-4 py-3">Tgl. Pesan</th>
                <th scope="col" className="px-4 py-3 text-center">Status Barang</th>
                <th scope="col" className="px-4 py-3 text-center">Status Pembayaran</th>
                <th scope="col" className="px-4 py-3 text-right">Total</th>
                <th scope="col" className="px-4 py-3 text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-zinc-800/60">
              {purchases.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-12 text-slate-400">
                    Tidak ada data pembelian yang tersedia.
                  </td>
                </tr>
              ) : (
                purchases.map((po) => {
                  const itemStatus: PurchaseItemStatus = po.itemStatus || (po.status === 'Received' ? 'Barang Diterima' : 'Draft');
                  const paymentStatus: PurchasePaymentStatus = po.paymentStatus || 'Belum Lunas';

                  return (
                    <tr 
                      key={po.id} 
                      onClick={() => handleViewDetails(po)}
                      className="hover:bg-purple-50/50 dark:hover:bg-zinc-800/60 cursor-pointer transition-colors"
                    >
                      <td className="px-4 py-3 font-bold font-mono text-purple-700 dark:text-purple-400">{po.id}</td>
                      <td className="px-4 py-3 font-semibold text-slate-800 dark:text-slate-200">{po.vendorName}</td>
                      <td className="px-4 py-3 text-slate-500 font-mono">{new Date(po.orderDate).toLocaleDateString('id-ID')}</td>
                      
                      {/* Status Barang Badge */}
                      <td className="px-4 py-3 text-center">
                        <span className={`text-[10px] font-extrabold px-2.5 py-1 rounded-full ${getItemStatusChip(itemStatus)}`}>
                          {itemStatus}
                        </span>
                      </td>

                      {/* Status Pembayaran Badge */}
                      <td className="px-4 py-3 text-center">
                        <span className={`text-[10px] font-extrabold px-2.5 py-1 rounded-full ${getPaymentStatusChip(paymentStatus)}`}>
                          {paymentStatus}
                        </span>
                      </td>

                      <td className="px-4 py-3 font-black text-right text-slate-900 dark:text-white font-mono">
                        Rp{po.grandTotal.toLocaleString('id-ID')}
                      </td>
                      <td className="px-4 py-3 text-center" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-center gap-1">
                          <button
                            type="button"
                            onClick={() => handleViewDetails(po)}
                            title="Lihat Detail Pesanan & Pembayaran"
                            className="p-1.5 rounded-lg text-purple-600 hover:bg-purple-50 dark:hover:bg-zinc-800 transition-colors"
                          >
                            👁️
                          </button>
                          {itemStatus === 'Draft' ? (
                            <button
                              type="button"
                              onClick={() => handleDeletePO(po.id)}
                              title="Hapus Pembelian (Hanya Draft)"
                              className="p-1.5 rounded-lg text-rose-600 hover:bg-rose-50 dark:hover:bg-zinc-800 transition-colors"
                            >
                              🗑️
                            </button>
                          ) : (
                            <button
                              type="button"
                              disabled
                              title="🔒 Hapus Terkunci (Sudah Diproses)"
                              className="p-1.5 rounded-lg text-slate-300 dark:text-zinc-700 cursor-not-allowed opacity-50"
                            >
                              🔒
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* 2. MOBILE VIEW: Compact Cards */}
        <div className="block md:hidden space-y-3">
          {purchases.length === 0 ? (
            <div className="bg-white dark:bg-zinc-900 rounded-2xl p-8 text-center border border-zinc-200 dark:border-zinc-800 text-slate-400 text-xs">
              Tidak ada data pembelian.
            </div>
          ) : (
            purchases.map((po) => {
              const itemStatus: PurchaseItemStatus = po.itemStatus || (po.status === 'Received' ? 'Barang Diterima' : 'Draft');
              const paymentStatus: PurchasePaymentStatus = po.paymentStatus || 'Belum Lunas';

              return (
                <div key={po.id} className="bg-white dark:bg-zinc-900 rounded-xl border border-slate-200/80 dark:border-zinc-800 p-3.5 shadow-2xs space-y-2.5">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h3 className="font-extrabold text-xs font-mono text-slate-900 dark:text-white">{po.id}</h3>
                      <p className="text-[10px] text-slate-400 font-medium">Vendor: {po.vendorName}</p>
                    </div>
                    <span className={`px-2 py-0.5 rounded-full text-[9px] font-extrabold ${getPaymentStatusChip(paymentStatus)}`}>
                      {paymentStatus}
                    </span>
                  </div>
                  <div className="space-y-1 text-xs text-slate-600 dark:text-zinc-300 border-y border-slate-100 dark:border-zinc-800 py-2 font-mono">
                    <div>Tgl: {new Date(po.orderDate).toLocaleDateString('id-ID')}</div>
                    <div>Status Barang: <span className="font-bold">{itemStatus}</span></div>
                    <div className="text-[11px] text-purple-700 dark:text-purple-400 font-black">Total: Rp{po.grandTotal.toLocaleString('id-ID')}</div>
                  </div>
                  <div className="flex justify-end items-center gap-2">
                    <Button onClick={() => handleViewDetails(po)} variant="secondary" className="text-[10px] py-1 px-2.5">
                      Detail
                    </Button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
      <VendorBillModal isOpen={isBillModalOpen} onClose={handleCloseBillModal} bill={lastGeneratedVendorBill} />
    </div>
  );
};

export const Purchases: React.FC = () => {
    const { state } = useAppContext();
    switch (state.currentPage) {
        case Page.AddPurchase:
            return <AddPurchasePage />;
        case Page.PurchaseDetailsPage:
            return <PurchaseOrderDetailsPage />;
        default:
            return <PurchaseListPage />;
    }
};
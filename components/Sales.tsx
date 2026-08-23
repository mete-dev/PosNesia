import React, { useState, useMemo, useRef } from 'react';
import { Sale, Product, Customer, PaymentMethod, PaymentTerm, SaleItem, Status, FulfillmentStatus, Vehicle, Page } from '../types';
import { useAppContext } from '../hooks/useAppContext';
import { Receipt } from './Receipt';
import { ActionsDropdown, DropdownItem, Modal, Button, Input, Select, Label, Badge } from './ui';

// --- Page 1: Sales List Page ---
export const SaleDetailsPage: React.FC<{ saleId?: string, onBack?: () => void }> = ({ saleId, onBack }) => {
    const { state, dispatch } = useAppContext();
    const { sales, paymentMethods, accounts, selectedSaleId } = state;

    const targetId = saleId || selectedSaleId;
    const sale = useMemo(() => sales.find(s => s.id === targetId), [sales, targetId]);

    const [activeTab, setActiveTab] = useState<'pesanan' | 'pembayaran'>('pesanan');
    const [isPayModalOpen, setPayModalOpen] = useState(false);
    const [isPartialModalOpen, setPartialModalOpen] = useState(false);

    // Form bayar
    const [payAmount, setPayAmount] = useState<number>(0);
    const [selectedPaymentMethodId, setSelectedPaymentMethodId] = useState('');
    const [selectedAccountId, setSelectedAccountId] = useState('');
    const [payNotes, setPayNotes] = useState('');

    // Partial delivery form
    const [partialQtys, setPartialQtys] = useState<Record<string, number>>({});

    React.useEffect(() => {
        if (sale) {
            const remaining = sale.grandTotal - (sale.amountPaid || 0);
            setPayAmount(Math.max(0, remaining));
            if (paymentMethods.length > 0) setSelectedPaymentMethodId(paymentMethods[0].id);
            if (accounts.length > 0) setSelectedAccountId(accounts.find(a => a.isCashAccount)?.id || accounts[0].id);

            const initialQtys: Record<string, number> = {};
            sale.items.forEach(i => {
                const unDel = i.quantity - (i.deliveredQuantity || 0);
                initialQtys[i.productId] = Math.max(0, unDel);
            });
            setPartialQtys(initialQtys);
        }
    }, [sale, paymentMethods, accounts]);

    const handleGoBack = () => {
        if (onBack) onBack();
        else dispatch({ type: 'ui/setPage', payload: Page.SalesList });
    };

    if (!sale) {
        return (
            <div className="p-6 text-center space-y-4">
                <p className="text-slate-400">Data penjualan tidak ditemukan.</p>
                <Button onClick={handleGoBack}>Kembali ke Daftar Penjualan</Button>
            </div>
        );
    }

    const isPosSale = sale.saleChannel === 'POS' || !!sale.posSessionId;
    const computedItemStatus: SaleItemStatus = sale.itemStatus || (isPosSale ? 'Barang Diterima' : (sale.fulfillmentStatus === 'Delivered' ? 'Barang Diterima' : 'Draft'));
    const computedPaymentStatus: SalePaymentStatus = sale.paymentStatus || (isPosSale || sale.status === 'Paid' ? 'Lunas' : 'Belum Lunas');
    const amountPaid = sale.amountPaid !== undefined && sale.amountPaid > 0 
        ? sale.amountPaid 
        : ((isPosSale || sale.status === 'Paid') ? sale.grandTotal : 0);
    const remainingBalance = Math.max(0, sale.grandTotal - amountPaid);
    
    // Virtual payment history for POS sales if legacy data was created without paymentHistory array
    const effectivePaymentHistory = (sale.paymentHistory && sale.paymentHistory.length > 0) 
        ? sale.paymentHistory 
        : (isPosSale || sale.status === 'Paid' ? [{
            id: `pay-${sale.id}`,
            date: sale.date,
            amount: sale.grandTotal,
            paymentMethodId: sale.payments?.[0]?.paymentMethodId || 'pm1',
            paymentMethodName: paymentMethods.find(m => m.id === sale.payments?.[0]?.paymentMethodId)?.name || 'Tunai - Kasir',
            notes: 'Pembayaran Kasir POS (Lunas Otomatis)'
        }] : []);

    const handleConfirmPayment = (e: React.FormEvent) => {
        e.preventDefault();
        if (payAmount <= 0) {
            alert('Nominal pembayaran harus lebih dari 0.');
            return;
        }
        dispatch({
            type: 'sales/addPayment',
            payload: {
                saleId: sale.id,
                amount: payAmount,
                paymentMethodId: selectedPaymentMethodId,
                sourceAccountId: selectedAccountId,
                notes: payNotes,
            }
        });
        setPayModalOpen(false);
        setPayNotes('');
    };

    const handleConfirmPartialDeliver = (e: React.FormEvent) => {
        e.preventDefault();
        const payloadItems = Object.entries(partialQtys).map(([productId, deliveredQty]) => ({ productId, deliveredQty: Number(deliveredQty) || 0 }));
        dispatch({
            type: 'sales/partialDeliver',
            payload: { saleId: sale.id, items: payloadItems }
        });
        setPartialModalOpen(false);
    };

    return (
        <div className="w-full h-full flex flex-col p-4 md:p-6 space-y-4 overflow-y-auto bg-slate-50 dark:bg-zinc-950">
            {/* Top Navigation Toolbar */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 shrink-0 bg-white dark:bg-zinc-900 p-4 rounded-xl border border-slate-200/80 dark:border-zinc-800 shadow-2xs">
                <div>
                    <nav className="flex items-center gap-1.5 text-xs text-slate-400 dark:text-zinc-400 mb-1">
                        <span onClick={handleGoBack} className="hover:underline cursor-pointer">Sales Orders</span>
                        <span>/</span>
                        <span className="font-bold text-slate-700 dark:text-zinc-200">Detail #{sale.id}</span>
                    </nav>
                    <h1 className="text-xl font-black text-slate-900 dark:text-white leading-tight flex items-center gap-2">
                        Penjualan #{sale.id}
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
                    <div><p className="text-[11px] text-slate-400 font-bold uppercase">Pelanggan</p><p className="font-extrabold text-sm text-slate-900 dark:text-white">{sale.customerName}</p></div>
                    <div><p className="text-[11px] text-slate-400 font-bold uppercase">Tgl. Transaksi</p><p className="font-bold font-mono text-sm">{new Date(sale.date).toLocaleDateString('id-ID')}</p></div>
                    <div><p className="text-[11px] text-slate-400 font-bold uppercase">Status Barang</p><p className="font-bold text-sm text-emerald-600 font-sans">{computedItemStatus}</p></div>
                    <div><p className="text-[11px] text-slate-400 font-bold uppercase">Status Bayar</p><p className={`font-bold text-sm ${computedPaymentStatus === 'Lunas' ? 'text-emerald-600' : 'text-rose-600'}`}>{computedPaymentStatus}</p></div>
                </div>

                {/* 2 Tabs Header */}
                <div className="flex border-b border-slate-200 dark:border-zinc-800">
                    <button
                        type="button"
                        onClick={() => setActiveTab('pesanan')}
                        className={`pb-3 px-5 font-bold text-xs border-b-2 transition-colors ${activeTab === 'pesanan' ? 'border-emerald-600 text-emerald-600 dark:text-emerald-400' : 'border-transparent text-slate-400 hover:text-slate-700'}`}
                    >
                        📦 Detail Pesanan & Pengiriman Barang
                    </button>
                    <button
                        type="button"
                        onClick={() => setActiveTab('pembayaran')}
                        className={`pb-3 px-5 font-bold text-xs border-b-2 transition-colors ${activeTab === 'pembayaran' ? 'border-emerald-600 text-emerald-600 dark:text-emerald-400' : 'border-transparent text-slate-400 hover:text-slate-700'}`}
                    >
                        💳 Detail & Riwayat Pembayaran
                    </button>
                </div>

                {/* TAB 1: Detail Pesanan */}
                {activeTab === 'pesanan' && (
                    <div className="space-y-4">
                        <div className="flex justify-between items-center">
                            <h3 className="font-bold text-sm text-slate-800 dark:text-zinc-200">Daftar Produk yang Dijual</h3>
                            {sale.itemStatus !== 'Barang Diterima' && (
                                <Button onClick={() => setPartialModalOpen(true)} size="sm" className="text-xs bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-1.5 px-3">
                                    🚚 Catat Pengiriman Barang (Sebagian / Full)
                                </Button>
                            )}
                        </div>

                        <table className="w-full text-xs text-left">
                            <thead className="bg-slate-100 dark:bg-zinc-800 uppercase font-bold text-slate-600 dark:text-zinc-400">
                                <tr>
                                    <th className="p-3">Produk</th>
                                    <th className="p-3 text-center">Dipesan</th>
                                    <th className="p-3 text-center">Terkirim</th>
                                    <th className="p-3 text-right">Harga Satuan</th>
                                    <th className="p-3 text-right">Subtotal</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 dark:divide-zinc-800">
                                {sale.items.map(item => (
                                    <tr key={item.productId}>
                                        <td className="p-3 font-medium text-slate-800 dark:text-zinc-200">{item.productName}</td>
                                        <td className="p-3 text-center font-mono font-bold">{item.quantity}</td>
                                        <td className="p-3 text-center font-mono font-bold text-emerald-600">{item.deliveredQuantity || 0}</td>
                                        <td className="p-3 text-right font-mono">Rp{item.price.toLocaleString('id-ID')}</td>
                                        <td className="p-3 text-right font-mono font-bold">Rp{(item.price * item.quantity).toLocaleString('id-ID')}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>

                        <div className="space-y-1 text-right font-medium mt-4 bg-slate-50 dark:bg-zinc-800/40 p-4 rounded-xl border border-slate-200 dark:border-zinc-800">
                            <p className="text-slate-600 dark:text-zinc-400">Subtotal: <span className="font-mono font-bold text-slate-900 dark:text-white">Rp{sale.subtotal.toLocaleString('id-ID')}</span></p>
                            <p className="text-lg font-black text-emerald-700 dark:text-emerald-400 pt-1 border-t border-slate-200 dark:border-zinc-700">Grand Total: Rp{sale.grandTotal.toLocaleString('id-ID')}</p>
                        </div>
                    </div>
                )}

                {/* TAB 2: Detail Pembayaran */}
                {activeTab === 'pembayaran' && (
                    <div className="space-y-4">
                        <div className="flex justify-between items-center bg-emerald-50 dark:bg-emerald-950/20 p-4 rounded-xl border border-emerald-200 dark:border-emerald-900/60">
                            <div>
                                <p className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold uppercase">Sisa Tagihan Penjualan</p>
                                <p className="text-xl font-black text-emerald-900 dark:text-emerald-200 font-mono">Rp{remainingBalance.toLocaleString('id-ID')}</p>
                                <p className="text-xs text-slate-500">Sudah Dibayar: <span className="font-bold text-emerald-600">Rp{amountPaid.toLocaleString('id-ID')}</span> dari Total Rp{sale.grandTotal.toLocaleString('id-ID')}</p>
                            </div>
                            {remainingBalance > 0 && (
                                <Button onClick={() => setPayModalOpen(true)} className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-4 py-2.5 text-xs rounded-xl shadow-xs">
                                    💳 Bayar / Catat Pelunasan
                                </Button>
                            )}
                        </div>

                        <h4 className="font-bold text-slate-800 dark:text-zinc-200 border-b pb-2 text-sm">Riwayat Pembayaran</h4>
                        {(!effectivePaymentHistory || effectivePaymentHistory.length === 0) ? (
                            <p className="text-slate-400 italic text-center py-6">Belum ada riwayat pembayaran yang dicatat.</p>
                        ) : (
                            <table className="w-full text-xs text-left">
                                <thead className="bg-slate-100 dark:bg-zinc-800 uppercase font-bold text-slate-600 dark:text-zinc-400">
                                    <tr>
                                        <th className="p-3">Tgl. Bayar</th>
                                        <th className="p-3">Metode Pembayaran</th>
                                        <th className="p-3">Akun Penerima</th>
                                        <th className="p-3 text-right">Nominal</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100 dark:divide-zinc-800">
                                    {effectivePaymentHistory.map(pay => (
                                        <tr key={pay.id}>
                                            <td className="p-3 font-mono">{new Date(pay.date).toLocaleString('id-ID')}</td>
                                            <td className="p-3 font-semibold">{pay.paymentMethodName}</td>
                                            <td className="p-3 text-slate-500">{pay.sourceAccountName || '-'}</td>
                                            <td className="p-3 text-right font-mono font-bold text-emerald-600">Rp{pay.amount.toLocaleString('id-ID')}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        )}
                    </div>
                )}
            </div>

            {/* Modal Pop-up Bayar / Pelunasan */}
            <Modal isOpen={isPayModalOpen} onClose={() => setPayModalOpen(false)} title="Catat Pembayaran Penjualan" maxWidth="max-w-md">
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
                        <label className="block font-bold text-slate-700 dark:text-zinc-300 mb-1">Metode Pembayaran</label>
                        <select 
                            value={selectedPaymentMethodId} 
                            onChange={e => setSelectedPaymentMethodId(e.target.value)}
                            required
                            className="w-full rounded-lg border border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-xs p-2 font-semibold outline-none"
                        >
                            {paymentMethods.map(pm => <option key={pm.id} value={pm.id}>{pm.name}</option>)}
                        </select>
                    </div>

                    <div>
                        <label className="block font-bold text-slate-700 dark:text-zinc-300 mb-1">Akun Masuk Kas / Bank</label>
                        <select 
                            value={selectedAccountId} 
                            onChange={e => setSelectedAccountId(e.target.value)}
                            required
                            className="w-full rounded-lg border border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-xs p-2 font-semibold outline-none"
                        >
                            {accounts.filter(a => a.isCashAccount || a.type === 'Asset').map(a => (
                                <option key={a.id} value={a.id}>{a.name} (Saldo: Rp{a.balance.toLocaleString('id-ID')})</option>
                            ))}
                        </select>
                    </div>

                    <div>
                        <label className="block font-bold text-slate-700 dark:text-zinc-300 mb-1">Catatan / Keterangan (Opsional)</label>
                        <Input value={payNotes} onChange={e => setPayNotes(e.target.value)} placeholder="Contoh: Pelunasan sisa nota" className="text-xs" />
                    </div>

                    <div className="flex justify-end gap-2 pt-2 border-t dark:border-zinc-800">
                        <Button type="button" variant="secondary" onClick={() => setPayModalOpen(false)}>Batal</Button>
                        <Button type="submit" className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold">Proses Pembayaran</Button>
                    </div>
                </form>
            </Modal>

            {/* Modal Pop-up Kirim Barang Sebagian */}
            <Modal isOpen={isPartialModalOpen} onClose={() => setPartialModalOpen(false)} title="Catat Pengiriman Barang (Sebagian / Full)" maxWidth="max-w-lg">
                <form onSubmit={handleConfirmPartialDeliver} className="space-y-4 text-xs">
                    <p className="text-slate-500">Masukkan jumlah unit barang yang baru saja dikirim ke pelanggan:</p>
                    <table className="w-full text-xs text-left">
                        <thead className="bg-slate-100 dark:bg-zinc-800 font-bold">
                            <tr>
                                <th className="p-2">Produk</th>
                                <th className="p-2 text-center">Dipesan</th>
                                <th className="p-2 text-center">Sudah Terkirim</th>
                                <th className="p-2 text-center">Kirim Sekarang</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-zinc-800">
                            {sale.items.map(item => {
                                const maxAllowed = item.quantity - (item.deliveredQuantity || 0);
                                return (
                                    <tr key={item.productId}>
                                        <td className="p-2 font-semibold">{item.productName}</td>
                                        <td className="p-2 text-center font-mono">{item.quantity}</td>
                                        <td className="p-2 text-center font-mono text-emerald-600">{item.deliveredQuantity || 0}</td>
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
                        <Button type="submit" className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold">Simpan Pengiriman</Button>
                    </div>
                </form>
            </Modal>
        </div>
    );
};


const ReceiptModal: React.FC<{
    isOpen: boolean;
    onClose: () => void;
    sale: Sale | null;
}> = ({ isOpen, onClose, sale }) => {
    const { state } = useAppContext();
    const { companyInfo, reportLayoutSettings } = state;
    const receiptRef = useRef<HTMLDivElement>(null);

    const handlePrint = () => {
        const printContents = receiptRef.current?.innerHTML;
        if (!printContents) return;

        const iframe = document.createElement('iframe');
        iframe.style.display = 'none';
        document.body.appendChild(iframe);

        const doc = iframe.contentWindow?.document;
        if (!doc) return;

        doc.open();
        doc.write(`
            <!DOCTYPE html>
            <html class="dark">
                <head>
                    <title>Print Receipt</title>
                    <script src="https://cdn.tailwindcss.com"></script>
                    <style>
                        @page { size: auto; margin: 0mm; }
                        body { margin: 0; -webkit-print-color-adjust: exact; }
                    </style>
                </head>
                <body>
                    <div class="bg-gray-300 dark:bg-gray-900 p-6">
                        ${printContents}
                    </div>
                </body>
            </html>
        `);
        doc.close();

        iframe.onload = function() {
            iframe.contentWindow?.focus();
            iframe.contentWindow?.print();
            document.body.removeChild(iframe);
        };
    };
    
    if (!isOpen || !sale) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] flex flex-col">
                <div className="p-4 border-b dark:border-gray-700 flex justify-between items-center">
                    <h2 className="text-xl font-bold">Cetak Nota</h2>
                    <div>
                        <Button onClick={handlePrint} className="mr-2">Cetak</Button>
                        <Button onClick={onClose} variant="secondary">Tutup</Button>
                    </div>
                </div>
                <div className="p-6 bg-gray-300 dark:bg-gray-900 flex-grow overflow-y-auto">
                    <div ref={receiptRef}>
                        <Receipt sale={sale} companyInfo={companyInfo} settings={reportLayoutSettings}/>
                    </div>
                </div>
            </div>
        </div>
    );
};

const CreateManualSaleModal: React.FC<{ isOpen: boolean; onClose: () => void }> = ({ isOpen, onClose }) => {
    const { state, dispatch } = useAppContext();
    const { customers, products, paymentTerms, currentBranchId, taxRates, isTaxEnabled } = state;

    const [customerId, setCustomerId] = useState('');
    const [saleDate, setSaleDate] = useState(new Date().toISOString().split('T')[0]);
    const [paymentTermId, setPaymentTermId] = useState('');
    const [items, setItems] = useState<Partial<SaleItem>[]>([{ productId: '', quantity: 1, price: 0 }]);
    const [productSearch, setProductSearch] = useState<string[]>(['']);
    const [activeSuggestionBox, setActiveSuggestionBox] = useState<number | null>(null);

    const defaultTax = useMemo(() => taxRates.find(t => t.isDefault), [taxRates]);

    const handleAddItem = () => {
        setItems(prev => [...prev, { productId: '', quantity: 1, price: 0 }]);
        setProductSearch(prev => [...prev, '']);
    };

    const handleItemChange = (index: number, field: keyof SaleItem, value: any) => {
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
            price: product.price,
            cost: product.cost,
            discount: 0
        };
        setItems(newItems);
        const newSearch = [...productSearch];
        newSearch[index] = product.name;
        setProductSearch(newSearch);
        setActiveSuggestionBox(null);
    };

    const productSuggestions = useMemo(() => {
        if (activeSuggestionBox === null) return [];
        const query = productSearch[activeSuggestionBox]?.toLowerCase();
        if (!query) return [];
        return products.filter(p => p.name.toLowerCase().includes(query) || p.barcode?.includes(query));
    }, [activeSuggestionBox, productSearch, products]);

    const totals = useMemo(() => {
        const subtotal = items.reduce((sum, item) => sum + (item.price || 0) * (item.quantity || 0), 0);
        const discount = items.reduce((sum, item) => sum + (item.discount || 0), 0);
        const totalAfterDiscount = subtotal - discount;
        const taxAmount = isTaxEnabled ? totalAfterDiscount * (defaultTax?.rate || 0) : 0;
        const grandTotal = totalAfterDiscount + taxAmount;
        return { subtotal, discount, taxAmount, grandTotal };
    }, [items, isTaxEnabled, defaultTax]);

    if (!isOpen) return null;

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const customer = customers.find(c => c.id === customerId);
        if (!customer || !currentBranchId || !paymentTermId) {
            alert("Harap lengkapi Pelanggan, Cabang, dan Tempo Pembayaran.");
            return;
        }

        const saleData: Omit<Sale, 'id'> = {
            branchId: currentBranchId,
            sourceLocationId: currentBranchId,
            date: new Date(saleDate).toISOString(),
            items: items.filter(i => i.productId) as SaleItem[],
            subtotal: totals.subtotal,
            discount: totals.discount,
            taxAmount: totals.taxAmount,
            grandTotal: totals.grandTotal,
            customerId,
            customerName: customer.name,
            payments: [],
            paymentTermId,
            dueDate: new Date(new Date(saleDate).getTime() + (paymentTerms.find(pt => pt.id === paymentTermId)?.days || 0) * 24 * 60 * 60 * 1000).toISOString(),
            status: 'Unpaid',
            saleChannel: 'Manual',
            fulfillmentStatus: 'N/A'
        };
        
        dispatch({ type: 'sales/add', payload: saleData });
        alert('Penjualan manual berhasil dibuat.');
        onClose();
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Buat Penjualan Manual">
            <form onSubmit={handleSubmit} className="space-y-4 max-h-[80vh] overflow-y-auto p-1">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                        <label className="block text-sm font-medium mb-1">Pelanggan</label>
                        <Select value={customerId} onChange={e => setCustomerId(e.target.value)} required>
                            <option value="">Pilih Pelanggan</option>
                            {customers.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                        </Select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium mb-1">Tanggal</label>
                        <Input type="date" value={saleDate} onChange={e => setSaleDate(e.target.value)} required />
                    </div>
                    <div>
                        <label className="block text-sm font-medium mb-1">Tempo Pembayaran</label>
                        <Select value={paymentTermId} onChange={e => setPaymentTermId(e.target.value)} required>
                            <option value="">Pilih Tempo Bayar</option>
                            {paymentTerms.map(pt => <option key={pt.id} value={pt.id}>{pt.name}</option>)}
                        </Select>
                    </div>
                </div>

                <div className="border-t border-b dark:border-gray-700 py-3">
                    <h3 className="text-md font-semibold mb-2">Item Penjualan</h3>
                    {items.map((item, index) => (
                        <div key={index} className="grid grid-cols-12 gap-2 items-center mb-2 relative">
                            <div className="col-span-5 relative">
                                <Input
                                    type="text"
                                    value={productSearch[index]}
                                    onChange={e => {
                                        const newSearch = [...productSearch];
                                        newSearch[index] = e.target.value;
                                        setProductSearch(newSearch);
                                        setActiveSuggestionBox(index);
                                    }}
                                    onFocus={() => setActiveSuggestionBox(index)}
                                    placeholder="Cari produk..."
                                />
                                {activeSuggestionBox === index && productSuggestions.length > 0 && (
                                    <div className="absolute z-20 top-full left-0 w-full bg-white dark:bg-gray-700 border dark:border-gray-600 rounded-md shadow-lg max-h-40 overflow-y-auto">
                                        {productSuggestions.map(p => (
                                            <div key={p.id} onClick={() => handleProductSelect(index, p)} className="p-2 hover:bg-primary-100 dark:hover:bg-gray-600 cursor-pointer">{p.name}</div>
                                        ))}
                                    </div>
                                )}
                            </div>
                            <Input type="number" value={item.quantity || ''} onChange={e => handleItemChange(index, 'quantity', parseInt(e.target.value))} className="col-span-2 text-center" placeholder="Qty" />
                            <Input type="number" value={item.price || ''} onChange={e => handleItemChange(index, 'price', parseFloat(e.target.value))} className="col-span-2" placeholder="Harga" />
                            <Input readOnly value={((item.price || 0) * (item.quantity || 0)).toLocaleString('id-ID')} className="col-span-3 text-right bg-gray-100 dark:bg-gray-700/50" />
                        </div>
                    ))}
                    <Button type="button" onClick={handleAddItem} variant="secondary" size="sm">+ Tambah Item</Button>
                </div>

                <div className="flex justify-end">
                    <div className="w-full max-w-sm space-y-1 text-sm">
                        <div className="flex justify-between"><span>Subtotal</span><span>Rp{totals.subtotal.toLocaleString('id-ID')}</span></div>
                        <div className="flex justify-between"><span>Pajak</span><span>Rp{totals.taxAmount.toLocaleString('id-ID')}</span></div>
                        <div className="flex justify-between font-bold text-lg border-t pt-2"><span>Total</span><span>Rp{totals.grandTotal.toLocaleString('id-ID')}</span></div>
                    </div>
                </div>

                <div className="flex justify-end space-x-3 pt-4 border-t dark:border-gray-700">
                    <Button type="button" variant="secondary" onClick={onClose}>Batal</Button>
                    <Button type="submit">Simpan Penjualan</Button>
                </div>
            </form>
        </Modal>
    );
};

export const CreateManualSalePage: React.FC = () => {
    const { state, dispatch } = useAppContext();
    const { customers, products, paymentTerms, currentBranchId, taxRates, isTaxEnabled } = state;

    const [customerId, setCustomerId] = useState('');
    const [saleDate, setSaleDate] = useState(new Date().toISOString().split('T')[0]);
    const [billingType, setBillingType] = useState<'cash' | 'tempo'>('tempo');
    const [paymentTermId, setPaymentTermId] = useState('');
    const [items, setItems] = useState<Partial<SaleItem>[]>([{ productId: '', quantity: 1, price: 0 }]);
    const [productSearch, setProductSearch] = useState<string[]>(['']);
    const [activeSuggestionBox, setActiveSuggestionBox] = useState<number | null>(null);

    const [customerSearch, setCustomerSearch] = useState('');
    const [isCustomerSuggestionOpen, setCustomerSuggestionOpen] = useState(false);

    const customerSuggestions = useMemo(() => {
        if (!customerSearch) return customers;
        const query = customerSearch.toLowerCase();
        return customers.filter(c => c.name.toLowerCase().includes(query) || c.phone?.includes(query));
    }, [customerSearch, customers]);

    const handleCustomerSelect = (customer: Customer) => {
        setCustomerId(customer.id);
        setCustomerSearch(customer.name);
        setCustomerSuggestionOpen(false);
    };

    const selectedCustomerAddress = useMemo(() => {
        if (!customerId) return '';
        const c = customers.find(cust => cust.id === customerId);
        if (!c) return '';
        return c.address || c.companyDetails?.address || (c.addresses && c.addresses.length > 0 ? c.addresses[0].detail : '');
    }, [customerId, customers]);

    const defaultTax = useMemo(() => taxRates.find(t => t.isDefault), [taxRates]);

    const handleAddItem = () => {
        setItems(prev => [...prev, { productId: '', quantity: 1, price: 0 }]);
        setProductSearch(prev => [...prev, '']);
    };

    const handleRemoveItem = (index: number) => {
        setItems(prev => prev.filter((_, i) => i !== index));
        setProductSearch(prev => prev.filter((_, i) => i !== index));
    };

    const handleItemChange = (index: number, field: keyof SaleItem, value: any) => {
        const newItems = [...items];
        (newItems[index] as any)[field] = value;
        setItems(newItems);
    };

    const handleProductSelect = (index: number, product: Product) => {
        const newItems = [...items];
        newItems[index] = {
            productId: product.id,
            productName: product.name,
            quantity: newItems[index]?.quantity || 1,
            price: product.price ?? 0,
            cost: product.cost ?? 0,
            discount: 0
        };
        setItems(newItems);
        const newSearch = [...productSearch];
        newSearch[index] = product.name;
        setProductSearch(newSearch);
        setActiveSuggestionBox(null);
    };

    const productSuggestions = useMemo(() => {
        if (activeSuggestionBox === null) return [];
        const query = productSearch[activeSuggestionBox]?.toLowerCase();
        if (!query) return [];
        return products.filter(p => p.name.toLowerCase().includes(query) || p.barcode?.includes(query));
    }, [activeSuggestionBox, productSearch, products]);

    const totals = useMemo(() => {
        const subtotal = items.reduce((sum, item) => sum + (item.price || 0) * (item.quantity || 0), 0);
        const discount = items.reduce((sum, item) => sum + (item.discount || 0), 0);
        const totalAfterDiscount = subtotal - discount;
        const taxAmount = isTaxEnabled ? totalAfterDiscount * (defaultTax?.rate || 0) : 0;
        const grandTotal = totalAfterDiscount + taxAmount;
        return { subtotal, discount, taxAmount, grandTotal };
    }, [items, isTaxEnabled, defaultTax]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const customer = customers.find(c => c.id === customerId);
        if (!customer) {
            alert("Harap pilih Pelanggan.");
            return;
        }
        if (billingType === 'tempo' && !paymentTermId) {
            alert("Harap pilih Tempo Pembayaran untuk transaksi kredit/tempo.");
            return;
        }

        const validBranchId = currentBranchId || 'CAB-JPSTNH01';
        const saleData: Omit<Sale, 'id'> = {
            branchId: validBranchId,
            sourceLocationId: validBranchId,
            date: new Date(saleDate).toISOString(),
            items: items.filter(i => i.productId) as SaleItem[],
            subtotal: totals.subtotal,
            discount: totals.discount,
            taxAmount: totals.taxAmount,
            grandTotal: totals.grandTotal,
            customerId,
            customerName: customer.name,
            payments: billingType === 'cash' ? [{ paymentMethodId: 'pm1', amount: totals.grandTotal }] : [],
            paymentTermId: paymentTermId || 'pt1',
            dueDate: new Date(new Date(saleDate).getTime() + (paymentTerms.find(pt => pt.id === paymentTermId)?.days || 0) * 24 * 60 * 60 * 1000).toISOString(),
            status: billingType === 'cash' ? 'Paid' : 'Unpaid',
            saleChannel: 'Manual',
            fulfillmentStatus: 'N/A'
        };
        
        dispatch({ type: 'sales/add', payload: saleData });
        
        // Auto-create Customer Bill if transaction is Tempo
        if (billingType === 'tempo') {
            dispatch({ type: 'billing/createCustomerBillFromSale', payload: { saleId: saleData as any } });
        }

        alert(`Penjualan manual (${billingType === 'cash' ? 'Tunai Lunas' : 'Tagihan Tempo'}) berhasil disimpan!`);
        dispatch({ type: 'ui/setPage', payload: Page.SalesList });
    };

    return (
        <div className="w-full h-full flex flex-col p-4 md:p-6 space-y-4 overflow-y-auto bg-slate-50 dark:bg-zinc-950">
            {/* Top Navigation & Action Toolbar */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 shrink-0 bg-white dark:bg-zinc-900 p-4 rounded-xl border border-slate-200/80 dark:border-zinc-800 shadow-2xs">
                <div>
                    <nav className="flex items-center gap-1.5 text-xs text-slate-400 dark:text-zinc-400 mb-1">
                        <span onClick={() => dispatch({ type: 'ui/setPage', payload: Page.SalesList })} className="hover:underline cursor-pointer">Sales Orders</span>
                        <span>/</span>
                        <span className="font-bold text-slate-700 dark:text-zinc-200">Buat Penjualan Manual</span>
                    </nav>
                    <h1 className="text-xl font-black text-slate-900 dark:text-white leading-tight">
                        Draft Sales Order
                    </h1>
                </div>

                <div className="flex items-center gap-2">
                    <Button 
                        type="button"
                        variant="secondary"
                        onClick={() => dispatch({ type: 'ui/setPage', payload: Page.SalesList })}
                        className="text-xs py-1.5 px-3"
                    >
                        Batal
                    </Button>
                    <Button 
                        type="button"
                        onClick={handleSubmit} 
                        className="text-xs py-1.5 px-4 bg-emerald-600 hover:bg-emerald-700 text-white font-bold shadow-2xs"
                    >
                        Simpan Penjualan
                    </Button>
                </div>
            </div>

            {/* Odoo Style Sales Document Sheet Container */}
            <form onSubmit={handleSubmit} className="bg-white dark:bg-zinc-900 rounded-xl shadow-xs border border-slate-200 dark:border-zinc-800 p-6 md:p-8 space-y-6">
                
                {/* Header Information Grid (2 Side-by-Side Columns) */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-4 pb-6 border-b border-slate-100 dark:border-zinc-800 text-xs">
                    {/* Left Side */}
                    <div className="space-y-3">
                        <div className="grid grid-cols-12 items-center gap-2 relative">
                            <label className="col-span-4 font-bold text-slate-700 dark:text-zinc-300">
                                Pelanggan <span className="text-rose-500">*</span>
                            </label>
                            <div className="col-span-8 relative">
                                <input 
                                    type="text"
                                    value={customerSearch} 
                                    onChange={e => {
                                        setCustomerSearch(e.target.value);
                                        setCustomerSuggestionOpen(true);
                                    }}
                                    onFocus={() => setCustomerSuggestionOpen(true)}
                                    onBlur={() => setTimeout(() => setCustomerSuggestionOpen(false), 200)}
                                    placeholder="Ketik nama / no. telp pelanggan..." 
                                    required 
                                    className="w-full rounded-lg border border-emerald-200 dark:border-emerald-900/60 bg-emerald-50/30 dark:bg-emerald-950/20 text-xs font-semibold p-2 text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500 outline-none"
                                />
                                {isCustomerSuggestionOpen && customerSuggestions.length > 0 && (
                                    <div className="absolute z-30 top-full left-0 right-0 mt-1 bg-white dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 rounded-xl shadow-2xl max-h-52 overflow-y-auto p-1">
                                        {customerSuggestions.map(c => (
                                            <div 
                                                key={c.id} 
                                                onMouseDown={() => handleCustomerSelect(c)} 
                                                className="p-2 hover:bg-emerald-50 dark:hover:bg-zinc-700 rounded-lg cursor-pointer flex justify-between items-center text-xs transition-colors"
                                            >
                                                <span className="font-bold text-slate-900 dark:text-white">{c.name}</span>
                                                {c.phone && <span className="text-[10px] text-slate-400 font-mono">{c.phone}</span>}
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="grid grid-cols-12 items-start gap-2">
                            <label className="col-span-4 font-medium text-slate-600 dark:text-zinc-400 pt-1.5">
                                Alamat Pelanggan
                            </label>
                            <textarea 
                                readOnly 
                                value={selectedCustomerAddress} 
                                rows={2} 
                                placeholder="Alamat otomatis dari database pelanggan..." 
                                className="col-span-8 rounded-lg border border-slate-200 dark:border-zinc-700 bg-slate-50 dark:bg-zinc-800/80 text-xs p-2 text-slate-700 dark:text-zinc-300 font-medium outline-none resize-none cursor-not-allowed"
                            />
                        </div>
                    </div>

                    {/* Right Side */}
                    <div className="space-y-3">
                        <div className="grid grid-cols-12 items-center gap-2">
                            <label className="col-span-4 font-bold text-slate-700 dark:text-zinc-300">
                                Tanggal <span className="text-rose-500">*</span>
                            </label>
                            <input 
                                type="date" 
                                value={saleDate} 
                                onChange={e => setSaleDate(e.target.value)} 
                                required 
                                className="col-span-8 rounded-lg border border-emerald-200 dark:border-emerald-900/60 bg-emerald-50/30 dark:bg-emerald-950/20 text-xs font-semibold p-2 text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500 outline-none"
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
                                className="col-span-8 rounded-lg border border-emerald-200 dark:border-emerald-900/60 bg-emerald-50/30 dark:bg-emerald-950/20 text-xs font-semibold p-2 text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500 outline-none"
                            >
                                <option value="cash">Tunai (Cash / Direct)</option>
                                <option value="tempo">Tagihan Tempo (Kredit / Piutang)</option>
                            </select>
                        </div>

                        <div className="grid grid-cols-12 items-center gap-2">
                            <label className="col-span-4 font-bold text-slate-700 dark:text-zinc-300">
                                Tempo Pembayaran {billingType === 'tempo' && <span className="text-rose-500">*</span>}
                            </label>
                            <select 
                                value={paymentTermId} 
                                onChange={e => setPaymentTermId(e.target.value)} 
                                required={billingType === 'tempo'}
                                className="col-span-8 rounded-lg border border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-xs font-semibold p-2 text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500 outline-none"
                            >
                                <option value="">Pilih Tempo Bayar...</option>
                                {paymentTerms.map(pt => <option key={pt.id} value={pt.id}>{pt.name}</option>)}
                            </select>
                        </div>
                    </div>
                </div>

                {/* Tabbed / Products Table Header */}
                <div className="space-y-3">
                    <div className="flex items-center gap-6 border-b border-slate-200 dark:border-zinc-800">
                        <button type="button" className="pb-2 text-xs font-black text-emerald-700 dark:text-emerald-400 border-b-2 border-emerald-600 uppercase tracking-wider">
                            Order Lines (Products)
                        </button>
                    </div>

                    {/* Products Table */}
                    <div className="w-full">
                        <table className="w-full text-xs">
                            <thead>
                                <tr className="bg-slate-50 dark:bg-zinc-800/80 text-slate-600 dark:text-zinc-400 font-bold border-y border-slate-200 dark:border-zinc-700 uppercase text-[11px] tracking-wide">
                                    <th className="p-2.5 text-left w-5/12">Product</th>
                                    <th className="p-2.5 text-center w-2/12">Quantity</th>
                                    <th className="p-2.5 text-right w-2/12">Unit Price (Rp)</th>
                                    <th className="p-2.5 text-right w-2/12">Subtotal (Rp)</th>
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
                                                placeholder="[Kode] Nama Produk / Barcode..."
                                                className="w-full rounded-md border border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-xs px-2.5 py-1.5 font-medium focus:ring-1 focus:ring-emerald-500 outline-none"
                                            />
                                            {activeSuggestionBox === index && productSuggestions.length > 0 && (
                                                <div className="absolute z-30 top-full left-2 right-2 mt-1 bg-white dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 rounded-xl shadow-2xl max-h-60 overflow-y-auto p-1">
                                                    {productSuggestions.map(p => (
                                                        <div 
                                                            key={p.id} 
                                                            onMouseDown={() => handleProductSelect(index, p)} 
                                                            className="p-2.5 hover:bg-emerald-50 dark:hover:bg-zinc-700 rounded-lg cursor-pointer flex justify-between items-center text-xs transition-colors"
                                                        >
                                                            <div>
                                                                <strong className="block text-slate-900 dark:text-white font-bold">{p.name}</strong>
                                                                <span className="text-[11px] font-mono text-slate-400">Kode: {p.barcode || p.id}</span>
                                                            </div>
                                                            <span className="font-mono text-emerald-600 dark:text-emerald-400 font-bold text-xs">
                                                                Rp{p.price?.toLocaleString('id-ID')}
                                                            </span>
                                                        </div>
                                                    ))}
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
                                                className="w-full rounded-md border border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-xs p-1.5 text-center font-mono font-bold focus:ring-1 focus:ring-emerald-500 outline-none" 
                                            />
                                        </td>

                                        {/* Unit Price */}
                                        <td className="p-2">
                                            <input 
                                                type="number" 
                                                placeholder="0" 
                                                step="1" 
                                                value={item.price ?? ''} 
                                                onChange={e => handleItemChange(index, 'price', parseFloat(e.target.value) || 0)} 
                                                required 
                                                className="w-full rounded-md border border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-xs p-1.5 text-right font-mono font-bold focus:ring-1 focus:ring-emerald-500 outline-none" 
                                            />
                                        </td>

                                        {/* Subtotal */}
                                        <td className="p-2 text-right font-mono font-bold text-slate-900 dark:text-white text-xs">
                                            Rp{((item.quantity || 0) * (item.price || 0)).toLocaleString('id-ID')}
                                        </td>

                                        {/* Remove Action */}
                                        <td className="p-2 text-center">
                                            <button 
                                                type="button" 
                                                onClick={() => handleRemoveItem(index)} 
                                                className="text-slate-400 hover:text-rose-600 font-bold text-sm transition-colors"
                                                title="Hapus baris"
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
                        className="text-xs font-bold text-emerald-700 dark:text-emerald-400 hover:underline inline-flex items-center gap-1 py-1"
                    >
                        + Add a product
                    </button>
                </div>

                {/* Bottom Section (Summary Totals) */}
                <div className="pt-6 border-t border-slate-100 dark:border-zinc-800 flex justify-end">
                    <div className="space-y-2 text-xs font-medium w-full max-w-xs bg-slate-50/50 dark:bg-zinc-800/30 p-4 rounded-xl border border-slate-100 dark:border-zinc-800/80">
                        <div className="flex justify-between items-center text-slate-600 dark:text-zinc-400">
                            <span>Subtotal:</span>
                            <span className="font-mono font-bold text-slate-900 dark:text-white">Rp {totals.subtotal.toLocaleString('id-ID')}</span>
                        </div>
                        {isTaxEnabled && (
                            <div className="flex justify-between items-center text-slate-600 dark:text-zinc-400">
                                <span>Pajak ({(defaultTax?.rate || 0) * 100}%):</span>
                                <span className="font-mono font-bold text-slate-900 dark:text-white">Rp {totals.taxAmount.toLocaleString('id-ID')}</span>
                            </div>
                        )}
                        <div className="flex justify-between items-center text-sm font-black pt-2 border-t border-slate-200 dark:border-zinc-700 text-slate-900 dark:text-white">
                            <span>Total:</span>
                            <span className="font-mono text-emerald-700 dark:text-emerald-400 text-base">Rp {totals.grandTotal.toLocaleString('id-ID')}</span>
                        </div>
                    </div>
                </div>
            </form>
        </div>
    );
};

export const SalesListPage: React.FC = () => {
    const { state, dispatch } = useAppContext();
    const { sales, customerBills, currentBranchId, isTaxEnabled } = state;
    const [isReceiptModalOpen, setReceiptModalOpen] = useState(false);
    const [isDetailsModalOpen, setDetailsModalOpen] = useState(false);
    const [isCreateModalOpen, setCreateModalOpen] = useState(false);
    const [selectedSale, setSelectedSale] = useState<Sale | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState<'all' | Sale['status']>('all');
    const [channelFilter, setChannelFilter] = useState<'all' | Sale['saleChannel']>('all');

    const billedSaleIds = useMemo(() => new Set(customerBills.filter(b => b.sourceType === 'Sale').map(b => b.sourceId)), [customerBills]);

    const filteredSales = useMemo(() => {
        const lowercasedSearch = searchTerm.toLowerCase();
        return sales.filter(sale => {
            const isNonPos = sale.saleChannel === 'E-commerce' || sale.saleChannel === 'Manual';
            if (!isNonPos) return false;

            if (currentBranchId && sale.branchId !== currentBranchId) return false;
            
            const matchesSearch =
                sale.id.toLowerCase().includes(lowercasedSearch) ||
                sale.customerName.toLowerCase().includes(lowercasedSearch);

            const matchesStatus = statusFilter === 'all' || sale.status === statusFilter;
            const matchesChannel = channelFilter === 'all' || sale.saleChannel === channelFilter;

            return matchesSearch && matchesStatus && matchesChannel;
        });
    }, [sales, currentBranchId, searchTerm, statusFilter, channelFilter]);

    const handlePrintClick = (sale: Sale) => {
        setSelectedSale(sale);
        setReceiptModalOpen(true);
    };
    
    const handleViewClick = (sale: Sale) => {
        dispatch({ type: 'sales/setSelectedId', payload: sale.id });
        dispatch({ type: 'ui/setPage', payload: Page.SaleDetailsPage });
    };

    const handleCancelSale = (saleId: string) => {
        if (window.confirm("Anda yakin ingin membatalkan penjualan ini? Stok dan data keuangan akan dikembalikan.")) {
            dispatch({ type: 'sales/cancel', payload: saleId });
        }
    };

    const handleValidatePayment = (sale: Sale) => {
        dispatch({ type: 'billing/createCustomerBillFromSale', payload: { saleId: sale.id } });
        setSelectedSale(sale);
        setReceiptModalOpen(true);
    };
    
    const getSaleItemStatusChip = (status?: SaleItemStatus) => {
        switch(status || 'Draft') {
            case 'Draft': return 'bg-slate-100 text-slate-700 border border-slate-300';
            case 'Validasi': return 'bg-blue-100 text-blue-800 border border-blue-300';
            case 'Diproses': return 'bg-amber-100 text-amber-800 border border-amber-300';
            case 'Barang Diterima': return 'bg-emerald-100 text-emerald-800 border border-emerald-300';
        }
    };

    const getSalePaymentStatusChip = (status?: SalePaymentStatus) => {
        switch(status || 'Belum Lunas') {
            case 'Belum Lunas': return 'bg-rose-100 text-rose-800 border border-rose-300';
            case 'Lunas': return 'bg-emerald-100 text-emerald-800 border border-emerald-300';
        }
    };

    const handleUpdateSaleItemStatus = (saleId: string, itemStatus: SaleItemStatus) => {
        dispatch({ type: 'sales/updateStatuses', payload: { saleId, itemStatus } });
    };

    const handleDeleteSale = (saleId: string) => {
        if (window.confirm("Apakah Anda yakin ingin menghapus data penjualan ini?")) {
            dispatch({ type: 'sales/delete', payload: saleId });
        }
    };

    return (
        <div className="p-3 md:p-5 h-full flex flex-col gap-3 overflow-hidden bg-slate-50 dark:bg-zinc-950">
            {/* Top Navbar Header Control Bar */}
            <div className="bg-white dark:bg-zinc-900 px-4 py-2.5 rounded-2xl border border-zinc-200/80 dark:border-zinc-800 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-3 shrink-0">
                {/* Title & Count */}
                <div className="flex items-center gap-3 shrink-0">
                    <div className="w-9 h-9 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-black text-sm">
                        🛒
                    </div>
                    <div>
                        <div className="flex items-center gap-2">
                            <h1 className="text-base font-black text-slate-900 dark:text-white tracking-tight">Data Penjualan</h1>
                            <span className="bg-slate-100 dark:bg-zinc-800 text-slate-600 dark:text-slate-400 text-[10px] font-bold px-2 py-0.5 rounded-full font-mono">
                                {filteredSales.length}
                            </span>
                        </div>
                        <p className="text-[10px] text-slate-400 dark:text-slate-500 font-medium">Faktur & riwayat transaksi pelanggan</p>
                    </div>
                </div>

                {/* Navbar Controls */}
                <div className="flex flex-wrap md:flex-nowrap items-center gap-2 flex-1 max-w-full md:max-w-2xl justify-end">
                    <div className="flex-1 min-w-[180px]">
                        <Input 
                            placeholder="Cari ID Faktur / Pelanggan..."
                            value={searchTerm}
                            onChange={e => setSearchTerm(e.target.value)}
                            className="h-8 text-xs bg-slate-50/50 dark:bg-zinc-800/50 border-slate-200 dark:border-zinc-700/80 focus:bg-white rounded-xl"
                        />
                    </div>
                    <div className="w-36 shrink-0">
                        <Select value={statusFilter} onChange={e => setStatusFilter(e.target.value as any)} className="h-8 text-xs bg-slate-50/50 dark:bg-zinc-800/50 border-slate-200 dark:border-zinc-700/80 rounded-xl">
                            <option value="all">Status Bayar</option>
                            <option value="Paid">Paid</option>
                            <option value="Unpaid">Unpaid</option>
                            <option value="Cancelled">Cancelled</option>
                        </Select>
                    </div>
                    <div className="w-32 shrink-0">
                        <Select value={channelFilter} onChange={e => setChannelFilter(e.target.value as any)} className="h-8 text-xs bg-slate-50/50 dark:bg-zinc-800/50 border-slate-200 dark:border-zinc-700/80 rounded-xl">
                            <option value="all">Semua Kanal</option>
                            <option value="E-commerce">E-commerce</option>
                            <option value="Manual">Manual</option>
                        </Select>
                    </div>
                    <Button 
                        onClick={() => dispatch({ type: 'ui/setPage', payload: Page.CreateManualSale })} 
                        className="text-xs h-8 px-3 font-bold whitespace-nowrap bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl shadow-xs shrink-0 flex items-center gap-1.5 ml-auto"
                    >
                        <span>+ Penjualan Manual</span>
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
                                <th scope="col" className="px-4 py-3">ID Faktur</th>
                                <th scope="col" className="px-4 py-3">Tanggal</th>
                                <th scope="col" className="px-4 py-3">Pelanggan</th>
                                <th scope="col" className="px-4 py-3">Kanal</th>
                                <th scope="col" className="px-4 py-3 text-center">Status Barang</th>
                                <th scope="col" className="px-4 py-3 text-center">Status Pembayaran</th>
                                {isTaxEnabled && <th scope="col" className="px-4 py-3 text-right">Pajak</th>}
                                <th scope="col" className="px-4 py-3 text-right">Total</th>
                                <th scope="col" className="px-4 py-3 text-center">Aksi</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-zinc-800/60">
                            {filteredSales.length === 0 ? (
                                <tr>
                                    <td colSpan={isTaxEnabled ? 9 : 8} className="text-center py-12 text-slate-400">
                                        Tidak ada data penjualan yang ditemukan.
                                    </td>
                                </tr>
                            ) : (
                                filteredSales.map((sale) => {
                                    const itemStatus: SaleItemStatus = sale.itemStatus || (sale.fulfillmentStatus === 'Delivered' ? 'Barang Diterima' : 'Draft');
                                    const paymentStatus: SalePaymentStatus = sale.paymentStatus || (sale.status === 'Paid' ? 'Lunas' : 'Belum Lunas');

                                    return (
                                        <tr 
                                            key={sale.id} 
                                            onClick={() => handleViewClick(sale)}
                                            className="hover:bg-emerald-50/50 dark:hover:bg-zinc-800/60 cursor-pointer transition-colors"
                                        >
                                            <td className="px-4 py-3 font-bold font-mono text-emerald-700 dark:text-emerald-400 text-[11px]">{sale.id}</td>
                                            <td className="px-4 py-3 text-slate-500 font-mono">{new Date(sale.date).toLocaleDateString('id-ID')}</td>
                                            <td className="px-4 py-3 font-semibold text-slate-800 dark:text-slate-200">{sale.customerName}</td>
                                            <td className="px-4 py-3 text-slate-500">{sale.saleChannel || 'Manual'}</td>
                                            
                                            {/* Status Barang Badge */}
                                            <td className="px-4 py-3 text-center">
                                                <span className={`text-[10px] font-extrabold px-2.5 py-1 rounded-full ${getSaleItemStatusChip(itemStatus)}`}>
                                                    {itemStatus}
                                                </span>
                                            </td>

                                            {/* Status Pembayaran Badge */}
                                            <td className="px-4 py-3 text-center">
                                                <span className={`text-[10px] font-extrabold px-2.5 py-1 rounded-full ${getSalePaymentStatusChip(paymentStatus)}`}>
                                                    {paymentStatus}
                                                </span>
                                            </td>

                                            {isTaxEnabled && <td className="px-4 py-3 text-right font-mono text-[11px]">Rp{sale.taxAmount.toLocaleString('id-ID')}</td>}
                                            <td className="px-4 py-3 font-black text-right text-slate-900 dark:text-white font-mono text-[11px]">Rp{sale.grandTotal.toLocaleString('id-ID')}</td>
                                            <td className="px-4 py-3 text-center" onClick={(e) => e.stopPropagation()}>
                                                <div className="flex items-center justify-center gap-1">
                                                    <button
                                                        type="button"
                                                        onClick={() => handleViewClick(sale)}
                                                        title="Lihat Detail Pesanan & Pembayaran"
                                                        className="p-1.5 rounded-lg text-emerald-600 hover:bg-emerald-50 dark:hover:bg-zinc-800 transition-colors"
                                                    >
                                                        👁️
                                                    </button>
                                                    <button
                                                        type="button"
                                                        onClick={() => handlePrintClick(sale)}
                                                        title="Cetak Struk / Nota"
                                                        className="p-1.5 rounded-lg text-blue-600 hover:bg-blue-50 dark:hover:bg-zinc-800 transition-colors"
                                                    >
                                                        🖨️
                                                    </button>
                                                    {itemStatus === 'Draft' ? (
                                                        <button
                                                            type="button"
                                                            onClick={() => handleDeleteSale(sale.id)}
                                                            title="Hapus Penjualan (Hanya Draft)"
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

                {/* 2. MOBILE VIEW: Kotak Balok Cards */}
                <div className="block md:hidden space-y-3">
                    {filteredSales.length === 0 ? (
                        <div className="bg-white dark:bg-zinc-900 rounded-2xl p-8 text-center border border-zinc-200 dark:border-zinc-800 text-slate-400 text-xs">
                            Tidak ada data penjualan.
                        </div>
                    ) : (
                        filteredSales.map((sale) => {
                            const itemStatus: SaleItemStatus = sale.itemStatus || (sale.fulfillmentStatus === 'Delivered' ? 'Barang Diterima' : 'Draft');
                            const paymentStatus: SalePaymentStatus = sale.paymentStatus || (sale.status === 'Paid' ? 'Lunas' : 'Belum Lunas');

                            return (
                                <div key={sale.id} className="bg-white dark:bg-zinc-900 rounded-xl border border-slate-200/80 dark:border-zinc-800 p-3.5 shadow-2xs space-y-2.5">
                                    <div className="flex items-start justify-between gap-2">
                                        <div>
                                            <h3 className="font-extrabold text-xs font-mono text-slate-900 dark:text-white">{sale.id}</h3>
                                            <p className="text-[10px] text-slate-400 font-medium">Pelanggan: {sale.customerName}</p>
                                        </div>
                                        <span className={`px-2 py-0.5 rounded-full text-[9px] font-extrabold ${getSalePaymentStatusChip(paymentStatus)}`}>
                                            {paymentStatus}
                                        </span>
                                    </div>
                                    <div className="space-y-1 text-xs text-slate-600 dark:text-zinc-300 border-y border-slate-100 dark:border-zinc-800 py-2 font-mono">
                                        <div>Tgl: {new Date(sale.date).toLocaleDateString('id-ID')}</div>
                                        <div>Status Barang: <span className="font-bold">{itemStatus}</span></div>
                                        <div className="text-[11px] text-emerald-600 dark:text-emerald-400 font-black">Total: Rp{sale.grandTotal.toLocaleString('id-ID')}</div>
                                    </div>
                                    <div className="flex justify-end items-center gap-2">
                                        <Button onClick={() => handlePrintClick(sale)} variant="secondary" className="text-[10px] py-1 px-2.5">
                                            Nota
                                        </Button>
                                        <Button onClick={() => handleViewClick(sale)} variant="secondary" className="text-[10px] py-1 px-2.5 text-blue-600">
                                            Detail
                                        </Button>
                                    </div>
                                </div>
                            );
                        })
                    )}
                </div>
            </div>
            <ReceiptModal isOpen={isReceiptModalOpen} onClose={() => setReceiptModalOpen(false)} sale={selectedSale} />
        </div>
    );
};

export const Sales: React.FC = () => {
    const { state } = useAppContext();
    switch (state.currentPage) {
        case Page.CreateManualSale:
            return <CreateManualSalePage />;
        case Page.SaleDetailsPage:
            return <SaleDetailsPage />;
        default:
            return <SalesListPage />;
    }
};

// --- Page 3: Order Fulfillment Page ---
export const OrderFulfillmentPage: React.FC = () => {
    const { state, dispatch } = useAppContext();
    const { sales, currentBranchId } = state;

    const pendingFulfillment = useMemo(() => {
        const baseFiltered = state.sales.filter(s => s.saleChannel === 'E-commerce' && s.fulfillmentStatus === 'Pending');
        if (!currentBranchId) return baseFiltered;
        return baseFiltered.filter(s => s.branchId === currentBranchId);
    }, [state.sales, currentBranchId]);

    const handleFulfill = (saleId: string) => {
        dispatch({ type: 'sales/updateStatus', payload: { saleId, fulfillmentStatus: 'Fulfilled' } });
    };

    return (
        <div className="p-8 h-full flex flex-col">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-6">Pemenuhan Pesanan E-commerce</h1>
            <div className="flex-grow bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-y-auto p-6 space-y-4">
                {pendingFulfillment.length === 0 && <p className="text-gray-500">Tidak ada pesanan yang menunggu pemenuhan.</p>}
                {pendingFulfillment.map(sale => (
                    <div key={sale.id} className="border dark:border-gray-700 rounded-lg p-4">
                        <div className="flex justify-between items-start">
                            <div>
                                <h3 className="font-bold">Pesanan #{sale.id}</h3>
                                <p className="text-sm">Pelanggan: {sale.customerName}</p>
                                <p className="text-sm">Tanggal: {new Date(sale.date).toLocaleString('id-ID')}</p>
                            </div>
                            <Button onClick={() => handleFulfill(sale.id)}>
                                Tandai Siap Dikirim
                            </Button>
                        </div>
                        <ul className="list-disc ml-6 mt-2 text-sm">
                            {sale.items.map(item => <li key={item.productId}>{item.productName} (x{item.quantity})</li>)}
                        </ul>
                    </div>
                ))}
            </div>
        </div>
    );
};
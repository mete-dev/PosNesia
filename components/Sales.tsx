import React, { useState, useMemo, useRef } from 'react';
import { Sale, Product, Customer, PaymentMethod, PaymentTerm, SaleItem, Status, FulfillmentStatus, Vehicle, Page } from '../types';
import { useAppContext } from '../hooks/useAppContext';
import { Receipt } from './Receipt';
import { ActionsDropdown, DropdownItem, Modal, Button, Input, Select, Label, Badge } from './ui';

// --- Page 1: Sales List Page ---
const SaleDetailsModal: React.FC<{
    isOpen: boolean;
    onClose: () => void;
    sale: Sale | null;
}> = ({ isOpen, onClose, sale }) => {
    const { state, dispatch } = useAppContext();
    const { customerBills } = state;
    if (!sale) return null;

    const paymentMethod = sale.payments.map(p => state.paymentMethods.find(pm => pm.id === p.paymentMethodId)?.name).join(', ') || 'N/A';
    const paymentTerm = state.paymentTerms.find(pt => pt.id === sale.paymentTermId)?.name || 'N/A';
    const hasBill = useMemo(() => customerBills.some(b => b.sourceType === 'Sale' && b.sourceId === sale.id), [customerBills, sale.id]);

    const handleValidatePayment = () => {
        dispatch({ type: 'billing/createCustomerBillFromSale', payload: { saleId: sale.id } });
        onClose(); // Close details modal after action
    };

    const handleAddAttachment = () => {
        const fileName = prompt("Masukkan nama file lampiran:", "");
        if (fileName) {
            dispatch({ type: 'sales/addAttachment', payload: { saleId: sale.id, fileName } });
        }
    };

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title={`Detail Penjualan #${sale.id}`}
            footer={
                sale.status === 'Unpaid' && !hasBill ? (
                    <Button onClick={handleValidatePayment} variant="primary">Validasi Pembayaran & Buat Tagihan</Button>
                ) : undefined
            }
        >
            <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                    <p><strong>Pelanggan:</strong> {sale.customerName}</p>
                    <p><strong>Tanggal:</strong> {new Date(sale.date).toLocaleString('id-ID')}</p>
                    <p><strong>Pembayaran:</strong> {paymentMethod}</p>
                    <p><strong>Tempo:</strong> {paymentTerm}</p>
                </div>
                <h3 className="text-lg font-semibold pt-2 border-t dark:border-gray-600">Item</h3>
                    <table className="w-full text-sm">
                        <thead className="text-xs uppercase bg-gray-50 dark:bg-gray-700">
                        <tr>
                            <th className="px-4 py-2">Produk</th>
                            <th className="px-4 py-2 text-center">Qty</th>
                            <th className="px-4 py-2 text-right">Total</th>
                        </tr>
                        </thead>
                        <tbody>
                        {sale.items.map(item => (
                            <tr key={item.productId} className="border-b dark:border-gray-700">
                                <td className="px-4 py-2">{item.productName}</td>
                                <td className="px-4 py-2 text-center">{item.quantity}</td>
                                <td className="px-4 py-2 text-right">Rp{(item.price * item.quantity).toLocaleString('id-ID')}</td>
                            </tr>
                        ))}
                        </tbody>
                    </table>
                    <div className="space-y-1 text-right font-medium">
                    <p>Subtotal: Rp{sale.subtotal.toLocaleString('id-ID')}</p>
                    <p className="text-green-500">Diskon: - Rp{sale.discount.toLocaleString('id-ID')}</p>
                    <p>Pajak: Rp{sale.taxAmount.toLocaleString('id-ID')}</p>
                    <p className="text-xl font-bold">Total: Rp{sale.grandTotal.toLocaleString('id-ID')}</p>
                    </div>
                <div className="pt-2 border-t dark:border-gray-600">
                    <h3 className="text-lg font-semibold">Lampiran</h3>
                    <ul className="list-disc list-inside text-sm mt-2">
                        {sale.attachments?.map((att, index) => <li key={index}>{att.name}</li>)}
                    </ul>
                    {(!sale.attachments || sale.attachments.length === 0) && <p className="text-sm text-gray-500">Tidak ada lampiran.</p>}
                    <Button onClick={handleAddAttachment} variant="secondary" size="sm" className="mt-2">Tambah Lampiran</Button>
                </div>
            </div>
        </Modal>
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
    const [paymentTermId, setPaymentTermId] = useState('');
    const [items, setItems] = useState<Partial<SaleItem>[]>([{ productId: '', quantity: 1, price: 0 }]);
    const [productSearch, setProductSearch] = useState<string[]>(['']);
    const [activeSuggestionBox, setActiveSuggestionBox] = useState<number | null>(null);

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
        if (!customer || !paymentTermId) {
            alert("Harap pilih Pelanggan dan Tempo Pembayaran.");
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
            payments: [],
            paymentTermId,
            dueDate: new Date(new Date(saleDate).getTime() + (paymentTerms.find(pt => pt.id === paymentTermId)?.days || 0) * 24 * 60 * 60 * 1000).toISOString(),
            status: 'Unpaid',
            saleChannel: 'Manual',
            fulfillmentStatus: 'N/A'
        };
        
        dispatch({ type: 'sales/add', payload: saleData });
        alert('Penjualan manual berhasil disimpan!');
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
                        <div className="grid grid-cols-12 items-center gap-2">
                            <label className="col-span-4 font-bold text-slate-700 dark:text-zinc-300">
                                Pelanggan <span className="text-rose-500">*</span>
                            </label>
                            <select 
                                value={customerId} 
                                onChange={e => setCustomerId(e.target.value)} 
                                required 
                                className="col-span-8 rounded-lg border border-emerald-200 dark:border-emerald-900/60 bg-emerald-50/30 dark:bg-emerald-950/20 text-xs font-semibold p-2 text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500 outline-none"
                            >
                                <option value="">Pilih Pelanggan...</option>
                                {customers.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                            </select>
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
                                Tempo Pembayaran <span className="text-rose-500">*</span>
                            </label>
                            <select 
                                value={paymentTermId} 
                                onChange={e => setPaymentTermId(e.target.value)} 
                                required 
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
        setSelectedSale(sale);
        setDetailsModalOpen(true);
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
    
    return (
        <div className="p-3 md:p-5 h-full flex flex-col gap-3">
            {/* Top Navbar Header Control Bar */}
            <header className="bg-white dark:bg-zinc-900 px-4 py-2.5 rounded-2xl border border-zinc-200/80 dark:border-zinc-800 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-3 shrink-0">
                {/* Title & Count */}
                <div className="flex items-center gap-3 shrink-0">
                    <div className="w-9 h-9 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-black text-sm">
                        🛒
                    </div>
                    <div>
                        <div className="flex items-center gap-2">
                            <h1 className="text-base font-black text-gray-900 dark:text-white tracking-tight">Data Penjualan</h1>
                            <span className="bg-slate-100 dark:bg-zinc-800 text-slate-600 dark:text-slate-400 text-[10px] font-bold px-2 py-0.5 rounded-full font-mono">
                                {filteredSales.length}
                            </span>
                        </div>
                        <p className="text-[10px] text-slate-400 dark:text-slate-500 font-medium">Faktur & riwayat transaksi</p>
                    </div>
                </div>

                {/* Navbar Controls */}
                <div className="flex flex-wrap md:flex-nowrap items-center gap-2 flex-1 max-w-full md:max-w-3xl justify-end">
                    <div className="flex-1 min-w-[180px]">
                        <Input 
                            placeholder="Cari ID Faktur / Pelanggan..."
                            value={searchTerm}
                            onChange={e => setSearchTerm(e.target.value)}
                            className="h-8 text-xs bg-slate-50/50 dark:bg-zinc-800/50 border-slate-200 dark:border-zinc-700/80 focus:bg-white"
                        />
                    </div>
                    <div className="w-36 shrink-0">
                        <Select value={statusFilter} onChange={e => setStatusFilter(e.target.value as any)} className="h-8 text-xs bg-slate-50/50 dark:bg-zinc-800/50 border-slate-200 dark:border-zinc-700/80">
                            <option value="all">Status Bayar</option>
                            <option value="Paid">Paid</option>
                            <option value="Unpaid">Unpaid</option>
                            <option value="Cancelled">Cancelled</option>
                        </Select>
                    </div>
                    <div className="w-32 shrink-0">
                        <Select value={channelFilter} onChange={e => setChannelFilter(e.target.value as any)} className="h-8 text-xs bg-slate-50/50 dark:bg-zinc-800/50 border-slate-200 dark:border-zinc-700/80">
                            <option value="all">Semua Kanal</option>
                            <option value="E-commerce">E-commerce</option>
                            <option value="Manual">Manual</option>
                        </Select>
                    </div>
                    <Button onClick={() => dispatch({ type: 'ui/setPage', payload: Page.CreateManualSale })} className="gap-1 text-xs h-8 px-3 font-bold whitespace-nowrap bg-emerald-600 hover:bg-emerald-700 text-white shrink-0">
                        <span>+ Penjualan Manual</span>
                    </Button>
                </div>
            </header>

            {/* Full-Page Free-Standing Data Table Container */}
            <div className="flex-1 min-h-0 overflow-y-auto bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200/80 dark:border-zinc-800 shadow-xs">
                <table className="w-full text-xs text-left text-gray-500 dark:text-gray-400">
                    <thead className="text-[11px] font-extrabold text-gray-700 uppercase bg-slate-50 dark:bg-zinc-800/60 dark:text-gray-400 sticky top-0 border-b border-zinc-200/80 dark:border-zinc-800">
                        <tr>
                            <th scope="col" className="px-3 py-2">ID Faktur</th>
                            <th scope="col" className="px-3 py-2">Tanggal</th>
                            <th scope="col" className="px-3 py-2">Pelanggan</th>
                            <th scope="col" className="px-3 py-2">Kanal</th>
                            <th scope="col" className="px-3 py-2">Status Bayar</th>
                            <th scope="col" className="px-3 py-2">Status Kirim</th>
                            {isTaxEnabled && <th scope="col" className="px-3 py-2 text-right">Pajak</th>}
                            <th scope="col" className="px-3 py-2 text-right">Total</th>
                            <th scope="col" className="px-3 py-2 text-center">Aksi</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-zinc-800/60">
                        {filteredSales.map((sale) => (
                            <tr key={sale.id} className="hover:bg-slate-50/70 dark:hover:bg-zinc-800/40 transition-colors">
                                <td className="px-3 py-1.5 font-bold font-mono text-gray-900 dark:text-white text-[11px]">{sale.id}</td>
                                <td className="px-3 py-1.5 text-[11px] text-slate-500">{new Date(sale.date).toLocaleDateString('id-ID')}</td>
                                <td className="px-3 py-1.5 font-semibold text-slate-800 dark:text-slate-200 text-[11px]">{sale.customerName}</td>
                                <td className="px-3 py-1.5 text-[11px] text-slate-500">{sale.saleChannel || 'Manual'}</td>
                                <td className="px-3 py-1.5">
                                    <Badge variant={sale.status === 'Paid' ? 'success' : sale.status === 'Unpaid' ? 'warning' : 'danger'} className="text-[9px] px-1.5 py-0">{sale.status}</Badge>
                                </td>
                                 <td className="px-3 py-1.5">
                                    <Badge variant={sale.fulfillmentStatus === 'Delivered' ? 'success' : 'info'} className="text-[9px] px-1.5 py-0">{sale.fulfillmentStatus || 'N/A'}</Badge>
                                </td>
                                {isTaxEnabled && <td className="px-3 py-1.5 text-right font-mono text-[11px]">Rp{sale.taxAmount.toLocaleString('id-ID')}</td>}
                                <td className="px-3 py-1.5 font-black text-right text-emerald-600 dark:text-emerald-400 font-mono text-[11px]">Rp{sale.grandTotal.toLocaleString('id-ID')}</td>
                                <td className="px-3 py-1.5 text-center">
                                     <ActionsDropdown>
                                        <DropdownItem onClick={() => handleViewClick(sale)}>Lihat Detail</DropdownItem>
                                        <DropdownItem onClick={() => handlePrintClick(sale)}>Cetak Nota</DropdownItem>
                                        {sale.status === 'Unpaid' && !billedSaleIds.has(sale.id) && (
                                            <DropdownItem onClick={() => handleValidatePayment(sale)} className="text-blue-600 dark:text-blue-500">
                                                Validasi & Buat Tagihan
                                            </DropdownItem>
                                        )}
                                        <DropdownItem
                                            onClick={() => handleCancelSale(sale.id)}
                                            disabled={sale.status === 'Cancelled' || sale.status === 'Paid'}
                                            className="text-red-600 dark:text-red-500"
                                        >
                                            Batalkan
                                        </DropdownItem>
                                    </ActionsDropdown>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
            <ReceiptModal isOpen={isReceiptModalOpen} onClose={() => setReceiptModalOpen(false)} sale={selectedSale} />
            <SaleDetailsModal isOpen={isDetailsModalOpen} onClose={() => setDetailsModalOpen(false)} sale={selectedSale} />
            <CreateManualSaleModal isOpen={isCreateModalOpen} onClose={() => setCreateModalOpen(false)} />
        </div>
    );
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
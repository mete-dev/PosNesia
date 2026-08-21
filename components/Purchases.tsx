import React, { useState, useMemo, useEffect } from 'react';
import { PurchaseOrder, Vendor, Product, PurchaseOrderItem, Page } from '../types';
import { useAppContext } from '../hooks/useAppContext';
import { ActionsDropdown, DropdownItem, Modal, Button, Input } from './ui';
import { VendorBillModal } from './Bills';
import { ProductModal } from './Products';


export const PurchaseOrderDetailsModal: React.FC<{ isOpen: boolean, onClose: () => void, purchaseOrder: PurchaseOrder | null }> = ({ isOpen, onClose, purchaseOrder }) => {
    const { dispatch } = useAppContext();
    if (!purchaseOrder) return null;

    const handleAddAttachment = () => {
        const fileName = prompt("Masukkan nama file lampiran:", "");
        if (fileName) {
            dispatch({ type: 'purchases/addAttachment', payload: { purchaseOrderId: purchaseOrder.id, fileName } });
        }
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={`Detail Pembelian #${purchaseOrder.id}`} maxWidth="max-w-3xl">
            <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4 text-sm">
                    <p><strong>Vendor:</strong> {purchaseOrder.vendorName}</p>
                    <p><strong>Tanggal Pesan:</strong> {new Date(purchaseOrder.orderDate).toLocaleDateString('id-ID')}</p>
                    <p><strong>No. Faktur:</strong> {purchaseOrder.invoiceNumber || 'N/A'}</p>
                    <p><strong>Perkiraan Tiba:</strong> {new Date(purchaseOrder.expectedDelivery).toLocaleDateString('id-ID')}</p>
                </div>
                <h3 className="font-semibold pt-2 border-t dark:border-gray-600">Item yang Dipesan</h3>
                <table className="w-full text-sm">
                    <thead className="bg-gray-50 dark:bg-gray-700">
                        <tr>
                            <th className="p-2 text-left">Produk</th>
                            <th className="p-2 text-center">Qty</th>
                            <th className="p-2 text-right">Harga Satuan</th>
                            <th className="p-2 text-right">Subtotal</th>
                        </tr>
                    </thead>
                    <tbody>
                        {purchaseOrder.items.map(item => (
                            <tr key={item.productId} className="border-b dark:border-gray-700">
                                <td className="p-2">{item.productName}</td>
                                <td className="p-2 text-center">{item.quantity}</td>
                                <td className="p-2 text-right">Rp{item.cost.toLocaleString('id-ID')}</td>
                                <td className="p-2 text-right">Rp{(item.cost * item.quantity).toLocaleString('id-ID')}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                 <div className="space-y-1 text-right font-medium mt-4">
                    <p>Subtotal: Rp{purchaseOrder.subtotal.toLocaleString('id-ID')}</p>
                    <p>Pajak: Rp{purchaseOrder.taxAmount.toLocaleString('id-ID')}</p>
                    <p className="text-xl font-bold">Grand Total: Rp{purchaseOrder.grandTotal.toLocaleString('id-ID')}</p>
                </div>
                <div className="pt-2 border-t dark:border-gray-600">
                    <h3 className="text-lg font-semibold">Lampiran</h3>
                    <ul className="list-disc list-inside text-sm mt-2">
                        {purchaseOrder.attachments?.map((att, index) => <li key={index}>{att.name}</li>)}
                    </ul>
                    {(!purchaseOrder.attachments || purchaseOrder.attachments.length === 0) && <p className="text-sm text-gray-500">Tidak ada lampiran.</p>}
                    <Button onClick={handleAddAttachment} variant="secondary" size="sm" className="mt-2">Tambah Lampiran</Button>
                </div>
            </div>
        </Modal>
    );
};

// --- Page 2: Add Purchase Page (New complex component) ---
export const AddPurchasePage: React.FC = () => {
    const { state, dispatch } = useAppContext();
    const { vendors, products, taxRates, warehouses } = state;
    
    const [vendorId, setVendorId] = useState('');
    const [destinationId, setDestinationId] = useState(warehouses[0]?.id || 'wh_c1');

    useEffect(() => {
        if (warehouses.length > 0 && !destinationId) {
            setDestinationId(warehouses[0].id);
        }
    }, [warehouses]);
    const [invoiceNumber, setInvoiceNumber] = useState('');
    const [vendorNoteNumber, setVendorNoteNumber] = useState('');
    const [orderDate, setOrderDate] = useState(new Date().toISOString().split('T')[0]);
    const [dueDate, setDueDate] = useState('');
    const [expectedDelivery, setExpectedDelivery] = useState('');
    const [items, setItems] = useState<Partial<PurchaseOrderItem>[]>([{ productId: '', quantity: 1, cost: 0 }]);
    const [taxType, setTaxType] = useState<'exclusive' | 'inclusive' | 'none'>('exclusive');

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
        
        const purchaseData: Omit<PurchaseOrder, 'id'> = {
            destinationType: 'warehouse',
            destinationId,
            vendorId,
            vendorName: vendor.name,
            orderDate,
            expectedDelivery,
            dueDate,
            invoiceNumber,
            vendorNoteNumber,
            status: 'Pending',
            items: finalItems,
            taxType,
            taxRate: taxType !== 'none' ? (defaultTax?.rate || 0) : 0,
            subtotal: totals.subtotal,
            taxAmount: totals.taxAmount,
            grandTotal: totals.grandTotal,
        };
        
        dispatch({ type: 'purchases/add', payload: purchaseData });
        alert('Purchase Order berhasil dibuat!');
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
            <form onSubmit={handleSubmit} className="bg-white dark:bg-zinc-900 rounded-xl shadow-xs border border-slate-200 dark:border-zinc-800 p-6 md:p-8 space-y-6">
                
                {/* Header Information Grid (2 Side-by-Side Columns) */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-4 pb-6 border-b border-slate-100 dark:border-zinc-800 text-xs">
                    {/* Left Side */}
                    <div className="space-y-3">
                        <div className="grid grid-cols-12 items-center gap-2">
                            <label className="col-span-4 font-bold text-slate-700 dark:text-zinc-300">
                                Vendor <span className="text-rose-500">*</span>
                            </label>
                            <select 
                                value={vendorId} 
                                onChange={e => setVendorId(e.target.value)} 
                                required 
                                className="col-span-8 rounded-lg border border-purple-200 dark:border-purple-900/60 bg-purple-50/30 dark:bg-purple-950/20 text-xs font-semibold p-2 text-slate-900 dark:text-white focus:ring-2 focus:ring-purple-500 outline-none"
                            >
                                <option value="">Pilih Vendor...</option>
                                {vendors.map(v => <option key={v.id} value={v.id}>{v.name}</option>)}
                            </select>
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
                                Tujuan Barang <span className="text-rose-500">*</span>
                            </label>
                            <select 
                                value={destinationId} 
                                onChange={e => setDestinationId(e.target.value)} 
                                required 
                                className="col-span-8 rounded-lg border border-slate-200 dark:border-zinc-700 bg-slate-50 dark:bg-zinc-800 text-xs font-semibold p-2 text-slate-900 dark:text-white focus:ring-2 focus:ring-purple-500 outline-none cursor-not-allowed"
                            >
                                {warehouses.map(w => <option key={w.id} value={w.id}>{w.name}</option>)}
                            </select>
                        </div>

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
                            <label className="col-span-4 text-slate-600 dark:text-zinc-400 font-medium">
                                Jatuh Tempo
                            </label>
                            <input 
                                type="date" 
                                value={dueDate} 
                                onChange={e => setDueDate(e.target.value)} 
                                className="col-span-8 rounded-lg border border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-xs p-2 text-slate-900 dark:text-white focus:ring-2 focus:ring-purple-500 outline-none"
                            />
                        </div>
                    </div>
                </div>

                {/* Tabbed / Products Table Header */}
                <div className="space-y-3">
                    <div className="flex items-center gap-6 border-b border-slate-200 dark:border-zinc-800">
                        <button type="button" className="pb-2 text-xs font-black text-purple-700 dark:text-purple-400 border-b-2 border-purple-600 uppercase tracking-wider">
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
                                                                Rp{p.cost?.toLocaleString('id-ID')}
                                                            </span>
                                                        </div>
                                                    )) : (
                                                        <div className="p-3 text-center text-xs text-slate-500">
                                                            <p className="mb-2">Produk tidak ditemukan.</p>
                                                            <Button 
                                                                variant="secondary" 
                                                                size="sm" 
                                                                className="text-xs py-1 px-3" 
                                                                onMouseDown={() => { setCreatingProductForIndex(index); setProductModalOpen(true); }}
                                                            >
                                                                + Buat Produk Baru
                                                            </Button>
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

                {/* Bottom Section (Terms & Conditions + Subtotal / Taxes Summary) */}
                <div className="pt-6 border-t border-slate-100 dark:border-zinc-800 grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
                    {/* Left: Tax Options & Notes */}
                    <div className="space-y-3">
                        <div>
                            <label className="block text-xs font-bold text-slate-700 dark:text-zinc-300 mb-1">
                                Opsi Pajak (Taxes)
                            </label>
                            <div className="flex items-center gap-4 text-xs">
                                <label className="flex items-center gap-1.5 cursor-pointer">
                                    <input type="radio" name="taxType" value="exclusive" checked={taxType === 'exclusive'} onChange={e => setTaxType(e.target.value as any)} className="text-purple-600 focus:ring-purple-500"/> 
                                    Exclusive
                                </label>
                                <label className="flex items-center gap-1.5 cursor-pointer">
                                    <input type="radio" name="taxType" value="inclusive" checked={taxType === 'inclusive'} onChange={e => setTaxType(e.target.value as any)} className="text-purple-600 focus:ring-purple-500"/> 
                                    Inclusive
                                </label>
                                <label className="flex items-center gap-1.5 cursor-pointer">
                                    <input type="radio" name="taxType" value="none" checked={taxType === 'none'} onChange={e => setTaxType(e.target.value as any)} className="text-purple-600 focus:ring-purple-500"/> 
                                    Non-Pajak
                                </label>
                            </div>
                        </div>

                        <div>
                            <textarea 
                                placeholder="Define your terms and conditions..."
                                rows={3}
                                className="w-full rounded-lg border border-slate-200 dark:border-zinc-700 bg-slate-50/50 dark:bg-zinc-800/40 p-2.5 text-xs text-slate-800 dark:text-zinc-200 outline-none focus:ring-1 focus:ring-purple-500"
                            />
                        </div>
                    </div>

                    {/* Right: Odoo Style Summary Totals */}
                    <div className="space-y-2 text-xs font-medium w-full max-w-xs ml-auto bg-slate-50/50 dark:bg-zinc-800/30 p-4 rounded-xl border border-slate-100 dark:border-zinc-800/80">
                        <div className="flex justify-between items-center text-slate-600 dark:text-zinc-400">
                            <span>Untaxed Amount:</span>
                            <span className="font-mono font-bold text-slate-900 dark:text-white">Rp {totals.subtotal.toLocaleString('id-ID')}</span>
                        </div>
                        <div className="flex justify-between items-center text-slate-600 dark:text-zinc-400">
                            <span>Taxes ({(defaultTax?.rate || 0) * 100}%):</span>
                            <span className="font-mono font-bold text-slate-900 dark:text-white">Rp {totals.taxAmount.toLocaleString('id-ID')}</span>
                        </div>
                        <div className="flex justify-between items-center text-sm font-black pt-2 border-t border-slate-200 dark:border-zinc-700 text-slate-900 dark:text-white">
                            <span>Total:</span>
                            <span className="font-mono text-purple-700 dark:text-purple-400 text-base">Rp {totals.grandTotal.toLocaleString('id-ID')}</span>
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

  const getStatusChip = (status: PurchaseOrder['status']) => {
    switch(status) {
        case 'Pending': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300';
        case 'Received': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300';
        case 'Cancelled': return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300';
    }
  }

  const handleCreateBill = (purchaseOrderId: string) => {
    dispatch({ type: 'billing/createVendorBillFromPo', payload: { purchaseOrderId } });
  }

  const handleCancelPO = (purchaseOrderId: string) => {
    if (window.confirm("Anda yakin ingin membatalkan pesanan pembelian ini?")) {
        dispatch({ type: 'purchases/cancel', payload: purchaseOrderId });
    }
  };
  
  const handleViewDetails = (po: PurchaseOrder) => {
      setSelectedPO(po);
      setDetailsModalOpen(true);
  };

  const billedPurchaseIds = useMemo(() => new Set(vendorBills.map(b => b.purchaseOrderId)), [vendorBills]);

  return (
    <div className="p-8 h-full flex flex-col">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Pesanan Pembelian</h1>
        <Button 
          onClick={() => dispatch({ type: 'ui/setPage', payload: Page.AddPurchase })}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold px-4 py-2.5 rounded-xl shadow-md transition-all shrink-0"
        >
          <span className="text-lg font-bold">+</span> Buat Pembelian
        </Button>
      </div>
      <div className="flex-grow bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-y-auto">
        <table className="w-full text-sm text-left text-gray-500 dark:text-gray-400">
          <thead className="text-xs text-gray-700 uppercase bg-gray-50 dark:bg-gray-700 dark:text-gray-400 sticky top-0">
            <tr>
              <th scope="col" className="px-6 py-3">ID Pesanan</th>
              <th scope="col" className="px-6 py-3">Vendor</th>
              <th scope="col" className="px-6 py-3">Tgl. Pesan</th>
              <th scope="col" className="px-6 py-3">Status</th>
              <th scope="col" className="px-6 py-3">Status Tagihan</th>
              <th scope="col" className="px-6 py-3 text-right">Total</th>
              <th scope="col" className="px-6 py-3 text-center">Aksi</th>
            </tr>
          </thead>
          <tbody>
            {purchases.map((po) => (
              <tr key={po.id} className="bg-white dark:bg-gray-800 border-b dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600">
                <td className="px-6 py-4 font-medium text-gray-900 dark:text-white">{po.id}</td>
                <td className="px-6 py-4">{po.vendorName}</td>
                <td className="px-6 py-4">{new Date(po.orderDate).toLocaleDateString()}</td>
                <td className="px-6 py-4">
                    <span className={`px-2 py-1 rounded-full text-xs font-semibold ${getStatusChip(po.status)}`}>
                        {po.status}
                    </span>
                </td>
                 <td className="px-6 py-4">
                  {po.status === 'Received' ? (
                    billedPurchaseIds.has(po.id) ? (
                      <span className="text-xs text-green-500 font-semibold">Sudah Ditagih</span>
                    ) : (
                      <button onClick={() => handleCreateBill(po.id)} className="text-xs text-white bg-blue-600 hover:bg-blue-700 px-2 py-1 rounded-md">
                        Buat Tagihan
                      </button>
                    )
                  ) : (
                    <span className="text-xs text-gray-500">N/A</span>
                  )}
                </td>
                <td className="px-6 py-4 font-semibold text-right">Rp{po.grandTotal.toLocaleString('id-ID')}</td>
                <td className="px-6 py-4 text-center">
                    <ActionsDropdown>
                        <DropdownItem onClick={() => handleViewDetails(po)}>Lihat Detail</DropdownItem>
                        {po.status === 'Pending' && (
                             <DropdownItem onClick={() => handleCancelPO(po.id)} className="text-red-500">Batalkan</DropdownItem>
                        )}
                    </ActionsDropdown>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <PurchaseOrderDetailsModal isOpen={isDetailsModalOpen} onClose={() => setDetailsModalOpen(false)} purchaseOrder={selectedPO} />
      <VendorBillModal isOpen={isBillModalOpen} onClose={handleCloseBillModal} bill={lastGeneratedVendorBill} />
    </div>
  );
};
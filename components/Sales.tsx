import React, { useState, useMemo, useRef } from 'react';
import { Sale, Product, Customer, PaymentMethod, PaymentTerm, SaleItem, Status, FulfillmentStatus, Vehicle } from '../types';
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

    if (!isOpen) return null;

    const handleAddItem = () => {
        setItems([...items, { productId: '', quantity: 1, price: 0 }]);
        setProductSearch([...productSearch, '']);
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
    return <SalesListPage />;
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
        <div className="p-8 h-full flex flex-col">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Data Penjualan</h1>
                <Button onClick={() => setCreateModalOpen(true)}>+ Buat Penjualan Manual</Button>
            </div>
            <div className="mb-4 bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <Input 
                        placeholder="Cari ID Faktur atau Nama Pelanggan..."
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                    />
                    <Select value={statusFilter} onChange={e => setStatusFilter(e.target.value as any)}>
                        <option value="all">Semua Status Bayar</option>
                        <option value="Paid">Paid</option>
                        <option value="Unpaid">Unpaid</option>
                        <option value="Cancelled">Cancelled</option>
                    </Select>
                     <Select value={channelFilter} onChange={e => setChannelFilter(e.target.value as any)}>
                        <option value="all">Semua Kanal</option>
                        <option value="E-commerce">E-commerce</option>
                        <option value="Manual">Manual</option>
                    </Select>
                </div>
            </div>
            <div className="flex-grow bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-y-auto">
                <table className="w-full text-sm text-left text-gray-500 dark:text-gray-400">
                    <thead className="text-xs text-gray-700 uppercase bg-gray-50 dark:bg-gray-700 dark:text-gray-400 sticky top-0">
                        <tr>
                            <th scope="col" className="px-6 py-3">ID Faktur</th>
                            <th scope="col" className="px-6 py-3">Tanggal</th>
                            <th scope="col" className="px-6 py-3">Pelanggan</th>
                            <th scope="col" className="px-6 py-3">Kanal</th>
                            <th scope="col" className="px-6 py-3">Status Bayar</th>
                            <th scope="col" className="px-6 py-3">Status Kirim</th>
                            {isTaxEnabled && <th scope="col" className="px-6 py-3 text-right">Pajak</th>}
                            <th scope="col" className="px-6 py-3 text-right">Total</th>
                            <th scope="col" className="px-6 py-3 text-center">Aksi</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredSales.map((sale) => (
                            <tr key={sale.id} className="bg-white dark:bg-gray-800 border-b dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600">
                                <td className="px-6 py-4 font-medium text-gray-900 dark:text-white">{sale.id}</td>
                                <td className="px-6 py-4">{new Date(sale.date).toLocaleDateString()}</td>
                                <td className="px-6 py-4">{sale.customerName}</td>
                                <td className="px-6 py-4">{sale.saleChannel || 'Manual'}</td>
                                <td className="px-6 py-4">
                                    <Badge variant={sale.status === 'Paid' ? 'success' : sale.status === 'Unpaid' ? 'warning' : 'danger'}>{sale.status}</Badge>
                                </td>
                                 <td className="px-6 py-4">
                                    <Badge variant={sale.fulfillmentStatus === 'Delivered' ? 'success' : 'info'}>{sale.fulfillmentStatus || 'N/A'}</Badge>
                                </td>
                                {isTaxEnabled && <td className="px-6 py-4 text-right">Rp{sale.taxAmount.toLocaleString('id-ID')}</td>}
                                <td className="px-6 py-4 font-semibold text-right">Rp{sale.grandTotal.toLocaleString('id-ID')}</td>
                                <td className="px-6 py-4 text-center">
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
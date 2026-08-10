import React, { useState, useMemo, useEffect } from 'react';
import { PurchaseOrder, Vendor, Product, PurchaseOrderItem } from '../types';
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
    const [destinationId, setDestinationId] = useState('');
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
    };

    return (
        <>
            <div className="p-8 h-full overflow-y-auto">
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-6">Buat Pembelian Baru</h1>
                <form onSubmit={handleSubmit} className="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-8 w-full max-w-5xl mx-auto space-y-6">
                    {/* Header Fields */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                         <div>
                            <label className="block text-sm font-medium">Vendor*</label>
                            <select value={vendorId} onChange={e => setVendorId(e.target.value)} required className="mt-1 w-full rounded-md bg-gray-100 dark:bg-gray-700 border-transparent focus:border-primary-500 px-3 py-2">
                                <option value="">Pilih vendor</option>
                                {vendors.map(v => <option key={v.id} value={v.id}>{v.name}</option>)}
                            </select>
                        </div>
                         <div>
                            <label className="block text-sm font-medium">Tujuan Barang*</label>
                            <select value={destinationId} onChange={e => setDestinationId(e.target.value)} required className="mt-1 w-full rounded-md bg-gray-100 dark:bg-gray-700 border-transparent focus:border-primary-500 px-3 py-2">
                                <option value="">Pilih Tujuan</option>
                                {warehouses.map(w => <option key={w.id} value={w.id}>{w.name}</option>)}
                            </select>
                        </div>
                    </div>
                     <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div>
                            <label className="block text-sm font-medium">No. Faktur (opsional)</label>
                            <input type="text" value={invoiceNumber} onChange={e => setInvoiceNumber(e.target.value)} className="mt-1 w-full rounded-md bg-gray-100 dark:bg-gray-700 border-transparent px-3 py-2"/>
                        </div>
                         <div>
                            <label className="block text-sm font-medium">No. Nota Vendor (opsional)</label>
                            <input type="text" value={vendorNoteNumber} onChange={e => setVendorNoteNumber(e.target.value)} className="mt-1 w-full rounded-md bg-gray-100 dark:bg-gray-700 border-transparent px-3 py-2"/>
                        </div>
                         <div>
                            <label className="block text-sm font-medium">Tanggal Pemesanan*</label>
                            <input type="date" value={orderDate} onChange={e => setOrderDate(e.target.value)} required className="mt-1 w-full rounded-md bg-gray-100 dark:bg-gray-700 border-transparent px-3 py-2"/>
                        </div>
                    </div>
                     <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label className="block text-sm font-medium">Perkiraan Tiba*</label>
                            <input type="date" value={expectedDelivery} onChange={e => setExpectedDelivery(e.target.value)} required className="mt-1 w-full rounded-md bg-gray-100 dark:bg-gray-700 border-transparent px-3 py-2"/>
                        </div>
                        <div>
                            <label className="block text-sm font-medium">Jatuh Tempo (opsional)</label>
                            <input type="date" value={dueDate} onChange={e => setDueDate(e.target.value)} className="mt-1 w-full rounded-md bg-gray-100 dark:bg-gray-700 border-transparent px-3 py-2"/>
                        </div>
                    </div>

                    {/* Items Section */}
                    <div className="border-t border-b dark:border-gray-700 py-4">
                        <h3 className="text-lg font-semibold mb-2">Item Pembelian</h3>
                        <div className="space-y-3 max-h-72 overflow-y-auto pr-2">
                            {items.map((item, index) => (
                                <div key={index} className="grid grid-cols-12 gap-2 items-center">
                                    <div className="col-span-4 relative">
                                        <Input
                                            type="text"
                                            value={productSearch[index]}
                                            onChange={e => { const newSearch = [...productSearch]; newSearch[index] = e.target.value; setProductSearch(newSearch); setActiveSuggestionBox(index); }}
                                            onFocus={() => setActiveSuggestionBox(index)}
                                            onBlur={() => setTimeout(() => setActiveSuggestionBox(null), 150)}
                                            placeholder="Nama Produk / Barcode"
                                            className="w-full"
                                        />
                                        {activeSuggestionBox === index && (
                                            <div className="absolute z-10 top-full left-0 w-full bg-white dark:bg-gray-700 border dark:border-gray-600 rounded-md shadow-lg max-h-48 overflow-y-auto">
                                                {productSuggestions.length > 0 ? productSuggestions.map(p => (
                                                    <div key={p.id} onMouseDown={() => handleProductSelect(index, p)} className="p-2 hover:bg-primary-100 cursor-pointer">{p.name}</div>
                                                )) : (
                                                    <div className="p-2 text-sm text-gray-500">
                                                        <p>Produk tidak ditemukan.</p>
                                                        <Button variant="secondary" size="sm" className="mt-1" onMouseDown={() => {setCreatingProductForIndex(index); setProductModalOpen(true);}}>
                                                            + Buat Produk Baru
                                                        </Button>
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                    <Input type="number" placeholder="Qty" value={item.quantity || ''} onChange={e => handleItemChange(index, 'quantity', parseInt(e.target.value))} required min="1" className="col-span-2 w-full text-center" />
                                    <Input type="number" placeholder="Harga Satuan" step="1" value={item.cost ?? ''} onChange={e => handleItemChange(index, 'cost', parseFloat(e.target.value))} required className="col-span-3 w-full" />
                                    <Input type="text" readOnly value={`Rp${((item.quantity || 0) * (item.cost || 0)).toLocaleString('id-ID')}`} className="col-span-2 w-full bg-gray-200 dark:bg-gray-800 border-transparent text-right" />
                                    <div className="col-span-1 text-center font-semibold">
                                        <button type="button" onClick={() => handleRemoveItem(index)} className="text-red-500 hover:text-red-700">×</button>
                                    </div>
                                </div>
                            ))}
                        </div>
                        <button type="button" onClick={handleAddItem} className="mt-3 text-sm text-primary-600 hover:text-primary-800 dark:text-primary-400 dark:hover:text-primary-200">
                            + Tambah Item
                        </button>
                    </div>

                    {/* Totals Section */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
                        <div>
                            <label className="block text-sm font-medium">Opsi Pajak</label>
                            <div className="mt-2 flex space-x-4">
                                <label><input type="radio" name="taxType" value="exclusive" checked={taxType === 'exclusive'} onChange={e => setTaxType(e.target.value as any)} className="mr-1"/> Exclusive</label>
                                <label><input type="radio" name="taxType" value="inclusive" checked={taxType === 'inclusive'} onChange={e => setTaxType(e.target.value as any)} className="mr-1"/> Inclusive</label>
                                 <label><input type="radio" name="taxType" value="none" checked={taxType === 'none'} onChange={e => setTaxType(e.target.value as any)} className="mr-1"/> Non-Pajak</label>
                            </div>
                        </div>
                        <div className="space-y-2 text-right">
                            <div className="flex justify-between"><span>Subtotal</span><span className="font-semibold">Rp {totals.subtotal.toLocaleString('id-ID')}</span></div>
                            <div className="flex justify-between"><span>Pajak ({(defaultTax?.rate || 0) * 100}%)</span><span className="font-semibold">Rp {totals.taxAmount.toLocaleString('id-ID')}</span></div>
                            <div className="flex justify-between text-xl font-bold border-t pt-2 dark:border-gray-600"><span>Grand Total</span><span>Rp {totals.grandTotal.toLocaleString('id-ID')}</span></div>
                        </div>
                    </div>

                    <div className="flex justify-end pt-4">
                        <button type="submit" className="px-8 py-3 rounded-md text-white bg-primary-600 hover:bg-primary-700 font-bold text-lg">Buat Pesanan Pembelian</button>
                    </div>
                </form>
            </div>
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
        </>
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
      <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-6">Data Pesanan Pembelian</h1>
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
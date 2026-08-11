import React, { useState, useMemo } from 'react';
import { 
    RotateCcw, Plus, Search, Filter, CheckCircle2, Clock, 
    AlertCircle, FileText, ArrowLeftRight, Trash2, Eye, Printer, Wallet, ArrowDownLeft, ArrowUpRight
} from 'lucide-react';
import { useAppContext } from '../hooks/useAppContext';
import { Sale, PurchaseOrder, Product, ReturnOrder, ReturnOrderItem } from '../types';
import { Modal, Button, Select, Input, Label, Badge, Table, Thead, Tbody, Tr, Th, Td } from './ui';

// --- Retur Item Form Entry ---
interface ItemReturnSelection {
    selected: boolean;
    productId: string;
    productName: string;
    originalQty: number;
    returnQty: number;
    price: number;
    condition: string;
}

// --- Modal Buat Retur Baru ---
const ReturnModal: React.FC<{
    isOpen: boolean;
    onClose: () => void;
    onSave: (data: Omit<ReturnOrder, 'id' | 'date' | 'status'>) => void;
}> = ({ isOpen, onClose, onSave }) => {
    const { state } = useAppContext();
    const { sales = [], purchases = [], warehouses = [], branches = [], vendors = [], accounts = [] } = state || {};

    const [returnType, setReturnType] = useState<'Sale' | 'Purchase'>('Sale');
    const [originalOrderId, setOriginalOrderId] = useState('');
    const [itemSelections, setItemSelections] = useState<ItemReturnSelection[]>([]);
    const [returnLocationId, setReturnLocationId] = useState('');
    const [targetVendorId, setTargetVendorId] = useState('');
    const [refundAccountId, setRefundAccountId] = useState('');
    const [reason, setReason] = useState('');

    // Filter cash/wallet accounts for refund
    const cashAccounts = useMemo(() => {
        return (accounts || []).filter(a => a.isCashAccount || a.type === 'Asset');
    }, [accounts]);

    const handleSelectOrder = (orderId: string) => {
        setOriginalOrderId(orderId);
        if (!orderId) {
            setItemSelections([]);
            setReturnLocationId('');
            setTargetVendorId('');
            return;
        }

        if (returnType === 'Sale') {
            const sale = sales.find(s => s.id === orderId);
            if (sale) {
                // Otomatis kembalikan ke stok toko asal cabang penjualan
                const autoBranchId = sale.branchId || (branches[0] && branches[0].id) || 'CAB-JPSTNH01';
                setReturnLocationId(autoBranchId);

                setItemSelections(sale.items.map(item => ({
                    selected: true,
                    productId: item.productId,
                    productName: item.productName,
                    originalQty: item.quantity,
                    returnQty: item.quantity,
                    price: item.price,
                    condition: 'Barang Rusak / Defect'
                })));
            }
        } else {
            const purchase = purchases.find(p => p.id === orderId);
            if (purchase) {
                // Default vendor dari transaksi pembelian, tapi bisa diubah pengguna
                setTargetVendorId(purchase.vendorId || '');
                const defaultLocation = (warehouses[0] && warehouses[0].id) || (branches[0] && branches[0].id) || '';
                setReturnLocationId(defaultLocation);

                setItemSelections(purchase.items.map(item => ({
                    selected: true,
                    productId: item.productId,
                    productName: item.productName,
                    originalQty: item.quantity,
                    returnQty: item.quantity,
                    price: item.cost,
                    condition: 'Barang Rusak / Defect'
                })));
            }
        }
    };

    const handleToggleItem = (productId: string, checked: boolean) => {
        setItemSelections(prev => prev.map(item => 
            item.productId === productId ? { ...item, selected: checked } : item
        ));
    };

    const handleUpdateQty = (productId: string, qty: number) => {
        setItemSelections(prev => prev.map(item => {
            if (item.productId === productId) {
                const validQty = Math.max(1, Math.min(qty, item.originalQty));
                return { ...item, returnQty: validQty };
            }
            return item;
        }));
    };

    const handleUpdateCondition = (productId: string, condition: string) => {
        setItemSelections(prev => prev.map(item => 
            item.productId === productId ? { ...item, condition } : item
        ));
    };

    const totalRefundAmount = useMemo(() => {
        return itemSelections
            .filter(item => item.selected)
            .reduce((sum, item) => sum + (item.returnQty * item.price), 0);
    }, [itemSelections]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const selectedItems = itemSelections.filter(item => item.selected);

        if (!originalOrderId) {
            alert("Harap pilih Transaksi Asli yang akan diretur.");
            return;
        }
        if (selectedItems.length === 0) {
            alert("Pilih minimal 1 item untuk diretur.");
            return;
        }
        if (!returnLocationId) {
            alert("Harap pilih Lokasi Pengembalian Stok.");
            return;
        }

        let customerOrVendorName = 'Pelanggan Umum';
        if (returnType === 'Sale') {
            const selectedOrder = sales.find(s => s.id === originalOrderId);
            customerOrVendorName = selectedOrder?.customerName || 'Pelanggan Umum';
        } else {
            const targetVendor = vendors.find(v => v.id === targetVendorId);
            const selectedOrder = purchases.find(p => p.id === originalOrderId);
            customerOrVendorName = targetVendor ? targetVendor.name : (selectedOrder?.vendorName || 'Vendor');
        }

        const returnItems: ReturnOrderItem[] = selectedItems.map(item => ({
            productId: item.productId,
            productName: item.productName,
            quantity: item.returnQty,
            originalQty: item.originalQty,
            price: item.price,
            condition: item.condition
        }));

        onSave({
            type: returnType,
            originalOrderId,
            customerOrVendorName,
            vendorId: returnType === 'Purchase' ? targetVendorId : undefined,
            items: returnItems,
            returnLocationId,
            refundAccountId,
            totalRefundAmount,
            reason
        });

        onClose();
    };

    const selectedBranchName = useMemo(() => {
        const branch = branches.find(b => b.id === returnLocationId);
        return branch ? branch.name : 'Toko Utama';
    }, [returnLocationId, branches]);

    const footer = (
        <div className="flex justify-between items-center w-full">
            <div className="text-left">
                <span className="text-xs text-slate-500 block">Total Estimasi Refund:</span>
                <span className="text-lg font-black text-rose-600 dark:text-rose-400 font-mono">
                    Rp{totalRefundAmount.toLocaleString('id-ID')}
                </span>
            </div>
            <div className="flex gap-2">
                <Button type="button" onClick={onClose} variant="secondary">Batal</Button>
                <Button onClick={handleSubmit}>Simpan Retur</Button>
            </div>
        </div>
    );

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title="Form Pengajuan Retur Baru"
            footer={footer}
            maxWidth="max-w-4xl"
        >
            <form onSubmit={handleSubmit} className="space-y-4">
                {/* Tipe & Invoice Reference */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <Label>Tipe Retur Transaksi</Label>
                        <Select 
                            value={returnType} 
                            onChange={e => {
                                setReturnType(e.target.value as any);
                                setOriginalOrderId('');
                                setItemSelections([]);
                                setReturnLocationId('');
                                setTargetVendorId('');
                            }}
                        >
                            <option value="Sale">Retur Penjualan (dari Pelanggan)</option>
                            <option value="Purchase">Retur Pembelian (ke Vendor)</option>
                        </Select>
                    </div>

                    <div>
                        <Label>Pilih Transaksi / Invoice Asli*</Label>
                        <Select value={originalOrderId} onChange={e => handleSelectOrder(e.target.value)} required>
                            <option value="">-- Pilih Invoice Transaksi --</option>
                            {returnType === 'Sale' ? (
                                sales.map(order => (
                                    <option key={order.id} value={order.id}>
                                        #{order.id} - {order.customerName} (Rp{order.grandTotal.toLocaleString('id-ID')})
                                    </option>
                                ))
                            ) : (
                                purchases.map(order => (
                                    <option key={order.id} value={order.id}>
                                        #{order.id} - {order.vendorName} (Rp{order.totalAmount.toLocaleString('id-ID')})
                                    </option>
                                ))
                            )}
                        </Select>
                    </div>
                </div>

                {/* Items Selection Table */}
                <div className="border border-slate-200 dark:border-zinc-700 rounded-xl p-3.5 bg-slate-50/50 dark:bg-zinc-800/40 space-y-3">
                    <div className="flex items-center justify-between">
                        <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-zinc-300 flex items-center gap-1.5">
                            <ArrowLeftRight className="w-4 h-4 text-primary-500" />
                            Item Transaksi yang Diretur
                        </h4>
                        <span className="text-xs text-slate-500">Centang & atur jumlah barang</span>
                    </div>

                    {itemSelections.length === 0 ? (
                        <div className="text-center py-6 text-xs text-slate-400 border border-dashed border-slate-200 dark:border-zinc-700 rounded-lg">
                            Silakan pilih Transaksi / Invoice di atas untuk memuat daftar item barang.
                        </div>
                    ) : (
                        <div className="max-h-56 overflow-y-auto space-y-2.5 pr-1">
                            {itemSelections.map(item => (
                                <div 
                                    key={item.productId} 
                                    className={`p-3 rounded-lg border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                                        item.selected 
                                            ? 'bg-white dark:bg-zinc-900 border-primary-300 dark:border-primary-800 shadow-2xs' 
                                            : 'bg-slate-100/60 dark:bg-zinc-800/60 border-slate-200 dark:border-zinc-700/60 opacity-60'
                                    }`}
                                >
                                    <div className="flex items-center gap-3">
                                        <input
                                            type="checkbox"
                                            checked={item.selected}
                                            onChange={e => handleToggleItem(item.productId, e.target.checked)}
                                            className="rounded text-primary-600 w-4 h-4 cursor-pointer shrink-0"
                                        />
                                        <div>
                                            <p className="font-bold text-sm text-slate-900 dark:text-white leading-tight">
                                                {item.productName}
                                            </p>
                                            <p className="text-xs text-slate-500 font-mono mt-0.5">
                                                Harga Satuan: Rp{item.price.toLocaleString('id-ID')} | Max Invoice: {item.originalQty} Pcs
                                            </p>
                                        </div>
                                    </div>

                                    {item.selected && (
                                        <div className="flex items-center gap-2 sm:self-center">
                                            <div className="w-24">
                                                <Label className="text-[10px] mb-0.5">Qty Retur</Label>
                                                <Input 
                                                    type="number" 
                                                    value={item.returnQty} 
                                                    onChange={e => handleUpdateQty(item.productId, Number(e.target.value))} 
                                                    min={1} 
                                                    max={item.originalQty} 
                                                />
                                            </div>

                                            <div className="w-40">
                                                <Label className="text-[10px] mb-0.5">Kondisi / Alasan</Label>
                                                <Select 
                                                    value={item.condition} 
                                                    onChange={e => handleUpdateCondition(item.productId, e.target.value)}
                                                    className="text-xs py-1.5"
                                                >
                                                    <option value="Barang Rusak / Defect">Barang Rusak / Defect</option>
                                                    <option value="Varian / Ukuran Salah">Varian / Ukuran Salah</option>
                                                    <option value="Kadaluwarsa / Expired">Kadaluwarsa / Expired</option>
                                                    <option value="Batal / Retur Dana">Batal / Retur Dana</option>
                                                </Select>
                                            </div>

                                            <div className="text-right min-w-24 shrink-0">
                                                <span className="text-[10px] text-slate-400 block">Subtotal Refund</span>
                                                <span className="text-xs font-bold font-mono text-rose-600 dark:text-rose-400">
                                                    Rp{(item.returnQty * item.price).toLocaleString('id-ID')}
                                                </span>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Specific Logic for Sale vs Purchase Return */}
                {returnType === 'Sale' ? (
                    <div className="space-y-4">
                        <div className="p-3.5 bg-emerald-50 dark:bg-emerald-950/40 rounded-xl border border-emerald-200 dark:border-emerald-900/60 space-y-1 text-xs">
                            <div className="flex items-center gap-2 text-emerald-900 dark:text-emerald-200 font-bold">
                                <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                                Stok barang retur otomatis dikembalikan ke Stok Toko ({selectedBranchName}).
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <Label>Pilih Dompet Sumber Refund (Pengembalian Dana)*</Label>
                                <Select value={refundAccountId} onChange={e => setRefundAccountId(e.target.value)}>
                                    <option value="">-- Tunai Kasir Default (1010) --</option>
                                    {cashAccounts.map(acc => (
                                        <option key={acc.id} value={acc.id}>
                                            {acc.name} ({acc.code}) - Saldo: Rp{acc.balance.toLocaleString('id-ID')}
                                        </option>
                                    ))}
                                </Select>
                            </div>

                            <div>
                                <Label>Catatan / Alasan Retur</Label>
                                <Input 
                                    type="text" 
                                    placeholder="Contoh: Barang cacat / varian tidak sesuai..." 
                                    value={reason} 
                                    onChange={e => setReason(e.target.value)} 
                                />
                            </div>
                        </div>
                    </div>
                ) : (
                    <div className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <Label>Vendor Tujuan Retur (Bisa Beda dari Pembelian)</Label>
                                <Select value={targetVendorId} onChange={e => setTargetVendorId(e.target.value)}>
                                    <option value="">-- Pilih Vendor Tujuan Retur --</option>
                                    {vendors.map(v => (
                                        <option key={v.id} value={v.id}>{v.name}</option>
                                    ))}
                                </Select>
                            </div>

                            <div>
                                <Label>Keluar dari Stok (Lokasi Fisik)*</Label>
                                <Select value={returnLocationId} onChange={e => setReturnLocationId(e.target.value)} required>
                                    <option value="">-- Pilih Gudang / Toko --</option>
                                    <optgroup label="Gudang Penyimpanan">
                                        {warehouses.map(w => <option key={w.id} value={w.id}>Gudang: {w.name}</option>)}
                                    </optgroup>
                                    <optgroup label="Cabang Toko">
                                        {branches.map(b => <option key={b.id} value={b.id}>Toko: {b.name}</option>)}
                                    </optgroup>
                                </Select>
                            </div>
                        </div>

                        <div className="p-3 bg-blue-50 dark:bg-blue-950/40 rounded-xl border border-blue-200 dark:border-blue-900/60 text-xs text-blue-900 dark:text-blue-200 font-medium">
                            🧾 <strong>Potong Hutang Usaha:</strong> Nilai retur pembelian ini akan otomatis mengurangi / memotong saldo tagihan hutang pembelian kepada Vendor.
                        </div>

                        <div>
                            <Label>Catatan / Alasan Retur Tambahan</Label>
                            <Input 
                                type="text" 
                                placeholder="Contoh: Barang cacat dari pabrik / kemasan penyok..." 
                                value={reason} 
                                onChange={e => setReason(e.target.value)} 
                            />
                        </div>
                    </div>
                )}
            </form>
        </Modal>
    );
};

// --- Modal Detail Retur ---
const ReturnDetailModal: React.FC<{
    isOpen: boolean;
    onClose: () => void;
    returnOrder: ReturnOrder | null;
}> = ({ isOpen, onClose, returnOrder }) => {
    if (!isOpen || !returnOrder) return null;

    const totalRefund = returnOrder.totalRefundAmount || returnOrder.items.reduce((s, i) => s + (i.price * i.quantity), 0);

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title={`Nota Retur #${returnOrder.id}`}
            footer={
                <div className="flex gap-2 justify-end">
                    <Button onClick={() => window.print()} variant="secondary">
                        <Printer className="w-4 h-4 mr-1.5" /> Cetak Nota Retur
                    </Button>
                    <Button onClick={onClose}>Tutup</Button>
                </div>
            }
            maxWidth="max-w-2xl"
        >
            <div className="space-y-4 text-xs">
                {/* Header Information */}
                <div className="p-4 bg-slate-50 dark:bg-zinc-800/60 rounded-xl border border-slate-200 dark:border-zinc-700 grid grid-cols-2 gap-4">
                    <div>
                        <span className="text-slate-400 block">No. Retur & Tanggal:</span>
                        <p className="font-bold text-slate-900 dark:text-white text-sm font-mono">{returnOrder.id}</p>
                        <p className="text-slate-500">{new Date(returnOrder.date).toLocaleString('id-ID')}</p>
                    </div>
                    <div>
                        <span className="text-slate-400 block">Tipe & Ref Transaksi:</span>
                        <p className="font-bold text-slate-900 dark:text-white text-sm">
                            {returnOrder.type === 'Sale' ? 'Retur Penjualan (Pelanggan)' : 'Retur Pembelian (Vendor)'}
                        </p>
                        <p className="font-mono text-slate-600 dark:text-slate-400">Ref: #{returnOrder.originalOrderId}</p>
                    </div>
                </div>

                {/* Items List Table */}
                <div className="border border-slate-200 dark:border-zinc-700 rounded-xl overflow-hidden">
                    <table className="w-full text-left">
                        <thead className="bg-slate-100 dark:bg-zinc-800 font-bold text-slate-700 dark:text-zinc-300 border-b dark:border-zinc-700">
                            <tr>
                                <th className="p-2.5">Nama Produk</th>
                                <th className="p-2.5 text-center">Qty Retur</th>
                                <th className="p-2.5">Kondisi</th>
                                <th className="p-2.5 text-right">Harga Unit</th>
                                <th className="p-2.5 text-right">Subtotal</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-200 dark:divide-zinc-800">
                            {returnOrder.items.map((item, idx) => (
                                <tr key={idx} className="hover:bg-slate-50 dark:hover:bg-zinc-800/50">
                                    <td className="p-2.5 font-semibold">{item.productName}</td>
                                    <td className="p-2.5 text-center font-bold font-mono">{item.quantity}</td>
                                    <td className="p-2.5 text-slate-500">{item.condition || 'Biasa'}</td>
                                    <td className="p-2.5 text-right font-mono">Rp{item.price.toLocaleString('id-ID')}</td>
                                    <td className="p-2.5 text-right font-mono font-bold text-rose-600 dark:text-rose-400">
                                        Rp{(item.quantity * item.price).toLocaleString('id-ID')}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                        <tfoot className="bg-slate-50 dark:bg-zinc-800/80 font-bold border-t dark:border-zinc-700">
                            <tr>
                                <td colSpan={4} className="p-2.5 text-right">Total Dana Retur / Refund:</td>
                                <td className="p-2.5 text-right font-mono text-sm text-rose-600 dark:text-rose-400">
                                    Rp{totalRefund.toLocaleString('id-ID')}
                                </td>
                            </tr>
                        </tfoot>
                    </table>
                </div>

                {returnOrder.reason && (
                    <div className="p-3 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/60 rounded-xl text-amber-900 dark:text-amber-200">
                        <span className="font-bold block mb-0.5">Catatan / Alasan Retur:</span>
                        <p>{returnOrder.reason}</p>
                    </div>
                )}
            </div>
        </Modal>
    );
};

// --- Main Page Component ---
export const ReturnManagementPage: React.FC = () => {
    const { state, dispatch } = useAppContext();
    const { returnOrders = [] } = state || {};

    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [viewingReturn, setViewingReturn] = useState<ReturnOrder | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [typeFilter, setTypeFilter] = useState<'All' | 'Sale' | 'Purchase'>('All');
    const [statusFilter, setStatusFilter] = useState<'All' | 'Pending' | 'Completed'>('All');

    const handleSaveReturn = (data: Omit<ReturnOrder, 'id' | 'date' | 'status'>) => {
        dispatch({ type: 'returns/create', payload: data });
    };

    const handleProcessReturn = (returnId: string) => {
        if (window.confirm("Proses retur ini sekarang? Stok fisik akan disesuaikan dan pengembalian dana dicatat.")) {
            dispatch({ type: 'returns/process', payload: { returnId } });
        }
    };

    const handleDeleteReturn = (returnId: string) => {
        if (window.confirm("Hapus pengajuan retur ini?")) {
            dispatch({ type: 'returns/delete', payload: returnId });
        }
    };

    // Calculated metrics
    const totalReturnCount = returnOrders.length;
    const saleReturnCount = returnOrders.filter(r => r.type === 'Sale').length;
    const purchaseReturnCount = returnOrders.filter(r => r.type === 'Purchase').length;
    const pendingCount = returnOrders.filter(r => r.status === 'Pending').length;

    const filteredReturns = useMemo(() => {
        return returnOrders.filter(ro => {
            const matchesSearch = (ro.id || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                                  (ro.originalOrderId || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                                  (ro.customerOrVendorName || '').toLowerCase().includes(searchTerm.toLowerCase());
            
            const matchesType = typeFilter === 'All' || ro.type === typeFilter;
            const matchesStatus = statusFilter === 'All' || ro.status === statusFilter;

            return matchesSearch && matchesType && matchesStatus;
        });
    }, [returnOrders, searchTerm, typeFilter, statusFilter]);

    return (
        <div className="w-full h-full flex flex-col p-4 md:p-6 space-y-3 overflow-hidden">
            {/* Header Bar */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 shrink-0">
                <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-xl bg-primary-50 dark:bg-primary-950/60 text-primary-600 dark:text-primary-400 flex items-center justify-center shrink-0">
                        <RotateCcw className="w-5 h-5" />
                    </div>
                    <div>
                        <h1 className="text-lg font-black text-slate-900 dark:text-white leading-tight">
                            Manajemen Retur Transaksi
                        </h1>
                        <p className="text-xs text-slate-500 dark:text-zinc-400">
                            Kelola retur penjualan & pembelian supplier secara otomatis.
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-2 self-end sm:self-center">
                    {/* Compact Stat Badges */}
                    <div className="hidden md:flex items-center gap-1.5 text-xs">
                        <div className="px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-zinc-800 text-slate-700 dark:text-zinc-300 font-bold font-mono">
                            Total: {totalReturnCount}
                        </div>
                        <div className="px-2.5 py-1 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 font-bold font-mono">
                            Jual: {saleReturnCount}
                        </div>
                        <div className="px-2.5 py-1 rounded-lg bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 font-bold font-mono">
                            Beli: {purchaseReturnCount}
                        </div>
                        <div className="px-2.5 py-1 rounded-lg bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 font-bold font-mono">
                            Pending: {pendingCount}
                        </div>
                    </div>

                    <Button onClick={() => setIsCreateModalOpen(true)} className="gap-1.5 text-xs py-2 shadow-xs shrink-0 whitespace-nowrap">
                        <Plus className="w-4 h-4" /> Buat Retur Baru
                    </Button>
                </div>
            </div>

            {/* Filter & Search Controls Bar */}
            <div className="bg-white dark:bg-zinc-900 p-2.5 rounded-xl border border-slate-200/80 dark:border-zinc-800 shadow-2xs flex flex-wrap items-center justify-between gap-2.5 shrink-0">
                <div className="flex-1 min-w-[200px]">
                    <Input
                        type="text"
                        placeholder="Cari ID Retur, Invoice, atau Nama Pelanggan / Supplier..."
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                        className="text-xs py-1.5"
                    />
                </div>

                <div className="flex items-center gap-2">
                    <Select value={typeFilter} onChange={e => setTypeFilter(e.target.value as any)} className="w-36 sm:w-40 text-xs py-1.5">
                        <option value="All">Semua Tipe Retur</option>
                        <option value="Sale">Retur Penjualan</option>
                        <option value="Purchase">Retur Pembelian</option>
                    </Select>
                    <Select value={statusFilter} onChange={e => setStatusFilter(e.target.value as any)} className="w-32 sm:w-36 text-xs py-1.5">
                        <option value="All">Semua Status</option>
                        <option value="Pending">Pending</option>
                        <option value="Completed">Selesai</option>
                    </Select>
                </div>
            </div>

            {/* Table Area */}
            <div className="flex-1 min-h-0 bg-white dark:bg-zinc-900 rounded-xl border border-slate-200/80 dark:border-zinc-800 shadow-2xs overflow-hidden flex flex-col">
                <div className="overflow-x-auto flex-1">
                    <Table>
                        <Thead>
                            <Tr>
                                <Th>Tanggal</Th>
                                <Th>No. Retur</Th>
                                <Th>Tipe Retur</Th>
                                <Th>Ref. Invoice</Th>
                                <Th>Pelanggan / Supplier</Th>
                                <Th className="text-right">Total Refund</Th>
                                <Th className="text-center">Status</Th>
                                <Th className="text-right">Aksi</Th>
                            </Tr>
                        </Thead>
                        <Tbody>
                            {filteredReturns.length === 0 ? (
                                <Tr>
                                    <Td colSpan={8} className="text-center py-12 text-slate-400">
                                        Tidak ada data retur yang ditemukan.
                                    </Td>
                                </Tr>
                            ) : (
                                filteredReturns.map(ro => {
                                    const totalRefund = ro.totalRefundAmount || ro.items.reduce((s, i) => s + (i.price * i.quantity), 0);
                                    return (
                                        <Tr key={ro.id}>
                                            <Td className="font-mono text-xs text-slate-500">
                                                {new Date(ro.date).toLocaleDateString('id-ID')}
                                            </Td>
                                            <Td className="font-extrabold font-mono text-xs text-slate-900 dark:text-white">
                                                {ro.id}
                                            </Td>
                                            <Td>
                                                <span className={`inline-flex items-center text-xs font-semibold px-2 py-0.5 rounded-md ${
                                                    ro.type === 'Sale' 
                                                        ? 'bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300' 
                                                        : 'bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300'
                                                }`}>
                                                    {ro.type === 'Sale' ? 'Penjualan' : 'Pembelian'}
                                                </span>
                                            </Td>
                                            <Td className="font-mono text-xs text-slate-600 dark:text-slate-400">
                                                #{ro.originalOrderId}
                                            </Td>
                                            <Td className="font-medium text-xs text-slate-800 dark:text-zinc-200">
                                                {ro.customerOrVendorName || '-'}
                                            </Td>
                                            <Td className="text-right font-black font-mono text-sm text-rose-600 dark:text-rose-400">
                                                Rp{totalRefund.toLocaleString('id-ID')}
                                            </Td>
                                            <Td className="text-center">
                                                <Badge variant={ro.status === 'Completed' ? 'success' : 'warning'}>
                                                    {ro.status === 'Completed' ? 'Selesai' : 'Pending'}
                                                </Badge>
                                            </Td>
                                            <Td className="text-right">
                                                <div className="flex items-center justify-end gap-1.5">
                                                    <button
                                                        type="button"
                                                        onClick={() => setViewingReturn(ro)}
                                                        className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950/40 rounded-lg transition-colors cursor-pointer"
                                                        title="Lihat Detail Nota Retur"
                                                    >
                                                        <Eye className="w-4 h-4" />
                                                    </button>
                                                    {ro.status === 'Pending' && (
                                                        <button
                                                            type="button"
                                                            onClick={() => handleProcessReturn(ro.id)}
                                                            className="px-2.5 py-1 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 dark:bg-emerald-950/60 dark:text-emerald-300 rounded-lg text-xs font-bold transition-all cursor-pointer"
                                                        >
                                                            Proses Retur
                                                        </button>
                                                    )}
                                                    <button
                                                        type="button"
                                                        onClick={() => handleDeleteReturn(ro.id)}
                                                        className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg transition-colors cursor-pointer"
                                                        title="Hapus Pengajuan"
                                                    >
                                                        <Trash2 className="w-4 h-4" />
                                                    </button>
                                                </div>
                                            </Td>
                                        </Tr>
                                    );
                                })
                            )}
                        </Tbody>
                    </Table>
                </div>
            </div>

            {/* Modals */}
            <ReturnModal 
                isOpen={isCreateModalOpen} 
                onClose={() => setIsCreateModalOpen(false)} 
                onSave={handleSaveReturn} 
            />

            <ReturnDetailModal 
                isOpen={!!viewingReturn} 
                onClose={() => setViewingReturn(null)} 
                returnOrder={viewingReturn} 
            />
        </div>
    );
};
import React, { useState, useMemo } from 'react';
import { useAppContext } from '../hooks/useAppContext';
import { Sale, PurchaseOrder, Product, ReturnOrder, ReturnOrderItem } from '../types';
import { Modal, Button, Select, Input } from './ui';

const ReturnModal: React.FC<{
    isOpen: boolean;
    onClose: () => void;
    onSave: (data: Omit<ReturnOrder, 'id' | 'date' | 'status'>) => void;
}> = ({ isOpen, onClose, onSave }) => {
    const { state } = useAppContext();
    const { sales, purchases, products, warehouses, branches } = state;

    const [returnType, setReturnType] = useState<'Sale' | 'Purchase'>('Sale');
    const [originalOrderId, setOriginalOrderId] = useState('');
    const [items, setItems] = useState<ReturnOrderItem[]>([]);
    const [returnLocationId, setReturnLocationId] = useState('');
    const [reason, setReason] = useState('');

    const originalOrder = useMemo(() => {
        if (!originalOrderId) return null;
        return returnType === 'Sale' 
            ? sales.find(s => s.id === originalOrderId)
            : purchases.find(p => p.id === originalOrderId);
    }, [originalOrderId, returnType, sales, purchases]);

    const handleSelectOrder = (orderId: string) => {
        setOriginalOrderId(orderId);
        const order = returnType === 'Sale' 
            ? sales.find(s => s.id === orderId)
            : purchases.find(p => p.id === orderId);
        
        if (order) {
            const returnItems = order.items.map(item => ({
                productId: item.productId,
                productName: item.productName,
                quantity: item.quantity,
                price: returnType === 'Sale' ? item.price : item.cost,
            }));
            setItems(returnItems);
        } else {
            setItems([]);
        }
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!originalOrderId || items.length === 0 || !returnLocationId) {
            alert("Harap lengkapi semua field.");
            return;
        }
        onSave({ type: returnType, originalOrderId, items, returnLocationId, reason });
        onClose();
    };

    const footer = (
        <>
            <button type="button" onClick={onClose} className="px-6 py-2 rounded-md bg-gray-200 dark:bg-gray-600">Batal</button>
            <Button onClick={handleSubmit} type="submit">Buat Retur</Button>
        </>
    );

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title="Buat Retur Baru"
            footer={footer}
            maxWidth="max-w-3xl"
        >
            <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium">Tipe Retur</label>
                        <Select value={returnType} onChange={e => setReturnType(e.target.value as any)}>
                            <option value="Sale">Retur Penjualan (dari Pelanggan)</option>
                            <option value="Purchase">Retur Pembelian (ke Vendor)</option>
                        </Select>
                    </div>
                     <div>
                        <label className="block text-sm font-medium">ID Transaksi Asli</label>
                        <Select value={originalOrderId} onChange={e => handleSelectOrder(e.target.value)}>
                            <option value="">-- Pilih Transaksi --</option>
                            {(returnType === 'Sale' ? sales : purchases).map(order => (
                                <option key={order.id} value={order.id}>#{order.id} - {returnType === 'Sale' ? order.customerName : order.vendorName}</option>
                            ))}
                        </Select>
                    </div>
                </div>

                <div className="border rounded-lg p-4 h-48 overflow-y-auto space-y-2 dark:border-gray-600">
                    <h3 className="font-semibold">Item yang Diretur</h3>
                    {items.length > 0 ? items.map(item => (
                        <div key={item.productId} className="flex justify-between items-center text-sm">
                            <span>{item.productName}</span>
                            <span>Qty: {item.quantity}</span>
                        </div>
                    )) : <p className="text-sm text-gray-500">Pilih transaksi untuk melihat item.</p>}
                </div>
                
                 <div>
                    <label className="block text-sm font-medium">Kembalikan Stok Ke</label>
                    <Select value={returnLocationId} onChange={e => setReturnLocationId(e.target.value)}>
                        <option value="">-- Pilih Lokasi --</option>
                        {warehouses.map(w => <option key={w.id} value={w.id}>Gudang: {w.name}</option>)}
                        {branches.map(b => <option key={b.id} value={b.id}>Toko: {b.name}</option>)}
                    </Select>
                </div>
                <div>
                    <label className="block text-sm font-medium">Alasan Retur (Opsional)</label>
                    <Input type="text" value={reason} onChange={e => setReason(e.target.value)} />
                </div>
            </form>
        </Modal>
    );
};

export const ReturnManagementPage: React.FC = () => {
    const { state, dispatch } = useAppContext();
    const { returnOrders } = state;
    const [isModalOpen, setIsModalOpen] = useState(false);

    const handleSaveReturn = (data: Omit<ReturnOrder, 'id' | 'date' | 'status'>) => {
        dispatch({ type: 'returns/create', payload: data });
    };

    const handleProcessReturn = (returnId: string) => {
        if (window.confirm("Anda yakin ingin memproses retur ini? Stok dan data keuangan akan disesuaikan.")) {
            dispatch({ type: 'returns/process', payload: { returnId } });
        }
    };

    return (
        <div className="p-8 h-full flex flex-col">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Manajemen Retur</h1>
                <Button onClick={() => setIsModalOpen(true)}>Buat Retur</Button>
            </div>
            <div className="flex-grow bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-y-auto">
                <table className="w-full text-sm text-left text-gray-500 dark:text-gray-400">
                     <thead className="text-xs text-gray-700 uppercase bg-gray-50 dark:bg-gray-700 dark:text-gray-400 sticky top-0">
                        <tr>
                            <th className="px-6 py-3">Tanggal</th>
                            <th className="px-6 py-3">Tipe</th>
                            <th className="px-6 py-3">Ref. Transaksi</th>
                            <th className="px-6 py-3">Status</th>
                            <th className="px-6 py-3 text-center">Aksi</th>
                        </tr>
                    </thead>
                    <tbody>
                        {returnOrders.map(ro => (
                            <tr key={ro.id} className="border-b dark:border-gray-700">
                                <td className="px-6 py-4">{new Date(ro.date).toLocaleDateString('id-ID')}</td>
                                <td className="px-6 py-4 font-medium">{ro.type === 'Sale' ? 'Penjualan' : 'Pembelian'}</td>
                                <td className="px-6 py-4">#{ro.originalOrderId}</td>
                                <td className="px-6 py-4">{ro.status}</td>
                                <td className="px-6 py-4 text-center">
                                    {ro.status === 'Pending' && (
                                        <button onClick={() => handleProcessReturn(ro.id)} className="font-medium text-primary-600 hover:underline">
                                            Proses Retur
                                        </button>
                                    )}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
            <ReturnModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} onSave={handleSaveReturn} />
        </div>
    );
};
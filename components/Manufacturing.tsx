// This is a new file: components/Manufacturing.tsx
import React, { useState, useMemo } from 'react';
import { useAppContext } from '../hooks/useAppContext';
import { ManufacturingOrder, BillOfMaterial, WorkCenter } from '../types';
import { Button, Modal, Select, Input, Label } from './ui';

const ManufacturingOrderModal: React.FC<{
    isOpen: boolean;
    onClose: () => void;
    onSave: (data: Omit<ManufacturingOrder, 'id' | 'status'>) => void;
}> = ({ isOpen, onClose, onSave }) => {
    const { state } = useAppContext();
    const [productId, setProductId] = useState('');
    const [quantity, setQuantity] = useState('');
    const [dueDate, setDueDate] = useState('');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSave({
            productId,
            quantity: parseInt(quantity),
            dueDate: new Date(dueDate).toISOString(),
        });
        onClose();
    };
    
    const footer = (
        <>
            <button type="button" onClick={onClose} className="px-4 py-2 rounded-md bg-gray-200 dark:bg-gray-600">Batal</button>
            <Button type="submit" onClick={handleSubmit}>Buat Perintah Kerja</Button>
        </>
    );

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Buat Perintah Kerja Baru" footer={footer}>
            <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                    <Label htmlFor="product">Produk yang akan Diproduksi</Label>
                    <Select id="product" value={productId} onChange={e => setProductId(e.target.value)} required>
                        <option value="">-- Pilih Produk --</option>
                        {state.products.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                    </Select>
                </div>
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <Label htmlFor="quantity">Kuantitas</Label>
                        <Input id="quantity" type="number" value={quantity} onChange={e => setQuantity(e.target.value)} required />
                    </div>
                    <div>
                        <Label htmlFor="dueDate">Tanggal Selesai</Label>
                        <Input id="dueDate" type="date" value={dueDate} onChange={e => setDueDate(e.target.value)} required />
                    </div>
                </div>
            </form>
        </Modal>
    );
};


export const ManufacturingOrderListPage: React.FC = () => {
    const { state, dispatch } = useAppContext();
    const { manufacturingOrders, products } = state;
    const [isModalOpen, setModalOpen] = useState(false);

    const handleSaveOrder = (data: Omit<ManufacturingOrder, 'id' | 'status'>) => {
        dispatch({ type: 'modules/mfg/addOrder', payload: data });
    };

    const productMap = new Map(products.map(p => [p.id, p.name]));

    return (
        <div className="p-8 h-full flex flex-col">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Perintah Kerja Manufaktur</h1>
                <Button onClick={() => setModalOpen(true)}>Buat Perintah Kerja</Button>
            </div>
            <div className="flex-grow bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-y-auto">
                 <table className="w-full text-sm text-left text-gray-500 dark:text-gray-400">
                    <thead className="text-xs text-gray-700 uppercase bg-gray-50 dark:bg-gray-700 dark:text-gray-400">
                        <tr>
                            <th className="px-6 py-3">Produk</th>
                            <th className="px-6 py-3">Kuantitas</th>
                            <th className="px-6 py-3">Tanggal Selesai</th>
                            <th className="px-6 py-3">Status</th>
                        </tr>
                    </thead>
                    <tbody>
                        {manufacturingOrders.map(order => (
                            <tr key={order.id} className="border-b dark:border-gray-700">
                                <td className="px-6 py-4 font-medium">{productMap.get(order.productId) || 'Produk Tidak Ditemukan'}</td>
                                <td className="px-6 py-4">{order.quantity}</td>
                                <td className="px-6 py-4">{new Date(order.dueDate).toLocaleDateString('id-ID')}</td>
                                <td className="px-6 py-4">{order.status}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
            <ManufacturingOrderModal isOpen={isModalOpen} onClose={() => setModalOpen(false)} onSave={handleSaveOrder} />
        </div>
    );
};


export const BillOfMaterialsPage: React.FC = () => {
     const { state } = useAppContext();
    const { boms, products } = state;

    const productMap = useMemo(() => new Map(products.map(p => [p.id, p.name])), [products]);

    return (
        <div className="p-8 h-full flex flex-col">
             <div className="flex justify-between items-center mb-6">
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Bill of Materials (BOM)</h1>
                <Button>Buat BOM Baru</Button>
            </div>
             <div className="flex-grow space-y-4 overflow-y-auto">
                {boms.map(bom => (
                    <div key={bom.id} className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow">
                        <h2 className="text-lg font-bold">BOM untuk: {productMap.get(bom.productId) || 'Unknown Product'}</h2>
                        <ul className="list-disc ml-6 mt-2 text-sm">
                            {bom.items.map(item => (
                                <li key={item.materialId}>
                                    {productMap.get(item.materialId) || 'Unknown Material'}: {item.quantity} unit
                                </li>
                            ))}
                        </ul>
                    </div>
                ))}
            </div>
        </div>
    );
};

export const WorkCentersPage: React.FC = () => {
    const { state } = useAppContext();
    const { workCenters } = state;
    return (
         <div className="p-8 h-full flex flex-col">
             <div className="flex justify-between items-center mb-6">
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Pusat Kerja (Work Centers)</h1>
                <Button>Tambah Pusat Kerja</Button>
            </div>
             <div className="flex-grow bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-y-auto">
                <table className="w-full text-sm text-left text-gray-500 dark:text-gray-400">
                    <thead className="text-xs text-gray-700 uppercase bg-gray-50 dark:bg-gray-700 dark:text-gray-400">
                        <tr>
                            <th className="px-6 py-3">Nama</th>
                            <th className="px-6 py-3">Deskripsi</th>
                            <th className="px-6 py-3">Kapasitas (unit/jam)</th>
                        </tr>
                    </thead>
                    <tbody>
                        {workCenters.map(wc => (
                            <tr key={wc.id} className="border-b dark:border-gray-700">
                                <td className="px-6 py-4 font-medium">{wc.name}</td>
                                <td className="px-6 py-4">{wc.description}</td>
                                <td className="px-6 py-4">{wc.capacity}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
             </div>
        </div>
    );
};

export const ManufacturingSettingsPage: React.FC = () => (
    <div className="p-8">
        <h1 className="text-3xl font-bold">Pengaturan Manufaktur</h1>
        <p className="mt-4">Tidak ada pengaturan yang dapat dikonfigurasi saat ini.</p>
    </div>
);

// This is a new file: components/Room.tsx
import React, { useState, useMemo, useEffect } from 'react';
import { useAppContext } from '../hooks/useAppContext';
import { Room, RoomOrder, Account } from '../types';
import { Button, Modal, Input, Label, Select } from './ui';

const RoomModal: React.FC<{
    isOpen: boolean;
    onClose: () => void;
    onSave: (asset: Omit<Room, 'id' | 'assetId'> & { purchaseDate: string, value: number }) => void;
}> = ({ isOpen, onClose, onSave }) => {
    const { state } = useAppContext();
    const [name, setName] = useState('');
    const [type, setType] = useState('');
    const [dailyRate, setDailyRate] = useState('');
    const [branchId, setBranchId] = useState('');
    const [purchaseDate, setPurchaseDate] = useState(new Date().toISOString().split('T')[0]);
    const [value, setValue] = useState('');

    useEffect(() => {
        if (isOpen) {
            setName('');
            setType('');
            setDailyRate('');
            setBranchId('');
            setPurchaseDate(new Date().toISOString().split('T')[0]);
            setValue('');
        }
    }, [isOpen]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSave({ name, type, dailyRate: parseFloat(dailyRate), status: 'Available', branchId, purchaseDate, value: parseFloat(value) });
        onClose();
    };

    const footer = <Button onClick={handleSubmit}>Simpan Aset</Button>;

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Tambah Aset Kamar" footer={footer}>
            <form className="space-y-4" onSubmit={handleSubmit}>
                <Input value={name} onChange={e => setName(e.target.value)} placeholder="Nama/Nomor Kamar" required />
                <Input value={type} onChange={e => setType(e.target.value)} placeholder="Tipe Kamar (e.g., VIP, Kelas I)" required />
                <Input type="number" value={dailyRate} onChange={e => setDailyRate(e.target.value)} placeholder="Tarif Harian (Rp)" required />
                 <Select value={branchId} onChange={e => setBranchId(e.target.value)} required>
                    <option value="">-- Pilih Cabang --</option>
                    {state.branches.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                </Select>
                <div className="grid grid-cols-2 gap-4 pt-4 border-t dark:border-gray-600">
                     <div>
                        <Label>Tanggal Perolehan</Label>
                        <Input type="date" value={purchaseDate} onChange={e => setPurchaseDate(e.target.value)} required/>
                     </div>
                     <div>
                        <Label>Nilai Aset (Rp)</Label>
                        <Input type="number" value={value} onChange={e => setValue(e.target.value)} required/>
                     </div>
                </div>
            </form>
        </Modal>
    );
};

export const RoomAssetListPage: React.FC = () => {
    const { state, dispatch } = useAppContext();
    const { rooms, branches } = state;
    const [isModalOpen, setModalOpen] = useState(false);

    const branchMap = useMemo(() => new Map(branches.map(b => [b.id, b.name])), [branches]);

    const handleSave = (asset: Omit<Room, 'id' | 'assetId'> & { purchaseDate: string, value: number }) => {
        dispatch({ type: 'modules/room/addAsset', payload: asset });
    };

    return (
        <div className="p-8 h-full flex flex-col">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-3xl font-bold">Aset Kamar</h1>
                <Button onClick={() => setModalOpen(true)}>Tambah Aset</Button>
            </div>
            <div className="flex-grow bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-y-auto">
                <table className="w-full text-sm">
                    <thead><tr><th className="p-4 text-left">Nama</th><th className="p-4 text-left">Tipe</th><th className="p-4 text-left">Cabang</th><th className="p-4 text-left">Tarif Harian</th><th className="p-4 text-left">Status</th></tr></thead>
                    <tbody>
                        {rooms.map(asset => (
                            <tr key={asset.id} className="border-t dark:border-gray-700">
                                <td className="p-4 font-medium">{asset.name}</td>
                                <td className="p-4">{asset.type}</td>
                                <td className="p-4">{branchMap.get(asset.branchId) || 'N/A'}</td>
                                <td className="p-4">Rp{asset.dailyRate.toLocaleString('id-ID')}</td>
                                <td className="p-4">{asset.status}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
            <RoomModal isOpen={isModalOpen} onClose={() => setModalOpen(false)} onSave={handleSave} />
        </div>
    );
};

export const RoomOrderListPage: React.FC = () => {
    const { state } = useAppContext();
    const { roomOrders, customers, rooms } = state;

    const customerMap = new Map(customers.map(c => [c.id, c.name]));
    const assetMap = new Map(rooms.map(a => [a.id, a.name]));

    return (
        <div className="p-8 h-full flex flex-col">
            <h1 className="text-3xl font-bold mb-6">Pesanan Kamar</h1>
            <div className="flex-grow bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-y-auto">
                 <table className="w-full text-sm">
                    <thead><tr><th className="p-4 text-left">Pelanggan</th><th className="p-4 text-left">Kamar</th><th className="p-4 text-left">Total</th><th className="p-4 text-left">Status</th></tr></thead>
                    <tbody>
                        {roomOrders.map(order => (
                            <tr key={order.id} className="border-t dark:border-gray-700">
                                <td className="p-4 font-medium">{customerMap.get(order.customerId)}</td>
                                <td className="p-4">{assetMap.get(order.roomId)}</td>
                                <td className="p-4">Rp{order.totalPrice.toLocaleString('id-ID')}</td>
                                <td className="p-4">{order.status}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export const CreateRoomOrderPage: React.FC = () => {
    const { state, dispatch } = useAppContext();
    const { customers, rooms, accounts, branches } = state;
    
    const [branchId, setBranchId] = useState('');
    const [customerId, setCustomerId] = useState('');
    const [roomId, setRoomId] = useState('');
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [paymentAccountId, setPaymentAccountId] = useState('');

    const cashAccounts = useMemo(() => accounts.filter(a => a.isCashAccount), [accounts]);
    const availableAssets = useMemo(() => {
        if (!branchId) return [];
        return rooms.filter(a => a.status === 'Available' && a.branchId === branchId);
    }, [rooms, branchId]);

    useEffect(() => {
      setRoomId('');
    }, [branchId]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const room = rooms.find(a => a.id === roomId);
        if (!room) return;

        const start = new Date(startDate);
        const end = new Date(endDate);
        const days = Math.ceil((end.getTime() - start.getTime()) / (1000 * 3600 * 24));
        const totalPrice = days * room.dailyRate;

        const orderData: Omit<RoomOrder, 'id' | 'status'> = {
            customerId, roomId, startDate, endDate, totalPrice
        };
        dispatch({ type: 'modules/room/addOrder', payload: { orderData, paymentAccountId } });
        alert('Pesanan kamar berhasil dibuat dan tagihan telah dibuat!');
    };

    return (
        <div className="p-8">
            <h1 className="text-3xl font-bold mb-6">Buat Pesanan Kamar</h1>
            <form onSubmit={handleSubmit} className="max-w-lg mx-auto bg-white dark:bg-gray-800 p-6 rounded-lg shadow space-y-4">
                 <Select value={branchId} onChange={e => setBranchId(e.target.value)} required>
                    <option value="">-- Pilih Cabang/Gedung --</option>
                    {branches.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                </Select>
                <Select value={customerId} onChange={e => setCustomerId(e.target.value)} required>
                    <option value="">-- Pilih Pelanggan --</option>
                    {customers.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </Select>
                 <Select value={roomId} onChange={e => setRoomId(e.target.value)} required disabled={!branchId}>
                    <option value="">-- Pilih Kamar --</option>
                    {availableAssets.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
                </Select>
                <div className="grid grid-cols-2 gap-4">
                    <Input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} required/>
                    <Input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} required/>
                </div>
                 <Select value={paymentAccountId} onChange={e => setPaymentAccountId(e.target.value)} required>
                    <option value="">-- Pilih Tujuan Pembayaran --</option>
                    {cashAccounts.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </Select>
                <Button type="submit" className="w-full">Buat Pesanan</Button>
            </form>
        </div>
    );
};
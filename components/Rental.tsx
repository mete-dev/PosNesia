// This is a new file: components/Rental.tsx
import React, { useState, useMemo, useEffect } from 'react';
import { useAppContext } from '../hooks/useAppContext';
import { Vehicle, RentalOrder, Account } from '../types';
import { Button, Modal, Input, Label, Select } from './ui';
import { VehicleListPage } from './Fleet'; // Re-use the list page

export const RentalAssetListPage: React.FC = () => {
    // We can re-use the component from Fleet management as it's essentially the same asset list.
    return <VehicleListPage />;
};

export const RentalOrderListPage: React.FC = () => {
    const { state } = useAppContext();
    const { rentalOrders, customers, vehicles } = state;

    const customerMap = new Map(customers.map(c => [c.id, c.name]));
    const assetMap = new Map(vehicles.map(a => [a.id, a.name]));

    return (
        <div className="p-8 h-full flex flex-col">
            <h1 className="text-3xl font-bold mb-6">Pesanan Rental</h1>
            <div className="flex-grow bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-y-auto">
                 <table className="w-full text-sm">
                    <thead><tr><th className="p-4 text-left">Pelanggan</th><th className="p-4 text-left">Armada</th><th className="p-4 text-left">Total</th><th className="p-4 text-left">Status</th></tr></thead>
                    <tbody>
                        {rentalOrders.map(order => (
                            <tr key={order.id} className="border-t dark:border-gray-700">
                                <td className="p-4 font-medium">{customerMap.get(order.customerId)}</td>
                                <td className="p-4">{assetMap.get(order.vehicleId)}</td>
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

export const CreateRentalOrderPage: React.FC = () => {
    const { state, dispatch } = useAppContext();
    const { customers, vehicles, accounts } = state;
    
    const [customerId, setCustomerId] = useState('');
    const [vehicleId, setVehicleId] = useState('');
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [paymentAccountId, setPaymentAccountId] = useState('');

    const cashAccounts = useMemo(() => accounts.filter(a => a.isCashAccount), [accounts]);
    const availableAssets = useMemo(() => vehicles.filter(a => a.status === 'Available'), [vehicles]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const vehicle = vehicles.find(a => a.id === vehicleId);
        if (!vehicle) return;

        // For simplicity, let's assume daily rate is derived from vehicle value or a fixed amount
        const dailyRate = vehicle.value ? vehicle.value * 0.01 : 500000;
        const start = new Date(startDate);
        const end = new Date(endDate);
        const days = Math.ceil((end.getTime() - start.getTime()) / (1000 * 3600 * 24)) || 1;
        const totalPrice = days * dailyRate;

        const orderData: Omit<RentalOrder, 'id' | 'status'> = {
            customerId, vehicleId, startDate, endDate, totalPrice
        };
        dispatch({ type: 'modules/rental/addOrder', payload: { orderData, paymentAccountId } });
        alert('Pesanan rental berhasil dibuat dan tagihan telah dibuat!');
    };

    return (
        <div className="p-8">
            <h1 className="text-3xl font-bold mb-6">Buat Pesanan Rental</h1>
            <form onSubmit={handleSubmit} className="max-w-lg mx-auto bg-white dark:bg-gray-800 p-6 rounded-lg shadow space-y-4">
                <Select value={customerId} onChange={e => setCustomerId(e.target.value)} required>
                    <option value="">-- Pilih Pelanggan --</option>
                    {customers.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </Select>
                 <Select value={vehicleId} onChange={e => setVehicleId(e.target.value)} required>
                    <option value="">-- Pilih Armada --</option>
                    {availableAssets.map(a => <option key={a.id} value={a.id}>{a.name} ({a.licensePlate})</option>)}
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
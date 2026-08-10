// This is a new file: components/Fleet.tsx
import React, { useState, useEffect, useMemo } from 'react';
import { useAppContext } from '../hooks/useAppContext';
import { Vehicle, Account } from '../types';
import { Button, Modal, Input, Select, Label, Card, StatCard } from './ui';

const VehicleModal: React.FC<{
    isOpen: boolean;
    onClose: () => void;
    onSave: (data: Omit<Vehicle, 'id' | 'assetId'> | Vehicle) => void;
    existingVehicle: Vehicle | null;
}> = ({ isOpen, onClose, onSave, existingVehicle }) => {
    const { state } = useAppContext();
    const { staff } = state;
    const [formData, setFormData] = useState<Partial<Vehicle>>({ status: 'Available', ownership: 'Sewa' });

    const cashAccounts = useMemo(() => state.accounts.filter(a => a.isCashAccount), [state.accounts]);

    useEffect(() => {
        if (isOpen) {
            setFormData(existingVehicle || { name: '', licensePlate: '', driverId: undefined, status: 'Available', ownership: 'Sewa', purchaseDate: new Date().toISOString().split('T')[0] });
        }
    }, [isOpen, existingVehicle]);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        const newFormData = { ...formData, [name]: value };
        if (name === 'ownership' && value === 'Sewa') {
            delete newFormData.value;
            delete newFormData.sourceAccountId;
        }
        setFormData(newFormData);
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const payload = {
            ...formData,
            driverId: formData.driverId || undefined,
            value: formData.ownership === 'Milik' ? Number(formData.value) : undefined,
        } as Omit<Vehicle, 'id' | 'assetId'> | Vehicle;

        if (existingVehicle) {
            onSave({ ...existingVehicle, ...payload });
        } else {
            onSave(payload);
        }
        onClose();
    };

    const footer = (
        <>
            <button type="button" onClick={onClose} className="px-4 py-2 rounded-md bg-gray-200 dark:bg-gray-600">Batal</button>
            <Button type="submit" onClick={handleSubmit}>Simpan Kendaraan</Button>
        </>
    );

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={existingVehicle ? 'Ubah Kendaraan' : 'Tambah Kendaraan Baru'} footer={footer}>
            <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <Label htmlFor="name">Nama/Tipe Kendaraan</Label>
                        <Input id="name" name="name" value={formData.name || ''} onChange={handleInputChange} required />
                    </div>
                    <div>
                        <Label htmlFor="licensePlate">Nomor Polisi</Label>
                        <Input id="licensePlate" name="licensePlate" value={formData.licensePlate || ''} onChange={handleInputChange} required />
                    </div>
                </div>
                <div>
                    <Label htmlFor="ownership">Status Kepemilikan</Label>
                    <Select id="ownership" name="ownership" value={formData.ownership} onChange={handleInputChange}>
                        <option value="Sewa">Sewa</option>
                        <option value="Milik">Milik Perusahaan</option>
                    </Select>
                </div>
                {formData.ownership === 'Milik' && (
                    <div className="grid grid-cols-2 gap-4 p-4 border rounded-md dark:border-gray-600">
                         <div>
                            <Label htmlFor="purchaseDate">Tanggal Beli</Label>
                            <Input id="purchaseDate" name="purchaseDate" type="date" value={formData.purchaseDate || ''} onChange={handleInputChange} required />
                        </div>
                        <div>
                            <Label htmlFor="value">Nilai Perolehan (Rp)</Label>
                            <Input id="value" name="value" type="number" value={formData.value || ''} onChange={handleInputChange} required />
                        </div>
                        <div className="col-span-2">
                            <Label htmlFor="sourceAccountId">Sumber Dana</Label>
                            <Select id="sourceAccountId" name="sourceAccountId" value={formData.sourceAccountId || ''} onChange={handleInputChange} required>
                                <option value="">-- Pilih Rekening --</option>
                                {cashAccounts.map(acc => <option key={acc.id} value={acc.id}>{acc.name}</option>)}
                            </Select>
                        </div>
                    </div>
                )}
                <div>
                    <Label htmlFor="driverId">Supir</Label>
                    <Select id="driverId" name="driverId" value={formData.driverId || ''} onChange={handleInputChange}>
                        <option value="">-- Tanpa Supir --</option>
                        {staff.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                    </Select>
                </div>
                 <div>
                    <Label htmlFor="status">Status</Label>
                    <Select id="status" name="status" value={formData.status} onChange={handleInputChange} required>
                        <option value="Available">Tersedia</option>
                        <option value="On Trip">Dalam Perjalanan</option>
                        <option value="Under Maintenance">Dalam Perbaikan</option>
                    </Select>
                </div>
            </form>
        </Modal>
    );
};

export const VehicleListPage: React.FC = () => {
    const { state, dispatch } = useAppContext();
    const { vehicles, staff } = state;
    const [isModalOpen, setModalOpen] = useState(false);
    const [editingVehicle, setEditingVehicle] = useState<Vehicle | null>(null);

    const handleOpenModal = (vehicle: Vehicle | null) => {
        setEditingVehicle(vehicle);
        setModalOpen(true);
    };

    const handleSave = (data: Omit<Vehicle, 'id' | 'assetId'> | Vehicle) => {
        if ('id' in data) {
            dispatch({ type: 'modules/fleet/updateVehicle', payload: data });
        } else {
            dispatch({ type: 'modules/fleet/addVehicle', payload: data as Omit<Vehicle, 'id' | 'assetId'> });
        }
    };
    
    const staffMap = useMemo(() => new Map(staff.map(s => [s.id, s.name])), [staff]);

    return (
        <div className="p-8 h-full flex flex-col">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Manajemen Armada</h1>
                <Button onClick={() => handleOpenModal(null)}>Tambah Kendaraan</Button>
            </div>
            <div className="flex-grow bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-y-auto">
                 <table className="w-full text-sm text-left text-gray-500 dark:text-gray-400">
                    <thead className="text-xs text-gray-700 uppercase bg-gray-50 dark:bg-gray-700 dark:text-gray-400">
                        <tr>
                            <th className="px-6 py-3">Kendaraan</th>
                            <th className="px-6 py-3">Nomor Polisi</th>
                            <th className="px-6 py-3">Supir</th>
                            <th className="px-6 py-3">Status</th>
                            <th className="px-6 py-3">Kepemilikan</th>
                            <th className="px-6 py-3">Aksi</th>
                        </tr>
                    </thead>
                    <tbody>
                        {vehicles.map(vehicle => (
                            <tr key={vehicle.id} className="border-b dark:border-gray-700">
                                <td className="px-6 py-4 font-medium">{vehicle.name}</td>
                                <td className="px-6 py-4 font-mono">{vehicle.licensePlate}</td>
                                <td className="px-6 py-4">{vehicle.driverId ? staffMap.get(vehicle.driverId) : 'N/A'}</td>
                                <td className="px-6 py-4">{vehicle.status}</td>
                                <td className="px-6 py-4 font-semibold">{vehicle.ownership}</td>
                                <td className="px-6 py-4">
                                    <button onClick={() => handleOpenModal(vehicle)} className="font-medium text-primary-600 hover:underline">Ubah</button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
            <VehicleModal isOpen={isModalOpen} onClose={() => setModalOpen(false)} onSave={handleSave} existingVehicle={editingVehicle} />
        </div>
    );
};

export const VehicleMaintenancePage: React.FC = () => {
    const { state } = useAppContext();
    const { vehicleLogs, vehicles } = state;
    
    const vehicleMap = useMemo(() => new Map(vehicles.map(v => [v.id, v.name])), [vehicles]);

    return (
        <div className="p-8 h-full flex flex-col">
            <h1 className="text-3xl font-bold">Log Kendaraan</h1>
            <p className="mt-2 mb-6 text-gray-500">Mencatat semua aktivitas terkait bahan bakar, perjalanan, dan perbaikan.</p>
            <Card className="flex-grow overflow-y-auto">
                <table className="w-full text-sm">
                    <thead>
                        <tr>
                            <th className="p-2 text-left">Tanggal</th>
                            <th className="p-2 text-left">Kendaraan</th>
                            <th className="p-2 text-left">Tipe Log</th>
                            <th className="p-2 text-left">Detail</th>
                            <th className="p-2 text-right">Biaya</th>
                        </tr>
                    </thead>
                    <tbody>
                        {vehicleLogs.map(log => (
                            <tr key={log.id} className="border-t dark:border-gray-700">
                                <td className="p-2">{new Date(log.date).toLocaleDateString()}</td>
                                <td className="p-2">{vehicleMap.get(log.vehicleId)}</td>
                                <td className="p-2">{log.type}</td>
                                <td className="p-2">{log.details}</td>
                                <td className="p-2 text-right">Rp{log.cost.toLocaleString('id-ID')}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </Card>
        </div>
    );
};

export const DriverManagementPage: React.FC = () => {
    const { state } = useAppContext();
    const { drivers, staff } = state;
    const staffMap = useMemo(() => new Map(staff.map(s => [s.id, s.name])), [staff]);

    return (
        <div className="p-8 h-full flex flex-col">
            <h1 className="text-3xl font-bold">Manajemen Supir</h1>
            <p className="mt-2 mb-6 text-gray-500">Mengelola data dan lisensi supir.</p>
             <Card className="flex-grow overflow-y-auto">
                <table className="w-full text-sm">
                    <thead>
                        <tr>
                            <th className="p-2 text-left">Nama</th>
                            <th className="p-2 text-left">No. Lisensi</th>
                            <th className="p-2 text-left">Tanggal Kedaluwarsa</th>
                        </tr>
                    </thead>
                    <tbody>
                        {drivers.map(driver => (
                            <tr key={driver.id} className="border-t dark:border-gray-700">
                                <td className="p-2">{staffMap.get(driver.staffId)}</td>
                                <td className="p-2 font-mono">{driver.licenseNumber}</td>
                                <td className="p-2">{new Date(driver.licenseExpiry).toLocaleDateString()}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </Card>
        </div>
    );
};

export const FleetAnalyticsPage: React.FC = () => {
    const { state } = useAppContext();
    const { vehicles, vehicleLogs } = state;

    const totalVehicles = vehicles.length;
    const vehiclesOnTrip = vehicles.filter(v => v.status === 'On Trip').length;
    const totalMaintenanceCost = vehicleLogs.filter(log => log.type === 'Maintenance').reduce((sum, log) => sum + log.cost, 0);

    return (
        <div className="p-8">
            <h1 className="text-3xl font-bold">Analitik Armada</h1>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-6">
                <StatCard title="Total Kendaraan" value={totalVehicles.toString()} />
                <StatCard title="Dalam Perjalanan" value={vehiclesOnTrip.toString()} />
                <StatCard title="Total Biaya Perbaikan" value={`Rp${totalMaintenanceCost.toLocaleString('id-ID')}`} />
            </div>
        </div>
    );
};
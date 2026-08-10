// This is a new file: components/PortalSettings.tsx
import React, { useState } from 'react';
import { useAppContext } from '../hooks/useAppContext';
import { PageHeader, Card, Label, Input, Button } from './ui';

// --- E-commerce Settings Page (Moved from Ecommerce.tsx) ---
export const EcommerceSettingsPage: React.FC = () => {
    const { state, dispatch } = useAppContext();
    const [settings, setSettings] = useState(state.ecommerceSettings);
    
    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setSettings(prev => ({ ...prev, [name]: parseFloat(value) || 0 }));
    };

    const handleSave = () => {
        dispatch({ type: 'settings/updateEcommerce', payload: settings });
        alert('Pengaturan E-commerce berhasil disimpan!');
    };

    return (
        <div className="p-8 h-full overflow-y-auto">
             <PageHeader title="Pengaturan E-commerce" />
             <Card className="max-w-2xl mx-auto space-y-6">
                <h2 className="text-xl font-semibold">Pengiriman</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <Label htmlFor="deliveryFeeStandard">Tarif Ongkir Reguler (Rp)</Label>
                        <Input id="deliveryFeeStandard" name="deliveryFeeStandard" type="number" value={settings.deliveryFeeStandard} onChange={handleInputChange} />
                    </div>
                    <div>
                        <Label htmlFor="deliveryFeeExpress">Tarif Ongkir Utama (Rp)</Label>
                        <Input id="deliveryFeeExpress" name="deliveryFeeExpress" type="number" value={settings.deliveryFeeExpress} onChange={handleInputChange} />
                    </div>
                </div>
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <Label htmlFor="minTransactionForDelivery">Minimal Transaksi untuk Pengiriman (Rp)</Label>
                        <Input id="minTransactionForDelivery" name="minTransactionForDelivery" type="number" value={settings.minTransactionForDelivery} onChange={handleInputChange} />
                    </div>
                    <div>
                        <Label htmlFor="maxDeliveryDistanceKm">Jarak Maksimal Pengantaran (km)</Label>
                        <Input id="maxDeliveryDistanceKm" name="maxDeliveryDistanceKm" type="number" value={settings.maxDeliveryDistanceKm} onChange={handleInputChange} />
                    </div>
                </div>
                <div className="flex justify-end pt-4">
                    <Button onClick={handleSave}>Simpan Pengaturan</Button>
                </div>
             </Card>
        </div>
    );
};

// --- E-learning Settings Page (New) ---
export const ElearningPortalSettingsPage: React.FC = () => (
    <div className="p-8">
        <PageHeader title="Pengaturan Portal E-learning" />
        <Card>
            <p>Tidak ada pengaturan yang dapat dikonfigurasi untuk portal e-learning saat ini.</p>
        </Card>
    </div>
);

// --- Event Settings Page (New) ---
export const EventPortalSettingsPage: React.FC = () => (
    <div className="p-8">
        <PageHeader title="Pengaturan Portal Event" />
        <Card>
            <p>Tidak ada pengaturan yang dapat dikonfigurasi untuk portal event saat ini.</p>
        </Card>
    </div>
);

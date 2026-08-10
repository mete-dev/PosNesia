// This is a new file: components/PLM.tsx
import React from 'react';
import { useAppContext } from '../hooks/useAppContext';

export const ProductDesignsPage: React.FC = () => {
    const { state } = useAppContext();
    const { productDesigns } = state;

    return (
        <div className="p-8 h-full flex flex-col">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-6">Desain Produk (PLM)</h1>
            <div className="flex-grow bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-y-auto">
                <table className="w-full text-sm text-left text-gray-500 dark:text-gray-400">
                    <thead className="text-xs text-gray-700 uppercase bg-gray-50 dark:bg-gray-700 dark:text-gray-400">
                        <tr>
                            <th className="px-6 py-3">Nama Desain</th>
                            <th className="px-6 py-3">Versi</th>
                            <th className="px-6 py-3">Status</th>
                        </tr>
                    </thead>
                    <tbody>
                        {productDesigns.map(design => (
                            <tr key={design.id} className="border-b dark:border-gray-700">
                                <td className="px-6 py-4 font-medium">{design.name}</td>
                                <td className="px-6 py-4">{design.version}</td>
                                <td className="px-6 py-4">{design.status}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export const EngineeringChangeOrdersPage: React.FC = () => {
    const { state } = useAppContext();
    const { ecos, productDesigns } = state;
    
    const designMap = new Map(productDesigns.map(d => [d.id, d.name]));

    return (
        <div className="p-8 h-full flex flex-col">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-6">Engineering Change Orders (ECO)</h1>
            <div className="flex-grow bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-y-auto">
                <table className="w-full text-sm text-left text-gray-500 dark:text-gray-400">
                    <thead className="text-xs text-gray-700 uppercase bg-gray-50 dark:bg-gray-700 dark:text-gray-400">
                        <tr>
                            <th className="px-6 py-3">Desain Produk</th>
                            <th className="px-6 py-3">Alasan Perubahan</th>
                            <th className="px-6 py-3">Status</th>
                        </tr>
                    </thead>
                    <tbody>
                        {ecos.map(eco => (
                            <tr key={eco.id} className="border-b dark:border-gray-700">
                                <td className="px-6 py-4 font-medium">{designMap.get(eco.productDesignId) || 'Unknown'}</td>
                                <td className="px-6 py-4">{eco.reason}</td>
                                <td className="px-6 py-4">{eco.status}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export const ProductVersionsPage: React.FC = () => (
    <div className="p-8">
        <h1 className="text-3xl font-bold">Versi Produk</h1>
        <p className="mt-4">Halaman ini akan menampilkan riwayat versi untuk setiap desain produk. Fitur ini sedang dalam pengembangan.</p>
    </div>
);



import React, { useState, useEffect } from 'react';
import { useAppContext } from '../hooks/useAppContext';
import { Principal, Status } from '../types';
import { ActionsDropdown, DropdownItem, Modal, Button, Input, Label, Select } from './ui';

// Modal for adding/editing a Principal
const PrincipalModal: React.FC<{
    isOpen: boolean;
    onClose: () => void;
    onSave: (principal: (Omit<Principal, 'id'> | Principal) & { brandNames: string[] }) => void;
    existingPrincipal: Principal | null;
}> = ({ isOpen, onClose, onSave, existingPrincipal }) => {
    const { state } = useAppContext();
    const [formData, setFormData] = useState<Omit<Principal, 'id'>>({
        name: '',
        contactPerson: '',
        email: '',
        phone: '',
        status: 'active'
    });
    const [brandNames, setBrandNames] = useState<string[]>(['']);

    useEffect(() => {
        if (isOpen) {
            if (existingPrincipal) {
                const associatedBrands = state.brands
                    .filter(b => b.principalId === existingPrincipal.id)
                    .map(b => b.name);
                setFormData(existingPrincipal);
                setBrandNames(associatedBrands.length > 0 ? associatedBrands : ['']);
            } else {
                setFormData({ name: '', contactPerson: '', email: '', phone: '', status: 'active' });
                setBrandNames(['']);
            }
        }
    }, [isOpen, existingPrincipal, state.brands]);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleBrandNameChange = (index: number, value: string) => {
        const newBrandNames = [...brandNames];
        newBrandNames[index] = value;
        setBrandNames(newBrandNames);
    };

    const addBrandNameInput = () => setBrandNames([...brandNames, '']);
    const removeBrandNameInput = (index: number) => {
        if (brandNames.length > 1) {
            setBrandNames(brandNames.filter((_, i) => i !== index));
        } else {
            setBrandNames(['']); // Keep one empty input if it's the last one
        }
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const finalBrandNames = brandNames.map(name => name.trim()).filter(name => name);
        if (existingPrincipal) {
            onSave({ ...existingPrincipal, ...formData, brandNames: finalBrandNames });
        } else {
            onSave({ ...formData, brandNames: finalBrandNames });
        }
        onClose();
    };
    
    const footer = (
        <>
            <button type="button" onClick={onClose} className="px-4 py-2 rounded-md text-gray-700 bg-gray-200 dark:text-gray-200 dark:bg-gray-600">Batal</button>
            <Button type="submit" onClick={handleSubmit}>Simpan</Button>
        </>
    );

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title={`${existingPrincipal ? 'Ubah' : 'Tambah'} Principal`}
            footer={footer}
            maxWidth="max-w-2xl"
        >
            <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                    <Label htmlFor="name">Nama Principal</Label>
                    <Input id="name" name="name" value={formData.name} onChange={handleInputChange} required />
                </div>
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <Label htmlFor="contactPerson">Narahubung</Label>
                        <Input id="contactPerson" name="contactPerson" value={formData.contactPerson || ''} onChange={handleInputChange} />
                    </div>
                    <div>
                        <Label htmlFor="phone">Telepon</Label>
                        <Input id="phone" name="phone" type="tel" value={formData.phone || ''} onChange={handleInputChange} />
                    </div>
                </div>
                <div>
                    <Label htmlFor="email">Email</Label>
                    <Input id="email" name="email" type="email" value={formData.email || ''} onChange={handleInputChange} />
                </div>
                <div className="pt-2 border-t dark:border-gray-600">
                    <Label className="mb-2">Merk Terkait</Label>
                    <div className="space-y-2 max-h-40 overflow-y-auto pr-2">
                        {brandNames.map((name, index) => (
                            <div key={index} className="flex items-center gap-2">
                                <Input
                                    value={name}
                                    onChange={e => handleBrandNameChange(index, e.target.value)}
                                    placeholder={`Nama Merk #${index + 1}`}
                                />
                                <button type="button" onClick={() => removeBrandNameInput(index)} className="text-red-500 hover:text-red-700 font-bold text-2xl">&times;</button>
                            </div>
                        ))}
                    </div>
                    <button type="button" onClick={addBrandNameInput} className="text-sm font-semibold text-primary-600 hover:text-primary-800 dark:text-primary-400 mt-2">
                        + Tambah Merk
                    </button>
                </div>
            </form>
        </Modal>
    );
};

// Main page component
export const PrincipalListPage: React.FC = () => {
    const { state, dispatch } = useAppContext();
    const { principals } = state;
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingPrincipal, setEditingPrincipal] = useState<Principal | null>(null);

    const handleOpenModal = (principal: Principal | null) => {
        setEditingPrincipal(principal);
        setIsModalOpen(true);
    };

    const handleSave = (principalData: (Omit<Principal, 'id'> | Principal) & { brandNames: string[] }) => {
        if ('id' in principalData) {
            dispatch({ type: 'principals/update', payload: principalData });
        } else {
            dispatch({ type: 'principals/add', payload: principalData });
        }
    };

    const handleSetStatus = (id: string, status: Status) => {
        const newStatus = status === 'active' ? 'inactive' : 'active';
        if (window.confirm(`Anda yakin ingin mengubah status principal ini menjadi ${newStatus}?`)) {
            dispatch({ type: 'principals/setStatus', payload: { id, status: newStatus } });
        }
    };

    return (
        <div className="p-8 h-full flex flex-col">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Data Principal</h1>
                <Button onClick={() => handleOpenModal(null)}>Tambah Principal</Button>
            </div>
            <div className="flex-grow bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-x-auto">
                <table className="w-full text-sm text-left text-gray-500 dark:text-gray-400">
                    <thead className="text-xs text-gray-700 uppercase bg-gray-50 dark:bg-gray-700 dark:text-gray-400 sticky top-0">
                        <tr>
                            <th scope="col" className="px-6 py-3">Nama Principal</th>
                            <th scope="col" className="px-6 py-3">Narahubung</th>
                            <th scope="col" className="px-6 py-3">Kontak</th>
                            <th scope="col" className="px-6 py-3">Status</th>
                            <th scope="col" className="px-6 py-3">Aksi</th>
                        </tr>
                    </thead>
                    <tbody>
                        {principals.map((principal) => (
                            <tr key={principal.id} className="bg-white dark:bg-gray-800 border-b dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600">
                                <td className="px-6 py-4 font-medium text-gray-900 whitespace-nowrap dark:text-white">{principal.name}</td>
                                <td className="px-6 py-4">{principal.contactPerson || '-'}</td>
                                <td className="px-6 py-4">{principal.email || '-'}<br/>{principal.phone || '-'}</td>
                                <td className="px-6 py-4">
                                    <span className={`px-2 py-1 text-xs font-semibold rounded-full ${principal.status === 'active' ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300' : 'bg-gray-200 text-gray-800 dark:bg-gray-600 dark:text-gray-300'}`}>
                                        {principal.status}
                                    </span>
                                </td>
                                <td className="px-6 py-4">
                                    <ActionsDropdown>
                                        <DropdownItem onClick={() => handleOpenModal(principal)}>Ubah</DropdownItem>
                                        <DropdownItem onClick={() => handleSetStatus(principal.id, principal.status)}>
                                            {principal.status === 'active' ? 'Non-aktifkan' : 'Aktifkan'}
                                        </DropdownItem>
                                    </ActionsDropdown>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
            <PrincipalModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onSave={handleSave}
                existingPrincipal={editingPrincipal}
            />
        </div>
    );
};
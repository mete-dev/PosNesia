// This is a new file: components/Brands.tsx
import React, { useState, useMemo } from 'react';
import { useAppContext } from '../hooks/useAppContext';
import { Brand } from '../types';
import { Modal, Button, Input, Select, Label, Card, Table, Thead, Tbody, Tr, Th, Td, ActionsDropdown, DropdownItem } from './ui';

const BrandModal: React.FC<{
    isOpen: boolean;
    onClose: () => void;
    onSave: (data: Omit<Brand, 'id'> | Brand) => void;
    existingBrand: Brand | null;
}> = ({ isOpen, onClose, onSave, existingBrand }) => {
    const { state } = useAppContext();
    const [name, setName] = useState('');
    const [principalId, setPrincipalId] = useState('');

    React.useEffect(() => {
        if (isOpen) {
            if (existingBrand) {
                setName(existingBrand.name);
                setPrincipalId(existingBrand.principalId);
            } else {
                setName('');
                setPrincipalId('');
            }
        }
    }, [isOpen, existingBrand]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const brandData = { name, principalId };
        if (existingBrand) {
            onSave({ ...existingBrand, ...brandData });
        } else {
            onSave(brandData);
        }
        onClose();
    };
    
    const footer = (
        <>
            <button type="button" onClick={onClose} className="px-4 py-2 rounded-md bg-gray-200 dark:bg-gray-600">Batal</button>
            <Button type="submit" onClick={handleSubmit}>Simpan Merk</Button>
        </>
    );

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={`${existingBrand ? 'Ubah' : 'Tambah'} Merk`} footer={footer}>
            <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                    <Label htmlFor="brand-name">Nama Merk</Label>
                    <Input id="brand-name" value={name} onChange={e => setName(e.target.value)} required />
                </div>
                <div>
                    <Label htmlFor="principal">Principal</Label>
                    <Select id="principal" value={principalId} onChange={e => setPrincipalId(e.target.value)} required>
                        <option value="">-- Pilih Principal --</option>
                        {state.principals.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                    </Select>
                </div>
            </form>
        </Modal>
    );
};

export const BrandManagementPage: React.FC = () => {
    const { state, dispatch } = useAppContext();
    const { brands, principals } = state;
    const [isModalOpen, setModalOpen] = useState(false);
    const [editingBrand, setEditingBrand] = useState<Brand | null>(null);

    const handleOpenModal = (brand: Brand | null = null) => {
        setEditingBrand(brand);
        setModalOpen(true);
    };

    const handleSave = (data: Omit<Brand, 'id'> | Brand) => {
        if ('id' in data) {
            dispatch({ type: 'brands/update', payload: data });
        } else {
            dispatch({ type: 'brands/add', payload: data });
        }
    };
    
    const handleDelete = (id: string) => {
        if (window.confirm("Anda yakin ingin menghapus merk ini? Aksi ini tidak dapat diurungkan.")) {
            dispatch({ type: 'brands/delete', payload: id });
        }
    };
    
    const principalMap = useMemo(() => new Map(principals.map(p => [p.id, p.name])), [principals]);

    return (
        <div className="p-8 h-full flex flex-col">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Data Merk</h1>
                <Button onClick={() => handleOpenModal()}>Tambah Merk</Button>
            </div>
            <Card className="flex-grow overflow-y-auto">
                <Table>
                    <Thead>
                        <Tr>
                            <Th>Nama Merk</Th>
                            <Th>Principal</Th>
                            <Th>Aksi</Th>
                        </Tr>
                    </Thead>
                    <Tbody>
                        {brands.map(brand => (
                            <Tr key={brand.id}>
                                <Td className="font-medium">{brand.name}</Td>
                                <Td>{principalMap.get(brand.principalId) || 'N/A'}</Td>
                                <Td>
                                    <ActionsDropdown>
                                        <DropdownItem onClick={() => handleOpenModal(brand)}>Ubah</DropdownItem>
                                        <DropdownItem onClick={() => handleDelete(brand.id)} className="text-red-600 dark:text-red-500">Hapus</DropdownItem>
                                    </ActionsDropdown>
                                </Td>
                            </Tr>
                        ))}
                    </Tbody>
                </Table>
            </Card>
            <BrandModal isOpen={isModalOpen} onClose={() => setModalOpen(false)} onSave={handleSave} existingBrand={editingBrand} />
        </div>
    );
};
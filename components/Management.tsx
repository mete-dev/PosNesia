// This is a new file: components/Management.tsx
import React, { useState, useMemo, useEffect } from 'react';
import { useAppContext } from '../hooks/useAppContext';
import { Branch, CashierStation, Warehouse, Province, City, District, Village, BranchType, WarehouseType } from '../types';
import { Button, Modal, Input, Select, Label, Card, Table, Thead, Tbody, Tr, Th, Td, PageHeader, ActionsDropdown, DropdownItem, Textarea } from './ui';
import { getCode } from '../services/serviceUtils';
import { useModalState, ModalState } from '../hooks/useModalState';

// --- Shared Modals for Location Management ---

const TypeModal: React.FC<{
    isOpen: boolean;
    onClose: () => void;
    onSave: (data: { name: string, id?: string }) => void;
    existingType: { id: string; name: string } | null;
    typeName: 'Tipe Cabang' | 'Tipe Gudang';
}> = ({ isOpen, onClose, onSave, existingType, typeName }) => {
    const [name, setName] = useState('');
    useEffect(() => {
        if (isOpen) setName(existingType?.name || '');
    }, [isOpen, existingType]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSave({ id: existingType?.id, name });
        onClose();
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={`${existingType ? 'Ubah' : 'Tambah'} ${typeName}`}>
            <form onSubmit={handleSubmit} className="space-y-4">
                <Input value={name} onChange={e => setName(e.target.value)} placeholder={`Nama ${typeName}`} required />
                <div className="flex justify-end gap-2 pt-4">
                    <Button variant="secondary" onClick={onClose}>Batal</Button>
                    <Button type="submit">Simpan</Button>
                </div>
            </form>
        </Modal>
    );
};

const BranchModal: React.FC<{
    isOpen: boolean;
    onClose: () => void;
    onSave: (data: Omit<Branch, 'id' | 'safeAccountId'> | Branch) => void;
    existingBranch: Branch | null;
}> = ({ isOpen, onClose, onSave, existingBranch }) => {
    const { state } = useAppContext();
    const { provinces, cities, districts, villages, branchTypes } = state;
    const [formData, setFormData] = useState<Partial<Omit<Branch, 'id' | 'safeAccountId'>>>({});

    useEffect(() => {
        if (isOpen) {
            setFormData(existingBranch || { branchTypeId: '', provinceId: '', cityId: '', districtId: '', villageId: '', detail: '' });
        }
    }, [isOpen, existingBranch]);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        const newFormData = { ...formData, [name]: value };

        if (name === 'provinceId') newFormData.cityId = '';
        if (name === 'cityId') newFormData.districtId = '';
        if (name === 'districtId') newFormData.villageId = '';
        
        setFormData(newFormData);
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSave(formData as Branch);
        onClose();
    };

    const availableCities = useMemo(() => cities.filter(c => c.provinceId === formData.provinceId), [formData.provinceId, cities]);
    const availableDistricts = useMemo(() => districts.filter(d => d.cityId === formData.cityId), [formData.cityId, districts]);
    const availableVillages = useMemo(() => villages.filter(v => v.districtId === formData.districtId), [formData.districtId, villages]);

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={`${existingBranch ? 'Ubah' : 'Tambah'} Cabang`} maxWidth="max-w-2xl">
            <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                    <Input name="name" value={formData.name || ''} onChange={handleInputChange} placeholder="Nama Cabang" required />
                    <Select name="branchTypeId" value={formData.branchTypeId || ''} onChange={handleInputChange} required>
                        <option value="">-- Pilih Tipe Cabang --</option>
                        {branchTypes.map(bt => <option key={bt.id} value={bt.id}>{bt.name}</option>)}
                    </Select>
                </div>
                <div className="grid grid-cols-2 gap-4">
                    <Select name="provinceId" value={formData.provinceId || ''} onChange={handleInputChange} required>
                        <option value="">-- Pilih Provinsi --</option>
                        {provinces.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                    </Select>
                     <Select name="cityId" value={formData.cityId || ''} onChange={handleInputChange} required disabled={!formData.provinceId}>
                        <option value="">-- Pilih Kota/Kab. --</option>
                        {availableCities.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </Select>
                </div>
                 <div className="grid grid-cols-2 gap-4">
                    <Select name="districtId" value={formData.districtId || ''} onChange={handleInputChange} required disabled={!formData.cityId}>
                        <option value="">-- Pilih Kecamatan --</option>
                        {availableDistricts.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                    </Select>
                    <Select name="villageId" value={formData.villageId || ''} onChange={handleInputChange} required disabled={!formData.districtId}>
                        <option value="">-- Pilih Kel./Desa --</option>
                        {availableVillages.map(v => <option key={v.id} value={v.id}>{v.name}</option>)}
                    </Select>
                </div>
                <Textarea name="detail" value={formData.detail || ''} onChange={handleInputChange} placeholder="Detail Alamat (Nama Jalan, No. Rumah, dll)" />
                <div className="flex justify-end gap-2 pt-4">
                    <Button variant="secondary" onClick={onClose}>Batal</Button>
                    <Button type="submit">Simpan</Button>
                </div>
            </form>
        </Modal>
    );
};

const WarehouseModal: React.FC<{
    isOpen: boolean;
    onClose: () => void;
    onSave: (data: Omit<Warehouse, 'id'> | Warehouse) => void;
    existingWarehouse: Warehouse | null;
}> = ({ isOpen, onClose, onSave, existingWarehouse }) => {
    const { state } = useAppContext();
    const { warehouseTypes } = state;
    const [formData, setFormData] = useState<Partial<Omit<Warehouse, 'id'>>>({});

    useEffect(() => {
        if (isOpen) {
            setFormData(existingWarehouse || { name: '', warehouseTypeId: '', address: '' });
        }
    }, [isOpen, existingWarehouse]);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSave(formData as Warehouse);
        onClose();
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={`${existingWarehouse ? 'Ubah' : 'Tambah'} Gudang`}>
            <form onSubmit={handleSubmit} className="space-y-4">
                <Input name="name" value={formData.name || ''} onChange={handleInputChange} placeholder="Nama Gudang" required />
                <Select name="warehouseTypeId" value={formData.warehouseTypeId || ''} onChange={handleInputChange} required>
                    <option value="">-- Pilih Tipe Gudang --</option>
                    {warehouseTypes.filter(wt => wt.name !== 'Gudang Cabang').map(wt => <option key={wt.id} value={wt.id}>{wt.name}</option>)}
                </Select>
                <Textarea name="address" value={formData.address || ''} onChange={handleInputChange} placeholder="Alamat Gudang" />
                 <p className="text-xs text-gray-500">Info: Gudang yang terhubung dengan cabang dibuat secara otomatis saat membuat cabang baru.</p>
                <div className="flex justify-end gap-2 pt-4">
                    <Button variant="secondary" onClick={onClose}>Batal</Button>
                    <Button type="submit">Simpan</Button>
                </div>
            </form>
        </Modal>
    );
};

const AreaModal: React.FC<{
    isOpen: boolean;
    onClose: () => void;
    onSave: (data: any) => void;
    type: 'Province' | 'City' | 'District' | 'Village';
    existingItem: any | null;
}> = ({ isOpen, onClose, onSave, type, existingItem }) => {
    const { state } = useAppContext();
    const [name, setName] = useState('');
    const [parentId, setParentId] = useState('');
    const [code, setCode] = useState('');

    useEffect(() => {
        if (isOpen) {
            setName(existingItem?.name || '');
            if (type === 'City') setParentId(existingItem?.provinceId || '');
            if (type === 'District') setParentId(existingItem?.cityId || '');
            if (type === 'Village') setParentId(existingItem?.districtId || '');
            setCode(existingItem?.code || '');
        } else {
            setName(''); setParentId(''); setCode('');
        }
    }, [isOpen, existingItem, type]);
    
    useEffect(() => {
        if (type === 'City' || type === 'District') {
            setCode(getCode(name));
        }
    }, [name, type]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        let payload: any = { name };
        if (type === 'City') payload.provinceId = parentId;
        if (type === 'District') payload.cityId = parentId;
        if (type === 'Village') payload.districtId = parentId;
        if (type === 'City' || type === 'District') payload.code = code;

        if (existingItem) {
            payload.id = existingItem.id;
        }

        onSave(payload);
        onClose();
    };
    
    const parentLabel = { 'City': 'Provinsi', 'District': 'Kota/Kab.', 'Village': 'Kecamatan' }[type];
    const parentCollection = { 
        'City': state.provinces, 
        'District': state.cities, 
        'Village': state.districts 
    }[type];

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={`${existingItem ? 'Ubah' : 'Tambah'} ${type}`}>
             <form onSubmit={handleSubmit} className="space-y-4">
                 <Input value={name} onChange={e => setName(e.target.value)} placeholder={`Nama ${type}`} required />
                 {parentLabel && parentCollection && (
                    <Select value={parentId} onChange={e => setParentId(e.target.value)} required>
                        <option value="">-- Pilih {parentLabel} --</option>
                        {parentCollection.map((item: any) => <option key={item.id} value={item.id}>{item.name}</option>)}
                    </Select>
                 )}
                 {(type === 'City' || type === 'District') && (
                     <Input value={code} readOnly placeholder="Kode (otomatis)" className="bg-gray-200 dark:bg-gray-700/50" />
                 )}
                 <div className="flex justify-end gap-2 pt-4">
                    <Button variant="secondary" onClick={onClose}>Batal</Button>
                    <Button type="submit">Simpan</Button>
                </div>
            </form>
        </Modal>
    );
};


// --- Location Management (Branches & Warehouses) ---
export const LocationManagementPage: React.FC = () => {
    const [view, setView] = useState<'Cabang' | 'Tipe Cabang' | 'Gudang' | 'Tipe Gudang'>('Cabang');

    const renderView = () => {
        switch (view) {
            case 'Cabang':
                return <BranchView />;
            case 'Gudang':
                return <WarehouseView />;
            case 'Tipe Cabang':
                return <BranchTypeView />;
             case 'Tipe Gudang':
                return <WarehouseTypeView />;
            default:
                return null;
        }
    };
    
    return (
        <div className="p-8 h-full flex flex-col">
            <PageHeader title="Manajemen Lokasi" />
            <div className="flex space-x-2 border-b dark:border-gray-700 mb-4">
                <button onClick={() => setView('Cabang')} className={`py-2 px-4 text-sm font-medium ${view === 'Cabang' ? 'border-b-2 border-primary-500 text-primary-500' : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'}`}>Data Cabang</button>
                <button onClick={() => setView('Tipe Cabang')} className={`py-2 px-4 text-sm font-medium ${view === 'Tipe Cabang' ? 'border-b-2 border-primary-500 text-primary-500' : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'}`}>Tipe Cabang</button>
                <button onClick={() => setView('Gudang')} className={`py-2 px-4 text-sm font-medium ${view === 'Gudang' ? 'border-b-2 border-primary-500 text-primary-500' : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'}`}>Data Gudang</button>
                <button onClick={() => setView('Tipe Gudang')} className={`py-2 px-4 text-sm font-medium ${view === 'Tipe Gudang' ? 'border-b-2 border-primary-500 text-primary-500' : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'}`}>Tipe Gudang</button>
            </div>
            <div className="flex-grow">
                {renderView()}
            </div>
        </div>
    );
};

const BranchTypeView = () => {
    const { state, dispatch } = useAppContext();
    const modalState = useModalState<BranchType>();

    const handleSave = (data: { name: string, id?: string }) => {
        if (data.id) {
            dispatch({ type: 'company/updateBranchType', payload: data as BranchType });
        } else {
            dispatch({ type: 'company/addBranchType', payload: data as Omit<BranchType, 'id'> });
        }
    };
    
    return (
        <Card>
             <div className="flex justify-end mb-4">
                <Button onClick={() => modalState.openModal()}>Tambah Tipe Cabang</Button>
            </div>
            <Table>
                <Thead><Tr><Th>Nama Tipe Cabang</Th><Th>Aksi</Th></Tr></Thead>
                <Tbody>
                    {state.branchTypes.map(bt => (
                        <Tr key={bt.id}>
                            <Td>{bt.name}</Td>
                            <Td><Button variant="ghost" size="sm" onClick={() => modalState.openModal(bt)}>Ubah</Button></Td>
                        </Tr>
                    ))}
                </Tbody>
            </Table>
            <TypeModal isOpen={modalState.isOpen} onClose={modalState.closeModal} onSave={handleSave} existingType={modalState.editingItem} typeName="Tipe Cabang" />
        </Card>
    );
};

const WarehouseTypeView = () => {
    const { state, dispatch } = useAppContext();
    const modalState = useModalState<WarehouseType>();

    const handleSave = (data: { name: string, id?: string }) => {
        if (data.id) {
            dispatch({ type: 'company/updateWarehouseType', payload: data as WarehouseType });
        } else {
            dispatch({ type: 'company/addWarehouseType', payload: data as Omit<WarehouseType, 'id'> });
        }
    };
    
    return (
        <Card>
             <div className="flex justify-end mb-4">
                <Button onClick={() => modalState.openModal()}>Tambah Tipe Gudang</Button>
            </div>
            <Table>
                <Thead><Tr><Th>Nama Tipe Gudang</Th><Th>Aksi</Th></Tr></Thead>
                <Tbody>
                    {state.warehouseTypes.map(wt => (
                        <Tr key={wt.id}>
                            <Td>{wt.name}</Td>
                            <Td><Button variant="ghost" size="sm" onClick={() => modalState.openModal(wt)}>Ubah</Button></Td>
                        </Tr>
                    ))}
                </Tbody>
            </Table>
            <TypeModal isOpen={modalState.isOpen} onClose={modalState.closeModal} onSave={handleSave} existingType={modalState.editingItem} typeName="Tipe Gudang" />
        </Card>
    );
};

const BranchView = () => {
    const { state, dispatch } = useAppContext();
    const modalState = useModalState<Branch>();
    const cityMap = useMemo(() => new Map(state.cities.map(c => [c.id, c.name])), [state.cities]);
    const typeMap = useMemo(() => new Map(state.branchTypes.map(bt => [bt.id, bt.name])), [state.branchTypes]);

    const handleSave = (data: Omit<Branch, 'id' | 'safeAccountId'> | Branch) => {
        if ('id' in data) {
            dispatch({ type: 'company/updateBranch', payload: data });
        } else {
            dispatch({ type: 'company/addBranch', payload: data });
        }
    };

    return (
         <Card>
            <div className="flex justify-end mb-4">
                <Button onClick={() => modalState.openModal()}>Tambah Cabang</Button>
            </div>
            <Table>
                <Thead><Tr><Th>ID</Th><Th>Nama</Th><Th>Tipe</Th><Th>Kota</Th><Th>Aksi</Th></Tr></Thead>
                <Tbody>
                    {state.branches.map(b => (
                        <Tr key={b.id}>
                            <Td>{b.id}</Td>
                            <Td>{b.name}</Td>
                            <Td>{typeMap.get(b.branchTypeId) || 'N/A'}</Td>
                            <Td>{cityMap.get(b.cityId) || 'N/A'}</Td>
                            <Td><Button variant="ghost" size="sm" onClick={() => modalState.openModal(b)}>Ubah</Button></Td>
                        </Tr>
                    ))}
                </Tbody>
            </Table>
            <BranchModal isOpen={modalState.isOpen} onClose={modalState.closeModal} onSave={handleSave} existingBranch={modalState.editingItem} />
        </Card>
    );
}

const WarehouseView = () => {
    const { state, dispatch } = useAppContext();
    const modalState = useModalState<Warehouse>();
    const branchMap = useMemo(() => new Map(state.branches.map(b => [b.id, b.name])), [state.branches]);
    const typeMap = useMemo(() => new Map(state.warehouseTypes.map(wt => [wt.id, wt.name])), [state.warehouseTypes]);

    const handleSave = (data: Omit<Warehouse, 'id'> | Warehouse) => {
        if ('id' in data) {
            dispatch({ type: 'company/updateWarehouse', payload: data });
        } else {
            dispatch({ type: 'company/addWarehouse', payload: data as Omit<Warehouse, 'id'> });
        }
    };
    
    return (
         <Card>
            <div className="flex justify-end mb-4">
                <Button onClick={() => modalState.openModal()}>Tambah Gudang</Button>
            </div>
            <Table>
                <Thead><Tr><Th>Nama</Th><Th>Tipe</Th><Th>Cabang Tertaut</Th><Th>Aksi</Th></Tr></Thead>
                <Tbody>
                    {state.warehouses.map(w => (
                        <Tr key={w.id}>
                            <Td>{w.name}</Td>
                            <Td>{typeMap.get(w.warehouseTypeId) || 'N/A'}</Td>
                            <Td>{w.branchId ? `Terhubung ke: ${branchMap.get(w.branchId) || 'N/A'}` : 'Gudang Pusat'}</Td>
                            <Td><Button variant="ghost" size="sm" onClick={() => modalState.openModal(w)}>Ubah</Button></Td>
                        </Tr>
                    ))}
                </Tbody>
            </Table>
            <WarehouseModal isOpen={modalState.isOpen} onClose={modalState.closeModal} onSave={handleSave} existingWarehouse={modalState.editingItem} />
        </Card>
    )
}


// --- Cashier Station Management ---
export const CashierStationManagementPage: React.FC = () => (
     <div className="p-8"><PageHeader title="Manajemen Stasiun Kasir" /><Card><p>Fitur ini sedang dalam pengembangan.</p></Card></div>
);

// --- Area Management ---
export const AreaManagementPage: React.FC = () => {
    const { state, dispatch } = useAppContext();
    const { provinces, cities, districts, villages } = state;
    const [view, setView] = useState<'Province' | 'City' | 'District' | 'Village'>('Province');
    const modalState = useModalState<any>();

    const provinceMap = useMemo(() => new Map(provinces.map(p => [p.id, p.name])), [provinces]);
    const cityMap = useMemo(() => new Map(cities.map(c => [c.id, c.name])), [cities]);
    const districtMap = useMemo(() => new Map(districts.map(d => [d.id, d.name])), [districts]);

    const handleSave = (data: any) => {
        const isUpdate = !!data.id;
        const typeMap = {
            'Province': { update: 'areas/updateProvince', add: 'areas/addProvince' },
            'City': { update: 'areas/updateCity', add: 'areas/addCity' },
            'District': { update: 'areas/updateDistrict', add: 'areas/addDistrict' },
            'Village': { update: 'areas/updateVillage', add: 'areas/addVillage' },
        };
        const actionType = isUpdate ? typeMap[view].update : typeMap[view].add;
        dispatch({ type: actionType as any, payload: data });
        modalState.closeModal();
    };

    const tabs = ['Province', 'City', 'District', 'Village'];
    const tabLabels = { 'Province': 'Provinsi', 'City': 'Kota/Kab.', 'District': 'Kecamatan', 'Village': 'Desa/Kel.' };
    
    const renderTable = () => {
        switch (view) {
            case 'Province': return <Table><Thead><Tr><Th>Nama Provinsi</Th><Th>Aksi</Th></Tr></Thead><Tbody>{provinces.map(p => <Tr key={p.id}><Td>{p.name}</Td><Td><Button variant="ghost" size="sm" onClick={() => modalState.openModal(p)}>Ubah</Button></Td></Tr>)}</Tbody></Table>;
            case 'City': return <Table><Thead><Tr><Th>Nama Kota/Kab.</Th><Th>Kode</Th><Th>Provinsi</Th><Th>Aksi</Th></Tr></Thead><Tbody>{cities.map(c => <Tr key={c.id}><Td>{c.name}</Td><Td>{c.code}</Td><Td>{provinceMap.get(c.provinceId) || 'N/A'}</Td><Td><Button variant="ghost" size="sm" onClick={() => modalState.openModal(c)}>Ubah</Button></Td></Tr>)}</Tbody></Table>;
            case 'District': return <Table><Thead><Tr><Th>Nama Kecamatan</Th><Th>Kode</Th><Th>Kota/Kab.</Th><Th>Aksi</Th></Tr></Thead><Tbody>{districts.map(d => <Tr key={d.id}><Td>{d.name}</Td><Td>{d.code}</Td><Td>{cityMap.get(d.cityId) || 'N/A'}</Td><Td><Button variant="ghost" size="sm" onClick={() => modalState.openModal(d)}>Ubah</Button></Td></Tr>)}</Tbody></Table>;
            case 'Village': return <Table><Thead><Tr><Th>Nama Desa/Kel.</Th><Th>Kecamatan</Th><Th>Aksi</Th></Tr></Thead><Tbody>{villages.map(v => <Tr key={v.id}><Td>{v.name}</Td><Td>{districtMap.get(v.districtId) || 'N/A'}</Td><Td><Button variant="ghost" size="sm" onClick={() => modalState.openModal(v)}>Ubah</Button></Td></Tr>)}</Tbody></Table>;
        }
    };


    return (
        <div className="p-8 h-full flex flex-col">
            <PageHeader title="Manajemen Area">
                 <Button onClick={() => modalState.openModal()}>Tambah {tabLabels[view]}</Button>
            </PageHeader>
            <div className="flex space-x-2 border-b dark:border-gray-700 mb-4">
                {(tabs as ('Province' | 'City' | 'District' | 'Village')[]).map((tab) => (
                    <button 
                        key={tab}
                        onClick={() => setView(tab)} 
                        className={`py-2 px-4 text-sm font-medium ${view === tab ? 'border-b-2 border-primary-500 text-primary-500' : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'}`}
                    >
                        {tabLabels[tab]}
                    </button>
                ))}
            </div>
            <Card className="flex-grow overflow-y-auto">
                {renderTable()}
            </Card>
            <AreaModal
                isOpen={modalState.isOpen}
                onClose={modalState.closeModal}
                onSave={handleSave}
                type={view}
                existingItem={modalState.editingItem}
            />
        </div>
    );
};
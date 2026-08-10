import React, { useState, useMemo, useEffect } from 'react';
import { useAppContext } from '../hooks/useAppContext';
import { Asset, AssetCategory, Status } from '../types';
import { Select, Card, Button, Input, Label, Modal, ActionsDropdown, DropdownItem } from './ui';

const AssetModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  existingAsset: Asset | null;
}> = ({ isOpen, onClose, existingAsset }) => {
    const { state, dispatch } = useAppContext();
    const { assetCategories, branches, currentUser } = state;
    const [formData, setFormData] = useState<Partial<Asset>>({});

    useEffect(() => {
        if (isOpen) {
            setFormData(existingAsset || { 
                name: '', 
                assetCategoryId: '', 
                purchaseDate: new Date().toISOString().split('T')[0],
                value: 0,
                status: 'active',
                branchId: currentUser?.branchId || ''
            });
        }
    }, [isOpen, existingAsset, currentUser]);
    
    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const payload = { ...formData, value: Number(formData.value) || 0 };
        if (existingAsset) {
            dispatch({ type: 'assets/update', payload: payload as Asset });
        } else {
            dispatch({ type: 'assets/add', payload: { ...payload, status: 'active' } as Omit<Asset, 'id'> });
        }
        onClose();
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={`${existingAsset ? 'Ubah' : 'Tambah'} Aset`}>
            <form onSubmit={handleSubmit} className="space-y-4">
                <Input value={formData.name || ''} onChange={e => setFormData({...formData, name: e.target.value})} placeholder="Nama Aset" required />
                <Select value={formData.assetCategoryId || ''} onChange={e => setFormData({...formData, assetCategoryId: e.target.value})} required>
                    <option value="">-- Pilih Kategori --</option>
                    {assetCategories.map(cat => <option key={cat.id} value={cat.id}>{cat.name}</option>)}
                </Select>
                <Input type="date" value={formData.purchaseDate || ''} onChange={e => setFormData({...formData, purchaseDate: e.target.value})} required />
                <Input type="number" value={formData.value || ''} onChange={e => setFormData({...formData, value: Number(e.target.value)})} placeholder="Nilai Aset (Rp)" required />
                <Select value={formData.branchId || ''} onChange={e => setFormData({...formData, branchId: e.target.value})} required>
                    <option value="">-- Pilih Cabang --</option>
                    {branches.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                </Select>
                 {existingAsset && (
                    <Select value={formData.status || ''} onChange={e => setFormData({...formData, status: e.target.value as Status})}>
                        <option value="active">Aktif</option>
                        <option value="inactive">Non-Aktif</option>
                        <option value="archived">Diarsipkan</option>
                    </Select>
                )}
                <div className="flex justify-end gap-2 pt-4">
                    <Button variant="secondary" onClick={onClose}>Batal</Button>
                    <Button type="submit">Simpan</Button>
                </div>
            </form>
        </Modal>
    );
};


// --- Page 1: Asset List ---
export const AssetListPage: React.FC = () => {
  const { state, dispatch } = useAppContext();
  const { assets, assetCategories } = state;
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingAsset, setEditingAsset] = useState<Asset | null>(null);

  const categoryMap = useMemo(() =>
    new Map(assetCategories.map(cat => [cat.id, cat.name])),
    [assetCategories]
  );

  const handleOpenModal = (asset: Asset | null = null) => {
    setEditingAsset(asset);
    setIsModalOpen(true);
  };
  
  const handleSetStatus = (id: string, status: Status) => {
    if (confirm(`Anda yakin ingin mengubah status aset ini menjadi ${status}?`)) {
        dispatch({ type: 'assets/setStatus', payload: { id, status } });
    }
  };

  return (
    <div className="p-8 h-full flex flex-col">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Data Aset</h1>
        <Button onClick={() => handleOpenModal(null)}>Tambah Aset</Button>
      </div>
      <div className="flex-grow bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-x-auto">
        <table className="w-full text-sm text-left text-gray-500 dark:text-gray-400">
          <thead className="text-xs text-gray-700 uppercase bg-gray-50 dark:bg-gray-700 dark:text-gray-400">
            <tr>
              <th scope="col" className="px-6 py-3">Nama Aset</th>
              <th scope="col" className="px-6 py-3">Kategori</th>
              <th scope="col" className="px-6 py-3">Tanggal Pembelian</th>
              <th scope="col" className="px-6 py-3">Nilai</th>
              <th scope="col" className="px-6 py-3">Status</th>
              <th scope="col" className="px-6 py-3">Aksi</th>
            </tr>
          </thead>
          <tbody>
            {assets.map((asset) => (
              <tr key={asset.id} className="bg-white dark:bg-gray-800 border-b dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600">
                <td className="px-6 py-4 font-medium text-gray-900 dark:text-white">{asset.name}</td>
                <td className="px-6 py-4">{categoryMap.get(asset.assetCategoryId) || 'N/A'}</td>
                <td className="px-6 py-4">{new Date(asset.purchaseDate).toLocaleDateString('id-ID')}</td>
                <td className="px-6 py-4">Rp{asset.value.toLocaleString('id-ID')}</td>
                <td className="px-6 py-4">{asset.status}</td>
                 <td className="px-6 py-4">
                    <ActionsDropdown>
                        <DropdownItem onClick={() => handleOpenModal(asset)}>Ubah</DropdownItem>
                        {asset.status !== 'archived' && (
                            <DropdownItem onClick={() => handleSetStatus(asset.id, asset.status === 'active' ? 'inactive' : 'active')}>
                                {asset.status === 'active' ? 'Non-aktifkan' : 'Aktifkan'}
                            </DropdownItem>
                        )}
                        {asset.status !== 'archived' && (
                            <DropdownItem onClick={() => handleSetStatus(asset.id, 'archived')} className="text-red-600 dark:text-red-500">
                                Arsipkan
                            </DropdownItem>
                        )}
                    </ActionsDropdown>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <AssetModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} existingAsset={editingAsset} />
    </div>
  );
};


// --- Page 2: Purchase Asset ---
export const AssetPurchasePage: React.FC = () => {
  const { state, dispatch } = useAppContext();
  const [name, setName] = useState('');
  const [assetCategoryId, setAssetCategoryId] = useState('');
  const [purchaseDate, setPurchaseDate] = useState(new Date().toISOString().split('T')[0]);
  const [value, setValue] = useState('');
  const [cashAccountId, setCashAccountId] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  
  const cashAccounts = useMemo(() => state.accounts.filter(a => a.isCashAccount), [state.accounts]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!state.currentBranchId || !cashAccountId) {
        alert("Error: Tidak ada cabang atau rekening sumber yang dipilih.");
        return;
    }
    const assetData: Omit<Asset, 'id'> = {
      branchId: state.currentBranchId,
      name,
      assetCategoryId,
      purchaseDate,
      value: parseFloat(value),
      status: 'active',
    };
    dispatch({
      type: 'assets/recordPurchase',
      payload: { assetData, cashAccountId }
    });
    setSuccessMessage(`Aset "${name}" berhasil dicatat.`);
    setName(''); setAssetCategoryId(''); setValue(''); setCashAccountId('');
    setTimeout(() => setSuccessMessage(''), 5000);
  };

  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-6">Catat Pembelian Aset Baru</h1>
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-8 w-full max-w-2xl mx-auto">
        {successMessage && <div className="mb-4 p-4 text-sm text-green-700 bg-green-100 rounded-lg dark:bg-green-200 dark:text-green-800">{successMessage}</div>}
        <form onSubmit={handleSubmit} className="space-y-6">
            <div>
                <Label>Nama Aset</Label>
                <Input type="text" value={name} onChange={(e) => setName(e.target.value)} required />
            </div>
            <div>
                <Label>Kategori</Label>
                <Select value={assetCategoryId} onChange={e => setAssetCategoryId(e.target.value)} required>
                    <option value="">-- Pilih Kategori --</option>
                    {state.assetCategories.map(cat => <option key={cat.id} value={cat.id}>{cat.name}</option>)}
                </Select>
            </div>
            <div className="grid grid-cols-2 gap-4">
                <div>
                    <Label>Tanggal Pembelian</Label>
                    <Input type="date" value={purchaseDate} onChange={(e) => setPurchaseDate(e.target.value)} required />
                </div>
                <div>
                    <Label>Nilai Pembelian (Rp)</Label>
                    <Input type="number" step="1" value={value} onChange={(e) => setValue(e.target.value)} required />
                </div>
            </div>
             <div>
                <Label>Sumber Pembayaran</Label>
                <Select value={cashAccountId} onChange={e => setCashAccountId(e.target.value)} required>
                    <option value="">-- Pilih Rekening Kas --</option>
                    {cashAccounts.map(acc => <option key={acc.id} value={acc.id}>{acc.name}</option>)}
                </Select>
            </div>
            <div className="flex justify-end pt-4">
                <Button type="submit">Catat Pembelian</Button>
            </div>
        </form>
      </div>
    </div>
  );
};

// --- Page 3: Sale Asset ---
export const AssetSalePage: React.FC = () => {
    const { state, dispatch } = useAppContext();
    const { assets } = state;
    const [assetId, setAssetId] = useState('');
    const [salePrice, setSalePrice] = useState('');
    const [cashAccountId, setCashAccountId] = useState('');
    const [successMessage, setSuccessMessage] = useState('');

    const cashAccounts = useMemo(() => state.accounts.filter(a => a.isCashAccount), [state.accounts]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!assetId || !cashAccountId) {
            alert("Silakan pilih aset dan rekening tujuan.");
            return;
        }
        const assetName = assets.find(a => a.id === assetId)?.name || 'Aset';
        dispatch({
            type: 'assets/recordSale',
            payload: {
                assetId,
                salePrice: parseFloat(salePrice),
                cashAccountId,
            }
        });
        setSuccessMessage(`Penjualan ${assetName} berhasil dicatat.`);
        setAssetId(''); setSalePrice(''); setCashAccountId('');
        setTimeout(() => setSuccessMessage(''), 5000);
    };

    return (
        <div className="p-8">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-6">Catat Penjualan Aset</h1>
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-8 w-full max-w-2xl mx-auto">
                {successMessage && <div className="mb-4 p-4 text-sm text-green-700 bg-green-100 rounded-lg dark:bg-green-200 dark:text-green-800">{successMessage}</div>}
                <form onSubmit={handleSubmit} className="space-y-6">
                    <div>
                        <Label>Aset yang Dijual</Label>
                        <Select value={assetId} onChange={e => setAssetId(e.target.value)} required>
                            <option value="">-- Pilih Aset --</option>
                            {assets.map(asset => <option key={asset.id} value={asset.id}>{asset.name} (Nilai Buku: Rp{asset.value.toLocaleString('id-ID')})</option>)}
                        </Select>
                    </div>
                    <div>
                        <Label>Harga Jual (Rp)</Label>
                        <Input type="number" step="1" value={salePrice} onChange={e => setSalePrice(e.target.value)} required />
                    </div>
                    <div>
                        <Label>Dana Masuk Ke</Label>
                        <Select value={cashAccountId} onChange={e => setCashAccountId(e.target.value)} required>
                            <option value="">-- Pilih Rekening Kas --</option>
                            {cashAccounts.map(acc => <option key={acc.id} value={acc.id}>{acc.name}</option>)}
                        </Select>
                    </div>
                    <div className="flex justify-end pt-4">
                        <Button type="submit">Catat Penjualan</Button>
                    </div>
                </form>
            </div>
        </div>
    );
};

// --- Page 4: Asset Category Management ---
const AssetCategoryModal: React.FC<{
    isOpen: boolean;
    onClose: () => void;
    onSave: (category: Omit<AssetCategory, 'id'> | AssetCategory) => void;
    existingCategory: AssetCategory | null;
}> = ({ isOpen, onClose, onSave, existingCategory }) => {
    const [name, setName] = useState('');
    const [code, setCode] = useState('');

    useEffect(() => {
        if (isOpen) {
            setName(existingCategory?.name || '');
            setCode(existingCategory?.code || '');
        }
    }, [isOpen, existingCategory]);
    
    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const categoryData = { name, code };
        if (existingCategory) {
            onSave({ ...existingCategory, ...categoryData });
        } else {
            onSave(categoryData);
        }
        onClose();
    };

    const footer = <Button onClick={handleSubmit}>Simpan</Button>;

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={`${existingCategory ? 'Ubah' : 'Tambah'} Kategori Aset`} footer={footer}>
            <form onSubmit={handleSubmit} className="space-y-4">
                <Input value={name} onChange={e => setName(e.target.value)} placeholder="Nama Kategori" required />
                <Input value={code} onChange={e => setCode(e.target.value)} placeholder="Kode Kategori (e.g., AL)" required />
            </form>
        </Modal>
    );
}

export const AssetCategoryManagementPage: React.FC = () => {
    const { state, dispatch } = useAppContext();
    const { assetCategories } = state;
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingCategory, setEditingCategory] = useState<AssetCategory | null>(null);

    const handleOpenModal = (category: AssetCategory | null = null) => {
        setEditingCategory(category);
        setIsModalOpen(true);
    };

    const handleSave = (category: Omit<AssetCategory, 'id'> | AssetCategory) => {
        if ('id' in category) {
            dispatch({ type: 'assets/updateCategory', payload: category });
        } else {
            dispatch({ type: 'assets/addCategory', payload: category as Omit<AssetCategory, 'id'> });
        }
    };

    return (
        <div className="p-8 h-full flex flex-col">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-3xl font-bold">Kelola Kategori Aset</h1>
                <Button onClick={() => handleOpenModal()}>Tambah Kategori</Button>
            </div>
            <Card className="flex-grow overflow-y-auto">
                <table className="w-full text-sm">
                    <thead>
                        <tr>
                            <th className="px-6 py-3 text-left">Nama Kategori</th>
                            <th className="px-6 py-3 text-left">Kode</th>
                            <th className="px-6 py-3">Aksi</th>
                        </tr>
                    </thead>
                    <tbody>
                        {assetCategories.map(cat => (
                            <tr key={cat.id} className="border-t dark:border-gray-700">
                                <td className="px-6 py-4 font-medium">{cat.name}</td>
                                <td className="px-6 py-4 font-mono">{cat.code}</td>
                                <td className="px-6 py-4">
                                     <ActionsDropdown>
                                        <DropdownItem onClick={() => handleOpenModal(cat)}>Ubah</DropdownItem>
                                    </ActionsDropdown>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </Card>
            <AssetCategoryModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} onSave={handleSave} existingCategory={editingCategory} />
        </div>
    );
};
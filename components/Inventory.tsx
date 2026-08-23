import React, { useState, useMemo } from 'react';
import { Product, StockMovement, Shelf, ProductCategory, PurchaseOrder, InventoryLevel, StockTransfer, Warehouse, Branch } from '../types';
import { useAppContext } from '../hooks/useAppContext';
import { Card, Button, Input, Select, Label, ActionsDropdown, DropdownItem } from './ui';

// --- Page: Inventory Adjustment ---

const StockAdjustModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  product: Product | null;
  currentStock: number;
  onAdjustStock: (productId: string, newStock: number, reason: string) => void;
}> = ({ isOpen, onClose, product, currentStock, onAdjustStock }) => {
  const [newStock, setNewStock] = useState<string>('');
  const [reason, setReason] = useState('');

  React.useEffect(() => {
    if (product) {
      setNewStock(currentStock.toString());
      setReason('');
    }
  }, [product, currentStock]);

  if (!isOpen || !product) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!reason) {
        alert("A reason for the adjustment is required.");
        return;
    }
    onAdjustStock(product.id, parseInt(newStock, 10), reason);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-8 w-full max-w-lg">
        <h2 className="text-2xl font-bold mb-2 text-gray-900 dark:text-white">Adjust Stock</h2>
        <p className="mb-6 text-gray-600 dark:text-gray-300">for <span className="font-semibold">{product.name}</span></p>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Current Stock</label>
            <input type="text" value={currentStock} disabled className="mt-1 block w-full rounded-md bg-gray-200 dark:bg-gray-600 border-transparent" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">New Stock Quantity</label>
            <input type="number" value={newStock} onChange={(e) => setNewStock(e.target.value)} required className="mt-1 block w-full rounded-md bg-gray-100 dark:bg-gray-700 border-transparent focus:border-primary-500 focus:bg-white dark:focus:bg-gray-600 focus:ring-0" />
          </div>
           <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Reason for Adjustment</label>
            <input type="text" value={reason} onChange={(e) => setReason(e.target.value)} required placeholder="e.g., Stocktake, Damaged goods" className="mt-1 block w-full rounded-md bg-gray-100 dark:bg-gray-700 border-transparent focus:border-primary-500 focus:bg-white dark:focus:bg-gray-600 focus:ring-0" />
          </div>
          <div className="flex justify-end space-x-4 pt-4">
            <button type="button" onClick={onClose} className="px-4 py-2 rounded-md text-gray-700 dark:text-gray-200 bg-gray-200 dark:bg-gray-600 hover:bg-gray-300 dark:hover:bg-gray-500">Cancel</button>
            <Button type="submit">Save Adjustment</Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export const InventoryAdjustmentPage: React.FC = () => {
  const { state, dispatch } = useAppContext();
  const { products, stockMovements, productCategories, inventoryLevels, currentBranchId, productTypeLocations, shelves, branches, branchTypes } = state;
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [view, setView] = useState<'overview' | 'history'>('overview');

  const onAdjustStock = (productId: string, newStock: number, reason: string) => {
    if (!currentBranchId) return;
    dispatch({ type: 'inventory/adjustStock', payload: { productId, newStock, reason, locationId: currentBranchId } });
  };

  const handleOpenModal = (product: Product) => {
    setSelectedProduct(product);
    setIsModalOpen(true);
  };
  
  const branchInventory = useMemo(() => {
    if (!currentBranchId) return new Map<string, InventoryLevel>();
    return new Map(inventoryLevels.filter(inv => inv.locationId === currentBranchId).map(inv => [inv.productId, inv]));
  }, [inventoryLevels, currentBranchId]);

  const shelfMap = useMemo(() => new Map(shelves.map(s => [s.id, s.code])), [shelves]);
  const productLocationMap = useMemo(() => {
      const map = new Map<string, string>();
      if (!currentBranchId) return map;
  
      const currentBranch = branches.find(b => b.id === currentBranchId);
      if (!currentBranch) return map;
      
      const currentBranchType = branchTypes.find(bt => bt.id === currentBranch.branchTypeId);
      if (!currentBranchType) return map;
  
      productTypeLocations
          .filter(ptl => ptl.locationTypeId === currentBranchType.id && ptl.locationType === 'branch')
          .forEach(ptl => {
              const shelfCode = ptl.shelfId ? shelfMap.get(ptl.shelfId) : '';
              map.set(ptl.productId, `${shelfCode || ''}${ptl.shelvingNumber ? `-${ptl.shelvingNumber}` : ''}`);
          });
      return map;
  }, [productTypeLocations, shelves, currentBranchId, branches, branchTypes, shelfMap]);

  const getStatus = (product: Product) => {
    const stock = branchInventory.get(product.id)?.quantity || 0;
    const reorderPoint = product.reorderPoint || 5;
    if (stock <= 0) return <span className="px-2 py-1 text-xs font-semibold rounded-full bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300">Out of Stock</span>;
    if (stock <= reorderPoint) return <span className="px-2 py-1 text-xs font-semibold rounded-full bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300">Low Stock</span>;
    return <span className="px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300">In Stock</span>;
  };

  const categoryMap = useMemo(() =>
    productCategories.reduce((acc, cat) => {
        acc[cat.id] = cat.name;
        return acc;
    }, {} as Record<string, string>),
  [productCategories]);

  const branchStockMovements = useMemo(() => {
    if (!currentBranchId) return [];
    return stockMovements.filter(m => m.locationId === currentBranchId);
  }, [stockMovements, currentBranchId])
  
  return (
    <div className="p-8 h-full flex flex-col">
      <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">Penyesuaian Inventaris</h1>
      <div className="flex space-x-2 border-b dark:border-gray-700 mb-4">
        <button onClick={() => setView('overview')} className={`py-2 px-4 text-sm font-medium ${view === 'overview' ? 'border-b-2 border-primary-500 text-primary-500' : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'}`}>Stock Overview</button>
        <button onClick={() => setView('history')} className={`py-2 px-4 text-sm font-medium ${view === 'history' ? 'border-b-2 border-primary-500 text-primary-500' : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'}`}>Stock Movement History</button>
      </div>
      
      <div className="flex-grow bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-y-auto">
        {view === 'overview' ? (
            <table className="w-full text-sm text-left text-gray-500 dark:text-gray-400">
              <thead className="text-xs text-gray-700 uppercase bg-gray-50 dark:bg-gray-700 dark:text-gray-400 sticky top-0">
                <tr>
                  <th scope="col" className="px-6 py-3">Product</th>
                  <th scope="col" className="px-6 py-3">Lokasi Rak</th>
                  <th scope="col" className="px-6 py-3">Stok Saat Ini</th>
                  <th scope="col" className="px-6 py-3">Status</th>
                  <th scope="col" className="px-6 py-3">Actions</th>
                </tr>
              </thead>
              <tbody>
                {products.map((product) => (
                  <tr key={product.id} className="bg-white dark:bg-gray-800 border-b dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600">
                    <td className="px-6 py-4 font-medium text-gray-900 whitespace-nowrap dark:text-white">{product.name}</td>
                    <td className="px-6 py-4 font-mono">{productLocationMap.get(product.id) || '-'}</td>
                    <td className="px-6 py-4 font-bold">{branchInventory.get(product.id)?.quantity || 0}</td>
                    <td className="px-6 py-4">{getStatus(product)}</td>
                    <td className="px-6 py-4">
                      <button onClick={() => handleOpenModal(product)} className="font-medium text-primary-600 dark:text-primary-500 hover:underline">Adjust</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
        ) : (
             <table className="w-full text-sm text-left text-gray-500 dark:text-gray-400">
              <thead className="text-xs text-gray-700 uppercase bg-gray-50 dark:bg-gray-700 dark:text-gray-400 sticky top-0">
                <tr>
                  <th scope="col" className="px-6 py-3">Date</th>
                  <th scope="col" className="px-6 py-3">Product</th>
                  <th scope="col" className="px-6 py-3">Type</th>
                  <th scope="col" className="px-6 py-3">Quantity Change</th>
                  <th scope="col" className="px-6 py-3">New Stock Level</th>
                  <th scope="col" className="px-6 py-3">Reason / Reference</th>
                </tr>
              </thead>
              <tbody>
                {branchStockMovements.map((move) => (
                  <tr key={move.id} className="bg-white dark:bg-gray-800 border-b dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600">
                    <td className="px-6 py-4">{new Date(move.date).toLocaleString()}</td>
                    <td className="px-6 py-4 font-medium text-gray-900 dark:text-white">{move.productName}</td>
                    <td className="px-6 py-4">{move.type}</td>
                    <td className={`px-6 py-4 font-semibold ${move.quantityChange > 0 ? 'text-green-500' : 'text-red-500'}`}>{move.quantityChange > 0 ? `+${move.quantityChange}` : move.quantityChange}</td>
                    <td className="px-6 py-4 font-bold">{move.newStockLevel}</td>
                    <td className="px-6 py-4 italic">{move.notes}</td>
                  </tr>
                ))}
              </tbody>
            </table>
        )}
      </div>
      <StockAdjustModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} product={selectedProduct} currentStock={branchInventory.get(selectedProduct?.id || '')?.quantity || 0} onAdjustStock={onAdjustStock} />
    </div>
  );
};


// --- Page: Manage Shelves ---
const ShelfModal: React.FC<{
    isOpen: boolean;
    onClose: () => void;
    onSave: (shelf: Omit<Shelf, 'id'> | Shelf) => void;
    existingShelf: Shelf | null;
}> = ({ isOpen, onClose, onSave, existingShelf }) => {
    const { state } = useAppContext();
    const { warehouses, branches, warehouseTypes, branchTypes } = state;

    const [code, setCode] = useState('');
    const [description, setDescription] = useState('');
    const [shelvingCount, setShelvingCount] = useState(1);
    const [locationType, setLocationType] = useState<'warehouse' | 'branch'>('warehouse');
    const [selectedLocationTypeId, setSelectedLocationTypeId] = useState('');
    const [locationId, setLocationId] = useState('');

    React.useEffect(() => {
        if (isOpen) {
            if (existingShelf) {
                setCode(existingShelf.code);
                setDescription(existingShelf.description || '');
                setShelvingCount(existingShelf.shelvingCount);
                setLocationType(existingShelf.locationType);
                setLocationId(existingShelf.locationId);

                const isWarehouse = existingShelf.locationType === 'warehouse';
                if (isWarehouse) {
                    const location = warehouses.find(w => w.id === existingShelf.locationId);
                    setSelectedLocationTypeId(location?.warehouseTypeId || '');
                } else {
                    const location = branches.find(b => b.id === existingShelf.locationId);
                    setSelectedLocationTypeId(location?.branchTypeId || '');
                }
            } else {
                setCode('');
                setDescription('');
                setShelvingCount(1);
                setLocationType('warehouse');
                setSelectedLocationTypeId('');
                setLocationId('');
            }
        }
    }, [isOpen, existingShelf, warehouses, branches]);
    
    const availableLocationTypes = useMemo(() => {
        return locationType === 'warehouse' ? warehouseTypes : branchTypes;
    }, [locationType, warehouseTypes, branchTypes]);

    const availableLocations = useMemo(() => {
        if (!selectedLocationTypeId) return [];
        return locationType === 'warehouse' 
            ? warehouses.filter(w => w.warehouseTypeId === selectedLocationTypeId)
            : branches.filter(b => b.branchTypeId === selectedLocationTypeId);
    }, [selectedLocationTypeId, locationType, warehouses, branches]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const defaultLocationId = branches[0]?.id || warehouses[0]?.id || 'branch-1';
        const shelfData = { 
            code, 
            description, 
            shelvingCount, 
            locationType: 'branch' as const, 
            locationId: defaultLocationId 
        };
        if (existingShelf) {
            onSave({ ...existingShelf, ...shelfData });
        } else {
            onSave(shelfData);
        }
        onClose();
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-8 w-full max-w-lg">
                <h2 className="text-2xl font-bold mb-6 text-gray-900 dark:text-white">{existingShelf ? 'Ubah' : 'Tambah'} Rak</h2>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <Label>Kode Rak</Label>
                            <Input value={code} onChange={e => setCode(e.target.value)} placeholder="e.g., A-01" required />
                        </div>
                        <div>
                            <Label>Jumlah Selving</Label>
                            <Input type="number" value={shelvingCount} onChange={e => setShelvingCount(parseInt(e.target.value) || 1)} placeholder="Jumlah Selving" required min="1" />
                        </div>
                    </div>
                    <div>
                        <Label>Deskripsi Rak</Label>
                        <Input value={description} onChange={e => setDescription(e.target.value)} placeholder="e.g., Lorong depan" />
                    </div>
                     <div className="flex justify-end space-x-4 pt-4 border-t dark:border-gray-700">
                        <button type="button" onClick={onClose} className="px-4 py-2 rounded-md text-gray-700 dark:text-gray-200 bg-gray-200 dark:bg-gray-600 hover:bg-gray-300">Batal</button>
                        <Button type="submit">Simpan</Button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export const ManageShelvesPage: React.FC = () => {
    const { state, dispatch } = useAppContext();
    const { shelves, warehouses, branches } = state;
    const [isModalOpen, setModalOpen] = useState(false);
    const [editingShelf, setEditingShelf] = useState<Shelf | null>(null);

     const locationMap = useMemo(() => {
        const map = new Map<string, string>();
        warehouses.forEach(w => map.set(w.id, w.name));
        branches.forEach(b => map.set(b.id, `Toko: ${b.name}`));
        return map;
    }, [warehouses, branches]);
    
    const handleOpenModal = (shelf: Shelf | null = null) => {
        setEditingShelf(shelf);
        setModalOpen(true);
    };

    const handleSave = (shelf: Omit<Shelf, 'id'> | Shelf) => {
        if ('id' in shelf) {
            dispatch({ type: 'inventory/updateShelf', payload: shelf });
        } else {
            dispatch({ type: 'inventory/addShelf', payload: shelf as Omit<Shelf, 'id'> });
        }
    };

    const handleDelete = (shelfId: string) => {
        if (window.confirm("Anda yakin ingin menghapus rak ini? Aksi ini tidak dapat diurungkan.")) {
            dispatch({ type: 'inventory/deleteShelf', payload: shelfId });
        }
    };

    return (
        <div className="p-8 h-full flex flex-col">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Kelola Rak</h1>
                <Button onClick={() => handleOpenModal()}>Tambah Rak</Button>
            </div>
            <Card className="flex-grow overflow-y-auto">
                <table className="w-full text-sm text-left text-gray-500 dark:text-gray-400">
                    <thead className="text-xs text-gray-700 uppercase bg-gray-50 dark:bg-gray-700 dark:text-gray-400">
                        <tr>
                            <th scope="col" className="px-6 py-3">Kode Rak</th>
                            <th scope="col" className="px-6 py-3">Deskripsi</th>
                            <th scope="col" className="px-6 py-3">Jumlah Selving</th>
                            <th scope="col" className="px-6 py-3">Aksi</th>
                        </tr>
                    </thead>
                    <tbody>
                        {shelves.map(shelf => (
                            <tr key={shelf.id} className="bg-white dark:bg-gray-800 border-b dark:border-gray-700">
                                <td className="px-6 py-4 font-bold">{shelf.code}</td>
                                <td className="px-6 py-4">{shelf.description || '-'}</td>
                                <td className="px-6 py-4">{shelf.shelvingCount}</td>
                                <td className="px-6 py-4 space-x-2">
                                    <button onClick={() => handleOpenModal(shelf)} className="font-medium text-primary-600 dark:text-primary-500 hover:underline">Ubah</button>
                                    <button onClick={() => handleDelete(shelf.id)} className="font-medium text-red-600 dark:text-red-500 hover:underline">Hapus</button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </Card>
            <ShelfModal isOpen={isModalOpen} onClose={() => setModalOpen(false)} onSave={handleSave} existingShelf={editingShelf} />
        </div>
    );
};

// --- Page: Product Categories ---

const CategoryModal: React.FC<{
    isOpen: boolean;
    onClose: () => void;
    onSave: (category: Omit<ProductCategory, 'id'> | ProductCategory) => void;
    categories: ProductCategory[];
    existingCategory: ProductCategory | null;
}> = ({ isOpen, onClose, onSave, categories, existingCategory }) => {
    const [name, setName] = useState('');
    const [parentId, setParentId] = useState('');

    React.useEffect(() => {
        if (isOpen) {
            if (existingCategory) {
                setName(existingCategory.name);
                setParentId(existingCategory.parentId || '');
            } else {
                setName('');
                setParentId('');
            }
        }
    }, [isOpen, existingCategory]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const categoryData = { name, parentId: parentId || undefined };
        if (existingCategory) {
            onSave({ ...existingCategory, ...categoryData });
        } else {
            onSave(categoryData);
        }
        onClose();
    }
    if (!isOpen) return null;
    return (
         <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-8 w-full max-w-lg">
                <h2 className="text-2xl font-bold mb-6 text-gray-900 dark:text-white">{existingCategory ? 'Ubah' : 'Tambah'} Kategori</h2>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <Input value={name} onChange={e => setName(e.target.value)} placeholder="Nama Kategori" required />
                    <select value={parentId} onChange={e => setParentId(e.target.value)} className="mt-1 block w-full rounded-md bg-gray-100 dark:bg-gray-700 border-transparent">
                        <option value="">-- Tanpa Induk (Level Atas) --</option>
                        {categories.filter(c => !c.parentId && c.id !== existingCategory?.id).map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>
                     <div className="flex justify-end space-x-4 pt-4">
                        <button type="button" onClick={onClose} className="px-4 py-2 rounded-md text-gray-700 dark:text-gray-200 bg-gray-200 dark:bg-gray-600">Batal</button>
                        <Button type="submit">Simpan</Button>
                    </div>
                </form>
            </div>
        </div>
    );
}

export const ProductCategoriesPage: React.FC = () => {
    const { state, dispatch } = useAppContext();
    const { productCategories } = state;
    const [isModalOpen, setModalOpen] = useState(false);
    const [editingCategory, setEditingCategory] = useState<ProductCategory | null>(null);

    const handleOpenModal = (category: ProductCategory | null = null) => {
        setEditingCategory(category);
        setModalOpen(true);
    };
    
    const handleSave = (category: Omit<ProductCategory, 'id'> | ProductCategory) => {
        if ('id' in category) {
            dispatch({ type: 'products/updateCategory', payload: category });
        } else {
            dispatch({ type: 'products/addCategory', payload: category });
        }
    };

    const handleDelete = (categoryId: string) => {
        if (window.confirm("Anda yakin ingin menghapus kategori ini? Aksi ini tidak dapat diurungkan.")) {
            dispatch({ type: 'products/deleteCategory', payload: categoryId });
        }
    };

    const categoryTree = useMemo(() => {
        const topLevel = productCategories.filter(c => !c.parentId);
        return topLevel.map(parent => ({
            ...parent,
            children: productCategories.filter(c => c.parentId === parent.id)
        }));
    }, [productCategories]);

    return (
        <div className="p-8 h-full flex flex-col">
             <div className="flex justify-between items-center mb-6">
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Kategori Produk</h1>
                <Button onClick={() => handleOpenModal()}>Tambah Kategori</Button>
            </div>
            <Card className="flex-grow overflow-y-auto">
               {categoryTree.map(parent => (
                   <div key={parent.id} className="mb-4">
                       <div className="flex justify-between items-center bg-gray-100 dark:bg-gray-700 p-2 rounded">
                           <h3 className="text-lg font-semibold">{parent.name}</h3>
                           <div className="space-x-2">
                                <button onClick={() => handleOpenModal(parent)} className="text-xs font-medium text-primary-600 dark:text-primary-500 hover:underline">Ubah</button>
                                <button onClick={() => handleDelete(parent.id)} className="text-xs font-medium text-red-600 dark:text-red-500 hover:underline">Hapus</button>
                           </div>
                       </div>
                       <ul className="list-disc ml-8 mt-2 space-y-1">
                           {parent.children.map(child => (
                               <li key={child.id} className="flex justify-between items-center">
                                   <span>{child.name}</span>
                                    <div className="space-x-2">
                                        <button onClick={() => handleOpenModal(child)} className="text-xs font-medium text-primary-600 dark:text-primary-500 hover:underline">Ubah</button>
                                        <button onClick={() => handleDelete(child.id)} className="text-xs font-medium text-red-600 dark:text-red-500 hover:underline">Hapus</button>
                                    </div>
                               </li>
                            ))}
                       </ul>
                   </div>
               ))}
            </Card>
            <CategoryModal isOpen={isModalOpen} onClose={() => setModalOpen(false)} onSave={handleSave} categories={productCategories} existingCategory={editingCategory} />
        </div>
    );
};

// --- Page: Goods Receipt (Receiving PO at Warehouse) ---

export const GoodsReceiptPage: React.FC = () => {
    const { state, dispatch } = useAppContext();
    const pendingPurchases = useMemo(() => state.purchases.filter(p => p.status === 'Pending'), [state.purchases]);

    const onReceivePurchaseOrder = (purchaseId: string) => {
        if (window.confirm('Are you sure you want to receive stock for this order? This action cannot be undone.')) {
            dispatch({ type: 'purchases/receive', payload: purchaseId });
        }
    };

    return (
        <div className="p-8 h-full flex flex-col">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-6">Penerimaan Barang (Gudang)</h1>
            <Card className="flex-grow overflow-y-auto">
                 <table className="w-full text-sm text-left text-gray-500 dark:text-gray-400">
                    <thead className="text-xs text-gray-700 uppercase bg-gray-50 dark:bg-gray-700 dark:text-gray-400">
                        <tr>
                            <th scope="col" className="px-6 py-3">ID Pesanan</th>
                            <th scope="col" className="px-6 py-3">Vendor</th>
                            <th scope="col" className="px-6 py-3">Perkiraan Tiba</th>
                            <th scope="col" className="px-6 py-3 text-right">Total</th>
                            <th scope="col" className="px-6 py-3 text-center">Aksi</th>
                        </tr>
                    </thead>
                    <tbody>
                        {pendingPurchases.map((po) => (
                            <tr key={po.id} className="bg-white dark:bg-gray-800 border-b dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600">
                                <td className="px-6 py-4 font-medium">{po.id}</td>
                                <td className="px-6 py-4">{po.vendorName}</td>
                                <td className="px-6 py-4">{new Date(po.expectedDelivery).toLocaleDateString()}</td>
                                <td className="px-6 py-4 font-semibold text-right">Rp{po.grandTotal.toLocaleString('id-ID')}</td>
                                <td className="px-6 py-4 text-center">
                                    <button onClick={() => onReceivePurchaseOrder(po.id)} className="font-medium text-green-600 dark:text-green-500 hover:underline">
                                        Terima Stok
                                    </button>
                                </td>
                            </tr>
                        ))}
                         {pendingPurchases.length === 0 && (
                            <tr>
                                <td colSpan={5} className="text-center p-8 text-gray-500">Tidak ada pembelian yang menunggu penerimaan.</td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </Card>
        </div>
    );
};


// --- Page: Stock Transfer ---

export const StockTransferPage: React.FC = () => {
    const { state, dispatch } = useAppContext();
    const { warehouses, branches, products, stockTransfers, currentBranchId } = state;

    const [fromWarehouseId, setFromWarehouseId] = useState(warehouses[0]?.id || '');
    const [toBranchId, setToBranchId] = useState('');
    const [items, setItems] = useState<{ productId: string, quantity: number }[]>([]);

    const handleAddItem = () => {
        setItems([...items, { productId: '', quantity: 1 }]);
    };

    const handleItemChange = (index: number, field: 'productId' | 'quantity', value: any) => {
        const newItems = [...items];
        (newItems[index] as any)[field] = value;
        setItems(newItems);
    };
    
    const handleRemoveItem = (index: number) => {
        setItems(items.filter((_, i) => i !== index));
    };
    
    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!fromWarehouseId || !toBranchId || items.length === 0 || items.some(i => !i.productId)) {
            alert('Please fill all fields.');
            return;
        }
        dispatch({ type: 'inventory/createStockTransfer', payload: { fromWarehouseId, toBranchId, items } });
        setItems([]);
        setToBranchId('');
    };

    const handleReceiveTransfer = (transferId: string) => {
        if(confirm('Are you sure you want to receive these items? Stock levels will be updated.')) {
            dispatch({ type: 'inventory/receiveStockTransfer', payload: { transferId } });
        }
    }
    
    const handleCancelTransfer = (transferId: string) => {
        if (window.confirm("Anda yakin ingin membatalkan transfer ini?")) {
            dispatch({ type: 'inventory/cancelStockTransfer', payload: transferId });
        }
    };
    
    const pendingTransfersForBranch = useMemo(() => {
        if (!currentBranchId) return [];
        return stockTransfers.filter(st => st.toBranchId === currentBranchId && st.status === 'Pending');
    }, [stockTransfers, currentBranchId]);

    return (
        <div className="p-8 h-full flex flex-col gap-6">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Transfer Stok</h1>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card>
                    <h2 className="text-xl font-semibold mb-4">Buat Permintaan Transfer Baru</h2>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div><Label>Dari Gudang</Label><Select value={fromWarehouseId} onChange={e => setFromWarehouseId(e.target.value)}>{warehouses.map(w => <option key={w.id} value={w.id}>{w.name}</option>)}</Select></div>
                            <div><Label>Ke Cabang</Label><Select value={toBranchId} onChange={e => setToBranchId(e.target.value)}>{branches.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}</Select></div>
                        </div>
                        <div className="border-t pt-4">
                             <h3 className="text-lg font-semibold mb-2">Item Transfer</h3>
                            <div className="space-y-2 max-h-48 overflow-y-auto pr-2">
                                {items.map((item, index) => (
                                    <div key={index} className="flex gap-2 items-center">
                                        <Select value={item.productId} onChange={e => handleItemChange(index, 'productId', e.target.value)} className="flex-grow">
                                            <option value="">Pilih Produk</option>{products.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                                        </Select>
                                        <Input type="number" value={item.quantity} onChange={e => handleItemChange(index, 'quantity', parseInt(e.target.value))} min="1" className="w-24 text-center"/>
                                        <button type="button" onClick={() => handleRemoveItem(index)} className="text-red-500 font-bold text-xl">×</button>
                                    </div>
                                ))}
                            </div>
                            <button type="button" onClick={handleAddItem} className="mt-2 text-sm text-primary-600 dark:text-primary-400">+ Tambah Item</button>
                        </div>
                        <div className="flex justify-end pt-4"><Button type="submit">Buat Permintaan</Button></div>
                    </form>
                </Card>
                 <Card>
                    <h2 className="text-xl font-semibold mb-4">Penerimaan Transfer (untuk Cabang Saat Ini)</h2>
                     <div className="space-y-4 max-h-96 overflow-y-auto">
                        {pendingTransfersForBranch.map(t => (
                            <div key={t.id} className="p-4 border rounded-lg dark:border-gray-700">
                                <p><strong>Dari:</strong> {warehouses.find(w=>w.id === t.fromWarehouseId)?.name}</p>
                                <p><strong>Tanggal:</strong> {new Date(t.requestDate).toLocaleDateString()}</p>
                                <ul className="list-disc ml-5 text-sm my-2">
                                    {t.items.map(item => <li key={item.productId}>{products.find(p=>p.id === item.productId)?.name} ({item.quantity} pcs)</li>)}
                                </ul>
                                <div className="flex gap-2 mt-2">
                                    <Button onClick={() => handleReceiveTransfer(t.id)} className="w-full">Terima Stok</Button>
                                    <Button onClick={() => handleCancelTransfer(t.id)} variant="danger" className="w-full">Batalkan</Button>
                                </div>
                            </div>
                        ))}
                         {pendingTransfersForBranch.length === 0 && <p className="text-gray-500">Tidak ada transfer yang menunggu.</p>}
                     </div>
                </Card>
            </div>
        </div>
    );
};
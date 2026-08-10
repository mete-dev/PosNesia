import React, { useState, useMemo, useRef, useEffect } from 'react';
import { Product, Page, InventoryLevel, Status, BranchType, WarehouseType, Branch, Warehouse } from '../types';
import { useAppContext } from '../hooks/useAppContext';
import { generateProductDescription } from '../services/geminiService';
import { Input, Select, Textarea, Label, Button, ActionsDropdown, DropdownItem, Modal, Badge } from './ui';
import { PurchaseOrderDetailsModal } from './Purchases';

// --- Shared Components ---
export const ProductModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  existingProduct: Product | null;
  onSaveSuccess?: (newProduct: Product) => void;
}> = ({ isOpen, onClose, existingProduct, onSaveSuccess }) => {
    const { state, dispatch } = useAppContext();
    const { productCategories, vendors, isTaxEnabled, products, branchTypes, warehouseTypes } = state;
    const [formData, setFormData] = useState<Partial<Product>>({ isTaxable: true, pricingType: 'manual', status: 'active' });
    
    // State for type-location-specific data
    const [typeLocationData, setTypeLocationData] = useState<Record<string, { selected: boolean; shelvingNumber: string }>>({});
    
    const [keywords, setKeywords] = useState('');
    const [isGenerating, setIsGenerating] = useState(false);

    useEffect(() => {
        if (isOpen) {
            const initialFormData = existingProduct || { isTaxable: true, pricingType: 'manual', status: 'active' };
            setFormData(initialFormData);

            const initialTypeData: typeof typeLocationData = {};
            [...branchTypes, ...warehouseTypes].forEach(type => {
                const existing = existingProduct ? state.productTypeLocations.find(ptl => ptl.productId === existingProduct.id && ptl.locationTypeId === type.id) : null;
                initialTypeData[type.id] = {
                    selected: !!existing,
                    shelvingNumber: existing?.shelvingNumber || '',
                };
            });
            setTypeLocationData(initialTypeData);
        }
    }, [isOpen, existingProduct, branchTypes, warehouseTypes, state.productTypeLocations]);


    const handleGenerateDescription = async () => {
        if (!formData.name) {
            alert("Harap masukkan Nama Produk terlebih dahulu.");
            return;
        }
        setIsGenerating(true);
        const description = await generateProductDescription(formData.name, keywords);
        setFormData(prev => ({ ...prev, description }));
        setIsGenerating(false);
    };

    const handleTypeLocationChange = (typeId: string, field: keyof typeof typeLocationData[string], value: any) => {
        setTypeLocationData(prev => ({
            ...prev,
            [typeId]: { ...prev[typeId], [field]: value }
        }));
    };
    
    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        
        const selectedTypeLocations = Object.entries(typeLocationData)
            .filter(([, data]) => data.selected)
            .map(([typeId, data]) => {
                const isBranchType = branchTypes.some(bt => bt.id === typeId);
                return {
                    locationTypeId: typeId,
                    locationType: isBranchType ? 'branch' as const : 'warehouse' as const,
                    shelvingNumber: data.shelvingNumber || undefined
                };
            });

        if (existingProduct) {
             const payload = {
                product: {
                    ...existingProduct,
                    ...formData,
                    name: formData.name || '',
                    pricingType: formData.pricingType || 'manual',
                    isTaxable: formData.isTaxable === undefined ? true : formData.isTaxable,
                    price: Number(formData.price) || 0,
                    cost: Number(formData.cost) || 0,
                    status: formData.status || 'active',
                } as Product,
                typeLocations: selectedTypeLocations
            };
            dispatch({ type: 'products/update', payload });
        } else {
             const payload = {
                productData: {
                    name: formData.name || '',
                    pricingType: formData.pricingType || 'manual',
                    isTaxable: formData.isTaxable === undefined ? true : formData.isTaxable,
                    price: Number(formData.price) || 0,
                    cost: Number(formData.cost) || 0,
                    status: 'active',
                    ...formData,
                } as Omit<Product, 'id'>,
                typeLocations: selectedTypeLocations,
                initialStocks: {}
            };
            dispatch({ type: 'products/add', payload });
        }
        onClose();
    };

    const footer = (
        <Button onClick={handleSubmit}>Simpan Produk</Button>
    );
    
    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title={`${existingProduct ? 'Ubah' : 'Tambah'} Produk`}
            footer={footer}
            maxWidth="max-w-4xl"
        >
             <form id="product-form" onSubmit={handleSubmit} className="space-y-6">
                {/* Basic Info */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <Input placeholder="Nama Produk*" value={formData.name || ''} onChange={e => setFormData({...formData, name: e.target.value})} required />
                    <Input placeholder="Barcode" value={formData.barcode || ''} onChange={e => setFormData({...formData, barcode: e.target.value})}/>
                </div>
                 <div>
                    <Label htmlFor="imageUrl">URL Foto Produk</Label>
                    <Input id="imageUrl" placeholder="https://example.com/image.png" value={formData.imageUrl || ''} onChange={e => setFormData({...formData, imageUrl: e.target.value})}/>
                </div>
                {/* Pricing Info */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <Input type="number" placeholder="Harga Jual (Rp)*" value={formData.price || ''} onChange={e => setFormData({...formData, price: Number(e.target.value)})} required/>
                    <Input type="number" placeholder="Harga Modal (Rp)*" value={formData.cost || ''} onChange={e => setFormData({...formData, cost: Number(e.target.value)})} required/>
                </div>
                {/* Description Generator */}
                <div className="p-4 border rounded-lg dark:border-gray-600">
                    <h3 className="font-semibold mb-2">Deskripsi Produk (AI)</h3>
                    <p className="text-xs text-gray-500 mb-2">Gunakan AI untuk membuat deskripsi produk yang menarik. Cukup isi nama produk dan kata kunci.</p>
                    <div className="flex gap-2">
                            <Input placeholder="Kata Kunci (opsional, cth: nyaman, tahan lama)" value={keywords} onChange={e => setKeywords(e.target.value)}/>
                            <Button type="button" onClick={handleGenerateDescription} disabled={isGenerating}>{isGenerating ? "Membuat..." : "Buat"}</Button>
                    </div>
                    <Textarea placeholder="Deskripsi akan muncul di sini..." value={formData.description || ''} onChange={e => setFormData({...formData, description: e.target.value})} rows={3} className="mt-2"/>
                </div>
                {/* Associations */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <Select value={formData.categoryId || ''} onChange={e => setFormData({...formData, categoryId: e.target.value})}><option value="">Pilih Kategori</option>{productCategories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}</Select>
                    <Select value={formData.vendorId || ''} onChange={e => setFormData({...formData, vendorId: e.target.value})}><option value="">Pilih Vendor</option>{vendors.map(v => <option key={v.id} value={v.id}>{v.name}</option>)}</Select>
                </div>
                 {/* Location & Stock */}
                <div className="p-4 border rounded-lg dark:border-gray-600">
                    <h3 className="font-semibold mb-2">Lokasi Ketersediaan</h3>
                    <p className="text-xs text-gray-500 mb-2">Pilih tipe lokasi (cabang/gudang) tempat produk ini tersedia.</p>
                    <div className="max-h-60 overflow-y-auto space-y-3 pr-2">
                        <div>
                            <h4 className="font-semibold text-sm my-2 text-gray-600 dark:text-gray-300">Tipe Cabang</h4>
                            {branchTypes.map(type => {
                                const currentTypeData = typeLocationData[type.id];
                                return (
                                    <div key={type.id} className="p-2 bg-gray-50 dark:bg-gray-700/50 rounded-md mb-2">
                                        <label className="flex items-center font-medium">
                                            <input
                                                type="checkbox"
                                                checked={currentTypeData?.selected || false}
                                                onChange={e => handleTypeLocationChange(type.id, 'selected', e.target.checked)}
                                                className="mr-2 rounded text-primary-500"
                                            />
                                            {type.name}
                                        </label>
                                        {currentTypeData?.selected && (
                                            <div className="pl-6 mt-2">
                                                <Input value={currentTypeData.shelvingNumber} onChange={e => handleTypeLocationChange(type.id, 'shelvingNumber', e.target.value)} placeholder="No. Selving / Keterangan Lokasi" />
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                        <div>
                            <h4 className="font-semibold text-sm my-2 text-gray-600 dark:text-gray-300">Tipe Gudang</h4>
                            {warehouseTypes.map(type => {
                                const currentTypeData = typeLocationData[type.id];
                                return (
                                    <div key={type.id} className="p-2 bg-gray-50 dark:bg-gray-700/50 rounded-md mb-2">
                                        <label className="flex items-center font-medium">
                                            <input
                                                type="checkbox"
                                                checked={currentTypeData?.selected || false}
                                                onChange={e => handleTypeLocationChange(type.id, 'selected', e.target.checked)}
                                                className="mr-2 rounded text-primary-500"
                                            />
                                            {type.name}
                                        </label>
                                        {currentTypeData?.selected && (
                                            <div className="pl-6 mt-2">
                                                <Input value={currentTypeData.shelvingNumber} onChange={e => handleTypeLocationChange(type.id, 'shelvingNumber', e.target.value)} placeholder="No. Selving / Keterangan Lokasi" />
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>
                 {/* Settings */}
                <div className="flex items-center gap-6 pt-2">
                    {isTaxEnabled && <label className="flex items-center"><input type="checkbox" checked={formData.isTaxable} onChange={e => setFormData({...formData, isTaxable: e.target.checked})} className="rounded text-primary-600"/> <span className="ml-2">Kena Pajak</span></label>}
                    <label className="flex items-center"><input type="radio" name="pricingType" value="manual" checked={formData.pricingType === 'manual'} onChange={e => setFormData({...formData, pricingType: 'manual'})} /> <span className="ml-2">Harga Manual</span></label>
                    <label className="flex items-center"><input type="radio" name="pricingType" value="auto" checked={formData.pricingType === 'auto'} onChange={e => setFormData({...formData, pricingType: 'auto'})}/> <span className="ml-2">Harga Otomatis</span></label>
                </div>
                 {existingProduct && (
                    <div>
                        <Label>Status Produk</Label>
                        <Select value={formData.status || ''} onChange={e => setFormData({...formData, status: e.target.value as Status})}>
                            <option value="active">Aktif</option>
                            <option value="inactive">Non-Aktif</option>
                            <option value="archived">Diarsipkan</option>
                        </Select>
                    </div>
                )}
            </form>
        </Modal>
    );
};

const ProductDetailsModal: React.FC<{
    isOpen: boolean;
    onClose: () => void;
    product: Product | null;
}> = ({ isOpen, onClose, product }) => {
    const { state } = useAppContext();
    const { purchases, stockMovements, vendors, customers, staff, warehouses, branches } = state;
    const [view, setView] = useState<'purchase' | 'stock'>('purchase');
    const [viewingPurchase, setViewingPurchase] = useState<typeof purchases[0] | null>(null);

    const purchaseHistory = useMemo(() => {
        if (!product) return [];
        return purchases
            .filter(p => p.items.some(i => i.productId === product.id))
            .map(p => ({
                purchase: p,
                item: p.items.find(i => i.productId === product.id)!
            }));
    }, [product, purchases]);

    const stockHistory = useMemo(() => {
        if (!product) return [];
        return stockMovements
            .filter(m => m.productId === product.id)
            .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    }, [product, stockMovements]);

    const partnerMap = useMemo(() => {
        const map = new Map<string, string>();
        vendors.forEach(v => map.set(v.id, v.name));
        customers.forEach(c => map.set(c.id, c.name));
        return map;
    }, [vendors, customers]);

    const staffMap = useMemo(() => new Map(staff.map(s => [s.id, s.name])), [staff]);
    const locationMap = useMemo(() => {
        const map = new Map<string, string>();
        warehouses.forEach(w => map.set(w.id, w.name));
        branches.forEach(b => map.set(b.id, b.name));
        return map;
    }, [warehouses, branches]);


    if (!isOpen || !product) return null;

    return (
        <>
            <Modal isOpen={isOpen} onClose={onClose} title={`Detail: ${product.name}`} maxWidth="max-w-4xl">
                <div className="flex border-b dark:border-gray-700 mb-4">
                    <button onClick={() => setView('purchase')} className={`py-2 px-4 ${view === 'purchase' ? 'border-b-2 border-primary-500 text-primary-600' : 'text-gray-500'}`}>Riwayat Pembelian</button>
                    <button onClick={() => setView('stock')} className={`py-2 px-4 ${view === 'stock' ? 'border-b-2 border-primary-500 text-primary-600' : 'text-gray-500'}`}>Riwayat Stok</button>
                </div>
                <div className="max-h-[60vh] overflow-y-auto">
                    {view === 'purchase' ? (
                        <table className="w-full text-sm">
                            <thead><tr><th className="p-2 text-left">Tanggal</th><th className="p-2 text-left">No. PO</th><th className="p-2 text-left">Vendor</th><th className="p-2">Kuantitas</th><th className="p-2 text-right">Harga Beli</th></tr></thead>
                            <tbody>
                                {purchaseHistory.map(({ purchase, item }) => (
                                    <tr key={purchase.id} className="border-t dark:border-gray-700">
                                        <td className="p-2">{new Date(purchase.orderDate).toLocaleDateString()}</td>
                                        <td className="p-2"><button onClick={() => setViewingPurchase(purchase)} className="text-primary-600 hover:underline">{purchase.id}</button></td>
                                        <td className="p-2">{purchase.vendorName}</td>
                                        <td className="p-2 text-center">{item.quantity}</td>
                                        <td className="p-2 text-right">Rp{item.cost.toLocaleString('id-ID')}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    ) : (
                         <table className="w-full text-sm">
                            <thead><tr><th className="p-2 text-left">Tanggal</th><th className="p-2 text-left">Transaksi</th><th className="p-2 text-left">Partner</th><th className="p-2">Qty</th><th className="p-2 text-left">Oleh</th></tr></thead>
                            <tbody>
                                {stockHistory.map(m => (
                                    <tr key={m.id} className="border-t dark:border-gray-700">
                                        <td className="p-2">{new Date(m.date).toLocaleString('id-ID')}</td>
                                        <td className="p-2">{m.type} #{m.referenceId}</td>
                                        <td className="p-2">{m.partnerId ? partnerMap.get(m.partnerId) : 'N/A'}</td>
                                        <td className={`p-2 font-bold text-center ${m.quantityChange > 0 ? 'text-green-500' : 'text-red-500'}`}>{m.quantityChange > 0 ? '+' : ''}{m.quantityChange}</td>
                                        <td className="p-2">{m.staffId ? staffMap.get(m.staffId) : 'Sistem'}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>
            </Modal>
            <PurchaseOrderDetailsModal isOpen={!!viewingPurchase} onClose={() => setViewingPurchase(null)} purchaseOrder={viewingPurchase} />
        </>
    );
};


export const ProductListPage: React.FC = () => {
    const { state, dispatch } = useAppContext();
    const { products, inventoryLevels, currentBranchId, brands, productCategories } = state;
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isDetailsModalOpen, setDetailsModalOpen] = useState(false);
    const [editingProduct, setEditingProduct] = useState<Product | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [categoryFilter, setCategoryFilter] = useState('all');
    const [selectedProductIds, setSelectedProductIds] = useState<Set<string>>(new Set());

    const handleOpenModal = (product: Product | null) => {
        setEditingProduct(product);
        setIsModalOpen(true);
    };

    const handleOpenDetailsModal = (product: Product) => {
        setEditingProduct(product);
        setDetailsModalOpen(true);
    };

    const handleSetStatus = (id: string, status: Status) => {
        if (confirm(`Anda yakin ingin mengubah status produk ini menjadi ${status}?`)) {
            dispatch({ type: 'products/setStatus', payload: { id, status } });
        }
    };
    
    const handlePrintSelected = () => {
        if (selectedProductIds.size === 0) return;
        dispatch({ type: 'ui/setPrintSelection', payload: { type: 'products', ids: Array.from(selectedProductIds) } });
        dispatch({ type: 'ui/setPage', payload: Page.PrintPriceLabels });
    };

    const handleSelectProduct = (productId: string, checked: boolean) => {
        const newSet = new Set(selectedProductIds);
        if (checked) {
            newSet.add(productId);
        } else {
            newSet.delete(productId);
        }
        setSelectedProductIds(newSet);
    };
    
    const handleSelectAll = (checked: boolean) => {
        if (checked) {
            setSelectedProductIds(new Set(filteredProducts.map(p => p.id)));
        } else {
            setSelectedProductIds(new Set());
        }
    };

    const productStockMap = useMemo(() => {
        const map = new Map<string, number>();
        inventoryLevels
            .filter(inv => !currentBranchId || inv.locationId === currentBranchId)
            .forEach(inv => {
                map.set(inv.productId, (map.get(inv.productId) || 0) + inv.quantity);
            });
        return map;
    }, [inventoryLevels, currentBranchId]);

    const brandMap = useMemo(() => new Map(brands.map(b => [b.id, b.name])), [brands]);

    const filteredProducts = useMemo(() => {
        return products.filter(product => {
            const lowercasedFilter = searchTerm.toLowerCase();
            const matchesSearch = product.name.toLowerCase().includes(lowercasedFilter) ||
                                  (product.barcode && product.barcode.includes(lowercasedFilter));
            const matchesCategory = categoryFilter === 'all' || product.categoryId === categoryFilter;
            return matchesSearch && matchesCategory;
        });
    }, [products, searchTerm, categoryFilter]);

    return (
        <div className="p-8 h-full flex flex-col">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Data Produk</h1>
                <div className="flex gap-2">
                    <Button onClick={handlePrintSelected} disabled={selectedProductIds.size === 0} variant="secondary">
                        Cetak Label Harga ({selectedProductIds.size})
                    </Button>
                    <Button onClick={() => handleOpenModal(null)}>Tambah Produk</Button>
                </div>
            </div>
            <div className="mb-4 bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm">
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Input 
                        type="text"
                        placeholder="Cari berdasarkan nama atau barcode..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                    <Select value={categoryFilter} onChange={e => setCategoryFilter(e.target.value)}>
                        <option value="all">Semua Kategori</option>
                        {productCategories.map(cat => (
                            <option key={cat.id} value={cat.id}>{cat.name}</option>
                        ))}
                    </Select>
                </div>
            </div>
            {/* PRODUCT CARD GRID BLOCKS */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 overflow-y-auto pb-4">
                {filteredProducts.map(product => {
                    const stock = productStockMap.get(product.id) || 0;
                    return (
                        <div key={product.id} className="bg-white dark:bg-gray-800 rounded-2xl p-5 border border-slate-100 dark:border-gray-700 shadow-sm hover:shadow-md transition-all flex flex-col justify-between relative group">
                            <div className="flex items-start justify-between gap-2 mb-3">
                                <div className="flex items-center gap-2">
                                    <input
                                        type="checkbox"
                                        checked={selectedProductIds.has(product.id)}
                                        onChange={e => handleSelectProduct(product.id, e.target.checked)}
                                        className="rounded text-primary-600 w-4 h-4 mt-0.5"
                                    />
                                    <Badge variant={product.status === 'active' ? 'success' : 'neutral'}>{product.status}</Badge>
                                </div>
                                <ActionsDropdown>
                                    <DropdownItem onClick={() => handleOpenDetailsModal(product)}>Lihat Detail</DropdownItem>
                                    <DropdownItem onClick={() => handleOpenModal(product)}>Ubah</DropdownItem>
                                    {product.status !== 'archived' && (
                                        <DropdownItem onClick={() => handleSetStatus(product.id, product.status === 'active' ? 'inactive' : 'active')}>
                                            {product.status === 'active' ? 'Non-aktifkan' : 'Aktifkan'}
                                        </DropdownItem>
                                    )}
                                </ActionsDropdown>
                            </div>

                            <div className="space-y-1 mb-4">
                                <h3 className="font-bold text-gray-900 dark:text-white text-base leading-snug line-clamp-2">{product.name}</h3>
                                {product.brandId && (
                                    <p className="text-xs font-medium text-slate-500 dark:text-gray-400">Merk: {brandMap.get(product.brandId)}</p>
                                )}
                                {product.barcode && (
                                    <p className="text-[11px] font-mono text-slate-400 dark:text-gray-500">📷 {product.barcode}</p>
                                )}
                            </div>

                            <div className="pt-3 border-t border-slate-100 dark:border-gray-700/60 flex items-center justify-between mt-auto">
                                <div>
                                    <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Harga Jual</span>
                                    <p className="text-lg font-black text-emerald-600 dark:text-emerald-400">Rp{product.price.toLocaleString('id-ID')}</p>
                                </div>
                                <div className="text-right">
                                    <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Stok</span>
                                    <p className={`text-base font-black ${stock > 5 ? 'text-slate-800 dark:text-white' : stock > 0 ? 'text-amber-500' : 'text-red-500'}`}>{stock}</p>
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>
            <ProductModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} existingProduct={editingProduct} />
            <ProductDetailsModal isOpen={isDetailsModalOpen} onClose={() => setDetailsModalOpen(false)} product={editingProduct} />
        </div>
    );
};

export const SetPricingPage: React.FC = () => {
    const { state, dispatch } = useAppContext();
    const [markup, setMarkup] = useState(50); // Default markup 50%

    const handleApplyMarkup = () => {
        dispatch({ type: 'products/setPrices', payload: { markup } });
        alert(`Harga untuk produk otomatis telah diperbarui dengan markup ${markup}%.`);
    };

    return (
        <div className="p-8">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-6">Atur Harga Jual Otomatis</h1>
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-8 w-full max-w-2xl mx-auto">
                <p className="mb-4 text-gray-600 dark:text-gray-400">Atur persentase markup dari harga modal untuk semua produk dengan tipe harga "Otomatis". Harga akan dibulatkan ke ribuan terdekat.</p>
                <div className="flex items-center gap-4">
                    <Label htmlFor="markup" className="shrink-0">Persentase Markup (%):</Label>
                    <Input id="markup" type="number" value={markup} onChange={e => setMarkup(Number(e.target.value))} />
                    <Button onClick={handleApplyMarkup}>Terapkan</Button>
                </div>
            </div>
        </div>
    );
};
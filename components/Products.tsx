import React, { useState, useMemo, useRef, useEffect } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import * as XLSX from 'xlsx';
import { Camera, Plus, Trash2, Layers, Upload, Download, FileSpreadsheet, CheckCircle2, AlertCircle, Printer, Eye, Edit, Power } from 'lucide-react';
import { Product, Page, InventoryLevel, Status, BranchType, WarehouseType, Branch, Warehouse, ProductUnitTier } from '../types';
import { useAppContext } from '../hooks/useAppContext';
import { Input, Select, Textarea, Label, Button, ActionsDropdown, DropdownItem, Modal, Badge, Table, Thead, Tbody, Tr, Th, Td } from './ui';

// --- Shared Components ---
export const ProductModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  existingProduct: Product | null;
  onSaveSuccess?: (newProduct: Product) => void;
}> = ({ isOpen, onClose, existingProduct, onSaveSuccess }) => {
    const { state, dispatch } = useAppContext();
    const { productCategories = [], vendors = [], shelves = [], productTypeLocations = [], currentBranchId, branches = [], branchTypes = [] } = state || {};
    const [formData, setFormData] = useState<Partial<Product>>({ isTaxable: true, pricingType: 'manual', status: 'active', unit: 'Pcs' });
    const [unitTiers, setUnitTiers] = useState<ProductUnitTier[]>([]);
    const [selectedShelfId, setSelectedShelfId] = useState<string>('');
    const [shelvingNumber, setShelvingNumber] = useState<string>('');
    
    // Camera scanner state
    const [isCameraScannerOpen, setCameraScannerOpen] = useState(false);
    const [cameraError, setCameraError] = useState('');
    const html5QrCodeRef = useRef<Html5Qrcode | null>(null);

    useEffect(() => {
        if (isOpen) {
            const initialFormData = existingProduct || { isTaxable: true, pricingType: 'manual', status: 'active', unit: 'Pcs' };
            setFormData(initialFormData);
            setUnitTiers(existingProduct?.unitTiers || []);

            if (existingProduct) {
                const currentBranch = branches.find(b => b.id === currentBranchId) || branches[0];
                const currentBranchTypeId = currentBranch?.branchTypeId;
                const locInfo = productTypeLocations.find(ptl => ptl.productId === existingProduct.id && (currentBranchTypeId ? ptl.locationTypeId === currentBranchTypeId : true));
                setSelectedShelfId(locInfo?.shelfId || '');
                setShelvingNumber(locInfo?.shelvingNumber || '');
            } else {
                setSelectedShelfId('');
                setShelvingNumber('');
            }
        }
    }, [isOpen, existingProduct, currentBranchId, branches, productTypeLocations]);

    const handleAddUnitTier = () => {
        setUnitTiers(prev => [
            ...prev,
            {
                id: 'tier_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
                unitName: '',
                conversionQty: 12,
                price: 0,
                barcode: ''
            }
        ]);
    };

    const handleUpdateUnitTier = (id: string, field: keyof ProductUnitTier, value: any) => {
        setUnitTiers(prev => prev.map(tier => tier.id === id ? { ...tier, [field]: value } : tier));
    };

    const handleRemoveUnitTier = (id: string) => {
        setUnitTiers(prev => prev.filter(tier => tier.id !== id));
    };

    // Camera Scanner with Html5Qrcode Engine
    useEffect(() => {
      if (isCameraScannerOpen) {
        setCameraError('');
        const elementId = "product-form-qr-reader";
        const timer = setTimeout(async () => {
          try {
            const html5QrCode = new Html5Qrcode(elementId);
            html5QrCodeRef.current = html5QrCode;
            await html5QrCode.start(
              { facingMode: "environment" },
              { fps: 15, qrbox: { width: 250, height: 180 } },
              (scannedCode) => {
                if (scannedCode) {
                  setFormData(prev => ({ ...prev, barcode: scannedCode }));
                  setCameraScannerOpen(false);
                }
              },
              () => {}
            );
          } catch (err: any) {
            setCameraError('Gagal mengakses kamera HP.');
          }
        }, 300);

        return () => {
          clearTimeout(timer);
          if (html5QrCodeRef.current && html5QrCodeRef.current.isScanning) {
            html5QrCodeRef.current.stop().then(() => html5QrCodeRef.current?.clear()).catch(() => {});
          }
        };
      }
    }, [isCameraScannerOpen]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        
        const validTiers = unitTiers.filter(t => t.unitName.trim() !== '');
        const currentBranch = branches.find(b => b.id === currentBranchId) || branches[0];
        const branchTypeId = currentBranch?.branchTypeId || branchTypes[0]?.id || 'bt1';

        const typeLocationsPayload = selectedShelfId ? [{
            locationType: 'branch' as const,
            locationTypeId: branchTypeId,
            shelfId: selectedShelfId,
            shelvingNumber: shelvingNumber || undefined
        }] : [];

        if (existingProduct) {
             const payload = {
                product: {
                    ...existingProduct,
                    ...formData,
                    name: formData.name || '',
                    pricingType: 'manual',
                    isTaxable: true,
                    price: Number(formData.price) || 0,
                    cost: Number(formData.cost) || 0,
                    wholesalePrice: Number(formData.wholesalePrice) || 0,
                    wholesaleMinQty: Number(formData.wholesaleMinQty) || 0,
                    initialStock: Number(formData.initialStock) || 0,
                    unitTiers: validTiers,
                    status: formData.status || 'active',
                } as Product,
                typeLocations: typeLocationsPayload
            };
            dispatch({ type: 'products/update', payload });
        } else {
             const payload = {
                productData: {
                    name: formData.name || '',
                    pricingType: 'manual',
                    isTaxable: true,
                    price: Number(formData.price) || 0,
                    cost: Number(formData.cost) || 0,
                    wholesalePrice: Number(formData.wholesalePrice) || 0,
                    wholesaleMinQty: Number(formData.wholesaleMinQty) || 0,
                    initialStock: Number(formData.initialStock) || 0,
                    unitTiers: validTiers,
                    status: 'active',
                    ...formData,
                } as Omit<Product, 'id'>,
                typeLocations: typeLocationsPayload,
                initialStocks: {}
            };
            dispatch({ type: 'products/add', payload });
        }
        onClose();
    };

    const baseUnits = ['Pcs', 'Botol', 'Kg', 'Gram', 'Liter', 'Sachet', 'Pcs/Lbr', 'Roll', 'Buah', 'Pasang'];

    const footer = (
        <Button onClick={handleSubmit}>Simpan Produk</Button>
    );
    
    return (
        <>
            <Modal
                isOpen={isOpen}
                onClose={onClose}
                title={`${existingProduct ? 'Ubah' : 'Tambah'} Produk`}
                footer={footer}
                maxWidth="max-w-3xl"
            >
                 <form id="product-form" onSubmit={handleSubmit} className="space-y-4">
                    {/* Basic Info */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <Label>Nama Produk*</Label>
                            <Input placeholder="Nama Produk*" value={formData.name || ''} onChange={e => setFormData({...formData, name: e.target.value})} required />
                        </div>
                        <div>
                            <Label>Barcode Produk</Label>
                            <div className="flex gap-2 items-center">
                                <Input placeholder="Barcode" value={formData.barcode || ''} onChange={e => setFormData({...formData, barcode: e.target.value})} className="flex-1" />
                                <button
                                    type="button"
                                    onClick={() => setCameraScannerOpen(true)}
                                    className="p-2.5 bg-blue-50 hover:bg-blue-100 dark:bg-blue-950/60 dark:hover:bg-blue-900/80 text-blue-600 dark:text-blue-400 rounded-lg border border-blue-200/80 dark:border-blue-800/60 transition-all flex items-center justify-center shrink-0 cursor-pointer shadow-2xs active:scale-95"
                                    title="Scan Barcode via Kamera HP/Webcam"
                                >
                                    <Camera className="w-4.5 h-4.5" />
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Deskripsi Produk (Tepat di bawah Nama Produk) */}
                    <div>
                        <Label>Deskripsi Produk</Label>
                        <Textarea 
                            placeholder="Tuliskan keterangan / deskripsi detail produk di sini..." 
                            value={formData.description || ''} 
                            onChange={e => setFormData({...formData, description: e.target.value})} 
                            rows={2} 
                        />
                    </div>

                    {/* Satuan Dasar & Pricing & Stock */}
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        <div>
                            <Label>Satuan Utama</Label>
                            <Select value={formData.unit || 'Pcs'} onChange={e => setFormData({...formData, unit: e.target.value})}>
                                {baseUnits.map(u => <option key={u} value={u}>{u}</option>)}
                            </Select>
                        </div>
                        <div>
                            <Label>Harga Jual ({formData.unit || 'Pcs'})*</Label>
                            <Input type="number" placeholder="Harga Jual (Rp)*" value={formData.price || ''} onChange={e => setFormData({...formData, price: Number(e.target.value)})} required/>
                        </div>
                        <div>
                            <Label>Harga Modal / HPP*</Label>
                            <Input type="number" placeholder="Harga Modal (Rp)*" value={formData.cost || ''} onChange={e => setFormData({...formData, cost: Number(e.target.value)})} required/>
                        </div>
                        <div>
                            <Label>Stok Awal Produk</Label>
                            <Input type="number" placeholder="Stok Produk (cth: 100)" value={formData.initialStock ?? ''} onChange={e => setFormData({...formData, initialStock: Number(e.target.value)})}/>
                        </div>
                    </div>

                    {/* Dynamic Multi-Tier Packaging Prices (Harga Packaging Bertingkat) */}
                    <div className="p-4 bg-slate-50/80 dark:bg-zinc-800/60 rounded-xl border border-slate-200/80 dark:border-zinc-700/60 space-y-3">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <Layers className="w-4 h-4 text-primary-600 dark:text-primary-400" />
                                <h4 className="text-xs font-bold text-gray-800 dark:text-gray-200 uppercase tracking-wider">Harga Packaging Bertingkat (Custom Tier)</h4>
                            </div>
                            <Button type="button" onClick={handleAddUnitTier} variant="secondary" className="text-xs px-2.5 py-1">
                                <Plus className="w-3.5 h-3.5 mr-1" /> Tambah Tingkatan
                            </Button>
                        </div>
                        <p className="text-xs text-slate-500 dark:text-zinc-400">
                            Atur harga grosir/kemasan bertingkat (misal: Pack/Renceng, Box, Karton/Crt).
                        </p>
                        
                        {unitTiers.length === 0 ? (
                            <div className="text-center py-3 text-xs text-slate-400 border border-dashed border-slate-200 dark:border-zinc-700 rounded-lg">
                                Belum ada tingkatan satuan bertingkat. Klik "+ Tambah Tingkatan" untuk menambahkan.
                            </div>
                        ) : (
                            <div className="space-y-2.5">
                                {unitTiers.map((tier, idx) => (
                                    <div key={tier.id} className="grid grid-cols-1 sm:grid-cols-12 gap-2 items-center bg-white dark:bg-zinc-900 p-2.5 rounded-lg border border-slate-200/60 dark:border-zinc-700/60 shadow-2xs">
                                        <div className="sm:col-span-3">
                                            <Input 
                                                placeholder="Nama Satuan (cth: Pack, Box, Crt)" 
                                                value={tier.unitName} 
                                                onChange={e => handleUpdateUnitTier(tier.id, 'unitName', e.target.value)} 
                                            />
                                        </div>
                                        <div className="sm:col-span-3 flex items-center gap-1.5">
                                            <span className="text-xs text-slate-400 shrink-0">Isi:</span>
                                            <Input 
                                                type="number" 
                                                placeholder={`Isi per ${formData.unit || 'Pcs'}`} 
                                                value={tier.conversionQty || ''} 
                                                onChange={e => handleUpdateUnitTier(tier.id, 'conversionQty', Number(e.target.value))} 
                                            />
                                        </div>
                                        <div className="sm:col-span-3">
                                            <Input 
                                                type="number" 
                                                placeholder="Harga Jual Tier (Rp)" 
                                                value={tier.price || ''} 
                                                onChange={e => handleUpdateUnitTier(tier.id, 'price', Number(e.target.value))} 
                                            />
                                        </div>
                                        <div className="sm:col-span-2">
                                            <Input 
                                                placeholder="Barcode Tier (opsional)" 
                                                value={tier.barcode || ''} 
                                                onChange={e => handleUpdateUnitTier(tier.id, 'barcode', e.target.value)} 
                                            />
                                        </div>
                                        <div className="sm:col-span-1 flex justify-end">
                                            <button
                                                type="button"
                                                onClick={() => handleRemoveUnitTier(tier.id)}
                                                className="p-2 text-rose-500 hover:text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg transition-colors cursor-pointer"
                                                title="Hapus Tingkatan Satuan"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Associations (Category, Vendor, & Lokasi Rak) */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                            <Label>Kategori Produk</Label>
                            <Select value={formData.categoryId || ''} onChange={e => setFormData({...formData, categoryId: e.target.value})}>
                                <option value="">Pilih Kategori</option>
                                {(productCategories || []).map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                            </Select>
                        </div>
                        <div>
                            <Label>Vendor / Supplier</Label>
                            <Select value={formData.vendorId || ''} onChange={e => setFormData({...formData, vendorId: e.target.value})}>
                                <option value="">Pilih Vendor</option>
                                {(vendors || []).map(v => <option key={v.id} value={v.id}>{v.name}</option>)}
                            </Select>
                        </div>
                        <div>
                            <Label>Lokasi Rak Display</Label>
                            <div className="flex gap-2">
                                <Select value={selectedShelfId} onChange={e => setSelectedShelfId(e.target.value)} className="flex-1">
                                    <option value="">-- Pilih Rak --</option>
                                    {(shelves || []).map(s => <option key={s.id} value={s.id}>{s.code} ({s.description || 'Rak'})</option>)}
                                </Select>
                                <Input 
                                    placeholder="Selving (cth: 1)" 
                                    value={shelvingNumber} 
                                    onChange={e => setShelvingNumber(e.target.value)} 
                                    className="w-28 shrink-0" 
                                />
                            </div>
                        </div>
                    </div>

                    {/* Status */}
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

            {/* Camera Barcode Scanner Modal */}
            <Modal
                isOpen={isCameraScannerOpen}
                onClose={() => setCameraScannerOpen(false)}
                title="Scan Barcode via Kamera HP"
                footer={<Button onClick={() => setCameraScannerOpen(false)} variant="secondary">Tutup Kamera</Button>}
                maxWidth="max-w-md"
            >
                <div className="flex flex-col items-center space-y-4">
                    <p className="text-xs text-gray-500 dark:text-gray-400 text-center">
                        Arahkan kamera ke kode barcode pada kemasan produk. Barcode akan otomatis terisi.
                    </p>
                    <div className="relative w-full aspect-square bg-black rounded-xl overflow-hidden flex items-center justify-center border border-gray-200 dark:border-gray-700">
                        {cameraError ? (
                            <p className="text-xs text-red-500 font-semibold p-4 text-center">{cameraError}</p>
                        ) : (
                            <div id="product-form-qr-reader" className="w-full h-full object-cover"></div>
                        )}
                    </div>
                </div>
            </Modal>
        </>
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
        <Modal isOpen={isOpen} onClose={onClose} title={`Detail Produk: ${product.name}`} maxWidth="max-w-4xl">
                {/* Information Header Card */}
                <div className="bg-slate-50 dark:bg-zinc-800/80 p-4 rounded-xl border border-slate-200/80 dark:border-zinc-700/80 mb-4 grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
                    <div>
                        <span className="text-slate-400 block font-semibold">Nama Produk</span>
                        <span className="font-bold text-slate-800 dark:text-white text-sm">{product.name}</span>
                    </div>
                    <div>
                        <span className="text-slate-400 block font-semibold">Barcode / SKU</span>
                        <span className="font-mono font-bold text-slate-700 dark:text-slate-200">{product.barcode || product.sku || '-'}</span>
                    </div>
                    <div>
                        <span className="text-slate-400 block font-semibold">Harga Jual</span>
                        <span className="font-mono font-black text-emerald-600 dark:text-emerald-400 text-sm">Rp{(product.price || 0).toLocaleString('id-ID')} / {product.unit || 'Pcs'}</span>
                    </div>
                    <div>
                        <span className="text-slate-400 block font-semibold">Harga Modal (HPP)</span>
                        <span className="font-mono font-bold text-slate-700 dark:text-slate-300">Rp{(product.cost || 0).toLocaleString('id-ID')}</span>
                    </div>
                </div>

                {/* Tab Navigation Header */}
                <div className="flex space-x-1 border-b dark:border-zinc-700 mb-4">
                    <button 
                        onClick={() => setView('stock')} 
                        className={`py-2 px-4 text-xs font-bold transition-colors ${view === 'stock' ? 'border-b-2 border-primary-500 text-primary-600 dark:text-primary-400' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}
                    >
                        📦 Riwayat Stok Mutasi ({stockHistory.length})
                    </button>
                    <button 
                        onClick={() => setView('purchase')} 
                        className={`py-2 px-4 text-xs font-bold transition-colors ${view === 'purchase' ? 'border-b-2 border-primary-500 text-primary-600 dark:text-primary-400' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}
                    >
                        🛍️ Riwayat Pembelian ({purchaseHistory.length})
                    </button>
                </div>

                {/* History Content List */}
                <div className="max-h-[55vh] overflow-y-auto pr-1">
                    {view === 'stock' ? (
                         <table className="w-full text-xs text-left">
                            <thead className="bg-slate-100 dark:bg-zinc-800 text-slate-700 dark:text-slate-300 uppercase font-bold sticky top-0">
                                <tr>
                                    <th className="p-2.5">Tanggal</th>
                                    <th className="p-2.5">Tipe Mutasi</th>
                                    <th className="p-2.5">Referensi ID</th>
                                    <th className="p-2.5 text-center">Perubahan Qty</th>
                                    <th className="p-2.5">Petugas</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 dark:divide-zinc-800">
                                {stockHistory.map(m => (
                                    <tr key={m.id} className="hover:bg-slate-50/50 dark:hover:bg-zinc-800/50">
                                        <td className="p-2.5 font-medium text-slate-600 dark:text-slate-400">{new Date(m.date).toLocaleString('id-ID')}</td>
                                        <td className="p-2.5">
                                            <span className="font-semibold text-slate-800 dark:text-slate-200 capitalize">{m.type.replace('_', ' ')}</span>
                                        </td>
                                        <td className="p-2.5 font-mono text-slate-500">{m.referenceId || '-'}</td>
                                        <td className={`p-2.5 font-black text-center font-mono ${m.quantityChange > 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
                                            {m.quantityChange > 0 ? `+${m.quantityChange}` : m.quantityChange}
                                        </td>
                                        <td className="p-2.5 text-slate-500">{m.staffId ? staffMap.get(m.staffId) || 'Staff' : 'Sistem'}</td>
                                    </tr>
                                ))}
                                {stockHistory.length === 0 && (
                                    <tr>
                                        <td colSpan={5} className="p-6 text-center text-slate-400">Belum ada riwayat mutasi stok untuk produk ini.</td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    ) : (
                        <table className="w-full text-xs text-left">
                            <thead className="bg-slate-100 dark:bg-zinc-800 text-slate-700 dark:text-slate-300 uppercase font-bold sticky top-0">
                                <tr>
                                    <th className="p-2.5">Tanggal</th>
                                    <th className="p-2.5">No. PO</th>
                                    <th className="p-2.5">Vendor</th>
                                    <th className="p-2.5 text-center">Kuantitas</th>
                                    <th className="p-2.5 text-right">Harga Beli</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 dark:divide-zinc-800">
                                {purchaseHistory.map(({ purchase, item }) => (
                                    <tr key={purchase.id} className="hover:bg-slate-50/50 dark:hover:bg-zinc-800/50">
                                        <td className="p-2.5 font-medium text-slate-600 dark:text-slate-400">{new Date(purchase.orderDate).toLocaleDateString('id-ID')}</td>
                                        <td className="p-2.5 font-mono">
                                            <button onClick={() => {
                                                onClose();
                                                dispatch({ type: 'purchases/setSelectedId', payload: purchase.id });
                                                dispatch({ type: 'ui/setPage', payload: Page.PurchaseDetailsPage });
                                            }} className="text-purple-600 font-bold hover:underline">
                                                {purchase.id}
                                            </button>
                                        </td>
                                        <td className="p-2.5 text-slate-700 dark:text-slate-300">{purchase.vendorName}</td>
                                        <td className="p-2.5 text-center font-bold font-mono">{item.quantity}</td>
                                        <td className="p-2.5 text-right font-mono font-bold text-slate-800 dark:text-white">Rp{item.cost.toLocaleString('id-ID')}</td>
                                    </tr>
                                ))}
                                {purchaseHistory.length === 0 && (
                                    <tr>
                                        <td colSpan={5} className="p-6 text-center text-slate-400">Belum ada riwayat pembelian untuk produk ini.</td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    )}
                </div>
            </Modal>
    );
};
// --- Import Product Modal ---
export const ImportProductModal: React.FC<{
    isOpen: boolean;
    onClose: () => void;
}> = ({ isOpen, onClose }) => {
    const { state, dispatch } = useAppContext();
    const { productCategories = [], vendors = [] } = state || {};

    const [fileName, setFileName] = useState<string>('');
    const [parsedProducts, setParsedProducts] = useState<Array<{
        name: string;
        barcode: string;
        unit: string;
        price: number;
        cost: number;
        initialStock: number;
        categoryName: string;
        vendorName: string;
        description: string;
        isValid: boolean;
        errorMessage?: string;
    }>>([]);
    const [isProcessing, setIsProcessing] = useState(false);

    const handleDownloadTemplate = () => {
        const sampleData = [
            {
                "Nama Produk*": "Kopi Susu Gula Aren 250ml",
                "Barcode": "8991234567890",
                "Satuan Utama": "Botol",
                "Harga Jual*": 18000,
                "Harga Modal*": 11000,
                "Stok Awal": 50,
                "Kategori": "Minuman",
                "Vendor": "PT Sumber Kopi",
                "Deskripsi": "Kopi rasa manis gurih khas gula aren"
            },
            {
                "Nama Produk*": "Roti Tawar Serbaguna",
                "Barcode": "8999876543210",
                "Satuan Utama": "Pack",
                "Harga Jual*": 15000,
                "Harga Modal*": 10000,
                "Stok Awal": 30,
                "Kategori": "Makanan",
                "Vendor": "CV Roti Enak",
                "Deskripsi": "Roti tawar lembut dan gurih"
            }
        ];

        const worksheet = XLSX.utils.json_to_sheet(sampleData);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, "Template Produk");
        
        worksheet["!cols"] = [
            { wch: 30 }, // Nama Produk
            { wch: 18 }, // Barcode
            { wch: 14 }, // Satuan Utama
            { wch: 14 }, // Harga Jual
            { wch: 14 }, // Harga Modal
            { wch: 12 }, // Stok Awal
            { wch: 16 }, // Kategori
            { wch: 22 }, // Vendor
            { wch: 35 }  // Deskripsi
        ];

        XLSX.writeFile(workbook, "Template_Import_Produk_POSNesia.xlsx");
    };

    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setFileName(file.name);
        const reader = new FileReader();

        reader.onload = (evt) => {
            try {
                const bstr = evt.target?.result;
                const wb = XLSX.read(bstr, { type: 'binary' });
                const wsname = wb.SheetNames[0];
                const ws = wb.Sheets[wsname];
                const data = XLSX.utils.sheet_to_json(ws, { defval: "" });

                const parsed = data.map((row: any) => {
                    const name = String(row["Nama Produk*"] || row["Nama Produk"] || row["name"] || "").trim();
                    const barcode = String(row["Barcode"] || row["barcode"] || "").trim();
                    const unit = String(row["Satuan Utama"] || row["Satuan"] || row["unit"] || "Pcs").trim();
                    const price = Number(row["Harga Jual*"] || row["Harga Jual"] || row["price"] || 0);
                    const cost = Number(row["Harga Modal*"] || row["Harga Modal"] || row["cost"] || 0);
                    const initialStock = Number(row["Stok Awal"] || row["stok"] || 0);
                    const categoryName = String(row["Kategori"] || row["category"] || "").trim();
                    const vendorName = String(row["Vendor"] || row["vendor"] || "").trim();
                    const description = String(row["Deskripsi"] || row["description"] || "").trim();

                    let isValid = true;
                    let errorMessage = "";

                    if (!name) {
                        isValid = false;
                        errorMessage = "Nama Produk wajib diisi";
                    } else if (price <= 0) {
                        isValid = false;
                        errorMessage = "Harga Jual harus > 0";
                    }

                    return {
                        name,
                        barcode,
                        unit: unit || 'Pcs',
                        price,
                        cost,
                        initialStock,
                        categoryName,
                        vendorName,
                        description,
                        isValid,
                        errorMessage
                    };
                });

                setParsedProducts(parsed);
            } catch (error) {
                alert("Gagal membaca file. Pastikan format file .xlsx, .xls, atau .csv");
            }
        };

        reader.readAsBinaryString(file);
    };

    const handleImportSubmit = () => {
        const validItems = parsedProducts.filter(p => p.isValid);
        if (validItems.length === 0) {
            alert("Tidak ada data produk valid untuk di-import.");
            return;
        }

        setIsProcessing(true);

        validItems.forEach(item => {
            const cat = productCategories.find(c => c.name.toLowerCase() === item.categoryName.toLowerCase());
            const ven = vendors.find(v => v.name.toLowerCase() === item.vendorName.toLowerCase());

            const payload = {
                productData: {
                    name: item.name,
                    barcode: item.barcode || undefined,
                    unit: item.unit || 'Pcs',
                    price: item.price,
                    cost: item.cost,
                    initialStock: item.initialStock,
                    categoryId: cat ? cat.id : undefined,
                    vendorId: ven ? ven.id : undefined,
                    description: item.description || undefined,
                    isTaxable: true,
                    pricingType: 'manual' as const,
                    status: 'active' as const
                },
                typeLocations: [],
                initialStocks: {}
            };

            dispatch({ type: 'products/add', payload });
        });

        setIsProcessing(false);
        alert(`Berhasil meng-import ${validItems.length} produk ke dalam sistem!`);
        onClose();
        setParsedProducts([]);
        setFileName('');
    };

    const validCount = parsedProducts.filter(p => p.isValid).length;
    const invalidCount = parsedProducts.length - validCount;

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title="Import Data Produk dari Excel / CSV"
            footer={
                <div className="flex gap-2 justify-between w-full items-center">
                    <Button onClick={handleDownloadTemplate} variant="secondary" className="text-xs">
                        <Download className="w-3.5 h-3.5 mr-1.5 text-emerald-600 dark:text-emerald-400" /> Download Template Excel
                    </Button>
                    <div className="flex gap-2">
                        <Button onClick={onClose} variant="secondary">Batal</Button>
                        <Button onClick={handleImportSubmit} disabled={validCount === 0 || isProcessing}>
                            {isProcessing ? "Meng-import..." : `Import ${validCount} Produk`}
                        </Button>
                    </div>
                </div>
            }
            maxWidth="max-w-4xl"
        >
            <div className="space-y-4">
                {/* Instruction & File Upload */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="p-4 bg-emerald-50/70 dark:bg-emerald-950/40 rounded-xl border border-emerald-100 dark:border-emerald-900/60 space-y-2">
                        <div className="flex items-center gap-2 text-emerald-800 dark:text-emerald-300 font-bold text-sm">
                            <FileSpreadsheet className="w-4 h-4" /> Petunjuk Import Excel
                        </div>
                        <ol className="text-xs text-emerald-900 dark:text-emerald-200 space-y-1 list-decimal pl-4">
                            <li>Klik <strong>Download Template Excel</strong> untuk mengunduh format file.</li>
                            <li>Isi kolom (Nama Produk & Harga Jual wajib diisi).</li>
                            <li>Upload file Excel/CSV yang telah diisi di samping.</li>
                            <li>Periksa pratinjau lalu klik <strong>Import Produk</strong>.</li>
                        </ol>
                    </div>

                    <div className="flex flex-col items-center justify-center p-6 border-2 border-dashed border-slate-300 dark:border-zinc-700 hover:border-emerald-500 rounded-xl transition-all bg-slate-50/50 dark:bg-zinc-800/40 cursor-pointer relative">
                        <input
                            type="file"
                            accept=".xlsx, .xls, .csv"
                            onChange={handleFileUpload}
                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                        />
                        <Upload className="w-8 h-8 text-slate-400 mb-2" />
                        <p className="text-xs font-semibold text-slate-700 dark:text-zinc-300 text-center">
                            {fileName ? fileName : "Klik atau seret file Excel/CSV di sini"}
                        </p>
                        <p className="text-[11px] text-slate-400 mt-1">Format didukung: .xlsx, .xls, .csv</p>
                    </div>
                </div>

                {/* Preview Table */}
                {parsedProducts.length > 0 && (
                    <div className="space-y-2.5">
                        <div className="flex items-center justify-between">
                            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-zinc-300">
                                Pratinjau Data ({parsedProducts.length} Produk)
                            </h4>
                            <div className="flex gap-2 text-xs font-semibold">
                                <span className="px-2.5 py-0.5 bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 rounded-md">
                                    {validCount} Valid
                                </span>
                                {invalidCount > 0 && (
                                    <span className="px-2.5 py-0.5 bg-rose-50 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300 rounded-md">
                                        {invalidCount} Error
                                    </span>
                                )}
                            </div>
                        </div>

                        <div className="max-h-60 overflow-y-auto border border-slate-200 dark:border-zinc-700 rounded-xl">
                            <table className="w-full text-left text-xs">
                                <thead className="bg-slate-100 dark:bg-zinc-800 sticky top-0 font-bold text-slate-700 dark:text-zinc-300">
                                    <tr>
                                        <th className="p-2">Status</th>
                                        <th className="p-2">Nama Produk</th>
                                        <th className="p-2">Barcode</th>
                                        <th className="p-2">Satuan</th>
                                        <th className="p-2 text-right">Harga Jual</th>
                                        <th className="p-2 text-right">Harga Modal</th>
                                        <th className="p-2 text-center">Stok Awal</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-200 dark:divide-zinc-800">
                                    {parsedProducts.map((p, idx) => (
                                        <tr key={idx} className={p.isValid ? 'hover:bg-slate-50 dark:hover:bg-zinc-800/50' : 'bg-rose-50/50 dark:bg-rose-950/30'}>
                                            <td className="p-2">
                                                {p.isValid ? (
                                                    <span className="inline-flex items-center text-emerald-600 dark:text-emerald-400 font-medium">
                                                        <CheckCircle2 className="w-3.5 h-3.5 mr-1" /> Ready
                                                    </span>
                                                ) : (
                                                    <span className="inline-flex items-center text-rose-600 dark:text-rose-400 font-medium" title={p.errorMessage}>
                                                        <AlertCircle className="w-3.5 h-3.5 mr-1" /> {p.errorMessage}
                                                    </span>
                                                )}
                                            </td>
                                            <td className="p-2 font-semibold text-slate-900 dark:text-white">{p.name || '-'}</td>
                                            <td className="p-2 font-mono text-slate-500">{p.barcode || '-'}</td>
                                            <td className="p-2">{p.unit}</td>
                                            <td className="p-2 text-right font-mono text-emerald-600 font-semibold">Rp{p.price.toLocaleString('id-ID')}</td>
                                            <td className="p-2 text-right font-mono text-slate-500">Rp{p.cost.toLocaleString('id-ID')}</td>
                                            <td className="p-2 text-center font-mono">{p.initialStock}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}
            </div>
        </Modal>
    );
};


export const ProductListPage: React.FC = () => {
    const { state, dispatch } = useAppContext();
    const { 
        products = [], 
        inventoryLevels = [], 
        currentBranchId = null, 
        brands = [], 
        productCategories = [] 
    } = state || {};
    
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isImportModalOpen, setIsImportModalOpen] = useState(false);
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

    const [page, setPageNum] = useState(1);
    const pageSize = 50;

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
            setSelectedProductIds(new Set((paginatedProducts || []).map(p => p.id)));
        } else {
            setSelectedProductIds(new Set());
        }
    };

    const productStockMap = useMemo(() => {
        const map = new Map<string, number>();
        if (!inventoryLevels || inventoryLevels.length === 0) return map;
        for (let i = 0; i < inventoryLevels.length; i++) {
            const inv = inventoryLevels[i];
            if (inv && inv.productId && (!currentBranchId || inv.locationId === currentBranchId)) {
                map.set(inv.productId, (map.get(inv.productId) || 0) + (inv.quantity || 0));
            }
        }
        return map;
    }, [inventoryLevels, currentBranchId]);

    const brandMap = useMemo(() => new Map((brands || []).map(b => [b.id, b.name])), [brands]);

    const lowerSearchTerm = useMemo(() => (searchTerm || '').trim().toLowerCase(), [searchTerm]);

    const filteredProducts = useMemo(() => {
        if (!Array.isArray(products) || products.length === 0) return [];
        if (!lowerSearchTerm && categoryFilter === 'all') return products;

        return products.filter(product => {
            if (!product) return false;
            if (categoryFilter !== 'all' && product.categoryId !== categoryFilter) return false;
            if (!lowerSearchTerm) return true;
            
            const productName = (product.name || '').toLowerCase();
            const productBarcode = (product.barcode || '').toLowerCase();
            return productName.includes(lowerSearchTerm) || productBarcode.includes(lowerSearchTerm);
        });
    }, [products, lowerSearchTerm, categoryFilter]);

    // Reset to page 1 when filter changes
    React.useEffect(() => { setPageNum(1); }, [lowerSearchTerm, categoryFilter]);

    const totalPages = Math.ceil(filteredProducts.length / pageSize);
    const paginatedProducts = useMemo(() => filteredProducts.slice((page - 1) * pageSize, page * pageSize), [filteredProducts, page, pageSize]);

    return (
        <div className="p-3 md:p-5 h-full flex flex-col gap-3">
            {/* Top Navbar Header Control Bar */}
            <header className="bg-white dark:bg-zinc-900 px-4 py-2.5 rounded-2xl border border-zinc-200/80 dark:border-zinc-800 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-3 shrink-0">
                {/* Title & Item Count */}
                <div className="flex items-center gap-3 shrink-0">
                    <div className="w-9 h-9 rounded-xl bg-sky-500/10 text-sky-600 dark:text-sky-400 flex items-center justify-center font-black text-sm">
                        📦
                    </div>
                    <div>
                        <div className="flex items-center gap-2">
                            <h1 className="text-base font-black text-gray-900 dark:text-white tracking-tight">Data Produk</h1>
                            <span className="bg-slate-100 dark:bg-zinc-800 text-slate-600 dark:text-slate-400 text-[10px] font-bold px-2 py-0.5 rounded-full font-mono">
                                {filteredProducts.length}
                            </span>
                        </div>
                        <p className="text-[10px] text-slate-400 dark:text-slate-500 font-medium">Kelola & cetak label barang</p>
                    </div>
                </div>

                {/* Navbar Controls (Search, Filter, Actions) */}
                <div className="flex flex-wrap md:flex-nowrap items-center gap-2 flex-1 max-w-full md:max-w-3xl justify-end">
                    <div className="flex-1 min-w-[180px]">
                        <Input 
                            type="text"
                            placeholder="Cari nama produk / barcode..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="h-8 text-xs bg-slate-50/50 dark:bg-zinc-800/50 border-slate-200 dark:border-zinc-700/80 focus:bg-white"
                        />
                    </div>
                    <div className="w-36 shrink-0">
                        <Select value={categoryFilter} onChange={e => setCategoryFilter(e.target.value)} className="h-8 text-xs bg-slate-50/50 dark:bg-zinc-800/50 border-slate-200 dark:border-zinc-700/80">
                            <option value="all">Semua Kategori</option>
                            {(productCategories || []).map(cat => (
                                <option key={cat.id} value={cat.id}>{cat.name}</option>
                            ))}
                        </Select>
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0">
                        <Button 
                            onClick={handlePrintSelected} 
                            variant="secondary"
                            className="gap-1.5 text-xs h-8 px-2.5 border-sky-200 dark:border-sky-800/50 bg-sky-50/50 hover:bg-sky-100 text-sky-700 dark:bg-sky-950/30 dark:text-sky-300"
                        >
                            <Printer className="w-3.5 h-3.5 text-sky-600 dark:text-sky-400" />
                            <span className="hidden lg:inline">Label</span> {selectedProductIds.size > 0 ? `(${selectedProductIds.size})` : ''}
                        </Button>
                        <Button onClick={() => setIsImportModalOpen(true)} variant="secondary" className="gap-1.5 text-xs h-8 px-2.5">
                            <Upload className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                            <span className="hidden lg:inline">Import</span>
                        </Button>
                        <Button onClick={() => handleOpenModal(null)} className="gap-1 text-xs h-8 px-3 font-bold whitespace-nowrap bg-primary-600 hover:bg-primary-700 text-white">
                            <Plus className="w-3.5 h-3.5" />
                            <span>Tambah Produk</span>
                        </Button>
                    </div>
                </div>
            </header>

            {/* Modal Import Excel */}
            <ImportProductModal isOpen={isImportModalOpen} onClose={() => setIsImportModalOpen(false)} />

            {/* Full-Page Free-Standing Data Table Container */}
            <div className="hidden sm:block flex-1 min-h-0 overflow-y-auto bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200/80 dark:border-zinc-800 shadow-xs">
                <Table>
                    <Thead>
                        <Tr>
                            <Th className="w-10 text-center py-2.5">
                                <input
                                    type="checkbox"
                                    checked={selectedProductIds.size > 0 && selectedProductIds.size === filteredProducts.length}
                                    onChange={e => handleSelectAll(e.target.checked)}
                                    className="rounded text-primary-600 w-4 h-4 cursor-pointer"
                                />
                            </Th>
                            <Th className="py-2.5 text-xs">Nama Produk</Th>
                            <Th className="py-2.5 text-xs">Barcode</Th>
                            <Th className="py-2.5 text-xs">Merk</Th>
                            <Th className="py-2.5 text-xs">Harga Jual</Th>
                            <Th className="text-center py-2.5 text-xs">Stok Tersedia</Th>
                            <Th className="py-2.5 text-xs">Status</Th>
                            <Th className="text-right py-2.5 text-xs">Aksi</Th>
                        </Tr>
                    </Thead>
                    <Tbody>
                        {paginatedProducts.map(product => {
                            const stock = productStockMap.get(product.id) || 0;
                            const priceFormatted = (product.price || 0).toLocaleString('id-ID');
                            const isSelected = selectedProductIds.has(product.id);
                            return (
                                <Tr key={product.id} className={`hover:bg-slate-50/70 dark:hover:bg-zinc-800/40 transition-colors ${isSelected ? 'bg-sky-50/40 dark:bg-sky-950/20' : ''}`}>
                                    <Td className="text-center py-1 px-2">
                                        <input
                                            type="checkbox"
                                            checked={isSelected}
                                            onChange={e => handleSelectProduct(product.id, e.target.checked)}
                                            className="rounded text-primary-600 w-3.5 h-3.5 cursor-pointer"
                                        />
                                    </Td>
                                    <Td className="py-1 px-2">
                                        <div className="font-bold text-zinc-900 dark:text-white text-[11px] leading-tight">
                                            {product.name || 'Tanpa Nama'}
                                        </div>
                                    </Td>
                                    <Td className="py-1 px-2">
                                        <span className="font-mono text-[10px] text-zinc-500 bg-slate-100 dark:bg-zinc-800 px-1 py-0.5 rounded">{product.barcode || '-'}</span>
                                    </Td>
                                    <Td className="py-1 px-2">
                                        <span className="text-[11px] font-medium text-zinc-600 dark:text-zinc-400">
                                            {product.brandId ? brandMap.get(product.brandId) || '-' : '-'}
                                        </span>
                                    </Td>
                                    <Td className="py-1 px-2">
                                        <span className="font-black text-emerald-600 dark:text-emerald-400 text-[11px] font-mono">
                                            Rp{priceFormatted}
                                        </span>
                                    </Td>
                                    <Td className="text-center py-1 px-2">
                                        <span className={`font-black font-mono text-[11px] px-1.5 py-0.2 rounded inline-block ${
                                            stock > 5 ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300' : stock > 0 ? 'bg-amber-50 text-amber-600 dark:bg-amber-950/40' : 'bg-red-50 text-red-600 dark:bg-red-950/40'
                                        }`}>
                                            {stock}
                                        </span>
                                    </Td>
                                    <Td className="py-1 px-2">
                                        <Badge variant={product.status === 'active' ? 'success' : 'neutral'} className="text-[9px] px-1.5 py-0">{product.status || 'active'}</Badge>
                                    </Td>
                                    <Td className="text-right py-1 px-2">
                                         <div className="flex items-center justify-end gap-1">
                                             <button
                                                 onClick={() => handleOpenDetailsModal(product)}
                                                 title="Lihat Detail"
                                                 className="p-1.5 text-slate-500 hover:text-sky-600 hover:bg-sky-50 dark:hover:bg-sky-950/40 rounded-lg transition-colors"
                                             >
                                                 <Eye className="w-4 h-4" />
                                             </button>
                                             <button
                                                 onClick={() => handleOpenModal(product)}
                                                 title="Ubah / Edit"
                                                 className="p-1.5 text-slate-500 hover:text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-950/40 rounded-lg transition-colors"
                                             >
                                                 <Edit className="w-4 h-4" />
                                             </button>
                                             {product.status !== 'archived' && (
                                                 <button
                                                     onClick={() => handleSetStatus(product.id, product.status === 'active' ? 'inactive' : 'active')}
                                                     title={product.status === 'active' ? 'Non-aktifkan' : 'Aktifkan'}
                                                     className={`p-1.5 rounded-lg transition-colors ${
                                                         product.status === 'active' 
                                                             ? 'text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40' 
                                                             : 'text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/40'
                                                     }`}
                                                 >
                                                     <Power className="w-4 h-4" />
                                                 </button>
                                             )}
                                         </div>
                                    </Td>
                                </Tr>
                            );
                        })}
                    </Tbody>
                </Table>
            </div>

            {/* MOBILE CARD GRID BLOCKS (Mobile screens only) */}
            <div className="grid grid-cols-1 gap-3 sm:hidden overflow-y-auto pb-4">
                {paginatedProducts.map(product => {
                    const stock = productStockMap.get(product.id) || 0;
                    return (
                        <div key={product.id} className="bg-white dark:bg-zinc-900 rounded-2xl p-4 border border-zinc-200/80 dark:border-zinc-800 shadow-2xs flex flex-col justify-between relative">
                            <div className="flex items-start justify-between gap-2 mb-2">
                                <div className="flex items-center gap-2">
                                    <input
                                        type="checkbox"
                                        checked={selectedProductIds.has(product.id)}
                                        onChange={e => handleSelectProduct(product.id, e.target.checked)}
                                        className="rounded text-primary-600 w-4 h-4"
                                    />
                                    <Badge variant={product.status === 'active' ? 'success' : 'neutral'}>{product.status || 'active'}</Badge>
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

                            <div className="space-y-1 mb-3">
                                <h3 className="font-bold text-gray-900 dark:text-white text-sm leading-snug line-clamp-2">{product.name}</h3>
                                {product.brandId && (
                                    <p className="text-xs font-medium text-slate-500 dark:text-gray-400">Merk: {brandMap.get(product.brandId)}</p>
                                )}
                                {product.barcode && (
                                    <p className="text-[11px] font-mono text-slate-400 dark:text-gray-500">📷 {product.barcode}</p>
                                )}
                            </div>

                            <div className="pt-2 border-t border-slate-100 dark:border-gray-700/60 flex items-center justify-between mt-auto">
                                <div>
                                    <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Harga Jual</span>
                                    <p className="text-base font-black text-emerald-600 dark:text-emerald-400">Rp{product.price.toLocaleString('id-ID')}</p>
                                </div>
                                <div className="text-right">
                                    <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Stok</span>
                                    <p className={`text-sm font-black ${stock > 5 ? 'text-slate-800 dark:text-white' : stock > 0 ? 'text-amber-500' : 'text-red-500'}`}>{stock}</p>
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Pagination Bar */}
            {totalPages > 1 && (
                <div className="shrink-0 flex items-center justify-between gap-3 px-2 py-2 bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200/80 dark:border-zinc-800">
                    <span className="text-[11px] text-slate-400 font-medium">
                        {((page - 1) * pageSize) + 1}–{Math.min(page * pageSize, filteredProducts.length)} dari {filteredProducts.length} produk
                    </span>
                    <div className="flex items-center gap-1">
                        <button
                            onClick={() => setPageNum(p => Math.max(1, p - 1))}
                            disabled={page === 1}
                            className="px-2.5 py-1 text-xs font-bold rounded-lg bg-slate-100 dark:bg-zinc-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-zinc-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                        >‹ Prev</button>
                        <span className="text-[11px] font-bold text-slate-500 px-2">{page} / {totalPages}</span>
                        <button
                            onClick={() => setPageNum(p => Math.min(totalPages, p + 1))}
                            disabled={page === totalPages}
                            className="px-2.5 py-1 text-xs font-bold rounded-lg bg-slate-100 dark:bg-zinc-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-zinc-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                        >Next ›</button>
                    </div>
                </div>
            )}
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
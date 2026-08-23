import React, { useState, useRef, useEffect, useMemo } from 'react';
import { Plus, Search, Building2, Eye, Edit2, Archive, CheckCircle2 } from 'lucide-react';
import { Vendor, Status, Page } from '../types';
import { useAppContext } from '../hooks/useAppContext';
import { ActionsDropdown, DropdownItem, Modal, Button, Input, Table, Thead, Tbody, Tr, Th, Td, Badge } from './ui';

type VendorFormData = Omit<Vendor, 'id'>;

const VendorModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  onSave: (vendor: VendorFormData | Vendor) => void;
  existingVendor: Vendor | null;
}> = ({ isOpen, onClose, onSave, existingVendor }) => {
    const [formData, setFormData] = useState<Omit<Vendor, 'id'>>({
        name: '', contactPerson: '', email: '', phone: '', ownerName: '',
        companyAddress: '', taxId: '', bankAccount: '', paymentTerm: 30, status: 'active'
    });

    useEffect(() => {
        if (existingVendor) {
            setFormData(existingVendor);
        } else {
            setFormData({
                name: '', contactPerson: '', email: '', phone: '', ownerName: '',
                companyAddress: '', taxId: '', bankAccount: '', paymentTerm: 30, status: 'active'
            });
        }
    }, [existingVendor, isOpen]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({...prev, [name]: name === 'paymentTerm' ? parseInt(value) || 0 : value }));
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name) {
        alert('Mohon isi bidang wajib Nama Vendor');
        return;
    }
    if (existingVendor) {
        onSave({ ...formData, id: existingVendor.id });
    } else {
        onSave(formData);
    }
    onClose();
  };
    
    const footer = (
        <div className="flex justify-end gap-2">
            <button type="button" onClick={onClose} className="px-4 py-2 text-xs font-bold rounded-lg text-slate-700 dark:text-zinc-300 bg-slate-200 dark:bg-zinc-700 hover:bg-slate-300 dark:hover:bg-zinc-600 transition-colors">Batal</button>
            <Button onClick={handleSubmit} type="submit" className="text-xs py-2 px-4 bg-blue-600 hover:bg-blue-700 text-white font-bold">Simpan</Button>
        </div>
    );

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title={`${existingVendor ? 'Ubah' : 'Tambah'} Vendor`}
            footer={footer}
            maxWidth="max-w-2xl"
        >
            <form onSubmit={handleSubmit} className="space-y-3 text-xs">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div>
                        <label className="block text-xs font-bold text-slate-700 dark:text-zinc-300 mb-1">
                            Nama Vendor <span className="text-rose-500 font-bold">*</span>
                        </label>
                        <Input type="text" name="name" value={formData.name} onChange={handleInputChange} placeholder="Contoh: PT Sumber Pangan Utama" required className="text-xs py-1.5" />
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-slate-700 dark:text-zinc-300 mb-1">NPWP</label>
                        <Input type="text" name="taxId" value={formData.taxId} onChange={handleInputChange} placeholder="No. NPWP Perusahaan" className="text-xs py-1.5" />
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div>
                        <label className="block text-xs font-bold text-slate-700 dark:text-zinc-300 mb-1">
                            No Kantor
                        </label>
                        <Input type="tel" name="phone" value={formData.phone} onChange={handleInputChange} placeholder="021-xxxxxxx / 08xxxxx" className="text-xs py-1.5" />
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-slate-700 dark:text-zinc-300 mb-1">Email Kantor</label>
                        <Input type="email" name="email" value={formData.email} onChange={handleInputChange} placeholder="vendor@perusahaan.com" className="text-xs py-1.5" />
                    </div>
                </div>

                <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-zinc-300 mb-1">
                        Alamat Perusahaan
                    </label>
                    <textarea 
                        name="companyAddress" 
                        value={formData.companyAddress} 
                        onChange={handleInputChange} 
                        rows={2} 
                        placeholder="Alamat lengkap kantor vendor..." 
                        className="w-full rounded-lg border border-slate-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 p-2 text-xs text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
                    />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div>
                        <label className="block text-xs font-bold text-slate-700 dark:text-zinc-300 mb-1">No Rekening Pembayaran</label>
                        <Input type="text" name="bankAccount" value={formData.bankAccount} onChange={handleInputChange} placeholder="BCA 1234567890 a/n PT Vendor" className="text-xs py-1.5" />
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-slate-700 dark:text-zinc-300 mb-1">
                            Narahubung (PIC)
                        </label>
                        <Input type="text" name="contactPerson" value={formData.contactPerson} onChange={handleInputChange} placeholder="Nama PIC / Sales" className="text-xs py-1.5" />
                    </div>
                </div>

                <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-zinc-300 mb-1">Tempo Pembayaran (Hari)</label>
                    <Input type="number" name="paymentTerm" value={formData.paymentTerm} onChange={handleInputChange} placeholder="30" required className="text-xs py-1.5" />
                </div>
            </form>
        </Modal>
    );
};

export const VendorDetailsPage: React.FC<{ vendorId?: string, onBack?: () => void }> = ({ vendorId, onBack }) => {
    const { state, dispatch } = useAppContext();
    const { vendors, purchases, selectedVendorId } = state;

    const targetId = vendorId || selectedVendorId;
    const vendor = useMemo(() => vendors.find(v => v.id === targetId), [vendors, targetId]);

    const vendorPurchases = useMemo(() => {
        if (!vendor) return [];
        return purchases.filter(p => p.vendorId === vendor.id || p.vendorName?.toLowerCase() === vendor.name?.toLowerCase());
    }, [vendor, purchases]);

    const handleGoBack = () => {
        if (onBack) onBack();
        else dispatch({ type: 'ui/setPage', payload: Page.Vendors });
    };

    if (!vendor) {
        return (
            <div className="p-6 text-center space-y-4">
                <p className="text-slate-400">Data vendor tidak ditemukan.</p>
                <Button onClick={handleGoBack}>Kembali ke Daftar Vendor</Button>
            </div>
        );
    }

    return (
        <div className="w-full h-full flex flex-col p-4 md:p-6 space-y-4 overflow-y-auto bg-slate-50 dark:bg-zinc-950">
            {/* Top Toolbar */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 shrink-0 bg-white dark:bg-zinc-900 p-4 rounded-xl border border-slate-200/80 dark:border-zinc-800 shadow-2xs">
                <div>
                    <nav className="flex items-center gap-1.5 text-xs text-slate-400 dark:text-zinc-400 mb-1">
                        <span onClick={handleGoBack} className="hover:underline cursor-pointer">Data Vendor</span>
                        <span>/</span>
                        <span className="font-bold text-slate-700 dark:text-zinc-200">{vendor.name}</span>
                    </nav>
                    <h1 className="text-xl font-black text-slate-900 dark:text-white leading-tight flex items-center gap-2">
                        Detail Informasi Vendor (Pelanggan)
                    </h1>
                </div>

                <div className="flex items-center gap-2">
                    <Button type="button" variant="secondary" onClick={handleGoBack} className="text-xs py-1.5 px-3">
                        ← Kembali
                    </Button>
                </div>
            </div>

            {/* Content Card */}
            <div className="bg-white dark:bg-zinc-900 rounded-xl shadow-xs border border-slate-200 dark:border-zinc-800 p-5 md:p-6 space-y-5 text-xs">
                <div className="flex items-center gap-3 bg-slate-50 dark:bg-zinc-800/60 p-4 rounded-xl border border-slate-200 dark:border-zinc-700">
                    <div className="w-12 h-12 rounded-xl bg-purple-600 text-white font-black flex items-center justify-center text-xl shrink-0">
                        🏢
                    </div>
                    <div>
                        <h3 className="font-extrabold text-slate-900 dark:text-white text-base">{vendor.name}</h3>
                        <p className="text-xs text-slate-500 font-medium">PIC: <span className="font-bold text-slate-700 dark:text-slate-300">{vendor.contactPerson || '-'}</span></p>
                    </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
                    <div className="p-3 bg-slate-50 dark:bg-zinc-800/40 rounded-xl border border-slate-200/60 dark:border-zinc-700/60">
                        <span className="text-slate-500 text-[10px] uppercase font-bold block">No Kantor</span>
                        <strong className="text-slate-900 dark:text-white font-mono text-sm">{vendor.phone || '-'}</strong>
                    </div>
                    <div className="p-3 bg-slate-50 dark:bg-zinc-800/40 rounded-xl border border-slate-200/60 dark:border-zinc-700/60">
                        <span className="text-slate-500 text-[10px] uppercase font-bold block">Email Kantor</span>
                        <strong className="text-slate-900 dark:text-white truncate block text-sm">{vendor.email || '-'}</strong>
                    </div>
                    <div className="p-3 bg-slate-50 dark:bg-zinc-800/40 rounded-xl border border-slate-200/60 dark:border-zinc-700/60">
                        <span className="text-slate-500 text-[10px] uppercase font-bold block">Tempo Pembayaran</span>
                        <strong className="text-amber-600 font-bold text-sm">{vendor.paymentTerm} Hari</strong>
                    </div>
                    <div className="p-3 bg-slate-50 dark:bg-zinc-800/40 rounded-xl border border-slate-200/60 dark:border-zinc-700/60">
                        <span className="text-slate-500 text-[10px] uppercase font-bold block">Total Transaksi</span>
                        <strong className="text-purple-600 font-bold font-mono text-sm">{vendorPurchases.length} Pesanan</strong>
                    </div>
                </div>

                {vendor.companyAddress && (
                    <div className="p-3 bg-slate-50 dark:bg-zinc-800/40 rounded-xl border border-slate-200/60 dark:border-zinc-700/60">
                        <span className="text-slate-500 text-[10px] uppercase font-bold block">Alamat Perusahaan</span>
                        <p className="text-slate-800 dark:text-zinc-200 mt-0.5">{vendor.companyAddress}</p>
                    </div>
                )}

                <div className="pt-3 border-t dark:border-zinc-800 space-y-3">
                    <h4 className="font-bold text-slate-800 dark:text-zinc-200 text-sm">Riwayat Pembelian dengan Vendor Ini</h4>
                    {vendorPurchases.length === 0 ? (
                        <p className="text-slate-400 italic py-6 text-center">Belum ada riwayat transaksi pembelian dengan vendor ini.</p>
                    ) : (
                        <div className="overflow-hidden border border-slate-200 dark:border-zinc-700 rounded-xl">
                            <table className="w-full text-xs text-left">
                                <thead className="bg-slate-100 dark:bg-zinc-800 font-bold text-slate-600 dark:text-zinc-400 uppercase">
                                    <tr>
                                        <th className="p-3">ID Pesanan</th>
                                        <th className="p-3">Tgl. Pesan</th>
                                        <th className="p-3 text-center">Status Barang</th>
                                        <th className="p-3 text-center">Status Pembayaran</th>
                                        <th className="p-3 text-right">Total Grand (Rp)</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100 dark:divide-zinc-800">
                                    {vendorPurchases.map(p => (
                                        <tr key={p.id} className="hover:bg-slate-50 dark:hover:bg-zinc-800/40">
                                            <td className="p-3 font-mono font-bold text-purple-700 dark:text-purple-400 cursor-pointer hover:underline" onClick={() => {
                                                dispatch({ type: 'purchases/setSelectedId', payload: p.id });
                                                dispatch({ type: 'ui/setPage', payload: Page.PurchaseDetailsPage });
                                            }}>{p.id}</td>
                                            <td className="p-3 font-mono text-slate-500">{new Date(p.orderDate).toLocaleDateString('id-ID')}</td>
                                            <td className="p-3 text-center"><span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-blue-50 text-blue-700">{p.itemStatus || 'Draft'}</span></td>
                                            <td className="p-3 text-center"><span className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold ${p.paymentStatus === 'Lunas' ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'}`}>{p.paymentStatus || 'Belum Lunas'}</span></td>
                                            <td className="p-3 text-right font-mono font-bold text-slate-900 dark:text-white">Rp{p.grandTotal.toLocaleString('id-ID')}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export const VendorsListPage: React.FC = () => {
  const { state, dispatch } = useAppContext();
  const { vendors } = state;
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDetailsModalOpen, setDetailsModalOpen] = useState(false);
  const [selectedVendor, setSelectedVendor] = useState<Vendor | null>(null);
  const [statusFilter, setStatusFilter] = useState<Status | 'all'>('active');

  const handleSaveVendor = (vendorData: VendorFormData | Vendor) => {
    if ('id' in vendorData) {
        dispatch({ type: 'vendors/update', payload: vendorData });
    } else {
        dispatch({ type: 'vendors/add', payload: vendorData });
    }
  };
  
  const handleOpenModal = (vendor: Vendor | null = null) => {
    setSelectedVendor(vendor);
    setIsModalOpen(true);
  };
  
  const handleOpenDetailsModal = (vendor: Vendor) => {
    dispatch({ type: 'vendors/setSelectedId', payload: vendor.id });
    dispatch({ type: 'ui/setPage', payload: Page.VendorDetailsPage });
  };

  const handleSetStatus = (id: string, status: Status) => {
      if (confirm(`Are you sure you want to ${status} this vendor?`)) {
          dispatch({ type: 'vendors/setStatus', payload: { id, status } });
      }
  };

  const [searchTerm, setSearchTerm] = useState('');

  const filteredVendors = useMemo(() => {
    const term = searchTerm.toLowerCase();
    return vendors.filter(v => {
        const matchesStatus = statusFilter === 'all' || v.status === statusFilter;
        const matchesSearch = v.name.toLowerCase().includes(term) || (v.contactPerson && v.contactPerson.toLowerCase().includes(term)) || (v.phone && v.phone.includes(term));
        return matchesStatus && matchesSearch;
    });
  }, [vendors, statusFilter, searchTerm]);

  return (
    <div className="p-3 md:p-5 h-full flex flex-col gap-3 overflow-hidden bg-slate-50 dark:bg-zinc-950">
      {/* Top Header Control Bar */}
      <div className="bg-white dark:bg-zinc-900 px-4 py-2.5 rounded-2xl border border-zinc-200/80 dark:border-zinc-800 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-3 shrink-0">
        {/* Title & Count */}
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-sky-500/10 text-sky-600 dark:text-sky-400 flex items-center justify-center font-black text-sm shrink-0">
            🏢
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base font-black text-slate-900 dark:text-white tracking-tight">Data Vendor</h1>
              <span className="bg-slate-100 dark:bg-zinc-800 text-slate-600 dark:text-slate-400 text-[10px] font-bold px-2 py-0.5 rounded-full font-mono">{filteredVendors.length}</span>
            </div>
            <p className="text-[10px] text-slate-400 dark:text-slate-500 font-medium">Manajemen mitra & supplier barang</p>
          </div>
        </div>

        {/* Search Bar, Filters & Top Right Add Button */}
        <div className="flex flex-wrap md:flex-nowrap items-center gap-2 flex-1 max-w-full md:max-w-2xl justify-end">
          <div className="flex-1 min-w-[180px]">
            <Input 
              placeholder="Cari vendor, PIC, telepon..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="h-8 text-xs bg-slate-50/50 dark:bg-zinc-800/50 border-slate-200 dark:border-zinc-700/80 focus:bg-white rounded-xl"
            />
          </div>
          <div className="w-36 shrink-0">
            <select 
              value={statusFilter} 
              onChange={e => setStatusFilter(e.target.value as any)} 
              className="h-8 text-xs bg-slate-50/50 dark:bg-zinc-800/50 border border-slate-200 dark:border-zinc-700/80 rounded-xl px-2.5 text-slate-800 dark:text-zinc-200 w-full"
            >
              <option value="all">Semua Status</option>
              <option value="active">Aktif</option>
              <option value="archived">Diarsipkan</option>
            </select>
          </div>
          <Button 
            onClick={() => handleOpenModal()} 
            className="text-xs h-8 px-3 font-bold bg-primary-600 hover:bg-primary-700 text-white rounded-xl shadow-xs shrink-0 flex items-center gap-1 whitespace-nowrap ml-auto"
          >
            <span>+ Tambah Vendor</span>
          </Button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 min-h-0 overflow-y-auto">
        {/* 1. DESKTOP VIEW: Table Layout (md breakpoint up) */}
        <div className="hidden md:block bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200/80 dark:border-zinc-800 shadow-xs overflow-hidden h-full">
          <table className="w-full text-xs text-left text-gray-500 dark:text-gray-400">
            <thead className="text-[11px] font-extrabold text-gray-700 uppercase bg-slate-50 dark:bg-zinc-800/60 dark:text-gray-400 sticky top-0 border-b border-zinc-200/80 dark:border-zinc-800">
              <tr>
                <th scope="col" className="px-4 py-3">Nama Vendor</th>
                <th scope="col" className="px-4 py-3">PIC (Sales)</th>
                <th scope="col" className="px-4 py-3">No. Kantor / HP</th>
                <th scope="col" className="px-4 py-3">Email</th>
                <th scope="col" className="px-4 py-3 text-center">Tempo Bayar</th>
                <th scope="col" className="px-4 py-3 text-center">Status</th>
                <th scope="col" className="px-4 py-3 text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-zinc-800/60">
              {filteredVendors.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-12 text-slate-400">
                    Tidak ada data vendor yang ditemukan.
                  </td>
                </tr>
              ) : (
                filteredVendors.map((vendor) => (
                  <tr key={vendor.id} className="hover:bg-slate-50/70 dark:hover:bg-zinc-800/40 transition-colors">
                    <td className="px-4 py-2.5 font-bold text-gray-900 dark:text-white">
                      <span className="truncate max-w-[220px] block">{vendor.name}</span>
                    </td>
                    <td className="px-4 py-2.5 font-medium text-slate-700 dark:text-slate-300">
                      {vendor.contactPerson || '-'}
                    </td>
                    <td className="px-4 py-2.5 font-mono text-slate-700 dark:text-slate-300">{vendor.phone || '-'}</td>
                    <td className="px-4 py-2.5 text-slate-500 truncate max-w-[200px]">{vendor.email || '-'}</td>
                    <td className="px-4 py-2.5 text-center font-bold text-amber-600 dark:text-amber-400 font-mono">
                      {vendor.paymentTerm} Hari
                    </td>
                    <td className="px-4 py-2.5 text-center">
                      <Badge variant={vendor.status === 'active' ? 'success' : 'secondary'} className="text-[10px] px-2 py-0.5">
                        {vendor.status === 'active' ? 'Aktif' : 'Arsip'}
                      </Badge>
                    </td>
                    <td className="px-4 py-2.5 text-center">
                      <div className="flex items-center justify-center gap-1">
                        <button
                          type="button"
                          onClick={() => handleOpenDetailsModal(vendor)}
                          title="Lihat Detail & Riwayat Transaksi"
                          className="p-1.5 rounded-lg text-blue-600 hover:bg-blue-50 dark:hover:bg-zinc-800 transition-colors"
                        >
                          👁️
                        </button>
                        <button
                          type="button"
                          onClick={() => handleOpenModal(vendor)}
                          title="Ubah Data Vendor"
                          className="p-1.5 rounded-lg text-amber-600 hover:bg-amber-50 dark:hover:bg-zinc-800 transition-colors"
                        >
                          ✏️
                        </button>
                        {vendor.status !== 'archived' && (
                          <button
                            type="button"
                            onClick={() => handleSetStatus(vendor.id, vendor.status === 'active' ? 'archived' : 'active')}
                            title={vendor.status === 'active' ? 'Arsipkan' : 'Aktifkan'}
                            className="p-1.5 rounded-lg text-rose-600 hover:bg-rose-50 dark:hover:bg-zinc-800 transition-colors"
                          >
                            📦
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* 2. MOBILE VIEW: Kotak Balok Cards (below md breakpoint) */}
        <div className="block md:hidden space-y-3">
          {filteredVendors.length === 0 ? (
            <div className="bg-white dark:bg-zinc-900 rounded-2xl p-8 text-center border border-zinc-200 dark:border-zinc-800 text-slate-400 text-xs">
              Tidak ada data vendor.
            </div>
          ) : (
            filteredVendors.map((vendor) => (
              <div key={vendor.id} className="bg-white dark:bg-zinc-900 rounded-xl border border-slate-200/80 dark:border-zinc-800 p-3.5 shadow-2xs space-y-2.5">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h3 className="font-extrabold text-xs text-slate-900 dark:text-white line-clamp-1">{vendor.name}</h3>
                    <p className="text-[10px] text-slate-400 font-medium">PIC: {vendor.contactPerson || '-'}</p>
                  </div>
                  <Badge variant={vendor.status === 'active' ? 'success' : 'secondary'} className="text-[9px] px-1.5 py-0">
                    {vendor.status === 'active' ? 'Aktif' : 'Arsip'}
                  </Badge>
                </div>
                <div className="space-y-1 text-xs text-slate-600 dark:text-zinc-300 font-mono border-y border-slate-100 dark:border-zinc-800 py-2">
                  {vendor.phone && <div>📞 {vendor.phone}</div>}
                  {vendor.email && <div className="truncate font-sans text-slate-500 text-[11px]">✉️ {vendor.email}</div>}
                  <div className="text-[11px] text-amber-600 font-bold font-sans">Tempo: {vendor.paymentTerm} Hari</div>
                </div>
                <div className="flex justify-end gap-1.5">
                  <button
                    type="button"
                    onClick={() => handleOpenDetailsModal(vendor)}
                    title="Lihat Detail"
                    className="p-1.5 rounded-lg border border-slate-200 dark:border-zinc-700 text-blue-600 hover:bg-blue-50 text-xs"
                  >
                    👁️ Detail
                  </button>
                  <button
                    type="button"
                    onClick={() => handleOpenModal(vendor)}
                    title="Ubah"
                    className="p-1.5 rounded-lg border border-slate-200 dark:border-zinc-700 text-amber-600 hover:bg-amber-50 text-xs"
                  >
                    ✏️ Ubah
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      <VendorModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSaveVendor}
        existingVendor={selectedVendor}
      />
    </div>
  );
};

export const Vendors: React.FC = () => {
    const { state } = useAppContext();
    switch (state.currentPage) {
        case Page.VendorDetailsPage:
            return <VendorDetailsPage />;
        default:
            return <VendorsListPage />;
    }
};

export const VendorsPage = Vendors;
export default Vendors;
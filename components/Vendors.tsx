import React, { useState, useRef, useEffect, useMemo } from 'react';
import { Plus, Search, Building2, Eye, Edit2, Archive, CheckCircle2 } from 'lucide-react';
import { Vendor, Status } from '../types';
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
    if (!formData.name || !formData.phone || !formData.companyAddress || !formData.contactPerson) {
        alert('Mohon lengkapi semua bidang wajib yang bertanda bintang (*)');
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
                            No Kantor <span className="text-rose-500 font-bold">*</span>
                        </label>
                        <Input type="tel" name="phone" value={formData.phone} onChange={handleInputChange} placeholder="021-xxxxxxx / 08xxxxx" required className="text-xs py-1.5" />
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-slate-700 dark:text-zinc-300 mb-1">Email Kantor</label>
                        <Input type="email" name="email" value={formData.email} onChange={handleInputChange} placeholder="vendor@perusahaan.com" className="text-xs py-1.5" />
                    </div>
                </div>

                <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-zinc-300 mb-1">
                        Alamat Perusahaan <span className="text-rose-500 font-bold">*</span>
                    </label>
                    <textarea 
                        name="companyAddress" 
                        value={formData.companyAddress} 
                        onChange={handleInputChange} 
                        rows={2} 
                        placeholder="Alamat lengkap kantor vendor..." 
                        required 
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
                            Narahubung (PIC) <span className="text-rose-500 font-bold">*</span>
                        </label>
                        <Input type="text" name="contactPerson" value={formData.contactPerson} onChange={handleInputChange} placeholder="Nama PIC / Sales" required className="text-xs py-1.5" />
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

const VendorDetailsModal: React.FC<{
    isOpen: boolean;
    onClose: () => void;
    vendor: Vendor | null;
}> = ({ isOpen, onClose, vendor }) => {
    if (!vendor) return null;
    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Detail Informasii Vendor" maxWidth="max-w-md">
             <div className="space-y-3 text-xs">
                <div className="flex items-center gap-3 bg-slate-50 dark:bg-zinc-800/60 p-3 rounded-xl border border-slate-200 dark:border-zinc-700">
                    <div className="w-10 h-10 rounded-lg bg-blue-600 text-white font-black flex items-center justify-center text-lg">
                        🏢
                    </div>
                    <div>
                        <h3 className="font-bold text-slate-900 dark:text-white text-sm">{vendor.name}</h3>
                        <p className="text-[11px] text-slate-500">PIC: {vendor.contactPerson || '-'}</p>
                    </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    <div className="p-2.5 bg-slate-50 dark:bg-zinc-800/40 rounded-lg border border-slate-200/60 dark:border-zinc-700/60">
                        <span className="text-slate-500 text-[10px] uppercase font-bold block">No Kantor</span>
                        <strong className="text-slate-900 dark:text-white font-mono">{vendor.phone || '-'}</strong>
                    </div>
                    <div className="p-2.5 bg-slate-50 dark:bg-zinc-800/40 rounded-lg border border-slate-200/60 dark:border-zinc-700/60">
                        <span className="text-slate-500 text-[10px] uppercase font-bold block">Email Kantor</span>
                        <strong className="text-slate-900 dark:text-white truncate block">{vendor.email || '-'}</strong>
                    </div>
                    <div className="p-2.5 bg-slate-50 dark:bg-zinc-800/40 rounded-lg border border-slate-200/60 dark:border-zinc-700/60">
                        <span className="text-slate-500 text-[10px] uppercase font-bold block">NPWP</span>
                        <strong className="text-slate-900 dark:text-white font-mono">{vendor.taxId || '-'}</strong>
                    </div>
                    <div className="p-2.5 bg-slate-50 dark:bg-zinc-800/40 rounded-lg border border-slate-200/60 dark:border-zinc-700/60">
                        <span className="text-slate-500 text-[10px] uppercase font-bold block">Tempo Pembayaran</span>
                        <strong className="text-amber-600 font-bold">{vendor.paymentTerm} Hari</strong>
                    </div>
                    <div className="col-span-1 sm:col-span-2 p-2.5 bg-slate-50 dark:bg-zinc-800/40 rounded-lg border border-slate-200/60 dark:border-zinc-700/60">
                        <span className="text-slate-500 text-[10px] uppercase font-bold block">No Rekening Pembayaran</span>
                        <strong className="text-slate-900 dark:text-white font-mono">{vendor.bankAccount || '-'}</strong>
                    </div>
                    <div className="col-span-1 sm:col-span-2 p-2.5 bg-slate-50 dark:bg-zinc-800/40 rounded-lg border border-slate-200/60 dark:border-zinc-700/60">
                        <span className="text-slate-500 text-[10px] uppercase font-bold block">Alamat Perusahaan</span>
                        <p className="text-slate-800 dark:text-zinc-200 mt-0.5">{vendor.companyAddress || '-'}</p>
                    </div>
                </div>
            </div>
        </Modal>
    );
};

export const Vendors: React.FC = () => {
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
    setSelectedVendor(vendor);
    setDetailsModalOpen(true);
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
    <div className="w-full h-full flex flex-col p-4 md:p-6 space-y-3 overflow-hidden">
      {/* Top Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 shrink-0 bg-white dark:bg-zinc-900 p-4 rounded-xl border border-slate-200/80 dark:border-zinc-800 shadow-2xs">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-blue-600 text-white flex items-center justify-center font-bold shrink-0 shadow-2xs">
            <Building2 className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-base font-black text-slate-900 dark:text-white leading-tight">Data Vendor</h1>
            <p className="text-xs text-slate-500 dark:text-zinc-400">Kelola informasi mitra dan pemasok barang</p>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <Button onClick={() => handleOpenModal()} className="text-xs py-1.5 px-3 bg-blue-600 hover:bg-blue-700 text-white gap-1.5 shadow-2xs font-bold">
            <Plus className="w-4 h-4" />
            Tambah Vendor
          </Button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 min-h-0 bg-white dark:bg-zinc-900 rounded-xl border border-slate-200/80 dark:border-zinc-800 shadow-2xs overflow-hidden flex flex-col">
        {/* Search & Filter Header Bar */}
        <div className="p-3 border-b border-slate-100 dark:border-zinc-800 flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0 bg-slate-50/50 dark:bg-zinc-900/50">
          <div className="relative w-full sm:w-72">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <Input 
              placeholder="Cari nama vendor, PIC, telepon..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="pl-9 text-xs py-1.5"
            />
          </div>
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <span className="text-xs text-slate-500 font-medium">Status:</span>
            <select 
              value={statusFilter} 
              onChange={e => setStatusFilter(e.target.value as any)} 
              className="text-xs py-1 px-2.5 rounded-lg border border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-slate-800 dark:text-zinc-200"
            >
              <option value="all">Semua Status</option>
              <option value="active">Aktif</option>
              <option value="archived">Diarsipkan</option>
            </select>
          </div>
        </div>

        {/* 1. DESKTOP VIEW: Table Layout (md breakpoint up) */}
        <div className="hidden md:block overflow-x-auto flex-1">
          <Table>
            <Thead>
              <Tr>
                <Th>Nama Vendor</Th>
                <Th>Narahubung (PIC)</Th>
                <Th>No. Kantor & Email</Th>
                <Th>NPWP & Rekening</Th>
                <Th className="text-center">Tempo Bayar</Th>
                <Th className="text-center">Status</Th>
                <Th className="text-right">Aksi</Th>
              </Tr>
            </Thead>
            <Tbody>
              {filteredVendors.length === 0 ? (
                <Tr>
                  <Td colSpan={7} className="text-center py-12 text-slate-400">
                    Tidak ada data vendor yang tersedia.
                  </Td>
                </Tr>
              ) : (
                filteredVendors.map((vendor) => (
                  <Tr key={vendor.id} className="hover:bg-slate-50 dark:hover:bg-zinc-800/50 transition-colors">
                    <Td className="font-bold text-slate-900 dark:text-white">
                      <div className="flex items-center gap-2">
                        <span className="w-7 h-7 rounded-lg bg-amber-50 dark:bg-amber-950/40 text-amber-600 flex items-center justify-center text-xs font-bold shrink-0">
                          🏢
                        </span>
                        <div>
                          <span className="block font-bold">{vendor.name}</span>
                          <span className="text-[11px] font-normal text-slate-400 block truncate max-w-[200px]">{vendor.companyAddress || '-'}</span>
                        </div>
                      </div>
                    </Td>
                    <Td className="font-medium text-slate-800 dark:text-zinc-200">
                      {vendor.contactPerson || '-'}
                    </Td>
                    <Td className="text-xs text-slate-600 dark:text-zinc-300 font-mono">
                      <div>📞 {vendor.phone || '-'}</div>
                      <div className="text-slate-400 font-sans text-[11px] truncate max-w-[160px]">✉️ {vendor.email || '-'}</div>
                    </Td>
                    <Td className="text-xs text-slate-600 dark:text-zinc-300 font-mono">
                      <div>NPWP: {vendor.taxId || '-'}</div>
                      <div className="text-slate-400 text-[11px]">Rek: {vendor.bankAccount || '-'}</div>
                    </Td>
                    <Td className="text-center font-mono font-bold text-amber-600 dark:text-amber-400">
                      {vendor.paymentTerm} Hari
                    </Td>
                    <Td className="text-center">
                      <Badge variant={vendor.status === 'active' ? 'success' : 'secondary'}>
                        {vendor.status === 'active' ? 'Aktif' : 'Arsip'}
                      </Badge>
                    </Td>
                    <Td className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button 
                          onClick={() => handleOpenDetailsModal(vendor)} 
                          variant="secondary" 
                          className="text-[11px] py-1 px-2 gap-1 text-blue-600"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          Detail
                        </Button>
                        <Button 
                          onClick={() => handleOpenModal(vendor)} 
                          variant="secondary" 
                          className="text-[11px] py-1 px-2 gap-1"
                        >
                          <Edit2 className="w-3.5 h-3.5 text-slate-500" />
                          Ubah
                        </Button>
                      </div>
                    </Td>
                  </Tr>
                ))
              )}
            </Tbody>
          </Table>
        </div>

        {/* 2. MOBILE VIEW: Compact Cards (below md breakpoint) */}
        <div className="block md:hidden overflow-y-auto p-3 space-y-3 flex-1">
          {filteredVendors.length === 0 ? (
            <div className="text-center py-10 text-slate-400 text-xs">
              Tidak ada data vendor yang tersedia.
            </div>
          ) : (
            filteredVendors.map((vendor) => (
              <div key={vendor.id} className="bg-white dark:bg-zinc-800 rounded-xl p-4 border border-slate-200/80 dark:border-zinc-700/80 shadow-2xs space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-lg bg-amber-50 dark:bg-amber-950/40 text-amber-600 flex items-center justify-center font-bold shrink-0 text-sm">
                      🏢
                    </div>
                    <div>
                      <h3 className="font-bold text-slate-900 dark:text-white text-sm leading-tight">{vendor.name}</h3>
                      <p className="text-xs text-slate-500">PIC: {vendor.contactPerson || '-'}</p>
                    </div>
                  </div>
                  <Badge variant={vendor.status === 'active' ? 'success' : 'secondary'}>
                    {vendor.status === 'active' ? 'Aktif' : 'Arsip'}
                  </Badge>
                </div>

                <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-100 dark:border-zinc-700/60 text-xs font-mono">
                  <div>
                    <span className="text-[10px] text-slate-400 font-sans uppercase font-bold block">No Kantor</span>
                    <span className="text-slate-800 dark:text-zinc-200">{vendor.phone || '-'}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 font-sans uppercase font-bold block">Tempo Bayar</span>
                    <span className="text-amber-600 font-bold">{vendor.paymentTerm} Hari</span>
                  </div>
                </div>

                <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100 dark:border-zinc-700/60">
                  <Button onClick={() => handleOpenDetailsModal(vendor)} variant="secondary" className="text-xs py-1 px-3 gap-1 text-blue-600">
                    <Eye className="w-3.5 h-3.5" />
                    Detail
                  </Button>
                  <Button onClick={() => handleOpenModal(vendor)} variant="secondary" className="text-xs py-1 px-3 gap-1">
                    <Edit2 className="w-3.5 h-3.5 text-slate-500" />
                    Ubah
                  </Button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      <VendorModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} onSave={handleSaveVendor} existingVendor={selectedVendor}/>
      <VendorDetailsModal isOpen={isDetailsModalOpen} onClose={() => setDetailsModalOpen(false)} vendor={selectedVendor} />
    </div>
  );
};

export const VendorsPage = Vendors;
export default Vendors;
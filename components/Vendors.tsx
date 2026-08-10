import React, { useState, useRef, useEffect, useMemo } from 'react';
import { Vendor, Status } from '../types';
import { useAppContext } from '../hooks/useAppContext';
import { ActionsDropdown, DropdownItem, Modal, Button, Input } from './ui';

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
    if (existingVendor) {
        onSave({ ...formData, id: existingVendor.id });
    } else {
        onSave(formData);
    }
    onClose();
  };
    
    const footer = (
        <>
            <button type="button" onClick={onClose} className="px-4 py-2 rounded-md text-gray-700 dark:text-gray-200 bg-gray-200 dark:bg-gray-600 hover:bg-gray-300 dark:hover:bg-gray-500">Batal</button>
            <Button onClick={handleSubmit} type="submit">Simpan</Button>
        </>
    );

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title={`${existingVendor ? 'Ubah' : 'Tambah'} Vendor`}
            footer={footer}
        >
            <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Nama Vendor</label>
                        <Input type="text" name="name" value={formData.name} onChange={handleInputChange} required />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Nama Pemilik</label>
                        <Input type="text" name="ownerName" value={formData.ownerName} onChange={handleInputChange} required />
                    </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Narahubung</label>
                        <Input type="text" name="contactPerson" value={formData.contactPerson} onChange={handleInputChange} required />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Telepon</label>
                        <Input type="tel" name="phone" value={formData.phone} onChange={handleInputChange} required />
                    </div>
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Email</label>
                    <Input type="email" name="email" value={formData.email} onChange={handleInputChange} required />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Alamat Perusahaan</label>
                    <textarea name="companyAddress" value={formData.companyAddress} onChange={handleInputChange} rows={3} className="mt-1 block w-full rounded-md bg-gray-100 dark:bg-gray-700 border-transparent focus:border-primary-500"></textarea>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">NPWP</label>
                        <Input type="text" name="taxId" value={formData.taxId} onChange={handleInputChange} />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">No. Rekening Bank</label>
                        <Input type="text" name="bankAccount" value={formData.bankAccount} onChange={handleInputChange} />
                    </div>
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Tempo Pembayaran (hari)</label>
                    <Input type="number" name="paymentTerm" value={formData.paymentTerm} onChange={handleInputChange} required />
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
        <Modal isOpen={isOpen} onClose={onClose} title="Detail Vendor">
             <div className="space-y-4">
                <h3 className="text-lg font-semibold">{vendor.name}</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
                    <p><strong>Pemilik:</strong> {vendor.ownerName}</p>
                    <p><strong>Narahubung:</strong> {vendor.contactPerson}</p>
                    <p><strong>Email:</strong> {vendor.email}</p>
                    <p><strong>Telepon:</strong> {vendor.phone}</p>
                    <p><strong>NPWP:</strong> {vendor.taxId}</p>
                    <p><strong>Rekening:</strong> {vendor.bankAccount}</p>
                    <p><strong>Tempo Pembayaran:</strong> {vendor.paymentTerm} hari</p>
                    <p className="md:col-span-2"><strong>Alamat:</strong> {vendor.companyAddress}</p>
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

  const filteredVendors = useMemo(() => {
    if (statusFilter === 'all') return vendors;
    return vendors.filter(v => v.status === statusFilter);
  }, [vendors, statusFilter]);

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Vendor</h1>
        <Button onClick={() => handleOpenModal()}>
          Tambah Vendor
        </Button>
      </div>
      {/* VENDORS CARD GRID BLOCKS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 overflow-y-auto pb-4">
        {filteredVendors.map((vendor) => (
          <div key={vendor.id} className="bg-white dark:bg-gray-800 rounded-2xl p-5 border border-slate-100 dark:border-gray-700 shadow-sm hover:shadow-md transition-all flex flex-col justify-between relative group">
            <div className="flex items-start justify-between gap-2 mb-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-amber-500 to-orange-600 text-white font-black flex items-center justify-center text-sm shadow-md">
                  🏢
                </div>
                <div>
                  <h3 className="font-bold text-gray-900 dark:text-white text-base leading-snug">{vendor.name}</h3>
                  <p className="text-xs text-slate-500 dark:text-gray-400 font-medium">Pic: {vendor.contactPerson}</p>
                </div>
              </div>
              <ActionsDropdown>
                <DropdownItem onClick={() => handleOpenDetailsModal(vendor)}>Lihat Detail</DropdownItem>
                <DropdownItem onClick={() => handleOpenModal(vendor)}>Ubah</DropdownItem>
                {vendor.status === 'active' ? (
                  <DropdownItem onClick={() => handleSetStatus(vendor.id, 'archived')} className="text-red-500">Arsipkan</DropdownItem>
                ) : (
                  <DropdownItem onClick={() => handleSetStatus(vendor.id, 'active')} className="text-green-500">Aktifkan</DropdownItem>
                )}
              </ActionsDropdown>
            </div>

            <div className="space-y-1.5 py-3 border-t border-slate-100 dark:border-gray-700/60 text-xs text-slate-600 dark:text-gray-300">
              <p className="flex items-center gap-2 truncate">
                <span className="opacity-60">✉️</span> {vendor.email || '-'}
              </p>
              <p className="flex items-center gap-2">
                <span className="opacity-60">📞</span> {vendor.phone || '-'}
              </p>
            </div>

            <div className="pt-2 border-t border-slate-100 dark:border-gray-700/60 flex items-center justify-between mt-auto">
              <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Tempo Bayar</span>
              <span className="text-xs font-bold text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/50 px-2 py-0.5 rounded-md">
                {vendor.paymentTerm} hari
              </span>
            </div>
          </div>
        ))}
      </div>
      <VendorModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} onSave={handleSaveVendor} existingVendor={selectedVendor}/>
       <VendorDetailsModal isOpen={isDetailsModalOpen} onClose={() => setDetailsModalOpen(false)} vendor={selectedVendor} />
    </div>
  );
};
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useAppContext } from '../hooks/useAppContext';
import { Customer, Status, CustomerAddress } from '../types';
import { Input, Label, Button, ActionsDropdown, DropdownItem, Modal, Select, Badge } from './ui';

// --- Shared Components ---

export const CustomerModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  existingCustomer: Customer | null;
}> = ({ isOpen, onClose, existingCustomer }) => {
    const { dispatch } = useAppContext();
    const [customerType, setCustomerType] = useState<'Perorangan' | 'Perusahaan'>('Perorangan');
    const [formData, setFormData] = useState({
        name: '', email: '', phone: '', pin: '',
        companyName: '', taxId: '', address: '',
    });

    useEffect(() => {
        if (isOpen) {
            if (existingCustomer) {
                setCustomerType(existingCustomer.customerType);
                setFormData({
                    name: existingCustomer.name,
                    email: existingCustomer.email,
                    phone: existingCustomer.phone,
                    pin: '', // Don't show existing pin
                    companyName: existingCustomer.companyDetails?.companyName || '',
                    taxId: existingCustomer.companyDetails?.taxId || '',
                    address: existingCustomer.address || existingCustomer.companyDetails?.address || '',
                });
            } else {
                setCustomerType('Perorangan');
                setFormData({
                    name: '', email: '', phone: '', pin: '',
                    companyName: '', taxId: '', address: '',
                });
            }
        }
    }, [isOpen, existingCustomer]);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({...prev, [name]: value}));
    };
    
    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        
        if (existingCustomer) {
            // Update logic
            const updatedCustomer: Customer = {
                ...existingCustomer,
                name: customerType === 'Perusahaan' ? formData.companyName : formData.name,
                email: formData.email,
                phone: formData.phone,
                address: formData.address,
                pin: formData.pin ? formData.pin : existingCustomer.pin,
                customerType: customerType,
                companyDetails: customerType === 'Perusahaan' ? {
                    companyName: formData.companyName,
                    taxId: formData.taxId,
                    address: formData.address,
                } : undefined
            };
            dispatch({ type: 'customers/update', payload: updatedCustomer });
        } else {
            // Add new logic
            const payload: Omit<Customer, 'id' | 'joinDate' | 'depositBalance' | 'points' | 'addresses'> = {
                name: customerType === 'Perorangan' ? formData.name : formData.companyName,
                email: formData.email || `${formData.phone || 'cust'}@customer.local`,
                phone: formData.phone,
                address: formData.address,
                pin: formData.pin || '123456',
                customerType: customerType,
                status: 'active',
            };
    
            if (customerType === 'Perusahaan') {
                payload.companyDetails = {
                    companyName: formData.companyName,
                    taxId: formData.taxId,
                    address: formData.address,
                };
            }
            dispatch({ type: 'customers/add', payload });
        }
        onClose();
    };
    
    const footer = (
        <div className="flex items-center justify-end gap-2.5 pt-2">
            <Button type="button" variant="secondary" onClick={onClose} className="text-xs px-4 py-2">
                Batal
            </Button>
            <Button type="submit" form="customer-form" className="text-xs px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold shadow-xs">
                {existingCustomer ? 'Simpan Perubahan' : 'Tambah Pelanggan'}
            </Button>
        </div>
    );

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title={`${existingCustomer ? 'Ubah' : 'Tambah'} Data Pelanggan`}
            footer={footer}
            maxWidth="max-w-2xl"
        >
            <form id="customer-form" onSubmit={handleSubmit} className="space-y-5 py-1">
                {/* Tipe Pelanggan Selector */}
                <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-zinc-300 mb-2">
                        Tipe Pelanggan <span className="text-rose-500">*</span>
                    </label>
                    <div className="grid grid-cols-2 gap-3">
                        <label 
                            onClick={() => setCustomerType('Perorangan')} 
                            className={`flex items-center justify-center gap-2 p-3 rounded-xl border text-xs font-bold cursor-pointer transition-all ${
                                customerType === 'Perorangan'
                                    ? 'border-emerald-500 bg-emerald-50/50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-400 ring-2 ring-emerald-500/20 shadow-xs'
                                    : 'border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-slate-600 dark:text-zinc-400 hover:bg-slate-50 dark:hover:bg-zinc-800/60'
                            }`}
                        >
                            <input 
                                type="radio" 
                                name="customerType" 
                                value="Perorangan" 
                                checked={customerType === 'Perorangan'} 
                                onChange={() => setCustomerType('Perorangan')} 
                                className="sr-only" 
                            />
                            <span>👤 Perorangan (Individu)</span>
                        </label>

                        <label 
                            onClick={() => setCustomerType('Perusahaan')} 
                            className={`flex items-center justify-center gap-2 p-3 rounded-xl border text-xs font-bold cursor-pointer transition-all ${
                                customerType === 'Perusahaan'
                                    ? 'border-emerald-500 bg-emerald-50/50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-400 ring-2 ring-emerald-500/20 shadow-xs'
                                    : 'border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-slate-600 dark:text-zinc-400 hover:bg-slate-50 dark:hover:bg-zinc-800/60'
                            }`}
                        >
                            <input 
                                type="radio" 
                                name="customerType" 
                                value="Perusahaan" 
                                checked={customerType === 'Perusahaan'} 
                                onChange={() => setCustomerType('Perusahaan')} 
                                className="sr-only" 
                            />
                            <span>🏢 Perusahaan (Corporate)</span>
                        </label>
                    </div>
                </div>

                {/* Main Dynamic Information Fields */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {customerType === 'Perorangan' ? (
                        <div className="md:col-span-2">
                            <label htmlFor="name" className="block text-xs font-bold text-slate-700 dark:text-zinc-300 mb-1.5">
                                Nama Lengkap Pelanggan <span className="text-rose-500">*</span>
                            </label>
                            <input 
                                id="name" 
                                name="name" 
                                type="text"
                                value={formData.name} 
                                onChange={handleInputChange} 
                                required 
                                placeholder="Contoh: Budi Santoso"
                                className="w-full rounded-xl border border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-xs p-2.5 text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500 outline-none font-medium"
                            />
                        </div>
                    ) : (
                        <>
                            <div>
                                <label htmlFor="companyName" className="block text-xs font-bold text-slate-700 dark:text-zinc-300 mb-1.5">
                                    Nama Perusahaan <span className="text-rose-500">*</span>
                                </label>
                                <input 
                                    id="companyName" 
                                    name="companyName" 
                                    type="text"
                                    value={formData.companyName} 
                                    onChange={handleInputChange} 
                                    required 
                                    placeholder="Contoh: PT Sukses Mandiri"
                                    className="w-full rounded-xl border border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-xs p-2.5 text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500 outline-none font-medium"
                                />
                            </div>
                            <div>
                                <label htmlFor="taxId" className="block text-xs font-bold text-slate-700 dark:text-zinc-300 mb-1.5">
                                    NPWP Perusahaan
                                </label>
                                <input 
                                    id="taxId" 
                                    name="taxId" 
                                    type="text"
                                    value={formData.taxId} 
                                    onChange={handleInputChange} 
                                    placeholder="00.000.000.0-000.000"
                                    className="w-full rounded-xl border border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-xs p-2.5 text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500 outline-none font-medium"
                                />
                            </div>
                        </>
                    )}

                    <div>
                        <label htmlFor="phone" className="block text-xs font-bold text-slate-700 dark:text-zinc-300 mb-1.5">
                            No. HP / WhatsApp <span className="text-rose-500">*</span>
                        </label>
                        <input 
                            id="phone" 
                            name="phone" 
                            type="tel" 
                            value={formData.phone} 
                            onChange={handleInputChange} 
                            required 
                            placeholder="Contoh: 081234567890"
                            className="w-full rounded-xl border border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-xs p-2.5 text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500 outline-none font-medium"
                        />
                    </div>

                    <div>
                        <label htmlFor="email" className="block text-xs font-bold text-slate-700 dark:text-zinc-300 mb-1.5">
                            Alamat Email (Opsional)
                        </label>
                        <input 
                            id="email" 
                            name="email" 
                            type="email" 
                            value={formData.email} 
                            onChange={handleInputChange} 
                            placeholder="pelanggan@email.com"
                            className="w-full rounded-xl border border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-xs p-2.5 text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500 outline-none font-medium"
                        />
                    </div>
                </div>

                {/* Address Field */}
                <div>
                    <label htmlFor="address" className="block text-xs font-bold text-slate-700 dark:text-zinc-300 mb-1.5">
                        Alamat Lengkap (Opsional)
                    </label>
                    <textarea 
                        id="address" 
                        name="address" 
                        value={formData.address} 
                        onChange={handleInputChange} 
                        rows={2} 
                        placeholder="Tuliskan jalan, nomor rumah, RT/RW, kelurahan, kecamatan..." 
                        className="w-full rounded-xl border border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-xs p-2.5 text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500 outline-none font-medium resize-none"
                    ></textarea>
                </div>
            </form>
        </Modal>
    );
};


// --- Page 1: Customer List ---

const CustomerDetailsModal: React.FC<{
    isOpen: boolean;
    onClose: () => void;
    customer: Customer | null;
}> = ({ isOpen, onClose, customer }) => {
    if (!isOpen || !customer) return null;
    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Detail Pelanggan">
            <div className="space-y-4">
                <h3 className="text-lg font-semibold">{customer.name}</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
                    <p><strong>Email:</strong> {customer.email}</p>
                    <p><strong>Telepon:</strong> {customer.phone}</p>
                    <p><strong>Tipe:</strong> {customer.customerType}</p>
                    <p><strong>Tanggal Bergabung:</strong> {new Date(customer.joinDate).toLocaleDateString('id-ID')}</p>
                    <p><strong>Saldo Deposit:</strong> Rp{customer.depositBalance.toLocaleString('id-ID')}</p>
                    <p><strong>Poin:</strong> {customer.points}</p>
                    <p className="md:col-span-2"><strong>Alamat:</strong> {customer.address || customer.companyDetails?.address || (customer.addresses && customer.addresses.length > 0 ? customer.addresses[0].detail : '-')}</p>
                </div>
                {customer.customerType === 'Perusahaan' && customer.companyDetails && (
                    <div className="pt-4 border-t dark:border-gray-600 mt-4">
                            <h4 className="text-md font-semibold mb-2">Detail Perusahaan</h4>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
                            <p><strong>Nama Perusahaan:</strong> {customer.companyDetails.companyName}</p>
                            <p><strong>NPWP:</strong> {customer.companyDetails.taxId}</p>
                            <p className="md:col-span-2"><strong>Alamat:</strong> {customer.companyDetails.address}</p>
                            </div>
                    </div>
                )}
            </div>
        </Modal>
    );
};

const DepositModal: React.FC<{
    customer: Customer | null;
    isOpen: boolean;
    onClose: () => void;
    onSave: (customerId: string, amount: number, paymentMethodId: string) => void;
}> = ({ customer, isOpen, onClose, onSave }) => {
    const { state } = useAppContext();
    const [amount, setAmount] = useState('');
    const [paymentMethodId, setPaymentMethodId] = useState('');

    const depositPaymentMethods = useMemo(() => {
        return state.paymentMethods.filter(pm => pm.type === 'cash' || pm.type === 'bank');
    }, [state.paymentMethods]);

    useEffect(() => {
        if (isOpen) {
            setAmount('');
            setPaymentMethodId('');
        }
    }, [isOpen]);

    if (!isOpen || !customer) return null;

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const depositAmount = parseFloat(amount);
        if (depositAmount > 0 && paymentMethodId) {
            onSave(customer.id, depositAmount, paymentMethodId);
            onClose();
        }
    };
    
    const footer = (
        <>
            <button type="button" onClick={onClose} className="px-4 py-2 rounded-md text-gray-700 bg-gray-200 dark:text-gray-200 dark:bg-gray-600">Batal</button>
            <Button onClick={handleSubmit}>Simpan Deposit</Button>
        </>
    );

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title="Tambah Deposit"
            footer={footer}
            maxWidth="max-w-md"
        >
            <p className="mb-6 text-gray-500 dark:text-gray-400">Untuk: <span className="font-semibold">{customer.name}</span></p>
            <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                    <Label htmlFor="depositAmount">Jumlah Deposit (Rp)</Label>
                    <Input id="depositAmount" type="number" value={amount} onChange={e => setAmount(e.target.value)} required />
                </div>
                <div>
                    <Label htmlFor="paymentMethod">Metode Pembayaran</Label>
                    <select id="paymentMethod" value={paymentMethodId} onChange={e => setPaymentMethodId(e.target.value)} required className="mt-1 block w-full rounded-md bg-gray-100 dark:bg-gray-700 border-transparent px-3 py-2">
                        <option value="">-- Pilih Metode --</option>
                        {depositPaymentMethods.map(pm => (
                            <option key={pm.id} value={pm.id}>{pm.name}</option>
                        ))}
                    </select>
                </div>
            </form>
        </Modal>
    );
};

export const CustomerListPage: React.FC = () => {
    const { state, dispatch } = useAppContext();
    const { customers } = state;
    const [isDepositModalOpen, setDepositModalOpen] = useState(false);
    const [isDetailsModalOpen, setDetailsModalOpen] = useState(false);
    const [isCustomerModalOpen, setCustomerModalOpen] = useState(false);
    const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState<Status | 'all'>('all');
    const [typeFilter, setTypeFilter] = useState<'all' | 'Perorangan' | 'Perusahaan'>('all');

    const filteredCustomers = useMemo(() => {
        const lowercasedSearchTerm = searchTerm.toLowerCase();
        return customers.filter(customer => {
            const matchesSearch =
                customer.name.toLowerCase().includes(lowercasedSearchTerm) ||
                customer.phone.includes(lowercasedSearchTerm) ||
                customer.email.toLowerCase().includes(lowercasedSearchTerm);
            
            const matchesStatus = statusFilter === 'all' || customer.status === statusFilter;
            const matchesType = typeFilter === 'all' || customer.customerType === typeFilter;

            return matchesSearch && matchesStatus && matchesType;
        });
    }, [customers, searchTerm, statusFilter, typeFilter]);

    const handleOpenDepositModal = (customer: Customer) => {
        setSelectedCustomer(customer);
        setDepositModalOpen(true);
    };
    
    const handleOpenDetailsModal = (customer: Customer) => {
        setSelectedCustomer(customer);
        setDetailsModalOpen(true);
    };
    
    const handleOpenCustomerModal = (customer: Customer | null) => {
        setSelectedCustomer(customer);
        setCustomerModalOpen(true);
    };

    const handleSaveDeposit = (customerId: string, amount: number, paymentMethodId: string) => {
        dispatch({ type: 'customers/addDeposit', payload: { customerId, amount, paymentMethodId } });
    };

    const handleSetStatus = (id: string, status: Status) => {
        if (window.confirm(`Anda yakin ingin mengubah status pelanggan ini menjadi "${status}"?`)) {
            dispatch({ type: 'customers/setStatus', payload: { id, status } });
        }
    };

  return (
    <div className="p-3 md:p-5 h-full flex flex-col gap-3">
      {/* Top Navbar Header Control Bar */}
      <header className="bg-white dark:bg-zinc-900 px-4 py-2.5 rounded-2xl border border-zinc-200/80 dark:border-zinc-800 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-3 shrink-0">
        {/* Title & Count */}
        <div className="flex items-center gap-3 shrink-0">
          <div className="w-9 h-9 rounded-xl bg-pink-500/10 text-pink-600 dark:text-pink-400 flex items-center justify-center font-black text-sm">
            👥
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base font-black text-gray-900 dark:text-white tracking-tight">Data Pelanggan</h1>
              <span className="bg-slate-100 dark:bg-zinc-800 text-slate-600 dark:text-slate-400 text-[10px] font-bold px-2 py-0.5 rounded-full font-mono">
                {filteredCustomers.length}
              </span>
            </div>
            <p className="text-[10px] text-slate-400 dark:text-slate-500 font-medium">Manajemen anggota & pelanggan</p>
          </div>
        </div>

        {/* Navbar Controls */}
        <div className="flex flex-wrap md:flex-nowrap items-center gap-2 flex-1 max-w-full md:max-w-3xl justify-end">
          <div className="flex-1 min-w-[180px]">
            <Input 
              placeholder="Cari nama, hp, atau email..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="h-8 text-xs bg-slate-50/50 dark:bg-zinc-800/50 border-slate-200 dark:border-zinc-700/80 focus:bg-white"
            />
          </div>
          <div className="w-32 shrink-0">
            <Select value={statusFilter} onChange={e => setStatusFilter(e.target.value as any)} className="h-8 text-xs bg-slate-50/50 dark:bg-zinc-800/50 border-slate-200 dark:border-zinc-700/80">
              <option value="all">Semua Status</option>
              <option value="active">Aktif</option>
              <option value="inactive">Non-Aktif</option>
              <option value="archived">Diarsipkan</option>
            </Select>
          </div>
          <div className="w-32 shrink-0">
            <Select value={typeFilter} onChange={e => setTypeFilter(e.target.value as any)} className="h-8 text-xs bg-slate-50/50 dark:bg-zinc-800/50 border-slate-200 dark:border-zinc-700/80">
              <option value="all">Semua Tipe</option>
              <option value="Perorangan">Perorangan</option>
              <option value="Perusahaan">Perusahaan</option>
            </Select>
          </div>
          <Button onClick={() => handleOpenCustomerModal(null)} className="gap-1 text-xs h-8 px-3 font-bold whitespace-nowrap bg-primary-600 hover:bg-primary-700 text-white shrink-0">
            <span>+ Tambah Pelanggan</span>
          </Button>
        </div>
      </header>
      {/* DESKTOP TABLE VIEW */}
      <div className="flex-1 min-h-0 overflow-y-auto bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200/80 dark:border-zinc-800 shadow-xs">
        <table className="w-full text-xs text-left text-gray-500 dark:text-gray-400">
          <thead className="text-[11px] font-extrabold text-gray-700 uppercase bg-slate-50 dark:bg-zinc-800/60 dark:text-gray-400 sticky top-0 border-b border-zinc-200/80 dark:border-zinc-800">
            <tr>
              <th scope="col" className="px-3 py-2">Pelanggan</th>
              <th scope="col" className="px-3 py-2">Tipe</th>
              <th scope="col" className="px-3 py-2">Telepon / HP</th>
              <th scope="col" className="px-3 py-2">Email</th>
              <th scope="col" className="px-3 py-2">Status</th>
              <th scope="col" className="px-3 py-2 text-center">Poin</th>
              <th scope="col" className="px-3 py-2 text-center">Aksi</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-zinc-800/60">
            {filteredCustomers.map((customer) => {
              const displayName = customer.customerType === 'Perusahaan' ? customer.companyDetails?.companyName || customer.name : customer.name;
              return (
                <tr key={customer.id} className="hover:bg-slate-50/70 dark:hover:bg-zinc-800/40 transition-colors">
                  <td className="px-3 py-1.5 font-bold text-gray-900 dark:text-white text-[11px]">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-full bg-gradient-to-tr from-pink-500 to-rose-600 text-white font-black flex items-center justify-center text-[10px] shrink-0">
                        {displayName.charAt(0).toUpperCase()}
                      </div>
                      <span className="truncate max-w-[200px]">{displayName}</span>
                    </div>
                  </td>
                  <td className="px-3 py-1.5">
                    <span className="inline-block text-[9px] font-bold px-1.5 py-0.2 rounded-md bg-pink-50 dark:bg-pink-950/50 text-pink-600 dark:text-pink-400">
                      {customer.customerType}
                    </span>
                  </td>
                  <td className="px-3 py-1.5 font-mono text-[11px] text-slate-700 dark:text-slate-300">{customer.phone || '-'}</td>
                  <td className="px-3 py-1.5 text-[11px] text-slate-500 truncate max-w-[180px]">{customer.email || '-'}</td>
                  <td className="px-3 py-1.5">
                    <Badge variant={customer.status === 'active' ? 'success' : 'danger'} className="text-[9px] px-1.5 py-0">
                      {customer.status === 'active' ? 'Aktif' : 'Non-Aktif'}
                    </Badge>
                  </td>
                  <td className="px-3 py-1.5 text-center font-bold text-indigo-600 dark:text-indigo-400 font-mono text-[11px]">
                    ⭐ {customer.points}
                  </td>
                  <td className="px-3 py-1.5 text-center">
                    <ActionsDropdown>
                      <DropdownItem onClick={() => handleOpenDetailsModal(customer)}>Lihat Detail</DropdownItem>
                      <DropdownItem onClick={() => handleOpenCustomerModal(customer)}>Ubah</DropdownItem>
                      {customer.status !== 'archived' && (
                        <DropdownItem onClick={() => handleSetStatus(customer.id, customer.status === 'active' ? 'inactive' : 'active')}>
                          {customer.status === 'active' ? 'Non-aktifkan' : 'Aktifkan'}
                        </DropdownItem>
                      )}
                    </ActionsDropdown>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <CustomerDetailsModal
        isOpen={isDetailsModalOpen}
        onClose={() => setDetailsModalOpen(false)}
        customer={selectedCustomer}
      />
      <CustomerModal 
        isOpen={isCustomerModalOpen}
        onClose={() => setCustomerModalOpen(false)}
        existingCustomer={selectedCustomer}
      />
    </div>
  );
};
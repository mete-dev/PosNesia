import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useAppContext } from '../hooks/useAppContext';
import { Customer, Status, CustomerAddress, Page } from '../types';
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

export const CustomerDetailsPage: React.FC<{ customerId?: string, onBack?: () => void }> = ({ customerId, onBack }) => {
    const { state, dispatch } = useAppContext();
    const { customers, sales, selectedCustomerId } = state;

    const targetId = customerId || selectedCustomerId;
    const customer = useMemo(() => customers.find(c => c.id === targetId), [customers, targetId]);

    const customerSales = useMemo(() => {
        if (!customer) return [];
        return sales.filter(s => s.customerId === customer.id || s.customerName?.toLowerCase() === customer.name?.toLowerCase());
    }, [customer, sales]);

    const handleGoBack = () => {
        if (onBack) onBack();
        else dispatch({ type: 'ui/setPage', payload: Page.CustomerList });
    };

    if (!customer) {
        return (
            <div className="p-6 text-center space-y-4">
                <p className="text-slate-400">Data pelanggan tidak ditemukan.</p>
                <Button onClick={handleGoBack}>Kembali ke Daftar Pelanggan</Button>
            </div>
        );
    }

    return (
        <div className="w-full h-full flex flex-col p-4 md:p-6 space-y-4 overflow-y-auto bg-slate-50 dark:bg-zinc-950">
            {/* Top Navigation Toolbar */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 shrink-0 bg-white dark:bg-zinc-900 p-4 rounded-xl border border-slate-200/80 dark:border-zinc-800 shadow-2xs">
                <div>
                    <nav className="flex items-center gap-1.5 text-xs text-slate-400 dark:text-zinc-400 mb-1">
                        <span onClick={handleGoBack} className="hover:underline cursor-pointer">Data Pelanggan</span>
                        <span>/</span>
                        <span className="font-bold text-slate-700 dark:text-zinc-200">{customer.name}</span>
                    </nav>
                    <h1 className="text-xl font-black text-slate-900 dark:text-white leading-tight flex items-center gap-2">
                        Detail Informasi Pelanggan
                    </h1>
                </div>

                <div className="flex items-center gap-2">
                    <Button type="button" variant="secondary" onClick={handleGoBack} className="text-xs py-1.5 px-3">
                        ← Kembali
                    </Button>
                </div>
            </div>

            {/* Content Sheet */}
            <div className="bg-white dark:bg-zinc-900 rounded-xl shadow-xs border border-slate-200 dark:border-zinc-800 p-5 md:p-6 space-y-5 text-xs">
                <div className="flex items-center gap-3 bg-slate-50 dark:bg-zinc-800/60 p-4 rounded-xl border border-slate-200 dark:border-zinc-700">
                    <div className="w-12 h-12 rounded-xl bg-emerald-600 text-white font-black flex items-center justify-center text-xl shrink-0">
                        👤
                    </div>
                    <div>
                        <h3 className="font-extrabold text-slate-900 dark:text-white text-base">{customer.name}</h3>
                        <p className="text-xs text-slate-500 font-medium">Tipe: <span className="font-bold text-emerald-600">{customer.customerType}</span></p>
                    </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    <div className="p-3 bg-slate-50 dark:bg-zinc-800/40 rounded-xl border border-slate-200/60 dark:border-zinc-700/60">
                        <span className="text-slate-500 text-[10px] uppercase font-bold block">Telepon / HP</span>
                        <strong className="text-slate-900 dark:text-white font-mono text-sm">{customer.phone || '-'}</strong>
                    </div>
                    <div className="p-3 bg-slate-50 dark:bg-zinc-800/40 rounded-xl border border-slate-200/60 dark:border-slate-700/60">
                        <span className="text-slate-500 text-[10px] uppercase font-bold block">Total Poin</span>
                        <strong className="text-amber-600 font-bold font-mono text-sm">⭐ {customer.points}</strong>
                    </div>
                    <div className="p-3 bg-slate-50 dark:bg-zinc-800/40 rounded-xl border border-slate-200/60 dark:border-slate-700/60">
                        <span className="text-slate-500 text-[10px] uppercase font-bold block">Total Transaksi</span>
                        <strong className="text-blue-600 font-bold font-mono text-sm">{customerSales.length} Nota</strong>
                    </div>
                </div>

                <div className="pt-3 border-t dark:border-zinc-800 space-y-3">
                    <h4 className="font-bold text-slate-800 dark:text-zinc-200 text-sm">Riwayat Penjualan (POS & Manual)</h4>
                    {customerSales.length === 0 ? (
                        <p className="text-slate-400 italic py-6 text-center">Belum ada riwayat transaksi penjualan dengan pelanggan ini.</p>
                    ) : (
                        <div className="overflow-hidden border border-slate-200 dark:border-zinc-700 rounded-xl">
                            <table className="w-full text-xs text-left">
                                <thead className="bg-slate-100 dark:bg-zinc-800 font-bold text-slate-600 dark:text-zinc-400 uppercase">
                                    <tr>
                                        <th className="p-3">No. Nota / ID</th>
                                        <th className="p-3">Kanal</th>
                                        <th className="p-3">Tanggal</th>
                                        <th className="p-3 text-center">Status Barang</th>
                                        <th className="p-3 text-center">Status Pembayaran</th>
                                        <th className="p-3 text-right">Total (Rp)</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100 dark:divide-zinc-800">
                                    {customerSales.map(s => (
                                        <tr key={s.id} className="hover:bg-slate-50 dark:hover:bg-zinc-800/40">
                                            <td className="p-3 font-mono font-bold text-emerald-700 dark:text-emerald-400 cursor-pointer hover:underline" onClick={() => {
                                                dispatch({ type: 'sales/setSelectedId', payload: s.id });
                                                dispatch({ type: 'ui/setPage', payload: Page.SaleDetailsPage });
                                            }}>{s.id}</td>
                                            <td className="p-3"><span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 dark:bg-zinc-800">{s.saleChannel || 'Manual'}</span></td>
                                            <td className="p-3 font-mono text-slate-500">{new Date(s.date).toLocaleDateString('id-ID')}</td>
                                            <td className="p-3 text-center"><span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-blue-50 text-blue-700">{s.itemStatus || 'Draft'}</span></td>
                                            <td className="p-3 text-center"><span className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold ${s.status === 'Paid' ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'}`}>{s.status === 'Paid' ? 'Lunas' : 'Belum Lunas'}</span></td>
                                            <td className="p-3 text-right font-mono font-bold text-slate-900 dark:text-white">Rp{s.grandTotal.toLocaleString('id-ID')}</td>
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
        dispatch({ type: 'customers/setSelectedId', payload: customer.id });
        dispatch({ type: 'ui/setPage', payload: Page.CustomerDetailsPage });
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
    <div className="p-3 md:p-5 h-full flex flex-col gap-3 overflow-hidden bg-slate-50 dark:bg-zinc-950">
      {/* Top Header Control Bar */}
      <div className="bg-white dark:bg-zinc-900 px-4 py-2.5 rounded-2xl border border-zinc-200/80 dark:border-zinc-800 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-3 shrink-0">
        {/* Title & Count */}
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-pink-500/10 text-pink-600 dark:text-pink-400 flex items-center justify-center font-black text-sm shrink-0">
            👥
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base font-black text-gray-900 dark:text-white tracking-tight">Data Pelanggan</h1>
              <span className="bg-slate-100 dark:bg-zinc-800 text-slate-600 dark:text-slate-400 text-[10px] font-bold px-2 py-0.5 rounded-full font-mono">{filteredCustomers.length}</span>
            </div>
            <p className="text-[10px] text-slate-400 dark:text-slate-500 font-medium">Manajemen anggota & pelanggan</p>
          </div>
        </div>

        {/* Search Bar, Filters & Top Right Add Button */}
        <div className="flex flex-wrap md:flex-nowrap items-center gap-2 flex-1 max-w-full md:max-w-2xl justify-end">
          <div className="flex-1 min-w-[180px]">
            <Input 
              placeholder="Cari ID / Nama / HP / Email..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="h-8 text-xs bg-slate-50/50 dark:bg-zinc-800/50 border-slate-200 dark:border-zinc-700/80 focus:bg-white rounded-xl"
            />
          </div>
          <div className="w-32 shrink-0">
            <Select value={typeFilter} onChange={e => setTypeFilter(e.target.value as any)} className="h-8 text-xs bg-slate-50/50 dark:bg-zinc-800/50 border-slate-200 dark:border-zinc-700/80 rounded-xl">
              <option value="all">Semua Tipe</option>
              <option value="Individu">Individu</option>
              <option value="Perusahaan">Perusahaan</option>
            </Select>
          </div>
          <div className="w-32 shrink-0">
            <Select value={statusFilter} onChange={e => setStatusFilter(e.target.value as any)} className="h-8 text-xs bg-slate-50/50 dark:bg-zinc-800/50 border-slate-200 dark:border-zinc-700/80 rounded-xl">
              <option value="all">Semua Status</option>
              <option value="active">Aktif</option>
              <option value="inactive">Non-Aktif</option>
            </Select>
          </div>
          <Button 
            onClick={() => handleOpenCustomerModal(null)} 
            className="text-xs h-8 px-3 font-bold bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl shadow-xs shrink-0 flex items-center gap-1.5 ml-auto"
          >
            <span>+ Tambah Pelanggan</span>
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
                <th scope="col" className="px-4 py-3">Nama Pelanggan</th>
                <th scope="col" className="px-4 py-3">No. HP</th>
                <th scope="col" className="px-4 py-3">Tipe</th>
                <th scope="col" className="px-4 py-3 font-mono">Poin</th>
                <th scope="col" className="px-4 py-3 text-center">Status</th>
                <th scope="col" className="px-4 py-3 text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-zinc-800/60">
              {filteredCustomers.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-12 text-slate-400">
                    Tidak ada data pelanggan yang ditemukan.
                  </td>
                </tr>
              ) : (
                filteredCustomers.map((customer) => {
                  const displayName = customer.customerType === 'Perusahaan' ? customer.companyDetails?.companyName || customer.name : customer.name;
                  return (
                    <tr key={customer.id} className="hover:bg-slate-50/70 dark:hover:bg-zinc-800/40 transition-colors">
                      <td className="px-4 py-2.5 font-bold text-gray-900 dark:text-white">
                        <div>
                          <span className="font-extrabold text-xs">{displayName}</span>
                          <span className="block text-[10px] text-slate-400 font-mono font-medium">{customer.email || '-'}</span>
                        </div>
                      </td>
                      <td className="px-4 py-2.5 font-mono text-slate-600 dark:text-zinc-300">{customer.phone || '-'}</td>
                      <td className="px-4 py-2.5 font-semibold text-slate-700 dark:text-zinc-300">{customer.customerType}</td>
                      <td className="px-4 py-2.5 font-mono font-bold text-indigo-600">⭐ {customer.points || 0}</td>
                      <td className="px-4 py-2.5 text-center">
                        <Badge variant={customer.status === 'active' ? 'success' : 'danger'} className="text-[10px] px-2 py-0.5">
                          {customer.status === 'active' ? 'Aktif' : 'Non-Aktif'}
                        </Badge>
                      </td>
                      <td className="px-4 py-2.5 text-center">
                        <div className="flex items-center justify-center gap-1">
                          <button
                            type="button"
                            onClick={() => handleOpenDetailsModal(customer)}
                            title="Lihat Detail & Riwayat Transaksi"
                            className="p-1.5 rounded-lg text-blue-600 hover:bg-blue-50 dark:hover:bg-zinc-800 transition-colors"
                          >
                            👁️
                          </button>
                          <button
                            type="button"
                            onClick={() => handleOpenCustomerModal(customer)}
                            title="Ubah Data Pelanggan"
                            className="p-1.5 rounded-lg text-amber-600 hover:bg-amber-50 dark:hover:bg-zinc-800 transition-colors"
                          >
                            ✏️
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* 2. MOBILE VIEW: Kotak Balok Cards (below md breakpoint) */}
        <div className="block md:hidden space-y-3">
          {filteredCustomers.length === 0 ? (
            <div className="bg-white dark:bg-zinc-900 rounded-2xl p-8 text-center border border-zinc-200 dark:border-zinc-800 text-slate-400 text-xs">
              Tidak ada data pelanggan.
            </div>
          ) : (
            filteredCustomers.map((customer) => {
              const displayName = customer.customerType === 'Perusahaan' ? customer.companyDetails?.companyName || customer.name : customer.name;
              return (
                <div key={customer.id} className="bg-white dark:bg-zinc-900 rounded-xl border border-slate-200/80 dark:border-zinc-800 p-3.5 shadow-2xs space-y-2.5">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h3 className="font-extrabold text-xs text-slate-900 dark:text-white line-clamp-1">{displayName}</h3>
                      <p className="text-[10px] text-slate-400 font-medium">{customer.customerType}</p>
                    </div>
                    <Badge variant={customer.status === 'active' ? 'success' : 'danger'} className="text-[9px] px-1.5 py-0">
                      {customer.status === 'active' ? 'Aktif' : 'Non-Aktif'}
                    </Badge>
                  </div>
                  <div className="space-y-1 text-xs text-slate-600 dark:text-zinc-300 font-mono border-y border-slate-100 dark:border-zinc-800 py-2">
                    {customer.phone && <div>📞 {customer.phone}</div>}
                    {customer.email && <div className="truncate font-sans text-slate-500 text-[11px]">✉️ {customer.email}</div>}
                    <div className="text-[11px] text-indigo-600 font-bold font-sans">⭐ Poin: {customer.points || 0}</div>
                  </div>
                  <div className="flex justify-end gap-2">
                    <Button onClick={() => handleOpenDetailsModal(customer)} variant="secondary" className="text-[11px] py-1 px-2.5 text-blue-600">
                      Detail
                    </Button>
                    <Button onClick={() => handleOpenCustomerModal(customer)} variant="secondary" className="text-[11px] py-1 px-2.5">
                      Ubah
                    </Button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      <CustomerModal 
        isOpen={isCustomerModalOpen}
        onClose={() => setCustomerModalOpen(false)}
        existingCustomer={selectedCustomer}
      />
    </div>
  );
};

export const Customers: React.FC = () => {
    const { state } = useAppContext();
    switch (state.currentPage) {
        case Page.CustomerDetailsPage:
            return <CustomerDetailsPage />;
        default:
            return <CustomerListPage />;
    }
};
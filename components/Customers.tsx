import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useAppContext } from '../hooks/useAppContext';
import { Customer, Status, CustomerAddress } from '../types';
import { Input, Label, Button, ActionsDropdown, DropdownItem, Modal, Select, Badge } from './ui';

// --- Shared Components ---

const CustomerModal: React.FC<{
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
                    address: existingCustomer.companyDetails?.address || '',
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
        <Button onClick={handleSubmit}>Simpan Pelanggan</Button>
    );

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title={`${existingCustomer ? 'Ubah' : 'Tambah'} Pelanggan`}
            footer={footer}
            maxWidth="max-w-3xl"
        >
            <form id="customer-form" onSubmit={handleSubmit} className="space-y-6">
                <div>
                    <Label>Tipe Pelanggan</Label>
                    <div className="mt-2 flex gap-4">
                        <label className="flex items-center">
                            <input type="radio" name="customerType" value="Perorangan" checked={customerType === 'Perorangan'} onChange={() => setCustomerType('Perorangan')} className="text-primary-600 focus:ring-primary-500" />
                            <span className="ml-2">Perorangan</span>
                        </label>
                        <label className="flex items-center">
                            <input type="radio" name="customerType" value="Perusahaan" checked={customerType === 'Perusahaan'} onChange={() => setCustomerType('Perusahaan')} className="text-primary-600 focus:ring-primary-500" />
                            <span className="ml-2">Perusahaan</span>
                        </label>
                    </div>
                </div>
                
                {customerType === 'Perorangan' ? (
                    <div><Label htmlFor="name">Nama Pelanggan*</Label><Input id="name" name="name" value={formData.name} onChange={handleInputChange} required /></div>
                ) : (
                    <>
                        <div><Label htmlFor="companyName">Nama Perusahaan*</Label><Input id="companyName" name="companyName" value={formData.companyName} onChange={handleInputChange} required /></div>
                        <div><Label htmlFor="taxId">NPWP</Label><Input id="taxId" name="taxId" value={formData.taxId} onChange={handleInputChange} /></div>
                            <div><Label htmlFor="address">Alamat Perusahaan</Label><textarea id="address" name="address" value={formData.address} onChange={handleInputChange} rows={3} className="mt-1 block w-full rounded-md bg-gray-100 dark:bg-gray-700 border-transparent"></textarea></div>
                    </>
                )}
                <hr className="dark:border-gray-600"/>
                <div><Label htmlFor="phone">No. Telepon / No HP*</Label><Input id="phone" name="phone" type="tel" value={formData.phone} onChange={handleInputChange} required /></div>
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
    <div className="p-8 h-full flex flex-col">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Data Pelanggan</h1>
        <Button onClick={() => handleOpenCustomerModal(null)}>Tambah Pelanggan</Button>
      </div>
      <div className="mb-4 bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Input 
                placeholder="Cari nama, telepon, atau email..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
            />
             <Select value={statusFilter} onChange={e => setStatusFilter(e.target.value as any)}>
                <option value="all">Semua Status</option>
                <option value="active">Aktif</option>
                <option value="inactive">Non-Aktif</option>
                <option value="archived">Diarsipkan</option>
            </Select>
            <Select value={typeFilter} onChange={e => setTypeFilter(e.target.value as any)}>
                <option value="all">Semua Tipe</option>
                <option value="Perorangan">Perorangan</option>
                <option value="Perusahaan">Perusahaan</option>
            </Select>
        </div>
      </div>
      <div className="flex-grow bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-x-auto">
        <table className="w-full text-sm text-left text-gray-500 dark:text-gray-400">
          <thead className="text-xs text-gray-700 uppercase bg-gray-50 dark:bg-gray-700 dark:text-gray-400 sticky top-0">
            <tr>
              <th scope="col" className="px-6 py-3">Nama</th>
              <th scope="col" className="px-6 py-3">Kontak</th>
              <th scope="col" className="px-6 py-3">Tipe</th>
              <th scope="col" className="px-6 py-3">Saldo Deposit</th>
              <th scope="col" className="px-6 py-3">Poin</th>
              <th scope="col" className="px-6 py-3">Status</th>
              <th scope="col" className="px-6 py-3">Aksi</th>
            </tr>
          </thead>
          <tbody>
            {filteredCustomers.map((customer) => (
              <tr key={customer.id} className="bg-white dark:bg-gray-800 border-b dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600">
                <td className="px-6 py-4 font-medium text-gray-900 whitespace-nowrap dark:text-white">
                  {customer.customerType === 'Perusahaan' ? customer.companyDetails?.companyName : customer.name}
                </td>
                <td className="px-6 py-4">{customer.email}<br/><span className="text-xs text-gray-500">{customer.phone}</span></td>
                <td className="px-6 py-4">{customer.customerType}</td>
                <td className="px-6 py-4">Rp{customer.depositBalance.toLocaleString('id-ID')}</td>
                <td className="px-6 py-4">{customer.points}</td>
                <td className="px-6 py-4">
                    <Badge variant={customer.status === 'active' ? 'success' : customer.status === 'inactive' ? 'warning' : 'neutral'}>{customer.status}</Badge>
                </td>
                <td className="px-6 py-4 space-x-2">
                   <ActionsDropdown>
                        <DropdownItem onClick={() => handleOpenDetailsModal(customer)}>Lihat Detail</DropdownItem>
                        <DropdownItem onClick={() => handleOpenCustomerModal(customer)}>Ubah</DropdownItem>
                        <DropdownItem onClick={() => handleOpenDepositModal(customer)} className="text-green-600 dark:text-green-500">Deposit</DropdownItem>
                        {customer.status !== 'archived' && (
                            <DropdownItem onClick={() => handleSetStatus(customer.id, customer.status === 'active' ? 'inactive' : 'active')}>
                                {customer.status === 'active' ? 'Non-aktifkan' : 'Aktifkan'}
                            </DropdownItem>
                        )}
                        {customer.status !== 'archived' && (
                            <DropdownItem onClick={() => handleSetStatus(customer.id, 'archived')} className="text-red-600 dark:text-red-500">
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
      <DepositModal 
        isOpen={isDepositModalOpen} 
        onClose={() => setDepositModalOpen(false)}
        customer={selectedCustomer}
        onSave={handleSaveDeposit}
      />
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
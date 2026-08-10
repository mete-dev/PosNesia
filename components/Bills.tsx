import React, { useState, useMemo, useEffect } from 'react';
import { VendorBill, Account, CustomerBill } from '../types';
import { useAppContext } from '../hooks/useAppContext';
import { Modal, Button, Select, Label, Card, Table, Thead, Tbody, Tr, Th, Td, Badge } from './ui';

// New modal for displaying a newly created vendor bill
export const VendorBillModal: React.FC<{ isOpen: boolean; onClose: () => void; bill: VendorBill | null }> = ({ isOpen, onClose, bill }) => {
    if (!bill) return null;
    return (
        <Modal isOpen={isOpen} onClose={onClose} title={`Tagihan Dibuat #${bill.id}`}>
            <div className="space-y-3 text-sm">
                <p>Tagihan vendor telah berhasil dibuat dan menunggu pembayaran.</p>
                <div className="p-4 bg-gray-100 dark:bg-gray-700/50 rounded-lg space-y-2">
                    <div className="flex justify-between"><span>Vendor:</span><span className="font-semibold">{bill.vendorName}</span></div>
                    <div className="flex justify-between"><span>Jumlah:</span><span className="font-bold text-lg text-primary-600 dark:text-primary-400">Rp{bill.amount.toLocaleString('id-ID')}</span></div>
                    <div className="flex justify-between"><span>Jatuh Tempo:</span><span className="font-semibold">{new Date(bill.dueDate).toLocaleDateString('id-ID')}</span></div>
                </div>
            </div>
        </Modal>
    );
};

const PayBillModal: React.FC<{
    isOpen: boolean;
    onClose: () => void;
    onSave: (billId: string, paymentAccountId: string) => void;
    bill: VendorBill | CustomerBill | null;
    cashAccounts: Account[];
}> = ({ isOpen, onClose, onSave, bill, cashAccounts }) => {
    const [paymentAccountId, setPaymentAccountId] = useState('');

    useEffect(() => {
        if (isOpen && cashAccounts.length > 0) {
            setPaymentAccountId(cashAccounts[0].id);
        } else if (isOpen) {
            setPaymentAccountId('');
        }
    }, [isOpen, cashAccounts]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (bill && paymentAccountId) {
            onSave(bill.id, paymentAccountId);
            onClose();
        }
    };

    if (!bill) return null;

    const footer = (
        <>
            <button type="button" onClick={onClose} className="px-4 py-2 rounded-md bg-gray-200 dark:bg-gray-600">Batal</button>
            <Button type="submit" onClick={handleSubmit}>Bayar Tagihan</Button>
        </>
    );

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title={`Bayar Tagihan #${bill.id}`}
            footer={footer}
            maxWidth="max-w-md"
        >
            <form onSubmit={handleSubmit} className="space-y-4">
                <p><strong>Total Tagihan:</strong> Rp{bill.amount.toLocaleString('id-ID')}</p>
                <div>
                    <Label htmlFor="paymentAccountId">Bayar Dari Rekening</Label>
                    <Select id="paymentAccountId" value={paymentAccountId} onChange={e => setPaymentAccountId(e.target.value)} required>
                        <option value="">-- Pilih Rekening Kas --</option>
                        {cashAccounts.map(acc => <option key={acc.id} value={acc.id}>{acc.name} (Saldo: Rp{acc.balance.toLocaleString('id-ID')})</option>)}
                    </Select>
                </div>
            </form>
        </Modal>
    );
};


export const VendorBillListPage: React.FC = () => {
    const { state, dispatch } = useAppContext();
    const { vendorBills } = state;
    const [isPayModalOpen, setPayModalOpen] = useState(false);
    const [selectedBill, setSelectedBill] = useState<VendorBill | null>(null);

    const cashAccounts = useMemo(() => state.accounts.filter(a => a.isCashAccount), [state.accounts]);

    const handleOpenPayModal = (bill: VendorBill) => {
        setSelectedBill(bill);
        setPayModalOpen(true);
    };

    const handlePayBill = (billId: string, paymentAccountId: string) => {
        dispatch({ type: 'billing/payVendorBill', payload: { billId, paymentAccountId } });
    };

    return (
        <div className="p-8 h-full flex flex-col">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-6">Tagihan Vendor</h1>
            <Card className="flex-grow overflow-y-auto">
                <Table>
                    <Thead>
                        <Tr>
                            <Th>ID Tagihan</Th>
                            <Th>Vendor</Th>
                            <Th>Jatuh Tempo</Th>
                            <Th>Jumlah</Th>
                            <Th>Status</Th>
                            <Th>Aksi</Th>
                        </Tr>
                    </Thead>
                    <Tbody>
                        {vendorBills.map(bill => (
                            <Tr key={bill.id}>
                                <Td>{bill.id}</Td>
                                <Td>{bill.vendorName}</Td>
                                <Td>{new Date(bill.dueDate).toLocaleDateString('id-ID')}</Td>
                                <Td>Rp{bill.amount.toLocaleString('id-ID')}</Td>
                                <Td>
                                    <Badge variant={bill.status === 'Paid' ? 'success' : 'warning'}>{bill.status}</Badge>
                                </Td>
                                <Td>
                                    {bill.status === 'Unpaid' && (
                                        <Button onClick={() => handleOpenPayModal(bill)} variant="secondary" className="text-xs py-1 px-2">Bayar</Button>
                                    )}
                                </Td>
                            </Tr>
                        ))}
                    </Tbody>
                </Table>
            </Card>
            <PayBillModal
                isOpen={isPayModalOpen}
                onClose={() => setPayModalOpen(false)}
                onSave={handlePayBill}
                bill={selectedBill}
                cashAccounts={cashAccounts}
            />
        </div>
    );
};

export const CustomerBillListPage: React.FC = () => {
    const { state, dispatch } = useAppContext();
    const { customerBills } = state;
    const [isPayModalOpen, setPayModalOpen] = useState(false);
    const [selectedBill, setSelectedBill] = useState<CustomerBill | null>(null);
    
    const cashAccounts = useMemo(() => state.accounts.filter(a => a.isCashAccount), [state.accounts]);

    const handleOpenPayModal = (bill: CustomerBill) => {
        setSelectedBill(bill);
        setPayModalOpen(true);
    };

    const handlePayBill = (billId: string, paymentAccountId: string) => {
        dispatch({ type: 'billing/payCustomerBill', payload: { billId, paymentAccountId } });
    };

    return (
        <div className="p-8 h-full flex flex-col">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-6">Tagihan Pelanggan</h1>
            <Card className="flex-grow overflow-y-auto">
                <Table>
                    <Thead>
                        <Tr>
                            <Th>ID Tagihan</Th>
                            <Th>Pelanggan</Th>
                            <Th>Deskripsi</Th>
                            <Th>Jatuh Tempo</Th>
                            <Th>Jumlah</Th>
                            <Th>Status</Th>
                            <Th>Aksi</Th>
                        </Tr>
                    </Thead>
                    <Tbody>
                        {customerBills.map(bill => (
                            <Tr key={bill.id}>
                                <Td>{bill.id}</Td>
                                <Td>{bill.customerName}</Td>
                                <Td>{bill.description}</Td>
                                <Td>{new Date(bill.dueDate).toLocaleDateString('id-ID')}</Td>
                                <Td>Rp{bill.amount.toLocaleString('id-ID')}</Td>
                                <Td>
                                    <Badge variant={bill.status === 'Paid' ? 'success' : 'warning'}>{bill.status}</Badge>
                                </Td>
                                <Td>
                                    {bill.status === 'Unpaid' && (
                                        <Button onClick={() => handleOpenPayModal(bill)} variant="secondary" className="text-xs py-1 px-2">Terima Pembayaran</Button>
                                    )}
                                </Td>
                            </Tr>
                        ))}
                    </Tbody>
                </Table>
            </Card>
            <PayBillModal
                isOpen={isPayModalOpen}
                onClose={() => setPayModalOpen(false)}
                onSave={handlePayBill}
                bill={selectedBill}
                cashAccounts={cashAccounts}
            />
        </div>
    );
};
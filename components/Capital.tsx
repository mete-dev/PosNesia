

import React, { useState, useMemo, useEffect } from 'react';
import { useAppContext } from '../hooks/useAppContext';
import { Investor, CapitalTransaction, ProfitDistribution, Account } from '../types';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import { Modal, Button, Input, Select, Label, StatCard } from './ui';

const COLORS = ['#3b82f6', '#60a5fa', '#93c5fd', '#bfdbfe', '#dbeafe', '#1d4ed8', '#1e40af'];

// --- MODALS ---

const InvestorModal: React.FC<{
    isOpen: boolean,
    onClose: () => void,
    onSave: (data: Omit<Investor, 'id' | 'ownershipPercentage'>) => void
}> = ({ isOpen, onClose, onSave }) => {
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [phone, setPhone] = useState('');

    useEffect(() => {
        if (isOpen) {
            setName('');
            setEmail('');
            setPhone('');
        }
    }, [isOpen]);
    
    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSave({ name, email, phone });
        onClose();
    };

    const footer = (
        <>
            <button type="button" onClick={onClose} className="px-4 py-2 rounded-md text-gray-700 dark:text-gray-200 bg-gray-200 dark:bg-gray-600">Batal</button>
            <Button type="submit" onClick={handleSubmit}>Simpan</Button>
        </>
    );
    
    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Tambah Investor" footer={footer} maxWidth="max-w-lg">
            <form onSubmit={handleSubmit} className="space-y-4">
                <Input type="text" placeholder="Nama Investor" value={name} onChange={e => setName(e.target.value)} required />
                <Input type="email" placeholder="Email" value={email} onChange={e => setEmail(e.target.value)} required />
                <Input type="tel" placeholder="Telepon" value={phone} onChange={e => setPhone(e.target.value)} required />
                <p className="text-xs text-gray-500 dark:text-gray-400">Setoran modal awal dicatat melalui menu "Catat Transaksi".</p>
            </form>
        </Modal>
    );
}

const CapitalTransactionModal: React.FC<{
    isOpen: boolean,
    onClose: () => void,
    onSave: (data: { investorId: string, type: 'Deposit' | 'Withdrawal', amount: number, cashAccountId: string }) => void,
    investors: Investor[],
    accounts: Account[]
}> = ({ isOpen, onClose, onSave, investors, accounts }) => {
    const [investorId, setInvestorId] = useState('');
    const [type, setType] = useState<'Deposit' | 'Withdrawal'>('Deposit');
    const [amount, setAmount] = useState('');
    const [cashAccountId, setCashAccountId] = useState('');
    
    const cashAccounts = useMemo(() => accounts.filter(a => a.isCashAccount), [accounts]);

    useEffect(() => {
        if (isOpen) {
            setInvestorId('');
            setType('Deposit');
            setAmount('');
            setCashAccountId(cashAccounts[0]?.id || '');
        }
    }, [isOpen, cashAccounts]);


    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!investorId || !cashAccountId) return;
        onSave({ investorId, type, amount: parseFloat(amount), cashAccountId });
        onClose();
    };

    const footer = (
        <>
            <button type="button" onClick={onClose} className="px-4 py-2 rounded-md text-gray-700 dark:text-gray-200 bg-gray-200 dark:bg-gray-600">Batal</button>
            <Button type="submit" onClick={handleSubmit}>Simpan</Button>
        </>
    );

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Catat Transaksi" footer={footer} maxWidth="max-w-lg">
            <form onSubmit={handleSubmit} className="space-y-4">
                <Select value={investorId} onChange={e => setInvestorId(e.target.value)} required>
                    <option value="">Pilih Investor</option>
                    {investors.map(i => <option key={i.id} value={i.id}>{i.name}</option>)}
                </Select>
                <Select value={type} onChange={e => setType(e.target.value as any)} required>
                    <option value="Deposit">Setoran</option>
                    <option value="Withdrawal">Penarikan</option>
                </Select>
                <Input type="number" placeholder="Jumlah" value={amount} onChange={e => setAmount(e.target.value)} required />
                <div>
                    <Label>Rekening Kas Tujuan/Sumber</Label>
                    <Select value={cashAccountId} onChange={e => setCashAccountId(e.target.value)} required>
                        <option value="">Pilih Rekening Kas</option>
                        {cashAccounts.map(acc => <option key={acc.id} value={acc.id}>{acc.name}</option>)}
                    </Select>
                </div>
            </form>
        </Modal>
    );
}

const ProfitDistributionModal: React.FC<{
    isOpen: boolean,
    onClose: () => void,
    onSave: (data: { totalProfitDistributed: number, distributions: { investorId: string, amount: number }[], cashAccountId: string }) => void,
    investors: Investor[],
    accounts: Account[],
}> = ({ isOpen, onClose, onSave, investors, accounts }) => {
    const [totalProfit, setTotalProfit] = useState('');
    const [cashAccountId, setCashAccountId] = useState('');
    
    const cashAccounts = useMemo(() => accounts.filter(a => a.isCashAccount), [accounts]);

    useEffect(() => {
        if (isOpen) {
            setTotalProfit('');
            setCashAccountId(cashAccounts[0]?.id || '');
        }
    }, [isOpen, cashAccounts]);
    
    const distributions = useMemo(() => {
        const profit = parseFloat(totalProfit) || 0;
        return investors.map(inv => ({
            investorId: inv.id,
            investorName: inv.name,
            amount: profit * (inv.ownershipPercentage / 100)
        }));
    }, [totalProfit, investors]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const totalProfitDistributed = parseFloat(totalProfit);
        if (isNaN(totalProfitDistributed) || totalProfitDistributed <= 0 || !cashAccountId) return;
        onSave({ totalProfitDistributed, distributions: distributions.map(({investorId, amount}) => ({investorId, amount})), cashAccountId });
        onClose();
    };

    const footer = (
        <>
            <button type="button" onClick={onClose} className="px-4 py-2 rounded-md text-gray-700 dark:text-gray-200 bg-gray-200 dark:bg-gray-600">Batal</button>
            <Button type="submit" onClick={handleSubmit}>Simpan</Button>
        </>
    );
    
    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Bagikan Laba" footer={footer} maxWidth="max-w-lg">
            <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                    <Label>Total Laba untuk Dibagikan</Label>
                    <Input type="number" placeholder="Rp" value={totalProfit} onChange={e => setTotalProfit(e.target.value)} required />
                </div>
                <div>
                    <Label>Sumber Dana</Label>
                    <Select value={cashAccountId} onChange={e => setCashAccountId(e.target.value)} required>
                        <option value="">Pilih Rekening Kas</option>
                        {cashAccounts.map(acc => <option key={acc.id} value={acc.id}>{acc.name}</option>)}
                    </Select>
                </div>
                <div>
                    <h3 className="text-lg font-medium text-gray-900 dark:text-white">Detail Pembagian</h3>
                    <ul className="mt-2 space-y-1">
                        {distributions.map(d => (
                            <li key={d.investorId} className="flex justify-between">
                                <span>{d.investorName}</span>
                                <span className="font-semibold">Rp{d.amount.toLocaleString('id-ID')}</span>
                            </li>
                        ))}
                    </ul>
                </div>
            </form>
        </Modal>
    );
}

export const Capital: React.FC = () => {
    const { state, dispatch } = useAppContext();
    const { investors, capitalTransactions, profitDistributions, accounts } = state;
    const [view, setView] = useState<'overview' | 'investors' | 'transactions' | 'distribution'>('overview');

    const [isInvestorModalOpen, setInvestorModalOpen] = useState(false);
    const [isTransactionModalOpen, setTransactionModalOpen] = useState(false);
    const [isDistributionModalOpen, setDistributionModalOpen] = useState(false);

    const totalCapital = useMemo(() => {
        return capitalTransactions.reduce((acc, t) => {
            return acc + (t.type === 'Deposit' ? t.amount : -t.amount);
        }, 0);
    }, [capitalTransactions]);
    
    const ownershipData = investors.map(inv => ({ name: inv.name, value: inv.ownershipPercentage }));

    const handleSaveInvestor = (data: Omit<Investor, 'id' | 'ownershipPercentage'>) => {
        dispatch({ type: 'finance/addInvestor', payload: data });
    };

    const handleSaveTransaction = (data: { investorId: string, type: 'Deposit' | 'Withdrawal', amount: number, cashAccountId: string }) => {
        dispatch({ type: 'finance/addCapitalTransaction', payload: data });
    };

    const handleSaveDistribution = (data: { totalProfitDistributed: number, distributions: { investorId: string, amount: number }[], cashAccountId: string }) => {
        dispatch({ type: 'finance/distributeProfit', payload: data });
    }

    return (
        <div className="p-8 h-full flex flex-col">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">Manajemen Modal</h1>
            <div className="flex space-x-2 border-b dark:border-gray-700 mb-4">
                <button onClick={() => setView('overview')} className={`py-2 px-4 text-sm font-medium ${view === 'overview' ? 'border-b-2 border-primary-500 text-primary-500' : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'}`}>Ringkasan</button>
                <button onClick={() => setView('investors')} className={`py-2 px-4 text-sm font-medium ${view === 'investors' ? 'border-b-2 border-primary-500 text-primary-500' : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'}`}>Investor</button>
                <button onClick={() => setView('transactions')} className={`py-2 px-4 text-sm font-medium ${view === 'transactions' ? 'border-b-2 border-primary-500 text-primary-500' : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'}`}>Transaksi Modal</button>
                <button onClick={() => setView('distribution')} className={`py-2 px-4 text-sm font-medium ${view === 'distribution' ? 'border-b-2 border-primary-500 text-primary-500' : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'}`}>Bagi Hasil</button>
            </div>

            <div className="flex-grow overflow-y-auto">
                {view === 'overview' && (
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        <div className="space-y-6">
                            <StatCard title="Total Modal" value={`Rp${totalCapital.toLocaleString('id-ID')}`} />
                        </div>
                         <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-md">
                            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Kepemilikan</h3>
                             <ResponsiveContainer width="100%" height={300}>
                                <PieChart>
                                    <Pie data={ownershipData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={120} label={({ name, percent }) => `${name} ${(percent * 100).toFixed(1)}%`}>
                                        {ownershipData.map((entry, index) => <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />)}
                                    </Pie>
                                    <Tooltip formatter={(value: number) => `${value.toFixed(2)}%`} />
                                    <Legend />
                                </PieChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                )}
                {view === 'investors' && (
                    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md">
                        <div className="p-4 border-b dark:border-gray-700 flex justify-end">
                            <Button onClick={() => setInvestorModalOpen(true)}>Tambah Investor</Button>
                        </div>
                        <table className="w-full text-sm text-left text-gray-500 dark:text-gray-400">
                             <thead className="text-xs text-gray-700 uppercase bg-gray-50 dark:bg-gray-700 dark:text-gray-400">
                                <tr>
                                    <th className="px-6 py-3">Nama Investor</th>
                                    <th className="px-6 py-3">% Kepemilikan</th>
                                    <th className="px-6 py-3">Email</th>
                                    <th className="px-6 py-3">Telepon</th>
                                </tr>
                            </thead>
                            <tbody>
                                {investors.map(inv => (
                                    <tr key={inv.id} className="bg-white dark:bg-gray-800 border-b dark:border-gray-700">
                                        <td className="px-6 py-4 font-medium text-gray-900 dark:text-white">{inv.name}</td>
                                        <td className="px-6 py-4">{inv.ownershipPercentage.toFixed(2)}%</td>
                                        <td className="px-6 py-4">{inv.email}</td>
                                        <td className="px-6 py-4">{inv.phone}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
                 {view === 'transactions' && (
                    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md">
                        <div className="p-4 border-b dark:border-gray-700 flex justify-end">
                            <Button onClick={() => setTransactionModalOpen(true)}>Catat Transaksi</Button>
                        </div>
                        <table className="w-full text-sm text-left text-gray-500 dark:text-gray-400">
                             <thead className="text-xs text-gray-700 uppercase bg-gray-50 dark:bg-gray-700 dark:text-gray-400">
                                <tr>
                                    <th className="px-6 py-3">Tanggal</th>
                                    <th className="px-6 py-3">Nama Investor</th>
                                    <th className="px-6 py-3">Tipe Transaksi</th>
                                    <th className="px-6 py-3">Jumlah</th>
                                </tr>
                            </thead>
                            <tbody>
                                {capitalTransactions.map(t => (
                                    <tr key={t.id} className="bg-white dark:bg-gray-800 border-b dark:border-gray-700">
                                        <td className="px-6 py-4">{new Date(t.date).toLocaleDateString('id-ID')}</td>
                                        <td className="px-6 py-4 font-medium text-gray-900 dark:text-white">{t.investorName}</td>
                                        <td className="px-6 py-4">{t.type}</td>
                                        <td className={`px-6 py-4 font-semibold ${t.type === 'Deposit' ? 'text-green-500' : 'text-red-500'}`}>Rp{t.amount.toLocaleString('id-ID')}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
                 {view === 'distribution' && (
                     <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md">
                        <div className="p-4 border-b dark:border-gray-700 flex justify-end">
                            <Button onClick={() => setDistributionModalOpen(true)}>Bagikan Laba</Button>
                        </div>
                        <table className="w-full text-sm text-left text-gray-500 dark:text-gray-400">
                             <thead className="text-xs text-gray-700 uppercase bg-gray-50 dark:bg-gray-700 dark:text-gray-400">
                                <tr>
                                    <th className="px-6 py-3">Tanggal</th>
                                    <th className="px-6 py-3">Total Laba Dibagikan</th>
                                    <th className="px-6 py-3">Detail Pembagian</th>
                                </tr>
                            </thead>
                            <tbody>
                                {profitDistributions.map(pd => (
                                    <tr key={pd.id} className="bg-white dark:bg-gray-800 border-b dark:border-gray-700">
                                        <td className="px-6 py-4">{new Date(pd.date).toLocaleDateString()}</td>
                                        <td className="px-6 py-4 font-semibold text-red-500">Rp{pd.totalProfitDistributed.toLocaleString('id-ID')}</td>
                                        <td className="px-6 py-4">
                                            <ul className="list-disc list-inside">
                                            {pd.distributions.map(d => <li key={d.investorId}>{d.investorName}: Rp{d.amount.toLocaleString('id-ID')}</li>)}
                                            </ul>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
            
            <InvestorModal isOpen={isInvestorModalOpen} onClose={() => setInvestorModalOpen(false)} onSave={handleSaveInvestor} />
            <CapitalTransactionModal isOpen={isTransactionModalOpen} onClose={() => setTransactionModalOpen(false)} onSave={handleSaveTransaction} investors={investors} accounts={accounts} />
            <ProfitDistributionModal isOpen={isDistributionModalOpen} onClose={() => setDistributionModalOpen(false)} onSave={handleSaveDistribution} investors={investors} accounts={accounts} />
        </div>
    );
};
import React, { useState, useMemo, useEffect } from 'react';
import { Account, AccountType, JournalEntry, JournalEntryLine, PaymentMethod, PaymentTerm, PosSessionSummary } from '../types';
import { useAppContext } from '../hooks/useAppContext';
import { Card, Button, Input, Select, Label, Modal, DateRangeFilter, Table, Thead, Tbody, Tr, Th, Td, PageHeader, ActionsDropdown, DropdownItem, Badge } from './ui';

// --- PAGE 1: Cash Account List & Modal ---

const AddCashAccountModal: React.FC<{
    isOpen: boolean;
    onClose: () => void;
    onSave: (data: { name: string, initialBalance: number, sourceAccountId: string, cashAccountType: Account['cashAccountType'] }) => void;
    accounts: Account[];
}> = ({ isOpen, onClose, onSave, accounts }) => {
    const [name, setName] = useState('');
    const [initialBalance, setInitialBalance] = useState('');
    const [sourceAccountId, setSourceAccountId] = useState('');
    const [cashAccountType, setCashAccountType] = useState<Account['cashAccountType']>('Tunai');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSave({ name, initialBalance: parseFloat(initialBalance) || 0, sourceAccountId, cashAccountType });
        setName('');
        setInitialBalance('');
        setSourceAccountId('');
        setCashAccountType('Tunai');
        onClose();
    };

    const footer = (
        <>
            <button type="button" onClick={onClose} className="px-4 py-2 rounded-md text-gray-700 dark:text-gray-200 bg-gray-200 dark:bg-gray-600">Batal</button>
            <Button onClick={handleSubmit} type="submit">Simpan</Button>
        </>
    );
    
    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title="Tambah Pos Kas Baru"
            footer={footer}
            maxWidth="max-w-lg"
        >
            <form id="add-cash-account-form" onSubmit={handleSubmit} className="space-y-4">
                <div>
                    <Label htmlFor="accName">Nama Pos Kas (e.g., Bank Mandiri, Kasir Toko)</Label>
                    <Input id="accName" type="text" value={name} onChange={e => setName(e.target.value)} required />
                </div>
                <div>
                    <Label htmlFor="cashAccountType">Kategori Rekening Kas</Label>
                    <Select id="cashAccountType" value={cashAccountType} onChange={e => setCashAccountType(e.target.value as Account['cashAccountType'])} required>
                        <option value="Tunai">Tunai</option>
                        <option value="Rekening">Rekening Bank</option>
                        <option value="Brankas">Brankas</option>
                        <option value="Lainnya">Lainnya</option>
                    </Select>
                </div>
                <div>
                    <Label htmlFor="initBalance">Saldo Awal</Label>
                    <Input id="initBalance" type="number" value={initialBalance} onChange={e => setInitialBalance(e.target.value)} placeholder="0" />
                </div>
                {parseFloat(initialBalance) > 0 && (
                    <div>
                        <Label htmlFor="sourceAcc">Sumber Dana Saldo Awal</Label>
                        <Select id="sourceAcc" value={sourceAccountId} onChange={e => setSourceAccountId(e.target.value)} required>
                            <option value="">-- Pilih Sumber Dana --</option>
                            {accounts.filter(a => a.type === AccountType.Equity || a.isCashAccount).map(acc => (
                                <option key={acc.id} value={acc.id}>{acc.name}</option>
                            ))}
                        </Select>
                        <p className="text-xs text-gray-500 mt-1">Pilih dari mana saldo awal berasal. Misalnya, dari Modal atau transfer dari rekening kas lain.</p>
                    </div>
                )}
            </form>
        </Modal>
    );
};

const UpdateCashAccountModal: React.FC<{
    isOpen: boolean;
    onClose: () => void;
    onSave: (data: { accountId: string; name: string }) => void;
    account: Account | null;
}> = ({ isOpen, onClose, onSave, account }) => {
    const [name, setName] = useState('');

    useEffect(() => {
        if (isOpen && account) {
            setName(account.name);
        }
    }, [isOpen, account]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (account) {
            onSave({ accountId: account.id, name });
        }
        onClose();
    };

    const footer = (
        <>
            <button type="button" onClick={onClose} className="px-4 py-2 rounded-md text-gray-700 dark:text-gray-200 bg-gray-200 dark:bg-gray-600">Batal</button>
            <Button onClick={handleSubmit} type="submit">Simpan</Button>
        </>
    );

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Ubah Nama Rekening Kas" footer={footer} maxWidth="max-w-md">
            <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                    <Label htmlFor="editAccName">Nama Rekening</Label>
                    <Input id="editAccName" type="text" value={name} onChange={e => setName(e.target.value)} required />
                </div>
            </form>
        </Modal>
    );
};


export const CashAccountListPage: React.FC = () => {
    const { state, dispatch } = useAppContext();
    const [isAddModalOpen, setAddModalOpen] = useState(false);
    const [isEditModalOpen, setEditModalOpen] = useState(false);
    const [editingAccount, setEditingAccount] = useState<Account | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [typeFilter, setTypeFilter] = useState<'all' | Account['cashAccountType']>('all');

    const filteredCashAccounts = useMemo(() => {
        const lowercasedSearch = searchTerm.toLowerCase();
        return state.accounts.filter(a => {
            if (!a.isCashAccount) return false;
            
            const matchesSearch = a.name.toLowerCase().includes(lowercasedSearch) || a.id.toLowerCase().includes(lowercasedSearch);
            const matchesType = typeFilter === 'all' || a.cashAccountType === typeFilter;
            
            return matchesSearch && matchesType;
        });
    }, [state.accounts, searchTerm, typeFilter]);

    const handleSave = (data: { name: string, initialBalance: number, sourceAccountId: string, cashAccountType: Account['cashAccountType'] }) => {
        dispatch({ type: 'finance/addCashAccount', payload: data });
    };

    const handleUpdate = (data: { accountId: string; name: string }) => {
        dispatch({ type: 'finance/updateCashAccount', payload: data });
    };
    
    const openEditModal = (account: Account) => {
        setEditingAccount(account);
        setEditModalOpen(true);
    };

    return (
        <div className="p-8 h-full flex flex-col">
            <div className="flex justify-between items-center mb-6">
                 <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Data Rekening Kas</h1>
                <Button onClick={() => setAddModalOpen(true)}>Tambah Pos Kas</Button>
            </div>
            <div className="mb-4 bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Input 
                        placeholder="Cari nama atau nomor akun..."
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                    />
                    <Select value={typeFilter} onChange={e => setTypeFilter(e.target.value as any)}>
                        <option value="all">Semua Kategori</option>
                        <option value="Tunai">Tunai</option>
                        <option value="Rekening">Rekening Bank</option>
                        <option value="Brankas">Brankas</option>
                        <option value="Lainnya">Lainnya</option>
                    </Select>
                </div>
            </div>
            <Card className="flex-grow overflow-y-auto">
                <table className="w-full text-sm text-left text-gray-500 dark:text-gray-400">
                    <thead className="text-xs text-gray-700 uppercase bg-gray-50 dark:bg-gray-700 dark:text-gray-400 sticky top-0">
                        <tr>
                            <th scope="col" className="px-6 py-3">No. Akun</th>
                            <th scope="col" className="px-6 py-3">Nama Rekening</th>
                            <th scope="col" className="px-6 py-3">Kategori</th>
                            <th scope="col" className="px-6 py-3 text-right">Saldo Saat Ini</th>
                            <th scope="col" className="px-6 py-3 text-center">Aksi</th>
                        </tr>
                    </thead>
                    <tbody>
                         {filteredCashAccounts.map((account) => (
                            <tr key={account.id} className="bg-white dark:bg-gray-800 border-b dark:border-gray-700">
                                <td className="px-6 py-4">{account.id}</td>
                                <td className="px-6 py-4 font-medium text-gray-900 dark:text-white">{account.name}</td>
                                <td className="px-6 py-4">
                                    <Badge>{account.cashAccountType || 'N/A'}</Badge>
                                </td>
                                <td className="px-6 py-4 font-semibold text-lg text-right">
                                    {`Rp${account.balance.toLocaleString('id-ID')}`}
                                </td>
                                <td className="px-6 py-4 text-center">
                                    <button onClick={() => openEditModal(account)} className="font-medium text-primary-600 dark:text-primary-500 hover:underline">Ubah</button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </Card>
             <AddCashAccountModal isOpen={isAddModalOpen} onClose={() => setAddModalOpen(false)} onSave={handleSave} accounts={state.accounts}/>
             <UpdateCashAccountModal isOpen={isEditModalOpen} onClose={() => setEditModalOpen(false)} onSave={handleUpdate} account={editingAccount}/>
        </div>
    );
};


// --- PAGE 2: Cash Transaction ---

export const CashTransactionPage: React.FC = () => {
    const { state, dispatch } = useAppContext();
    const [cashAccountId, setCashAccountId] = useState('');
    const [counterAccountId, setCounterAccountId] = useState('');
    const [amount, setAmount] = useState('');
    const [description, setDescription] = useState('');
    const [type, setType] = useState<'debit'|'credit'>('debit'); // debit = cash in, credit = cash out
    const [successMessage, setSuccessMessage] = useState('');
    
    const cashAccounts = useMemo(() => state.accounts.filter(a => a.isCashAccount), [state.accounts]);
    const counterAccounts = useMemo(() => state.accounts.filter(a => a.type === AccountType.Revenue || a.type === AccountType.Expense), [state.accounts]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const numAmount = parseFloat(amount);
        if (!cashAccountId || !counterAccountId || !numAmount) {
            alert("Harap lengkapi semua field.");
            return;
        }

        const lines = type === 'debit' ? [ // Cash In
            { accountId: cashAccountId, type: 'debit' as const, amount: numAmount },
            { accountId: counterAccountId, type: 'credit' as const, amount: numAmount },
        ] : [ // Cash Out
            { accountId: cashAccountId, type: 'credit' as const, amount: numAmount },
            { accountId: counterAccountId, type: 'debit' as const, amount: numAmount },
        ];
        
        dispatch({ type: 'finance/addJournalEntry', payload: { description, lines }});
        
        setSuccessMessage('Transaksi berhasil dicatat!');
        setCashAccountId(''); setCounterAccountId(''); setAmount(''); setDescription('');
        setTimeout(() => setSuccessMessage(''), 5000);
    };

    return (
        <div className="p-8">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-6">Catat Transaksi Kas</h1>
            <Card className="max-w-2xl mx-auto">
                 {successMessage && <div className="mb-4 p-4 text-sm text-green-700 bg-green-100 rounded-lg dark:bg-green-200 dark:text-green-800">{successMessage}</div>}
                 <form onSubmit={handleSubmit} className="space-y-6">
                    <div>
                        <Label>Jenis Transaksi</Label>
                        <div className="mt-2 grid grid-cols-2 gap-4">
                            <button type="button" onClick={() => setType('debit')} className={`p-3 rounded-lg text-center ${type === 'debit' ? 'bg-primary-600 text-white' : 'bg-gray-200 dark:bg-gray-700'}`}>Pemasukan</button>
                            <button type="button" onClick={() => setType('credit')} className={`p-3 rounded-lg text-center ${type === 'credit' ? 'bg-primary-600 text-white' : 'bg-gray-200 dark:bg-gray-700'}`}>Pengeluaran</button>
                        </div>
                    </div>
                     <div>
                        <Label htmlFor="cashAcc">{type === 'debit' ? 'Setor Ke' : 'Ambil Dari'}</Label>
                        <Select id="cashAcc" value={cashAccountId} onChange={e => setCashAccountId(e.target.value)} required>
                            <option value="">-- Pilih Rekening Kas --</option>
                            {cashAccounts.map(acc => <option key={acc.id} value={acc.id}>{acc.name}</option>)}
                        </Select>
                    </div>
                     <div>
                        <Label htmlFor="counterAcc">Kategori Transaksi</Label>
                        <Select id="counterAcc" value={counterAccountId} onChange={e => setCounterAccountId(e.target.value)} required>
                            <option value="">-- Pilih Kategori --</option>
                            {counterAccounts.map(acc => <option key={acc.id} value={acc.id}>{acc.name}</option>)}
                        </Select>
                    </div>
                    <div>
                        <Label htmlFor="amount">Jumlah (Rp)</Label>
                        <Input id="amount" type="number" value={amount} onChange={e => setAmount(e.target.value)} required />
                    </div>
                     <div>
                        <Label htmlFor="desc">Deskripsi</Label>
                        <Input id="desc" type="text" value={description} onChange={e => setDescription(e.target.value)} required />
                    </div>
                    <div className="flex justify-end pt-2">
                        <Button type="submit">Catat Transaksi</Button>
                    </div>
                 </form>
            </Card>
        </div>
    );
};

// --- PAGE 3: Cash Transfer ---

export const CashTransferPage: React.FC = () => {
    const { state, dispatch } = useAppContext();
    const [fromAccountId, setFromAccountId] = useState('');
    const [toAccountId, setToAccountId] = useState('');
    const [amount, setAmount] = useState('');
    const [description, setDescription] = useState('');
    const [successMessage, setSuccessMessage] = useState('');

    const cashAccounts = useMemo(() => state.accounts.filter(a => a.isCashAccount), [state.accounts]);
    
    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const numAmount = parseFloat(amount);
        if (!fromAccountId || !toAccountId || !numAmount || fromAccountId === toAccountId) {
            alert("Harap lengkapi semua field dan pastikan rekening sumber dan tujuan berbeda.");
            return;
        }

        dispatch({
            type: 'finance/addJournalEntry',
            payload: {
                description: description || `Transfer from ${fromAccountId} to ${toAccountId}`,
                lines: [
                    { accountId: fromAccountId, type: 'credit', amount: numAmount },
                    { accountId: toAccountId, type: 'debit', amount: numAmount },
                ],
                reference: 'Transfer Antar Kas'
            }
        });

        setSuccessMessage('Transfer berhasil dicatat!');
        setFromAccountId(''); setToAccountId(''); setAmount(''); setDescription('');
        setTimeout(() => setSuccessMessage(''), 5000);
    };

    return (
        <div className="p-8">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-6">Pindah Saldo Antar Kas</h1>
            <Card className="max-w-2xl mx-auto">
                {successMessage && <div className="mb-4 p-4 text-sm text-green-700 bg-green-100 rounded-lg dark:bg-green-200 dark:text-green-800">{successMessage}</div>}
                <form onSubmit={handleSubmit} className="space-y-6">
                    <div>
                        <Label htmlFor="fromAcc">Dari Rekening</Label>
                        <Select id="fromAcc" value={fromAccountId} onChange={e => setFromAccountId(e.target.value)} required>
                            <option value="">-- Pilih Rekening Sumber --</option>
                            {cashAccounts.map(acc => <option key={acc.id} value={acc.id}>{acc.name} (Rp{acc.balance.toLocaleString('id-ID')})</option>)}
                        </Select>
                    </div>
                    <div>
                        <Label htmlFor="toAcc">Ke Rekening</Label>
                        <Select id="toAcc" value={toAccountId} onChange={e => setToAccountId(e.target.value)} required>
                            <option value="">-- Pilih Rekening Tujuan --</option>
                            {cashAccounts.filter(a => a.id !== fromAccountId).map(acc => <option key={acc.id} value={acc.id}>{acc.name}</option>)}
                        </Select>
                    </div>
                    <div>
                        <Label htmlFor="amount">Jumlah (Rp)</Label>
                        <Input id="amount" type="number" value={amount} onChange={e => setAmount(e.target.value)} required />
                    </div>
                    <div>
                        <Label htmlFor="desc">Deskripsi (Opsional)</Label>
                        <Input id="desc" type="text" value={description} onChange={e => setDescription(e.target.value)} />
                    </div>
                    <div className="flex justify-end pt-2">
                        <Button type="submit">Proses Transfer</Button>
                    </div>
                </form>
            </Card>
        </div>
    );
};

// --- Verification Modal ---
const VerificationModal: React.FC<{
    summary: PosSessionSummary | null;
    isOpen: boolean;
    onClose: () => void;
    onVerify: (summaryId: string, depositToAccountId: string) => void;
    cashAccounts: Account[];
}> = ({ summary, isOpen, onClose, onVerify, cashAccounts }) => {
    const [depositToAccountId, setDepositToAccountId] = useState('');

    useEffect(() => {
        if(summary){
            const branch = useAppContext().state.branches.find(b => b.id === summary.branchId);
            setDepositToAccountId(branch?.safeAccountId || '1020'); // Default to branch safe or Bank BCA
        }
    }, [summary, useAppContext().state.branches]);


    if (!summary) return null;

    const { expectedCash, countedCash, variance } = summary;
    const varianceColor = variance === 0 ? '' : variance > 0 ? 'text-green-500' : 'text-red-500';

    const footer = (
        <>
            <button onClick={onClose} className="px-6 py-2 rounded-md bg-gray-200 dark:bg-gray-600 font-semibold">Batal</button>
            <Button onClick={() => onVerify(summary.id, depositToAccountId)} className="px-6 py-2">Konfirmasi & Verifikasi Setoran</Button>
        </>
    );

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={`Verifikasi Setoran Sesi #${summary.sessionId}`} footer={footer}>
            <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                    <p><strong>Kasir:</strong> {summary.cashierName}</p>
                    <p><strong>Tanggal:</strong> {new Date(summary.date).toLocaleString('id-ID')}</p>
                </div>
                <div className="space-y-3 p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                    <div className="flex justify-between"><span>Kas Seharusnya (Sistem)</span><span className="font-semibold">Rp{expectedCash.toLocaleString('id-ID')}</span></div>
                    <div className="flex justify-between"><span>Kas Dihitung (Setoran)</span><span className="font-semibold">Rp{countedCash.toLocaleString('id-ID')}</span></div>
                    <div className="flex justify-between font-bold text-lg pt-2 border-t dark:border-gray-600"><span className={varianceColor}>Selisih</span><span className={varianceColor}>Rp{variance.toLocaleString('id-ID')}</span></div>
                </div>
                    <div>
                    <Label htmlFor="depositToAccountId">Setor Ke Rekening (Rekening Bertaut)</Label>
                    <Select id="depositToAccountId" value={depositToAccountId} onChange={e => setDepositToAccountId(e.target.value)} required>
                        {cashAccounts.map(acc => <option key={acc.id} value={acc.id}>{acc.name}</option>)}
                    </Select>
                </div>
            </div>
        </Modal>
    );
};

export const CashierDepositVerificationPage: React.FC = () => {
    const { state, dispatch } = useAppContext();
    const [view, setView] = useState<'pending' | 'verified'>('pending');
    const [selectedSummary, setSelectedSummary] = useState<PosSessionSummary | null>(null);

    const pendingSummaries = useMemo(() => state.posSessionSummaries.filter(s => s.status === 'pending'), [state.posSessionSummaries]);
    const verifiedSummaries = useMemo(() => state.posSessionSummaries.filter(s => s.status === 'verified'), [state.posSessionSummaries]);
    
    const cashAccounts = useMemo(() => state.accounts.filter(a => a.isCashAccount && a.id !== '1010'), [state.accounts]); // Exclude Kas di Tangan as a destination

    const handleVerify = (summaryId: string, depositToAccountId: string) => {
        dispatch({ type: 'finance/verifyCashierDeposit', payload: { summaryId, depositToAccountId } });
        setSelectedSummary(null);
    };

    const summariesToShow = view === 'pending' ? pendingSummaries : verifiedSummaries;

    return (
        <div className="p-8 h-full flex flex-col">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">Verifikasi Setoran Kasir</h1>
             <div className="flex space-x-2 border-b dark:border-gray-700 mb-4">
                <button onClick={() => setView('pending')} className={`py-2 px-4 text-sm font-medium ${view === 'pending' ? 'border-b-2 border-primary-500 text-primary-500' : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'}`}>
                    Menunggu Verifikasi ({pendingSummaries.length})
                </button>
                <button onClick={() => setView('verified')} className={`py-2 px-4 text-sm font-medium ${view === 'verified' ? 'border-b-2 border-primary-500 text-primary-500' : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'}`}>
                    Sudah Diverifikasi
                </button>
            </div>
            <Card className="flex-grow overflow-y-auto">
                 <table className="w-full text-sm text-left text-gray-500 dark:text-gray-400">
                    <thead className="text-xs text-gray-700 uppercase bg-gray-50 dark:bg-gray-700 dark:text-gray-400">
                        <tr>
                            <th className="px-6 py-3">Tanggal</th>
                            <th className="px-6 py-3">Kasir</th>
                            <th className="px-6 py-3 text-right">Kas Dihitung</th>
                            <th className="px-6 py-3 text-right">Selisih</th>
                            <th className="px-6 py-3 text-center">Aksi</th>
                        </tr>
                    </thead>
                    <tbody>
                        {summariesToShow.map(summary => (
                            <tr key={summary.id} className="border-b dark:border-gray-700">
                                <td className="px-6 py-4">{new Date(summary.date).toLocaleString('id-ID')}</td>
                                <td className="px-6 py-4 font-medium">{summary.cashierName}</td>
                                <td className="px-6 py-4 text-right">Rp{summary.countedCash.toLocaleString('id-ID')}</td>
                                <td className={`px-6 py-4 text-right font-semibold ${summary.variance > 0 ? 'text-green-500' : summary.variance < 0 ? 'text-red-500' : ''}`}>Rp{summary.variance.toLocaleString('id-ID')}</td>
                                <td className="px-6 py-4 text-center">
                                    {view === 'pending' ? (
                                        <Button onClick={() => setSelectedSummary(summary)}>Verifikasi</Button>
                                    ) : (
                                        <span className="text-xs text-gray-500">Diverifikasi oleh {summary.verifiedBy}</span>
                                    )}
                                </td>
                            </tr>
                        ))}
                         {summariesToShow.length === 0 && (
                            <tr><td colSpan={5} className="text-center p-8 text-gray-500">Tidak ada data.</td></tr>
                        )}
                    </tbody>
                </table>
            </Card>
            <VerificationModal
                isOpen={!!selectedSummary}
                onClose={() => setSelectedSummary(null)}
                summary={selectedSummary}
                onVerify={handleVerify}
                cashAccounts={cashAccounts}
            />
        </div>
    );
};

export const ChartOfAccountsPage: React.FC = () => {
    const { state } = useAppContext();
    const { accounts } = state;

    const groupedAccounts = useMemo(() => {
        return accounts.reduce((acc, account) => {
            const type = account.type;
            if (!acc[type]) {
                acc[type] = [];
            }
            acc[type].push(account);
            return acc;
        }, {} as Record<AccountType, Account[]>);
    }, [accounts]);

    return (
        <div className="p-8 h-full flex flex-col">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-6">Bagan Akun</h1>
            <div className="flex-grow bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-y-auto">
                {Object.entries(groupedAccounts).map(([type, accs]: [string, Account[]]) => (
                    <div key={type} className="mb-6">
                        <h2 className="text-xl font-semibold p-4 bg-gray-50 dark:bg-gray-700/50 sticky top-0">{type}</h2>
                        <table className="w-full text-sm text-left text-gray-500 dark:text-gray-400">
                             <thead className="text-xs text-gray-700 uppercase">
                                <tr>
                                    <th scope="col" className="px-6 py-3">No. Akun</th>
                                    <th scope="col" className="px-6 py-3">Nama Akun</th>
                                    <th scope="col" className="px-6 py-3 text-right">Saldo</th>
                                </tr>
                            </thead>
                            <tbody>
                                {accs.map(account => (
                                    <tr key={account.id} className="border-b dark:border-gray-700">
                                        <td className="px-6 py-4">{account.id}</td>
                                        <td className="px-6 py-4 font-medium">{account.name}</td>
                                        <td className="px-6 py-4 text-right font-mono">Rp{account.balance.toLocaleString('id-ID')}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                ))}
            </div>
        </div>
    );
};

export const GeneralJournalPage: React.FC = () => {
    const { state } = useAppContext();
    const { journalEntries } = state;
    return (
        <div className="p-8 h-full flex flex-col">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-6">Jurnal Umum</h1>
            <Card className="flex-grow overflow-y-auto">
                {journalEntries.map(entry => (
                    <div key={entry.id} className="mb-6 pb-4 border-b dark:border-gray-700">
                        <div className="flex justify-between items-baseline">
                            <h3 className="font-semibold">{entry.description}</h3>
                            <p className="text-sm text-gray-500">{new Date(entry.date).toLocaleString('id-ID')}</p>
                        </div>
                        <table className="w-full text-sm mt-2">
                            <tbody>
                                {entry.lines.map((line, index) => (
                                    <tr key={index}>
                                        <td className={`py-1 ${line.type === 'credit' ? 'pl-8' : ''}`}>{line.accountName}</td>
                                        <td className="py-1 text-right font-mono w-40">{line.type === 'debit' ? `Rp${line.amount.toLocaleString('id-ID')}` : ''}</td>
                                        <td className="py-1 text-right font-mono w-40">{line.type === 'credit' ? `Rp${line.amount.toLocaleString('id-ID')}` : ''}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                ))}
            </Card>
        </div>
    );
};

export const LedgerPage: React.FC = () => {
    return (
        <div className="p-8">
            <h1 className="text-3xl font-bold">Buku Besar</h1>
            <p className="mt-4 text-gray-500">Fitur ini sedang dalam pengembangan.</p>
        </div>
    );
};

export const PaymentMethodsPage: React.FC = () => {
    return (
        <div className="p-8">
            <h1 className="text-3xl font-bold">Metode Pembayaran</h1>
            <p className="mt-4 text-gray-500">Fitur ini sedang dalam pengembangan.</p>
        </div>
    );
};

export const PaymentTermsPage: React.FC = () => {
    return (
        <div className="p-8">
            <h1 className="text-3xl font-bold">Tempo Pembayaran</h1>
            <p className="mt-4 text-gray-500">Fitur ini sedang dalam pengembangan.</p>
        </div>
    );
};
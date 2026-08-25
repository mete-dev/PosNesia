import React, { useState, useMemo, useEffect } from 'react';
import { 
    CreditCard, Clock, Plus, Search, Edit2, Trash2, CheckCircle2, 
    ShieldCheck, DollarSign, Wallet, Building2, Calendar, ArrowRightLeft,
    ArrowDownLeft, ArrowUpRight, FileText, Eye, Printer
} from 'lucide-react';
import { Account, AccountType, JournalEntry, JournalEntryLine, PaymentMethod, PaymentTerm, PosSessionSummary, Page } from '../types';
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


// --- Unified Cash Transaction Modal (Pemasukan / Pengeluaran / Transfer) ---
const UnifiedCashTransactionModal: React.FC<{
    isOpen: boolean;
    onClose: () => void;
    initialMode?: 'income' | 'expense' | 'transfer';
    defaultAccountId?: string;
}> = ({ isOpen, onClose, initialMode = 'income', defaultAccountId }) => {
    const { state, dispatch } = useAppContext();
    const [mode, setMode] = useState<'income' | 'expense' | 'transfer'>(initialMode);

    // Common fields
    const [amount, setAmount] = useState('');
    const [description, setDescription] = useState('');
    const [cashAccountId, setCashAccountId] = useState('');
    const [counterAccountId, setCounterAccountId] = useState('');
    const [selectedPoId, setSelectedPoId] = useState('');
    const [toAccountId, setToAccountId] = useState('');

    const cashAccounts = useMemo(() => state.accounts.filter(a => a.isCashAccount), [state.accounts]);
    const revenueAccounts = useMemo(() => state.accounts.filter(a => a.type === AccountType.Revenue || a.type === AccountType.Equity || a.type === AccountType.Asset), [state.accounts]);
    const expenseAccounts = useMemo(() => state.accounts.filter(a => a.type === AccountType.Expense || a.type === AccountType.Asset || a.type === AccountType.Liability), [state.accounts]);

    // Unpaid Purchase Orders for Hutang Dagang settlement
    const unpaidPurchases = useMemo(() => {
        return (state.purchases || []).filter(p => {
            const remaining = p.grandTotal - (p.amountPaid || 0);
            return remaining > 0 && p.status !== 'Cancelled';
        });
    }, [state.purchases]);

    useEffect(() => {
        if (isOpen) {
            setMode(initialMode);
            setAmount('');
            setDescription('');
            setCashAccountId(defaultAccountId || cashAccounts[0]?.id || '');
            setCounterAccountId('');
            setSelectedPoId('');
            setToAccountId('');
        }
    }, [isOpen, initialMode, defaultAccountId, cashAccounts]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const numAmount = parseFloat(amount);
        if (!numAmount || numAmount <= 0) {
            alert('Harap masukkan nominal transaksi yang valid.');
            return;
        }

        if (mode === 'transfer') {
            if (!cashAccountId || !toAccountId || cashAccountId === toAccountId) {
                alert('Harap pilih rekening sumber dan rekening tujuan yang berbeda.');
                return;
            }
            const fromAccName = cashAccounts.find(a => a.id === cashAccountId)?.name || cashAccountId;
            const toAccName = cashAccounts.find(a => a.id === toAccountId)?.name || toAccountId;
            dispatch({
                type: 'finance/addJournalEntry',
                payload: {
                    description: description || `Transfer dari ${fromAccName} ke ${toAccName}`,
                    lines: [
                        { accountId: cashAccountId, type: 'credit', amount: numAmount },
                        { accountId: toAccountId, type: 'debit', amount: numAmount },
                    ],
                    reference: 'Transfer Antar Rekening'
                }
            });
        } else if (mode === 'income') {
            if (!cashAccountId || !counterAccountId) {
                alert('Harap pilih rekening kas penerima dan kategori pemasukan.');
                return;
            }
            dispatch({
                type: 'finance/addJournalEntry',
                payload: {
                    description: description || 'Pemasukan Kas',
                    lines: [
                        { accountId: cashAccountId, type: 'debit', amount: numAmount },
                        { accountId: counterAccountId, type: 'credit', amount: numAmount },
                    ],
                    reference: 'Pemasukan Kas'
                }
            });
        } else {
            // expense
            if (!cashAccountId || !counterAccountId) {
                alert('Harap pilih rekening kas sumber dan kategori pengeluaran.');
                return;
            }

            // Check if paying Hutang Dagang (2010) linked to a Purchase Order
            if (counterAccountId === '2010' && selectedPoId) {
                dispatch({
                    type: 'purchases/addPayment',
                    payload: {
                        poId: selectedPoId,
                        amount: numAmount,
                        sourceAccountId: cashAccountId,
                        notes: description || 'Pembayaran Hutang Dagang'
                    }
                });
            } else {
                dispatch({
                    type: 'finance/addJournalEntry',
                    payload: {
                        description: description || 'Pengeluaran Kas',
                        lines: [
                            { accountId: cashAccountId, type: 'credit', amount: numAmount },
                            { accountId: counterAccountId, type: 'debit', amount: numAmount },
                        ],
                        reference: 'Pengeluaran Kas'
                    }
                });
            }
        }

        onClose();
    };

    const footer = (
        <div className="flex justify-end gap-2 w-full">
            <Button variant="secondary" type="button" onClick={onClose}>Batal</Button>
            <Button 
                type="submit" 
                form="unified-tx-form"
                className={`gap-1.5 ${
                    mode === 'income' 
                        ? 'bg-emerald-600 hover:bg-emerald-700' 
                        : mode === 'expense'
                        ? 'bg-rose-600 hover:bg-rose-700'
                        : 'bg-blue-600 hover:bg-blue-700'
                }`}
            >
                {mode === 'income' ? <ArrowDownLeft className="w-4 h-4" /> : mode === 'expense' ? <ArrowUpRight className="w-4 h-4" /> : <ArrowRightLeft className="w-4 h-4" />}
                {mode === 'income' ? 'Simpan Pemasukan' : mode === 'expense' ? 'Simpan Pengeluaran' : 'Proses Transfer'}
            </Button>
        </div>
    );

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title="Catat Transaksi Kas & Bank"
            footer={footer}
            maxWidth="max-w-lg"
        >
            <div className="space-y-4 text-xs">
                {/* Mode Selector Tabs */}
                <div className="grid grid-cols-3 gap-1 bg-slate-100 dark:bg-zinc-800 p-1 rounded-xl">
                    <button
                        type="button"
                        onClick={() => setMode('income')}
                        className={`py-2 px-3 rounded-lg font-bold flex items-center justify-center gap-1.5 transition-all ${
                            mode === 'income'
                                ? 'bg-emerald-600 text-white shadow-xs'
                                : 'text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white'
                        }`}
                    >
                        <ArrowDownLeft className="w-4 h-4" />
                        Pemasukan
                    </button>
                    <button
                        type="button"
                        onClick={() => setMode('expense')}
                        className={`py-2 px-3 rounded-lg font-bold flex items-center justify-center gap-1.5 transition-all ${
                            mode === 'expense'
                                ? 'bg-rose-600 text-white shadow-xs'
                                : 'text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white'
                        }`}
                    >
                        <ArrowUpRight className="w-4 h-4" />
                        Pengeluaran
                    </button>
                    <button
                        type="button"
                        onClick={() => setMode('transfer')}
                        className={`py-2 px-3 rounded-lg font-bold flex items-center justify-center gap-1.5 transition-all ${
                            mode === 'transfer'
                                ? 'bg-blue-600 text-white shadow-xs'
                                : 'text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white'
                        }`}
                    >
                        <ArrowRightLeft className="w-4 h-4" />
                        Transfer Kas
                    </button>
                </div>

                <form id="unified-tx-form" onSubmit={handleSubmit} className="space-y-3 pt-1">
                    {mode === 'income' && (
                        <>
                            <div>
                                <Label htmlFor="inc_cashAcc">Setor ke Rekening Kas / Dompet Tujuan</Label>
                                <Select id="inc_cashAcc" value={cashAccountId} onChange={e => setCashAccountId(e.target.value)} required className="w-full mt-1">
                                    <option value="">-- Pilih Rekening Kas Tujuan --</option>
                                    {cashAccounts.map(acc => (
                                        <option key={acc.id} value={acc.id}>🏦 {acc.name} (Saldo: Rp{acc.balance.toLocaleString('id-ID')})</option>
                                    ))}
                                </Select>
                            </div>
                            <div>
                                <Label htmlFor="inc_counterAcc">Kategori Sumber Pemasukan</Label>
                                <Select id="inc_counterAcc" value={counterAccountId} onChange={e => setCounterAccountId(e.target.value)} required className="w-full mt-1">
                                    <option value="">-- Pilih Kategori Pemasukan --</option>
                                    {revenueAccounts.map(acc => (
                                        <option key={acc.id} value={acc.id}>{acc.name} ({acc.type})</option>
                                    ))}
                                </Select>
                            </div>
                        </>
                    )}

                    {mode === 'expense' && (
                        <>
                            <div>
                                <Label htmlFor="exp_cashAcc">Ambil Dari Rekening Kas / Dompet Sumber</Label>
                                <Select id="exp_cashAcc" value={cashAccountId} onChange={e => setCashAccountId(e.target.value)} required className="w-full mt-1">
                                    <option value="">-- Pilih Rekening Kas Sumber --</option>
                                    {cashAccounts.map(acc => (
                                        <option key={acc.id} value={acc.id}>🏦 {acc.name} (Saldo: Rp{acc.balance.toLocaleString('id-ID')})</option>
                                    ))}
                                </Select>
                            </div>
                            <div>
                                <Label htmlFor="exp_counterAcc">Kategori / Pos Pengeluaran</Label>
                                <Select 
                                    id="exp_counterAcc" 
                                    value={counterAccountId} 
                                    onChange={e => {
                                        const newCounter = e.target.value;
                                        setCounterAccountId(newCounter);
                                        if (newCounter !== '2010') {
                                            setSelectedPoId('');
                                        }
                                    }} 
                                    required 
                                    className="w-full mt-1"
                                >
                                    <option value="">-- Pilih Kategori Pengeluaran --</option>
                                    <option value="2010" className="font-bold text-blue-600">🏷️ 2010 - Pembayaran Hutang Dagang (Vendor PO)</option>
                                    {expenseAccounts.filter(a => a.id !== '2010').map(acc => (
                                        <option key={acc.id} value={acc.id}>{acc.name} ({acc.type})</option>
                                    ))}
                                </Select>
                            </div>

                            {counterAccountId === '2010' && (
                                <div className="p-3 bg-blue-50 dark:bg-blue-950/40 rounded-xl border border-blue-200 dark:border-blue-800/60 space-y-2">
                                    <Label htmlFor="exp_poSelect" className="font-bold text-blue-900 dark:text-blue-300">
                                        Pilih Tagihan Pembelian (PO) yang Belum Lunas
                                    </Label>
                                    <Select
                                        id="exp_poSelect"
                                        value={selectedPoId}
                                        onChange={e => {
                                            const poId = e.target.value;
                                            setSelectedPoId(poId);
                                            const po = unpaidPurchases.find(p => p.id === poId);
                                            if (po) {
                                                const remaining = po.grandTotal - (po.amountPaid || 0);
                                                setAmount(remaining.toString());
                                                setDescription(`Pembayaran Pembelian PO #${po.id} ke ${po.vendorName}`);
                                            }
                                        }}
                                        required
                                        className="w-full"
                                    >
                                        <option value="">-- Pilih Tagihan Pembelian Belum Lunas --</option>
                                        {unpaidPurchases.map(po => {
                                            const remaining = po.grandTotal - (po.amountPaid || 0);
                                            return (
                                                <option key={po.id} value={po.id}>
                                                    PO #{po.id} - {po.vendorName} (Sisa Hutang: Rp{remaining.toLocaleString('id-ID')})
                                                </option>
                                            );
                                        })}
                                    </Select>
                                    {unpaidPurchases.length === 0 && (
                                        <p className="text-[11px] text-amber-600 dark:text-amber-400 font-medium">
                                            ℹ️ Tidak ada tagihan pembelian yang belum lunas.
                                        </p>
                                    )}
                                </div>
                            )}
                        </>
                    )}

                    {mode === 'transfer' && (
                        <>
                            <div>
                                <Label htmlFor="tr_fromAcc">Dari Rekening Kas / Dompet Sumber</Label>
                                <Select id="tr_fromAcc" value={cashAccountId} onChange={e => setCashAccountId(e.target.value)} required className="w-full mt-1">
                                    <option value="">-- Pilih Rekening Sumber --</option>
                                    {cashAccounts.map(acc => (
                                        <option key={acc.id} value={acc.id}>🏦 {acc.name} (Saldo: Rp{acc.balance.toLocaleString('id-ID')})</option>
                                    ))}
                                </Select>
                            </div>
                            <div>
                                <Label htmlFor="tr_toAcc">Ke Rekening Kas / Dompet Tujuan</Label>
                                <Select id="tr_toAcc" value={toAccountId} onChange={e => setToAccountId(e.target.value)} required className="w-full mt-1">
                                    <option value="">-- Pilih Rekening Tujuan --</option>
                                    {cashAccounts.filter(a => a.id !== cashAccountId).map(acc => (
                                        <option key={acc.id} value={acc.id}>🏦 {acc.name} (Saldo: Rp{acc.balance.toLocaleString('id-ID')})</option>
                                    ))}
                                </Select>
                            </div>
                        </>
                    )}

                    <div>
                        <Label htmlFor="tx_amount">Nominal / Jumlah (Rp)</Label>
                        <Input 
                            id="tx_amount" 
                            type="number" 
                            value={amount} 
                            onChange={e => setAmount(e.target.value)} 
                            placeholder="0" 
                            required 
                            className="mt-1 font-mono font-bold"
                        />
                    </div>

                    <div>
                        <Label htmlFor="tx_desc">Keterangan / Catatan</Label>
                        <Input 
                            id="tx_desc" 
                            type="text" 
                            value={description} 
                            onChange={e => setDescription(e.target.value)} 
                            placeholder="Contoh: Pembayaran Listrik, Tambahan Modal, Transfer ke Rekening Utama..." 
                            className="mt-1"
                        />
                    </div>
                </form>
            </div>
        </Modal>
    );
};

// --- Bank Statement / Rekening Koran Page & Printable View ---
export const AccountStatementPage: React.FC = () => {
    const { state, dispatch } = useAppContext();
    const { accounts, journalEntries, companyInfo } = state;

    const [selectedAccountId, setSelectedAccountId] = useState<string>(
        state.selectedAccountId || accounts.filter(a => a.isCashAccount)[0]?.id || '1010'
    );

    // Unified Transaction Modal State
    const [isTxModalOpen, setIsTxModalOpen] = useState(false);
    const [txModalMode, setTxModalMode] = useState<'income' | 'expense' | 'transfer'>('income');

    const openTxModal = (mode: 'income' | 'expense' | 'transfer') => {
        setTxModalMode(mode);
        setIsTxModalOpen(true);
    };

    useEffect(() => {
        if (state.selectedAccountId) {
            setSelectedAccountId(state.selectedAccountId);
        }
    }, [state.selectedAccountId]);

    const account = useMemo(() => accounts.find(a => a.id === selectedAccountId) || null, [accounts, selectedAccountId]);

    const todayStr = new Date().toISOString().split('T')[0];
    const pastMonthStr = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

    const [periodFilter, setPeriodFilter] = useState<'today' | '7days' | '30days' | '1year' | 'custom'>('30days');
    const [startDate, setStartDate] = useState(pastMonthStr);
    const [endDate, setEndDate] = useState(todayStr);

    useEffect(() => {
        const t = new Date();
        const tStr = t.toISOString().split('T')[0];
        if (periodFilter === 'today') {
            setStartDate(tStr);
            setEndDate(tStr);
        } else if (periodFilter === '7days') {
            const d = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
            setStartDate(d.toISOString().split('T')[0]);
            setEndDate(tStr);
        } else if (periodFilter === '30days') {
            const d = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
            setStartDate(d.toISOString().split('T')[0]);
            setEndDate(tStr);
        } else if (periodFilter === '1year') {
            const d = new Date(Date.now() - 365 * 24 * 60 * 60 * 1000);
            setStartDate(d.toISOString().split('T')[0]);
            setEndDate(tStr);
        }
    }, [periodFilter]);

    // Calculate chronological statement lines with running balance & CRUC status
    const statementData = useMemo(() => {
        if (!account) return { rows: [], totalDebit: 0, totalCredit: 0, activeAccountBalance: 0 };

        const accJournals: { 
            id: string; 
            date: Date; 
            description: string; 
            reference?: string; 
            debit: number; 
            credit: number;
            status?: 'active' | 'cancelled' | 'corrected';
            correctionNote?: string;
            originalEntryId?: string;
            lines: JournalEntryLine[];
        }[] = [];

        journalEntries.forEach(je => {
            const jeDate = new Date(je.date);
            je.lines.forEach(l => {
                if (l.accountId === account.id) {
                    accJournals.push({
                        id: je.id,
                        date: jeDate,
                        description: je.description || 'Transaksi Kas',
                        reference: je.reference,
                        debit: l.type === 'debit' ? l.amount : 0,
                        credit: l.type === 'credit' ? l.amount : 0,
                        status: je.status || 'active',
                        correctionNote: je.correctionNote,
                        originalEntryId: je.originalEntryId,
                        lines: je.lines
                    });
                }
            });
        });

        // Sort ascending by date for chronological running balance
        accJournals.sort((a, b) => a.date.getTime() - b.date.getTime());

        let runningBalance = 0;
        const allRows = accJournals.map(j => {
            if (j.status !== 'cancelled' && j.status !== 'corrected') {
                runningBalance += (j.debit - j.credit);
            }
            return {
                ...j,
                runningBalance
            };
        });

        // Apply date filtering
        const startD = new Date(startDate);
        startD.setHours(0, 0, 0, 0);
        const endD = new Date(endDate);
        endD.setHours(23, 59, 59, 999);

        const filtered = allRows.filter(r => r.date >= startD && r.date <= endD);

        // Only count active transactions for totals
        const activeOnly = filtered.filter(r => r.status !== 'cancelled' && r.status !== 'corrected');
        const totalDebit = activeOnly.reduce((sum, r) => sum + r.debit, 0);
        const totalCredit = activeOnly.reduce((sum, r) => sum + r.credit, 0);

        // Active balance from account
        const activeAccountBalance = account.balance ?? runningBalance;

        return {
            rows: filtered.reverse(), // Show newest first
            totalDebit,
            totalCredit,
            activeAccountBalance
        };
    }, [account, journalEntries, startDate, endDate]);

    // CRUC Modal States
    const [cancelModalEntry, setCancelModalEntry] = useState<{ id: string; description: string } | null>(null);
    const [cancelReason, setCancelReason] = useState('');

    const [editModalEntry, setEditModalEntry] = useState<{ 
        id: string; 
        description: string; 
        amount: number; 
        type: 'debit' | 'credit'; 
        counterAccountId: string;
    } | null>(null);
    const [editDescription, setEditDescription] = useState('');
    const [editAmount, setEditAmount] = useState('');
    const [editCounterAccountId, setEditCounterAccountId] = useState('');
    const [editCorrectionNote, setEditCorrectionNote] = useState('');

    const openCancelModal = (id: string, description: string) => {
        setCancelModalEntry({ id, description });
        setCancelReason('');
    };

    const handleConfirmCancel = (e: React.FormEvent) => {
        e.preventDefault();
        if (!cancelModalEntry) return;
        if (!cancelReason.trim()) {
            alert("Harap masukkan catatan/alasan pembatalan.");
            return;
        }
        dispatch({
            type: 'finance/cancelJournalEntry',
            payload: {
                entryId: cancelModalEntry.id,
                cancelNote: cancelReason
            }
        });
        setCancelModalEntry(null);
    };

    const openEditModal = (entry: typeof statementData.rows[0]) => {
        const counterLine = entry.lines.find(l => l.accountId !== account?.id);
        const selfLine = entry.lines.find(l => l.accountId === account?.id);
        
        const entryType = selfLine?.type === 'debit' ? 'debit' : 'credit';

        setEditModalEntry({
            id: entry.id,
            description: entry.description,
            amount: selfLine?.amount || 0,
            type: entryType,
            counterAccountId: counterLine?.accountId || ''
        });
        setEditDescription(entry.description);
        setEditAmount((selfLine?.amount || 0).toString());
        setEditCounterAccountId(counterLine?.accountId || '');
        setEditCorrectionNote('');
    };

    const handleConfirmEdit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!editModalEntry || !account) return;
        const numAmount = parseFloat(editAmount);
        if (!numAmount || !editCounterAccountId || !editCorrectionNote.trim()) {
            alert("Harap lengkapi semua field dan beri Catatan Perbaikan.");
            return;
        }

        const lines = editModalEntry.type === 'debit' ? [
            { accountId: account.id, type: 'debit' as const, amount: numAmount },
            { accountId: editCounterAccountId, type: 'credit' as const, amount: numAmount }
        ] : [
            { accountId: account.id, type: 'credit' as const, amount: numAmount },
            { accountId: editCounterAccountId, type: 'debit' as const, amount: numAmount }
        ];

        dispatch({
            type: 'finance/updateJournalEntry',
            payload: {
                entryId: editModalEntry.id,
                description: editDescription,
                lines,
                correctionNote: editCorrectionNote
            }
        });
        setEditModalEntry(null);
    };

    return (
        <div className="w-full h-full flex flex-col p-3 md:p-5 space-y-3 overflow-y-auto">
            {/* Print CSS Stylesheet */}
            <style>{`
                @media print {
                    @page {
                        size: A4 portrait;
                        margin: 15mm 10mm 15mm 10mm;
                    }
                    body {
                        background: white !important;
                        color: black !important;
                        -webkit-print-color-adjust: exact !important;
                        print-color-adjust: exact !important;
                    }
                    body * {
                        visibility: hidden;
                    }
                    #printable-statement, #printable-statement * {
                        visibility: visible;
                    }
                    #printable-statement {
                        position: absolute;
                        left: 0;
                        top: 0;
                        width: 100%;
                        padding: 0;
                        margin: 0;
                        background: white !important;
                        color: black !important;
                        box-shadow: none !important;
                        border: none !important;
                    }
                    .no-print {
                        display: none !important;
                    }
                    /* Ensure tables, backgrounds and borders print cleanly */
                    table {
                        width: 100% !important;
                        border-collapse: collapse !important;
                    }
                    th, td {
                        border-bottom: 1px solid #e2e8f0 !important;
                        padding: 6px 8px !important;
                        font-size: 11px !important;
                    }
                    th {
                        background-color: #f8fafc !important;
                        color: #1e293b !important;
                        font-weight: 800 !important;
                    }
                    /* Hide gradient banner background for crisp black & white printing */
                    .bg-gradient-to-r {
                        background: #f1f5f9 !important;
                        color: #0f172a !important;
                        border: 1px solid #cbd5e1 !important;
                    }
                    .bg-gradient-to-r * {
                        color: #0f172a !important;
                    }
                    .bg-gradient-to-r strong {
                        color: #047857 !important;
                    }
                    .shadow-md, .shadow-2xs, .shadow-lg {
                        box-shadow: none !important;
                    }
                }
            `}</style>

            {/* Header Controls (Hidden during print) */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-2 shrink-0 no-print">
                <div className="flex items-center gap-2.5">
                    <Button 
                        variant="secondary" 
                        onClick={() => dispatch({ type: 'ui/setPage', payload: Page.CashAccountList })}
                        className="text-xs py-1.5 px-3"
                    >
                        ← Kembali
                    </Button>
                    <h1 className="text-base font-black text-slate-900 dark:text-white leading-tight">
                        Rekening Koran & Mutasi Kas
                    </h1>
                </div>

                <div className="flex flex-wrap items-center gap-1.5 w-full md:w-auto">
                    <button
                        type="button"
                        onClick={() => openTxModal('income')}
                        className="flex items-center gap-1 text-[11px] font-bold px-2.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white shadow-2xs transition-all cursor-pointer"
                    >
                        <ArrowDownLeft className="w-3.5 h-3.5" />
                        Pemasukan
                    </button>
                    <button
                        type="button"
                        onClick={() => openTxModal('expense')}
                        className="flex items-center gap-1 text-[11px] font-bold px-2.5 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-700 text-white shadow-2xs transition-all cursor-pointer"
                    >
                        <ArrowUpRight className="w-3.5 h-3.5" />
                        Pengeluaran
                    </button>
                    <button
                        type="button"
                        onClick={() => openTxModal('transfer')}
                        className="flex items-center gap-1 text-[11px] font-bold px-2.5 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white shadow-2xs transition-all cursor-pointer"
                    >
                        <ArrowRightLeft className="w-3.5 h-3.5" />
                        Transfer Kas
                    </button>
                    <Button onClick={() => window.print()} className="gap-1.5 text-[11px] py-1.5 px-3 bg-slate-800 hover:bg-slate-900 text-white shadow-2xs">
                        <Printer className="w-3.5 h-3.5" />
                        Cetak Rekening Koran
                    </Button>
                </div>
            </div>

            {/* Main Printable Document Container */}
            <div id="printable-statement" className="bg-white dark:bg-zinc-900 rounded-2xl border border-slate-200/80 dark:border-zinc-800 shadow-2xs p-4 md:p-5 space-y-4 text-slate-900 dark:text-white">
                
                {/* Print-Only Official Letterhead Header */}
                <div className="hidden print:flex justify-between items-start border-b border-slate-200 dark:border-zinc-800 pb-3 mb-2">
                    <div>
                        <h2 className="text-xl font-black uppercase text-blue-900 dark:text-blue-400">{companyInfo.name || 'POSNESIA POS'}</h2>
                        <p className="text-[11px] text-slate-500">{companyInfo.address || 'Jl. Raya Utama PosNesia No. 88'}</p>
                        <p className="text-[11px] text-slate-500">Telp: {companyInfo.phone || '-'} • Email: {companyInfo.email || '-'}</p>
                    </div>
                    <div className="text-right">
                        <h3 className="text-base font-black text-slate-800 dark:text-white uppercase tracking-wider">REKENING KORAN</h3>
                        <p className="text-[11px] font-mono text-slate-500">Periode: {startDate} s/d {endDate}</p>
                        <p className="text-[11px] font-mono text-slate-500">Tgl Cetak: {new Date().toLocaleDateString('id-ID')}</p>
                    </div>
                </div>

                {/* Clean ERP Style 2-Column Statement Header */}
                <div className="bg-slate-50/80 dark:bg-zinc-800/50 p-4 rounded-xl border border-slate-200/80 dark:border-zinc-700/80 space-y-3">
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 border-b border-slate-200/80 dark:border-zinc-700 pb-2.5">
                        <div>
                            <span className="text-[10px] font-black uppercase tracking-wider text-blue-600 dark:text-blue-400 block">Laporan Mutasi Rekening</span>
                            <h2 className="text-lg font-black text-slate-900 dark:text-white leading-tight flex items-center gap-2">
                                {account?.name || 'Kasir'} <span className="text-xs font-semibold text-slate-500 font-mono">({account?.cashAccountType || 'Tunai'})</span>
                            </h2>
                        </div>
                        
                        {/* Top Right: Period Filter & Account Code */}
                        <div className="flex flex-wrap items-center gap-3">
                            <div className="flex flex-wrap items-center gap-1.5 bg-white dark:bg-zinc-900 px-2.5 py-1 rounded-xl border border-slate-200 dark:border-zinc-700 shadow-2xs">
                                <span className="font-mono font-bold text-slate-800 dark:text-zinc-200 text-xs px-1">{startDate} s/d {endDate}</span>
                                <div className="no-print flex flex-wrap items-center gap-1 border-l border-slate-200 dark:border-zinc-700 pl-1.5">
                                    <button
                                        type="button"
                                        onClick={() => setPeriodFilter('today')}
                                        className={`px-2 py-0.5 rounded-lg text-[10px] font-extrabold cursor-pointer transition-all ${periodFilter === 'today' ? 'bg-blue-600 text-white shadow-2xs' : 'bg-slate-100 hover:bg-slate-200 text-slate-700 dark:bg-zinc-800 dark:text-zinc-300'}`}
                                    >
                                        Hari Ini
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setPeriodFilter('7days')}
                                        className={`px-2 py-0.5 rounded-lg text-[10px] font-extrabold cursor-pointer transition-all ${periodFilter === '7days' ? 'bg-blue-600 text-white shadow-2xs' : 'bg-slate-100 hover:bg-slate-200 text-slate-700 dark:bg-zinc-800 dark:text-zinc-300'}`}
                                    >
                                        Seminggu
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setPeriodFilter('30days')}
                                        className={`px-2 py-0.5 rounded-lg text-[10px] font-extrabold cursor-pointer transition-all ${periodFilter === '30days' ? 'bg-blue-600 text-white shadow-2xs' : 'bg-slate-100 hover:bg-slate-200 text-slate-700 dark:bg-zinc-800 dark:text-zinc-300'}`}
                                    >
                                        Sebulan
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setPeriodFilter('1year')}
                                        className={`px-2 py-0.5 rounded-lg text-[10px] font-extrabold cursor-pointer transition-all ${periodFilter === '1year' ? 'bg-blue-600 text-white shadow-2xs' : 'bg-slate-100 hover:bg-slate-200 text-slate-700 dark:bg-zinc-800 dark:text-zinc-300'}`}
                                    >
                                        Setahun
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setPeriodFilter('custom')}
                                        className={`px-2 py-0.5 rounded-lg text-[10px] font-extrabold cursor-pointer transition-all ${periodFilter === 'custom' ? 'bg-blue-600 text-white shadow-2xs' : 'bg-slate-100 hover:bg-slate-200 text-slate-700 dark:bg-zinc-800 dark:text-zinc-300'}`}
                                    >
                                        Custom
                                    </button>
                                </div>
                            </div>
                            <div className="text-right">
                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Kode Akun</span>
                                <span className="font-mono text-sm font-black text-slate-700 dark:text-zinc-300">#{account?.id || '1010'}</span>
                            </div>
                        </div>
                    </div>

                    {periodFilter === 'custom' && (
                        <div className="grid grid-cols-2 gap-3 p-2.5 bg-white dark:bg-zinc-900 rounded-xl border border-slate-200 dark:border-zinc-700 no-print">
                            <div>
                                <Label className="text-[10px] font-bold text-slate-500">Tanggal Mulai</Label>
                                <Input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className="text-xs py-1 font-mono" />
                            </div>
                            <div>
                                <Label className="text-[10px] font-bold text-slate-500">Tanggal Selesai</Label>
                                <Input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} className="text-xs py-1 font-mono" />
                            </div>
                        </div>
                    )}

                    {/* Clean 2-Column Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs">
                        {/* Left Column: Account Info Specs */}
                        <div className="space-y-2 md:border-r border-slate-200/80 dark:border-zinc-700/80 md:pr-6">
                            <div className="flex justify-between items-center">
                                <span className="text-slate-500 font-medium w-40">Nama Dompet / Kas</span>
                                <span className="text-slate-400 mr-2">:</span>
                                <span className="font-bold text-slate-900 dark:text-white flex-1">{account?.name}</span>
                            </div>

                            <div className="flex justify-between items-center">
                                <span className="text-slate-500 font-medium w-40">Kategori / Tipe Akun</span>
                                <span className="text-slate-400 mr-2">:</span>
                                <span className="font-mono font-semibold text-slate-800 dark:text-zinc-200 flex-1">{account?.cashAccountType || 'Tunai'}</span>
                            </div>

                            <div className="flex justify-between items-center">
                                <span className="text-slate-500 font-medium w-40">Tanggal Cetak</span>
                                <span className="text-slate-400 mr-2">:</span>
                                <span className="font-mono font-semibold text-slate-800 dark:text-zinc-200 flex-1">{new Date().toLocaleDateString('id-ID')}</span>
                            </div>
                        </div>

                        {/* Right Column: Key Totals */}
                        <div className="space-y-2">
                            <div className="flex justify-between items-center">
                                <span className="text-slate-500 font-medium w-44">Total Debit (Pemasukan)</span>
                                <span className="text-slate-400 mr-2">:</span>
                                <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400 text-xs flex-1 text-right">
                                    +Rp{statementData.totalDebit.toLocaleString('id-ID')}
                                </span>
                            </div>

                            <div className="flex justify-between items-center">
                                <span className="text-slate-500 font-medium w-44">Total Kredit (Pengeluaran)</span>
                                <span className="text-slate-400 mr-2">:</span>
                                <span className="font-mono font-bold text-rose-600 dark:text-rose-400 text-xs flex-1 text-right">
                                    -Rp{statementData.totalCredit.toLocaleString('id-ID')}
                                </span>
                            </div>

                            <div className="flex justify-between items-center pt-2 border-t border-slate-200/80 dark:border-zinc-700/80">
                                <span className="text-slate-900 dark:text-white font-extrabold text-xs w-44">Saldo Kas Saat Ini</span>
                                <span className="text-slate-400 mr-2">:</span>
                                <strong className="font-mono font-black text-blue-600 dark:text-blue-400 text-base flex-1 text-right">
                                    Rp{statementData.activeAccountBalance.toLocaleString('id-ID')}
                                </strong>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Statement Journal Table with CRUC Audit Trail */}
                <div className="border border-slate-200 dark:border-zinc-800 rounded-2xl overflow-hidden shadow-2xs">
                    <Table>
                        <Thead>
                            <Tr className="bg-slate-50 dark:bg-zinc-800/80 border-b border-slate-200 dark:border-zinc-700">
                                <Th className="font-black text-slate-700 dark:text-zinc-200">WAKTU</Th>
                                <Th className="font-black text-slate-700 dark:text-zinc-200">DESKRIPSI MUTASI</Th>
                                <Th className="font-black text-slate-700 dark:text-zinc-200">REFERENSI / CATATAN AUDIT</Th>
                                <Th className="text-right font-mono font-black text-slate-700 dark:text-zinc-200">PEMASUKAN (+)</Th>
                                <Th className="text-right font-mono font-black text-slate-700 dark:text-zinc-200">PENGELUARAN (-)</Th>
                                <Th className="text-right font-mono font-black text-slate-700 dark:text-zinc-200">SALDO RUNNING</Th>
                                <Th className="text-center font-black text-slate-700 dark:text-zinc-200 no-print">AKSI</Th>
                            </Tr>
                        </Thead>
                        <Tbody>
                            {statementData.rows.length === 0 ? (
                                <Tr>
                                    <Td colSpan={7} className="text-center py-12 text-slate-400">
                                        Tidak ada data mutasi transaksi pada periode ini.
                                    </Td>
                                </Tr>
                            ) : (
                                statementData.rows.map((row, idx) => {
                                    const isCancelled = row.status === 'cancelled';
                                    const isCorrected = row.status === 'corrected';
                                    const isInactive = isCancelled || isCorrected;

                                    return (
                                        <Tr 
                                            key={idx} 
                                            className={`border-b border-slate-100 dark:border-zinc-800 transition-all ${
                                                isInactive 
                                                    ? 'opacity-40 line-through bg-slate-100/80 dark:bg-zinc-900/80 select-none' 
                                                    : 'hover:bg-slate-50/80 dark:hover:bg-zinc-800/40'
                                            }`}
                                        >
                                            <Td className="text-slate-600 dark:text-slate-400 font-mono text-xs whitespace-nowrap">
                                                {row.date.toLocaleString('id-ID')}
                                                {isCancelled && (
                                                    <span className="no-underline block text-[10px] text-rose-600 dark:text-rose-400 font-bold uppercase tracking-wider mt-0.5">
                                                        [DIBATALKAN]
                                                    </span>
                                                )}
                                                {isCorrected && (
                                                    <span className="no-underline block text-[10px] text-amber-600 dark:text-amber-400 font-bold uppercase tracking-wider mt-0.5">
                                                        [DIPERBAIKI]
                                                    </span>
                                                )}
                                            </Td>

                                            <Td className="font-bold text-slate-900 dark:text-white">
                                                {row.description}
                                                {row.originalEntryId && (
                                                    <span className="no-underline block text-[10px] text-blue-600 dark:text-blue-400 font-mono mt-0.5">
                                                        ↳ Perbaikan dari Transaksi #{row.originalEntryId}
                                                    </span>
                                                )}
                                            </Td>

                                            <Td className="text-slate-500 italic text-xs">
                                                <div className="no-underline">
                                                    <span>{row.reference || '-'}</span>
                                                    {row.correctionNote && (
                                                        <p className="text-[11px] text-amber-700 dark:text-amber-300 font-semibold mt-0.5 not-italic">
                                                            📝 Catatan: {row.correctionNote}
                                                        </p>
                                                    )}
                                                </div>
                                            </Td>

                                            <Td className="text-right font-mono font-bold text-emerald-600 dark:text-emerald-400">
                                                {row.debit > 0 ? `+Rp${row.debit.toLocaleString('id-ID')}` : '-'}
                                            </Td>
                                            <Td className="text-right font-mono font-bold text-rose-600 dark:text-rose-400">
                                                {row.credit > 0 ? `-Rp${row.credit.toLocaleString('id-ID')}` : '-'}
                                            </Td>

                                            <Td className="text-right font-mono font-bold text-slate-900 dark:text-white">
                                                {isInactive ? '-' : `Rp${row.runningBalance.toLocaleString('id-ID')}`}
                                            </Td>

                                            <Td className="text-center no-print">
                                                {!isInactive ? (
                                                    <div className="flex items-center justify-center gap-1.5">
                                                        <Button
                                                            onClick={() => openEditModal(row)}
                                                            variant="secondary"
                                                            title="Perbaiki Transaksi"
                                                            className="p-1.5 shadow-2xs text-amber-700 hover:text-amber-800 bg-amber-50 hover:bg-amber-100 dark:bg-amber-950/40 dark:text-amber-300 rounded-lg"
                                                        >
                                                            <Edit2 className="w-3.5 h-3.5" />
                                                        </Button>
                                                        <Button
                                                            onClick={() => openCancelModal(row.id, row.description)}
                                                            variant="secondary"
                                                            title="Batalkan Transaksi"
                                                            className="p-1.5 shadow-2xs text-rose-600 hover:text-rose-700 bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/40 dark:text-rose-300 rounded-lg"
                                                        >
                                                            <Trash2 className="w-3.5 h-3.5" />
                                                        </Button>
                                                    </div>
                                                ) : (
                                                    <span className="no-underline text-[10px] text-slate-400 font-bold uppercase">
                                                        -
                                                    </span>
                                                )}
                                            </Td>
                                        </Tr>
                                    );
                                })
                            )}
                        </Tbody>
                    </Table>
                </div>

                {/* Printable Signatures Footer (Visible Only When Printing) */}
                <div className="hidden print:grid pt-8 grid-cols-2 text-center text-xs border-t border-slate-200 mt-6">
                    <div>
                        <p className="text-slate-500 mb-12">Dibuat Oleh (Kasir / Admin),</p>
                        <p className="font-bold text-slate-900 dark:text-white">( ______________________ )</p>
                    </div>
                    <div>
                        <p className="text-slate-500 mb-12">Disetujui Oleh (Finance / Owner),</p>
                        <p className="font-bold text-slate-900 dark:text-white">( ______________________ )</p>
                    </div>
                </div>
            </div>

            {/* Modal Cancel Transaksi */}
            {cancelModalEntry && (
                <Modal
                    isOpen={!!cancelModalEntry}
                    onClose={() => setCancelModalEntry(null)}
                    title="🔴 Batalkan Transaksi Kas"
                    maxWidth="max-w-md"
                    footer={
                        <div className="flex justify-end gap-2">
                            <button type="button" onClick={() => setCancelModalEntry(null)} className="px-4 py-2 rounded-md bg-slate-200 dark:bg-zinc-700 text-xs font-bold">
                                Batal
                            </button>
                            <Button onClick={handleConfirmCancel} className="bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold">
                                Konfirmasi Pembatalan
                            </Button>
                        </div>
                    }
                >
                    <form onSubmit={handleConfirmCancel} className="space-y-4">
                        <div className="p-3 bg-rose-50 dark:bg-rose-950/40 rounded-xl border border-rose-200 text-xs text-rose-800 dark:text-rose-300">
                            ⚠️ Transaksi <strong>"{cancelModalEntry.description}"</strong> akan dibatalkan & saldo kas dikembalikan secara otomatis. Transaksi tidak akan dihapus melainkan ditampilkan pudar.
                        </div>
                        <div>
                            <Label htmlFor="cancel_reason">Catatan / Alasan Pembatalan*</Label>
                            <Input
                                id="cancel_reason"
                                type="text"
                                value={cancelReason}
                                onChange={e => setCancelReason(e.target.value)}
                                placeholder="Contoh: Salah catat nominal, transaksi ganda..."
                                required
                            />
                        </div>
                    </form>
                </Modal>
            )}

            {/* Modal Edit / Perbaiki Transaksi */}
            {editModalEntry && (
                <Modal
                    isOpen={!!editModalEntry}
                    onClose={() => setEditModalEntry(null)}
                    title="📝 Perbaiki Kesalahan Transaksi Kas"
                    maxWidth="max-w-md"
                    footer={
                        <div className="flex justify-end gap-2">
                            <button type="button" onClick={() => setEditModalEntry(null)} className="px-4 py-2 rounded-md bg-slate-200 dark:bg-zinc-700 text-xs font-bold">
                                Batal
                            </button>
                            <Button onClick={handleConfirmEdit} className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold">
                                Simpan Perbaikan
                            </Button>
                        </div>
                    }
                >
                    <form onSubmit={handleConfirmEdit} className="space-y-4">
                        <div className="p-3 bg-amber-50 dark:bg-amber-950/40 rounded-xl border border-amber-200 text-xs text-amber-800 dark:text-amber-300">
                            ℹ️ Transaksi lama akan ditandai pudar <strong>[DIPERBAIKI]</strong>, dan transaksi perbaikan baru akan dibuat dengan merevisi saldo kas Anda.
                        </div>

                        <div>
                            <Label htmlFor="edit_desc">Deskripsi Transaksi Baru</Label>
                            <Input
                                id="edit_desc"
                                type="text"
                                value={editDescription}
                                onChange={e => setEditDescription(e.target.value)}
                                required
                            />
                        </div>

                        <div>
                            <Label htmlFor="edit_amount">Jumlah Nominal Baru (Rp)</Label>
                            <Input
                                id="edit_amount"
                                type="number"
                                value={editAmount}
                                onChange={e => setEditAmount(e.target.value)}
                                required
                            />
                        </div>

                        <div>
                            <Label htmlFor="edit_counter">Kategori / Akun Kontra</Label>
                            <Select
                                id="edit_counter"
                                value={editCounterAccountId}
                                onChange={e => setEditCounterAccountId(e.target.value)}
                                required
                            >
                                <option value="">-- Pilih Kategori --</option>
                                {accounts.filter(a => a.id !== account?.id).map(acc => (
                                    <option key={acc.id} value={acc.id}>{acc.name} ({acc.type})</option>
                                ))}
                            </Select>
                        </div>

                        <div>
                            <Label htmlFor="edit_note">Catatan Alasan Perbaikan*</Label>
                            <Input
                                id="edit_note"
                                type="text"
                                value={editCorrectionNote}
                                onChange={e => setEditCorrectionNote(e.target.value)}
                                placeholder="Contoh: Koreksi nominal dari Rp10.000 jadi Rp100.000"
                                required
                            />
                        </div>
                    </form>
                </Modal>
            )}

            {/* Unified Transaction Modal inside Account Statement */}
            <UnifiedCashTransactionModal
                isOpen={isTxModalOpen}
                onClose={() => setIsTxModalOpen(false)}
                initialMode={txModalMode}
                defaultAccountId={selectedAccountId}
            />
        </div>
    );
};

export const CashAccountListPage: React.FC = () => {
    const { state, dispatch } = useAppContext();
    const [isAddModalOpen, setAddModalOpen] = useState(false);
    const [isEditModalOpen, setEditModalOpen] = useState(false);
    const [editingAccount, setEditingAccount] = useState<Account | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [typeFilter, setTypeFilter] = useState<'all' | Account['cashAccountType']>('all');

    // Unified Transaction Modal state
    const [isTxModalOpen, setIsTxModalOpen] = useState(false);
    const [txModalInitialMode, setTxModalInitialMode] = useState<'income' | 'expense' | 'transfer'>('income');

    // Bank Statement Modal State
    const [selectedAccountForStatement, setSelectedAccountForStatement] = useState<Account | null>(null);

    const openTxModal = (mode: 'income' | 'expense' | 'transfer') => {
        setTxModalInitialMode(mode);
        setIsTxModalOpen(true);
    };

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
    
    const getActiveAccountBalance = (account: Account) => {
        return account.balance || 0;
    };

    const totalCashBalance = useMemo(() => {
        return state.accounts
            .filter(a => a.isCashAccount)
            .reduce((sum, a) => sum + (a.balance || 0), 0);
    }, [state.accounts]);

    return (
        <div className="w-full h-full flex flex-col p-4 md:p-6 space-y-3 overflow-hidden">
            {/* Single Compact 1-Row Top Header Bar */}
            <div className="flex items-center justify-between gap-2 shrink-0 bg-white dark:bg-zinc-900 p-2.5 px-3.5 rounded-xl border border-slate-200/80 dark:border-zinc-800 shadow-2xs">
                {/* Left: Title & Total Kas Pill in 1 Line */}
                <div className="flex items-center gap-2.5 min-w-0">
                    <div className="w-7 h-7 rounded-lg bg-blue-600 text-white flex items-center justify-center shrink-0 shadow-2xs font-bold">
                        <Wallet className="w-3.5 h-3.5" />
                    </div>
                    <h1 className="text-sm font-black text-slate-900 dark:text-white truncate">
                        Data Rekening Kas & Dompet
                    </h1>
                    <div className="hidden sm:flex items-center gap-1.5 pl-2 border-l border-slate-200 dark:border-zinc-800 text-xs">
                        <span className="text-slate-500 text-[11px]">Total Kas:</span>
                        <strong className="text-emerald-600 dark:text-emerald-400 font-mono font-bold">
                            Rp{totalCashBalance.toLocaleString('id-ID')}
                        </strong>
                    </div>
                </div>

                {/* Right: Action Buttons Group (Hidden on Mobile, Visible on Desktop) */}
                <div className="hidden md:flex items-center gap-1.5 shrink-0">
                    <button
                        type="button"
                        onClick={() => openTxModal('income')}
                        className="flex items-center gap-1 text-[11px] font-bold px-2.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white shadow-2xs transition-all cursor-pointer"
                    >
                        <ArrowDownLeft className="w-3.5 h-3.5" />
                        Pemasukan
                    </button>
                    <button
                        type="button"
                        onClick={() => openTxModal('expense')}
                        className="flex items-center gap-1 text-[11px] font-bold px-2.5 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-700 text-white shadow-2xs transition-all cursor-pointer"
                    >
                        <ArrowUpRight className="w-3.5 h-3.5" />
                        Pengeluaran
                    </button>
                    <button
                        type="button"
                        onClick={() => openTxModal('transfer')}
                        className="flex items-center gap-1 text-[11px] font-bold px-2.5 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white shadow-2xs transition-all cursor-pointer"
                    >
                        <ArrowRightLeft className="w-3.5 h-3.5" />
                        Transfer Kas
                    </button>
                    <button
                        type="button"
                        onClick={() => setAddModalOpen(true)}
                        className="flex items-center gap-1 text-[11px] font-bold px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white shadow-2xs transition-all cursor-pointer"
                    >
                        <Plus className="w-3.5 h-3.5" />
                        Tambah Pos Kas
                    </button>
                </div>
            </div>

            {/* Main Content Card with Table */}
            <div className="flex-1 min-h-0 bg-white dark:bg-zinc-900 rounded-2xl border border-slate-200/80 dark:border-zinc-800 shadow-2xs overflow-hidden flex flex-col p-4">
                {/* Search & Filter Bar */}
                <div className="flex flex-col sm:flex-row items-center justify-between gap-3 mb-4 shrink-0">
                    <div className="relative w-full sm:w-80">
                        <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                        <Input
                            type="text"
                            placeholder="Cari nama atau nomor akun..."
                            value={searchTerm}
                            onChange={e => setSearchTerm(e.target.value)}
                            className="pl-9 text-xs"
                        />
                    </div>

                    <div className="flex items-center gap-2 w-full sm:w-auto">
                        <select
                            value={typeFilter}
                            onChange={e => setTypeFilter(e.target.value as any)}
                            className="w-full sm:w-auto rounded-lg border border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-xs px-3 py-1.5 font-medium outline-none"
                        >
                            <option value="all">Semua Kategori</option>
                            <option value="Tunai">Tunai</option>
                            <option value="Rekening">Rekening Bank</option>
                            <option value="Brankas">Brankas</option>
                        </select>
                    </div>
                </div>

                {/* Table List */}
                <div className="flex-1 overflow-y-auto border border-slate-200/80 dark:border-zinc-800 rounded-xl">
                    <Table>
                        <Thead>
                            <Tr className="bg-slate-50 dark:bg-zinc-800/80 border-b border-slate-200 dark:border-zinc-700">
                                <Th>NO. AKUN</Th>
                                <Th>NAMA REKENING KAS / DOMPET</Th>
                                <Th className="text-center">Kategori</Th>
                                <Th className="text-right">Saldo Saat Ini</Th>
                                <Th className="text-right">Aksi</Th>
                            </Tr>
                        </Thead>
                        <Tbody>
                            {filteredCashAccounts.length === 0 ? (
                                <Tr>
                                    <Td colSpan={5} className="text-center py-12 text-slate-400">
                                        Tidak ada akun kas yang cocok dengan pencarian.
                                    </Td>
                                </Tr>
                            ) : (
                                filteredCashAccounts.map((account) => (
                                    <Tr 
                                        key={account.id} 
                                        className="hover:bg-blue-50/50 dark:hover:bg-zinc-800/70 cursor-pointer transition-colors"
                                        onClick={() => {
                                            dispatch({ type: 'finance/setSelectedAccountId', payload: account.id });
                                            dispatch({ type: 'ui/setPage', payload: Page.AccountStatement });
                                        }}
                                    >
                                        <Td className="font-mono text-xs font-bold text-slate-600 dark:text-zinc-400">{account.id}</Td>
                                        <Td className="font-bold text-slate-900 dark:text-white">
                                            <div className="flex items-center gap-2">
                                                <span className="w-7 h-7 rounded-lg bg-slate-100 dark:bg-zinc-800 flex items-center justify-center text-sm shrink-0">
                                                    {account.cashAccountType === 'Rekening' ? '🏦' : account.cashAccountType === 'Brankas' ? '🔐' : '🪙'}
                                                </span>
                                                <span className="hover:text-blue-600 underline-offset-2 hover:underline">{account.name}</span>
                                            </div>
                                        </Td>
                                        <Td className="text-center">
                                            <Badge variant="primary">{account.cashAccountType || 'N/A'}</Badge>
                                        </Td>
                                        <Td className="text-right font-mono font-bold text-base text-emerald-600 dark:text-emerald-400">
                                            Rp{(account.balance || 0).toLocaleString('id-ID')}
                                        </Td>
                                        <Td className="text-right" onClick={e => e.stopPropagation()}>
                                            <div className="flex items-center justify-end gap-1.5">
                                                <Button 
                                                    onClick={() => {
                                                        dispatch({ type: 'finance/setSelectedAccountId', payload: account.id });
                                                        dispatch({ type: 'ui/setPage', payload: Page.AccountStatement });
                                                    }}
                                                    variant="secondary"
                                                    className="text-[11px] py-1 px-2.5 shadow-2xs gap-1 text-blue-600"
                                                >
                                                    <FileText className="w-3.5 h-3.5" />
                                                    Rekening Koran
                                                </Button>
                                                <Button 
                                                    onClick={() => openEditModal(account)}
                                                    variant="secondary"
                                                    className="text-[11px] py-1 px-2.5 shadow-2xs gap-1"
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
            </div>

            <AddCashAccountModal isOpen={isAddModalOpen} onClose={() => setAddModalOpen(false)} onSave={handleSave} accounts={state.accounts}/>
            <UpdateCashAccountModal isOpen={isEditModalOpen} onClose={() => setEditModalOpen(false)} onSave={handleUpdate} account={editingAccount}/>
            <UnifiedCashTransactionModal isOpen={isTxModalOpen} onClose={() => setIsTxModalOpen(false)} initialMode={txModalInitialMode} />
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

// --- PAGE 7: Payment Methods Management Page (/pos/keuangan/metode-bayar) ---
export const PaymentMethodsPage: React.FC = () => {
    const { state, dispatch } = useAppContext();
    const { paymentMethods = [], accounts = [] } = state || {};

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingMethod, setEditingMethod] = useState<PaymentMethod | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [typeFilter, setTypeFilter] = useState<string>('All');

    // Form fields
    const [name, setName] = useState('Tunai - Kasir');
    const [type, setType] = useState<PaymentMethod['type']>('cash');
    const [linkedAccountId, setLinkedAccountId] = useState('');
    const [adminFeeType, setAdminFeeType] = useState<'fixed' | 'percentage'>('percentage');
    const [adminFeeValue, setAdminFeeValue] = useState<string>('0');
    const [qrisImageUrl, setQrisImageUrl] = useState<string>('');

    const openCreateModal = () => {
        setEditingMethod(null);
        setName('Tunai - Kasir');
        setType('cash');
        setLinkedAccountId('');
        setAdminFeeType('percentage');
        setAdminFeeValue('0');
        setQrisImageUrl('');
        setIsModalOpen(true);
    };

    const openEditModal = (method: PaymentMethod) => {
        setEditingMethod(method);
        setName(method.name);
        setType(method.type);
        setLinkedAccountId(method.linkedAccountId || '');
        setAdminFeeType(method.adminFeeType || 'percentage');
        setAdminFeeValue(method.adminFeeValue !== undefined ? method.adminFeeValue.toString() : '0');
        setQrisImageUrl(method.qrisImageUrl || '');
        setIsModalOpen(true);
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!name.trim()) {
            alert("Harap isi nama metode pembayaran.");
            return;
        }

        const feeVal = type === 'cash' ? 0 : Math.max(0, parseFloat(adminFeeValue) || 0);

        if (editingMethod) {
            dispatch({
                type: 'settings/updatePaymentMethod',
                payload: {
                    ...editingMethod,
                    name,
                    type,
                    linkedAccountId: linkedAccountId || undefined,
                    adminFeeType: type === 'cash' ? undefined : adminFeeType,
                    adminFeeValue: feeVal,
                    qrisImageUrl: type === 'qris' ? qrisImageUrl : undefined
                }
            });
        } else {
            dispatch({
                type: 'settings/addPaymentMethod',
                payload: {
                    name,
                    type,
                    linkedAccountId: linkedAccountId || undefined,
                    adminFeeType: type === 'cash' ? undefined : adminFeeType,
                    adminFeeValue: feeVal,
                    qrisImageUrl: type === 'qris' ? qrisImageUrl : undefined
                }
            });
        }
        setIsModalOpen(false);
    };

    const handleDelete = (id: string, methodName: string) => {
        if (window.confirm(`Hapus metode pembayaran "${methodName}"?`)) {
            dispatch({ type: 'settings/deletePaymentMethod', payload: id });
        }
    };

    const filteredMethods = useMemo(() => {
        return paymentMethods.filter(pm => {
            const matchesSearch = (pm.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                                  (pm.id || '').toLowerCase().includes(searchTerm.toLowerCase());
            const matchesType = typeFilter === 'All' || pm.type === typeFilter;
            return matchesSearch && matchesType;
        });
    }, [paymentMethods, searchTerm, typeFilter]);

    // Metrics
    const totalCount = paymentMethods.length;
    const cashCount = paymentMethods.filter(pm => pm.type === 'cash').length;
    const digitalCount = paymentMethods.filter(pm => pm.type === 'ewallet' || pm.type === 'bank_transfer' || pm.type === 'qris' || pm.type === 'edc' || pm.type === 'bank').length;
    const otherCount = paymentMethods.filter(pm => pm.type === 'other' || pm.type === 'accounts_receivable').length;

    const getTypeBadge = (pmType: PaymentMethod['type']) => {
        switch (pmType) {
            case 'cash': return <Badge variant="success">Tunai</Badge>;
            case 'ewallet': return <Badge variant="info">E-Wallet</Badge>;
            case 'bank_transfer': return <Badge variant="info">Transfer Bank</Badge>;
            case 'qris': return <Badge variant="success">QRIS</Badge>;
            case 'edc': return <Badge variant="warning">EDC</Badge>;
            case 'bank': return <Badge variant="info">Bank / Digital</Badge>;
            default: return <Badge variant="neutral">Lainnya</Badge>;
        }
    };

    const formatAdminFee = (pm: PaymentMethod) => {
        if (pm.type === 'cash' || !pm.adminFeeValue) return <span className="text-slate-400">Gratis (Rp0)</span>;
        if (pm.adminFeeType === 'fixed') {
            return <span className="font-bold text-amber-600 dark:text-amber-400">Rp{pm.adminFeeValue.toLocaleString('id-ID')} / transaksi</span>;
        }
        return <span className="font-bold text-indigo-600 dark:text-indigo-400">{pm.adminFeeValue}% / transaksi</span>;
    };

    return (
        <div className="w-full h-full flex flex-col p-4 md:p-6 space-y-3 overflow-hidden">
            {/* Header Bar - Row 1 */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 shrink-0">
                <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-xl bg-primary-50 dark:bg-primary-950/60 text-primary-600 dark:text-primary-400 flex items-center justify-center shrink-0">
                        <CreditCard className="w-5 h-5" />
                    </div>
                    <div>
                        <h1 className="text-lg font-black text-slate-900 dark:text-white leading-tight">
                            Pengaturan Metode Pembayaran
                        </h1>
                        <p className="text-xs text-slate-500 dark:text-zinc-400">
                            Kelola opsi penerimaan kasir (Tunai, E-Wallet, Transfer, QRIS, EDC) dan biaya admin transaksi.
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-2 self-end sm:self-center">
                    {/* Compact Stat Badges */}
                    <div className="hidden md:flex items-center gap-1.5 text-xs">
                        <div className="px-2.5 py-1 rounded-lg bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 font-medium">
                            <span className="text-[10px] text-slate-500 dark:text-slate-400 uppercase font-bold">Total:</span>
                            <span className="font-bold font-mono">{totalCount}</span>
                        </div>
                        <div className="px-2.5 py-1 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 font-medium">
                            <span className="text-[10px] uppercase font-bold">Tunai:</span>
                            <span className="font-bold font-mono">{cashCount}</span>
                        </div>
                        <div className="px-2.5 py-1 rounded-lg bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 font-medium">
                            <span className="text-[10px] uppercase font-bold">Digital / QRIS / EDC:</span>
                            <span className="font-bold font-mono">{digitalCount}</span>
                        </div>
                        <div className="px-2.5 py-1 rounded-lg bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 font-medium">
                            <span className="text-[10px] uppercase font-bold">Lainnya:</span>
                            <span className="font-bold font-mono">{otherCount}</span>
                        </div>
                    </div>

                    <Button onClick={openCreateModal} className="gap-1.5 text-xs py-2 shadow-xs shrink-0 whitespace-nowrap">
                        <Plus className="w-4 h-4" /> Tambah Metode Bayar
                    </Button>
                </div>
            </div>

            {/* Filter & Search Controls Bar - Row 2 */}
            <div className="bg-white dark:bg-zinc-900 p-2.5 rounded-xl border border-slate-200/80 dark:border-zinc-800 shadow-2xs flex flex-wrap items-center justify-between gap-2.5 shrink-0">
                <div className="flex-1 min-w-[200px]">
                    <Input
                        type="text"
                        placeholder="Cari Nama / ID Metode Pembayaran..."
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                        className="text-xs py-1.5"
                    />
                </div>

                <div className="flex items-center gap-2">
                    <Select value={typeFilter} onChange={e => setTypeFilter(e.target.value)} className="w-48 text-xs py-1.5">
                        <option value="All">Semua Tipe Metode</option>
                        <option value="cash">Tunai (Cash)</option>
                        <option value="ewallet">E-Wallet</option>
                        <option value="bank_transfer">Transfer Bank</option>
                        <option value="qris">QRIS</option>
                        <option value="edc">EDC</option>
                        <option value="other">Lainnya</option>
                    </Select>
                </div>
            </div>

            {/* Table Container */}
            <div className="flex-1 min-h-0 bg-white dark:bg-zinc-900 rounded-xl border border-slate-200/80 dark:border-zinc-800 shadow-2xs overflow-hidden flex flex-col">
                <div className="overflow-x-auto flex-1">
                    <Table>
                        <Thead>
                            <Tr>
                                <Th>ID</Th>
                                <Th>Nama Metode Pembayaran</Th>
                                <Th>Tipe Kategori</Th>
                                <Th>Biaya Admin (per Transaksi)</Th>
                                <Th>Dompet / Rekening</Th>
                                <Th className="text-right">Aksi</Th>
                            </Tr>
                        </Thead>
                        <Tbody>
                            {filteredMethods.length === 0 ? (
                                <Tr>
                                    <Td colSpan={6} className="text-center py-12 text-slate-400">
                                        Tidak ada metode pembayaran yang ditemukan.
                                    </Td>
                                </Tr>
                            ) : (
                                filteredMethods.map(pm => {
                                    const linkedAcc = accounts.find(a => a.id === pm.linkedAccountId);
                                    return (
                                        <Tr key={pm.id}>
                                            <Td className="font-mono text-xs text-slate-500 font-bold">{pm.id}</Td>
                                            <Td className="font-extrabold text-slate-900 dark:text-white text-sm">
                                                {pm.name}
                                            </Td>
                                            <Td>{getTypeBadge(pm.type)}</Td>
                                            <Td className="font-mono text-xs">
                                                {formatAdminFee(pm)}
                                            </Td>
                                            <Td className="font-mono text-xs text-slate-600 dark:text-slate-400">
                                                {linkedAcc ? `${linkedAcc.name} (${linkedAcc.code})` : '- (Belum Dihubungkan)'}
                                            </Td>
                                            <Td className="text-right">
                                                <div className="flex items-center justify-end gap-1.5">
                                                    <button
                                                        type="button"
                                                        onClick={() => openEditModal(pm)}
                                                        className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950/40 rounded-lg transition-colors cursor-pointer"
                                                        title="Edit Metode"
                                                    >
                                                        <Edit2 className="w-4 h-4" />
                                                    </button>
                                                    <button
                                                        type="button"
                                                        onClick={() => handleDelete(pm.id, pm.name)}
                                                        className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg transition-colors cursor-pointer"
                                                        title="Hapus Metode"
                                                    >
                                                        <Trash2 className="w-4 h-4" />
                                                    </button>
                                                </div>
                                            </Td>
                                        </Tr>
                                    );
                                })
                            )}
                        </Tbody>
                    </Table>
                </div>
            </div>

            {/* Form Modal */}
            <Modal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                title={editingMethod ? "Edit Metode Pembayaran" : "Tambah Metode Pembayaran Baru"}
                footer={
                    <div className="flex gap-2 justify-end">
                        <Button type="button" onClick={() => setIsModalOpen(false)} variant="secondary">Batal</Button>
                        <Button onClick={handleSubmit}>Simpan</Button>
                    </div>
                }
            >
                <form onSubmit={handleSubmit} className="space-y-4 text-xs">
                    <div>
                        <Label>Nama Metode Pembayaran*</Label>
                        <Input
                            type="text"
                            placeholder="Contoh: BCA Transfer, ShopeePay, QRIS Statis, EDC Mandiri..."
                            value={name}
                            onChange={e => setName(e.target.value)}
                            required
                        />
                    </div>

                    <div>
                        <Label>Tipe Metode Pembayaran*</Label>
                        <Select value={type} onChange={e => setType(e.target.value as any)} required>
                            <option value="cash">Tunai (Cash)</option>
                            <option value="ewallet">E-Wallet (GoPay, OVO, Dana, ShopeePay, dll)</option>
                            <option value="bank_transfer">Transfer Bank (BCA, Mandiri, BRI, BNI, dll)</option>
                            <option value="qris">QRIS (Statis / Dinamis)</option>
                            <option value="edc">EDC (Kartu Debit / Kredit)</option>
                            <option value="other">Lainnya</option>
                        </Select>
                    </div>

                    {type === 'qris' && (
                        <div className="p-3 bg-blue-50 dark:bg-blue-950/30 rounded-xl border border-blue-200/60 dark:border-blue-900/50 space-y-2">
                            <Label className="font-bold text-blue-900 dark:text-blue-300">Gambar QR Code / QRIS Statis</Label>
                            <input 
                                type="file" 
                                accept="image/*" 
                                onChange={e => {
                                    const file = e.target.files?.[0];
                                    if (file) {
                                        const reader = new FileReader();
                                        reader.onloadend = () => {
                                            setQrisImageUrl(reader.result as string);
                                        };
                                        reader.readAsDataURL(file);
                                    }
                                }}
                                className="block w-full text-xs text-slate-500 file:mr-4 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-blue-600 file:text-white hover:file:bg-blue-700 cursor-pointer"
                            />
                            {qrisImageUrl && (
                                <div className="flex items-center gap-3 pt-1">
                                    <img src={qrisImageUrl} alt="Preview QRIS" className="w-16 h-16 object-contain rounded-lg border bg-white p-1 shadow-2xs" />
                                    <span className="text-[11px] text-emerald-600 font-bold">✓ Gambar QRIS Terpasang</span>
                                </div>
                            )}
                        </div>
                    )}

                    {type !== 'cash' && (
                        <div className="p-3 bg-slate-50 dark:bg-zinc-800/60 rounded-xl border border-slate-200 dark:border-zinc-700 space-y-3">
                            <span className="font-bold text-slate-800 dark:text-zinc-200 block text-xs">
                                Form Biaya Admin Transaksi
                            </span>
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <Label>Tipe Biaya Admin</Label>
                                    <Select
                                        value={adminFeeType}
                                        onChange={e => setAdminFeeType(e.target.value as any)}
                                    >
                                        <option value="percentage">Persentase (%)</option>
                                        <option value="fixed">Nominal Tetap (Rp)</option>
                                    </Select>
                                </div>
                                <div>
                                    <Label>Nilai Biaya Admin</Label>
                                    <Input
                                        type="number"
                                        step={adminFeeType === 'percentage' ? "0.01" : "1"}
                                        min="0"
                                        placeholder={adminFeeType === 'percentage' ? "Contoh: 0.7" : "Contoh: 2500"}
                                        value={adminFeeValue}
                                        onChange={e => setAdminFeeValue(e.target.value)}
                                    />
                                </div>
                            </div>
                            <p className="text-[11px] text-slate-500">
                                {adminFeeType === 'percentage' 
                                    ? `Setiap transaksi dengan metode ini akan dikenakan biaya admin sebesar ${adminFeeValue || 0}%.`
                                    : `Setiap transaksi dengan metode ini akan dikenakan biaya admin tetap Rp${(parseFloat(adminFeeValue) || 0).toLocaleString('id-ID')}.`}
                            </p>
                        </div>
                    )}

                    <div>
                        <Label>Pilih Dompet / Rekening Kategori*</Label>
                        <Select value={linkedAccountId} onChange={e => setLinkedAccountId(e.target.value)} required>
                            <option value="">-- Pilih Dompet / Rekening Kas/Bank Terdaftar --</option>
                            {accounts.filter(a => a.isCashAccount).map(acc => (
                                <option key={acc.id} value={acc.id}>
                                    {acc.name} ({acc.code}) - Saldo: Rp{acc.balance.toLocaleString('id-ID')}
                                </option>
                            ))}
                        </Select>
                    </div>
                </form>
            </Modal>
        </div>
    );
};

// --- PAGE 8: Payment Terms Management Page (/pos/keuangan/tempo-bayar) ---
export const PaymentTermsPage: React.FC = () => {
    const { state, dispatch } = useAppContext();
    const { paymentTerms = [] } = state || {};

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingTerm, setEditingTerm] = useState<PaymentTerm | null>(null);
    const [searchTerm, setSearchTerm] = useState('');

    // Form fields
    const [name, setName] = useState('');
    const [days, setDays] = useState('0');

    const openCreateModal = () => {
        setEditingTerm(null);
        setName('');
        setDays('0');
        setIsModalOpen(true);
    };

    const openEditModal = (term: PaymentTerm) => {
        setEditingTerm(term);
        setName(term.name);
        setDays(term.days.toString());
        setIsModalOpen(true);
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!name.trim()) {
            alert("Harap isi nama syarat tempo pembayaran.");
            return;
        }

        const validDays = Math.max(0, parseInt(days) || 0);

        if (editingTerm) {
            dispatch({
                type: 'settings/updatePaymentTerm',
                payload: {
                    ...editingTerm,
                    name,
                    days: validDays
                }
            });
        } else {
            dispatch({
                type: 'settings/addPaymentTerm',
                payload: {
                    name,
                    days: validDays
                }
            });
        }
        setIsModalOpen(false);
    };

    const handleDelete = (id: string, termName: string) => {
        if (window.confirm(`Hapus syarat tempo pembayaran "${termName}"?`)) {
            dispatch({ type: 'settings/deletePaymentTerm', payload: id });
        }
    };

    const filteredTerms = useMemo(() => {
        return paymentTerms.filter(pt => {
            return (pt.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                   (pt.id || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                   pt.days.toString().includes(searchTerm);
        });
    }, [paymentTerms, searchTerm]);

    // Metrics
    const totalCount = paymentTerms.length;
    const codCount = paymentTerms.filter(pt => pt.days === 0).length;
    const shortTermCount = paymentTerms.filter(pt => pt.days > 0 && pt.days <= 14).length;
    const longTermCount = paymentTerms.filter(pt => pt.days > 14).length;

    return (
        <div className="w-full h-full flex flex-col p-4 md:p-6 space-y-3 overflow-hidden">
            {/* Header Bar - Row 1 */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 shrink-0">
                <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-xl bg-primary-50 dark:bg-primary-950/60 text-primary-600 dark:text-primary-400 flex items-center justify-center shrink-0">
                        <Clock className="w-5 h-5" />
                    </div>
                    <div>
                        <h1 className="text-lg font-black text-slate-900 dark:text-white leading-tight">
                            Pengaturan Syarat & Tempo Pembayaran
                        </h1>
                        <p className="text-xs text-slate-500 dark:text-zinc-400">
                            Kelola syarat tempo kredit jatuh tempo (Net 7, Net 30, COD, dll).
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-2 self-end sm:self-center">
                    {/* Compact Stat Badges */}
                    <div className="hidden md:flex items-center gap-1.5 text-xs">
                        <div className="px-2.5 py-1 rounded-lg bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 font-medium">
                            <span className="text-[10px] text-slate-500 dark:text-slate-400 uppercase font-bold">Total:</span>
                            <span className="font-bold font-mono">{totalCount}</span>
                        </div>
                        <div className="px-2.5 py-1 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 font-medium">
                            <span className="text-[10px] uppercase font-bold">COD (0h):</span>
                            <span className="font-bold font-mono">{codCount}</span>
                        </div>
                        <div className="px-2.5 py-1 rounded-lg bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 font-medium">
                            <span className="text-[10px] uppercase font-bold">&le;14 Hari:</span>
                            <span className="font-bold font-mono">{shortTermCount}</span>
                        </div>
                        <div className="px-2.5 py-1 rounded-lg bg-purple-50 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300 font-medium">
                            <span className="text-[10px] uppercase font-bold">&gt;14 Hari:</span>
                            <span className="font-bold font-mono">{longTermCount}</span>
                        </div>
                    </div>

                    <Button onClick={openCreateModal} className="gap-1.5 text-xs py-2 shadow-xs shrink-0 whitespace-nowrap">
                        <Plus className="w-4 h-4" /> Tambah Tempo Pembayaran
                    </Button>
                </div>
            </div>

            {/* Filter & Search Controls Bar - Row 2 */}
            <div className="bg-white dark:bg-zinc-900 p-2.5 rounded-xl border border-slate-200/80 dark:border-zinc-800 shadow-2xs flex flex-wrap items-center justify-between gap-2.5 shrink-0">
                <div className="flex-1 min-w-[200px]">
                    <Input
                        type="text"
                        placeholder="Cari Syarat Tempo (Net 30, COD...)..."
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                        className="text-xs py-1.5"
                    />
                </div>
            </div>

            {/* Table Container */}
            <div className="flex-1 min-h-0 bg-white dark:bg-zinc-900 rounded-xl border border-slate-200/80 dark:border-zinc-800 shadow-2xs overflow-hidden flex flex-col">
                <div className="overflow-x-auto flex-1">
                    <Table>
                        <Thead>
                            <Tr>
                                <Th>ID</Th>
                                <Th>Nama Syarat Tempo</Th>
                                <Th className="text-center">Durasi (Hari)</Th>
                                <Th>Status Syarat</Th>
                                <Th className="text-right">Aksi</Th>
                            </Tr>
                        </Thead>
                        <Tbody>
                            {filteredTerms.length === 0 ? (
                                <Tr>
                                    <Td colSpan={5} className="text-center py-12 text-slate-400">
                                        Tidak ada syarat tempo pembayaran yang ditemukan.
                                    </Td>
                                </Tr>
                            ) : (
                                filteredTerms.map(pt => (
                                    <Tr key={pt.id}>
                                        <Td className="font-mono text-xs text-slate-500 font-bold">{pt.id}</Td>
                                        <Td className="font-extrabold text-slate-900 dark:text-white text-sm">
                                            {pt.name}
                                        </Td>
                                        <Td className="text-center font-mono font-black text-sm text-primary-600 dark:text-primary-400">
                                            {pt.days} Hari
                                        </Td>
                                        <Td>
                                            {pt.days === 0 ? (
                                                <Badge variant="success">Bayar Langsung / COD</Badge>
                                            ) : (
                                                <Badge variant="info">Kredit / Jatuh Tempo {pt.days} Hari</Badge>
                                            )}
                                        </Td>
                                        <Td className="text-right">
                                            <div className="flex items-center justify-end gap-1.5">
                                                <button
                                                    type="button"
                                                    onClick={() => openEditModal(pt)}
                                                    className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950/40 rounded-lg transition-colors cursor-pointer"
                                                    title="Edit Tempo"
                                                >
                                                    <Edit2 className="w-4 h-4" />
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() => handleDelete(pt.id, pt.name)}
                                                    className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg transition-colors cursor-pointer"
                                                    title="Hapus Tempo"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </Td>
                                    </Tr>
                                ))
                            )}
                        </Tbody>
                    </Table>
                </div>
            </div>

            {/* Form Modal */}
            <Modal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                title={editingTerm ? "Edit Syarat Tempo Pembayaran" : "Tambah Syarat Tempo Pembayaran Baru"}
                footer={
                    <div className="flex gap-2 justify-end">
                        <Button type="button" onClick={() => setIsModalOpen(false)} variant="secondary">Batal</Button>
                        <Button onClick={handleSubmit}>Simpan</Button>
                    </div>
                }
            >
                <form onSubmit={handleSubmit} className="space-y-4 text-xs">
                    <div>
                        <Label>Nama Syarat Tempo Pembayaran*</Label>
                        <Input
                            type="text"
                            placeholder="Contoh: Net 30 Hari, Langsung / COD, Net 14 Hari..."
                            value={name}
                            onChange={e => setName(e.target.value)}
                            required
                        />
                    </div>

                    <div>
                        <Label>Jumlah Hari (Durasi Jatuh Tempo)*</Label>
                        <Input
                            type="number"
                            placeholder="Masukkan jumlah hari (0 untuk tunai/COD)"
                            value={days}
                            onChange={e => setDays(e.target.value)}
                            min={0}
                            required
                        />
                        <span className="text-[10px] text-slate-400 mt-1 block">
                            Isi 0 untuk pembayaran langsung/COD, atau isi jumlah hari (misal 7, 14, 30, 60) untuk jatuh tempo kredit.
                        </span>
                    </div>
                </form>
            </Modal>
        </div>
    );
};
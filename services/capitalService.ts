// This is a new file: services/capitalService.ts

import { Investor, CapitalTransaction, ProfitDistribution, Account, JournalEntry } from '../types';
import { createJournalEntry } from './journalService';
import { generateId, generateMonthlyTransactionalId } from './serviceUtils';

// --- ADD INVESTOR ---

interface AddInvestorParams {
    investors: Investor[];
    accounts: Account[];
    journalEntries: JournalEntry[];
    capitalTransactions: CapitalTransaction[];
    newInvestorData: Omit<Investor, 'id' | 'ownershipPercentage'>;
}

interface AddInvestorResult {
    investors: Investor[];
    capitalTransactions: CapitalTransaction[];
    accounts: Account[];
    journalEntries: JournalEntry[];
}

export const addInvestor = (params: AddInvestorParams): AddInvestorResult => {
    const { investors, accounts, journalEntries, capitalTransactions, newInvestorData } = params;

    // 1. Add new investor to a temporary list
    const newInvestor: Investor = {
        ...newInvestorData,
        id: generateId('inv', investors.length),
        ownershipPercentage: 0,
    };
    const updatedInvestors = [...investors, newInvestor];

    // The rest of the logic is removed as it depends on initialInvestment which is deprecated.
    // Capital transactions should be added separately.
    // Ownership is recalculated on each capital transaction.

    return { 
        investors: updatedInvestors,
        capitalTransactions: capitalTransactions,
        accounts: accounts,
        journalEntries: journalEntries
    };
};

// --- ADD CAPITAL TRANSACTION ---

interface AddCapitalTransactionParams {
    investors: Investor[];
    capitalTransactions: CapitalTransaction[];
    accounts: Account[];
    journalEntries: JournalEntry[];
    branchId: string;
    transactionData: { investorId: string, type: 'Deposit' | 'Withdrawal', amount: number, cashAccountId: string };
}

export const addCapitalTransaction = (params: AddCapitalTransactionParams) => {
    const { investors, capitalTransactions, accounts, journalEntries, transactionData, branchId } = params;
    const { investorId, type, amount, cashAccountId } = transactionData;
    const investor = investors.find(i => i.id === investorId);
    if (!investor) return null;

    const newTransactionDate = new Date();
    const newTransaction: CapitalTransaction = {
        id: generateMonthlyTransactionalId('MDL', branchId, newTransactionDate, capitalTransactions),
        investorId,
        investorName: investor.name,
        date: newTransactionDate.toISOString(),
        type,
        amount
    };
    
    const journalLines = type === 'Deposit'
        ? [
            { accountId: cashAccountId, type: 'debit' as const, amount }, // Kas
            { accountId: '3010', type: 'credit' as const, amount } // Modal Disetor
        ] : [
            { accountId: '3010', type: 'debit' as const, amount }, // Modal Disetor
            { accountId: cashAccountId, type: 'credit' as const, amount } // Kas
        ];


    const journalResult = createJournalEntry(
        accounts,
        journalEntries,
        branchId,
        `${type} dari investor ${investor.name}`,
        journalLines,
        `Modal ${newTransaction.id}`
    );

    return {
        capitalTransactions: [newTransaction, ...capitalTransactions],
        ...journalResult
    };
};


// --- DISTRIBUTE PROFIT ---

interface DistributeProfitParams {
    profitDistributions: ProfitDistribution[];
    accounts: Account[];
    journalEntries: JournalEntry[];
    investors: Investor[];
    branchId: string;
    distributionData: { totalProfitDistributed: number, distributions: { investorId: string, amount: number }[], cashAccountId: string };
}

export const distributeProfit = (params: DistributeProfitParams) => {
    const { profitDistributions, accounts, journalEntries, investors, distributionData, branchId } = params;
    const { totalProfitDistributed, distributions, cashAccountId } = distributionData;
    
    const newDistributionId = generateId('pd', profitDistributions.length);
    const newDistribution: ProfitDistribution = {
        id: newDistributionId,
        date: new Date().toISOString(),
        totalProfitDistributed,
        distributions: distributions.map(d => ({
            ...d,
            investorName: investors.find(i => i.id === d.investorId)?.name || 'Unknown'
        }))
    };
    
    const journalResult = createJournalEntry(
        accounts,
        journalEntries,
        branchId, // Capital transactions are assumed to be central
        'Distribusi Laba ke Investor',
        [
            { accountId: '3020', type: 'debit', amount: totalProfitDistributed }, // Laba Ditahan
            { accountId: cashAccountId, type: 'credit', amount: totalProfitDistributed } // Kas
        ],
        `Distribusi ${newDistribution.id}`
    );
    return {
        profitDistributions: [newDistribution, ...profitDistributions],
        ...journalResult
    };
};
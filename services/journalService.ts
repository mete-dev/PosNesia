import { Account, JournalEntry, JournalEntryLine } from '../types';
import { generateId } from './serviceUtils';

export const createJournalEntry = (
    currentAccounts: Account[],
    currentJournalEntries: JournalEntry[],
    branchId: string,
    description: string,
    lines: Omit<JournalEntryLine, 'accountName'>[],
    reference?: string,
    posSessionId?: string,
    id?: string // Optional pre-generated ID
): { accounts: Account[]; journalEntries: JournalEntry[] } => {
    
    // 1. Validate the entry
    const totalDebits = lines.filter(l => l.type === 'debit').reduce((sum, l) => sum + l.amount, 0);
    const totalCredits = lines.filter(l => l.type === 'credit').reduce((sum, l) => sum + l.amount, 0);

    if (Math.abs(totalDebits - totalCredits) > 0.01) { // Use a tolerance for float comparison
        console.error("Journal entry is not balanced! Halting operation.", { description, reference, totalDebits, totalCredits, lines });
        alert(`CRITICAL ERROR: Transaksi "${description}" tidak seimbang. Debit: ${totalDebits}, Kredit: ${totalCredits}. Transaksi dibatalkan untuk mencegah kerusakan data.`);
        // In a real app, this should throw an error
        return { accounts: currentAccounts, journalEntries: currentJournalEntries };
    }

    // 2. Update account balances
    const updatedAccounts = [...currentAccounts];
    const accountMap = new Map(updatedAccounts.map(acc => [acc.id, acc]));

    for (const line of lines) {
        const account = accountMap.get(line.accountId);
        if (account) {
            if (line.type === 'debit') {
                account.balance += line.amount;
            } else {
                account.balance -= line.amount;
            }
        } else {
            console.error(`Account with ID ${line.accountId} not found.`);
            return { accounts: currentAccounts, journalEntries: currentJournalEntries };
        }
    }
    
    const finalAccounts = Array.from(accountMap.values());

    // 3. Create the new journal entry record
    const newEntry: JournalEntry = {
        id: id || generateId('je', currentJournalEntries.length),
        branchId,
        date: new Date().toISOString(),
        description,
        reference,
        posSessionId,
        lines: lines.map(line => ({
            ...line,
            accountName: currentAccounts.find(a => a.id === line.accountId)?.name || 'Unknown Account'
        })),
    };
    
    const updatedJournalEntries = [newEntry, ...currentJournalEntries];

    return { accounts: finalAccounts, journalEntries: updatedJournalEntries };
};
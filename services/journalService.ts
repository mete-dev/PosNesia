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
        status: 'active',
        lines: lines.map(line => ({
            ...line,
            accountName: currentAccounts.find(a => a.id === line.accountId)?.name || 'Unknown Account'
        })),
    };
    
    const updatedJournalEntries = [newEntry, ...currentJournalEntries];

    return { accounts: finalAccounts, journalEntries: updatedJournalEntries };
};

export const cancelJournalEntry = (
    currentAccounts: Account[],
    currentJournalEntries: JournalEntry[],
    entryId: string,
    cancelNote: string
): { accounts: Account[]; journalEntries: JournalEntry[] } => {
    const targetEntry = currentJournalEntries.find(j => j.id === entryId);
    if (!targetEntry || targetEntry.status === 'cancelled' || targetEntry.status === 'corrected') {
        alert("Transaksi tidak dapat dibatalkan atau sudah pernah dibatalkan.");
        return { accounts: currentAccounts, journalEntries: currentJournalEntries };
    }

    // Reverse account balance changes
    const updatedAccounts = currentAccounts.map(acc => ({ ...acc }));
    const accountMap = new Map(updatedAccounts.map(acc => [acc.id, acc]));

    for (const line of targetEntry.lines) {
        const account = accountMap.get(line.accountId);
        if (account) {
            if (line.type === 'debit') {
                account.balance -= line.amount; // reverse debit
            } else {
                account.balance += line.amount; // reverse credit
            }
        }
    }

    const finalAccounts = Array.from(accountMap.values());
    const updatedEntries = currentJournalEntries.map(entry => {
        if (entry.id === entryId) {
            return {
                ...entry,
                status: 'cancelled' as const,
                correctionNote: cancelNote || 'Dibatalkan oleh Pengguna',
                correctedAt: new Date().toISOString()
            };
        }
        return entry;
    });

    return { accounts: finalAccounts, journalEntries: updatedEntries };
};

export const updateJournalEntryWithAudit = (
    currentAccounts: Account[],
    currentJournalEntries: JournalEntry[],
    entryId: string,
    newDescription: string,
    newLines: Omit<JournalEntryLine, 'accountName'>[],
    correctionNote: string,
    branchId: string
): { accounts: Account[]; journalEntries: JournalEntry[] } => {
    const targetEntry = currentJournalEntries.find(j => j.id === entryId);
    if (!targetEntry || targetEntry.status === 'cancelled' || targetEntry.status === 'corrected') {
        alert("Transaksi tidak ditemukan atau sudah dibatalkan/diubah.");
        return { accounts: currentAccounts, journalEntries: currentJournalEntries };
    }

    // Step 1: Cancel/Reverse the old entry
    const cancelRes = cancelJournalEntry(currentAccounts, currentJournalEntries, entryId, `Diperbaiki: ${correctionNote}`);
    
    // Mark the old entry as 'corrected' instead of 'cancelled'
    const entriesAfterCorrection = cancelRes.journalEntries.map(entry => {
        if (entry.id === entryId) {
            return { ...entry, status: 'corrected' as const, correctionNote };
        }
        return entry;
    });

    // Step 2: Create new active entry linking back to originalEntryId
    const newJournalResult = createJournalEntry(
        cancelRes.accounts,
        entriesAfterCorrection,
        branchId,
        newDescription,
        newLines,
        `Perbaikan #${entryId}`,
        targetEntry.posSessionId
    );

    // Attach originalEntryId & correctionNote to the new entry
    const finalEntries = newJournalResult.journalEntries.map((entry, idx) => {
        if (idx === 0) { // Newest created entry
            return {
                ...entry,
                originalEntryId: entryId,
                correctionNote: `Perbaikan dari #${entryId}: ${correctionNote}`
            };
        }
        return entry;
    });

    return { accounts: newJournalResult.accounts, journalEntries: finalEntries };
};
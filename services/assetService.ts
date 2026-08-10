import { Asset, Account, JournalEntry, AssetCategory } from '../types';
import { generateId, generateAssetId } from './serviceUtils';
import { createJournalEntry } from './journalService';


export const addAsset = (
    currentAssets: Asset[], 
    assetData: Omit<Asset, 'id'>, 
    assetCategories: AssetCategory[]
): Asset[] => {
    const newAsset: Asset = {
        ...assetData,
        id: generateAssetId(assetData, currentAssets, assetCategories)
    };
    return [...currentAssets, newAsset];
};

export const removeAsset = (currentAssets: Asset[], assetId: string): Asset[] => {
    return currentAssets.filter(asset => asset.id !== assetId);
};


interface RecordAssetPurchaseParams {
    assets: Asset[];
    accounts: Account[];
    journalEntries: JournalEntry[];
    assetCategories: AssetCategory[];
    assetData: Omit<Asset, 'id'>;
    cashAccountId: string;
}

export const recordAssetPurchase = (params: RecordAssetPurchaseParams) => {
    const { assets, accounts, journalEntries, assetData, cashAccountId, assetCategories } = params;

    const updatedAssets = addAsset(assets, assetData, assetCategories);
    const newAsset = updatedAssets[updatedAssets.length - 1];

    // Assuming assets are categorized to specific accounts. For simplicity, all go to 1510 for now.
    const assetAccountId = '1510'; // Aset Tetap - Peralatan Toko

    const journalResult = createJournalEntry(
        accounts,
        journalEntries,
        newAsset.branchId,
        `Pembelian Aset: ${newAsset.name}`,
        [
            { accountId: assetAccountId, type: 'debit', amount: newAsset.value },
            { accountId: cashAccountId, type: 'credit', amount: newAsset.value }, // Use dynamic cash account
        ]
    );

    return {
        assets: updatedAssets,
        accounts: journalResult.accounts,
        journalEntries: journalResult.journalEntries
    };
};

interface RecordAssetSaleParams {
    assets: Asset[];
    accounts: Account[];
    journalEntries: JournalEntry[];
    assetId: string;
    salePrice: number;
    cashAccountId: string;
}

export const recordAssetSale = (params: RecordAssetSaleParams) => {
    const { assets, accounts, journalEntries, assetId, salePrice, cashAccountId } = params;
    const assetToSell = assets.find(a => a.id === assetId);
    if (!assetToSell) return null;

    const updatedAssets = removeAsset(assets, assetId);
    
    const gainOrLoss = salePrice - assetToSell.value;
    const journalLines = [
        { accountId: cashAccountId, type: 'debit' as const, amount: salePrice }, // Use dynamic cash account
        { accountId: '1510', type: 'credit' as const, amount: assetToSell.value }, // Aset keluar
    ];

    if (gainOrLoss > 0) {
        journalLines.push({ accountId: '4020', type: 'credit' as const, amount: gainOrLoss }); // Keuntungan Penjualan Aset
    } else if (gainOrLoss < 0) {
        journalLines.push({ accountId: '5030', type: 'debit' as const, amount: Math.abs(gainOrLoss) }); // Kerugian Penjualan Aset
    }
    
    const journalResult = createJournalEntry(
        accounts,
        journalEntries,
        assetToSell.branchId,
        `Penjualan Aset: ${assetToSell.name}`,
        journalLines,
        `Aset ${assetToSell.id}`
    );

    return {
        assets: updatedAssets,
        accounts: journalResult.accounts,
        journalEntries: journalResult.journalEntries
    };
};
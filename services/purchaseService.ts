import { PurchaseOrder, Product, StockMovement, Account, JournalEntry, InventoryLevel } from '../types';
import { addStockMovement } from './inventoryService';
import { createJournalEntry } from './journalService';
import { generateId, generateMonthlyTransactionalId } from './serviceUtils';

interface ReceivePurchaseOrderParams {
    purchases: PurchaseOrder[];
    inventoryLevels: InventoryLevel[];
    stockMovements: StockMovement[];
    products: Product[];
    purchaseId: string;
    staffId: string;
}

interface ReceivePurchaseOrderResult {
    purchases: PurchaseOrder[];
    inventoryLevels: InventoryLevel[];
    stockMovements: StockMovement[];
}

export const receivePurchaseOrder = (params: ReceivePurchaseOrderParams): ReceivePurchaseOrderResult | null => {
    const { purchases, inventoryLevels, stockMovements, products, purchaseId, staffId } = params;

    let receivedPurchase: PurchaseOrder | undefined;
    const updatedPurchases = purchases.map(p => {
        if (p.id === purchaseId && p.status === 'Pending') {
            receivedPurchase = { ...p, status: 'Received' as const };
            return receivedPurchase;
        }
        return p;
    });

    if (!receivedPurchase) {
        return null;
    }

    // Adjust stock at the destination location (warehouse)
    let tempMovements = [...stockMovements];
    let tempInventoryLevels = [...inventoryLevels];
    
    receivedPurchase.items.forEach(item => {
        const product = products.find(p => p.id === item.productId);
        if (product) {
            const invIndex = tempInventoryLevels.findIndex(inv => inv.locationId === receivedPurchase!.destinationId && inv.productId === item.productId);
            
            if (invIndex > -1) {
                const currentStock = tempInventoryLevels[invIndex].quantity;
                const newStock = currentStock + item.quantity;
                tempInventoryLevels[invIndex] = { ...tempInventoryLevels[invIndex], quantity: newStock };
                tempMovements = addStockMovement(
                    tempMovements,
                    {
                        locationId: receivedPurchase!.destinationId,
                        productId: product.id,
                        productName: product.name,
                        type: 'Purchase',
                        quantityChange: item.quantity,
                        newStockLevel: newStock,
                        notes: `Diterima dari PO #${receivedPurchase!.id}`,
                        referenceId: receivedPurchase!.id,
                        partnerId: receivedPurchase!.vendorId,
                        staffId: staffId,
                    }
                );
            } else {
                // First time this product is at this location
                const newStock = item.quantity;
                tempInventoryLevels.push({
                    locationId: receivedPurchase!.destinationId,
                    productId: item.productId,
                    quantity: newStock
                });
                tempMovements = addStockMovement(
                    tempMovements,
                    {
                        locationId: receivedPurchase!.destinationId,
                        productId: product.id,
                        productName: product.name,
                        type: 'Purchase',
                        quantityChange: item.quantity,
                        newStockLevel: newStock,
                        notes: `Diterima dari PO #${receivedPurchase!.id}`,
                        referenceId: receivedPurchase!.id,
                        partnerId: receivedPurchase!.vendorId,
                        staffId: staffId,
                    }
                );
            }
        }
    });

    // NOTE: Journal entry for Accounts Payable is now a separate step,
    // triggered by entering a vendor bill against the PO. This separates
    // physical inventory receipt from financial liability recognition.

    return {
        purchases: updatedPurchases,
        inventoryLevels: tempInventoryLevels,
        stockMovements: tempMovements,
    };
};
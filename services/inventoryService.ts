import { StockMovement, Product, InventoryLevel, Warehouse } from '../types';
import { generateId } from './serviceUtils';

export const addStockMovement = (
    currentMovements: StockMovement[],
    data: Omit<StockMovement, 'id' | 'date'>
): StockMovement[] => {
    const newMovement: StockMovement = {
        ...data,
        id: generateId('sm', currentMovements.length),
        date: new Date().toISOString(),
    };
    return [newMovement, ...currentMovements];
};

interface AdjustStockPayload {
    productId: string;
    newStock?: number;
    quantityChange?: number;
    notes: string;
    locationId: string;
    staffId: string;
}

export const adjustStockManually = (
    inventoryLevels: InventoryLevel[],
    stockMovements: StockMovement[],
    products: Product[],
    payload: AdjustStockPayload
): { inventoryLevels: InventoryLevel[], stockMovements: StockMovement[] } | null => {
    const { productId, newStock, quantityChange: qtyChange, notes, locationId, staffId } = payload;
    
    const product = products.find(p => p.id === productId);
    if (!product) return null;

    const invIndex = inventoryLevels.findIndex(inv => inv.locationId === locationId && inv.productId === productId);
    const currentStock = invIndex > -1 ? inventoryLevels[invIndex].quantity : 0;

    let finalNewStock: number;
    let quantityChange: number;

    if (newStock !== undefined) {
        finalNewStock = newStock;
        quantityChange = newStock - currentStock;
    } else if (qtyChange !== undefined) {
        quantityChange = qtyChange;
        finalNewStock = currentStock + qtyChange;
    } else {
        return null; // Must provide either newStock or quantityChange
    }

    const updatedInventoryLevels = [...inventoryLevels];
    if (invIndex > -1) {
        updatedInventoryLevels[invIndex] = { ...updatedInventoryLevels[invIndex], quantity: finalNewStock };
    } else {
        updatedInventoryLevels.push({ locationId, productId, quantity: finalNewStock });
    }

    const updatedMovements = addStockMovement(
        stockMovements,
        {
            locationId,
            productId,
            productName: product.name,
            type: 'Adjustment',
            quantityChange,
            newStockLevel: finalNewStock,
            notes,
            referenceId: `ADJ-${generateId('', Math.floor(Math.random() * 10000))}`,
            staffId,
        }
    );

    return { inventoryLevels: updatedInventoryLevels, stockMovements: updatedMovements };
};
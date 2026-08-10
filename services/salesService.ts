import { AppState, Product, Sale, StockMovement, Account, JournalEntry, Customer, TaxRate, PaymentMethod, SaleItem, Promotion, CartItem, DeliveryInfo, InventoryLevel, CashierStation, SalePayment } from '../types';
import { addStockMovement } from './inventoryService';
import { createJournalEntry } from './journalService';
import { generateId, generatePosReceiptId, generateMonthlyTransactionalId } from './serviceUtils';
import { applyPromotionsToCart } from '../utils/promotionUtils';

interface CreateSaleParams {
    products: Product[];
    inventoryLevels: InventoryLevel[];
    stockMovements: StockMovement[];
    sales: Sale[];
    accounts: Account[];
    journalEntries: JournalEntry[];
    customers: Customer[];
    taxRates: TaxRate[];
    paymentMethods: PaymentMethod[];
    isTaxEnabled: boolean;
    cashierStations: CashierStation[];
    newSaleData: Omit<Sale, 'id' | 'date' | 'status'>;
    posSession?: AppState['posSession']; // Pass session for POS sales
}

interface CreateSaleResult {
    inventoryLevels: InventoryLevel[];
    stockMovements: StockMovement[];
    sales: Sale[];
    accounts: Account[];
    journalEntries: JournalEntry[];
    customers: Customer[];
}

export const createSale = (params: CreateSaleParams): CreateSaleResult => {
    const {
        products, inventoryLevels, stockMovements, sales, accounts, journalEntries,
        customers, taxRates, paymentMethods, newSaleData, isTaxEnabled, posSession, cashierStations
    } = params;

    if (newSaleData.items.length === 0) {
        // Return current state if there's nothing to process
        return {
            inventoryLevels: inventoryLevels, stockMovements: stockMovements,
            sales: sales, accounts: accounts,
            journalEntries: journalEntries, customers: customers,
        };
    }

    // 1. Finalize Sale Record
    const pointsEarned = Math.floor(newSaleData.subtotal / 1000); // 1 point per 1000 spent on subtotal
    
    const saleDate = new Date();
    const newSaleId = newSaleData.posSessionId 
        ? generatePosReceiptId(newSaleData.posSessionId, sales.filter(s => s.posSessionId === newSaleData.posSessionId))
        : generateMonthlyTransactionalId('SO', newSaleData.branchId, saleDate, sales);

    const newSale: Sale = {
        ...newSaleData,
        id: newSaleId,
        date: saleDate.toISOString(),
        status: newSaleData.paymentTermId === 'pt1' ? 'Paid' : 'Unpaid', // 'pt1' is 'Langsung'
        pointsEarned,
    };
    const updatedSales = [newSale, ...sales];

    // 2. Adjust Stock and create Stock Movements
    let tempMovements = [...stockMovements];
    let tempInventoryLevels = [...inventoryLevels];
    
    newSale.items.forEach(item => {
        const invIndex = tempInventoryLevels.findIndex(inv => inv.locationId === newSale.sourceLocationId && inv.productId === item.productId);
        if (invIndex > -1) {
            const currentStock = tempInventoryLevels[invIndex].quantity;
            const newStock = currentStock - item.quantity;
            tempInventoryLevels[invIndex] = { ...tempInventoryLevels[invIndex], quantity: newStock };
            tempMovements = addStockMovement(
                tempMovements,
                {
                    locationId: newSale.sourceLocationId,
                    productId: item.productId,
                    productName: item.productName,
                    type: 'Sale',
                    quantityChange: -item.quantity,
                    newStockLevel: newStock,
                    notes: `Penjualan #${newSale.id}`,
                    referenceId: newSale.id,
                    partnerId: newSale.customerId,
                    staffId: newSale.staffId,
                }
            );
        }
    });

    // 3. Award points if a customer is selected & update deposit if used
    let updatedCustomers = [...customers];
    if (newSale.customerId) {
        const customerIndex = updatedCustomers.findIndex(c => c.id === newSale.customerId);
        if (customerIndex > -1) {
            const customer = updatedCustomers[customerIndex];
            
            let updatedCustomer = {
                ...customer,
                points: (customer.points + pointsEarned) - (newSale.pointsUsed || 0),
                depositBalance: customer.depositBalance - (newSale.depositUsed || 0)
            };

            updatedCustomers[customerIndex] = updatedCustomer;
        }
    }

    // 4. Create Journal Entry
    const totalCost = newSale.items.reduce((sum, item) => sum + item.cost * item.quantity, 0);
    
    const journalLines: { accountId: string, type: 'debit' | 'credit', amount: number }[] = [];

    // Credit side (what we earned)
    journalLines.push({ accountId: '4010', type: 'credit', amount: newSale.subtotal - newSale.discount }); // Pendapatan Penjualan
    if (newSale.taxAmount > 0 && isTaxEnabled) {
        journalLines.push({ accountId: '2210', type: 'credit', amount: newSale.taxAmount }); // PPN Keluaran
    }
    if (newSale.deliveryInfo && newSale.deliveryInfo.deliveryFee > 0) {
        journalLines.push({ accountId: '4030', type: 'credit', amount: newSale.deliveryInfo.deliveryFee }); // Pendapatan Ongkir
    }
    
    // Debit side (how we were paid)
    newSale.payments.forEach(payment => {
        const paymentMethod = paymentMethods.find(pm => pm.id === payment.paymentMethodId);
        if (!paymentMethod) return;

        let debitAccountId = '1010'; // Fallback
        
        if (paymentMethod.type === 'bank' && paymentMethod.linkedAccountId) {
            debitAccountId = paymentMethod.linkedAccountId;
        } else if (paymentMethod.type === 'accounts_receivable' && paymentMethod.linkedAccountId) {
            debitAccountId = paymentMethod.linkedAccountId;
        } else if (paymentMethod.type === 'customer_deposit' && paymentMethod.linkedAccountId) {
            debitAccountId = paymentMethod.linkedAccountId;
        } else if (posSession && paymentMethod.type === 'cash') {
            const station = cashierStations?.find(cs => cs.id === posSession.cashierStationId);
            if (station) debitAccountId = station.cashInHandAccountId;
        }

        journalLines.push({ accountId: debitAccountId, type: 'debit', amount: payment.amount });
    });
    
    // COGS journaling
    if (totalCost > 0) {
        journalLines.push({ accountId: '5010', type: 'debit', amount: totalCost }); // Beban Pokok Penjualan
        journalLines.push({ accountId: '1210', type: 'credit', amount: totalCost }); // Persediaan Barang
    }

    const journalResult = createJournalEntry(
        accounts,
        journalEntries,
        newSale.branchId,
        `Penjualan ke ${newSale.customerName}`,
        journalLines,
        `Penjualan ${newSale.id}`,
        newSale.posSessionId // Pass the session ID to the journal service
    );

    return {
        inventoryLevels: tempInventoryLevels,
        stockMovements: tempMovements,
        sales: updatedSales,
        customers: updatedCustomers,
        accounts: journalResult.accounts,
        journalEntries: journalResult.journalEntries
    };
};

// --- NEW SERVICE FOR POS/ECOMMERCE CHECKOUT ---

interface ProcessSaleFromCartParams extends AppState {
    cart: CartItem[]; // Ensure cart is passed with the correct type
    customer?: Customer;
    checkoutDetails: {
        customerId?: string;
        paymentMethodId: string;
        paymentTermId: string;
        deliveryInfo: DeliveryInfo;
        pointsToUse: number;
        depositToUse: number;
        voucherCode?: string;
        codAmount: number;
    };
}

export const processSaleFromCart = (params: ProcessSaleFromCartParams): CreateSaleResult => {
    const { cart, promotions, products, taxRates, checkoutDetails, customers, customer, ecommerceSettings, currentBranchId, isTaxEnabled } = params;
    
    if (cart.length === 0 || !currentBranchId) {
        return {
            inventoryLevels: params.inventoryLevels,
            stockMovements: params.stockMovements,
            sales: params.sales,
            accounts: params.accounts,
            journalEntries: params.journalEntries,
            customers: params.customers,
        };
    }
    
    // 1. Apply promotions
    const { cartWithDiscounts, totalDiscount } = applyPromotionsToCart(cart, promotions, products, customer);
    
    // 2. Calculate totals
    const subtotal = cartWithDiscounts.filter(i => !i.isFreebie).reduce((sum, item) => sum + item.product.price * item.quantity, 0);
    
    // E-commerce validation
    if (checkoutDetails.deliveryInfo.type === 'delivery' && subtotal < ecommerceSettings.minTransactionForDelivery) {
        alert(`Transaksi minimal untuk pengantaran adalah Rp${ecommerceSettings.minTransactionForDelivery.toLocaleString('id-ID')}`);
        // In a real app, this should return an error state, not just an alert
        return {
             inventoryLevels: params.inventoryLevels, stockMovements: params.stockMovements, sales: params.sales,
             accounts: params.accounts, journalEntries: params.journalEntries, customers: params.customers,
        };
    }
    
    const preTaxTotal = subtotal - totalDiscount;

    let taxAmount = 0;
    if (isTaxEnabled) {
        const defaultTaxRate = taxRates.find(t => t.isDefault)?.rate || 0;
        taxAmount = cartWithDiscounts.filter(i => !i.isFreebie).reduce((sum, item) => {
            if (item.product.isTaxable) {
                const itemPriceAfterDiscount = (item.product.price - item.discount);
                return sum + (itemPriceAfterDiscount * item.quantity * defaultTaxRate);
            }
            return sum;
        }, 0);
    }

    const grandTotal = preTaxTotal + taxAmount + checkoutDetails.deliveryInfo.deliveryFee;
    
    // 3. Convert CartItems to SaleItems, including freebies
    const saleItems: SaleItem[] = cartWithDiscounts.map(item => ({
        productId: item.product.id,
        productName: item.product.name,
        quantity: item.quantity,
        price: item.product.price,
        cost: item.product.cost,
        discount: item.discount * item.quantity, // Total discount for this line
    }));

    // 4. Create Sale data object
    const saleCustomer = customers.find(c => c.id === checkoutDetails.customerId);
    
    const newSaleData: Omit<Sale, 'id' | 'date' | 'status'> = {
        branchId: currentBranchId,
        sourceLocationId: currentBranchId,
        items: saleItems,
        subtotal: subtotal,
        discount: totalDiscount,
        taxAmount: taxAmount,
        grandTotal: grandTotal,
        customerId: checkoutDetails.customerId,
        customerName: saleCustomer?.name || 'Pelanggan Umum',
        payments: [{ paymentMethodId: checkoutDetails.paymentMethodId, amount: grandTotal }],
        paymentTermId: checkoutDetails.paymentTermId,
        dueDate: new Date().toISOString(), // This should be calculated based on payment term
        deliveryInfo: checkoutDetails.deliveryInfo,
        pointsUsed: checkoutDetails.pointsToUse,
        depositUsed: checkoutDetails.depositToUse,
        codAmount: checkoutDetails.codAmount,
        saleChannel: 'E-commerce',
        fulfillmentStatus: 'Pending',
    };
    
    // 5. Use the existing createSale logic to process the transaction
    return createSale({
        ...params,
        newSaleData
    });
};
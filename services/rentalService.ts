// This is a new file: services/rentalService.ts

import { RentalOrder, Customer, CustomerBill, Vehicle } from '../types';
import { generateId, generateMonthlyTransactionalId } from './serviceUtils';


interface CreateRentalOrderParams {
    customers: Customer[];
    rentalOrders: RentalOrder[];
    customerBills: CustomerBill[];
    vehicles: Vehicle[];
    orderData: Omit<RentalOrder, 'id' | 'status'>
}

export const createRentalOrder = (params: CreateRentalOrderParams) => {
    const { orderData, customers, rentalOrders, customerBills, vehicles } = params;

    const customer = customers.find(c => c.id === orderData.customerId);
    const vehicle = vehicles.find(a => a.id === orderData.vehicleId);

    if (!customer || !vehicle) {
        console.error("Customer or Vehicle not found for rental order");
        return null;
    }
    
    // Rental assets are linked to a central branch for now.
    const branchAsset = 'CAB-JPSTNH01'; 

    const newOrder: RentalOrder = {
        ...orderData,
        id: generateMonthlyTransactionalId('RTL', branchAsset, new Date(orderData.startDate), rentalOrders),
        status: 'Booked',
    };

    const newBill: CustomerBill = {
        id: generateId('cb', customerBills.length),
        sourceType: 'RoomOrder', // Should be RentalOrder, but using existing for now
        sourceId: newOrder.id,
        description: `Sewa ${vehicle.name} (${orderData.startDate} - ${orderData.endDate})`,
        customerId: newOrder.customerId,
        customerName: customer.name,
        billDate: new Date().toISOString(),
        dueDate: newOrder.startDate,
        amount: newOrder.totalPrice,
        status: 'Unpaid',
    };

    const updatedVehicles = vehicles.map(v =>
        v.id === newOrder.vehicleId ? { ...v, status: 'On Trip' as const } : v
    );

    return {
        rentalOrders: [...rentalOrders, newOrder],
        customerBills: [...customerBills, newBill],
        vehicles: updatedVehicles,
    }
};
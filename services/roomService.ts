// This is a new file: services/roomService.ts

import { RoomOrder, Customer, CustomerBill, Room } from '../types';
import { generateId, generateMonthlyTransactionalId } from './serviceUtils';


interface CreateRoomOrderParams {
    customers: Customer[];
    roomOrders: RoomOrder[];
    customerBills: CustomerBill[];
    rooms: Room[];
    orderData: Omit<RoomOrder, 'id' | 'status'>
}

export const createRoomOrder = (params: CreateRoomOrderParams) => {
    const { orderData, customers, roomOrders, customerBills, rooms } = params;

    const customer = customers.find(c => c.id === orderData.customerId);
    const room = rooms.find(a => a.id === orderData.roomId);

    if (!customer || !room) {
        console.error("Customer or Room not found for room order");
        return null;
    }

    const newOrder: RoomOrder = {
        ...orderData,
        id: generateMonthlyTransactionalId('RSV', room.branchId, new Date(orderData.startDate), roomOrders),
        status: 'Booked',
    };

    const newBill: CustomerBill = {
        id: generateId('cb', customerBills.length),
        sourceType: 'RoomOrder',
        sourceId: newOrder.id,
        description: `Sewa ${room.name} (${orderData.startDate} - ${orderData.endDate})`,
        customerId: newOrder.customerId,
        customerName: customer.name,
        billDate: new Date().toISOString(),
        dueDate: newOrder.startDate,
        amount: newOrder.totalPrice,
        status: 'Unpaid',
    };

    const updatedRooms = rooms.map(r =>
        r.id === newOrder.roomId ? { ...r, status: 'Occupied' as const } : r
    );

    return {
        roomOrders: [...roomOrders, newOrder],
        customerBills: [...customerBills, newBill],
        rooms: updatedRooms,
    }
};
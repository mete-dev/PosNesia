// This is a new file: components/Helpdesk.tsx
import React, { useMemo } from 'react';
import { useAppContext } from '../hooks/useAppContext';
import { Card } from './ui';

export const HelpdeskPage: React.FC = () => {
    const { state } = useAppContext();
    const { helpdeskTickets, customers, staff } = state;

    const ticketsWithDetails = useMemo(() => {
        return helpdeskTickets.map(ticket => ({
            ...ticket,
            customerName: customers.find(c => c.id === ticket.customerId)?.name || 'Unknown Customer',
            assignedToName: staff.find(s => s.id === ticket.assignedToId)?.name || 'Unassigned',
        }));
    }, [helpdeskTickets, customers, staff]);
    
    const getPriorityChip = (priority: 'Low' | 'Medium' | 'High') => {
        switch (priority) {
            case 'Low': return 'bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-300';
            case 'Medium': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/50 dark:text-yellow-300';
            case 'High': return 'bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-300';
        }
    };
    
    const getStatusChip = (status: 'Open' | 'In Progress' | 'Closed') => {
        switch (status) {
            case 'Open': return 'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300';
            case 'In Progress': return 'bg-purple-100 text-purple-800 dark:bg-purple-900/50 dark:text-purple-300';
            case 'Closed': return 'bg-gray-200 text-gray-800 dark:bg-gray-700 dark:text-gray-300';
        }
    };

    return (
        <div className="p-8 h-full flex flex-col">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Helpdesk</h1>
            </div>
            <Card className="flex-grow overflow-y-auto">
                <table className="w-full text-sm text-left text-gray-500 dark:text-gray-400">
                    <thead className="text-xs text-gray-700 uppercase bg-gray-50 dark:bg-gray-700 dark:text-gray-400">
                        <tr>
                            <th className="px-6 py-3">Subjek</th>
                            <th className="px-6 py-3">Pelanggan</th>
                            <th className="px-6 py-3">Prioritas</th>
                            <th className="px-6 py-3">Status</th>
                            <th className="px-6 py-3">Ditugaskan Kepada</th>
                        </tr>
                    </thead>
                    <tbody>
                        {ticketsWithDetails.map(ticket => (
                            <tr key={ticket.id} className="border-b dark:border-gray-700">
                                <td className="px-6 py-4 font-medium">{ticket.subject}</td>
                                <td className="px-6 py-4">{ticket.customerName}</td>
                                <td className="px-6 py-4">
                                    <span className={`px-2 py-1 rounded-full font-semibold text-xs ${getPriorityChip(ticket.priority)}`}>
                                        {ticket.priority}
                                    </span>
                                </td>
                                <td className="px-6 py-4">
                                    <span className={`px-2 py-1 rounded-full font-semibold text-xs ${getStatusChip(ticket.status)}`}>
                                        {ticket.status}
                                    </span>
                                </td>
                                <td className="px-6 py-4">{ticket.assignedToName}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </Card>
        </div>
    );
};

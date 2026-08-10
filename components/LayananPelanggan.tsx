// This is a new file: components/LayananPelanggan.tsx
import React, { useState, useMemo, useRef, useEffect } from 'react';
import { useAppContext } from '../hooks/useAppContext';
import { HelpdeskTicket, ChatMessage } from '../types';
import { Badge, Button } from './ui';

export const LayananPelangganPage: React.FC = () => {
    const { state, dispatch } = useAppContext();
    const { helpdeskTickets, customers, sales } = state;
    const [selectedTicketId, setSelectedTicketId] = useState<string | null>(null);
    const [replyText, setReplyText] = useState('');
    const chatEndRef = useRef<HTMLDivElement>(null);

    const sortedTickets = useMemo(() => {
        return [...helpdeskTickets].sort((a, b) => new Date(b.createdDate).getTime() - new Date(a.createdDate).getTime());
    }, [helpdeskTickets]);

    const selectedTicket = useMemo(() => {
        return selectedTicketId ? helpdeskTickets.find(t => t.id === selectedTicketId) : null;
    }, [selectedTicketId, helpdeskTickets]);
    
    const selectedCustomer = useMemo(() => {
        return selectedTicket ? customers.find(c => c.id === selectedTicket.customerId) : null;
    }, [selectedTicket, customers]);
    
    const selectedCustomerOrders = useMemo(() => {
        return selectedCustomer ? sales.filter(s => s.customerId === selectedCustomer.id) : [];
    }, [selectedCustomer, sales]);

    useEffect(() => {
        chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [selectedTicket?.messages]);

    const handleSendReply = (e: React.FormEvent) => {
        e.preventDefault();
        if (replyText.trim() && selectedTicketId) {
            dispatch({
                type: 'helpdesk/addMessage',
                payload: { ticketId: selectedTicketId, text: replyText, sender: 'cs' }
            });
            setReplyText('');
        }
    };
    
    const handleStatusChange = (status: HelpdeskTicket['status']) => {
        if (selectedTicketId) {
            dispatch({ type: 'helpdesk/updateTicketStatus', payload: { ticketId: selectedTicketId, status } });
        }
    };

    return (
        <div className="h-full flex flex-col">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white p-8 pb-4">Helpdesk</h1>
            <div className="flex-grow flex border-t dark:border-gray-700 overflow-hidden">
                {/* Left Panel: Ticket List */}
                <div className="w-1/3 border-r dark:border-gray-700 overflow-y-auto">
                    {sortedTickets.map(ticket => {
                        const customer = customers.find(c => c.id === ticket.customerId);
                        return (
                            <button
                                key={ticket.id}
                                onClick={() => setSelectedTicketId(ticket.id)}
                                className={`w-full text-left p-4 border-b dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50 ${selectedTicketId === ticket.id ? 'bg-primary-50 dark:bg-primary-900/50' : ''}`}
                            >
                                <div className="flex justify-between items-start">
                                    <div>
                                        <p className="font-bold text-gray-900 dark:text-white">{ticket.subject}</p>
                                        <p className="text-sm text-gray-500 dark:text-gray-400">{customer?.name || 'Unknown'}</p>
                                    </div>
                                    <Badge variant={ticket.status === 'Closed' ? 'neutral' : 'success'}>{ticket.status}</Badge>
                                </div>
                                <p className="text-xs text-gray-400 mt-1">{new Date(ticket.createdDate).toLocaleString('id-ID')}</p>
                            </button>
                        );
                    })}
                </div>

                {/* Right Panel: Chat & Info */}
                <div className="w-2/3 flex flex-col">
                    {selectedTicket && selectedCustomer ? (
                        <>
                            <div className="p-4 border-b dark:border-gray-700 flex justify-between items-center">
                                <div>
                                    <h2 className="text-xl font-bold">{selectedCustomer.name}</h2>
                                    <p className="text-sm text-gray-500">{selectedTicket.subject}</p>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Button onClick={() => handleStatusChange('In Progress')} variant="secondary" size="sm" disabled={selectedTicket.status === 'In Progress'}>In Progress</Button>
                                    <Button onClick={() => handleStatusChange('Closed')} variant="secondary" size="sm" disabled={selectedTicket.status === 'Closed'}>Selesai</Button>
                                </div>
                            </div>
                            <div className="flex-grow flex overflow-hidden">
                                <div className="w-2/3 flex flex-col border-r dark:border-gray-700">
                                    <div className="flex-grow overflow-y-auto p-4 space-y-4">
                                        {selectedTicket.messages.map((msg: ChatMessage) => (
                                            <div key={msg.id} className={`flex ${msg.sender === 'cs' ? 'justify-end' : 'justify-start'}`}>
                                                <div className={`max-w-[80%] py-2 px-3 rounded-2xl ${msg.sender === 'cs' ? 'bg-primary-600 text-white rounded-br-none' : 'bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-white rounded-bl-none'}`}>
                                                    <p className="text-sm">{msg.text}</p>
                                                </div>
                                            </div>
                                        ))}
                                        <div ref={chatEndRef}></div>
                                    </div>
                                    <form onSubmit={handleSendReply} className="flex gap-2 p-4 border-t dark:border-gray-700">
                                        <input
                                            type="text"
                                            value={replyText}
                                            onChange={(e) => setReplyText(e.target.value)}
                                            placeholder="Ketik balasan..."
                                            className="flex-grow w-full rounded-md bg-gray-100 dark:bg-gray-700 border-transparent focus:border-primary-500 focus:ring-primary-500"
                                        />
                                        <Button type="submit">Kirim</Button>
                                    </form>
                                </div>
                                <div className="w-1/3 overflow-y-auto p-4">
                                     <h3 className="font-bold mb-2">Info Pelanggan</h3>
                                     <p className="text-sm"><strong>Telepon:</strong> {selectedCustomer.phone}</p>
                                     <h3 className="font-bold mb-2 mt-4">Riwayat Pesanan</h3>
                                     <div className="space-y-3">
                                        {selectedCustomerOrders.length > 0 ? selectedCustomerOrders.map(order => (
                                            <div key={order.id} className="p-2 bg-gray-50 dark:bg-gray-800/50 rounded-lg text-xs">
                                                <p className="font-semibold">#{order.id} - {new Date(order.date).toLocaleDateString()}</p>
                                                <p>Total: Rp{order.grandTotal.toLocaleString('id-ID')}</p>
                                            </div>
                                        )) : <p className="text-sm text-gray-500">Tidak ada riwayat pesanan.</p>}
                                     </div>
                                </div>
                            </div>
                        </>
                    ) : (
                        <div className="flex items-center justify-center h-full text-gray-500">
                            <p>Pilih tiket untuk ditampilkan</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};
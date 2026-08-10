// This is a new file: components/Events.tsx
import React, { useState, useMemo, useEffect } from 'react';
import { useAppContext } from '../hooks/useAppContext';
import { Event, TicketTier, EventTicketSale, Customer } from '../types';
import { Button, Modal, Input, Label, Card, Select } from './ui';
import { generateId } from '../services/serviceUtils';

const EventModal: React.FC<{
    isOpen: boolean;
    onClose: () => void;
    onSave: (event: Omit<Event, 'id'>) => void;
    existingEvent: Event | null;
}> = ({ isOpen, onClose, onSave, existingEvent }) => {
    const [name, setName] = useState('');
    const [date, setDate] = useState('');
    const [startTime, setStartTime] = useState('');
    const [endTime, setEndTime] = useState('');
    const [ticketTiers, setTicketTiers] = useState<Partial<TicketTier>[]>([{ name: 'Reguler', price: 0, capacity: 100 }]);

    useEffect(() => {
        if (isOpen) {
            if (existingEvent) {
                setName(existingEvent.name);
                setDate(new Date(existingEvent.date).toISOString().substring(0, 10));
                setStartTime(existingEvent.startTime);
                setEndTime(existingEvent.endTime);
                setTicketTiers(existingEvent.ticketTiers);
            } else {
                setName('');
                setDate('');
                setStartTime('');
                setEndTime('');
                setTicketTiers([{ name: 'Reguler', price: 0, capacity: 100 }]);
            }
        }
    }, [isOpen, existingEvent]);

    const handleTierChange = (index: number, field: keyof TicketTier, value: string | number) => {
        const newTiers = [...ticketTiers];
        (newTiers[index] as any)[field] = value;
        setTicketTiers(newTiers);
    };

    const addTier = () => setTicketTiers([...ticketTiers, { name: '', price: 0, capacity: 0 }]);
    const removeTier = (index: number) => {
        if (ticketTiers.length > 1) {
            setTicketTiers(ticketTiers.filter((_, i) => i !== index));
        }
    };
    
    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const finalTiers: TicketTier[] = ticketTiers
            .filter(t => t.name && t.price! >= 0 && t.capacity! > 0)
            .map(t => ({
                id: t.id || generateId('tier', Math.random()),
                name: t.name!,
                price: Number(t.price) || 0,
                capacity: Number(t.capacity) || 0,
            }));

        if (finalTiers.length === 0) {
            alert('Harap tambahkan setidaknya satu kelas tiket yang valid.');
            return;
        }

        onSave({
            name,
            date: new Date(date).toISOString(),
            startTime,
            endTime,
            ticketTiers: finalTiers,
        });
        onClose();
    };
    
    const footer = <Button onClick={handleSubmit}>Simpan Event</Button>;

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Buat Event Baru" footer={footer} maxWidth="max-w-2xl">
            <form onSubmit={handleSubmit} className="space-y-4">
                <Input value={name} onChange={e => setName(e.target.value)} placeholder="Nama Event" required />
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="md:col-span-1">
                        <Label>Tanggal Event</Label>
                        <Input type="date" value={date} onChange={e => setDate(e.target.value)} required />
                    </div>
                    <div>
                        <Label>Jam Mulai</Label>
                        <Input type="time" value={startTime} onChange={e => setStartTime(e.target.value)} required />
                    </div>
                    <div>
                        <Label>Jam Selesai</Label>
                        <Input type="time" value={endTime} onChange={e => setEndTime(e.target.value)} required />
                    </div>
                </div>
                
                <div className="border-t pt-4 space-y-2">
                    <h3 className="text-lg font-semibold">Kelas Tiket</h3>
                    {ticketTiers.map((tier, index) => (
                        <div key={index} className="grid grid-cols-12 gap-2 items-center">
                            <Input value={tier.name || ''} onChange={e => handleTierChange(index, 'name', e.target.value)} placeholder="Nama (e.g., VIP)" className="col-span-4" />
                            <Input type="number" value={tier.price || ''} onChange={e => handleTierChange(index, 'price', Number(e.target.value))} placeholder="Harga (Rp)" className="col-span-3" />
                            <Input type="number" value={tier.capacity || ''} onChange={e => handleTierChange(index, 'capacity', Number(e.target.value))} placeholder="Kapasitas" className="col-span-3" />
                            <div className="col-span-2 text-right">
                                <Button type="button" onClick={() => removeTier(index)} variant="danger" size="sm" className="w-8 h-8 p-0">X</Button>
                            </div>
                        </div>
                    ))}
                    <Button type="button" onClick={addTier} variant="secondary" size="sm">+ Tambah Kelas Tiket</Button>
                </div>
            </form>
        </Modal>
    );
};


export const EventManagementPage: React.FC = () => {
    const { state, dispatch } = useAppContext();
    const { events } = state;
    const [isModalOpen, setModalOpen] = useState(false);
    const [editingEvent, setEditingEvent] = useState<Event | null>(null);

    const handleOpenModal = (event: Event | null = null) => {
        setEditingEvent(event);
        setModalOpen(true);
    };

    const handleSave = (event: Omit<Event, 'id'>) => {
        dispatch({ type: 'modules/events/addEvent', payload: event });
    };

    return (
        <div className="p-8 h-full flex flex-col">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-3xl font-bold">Manajemen Event</h1>
                <Button onClick={() => handleOpenModal()}>Buat Event</Button>
            </div>
            <div className="flex-grow bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-y-auto">
                 <table className="w-full text-sm">
                    <thead><tr><th className="p-4 text-left">Nama Event</th><th className="p-4 text-left">Tanggal</th><th className="p-4 text-left">Kelas Tiket</th><th className="p-4">Aksi</th></tr></thead>
                    <tbody>
                        {events.map(event => (
                            <tr key={event.id} className="border-t dark:border-gray-700">
                                <td className="p-4 font-medium">{event.name}</td>
                                <td className="p-4">
                                    {new Date(event.date).toLocaleDateString('id-ID')}
                                    {event.startTime && event.endTime && (
                                        <span className="block text-xs text-gray-500">{event.startTime} - {event.endTime}</span>
                                    )}
                                </td>
                                <td className="p-4 text-xs">
                                    {event.ticketTiers.map(t => <div key={t.id}>{t.name} (Rp{t.price.toLocaleString('id-ID')})</div>)}
                                </td>
                                <td className="p-4">
                                    <Button onClick={() => handleOpenModal(event)} variant="secondary" size="sm">Ubah</Button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
            <EventModal isOpen={isModalOpen} onClose={() => setModalOpen(false)} onSave={handleSave} existingEvent={editingEvent}/>
        </div>
    );
};

const TicketSaleModal: React.FC<{ isOpen: boolean; onClose: () => void; }> = ({ isOpen, onClose }) => {
    const { state, dispatch } = useAppContext();
    const [eventId, setEventId] = useState('');
    const [customerId, setCustomerId] = useState('');
    const [tierId, setTierId] = useState('');
    const [quantity, setQuantity] = useState(1);
    const [paymentAccountId, setPaymentAccountId] = useState('');

    const cashAccounts = useMemo(() => state.accounts.filter(a => a.isCashAccount), [state.accounts]);
    
    const selectedEvent = useMemo(() => state.events.find(e => e.id === eventId), [eventId, state.events]);
    const selectedTier = useMemo(() => selectedEvent?.ticketTiers.find(t => t.id === tierId), [tierId, selectedEvent]);
    const totalPrice = useMemo(() => (selectedTier?.price || 0) * quantity, [selectedTier, quantity]);

    useEffect(() => {
        if (!isOpen) {
            setEventId(''); setCustomerId(''); setTierId(''); setQuantity(1); setPaymentAccountId('');
        }
    }, [isOpen]);
    
    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const customerName = state.customers.find(c => c.id === customerId)?.name || 'Umum';
        dispatch({ type: 'modules/events/addTicketSale', payload: { eventId, customerId, customerName, ticketTierId: tierId, quantity, totalPrice, paymentAccountId } });
        onClose();
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Jual Tiket Baru">
            <form onSubmit={handleSubmit} className="space-y-4">
                <Select value={eventId} onChange={e => { setEventId(e.target.value); setTierId(''); }} required>
                    <option value="">-- Pilih Event --</option>
                    {state.events.map(e => <option key={e.id} value={e.id}>{e.name}</option>)}
                </Select>
                 <Select value={customerId} onChange={e => setCustomerId(e.target.value)} required>
                    <option value="">-- Pilih Pelanggan --</option>
                    {state.customers.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </Select>
                 <Select value={tierId} onChange={e => setTierId(e.target.value)} disabled={!selectedEvent} required>
                    <option value="">-- Pilih Kelas Tiket --</option>
                    {selectedEvent?.ticketTiers.map(t => <option key={t.id} value={t.id}>{t.name} (Rp{t.price.toLocaleString('id-ID')})</option>)}
                </Select>
                <Input type="number" value={quantity} onChange={e => setQuantity(Number(e.target.value))} min="1" placeholder="Jumlah" />
                <Select value={paymentAccountId} onChange={e => setPaymentAccountId(e.target.value)} required>
                    <option value="">-- Pilih Tujuan Pembayaran --</option>
                    {cashAccounts.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </Select>
                <p className="text-xl font-bold">Total: Rp{totalPrice.toLocaleString('id-ID')}</p>
                 <div className="flex justify-end gap-2 pt-4">
                    <Button variant="secondary" onClick={onClose}>Batal</Button>
                    <Button type="submit">Jual Tiket</Button>
                </div>
            </form>
        </Modal>
    );
};

export const TicketSalesPage: React.FC = () => {
    const { state } = useAppContext();
    const { ticketSales, events, customers } = state;
    const [isModalOpen, setModalOpen] = useState(false);

    const salesDetails = useMemo(() => {
        return ticketSales.map(sale => {
            const event = events.find(e => e.id === sale.eventId);
            const tier = event?.ticketTiers.find(t => t.id === sale.ticketTierId);
            return {
                ...sale,
                eventName: event?.name || 'N/A',
                customerName: sale.customerName || customers.find(c => c.id === sale.customerId)?.name || 'N/A',
                totalPrice: sale.totalPrice
            }
        });
    }, [ticketSales, events, customers]);

    return (
        <div className="p-8 h-full flex flex-col">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-3xl font-bold">Penjualan Tiket</h1>
                <Button onClick={() => setModalOpen(true)}>Jual Tiket</Button>
            </div>
             <div className="flex-grow bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-y-auto">
                 <table className="w-full text-sm">
                    <thead><tr><th className="p-4 text-left">Event</th><th className="p-4 text-left">Pelanggan</th><th className="p-4 text-left">Total Harga</th><th className="p-4 text-left">Tanggal Beli</th></tr></thead>
                    <tbody>
                        {salesDetails.map(sale => (
                            <tr key={sale.id} className="border-t dark:border-gray-700">
                                <td className="p-4 font-medium">{sale.eventName}</td>
                                <td className="p-4">{sale.customerName}</td>
                                <td className="p-4">Rp{sale.totalPrice.toLocaleString('id-ID')}</td>
                                <td className="p-4">{new Date(sale.purchaseDate).toLocaleDateString('id-ID')}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
            <TicketSaleModal isOpen={isModalOpen} onClose={() => setModalOpen(false)} />
        </div>
    );
};

export const AudienceListPage: React.FC = () => {
    const { state } = useAppContext();
    const { events, ticketSales, customers } = state;
    const [selectedEventId, setSelectedEventId] = useState('');

    const audienceData = useMemo(() => {
        if (!selectedEventId) return [];
        return ticketSales
            .filter(sale => sale.eventId === selectedEventId)
            .map(sale => {
                const customer = customers.find(c => c.id === sale.customerId);
                return {
                    ...sale,
                    customerName: sale.customerName || customer?.name || 'Unknown',
                    customerContact: customer?.phone || customer?.email || 'N/A',
                    totalPrice: sale.totalPrice
                };
            });
    }, [selectedEventId, ticketSales, customers, events]);

    return (
        <div className="p-8 h-full flex flex-col">
            <h1 className="text-3xl font-bold mb-6">Data Audiens</h1>
            <Card className="mb-4">
                <Label>Pilih Event</Label>
                <Select value={selectedEventId} onChange={e => setSelectedEventId(e.target.value)}>
                    <option value="">-- Tampilkan Audiens untuk Event --</option>
                    {events.map(event => <option key={event.id} value={event.id}>{event.name}</option>)}
                </Select>
            </Card>
            <Card className="flex-grow overflow-y-auto">
                <table className="w-full text-sm">
                    <thead className="text-xs uppercase bg-gray-50 dark:bg-gray-700">
                        <tr>
                            <th className="p-4 text-left">Nama Pelanggan</th>
                            <th className="p-4 text-left">Kontak</th>
                            <th className="p-4 text-left">Jumlah Tiket</th>
                            <th className="p-4 text-left">Total Bayar</th>
                        </tr>
                    </thead>
                    <tbody>
                        {audienceData.map(aud => (
                            <tr key={aud.id} className="border-t dark:border-gray-700">
                                <td className="p-4 font-medium">{aud.customerName}</td>
                                <td className="p-4">{aud.customerContact}</td>
                                <td className="p-4">{aud.quantity}</td>
                                <td className="p-4">Rp{aud.totalPrice.toLocaleString('id-ID')}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </Card>
        </div>
    );
};

export const CreateEventPage: React.FC = () => {
    // The creation logic is handled by the modal within the list page
    return <EventManagementPage />;
};
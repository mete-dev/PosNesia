// This is a new file: components/SalesCRM.tsx
import React, { useState, useMemo } from 'react';
import { useAppContext } from '../hooks/useAppContext';
import { Lead } from '../types';
import { Card, Button, Modal, Input, Select, Label } from './ui';

const LeadModal: React.FC<{
    isOpen: boolean;
    onClose: () => void;
    onSave: (lead: Omit<Lead, 'id' | 'status'>) => void;
}> = ({ isOpen, onClose, onSave }) => {
    const { state } = useAppContext();
    const [formData, setFormData] = useState<Omit<Lead, 'id' | 'status'>>({
        name: '', contact: '', source: '', assignedToId: ''
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSave(formData);
        onClose();
    };

    const footer = (
        <>
            <button type="button" onClick={onClose} className="px-4 py-2 rounded-md bg-gray-200 dark:bg-gray-600">Batal</button>
            <Button type="submit" onClick={handleSubmit}>Simpan Prospek</Button>
        </>
    );

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Tambah Prospek Baru" footer={footer}>
            <form onSubmit={handleSubmit} className="space-y-4">
                <Input value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} placeholder="Nama Prospek" required />
                <Input value={formData.contact} onChange={e => setFormData({...formData, contact: e.target.value})} placeholder="Kontak (Email/Telepon)" required />
                <Input value={formData.source} onChange={e => setFormData({...formData, source: e.target.value})} placeholder="Sumber Prospek (e.g., Website, Pameran)" />
                <Select value={formData.assignedToId || ''} onChange={e => setFormData({...formData, assignedToId: e.target.value})}>
                    <option value="">-- Tugaskan ke Staf --</option>
                    {state.staff.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                </Select>
            </form>
        </Modal>
    );
};


export const LeadManagementPage: React.FC = () => {
    const { state, dispatch } = useAppContext();
    const { leads, staff } = state;
    const [isModalOpen, setModalOpen] = useState(false);

    const handleSaveLead = (leadData: Omit<Lead, 'id' | 'status'>) => {
        dispatch({ type: 'crm/addLead', payload: leadData });
    };

    const staffMap = useMemo(() => new Map(staff.map(s => [s.id, s.name])), [staff]);

    return (
        <div className="p-8 h-full flex flex-col">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white">CRM - Manajemen Prospek</h1>
                <Button onClick={() => setModalOpen(true)}>Tambah Prospek</Button>
            </div>
            <Card className="flex-grow overflow-y-auto">
                <table className="w-full text-sm">
                    <thead className="text-xs uppercase bg-gray-50 dark:bg-gray-700">
                        <tr>
                            <th className="px-6 py-3 text-left">Nama</th>
                            <th className="px-6 py-3 text-left">Kontak</th>
                            <th className="px-6 py-3 text-left">Status</th>
                            <th className="px-6 py-3 text-left">Ditugaskan Kepada</th>
                        </tr>
                    </thead>
                    <tbody>
                        {leads.map(lead => (
                            <tr key={lead.id} className="border-b dark:border-gray-700">
                                <td className="px-6 py-4 font-medium">{lead.name}</td>
                                <td className="px-6 py-4">{lead.contact}</td>
                                <td className="px-6 py-4">{lead.status}</td>
                                <td className="px-6 py-4">{lead.assignedToId ? staffMap.get(lead.assignedToId) : 'Belum Ditugaskan'}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </Card>
            <LeadModal isOpen={isModalOpen} onClose={() => setModalOpen(false)} onSave={handleSaveLead} />
        </div>
    );
};
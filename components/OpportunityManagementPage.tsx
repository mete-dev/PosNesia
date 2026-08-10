// This is a new file: components/OpportunityManagementPage.tsx
import React, { useState, useMemo } from 'react';
import { useAppContext } from '../hooks/useAppContext';
import { Opportunity } from '../types';
import { Card, Button, Modal, Input, Select, Label } from './ui';

const OpportunityModal: React.FC<{
    isOpen: boolean;
    onClose: () => void;
    onSave: (data: Omit<Opportunity, 'id' | 'stage'>) => void;
}> = ({ isOpen, onClose, onSave }) => {
    const { state } = useAppContext();
    const [formData, setFormData] = useState<Omit<Opportunity, 'id' | 'stage' | 'leadId'>>({
        name: '',
        amount: 0,
        closeDate: new Date().toISOString().split('T')[0],
        assignedToId: undefined,
    });
    const [leadId, setLeadId] = useState('');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSave({ ...formData, leadId });
        onClose();
    };

    const footer = (
        <>
            <button type="button" onClick={onClose} className="px-4 py-2 rounded-md bg-gray-200 dark:bg-gray-600">Batal</button>
            <Button type="submit" onClick={handleSubmit}>Simpan Peluang</Button>
        </>
    );

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Tambah Peluang Baru" footer={footer}>
            <form onSubmit={handleSubmit} className="space-y-4">
                <Input value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} placeholder="Nama Peluang (cth: Proyek Website PT. ABC)" required />
                <Select value={leadId} onChange={e => setLeadId(e.target.value)} required>
                    <option value="">-- Pilih dari Prospek --</option>
                    {state.leads.map(l => <option key={l.id} value={l.id}>{l.name}</option>)}
                </Select>
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <Label>Nilai Peluang (Rp)</Label>
                        <Input type="number" value={formData.amount} onChange={e => setFormData({...formData, amount: Number(e.target.value)})} required />
                    </div>
                     <div>
                        <Label>Perkiraan Tanggal Tutup</Label>
                        <Input type="date" value={formData.closeDate} onChange={e => setFormData({...formData, closeDate: e.target.value})} required />
                    </div>
                </div>
                <Select value={formData.assignedToId || ''} onChange={e => setFormData({...formData, assignedToId: e.target.value})}>
                    <option value="">-- Tugaskan ke Staf --</option>
                    {state.staff.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                </Select>
            </form>
        </Modal>
    );
};

const OpportunityCard: React.FC<{ opportunity: Opportunity }> = ({ opportunity }) => {
    const { state } = useAppContext();
    const lead = state.leads.find(l => l.id === opportunity.leadId);
    return (
        <Card className="mb-4 cursor-pointer hover:shadow-lg transition-shadow">
            <h4 className="font-bold">{opportunity.name}</h4>
            <p className="text-sm text-primary-500 font-semibold">Rp{opportunity.amount.toLocaleString('id-ID')}</p>
            <p className="text-xs text-gray-500 mt-2">Dari Prospek: {lead?.name || 'N/A'}</p>
        </Card>
    );
};

export const OpportunityManagementPage: React.FC = () => {
    const { state, dispatch } = useAppContext();
    const { opportunities } = state;
    const [isModalOpen, setModalOpen] = useState(false);

    const stages: Opportunity['stage'][] = ['Prospecting', 'Proposal', 'Negotiation', 'Closed Won', 'Closed Lost'];

    const opportunitiesByStage = useMemo(() => {
        return stages.reduce((acc, stage) => {
            acc[stage] = opportunities.filter(op => op.stage === stage);
            return acc;
        }, {} as Record<Opportunity['stage'], Opportunity[]>);
    }, [opportunities]);
    
    const handleSave = (data: any) => {
        // In a real app, this would dispatch an action.
        // dispatch({ type: 'crm/addOpportunity', payload: data });
        console.log("Saving opportunity", data);
    }

    return (
        <div className="p-8 h-full flex flex-col">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Manajemen Peluang</h1>
                <Button onClick={() => setModalOpen(true)}>Tambah Peluang</Button>
            </div>
            <div className="flex-grow grid grid-cols-5 gap-6 overflow-x-auto">
                {stages.map(stage => (
                    <div key={stage} className="bg-gray-100 dark:bg-gray-900/50 rounded-lg p-4 flex flex-col">
                        <h2 className="font-bold text-lg mb-4 text-center">{stage} ({opportunitiesByStage[stage]?.length || 0})</h2>
                        <div className="space-y-4 overflow-y-auto flex-grow">
                            {(opportunitiesByStage[stage] || []).map(opp => (
                                <OpportunityCard key={opp.id} opportunity={opp} />
                            ))}
                        </div>
                    </div>
                ))}
            </div>
             <OpportunityModal isOpen={isModalOpen} onClose={() => setModalOpen(false)} onSave={handleSave} />
        </div>
    );
};
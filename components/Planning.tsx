// This is a new file: components/Planning.tsx
import React, { useState, useMemo, useEffect } from 'react';
import { useAppContext } from '../hooks/useAppContext';
import { CustomerPlan, PlanTemplate } from '../types';
import { Button, Modal, Select, Input, Label } from './ui';

const PlanModal: React.FC<{
    isOpen: boolean;
    onClose: () => void;
    onSave: (data: Omit<CustomerPlan, 'id'>) => void;
}> = ({ isOpen, onClose, onSave }) => {
    const { state } = useAppContext();
    const [customerId, setCustomerId] = useState('');
    const [title, setTitle] = useState('');
    const [activities, setActivities] = useState<{ title: string; completed: boolean }[]>([{ title: '', completed: false }]);
    const [templateId, setTemplateId] = useState('');

    const handleTemplateChange = (id: string) => {
        setTemplateId(id);
        const template = state.planTemplates.find(t => t.id === id);
        if (template) {
            setActivities(template.activities.map(act => ({ ...act, completed: false })));
        } else {
            setActivities([{ title: '', completed: false }]);
        }
    };

    const handleActivityChange = (index: number, value: string) => {
        const newActivities = [...activities];
        newActivities[index].title = value;
        setActivities(newActivities);
    };

    const addActivity = () => {
        setActivities([...activities, { title: '', completed: false }]);
    };
    
    const removeActivity = (index: number) => {
        setActivities(activities.filter((_, i) => i !== index));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSave({ customerId, title, activities });
        onClose();
    };

    const footer = (
        <>
            <button type="button" onClick={onClose} className="px-4 py-2 rounded-md bg-gray-200 dark:bg-gray-600">Batal</button>
            <Button type="submit" onClick={handleSubmit}>Simpan Rencana</Button>
        </>
    );

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Buat Rencana Klien Baru" footer={footer}>
            <form onSubmit={handleSubmit} className="space-y-4">
                 <div>
                    <Label>Gunakan Template</Label>
                    <Select value={templateId} onChange={e => handleTemplateChange(e.target.value)}>
                        <option value="">-- Buat dari Awal --</option>
                        {state.planTemplates.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                    </Select>
                </div>
                <div>
                    <Label>Klien</Label>
                    <Select value={customerId} onChange={e => setCustomerId(e.target.value)} required>
                        <option value="">-- Pilih Klien --</option>
                        {state.customers.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </Select>
                </div>
                <div>
                    <Label>Judul Rencana</Label>
                    <Input value={title} onChange={e => setTitle(e.target.value)} required />
                </div>
                <div>
                    <Label>Aktivitas</Label>
                    <div className="space-y-2 max-h-48 overflow-y-auto">
                        {activities.map((act, index) => (
                            <div key={index} className="flex items-center gap-2">
                                <Input value={act.title} onChange={e => handleActivityChange(index, e.target.value)} placeholder={`Aktivitas #${index + 1}`} required />
                                <button type="button" onClick={() => removeActivity(index)} className="text-red-500 font-bold text-xl">&times;</button>
                            </div>
                        ))}
                    </div>
                    <button type="button" onClick={addActivity} className="text-sm text-primary-600 mt-2">+ Tambah Aktivitas</button>
                </div>
            </form>
        </Modal>
    );
};

export const CustomerPlansPage: React.FC = () => {
    const { state, dispatch } = useAppContext();
    const { customerPlans, customers } = state;
    const [isModalOpen, setModalOpen] = useState(false);

    const handleSavePlan = (data: Omit<CustomerPlan, 'id'>) => {
        dispatch({ type: 'modules/planning/addPlan', payload: data });
    };
    
    const handleToggleActivity = (planId: string, activityIndex: number) => {
        dispatch({ type: 'modules/planning/toggleActivity', payload: { planId, activityIndex } });
    };

    const customerMap = useMemo(() => new Map(customers.map(c => [c.id, c.name])), [customers]);

    return (
        <div className="p-8 h-full flex flex-col">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Perencanaan Klien</h1>
                <Button onClick={() => setModalOpen(true)}>Buat Rencana Baru</Button>
            </div>
            <div className="flex-grow grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 overflow-y-auto">
                {customerPlans.map(plan => (
                    <div key={plan.id} className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-md h-fit">
                        <h2 className="font-bold text-lg text-primary-600 dark:text-primary-400">{plan.title}</h2>
                        <p className="text-sm text-gray-500 mb-4">Untuk: {customerMap.get(plan.customerId) || 'N/A'}</p>
                        <div className="space-y-2">
                            {plan.activities.map((act, index) => (
                                <label key={index} className="flex items-center gap-2">
                                    <input
                                        type="checkbox"
                                        checked={act.completed}
                                        onChange={() => handleToggleActivity(plan.id, index)}
                                        className="rounded text-primary-500"
                                    />
                                    <span className={`${act.completed ? 'line-through text-gray-500' : ''}`}>{act.title}</span>
                                </label>
                            ))}
                        </div>
                    </div>
                ))}
            </div>
            <PlanModal isOpen={isModalOpen} onClose={() => setModalOpen(false)} onSave={handleSavePlan} />
        </div>
    );
};


export const CreatePlanPage: React.FC = () => {
    // This component can be simple and just show the main page,
    // as the creation logic is handled by the modal on the main page.
    return <CustomerPlansPage />;
};

const PlanTemplateModal: React.FC<{
    isOpen: boolean;
    onClose: () => void;
    onSave: (data: Omit<PlanTemplate, 'id'> | PlanTemplate) => void;
    existingTemplate: PlanTemplate | null;
}> = ({ isOpen, onClose, onSave, existingTemplate }) => {
    const [name, setName] = useState('');
    const [activities, setActivities] = useState<{ title: string }[]>([{ title: '' }]);

    useEffect(() => {
        if (isOpen) {
            setName(existingTemplate?.name || '');
            setActivities(existingTemplate?.activities.length ? existingTemplate.activities : [{ title: '' }]);
        }
    }, [isOpen, existingTemplate]);

    const handleActivityChange = (index: number, value: string) => {
        const newActivities = [...activities];
        newActivities[index].title = value;
        setActivities(newActivities);
    };

    const addActivity = () => setActivities([...activities, { title: '' }]);
    const removeActivity = (index: number) => setActivities(activities.filter((_, i) => i !== index));

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const finalActivities = activities.filter(a => a.title.trim() !== '');
        if (existingTemplate) {
            onSave({ ...existingTemplate, name, activities: finalActivities });
        } else {
            onSave({ name, activities: finalActivities });
        }
        onClose();
    };
    
    return (
        <Modal isOpen={isOpen} onClose={onClose} title={existingTemplate ? "Ubah Template" : "Buat Template Baru"}>
            <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                    <Label>Nama Template</Label>
                    <Input value={name} onChange={e => setName(e.target.value)} required />
                </div>
                <div>
                    <Label>Aktivitas</Label>
                    <div className="space-y-2 max-h-60 overflow-y-auto pr-2">
                         {activities.map((act, index) => (
                            <div key={index} className="flex items-center gap-2">
                                <Input value={act.title} onChange={e => handleActivityChange(index, e.target.value)} placeholder={`Aktivitas #${index + 1}`} required />
                                {activities.length > 1 && <button type="button" onClick={() => removeActivity(index)} className="text-red-500 font-bold text-xl">&times;</button>}
                            </div>
                        ))}
                    </div>
                     <button type="button" onClick={addActivity} className="text-sm text-primary-600 mt-2">+ Tambah Aktivitas</button>
                </div>
                 <div className="flex justify-end gap-2 pt-4">
                    <button type="button" onClick={onClose} className="px-4 py-2 rounded-md bg-gray-200 dark:bg-gray-600">Batal</button>
                    <Button type="submit">Simpan Template</Button>
                </div>
            </form>
        </Modal>
    );
}

export const PlanTemplatesPage: React.FC = () => {
    const { state, dispatch } = useAppContext();
    const { planTemplates } = state;
    const [isModalOpen, setModalOpen] = useState(false);
    const [editingTemplate, setEditingTemplate] = useState<PlanTemplate | null>(null);
    
    const handleOpenModal = (template: PlanTemplate | null) => {
        setEditingTemplate(template);
        setModalOpen(true);
    };

    const handleSave = (data: Omit<PlanTemplate, 'id'> | PlanTemplate) => {
        if ('id' in data) {
            dispatch({ type: 'modules/planning/updateTemplate', payload: data });
        } else {
            dispatch({ type: 'modules/planning/addTemplate', payload: data });
        }
    };

     return (
        <div className="p-8 h-full flex flex-col">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Template Rencana</h1>
                <Button onClick={() => handleOpenModal(null)}>Buat Template Baru</Button>
            </div>
            <div className="flex-grow grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 overflow-y-auto">
                {planTemplates.map(template => (
                    <div key={template.id} className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-md h-fit">
                        <div className="flex justify-between items-start">
                             <h2 className="font-bold text-lg">{template.name}</h2>
                             <button onClick={() => handleOpenModal(template)} className="text-xs font-semibold text-primary-500">Ubah</button>
                        </div>
                        <ul className="list-disc ml-6 mt-2 text-sm">
                            {template.activities.map((act, index) => (
                                <li key={index}>{act.title}</li>
                            ))}
                        </ul>
                    </div>
                ))}
            </div>
             <PlanTemplateModal isOpen={isModalOpen} onClose={() => setModalOpen(false)} onSave={handleSave} existingTemplate={editingTemplate} />
        </div>
    );
};
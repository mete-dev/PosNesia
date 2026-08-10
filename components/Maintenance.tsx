// This is a new file: components/Maintenance.tsx
import React, { useState, useMemo } from 'react';
import { useAppContext } from '../hooks/useAppContext';
import { MaintenanceRequest, MaintenanceTeam, MaintenanceScheduleItem, Asset, AssetCategory, Staff } from '../types';
import { Button, Modal, Select, Textarea, Label, Input } from './ui';

const MaintenanceRequestModal: React.FC<{
    isOpen: boolean;
    onClose: () => void;
    onSave: (data: Omit<MaintenanceRequest, 'id' | 'reportedById' | 'status'>) => void;
}> = ({ isOpen, onClose, onSave }) => {
    const { state } = useAppContext();
    const { assets, assetCategories } = state;
    const [assetId, setAssetId] = useState('');
    const [issue, setIssue] = useState('');

    const categoryMap = useMemo(() =>
        new Map(assetCategories.map((cat: AssetCategory) => [cat.id, cat.name])),
        [assetCategories]
    );

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSave({ assetId, issue, requestDate: new Date().toISOString() });
        onClose();
    };

    const footer = (
        <>
            <button type="button" onClick={onClose} className="px-4 py-2 rounded-md bg-gray-200 dark:bg-gray-600">Batal</button>
            <Button type="submit" onClick={handleSubmit}>Kirim Permintaan</Button>
        </>
    );

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Buat Permintaan Maintenance" footer={footer}>
            <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                    <Label htmlFor="asset">Aset yang Bermasalah</Label>
                    <Select id="asset" value={assetId} onChange={e => setAssetId(e.target.value)} required>
                        <option value="">-- Pilih Aset --</option>
                        {assets.map((a: Asset) => <option key={a.id} value={a.id}>{a.name} ({categoryMap.get(a.assetCategoryId) || 'N/A'})</option>)}
                    </Select>
                </div>
                <div>
                    <Label htmlFor="issue">Deskripsi Masalah</Label>
                    <Textarea id="issue" value={issue} onChange={e => setIssue(e.target.value)} required />
                </div>
            </form>
        </Modal>
    );
};

export const MaintenanceRequestsPage: React.FC = () => {
    const { state, dispatch } = useAppContext();
    const { maintenanceRequests, assets, staff } = state;
    const [isModalOpen, setModalOpen] = useState(false);

    const handleSaveRequest = (data: Omit<MaintenanceRequest, 'id' | 'reportedById' | 'status'>) => {
        dispatch({ type: 'modules/maint/addRequest', payload: data });
    };

    const assetMap = new Map(assets.map(a => [a.id, a.name]));
    const staffMap = new Map(staff.map(s => [s.id, s.name]));

    return (
        <div className="p-8 h-full flex flex-col">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Permintaan Maintenance</h1>
                <Button onClick={() => setModalOpen(true)}>Buat Permintaan</Button>
            </div>
            <div className="flex-grow bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-y-auto">
                 <table className="w-full text-sm text-left text-gray-500 dark:text-gray-400">
                    <thead className="text-xs text-gray-700 uppercase bg-gray-50 dark:bg-gray-700 dark:text-gray-400">
                        <tr>
                            <th className="px-6 py-3">Aset</th>
                            <th className="px-6 py-3">Masalah</th>
                            <th className="px-6 py-3">Pelapor</th>
                            <th className="px-6 py-3">Status</th>
                        </tr>
                    </thead>
                    <tbody>
                        {maintenanceRequests.map((req: MaintenanceRequest) => (
                            <tr key={req.id} className="border-b dark:border-gray-700">
                                <td className="px-6 py-4 font-medium">{assetMap.get(req.assetId) ?? 'Aset Dihapus'}</td>
                                <td className="px-6 py-4">{req.issue}</td>
                                <td className="px-6 py-4">{staffMap.get(req.reportedById) ?? 'Staf Tidak Dikenal'}</td>
                                <td className="px-6 py-4">{req.status}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
            <MaintenanceRequestModal isOpen={isModalOpen} onClose={() => setModalOpen(false)} onSave={handleSaveRequest} />
        </div>
    );
};

export const MaintenanceSchedulePage: React.FC = () => {
    const { state } = useAppContext();
    const { maintenanceSchedule, assets, maintenanceTeams } = state;
    
    const assetMap = new Map(assets.map(a => [a.id, a.name]));
    const teamMap = new Map(maintenanceTeams.map(t => [t.id, t.name]));

    return (
        <div className="p-8 h-full flex flex-col">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-3xl font-bold">Jadwal Maintenance</h1>
                <Button>Buat Jadwal Baru</Button>
            </div>
            <div className="flex-grow bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-y-auto">
                <table className="w-full text-sm text-left text-gray-500 dark:text-gray-400">
                    <thead className="text-xs text-gray-700 uppercase bg-gray-50 dark:bg-gray-700 dark:text-gray-400">
                        <tr>
                            <th className="px-6 py-3">Tanggal</th>
                            <th className="px-6 py-3">Aset</th>
                            <th className="px-6 py-3">Tugas</th>
                            <th className="px-6 py-3">Tim</th>
                            <th className="px-6 py-3">Status</th>
                        </tr>
                    </thead>
                    <tbody>
                        {maintenanceSchedule.map((item: MaintenanceScheduleItem) => (
                            <tr key={item.id} className="border-b dark:border-gray-700">
                                <td className="px-6 py-4 font-medium">{new Date(item.scheduledDate).toLocaleDateString('id-ID')}</td>
                                <td className="px-6 py-4">{assetMap.get(item.assetId) ?? 'N/A'}</td>
                                <td className="px-6 py-4">{item.task}</td>
                                <td className="px-6 py-4">{item.teamId ? teamMap.get(item.teamId) : 'N/A'}</td>
                                <td className="px-6 py-4">{item.status}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export const MaintenanceTeamsPage: React.FC = () => {
    const { state } = useAppContext();
    const { maintenanceTeams, staff } = state;
    
    const staffMap = new Map(staff.map(s => [s.id, s.name]));

    return (
        <div className="p-8 h-full flex flex-col">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-3xl font-bold">Tim Maintenance</h1>
                <Button>Buat Tim Baru</Button>
            </div>
            <div className="flex-grow grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 overflow-y-auto">
                {maintenanceTeams.map((team: MaintenanceTeam) => (
                    <div key={team.id} className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow h-fit">
                        <h2 className="text-lg font-bold">{team.name}</h2>
                        <ul className="list-disc ml-6 mt-2 text-sm">
                            {team.memberIds.map(id => <li key={id}>{staffMap.get(id) ?? 'Unknown'}</li>)}
                        </ul>
                    </div>
                ))}
            </div>
        </div>
    );
};
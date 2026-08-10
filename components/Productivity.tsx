// This is a new file: components/Productivity.tsx
import React from 'react';
import { useAppContext } from '../hooks/useAppContext';
import { ApprovalRequest } from '../types';
import { Card, Button } from './ui';

export const ApprovalsPage: React.FC = () => {
    const { state, dispatch } = useAppContext();
    const { approvalRequests, staff } = state;

    const handleUpdateStatus = (approvalId: string, status: ApprovalRequest['status']) => {
        dispatch({ type: 'approvals/updateStatus', payload: { approvalId, status } });
    };

    const pendingApprovals = approvalRequests.filter(a => a.status === 'Pending');

    return (
        <div className="p-8 h-full flex flex-col">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-6">Persetujuan</h1>
            <Card className="flex-grow overflow-y-auto">
                {pendingApprovals.length === 0 ? (
                    <p className="text-gray-500">Tidak ada permintaan persetujuan yang tertunda.</p>
                ) : (
                    pendingApprovals.map(req => (
                        <div key={req.id} className="p-4 border-b dark:border-gray-700 flex justify-between items-center">
                            <div>
                                <p className="font-bold">{req.type} #{req.referenceId}</p>
                                <p className="text-sm text-gray-600 dark:text-gray-400">{req.details}</p>
                                <p className="text-xs text-gray-500">Diminta oleh: {staff.find(s=>s.id === req.requesterId)?.name || 'Unknown'}</p>
                            </div>
                            <div className="flex gap-2">
                                <Button onClick={() => handleUpdateStatus(req.id, 'Approved')} className="bg-green-600 hover:bg-green-700">Setujui</Button>
                                <Button onClick={() => handleUpdateStatus(req.id, 'Rejected')} className="bg-red-600 hover:bg-red-700">Tolak</Button>
                            </div>
                        </div>
                    ))
                )}
            </Card>
        </div>
    );
};
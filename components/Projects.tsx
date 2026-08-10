// This is a new file: components/Projects.tsx
import React, { useMemo, useState, useEffect } from 'react';
import { useAppContext } from '../hooks/useAppContext';
import { Project, ProjectTask } from '../types';
import { Card, Button, Modal, Input, Select, Textarea, Label } from './ui';

const ProjectModal: React.FC<{
    isOpen: boolean;
    onClose: () => void;
    onSave: (data: Omit<Project, 'id'> | Project) => void;
    existingProject: Project | null;
}> = ({ isOpen, onClose, onSave, existingProject }) => {
    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [status, setStatus] = useState<Project['status']>('Not Started');
    const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
    const [deadline, setDeadline] = useState('');
    const [budget, setBudget] = useState<number | string>('');

    useEffect(() => {
        if(isOpen) {
            setName(existingProject?.name || '');
            setDescription(existingProject?.description || '');
            setStatus(existingProject?.status || 'Not Started');
            setStartDate(existingProject ? new Date(existingProject.startDate).toISOString().split('T')[0] : new Date().toISOString().split('T')[0]);
            setDeadline(existingProject ? new Date(existingProject.deadline).toISOString().split('T')[0] : '');
            setBudget(existingProject?.budget || '');
        }
    }, [isOpen, existingProject]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const projectData = {
            name,
            description,
            status,
            startDate,
            deadline: deadline || new Date().toISOString(),
            budget: Number(budget)
        };

        if(existingProject) {
            onSave({ ...existingProject, ...projectData });
        } else {
            onSave(projectData);
        }
        onClose();
    };
    
    const footer = (
        <>
            <button type="button" onClick={onClose} className="px-4 py-2 rounded-md bg-gray-200 dark:bg-gray-600">Batal</button>
            <Button type="submit" onClick={handleSubmit}>Simpan Proyek</Button>
        </>
    );

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={existingProject ? "Ubah Proyek" : "Proyek Baru"} footer={footer}>
            <form onSubmit={handleSubmit} className="space-y-4">
                <Input value={name} onChange={e => setName(e.target.value)} placeholder="Nama Proyek" required />
                <Textarea value={description} onChange={e => setDescription(e.target.value)} placeholder="Deskripsi Proyek" />
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <Label>Tanggal Mulai</Label>
                        <Input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} required />
                    </div>
                    <div>
                        <Label>Tenggat Waktu</Label>
                        <Input type="date" value={deadline} onChange={e => setDeadline(e.target.value)} required />
                    </div>
                </div>
                 <div>
                    <Label>Anggaran (Rp)</Label>
                    <Input type="number" value={budget} onChange={e => setBudget(e.target.value)} required />
                </div>
                <Select value={status} onChange={e => setStatus(e.target.value as Project['status'])}>
                    <option value="Not Started">Belum Dimulai</option>
                    <option value="In Progress">Sedang Berjalan</option>
                    <option value="Completed">Selesai</option>
                    <option value="On Hold">Ditunda</option>
                </Select>
            </form>
        </Modal>
    );
};

export const ProjectsPage: React.FC = () => {
    const { state, dispatch } = useAppContext();
    const { projects } = state;
    const [isModalOpen, setModalOpen] = useState(false);
    const [editingProject, setEditingProject] = useState<Project | null>(null);

    const handleOpenModal = (project: Project | null) => {
        setEditingProject(project);
        setModalOpen(true);
    };

    const handleSaveProject = (data: Omit<Project, 'id'> | Project) => {
        if ('id' in data) {
            dispatch({ type: 'projects/update', payload: data });
        } else {
            dispatch({ type: 'projects/add', payload: data as Omit<Project, 'id'> });
        }
    };

    return (
        <div className="p-8 h-full flex flex-col">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Proyek</h1>
                <Button onClick={() => handleOpenModal(null)}>Proyek Baru</Button>
            </div>
            <div className="flex-grow grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 overflow-y-auto">
                {projects.map(project => (
                    <Card key={project.id} className="h-fit flex flex-col">
                        <div className="flex-grow">
                            <h2 className="text-xl font-bold text-primary-600 dark:text-primary-400">{project.name}</h2>
                            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{project.status}</p>
                            <p className="mt-4 text-gray-700 dark:text-gray-300">{project.description}</p>
                        </div>
                        <div className="mt-4 text-right">
                            <Button variant="secondary" onClick={() => handleOpenModal(project)} className="text-xs">Ubah</Button>
                        </div>
                    </Card>
                ))}
            </div>
            <ProjectModal isOpen={isModalOpen} onClose={() => setModalOpen(false)} onSave={handleSaveProject} existingProject={editingProject} />
        </div>
    );
};

const TaskModal: React.FC<{
    isOpen: boolean;
    onClose: () => void;
    onSave: (data: Omit<ProjectTask, 'id' | 'status'>) => void;
}> = ({ isOpen, onClose, onSave }) => {
    const { state } = useAppContext();
    const [projectId, setProjectId] = useState('');
    const [title, setTitle] = useState('');
    const [assignedToId, setAssignedToId] = useState('');
    const [startDate, setStartDate] = useState('');
    const [dueDate, setDueDate] = useState('');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSave({ projectId, title, assignedToId: assignedToId || undefined, startDate, dueDate });
        onClose();
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Tugas Baru">
            <form onSubmit={handleSubmit} className="space-y-4">
                 <Select value={projectId} onChange={e => setProjectId(e.target.value)} required>
                    <option value="">-- Pilih Proyek --</option>
                    {state.projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                </Select>
                <Input value={title} onChange={e => setTitle(e.target.value)} placeholder="Judul Tugas" required />
                 <div className="grid grid-cols-2 gap-4">
                    <div>
                        <Label>Tanggal Mulai</Label>
                        <Input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} />
                    </div>
                    <div>
                        <Label>Tenggat Waktu</Label>
                        <Input type="date" value={dueDate} onChange={e => setDueDate(e.target.value)} />
                    </div>
                </div>
                <Select value={assignedToId} onChange={e => setAssignedToId(e.target.value)}>
                    <option value="">-- Tugaskan ke Staf --</option>
                    {state.staff.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                </Select>
                 <div className="flex justify-end gap-2 pt-4">
                    <button type="button" onClick={onClose} className="px-4 py-2 rounded-md bg-gray-200 dark:bg-gray-600">Batal</button>
                    <Button type="submit">Simpan Tugas</Button>
                </div>
            </form>
        </Modal>
    );
}

export const ProjectTasksPage: React.FC = () => {
    const { state, dispatch } = useAppContext();
    const { projectTasks, projects, staff } = state;
    const [isModalOpen, setModalOpen] = useState(false);

    const tasksByStatus = useMemo(() => {
        return projectTasks.reduce((acc, task) => {
            if (!acc[task.status]) acc[task.status] = [];
            acc[task.status].push(task);
            return acc;
        }, {} as Record<ProjectTask['status'], ProjectTask[]>);
    }, [projectTasks]);

    const handleSaveTask = (data: Omit<ProjectTask, 'id' | 'status'>) => {
        dispatch({ type: 'projects/addTask', payload: data });
    };
    
    const projectMap = new Map(projects.map(p => [p.id, p.name]));
    const staffMap = new Map(staff.map(s => [s.id, s.name]));

    const statuses: ProjectTask['status'][] = ['To Do', 'In Progress', 'Done'];

    return (
        <div className="p-8 h-full flex flex-col">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Papan Tugas Proyek</h1>
                <Button onClick={() => setModalOpen(true)}>Tugas Baru</Button>
            </div>
            <div className="flex-grow grid grid-cols-1 md:grid-cols-3 gap-6 overflow-x-auto">
                {statuses.map(status => (
                    <div key={status} className="bg-gray-100 dark:bg-gray-900/50 rounded-lg p-4">
                        <h2 className="font-bold text-lg mb-4 text-center">{status}</h2>
                        <div className="space-y-4 overflow-y-auto h-full">
                            {(tasksByStatus[status] || []).map(task => (
                                <Card key={task.id}>
                                    <p className="font-semibold">{task.title}</p>
                                    <p className="text-xs text-primary-500">{projectMap.get(task.projectId)}</p>
                                    <p className="text-xs text-gray-500 mt-2">Ditugaskan: {task.assignedToId ? staffMap.get(task.assignedToId) : 'N/A'}</p>
                                </Card>
                            ))}
                        </div>
                    </div>
                ))}
            </div>
             <TaskModal isOpen={isModalOpen} onClose={() => setModalOpen(false)} onSave={handleSaveTask} />
        </div>
    );
};
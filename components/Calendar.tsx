// This is a new file: components/Calendar.tsx
import React, { useState, useMemo } from 'react';
import { useAppContext } from '../hooks/useAppContext';
import { CompanyEvent, Project, ProjectTask, Event } from '../types';
import { Button, Modal, Input, Textarea, Label, Select } from './ui';

const EventModal: React.FC<{
    isOpen: boolean;
    onClose: () => void;
    onSave: (event: Omit<CompanyEvent, 'id'>) => void;
    selectedDate: Date;
}> = ({ isOpen, onClose, onSave, selectedDate }) => {
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [color, setColor] = useState<'blue' | 'green' | 'red' | 'yellow' | 'purple'>('blue');
    const [startTime, setStartTime] = useState('09:00');
    const [endTime, setEndTime] = useState('10:00');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        
        const startDateTime = new Date(selectedDate);
        const [startHour, startMinute] = startTime.split(':');
        startDateTime.setHours(Number(startHour), Number(startMinute));
        
        const endDateTime = new Date(selectedDate);
        const [endHour, endMinute] = endTime.split(':');
        endDateTime.setHours(Number(endHour), Number(endMinute));

        onSave({
            title,
            description,
            color,
            start: startDateTime.toISOString(),
            end: endDateTime.toISOString(),
        });
        onClose();
    };

    if (!isOpen) return null;

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={`Tambah Acara untuk ${selectedDate.toLocaleDateString('id-ID')}`}>
            <form onSubmit={handleSubmit} className="space-y-4">
                <Input value={title} onChange={e => setTitle(e.target.value)} placeholder="Judul Acara" required />
                <Textarea value={description} onChange={e => setDescription(e.target.value)} placeholder="Deskripsi (Opsional)" />
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <Label>Waktu Mulai</Label>
                        <Input type="time" value={startTime} onChange={e => setStartTime(e.target.value)} required />
                    </div>
                     <div>
                        <Label>Waktu Selesai</Label>
                        <Input type="time" value={endTime} onChange={e => setEndTime(e.target.value)} required />
                    </div>
                </div>
                <div>
                    <Label>Warna Label</Label>
                    <Select value={color} onChange={e => setColor(e.target.value as any)}>
                        <option value="blue">Biru (Rapat)</option>
                        <option value="green">Hijau (Libur)</option>
                        <option value="red">Merah (Penting)</option>
                        <option value="yellow">Kuning (Tugas)</option>
                        <option value="purple">Ungu (Lainnya)</option>
                    </Select>
                </div>
                 <div className="flex justify-end gap-2 pt-4">
                    <Button variant="secondary" onClick={onClose}>Batal</Button>
                    <Button type="submit">Simpan Acara</Button>
                </div>
            </form>
        </Modal>
    );
};

export const CalendarPage: React.FC = () => {
    const { state, dispatch } = useAppContext();
    const { companyEvents, projects, projectTasks, events } = state;
    const [currentDate, setCurrentDate] = useState(new Date());
    const [isModalOpen, setModalOpen] = useState(false);
    const [selectedDate, setSelectedDate] = useState<Date>(new Date());

    const allCalendarEvents = useMemo(() => {
        const mappedCompanyEvents = companyEvents.map(e => ({...e, type: 'Company Event'}));
        
        const mappedProjectEvents = projects.flatMap(p => [
            { id: `proj-start-${p.id}`, title: `Mulai: ${p.name}`, start: p.startDate, end: p.startDate, color: 'purple' as const, type: 'Project' },
            { id: `proj-end-${p.id}`, title: `Deadline: ${p.name}`, start: p.deadline, end: p.deadline, color: 'red' as const, type: 'Project' }
        ]);

        const mappedTaskEvents = projectTasks.filter(t => t.dueDate).map(t => ({
            id: `task-${t.id}`,
            title: `Tugas: ${t.title}`,
            start: t.dueDate!,
            end: t.dueDate!,
            color: 'yellow' as const,
            type: 'Task'
        }));

        const mappedPublicEvents = events.map(e => ({
            id: `pub-event-${e.id}`,
            title: `Event: ${e.name}`,
            start: e.date,
            end: e.date,
            color: 'green' as const,
            type: 'Public Event'
        }));
        
        return [...mappedCompanyEvents, ...mappedProjectEvents, ...mappedTaskEvents, ...mappedPublicEvents];
    }, [companyEvents, projects, projectTasks, events]);
    
    const firstDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
    const lastDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);
    const startingDayOfWeek = firstDayOfMonth.getDay(); // 0 for Sunday, 1 for Monday, etc.
    const daysInMonth = lastDayOfMonth.getDate();

    const calendarGrid = useMemo(() => {
        const grid: (Date | null)[] = [];
        for (let i = 0; i < startingDayOfWeek; i++) {
            grid.push(null);
        }
        for (let i = 1; i <= daysInMonth; i++) {
            grid.push(new Date(currentDate.getFullYear(), currentDate.getMonth(), i));
        }
        return grid;
    }, [currentDate, daysInMonth, startingDayOfWeek]);

    const handleDateClick = (date: Date) => {
        setSelectedDate(date);
        setModalOpen(true);
    };

    const handleSaveEvent = (eventData: Omit<CompanyEvent, 'id'>) => {
        dispatch({ type: 'calendar/addEvent', payload: eventData });
    };

    const EventBadge: React.FC<{ event: {title: string, start: string, color: CompanyEvent['color']} }> = ({ event }) => {
        const colors = {
            blue: 'bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-300',
            green: 'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300',
            red: 'bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-300',
            yellow: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/50 dark:text-yellow-300',
            purple: 'bg-purple-100 text-purple-800 dark:bg-purple-900/50 dark:text-purple-300',
        };
        const startTime = new Date(event.start).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
        return (
            <div className={`text-xs p-1 rounded-md mb-1 truncate ${colors[event.color]}`}>
                <strong>{startTime}</strong> {event.title}
            </div>
        );
    };

    return (
        <div className="p-8 h-full flex flex-col">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Kalender Perusahaan</h1>
                 <div className="flex items-center gap-4">
                    <Button onClick={() => setCurrentDate(new Date(currentDate.setMonth(currentDate.getMonth() - 1)))} variant="secondary">&lt;</Button>
                    <h2 className="text-xl font-semibold">{currentDate.toLocaleString('id-ID', { month: 'long', year: 'numeric' })}</h2>
                    <Button onClick={() => setCurrentDate(new Date(currentDate.setMonth(currentDate.getMonth() + 1)))} variant="secondary">&gt;</Button>
                </div>
            </div>
             <div className="flex-grow grid grid-cols-7 grid-rows-6 gap-1 bg-white dark:bg-gray-800 p-2 rounded-lg shadow">
                {['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'].map(day => (
                    <div key={day} className="text-center font-bold text-sm text-gray-500">{day}</div>
                ))}
                {calendarGrid.map((date, index) => (
                    <div
                        key={index}
                        className={`border dark:border-gray-700 rounded-md p-1 ${!date ? 'bg-gray-50 dark:bg-gray-800/50' : 'cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700'}`}
                        onClick={() => date && handleDateClick(date)}
                    >
                        {date && <span className="text-sm font-semibold">{date.getDate()}</span>}
                        <div className="mt-1 space-y-1 overflow-y-auto max-h-20">
                            {date && allCalendarEvents
                                .filter(e => new Date(e.start).toDateString() === date.toDateString())
                                .sort((a,b) => new Date(a.start).getTime() - new Date(b.start).getTime())
                                .map(e => <EventBadge key={e.id} event={e} />)
                            }
                        </div>
                    </div>
                ))}
            </div>
            <EventModal isOpen={isModalOpen} onClose={() => setModalOpen(false)} onSave={handleSaveEvent} selectedDate={selectedDate} />
        </div>
    );
};
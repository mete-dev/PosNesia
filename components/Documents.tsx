// This is a new file: components/Documents.tsx
import React, { useState, useMemo, useEffect } from 'react';
import { useAppContext } from '../hooks/useAppContext';
import { IncomingLetter, OutgoingLetter, Staff, Attachment } from '../types';
import { Card, Button, Input, Select, Label, Modal, ActionsDropdown, DropdownItem, Table, Thead, Tbody, Tr, Th, Td, PageHeader, Textarea } from './ui';

// --- Incoming Letter Components ---
const IncomingLetterModal: React.FC<{
    isOpen: boolean;
    onClose: () => void;
    onSave: (data: Omit<IncomingLetter, 'id'>) => void;
}> = ({ isOpen, onClose, onSave }) => {
    const { state } = useAppContext();
    const { staff } = state;
    const [formData, setFormData] = useState<Omit<IncomingLetter, 'id'>>({
        referenceNumber: '',
        letterDate: new Date().toISOString().split('T')[0],
        dateReceived: new Date().toISOString().split('T')[0],
        sender: '',
        subject: '',
        dispositionTo: [],
        notes: '',
        attachments: [],
    });
    const [attachmentName, setAttachmentName] = useState('');

    useEffect(() => {
        if (!isOpen) {
            setFormData({
                referenceNumber: '',
                letterDate: new Date().toISOString().split('T')[0],
                dateReceived: new Date().toISOString().split('T')[0],
                sender: '',
                subject: '',
                dispositionTo: [],
                notes: '',
                attachments: [],
            });
            setAttachmentName('');
        }
    }, [isOpen]);
    
    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };
    
    const handleDispositionChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const selectedOptions = Array.from(e.target.selectedOptions, option => option.value);
        setFormData(prev => ({ ...prev, dispositionTo: selectedOptions }));
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            setAttachmentName(file.name);
            const newAttachment: Attachment = { name: file.name, url: '#' }; // In a real app, you'd upload this and get a URL
            setFormData(prev => ({...prev, attachments: [newAttachment]}));
        }
    };
    
    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSave(formData);
        onClose();
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Tambah Surat Masuk" maxWidth="max-w-2xl">
            <form onSubmit={handleSubmit} className="space-y-4">
                <Input name="referenceNumber" value={formData.referenceNumber} onChange={handleInputChange} placeholder="Nomor Surat" required />
                <div className="grid grid-cols-2 gap-4">
                     <div>
                        <Label htmlFor="letterDate">Tanggal Surat</Label>
                        <Input id="letterDate" name="letterDate" type="date" value={formData.letterDate} onChange={handleInputChange} required />
                    </div>
                    <div>
                        <Label htmlFor="dateReceived">Tanggal Diterima</Label>
                        <Input id="dateReceived" name="dateReceived" type="date" value={formData.dateReceived} onChange={handleInputChange} required />
                    </div>
                </div>
                <div>
                    <Label htmlFor="sender">Pengirim</Label>
                    <Input id="sender" name="sender" value={formData.sender} onChange={handleInputChange} required />
                </div>
                <Input name="subject" value={formData.subject} onChange={handleInputChange} placeholder="Perihal" required />
                <div>
                    <Label>Upload Scan Surat</Label>
                    <Input type="file" onChange={handleFileChange} className="p-2"/>
                    {attachmentName && <p className="text-xs text-gray-500 mt-1">File: {attachmentName}</p>}
                </div>
                <div>
                    <Label htmlFor="dispositionTo">Disposisi Kepada</Label>
                    <Select id="dispositionTo" name="dispositionTo" multiple value={formData.dispositionTo} onChange={handleDispositionChange} className="h-32">
                        {staff.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                    </Select>
                </div>
                <Textarea name="notes" value={formData.notes || ''} onChange={handleInputChange} placeholder="Catatan (opsional)" />
                <div className="flex justify-end gap-2 pt-4">
                    <Button variant="secondary" onClick={onClose}>Batal</Button>
                    <Button type="submit">Simpan</Button>
                </div>
            </form>
        </Modal>
    );
};

export const IncomingLettersPage: React.FC = () => {
    const { state, dispatch } = useAppContext();
    const { incomingLetters, staff } = state;
    const [isModalOpen, setModalOpen] = useState(false);

    const handleSave = (data: Omit<IncomingLetter, 'id'>) => {
        dispatch({ type: 'documents/addIncoming', payload: data });
    };
    
    const staffMap = useMemo(() => new Map(staff.map(s => [s.id, s.name])), [staff]);

    return (
        <div className="p-8 h-full flex flex-col">
            <PageHeader title="Administrasi Surat Masuk">
                <Button onClick={() => setModalOpen(true)}>Catat Surat Masuk</Button>
            </PageHeader>
            <Card className="flex-grow overflow-y-auto">
                <Table>
                    <Thead>
                        <Tr>
                            <Th>No. Surat</Th>
                            <Th>Tanggal Diterima</Th>
                            <Th>Pengirim</Th>
                            <Th>Perihal</Th>
                            <Th>Disposisi</Th>
                        </Tr>
                    </Thead>
                    <Tbody>
                        {incomingLetters.map(letter => (
                            <Tr key={letter.id}>
                                <Td className="font-mono">{letter.referenceNumber}</Td>
                                <Td>{new Date(letter.dateReceived).toLocaleDateString('id-ID')}</Td>
                                <Td>{letter.sender}</Td>
                                <Td>{letter.subject}</Td>
                                <Td>
                                    <ul className="list-disc list-inside text-xs">
                                        {letter.dispositionTo.map(staffId => <li key={staffId}>{staffMap.get(staffId) || staffId}</li>)}
                                    </ul>
                                </Td>
                            </Tr>
                        ))}
                    </Tbody>
                </Table>
            </Card>
            <IncomingLetterModal isOpen={isModalOpen} onClose={() => setModalOpen(false)} onSave={handleSave} />
        </div>
    );
};


// --- Outgoing Letter Components ---
const OutgoingLetterModal: React.FC<{
    isOpen: boolean;
    onClose: () => void;
    onSave: (data: Omit<OutgoingLetter, 'id' | 'createdBy'>) => void;
}> = ({ isOpen, onClose, onSave }) => {
    const [formData, setFormData] = useState<Omit<OutgoingLetter, 'id' | 'createdBy' | 'attachments'>>({
        referenceNumber: '',
        letterDate: new Date().toISOString().split('T')[0],
        dateSent: new Date().toISOString().split('T')[0],
        recipient: '',
        subject: '',
    });
    const [attachments, setAttachments] = useState<Attachment[]>([]);
     useEffect(() => {
        if (!isOpen) {
            setFormData({
                referenceNumber: '',
                letterDate: new Date().toISOString().split('T')[0],
                dateSent: new Date().toISOString().split('T')[0],
                recipient: '',
                subject: '',
            });
            setAttachments([]);
        }
    }, [isOpen]);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };
    
    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            const newAttachment: Attachment = { name: file.name, url: '#' }; // In a real app, you'd upload this and get a URL
            setAttachments([newAttachment]);
        }
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSave({...formData, attachments});
        onClose();
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Tambah Surat Keluar">
            <form onSubmit={handleSubmit} className="space-y-4">
                <Input name="referenceNumber" value={formData.referenceNumber} onChange={handleInputChange} placeholder="Nomor Surat" required />
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <Label htmlFor="letterDate">Tanggal Surat</Label>
                        <Input id="letterDate" name="letterDate" type="date" value={formData.letterDate} onChange={handleInputChange} required />
                    </div>
                    <div>
                        <Label htmlFor="dateSent">Tanggal Dikirim</Label>
                        <Input id="dateSent" name="dateSent" type="date" value={formData.dateSent} onChange={handleInputChange} required />
                    </div>
                </div>
                <div>
                     <Label htmlFor="recipient">Penerima</Label>
                     <Input id="recipient" name="recipient" value={formData.recipient} onChange={handleInputChange} required />
                </div>
                <Input name="subject" value={formData.subject} onChange={handleInputChange} placeholder="Perihal" required />
                <div>
                    <Label>Upload Scan Surat</Label>
                    <Input type="file" onChange={handleFileChange} className="p-2"/>
                    {attachments[0] && <p className="text-xs text-gray-500 mt-1">File: {attachments[0].name}</p>}
                </div>
                <div className="flex justify-end gap-2 pt-4">
                    <Button variant="secondary" onClick={onClose}>Batal</Button>
                    <Button type="submit">Simpan</Button>
                </div>
            </form>
        </Modal>
    );
};

export const OutgoingLettersPage: React.FC = () => {
    const { state, dispatch } = useAppContext();
    const { outgoingLetters, staff } = state;
    const [isModalOpen, setModalOpen] = useState(false);

    const handleSave = (data: Omit<OutgoingLetter, 'id' | 'createdBy'>) => {
        dispatch({ type: 'documents/addOutgoing', payload: data });
    };
    
    const staffMap = useMemo(() => new Map(staff.map(s => [s.id, s.name])), [staff]);

    return (
        <div className="p-8 h-full flex flex-col">
            <PageHeader title="Administrasi Surat Keluar">
                <Button onClick={() => setModalOpen(true)}>Catat Surat Keluar</Button>
            </PageHeader>
            <Card className="flex-grow overflow-y-auto">
                <Table>
                    <Thead>
                        <Tr>
                            <Th>No. Surat</Th>
                            <Th>Tanggal Dikirim</Th>
                            <Th>Penerima</Th>
                            <Th>Perihal</Th>
                            <Th>Dibuat Oleh</Th>
                        </Tr>
                    </Thead>
                    <Tbody>
                        {outgoingLetters.map(letter => (
                            <Tr key={letter.id}>
                                <Td className="font-mono">{letter.referenceNumber}</Td>
                                <Td>{new Date(letter.dateSent).toLocaleDateString('id-ID')}</Td>
                                <Td>{letter.recipient}</Td>
                                <Td>{letter.subject}</Td>
                                <Td>{staffMap.get(letter.createdBy) || letter.createdBy}</Td>
                            </Tr>
                        ))}
                    </Tbody>
                </Table>
            </Card>
            <OutgoingLetterModal isOpen={isModalOpen} onClose={() => setModalOpen(false)} onSave={handleSave} />
        </div>
    );
};
// This is a new file: components/Elearning.tsx
import React, { useState, useMemo, useEffect, useRef } from 'react';
import { useAppContext } from '../hooks/useAppContext';
import { Course, CourseClass, CourseSchedule, Staff, Status, Mentee, ElearningPeriods, TestQuestion, CourseTest, MenteeTestAnswer, QuestionFormat, CustomAssessment } from '../types';
import { Input, Label, Button, Modal, Card, Select, Textarea, ActionsDropdown, DropdownItem, Badge } from './ui';
import { generateId } from '../services/serviceUtils';

// --- Student Management Components ---

const MenteeModal: React.FC<{
    isOpen: boolean;
    onClose: () => void;
    existingStudent: Mentee | null;
}> = ({ isOpen, onClose, existingStudent }) => {
    const { dispatch } = useAppContext();
    const [formData, setFormData] = useState<Partial<Mentee>>({});

    useEffect(() => {
        if (isOpen) {
            setFormData(existingStudent || { name: '', email: '', phone: '', pin: '', status: 'active' });
        }
    }, [isOpen, existingStudent]);
    
    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const payload = {
            name: formData.name || '',
            email: formData.email,
            phone: formData.phone,
            pin: formData.pin || '', // Pin is required for new, optional for edit
            status: formData.status || 'active'
        };
        
        if (existingStudent) {
            dispatch({ type: 'elearning/updateStudent', payload: { ...existingStudent, ...payload, pin: payload.pin || existingStudent.pin } });
        } else {
            if (!payload.pin) {
                alert("PIN wajib diisi untuk peserta baru.");
                return;
            }
            dispatch({ type: 'elearning/addStudent', payload });
        }
        onClose();
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={`${existingStudent ? 'Ubah' : 'Tambah'} Peserta`}>
            <form onSubmit={handleSubmit} className="space-y-4">
                <Input value={formData.name || ''} onChange={e => setFormData({...formData, name: e.target.value})} placeholder="Nama Lengkap" required />
                <Input type="email" value={formData.email || ''} onChange={e => setFormData({...formData, email: e.target.value})} placeholder="Email" />
                <Input type="tel" value={formData.phone || ''} onChange={e => setFormData({...formData, phone: e.target.value})} placeholder="No. Telepon" required />
                <Input type="password" value={formData.pin || ''} onChange={e => setFormData({...formData, pin: e.target.value})} placeholder={existingStudent ? 'Kosongkan jika tidak ubah PIN' : 'PIN 6 Digit'} required={!existingStudent} pattern="\d{6}" maxLength={6} />
                <div className="flex justify-end gap-2 pt-4">
                    <Button variant="secondary" onClick={onClose}>Batal</Button>
                    <Button type="submit">Simpan</Button>
                </div>
            </form>
        </Modal>
    );
};


export const MenteeListPage: React.FC = () => {
    const { state, dispatch } = useAppContext();
    const { mentees } = state;
    const [isModalOpen, setModalOpen] = useState(false);
    const [editingStudent, setEditingStudent] = useState<Mentee | null>(null);

    const handleOpenModal = (student: Mentee | null = null) => {
        setEditingStudent(student);
        setModalOpen(true);
    };

    const handleSetStatus = (id: string, status: Status) => {
        const newStatus = status === 'active' ? 'inactive' : 'active';
        dispatch({ type: 'elearning/setStudentStatus', payload: { menteeId: id, status: newStatus } });
    };

    return (
        <div className="p-8 h-full flex flex-col">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-3xl font-bold">Data Mentee</h1>
                <Button onClick={() => handleOpenModal()}>Tambah Mentee</Button>
            </div>
            <Card className="flex-grow overflow-y-auto">
                <table className="w-full text-sm">
                    <thead><tr><th className="p-4 text-left">Nama</th><th className="p-4 text-left">ID Peserta</th><th className="p-4 text-left">Kontak</th><th className="p-4 text-left">Status</th><th className="p-4">Aksi</th></tr></thead>
                    <tbody>
                        {mentees.map(student => (
                            <tr key={student.id} className="border-t dark:border-gray-700">
                                <td className="p-4 font-medium">{student.name}</td>
                                <td className="p-4 font-mono">{student.id}</td>
                                <td className="p-4">{student.email}<br/>{student.phone}</td>
                                <td className="p-4"><Badge variant={student.status === 'active' ? 'success' : 'neutral'}>{student.status}</Badge></td>
                                <td className="p-4">
                                    <ActionsDropdown>
                                        <DropdownItem onClick={() => handleOpenModal(student)}>Ubah</DropdownItem>
                                        <DropdownItem onClick={() => handleSetStatus(student.id, student.status)}>
                                            {student.status === 'active' ? 'Non-aktifkan' : 'Aktifkan'}
                                        </DropdownItem>
                                    </ActionsDropdown>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </Card>
            <MenteeModal isOpen={isModalOpen} onClose={() => setModalOpen(false)} existingStudent={editingStudent} />
        </div>
    );
};


// --- Course Management Components ---

const CourseModal: React.FC<{
    isOpen: boolean;
    onClose: () => void;
    existingCourse: Course | null;
}> = ({ isOpen, onClose, existingCourse }) => {
    const { dispatch } = useAppContext();
    const [formData, setFormData] = useState<Partial<Course>>({});

    useEffect(() => {
        if (isOpen) {
            setFormData(existingCourse || { title: '', description: '' });
        }
    }, [isOpen, existingCourse]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const payload = {
            title: formData.title || '',
            description: formData.description || '',
        };
        if (existingCourse) {
            dispatch({ type: 'elearning/updateCourse', payload: { ...existingCourse, ...payload } });
        } else {
            dispatch({ type: 'modules/elearning/addCourse', payload });
        }
        onClose();
    };
    
    return (
        <Modal isOpen={isOpen} onClose={onClose} title={`${existingCourse ? 'Ubah' : 'Tambah'} Materi Kursus`}>
             <form onSubmit={handleSubmit} className="space-y-4">
                <Input value={formData.title || ''} onChange={e => setFormData({...formData, title: e.target.value})} placeholder="Judul Materi Kursus" required />
                <Textarea value={formData.description || ''} onChange={e => setFormData({...formData, description: e.target.value})} placeholder="Deskripsi Singkat" required />
                <div className="flex justify-end gap-2 pt-4">
                    <Button variant="secondary" onClick={onClose}>Batal</Button>
                    <Button type="submit">Simpan</Button>
                </div>
            </form>
        </Modal>
    )
}

const ClassModal: React.FC<{
    isOpen: boolean;
    onClose: () => void;
    existingClass: CourseClass | null;
}> = ({ isOpen, onClose, existingClass }) => {
    const { state, dispatch } = useAppContext();
    const [formData, setFormData] = useState<Partial<CourseClass>>({});
    const [schedules, setSchedules] = useState<Partial<CourseSchedule>[]>([{ dateTime: '', location: '' }]);
    
    const mentors = useMemo(() => state.staff.filter(s => state.roles.find(r => r.id === s.roleId)?.name === 'Mentor'), [state.staff, state.roles]);

    useEffect(() => {
        if (isOpen) {
            if (existingClass) {
                setFormData(existingClass);
                setSchedules(existingClass.schedules.length > 0 ? existingClass.schedules : [{ dateTime: '', location: '' }]);
            } else {
                setFormData({ name: '', courseId: '', mentorId: '', schedules: [], price: 0 });
                setSchedules([{ dateTime: '', location: '' }]);
            }
        }
    }, [isOpen, existingClass]);
    
    const handleScheduleChange = (index: number, field: keyof Omit<CourseSchedule, 'id'>, value: string) => {
        const newSchedules = [...schedules];
        (newSchedules[index] as any)[field] = value;
        setSchedules(newSchedules);
    };
    
    const addSchedule = () => setSchedules([...schedules, { dateTime: '', location: '' }]);
    const removeSchedule = (index: number) => setSchedules(schedules.filter((_, i) => i !== index));

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const finalSchedules: CourseSchedule[] = schedules
            .filter(s => s.dateTime && s.location)
            .map(s => ({
                id: s.id || generateId('sch', Math.random()),
                dateTime: new Date(s.dateTime).toISOString(),
                location: s.location || ''
            }));
        
        const payload: Omit<CourseClass, 'id'> = {
            name: formData.name || '',
            courseId: formData.courseId || '',
            mentorId: formData.mentorId || '',
            schedules: finalSchedules,
            price: Number(formData.price) || 0,
        };
        
        if (existingClass) {
            dispatch({ type: 'elearning/updateCourseClass', payload: { ...existingClass, ...payload } });
        } else {
            dispatch({ type: 'elearning/addCourseClass', payload });
        }
        onClose();
    };

    const footer = <Button onClick={handleSubmit}>Simpan Kelas</Button>;

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={existingClass ? 'Ubah Kelas' : 'Kelas Baru'} footer={footer} maxWidth="max-w-2xl">
            <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                    <Select value={formData.courseId || ''} onChange={e => setFormData({...formData, courseId: e.target.value})} required>
                        <option value="">-- Pilih Materi Kursus --</option>
                        {state.courses.map(c => <option key={c.id} value={c.id}>{c.title}</option>)}
                    </Select>
                    <Input value={formData.name || ''} onChange={e => setFormData({...formData, name: e.target.value})} placeholder="Nama Kelas (e.g., Kelas Pagi A)" required />
                </div>
                 <div>
                    <Label>Harga Kursus (Rp)</Label>
                    <Input type="number" value={formData.price || ''} onChange={e => setFormData({...formData, price: Number(e.target.value)})} placeholder="Harga" required />
                </div>
                <div>
                    <Select value={formData.mentorId || ''} onChange={e => setFormData({...formData, mentorId: e.target.value})} required>
                        <option value="">-- Pilih Mentor --</option>
                        {mentors.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                    </Select>
                </div>
                <div className="border-t pt-4 space-y-2">
                    <h3 className="text-lg font-semibold">Jadwal & Lokasi</h3>
                    {schedules.map((s, index) => (
                        <div key={index} className="flex items-center gap-2">
                            <Input type="datetime-local" value={s.dateTime ? new Date(s.dateTime).toISOString().substring(0,16) : ''} onChange={e => handleScheduleChange(index, 'dateTime', e.target.value)} required />
                            <Input value={s.location || ''} onChange={e => handleScheduleChange(index, 'location', e.target.value)} placeholder="Lokasi" required />
                            <button type="button" onClick={() => removeSchedule(index)} className="text-red-500 font-bold text-xl">&times;</button>
                        </div>
                    ))}
                    <button type="button" onClick={addSchedule} className="text-sm text-primary-600">+ Tambah Jadwal</button>
                </div>
            </form>
        </Modal>
    );
};


export const CourseListPage: React.FC = () => {
    const { state } = useAppContext();
    const { courses } = state;
    const [isModalOpen, setModalOpen] = useState(false);
    const [editingCourse, setEditingCourse] = useState<Course | null>(null);

    const handleOpenModal = (course: Course | null = null) => {
        setEditingCourse(course);
        setModalOpen(true);
    };
    
    return (
        <div className="p-8 h-full flex flex-col">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-3xl font-bold">Materi Kursus</h1>
                <Button onClick={() => handleOpenModal()}>Tambah Materi</Button>
            </div>
            <div className="flex-grow grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 overflow-y-auto">
                {courses.map(course => (
                    <Card key={course.id} className="h-fit flex flex-col">
                       <div className="flex-grow">
                            <h2 className="text-lg font-bold">{course.title}</h2>
                            <p className="text-sm text-gray-500 mb-2">{course.description}</p>
                        </div>
                         <div className="text-right mt-4">
                             <Button onClick={() => handleOpenModal(course)} variant="secondary" size="sm">Ubah</Button>
                        </div>
                    </Card>
                ))}
            </div>
            <CourseModal isOpen={isModalOpen} onClose={() => setModalOpen(false)} existingCourse={editingCourse} />
        </div>
    );
};

export const ClassManagementPage: React.FC = () => {
    const { state } = useAppContext();
    const { courseClasses, courses, staff } = state;
    const [isModalOpen, setModalOpen] = useState(false);
    const [editingClass, setEditingClass] = useState<CourseClass | null>(null);

    const handleOpenModal = (courseClass: CourseClass | null = null) => {
        setEditingClass(courseClass);
        setModalOpen(true);
    };

    const courseMap = new Map(courses.map(c => [c.id, c.title]));
    const staffMap = new Map(staff.map(s => [s.id, s.name]));

    return (
        <div className="p-8 h-full flex flex-col">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-3xl font-bold">Kelola Kelas Kursus</h1>
                <Button onClick={() => handleOpenModal()}>Kelas Baru</Button>
            </div>
            <div className="flex-grow grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 overflow-y-auto">
                {courseClasses.map(courseClass => (
                    <Card key={courseClass.id} className="h-fit flex flex-col">
                        <div className="flex-grow">
                            <h2 className="text-lg font-bold">{courseClass.name}</h2>
                            <p className="font-semibold text-primary-600">{courseMap.get(courseClass.courseId)}</p>
                            <p className="text-xs text-gray-500 mb-2">Mentor: {staffMap.get(courseClass.mentorId)}</p>
                            <div className="text-sm">
                                <h4 className="font-semibold">Jadwal:</h4>
                                <ul className="list-disc pl-5">
                                    {courseClass.schedules.map(s => (
                                        <li key={s.id}>{new Date(s.dateTime).toLocaleString('id-ID')} @ {s.location}</li>
                                    ))}
                                </ul>
                            </div>
                        </div>
                        <div className="text-right mt-4">
                             <Button onClick={() => handleOpenModal(courseClass)} variant="secondary" size="sm">Ubah</Button>
                        </div>
                    </Card>
                ))}
            </div>
            <ClassModal isOpen={isModalOpen} onClose={() => setModalOpen(false)} existingClass={editingClass} />
        </div>
    );
};


// --- Placeholder & Other Components ---

export const EnrollmentsPage: React.FC = () => {
    const { state } = useAppContext();
    const { enrollments, courses, mentees, courseClasses } = state;

    const enrollmentDetails = useMemo(() => {
        return enrollments.map(en => {
            const courseClass = courseClasses.find(cc => cc.id === en.courseClassId);
            const course = courseClass ? courses.find(c => c.id === courseClass.courseId) : null;
            return {
                ...en,
                courseTitle: course ? `${course.title} - ${courseClass?.name}` : 'N/A',
                studentName: mentees.find(s => s.id === en.menteeId)?.name || 'N/A',
            }
        });
    }, [enrollments, courses, mentees, courseClasses]);

    return (
        <div className="p-8 h-full flex flex-col">
            <h1 className="text-3xl font-bold mb-6">Pendaftaran Kursus</h1>
             <div className="flex-grow bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-y-auto">
                <table className="w-full text-sm">
                    <thead><tr><th className="p-4 text-left">Kursus</th><th className="p-4 text-left">Peserta</th><th className="p-4 text-left">Tanggal Daftar</th></tr></thead>
                    <tbody>
                        {enrollmentDetails.map(en => (
                            <tr key={en.id} className="border-t dark:border-gray-700">
                                <td className="p-4 font-medium">{en.courseTitle}</td>
                                <td className="p-4">{en.studentName}</td>
                                <td className="p-4">{new Date(en.enrollmentDate).toLocaleDateString('id-ID')}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export const ElearningStorefrontPage: React.FC = () => {
    return <CourseListPage/>
};

export const AttendanceReportPage: React.FC = () => {
    const { state } = useAppContext();
    const { courseClasses, courses, enrollments, mentees, menteeAttendances } = state;
    const [selectedClassId, setSelectedClassId] = useState('');

    const classDetails = useMemo(() => {
        if (!selectedClassId) return null;
        const courseClass = courseClasses.find(cc => cc.id === selectedClassId);
        if (!courseClass) return null;

        const enrolledMentees = enrollments
            .filter(en => en.courseClassId === selectedClassId)
            .map(en => mentees.find(m => m.id === en.menteeId))
            .filter((m): m is Mentee => !!m);

        return {
            schedules: courseClass.schedules.sort((a, b) => new Date(a.dateTime).getTime() - new Date(b.dateTime).getTime()),
            enrolledMentees,
        };
    }, [selectedClassId, courseClasses, enrollments, mentees]);

    const getAttendanceStatus = (menteeId: string, scheduleId: string) => {
        const enrollment = enrollments.find(e => e.menteeId === menteeId && e.courseClassId === selectedClassId);
        if (!enrollment) return 'N/A';
        const attendance = menteeAttendances.find(ma => ma.enrollmentId === enrollment.id && ma.scheduleId === scheduleId);
        return attendance?.status || 'N/A';
    };

    return (
        <div className="p-8 h-full flex flex-col">
            <h1 className="text-3xl font-bold mb-6">Laporan Absensi</h1>
            <Card className="mb-4">
                <Label>Pilih Kelas</Label>
                <Select value={selectedClassId} onChange={e => setSelectedClassId(e.target.value)}>
                    <option value="">-- Pilih Kelas --</option>
                    {courseClasses.map(cc => {
                        const course = courses.find(c => c.id === cc.courseId);
                        return <option key={cc.id} value={cc.id}>{course?.title} - {cc.name}</option>;
                    })}
                </Select>
            </Card>
            {classDetails && (
                <Card className="flex-grow overflow-auto">
                    <table className="w-full text-xs">
                        <thead className="sticky top-0 bg-gray-50 dark:bg-gray-700">
                            <tr>
                                <th className="p-2 border dark:border-gray-600">Nama Peserta</th>
                                {classDetails.schedules.map(s => <th key={s.id} className="p-2 border dark:border-gray-600">{new Date(s.dateTime).toLocaleDateString('id-ID')}</th>)}
                            </tr>
                        </thead>
                        <tbody>
                            {classDetails.enrolledMentees.map(mentee => (
                                <tr key={mentee.id}>
                                    <td className="p-2 border dark:border-gray-600 font-medium">{mentee.name}</td>
                                    {classDetails.schedules.map(s => <td key={s.id} className="p-2 border dark:border-gray-600 text-center">{getAttendanceStatus(mentee.id, s.id)}</td>)}
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </Card>
            )}
        </div>
    );
};

export const ElearningPeriodsPage: React.FC = () => {
    const { state, dispatch } = useAppContext();
    const [periods, setPeriods] = useState(state.elearningPeriods);
    const [success, setSuccess] = useState(false);

    const handleSave = () => {
        dispatch({ type: 'elearning/updatePeriods', payload: periods });
        setSuccess(true);
        setTimeout(() => setSuccess(false), 3000);
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setPeriods(prev => ({...prev, [name]: new Date(value).toISOString() }));
    };

    const renderInput = (name: keyof ElearningPeriods, label: string) => (
        <div>
            <Label>{label}</Label>
            <Input type="datetime-local" name={name} value={periods[name] ? new Date(periods[name]).toISOString().substring(0, 16) : ''} onChange={handleInputChange} />
        </div>
    );

    return (
        <div className="p-8">
            <h1 className="text-3xl font-bold mb-6">Kelola Periode E-Learning</h1>
            <Card className="max-w-3xl mx-auto">
                {success && <div className="p-3 mb-4 bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 rounded-md">Periode berhasil disimpan!</div>}
                <div className="grid grid-cols-2 gap-6">
                    {renderInput('registrationStart', 'Mulai Pendaftaran')}
                    {renderInput('registrationEnd', 'Selesai Pendaftaran')}
                    {renderInput('courseStart', 'Mulai Kursus')}
                    {renderInput('courseEnd', 'Selesai Kursus')}
                    {renderInput('testStart', 'Mulai Ujian')}
                    {renderInput('testEnd', 'Selesai Ujian')}
                    {renderInput('gradingStart', 'Mulai Penilaian')}
                    {renderInput('gradingEnd', 'Selesai Penilaian')}
                    {renderInput('resultsRelease', 'Pengumuman Hasil')}
                </div>
                <div className="flex justify-end mt-6">
                    <Button onClick={handleSave}>Simpan Periode</Button>
                </div>
            </Card>
        </div>
    );
};


// --- Test Management ---

type EditableQuestion = Omit<Partial<TestQuestion>, 'options'> & {
    options?: { id: string; text: string }[];
};

const QuestionEditor: React.FC<{ 
    question: EditableQuestion;
    qIndex: number;
    handleQuestionChange: <K extends keyof EditableQuestion>(qIndex: number, field: K, value: EditableQuestion[K]) => void;
    removeQuestion: (qIndex: number) => void;
    addOption: (qIndex: number) => void;
    removeOption: (qIndex: number, oIndex: number) => void;
    handleOptionChange: (qIndex: number, oIndex: number, value: string) => void;
    handleCorrectAnswerChange: (qIndex: number, answerText: string) => void;
}> = ({ 
    question, qIndex, handleQuestionChange, removeQuestion, 
    addOption, removeOption, handleOptionChange, handleCorrectAnswerChange 
}) => {
    const showOptions = question.format !== QuestionFormat.Essay;
    return (
         <div className="p-4 border rounded-lg space-y-3 dark:border-gray-600 bg-gray-50 dark:bg-gray-700/50">
            <div className="flex justify-between items-start">
                <Textarea value={question.questionText} onChange={e => handleQuestionChange(qIndex, 'questionText', e.target.value)} placeholder={`Pertanyaan #${qIndex + 1}`} className="flex-grow" />
                <div className="ml-4 flex flex-col gap-2">
                    <Select value={question.format} onChange={e => handleQuestionChange(qIndex, 'format', e.target.value as QuestionFormat)}>
                        <option value={QuestionFormat.MultipleChoice}>Pilihan Ganda</option>
                        <option value={QuestionFormat.Checkbox}>Centang</option>
                        <option value={QuestionFormat.Dropdown}>Dropdown</option>
                        <option value={QuestionFormat.Essay}>Esai</option>
                    </Select>
                    <Button type="button" variant="danger" size="sm" onClick={() => removeQuestion(qIndex)}>Hapus</Button>
                </div>
            </div>
             {showOptions && (
                <div className="pl-4 space-y-2">
                    <Label>Opsi Jawaban (Pilih yang benar)</Label>
                    {(question.options || []).map((option, oIndex) => (
                        <div key={option.id} className="flex items-center gap-2">
                            <input
                                type={question.format === 'checkbox' ? 'checkbox' : 'radio'}
                                name={`correct-${qIndex}`}
                                checked={(question.correctAnswers || []).includes(option.text)}
                                onChange={() => handleCorrectAnswerChange(qIndex, option.text)}
                            />
                            <Input value={option.text} onChange={e => handleOptionChange(qIndex, oIndex, e.target.value)} placeholder={`Opsi ${oIndex + 1}`} />
                            <Button type="button" variant="ghost" size="sm" onClick={() => removeOption(qIndex, oIndex)}>&times;</Button>
                        </div>
                    ))}
                    <Button type="button" variant="secondary" size="sm" onClick={() => addOption(qIndex)}>+ Tambah Opsi</Button>
                </div>
            )}
        </div>
    );
};

const TestModal: React.FC<{
    isOpen: boolean;
    onClose: () => void;
    existingTest: CourseTest | null;
}> = ({ isOpen, onClose, existingTest }) => {
    const { state, dispatch } = useAppContext();
    const { courseClasses, courses } = state;
    const [formData, setFormData] = useState<Partial<CourseTest>>({});
    
    const [editableQuestions, setEditableQuestions] = useState<EditableQuestion[]>([]);

    const schedulesForSelectedClass = useMemo(() => {
        if (!formData.courseClassId) return [];
        const courseClass = courseClasses.find(cc => cc.id === formData.courseClassId);
        return courseClass?.schedules || [];
    }, [formData.courseClassId, courseClasses]);

    useEffect(() => {
        if (isOpen) {
            if (existingTest) {
                setFormData(existingTest);
                setEditableQuestions(
                    existingTest.questions.map(q => ({
                        ...q,
                        id: q.id || `q-${Date.now()}-${Math.random()}`,
                        options: (q.options || []).map((opt, i) => ({ id: `opt-${q.id}-${i}`, text: opt }))
                    }))
                );
            } else {
                setFormData({ type: 'Test', questions: [] });
                setEditableQuestions([{
                    id: `q-${Date.now()}`,
                    questionText: '',
                    format: QuestionFormat.MultipleChoice,
                    options: [{ id: `opt-${Date.now()}`, text: '' }],
                    correctAnswers: []
                }]);
            }
        }
    }, [isOpen, existingTest]);

    const addQuestion = () => setEditableQuestions([...editableQuestions, { 
        id: `q-${Date.now()}`,
        questionText: '', 
        format: QuestionFormat.MultipleChoice, 
        options: [{id: `opt-${Date.now()}`, text: ''}], 
        correctAnswers: [] 
    }]);
    
    const removeQuestion = (qIndex: number) => setEditableQuestions(editableQuestions.filter((_, i) => i !== qIndex));

    const handleQuestionChange = <K extends keyof EditableQuestion>(qIndex: number, field: K, value: EditableQuestion[K]) => {
        const newQuestions = [...editableQuestions];
        const questionToUpdate = { ...newQuestions[qIndex], [field]: value };
        if (field === 'format') {
            questionToUpdate.options = [{ id: `opt-${Date.now()}`, text: '' }];
            questionToUpdate.correctAnswers = [];
        }
        newQuestions[qIndex] = questionToUpdate;
        setEditableQuestions(newQuestions);
    };

    const addOption = (qIndex: number) => {
        const newQuestions = [...editableQuestions];
        const questionToUpdate = { ...newQuestions[qIndex] };
        const currentOptions = questionToUpdate.options || [];
        questionToUpdate.options = [...currentOptions, { id: `opt-${Date.now()}`, text: '' }];
        newQuestions[qIndex] = questionToUpdate;
        setEditableQuestions(newQuestions);
    };

    const removeOption = (qIndex: number, oIndex: number) => {
        const newQuestions = [...editableQuestions];
        const questionToUpdate = { ...newQuestions[qIndex] };
        const oldOptions = questionToUpdate.options || [];
        const optionToRemove = oldOptions[oIndex];
        questionToUpdate.options = oldOptions.filter((_, i) => i !== oIndex);
        questionToUpdate.correctAnswers = (questionToUpdate.correctAnswers || []).filter(ans => ans !== optionToRemove.text);
        newQuestions[qIndex] = questionToUpdate;
        setEditableQuestions(newQuestions);
    };

    const handleOptionChange = (qIndex: number, oIndex: number, value: string) => {
        const newQuestions = [...editableQuestions];
        const questionToUpdate = { ...newQuestions[qIndex] };
        const oldOptions = questionToUpdate.options || [];
        const oldOptionValue = oldOptions[oIndex].text;
        const newOptions = [...oldOptions];
        newOptions[oIndex] = { ...newOptions[oIndex], text: value };
        questionToUpdate.options = newOptions;

        const currentCorrectAnswers = questionToUpdate.correctAnswers || [];
        if (currentCorrectAnswers.includes(oldOptionValue)) {
            questionToUpdate.correctAnswers = currentCorrectAnswers.map(ans =>
                ans === oldOptionValue ? value : ans
            );
        }
        newQuestions[qIndex] = questionToUpdate;
        setEditableQuestions(newQuestions);
    };
    
    const handleCorrectAnswerChange = (qIndex: number, answerText: string) => {
        const newQuestions = [...editableQuestions];
        const questionToUpdate = newQuestions[qIndex];
        if (questionToUpdate.format === 'multiple_choice' || questionToUpdate.format === 'dropdown') {
            questionToUpdate.correctAnswers = [answerText];
        } else if (questionToUpdate.format === 'checkbox') {
            const currentAnswers = questionToUpdate.correctAnswers || [];
            const newAnswers = currentAnswers.includes(answerText)
                ? currentAnswers.filter(a => a !== answerText)
                : [...currentAnswers, answerText];
            questionToUpdate.correctAnswers = newAnswers;
        }
        newQuestions[qIndex] = questionToUpdate;
        setEditableQuestions(newQuestions);
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const finalQuestions: TestQuestion[] = editableQuestions.map((q, index) => ({
            id: q.id || `${Date.now()}-${index}`,
            questionText: q.questionText || '',
            format: q.format || QuestionFormat.MultipleChoice,
            options: q.format === QuestionFormat.Essay ? undefined : (q.options?.map(opt => opt.text).filter(text => text.trim() !== '')),
            correctAnswers: q.correctAnswers || [],
        }));

        const payload = {
            ...formData,
            title: formData.title || '',
            courseClassId: formData.courseClassId || '',
            type: formData.type || 'Test',
            questions: finalQuestions,
            availableFrom: new Date(formData.availableFrom!).toISOString(),
            availableTo: new Date(formData.availableTo!).toISOString(),
            durationMinutes: Number(formData.durationMinutes) || undefined,
            scheduleId: formData.scheduleId || undefined,
        };

        dispatch({ type: 'elearning/addOrUpdateTest', payload: payload as CourseTest | Omit<CourseTest, 'id'> });
        onClose();
    };
    
    return (
        <Modal isOpen={isOpen} onClose={onClose} title={`${existingTest ? 'Ubah' : 'Buat'} Tes/Tugas`} maxWidth="max-w-4xl">
            <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                    <Select value={formData.courseClassId || ''} onChange={e => setFormData({ ...formData, courseClassId: e.target.value, scheduleId: '' })} required>
                        <option value="">-- Pilih Kelas --</option>
                        {courseClasses.map(cc => <option key={cc.id} value={cc.id}>{courses.find(c=>c.id === cc.courseId)?.title} - {cc.name}</option>)}
                    </Select>
                    <Input value={formData.title || ''} onChange={e => setFormData({ ...formData, title: e.target.value })} placeholder="Judul Tes/Tugas" required />
                </div>
                <div className="grid grid-cols-3 gap-4">
                    <Select value={formData.type || 'Test'} onChange={e => setFormData({ ...formData, type: e.target.value as any })}>
                        <option value="Test">Tes</option>
                        <option value="Tugas">Tugas</option>
                    </Select>
                    <Input type="number" value={formData.durationMinutes || ''} onChange={e => setFormData({ ...formData, durationMinutes: Number(e.target.value) })} placeholder="Durasi (menit, opsional)" />
                    <Select value={formData.scheduleId || ''} onChange={e => setFormData({ ...formData, scheduleId: e.target.value })} disabled={!formData.courseClassId}>
                        <option value="">-- (Umum/Tidak terikat jadwal) --</option>
                        {schedulesForSelectedClass.map(s => (
                            <option key={s.id} value={s.id}>{new Date(s.dateTime).toLocaleString('id-ID')} @ {s.location}</option>
                        ))}
                    </Select>
                </div>
                <div className="grid grid-cols-2 gap-4">
                    <div><Label>Tersedia Mulai</Label><Input type="datetime-local" value={formData.availableFrom ? new Date(formData.availableFrom).toISOString().substring(0, 16) : ''} onChange={e => setFormData({...formData, availableFrom: e.target.value})} required /></div>
                    <div><Label>Tersedia Hingga</Label><Input type="datetime-local" value={formData.availableTo ? new Date(formData.availableTo).toISOString().substring(0, 16) : ''} onChange={e => setFormData({...formData, availableTo: e.target.value})} required /></div>
                </div>

                <div className="space-y-4 pt-4 border-t dark:border-gray-600">
                    <h3 className="text-xl font-semibold">Soal</h3>
                    <div className="max-h-96 overflow-y-auto space-y-4 pr-2">
                        {editableQuestions.map((q, i) => <QuestionEditor 
                            key={q.id} 
                            question={q} 
                            qIndex={i}
                            handleQuestionChange={handleQuestionChange}
                            removeQuestion={removeQuestion}
                            addOption={addOption}
                            removeOption={removeOption}
                            handleOptionChange={handleOptionChange}
                            handleCorrectAnswerChange={handleCorrectAnswerChange}
                        />)}
                    </div>
                    <Button type="button" variant="secondary" onClick={addQuestion}>+ Tambah Pertanyaan</Button>
                </div>

                 <div className="flex justify-end gap-2 pt-4">
                    <Button variant="secondary" onClick={onClose}>Batal</Button>
                    <Button type="submit">Simpan</Button>
                </div>
            </form>
        </Modal>
    );
};

const AnswerViewModal: React.FC<{
    isOpen: boolean;
    onClose: () => void;
    submission: MenteeTestAnswer | null;
    test: CourseTest | null;
}> = ({ isOpen, onClose, submission, test }) => {
    const { state } = useAppContext();
    const { mentees, enrollments } = state;
    const printRef = useRef<HTMLDivElement>(null);

    const menteeName = useMemo(() => {
        if (!submission) return 'N/A';
        const enrollment = enrollments.find(e => e.id === submission.enrollmentId);
        const mentee = enrollment ? mentees.find(m => m.id === enrollment.menteeId) : null;
        return mentee?.name || 'N/A';
    }, [submission, enrollments, mentees]);

    const handlePrint = () => {
        const printContent = printRef.current?.innerHTML;
        if (!printContent) return;
        const iframe = document.createElement('iframe');
        iframe.style.display = 'none';
        document.body.appendChild(iframe);
        const doc = iframe.contentWindow?.document;
        if (!doc) return;
        doc.open();
        doc.write(`<html><head><title>Jawaban Peserta</title><script src="https://cdn.tailwindcss.com"></script></head><body>${printContent}</body></html>`);
        doc.close();
        iframe.onload = () => {
            iframe.contentWindow?.focus();
            iframe.contentWindow?.print();
            document.body.removeChild(iframe);
        };
    };

    if (!isOpen || !submission || !test) return null;

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={`Jawaban dari: ${menteeName}`} footer={<Button onClick={handlePrint}>Cetak</Button>} maxWidth="max-w-4xl">
            <div ref={printRef} className="printable-content space-y-6">
                <div className="print-only:block hidden">
                    <h1 className="text-2xl font-bold">{test.title}</h1>
                    <p><strong>Peserta:</strong> {menteeName}</p>
                    <p><strong>Tanggal Submit:</strong> {new Date(submission.submittedDate).toLocaleString('id-ID')}</p>
                    <hr className="my-4"/>
                </div>
                {test.questions.map((q, index) => {
                    const studentAnswer = submission.answers.find(a => a.questionId === q.id)?.answer || '(Tidak Dijawab)';
                    const isCorrect = q.correctAnswers?.includes(studentAnswer);
                    return (
                        <div key={q.id} className="p-4 rounded-lg bg-gray-50 dark:bg-gray-700/50">
                            <p className="font-semibold">{index + 1}. {q.questionText}</p>
                            <div className="mt-2 pl-4">
                                <p><span className="font-bold">Jawaban Peserta:</span> {studentAnswer}</p>
                                {q.format !== QuestionFormat.Essay && (
                                    <p className={`font-bold ${isCorrect ? 'text-green-600' : 'text-red-600'}`}>
                                        <span className="font-bold text-gray-800 dark:text-gray-200">Jawaban Benar:</span> {(q.correctAnswers || []).join(', ')}
                                    </p>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>
        </Modal>
    );
};

const SubmissionsModal: React.FC<{
    isOpen: boolean;
    onClose: () => void;
    test: CourseTest | null;
}> = ({ isOpen, onClose, test }) => {
    const { state } = useAppContext();
    const { mentees, enrollments, menteeTestAnswers } = state;
    const [viewingAnswer, setViewingAnswer] = useState<MenteeTestAnswer | null>(null);
    
    const submissions = useMemo(() => {
        if (!test) return [];
        return enrollments
            .filter(en => en.courseClassId === test.courseClassId)
            .map(en => {
                const mentee = mentees.find(m => m.id === en.menteeId);
                const answer = menteeTestAnswers.find(sta => sta.enrollmentId === en.id && sta.testId === test.id);
                return {
                    menteeName: mentee?.name || 'N/A',
                    submission: answer,
                };
            })
            .filter(item => item.submission); // Only show those who have submitted
    }, [test, menteeTestAnswers, enrollments, mentees]);
    
    if (!isOpen || !test) return null;

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={`Data Peserta untuk: ${test.title}`} maxWidth="max-w-3xl">
            <table className="w-full text-sm">
                <thead>
                    <tr>
                        <th className="p-2 text-left">Nama Peserta</th>
                        <th className="p-2 text-left">Tanggal Submit</th>
                        <th className="p-2 text-left">Nilai</th>
                        <th className="p-2">Aksi</th>
                    </tr>
                </thead>
                <tbody>
                    {submissions.map(({ menteeName, submission }) => (
                        submission && (
                            <tr key={submission.id} className="border-t dark:border-gray-700">
                                <td className="p-2 font-medium">{menteeName}</td>
                                <td className="p-2">{new Date(submission.submittedDate).toLocaleString('id-ID')}</td>
                                <td className="p-2 font-bold">{submission.manualGrade ?? submission.score}</td>
                                <td className="p-2">
                                    <Button size="sm" variant="secondary" onClick={() => setViewingAnswer(submission)}>Lihat Jawaban</Button>
                                </td>
                            </tr>
                        )
                    ))}
                </tbody>
            </table>
            <AnswerViewModal
                isOpen={!!viewingAnswer}
                onClose={() => setViewingAnswer(null)}
                submission={viewingAnswer}
                test={test}
            />
        </Modal>
    );
};

export const TestManagementPage: React.FC = () => {
    const { state } = useAppContext();
    const { courseTests, courseClasses, courses } = state;
    const [isTestModalOpen, setTestModalOpen] = useState(false);
    const [editingTest, setEditingTest] = useState<CourseTest | null>(null);
    const [viewingSubmissionsFor, setViewingSubmissionsFor] = useState<CourseTest | null>(null);

    const handleOpenModal = (test: CourseTest | null = null) => {
        setEditingTest(test);
        setTestModalOpen(true);
    };

    return (
        <div className="p-8 h-full flex flex-col">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-3xl font-bold">Kelola Tes & Tugas</h1>
                <Button onClick={() => handleOpenModal()}>Buat Tes/Tugas Baru</Button>
            </div>
            <Card className="flex-grow overflow-y-auto">
                <table className="w-full text-sm">
                    <thead>
                        <tr>
                            <th className="p-4 text-left">Judul</th>
                            <th className="p-4 text-left">Kelas</th>
                            <th className="p-4 text-left">Periode Tersedia</th>
                            <th className="p-4 text-left">Jumlah Soal</th>
                            <th className="p-4">Aksi</th>
                        </tr>
                    </thead>
                    <tbody>
                        {courseTests.map(test => {
                            const courseClass = courseClasses.find(cc => cc.id === test.courseClassId);
                            const course = courseClass ? courses.find(c => c.id === courseClass.courseId) : null;
                            return (
                                <tr key={test.id} className="border-t dark:border-gray-700">
                                    <td className="p-4 font-medium">
                                        <button onClick={() => setViewingSubmissionsFor(test)} className="text-primary-600 hover:underline">
                                            {test.title}
                                        </button>
                                    </td>
                                    <td className="p-4">{course?.title} - {courseClass?.name}</td>
                                    <td className="p-4">{new Date(test.availableFrom).toLocaleString('id-ID')} - {new Date(test.availableTo).toLocaleString('id-ID')}</td>
                                    <td className="p-4">{test.questions.length}</td>
                                    <td className="p-4">
                                        <Button onClick={() => handleOpenModal(test)} variant="secondary" size="sm">Ubah</Button>
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </Card>
            <TestModal isOpen={isTestModalOpen} onClose={() => setTestModalOpen(false)} existingTest={editingTest} />
            <SubmissionsModal
                isOpen={!!viewingSubmissionsFor}
                onClose={() => setViewingSubmissionsFor(null)}
                test={viewingSubmissionsFor}
            />
        </div>
    );
};

// --- NEW/REFACTORED GRADING PAGE ---
const TestGradingView: React.FC<{ type: 'Test' | 'Tugas' }> = ({ type }) => {
    const { state, dispatch } = useAppContext();
    const { courseTests, courseClasses, courses, mentees, enrollments, menteeTestAnswers } = state;
    const [selectedTestId, setSelectedTestId] = useState('');
    const [grades, setGrades] = useState<Record<string, number | string>>({});

    const filteredTests = useMemo(() => courseTests.filter(t => t.type === type), [courseTests, type]);

    const submissions = useMemo(() => {
        if (!selectedTestId) return [];
        const test = courseTests.find(t => t.id === selectedTestId);
        if (!test) return [];

        return enrollments
            .filter(en => en.courseClassId === test.courseClassId)
            .map(en => {
                const mentee = mentees.find(m => m.id === en.menteeId);
                const answer = menteeTestAnswers.find(sta => sta.enrollmentId === en.id && sta.testId === selectedTestId);
                return {
                    menteeId: mentee?.id || '',
                    menteeName: mentee?.name || 'N/A',
                    submission: answer,
                };
            });
    }, [selectedTestId, courseTests, enrollments, mentees, menteeTestAnswers]);

    const handleGradeChange = (menteeId: string, value: string) => {
        setGrades(prev => ({ ...prev, [menteeId]: value }));
    };

    const handleSaveGrade = (menteeId: string) => {
        const grade = Number(grades[menteeId]);
        if (!isNaN(grade)) {
            dispatch({ type: 'elearning/submitGrade', payload: { testId: selectedTestId, menteeId, grade } });
        }
    };

    return (
        <div>
            <Card className="mb-4">
                <Label>Pilih {type}</Label>
                <Select value={selectedTestId} onChange={e => setSelectedTestId(e.target.value)}>
                    <option value="">-- Pilih --</option>
                    {filteredTests.map(t => {
                        const cc = courseClasses.find(c => c.id === t.courseClassId);
                        const course = cc ? courses.find(c => c.id === cc.courseId) : null;
                        return <option key={t.id} value={t.id}>{course?.title} - {cc?.name} - {t.title}</option>
                    })}
                </Select>
            </Card>
            <Card className="flex-grow overflow-y-auto">
                <table className="w-full text-sm">
                     <thead><tr><th className="p-2 text-left">Peserta</th><th className="p-2 text-left">Skor Otomatis</th><th className="p-2 text-left">Nilai Akhir</th><th className="p-2">Aksi</th></tr></thead>
                     <tbody>
                        {submissions.map(sub => (
                             <tr key={sub.menteeId} className="border-t dark:border-gray-700">
                                <td className="p-2 font-medium">{sub.menteeName}</td>
                                <td className="p-2">{sub.submission?.score ?? 'N/A'}</td>
                                <td className="p-2">
                                    <Input
                                        type="number"
                                        className="w-24"
                                        value={grades[sub.menteeId] ?? sub.submission?.manualGrade ?? sub.submission?.score ?? ''}
                                        onChange={e => handleGradeChange(sub.menteeId, e.target.value)}
                                        placeholder="Nilai"
                                    />
                                </td>
                                 <td className="p-2">
                                    <Button size="sm" onClick={() => handleSaveGrade(sub.menteeId)}>Simpan</Button>
                                 </td>
                            </tr>
                        ))}
                     </tbody>
                </table>
            </Card>
        </div>
    );
};

const CustomGradingView: React.FC = () => {
    const { state, dispatch } = useAppContext();
    const { courseClasses, courses, customAssessments, enrollments, mentees, customAssessmentGrades } = state;
    
    const [isModalOpen, setModalOpen] = useState(false);
    const [selectedClassId, setSelectedClassId] = useState('');
    const [selectedAssessmentId, setSelectedAssessmentId] = useState('');
    const [grades, setGrades] = useState<Record<string, number | string>>({});

    const classAssessments = useMemo(() => customAssessments.filter(ca => ca.courseClassId === selectedClassId), [customAssessments, selectedClassId]);
    const classEnrollments = useMemo(() => enrollments.filter(en => en.courseClassId === selectedClassId), [enrollments, selectedClassId]);

    useEffect(() => {
        // Populate grades from state when assessment changes
        const newGrades: Record<string, number | string> = {};
        classEnrollments.forEach(en => {
            const grade = customAssessmentGrades.find(g => g.assessmentId === selectedAssessmentId && g.enrollmentId === en.id);
            if (grade) {
                newGrades[en.id] = grade.grade;
            }
        });
        setGrades(newGrades);
    }, [selectedAssessmentId, classEnrollments, customAssessmentGrades]);

    const handleSaveAssessment = (data: Omit<CustomAssessment, 'id'>) => {
        dispatch({ type: 'elearning/addCustomAssessment', payload: data });
    };

    const handleSaveGrade = (enrollmentId: string) => {
        const grade = Number(grades[enrollmentId]);
        if (!isNaN(grade) && selectedAssessmentId) {
            dispatch({ type: 'elearning/submitCustomGrade', payload: { assessmentId: selectedAssessmentId, enrollmentId, grade } });
        }
    };
    
    return (
        <div>
            <Card className="mb-4">
                <div className="grid grid-cols-2 gap-4">
                    <Select value={selectedClassId} onChange={e => {setSelectedClassId(e.target.value); setSelectedAssessmentId('');}}>
                        <option value="">-- Pilih Kelas --</option>
                        {courseClasses.map(cc => <option key={cc.id} value={cc.id}>{courses.find(c => c.id === cc.courseId)?.title} - {cc.name}</option>)}
                    </Select>
                    <Select value={selectedAssessmentId} onChange={e => setSelectedAssessmentId(e.target.value)} disabled={!selectedClassId}>
                        <option value="">-- Pilih Penilaian --</option>
                        {classAssessments.map(ca => <option key={ca.id} value={ca.id}>{ca.title}</option>)}
                    </Select>
                </div>
                 <Button onClick={() => setModalOpen(true)} size="sm" className="mt-2" disabled={!selectedClassId}>Buat Penilaian Baru untuk Kelas Ini</Button>
            </Card>
            {selectedAssessmentId && (
                <Card className="flex-grow overflow-y-auto">
                    <table className="w-full text-sm">
                         <thead><tr><th className="p-2 text-left">Nama Peserta</th><th className="p-2 text-left">Nilai</th><th className="p-2">Aksi</th></tr></thead>
                         <tbody>
                            {classEnrollments.map(en => {
                                const mentee = mentees.find(m => m.id === en.menteeId);
                                return (
                                    <tr key={en.id} className="border-t dark:border-gray-700">
                                        <td className="p-2 font-medium">{mentee?.name}</td>
                                        <td className="p-2">
                                            <Input type="number" className="w-24" value={grades[en.id] || ''} onChange={e => setGrades({...grades, [en.id]: e.target.value})} />
                                        </td>
                                        <td className="p-2">
                                            <Button size="sm" onClick={() => handleSaveGrade(en.id)}>Simpan</Button>
                                        </td>
                                    </tr>
                                );
                            })}
                         </tbody>
                    </table>
                </Card>
            )}
             <Modal isOpen={isModalOpen} onClose={() => setModalOpen(false)} title="Buat Penilaian Baru">
                <form onSubmit={(e) => { e.preventDefault(); handleSaveAssessment({ title: (e.target as any).title.value, courseClassId: selectedClassId }); setModalOpen(false); }}>
                    <Label>Judul Penilaian</Label>
                    <Input name="title" placeholder="cth. Nilai Praktikum" required />
                    <div className="flex justify-end pt-4"><Button type="submit">Simpan</Button></div>
                </form>
            </Modal>
        </div>
    );
};

export const GradingPage: React.FC = () => {
    const [view, setView] = useState<'test' | 'task' | 'custom'>('test');

    return (
        <div className="p-8 h-full flex flex-col">
            <h1 className="text-3xl font-bold mb-4">Penilaian Peserta</h1>
             <div className="flex space-x-2 border-b dark:border-gray-700 mb-6">
                <button onClick={() => setView('test')} className={`py-2 px-4 text-sm font-medium ${view === 'test' ? 'border-b-2 border-primary-500 text-primary-500' : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'}`}>Nilai Ujian</button>
                <button onClick={() => setView('task')} className={`py-2 px-4 text-sm font-medium ${view === 'task' ? 'border-b-2 border-primary-500 text-primary-500' : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'}`}>Nilai Tugas</button>
                <button onClick={() => setView('custom')} className={`py-2 px-4 text-sm font-medium ${view === 'custom' ? 'border-b-2 border-primary-500 text-primary-500' : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'}`}>Penilaian Lainnya</button>
            </div>
             <div className="flex-grow overflow-y-auto">
                {view === 'test' && <TestGradingView type="Test" />}
                {view === 'task' && <TestGradingView type="Tugas" />}
                {view === 'custom' && <CustomGradingView />}
            </div>
        </div>
    );
};
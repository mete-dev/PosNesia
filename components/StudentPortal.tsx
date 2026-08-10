// This is a new file: components/StudentPortal.tsx
import React, { useState, useMemo, useEffect, useRef } from 'react';
import { useAppContext } from '../hooks/useAppContext';
import { Course, Theme, Enrollment, MenteeTestAnswer, CourseTest, CourseClass, QuestionFormat, CustomerBill, CourseSchedule } from '../types';
import { DashboardIcon, UserCircleIcon, SunIcon, MoonIcon, StoreIcon, BookOpenIcon, DocumentTextIcon, ClipboardCheckIcon, PrinterIcon, BillIcon } from './icons';
import { Button, Modal, Select, Badge, Card, Input, Textarea, Label } from './ui';

// --- Theme Toggle Component ---
const ThemeToggle: React.FC = () => {
    const { state, dispatch } = useAppContext();
    const { theme } = state;
    const isDark = theme === Theme.Dark;
    const toggleTheme = () => dispatch({ type: 'ui/setTheme', payload: isDark ? Theme.Light : Theme.Dark });

    return (
        <button onClick={toggleTheme} className="p-2 rounded-full hover:bg-white/20">
            {isDark ? <SunIcon className="w-6 h-6" /> : <MoonIcon className="w-6 h-6" />}
        </button>
    );
};

// --- Shared Header ---
const PortalHeader: React.FC<{ title: string }> = ({ title }) => (
    <header className="fixed top-0 left-0 right-0 max-w-xl mx-auto bg-primary-600 dark:bg-primary-700 text-white p-4 flex justify-between items-center shadow-md flex-shrink-0 z-10">
        <h1 className="text-xl font-bold">{title}</h1>
    </header>
);

// --- Printable Card Components ---
const PrintableCardModal: React.FC<{
    isOpen: boolean;
    onClose: () => void;
    title: string;
    children: React.ReactNode;
}> = ({ isOpen, onClose, title, children }) => {
    const printRef = useRef<HTMLDivElement>(null);

    const handlePrint = () => {
        const printContent = printRef.current?.innerHTML;
        if (!printContent) return;

        const iframe = document.createElement('iframe');
        iframe.style.display = 'none';
        document.body.appendChild(iframe);
        const doc = iframe.contentWindow?.document;
        if (!doc) return;

        doc.open();
        doc.write(`
            <html>
            <head>
                <title>${title}</title>
                <script src="https://cdn.tailwindcss.com"></script>
                <style>
                    @page { size: 10cm 6cm; margin: 0; }
                    body { -webkit-print-color-adjust: exact; }
                </style>
            </head>
            <body>${printContent}</body>
            </html>
        `);
        doc.close();
        iframe.onload = () => {
            iframe.contentWindow?.focus();
            iframe.contentWindow?.print();
            document.body.removeChild(iframe);
        };
    };

    if (!isOpen) return null;
    return (
        <Modal isOpen={isOpen} onClose={onClose} title={title} footer={<Button onClick={handlePrint}>Cetak</Button>}>
             <div className="bg-gray-200 dark:bg-gray-900 p-4 flex justify-center items-center">
                <div ref={printRef}>{children}</div>
            </div>
        </Modal>
    );
};

const CourseCardPrintable: React.FC<{ enrollment: Enrollment }> = ({ enrollment }) => {
    const { state } = useAppContext();
    const { currentMentee, courses, staff, companyInfo, courseClasses } = state;
    const courseClass = courseClasses.find(cc => cc.id === enrollment.courseClassId);
    const course = courseClass ? courses.find(c => c.id === courseClass.courseId) : null;
    const instructor = courseClass ? staff.find(s => s.id === courseClass.mentorId) : null;

    if (!course || !currentMentee || !courseClass) return null;

    return (
        <div className="w-[10cm] h-[6cm] bg-white text-black p-3 flex flex-col border border-black font-sans text-xs">
            <div className="flex justify-between items-start border-b border-black pb-2">
                <div>
                    <h2 className="font-bold text-lg">KARTU RENCANA KURSUS</h2>
                    <h3 className="font-semibold">{course.title} - {courseClass.name}</h3>
                </div>
                {companyInfo.logoUrl ? <img src={companyInfo.logoUrl} alt="Logo" className="h-10 w-auto"/> : <StoreIcon className="h-10 w-10 text-gray-800"/>}
            </div>
            <div className="flex-grow pt-2 grid grid-cols-2 gap-x-4">
                <div>
                    <p><strong>Nama:</strong> {currentMentee.name}</p>
                    <p><strong>ID Peserta:</strong> {currentMentee.id}</p>
                </div>
                 <div>
                    <p><strong>Mentor:</strong> {instructor?.name || 'N/A'}</p>
                </div>
            </div>
            <p className="text-center text-[8px] text-gray-500 italic mt-auto">Kartu ini harap dibawa saat kursus berlangsung.</p>
        </div>
    );
};

const TestCardPrintable: React.FC<{ test: CourseTest }> = ({ test }) => {
    const { state } = useAppContext();
    const { currentMentee, courses, courseClasses } = state;
    const courseClass = courseClasses.find(cc => cc.id === test.courseClassId);
    const course = courseClass ? courses.find(c => c.id === courseClass.courseId) : null;
    if (!currentMentee || !course || !courseClass) return null;

    return (
         <div className="w-[10cm] h-[6cm] bg-white text-black p-3 flex flex-col border border-black font-sans text-xs">
            <h2 className="font-bold text-lg text-center border-b border-black pb-2">KARTU UJIAN</h2>
            <div className="flex-grow pt-2 space-y-2">
                <p><strong>Nama:</strong> {currentMentee.name}</p>
                <p><strong>ID Peserta:</strong> {currentMentee.id}</p>
                <p><strong>Kursus:</strong> {course.title} - {courseClass.name}</p>
                <p><strong>Ujian:</strong> {test.title}</p>
                 <p><strong>Waktu:</strong> {new Date(test.availableFrom).toLocaleString('id-ID')}</p>
            </div>
             <p className="text-center text-[8px] text-gray-500 italic mt-auto">Harap persiapkan diri Anda dengan baik. Semoga berhasil!</p>
        </div>
    );
};

const ResultCardPrintable: React.FC<{ submission: MenteeTestAnswer }> = ({ submission }) => {
    const { state } = useAppContext();
    const { currentMentee, courses, courseClasses, courseTests } = state;
    const test = courseTests.find(t => t.id === submission.testId);
    const courseClass = test ? courseClasses.find(cc => cc.id === test.courseClassId) : null;
    const course = courseClass ? courses.find(c => c.id === courseClass.courseId) : null;

    if (!currentMentee || !course || !courseClass || !test) return null;

    const finalGrade = submission.manualGrade ?? submission.score;

    return (
         <div className="w-[10cm] h-[6cm] bg-white text-black p-3 flex flex-col border border-black font-sans">
            <h2 className="font-bold text-lg text-center border-b border-black pb-2">KARTU HASIL UJIAN</h2>
            <div className="flex-grow pt-2 space-y-1 text-xs">
                <p><strong>Nama:</strong> {currentMentee.name}</p>
                <p><strong>ID Peserta:</strong> {currentMentee.id}</p>
                <p><strong>Kursus:</strong> {course.title} - {courseClass.name}</p>
                <p><strong>Ujian:</strong> {test.title}</p>
            </div>
            <div className="text-center">
                <p className="text-sm">NILAI AKHIR</p>
                <p className="text-6xl font-bold">{finalGrade}</p>
            </div>
        </div>
    );
};

// --- Page Components ---

const DashboardPage: React.FC = () => {
    const { state } = useAppContext();
    const { currentMentee } = state;
    if (!currentMentee) return null;
    
    return (
        <div className="p-4 space-y-4 pt-20">
            <PortalHeader title="Dasbor Peserta" />
            <div className="bg-gradient-to-br from-primary-500 to-primary-400 text-white p-6 rounded-xl shadow-lg">
                <h2 className="text-lg">Selamat Datang, {currentMentee.name}!</h2>
                <p className="text-sm opacity-80">ID Peserta: {currentMentee.id}</p>
            </div>
             <p className="text-gray-600 dark:text-gray-400">Gunakan menu navigasi di bawah untuk mengakses fitur kursus Anda.</p>
        </div>
    );
};

const FinancePage: React.FC = () => {
    const { state } = useAppContext();
    const { customerBills, currentMentee } = state;
    const [isPaymentModalOpen, setPaymentModalOpen] = useState(false);
    const [selectedBill, setSelectedBill] = useState<CustomerBill | null>(null);

    const { unpaidBills, paidBills } = useMemo(() => {
        const myBills = customerBills.filter(b => b.customerId === currentMentee?.id);
        return {
            unpaidBills: myBills.filter(b => b.status === 'Unpaid'),
            paidBills: myBills.filter(b => b.status === 'Paid')
        }
    }, [customerBills, currentMentee]);

    const handleShowPayment = (bill: CustomerBill) => {
        setSelectedBill(bill);
        setPaymentModalOpen(true);
    };

    return (
        <div className="p-4 space-y-6 pt-20">
            <PortalHeader title="Keuangan" />
            <section>
                <h2 className="text-xl font-bold mb-2">Tagihan Belum Lunas</h2>
                <div className="space-y-4">
                    {unpaidBills.length > 0 ? unpaidBills.map(bill => (
                        <Card key={bill.id}>
                            <p className="font-semibold">{bill.description}</p>
                            <p className="text-sm text-gray-500">Jatuh Tempo: {new Date(bill.dueDate).toLocaleDateString('id-ID')}</p>
                            <div className="flex justify-between items-center mt-2">
                                <p className="text-lg font-bold text-red-500">Rp{bill.amount.toLocaleString('id-ID')}</p>
                                <Button onClick={() => handleShowPayment(bill)}>Cara Bayar</Button>
                            </div>
                        </Card>
                    )) : <p className="text-sm text-gray-500">Tidak ada tagihan yang belum lunas.</p>}
                </div>
            </section>
            <section>
                <h2 className="text-xl font-bold mb-2">Riwayat Transaksi</h2>
                <div className="space-y-2">
                    {paidBills.length > 0 ? paidBills.map(bill => (
                         <div key={bill.id} className="bg-white dark:bg-gray-800 p-3 rounded-lg flex justify-between items-center text-sm">
                            <div>
                                <p>{bill.description}</p>
                                <p className="text-xs text-gray-500">{new Date(bill.paidDate!).toLocaleDateString('id-ID')}</p>
                            </div>
                            <p className="font-semibold text-green-600">Rp{bill.amount.toLocaleString('id-ID')}</p>
                        </div>
                    )) : <p className="text-sm text-gray-500">Tidak ada riwayat transaksi.</p>}
                </div>
            </section>
             <PaymentInstructionsModal
                isOpen={isPaymentModalOpen}
                onClose={() => setPaymentModalOpen(false)}
                bill={selectedBill}
            />
        </div>
    );
};

const AdministrationPage: React.FC<{ studentEnrollmentsDetails: any[] }> = ({ studentEnrollmentsDetails }) => {
    const { state, dispatch } = useAppContext();
    const { courseClasses, courses, elearningPeriods, courseTests, menteeTestAnswers } = state;
    const [modalContent, setModalContent] = useState<React.ReactNode | null>(null);
    const [modalTitle, setModalTitle] = useState('');

    // Enrollment Logic
    const now = new Date();
    const isRegistrationPeriod = now >= new Date(elearningPeriods.registrationStart) && now <= new Date(elearningPeriods.registrationEnd);
    const enrolledClassIds = studentEnrollmentsDetails.map(d => d.enrollment.courseClassId);
    
    const handleEnroll = (courseClassId: string) => {
        dispatch({ type: 'elearning/enrollStudent', payload: { courseClassId } });
        alert("Pendaftaran berhasil! Silakan cek halaman 'Keuangan' untuk melihat tagihan.");
    };

    // Print Logic
    const isTestPrintPeriod = now >= new Date(elearningPeriods.testStart) && now <= new Date(elearningPeriods.testEnd);
    const isResultPrintPeriod = now >= new Date(elearningPeriods.resultsRelease);
    const validEnrollments = studentEnrollmentsDetails.filter(d => d.isPaid);
    const validClassIds = validEnrollments.map(d => d.enrollment.courseClassId);
    const printableTests = courseTests.filter(t => validClassIds.includes(t.courseClassId));
    const printableSubmissions = menteeTestAnswers.filter(ans => {
        const enrollment = state.enrollments.find(e => e.id === ans.enrollmentId);
        return enrollment && validClassIds.includes(enrollment.courseClassId);
    });

    const handlePrint = (type: 'course' | 'test' | 'result', data: any) => {
        if (type === 'course') { setModalTitle('Cetak Kartu Kursus'); setModalContent(<CourseCardPrintable enrollment={data} />); }
        else if (type === 'test') { setModalTitle('Cetak Kartu Ujian'); setModalContent(<TestCardPrintable test={data} />); }
        else if (type === 'result') { setModalTitle('Cetak Kartu Hasil Ujian'); setModalContent(<ResultCardPrintable submission={data} />); }
    };

    return (
        <div className="p-4 space-y-6 pt-20">
            <PortalHeader title="Administrasi" />
            
            <Card>
                <h2 className="text-xl font-bold mb-2">Pendaftaran Kursus</h2>
                {!isRegistrationPeriod && <p className="text-sm text-gray-500">Periode pendaftaran saat ini ditutup. Periode berikutnya: {new Date(elearningPeriods.registrationStart).toLocaleDateString('id-ID')}</p>}
                {isRegistrationPeriod && (
                    <div className="space-y-4">
                        {courseClasses.map(cc => {
                            const course = courses.find(c => c.id === cc.courseId);
                            const isEnrolled = enrolledClassIds.includes(cc.id);
                            return (
                                <div key={cc.id} className="p-2 border-b dark:border-gray-700">
                                    <h3 className="font-semibold">{course?.title} - {cc.name}</h3>
                                    <div className="flex justify-between items-center">
                                        <p className="text-primary-600 font-bold">Rp{cc.price.toLocaleString('id-ID')}</p>
                                        <Button size="sm" onClick={() => handleEnroll(cc.id)} disabled={isEnrolled}>
                                            {isEnrolled ? 'Terdaftar' : 'Pilih Kursus'}
                                        </Button>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </Card>

            <Card>
                <h2 className="text-xl font-bold mb-2">Cetak Kartu</h2>
                <div className="space-y-4">
                    <div>
                        <h3 className="font-semibold text-md">Kartu Kursus</h3>
                        {validEnrollments.map(({ enrollment, course, courseClass }) => (
                             <div key={enrollment.id} className="flex justify-between items-center p-2 text-sm">
                                <span>{course?.title} - {courseClass?.name}</span>
                                <Button size="sm" variant="secondary" onClick={() => handlePrint('course', enrollment)}>Cetak</Button>
                            </div>
                        ))}
                    </div>
                     <div>
                        <h3 className="font-semibold text-md">Kartu Ujian</h3>
                        {!isTestPrintPeriod && <p className="text-sm text-gray-500">Tersedia pada periode ujian.</p>}
                        {isTestPrintPeriod && printableTests.map(test => (
                            <div key={test.id} className="flex justify-between items-center p-2 text-sm">
                                <span>{test.title}</span>
                                <Button size="sm" variant="secondary" onClick={() => handlePrint('test', test)}>Cetak</Button>
                            </div>
                        ))}
                    </div>
                     <div>
                        <h3 className="font-semibold text-md">Kartu Hasil Ujian</h3>
                        {!isResultPrintPeriod && <p className="text-sm text-gray-500">Tersedia setelah pengumuman hasil.</p>}
                        {isResultPrintPeriod && printableSubmissions.map(submission => {
                            const test = courseTests.find(t => t.id === submission.testId);
                            return (
                                 <div key={submission.id} className="flex justify-between items-center p-2 text-sm">
                                    <span>{test?.title}</span>
                                    <Button size="sm" variant="secondary" onClick={() => handlePrint('result', submission)}>Cetak</Button>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </Card>

            <PrintableCardModal isOpen={!!modalContent} onClose={() => setModalContent(null)} title={modalTitle}>
                {modalContent}
            </PrintableCardModal>
        </div>
    );
};

const CourseDetailView: React.FC<{ courseDetails: any }> = ({ courseDetails }) => {
    const { state, dispatch } = useAppContext();
    const { courseTests, menteeAttendances } = state;
    const { enrollment, course, courseClass } = courseDetails;

    const isSessionActive = (schedule: CourseSchedule) => {
        const now = new Date();
        const start = new Date(schedule.dateTime);
        const end = new Date(start.getTime() + 2 * 60 * 60 * 1000); // Assume 2 hour session
        return now >= start && now <= end;
    };

    const handleMarkAttendance = (scheduleId: string) => {
        dispatch({ type: 'elearning/markStudentAttendance', payload: { enrollmentId: enrollment.id, scheduleId } });
        alert("Kehadiran berhasil dicatat!");
    };
    
    return (
        <Card>
            <h2 className="text-xl font-bold">{course.title} - {courseClass.name}</h2>
            <div className="mt-4 space-y-4">
                <h3 className="font-semibold">Jadwal & Kehadiran</h3>
                {courseClass.schedules.map((schedule: CourseSchedule) => {
                    const attendance = menteeAttendances.find(a => a.enrollmentId === enrollment.id && a.scheduleId === schedule.id);
                    const testsForSchedule = courseTests.filter(t => t.scheduleId === schedule.id);
                    return (
                        <div key={schedule.id} className="p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                            <div className="flex justify-between items-center">
                                <div>
                                    <p className="font-semibold">{new Date(schedule.dateTime).toLocaleString('id-ID', { dateStyle: 'full', timeStyle: 'short' })}</p>
                                    <p className="text-xs text-gray-500">Lokasi: {schedule.location}</p>
                                </div>
                                {attendance ? (
                                    <Badge variant={attendance.status === 'Present' ? 'success' : 'danger'}>{attendance.status}</Badge>
                                ) : isSessionActive(schedule) ? (
                                    <Button size="sm" onClick={() => handleMarkAttendance(schedule.id)}>Absen Sekarang</Button>
                                ) : (
                                    <Badge>Belum Hadir</Badge>
                                )}
                            </div>
                            {testsForSchedule.length > 0 && (
                                <div className="mt-2 pt-2 border-t dark:border-gray-600">
                                    <h4 className="text-sm font-semibold mb-1">Tugas/Tes:</h4>
                                    {testsForSchedule.map(test => (
                                        <div key={test.id} className="flex justify-between items-center text-sm p-2 bg-white dark:bg-gray-800 rounded-md">
                                            <span>{test.title} ({test.type})</span>
                                            <Button size="sm" variant="secondary">Kerjakan</Button>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>
        </Card>
    );
};

const MyCoursesPage: React.FC<{ studentEnrollmentsDetails: any[] }> = ({ studentEnrollmentsDetails }) => {
    const [selectedCourseEnrollment, setSelectedCourseEnrollment] = useState<any | null>(null);

    const paidEnrollments = studentEnrollmentsDetails.filter(d => d.isPaid);

    if (selectedCourseEnrollment) {
        return (
            <div className="p-4 pt-20">
                <PortalHeader title="Detail Kursus" />
                <button onClick={() => setSelectedCourseEnrollment(null)} className="mb-4 text-primary-600 dark:text-primary-400 font-semibold">
                    &larr; Kembali ke Daftar Kursus
                </button>
                <CourseDetailView courseDetails={selectedCourseEnrollment} />
            </div>
        )
    }

    return (
        <div className="p-4 space-y-4 pt-20">
            <PortalHeader title="Kursus Saya" />
            {paidEnrollments.map(details => (
                <button key={details.enrollment.id} onClick={() => setSelectedCourseEnrollment(details)} className="w-full text-left">
                    <Card>
                        <h2 className="text-lg font-bold">{details.course?.title} - {details.courseClass?.name}</h2>
                        <Badge variant="info">
                            {details.isCoursePeriod ? 'Periode Aktif' : `Mulai ${new Date(details.elearningPeriods.courseStart).toLocaleDateString()}`}
                        </Badge>
                    </Card>
                </button>
            ))}
        </div>
    );
};

const ProfilePage: React.FC = () => {
    const { state, dispatch } = useAppContext();
    const { currentMentee } = state;
    if (!currentMentee) return null;

    return (
        <div className="p-4 space-y-4 pt-20">
            <PortalHeader title="Profil Peserta" />
            <Card>
                <h2 className="font-bold">{currentMentee.name}</h2>
                <p>ID: {currentMentee.id}</p>
                <p>Email: {currentMentee.email}</p>
                <p>Telepon: {currentMentee.phone}</p>
            </Card>
            <Button onClick={() => dispatch({ type: 'auth/studentLogout' })} variant="danger" className="w-full">Logout</Button>
        </div>
    );
};


// --- Main Mentee Portal ---
type MenteePage = 'dashboard' | 'myCourses' | 'admin' | 'finance' | 'profile';

export const MenteePortal: React.FC = () => {
    const [page, setPage] = useState<MenteePage>('dashboard');
    const { state } = useAppContext();
    const { currentMentee, enrollments, customerBills, elearningPeriods, courseClasses, courses } = state;

    const studentEnrollmentsDetails = useMemo(() => {
        if (!currentMentee) return [];
        const now = new Date();
        const courseStart = new Date(elearningPeriods.courseStart);
        const isCoursePeriod = now >= courseStart;

        return enrollments
            .filter(en => en.menteeId === currentMentee.id)
            .map(en => {
                const bill = customerBills.find(b => b.sourceType === 'ElearningEnrollment' && b.sourceId === en.id);
                const isPaid = !bill || bill.status === 'Paid';
                const courseClass = courseClasses.find(cc => cc.id === en.courseClassId);
                const course = courseClass ? courses.find(c => c.id === courseClass.courseId) : null;
                return {
                    enrollment: en,
                    bill,
                    isPaid,
                    isCoursePeriod,
                    courseClass,
                    course,
                    elearningPeriods // Pass periods down for context
                };
            });
    }, [currentMentee, enrollments, customerBills, elearningPeriods, courseClasses, courses]);


    const renderPage = () => {
        switch (page) {
            case 'dashboard': return <DashboardPage />;
            case 'myCourses': return <MyCoursesPage studentEnrollmentsDetails={studentEnrollmentsDetails} />;
            case 'admin': return <AdministrationPage studentEnrollmentsDetails={studentEnrollmentsDetails} />;
            case 'finance': return <FinancePage />;
            case 'profile': return <ProfilePage />;
            default: return <DashboardPage />;
        }
    };
    
    const NavItem: React.FC<{
        label: string;
        pageName: MenteePage;
        icon: React.ReactElement;
    }> = ({ label, pageName, icon }) => (
        <button onClick={() => setPage(pageName)} className={`flex-1 p-2 flex flex-col items-center justify-center gap-1 ${page === pageName ? 'text-primary-500' : 'text-gray-500 dark:text-gray-400'}`}>
            {React.cloneElement<{ className?: string }>(icon, { className: "w-6 h-6" })}
            <span className="text-xs font-medium">{label}</span>
        </button>
    );

    return (
        <div className="max-w-xl mx-auto bg-gray-100 dark:bg-gray-900 h-screen flex flex-col font-sans">
            <main className="flex-grow overflow-y-auto pb-16">
                {renderPage()}
            </main>
            <nav className="fixed bottom-0 left-0 right-0 max-w-xl mx-auto bg-white dark:bg-gray-800 border-t dark:border-gray-700 flex justify-around flex-shrink-0 z-10">
                <NavItem label="Dasbor" pageName="dashboard" icon={<DashboardIcon />} />
                <NavItem label="Kursus" pageName="myCourses" icon={<BookOpenIcon />} />
                <NavItem label="Administrasi" pageName="admin" icon={<ClipboardCheckIcon />} />
                <NavItem label="Keuangan" pageName="finance" icon={<BillIcon />} />
                <NavItem label="Profil" pageName="profile" icon={<UserCircleIcon />} />
            </nav>
        </div>
    );
};

const PaymentInstructionsModal: React.FC<{
    isOpen: boolean;
    onClose: () => void;
    bill: CustomerBill | null;
}> = ({ isOpen, onClose, bill }) => {
    const { state } = useAppContext();
    const bankAccounts = useMemo(() => {
        return state.accounts.filter(a => a.isCashAccount && a.cashAccountType === 'Rekening');
    }, [state.accounts]);

    if (!isOpen || !bill) return null;

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Instruksi Pembayaran">
            <div className="space-y-6">
                <div className="text-center">
                    <p className="text-gray-500 dark:text-gray-400">Total Tagihan</p>
                    <p className="text-3xl font-bold">Rp{bill.amount.toLocaleString('id-ID')}</p>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{bill.description}</p>
                </div>

                <div className="p-4 bg-gray-100 dark:bg-gray-700/50 rounded-lg">
                    <h3 className="font-bold mb-2">Bayar di Kasir / Teller</h3>
                    <p className="text-sm">Sebutkan Nomor Virtual Account di bawah ini saat melakukan pembayaran di kasir kami atau melalui teller bank.</p>
                    <p className="text-center font-mono text-xl font-bold bg-white dark:bg-gray-800 p-3 rounded-md my-2 text-primary-600 dark:text-primary-400">
                        {bill.virtualAccountNumber || 'N/A'}
                    </p>
                </div>
                
                <div className="p-4 bg-gray-100 dark:bg-gray-700/50 rounded-lg">
                    <h3 className="font-bold mb-2">Transfer Bank</h3>
                    <p className="text-sm mb-3">Anda dapat mentransfer ke salah satu rekening berikut. Pastikan untuk menyertakan nomor tagihan (<strong className="font-mono">{bill.id}</strong>) dalam berita transfer.</p>
                    <ul className="space-y-2">
                        {bankAccounts.map(acc => (
                            <li key={acc.id} className="text-sm font-semibold">{acc.name}</li>
                        ))}
                    </ul>
                </div>
            </div>
        </Modal>
    );
};
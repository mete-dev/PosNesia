

import React, { useState, useEffect } from 'react';
import { Theme, CompanyInfo, ReportLayoutSettings, AccentColor, PaperSize, ThemeConfig, GradientTheme, SingleColorTheme } from '../types';
import { useAppContext } from '../hooks/useAppContext';
import { gradientThemes } from '../utils/colors';
import { Database, Download, Upload, ShieldCheck, RefreshCw, AlertTriangle, Printer, Save, Info, Shield, FileText } from 'lucide-react';

// --- Shared Components ---
const Label: React.FC<{ htmlFor?: string, children: React.ReactNode, className?: string }> = ({ htmlFor, children, className }) => (
    <label htmlFor={htmlFor} className={`block text-sm font-medium text-gray-700 dark:text-gray-300 ${className}`}>{children}</label>
);
const Select: React.FC<React.SelectHTMLAttributes<HTMLSelectElement>> = (props) => (
     <select {...props} className={`mt-1 block w-full rounded-md bg-gray-100 dark:bg-gray-700 border-transparent focus:border-primary-500 focus:bg-white dark:focus:bg-gray-600 focus:ring-0 px-3 py-2 ${props.className}`} />
);
const Input: React.FC<React.InputHTMLAttributes<HTMLInputElement>> = (props) => (
    <input {...props} className={`mt-1 block w-full rounded-md bg-gray-100 dark:bg-gray-700 border-transparent focus:border-primary-500 focus:bg-white dark:focus:bg-gray-600 focus:ring-0 px-3 py-2 text-sm text-gray-900 dark:text-white ${props.className || ''}`} />
);
const Button: React.FC<React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: string }> = ({ variant, className, children, ...rest }) => (
    <button
        {...rest}
        className={`inline-flex items-center justify-center rounded-xl font-semibold transition-all focus:outline-none disabled:opacity-50 py-2 px-4 text-sm ${variant === 'secondary' ? 'bg-white dark:bg-zinc-800 text-slate-700 dark:text-zinc-200 border border-slate-200 dark:border-zinc-700 hover:bg-slate-50 dark:hover:bg-zinc-700' : 'bg-blue-600 hover:bg-blue-700 text-white'} ${className || ''}`}
    >{children}</button>
);
const Badge: React.FC<{ variant?: string, children: React.ReactNode }> = ({ variant, children }) => {
    const colors: Record<string, string> = {
        info: 'bg-blue-100 text-blue-800 dark:bg-blue-900/60 dark:text-blue-300',
        success: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/60 dark:text-emerald-300',
        warning: 'bg-amber-100 text-amber-800 dark:bg-amber-900/60 dark:text-amber-300',
        default: 'bg-slate-100 text-slate-700 dark:bg-zinc-800 dark:text-zinc-300',
    };
    return <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold ${colors[variant || 'default']}`}>{children}</span>;
};

// --- 1. Company Information Settings Page ---

export const CompanyInformationSettingsPage: React.FC = () => {
    const { state, dispatch } = useAppContext();
    const { companyInfo } = state;
    const [formState, setFormState] = useState(companyInfo);
    const [logoPreview, setLogoPreview] = useState<string>(companyInfo.logoUrl);

    useEffect(() => {
        setFormState(companyInfo);
        setLogoPreview(companyInfo.logoUrl);
    }, [companyInfo]);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormState(prev => ({ ...prev, [name]: value }));
    };

    const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            const reader = new FileReader();
            reader.onloadend = () => {
                const result = reader.result as string;
                setLogoPreview(result);
                setFormState(prev => ({ ...prev, logoUrl: result }));
            };
            reader.readAsDataURL(file);
        }
    };
    
    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        dispatch({ type: 'company/updateInfo', payload: formState });
        alert("Informasi perusahaan berhasil diperbarui!");
    };

    const handleExportData = () => {
        try {
            const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(state, null, 2));
            const downloadAnchor = document.createElement('a');
            downloadAnchor.setAttribute("href", dataStr);
            downloadAnchor.setAttribute("download", `posnesia_backup_${new Date().toISOString().slice(0, 10)}.json`);
            document.body.appendChild(downloadAnchor);
            downloadAnchor.click();
            downloadAnchor.remove();
        } catch (e) {
            alert('Gagal mengekspor data.');
        }
    };

    const handleImportData = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (event) => {
            try {
                const parsed = JSON.parse(event.target?.result as string);
                if (parsed && typeof parsed === 'object') {
                    localStorage.setItem('posnesia_local_state_v1', JSON.stringify(parsed));
                    alert('Data berhasil dipulihkan! Halaman akan dimuat ulang.');
                    window.location.reload();
                } else {
                    alert('Format file cadangan tidak valid.');
                }
            } catch (err) {
                alert('Gagal membaca file JSON.');
            }
        };
        reader.readAsText(file);
    };
    
    return (
        <div className="p-4 sm:p-6 w-full h-full overflow-y-auto space-y-6">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">Informasi Perusahaan</h1>
            
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6 sm:p-8 w-full">
                <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="flex items-center space-x-6">
                        <div className="shrink-0">
                            {logoPreview ? (
                                <img className="h-20 w-20 object-contain rounded-md bg-gray-200 dark:bg-gray-700 p-1" src={logoPreview} alt="Logo saat ini" />
                            ) : (
                                <div className="h-20 w-20 flex items-center justify-center bg-gray-200 dark:bg-gray-700 rounded-md text-gray-500">
                                    Tanpa Logo
                                </div>
                            )}
                        </div>
                        <label className="block">
                            <span className="sr-only">Pilih foto profil</span>
                            <input type="file" onChange={handleLogoChange} accept="image/*" className="block w-full text-sm text-gray-500 dark:text-gray-400 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-primary-50 file:text-primary-700 hover:file:bg-primary-100"/>
                        </label>
                    </div>
                     <div>
                        <Label htmlFor="name">Nama Perusahaan</Label>
                        <input type="text" id="name" name="name" value={formState.name} onChange={handleInputChange} className="mt-1 block w-full rounded-md bg-gray-100 dark:bg-gray-700 border-transparent focus:border-primary-500 focus:bg-white dark:focus:bg-gray-600 focus:ring-0 px-3 py-2"/>
                    </div>
                     <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <Label htmlFor="email">Email Kontak</Label>
                            <input type="email" id="email" name="email" value={formState.email} onChange={handleInputChange} className="mt-1 block w-full rounded-md bg-gray-100 dark:bg-gray-700 border-transparent focus:border-primary-500 focus:bg-white dark:focus:bg-gray-600 focus:ring-0 px-3 py-2"/>
                        </div>
                        <div>
                            <Label htmlFor="phone">Telepon Kontak</Label>
                            <input type="tel" id="phone" name="phone" value={formState.phone} onChange={handleInputChange} className="mt-1 block w-full rounded-md bg-gray-100 dark:bg-gray-700 border-transparent focus:border-primary-500 focus:bg-white dark:focus:bg-gray-600 focus:ring-0 px-3 py-2"/>
                        </div>
                    </div>
                     <div>
                        <Label htmlFor="address">Alamat</Label>
                        <textarea id="address" name="address" rows={2} value={formState.address} onChange={handleInputChange} className="mt-1 block w-full rounded-md bg-gray-100 dark:bg-gray-700 border-transparent focus:border-primary-500 focus:bg-white dark:focus:bg-gray-600 focus:ring-0 px-3 py-2"></textarea>
                    </div>

                    {/* Mode / Kategori Kasir POS Utama */}
                    <div className="pt-2">
                        <Label className="font-bold text-gray-900 dark:text-white text-sm mb-1">
                            Kategori &amp; Mode Kasir POS Utama
                        </Label>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mb-3">
                            Pilih mode kerja kasir POS (sinkron dengan pilihan registrasi awal). Mode ini menentukan alur transaksi, layout kasir, denah meja, dan kitchen ticket.
                        </p>
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                            {[
                                { id: 'retail', name: 'Ritel & Toko (Retail POS)', desc: 'Scan barcode, stok realtime, transaksi instan' },
                                { id: 'production_retail', name: 'Produksi & Ritel (Bakery)', desc: 'Pencatatan batch, barang rusak/spoilage' },
                                { id: 'qsr', name: 'Saji Cepat (QSR / Cafe)', desc: 'Pay-first, quick grid menu, KDS dapur' },
                                { id: 'fsr', name: 'Restoran (FSR)', desc: 'Pay-later, visual denah meja, open bill' },
                                { id: 'service_job', name: 'Jasa & Laundry', desc: 'Nota pekerjaan/Work Order, tracking status' },
                                { id: 'appointment_commission', name: 'Salon & Barbershop', desc: 'Jadwal booking, komisi & bagi hasil staf' },
                            ].map((item) => (
                                <button
                                    key={item.id}
                                    type="button"
                                    onClick={() => setFormState(prev => ({ ...prev, businessType: item.id as any }))}
                                    className={`p-3.5 rounded-xl border text-left transition-all ${
                                        formState.businessType === item.id || (!formState.businessType && item.id === 'retail')
                                            ? 'bg-blue-50 dark:bg-blue-950/60 border-blue-600 text-blue-900 dark:text-blue-200 shadow-xs font-bold'
                                            : 'bg-gray-50 dark:bg-gray-700/50 border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                                    }`}
                                >
                                    <div className="text-xs font-bold">{item.name}</div>
                                    <div className="text-[10px] text-gray-500 dark:text-gray-400 mt-1">{item.desc}</div>
                                </button>
                            ))}
                        </div>
                    </div>
                    <div className="flex justify-end">
                        <button type="submit" className="px-6 py-2 rounded-md text-white bg-primary-600 hover:bg-primary-700 font-semibold">
                            Simpan Perubahan
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export const AboutPage: React.FC = () => {
    const [activeTab, setActiveTab] = useState<'about' | 'updates' | 'privacy' | 'terms'>('about');

    return (
        <div className="w-full h-full flex flex-col p-4 md:p-6 space-y-5 overflow-y-auto bg-slate-50/50 dark:bg-zinc-950">
            {/* Header Bar */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 shrink-0">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 text-white flex items-center justify-center shadow-xs shrink-0">
                        <Info className="w-5 h-5" />
                    </div>
                    <div>
                        <h1 className="text-xl font-black text-slate-900 dark:text-white leading-tight">
                            Tentang &amp; Pembaruan Aplikasi
                        </h1>
                    </div>
                </div>
            </div>

            {/* Navigation Tabs Bar */}
            <div className="bg-white dark:bg-zinc-900 p-1.5 rounded-2xl border border-slate-200/80 dark:border-zinc-800 shadow-2xs flex items-center gap-1.5 shrink-0 overflow-x-auto">
                <button
                    type="button"
                    onClick={() => setActiveTab('about')}
                    className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                        activeTab === 'about'
                            ? 'bg-blue-600 text-white shadow-xs'
                            : 'text-slate-600 dark:text-zinc-400 hover:bg-slate-100 dark:hover:bg-zinc-800'
                    }`}
                >
                    <Info className="w-4 h-4" />
                    <span>Tentang PosNesia</span>
                </button>
                <button
                    type="button"
                    onClick={() => setActiveTab('updates')}
                    className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                        activeTab === 'updates'
                            ? 'bg-blue-600 text-white shadow-xs'
                            : 'text-slate-600 dark:text-zinc-400 hover:bg-slate-100 dark:hover:bg-zinc-800'
                    }`}
                >
                    <RefreshCw className="w-4 h-4" />
                    <span>Pembaruan Sistem</span>
                </button>
                <button
                    type="button"
                    onClick={() => setActiveTab('privacy')}
                    className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                        activeTab === 'privacy'
                            ? 'bg-blue-600 text-white shadow-xs'
                            : 'text-slate-600 dark:text-zinc-400 hover:bg-slate-100 dark:hover:bg-zinc-800'
                    }`}
                >
                    <Shield className="w-4 h-4" />
                    <span>Kebijakan Privasi</span>
                </button>
                <button
                    type="button"
                    onClick={() => setActiveTab('terms')}
                    className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                        activeTab === 'terms'
                            ? 'bg-blue-600 text-white shadow-xs'
                            : 'text-slate-600 dark:text-zinc-400 hover:bg-slate-100 dark:hover:bg-zinc-800'
                    }`}
                >
                    <FileText className="w-4 h-4" />
                    <span>Ketentuan Penggunaan</span>
                </button>
            </div>

            {/* Tab Content */}
            <div className="flex-1 min-h-0 space-y-4">
                {activeTab === 'about' && <AboutTabContent />}
                {activeTab === 'updates' && <AppUpdateCard />}
                {activeTab === 'privacy' && <PrivacyPolicyTabContent />}
                {activeTab === 'terms' && <TermsOfServiceTabContent />}
            </div>
        </div>
    );
};

const AboutTabContent: React.FC = () => {
    return (
        <div className="space-y-4">
            <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-slate-200/80 dark:border-zinc-800 p-6 shadow-2xs space-y-6">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-100 dark:border-zinc-800 pb-5">
                    <div className="flex items-center gap-4">
                        <img src="/logoposnesia.png" alt="PosNesia" className="h-12 object-contain shrink-0" />
                        <div>
                            <h2 className="text-lg font-black text-slate-900 dark:text-white">PosNesia ERP &amp; POS Desktop</h2>
                            <p className="text-xs text-slate-500 dark:text-zinc-400 mt-0.5">
                                Sistem Manajemen Kasir, Stok, dan Keuangan Terintegrasi
                            </p>
                        </div>
                    </div>
                    <Badge variant="info">Versi 1.0.2 (Stable Build)</Badge>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <div className="p-4 rounded-xl bg-slate-50 dark:bg-zinc-800/40 border border-slate-200/60 dark:border-zinc-700/60 space-y-1.5">
                        <div className="w-8 h-8 rounded-lg bg-blue-100 dark:bg-blue-900/60 text-blue-600 dark:text-blue-400 flex items-center justify-center font-bold text-sm">
                            ⚡
                        </div>
                        <h3 className="font-extrabold text-slate-900 dark:text-white text-xs">
                            POS Kasir Cepat
                        </h3>
                        <p className="text-[11px] text-slate-500 dark:text-zinc-400 leading-normal">
                            Transaksi kilat, barcode scanner, struk nota thermal 58mm/80mm, serta denah meja restoran.
                        </p>
                    </div>

                    <div className="p-4 rounded-xl bg-slate-50 dark:bg-zinc-800/40 border border-slate-200/60 dark:border-zinc-700/60 space-y-1.5">
                        <div className="w-8 h-8 rounded-lg bg-emerald-100 dark:bg-emerald-900/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold text-sm">
                            📊
                        </div>
                        <h3 className="font-extrabold text-slate-900 dark:text-white text-xs">
                            Keuangan &amp; Laba Rugi
                        </h3>
                        <p className="text-[11px] text-slate-500 dark:text-zinc-400 leading-normal">
                            Laporan laba rugi, posisi keuangan, mutasi stok, serta pencatatan arus kas otomatis.
                        </p>
                    </div>

                    <div className="p-4 rounded-xl bg-slate-50 dark:bg-zinc-800/40 border border-slate-200/60 dark:border-zinc-700/60 space-y-1.5">
                        <div className="w-8 h-8 rounded-lg bg-amber-100 dark:bg-amber-900/60 text-amber-600 dark:text-amber-400 flex items-center justify-center font-bold text-sm">
                            🔄
                        </div>
                        <h3 className="font-extrabold text-slate-900 dark:text-white text-xs">
                            Auto Update
                        </h3>
                        <p className="text-[11px] text-slate-500 dark:text-zinc-400 leading-normal">
                            Pembaruan fitur &amp; sistem otomatis dari repositori resmi tanpa perlu instalasi ulang manual.
                        </p>
                    </div>
                </div>

                <div className="border-t border-slate-100 dark:border-zinc-800 pt-4 flex flex-col sm:flex-row justify-between items-center text-[11px] text-slate-400 dark:text-zinc-500 gap-2">
                    <div>© 2026 PosNesia Team. Hak Cipta Dilindungi.</div>
                    <div className="font-mono">Lisensi Resmi PosNesia ID</div>
                </div>
            </div>
        </div>
    );
};

const PrivacyPolicyTabContent: React.FC = () => {
    return (
        <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-slate-200/80 dark:border-zinc-800 p-6 shadow-2xs space-y-4 text-xs text-slate-700 dark:text-zinc-300">
            <h2 className="text-sm font-black text-slate-900 dark:text-white flex items-center gap-2 border-b border-slate-100 dark:border-zinc-800 pb-3">
                <Shield className="w-4 h-4 text-blue-600" /> Kebijakan Privasi Data Usaha
            </h2>
            <div className="space-y-3">
                <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-zinc-800/40 border border-slate-200/60 dark:border-zinc-700/60">
                    <h3 className="font-bold text-slate-900 dark:text-white text-xs">1. Penyimpanan Data Lokal (On-Premise)</h3>
                    <p className="text-[11px] text-slate-500 dark:text-zinc-400 mt-1 leading-normal">
                        Seluruh data transaksi, keuangan, stok barang, dan identitas toko Anda tersimpan secara lokal di perangkat komputer Anda dan tidak dijual atau dibagikan ke pihak manapun.
                    </p>
                </div>
                <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-zinc-800/40 border border-slate-200/60 dark:border-zinc-700/60">
                    <h3 className="font-bold text-slate-900 dark:text-white text-xs">2. Penggunaan Koneksi Internet</h3>
                    <p className="text-[11px] text-slate-500 dark:text-zinc-400 mt-1 leading-normal">
                        Koneksi internet hanya digunakan untuk memeriksa ketersediaan berkas pembaruan perangkat lunak resmi dari repositori PosNesia.
                    </p>
                </div>
                <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-zinc-800/40 border border-slate-200/60 dark:border-zinc-700/60">
                    <h3 className="font-bold text-slate-900 dark:text-white text-xs">3. Keamanan Hak Akses</h3>
                    <p className="text-[11px] text-slate-500 dark:text-zinc-400 mt-1 leading-normal">
                        Fitur keamanan berbasis PIN kasir dan Manajemen Hak Akses Staf mengunci akses menu sensitif dari pengguna yang tidak berwenang.
                    </p>
                </div>
            </div>
        </div>
    );
};

const TermsOfServiceTabContent: React.FC = () => {
    return (
        <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-slate-200/80 dark:border-zinc-800 p-6 shadow-2xs space-y-4 text-xs text-slate-700 dark:text-zinc-300">
            <h2 className="text-sm font-black text-slate-900 dark:text-white flex items-center gap-2 border-b border-slate-100 dark:border-zinc-800 pb-3">
                <FileText className="w-4 h-4 text-blue-600" /> Ketentuan Penggunaan Aplikasi
            </h2>
            <div className="space-y-3">
                <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-zinc-800/40 border border-slate-200/60 dark:border-zinc-700/60">
                    <h3 className="font-bold text-slate-900 dark:text-white text-xs">1. Hak Lisensi Penggunaan</h3>
                    <p className="text-[11px] text-slate-500 dark:text-zinc-400 mt-1 leading-normal">
                        Pengguna mendapatkan lisensi resmi penggunaan perangkat lunak PosNesia untuk operasional toko atau tempat usaha sesuai paket perangkat yang terdaftar.
                    </p>
                </div>
                <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-zinc-800/40 border border-slate-200/60 dark:border-zinc-700/60">
                    <h3 className="font-bold text-slate-900 dark:text-white text-xs">2. Pencadangan Data Usaha</h3>
                    <p className="text-[11px] text-slate-500 dark:text-zinc-400 mt-1 leading-normal">
                        Pengguna disarankan melakukan ekspor pencadangan (backup) database secara berkala melalui menu Database untuk mencegah kehilangan data akibat kerusakan perangkat keras.
                    </p>
                </div>
            </div>
        </div>
    );
};

const AppUpdateCard: React.FC = () => {
    const [updateStatus, setUpdateStatus] = useState<string>('idle');
    const [downloadPercent, setDownloadPercent] = useState<number>(0);
    const [versionInfo, setVersionInfo] = useState<string>('');

    useEffect(() => {
        const api = (window as any).electronAPI;
        if (api) {
            api.getVersion?.().then((v: string) => setVersionInfo(`v${v}`));

            api.onUpdateStatus?.((data: any) => {
                setUpdateStatus(data.status);
                if (data.status === 'downloading') {
                    setDownloadPercent(data.percent || 0);
                }
            });
        }
    }, []);

    const handleCheckUpdate = () => {
        const api = (window as any).electronAPI;
        if (api && api.checkForUpdates) {
            setUpdateStatus('checking');
            api.checkForUpdates();
        } else {
            alert('Fitur pembaruan otomatis aktif pada aplikasi desktop PosNesia.');
        }
    };

    const handleRestartAndInstall = () => {
        const api = (window as any).electronAPI;
        if (api && api.quitAndInstall) {
            api.quitAndInstall();
        } else {
            window.location.reload();
        }
    };

    return (
        <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-slate-200/80 dark:border-zinc-800 p-6 shadow-2xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 dark:border-zinc-800 pb-4">
                <div>
                    <h2 className="text-sm font-black text-slate-900 dark:text-white flex items-center gap-2">
                        <span className="w-2.5 h-2.5 rounded-full bg-blue-500"></span>
                        Pembaruan Sistem Aplikasi Desktop
                    </h2>
                    <p className="text-xs text-slate-500 dark:text-zinc-400 mt-1">
                        PosNesia Desktop {versionInfo || 'v1.0.1'} — Periksa dan instal berkas rilis terbaru tanpa perlu unduh ulang secara manual.
                    </p>
                </div>

                <div className="shrink-0 flex items-center gap-2">
                    {updateStatus === 'downloaded' ? (
                        <Button
                            type="button"
                            onClick={handleRestartAndInstall}
                            className="gap-2 text-xs py-2 px-4 shadow-xs bg-emerald-600 hover:bg-emerald-700 text-white font-bold"
                        >
                            <span>🚀</span>
                            <span>Restart &amp; Perbarui Sekarang</span>
                        </Button>
                    ) : (
                        <Button
                            type="button"
                            onClick={handleCheckUpdate}
                            disabled={updateStatus === 'checking' || updateStatus === 'downloading'}
                            className="gap-2 text-xs py-2 px-4 shadow-xs bg-blue-600 hover:bg-blue-700 text-white font-bold"
                        >
                            <RefreshCw className={`w-3.5 h-3.5 ${updateStatus === 'checking' ? 'animate-spin' : ''}`} />
                            <span>{updateStatus === 'checking' ? 'Memeriksa...' : 'Cek Pembaruan'}</span>
                        </Button>
                    )}
                </div>
            </div>

            {/* Status Feedback Banners */}
            {updateStatus === 'checking' && (
                <div className="p-3.5 rounded-xl bg-blue-50 dark:bg-blue-950/40 border border-blue-200/80 dark:border-blue-800 text-blue-800 dark:text-blue-300 font-bold text-xs flex items-center gap-2 animate-pulse">
                    <span className="w-2 h-2 rounded-full bg-blue-500 animate-ping"></span>
                    ⏳ Memeriksa ketersediaan berkas pembaruan dari repositori resmi...
                </div>
            )}
            {updateStatus === 'not-available' && (
                <div className="p-3.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200/80 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 font-bold text-xs flex items-center gap-2">
                    <span>✅</span> Versi aplikasi Anda sudah yang terbaru.
                </div>
            )}
            {updateStatus === 'available' && (
                <div className="p-3.5 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200/80 dark:border-amber-800 text-amber-800 dark:text-amber-300 font-bold text-xs flex items-center gap-2">
                    <span>🚀</span> Versi rilis baru ditemukan! Mengunduh berkas pembaruan secara otomatis di latar belakang...
                </div>
            )}
            {updateStatus === 'downloading' && (
                <div className="p-4 rounded-xl bg-blue-50/60 dark:bg-blue-950/40 border border-blue-200/80 dark:border-blue-800 space-y-2">
                    <div className="flex justify-between items-center text-xs font-bold text-blue-900 dark:text-blue-200">
                        <span>📥 Mengunduh Pembaruan Berkas</span>
                        <span>{downloadPercent}%</span>
                    </div>
                    <div className="w-full bg-blue-200/60 dark:bg-blue-900/60 h-2.5 rounded-full overflow-hidden">
                        <div className="bg-blue-600 h-full transition-all duration-300 rounded-full" style={{ width: `${downloadPercent}%` }}></div>
                    </div>
                </div>
            )}
            {updateStatus === 'downloaded' && (
                <div className="p-3.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200/80 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 font-bold text-xs flex items-center justify-between">
                    <span>🎉 Berkas pembaruan selesai diunduh! Klik tombol "Restart &amp; Perbarui Sekarang" di atas.</span>
                </div>
            )}
            {updateStatus === 'error' && (
                <div className="p-3.5 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200/80 dark:border-red-800 text-red-800 dark:text-red-300 font-bold text-xs flex items-center gap-2">
                    <span>⚠️</span> Gagal memeriksa pembaruan. Pastikan koneksi internet terhubung.
                </div>
            )}
        </div>
    );
};

// --- 2. Application Display Settings Page ---

const ThemeToggle: React.FC<{ theme: Theme; setTheme: (theme: Theme) => void }> = ({ theme, setTheme }) => {
    const isDark = theme === Theme.Dark;
    const toggleTheme = () => setTheme(isDark ? Theme.Light : Theme.Dark);
    return (
        <div className="flex items-center">
            <span className="mr-3 text-sm font-medium">Terang</span>
            <label className="relative inline-flex items-center cursor-pointer">
                <input type="checkbox" className="sr-only peer" checked={isDark} onChange={toggleTheme} />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 dark:peer-focus:ring-primary-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-primary-600"></div>
            </label>
            <span className="ml-3 text-sm font-medium">Gelap</span>
        </div>
    );
}

const AccentColorGrid: React.FC<{
    selectedColor: AccentColor;
    onSelectColor: (color: AccentColor) => void;
}> = ({ selectedColor, onSelectColor }) => {
    const colorGroups: { name: string, colors: { name: AccentColor, className: string }[] }[] = [
        {
            name: "Cool Tones",
            colors: [
                { name: 'blue', className: 'bg-blue-500' },
                { name: 'sky', className: 'bg-sky-500' },
                { name: 'indigo', className: 'bg-indigo-500' },
                { name: 'purple', className: 'bg-purple-500' },
                { name: 'violet', className: 'bg-violet-500' },
            ]
        },
        {
            name: "Green Tones",
            colors: [
                { name: 'green', className: 'bg-green-500' },
                { name: 'teal', className: 'bg-teal-500' },
                { name: 'lime', className: 'bg-lime-500' },
            ]
        },
        {
            name: "Warm Tones",
            colors: [
                { name: 'yellow', className: 'bg-yellow-500' },
                { name: 'orange', className: 'bg-orange-500' },
                { name: 'red', className: 'bg-red-500' },
                 { name: 'brown', className: 'bg-stone-500' },
            ]
        },
        {
            name: "Pink & Rose Tones",
            colors: [
                { name: 'rose', className: 'bg-rose-500' },
                { name: 'pink', className: 'bg-pink-500' },
            ]
        }
    ];

    return (
        <div className="space-y-4">
            {colorGroups.map(group => (
                <div key={group.name}>
                    <Label className="mb-2">{group.name}</Label>
                    <div className="flex flex-wrap gap-3">
                        {group.colors.map(c => (
                            <button
                                key={c.name}
                                type="button"
                                onClick={() => onSelectColor(c.name)}
                                className={`w-10 h-10 rounded-full ${c.className} transition-transform hover:scale-110 flex items-center justify-center border-2 ${selectedColor === c.name ? 'border-white dark:border-gray-900 ring-2 ring-offset-2 dark:ring-offset-gray-800 ring-primary-500' : 'border-transparent'}`}
                                aria-label={`Select ${c.name} color`}
                            >
                                {selectedColor === c.name && (
                                    <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                                    </svg>
                                )}
                            </button>
                        ))}
                    </div>
                </div>
            ))}
        </div>
    );
};

const GradientGrid: React.FC<{
    selectedGradient: string;
    onSelectGradient: (gradient: GradientTheme) => void;
}> = ({ selectedGradient, onSelectGradient }) => (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {Object.values(gradientThemes).map(g => (
            <button
                key={g.name}
                type="button"
                onClick={() => onSelectGradient({ mode: 'gradient', name: g.name, colors: g.colors })}
                className={`p-4 rounded-lg flex items-center justify-between transition-all border-2 ${selectedGradient === g.name ? 'border-white dark:border-gray-900 ring-2 ring-offset-2 dark:ring-offset-gray-800 ring-primary-500' : 'border-transparent'}`}
            >
                <span className="font-semibold text-gray-800 dark:text-gray-200">{g.name}</span>
                <div className={`w-24 h-10 rounded-md ${g.className}`} />
            </button>
        ))}
    </div>
);


export const DisplaySettingsPage: React.FC = () => {
    const { state, dispatch } = useAppContext();
    const { theme, themeConfig } = state;

    const setTheme = (newTheme: Theme) => dispatch({ type: 'ui/setTheme', payload: newTheme });

    const handleThemeConfigChange = (newConfig: ThemeConfig) => {
        dispatch({ type: 'ui/setThemeConfig', payload: newConfig });
    };
    
    const handleModeChange = (mode: 'single' | 'gradient') => {
        if (mode === 'single') {
            handleThemeConfigChange({ mode: 'single', color: 'blue' });
        } else {
            const firstGradient = Object.values(gradientThemes)[0];
            handleThemeConfigChange({ mode: 'gradient', name: firstGradient.name, colors: firstGradient.colors });
        }
    };
    
    return (
        <div className="p-8 h-full overflow-y-auto">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-6">Tampilan Aplikasi</h1>
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 max-w-2xl mx-auto space-y-8">
                {/* Theme Section */}
                <div className="flex items-center justify-between">
                    <Label className="text-base">Tema Aplikasi</Label>
                    <ThemeToggle theme={theme} setTheme={setTheme} />
                </div>

                {/* Color Mode Section */}
                <div>
                    <Label className="text-base mb-3">Mode Warna</Label>
                     <div className="flex gap-2 rounded-lg bg-gray-100 dark:bg-gray-700/50 p-1">
                        <button onClick={() => handleModeChange('single')} className={`w-full p-2 rounded-md font-semibold text-sm transition-colors ${themeConfig.mode === 'single' ? 'bg-white dark:bg-gray-800 shadow text-primary-600' : 'text-gray-600 dark:text-gray-300'}`}>
                            Warna Tunggal
                        </button>
                        <button onClick={() => handleModeChange('gradient')} className={`w-full p-2 rounded-md font-semibold text-sm transition-colors ${themeConfig.mode === 'gradient' ? 'bg-white dark:bg-gray-800 shadow text-primary-600' : 'text-gray-600 dark:text-gray-300'}`}>
                            Gradien
                        </button>
                    </div>
                </div>

                {/* Accent Color/Gradient Section */}
                <div>
                    <Label className="text-base mb-4">{themeConfig.mode === 'single' ? 'Warna Aksen' : 'Pilih Gradien'}</Label>
                     {themeConfig.mode === 'single' ? (
                        <AccentColorGrid 
                            selectedColor={themeConfig.color} 
                            onSelectColor={(color) => handleThemeConfigChange({ mode: 'single', color })}
                        />
                    ) : themeConfig.mode === 'gradient' ? (
                        <GradientGrid
                            selectedGradient={themeConfig.name}
                            onSelectGradient={(gradient) => handleThemeConfigChange(gradient)}
                        />
                    ) : null}
                </div>
            </div>
        </div>
    );
}

// --- 3. Report Sizes Settings Page ---

export const ReportSizesSettingsPage: React.FC = () => {
    const { state, dispatch } = useAppContext();
    const [settings, setSettings] = useState<ReportLayoutSettings>({
        printerConnectionType: 'browser',
        bluetoothDeviceName: '',
        bluetoothMacAddress: '',
        usbVendorId: '',
        usbProductId: '',
        networkPrinterIp: '',
        networkPrinterPort: 9100,
        autoPrintOnCheckout: true,
        cutPaperAfterPrint: true,
        printCopies: 1,
        ...state.reportLayoutSettings
    });

    const [isScanning, setIsScanning] = useState<boolean>(false);
    const [scannedDevices, setScannedDevices] = useState<Array<{ name: string; id: string; type: string }>>([]);
    const [testPrintStatus, setTestPrintStatus] = useState<string | null>(null);
    const [scanMessage, setScanMessage] = useState<string | null>(null);

    const handleSave = () => {
        dispatch({ type: 'settings/updateReportLayouts', payload: settings });
        alert('Pengaturan printer & cetak dokumen berhasil disimpan!');
    };

    const handleSelectChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const { name, value } = e.target;
        setSettings(prev => ({ ...prev, [name]: value as any }));
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value, type, checked } = e.target;
        setSettings(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
    };

    const handleScanDevices = async () => {
        setIsScanning(true);
        setScannedDevices([]);
        setScanMessage(null);

        try {
            if (settings.printerConnectionType === 'bluetooth') {
                if ('bluetooth' in navigator) {
                    setScanMessage('Membuka dialog pencarian Bluetooth sistem...');
                    const device = await (navigator as any).bluetooth.requestDevice({
                        acceptAllDevices: true,
                        optionalServices: ['000018f0-0000-1000-8000-00805f9b34fb', '49535343-fe7d-4ae5-8fa9-9fafd205e455']
                    });
                    if (device) {
                        setScannedDevices([{
                            name: device.name || 'Printer Bluetooth (Terhubung)',
                            id: device.id || 'BT-DEVICE',
                            type: 'Bluetooth'
                        }]);
                        setScanMessage('Perangkat Bluetooth berhasil terdeteksi.');
                    }
                } else {
                    setScanMessage('Browser ini belum mendukung Web Bluetooth API. Masukkan nama/MAC Bluetooth printer secara manual di bawah.');
                }
            } else if (settings.printerConnectionType === 'usb') {
                if ('usb' in navigator) {
                    setScanMessage('Membuka dialog WebUSB...');
                    const device = await (navigator as any).usb.requestDevice({ filters: [] });
                    if (device) {
                        setScannedDevices([{
                            name: device.productName || 'Printer Thermal USB',
                            id: `Vendor: 0x${device.vendorId.toString(16)} Product: 0x${device.productId.toString(16)}`,
                            type: 'USB'
                        }]);
                        setScanMessage('Printer USB berhasil terdeteksi.');
                    }
                } else {
                    setScanMessage('Masukkan Vendor ID & Product ID / nama driver USB printer secara manual.');
                }
            } else if (settings.printerConnectionType === 'network') {
                if (settings.networkPrinterIp) {
                    setScannedDevices([{
                        name: `Printer Network (${settings.networkPrinterIp})`,
                        id: `${settings.networkPrinterIp}:${settings.networkPrinterPort || 9100}`,
                        type: 'Network'
                    }]);
                    setScanMessage(`Host IP ${settings.networkPrinterIp} dikonfigurasi.`);
                } else {
                    setScanMessage('Silakan isi IP Address printer jaringan Anda.');
                }
            }
        } catch (err: any) {
            console.warn('Pemindaian dibatalkan atau tidak didukung:', err);
            setScanMessage('Pemindaian dibatalkan atau perangkat belum dipilih.');
        } finally {
            setIsScanning(false);
        }
    };

    const handleSelectScannedDevice = (dev: { name: string; id: string; type: string }) => {
        if (settings.printerConnectionType === 'bluetooth') {
            setSettings(prev => ({ ...prev, bluetoothDeviceName: dev.name, bluetoothMacAddress: dev.id }));
        } else if (settings.printerConnectionType === 'usb') {
            setSettings(prev => ({ ...prev, usbVendorId: dev.name, usbProductId: dev.id }));
        }
        alert(`Printer ${dev.name} dipilih!`);
    };

    const handleTestPrint = () => {
        setTestPrintStatus('Mengirim perintah tes cetak ke printer...');
        
        try {
            const printFrame = document.createElement('iframe');
            printFrame.style.position = 'fixed';
            printFrame.style.right = '0';
            printFrame.style.bottom = '0';
            printFrame.style.width = '0';
            printFrame.style.height = '0';
            printFrame.style.border = '0';
            document.body.appendChild(printFrame);

            const frameDoc = printFrame.contentWindow?.document;
            if (frameDoc) {
                const receiptSize = settings.posReceiptSize || '80mm';
                const widthCss = receiptSize === '58mm' ? '58mm' : receiptSize === '80mm' ? '80mm' : '100%';
                
                frameDoc.open();
                frameDoc.write(`
                    <!DOCTYPE html>
                    <html>
                    <head>
                        <title>Test Print - POSnesia</title>
                        <style>
                            @page { size: auto; margin: 0; }
                            body {
                                font-family: 'Courier New', Courier, monospace;
                                width: ${widthCss};
                                margin: 0 auto;
                                padding: 12px;
                                font-size: 12px;
                                color: #000;
                                background: #fff;
                            }
                            .text-center { text-align: center; }
                            .bold { font-weight: bold; }
                            .divider { border-top: 1px dashed #000; margin: 8px 0; }
                            .flex-between { display: flex; justify-content: space-between; margin: 2px 0; }
                        </style>
                    </head>
                    <body>
                        <div class="text-center bold" style="font-size: 16px;">POSnesia</div>
                        <div class="text-center" style="font-size: 10px;">SYSTEM PRINTER TEST</div>
                        <div class="divider"></div>
                        <div>Waktu  : ${new Date().toLocaleString('id-ID')}</div>
                        <div>Metode : ${(settings.printerConnectionType || 'browser').toUpperCase()}</div>
                        <div>Kertas : ${receiptSize}</div>
                        <div class="divider"></div>
                        <div class="bold">HASIL UJI PRINTER:</div>
                        <div class="flex-between">
                            <span>Koneksi Device</span>
                            <span>OK</span>
                        </div>
                        <div class="flex-between">
                            <span>Auto Cut Paper</span>
                            <span>${settings.cutPaperAfterPrint ? 'Aktif' : 'Non-aktif'}</span>
                        </div>
                        <div class="flex-between">
                            <span>Jumlah Rangkap</span>
                            <span>${settings.printCopies || 1} Kopi</span>
                        </div>
                        <div class="divider"></div>
                        <div class="text-center bold" style="margin-top: 6px;">PRINTER BERFUNGSI NORMAL!</div>
                        <div class="text-center" style="font-size: 10px; margin-top: 4px;">*** Halaman Pengaturan Printer POSnesia ***</div>
                        <br/><br/>
                    </body>
                    </html>
                `);
                frameDoc.close();

                setTimeout(() => {
                    try {
                        printFrame.contentWindow?.focus();
                        printFrame.contentWindow?.print();
                        setTestPrintStatus('✅ Perintah tes cetak berhasil dikirim.');
                    } catch (err) {
                        console.error('Print error:', err);
                        setTestPrintStatus('❌ Gagal mencetak. Silakan periksa koneksi printer.');
                    } finally {
                        setTimeout(() => {
                            if (document.body.contains(printFrame)) {
                                document.body.removeChild(printFrame);
                            }
                            setTimeout(() => setTestPrintStatus(null), 4000);
                        }, 1000);
                    }
                }, 400);
            } else {
                window.print();
                setTestPrintStatus('✅ Tes cetak diproses.');
                setTimeout(() => setTestPrintStatus(null), 3000);
            }
        } catch (error) {
            console.error('Test print failed:', error);
            window.print();
            setTestPrintStatus('✅ Tes cetak diproses via dialog browser.');
            setTimeout(() => setTestPrintStatus(null), 3000);
        }
    };

    return (
        <div className="w-full h-full flex flex-col p-4 md:p-6 space-y-4 overflow-hidden bg-slate-50/50 dark:bg-zinc-950">
            {/* Header Bar */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 shrink-0">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 text-white flex items-center justify-center shadow-xs shrink-0">
                        <Printer className="w-5 h-5" />
                    </div>
                    <div>
                        <h1 className="text-xl font-black text-slate-900 dark:text-white leading-tight">
                            Pengaturan Printer
                        </h1>
                    </div>
                </div>

                <div className="flex items-center gap-2.5 shrink-0 self-end sm:self-center">
                    <Button 
                        type="button"
                        variant="secondary"
                        onClick={handleTestPrint} 
                        className="gap-2 text-xs py-2 px-3.5 shadow-xs border border-slate-200 dark:border-zinc-700"
                    >
                        <Printer className="w-4 h-4 text-blue-600" />
                        Test Print
                    </Button>

                    <Button 
                        type="button"
                        onClick={handleSave} 
                        className="gap-2 text-xs py-2 px-4 shadow-xs bg-emerald-600 hover:bg-emerald-700 text-white font-bold"
                    >
                        <Save className="w-4 h-4" />
                        Simpan Pengaturan
                    </Button>
                </div>
            </div>

            {/* Scrollable Content Area */}
            <div className="flex-1 min-h-0 overflow-y-auto space-y-4 pr-1">
                {/* Status Bar */}
                {testPrintStatus && (
                    <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200/80 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 font-bold text-xs flex items-center justify-between animate-pulse">
                        <span className="flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                            {testPrintStatus}
                        </span>
                    </div>
                )}

                {/* Section 1: Connection Mode Grid */}
                <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-slate-200/80 dark:border-zinc-800 p-5 shadow-2xs space-y-4">
                    <div className="flex items-center justify-between border-b border-slate-100 dark:border-zinc-800 pb-3">
                        <h2 className="text-sm font-black text-slate-900 dark:text-white flex items-center gap-2">
                            <span className="w-2.5 h-2.5 rounded-full bg-blue-500"></span>
                            Metode Koneksi Printer Kasir
                        </h2>
                        <Badge variant={
                            settings.printerConnectionType === 'bluetooth' ? 'info' :
                            settings.printerConnectionType === 'usb' ? 'success' :
                            settings.printerConnectionType === 'network' ? 'warning' : 'default'
                        }>
                            {settings.printerConnectionType === 'bluetooth' ? '📱 Bluetooth Active' :
                             settings.printerConnectionType === 'usb' ? '🔌 USB Direct Active' :
                             settings.printerConnectionType === 'network' ? '🌐 LAN / Wi-Fi Active' : '💻 Browser System Print'}
                        </Badge>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                        {/* Bluetooth Button */}
                        <button
                            type="button"
                            onClick={() => setSettings(prev => ({ ...prev, printerConnectionType: 'bluetooth' }))}
                            className={`p-4 rounded-xl border text-left flex flex-col justify-between transition-all ${
                                settings.printerConnectionType === 'bluetooth'
                                ? 'border-blue-600 bg-blue-50/60 dark:bg-blue-950/40 text-blue-900 dark:text-blue-200 ring-2 ring-blue-500/20 shadow-xs'
                                : 'border-slate-200 dark:border-zinc-800 hover:bg-slate-50 dark:hover:bg-zinc-800/50 text-slate-700 dark:text-zinc-300'
                            }`}
                        >
                            <div className="flex items-center justify-between mb-3">
                                <div className="w-8 h-8 rounded-lg bg-blue-100 dark:bg-blue-900/50 text-blue-600 dark:text-blue-300 flex items-center justify-center font-bold text-sm">
                                    📱
                                </div>
                                {settings.printerConnectionType === 'bluetooth' && <span className="text-[10px] font-black uppercase text-blue-600 bg-blue-100 dark:bg-blue-900/60 px-2 py-0.5 rounded-md">Aktif</span>}
                            </div>
                            <div>
                                <span className="font-extrabold text-sm block">Bluetooth</span>
                                <span className="text-[11px] text-slate-500 dark:text-zinc-400">Printer Thermal Mobile/Portable</span>
                            </div>
                        </button>

                        {/* USB Button */}
                        <button
                            type="button"
                            onClick={() => setSettings(prev => ({ ...prev, printerConnectionType: 'usb' }))}
                            className={`p-4 rounded-xl border text-left flex flex-col justify-between transition-all ${
                                settings.printerConnectionType === 'usb'
                                ? 'border-emerald-600 bg-emerald-50/60 dark:bg-emerald-950/40 text-emerald-900 dark:text-emerald-200 ring-2 ring-emerald-500/20 shadow-xs'
                                : 'border-slate-200 dark:border-zinc-800 hover:bg-slate-50 dark:hover:bg-zinc-800/50 text-slate-700 dark:text-zinc-300'
                            }`}
                        >
                            <div className="flex items-center justify-between mb-3">
                                <div className="w-8 h-8 rounded-lg bg-emerald-100 dark:bg-emerald-900/50 text-emerald-600 dark:text-emerald-300 flex items-center justify-center font-bold text-sm">
                                    🔌
                                </div>
                                {settings.printerConnectionType === 'usb' && <span className="text-[10px] font-black uppercase text-emerald-600 bg-emerald-100 dark:bg-emerald-900/60 px-2 py-0.5 rounded-md">Aktif</span>}
                            </div>
                            <div>
                                <span className="font-extrabold text-sm block">USB Thermal</span>
                                <span className="text-[11px] text-slate-500 dark:text-zinc-400">Printer Kabel Kasir Desktop</span>
                            </div>
                        </button>

                        {/* Network Button */}
                        <button
                            type="button"
                            onClick={() => setSettings(prev => ({ ...prev, printerConnectionType: 'network' }))}
                            className={`p-4 rounded-xl border text-left flex flex-col justify-between transition-all ${
                                settings.printerConnectionType === 'network'
                                ? 'border-purple-600 bg-purple-50/60 dark:bg-purple-950/40 text-purple-900 dark:text-purple-200 ring-2 ring-purple-500/20 shadow-xs'
                                : 'border-slate-200 dark:border-zinc-800 hover:bg-slate-50 dark:hover:bg-zinc-800/50 text-slate-700 dark:text-zinc-300'
                            }`}
                        >
                            <div className="flex items-center justify-between mb-3">
                                <div className="w-8 h-8 rounded-lg bg-purple-100 dark:bg-purple-900/50 text-purple-600 dark:text-purple-300 flex items-center justify-center font-bold text-sm">
                                    🌐
                                </div>
                                {settings.printerConnectionType === 'network' && <span className="text-[10px] font-black uppercase text-purple-600 bg-purple-100 dark:bg-purple-900/60 px-2 py-0.5 rounded-md">Aktif</span>}
                            </div>
                            <div>
                                <span className="font-extrabold text-sm block">Network (LAN)</span>
                                <span className="text-[11px] text-slate-500 dark:text-zinc-400">Printer Dapur/Bar via IP</span>
                            </div>
                        </button>

                        {/* Browser Button */}
                        <button
                            type="button"
                            onClick={() => setSettings(prev => ({ ...prev, printerConnectionType: 'browser' }))}
                            className={`p-4 rounded-xl border text-left flex flex-col justify-between transition-all ${
                                settings.printerConnectionType === 'browser'
                                ? 'border-amber-600 bg-amber-50/60 dark:bg-amber-950/40 text-amber-900 dark:text-amber-200 ring-2 ring-amber-500/20 shadow-xs'
                                : 'border-slate-200 dark:border-zinc-800 hover:bg-slate-50 dark:hover:bg-zinc-800/50 text-slate-700 dark:text-zinc-300'
                            }`}
                        >
                            <div className="flex items-center justify-between mb-3">
                                <div className="w-8 h-8 rounded-lg bg-amber-100 dark:bg-amber-900/50 text-amber-600 dark:text-amber-300 flex items-center justify-center font-bold text-sm">
                                    💻
                                </div>
                                {settings.printerConnectionType === 'browser' && <span className="text-[10px] font-black uppercase text-amber-600 bg-amber-100 dark:bg-amber-900/60 px-2 py-0.5 rounded-md">Aktif</span>}
                            </div>
                            <div>
                                <span className="font-extrabold text-sm block">Browser Print</span>
                                <span className="text-[11px] text-slate-500 dark:text-zinc-400">Cetak Sistem Standar / PDF</span>
                            </div>
                        </button>
                    </div>

                    {/* Active Form Details */}
                    {settings.printerConnectionType === 'bluetooth' && (
                        <div className="p-4 bg-blue-50/40 dark:bg-blue-950/20 rounded-xl border border-blue-100 dark:border-blue-900/40 space-y-4 mt-2">
                            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                                <div>
                                    <h3 className="text-xs font-black text-blue-900 dark:text-blue-200 uppercase tracking-wider">Detail Bluetooth Device</h3>
                                    <p className="text-[11px] text-blue-700 dark:text-blue-400">Pastikan koneksi Bluetooth perangkat POS Anda telah aktif.</p>
                                </div>
                                <Button
                                    type="button"
                                    onClick={handleScanDevices}
                                    disabled={isScanning}
                                    className="gap-1.5 text-xs py-1.5 px-3 bg-blue-600 hover:bg-blue-700 text-white font-bold"
                                >
                                    {isScanning ? 'Mencari Device...' : '🔍 Pindai Perangkat'}
                                </Button>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                <div>
                                    <Label htmlFor="bluetoothDeviceName" className="text-xs font-bold text-slate-700 dark:text-zinc-300">Nama Device</Label>
                                    <Input
                                        id="bluetoothDeviceName"
                                        name="bluetoothDeviceName"
                                        value={settings.bluetoothDeviceName || ''}
                                        onChange={handleInputChange}
                                        placeholder="Contoh: POS-58 Thermal"
                                        className="text-xs"
                                    />
                                </div>
                                <div>
                                    <Label htmlFor="bluetoothMacAddress" className="text-xs font-bold text-slate-700 dark:text-zinc-300">MAC Address</Label>
                                    <Input
                                        id="bluetoothMacAddress"
                                        name="bluetoothMacAddress"
                                        value={settings.bluetoothMacAddress || ''}
                                        onChange={handleInputChange}
                                        placeholder="00:11:22:33:44:55"
                                        className="text-xs"
                                    />
                                </div>
                            </div>

                            {scanMessage && (
                                <div className="text-xs font-medium text-blue-800 dark:text-blue-300 bg-blue-100/60 dark:bg-blue-950/60 p-2.5 rounded-lg border border-blue-200/60">
                                    {scanMessage}
                                </div>
                            )}

                            {scannedDevices.length > 0 && (
                                <div className="space-y-1.5 pt-1">
                                    <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wide">Hasil Pemindaian Bluetooth:</span>
                                    <div className="space-y-1.5">
                                        {scannedDevices.map(dev => (
                                            <div key={dev.id} className="flex items-center justify-between p-3 bg-white dark:bg-zinc-800 rounded-xl border border-blue-200/60 text-xs shadow-2xs">
                                                <div>
                                                    <span className="font-bold text-slate-900 dark:text-white">{dev.name}</span>
                                                    <span className="text-[10px] text-slate-400 font-mono ml-2">({dev.id})</span>
                                                </div>
                                                <Button
                                                    type="button"
                                                    onClick={() => handleSelectScannedDevice(dev)}
                                                    className="py-1 px-3 bg-blue-100 hover:bg-blue-200 text-blue-700 font-bold text-xs"
                                                >
                                                    Pilih Device
                                                </Button>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    {settings.printerConnectionType === 'usb' && (
                        <div className="p-4 bg-emerald-50/40 dark:bg-emerald-950/20 rounded-xl border border-emerald-100 dark:border-emerald-900/40 space-y-4 mt-2">
                            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                                <div>
                                    <h3 className="text-xs font-black text-emerald-900 dark:text-emerald-200 uppercase tracking-wider">Detail USB Thermal Printer</h3>
                                    <p className="text-[11px] text-emerald-700 dark:text-emerald-400">Hubungkan kabel USB printer ke port Komputer / POS.</p>
                                </div>
                                <Button
                                    type="button"
                                    onClick={handleScanDevices}
                                    disabled={isScanning}
                                    className="gap-1.5 text-xs py-1.5 px-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold"
                                >
                                    {isScanning ? 'Mendeteksi USB...' : '🔌 Deteksi Port USB'}
                                </Button>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                <div>
                                    <Label htmlFor="usbVendorId" className="text-xs font-bold text-slate-700 dark:text-zinc-300">Vendor ID / Driver</Label>
                                    <Input
                                        id="usbVendorId"
                                        name="usbVendorId"
                                        value={settings.usbVendorId || ''}
                                        onChange={handleInputChange}
                                        placeholder="Epson / Xprinter / POS-58"
                                        className="text-xs"
                                    />
                                </div>
                                <div>
                                    <Label htmlFor="usbProductId" className="text-xs font-bold text-slate-700 dark:text-zinc-300">Product ID / Port USB</Label>
                                    <Input
                                        id="usbProductId"
                                        name="usbProductId"
                                        value={settings.usbProductId || ''}
                                        onChange={handleInputChange}
                                        placeholder="USB001 / TM-T20"
                                        className="text-xs"
                                    />
                                </div>
                            </div>
                        </div>
                    )}

                    {settings.printerConnectionType === 'network' && (
                        <div className="p-4 bg-purple-50/40 dark:bg-purple-950/20 rounded-xl border border-purple-100 dark:border-purple-900/40 space-y-4 mt-2">
                            <div>
                                <h3 className="text-xs font-black text-purple-900 dark:text-purple-200 uppercase tracking-wider">Konfigurasi Network Printer (LAN / Wi-Fi)</h3>
                                <p className="text-[11px] text-purple-700 dark:text-purple-400">Masukkan IP Address printer yang terhubung pada router lokal.</p>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                <div>
                                    <Label htmlFor="networkPrinterIp" className="text-xs font-bold text-slate-700 dark:text-zinc-300">IP Address Printer</Label>
                                    <Input
                                        id="networkPrinterIp"
                                        name="networkPrinterIp"
                                        value={settings.networkPrinterIp || ''}
                                        onChange={handleInputChange}
                                        placeholder="192.168.1.200"
                                        className="text-xs font-mono"
                                    />
                                </div>
                                <div>
                                    <Label htmlFor="networkPrinterPort" className="text-xs font-bold text-slate-700 dark:text-zinc-300">Port RAW Network</Label>
                                    <Input
                                        id="networkPrinterPort"
                                        name="networkPrinterPort"
                                        type="number"
                                        value={settings.networkPrinterPort || 9100}
                                        onChange={handleInputChange}
                                        placeholder="9100"
                                        className="text-xs font-mono"
                                    />
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Section 2: Paper Size & Document Format Settings */}
                <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-slate-200/80 dark:border-zinc-800 p-5 shadow-2xs space-y-4">
                    <h2 className="text-sm font-black text-slate-900 dark:text-white border-b border-slate-100 dark:border-zinc-800 pb-3 flex items-center gap-2">
                        <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
                        Ukuran Kertas & Format Dokumen Cetak
                    </h2>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        <div className="bg-slate-50 dark:bg-zinc-800/40 p-3.5 rounded-xl border border-slate-200/60 dark:border-zinc-700/60 space-y-2">
                            <Label htmlFor="posReceiptSize" className="font-bold text-xs text-slate-800 dark:text-zinc-200">Nota POS Kasir</Label>
                            <Select id="posReceiptSize" name="posReceiptSize" value={settings.posReceiptSize} onChange={handleSelectChange} className="text-xs py-1.5">
                                <option value="80mm">Kertas Termal 80mm (Standar Toko)</option>
                                <option value="58mm">Kertas Termal 58mm (Kecil/Portable)</option>
                                <option value="A4">A4 Sheet</option>
                                <option value="Letter">Letter Sheet</option>
                            </Select>
                        </div>

                        <div className="bg-slate-50 dark:bg-zinc-800/40 p-3.5 rounded-xl border border-slate-200/60 dark:border-zinc-700/60 space-y-2">
                            <Label htmlFor="salesInvoiceSize" className="font-bold text-xs text-slate-800 dark:text-zinc-200">Faktur Penjualan</Label>
                            <Select id="salesInvoiceSize" name="salesInvoiceSize" value={settings.salesInvoiceSize} onChange={handleSelectChange} className="text-xs py-1.5">
                                <option value="A4">A4 (Standar Invoice)</option>
                                <option value="Letter">Letter</option>
                                <option value="80mm">Kertas Termal 80mm</option>
                            </Select>
                        </div>

                        <div className="bg-slate-50 dark:bg-zinc-800/40 p-3.5 rounded-xl border border-slate-200/60 dark:border-zinc-700/60 space-y-2">
                            <Label htmlFor="purchaseOrderSize" className="font-bold text-xs text-slate-800 dark:text-zinc-200">Pesanan Pembelian (PO)</Label>
                            <Select id="purchaseOrderSize" name="purchaseOrderSize" value={settings.purchaseOrderSize} onChange={handleSelectChange} className="text-xs py-1.5">
                                <option value="A4">A4 (Standar PO)</option>
                                <option value="Letter">Letter</option>
                            </Select>
                        </div>
                    </div>
                </div>

                {/* Section 3: Print Options & Operations */}
                <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-slate-200/80 dark:border-zinc-800 p-5 shadow-2xs space-y-4">
                    <h2 className="text-sm font-black text-slate-900 dark:text-white border-b border-slate-100 dark:border-zinc-800 pb-3 flex items-center gap-2">
                        <span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span>
                        Opsi Perilaku Pencetakan
                    </h2>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        <label className="flex items-center gap-3 p-3.5 rounded-xl border border-slate-200/80 dark:border-zinc-800 cursor-pointer hover:bg-slate-50 dark:hover:bg-zinc-800/50 transition-all">
                            <input
                                type="checkbox"
                                name="autoPrintOnCheckout"
                                checked={settings.autoPrintOnCheckout ?? true}
                                onChange={handleInputChange}
                                className="w-4 h-4 rounded text-blue-600 accent-blue-600 shrink-0"
                            />
                            <div>
                                <span className="text-xs font-extrabold text-slate-900 dark:text-white block">Auto Print POS</span>
                                <span className="text-[10px] text-slate-500 dark:text-zinc-400">Cetak otomatis setelah bayar</span>
                            </div>
                        </label>

                        <label className="flex items-center gap-3 p-3.5 rounded-xl border border-slate-200/80 dark:border-zinc-800 cursor-pointer hover:bg-slate-50 dark:hover:bg-zinc-800/50 transition-all">
                            <input
                                type="checkbox"
                                name="cutPaperAfterPrint"
                                checked={settings.cutPaperAfterPrint ?? true}
                                onChange={handleInputChange}
                                className="w-4 h-4 rounded text-blue-600 accent-blue-600 shrink-0"
                            />
                            <div>
                                <span className="text-xs font-extrabold text-slate-900 dark:text-white block">Auto Cut Paper</span>
                                <span className="text-[10px] text-slate-500 dark:text-zinc-400">Kirim perintah potong kertas</span>
                            </div>
                        </label>

                        <div className="p-3.5 rounded-xl border border-slate-200/80 dark:border-zinc-800 flex items-center justify-between bg-slate-50/50 dark:bg-zinc-800/30">
                            <div>
                                <span className="text-xs font-extrabold text-slate-900 dark:text-white block">Jumlah Rangkap</span>
                                <span className="text-[10px] text-slate-500 dark:text-zinc-400">Jumlah kopi cetak struk</span>
                            </div>
                            <input
                                type="number"
                                name="printCopies"
                                min={1}
                                max={5}
                                value={settings.printCopies || 1}
                                onChange={handleInputChange}
                                className="w-14 h-8 px-2 border rounded-lg text-center font-bold text-xs bg-white dark:bg-zinc-800 text-slate-900 dark:text-white border-slate-200 dark:border-zinc-700"
                            />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

// --- 4. Backup & Restore Dedicated Submenu Page ---

export const BackupRestorePage: React.FC = () => {
    const { state } = useAppContext();
    const { sales, products, customers, journalEntries } = state;

    const handleExportData = () => {
        try {
            const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(state, null, 2));
            const downloadAnchor = document.createElement('a');
            downloadAnchor.setAttribute("href", dataStr);
            downloadAnchor.setAttribute("download", `posnesia_backup_${new Date().toISOString().slice(0, 10)}.json`);
            document.body.appendChild(downloadAnchor);
            downloadAnchor.click();
            downloadAnchor.remove();
        } catch (e) {
            alert('Gagal mengekspor data.');
        }
    };

    const handleImportData = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (event) => {
            try {
                const parsed = JSON.parse(event.target?.result as string);
                if (parsed && typeof parsed === 'object') {
                    localStorage.setItem('posnesia_local_state_v2', JSON.stringify(parsed));
                    alert('Data berhasil dipulihkan! Halaman akan dimuat ulang.');
                    window.location.reload();
                } else {
                    alert('Format file cadangan tidak valid.');
                }
            } catch (err) {
                alert('Gagal membaca file JSON cadangan.');
            }
        };
        reader.readAsText(file);
    };

    return (
        <div className="p-4 sm:p-6 w-full h-full overflow-y-auto space-y-6 font-sans">
            <div>
                <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">
                    Backup &amp; Restore Database Lokal (PWA)
                </h1>
                <p className="text-sm text-slate-500 dark:text-gray-400 mt-1 font-medium">
                    Kelola pencadangan (backup) dan pemulihan (restore) database offline lokal aplikasi Pos Nesia secara aman.
                </p>
            </div>

            {/* Database Summary Info Badge */}
            <div className="bg-gradient-to-r from-blue-600 via-indigo-600 to-slate-900 rounded-3xl p-6 text-white shadow-lg space-y-4">
                <div className="flex items-center space-x-3">
                    <div className="p-3 bg-white/15 rounded-2xl backdrop-blur-md">
                        <Database className="w-6 h-6 text-blue-300" />
                    </div>
                    <div>
                        <h2 className="text-lg font-bold">Status Database Offline PWA</h2>
                        <p className="text-xs text-blue-100 font-medium">Semua data tersimpan secara lokal di memori browser perangkat Anda.</p>
                    </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
                    <div className="bg-white/10 backdrop-blur-md rounded-2xl p-3.5 border border-white/10">
                        <div className="text-xs text-blue-200 font-medium">Total Produk</div>
                        <div className="text-xl font-black">{products.length} SKU</div>
                    </div>
                    <div className="bg-white/10 backdrop-blur-md rounded-2xl p-3.5 border border-white/10">
                        <div className="text-xs text-blue-200 font-medium">Total Transaksi</div>
                        <div className="text-xl font-black">{sales.length} Penjualan</div>
                    </div>
                    <div className="bg-white/10 backdrop-blur-md rounded-2xl p-3.5 border border-white/10">
                        <div className="text-xs text-blue-200 font-medium">Data Pelanggan</div>
                        <div className="text-xl font-black">{customers.length} Kontak</div>
                    </div>
                    <div className="bg-white/10 backdrop-blur-md rounded-2xl p-3.5 border border-white/10">
                        <div className="text-xs text-blue-200 font-medium">Jurnal Akuntansi</div>
                        <div className="text-xl font-black">{journalEntries.length} Baris</div>
                    </div>
                </div>
            </div>

            {/* Actions Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                
                {/* Export Backup Card */}
                <div className="bg-white dark:bg-gray-800 rounded-3xl p-6 border border-slate-200/80 dark:border-gray-700 shadow-sm space-y-4 flex flex-col justify-between">
                    <div className="space-y-3">
                        <div className="p-3 bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 rounded-2xl w-fit">
                            <Download className="w-6 h-6" />
                        </div>
                        <h2 className="text-base font-black text-slate-900 dark:text-white">
                            📥 Ekspor Cadangan (Backup JSON)
                        </h2>
                        <p className="text-xs text-slate-500 dark:text-gray-400 leading-relaxed font-medium">
                            Unduh seluruh database (produk, stok, transaksi, pelanggan, laporan keuangan) sebagai file cadangan JSON.
                        </p>
                    </div>

                    <button 
                        type="button" 
                        onClick={handleExportData}
                        className="w-full py-3 px-4 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md shadow-emerald-500/20 transition-all flex items-center justify-center space-x-2"
                    >
                        <Download className="w-4 h-4" />
                        <span>Unduh Backup (.json)</span>
                    </button>
                </div>

                {/* Import Restore Card */}
                <div className="bg-white dark:bg-gray-800 rounded-3xl p-6 border border-slate-200/80 dark:border-gray-700 shadow-sm space-y-4 flex flex-col justify-between">
                    <div className="space-y-3">
                        <div className="p-3 bg-amber-50 dark:bg-amber-950/50 text-amber-600 dark:text-amber-400 rounded-2xl w-fit">
                            <Upload className="w-6 h-6" />
                        </div>
                        <h2 className="text-base font-black text-slate-900 dark:text-white">
                            📤 Pulihkan Data (Restore JSON)
                        </h2>
                        <p className="text-xs text-slate-500 dark:text-gray-400 leading-relaxed font-medium">
                            Upload file cadangan JSON untuk memulihkan seluruh data transaksi, produk, dan laporan keuangan.
                        </p>
                    </div>

                    <label className="w-full py-3 px-4 rounded-2xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs shadow-md shadow-amber-500/20 transition-all flex items-center justify-center space-x-2 cursor-pointer">
                        <Upload className="w-4 h-4" />
                        <span>Pulihkan File Backup</span>
                        <input type="file" accept=".json" onChange={handleImportData} className="hidden" />
                    </label>
                </div>

                {/* Reset Database Card */}
                <div className="bg-white dark:bg-gray-800 rounded-3xl p-6 border border-rose-200 dark:border-rose-950/50 shadow-sm space-y-4 flex flex-col justify-between">
                    <div className="space-y-3">
                        <div className="p-3 bg-rose-50 dark:bg-rose-950/50 text-rose-600 dark:text-rose-400 rounded-2xl w-fit">
                            <RefreshCw className="w-6 h-6" />
                        </div>
                        <h2 className="text-base font-black text-rose-900 dark:text-rose-300">
                            🔄 Reset / Setel Ulang Database
                        </h2>
                        <p className="text-xs text-slate-500 dark:text-gray-400 leading-relaxed font-medium">
                            Menghapus seluruh data lokal dan mengembalikan sistem ke kondisi bawaan awal. Data yang terhapus tidak dapat dikembalikan.
                        </p>
                    </div>

                    <button 
                        type="button" 
                        onClick={() => {
                            const confirmFirst = window.confirm("⚠️ PERINGATAN BERSYARAT:\nApakah Anda yakin ingin MENGHAPUS SEMUA DATA bisnis Anda dan me-reset ke kondisi awal?");
                            if (confirmFirst) {
                                const confirmSecond = window.prompt("Ketik 'RESET' untuk mengonfirmasi penghapusan permanen seluruh database:");
                                if (confirmSecond === 'RESET') {
                                    localStorage.clear();
                                    alert('Database berhasil di-reset ke kondisi awal bawaan. Aplikasi akan dimuat ulang.');
                                    window.location.reload();
                                } else if (confirmSecond !== null) {
                                    alert('Konfirmasi batal. Kata kunci yang dimasukkan tidak sesuai.');
                                }
                            }
                        }}
                        className="w-full py-3 px-4 rounded-2xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs shadow-md shadow-rose-500/20 transition-all flex items-center justify-center space-x-2"
                    >
                        <AlertTriangle className="w-4 h-4" />
                        <span>Reset Database Awal</span>
                    </button>
                </div>

            </div>

            {/* Security Guarantee Note */}
            <div className="p-4 bg-blue-50 dark:bg-blue-950/40 rounded-2xl border border-blue-200 dark:border-blue-800 flex items-start space-x-3 text-xs text-blue-900 dark:text-blue-200">
                <ShieldCheck className="w-5 h-5 text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" />
                <div className="space-y-1">
                    <div className="font-bold">Keamanan &amp; Privasi Terjamin 100%</div>
                    <div className="text-[11px] text-blue-700 dark:text-blue-300 font-medium">
                        Seluruh data bisnis Anda disimpan secara rahasia di perangkat lokal tanpa dikirim ke server pihak ketiga mana pun. Cadangkan file JSON secara berkala untuk menjaga keamanan data bisnis Anda.
                    </div>
                </div>
            </div>
        </div>
    );
};
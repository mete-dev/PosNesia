import React, { useState } from 'react';
import { useAppContext } from '../hooks/useAppContext';
import { StoreIcon } from './icons';
import { Input, Button, Label, Select } from './ui';
import { Staff } from '../types';
import { ShoppingBag, Cake, Zap, Utensils, Wrench, Users, Check } from 'lucide-react';

export const LoginPage: React.FC<{ onBack?: () => void }> = ({ onBack }) => {
    const { state, dispatch } = useAppContext();
    const { companyInfo, branches, roles } = state;
    
    const [mode, setMode] = useState<'login' | 'register'>('login');

    // Login state
    const [staffId, setStaffId] = useState('');
    const [staffPin, setStaffPin] = useState('');
    const [error, setError] = useState('');

    // Register state
    const [regOwnerName, setRegOwnerName] = useState('');
    const [regUsername, setRegUsername] = useState('');
    const [regPin, setRegPin] = useState('');
    
    const [regBusinessName, setRegBusinessName] = useState('');
    const [regLogo, setRegLogo] = useState(''); // Base64 or URL
    const [regBusinessAddress, setRegBusinessAddress] = useState('');
    const [regBusinessEmail, setRegBusinessEmail] = useState('');
    const [regBusinessPhone, setRegBusinessPhone] = useState('');
    const [regBranchId, setRegBranchId] = useState(branches[0]?.id || 'b1');
    const [regBusinessType, setRegBusinessType] = useState<'retail' | 'production_retail' | 'qsr' | 'fsr' | 'service_job' | 'appointment_commission'>('retail');

    const handleLoginSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const user = state.staff.find(s => s.id === staffId && s.pin === staffPin);
        if (user) {
            dispatch({ type: 'auth/login', payload: { user } });
        } else {
            setError('ID Staf atau PIN tidak valid.');
            setTimeout(() => setError(''), 3000);
        }
    };

    const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            if (file.size > 2 * 1024 * 1024) { // 2MB Limit
                setError('Ukuran file logo terlalu besar. Maksimal 2MB.');
                setTimeout(() => setError(''), 3000);
                return;
            }
            const reader = new FileReader();
            reader.onloadend = () => {
                setRegLogo(reader.result as string);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleRegisterSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!regUsername || !regOwnerName || !regPin || !regBusinessName || !regBusinessAddress || !regBusinessEmail || !regBusinessPhone) {
            setError('Semua kolom wajib diisi kecuali logo.');
            setTimeout(() => setError(''), 3000);
            return;
        }

        if (state.staff.some(s => s.id === regUsername)) {
            setError('ID Staf / Username sudah terdaftar.');
            setTimeout(() => setError(''), 3000);
            return;
        }

        const adminRole = roles.find(r => r.name.toLowerCase().includes('admin') || r.name.toLowerCase().includes('pemilik')) || roles[0];

        const companyInfoPayload = {
            name: regBusinessName,
            logoUrl: regLogo || '/logo.svg',
            address: regBusinessAddress,
            email: regBusinessEmail,
            phone: regBusinessPhone,
            businessType: regBusinessType,
        };

        const newStaff: Staff = {
            id: regUsername,
            name: regOwnerName,
            roleId: adminRole ? adminRole.id : 'role-admin',
            email: regBusinessEmail,
            phone: regBusinessPhone,
            salary: 10000000,
            pin: regPin,
            status: 'active',
            branchId: regBranchId,
            depositBalance: 0,
        };

        dispatch({ type: 'company/updateInfo', payload: companyInfoPayload });
        dispatch({ type: 'staff/add', payload: newStaff });
        dispatch({ type: 'auth/login', payload: { user: newStaff } });
    };

    return (
        <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/40 to-slate-100 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950 px-4 py-12">
            <div className={`p-8 sm:p-10 bg-white dark:bg-gray-900 rounded-3xl shadow-2xl border border-slate-200/80 dark:border-gray-800 w-full ${mode === 'register' ? 'max-w-3xl' : 'max-w-md'} relative backdrop-blur-xl transition-all duration-300`}>
                 {onBack && (
                    <button onClick={onBack} className="absolute top-6 left-6 text-xs font-semibold text-gray-500 hover:text-blue-600 dark:text-gray-400 dark:hover:text-blue-400 transition-colors flex items-center space-x-1">
                        <span>&larr;</span>
                        <span>Website</span>
                    </button>
                 )}
                 
                 <div className="flex flex-col items-center mb-8 pt-6">
                    {companyInfo.logoUrl ? (
                        <img src={companyInfo.logoUrl} alt={`${companyInfo.name} Logo`} className="h-12 max-w-[240px] mb-3 object-contain" />
                    ) : (
                        <StoreIcon className="h-14 w-14 mb-3 text-blue-600"/>
                    )}
                    <h2 className="text-xl font-black text-gray-900 dark:text-white">
                        {mode === 'login' ? 'Login Sistem Lokal' : 'Registrasi Sistem Lokal'}
                    </h2>
                    <p className="text-sm font-medium text-gray-500 dark:text-gray-400 mt-1 text-center">
                        {mode === 'login' ? 'Masuk ke sistem kasir & manajemen offline' : 'Daftarkan toko dan akun pemilik baru untuk menjalankan sistem lokal'}
                    </p>
                </div>

                {error && (
                    <div className="mb-6 p-4 text-xs font-semibold text-center text-red-600 bg-red-50 dark:bg-red-950/60 dark:text-red-300 rounded-xl border border-red-200 dark:border-red-900 animate-shake">
                        {error}
                    </div>
                )}
                
                {mode === 'login' ? (
                    <form onSubmit={handleLoginSubmit} className="space-y-5">
                        <div>
                            <Label className="text-xs uppercase font-bold text-gray-500 mb-1.5 block">ID Staf / Username</Label>
                            <Input value={staffId} onChange={e => setStaffId(e.target.value)} placeholder="Contoh: ADMIN01" required className="rounded-xl py-3" />
                        </div>
                        <div>
                            <Label className="text-xs uppercase font-bold text-gray-500 mb-1.5 block">PIN Staf</Label>
                            <Input type="password" value={staffPin} onChange={e => setStaffPin(e.target.value)} placeholder="••••••" maxLength={6} required className="rounded-xl py-3 font-mono tracking-widest text-center text-lg" />
                        </div>
                        <Button type="submit" className="w-full py-3.5 rounded-xl font-bold shadow-lg shadow-blue-500/25 bg-blue-600 hover:bg-blue-700 text-white">Login</Button>
                        
                        <div className="text-center pt-4 border-t border-slate-100 dark:border-gray-800">
                            <p className="text-xs text-gray-500">
                                Belum punya akun?{' '}
                                <button 
                                    type="button" 
                                    onClick={() => setMode('register')} 
                                    className="font-bold text-blue-600 dark:text-blue-400 hover:underline"
                                >
                                    Registrasi
                                </button>
                                {' '}(buat yang belum punya akun. Registrasi ini untuk menjalankan sistem lokal)
                            </p>
                        </div>
                    </form>
                ) : (
                    <form onSubmit={handleRegisterSubmit} className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {/* OWNER SECTION */}
                            <div className="space-y-4">
                                <h3 className="text-sm font-black text-blue-600 dark:text-blue-400 border-b border-slate-100 dark:border-gray-800 pb-2 mb-2">
                                    Informasi Owner / Pemilik
                                </h3>
                                <div>
                                    <Label className="text-xs uppercase font-bold text-gray-500 mb-1.5 block">Nama Pemilik</Label>
                                    <Input value={regOwnerName} onChange={e => setRegOwnerName(e.target.value)} placeholder="Nama Lengkap Pemilik" required className="rounded-xl py-3" />
                                </div>
                                <div>
                                    <Label className="text-xs uppercase font-bold text-gray-500 mb-1.5 block">Username (untuk login)</Label>
                                    <Input value={regUsername} onChange={e => setRegUsername(e.target.value)} placeholder="Contoh: OWNER01" required className="rounded-xl py-3" />
                                </div>
                                <div>
                                    <Label className="text-xs uppercase font-bold text-gray-500 mb-1.5 block">PIN Login (6 Digit)</Label>
                                    <Input type="password" value={regPin} onChange={e => setRegPin(e.target.value)} placeholder="••••••" maxLength={6} required className="rounded-xl py-3 font-mono tracking-widest text-center text-lg" />
                                </div>
                            </div>

                            {/* BUSINESS SECTION */}
                            <div className="space-y-4">
                                <h3 className="text-sm font-black text-emerald-600 dark:text-emerald-400 border-b border-slate-100 dark:border-gray-800 pb-2 mb-2">
                                    Informasi Usaha / Toko Baru
                                </h3>
                                <div>
                                    <Label className="text-xs uppercase font-bold text-gray-500 mb-1.5 block">Nama Usaha / Toko</Label>
                                    <Input value={regBusinessName} onChange={e => setRegBusinessName(e.target.value)} placeholder="Contoh: Mete Corp" required className="rounded-xl py-3" />
                                </div>
                                <div>
                                    <Label className="text-xs uppercase font-bold text-gray-500 mb-1.5 block">Alamat Usaha</Label>
                                    <Input value={regBusinessAddress} onChange={e => setRegBusinessAddress(e.target.value)} placeholder="Contoh: Lumajang, Jawa Timur, Indonesia" required className="rounded-xl py-3" />
                                </div>
                                <div>
                                    <Label className="text-xs uppercase font-bold text-gray-500 mb-1.5 block">Email Usaha</Label>
                                    <Input type="email" value={regBusinessEmail} onChange={e => setRegBusinessEmail(e.target.value)} placeholder="support@posnesia.com" required className="rounded-xl py-3" />
                                </div>
                                <div>
                                    <Label className="text-xs uppercase font-bold text-gray-500 mb-1.5 block">No HP / WhatsApp</Label>
                                    <Input value={regBusinessPhone} onChange={e => setRegBusinessPhone(e.target.value)} placeholder="085852488293" required className="rounded-xl py-3" />
                                </div>
                                <div>
                                    <Label className="text-xs uppercase font-bold text-gray-500 mb-1.5 block">Logo Usaha (Opsional)</Label>
                                    <div className="flex items-center space-x-3">
                                        <div className="flex-1">
                                            <input 
                                                type="file" 
                                                accept="image/*" 
                                                onChange={handleLogoChange} 
                                                className="block w-full text-xs text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 dark:file:bg-gray-800 dark:file:text-gray-300" 
                                            />
                                        </div>
                                        {regLogo && (
                                            <div className="relative">
                                                <img src={regLogo} alt="Preview Logo" className="h-12 w-12 rounded-xl object-contain border border-slate-200 dark:border-gray-700 bg-white" />
                                                <button 
                                                    type="button" 
                                                    onClick={() => setRegLogo('')} 
                                                    className="absolute -top-1.5 -right-1.5 bg-red-500 text-white rounded-full p-0.5 text-[8px] leading-none w-4 h-4 flex items-center justify-center hover:bg-red-600 shadow"
                                                    title="Hapus Logo"
                                                >
                                                    &times;
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* 6 POS CATEGORIES SELECTION GRID */}
                        <div className="space-y-4 pt-4 border-t border-slate-100 dark:border-gray-800">
                            <div className="text-center md:text-left">
                                <h3 className="text-sm font-black text-slate-800 dark:text-slate-200">
                                    Pilih Jenis Alur Kerja &amp; Kategori POS Utama
                                </h3>
                                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                                    Sistem POS akan secara dinamis menyesuaikan layout kasir, menu, denah meja, dan alur pencatatan sesuai pilihan Anda.
                                </p>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                {[
                                    {
                                        id: 'retail' as const,
                                        title: 'Retail POS',
                                        subtitle: 'POS Ritel & Toko',
                                        flow: 'Scan Barang ➔ Bayar Instan',
                                        suitable: 'Toko kelontong, minimarket, butik, apotek, toko elektronik/kosmetik.',
                                        features: ['Barcode Scanner', 'SKU & Stok Real-time', 'Harga Grosir Bertingkat'],
                                        icon: ShoppingBag,
                                        colorClass: 'emerald'
                                    },
                                    {
                                        id: 'production_retail' as const,
                                        title: 'Production & Retail POS',
                                        subtitle: 'Pabrikasi + Ritel',
                                        flow: 'Produksi ➔ Pajang Toko ➔ Jual',
                                        suitable: 'Toko roti (bakery), pastry shop, donut shop, industri kerajinan lokal.',
                                        features: ['Pencatatan Batch Produksi', 'Spoilage (Barang Basi/Rusak)', 'Paket Bundling/Promo'],
                                        icon: Cake,
                                        colorClass: 'amber'
                                    },
                                    {
                                        id: 'qsr' as const,
                                        title: 'QSR POS',
                                        subtitle: 'Layanan Cepat / Pay-First',
                                        flow: 'Pesan & Bayar Kasir ➔ Dapur ➔ Ambil',
                                        suitable: 'Kafe, kedai kopi/teh, boba stall, warung cepat saji, food truck.',
                                        features: ['Layar Quick-Grid Menu', 'Modifiers (Ice, Sugar, Toppings)', 'Kitchen Ticket / KDS'],
                                        icon: Zap,
                                        colorClass: 'blue'
                                    },
                                    {
                                        id: 'fsr' as const,
                                        title: 'FSR POS',
                                        subtitle: 'Restoran Penuh / Pay-Later',
                                        flow: 'Duduk Meja ➔ Makan ➔ Bayar Akhir',
                                        suitable: 'Restoran dine-in, rumah makan, cafe resto, bar & lounge.',
                                        features: ['Denah Meja Visual (Table Mapping)', 'Simpan Tagihan (Open Bill)', 'Split & Merge Bill'],
                                        icon: Utensils,
                                        colorClass: 'rose'
                                    },
                                    {
                                        id: 'service_job' as const,
                                        title: 'Service & Job-Order POS',
                                        subtitle: 'POS Jasa & Servis',
                                        flow: 'Terima Barang ➔ Proses Jasa ➔ Bayar',
                                        suitable: 'Laundry koin/kiloan, cuci mobil, bengkel, penjahit, servis laptop.',
                                        features: ['Nota Pekerjaan (Work Order)', 'Tracking Status Proses', 'Variabel Kiloan (kg)/Durasi'],
                                        icon: Wrench,
                                        colorClass: 'cyan'
                                    },
                                    {
                                        id: 'appointment_commission' as const,
                                        title: 'Appointment & Commission POS',
                                        subtitle: 'Pemesanan Jasa & Komisi',
                                        flow: 'Booking ➔ Pilih Staf ➔ Layani ➔ Bayar',
                                        suitable: 'Barbershop, salon kecantikan, spa & refleksi, klinik estetika.',
                                        features: ['Sistem Booking & Jadwal Kerja', 'Catat Komisi Staf', 'Bagi Hasil Harian'],
                                        icon: Users,
                                        colorClass: 'violet'
                                    }
                                ].map((cat) => {
                                    const IconComponent = cat.icon;
                                    const isSelected = regBusinessType === cat.id;

                                    const colorMap: Record<string, { border: string, bg: string, ring: string, iconBg: string, iconText: string, text: string }> = {
                                        emerald: {
                                            border: 'border-emerald-500',
                                            bg: 'bg-emerald-50/5 dark:bg-emerald-950/10',
                                            ring: 'ring-2 ring-emerald-500/20',
                                            iconBg: 'bg-emerald-100 dark:bg-emerald-950',
                                            iconText: 'text-emerald-600 dark:text-emerald-400',
                                            text: 'text-emerald-700 dark:text-emerald-400'
                                        },
                                        amber: {
                                            border: 'border-amber-500',
                                            bg: 'bg-amber-50/5 dark:bg-amber-950/10',
                                            ring: 'ring-2 ring-amber-500/20',
                                            iconBg: 'bg-amber-100 dark:bg-amber-950',
                                            iconText: 'text-amber-600 dark:text-amber-400',
                                            text: 'text-amber-700 dark:text-amber-400'
                                        },
                                        blue: {
                                            border: 'border-blue-500',
                                            bg: 'bg-blue-50/5 dark:bg-blue-950/10',
                                            ring: 'ring-2 ring-blue-500/20',
                                            iconBg: 'bg-blue-100 dark:bg-blue-950',
                                            iconText: 'text-blue-600 dark:text-blue-400',
                                            text: 'text-blue-700 dark:text-blue-400'
                                        },
                                        rose: {
                                            border: 'border-rose-500',
                                            bg: 'bg-rose-50/5 dark:bg-rose-950/10',
                                            ring: 'ring-2 ring-rose-500/20',
                                            iconBg: 'bg-rose-100 dark:bg-rose-950',
                                            iconText: 'text-rose-600 dark:text-rose-400',
                                            text: 'text-rose-700 dark:text-rose-400'
                                        },
                                        cyan: {
                                            border: 'border-cyan-500',
                                            bg: 'bg-cyan-50/5 dark:bg-cyan-950/10',
                                            ring: 'ring-2 ring-cyan-500/20',
                                            iconBg: 'bg-cyan-100 dark:bg-cyan-950',
                                            iconText: 'text-cyan-600 dark:text-cyan-400',
                                            text: 'text-cyan-700 dark:text-cyan-400'
                                        },
                                        violet: {
                                            border: 'border-violet-500',
                                            bg: 'bg-violet-50/5 dark:bg-violet-950/10',
                                            ring: 'ring-2 ring-violet-500/20',
                                            iconBg: 'bg-violet-100 dark:bg-violet-950',
                                            iconText: 'text-violet-600 dark:text-violet-400',
                                            text: 'text-violet-700 dark:text-violet-400'
                                        }
                                    };

                                    const colors = colorMap[cat.colorClass];

                                    return (
                                        <button
                                            key={cat.id}
                                            type="button"
                                            onClick={() => setRegBusinessType(cat.id)}
                                            className={`relative text-left p-4 rounded-2xl border transition-all duration-200 cursor-pointer flex flex-col justify-between h-full
                                                ${isSelected 
                                                    ? `${colors.border} ${colors.bg} ${colors.ring} shadow-md` 
                                                    : 'border-slate-200 dark:border-gray-800 hover:border-slate-300 dark:hover:border-gray-700 bg-white dark:bg-gray-900/50'
                                                }
                                            `}
                                        >
                                            {isSelected && (
                                                <div className={`absolute top-3 right-3 w-5 h-5 rounded-full ${colors.iconBg} flex items-center justify-center`}>
                                                    <Check className={`w-3.5 h-3.5 ${colors.iconText}`} strokeWidth={3} />
                                                </div>
                                            )}

                                            <div>
                                                <div className="flex items-center space-x-2.5 mb-2.5">
                                                    <div className={`p-2 rounded-xl ${colors.iconBg}`}>
                                                        <IconComponent className={`w-4 h-4 ${colors.iconText}`} />
                                                    </div>
                                                    <div>
                                                        <h4 className="text-xs font-black text-slate-800 dark:text-slate-100 leading-tight">
                                                            {cat.title}
                                                        </h4>
                                                        <span className="text-[10px] font-semibold text-slate-400 dark:text-slate-500">
                                                            {cat.subtitle}
                                                        </span>
                                                    </div>
                                                </div>

                                                <div className="mb-2">
                                                    <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-gray-300">
                                                        {cat.flow}
                                                    </span>
                                                </div>

                                                <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed mb-3">
                                                    <strong>Cocok untuk:</strong> {cat.suitable}
                                                </p>
                                            </div>

                                            <div className="border-t border-slate-100 dark:border-gray-800/80 pt-2 w-full mt-auto">
                                                <ul className="space-y-1">
                                                    {cat.features.map((f, i) => (
                                                        <li key={i} className="text-[10px] text-slate-400 dark:text-slate-500 flex items-center">
                                                            <span className={`mr-1 w-1 h-1 rounded-full ${isSelected ? colors.iconBg : 'bg-slate-300'}`} />
                                                            {f}
                                                        </li>
                                                    ))}
                                                </ul>
                                            </div>
                                        </button>
                                    );
                                })}
                            </div>
                        </div>

                        <Button type="submit" className="w-full py-3.5 rounded-xl font-bold shadow-lg shadow-emerald-500/25 bg-emerald-600 hover:bg-emerald-700 text-white">Daftar &amp; Jalankan Sistem Lokal</Button>
                        
                        <div className="text-center pt-4 border-t border-slate-100 dark:border-gray-800">
                            <p className="text-xs text-gray-500">
                                Sudah punya akun?{' '}
                                <button 
                                    type="button" 
                                    onClick={() => setMode('login')} 
                                    className="font-bold text-blue-600 dark:text-blue-400 hover:underline"
                                >
                                    Login
                                </button>
                            </p>
                        </div>
                    </form>
                )}
            </div>
        </div>
    );
};

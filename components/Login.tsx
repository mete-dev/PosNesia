import React, { useState } from 'react';
import { useAppContext } from '../hooks/useAppContext';
import { Staff } from '../types';
import { 
    Lock, 
    User, 
    Eye, 
    EyeOff, 
    Store, 
    ArrowRight
} from 'lucide-react';

export const LoginPage: React.FC<{ onBack?: () => void }> = ({ onBack }) => {
    const { state, dispatch } = useAppContext();
    const { companyInfo, branches, roles, staff } = state;
    
    const [mode, setMode] = useState<'login' | 'register'>('login');

    // Login state
    const [staffId, setStaffId] = useState('');
    const [staffPin, setStaffPin] = useState('');
    const [showPin, setShowPin] = useState(false);
    const [error, setError] = useState('');
    const [imgError, setImgError] = useState(false);

    // Register state
    const [regOwnerName, setRegOwnerName] = useState('');
    const [regUsername, setRegUsername] = useState('');
    const [regPin, setRegPin] = useState('');
    
    const [regBusinessName, setRegBusinessName] = useState('');
    const [regLogo, setRegLogo] = useState('');
    const [regBusinessAddress, setRegBusinessAddress] = useState('');
    const [regBusinessEmail, setRegBusinessEmail] = useState('');
    const [regBusinessPhone, setRegBusinessPhone] = useState('');
    const [regBranchId, setRegBranchId] = useState(branches[0]?.id || 'b1');
    const [regBusinessType, setRegBusinessType] = useState<'retail' | 'production_retail' | 'qsr' | 'fsr' | 'service_job' | 'appointment_commission'>('retail');

    const handleLoginSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const user = staff.find(s => s.id.toLowerCase() === staffId.trim().toLowerCase() && s.pin === staffPin.trim());
        if (user) {
            dispatch({ type: 'auth/login', payload: { user } });
        } else {
            setError('ID Staf atau PIN salah.');
            setTimeout(() => setError(''), 3000);
        }
    };

    const handleRegisterSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!regUsername || !regOwnerName || !regPin || !regBusinessName || !regBusinessAddress || !regBusinessEmail || !regBusinessPhone) {
            setError('Semua kolom wajib diisi.');
            setTimeout(() => setError(''), 3000);
            return;
        }

        if (staff.some(s => s.id.toLowerCase() === regUsername.trim().toLowerCase())) {
            setError('Username sudah terdaftar.');
            setTimeout(() => setError(''), 3000);
            return;
        }

        const adminRole = roles.find(r => r.name.toLowerCase().includes('admin') || r.name.toLowerCase().includes('pemilik')) || roles[0];

        const companyInfoPayload = {
            name: regBusinessName,
            logoUrl: regLogo || '/logo.png',
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

    const displayLogo = companyInfo.logoUrl && !imgError;

    return (
        <div className="min-h-screen bg-slate-50 text-slate-800 flex items-center justify-center p-4 font-sans relative">
            <div className={`w-full ${mode === 'register' ? 'max-w-2xl' : 'max-w-md'} bg-white rounded-3xl border border-slate-200/80 shadow-xl p-8 relative transition-all duration-300`}>
                
                {/* Minimal Logo & Brand Title */}
                <div className="flex flex-col items-center mb-6 text-center">
                    <div className="mb-3">
                        {displayLogo ? (
                            <img 
                                src={(companyInfo.logoUrl === '/logo.png' || companyInfo.logoUrl === '/logo.svg' || !companyInfo.logoUrl) ? '/logoposnesia.png' : companyInfo.logoUrl} 
                                alt={companyInfo.name || 'Pos Nesia'} 
                                onError={() => setImgError(true)}
                                className="h-16 max-w-[280px] object-contain mx-auto" 
                            />
                        ) : (
                            <div className="p-3 bg-blue-600 rounded-2xl shadow-md text-white inline-flex items-center justify-center">
                                <Store className="w-7 h-7" />
                            </div>
                        )}
                    </div>

                    <h1 className="text-2xl font-black text-slate-900 tracking-tight">
                        {companyInfo.name || 'Pos Nesia'}
                    </h1>
                </div>

                {/* Error Banner */}
                {error && (
                    <div className="mb-4 p-3 text-xs font-semibold text-center text-red-600 bg-red-50 rounded-xl border border-red-200">
                        {error}
                    </div>
                )}

                {/* LOGIN FORM */}
                {mode === 'login' ? (
                    <form onSubmit={handleLoginSubmit} className="space-y-4">
                        <div>
                            <label className="text-xs font-bold text-slate-600 mb-1 block">
                                ID Staf / Username
                            </label>
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                                    <User className="w-4 h-4" />
                                </div>
                                <input
                                    type="text"
                                    value={staffId}
                                    onChange={e => setStaffId(e.target.value)}
                                    placeholder="Username"
                                    required
                                    className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-4 py-3 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:bg-white focus:border-blue-600 focus:ring-2 focus:ring-blue-100 font-medium"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="text-xs font-bold text-slate-600 mb-1 block">
                                PIN Staf
                            </label>
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                                    <Lock className="w-4 h-4" />
                                </div>
                                <input
                                    type={showPin ? "text" : "password"}
                                    value={staffPin}
                                    onChange={e => setStaffPin(e.target.value)}
                                    placeholder="••••••"
                                    maxLength={6}
                                    required
                                    className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-10 py-3 text-base text-slate-900 text-center font-mono tracking-widest placeholder-slate-400 focus:outline-none focus:bg-white focus:border-blue-600 focus:ring-2 focus:ring-blue-100 font-bold"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPin(!showPin)}
                                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600"
                                >
                                    {showPin ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                </button>
                            </div>
                        </div>

                        <button
                            type="submit"
                            className="w-full py-3.5 rounded-xl font-bold text-sm bg-blue-600 hover:bg-blue-700 text-white shadow-md shadow-blue-500/20 transition-all flex items-center justify-center space-x-2"
                        >
                            <span>Masuk</span>
                            <ArrowRight className="w-4 h-4" />
                        </button>

                        {/* Registration Link Below Login Button */}
                        <div className="text-center pt-4 border-t border-slate-100">
                            <p className="text-xs text-slate-500 font-medium">
                                Belum punya akun?{' '}
                                <button
                                    type="button"
                                    onClick={() => { setMode('register'); setError(''); }}
                                    className="font-bold text-blue-600 hover:underline"
                                >
                                    Registrasi
                                </button>
                            </p>
                        </div>
                    </form>
                ) : (
                    /* REGISTRATION FORM */
                    <form onSubmit={handleRegisterSubmit} className="space-y-4 text-left">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="text-xs font-bold text-slate-600 mb-1 block">Nama Pemilik</label>
                                <input value={regOwnerName} onChange={e => setRegOwnerName(e.target.value)} placeholder="Nama Lengkap" required className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs font-medium text-slate-900 focus:bg-white focus:border-blue-600 focus:outline-none" />
                            </div>
                            <div>
                                <label className="text-xs font-bold text-slate-600 mb-1 block">Username Login</label>
                                <input value={regUsername} onChange={e => setRegUsername(e.target.value)} placeholder="Username" required className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs font-medium text-slate-900 focus:bg-white focus:border-blue-600 focus:outline-none" />
                            </div>
                            <div>
                                <label className="text-xs font-bold text-slate-600 mb-1 block">PIN (6 Digit)</label>
                                <input type="password" value={regPin} onChange={e => setRegPin(e.target.value)} placeholder="••••••" maxLength={6} required className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-center font-mono font-bold text-slate-900 focus:bg-white focus:border-blue-600 focus:outline-none" />
                            </div>
                            <div>
                                <label className="text-xs font-bold text-slate-600 mb-1 block">Nama Usaha / Toko</label>
                                <input value={regBusinessName} onChange={e => setRegBusinessName(e.target.value)} placeholder="Nama Toko" required className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs font-medium text-slate-900 focus:bg-white focus:border-blue-600 focus:outline-none" />
                            </div>
                            <div>
                                <label className="text-xs font-bold text-slate-600 mb-1 block">Alamat Usaha</label>
                                <input value={regBusinessAddress} onChange={e => setRegBusinessAddress(e.target.value)} placeholder="Alamat" required className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs font-medium text-slate-900 focus:bg-white focus:border-blue-600 focus:outline-none" />
                            </div>
                            <div className="grid grid-cols-2 gap-2">
                                <div>
                                    <label className="text-xs font-bold text-slate-600 mb-1 block">Email</label>
                                    <input type="email" value={regBusinessEmail} onChange={e => setRegBusinessEmail(e.target.value)} placeholder="Email" required className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-medium text-slate-900 focus:bg-white focus:border-blue-600 focus:outline-none" />
                                </div>
                                <div>
                                    <label className="text-xs font-bold text-slate-600 mb-1 block">No HP</label>
                                    <input value={regBusinessPhone} onChange={e => setRegBusinessPhone(e.target.value)} placeholder="No HP" required className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-medium text-slate-900 focus:bg-white focus:border-blue-600 focus:outline-none" />
                                </div>
                            </div>
                        </div>

                        <div>
                            <label className="text-xs font-bold text-slate-600 mb-2 block">Kategori Usaha</label>
                            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                                {[
                                    { id: 'retail' as const, title: 'Retail POS' },
                                    { id: 'production_retail' as const, title: 'Bakery / Produksi' },
                                    { id: 'qsr' as const, title: 'Cafe / QSR' },
                                    { id: 'fsr' as const, title: 'Restoran FSR' },
                                    { id: 'service_job' as const, title: 'Servis / Laundry' },
                                    { id: 'appointment_commission' as const, title: 'Salon / Barber' },
                                ].map((t) => (
                                    <button
                                        key={t.id}
                                        type="button"
                                        onClick={() => setRegBusinessType(t.id)}
                                        className={`py-2 px-3 rounded-lg text-xs font-semibold border transition-all text-center ${
                                            regBusinessType === t.id
                                                ? 'bg-blue-50 border-blue-600 text-blue-700'
                                                : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                                        }`}
                                    >
                                        {t.title}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <button
                            type="submit"
                            className="w-full py-3.5 rounded-xl font-bold text-sm bg-blue-600 hover:bg-blue-700 text-white shadow-md transition-all"
                        >
                            Daftar Toko Baru
                        </button>

                        {/* Back to Login Link */}
                        <div className="text-center pt-2">
                            <p className="text-xs text-slate-500 font-medium">
                                Sudah punya akun?{' '}
                                <button
                                    type="button"
                                    onClick={() => { setMode('login'); setError(''); }}
                                    className="font-bold text-blue-600 hover:underline"
                                >
                                    Login Staf
                                </button>
                            </p>
                        </div>
                    </form>
                )}

            </div>
        </div>
    );
};

import React, { useState, useEffect } from 'react';
import { useAppContext } from '../hooks/useAppContext';
import { StoreIcon, EcommerceIcon, POSIcon, FinanceIcon, InventoryAdjustmentIcon, ReportIcon, DocumentTextIcon } from './icons';
import { JobOpening, AppState } from '../types';
import { Button, Card, Input, Label, Modal, Textarea } from './ui';
import { 
    Menu, 
    X, 
    Download, 
    LogIn, 
    Store, 
    GraduationCap, 
    Calendar, 
    FileText, 
    MessageSquare, 
    Briefcase, 
    Home 
} from 'lucide-react';

type Page = AppState['currentWebsitePage'];

// Download Modal Component with multiple download options
const DownloadModal: React.FC<{ isOpen: boolean; onClose: () => void }> = ({ isOpen, onClose }) => {
    const { state } = useAppContext();
    const { companyInfo } = state;
    const [downloading, setDownloading] = useState<string | null>(null);
    const [progress, setProgress] = useState(0);

    const handleDownload = (platform: string) => {
        setDownloading(platform);
        setProgress(0);
        const interval = setInterval(() => {
            setProgress(prev => {
                if (prev >= 100) {
                    clearInterval(interval);
                    setTimeout(() => {
                        setDownloading(null);
                        alert(`Unduhan ${platform} berhasil dimulai! Terima kasih telah menggunakan ${companyInfo.name || 'Mete Corp'}.`);
                        onClose();
                    }, 600);
                    return 100;
                }
                return prev + 25;
            });
        }, 180);
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={`Download Aplikasi ${companyInfo.name || 'Mete Corp'}`}>
            <div className="space-y-6 py-4">
                <div className="text-center space-y-2">
                    <img src="/logo.svg" alt={`${companyInfo.name || 'Mete Corp'} Logo`} className="h-12 mx-auto object-contain" />
                    <p className="text-gray-600 dark:text-gray-300 text-sm">
                        Pilih platform perangkat Anda untuk mengunduh aplikasi kasir pintar {companyInfo.name || 'Mete Corp'} secara gratis &amp; aman.
                    </p>
                </div>

                {downloading ? (
                    <div className="space-y-4 text-center py-8">
                        <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-blue-600 border-t-transparent"></div>
                        <p className="font-semibold text-gray-800 dark:text-white">Menyiapkan unduhan untuk {downloading}...</p>
                        <div className="w-full bg-gray-100 dark:bg-gray-800 rounded-full h-3 overflow-hidden shadow-inner">
                            <div className="bg-blue-600 h-3 transition-all duration-200" style={{ width: `${progress}%` }}></div>
                        </div>
                        <p className="text-sm font-mono text-gray-500">{progress}% selesai</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        <button 
                            onClick={() => handleDownload('Android (APK & Play Store)')}
                            className="flex flex-col items-center justify-center p-5 border-2 border-slate-200 dark:border-gray-700 rounded-2xl hover:border-blue-600 hover:bg-blue-50/50 dark:hover:bg-gray-800 transition-all group shadow-sm hover:shadow-md"
                        >
                            <span className="text-4xl mb-3">🤖</span>
                            <span className="font-bold text-gray-900 dark:text-white group-hover:text-blue-600">Android</span>
                            <span className="text-xs text-gray-500 mt-1">APK &amp; Play Store</span>
                            <span className="mt-3 text-xs bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300 font-semibold px-3 py-1 rounded-full">Download APK</span>
                        </button>

                        <button 
                            onClick={() => handleDownload('Windows Desktop (.exe)')}
                            className="flex flex-col items-center justify-center p-5 border-2 border-slate-200 dark:border-gray-700 rounded-2xl hover:border-blue-600 hover:bg-blue-50/50 dark:hover:bg-gray-800 transition-all group shadow-sm hover:shadow-md"
                        >
                            <span className="text-4xl mb-3">💻</span>
                            <span className="font-bold text-gray-900 dark:text-white group-hover:text-blue-600">Windows</span>
                            <span className="text-xs text-gray-500 mt-1">Desktop App (.exe)</span>
                            <span className="mt-3 text-xs bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300 font-semibold px-3 py-1 rounded-full">Download .exe</span>
                        </button>

                        <button 
                            onClick={() => handleDownload('Web / Progressive Web App')}
                            className="flex flex-col items-center justify-center p-5 border-2 border-slate-200 dark:border-gray-700 rounded-2xl hover:border-blue-600 hover:bg-blue-50/50 dark:hover:bg-gray-800 transition-all group shadow-sm hover:shadow-md"
                        >
                            <span className="text-4xl mb-3">🌐</span>
                            <span className="font-bold text-gray-900 dark:text-white group-hover:text-blue-600">Web App</span>
                            <span className="text-xs text-gray-500 mt-1">PWA Tanpa Install</span>
                            <span className="mt-3 text-xs bg-emerald-100 dark:bg-emerald-900/50 text-emerald-700 dark:text-emerald-300 font-semibold px-3 py-1 rounded-full">Buka Langsung</span>
                        </button>
                    </div>
                )}
            </div>
        </Modal>
    );
};

// Header component
const LandingHeader: React.FC<{ 
    onNavigate: (page: Page) => void, 
    onLoginClick: () => void, 
    onDownloadClick: () => void, 
    activePage: Page 
}> = ({ onNavigate, onLoginClick, onDownloadClick, activePage }) => {
    const { state } = useAppContext();
    const { companyInfo, websiteSettings } = state;
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

    const navItems = [
        { id: 'home', label: 'Beranda', icon: <Home className="w-4 h-4" /> },
        ...(websiteSettings.ecommerceEnabled ? [{ id: 'toko', label: 'Toko Online', icon: <Store className="w-4 h-4" /> }] : []),
        ...(websiteSettings.elearningEnabled ? [{ id: 'kursus', label: 'E-Learning', icon: <GraduationCap className="w-4 h-4" /> }] : []),
        ...(websiteSettings.eventsEnabled ? [{ id: 'acara', label: 'Acara', icon: <Calendar className="w-4 h-4" /> }] : []),
        ...(websiteSettings.blogEnabled ? [{ id: 'blog', label: 'Blog', icon: <FileText className="w-4 h-4" /> }] : []),
        ...(websiteSettings.forumEnabled ? [{ id: 'forum', label: 'Forum', icon: <MessageSquare className="w-4 h-4" /> }] : []),
        ...(websiteSettings.careersEnabled ? [{ id: 'karir', label: 'Karir', icon: <Briefcase className="w-4 h-4" /> }] : []),
    ];

    const currentActive = activePage || 'home';

    return (
        <header className="bg-white/95 dark:bg-gray-900/95 backdrop-blur-md fixed top-0 left-0 right-0 z-50 border-b border-slate-200/80 dark:border-gray-800 shadow-sm transition-all duration-300">
            <div className="container mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between items-center h-20">
                    {/* Logo & Brand */}
                    <button 
                        onClick={() => {
                            onNavigate('home');
                            setIsMobileMenuOpen(false);
                        }} 
                        className="flex items-center space-x-3 focus:outline-none group"
                    >
                        <div className="p-2 bg-gradient-to-tr from-blue-500/10 to-emerald-500/10 dark:from-blue-400/20 dark:to-emerald-400/20 rounded-xl group-hover:scale-105 transition-transform">
                            <img src={companyInfo.logoUrl || '/logo.svg'} alt={`${companyInfo.name || 'Mete Corp'} Logo`} className="h-8 w-auto object-contain" />
                        </div>
                        <span className="text-xl font-black bg-gradient-to-r from-blue-600 to-emerald-600 bg-clip-text text-transparent dark:from-blue-400 dark:to-emerald-400 tracking-tight">
                            {companyInfo.name || 'Mete Corp'}
                        </span>
                    </button>

                    {/* Desktop Navigation Links */}
                    <nav className="hidden lg:flex items-center space-x-1">
                        {navItems.map((item) => {
                            const isActive = currentActive === item.id;
                            return (
                                <button
                                    key={item.id}
                                    onClick={() => onNavigate(item.id as Page)}
                                    className={`flex items-center space-x-2 px-4 py-2 rounded-xl text-sm font-bold transition-all duration-200 ${
                                        isActive
                                            ? 'bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400'
                                            : 'text-gray-600 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-slate-50 dark:hover:bg-gray-800/40'
                                    }`}
                                >
                                    {item.icon}
                                    <span className="whitespace-nowrap">{item.label}</span>
                                </button>
                            );
                        })}
                    </nav>

                    {/* Action Buttons & Hamburger */}
                    <div className="flex items-center space-x-3">
                        <button 
                            onClick={onDownloadClick}
                            className="hidden sm:flex items-center space-x-2 border-2 border-slate-200 dark:border-gray-700 hover:border-blue-600 dark:hover:border-blue-400 hover:bg-blue-50/20 text-gray-700 dark:text-gray-300 px-4.5 py-2 rounded-xl font-bold text-xs transition-all"
                        >
                            <Download className="w-3.5 h-3.5" />
                            <span className="whitespace-nowrap">Download App</span>
                        </button>
                        
                        <button 
                            onClick={onLoginClick} 
                            className="hidden sm:flex items-center space-x-2 bg-blue-600 text-white px-5 py-2.5 rounded-xl font-bold text-xs hover:bg-blue-700 shadow-md shadow-blue-500/20 transition-all duration-300"
                        >
                            <LogIn className="w-3.5 h-3.5" />
                            <span className="whitespace-nowrap">Login Admin</span>
                        </button>

                        {/* Hamburger Button */}
                        <button
                            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                            className="p-2.5 rounded-xl text-gray-600 dark:text-gray-300 hover:bg-slate-100 dark:hover:bg-gray-800 lg:hidden transition-colors"
                            aria-label="Toggle menu"
                        >
                            {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
                        </button>
                    </div>
                </div>
            </div>

            {/* Mobile Dropdown Menu with Elegant Transitions */}
            {isMobileMenuOpen && (
                <div className="lg:hidden border-t border-slate-100 dark:border-gray-800 bg-white/98 dark:bg-gray-900/98 backdrop-blur-lg absolute top-20 left-0 right-0 shadow-2xl animate-in slide-in-from-top-4 duration-200">
                    <div className="container mx-auto px-4 py-6 space-y-4">
                        <div className="space-y-1.5">
                            {navItems.map((item) => {
                                const isActive = currentActive === item.id;
                                return (
                                    <button
                                        key={item.id}
                                        onClick={() => {
                                            onNavigate(item.id as Page);
                                            setIsMobileMenuOpen(false);
                                        }}
                                        className={`flex items-center space-x-3 w-full px-4 py-3 rounded-xl text-sm font-bold transition-all ${
                                            isActive
                                                ? 'bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400'
                                                : 'text-gray-600 dark:text-gray-300 hover:bg-slate-50 dark:hover:bg-gray-800/40'
                                        }`}
                                    >
                                        <div className={isActive ? 'text-blue-600 dark:text-blue-400' : 'text-gray-400 dark:text-gray-500'}>
                                            {item.icon}
                                        </div>
                                        <span className="whitespace-nowrap">{item.label}</span>
                                    </button>
                                );
                            })}
                        </div>

                        <div className="border-t border-slate-100 dark:border-gray-800 pt-4 space-y-3">
                            <button
                                onClick={() => {
                                    onDownloadClick();
                                    setIsMobileMenuOpen(false);
                                }}
                                className="flex items-center justify-center space-x-2 w-full border-2 border-slate-200 dark:border-gray-700 hover:border-blue-600 text-gray-700 dark:text-gray-300 py-3 rounded-xl font-bold text-sm transition-all"
                            >
                                <Download className="w-4 h-4" />
                                <span className="whitespace-nowrap">Download Aplikasi</span>
                            </button>
                            <button
                                onClick={() => {
                                    onLoginClick();
                                    setIsMobileMenuOpen(false);
                                }}
                                className="flex items-center justify-center space-x-2 w-full bg-blue-600 text-white py-3 rounded-xl font-bold text-sm hover:bg-blue-700 shadow-lg shadow-blue-500/10 transition-all"
                            >
                                <LogIn className="w-4 h-4" />
                                <span className="whitespace-nowrap">Login Admin</span>
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </header>
    );
};

// Reusable Feature Card
const FeatureCard: React.FC<{ icon: React.ReactElement, title: string, description: string }> = ({ icon, title, description }) => (
    <div className="bg-white dark:bg-gray-800/80 p-8 rounded-3xl shadow-xl border border-slate-100 dark:border-gray-700/80 text-left hover:shadow-2xl transition-all duration-300 group hover:-translate-y-1">
        <div className="inline-block p-4 bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 rounded-2xl mb-6 group-hover:scale-110 transition-transform">
            {React.cloneElement<{ className?: string }>(icon, { className: "w-8 h-8" })}
        </div>
        <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-3">{title}</h3>
        <p className="text-gray-600 dark:text-gray-400 leading-relaxed text-sm">{description}</p>
    </div>
);

// Footer component
const LandingFooter: React.FC = () => {
    const { state } = useAppContext();
    const { companyInfo } = state;
    return (
        <footer className="bg-gray-950 text-white pt-16 pb-12 border-t border-gray-800">
            <div className="container mx-auto px-4 sm:px-6 lg:px-8">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-12">
                    <div className="space-y-4">
                        <img src="/logo.svg" alt={companyInfo.name || 'Mete Corp'} className="h-10 w-auto object-contain bg-white p-1.5 rounded-xl" />
                        <p className="text-gray-400 text-sm leading-relaxed">
                            Aplikasi Kasir Gratis &amp; Manajemen Bisnis All-in-One terpercaya untuk kemajuan UMKM Indonesia.
                        </p>
                    </div>
                    <div>
                        <h4 className="font-bold text-base mb-4 text-blue-400">Fitur Unggulan</h4>
                        <ul className="space-y-2.5 text-sm text-gray-400">
                            <li className="hover:text-white transition-colors">Point of Sale (POS)</li>
                            <li className="hover:text-white transition-colors">Manajemen Inventaris Stok</li>
                            <li className="hover:text-white transition-colors">Laporan Keuangan Otomatis</li>
                        </ul>
                    </div>
                    <div>
                        <h4 className="font-bold text-base mb-4 text-blue-400">Dukungan</h4>
                        <ul className="space-y-2.5 text-sm text-gray-400">
                            <li className="hover:text-white transition-colors">Pusat Bantuan &amp; FAQ</li>
                            <li className="hover:text-white transition-colors">Panduan Penggunaan</li>
                            <li className="hover:text-white transition-colors">Hubungi WhatsApp Support</li>
                            <li className="hover:text-white transition-colors">Syarat &amp; Ketentuan</li>
                        </ul>
                    </div>
                    <div>
                        <h4 className="font-bold text-base mb-4 text-blue-400">Kantor Pusat</h4>
                        <p className="text-sm text-gray-400 leading-relaxed">{companyInfo.address}</p>
                        <p className="text-sm text-gray-400 mt-3">Email: {companyInfo.email}</p>
                        <p className="text-sm text-gray-400">Telp: {companyInfo.phone}</p>
                    </div>
                </div>
                <div className="border-t border-gray-800/80 pt-8 text-center text-sm text-gray-500">
                    <p>&copy; {new Date().getFullYear()} {companyInfo.name || 'Mete Corp'}. All Rights Reserved. 100% Gratis untuk UMKM.</p>
                </div>
            </div>
        </footer>
    );
};

// Reusable Section component
const Section: React.FC<{id: string, title: string, subtitle: string, children: React.ReactNode, onSeeAll?: () => void, seeAllText?: string}> = 
({id, title, subtitle, children, onSeeAll, seeAllText}) => (
    <section id={id} className="py-24 bg-slate-50/50 dark:bg-gray-900">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center max-w-3xl mx-auto mb-16 space-y-4">
                <h2 className="text-3xl sm:text-4xl font-extrabold text-gray-900 dark:text-white tracking-tight">{title}</h2>
                <p className="text-lg text-gray-600 dark:text-gray-400">{subtitle}</p>
            </div>
            {children}
            {onSeeAll && (
                <div className="text-center mt-12">
                    <button onClick={onSeeAll} className="text-blue-600 dark:text-blue-400 font-bold hover:underline inline-flex items-center space-x-1">
                        <span>{seeAllText || 'Lihat Semua'}</span>
                        <span>&rarr;</span>
                    </button>
                </div>
            )}
        </div>
    </section>
);

// Redesigned Homepage View
const HomePage: React.FC<{ onNavigate: (page: Page) => void; onDownloadClick: () => void }> = ({ onNavigate, onDownloadClick }) => {
    const { state } = useAppContext();
    const { websiteSettings, companyInfo } = state;
    
    return (
        <>
            {/* Redesigned Hero Section */}
            <section className="pt-40 pb-32 bg-gradient-to-b from-blue-50/80 via-white to-slate-50 dark:from-gray-900 dark:via-gray-900 dark:to-gray-950 overflow-hidden relative">
                <div className="absolute inset-0 bg-[radial-gradient(#3b82f6_1px,transparent_1px)] [background-size:16px_16px] opacity-10 pointer-events-none"></div>
                <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10 max-w-4xl text-center">
                    <div className="space-y-8">
                        <h1 className="text-4xl sm:text-6xl font-black text-gray-900 dark:text-white tracking-tight leading-[1.15]">
                            {companyInfo.name || 'Mete Corp'} - Aplikasi Kasir Gratis
                        </h1>
                        
                        <p className="text-lg sm:text-xl text-gray-600 dark:text-gray-300 max-w-2xl mx-auto leading-relaxed font-normal">
                            {websiteSettings.tagline || 'Tingkatkan omset dan kontrol toko Anda dengan mudah. Nikmati mesin kasir POS secepat kilat, manajemen inventaris akurat, dan laporan keuangan otomatis tanpa biaya berlangganan.'}
                        </p>
                        
                        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
                            <button
                                onClick={onDownloadClick}
                                className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 text-white font-extrabold px-8 py-4 rounded-2xl shadow-xl shadow-blue-600/30 transition-all transform hover:-translate-y-0.5 flex items-center justify-center space-x-3 text-lg"
                            >
                                <span>📥</span>
                                <span>Download Aplikasi Gratis</span>
                            </button>
                        </div>
                    </div>
                </div>
            </section>
            
            {/* Features Section */}
            <Section id="features" title="Fitur Lengkap untuk Kemajuan Bisnis Anda" subtitle="Semua alat operasional kasir dan pembukuan dalam satu aplikasi cerdas.">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    <FeatureCard icon={<POSIcon/>} title="Point of Sale (POS)" description="Mesin kasir digital cepat, akurat, dan mendukung cetak struk via printer Bluetooth &amp; USB." />
                    <FeatureCard icon={<EcommerceIcon/>} title="Toko Online Otomatis" description="Buat katalog produk online instan dan terima pesanan langsung dari pelanggan via tautan web." />
                    <FeatureCard icon={<InventoryAdjustmentIcon/>} title="Manajemen Stok &amp; Gudang" description="Pantau persediaan barang secara real-time dan cegah kehabisan stok di toko." />
                    <FeatureCard icon={<FinanceIcon/>} title="Keuangan &amp; Laporan" description="Pencatatan arus kas harian, laba rugi, dan neraca otomatis tanpa ribet menghitung manual." />
                    <FeatureCard icon={<ReportIcon/>} title="Analitik Penjualan" description="Kenali produk terlaris and jam sibuk toko untuk strategi bisnis yang lebih tepat sasaran." />
                </div>
            </Section>

            {/* CTA Download Banner */}
            <section className="py-20 bg-blue-600 dark:bg-blue-900 text-white relative overflow-hidden">
                <div className="container mx-auto px-4 sm:px-6 lg:px-8 text-center max-w-4xl space-y-6 relative z-10">
                    <h2 className="text-3xl sm:text-5xl font-black tracking-tight">Siap Kembangkan Bisnis Anda Bersama {companyInfo.name || 'Mete Corp'}?</h2>
                    <p className="text-lg text-blue-100 max-w-2xl mx-auto leading-relaxed">
                        Bergabunglah dengan pelaku UMKM Indonesia yang telah sukses mendigitalisasi usahanya secara gratis.
                    </p>
                    <div className="pt-4 flex flex-col sm:flex-row justify-center gap-4">
                        <button
                            onClick={onDownloadClick}
                            className="bg-white text-blue-700 hover:bg-blue-50 font-black px-8 py-4 rounded-2xl shadow-xl transition transform hover:scale-105 text-lg"
                        >
                            📥 Download {companyInfo.name || 'Mete Corp'} Sekarang
                        </button>
                    </div>
                </div>
            </section>
        </>
    );
};

const PageContainer: React.FC<{title: string, children: React.ReactNode}> = ({ title, children }) => (
    <div className="pt-28 pb-16">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <h1 className="text-4xl font-black text-gray-900 dark:text-white text-center mb-12">{title}</h1>
            {children}
        </div>
    </div>
);

const TokoPage: React.FC = () => {
    const { state } = useAppContext();
    return (
        <PageContainer title="Katalog Produk">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                {state.products.filter(p => p.status === 'active').map(p => (
                    <div key={p.id} className="bg-white dark:bg-gray-800 rounded-2xl shadow-md overflow-hidden group border border-slate-100 dark:border-gray-700 hover:shadow-xl transition-all">
                        <img src={p.imageUrl} alt={p.name} className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-300"/>
                        <div className="p-4">
                            <h4 className="font-bold text-gray-900 dark:text-white truncate">{p.name}</h4>
                            <p className="text-blue-600 dark:text-blue-400 font-extrabold mt-1">Rp{p.price.toLocaleString('id-ID')}</p>
                        </div>
                    </div>
                ))}
            </div>
        </PageContainer>
    );
};

const KursusPage: React.FC = () => {
    const { state } = useAppContext();
    return (
         <PageContainer title="Pusat Pembelajaran &amp; Kursus">
            <div className="max-w-3xl mx-auto space-y-6">
                 {state.courses.map(c => (
                    <div key={c.id} className="bg-white dark:bg-gray-800 rounded-2xl shadow-md p-6 border border-slate-100 dark:border-gray-700">
                        <h2 className="text-2xl font-bold text-blue-600 dark:text-blue-400">{c.title}</h2>
                        <p className="text-gray-700 dark:text-gray-300 mt-2 leading-relaxed">{c.description}</p>
                    </div>
                ))}
            </div>
        </PageContainer>
    );
};

const BlogPage: React.FC = () => {
    const { state } = useAppContext();
    const staffMap = new Map(state.staff.map(s => [s.id, s.name]));
    return (
         <PageContainer title="Blog &amp; Artikel Bisnis">
             <div className="max-w-3xl mx-auto space-y-8">
                {state.blogPosts.map(post => (
                    <div key={post.id} className="bg-white dark:bg-gray-800 p-8 rounded-2xl shadow-md border border-slate-100 dark:border-gray-700">
                        <h2 className="text-3xl font-bold text-gray-900 dark:text-white">{post.title}</h2>
                        <p className="text-sm text-gray-500 my-3">Oleh {staffMap.get(post.authorId) || 'Admin'} | {new Date(post.publishedDate).toLocaleDateString('id-ID', { dateStyle: 'long' })}</p>
                        <p className="whitespace-pre-wrap text-gray-700 dark:text-gray-300 leading-relaxed">{post.content}</p>
                    </div>
                ))}
            </div>
        </PageContainer>
    );
};

const AcaraPage: React.FC = () => {
    const { state } = useAppContext();
    return (
         <PageContainer title="Acara &amp; Webinar Mendatang">
            <div className="max-w-3xl mx-auto space-y-6">
                 {state.events.map(event => (
                    <div key={event.id} className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-md flex justify-between items-center border border-slate-100 dark:border-gray-700">
                        <div>
                            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">{event.name}</h2>
                            <p className="text-blue-500 font-semibold mt-1">{new Date(event.date).toLocaleString('id-ID', { dateStyle: 'full', timeStyle: 'short' })}</p>
                        </div>
                         <div className="text-right">
                             <p className="text-xl font-bold text-emerald-600">Rp{(event.ticketTiers[0]?.price || 0).toLocaleString('id-ID')}</p>
                         </div>
                    </div>
                ))}
            </div>
        </PageContainer>
    );
};

const ForumPage: React.FC = () => {
    const { state } = useAppContext();
    const { forumPosts, staff, customers } = state;

    const authorMap = new Map<string, string>();
    staff.forEach(s => authorMap.set(s.id, s.name));
    customers.forEach(c => authorMap.set(c.id, c.name));

    return (
         <PageContainer title="Forum Diskusi &amp; Tanya Jawab">
             <div className="max-w-3xl mx-auto space-y-8">
                {state.forumPosts.map(post => (
                    <div key={post.id} className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-md border border-slate-100 dark:border-gray-700">
                        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">{post.title}</h2>
                        <p className="text-sm text-gray-500 my-2">Oleh {authorMap.get(post.authorId) || 'Pengguna'} | {new Date(post.timestamp).toLocaleString('id-ID')}</p>
                        <p className="text-gray-700 dark:text-gray-300">{post.content}</p>
                        <div className="mt-4 pl-4 border-l-4 border-blue-500 space-y-3">
                            <h4 className="font-semibold text-sm text-gray-900 dark:text-white">{post.replies.length} Balasan:</h4>
                            {post.replies.map(reply => (
                                <div key={reply.id} className="bg-slate-50 dark:bg-gray-700/50 p-3 rounded-xl">
                                    <p className="text-sm font-semibold text-gray-900 dark:text-white">{authorMap.get(reply.authorId) || 'Staf'}</p>
                                    <p className="text-sm text-gray-600 dark:text-gray-300">{reply.content}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                ))}
            </div>
        </PageContainer>
    );
};

const ApplicationModal: React.FC<{
    isOpen: boolean;
    onClose: () => void;
    job: JobOpening | null;
}> = ({ isOpen, onClose, job }) => {
    const { dispatch } = useAppContext();
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [phone, setPhone] = useState('');
    const [notes, setNotes] = useState('');
    const [cvFile, setCvFile] = useState<File | null>(null);

    useEffect(() => {
        if (!isOpen) {
            setName('');
            setEmail('');
            setPhone('');
            setNotes('');
            setCvFile(null);
        }
    }, [isOpen]);
    
    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!job) return;

        const cvAttachment = cvFile ? { name: cvFile.name, url: '#' } : undefined;

        dispatch({
            type: 'recruitment/addApplicant',
            payload: {
                name,
                email,
                phone,
                position: job.title,
                notes,
                cv: cvAttachment,
            }
        });
        alert(`Lamaran Anda untuk posisi ${job.title} telah terkirim!`);
        onClose();
    };

    if (!job) return null;

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={`Lamar Posisi: ${job.title}`}>
            <form onSubmit={handleSubmit} className="space-y-4">
                <Input value={name} onChange={e => setName(e.target.value)} placeholder="Nama Lengkap Anda" required />
                <Input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="Email Aktif" required />
                <Input type="tel" value={phone} onChange={e => setPhone(e.target.value)} placeholder="Nomor Telepon" required />
                <Textarea value={notes} onChange={e => setNotes(e.target.value)} placeholder="Tulis catatan singkat atau tautan ke portofolio Anda..." />
                <div>
                    <Label htmlFor="cv">Lampirkan CV (Opsional)</Label>
                    <Input id="cv" type="file" onChange={e => setCvFile(e.target.files ? e.target.files[0] : null)} accept=".pdf,.doc,.docx" />
                </div>
                 <div className="flex justify-end gap-2 pt-4">
                    <Button variant="secondary" onClick={onClose}>Batal</Button>
                    <Button type="submit">Kirim Lamaran</Button>
                </div>
            </form>
        </Modal>
    );
};

const CareersPage: React.FC = () => {
    const { state } = useAppContext();
    const { jobOpenings } = state;
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedJob, setSelectedJob] = useState<JobOpening | null>(null);

    const openJobs = jobOpenings.filter(j => j.status === 'Open');

    const handleApply = (job: JobOpening) => {
        setSelectedJob(job);
        setIsModalOpen(true);
    };

    return (
         <PageContainer title="Lowongan Karir">
             <div className="max-w-3xl mx-auto space-y-6">
                {openJobs.length === 0 ? (
                    <p className="text-center text-gray-500 py-8">Saat ini belum ada lowongan yang tersedia. Silakan cek kembali nanti.</p>
                ) : (
                    openJobs.map(job => (
                        <Card key={job.id}>
                            <div className="flex justify-between items-start">
                                <div>
                                    <h2 className="text-2xl font-bold text-blue-600">{job.title}</h2>
                                    <div className="flex gap-4 text-sm text-gray-500 mt-1">
                                        <span><DocumentTextIcon className="w-4 h-4 inline-block mr-1"/>{job.type}</span>
                                        <span>📍 {job.location}</span>
                                    </div>
                                </div>
                                <Button onClick={() => handleApply(job)}>Lamar Sekarang</Button>
                            </div>
                            <p className="mt-4 text-gray-700 dark:text-gray-300">{job.description}</p>
                        </Card>
                    ))
                )}
            </div>
            <ApplicationModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} job={selectedJob} />
        </PageContainer>
    );
};

export const WebsiteLandingPage: React.FC<{ onLoginClick: () => void }> = ({ onLoginClick }) => {
    const { state, dispatch } = useAppContext();
    const { currentWebsitePage, websiteSettings } = state;
    const [isDownloadModalOpen, setIsDownloadModalOpen] = useState(false);
    
    const handleNavigate = (page: Page) => {
        dispatch({ type: 'website/setPage', payload: page });
        window.scrollTo(0, 0);
    };

    const renderPage = () => {
        if (currentWebsitePage === 'toko' && websiteSettings.ecommerceEnabled) {
            return <TokoPage />;
        }
        if (currentWebsitePage === 'kursus' && websiteSettings.elearningEnabled) {
            return <KursusPage />;
        }
        if (currentWebsitePage === 'acara' && websiteSettings.eventsEnabled) {
            return <AcaraPage />;
        }
        if (currentWebsitePage === 'blog' && websiteSettings.blogEnabled) {
            return <BlogPage />;
        }
        if (currentWebsitePage === 'forum' && websiteSettings.forumEnabled) {
            return <ForumPage />;
        }
        if (currentWebsitePage === 'karir' && websiteSettings.careersEnabled) {
            return <CareersPage />;
        }
        return <HomePage onNavigate={handleNavigate} onDownloadClick={() => setIsDownloadModalOpen(true)} />;
    };
    
    return (
        <div className="bg-slate-50 dark:bg-gray-950 text-gray-800 dark:text-gray-200 min-h-screen">
            <LandingHeader 
                onNavigate={handleNavigate} 
                onLoginClick={onLoginClick} 
                onDownloadClick={() => setIsDownloadModalOpen(true)}
                activePage={currentWebsitePage} 
            />
            <main>
                {renderPage()}
            </main>
            <LandingFooter />
            <DownloadModal isOpen={isDownloadModalOpen} onClose={() => setIsDownloadModalOpen(false)} />
        </div>
    );
};



import React, { useState, useEffect } from 'react';
import { Theme, CompanyInfo, ReportLayoutSettings, AccentColor, PaperSize, ThemeConfig, GradientTheme, SingleColorTheme } from '../types';
import { useAppContext } from '../hooks/useAppContext';
import { gradientThemes } from '../utils/colors';

// --- Shared Components ---
const Label: React.FC<{ htmlFor?: string, children: React.ReactNode, className?: string }> = ({ htmlFor, children, className }) => (
    <label htmlFor={htmlFor} className={`block text-sm font-medium text-gray-700 dark:text-gray-300 ${className}`}>{children}</label>
);
const Select: React.FC<React.SelectHTMLAttributes<HTMLSelectElement>> = (props) => (
     <select {...props} className={`mt-1 block w-full rounded-md bg-gray-100 dark:bg-gray-700 border-transparent focus:border-primary-500 focus:bg-white dark:focus:bg-gray-600 focus:ring-0 px-3 py-2 ${props.className}`} />
);

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
        <div className="p-8 h-full overflow-y-auto space-y-8">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-6">Informasi Perusahaan & Penyimpanan PWA</h1>
            
            {/* PWA Local Storage Backup Card */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 max-w-4xl mx-auto border border-primary-100 dark:border-gray-700">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">Pencatatan PWA & Database Lokal</h2>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                    Aplikasi ini berjalan secara lokal di perangkat Anda (HP / Tablet / Desktop) dengan dukungan PWA offline. Anda dapat mencadangkan (backup) data transaksi dan inventori, atau memulihkannya ke perangkat lain.
                </p>
                <div className="flex flex-wrap gap-4 items-center">
                    <button 
                        type="button" 
                        onClick={handleExportData}
                        className="px-4 py-2 rounded-md bg-emerald-600 hover:bg-emerald-700 text-white font-medium text-sm flex items-center space-x-2"
                    >
                        <span>📥 Ekspor Cadangan Data (JSON)</span>
                    </button>
                    <label className="px-4 py-2 rounded-md bg-amber-600 hover:bg-amber-700 text-white font-medium text-sm cursor-pointer inline-flex items-center space-x-2">
                        <span>📤 Pulihkan / Impor Data</span>
                        <input type="file" accept=".json" onChange={handleImportData} className="hidden" />
                    </label>
                </div>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 max-w-4xl mx-auto">
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
                        <textarea id="address" name="address" rows={3} value={formState.address} onChange={handleInputChange} className="mt-1 block w-full rounded-md bg-gray-100 dark:bg-gray-700 border-transparent focus:border-primary-500 focus:bg-white dark:focus:bg-gray-600 focus:ring-0 px-3 py-2"></textarea>
                    </div>
                    <div className="flex justify-end">
                        <button type="submit" className="px-6 py-2 rounded-md text-white bg-primary-600 hover:bg-primary-700 font-semibold">
                            Simpan Perubahan
                        </button>
                    </div>
                </form>
            </div>
        </div>
    )
}

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
    const [settings, setSettings] = useState<ReportLayoutSettings>(state.reportLayoutSettings);

    const handleSave = () => {
        dispatch({ type: 'settings/updateReportLayouts', payload: settings });
        alert('Pengaturan ukuran report berhasil disimpan!');
    };

    const handleSelectChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const { name, value } = e.target;
        setSettings(prev => ({ ...prev, [name]: value as PaperSize }));
    }

    return (
        <div className="p-8 h-full overflow-y-auto">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-6">Ukuran Report</h1>
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-8 w-full max-w-2xl mx-auto space-y-6">
                <p className="text-sm text-gray-500 dark:text-gray-400">Pilih ukuran kertas default untuk berbagai jenis dokumen yang akan dicetak.</p>
                
                <div>
                    <Label htmlFor="posReceiptSize">Ukuran Nota POS & E-commerce</Label>
                    <Select id="posReceiptSize" name="posReceiptSize" value={settings.posReceiptSize} onChange={handleSelectChange}>
                        <option value="80mm">Kertas Termal 80mm</option>
                        <option value="58mm">Kertas Termal 58mm</option>
                        <option value="A4">A4</option>
                        <option value="Letter">Letter</option>
                    </Select>
                </div>

                <div>
                    <Label htmlFor="salesInvoiceSize">Ukuran Faktur Penjualan</Label>
                    <Select id="salesInvoiceSize" name="salesInvoiceSize" value={settings.salesInvoiceSize} onChange={handleSelectChange}>
                        <option value="A4">A4</option>
                        <option value="Letter">Letter</option>
                    </Select>
                </div>
                
                <div>
                    <Label htmlFor="purchaseOrderSize">Ukuran Pesanan Pembelian</Label>
                    <Select id="purchaseOrderSize" name="purchaseOrderSize" value={settings.purchaseOrderSize} onChange={handleSelectChange}>
                        <option value="A4">A4</option>
                        <option value="Letter">Letter</option>
                    </Select>
                </div>

                <div className="flex justify-end pt-4">
                     <button onClick={handleSave} className="px-6 py-2 rounded-md text-white bg-primary-600 hover:bg-primary-700 font-semibold">
                        Simpan Pengaturan
                    </button>
                </div>
            </div>
        </div>
    );
};
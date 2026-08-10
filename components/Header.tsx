

import React, { useState, useRef, useEffect } from 'react';
import { useAppContext } from '../hooks/useAppContext';
import { Theme, Page, Role } from '../types';
import { LogoutIcon, KeyIcon, SettingsIcon } from './icons';
import { Modal, Button } from './ui';

const ChangePinModal: React.FC<{
    isOpen: boolean;
    onClose: () => void;
}> = ({ isOpen, onClose }) => {
    const { state, dispatch } = useAppContext();
    const [oldPin, setOldPin] = useState('');
    const [newPin, setNewPin] = useState('');
    const [confirmPin, setConfirmPin] = useState('');
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setSuccess('');

        if (state.currentUser?.pin !== oldPin) {
            setError('PIN lama salah.');
            return;
        }
        if (newPin !== confirmPin) {
            setError('PIN baru tidak cocok.');
            return;
        }
        if (!/^\d{6}$/.test(newPin)) {
            setError('PIN baru harus 6 digit angka.');
            return;
        }

        dispatch({ type: 'auth/changePin', payload: { newPin } });
        setSuccess('PIN berhasil diubah!');
        setTimeout(() => {
            onClose();
        }, 1500);
    };

    useEffect(() => {
        if (isOpen) {
            setOldPin('');
            setNewPin('');
            setConfirmPin('');
            setError('');
            setSuccess('');
        }
    }, [isOpen]);

    const footer = (
        <>
            <button type="button" onClick={onClose} className="px-4 py-2 rounded-md text-gray-700 dark:text-gray-200 bg-gray-200 dark:bg-gray-600">Batal</button>
            <Button type="submit" onClick={handleSubmit}>Simpan</Button>
        </>
    );

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title="Ganti PIN"
            footer={footer}
            maxWidth="max-w-md"
        >
            <form onSubmit={handleSubmit}>
                {error && <div className="mb-4 p-3 text-sm text-red-700 bg-red-100 rounded-lg dark:bg-red-900/50 dark:text-red-300">{error}</div>}
                {success && <div className="mb-4 p-3 text-sm text-green-700 bg-green-100 rounded-lg dark:bg-green-900/50 dark:text-green-300">{success}</div>}
                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">PIN Lama</label>
                        <input type="password" value={oldPin} onChange={e => setOldPin(e.target.value)} required className="mt-1 w-full rounded-md bg-gray-100 dark:bg-gray-700 border-transparent"/>
                    </div>
                        <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">PIN Baru</label>
                        <input type="password" value={newPin} onChange={e => setNewPin(e.target.value)} required className="mt-1 w-full rounded-md bg-gray-100 dark:bg-gray-700 border-transparent" pattern="\d{6}" title="PIN harus 6 digit angka." maxLength={6}/>
                    </div>
                        <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Konfirmasi PIN Baru</label>
                        <input type="password" value={confirmPin} onChange={e => setConfirmPin(e.target.value)} required className="mt-1 w-full rounded-md bg-gray-100 dark:bg-gray-700 border-transparent" pattern="\d{6}" title="PIN harus 6 digit angka." maxLength={6}/>
                    </div>
                </div>
            </form>
        </Modal>
    );
}


export const Header: React.FC<{ onToggleMobileSidebar?: () => void }> = ({ onToggleMobileSidebar }) => {
    const { state, dispatch } = useAppContext();
    const { currentUser, roles, theme, currentPage } = state;
    const [isDropdownOpen, setDropdownOpen] = useState(false);
    const [isSettingsOpen, setSettingsOpen] = useState(false);
    const [isPinModalOpen, setPinModalOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);
    const settingsRef = useRef<HTMLDivElement>(null);

    const handleLogout = () => {
        dispatch({ type: 'auth/logout' });
    };

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setDropdownOpen(false);
            }
            if (settingsRef.current && !settingsRef.current.contains(event.target as Node)) {
                setSettingsOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    if (!currentUser) return null;

    return (
        <header className="bg-white dark:bg-gray-800 border-b border-slate-200 dark:border-gray-700 sticky top-0 z-30">
            <div className="max-w-full mx-auto px-2 sm:px-4 lg:px-8">
                <div className="flex justify-between items-center h-16 gap-2">
                    <div className="flex items-center gap-2 sm:gap-4 min-w-0">
                         <button
                             onClick={onToggleMobileSidebar}
                             className="p-2 rounded-lg text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 md:hidden focus:outline-none shrink-0"
                             aria-label="Toggle Menu"
                          >
                             <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                             </svg>
                          </button>
                          <img src="/logoposnesia.png" alt="PosNesia" className="h-8 w-auto object-contain md:hidden" />
                          <h1 className="text-sm sm:text-lg font-semibold text-gray-900 dark:text-white truncate">{currentPage}</h1>
                    </div>

                    {/* Right side - Dropdowns */}
                    <div className="flex items-center gap-2">
                        {/* Settings Dropdown */}
                        <div className="relative shrink-0" ref={settingsRef}>
                            <button onClick={() => setSettingsOpen(!isSettingsOpen)} className="flex items-center space-x-1.5 p-1.5 sm:p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-200 focus:outline-none transition-colors">
                                <SettingsIcon className="w-5 h-5 shrink-0 text-gray-500 dark:text-gray-400" />
                                <span className="text-xs sm:text-sm font-medium hidden sm:inline">Pengaturan</span>
                            </button>

                            {isSettingsOpen && (
                                <div className="origin-top-right absolute right-0 mt-2 w-56 rounded-md shadow-lg bg-white dark:bg-gray-800 ring-1 ring-black dark:ring-gray-700 ring-opacity-5 focus:outline-none z-50 border border-gray-100 dark:border-gray-700">
                                    <div className="py-1">
                                        <div className="px-4 py-2 border-b dark:border-gray-700">
                                            <p className="text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">Pengaturan</p>
                                        </div>
                                        <button onClick={() => { dispatch({ type: 'ui/setPage', payload: Page.CompanyInformationSettings }); setSettingsOpen(false); }} className="w-full text-left flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700">
                                            <span>🏢</span>
                                            Informasi Perusahaan
                                        </button>
                                        <button onClick={() => { dispatch({ type: 'ui/setPage', payload: Page.DisplaySettings }); setSettingsOpen(false); }} className="w-full text-left flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700">
                                            <span>🎨</span>
                                            Tampilan
                                        </button>
                                        <button onClick={() => { dispatch({ type: 'ui/setPage', payload: Page.ReportSizesSettings }); setSettingsOpen(false); }} className="w-full text-left flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700">
                                            <span>🖨️</span>
                                            Ukuran Report
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Profile Dropdown */}
                        <div className="relative shrink-0" ref={dropdownRef}>
                            <button onClick={() => setDropdownOpen(!isDropdownOpen)} className="flex items-center space-x-2 sm:space-x-3 p-1.5 sm:p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 focus:outline-none transition-colors">
                                <span className="text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-200 hidden sm:inline">{currentUser.name}</span>
                                <div className="w-8 h-8 rounded-full bg-primary-200 dark:bg-primary-900 flex items-center justify-center font-bold text-primary-700 dark:text-primary-300 shrink-0 text-sm">
                                    {currentUser.name.charAt(0)}
                                </div>
                            </button>

                            {isDropdownOpen && (
                                <div className="origin-top-right absolute right-0 mt-2 w-64 rounded-md shadow-lg bg-white dark:bg-gray-800 ring-1 ring-black dark:ring-gray-700 ring-opacity-5 focus:outline-none z-50 border border-gray-100 dark:border-gray-700">
                                    <div className="py-1">
                                        <div className="px-4 py-3 border-b dark:border-gray-700">
                                            <p className="text-sm font-semibold text-gray-900 dark:text-white">{currentUser.name}</p>
                                            <p className="text-sm text-gray-500 dark:text-gray-400 truncate">{currentUser.email}</p>
                                        </div>
                                        <button onClick={() => { setPinModalOpen(true); setDropdownOpen(false); }} className="w-full text-left flex items-center gap-3 px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700">
                                            <KeyIcon className="w-5 h-5" />
                                            Ganti PIN
                                        </button>
                                        <button onClick={handleLogout} className="w-full text-left flex items-center gap-3 px-4 py-2 text-sm text-red-600 dark:text-red-500 hover:bg-gray-100 dark:hover:bg-gray-700">
                                            <LogoutIcon className="w-5 h-5" />
                                            Logout
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
            <ChangePinModal isOpen={isPinModalOpen} onClose={() => setPinModalOpen(false)} />
        </header>
    );
};

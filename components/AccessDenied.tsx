

import React from 'react';
import { useAppContext } from '../hooks/useAppContext';
import { Page } from '../types';

export const AccessDenied: React.FC = () => {
    const { dispatch } = useAppContext();

    const goHome = () => {
        dispatch({ type: 'ui/setPage', payload: Page.Dashboard });
    };

    return (
        <div className="flex flex-col items-center justify-center h-full text-center p-8">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-24 w-24 text-red-500 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
            </svg>
            <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-2">Akses Ditolak</h1>
            <p className="text-lg text-gray-600 dark:text-gray-400 mb-6">Anda tidak memiliki izin untuk melihat halaman ini.</p>
            <button 
                onClick={goHome} 
                className="px-6 py-3 bg-primary-600 text-white rounded-lg font-semibold hover:bg-primary-700 transition-colors"
            >
                Kembali ke Dasbor
            </button>
        </div>
    );
};

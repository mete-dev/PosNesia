import React, { useState, useEffect, useRef, forwardRef, ReactNode } from 'react';
import { Promotion } from '../types';

// --- Form Elements ---

export const Input = forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>((props, ref) => (
    <input {...props} ref={ref} className={`mt-1 block w-full rounded-md bg-white dark:bg-gray-700 border border-slate-300 dark:border-gray-600 focus:border-primary-500 focus:ring-primary-500 px-3 py-2 ${props.className}`} />
));

export const Select = forwardRef<HTMLSelectElement, React.SelectHTMLAttributes<HTMLSelectElement>>((props, ref) => (
    <select {...props} ref={ref} className={`mt-1 block w-full rounded-md bg-white dark:bg-gray-700 border border-slate-300 dark:border-gray-600 focus:border-primary-500 focus:ring-primary-500 px-3 py-2 ${props.className}`} />
));

export const Textarea = forwardRef<HTMLTextAreaElement, React.TextareaHTMLAttributes<HTMLTextAreaElement>>((props, ref) => (
    <textarea {...props} ref={ref} rows={3} className={`mt-1 block w-full rounded-md bg-white dark:bg-gray-700 border border-slate-300 dark:border-gray-600 focus:border-primary-500 focus:ring-primary-500 px-3 py-2 ${props.className}`} />
));

export const Label: React.FC<{ htmlFor?: string, children: React.ReactNode, className?: string }> = ({ htmlFor, children, className }) => (
    <label htmlFor={htmlFor} className={`block text-sm font-medium text-gray-700 dark:text-gray-300 ${className || ''}`}>{children}</label>
);

// --- UPDATED Button ---
type ButtonVariant = 'primary' | 'secondary' | 'danger' | 'ghost';
const buttonVariants: Record<ButtonVariant, string> = {
    primary: 'text-white bg-primary-600 hover:bg-primary-700 hover:shadow-lg hover:-translate-y-px',
    secondary: 'text-gray-900 dark:text-gray-200 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-600',
    danger: 'text-white bg-red-600 hover:bg-red-700 hover:shadow-lg hover:-translate-y-px',
    ghost: 'text-gray-900 dark:text-gray-200 bg-transparent hover:bg-gray-100 dark:hover:bg-gray-700',
};
type ButtonSize = 'sm' | 'md' | 'lg';
const buttonSizes: Record<ButtonSize, string> = {
    sm: 'px-2.5 py-1.5 text-xs',
    md: 'px-4 py-2 text-sm',
    lg: 'px-6 py-3 text-base',
};

export const Button: React.FC<React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: ButtonVariant, size?: ButtonSize, isLoading?: boolean }> = ({ variant = 'primary', size = 'md', isLoading, children, className, ...props }) => (
    <button {...props} disabled={isLoading || props.disabled} className={`inline-flex items-center justify-center rounded-lg font-semibold disabled:bg-gray-400 disabled:cursor-not-allowed transition-all duration-200 ${buttonVariants[variant]} ${buttonSizes[size]} ${className || ''}`}>
        {isLoading ? <svg className="animate-spin -ml-1 mr-3 h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg> : null}
        {children}
    </button>
);


// --- Layout ---
export const Card: React.FC<{ children: React.ReactNode, className?: string }> = ({ children, className }) => (
    <div className={`bg-white dark:bg-gray-800 rounded-xl border border-slate-200 dark:border-gray-700 p-6 ${className}`}>
        {children}
    </div>
);

export const StatCard: React.FC<{ title: string; value: string; subtext?: string; icon?: React.ReactElement<{ className?: string }>; }> = ({ title, value, subtext, icon }) => (
    <div className="bg-white dark:bg-gray-800 p-6 rounded-xl border border-slate-200 dark:border-gray-700 flex items-start justify-between">
        <div>
            <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">{title}</h3>
            <p className="mt-1 text-3xl font-semibold text-gray-900 dark:text-white">{value}</p>
            {subtext && <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{subtext}</p>}
        </div>
         {icon && (
            <div className="p-3 bg-primary-100 dark:bg-primary-900/50 rounded-lg">
                {React.cloneElement(icon, { className: 'w-6 h-6 text-primary-600 dark:text-primary-400' })}
            </div>
        )}
    </div>
);

// --- NEW PageHeader ---
export const PageHeader: React.FC<{ title: string; children?: React.ReactNode }> = ({ title, children }) => (
    <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">{title}</h1>
        <div>{children}</div>
    </div>
);

// --- Interactive Elements ---

export const ActionsDropdown: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [isOpen, setIsOpen] = useState(false);
    const ref = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (ref.current && !ref.current.contains(event.target as Node)) setIsOpen(false);
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, [ref]);

    return (
        <div className="relative inline-block text-left" ref={ref}>
            <button onClick={() => setIsOpen(!isOpen)} className="inline-flex justify-center w-full rounded-md border border-gray-300 dark:border-gray-600 shadow-sm px-4 py-2 bg-white dark:bg-gray-700 text-sm font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-100 dark:focus:ring-offset-gray-800 focus:ring-primary-500">
                Aksi
                <svg className="-mr-1 ml-2 h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                    <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
            </button>
            {isOpen && (
                <div className="origin-top-right absolute right-0 mt-2 w-56 rounded-xl shadow-xl bg-white dark:bg-gray-800 ring-1 ring-black dark:ring-gray-700 ring-opacity-5 z-50 border border-slate-100 dark:border-gray-700">
                    <div className="py-1" role="menu" aria-orientation="vertical">
                        {children}
                    </div>
                </div>
            )}
        </div>
    );
};

export const DropdownItem: React.FC<React.ButtonHTMLAttributes<HTMLButtonElement>> = ({ className, ...props }) => (
    <button
        {...props}
        className={`block w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-50 ${className || ''}`}
        role="menuitem"
    />
);

export const Modal: React.FC<{
    isOpen: boolean;
    onClose: () => void;
    title: string;
    children: React.ReactNode;
    footer?: React.ReactNode;
    maxWidth?: 'max-w-md' | 'max-w-lg' | 'max-w-xl' | 'max-w-2xl' | 'max-w-3xl' | 'max-w-4xl';
}> = ({ isOpen, onClose, title, children, footer, maxWidth = 'max-w-2xl' }) => {
    if (!isOpen) return null;
    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4" role="dialog" aria-modal="true">
            <div className={`bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full ${maxWidth} max-h-[90vh] flex flex-col`}>
                <div className="p-4 border-b dark:border-gray-700 flex justify-between items-center flex-shrink-0">
                    <h2 className="text-xl font-bold text-gray-900 dark:text-white">{title}</h2>
                    <button onClick={onClose} className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 text-2xl leading-none" aria-label="Close modal">&times;</button>
                </div>
                <div className="p-6 flex-grow overflow-y-auto">
                    {children}
                </div>
                {footer && (
                    <div className="p-4 border-t dark:border-gray-700 flex justify-end space-x-4 flex-shrink-0 bg-gray-50 dark:bg-gray-800/50 rounded-b-lg">
                        {footer}
                    </div>
                )}
            </div>
        </div>
    );
};

// --- NEW PIN Modal ---
export const PINModal: React.FC<{
    isOpen: boolean;
    onClose: () => void;
    onConfirm: (pin: string) => void;
    title?: string;
    description?: string;
}> = ({ isOpen, onClose, onConfirm, title = "Verifikasi PIN", description = "Masukkan PIN 6 digit untuk melanjutkan." }) => {
    const [pin, setPin] = useState('');
    const [error, setError] = useState('');
    const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

    useEffect(() => {
        if (isOpen) {
            setPin('');
            setError('');
            inputRefs.current[0]?.focus();
        }
    }, [isOpen]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>, index: number) => {
        const { value } = e.target;
        if (/^[0-9]$/.test(value) || value === '') {
            const newPin = [...pin];
            newPin[index] = value;
            setPin(newPin.join(''));

            if (value !== '' && index < 5) {
                inputRefs.current[index + 1]?.focus();
            }
        }
    };
    
     const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>, index: number) => {
        if (e.key === 'Backspace' && pin[index] === undefined && index > 0) {
            inputRefs.current[index - 1]?.focus();
        }
    };
    
    const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
        const paste = e.clipboardData.getData('text').slice(0, 6);
        if (/^\d{6}$/.test(paste)) {
            setPin(paste);
            paste.split('').forEach((char, index) => {
                if (inputRefs.current[index]) {
                    (inputRefs.current[index] as HTMLInputElement).value = char;
                }
            });
             inputRefs.current[5]?.focus();
        }
    };


    const handleSubmit = () => {
        if (pin.length === 6) {
            onConfirm(pin);
        } else {
            setError('PIN harus 6 digit.');
        }
    };

    if (!isOpen) return null;
    
    return (
        <Modal isOpen={isOpen} onClose={onClose} title={title} maxWidth="max-w-md" footer={<Button onClick={handleSubmit}>Konfirmasi</Button>}>
            <div className="text-center">
                <p className="mb-4 text-gray-600 dark:text-gray-400">{description}</p>
                 {error && <p className="text-red-500 text-sm mb-4">{error}</p>}
                <div className="flex justify-center gap-2" onPaste={handlePaste}>
                    {Array.from({ length: 6 }).map((_, i) => (
                        <input
                            key={i}
                            ref={el => { inputRefs.current[i] = el; }}
                            type="password"
                            maxLength={1}
                            value={pin[i] || ''}
                            onChange={e => handleChange(e, i)}
                             onKeyDown={e => handleKeyDown(e, i)}
                            className="w-12 h-14 text-center text-2xl font-bold rounded-lg bg-gray-100 dark:bg-gray-700 border-2 border-transparent focus:border-primary-500 focus:ring-0"
                        />
                    ))}
                </div>
            </div>
        </Modal>
    );
};


// --- NEW Badge ---
type BadgeVariant = 'success' | 'warning' | 'danger' | 'info' | 'neutral' | 'primary';
const badgeVariants: Record<BadgeVariant, string> = {
    success: 'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300',
    warning: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/50 dark:text-yellow-300',
    danger: 'bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-300',
    info: 'bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-300',
    primary: 'bg-primary-100 text-primary-800 dark:bg-primary-900/50 dark:text-primary-300',
    neutral: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
};
export const Badge: React.FC<{ children: React.ReactNode; variant?: BadgeVariant }> = ({ children, variant = 'neutral' }) => (
    <span className={`px-2 py-1 rounded-full text-xs font-semibold ${badgeVariants[variant]}`}>
        {children}
    </span>
);

// --- NEW Table Components ---
export const Table: React.FC<{ children: React.ReactNode }> = ({ children }) => (
    <div className="overflow-x-auto">
        <table className="w-full text-sm text-left text-gray-500 dark:text-gray-400">
            {children}
        </table>
    </div>
);
export const Thead: React.FC<{ children: React.ReactNode }> = ({ children }) => (
    <thead className="text-xs text-gray-700 uppercase bg-gray-50 dark:bg-gray-700 dark:text-gray-400 sticky top-0">
        {children}
    </thead>
);
export const Tbody: React.FC<{ children: React.ReactNode }> = ({ children }) => <tbody>{children}</tbody>;
export const Tr: React.FC<{ children: React.ReactNode; className?: string }> = ({ children, className }) => (
    <tr className={`bg-white dark:bg-gray-800 border-b dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 ${className}`}>
        {children}
    </tr>
);
export const Th: React.FC<React.ThHTMLAttributes<HTMLTableCellElement>> = ({ children, className, ...props }) => <th scope="col" {...props} className={`px-3 py-2 text-xs font-extrabold uppercase tracking-wider ${className}`}>{children}</th>;
export const Td: React.FC<React.TdHTMLAttributes<HTMLTableCellElement>> = ({ children, className, ...props }) => <td {...props} className={`px-3 py-1.5 text-xs ${className}`}>{children}</td>;


// --- Moved from Reports.tsx ---
export const DateRangeFilter: React.FC<{
    onFilter: (startDate: string, endDate: string) => void;
    title?: string;
    defaultRange?: number; // in days
    className?: string;
}> = ({ onFilter, title = "Periode", defaultRange = 30, className = "" }) => {
    const today = new Date();
    const pastDate = new Date();
    pastDate.setDate(today.getDate() - defaultRange);

    const [startDate, setStartDate] = useState(pastDate.toISOString().split('T')[0]);
    const [endDate, setEndDate] = useState(today.toISOString().split('T')[0]);

    const handleApplyFilter = () => {
        onFilter(startDate, endDate);
    };

    React.useEffect(() => {
        handleApplyFilter();
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    return (
        <div className={`bg-white dark:bg-zinc-900 p-2.5 rounded-xl border border-slate-200/80 dark:border-zinc-800 shadow-2xs flex flex-nowrap items-center justify-between gap-2.5 overflow-x-auto shrink-0 ${className}`}>
            <div className="flex items-center gap-2 shrink-0">
                <span className="text-xs font-bold text-slate-700 dark:text-zinc-300 whitespace-nowrap">{title}:</span>
                <Input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="text-xs py-1 px-2 w-32 shrink-0"
                />
                <span className="text-xs text-slate-400 shrink-0">s/d</span>
                <Input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="text-xs py-1 px-2 w-32 shrink-0"
                />
                <Button onClick={handleApplyFilter} className="text-xs py-1 px-2.5 shadow-xs shrink-0 whitespace-nowrap">
                    Buat Laporan
                </Button>
            </div>
        </div>
    );
};

// --- NEW Print Components ---
export const PrintLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    return (
        <>
            <style type="text/css" media="print">
                {`
                    @page {
                        size: A4;
                        margin: 1cm;
                    }
                    body {
                        -webkit-print-color-adjust: exact;
                        print-color-adjust: exact;
                    }
                    .print-hide {
                        display: none;
                    }
                `}
            </style>
            <div>
                {children}
            </div>
        </>
    );
};

export const PriceLabel: React.FC<{
    productName: string;
    barcode: string;
    price: number;
    location: string;
    promotion?: Promotion;
}> = ({ productName, barcode, price, location, promotion }) => {

    const getDiscountedPrice = () => {
        if (!promotion) return null;
        const benefit = promotion.benefit;
        if (benefit.type === 'percentage_discount') {
            return price * (1 - benefit.value / 100);
        }
        if (benefit.type === 'fixed_discount') {
            return price - benefit.value;
        }
        return null;
    };

    const discountedPrice = getDiscountedPrice();

    return (
        <div className="bg-white p-2 text-black flex flex-col justify-between h-[5.5cm] w-[9cm] border border-gray-300">
            <div>
                <p className="text-sm font-bold truncate">{productName}</p>
            </div>
            
            <div className="text-right">
                {discountedPrice !== null ? (
                    <>
                        <p className="text-sm text-gray-500 line-through">Rp{price.toLocaleString('id-ID')}</p>
                        <p className="text-2xl font-extrabold text-red-600">Rp{discountedPrice.toLocaleString('id-ID')}</p>
                        <p className="text-xs font-semibold text-red-600 bg-red-100 px-2 py-0.5 rounded-full inline-block">{promotion?.name}</p>
                    </>
                ) : (
                    <p className="text-3xl font-extrabold text-black">Rp{price.toLocaleString('id-ID')}</p>
                )}
            </div>

            <div className="flex justify-between items-end border-t border-dashed border-gray-400 pt-1 mt-1">
                <p className="font-mono text-xs tracking-widest">{barcode}</p>
                <p className="text-sm font-bold">{location}</p>
            </div>
        </div>
    );
};
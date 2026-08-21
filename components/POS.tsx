import React, { useState, useMemo, useEffect, useRef } from 'react';
import { useAppContext } from '../hooks/useAppContext';
import { Product, Customer, Sale, PosSessionSummary, CompanyInfo, PaymentMethod, PosSession, Staff, JournalEntry, CustomerBill } from '../types';
import { LogoutIcon, DashboardIcon, InfoIcon, POSIcon, ReportIcon, DepositIcon, WithdrawIcon, BillIcon } from './icons';
import { Receipt } from './Receipt';
import { Input, Label, Button, Modal, Select, Card, Table, Thead, Tbody, Tr, Th, Td } from './ui';
import { CustomerModal } from './Customers';
import { BUSINESS_PRESETS, ProductPreset, BusinessPreset } from '../data/businessPresets';
import { 
  Coffee, 
  Cake, 
  ShoppingBag, 
  UserPlus, 
  Search, 
  ShoppingCart, 
  Trash2, 
  Tag, 
  Plus, 
  Minus, 
  Smartphone, 
  CheckCircle2, 
  FileText, 
  Barcode, 
  Clock, 
  Camera,
  RotateCcw,
  MapPin, 
  ChevronRight, 
  HelpCircle,
  TrendingUp,
  X,
  ChefHat,
  Utensils,
  Wrench,
  Calendar,
  Users,
  Scissors,
  RefreshCw,
  Play,
  CheckSquare,
  Sparkles,
  Settings,
  Banknote,
  CreditCard,
  QrCode,
  Wallet
} from 'lucide-react';

type PosView = 'transaction' | 'info' | 'register' | 'report' | 'pay_bill';
type DepositWithdrawReceipt = { type: 'Deposit' | 'Withdrawal'; userName: string; amount: number; userType: 'Pelanggan' | 'Staf' };

// Active table order state for FSR mode
interface TableOrder {
  tableNumber: number;
  items: CartItemWithModifiers[];
  customerId: string;
}

interface CartItemWithModifiers {
  id: string; // Unique instance ID in cart
  product: ProductPreset;
  quantity: number;
  // Cafe modifiers (used in QSR & FSR)
  sugarLevel?: 'Normal' | 'Less' | 'No Sugar';
  iceLevel?: 'Normal' | 'Less' | 'No Ice';
  extraEspresso?: boolean;
  extraBoba?: boolean;
  // Bakery modifiers (used in Production & Retail)
  cakeWriting?: string;
  candlesCount?: number;
  // Service / Job-order modifiers
  serviceWeight?: number; // e.g. 3.5 for 3.5 kg
  serviceDuration?: number; // e.g. 2 for 2 hours
  serviceNotes?: string;
  // Appointment modifiers
  assignedStaffId?: string;
  assignedStaffName?: string;
  appointmentTime?: string;
}

// --- Sale Receipt Modal ---
const SaleReceiptModal: React.FC<{
    isOpen: boolean;
    onClose: () => void;
    sale: Sale | null;
}> = ({ isOpen, onClose, sale }) => {
    const { state } = useAppContext();
    const { companyInfo, reportLayoutSettings } = state;
    const receiptRef = useRef<HTMLDivElement>(null);

    const handlePrint = () => {
        const printContents = receiptRef.current?.innerHTML;
        if (!printContents) return;

        const iframe = document.createElement('iframe');
        iframe.style.display = 'none';
        document.body.appendChild(iframe);

        const doc = iframe.contentWindow?.document;
        if (!doc) return;

        doc.open();
        doc.write(`
            <!DOCTYPE html>
            <html>
                <head>
                    <title>Print Receipt</title>
                    <script src="https://cdn.tailwindcss.com"></script>
                    <style>
                        @page { size: auto; margin: 0mm; }
                        body { margin: 0; -webkit-print-color-adjust: exact; font-family: monospace; }
                    </style>
                </head>
                <body>
                    <div class="p-6">
                        ${printContents}
                    </div>
                </body>
            </html>
        `);
        doc.close();

        iframe.onload = function() {
            iframe.contentWindow?.focus();
            iframe.contentWindow?.print();
            document.body.removeChild(iframe);
        };
    };
    
    if (!isOpen || !sale) return null;

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Transaksi Berhasil" footer={<><Button onClick={handlePrint} className="mr-2">Cetak Struk</Button><Button onClick={onClose} variant="secondary">Selesai</Button></>}>
            <div className="p-6 bg-gray-50 dark:bg-zinc-900 rounded-xl max-h-[60vh] overflow-y-auto">
                <div ref={receiptRef} className="flex justify-center">
                    <Receipt sale={sale} companyInfo={companyInfo} settings={reportLayoutSettings}/>
                </div>
            </div>
        </Modal>
    );
};

// --- Cashier Session Summary Receipt Modal ---
const PosSessionSummaryReceipt: React.FC<{
    summary: PosSessionSummary | Omit<PosSessionSummary, 'id' | 'status' | 'date' | 'cashierId' | 'verifiedBy' | 'verifiedDate' | 'depositToAccountId'>;
    session: PosSession;
    companyInfo: CompanyInfo;
}> = ({ summary, session, companyInfo }) => {
     return (
        <div className="bg-white text-zinc-900 font-mono mx-auto w-[80mm] p-4 text-xs border border-zinc-200 shadow-sm rounded-lg">
            <div className="text-center mb-4">
                <h1 className="font-bold text-sm tracking-wider uppercase text-zinc-800">REKAP SESI KASIR</h1>
                <p className="font-medium text-[10px] text-zinc-500">{companyInfo.name}</p>
            </div>
            <div className="border-t border-b border-dashed border-zinc-300 py-2 mb-3 space-y-1">
                <div className="flex justify-between"><span>Sesi ID:</span><span className="font-semibold">{session.id}</span></div>
                <div className="flex justify-between"><span>Kasir:</span><span className="font-semibold">{summary.cashierName}</span></div>
                <div className="flex justify-between"><span>Mulai:</span><span>{new Date(session.startTime).toLocaleString('id-ID')}</span></div>
                <div className="flex justify-between"><span>Selesai:</span><span>{new Date().toLocaleString('id-ID')}</span></div>
            </div>
            <p className="font-bold text-center text-zinc-700 mb-2 uppercase tracking-wide">Rincian Pembayaran</p>
            <table className="w-full my-2">
                <tbody className="border-t border-b border-dashed border-zinc-300">
                    {Object.entries(summary.paymentBreakdown).map(([method, amount]) => (
                        <tr key={method}>
                            <td className="py-1 text-zinc-650">{method}</td>
                            <td className="text-right align-top font-bold text-zinc-800">Rp{(amount as number).toLocaleString('id-ID')}</td>
                        </tr>
                    ))}
                </tbody>
            </table>
             <div className="mt-3 space-y-1 bg-zinc-50 p-2 rounded-md">
                <div className="flex justify-between text-zinc-600"><span>Tunai (Sistem):</span><span>Rp{summary.expectedCash.toLocaleString('id-ID')}</span></div>
                <div className="flex justify-between text-zinc-600"><span>Tunai (Dihitung):</span><span>Rp{summary.countedCash.toLocaleString('id-ID')}</span></div>
                <div className="flex justify-between font-bold text-zinc-900 border-t border-dashed border-zinc-300 pt-1.5 mt-1">
                  <span>Selisih:</span>
                  <span className={summary.variance < 0 ? 'text-red-600' : summary.variance > 0 ? 'text-green-600' : ''}>
                    Rp{summary.variance.toLocaleString('id-ID')}
                  </span>
                </div>
            </div>
        </div>
    );
};

const ProductInfoModal: React.FC<{
    isOpen: boolean;
    onClose: () => void;
    products: any[];
    onAddToCart: (product: any) => void;
}> = ({ isOpen, onClose, products, onAddToCart }) => {
    const [search, setSearch] = useState('');
    
    const filtered = useMemo(() => {
        return products.filter(p => 
            p.name.toLowerCase().includes(search.toLowerCase()) || 
            p.id.toLowerCase().includes(search.toLowerCase()) ||
            (p.category && p.category.toLowerCase().includes(search.toLowerCase()))
        );
    }, [products, search]);

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="🔍 Cek Informasi & Stok Produk" maxWidth="max-w-3xl">
            <div className="space-y-4">
                <Input 
                    value={search} 
                    onChange={e => setSearch(e.target.value)} 
                    placeholder="🔍 Cari nama produk, SKU, atau kategori..." 
                    className="w-full text-sm"
                />
                <div className="max-h-[60vh] overflow-y-auto border rounded-xl dark:border-gray-700">
                    <Table>
                        <Thead>
                            <Tr className="bg-gray-50 dark:bg-gray-800 sticky top-0">
                                <Th>Nama Produk</Th>
                                <Th>Kategori</Th>
                                <Th className="text-right">Harga</Th>
                                <Th className="text-center">Stok</Th>
                                <Th className="text-center">Aksi</Th>
                            </Tr>
                        </Thead>
                        <Tbody>
                            {filtered.map(p => (
                                <Tr key={p.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                                    <Td>
                                        <div className="font-bold text-sm text-gray-900 dark:text-white">{p.name}</div>
                                        <div className="text-xs text-gray-500 font-mono">SKU: {p.id}</div>
                                    </Td>
                                    <Td>
                                        <span className="px-2 py-0.5 text-[10px] font-bold rounded bg-slate-100 dark:bg-gray-700 text-slate-600 dark:text-gray-300">
                                            {p.category}
                                        </span>
                                    </Td>
                                    <Td className="text-right font-bold text-sm text-gray-900 dark:text-white">
                                        Rp{p.price.toLocaleString('id-ID')}
                                    </Td>
                                    <Td className="text-center">
                                        <span className={`px-2 py-0.5 text-xs font-bold rounded ${p.stock > 0 ? 'bg-green-100 text-green-800 dark:bg-green-950 dark:text-green-300' : 'bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300'}`}>
                                            {p.stock > 0 ? `${p.stock} pcs` : 'Habis'}
                                        </span>
                                    </Td>
                                    <Td className="text-center">
                                        <Button 
                                            size="sm"
                                            disabled={p.stock <= 0}
                                            onClick={() => { onAddToCart(p); onClose(); }}
                                        >
                                            + Keranjang
                                        </Button>
                                    </Td>
                                </Tr>
                            ))}
                        </Tbody>
                    </Table>
                </div>
            </div>
        </Modal>
    );
};

const CustomerBillPaymentModal: React.FC<{
    isOpen: boolean;
    onClose: () => void;
}> = ({ isOpen, onClose }) => {
    const { state, dispatch } = useAppContext();
    const { customerBills } = state;
    const unpaidBills = useMemo(() => customerBills.filter(b => b.status === 'Unpaid'), [customerBills]);

    const handlePayBill = (bill: any) => {
        dispatch({ type: 'customerBills/pay', payload: { billId: bill.id, paymentAccountId: 'acc-1' } });
        alert(`Tagihan ${bill.description} sebesar Rp ${bill.amount.toLocaleString('id-ID')} berhasil dilunasi!`);
        onClose();
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="💳 Bayar Tagihan Pelanggan" maxWidth="max-w-3xl">
            <div className="space-y-4">
                <p className="text-xs text-gray-500 dark:text-gray-400">Pilih tagihan piutang / pembayaran pelanggan yang belum lunas di bawah ini untuk memproses pembayaran langsung dari mesin kasir.</p>
                
                {unpaidBills.length === 0 ? (
                    <div className="p-8 text-center text-gray-500 font-semibold bg-gray-50 dark:bg-gray-800 rounded-xl">
                        Semua tagihan pelanggan saat ini sudah lunas.
                    </div>
                ) : (
                    <div className="max-h-[55vh] overflow-y-auto border rounded-xl dark:border-gray-700">
                        <Table>
                            <Thead>
                                <Tr className="bg-gray-50 dark:bg-gray-800 sticky top-0">
                                    <Th>Pelanggan</Th>
                                    <Th>Keterangan</Th>
                                    <Th>Jatuh Tempo</Th>
                                    <Th className="text-right">Jumlah Tagihan</Th>
                                    <Th className="text-center">Aksi</Th>
                                </Tr>
                            </Thead>
                            <Tbody>
                                {unpaidBills.map(bill => (
                                    <Tr key={bill.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                                        <Td className="font-bold text-sm">{bill.customerName}</Td>
                                        <Td className="text-xs text-gray-600 dark:text-gray-300">{bill.description}</Td>
                                        <Td className="text-xs text-red-500 font-semibold">{bill.dueDate}</Td>
                                        <Td className="text-right font-bold text-sm text-blue-600 dark:text-blue-400">
                                            Rp{bill.amount.toLocaleString('id-ID')}
                                        </Td>
                                        <Td className="text-center">
                                            <Button 
                                                size="sm"
                                                onClick={() => handlePayBill(bill)}
                                            >
                                                Pelunasan
                                            </Button>
                                        </Td>
                                    </Tr>
                                ))}
                            </Tbody>
                        </Table>
                    </div>
                )}
            </div>
        </Modal>
    );
};

const TransactionHistoryModal: React.FC<{
    isOpen: boolean;
    onClose: () => void;
    sales: Sale[];
    onSelectSale: (sale: Sale) => void;
}> = ({ isOpen, onClose, sales, onSelectSale }) => {
    return (
        <Modal isOpen={isOpen} onClose={onClose} title="📜 Riwayat Transaksi Kasir" maxWidth="max-w-4xl">
            <div className="space-y-4">
                <p className="text-xs text-gray-500 dark:text-gray-400">Daftar transaksi penjualan yang telah berhasil diproses oleh mesin kasir pada sesi ini.</p>
                {sales.length === 0 ? (
                    <div className="p-8 text-center text-gray-500 font-semibold bg-gray-50 dark:bg-gray-800 rounded-xl">
                        Belum ada transaksi penjualan pada sesi ini.
                    </div>
                ) : (
                    <div className="max-h-[60vh] overflow-y-auto border rounded-xl dark:border-gray-700">
                        <Table>
                            <Thead>
                                <Tr className="bg-gray-50 dark:bg-gray-800 sticky top-0">
                                    <Th>ID Transaksi</Th>
                                    <Th>Waktu</Th>
                                    <Th>Pelanggan</Th>
                                    <Th>Metode Bayar</Th>
                                    <Th className="text-right">Total Rp</Th>
                                    <Th className="text-center">Struk</Th>
                                </Tr>
                            </Thead>
                            <Tbody>
                                {sales.slice().reverse().map(sale => (
                                    <Tr key={sale.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                                        <Td className="font-mono font-bold text-xs">{sale.id}</Td>
                                        <Td className="text-xs">{new Date(sale.date).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}</Td>
                                        <Td className="text-xs font-semibold">{sale.customerName || 'Pelanggan Umum'}</Td>
                                        <Td className="text-xs">{sale.paymentMethodId === 'pm1' ? 'Tunai' : 'Non-Tunai / Digital'}</Td>
                                        <Td className="text-right font-bold text-sm text-emerald-600 dark:text-emerald-400">
                                            Rp{sale.grandTotal.toLocaleString('id-ID')}
                                        </Td>
                                        <Td className="text-center">
                                            <Button 
                                                size="sm"
                                                variant="secondary"
                                                onClick={() => { onSelectSale(sale); onClose(); }}
                                            >
                                                Cetak Struk
                                            </Button>
                                        </Td>
                                    </Tr>
                                ))}
                            </Tbody>
                        </Table>
                    </div>
                )}
            </div>
        </Modal>
    );
};

export const POSPage: React.FC = () => {
    const { state, dispatch } = useAppContext();
    const { posSession, currentUser, lastTransaction, companyInfo, sales, paymentMethods, journalEntries, customerBills, lastPaidBill, lastWithdrawalReceipt, accounts, staff } = state;
    
    // Core state
    const [view, setView] = useState<PosView>('transaction');
    const [activeBusinessMode, setActiveBusinessMode] = useState<'retail' | 'production_retail' | 'qsr' | 'fsr' | 'service_job' | 'appointment_commission'>(
      (companyInfo.businessType as any) || 'retail'
    );

    useEffect(() => {
        if (companyInfo.businessType) {
            setActiveBusinessMode(companyInfo.businessType as any);
        }
    }, [companyInfo.businessType]);
    const [selectedCategory, setSelectedCategory] = useState<string>('Semua');
    const [searchQuery, setSearchQuery] = useState('');
    
    // Local POS cart to support modifiers, wholesale pricing and custom presets
    const [posCart, setPosCart] = useState<CartItemWithModifiers[]>([]);
    
    // Barcode simulator input
    const [barcodeInput, setBarcodeInput] = useState('');
    const [barcodeSuccessMsg, setBarcodeSuccessMsg] = useState('');

    // FSR Visual Tables State (Table 1 to Table 8)
    const [tableOrders, setTableOrders] = useState<TableOrder[]>([]);
    const [activeTable, setActiveTable] = useState<number | null>(null);

    // Interactive KDS (Kitchen Display System) orders for QSR & FSR
    const [kdsOrders, setKdsOrders] = useState<{ id: string; tableName?: string; items: { name: string; quantity: number; modifiers?: string }[]; time: string; status: 'Antri' | 'Memasak' | 'Selesai' }[]>([
      { id: 'KDS-101', tableName: 'Meja 2', items: [{ name: 'Espresso Double Shot', quantity: 1, modifiers: 'Less Ice' }, { name: 'Croissant Cokelat', quantity: 2 }], time: '09:42', status: 'Memasak' },
      { id: 'KDS-102', tableName: 'Takeaway', items: [{ name: 'Kopi Susu Gula Aren', quantity: 3, modifiers: 'Normal' }], time: '09:45', status: 'Antri' }
    ]);

    // Interactive Bakery Backend Production & Spoilage tracker for Production & Retail
    const [productionQueue, setProductionQueue] = useState<{ id: string; productName: string; quantity: number; batchNo: string; progress: number; status: 'Baking' | 'Cooling' | 'Ready' }[]>([
      { id: 'PRD-01', productName: 'Roti Manis Cokelat', quantity: 50, batchNo: 'B-089', progress: 80, status: 'Baking' },
      { id: 'PRD-02', productName: 'Roti Tawar Gandum', quantity: 20, batchNo: 'B-090', progress: 30, status: 'Baking' },
      { id: 'PRD-03', productName: 'Croissant Mentega', quantity: 30, batchNo: 'B-088', progress: 100, status: 'Cooling' }
    ]);
    const [spoilageLog, setSpoilageLog] = useState<{ id: string; productName: string; quantity: number; reason: string; date: string }[]>([
      { id: 'SPL-01', productName: 'Roti Manis Cokelat', quantity: 3, reason: 'Gosong / Overbaked', date: 'Hari ini' }
    ]);

    // Interactive Service Job Order status tracker for Service & Job-Order
    const [serviceJobs, setServiceJobs] = useState<{ id: string; customerName: string; serviceName: string; weightOrDuration: string; totalPrice: number; status: 'Penerimaan' | 'Cuci/Proses' | 'Selesai' | 'Diambil'; date: string }[]>([
      { id: 'JOB-201', customerName: 'Budi Santoso', serviceName: 'Laundry Kiloan Premium', weightOrDuration: '4.5 kg', totalPrice: 45000, status: 'Cuci/Proses', date: 'Hari ini' },
      { id: 'JOB-202', customerName: 'Siti Aminah', serviceName: 'Reparasi Sepatu Kulit', weightOrDuration: '1 Jasa', totalPrice: 120000, status: 'Penerimaan', date: 'Hari ini' },
      { id: 'JOB-203', customerName: 'Joko Widodo', serviceName: 'Laundry Karpet Sutra', weightOrDuration: '10 meter', totalPrice: 150000, status: 'Selesai', date: 'Kemarin' }
    ]);

    // Interactive Appointments Schedule grid for Appointment & Commission
    const [appointments, setAppointments] = useState<{ id: string; staffName: string; customerName: string; serviceName: string; timeSlot: string; status: 'Booked' | 'Selesai' }[]>([
      { id: 'APT-301', staffName: 'Sari (Stylist)', customerName: 'Rini', serviceName: 'Potong Rambut Wanita + Hair Spa', timeSlot: '13:00 - 14:00', status: 'Booked' },
      { id: 'APT-302', staffName: 'Dani (Barber)', customerName: 'Agus', serviceName: 'Gentleman Haircut', timeSlot: '14:30 - 15:15', status: 'Booked' }
    ]);

    // Opening Session states
    const [startCashInput, setStartCashInput] = useState('150000');
    const [selectedStationId, setSelectedStationId] = useState('');

    // End session states
    const [isEndSessionModalOpen, setEndSessionModalOpen] = useState(false);
    const [countedCash, setCountedCash] = useState('');
    const [pin, setPin] = useState('');
    const [pinError, setPinError] = useState('');
    const [depositToAccountId, setDepositToAccountId] = useState('');
    const [summaryForReceipt, setSummaryForReceipt] = useState<any | null>(null);

    // Customizers / Modifiers modal
    const [customizingItem, setCustomizingItem] = useState<CartItemWithModifiers | null>(null);
    const [customSugar, setCustomSugar] = useState<'Normal' | 'Less' | 'No Sugar'>('Normal');
    const [customIce, setCustomIce] = useState<'Normal' | 'Less' | 'No Ice'>('Normal');
    const [customEspresso, setCustomEspresso] = useState(false);
    const [customBoba, setCustomBoba] = useState(false);
    const [customCakeWriting, setCustomCakeWriting] = useState('');
    const [customCandlesCount, setCustomCandlesCount] = useState(0);
    // New Service Customizer variables
    const [customServiceWeight, setCustomServiceWeight] = useState(1.0);
    const [customServiceDuration, setCustomServiceDuration] = useState(1.0);
    const [customServiceNotes, setCustomServiceNotes] = useState('');
    // New Appointment Staff Selection variables
    const [customAssignedStaffId, setCustomAssignedStaffId] = useState('');

    // Handler to start a session (Missing in original codebase, added for type safety)
    const handleStartSessionSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedStationId) {
            alert('Silakan pilih stasiun mesin kasir terlebih dahulu.');
            return;
        }
        const startCash = parseFloat(startCashInput) || 0;
        dispatch({
            type: 'pos/startSession',
            payload: {
                cashierStationId: selectedStationId,
                startCash
            }
        });
    };

    // Checkout & Dynamic Payment Modal states
    const [isCheckoutOpen, setCheckoutOpen] = useState(false);
    const [customerId, setCustomerId] = useState('');
    const [customerSearch, setCustomerSearch] = useState('');
    const [customerDropdownOpen, setCustomerDropdownOpen] = useState(false);
    const [paymentMethodId, setPaymentMethodId] = useState('pm1'); // cash as default
    const [amountPaid, setAmountPaid] = useState('');
    const [depositToUse, setDepositToUse] = useState('');

    useEffect(() => {
        if (state.paymentMethods && state.paymentMethods.length > 0) {
            const exists = state.paymentMethods.some(pm => pm.id === paymentMethodId);
            if (!exists) {
                setPaymentMethodId(state.paymentMethods[0].id);
            }
        }
    }, [state.paymentMethods, paymentMethodId]);
    const [edcRefNumber, setEdcRefNumber] = useState('');
    const [isQrisModalOpen, setIsQrisModalOpen] = useState(false);
    const [isSaleReceiptOpen, setSaleReceiptOpen] = useState(false);

    // Dedicated action modal states
    const [isProductInfoModalOpen, setProductInfoModalOpen] = useState(false);
    const [isAddCustomerModalOpen, setAddCustomerModalOpen] = useState(false);
    const [isCustomerBillModalOpen, setCustomerBillModalOpen] = useState(false);
    const [isTransactionHistoryModalOpen, setTransactionHistoryModalOpen] = useState(false);
    const [isPosReturnModalOpen, setPosReturnModalOpen] = useState(false);
    const [isCameraScannerOpen, setCameraScannerOpen] = useState(false);
    const [cameraError, setCameraError] = useState('');
    const videoRef = useRef<HTMLVideoElement | null>(null);
    const mediaStreamRef = useRef<MediaStream | null>(null);

    // Mobile specific navigation: 'cart' | 'payment' | 'menu' | 'tables'
    const [mobileTab, setMobileTab] = useState<'cart' | 'payment' | 'menu' | 'tables'>('cart');

    // Get current preset configuration
    const preset = useMemo(() => BUSINESS_PRESETS[activeBusinessMode], [activeBusinessMode]);

    // Product list strictly from ERP database (trial products removed completely)
    const combinedProducts = useMemo(() => {
      return (state.products || []).map(p => {
        const categoryObj = state.productCategories?.find(c => c.id === p.categoryId);
        const stockCount = state.inventoryLevels?.filter(inv => inv.productId === p.id).reduce((acc, curr) => acc + curr.quantity, 0) || 100;
        return {
          id: p.id,
          name: p.name,
          price: p.price,
          category: categoryObj ? categoryObj.name : 'Umum',
          stock: stockCount,
          isTaxable: p.isTaxable,
          barcode: p.barcode
        };
      });
    }, [state.products, state.productCategories, state.inventoryLevels]);

    // Reset categories whenever preset changes
    useEffect(() => {
      setSelectedCategory('Semua');
      setPosCart([]);
      setActiveTable(null);
    }, [activeBusinessMode]);

    // Available Cashier Stations list
    const availableCashierStations = useMemo(() => {
        if (!currentUser) return [];
        return state.cashierStations.filter(cs => cs.branchId === currentUser.branchId);
    }, [currentUser, state.cashierStations]);

    // Default cash in hand account setup
    const activeStation = useMemo(() => {
        if (!posSession) return null;
        return state.cashierStations.find(cs => cs.id === posSession.cashierStationId);
    }, [posSession, state.cashierStations]);

    const cashInHandAccountId = activeStation?.cashInHandAccountId || '1010';

    const cashAccounts = useMemo(() => {
        return accounts.filter(a => a.isCashAccount || a.id.startsWith('10'));
    }, [accounts]);

    useEffect(() => {
        if (availableCashierStations.length > 0 && !selectedStationId) {
            setSelectedStationId(availableCashierStations[0].id);
        }
    }, [availableCashierStations, selectedStationId]);

    // Receipt triggers — only open when a NEW transaction is generated during current session
    const prevTxIdRef = useRef<string | null>(lastTransaction?.id || null);
    useEffect(() => {
        if (lastTransaction && lastTransaction.id !== prevTxIdRef.current) {
            prevTxIdRef.current = lastTransaction.id;
            setSaleReceiptOpen(true);
        }
    }, [lastTransaction]);

    useEffect(() => {
        if (isEndSessionModalOpen && cashInHandAccountId) {
            setDepositToAccountId(cashInHandAccountId);
        }
    }, [isEndSessionModalOpen, cashInHandAccountId]);

    // Camera Scanner logic
    const stopCamera = () => {
      if (mediaStreamRef.current) {
        mediaStreamRef.current.getTracks().forEach(track => track.stop());
        mediaStreamRef.current = null;
      }
    };

    const startCamera = async () => {
      setCameraError('');
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'environment' }
        });
        mediaStreamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.play();
        }
      } catch (err: any) {
        setCameraError('Gagal mengakses kamera. Pastikan izin kamera telah diberikan.');
      }
    };

    useEffect(() => {
      if (isCameraScannerOpen) {
        startCamera();
      } else {
        stopCamera();
      }
      return () => stopCamera();
    }, [isCameraScannerOpen]);

    // Barcode detection loop using native BarcodeDetector API if supported
    useEffect(() => {
      let interval: any;
      if (isCameraScannerOpen && 'BarcodeDetector' in window) {
        const barcodeDetector = new (window as any).BarcodeDetector({
          formats: ['qr_code', 'ean_13', 'ean_8', 'code_128', 'code_39', 'upc_a', 'upc_e']
        });
        interval = setInterval(async () => {
          if (videoRef.current && videoRef.current.readyState === 4) {
            try {
              const barcodes = await barcodeDetector.detect(videoRef.current);
              if (barcodes.length > 0) {
                const scannedCode = barcodes[0].rawValue;
                const foundProduct = combinedProducts.find(
                  p => p.id.toLowerCase() === scannedCode.toLowerCase() || p.barcode?.toLowerCase() === scannedCode.toLowerCase()
                );
                if (foundProduct) {
                  addToCart(foundProduct);
                  setBarcodeSuccessMsg(`Beep! Added: ${foundProduct.name}`);
                  setTimeout(() => setBarcodeSuccessMsg(''), 2000);
                  setCameraScannerOpen(false);
                }
              }
            } catch (e) {
              // detection frame error, ignore
            }
          }
        }, 500);
      }
      return () => {
        if (interval) clearInterval(interval);
      };
    }, [isCameraScannerOpen, combinedProducts]);

    // Handle barcode simulation (Retail preset)
    const handleBarcodeSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      if (!barcodeInput.trim()) return;
      
      const foundProduct = combinedProducts.find(p => p.id.toLowerCase() === barcodeInput.toLowerCase() || p.name.toLowerCase().includes(barcodeInput.toLowerCase()));
      if (foundProduct) {
        // Add to cart
        addToCart(foundProduct);
        setBarcodeSuccessMsg(`Beep! Added: ${foundProduct.name}`);
        setTimeout(() => setBarcodeSuccessMsg(''), 2000);
      } else {
        alert(`Produk dengan kode "${barcodeInput}" tidak ditemukan.`);
      }
      setBarcodeInput('');
    };

    // Table Management for Cafe
    const handleTableSelect = (tableNum: number) => {
      // Save current cart as order for the previously active table if we were on one
      if (activeTable !== null) {
        setTableOrders(prev => {
          const filtered = prev.filter(o => o.tableNumber !== activeTable);
          if (posCart.length > 0) {
            return [...filtered, { tableNumber: activeTable, items: posCart, customerId }];
          }
          return filtered;
        });
      }

      setActiveTable(tableNum);
      const existingOrder = tableOrders.find(o => o.tableNumber === tableNum);
      if (existingOrder) {
        setPosCart(existingOrder.items);
        setCustomerId(existingOrder.customerId);
      } else {
        setPosCart([]);
        setCustomerId('');
      }
      setMobileTab('menu');
    };

    const getTableStatus = (tableNum: number) => {
      const order = tableOrders.find(o => o.tableNumber === tableNum);
      if (activeTable === tableNum) return 'active';
      return order ? 'occupied' : 'available';
    };

    const getTableBillAmount = (tableNum: number) => {
      const order = tableOrders.find(o => o.tableNumber === tableNum);
      if (!order) return 0;
      return order.items.reduce((sum, item) => {
        const itemPrice = getItemFinalPrice(item);
        return sum + (itemPrice * item.quantity);
      }, 0);
    };

    // Calculate item price including customizer upcharges, service factors, and wholesale discounts
    const getItemFinalPrice = (item: CartItemWithModifiers) => {
      let price = item.product.price;
      
      // Cafe & QSR upcharges
      if ((activeBusinessMode === 'qsr' || activeBusinessMode === 'fsr') && item.product.isCustomizable) {
        if (item.extraEspresso) price += 5000;
        if (item.extraBoba) price += 4000;
      }

      // Retail wholesale pricing
      if (activeBusinessMode === 'retail' && item.product.wholesalePrice && item.product.wholesaleMinQty) {
        if (item.quantity >= item.product.wholesaleMinQty) {
          price = item.product.wholesalePrice;
        }
      }

      // Service Job Pricing: Unit Price * Weight (kg) or Duration (hours)
      if (activeBusinessMode === 'service_job') {
        const factor = item.serviceWeight || item.serviceDuration || 1;
        price = price * factor;
      }

      return price;
    };

    const getItemOriginalPrice = (item: CartItemWithModifiers) => {
      let price = item.product.price;
      if ((activeBusinessMode === 'qsr' || activeBusinessMode === 'fsr') && item.product.isCustomizable) {
        if (item.extraEspresso) price += 5000;
        if (item.extraBoba) price += 4000;
      }
      if (activeBusinessMode === 'service_job') {
        const factor = item.serviceWeight || item.serviceDuration || 1;
        price = price * factor;
      }
      return price;
    };

    // Cart operations
    const addToCart = (product: ProductPreset) => {
      setPosCart(prev => {
        const existingIndex = prev.findIndex(item => item.product.id === product.id);
        if (existingIndex > -1 && !product.isCustomizable && activeBusinessMode !== 'service_job' && activeBusinessMode !== 'appointment_commission') {
          // Normal duplicate - increment qty
          const updated = [...prev];
          updated[existingIndex].quantity += 1;
          return updated;
        } else {
          // Create new unique cart item
          const newCartItem: CartItemWithModifiers = {
            id: `${product.id}-${Date.now()}-${Math.random()}`,
            product,
            quantity: 1,
            sugarLevel: product.category === 'Kopi' || product.category === 'Non-Kopi' || product.category === 'Minuman' ? 'Normal' : undefined,
            iceLevel: product.category === 'Kopi' || product.category === 'Non-Kopi' || product.category === 'Minuman' ? 'Normal' : undefined,
            extraEspresso: false,
            extraBoba: false,
            cakeWriting: product.category === 'Kue Ulang Tahun' || product.category === 'Kue Kering' ? '' : undefined,
            candlesCount: product.category === 'Kue Ulang Tahun' || product.category === 'Kue Kering' ? 0 : undefined,
            // Defaults for service jobs
            serviceWeight: activeBusinessMode === 'service_job' ? 1.0 : undefined,
            serviceDuration: activeBusinessMode === 'service_job' ? 1.0 : undefined,
            serviceNotes: activeBusinessMode === 'service_job' ? '' : undefined,
            // Defaults for appointment & commission
            assignedStaffId: activeBusinessMode === 'appointment_commission' ? '' : undefined,
            assignedStaffName: activeBusinessMode === 'appointment_commission' ? 'Belum ditugaskan' : undefined
          };
          return [...prev, newCartItem];
        }
      });
    };

    const updateQuantity = (itemId: string, increment: boolean) => {
      setPosCart(prev => {
        return prev.map(item => {
          if (item.id === itemId) {
            const newQty = increment ? item.quantity + 1 : item.quantity - 1;
            return newQty > 0 ? { ...item, quantity: newQty } : item;
          }
          return item;
        }).filter(item => item.quantity > 0);
      });
    };

    const removeItem = (itemId: string) => {
      setPosCart(prev => prev.filter(item => item.id !== itemId));
    };

    // Open modifier customizer
    const openCustomizer = (item: CartItemWithModifiers) => {
      setCustomizingItem(item);
      setCustomSugar(item.sugarLevel || 'Normal');
      setCustomIce(item.iceLevel || 'Normal');
      setCustomEspresso(item.extraEspresso || false);
      setCustomBoba(item.extraBoba || false);
      setCustomCakeWriting(item.cakeWriting || '');
      setCustomCandlesCount(item.candlesCount || 0);
      setCustomServiceWeight(item.serviceWeight || 1.0);
      setCustomServiceDuration(item.serviceDuration || 1.0);
      setCustomServiceNotes(item.serviceNotes || '');
      setCustomAssignedStaffId(item.assignedStaffId || '');
    };

    const saveCustomizer = () => {
      if (!customizingItem) return;
      setPosCart(prev => {
        return prev.map(item => {
          if (item.id === customizingItem.id) {
            return {
              ...item,
              sugarLevel: customSugar,
              iceLevel: customIce,
              extraEspresso: customEspresso,
              extraBoba: customBoba,
              cakeWriting: customCakeWriting,
              candlesCount: customCandlesCount,
              serviceWeight: customServiceWeight,
              serviceDuration: customServiceDuration,
              serviceNotes: customServiceNotes,
              assignedStaffId: customAssignedStaffId,
              assignedStaffName: staff.find(s => s.id === customAssignedStaffId)?.name || 'Belum ditugaskan'
            };
          }
          return item;
        });
      });
      setCustomizingItem(null);
    };

    // Calculations
    const cartTotals = useMemo(() => {
      let subtotal = 0;
      let wholesaleDiscounts = 0;

      posCart.forEach(item => {
        const originalPrice = getItemOriginalPrice(item);
        const finalPrice = getItemFinalPrice(item);
        
        subtotal += originalPrice * item.quantity;
        if (finalPrice < originalPrice) {
          wholesaleDiscounts += (originalPrice - finalPrice) * item.quantity;
        }
      });

      const taxRate = 0;
      const taxableAmount = subtotal - wholesaleDiscounts;
      const taxAmount = 0;
      const grandTotal = taxableAmount;

      return {
        subtotal,
        discount: wholesaleDiscounts,
        taxAmount: 0,
        grandTotal
      };
    }, [posCart, activeBusinessMode]);

    // Customers filtering
    const selectedCustomerObj = useMemo(() => {
      return state.customers.find(c => c.id === customerId);
    }, [customerId, state.customers]);

    const maxDepositToUse = useMemo(() => {
      if (!selectedCustomerObj) return 0;
      return Math.min(selectedCustomerObj.depositBalance, cartTotals.grandTotal);
    }, [selectedCustomerObj, cartTotals.grandTotal]);

    const safeDepositToUse = useMemo(() => {
      const parsed = parseFloat(depositToUse) || 0;
      return Math.min(parsed, maxDepositToUse);
    }, [depositToUse, maxDepositToUse]);

    // Handle final payment
    const handleCheckout = () => {
        const finalAmountPaid = paymentMethodId === 'pm1' ? parseFloat(amountPaid) || 0 : cartTotals.grandTotal;
        if(paymentMethodId === 'pm1' && finalAmountPaid < cartTotals.grandTotal) {
            alert("Jumlah pembayaran kurang dari total tagihan.");
            return;
        }

        // Map local modifiers-enabled items to standard reducer format
        const saleItems = posCart.map(item => {
          // Construct name with modifiers for accounting reference
          let nameWithModifiers = item.product.name;
          const modifiers: string[] = [];
          if (item.sugarLevel && item.sugarLevel !== 'Normal') modifiers.push(item.sugarLevel);
          if (item.iceLevel && item.iceLevel !== 'Normal') modifiers.push(item.iceLevel);
          if (item.extraEspresso) modifiers.push('+Espresso');
          if (item.extraBoba) modifiers.push('+Boba');
          if (item.cakeWriting) modifiers.push(`"${item.cakeWriting}"`);
          if (item.candlesCount && item.candlesCount > 0) modifiers.push(`${item.candlesCount} Lilin`);
          if (item.serviceWeight && item.serviceWeight !== 1) modifiers.push(`${item.serviceWeight}kg`);
          if (item.serviceDuration && item.serviceDuration !== 1) modifiers.push(`${item.serviceDuration}jam`);
          if (item.assignedStaffName && item.assignedStaffId) modifiers.push(`Staf: ${item.assignedStaffName}`);

          if (modifiers.length > 0) {
            nameWithModifiers = `${item.product.name} (${modifiers.join(', ')})`;
          }

          const unitPrice = getItemFinalPrice(item);
          return {
            productId: item.product.id,
            productName: nameWithModifiers,
            quantity: item.quantity,
            price: unitPrice,
            cost: Math.round(unitPrice * 0.45), // assume 45% standard cost of goods sold for MSMEs
            discount: (getItemOriginalPrice(item) - unitPrice) * item.quantity
          };
        });

        // Dispatch transaction
        dispatch({
            type: 'pos/processSale',
            payload: { 
              customerId: customerId || undefined, 
              paymentMethodId, 
              voucherCode: '', 
              amountPaid: finalAmountPaid, 
              change: paymentMethodId === 'pm1' ? finalAmountPaid - cartTotals.grandTotal : 0, 
              pointsToUse: 0, 
              depositToUse: safeDepositToUse,
              items: saleItems,
              subtotal: cartTotals.subtotal,
              discount: cartTotals.discount + safeDepositToUse,
              taxAmount: cartTotals.taxAmount,
              grandTotal: cartTotals.grandTotal - safeDepositToUse,
              posSessionId: posSession?.id
            }
        });

        // --- Multi-Mode Interactive Operations Hook ---
        // 1. QSR & FSR KDS Order Queueing
        if (activeBusinessMode === 'qsr' || activeBusinessMode === 'fsr') {
          const kdsItems = posCart.map(item => {
            const mods: string[] = [];
            if (item.sugarLevel && item.sugarLevel !== 'Normal') mods.push(item.sugarLevel);
            if (item.iceLevel && item.iceLevel !== 'Normal') mods.push(item.iceLevel);
            if (item.extraEspresso) mods.push('+Espresso');
            if (item.extraBoba) mods.push('+Boba');
            return {
              name: item.product.name,
              quantity: item.quantity,
              modifiers: mods.join(', ') || undefined
            };
          });
          setKdsOrders(prev => [
            ...prev,
            {
              id: `KDS-${100 + prev.length + 1}`,
              tableName: activeTable !== null ? `Meja ${activeTable}` : 'Takeaway',
              items: kdsItems,
              time: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }),
              status: 'Antri'
            }
          ]);
        }

        // 2. Service & Job Order Status Log
        if (activeBusinessMode === 'service_job') {
          posCart.forEach(item => {
            const weightText = item.serviceWeight && item.serviceWeight > 1 
              ? `${item.serviceWeight} kg` 
              : item.serviceDuration && item.serviceDuration > 1 
              ? `${item.serviceDuration} jam` 
              : '1 Unit';
            
            setServiceJobs(prev => [
              ...prev,
              {
                id: `JOB-${200 + prev.length + 1}`,
                customerName: selectedCustomerObj ? selectedCustomerObj.name : 'Pelanggan Umum',
                serviceName: item.product.name,
                weightOrDuration: weightText,
                totalPrice: getItemFinalPrice(item) * item.quantity,
                status: 'Penerimaan',
                date: 'Hari ini'
              }
            ]);
          });
        }

        // 3. Appointment & Barber Scheduling
        if (activeBusinessMode === 'appointment_commission') {
          posCart.forEach(item => {
            if (item.assignedStaffId) {
              setAppointments(prev => [
                ...prev,
                {
                  id: `APT-${300 + prev.length + 1}`,
                  staffName: item.assignedStaffName || 'Stylist',
                  customerName: selectedCustomerObj ? selectedCustomerObj.name : 'Pelanggan Umum',
                  serviceName: item.product.name,
                  timeSlot: `${new Date().getHours()}:00 - ${new Date().getHours() + 1}:00`,
                  status: 'Booked'
                }
              ]);
            }
          });
        }

        // Clear active visual table draft if checking out a table
        if (activeTable !== null) {
          setTableOrders(prev => prev.filter(o => o.tableNumber !== activeTable));
          setActiveTable(null);
        }

        // Clear local cart and close
        setPosCart([]);
        setCustomerId('');
        setAmountPaid('');
        setDepositToUse('');
        setCheckoutOpen(false);
    };

    // Closing cashier sessions
    const handleEndSessionAttempt = () => {
        setPinError('');
        if (!pin) {
            setPinError('Masukkan PIN Anda.');
            return;
        }
        if (pin !== (currentUser?.pin || '123456')) {
            setPinError('PIN salah.');
            return;
        }

        const counted = parseFloat(countedCash) || 0;
        
        // Calculate system expected cash
        const activeSales = sales.filter(s => s.posSessionId === posSession?.id);
        const cashPaymentMethodIds = state.paymentMethods.filter(pm => pm.type === 'cash').map(pm => pm.id);
        
        let calculatedExpectedCash = posSession?.startCash || 0;
        const calculatedPaymentBreakdown: Record<string, number> = {};
        
        // Populate breakdown
        state.paymentMethods.forEach(pm => {
            calculatedPaymentBreakdown[pm.name] = 0;
        });

        activeSales.forEach(s => {
            s.payments.forEach(p => {
                const pm = state.paymentMethods.find(m => m.id === p.paymentMethodId);
                if (pm) {
                    calculatedPaymentBreakdown[pm.name] = (calculatedPaymentBreakdown[pm.name] || 0) + p.amount;
                    if (cashPaymentMethodIds.includes(pm.id)) {
                        calculatedExpectedCash += p.amount;
                    }
                }
            });
        });
        
        // Include manual deposits or withdrawals (excluding automatic sales journal entries)
        const sessionJournalEntries = journalEntries.filter(je => je.posSessionId === posSession?.id && !je.reference?.startsWith('Penjualan'));
        sessionJournalEntries.forEach(je => {
             je.lines.forEach(l => {
                 if (l.accountId === cashInHandAccountId) {
                     if (l.type === 'debit') calculatedExpectedCash += l.amount;
                     else calculatedExpectedCash -= l.amount;
                 }
             });
        });

        // If user chose a different deposit/transfer wallet, transfer the counted cash immediately!
        if (counted > 0 && depositToAccountId && depositToAccountId !== cashInHandAccountId) {
            dispatch({
                type: 'finance/addJournalEntry',
                payload: {
                    description: `Penyetoran Kas Sesi ${posSession?.id} ke ${accounts.find(a => a.id === depositToAccountId)?.name || depositToAccountId}`,
                    lines: [
                        { accountId: cashInHandAccountId, type: 'credit', amount: counted },
                        { accountId: depositToAccountId, type: 'debit', amount: counted },
                    ],
                    reference: `Setoran Kas POS Sesi ${posSession?.id}`,
                    posSessionId: posSession?.id
                }
            });
        }

        const summary: Omit<PosSessionSummary, 'id' | 'status' | 'date' | 'cashierId' | 'verifiedBy' | 'verifiedDate' | 'depositToAccountId'> & { depositToAccountId?: string } = {
            sessionId: posSession?.id || 'sess-0', 
            branchId: posSession?.branchId || 'b1', 
            cashierStationId: posSession?.cashierStationId || 'station-1', 
            cashierName: currentUser?.name || 'Kasir', 
            expectedCash: calculatedExpectedCash, 
            countedCash: counted, 
            variance: counted - calculatedExpectedCash, 
            paymentBreakdown: calculatedPaymentBreakdown, 
            depositToAccountId: depositToAccountId
        };

        setSummaryForReceipt(summary);
        setEndSessionModalOpen(false);
        setPin('');
        setCountedCash('');
    };

    const finalizeEndSession = () => {
        if (summaryForReceipt) {
          dispatch({ type: 'pos/endSession', payload: { summary: summaryForReceipt } });
        }
        setSummaryForReceipt(null);
    };



    // Filtering products for grid display
    const filteredProducts = useMemo(() => {
      return combinedProducts.filter(p => {
        const matchesCat = selectedCategory === 'Semua' || p.category === selectedCategory;
        const matchesQuery = p.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                             p.id.toLowerCase().includes(searchQuery.toLowerCase());
        return matchesCat && matchesQuery;
      });
    }, [combinedProducts, selectedCategory, searchQuery]);

    // Handle Opening session first
    if (!posSession) {
        return (
            <div className="min-h-screen bg-stone-100 dark:bg-zinc-950 flex flex-col justify-center items-center p-6">
                <Card className="w-full max-w-md p-8 border border-zinc-200/80 dark:border-zinc-800 shadow-2xl bg-white dark:bg-zinc-900 rounded-3xl relative overflow-hidden">
                    <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-amber-500 via-emerald-500 to-blue-500"></div>
                    <div className="text-center mb-8">
                        <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 mb-4 shadow-inner">
                            <POSIcon className="w-8 h-8" />
                        </div>
                        <h1 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100">Buka Sesi Kasir Baru</h1>
                        <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-2">Masukan modal awal laci kasir untuk mulai berjualan hari ini</p>
                    </div>

                    <form onSubmit={handleStartSessionSubmit} className="space-y-6">
                        <div>
                            <Label htmlFor="cashierStation" className="text-xs font-semibold uppercase tracking-wider text-zinc-500 mb-1.5 block">Stasiun Mesin Kasir</Label>
                            <Select 
                              id="cashierStation" 
                              value={selectedStationId} 
                              onChange={e => setSelectedStationId(e.target.value)}
                              className="w-full h-11 border-zinc-200 dark:border-zinc-800 rounded-xl"
                            >
                                {availableCashierStations.map(station => (
                                    <option key={station.id} value={station.id}>{station.name}</option>
                                ))}
                            </Select>
                        </div>

                        <div>
                            <Label htmlFor="startCash" className="text-xs font-semibold uppercase tracking-wider text-zinc-500 mb-1.5 block">Modal Kas Awal (Rupiah)</Label>
                            <div className="relative">
                              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400 font-semibold text-sm">Rp</span>
                              <Input 
                                id="startCash" 
                                type="number" 
                                value={startCashInput} 
                                onChange={e => setStartCashInput(e.target.value)} 
                                className="pl-10 h-11 border-zinc-200 dark:border-zinc-800 rounded-xl font-semibold"
                                placeholder="0" 
                                required 
                              />
                            </div>
                        </div>

                        <div className="pt-2">
                          <Button type="submit" className="w-full h-12 text-sm font-semibold rounded-xl bg-zinc-900 hover:bg-zinc-850 text-white dark:bg-zinc-100 dark:hover:bg-zinc-200 dark:text-zinc-900 shadow-md">
                              Buka Sesi Penjualan
                          </Button>
                        </div>
                    </form>
                </Card>
            </div>
        );
    }

    return (
        <div className={`fixed inset-0 ${preset.themeClasses.bg} text-zinc-900 dark:text-zinc-100 flex flex-col font-sans transition-colors duration-300 overflow-hidden`}>
            
            <header className="sticky top-0 z-40 bg-white dark:bg-zinc-900 border-b border-zinc-200/80 dark:border-zinc-800 px-4 py-2.5 sm:px-6 shadow-xs">
              <div className="w-full flex items-center justify-between gap-3">

                {/* LEFT — Logo + Store Info */}
                <div className="flex items-center gap-3 shrink-0">
                  <img src="/logoposnesia.png" alt="PosNesia" className="h-7 sm:h-8 w-auto object-contain" />
                  <div className="hidden md:flex flex-col">
                    <span className="font-extrabold text-sm text-zinc-900 dark:text-zinc-100 leading-tight">{companyInfo.name}</span>
                    <span className="text-[10px] font-medium text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                      {currentUser?.name} · {posSession.id}
                    </span>
                  </div>
                </div>

                {/* CENTER — Quick Actions, desktop only (mobile has sub-bar below) */}
                <div className="hidden md:flex items-center gap-2">
                  <button type="button" onClick={() => setProductInfoModalOpen(true)}
                    className="flex items-center gap-2 px-2.5 py-1.5 rounded-xl bg-blue-50 dark:bg-blue-950/40 hover:bg-blue-100 text-blue-700 dark:text-blue-300 font-semibold text-xs border border-blue-200/70 dark:border-blue-800/40 transition-all active:scale-95 shrink-0"
                    title="Cek Informasi & Stok Produk">
                    <div className="w-6 h-6 rounded-lg bg-blue-500 text-white flex items-center justify-center shrink-0"><Search className="w-3.5 h-3.5" /></div>
                    <span className="hidden lg:inline">Cek Produk</span>
                  </button>
                  <button type="button" onClick={() => setAddCustomerModalOpen(true)}
                    className="flex items-center gap-2 px-2.5 py-1.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 hover:bg-emerald-100 text-emerald-700 dark:text-emerald-300 font-semibold text-xs border border-emerald-200/70 dark:border-emerald-800/40 transition-all active:scale-95 shrink-0"
                    title="Tambah Pelanggan Baru">
                    <div className="w-6 h-6 rounded-lg bg-emerald-500 text-white flex items-center justify-center shrink-0"><UserPlus className="w-3.5 h-3.5" /></div>
                    <span className="hidden lg:inline">+ Pelanggan</span>
                  </button>
                  <button type="button" onClick={() => setCustomerBillModalOpen(true)}
                    className="flex items-center gap-2 px-2.5 py-1.5 rounded-xl bg-purple-50 dark:bg-purple-950/40 hover:bg-purple-100 text-purple-700 dark:text-purple-300 font-semibold text-xs border border-purple-200/70 dark:border-purple-800/40 transition-all active:scale-95 shrink-0"
                    title="Bayar Tagihan Customer">
                    <div className="w-6 h-6 rounded-lg bg-purple-500 text-white flex items-center justify-center shrink-0"><FileText className="w-3.5 h-3.5" /></div>
                    <span className="hidden lg:inline">Bayar Tagihan</span>
                  </button>
                  <button type="button" onClick={() => setCameraScannerOpen(true)}
                    className="flex items-center gap-2 px-2.5 py-1.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 hover:bg-rose-100 text-rose-700 dark:text-rose-300 font-semibold text-xs border border-rose-200/70 dark:border-rose-800/40 transition-all active:scale-95 shrink-0"
                    title="Scan Barcode Pakai Kamera HP">
                    <div className="w-6 h-6 rounded-lg bg-rose-500 text-white flex items-center justify-center shrink-0"><Camera className="w-3.5 h-3.5" /></div>
                    <span className="hidden lg:inline">Scan Kamera</span>
                  </button>
                  <button type="button" onClick={() => setTransactionHistoryModalOpen(true)}
                    className="flex items-center gap-2 px-2.5 py-1.5 rounded-xl bg-amber-50 dark:bg-amber-950/40 hover:bg-amber-100 text-amber-700 dark:text-amber-300 font-semibold text-xs border border-amber-200/70 dark:border-amber-800/40 transition-all active:scale-95 shrink-0"
                    title="Cek Riwayat Transaksi">
                    <div className="w-6 h-6 rounded-lg bg-amber-500 text-white flex items-center justify-center shrink-0"><Clock className="w-3.5 h-3.5" /></div>
                    <span className="hidden lg:inline">Riwayat</span>
                  </button>
                  <button type="button" onClick={() => setPosReturnModalOpen(true)}
                    className="flex items-center gap-2 px-2.5 py-1.5 rounded-xl bg-orange-50 dark:bg-orange-950/40 hover:bg-orange-100 text-orange-700 dark:text-orange-300 font-semibold text-xs border border-orange-200/70 dark:border-orange-800/40 transition-all active:scale-95 shrink-0"
                    title="Retur Penjualan Kasir">
                    <div className="w-6 h-6 rounded-lg bg-orange-500 text-white flex items-center justify-center shrink-0"><RotateCcw className="w-3.5 h-3.5" /></div>
                    <span className="hidden lg:inline">Retur Penjualan</span>
                  </button>
                </div>

                {/* RIGHT — System Controls */}
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={() => dispatch({ type: 'pos/toggleMode', payload: { start: false } })}
                    className="w-9 h-9 sm:w-auto sm:px-3 sm:py-1.5 rounded-xl bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-200 font-semibold text-xs flex items-center justify-center gap-1.5 transition-all active:scale-95"
                    title="Kembali ke Dashboard ERP"
                  >
                    <DashboardIcon className="w-4 h-4 text-zinc-500" />
                    <span className="hidden lg:inline">Dashboard ERP</span>
                  </button>

                  <button
                    onClick={() => setEndSessionModalOpen(true)}
                    className="w-9 h-9 sm:w-auto sm:px-3 sm:py-1.5 rounded-xl bg-red-500 hover:bg-red-600 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-all shadow-sm active:scale-95"
                    title="Akhiri Sesi Kasir"
                  >
                    <LogoutIcon className="w-4 h-4" />
                    <span className="hidden lg:inline">Akhiri Sesi</span>
                  </button>
                </div>

              </div>
            </header>

            {/* Quick Actions sub-bar — below header, mobile only */}
            <div className="md:hidden sticky top-[52px] z-30 bg-white dark:bg-zinc-900 border-b border-zinc-200/80 dark:border-zinc-800 px-3 py-2 flex items-center gap-2 overflow-x-auto no-scrollbar shadow-xs">
              <button type="button" onClick={() => setProductInfoModalOpen(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-50 dark:bg-blue-950/40 hover:bg-blue-100 text-blue-700 dark:text-blue-300 font-semibold text-xs border border-blue-200/70 dark:border-blue-800/40 transition-all active:scale-95 shrink-0">
                <div className="w-6 h-6 rounded-lg bg-blue-500 text-white flex items-center justify-center shrink-0"><Search className="w-3.5 h-3.5" /></div>
                <span className="hidden sm:inline">Cek Produk</span>
              </button>
              <button type="button" onClick={() => setAddCustomerModalOpen(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 hover:bg-emerald-100 text-emerald-700 dark:text-emerald-300 font-semibold text-xs border border-emerald-200/70 dark:border-emerald-800/40 transition-all active:scale-95 shrink-0">
                <div className="w-6 h-6 rounded-lg bg-emerald-500 text-white flex items-center justify-center shrink-0"><UserPlus className="w-3.5 h-3.5" /></div>
                <span className="hidden sm:inline">+ Pelanggan</span>
              </button>
              <button type="button" onClick={() => setPosReturnModalOpen(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-orange-50 dark:bg-orange-950/40 hover:bg-orange-100 text-orange-700 dark:text-orange-300 font-semibold text-xs border border-orange-200/70 dark:border-orange-800/40 transition-all active:scale-95 shrink-0">
                <div className="w-6 h-6 rounded-lg bg-orange-500 text-white flex items-center justify-center shrink-0"><RotateCcw className="w-3.5 h-3.5" /></div>
                <span className="hidden sm:inline">Retur Penjualan</span>
              </button>
              <button type="button" onClick={() => setCustomerBillModalOpen(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-purple-50 dark:bg-purple-950/40 hover:bg-purple-100 text-purple-700 dark:text-purple-300 font-semibold text-xs border border-purple-200/70 dark:border-purple-800/40 transition-all active:scale-95 shrink-0">
                <div className="w-6 h-6 rounded-lg bg-purple-500 text-white flex items-center justify-center shrink-0"><FileText className="w-3.5 h-3.5" /></div>
                <span className="hidden sm:inline">Bayar Tagihan</span>
              </button>
              <button type="button" onClick={() => setCameraScannerOpen(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 hover:bg-rose-100 text-rose-700 dark:text-rose-300 font-semibold text-xs border border-rose-200/70 dark:border-rose-800/40 transition-all active:scale-95 shrink-0">
                <div className="w-6 h-6 rounded-lg bg-rose-500 text-white flex items-center justify-center shrink-0"><Camera className="w-3.5 h-3.5" /></div>
                <span className="hidden sm:inline">Scan Kamera</span>
              </button>
              <button type="button" onClick={() => setTransactionHistoryModalOpen(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-50 dark:bg-amber-950/40 hover:bg-amber-100 text-amber-700 dark:text-amber-300 font-semibold text-xs border border-amber-200/70 dark:border-amber-800/40 transition-all active:scale-95 shrink-0">
                <div className="w-6 h-6 rounded-lg bg-amber-500 text-white flex items-center justify-center shrink-0"><Clock className="w-3.5 h-3.5" /></div>
                <span className="hidden sm:inline">Riwayat</span>
              </button>
            </div>

            {/* --- Core Responsive Full Width Body with Left Menubar --- */}
            <main className="flex-1 w-full overflow-hidden p-2 sm:p-4 pb-20 sm:pb-4 flex gap-3">
              
              {/* DESKTOP LEFT SIDEBAR MENUBAR */}
              <aside className="hidden lg:flex flex-col w-48 shrink-0 bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800 rounded-2xl p-3 shadow-xs justify-between gap-4">
                <div className="space-y-3">
                  <div className="px-2 py-1 border-b border-zinc-100 dark:border-zinc-800">
                    <p className="text-[10px] font-black uppercase tracking-wider text-zinc-400">Navigasi POS</p>
                  </div>
                  
                  <nav className="space-y-1.5">
                    <button
                      type="button"
                      onClick={() => setProductInfoModalOpen(true)}
                      className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl bg-blue-50/70 dark:bg-blue-950/40 hover:bg-blue-100 dark:hover:bg-blue-900/60 text-blue-700 dark:text-blue-300 font-bold text-xs border border-blue-200/60 dark:border-blue-800/40 transition-all active:scale-95 text-left group shadow-2xs"
                    >
                      <div className="w-7 h-7 rounded-lg bg-blue-500 text-white flex items-center justify-center shrink-0 shadow-2xs group-hover:scale-105 transition-transform">
                        <Search className="w-4 h-4" />
                      </div>
                      <span className="truncate">Cek Produk</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setAddCustomerModalOpen(true)}
                      className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl bg-emerald-50/70 dark:bg-emerald-950/40 hover:bg-emerald-100 dark:hover:bg-emerald-900/60 text-emerald-700 dark:text-emerald-300 font-bold text-xs border border-emerald-200/60 dark:border-emerald-800/40 transition-all active:scale-95 text-left group shadow-2xs"
                    >
                      <div className="w-7 h-7 rounded-lg bg-emerald-500 text-white flex items-center justify-center shrink-0 shadow-2xs group-hover:scale-105 transition-transform">
                        <UserPlus className="w-4 h-4" />
                      </div>
                      <span className="truncate">+ Pelanggan</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setCustomerBillModalOpen(true)}
                      className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl bg-purple-50/70 dark:bg-purple-950/40 hover:bg-purple-100 dark:hover:bg-purple-900/60 text-purple-700 dark:text-purple-300 font-bold text-xs border border-purple-200/60 dark:border-purple-800/40 transition-all active:scale-95 text-left group shadow-2xs"
                    >
                      <div className="w-7 h-7 rounded-lg bg-purple-500 text-white flex items-center justify-center shrink-0 shadow-2xs group-hover:scale-105 transition-transform">
                        <FileText className="w-4 h-4" />
                      </div>
                      <span className="truncate">Bayar Tagihan</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setCameraScannerOpen(true)}
                      className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl bg-rose-50/70 dark:bg-rose-950/40 hover:bg-rose-100 dark:hover:bg-rose-900/60 text-rose-700 dark:text-rose-300 font-bold text-xs border border-rose-200/60 dark:border-rose-800/40 transition-all active:scale-95 text-left group shadow-2xs"
                    >
                      <div className="w-7 h-7 rounded-lg bg-rose-500 text-white flex items-center justify-center shrink-0 shadow-2xs group-hover:scale-105 transition-transform">
                        <Camera className="w-4 h-4" />
                      </div>
                      <span className="truncate">Scan Kamera</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setTransactionHistoryModalOpen(true)}
                      className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl bg-amber-50/70 dark:bg-amber-950/40 hover:bg-amber-100 dark:hover:bg-amber-900/60 text-amber-700 dark:text-amber-300 font-bold text-xs border border-amber-200/60 dark:border-amber-800/40 transition-all active:scale-95 text-left group shadow-2xs"
                    >
                      <div className="w-7 h-7 rounded-lg bg-amber-500 text-white flex items-center justify-center shrink-0 shadow-2xs group-hover:scale-105 transition-transform">
                        <Clock className="w-4 h-4" />
                      </div>
                      <span className="truncate">Riwayat POS</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setPosReturnModalOpen(true)}
                      className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl bg-orange-50/70 dark:bg-orange-950/40 hover:bg-orange-100 dark:hover:bg-orange-900/60 text-orange-700 dark:text-orange-300 font-bold text-xs border border-orange-200/60 dark:border-orange-800/40 transition-all active:scale-95 text-left group shadow-2xs"
                    >
                      <div className="w-7 h-7 rounded-lg bg-orange-500 text-white flex items-center justify-center shrink-0 shadow-2xs group-hover:scale-105 transition-transform">
                        <RotateCcw className="w-4 h-4" />
                      </div>
                      <span className="truncate">Retur Penjualan</span>
                    </button>
                  </nav>
                </div>

                {/* Bottom Quick Controls */}
                <div className="space-y-1.5 pt-2 border-t border-zinc-100 dark:border-zinc-800">
                  <button
                    onClick={() => dispatch({ type: 'pos/toggleMode', payload: { start: false } })}
                    className="w-full flex items-center gap-2 px-3 py-2 rounded-xl bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-200 font-bold text-xs transition-all active:scale-95"
                  >
                    <DashboardIcon className="w-4 h-4 text-zinc-500" />
                    <span>Dashboard ERP</span>
                  </button>

                  <button
                    onClick={() => setEndSessionModalOpen(true)}
                    className="w-full flex items-center gap-2 px-3 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs transition-all shadow-xs active:scale-95"
                  >
                    <LogoutIcon className="w-4 h-4" />
                    <span>Akhiri Sesi</span>
                  </button>
                </div>
              </aside>

              {/* Main POS Container */}
              <div className="h-full flex-1 flex gap-3 min-w-0">

                {/* ── LEFT 2/3 — Cart Items ── */}
                <div className="flex-[2] min-w-0 flex flex-col bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800 rounded-2xl overflow-hidden shadow-xs">
                  
                  {/* Left Header Bar (1 Row) */}
                  <div className="flex items-center justify-between px-4 py-2.5 border-b border-zinc-100 dark:border-zinc-800 gap-3 shrink-0 bg-zinc-50/50 dark:bg-zinc-900/50">
                    <div className="flex items-center gap-2 shrink-0">
                      <div className="w-7 h-7 rounded-lg bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 flex items-center justify-center font-bold shadow-xs shrink-0">
                        <ShoppingCart className="w-3.5 h-3.5" />
                      </div>
                      <h2 className="font-extrabold text-xs sm:text-sm tracking-tight text-zinc-900 dark:text-zinc-100 flex items-center gap-1.5 whitespace-nowrap">
                        Daftar Belanja
                        {posCart.length > 0 && (
                          <span className="bg-primary-600 text-white text-[10px] font-black px-1.5 py-0.2 rounded-full leading-normal">
                            {posCart.reduce((s, i) => s + i.quantity, 0)}
                          </span>
                        )}
                      </h2>
                    </div>

                    <div className="flex items-center gap-2 min-w-0 flex-1 justify-end">
                      {/* Customer Search Input */}
                      <div className="relative flex-1 max-w-[240px]">
                        <div className="flex items-center gap-1.5 bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl px-2.5 h-8 shadow-xs focus-within:ring-2 focus-within:ring-primary-500/20 focus-within:border-primary-500 transition-all">
                          <Search className="w-3 h-3 text-zinc-400 shrink-0" />
                          <input
                            type="text"
                            value={customerSearch}
                            onChange={e => {
                              setCustomerSearch(e.target.value);
                              setCustomerDropdownOpen(true);
                              if (!e.target.value) { setCustomerId(''); }
                            }}
                            onFocus={() => setCustomerDropdownOpen(true)}
                            onBlur={() => setTimeout(() => setCustomerDropdownOpen(false), 150)}
                            placeholder={selectedCustomerObj ? selectedCustomerObj.name : '👤 Cari pelanggan...'}
                            className="flex-1 bg-transparent text-xs outline-none text-zinc-800 dark:text-zinc-100 placeholder:text-zinc-400 font-medium min-w-0"
                          />
                          {customerId && (
                            <button
                              onMouseDown={e => { e.preventDefault(); setCustomerId(''); setCustomerSearch(''); }}
                              className="text-zinc-400 hover:text-red-500 transition-colors p-0.5"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          )}
                        </div>
                        {/* Dropdown results */}
                        {customerDropdownOpen && (
                          <div className="absolute top-full right-0 mt-1 w-64 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-xl shadow-xl z-50 overflow-hidden">
                            <div
                              onMouseDown={e => { e.preventDefault(); setCustomerId(''); setCustomerSearch(''); setCustomerDropdownOpen(false); }}
                              className="flex items-center gap-2 px-3 py-2 text-xs text-zinc-500 hover:bg-zinc-50 dark:hover:bg-zinc-800 cursor-pointer border-b border-zinc-100 dark:border-zinc-800"
                            >
                              <span className="font-medium">Pelanggan Umum</span>
                            </div>
                            {state.customers
                              .filter(c => c.name.toLowerCase().includes(customerSearch.toLowerCase()))
                              .slice(0, 6)
                              .map(c => (
                                <div
                                  key={c.id}
                                  onMouseDown={e => { e.preventDefault(); setCustomerId(c.id); setCustomerSearch(c.name); setCustomerDropdownOpen(false); }}
                                  className="flex items-center justify-between px-3 py-2 text-xs hover:bg-zinc-50 dark:hover:bg-zinc-800 cursor-pointer"
                                >
                                  <span className="font-semibold text-zinc-800 dark:text-zinc-200">{c.name}</span>
                                  <span className="text-zinc-400">{c.points} poin</span>
                                </div>
                              ))
                            }
                            {state.customers.filter(c => c.name.toLowerCase().includes(customerSearch.toLowerCase())).length === 0 && (
                              <div className="px-3 py-2 text-xs text-zinc-400 italic">Pelanggan tidak ditemukan</div>
                            )}
                          </div>
                        )}
                      </div>

                      {selectedCustomerObj && (
                        <span className="hidden md:inline text-[10px] font-semibold text-emerald-600 bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 rounded-lg border border-emerald-200/60 dark:border-emerald-800/40 whitespace-nowrap">
                          {selectedCustomerObj.points} poin
                        </span>
                      )}

                      {/* Icon-only Trash Button */}
                      <button
                        onClick={() => setPosCart([])}
                        disabled={posCart.length === 0}
                        className="w-8 h-8 flex items-center justify-center text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30 rounded-xl disabled:opacity-20 transition-all shrink-0 active:scale-95 border border-transparent hover:border-red-200/50"
                        title="Kosongkan Keranjang"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* FSR table banner */}
                  {activeBusinessMode === 'cafe' && activeTable !== null && (
                    <div className="mx-4 mt-3 bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 p-2 rounded-xl flex justify-between items-center shrink-0">
                      <span className="text-xs font-bold text-emerald-800 dark:text-emerald-400 flex items-center gap-1.5">
                        <Coffee className="w-3.5 h-3.5" /> MEJA {activeTable}
                      </span>
                      <button
                        onClick={() => {
                          setTableOrders(prev => {
                            const filtered = prev.filter(o => o.tableNumber !== activeTable);
                            return [...filtered, { tableNumber: activeTable, items: posCart, customerId }];
                          });
                          setActiveTable(null); setPosCart([]); setCustomerId('');
                        }}
                        className="text-[10px] font-bold text-zinc-600 px-2 py-1 bg-white dark:bg-zinc-800 rounded border border-zinc-200 dark:border-zinc-700"
                      >
                        Simpan Bil/Pesan
                      </button>
                    </div>
                  )}

                  {/* Cart Items — scrollable */}
                  <div className="flex-1 overflow-y-auto px-4 py-3 space-y-2">
                    {posCart.length === 0 ? (
                      <div className="h-full flex flex-col items-center justify-center text-center text-zinc-400 py-16">
                        <ShoppingCart className="w-14 h-14 text-zinc-200 dark:text-zinc-700 mb-3 stroke-[1.2]" />
                        <p className="text-sm font-semibold text-zinc-400">Keranjang Masih Kosong</p>
                        <p className="text-xs text-zinc-400 mt-1">Scan barcode atau tambahkan produk via tombol Cek Produk</p>
                      </div>
                    ) : (
                      posCart.map(item => {
                        const originalPrice = getItemOriginalPrice(item);
                        const finalPrice = getItemFinalPrice(item);
                        const hasDiscount = finalPrice < originalPrice;

                        return (
                          <div key={item.id} className="group flex items-center gap-3 bg-zinc-50 dark:bg-zinc-800/50 rounded-xl px-3 py-2.5 border border-zinc-100 dark:border-zinc-800 hover:border-zinc-200 dark:hover:border-zinc-700 transition-all">
                            {/* Product info */}
                            <div className="flex-1 min-w-0">
                              <h4 className="font-bold text-xs text-zinc-900 dark:text-zinc-100 truncate">{item.product.name}</h4>
                              <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
                                {item.sugarLevel && <span className="text-[9px] text-zinc-500 bg-zinc-200 dark:bg-zinc-700 px-1 py-0.5 rounded">Sugar: {item.sugarLevel}</span>}
                                {item.iceLevel && <span className="text-[9px] text-zinc-500 bg-zinc-200 dark:bg-zinc-700 px-1 py-0.5 rounded">Ice: {item.iceLevel}</span>}
                                {item.extraEspresso && <span className="text-[9px] text-emerald-700 bg-emerald-100 px-1 py-0.5 rounded font-semibold">+Espresso</span>}
                                {item.cakeWriting && <span className="text-[9px] text-amber-800 bg-amber-100 px-1.5 py-0.5 rounded italic">&ldquo;{item.cakeWriting}&rdquo;</span>}
                              </div>
                            </div>

                            {/* Price */}
                            <div className="text-right shrink-0">
                              <div className="font-extrabold text-xs text-zinc-900 dark:text-zinc-100">
                                Rp{(finalPrice * item.quantity).toLocaleString('id-ID')}
                              </div>
                              {hasDiscount && (
                                <div className="flex items-center gap-1 justify-end">
                                  <span className="text-[9px] text-zinc-400 line-through">Rp{(originalPrice * item.quantity).toLocaleString('id-ID')}</span>
                                  <span className="text-[8px] font-bold text-green-600 bg-green-50 dark:bg-green-950/30 px-1 rounded">Grosir!</span>
                                </div>
                              )}
                              <div className="text-[10px] text-zinc-400 mt-0.5">@ Rp{finalPrice.toLocaleString('id-ID')}</div>
                            </div>

                            {/* Qty stepper */}
                            <div className="flex items-center bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-lg overflow-hidden shrink-0">
                              <button onClick={() => updateQuantity(item.id, false)} className="w-7 h-7 flex items-center justify-center text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors">
                                <Minus className="w-3 h-3" />
                              </button>
                              <span className="w-8 text-center text-xs font-bold text-zinc-800 dark:text-zinc-100">{item.quantity}</span>
                              <button onClick={() => updateQuantity(item.id, true)} className="w-7 h-7 flex items-center justify-center text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors">
                                <Plus className="w-3 h-3" />
                              </button>
                            </div>

                            {/* Actions */}
                            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                              {item.product.isCustomizable && (
                                <button onClick={() => openCustomizer(item)} className="w-6 h-6 flex items-center justify-center text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg transition-all" title="Kustomisasi">
                                  <Settings className="w-3.5 h-3.5" />
                                </button>
                              )}
                              <button onClick={() => removeItem(item.id)} className="w-6 h-6 flex items-center justify-center text-red-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30 rounded-lg transition-all" title="Hapus item">
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>

                  {/* Left footer — item count */}
                  {posCart.length > 0 && (
                    <div className="px-4 py-2 border-t border-zinc-100 dark:border-zinc-800 shrink-0">
                      <p className="text-[11px] text-zinc-400 font-medium">
                        {posCart.reduce((s, i) => s + i.quantity, 0)} item · {posCart.length} jenis produk
                      </p>
                    </div>
                  )}
                </div>

                {/* ── RIGHT 1/3 — Payment Summary (Desktop only) ── */}
                <div className="hidden sm:flex sm:flex-1 sm:min-w-[260px] sm:max-w-sm flex-col gap-3">

                  {/* Totals card */}
                  <div className="bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800 rounded-2xl p-4 shadow-sm space-y-2.5">
                    <h3 className="font-bold text-xs uppercase tracking-wider text-zinc-400 mb-3">Ringkasan Pembayaran</h3>

                    <div className="flex justify-between text-sm text-zinc-600 dark:text-zinc-400">
                      <span>Subtotal</span>
                      <span className="font-semibold text-zinc-800 dark:text-zinc-200">Rp{cartTotals.subtotal.toLocaleString('id-ID')}</span>
                    </div>
                    {cartTotals.discount > 0 && (
                      <div className="flex justify-between text-sm text-emerald-600 dark:text-emerald-400 font-semibold">
                        <span>Diskon Grosir</span>
                        <span>−Rp{cartTotals.discount.toLocaleString('id-ID')}</span>
                      </div>
                    )}


                    <div className="pt-2.5 border-t border-zinc-100 dark:border-zinc-800">
                      <div className="flex justify-between items-baseline">
                        <span className="font-bold text-sm text-zinc-900 dark:text-zinc-100">Total</span>
                        <span className="font-black text-2xl text-zinc-900 dark:text-white">
                          Rp{cartTotals.grandTotal.toLocaleString('id-ID')}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Block Tiles for Payment Methods Selection */}
                  <div className="bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800 rounded-2xl p-3.5 shadow-sm space-y-3">
                    <div>
                      <Label className="text-[11px] font-bold uppercase tracking-wider text-zinc-500 mb-2 block">Pilih Metode Pembayaran</Label>
                      <div className="grid grid-cols-2 gap-2">
                        {(state.paymentMethods || []).map(pm => {
                          const isSelected = paymentMethodId === pm.id;
                          let IconComp = Banknote;
                          if (pm.type === 'qris') IconComp = QrCode;
                          else if (pm.type === 'edc' || pm.type === 'bank' || pm.type === 'bank_transfer') IconComp = CreditCard;
                          else if (pm.type === 'ewallet') IconComp = Wallet;

                          return (
                            <button
                              key={pm.id}
                              type="button"
                              onClick={() => setPaymentMethodId(pm.id)}
                              className={`flex flex-col items-center justify-center p-3 rounded-xl border-2 transition-all cursor-pointer text-center ${
                                isSelected 
                                  ? 'border-emerald-600 bg-emerald-50/70 text-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-200 dark:border-emerald-500 shadow-sm scale-[1.02]' 
                                  : 'border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-850 text-zinc-600 dark:text-zinc-400 hover:border-zinc-300 dark:hover:border-zinc-700'
                              }`}
                            >
                              <IconComp className={`w-5 h-5 mb-1 ${isSelected ? 'text-emerald-600 dark:text-emerald-400' : 'text-zinc-500'}`} />
                              <span className="text-[11px] font-bold truncate max-w-full leading-tight">{pm.name}</span>
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* Cash payment amount input & change display */}
                    {state.paymentMethods.find(m => m.id === paymentMethodId)?.type === 'cash' && (
                      <div className="space-y-2 pt-2 border-t border-zinc-100 dark:border-zinc-800">
                        <Label htmlFor="sideAmountPaid" className="text-[11px] font-bold uppercase tracking-wider text-zinc-500 block">Uang Diterima (Cash)</Label>
                        <div className="relative">
                          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400 font-semibold text-xs">Rp</span>
                          <Input 
                            id="sideAmountPaid" 
                            type="number" 
                            value={amountPaid} 
                            onChange={e => setAmountPaid(e.target.value)} 
                            className="pl-8 h-10 text-xs border-zinc-200 dark:border-zinc-800 rounded-xl font-extrabold"
                            placeholder="0" 
                          />
                        </div>

                        {/* Kembalian */}
                        <div className="flex justify-between items-center bg-emerald-50 dark:bg-emerald-950/30 p-2.5 rounded-xl border border-emerald-200/60 dark:border-emerald-900/40">
                          <span className="text-[10px] font-bold text-emerald-800 dark:text-emerald-300 uppercase">Kembalian:</span>
                          <span className="text-sm font-black font-mono text-emerald-900 dark:text-emerald-200">
                            Rp{Math.max(0, (parseFloat(amountPaid) || 0) - (cartTotals.grandTotal - safeDepositToUse)).toLocaleString('id-ID')}
                          </span>
                        </div>
                      </div>
                    )}

                    {/* Customer Deposit Use Option */}
                    {selectedCustomerObj && selectedCustomerObj.depositBalance > 0 && (
                      <div className="pt-2 border-t border-zinc-100 dark:border-zinc-800">
                        <Label htmlFor="sideDepositUsed" className="text-[10px] font-bold uppercase tracking-wider text-zinc-500 mb-1 block">Gunakan Deposit (Maks: Rp{maxDepositToUse.toLocaleString('id-ID')})</Label>
                        <Input 
                          id="sideDepositUsed"
                          type="number"
                          value={depositToUse}
                          onChange={e => setDepositToUse(e.target.value)}
                          placeholder="0"
                          max={maxDepositToUse}
                          className="h-9 text-xs border-zinc-200 dark:border-zinc-800 rounded-xl"
                        />
                      </div>
                    )}
                  </div>

                  {/* Checkout button */}
                  <Button
                    onClick={() => {
                      if (posCart.length === 0) return;
                      const selectedPm = state.paymentMethods.find(m => m.id === paymentMethodId);
                      if (selectedPm?.type === 'qris') {
                        setIsQrisModalOpen(true);
                      } else if (selectedPm?.type === 'edc') {
                        const ref = prompt("Masukkan Nomor Referensi Transaksi EDC:");
                        if (ref !== null) {
                          setEdcRefNumber(ref);
                          handleCheckout();
                        }
                      } else {
                        handleCheckout();
                      }
                    }}
                    disabled={posCart.length === 0}
                    className={`w-full py-4 rounded-2xl font-black text-base tracking-tight text-white flex items-center justify-center gap-2 shadow-lg transition-all active:scale-[0.98] disabled:opacity-40 cursor-pointer ${preset.themeClasses.primaryBtn}`}
                  >
                    <CheckCircle2 className="w-5 h-5" />
                    <span>PROSES BAYAR</span>
                  </Button>

                </div>
              </div>

            </main>

            {/* --- Mobile Always Floating Bottom Checkout Bar --- */}
            <div className="sm:hidden fixed bottom-0 left-0 right-0 z-40 bg-white dark:bg-zinc-900 border-t border-zinc-200 dark:border-zinc-800 p-3 shadow-2xl flex items-center justify-between gap-3">
              <div className="min-w-0">
                <p className="text-[10px] uppercase font-bold tracking-wider text-zinc-400">Total ({posCart.reduce((s, i) => s + i.quantity, 0)} item)</p>
                <p className="text-lg font-black text-zinc-900 dark:text-white truncate">
                  Rp{cartTotals.grandTotal.toLocaleString('id-ID')}
                </p>
              </div>
              <button
                onClick={() => setCheckoutOpen(true)}
                disabled={posCart.length === 0}
                className="px-6 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white font-black text-sm flex items-center gap-2 shadow-lg shadow-emerald-600/30 transition-all disabled:opacity-40"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>BAYAR SEKARANG</span>
              </button>
            </div>

            {/* --- Modifiers / Customizer Options Dialog --- */}
            {customizingItem && (
              <Modal 
                isOpen={customizingItem !== null} 
                onClose={() => setCustomizingItem(null)} 
                title={`Kustomisasi ${customizingItem.product.name}`}
                footer={<><Button onClick={() => setCustomizingItem(null)} variant="secondary">Batal</Button><Button onClick={saveCustomizer}>Simpan</Button></>}
              >
                <div className="space-y-5 py-2 text-left">
                  
                  {/* COFFEE AND DRINKS MODIFIERS (QSR & FSR) */}
                  {(activeBusinessMode === 'qsr' || activeBusinessMode === 'fsr') && customizingItem.product.isCustomizable && (
                    <>
                      <div>
                        <span className="block text-xs font-bold uppercase tracking-wider text-zinc-500 mb-2">Takaran Gula (Sugar Level)</span>
                        <div className="grid grid-cols-3 gap-2">
                          {['Normal', 'Less', 'No Sugar'].map((opt) => (
                            <button
                              key={opt}
                              type="button"
                              onClick={() => setCustomSugar(opt as any)}
                              className={`py-2 text-xs font-semibold rounded-xl border transition-all ${
                                customSugar === opt 
                                  ? 'border-emerald-600 bg-emerald-50 text-emerald-800 dark:bg-emerald-950/20 dark:text-emerald-300' 
                                  : 'border-zinc-200 text-zinc-600 dark:border-zinc-800'
                              }`}
                            >
                              {opt === 'Normal' ? 'Normal (100%)' : opt === 'Less' ? 'Sedikit Gula' : 'Tanpa Gula'}
                            </button>
                          ))}
                        </div>
                      </div>

                      <div>
                        <span className="block text-xs font-bold uppercase tracking-wider text-zinc-500 mb-2">Takaran Es (Ice Level)</span>
                        <div className="grid grid-cols-3 gap-2">
                          {['Normal', 'Less', 'No Ice'].map((opt) => (
                            <button
                              key={opt}
                              type="button"
                              onClick={() => setCustomIce(opt as any)}
                              className={`py-2 text-xs font-semibold rounded-xl border transition-all ${
                                customIce === opt 
                                  ? 'border-emerald-600 bg-emerald-50 text-emerald-800 dark:bg-emerald-950/20 dark:text-emerald-300' 
                                  : 'border-zinc-200 text-zinc-600 dark:border-zinc-800'
                              }`}
                            >
                              {opt === 'Normal' ? 'Normal' : opt === 'Less' ? 'Sedikit Es' : 'Tanpa Es'}
                            </button>
                          ))}
                        </div>
                      </div>

                      <div>
                        <span className="block text-xs font-bold uppercase tracking-wider text-zinc-500 mb-2">Topping Tambahan (Upcharge)</span>
                        <div className="space-y-2">
                          <label className="flex items-center gap-3 bg-zinc-50 dark:bg-zinc-850 p-2.5 rounded-xl cursor-pointer hover:bg-zinc-100">
                            <input 
                              type="checkbox" 
                              checked={customEspresso} 
                              onChange={e => setCustomEspresso(e.target.checked)} 
                              className="rounded border-zinc-300 text-emerald-600 focus:ring-emerald-500"
                            />
                            <div className="text-xs">
                              <p className="font-bold">+1 Shot Espresso</p>
                              <p className="text-zinc-500">+Rp5.000</p>
                            </div>
                          </label>
                          <label className="flex items-center gap-3 bg-zinc-50 dark:bg-zinc-850 p-2.5 rounded-xl cursor-pointer hover:bg-zinc-100">
                            <input 
                              type="checkbox" 
                              checked={customBoba} 
                              onChange={e => setCustomBoba(e.target.checked)} 
                              className="rounded border-zinc-300 text-emerald-600 focus:ring-emerald-500"
                            />
                            <div className="text-xs">
                              <p className="font-bold">+Extra Boba Pearl</p>
                              <p className="text-zinc-500">+Rp4.000</p>
                            </div>
                          </label>
                        </div>
                      </div>
                    </>
                  )}

                  {/* BAKERY CAKE DECORATION MODIFIERS (Production & Retail) */}
                  {activeBusinessMode === 'production_retail' && (customizingItem.product.category === 'Kue Ulang Tahun' || customizingItem.product.category === 'Kue Kering') && (
                    <>
                      <div>
                        <Label htmlFor="cakeWriting" className="text-xs font-bold uppercase tracking-wider text-zinc-500 mb-1.5 block">Tulisan Di Atas Kue (Maks 30 karakter)</Label>
                        <Input 
                          id="cakeWriting" 
                          value={customCakeWriting} 
                          onChange={e => setCustomCakeWriting(e.target.value)} 
                          placeholder="e.g. Selamat Ulang Tahun Budi!"
                          maxLength={30}
                        />
                      </div>
                      <div>
                        <Label htmlFor="candlesCount" className="text-xs font-bold uppercase tracking-wider text-zinc-500 mb-1.5 block">Jumlah Lilin (Free)</Label>
                        <Input 
                          id="candlesCount" 
                          type="number" 
                          value={customCandlesCount || ''} 
                          onChange={e => setCustomCandlesCount(parseInt(e.target.value) || 0)} 
                          placeholder="0"
                          min={0}
                        />
                      </div>
                    </>
                  )}

                  {/* SERVICE / JOB-ORDER FACTORS */}
                  {activeBusinessMode === 'service_job' && (
                    <>
                      {customizingItem.product.category === 'Laundry Kiloan' || customizingItem.product.name.toLowerCase().includes('kilo') ? (
                        <div>
                          <Label htmlFor="serviceWeight" className="text-xs font-bold uppercase tracking-wider text-zinc-500 mb-1.5 block">Berat Pekerjaan (kg)</Label>
                          <Input 
                            id="serviceWeight" 
                            type="number" 
                            step="0.1"
                            value={customServiceWeight} 
                            onChange={e => setCustomServiceWeight(parseFloat(e.target.value) || 1.0)} 
                            placeholder="1.0"
                            min={0.1}
                          />
                        </div>
                      ) : (
                        <div>
                          <Label htmlFor="serviceDuration" className="text-xs font-bold uppercase tracking-wider text-zinc-500 mb-1.5 block">Durasi Layanan (Jam / Hari)</Label>
                          <Input 
                            id="serviceDuration" 
                            type="number" 
                            step="1"
                            value={customServiceDuration} 
                            onChange={e => setCustomServiceDuration(parseFloat(e.target.value) || 1.0)} 
                            placeholder="1"
                            min={1}
                          />
                        </div>
                      )}
                      <div>
                        <Label htmlFor="serviceNotes" className="text-xs font-bold uppercase tracking-wider text-zinc-500 mb-1.5 block">Catatan Khusus / Instruksi Pekerjaan</Label>
                        <Input 
                          id="serviceNotes" 
                          value={customServiceNotes} 
                          onChange={e => setCustomServiceNotes(e.target.value)} 
                          placeholder="e.g. Lipat rapi, setrika wangi jasmine, kancing lengkap..."
                        />
                      </div>
                    </>
                  )}

                  {/* APPOINTMENT & STAFF COMMISSION SELECTION */}
                  {activeBusinessMode === 'appointment_commission' && (
                    <>
                      <div>
                        <Label htmlFor="staffAssign" className="text-xs font-bold uppercase tracking-wider text-zinc-500 mb-1.5 block">Tugaskan Stylist / Barber (Penyedia Jasa)</Label>
                        <Select
                          id="staffAssign"
                          value={customAssignedStaffId}
                          onChange={e => setCustomAssignedStaffId(e.target.value)}
                          className="w-full h-11 border-zinc-200 dark:border-zinc-800 rounded-xl"
                        >
                          <option value="">-- Pilih Staf Penyedia Jasa --</option>
                          {staff.map(s => (
                            <option key={s.id} value={s.id}>{s.name} ({s.role || 'Stylist'})</option>
                          ))}
                        </Select>
                      </div>

                      {customAssignedStaffId && (
                        <div className="p-3 bg-rose-50 dark:bg-rose-950/20 border border-rose-200/50 dark:border-rose-900/30 rounded-xl">
                          <p className="text-[10px] font-bold text-rose-800 dark:text-rose-300 uppercase tracking-wide">KOMISI STAF DIALOKASIKAN (10%)</p>
                          <p className="text-sm font-extrabold text-rose-650 dark:text-rose-400 mt-1">
                            Rp{(getItemFinalPrice({
                              ...customizingItem,
                              serviceWeight: customServiceWeight,
                              serviceDuration: customServiceDuration
                            }) * 0.1).toLocaleString('id-ID')}
                          </p>
                          <p className="text-[9px] text-zinc-500 mt-0.5">Komisi ini dihitung otomatis dan akan dibukukan ke portofolio hasil kinerja {staff.find(s => s.id === customAssignedStaffId)?.name}.</p>
                        </div>
                      )}
                    </>
                  )}

                  <div className="p-3 bg-zinc-50 dark:bg-zinc-850 rounded-xl text-center">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 block mb-1">Total Setelah Kustom</span>
                    <span className="text-lg font-black text-zinc-800 dark:text-zinc-100">
                      Rp{getItemFinalPrice({
                        ...customizingItem,
                        extraEspresso: customEspresso,
                        extraBoba: customBoba,
                        serviceWeight: customServiceWeight,
                        serviceDuration: customServiceDuration
                      }).toLocaleString('id-ID')}
                    </span>
                  </div>

                </div>
              </Modal>
            )}



            {/* --- Dedicated Dynamic QRIS Pop Up Modal --- */}
            <Modal
              isOpen={isQrisModalOpen}
              onClose={() => setIsQrisModalOpen(false)}
              title="Pembayaran QRIS Dinamis Otomatis"
              maxWidth="max-w-md"
              footer={
                <div className="flex justify-end gap-2 w-full">
                  <Button variant="secondary" onClick={() => setIsQrisModalOpen(false)}>Batal</Button>
                  <Button 
                    onClick={() => {
                      setIsQrisModalOpen(false);
                      handleCheckout();
                    }} 
                    className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold"
                  >
                    Konfirmasi Pembayaran QRIS Selesai
                  </Button>
                </div>
              }
            >
              {(() => {
                const selectedPm = state.paymentMethods.find(m => m.id === paymentMethodId);
                const finalAmount = cartTotals.grandTotal - safeDepositToUse;
                const uploadedQrisImg = selectedPm?.qrisImageUrl;

                // Function to build standard EMVCo Dynamic QRIS String with exact nominal and CRC16
                const buildEMVCoDynamicQRIS = (amount: number, merchantName: string, staticPayload?: string) => {
                  const amtStr = amount.toFixed(2);
                  const cleanName = (merchantName || 'KEDAI 05').toUpperCase().replace(/[^A-Z0-9 ]/g, '').slice(0, 25);

                  let raw = '';
                  if (staticPayload && staticPayload.includes('000201')) {
                    // Convert static QRIS payload (type 11) to dynamic QRIS payload (type 12) + add tag 54 (amount)
                    let p = staticPayload;
                    // Replace 010211 with 010212 (Dynamic)
                    p = p.replace('010211', '010212');

                    // Remove existing CRC 6304XXXX if present
                    const crcIdx = p.indexOf('6304');
                    if (crcIdx > -1) {
                      p = p.substring(0, crcIdx);
                    }

                    // Remove existing 54 Tag if any
                    p = p.replace(/54\d{2}\d+(\.\d+)?/, '');

                    // Insert Tag 54 (Amount) before Tag 58 Country Code
                    const tag58Idx = p.indexOf('5802ID');
                    const amtTag = `54${String(amtStr.length).padStart(2, '0')}${amtStr}`;
                    if (tag58Idx > -1) {
                      raw = p.slice(0, tag58Idx) + amtTag + p.slice(tag58Idx);
                    } else {
                      raw = p + amtTag;
                    }
                  } else {
                    // Fallback to standard Indonesian EMVCo Dynamic Payload
                    raw = '000201' + '010212' + 
                          '26580016ID.CO.QRIS.WWW01189360000000000000000215ID1022215501100' + 
                          '52045812' + '5303360' + 
                          `54${String(amtStr.length).padStart(2, '0')}${amtStr}` + 
                          '5802ID' + 
                          `59${String(cleanName.length).padStart(2, '0')}${cleanName}` + 
                          '6007JAKARTA' + '62070703A01';
                  }

                  // Append CRC16 Marker "6304"
                  raw += '6304';

                  // Calculate CCITT-FALSE CRC16 Checksum
                  let crc = 0xFFFF;
                  for (let i = 0; i < raw.length; i++) {
                    crc ^= raw.charCodeAt(i) << 8;
                    for (let j = 0; j < 8; j++) {
                      if ((crc & 0x8000) !== 0) {
                        crc = ((crc << 1) ^ 0x1021) & 0xFFFF;
                      } else {
                        crc = (crc << 1) & 0xFFFF;
                      }
                    }
                  }
                  return raw + (crc & 0xFFFF).toString(16).toUpperCase().padStart(4, '0');
                };

                const emvCoDynamicData = buildEMVCoDynamicQRIS(finalAmount, companyInfo.name || 'KEDAI 05');
                const dynamicQrMatrixImg = `https://api.qrserver.com/v1/create-qr-code/?size=350x350&data=${encodeURIComponent(emvCoDynamicData)}`;
                const displayImg = (uploadedQrisImg && uploadedQrisImg.length > 5) ? uploadedQrisImg : dynamicQrMatrixImg;

                return (
                  <div className="flex flex-col items-center justify-center py-2 space-y-4 text-center">
                    <div className="bg-emerald-50 dark:bg-emerald-950/40 p-4 rounded-2xl border border-emerald-200/60 dark:border-emerald-900/50 w-full space-y-1">
                      <div className="flex items-center justify-center gap-1.5 text-emerald-700 dark:text-emerald-300">
                        <Sparkles className="w-4 h-4" />
                        <span className="text-[11px] font-extrabold uppercase tracking-wider">Pembayaran QRIS Kasir</span>
                      </div>
                      <p className="text-3xl font-black text-emerald-900 dark:text-emerald-100 font-mono">
                        Rp{finalAmount.toLocaleString('id-ID')}
                      </p>
                    </div>

                    <div className="p-4 bg-white rounded-2xl border-2 border-emerald-500 shadow-2xl relative flex flex-col items-center max-w-[340px] w-full">
                      <div className="relative overflow-hidden rounded-xl bg-white p-2 border border-zinc-200 shadow-inner w-full flex flex-col items-center">
                        <img 
                          src={displayImg} 
                          alt="QRIS Pembayaran Kasir" 
                          className="max-h-[360px] w-auto object-contain rounded-lg mx-auto" 
                        />
                        <div className="w-full bg-emerald-600 text-white py-2 px-3 text-center shadow-md rounded-xl mt-3">
                          <p className="text-[9px] font-black uppercase tracking-widest text-emerald-100">NOMINAL TAGIHAN SEKARANG</p>
                          <p className="text-xl font-black font-mono tracking-tight">
                            Rp{finalAmount.toLocaleString('id-ID')}
                          </p>
                        </div>
                      </div>
                      
                      <div className="mt-3 text-[10px] font-mono text-zinc-600 font-bold flex items-center gap-1.5">
                        <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping"></span>
                        <span>{companyInfo.name || 'KEDAI 05'} · Ref ID: {Date.now().toString().slice(-8)}</span>
                      </div>
                    </div>

                    <p className="text-xs text-zinc-600 dark:text-zinc-400 max-w-xs leading-relaxed">
                      Silakan minta pelanggan melakukan scan QRIS di atas dengan total pembayaran tepat <strong className="text-emerald-700 dark:text-emerald-300 font-mono">Rp{finalAmount.toLocaleString('id-ID')}</strong>.
                    </p>
                  </div>
                );
              })()}
            </Modal>

            {/* --- Cashier End Session / Audit Dialog --- */}
            <Modal 
              isOpen={isEndSessionModalOpen} 
              onClose={() => setEndSessionModalOpen(false)} 
              title="Akhiri Sesi Penjualan Kasir" 
              footer={<Button onClick={handleEndSessionAttempt}>Konfirmasi & Akhiri Sesi</Button>}
            >
                <p className="mb-4 text-xs text-zinc-500 dark:text-zinc-400 text-left">Masukkan jumlah uang tunai fisik yang dihitung di laci, dompet tempat penyetoran hasil penjualan, dan PIN Anda untuk menutup sesi kasir ini.</p>
                {pinError && <p className="text-red-500 text-xs font-bold mb-2 text-left">{pinError}</p>}
                
                <div className="space-y-4 text-left">
                    <div>
                        <Label htmlFor="countedCash" className="text-xs font-semibold uppercase tracking-wider text-zinc-500 mb-1 block">Uang Tunai Dihitung Laci (Rupiah)</Label>
                        <Input id="countedCash" type="number" value={countedCash} onChange={e => setCountedCash(e.target.value)} placeholder="0" required />
                    </div>
                    <div>
                        <Label className="text-xs font-semibold uppercase tracking-wider text-zinc-500 mb-1 block">Tujuan Setoran / Transfer Kas Sesi</Label>
                        <Select value={depositToAccountId} onChange={e => setDepositToAccountId(e.target.value)}>
                            {cashAccounts.map(acc => (
                                <option key={acc.id} value={acc.id}>
                                    {acc.name} (Saldo: Rp{acc.balance.toLocaleString('id-ID')}) {acc.id === cashInHandAccountId ? ' - Laci Kasir (Default)' : ''}
                                </option>
                            ))}
                        </Select>
                    </div>
                    <div>
                        <Label htmlFor="pin" className="text-xs font-semibold uppercase tracking-wider text-zinc-500 mb-1 block">PIN Verifikasi Kasir</Label>
                        <Input id="pin" type="password" value={pin} onChange={e => setPin(e.target.value)} placeholder="PIN Anda" required />
                    </div>
                </div>
            </Modal>

            {/* Receipts print views */}
            {summaryForReceipt && (
              <Modal isOpen={true} onClose={finalizeEndSession} title="Rekap Penutupan Sesi Selesai" footer={<Button onClick={finalizeEndSession}>Tutup & Keluar Sesi</Button>}>
                <div className="p-6 bg-zinc-100 dark:bg-zinc-900 rounded-xl flex justify-center">
                  <PosSessionSummaryReceipt summary={summaryForReceipt} session={posSession} companyInfo={companyInfo} />
                </div>
              </Modal>
            )}

            {/* --- Sticky Bottom Cart Preview on Mobile --- */}
            {posCart.length > 0 && mobileTab !== 'cart' && (
              <div className="lg:hidden fixed bottom-5 left-4 right-4 z-40 max-w-md mx-auto">
                <button 
                  onClick={() => setMobileTab('cart')}
                  className="w-full bg-zinc-950 dark:bg-zinc-100 text-white dark:text-zinc-950 px-5 py-3.5 rounded-2xl shadow-2xl flex items-center justify-between transition-all active:scale-[0.98] duration-150 border border-zinc-800 dark:border-zinc-200"
                >
                  <div className="flex items-center gap-3">
                    <div className="relative p-2 bg-zinc-850 dark:bg-zinc-200 rounded-xl">
                      <ShoppingCart className="w-5 h-5 text-white dark:text-zinc-900" />
                      <span className="absolute -top-1.5 -right-1.5 bg-red-500 text-white font-extrabold text-[9px] w-5 h-5 rounded-full flex items-center justify-center ring-2 ring-zinc-950 dark:ring-zinc-100">
                        {posCart.reduce((sum, item) => sum + item.quantity, 0)}
                      </span>
                    </div>
                    <div className="text-left">
                      <p className="text-[10px] uppercase font-bold tracking-wider text-zinc-400 dark:text-zinc-500">Keranjang Belanja</p>
                      <p className="text-sm font-black">
                        Rp{cartTotals.grandTotal.toLocaleString('id-ID')}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-1 bg-zinc-900 dark:bg-zinc-200 px-3 py-1.5 rounded-xl text-xs font-bold">
                    <span>Lihat Struk</span>
                    <ChevronRight className="w-4 h-4" />
                  </div>
                </button>
              </div>
            )}

            <SaleReceiptModal isOpen={isSaleReceiptOpen} onClose={() => { setSaleReceiptOpen(false); dispatch({ type: 'cart/clear' }); }} sale={lastTransaction} />

            {/* Action Modals */}
            <ProductInfoModal 
                isOpen={isProductInfoModalOpen} 
                onClose={() => setProductInfoModalOpen(false)} 
                products={combinedProducts}
                onAddToCart={(p) => addToCart(p)}
            />

            <CustomerModal 
                isOpen={isAddCustomerModalOpen} 
                onClose={() => setAddCustomerModalOpen(false)} 
                existingCustomer={null}
            />

            <CustomerBillPaymentModal 
                isOpen={isCustomerBillModalOpen} 
                onClose={() => setCustomerBillModalOpen(false)} 
            />

            <TransactionHistoryModal 
                isOpen={isTransactionHistoryModalOpen} 
                onClose={() => setTransactionHistoryModalOpen(false)} 
                sales={sales}
                onSelectSale={(sale) => {
                    dispatch({ type: 'cart/clear' });
                    setSaleReceiptOpen(true);
                }}
            />

            <PosReturnModal
                isOpen={isPosReturnModalOpen}
                onClose={() => setPosReturnModalOpen(false)}
            />

            {/* Camera Barcode Scanner Modal */}
            <Modal
                isOpen={isCameraScannerOpen}
                onClose={() => setCameraScannerOpen(false)}
                title="📷 Scan Barcode / QR Produk"
                footer={<Button onClick={() => setCameraScannerOpen(false)} variant="secondary">Tutup Camera</Button>}
            >
                <div className="flex flex-col items-center gap-4 py-2 text-center">
                    <div className="relative w-full max-w-sm aspect-square bg-black rounded-2xl overflow-hidden border-2 border-primary-500 shadow-2xl flex items-center justify-center">
                        <video
                            ref={videoRef}
                            className="w-full h-full object-cover"
                            playsInline
                            muted
                        />
                        {/* Aiming frame overlay */}
                        <div className="absolute inset-0 border-2 border-emerald-400/60 rounded-2xl pointer-events-none flex items-center justify-center">
                            <div className="w-56 h-36 border-2 border-dashed border-emerald-400 rounded-xl bg-emerald-500/10 animate-pulse flex items-center justify-center">
                                <span className="text-[10px] font-bold text-emerald-200 bg-black/60 px-2 py-0.5 rounded">Arahkan Barcode ke Sini</span>
                            </div>
                        </div>
                    </div>

                    {cameraError ? (
                        <p className="text-xs text-red-500 font-semibold">{cameraError}</p>
                    ) : (
                        <p className="text-xs text-zinc-500 dark:text-zinc-400">
                            Arahkan kamera HP ke barcode atau kode QR produk. Sistem akan otomatis memasukkannya ke keranjang belanja.
                        </p>
                    )}
                </div>
            </Modal>

        </div>
    );
};

// --- POS Retur Penjualan Kasir Modal ---
const PosReturnModal: React.FC<{
    isOpen: boolean;
    onClose: () => void;
}> = ({ isOpen, onClose }) => {
    const { state, dispatch } = useAppContext();
    const { sales = [], currentUser, branches = [] } = state || {};

    const [selectedSaleId, setSelectedSaleId] = useState('');
    const [itemSelections, setItemSelections] = useState<{
        selected: boolean;
        productId: string;
        productName: string;
        originalQty: number;
        returnQty: number;
        price: number;
        condition: string;
    }[]>([]);
    const [reason, setReason] = useState('');

    const targetBranchId = currentUser?.branchId || branches[0]?.id || 'CAB-JPSTNH01';

    // Recent Sales
    const recentSales = useMemo(() => {
        return sales.slice(0, 30);
    }, [sales]);

    const handleSelectSale = (saleId: string) => {
        setSelectedSaleId(saleId);
        const sale = sales.find(s => s.id === saleId);
        if (sale) {
            setItemSelections(sale.items.map(item => ({
                selected: true,
                productId: item.productId,
                productName: item.productName,
                originalQty: item.quantity,
                returnQty: item.quantity,
                price: item.price,
                condition: 'Barang Rusak / Defect'
            })));
        } else {
            setItemSelections([]);
        }
    };

    const totalRefund = useMemo(() => {
        return itemSelections
            .filter(item => item.selected)
            .reduce((sum, item) => sum + (item.returnQty * item.price), 0);
    }, [itemSelections]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const selectedItems = itemSelections.filter(item => item.selected);
        if (!selectedSaleId || selectedItems.length === 0) {
            alert("Harap pilih Transaksi Penjualan dan minimal 1 item untuk diretur.");
            return;
        }

        const sale = sales.find(s => s.id === selectedSaleId);
        const count = (state.returnOrders || []).length + 1;
        const today = new Date();
        const dateStr = today.toISOString().split('T')[0].replace(/-/g, '');
        const returId = `RET-${dateStr}-${String(count).padStart(3, '0')}`;

        const returnPayload = {
            type: 'Sale' as const,
            originalOrderId: selectedSaleId,
            customerOrVendorName: sale?.customerName || 'Pelanggan POS',
            items: selectedItems.map(item => ({
                productId: item.productId,
                productName: item.productName,
                quantity: item.returnQty,
                originalQty: item.originalQty,
                price: item.price,
                condition: item.condition
            })),
            returnLocationId: targetBranchId,
            refundAccountId: '1010', // Otomatis Tunai Kasir
            totalRefundAmount: totalRefund,
            reason
        };

        // 1. Create Return Order
        dispatch({ type: 'returns/create', payload: returnPayload });
        // 2. Instantly process return in POS session
        dispatch({ type: 'returns/process', payload: { returnId: returId } });

        alert(`Retur Penjualan #${returId} berhasil diproses! Stok dikembalikan ke Toko & Rp${totalRefund.toLocaleString('id-ID')} dipotong dari Kasir Tunai.`);
        onClose();
    };

    if (!isOpen) return null;

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title="🔄 Retur Penjualan (POS Kasir)"
            maxWidth="max-w-3xl"
            footer={
                <div className="flex justify-between items-center w-full">
                    <div className="text-left">
                        <span className="text-xs text-zinc-500 block">Total Refund Tunai Kasir:</span>
                        <span className="text-lg font-black text-rose-600 dark:text-rose-400 font-mono">
                            Rp{totalRefund.toLocaleString('id-ID')}
                        </span>
                    </div>
                    <div className="flex gap-2">
                        <Button type="button" onClick={onClose} variant="secondary">Batal</Button>
                        <Button onClick={handleSubmit}>Proses Retur Kasir</Button>
                    </div>
                </div>
            }
        >
            <form onSubmit={handleSubmit} className="space-y-4">
                <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 rounded-xl border border-emerald-200 dark:border-emerald-900/60 text-xs text-emerald-800 dark:text-emerald-300 font-semibold">
                    ✓ Retur di POS Kasir otomatis mengembalikan stok ke Toko & mengembalikan uang Tunai dari Kasir.
                </div>

                <div>
                    <Label>Pilih Transaksi Penjualan Asli*</Label>
                    <Select value={selectedSaleId} onChange={e => handleSelectSale(e.target.value)} required>
                        <option value="">-- Pilih Transaksi Penjualan --</option>
                        {recentSales.map(s => (
                            <option key={s.id} value={s.id}>
                                #{s.id} - {s.customerName || 'Pelanggan'} (Rp{s.grandTotal.toLocaleString('id-ID')}) - {new Date(s.date).toLocaleTimeString('id-ID')}
                            </option>
                        ))}
                    </Select>
                </div>

                {itemSelections.length > 0 && (
                    <div className="border border-zinc-200 dark:border-zinc-700 rounded-xl p-3 bg-zinc-50/50 dark:bg-zinc-800/40 space-y-2">
                        <Label className="text-xs font-bold uppercase tracking-wider text-zinc-700 dark:text-zinc-300">Pilih Item & Jumlah Barang Diretur</Label>
                        <div className="max-h-48 overflow-y-auto space-y-2">
                            {itemSelections.map(item => (
                                <div key={item.productId} className="flex items-center justify-between p-2.5 bg-white dark:bg-zinc-900 rounded-lg border border-zinc-200 dark:border-zinc-700 text-xs">
                                    <div className="flex items-center gap-2">
                                        <input
                                            type="checkbox"
                                            checked={item.selected}
                                            onChange={e => {
                                                const checked = e.target.checked;
                                                setItemSelections(prev => prev.map(i => i.productId === item.productId ? { ...i, selected: checked } : i));
                                            }}
                                            className="rounded text-primary-600 cursor-pointer"
                                        />
                                        <div>
                                            <p className="font-bold text-zinc-900 dark:text-white">{item.productName}</p>
                                            <p className="text-[10px] text-zinc-500 font-mono">Rp{item.price.toLocaleString('id-ID')} / unit</p>
                                        </div>
                                    </div>
                                    {item.selected && (
                                        <div className="flex items-center gap-2">
                                            <div className="w-20">
                                                <Input 
                                                    type="number" 
                                                    value={item.returnQty} 
                                                    onChange={e => {
                                                        const q = Math.max(1, Math.min(Number(e.target.value), item.originalQty));
                                                        setItemSelections(prev => prev.map(i => i.productId === item.productId ? { ...i, returnQty: q } : i));
                                                    }} 
                                                    min={1} 
                                                    max={item.originalQty} 
                                                />
                                            </div>
                                            <span className="font-bold font-mono text-rose-600 dark:text-rose-400">
                                                Rp{(item.returnQty * item.price).toLocaleString('id-ID')}
                                            </span>
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                <div>
                    <Label>Alasan Retur Kasir</Label>
                    <Input 
                        type="text" 
                        placeholder="Contoh: Barang cacat, ditukar pelanggan..." 
                        value={reason} 
                        onChange={e => setReason(e.target.value)} 
                    />
                </div>
            </form>
        </Modal>
    );
};

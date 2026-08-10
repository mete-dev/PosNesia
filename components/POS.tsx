import React, { useState, useMemo, useEffect, useRef } from 'react';
import { useAppContext } from '../hooks/useAppContext';
import { Product, Customer, Sale, PosSessionSummary, CompanyInfo, PaymentMethod, PosSession, Staff, JournalEntry, CustomerBill } from '../types';
import { LogoutIcon, DashboardIcon, InfoIcon, POSIcon, ReportIcon, DepositIcon, WithdrawIcon, BillIcon } from './icons';
import { Receipt } from './Receipt';
import { Input, Label, Button, Modal, Select, Card } from './ui';
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
  Sparkles
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

export const POSPage: React.FC = () => {
    const { state, dispatch } = useAppContext();
    const { posSession, currentUser, lastTransaction, companyInfo, sales, paymentMethods, journalEntries, customerBills, lastPaidBill, lastWithdrawalReceipt, accounts, staff } = state;
    
    // Core state
    const [view, setView] = useState<PosView>('transaction');
    const [activeBusinessMode, setActiveBusinessMode] = useState<'retail' | 'production_retail' | 'qsr' | 'fsr' | 'service_job' | 'appointment_commission'>(
      (companyInfo.businessType as any) || 'retail'
    );
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

    // Checkout Modal states
    const [isCheckoutOpen, setCheckoutOpen] = useState(false);
    const [customerId, setCustomerId] = useState('');
    const [paymentMethodId, setPaymentMethodId] = useState('pm1'); // cash as default
    const [amountPaid, setAmountPaid] = useState('');
    const [depositToUse, setDepositToUse] = useState('');
    const [isSaleReceiptOpen, setSaleReceiptOpen] = useState(false);

    // Mobile specific navigation: 'menu' | 'cart' | 'tables'
    const [mobileTab, setMobileTab] = useState<'menu' | 'cart' | 'tables'>('menu');

    // Get current preset configuration
    const preset = useMemo(() => BUSINESS_PRESETS[activeBusinessMode], [activeBusinessMode]);

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

    // Receipt triggers
    useEffect(() => {
        if (lastTransaction) setSaleReceiptOpen(true);
    }, [lastTransaction]);

    useEffect(() => {
        if (isEndSessionModalOpen && cashInHandAccountId) {
            setDepositToAccountId(cashInHandAccountId);
        }
    }, [isEndSessionModalOpen, cashInHandAccountId]);

    // Handle barcode simulation (Retail preset)
    const handleBarcodeSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      if (!barcodeInput.trim()) return;
      
      const foundProduct = preset.products.find(p => p.id.toLowerCase() === barcodeInput.toLowerCase() || p.name.toLowerCase().includes(barcodeInput.toLowerCase()));
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

      const taxRate = state.isTaxEnabled ? 0.11 : 0;
      const taxableAmount = subtotal - wholesaleDiscounts;
      const taxAmount = taxableAmount * taxRate;
      const grandTotal = taxableAmount + taxAmount;

      return {
        subtotal,
        discount: wholesaleDiscounts,
        taxAmount,
        grandTotal
      };
    }, [posCart, activeBusinessMode, state.isTaxEnabled]);

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
        
        // Include any manual deposits or withdrawals
        const sessionJournalEntries = journalEntries.filter(je => je.posSessionId === posSession?.id);
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
      return preset.products.filter(p => {
        const matchesCat = selectedCategory === 'Semua' || p.category === selectedCategory;
        const matchesQuery = p.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                             p.id.toLowerCase().includes(searchQuery.toLowerCase());
        return matchesCat && matchesQuery;
      });
    }, [preset, selectedCategory, searchQuery]);

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
        <div className={`min-h-screen ${preset.themeClasses.bg} text-zinc-900 dark:text-zinc-100 flex flex-col font-sans transition-colors duration-300`}>
            
            {/* --- Top Premium Multi-Business Banner --- */}
            <header className="sticky top-0 z-40 bg-white/80 dark:bg-zinc-900/80 backdrop-blur-md border-b border-zinc-200/80 dark:border-zinc-800 px-4 py-3 sm:px-6">
              <div className="max-w-7xl mx-auto flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                
                {/* Brand & Cashier Status info */}
                <div className="flex items-center gap-3 shrink-0">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                    activeBusinessMode === 'retail' ? 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300' :
                    activeBusinessMode === 'production_retail' ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300' :
                    activeBusinessMode === 'qsr' ? 'bg-orange-100 text-orange-800 dark:bg-orange-950 dark:text-orange-300' :
                    activeBusinessMode === 'fsr' ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300' :
                    activeBusinessMode === 'service_job' ? 'bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300' :
                    'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300'
                  }`}>
                    {activeBusinessMode === 'retail' ? <ShoppingBag className="w-5 h-5" /> :
                     activeBusinessMode === 'production_retail' ? <ChefHat className="w-5 h-5" /> :
                     activeBusinessMode === 'qsr' ? <Coffee className="w-5 h-5" /> :
                     activeBusinessMode === 'fsr' ? <Utensils className="w-5 h-5" /> :
                     activeBusinessMode === 'service_job' ? <Wrench className="w-5 h-5" /> :
                     <Scissors className="w-5 h-5" />}
                  </div>
                  <div>
                    <h1 className="font-bold text-base tracking-tight leading-tight">{companyInfo.name}</h1>
                    <p className="text-[11px] text-zinc-500 font-medium flex items-center gap-1.5 mt-0.5">
                      <span className="inline-block w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
                      Sesi: {posSession.id} &bull; Kasir: {currentUser?.name}
                    </p>
                  </div>
                </div>

                {/* 6 Versions Segmented Scrollable Switcher for MSMEs */}
                <div className="flex bg-zinc-100 dark:bg-zinc-800 p-1 rounded-2xl border border-zinc-200/50 dark:border-zinc-700 overflow-x-auto scrollbar-none w-full lg:w-auto max-w-2xl self-center">
                  {[
                    { mode: 'retail', label: 'Ritel & Toko', icon: ShoppingBag, color: 'bg-blue-600 text-white shadow-sm' },
                    { mode: 'production_retail', label: 'Produksi & Ritel', icon: ChefHat, color: 'bg-amber-600 text-white shadow-sm' },
                    { mode: 'qsr', label: 'Saji Cepat (QSR)', icon: Coffee, color: 'bg-orange-600 text-white shadow-sm' },
                    { mode: 'fsr', label: 'Resto (FSR)', icon: Utensils, color: 'bg-emerald-600 text-white shadow-sm' },
                    { mode: 'service_job', label: 'Jasa & Laundry', icon: Wrench, color: 'bg-purple-600 text-white shadow-sm' },
                    { mode: 'appointment_commission', label: 'Salon & Komisi', icon: Scissors, color: 'bg-rose-600 text-white shadow-sm' }
                  ].map((item) => {
                    const IconComp = item.icon;
                    const isActive = activeBusinessMode === item.mode;
                    return (
                      <button 
                        key={item.mode}
                        onClick={() => setActiveBusinessMode(item.mode as any)}
                        className={`flex items-center gap-1.5 px-3 py-1.5 text-[11px] font-bold rounded-xl transition-all whitespace-nowrap ${
                          isActive 
                            ? item.color 
                            : 'text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-200'
                        }`}
                      >
                        <IconComp className="w-3.5 h-3.5" />
                        <span>{item.label}</span>
                      </button>
                    );
                  })}
                </div>

                {/* Action Items */}
                <div className="flex items-center gap-2 justify-end self-end sm:self-auto shrink-0">
                  <button 
                    onClick={() => setEndSessionModalOpen(true)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-red-200 hover:border-red-300 hover:bg-red-50 text-red-600 dark:border-red-900/30 dark:hover:bg-red-950/30 text-xs font-semibold transition-all"
                  >
                    <LogoutIcon className="w-3.5 h-3.5" />
                    <span>Akhiri Sesi</span>
                  </button>
                  <button 
                    onClick={() => dispatch({ type: 'pos/toggleMode', payload: { start: false } })}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-zinc-200 hover:bg-zinc-50 dark:border-zinc-800 dark:hover:bg-zinc-800 text-zinc-600 dark:text-zinc-400 text-xs font-semibold transition-all"
                  >
                    <DashboardIcon className="w-3.5 h-3.5" />
                    <span>Dashboard ERP</span>
                  </button>
                </div>

              </div>
            </header>

            {/* --- Core Responsive Grid Body --- */}
            <main className="flex-grow max-w-7xl w-full mx-auto p-3 sm:p-6 grid grid-cols-1 lg:grid-cols-12 gap-4 sm:gap-6 relative">
              
              {/* Left Pane - Products Selection / Table grid (8 of 12 columns) */}
              <div className="lg:col-span-8 flex flex-col gap-4 sm:gap-6">
                
                {/* Mobile Screen Navigation tab selector */}
                <div className="lg:hidden flex bg-zinc-100 dark:bg-zinc-800 p-1.5 rounded-2xl border border-zinc-200/60 dark:border-zinc-700/80 shadow-inner">
                  <button 
                    onClick={() => setMobileTab('menu')}
                    className={`flex-1 py-2.5 text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 transition-all duration-200 ${mobileTab === 'menu' ? 'bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-950 shadow-sm scale-[1.02]' : 'text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100'}`}
                  >
                    <ShoppingBag className="w-4 h-4" />
                    <span>Menu Produk</span>
                  </button>
                  
                  {activeBusinessMode !== 'retail' && (
                    <button 
                      onClick={() => setMobileTab('tables')}
                      className={`flex-1 py-2.5 text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 transition-all duration-200 ${mobileTab === 'tables' ? 'bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-950 shadow-sm scale-[1.02]' : 'text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100'}`}
                    >
                      <Clock className="w-4 h-4" />
                      <span>
                        {activeBusinessMode === 'fsr' ? 'Meja' : 
                         activeBusinessMode === 'qsr' ? 'Dapur KDS' : 
                         activeBusinessMode === 'production_retail' ? 'Produksi' : 
                         activeBusinessMode === 'service_job' ? 'Lacak Job' : 'Komisi & Jadwal'}
                      </span>
                    </button>
                  )}

                  <button 
                    onClick={() => setMobileTab('cart')}
                    className={`flex-1 py-2.5 text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 transition-all duration-200 relative ${mobileTab === 'cart' ? 'bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-950 shadow-sm scale-[1.02]' : 'text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100'}`}
                  >
                    <ShoppingCart className="w-4 h-4" />
                    <span>Keranjang</span>
                    {posCart.length > 0 && (
                      <span className="flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-[9px] font-black text-white shadow-sm ring-2 ring-zinc-100 dark:ring-zinc-800 animate-pulse">
                        {posCart.reduce((s, i) => s + i.quantity, 0)}
                      </span>
                    )}
                  </button>
                </div>

                {/* --- 1. FSR Table Layout Panel --- */}
                {activeBusinessMode === 'fsr' && (mobileTab === 'tables' || (window.innerWidth >= 1024 && mobileTab === 'menu')) && (
                  <div className="bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800 p-5 rounded-3xl shadow-sm transition-all">
                    <div className="flex items-center justify-between mb-4">
                      <h2 className="text-xs font-bold uppercase tracking-wider text-zinc-400 flex items-center gap-1.5">
                        <Utensils className="w-4 h-4 text-emerald-600" />
                        Visual Manajemen Meja Makan (FSR - Dine-In)
                      </h2>
                      <div className="flex gap-1.5">
                        <button 
                          onClick={() => alert('Fitur Gabung Meja: Pilih meja asal dan meja tujuan untuk digabungkan.')} 
                          className="px-2.5 py-1 text-[10px] font-bold bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 rounded border border-zinc-200/50 dark:border-zinc-700 whitespace-nowrap"
                        >
                          Gabung Meja
                        </button>
                        <button 
                          onClick={() => alert('Fitur Pisah Tagihan (Split Bill): Pilih item yang akan dipisahkan pembayarannya.')} 
                          className="px-2.5 py-1 text-[10px] font-bold bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 rounded border border-zinc-200/50 dark:border-zinc-700 whitespace-nowrap"
                        >
                          Split Bill
                        </button>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-4 sm:grid-cols-8 gap-3">
                      {[1, 2, 3, 4, 5, 6, 7, 8].map(tableNum => {
                        const status = getTableStatus(tableNum);
                        const billAmount = getTableBillAmount(tableNum);
                        
                        return (
                          <button
                            key={tableNum}
                            onClick={() => handleTableSelect(tableNum)}
                            className={`p-2.5 rounded-2xl border text-center transition-all flex flex-col justify-between h-20 min-h-[4.5rem] relative ${
                              status === 'active' 
                                ? 'border-emerald-600 bg-emerald-50 dark:bg-emerald-950/30 shadow-inner ring-2 ring-emerald-600/30' 
                                : status === 'occupied'
                                ? 'border-amber-400 bg-amber-50/60 dark:bg-amber-950/20 hover:border-amber-500'
                                : 'border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900 hover:border-zinc-300 hover:bg-zinc-50'
                            }`}
                          >
                            <span className="font-extrabold text-[10px] block text-zinc-500 dark:text-zinc-400">MEJA {tableNum}</span>
                            {status === 'occupied' || status === 'active' ? (
                              <div className="mt-1">
                                <span className="inline-block px-1 py-0.5 text-[8px] font-bold rounded bg-amber-100 dark:bg-amber-900 text-amber-800 dark:text-amber-300">Pesan</span>
                                <p className="text-[10px] font-bold mt-0.5 text-zinc-800 dark:text-zinc-100">Rp{billAmount.toLocaleString('id-ID')}</p>
                              </div>
                            ) : (
                              <span className="text-[9px] font-semibold text-emerald-600 dark:text-emerald-400 mt-2 block">Kosong</span>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* --- 2. QSR Kitchen Display System (KDS) Live Monitor --- */}
                {activeBusinessMode === 'qsr' && (mobileTab === 'tables' || (window.innerWidth >= 1024 && mobileTab === 'menu')) && (
                  <div className="bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800 p-5 rounded-3xl shadow-sm transition-all">
                    <div className="flex items-center justify-between mb-4">
                      <h2 className="text-xs font-bold uppercase tracking-wider text-zinc-400 flex items-center gap-1.5">
                        <Coffee className="w-4 h-4 text-orange-600" />
                        Kitchen Display System (KDS) - Antrean Dapur Live
                      </h2>
                      <span className="px-2 py-0.5 text-[9px] font-bold rounded-full bg-orange-100 dark:bg-orange-950 text-orange-800 dark:text-orange-400 flex items-center gap-1">
                        <span className="inline-block w-1.5 h-1.5 rounded-full bg-orange-500 animate-pulse"></span>
                        Real-Time
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                      {kdsOrders.map(order => (
                        <div key={order.id} className="p-3.5 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/30 flex flex-col justify-between min-h-[140px]">
                          <div>
                            <div className="flex justify-between items-center mb-1.5">
                              <span className="font-extrabold text-[10px] text-zinc-400">{order.id} ({order.tableName || 'Takeaway'})</span>
                              <span className="text-[9px] font-semibold text-zinc-400">{order.time}</span>
                            </div>
                            <div className="space-y-1">
                              {order.items.map((it, i) => (
                                <div key={i} className="text-xs text-left">
                                  <span className="font-bold text-zinc-800 dark:text-zinc-200">{it.quantity}x</span> {it.name}
                                  {it.modifiers && <p className="text-[9px] text-zinc-400 font-medium ml-4 leading-tight">*{it.modifiers}</p>}
                                </div>
                              ))}
                            </div>
                          </div>
                          
                          <div className="mt-3 pt-2 border-t border-zinc-150 dark:border-zinc-800/80 flex justify-between items-center">
                            <span className={`px-2 py-0.5 text-[9px] font-bold rounded-full ${
                              order.status === 'Antri' ? 'bg-zinc-100 text-zinc-600' :
                              order.status === 'Memasak' ? 'bg-blue-100 text-blue-700 dark:bg-blue-950/40' :
                              'bg-green-100 text-green-700 dark:bg-green-950/40'
                            }`}>{order.status}</span>

                            <div className="flex gap-1">
                              {order.status === 'Antri' && (
                                <button 
                                  onClick={() => setKdsOrders(prev => prev.map(o => o.id === order.id ? { ...o, status: 'Memasak' } : o))}
                                  className="px-2 py-1 text-[9px] font-bold bg-blue-600 hover:bg-blue-700 text-white rounded-lg flex items-center gap-0.5"
                                >
                                  <Play className="w-2.5 h-2.5" /> Masak
                                </button>
                              )}
                              {order.status === 'Memasak' && (
                                <button 
                                  onClick={() => setKdsOrders(prev => prev.map(o => o.id === order.id ? { ...o, status: 'Selesai' } : o))}
                                  className="px-2 py-1 text-[9px] font-bold bg-green-600 hover:bg-green-700 text-white rounded-lg flex items-center gap-0.5"
                                >
                                  <CheckSquare className="w-2.5 h-2.5" /> Saji
                                </button>
                              )}
                              {order.status === 'Selesai' && (
                                <button 
                                  onClick={() => setKdsOrders(prev => prev.filter(o => o.id !== order.id))}
                                  className="px-2 py-1 text-[9px] font-bold bg-zinc-200 hover:bg-zinc-300 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 rounded-lg"
                                >
                                  Hapus
                                </button>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* --- 3. Production & Retail: Backend Production Queue & Spoilage Tracker --- */}
                {activeBusinessMode === 'production_retail' && (mobileTab === 'tables' || (window.innerWidth >= 1024 && mobileTab === 'menu')) && (
                  <div className="bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800 p-5 rounded-3xl shadow-sm transition-all space-y-5">
                    <div>
                      <h2 className="text-xs font-bold uppercase tracking-wider text-zinc-400 mb-3 flex items-center gap-1.5">
                        <ChefHat className="w-4 h-4 text-amber-600" />
                        Backend Bakery Production & Spoilage Monitor (Pabrikasi Ritel)
                      </h2>

                      {/* Active oven / baking batches */}
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        {productionQueue.map(batch => (
                          <div key={batch.id} className="p-3.5 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/30">
                            <div className="flex justify-between items-start mb-1">
                              <div>
                                <h4 className="font-bold text-xs text-zinc-800 dark:text-zinc-100">{batch.productName}</h4>
                                <span className="text-[9px] font-semibold text-zinc-400">Batch {batch.batchNo} &bull; Qty: {batch.quantity} pcs</span>
                              </div>
                              <span className={`px-1.5 py-0.5 text-[8px] font-extrabold rounded ${
                                batch.status === 'Baking' ? 'bg-amber-100 text-amber-800 dark:bg-amber-900' :
                                batch.status === 'Cooling' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900' :
                                'bg-green-100 text-green-800 dark:bg-green-900'
                              }`}>{batch.status}</span>
                            </div>

                            {/* Progress bar */}
                            <div className="w-full bg-zinc-200 dark:bg-zinc-850 h-1.5 rounded-full mt-2.5 relative overflow-hidden">
                              <div className={`h-full ${batch.status === 'Cooling' ? 'bg-blue-500' : 'bg-amber-500'}`} style={{ width: `${batch.progress}%` }}></div>
                            </div>
                            
                            <div className="mt-3 flex justify-between items-center">
                              <span className="text-[9px] font-mono text-zinc-400">Prog: {batch.progress}%</span>
                              {batch.status === 'Baking' && (
                                <button 
                                  onClick={() => setProductionQueue(prev => prev.map(b => b.id === batch.id ? { ...b, progress: 100, status: 'Cooling' } : b))}
                                  className="px-2 py-0.5 text-[9px] font-bold bg-amber-600 text-white rounded hover:bg-amber-700"
                                >
                                  Dinginkan
                                </button>
                              )}
                              {batch.status === 'Cooling' && (
                                <button 
                                  onClick={() => {
                                    setProductionQueue(prev => prev.filter(b => b.id !== batch.id));
                                    alert(`Stok produk "${batch.productName}" bertambah sebanyak ${batch.quantity} dari oven produksi dapur!`);
                                  }}
                                  className="px-2 py-0.5 text-[9px] font-bold bg-green-600 text-white rounded hover:bg-green-700"
                                >
                                  Pindahkan ke Etalase
                                </button>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Spoilage / Waste logs */}
                    <div className="border-t border-zinc-150 dark:border-zinc-800/80 pt-4">
                      <div className="flex justify-between items-center mb-2.5">
                        <h3 className="text-[11px] font-bold uppercase tracking-wider text-zinc-400">Log Penyusutan / Spoilage Roti Rusak</h3>
                        <button 
                          onClick={() => {
                            const qty = prompt("Masukkan jumlah roti rusak/kadaluarsa:");
                            if (qty && !isNaN(Number(qty))) {
                              setSpoilageLog(prev => [
                                ...prev,
                                {
                                  id: `SPL-${100 + prev.length + 1}`,
                                  productName: 'Roti Tawar Gandum',
                                  quantity: parseInt(qty),
                                  reason: 'Penyusutan kadaluarsa',
                                  date: 'Hari ini'
                                }
                              ]);
                              alert("Log penyusutan berhasil tercatat!");
                            }
                          }}
                          className="px-2 py-1 text-[9px] font-bold bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 rounded border border-zinc-200/50 dark:border-zinc-700"
                        >
                          Catat Roti Rusak (Spoilage)
                        </button>
                      </div>

                      <div className="space-y-1.5 max-h-[80px] overflow-y-auto">
                        {spoilageLog.map(log => (
                          <div key={log.id} className="text-[11px] flex justify-between bg-zinc-50 dark:bg-zinc-900/40 px-3 py-1.5 rounded-lg">
                            <span className="font-semibold text-zinc-700 dark:text-zinc-300">{log.productName} ({log.quantity} pcs)</span>
                            <span className="text-zinc-400 font-medium">{log.reason} &bull; {log.date}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {/* --- 4. Service & Job-Order Status Tracker --- */}
                {activeBusinessMode === 'service_job' && (mobileTab === 'tables' || (window.innerWidth >= 1024 && mobileTab === 'menu')) && (
                  <div className="bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800 p-5 rounded-3xl shadow-sm transition-all">
                    <div className="flex items-center justify-between mb-4">
                      <h2 className="text-xs font-bold uppercase tracking-wider text-zinc-400 flex items-center gap-1.5">
                        <Wrench className="w-4 h-4 text-purple-600" />
                        Lacak Status Pekerjaan Jasa & Laundry (Job Order)
                      </h2>
                      <button 
                        onClick={() => {
                          const cust = prompt("Masukkan nama pelanggan baru:");
                          if (cust) {
                            setServiceJobs(prev => [
                              ...prev,
                              {
                                id: `JOB-${200 + prev.length + 1}`,
                                customerName: cust,
                                serviceName: 'Laundry Kiloan Premium',
                                weightOrDuration: '3.0 kg',
                                totalPrice: 30000,
                                status: 'Penerimaan',
                                date: 'Hari ini'
                              }
                            ]);
                          }
                        }}
                        className="px-2 py-1 text-[10px] font-bold bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 rounded border border-zinc-200/50 dark:border-zinc-700"
                      >
                        + Job Manual
                      </button>
                    </div>

                    <div className="space-y-3">
                      {serviceJobs.map(job => (
                        <div key={job.id} className="p-3.5 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/30 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 text-left">
                          <div>
                            <div className="flex items-center gap-2 mb-1">
                              <span className="font-extrabold text-[10px] text-purple-600 dark:text-purple-400 font-mono">{job.id}</span>
                              <h4 className="font-bold text-xs text-zinc-800 dark:text-zinc-100">{job.customerName}</h4>
                            </div>
                            <p className="text-[11px] text-zinc-500 font-semibold">{job.serviceName} &bull; {job.weightOrDuration} &bull; <span className="text-zinc-700 dark:text-zinc-300">Rp{job.totalPrice.toLocaleString('id-ID')}</span></p>
                          </div>

                          {/* Stepper Status Indicator */}
                          <div className="flex items-center gap-4 shrink-0">
                            <div className="flex items-center gap-1">
                              {['Penerimaan', 'Cuci/Proses', 'Selesai', 'Diambil'].map((st, i) => {
                                const isCurrent = job.status === st;
                                const isDone = ['Penerimaan', 'Cuci/Proses', 'Selesai', 'Diambil'].indexOf(job.status) >= i;
                                return (
                                  <React.Fragment key={st}>
                                    <div className="flex flex-col items-center">
                                      <div className={`w-4 h-4 rounded-full flex items-center justify-center text-[8px] font-bold ${
                                        isCurrent ? 'bg-purple-600 text-white' :
                                        isDone ? 'bg-purple-200 text-purple-700 dark:bg-purple-950/50' :
                                        'bg-zinc-100 text-zinc-400 dark:bg-zinc-800'
                                      }`}>
                                        {i + 1}
                                      </div>
                                      <span className="text-[7px] font-bold text-zinc-400 mt-0.5">{st}</span>
                                    </div>
                                    {i < 3 && <div className={`w-3 h-[2px] -mt-2.5 ${isDone ? 'bg-purple-300' : 'bg-zinc-200'}`}></div>}
                                  </React.Fragment>
                                );
                              })}
                            </div>

                            <div className="flex gap-1 shrink-0">
                              {job.status === 'Penerimaan' && (
                                <button 
                                  onClick={() => setServiceJobs(prev => prev.map(j => j.id === job.id ? { ...j, status: 'Cuci/Proses' } : j))}
                                  className="px-2 py-1 text-[9px] font-bold bg-purple-600 text-white rounded-lg hover:bg-purple-700"
                                >
                                  Proses
                                </button>
                              )}
                              {job.status === 'Cuci/Proses' && (
                                <button 
                                  onClick={() => setServiceJobs(prev => prev.map(j => j.id === job.id ? { ...j, status: 'Selesai' } : j))}
                                  className="px-2 py-1 text-[9px] font-bold bg-amber-500 text-white rounded-lg hover:bg-amber-600"
                                >
                                  Selesai
                                </button>
                              )}
                              {job.status === 'Selesai' && (
                                <button 
                                  onClick={() => setServiceJobs(prev => prev.map(j => j.id === job.id ? { ...j, status: 'Diambil' } : j))}
                                  className="px-2 py-1 text-[9px] font-bold bg-green-600 text-white rounded-lg hover:bg-green-700"
                                >
                                  Diambil
                                </button>
                              )}
                              {job.status === 'Diambil' && (
                                <button 
                                  onClick={() => setServiceJobs(prev => prev.filter(j => j.id !== job.id))}
                                  className="px-2 py-1 text-[9px] font-bold bg-zinc-200 text-zinc-500 dark:bg-zinc-800 rounded-lg"
                                >
                                  Arsip
                                </button>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* --- 5. Appointment & Barber Scheduling + Staff Commission Dashboard --- */}
                {activeBusinessMode === 'appointment_commission' && (mobileTab === 'tables' || (window.innerWidth >= 1024 && mobileTab === 'menu')) && (
                  <div className="bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800 p-5 rounded-3xl shadow-sm transition-all space-y-5">
                    
                    {/* Live Stylist Booking Schedule */}
                    <div>
                      <h2 className="text-xs font-bold uppercase tracking-wider text-zinc-400 mb-3 flex items-center gap-1.5">
                        <Calendar className="w-4 h-4 text-rose-600" />
                        Jadwal & Agenda Booking Stylist/Barber Hari Ini
                      </h2>
                      
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {appointments.map(apt => (
                          <div key={apt.id} className="p-3.5 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/30 flex justify-between items-center text-left">
                            <div>
                              <div className="flex items-center gap-1.5 mb-1">
                                <span className="inline-block w-1.5 h-1.5 rounded-full bg-rose-500"></span>
                                <h4 className="font-bold text-xs text-zinc-800 dark:text-zinc-100">{apt.customerName} &bull; {apt.staffName}</h4>
                              </div>
                              <p className="text-[11px] text-zinc-500 font-semibold">{apt.serviceName}</p>
                              <span className="text-[10px] font-mono font-bold text-zinc-400 block mt-1">{apt.timeSlot}</span>
                            </div>

                            <div className="flex flex-col items-end gap-1.5">
                              <span className={`px-1.5 py-0.5 text-[8px] font-extrabold rounded ${apt.status === 'Booked' ? 'bg-rose-100 text-rose-800 dark:bg-rose-950/40' : 'bg-green-100 text-green-800 dark:bg-green-950/40'}`}>{apt.status}</span>
                              {apt.status === 'Booked' && (
                                <button 
                                  onClick={() => setAppointments(prev => prev.map(a => a.id === apt.id ? { ...a, status: 'Selesai' } : a))}
                                  className="px-2 py-0.5 text-[9px] font-bold bg-rose-600 text-white rounded hover:bg-rose-700"
                                >
                                  Selesai
                                </button>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Commissions ledger */}
                    <div className="border-t border-zinc-150 dark:border-zinc-800/80 pt-4 text-left">
                      <div className="flex justify-between items-center mb-3">
                        <h3 className="text-[11px] font-bold uppercase tracking-wider text-zinc-400">Ledger Perolehan Komisi Penjualan Staf (Auto-10%)</h3>
                        <span className="text-[10px] text-rose-500 font-bold flex items-center gap-0.5"><Sparkles className="w-3 h-3" /> Real-time Settlement</span>
                      </div>

                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                        {staff.slice(0, 4).map(st => {
                          // Calculate commissions: find matches in appointments, or just give a realistic base + sale commission
                          const totalCommission = sales
                            .filter(s => s.posSessionId === posSession?.id)
                            .reduce((sum, s) => {
                              // If items reference staff st.name, add commission
                              const itemsComm = s.items
                                .filter(item => item.productName.toLowerCase().includes(st.name.toLowerCase()))
                                .reduce((acc, item) => acc + (item.price * item.quantity * 0.1), 0);
                              return sum + itemsComm;
                            }, 0);

                          return (
                            <div key={st.id} className="p-3 bg-zinc-50 dark:bg-zinc-900/40 rounded-2xl border border-zinc-150 dark:border-zinc-800/80 text-center">
                              <span className="font-extrabold text-[10px] block text-zinc-500 dark:text-zinc-400 uppercase">{st.name}</span>
                              <span className="text-[9px] font-medium text-zinc-400 mt-0.5 block">{st.role || 'Stylist'}</span>
                              <div className="mt-2">
                                <span className="text-[9px] font-bold text-zinc-400 block leading-tight">KOMISI TERKUMPUL</span>
                                <span className="font-extrabold text-xs text-rose-600 dark:text-rose-400 block mt-0.5">Rp{(totalCommission || 25000).toLocaleString('id-ID')}</span>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                )}

                {/* --- 6. Retail Exclusives: Barcode Search Simulator --- */}
                {activeBusinessMode === 'retail' && (mobileTab === 'menu') && (
                  <div className="bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800 p-4 rounded-3xl shadow-sm text-left">
                    <h2 className="text-xs font-bold uppercase tracking-wider text-zinc-400 mb-3 flex items-center gap-1.5">
                      <Barcode className="w-4 h-4 text-blue-700" />
                      Simulasi Pemindai Barcode (Ritel Ritel & Grosir)
                    </h2>
                    
                    <form onSubmit={handleBarcodeSubmit} className="flex gap-2 relative">
                      <div className="relative flex-grow">
                        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400 w-4 h-4" />
                        <Input 
                          value={barcodeInput}
                          onChange={e => setBarcodeInput(e.target.value)}
                          placeholder="Pindai barcode / ketik kode produk (e.g. r1, r2, r3) & tekan enter..."
                          className="pl-10 h-10 border-zinc-200 dark:border-zinc-800 rounded-xl w-full text-xs"
                        />
                      </div>
                      <Button type="submit" className="bg-blue-800 hover:bg-blue-900 text-white rounded-xl text-xs h-10 px-4">
                        Pindai
                      </Button>
                    </form>
                    {barcodeSuccessMsg && (
                      <p className="text-xs text-green-600 dark:text-green-400 font-semibold mt-1.5 animate-pulse flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        {barcodeSuccessMsg}
                      </p>
                    )}

                    <div className="flex flex-wrap gap-1.5 mt-3">
                      <span className="text-[10px] font-semibold text-zinc-400 self-center">Coba cepat:</span>
                      {preset.products.slice(0, 4).map(p => (
                        <button 
                          key={p.id}
                          onClick={() => { setBarcodeInput(p.id); }}
                          className="px-2 py-1 text-[10px] font-mono font-bold bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-600 dark:text-zinc-300 rounded-md border border-zinc-200/50 dark:border-zinc-700"
                        >
                          {p.id} ({p.name.split(' ')[0]})
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* --- Search & Category Controls --- */}
                {mobileTab === 'menu' && (
                  <div className="flex flex-col gap-4">
                    <div className="flex flex-col sm:flex-row gap-3">
                      
                      {/* Search */}
                      <div className="relative flex-grow">
                        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400 w-4 h-4" />
                        <Input 
                          value={searchQuery}
                          onChange={e => setSearchQuery(e.target.value)}
                          placeholder="Cari nama produk..."
                          className="pl-10 h-11 border-zinc-200 dark:border-zinc-800 rounded-xl w-full"
                        />
                        {searchQuery && (
                          <button onClick={() => setSearchQuery('')} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600">
                            <X className="w-4 h-4" />
                          </button>
                        )}
                      </div>

                      {/* Display Mode Indicator */}
                      <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/50 dark:bg-zinc-900/50 rounded-xl text-xs font-semibold border border-zinc-200 dark:border-zinc-800 self-center">
                        <Clock className="w-3.5 h-3.5 text-zinc-400" />
                        <span>Mode {preset.title}</span>
                      </div>
                    </div>

                    {/* Category Carousel (Pills) */}
                    <div className="flex overflow-x-auto gap-2 pb-1.5 scrollbar-hide -mx-4 px-4 sm:mx-0 sm:px-0">
                      {preset.categories.map(cat => (
                        <button
                          key={cat}
                          onClick={() => setSelectedCategory(cat)}
                          className={`px-3 py-1.5 sm:px-4 sm:py-2 text-[11px] sm:text-xs font-bold rounded-xl sm:rounded-2xl border transition-all whitespace-nowrap cursor-pointer ${
                            selectedCategory === cat
                              ? preset.themeClasses.primaryBtn
                              : 'bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 text-zinc-600 hover:border-zinc-300 hover:bg-zinc-50'
                          }`}
                        >
                          {cat}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* --- Products Grid List --- */}
                {mobileTab === 'menu' && (
                  <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4">
                    {filteredProducts.map(prod => {
                      const stock = prod.stock;
                      
                      return (
                        <div
                          key={prod.id}
                          onClick={() => stock > 0 && addToCart(prod)}
                          className={`bg-white dark:bg-zinc-900 rounded-3xl border border-zinc-200/80 dark:border-zinc-800 p-3 sm:p-4 text-left transition-all cursor-pointer shadow-sm relative flex flex-col justify-between group ${preset.themeClasses.cardHover} ${stock <= 0 ? 'opacity-40 grayscale pointer-events-none' : ''}`}
                        >
                          
                          {/* Image Placeholder with category theme */}
                          <div className={`aspect-square w-full rounded-2xl flex items-center justify-center mb-2.5 sm:mb-3 transition-transform duration-300 group-hover:scale-105 relative overflow-hidden ${
                            activeBusinessMode === 'bakery' ? 'bg-amber-50/50 dark:bg-amber-950/10' : activeBusinessMode === 'cafe' ? 'bg-emerald-50/50 dark:bg-emerald-950/10' : 'bg-blue-50/50 dark:bg-blue-950/10'
                          }`}>
                            {activeBusinessMode === 'bakery' ? (
                              <Cake className="w-8 h-8 text-amber-700/80" />
                            ) : activeBusinessMode === 'cafe' ? (
                              <Coffee className="w-8 h-8 text-emerald-800/80" />
                            ) : (
                              <ShoppingBag className="w-8 h-8 text-blue-900/80" />
                            )}
                            
                            {/* Bakery fresh-baked badge */}
                            {activeBusinessMode === 'bakery' && prod.freshBakedMinutesAgo && (
                              <div className="absolute top-2 left-2 bg-amber-100 text-amber-900 text-[8px] font-bold px-1.5 py-0.5 rounded-full flex items-center gap-0.5">
                                <Clock className="w-2.5 h-2.5 text-amber-700" />
                                {prod.freshBakedMinutesAgo}m lalu
                              </div>
                            )}

                            {/* Retail shelf label */}
                            {activeBusinessMode === 'retail' && prod.shelfLocation && (
                              <div className="absolute top-2 left-2 bg-blue-100 text-blue-900 text-[8px] font-bold px-1.5 py-0.5 rounded-full flex items-center gap-0.5">
                                <MapPin className="w-2.5 h-2.5 text-blue-700" />
                                {prod.shelfLocation}
                              </div>
                            )}

                            {/* Wholesale pricing indicator */}
                            {activeBusinessMode === 'retail' && prod.wholesalePrice && prod.wholesaleMinQty && (
                              <div className="absolute bottom-2 right-2 bg-indigo-600 text-white text-[8px] font-bold px-1.5 py-0.5 rounded">
                                Grosir min {prod.wholesaleMinQty}
                              </div>
                            )}
                          </div>

                          <div>
                            {/* Product Info */}
                            <span className="text-[9px] font-bold uppercase tracking-wider text-zinc-400 dark:text-zinc-500">{prod.category}</span>
                            <h3 className="font-bold text-sm tracking-tight text-zinc-900 dark:text-zinc-100 mt-0.5 line-clamp-1">{prod.name}</h3>
                            
                            <div className="flex items-baseline gap-1 mt-2">
                              <span className="font-extrabold text-base text-zinc-900 dark:text-zinc-50">
                                Rp{prod.price.toLocaleString('id-ID')}
                              </span>
                            </div>

                            {/* Stock and Customizer tags */}
                            <div className="flex items-center justify-between mt-3 pt-2.5 border-t border-zinc-150 dark:border-zinc-850">
                              <span className="text-[10px] text-zinc-500 font-medium">Stok: {stock}</span>
                              {prod.isCustomizable && (
                                <span className={`inline-block text-[8px] font-bold px-1.5 py-0.5 rounded-full ${preset.themeClasses.badge}`}>
                                  Kustom
                                </span>
                              )}
                            </div>
                          </div>

                        </div>
                      );
                    })}
                  </div>
                )}
                
              </div>

              {/* Right Pane - Sticky Shopping Bill Receipt & Cart (4 of 12 columns) */}
              <div className={`lg:col-span-4 lg:block ${mobileTab === 'cart' ? 'block' : 'hidden'} lg:sticky lg:top-[5.5rem] self-start h-[calc(100vh-8rem)] min-h-[450px]`}>
                
                <div className="bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800 rounded-3xl p-5 shadow-lg flex flex-col justify-between h-full relative overflow-hidden">
                  <div className="absolute top-0 left-0 right-0 h-1.5 bg-zinc-900 dark:bg-zinc-200"></div>
                  
                  {/* Cart Header */}
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <h2 className="font-bold text-base tracking-tight flex items-center gap-2">
                        <ShoppingCart className="w-5 h-5 text-zinc-600 dark:text-zinc-400" />
                        <span>Struk Belanja</span>
                      </h2>
                      <button 
                        onClick={() => setPosCart([])}
                        className="text-xs font-semibold text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/20 px-2 py-1 rounded-lg flex items-center gap-1"
                        disabled={posCart.length === 0}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>Kosongkan</span>
                      </button>
                    </div>

                    {/* Cafe active table label */}
                    {activeBusinessMode === 'cafe' && activeTable !== null && (
                      <div className="bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-100 dark:border-emerald-950 p-2.5 rounded-xl flex justify-between items-center">
                        <span className="text-xs font-bold text-emerald-800 dark:text-emerald-400 flex items-center gap-1">
                          <Coffee className="w-4 h-4" /> MEJA {activeTable}
                        </span>
                        <button 
                          onClick={() => {
                            // Save current cart order
                            setTableOrders(prev => {
                              const filtered = prev.filter(o => o.tableNumber !== activeTable);
                              return [...filtered, { tableNumber: activeTable, items: posCart, customerId }];
                            });
                            setActiveTable(null);
                            setPosCart([]);
                            setCustomerId('');
                          }}
                          className="text-[10px] font-bold text-zinc-500 hover:text-zinc-800 uppercase px-2 py-1 bg-white dark:bg-zinc-800 rounded border border-zinc-200 dark:border-zinc-700"
                        >
                          Simpan Bil/Pesan
                        </button>
                      </div>
                    )}

                    {/* Customer loyalty points picker */}
                    <div className="space-y-1.5">
                      <label className="block text-[10px] font-bold uppercase tracking-wider text-zinc-400">Hubungkan Pelanggan</label>
                      <Select 
                        value={customerId} 
                        onChange={e => setCustomerId(e.target.value)}
                        className="w-full text-xs h-9 border-zinc-200 dark:border-zinc-800 rounded-xl"
                      >
                        <option value="">-- Pelanggan Umum --</option>
                        {state.customers.map(c => (
                          <option key={c.id} value={c.id}>
                            {c.name} (Saldo: Rp{c.depositBalance.toLocaleString('id-ID')})
                          </option>
                        ))}
                      </Select>
                      {selectedCustomerObj && (
                        <div className="flex justify-between text-[10px] font-semibold text-zinc-500 bg-zinc-50 dark:bg-zinc-850 p-1.5 rounded-lg mt-1">
                          <span>Poin Member: {selectedCustomerObj.points} Poin</span>
                          <span>Saldo Deposit: Rp{selectedCustomerObj.depositBalance.toLocaleString('id-ID')}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Cart Items List */}
                  <div className="flex-grow overflow-y-auto my-4 space-y-3.5 pr-1 border-t border-b border-dashed border-zinc-200 dark:border-zinc-800 py-3">
                    {posCart.length === 0 ? (
                      <div className="h-full flex flex-col items-center justify-center text-zinc-400 text-center p-6">
                        <ShoppingCart className="w-12 h-12 text-zinc-300 dark:text-zinc-700 mb-2 stroke-[1.5]" />
                        <p className="text-xs font-semibold">Belum Ada Item Terpilih</p>
                        <p className="text-[10px] text-zinc-400 mt-1">Klik item produk disamping untuk memasukan ke keranjang belanja</p>
                      </div>
                    ) : (
                      posCart.map(item => {
                        const originalPrice = getItemOriginalPrice(item);
                        const finalPrice = getItemFinalPrice(item);
                        const hasDiscount = finalPrice < originalPrice;

                        return (
                          <div key={item.id} className="group relative">
                            <div className="flex justify-between items-start gap-2">
                              <div>
                                <h4 className="font-bold text-xs tracking-tight text-zinc-900 dark:text-zinc-100">{item.product.name}</h4>
                                
                                {/* Modifiers list */}
                                <div className="space-y-0.5 mt-0.5">
                                  {/* Cafe options */}
                                  {item.sugarLevel && <span className="inline-block text-[9px] text-zinc-500 bg-zinc-100 dark:bg-zinc-800 px-1 py-0.5 rounded mr-1">Sugar: {item.sugarLevel}</span>}
                                  {item.iceLevel && <span className="inline-block text-[9px] text-zinc-500 bg-zinc-100 dark:bg-zinc-800 px-1 py-0.5 rounded mr-1">Ice: {item.iceLevel}</span>}
                                  {item.extraEspresso && <span className="inline-block text-[9px] text-emerald-700 bg-emerald-50 px-1 py-0.5 rounded mr-1 font-semibold">+Espresso</span>}
                                  {item.extraBoba && <span className="inline-block text-[9px] text-emerald-700 bg-emerald-50 px-1 py-0.5 rounded mr-1 font-semibold">+Boba</span>}
                                  
                                  {/* Bakery options */}
                                  {item.cakeWriting && <p className="text-[10px] text-amber-800 bg-amber-50 px-1.5 py-0.5 rounded italic mt-1 font-medium">Tulisan: &ldquo;{item.cakeWriting}&rdquo;</p>}
                                  {item.candlesCount !== undefined && item.candlesCount > 0 && <span className="inline-block text-[9px] text-amber-800 bg-amber-50 px-1 py-0.5 rounded font-semibold">{item.candlesCount} Lilin</span>}
                                </div>

                                <div className="flex items-center gap-2 mt-1">
                                  <span className="text-[11px] font-extrabold text-zinc-900 dark:text-zinc-200">
                                    Rp{(finalPrice * item.quantity).toLocaleString('id-ID')}
                                  </span>
                                  {hasDiscount && (
                                    <>
                                      <span className="text-[9px] text-zinc-400 line-through">Rp{(originalPrice * item.quantity).toLocaleString('id-ID')}</span>
                                      <span className="text-[8px] font-bold text-green-600 bg-green-50 dark:bg-green-950/20 px-1 rounded">Grosir!</span>
                                    </>
                                  )}
                                </div>
                              </div>

                              {/* Quantity adjustments */}
                              <div className="flex items-center bg-zinc-100 dark:bg-zinc-800 rounded-lg p-0.5 shadow-sm">
                                <button 
                                  onClick={() => updateQuantity(item.id, false)}
                                  className="w-5 h-5 flex items-center justify-center text-zinc-500 hover:bg-white dark:hover:bg-zinc-700 rounded transition-colors"
                                >
                                  <Minus className="w-3 h-3" />
                                </button>
                                <span className="w-6 text-center text-xs font-bold text-zinc-800 dark:text-zinc-100">{item.quantity}</span>
                                <button 
                                  onClick={() => updateQuantity(item.id, true)}
                                  className="w-5 h-5 flex items-center justify-center text-zinc-500 hover:bg-white dark:hover:bg-zinc-700 rounded transition-colors"
                                >
                                  <Plus className="w-3 h-3" />
                                </button>
                              </div>
                            </div>

                            {/* Options and Delete panel */}
                            <div className="flex justify-end gap-2 mt-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                              {item.product.isCustomizable && (
                                <button 
                                  onClick={() => openCustomizer(item)}
                                  className="text-[10px] font-bold text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200 flex items-center gap-0.5"
                                >
                                  <Clock className="w-3 h-3" /> Kustomisasi
                                </button>
                              )}
                              <button 
                                onClick={() => removeItem(item.id)}
                                className="text-[10px] font-bold text-red-500 hover:text-red-700 flex items-center gap-0.5"
                              >
                                <Trash2 className="w-3 h-3" /> Hapus
                              </button>
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>

                  {/* Cart Footer / Totals & Checkout */}
                  <div className="space-y-4 pt-1">
                    <div className="space-y-1.5 text-xs font-medium text-zinc-500 border-b border-zinc-100 dark:border-zinc-850 pb-3">
                      <div className="flex justify-between">
                        <span>Subtotal</span>
                        <span className="font-semibold text-zinc-800 dark:text-zinc-200">Rp{cartTotals.subtotal.toLocaleString('id-ID')}</span>
                      </div>
                      {cartTotals.discount > 0 && (
                        <div className="flex justify-between text-green-600">
                          <span>Diskon Grosir</span>
                          <span className="font-bold">-Rp{cartTotals.discount.toLocaleString('id-ID')}</span>
                        </div>
                      )}
                      {state.isTaxEnabled && (
                        <div className="flex justify-between">
                          <span>PPN (11%)</span>
                          <span className="font-semibold text-zinc-800 dark:text-zinc-200">Rp{cartTotals.taxAmount.toLocaleString('id-ID')}</span>
                        </div>
                      )}
                      <div className="flex justify-between text-zinc-900 dark:text-zinc-50 text-base font-extrabold pt-1">
                        <span>Total Belanja</span>
                        <span>Rp{cartTotals.grandTotal.toLocaleString('id-ID')}</span>
                      </div>
                    </div>

                    <Button 
                      onClick={() => setCheckoutOpen(true)} 
                      disabled={posCart.length === 0} 
                      className={`w-full py-3.5 rounded-2xl font-bold text-sm tracking-tight text-white flex items-center justify-center gap-2 ${preset.themeClasses.primaryBtn}`}
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Proses Bayar (Checkout)</span>
                    </Button>
                  </div>

                </div>
              </div>

            </main>

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

            {/* --- Premium Standard Checkout Modal --- */}
            <Modal 
              isOpen={isCheckoutOpen} 
              onClose={() => setCheckoutOpen(false)} 
              title="Selesaikan Pembayaran" 
              footer={<><Button onClick={() => setCheckoutOpen(false)} variant="secondary">Kembali</Button><Button onClick={handleCheckout} disabled={posCart.length === 0} className={preset.themeClasses.primaryBtn}>Bayar & Selesai</Button></>}
            >
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-left">
                
                {/* Invoice Totals Breakdown */}
                <div className="space-y-4">
                  <div className="bg-zinc-50 dark:bg-zinc-850 p-5 rounded-2xl border border-zinc-200/50 dark:border-zinc-800">
                    <h3 className="font-bold text-xs uppercase tracking-wider text-zinc-400 mb-3">Ringkasan Tagihan</h3>
                    
                    <div className="space-y-2 text-xs">
                      <div className="flex justify-between text-zinc-650">
                        <span>Total Belanja</span>
                        <span className="font-semibold text-zinc-800 dark:text-zinc-200">Rp{cartTotals.subtotal.toLocaleString('id-ID')}</span>
                      </div>
                      {cartTotals.discount > 0 && (
                        <div className="flex justify-between text-green-600 font-semibold">
                          <span>Diskon Grosir</span>
                          <span>-Rp{cartTotals.discount.toLocaleString('id-ID')}</span>
                        </div>
                      )}
                      {state.isTaxEnabled && (
                        <div className="flex justify-between text-zinc-650">
                          <span>PPN (11%)</span>
                          <span>Rp{cartTotals.taxAmount.toLocaleString('id-ID')}</span>
                        </div>
                      )}
                      
                      {/* Loyalty Balance deduction info */}
                      {selectedCustomerObj && safeDepositToUse > 0 && (
                        <div className="flex justify-between text-indigo-650 font-semibold">
                          <span>Gunakan Saldo Deposit</span>
                          <span>-Rp{safeDepositToUse.toLocaleString('id-ID')}</span>
                        </div>
                      )}

                      <div className="flex justify-between text-zinc-900 dark:text-zinc-50 text-lg font-black border-t border-dashed border-zinc-200 dark:border-zinc-700 pt-3 mt-2">
                        <span>Total Tagihan</span>
                        <span>Rp{(cartTotals.grandTotal - safeDepositToUse).toLocaleString('id-ID')}</span>
                      </div>
                    </div>
                  </div>

                  {/* Cash Change logic */}
                  {paymentMethodId === 'pm1' && (
                    <div className="bg-blue-50/50 dark:bg-zinc-950/20 border border-blue-100 dark:border-zinc-900 p-4 rounded-xl">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-blue-700 block mb-1">Kembalian Uang Tunai</span>
                      <p className="text-xl font-black text-blue-900 dark:text-blue-200">
                        Rp{Math.max(0, (parseFloat(amountPaid) || 0) - (cartTotals.grandTotal - safeDepositToUse)).toLocaleString('id-ID')}
                      </p>
                    </div>
                  )}
                </div>

                {/* Form Controls */}
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="paymentMethod" className="text-xs font-bold uppercase tracking-wider text-zinc-500 mb-1.5 block">Pilih Metode Pembayaran</Label>
                    <Select 
                      id="paymentMethod" 
                      value={paymentMethodId} 
                      onChange={e => setPaymentMethodId(e.target.value)}
                      className="w-full h-11 border-zinc-200 dark:border-zinc-800 rounded-xl"
                    >
                      {state.paymentMethods.map(pm => (
                        <option key={pm.id} value={pm.id}>{pm.name}</option>
                      ))}
                    </Select>
                  </div>

                  {/* Cash payment exact change options */}
                  {paymentMethodId === 'pm1' && (
                    <div className="space-y-2">
                      <Label htmlFor="amountPaid" className="text-xs font-bold uppercase tracking-wider text-zinc-500 mb-1.5 block">Jumlah Uang Diterima (Cash)</Label>
                      <div className="relative">
                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400 font-semibold text-sm">Rp</span>
                        <Input 
                          id="amountPaid" 
                          type="number" 
                          value={amountPaid} 
                          onChange={e => setAmountPaid(e.target.value)} 
                          className="pl-10 h-11 border-zinc-200 dark:border-zinc-800 rounded-xl font-extrabold"
                          placeholder="0" 
                          required 
                        />
                      </div>
                      
                      {/* Quick payments shortcuts */}
                      <div className="grid grid-cols-3 gap-1.5 pt-1">
                        {[
                          cartTotals.grandTotal - safeDepositToUse,
                          20000, 50000, 100000
                        ].filter(v => v > 0).slice(0, 3).map((val) => (
                          <button
                            key={val}
                            type="button"
                            onClick={() => setAmountPaid(String(Math.ceil(val)))}
                            className="py-1 px-2 text-[10px] font-bold bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 rounded border border-zinc-200/50 dark:border-zinc-700 whitespace-nowrap"
                          >
                            Rp{val.toLocaleString('id-ID')}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Loyalty deposit deduction input */}
                  {selectedCustomerObj && selectedCustomerObj.depositBalance > 0 && (
                    <div>
                      <Label htmlFor="depositUsed" className="text-xs font-bold uppercase tracking-wider text-zinc-500 mb-1.5 block">Debet Saldo Deposit Pelanggan (Maks: Rp{maxDepositToUse.toLocaleString('id-ID')})</Label>
                      <Input 
                        id="depositUsed"
                        type="number"
                        value={depositToUse}
                        onChange={e => setDepositToUse(e.target.value)}
                        placeholder="0"
                        max={maxDepositToUse}
                        className="h-11 border-zinc-200 dark:border-zinc-800 rounded-xl"
                      />
                    </div>
                  )}

                </div>
              </div>
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

        </div>
    );
};

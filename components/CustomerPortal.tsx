
// This is a new file: components/CustomerPortal.tsx
import React, { useState, useMemo, useEffect, useRef } from 'react';
import { useAppContext } from '../hooks/useAppContext';
import { CustomerAddress, Product, Theme, Sale, FulfillmentStatus, HelpdeskTicket, Event, TicketTier, CustomerBill, DepositWithdrawalToken } from '../types';
import { DashboardIcon, PurchaseListIcon, UserCircleIcon, SunIcon, MoonIcon, StoreIcon, EventIcon, BillIcon, DepositIcon, WithdrawIcon } from './icons';
import { Button, Input, Label, Modal, Select, Textarea, Badge, PINModal, Card } from './ui';
import { applyPromotionsToCart, getApplicableProductPromotion } from '../utils/promotionUtils';


// --- Theme Toggle Component ---
const ThemeToggle: React.FC = () => {
    const { state, dispatch } = useAppContext();
    const { theme } = state;
    const isDark = theme === Theme.Dark;
    const toggleTheme = () => dispatch({ type: 'ui/setTheme', payload: isDark ? Theme.Light : Theme.Dark });

    return (
        <button onClick={toggleTheme} className="p-2 rounded-full hover:bg-white/20">
            {isDark ? <SunIcon className="w-6 h-6" /> : <MoonIcon className="w-6 h-6" />}
        </button>
    );
};


// --- Sub-Pages/Views ---

const AddressModal: React.FC<{ isOpen: boolean; onClose: () => void; }> = ({ isOpen, onClose }) => {
    const { state, dispatch } = useAppContext();
    const { provinces, cities, districts, villages } = state;
    
    const [provinceId, setProvinceId] = useState('');
    const [cityId, setCityId] = useState('');
    const [districtId, setDistrictId] = useState('');
    const [villageId, setVillageId] = useState('');
    const [detail, setDetail] = useState('');
    const [label, setLabel] = useState('Rumah');
    const [isPrimary, setIsPrimary] = useState(true);

    const availableCities = useMemo(() => cities.filter(c => c.provinceId === provinceId), [provinceId, cities]);
    const availableDistricts = useMemo(() => districts.filter(d => d.cityId === cityId), [cityId, districts]);
    const availableVillages = useMemo(() => villages.filter(v => v.districtId === districtId), [districtId, villages]);
    
    useEffect(() => { setCityId(''); }, [provinceId]);
    useEffect(() => { setDistrictId(''); }, [cityId]);
    useEffect(() => { setVillageId(''); }, [districtId]);

    if (!isOpen) return null;
    
    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const provinceName = provinces.find(p => p.id === provinceId)?.name || '';
        const cityName = cities.find(c => c.id === cityId)?.name || '';
        const districtName = districts.find(d => d.id === districtId)?.name || '';
        const villageName = villages.find(v => v.id === villageId)?.name || '';

        const address: Omit<CustomerAddress, 'id'> = { label, province: provinceName, city: cityName, district: districtName, village: villageName, detail, isPrimary };
        dispatch({ type: 'customers/addAddress', payload: address });
        onClose();
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4">
            <form onSubmit={handleSubmit} className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-lg max-h-[90vh] flex flex-col">
                <h2 className="text-xl font-bold p-4 border-b dark:border-gray-700">Tambah Alamat Baru</h2>
                <div className="p-6 flex-grow overflow-y-auto space-y-4">
                    <Select value={provinceId} onChange={e => setProvinceId(e.target.value)} required><option value="">Pilih Provinsi</option>{provinces.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}</Select>
                    <Select value={cityId} onChange={e => setCityId(e.target.value)} disabled={!provinceId} required><option value="">Pilih Kota/Kab.</option>{availableCities.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}</Select>
                    <Select value={districtId} onChange={e => setDistrictId(e.target.value)} disabled={!cityId} required><option value="">Pilih Kecamatan</option>{availableDistricts.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}</Select>
                    <Select value={villageId} onChange={e => setVillageId(e.target.value)} disabled={!districtId} required><option value="">Pilih Kel./Desa</option>{availableVillages.map(v => <option key={v.id} value={v.id}>{v.name}</option>)}</Select>
                    <textarea value={detail} onChange={e => setDetail(e.target.value)} rows={3} placeholder="Nama Jalan, Gedung, No. Rumah" className="mt-1 block w-full rounded-md bg-gray-200 dark:bg-gray-700 border-transparent"></textarea>
                    <Input value={label} onChange={e => setLabel(e.target.value)} placeholder="Simpan sebagai (cth: Rumah, Kantor)" />
                    <label className="flex items-center"><input type="checkbox" checked={isPrimary} onChange={e => setIsPrimary(e.target.checked)} className="rounded text-primary-600 focus:ring-primary-500"/> Jadikan Alamat Utama</label>
                </div>
                <div className="flex justify-end p-4 border-t dark:border-gray-700 space-x-4">
                    <button type="button" onClick={onClose} className="px-4 py-2 rounded-lg bg-gray-200 dark:bg-gray-600">Batal</button>
                    <Button type="submit">Simpan Alamat</Button>
                </div>
            </form>
        </div>
    );
};

const CheckoutModal: React.FC<{ isOpen: boolean; onClose: () => void; }> = ({ isOpen, onClose }) => {
    const { state, dispatch } = useAppContext();
    const { cart, promotions, products, currentCustomer } = state;

    const [step, setStep] = useState(1);
    const [selectedAddressId, setSelectedAddressId] = useState('');
    const [pointsToUse, setPointsToUse] = useState(0);
    const [depositToUse, setDepositToUse] = useState(0);
    const [isPinModalOpen, setPinModalOpen] = useState(false);

    const { cartWithDiscounts, totalDiscount } = useMemo(() => applyPromotionsToCart(cart, promotions, products, currentCustomer || undefined), [cart, promotions, products, currentCustomer]);

    const subtotal = cart.reduce((sum, item) => sum + item.product.price * item.quantity, 0);
    
    let totalAfterDiscounts = subtotal - totalDiscount;
    const maxPointsToUse = currentCustomer ? Math.min(currentCustomer.points, totalAfterDiscounts) : 0;
    const maxDepositToUse = currentCustomer ? Math.min(currentCustomer.depositBalance, totalAfterDiscounts - pointsToUse) : 0;
    
    const safePointsToUse = Math.min(pointsToUse, maxPointsToUse);
    const safeDepositToUse = Math.min(depositToUse, maxDepositToUse);

    const grandTotal = subtotal - totalDiscount - safePointsToUse - safeDepositToUse;

    const handleConfirmOrder = () => {
         if (!selectedAddressId) {
            alert("Harap pilih alamat pengiriman.");
            return;
        }
        // If deposit or points are used, show PIN modal
        if (safeDepositToUse > 0 || safePointsToUse > 0) {
            setPinModalOpen(true);
        } else {
            // Otherwise, place order directly
            placeOrder();
        }
    };

    const placeOrder = () => {
        dispatch({
            type: 'sales/processCustomerOrder',
            payload: {
                addressId: selectedAddressId,
                pointsToUse: safePointsToUse,
                depositToUse: safeDepositToUse
            }
        });
        alert("Pesanan berhasil dibuat!");
        onClose();
    };
    
    const handlePinConfirm = (pin: string) => {
        if (pin === currentCustomer?.pin) {
            setPinModalOpen(false);
            placeOrder();
        } else {
            alert('PIN Salah!');
        }
    };

     useEffect(() => {
        if (!isOpen) {
            setTimeout(() => { setStep(1); setPointsToUse(0); setDepositToUse(0); setSelectedAddressId(''); }, 300);
        } else if (currentCustomer?.addresses.length) {
            setSelectedAddressId(currentCustomer.addresses.find(a => a.isPrimary)?.id || currentCustomer.addresses[0].id);
        }
    }, [isOpen, currentCustomer]);
    
    if (!currentCustomer) return null;

    return (
        <>
        <Modal isOpen={isOpen} onClose={onClose} title="Checkout" maxWidth="max-w-xl">
             <div className="space-y-4">
                {/* Step 1: Items & Address */}
                {step === 1 && (
                    <div className="space-y-4">
                        <h3 className="font-semibold">Alamat Pengiriman</h3>
                        <Select value={selectedAddressId} onChange={e => setSelectedAddressId(e.target.value)}>
                            {currentCustomer.addresses.map(a => <option key={a.id} value={a.id}>{a.label} - {a.district}</option>)}
                        </Select>
                        <h3 className="font-semibold pt-4 border-t dark:border-gray-600">Ringkasan Pesanan</h3>
                        {cartWithDiscounts.map(item => (
                            <div key={item.product.id} className="flex justify-between text-sm">
                                <span>{item.product.name} x {item.quantity}</span>
                                <span>Rp{(item.product.price * item.quantity).toLocaleString('id-ID')}</span>
                            </div>
                        ))}
                    </div>
                )}
                {/* Step 2: Payment */}
                {step === 2 && (
                    <div className="space-y-4">
                        <h3 className="font-semibold">Pembayaran</h3>
                        <div className="p-4 border rounded-lg dark:border-gray-600">
                             <div>
                                <Label>Gunakan Poin (Maks: {maxPointsToUse})</Label>
                                <div className="flex items-center gap-2">
                                    <input type="range" min="0" max={maxPointsToUse} value={safePointsToUse} onChange={e => setPointsToUse(parseInt(e.target.value))} className="w-full" />
                                    <Input type="number" value={safePointsToUse} onChange={e => setPointsToUse(parseInt(e.target.value))} className="w-24 text-center"/>
                                </div>
                            </div>
                            <div>
                                <Label>Gunakan Saldo Deposit (Maks: Rp{maxDepositToUse.toLocaleString('id-ID')})</Label>
                                <div className="flex items-center gap-2">
                                    <input type="range" min="0" max={maxDepositToUse} value={safeDepositToUse} step="1000" onChange={e => setDepositToUse(parseInt(e.target.value))} className="w-full"/>
                                    <Input type="number" value={safeDepositToUse} onChange={e => setDepositToUse(parseInt(e.target.value))} className="w-24 text-center"/>
                                </div>
                            </div>
                        </div>
                        <div className="mt-2 p-4 border rounded-lg dark:border-gray-600 font-bold">Metode Pembayaran Akhir: Bayar di Tempat</div>
                    </div>
                )}
            </div>
            {/* Footer */}
            <div className="mt-6 pt-4 border-t dark:border-gray-600">
                <div className="space-y-1 mb-4">
                    <div className="flex justify-between text-sm"><span>Subtotal</span><span>Rp{subtotal.toLocaleString('id-ID')}</span></div>
                    <div className="flex justify-between text-sm text-green-500"><span>Diskon</span><span>- Rp{totalDiscount.toLocaleString('id-ID')}</span></div>
                    {safePointsToUse > 0 && <div className="flex justify-between text-sm text-green-500"><span>Poin Digunakan</span><span>- Rp{safePointsToUse.toLocaleString('id-ID')}</span></div>}
                    {safeDepositToUse > 0 && <div className="flex justify-between text-sm text-green-500"><span>Saldo Digunakan</span><span>- Rp{safeDepositToUse.toLocaleString('id-ID')}</span></div>}
                    <div className="flex justify-between font-bold text-xl pt-1"><span>Total</span><span>Rp{grandTotal.toLocaleString('id-ID')}</span></div>
                </div>
                <div className="flex justify-between items-center">
                    {step > 1 && <button onClick={() => setStep(step - 1)} className="text-primary-600 font-semibold">Kembali</button>}
                    <div className="flex-grow"></div>
                    {step === 1 && <Button onClick={() => setStep(2)} className="w-full" disabled={cart.length === 0}>Lanjut ke Pembayaran</Button>}
                    {step === 2 && <Button onClick={handleConfirmOrder} className="w-full">Buat Pesanan</Button>}
                </div>
            </div>
        </Modal>
        <PINModal
            isOpen={isPinModalOpen}
            onClose={() => setPinModalOpen(false)}
            onConfirm={handlePinConfirm}
            title="Verifikasi Pembayaran"
            description="Masukkan PIN untuk mengonfirmasi penggunaan Saldo/Poin."
        />
        </>
    );
}

const CartSidebar: React.FC<{ isOpen: boolean, onClose: () => void, onCheckout: () => void; }> = ({ isOpen, onClose, onCheckout }) => {
    const { state, dispatch } = useAppContext();
    const { cart, promotions, products, currentCustomer } = state;
    const { cartWithDiscounts, totalDiscount } = useMemo(() => applyPromotionsToCart(cart, promotions, products, currentCustomer || undefined), [cart, promotions, products, currentCustomer]);
    const subtotal = cart.reduce((sum, item) => sum + item.product.price * item.quantity, 0);
    const grandTotal = subtotal - totalDiscount;

    const handleQuantityChange = (productId: string, quantity: number) => {
        dispatch({ type: 'cart/updateQuantity', payload: { productId, quantity } });
    };
    
    return (
        <div className={`fixed top-0 right-0 h-full w-96 bg-white dark:bg-gray-800 shadow-2xl transform transition-transform z-50 ${isOpen ? 'translate-x-0' : 'translate-x-full'}`}>
            <div className="flex flex-col h-full">
                <div className="flex justify-between items-center p-4 border-b dark:border-gray-700">
                    <h2 className="text-xl font-bold">Keranjang Anda</h2>
                    <button onClick={onClose} className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700">×</button>
                </div>
                <div className="flex-grow p-4 space-y-4 overflow-y-auto">
                     {cartWithDiscounts.map(item => (
                        <div key={item.product.id} className="flex items-center gap-4">
                            <img src={item.product.imageUrl} alt={item.product.name} className="w-16 h-16 rounded-lg object-cover" />
                            <div className="flex-grow">
                                <p className="font-semibold">{item.product.name}</p>
                                <p className="text-sm text-gray-500">Rp{item.product.price.toLocaleString('id-ID')} x {item.quantity}</p>
                            </div>
                            <div className="flex items-center gap-2">
                                <button onClick={() => handleQuantityChange(item.product.id, item.quantity - 1)} className="w-6 h-6 rounded bg-gray-200 dark:bg-gray-600">-</button>
                                <span>{item.quantity}</span>
                                <button onClick={() => handleQuantityChange(item.product.id, item.quantity + 1)} className="w-6 h-6 rounded bg-gray-200 dark:bg-gray-600">+</button>
                            </div>
                        </div>
                    ))}
                </div>
                <div className="p-4 border-t dark:border-gray-700 space-y-3">
                    <div className="flex justify-between"><span>Subtotal</span><span>Rp{subtotal.toLocaleString('id-ID')}</span></div>
                    <div className="flex justify-between text-green-500"><span>Diskon</span><span>- Rp{totalDiscount.toLocaleString('id-ID')}</span></div>
                    <div className="flex justify-between font-bold text-xl"><span>Total</span><span>Rp{grandTotal.toLocaleString('id-ID')}</span></div>
                    <button onClick={onCheckout} disabled={cart.length === 0} className="w-full mt-2 py-3 rounded-lg text-white bg-primary-600 hover:bg-primary-700 font-bold disabled:bg-gray-400">
                        Lanjut ke Checkout
                    </button>
                </div>
            </div>
        </div>
    );
};

const DepositModal: React.FC<{ isOpen: boolean; onClose: () => void; }> = ({ isOpen, onClose }) => {
    const { dispatch } = useAppContext();
    const [amount, setAmount] = useState('');
    
    const handleDeposit = (paymentMethod: 'va' | 'transfer') => {
        const numAmount = parseFloat(amount);
        if (!numAmount || numAmount <= 0) {
            alert("Harap masukkan jumlah yang valid.");
            return;
        }
        dispatch({
            type: 'customers/createDepositBill',
            payload: { amount: numAmount, paymentMethod }
        });
        onClose();
    };
    
    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Isi Saldo Deposit">
            <div className="space-y-4">
                <div>
                    <Label>Jumlah Isi Saldo (Rp)</Label>
                    <Input type="number" value={amount} onChange={e => setAmount(e.target.value)} placeholder="e.g., 50000" required />
                </div>
                 <div className="space-y-2 pt-4">
                    <p className="font-semibold">Pilih Metode Pembayaran:</p>
                    <Button onClick={() => handleDeposit('va')} className="w-full" variant="secondary">Bayar di Kasir (Virtual Account)</Button>
                    <Button onClick={() => handleDeposit('transfer')} className="w-full" variant="secondary">Transfer Bank</Button>
                </div>
            </div>
        </Modal>
    );
};

const PaymentInstructionsModal: React.FC<{
    isOpen: boolean;
    onClose: () => void;
    bill: CustomerBill | null;
}> = ({ isOpen, onClose, bill }) => {
    const { state } = useAppContext();
    const bankAccounts = useMemo(() => {
        return state.accounts.filter(a => a.isCashAccount && a.cashAccountType === 'Rekening');
    }, [state.accounts]);

    if (!isOpen || !bill) return null;

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Instruksi Pembayaran">
            <div className="space-y-6">
                <div className="text-center">
                    <p className="text-gray-500 dark:text-gray-400">Total Tagihan</p>
                    <p className="text-3xl font-bold">Rp{bill.amount.toLocaleString('id-ID')}</p>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{bill.description}</p>
                </div>

                {bill.virtualAccountNumber && (
                    <div className="p-4 bg-gray-100 dark:bg-gray-700/50 rounded-lg">
                        <h3 className="font-bold mb-2">Bayar di Kasir / Teller</h3>
                        <p className="text-sm">Sebutkan Nomor Virtual Account di bawah ini saat melakukan pembayaran di kasir kami atau melalui teller bank.</p>
                        <p className="text-center font-mono text-xl font-bold bg-white dark:bg-gray-800 p-3 rounded-md my-2 text-primary-600 dark:text-primary-400">
                            {bill.virtualAccountNumber}
                        </p>
                    </div>
                )}
                
                {!bill.virtualAccountNumber && (
                    <div className="p-4 bg-gray-100 dark:bg-gray-700/50 rounded-lg">
                        <h3 className="font-bold mb-2">Transfer Bank</h3>
                        <p className="text-sm mb-3">
                            Harap transfer <strong className="text-red-500">tepat sejumlah nominal unik</strong> di atas ke salah satu rekening berikut.
                            Sertakan nomor tagihan (<strong className="font-mono">{bill.id}</strong>) dalam berita transfer.
                        </p>
                        <ul className="space-y-2">
                            {bankAccounts.map(acc => (
                                <li key={acc.id} className="text-sm font-semibold">{acc.name}</li>
                            ))}
                        </ul>
                    </div>
                )}
            </div>
        </Modal>
    );
};

const HomePage: React.FC<{ setPage: (page: any) => void }> = ({ setPage }) => {
    const { state, dispatch } = useAppContext();
    const { currentCustomer, cart, lastCreatedBill, lastWithdrawalToken } = state;
    const [isAddressModalOpen, setAddressModalOpen] = useState(false);
    const [isCartOpen, setCartOpen] = useState(false);
    const [isCheckoutOpen, setCheckoutOpen] = useState(false);
    const [isDepositModalOpen, setDepositModalOpen] = useState(false);
    const [isPaymentInstructionsOpen, setPaymentInstructionsOpen] = useState(false);
    const [isWithdrawModalOpen, setWithdrawModalOpen] = useState(false);
    const [isPayBillModalOpen, setPayBillModalOpen] = useState(false);

    useEffect(() => {
        if (lastCreatedBill) {
            setPaymentInstructionsOpen(true);
        }
    }, [lastCreatedBill]);

     useEffect(() => {
        if (lastWithdrawalToken) {
            setWithdrawModalOpen(false); // Close the amount entry modal
        }
    }, [lastWithdrawalToken]);

    const handleCloseInstructions = () => {
        setPaymentInstructionsOpen(false);
        dispatch({ type: 'billing/clearLastCreatedBill' });
    };

    const primaryAddress = useMemo(() => currentCustomer?.addresses.find(a => a.isPrimary) || currentCustomer?.addresses[0], [currentCustomer]);
    
    if (!currentCustomer) return null;
    
    const QuickActionButton: React.FC<{ label: string; icon: React.ReactElement; onClick: () => void }> = ({ label, icon, onClick }) => (
        <button onClick={onClick} className="flex flex-col items-center justify-center gap-2 p-4 bg-white dark:bg-gray-800/50 rounded-xl shadow transition-transform hover:scale-105">
            {React.cloneElement<{ className?: string }>(icon, { className: "w-8 h-8 text-primary-600 dark:text-primary-400" })}
            <span className="text-sm font-semibold">{label}</span>
        </button>
    );

    return (
        <div className="p-4 space-y-4 pt-20">
             <header className="fixed top-0 left-0 right-0 max-w-xl mx-auto bg-primary-600 dark:bg-primary-700 text-white p-4 flex justify-between items-center shadow-md flex-shrink-0 z-10">
                <h1 className="text-xl font-bold">Beranda</h1>
                <div className="flex items-center gap-2">
                    <ThemeToggle />
                    <button onClick={() => setCartOpen(true)} className="relative p-2 rounded-full hover:bg-white/20">
                         <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" /></svg>
                         {cart.length > 0 && <span className="absolute top-0 right-0 inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-red-100 transform translate-x-1/2 -translate-y-1/2 bg-red-600 rounded-full">{cart.reduce((sum, item) => sum + item.quantity, 0)}</span>}
                    </button>
                </div>
            </header>

            <div className="bg-gradient-to-br from-primary-500 to-primary-400 text-white p-6 rounded-xl shadow-lg">
                <h2 className="text-lg">Selamat Datang, {currentCustomer.name}!</h2>
                <div className="flex justify-between items-end mt-4">
                    <div><p className="text-sm opacity-80">Saldo Deposit</p><p className="text-2xl font-bold">Rp{currentCustomer.depositBalance.toLocaleString('id-ID')}</p></div>
                    <Button onClick={() => setDepositModalOpen(true)} className="bg-white/20 hover:bg-white/30 text-white">
                        Isi Saldo
                    </Button>
                </div>
            </div>

            <div className="grid grid-cols-4 gap-3">
                <QuickActionButton label="Isi Saldo" icon={<DepositIcon />} onClick={() => setDepositModalOpen(true)} />
                <QuickActionButton label="Tarik Saldo" icon={<WithdrawIcon />} onClick={() => setWithdrawModalOpen(true)} />
                <QuickActionButton label="Bayar Tagihan" icon={<BillIcon />} onClick={() => setPayBillModalOpen(true)} />
                <QuickActionButton label="Acara" icon={<EventIcon />} onClick={() => setPage('events')} />
            </div>

            {primaryAddress ? (
                <div className="text-sm p-3 bg-white dark:bg-gray-800/50 rounded-lg shadow">
                    <p className="text-gray-600 dark:text-gray-400">Mengirim ke <span className="font-bold text-gray-800 dark:text-gray-200">{primaryAddress.district}</span></p>
                </div>
            ) : (
                <button onClick={() => setAddressModalOpen(true)} className="w-full p-4 text-center bg-yellow-100 dark:bg-yellow-900/50 text-yellow-800 dark:text-yellow-300 rounded-lg font-semibold shadow">
                    Anda belum punya alamat. Tambahkan alamat untuk mulai berbelanja.
                </button>
            )}

            <AddressModal isOpen={isAddressModalOpen} onClose={() => setAddressModalOpen(false)} />
            <CartSidebar isOpen={isCartOpen} onClose={() => setCartOpen(false)} onCheckout={() => { setCartOpen(false); setCheckoutOpen(true); }} />
            <CheckoutModal isOpen={isCheckoutOpen} onClose={() => setCheckoutOpen(false)} />
            <DepositModal isOpen={isDepositModalOpen} onClose={() => setDepositModalOpen(false)} />
            <PaymentInstructionsModal 
                isOpen={isPaymentInstructionsOpen} 
                onClose={handleCloseInstructions} 
                bill={lastCreatedBill} 
            />
            <WithdrawModal isOpen={isWithdrawModalOpen} onClose={() => setWithdrawModalOpen(false)} />
            <TokenDisplayModal isOpen={!!lastWithdrawalToken} onClose={() => dispatch({ type: 'customers/clearLastWithdrawalToken' })} token={lastWithdrawalToken} />
            <PayBillModal isOpen={isPayBillModalOpen} onClose={() => setPayBillModalOpen(false)} />
        </div>
    );
};

const OrdersPage = () => {
    const { state } = useAppContext();
    const { sales, currentCustomer, customerBills } = state;

    const allTransactions = useMemo(() => {
        if (!currentCustomer) return [];

        const mappedSales = sales
            .filter(s => s.customerId === currentCustomer.id)
            .map(sale => {
                let statusText = '';
                if (sale.status === 'Cancelled') {
                    statusText = 'Dibatalkan';
                } else if (sale.status === 'Unpaid') {
                    statusText = 'Belum Lunas';
                } else { // Paid
                    switch (sale.fulfillmentStatus) {
                        case 'Pending': statusText = 'Menunggu Diproses'; break;
                        case 'Fulfilled': statusText = 'Siap Dikirim'; break;
                        case 'Shipped': statusText = 'Dikirim'; break;
                        case 'Delivered': statusText = 'Terkirim'; break;
                        default: statusText = 'Lunas';
                    }
                }
                return {
                    id: `sale-${sale.id}`,
                    date: sale.date,
                    description: sale.items.map(i => `${i.productName} (x${i.quantity})`).join(', '),
                    total: sale.grandTotal,
                    status: statusText,
                    type: 'Sale',
                    originalObject: sale
                };
            });

        const mappedBills = customerBills
            .filter(b => b.customerId === currentCustomer.id && b.status !== 'Unpaid')
            .map(bill => ({
                id: `bill-${bill.id}`,
                date: bill.paidDate || bill.billDate,
                description: bill.description,
                total: bill.amount,
                status: bill.status === 'Paid' ? 'Lunas' : 'Dibatalkan',
                type: 'Bill' as const,
                originalObject: bill
            }));
            
        const combined = [...mappedSales, ...mappedBills];
        return combined.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    }, [sales, customerBills, currentCustomer]);

    const getStatusChip = (status: string) => {
        const lowerStatus = status.toLowerCase();
        if (lowerStatus.includes('lunas') || lowerStatus.includes('terkirim')) {
            return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300';
        }
        if (lowerStatus.includes('belum lunas')) {
            return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300';
        }
        if (lowerStatus.includes('dibatalkan')) {
            return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300';
        }
        if (lowerStatus.includes('dikirim')) {
             return 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900/50 dark:text-indigo-300';
        }
         return 'bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-300';
    };

    return (
        <div className="p-4 space-y-4 pt-20">
            <header className="fixed top-0 left-0 right-0 max-w-xl mx-auto bg-primary-600 dark:bg-primary-700 text-white p-4 flex justify-between items-center shadow-md flex-shrink-0 z-10">
                <h1 className="text-xl font-bold">Riwayat Pesanan</h1>
            </header>
            {allTransactions.length === 0 ? <p className="text-center text-gray-500 dark:text-gray-400 mt-8">Anda belum memiliki riwayat transaksi.</p> :
            allTransactions.map(tx => (
                <div key={tx.id} className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow space-y-2">
                    <div className="flex justify-between items-center text-sm text-gray-600 dark:text-gray-400">
                        <span className="font-bold text-gray-800 dark:text-gray-200">
                            {tx.type === 'Sale' ? `Pesanan #${(tx.originalObject as Sale).id}` : `Tagihan #${(tx.originalObject as CustomerBill).id}`}
                        </span>
                        <span>{new Date(tx.date).toLocaleDateString('id-ID')}</span>
                    </div>

                    <div className="border-t border-b dark:border-gray-700 py-2 my-2">
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                            {tx.description}
                        </p>
                    </div>

                    <div className="flex justify-between items-end">
                        <div>
                            <p className="text-xs text-gray-500">Total</p>
                            <p className="text-lg font-bold text-primary-600 dark:text-primary-400">
                                Rp{tx.total.toLocaleString('id-ID')}
                            </p>
                        </div>
                        <div className="flex flex-col items-end gap-1 text-xs">
                             <span className={`px-2 py-1 rounded-full font-semibold ${getStatusChip(tx.status)}`}>
                                {tx.status}
                            </span>
                        </div>
                    </div>
                </div>
            ))}
        </div>
    );
};

const ProfilePage = () => {
    const { state, dispatch } = useAppContext();
    const { currentCustomer, helpdeskTickets } = state;
    const [isAddressModalOpen, setAddressModalOpen] = useState(false);
    const [isTicketModalOpen, setTicketModalOpen] = useState(false);
    const [viewingTicket, setViewingTicket] = useState<HelpdeskTicket | null>(null);

    const customerTickets = useMemo(() => {
        return currentCustomer ? helpdeskTickets.filter(t => t.customerId === currentCustomer.id) : [];
    }, [helpdeskTickets, currentCustomer]);

    if (!currentCustomer) return null;

    return (
        <div className="p-4 space-y-4 pt-20">
            <header className="fixed top-0 left-0 right-0 max-w-xl mx-auto bg-primary-600 dark:bg-primary-700 text-white p-4 flex justify-between items-center shadow-md flex-shrink-0 z-10">
                <h1 className="text-xl font-bold">Profil Saya</h1>
            </header>
            <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow">
                <p><strong>Nama:</strong> {currentCustomer.name}</p>
                <p><strong>Email:</strong> {currentCustomer.email}</p>
                <p><strong>Telepon:</strong> {currentCustomer.phone}</p>
            </div>
             <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow">
                <h2 className="font-bold mb-2">Alamat Saya</h2>
                {currentCustomer.addresses.map(addr => (
                    <div key={addr.id} className="text-sm border-b pb-2 mb-2 dark:border-gray-700">
                        <p><strong>{addr.label}</strong> {addr.isPrimary && <span className="text-xs text-primary-500 font-bold">(Utama)</span>}</p>
                        <p className="text-gray-600 dark:text-gray-400">{addr.detail}, {addr.village}, {addr.district}, {addr.city}</p>
                    </div>
                ))}
                <Button onClick={() => setAddressModalOpen(true)} className="w-full mt-2">Tambah Alamat Baru</Button>
            </div>
            
            <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow">
                <h2 className="font-bold mb-2">Tiket Bantuan</h2>
                 {customerTickets.map(ticket => (
                    <button key={ticket.id} onClick={() => setViewingTicket(ticket)} className="w-full text-left p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700/50 flex justify-between items-center">
                        <div>
                            <p className="font-semibold">{ticket.subject}</p>
                            <p className="text-xs text-gray-500">{new Date(ticket.createdDate).toLocaleString('id-ID')}</p>
                        </div>
                        <Badge variant={ticket.status === 'Closed' ? 'neutral' : 'success'}>{ticket.status}</Badge>
                    </button>
                 ))}
                 <Button onClick={() => setTicketModalOpen(true)} className="w-full mt-2">Buat Tiket Baru</Button>
            </div>

            <Button onClick={() => alert("Fitur ganti PIN akan datang!")} className="w-full">Ganti PIN</Button>
            <button onClick={() => dispatch({ type: 'auth/customerLogout' })} className="w-full text-center p-3 text-red-500 font-semibold">Logout</button>
            <AddressModal isOpen={isAddressModalOpen} onClose={() => setAddressModalOpen(false)} />
            {isTicketModalOpen && <TicketModal isOpen={true} onClose={() => setTicketModalOpen(false)} />}
            {viewingTicket && <TicketViewModal ticket={viewingTicket} isOpen={true} onClose={() => setViewingTicket(null)} />}
        </div>
    );
};

// --- New Ticket Modals ---
const TicketModal: React.FC<{ isOpen: boolean; onClose: () => void }> = ({ isOpen, onClose }) => {
    const { dispatch } = useAppContext();
    const [subject, setSubject] = useState('');
    const [message, setMessage] = useState('');
    
    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        dispatch({ type: 'helpdesk/addTicket', payload: { subject, initialMessage: message, priority: 'Medium' } });
        onClose();
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Buat Tiket Bantuan Baru" footer={<Button onClick={handleSubmit}>Kirim</Button>}>
            <form onSubmit={handleSubmit} className="space-y-4">
                <Input value={subject} onChange={e => setSubject(e.target.value)} placeholder="Subjek" required />
                <Textarea value={message} onChange={e => setMessage(e.target.value)} placeholder="Jelaskan masalah Anda..." required />
            </form>
        </Modal>
    );
};

const TicketViewModal: React.FC<{ isOpen: boolean; onClose: () => void; ticket: HelpdeskTicket }> = ({ isOpen, onClose, ticket }) => {
    const { dispatch } = useAppContext();
    const [reply, setReply] = useState('');
    const chatEndRef = useRef<HTMLDivElement>(null);
    
    useEffect(() => {
        chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [ticket.messages]);

    const handleSend = (e: React.FormEvent) => {
        e.preventDefault();
        if (reply.trim()) {
            dispatch({ type: 'helpdesk/addMessage', payload: { ticketId: ticket.id, text: reply, sender: 'user' } });
            setReply('');
        }
    };
    
    return (
        <Modal isOpen={isOpen} onClose={onClose} title={ticket.subject}>
            <div className="h-96 flex flex-col">
                <div className="flex-grow overflow-y-auto p-2 space-y-2">
                    {ticket.messages.map(msg => (
                        <div key={msg.id} className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                            <div className={`max-w-[80%] p-2 rounded-lg text-sm ${msg.sender === 'user' ? 'bg-primary-500 text-white' : 'bg-gray-200 dark:bg-gray-700'}`}>
                                {msg.text}
                            </div>
                        </div>
                    ))}
                    <div ref={chatEndRef} />
                </div>
                <form onSubmit={handleSend} className="flex gap-2 p-2 border-t dark:border-gray-700">
                    <Input value={reply} onChange={e => setReply(e.target.value)} placeholder="Ketik balasan..." />
                    <Button type="submit">Kirim</Button>
                </form>
            </div>
        </Modal>
    );
};


// --- Main Customer Portal ---

type CustomerPage = 'home' | 'orders' | 'events' | 'profile' | 'bills';

export const CustomerPortal: React.FC = () => {
    const [page, setPage] = useState<CustomerPage>('home');

    const renderPage = () => {
        switch (page) {
            case 'home': return <HomePage setPage={setPage} />;
            case 'orders': return <OrdersPage />;
            case 'events': return <EventsPage />;
            case 'profile': return <ProfilePage />;
            case 'bills': return <BillsPage />;
            default: return <HomePage setPage={setPage} />;
        }
    }
    
    const NavItem: React.FC<{
        label: string;
        pageName: CustomerPage;
        icon: React.ReactElement;
    }> = ({ label, pageName, icon }) => (
        <button onClick={() => setPage(pageName)} className={`flex-1 p-2 flex flex-col items-center justify-center gap-1 ${page === pageName ? 'text-primary-500' : 'text-gray-500 dark:text-gray-400'}`}>
            {React.cloneElement<{ className?: string }>(icon, { className: "w-6 h-6" })}
            <span className="text-xs font-medium">{label}</span>
        </button>
    );

    return (
        <div className="max-w-xl mx-auto bg-gray-100 dark:bg-gray-900 h-screen flex flex-col font-sans">
            <main className="flex-grow overflow-y-auto pb-16">
                {renderPage()}
            </main>

            <nav className="fixed bottom-0 left-0 right-0 max-w-xl mx-auto bg-white dark:bg-gray-800 border-t dark:border-gray-700 flex justify-around flex-shrink-0 z-10">
                <NavItem label="Beranda" pageName="home" icon={<DashboardIcon/>} />
                <NavItem label="Pesanan" pageName="orders" icon={<PurchaseListIcon/>} />
                <NavItem label="Profil" pageName="profile" icon={<UserCircleIcon/>} />
            </nav>
        </div>
    );
};

// --- New Events Page ---
const TicketPurchaseModal: React.FC<{ isOpen: boolean, onClose: () => void, event: Event | null }> = ({ isOpen, onClose, event }) => {
    const { state, dispatch } = useAppContext();
    const { currentCustomer } = state;
    const [tierId, setTierId] = useState('');
    const [quantity, setQuantity] = useState(1);
    const [paymentMethod, setPaymentMethod] = useState<'deposit' | 'va' | 'transfer'>('deposit');
    const [isPinModalOpen, setPinModalOpen] = useState(false);
    
    useEffect(() => {
        if (isOpen && event?.ticketTiers.length) {
            setTierId(event.ticketTiers[0].id);
            setQuantity(1);
            setPaymentMethod('deposit');
        } else if (!isOpen) {
            setTierId('');
            setQuantity(1);
        }
    }, [isOpen, event]);

    const totalPrice = useMemo(() => {
        if (!event || !tierId) return 0;
        const tier = event.ticketTiers.find(t => t.id === tierId);
        return (tier?.price || 0) * quantity;
    }, [event, tierId, quantity]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!event || !tierId || quantity <= 0) {
            alert("Harap lengkapi pilihan.");
            return;
        }
        if(paymentMethod === 'deposit') {
             if ((currentCustomer?.depositBalance || 0) < totalPrice) {
                alert("Saldo deposit tidak mencukupi.");
                return;
            }
            setPinModalOpen(true);
        } else {
             dispatch({ type: 'events/createTicketSaleFromPortal', payload: { eventId: event.id, ticketTierId: tierId, quantity, paymentMethod } });
             alert('Pembelian tiket berhasil ditambahkan ke tagihan Anda!');
             onClose();
        }
    };
    
    const handlePinConfirm = (pin: string) => {
        if(pin === currentCustomer?.pin) {
            setPinModalOpen(false);
            dispatch({ type: 'events/createTicketSaleWithDeposit', payload: { eventId: event!.id, ticketTierId: tierId, quantity }});
            onClose();
        } else {
            alert("PIN Salah!");
        }
    };
    
    if (!event) return null;

    return (
        <>
            <Modal isOpen={isOpen} onClose={onClose} title={`Beli Tiket: ${event.name}`}>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <Select value={tierId} onChange={e => setTierId(e.target.value)} required>
                        <option value="">-- Pilih Jenis Tiket --</option>
                        {event.ticketTiers.map(t => <option key={t.id} value={t.id}>{t.name} (Rp{t.price.toLocaleString('id-ID')})</option>)}
                    </Select>
                    <Input type="number" min="1" value={quantity} onChange={e => setQuantity(Number(e.target.value))} placeholder="Jumlah" />
                    <div>
                        <Label>Metode Pembayaran</Label>
                        <Select value={paymentMethod} onChange={e => setPaymentMethod(e.target.value as any)}>
                             <option value="deposit">Saldo Deposit (Rp{currentCustomer?.depositBalance.toLocaleString('id-ID')})</option>
                            <option value="va">Bayar di Kasir (VA)</option>
                            <option value="transfer">Transfer Bank</option>
                        </Select>
                    </div>
                    <p className="text-xl font-bold">Total: Rp{totalPrice.toLocaleString('id-ID')}</p>
                     <div className="flex justify-end pt-4 gap-2">
                        <Button variant="secondary" onClick={onClose}>Batal</Button>
                        <Button type="submit">Beli Tiket</Button>
                    </div>
                </form>
            </Modal>
             <PINModal
                isOpen={isPinModalOpen}
                onClose={() => setPinModalOpen(false)}
                onConfirm={handlePinConfirm}
                title="Verifikasi Pembayaran"
                description="Masukkan PIN untuk membayar dengan Saldo Deposit."
            />
        </>
    );
}

const EventsPage = () => {
    const { state } = useAppContext();
    const { events } = state;
    const [isPurchaseModalOpen, setPurchaseModalOpen] = useState(false);
    const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);

    const handleBuyTicket = (event: Event) => {
        setSelectedEvent(event);
        setPurchaseModalOpen(true);
    };

    return (
        <div className="p-4 space-y-4 pt-20">
            <header className="fixed top-0 left-0 right-0 max-w-xl mx-auto bg-primary-600 dark:bg-primary-700 text-white p-4 flex justify-between items-center shadow-md flex-shrink-0 z-10">
                <h1 className="text-xl font-bold">Acara & Pertunjukan</h1>
            </header>
            <div className="space-y-4">
                {events.map(event => (
                    <div key={event.id} className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow">
                        <h2 className="text-lg font-bold">{event.name}</h2>
                        <p className="text-sm text-gray-500">{new Date(event.date).toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
                        {event.startTime && event.endTime && (
                            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">{event.startTime} - {event.endTime}</p>
                        )}
                        <div className="flex justify-between items-end mt-2">
                             <div className="text-xs">
                                {event.ticketTiers.map(t => <p key={t.id}>{t.name}: <strong>Rp{t.price.toLocaleString('id-ID')}</strong></p>)}
                            </div>
                            <Button onClick={() => handleBuyTicket(event)}>Beli Tiket</Button>
                        </div>
                    </div>
                ))}
            </div>
            <TicketPurchaseModal isOpen={isPurchaseModalOpen} onClose={() => setPurchaseModalOpen(false)} event={selectedEvent} />
        </div>
    );
};

const BillsPage = () => {
    const { state } = useAppContext();
    const { customerBills, currentCustomer } = state;
    const [isPaymentModalOpen, setPaymentModalOpen] = useState(false);
    const [selectedBill, setSelectedBill] = useState<CustomerBill | null>(null);

    const unpaidBills = useMemo(() => {
        return customerBills
            .filter(b => b.customerId === currentCustomer?.id && b.status === 'Unpaid')
            .sort((a,b) => new Date(b.billDate).getTime() - new Date(a.billDate).getTime());
    }, [customerBills, currentCustomer]);

    const handleShowPayment = (bill: CustomerBill) => {
        setSelectedBill(bill);
        setPaymentModalOpen(true);
    };

    return (
        <div className="p-4 space-y-4 pt-20">
            <header className="fixed top-0 left-0 right-0 max-w-xl mx-auto bg-primary-600 dark:bg-primary-700 text-white p-4 flex justify-between items-center shadow-md flex-shrink-0 z-10">
                <h1 className="text-xl font-bold">Tagihan Saya</h1>
            </header>
            {unpaidBills.length === 0 ? (
                <p className="text-center text-gray-500 dark:text-gray-400 mt-8">Anda tidak memiliki tagihan yang belum lunas.</p>
            ) : (
                unpaidBills.map(bill => (
                    <Card key={bill.id} className="space-y-2">
                        <div className="flex justify-between items-center text-sm text-gray-600 dark:text-gray-400">
                             <span className="font-bold text-gray-800 dark:text-gray-200">Tagihan #{bill.id}</span>
                             <span>Jatuh Tempo: {new Date(bill.dueDate).toLocaleDateString('id-ID')}</span>
                        </div>
                        <p className="text-sm text-gray-600 dark:text-gray-400 border-t border-b dark:border-gray-700 py-2 my-2">{bill.description}</p>
                         <div className="flex justify-between items-center">
                             <div>
                                <p className="text-xs text-gray-500">Total</p>
                                <p className="text-lg font-bold text-red-500">Rp{bill.amount.toLocaleString('id-ID')}</p>
                             </div>
                             <Button onClick={() => handleShowPayment(bill)}>Bayar</Button>
                        </div>
                    </Card>
                ))
            )}
             <PaymentInstructionsModal
                isOpen={isPaymentModalOpen}
                onClose={() => setPaymentModalOpen(false)}
                bill={selectedBill}
            />
        </div>
    );
};

// --- NEW MODALS FOR NEW FEATURES ---
const WithdrawModal: React.FC<{ isOpen: boolean; onClose: () => void; }> = ({ isOpen, onClose }) => {
    const { state, dispatch } = useAppContext();
    const { currentCustomer } = state;
    const [amount, setAmount] = useState('');
    const [isPinModalOpen, setPinModalOpen] = useState(false);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const numAmount = parseFloat(amount);
        if (!numAmount || numAmount <= 0) {
            alert("Masukkan jumlah yang valid.");
            return;
        }
        if (numAmount > (currentCustomer?.depositBalance || 0)) {
            alert("Saldo tidak mencukupi.");
            return;
        }
        setPinModalOpen(true);
    };
    
    const handlePinConfirm = (pin: string) => {
        setPinModalOpen(false);
        dispatch({ type: 'customers/createWithdrawalToken', payload: { amount: parseFloat(amount), pin } });
        // The useEffect in HomePage will handle closing this modal if a token is generated
    };
    
    return (
      <>
        <Modal isOpen={isOpen} onClose={onClose} title="Tarik Saldo di Kasir">
            <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                    <Label>Jumlah Penarikan (Rp)</Label>
                    <Input type="number" value={amount} onChange={e => setAmount(e.target.value)} placeholder="e.g., 100000" required />
                    <p className="text-xs text-gray-500 mt-1">Saldo Anda: Rp{currentCustomer?.depositBalance.toLocaleString('id-ID')}</p>
                </div>
                <div className="flex justify-end pt-4">
                    <Button type="submit">Buat Token Penarikan</Button>
                </div>
            </form>
        </Modal>
        <PINModal 
            isOpen={isPinModalOpen} 
            onClose={() => setPinModalOpen(false)} 
            onConfirm={handlePinConfirm}
            title="Verifikasi Penarikan"
            description="Masukkan PIN Anda untuk membuat token penarikan."
        />
      </>
    );
};

const TokenDisplayModal: React.FC<{ isOpen: boolean; onClose: () => void; token: DepositWithdrawalToken | null; }> = ({ isOpen, onClose, token }) => {
    if (!isOpen || !token) return null;
    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Token Penarikan Anda">
            <div className="text-center space-y-4">
                <p>Tunjukkan token ini kepada kasir untuk menarik tunai sebesar <strong>Rp{token.amount.toLocaleString('id-ID')}</strong>.</p>
                <div className="bg-gray-100 dark:bg-gray-700 p-4 rounded-lg">
                    <p className="text-4xl font-bold font-mono tracking-widest text-primary-600 dark:text-primary-400">{token.id}</p>
                </div>
                <p className="text-sm text-red-500">Token ini akan kedaluwarsa dalam 15 menit.</p>
            </div>
        </Modal>
    );
};

const PayBillModal: React.FC<{ isOpen: boolean; onClose: () => void; }> = ({ isOpen, onClose }) => {
    const { state, dispatch } = useAppContext();
    const { customerBills, currentCustomer } = state;
    const [vaNumber, setVaNumber] = useState('');
    const [isPinModalOpen, setPinModalOpen] = useState(false);
    
    const billToPay = useMemo(() => {
        if (!vaNumber) return null;
        return customerBills.find(b => b.virtualAccountNumber === vaNumber && b.status === 'Unpaid');
    }, [vaNumber, customerBills]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!billToPay) {
            alert("Nomor Virtual Account tidak ditemukan atau sudah lunas.");
            return;
        }
        if ((currentCustomer?.depositBalance || 0) < billToPay.amount) {
            alert("Saldo deposit Anda tidak cukup untuk membayar tagihan ini.");
            return;
        }
        setPinModalOpen(true);
    };

    const handlePinConfirm = (pin: string) => {
        dispatch({ type: 'customers/payBillWithDeposit', payload: { virtualAccountNumber: vaNumber, pin } });
        setPinModalOpen(false);
        alert("Pembayaran berhasil!");
        onClose();
    };
    
    useEffect(() => {
        if (!isOpen) {
            setVaNumber('');
        }
    }, [isOpen]);

    return (
      <>
        <Modal isOpen={isOpen} onClose={onClose} title="Bayar Tagihan">
            <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                    <Label>Nomor Virtual Account</Label>
                    <Input value={vaNumber} onChange={e => setVaNumber(e.target.value)} placeholder="Masukkan nomor VA" required />
                </div>
                {billToPay && (
                    <div className="p-4 bg-gray-100 dark:bg-gray-700/50 rounded-lg text-sm space-y-1">
                        <p><strong>Penerima:</strong> {billToPay.customerName}</p>
                        <p><strong>Deskripsi:</strong> {billToPay.description}</p>
                        <p className="font-bold text-lg"><strong>Jumlah:</strong> Rp{(billToPay?.amount || 0).toLocaleString('id-ID')}</p>
                    </div>
                )}
                <div className="flex justify-end pt-4">
                    <Button type="submit" disabled={!billToPay}>Lanjutkan Pembayaran</Button>
                </div>
            </form>
        </Modal>
        <PINModal
            isOpen={isPinModalOpen}
            onClose={() => setPinModalOpen(false)}
            onConfirm={handlePinConfirm}
            title="Verifikasi Pembayaran"
            description={`Anda akan membayar tagihan sebesar Rp${(billToPay?.amount || 0).toLocaleString('id-ID')} menggunakan saldo deposit Anda.`}
        />
      </>
    );
};

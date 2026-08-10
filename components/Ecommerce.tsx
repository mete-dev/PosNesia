import React, { useState, useMemo, useEffect } from 'react';
import { useAppContext } from '../hooks/useAppContext';
import { applyPromotionsToCart } from '../utils/promotionUtils';
import { Product, Page, Customer, DeliveryInfo } from '../types';
import { Input, Label, Button, Modal } from './ui';

// --- New Checkout Modal ---
const CheckoutModal: React.FC<{
    isOpen: boolean;
    onClose: () => void;
}> = ({ isOpen, onClose }) => {
    const { state, dispatch } = useAppContext();
    const { cart, promotions, products, customers, ecommerceSettings } = state;

    const [step, setStep] = useState(1);
    const [deliveryType, setDeliveryType] = useState<'pickup' | 'delivery'>('pickup');
    const [deliveryService, setDeliveryService] = useState<'standard' | 'express'>('standard');
    const [address, setAddress] = useState('');
    const [customerId, setCustomerId] = useState('');
    const [pointsToUse, setPointsToUse] = useState(0);
    const [depositToUse, setDepositToUse] = useState(0);
    const [voucherCode, setVoucherCode] = useState('');

    const selectedCustomer = useMemo(() => customers.find(c => c.id === customerId), [customerId, customers]);
    const { cartWithDiscounts, totalDiscount } = useMemo(() => applyPromotionsToCart(cart, promotions, products, selectedCustomer), [cart, promotions, products, selectedCustomer]);

    const subtotal = cart.reduce((sum, item) => sum + item.product.price * item.quantity, 0);
    const deliveryFee = deliveryType === 'delivery' ? (deliveryService === 'standard' ? ecommerceSettings.deliveryFeeStandard : ecommerceSettings.deliveryFeeExpress) : 0;
    
    let totalAfterDiscounts = subtotal - totalDiscount;
    const maxPointsToUse = selectedCustomer ? Math.min(selectedCustomer.points, totalAfterDiscounts) : 0;
    const maxDepositToUse = selectedCustomer ? Math.min(selectedCustomer.depositBalance, totalAfterDiscounts - pointsToUse) : 0;
    
    // Ensure used points/deposit don't exceed limits
    const safePointsToUse = Math.min(pointsToUse, maxPointsToUse);
    const safeDepositToUse = Math.min(depositToUse, maxDepositToUse);

    const grandTotal = subtotal - totalDiscount - safePointsToUse - safeDepositToUse + deliveryFee;

    const handleNextStep = () => {
        if (deliveryType === 'delivery' && subtotal < ecommerceSettings.minTransactionForDelivery) {
            alert(`Minimum transaction for delivery is Rp${ecommerceSettings.minTransactionForDelivery.toLocaleString('id-ID')}.`);
            return;
        }
        setStep(step + 1);
    }
    
    const handleCheckout = () => {
        if (deliveryType === 'delivery' && !address) {
            alert('Alamat pengiriman harus diisi.');
            return;
        }
        if (!customerId) {
            alert('Silakan pilih pelanggan.');
            return;
        }

        const deliveryInfo: DeliveryInfo = {
            type: deliveryType,
            address: deliveryType === 'delivery' ? address : undefined,
            deliveryFee: deliveryFee,
            estimatedTime: deliveryService === 'standard' ? '2-3 hari' : '1 hari'
        };

        dispatch({
            type: 'sales/processFromCart',
            payload: {
                customerId,
                paymentMethodId: 'pm5', // Default to 'Hutang' for COD, could be another selection
                paymentTermId: 'pt1', // 'Langsung'
                deliveryInfo,
                pointsToUse: safePointsToUse,
                depositToUse: safeDepositToUse,
                codAmount: grandTotal,
            }
        });
        
        alert('Transaksi berhasil!');
        onClose();
    };

    useEffect(() => {
        if (!isOpen) {
            // Reset state on close
            setTimeout(() => {
                setStep(1);
                setPointsToUse(0);
                setDepositToUse(0);
                setCustomerId('');
            }, 300); // After transition
        }
    }, [isOpen]);
    
    const footer = (
        <div className="w-full">
            <div className="space-y-2 mb-4">
                <div className="flex justify-between text-sm"><span>Subtotal</span><span>Rp{subtotal.toLocaleString('id-ID')}</span></div>
                <div className="flex justify-between text-sm text-green-500"><span>Diskon Promosi</span><span>- Rp{totalDiscount.toLocaleString('id-ID')}</span></div>
                {deliveryFee > 0 && <div className="flex justify-between text-sm"><span>Ongkos Kirim</span><span>Rp{deliveryFee.toLocaleString('id-ID')}</span></div>}
                {safePointsToUse > 0 && <div className="flex justify-between text-sm text-green-500"><span>Poin Digunakan</span><span>- Rp{safePointsToUse.toLocaleString('id-ID')}</span></div>}
                {safeDepositToUse > 0 && <div className="flex justify-between text-sm text-green-500"><span>Saldo Digunakan</span><span>- Rp{safeDepositToUse.toLocaleString('id-ID')}</span></div>}
                <div className="flex justify-between font-bold text-xl pt-2 border-t dark:border-gray-600"><span>Total</span><span>Rp{grandTotal.toLocaleString('id-ID')}</span></div>
            </div>
            <div className="flex justify-between items-center">
                {step > 1 && <button onClick={() => setStep(step - 1)} className="text-primary-600 font-semibold">Kembali</button>}
                <div className="flex-grow"></div>
                {step === 1 && <Button onClick={handleNextStep} className="w-full">Lanjut</Button>}
                {step === 2 && <Button onClick={handleCheckout} className="w-full" disabled={!customerId}>Selesaikan Pesanan</Button>}
            </div>
        </div>
    );

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Checkout" footer={footer}>
             {/* Step 1: Delivery */}
             {step === 1 && (
                <div className="space-y-6">
                    <h3 className="text-xl font-semibold">Opsi Pengambilan / Pengiriman</h3>
                    <div className="grid grid-cols-2 gap-4">
                        <button onClick={() => setDeliveryType('pickup')} className={`p-4 border rounded-lg text-left ${deliveryType === 'pickup' ? 'border-primary-500 ring-2 ring-primary-500' : 'dark:border-gray-600'}`}>
                            <h4 className="font-bold">Ambil di Toko</h4>
                            <p className="text-sm text-gray-500">Gratis</p>
                        </button>
                        <button onClick={() => setDeliveryType('delivery')} className={`p-4 border rounded-lg text-left ${deliveryType === 'delivery' ? 'border-primary-500 ring-2 ring-primary-500' : 'dark:border-gray-600'}`}>
                            <h4 className="font-bold">Diantar</h4>
                            <p className="text-sm text-gray-500">Mulai dari Rp{ecommerceSettings.deliveryFeeStandard.toLocaleString('id-ID')}</p>
                        </button>
                    </div>
                    {deliveryType === 'delivery' && (
                        <>
                            <h4 className="font-semibold pt-4">Layanan Pengiriman</h4>
                            <div className="grid grid-cols-2 gap-4">
                                    <button onClick={() => setDeliveryService('standard')} className={`p-4 border rounded-lg text-left ${deliveryService === 'standard' ? 'border-primary-500 ring-2 ring-primary-500' : 'dark:border-gray-600'}`}>
                                    <h4 className="font-bold">Reguler</h4>
                                    <p className="text-sm text-gray-500">Rp{ecommerceSettings.deliveryFeeStandard.toLocaleString('id-ID')}</p>
                                </button>
                                    <button onClick={() => setDeliveryService('express')} className={`p-4 border rounded-lg text-left ${deliveryService === 'express' ? 'border-primary-500 ring-2 ring-primary-500' : 'dark:border-gray-600'}`}>
                                    <h4 className="font-bold">Utama</h4>
                                    <p className="text-sm text-gray-500">Rp{ecommerceSettings.deliveryFeeExpress.toLocaleString('id-ID')}</p>
                                </button>
                            </div>
                            <div>
                                <Label htmlFor="address">Alamat Pengiriman</Label>
                                <textarea id="address" value={address} onChange={e => setAddress(e.target.value)} rows={3} className="mt-1 block w-full rounded-md bg-gray-100 dark:bg-gray-700 border-transparent"></textarea>
                            </div>
                        </>
                    )}
                </div>
            )}
            
            {/* Step 2: Payment */}
            {step === 2 && (
                <div className="space-y-6">
                    <h3 className="text-xl font-semibold">Pembayaran</h3>
                        <div>
                        <Label htmlFor="customer">Pilih Pelanggan</Label>
                        <select id="customer" value={customerId} onChange={e => setCustomerId(e.target.value)} required className="mt-1 w-full rounded-md bg-gray-100 dark:bg-gray-700 border-transparent">
                            <option value="">-- Pilih Pelanggan --</option>
                            {customers.map(c => <option key={c.id} value={c.id}>{c.name} (Poin: {c.points}, Saldo: Rp{c.depositBalance.toLocaleString('id-ID')})</option>)}
                        </select>
                    </div>
                        {selectedCustomer && (
                        <div className="space-y-4 p-4 border rounded-lg dark:border-gray-600">
                            <h4 className="font-semibold">Gunakan Poin & Saldo</h4>
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
                    )}
                    <div>
                        <Label>Metode Pembayaran Akhir</Label>
                        <div className="mt-2 p-4 border rounded-lg dark:border-gray-600 font-bold">
                            Cash on Delivery (COD)
                        </div>
                    </div>
                </div>
            )}
        </Modal>
    );
};


// --- Storefront Page ---
const ProductCard: React.FC<{ product: Product; onAddToCart: (product: Product) => void; stock: number; }> = ({ product, onAddToCart, stock }) => (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg overflow-hidden flex flex-col">
        <img src={product.imageUrl} alt={product.name} className="w-full h-48 object-cover" />
        <div className="p-4 flex flex-col flex-grow">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white truncate">{product.name}</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 flex-grow">{product.description || 'No description available.'}</p>
            <div className="flex justify-between items-center mt-4">
                <p className="text-xl font-extrabold text-primary-600 dark:text-primary-400">Rp{product.price.toLocaleString('id-ID')}</p>
                <button
                    onClick={() => onAddToCart(product)}
                    disabled={stock <= 0}
                    className="px-4 py-2 rounded-lg text-sm font-semibold text-white bg-primary-600 hover:bg-primary-700 disabled:bg-gray-400"
                >
                    {stock > 0 ? 'Tambah' : 'Stok Habis'}
                </button>
            </div>
        </div>
    </div>
);

const CartSidebar: React.FC<{ isOpen: boolean, onClose: () => void, onCheckout: () => void }> = ({ isOpen, onClose, onCheckout }) => {
    const { state, dispatch } = useAppContext();
    const { cart, promotions, products } = state;
    const { cartWithDiscounts, totalDiscount } = useMemo(() => applyPromotionsToCart(cart, promotions, products), [cart, promotions, products]);
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

export const EcommerceStorefrontPage: React.FC = () => {
    const { state, dispatch } = useAppContext();
    const { products, inventoryLevels, currentBranchId } = state;
    const [isCartOpen, setCartOpen] = useState(false);
    const [isCheckoutOpen, setCheckoutOpen] = useState(false);

    const inventoryMap = useMemo(() => {
        const map = new Map<string, number>();
        // E-commerce pulls from the currently selected branch stock
        const locationId = currentBranchId || 'b1'; // Fallback to main branch
        inventoryLevels
            .filter(level => level.locationId === locationId)
            .forEach(level => map.set(level.productId, level.quantity));
        return map;
    }, [inventoryLevels, currentBranchId]);

    const handleAddToCart = (product: Product) => {
        const stock = inventoryMap.get(product.id) || 0;
        if (stock > 0) {
            dispatch({ type: 'cart/add', payload: product });
            setCartOpen(true);
        }
    };

    return (
        <div className="h-full flex flex-col bg-gray-100 dark:bg-gray-900">
            <header className="flex justify-between items-center p-4 bg-white dark:bg-gray-800 shadow-md">
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Toko Online</h1>
                <button onClick={() => setCartOpen(true)} className="relative p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" /></svg>
                    {state.cart.length > 0 && <span className="absolute top-0 right-0 inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-red-100 transform translate-x-1/2 -translate-y-1/2 bg-red-600 rounded-full">{state.cart.reduce((sum, item) => sum + item.quantity, 0)}</span>}
                </button>
            </header>
            <main className="flex-grow p-6 overflow-y-auto">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {products.map(p => {
                        const stock = inventoryMap.get(p.id) || 0;
                        return <ProductCard key={p.id} product={p} stock={stock} onAddToCart={handleAddToCart} />;
                    })}
                </div>
            </main>
            <CartSidebar isOpen={isCartOpen} onClose={() => setCartOpen(false)} onCheckout={() => { setCartOpen(false); setCheckoutOpen(true); }} />
            <CheckoutModal isOpen={isCheckoutOpen} onClose={() => setCheckoutOpen(false)} />
        </div>
    );
};

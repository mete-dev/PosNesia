import React, { useMemo, useEffect } from 'react';
import { useAppContext } from '../hooks/useAppContext';
import { Product, Promotion, Shelf, Page, ProductTypeLocation } from '../types';
import { PrintLayout, Button, PageHeader } from './ui';
import { StoreIcon } from './icons';
import { Printer } from 'lucide-react';

const PriceLabel: React.FC<{
    product: Product;
    promotion?: Promotion;
    locationId: string | null;
    showRackLocation?: boolean;
}> = ({ product, promotion, locationId, showRackLocation = true }) => {
    const { state } = useAppContext();
    const { companyInfo = { name: 'PosNesia' }, shelves = [], productTypeLocations = [], branches = [], warehouses = [], categories = [] } = state || {};

    const shelfMap = useMemo(() => new Map((shelves || []).map(s => [s.id, s.code])), [shelves]);
    const categoryMap = useMemo(() => new Map((categories || []).map(c => [c.id, c.name])), [categories]);

    const getLocation = (p: Product) => {
        if (!locationId) return 'RACK-01';
        
        const branch = branches.find(b => b.id === locationId);
        const warehouse = warehouses.find(w => w.id === locationId);
    
        let locationType: 'branch' | 'warehouse' | undefined;
        let locationTypeId: string | undefined;
    
        if (branch) {
            locationType = 'branch';
            locationTypeId = branch.branchTypeId;
        } else if (warehouse) {
            locationType = 'warehouse';
            locationTypeId = warehouse.warehouseTypeId;
        }
        
        if (!locationType || !locationTypeId) return 'RACK-01';
    
        const locationInfo = productTypeLocations.find(loc => 
            loc.productId === p.id && 
            loc.locationTypeId === locationTypeId && 
            loc.locationType === locationType
        );
    
        if (!locationInfo) return 'RACK-01';
    
        const shelfCode = locationInfo.shelfId ? shelfMap.get(locationInfo.shelfId) : 'RACK';
        const shelving = locationInfo.shelvingNumber || '';
        return `${shelfCode}${shelving ? `-${shelving}`: ''}`;
    };

    const location = getLocation(product);
    const barcode = product.barcode || product.sku || product.id;
    const categoryName = product.categoryId ? (categoryMap.get(product.categoryId) || 'UMUM') : 'UMUM';
    const price = product.price;
    const unit = product.unit || 'Pcs';
    const printDate = new Date().toLocaleDateString('id-ID', { day: '2-digit', month: '2-digit', year: '2-digit' });

    const getDiscountedPrice = () => {
        if (!promotion) return null;
        const benefit = promotion.benefit;
        if (benefit.type === 'percentage_discount') {
            return price * (1 - benefit.value / 100);
        }
        if (benefit.type === 'fixed_discount') {
            return Math.max(0, price - benefit.value);
        }
        return null;
    };

    const discountedPrice = getDiscountedPrice();

    // Visual Barcode Simulation Component
    const RenderBarcode = ({ code }: { code: string }) => {
        const bars = useMemo(() => {
            const pattern = [];
            for (let i = 0; i < code.length; i++) {
                const charCode = code.charCodeAt(i);
                pattern.push((charCode % 3) + 1);
                pattern.push(1);
                pattern.push(((charCode * 2) % 3) + 1);
            }
            return pattern.slice(0, 36);
        }, [code]);

        return (
            <div className="flex flex-col items-center">
                <div className="flex items-end h-5 gap-[1px]">
                    {bars.map((w, idx) => (
                        <div key={idx} className={`bg-black h-full`} style={{ width: `${w * 1.2}px` }} />
                    ))}
                </div>
                <span className="font-mono text-[7px] tracking-wider leading-none mt-0.5 font-bold text-gray-800">{code}</span>
            </div>
        );
    };

    // --- PROMO LABEL DESIGN ---
    if (promotion && discountedPrice !== null) {
        const promoPeriod = `${new Date(promotion.startDate).toLocaleDateString('id-ID', { day: '2-digit', month: '2-digit' })} - ${new Date(promotion.endDate).toLocaleDateString('id-ID', { day: '2-digit', month: '2-digit' })}`;
        const discountPercentage = Math.round(((price - discountedPrice) / price) * 100);

        return (
            <div className="bg-white text-black flex flex-col justify-between h-[3.5cm] w-[5.5cm] border-2 border-rose-600 rounded-md p-1.5 font-sans relative overflow-hidden box-border print:shadow-none print:m-1">
                {/* Header Accent Bar */}
                <div className="bg-rose-600 text-white -mx-1.5 -mt-1.5 px-2 py-0.5 flex justify-between items-center mb-1">
                    <span className="font-black text-[9px] uppercase tracking-wider truncate max-w-[130px]">
                        {companyInfo.name}
                    </span>
                    <span className="font-black text-[8px] bg-white text-rose-700 px-1.5 py-0.2 rounded uppercase">
                        PROMO {discountPercentage > 0 ? `${discountPercentage}%` : ''}
                    </span>
                </div>

                {/* Product Name */}
                <div className="my-0.5">
                    <p className="text-[10px] font-black text-gray-900 leading-tight uppercase line-clamp-2">
                        {product.name}
                    </p>
                </div>

                {/* Price Box */}
                <div className="bg-rose-50 border border-rose-200 rounded px-1.5 py-1 flex items-center justify-between my-0.5">
                    <div>
                        <span className="text-[6.5px] font-bold text-gray-400 block leading-none">SEBELUMNYA</span>
                        <span className="text-[9.5px] font-extrabold text-gray-400 line-through font-mono leading-none">
                            Rp{price.toLocaleString('id-ID')}
                        </span>
                    </div>
                    <div className="text-right">
                        <div className="flex items-baseline justify-end gap-0.5">
                            <span className="text-[8px] font-black text-rose-600">Rp</span>
                            <span className="text-[20px] font-black text-rose-600 tracking-tight font-mono leading-none">
                                {discountedPrice.toLocaleString('id-ID')}
                            </span>
                        </div>
                        <span className="text-[7px] text-gray-500 font-bold block leading-none">/ {unit}</span>
                    </div>
                </div>

                {/* Footer / Barcode & Details */}
                <div className="flex items-end justify-between border-t border-slate-200 pt-0.5 mt-0.5">
                    <RenderBarcode code={barcode} />
                    <div className="text-right flex flex-col justify-end text-[6.5px] text-gray-500">
                        {showRackLocation && (
                            <span className="font-mono font-bold text-gray-700 bg-gray-100 px-1 py-0.2 rounded">
                                RAK: {location}
                            </span>
                        )}
                        <span className="mt-0.5 font-medium">{promoPeriod}</span>
                    </div>
                </div>
            </div>
        );
    }

    // --- STANDARD LABEL DESIGN ---
    return (
        <div className="bg-white text-black flex flex-col justify-between h-[3.5cm] w-[5.5cm] border-2 border-slate-900 rounded-md p-1.5 font-sans relative overflow-hidden box-border print:shadow-none print:m-1">
            {/* Store Top Header Bar */}
            <div className="bg-slate-900 text-white -mx-1.5 -mt-1.5 px-2 py-0.5 flex justify-between items-center mb-1">
                <span className="font-black text-[9px] uppercase tracking-wider truncate max-w-[140px]">
                    {companyInfo.name}
                </span>
                <span className="font-bold text-[7.5px] text-slate-300 uppercase tracking-tight">
                    {categoryName}
                </span>
            </div>

            {/* Product Name */}
            <div className="my-0.5">
                <p className="text-[10.5px] font-black text-slate-900 leading-tight uppercase line-clamp-2">
                    {product.name}
                </p>
            </div>

            {/* Price Box Banner */}
            <div className="bg-slate-50 border-y-2 border-slate-900 py-1 px-1.5 flex items-baseline justify-between my-0.5">
                <span className="text-[8px] font-black text-slate-500 uppercase tracking-wider">HARGA</span>
                <div className="flex items-baseline gap-0.5 text-right">
                    <span className="text-[9px] font-black text-slate-900">Rp</span>
                    <span className="text-[22px] font-black text-slate-950 font-mono tracking-tight leading-none">
                        {price.toLocaleString('id-ID')}
                    </span>
                    <span className="text-[7.5px] font-bold text-slate-600 ml-0.5">/ {unit}</span>
                </div>
            </div>

            {/* Footer with Barcode & Shelf Location */}
            <div className="flex items-end justify-between border-t border-slate-200 pt-0.5 mt-0.5">
                <RenderBarcode code={barcode} />
                <div className="text-right flex flex-col justify-end text-[6.5px]">
                    {showRackLocation && (
                        <div className="flex items-center justify-end gap-1 mb-0.5">
                            <span className="text-slate-400 font-medium">RAK:</span>
                            <span className="font-mono font-black text-slate-900 bg-slate-100 px-1 py-0.2 rounded border border-slate-300">
                                {location}
                            </span>
                        </div>
                    )}
                    <span className="text-slate-400 font-medium">{printDate}</span>
                </div>
            </div>
        </div>
    );
};


export const PrintPriceLabelsPage: React.FC = () => {
    const { state, dispatch } = useAppContext();
    const { printSelection, products, promotions, currentBranchId } = state;
    const [showRackLocation, setShowRackLocation] = React.useState(true);

    const { itemsToPrint, promotion } = useMemo(() => {
        if (!printSelection) return { itemsToPrint: [], promotion: null };

        if (printSelection.type === 'promo') {
            const promo = promotions.find(p => p.id === printSelection.ids[0]);
            if (!promo) return { itemsToPrint: [], promotion: null };

            const applicableProducts = products.filter(product => {
                if (promo.condition.appliesToIds.length === 0) return true;
                switch (promo.condition.applyBy) {
                    case 'product':
                        return promo.condition.appliesToIds.includes(product.id);
                    case 'category':
                        return promo.condition.appliesToIds.includes(product.categoryId || '');
                    case 'brand':
                         return promo.condition.appliesToIds.includes(product.brandId || '');
                    case 'principal':
                        return promo.condition.appliesToIds.includes(product.principalId || '');
                    default:
                        return false;
                }
            });
            return { itemsToPrint: applicableProducts, promotion: promo };
        } else { // type is 'products'
            const selectedProducts = printSelection.ids.map(id => products.find(p => p.id === id)).filter((p): p is Product => !!p);
            return { itemsToPrint: selectedProducts, promotion: null };
        }

    }, [printSelection, products, promotions]);

    if (!printSelection || itemsToPrint.length === 0) {
        return (
            <div className="p-8">
                <PageHeader title="Cetak Label Harga" />
                <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm text-center max-w-xl mx-auto my-8">
                    <div className="w-16 h-16 bg-sky-100 dark:bg-sky-900/40 text-sky-600 dark:text-sky-400 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Printer className="w-8 h-8" />
                    </div>
                    <h3 className="text-xl font-bold text-slate-800 dark:text-white mb-2">Belum Ada Produk Dipilih</h3>
                    <p className="text-slate-600 dark:text-slate-400 text-sm mb-6">
                        Pilih produk yang ingin dicetak dari daftar produk di bawah ini, atau cetak semua label harga produk sekaligus.
                    </p>
                    <div className="flex flex-wrap justify-center gap-3">
                        <Button 
                            onClick={() => {
                                const allIds = (products || []).map(p => p.id);
                                if (allIds.length > 0) {
                                    dispatch({ type: 'ui/setPrintSelection', payload: { type: 'products', ids: allIds } });
                                }
                            }} 
                            variant="primary"
                        >
                            Cetak Semua Produk ({products?.length || 0})
                        </Button>
                        <Button 
                            onClick={() => dispatch({ type: 'ui/setPage', payload: Page.ProductList })} 
                            variant="secondary"
                        >
                            Pilih Manual dari Data Produk
                        </Button>
                    </div>
                </div>
            </div>
        );
    }

    const handlePrint = () => {
        window.print();
    };

    return (
        <div className="p-4 md:p-8 bg-gray-200 dark:bg-gray-900">
            <div className="print-hide mb-6 flex flex-wrap gap-4 justify-between items-center bg-white dark:bg-slate-800 p-4 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700">
                <div>
                    <PageHeader title="Pratinjau Cetak Label" />
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Total {itemsToPrint.length} label siap dicetak</p>
                </div>
                <div className="flex items-center gap-4">
                    <label className="flex items-center gap-2 text-sm font-semibold text-slate-700 dark:text-slate-200 cursor-pointer select-none bg-slate-100 dark:bg-slate-700 px-3 py-2 rounded-lg">
                        <input
                            type="checkbox"
                            checked={showRackLocation}
                            onChange={e => setShowRackLocation(e.target.checked)}
                            className="w-4 h-4 rounded text-sky-600 focus:ring-sky-500"
                        />
                        <span>Tampilkan Kode Rak Display</span>
                    </label>
                    <Button onClick={handlePrint} size="lg">Cetak Label</Button>
                </div>
            </div>

            <PrintLayout>
                <div className="flex flex-wrap gap-3 justify-center bg-gray-100 dark:bg-gray-800 p-4 rounded-xl border border-gray-200 dark:border-gray-700 print:bg-transparent print:p-0 print:gap-1">
                    {itemsToPrint.map(product => (
                        <PriceLabel
                            key={`${product.id}-${promotion?.id || 'normal'}`}
                            product={product}
                            promotion={promotion || undefined}
                            locationId={currentBranchId}
                            showRackLocation={showRackLocation}
                        />
                    ))}
                </div>
            </PrintLayout>
        </div>
    );
};
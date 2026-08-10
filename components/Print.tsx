import React, { useMemo, useEffect } from 'react';
import { useAppContext } from '../hooks/useAppContext';
import { Product, Promotion, Shelf, Page, ProductTypeLocation } from '../types';
import { PrintLayout, Button, PageHeader } from './ui';
import { StoreIcon } from './icons';

const PriceLabel: React.FC<{
    product: Product;
    promotion?: Promotion;
    locationId: string | null;
}> = ({ product, promotion, locationId }) => {
    const { state } = useAppContext();
    const { companyInfo, shelves, productTypeLocations, branches, warehouses } = state;

    const shelfMap = useMemo(() => new Map(shelves.map(s => [s.id, s.code])), [shelves]);

    const getLocation = (p: Product) => {
        if (!locationId) return 'N/A';
        
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
        
        if (!locationType || !locationTypeId) return 'N/A';
    
        const locationInfo = productTypeLocations.find(loc => 
            loc.productId === p.id && 
            loc.locationTypeId === locationTypeId && 
            loc.locationType === locationType
        );
    
        if (!locationInfo) return 'N/A';
    
        const shelfCode = locationInfo.shelfId ? shelfMap.get(locationInfo.shelfId) : 'N/A';
        const shelving = locationInfo.shelvingNumber || '';
        return `${shelfCode}${shelving ? `-${shelving}`: ''}`;
    };

    const location = getLocation(product);
    const barcode = product.barcode || product.id;
    const price = product.price;
    const printDate = new Date().toLocaleDateString('id-ID', {day:'2-digit', month:'2-digit', year:'2-digit'});

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

    // --- PROMO LABEL ---
    if (promotion && discountedPrice !== null) {
        const promoPeriod = `${new Date(promotion.startDate).toLocaleDateString('id-ID', {day:'2-digit', month:'short'})} - ${new Date(promotion.endDate).toLocaleDateString('id-ID', {day:'2-digit', month:'short'})}`;
        return (
            <div className="bg-white p-1 text-black flex flex-col justify-between h-[3cm] w-[5cm] border-2 border-red-500 font-sans text-[7px] overflow-hidden">
              {/* Top Section */}
              <div className="text-right">
                <p className="text-[9px] font-bold truncate leading-tight">{product.name}</p>
                <p className="text-[8px] leading-tight">{barcode} / {location}</p>
              </div>
            
              {/* Price & Date Section */}
              <div className="flex-grow flex flex-col justify-end">
                <div className="text-right">
                    <p className="text-[10px] text-gray-500 line-through leading-none">Rp{price.toLocaleString('id-ID')}</p>
                    <p className="text-[20px] font-extrabold text-red-600 leading-tight">Rp{discountedPrice.toLocaleString('id-ID')}</p>
                </div>
                <div className="flex justify-between items-end mt-0.5">
                  <p className="text-gray-600 leading-none">
                    {promoPeriod}
                  </p>
                   <p className="text-gray-600 leading-none">{printDate}</p>
                </div>
              </div>
            
              {/* Footer */}
              <div className="border-t border-dashed border-gray-400 pt-0.5 mt-0.5 flex justify-between items-center">
                <p className="text-[8px] font-bold text-red-700 italic -rotate-6">{promotion.name}</p>
                <div className="flex items-center gap-1">
                    {companyInfo.logoUrl ? <img src={companyInfo.logoUrl} alt="Logo" className="h-3 w-auto object-contain" /> : <StoreIcon className="h-3 w-3"/>}
                    <p className="font-bold">{companyInfo.name}</p>
                </div>
              </div>
            </div>
        );
    }

    // --- NORMAL LABEL ---
    return (
        <div className="bg-white p-1 text-black flex flex-col h-[3cm] w-[5cm] border border-black font-sans text-[7px] overflow-hidden">
            {/* Top Section */}
            <div className="text-right">
                <p className="text-[9px] font-bold truncate leading-tight">{product.name}</p>
                <p className="font-mono text-[8px] tracking-tighter leading-tight">{barcode}</p>
                <p className="text-[8px] leading-tight">{location}</p>
            </div>

            {/* Spacer */}
            <div className="flex-grow" />

            {/* Bottom Section */}
            <div className="flex flex-col justify-end">
                <div className="text-right">
                    <p className="text-[22px] font-extrabold leading-none">Rp{price.toLocaleString('id-ID')}</p>
                </div>
                 <div className="flex justify-between items-end mt-1">
                    <p className="text-gray-600">{printDate}</p>
                    <div className="flex items-center gap-1">
                        {companyInfo.logoUrl ? <img src={companyInfo.logoUrl} alt="Logo" className="h-3 w-auto object-contain" /> : <StoreIcon className="h-3 w-3"/>}
                        <p className="font-bold">{companyInfo.name}</p>
                    </div>
                </div>
            </div>
        </div>
    );
};


export const PrintPriceLabelsPage: React.FC = () => {
    const { state, dispatch } = useAppContext();
    const { printSelection, products, promotions, currentBranchId } = state;

    useEffect(() => {
        // Clear the selection when the component unmounts
        return () => {
            dispatch({ type: 'ui/clearPrintSelection' });
        };
    }, [dispatch]);

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
                <p>Tidak ada produk yang dipilih untuk dicetak. Silakan kembali ke halaman Data Produk atau Promosi dan pilih item.</p>
                <Button onClick={() => dispatch({ type: 'ui/setPage', payload: Page.ProductList })} className="mt-4">Kembali</Button>
            </div>
        );
    }

    const handlePrint = () => {
        window.print();
    };

    return (
        <div className="p-4 md:p-8 bg-gray-200 dark:bg-gray-900">
            <div className="print-hide mb-6 flex justify-between items-center">
                <PageHeader title="Pratinjau Cetak Label" />
                <Button onClick={handlePrint} size="lg">Cetak</Button>
            </div>

            <PrintLayout>
                <div className="grid grid-cols-4 gap-0 bg-gray-300">
                    {itemsToPrint.map(product => (
                        <PriceLabel
                            key={`${product.id}-${promotion?.id || 'normal'}`}
                            product={product}
                            promotion={promotion || undefined}
                            locationId={currentBranchId}
                        />
                    ))}
                </div>
            </PrintLayout>
        </div>
    );
};
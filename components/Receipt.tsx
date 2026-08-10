import React from 'react';
import { Sale, CompanyInfo, ReportLayoutSettings } from '../types';
import { useAppContext } from '../hooks/useAppContext';

interface ReceiptProps {
  sale: Sale;
  companyInfo: CompanyInfo;
  settings: ReportLayoutSettings;
}

export const Receipt: React.FC<ReceiptProps> = ({ sale, companyInfo, settings }) => {
    const { state } = useAppContext();
    const { paymentMethods, customers } = state;

    const widthClass = {
        'A4': 'w-[210mm]',
        'Letter': 'w-[8.5in]',
        '80mm': 'w-[80mm]',
        '58mm': 'w-[58mm]',
    }[settings.posReceiptSize];

    const isSmallFormat = settings.posReceiptSize === '80mm' || settings.posReceiptSize === '58mm';
    const textClass = isSmallFormat ? 'text-xs' : 'text-sm';
    const paddingClass = isSmallFormat ? 'p-2' : 'p-6';
    
    const paymentMethodName = sale.payments.map(p => paymentMethods.find(pm => pm.id === p.paymentMethodId)?.name).join(', ') || 'N/A';
    const customer = sale.customerId ? customers.find(c => c.id === sale.customerId) : null;

    return (
        <div className={`bg-white text-black font-mono mx-auto ${widthClass} ${paddingClass} ${textClass}`}>
             <div className="text-center mb-4">
                {companyInfo.logoUrl && <img src={companyInfo.logoUrl} alt="Logo" className="mx-auto h-16 w-auto mb-2 object-contain" />}
                <h1 className={`font-bold ${isSmallFormat ? 'text-lg' : 'text-2xl'}`}>{companyInfo.name}</h1>
                <p>{companyInfo.address}</p>
                <p>Telp: {companyInfo.phone}</p>
            </div>

            <div className="border-t border-b border-dashed border-black py-2 mb-2">
                <div className="flex justify-between"><span>No. Nota:</span><span>{sale.id}</span></div>
                <div className="flex justify-between"><span>Tanggal:</span><span>{new Date(sale.date).toLocaleString('id-ID')}</span></div>
                <div className="flex justify-between"><span>Pelanggan:</span><span>{sale.customerName}</span></div>
            </div>

            <table className="w-full">
                <thead>
                    <tr>
                        <th className="text-left">Item</th>
                        <th className="text-center">Qty</th>
                        <th className="text-right">Harga</th>
                        <th className="text-right">Total</th>
                    </tr>
                </thead>
                <tbody className="border-t border-b border-dashed border-black">
                    {sale.items.map(item => (
                        <tr key={item.productId}>
                            <td className="py-1">
                                <div>{item.productName}</div>
                                {item.discount > 0 && <div className="text-xs">Disc: -Rp{(item.discount/item.quantity).toLocaleString('id-ID')}</div>}
                            </td>
                            <td className="text-center align-top">{item.quantity}</td>
                            <td className="text-right align-top">{(item.price).toLocaleString('id-ID')}</td>
                            <td className="text-right align-top">{(item.quantity * item.price - item.discount).toLocaleString('id-ID')}</td>
                        </tr>
                    ))}
                </tbody>
            </table>

            <div className="mt-2 space-y-1">
                <div className="flex justify-between"><span>Subtotal:</span><span>Rp{sale.subtotal.toLocaleString('id-ID')}</span></div>
                {sale.discount > 0 && <div className="flex justify-between"><span>Diskon:</span><span>- Rp{sale.discount.toLocaleString('id-ID')}</span></div>}
                {sale.taxAmount > 0 && <div className="flex justify-between"><span>Pajak:</span><span>Rp{sale.taxAmount.toLocaleString('id-ID')}</span></div>}
                <div className="flex justify-between font-bold text-lg border-t border-dashed border-black pt-1"><span>TOTAL:</span><span>Rp{sale.grandTotal.toLocaleString('id-ID')}</span></div>
                
                <div className="mt-2 pt-2 border-t border-dashed border-black">
                    <div className="flex justify-between"><span>Metode Bayar:</span><span>{paymentMethodName}</span></div>
                    {sale.depositUsed && sale.depositUsed > 0 && (
                        <div className="flex justify-between"><span>Dibayar Saldo:</span><span>- Rp{sale.depositUsed.toLocaleString('id-ID')}</span></div>
                    )}
                    {sale.amountPaid !== undefined && (
                        <div className="flex justify-between"><span>Jumlah Bayar:</span><span>Rp{(sale.amountPaid).toLocaleString('id-ID')}</span></div>
                    )}
                    {sale.change !== undefined && sale.change > 0 && (
                        <div className="flex justify-between"><span>Kembalian:</span><span>Rp{sale.change.toLocaleString('id-ID')}</span></div>
                    )}
                </div>
            </div>

            {customer && (
                <div className="mt-2 pt-2 border-t border-dashed border-black space-y-1">
                    <div className="flex justify-between">
                        <span>Poin Didapat:</span>
                        <span>+{sale.pointsEarned || 0}</span>
                    </div>
                    <div className="flex justify-between font-bold">
                        <span>Total Poin Anda:</span>
                        <span>{customer.points.toLocaleString('id-ID')}</span>
                    </div>
                </div>
            )}
            
            <div className="text-center mt-6">
                <p>Terima kasih telah berbelanja!</p>
            </div>
        </div>
    );
};

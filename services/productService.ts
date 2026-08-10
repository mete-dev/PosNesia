import { Product } from '../types';
import { generateId } from './serviceUtils';

export const addProduct = (currentProducts: Product[], payload: Omit<Product, 'id' | 'imageUrl'>): Product[] => {
    const newProduct: Product = {
        ...payload,
        id: generateId('p', currentProducts.length),
        imageUrl: `https://picsum.photos/seed/${payload.name.replace(/\s/g, '')}/400/400`,
        description: payload.description || '',
    };
    return [...currentProducts, newProduct];
};

export const updateProduct = (currentProducts: Product[], payload: Product): Product[] => {
    return currentProducts.map(p => p.id === payload.id ? payload : p);
};

export const setAutoPrices = (currentProducts: Product[], markupPercentage: number): Product[] => {
    return currentProducts.map(p => {
        if (p.pricingType === 'auto') {
            const newPrice = p.cost * (1 + markupPercentage / 100);
            // Round to nearest 1000 for simplicity
            return { ...p, price: Math.round(newPrice / 1000) * 1000 };
        }
        return p;
    });
};
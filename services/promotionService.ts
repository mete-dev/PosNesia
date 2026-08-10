
import { Promotion } from '../types';
import { generateId } from './serviceUtils';

export const addPromotion = (currentPromotions: Promotion[], payload: Omit<Promotion, 'id'>): Promotion[] => {
    const newPromo: Promotion = {
        ...payload,
        id: generateId('promo', currentPromotions.length)
    };
    return [newPromo, ...currentPromotions];
};

export const updatePromotion = (currentPromotions: Promotion[], payload: Promotion): Promotion[] => {
    return currentPromotions.map(p => p.id === payload.id ? payload : p);
};

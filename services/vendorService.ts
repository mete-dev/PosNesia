
import { Vendor } from '../types';
import { generateId } from './serviceUtils';

export const addVendor = (currentVendors: Vendor[], payload: Omit<Vendor, 'id'>): Vendor[] => {
    const newVendor: Vendor = {
        ...payload,
        id: generateId('v', currentVendors.length)
    };
    return [...currentVendors, newVendor];
};
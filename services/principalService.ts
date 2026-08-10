import { Principal } from '../types';
import { generateId } from './serviceUtils';

export const addPrincipal = (currentPrincipals: Principal[], payload: Omit<Principal, 'id'>): Principal[] => {
    const newPrincipal: Principal = {
        ...payload,
        id: generateId('princ', currentPrincipals.length)
    };
    return [...currentPrincipals, newPrincipal];
};

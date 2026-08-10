

import { Staff, AttendanceRecord } from '../types';
import { generateId } from './serviceUtils';

export const addStaff = (currentStaff: Staff[], payload: Staff): Staff[] => {
    // ID is now provided from the form, not generated
    return [...currentStaff, payload];
};

export const updateStaff = (currentStaff: Staff[], payload: Staff): Staff[] => {
    return currentStaff.map(s => s.id === payload.id ? payload : s);
};

export const markAttendance = (
    currentAttendance: AttendanceRecord[],
    currentStaff: Staff[],
    payload: { staffId: string, status: AttendanceRecord['status'] }
): AttendanceRecord[] => {
    const { staffId, status } = payload;
    const staffMember = currentStaff.find(s => s.id === staffId);
    if (!staffMember) return currentAttendance;

    const todayStr = new Date().toISOString().split('T')[0];
    const existingRecordIndex = currentAttendance.findIndex(a => a.staffId === staffId && a.date === todayStr);

    let newAttendanceList = [...currentAttendance];
    if (existingRecordIndex > -1) {
        newAttendanceList[existingRecordIndex] = { ...newAttendanceList[existingRecordIndex], status };
    } else {
        const newRecord: AttendanceRecord = {
            id: generateId('att', currentAttendance.length),
            staffId,
            staffName: staffMember.name,
            date: todayStr,
            status
        };
        newAttendanceList.unshift(newRecord);
    }
    return newAttendanceList;
};

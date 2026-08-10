import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Staff as StaffType, Page, AttendanceRecord, Role, Status, JobApplicant, JobOpening } from '../types';
import { useAppContext } from '../hooks/useAppContext';
import { Button, Card, Modal, Input, Label, DateRangeFilter, ActionsDropdown, DropdownItem, Table, Thead, Tbody, Tr, Th, Td, Select, Textarea } from './ui';

const ApplicantModal: React.FC<{
    isOpen: boolean;
    onClose: () => void;
}> = ({ isOpen, onClose }) => {
    const { dispatch } = useAppContext();
    const [name, setName] = useState('');
    const [position, setPosition] = useState('');
    const [email, setEmail] = useState('');
    const [phone, setPhone] = useState('');
    const [notes, setNotes] = useState('');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        dispatch({ type: 'recruitment/addApplicant', payload: { name, email, phone, position, notes } });
        onClose();
    };

    const footer = (
        <>
            <button type="button" onClick={onClose} className="px-4 py-2 rounded-md bg-gray-200 dark:bg-gray-600">Batal</button>
            <Button type="submit" onClick={handleSubmit}>Simpan Pelamar</Button>
        </>
    );

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Tambah Pelamar Baru" footer={footer}>
            <form onSubmit={handleSubmit} className="space-y-4">
                <Input value={name} onChange={e => setName(e.target.value)} placeholder="Nama Pelamar" required />
                <Input value={email} onChange={e => setEmail(e.target.value)} placeholder="Email" type="email" required />
                <Input value={phone} onChange={e => setPhone(e.target.value)} placeholder="Telepon" type="tel" required />
                <Input value={position} onChange={e => setPosition(e.target.value)} placeholder="Posisi yang Dilamar" required />
                <Textarea value={notes} onChange={e => setNotes(e.target.value)} placeholder="Catatan (Opsional)" />
            </form>
        </Modal>
    );
};


// --- Staff List Page ---

const StaffModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  onSave: (staffMember: StaffType) => void;
  existingStaff: StaffType | null;
}> = ({ isOpen, onClose, onSave, existingStaff }) => {
  const { state } = useAppContext();
  const { roles, branches, cashierStations, staff, currentUser } = state;
  const [formData, setFormData] = useState<Partial<StaffType>>({});

  useEffect(() => {
    if (existingStaff) {
      setFormData({ ...existingStaff, pin: '' }); // Clear PIN on edit for security
    } else {
      setFormData({
        id: '', name: '', roleId: '', email: '', phone: '', salary: 0, pin: '',
        status: 'active', branchId: '', cashierStationId: undefined, depositBalance: 0
      });
    }
  }, [existingStaff, isOpen]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
      const { name, value } = e.target;
      const newFormData = { ...formData, [name]: name === 'salary' ? parseFloat(value) || 0 : value };
      
      // Reset cashier station if role or branch changes
      if (name === 'roleId' || name === 'branchId') {
          newFormData.cashierStationId = undefined;
      }
      setFormData(newFormData);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (existingStaff) {
        const payload: StaffType = { ...existingStaff, ...formData, depositBalance: existingStaff.depositBalance };
        if (!payload.pin) { // If pin is not changed, keep the old one
            payload.pin = existingStaff.pin;
        }
        onSave(payload);
    } else {
        if(!formData.pin || !formData.id) {
            alert("ID Staf dan PIN wajib diisi untuk staf baru.");
            return;
        }
        onSave({...(formData as Omit<StaffType, 'id'> & {id: string}), depositBalance: 0 });
    }
    onClose();
  };
  
  const selectedRole = useMemo(() => roles.find(r => r.id === formData.roleId), [formData.roleId, roles]);
  
  const availableCashierStations = useMemo(() => {
      const assignedStations = staff
          .filter(s => s.cashierStationId && s.id !== existingStaff?.id)
          .map(s => s.cashierStationId);
      return cashierStations.filter(cs => cs.branchId === formData.branchId && !assignedStations.includes(cs.id));
  }, [formData.branchId, cashierStations, staff, existingStaff]);

  if (!isOpen) return null;

  const canEditSensitiveInfo = currentUser?.id === 'admin.dev' || currentUser?.id === '1111';

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-8 w-full max-w-3xl max-h-[90vh] flex flex-col">
        <h2 className="text-2xl font-bold mb-6 text-gray-900 dark:text-white">{existingStaff ? "Ubah Staf" : "Tambah Staf"}</h2>
        <form id="staff-form" onSubmit={handleSubmit} className="space-y-4 flex-grow overflow-y-auto pr-2">
           <div className="grid grid-cols-2 gap-4">
            <div>
                <label className="block text-sm font-medium">ID Staf / Username*</label>
                <input type="text" name="id" value={formData.id} onChange={handleInputChange} required disabled={!!existingStaff} className="mt-1 block w-full rounded-md bg-gray-100 dark:bg-gray-700 border-transparent disabled:opacity-50" />
            </div>
             <div>
                <label className="block text-sm font-medium">Nama Lengkap*</label>
                <input type="text" name="name" value={formData.name} onChange={handleInputChange} required className="mt-1 block w-full rounded-md bg-gray-100 dark:bg-gray-700 border-transparent" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
                <label className="block text-sm font-medium">Jabatan*</label>
                <select name="roleId" value={formData.roleId} onChange={handleInputChange} required className="mt-1 block w-full rounded-md bg-gray-100 dark:bg-gray-700 border-transparent">
                    <option value="">-- Pilih Jabatan --</option>
                    {roles.map(role => <option key={role.id} value={role.id}>{role.name}</option>)}
                </select>
            </div>
             <div>
                <label className="block text-sm font-medium">Cabang Penempatan*</label>
                <select name="branchId" value={formData.branchId} onChange={handleInputChange} required className="mt-1 block w-full rounded-md bg-gray-100 dark:bg-gray-700 border-transparent">
                    <option value="">-- Pilih Cabang --</option>
                    {branches.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                </select>
            </div>
          </div>
          {selectedRole?.name === 'Kasir Toko' && (
             <div>
                <label className="block text-sm font-medium">Stasiun Kasir*</label>
                <select name="cashierStationId" value={formData.cashierStationId || ''} onChange={handleInputChange} required className="mt-1 block w-full rounded-md bg-gray-100 dark:bg-gray-700 border-transparent">
                    <option value="">-- Pilih Stasiun Kasir --</option>
                    {availableCashierStations.map(cs => <option key={cs.id} value={cs.id}>{cs.name}</option>)}
                </select>
            </div>
          )}
          <div className="grid grid-cols-2 gap-4">
             <div>
                <label className="block text-sm font-medium">Email*</label>
                <input type="email" name="email" value={formData.email} onChange={handleInputChange} required className="mt-1 block w-full rounded-md bg-gray-100 dark:bg-gray-700 border-transparent" />
            </div>
             <div>
                <label className="block text-sm font-medium">Telepon*</label>
                <input type="tel" name="phone" value={formData.phone} onChange={handleInputChange} required className="mt-1 block w-full rounded-md bg-gray-100 dark:bg-gray-700 border-transparent" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
                <label className="block text-sm font-medium">Gaji</label>
                <input type="number" name="salary" step="1000" value={formData.salary} onChange={handleInputChange} required className="mt-1 block w-full rounded-md bg-gray-100 dark:bg-gray-700 border-transparent" />
            </div>
            <div>
                <label className="block text-sm font-medium">PIN*</label>
                <input type="password" name="pin" value={formData.pin} onChange={handleInputChange} required={!existingStaff} className="mt-1 block w-full rounded-md bg-gray-100 dark:bg-gray-700 border-transparent" placeholder={existingStaff ? "Kosongkan jika tidak diubah" : ""} pattern="\d{6}" title="PIN harus 6 digit angka." maxLength={6}/>
            </div>
          </div>
        </form>
        <div className="flex justify-end space-x-4 pt-4 mt-auto">
            <button type="button" onClick={onClose} className="px-4 py-2 rounded-md text-gray-700 dark:text-gray-200 bg-gray-200 dark:bg-gray-600 hover:bg-gray-300 dark:hover:bg-gray-500">Batal</button>
            <button type="submit" form="staff-form" className="px-4 py-2 rounded-md text-white bg-primary-600 hover:bg-primary-700">Simpan</button>
        </div>
      </div>
    </div>
  );
};


export const StaffListPage: React.FC = () => {
  const { state, dispatch } = useAppContext();
  const { staff, roles } = state;
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingStaff, setEditingStaff] = useState<StaffType | null>(null);
  
  const handleOpenModal = (staffMember: StaffType | null = null) => {
    setEditingStaff(staffMember);
    setIsModalOpen(true);
  };

  const handleSaveStaff = (staffData: StaffType) => {
    if (editingStaff) {
        dispatch({ type: 'staff/update', payload: staffData });
    } else {
        dispatch({ type: 'staff/add', payload: staffData });
    }
  };

  const handleSetStatus = (id: string, status: Status) => {
    if (window.confirm(`Anda yakin ingin mengubah status staf ini menjadi "${status}"?`)) {
        dispatch({ type: 'staff/setStatus', payload: { id, status } });
    }
  };

  return (
    <div className="p-8 h-full flex flex-col">
        <div className="flex justify-between items-center mb-6">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Daftar Staf</h1>
            <button onClick={() => handleOpenModal()} className="bg-primary-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-primary-700 transition-colors">
                Tambah Staf
            </button>
        </div>
      
      <div className="flex-grow bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-y-auto">
        <table className="w-full text-sm text-left text-gray-500 dark:text-gray-400">
        <thead className="text-xs text-gray-700 uppercase bg-gray-50 dark:bg-gray-700 dark:text-gray-400 sticky top-0">
            <tr>
            <th scope="col" className="px-6 py-3">Nama</th>
            <th scope="col" className="px-6 py-3">Jabatan</th>
            <th scope="col" className="px-6 py-3">Kontak</th>
            <th scope="col" className="px-6 py-3">Status</th>
            <th scope="col" className="px-6 py-3">Aksi</th>
            </tr>
        </thead>
        <tbody>
            {staff.map((member) => {
                const role = roles.find(r => r.id === member.roleId);
                return (
                    <tr key={member.id} className="bg-white dark:bg-gray-800 border-b dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600">
                        <td className="px-6 py-4 font-medium text-gray-900 dark:text-white">{member.name}</td>
                        <td className="px-6 py-4">{role?.name || 'N/A'}</td>
                        <td className="px-6 py-4">{member.email}<br/>{member.phone}</td>
                        <td className="px-6 py-4">{member.status}</td>
                        <td className="px-6 py-4">
                             <ActionsDropdown>
                                <DropdownItem onClick={() => handleOpenModal(member)}>Ubah</DropdownItem>
                                {member.status !== 'archived' && (
                                    <DropdownItem onClick={() => handleSetStatus(member.id, member.status === 'active' ? 'inactive' : 'active')}>
                                        {member.status === 'active' ? 'Non-aktifkan' : 'Aktifkan'}
                                    </DropdownItem>
                                )}
                                {member.status !== 'archived' && (
                                    <DropdownItem onClick={() => handleSetStatus(member.id, 'archived')} className="text-red-600 dark:text-red-500">
                                        Arsipkan
                                    </DropdownItem>
                                )}
                            </ActionsDropdown>
                        </td>
                    </tr>
                )
            })}
        </tbody>
        </table>
      </div>
      <StaffModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} onSave={handleSaveStaff} existingStaff={editingStaff}/>
    </div>
  );
};

// --- Combined Payroll & Role Management Page ---
export const PayrollPage: React.FC = () => {
    return <RoleManagementPage />;
};


// --- Staff Attendance Page ---
export const StaffAttendancePage: React.FC = () => {
    const { state, dispatch } = useAppContext();
    const { staff, attendance } = state;
    
    const handleMarkAttendance = (staffId: string, status: AttendanceRecord['status']) => {
        dispatch({ type: 'staff/markAttendance', payload: { staffId, status } });
    };
    
    const todayStr = new Date().toISOString().split('T')[0];
    const todaysAttendance = attendance.filter(a => a.date === todayStr);

    return (
        <div className="p-8 h-full flex flex-col">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-6">Absensi Staf Harian</h1>
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-y-auto">
                <div className="p-4 border-b dark:border-gray-700">
                     <h2 className="text-xl font-semibold">Absensi untuk tanggal: {new Date(todayStr).toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</h2>
                </div>
                <table className="w-full text-sm text-left text-gray-500 dark:text-gray-400">
                    <thead className="text-xs text-gray-700 uppercase bg-gray-50 dark:bg-gray-700 dark:text-gray-400 sticky top-0">
                        <tr>
                            <th scope="col" className="px-6 py-3">Nama Staf</th>
                            <th scope="col" className="px-6 py-3">Status Hari Ini</th>
                            <th scope="col" className="px-6 py-3">Tandai Kehadiran</th>
                        </tr>
                    </thead>
                    <tbody>
                        {staff.map(member => {
                            const attendanceRecord = todaysAttendance.find(a => a.staffId === member.id);
                            return (
                                <tr key={member.id} className="bg-white dark:bg-gray-800 border-b dark:border-gray-700">
                                    <td className="px-6 py-4 font-medium text-gray-900 dark:text-white">{member.name}</td>
                                    <td className="px-6 py-4 font-semibold">{attendanceRecord?.status || 'Belum ditandai'}</td>
                                    <td className="px-6 py-4 space-x-2">
                                        <button onClick={() => handleMarkAttendance(member.id, 'Present')} className="px-2 py-1 text-xs rounded-md bg-green-500 text-white disabled:opacity-50" disabled={attendanceRecord?.status === 'Present'}>Hadir</button>
                                        <button onClick={() => handleMarkAttendance(member.id, 'Absent')} className="px-2 py-1 text-xs rounded-md bg-red-500 text-white disabled:opacity-50" disabled={attendanceRecord?.status === 'Absent'}>Absen</button>
                                        <button onClick={() => handleMarkAttendance(member.id, 'On Leave')} className="px-2 py-1 text-xs rounded-md bg-yellow-500 text-black disabled:opacity-50" disabled={attendanceRecord?.status === 'On Leave'}>Cuti</button>
                                    </td>
                                </tr>
                            )
                        })}
                    </tbody>
                 </table>
            </div>
        </div>
    );
}

// --- Staff Attendance Report Page ---
export const StaffAttendanceReportPage: React.FC = () => {
    const { state } = useAppContext();
    const [reportData, setReportData] = useState<any[]>([]);
    
    const handleFilter = (start: string, end: string) => {
        const startDate = new Date(start);
        startDate.setHours(0, 0, 0, 0);
        const endDate = new Date(end);
        endDate.setHours(23, 59, 59, 999);
        
        const recordsInDateRange = state.attendance.filter(rec => {
            const recDate = new Date(rec.date);
            return recDate >= startDate && recDate <= endDate;
        });

        const summary = state.staff.map(staffMember => {
            const staffRecords = recordsInDateRange.filter(rec => rec.staffId === staffMember.id);
            return {
                id: staffMember.id,
                name: staffMember.name,
                present: staffRecords.filter(r => r.status === 'Present').length,
                absent: staffRecords.filter(r => r.status === 'Absent').length,
                onLeave: staffRecords.filter(r => r.status === 'On Leave').length,
            };
        });
        
        setReportData(summary);
    };

    return (
        <div className="p-8 h-full flex flex-col">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-6">Laporan Absensi Staf</h1>
            <DateRangeFilter onFilter={handleFilter} />
            <Card className="flex-grow overflow-y-auto">
                 <table className="w-full text-sm text-left text-gray-500 dark:text-gray-400">
                    <thead className="text-xs text-gray-700 uppercase bg-gray-50 dark:bg-gray-700 dark:text-gray-400 sticky top-0">
                        <tr>
                            <th scope="col" className="px-6 py-3">Nama Staf</th>
                            <th scope="col" className="px-6 py-3">Hadir</th>
                            <th scope="col" className="px-6 py-3">Absen</th>
                            <th scope="col" className="px-6 py-3">Cuti/Izin</th>
                        </tr>
                    </thead>
                    <tbody>
                        {reportData.map(data => (
                            <tr key={data.id} className="bg-white dark:bg-gray-800 border-b dark:border-gray-700">
                                <td className="px-6 py-4 font-medium">{data.name}</td>
                                <td className="px-6 py-4">{data.present}</td>
                                <td className="px-6 py-4">{data.absent}</td>
                                <td className="px-6 py-4">{data.onLeave}</td>
                            </tr>
                        ))}
                    </tbody>
                 </table>
            </Card>
        </div>
    );
};

const PermissionModal: React.FC<{
    isOpen: boolean;
    onClose: () => void;
    role: Role | null;
}> = ({ isOpen, onClose, role }) => {
    const { dispatch } = useAppContext();
    const [featurePermissions, setFeaturePermissions] = useState<Record<string, { create: boolean; read: boolean; update: boolean; delete: boolean }>>({});

    useEffect(() => {
        if (role) {
            setFeaturePermissions((role as any).featurePermissions || {});
        }
    }, [role, isOpen]);

    if (!isOpen || !role) return null;

    const handleToggleCrud = (page: string, action: 'create' | 'read' | 'update' | 'delete', checked: boolean) => {
        const current = featurePermissions[page] || { 
            create: true, 
            read: role.permissions.includes(page as Page), 
            update: true, 
            delete: true 
        };
        const updated = { ...current, [action]: checked };
        const newFP = { ...featurePermissions, [page]: updated };
        setFeaturePermissions(newFP);
        
        let newPermissions = [...role.permissions];
        if (action === 'read') {
            if (checked && !newPermissions.includes(page as Page)) {
                newPermissions.push(page as Page);
            } else if (!checked) {
                newPermissions = newPermissions.filter(p => p !== page);
            }
        }

        dispatch({ 
            type: 'staff/updateRolePermissions', 
            payload: { 
                roleId: role.id, 
                permissions: newPermissions,
                featurePermissions: newFP 
            } 
        });
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={`Kelola Akses & Pembatasan CRU: ${role.name}`} maxWidth="max-w-4xl">
            <div className="space-y-4 max-h-[70vh] overflow-y-auto pr-2">
                <p className="text-sm text-gray-500">Atur hak akses halaman dan batasan operasi Create (C), Read (R), Update (U), Delete (D) untuk tiap fitur.</p>
                <Table>
                    <Thead>
                        <Tr>
                            <Th>Fitur / Halaman</Th>
                            <Th className="text-center">Create (C)</Th>
                            <Th className="text-center">Read (R)</Th>
                            <Th className="text-center">Update (U)</Th>
                            <Th className="text-center">Delete (D)</Th>
                        </Tr>
                    </Thead>
                    <Tbody>
                        {Object.values(Page).map(page => {
                            const fp = featurePermissions[page] || { 
                                create: true, 
                                read: role.permissions.includes(page), 
                                update: true, 
                                delete: true 
                            };
                            return (
                                <Tr key={page}>
                                    <Td className="font-medium">{page}</Td>
                                    <Td className="text-center">
                                        <input 
                                            type="checkbox" 
                                            checked={fp.create} 
                                            onChange={e => handleToggleCrud(page, 'create', e.target.checked)}
                                            className="rounded text-primary-600 w-4 h-4"
                                        />
                                    </Td>
                                    <Td className="text-center">
                                        <input 
                                            type="checkbox" 
                                            checked={fp.read} 
                                            onChange={e => handleToggleCrud(page, 'read', e.target.checked)}
                                            className="rounded text-primary-600 w-4 h-4"
                                        />
                                    </Td>
                                    <Td className="text-center">
                                        <input 
                                            type="checkbox" 
                                            checked={fp.update} 
                                            onChange={e => handleToggleCrud(page, 'update', e.target.checked)}
                                            className="rounded text-primary-600 w-4 h-4"
                                        />
                                    </Td>
                                    <Td className="text-center">
                                        <input 
                                            type="checkbox" 
                                            checked={fp.delete} 
                                            onChange={e => handleToggleCrud(page, 'delete', e.target.checked)}
                                            className="rounded text-primary-600 w-4 h-4"
                                        />
                                    </Td>
                                </Tr>
                            );
                        })}
                    </Tbody>
                </Table>
            </div>
        </Modal>
    );
};

const RoleModal: React.FC<{
    isOpen: boolean;
    onClose: () => void;
    existingRole: Role | null;
}> = ({ isOpen, onClose, existingRole }) => {
    const { dispatch } = useAppContext();
    const [name, setName] = useState('');
    const [baseSalary, setBaseSalary] = useState<number | string>('');

    useEffect(() => {
        if(isOpen) {
            setName(existingRole?.name || '');
            setBaseSalary(existingRole?.baseSalary || '');
        }
    }, [isOpen, existingRole]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (existingRole) {
            dispatch({ type: 'staff/updateRole', payload: { ...existingRole, name, baseSalary: Number(baseSalary) } });
        } else {
            dispatch({ type: 'staff/addRole', payload: { name, baseSalary: Number(baseSalary) } });
        }
        onClose();
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={`${existingRole ? 'Ubah' : 'Tambah'} Jabatan`}>
            <form onSubmit={handleSubmit} className="space-y-4">
                <Input value={name} onChange={e => setName(e.target.value)} placeholder="Nama Jabatan" required />
                <Input type="number" value={baseSalary} onChange={e => setBaseSalary(e.target.value)} placeholder="Gaji Pokok (Opsional)" />
                <div className="flex justify-end gap-2 pt-4">
                    <Button variant="secondary" onClick={onClose}>Batal</Button>
                    <Button type="submit">Simpan</Button>
                </div>
            </form>
        </Modal>
    );
};

export const RoleManagementPage: React.FC = () => {
    const { state, dispatch } = useAppContext();
    const { roles, staff } = state;
    const [isPermissionModalOpen, setPermissionModalOpen] = useState(false);
    const [isRoleModalOpen, setRoleModalOpen] = useState(false);
    const [selectedRole, setSelectedRole] = useState<Role | null>(null);
    const [message, setMessage] = useState('');

    const staffCountByRole = useMemo(() => {
        return roles.map(role => ({
            ...role,
            staffCount: staff.filter(s => s.roleId === role.id).length,
        }));
    }, [roles, staff]);

    const handleManagePermissions = (role: Role) => {
        setSelectedRole(role);
        setPermissionModalOpen(true);
    };
    
    const handleOpenRoleModal = (role: Role | null) => {
        setSelectedRole(role);
        setRoleModalOpen(true);
    };

    const handleDeleteRole = (roleId: string) => {
        if(window.confirm("Anda yakin ingin menghapus jabatan ini? Pastikan tidak ada staf yang menggunakan jabatan ini.")){
            dispatch({ type: 'staff/deleteRole', payload: roleId });
        }
    };
  
    return (
        <div className="p-8 h-full flex flex-col">
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Jabatan & Kelola Akses</h1>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Kelola struktur jabatan dan hak akses pembatasan CRU tiap fitur staf.</p>
                </div>
                <Button onClick={() => handleOpenRoleModal(null)}>Tambah Jabatan</Button>
            </div>

            {message && <div className="p-4 mb-4 text-green-800 bg-green-100 dark:bg-green-900/50 dark:text-green-200 rounded-lg">{message}</div>}

            <Card className="flex-grow overflow-y-auto">
                <Table>
                    <Thead>
                        <Tr>
                            <Th>Nama Jabatan</Th>
                            <Th>Gaji Pokok</Th>
                            <Th>Jumlah Staf</Th>
                            <Th>Aksi</Th>
                        </Tr>
                    </Thead>
                    <Tbody>
                        {staffCountByRole.map(role => (
                            <Tr key={role.id}>
                                <Td className="font-medium">{role.name}</Td>
                                <Td>Rp{(role.baseSalary || 0).toLocaleString('id-ID')}</Td>
                                <Td>{role.staffCount}</Td>
                                <Td>
                                    <ActionsDropdown>
                                        <DropdownItem onClick={() => handleOpenRoleModal(role)}>Ubah</DropdownItem>
                                        <DropdownItem onClick={() => handleManagePermissions(role)}>Kelola Akses</DropdownItem>
                                        <DropdownItem onClick={() => handleDeleteRole(role.id)} className="text-red-600 dark:text-red-500">Hapus</DropdownItem>
                                    </ActionsDropdown>
                                </Td>
                            </Tr>
                        ))}
                    </Tbody>
                </Table>
            </Card>

            <PermissionModal 
                isOpen={isPermissionModalOpen}
                onClose={() => setPermissionModalOpen(false)}
                role={selectedRole}
            />
             <RoleModal 
                isOpen={isRoleModalOpen}
                onClose={() => setRoleModalOpen(false)}
                existingRole={selectedRole}
            />
        </div>
    );
};

export const RecruitmentPage: React.FC = () => {
    const { state, dispatch } = useAppContext();
    const { jobApplicants } = state;

    const statuses: JobApplicant['status'][] = ['Applied', 'Interviewing', 'Offered', 'Hired', 'Rejected'];

    const applicantsByStatus = useMemo(() => {
        return statuses.reduce((acc, status) => {
            acc[status] = jobApplicants.filter(app => app.status === status);
            return acc;
        }, {} as Record<JobApplicant['status'], JobApplicant[]>);
    }, [jobApplicants]);
    
    const handleStatusChange = (applicantId: string, newStatus: JobApplicant['status']) => {
        dispatch({ type: 'recruitment/updateApplicantStatus', payload: { applicantId, newStatus } });
    };

    const handleDelete = (applicantId: string) => {
        if(window.confirm("Hapus data pelamar ini?")){
            dispatch({ type: 'recruitment/deleteApplicant', payload: applicantId });
        }
    }

    return (
        <div className="p-8 h-full flex flex-col">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-3xl font-bold">Papan Rekrutmen (Pelamar)</h1>
            </div>
            <div className="flex-grow grid grid-cols-5 gap-6 overflow-x-auto">
                {statuses.map(status => (
                    <div key={status} className="bg-gray-100 dark:bg-gray-900/50 rounded-lg p-4 flex flex-col min-w-[250px]">
                        <h2 className="font-bold text-lg mb-4 text-center">{status} ({applicantsByStatus[status]?.length || 0})</h2>
                        <div className="space-y-4 overflow-y-auto flex-grow">
                            {(applicantsByStatus[status] || []).map(applicant => (
                                <Card key={applicant.id} className="relative group">
                                    <button onClick={() => handleDelete(applicant.id)} className="absolute top-2 right-2 text-red-500 opacity-0 group-hover:opacity-100 transition-opacity">&times;</button>
                                    <p className="font-semibold">{applicant.name}</p>
                                    <p className="text-sm text-primary-500">{applicant.position}</p>
                                    <p className="text-xs text-gray-500 mt-2">{new Date(applicant.appliedDate).toLocaleDateString()}</p>
                                     <select value={applicant.status} onChange={(e) => handleStatusChange(applicant.id, e.target.value as JobApplicant['status'])} className="mt-2 w-full text-xs p-1 rounded bg-gray-200 dark:bg-gray-700 border-transparent">
                                        {statuses.map(s => <option key={s} value={s}>{s}</option>)}
                                    </select>
                                </Card>
                            ))}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

const JobOpeningModal: React.FC<{
    isOpen: boolean;
    onClose: () => void;
    onSave: (data: Omit<JobOpening, 'id'> | JobOpening) => void;
    existingOpening: JobOpening | null;
}> = ({ isOpen, onClose, onSave, existingOpening }) => {
    const [formData, setFormData] = useState<Partial<JobOpening>>({});

    useEffect(() => {
        if (isOpen) {
            setFormData(existingOpening || {
                title: '',
                description: '',
                location: 'Jakarta',
                type: 'Full-time',
                status: 'Open',
            });
        }
    }, [isOpen, existingOpening]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSave(formData as JobOpening);
        onClose();
    };

    const footer = <Button onClick={handleSubmit}>Simpan</Button>;

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={existingOpening ? 'Ubah Lowongan' : 'Buat Lowongan Baru'} footer={footer}>
            <form onSubmit={handleSubmit} className="space-y-4">
                <Input value={formData.title || ''} onChange={e => setFormData({...formData, title: e.target.value})} placeholder="Posisi Jabatan" required />
                <Textarea value={formData.description || ''} onChange={e => setFormData({...formData, description: e.target.value})} placeholder="Deskripsi Pekerjaan" required />
                <Input value={formData.location || ''} onChange={e => setFormData({...formData, location: e.target.value})} placeholder="Lokasi" required />
                <Select value={formData.type || 'Full-time'} onChange={e => setFormData({...formData, type: e.target.value as JobOpening['type']})}>
                    <option value="Full-time">Full-time</option>
                    <option value="Part-time">Part-time</option>
                    <option value="Contract">Contract</option>
                </Select>
                <Select value={formData.status || 'Open'} onChange={e => setFormData({...formData, status: e.target.value as JobOpening['status']})}>
                    <option value="Open">Open</option>
                    <option value="Closed">Closed</option>
                </Select>
            </form>
        </Modal>
    );
};

export const JobOpeningManagementPage: React.FC = () => {
    const { state, dispatch } = useAppContext();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingOpening, setEditingOpening] = useState<JobOpening | null>(null);

    const handleOpenModal = (job: JobOpening | null) => {
        setEditingOpening(job);
        setIsModalOpen(true);
    };

    const handleSave = (data: Omit<JobOpening, 'id'> | JobOpening) => {
        if ('id' in data && data.id) {
            dispatch({ type: 'recruitment/updateJobOpening', payload: data as JobOpening });
        } else {
            dispatch({ type: 'recruitment/addJobOpening', payload: data as Omit<JobOpening, 'id'> });
        }
    };
    
    const handleDelete = (jobId: string) => {
        if (window.confirm("Hapus lowongan pekerjaan ini?")) {
            dispatch({ type: 'recruitment/deleteJobOpening', payload: jobId });
        }
    };

    return (
        <div className="p-8 h-full flex flex-col">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-3xl font-bold">Manajemen Lowongan Kerja</h1>
                <Button onClick={() => handleOpenModal(null)}>Buat Lowongan</Button>
            </div>
            <Card className="flex-grow overflow-y-auto">
                <Table>
                    <Thead>
                        <Tr>
                            <Th>Posisi</Th>
                            <Th>Lokasi</Th>
                            <Th>Tipe</Th>
                            <Th>Status</Th>
                            <Th>Aksi</Th>
                        </Tr>
                    </Thead>
                    <Tbody>
                        {state.jobOpenings.map(job => (
                            <Tr key={job.id}>
                                <Td className="font-medium">{job.title}</Td>
                                <Td>{job.location}</Td>
                                <Td>{job.type}</Td>
                                <Td><span className={`px-2 py-1 rounded-full text-xs font-semibold ${job.status === 'Open' ? 'bg-green-100 text-green-800' : 'bg-gray-200 text-gray-800'}`}>{job.status}</span></Td>
                                <Td>
                                    <ActionsDropdown>
                                        <DropdownItem onClick={() => handleOpenModal(job)}>Ubah</DropdownItem>
                                        <DropdownItem onClick={() => handleDelete(job.id)} className="text-red-600">Hapus</DropdownItem>
                                    </ActionsDropdown>
                                </Td>
                            </Tr>
                        ))}
                    </Tbody>
                </Table>
            </Card>
            <JobOpeningModal 
                isOpen={isModalOpen} 
                onClose={() => setIsModalOpen(false)} 
                onSave={handleSave} 
                existingOpening={editingOpening} 
            />
        </div>
    );
};


export const TimeOffPage: React.FC = () => {
    return (
        <div className="p-8">
            <h1 className="text-3xl font-bold">Cuti & Izin</h1>
            <p className="mt-4 text-gray-500">Halaman ini sedang dalam pengembangan.</p>
        </div>
    );
};
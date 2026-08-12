import React, { useState, useEffect, useMemo, useRef } from 'react';
import { ShieldCheck, Edit, Trash2, Users, Plus, ArrowLeft, Search, Lock, Shield, UserCheck, KeyRound } from 'lucide-react';
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
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Data Karyawan</h1>
            <div className="flex items-center gap-3">
                <Button 
                    variant="secondary"
                    onClick={() => dispatch({ type: 'ui/setPage', payload: Page.RoleManagement })}
                    className="flex items-center gap-2 font-semibold"
                >
                    🛡️ Kelola Jabatan
                </Button>
                <Button 
                    onClick={() => handleOpenModal()} 
                    className="bg-primary-600 text-white font-semibold hover:bg-primary-700 transition-colors"
                >
                    + Tambah Staf
                </Button>
            </div>
        </div>
      {/* DESKTOP TABLE VIEW (Visible on tablet & desktop screens) */}
      <div className="hidden sm:block overflow-x-auto bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200/80 dark:border-zinc-800 shadow-2xs">
        <Table>
          <Thead>
            <Tr>
              <Th>Karyawan</Th>
              <Th>Jabatan</Th>
              <Th>Kontak</Th>
              <Th>Status</Th>
              <Th className="text-right">Aksi</Th>
            </Tr>
          </Thead>
          <Tbody>
            {staff.map((member) => {
              const role = roles.find(r => r.id === member.roleId);
              return (
                <Tr key={member.id}>
                  <Td>
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white font-extrabold flex items-center justify-center text-xs shadow-xs shrink-0">
                        {member.name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <div className="font-extrabold text-zinc-900 dark:text-white text-sm">{member.name}</div>
                        <div className="text-[10px] text-zinc-400 font-mono">ID: #{member.id}</div>
                      </div>
                    </div>
                  </Td>
                  <Td>
                    <span className="inline-block text-[11px] font-extrabold px-2.5 py-0.5 rounded-md bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 border border-blue-200/50 dark:border-blue-800/40">
                      {role?.name || 'Staf'}
                    </span>
                  </Td>
                  <Td>
                    <div className="space-y-0.5 text-xs text-zinc-600 dark:text-zinc-400">
                      <div>✉️ {member.email || '-'}</div>
                      <div className="font-mono">📞 {member.phone || '-'}</div>
                    </div>
                  </Td>
                  <Td>
                    <span className={`inline-flex items-center gap-1.5 text-[10px] font-extrabold uppercase tracking-wider px-2.5 py-1 rounded-md ${
                      member.status === 'active' 
                      ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400 border border-emerald-200/60 dark:border-emerald-800/40' 
                      : 'bg-zinc-100 text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400'
                    }`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${member.status === 'active' ? 'bg-emerald-500' : 'bg-zinc-400'}`}></span>
                      {member.status === 'active' ? 'Active' : member.status}
                    </span>
                  </Td>
                  <Td className="text-right">
                    <ActionsDropdown>
                      <DropdownItem onClick={() => handleOpenModal(member)}>Ubah Data</DropdownItem>
                      {member.status !== 'archived' && (
                        <DropdownItem onClick={() => handleSetStatus(member.id, member.status === 'active' ? 'inactive' : 'active')}>
                          {member.status === 'active' ? 'Non-aktifkan' : 'Aktifkan'}
                        </DropdownItem>
                      )}
                    </ActionsDropdown>
                  </Td>
                </Tr>
              );
            })}
          </Tbody>
        </Table>
      </div>

      {/* MOBILE CARD GRID VIEW (Visible on mobile screens only) */}
      <div className="grid grid-cols-1 gap-4 sm:hidden overflow-y-auto pb-4">
        {staff.map((member) => {
          const role = roles.find(r => r.id === member.roleId);
          return (
            <div key={member.id} className="bg-white dark:bg-zinc-900 rounded-2xl p-5 border border-zinc-200/80 dark:border-zinc-800 shadow-2xs flex flex-col justify-between relative">
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-11 h-11 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white font-extrabold flex items-center justify-center text-sm shadow-xs shrink-0">
                    {member.name.charAt(0).toUpperCase()}
                  </div>
                  <div className="min-w-0 flex-1">
                    <h3 className="font-extrabold text-zinc-900 dark:text-white text-sm truncate leading-snug" title={member.name}>
                      {member.name}
                    </h3>
                    <div className="mt-0.5">
                      <span className="inline-block text-[10px] font-extrabold px-2 py-0.5 rounded-md bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 border border-blue-200/50 dark:border-blue-800/40">
                        {role?.name || 'Staf'}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="shrink-0">
                  <ActionsDropdown>
                    <DropdownItem onClick={() => handleOpenModal(member)}>Ubah Data</DropdownItem>
                    {member.status !== 'archived' && (
                      <DropdownItem onClick={() => handleSetStatus(member.id, member.status === 'active' ? 'inactive' : 'active')}>
                        {member.status === 'active' ? 'Non-aktifkan' : 'Aktifkan'}
                      </DropdownItem>
                    )}
                  </ActionsDropdown>
                </div>
              </div>

              <div className="space-y-2 py-3 border-t border-zinc-100 dark:border-zinc-800/80 mt-3 text-xs text-zinc-600 dark:text-zinc-400">
                <div className="flex items-center gap-2 min-w-0">
                  <span className="w-5 h-5 rounded-md bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center text-[10px] text-zinc-500 shrink-0">✉️</span>
                  <span className="truncate text-xs font-medium" title={member.email}>{member.email || '-'}</span>
                </div>
                <div className="flex items-center gap-2 min-w-0">
                  <span className="w-5 h-5 rounded-md bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center text-[10px] text-zinc-500 shrink-0">📞</span>
                  <span className="truncate text-xs font-medium font-mono">{member.phone || '-'}</span>
                </div>
              </div>

              <div className="pt-2.5 border-t border-zinc-100 dark:border-zinc-800/60 flex items-center justify-between mt-auto">
                <span className={`text-[10px] font-extrabold uppercase tracking-wider px-2.5 py-1 rounded-md flex items-center gap-1.5 ${
                  member.status === 'active' 
                  ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400 border border-emerald-200/60 dark:border-emerald-800/40' 
                  : 'bg-zinc-100 text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400'
                }`}>
                  <span className={`w-1.5 h-1.5 rounded-full ${member.status === 'active' ? 'bg-emerald-500' : 'bg-zinc-400'}`}></span>
                  {member.status === 'active' ? 'Active' : member.status}
                </span>
                <span className="text-[10px] text-zinc-400 font-mono">ID: #{member.id}</span>
              </div>
            </div>
          );
        })}
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

const APP_ACTIVE_FEATURES: { page: Page; label: string; category: string }[] = [
    { page: Page.POS, label: 'Point of Sales (Kasir)', category: 'Kasir' },
    { page: Page.SalesList, label: 'Penjualan', category: 'Sales & Pelanggan' },
    { page: Page.CustomerList, label: 'Data Pelanggan', category: 'Sales & Pelanggan' },
    { page: Page.ProductList, label: 'Data Produk', category: 'Produk & Inventori' },
    { page: Page.PurchaseList, label: 'Pesanan Pembelian', category: 'Pembelian' },
    { page: Page.Vendors, label: 'Vendor', category: 'Pembelian' },
    { page: Page.InventoryAdjustment, label: 'Penyesuaian Stok', category: 'Produk & Inventori' },
    { page: Page.GoodsReceipt, label: 'Penerimaan Barang', category: 'Produk & Inventori' },
    { page: Page.ReturnManagement, label: 'Manajemen Retur', category: 'Produk & Inventori' },
    { page: Page.ProductCategories, label: 'Kategori Produk', category: 'Produk & Inventori' },
    { page: Page.PrintPriceLabels, label: 'Cetak Label Harga', category: 'Produk & Inventori' },
    { page: Page.ChartOfAccounts, label: 'Bagan Akun (CoA)', category: 'Keuangan' },
    { page: Page.CashAccountList, label: 'Daftar Rekening Kas', category: 'Keuangan' },
    { page: Page.CashTransaction, label: 'Transaksi Kas', category: 'Keuangan' },
    { page: Page.CashTransfer, label: 'Transfer Kas', category: 'Keuangan' },
    { page: Page.VendorBillList, label: 'Tagihan Vendor', category: 'Keuangan' },
    { page: Page.CustomerBillList, label: 'Tagihan Pelanggan', category: 'Keuangan' },
    { page: Page.Capital, label: 'Modal & Investor', category: 'Keuangan' },
    { page: Page.PaymentMethods, label: 'Metode Bayar', category: 'Keuangan' },
    { page: Page.PaymentTerms, label: 'Tempo Bayar', category: 'Keuangan' },
    { page: Page.StaffList, label: 'Data Karyawan', category: 'Karyawan' },
    { page: Page.RoleManagement, label: 'Jabatan & Hak Akses', category: 'Karyawan' },
    { page: Page.Promotions, label: 'Promosi', category: 'Pemasaran' },
    { page: Page.PromotionsVoucher, label: 'Voucher', category: 'Pemasaran' },
    { page: Page.PromotionsPoints, label: 'Poin Pelanggan', category: 'Pemasaran' },
    { page: Page.SalesReport, label: 'Laporan Penjualan', category: 'Laporan' },
    { page: Page.PurchaseReport, label: 'Laporan Pembelian', category: 'Laporan' },
    { page: Page.GoodsReport, label: 'Laporan Barang', category: 'Laporan' },
    { page: Page.FinancialInventoryReport, label: 'Keuangan Inventaris', category: 'Laporan' },
    { page: Page.CashierDepositReport, label: 'Setoran Kasir', category: 'Laporan' },
    { page: Page.IncomeStatementReport, label: 'Laporan Laba Rugi', category: 'Laporan' },
    { page: Page.FinancialPositionReport, label: 'Posisi Keuangan', category: 'Laporan' },
    { page: Page.CompanyInformationSettings, label: 'Informasi Perusahaan', category: 'Pengaturan' },
    { page: Page.BackupRestore, label: 'Backup & Restore', category: 'Pengaturan' },
    { page: Page.DisplaySettings, label: 'Pengaturan Tampilan', category: 'Pengaturan' },
    { page: Page.ReportSizesSettings, label: 'Printer', category: 'Pengaturan' },
    { page: Page.About, label: 'Tentang Aplikasi', category: 'Pengaturan' },
];

const RoleModal: React.FC<{
    isOpen: boolean;
    onClose: () => void;
    existingRole: Role | null;
}> = ({ isOpen, onClose, existingRole }) => {
    const { dispatch } = useAppContext();
    const [name, setName] = useState('');
    const [permissions, setPermissions] = useState<Page[]>([]);
    const [featurePermissions, setFeaturePermissions] = useState<Record<string, { create: boolean; read: boolean; update: boolean; delete: boolean }>>({});
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        if(isOpen) {
            setName(existingRole?.name || '');
            setPermissions(existingRole?.permissions || []);
            setFeaturePermissions(existingRole?.featurePermissions || {});
            setSearchTerm('');
        }
    }, [isOpen, existingRole]);

    const handleToggleCrud = (page: Page, action: 'create' | 'read' | 'update' | 'delete', checked: boolean) => {
        const current = featurePermissions[page] || { 
            create: true, 
            read: permissions.includes(page), 
            update: true, 
            delete: true 
        };
        const updated = { ...current, [action]: checked };
        const newFP = { ...featurePermissions, [page]: updated };
        setFeaturePermissions(newFP);
        
        let newPermissions = [...permissions];
        if (action === 'read') {
            if (checked && !newPermissions.includes(page)) {
                newPermissions.push(page);
            } else if (!checked) {
                newPermissions = newPermissions.filter(p => p !== page);
            }
        }
        setPermissions(newPermissions);
    };

    const handleSelectAllRead = (selectAll: boolean) => {
        const activePages = APP_ACTIVE_FEATURES.map(f => f.page);
        if (selectAll) {
            setPermissions([...activePages]);
            const newFP = { ...featurePermissions };
            activePages.forEach(p => {
                const prev = newFP[p] || { create: true, read: false, update: true, delete: true };
                newFP[p] = { ...prev, read: true };
            });
            setFeaturePermissions(newFP);
        } else {
            setPermissions([]);
            const newFP = { ...featurePermissions };
            activePages.forEach(p => {
                const prev = newFP[p] || { create: true, read: true, update: true, delete: true };
                newFP[p] = { ...prev, read: false };
            });
            setFeaturePermissions(newFP);
        }
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (existingRole) {
            dispatch({ type: 'staff/updateRole', payload: { ...existingRole, name, permissions, featurePermissions } });
        } else {
            dispatch({ type: 'staff/addRole', payload: { name, permissions, featurePermissions } });
        }
        onClose();
    };

    const filteredFeatures = useMemo(() => {
        return APP_ACTIVE_FEATURES.filter(item => 
            item.label.toLowerCase().includes(searchTerm.toLowerCase()) || 
            item.category.toLowerCase().includes(searchTerm.toLowerCase())
        );
    }, [searchTerm]);

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={`${existingRole ? 'Ubah' : 'Tambah'} Jabatan & Hak Akses Fitur`} maxWidth="max-w-4xl">
            <form onSubmit={handleSubmit} className="space-y-5">
                <div>
                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-200 mb-1">Nama Jabatan*</label>
                    <Input value={name} onChange={e => setName(e.target.value)} placeholder="Contoh: Manager, Kasir, Admin" required />
                </div>

                <div className="border-t dark:border-gray-700 pt-4 space-y-3">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div>
                            <h3 className="font-bold text-gray-900 dark:text-white text-base">Hak Akses & Pembatasan Fitur (CRUD)</h3>
                            <p className="text-xs text-gray-500 dark:text-gray-400">Pilih fitur aktif dan atur batasan operasi Create (C), Read (R), Update (U), Delete (D) untuk jabatan ini.</p>
                        </div>
                        <div className="flex items-center gap-2 text-xs">
                            <button type="button" onClick={() => handleSelectAllRead(true)} className="px-2.5 py-1.5 rounded bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300 font-semibold hover:bg-blue-200">
                                Pilih Semua Fitur
                            </button>
                            <button type="button" onClick={() => handleSelectAllRead(false)} className="px-2.5 py-1.5 rounded bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 font-semibold hover:bg-gray-200">
                                Hapus Semua
                            </button>
                        </div>
                    </div>

                    <Input 
                        value={searchTerm} 
                        onChange={e => setSearchTerm(e.target.value)} 
                        placeholder="🔍 Cari nama fitur atau kategori..." 
                        className="w-full text-sm"
                    />

                    <div className="max-h-[45vh] overflow-y-auto border rounded-lg dark:border-gray-700">
                        <Table>
                            <Thead>
                                <Tr className="bg-gray-50 dark:bg-gray-800 sticky top-0">
                                    <Th>Fitur Aplikasi</Th>
                                    <Th className="text-center">Create (C)</Th>
                                    <Th className="text-center">Read (R)</Th>
                                    <Th className="text-center">Update (U)</Th>
                                    <Th className="text-center">Delete (D)</Th>
                                </Tr>
                            </Thead>
                            <Tbody>
                                {filteredFeatures.map(item => {
                                    const fp = featurePermissions[item.page] || { 
                                        create: true, 
                                        read: permissions.includes(item.page), 
                                        update: true, 
                                        delete: true 
                                    };
                                    return (
                                        <Tr key={item.page} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                                            <Td>
                                                <div className="font-medium text-sm text-gray-900 dark:text-white">{item.label}</div>
                                                <span className="inline-block mt-0.5 text-[10px] font-semibold px-2 py-0.5 rounded bg-slate-100 dark:bg-gray-700 text-slate-600 dark:text-gray-300">
                                                    {item.category}
                                                </span>
                                            </Td>
                                            <Td className="text-center">
                                                <input 
                                                    type="checkbox" 
                                                    checked={fp.create} 
                                                    onChange={e => handleToggleCrud(item.page, 'create', e.target.checked)}
                                                    className="rounded text-primary-600 w-4 h-4 cursor-pointer"
                                                />
                                            </Td>
                                            <Td className="text-center">
                                                <input 
                                                    type="checkbox" 
                                                    checked={fp.read} 
                                                    onChange={e => handleToggleCrud(item.page, 'read', e.target.checked)}
                                                    className="rounded text-primary-600 w-4 h-4 cursor-pointer"
                                                />
                                            </Td>
                                            <Td className="text-center">
                                                <input 
                                                    type="checkbox" 
                                                    checked={fp.update} 
                                                    onChange={e => handleToggleCrud(item.page, 'update', e.target.checked)}
                                                    className="rounded text-primary-600 w-4 h-4 cursor-pointer"
                                                />
                                            </Td>
                                            <Td className="text-center">
                                                <input 
                                                    type="checkbox" 
                                                    checked={fp.delete} 
                                                    onChange={e => handleToggleCrud(item.page, 'delete', e.target.checked)}
                                                    className="rounded text-primary-600 w-4 h-4 cursor-pointer"
                                                />
                                            </Td>
                                        </Tr>
                                    );
                                })}
                            </Tbody>
                        </Table>
                    </div>
                </div>

                <div className="flex justify-end gap-2 pt-4 border-t dark:border-gray-700">
                    <Button variant="secondary" onClick={onClose}>Batal</Button>
                    <Button type="submit">Simpan Jabatan & Hak Akses</Button>
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
    const [searchTerm, setSearchTerm] = useState('');

    const staffCountByRole = useMemo(() => {
        return roles.map(role => ({
            ...role,
            staffCount: staff.filter(s => s.roleId === role.id).length,
        }));
    }, [roles, staff]);

    const filteredRoles = useMemo(() => {
        if (!searchTerm.trim()) return staffCountByRole;
        return staffCountByRole.filter(r => r.name.toLowerCase().includes(searchTerm.toLowerCase()));
    }, [staffCountByRole, searchTerm]);

    const handleOpenRoleModal = (role: Role | null) => {
        setSelectedRole(role);
        setRoleModalOpen(true);
    };

    const handleDeleteRole = (roleId: string) => {
        if (window.confirm("Anda yakin ingin menghapus jabatan ini? Pastikan tidak ada staf yang menggunakan jabatan ini.")) {
            dispatch({ type: 'staff/deleteRole', payload: roleId });
        }
    };
  
    return (
        <div className="w-full h-full flex flex-col space-y-3.5">
            {/* Compact Header Section */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white dark:bg-gray-800 px-5 py-4 rounded-xl border border-gray-100 dark:border-gray-700/60 shadow-xs">
                <div className="flex items-center gap-3">
                    <div className="p-2.5 bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-lg border border-blue-100 dark:border-blue-800/40 shrink-0">
                        <ShieldCheck className="w-6 h-6" />
                    </div>
                    <div>
                        <div className="flex items-center gap-2.5 flex-wrap">
                            <h1 className="text-xl font-bold text-gray-900 dark:text-white tracking-tight">
                                Jabatan & Kelola Akses
                            </h1>
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-indigo-50 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300 border border-indigo-100 dark:border-indigo-800/40">
                                <Shield className="w-3 h-3" /> {roles.length} Jabatan
                            </span>
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300 border border-emerald-100 dark:border-emerald-800/40">
                                <Users className="w-3 h-3" /> {staff.length} Karyawan
                            </span>
                        </div>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                            Kelola struktur jabatan dan atur hak akses pembatasan CRU tiap fitur staf.
                        </p>
                    </div>
                </div>
                <div className="flex items-center gap-2.5 shrink-0 self-end sm:self-center">
                    <button 
                        onClick={() => dispatch({ type: 'ui/setPage', payload: Page.StaffList })}
                        className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium text-gray-700 dark:text-gray-200 bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 rounded-lg transition-all whitespace-nowrap shadow-2xs cursor-pointer"
                    >
                        <ArrowLeft className="w-3.5 h-3.5" />
                        Kembali ke Data Karyawan
                    </button>
                    <button 
                        onClick={() => handleOpenRoleModal(null)}
                        className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 dark:bg-blue-600 dark:hover:bg-blue-500 rounded-lg transition-all whitespace-nowrap shadow-xs active:scale-95 cursor-pointer"
                    >
                        <Plus className="w-3.5 h-3.5" />
                        Tambah Jabatan
                    </button>
                </div>
            </div>

            {/* Main Content Card with Integrated Search Header & Table */}
            <Card className="flex-grow flex flex-col overflow-hidden border border-gray-100 dark:border-gray-700/60 shadow-xs rounded-xl">
                {/* Compact Toolbar */}
                <div className="px-4 py-3 border-b border-gray-100 dark:border-gray-700/60 flex items-center justify-between gap-4 bg-gray-50/50 dark:bg-gray-800/50">
                    <div className="relative flex-grow max-w-xs">
                        <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                        <input
                            type="text"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            placeholder="Cari nama jabatan..."
                            className="w-full pl-8 pr-3 py-1.5 text-xs bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-md text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-blue-500"
                        />
                    </div>
                    <div className="flex items-center gap-3 text-xs text-gray-500 dark:text-gray-400 font-medium">
                        <span>Menampilkan {filteredRoles.length} dari {roles.length} Jabatan</span>
                    </div>
                </div>

                {/* Table */}
                <div className="flex-grow overflow-y-auto">
                    <Table>
                        <Thead>
                            <Tr className="bg-gray-50/80 dark:bg-gray-700/50 text-[11px] font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                                <Th>Nama Jabatan</Th>
                                <Th>Jumlah Staf</Th>
                                <Th className="text-right">Aksi</Th>
                            </Tr>
                        </Thead>
                        <Tbody>
                            {filteredRoles.length === 0 ? (
                                <Tr>
                                    <Td colSpan={3} className="text-center py-6 text-xs text-gray-400 dark:text-gray-500">
                                        Tidak ada jabatan yang ditemukan.
                                    </Td>
                                </Tr>
                            ) : (
                                filteredRoles.map(role => (
                                    <Tr key={role.id} className="hover:bg-gray-50/80 dark:hover:bg-gray-700/40 transition-colors">
                                        <Td className="py-2.5 font-semibold text-gray-900 dark:text-white">
                                            <div className="flex items-center gap-2.5">
                                                <div className="w-7 h-7 rounded-md bg-blue-50 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400 flex items-center justify-center font-bold text-xs border border-blue-100 dark:border-blue-800/40">
                                                    {role.name.charAt(0).toUpperCase()}
                                                </div>
                                                <div>
                                                    <span className="text-xs font-semibold">{role.name}</span>
                                                    {role.permissions && (
                                                        <div className="text-[10px] font-normal text-gray-400 dark:text-gray-500">
                                                            {role.permissions.length} Hak Akses
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </Td>
                                        <Td className="py-2.5">
                                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-50 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300 border border-blue-100 dark:border-blue-800/40">
                                                <Users className="w-3 h-3" />
                                                {role.staffCount} Staf
                                            </span>
                                        </Td>
                                        <Td className="py-2.5 text-right">
                                            <div className="flex items-center justify-end gap-1.5">
                                                <button
                                                    onClick={() => handleOpenRoleModal(role)}
                                                    className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-blue-700 bg-blue-50 hover:bg-blue-100 dark:text-blue-300 dark:bg-blue-950/60 dark:hover:bg-blue-900/80 border border-blue-200/80 dark:border-blue-800/60 rounded-md transition-all whitespace-nowrap active:scale-95 cursor-pointer"
                                                    title="Ubah Jabatan & Atur Hak Akses"
                                                >
                                                    <ShieldCheck className="w-3.5 h-3.5" />
                                                    Ubah & Hak Akses
                                                </button>
                                                <button
                                                    onClick={() => handleDeleteRole(role.id)}
                                                    className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-rose-700 bg-rose-50 hover:bg-rose-100 dark:text-rose-300 dark:bg-rose-950/60 dark:hover:bg-rose-900/80 border border-rose-200/80 dark:border-rose-800/60 rounded-md transition-all whitespace-nowrap active:scale-95 cursor-pointer"
                                                    title="Hapus Jabatan"
                                                >
                                                    <Trash2 className="w-3.5 h-3.5" />
                                                    Hapus
                                                </button>
                                            </div>
                                        </Td>
                                    </Tr>
                                ))
                            )}
                        </Tbody>
                    </Table>
                </div>
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
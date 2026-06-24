import React, { useState, useEffect } from 'react';
import { 
  Users, UserPlus, Edit2, Trash2, Search, Mail, Phone, Shield, User, Key
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import { TextField, InputAdornment, IconButton, MenuItem, Dialog, DialogTitle, DialogContent, DialogActions, Button } from '@mui/material';
import { getStaffApi, createStaffApi, updateStaffApi, deleteStaffApi, getRolesApi } from '../Action/api';

const StaffManager = () => {
  const [staffList, setStaffList] = useState([]);
  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [selectedStaffId, setSelectedStaffId] = useState(null);
  
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    roleId: '',
    password: ''
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [staffRes, rolesRes] = await Promise.all([
        getStaffApi(),
        getRolesApi()
      ]);
      
      if (staffRes.data?.success) {
        setStaffList(staffRes.data.data);
      }
      if (rolesRes.data?.success) {
        setRoles(rolesRes.data.data);
      }
    } catch (error) {
      toast.error('Failed to load staff data');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenModal = (staff = null) => {
    if (staff) {
      setIsEditMode(true);
      setSelectedStaffId(staff.id);
      setFormData({
        name: staff.name,
        email: staff.email,
        phone: staff.phone || '',
        roleId: staff.roleId,
        password: '' // empty password on edit
      });
    } else {
      setIsEditMode(false);
      setSelectedStaffId(null);
      setFormData({
        name: '',
        email: '',
        phone: '',
        roleId: roles.length > 0 ? roles[0].id : '',
        password: ''
      });
    }
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name || !formData.email || !formData.roleId || (!isEditMode && !formData.password)) {
      return toast.error('Please fill all required fields');
    }

    try {
      let res;
      if (isEditMode) {
        res = await updateStaffApi(selectedStaffId, formData);
      } else {
        res = await createStaffApi(formData);
      }

      if (res.data?.success) {
        toast.success(res.data.message);
        handleCloseModal();
        fetchData();
      }
    } catch (error) {
      toast.error(error.response?.data?.message || `Failed to ${isEditMode ? 'update' : 'create'} staff`);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to remove this staff member?')) return;
    try {
      const res = await deleteStaffApi(id);
      if (res.data?.success) {
        toast.success(res.data.message);
        fetchData();
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to delete staff');
    }
  };

  const filteredStaff = staffList.filter(s => 
    s.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    s.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="p-6">
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900 dark:text-white flex items-center gap-2">
            <Users className="text-[#e2148d]" size={24} /> Staff Manager
          </h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">Manage admin access and roles</p>
        </div>
        <button 
          onClick={() => handleOpenModal()}
          className="bg-[#e2148d] hover:bg-[#c11078] text-white px-4 py-2.5 rounded-lg flex items-center justify-center gap-2 font-medium transition-all shadow-md shadow-[#e2148d]/20 whitespace-nowrap"
        >
          <UserPlus size={18} />
          <span>Add Staff</span>
        </button>
      </div>

      <div className="bg-white dark:bg-dark-card rounded-2xl shadow-sm border border-slate-100 dark:border-dark-border overflow-hidden">
        <div className="p-4 border-b border-slate-100 dark:border-dark-border flex items-center">
          <TextField
            placeholder="Search staff..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            size="small"
            fullWidth
            slotProps={{
              input: {
                startAdornment: (
                  <InputAdornment position="start">
                    <Search size={18} className="text-slate-400" />
                  </InputAdornment>
                ),
                style: { backgroundColor: 'transparent' }
              }
            }}
            className="max-w-md"
          />
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 dark:bg-dark-bg/50 text-slate-500 dark:text-slate-400 text-xs uppercase tracking-wider">
                <th className="p-4 font-medium">Name</th>
                <th className="p-4 font-medium">Contact</th>
                <th className="p-4 font-medium">Role</th>
                <th className="p-4 font-medium text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-dark-border">
              {loading ? (
                <tr>
                  <td colSpan="4" className="p-8 text-center text-slate-500">Loading staff...</td>
                </tr>
              ) : filteredStaff.length === 0 ? (
                <tr>
                  <td colSpan="4" className="p-8 text-center text-slate-500">No staff found.</td>
                </tr>
              ) : (
                filteredStaff.map((staff) => (
                  <tr key={staff.id} className="hover:bg-slate-50/50 dark:hover:bg-dark-bg/50 transition-colors">
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-slate-100 dark:bg-dark-bg flex items-center justify-center text-[#e2148d] font-bold shrink-0">
                          {staff.name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <p className="font-semibold text-slate-800 dark:text-white">{staff.name}</p>
                          <p className="text-xs text-slate-500">Joined {new Date(staff.createdAt).toLocaleDateString()}</p>
                        </div>
                      </div>
                    </td>
                    <td className="p-4">
                      <div className="flex flex-col gap-1">
                        <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300">
                          <Mail size={14} className="text-slate-400" />
                          <span>{staff.email}</span>
                        </div>
                        {staff.phone && (
                          <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300">
                            <Phone size={14} className="text-slate-400" />
                            <span>{staff.phone}</span>
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="p-4">
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400">
                        <Shield size={12} />
                        {staff.role}
                      </span>
                    </td>
                    <td className="p-4 text-center">
                      <div className="flex items-center justify-center gap-2">
                        <IconButton onClick={() => handleOpenModal(staff)} size="small" className="text-slate-400 hover:text-blue-500 dark:text-slate-500">
                          <Edit2 size={18} />
                        </IconButton>
                        <IconButton onClick={() => handleDelete(staff.id)} size="small" className="text-slate-400 hover:text-red-500 dark:text-slate-500">
                          <Trash2 size={18} />
                        </IconButton>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <Dialog open={isModalOpen} onClose={handleCloseModal} maxWidth="sm" fullWidth>
        <form onSubmit={handleSubmit}>
          <DialogTitle className="text-slate-800 dark:text-white font-semibold">
            {isEditMode ? 'Edit Staff Member' : 'Add New Staff'}
          </DialogTitle>
          <DialogContent dividers className="space-y-4">
            
            <TextField
              label="Full Name"
              name="name"
              value={formData.name}
              onChange={handleChange}
              fullWidth
              required
              slotProps={{
                input: {
                  startAdornment: <InputAdornment position="start"><User size={18} className="text-slate-400" /></InputAdornment>
                }
              }}
            />

            <TextField
              label="Email Address"
              name="email"
              type="email"
              value={formData.email}
              onChange={handleChange}
              fullWidth
              required
              slotProps={{
                input: {
                  startAdornment: <InputAdornment position="start"><Mail size={18} className="text-slate-400" /></InputAdornment>
                }
              }}
            />

            <TextField
              label="Phone Number"
              name="phone"
              value={formData.phone}
              onChange={handleChange}
              fullWidth
              slotProps={{
                input: {
                  startAdornment: <InputAdornment position="start"><Phone size={18} className="text-slate-400" /></InputAdornment>
                }
              }}
            />

            <TextField
              select
              label="Role"
              name="roleId"
              value={formData.roleId}
              onChange={handleChange}
              fullWidth
              required
              slotProps={{
                input: {
                  startAdornment: <InputAdornment position="start"><Shield size={18} className="text-slate-400" /></InputAdornment>
                }
              }}
            >
              {roles.map((role) => (
                <MenuItem key={role.id} value={role.id}>
                  {role.name}
                </MenuItem>
              ))}
            </TextField>

            <TextField
              label={isEditMode ? "New Password (Optional)" : "Password"}
              name="password"
              type="password"
              value={formData.password}
              onChange={handleChange}
              fullWidth
              required={!isEditMode}
              slotProps={{
                input: {
                  startAdornment: <InputAdornment position="start"><Key size={18} className="text-slate-400" /></InputAdornment>
                }
              }}
              helperText={isEditMode ? "Leave blank to keep current password" : ""}
            />

          </DialogContent>
          <DialogActions className="p-4 bg-slate-50 dark:bg-dark-bg/50">
            <Button onClick={handleCloseModal} color="inherit" className="text-slate-600 dark:text-slate-400">
              Cancel
            </Button>
            <Button 
              type="submit" 
              variant="contained" 
              sx={{ backgroundColor: '#e2148d', '&:hover': { backgroundColor: '#c11078' } }}
              className="shadow-md shadow-[#e2148d]/20"
            >
              {isEditMode ? 'Update Staff' : 'Create Staff'}
            </Button>
          </DialogActions>
        </form>
      </Dialog>
    </div>
  );
};

export default StaffManager;

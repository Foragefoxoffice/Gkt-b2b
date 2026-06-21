import React, { useState, useEffect } from 'react';
import { User, Lock, Camera, Save, Phone, Mail, Settings } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { useDispatch, useSelector } from 'react-redux';
import { TextField, InputAdornment } from '@mui/material';
import { getProfileApi, updateProfileApi, changePasswordApi } from '../Action/api';
import { updateUser } from '../store/slices/authSlice';

const AdminSettings = () => {
  const [activeTab, setActiveTab] = useState('profile');
  const [loading, setLoading] = useState(false);
  const dispatch = useDispatch();
  const { user } = useSelector((state) => state.auth);

  const [profileData, setProfileData] = useState({
    name: '',
    phone: '',
    email: '',
    role: ''
  });
  const [avatar, setAvatar] = useState(null);
  const [avatarPreview, setAvatarPreview] = useState(null);

  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const res = await getProfileApi();
      if (res.data?.success) {
        const { name, phone, email, avatar, role } = res.data.data;
        setProfileData({ name: name || '', phone: phone || '', email, role: role.name });
        if (avatar) {
          setAvatarPreview(avatar.startsWith('http') ? avatar : `${import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:5000'}${avatar.startsWith('/') ? '' : '/'}${avatar}`);
        }
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to fetch profile');
    }
  };

  const handleProfileChange = (e) => {
    setProfileData({ ...profileData, [e.target.name]: e.target.value });
  };

  const handleAvatarChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setAvatar(file);
      setAvatarPreview(URL.createObjectURL(file));
    }
  };

  const handlePasswordChange = (e) => {
    setPasswordData({ ...passwordData, [e.target.name]: e.target.value });
  };

  const submitProfile = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const formData = new FormData();
      formData.append('name', profileData.name);
      formData.append('phone', profileData.phone);
      if (avatar) {
        formData.append('avatar', avatar);
      }

      const res = await updateProfileApi(formData);
      if (res.data?.success) {
        toast.success(res.data.message);
        dispatch(updateUser(res.data.data));
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  const submitPassword = async (e) => {
    e.preventDefault();
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast.error('New passwords do not match');
      return;
    }
    setLoading(true);
    try {
      const res = await changePasswordApi({
        currentPassword: passwordData.currentPassword,
        newPassword: passwordData.newPassword
      });
      if (res.data?.success) {
        toast.success(res.data.message);
        setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to change password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6">
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900 dark:text-white flex items-center gap-2"><Settings className='text-[#e2148d]' size={24} /> Settings</h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">Manage your account preferences</p>
        </div>
      </div>

      <div className="bg-white dark:bg-dark-card rounded-2xl shadow-sm border border-slate-100 dark:border-dark-border overflow-hidden flex flex-col md:flex-row min-h-[600px]">

        {/* Sidebar */}
        <div className="w-full md:w-64 bg-slate-50/50 dark:bg-dark-bg/50 border-b md:border-b-0 md:border-r border-slate-100 dark:border-dark-border p-6 flex flex-col gap-2 shrink-0">
          <button
            onClick={() => setActiveTab('profile')}
            className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${activeTab === 'profile' ? 'bg-[#e2148d] text-white font-medium shadow-md shadow-[#e2148d]/20' : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-dark-border'}`}
          >
            <User size={18} />
            <span>Profile Information</span>
          </button>

          <button
            onClick={() => setActiveTab('password')}
            className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${activeTab === 'password' ? 'bg-[#e2148d] text-white font-medium shadow-md shadow-[#e2148d]/20' : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-dark-border'}`}
          >
            <Lock size={18} />
            <span>Change Password</span>
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 p-6 sm:p-10">

          {/* Profile Tab */}
          {activeTab === 'profile' && (
            <div className="max-w-2xl animate-in fade-in slide-in-from-bottom-4 duration-300">
              <h2 className="text-xl font-semibold text-slate-800 dark:text-white mb-6">Profile Information</h2>

              <form onSubmit={submitProfile} className="space-y-6">

                {/* Avatar Section */}
                <div className="flex items-center gap-6">
                  <div className="relative">
                    <div className="w-24 h-24 rounded-full overflow-hidden bg-slate-100 dark:bg-dark-bg border-4 border-white dark:border-dark-card shadow-lg flex items-center justify-center">
                      {avatarPreview ? (
                        <img src={avatarPreview} alt="Avatar" className="w-full h-full object-cover" />
                      ) : (
                        <User size={40} className="text-slate-300 dark:text-slate-600" />
                      )}
                    </div>
                    <label htmlFor="avatar-upload" className="absolute bottom-0 right-0 p-2 bg-[#e2148d] text-white rounded-full cursor-pointer hover:bg-[#c11078] transition-colors shadow-md ring-2 ring-white dark:ring-dark-card">
                      <Camera size={14} />
                    </label>
                    <input id="avatar-upload" type="file" accept="image/*" className="hidden" onChange={handleAvatarChange} />
                  </div>
                  <div>
                    <h3 className="font-semibold text-slate-800 dark:text-white">Profile Photo</h3>
                    <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Upload a new photo to update your avatar.</p>
                  </div>
                </div>

                <hr className="border-slate-100 dark:border-dark-border" />

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <TextField
                    label="Full Name"
                    name="name"
                    value={profileData.name}
                    onChange={handleProfileChange}
                    fullWidth
                    required
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <User size={18} className="text-slate-400" />
                        </InputAdornment>
                      ),
                    }}
                  />

                  <TextField
                    label="Phone Number"
                    name="phone"
                    value={profileData.phone}
                    onChange={handleProfileChange}
                    fullWidth
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <Phone size={18} className="text-slate-400" />
                        </InputAdornment>
                      ),
                    }}
                  />

                  <TextField
                    label="Email Address"
                    value={profileData.email}
                    fullWidth
                    disabled
                    helperText="Email cannot be changed."
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <Mail size={18} className="text-slate-400" />
                        </InputAdornment>
                      ),
                    }}
                  />

                  <TextField
                    label="Role"
                    value={profileData.role}
                    fullWidth
                    disabled
                    InputProps={{
                      style: { textTransform: 'uppercase' }
                    }}
                  />
                </div>

                <div className="pt-4 flex justify-end">
                  <button
                    type="submit"
                    disabled={loading}
                    className="flex items-center gap-2 bg-[#e2148d] hover:bg-[#c11078] text-white px-6 py-2.5 rounded-lg font-medium transition-all shadow-md shadow-[#e2148d]/20 disabled:opacity-70"
                  >
                    <Save size={18} />
                    {loading ? 'Saving...' : 'Save Changes'}
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Password Tab */}
          {activeTab === 'password' && (
            <div className="max-w-xl animate-in fade-in slide-in-from-bottom-4 duration-300">
              <h2 className="text-xl font-semibold text-slate-800 dark:text-white mb-6">Change Password</h2>

              <form onSubmit={submitPassword} className="space-y-6">
                <TextField
                  label="Current Password"
                  type="password"
                  name="currentPassword"
                  value={passwordData.currentPassword}
                  onChange={handlePasswordChange}
                  fullWidth
                  required
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <Lock size={18} className="text-slate-400" />
                      </InputAdornment>
                    ),
                  }}
                />

                <hr className="border-slate-100 dark:border-dark-border" />

                <TextField
                  label="New Password"
                  type="password"
                  name="newPassword"
                  value={passwordData.newPassword}
                  onChange={handlePasswordChange}
                  fullWidth
                  required
                  inputProps={{ minLength: 6 }}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <Lock size={18} className="text-slate-400" />
                      </InputAdornment>
                    ),
                  }}
                />

                <TextField
                  label="Confirm New Password"
                  type="password"
                  name="confirmPassword"
                  value={passwordData.confirmPassword}
                  onChange={handlePasswordChange}
                  fullWidth
                  required
                  inputProps={{ minLength: 6 }}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <Lock size={18} className="text-slate-400" />
                      </InputAdornment>
                    ),
                  }}
                />

                <div className="pt-4 flex justify-end">
                  <button
                    type="submit"
                    disabled={loading}
                    className="flex items-center gap-2 bg-[#e2148d] hover:bg-[#c11078] text-white px-6 py-2.5 rounded-lg font-medium transition-all shadow-md shadow-[#e2148d]/20 disabled:opacity-70"
                  >
                    <Save size={18} />
                    {loading ? 'Updating...' : 'Update Password'}
                  </button>
                </div>
              </form>
            </div>
          )}

        </div>
      </div>
    </div>
  );
};

export default AdminSettings;

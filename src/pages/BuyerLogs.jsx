import React, { useState, useEffect } from 'react';
import { getBuyerLogsApi } from '../Action/api';
import { Clock, LogOut, LogIn, User, User2, Search, Filter, Loader2 } from 'lucide-react';
import { useSocket } from '../context/SocketContext';
import { Select, MenuItem, FormControl } from '@mui/material';

const BuyerLogs = () => {
  const socket = useSocket();
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({ page: 1, limit: 10, totalPages: 1 });
  const [searchQuery, setSearchQuery] = useState('');
  const [actionFilter, setActionFilter] = useState('ALL');

  const fetchLogs = async (page = 1) => {
    try {
      setLoading(true);
      const response = await getBuyerLogsApi({ 
        page, 
        limit: pagination.limit,
        search: searchQuery,
        action: actionFilter 
      });
      if (response.data?.success) {
        setLogs(response.data.data.logs);
        setPagination(response.data.data.pagination);
      }
    } catch (error) {
      console.error("Failed to fetch logs", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      fetchLogs(pagination.page);
    }, 500); // 500ms debounce for search

    return () => clearTimeout(delayDebounceFn);
  }, [pagination.page, searchQuery, actionFilter]);

  useEffect(() => {
    if (!socket) return;
    
    const handleNewLog = () => {
      // Refresh logs immediately when a new one arrives
      if (pagination.page === 1) {
        fetchLogs(1);
      } else {
        setPagination(p => ({ ...p, page: 1 }));
      }
    };

    socket.on('newBuyerLog', handleNewLog);
    return () => socket.off('newBuyerLog', handleNewLog);
  }, [socket, pagination.page]);

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-semibold text-slate-800 dark:text-white"><User2 className="inline mr-2 text-primary-500" size={24} />Buyer Access Logs</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Track login and logout activities of buyers</p>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
        {/* Filters Section */}
        <div className="p-5 border-b border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/50">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <input
                type="text"
                placeholder="Search by name or email..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setPagination(p => ({ ...p, page: 1 }));
                }}
                className="w-full pl-11 pr-4 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all dark:text-white shadow-sm"
              />
            </div>
            <div className="w-full sm:w-64 shrink-0">
              <FormControl fullWidth size="small">
                <Select
                  value={actionFilter}
                  onChange={(e) => {
                    setActionFilter(e.target.value);
                    setPagination(p => ({ ...p, page: 1 }));
                  }}
                  displayEmpty
                  renderValue={(selected) => {
                    const label = selected === 'ALL' ? 'All Actions' : selected === 'LOGIN' ? 'Login Only' : 'Logout Only';
                    return (
                      <div className="flex items-center gap-2.5">
                        <Filter size={18} className="text-slate-400" />
                        <span className="text-slate-700 dark:text-slate-200">{label}</span>
                      </div>
                    );
                  }}
                  MenuProps={{
                    PaperProps: {
                      sx: {
                        borderRadius: '0.75rem',
                        boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
                        mt: 1,
                      }
                    }
                  }}
                  sx={{
                    borderRadius: '0.75rem',
                    backgroundColor: 'white',
                    height: '42px',
                    '.MuiOutlinedInput-notchedOutline': {
                      borderColor: '#e2e8f0',
                    },
                    '&:hover .MuiOutlinedInput-notchedOutline': {
                      borderColor: '#cbd5e1',
                    },
                    '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                      borderColor: '#e2148d',
                      borderWidth: '1px'
                    },
                    '.MuiSelect-select': {
                      paddingTop: '9px',
                      paddingBottom: '9px',
                      fontSize: '0.875rem'
                    },
                    '.MuiSvgIcon-root': {
                       color: '#94a3b8'
                    }
                  }}
                >
                  <MenuItem value="ALL" sx={{ fontSize: '0.875rem', py: 1.5 }}>All Actions</MenuItem>
                  <MenuItem value="LOGIN" sx={{ fontSize: '0.875rem', py: 1.5 }}>Login Only</MenuItem>
                  <MenuItem value="LOGOUT" sx={{ fontSize: '0.875rem', py: 1.5 }}>Logout Only</MenuItem>
                </Select>
              </FormControl>
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-700/50 text-slate-500 dark:text-slate-400 text-sm uppercase tracking-wider">
                <th className="p-4 font-medium">User</th>
                <th className="p-4 font-medium">Email</th>
                <th className="p-4 font-medium">Action</th>
                <th className="p-4 font-medium">IP Address</th>
                <th className="p-4 font-medium">Timestamp</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
              {loading ? (
                <tr>
                  <td colSpan="5" className="p-16 text-center">
                    <div className="flex flex-col items-center justify-center">
                      <Loader2 className="w-8 h-8 text-primary-500 animate-spin mb-4" />
                      <p className="text-slate-500 dark:text-slate-400 font-medium">Fetching logs...</p>
                    </div>
                  </td>
                </tr>
              ) : logs.length === 0 ? (
                <tr>
                  <td colSpan="5" className="p-8 text-center text-slate-500">No logs found</td>
                </tr>
              ) : (
                logs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors">
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-blue-600 dark:text-blue-400">
                          <User size={16} />
                        </div>
                        <span className="font-medium text-slate-700 dark:text-slate-300">
                          {log.user?.name || 'Unknown User'}
                        </span>
                      </div>
                    </td>
                    <td className="p-4 text-slate-600 dark:text-slate-400">
                      {log.user?.email || 'N/A'}
                    </td>
                    <td className="p-4">
                      {log.action === 'LOGIN' ? (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400">
                          <LogIn className="w-3.5 h-3.5" />
                          Login
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400">
                          <LogOut className="w-3.5 h-3.5" />
                          Logout
                        </span>
                      )}
                    </td>
                    <td className="p-4 text-slate-600 dark:text-slate-400 text-sm font-mono">
                      {log.ipAddress || 'Unknown'}
                    </td>
                    <td className="p-4">
                      <div className="flex items-center gap-2 text-slate-600 dark:text-slate-400 text-sm">
                        <Clock className="w-4 h-4" />
                        {new Date(log.createdAt).toLocaleString('en-US', {
                          month: 'short',
                          day: '2-digit',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                          second: '2-digit',
                          hour12: false
                        })}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {!loading && (
          <div className="p-4 border-t border-slate-200 dark:border-slate-700 flex items-center justify-between">
            <span className="text-sm text-slate-500 dark:text-slate-400">
              Showing page <span className="font-medium text-slate-900 dark:text-white">{pagination.page}</span> of <span className="font-medium text-slate-900 dark:text-white">{pagination.totalPages || 1}</span>
            </span>
            <div className="flex gap-2">
              <button
                onClick={() => setPagination(p => ({ ...p, page: Math.max(1, p.page - 1) }))}
                disabled={pagination.page === 1}
                className="px-4 py-2 text-sm font-medium rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-sm"
              >
                Previous
              </button>
              <button
                onClick={() => setPagination(p => ({ ...p, page: Math.min(p.totalPages, p.page + 1) }))}
                disabled={pagination.page >= pagination.totalPages}
                className="px-4 py-2 text-sm font-medium rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-sm"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default BuyerLogs;

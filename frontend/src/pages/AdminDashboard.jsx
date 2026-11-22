import React, { useState, useEffect } from 'react';
import { Users, Package, BarChart3, Shield, Trash2, Ban, CheckCircle, Search, ChevronLeft, ChevronRight } from 'lucide-react';
import { getAdminStats, getAdminUsers, updateAdminUser, deleteAdminUser, getAdminItems, deleteAdminItem } from '../services/api';
import { format } from 'date-fns';
import { toast } from 'sonner';

const AdminDashboard = () => {
  const [activeTab, setActiveTab] = useState('users');
  const [stats, setStats] = useState(null);
  
  // Data
  const [users, setUsers] = useState([]);
  const [items, setItems] = useState([]);
  
  // Loading
  const [loading, setLoading] = useState(true);
  const [dataLoading, setDataLoading] = useState(false);
  
  // Pagination & Search
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState('');

  useEffect(() => {
    fetchStats();
  }, []);

  useEffect(() => {
    fetchData();
  }, [activeTab, page]); // Re-fetch when tab or page changes

  const fetchStats = async () => {
    try {
      const res = await getAdminStats();
      setStats(res);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const fetchData = async (searchQuery = search) => {
    setDataLoading(true);
    try {
      if (activeTab === 'users') {
        const res = await getAdminUsers({ skip: (page - 1) * 10, limit: 10, search: searchQuery });
        setUsers(res || []);
      } else {
        const res = await getAdminItems({ skip: (page - 1) * 10, limit: 10, search: searchQuery });
        setItems(res || []);
      }
    } catch (error) {
      toast.error('Failed to load data');
    } finally {
      setDataLoading(false);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    setPage(1);
    fetchData();
  };

  const handleUserToggleBan = async (user) => {
    const isBanned = user.status === 'banned';
    if (window.confirm(`Are you sure you want to ${isBanned ? 'unban' : 'ban'} ${user.name}?`)) {
      try {
        await updateAdminUser(user._id || user.id, { status: isBanned ? 'active' : 'banned' });
        toast.success(`User ${isBanned ? 'unbanned' : 'banned'}`);
        fetchData();
      } catch (error) {
        toast.error('Failed to update user');
      }
    }
  };

  const handleUserDelete = async (id) => {
    if (window.confirm('WARNING: This will permanently delete the user and all their items. Are you sure?')) {
      try {
        await deleteAdminUser(id);
        toast.success('User deleted');
        fetchData();
        fetchStats();
      } catch (error) {
        toast.error('Failed to delete user');
      }
    }
  };

  const handleItemDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this item?')) {
      try {
        await deleteAdminItem(id);
        toast.success('Item deleted');
        fetchData();
        fetchStats();
      } catch (error) {
        toast.error('Failed to delete item');
      }
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="flex items-center gap-3 mb-8">
        <Shield size={32} className="text-indigo-600" />
        <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
      </div>

      {/* Stats Cards */}
      {loading ? (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {[1,2,3,4].map(i => <div key={i} className="bg-white h-24 rounded-xl animate-pulse"></div>)}
        </div>
      ) : stats ? (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10">
          <div className="bg-indigo-50 border border-indigo-100 rounded-xl p-5 flex items-center justify-between">
            <div>
              <p className="text-indigo-600 font-medium text-sm">Total Users</p>
              <h3 className="text-2xl font-bold text-indigo-900">{stats.totalUsers || 0}</h3>
            </div>
            <Users size={32} className="text-indigo-200" />
          </div>
          <div className="bg-purple-50 border border-purple-100 rounded-xl p-5 flex items-center justify-between">
            <div>
              <p className="text-purple-600 font-medium text-sm">Total Items</p>
              <h3 className="text-2xl font-bold text-purple-900">{stats.totalItems || 0}</h3>
            </div>
            <Package size={32} className="text-purple-200" />
          </div>
          <div className="bg-green-50 border border-green-100 rounded-xl p-5 flex items-center justify-between">
            <div>
              <p className="text-green-600 font-medium text-sm">Recovered Items</p>
              <h3 className="text-2xl font-bold text-green-900">{stats.recoveredItems || 0}</h3>
            </div>
            <CheckCircle size={32} className="text-green-200" />
          </div>
          <div className="bg-blue-50 border border-blue-100 rounded-xl p-5 flex items-center justify-between">
            <div>
              <p className="text-blue-600 font-medium text-sm">Active Matches</p>
              <h3 className="text-2xl font-bold text-blue-900">{stats.activeMatches || 0}</h3>
            </div>
            <BarChart3 size={32} className="text-blue-200" />
          </div>
        </div>
      ) : null}

      {/* Content Area */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        {/* Tabs & Search */}
        <div className="border-b border-gray-200 p-4 sm:px-6 flex flex-col sm:flex-row justify-between gap-4 items-center bg-gray-50">
          <div className="flex bg-white rounded-lg p-1 border border-gray-200 shadow-sm w-full sm:w-auto">
            <button
              onClick={() => { setActiveTab('users'); setPage(1); setSearch(''); }}
              className={`flex-1 sm:flex-none px-6 py-2 rounded-md font-medium text-sm transition-colors flex items-center justify-center gap-2 ${activeTab === 'users' ? 'bg-indigo-50 text-indigo-700' : 'text-gray-600 hover:bg-gray-50'}`}
            >
              <Users size={16} /> Users
            </button>
            <button
              onClick={() => { setActiveTab('items'); setPage(1); setSearch(''); }}
              className={`flex-1 sm:flex-none px-6 py-2 rounded-md font-medium text-sm transition-colors flex items-center justify-center gap-2 ${activeTab === 'items' ? 'bg-indigo-50 text-indigo-700' : 'text-gray-600 hover:bg-gray-50'}`}
            >
              <Package size={16} /> Items
            </button>
          </div>

          <form onSubmit={handleSearch} className="relative w-full sm:w-64">
            <input
              type="text"
              placeholder={`Search ${activeTab}...`}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-indigo-500 focus:border-indigo-500"
            />
            <Search size={16} className="absolute left-3 top-2.5 text-gray-400" />
          </form>
        </div>

        {/* Table Area */}
        <div className="overflow-x-auto">
          {dataLoading ? (
            <div className="p-12 text-center text-gray-500">Loading data...</div>
          ) : activeTab === 'users' ? (
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-white border-b border-gray-200 text-xs uppercase tracking-wider text-gray-500">
                  <th className="p-4 sm:px-6 font-semibold">User</th>
                  <th className="p-4 sm:px-6 font-semibold">Role</th>
                  <th className="p-4 sm:px-6 font-semibold">Joined</th>
                  <th className="p-4 sm:px-6 font-semibold">Status</th>
                  <th className="p-4 sm:px-6 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {users.map(user => (
                  <tr key={user._id || user.id} className="hover:bg-gray-50 transition-colors">
                    <td className="p-4 sm:px-6">
                      <div className="font-medium text-gray-900">{user.name}</div>
                      <div className="text-sm text-gray-500">{user.email}</div>
                    </td>
                    <td className="p-4 sm:px-6 text-sm">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${user.role === 'admin' ? 'bg-purple-100 text-purple-700' : 'bg-gray-100 text-gray-700'}`}>
                        {user.role}
                      </span>
                    </td>
                    <td className="p-4 sm:px-6 text-sm text-gray-500">
                      {format(new Date(user.createdAt || Date.now()), 'MMM d, yyyy')}
                    </td>
                    <td className="p-4 sm:px-6">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${user.status === 'banned' ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>
                        {user.status || 'active'}
                      </span>
                    </td>
                    <td className="p-4 sm:px-6 text-right space-x-2">
                      <button 
                        onClick={() => handleUserToggleBan(user)}
                        className={`p-2 rounded-lg transition-colors ${user.status === 'banned' ? 'text-green-600 hover:bg-green-50' : 'text-orange-600 hover:bg-orange-50'}`}
                        title={user.status === 'banned' ? 'Unban User' : 'Ban User'}
                      >
                        <Ban size={18} />
                      </button>
                      <button 
                        onClick={() => handleUserDelete(user._id || user.id)}
                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        title="Delete User"
                      >
                        <Trash2 size={18} />
                      </button>
                    </td>
                  </tr>
                ))}
                {users.length === 0 && (
                  <tr>
                    <td colSpan="5" className="p-8 text-center text-gray-500">No users found</td>
                  </tr>
                )}
              </tbody>
            </table>
          ) : (
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-white border-b border-gray-200 text-xs uppercase tracking-wider text-gray-500">
                  <th className="p-4 sm:px-6 font-semibold">Item</th>
                  <th className="p-4 sm:px-6 font-semibold">Category</th>
                  <th className="p-4 sm:px-6 font-semibold">Date</th>
                  <th className="p-4 sm:px-6 font-semibold">Status</th>
                  <th className="p-4 sm:px-6 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {items.map(item => (
                  <tr key={item._id || item.id} className="hover:bg-gray-50 transition-colors">
                    <td className="p-4 sm:px-6">
                      <div className="flex items-center gap-3">
                        <div className={`w-2 h-10 rounded-full ${item.type === 'lost' ? 'bg-red-400' : 'bg-green-400'}`}></div>
                        <div>
                          <div className="font-medium text-gray-900 line-clamp-1">{item.title}</div>
                          <div className="text-xs text-gray-500 uppercase">{item.type}</div>
                        </div>
                      </div>
                    </td>
                    <td className="p-4 sm:px-6 text-sm text-gray-700">{item.category}</td>
                    <td className="p-4 sm:px-6 text-sm text-gray-500">
                      {format(new Date(item.createdAt || Date.now()), 'MMM d, yyyy')}
                    </td>
                    <td className="p-4 sm:px-6">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        item.status === 'recovered' ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'
                      }`}>
                        {item.status}
                      </span>
                    </td>
                    <td className="p-4 sm:px-6 text-right">
                      <button 
                        onClick={() => handleItemDelete(item._id || item.id)}
                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        title="Delete Item"
                      >
                        <Trash2 size={18} />
                      </button>
                    </td>
                  </tr>
                ))}
                {items.length === 0 && (
                  <tr>
                    <td colSpan="5" className="p-8 text-center text-gray-500">No items found</td>
                  </tr>
                )}
              </tbody>
            </table>
          )}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="bg-white p-4 border-t border-gray-200 flex items-center justify-between">
            <span className="text-sm text-gray-500">Page {page} of {totalPages}</span>
            <div className="flex gap-2">
              <button 
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                className="p-2 rounded border border-gray-300 disabled:opacity-50 hover:bg-gray-50"
              >
                <ChevronLeft size={16} />
              </button>
              <button 
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="p-2 rounded border border-gray-300 disabled:opacity-50 hover:bg-gray-50"
              >
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminDashboard;

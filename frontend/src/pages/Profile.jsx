import React, { useState, useEffect } from 'react';
import { User, Mail, Calendar, Package, Search, CheckCircle } from 'lucide-react';
import ItemCard from '../components/ItemCard';
import { getMyItems } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { format } from 'date-fns';

const Profile = () => {
  const { user } = useAuth();
  const [items, setItems] = useState({ lost: [], found: [], recovered: [] });
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('lost');

  useEffect(() => {
    const fetchItems = async () => {
      setLoading(true);
      try {
        const response = await getMyItems();
        const allItems = response || [];
        
        setItems({
          lost: allItems.filter(item => item.type === 'lost' && item.status !== 'recovered'),
          found: allItems.filter(item => item.type === 'found' && item.status !== 'recovered'),
          recovered: allItems.filter(item => item.status === 'recovered')
        });
      } catch (error) {
        console.error("Failed to load user items", error);
      } finally {
        setLoading(false);
      }
    };
    
    if (user) {
      fetchItems();
    }
  }, [user]);

  if (!user) return null;

  return (
    <div className="max-w-6xl mx-auto px-4 py-10">
      {/* User Info Card */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 mb-10 flex flex-col md:flex-row items-center gap-6">
        <div className="w-24 h-24 bg-indigo-100 rounded-full flex items-center justify-center text-indigo-600 text-3xl font-bold">
          {user.name?.charAt(0).toUpperCase()}
        </div>
        <div className="text-center md:text-left">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">{user.name}</h1>
          <div className="flex flex-col md:flex-row gap-4 text-gray-600">
            <div className="flex items-center justify-center md:justify-start gap-2">
              <Mail size={18} />
              <span>{user.email}</span>
            </div>
            <div className="flex items-center justify-center md:justify-start gap-2">
              <Calendar size={18} />
              <span>Member since {user.createdAt ? format(new Date(user.createdAt), 'MMMM yyyy') : 'Recently'}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="mb-8">
        <div className="flex border-b border-gray-200 overflow-x-auto hide-scrollbar">
          <button
            onClick={() => setActiveTab('lost')}
            className={`px-6 py-3 font-medium text-sm whitespace-nowrap border-b-2 transition-colors flex items-center gap-2 ${
              activeTab === 'lost' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            <Search size={18} />
            My Lost Items ({items.lost.length})
          </button>
          <button
            onClick={() => setActiveTab('found')}
            className={`px-6 py-3 font-medium text-sm whitespace-nowrap border-b-2 transition-colors flex items-center gap-2 ${
              activeTab === 'found' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            <Package size={18} />
            My Found Items ({items.found.length})
          </button>
          <button
            onClick={() => setActiveTab('recovered')}
            className={`px-6 py-3 font-medium text-sm whitespace-nowrap border-b-2 transition-colors flex items-center gap-2 ${
              activeTab === 'recovered' ? 'border-green-600 text-green-600' : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            <CheckCircle size={18} />
            Recovered ({items.recovered.length})
          </button>
        </div>
      </div>

      {/* Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[1,2,3].map(i => <div key={i} className="bg-white rounded-xl h-80 animate-pulse"></div>)}
        </div>
      ) : items[activeTab].length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {items[activeTab].map(item => (
            <ItemCard key={item.id || item._id} item={item} />
          ))}
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-100 p-16 text-center text-gray-500">
          <Package size={48} className="mx-auto mb-4 text-gray-300" />
          <h3 className="text-xl font-medium text-gray-800 mb-2">No {activeTab} items</h3>
          <p>You haven't reported any {activeTab} items yet.</p>
        </div>
      )}
    </div>
  );
};

export default Profile;

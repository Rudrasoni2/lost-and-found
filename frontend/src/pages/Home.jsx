import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Search, Upload, Cpu, CheckCircle, ArrowRight, Package } from 'lucide-react';
import ItemCard from '../components/ItemCard';
import { getItems } from '../services/api';

const Home = () => {
  const navigate = useNavigate();
  const [recentItems, setRecentItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('lost');

  useEffect(() => {
    const fetchRecent = async () => {
      setLoading(true);
      try {
        const response = await getItems({ limit: 8, type: activeTab });
        setRecentItems(response || []);
      } catch (error) {
        console.error('Failed to fetch items:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchRecent();
  }, [activeTab]);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <section className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white py-20 px-4">
        <div className="max-w-6xl mx-auto text-center">
          <h1 className="text-5xl font-extrabold mb-6">Find What You've Lost</h1>
          <p className="text-xl mb-10 max-w-2xl mx-auto opacity-90">
            Our AI-powered matching system helps connect lost items with their rightful owners faster than ever before.
          </p>
          
          <div className="flex flex-col sm:flex-row justify-center gap-4 mb-12">
            <Link 
              to="/report?type=lost" 
              className="bg-white text-indigo-600 px-8 py-3 rounded-full font-semibold hover:bg-gray-100 transition-colors flex items-center justify-center gap-2"
            >
              <Search size={20} /> Report Lost Item
            </Link>
            <Link 
              to="/report?type=found" 
              className="bg-indigo-500 bg-opacity-30 border border-white px-8 py-3 rounded-full font-semibold hover:bg-opacity-40 transition-colors flex items-center justify-center gap-2 text-white"
            >
              <Upload size={20} /> Report Found Item
            </Link>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="max-w-6xl mx-auto px-4 -mt-10 relative z-10">
        <div className="bg-white rounded-xl shadow-lg grid grid-cols-1 md:grid-cols-3 gap-6 p-8">
          <div className="text-center">
            <p className="text-4xl font-bold text-indigo-600 mb-2">1,200+</p>
            <p className="text-gray-600 font-medium">Total Items</p>
          </div>
          <div className="text-center">
            <p className="text-4xl font-bold text-green-500 mb-2">450</p>
            <p className="text-gray-600 font-medium">Items Recovered</p>
          </div>
          <div className="text-center">
            <p className="text-4xl font-bold text-purple-600 mb-2">750</p>
            <p className="text-gray-600 font-medium">Active Searches</p>
          </div>
        </div>
      </section>

      {/* How it Works */}
      <section className="py-20 bg-white">
        <div className="max-w-6xl mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-16 text-gray-800">How It Works</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
            <div className="flex flex-col items-center text-center">
              <div className="w-16 h-16 bg-indigo-100 rounded-full flex items-center justify-center text-indigo-600 mb-6">
                <Upload size={32} />
              </div>
              <h3 className="text-xl font-bold mb-3">1. Report your item</h3>
              <p className="text-gray-600">Upload details and photos of the item you lost or found. Provide as much detail as possible.</p>
            </div>
            <div className="flex flex-col items-center text-center">
              <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center text-purple-600 mb-6">
                <Cpu size={32} />
              </div>
              <h3 className="text-xl font-bold mb-3">2. AI finds matches</h3>
              <p className="text-gray-600">Our smart algorithm analyzes descriptions, images, and locations to suggest potential matches.</p>
            </div>
            <div className="flex flex-col items-center text-center">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center text-green-600 mb-6">
                <CheckCircle size={32} />
              </div>
              <h3 className="text-xl font-bold mb-3">3. Get it back</h3>
              <p className="text-gray-600">Connect safely through our platform to verify ownership and arrange the return of the item.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Recent Items */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-6xl mx-auto px-4">
          <div className="flex flex-col md:flex-row justify-between items-center mb-10">
            <h2 className="text-3xl font-bold text-gray-800 mb-4 md:mb-0">Recent Items</h2>
            <div className="flex bg-white rounded-lg shadow-sm p-1">
              <button 
                onClick={() => setActiveTab('lost')}
                className={`px-6 py-2 rounded-md font-medium transition-colors ${activeTab === 'lost' ? 'bg-indigo-50 text-indigo-600' : 'text-gray-600 hover:bg-gray-50'}`}
              >
                Lost
              </button>
              <button 
                onClick={() => setActiveTab('found')}
                className={`px-6 py-2 rounded-md font-medium transition-colors ${activeTab === 'found' ? 'bg-indigo-50 text-indigo-600' : 'text-gray-600 hover:bg-gray-50'}`}
              >
                Found
              </button>
            </div>
          </div>

          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {[1,2,3,4,5,6,7,8].map(i => (
                <div key={i} className="bg-white p-4 rounded-xl shadow-sm animate-pulse h-72"></div>
              ))}
            </div>
          ) : recentItems.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {recentItems.map(item => (
                <ItemCard key={item.id} item={item} />
              ))}
            </div>
          ) : (
            <div className="text-center py-16 bg-white rounded-xl shadow-sm">
              <Package size={48} className="mx-auto text-gray-300 mb-4" />
              <h3 className="text-xl font-medium text-gray-700">No {activeTab} items recently</h3>
            </div>
          )}

          <div className="mt-12 text-center">
            <Link 
              to={`/search?type=${activeTab}`}
              className="inline-flex items-center gap-2 text-indigo-600 font-semibold hover:text-indigo-800 transition-colors"
            >
              Browse All Items <ArrowRight size={20} />
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Home;

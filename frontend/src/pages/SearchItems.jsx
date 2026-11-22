import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Search, Filter, SlidersHorizontal, Package } from 'lucide-react';
import SearchFilters from '../components/SearchFilters';
import ItemCard from '../components/ItemCard';
import { getItems } from '../services/api';

const SearchItems = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showFiltersMobile, setShowFiltersMobile] = useState(false);
  
  const [filters, setFilters] = useState({
    query: searchParams.get('q') || '',
    type: searchParams.get('type') || 'all',
    category: searchParams.get('category') || '',
    dateFrom: searchParams.get('dateFrom') || '',
    dateTo: searchParams.get('dateTo') || ''
  });

  const fetchItems = async (currentFilters) => {
    setLoading(true);
    try {
      // Clean up empty filters
      const queryParams = {};
      Object.keys(currentFilters).forEach(key => {
        if (currentFilters[key] && currentFilters[key] !== 'all') {
          queryParams[key] = currentFilters[key];
        }
      });
      
      const response = await getItems(queryParams);
      setItems(response || []);
    } catch (error) {
      console.error('Error fetching items:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchItems(filters);
  }, []);

  const handleSearch = () => {
    // Update URL
    const newParams = new URLSearchParams();
    if (filters.query) newParams.set('q', filters.query);
    if (filters.type !== 'all') newParams.set('type', filters.type);
    if (filters.category) newParams.set('category', filters.category);
    if (filters.dateFrom) newParams.set('dateFrom', filters.dateFrom);
    if (filters.dateTo) newParams.set('dateTo', filters.dateTo);
    
    setSearchParams(newParams);
    fetchItems(filters);
    setShowFiltersMobile(false);
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Search Bar (Top) */}
      <div className="flex gap-4 mb-8">
        <div className="flex-1 relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search size={20} className="text-gray-400" />
          </div>
          <input
            type="text"
            className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500 shadow-sm"
            placeholder="Search for an item by keyword, color, or location..."
            value={filters.query}
            onChange={(e) => setFilters({...filters, query: e.target.value})}
            onKeyDown={handleKeyPress}
          />
        </div>
        <button
          onClick={handleSearch}
          className="bg-indigo-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-indigo-700 transition-colors shadow-sm hidden sm:block"
        >
          Search
        </button>
        <button
          onClick={() => setShowFiltersMobile(!showFiltersMobile)}
          className="bg-white text-gray-700 border border-gray-300 px-4 py-3 rounded-lg flex items-center gap-2 hover:bg-gray-50 md:hidden"
        >
          <SlidersHorizontal size={20} />
        </button>
      </div>

      <div className="flex flex-col md:flex-row gap-8">
        {/* Sidebar Filters */}
        <div className={`w-full md:w-64 flex-shrink-0 ${showFiltersMobile ? 'block' : 'hidden md:block'}`}>
          <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm sticky top-24">
            <div className="flex items-center gap-2 mb-4 text-lg font-semibold text-gray-800">
              <Filter size={18} /> Filters
            </div>
            <SearchFilters filters={filters} setFilters={setFilters} onSearch={handleSearch} />
          </div>
        </div>

        {/* Results Area */}
        <div className="flex-1">
          <div className="mb-6 flex justify-between items-center">
            <h2 className="text-xl font-semibold text-gray-800">
              {loading ? 'Searching...' : `Showing ${items.length} items`}
            </h2>
            
            {/* Type Tabs */}
            <div className="hidden sm:flex bg-gray-100 p-1 rounded-lg">
              {['all', 'lost', 'found'].map(t => (
                <button
                  key={t}
                  className={`px-4 py-1.5 rounded-md text-sm font-medium capitalize ${filters.type === t ? 'bg-white shadow-sm text-indigo-600' : 'text-gray-500 hover:text-gray-700'}`}
                  onClick={() => {
                    const newFilters = {...filters, type: t};
                    setFilters(newFilters);
                    // Also trigger search implicitly
                    const newParams = new URLSearchParams(searchParams);
                    if (t === 'all') newParams.delete('type');
                    else newParams.set('type', t);
                    setSearchParams(newParams);
                    fetchItems(newFilters);
                  }}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>

          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3, 4, 5, 6].map(i => (
                <div key={i} className="bg-white p-4 rounded-xl shadow-sm animate-pulse h-80">
                  <div className="w-full h-40 bg-gray-200 rounded-lg mb-4"></div>
                  <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                  <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                </div>
              ))}
            </div>
          ) : items.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {items.map(item => (
                <ItemCard key={item.id || item._id} item={item} />
              ))}
            </div>
          ) : (
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-12 text-center">
              <Package size={64} className="mx-auto text-gray-300 mb-4" />
              <h3 className="text-xl font-medium text-gray-800 mb-2">No items found</h3>
              <p className="text-gray-500 max-w-md mx-auto">
                We couldn't find any items matching your current filters. Try adjusting your search or check back later.
              </p>
              <button 
                onClick={() => {
                  const resetFilters = { query: '', type: 'all', category: '', dateFrom: '', dateTo: '' };
                  setFilters(resetFilters);
                  setSearchParams(new URLSearchParams());
                  fetchItems(resetFilters);
                }}
                className="mt-6 text-indigo-600 font-medium hover:text-indigo-800"
              >
                Clear all filters
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SearchItems;

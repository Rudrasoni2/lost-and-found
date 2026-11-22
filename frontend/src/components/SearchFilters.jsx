import { Filter, X } from 'lucide-react';

const CATEGORIES = ['Electronics', 'Keys', 'Wallet/Purse', 'Bag/Backpack', 'Clothing', 'Documents/ID', 'Jewelry', 'Pet', 'Phone', 'Books', 'Accessories', 'Other'];

export default function SearchFilters({ filters, setFilters, onSearch }) {
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({ ...prev, [name]: value }));
  };

  const handleReset = () => {
    setFilters({
      type: 'all',
      category: '',
      color: '',
      location: '',
      dateFrom: '',
      dateTo: '',
      status: 'active',
      search: ''
    });
  };

  return (
    <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-200 space-y-6">
      <div className="flex items-center justify-between border-b pb-3">
        <h3 className="font-semibold text-lg flex items-center gap-2"><Filter className="w-5 h-5 text-gray-500" /> Filters</h3>
        <button onClick={handleReset} className="text-sm text-gray-500 hover:text-red-500 flex items-center gap-1">
          <X className="w-4 h-4" /> Reset
        </button>
      </div>

      <div className="space-y-4 text-sm">
        <div>
          <label className="block text-gray-700 font-medium mb-1">Search</label>
          <input type="text" name="search" value={filters.search} onChange={handleChange} placeholder="Keywords..." className="w-full border border-gray-300 rounded-md p-2 focus:ring-primary-500 focus:border-primary-500" />
        </div>

        <div>
          <label className="block text-gray-700 font-medium mb-1">Type</label>
          <div className="flex rounded-md shadow-sm">
            {['all', 'lost', 'found'].map(type => (
              <button
                key={type}
                onClick={() => setFilters(prev => ({ ...prev, type }))}
                className={`flex-1 capitalize py-1.5 border border-gray-300 text-center first:rounded-l-md last:rounded-r-md 
                  ${filters.type === type ? 'bg-primary-50 text-primary-700 border-primary-500 z-10' : 'bg-white text-gray-600 hover:bg-gray-50'}`}
              >
                {type}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-gray-700 font-medium mb-1">Status</label>
          <select name="status" value={filters.status} onChange={handleChange} className="w-full border border-gray-300 rounded-md p-2 focus:ring-primary-500 focus:border-primary-500 bg-white">
            <option value="all">All</option>
            <option value="active">Active</option>
            <option value="recovered">Recovered</option>
          </select>
        </div>

        <div>
          <label className="block text-gray-700 font-medium mb-1">Category</label>
          <select name="category" value={filters.category} onChange={handleChange} className="w-full border border-gray-300 rounded-md p-2 focus:ring-primary-500 focus:border-primary-500 bg-white">
            <option value="">All Categories</option>
            {CATEGORIES.map(cat => <option key={cat} value={cat}>{cat}</option>)}
          </select>
        </div>

        <div>
          <label className="block text-gray-700 font-medium mb-1">Location</label>
          <input type="text" name="location" value={filters.location} onChange={handleChange} placeholder="City, Area, Building..." className="w-full border border-gray-300 rounded-md p-2 focus:ring-primary-500 focus:border-primary-500" />
        </div>

        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="block text-gray-700 font-medium mb-1">Date From</label>
            <input type="date" name="dateFrom" value={filters.dateFrom} onChange={handleChange} className="w-full border border-gray-300 rounded-md p-2 focus:ring-primary-500 focus:border-primary-500" />
          </div>
          <div>
            <label className="block text-gray-700 font-medium mb-1">Date To</label>
            <input type="date" name="dateTo" value={filters.dateTo} onChange={handleChange} className="w-full border border-gray-300 rounded-md p-2 focus:ring-primary-500 focus:border-primary-500" />
          </div>
        </div>

        <div>
          <label className="block text-gray-700 font-medium mb-1">Color</label>
          <input type="text" name="color" value={filters.color} onChange={handleChange} placeholder="e.g. Red, Black" className="w-full border border-gray-300 rounded-md p-2 focus:ring-primary-500 focus:border-primary-500" />
        </div>
      </div>

      <button onClick={onSearch} className="w-full bg-primary-600 text-white font-medium py-2 rounded-md hover:bg-primary-700 transition shadow-sm">
        Apply Filters
      </button>
    </div>
  );
}

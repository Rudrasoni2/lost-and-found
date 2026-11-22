import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { Upload, MapPin, Calendar, Tag, Palette, FileText, Send } from 'lucide-react';
import ImageUpload from '../components/ImageUpload';
import { createItem } from '../services/api';
import { toast } from 'sonner';
import { useAuth } from '../context/AuthContext';
import { Input } from '../components/ui/Input';
import { Button } from '../components/ui/Button';

const CATEGORIES = ["Electronics", "Keys", "Wallet/Purse", "Bag/Backpack", "Clothing", "Documents/ID", "Jewelry", "Pet", "Phone", "Books", "Accessories", "Other"];

const ReportItem = () => {
  const [searchParams] = useSearchParams();
  const typeParam = searchParams.get('type') === 'found' ? 'found' : 'lost';
  const [type, setType] = useState(typeParam);
  const navigate = useNavigate();
  const { user } = useAuth();

  const DRAFT_KEY = 'report_item_draft';

  const [formData, setFormData] = useState(() => {
    try {
      const saved = localStorage.getItem(DRAFT_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        return {
          title: parsed.title || '',
          category: parsed.category || '',
          color: parsed.color || '',
          description: parsed.description || '',
          location: parsed.location || '',
          date: parsed.date || new Date().toISOString().split('T')[0]
        };
      }
    } catch (e) {
      console.error('Failed to read draft', e);
    }
    return {
      title: '',
      category: '',
      color: '',
      description: '',
      location: '',
      date: new Date().toISOString().split('T')[0]
    };
  });

  const [images, setImages] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    setType(typeParam);
  }, [typeParam]);

  // Persist form changes so user input is never lost on redirect or reload
  useEffect(() => {
    try {
      localStorage.setItem(DRAFT_KEY, JSON.stringify(formData));
    } catch (e) {
      console.error('Failed to save draft', e);
    }
  }, [formData]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.title || !formData.category) {
      toast.error('Title and Category are required');
      return;
    }
    if (!user) {
      toast.info('Please log in or create an account to submit your report. Your entered details have been saved!');
      navigate('/login', {
        state: {
          from: {
            pathname: '/report',
            search: `?type=${type}`
          }
        }
      });
      return;
    }
    setIsSubmitting(true);
    try {
      const data = new FormData();
      data.append('type', type);
      data.append('name', formData.title);
      data.append('category', formData.category);
      if (formData.color) data.append('color', formData.color);
      if (formData.description) data.append('description', formData.description);
      if (formData.location) data.append('location', formData.location);
      if (formData.date) data.append('date_lost_found', formData.date);
      images.forEach(image => data.append('images', image));
      const response = await createItem(data);
      localStorage.removeItem(DRAFT_KEY);
      toast.success(`${type === 'lost' ? 'Lost' : 'Found'} item reported successfully!`);
      navigate(`/items/${response.id}`);
    } catch (error) {
      const errMsg = typeof error === 'string'
        ? error
        : (error.detail ? (typeof error.detail === 'string' ? error.detail : JSON.stringify(error.detail)) : (error.message || 'Failed to report item'));
      toast.error(errMsg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto py-10 px-4">
      <div className="mb-8 text-center">
        <h1 className="text-3xl font-bold text-gray-900 mb-4">Report an Item</h1>
        <div className="inline-flex bg-gray-100 p-1 rounded-lg">
          <button
            type="button"
            className={`px-8 py-2 rounded-md font-medium transition-colors ${type === 'lost' ? 'bg-white shadow-sm text-indigo-600' : 'text-gray-500 hover:text-gray-700'}`}
            onClick={() => setType('lost')}
          >
            I Lost Something
          </button>
          <button
            type="button"
            className={`px-8 py-2 rounded-md font-medium transition-colors ${type === 'found' ? 'bg-white shadow-sm text-indigo-600' : 'text-gray-500 hover:text-gray-700'}`}
            onClick={() => setType('found')}
          >
            I Found Something
          </button>
        </div>
      </div>

      {!user && (
        <div className="mb-6 bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-center justify-between text-sm text-amber-800">
          <p>
            <strong>Note:</strong> You can fill out your report now. When you click <em>Submit Report</em>, you will be prompted to sign in or register and your draft will be preserved!
          </p>
          <Link
            to={`/login?redirect=${encodeURIComponent(`/report?type=${type}`)}`}
            className="ml-4 font-semibold text-indigo-600 hover:text-indigo-800 whitespace-nowrap"
          >
            Sign in now →
          </Link>
        </div>
      )}

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 md:p-8">
        <form onSubmit={handleSubmit} className="space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Left Column */}
            <div className="space-y-6">
              <Input
                label="Item Title *"
                name="title"
                value={formData.title}
                onChange={handleChange}
                placeholder="e.g. Black iPhone 13, Leather Wallet"
                required
                className="pl-10"
                // prepend icon via custom styling if needed
              />
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Category *</label>
                <select
                  name="category"
                  value={formData.category}
                  onChange={handleChange}
                  className="block w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500"
                  required
                >
                  <option value="">Select a category</option>
                  {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <Input
                label="Primary Color"
                name="color"
                value={formData.color}
                onChange={handleChange}
                placeholder="e.g. Black, Red, Silver"
                className="pl-10"
              />
              <Input
                label={`Date ${type === 'lost' ? 'Lost' : 'Found'}`}
                name="date"
                type="date"
                value={formData.date}
                onChange={handleChange}
                max={new Date().toISOString().split('T')[0]}
                className="pl-10"
              />
              <Input
                label={`Location ${type === 'lost' ? 'Lost' : 'Found'}`}
                name="location"
                value={formData.location}
                onChange={handleChange}
                placeholder="e.g. Central Park, near the fountain"
                className="pl-10"
              />
            </div>

            {/* Right Column */}
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <div className="relative">
                  <div className="absolute top-3 left-3 pointer-events-none">
                    <FileText size={18} className="text-gray-400" />
                  </div>
                  <textarea
                    name="description"
                    value={formData.description}
                    onChange={handleChange}
                    rows={4}
                    className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500"
                    placeholder="Provide detailed description, brand, unique marks, contents, etc."
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Photos (Up to 5)</label>
                <ImageUpload images={images} setImages={setImages} maxFiles={5} />
              </div>
            </div>
          </div>

          <div className="pt-4 border-t border-gray-100 flex justify-end">
            <Button
              type="submit"
              disabled={isSubmitting}
              variant="primary"
              className="flex items-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  Submitting...
                </>
              ) : (
                <>
                  <Send size={20} />
                  Submit Report
                </>
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ReportItem;

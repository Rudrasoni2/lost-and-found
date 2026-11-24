import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { MapPin, Calendar, Tag, Palette, User, MessageSquare, CheckCircle, Trash2, RefreshCw, ArrowLeft, Share2, Brain, Cpu } from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner';
import MatchCard from '../components/MatchCard';
import { getItem, getMatches, findMatches, getExpertMatches, deleteItem, updateItem, getImageUrl } from '../services/api';
import { useAuth } from '../context/AuthContext';

const ItemDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [item, setItem] = useState(null);
  const [loading, setLoading] = useState(true);
  const [matches, setMatches] = useState([]);
  const [matchesLoading, setMatchesLoading] = useState(false);
  const [mainImage, setMainImage] = useState(null);
  const [matchMode, setMatchMode] = useState('hybrid'); // 'hybrid' | 'expert'

  useEffect(() => {
    const fetchItemAndMatches = async () => {
      setLoading(true);
      try {
        const itemData = await getItem(id);
        setItem(itemData);
        if (itemData.images?.length > 0) {
          setMainImage(itemData.images[0]);
        }

        if (user) {
          setMatchesLoading(true);
          const matchesData = await getMatches(id);
          setMatches(matchesData || []);
        }
      } catch (error) {
        toast.error('Failed to load item details');
      } finally {
        setLoading(false);
        setMatchesLoading(false);
      }
    };
    
    fetchItemAndMatches();
  }, [id, user]);

  const handleFindMatches = async () => {
    setMatchesLoading(true);
    setMatchMode('hybrid');
    try {
      const res = await findMatches(id);
      setMatches(res || []);
      toast.success('AI + Expert System search completed');
    } catch (error) {
      toast.error('Failed to find matches');
    } finally {
      setMatchesLoading(false);
    }
  };

  const handleExpertSearch = async () => {
    setMatchesLoading(true);
    setMatchMode('expert');
    try {
      const res = await getExpertMatches(id);
      setMatches(res || []);
      toast.success('Expert System search completed');
    } catch (error) {
      toast.error('Failed to run expert system search');
    } finally {
      setMatchesLoading(false);
    }
  };

  const handleMarkRecovered = async () => {
    try {
      await updateItem(id, { status: 'recovered' });
      setItem({ ...item, status: 'recovered' });
      toast.success('Item marked as recovered!');
    } catch (error) {
      toast.error('Failed to update status');
    }
  };

  const handleDelete = async () => {
    if (window.confirm('Are you sure you want to delete this item?')) {
      try {
        await deleteItem(id);
        toast.success('Item deleted successfully');
        navigate('/profile');
      } catch (error) {
        toast.error('Failed to delete item');
      }
    }
  };

  const handleShare = async () => {
    if (!item) return;
    const shareData = {
      title: `${item.name} | FindIt Lost & Found`,
      text: `Take a look at this ${item.type} item: "${item.name}" on FindIt!`,
      url: window.location.href,
    };

    if (navigator.share && navigator.canShare && navigator.canShare(shareData)) {
      try {
        await navigator.share(shareData);
        return;
      } catch (err) {
        if (err.name !== 'AbortError') {
          console.error('Error sharing:', err);
        } else {
          return;
        }
      }
    }

    try {
      await navigator.clipboard.writeText(window.location.href);
      toast.success('Link copied to clipboard!');
    } catch (err) {
      toast.error('Failed to copy link');
    }
  };

  const handleContactReporter = () => {
    if (!user) {
      toast.error('Please log in to contact the reporter');
      navigate('/login');
      return;
    }
    if (Number(item.user_id) === Number(user.id)) {
      toast.info('This is your own item report.');
      return;
    }
    navigate(`/messages/${item.user_id}?item_id=${id}`);
  };

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto px-4 py-12 flex justify-center">
        <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!item) {
    return (
      <div className="max-w-6xl mx-auto px-4 py-12 text-center">
        <h2 className="text-2xl font-bold text-gray-800">Item not found</h2>
        <button onClick={() => navigate(-1)} className="mt-4 text-indigo-600 hover:underline">Go back</button>
      </div>
    );
  }

  const isOwner = user && (item.user_id === user.id);
  const reporterName = item.user_name || 'Unknown User';

  const getImgUrl = (imgObj) => {
    if (!imgObj) return '';
    const path = typeof imgObj === 'string' ? imgObj : imgObj.file_path;
    return getImageUrl(path);
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <button 
        onClick={() => navigate(-1)} 
        className="flex items-center gap-2 text-gray-500 hover:text-gray-800 mb-6 transition-colors"
      >
        <ArrowLeft size={20} /> Back
      </button>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="flex flex-col md:flex-row">
          {/* Images Section */}
          <div className="w-full md:w-1/2 p-6 md:border-r border-gray-100">
            {item.images && item.images.length > 0 ? (
              <>
                <div className="aspect-square bg-gray-100 rounded-xl mb-4 overflow-hidden flex items-center justify-center">
                  <img 
                    src={getImgUrl(mainImage || item.images[0])} 
                    alt={item.name} 
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="flex gap-2 overflow-x-auto pb-2">
                  {item.images.map((img, idx) => (
                    <button
                      key={idx}
                      onClick={() => setMainImage(img)}
                      className={`w-20 h-20 flex-shrink-0 rounded-lg overflow-hidden border-2 ${mainImage === img ? 'border-indigo-600' : 'border-transparent'}`}
                    >
                      <img 
                        src={getImgUrl(img)} 
                        alt={`${item.name} ${idx}`} 
                        className="w-full h-full object-cover"
                      />
                    </button>
                  ))}
                </div>
              </>
            ) : (
              <div className="aspect-square bg-gray-100 rounded-xl flex flex-col items-center justify-center text-gray-400">
                <Tag size={64} className="mb-4 opacity-50" />
                <p>No images available</p>
              </div>
            )}
          </div>

          {/* Info Section */}
          <div className="w-full md:w-1/2 p-6 lg:p-10 flex flex-col">
            <div className="flex justify-between items-start mb-4">
              <div>
                <div className="flex gap-2 items-center mb-2">
                  <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide ${item.type === 'lost' ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>
                    {item.type}
                  </span>
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                    item.status === 'active' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-700'
                  }`}>
                    {item.status}
                  </span>
                </div>
                <h1 className="text-3xl font-bold text-gray-900">{item.name}</h1>
              </div>
              <button 
                onClick={handleShare}
                title="Share this item"
                className="text-gray-400 hover:text-indigo-600 transition-colors p-2 rounded-full hover:bg-gray-100"
              >
                <Share2 size={24} />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-4 mb-8 text-sm">
              <div className="flex items-center gap-2 text-gray-600">
                <Tag size={18} className="text-gray-400" />
                <span className="font-medium text-gray-900">{item.category}</span>
              </div>
              <div className="flex items-center gap-2 text-gray-600">
                <Calendar size={18} className="text-gray-400" />
                <span>{item.date_lost_found ? format(new Date(item.date_lost_found), 'MMM d, yyyy') : 'Unknown Date'}</span>
              </div>
              <div className="flex items-center gap-2 text-gray-600">
                <MapPin size={18} className="text-gray-400" />
                <span className="truncate">{item.location || 'Unknown location'}</span>
              </div>
              {item.color && (
                <div className="flex items-center gap-2 text-gray-600">
                  <Palette size={18} className="text-gray-400" />
                  <span>{item.color}</span>
                </div>
              )}
            </div>

            <div className="mb-8 flex-1">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Description</h3>
              <p className="text-gray-600 whitespace-pre-wrap leading-relaxed">{item.description}</p>
            </div>

            {/* Actions */}
            <div className="border-t border-gray-100 pt-6 mt-auto">
              {!isOwner ? (
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-indigo-100 rounded-full flex items-center justify-center text-indigo-600">
                      <User size={20} />
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 uppercase tracking-wide">Reported by</p>
                      <p className="font-medium text-gray-900">{reporterName}</p>
                    </div>
                  </div>
                  <button 
                    onClick={handleContactReporter}
                    disabled={item.status === 'recovered'}
                    className={`flex items-center gap-2 px-6 py-2.5 rounded-lg font-medium transition-colors ${item.status === 'recovered' ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'bg-indigo-600 text-white hover:bg-indigo-700'}`}
                  >
                    <MessageSquare size={18} />
                    Contact
                  </button>
                </div>
              ) : (
                <div className="flex flex-wrap gap-3">
                  {item.status !== 'recovered' && (
                    <button 
                      onClick={handleMarkRecovered}
                      className="flex-1 flex items-center justify-center gap-2 bg-green-600 text-white px-4 py-2.5 rounded-lg font-medium hover:bg-green-700 transition-colors"
                    >
                      <CheckCircle size={18} /> Mark Recovered
                    </button>
                  )}
                  <button 
                    onClick={handleDelete}
                    className="flex items-center justify-center gap-2 bg-red-50 text-red-600 px-4 py-2.5 rounded-lg font-medium hover:bg-red-100 transition-colors"
                  >
                    <Trash2 size={18} /> Delete
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Matches Section */}
      {user && (
        <div className="mt-12">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Potential Matches</h2>
              <p className="text-sm text-gray-500 mt-1">
                {matchMode === 'expert' 
                  ? 'Showing rule-based Expert System matches' 
                  : 'Showing AI image + Expert System hybrid matches'}
              </p>
            </div>
            {isOwner && item.status !== 'recovered' && (
              <div className="flex gap-2 flex-wrap">
                <button 
                  onClick={handleFindMatches}
                  disabled={matchesLoading}
                  className="flex items-center gap-2 text-indigo-600 bg-indigo-50 px-4 py-2 rounded-lg font-medium hover:bg-indigo-100 transition-colors text-sm"
                >
                  <Cpu size={16} className={matchesLoading && matchMode === 'hybrid' ? "animate-spin" : ""} />
                  AI + Expert Search
                </button>
                <button 
                  onClick={handleExpertSearch}
                  disabled={matchesLoading}
                  className="flex items-center gap-2 text-purple-600 bg-purple-50 px-4 py-2 rounded-lg font-medium hover:bg-purple-100 transition-colors text-sm"
                >
                  <Brain size={16} className={matchesLoading && matchMode === 'expert' ? "animate-spin" : ""} />
                  Expert System Only
                </button>
              </div>
            )}
          </div>
          
          {matchesLoading ? (
             <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {[1,2,3].map(i => <div key={i} className="h-32 bg-white rounded-xl animate-pulse shadow-sm border border-gray-100"></div>)}
             </div>
          ) : matches.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {matches.map((match, idx) => (
                <MatchCard key={idx} match={match} />
              ))}
            </div>
          ) : (
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8 text-center text-gray-500">
              <Brain className="mx-auto mb-3 text-gray-300" size={40} />
              <p>No matches found yet. Try running an AI + Expert search or Expert System only search.</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ItemDetail;

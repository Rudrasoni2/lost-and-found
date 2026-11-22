import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Bell, MessageSquare, AlertTriangle, CheckCircle, Info } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import * as api from '../services/api';

export default function NotificationBell() {
  const [unreadCount, setUnreadCount] = useState(0);
  const [notifications, setNotifications] = useState([]);
  const [isOpen, setIsOpen] = useState(false);
  const navigate = useNavigate();

  const fetchUnreadCount = async () => {
    try {
      const res = await api.getUnreadCount();
      setUnreadCount(res.count);
    } catch (e) { console.error('Failed to fetch unread count'); }
  };

  const fetchNotifications = async () => {
    try {
      const res = await api.getNotifications();
      setNotifications((res || []).slice(0, 5)); // Show recent 5
    } catch (e) { console.error('Failed to fetch notifications'); }
  };

  useEffect(() => {
    fetchUnreadCount();
    const interval = setInterval(fetchUnreadCount, 30000);
    return () => clearInterval(interval);
  }, []);

  const handleToggle = () => {
    setIsOpen(!isOpen);
    if (!isOpen) fetchNotifications();
  };

  const handleMarkAllRead = async (e) => {
    e.stopPropagation();
    try {
      await api.markAllNotificationsRead();
      setUnreadCount(0);
      setNotifications(notifications.map(n => ({ ...n, is_read: true })));
    } catch (e) { console.error('Failed to mark all read'); }
  };

  const handleNotificationClick = async (notification) => {
    setIsOpen(false);
    if (!notification.is_read) {
      try {
        await api.markNotificationRead(notification.id);
        setUnreadCount(prev => Math.max(0, prev - 1));
      } catch (e) { console.error(e); }
    }
    
    // Navigate based on type
    if (notification.type === 'message_received') {
      navigate('/messages');
    } else if (notification.item_id) {
      navigate(`/items/${notification.item_id}`);
    } else {
      navigate('/notifications');
    }
  };

  const getIcon = (type) => {
    switch (type) {
      case 'message_received': return <MessageSquare className="w-4 h-4 text-blue-500" />;
      case 'match_found': return <AlertTriangle className="w-4 h-4 text-amber-500" />;
      case 'item_recovered': return <CheckCircle className="w-4 h-4 text-green-500" />;
      default: return <Info className="w-4 h-4 text-gray-500" />;
    }
  };

  return (
    <div className="relative">
      <button onClick={handleToggle} className="relative p-2 text-gray-600 hover:text-primary-600 hover:bg-gray-100 rounded-full transition focus:outline-none">
        <Bell className="h-5 w-5" />
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1.5 flex h-2.5 w-2.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-red-500"></span>
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 bg-white border border-gray-200 rounded-lg shadow-xl overflow-hidden z-50">
          <div className="p-3 border-b border-gray-100 flex justify-between items-center bg-gray-50">
            <h3 className="font-semibold text-gray-700 text-sm">Notifications</h3>
            {unreadCount > 0 && (
              <button onClick={handleMarkAllRead} className="text-xs text-primary-600 hover:text-primary-700 font-medium">
                Mark all read
              </button>
            )}
          </div>
          
          <div className="max-h-80 overflow-y-auto">
            {notifications.length > 0 ? (
              <div className="divide-y divide-gray-100">
                {notifications.map(notif => (
                  <div 
                    key={notif.id} 
                    onClick={() => handleNotificationClick(notif)}
                    className={`p-3 cursor-pointer hover:bg-gray-50 transition flex gap-3 ${!notif.is_read ? 'bg-blue-50/30' : ''}`}
                  >
                    <div className="mt-1 flex-shrink-0">
                      {getIcon(notif.type)}
                    </div>
                    <div className="flex-grow">
                      <p className={`text-sm text-gray-800 ${!notif.is_read ? 'font-medium' : ''}`}>{notif.message}</p>
                      <p className="text-xs text-gray-400 mt-1">{formatDistanceToNow(new Date(notif.created_at), { addSuffix: true })}</p>
                    </div>
                    {!notif.is_read && (
                      <div className="w-2 h-2 bg-primary-500 rounded-full mt-1.5 flex-shrink-0"></div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-6 text-center text-gray-500 text-sm">
                No new notifications
              </div>
            )}
          </div>
          
          <div className="p-2 border-t border-gray-100 bg-gray-50 text-center">
            <Link to="/notifications" className="text-xs font-medium text-primary-600 hover:text-primary-700" onClick={() => setIsOpen(false)}>
              View all notifications
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}

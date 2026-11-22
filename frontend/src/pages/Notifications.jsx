import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Bell, Cpu, MessageSquare, CheckCircle, Inbox } from 'lucide-react';
import { getNotifications, markNotificationRead, markAllNotificationsRead } from '../services/api';
import { formatDistanceToNow } from 'date-fns';
import { toast } from 'sonner';

const Notifications = () => {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    fetchNotifications();
  }, []);

  const fetchNotifications = async () => {
    try {
      const res = await getNotifications();
      setNotifications(res || []);
    } catch (error) {
      console.error("Failed to load notifications", error);
    } finally {
      setLoading(false);
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await markAllNotificationsRead();
      setNotifications(notifications.map(n => ({ ...n, is_read: true })));
      toast.success('All marked as read');
    } catch (error) {
      toast.error('Failed to mark all as read');
    }
  };

  const handleNotificationClick = async (notification) => {
    if (!notification.is_read) {
      try {
        await markNotificationRead(notification.id);
        setNotifications(notifications.map(n => 
          n.id === notification.id ? { ...n, is_read: true } : n
        ));
      } catch (error) {
        console.error(error);
      }
    }

    if (notification.type === 'message_received') {
      navigate('/messages');
    } else if (notification.related_item_id) {
      navigate(`/items/${notification.related_item_id}`);
    } else if (notification.item_id) {
      navigate(`/items/${notification.item_id}`);
    }
  };

  const getIcon = (type) => {
    switch (type) {
      case 'match_found': return <Cpu size={20} className="text-purple-600" />;
      case 'message_received': return <MessageSquare size={20} className="text-blue-600" />;
      case 'item_recovered': return <CheckCircle size={20} className="text-green-600" />;
      default: return <Bell size={20} className="text-indigo-600" />;
    }
  };

  const getBgColor = (type) => {
    switch (type) {
      case 'match_found': return 'bg-purple-100';
      case 'message_received': return 'bg-blue-100';
      case 'item_recovered': return 'bg-green-100';
      default: return 'bg-indigo-100';
    }
  };

  return (
    <div className="max-w-3xl mx-auto px-4 py-10">
      <div className="flex justify-between items-end mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
            <Bell size={28} className="text-indigo-600" /> Notifications
          </h1>
        </div>
        {notifications.some(n => !n.is_read) && (
          <button 
            onClick={handleMarkAllRead}
            className="text-sm font-medium text-indigo-600 hover:text-indigo-800 transition-colors"
          >
            Mark all as read
          </button>
        )}
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        {loading ? (
          <div className="divide-y divide-gray-100">
            {[1,2,3,4].map(i => (
              <div key={i} className="p-4 flex gap-4 animate-pulse">
                <div className="w-12 h-12 bg-gray-200 rounded-full"></div>
                <div className="flex-1 space-y-2 py-1">
                  <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                  <div className="h-3 bg-gray-200 rounded w-1/4"></div>
                </div>
              </div>
            ))}
          </div>
        ) : notifications.length > 0 ? (
          <div className="divide-y divide-gray-100">
            {notifications.map(notification => (
              <div 
                key={notification.id}
                onClick={() => handleNotificationClick(notification)}
                className={`p-5 flex gap-4 cursor-pointer transition-colors hover:bg-gray-50 ${!notification.is_read ? 'bg-indigo-50/30' : ''}`}
              >
                <div className={`w-12 h-12 rounded-full flex items-center justify-center shrink-0 ${getBgColor(notification.type)}`}>
                  {getIcon(notification.type)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className={`text-sm ${!notification.is_read ? 'font-semibold text-gray-900' : 'text-gray-700'}`}>
                    {notification.message}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    {notification.created_at ? formatDistanceToNow(new Date(notification.created_at), { addSuffix: true }) : ''}
                  </p>
                </div>
                {!notification.is_read && (
                  <div className="w-2.5 h-2.5 bg-indigo-600 rounded-full mt-2 shrink-0"></div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="p-16 text-center text-gray-500">
            <Inbox size={64} className="mx-auto mb-4 text-gray-300" />
            <h3 className="text-xl font-medium text-gray-800 mb-2">All caught up!</h3>
            <p>You don't have any notifications right now.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Notifications;

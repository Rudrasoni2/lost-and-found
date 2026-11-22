import React, { useState, useEffect, useRef } from 'react';
import { useParams, useSearchParams, useNavigate, Link } from 'react-router-dom';
import { MessageSquare, Send, ArrowLeft, User, Package, Clock } from 'lucide-react';
import { getConversations, getMessages, sendMessage, getItem } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { format } from 'date-fns';
import { toast } from 'sonner';

const Messages = () => {
  const { userId } = useParams(); // ID of the other user in conversation
  const [searchParams] = useSearchParams();
  const itemIdParam = searchParams.get('item_id');
  const navigate = useNavigate();
  const { user } = useAuth();

  const [conversations, setConversations] = useState([]);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loadingConv, setLoadingConv] = useState(true);
  const [loadingMsgs, setLoadingMsgs] = useState(false);
  const [otherUser, setOtherUser] = useState(null);
  const [relatedItem, setRelatedItem] = useState(null);

  const messagesEndRef = useRef(null);

  // Fetch conversations list
  const fetchConvs = async () => {
    try {
      const res = await getConversations();
      setConversations(res || []);
    } catch (error) {
      console.error("Failed to load conversations", error);
    } finally {
      setLoadingConv(false);
    }
  };

  useEffect(() => {
    fetchConvs();
  }, []);

  // Fetch related item info if item_id is present
  useEffect(() => {
    if (itemIdParam) {
      getItem(itemIdParam)
        .then((itemData) => {
          if (itemData) setRelatedItem(itemData);
        })
        .catch(() => setRelatedItem(null));
    } else {
      setRelatedItem(null);
    }
  }, [itemIdParam]);

  // Fetch messages when a user is selected
  useEffect(() => {
    let interval;
    if (userId) {
      const fetchMsgs = async () => {
        try {
          const res = await getMessages(userId, itemIdParam);
          const msgData = res || [];
          setMessages(msgData);

          // Find other user name
          const targetId = Number(userId);
          const matchedConv = conversations.find(c => Number(c.user_id) === targetId);

          if (matchedConv) {
            setOtherUser({ id: targetId, name: matchedConv.user_name });
          } else if (msgData.length > 0) {
            const firstMsg = msgData[0];
            const otherName = Number(firstMsg.sender_id) === targetId ? firstMsg.sender_name : firstMsg.receiver_name;
            setOtherUser({ id: targetId, name: otherName || 'User' });
          } else if (relatedItem && Number(relatedItem.user_id) === targetId) {
            setOtherUser({ id: targetId, name: relatedItem.user_name || 'Reporter' });
          } else {
            setOtherUser({ id: targetId, name: 'User' });
          }

          scrollToBottom();
        } catch (error) {
          console.error("Failed to load messages", error);
        } finally {
          setLoadingMsgs(false);
        }
      };

      setLoadingMsgs(true);
      fetchMsgs();

      // Poll messages every 4 seconds
      interval = setInterval(fetchMsgs, 4000);
    } else {
      setMessages([]);
      setOtherUser(null);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [userId, itemIdParam, conversations.length, relatedItem]);

  const scrollToBottom = () => {
    setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  };

  const handleSend = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !userId) return;

    const text = newMessage.trim();
    setNewMessage('');

    const targetUserId = Number(userId);
    const parsedItemId = itemIdParam ? Number(itemIdParam) : null;

    // Optimistic message
    const tempId = Date.now();
    const tempMsg = {
      id: tempId,
      sender_id: user?.id,
      sender_name: user?.name,
      receiver_id: targetUserId,
      item_id: parsedItemId,
      content: text,
      created_at: new Date().toISOString()
    };
    setMessages(prev => [...prev, tempMsg]);
    scrollToBottom();

    try {
      const sentMsg = await sendMessage({
        receiver_id: targetUserId,
        item_id: parsedItemId,
        content: text
      });

      // Update with real sent response
      setMessages(prev => prev.map(m => m.id === tempId ? sentMsg : m));
      // Refresh conversations list to show newest preview
      fetchConvs();
    } catch (error) {
      console.error("Failed to send message", error);
      const errMsg = error.detail || error.message || 'Failed to send message';
      toast.error(errMsg);
      // Remove optimistic message on failure
      setMessages(prev => prev.filter(m => m.id !== tempId));
    }
  };

  const isMobile = window.innerWidth < 768;
  const showList = !isMobile || (isMobile && !userId);
  const showThread = !isMobile || (isMobile && userId);

  return (
    <div className="max-w-6xl mx-auto px-4 py-6 h-[calc(100vh-100px)]">
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 h-full flex overflow-hidden">
        
        {/* Left Panel: Conversations List */}
        {showList && (
          <div className="w-full md:w-1/3 border-r border-gray-100 flex flex-col h-full bg-gray-50">
            <div className="p-4 border-b border-gray-200 bg-white">
              <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                <MessageSquare size={20} className="text-indigo-600" /> Messages
              </h2>
            </div>
            
            <div className="overflow-y-auto flex-1 divide-y divide-gray-100">
              {loadingConv ? (
                <div className="p-8 text-center text-gray-400">
                  <div className="w-6 h-6 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
                  Loading conversations...
                </div>
              ) : conversations.length > 0 ? (
                conversations.map((conv) => {
                  const isSelected = Number(userId) === Number(conv.user_id);
                  let timeDisplay = '';
                  if (conv.last_message_time) {
                    try {
                      timeDisplay = format(new Date(conv.last_message_time), 'p');
                    } catch (e) {
                      timeDisplay = '';
                    }
                  }

                  return (
                    <div 
                      key={conv.user_id}
                      onClick={() => navigate(`/messages/${conv.user_id}${conv.item_id ? `?item_id=${conv.item_id}` : ''}`)}
                      className={`p-4 cursor-pointer transition-colors ${isSelected ? 'bg-indigo-50/80 border-l-4 border-indigo-600' : 'hover:bg-white bg-transparent'}`}
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 bg-indigo-100 rounded-full flex items-center justify-center text-indigo-600 font-bold shrink-0 text-lg">
                          {conv.user_name ? conv.user_name.charAt(0).toUpperCase() : 'U'}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex justify-between items-baseline mb-1">
                            <h3 className="font-semibold text-gray-900 truncate">{conv.user_name || 'User'}</h3>
                            <span className="text-xs text-gray-400">{timeDisplay}</span>
                          </div>
                          <p className={`text-sm truncate ${conv.unread_count > 0 ? 'font-semibold text-gray-900' : 'text-gray-500'}`}>
                            {conv.last_message}
                          </p>
                          {conv.item_id && (
                            <p className="text-xs text-indigo-600 mt-1 flex items-center gap-1 truncate">
                              <Package size={12} /> Item #{conv.item_id}
                            </p>
                          )}
                        </div>
                        {conv.unread_count > 0 && (
                          <div className="w-5 h-5 bg-indigo-600 rounded-full text-white text-xs flex items-center justify-center font-medium shrink-0">
                            {conv.unread_count}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="p-8 text-center text-gray-400">
                  <MessageSquare size={36} className="mx-auto mb-2 opacity-30" />
                  <p className="font-medium text-gray-600">No conversations yet</p>
                  <p className="text-xs text-gray-400 mt-1">When you contact a reporter or receive inquiries, your chats appear here.</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Right Panel: Active Thread */}
        {showThread && (
          <div className="w-full md:w-2/3 flex flex-col h-full bg-white relative">
            {userId ? (
              <>
                {/* Header */}
                <div className="p-4 border-b border-gray-100 flex items-center justify-between bg-white shadow-sm z-10">
                  <div className="flex items-center gap-3">
                    {isMobile && (
                      <button onClick={() => navigate('/messages')} className="p-2 -ml-2 text-gray-500 hover:bg-gray-100 rounded-full">
                        <ArrowLeft size={20} />
                      </button>
                    )}
                    <div className="w-10 h-10 bg-indigo-100 rounded-full flex items-center justify-center text-indigo-600 font-bold">
                      {otherUser?.name ? otherUser.name.charAt(0).toUpperCase() : 'U'}
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900">{otherUser?.name || 'User'}</h3>
                      {relatedItem ? (
                        <Link to={`/items/${relatedItem.id}`} className="text-xs text-indigo-600 hover:underline flex items-center gap-1">
                          <Package size={12} /> Inquiry about: {relatedItem.name}
                        </Link>
                      ) : itemIdParam ? (
                        <p className="text-xs text-gray-500 flex items-center gap-1">
                          <Package size={12} /> Regarding Item #{itemIdParam}
                        </p>
                      ) : (
                        <p className="text-xs text-gray-400">Active conversation</p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Messages Area */}
                <div className="flex-1 overflow-y-auto p-4 bg-gray-50/50">
                  {loadingMsgs && messages.length === 0 ? (
                    <div className="flex justify-center py-10">
                      <div className="animate-spin w-6 h-6 border-2 border-indigo-600 border-t-transparent rounded-full"></div>
                    </div>
                  ) : messages.length === 0 ? (
                    <div className="text-center py-12 text-gray-400">
                      <MessageSquare size={36} className="mx-auto mb-2 opacity-30 text-indigo-500" />
                      <p className="text-sm font-medium text-gray-600">Start the conversation</p>
                      <p className="text-xs text-gray-400 mt-1">Send a message to discuss this item.</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {messages.map((msg, idx) => {
                        const isMine = Number(msg.sender_id) === Number(user?.id);
                        let timeStr = '';
                        if (msg.created_at) {
                          try {
                            timeStr = format(new Date(msg.created_at), 'p');
                          } catch (e) {
                            timeStr = '';
                          }
                        }

                        return (
                          <div key={msg.id || idx} className={`flex ${isMine ? 'justify-end' : 'justify-start'}`}>
                            <div className={`max-w-[75%] rounded-2xl px-4 py-2.5 shadow-sm ${
                              isMine 
                                ? 'bg-indigo-600 text-white rounded-br-none' 
                                : 'bg-white text-gray-800 border border-gray-100 rounded-bl-none'
                            }`}>
                              <p className="text-sm whitespace-pre-wrap break-words leading-relaxed">{msg.content}</p>
                              <div className={`text-[10px] mt-1 text-right ${isMine ? 'text-indigo-200' : 'text-gray-400'}`}>
                                {timeStr}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                      <div ref={messagesEndRef} />
                    </div>
                  )}
                </div>

                {/* Input Area */}
                <div className="p-4 bg-white border-t border-gray-100">
                  <form onSubmit={handleSend} className="flex gap-2">
                    <input
                      type="text"
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      placeholder="Type a message..."
                      className="flex-1 px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-full focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition text-sm"
                    />
                    <button
                      type="submit"
                      disabled={!newMessage.trim()}
                      className="w-10 h-10 rounded-full bg-indigo-600 text-white flex items-center justify-center hover:bg-indigo-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors shrink-0 shadow-sm"
                    >
                      <Send size={18} className="ml-0.5" />
                    </button>
                  </form>
                </div>
              </>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center text-gray-400 p-8 text-center">
                <div className="w-16 h-16 bg-indigo-50 rounded-full flex items-center justify-center text-indigo-600 mb-4">
                  <MessageSquare size={32} />
                </div>
                <h3 className="text-lg font-semibold text-gray-700 mb-1">Your Messages</h3>
                <p className="text-sm text-gray-500 max-w-sm">Select an existing conversation on the left, or contact an item reporter from an item details page to start chatting.</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default Messages;

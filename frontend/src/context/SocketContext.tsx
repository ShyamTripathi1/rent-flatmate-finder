import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import { MessageSquare, X } from 'lucide-react';
import { useAuth } from './AuthContext';
import { api } from '../services/api';

export interface ChatMessage {
  id: string;
  interestRequestId: string;
  senderId: string;
  content: string;
  createdAt: string;
  readAt: string | null;
  sender: {
    id: string;
    name: string;
    role: string;
  };
}

interface SocketContextType {
  socket: Socket | null;
  isConnected: boolean;
  messages: ChatMessage[];
  typingUsers: { [userId: string]: boolean };
  activeRoomId: string | null;
  joinRoom: (interestRequestId: string) => void;
  sendMessage: (interestRequestId: string, content: string) => void;
  sendTypingStatus: (interestRequestId: string, isTyping: boolean) => void;
  loadHistory: (interestRequestId: string) => Promise<void>;
  clearMessages: () => void;
}

const SocketContext = createContext<SocketContextType | undefined>(undefined);

export const SocketProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [typingUsers, setTypingUsers] = useState<{ [userId: string]: boolean }>({});
  const [activeRoomId, setActiveRoomId] = useState<string | null>(null);
  const [notification, setNotification] = useState<{ message: string; senderName: string; id: string } | null>(null);
  const activeRoomIdRef = useRef<string | null>(null);

  useEffect(() => {
    activeRoomIdRef.current = activeRoomId;
  }, [activeRoomId]);

  useEffect(() => {
    if (!user) {
      if (socket) {
        socket.disconnect();
        setSocket(null);
      }
      setIsConnected(false);
      setMessages([]);
      setActiveRoomId(null);
      return;
    }

    const token = localStorage.getItem('accessToken');
    const backendUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000';
    const newSocket = io(backendUrl, {
      auth: { token },
      autoConnect: true,
    });

    newSocket.on('connect', () => {
      console.log('Socket.IO connection established');
      setIsConnected(true);

      // Re-join active room if connection dropped and restored
      if (activeRoomIdRef.current) {
        newSocket.emit('join_room', { interestRequestId: activeRoomIdRef.current });
      }
    });

    newSocket.on('disconnect', () => {
      console.log('Socket.IO connection closed');
      setIsConnected(false);
    });

    newSocket.on('new_message', (msg: ChatMessage) => {
      if (msg.interestRequestId === activeRoomIdRef.current) {
        setMessages((prev) => {
          // Prevent duplicates
          if (prev.some((m) => m.id === msg.id)) return prev;
          return [...prev, msg];
        });
      }
      
      if (user && msg.senderId !== user.id) {
        setNotification({
          message: msg.content,
          senderName: msg.sender.name,
          id: msg.id
        });
        
        // Auto dismiss after 4 seconds
        setTimeout(() => setNotification(null), 4000);
      }
    });

    newSocket.on('typing', ({ senderId, isTyping }: { senderId: string; isTyping: boolean }) => {
      setTypingUsers((prev) => ({
        ...prev,
        [senderId]: isTyping,
      }));
    });

    newSocket.on('error_message', (data: { message: string }) => {
      console.error('Socket error received:', data.message);
      alert(data.message);
    });

    setSocket(newSocket);

    return () => {
      newSocket.disconnect();
    };
  }, [user]);

  const joinRoom = (interestRequestId: string) => {
    if (!socket || !isConnected) return;
    setActiveRoomId(interestRequestId);
    setTypingUsers({});
    socket.emit('join_room', { interestRequestId });
  };

  const sendMessage = (interestRequestId: string, content: string) => {
    if (!socket || !isConnected) return;
    socket.emit('send_message', { interestRequestId, content });
  };

  const sendTypingStatus = (interestRequestId: string, isTyping: boolean) => {
    if (!socket || !isConnected) return;
    socket.emit('typing', { interestRequestId, isTyping });
  };

  const loadHistory = async (interestRequestId: string) => {
    try {
      const history = await api.get(`/chat/${interestRequestId}/messages`);
      setMessages(history);
    } catch (err) {
      console.error('Error loading chat messages:', err);
      throw err;
    }
  };

  const clearMessages = () => {
    setMessages([]);
    setActiveRoomId(null);
    setTypingUsers({});
  };

  return (
    <SocketContext.Provider
      value={{
        socket,
        isConnected,
        messages,
        typingUsers,
        activeRoomId,
        joinRoom,
        sendMessage,
        sendTypingStatus,
        loadHistory,
        clearMessages,
      }}
    >
      {children}
      
      {/* Global Message Notification */}
      {notification && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[100] animate-in fade-in slide-in-from-bottom-4 duration-300">
          <div className="bg-slate-800 border border-slate-700 shadow-xl shadow-black/50 rounded-2xl p-4 min-w-[320px] max-w-[400px] flex items-start gap-3">
            <div className="bg-brand-500/20 text-brand-400 p-2 rounded-full shrink-0">
              <MessageSquare className="w-5 h-5" />
            </div>
            <div className="flex-1 overflow-hidden">
              <h4 className="text-slate-200 text-sm font-semibold truncate">New message from {notification.senderName}</h4>
              <p className="text-slate-400 text-xs mt-1 line-clamp-2">{notification.message}</p>
            </div>
            <button 
              onClick={() => setNotification(null)} 
              className="text-slate-500 hover:text-slate-300 transition-colors p-1"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </SocketContext.Provider>
  );
};

export const useSocket = () => {
  const context = useContext(SocketContext);
  if (!context) {
    throw new Error('useSocket must be used within a SocketProvider');
  }
  return context;
};

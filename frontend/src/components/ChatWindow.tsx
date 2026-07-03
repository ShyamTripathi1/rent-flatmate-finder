import React, { useState, useEffect, useRef } from 'react';
import { useSocket } from '../context/SocketContext';
import { useAuth } from '../context/AuthContext';
import { Send, X, AlertCircle, Sparkles, Loader } from 'lucide-react';

interface ChatWindowProps {
  interestRequestId: string;
  roomTitle: string;
  onClose: () => void;
}

export const ChatWindow: React.FC<ChatWindowProps> = ({ interestRequestId, roomTitle, onClose }) => {
  const { user } = useAuth();
  const {
    isConnected,
    messages,
    typingUsers,
    joinRoom,
    sendMessage,
    sendTypingStatus,
    loadHistory,
    clearMessages,
  } = useSocket();

  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isTypingRef = useRef(false);

  // Join room and load history on mount
  useEffect(() => {
    let active = true;
    setIsLoading(true);
    setError(null);

    const initChat = async () => {
      try {
        joinRoom(interestRequestId);
        await loadHistory(interestRequestId);
      } catch (err: any) {
        if (active) {
          setError(err?.message || err || 'Failed to load chat history.');
        }
      } finally {
        if (active) {
          setIsLoading(false);
        }
      }
    };

    initChat();

    return () => {
      active = false;
      clearMessages();
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
      // Notify other user we stopped typing when closing chat
      if (isTypingRef.current) {
        sendTypingStatus(interestRequestId, false);
      }
    };
  }, [interestRequestId]);

  // Scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, typingUsers]);

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputMessage.trim()) return;

    sendMessage(interestRequestId, inputMessage.trim());
    setInputMessage('');

    // Reset typing state
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
    sendTypingStatus(interestRequestId, false);
    isTypingRef.current = false;
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputMessage(e.target.value);

    if (!isTypingRef.current) {
      isTypingRef.current = true;
      sendTypingStatus(interestRequestId, true);
    }

    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    typingTimeoutRef.current = setTimeout(() => {
      sendTypingStatus(interestRequestId, false);
      isTypingRef.current = false;
    }, 2000);
  };

  // Determine if the other user is typing
  const otherUserId = Object.keys(typingUsers).find((id) => id !== user?.id && typingUsers[id]);
  const isOtherUserTyping = !!otherUserId;

  return (
    <div className="flex flex-col h-full bg-blue-50 border border-blue-200 rounded-2xl overflow-hidden shadow-2xl relative">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 bg-blue-100 border-b border-blue-200">
        <div className="flex flex-col">
          <div className="flex items-center gap-2">
            <h3 className="font-bold text-slate-900 text-base leading-tight">{roomTitle}</h3>
            <span className={`w-2 h-2 rounded-full ${isConnected ? 'bg-emerald-500 shadow-lg shadow-emerald-500/50' : 'bg-red-500'}`} />
          </div>
          <span className="text-xs text-slate-600 mt-0.5">
            {isConnected ? 'Real-time Connected' : 'Connecting WebSocket...'}
          </span>
        </div>
        <button
          onClick={onClose}
          className="p-1.5 hover:bg-blue-200 rounded-lg text-slate-500 hover:text-slate-700 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Messages viewport */}
      <div className="flex-1 overflow-y-auto p-6 space-y-4 min-h-0 bg-blue-50/50">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center h-full gap-3 text-slate-400">
            <Loader className="w-8 h-8 animate-spin text-brand-500" />
            <p className="text-sm">Loading chat history...</p>
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center h-full gap-3 text-red-500 max-w-xs mx-auto text-center">
            <AlertCircle className="w-10 h-10 shrink-0" />
            <p className="text-sm">{error}</p>
          </div>
        ) : messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full gap-2 text-slate-500">
            <Sparkles className="w-8 h-8 opacity-40 mb-1" />
            <p className="text-sm font-semibold">Start of Conversation</p>
            <p className="text-xs max-w-[200px] text-center">Send your first message to introduce yourself!</p>
          </div>
        ) : (
          messages.map((msg) => {
            const isMe = msg.senderId === user?.id;
            return (
              <div key={msg.id} className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
                <div className="flex items-baseline gap-2 mb-1 px-1">
                  {!isMe && <span className="text-xs font-bold text-slate-700">{msg.sender.name}</span>}
                  <span className="text-[10px] text-slate-500">
                    {new Date(msg.createdAt).toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
                <div
                  className={`max-w-[75%] rounded-2xl px-4 py-2.5 text-sm shadow-md break-words ${
                    isMe
                      ? 'bg-brand-600 text-white rounded-tr-none'
                      : 'bg-white text-slate-800 rounded-tl-none border border-blue-100'
                  }`}
                >
                  {msg.content}
                </div>
              </div>
            );
          })
        )}

        {isOtherUserTyping && (
          <div className="flex items-center gap-2.5 px-2 text-slate-500 text-xs mt-2">
            <div className="flex gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-slate-400 animate-bounce" style={{ animationDelay: '0ms' }} />
              <span className="w-1.5 h-1.5 rounded-full bg-slate-400 animate-bounce" style={{ animationDelay: '150ms' }} />
              <span className="w-1.5 h-1.5 rounded-full bg-slate-400 animate-bounce" style={{ animationDelay: '300ms' }} />
            </div>
            <span>Someone is typing...</span>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input controls */}
      <form onSubmit={handleSend} className="p-4 bg-white border-t border-blue-200 flex gap-2">
        <input
          type="text"
          value={inputMessage}
          onChange={handleInputChange}
          placeholder={isConnected ? 'Type your message...' : 'Reconnecting...'}
          disabled={!isConnected}
          className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-slate-900 placeholder-slate-400 text-sm focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500/20 disabled:opacity-50"
        />
        <button
          type="submit"
          disabled={!isConnected || !inputMessage.trim()}
          className="bg-brand-600 hover:bg-brand-500 active:bg-brand-700 text-white p-3 rounded-xl transition-all shadow-md shadow-brand-500/10 flex items-center justify-center hover:scale-105 active:scale-95 disabled:opacity-50 disabled:scale-100 disabled:pointer-events-none"
        >
          <Send className="w-4 h-4" />
        </button>
      </form>
    </div>
  );
};
export default ChatWindow;

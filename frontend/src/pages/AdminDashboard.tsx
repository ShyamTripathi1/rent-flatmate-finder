import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import {
  ShieldAlert,
  Users,
  Home,
  MessageSquare,
  Activity,
  Trash2,
  AlertCircle,
  Loader,
  LogOut,
  Mail,
  Calendar,
  Lock,
  LockOpen,
  User
} from 'lucide-react';

export const AdminDashboard: React.FC = () => {
  const { user, logout } = useAuth();
  const [activeTab, setActiveTab] = useState<'stats' | 'users' | 'listings' | 'chats'>('stats');

  // Chats Directory State
  const [chatsList, setChatsList] = useState<any[]>([]);
  const [loadingChats, setLoadingChats] = useState(false);
  const [viewingChatId, setViewingChatId] = useState<string | null>(null);
  const [chatMessages, setChatMessages] = useState<any[]>([]);
  const [loadingMessages, setLoadingMessages] = useState(false);

  // Stats State
  const [stats, setStats] = useState<any>(null);
  const [loadingStats, setLoadingStats] = useState(false);

  // Users Directory State
  const [usersList, setUsersList] = useState<any[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(false);

  // Listings Directory State
  const [listingsList, setListingsList] = useState<any[]>([]);
  const [loadingListings, setLoadingListings] = useState(false);

  // Actions states
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const fetchStats = async () => {
    setLoadingStats(true);
    try {
      const data = await api.get('/admin/stats');
      setStats(data);
    } catch (err) {
      console.error('Error loading admin stats:', err);
    } finally {
      setLoadingStats(false);
    }
  };

  const fetchUsers = async () => {
    setLoadingUsers(true);
    try {
      const data = await api.get('/admin/users');
      setUsersList(data);
    } catch (err) {
      console.error('Error loading admin users:', err);
    } finally {
      setLoadingUsers(false);
    }
  };

  const fetchListings = async () => {
    setLoadingListings(true);
    try {
      const data = await api.get('/listings');
      setListingsList(data);
    } catch (err) {
      console.error('Error loading listings:', err);
    } finally {
      setLoadingListings(false);
    }
  };

  const fetchChats = async () => {
    setLoadingChats(true);
    try {
      const data = await api.get('/admin/chats');
      setChatsList(data);
    } catch (err) {
      console.error('Error loading admin chats:', err);
    } finally {
      setLoadingChats(false);
    }
  };

  const fetchChatMessages = async (interestId: string) => {
    setLoadingMessages(true);
    setViewingChatId(interestId);
    try {
      const data = await api.get(`/admin/chats/${interestId}/messages`);
      setChatMessages(data);
    } catch (err) {
      console.error('Error loading admin chat messages:', err);
    } finally {
      setLoadingMessages(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'stats') {
      fetchStats();
    } else if (activeTab === 'users') {
      fetchUsers();
    } else if (activeTab === 'listings') {
      fetchListings();
    } else if (activeTab === 'chats') {
      fetchChats();
      setViewingChatId(null);
    }
  }, [activeTab]);

  const handleDeleteUser = async (userId: string) => {
    if (userId === user?.id) {
      alert('You cannot delete your own admin account.');
      return;
    }
    if (!confirm('Are you sure you want to delete this user? This will remove all their postings, messages, and matches.')) {
      return;
    }

    setDeletingId(userId);
    try {
      await api.delete(`/admin/users/${userId}`);
      alert('User deleted successfully.');
      fetchUsers();
    } catch (err: any) {
      alert(err || 'Failed to delete user.');
    } finally {
      setDeletingId(null);
    }
  };

  const handleDeleteListing = async (listingId: string) => {
    if (!confirm('Are you sure you want to remove this listing?')) {
      return;
    }

    setDeletingId(listingId);
    try {
      await api.delete(`/admin/listings/${listingId}`);
      alert('Listing removed successfully.');
      fetchListings();
    } catch (err: any) {
      alert(err || 'Failed to remove listing.');
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="h-screen overflow-hidden flex bg-gradient-to-br from-pink-300 via-pink-200 to-red-300 text-slate-900 relative">
      {/* Background decoration */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-brand-500/5 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-0 left-1/4 w-96 h-96 bg-blue-500/5 rounded-full blur-[120px] pointer-events-none" />

      {/* Sidebar Navigation */}
      <aside className="w-64 border-r border-pink-200/60 bg-gradient-to-br from-pink-200 via-pink-100 to-red-100 flex flex-col justify-between shrink-0">
        <div className="flex-1 overflow-y-auto">
          {/* Brand */}
          <div className="flex items-center gap-3 px-6 py-6 border-b border-slate-200">
            <div className="p-2 bg-brand-50 rounded-lg border border-brand-100 text-brand-600">
              <ShieldAlert className="w-6 h-6" />
            </div>
            <div>
              <h1 className="font-bold text-sm leading-tight text-slate-900">Admin Control</h1>
              <span className="text-[10px] text-brand-500 font-semibold tracking-wider uppercase">Platform Admin</span>
            </div>
          </div>

          {/* Navigation */}
          <nav className="p-4 space-y-1">
            <button
              onClick={() => setActiveTab('stats')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-all ${
                activeTab === 'stats'
                  ? 'bg-gray-100 border-l-4 border-black text-black'
                  : 'text-black hover:bg-gray-100'
              }`}
            >
              <Activity className="w-5 h-5" />
              Stats Dashboard
            </button>

            <button
              onClick={() => setActiveTab('users')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-all ${
                activeTab === 'users'
                  ? 'bg-gray-100 border-l-4 border-black text-black'
                  : 'text-black hover:bg-gray-100'
              }`}
            >
              <Users className="w-5 h-5" />
              Manage Users
            </button>

            <button
              onClick={() => setActiveTab('listings')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-all ${
                activeTab === 'listings'
                  ? 'bg-gray-100 border-l-4 border-black text-black'
                  : 'text-black hover:bg-gray-100'
              }`}
            >
              <Home className="w-5 h-5" />
              Manage Listings
            </button>

            <button
              onClick={() => setActiveTab('chats')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-all ${
                activeTab === 'chats'
                  ? 'bg-gray-100 border-l-4 border-black text-black'
                  : 'text-black hover:bg-gray-100'
              }`}
            >
              <MessageSquare className="w-5 h-5" />
              Monitor Chats
            </button>
          </nav>
        </div>

        {/* Footer profile info & Logout */}
        <div className="p-4 border-t border-slate-200 bg-slate-50/50">
          <div className="flex items-center gap-3 mb-4 px-2">
            <div className="w-10 h-10 rounded-full bg-slate-200 flex items-center justify-center font-bold text-slate-600">
              {user?.name.charAt(0)}
            </div>
            <div className="min-w-0">
              <p className="text-sm font-semibold text-slate-800 truncate">{user?.name}</p>
              <p className="text-xs text-slate-500 truncate">{user?.email}</p>
            </div>
          </div>
          <button
            onClick={logout}
            className="w-full flex items-center justify-center gap-2 bg-red-50 hover:bg-red-100 text-red-600 rounded-xl py-2.5 text-xs font-bold transition-all border border-red-200"
          >
            <LogOut className="w-4 h-4" />
            Sign Out
          </button>
        </div>
      </aside>

      {/* Main Viewport */}
      <main className="flex-1 flex flex-col min-w-0 overflow-y-auto">
        <header className="px-8 py-5 border-b border-slate-200/60 flex items-center justify-between bg-white/60 backdrop-blur-xl sticky top-0 z-10 shadow-sm">
          <div>
            <h2 className="text-xl font-extrabold text-slate-900">
              {activeTab === 'stats' && 'System Analytics'}
              {activeTab === 'users' && 'User Accounts Directory'}
              {activeTab === 'listings' && 'Rental Postings Moderator'}
              {activeTab === 'chats' && 'Chat Monitoring'}
            </h2>
            <p className="text-xs text-slate-500 mt-1">
              {activeTab === 'stats' && 'Monitor core flatmate matching activity, user logs and counts'}
              {activeTab === 'users' && 'Suspend, delete, or inspect platform user profiles'}
              {activeTab === 'listings' && 'Moderate room and apartment ads posted on the board'}
              {activeTab === 'chats' && 'View all active conversations between tenants and owners'}
            </p>
          </div>
        </header>

        <div className="flex-1 p-8">
          {/* Stats Dashboard */}
          {activeTab === 'stats' && (
            <div className="space-y-8">
              {loadingStats ? (
                <div className="flex flex-col items-center justify-center py-16 gap-3 text-slate-400">
                  <Loader className="w-8 h-8 animate-spin text-brand-500" />
                  <p className="text-sm font-semibold">Compiling database metrics...</p>
                </div>
              ) : stats ? (
                <>
                  {/* Grid of stats */}
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    <div className="glass-card p-6 rounded-2xl flex items-center gap-4">
                      <div className="p-3 bg-brand-500/10 rounded-xl border border-brand-500/20 text-brand-600">
                        <Users className="w-6 h-6" />
                      </div>
                      <div>
                        <span className="text-[10px] text-black uppercase font-extrabold tracking-wider block">Total Users</span>
                        <span className="text-2xl font-black text-black">{stats.users.total}</span>
                        <span className="text-[10px] text-black block mt-1">
                          {stats.users.tenants} Tenants / {stats.users.owners} Owners
                        </span>
                      </div>
                    </div>

                    <div className="glass-card p-6 rounded-2xl flex items-center gap-4">
                      <div className="p-3 bg-blue-500/10 rounded-xl border border-blue-500/20 text-blue-600">
                        <Home className="w-6 h-6" />
                      </div>
                      <div>
                        <span className="text-[10px] text-black uppercase font-extrabold tracking-wider block">Listings</span>
                        <span className="text-2xl font-black text-black">{stats.listings.total}</span>
                        <span className="text-[10px] text-black block mt-1">
                          {stats.listings.active} Active / {stats.listings.filled} Filled
                        </span>
                      </div>
                    </div>

                    <div className="glass-card p-6 rounded-2xl flex items-center gap-4">
                      <div className="p-3 bg-emerald-500/10 rounded-xl border border-emerald-500/20 text-emerald-600">
                        <Activity className="w-6 h-6" />
                      </div>
                      <div>
                        <span className="text-[10px] text-black uppercase font-extrabold tracking-wider block">Matches</span>
                        <span className="text-2xl font-black text-black">{stats.interests.total}</span>
                        <span className="text-[10px] text-black block mt-1">
                          {stats.interests.accepted} Accepted / {stats.interests.pending} Pending
                        </span>
                      </div>
                    </div>

                    <div className="glass-card p-6 rounded-2xl flex items-center gap-4">
                      <div className="p-3 bg-purple-500/10 rounded-xl border border-purple-500/20 text-purple-600">
                        <MessageSquare className="w-6 h-6" />
                      </div>
                      <div>
                        <span className="text-[10px] text-black uppercase font-extrabold tracking-wider block">Messages</span>
                        <span className="text-2xl font-black text-black">{stats.messages.total}</span>
                        <span className="text-[10px] text-black block mt-1">
                          Real-time WebSocket exchanges
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Summary progress bars */}
                  <div className="glass-card p-8 rounded-2xl max-w-xl space-y-6">
                    <h3 className="text-sm font-extrabold text-black">Platform Activity Breakdown</h3>
                    
                    <div className="space-y-4">
                      {/* Match Conversion Rate */}
                      <div className="space-y-1">
                        <div className="flex justify-between text-xs">
                          <span className="text-black font-semibold">Match Conversion Rate (Acceptance)</span>
                          <span className="font-extrabold text-black">
                            {stats.interests.total > 0
                              ? Math.round((stats.interests.accepted / stats.interests.total) * 100)
                              : 0}%
                          </span>
                        </div>
                        <div className="h-2 w-full bg-slate-200 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-brand-500 rounded-full"
                            style={{
                              width: `${
                                stats.interests.total > 0
                                  ? (stats.interests.accepted / stats.interests.total) * 100
                                  : 0
                              }%`
                            }}
                          />
                        </div>
                      </div>

                      {/* Room filled rate */}
                      <div className="space-y-1">
                        <div className="flex justify-between text-xs">
                          <span className="text-black font-semibold">Lessor Rooms Filled Rate</span>
                          <span className="font-extrabold text-black">
                            {stats.listings.total > 0
                              ? Math.round((stats.listings.filled / stats.listings.total) * 100)
                              : 0}%
                          </span>
                        </div>
                        <div className="h-2 w-full bg-slate-200 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-blue-500 rounded-full"
                            style={{
                              width: `${
                                stats.listings.total > 0
                                  ? (stats.listings.filled / stats.listings.total) * 100
                                  : 0
                              }%`
                            }}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </>
              ) : (
                <div className="text-slate-500 flex flex-col items-center justify-center py-16">
                  <AlertCircle className="w-10 h-10 opacity-30 mb-2" />
                  <p>Failed to compile dashboard reports.</p>
                </div>
              )}
            </div>
          )}

          {/* User Directory */}
          {activeTab === 'users' && (
            <div className="glass-card rounded-2xl overflow-hidden border border-slate-200">
              {loadingUsers ? (
                <div className="flex flex-col items-center justify-center py-16 gap-3 text-slate-500">
                  <Loader className="w-8 h-8 animate-spin text-brand-500" />
                  <p className="text-sm font-semibold">Querying user profiles...</p>
                </div>
              ) : usersList.length === 0 ? (
                <div className="text-slate-500 text-center py-16">No user accounts found.</div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="bg-gray-100 border-b border-gray-200 text-black font-bold uppercase tracking-wide">
                        <th className="px-6 py-4">Name</th>
                        <th className="px-6 py-4">Email</th>
                        <th className="px-6 py-4">Role</th>
                        <th className="px-6 py-4">Registered Date</th>
                        <th className="px-6 py-4 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200 bg-white">
                      {usersList.map((usr) => (
                        <tr key={usr.id} className="hover:bg-gray-50 transition-colors">
                          <td className="px-6 py-4 font-semibold text-black">{usr.name}</td>
                          <td className="px-6 py-4 text-black">{usr.email}</td>
                          <td className="px-6 py-4">
                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                              usr.role === 'ADMIN' ? 'bg-red-100 text-red-600' :
                              usr.role === 'OWNER' ? 'bg-blue-100 text-blue-600' :
                              'bg-purple-100 text-purple-600'
                            }`}>
                              {usr.role}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-black">
                            {new Date(usr.createdAt).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })}
                          </td>
                          <td className="px-6 py-4 text-right">
                            {usr.id === user?.id ? (
                              <span className="text-[10px] text-slate-500 font-semibold italic">Current Admin</span>
                            ) : (
                              <button
                                onClick={() => handleDeleteUser(usr.id)}
                                disabled={deletingId === usr.id}
                                className="bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 px-3 py-1.5 rounded-xl font-bold transition-all disabled:opacity-50"
                              >
                                Delete
                              </button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* Listings Directory */}
          {activeTab === 'listings' && (
            <div className="glass-card rounded-2xl overflow-hidden border border-slate-200">
              {loadingListings ? (
                <div className="flex flex-col items-center justify-center py-16 gap-3 text-slate-500">
                  <Loader className="w-8 h-8 animate-spin text-brand-500" />
                  <p className="text-sm font-semibold">Moderating listings directory...</p>
                </div>
              ) : listingsList.length === 0 ? (
                <div className="text-slate-500 text-center py-16">No listings found on the board.</div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="bg-gray-100 border-b border-gray-200 text-black font-bold uppercase tracking-wide">
                        <th className="px-6 py-4">Room Location</th>
                        <th className="px-6 py-4">Owner</th>
                        <th className="px-6 py-4">Monthly Rent</th>
                        <th className="px-6 py-4">Room Type</th>
                        <th className="px-6 py-4">Status</th>
                        <th className="px-6 py-4 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200 bg-white">
                      {listingsList.map((item) => (
                        <tr key={item.id} className="hover:bg-gray-50 transition-colors">
                          <td className="px-6 py-4 font-semibold text-black">{item.location}</td>
                          <td className="px-6 py-4 text-black">{item.owner.name}</td>
                          <td className="px-6 py-4 text-black font-semibold">₹{item.rent}</td>
                          <td className="px-6 py-4 text-black capitalize">{item.roomType}</td>
                          <td className="px-6 py-4">
                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                              item.isFilled ? 'bg-gray-200 text-gray-600' : 'bg-emerald-500/10 text-emerald-600'
                            }`}>
                              {item.isFilled ? 'Filled' : 'Active'}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-right">
                            <button
                              onClick={() => handleDeleteListing(item.id)}
                              disabled={deletingId === item.id}
                              className="bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 px-3 py-1.5 rounded-xl font-bold transition-all disabled:opacity-50"
                            >
                              Remove Ad
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* Chats Directory */}
          {activeTab === 'chats' && (
            <div className="glass-card rounded-2xl overflow-hidden border border-slate-200 flex h-[600px]">
              {/* Left sidebar: List of chats */}
              <div className={`w-full ${viewingChatId ? 'hidden md:flex md:w-1/3' : 'flex'} flex-col border-r border-gray-200 bg-white`}>
                <div className="p-4 border-b border-gray-200">
                  <h3 className="font-bold text-black">Active Conversations</h3>
                </div>
                <div className="flex-1 overflow-y-auto p-2">
                  {loadingChats ? (
                    <div className="flex justify-center py-8"><Loader className="w-6 h-6 animate-spin text-brand-500" /></div>
                  ) : chatsList.length === 0 ? (
                    <div className="text-center text-slate-500 py-8 text-sm">No active chats found.</div>
                  ) : (
                    chatsList.map(chat => (
                      <button
                        key={chat.id}
                        onClick={() => fetchChatMessages(chat.id)}
                        className={`w-full text-left p-3 rounded-xl mb-1 transition-colors ${
                          viewingChatId === chat.id ? 'bg-gray-200 border border-gray-300' : 'hover:bg-gray-100 border border-transparent'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-1">
                          <span className="font-bold text-xs text-black truncate pr-2">Match: {chat.tenant.name} & {chat.listing.owner.name}</span>
                        </div>
                        <p className="text-[10px] text-slate-500 truncate">{chat.listing.location}</p>
                      </button>
                    ))
                  )}
                </div>
              </div>

              {/* Right area: Chat messages */}
              <div className={`w-full ${!viewingChatId ? 'hidden md:flex md:w-2/3' : 'flex flex-col md:w-2/3'} bg-gray-50 relative`}>
                {!viewingChatId ? (
                  <div className="flex-1 flex flex-col items-center justify-center text-slate-500 p-8 text-center">
                    <MessageSquare className="w-12 h-12 opacity-20 mb-4" />
                    <p className="font-semibold text-black">Select a conversation</p>
                    <p className="text-xs mt-1 text-slate-500">Choose an active chat from the left to view the message history.</p>
                  </div>
                ) : (
                  <>
                    <div className="p-4 border-b border-gray-200 flex justify-between items-center bg-white">
                      <h3 className="font-bold text-black text-sm">Conversation History</h3>
                      <button onClick={() => setViewingChatId(null)} className="md:hidden text-xs text-brand-400 font-semibold">Back</button>
                    </div>
                    <div className="flex-1 overflow-y-auto p-4 space-y-4">
                      {loadingMessages ? (
                        <div className="flex justify-center py-8"><Loader className="w-6 h-6 animate-spin text-brand-500" /></div>
                      ) : chatMessages.length === 0 ? (
                        <div className="text-center text-slate-500 py-8 text-xs">No messages in this chat yet.</div>
                      ) : (
                        chatMessages.map(msg => (
                          <div key={msg.id} className="flex flex-col">
                            <span className="text-[10px] font-semibold text-slate-600 mb-1 ml-1 flex items-center gap-1">
                              {msg.sender.role === 'TENANT' ? <User className="w-3 h-3 text-brand-400"/> : <ShieldAlert className="w-3 h-3 text-blue-400"/>}
                              {msg.sender.name}
                            </span>
                            <div className="bg-white border border-gray-200 p-3 rounded-2xl rounded-tl-sm w-fit max-w-[80%]">
                              <p className="text-sm text-black">{msg.content}</p>
                              <span className="text-[9px] text-slate-400 mt-2 block">
                                {new Date(msg.createdAt).toLocaleString()}
                              </span>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </>
                )}
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};
export default AdminDashboard;

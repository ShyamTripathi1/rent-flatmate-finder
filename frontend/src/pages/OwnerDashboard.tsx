import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import api from '../services/api';
import { ChatWindow } from '../components/ChatWindow';
import { INDIAN_LOCATIONS, getStateFromDistrict } from '../utils/locations';
import {
  Home,
  Plus,
  Heart,
  MessageSquare,
  LogOut,
  Sparkles,
  Calendar,
  IndianRupee,
  MapPin,
  Settings,
  X,
  FileText,
  Trash2,
  Lock,
  Loader,
  CheckCircle,
  XCircle,
  Eye,
  Camera
} from 'lucide-react';

export const OwnerDashboard: React.FC = () => {
  const { user, logout } = useAuth();
  const { clearMessages } = useSocket();

  const [activeTab, setActiveTab] = useState<'listings' | 'interests'>('listings');

  // Listings state
  const [listings, setListings] = useState<any[]>([]);
  const [loadingListings, setLoadingListings] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [currentListing, setCurrentListing] = useState<any | null>(null);

  // Form states (Add/Edit)
  const [streetAddress, setStreetAddress] = useState('');
  const [listingState, setListingState] = useState('');
  const [location, setLocation] = useState('');
  const [rent, setRent] = useState('');
  const [availableFrom, setAvailableFrom] = useState('');
  const [roomType, setRoomType] = useState('single');
  const [furnishingStatus, setFurnishingStatus] = useState('furnished');
  const [description, setDescription] = useState('');
  const [photos, setPhotos] = useState<string[]>([]);
  const [formSubmitting, setFormSubmitting] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);

  // Interests state
  const [interests, setInterests] = useState<any[]>([]);
  const [loadingInterests, setLoadingInterests] = useState(false);
  const [actioningInterestId, setActioningInterestId] = useState<string | null>(null);

  // Active chat state
  const [activeChat, setActiveChat] = useState<{ id: string; title: string } | null>(null);

  // Fetch Owner listings
  const fetchListings = async () => {
    setLoadingListings(true);
    try {
      const data = await api.get(`/listings?ownerId=${user?.id}`);
      setListings(data);
    } catch (err) {
      console.error('Error fetching listings:', err);
    } finally {
      setLoadingListings(false);
    }
  };

  // Fetch Received interests
  const fetchInterests = async () => {
    setLoadingInterests(true);
    try {
      const data = await api.get('/interests');
      setInterests(data);
    } catch (err) {
      console.error('Error fetching interests:', err);
    } finally {
      setLoadingInterests(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'listings') {
      fetchListings();
    } else if (activeTab === 'interests') {
      fetchInterests();
    }
  }, [activeTab]);

  // Handle Photo uploading -> converts to Base64
  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setUploadingImage(true);
    const uploadedPhotos: string[] = [];

    Array.from(files).forEach((file) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => {
        if (typeof reader.result === 'string') {
          uploadedPhotos.push(reader.result);
          // Wait until all files are processed
          if (uploadedPhotos.length === files.length) {
            setPhotos((prev) => [...prev, ...uploadedPhotos]);
            setUploadingImage(false);
          }
        }
      };
      reader.onerror = () => {
        setUploadingImage(false);
        alert('Failed to read image file');
      };
    });
  };

  // Submit new listing
  const handleAddListing = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormSubmitting(true);

    try {
      await api.post('/listings', {
        location: streetAddress ? `${streetAddress}, ${location}` : location,
        rent: parseFloat(rent),
        availableFrom: new Date(availableFrom).toISOString(),
        roomType,
        furnishingStatus,
        description,
        photos,
      });

      setShowAddModal(false);
      resetForm();
      fetchListings();
    } catch (err: any) {
      alert(err || 'Failed to create listing');
    } finally {
      setFormSubmitting(false);
    }
  };

  // Open Edit listing modal
  const openEditModal = (listing: any) => {
    setCurrentListing(listing);
    
    const lastCommaIndex = listing.location.lastIndexOf(',');
    let dist = '';
    if (lastCommaIndex !== -1) {
      setStreetAddress(listing.location.substring(0, lastCommaIndex).trim());
      dist = listing.location.substring(lastCommaIndex + 1).trim();
    } else {
      setStreetAddress('');
      dist = listing.location;
    }
    setLocation(dist);
    setListingState(getStateFromDistrict(dist));
    
    setRent(listing.rent.toString());
    setAvailableFrom(listing.availableFrom.split('T')[0]);
    setRoomType(listing.roomType);
    setFurnishingStatus(listing.furnishingStatus);
    setDescription(listing.description);
    setPhotos(listing.photos || []);
    setShowEditModal(true);
  };

  // Submit listing update
  const handleEditListing = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentListing) return;
    setFormSubmitting(true);

    try {
      await api.put(`/listings/${currentListing.id}`, {
        location: streetAddress ? `${streetAddress}, ${location}` : location,
        rent: parseFloat(rent),
        availableFrom: new Date(availableFrom).toISOString(),
        roomType,
        furnishingStatus,
        description,
        photos,
      });

      setShowEditModal(false);
      resetForm();
      fetchListings();
    } catch (err: any) {
      alert(err || 'Failed to update listing');
    } finally {
      setFormSubmitting(false);
    }
  };

  // Delete listing
  const handleDeleteListing = async (id: string) => {
    if (!confirm('Are you sure you want to delete this listing permanently?')) return;

    try {
      await api.delete(`/listings/${id}`);
      fetchListings();
    } catch (err: any) {
      alert(err || 'Failed to delete listing.');
    }
  };

  // Toggle room filled status
  const handleToggleFilled = async (listing: any) => {
    const actionText = listing.isFilled 
      ? 'Marking this room as active will make it visible in searches again. Confirm?' 
      : 'Marking this room as filled will hide it from future searches. Confirm?';
      
    if (!confirm(actionText)) return;

    try {
      await api.patch(`/listings/${listing.id}/fill`);
      fetchListings();
    } catch (err: any) {
      alert(err || 'Failed to update status.');
    }
  };

  // Respond to matching interest (Accept / Decline)
  const handleRespondInterest = async (interestId: string, status: 'ACCEPTED' | 'DECLINED') => {
    setActioningInterestId(interestId);
    try {
      await api.patch(`/interests/${interestId}`, { status });
      alert(`Interest request ${status.toLowerCase()} successfully.`);
      fetchInterests();
    } catch (err: any) {
      alert(err || 'Failed to update interest status.');
    } finally {
      setActioningInterestId(null);
    }
  };

  const resetForm = () => {
    setCurrentListing(null);
    setStreetAddress('');
    setListingState('');
    setLocation('');
    setRent('');
    setAvailableFrom('');
    setRoomType('single');
    setFurnishingStatus('furnished');
    setDescription('');
    setPhotos([]);
    setCurrentListing(null);
  };

  const getScoreBadgeColor = (_score: number) => {
    return 'bg-blue-500/10 text-blue-500 border-blue-500/20';
  };

  return (
    <div className="h-screen overflow-hidden flex bg-gradient-to-br from-pink-300 via-pink-200 to-red-300 text-slate-900 relative">
      {/* Background gradients */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-brand-500/5 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-0 left-1/4 w-96 h-96 bg-blue-500/5 rounded-full blur-[120px] pointer-events-none" />

      {/* Sidebar navigation */}
      <aside className="w-64 border-r border-slate-200/60 bg-gradient-to-br from-slate-200 to-yellow-50/40 flex flex-col justify-between shrink-0">
        <div className="flex-1 overflow-y-auto">
          {/* Brand */}
          <div className="flex items-center gap-3 px-6 py-6 border-b border-slate-200">
            <div className="p-2 bg-brand-50 rounded-lg border border-brand-100 text-brand-600">
              <Home className="w-6 h-6" />
            </div>
            <div>
              <h1 className="font-bold text-sm leading-tight text-slate-900">Owner Portal</h1>
              <span className="text-[10px] text-brand-500 font-semibold tracking-wider uppercase">Lessor account</span>
            </div>
          </div>

          {/* Nav links */}
          <nav className="p-4 space-y-1">
            <button
              onClick={() => setActiveTab('listings')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all ${
                activeTab === 'listings'
                  ? 'bg-gray-200 border-l-4 border-black text-black'
                  : 'text-black hover:bg-gray-100'
              }`}
            >
              <Home className="w-5 h-5" />
              My Listings
              {listings.length > 0 && (
                <span className="ml-auto px-2 py-0.5 text-xs bg-slate-100 text-slate-600 rounded-full font-bold">
                  {listings.length}
                </span>
              )}
            </button>

            <button
              onClick={() => setActiveTab('interests')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all ${
                activeTab === 'interests'
                  ? 'bg-gray-200 border-l-4 border-black text-black'
                  : 'text-black hover:bg-gray-100'
              }`}
            >
              <Heart className="w-5 h-5" />
              Received Interests
              {interests.filter(i => i.status === 'PENDING').length > 0 && (
                <span className="ml-auto px-2 py-0.5 text-xs bg-brand-500 text-white rounded-full font-extrabold shadow-sm animate-pulse">
                  {interests.filter(i => i.status === 'PENDING').length}
                </span>
              )}
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
            onClick={() => { clearMessages(); logout(); }}
            className="w-full flex items-center justify-center gap-2 bg-red-50 hover:bg-red-100 text-red-600 rounded-xl py-2.5 text-xs font-bold transition-all border border-red-200"
          >
            <LogOut className="w-4 h-4" />
            Sign Out
          </button>
        </div>
      </aside>

      {/* Main viewport */}
      <main className="flex-1 flex flex-col min-w-0 overflow-y-auto">
        <header className="px-8 py-5 border-b border-slate-200/60 flex items-center justify-between bg-white/60 backdrop-blur-xl sticky top-0 z-10 shadow-sm">
          <div>
            <h2 className="text-xl font-extrabold text-slate-900">
              {activeTab === 'listings' ? 'Room Listings Management' : 'Received Interest Requests'}
            </h2>
            <p className="text-xs text-slate-500 mt-1">
              {activeTab === 'listings' ? 'Publish and manage room advertisements' : 'Approve tenants based on matching insights'}
            </p>
          </div>
          {activeTab === 'listings' && (
            <button
              onClick={() => { resetForm(); setShowAddModal(true); }}
              className="bg-brand-600 hover:bg-brand-500 active:bg-brand-700 text-white rounded-xl py-2 px-4 font-semibold text-xs transition-all shadow-md shadow-brand-500/10 flex items-center gap-1.5 hover:scale-105 active:scale-95"
            >
              <Plus className="w-4.5 h-4.5" />
              Post a Room
            </button>
          )}
        </header>

        <div className="flex-1 p-8">
          {activeTab === 'listings' && (
            <div className="space-y-6">
              {loadingListings ? (
                <div className="flex flex-col items-center justify-center py-16 gap-3 text-slate-400">
                  <Loader className="w-8 h-8 animate-spin text-brand-500" />
                  <p className="text-sm font-semibold">Retrieving your listings...</p>
                </div>
              ) : listings.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 text-slate-500 glass-card rounded-2xl p-8">
                  <Home className="w-12 h-12 opacity-30 mb-2" />
                  <p className="text-sm font-semibold">No room listings posted yet</p>
                  <p className="text-xs text-slate-600 mt-1">
                    Click the "Post a Room" button in the header to write your first listing.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {listings.map((item) => (
                    <div
                      key={item.id}
                      className={`glass-card rounded-2xl overflow-hidden shadow-lg flex flex-col group relative ${
                        item.isFilled ? 'opacity-60 border-slate-900 bg-slate-950/20' : ''
                      }`}
                    >
                      {/* Filled Stamp */}
                      {item.isFilled && (
                        <div className="absolute top-4 left-4 bg-slate-950/80 border border-slate-800/80 text-slate-400 text-[10px] font-extrabold tracking-wider uppercase px-2.5 py-1.5 rounded-xl backdrop-blur-md z-10 flex items-center gap-1">
                          <Lock className="w-3.5 h-3.5" />
                          FILLED (Hidden)
                        </div>
                      )}

                      {/* Image Preview */}
                      <div className="h-44 bg-slate-900 relative flex items-center justify-center border-b border-slate-900 overflow-hidden shrink-0">
                        {item.photos && item.photos.length > 0 ? (
                          <img
                            src={item.photos[0]}
                            alt="Room preview"
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          />
                        ) : (
                          <Home className="w-10 h-10 text-slate-700" />
                        )}
                        <div className="absolute bottom-4 right-4 bg-slate-950/70 backdrop-blur-md px-2 py-1 rounded-lg text-xs font-bold text-brand-400 uppercase tracking-wide">
                          {item.roomType}
                        </div>
                      </div>

                      {/* Details */}
                      <div className="p-5 flex-1 flex flex-col justify-between">
                        <div className="space-y-2">
                          <div className="flex justify-between items-start">
                            <h3 className="font-extrabold text-black truncate text-base">{item.location}</h3>
                            <span className="text-brand-600 font-extrabold text-base">₹{item.rent}/mo</span>
                          </div>
                          <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed">
                            {item.description}
                          </p>
                        </div>

                        {/* Controls */}
                        <div className="border-t border-slate-900 pt-4 mt-4 flex items-center justify-between">
                          <div className="flex items-center gap-1 text-[10px] text-slate-500 uppercase font-bold tracking-wider">
                            <Calendar className="w-3.5 h-3.5" />
                            {new Date(item.availableFrom).toLocaleDateString([], { month: 'short', year: 'numeric' })}
                          </div>

                          <div className="flex gap-2">
                            <button
                              onClick={() => handleToggleFilled(item)}
                              className="bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-slate-200 border border-slate-850 p-2 rounded-xl text-xs font-bold transition-all"
                              title={item.isFilled ? "Mark as active" : "Mark as filled"}
                            >
                              {item.isFilled ? "Mark Active" : "Mark Filled"}
                            </button>
                            <button
                              onClick={() => openEditModal(item)}
                              className="bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-850 p-2 rounded-xl text-xs font-bold transition-all"
                              title="Edit listing"
                            >
                              Edit
                            </button>
                            <button
                              onClick={() => handleDeleteListing(item.id)}
                              className="bg-slate-950 hover:bg-red-950/30 text-slate-500 hover:text-red-400 border border-slate-900 p-2 rounded-xl text-xs font-bold transition-all hover:border-red-900/30"
                              title="Delete listing"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Interests Tab */}
          {activeTab === 'interests' && (
            <div className="space-y-6">
              {loadingInterests ? (
                <div className="flex flex-col items-center justify-center py-16 gap-3 text-slate-400">
                  <Loader className="w-8 h-8 animate-spin text-brand-500" />
                  <p className="text-sm font-semibold">Retrieving matches...</p>
                </div>
              ) : interests.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 text-slate-500 glass-card rounded-2xl p-8">
                  <Heart className="w-12 h-12 opacity-30 mb-2" />
                  <p className="text-sm font-semibold">No interest requests received</p>
                  <p className="text-xs text-slate-600 mt-1 max-w-sm text-center">
                    When potential tenants browse and matches are found, requests will appear here.
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {interests.map((item) => (
                    <div
                      key={item.id}
                      className="glass-card p-6 rounded-2xl flex flex-col space-y-4 border border-slate-800/80 hover:border-slate-850 transition-all duration-300"
                    >
                      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                        {/* Tenant profile block */}
                        <div>
                          <div className="flex items-center gap-3">
                            <h4 className="font-bold text-black text-base">{item.tenant.name}</h4>
                            <span className={`px-2 py-0.5 rounded-lg border text-xs font-bold flex items-center gap-1 ${
                              item.status === 'ACCEPTED' ? 'bg-red-600 border-red-700 text-white' :
                              item.status === 'DECLINED' ? 'bg-red-100 border-red-300 text-red-700' :
                              'bg-gray-200 border-gray-300 text-gray-700'
                            }`}>
                              {item.status}
                            </span>
                          </div>
                          <p className="text-xs text-black mt-1">
                            Listing: {item.listing.location} | Rent: ₹{item.listing.rent}/mo
                          </p>
                          <p className="text-xs text-black mt-0.5">
                            Preferred budget: ₹{item.tenant.tenantProfile?.budgetMin}-₹{item.tenant.tenantProfile?.budgetMax} | Move date:{' '}
                            {item.tenant.tenantProfile?.moveInDate ? new Date(item.tenant.tenantProfile.moveInDate).toLocaleDateString() : 'N/A'}
                          </p>
                        </div>

                        {/* Compatibility Score */}
                        {item.compatibility && (
                          <div className={`flex flex-col items-center justify-center p-3 rounded-2xl border text-center shrink-0 min-w-[120px] ${getScoreBadgeColor(item.compatibility.score)}`}>
                            <div className="flex items-center gap-1 text-[10px] uppercase font-bold tracking-wider opacity-70">
                              <Sparkles className="w-3 h-3 animate-pulse" />
                              AI Match
                            </div>
                            <span className="text-2xl font-black mt-0.5">{item.compatibility.score}%</span>
                          </div>
                        )}
                      </div>

                      {/* Lifestyle notes & AI Match Reason */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-gray-100 p-4 rounded-xl border border-gray-200">
                        <div>
                          <span className="text-[10px] font-extrabold text-black uppercase tracking-wider block mb-1">Tenant Lifestyle Notes</span>
                          <p className="text-xs text-black leading-relaxed italic">
                            "{item.tenant.tenantProfile?.lifestyleNotes || 'No lifestyle notes provided.'}"
                          </p>
                        </div>
                        {item.compatibility && (
                          <div>
                            <span className="text-[10px] font-extrabold text-black uppercase tracking-wider block mb-1">AI Match Explanation</span>
                            <p className="text-xs text-black leading-relaxed italic">
                              "{item.compatibility.explanation.replaceAll('$', '₹')}"
                            </p>
                          </div>
                        )}
                      </div>

                      {/* Action buttons */}
                      <div className="flex items-center justify-end gap-2 border-t border-slate-900/60 pt-4">
                        {item.status === 'PENDING' ? (
                          <>
                            <button
                              onClick={() => handleRespondInterest(item.id, 'DECLINED')}
                              disabled={actioningInterestId !== null}
                              className="bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-slate-200 border border-slate-850 rounded-xl py-2 px-4 text-xs font-bold transition-all disabled:opacity-50"
                            >
                              Decline Match
                            </button>
                            <button
                              onClick={() => handleRespondInterest(item.id, 'ACCEPTED')}
                              disabled={actioningInterestId !== null}
                              className="bg-brand-600 hover:bg-brand-500 active:bg-brand-700 text-white rounded-xl py-2 px-4 text-xs font-bold transition-all shadow-md shadow-brand-500/10 hover:scale-105 active:scale-95 disabled:opacity-50"
                            >
                              Accept Interest
                            </button>
                          </>
                        ) : item.status === 'ACCEPTED' ? (
                          <button
                            onClick={() => setActiveChat({
                              id: item.id,
                              title: `Chat with ${item.tenant.name}`
                            })}
                            className="bg-brand-600 hover:bg-brand-500 active:bg-brand-700 text-white rounded-xl py-2 px-4 text-xs font-bold transition-all shadow-md shadow-brand-500/10 flex items-center gap-1.5 hover:scale-105 active:scale-95"
                          >
                            <MessageSquare className="w-4.5 h-4.5" />
                            Open Chat
                          </button>
                        ) : (
                          <span className="text-xs text-slate-500 font-semibold italic">Match declined</span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </main>

      {/* Post/Add Room Listing Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="glass w-full max-w-lg rounded-2xl overflow-hidden shadow-2xl relative max-h-[90vh] flex flex-col">
            <div className="px-6 py-4 border-b border-slate-900 bg-slate-950/80 flex items-center justify-between">
              <h3 className="font-extrabold text-slate-100 text-base">Post a New Room</h3>
              <button
                onClick={() => setShowAddModal(false)}
                className="p-1 hover:bg-slate-800 rounded text-slate-400 hover:text-slate-200 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddListing} className="flex-1 overflow-y-auto p-6 space-y-5">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">Street Address / No</label>
                  <input
                    type="text"
                    value={streetAddress}
                    onChange={(e) => setStreetAddress(e.target.value)}
                    placeholder="e.g. 123 Main St, Apartment 4B"
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl py-2.5 px-4 text-slate-100 placeholder-slate-600 focus:outline-none focus:border-brand-500 text-sm mb-4"
                  />
                </div>

                <div className="col-span-1">
                  <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">State</label>
                  <select
                    value={listingState}
                    onChange={(e) => {
                      setListingState(e.target.value);
                      setLocation('');
                    }}
                    required
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl py-2.5 px-4 text-sm focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500/20 text-slate-100 appearance-none"
                  >
                    <option value="" disabled>Select a state</option>
                    {Object.keys(INDIAN_LOCATIONS).map(state => (
                      <option key={state} value={state}>{state}</option>
                    ))}
                  </select>
                </div>
                
                <div className="col-span-1">
                  <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">City / District</label>
                  <select
                    required
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    disabled={!listingState}
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl py-2.5 px-4 text-sm focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500/20 text-slate-100 appearance-none disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <option value="" disabled>Select a city</option>
                    {listingState && INDIAN_LOCATIONS[listingState]?.map(city => (
                      <option key={city} value={city}>{city}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">Monthly Rent (₹)</label>
                  <input
                    type="number"
                    required
                    value={rent}
                    onChange={(e) => setRent(e.target.value)}
                    placeholder="e.g. 1000"
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl py-2.5 px-4 text-slate-100 placeholder-slate-600 focus:outline-none focus:border-brand-500 text-sm"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">Available From</label>
                  <input
                    type="date"
                    required
                    value={availableFrom}
                    onChange={(e) => setAvailableFrom(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl py-2.5 px-4 text-slate-100 placeholder-slate-600 focus:outline-none focus:border-brand-500 text-sm"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">Room Type</label>
                  <select
                    value={roomType}
                    onChange={(e) => setRoomType(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl py-2.5 px-3 text-sm focus:outline-none focus:border-brand-500 text-slate-100"
                  >
                    <option value="single">Single Room</option>
                    <option value="shared">Shared Room</option>
                    <option value="studio">Entire Studio</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">Furnishing Status</label>
                  <select
                    value={furnishingStatus}
                    onChange={(e) => setFurnishingStatus(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl py-2.5 px-3 text-sm focus:outline-none focus:border-brand-500 text-slate-100"
                  >
                    <option value="furnished">Furnished</option>
                    <option value="semi-furnished">Semi-Furnished</option>
                    <option value="unfurnished">Unfurnished</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">Listing Description</label>
                <textarea
                  rows={4}
                  required
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Detail the roommates, utility bill policies, lease durations, neighborhood vibes, and transit options. High details yield superior AI matches!"
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl py-2.5 px-4 text-slate-100 placeholder-slate-600 focus:outline-none focus:border-brand-500 text-sm leading-relaxed"
                />
              </div>

              {/* Photo Upload with base64 conversion */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">Room Photos</label>
                <div className="flex gap-4 items-center">
                  <label className="flex flex-col items-center justify-center border-2 border-dashed border-slate-800 hover:border-brand-500 bg-slate-900/50 p-4 rounded-xl cursor-pointer w-24 h-24 shrink-0 transition-colors">
                    <Camera className="w-6 h-6 text-slate-500" />
                    <span className="text-[9px] text-slate-500 font-bold mt-1 text-center">Add Photo</span>
                    <input
                      type="file"
                      multiple
                      accept="image/*"
                      onChange={handlePhotoUpload}
                      className="hidden"
                    />
                  </label>

                  {/* Previews */}
                  <div className="flex gap-2 overflow-x-auto py-2">
                    {uploadingImage && (
                      <div className="w-20 h-20 rounded-xl bg-slate-900 flex items-center justify-center shrink-0 border border-slate-800">
                        <Loader className="w-5 h-5 animate-spin text-brand-500" />
                      </div>
                    )}
                    {photos.map((photo, index) => (
                      <div key={index} className="w-20 h-20 rounded-xl overflow-hidden shrink-0 border border-slate-800 relative group/photo">
                        <img src={photo} alt="Upload preview" className="w-full h-full object-cover" />
                        <button
                          type="button"
                          onClick={() => setPhotos((prev) => prev.filter((_, i) => i !== index))}
                          className="absolute inset-0 bg-red-950/60 flex items-center justify-center opacity-0 group-hover/photo:opacity-100 transition-opacity"
                        >
                          <Trash2 className="w-4 h-4 text-red-400" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="border-t border-slate-900 pt-4 flex gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="w-1/3 bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800 rounded-xl py-3 text-xs font-bold transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={formSubmitting || uploadingImage}
                  className="w-2/3 bg-brand-600 hover:bg-brand-500 active:bg-brand-700 text-white rounded-xl py-3 text-xs font-bold shadow-lg shadow-brand-500/10 flex items-center justify-center gap-1.5 disabled:opacity-50"
                >
                  {formSubmitting ? (
                    <>
                      <Loader className="w-4.5 h-4.5 animate-spin" />
                      Publishing...
                    </>
                  ) : (
                    'Publish Listing'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Room Listing Modal */}
      {showEditModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="glass w-full max-w-lg rounded-2xl overflow-hidden shadow-2xl relative max-h-[90vh] flex flex-col">
            <div className="px-6 py-4 border-b border-slate-900 bg-slate-950/80 flex items-center justify-between">
              <h3 className="font-extrabold text-slate-100 text-base">Edit Room Listing</h3>
              <button
                onClick={() => setShowEditModal(false)}
                className="p-1 hover:bg-slate-800 rounded text-slate-400 hover:text-slate-200 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleEditListing} className="flex-1 overflow-y-auto p-6 space-y-5">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">Street Address / No</label>
                  <input
                    type="text"
                    value={streetAddress}
                    onChange={(e) => setStreetAddress(e.target.value)}
                    placeholder="e.g. 123 Main St, Apartment 4B"
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl py-2.5 px-4 text-slate-100 placeholder-slate-600 focus:outline-none focus:border-brand-500 text-sm mb-4"
                  />
                </div>

                <div className="col-span-1">
                  <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">State</label>
                  <select
                    value={listingState}
                    onChange={(e) => {
                      setListingState(e.target.value);
                      setLocation('');
                    }}
                    required
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl py-2.5 px-4 text-sm focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500/20 text-slate-100 appearance-none"
                  >
                    <option value="" disabled>Select a state</option>
                    {Object.keys(INDIAN_LOCATIONS).map(state => (
                      <option key={state} value={state}>{state}</option>
                    ))}
                  </select>
                </div>
                
                <div className="col-span-1">
                  <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">City / District</label>
                  <select
                    required
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    disabled={!listingState}
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl py-2.5 px-4 text-sm focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500/20 text-slate-100 appearance-none disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <option value="" disabled>Select a city</option>
                    {listingState && INDIAN_LOCATIONS[listingState]?.map(city => (
                      <option key={city} value={city}>{city}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">Monthly Rent (₹)</label>
                  <input
                    type="number"
                    required
                    value={rent}
                    onChange={(e) => setRent(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl py-2.5 px-4 text-slate-100 placeholder-slate-650 focus:outline-none focus:border-brand-500 text-sm"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">Available From</label>
                  <input
                    type="date"
                    required
                    value={availableFrom}
                    onChange={(e) => setAvailableFrom(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl py-2.5 px-4 text-slate-100 placeholder-slate-650 focus:outline-none focus:border-brand-500 text-sm"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">Room Type</label>
                  <select
                    value={roomType}
                    onChange={(e) => setRoomType(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl py-2.5 px-3 text-sm focus:outline-none focus:border-brand-500 text-slate-100"
                  >
                    <option value="single">Single Room</option>
                    <option value="shared">Shared Room</option>
                    <option value="studio">Entire Studio</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">Furnishing Status</label>
                  <select
                    value={furnishingStatus}
                    onChange={(e) => setFurnishingStatus(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl py-2.5 px-3 text-sm focus:outline-none focus:border-brand-500 text-slate-100"
                  >
                    <option value="furnished">Furnished</option>
                    <option value="semi-furnished">Semi-Furnished</option>
                    <option value="unfurnished">Unfurnished</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">Listing Description</label>
                <textarea
                  rows={4}
                  required
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl py-2.5 px-4 text-slate-100 placeholder-slate-650 focus:outline-none focus:border-brand-500 text-sm leading-relaxed"
                />
              </div>

              {/* Edit Photo Upload */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">Room Photos</label>
                <div className="flex gap-4 items-center">
                  <label className="flex flex-col items-center justify-center border-2 border-dashed border-slate-800 hover:border-brand-500 bg-slate-900/50 p-4 rounded-xl cursor-pointer w-24 h-24 shrink-0 transition-colors">
                    <Camera className="w-6 h-6 text-slate-500" />
                    <span className="text-[9px] text-slate-500 font-bold mt-1 text-center">Add Photo</span>
                    <input
                      type="file"
                      multiple
                      accept="image/*"
                      onChange={handlePhotoUpload}
                      className="hidden"
                    />
                  </label>

                  {/* Previews */}
                  <div className="flex gap-2 overflow-x-auto py-2">
                    {uploadingImage && (
                      <div className="w-20 h-20 rounded-xl bg-slate-900 flex items-center justify-center shrink-0 border border-slate-800">
                        <Loader className="w-5 h-5 animate-spin text-brand-500" />
                      </div>
                    )}
                    {photos.map((photo, index) => (
                      <div key={index} className="w-20 h-20 rounded-xl overflow-hidden shrink-0 border border-slate-800 relative group/photo">
                        <img src={photo} alt="Upload preview" className="w-full h-full object-cover" />
                        <button
                          type="button"
                          onClick={() => setPhotos((prev) => prev.filter((_, i) => i !== index))}
                          className="absolute inset-0 bg-red-950/60 flex items-center justify-center opacity-0 group-hover/photo:opacity-100 transition-opacity"
                        >
                          <Trash2 className="w-4 h-4 text-red-400" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="border-t border-slate-900 pt-4 flex gap-2">
                <button
                  type="button"
                  onClick={() => setShowEditModal(false)}
                  className="w-1/3 bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800 rounded-xl py-3 text-xs font-bold transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={formSubmitting || uploadingImage}
                  className="w-2/3 bg-brand-600 hover:bg-brand-500 active:bg-brand-700 text-white rounded-xl py-3 text-xs font-bold shadow-lg shadow-brand-500/10 flex items-center justify-center gap-1.5 disabled:opacity-50"
                >
                  {formSubmitting ? (
                    <>
                      <Loader className="w-4.5 h-4.5 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    'Save Changes'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Floating Chat Box Overlay */}
      {activeChat && (
        <div className="fixed bottom-6 right-6 w-96 h-[500px] z-50 shadow-2xl">
          <ChatWindow
            interestRequestId={activeChat.id}
            roomTitle={activeChat.title}
            onClose={() => setActiveChat(null)}
          />
        </div>
      )}
    </div>
  );
};
export default OwnerDashboard;

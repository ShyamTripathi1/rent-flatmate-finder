import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import api from '../services/api';
import { ChatWindow } from '../components/ChatWindow';
import { INDIAN_LOCATIONS, INDIAN_CITIES } from '../utils/locations';
import {
  Compass,
  User,
  Heart,
  Search,
  Filter,
  IndianRupee,
  MapPin,
  Calendar,
  Sparkles,
  MessageSquare,
  LogOut,
  ChevronRight,
  TrendingUp,
  Settings,
  AlertCircle,
  CheckCircle2,
  XCircle,
  FileText,
  Loader,
  Star,
  CreditCard,
  ShieldCheck,
  BadgeCheck,
  Clock
} from 'lucide-react';

export const TenantDashboard: React.FC = () => {
  const { user, profile, updateProfile, logout } = useAuth();
  const { clearMessages } = useSocket();

  const [activeTab, setActiveTab] = useState<'browse' | 'profile' | 'interests' | 'payments'>('browse');

  // Search & Filters state
  const [searchState, setSearchState] = useState('');
  const [searchLocation, setSearchLocation] = useState('');
  const [minRent, setMinRent] = useState('');
  const [maxRent, setMaxRent] = useState('');
  const [roomType, setRoomType] = useState('');
  const [furnishing, setFurnishing] = useState('');
  const [sortBy, setSortBy] = useState('compatibility');

  const [listings, setListings] = useState<any[]>([]);
  const [isLoadingListings, setIsLoadingListings] = useState(false);
  const [selectedListing, setSelectedListing] = useState<any | null>(null);
  const [submittingInterest, setSubmittingInterest] = useState(false);

  // Profile Form state
  const [prefState, setPrefState] = useState('');
  const [prefLocation, setPrefLocation] = useState(profile?.preferredLocation || '');
  const [budMin, setBudMin] = useState(profile?.budgetMin.toString() || '0');
  const [budMax, setBudMax] = useState(profile?.budgetMax.toString() || '3000');
  const [moveDate, setMoveDate] = useState(profile?.moveInDate ? profile.moveInDate.split('T')[0] : '');
  const [notes, setNotes] = useState(profile?.lifestyleNotes || '');
  const [profileSaving, setProfileSaving] = useState(false);
  const [profileSuccess, setProfileSuccess] = useState(false);

  // Interests state
  const [interests, setInterests] = useState<any[]>([]);
  const [loadingInterests, setLoadingInterests] = useState(false);

  // Active chat state
  const [activeChat, setActiveChat] = useState<{ id: string; title: string } | null>(null);

  // Review state
  const [reviewData, setReviewData] = useState<{ reviews: any[]; avgRating: number; totalReviews: number } | null>(null);
  const [loadingReviews, setLoadingReviews] = useState(false);
  const [reviewRating, setReviewRating] = useState(0);
  const [reviewHover, setReviewHover] = useState(0);
  const [reviewComment, setReviewComment] = useState('');
  const [submittingReview, setSubmittingReview] = useState(false);
  const [reviewSuccess, setReviewSuccess] = useState(false);

  // Payment prototype state
  const [paymentModal, setPaymentModal] = useState<{ interest: any } | null>(null);
  const [paymentStep, setPaymentStep] = useState<'form' | 'processing' | 'success'>('form');
  const [paymentMethod, setPaymentMethod] = useState<'upi' | 'card' | 'netbanking'>('upi');
  const [upiId, setUpiId] = useState('');
  const [cardNumber, setCardNumber] = useState('');
  const [cardExpiry, setCardExpiry] = useState('');
  const [cardCvv, setCardCvv] = useState('');
  const [cardName, setCardName] = useState('');
  const [myPayments, setMyPayments] = useState<any[]>([]);

  // Load payments from localStorage on mount
  const PAYMENT_KEY = `rff_all_payments`;
  const loadPayments = () => {
    try {
      const stored = localStorage.getItem(PAYMENT_KEY);
      if (stored) {
        const allPayments = JSON.parse(stored);
        setMyPayments(allPayments.filter((p: any) => p.tenantId === user?.id));
      }
    } catch {}
  };

  // Load browse listings
  const fetchListings = async () => {
    setIsLoadingListings(true);
    try {
      const query = new URLSearchParams();
      if (searchLocation) query.append('location', searchLocation);
      if (minRent) query.append('budgetMin', minRent);
      if (maxRent) query.append('budgetMax', maxRent);
      if (roomType) query.append('roomType', roomType);
      if (furnishing) query.append('furnishing', furnishing);
      query.append('sort', sortBy);

      const data = await api.get(`/listings/browse?${query.toString()}`);
      setListings(data);
    } catch (err) {
      console.error('Failed to fetch listings:', err);
    } finally {
      setIsLoadingListings(false);
    }
  };

  const fetchReviews = async (listingId: string) => {
    setLoadingReviews(true);
    setReviewData(null);
    try {
      const data = await api.get(`/listings/${listingId}/reviews`);
      setReviewData(data);
    } catch (err) {
      console.error('Failed to load reviews:', err);
    } finally {
      setLoadingReviews(false);
    }
  };

  const handleSubmitReview = async (listingId: string) => {
    if (reviewRating === 0) {
      alert('Please select a star rating before submitting.');
      return;
    }
    setSubmittingReview(true);
    setReviewSuccess(false);
    try {
      await api.post(`/listings/${listingId}/reviews`, { rating: reviewRating, comment: reviewComment });
      setReviewSuccess(true);
      setReviewComment('');
      fetchReviews(listingId);
      fetchListings(); // refresh card avg ratings
      setTimeout(() => setReviewSuccess(false), 3000);
    } catch (err: any) {
      alert(err || 'Failed to submit review.');
    } finally {
      setSubmittingReview(false);
    }
  };

  // Load interests list
  const fetchInterests = async () => {
    setLoadingInterests(true);
    try {
      const data = await api.get('/interests');
      setInterests(data);
    } catch (err) {
      console.error('Failed to load interests:', err);
    } finally {
      setLoadingInterests(false);
    }
  };

  // Effect to load initial tab data and respond to filter changes
  useEffect(() => {
    if (activeTab === 'browse') {
      const timer = setTimeout(() => {
        fetchListings();
      }, 500); // Debounce filter changes
      return () => clearTimeout(timer);
    } else if (activeTab === 'interests') {
      fetchInterests();
    } else if (activeTab === 'payments') {
      loadPayments();
    }
  }, [activeTab, sortBy, searchLocation, minRent, maxRent, roomType, furnishing]);

  // Sync profile edits when profile changes in auth context
  useEffect(() => {
    if (profile) {
      setPrefLocation(profile.preferredLocation);
      setBudMin(profile.budgetMin.toString());
      setBudMax(profile.budgetMax.toString());
      if (profile.moveInDate) {
        setMoveDate(profile.moveInDate.split('T')[0]);
      }
      setNotes(profile.lifestyleNotes || '');
    }
  }, [profile]);

  // Save profile
  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setProfileSaving(true);
    setProfileSuccess(false);

    try {
      await updateProfile({
        preferredLocation: prefLocation,
        budgetMin: parseFloat(budMin),
        budgetMax: parseFloat(budMax),
        moveInDate: new Date(moveDate).toISOString(),
        lifestyleNotes: notes,
      });
      setProfileSuccess(true);
      setTimeout(() => setProfileSuccess(false), 3000);
    } catch (err) {
      alert('Failed to update profile. Please try again.');
    } finally {
      setProfileSaving(false);
    }
  };

  // Express interest
  const handleExpressInterest = async (listingId: string) => {
    if (!profile || !profile.preferredLocation) {
      alert('Please fill out your tenant profile location and budget before expressing interest!');
      setActiveTab('profile');
      setSelectedListing(null);
      return;
    }

    setSubmittingInterest(true);
    try {
      const result = await api.post('/interests', { listingId });
      alert(`Interest expressed! Your compatibility score is: ${result.compatibility.score}%.`);
      
      // Update selected listing with calculated compatibility and disable button
      setSelectedListing((prev: any) => ({
        ...prev,
        interestSent: true,
        interestStatus: 'PENDING'
      }));

      // Refresh listings and interests
      fetchListings();
      fetchInterests();
    } catch (err: any) {
      alert(err || 'Failed to send interest request.');
    } finally {
      setSubmittingInterest(false);
    }
  };

  // Handle payment submission (prototype — stores in localStorage)
  const handlePayRent = () => {
    if (!paymentModal) return;
    setPaymentStep('processing');
    setTimeout(() => {
      const payment = {
        id: `pay_${Date.now()}`,
        interestId: paymentModal.interest.id,
        listingId: paymentModal.interest.listingId,
        location: paymentModal.interest.listing.location,
        ownerName: paymentModal.interest.listing.owner.name,
        ownerEmail: paymentModal.interest.listing.owner.email,
        ownerId: paymentModal.interest.listing.ownerId ?? paymentModal.interest.listing.owner?.id,
        tenantId: user?.id,
        tenantName: user?.name,
        tenantEmail: user?.email,
        amount: paymentModal.interest.listing.rent,
        method: paymentMethod,
        status: 'PAID',
        paidAt: new Date().toISOString(),
        txnRef: `TXN${Math.random().toString(36).substring(2, 10).toUpperCase()}`,
      };
      
      let allPayments: any[] = [];
      try {
        const stored = localStorage.getItem(PAYMENT_KEY);
        if (stored) allPayments = JSON.parse(stored);
      } catch {}
      
      allPayments.push(payment);
      localStorage.setItem(PAYMENT_KEY, JSON.stringify(allPayments));
      setMyPayments(allPayments.filter(p => p.tenantId === user?.id));
      setPaymentStep('success');
    }, 2000);
  };

  const openPaymentModal = (interest: any) => {
    setPaymentModal({ interest });
    setPaymentStep('form');
    setUpiId('');
    setCardNumber('');
    setCardExpiry('');
    setCardCvv('');
    setCardName('');
    setPaymentMethod('upi');
  };

  const hasAlreadyPaid = (interestId: string) =>
    myPayments.some((p) => p.interestId === interestId && p.status === 'PAID');

  const getPaymentForInterest = (interestId: string) =>
    myPayments.find((p) => p.interestId === interestId && p.status === 'PAID');

  // Check if tenant has sent interest in a listing
  const getInterestForListing = (listingId: string) => {
    return interests.find((i) => i.listingId === listingId);
  };

  const getScoreBadgeColor = (_score: number) => {
    return 'bg-blue-500/10 text-blue-500 border-blue-500/20';
  };

  return (
    <div className="h-screen overflow-hidden flex bg-gradient-to-br from-pink-300 via-pink-200 to-red-300 text-slate-900 relative">
      {/* Background gradients (made subtle for light mode) */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-brand-500/5 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-0 left-1/4 w-96 h-96 bg-blue-500/5 rounded-full blur-[120px] pointer-events-none" />

      {/* Sidebar Navigation */}
      <aside className="w-64 border-r border-slate-200/60 bg-gradient-to-br from-slate-200 to-yellow-50/40 flex flex-col justify-between shrink-0">
        <div className="flex-1 overflow-y-auto">
          {/* Brand */}
          <div className="flex items-center gap-3 px-6 py-6 border-b border-slate-200">
            <div className="p-2 bg-brand-50 rounded-lg border border-brand-100 text-brand-600">
              <Compass className="w-6 h-6" />
            </div>
            <div>
              <h1 className="font-bold text-sm leading-tight text-slate-900">Finder Portal</h1>
              <span className="text-[10px] text-brand-500 font-semibold tracking-wider uppercase">Tenant account</span>
            </div>
          </div>

          {/* Navigation links */}
          <nav className="p-4 space-y-1">
            <button
              onClick={() => { setActiveTab('browse'); setSelectedListing(null); }}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all ${
                activeTab === 'browse'
                  ? 'bg-gray-200 border-l-4 border-black text-black'
                  : 'text-black hover:bg-gray-100'
              }`}
            >
              <Compass className="w-5 h-5" />
              Browse Rooms
            </button>

            <button
              onClick={() => { setActiveTab('interests'); setSelectedListing(null); }}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all ${
                activeTab === 'interests'
                  ? 'bg-gray-200 border-l-4 border-black text-black'
                  : 'text-black hover:bg-gray-100'
              }`}
            >
              <Heart className="w-5 h-5" />
              My Interests
              {interests.length > 0 && (
                <span className="ml-auto px-2 py-0.5 text-xs bg-slate-100 text-slate-600 rounded-full font-bold">
                  {interests.length}
                </span>
              )}
            </button>

            <button
              onClick={() => { setActiveTab('profile'); setSelectedListing(null); }}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all ${
                activeTab === 'profile'
                  ? 'bg-gray-200 border-l-4 border-black text-black'
                  : 'text-black hover:bg-gray-100'
              }`}
            >
              <User className="w-5 h-5" />
              My Profile
            </button>

            <button
              onClick={() => { setActiveTab('payments'); setSelectedListing(null); }}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all ${
                activeTab === 'payments'
                  ? 'bg-brand-100 border-l-4 border-brand-500 text-brand-700'
                  : 'text-black hover:bg-gray-100'
              }`}
            >
              <CreditCard className="w-5 h-5" />
              My Payments
            </button>
          </nav>
        </div>

        {/* Footer info / Logout */}
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

      {/* Main Content Pane */}
      <main className="flex-1 flex flex-col min-w-0 overflow-y-auto">
        {/* Top Header */}
        <header className="px-8 py-5 border-b border-slate-200/60 flex items-center justify-between bg-white/60 backdrop-blur-xl sticky top-0 z-10 shadow-sm">
          <div>
            <h2 className="text-xl font-extrabold text-slate-900">
              {activeTab === 'browse' && 'Explore Rooms'}
              {activeTab === 'interests' && 'My Match Interests'}
              {activeTab === 'profile' && 'Compatibility Settings'}
              {activeTab === 'payments' && 'Rent Payments'}
            </h2>
            <p className="text-xs text-slate-400 mt-1">
              {activeTab === 'browse' && 'Listings sorted by your flatmate compatibility score'}
              {activeTab === 'interests' && 'Review your active room matches and chat rooms'}
              {activeTab === 'profile' && 'Fine-tune preferences to improve matching results'}
              {activeTab === 'payments' && 'Manage and view your rent payment history'}
            </p>
          </div>
        </header>

        {/* Tab Switchboard */}
        <div className="flex-1 p-8">
          {activeTab === 'browse' && (
            <div className="space-y-6">
              {/* Filter controls */}
              <div className="bg-white/80 backdrop-blur-md border border-slate-200/60 p-6 rounded-2xl space-y-4 shadow-sm">
                <div className="flex items-center gap-2 text-sm font-semibold text-slate-700">
                  <Filter className="w-4 h-4 text-brand-500" />
                  Search & Filter listings
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  {/* Location search */}
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-[10px] font-bold text-red-500 uppercase tracking-wider mb-1.5">State</label>
                      <div className="relative">
                        <select
                          value={searchState}
                          onChange={(e) => {
                            setSearchState(e.target.value);
                            setSearchLocation('');
                          }}
                          className="w-full bg-white border border-slate-300 rounded-xl py-2 px-3 text-xs focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500/20 text-slate-800 appearance-none"
                        >
                          <option value="">Any State</option>
                          {Object.keys(INDIAN_LOCATIONS).map(state => (
                            <option key={state} value={state}>{state}</option>
                          ))}
                        </select>
                      </div>
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-red-500 uppercase tracking-wider mb-1.5">District</label>
                      <div className="relative">
                        <select
                          value={searchLocation}
                          onChange={(e) => setSearchLocation(e.target.value)}
                          disabled={!searchState}
                          className="w-full bg-white border border-slate-300 rounded-xl py-2 px-3 text-xs focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500/20 text-slate-800 appearance-none disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          <option value="">Any District</option>
                          {searchState && INDIAN_LOCATIONS[searchState]?.map(city => (
                            <option key={city} value={city}>{city}</option>
                          ))}
                        </select>
                      </div>
                    </div>
                  </div>

                  {/* Rent range */}
                  <div>
                    <label className="block text-[10px] font-bold text-red-500 uppercase tracking-wider mb-1.5">Max Rent (₹)</label>
                    <div className="relative">
                      <IndianRupee className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                      <input
                        type="number"
                        value={maxRent}
                        onChange={(e) => setMaxRent(e.target.value)}
                        placeholder="e.g. 1500"
                        className="w-full bg-white border border-slate-300 rounded-xl py-2 pl-9 pr-3 text-xs placeholder-slate-400 focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500/20 text-slate-800"
                      />
                    </div>
                  </div>

                  {/* Room Type */}
                  <div>
                    <label className="block text-[10px] font-bold text-red-500 uppercase tracking-wider mb-1.5">Room Type</label>
                    <select
                      value={roomType}
                      onChange={(e) => setRoomType(e.target.value)}
                      className="w-full bg-white border border-slate-300 rounded-xl py-2 px-3 text-xs focus:outline-none focus:border-brand-500 text-slate-800"
                    >
                      <option value="">Any Room Type</option>
                      <option value="single">Single Room</option>
                      <option value="shared">Shared Room</option>
                      <option value="studio">Entire Studio</option>
                    </select>
                  </div>

                  {/* Furnishing */}
                  <div>
                    <label className="block text-[10px] font-bold text-red-500 uppercase tracking-wider mb-1.5">Furnishing</label>
                    <select
                      value={furnishing}
                      onChange={(e) => setFurnishing(e.target.value)}
                      className="w-full bg-white border border-slate-300 rounded-xl py-2 px-3 text-xs focus:outline-none focus:border-brand-500 text-slate-800"
                    >
                      <option value="">Any Furnishing</option>
                      <option value="furnished">Fully Furnished</option>
                      <option value="semi-furnished">Semi-Furnished</option>
                      <option value="unfurnished">Unfurnished</option>
                    </select>
                  </div>
                </div>

                <div className="flex items-center justify-between border-t border-slate-200 pt-4 mt-2">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Sort by:</span>
                    <div className="flex gap-2">
                      <button
                        onClick={() => setSortBy('compatibility')}
                        className={`px-3 py-1 rounded-full text-xs font-semibold border transition-all ${
                          sortBy === 'compatibility'
                            ? 'bg-blue-50 border-blue-500 text-blue-600'
                            : 'border-blue-200 text-blue-500 hover:text-blue-700 hover:border-blue-300'
                        }`}
                      >
                        AI Compatibility
                      </button>
                      <button
                        onClick={() => setSortBy('price_asc')}
                        className={`px-3 py-1 rounded-full text-xs font-semibold border transition-all ${
                          sortBy === 'price_asc'
                            ? 'bg-blue-50 border-blue-500 text-blue-600'
                            : 'border-blue-200 text-blue-500 hover:text-blue-700 hover:border-blue-300'
                        }`}
                      >
                        Price: Low to High
                      </button>
                      <button
                        onClick={() => setSortBy('date')}
                        className={`px-3 py-1 rounded-full text-xs font-semibold border transition-all ${
                          sortBy === 'date'
                            ? 'bg-blue-50 border-blue-500 text-blue-600'
                            : 'border-blue-200 text-blue-500 hover:text-blue-700 hover:border-blue-300'
                        }`}
                      >
                        Newest
                      </button>
                    </div>
                  </div>

                  <button
                    onClick={fetchListings}
                    className="bg-brand-600 hover:bg-brand-500 active:bg-brand-700 text-white rounded-xl py-2 px-5 font-semibold text-xs transition-all flex items-center gap-1.5"
                  >
                    Search
                  </button>
                </div>
              </div>

              {/* Listings Grid */}
              {isLoadingListings ? (
                <div className="flex flex-col items-center justify-center py-16 gap-3 text-slate-400">
                  <Loader className="w-8 h-8 animate-spin text-brand-500" />
                  <p className="text-sm font-semibold">Scanning compatible room matches...</p>
                </div>
              ) : listings.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 text-slate-400 bg-white border border-slate-200 rounded-2xl p-8">
                  <Compass className="w-12 h-12 opacity-20 mb-2" />
                  <p className="text-sm font-semibold">No listings found</p>
                  <p className="text-xs text-slate-400 mt-1 max-w-sm text-center">
                    Try loosening your filters or search keywords to fetch more flatmate postings.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {listings.map((item) => {
                    const matchedInterest = getInterestForListing(item.id);
                    return (
                      <div
                        key={item.id}
                        onClick={() => {
                          setSelectedListing({
                            ...item,
                            interestSent: !!matchedInterest,
                            interestStatus: matchedInterest?.status
                          });
                          setReviewRating(0);
                          setReviewComment('');
                          setReviewSuccess(false);
                          fetchReviews(item.id);
                        }}
                        className="bg-white border border-slate-200 rounded-2xl overflow-hidden cursor-pointer hover:-translate-y-1 transition-all duration-300 shadow-sm hover:shadow-md flex flex-col group"
                      >
                        {/* Image Preview */}
                        <div className="h-52 bg-slate-100 relative flex items-center justify-center overflow-hidden shrink-0 rounded-t-2xl">
                          {item.photos && item.photos.length > 0 ? (
                            <img
                              src={item.photos[0]}
                              alt="Room preview"
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                            />
                          ) : (
                            <Compass className="w-10 h-10 text-slate-300 group-hover:rotate-12 transition-transform" />
                          )}

                          {/* Score Badge */}
                          <div className={`absolute top-3 right-3 flex items-center gap-1 px-2.5 py-1.5 rounded-xl border text-xs font-bold ${getScoreBadgeColor(item.compatibility.score)} backdrop-blur-md`}>
                            <Sparkles className="w-3.5 h-3.5" />
                            {item.compatibility.score}% Match
                          </div>

                          <div className="absolute bottom-3 left-3 bg-white/90 backdrop-blur-md px-2.5 py-1 rounded-lg text-xs font-bold text-slate-700 uppercase tracking-wide shadow-sm">
                            {item.roomType}
                          </div>
                        </div>

                        {/* Card details */}
                        <div className="p-4 flex-1 flex flex-col justify-between">
                          <div className="space-y-1">
                            <div className="flex justify-between items-start">
                              <h3 className="font-bold text-slate-900 truncate text-sm">{item.location}</h3>
                              <span className="text-slate-900 font-bold text-sm">₹{item.rent}/mo</span>
                            </div>
                            <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed">
                              {item.description}
                            </p>
                          </div>

                          <div className="border-t border-slate-100 pt-3 mt-3 flex items-center justify-between text-xs text-slate-500">
                            <span className="flex items-center gap-1 capitalize">
                              <Settings className="w-3.5 h-3.5" />
                              {item.furnishingStatus}
                            </span>
                            <span className="flex items-center gap-1 text-slate-800 font-bold">
                              <Star className="w-3.5 h-3.5 fill-slate-800 text-slate-800" />
                              {item.avgRating > 0 ? Number(item.avgRating).toFixed(1) : 'New'}
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* Profile Tab */}
          {activeTab === 'profile' && (
            <div className="max-w-2xl mx-auto bg-white border border-slate-200 p-8 rounded-2xl shadow-sm">
              <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2 mb-6">
                <Settings className="w-5 h-5 text-brand-500" />
                Customize Matching Criteria
              </h3>

              {profileSuccess && (
                <div className="mb-6 p-4 bg-emerald-50 border border-emerald-200 text-emerald-700 text-sm rounded-xl flex items-center gap-2.5">
                  <CheckCircle2 className="w-5 h-5 shrink-0" />
                  <span>Profile updated successfully! Refreshing compatibility scores...</span>
                </div>
              )}

              <form onSubmit={handleSaveProfile} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">State</label>
                    <select
                      value={prefState}
                      onChange={(e) => {
                        setPrefState(e.target.value);
                        setPrefLocation('');
                      }}
                      className="w-full bg-white border border-slate-300 rounded-xl py-3 px-4 text-slate-900 focus:outline-none focus:border-brand-500 text-sm"
                    >
                      <option value="" disabled>Select a state</option>
                      {Object.keys(INDIAN_LOCATIONS).map(state => (
                        <option key={state} value={state}>{state}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Preferred District</label>
                    <div className="relative">
                      <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                      <select
                        value={prefLocation}
                        onChange={(e) => setPrefLocation(e.target.value)}
                        disabled={!prefState}
                        className="w-full bg-white border border-slate-300 rounded-xl py-3 pl-11 pr-4 text-slate-900 focus:outline-none focus:border-brand-500 text-sm appearance-none disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <option value="" disabled>Select a district</option>
                        {prefState && INDIAN_LOCATIONS[prefState]?.map(city => (
                          <option key={city} value={city}>{city}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Move-in Date</label>
                    <input
                      type="date"
                      required
                      value={moveDate}
                      onChange={(e) => setMoveDate(e.target.value)}
                      className="w-full bg-white border border-slate-300 rounded-xl py-3 px-4 text-slate-900 placeholder-slate-400 focus:outline-none focus:border-brand-500 text-sm"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Min Budget (₹)</label>
                    <input
                      type="number"
                      required
                      value={budMin}
                      onChange={(e) => setBudMin(e.target.value)}
                      placeholder="e.g. 800"
                      className="w-full bg-white border border-slate-300 rounded-xl py-3 px-4 text-slate-900 placeholder-slate-400 focus:outline-none focus:border-brand-500 text-sm"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Max Budget (₹)</label>
                    <input
                      type="number"
                      required
                      value={budMax}
                      onChange={(e) => setBudMax(e.target.value)}
                      placeholder="e.g. 1500"
                      className="w-full bg-white border border-slate-300 rounded-xl py-3 px-4 text-slate-900 placeholder-slate-400 focus:outline-none focus:border-brand-500 text-sm"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Lifestyle Notes & Social Rules</label>
                  <textarea
                    rows={4}
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Tell room owners about your cleaning habits, working hours, smoking rules, whether you have pets, or your general lifestyle. This is fed to the AI engine for richer matches!"
                    className="w-full bg-white border border-slate-300 rounded-xl py-3 px-4 text-slate-900 placeholder-slate-400 focus:outline-none focus:border-brand-500 text-sm leading-relaxed"
                  />
                </div>

                <button
                  type="submit"
                  disabled={profileSaving}
                  className="w-full bg-brand-600 hover:bg-brand-500 active:bg-brand-700 text-white rounded-xl py-3.5 px-4 font-semibold shadow-lg shadow-brand-500/15 flex items-center justify-center gap-2 hover:scale-[1.01] active:scale-[0.99] transition-all disabled:opacity-50"
                >
                  {profileSaving ? (
                    <>
                      <Loader className="w-5 h-5 animate-spin" />
                      Saving changes...
                    </>
                  ) : (
                    'Save Matching Profile'
                  )}
                </button>
              </form>
            </div>
          )}

          {/* Interests Tab */}
          {activeTab === 'interests' && (
            <div className="space-y-6">
              {loadingInterests ? (
                <div className="flex flex-col items-center justify-center py-16 gap-3 text-slate-400">
                  <Loader className="w-8 h-8 animate-spin text-brand-500" />
                  <p className="text-sm font-semibold">Fetching interest history...</p>
                </div>
              ) : interests.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 text-slate-400 bg-white border border-slate-200 rounded-2xl p-8">
                  <Heart className="w-12 h-12 opacity-20 mb-2" />
                  <p className="text-sm font-semibold">No interest requests sent yet</p>
                  <p className="text-xs text-slate-400 mt-1">
                    When you find rooms in the explorer tab, click "Express Interest" to send a matching request.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-4">
                  {interests.map((item) => (
                    <div
                      key={item.id}
                      className="bg-white border border-slate-200 p-6 rounded-2xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-sm"
                    >
                      <div className="space-y-2">
                        <div className="flex items-center gap-3">
                          <h4 className="font-bold text-slate-900 text-base">{item.listing.location}</h4>
                          <span className={`px-2 py-0.5 rounded-lg border text-xs font-bold flex items-center gap-1 ${
                            item.status === 'ACCEPTED' ? 'bg-emerald-50 border-emerald-200 text-emerald-700' :
                            item.status === 'DECLINED' ? 'bg-red-50 border-red-200 text-red-700' :
                            'bg-slate-100 border-slate-200 text-slate-600'
                          }`}>
                            {item.status === 'ACCEPTED' && <CheckCircle2 className="w-3.5 h-3.5" />}
                            {item.status === 'DECLINED' && <XCircle className="w-3.5 h-3.5" />}
                            {item.status === 'PENDING' && <AlertCircle className="w-3.5 h-3.5" />}
                            {item.status}
                          </span>
                        </div>
                        <p className="text-xs text-slate-500">
                          Owner: {item.listing.owner.name} <span className="text-slate-400">({item.listing.owner.email})</span> | Rent: ₹{item.listing.rent}/mo
                        </p>
                        {item.compatibility && (
                          <div className="flex items-center gap-1 text-xs text-brand-600 font-semibold bg-brand-50 px-2.5 py-1 rounded-lg border border-brand-100 w-fit">
                            <Sparkles className="w-3.5 h-3.5" />
                            AI Match Score: {item.compatibility.score}%
                          </div>
                        )}
                      </div>

                      <div className="flex gap-2">
                        {item.status === 'ACCEPTED' ? (
                          <>
                            <button
                              onClick={() => setActiveChat({
                                id: item.id,
                                title: `Chat with ${item.listing.owner.name}`
                              })}
                              className="bg-brand-600 hover:bg-brand-500 active:bg-brand-700 text-white rounded-xl py-2 px-4 text-xs font-bold transition-all shadow-md shadow-brand-500/10 flex items-center gap-1.5 hover:scale-105 active:scale-95"
                            >
                              <MessageSquare className="w-4.5 h-4.5" />
                              Open Chat
                            </button>
                            {hasAlreadyPaid(item.id) ? (
                              <button
                                disabled
                                className="bg-emerald-100 text-emerald-700 border border-emerald-200 rounded-xl py-2 px-4 text-xs font-bold flex items-center gap-1.5 cursor-not-allowed"
                              >
                                <CheckCircle2 className="w-4 h-4" />
                                Paid
                              </button>
                            ) : (
                              <button
                                onClick={() => openPaymentModal(item)}
                                className="bg-slate-900 hover:bg-slate-800 text-white rounded-xl py-2 px-4 text-xs font-bold transition-all shadow-md shadow-slate-900/10 flex items-center gap-1.5 hover:scale-105 active:scale-95"
                              >
                                <CreditCard className="w-4.5 h-4.5" />
                                Pay Rent
                              </button>
                            )}
                          </>
                        ) : (
                          <button
                            disabled
                            className="bg-slate-100 text-slate-400 border border-slate-200 rounded-xl py-2 px-4 text-xs font-bold flex items-center gap-1.5 cursor-not-allowed"
                          >
                            <MessageSquare className="w-4.5 h-4.5" />
                            Chat Locked
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Payments Tab */}
          {activeTab === 'payments' && (
            <div className="space-y-6">
              {myPayments.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 text-slate-400 bg-white border border-slate-200 rounded-2xl p-8">
                  <CreditCard className="w-12 h-12 opacity-20 mb-2" />
                  <p className="text-sm font-semibold">No payments yet</p>
                  <p className="text-xs text-slate-400 mt-1">
                    When your interest is accepted, you can pay rent securely from here.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-4">
                  {myPayments.map((payment) => (
                    <div
                      key={payment.id}
                      className="bg-white border border-slate-200 p-6 rounded-2xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-sm"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <h4 className="font-bold text-slate-900 text-base">{payment.location}</h4>
                          <span className="px-2 py-0.5 rounded-lg border bg-emerald-50 border-emerald-200 text-emerald-700 text-xs font-bold flex items-center gap-1">
                            <ShieldCheck className="w-3.5 h-3.5" />
                            Successful
                          </span>
                        </div>
                        <p className="text-xs text-slate-500 font-medium">
                          Paid to: <span className="text-slate-800">{payment.ownerName}</span> {payment.ownerEmail && <span className="text-slate-400">({payment.ownerEmail})</span>}
                        </p>
                        <p className="text-[10px] text-slate-400 font-mono">
                          Txn ID: {payment.txnRef} • {new Date(payment.paidAt).toLocaleString()}
                        </p>
                      </div>

                      <div className="text-right">
                        <div className="text-xl font-extrabold text-slate-900 flex items-center justify-end gap-1">
                          ₹{payment.amount}
                        </div>
                        <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider mt-0.5">
                          Method: {payment.method}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </main>

      {/* Listing Detail Drawer / Modal */}
      {selectedListing && (
        <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white w-full max-w-xl rounded-2xl overflow-hidden shadow-2xl relative max-h-[90vh] flex flex-col border border-slate-200">
            {/* Header */}
            <div className="px-6 py-4 border-b border-slate-200 bg-white flex items-center justify-between">
              <h3 className="font-extrabold text-slate-900 text-base">Room Details</h3>
              <button
                onClick={() => setSelectedListing(null)}
                className="p-1 hover:bg-slate-100 rounded text-slate-400 hover:text-slate-700 transition-colors"
              >
                <XCircle className="w-5 h-5" />
              </button>
            </div>

            {/* Content Body */}
            <div className="p-6 overflow-y-auto space-y-6 flex-1">
              {/* Photo carousel or fallback */}
              <div className="h-56 bg-slate-100 rounded-xl flex items-center justify-center overflow-hidden relative">
                {selectedListing.photos && selectedListing.photos.length > 0 ? (
                  <img
                    src={selectedListing.photos[0]}
                    alt="Room"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <Compass className="w-12 h-12 text-slate-300" />
                )}
                <div className={`absolute top-4 right-4 flex items-center gap-1 px-2.5 py-1.5 rounded-xl border text-xs font-bold ${getScoreBadgeColor(selectedListing.compatibility.score)} backdrop-blur-md`}>
                  <Sparkles className="w-3.5 h-3.5" />
                  {selectedListing.compatibility.score}% Match
                </div>
              </div>

              {/* Core attributes */}
              <div className="space-y-4">
                <div className="flex justify-between items-start border-b border-slate-200 pb-4">
                  <div>
                    <h2 className="text-xl font-bold text-slate-900">{selectedListing.location}</h2>
                    <p className="text-xs font-semibold text-slate-500 mt-2">
                      Owner: {selectedListing.owner?.name} <span className="text-slate-400">({selectedListing.owner?.email})</span> | Room: {selectedListing.roomType}
                    </p>
                  </div>
                  <div className="text-right">
                    <span className="text-slate-900 font-extrabold text-xl">₹{selectedListing.rent}</span>
                    <span className="text-xs text-slate-500 block">per month</span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 text-xs">
                  <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 flex items-center gap-2">
                    <Calendar className="w-4.5 h-4.5 text-brand-500 shrink-0" />
                    <div>
                      <span className="text-slate-400 block text-[10px] uppercase font-bold tracking-wider">Available From</span>
                      <span className="font-semibold text-slate-700">
                        {new Date(selectedListing.availableFrom).toLocaleDateString([], { month: 'long', day: 'numeric', year: 'numeric' })}
                      </span>
                    </div>
                  </div>

                  <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 flex items-center gap-2">
                    <Settings className="w-4.5 h-4.5 text-brand-500 shrink-0" />
                    <div>
                      <span className="text-slate-400 block text-[10px] uppercase font-bold tracking-wider">Furnishing</span>
                      <span className="font-semibold text-slate-700 capitalize">{selectedListing.furnishingStatus}</span>
                    </div>
                  </div>
                </div>

                {/* Description */}
                <div className="space-y-1.5">
                  <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Description</h4>
                  <p className="text-sm text-slate-600 leading-relaxed bg-slate-50 p-3.5 rounded-xl border border-slate-200">
                    {selectedListing.description}
                  </p>
                </div>

                {/* AI Explanation details */}
                {selectedListing.compatibility && (
                  <div className="bg-brand-50 border border-brand-100 p-4 rounded-xl space-y-2">
                    <div className="flex items-center gap-1.5 text-brand-600 text-xs font-bold">
                      <Sparkles className="w-4 h-4 shrink-0" />
                      AI Match explanation
                    </div>
                    <p className="text-xs text-slate-600 leading-relaxed">
                      {selectedListing.compatibility.explanation.replaceAll('$', '₹')}
                    </p>
                  </div>
                )}

                {/* Reviews Section */}
                <div className="pt-4 border-t border-slate-200 space-y-4">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Reviews & Ratings</h4>
                    {reviewData && reviewData.avgRating > 0 && (
                      <div className="flex items-center gap-1.5 text-slate-800 font-bold text-sm">
                        <Star className="w-4 h-4 fill-slate-800" />
                        {reviewData.avgRating} <span className="text-slate-400 font-normal text-xs">({reviewData.totalReviews})</span>
                      </div>
                    )}
                  </div>

                  {/* Add Review Form */}
                  <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3">
                    <h5 className="text-xs font-bold text-slate-600">Rate this room</h5>
                    <div className="flex gap-1">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <button
                          key={star}
                          onClick={() => setReviewRating(star)}
                          onMouseEnter={() => setReviewHover(star)}
                          onMouseLeave={() => setReviewHover(0)}
                          className="focus:outline-none transition-transform hover:scale-110 p-0.5"
                        >
                          <Star 
                            className={`w-6 h-6 ${
                              (reviewHover || reviewRating) >= star 
                                ? 'fill-amber-400 text-amber-400' 
                                : 'text-slate-300'
                            } transition-colors`} 
                          />
                        </button>
                      ))}
                    </div>
                    <textarea
                      placeholder="Share your thoughts or experience (optional)"
                      value={reviewComment}
                      onChange={(e) => setReviewComment(e.target.value)}
                      className="w-full bg-white border border-slate-300 rounded-xl p-3 text-sm focus:outline-none focus:border-brand-500 text-slate-900 placeholder:text-slate-400 resize-none h-20"
                    />
                    <div className="flex justify-end">
                      <button
                        onClick={() => handleSubmitReview(selectedListing.id)}
                        disabled={submittingReview || reviewRating === 0}
                        className="bg-slate-900 hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed text-white text-xs font-bold py-2 px-4 rounded-lg transition-colors flex items-center gap-2"
                      >
                        {submittingReview && <Loader className="w-3 h-3 animate-spin" />}
                        {reviewSuccess ? 'Submitted!' : 'Submit Review'}
                      </button>
                    </div>
                  </div>

                  {/* Existing Reviews List */}
                  {loadingReviews ? (
                    <div className="flex justify-center py-4"><Loader className="w-5 h-5 animate-spin text-slate-400" /></div>
                  ) : reviewData?.reviews && reviewData.reviews.length > 0 ? (
                    <div className="space-y-3 max-h-48 overflow-y-auto pr-2">
                      {reviewData.reviews.map((review: any) => (
                        <div key={review.id} className="bg-slate-50 p-3 rounded-lg border border-slate-200">
                          <div className="flex justify-between items-start mb-1.5">
                            <span className="text-xs font-bold text-slate-700">{review.tenant?.name || 'Anonymous'}</span>
                            <div className="flex gap-0.5">
                              {[...Array(5)].map((_, i) => (
                                <Star key={i} className={`w-3 h-3 ${i < review.rating ? 'fill-amber-400 text-amber-400' : 'text-slate-300'}`} />
                              ))}
                            </div>
                          </div>
                          {review.comment && (
                            <p className="text-xs text-slate-500 leading-relaxed">{review.comment}</p>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-slate-400 italic text-center py-2">No reviews yet for this room.</p>
                  )}
                </div>
              </div>
            </div>

            {/* Actions Footer */}
            <div className="px-6 py-4 border-t border-slate-200 bg-white flex gap-3">
              <button
                onClick={() => setSelectedListing(null)}
                className="w-1/3 bg-white hover:bg-slate-50 text-slate-600 border border-slate-300 rounded-xl py-3 text-xs font-bold transition-all"
              >
                Close
              </button>

              {selectedListing.interestSent ? (
                <button
                  disabled
                  className="w-2/3 bg-slate-100 text-slate-400 border border-slate-200 rounded-xl py-3 text-xs font-bold cursor-not-allowed flex items-center justify-center gap-1.5"
                >
                  <Heart className="w-4.5 h-4.5 fill-slate-400 text-slate-400" />
                  Interest Expressed ({selectedListing.interestStatus || 'PENDING'})
                </button>
              ) : (
                <button
                  onClick={() => handleExpressInterest(selectedListing.id)}
                  disabled={submittingInterest}
                  className="w-2/3 bg-brand-600 hover:bg-brand-500 active:bg-brand-700 text-white rounded-xl py-3 text-xs font-bold shadow-lg shadow-brand-500/10 flex items-center justify-center gap-1.5 hover:scale-[1.01] active:scale-[0.99] transition-all disabled:opacity-50"
                >
                  {submittingInterest ? (
                    <>
                      <Loader className="w-4.5 h-4.5 animate-spin" />
                      Sending request...
                    </>
                  ) : (
                    <>
                      <Heart className="w-4.5 h-4.5" />
                      Express Room Interest
                    </>
                  )}
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Payment Modal */}
      {paymentModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white w-full max-w-md rounded-2xl overflow-hidden shadow-2xl relative flex flex-col border border-slate-200">
            {paymentStep !== 'success' && (
              <div className="px-6 py-4 border-b border-slate-200 bg-white flex items-center justify-between">
                <h3 className="font-extrabold text-slate-900 text-base flex items-center gap-2">
                  <ShieldCheck className="w-5 h-5 text-emerald-500" />
                  Secure Payment
                </h3>
                {paymentStep !== 'processing' && (
                  <button
                    onClick={() => setPaymentModal(null)}
                    className="p-1 hover:bg-slate-100 rounded text-slate-400 hover:text-slate-700 transition-colors"
                  >
                    <XCircle className="w-5 h-5" />
                  </button>
                )}
              </div>
            )}

            <div className="p-6">
              {paymentStep === 'form' && (
                <div className="space-y-6">
                  {/* Summary */}
                  <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 flex justify-between items-center">
                    <div>
                      <p className="text-xs text-slate-500 font-semibold mb-0.5">Paying rent for</p>
                      <p className="text-sm font-extrabold text-slate-900">{paymentModal.interest.listing.location}</p>
                      <p className="text-xs text-slate-600 mt-1">To: {paymentModal.interest.listing.owner.name}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-slate-500 font-semibold mb-0.5">Amount</p>
                      <p className="text-2xl font-black text-slate-900">₹{paymentModal.interest.listing.rent}</p>
                    </div>
                  </div>

                  {/* Method selection */}
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">Select Method</label>
                    <div className="grid grid-cols-3 gap-2">
                      {['upi', 'card', 'netbanking'].map((method) => (
                        <button
                          key={method}
                          onClick={() => setPaymentMethod(method as any)}
                          className={`py-2 px-3 rounded-xl border text-xs font-bold capitalize transition-all ${
                            paymentMethod === method
                              ? 'bg-brand-50 border-brand-300 text-brand-700 shadow-sm'
                              : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                          }`}
                        >
                          {method === 'upi' ? 'UPI' : method === 'card' ? 'Card' : 'Net Banking'}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Form fields based on method */}
                  <div className="space-y-4">
                    {paymentMethod === 'upi' && (
                      <div>
                        <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">UPI ID</label>
                        <input
                          type="text"
                          value={upiId}
                          onChange={(e) => setUpiId(e.target.value)}
                          placeholder="name@okbank"
                          className="w-full bg-white border border-slate-300 rounded-xl py-2.5 px-3 text-sm focus:outline-none focus:border-brand-500 text-slate-900"
                        />
                      </div>
                    )}

                    {paymentMethod === 'card' && (
                      <>
                        <div>
                          <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Card Number</label>
                          <input
                            type="text"
                            value={cardNumber}
                            onChange={(e) => setCardNumber(e.target.value)}
                            placeholder="0000 0000 0000 0000"
                            maxLength={19}
                            className="w-full bg-white border border-slate-300 rounded-xl py-2.5 px-3 text-sm focus:outline-none focus:border-brand-500 text-slate-900 font-mono tracking-widest"
                          />
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Expiry</label>
                            <input
                              type="text"
                              value={cardExpiry}
                              onChange={(e) => setCardExpiry(e.target.value)}
                              placeholder="MM/YY"
                              className="w-full bg-white border border-slate-300 rounded-xl py-2.5 px-3 text-sm focus:outline-none focus:border-brand-500 text-slate-900"
                            />
                          </div>
                          <div>
                            <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">CVV</label>
                            <input
                              type="password"
                              value={cardCvv}
                              onChange={(e) => setCardCvv(e.target.value)}
                              placeholder="***"
                              maxLength={4}
                              className="w-full bg-white border border-slate-300 rounded-xl py-2.5 px-3 text-sm focus:outline-none focus:border-brand-500 text-slate-900 font-mono tracking-widest"
                            />
                          </div>
                        </div>
                        <div>
                          <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Name on Card</label>
                          <input
                            type="text"
                            value={cardName}
                            onChange={(e) => setCardName(e.target.value)}
                            placeholder="John Doe"
                            className="w-full bg-white border border-slate-300 rounded-xl py-2.5 px-3 text-sm focus:outline-none focus:border-brand-500 text-slate-900"
                          />
                        </div>
                      </>
                    )}

                    {paymentMethod === 'netbanking' && (
                      <div className="text-center py-4 bg-slate-50 rounded-xl border border-slate-200">
                        <Clock className="w-8 h-8 text-slate-400 mx-auto mb-2" />
                        <p className="text-sm font-semibold text-slate-600">Redirects to Bank Portal</p>
                        <p className="text-xs text-slate-400 mt-1">You will be securely redirected.</p>
                      </div>
                    )}
                  </div>

                  <button
                    onClick={handlePayRent}
                    className="w-full bg-slate-900 hover:bg-slate-800 text-white rounded-xl py-3.5 text-sm font-bold shadow-lg shadow-slate-900/10 flex items-center justify-center gap-2 hover:scale-[1.01] active:scale-[0.99] transition-all"
                  >
                    <CreditCard className="w-5 h-5" />
                    Pay ₹{paymentModal.interest.listing.rent} Securely
                  </button>
                </div>
              )}

              {paymentStep === 'processing' && (
                <div className="py-12 flex flex-col items-center justify-center">
                  <div className="relative">
                    <Loader className="w-12 h-12 text-slate-900 animate-spin" />
                    <div className="absolute inset-0 flex items-center justify-center">
                      <ShieldCheck className="w-5 h-5 text-slate-900" />
                    </div>
                  </div>
                  <p className="font-bold text-slate-900 mt-6">Processing Payment...</p>
                  <p className="text-xs text-slate-500 mt-1">Please do not close this window.</p>
                </div>
              )}

              {paymentStep === 'success' && (
                <div className="py-8 flex flex-col items-center justify-center text-center">
                  <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center mb-6">
                    <BadgeCheck className="w-10 h-10 text-emerald-500" />
                  </div>
                  <h3 className="text-2xl font-black text-slate-900 mb-2">Payment Successful!</h3>
                  <p className="text-slate-500 text-sm mb-6 max-w-[250px]">
                    Your rent of ₹{paymentModal.interest.listing.rent} has been sent to {paymentModal.interest.listing.owner.name}.
                  </p>
                  <button
                    onClick={() => {
                      setPaymentModal(null);
                      setActiveTab('payments');
                    }}
                    className="w-full bg-slate-900 hover:bg-slate-800 text-white rounded-xl py-3.5 text-sm font-bold transition-all"
                  >
                    View Receipt
                  </button>
                </div>
              )}
            </div>
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
export default TenantDashboard;

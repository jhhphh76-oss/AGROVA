import React, { useState } from 'react';
import { 
  Store, 
  Search, 
  Plus, 
  MapPin, 
  ShieldCheck, 
  Tag, 
  PhoneCall, 
  X, 
  AlertCircle,
  Filter,
  CheckCircle2,
  Package,
  Clock,
  Trash2,
  MessageSquareText,
  Camera,
  Image as ImageIcon,
  User
} from 'lucide-react';
import { MarketListing, SupportedLanguage, CropEnquiry, PlantScanRecord } from '../types';
import { TRANSLATIONS } from '../constants/translations';
import { storageService } from '../services/storage';
import { cropHealthService } from '../services/cropHealthService';

interface MarketplaceScreenProps {
  listings: MarketListing[];
  enquiries?: CropEnquiry[];
  onRefreshListings: () => void;
  language: SupportedLanguage;
  farmerId?: string;
  sellerName?: string;
  sellerPhone?: string;
  sellerLocation?: string;
  plantScans?: PlantScanRecord[];
}

const CATEGORIES: MarketListing['cropCategory'][] = [
  'Grains & Cereals',
  'Pulses',
  'Vegetables',
  'Fruits',
  'Oilseeds',
  'Spices',
  'Seeds',
];

export const MarketplaceScreen: React.FC<MarketplaceScreenProps> = ({
  listings,
  enquiries = [],
  onRefreshListings,
  language,
  farmerId = 'farmer-user-1',
  sellerName,
  sellerPhone,
  sellerLocation,
  plantScans = [],
}) => {
  const t = TRANSLATIONS[language]?.marketplace || TRANSLATIONS.en.marketplace;

  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [activeTab, setActiveTab] = useState<'all' | 'my-listings' | 'received-enquiries'>('all');
  
  // Selected Listing Details Modal
  const [selectedListing, setSelectedListing] = useState<MarketListing | null>(null);
  const [contactModalOpen, setContactModalOpen] = useState<boolean>(false);

  // "List Your Produce" Modal
  const [isCreateModalOpen, setIsCreateModalOpen] = useState<boolean>(false);
  const [formTitle, setFormTitle] = useState<string>('');
  const [formCategory, setFormCategory] = useState<MarketListing['cropCategory']>('Grains & Cereals');
  const [formVariety, setFormVariety] = useState<string>('');
  const [formQuantity, setFormQuantity] = useState<number>(50);
  const [formPrice, setFormPrice] = useState<number>(2500);
  const [formLocation, setFormLocation] = useState<string>(sellerLocation || 'Vijayapura APMC Mandi');
  const [formState, setFormState] = useState<string>('Karnataka');
  const [formSellerName, setFormSellerName] = useState<string>(sellerName || 'Basavaraj Patil');
  const [formSellerPhone, setFormSellerPhone] = useState<string>(sellerPhone || '+91 98450 12345');

  React.useEffect(() => {
    if (sellerName) setFormSellerName(sellerName);
    if (sellerPhone) setFormSellerPhone(sellerPhone);
    if (sellerLocation) setFormLocation(sellerLocation);
  }, [sellerName, sellerPhone, sellerLocation]);
  const [formGrade, setFormGrade] = useState<MarketListing['grade']>('Grade A (Premium)');
  const [formAvailability, setFormAvailability] = useState<string>('Ready for Immediate Dispatch');
  const [formDesc, setFormDesc] = useState<string>('');
  const [formPhoto, setFormPhoto] = useState<string | null>(null);
  const [isPublishing, setIsPublishing] = useState<boolean>(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Handle Photo selection for Produce
  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        alert('Produce photo must be less than 5MB.');
        return;
      }
      const reader = new FileReader();
      reader.onload = (event) => {
        setFormPhoto(event.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  // Filter listings
  const filteredListings = listings.filter((item) => {
    const matchesCategory = selectedCategory === 'All' || item.cropCategory === selectedCategory;
    const matchesSearch =
      item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.variety.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.location.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.state.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesTab =
      activeTab === 'all' ||
      (activeTab === 'my-listings' && (!item.isDemonstration || item.sellerId === farmerId));

    return matchesCategory && matchesSearch && matchesTab;
  });

  const myListingsCount = listings.filter((l) => !l.isDemonstration || l.sellerId === farmerId).length;

  const handleCreateListing = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formTitle.trim()) return;

    setIsPublishing(true);

    const assessment = cropHealthService.calculateCropHealth(plantScans, formTitle.trim() || formVariety.trim());

    const newListingData: Partial<MarketListing> = {
      title: formTitle.trim(),
      cropCategory: formCategory,
      variety: formVariety.trim() || 'Standard',
      quantity: Number(formQuantity) || 1,
      unit: 'quintal',
      expectedPrice: Number(formPrice) || 1000,
      priceUnit: 'per quintal',
      location: formLocation.trim() || 'Local APMC',
      state: formState.trim() || 'Karnataka',
      sellerId: farmerId,
      sellerName: formSellerName.trim() || 'Farmer',
      sellerType: 'Farmer',
      contactPhone: formSellerPhone.trim(),
      grade: formGrade,
      harvestAvailability: formAvailability.trim() || 'Ready for Immediate Dispatch',
      isDemonstration: false,
      datePosted: new Date().toISOString().split('T')[0],
      description: formDesc.trim() || 'Harvest-ready crop listing directly from the farmer.',
      photoUrl: formPhoto || undefined,
      cropHealthAssessment: assessment
        ? {
            score: assessment.score,
            grade: assessment.grade,
            evaluatedAt: assessment.latestScanDate,
            notes: `AgriConnect scan assessment: ${assessment.score}% (Grade ${assessment.grade}) from ${assessment.validScansCount} verified leaf scan(s).`,
          }
        : null,
    };

    const result = await storageService.saveMarketListing(newListingData, 'farmer', farmerId);
    setIsPublishing(false);

    if (result.success) {
      setIsCreateModalOpen(false);
      // Reset form
      setFormTitle('');
      setFormVariety('');
      setFormDesc('');
      setFormPhoto(null);
      setToastMessage('Your produce listing has been published and is now visible to wholesale buyers!');
      setTimeout(() => setToastMessage(null), 4000);
      onRefreshListings();
    } else {
      alert(result.error || 'Failed to publish listing.');
    }
  };

  const handleDeleteListing = async (e: React.MouseEvent, listingId: string) => {
    e.stopPropagation();
    if (!confirm('Are you sure you want to delete this listing? It will be removed from the shared marketplace.')) {
      return;
    }

    const result = await storageService.deleteMarketListing(listingId, 'farmer', farmerId);
    if (result.success) {
      setToastMessage('Listing removed from marketplace.');
      setTimeout(() => setToastMessage(null), 3000);
      onRefreshListings();
      if (selectedListing?.id === listingId) {
        setSelectedListing(null);
      }
    } else {
      alert(result.error || 'Cannot delete listing.');
    }
  };

  const handleUpdateEnquiryStatus = async (enquiryId: string, status: CropEnquiry['status']) => {
    await storageService.updateEnquiryStatus(enquiryId, status);
    setToastMessage(`Enquiry status updated to "${status}".`);
    setTimeout(() => setToastMessage(null), 3000);
    onRefreshListings();
  };

  return (
    <div className="space-y-4 pb-8 animate-in fade-in duration-150">
      {/* Title & Introduction */}
      <div className="bg-white rounded-3xl p-5 border border-[#dce8d5] shadow-xs space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-[#e5f3e2] flex items-center justify-center text-[#124429] border border-[#cfe2ca]">
              <Store className="w-5 h-5 text-emerald-700" />
            </div>
            <div>
              <h1 className="text-xl font-black text-[#113d23] font-display">
                {t.title}
              </h1>
              <p className="text-xs text-[#526d57]">
                Connect with wholesale buyers and APMC traders directly from your farm
              </p>
            </div>
          </div>

          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="flex items-center justify-center gap-1.5 px-4 py-2 min-h-[44px] rounded-xl bg-[#14492a] text-white text-xs font-bold hover:bg-[#0e3a20] transition shadow-xs self-start sm:self-auto"
          >
            <Plus className="w-4 h-4" />
            <span>List Produce for Sale</span>
          </button>
        </div>

        {/* Toast Feedback */}
        {toastMessage && (
          <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-900 rounded-2xl text-xs font-semibold flex items-center gap-2 animate-in fade-in">
            <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0" />
            <span>{toastMessage}</span>
          </div>
        )}

        {/* View Mode Navigation Tabs */}
        <div className="flex items-center gap-2 pt-1 border-t border-slate-100 text-xs font-bold">
          <button
            onClick={() => setActiveTab('all')}
            className={`px-3.5 py-2 rounded-xl transition ${
              activeTab === 'all'
                ? 'bg-[#14492a] text-white shadow-xs'
                : 'bg-[#f4f7f1] text-slate-700 hover:bg-[#e9f1e4]'
            }`}
          >
            All Market Produce ({listings.length})
          </button>

          <button
            onClick={() => setActiveTab('my-listings')}
            className={`px-3.5 py-2 rounded-xl transition flex items-center gap-1.5 ${
              activeTab === 'my-listings'
                ? 'bg-[#14492a] text-white shadow-xs'
                : 'bg-[#f4f7f1] text-slate-700 hover:bg-[#e9f1e4]'
            }`}
          >
            <Package className="w-3.5 h-3.5" />
            <span>My Farm Listings ({myListingsCount})</span>
          </button>

          <button
            onClick={() => setActiveTab('received-enquiries')}
            className={`px-3.5 py-2 rounded-xl transition flex items-center gap-1.5 ${
              activeTab === 'received-enquiries'
                ? 'bg-[#14492a] text-white shadow-xs'
                : 'bg-[#f4f7f1] text-slate-700 hover:bg-[#e9f1e4]'
            }`}
          >
            <MessageSquareText className="w-3.5 h-3.5" />
            <span>Buyer Enquiries ({enquiries.length})</span>
          </button>
        </div>

        {activeTab !== 'received-enquiries' && (
          <>
            {/* Search Bar */}
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={t.searchPlaceholder}
                className="w-full text-xs bg-[#f8faf6] border border-[#dce8d5] rounded-xl pl-10 pr-4 py-2.5 text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500 font-medium"
              />
            </div>

            {/* Category Filter Chips */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 -mx-1 px-1 no-scrollbar">
              <button
                onClick={() => setSelectedCategory('All')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition min-h-[36px] ${
                  selectedCategory === 'All'
                    ? 'bg-[#14492a] text-white shadow-xs'
                    : 'bg-[#f7faf5] border border-[#dbe7d5] text-[#2c4734] hover:bg-white'
                }`}
              >
                {t.allCategories}
              </button>
              {CATEGORIES.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition min-h-[36px] ${
                    selectedCategory === cat
                      ? 'bg-[#14492a] text-white shadow-xs'
                      : 'bg-[#f7faf5] border border-[#dbe7d5] text-[#2c4734] hover:bg-white'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </>
        )}
      </div>

      {/* TAB 1 & 2: LISTINGS DISPLAY */}
      {activeTab !== 'received-enquiries' && (
        <>
          {filteredListings.length === 0 ? (
            <div className="bg-white rounded-3xl p-8 border border-dashed border-[#cfe2ca] text-center space-y-2">
              <Store className="w-8 h-8 text-slate-300 mx-auto" />
              <h3 className="text-sm font-bold text-slate-700">No produce listings found</h3>
              <p className="text-xs text-slate-500">
                {activeTab === 'my-listings'
                  ? "You haven't published any crop listings yet. Tap 'List Produce for Sale' above."
                  : 'Try adjusting your search terms or category filter.'}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
              {filteredListings.map((item) => {
                const isMyOwnListing = !item.isDemonstration || item.sellerId === farmerId;

                return (
                  <div
                    key={item.id}
                    onClick={() => setSelectedListing(item)}
                    className="bg-white rounded-2xl border border-[#dce8d5] p-4 space-y-3 shadow-2xs hover:border-[#a9d5a2] cursor-pointer transition flex flex-col justify-between"
                  >
                    <div className="space-y-2">
                      {/* Photo preview if present */}
                      {item.photoUrl && (
                        <div className="w-full h-36 rounded-xl overflow-hidden bg-slate-100">
                          <img
                            src={item.photoUrl}
                            alt={item.title}
                            className="w-full h-full object-cover"
                          />
                        </div>
                      )}

                      {/* Header with demonstration badge */}
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">
                            {item.cropCategory}
                          </span>
                          <h3 className="text-sm font-bold text-[#113d23] line-clamp-1">
                            {item.title}
                          </h3>
                          <p className="text-xs text-slate-500">
                            Variety: {item.variety} • Grade: {item.grade}
                          </p>
                        </div>

                        {item.isDemonstration ? (
                          <span className="px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider bg-amber-50 text-amber-800 border border-amber-300 shrink-0">
                            {t.sampleDataBadge}
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider bg-emerald-700 text-white shrink-0">
                            Your Live Listing
                          </span>
                        )}
                      </div>

                      {/* Availability */}
                      <div className="text-[11px] text-emerald-800 flex items-center gap-1 font-semibold">
                        <Clock className="w-3 h-3 text-emerald-600" />
                        <span>{item.harvestAvailability || 'Ready for Immediate Dispatch'}</span>
                      </div>

                      {/* Key Produce Metrics */}
                      <div className="grid grid-cols-2 gap-2 bg-[#f9fbf8] p-2.5 rounded-xl border border-[#e4ede1] text-xs">
                        <div>
                          <span className="text-[10px] text-slate-400 block font-medium">Quantity</span>
                          <span className="font-bold text-slate-800">
                            {item.quantity} {item.unit}
                          </span>
                        </div>
                        <div>
                          <span className="text-[10px] text-slate-400 block font-medium">Expected Price</span>
                          <span className="font-bold text-[#113d23]">
                            ₹{item.expectedPrice.toLocaleString('en-IN')}{' '}
                            <span className="text-[10px] text-slate-500 font-normal">/{item.priceUnit}</span>
                          </span>
                        </div>
                      </div>

                      {/* AgriConnect Scan-Based Crop Health Assessment */}
                      <div className="flex items-center justify-between text-[11px] px-2.5 py-1.5 rounded-lg bg-[#f4f8f2] border border-[#dce8d5]">
                        <span className="flex items-center gap-1 font-semibold text-[#144225]">
                          <ShieldCheck className="w-3.5 h-3.5 text-emerald-700 shrink-0" />
                          <span>Crop Health:</span>
                        </span>
                        {item.cropHealthAssessment ? (
                          <span className="font-bold text-emerald-900">
                            {item.cropHealthAssessment.score}% (Grade {item.cropHealthAssessment.grade})
                          </span>
                        ) : (
                          <span className="text-slate-500 italic">Not assessed yet</span>
                        )}
                      </div>

                      {/* Location & Seller */}
                      <div className="flex items-center gap-1 text-[11px] text-slate-500 truncate">
                        <MapPin className="w-3.5 h-3.5 text-emerald-700 shrink-0" />
                        <span className="truncate">{item.location}, {item.state}</span>
                      </div>
                    </div>

                    {/* Bottom Actions */}
                    <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs">
                      <span className="text-slate-500 truncate max-w-[150px]">
                        By: <strong className="text-slate-700">{item.sellerName}</strong>
                      </span>

                      <div className="flex items-center gap-2">
                        {isMyOwnListing && !item.isDemonstration && (
                          <button
                            type="button"
                            onClick={(e) => handleDeleteListing(e, item.id)}
                            className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg transition"
                            title="Delete this listing"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                        <span className="text-emerald-700 font-bold hover:underline">
                          View Details →
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}

      {/* TAB 3: RECEIVED BUYER ENQUIRIES */}
      {activeTab === 'received-enquiries' && (
        <div className="space-y-3">
          {enquiries.length === 0 ? (
            <div className="bg-white rounded-3xl p-8 border border-[#dce8d5] text-center space-y-3 shadow-xs">
              <div className="w-12 h-12 rounded-full bg-emerald-50 text-emerald-700 flex items-center justify-center mx-auto">
                <MessageSquareText className="w-6 h-6" />
              </div>
              <h3 className="text-sm font-bold text-slate-800">No Buyer Enquiries Yet</h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                When wholesale buyers or mandi traders submit purchase interest for your produce listings, their offers and contact numbers will appear here.
              </p>
            </div>
          ) : (
            enquiries.map((enq) => (
              <div
                key={enq.id}
                className="bg-white rounded-2xl p-4 sm:p-5 border border-[#dce8d5] shadow-2xs space-y-3"
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 block uppercase">
                      Enquiry for: {enq.listingTitle}
                    </span>
                    <h3 className="text-base font-bold text-[#144225] mt-0.5">
                      Buyer: {enq.buyerName} {enq.buyerBusiness ? `(${enq.buyerBusiness})` : ''}
                    </h3>
                    <p className="text-xs text-slate-500">
                      Location: {enq.buyerLocation || 'Regional APMC'}
                    </p>
                  </div>

                  <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200">
                    {enq.status}
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 bg-[#f8faf6] p-3 rounded-xl border border-[#e5edd9] text-xs">
                  <div>
                    <span className="text-[10px] text-slate-500 block">Requested Volume:</span>
                    <span className="font-bold text-slate-800">
                      {enq.requestedQuantity} {enq.unit}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-500 block">Offered Price:</span>
                    <span className="font-bold text-emerald-800">
                      {enq.offeredPrice ? `₹${enq.offeredPrice.toLocaleString('en-IN')}` : 'Listing Rate'} {enq.priceUnit ? `(${enq.priceUnit})` : ''}
                    </span>
                  </div>
                  <div className="col-span-2 sm:col-span-1">
                    <span className="text-[10px] text-slate-500 block">Buyer Contact:</span>
                    <span className="font-bold text-slate-800">{enq.buyerPhone}</span>
                  </div>
                </div>

                {enq.message && (
                  <p className="text-xs text-slate-600 bg-[#fbfbfb] p-2.5 rounded-xl border border-slate-100 italic">
                    "{enq.message}"
                  </p>
                )}

                <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-100">
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs text-slate-500 font-medium">Update Status:</span>
                    <select
                      value={enq.status}
                      onChange={(e) => handleUpdateEnquiryStatus(enq.id, e.target.value as any)}
                      className="text-xs font-semibold bg-[#f4f7f1] border border-[#d2dfcc] rounded-lg px-2 py-1 text-slate-800"
                    >
                      <option value="Pending Response">Pending Response</option>
                      <option value="Contacted">Contacted Buyer</option>
                      <option value="Accepted">Accepted Offer</option>
                      <option value="Declined">Declined</option>
                    </select>
                  </div>

                  <a
                    href={`tel:${enq.buyerPhone}`}
                    className="px-3.5 py-1.5 bg-[#14492a] hover:bg-[#0f3820] text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5"
                  >
                    <PhoneCall className="w-3.5 h-3.5" />
                    <span>Call Buyer ({enq.buyerPhone})</span>
                  </a>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Modal: Listing Details */}
      {selectedListing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-lg w-full p-5 shadow-2xl border border-[#dce8d5] space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800">
                  {selectedListing.cropCategory}
                </span>
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-slate-100 text-slate-700">
                  {selectedListing.grade}
                </span>
              </div>
              <button
                onClick={() => setSelectedListing(null)}
                className="w-8 h-8 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-700"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {selectedListing.photoUrl && (
              <div className="w-full h-44 rounded-2xl overflow-hidden bg-slate-100">
                <img
                  src={selectedListing.photoUrl}
                  alt={selectedListing.title}
                  className="w-full h-full object-cover"
                />
              </div>
            )}

            <div>
              <h3 className="text-base font-bold text-[#144225] font-display">
                {selectedListing.title}
              </h3>
              <p className="text-xs text-slate-500">
                Variety: {selectedListing.variety} • Posted: {selectedListing.datePosted}
              </p>
            </div>

            <div className="grid grid-cols-2 gap-2 bg-[#f8faf6] p-3 rounded-2xl border border-[#e5edd9] text-xs">
              <div>
                <span className="text-[10px] text-slate-500 block">Available Volume</span>
                <span className="font-bold text-slate-800 text-sm">
                  {selectedListing.quantity} {selectedListing.unit}
                </span>
              </div>
              <div>
                <span className="text-[10px] text-slate-500 block">Target Price</span>
                <span className="font-black text-[#144225] text-sm">
                  ₹{selectedListing.expectedPrice.toLocaleString('en-IN')} /{selectedListing.priceUnit}
                </span>
              </div>
              <div className="col-span-2">
                <span className="text-[10px] text-slate-500 block">Harvest Availability</span>
                <span className="font-semibold text-emerald-800">
                  {selectedListing.harvestAvailability || 'Ready for Immediate Dispatch'}
                </span>
              </div>
            </div>

            {selectedListing.description && (
              <div>
                <span className="text-xs font-bold text-slate-700 block mb-1">Description</span>
                <p className="text-xs text-slate-600 leading-relaxed bg-[#fbfbfb] p-3 rounded-xl border border-slate-150">
                  {selectedListing.description}
                </p>
              </div>
            )}

            <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs">
              <div>
                <span className="text-slate-500 block text-[10px]">Seller Information</span>
                <span className="font-bold text-[#144225]">{selectedListing.sellerName}</span>
                <span className="text-slate-500 block text-[11px]">{selectedListing.location}, {selectedListing.state}</span>
              </div>

              {selectedListing.contactPhone && (
                <a
                  href={`tel:${selectedListing.contactPhone}`}
                  className="px-4 py-2 bg-[#14492a] text-white rounded-xl text-xs font-bold hover:bg-[#0f3820] transition flex items-center gap-1.5 shadow-xs"
                >
                  <PhoneCall className="w-3.5 h-3.5" />
                  <span>Call Seller</span>
                </a>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Modal: List Produce for Sale */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-lg w-full p-5 shadow-2xl border border-[#dce8d5] space-y-4 my-auto max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <h3 className="text-sm font-bold text-[#144225] font-display flex items-center gap-1.5">
                <Package className="w-4 h-4 text-emerald-700" />
                <span>List Your Farm Produce</span>
              </h3>
              <button
                onClick={() => setIsCreateModalOpen(false)}
                className="w-8 h-8 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-700"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateListing} className="space-y-3.5">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1 uppercase tracking-wider">
                  Produce Title <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formTitle}
                  onChange={(e) => setFormTitle(e.target.value)}
                  placeholder="E.g., Sharbati Wheat, Byadagi Chilli, Vijayapura Onion..."
                  className="w-full text-xs bg-white border border-[#d2e2cb] rounded-xl px-3 py-2 text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500 font-medium"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1 uppercase tracking-wider">
                    Category
                  </label>
                  <select
                    value={formCategory}
                    onChange={(e) => setFormCategory(e.target.value as any)}
                    className="w-full text-xs bg-white border border-[#d2e2cb] rounded-xl px-2.5 py-2 text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  >
                    {CATEGORIES.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1 uppercase tracking-wider">
                    Crop Variety
                  </label>
                  <input
                    type="text"
                    value={formVariety}
                    onChange={(e) => setFormVariety(e.target.value)}
                    placeholder="E.g., HD-2967, Garwa F1..."
                    className="w-full text-xs bg-white border border-[#d2e2cb] rounded-xl px-3 py-2 text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1 uppercase tracking-wider">
                    Quantity (Quintals) *
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={formQuantity}
                    onChange={(e) => setFormQuantity(Number(e.target.value))}
                    className="w-full text-xs bg-white border border-[#d2e2cb] rounded-xl px-3 py-2 text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500 font-semibold"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1 uppercase tracking-wider">
                    Target Price (₹/Quintal) *
                  </label>
                  <input
                    type="number"
                    min="100"
                    value={formPrice}
                    onChange={(e) => setFormPrice(Number(e.target.value))}
                    className="w-full text-xs bg-white border border-[#d2e2cb] rounded-xl px-3 py-2 text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500 font-semibold"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1 uppercase tracking-wider">
                    Location / Mandi *
                  </label>
                  <input
                    type="text"
                    value={formLocation}
                    onChange={(e) => setFormLocation(e.target.value)}
                    className="w-full text-xs bg-white border border-[#d2e2cb] rounded-xl px-3 py-2 text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1 uppercase tracking-wider">
                    State
                  </label>
                  <input
                    type="text"
                    value={formState}
                    onChange={(e) => setFormState(e.target.value)}
                    className="w-full text-xs bg-white border border-[#d2e2cb] rounded-xl px-3 py-2 text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1 uppercase tracking-wider">
                  Harvest Availability Timeline
                </label>
                <input
                  type="text"
                  value={formAvailability}
                  onChange={(e) => setFormAvailability(e.target.value)}
                  placeholder="E.g., Ready for Immediate Dispatch, Harvesting in 10 Days..."
                  className="w-full text-xs bg-white border border-[#d2e2cb] rounded-xl px-3 py-2 text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              {/* Optional Produce Photograph */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1 uppercase tracking-wider">
                  Produce Photograph (Optional)
                </label>
                {formPhoto ? (
                  <div className="relative rounded-2xl overflow-hidden border border-emerald-300 w-full h-32 bg-slate-100">
                    <img src={formPhoto} alt="Produce preview" className="w-full h-full object-cover" />
                    <button
                      type="button"
                      onClick={() => setFormPhoto(null)}
                      className="absolute top-2 right-2 bg-red-600 text-white rounded-full p-1 shadow-md hover:bg-red-700"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ) : (
                  <label className="flex flex-col items-center justify-center p-4 border-2 border-dashed border-[#cfe2ca] hover:border-emerald-600 rounded-2xl cursor-pointer bg-[#f9fcf8] transition">
                    <Camera className="w-5 h-5 text-emerald-700 mb-1" />
                    <span className="text-xs font-bold text-slate-700">Upload Produce Photo</span>
                    <span className="text-[10px] text-slate-400">JPEG, PNG, WebP up to 5MB</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handlePhotoUpload}
                      className="hidden"
                    />
                  </label>
                )}
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1 uppercase tracking-wider">
                  Description & Lot Quality Notes
                </label>
                <textarea
                  value={formDesc}
                  onChange={(e) => setFormDesc(e.target.value)}
                  placeholder="E.g., Machine cleaned, 10% moisture, graded size, ready for dispatch in 50kg gunny bags..."
                  rows={2}
                  className="w-full text-xs bg-white border border-[#d2e2cb] rounded-xl p-2.5 text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500 resize-none font-medium"
                />
              </div>

              <div className="pt-2 flex gap-2">
                <button
                  type="submit"
                  disabled={isPublishing}
                  className="flex-1 min-h-[44px] rounded-xl bg-[#14492a] text-white text-xs font-bold hover:bg-[#0e3a20] transition shadow-xs disabled:opacity-50"
                >
                  {isPublishing ? 'Publishing...' : 'Publish Produce Listing'}
                </button>
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="min-h-[44px] px-4 rounded-xl bg-slate-100 text-slate-700 text-xs font-semibold hover:bg-slate-200 transition"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

import React, { useState } from 'react';
import { 
  Search, 
  Filter, 
  MapPin, 
  Tag, 
  MessageSquareText, 
  X, 
  ShieldCheck, 
  CheckCircle2, 
  AlertCircle,
  Clock,
  Sparkles,
  PhoneCall,
  SlidersHorizontal
} from 'lucide-react';
import { MarketListing, BuyerProfile, CropEnquiry, SupportedLanguage } from '../types';
import { storageService } from '../services/storage';
import { TRANSLATIONS } from '../constants/translations';

interface BuyerBrowseCropsScreenProps {
  listings: MarketListing[];
  buyerProfile: BuyerProfile;
  onEnquirySent: () => void;
  preselectedListing?: MarketListing | null;
  onClearPreselectedListing?: () => void;
  language?: SupportedLanguage;
}

const CATEGORIES: ('All' | MarketListing['cropCategory'])[] = [
  'All',
  'Grains & Cereals',
  'Pulses',
  'Vegetables',
  'Fruits',
  'Oilseeds',
  'Spices',
  'Seeds',
];

export const BuyerBrowseCropsScreen: React.FC<BuyerBrowseCropsScreenProps> = ({
  listings,
  buyerProfile,
  onEnquirySent,
  preselectedListing,
  onClearPreselectedListing,
  language = 'en',
}) => {
  const t = TRANSLATIONS[language]?.buyer || TRANSLATIONS.en.buyer;
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [filterSource, setFilterSource] = useState<'all' | 'verified' | 'demo'>('all');
  const [selectedGrade, setSelectedGrade] = useState<string>('All');

  // Enquiry Modal state
  const [enquiryModalOpen, setEnquiryModalOpen] = useState<boolean>(Boolean(preselectedListing));
  const [activeListing, setActiveListing] = useState<MarketListing | null>(preselectedListing || null);

  // Enquiry Form State
  const [buyerName, setBuyerName] = useState<string>(buyerProfile.name || '');
  const [buyerPhone, setBuyerPhone] = useState<string>(buyerProfile.contactNumber || '');
  const [buyerBusiness, setBuyerBusiness] = useState<string>(buyerProfile.businessName || '');
  const [requestedQty, setRequestedQty] = useState<number>(50);
  const [offeredPrice, setOfferedPrice] = useState<number>(0);
  const [enquiryMessage, setEnquiryMessage] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // When a preselected listing comes in from Home, open modal
  React.useEffect(() => {
    if (preselectedListing) {
      setActiveListing(preselectedListing);
      setRequestedQty(preselectedListing.quantity);
      setOfferedPrice(preselectedListing.expectedPrice);
      setEnquiryModalOpen(true);
    }
  }, [preselectedListing]);

  // Filter listings
  const filteredListings = listings.filter((item) => {
    const matchesCategory = selectedCategory === 'All' || item.cropCategory === selectedCategory;
    const matchesSearch =
      item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.variety.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.location.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.state.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.sellerName.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesSource =
      filterSource === 'all' ||
      (filterSource === 'verified' && !item.isDemonstration) ||
      (filterSource === 'demo' && item.isDemonstration);

    const matchesGrade = selectedGrade === 'All' || item.grade === selectedGrade;

    return matchesCategory && matchesSearch && matchesSource && matchesGrade;
  });

  const handleOpenEnquiryModal = (listing: MarketListing) => {
    setActiveListing(listing);
    setRequestedQty(listing.quantity);
    setOfferedPrice(listing.expectedPrice);
    setEnquiryMessage(`Hello ${listing.sellerName}, I am interested in procuring your lot of ${listing.title} (${listing.variety}). Please contact me with availability and sample details.`);
    setFeedback(null);
    setEnquiryModalOpen(true);
  };

  const handleCloseEnquiryModal = () => {
    setEnquiryModalOpen(false);
    setActiveListing(null);
    setFeedback(null);
    if (onClearPreselectedListing) onClearPreselectedListing();
  };

  const handleSubmitEnquiry = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeListing) return;

    if (!buyerPhone.trim()) {
      setFeedback({ type: 'error', message: 'Please provide a valid contact phone number so the farmer can reach you.' });
      return;
    }

    if (requestedQty <= 0) {
      setFeedback({ type: 'error', message: 'Requested quantity must be greater than 0.' });
      return;
    }

    setIsSubmitting(true);
    setFeedback(null);

    const result = await storageService.sendBuyerEnquiry(
      {
        listingId: activeListing.id,
        listingTitle: activeListing.title,
        farmerName: activeListing.sellerName,
        sellerPhone: activeListing.contactPhone,
        sellerId: activeListing.sellerId,
        buyerId: buyerProfile.id || 'buyer-user-1',
        buyerName: buyerName.trim() || 'Procurement Buyer',
        buyerPhone: buyerPhone.trim(),
        buyerBusiness: buyerBusiness.trim(),
        buyerLocation: buyerProfile.location,
        requestedQuantity: Number(requestedQty),
        unit: activeListing.unit,
        offeredPrice: offeredPrice > 0 ? Number(offeredPrice) : activeListing.expectedPrice,
        priceUnit: activeListing.priceUnit,
        message: enquiryMessage.trim() || 'Interested in procuring this crop.',
      },
      buyerProfile.id || 'buyer-user-1'
    );

    setIsSubmitting(false);

    if (result.success) {
      setFeedback({
        type: 'success',
        message: 'Your purchase enquiry has been registered and sent to the grower! You can view this in "My Enquiries".',
      });
      onEnquirySent();
      setTimeout(() => {
        handleCloseEnquiryModal();
      }, 2000);
    } else {
      setFeedback({
        type: 'error',
        message: result.error || 'Failed to submit enquiry. Please try again.',
      });
    }
  };

  return (
    <div className="space-y-4 pb-6">
      {/* Page Title & Search Bar */}
      <div className="bg-white rounded-3xl p-4 sm:p-5 border border-[#dce8d5] shadow-xs space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-lg sm:text-xl font-black text-[#144225] font-display">
              {t.browseCropsTitle || 'Browse Crop Produce'}
            </h1>
            <p className="text-xs text-slate-500">
              {t.browseCropsSubtitle || 'Direct from growers & FPOs in Vijayapura and surrounding agricultural markets'}
            </p>
          </div>
          <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200">
            {filteredListings.length} {t.availableLots}
          </span>
        </div>

        {/* Search Input */}
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={t.quickSearchPlaceholder || "Search by crop, variety, mandi, or farmer name..."}
            className="w-full pl-10 pr-4 py-2.5 bg-[#f6f9f3] rounded-xl text-xs sm:text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-600/30 font-medium"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Source Filter Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs font-semibold">
          <button
            onClick={() => setFilterSource('all')}
            className={`px-3 py-1.5 rounded-xl transition shrink-0 ${
              filterSource === 'all'
                ? 'bg-[#14492a] text-white shadow-xs'
                : 'bg-[#f4f7f1] text-slate-600 hover:bg-[#e9f1e5]'
            }`}
          >
            {t.allCategories || 'All Produce'} ({listings.length})
          </button>
          <button
            onClick={() => setFilterSource('verified')}
            className={`px-3 py-1.5 rounded-xl transition shrink-0 flex items-center gap-1 ${
              filterSource === 'verified'
                ? 'bg-emerald-700 text-white shadow-xs'
                : 'bg-[#f4f7f1] text-slate-600 hover:bg-[#e9f1e5]'
            }`}
          >
            <Sparkles className="w-3 h-3" />
            {t.verifiedGrowersOnly || 'Direct Farmer Lots'} ({listings.filter((l) => !l.isDemonstration).length})
          </button>
          <button
            onClick={() => setFilterSource('demo')}
            className={`px-3 py-1.5 rounded-xl transition shrink-0 ${
              filterSource === 'demo'
                ? 'bg-slate-700 text-white shadow-xs'
                : 'bg-[#f4f7f1] text-slate-600 hover:bg-[#e9f1e5]'
            }`}
          >
            {t.demoLotsOnly || 'Sample Demo Lots'} ({listings.filter((l) => l.isDemonstration).length})
          </button>
        </div>

        {/* Category Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
          {CATEGORIES.map((cat) => {
            const isSelected = selectedCategory === cat;
            return (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-3 py-1.5 rounded-full whitespace-nowrap font-medium transition ${
                  isSelected
                    ? 'bg-emerald-100 text-emerald-900 font-bold border border-emerald-300'
                    : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
                }`}
              >
                {cat}
              </button>
            );
          })}
        </div>
      </div>

      {/* Listing Cards Grid */}
      <div className="space-y-3">
        {filteredListings.length === 0 ? (
          <div className="bg-white rounded-3xl p-8 text-center border border-[#dce8d5] space-y-3">
            <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
              <Search className="w-6 h-6" />
            </div>
            <h3 className="text-sm font-bold text-slate-800">No Produce Listings Match Your Filter</h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              Try adjusting your search terms, selecting "All Categories", or checking "All Produce".
            </p>
            <button
              onClick={() => {
                setSearchQuery('');
                setSelectedCategory('All');
                setFilterSource('all');
                setSelectedGrade('All');
              }}
              className="px-4 py-2 bg-[#14492a] text-white rounded-xl text-xs font-bold"
            >
              Reset Filters
            </button>
          </div>
        ) : (
          filteredListings.map((listing) => (
            <div
              key={listing.id}
              className="bg-white rounded-2xl p-4 sm:p-5 border border-[#dce8d5] shadow-2xs hover:shadow-md transition space-y-3.5"
            >
              {/* Top Row: Category & Badges, Price */}
              <div className="flex items-start justify-between gap-3">
                <div className="space-y-1">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800">
                      {listing.cropCategory}
                    </span>
                    <span className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-slate-100 text-slate-700">
                      {listing.grade}
                    </span>
                    {listing.isDemonstration ? (
                      <span className="text-[9px] font-semibold px-2 py-0.5 rounded-md bg-amber-50 text-amber-800 border border-amber-200">
                        Sample / Demo Listing
                      </span>
                    ) : (
                      <span className="text-[9px] font-bold px-2 py-0.5 rounded-md bg-[#14492a] text-white">
                        Verified Real Farmer
                      </span>
                    )}
                  </div>

                  <h3 className="text-base sm:text-lg font-bold text-[#144225]">
                    {listing.title}
                  </h3>
                  <p className="text-xs text-slate-600">
                    Variety: <span className="font-semibold text-slate-800">{listing.variety}</span>
                  </p>
                </div>

                <div className="text-right shrink-0 bg-[#f4f8f1] px-3 py-2 rounded-xl border border-[#d8e6d2]">
                  <div className="text-lg sm:text-xl font-black text-[#144225]">
                    ₹{listing.expectedPrice.toLocaleString('en-IN')}
                  </div>
                  <div className="text-[10px] font-semibold text-slate-500 uppercase">
                    {listing.priceUnit}
                  </div>
                </div>
              </div>

              {/* Middle Row: Quantity, Location, Availability */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 bg-[#fbfdfa] p-3 rounded-xl border border-[#e5edd9] text-xs">
                <div>
                  <span className="text-[10px] text-slate-500 block font-medium">Available Quantity:</span>
                  <span className="font-bold text-slate-800 text-sm">
                    {listing.quantity} {listing.unit}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-500 block font-medium">Location / Mandi:</span>
                  <span className="font-semibold text-slate-800 flex items-center gap-1 truncate">
                    <MapPin className="w-3.5 h-3.5 text-emerald-700 shrink-0" />
                    <span className="truncate">{listing.location}, {listing.state}</span>
                  </span>
                </div>
                <div className="col-span-2 sm:col-span-1">
                  <span className="text-[10px] text-slate-500 block font-medium">Harvest Availability:</span>
                  <span className="font-semibold text-emerald-800 flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                    <span>{listing.harvestAvailability || 'Ready for Immediate Dispatch'}</span>
                  </span>
                </div>
              </div>

              {/* Description */}
              {listing.description && (
                <p className="text-xs text-slate-600 leading-relaxed bg-[#fbfbfb] p-2.5 rounded-xl border border-slate-100">
                  {listing.description}
                </p>
              )}

              {/* AGROVA Scan-Based Crop Health Assessment */}
              <div className="p-3 rounded-xl bg-[#f5f9f3] border border-[#d8e8d3] space-y-1.5 text-xs">
                <div className="flex items-center justify-between flex-wrap gap-1.5">
                  <div className="flex items-center gap-1.5 font-bold text-[#144225]">
                    <ShieldCheck className="w-4 h-4 text-emerald-700 shrink-0" />
                    <span>AGROVA Crop-Health Assessment</span>
                  </div>
                  {listing.cropHealthAssessment ? (
                    <div className="flex items-center gap-1.5">
                      <span className="font-extrabold text-[#113d23] text-sm tabular-nums">
                        {listing.cropHealthAssessment.score}%
                      </span>
                      <span className="px-2 py-0.5 rounded-full text-xs font-black bg-emerald-100 text-emerald-800 border border-emerald-300">
                        Grade {listing.cropHealthAssessment.grade}
                      </span>
                    </div>
                  ) : (
                    <span className="text-[11px] font-semibold text-slate-500 italic">
                      Not assessed yet
                    </span>
                  )}
                </div>

                <p className="text-[11px] text-slate-600 leading-relaxed">
                  {listing.cropHealthAssessment
                    ? `Assessment score: ${listing.cropHealthAssessment.score}% (Grade ${listing.cropHealthAssessment.grade}). Represents AGROVA's scan-based plant health assessment from leaf scans (${listing.cropHealthAssessment.evaluatedAt}). Proposed thresholds: 95–100%: A+, 85–94%: A, 70–84%: B, 50–69%: C, <50%: D (product thresholds, not an established agricultural standard). Separate from produce quality, harvest yield, pesticide safety, or organic certification; does not guarantee crop quality.`
                    : 'Not assessed yet — No verified plant leaf scans registered for this crop lot. In-field foliage health has not been assessed.'}
                </p>
              </div>

              {/* Seller Information & Action */}
              <div className="flex flex-wrap items-center justify-between gap-3 pt-1 border-t border-slate-100">
                <div className="text-xs text-slate-700">
                  <span className="text-slate-500">Seller: </span>
                  <span className="font-bold text-[#144225]">{listing.sellerName}</span>
                  <span className="text-slate-400 mx-1.5">•</span>
                  <span className="font-medium text-slate-600">{listing.sellerType}</span>
                </div>

                <button
                  onClick={() => handleOpenEnquiryModal(listing)}
                  className="px-4 py-2 bg-[#14492a] hover:bg-[#0f3820] text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-xs"
                >
                  <MessageSquareText className="w-4 h-4" />
                  <span>Send Purchase Enquiry</span>
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Enquiry Modal */}
      {enquiryModalOpen && activeListing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-lg w-full max-h-[92vh] flex flex-col shadow-2xl border border-[#dce8d5] overflow-hidden">
            {/* Modal Header */}
            <div className="p-4 sm:p-5 bg-gradient-to-r from-[#14492a] to-[#0f3a21] text-white flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold font-display">{t.enquiryModalTitle || 'Send Purchase Enquiry'}</h3>
                <p className="text-xs text-emerald-200">
                  {t.enquiryModalSubtitle || `Connecting directly with ${activeListing.sellerName}`}
                </p>
              </div>
              <button
                onClick={handleCloseEnquiryModal}
                className="w-8 h-8 rounded-full flex items-center justify-center text-emerald-200 hover:text-white hover:bg-white/10"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Body */}
            <form onSubmit={handleSubmitEnquiry} className="p-4 sm:p-5 space-y-4 overflow-y-auto flex-1">
              {/* Listing Snapshot */}
              <div className="bg-[#f6f9f3] p-3 rounded-2xl border border-[#dce8d5] flex items-center justify-between text-xs">
                <div>
                  <div className="font-bold text-[#144225] text-sm">{activeListing.title}</div>
                  <div className="text-slate-500">
                    {activeListing.variety} • {activeListing.location}
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-black text-[#144225]">
                    ₹{activeListing.expectedPrice} / {activeListing.unit}
                  </div>
                  <div className="text-[10px] text-slate-500">
                    Max: {activeListing.quantity} {activeListing.unit}
                  </div>
                </div>
              </div>

              {/* Feedback Alert */}
              {feedback && (
                <div
                  className={`p-3 rounded-xl text-xs flex items-center gap-2 ${
                    feedback.type === 'success'
                      ? 'bg-emerald-50 text-emerald-900 border border-emerald-200'
                      : 'bg-red-50 text-red-900 border border-red-200'
                  }`}
                >
                  {feedback.type === 'success' ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0" />
                  ) : (
                    <AlertCircle className="w-4 h-4 text-red-700 shrink-0" />
                  )}
                  <span>{feedback.message}</span>
                </div>
              )}

              {/* Quantity & Price Offer */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    {t.requestedQtyLabel || `Requested Quantity (${activeListing.unit}) *`}
                  </label>
                  <input
                    type="number"
                    min="1"
                    max={activeListing.quantity * 2}
                    value={requestedQty}
                    onChange={(e) => setRequestedQty(Number(e.target.value))}
                    required
                    className="w-full px-3 py-2 bg-[#f8faf6] border border-[#d2dfcc] rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-600/30"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    {t.offeredPriceLabel || `Your Offered Price (₹ / ${activeListing.unit})`}
                  </label>
                  <input
                    type="number"
                    min="100"
                    value={offeredPrice}
                    onChange={(e) => setOfferedPrice(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-[#f8faf6] border border-[#d2dfcc] rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-600/30"
                  />
                  <span className="text-[10px] text-slate-400 mt-0.5 block">
                    Listing price: ₹{activeListing.expectedPrice}
                  </span>
                </div>
              </div>

              {/* Buyer Contact Details */}
              <div className="space-y-2.5 pt-2 border-t border-slate-100">
                <span className="text-xs font-bold text-slate-800 block">
                  {t.directGrowerContact || 'Your Buyer Contact Details (Shared with Grower)'}
                </span>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                      {t.buyerNameLabel || 'Your Name'}
                    </label>
                    <input
                      type="text"
                      value={buyerName}
                      onChange={(e) => setBuyerName(e.target.value)}
                      required
                      className="w-full px-3 py-2 bg-[#f8faf6] border border-[#d2dfcc] rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-emerald-600/30"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                      {t.buyerBusinessLabel || 'Business / Mandi Name'}
                    </label>
                    <input
                      type="text"
                      value={buyerBusiness}
                      onChange={(e) => setBuyerBusiness(e.target.value)}
                      placeholder="E.g., Kulkarni Agro Traders"
                      className="w-full px-3 py-2 bg-[#f8faf6] border border-[#d2dfcc] rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-emerald-600/30"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                    {t.buyerPhoneLabel || 'Contact Phone Number *'}
                  </label>
                  <input
                    type="tel"
                    value={buyerPhone}
                    onChange={(e) => setBuyerPhone(e.target.value)}
                    required
                    placeholder="+91 94481 XXXXX"
                    className="w-full px-3 py-2 bg-[#f8faf6] border border-[#d2dfcc] rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-emerald-600/30"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                    {t.messageLabel || 'Message / Procurement Requirements'}
                  </label>
                  <textarea
                    rows={3}
                    value={enquiryMessage}
                    onChange={(e) => setEnquiryMessage(e.target.value)}
                    placeholder="Specify delivery timeline, packing preference, or sample requirement..."
                    className="w-full px-3 py-2 bg-[#f8faf6] border border-[#d2dfcc] rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-emerald-600/30 resize-none"
                  />
                </div>
              </div>

              {/* Privacy Disclosure */}
              <div className="bg-[#f0f6eb] p-3 rounded-xl border border-[#d5e6cb] text-[11px] text-[#36593e] flex items-start gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-700 shrink-0 mt-0.5" />
                <span>
                  Consent Notice: Your contact phone and procurement interest will be shared directly with the grower ({activeListing.sellerName}). AgriConnect does not process financial escrow or automated bank debits.
                </span>
              </div>

              {/* Submit Buttons */}
              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={handleCloseEnquiryModal}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition"
                >
                  {t.cancelBtn || 'Cancel'}
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 bg-[#14492a] hover:bg-[#0f3820] text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-xs disabled:opacity-50"
                >
                  {isSubmitting ? 'Sending...' : (t.submitEnquiryBtn || 'Confirm & Submit Enquiry')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

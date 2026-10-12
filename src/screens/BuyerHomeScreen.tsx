import React, { useState } from 'react';
import { 
  Store, 
  Search, 
  MapPin, 
  TrendingUp, 
  MessageSquareText, 
  ShieldCheck, 
  Sparkles,
  ArrowRight,
  Filter,
  CheckCircle2,
  Calendar,
  AlertCircle
} from 'lucide-react';
import { BuyerProfile, MarketListing, CropEnquiry, NavigationTab, SupportedLanguage } from '../types';
import { TRANSLATIONS } from '../constants/translations';

interface BuyerHomeScreenProps {
  buyerProfile: BuyerProfile;
  listings: MarketListing[];
  enquiries: CropEnquiry[];
  onNavigateTab: (tab: NavigationTab) => void;
  onSelectListingForEnquiry: (listing: MarketListing) => void;
  language?: SupportedLanguage;
}

const MANDI_PRICE_TRENDS = [
  { crop: 'Vijayapura Red Onion', mandi: 'Vijayapura APMC', modalPrice: '₹2,350 / qtl', change: '+₹120', trend: 'up' },
  { crop: 'Sharbati Golden Wheat', mandi: 'Bhopal / Sehore', modalPrice: '₹2,850 / qtl', change: '+₹50', trend: 'up' },
  { crop: 'Desi Bengal Gram (Chana)', mandi: 'Akola / Bidar', modalPrice: '₹5,900 / qtl', change: '-₹40', trend: 'down' },
  { crop: 'Yellow Soybean JS-335', mandi: 'Indore / Hubballi', modalPrice: '₹4,650 / qtl', change: '+₹75', trend: 'up' },
];

export const BuyerHomeScreen: React.FC<BuyerHomeScreenProps> = ({
  buyerProfile,
  listings,
  enquiries,
  onNavigateTab,
  onSelectListingForEnquiry,
  language = 'en',
}) => {
  const t = TRANSLATIONS[language]?.buyer || TRANSLATIONS.en.buyer;
  const [quickSearch, setQuickSearch] = useState('');

  // Top fresh harvests available
  const recentListings = listings.slice(0, 4);
  const pendingEnquiriesCount = enquiries.filter(e => e.status === 'Pending Response').length;
  const verifiedListingsCount = listings.filter(l => !l.isDemonstration).length;

  return (
    <div className="space-y-4 pb-6">
      {/* Buyer Welcome Banner */}
      <section className="bg-gradient-to-br from-[#14492a] via-[#103d22] to-[#0a2c18] rounded-3xl p-5 sm:p-6 text-white shadow-md relative overflow-hidden">
        <div className="absolute right-0 top-0 translate-x-8 -translate-y-6 w-48 h-48 bg-emerald-500/10 rounded-full blur-2xl pointer-events-none" />
        
        <div className="relative z-10">
          <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/20 text-emerald-200 border border-emerald-400/20 text-[11px] font-semibold">
              <Store className="w-3.5 h-3.5" /> {t.subheading || 'Buyer & Wholesale Procurement'}
            </span>
            <span className="text-[11px] text-emerald-200/80">
              {buyerProfile.location || 'Vijayapura APMC'}, {buyerProfile.state || 'Karnataka'}
            </span>
          </div>

          <h1 className="text-xl sm:text-2xl font-black font-display tracking-tight text-white">
            {t.welcome}, {buyerProfile.name || 'Agri Buyer'}
          </h1>
          <p className="text-xs sm:text-sm text-emerald-100/90 mt-1 max-w-lg">
            {buyerProfile.businessName || 'Wholesale Commodity Buyer'} • {t.browseCropsSubtitle || 'Direct grower sourcing platform connecting you with verified farmers in Karnataka and regional mandis.'}
          </p>

          {/* Quick Stats Grid */}
          <div className="grid grid-cols-3 gap-2 sm:gap-3 mt-4 pt-4 border-t border-emerald-800/60">
            <div className="bg-black/20 backdrop-blur-2xs rounded-2xl p-2.5 sm:p-3 text-center border border-white/5">
              <div className="text-lg sm:text-xl font-black text-white">{listings.length}</div>
              <div className="text-[10px] sm:text-[11px] text-emerald-200/80 uppercase tracking-wider font-semibold">
                {t.availableLots}
              </div>
            </div>
            <div className="bg-black/20 backdrop-blur-2xs rounded-2xl p-2.5 sm:p-3 text-center border border-white/5">
              <div className="text-lg sm:text-xl font-black text-emerald-300">{enquiries.length}</div>
              <div className="text-[10px] sm:text-[11px] text-emerald-200/80 uppercase tracking-wider font-semibold">
                {t.myEnquiries}
              </div>
            </div>
            <div className="bg-black/20 backdrop-blur-2xs rounded-2xl p-2.5 sm:p-3 text-center border border-white/5">
              <div className="text-lg sm:text-xl font-black text-amber-300">
                {pendingEnquiriesCount}
              </div>
              <div className="text-[10px] sm:text-[11px] text-emerald-200/80 uppercase tracking-wider font-semibold">
                {t.awaitingReply}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Quick Search & Filter Action Bar */}
      <section className="bg-white rounded-2xl p-3 shadow-xs border border-[#dce8d5]">
        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={quickSearch}
              onChange={(e) => setQuickSearch(e.target.value)}
              placeholder={t.quickSearchPlaceholder || "Search onions, wheat, chana, soybean..."}
              className="w-full pl-9 pr-3 py-2 bg-[#f4f7f1] rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-600/30 font-medium"
            />
          </div>
          <button
            onClick={() => onNavigateTab('browse-crops')}
            className="px-4 py-2 bg-[#14492a] hover:bg-[#0f3820] text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 shrink-0"
          >
            <span>{t.browseCropsTitle || 'Browse All'}</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </section>

      {/* APMC Mandi Modal Price Benchmarks */}
      <section className="bg-white rounded-3xl p-4 sm:p-5 shadow-xs border border-[#dce8d5]">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-emerald-100 text-emerald-800 flex items-center justify-center">
              <TrendingUp className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-[#144225] font-display">
                {t.mandiPriceTrendsTitle || 'Regional APMC Mandi Modal Rates'}
              </h2>
              <p className="text-[10px] text-slate-500">Benchmark wholesale mandi rates for trade reference</p>
            </div>
          </div>
          <button
            onClick={() => onNavigateTab('marketplace')}
            className="text-xs text-emerald-700 font-bold hover:underline flex items-center gap-1"
          >
            <span>Details</span>
            <ArrowRight className="w-3 h-3" />
          </button>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {MANDI_PRICE_TRENDS.map((item, idx) => (
            <div key={idx} className="p-2.5 rounded-xl bg-[#f8faf6] border border-[#e2ebd9]">
              <div className="text-[11px] font-bold text-[#144225] truncate">{item.crop}</div>
              <div className="text-[9px] text-slate-500 truncate">{item.mandi}</div>
              <div className="text-xs font-black text-slate-800 mt-1">{item.modalPrice}</div>
              <span className={`text-[10px] font-semibold ${item.trend === 'up' ? 'text-emerald-700' : 'text-amber-700'}`}>
                {item.change} today
              </span>
            </div>
          ))}
        </div>
      </section>

      {/* Fresh Harvest Listings Directly from Growers */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-sm font-bold text-[#144225] font-display flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-emerald-600" />
              <span>{t.availableLots}</span>
            </h2>
            <p className="text-[11px] text-slate-500">
              {t.browseCropsSubtitle || 'Listings from farmers in Vijayapura & regional producer collectives'}
            </p>
          </div>
          <button
            onClick={() => onNavigateTab('browse-crops')}
            className="text-xs font-bold text-emerald-700 hover:text-emerald-900"
          >
            {t.browseCropsTitle} ({listings.length})
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {recentListings.map((listing) => (
            <div
              key={listing.id}
              className="bg-white rounded-2xl p-4 border border-[#dce8d5] shadow-2xs hover:shadow-md transition space-y-3"
            >
              <div className="flex items-start justify-between gap-2">
                <div>
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800">
                      {listing.cropCategory}
                    </span>
                    {listing.isDemonstration ? (
                      <span className="text-[9px] font-medium px-1.5 py-0.5 rounded-md bg-slate-100 text-slate-600 border border-slate-200">
                        {t.demoLotsOnly || 'Sample / Demo'}
                      </span>
                    ) : (
                      <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-md bg-emerald-700 text-white">
                        {t.verifiedGrowersOnly || 'Verified Farmer'}
                      </span>
                    )}
                  </div>
                  <h3 className="text-sm font-bold text-[#144225] mt-1 line-clamp-1">
                    {listing.title}
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    Variety: <span className="font-medium text-slate-700">{listing.variety}</span> • Grade: <span className="font-medium text-slate-700">{listing.grade}</span>
                  </p>
                </div>

                <div className="text-right shrink-0">
                  <div className="text-base font-black text-[#144225]">
                    ₹{listing.expectedPrice.toLocaleString('en-IN')}
                  </div>
                  <div className="text-[10px] text-slate-500">{listing.priceUnit}</div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs text-slate-700 bg-[#f8faf6] p-2.5 rounded-xl border border-[#e5edd9]">
                <div>
                  <span className="text-[10px] text-slate-500 block">Available Quantity:</span>
                  <span className="font-bold text-slate-800">{listing.quantity} {listing.unit}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-500 block">Seller / Location:</span>
                  <span className="font-semibold text-slate-800 truncate block">
                    {listing.sellerName}
                  </span>
                </div>
              </div>

              <div className="flex items-center justify-between pt-1">
                <span className="text-[11px] text-slate-500 flex items-center gap-1">
                  <MapPin className="w-3 h-3 text-emerald-700 shrink-0" />
                  <span className="truncate max-w-[140px]">{listing.location}</span>
                </span>
                <button
                  onClick={() => onSelectListingForEnquiry(listing)}
                  className="px-3.5 py-1.5 bg-[#14492a] hover:bg-[#0f3820] text-white rounded-xl text-xs font-bold transition flex items-center gap-1 shadow-2xs"
                >
                  <MessageSquareText className="w-3.5 h-3.5" />
                  <span>{t.sendEnquiry}</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Procurement Process Transparency Callout */}
      <section className="bg-[#f0f6eb] rounded-2xl p-4 border border-[#d6e5cd] text-xs text-[#2c5236] space-y-2">
        <div className="flex items-center gap-2 font-bold text-sm text-[#144225]">
          <ShieldCheck className="w-4.5 h-4.5 text-emerald-700 shrink-0" />
          <span>Direct Farmer Trade Guarantee & Integrity</span>
        </div>
        <p className="leading-relaxed text-[11px] text-[#416149]">
          AGROVA facilitates direct coordination between agricultural buyers and cultivators without middleman commissions. Sending an enquiry provides your business contact information directly to the grower so you can confirm lot grading, arrange sampling, and agree on mandi settlement terms.
        </p>
      </section>
    </div>
  );
};

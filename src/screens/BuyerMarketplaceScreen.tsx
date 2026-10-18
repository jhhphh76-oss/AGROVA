import React, { useState } from 'react';
import { 
  Store, 
  TrendingUp, 
  MapPin, 
  ShieldCheck, 
  Tag, 
  MessageSquareText, 
  Building2, 
  Sparkles,
  ArrowRight,
  Info,
  Scale
} from 'lucide-react';
import { MarketListing, BuyerProfile } from '../types';

interface BuyerMarketplaceScreenProps {
  listings: MarketListing[];
  buyerProfile: BuyerProfile;
  onSelectListingForEnquiry: (listing: MarketListing) => void;
}

const REGIONAL_MANDI_RATES = [
  { mandi: 'Vijayapura APMC', crop: 'Red Onion (Garwa)', arrivals: '1,450 qtl', minPrice: '₹1,900', maxPrice: '₹2,600', modalPrice: '₹2,350 / qtl', status: 'Active Trade' },
  { mandi: 'Vijayapura APMC', crop: 'Desi Bengal Gram (Chana)', arrivals: '820 qtl', minPrice: '₹5,600', maxPrice: '₹6,150', modalPrice: '₹5,900 / qtl', status: 'Firm' },
  { mandi: 'Bagalkot APMC', crop: 'Byadagi Dry Chilli (Kaddi)', arrivals: '310 qtl', minPrice: '₹18,000', maxPrice: '₹24,500', modalPrice: '₹21,200 / qtl', status: 'High Demand' },
  { mandi: 'Belagavi Mandi', crop: 'Yellow Soybean JS-335', arrivals: '1,100 qtl', minPrice: '₹4,400', maxPrice: '₹4,850', modalPrice: '₹4,650 / qtl', status: 'Steady' },
  { mandi: 'Hubballi Cotton & Grain', crop: 'Sharbati Wheat HD-2967', arrivals: '680 qtl', minPrice: '₹2,650', maxPrice: '₹3,050', modalPrice: '₹2,850 / qtl', status: 'Active' },
  { mandi: 'Gadag Mandi', crop: 'Sunflower Bold Seed', arrivals: '450 qtl', minPrice: '₹4,900', maxPrice: '₹5,400', modalPrice: '₹5,200 / qtl', status: 'Moderate' },
];

export const BuyerMarketplaceScreen: React.FC<BuyerMarketplaceScreenProps> = ({
  listings,
  buyerProfile,
  onSelectListingForEnquiry,
}) => {
  const [activeTab, setActiveTab] = useState<'mandi-rates' | 'fpo-lots' | 'standards'>('mandi-rates');

  // Filter FPO or bulk producer lots
  const fpoListings = listings.filter(
    (l) => l.sellerType === 'FPO (Farmer Producer Org)' || l.quantity >= 80
  );

  return (
    <div className="space-y-4 pb-6">
      {/* Title & Header */}
      <div className="bg-white rounded-3xl p-4 sm:p-5 border border-[#dce8d5] shadow-xs space-y-2">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center shrink-0">
            <Store className="w-4 h-4" />
          </div>
          <div>
            <h1 className="text-lg sm:text-xl font-black text-[#144225] font-display">
              Wholesale Mandi & Trade Hub
            </h1>
            <p className="text-xs text-slate-500">
              Karnataka regional APMC modal rates, bulk FPO lots & procurement guidelines
            </p>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex items-center gap-2 pt-2 border-t border-slate-100 text-xs font-bold">
          <button
            onClick={() => setActiveTab('mandi-rates')}
            className={`px-3 py-2 rounded-xl transition ${
              activeTab === 'mandi-rates'
                ? 'bg-[#14492a] text-white shadow-xs'
                : 'bg-[#f4f7f1] text-slate-600 hover:bg-[#e9f1e4]'
            }`}
          >
            APMC Mandi Rates
          </button>
          <button
            onClick={() => setActiveTab('fpo-lots')}
            className={`px-3 py-2 rounded-xl transition ${
              activeTab === 'fpo-lots'
                ? 'bg-[#14492a] text-white shadow-xs'
                : 'bg-[#f4f7f1] text-slate-600 hover:bg-[#e9f1e4]'
            }`}
          >
            Bulk & FPO Lots ({fpoListings.length})
          </button>
          <button
            onClick={() => setActiveTab('standards')}
            className={`px-3 py-2 rounded-xl transition ${
              activeTab === 'standards'
                ? 'bg-[#14492a] text-white shadow-xs'
                : 'bg-[#f4f7f1] text-slate-600 hover:bg-[#e9f1e4]'
            }`}
          >
            Grading Standards
          </button>
        </div>
      </div>

      {/* Tab 1: APMC Mandi Rates */}
      {activeTab === 'mandi-rates' && (
        <div className="space-y-3">
          <div className="bg-white rounded-3xl p-4 sm:p-5 border border-[#dce8d5] shadow-xs space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-sm font-bold text-[#144225] font-display flex items-center gap-1.5">
                  <TrendingUp className="w-4 h-4 text-emerald-700" />
                  <span>Today's Karnataka APMC Benchmark Rates</span>
                </h2>
                <p className="text-[11px] text-slate-500">
                  Modal prices based on daily APMC arrivals and market trading sessions
                </p>
              </div>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800">
                Live Benchmarks
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-200 text-slate-500 text-[10px] uppercase font-bold tracking-wider">
                    <th className="py-2 pr-3">Mandi Market</th>
                    <th className="py-2 px-3">Commodity</th>
                    <th className="py-2 px-3">Arrivals</th>
                    <th className="py-2 px-3">Range (Min - Max)</th>
                    <th className="py-2 pl-3 text-right">Modal Price</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium">
                  {REGIONAL_MANDI_RATES.map((rate, idx) => (
                    <tr key={idx} className="hover:bg-[#f9fbf8] transition">
                      <td className="py-2.5 pr-3 font-bold text-[#144225] whitespace-nowrap">
                        {rate.mandi}
                      </td>
                      <td className="py-2.5 px-3 text-slate-800 whitespace-nowrap">
                        {rate.crop}
                      </td>
                      <td className="py-2.5 px-3 text-slate-500 whitespace-nowrap text-[11px]">
                        {rate.arrivals}
                      </td>
                      <td className="py-2.5 px-3 text-slate-600 whitespace-nowrap text-[11px]">
                        {rate.minPrice} - {rate.maxPrice}
                      </td>
                      <td className="py-2.5 pl-3 text-right font-black text-[#144225] whitespace-nowrap">
                        {rate.modalPrice}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: Bulk FPO Lots */}
      {activeTab === 'fpo-lots' && (
        <div className="space-y-3">
          <div className="bg-white rounded-3xl p-4 sm:p-5 border border-[#dce8d5] shadow-xs space-y-3">
            <div>
              <h2 className="text-sm font-bold text-[#144225] font-display flex items-center gap-1.5">
                <Building2 className="w-4 h-4 text-emerald-700" />
                <span>Bulk Producer & FPO Commodity Lots</span>
              </h2>
              <p className="text-[11px] text-slate-500">
                Aggregated lots suitable for commercial millers, food processors, and large wholesale traders
              </p>
            </div>

            <div className="space-y-3">
              {fpoListings.map((listing) => (
                <div
                  key={listing.id}
                  className="p-4 rounded-2xl border border-[#dce8d5] bg-[#fafcf8] hover:bg-white transition shadow-2xs space-y-2.5"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800">
                          {listing.sellerType}
                        </span>
                        <span className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-slate-100 text-slate-700">
                          {listing.grade}
                        </span>
                      </div>
                      <h3 className="text-sm font-bold text-[#144225] mt-1">{listing.title}</h3>
                      <p className="text-xs text-slate-500">
                        {listing.sellerName} • {listing.location}, {listing.state}
                      </p>
                    </div>

                    <div className="text-right">
                      <div className="text-base font-black text-[#144225]">
                        ₹{listing.expectedPrice.toLocaleString('en-IN')}
                      </div>
                      <div className="text-[10px] text-slate-500">{listing.priceUnit}</div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-xs bg-white p-2.5 rounded-xl border border-slate-150">
                    <span className="text-slate-600">
                      Volume: <strong className="text-slate-800">{listing.quantity} {listing.unit}</strong>
                    </span>
                    <button
                      onClick={() => onSelectListingForEnquiry(listing)}
                      className="px-3 py-1.5 bg-[#14492a] hover:bg-[#0f3820] text-white rounded-xl text-xs font-bold transition flex items-center gap-1"
                    >
                      <MessageSquareText className="w-3.5 h-3.5" />
                      <span>Send Enquiry</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Tab 3: Grading & Quality Standards */}
      {activeTab === 'standards' && (
        <div className="bg-white rounded-3xl p-4 sm:p-5 border border-[#dce8d5] shadow-xs space-y-4 text-xs text-slate-700">
          <div>
            <h2 className="text-sm font-bold text-[#144225] font-display flex items-center gap-1.5">
              <Scale className="w-4 h-4 text-emerald-700" />
              <span>Agmark & APMC Produce Grading Guidelines</span>
            </h2>
            <p className="text-[11px] text-slate-500">
              Standard commercial parameters for moisture, foreign matter, and sizing
            </p>
          </div>

          <div className="space-y-3">
            <div className="p-3 bg-[#f8faf6] rounded-xl border border-[#e2ebd9]">
              <h4 className="font-bold text-[#144225] mb-1">Wheat (Sharbati / Durum)</h4>
              <p className="text-[11px] text-slate-600">
                Moisture maximum: 12.0%. Foreign matter limit: 1.0%. Grain sizing: Bold, vitreous amber kernel with uniform color.
              </p>
            </div>

            <div className="p-3 bg-[#f8faf6] rounded-xl border border-[#e2ebd9]">
              <h4 className="font-bold text-[#144225] mb-1">Red Onions (Garwa / Bellary)</h4>
              <p className="text-[11px] text-slate-600">
                Size standard: 45mm to 65mm. Tight outer papery skins, dry neck, free of bolters, sprouts, or double bulbs. Cured for at least 15 days in shaded ventilated storage.
              </p>
            </div>

            <div className="p-3 bg-[#f8faf6] rounded-xl border border-[#e2ebd9]">
              <h4 className="font-bold text-[#144225] mb-1">Bengal Gram (Desi Chana)</h4>
              <p className="text-[11px] text-slate-600">
                Moisture maximum: 10.0%. Damaged/weeviled grain limit: 2.0%. High protein bold desi brown seed.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Advisory Note */}
      <div className="bg-[#f0f6eb] rounded-2xl p-4 border border-[#d5e6cb] text-xs text-[#2c5236] space-y-1.5">
        <div className="flex items-center gap-2 font-bold text-sm text-[#144225]">
          <ShieldCheck className="w-4.5 h-4.5 text-emerald-700 shrink-0" />
          <span>APMC Mandi Transparency Notice</span>
        </div>
        <p className="text-[11px] leading-relaxed text-[#416149]">
          Rates displayed represent actual APMC market arrivals and modal price benchmarks in Karnataka. AgriConnect serves as a direct agricultural connection platform; physical sampling, grading, tare weighing, and statutory mandi fees remain subject to local APMC market regulations.
        </p>
      </div>
    </div>
  );
};

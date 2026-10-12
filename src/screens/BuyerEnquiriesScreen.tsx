import React, { useState } from 'react';
import { 
  MessageSquareText, 
  Clock, 
  CheckCircle2, 
  XCircle, 
  PhoneCall, 
  User, 
  Calendar, 
  ShieldCheck, 
  ArrowRight,
  Filter,
  RefreshCw,
  Tag
} from 'lucide-react';
import { CropEnquiry, NavigationTab, SupportedLanguage } from '../types';
import { TRANSLATIONS } from '../constants/translations';

interface BuyerEnquiriesScreenProps {
  enquiries: CropEnquiry[];
  onRefresh: () => void;
  onNavigateTab: (tab: NavigationTab) => void;
  language?: SupportedLanguage;
}

export const BuyerEnquiriesScreen: React.FC<BuyerEnquiriesScreenProps> = ({
  enquiries,
  onRefresh,
  onNavigateTab,
  language = 'en',
}) => {
  const t = TRANSLATIONS[language]?.buyer || TRANSLATIONS.en.buyer;
  const [statusFilter, setStatusFilter] = useState<'All' | 'Pending Response' | 'Accepted' | 'Contacted'>('All');
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await onRefresh();
    setTimeout(() => setIsRefreshing(false), 600);
  };

  const filteredEnquiries = enquiries.filter((item) => {
    if (statusFilter === 'All') return true;
    return item.status === statusFilter;
  });

  return (
    <div className="space-y-4 pb-6">
      {/* Header */}
      <div className="bg-white rounded-3xl p-4 sm:p-5 border border-[#dce8d5] shadow-xs flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-lg sm:text-xl font-black text-[#144225] font-display flex items-center gap-2">
            <MessageSquareText className="w-5 h-5 text-emerald-700" />
            <span>{t.myEnquiriesTitle || 'My Purchase Enquiries'}</span>
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            {t.myEnquiriesSubtitle || 'Track communication and procurement quotes submitted directly to growers'}
          </p>
        </div>

        <button
          onClick={handleRefresh}
          disabled={isRefreshing}
          className="px-3 py-1.5 bg-[#f4f7f1] hover:bg-[#e9f1e4] text-[#144225] rounded-xl text-xs font-bold transition flex items-center gap-1.5 border border-[#d5e4cf]"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />
          <span>Refresh</span>
        </button>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs font-semibold">
        {[
          { key: 'All' as const, label: t.filterAll || 'All' },
          { key: 'Pending Response' as const, label: t.filterPending || 'Pending Response' },
          { key: 'Contacted' as const, label: t.filterContacted || 'Contacted' },
          { key: 'Accepted' as const, label: t.filterAccepted || 'Accepted' },
        ].map((tab) => {
          const count = tab.key === 'All' ? enquiries.length : enquiries.filter((e) => e.status === tab.key).length;
          const isSelected = statusFilter === tab.key;
          return (
            <button
              key={tab.key}
              onClick={() => setStatusFilter(tab.key)}
              className={`px-3.5 py-1.5 rounded-xl transition shrink-0 ${
                isSelected
                  ? 'bg-[#14492a] text-white shadow-xs'
                  : 'bg-white text-slate-600 border border-[#dce8d5] hover:bg-[#f6f9f3]'
              }`}
            >
              {tab.label} ({count})
            </button>
          );
        })}
      </div>

      {/* Enquiries List */}
      <div className="space-y-3">
        {filteredEnquiries.length === 0 ? (
          <div className="bg-white rounded-3xl p-8 text-center border border-[#dce8d5] space-y-3">
            <div className="w-12 h-12 rounded-full bg-emerald-50 text-emerald-700 flex items-center justify-center mx-auto">
              <MessageSquareText className="w-6 h-6" />
            </div>
            <h3 className="text-sm font-bold text-slate-800">{t.noEnquiriesTitle || 'No Enquiries Found'}</h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              {enquiries.length === 0
                ? (t.noEnquiriesDesc || "You haven't submitted any purchase enquiries yet. Browse verified lots and send offers directly to farmers.")
                : 'No enquiries match the selected status filter.'}
            </p>
            {enquiries.length === 0 && (
              <button
                onClick={() => onNavigateTab('browse-crops')}
                className="px-4 py-2 bg-[#14492a] text-white rounded-xl text-xs font-bold transition shadow-xs inline-flex items-center gap-1.5"
              >
                <span>{t.browseCropsTitle || 'Browse Available Crops'}</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        ) : (
          filteredEnquiries.map((enq) => {
            const statusConfig = {
              'Pending Response': {
                bg: 'bg-amber-50 text-amber-900 border-amber-200',
                icon: Clock,
              },
              'Contacted': {
                bg: 'bg-blue-50 text-blue-900 border-blue-200',
                icon: PhoneCall,
              },
              'Accepted': {
                bg: 'bg-emerald-50 text-emerald-900 border-emerald-200',
                icon: CheckCircle2,
              },
              'Declined': {
                bg: 'bg-slate-100 text-slate-700 border-slate-200',
                icon: XCircle,
              },
            }[enq.status] || {
              bg: 'bg-slate-100 text-slate-700 border-slate-200',
              icon: Clock,
            };

            const StatusIcon = statusConfig.icon;

            return (
              <div
                key={enq.id}
                className="bg-white rounded-2xl p-4 sm:p-5 border border-[#dce8d5] shadow-2xs space-y-3"
              >
                {/* Header row */}
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 block uppercase tracking-wider">
                      Enquiry ID: {enq.id}
                    </span>
                    <h3 className="text-base font-bold text-[#144225] mt-0.5">
                      {enq.listingTitle}
                    </h3>
                    <p className="text-xs text-slate-600 flex items-center gap-1.5 mt-0.5">
                      <User className="w-3.5 h-3.5 text-emerald-700" />
                      <span>Farmer: <strong className="text-slate-800">{enq.farmerName}</strong></span>
                    </p>
                  </div>

                  <span
                    className={`text-xs font-bold px-2.5 py-1 rounded-full border flex items-center gap-1 shrink-0 ${statusConfig.bg}`}
                  >
                    <StatusIcon className="w-3.5 h-3.5" />
                    <span>{enq.status}</span>
                  </span>
                </div>

                {/* Offer Details Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 bg-[#f8faf6] p-3 rounded-xl border border-[#e5edd9] text-xs">
                  <div>
                    <span className="text-[10px] text-slate-500 block font-medium">Requested Qty:</span>
                    <span className="font-bold text-slate-800">
                      {enq.requestedQuantity} {enq.unit}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-500 block font-medium">Offered Price:</span>
                    <span className="font-bold text-emerald-800">
                      {enq.offeredPrice ? `₹${enq.offeredPrice.toLocaleString('en-IN')}` : 'At Listing Rate'} {enq.priceUnit ? `(${enq.priceUnit})` : ''}
                    </span>
                  </div>
                  <div className="col-span-2 sm:col-span-1">
                    <span className="text-[10px] text-slate-500 block font-medium">Date Sent:</span>
                    <span className="font-medium text-slate-700 flex items-center gap-1">
                      <Calendar className="w-3 h-3 text-slate-400" />
                      <span>{new Date(enq.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                    </span>
                  </div>
                </div>

                {/* Message */}
                {enq.message && (
                  <div className="text-xs text-slate-600 bg-[#fbfbfb] p-2.5 rounded-xl border border-slate-100">
                    <span className="font-semibold text-slate-700 block text-[11px] mb-0.5">Your Message:</span>
                    <p className="leading-relaxed italic">"{enq.message}"</p>
                  </div>
                )}

                {/* Seller Phone contact if available */}
                {enq.sellerPhone && (
                  <div className="flex items-center justify-between text-xs pt-1 border-t border-slate-100">
                    <span className="text-slate-500">Seller Phone: {enq.sellerPhone}</span>
                    <a
                      href={`tel:${enq.sellerPhone}`}
                      className="px-3 py-1 bg-emerald-100 hover:bg-emerald-200 text-emerald-900 rounded-lg text-xs font-bold transition flex items-center gap-1"
                    >
                      <PhoneCall className="w-3 h-3" />
                      <span>Call Grower</span>
                    </a>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Transparency Callout */}
      <div className="bg-[#f2f7ed] rounded-2xl p-4 border border-[#d6e5cd] text-xs text-[#2c5236] space-y-1.5">
        <div className="flex items-center gap-2 font-bold text-sm text-[#144225]">
          <ShieldCheck className="w-4 h-4 text-emerald-700 shrink-0" />
          <span>Procurement Communication Protocol</span>
        </div>
        <p className="text-[11px] leading-relaxed text-[#416149]">
          Enquiry records serve as direct trade leads sent to the grower. Once the farmer reviews your offer in their dashboard, they will contact you directly on your phone to finalize lot inspection, quality weighing, and APMC settlement. AGROVA does not charge broker commissions or hold payment escrow.
        </p>
      </div>
    </div>
  );
};

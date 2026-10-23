import React, { useState, useEffect } from 'react';
import { 
  NavigationTab, 
  SupportedLanguage, 
  FarmerProfile, 
  BuyerProfile,
  UserRole,
  CropRecord, 
  FarmObservation, 
  SoilScanRecord, 
  PlantScanRecord,
  MarketListing,
  CropEnquiry,
  AuthUser,
  TextSize,
  VoiceStatus
} from './types';
import { storageService } from './services/storage';
import { authService } from './services/authService';
import { voiceService } from './services/voiceService';
import { AuthScreen } from './components/AuthScreen';
import { Header } from './components/Header';
import { BottomNav } from './components/BottomNav';
import { RoleOnboardingModal } from './components/RoleOnboardingModal';
import { HomeScreen } from './screens/HomeScreen';
import { MyFarmScreen } from './screens/MyFarmScreen';
import { SoilScanScreen } from './screens/SoilScanScreen';
import { MarketplaceScreen } from './screens/MarketplaceScreen';
import { ProfileSettingsScreen } from './screens/ProfileSettingsScreen';
import { BuyerHomeScreen } from './screens/BuyerHomeScreen';
import { BuyerBrowseCropsScreen } from './screens/BuyerBrowseCropsScreen';
import { BuyerEnquiriesScreen } from './screens/BuyerEnquiriesScreen';
import { BuyerMarketplaceScreen } from './screens/BuyerMarketplaceScreen';
import { FertilizerGuidanceModal } from './components/FertilizerGuidanceModal';
import { VoiceAssistantModal } from './components/VoiceAssistantModal';
import { LANGUAGES } from './constants/translations';
import { Globe, X, Check } from 'lucide-react';

export default function App() {
  // Authentication State
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(() => authService.getUser());
  const [isAuthOpen, setIsAuthOpen] = useState<boolean>(() => !authService.isAuthenticated());

  // Accessibility States (Adjustable Text Size & Screen Reader Live Announcements)
  const [textSize, setTextSize] = useState<TextSize>(() => storageService.getTextSize());
  const [voiceStatus, setVoiceStatus] = useState<VoiceStatus>(() => voiceService.getStatus());
  const [srAnnouncement, setSrAnnouncement] = useState<string>('');

  // Account Role & Onboarding State
  const [role, setRole] = useState<UserRole>(() => {
    storageService.initializeDefaults();
    const user = authService.getUser();
    if (user?.role) return user.role;
    return storageService.getUserRole();
  });
  const [isOnboardingOpen, setIsOnboardingOpen] = useState<boolean>(false);

  // Navigation State: strictly 5 tabs appropriate to current role
  const [activeTab, setActiveTab] = useState<NavigationTab>('home');
  
  // Storage State
  const [profile, setProfile] = useState<FarmerProfile>(() => {
    storageService.initializeDefaults();
    return storageService.getProfile();
  });
  const [buyerProfile, setBuyerProfile] = useState<BuyerProfile>(() => {
    return storageService.getBuyerProfile();
  });
  const [language, setLanguage] = useState<SupportedLanguage>(profile.preferredLanguage || 'en');
  const [crops, setCrops] = useState<CropRecord[]>([]);
  const [observations, setObservations] = useState<FarmObservation[]>([]);
  const [soilScans, setSoilScans] = useState<SoilScanRecord[]>([]);
  const [plantScans, setPlantScans] = useState<PlantScanRecord[]>([]);
  const [marketListings, setMarketListings] = useState<MarketListing[]>([]);
  const [enquiries, setEnquiries] = useState<CropEnquiry[]>([]);

  // Fertilizer Guidance Modal
  const [isFertilizerOpen, setIsFertilizerOpen] = useState<boolean>(false);
  const [selectedCropForFertilizer, setSelectedCropForFertilizer] = useState<string | undefined>(undefined);
  const [isLanguageModalOpen, setIsLanguageModalOpen] = useState<boolean>(false);
  const [isVoiceAssistantOpen, setIsVoiceAssistantOpen] = useState<boolean>(false);

  // Selected listing for buyer purchase enquiry
  const [selectedListingForEnquiry, setSelectedListingForEnquiry] = useState<MarketListing | null>(null);

  // Synchronize Text Size & Voice Service Status for Accessibility
  useEffect(() => {
    storageService.saveTextSize(textSize);
    const unsub = voiceService.subscribeStatus((st) => {
      setVoiceStatus(st);
    });
    return () => {
      unsub();
    };
  }, []);

  // Restore authenticated session on mount
  useEffect(() => {
    authService.restoreSession().then(({ user, profile: activeProfile }) => {
      if (user) {
        setCurrentUser(user);
        setIsAuthOpen(false);
        if (user.role) {
          setRole(user.role);
          storageService.setUserRole(user.role);
        }
        if (activeProfile) {
          if (user.role === 'farmer') {
            setProfile(activeProfile as FarmerProfile);
            storageService.saveProfile(activeProfile as FarmerProfile);
          } else {
            setBuyerProfile(activeProfile as BuyerProfile);
            storageService.saveBuyerProfile(activeProfile as BuyerProfile);
          }
        }
        if (user.preferredLanguage) {
          setLanguage(user.preferredLanguage);
        }
      }
    });
  }, []);

  // Initialize and load data on mount and on role change
  useEffect(() => {
    loadAllData();
  }, [role, currentUser]);

  const loadAllData = async () => {
    storageService.initializeDefaults();
    const prof = storageService.getProfile();
    const bProf = storageService.getBuyerProfile();
    setProfile(prof);
    setBuyerProfile(bProf);
    setLanguage(role === 'buyer' ? (bProf.preferredLanguage || 'en') : (prof.preferredLanguage || 'en'));
    setCrops(storageService.getCrops());
    setObservations(storageService.getObservations());
    setSoilScans(storageService.getSoilScans());
    setPlantScans(storageService.getPlantScans());

    // Load listings from cache first, then sync with API
    const cachedListings = storageService.getMarketListings();
    setMarketListings(cachedListings);
    const cachedEnquiries = storageService.getEnquiries();
    setEnquiries(cachedEnquiries);

    // Background sync
    try {
      const freshListings = await storageService.fetchMarketListings();
      setMarketListings(freshListings);

      if (role === 'farmer' && authService.isAuthenticated()) {
        const freshCrops = await storageService.fetchCrops();
        setCrops(freshCrops);
        const freshObservations = await storageService.fetchObservations();
        setObservations(freshObservations);
        const freshSoilScans = await storageService.fetchSoilScans();
        setSoilScans(freshSoilScans);
        const freshPlantScans = await storageService.fetchPlantScans();
        setPlantScans(freshPlantScans);
      }

      const effectiveUserId = currentUser?.id || (role === 'farmer' ? 'farmer-user-1' : (bProf.id || 'buyer-user-1'));
      const freshEnquiries = await storageService.fetchEnquiries(
        role,
        effectiveUserId
      );
      setEnquiries(freshEnquiries);
    } catch (err) {
      console.warn('API sync completed with local cache:', err);
    }
  };

  const handleAuthSuccess = (user: AuthUser, userProfile: FarmerProfile | BuyerProfile) => {
    // Clear previous in-memory session data to guarantee account isolation
    setCrops([]);
    setObservations([]);
    setSoilScans([]);
    setPlantScans([]);
    setEnquiries([]);

    setCurrentUser(user);
    setRole(user.role);
    storageService.setUserRole(user.role);
    storageService.setOnboardingCompleted(true);
    if (user.role === 'farmer') {
      const p = userProfile as FarmerProfile;
      setProfile(p);
      storageService.saveProfile(p);
    } else {
      const bp = userProfile as BuyerProfile;
      setBuyerProfile(bp);
      storageService.saveBuyerProfile(bp);
    }
    if (user.preferredLanguage) {
      setLanguage(user.preferredLanguage);
    }
    setIsAuthOpen(false);
    setIsOnboardingOpen(false);
    setActiveTab('home');
    loadAllData();
  };

  const handleSignOut = async () => {
    await authService.logout();
    storageService.clearUserSessionData();
    setCurrentUser(null);
    setCrops([]);
    setObservations([]);
    setSoilScans([]);
    setPlantScans([]);
    setEnquiries([]);
    setProfile(storageService.getProfile());
    setBuyerProfile(storageService.getBuyerProfile());
    setIsAuthOpen(true);
    setActiveTab('home');
  };

  const handleRoleSelection = (selectedRole: UserRole) => {
    storageService.setUserRole(selectedRole);
    setRole(selectedRole);
    setIsOnboardingOpen(false);
    setActiveTab('home');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSwitchRole = async (newRole: UserRole) => {
    storageService.setUserRole(newRole);
    setRole(newRole);
    if (authService.isAuthenticated()) {
      await authService.updateProfile({ role: newRole });
      const u = authService.getUser();
      if (u) setCurrentUser(u);
    }
    setActiveTab('home');
    window.scrollTo({ top: 0, behavior: 'smooth' });
    loadAllData();
  };

  const handleTextSizeChange = (newSize: TextSize) => {
    setTextSize(newSize);
    storageService.saveTextSize(newSize);
    const labels: Record<TextSize, string> = { standard: 'Standard', large: 'Large', xlarge: 'Extra Large' };
    setSrAnnouncement(`Text size updated to ${labels[newSize]}`);
    setTimeout(() => setSrAnnouncement(''), 3500);
  };

  const handleLanguageChange = (newLang: SupportedLanguage) => {
    setLanguage(newLang);
    const langObj = LANGUAGES.find((l) => l.code === newLang);
    if (langObj) {
      setSrAnnouncement(`Language updated to ${langObj.label} (${langObj.localLabel})`);
      setTimeout(() => setSrAnnouncement(''), 3500);
    }
    if (authService.isAuthenticated()) {
      authService.updateProfile({ preferredLanguage: newLang });
    }
    if (role === 'farmer') {
      const updated = { ...profile, preferredLanguage: newLang };
      setProfile(updated);
      storageService.saveProfile(updated);
    } else {
      const updated = { ...buyerProfile, preferredLanguage: newLang };
      setBuyerProfile(updated);
      storageService.saveBuyerProfile(updated);
    }
    setIsLanguageModalOpen(false);
  };

  const handleOpenFertilizer = (cropName?: string) => {
    setSelectedCropForFertilizer(cropName);
    setIsFertilizerOpen(true);
  };

  const handleSelectListingForEnquiry = (listing: MarketListing) => {
    setSelectedListingForEnquiry(listing);
    setActiveTab('browse-crops');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const locationDisplay =
    role === 'farmer'
      ? `${profile.villageOrDistrict || 'Vijayapura'}, ${profile.state || 'Karnataka'}`
      : `${buyerProfile.location || 'Vijayapura APMC'}, ${buyerProfile.state || 'Karnataka'}`;

  return (
    <div className="min-h-screen bg-[#f7f9f4] text-[#192f1f] flex flex-col font-sans selection:bg-emerald-200 selection:text-emerald-900">
      {/* Screen Reader Live Status Announcer (TalkBack accessibility) */}
      <div role="status" aria-live="polite" aria-atomic="true" className="sr-only">
        {srAnnouncement}
      </div>

      {/* Top Header */}
      <Header
        currentLanguage={language}
        onLanguageChange={handleLanguageChange}
        farmLocation={locationDisplay}
        onOpenLanguageModal={() => setIsLanguageModalOpen(true)}
        currentUser={currentUser}
        onOpenAuth={() => setIsAuthOpen(true)}
        role={role}
        onOpenVoiceAssistant={() => setIsVoiceAssistantOpen(true)}
        voiceStatus={voiceStatus}
        textSize={textSize}
        onTextSizeChange={handleTextSizeChange}
      />

      {/* Main Content Area */}
      <main className="flex-1 w-full max-w-4xl mx-auto px-3.5 sm:px-6 pt-3 pb-24">
        {/* ==================== FARMER WORKFLOW ==================== */}
        {role === 'farmer' && (
          <>
            {activeTab === 'home' && (
              <HomeScreen
                profile={profile}
                crops={crops}
                plantScans={plantScans}
                onNavigateTab={(tab) => {
                  setActiveTab(tab);
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
                onOpenFertilizer={() => handleOpenFertilizer()}
                language={language}
                enquiriesCount={enquiries.length}
                onOpenVoiceAssistant={() => setIsVoiceAssistantOpen(true)}
              />
            )}

            {activeTab === 'my-farm' && (
              <MyFarmScreen
                profile={profile}
                crops={crops}
                observations={observations}
                soilScans={soilScans}
                onUpdateProfile={(p) => setProfile(p)}
                onRefreshData={loadAllData}
                onOpenFertilizerWithCrop={(c) => handleOpenFertilizer(c)}
                language={language}
              />
            )}

            {activeTab === 'soil-scan' && (
              <SoilScanScreen
                profile={profile}
                crops={crops}
                savedScans={soilScans}
                onSavedRecord={loadAllData}
                language={language}
              />
            )}

            {activeTab === 'marketplace' && (
              <MarketplaceScreen
                listings={marketListings}
                enquiries={enquiries}
                onRefreshListings={loadAllData}
                language={language}
                farmerId={currentUser?.id || 'farmer-user-1'}
                sellerName={profile.name}
                sellerPhone={profile.contactNumber}
                sellerLocation={`${profile.villageOrDistrict || 'Vijayapura'}, ${profile.state || 'Karnataka'}`}
                plantScans={plantScans}
              />
            )}

            {activeTab === 'profile-settings' && (
              <ProfileSettingsScreen
                profile={profile}
                buyerProfile={buyerProfile}
                role="farmer"
                onUpdateProfile={(p) => setProfile(p)}
                onUpdateBuyerProfile={(bp) => setBuyerProfile(bp)}
                onSwitchRole={handleSwitchRole}
                language={language}
                onLanguageChange={handleLanguageChange}
                onDataReset={loadAllData}
                onSignOut={handleSignOut}
                textSize={textSize}
                onTextSizeChange={handleTextSizeChange}
              />
            )}
          </>
        )}

        {/* ==================== BUYER WORKFLOW ==================== */}
        {role === 'buyer' && (
          <>
            {activeTab === 'home' && (
              <BuyerHomeScreen
                buyerProfile={buyerProfile}
                listings={marketListings}
                enquiries={enquiries}
                onNavigateTab={(tab) => {
                  setActiveTab(tab);
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
                onSelectListingForEnquiry={handleSelectListingForEnquiry}
                language={language}
              />
            )}

            {activeTab === 'browse-crops' && (
              <BuyerBrowseCropsScreen
                listings={marketListings}
                buyerProfile={buyerProfile}
                onEnquirySent={loadAllData}
                preselectedListing={selectedListingForEnquiry}
                onClearPreselectedListing={() => setSelectedListingForEnquiry(null)}
                language={language}
              />
            )}

            {activeTab === 'my-enquiries' && (
              <BuyerEnquiriesScreen
                enquiries={enquiries}
                onRefresh={loadAllData}
                onNavigateTab={(tab) => {
                  setActiveTab(tab);
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
                language={language}
              />
            )}

            {activeTab === 'marketplace' && (
              <BuyerMarketplaceScreen
                listings={marketListings}
                buyerProfile={buyerProfile}
                onSelectListingForEnquiry={handleSelectListingForEnquiry}
              />
            )}

            {activeTab === 'profile-settings' && (
              <ProfileSettingsScreen
                profile={profile}
                buyerProfile={buyerProfile}
                role="buyer"
                onUpdateProfile={(p) => setProfile(p)}
                onUpdateBuyerProfile={(bp) => setBuyerProfile(bp)}
                onSwitchRole={handleSwitchRole}
                language={language}
                onLanguageChange={handleLanguageChange}
                onDataReset={loadAllData}
                onSignOut={handleSignOut}
                textSize={textSize}
                onTextSizeChange={handleTextSizeChange}
              />
            )}
          </>
        )}
      </main>

      {/* Auth Screen Modal (Registration, Login, Forgot Password, Role Selection) */}
      {isAuthOpen && (
        <div className="fixed inset-0 z-50 bg-[#f4f7f0] overflow-y-auto">
          <AuthScreen
            language={language}
            onLanguageChange={handleLanguageChange}
            onAuthSuccess={handleAuthSuccess}
            onClose={currentUser ? () => setIsAuthOpen(false) : undefined}
          />
        </div>
      )}

      {/* Role Onboarding Modal for New Users */}
      <RoleOnboardingModal
        isOpen={isOnboardingOpen}
        onSelectRole={handleRoleSelection}
      />

      {/* Fertilizer Guidance Modal (accessible from Farmer Home & My Farm) */}
      <FertilizerGuidanceModal
        isOpen={isFertilizerOpen}
        onClose={() => setIsFertilizerOpen(false)}
        language={language}
        preselectedCrop={selectedCropForFertilizer}
        onSavedToObservations={loadAllData}
        profile={profile}
        plantScans={plantScans}
        soilScans={soilScans}
      />

      {/* Quick Language Selection Modal */}
      {isLanguageModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-sm w-full p-5 shadow-2xl border border-[#dce8d5] space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Globe className="w-4 h-4 text-emerald-700" />
                <h3 className="text-sm font-bold text-[#144225] font-display">
                  Select Your Language
                </h3>
              </div>
              <button
                onClick={() => setIsLanguageModalOpen(false)}
                className="w-8 h-8 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-700"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-1 max-h-72 overflow-y-auto pr-1">
              {LANGUAGES.map((lang) => {
                const isSelected = language === lang.code;
                return (
                  <button
                    key={lang.code}
                    onClick={() => handleLanguageChange(lang.code)}
                    className={`w-full flex items-center justify-between p-3 rounded-xl text-xs font-semibold transition ${
                      isSelected
                        ? 'bg-[#14492a] text-white shadow-xs'
                        : 'hover:bg-[#f3f7f0] text-slate-800'
                    }`}
                  >
                    <div className="flex items-baseline gap-2 min-w-0">
                      <span className="font-bold text-sm truncate">{lang.localLabel}</span>
                      <span className={`text-[11px] truncate ${isSelected ? 'text-emerald-200' : 'text-slate-500'}`}>
                        {lang.label}
                      </span>
                    </div>
                    {isSelected && <Check className="w-4 h-4 text-emerald-300 ml-2 shrink-0" />}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Voice Assistant Modal */}
      {isVoiceAssistantOpen && (
        <VoiceAssistantModal
          isOpen={isVoiceAssistantOpen}
          onClose={() => setIsVoiceAssistantOpen(false)}
          language={language}
          onLanguageChange={handleLanguageChange}
          role={role}
          profile={profile}
          buyerProfile={buyerProfile}
          crops={crops}
          onNavigateTab={(tab) => {
            setActiveTab(tab);
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }}
          onOpenFertilizerModal={(cropName) => {
            setSelectedCropForFertilizer(cropName);
            setIsFertilizerOpen(true);
          }}
        />
      )}

      {/* STRICT REQUIREMENT: Exactly 5 items in bottom navigation for both roles */}
      <BottomNav
        activeTab={activeTab}
        onTabChange={(tab) => {
          setActiveTab(tab);
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }}
        language={language}
        role={role}
      />
    </div>
  );
}

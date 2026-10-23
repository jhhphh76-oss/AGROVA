import React, { useState } from 'react';
import { 
  Settings, 
  User, 
  Globe, 
  Ruler, 
  ShieldCheck, 
  Download, 
  Upload, 
  RotateCcw, 
  Trash2, 
  CheckCircle2, 
  AlertTriangle,
  Info,
  Store,
  Sprout,
  ArrowRightLeft,
  Building2,
  Mail,
  Phone,
  Sparkles
} from 'lucide-react';
import { 
  FarmerProfile, 
  BuyerProfile, 
  UserRole, 
  SupportedLanguage, 
  AreaUnit, 
  WeightUnit, 
  TemperatureUnit,
  AuthUser,
  TextSize
} from '../types';
import { TRANSLATIONS, LANGUAGES } from '../constants/translations';
import { storageService } from '../services/storage';
import { authService } from '../services/authService';
import { AgrovaLogo } from '../components/AgrovaLogo';
import { Lock, LogOut, KeyRound, LogIn, Type, Check } from 'lucide-react';
import { validatePhoneNumber } from '../utils/phoneValidation';

interface ProfileSettingsScreenProps {
  profile: FarmerProfile;
  buyerProfile: BuyerProfile;
  role: UserRole;
  onUpdateProfile: (updated: FarmerProfile) => void;
  onUpdateBuyerProfile: (updated: BuyerProfile) => void;
  onSwitchRole: (newRole: UserRole) => void;
  language: SupportedLanguage;
  onLanguageChange: (lang: SupportedLanguage) => void;
  onDataReset: () => void;
  onSignOut?: () => void;
  onOpenAuthForRole?: (role: UserRole) => void;
  textSize?: TextSize;
  onTextSizeChange?: (size: TextSize) => void;
}

export const ProfileSettingsScreen: React.FC<ProfileSettingsScreenProps> = ({
  profile,
  buyerProfile,
  role,
  onUpdateProfile,
  onUpdateBuyerProfile,
  onSwitchRole,
  language,
  onLanguageChange,
  onDataReset,
  onSignOut,
  onOpenAuthForRole,
  textSize,
  onTextSizeChange,
}) => {
  const t = TRANSLATIONS[language]?.profile || TRANSLATIONS.en.profile;
  const tAuth = TRANSLATIONS[language]?.auth || TRANSLATIONS.en.auth;

  const currentUser = authService.getUser();

  // Password state
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [passwordFeedback, setPasswordFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [deletePassword, setDeletePassword] = useState('');
  const [isDeletingAccount, setIsDeletingAccount] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  // Farmer State
  const [name, setName] = useState<string>(profile.name);
  const [village, setVillage] = useState<string>(profile.villageOrDistrict);
  const [farmerState, setFarmerState] = useState<string>(profile.state);
  const [phone, setPhone] = useState<string>(profile.contactNumber);
  const [areaUnit, setAreaUnit] = useState<AreaUnit>(profile.preferredAreaUnit);
  const [weightUnit, setWeightUnit] = useState<WeightUnit>(profile.preferredWeightUnit);
  const [tempUnit, setTempUnit] = useState<TemperatureUnit>(profile.preferredTempUnit);

  // Buyer State
  const [bName, setBName] = useState<string>(buyerProfile.name);
  const [bBusiness, setBBusiness] = useState<string>(buyerProfile.businessName);
  const [bType, setBType] = useState<BuyerProfile['businessType']>(buyerProfile.businessType || 'Wholesale Trader');
  const [bLocation, setBLocation] = useState<string>(buyerProfile.location);
  const [bState, setBState] = useState<string>(buyerProfile.state);
  const [bPhone, setBPhone] = useState<string>(buyerProfile.contactNumber);
  const [bEmail, setBEmail] = useState<string>(buyerProfile.email || '');

  // Modal & Feedback state
  const [showRoleConfirm, setShowRoleConfirm] = useState<boolean>(false);
  const [savedFeedback, setSavedFeedback] = useState<string | null>(null);
  const [showClearConfirm, setShowClearConfirm] = useState<boolean>(false);

  const targetRoleToSwitch: UserRole = role === 'farmer' ? 'buyer' : 'farmer';

  const handleSaveFarmerProfile = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!phone.trim()) {
      setSavedFeedback('Contact phone number is mandatory. Please enter your 10-digit Indian mobile number.');
      setTimeout(() => setSavedFeedback(null), 3500);
      return;
    }

    const validatedPhone = validatePhoneNumber(phone);
    if (!validatedPhone.valid || !validatedPhone.normalized) {
      setSavedFeedback(validatedPhone.error || 'Please enter a valid 10-digit Indian mobile number (e.g. 9845012345 or +91 98450 12345).');
      setTimeout(() => setSavedFeedback(null), 3500);
      return;
    }

    const cleanPhone = validatedPhone.normalized;
    setPhone(cleanPhone);

    const updated: FarmerProfile = {
      ...profile,
      name: name.trim() || 'Farmer',
      villageOrDistrict: village.trim(),
      state: farmerState.trim(),
      contactNumber: cleanPhone,
      preferredAreaUnit: areaUnit,
      preferredWeightUnit: weightUnit,
      preferredTempUnit: tempUnit,
      preferredLanguage: language,
    };
    storageService.saveProfile(updated);
    if (updated.villageOrDistrict && typeof localStorage !== 'undefined') {
      localStorage.setItem('agriconnect_selected_weather_city', updated.villageOrDistrict);
    }
    onUpdateProfile(updated);
    if (authService.isAuthenticated()) {
      await authService.updateProfile({
        name: updated.name,
        preferredLanguage: updated.preferredLanguage,
        farmProfile: updated,
        phone: cleanPhone,
      });
    }
    setSavedFeedback('Farmer profile & measurement preferences saved!');
    setTimeout(() => setSavedFeedback(null), 3500);
  };

  const handleSaveBuyerProfile = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!bPhone.trim()) {
      setSavedFeedback('Contact phone number is mandatory. Please enter your 10-digit Indian mobile number.');
      setTimeout(() => setSavedFeedback(null), 3500);
      return;
    }

    const validatedPhone = validatePhoneNumber(bPhone);
    if (!validatedPhone.valid || !validatedPhone.normalized) {
      setSavedFeedback(validatedPhone.error || 'Please enter a valid 10-digit Indian mobile number (e.g. 9448167890 or +91 94481 67890).');
      setTimeout(() => setSavedFeedback(null), 3500);
      return;
    }

    const cleanBPhone = validatedPhone.normalized;
    setBPhone(cleanBPhone);

    const updated: BuyerProfile = {
      ...buyerProfile,
      name: bName.trim() || 'Procurement Buyer',
      businessName: bBusiness.trim() || 'Agri Commodity Trader',
      businessType: bType,
      location: bLocation.trim(),
      state: bState.trim(),
      contactNumber: cleanBPhone,
      email: bEmail.trim(),
      preferredLanguage: language,
    };
    storageService.saveBuyerProfile(updated);
    onUpdateBuyerProfile(updated);
    if (authService.isAuthenticated()) {
      await authService.updateProfile({
        name: updated.name,
        preferredLanguage: updated.preferredLanguage,
        buyerProfile: updated,
        phone: cleanBPhone,
      });
    }
    setSavedFeedback('Buyer procurement profile saved successfully!');
    setTimeout(() => setSavedFeedback(null), 3500);
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordFeedback(null);
    if (!currentPassword) {
      setPasswordFeedback({ type: 'error', message: 'Current password is required.' });
      return;
    }
    if (newPassword.length < 6) {
      setPasswordFeedback({ type: 'error', message: tAuth.errorPassLength || 'New password must be at least 6 characters.' });
      return;
    }
    if (newPassword !== confirmNewPassword) {
      setPasswordFeedback({ type: 'error', message: tAuth.errorPassMismatch || 'Passwords do not match.' });
      return;
    }
    setIsChangingPassword(true);
    const res = await authService.changePassword(currentPassword, newPassword);
    setIsChangingPassword(false);
    if (res.success) {
      setCurrentPassword('');
      setNewPassword('');
      setConfirmNewPassword('');
      setPasswordFeedback({ type: 'success', message: res.message || 'Password changed successfully.' });
    } else {
      setPasswordFeedback({ type: 'error', message: res.error || 'Failed to change password.' });
    }
  };

  const handleSignOut = async () => {
    await authService.logout();
    storageService.clearUserSessionData();
    if (onSignOut) {
      onSignOut();
    }
  };

  const handleDeleteAccount = async () => {
    if (!deletePassword) {
      alert('Please enter your password to confirm account deletion.');
      return;
    }
    setIsDeletingAccount(true);
    const res = await authService.deleteAccount(deletePassword);
    setIsDeletingAccount(false);
    if (res.success) {
      setShowDeleteConfirm(false);
      storageService.clearUserSessionData();
      if (onSignOut) {
        onSignOut();
      }
    } else {
      alert(res.error || 'Failed to delete account.');
    }
  };

  const isMultiRoleAuthorized = Boolean(
    currentUser &&
    currentUser.roles &&
    currentUser.roles.includes(targetRoleToSwitch)
  );

  const handleConfirmRoleSwitch = async () => {
    if (currentUser) {
      if (!isMultiRoleAuthorized) {
        setShowRoleConfirm(false);
        if (onOpenAuthForRole) {
          onOpenAuthForRole(targetRoleToSwitch);
        }
        return;
      }
      const res = await authService.switchRole(targetRoleToSwitch);
      if (res.success) {
        storageService.setUserRole(targetRoleToSwitch);
        onSwitchRole(targetRoleToSwitch);
        setShowRoleConfirm(false);
        setSavedFeedback(`Switched to ${targetRoleToSwitch === 'farmer' ? 'Farmer' : 'Buyer'} workspace.`);
        setTimeout(() => setSavedFeedback(null), 3500);
      } else {
        alert(res.error || 'Failed to switch role.');
      }
    } else {
      storageService.setUserRole(targetRoleToSwitch);
      onSwitchRole(targetRoleToSwitch);
      setShowRoleConfirm(false);
      setSavedFeedback(`Switched to ${targetRoleToSwitch === 'farmer' ? 'Farmer' : 'Buyer'} preview.`);
      setTimeout(() => setSavedFeedback(null), 3500);
    }
  };

  const handleExportBackup = () => {
    const jsonStr = storageService.exportBackup();
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `agriconnect_complete_backup_${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    setSavedFeedback('Complete backup exported to JSON file!');
    setTimeout(() => setSavedFeedback(null), 3500);
  };

  const handleImportBackup = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const content = event.target?.result as string;
        const success = storageService.importBackup(content);
        if (success) {
          onDataReset();
          setSavedFeedback('Backup successfully restored!');
        } else {
          alert('Failed to parse backup JSON file.');
        }
      };
      reader.readAsText(file);
    }
  };

  const handleResetDemoData = () => {
    if (confirm('Reset all farm, crop, soil, buyer, and marketplace records to standard demonstration data?')) {
      storageService.resetDemonstrationData();
      onDataReset();
      setSavedFeedback('Demonstration data restored to initial state.');
      setTimeout(() => setSavedFeedback(null), 3500);
    }
  };

  const handleClearAllData = () => {
    storageService.clearAllData();
    onDataReset();
    setShowClearConfirm(false);
    setSavedFeedback('All local storage cleared.');
    setTimeout(() => setSavedFeedback(null), 3500);
  };

  return (
    <div className="space-y-4 pb-6">
      {/* Title */}
      <div className="bg-white rounded-3xl p-5 border border-[#dce8d5] shadow-xs">
        <div className="flex items-center gap-2 mb-1">
          <Settings className="w-5 h-5 text-emerald-700" />
          <h1 className="text-xl font-black text-[#144225] font-display">
            {t.title}
          </h1>
        </div>
        <p className="text-xs text-slate-500">
          Manage your account role, contact details, regional units, and persistent storage
        </p>
      </div>

      {/* Feedback Toast */}
      {savedFeedback && (
        <div className="p-3.5 bg-emerald-50 border border-emerald-200 text-emerald-900 rounded-2xl text-xs font-semibold flex items-center gap-2 shadow-xs animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0" />
          <span>{savedFeedback}</span>
        </div>
      )}

      {/* 0. AUTHENTICATED USER IDENTITY CARD */}
      <div className="bg-white rounded-3xl p-5 border border-[#dce8d5] shadow-xs space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold text-sm">
              <User className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-sm font-bold text-[#144225] font-display">
                  {currentUser ? currentUser.name : (role === 'farmer' ? 'Guest Farmer' : 'Guest Buyer')}
                </h2>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200">
                  {currentUser ? 'Verified Account' : 'Guest / Local Session'}
                </span>
              </div>
              <p className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
                <Mail className="w-3 h-3 text-slate-400" />
                <span>{currentUser ? currentUser.email : 'Not signed in (Guest browsing)'}</span>
              </p>
            </div>
          </div>

          {currentUser ? (
            <button
              onClick={handleSignOut}
              className="px-3.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition flex items-center gap-1.5"
              title="Sign out of AgriConnect account"
            >
              <LogOut className="w-3.5 h-3.5 text-slate-500" />
              <span>{t.signOutBtn || 'Sign Out'}</span>
            </button>
          ) : (
            <button
              onClick={() => onOpenAuthForRole?.(role)}
              className="px-3.5 py-1.5 bg-[#14492a] hover:bg-[#0e3a20] text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-2xs"
              title="Sign in to AgriConnect account"
            >
              <LogIn className="w-3.5 h-3.5" />
              <span>Sign In</span>
            </button>
          )}
        </div>
      </div>

      {/* 1. ROLE SELECTION & SWITCHING SECTION */}
      <div className="bg-white rounded-3xl p-5 border border-[#dce8d5] shadow-xs space-y-3.5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {role === 'farmer' ? (
              <Sprout className="w-4.5 h-4.5 text-emerald-700" />
            ) : (
              <Store className="w-4.5 h-4.5 text-emerald-700" />
            )}
            <div>
              <h2 className="text-sm font-bold text-[#144225] font-display">
                Active Account Role
              </h2>
              <p className="text-[11px] text-slate-500">
                Current interface and navigation workflow
              </p>
            </div>
          </div>

          <span
            className={`text-xs font-bold px-3 py-1 rounded-full border flex items-center gap-1.5 ${
              role === 'farmer'
                ? 'bg-emerald-100 text-emerald-900 border-emerald-300'
                : 'bg-emerald-900 text-white border-emerald-800'
            }`}
          >
            {role === 'farmer' ? (
              <>
                <Sprout className="w-3.5 h-3.5" /> Farmer Account
              </>
            ) : (
              <>
                <Store className="w-3.5 h-3.5" /> Buyer Account
              </>
            )}
          </span>
        </div>

        <div className="p-3.5 bg-[#f6f9f3] rounded-2xl border border-[#dbe8d5] flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-slate-700">
          <div>
            <p className="font-semibold text-slate-800">
              {role === 'farmer'
                ? 'Configured for crop cultivation, soil scanning, farm records, and produce selling.'
                : 'Configured for wholesale produce procurement, mandi rate tracking, and grower inquiries.'}
            </p>
            <p className="text-[11px] text-slate-500 mt-0.5">
              Switching will change your 5 bottom navigation tabs and dashboard layout.
            </p>
          </div>

          <button
            onClick={() => setShowRoleConfirm(true)}
            className="px-4 py-2.5 bg-[#14492a] hover:bg-[#0e3a20] text-white rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 shadow-2xs shrink-0"
          >
            <ArrowRightLeft className="w-3.5 h-3.5" />
            <span>Switch to {targetRoleToSwitch === 'farmer' ? 'Farmer' : 'Buyer'} Role</span>
          </button>
        </div>
      </div>

      {/* Confirmation Modal for Role Switching */}
      {showRoleConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-sm w-full p-5 space-y-3.5 shadow-2xl border border-[#dce8d5]">
            {currentUser && !isMultiRoleAuthorized ? (
              <>
                <div className="w-12 h-12 rounded-2xl bg-amber-100 text-amber-800 flex items-center justify-center mx-auto">
                  <ShieldCheck className="w-6 h-6" />
                </div>

                <h3 className="text-sm font-bold text-slate-900 text-center">
                  Authentication Required
                </h3>

                <p className="text-xs text-slate-600 leading-relaxed text-center">
                  Your current account (<strong>{currentUser.email}</strong>) is registered as a{' '}
                  <span className="capitalize font-semibold text-slate-800">{role}</span>.
                </p>
                <p className="text-xs text-slate-600 leading-relaxed text-center bg-slate-50 p-2.5 rounded-xl border border-slate-200">
                  Access to the <strong>{targetRoleToSwitch === 'farmer' ? 'Farmer Cultivation' : 'Buyer Procurement'}</strong> dashboard requires authenticating with an authorized {targetRoleToSwitch} account.
                </p>

                <div className="flex flex-col gap-2 pt-1">
                  <button
                    onClick={() => {
                      setShowRoleConfirm(false);
                      if (onOpenAuthForRole) onOpenAuthForRole(targetRoleToSwitch);
                    }}
                    className="w-full min-h-[42px] rounded-xl bg-[#14492a] hover:bg-[#0f3820] text-white text-xs font-bold transition shadow-xs flex items-center justify-center gap-1.5"
                  >
                    <LogIn className="w-4 h-4" />
                    <span>Sign In / Register as {targetRoleToSwitch === 'farmer' ? 'Farmer' : 'Buyer'}</span>
                  </button>
                  <button
                    onClick={() => setShowRoleConfirm(false)}
                    className="w-full min-h-[40px] rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition"
                  >
                    Cancel & Keep Current Session
                  </button>
                </div>
              </>
            ) : currentUser && isMultiRoleAuthorized ? (
              <>
                <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-800 flex items-center justify-center mx-auto">
                  <ArrowRightLeft className="w-6 h-6" />
                </div>

                <h3 className="text-sm font-bold text-slate-900 text-center">
                  Switch to {targetRoleToSwitch === 'farmer' ? 'Farmer' : 'Buyer'} Workspace
                </h3>

                <p className="text-xs text-slate-600 leading-relaxed text-center">
                  Your account (<strong>{currentUser.email}</strong>) is authorized for both roles.
                  Switching will activate your {targetRoleToSwitch} dashboard under your verified identity.
                </p>

                <div className="flex gap-2 pt-2">
                  <button
                    onClick={handleConfirmRoleSwitch}
                    className="flex-1 min-h-[42px] rounded-xl bg-[#14492a] hover:bg-[#0f3820] text-white text-xs font-bold transition shadow-xs"
                  >
                    Confirm Switch
                  </button>
                  <button
                    onClick={() => setShowRoleConfirm(false)}
                    className="flex-1 min-h-[42px] rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition"
                  >
                    Cancel
                  </button>
                </div>
              </>
            ) : (
              <>
                <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-800 flex items-center justify-center mx-auto">
                  <ArrowRightLeft className="w-6 h-6" />
                </div>

                <h3 className="text-sm font-bold text-slate-900 text-center">
                  Preview {targetRoleToSwitch === 'farmer' ? 'Farmer' : 'Buyer'} Layout?
                </h3>

                <p className="text-xs text-slate-600 leading-relaxed text-center">
                  You are currently browsing as a guest. Switching will preview the {targetRoleToSwitch} workspace layout without private personal records.
                </p>

                <div className="flex flex-col gap-2 pt-1">
                  <button
                    onClick={handleConfirmRoleSwitch}
                    className="w-full min-h-[40px] rounded-xl bg-[#14492a] hover:bg-[#0f3820] text-white text-xs font-bold transition shadow-xs"
                  >
                    Preview {targetRoleToSwitch === 'farmer' ? 'Farmer' : 'Buyer'} Workspace
                  </button>
                  <button
                    onClick={() => {
                      setShowRoleConfirm(false);
                      if (onOpenAuthForRole) onOpenAuthForRole(targetRoleToSwitch);
                    }}
                    className="w-full min-h-[40px] rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-900 text-xs font-bold transition border border-emerald-200 flex items-center justify-center gap-1.5"
                  >
                    <LogIn className="w-4 h-4" />
                    <span>Sign In / Register as {targetRoleToSwitch === 'farmer' ? 'Farmer' : 'Buyer'}</span>
                  </button>
                  <button
                    onClick={() => setShowRoleConfirm(false)}
                    className="w-full min-h-[40px] rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition"
                  >
                    Cancel
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* 2. ROLE-SPECIFIC PROFILE FORM */}
      {role === 'farmer' ? (
        /* Farmer Details Form */
        <div className="bg-white rounded-3xl p-5 border border-[#dce8d5] shadow-xs space-y-4">
          <div className="flex items-center gap-2">
            <User className="w-4 h-4 text-emerald-700" />
            <h2 className="text-sm font-bold text-[#144225] font-display">
              {t.farmerDetails}
            </h2>
          </div>

          <form onSubmit={handleSaveFarmerProfile} className="space-y-3.5">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Farmer / Manager Name
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3 py-2 bg-[#f8faf6] border border-[#d2dfcc] rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-emerald-600/30"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Farm Name
                </label>
                <input
                  type="text"
                  value={profile.farmName}
                  onChange={(e) =>
                    onUpdateProfile({ ...profile, farmName: e.target.value })
                  }
                  className="w-full px-3 py-2 bg-[#f8faf6] border border-[#d2dfcc] rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-emerald-600/30"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Village or District (Weather Location)
                </label>
                <input
                  type="text"
                  value={village}
                  onChange={(e) => setVillage(e.target.value)}
                  className="w-full px-3 py-2 bg-[#f8faf6] border border-[#d2dfcc] rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-emerald-600/30"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  State
                </label>
                <input
                  type="text"
                  value={farmerState}
                  onChange={(e) => setFarmerState(e.target.value)}
                  className="w-full px-3 py-2 bg-[#f8faf6] border border-[#d2dfcc] rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-emerald-600/30"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Contact Phone Number
              </label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full px-3 py-2 bg-[#f8faf6] border border-[#d2dfcc] rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-emerald-600/30"
              />
            </div>

            {/* Units Selection */}
            <div className="pt-2 border-t border-slate-100">
              <div className="flex items-center gap-2 mb-2">
                <Ruler className="w-3.5 h-3.5 text-emerald-700" />
                <span className="text-xs font-bold text-slate-800">{t.units}</span>
              </div>
              <div className="grid grid-cols-3 gap-2 text-xs">
                <div>
                  <label className="block text-[10px] text-slate-500 mb-1">Area Unit</label>
                  <select
                    value={areaUnit}
                    onChange={(e) => setAreaUnit(e.target.value as AreaUnit)}
                    className="w-full px-2 py-1.5 bg-[#f8faf6] border border-[#d2dfcc] rounded-xl text-xs font-medium"
                  >
                    <option value="acres">Acres</option>
                    <option value="hectares">Hectares</option>
                    <option value="bigha">Bigha</option>
                    <option value="guntha">Guntha</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] text-slate-500 mb-1">Weight Unit</label>
                  <select
                    value={weightUnit}
                    onChange={(e) => setWeightUnit(e.target.value as WeightUnit)}
                    className="w-full px-2 py-1.5 bg-[#f8faf6] border border-[#d2dfcc] rounded-xl text-xs font-medium"
                  >
                    <option value="quintal">Quintal</option>
                    <option value="kg">Kilogram</option>
                    <option value="ton">Ton</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] text-slate-500 mb-1">Temp Unit</label>
                  <select
                    value={tempUnit}
                    onChange={(e) => setTempUnit(e.target.value as TemperatureUnit)}
                    className="w-full px-2 py-1.5 bg-[#f8faf6] border border-[#d2dfcc] rounded-xl text-xs font-medium"
                  >
                    <option value="celsius">Celsius (°C)</option>
                    <option value="fahrenheit">Fahrenheit (°F)</option>
                  </select>
                </div>
              </div>
            </div>

            <button
              type="submit"
              className="w-full py-2.5 bg-[#14492a] hover:bg-[#0f3820] text-white rounded-xl text-xs font-bold transition shadow-xs mt-2"
            >
              Save Farmer Profile & Measurement Preferences
            </button>
          </form>
        </div>
      ) : (
        /* Buyer Details Form */
        <div className="bg-white rounded-3xl p-5 border border-[#dce8d5] shadow-xs space-y-4">
          <div className="flex items-center gap-2">
            <Building2 className="w-4 h-4 text-emerald-700" />
            <h2 className="text-sm font-bold text-[#144225] font-display">
              Buyer Procurement Profile
            </h2>
          </div>

          <form onSubmit={handleSaveBuyerProfile} className="space-y-3.5">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Procurement Manager / Buyer Name
                </label>
                <input
                  type="text"
                  value={bName}
                  onChange={(e) => setBName(e.target.value)}
                  className="w-full px-3 py-2 bg-[#f8faf6] border border-[#d2dfcc] rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-emerald-600/30"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Business / Trading Firm Name
                </label>
                <input
                  type="text"
                  value={bBusiness}
                  onChange={(e) => setBBusiness(e.target.value)}
                  placeholder="E.g., Kulkarni Agro Traders"
                  className="w-full px-3 py-2 bg-[#f8faf6] border border-[#d2dfcc] rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-emerald-600/30"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Business Type
                </label>
                <select
                  value={bType}
                  onChange={(e) => setBType(e.target.value as BuyerProfile['businessType'])}
                  className="w-full px-3 py-2 bg-[#f8faf6] border border-[#d2dfcc] rounded-xl text-xs font-medium"
                >
                  <option value="Wholesale Trader">Wholesale Trader</option>
                  <option value="Retailer">Retailer</option>
                  <option value="Food Processor / Miller">Food Processor / Miller</option>
                  <option value="Exporter">Exporter</option>
                  <option value="Commission Agent / Mandi Trader">Mandi Commission Agent</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Mandi / City Location
                </label>
                <input
                  type="text"
                  value={bLocation}
                  onChange={(e) => setBLocation(e.target.value)}
                  className="w-full px-3 py-2 bg-[#f8faf6] border border-[#d2dfcc] rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-emerald-600/30"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  State
                </label>
                <input
                  type="text"
                  value={bState}
                  onChange={(e) => setBState(e.target.value)}
                  className="w-full px-3 py-2 bg-[#f8faf6] border border-[#d2dfcc] rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-emerald-600/30"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Contact Phone Number *
                </label>
                <input
                  type="tel"
                  value={bPhone}
                  onChange={(e) => setBPhone(e.target.value)}
                  className="w-full px-3 py-2 bg-[#f8faf6] border border-[#d2dfcc] rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-emerald-600/30"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Email (Optional)
                </label>
                <input
                  type="email"
                  value={bEmail}
                  onChange={(e) => setBEmail(e.target.value)}
                  placeholder="trader@mandi.in"
                  className="w-full px-3 py-2 bg-[#f8faf6] border border-[#d2dfcc] rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-emerald-600/30"
                />
              </div>
            </div>

            <button
              type="submit"
              className="w-full py-2.5 bg-[#14492a] hover:bg-[#0f3820] text-white rounded-xl text-xs font-bold transition shadow-xs mt-2"
            >
              Save Buyer Procurement Profile
            </button>
          </form>
        </div>
      )}

      {/* 3. APPLICATION LANGUAGE PREFERENCE */}
      <div className="bg-white rounded-3xl p-5 border border-[#dce8d5] shadow-xs space-y-3">
        <div className="flex items-center gap-2">
          <Globe className="w-4 h-4 text-emerald-700" />
          <h2 className="text-sm font-bold text-[#144225] font-display">
            {t.language}
          </h2>
        </div>

        <div className="grid grid-cols-3 sm:grid-cols-3 gap-2">
          {LANGUAGES.map((lang) => {
            const isSelected = language === lang.code;
            return (
              <button
                key={lang.code}
                onClick={() => onLanguageChange(lang.code)}
                className={`p-2.5 rounded-xl text-xs font-semibold transition text-left ${
                  isSelected
                    ? 'bg-[#14492a] text-white shadow-xs'
                    : 'bg-[#f8faf6] text-slate-700 hover:bg-[#f1f6ed] border border-[#e1ebd9]'
                }`}
              >
                <div className="font-bold flex items-center justify-between">
                  <span>{lang.localLabel}</span>
                  <span className={`text-[9px] px-1 py-0.2 rounded font-medium ${
                    isSelected ? 'bg-emerald-500/30 text-emerald-100' : 'bg-emerald-50 text-emerald-800'
                  }`}>
                    🎙️ Voice
                  </span>
                </div>
                <div className={`text-[10px] ${isSelected ? 'text-emerald-200' : 'text-slate-500'}`}>
                  {lang.label}
                </div>
              </button>
            );
          })}
        </div>

        {/* Voice Assistance Capability & Android Voice Engine Notice */}
        <div className="p-3.5 bg-[#f6f9f3] rounded-2xl border border-[#dbe7d5] space-y-2 text-xs">
          <div className="flex items-center gap-2 text-[#144225] font-bold">
            <Sparkles className="w-4 h-4 text-emerald-600" />
            <span>Voice Assistance in {LANGUAGES.find(l => l.code === language)?.localLabel || 'Your Language'}</span>
          </div>
          <p className="text-[11px] text-slate-600 leading-relaxed">
            AgriConnect supports speaking your farming questions and listening to diagnoses aloud.
            Speech recognition uses browser speech API, while spoken audio uses your Android phone’s installed Text-To-Speech engine.
          </p>
          <div className="pt-1 text-[10px] text-slate-500">
            <strong>Device Tip:</strong> On Android, verify installed language voices under <em>Settings &gt; Accessibility &gt; Text-to-Speech Output &gt; Install voice data</em>.
          </div>
        </div>
      </div>

      {/* 3B. DISPLAY & ACCESSIBILITY SECTION (TEXT SIZE & CONTRAST) */}
      <div 
        className="bg-white rounded-3xl p-5 border border-[#dce8d5] shadow-xs space-y-4"
        role="region"
        aria-labelledby="accessibility-settings-heading"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Type className="w-4.5 h-4.5 text-emerald-700" aria-hidden="true" />
            <div>
              <h2 id="accessibility-settings-heading" className="text-sm font-bold text-[#144225] font-display">
                Display & Accessibility (वाचन व मजकूर आकार / Text Size)
              </h2>
              <p className="text-[11px] text-slate-500">
                Adjust text scale for better legibility on mobile and in bright sunlight
              </p>
            </div>
          </div>
          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200">
            High Contrast
          </span>
        </div>

        {/* Text Size Radiogroup */}
        <div 
          className="grid grid-cols-1 sm:grid-cols-3 gap-2.5"
          role="radiogroup"
          aria-label="Adjustable text size options"
        >
          {[
            { id: 'standard' as TextSize, title: 'Standard', scale: '100%', desc: 'Default system scale for compact viewing' },
            { id: 'large' as TextSize, title: 'Large', scale: '115%', desc: 'Recommended for mobile reading & Indic fonts' },
            { id: 'xlarge' as TextSize, title: 'Extra Large', scale: '130%', desc: 'Maximum legibility for low-vision & field use' },
          ].map((option) => {
            const isSelected = (textSize || 'standard') === option.id;
            return (
              <button
                key={option.id}
                type="button"
                role="radio"
                aria-checked={isSelected}
                onClick={() => {
                  if (onTextSizeChange) {
                    onTextSizeChange(option.id);
                  } else {
                    storageService.saveTextSize(option.id);
                  }
                }}
                className={`p-3.5 rounded-2xl border-2 transition text-left flex flex-col justify-between min-h-[58px] cursor-pointer focus:outline-none focus-visible:ring-3 focus-visible:ring-emerald-600 ${
                  isSelected
                    ? 'border-emerald-700 bg-emerald-50 text-emerald-950 shadow-xs'
                    : 'border-slate-200 hover:border-slate-300 bg-white text-slate-700'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-extrabold text-xs text-[#0e3b20]">{option.title}</span>
                  <div className="flex items-center gap-1">
                    <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-slate-100 text-slate-700">
                      {option.scale}
                    </span>
                    {isSelected && <Check className="w-4 h-4 text-emerald-700 stroke-[3]" aria-hidden="true" />}
                  </div>
                </div>
                <p className="text-[11px] text-slate-600 mt-1 leading-snug">
                  {option.desc}
                </p>
              </button>
            );
          })}
        </div>

        {/* Live Typography Preview Box */}
        <div className="p-4 bg-[#f6f9f3] rounded-2xl border border-[#dbe7d5] space-y-1.5">
          <span className="text-[10px] font-bold text-emerald-900 uppercase tracking-wider block">
            Live Readability Preview
          </span>
          <p className="font-medium text-slate-800 leading-relaxed text-sm">
            “AgriConnect connects farmers with verified buyers, offers real-time crop disease diagnosis, and delivers local mandi price intelligence.”
          </p>
          <p className="text-[11px] text-slate-600 mt-1">
            ✓ WCAG AA compliant contrast (≥ 4.5:1) • Accessible 44–48px touch targets • Android TalkBack screen reader compatible
          </p>
        </div>
      </div>

      {/* 4. ACCOUNT SECURITY & PASSWORD MANAGEMENT */}
      <div className="bg-white rounded-3xl p-5 border border-[#dce8d5] shadow-xs space-y-4">
        <div className="flex items-center gap-2">
          <Lock className="w-4 h-4 text-emerald-700" />
          <h2 className="text-sm font-bold text-[#144225] font-display">
            {t.accountSecurity || 'Account Security & Password'}
          </h2>
        </div>

        {passwordFeedback && (
          <div
            className={`p-3 rounded-xl text-xs flex items-center gap-2 ${
              passwordFeedback.type === 'success'
                ? 'bg-emerald-50 text-emerald-900 border border-emerald-200'
                : 'bg-red-50 text-red-900 border border-red-200'
            }`}
          >
            {passwordFeedback.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0" />
            ) : (
              <AlertTriangle className="w-4 h-4 text-red-700 shrink-0" />
            )}
            <span>{passwordFeedback.message}</span>
          </div>
        )}

        <form onSubmit={handleChangePassword} className="space-y-3">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              {t.currentPasswordLabel || 'Current Password'}
            </label>
            <input
              type="password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              placeholder="••••••••"
              required
              className="w-full px-3 py-2 bg-[#f8faf6] border border-[#d2dfcc] rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-emerald-600/30"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                {t.newPasswordLabel || 'New Password'}
              </label>
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="At least 6 characters"
                required
                className="w-full px-3 py-2 bg-[#f8faf6] border border-[#d2dfcc] rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-emerald-600/30"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                {t.confirmNewPasswordLabel || 'Confirm New Password'}
              </label>
              <input
                type="password"
                value={confirmNewPassword}
                onChange={(e) => setConfirmNewPassword(e.target.value)}
                placeholder="Confirm new password"
                required
                className="w-full px-3 py-2 bg-[#f8faf6] border border-[#d2dfcc] rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-emerald-600/30"
              />
            </div>
          </div>

          <div className="flex items-center justify-between pt-1">
            <button
              type="submit"
              disabled={isChangingPassword}
              className="px-4 py-2 bg-[#14492a] hover:bg-[#0f3820] text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-xs disabled:opacity-50"
            >
              <KeyRound className="w-3.5 h-3.5" />
              <span>{isChangingPassword ? 'Updating...' : (t.savePasswordBtn || 'Update Password')}</span>
            </button>

            <button
              type="button"
              onClick={() => setShowDeleteConfirm(true)}
              className="text-xs text-red-600 hover:text-red-700 font-semibold"
            >
              {t.deleteAccountBtn || 'Delete Account'}
            </button>
          </div>
        </form>
      </div>

      {/* 5. PERSISTENT STORAGE, AUTHENTICATION & DATA TOOLS */}
      <div className="bg-white rounded-3xl p-5 border border-[#dce8d5] shadow-xs space-y-3.5">
        <div className="flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-emerald-700" />
          <h2 className="text-sm font-bold text-[#144225] font-display">
            {t.storageInfo} & Security Disclosure
          </h2>
        </div>

        <div className="p-3.5 bg-[#f5f9f3] rounded-2xl border border-[#dbe8d5] text-xs text-slate-700 space-y-2 leading-relaxed">
          <p>
            <strong>Role-Based Access Enforcement:</strong> Produce listing creation and deletion permissions are strictly validated by the backend service. Only users configured in the <em>Farmer</em> role can publish harvests, and only the original seller can delete their listing.
          </p>
          <p>
            <strong>Privacy & Data Consent:</strong> Private farm logs (plots, crop doctor diagnoses, and soil scans) are strictly local to the farmer's workspace. Buyer phone numbers are only shared with a grower upon explicitly submitting a purchase enquiry.
          </p>
          <p>
            <strong>Local Storage & Cloud Persistence:</strong> Role preferences and local caches are stored on your device. Cross-device shared marketplace listings and buyer enquiries are persisted through the application's Express API.
          </p>
        </div>

        {/* Data Tools */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
          <button
            onClick={handleExportBackup}
            className="flex items-center justify-center gap-2 p-3 min-h-[44px] rounded-xl bg-white border border-[#cfe2ca] hover:bg-[#f7faf5] text-xs font-bold text-[#14492a] transition"
          >
            <Download className="w-4 h-4 text-emerald-700" />
            <span>{t.exportBackup}</span>
          </button>

          <label className="flex items-center justify-center gap-2 p-3 min-h-[44px] rounded-xl bg-white border border-[#cfe2ca] hover:bg-[#f7faf5] text-xs font-bold text-[#14492a] transition cursor-pointer">
            <Upload className="w-4 h-4 text-emerald-700" />
            <span>{t.importBackup}</span>
            <input
              type="file"
              accept=".json"
              onChange={handleImportBackup}
              className="hidden"
            />
          </label>
        </div>

        {/* Reset & Clear Controls */}
        <div className="pt-2 border-t border-slate-100 flex flex-col sm:flex-row gap-2">
          <button
            onClick={handleResetDemoData}
            className="flex-1 flex items-center justify-center gap-1.5 p-2.5 min-h-[40px] rounded-xl bg-[#f8faf6] border border-[#dce8d5] text-slate-700 hover:bg-white text-xs font-semibold transition"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>{t.resetDemoData}</span>
          </button>

          <button
            onClick={() => setShowClearConfirm(true)}
            className="flex items-center justify-center gap-1.5 p-2.5 min-h-[40px] rounded-xl bg-red-50 hover:bg-red-100 text-red-700 text-xs font-semibold transition"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Clear Local Storage</span>
          </button>
        </div>
      </div>

      {/* Confirmation Modal for Clearing Data */}
      {showClearConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-sm w-full p-5 text-center space-y-3 shadow-2xl border border-red-200">
            <div className="w-12 h-12 rounded-2xl bg-red-100 flex items-center justify-center mx-auto text-red-600">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <h3 className="text-sm font-bold text-slate-900">Clear All Local Data?</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              This will remove all saved crops, field observations, soil scans, buyer enquiries, and marketplace listings from this device.
            </p>
            <div className="flex gap-2 pt-2">
              <button
                onClick={handleClearAllData}
                className="flex-1 min-h-[42px] rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-bold transition"
              >
                Yes, Clear
              </button>
              <button
                onClick={() => setShowClearConfirm(false)}
                className="flex-1 min-h-[42px] rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirmation Modal for Deleting Account */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-sm w-full p-5 text-center space-y-3 shadow-2xl border border-red-200">
            <div className="w-12 h-12 rounded-2xl bg-red-100 flex items-center justify-center mx-auto text-red-600">
              <Trash2 className="w-6 h-6" />
            </div>
            <h3 className="text-sm font-bold text-slate-900">Delete Account Permanently?</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              This action cannot be undone. Enter your password to permanently delete your AgriConnect account credentials.
            </p>
            <input
              type="password"
              placeholder="Confirm your password"
              value={deletePassword}
              onChange={(e) => setDeletePassword(e.target.value)}
              className="w-full px-3 py-2 bg-[#f8faf6] border border-red-200 rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-red-400"
            />
            <div className="flex gap-2 pt-2">
              <button
                onClick={handleDeleteAccount}
                disabled={isDeletingAccount}
                className="flex-1 min-h-[42px] rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-bold transition disabled:opacity-50"
              >
                {isDeletingAccount ? 'Deleting...' : 'Confirm Delete'}
              </button>
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="flex-1 min-h-[42px] rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Footer Info */}
      <div className="bg-[#f0f6ee] rounded-3xl p-5 border border-[#cfe2cb] text-center space-y-2">
        <AgrovaLogo variant="full" size="md" />
        <p className="text-[11px] text-slate-500">
          Version 1.1.0 • Mobile Agriculture Platform
        </p>
        <p className="text-[10px] text-emerald-800 font-medium">
          Empowering Indian farmers and wholesale buyers with direct, transparent trade & agronomic intelligence.
        </p>
      </div>
    </div>
  );
};

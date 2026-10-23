import React, { useState } from 'react';
import { 
  Sprout, 
  Store, 
  ShieldCheck, 
  Lock, 
  Mail, 
  User, 
  Phone,
  MapPin, 
  Eye, 
  EyeOff, 
  ArrowRight, 
  CheckCircle2, 
  AlertCircle,
  KeyRound,
  RotateCcw,
  Sparkles,
  Globe,
  X
} from 'lucide-react';
import { UserRole, SupportedLanguage, AuthUser, FarmerProfile, BuyerProfile } from '../types';
import { TRANSLATIONS, LANGUAGES } from '../constants/translations';
import { authService } from '../services/authService';
import { AgrovaLogo } from './AgrovaLogo';
import { validatePhoneNumber } from '../utils/phoneValidation';

interface AuthScreenProps {
  language: SupportedLanguage;
  onLanguageChange: (lang: SupportedLanguage) => void;
  onAuthSuccess: (user: AuthUser, profile: FarmerProfile | BuyerProfile) => void;
  onClose?: () => void;
  initialRole?: UserRole;
  initialMode?: 'signin' | 'register' | 'forgot';
  authNotice?: string;
}

export const AuthScreen: React.FC<AuthScreenProps> = ({
  language,
  onLanguageChange,
  onAuthSuccess,
  onClose,
  initialRole,
  initialMode,
  authNotice,
}) => {
  const t = TRANSLATIONS[language]?.auth || TRANSLATIONS.en.auth;

  // View state: 'signin' | 'register' | 'forgot'
  const [mode, setMode] = useState<'signin' | 'register' | 'forgot'>(initialMode || 'register');

  // Form states
  const [role, setRole] = useState<UserRole>(initialRole || 'farmer');
  const [name, setName] = useState<string>('');
  const [email, setEmail] = useState<string>('');
  const [phone, setPhone] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [confirmPassword, setConfirmPassword] = useState<string>('');
  const [showPassword, setShowPassword] = useState<boolean>(false);

  // Role-specific profile fields
  const [district, setDistrict] = useState<string>('Vijayapura');
  const [farmArea, setFarmArea] = useState<string>('5');
  const [businessName, setBusinessName] = useState<string>('');
  const [businessType, setBusinessType] = useState<string>('Wholesale Trader');

  // Recovery states
  const [recoveryCode, setRecoveryCode] = useState<string>('');
  const [newPassword, setNewPassword] = useState<string>('');
  const [confirmNewPassword, setConfirmNewPassword] = useState<string>('');
  const [recoveryStep, setRecoveryStep] = useState<1 | 2>(1);

  // Status feedback
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Quick test account fillers (Phase 2 compliance)
  const handleFillTestFarmer = () => {
    setRole('farmer');
    setName('Ananya Patil');
    setEmail('agriconnect.farmer.test@example.com');
    setPhone('+91 98450 12345');
    setDistrict('Vijayapura');
    setFarmArea('5');
    setErrorMessage(null);
  };

  const handleFillTestBuyer = () => {
    setRole('buyer');
    setName('Rajesh Kumar');
    setEmail('agriconnect.buyer.test@example.com');
    setPhone('+91 94481 67890');
    setDistrict('Vijayapura APMC');
    setBusinessName('Karnataka Agri Procurement Ltd');
    setBusinessType('Wholesale Trader');
    setErrorMessage(null);
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    if (!name.trim()) {
      setErrorMessage(t.errorNameRequired);
      return;
    }
    if (!email.trim() || !email.includes('@')) {
      setErrorMessage(t.errorInvalidEmail);
      return;
    }

    // Requirement 3: Mandatory Phone Number Validation
    if (!phone.trim()) {
      setErrorMessage('Mobile phone number is mandatory. Please enter your 10-digit Indian mobile number.');
      return;
    }
    const phoneResult = validatePhoneNumber(phone);
    if (!phoneResult.valid || !phoneResult.normalized) {
      setErrorMessage(phoneResult.error || 'Please enter a valid 10-digit Indian mobile number (e.g. 9845012345 or +91 98450 12345).');
      return;
    }

    if (password.length < 6) {
      setErrorMessage(t.errorPassLength);
      return;
    }
    if (password !== confirmPassword) {
      setErrorMessage(t.errorPassMismatch);
      return;
    }

    setIsLoading(true);
    const result = await authService.register({
      name: name.trim(),
      email: email.trim(),
      phone: phoneResult.normalized,
      password,
      role,
      farmDistrict: district.trim(),
      farmArea: Number(farmArea) || 5,
      businessName: businessName.trim(),
      businessType,
      language,
    });
    setIsLoading(false);

    if (result.success && result.user && result.profile) {
      setSuccessMessage(t.successRegistered);
      setTimeout(() => {
        onAuthSuccess(result.user!, result.profile!);
      }, 500);
    } else {
      setErrorMessage(result.error || 'Registration failed. Please try again.');
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    if (!email.trim() || !email.includes('@')) {
      setErrorMessage(t.errorInvalidEmail);
      return;
    }
    if (!password) {
      setErrorMessage(t.errorPassLength);
      return;
    }

    setIsLoading(true);
    const result = await authService.login(email.trim(), password);
    setIsLoading(false);

    if (result.success && result.user && result.profile) {
      setSuccessMessage(t.successLoggedIn);
      setTimeout(() => {
        onAuthSuccess(result.user!, result.profile!);
      }, 500);
    } else {
      setErrorMessage(result.error || 'Invalid email or password.');
    }
  };

  const handleRequestRecovery = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    if (!email.trim() || !email.includes('@')) {
      setErrorMessage(t.errorInvalidEmail);
      return;
    }

    setIsLoading(true);
    const res = await authService.requestPasswordRecovery(email.trim());
    setIsLoading(false);

    if (res.success) {
      setRecoveryStep(2);
      if (res.recoveryCode) {
        setRecoveryCode(res.recoveryCode);
      }
      setSuccessMessage(res.message || 'Recovery code generated. Please set your new password.');
    } else {
      setErrorMessage(res.error || 'Failed to generate recovery code.');
    }
  };

  const handleConfirmReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    if (!recoveryCode.trim()) {
      setErrorMessage('Please enter the recovery code.');
      return;
    }
    if (newPassword.length < 6) {
      setErrorMessage(t.errorPassLength);
      return;
    }
    if (newPassword !== confirmNewPassword) {
      setErrorMessage(t.errorPassMismatch);
      return;
    }

    setIsLoading(true);
    const res = await authService.resetPassword(email.trim(), recoveryCode.trim(), newPassword);
    setIsLoading(false);

    if (res.success) {
      setSuccessMessage(t.successPassReset);
      setPassword(newPassword);
      setTimeout(() => {
        setMode('signin');
        setRecoveryStep(1);
      }, 1500);
    } else {
      setErrorMessage(res.error || 'Failed to reset password.');
    }
  };

  const currentLangObj = LANGUAGES.find((l) => l.code === language) || LANGUAGES[0];

  return (
    <div className="min-h-screen bg-[#f4f7f0] flex flex-col justify-center items-center px-3.5 py-6 sm:p-6 text-[#144225]">
      {/* Brand & Language Bar */}
      <div className="w-full max-w-lg mb-4 flex items-center justify-between">
        <AgrovaLogo size="md" subtitleText="Smart Farming. Fair Earnings." />
        <div className="flex items-center gap-2">
          <Globe className="w-4 h-4 text-emerald-700" aria-hidden="true" />
          <label htmlFor="auth-lang-select" className="sr-only">
            Select Language
          </label>
          <select
            id="auth-lang-select"
            aria-label="Select application language"
            value={language}
            onChange={(e) => onLanguageChange(e.target.value as SupportedLanguage)}
            className="text-xs font-bold bg-white border border-[#d2e2cd] rounded-xl px-2.5 py-2 min-h-[44px] text-[#144225] shadow-2xs focus:outline-none focus:ring-2 focus:ring-emerald-500 cursor-pointer"
          >
            {LANGUAGES.map((l) => (
              <option key={l.code} value={l.code}>
                {l.localLabel} ({l.label})
              </option>
            ))}
          </select>
          {onClose && (
            <button
              onClick={onClose}
              className="w-11 h-11 min-w-[44px] min-h-[44px] rounded-full bg-white border border-[#d2e2cd] text-slate-500 hover:text-slate-800 flex items-center justify-center transition active:scale-95 focus:outline-none focus-visible:ring-3 focus-visible:ring-emerald-600"
              aria-label="Close authentication dialog"
              title="Close"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Main Auth Card */}
      <div className="w-full max-w-lg bg-white rounded-3xl shadow-xl border border-[#dce8d5] overflow-hidden" role="region" aria-label="User Account Form">
        {/* Top Mode Tabs */}
        <div className="grid grid-cols-2 bg-[#f0f6eb] border-b border-[#dbe7d4] p-1.5" role="tablist" aria-label="Authentication mode selection">
          <button
            type="button"
            role="tab"
            aria-selected={mode === 'register'}
            id="tab-register"
            aria-controls="panel-register"
            onClick={() => {
              setMode('register');
              setErrorMessage(null);
            }}
            className={`py-2.5 min-h-[44px] text-xs font-bold rounded-2xl transition-all flex items-center justify-center focus:outline-none focus-visible:ring-3 focus-visible:ring-emerald-600 ${
              mode === 'register'
                ? 'bg-white text-[#14492a] shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            {t.createAccountTab}
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={mode === 'signin' || mode === 'forgot'}
            id="tab-signin"
            aria-controls="panel-signin"
            onClick={() => {
              setMode('signin');
              setErrorMessage(null);
            }}
            className={`py-2.5 min-h-[44px] text-xs font-bold rounded-2xl transition-all flex items-center justify-center focus:outline-none focus-visible:ring-3 focus-visible:ring-emerald-600 ${
              mode === 'signin' || mode === 'forgot'
                ? 'bg-white text-[#14492a] shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            {t.signInTab}
          </button>
        </div>

        <div className="p-5 sm:p-7">
          {/* Contextual Notice (e.g. Role Switch Authentication Requirement) */}
          {authNotice && (
            <div role="status" aria-live="polite" className="mb-4 p-3 bg-amber-50 border border-amber-200 text-amber-900 rounded-2xl text-xs font-semibold flex items-center gap-2 animate-in fade-in">
              <ShieldCheck className="w-4 h-4 shrink-0 text-amber-700" aria-hidden="true" />
              <span>{authNotice}</span>
            </div>
          )}

          {/* Status Banners with screen-reader live regions */}
          {errorMessage && (
            <div role="alert" aria-live="assertive" className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-2xl text-xs font-semibold flex items-center gap-2 animate-in fade-in">
              <AlertCircle className="w-4 h-4 shrink-0 text-red-600" aria-hidden="true" />
              <span>{errorMessage}</span>
            </div>
          )}

          {successMessage && (
            <div role="status" aria-live="polite" className="mb-4 p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-2xl text-xs font-semibold flex items-center gap-2 animate-in fade-in">
              <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" aria-hidden="true" />
              <span>{successMessage}</span>
            </div>
          )}

          {/* ==================== CREATE ACCOUNT MODE ==================== */}
          {mode === 'register' && (
            <form onSubmit={handleRegister} className="space-y-4" id="panel-register" role="tabpanel" aria-labelledby="tab-register">
              <div>
                <h1 className="text-lg sm:text-xl font-black text-[#144225] font-display">
                  {t.welcomeTitle}
                </h1>
                <p className="text-xs text-slate-500 mt-0.5">
                  {t.welcomeSubtitle}
                </p>
              </div>

              {/* 1. Account Role Picker */}
              <div className="space-y-1.5" role="radiogroup" aria-label={t.chooseRole}>
                <span className="text-[11px] font-bold text-slate-700 block">
                  {t.chooseRole}
                </span>
                <div className="grid grid-cols-2 gap-2.5">
                  <div
                    role="radio"
                    aria-checked={role === 'farmer'}
                    tabIndex={0}
                    onClick={() => setRole('farmer')}
                    onKeyDown={(e) => {
                      if (e.key === ' ' || e.key === 'Enter') {
                        e.preventDefault();
                        setRole('farmer');
                      }
                    }}
                    className={`p-3 rounded-2xl border-2 cursor-pointer transition text-left flex flex-col justify-between focus:outline-none focus-visible:ring-3 focus-visible:ring-emerald-600 ${
                      role === 'farmer'
                        ? 'border-emerald-700 bg-emerald-50/70 text-emerald-950 shadow-2xs'
                        : 'border-slate-200 hover:border-slate-300 bg-white text-slate-700'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <div className="w-7 h-7 rounded-lg bg-emerald-700 text-white flex items-center justify-center">
                        <Sprout className="w-4 h-4" />
                      </div>
                      {role === 'farmer' && (
                        <CheckCircle2 className="w-4 h-4 text-emerald-700" />
                      )}
                    </div>
                    <div className="font-bold text-xs">{t.farmerRole}</div>
                    <p className="text-[10px] text-slate-500 mt-1 leading-tight line-clamp-2">
                      {t.farmerRoleDesc}
                    </p>
                  </div>

                  <div
                    role="radio"
                    aria-checked={role === 'buyer'}
                    tabIndex={0}
                    onClick={() => setRole('buyer')}
                    onKeyDown={(e) => {
                      if (e.key === ' ' || e.key === 'Enter') {
                        e.preventDefault();
                        setRole('buyer');
                      }
                    }}
                    className={`p-3 rounded-2xl border-2 cursor-pointer transition text-left flex flex-col justify-between focus:outline-none focus-visible:ring-3 focus-visible:ring-emerald-600 ${
                      role === 'buyer'
                        ? 'border-emerald-700 bg-emerald-50/70 text-emerald-950 shadow-2xs'
                        : 'border-slate-200 hover:border-slate-300 bg-white text-slate-700'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <div className="w-7 h-7 rounded-lg bg-[#0e3a20] text-white flex items-center justify-center">
                        <Store className="w-4 h-4" />
                      </div>
                      {role === 'buyer' && (
                        <CheckCircle2 className="w-4 h-4 text-emerald-700" />
                      )}
                    </div>
                    <div className="font-bold text-xs">{t.buyerRole}</div>
                    <p className="text-[10px] text-slate-500 mt-1 leading-tight line-clamp-2">
                      {t.buyerRoleDesc}
                    </p>
                  </div>
                </div>
              </div>

              {/* Test Filler Shortcut Chips */}
              <div className="p-2.5 bg-[#f6faf2] border border-[#dce8d5] rounded-2xl space-y-1.5">
                <span className="text-[10px] font-bold text-slate-500 block uppercase tracking-wider">
                  Testing Quick-Fill Examples (Phase 2):
                </span>
                <div className="flex flex-wrap gap-1.5">
                  <button
                    type="button"
                    onClick={handleFillTestFarmer}
                    className="text-[11px] font-bold px-2.5 py-1 bg-white hover:bg-emerald-100 text-emerald-800 rounded-lg border border-emerald-300 transition flex items-center gap-1 shadow-2xs"
                  >
                    <Sprout className="w-3 h-3" />
                    <span>{t.quickTestFarmerBtn}</span>
                  </button>
                  <button
                    type="button"
                    onClick={handleFillTestBuyer}
                    className="text-[11px] font-bold px-2.5 py-1 bg-white hover:bg-emerald-100 text-[#144225] rounded-lg border border-emerald-300 transition flex items-center gap-1 shadow-2xs"
                  >
                    <Store className="w-3 h-3" />
                    <span>{t.quickTestBuyerBtn}</span>
                  </button>
                </div>
              </div>

              {/* Common Fields */}
              <div className="space-y-3">
                <div>
                  <label htmlFor="reg-fullname" className="text-xs font-bold text-slate-700 block mb-1">
                    {t.fullNameLabel} *
                  </label>
                  <div className="relative">
                    <User className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" aria-hidden="true" />
                    <input
                      id="reg-fullname"
                      type="text"
                      required
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder={t.fullNamePlaceholder}
                      className="w-full pl-9 pr-3 py-2.5 min-h-[44px] bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-600 transition"
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="reg-email" className="text-xs font-bold text-slate-700 block mb-1">
                    {t.emailLabel} *
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" aria-hidden="true" />
                    <input
                      id="reg-email"
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder={t.emailPlaceholder}
                      className="w-full pl-9 pr-3 py-2.5 min-h-[44px] bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-600 transition"
                    />
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label htmlFor="reg-phone" className="text-xs font-bold text-slate-700 block">
                      Mobile Phone Number *
                    </label>
                    <span className="text-[10px] text-emerald-700 font-semibold">10-Digit Indian Mobile</span>
                  </div>
                  <div className="relative">
                    <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" aria-hidden="true" />
                    <input
                      id="reg-phone"
                      type="tel"
                      required
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="e.g. 98450 12345 or +91 98450 12345"
                      aria-describedby="reg-phone-hint"
                      className="w-full pl-9 pr-3 py-2.5 min-h-[44px] bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-600 transition"
                    />
                  </div>
                  <p id="reg-phone-hint" className="text-[10px] text-slate-500 mt-1">
                    Mandatory for trade coordination, purchase enquiries, and produce procurement.
                  </p>
                </div>

                {/* Role Specific Additional Details */}
                {role === 'farmer' ? (
                  <div className="grid grid-cols-2 gap-2.5">
                    <div>
                      <label htmlFor="reg-district" className="text-[11px] font-bold text-slate-700 block mb-1">
                        {t.districtLabel}
                      </label>
                      <input
                        id="reg-district"
                        type="text"
                        value={district}
                        onChange={(e) => setDistrict(e.target.value)}
                        placeholder={t.districtPlaceholder}
                        className="w-full px-3 py-2.5 min-h-[44px] bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-600 transition"
                      />
                    </div>
                    <div>
                      <label htmlFor="reg-farm-area" className="text-[11px] font-bold text-slate-700 block mb-1">
                        {t.farmAreaLabel}
                      </label>
                      <input
                        id="reg-farm-area"
                        type="number"
                        min="0.1"
                        step="0.5"
                        value={farmArea}
                        onChange={(e) => setFarmArea(e.target.value)}
                        placeholder="5"
                        className="w-full px-3 py-2.5 min-h-[44px] bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-600 transition"
                      />
                    </div>
                  </div>
                ) : (
                  <div className="space-y-2.5">
                    <div>
                      <label htmlFor="reg-business-name" className="text-[11px] font-bold text-slate-700 block mb-1">
                        {t.businessNameLabel}
                      </label>
                      <input
                        id="reg-business-name"
                        type="text"
                        value={businessName}
                        onChange={(e) => setBusinessName(e.target.value)}
                        placeholder={t.businessNamePlaceholder}
                        className="w-full px-3 py-2.5 min-h-[44px] bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-600 transition"
                      />
                    </div>
                  </div>
                )}

                {/* Password & Confirm */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <div>
                    <label htmlFor="reg-password" className="text-xs font-bold text-slate-700 block mb-1">
                      {t.passwordLabel} *
                    </label>
                    <div className="relative">
                      <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" aria-hidden="true" />
                      <input
                        id="reg-password"
                        type={showPassword ? 'text' : 'password'}
                        required
                        minLength={6}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="••••••••"
                        className="w-full pl-9 pr-11 py-2.5 min-h-[44px] bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-600 transition"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        aria-label={showPassword ? "Hide password" : "Show password"}
                        className="absolute right-1 top-1/2 -translate-y-1/2 w-10 h-10 min-w-[40px] min-h-[40px] flex items-center justify-center text-slate-400 hover:text-slate-600 rounded-lg focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600"
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  <div>
                    <label htmlFor="reg-confirm-password" className="text-xs font-bold text-slate-700 block mb-1">
                      {t.confirmPasswordLabel} *
                    </label>
                    <div className="relative">
                      <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" aria-hidden="true" />
                      <input
                        id="reg-confirm-password"
                        type={showPassword ? 'text' : 'password'}
                        required
                        minLength={6}
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        placeholder="••••••••"
                        className="w-full pl-9 pr-3 py-2.5 min-h-[44px] bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-600 transition"
                      />
                    </div>
                  </div>
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full min-h-[48px] rounded-xl bg-[#14492a] hover:bg-[#0f3820] text-white text-xs font-bold transition shadow-xs flex items-center justify-center gap-2 mt-2 cursor-pointer focus:outline-none focus-visible:ring-3 focus-visible:ring-emerald-600"
              >
                <span>{isLoading ? 'Processing...' : t.registerBtn}</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              <div className="text-center pt-2 text-xs text-slate-500">
                <span>Already registered? </span>
                <button
                  type="button"
                  onClick={() => {
                    setMode('signin');
                    setErrorMessage(null);
                  }}
                  className="font-bold text-emerald-800 hover:underline min-h-[36px] inline-flex items-center"
                >
                  {t.signInTab}
                </button>
              </div>
            </form>
          )}

          {/* ==================== SIGN IN MODE ==================== */}
          {mode === 'signin' && (
            <form onSubmit={handleLogin} className="space-y-4" id="panel-signin" role="tabpanel" aria-labelledby="tab-signin">
              <div>
                <h1 className="text-lg sm:text-xl font-black text-[#144225] font-display">
                  {t.signInTab}
                </h1>
                <p className="text-xs text-slate-500 mt-0.5">
                  Sign in with your verified AgriConnect login email and password.
                </p>
              </div>

              {/* Fast Test Account Shortcuts */}
              <div className="p-2.5 bg-[#f6faf2] border border-[#dce8d5] rounded-2xl space-y-1.5">
                <span className="text-[10px] font-bold text-slate-500 block uppercase tracking-wider">
                  Test Email Quick-Fill:
                </span>
                <div className="flex flex-wrap gap-1.5">
                  <button
                    type="button"
                    onClick={() => setEmail('agriconnect.farmer.test@example.com')}
                    className="text-[11px] font-bold px-2.5 py-1.5 min-h-[36px] bg-white hover:bg-emerald-100 text-emerald-800 rounded-lg border border-emerald-300 transition flex items-center shadow-2xs"
                  >
                    Farmer: agriconnect.farmer.test@example.com
                  </button>
                  <button
                    type="button"
                    onClick={() => setEmail('agriconnect.buyer.test@example.com')}
                    className="text-[11px] font-bold px-2.5 py-1.5 min-h-[36px] bg-white hover:bg-emerald-100 text-[#144225] rounded-lg border border-emerald-300 transition flex items-center shadow-2xs"
                  >
                    Buyer: agriconnect.buyer.test@example.com
                  </button>
                </div>
              </div>

              <div>
                <label htmlFor="signin-email" className="text-xs font-bold text-slate-700 block mb-1">
                  {t.emailLabel} *
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" aria-hidden="true" />
                  <input
                    id="signin-email"
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="name@example.com"
                    className="w-full pl-9 pr-3 py-2.5 min-h-[44px] bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-600 transition"
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label htmlFor="signin-password" className="text-xs font-bold text-slate-700">
                    {t.passwordLabel} *
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      setMode('forgot');
                      setErrorMessage(null);
                    }}
                    className="text-[11px] font-semibold text-emerald-800 hover:underline min-h-[36px] inline-flex items-center"
                  >
                    {t.forgotPasswordLink}
                  </button>
                </div>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" aria-hidden="true" />
                  <input
                    id="signin-password"
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full pl-9 pr-11 py-2.5 min-h-[44px] bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-600 transition"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    aria-label={showPassword ? "Hide password" : "Show password"}
                    className="absolute right-1 top-1/2 -translate-y-1/2 w-10 h-10 min-w-[40px] min-h-[40px] flex items-center justify-center text-slate-400 hover:text-slate-600 rounded-lg focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full min-h-[48px] rounded-xl bg-[#14492a] hover:bg-[#0f3820] text-white text-xs font-bold transition shadow-xs flex items-center justify-center gap-2 mt-2 cursor-pointer focus:outline-none focus-visible:ring-3 focus-visible:ring-emerald-600"
              >
                <span>{isLoading ? 'Signing In...' : t.signInBtn}</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              <div className="text-center pt-2 text-xs text-slate-500">
                <span>Need an account? </span>
                <button
                  type="button"
                  onClick={() => {
                    setMode('register');
                    setErrorMessage(null);
                  }}
                  className="font-bold text-emerald-800 hover:underline min-h-[36px] inline-flex items-center"
                >
                  {t.createAccountTab}
                </button>
              </div>
            </form>
          )}

          {/* ==================== FORGOT PASSWORD MODE ==================== */}
          {mode === 'forgot' && (
            <div className="space-y-4" role="region" aria-label="Password Reset Request">
              <div>
                <h1 className="text-lg sm:text-xl font-black text-[#144225] font-display flex items-center gap-2">
                  <KeyRound className="w-5 h-5 text-emerald-700" aria-hidden="true" />
                  <span>{t.forgotPasswordTitle}</span>
                </h1>
                <p className="text-xs text-slate-500 mt-0.5">
                  {t.forgotPasswordDesc}
                </p>
              </div>

              {recoveryStep === 1 ? (
                <form onSubmit={handleRequestRecovery} className="space-y-3">
                  <div>
                    <label htmlFor="forgot-email" className="text-xs font-bold text-slate-700 block mb-1">
                      {t.emailLabel} *
                    </label>
                    <div className="relative">
                      <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" aria-hidden="true" />
                      <input
                        id="forgot-email"
                        type="email"
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="agriconnect.farmer.test@example.com"
                        className="w-full pl-9 pr-3 py-2.5 min-h-[44px] bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-600 transition"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full min-h-[48px] rounded-xl bg-[#14492a] hover:bg-[#0f3820] text-white text-xs font-bold transition shadow-xs flex items-center justify-center gap-2 cursor-pointer focus:outline-none focus-visible:ring-3 focus-visible:ring-emerald-600"
                  >
                    <span>{isLoading ? 'Generating...' : t.sendResetCodeBtn}</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </form>
              ) : (
                <form onSubmit={handleConfirmReset} className="space-y-3">
                  <div>
                    <label htmlFor="recovery-code" className="text-xs font-bold text-slate-700 block mb-1">
                      {t.resetCodeLabel} *
                    </label>
                    <input
                      id="recovery-code"
                      type="text"
                      required
                      value={recoveryCode}
                      onChange={(e) => setRecoveryCode(e.target.value)}
                      placeholder="e.g. 7F3A9C12"
                      className="w-full px-3 py-2.5 min-h-[44px] bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono font-bold tracking-widest text-center focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-600 transition"
                    />
                  </div>

                  <div>
                    <label htmlFor="new-password" className="text-xs font-bold text-slate-700 block mb-1">
                      {t.newPasswordLabel} *
                    </label>
                    <input
                      id="new-password"
                      type="password"
                      required
                      minLength={6}
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full px-3 py-2.5 min-h-[44px] bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-600 transition"
                    />
                  </div>

                  <div>
                    <label htmlFor="confirm-new-password" className="text-xs font-bold text-slate-700 block mb-1">
                      {t.confirmNewPasswordLabel} *
                    </label>
                    <input
                      id="confirm-new-password"
                      type="password"
                      required
                      minLength={6}
                      value={confirmNewPassword}
                      onChange={(e) => setConfirmNewPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full px-3 py-2.5 min-h-[44px] bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-600 transition"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full min-h-[48px] rounded-xl bg-[#14492a] hover:bg-[#0f3820] text-white text-xs font-bold transition shadow-xs flex items-center justify-center gap-2 cursor-pointer focus:outline-none focus-visible:ring-3 focus-visible:ring-emerald-600"
                  >
                    <span>{isLoading ? 'Resetting...' : t.resetPasswordBtn}</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </form>
              )}

              <button
                type="button"
                onClick={() => {
                  setMode('signin');
                  setRecoveryStep(1);
                  setErrorMessage(null);
                }}
                className="w-full py-2.5 min-h-[44px] text-xs font-semibold text-slate-600 hover:text-slate-900 transition text-center flex items-center justify-center"
              >
                {t.backToSignIn}
              </button>
            </div>
          )}
        </div>

        {/* Security & Verification Guarantee */}
        <div className="p-3.5 bg-[#f4f7f1] border-t border-[#e2ebd9] text-[11px] text-[#4d6653] flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-emerald-700 shrink-0" />
          <span>
            Real salted PBKDF2 authentication with backend role permissions. No hardcoded passwords or client-side trust.
          </span>
        </div>
      </div>
    </div>
  );
};

import React, { useState } from 'react';
import { 
  Sprout, 
  Store, 
  ShieldCheck, 
  Lock, 
  Mail, 
  User, 
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

interface AuthScreenProps {
  language: SupportedLanguage;
  onLanguageChange: (lang: SupportedLanguage) => void;
  onAuthSuccess: (user: AuthUser, profile: FarmerProfile | BuyerProfile) => void;
  onClose?: () => void;
}

export const AuthScreen: React.FC<AuthScreenProps> = ({
  language,
  onLanguageChange,
  onAuthSuccess,
  onClose,
}) => {
  const t = TRANSLATIONS[language]?.auth || TRANSLATIONS.en.auth;

  // View state: 'signin' | 'register' | 'forgot'
  const [mode, setMode] = useState<'signin' | 'register' | 'forgot'>('register');

  // Form states
  const [role, setRole] = useState<UserRole>('farmer');
  const [name, setName] = useState<string>('');
  const [email, setEmail] = useState<string>('');
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
    setEmail('agrova.farmer.test@example.com');
    setDistrict('Vijayapura');
    setFarmArea('5');
    setErrorMessage(null);
  };

  const handleFillTestBuyer = () => {
    setRole('buyer');
    setName('Rajesh Kumar');
    setEmail('agrova.buyer.test@example.com');
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
          <Globe className="w-4 h-4 text-emerald-700" />
          <select
            value={language}
            onChange={(e) => onLanguageChange(e.target.value as SupportedLanguage)}
            className="text-xs font-bold bg-white border border-[#d2e2cd] rounded-xl px-2.5 py-1.5 text-[#144225] shadow-2xs focus:outline-none focus:ring-2 focus:ring-emerald-500 cursor-pointer"
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
              className="w-8 h-8 rounded-full bg-white border border-[#d2e2cd] text-slate-500 hover:text-slate-800 flex items-center justify-center transition"
              title="Close"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Main Auth Card */}
      <div className="w-full max-w-lg bg-white rounded-3xl shadow-xl border border-[#dce8d5] overflow-hidden">
        {/* Top Mode Tabs */}
        <div className="grid grid-cols-2 bg-[#f0f6eb] border-b border-[#dbe7d4] p-1.5">
          <button
            type="button"
            onClick={() => {
              setMode('register');
              setErrorMessage(null);
            }}
            className={`py-2.5 text-xs font-bold rounded-2xl transition-all ${
              mode === 'register'
                ? 'bg-white text-[#14492a] shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            {t.createAccountTab}
          </button>
          <button
            type="button"
            onClick={() => {
              setMode('signin');
              setErrorMessage(null);
            }}
            className={`py-2.5 text-xs font-bold rounded-2xl transition-all ${
              mode === 'signin' || mode === 'forgot'
                ? 'bg-white text-[#14492a] shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            {t.signInTab}
          </button>
        </div>

        <div className="p-5 sm:p-7">
          {/* Status Banners */}
          {errorMessage && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-2xl text-xs font-semibold flex items-center gap-2 animate-in fade-in">
              <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
              <span>{errorMessage}</span>
            </div>
          )}

          {successMessage && (
            <div className="mb-4 p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-2xl text-xs font-semibold flex items-center gap-2 animate-in fade-in">
              <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
              <span>{successMessage}</span>
            </div>
          )}

          {/* ==================== CREATE ACCOUNT MODE ==================== */}
          {mode === 'register' && (
            <form onSubmit={handleRegister} className="space-y-4">
              <div>
                <h1 className="text-lg sm:text-xl font-black text-[#144225] font-display">
                  {t.welcomeTitle}
                </h1>
                <p className="text-xs text-slate-500 mt-0.5">
                  {t.welcomeSubtitle}
                </p>
              </div>

              {/* 1. Account Role Picker */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-slate-700 block">
                  {t.chooseRole}
                </label>
                <div className="grid grid-cols-2 gap-2.5">
                  <div
                    onClick={() => setRole('farmer')}
                    className={`p-3 rounded-2xl border-2 cursor-pointer transition text-left flex flex-col justify-between ${
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
                    onClick={() => setRole('buyer')}
                    className={`p-3 rounded-2xl border-2 cursor-pointer transition text-left flex flex-col justify-between ${
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
                  <label className="text-xs font-bold text-slate-700 block mb-1">
                    {t.fullNameLabel} *
                  </label>
                  <div className="relative">
                    <User className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      required
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder={t.fullNamePlaceholder}
                      className="w-full pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-600 transition"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">
                    {t.emailLabel} *
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder={t.emailPlaceholder}
                      className="w-full pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-600 transition"
                    />
                  </div>
                </div>

                {/* Role Specific Additional Details */}
                {role === 'farmer' ? (
                  <div className="grid grid-cols-2 gap-2.5">
                    <div>
                      <label className="text-[11px] font-bold text-slate-700 block mb-1">
                        {t.districtLabel}
                      </label>
                      <input
                        type="text"
                        value={district}
                        onChange={(e) => setDistrict(e.target.value)}
                        placeholder={t.districtPlaceholder}
                        className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-600 transition"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] font-bold text-slate-700 block mb-1">
                        {t.farmAreaLabel}
                      </label>
                      <input
                        type="number"
                        min="0.1"
                        step="0.5"
                        value={farmArea}
                        onChange={(e) => setFarmArea(e.target.value)}
                        placeholder="5"
                        className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-600 transition"
                      />
                    </div>
                  </div>
                ) : (
                  <div className="space-y-2.5">
                    <div>
                      <label className="text-[11px] font-bold text-slate-700 block mb-1">
                        {t.businessNameLabel}
                      </label>
                      <input
                        type="text"
                        value={businessName}
                        onChange={(e) => setBusinessName(e.target.value)}
                        placeholder={t.businessNamePlaceholder}
                        className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-600 transition"
                      />
                    </div>
                  </div>
                )}

                {/* Password & Confirm */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <div>
                    <label className="text-xs font-bold text-slate-700 block mb-1">
                      {t.passwordLabel} *
                    </label>
                    <div className="relative">
                      <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                      <input
                        type={showPassword ? 'text' : 'password'}
                        required
                        minLength={6}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="••••••••"
                        className="w-full pl-9 pr-9 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-600 transition"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="text-xs font-bold text-slate-700 block mb-1">
                      {t.confirmPasswordLabel} *
                    </label>
                    <div className="relative">
                      <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                      <input
                        type={showPassword ? 'text' : 'password'}
                        required
                        minLength={6}
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        placeholder="••••••••"
                        className="w-full pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-600 transition"
                      />
                    </div>
                  </div>
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full min-h-[46px] rounded-xl bg-[#14492a] hover:bg-[#0f3820] text-white text-xs font-bold transition shadow-xs flex items-center justify-center gap-2 mt-2"
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
                  className="font-bold text-emerald-800 hover:underline"
                >
                  {t.signInTab}
                </button>
              </div>
            </form>
          )}

          {/* ==================== SIGN IN MODE ==================== */}
          {mode === 'signin' && (
            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <h1 className="text-lg sm:text-xl font-black text-[#144225] font-display">
                  {t.signInTab}
                </h1>
                <p className="text-xs text-slate-500 mt-0.5">
                  Sign in with your verified AGROVA login email and password.
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
                    onClick={() => setEmail('agrova.farmer.test@example.com')}
                    className="text-[11px] font-bold px-2 py-1 bg-white hover:bg-emerald-100 text-emerald-800 rounded-lg border border-emerald-300 transition"
                  >
                    Farmer: agrova.farmer.test@example.com
                  </button>
                  <button
                    type="button"
                    onClick={() => setEmail('agrova.buyer.test@example.com')}
                    className="text-[11px] font-bold px-2 py-1 bg-white hover:bg-emerald-100 text-[#144225] rounded-lg border border-emerald-300 transition"
                  >
                    Buyer: agrova.buyer.test@example.com
                  </button>
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  {t.emailLabel} *
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="name@example.com"
                    className="w-full pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-600 transition"
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-bold text-slate-700">
                    {t.passwordLabel} *
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      setMode('forgot');
                      setErrorMessage(null);
                    }}
                    className="text-[11px] font-semibold text-emerald-800 hover:underline"
                  >
                    {t.forgotPasswordLink}
                  </button>
                </div>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full pl-9 pr-9 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-600 transition"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full min-h-[46px] rounded-xl bg-[#14492a] hover:bg-[#0f3820] text-white text-xs font-bold transition shadow-xs flex items-center justify-center gap-2 mt-2"
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
                  className="font-bold text-emerald-800 hover:underline"
                >
                  {t.createAccountTab}
                </button>
              </div>
            </form>
          )}

          {/* ==================== FORGOT PASSWORD MODE ==================== */}
          {mode === 'forgot' && (
            <div className="space-y-4">
              <div>
                <h1 className="text-lg sm:text-xl font-black text-[#144225] font-display flex items-center gap-2">
                  <KeyRound className="w-5 h-5 text-emerald-700" />
                  <span>{t.forgotPasswordTitle}</span>
                </h1>
                <p className="text-xs text-slate-500 mt-0.5">
                  {t.forgotPasswordDesc}
                </p>
              </div>

              {recoveryStep === 1 ? (
                <form onSubmit={handleRequestRecovery} className="space-y-3">
                  <div>
                    <label className="text-xs font-bold text-slate-700 block mb-1">
                      {t.emailLabel} *
                    </label>
                    <div className="relative">
                      <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                      <input
                        type="email"
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="agrova.farmer.test@example.com"
                        className="w-full pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-600 transition"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full min-h-[44px] rounded-xl bg-[#14492a] hover:bg-[#0f3820] text-white text-xs font-bold transition shadow-xs flex items-center justify-center gap-2"
                  >
                    <span>{isLoading ? 'Generating...' : t.sendResetCodeBtn}</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </form>
              ) : (
                <form onSubmit={handleConfirmReset} className="space-y-3">
                  <div>
                    <label className="text-xs font-bold text-slate-700 block mb-1">
                      {t.resetCodeLabel} *
                    </label>
                    <input
                      type="text"
                      required
                      value={recoveryCode}
                      onChange={(e) => setRecoveryCode(e.target.value)}
                      placeholder="e.g. 7F3A9C12"
                      className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono font-bold tracking-widest text-center focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-600 transition"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-bold text-slate-700 block mb-1">
                      {t.newPasswordLabel} *
                    </label>
                    <input
                      type="password"
                      required
                      minLength={6}
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-600 transition"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-bold text-slate-700 block mb-1">
                      {t.confirmNewPasswordLabel} *
                    </label>
                    <input
                      type="password"
                      required
                      minLength={6}
                      value={confirmNewPassword}
                      onChange={(e) => setConfirmNewPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-600 transition"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full min-h-[44px] rounded-xl bg-[#14492a] hover:bg-[#0f3820] text-white text-xs font-bold transition shadow-xs flex items-center justify-center gap-2"
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
                className="w-full py-2 text-xs font-semibold text-slate-500 hover:text-slate-800 transition text-center"
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

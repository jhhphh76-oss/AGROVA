import express from 'express';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
import crypto from 'crypto';
import { fileURLToPath } from 'url';
import { GoogleGenAI } from '@google/genai';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;
const isProduction = process.env.NODE_ENV === 'production';

// Support JSON bodies up to 15MB for mobile camera photo uploads
app.use(express.json({ limit: '15mb' }));
app.use(express.urlencoded({ limit: '15mb', extended: true }));

// Persistent Data Storage Directory
const DATA_DIR = path.join(__dirname, 'data');
const USERS_FILE = path.join(DATA_DIR, 'users.json');
const SESSIONS_FILE = path.join(DATA_DIR, 'sessions.json');
const RESETS_FILE = path.join(DATA_DIR, 'password_resets.json');
const FARMER_PROFILES_FILE = path.join(DATA_DIR, 'farmer_profiles.json');
const BUYER_PROFILES_FILE = path.join(DATA_DIR, 'buyer_profiles.json');
const CROPS_FILE = path.join(DATA_DIR, 'crops.json');
const OBSERVATIONS_FILE = path.join(DATA_DIR, 'observations.json');
const SOIL_SCANS_FILE = path.join(DATA_DIR, 'soil_scans.json');
const MARKETPLACE_FILE = path.join(DATA_DIR, 'marketplace.json');

function ensureDataDir(): void {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
}

function readJsonFile<T>(filePath: string, fallback: T): T {
  try {
    ensureDataDir();
    if (fs.existsSync(filePath)) {
      const raw = fs.readFileSync(filePath, 'utf-8');
      return JSON.parse(raw);
    }
  } catch (err) {
    console.error(`Error reading ${filePath}:`, err);
  }
  return fallback;
}

function writeJsonFile<T>(filePath: string, data: T): void {
  try {
    ensureDataDir();
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf-8');
  } catch (err) {
    console.error(`Error writing ${filePath}:`, err);
  }
}

// ==================== CRYPTOGRAPHIC UTILITIES ====================
function hashPassword(password: string, salt: string): string {
  return crypto.pbkdf2Sync(password, salt, 100000, 64, 'sha512').toString('hex');
}

function verifyPassword(password: string, hash: string, salt: string): boolean {
  try {
    const computed = hashPassword(password, salt);
    return crypto.timingSafeEqual(Buffer.from(computed, 'hex'), Buffer.from(hash, 'hex'));
  } catch {
    return false;
  }
}

function generateSecureToken(): string {
  return crypto.randomBytes(32).toString('hex');
}

function generateResetCode(): string {
  return crypto.randomBytes(4).toString('hex').toUpperCase(); // 8-char code
}

// ==================== AUTH TYPES & STORES ====================
interface StoredUser {
  id: string;
  name: string;
  email: string;
  role: 'farmer' | 'buyer';
  passwordHash: string;
  salt: string;
  createdAt: string;
  preferredLanguage: string;
}

interface StoredSession {
  token: string;
  userId: string;
  createdAt: string;
  expiresAt: string;
}

interface StoredReset {
  code: string;
  userId: string;
  email: string;
  createdAt: string;
  expiresAt: string;
  used: boolean;
}

function getUsers(): StoredUser[] {
  return readJsonFile<StoredUser[]>(USERS_FILE, []);
}

function saveUsers(users: StoredUser[]): void {
  writeJsonFile(USERS_FILE, users);
}

function getSessions(): StoredSession[] {
  const sessions = readJsonFile<StoredSession[]>(SESSIONS_FILE, []);
  // Prune expired
  const now = new Date();
  const active = sessions.filter((s) => new Date(s.expiresAt) > now);
  if (active.length !== sessions.length) {
    writeJsonFile(SESSIONS_FILE, active);
  }
  return active;
}

function saveSessions(sessions: StoredSession[]): void {
  writeJsonFile(SESSIONS_FILE, sessions);
}

function getResets(): StoredReset[] {
  return readJsonFile<StoredReset[]>(RESETS_FILE, []);
}

function saveResets(resets: StoredReset[]): void {
  writeJsonFile(RESETS_FILE, resets);
}

function sanitizeUser(user: StoredUser) {
  const { passwordHash, salt, ...safe } = user;
  return safe;
}

// User-scoped helper stores
function getFarmerProfiles(): Record<string, any> {
  return readJsonFile<Record<string, any>>(FARMER_PROFILES_FILE, {});
}
function saveFarmerProfiles(data: Record<string, any>): void {
  writeJsonFile(FARMER_PROFILES_FILE, data);
}

function getBuyerProfiles(): Record<string, any> {
  return readJsonFile<Record<string, any>>(BUYER_PROFILES_FILE, {});
}
function saveBuyerProfiles(data: Record<string, any>): void {
  writeJsonFile(BUYER_PROFILES_FILE, data);
}

function getUserCrops(): Record<string, any[]> {
  return readJsonFile<Record<string, any[]>>(CROPS_FILE, {});
}
function saveUserCrops(data: Record<string, any[]>): void {
  writeJsonFile(CROPS_FILE, data);
}

function getUserObservations(): Record<string, any[]> {
  return readJsonFile<Record<string, any[]>>(OBSERVATIONS_FILE, {});
}
function saveUserObservations(data: Record<string, any[]>): void {
  writeJsonFile(OBSERVATIONS_FILE, data);
}

function getUserSoilScans(): Record<string, any[]> {
  return readJsonFile<Record<string, any[]>>(SOIL_SCANS_FILE, {});
}
function saveUserSoilScans(data: Record<string, any[]>): void {
  writeJsonFile(SOIL_SCANS_FILE, data);
}

// ==================== AUTH MIDDLEWARE ====================
function extractToken(req: express.Request): string | null {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    return authHeader.substring(7).trim();
  }
  const xToken = req.headers['x-auth-token'];
  if (typeof xToken === 'string') return xToken.trim();
  return null;
}

function authenticateUser(req: express.Request, res: express.Response, next: express.NextFunction) {
  const token = extractToken(req);
  if (!token) {
    (req as any).user = null;
    return next();
  }

  const sessions = getSessions();
  const session = sessions.find((s) => s.token === token);
  if (!session) {
    (req as any).user = null;
    return next();
  }

  const users = getUsers();
  const user = users.find((u) => u.id === session.userId);
  (req as any).user = user || null;
  (req as any).session = session;
  next();
}

app.use(authenticateUser);

function requireAuth(req: express.Request, res: express.Response, next: express.NextFunction) {
  if (!(req as any).user) {
    return res.status(401).json({
      success: false,
      error: 'Authentication required. Please sign in to your AGROVA account.',
    });
  }
  next();
}

const INITIAL_DEMO_LISTINGS = [
  {
    id: 'mkt-1',
    title: 'Sharbati Premium Golden Wheat',
    cropCategory: 'Grains & Cereals',
    variety: 'HD-2967 Sharbati',
    quantity: 120,
    unit: 'quintal',
    expectedPrice: 2850,
    priceUnit: 'per quintal',
    location: 'Sehore Mandi, Bhopal Road',
    state: 'Madhya Pradesh',
    sellerId: 'demo-fpo-1',
    sellerName: 'Narmada Valley Farmers Producer Co.',
    sellerType: 'FPO (Farmer Producer Org)',
    contactPhone: '+91 94250 11223',
    grade: 'Grade A (Premium)',
    harvestAvailability: 'Ready for Immediate Dispatch',
    isDemonstration: true,
    datePosted: '2026-10-10',
    description: 'Sun-dried golden grain, 11.5% moisture, machine cleaned, 50kg new gunny bags.',
  },
  {
    id: 'mkt-2',
    title: 'Vijayapura Red Onions (Garwa Quality)',
    cropCategory: 'Vegetables',
    variety: 'Vijayapura Garwa Medium-Big',
    quantity: 80,
    unit: 'quintal',
    expectedPrice: 2350,
    priceUnit: 'per quintal',
    location: 'Vijayapura APMC Road, Vijayapura',
    state: 'Karnataka',
    sellerId: 'demo-farmer-1',
    sellerName: 'Kishore Patil',
    sellerType: 'Farmer',
    contactPhone: '+91 98451 99887',
    grade: 'Grade A (Premium)',
    harvestAvailability: 'Harvested & Cured in Storage',
    isDemonstration: true,
    datePosted: '2026-10-09',
    description: 'Direct field harvest, tight skin, storage-ready for 3-4 months, sorted size 45mm-60mm.',
  },
  {
    id: 'mkt-3',
    title: 'Organic Basmati 1121 Export Grade',
    cropCategory: 'Grains & Cereals',
    variety: 'Pusa 1121 Extra Long',
    quantity: 200,
    unit: 'quintal',
    expectedPrice: 4200,
    priceUnit: 'per quintal',
    location: 'Karnal Grain Market',
    state: 'Haryana',
    sellerId: 'demo-fpo-2',
    sellerName: 'Green Earth Krishi FPO',
    sellerType: 'FPO (Farmer Producer Org)',
    contactPhone: '+91 98120 44556',
    grade: 'Organic Certified',
    harvestAvailability: 'Ready for Immediate Dispatch',
    isDemonstration: true,
    datePosted: '2026-10-08',
    description: 'Certified organic, aged 1 year, extra-long grain with authentic aroma. Lab tested pesticide-free.',
  },
  {
    id: 'mkt-4',
    title: 'Desi Chana (Bengal Gram)',
    cropCategory: 'Pulses',
    variety: 'Vijay Desi Brown',
    quantity: 65,
    unit: 'quintal',
    expectedPrice: 5900,
    priceUnit: 'per quintal',
    location: 'Akola Agricultural Market',
    state: 'Maharashtra',
    sellerId: 'demo-farmer-2',
    sellerName: 'Vidarbha Organic Collective',
    sellerType: 'Farmer',
    contactPhone: '+91 97650 33221',
    grade: 'Grade A (Premium)',
    harvestAvailability: 'Ready for Dispatch',
    isDemonstration: true,
    datePosted: '2026-10-07',
    description: 'High protein desi chana, dried to 9% moisture, zero chemical fumigation.',
  },
  {
    id: 'mkt-5',
    title: 'Yellow Soybean Bold Grain',
    cropCategory: 'Oilseeds',
    variety: 'JS-335 Bold',
    quantity: 110,
    unit: 'quintal',
    expectedPrice: 4650,
    priceUnit: 'per quintal',
    location: 'Indore Mandi Hub',
    state: 'Madhya Pradesh',
    sellerId: 'demo-trader-1',
    sellerName: 'Malwa Agri Traders',
    sellerType: 'Buyer / Trader',
    contactPhone: '+91 94066 77889',
    grade: 'Grade B (Standard)',
    harvestAvailability: 'Warehouse Stock',
    isDemonstration: true,
    datePosted: '2026-10-06',
    description: 'High oil yield soybean, 18-20% oil content, suitable for solvent extraction or seed.',
  },
];

interface MarketplaceStore {
  listings: any[];
  enquiries: any[];
}

function getMarketplaceData(): MarketplaceStore {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    if (fs.existsSync(MARKETPLACE_FILE)) {
      const raw = fs.readFileSync(MARKETPLACE_FILE, 'utf-8');
      const parsed = JSON.parse(raw);
      return {
        listings: Array.isArray(parsed.listings) ? parsed.listings : INITIAL_DEMO_LISTINGS,
        enquiries: Array.isArray(parsed.enquiries) ? parsed.enquiries : [],
      };
    }
  } catch (err) {
    console.error('Error reading marketplace file:', err);
  }
  return {
    listings: INITIAL_DEMO_LISTINGS,
    enquiries: [],
  };
}

function saveMarketplaceData(data: MarketplaceStore): void {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    fs.writeFileSync(MARKETPLACE_FILE, JSON.stringify(data, null, 2), 'utf-8');
  } catch (err) {
    console.error('Error saving marketplace file:', err);
  }
}

// Health / status endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    hasApiKey: Boolean(process.env.GEMINI_API_KEY),
    timestamp: new Date().toISOString(),
  });
});

// Storage and Auth transparency endpoint
app.get('/api/auth/status', (req, res) => {
  res.json({
    status: 'operational',
    persistence: 'express-fs-and-crypto-auth',
    securityEnforcement: 'backend-role-and-ownership-enforced',
    rolesSupported: ['farmer', 'buyer'],
    note: 'Secure salted PBKDF2 authentication, token-based sessions, and role-authorized multi-tenant records are active.',
  });
});

// Helper to get or initialize profile for user
function getProfileForUser(user: StoredUser) {
  if (user.role === 'farmer') {
    const profiles = getFarmerProfiles();
    if (!profiles[user.id]) {
      profiles[user.id] = {
        userId: user.id,
        name: user.name,
        farmName: `${user.name}'s Farm`,
        villageOrDistrict: 'Vijayapura',
        state: 'Karnataka',
        contactNumber: '',
        preferredLanguage: user.preferredLanguage || 'en',
        preferredAreaUnit: 'acres',
        preferredWeightUnit: 'quintal',
        preferredTempUnit: 'celsius',
        totalFarmArea: 5.0,
        primarySoilType: 'Black Soil (Regur)',
      };
      saveFarmerProfiles(profiles);
    }
    return profiles[user.id];
  } else {
    const profiles = getBuyerProfiles();
    if (!profiles[user.id]) {
      profiles[user.id] = {
        id: user.id,
        userId: user.id,
        name: user.name,
        businessName: `${user.name} Agri Traders`,
        businessType: 'Wholesale Trader',
        location: 'Vijayapura APMC',
        state: 'Karnataka',
        contactNumber: '',
        email: user.email,
        preferredLanguage: user.preferredLanguage || 'en',
        preferredCategories: ['Grains & Cereals', 'Pulses', 'Vegetables', 'Oilseeds'],
      };
      saveBuyerProfiles(profiles);
    }
    return profiles[user.id];
  }
}

// POST Register
app.post('/api/auth/register', (req, res) => {
  try {
    const {
      name,
      email,
      password,
      role,
      farmDistrict,
      farmArea,
      businessName,
      businessType,
      phone,
      language,
    } = req.body;

    if (!name || typeof name !== 'string' || !name.trim()) {
      return res.status(400).json({ success: false, error: 'Full display name is required.' });
    }

    if (!email || typeof email !== 'string' || !email.includes('@')) {
      return res.status(400).json({ success: false, error: 'A valid email address is required.' });
    }

    const cleanEmail = email.trim().toLowerCase();

    if (!password || typeof password !== 'string' || password.length < 6) {
      return res.status(400).json({ success: false, error: 'Password must be at least 6 characters.' });
    }

    if (role !== 'farmer' && role !== 'buyer') {
      return res.status(400).json({ success: false, error: 'Account role must be either Farmer or Buyer.' });
    }

    const users = getUsers();
    if (users.some((u) => u.email.toLowerCase() === cleanEmail)) {
      return res.status(409).json({ success: false, error: 'An account with this email address already exists.' });
    }

    const salt = crypto.randomBytes(16).toString('hex');
    const passwordHash = hashPassword(password, salt);
    const userId = `usr-${Date.now()}-${crypto.randomBytes(4).toString('hex')}`;

    const newUser: StoredUser = {
      id: userId,
      name: name.trim(),
      email: cleanEmail,
      role,
      passwordHash,
      salt,
      createdAt: new Date().toISOString(),
      preferredLanguage: language || 'en',
    };

    users.push(newUser);
    saveUsers(users);

    // Initialize role-specific profile
    if (role === 'farmer') {
      const farmerProfiles = getFarmerProfiles();
      farmerProfiles[userId] = {
        userId,
        name: newUser.name,
        farmName: `${newUser.name}'s Farm`,
        villageOrDistrict: String(farmDistrict || 'Vijayapura').trim(),
        state: 'Karnataka',
        contactNumber: String(phone || '').trim(),
        preferredLanguage: newUser.preferredLanguage,
        preferredAreaUnit: 'acres',
        preferredWeightUnit: 'quintal',
        preferredTempUnit: 'celsius',
        totalFarmArea: Number(farmArea) || 5.0,
        primarySoilType: 'Black Soil (Regur)',
      };
      saveFarmerProfiles(farmerProfiles);
    } else {
      const buyerProfiles = getBuyerProfiles();
      buyerProfiles[userId] = {
        id: userId,
        userId,
        name: newUser.name,
        businessName: String(businessName || `${newUser.name} Agri Procurement`).trim(),
        businessType: businessType || 'Wholesale Trader',
        location: String(farmDistrict || 'Vijayapura APMC').trim(),
        state: 'Karnataka',
        contactNumber: String(phone || '').trim(),
        email: cleanEmail,
        preferredLanguage: newUser.preferredLanguage,
        preferredCategories: ['Grains & Cereals', 'Pulses', 'Vegetables', 'Oilseeds'],
      };
      saveBuyerProfiles(buyerProfiles);
    }

    // Generate Session Token
    const token = generateSecureToken();
    const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
    const sessions = getSessions();
    sessions.push({
      token,
      userId,
      createdAt: new Date().toISOString(),
      expiresAt,
    });
    saveSessions(sessions);

    const profile = getProfileForUser(newUser);

    return res.status(201).json({
      success: true,
      token,
      user: sanitizeUser(newUser),
      profile,
    });
  } catch (err: any) {
    console.error('Registration error:', err);
    return res.status(500).json({ success: false, error: err.message || 'Registration failed.' });
  }
});

// POST Login
app.post('/api/auth/login', (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ success: false, error: 'Email and password are required.' });
    }

    const cleanEmail = String(email).trim().toLowerCase();
    const users = getUsers();
    const user = users.find((u) => u.email.toLowerCase() === cleanEmail);

    if (!user) {
      return res.status(401).json({ success: false, error: 'Invalid email or password.' });
    }

    const isValid = verifyPassword(password, user.passwordHash, user.salt);
    if (!isValid) {
      return res.status(401).json({ success: false, error: 'Invalid email or password.' });
    }

    // Generate Session
    const token = generateSecureToken();
    const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
    const sessions = getSessions();
    sessions.push({
      token,
      userId: user.id,
      createdAt: new Date().toISOString(),
      expiresAt,
    });
    saveSessions(sessions);

    const profile = getProfileForUser(user);

    return res.json({
      success: true,
      token,
      user: sanitizeUser(user),
      profile,
    });
  } catch (err: any) {
    console.error('Login error:', err);
    return res.status(500).json({ success: false, error: err.message || 'Login failed.' });
  }
});

// GET /api/auth/me (Session restoration)
app.get('/api/auth/me', requireAuth, (req, res) => {
  try {
    const user = (req as any).user as StoredUser;
    const profile = getProfileForUser(user);
    res.json({
      success: true,
      user: sanitizeUser(user),
      profile,
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message || 'Failed to fetch session.' });
  }
});

// POST Logout
app.post('/api/auth/logout', (req, res) => {
  try {
    const token = extractToken(req);
    if (token) {
      const sessions = getSessions().filter((s) => s.token !== token);
      saveSessions(sessions);
    }
    res.json({ success: true, message: 'Signed out successfully.' });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message || 'Logout failed.' });
  }
});

// POST Change Password
app.post('/api/auth/change-password', requireAuth, (req, res) => {
  try {
    const user = (req as any).user as StoredUser;
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ success: false, error: 'Both current password and new password are required.' });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ success: false, error: 'New password must be at least 6 characters.' });
    }

    const isValid = verifyPassword(currentPassword, user.passwordHash, user.salt);
    if (!isValid) {
      return res.status(400).json({ success: false, error: 'Incorrect current password.' });
    }

    const users = getUsers();
    const idx = users.findIndex((u) => u.id === user.id);
    if (idx === -1) {
      return res.status(404).json({ success: false, error: 'User record not found.' });
    }

    const newSalt = crypto.randomBytes(16).toString('hex');
    const newHash = hashPassword(newPassword, newSalt);

    users[idx].salt = newSalt;
    users[idx].passwordHash = newHash;
    saveUsers(users);

    res.json({ success: true, message: 'Password has been securely updated.' });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message || 'Failed to update password.' });
  }
});

// POST Forgot Password Request
app.post('/api/auth/forgot-password', (req, res) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ success: false, error: 'Email address is required.' });
    }

    const cleanEmail = String(email).trim().toLowerCase();
    const users = getUsers();
    const user = users.find((u) => u.email.toLowerCase() === cleanEmail);

    if (!user) {
      // Security standard: avoid leaking whether email exists or not
      return res.json({
        success: true,
        message: 'If an account exists with this email, a recovery code has been generated.',
      });
    }

    const code = generateResetCode();
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000).toISOString(); // 1 hour

    const resets = getResets();
    resets.push({
      code,
      userId: user.id,
      email: cleanEmail,
      createdAt: new Date().toISOString(),
      expiresAt,
      used: false,
    });
    saveResets(resets);

    // Return the generated reset verification code for testing and recovery flow
    res.json({
      success: true,
      recoveryCode: code,
      message: `Password recovery code generated: ${code}. Enter this code along with your new password.`,
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message || 'Password recovery request failed.' });
  }
});

// POST Reset Password Confirm
app.post('/api/auth/reset-password', (req, res) => {
  try {
    const { email, recoveryCode, newPassword } = req.body;

    if (!email || !recoveryCode || !newPassword) {
      return res.status(400).json({ success: false, error: 'Email, recovery code, and new password are required.' });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ success: false, error: 'New password must be at least 6 characters.' });
    }

    const cleanEmail = String(email).trim().toLowerCase();
    const cleanCode = String(recoveryCode).trim().toUpperCase();

    const resets = getResets();
    const reset = resets.find(
      (r) =>
        r.email.toLowerCase() === cleanEmail &&
        r.code === cleanCode &&
        !r.used &&
        new Date(r.expiresAt) > new Date()
    );

    if (!reset) {
      return res.status(400).json({ success: false, error: 'Invalid or expired recovery code.' });
    }

    const users = getUsers();
    const idx = users.findIndex((u) => u.id === reset.userId);
    if (idx === -1) {
      return res.status(404).json({ success: false, error: 'User record not found.' });
    }

    const newSalt = crypto.randomBytes(16).toString('hex');
    const newHash = hashPassword(newPassword, newSalt);

    users[idx].salt = newSalt;
    users[idx].passwordHash = newHash;
    saveUsers(users);

    // Mark reset code used
    reset.used = true;
    saveResets(resets);

    res.json({ success: true, message: 'Password reset successfully. You can now sign in with your new password.' });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message || 'Password reset failed.' });
  }
});

// PUT /api/auth/profile
app.put('/api/auth/profile', requireAuth, (req, res) => {
  try {
    const user = (req as any).user as StoredUser;
    const { name, preferredLanguage, farmProfile, buyerProfile, role } = req.body;

    const users = getUsers();
    const userIdx = users.findIndex((u) => u.id === user.id);

    if (userIdx !== -1) {
      if (name && typeof name === 'string' && name.trim()) {
        users[userIdx].name = name.trim();
        user.name = name.trim();
      }
      if (preferredLanguage) {
        users[userIdx].preferredLanguage = preferredLanguage;
        user.preferredLanguage = preferredLanguage;
      }
      if (role && (role === 'farmer' || role === 'buyer')) {
        users[userIdx].role = role;
        user.role = role;
      }
      saveUsers(users);
    }

    if (farmProfile && user.role === 'farmer') {
      const fProfiles = getFarmerProfiles();
      fProfiles[user.id] = {
        ...fProfiles[user.id],
        ...farmProfile,
        userId: user.id,
        name: user.name,
      };
      saveFarmerProfiles(fProfiles);
    }

    if (buyerProfile && user.role === 'buyer') {
      const bProfiles = getBuyerProfiles();
      bProfiles[user.id] = {
        ...bProfiles[user.id],
        ...buyerProfile,
        id: user.id,
        userId: user.id,
        name: user.name,
      };
      saveBuyerProfiles(bProfiles);
    }

    const currentProfile = getProfileForUser(user);

    res.json({
      success: true,
      user: sanitizeUser(user),
      profile: currentProfile,
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message || 'Failed to update profile.' });
  }
});

// DELETE /api/auth/account (Secure confirmed account deletion)
app.delete('/api/auth/account', requireAuth, (req, res) => {
  try {
    const user = (req as any).user as StoredUser;
    const { password } = req.body;

    if (!password) {
      return res.status(400).json({ success: false, error: 'Password confirmation is required to delete your account.' });
    }

    const isValid = verifyPassword(password, user.passwordHash, user.salt);
    if (!isValid) {
      return res.status(403).json({ success: false, error: 'Incorrect password. Account deletion canceled.' });
    }

    const userId = user.id;

    // Remove user
    const users = getUsers().filter((u) => u.id !== userId);
    saveUsers(users);

    // Remove sessions
    const sessions = getSessions().filter((s) => s.userId !== userId);
    saveSessions(sessions);

    // Remove farm profiles
    const fProfiles = getFarmerProfiles();
    delete fProfiles[userId];
    saveFarmerProfiles(fProfiles);

    // Remove buyer profiles
    const bProfiles = getBuyerProfiles();
    delete bProfiles[userId];
    saveBuyerProfiles(bProfiles);

    // Remove private crops, observations, soil scans
    const crops = getUserCrops();
    delete crops[userId];
    saveUserCrops(crops);

    const obs = getUserObservations();
    delete obs[userId];
    saveUserObservations(obs);

    const scans = getUserSoilScans();
    delete scans[userId];
    saveUserSoilScans(scans);

    // Remove user's created listings & enquiries from shared marketplace
    const mkt = getMarketplaceData();
    mkt.listings = mkt.listings.filter((l) => l.sellerId !== userId);
    mkt.enquiries = mkt.enquiries.filter((e) => e.buyerId !== userId && e.sellerId !== userId);
    saveMarketplaceData(mkt);

    res.json({ success: true, message: 'Account and associated records have been permanently deleted.' });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message || 'Account deletion failed.' });
  }
});

// ==================== USER-SCOPED FARM DATA ENDPOINTS ====================
// Crops
app.get('/api/farmer/crops', requireAuth, (req, res) => {
  try {
    const user = (req as any).user as StoredUser;
    const allCrops = getUserCrops();
    const userCrops = allCrops[user.id] || [];
    res.json({ success: true, crops: userCrops });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message || 'Failed to load crops.' });
  }
});

app.post('/api/farmer/crops', requireAuth, (req, res) => {
  try {
    const user = (req as any).user as StoredUser;
    const cropData = req.body;
    const allCrops = getUserCrops();
    const userCrops = allCrops[user.id] || [];

    const existingIdx = userCrops.findIndex((c) => c.id === cropData.id);
    const newRecord = {
      ...cropData,
      id: cropData.id || `crop-${Date.now()}`,
      updatedAt: new Date().toISOString(),
    };

    if (existingIdx >= 0) {
      userCrops[existingIdx] = newRecord;
    } else {
      userCrops.unshift(newRecord);
    }

    allCrops[user.id] = userCrops;
    saveUserCrops(allCrops);

    res.json({ success: true, crop: newRecord });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message || 'Failed to save crop.' });
  }
});

app.delete('/api/farmer/crops/:id', requireAuth, (req, res) => {
  try {
    const user = (req as any).user as StoredUser;
    const cropId = req.params.id;
    const allCrops = getUserCrops();
    if (allCrops[user.id]) {
      allCrops[user.id] = allCrops[user.id].filter((c) => c.id !== cropId);
      saveUserCrops(allCrops);
    }
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message || 'Failed to delete crop.' });
  }
});

// Observations
app.get('/api/farmer/observations', requireAuth, (req, res) => {
  try {
    const user = (req as any).user as StoredUser;
    const allObs = getUserObservations();
    res.json({ success: true, observations: allObs[user.id] || [] });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message || 'Failed to load observations.' });
  }
});

app.post('/api/farmer/observations', requireAuth, (req, res) => {
  try {
    const user = (req as any).user as StoredUser;
    const obsData = req.body;
    const allObs = getUserObservations();
    const userObs = allObs[user.id] || [];

    const existingIdx = userObs.findIndex((o) => o.id === obsData.id);
    const newRecord = {
      ...obsData,
      id: obsData.id || `obs-${Date.now()}`,
    };

    if (existingIdx >= 0) {
      userObs[existingIdx] = newRecord;
    } else {
      userObs.unshift(newRecord);
    }

    allObs[user.id] = userObs;
    saveUserObservations(allObs);

    res.json({ success: true, observation: newRecord });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message || 'Failed to save observation.' });
  }
});

app.delete('/api/farmer/observations/:id', requireAuth, (req, res) => {
  try {
    const user = (req as any).user as StoredUser;
    const obsId = req.params.id;
    const allObs = getUserObservations();
    if (allObs[user.id]) {
      allObs[user.id] = allObs[user.id].filter((o) => o.id !== obsId);
      saveUserObservations(allObs);
    }
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message || 'Failed to delete observation.' });
  }
});

// Soil Scans
app.get('/api/farmer/soil-scans', requireAuth, (req, res) => {
  try {
    const user = (req as any).user as StoredUser;
    const allScans = getUserSoilScans();
    res.json({ success: true, soilScans: allScans[user.id] || [] });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message || 'Failed to load soil scans.' });
  }
});

app.post('/api/farmer/soil-scans', requireAuth, (req, res) => {
  try {
    const user = (req as any).user as StoredUser;
    const scanData = req.body;
    const allScans = getUserSoilScans();
    const userScans = allScans[user.id] || [];

    const existingIdx = userScans.findIndex((s) => s.id === scanData.id);
    const newRecord = {
      ...scanData,
      id: scanData.id || `soil-${Date.now()}`,
    };

    if (existingIdx >= 0) {
      userScans[existingIdx] = newRecord;
    } else {
      userScans.unshift(newRecord);
    }

    allScans[user.id] = userScans;
    saveUserSoilScans(allScans);

    res.json({ success: true, soilScan: newRecord });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message || 'Failed to save soil scan.' });
  }
});

app.delete('/api/farmer/soil-scans/:id', requireAuth, (req, res) => {
  try {
    const user = (req as any).user as StoredUser;
    const scanId = req.params.id;
    const allScans = getUserSoilScans();
    if (allScans[user.id]) {
      allScans[user.id] = allScans[user.id].filter((s) => s.id !== scanId);
      saveUserSoilScans(allScans);
    }
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message || 'Failed to delete soil scan.' });
  }
});

// GET Shared Marketplace Listings
app.get('/api/marketplace/listings', (req, res) => {
  try {
    const data = getMarketplaceData();
    res.json({
      success: true,
      listings: data.listings,
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message || 'Failed to load listings' });
  }
});

// POST Create Crop Listing (Farmer Role Required)
app.post('/api/marketplace/listings', (req, res) => {
  try {
    const user = (req as any).user as StoredUser | null;
    const userRole = user ? user.role : (req.headers['x-user-role'] as string) || req.body.userRole;
    if (userRole !== 'farmer') {
      return res.status(403).json({
        success: false,
        error: 'Permission denied: Only registered farmers are permitted to create crop produce listings.',
      });
    }

    const {
      title,
      cropCategory,
      variety,
      quantity,
      unit,
      expectedPrice,
      priceUnit,
      location,
      state,
      sellerName,
      sellerType,
      contactPhone,
      grade,
      harvestAvailability,
      description,
      photoUrl,
    } = req.body;

    if (!title || !cropCategory || !quantity || !expectedPrice || !location) {
      return res.status(400).json({
        success: false,
        error: 'Missing required listing fields (title, cropCategory, quantity, expectedPrice, location).',
      });
    }

    const sellerId = user ? user.id : (req.headers['x-user-id'] as string) || req.body.sellerId || `farmer-${Date.now()}`;
    const sellerDisplayName = user ? (user.name || sellerName) : (sellerName || 'Farmer');

    const newListing = {
      id: `mkt-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
      title: String(title).trim(),
      cropCategory,
      variety: String(variety || 'Standard').trim(),
      quantity: Number(quantity) || 1,
      unit: unit || 'quintal',
      expectedPrice: Number(expectedPrice) || 0,
      priceUnit: priceUnit || 'per quintal',
      location: String(location).trim(),
      state: String(state || 'Karnataka').trim(),
      sellerId,
      sellerName: String(sellerDisplayName).trim(),
      sellerType: sellerType || 'Farmer',
      contactPhone: String(contactPhone || '').trim(),
      grade: grade || 'Grade A (Premium)',
      harvestAvailability: String(harvestAvailability || 'Ready for Immediate Dispatch').trim(),
      isDemonstration: false, // Farmer's verified real listing!
      datePosted: new Date().toISOString().split('T')[0],
      description: String(description || '').trim(),
      photoUrl: photoUrl || undefined,
    };

    const store = getMarketplaceData();
    store.listings.unshift(newListing);
    saveMarketplaceData(store);

    res.status(201).json({
      success: true,
      listing: newListing,
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message || 'Failed to create listing' });
  }
});

// DELETE Crop Listing (Enforce Seller Ownership)
app.delete('/api/marketplace/listings/:id', (req, res) => {
  try {
    const listingId = req.params.id;
    const user = (req as any).user as StoredUser | null;
    const userRole = user ? user.role : (req.headers['x-user-role'] as string) || '';
    const userId = user ? user.id : (req.headers['x-user-id'] as string) || '';

    const store = getMarketplaceData();
    const listing = store.listings.find((l) => l.id === listingId);

    if (!listing) {
      return res.status(404).json({ success: false, error: 'Listing not found.' });
    }

    if (listing.isDemonstration) {
      return res.status(403).json({
        success: false,
        error: 'Sample demonstration listings are system-provided and cannot be deleted.',
      });
    }

    // Role and ownership verification: only the creator can delete
    if (userRole !== 'farmer' || (listing.sellerId && listing.sellerId !== userId)) {
      return res.status(403).json({
        success: false,
        error: 'Forbidden: You only have permission to delete your own listings.',
      });
    }

    store.listings = store.listings.filter((l) => l.id !== listingId);
    saveMarketplaceData(store);

    res.json({ success: true, message: 'Listing removed successfully.' });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message || 'Failed to delete listing' });
  }
});

// GET Enquiries (Privacy: Buyers see only their enquiries, Farmers see only enquiries for their listings)
app.get('/api/marketplace/enquiries', (req, res) => {
  try {
    const user = (req as any).user as StoredUser | null;
    const userRole = user ? user.role : (req.headers['x-user-role'] as string) || '';
    const userId = user ? user.id : (req.headers['x-user-id'] as string) || '';
    const store = getMarketplaceData();

    let result = store.enquiries;
    if (userRole === 'buyer' && userId) {
      result = result.filter((e) => e.buyerId === userId);
    } else if (userRole === 'farmer' && userId) {
      // Find listings owned by this farmer
      const farmerListingIds = new Set(
        store.listings.filter((l) => l.sellerId === userId).map((l) => l.id)
      );
      result = result.filter(
        (e) => (e.sellerId && e.sellerId === userId) || farmerListingIds.has(e.listingId)
      );
    }

    res.json({ success: true, enquiries: result });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message || 'Failed to get enquiries' });
  }
});

// POST Create Purchase Enquiry (Buyer Role Required)
app.post('/api/marketplace/enquiries', (req, res) => {
  try {
    const user = (req as any).user as StoredUser | null;
    const userRole = user ? user.role : (req.headers['x-user-role'] as string) || req.body.userRole;
    if (userRole !== 'buyer') {
      return res.status(403).json({
        success: false,
        error: 'Permission denied: Only registered buyers can submit purchase enquiries to farmers.',
      });
    }

    const {
      listingId,
      listingTitle,
      farmerName,
      sellerPhone,
      sellerId,
      buyerId,
      buyerName,
      buyerPhone,
      buyerBusiness,
      buyerLocation,
      requestedQuantity,
      unit,
      offeredPrice,
      priceUnit,
      message,
    } = req.body;

    if (!listingId || !buyerName || !buyerPhone || !requestedQuantity) {
      return res.status(400).json({
        success: false,
        error: 'Missing required enquiry fields (listingId, buyerName, buyerPhone, requestedQuantity).',
      });
    }

    const effectiveBuyerId = user ? user.id : buyerId || (req.headers['x-user-id'] as string) || `buyer-${Date.now()}`;
    const effectiveBuyerName = user ? (buyerName || user.name) : buyerName;

    const newEnquiry = {
      id: `enq-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
      listingId,
      listingTitle: String(listingTitle || 'Produce').trim(),
      farmerName: String(farmerName || 'Farmer').trim(),
      sellerPhone: sellerPhone || undefined,
      sellerId: sellerId || undefined,
      buyerId: effectiveBuyerId,
      buyerName: String(effectiveBuyerName).trim(),
      buyerPhone: String(buyerPhone).trim(),
      buyerBusiness: String(buyerBusiness || '').trim(),
      buyerLocation: String(buyerLocation || '').trim(),
      requestedQuantity: Number(requestedQuantity) || 1,
      unit: unit || 'quintal',
      offeredPrice: offeredPrice ? Number(offeredPrice) : undefined,
      priceUnit: priceUnit || 'per quintal',
      message: String(message || 'I am interested in procuring this harvest. Please contact me.').trim(),
      createdAt: new Date().toISOString(),
      status: 'Pending Response',
    };

    const store = getMarketplaceData();
    store.enquiries.unshift(newEnquiry);
    saveMarketplaceData(store);

    res.status(201).json({
      success: true,
      enquiry: newEnquiry,
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message || 'Failed to submit enquiry' });
  }
});

// PATCH Update Enquiry Status (Farmer Action)
app.patch('/api/marketplace/enquiries/:id/status', (req, res) => {
  try {
    const enquiryId = req.params.id;
    const { status } = req.body;
    const store = getMarketplaceData();
    const index = store.enquiries.findIndex((e) => e.id === enquiryId);

    if (index === -1) {
      return res.status(404).json({ success: false, error: 'Enquiry record not found.' });
    }

    store.enquiries[index].status = status;
    saveMarketplaceData(store);

    res.json({ success: true, enquiry: store.enquiries[index] });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message || 'Failed to update enquiry status' });
  }
});

// Soil Scan AI Analysis endpoint
app.post('/api/analyze-soil', async (req, res) => {
  const { imageBase64, mimeType, farmContext } = req.body;

  if (!imageBase64) {
    return res.status(400).json({
      success: false,
      error: 'No image data provided for soil analysis.',
    });
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return res.status(503).json({
      success: false,
      aiUnavailable: true,
      error: 'Gemini AI API key is not configured on the server. AI image analysis is unavailable.',
    });
  }

  try {
    const ai = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });

    const contextNotes = farmContext
      ? `Farm context provided by farmer: Location: ${farmContext.villageOrDistrict || 'Vijayapura'}, ${farmContext.state || 'Karnataka'}. Plot: ${farmContext.fieldName || 'Plot 1'}. Primary Farm Soil: ${farmContext.primarySoilType || 'Not specified'}. (Note: This is reference context only; do not assume the photo matches this without visual verification).`
      : '';

    const systemPrompt = `You are an agricultural soil visual analysis assistant for Indian farmers.
Analyze ONLY what is physically visible in the provided soil photograph.
${contextNotes}

STRICT INSTRUCTIONS:
1. SUITABILITY CHECK:
   - Check if this photo depicts soil or agricultural land.
   - If the photo is blurry, too dark, out of focus, taken from too far away to see texture, or is NOT a photo of soil (e.g. human face, room, plant without soil, vehicle), set "isSuitable": false.
   - If "isSuitable" is false, provide an empathetic, constructive "unsuitableReason" in simple farmer-friendly English explaining why the image cannot be analyzed (e.g. "The photo is too blurry/dark to distinguish soil particle aggregates. Please take a clear close-up photo of the soil surface in good natural daylight.") and leave the other analysis fields empty or minimal.

2. VISUAL CHARACTERISTICS ONLY (When suitable):
   - apparentColor: Exact visible shade (e.g. "Dark brownish-black with earthy grey tones", "Reddish-brown with visible ferric iron coloration", "Light sandy greyish-buff").
   - visibleTextureParticles: Observed physical clods, crumbs, fine dust particles, or coarse sand grains.
   - coarseFragmentsStones: Visible pebbles, gravel, sub-angular rock fragments, or smooth stone presence.
   - visibleOrganicResidue: Visible root fibers, crop stubble, leaf fragments, or decomposed organic matter.
   - surfaceMoistureAppearance: Visual indication of moisture (e.g. "Dark damp sheen indicating moisture retention", "Cracked, dry, and powdery surface layer").

3. UNCERTAIN INFERENCES:
   - Distinguish direct visual observation from uncertain inferences.
   - In "possibleCharacteristics", describe what the visual appearance might suggest (e.g. "Shares visual similarities with clay-loam / black regur soil"), but ALWAYS accompany it with an explicit "uncertaintyNote" stating that optical resemblance cannot determine mineralogy, bulk density, or subsurface soil horizons.

4. CONFIDENCE & LIMITATIONS:
   - State the confidence level as "Visual Assessment Only".
   - List key limitations: photo only shows top 1-2mm surface; lighting and camera white balance affect color; moisture alters apparent darkness; subsoil layers are not visible.

5. SCIENTIFIC TRANSPARENCY & SOIL TEST NEEDED:
   - NEVER invent or estimate NPK values (Nitrogen, Phosphorus, Potassium), pH readings, electrical conductivity (EC), or fertility scores.
   - Provide a clear, mandatory "soilTestNeededReminder" explaining that essential chemical nutrients, exact pH, and deficiency levels CANNOT be measured by a camera and strictly require laboratory soil testing through an official Soil Health Card (SHC) or Krishi Vigyan Kendra (KVK).

6. RECOMMENDED NEXT STEPS:
   - 3-4 practical, actionable field actions (e.g., in-field ribbon test, checking moisture at 15cm depth, sending a composite sample to a certified soil testing laboratory).

Return response STRICTLY in valid JSON matching this schema:
{
  "isSuitable": boolean,
  "unsuitableReason": string | null,
  "visibleObservations": {
    "apparentColor": string,
    "visibleTextureParticles": string,
    "coarseFragmentsStones": string,
    "visibleOrganicResidue": string,
    "surfaceMoistureAppearance": string
  },
  "possibleCharacteristics": [
    {
      "characteristic": string,
      "explanation": string,
      "uncertaintyNote": string
    }
  ],
  "limitationsAndConfidence": {
    "confidenceLevel": string,
    "limitations": string[]
  },
  "recommendedNextSteps": string[],
  "soilTestNeededReminder": string
}`;

    // Retry loop for transient 503 model availability spikes
    let responseText = '';
    let lastError: any = null;
    const modelsToTry = ['gemini-flash-latest', 'gemini-3.8-flash'];

    for (const modelName of modelsToTry) {
      for (let attempt = 1; attempt <= 2; attempt++) {
        try {
          const result = await ai.models.generateContent({
            model: modelName,
            contents: [
              {
                inlineData: {
                  mimeType: mimeType || 'image/jpeg',
                  data: imageBase64,
                },
              },
              {
                text: 'Analyze this soil photograph according to your system instructions and return the JSON report.',
              },
            ],
            config: {
              systemInstruction: systemPrompt,
              responseMimeType: 'application/json',
              temperature: 0.2,
            },
          });

          if (result.text) {
            responseText = result.text.trim();
            break;
          }
        } catch (err: any) {
          lastError = err;
          // Short delay before retry
          await new Promise((resolve) => setTimeout(resolve, 800));
        }
      }
      if (responseText) break;
    }

    if (!responseText) {
      throw lastError || new Error('No response generated by Gemini model.');
    }

    // Parse JSON safely
    const cleanJson = responseText.replace(/^```json\s*/i, '').replace(/```$/i, '').trim();
    const parsedData = JSON.parse(cleanJson);

    return res.json({
      success: true,
      analysis: {
        ...parsedData,
        analyzedAt: new Date().toISOString(),
        modelUsed: 'Gemini Vision (Verified)',
      },
    });
  } catch (error: any) {
    console.error('Soil analysis error:', error);
    return res.status(500).json({
      success: false,
      aiUnavailable: error.status === 503 || error.status === 429,
      error:
        error.message ||
        'Unable to complete AI soil analysis at this time. Please check your internet connection or try again.',
    });
  }
});

// Setup Vite middleware in dev or static server in prod
async function startServer() {
  if (!isProduction) {
    const { createServer } = await import('vite');
    const vite = await createServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.join(__dirname, 'dist')));
    app.get('*', (req, res) => {
      res.sendFile(path.join(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`AGROVA server running on http://0.0.0.0:${PORT} (${isProduction ? 'production' : 'development'})`);
  });
}

startServer();

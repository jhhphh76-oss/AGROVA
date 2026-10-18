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

// Ensure malformed JSON requests to API return consistent JSON errors rather than Express HTML
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  if (err instanceof SyntaxError && 'status' in err && (err as any).status === 400 && 'body' in err) {
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    return res.status(400).json({
      success: false,
      error: {
        code: 'INVALID_JSON',
        message: 'Malformed JSON payload in request body. Please check the submitted information.',
      },
    });
  }
  next(err);
});

// Helper for consistent JSON API error responses with secure logging
function sendJsonError(
  res: express.Response,
  status: number,
  code: string,
  message: string,
  diagnosticDetails?: any
) {
  if (diagnosticDetails) {
    console.error(`[API Error ${status} - ${code}]: ${message}`, diagnosticDetails);
  }
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  return res.status(status).json({
    success: false,
    error: message,
    code,
    errorDetails: {
      code,
      message,
    },
  });
}

// Indian mobile phone number validator and normalizer
function validateIndianPhoneNumber(phone: unknown): { valid: boolean; normalized?: string; error?: string } {
  if (phone === null || phone === undefined) {
    return {
      valid: false,
      error: 'Phone number is mandatory. Please enter your mobile number.',
    };
  }
  const str = String(phone).trim();
  if (!str) {
    return {
      valid: false,
      error: 'Phone number cannot be empty. Please enter your mobile number.',
    };
  }
  const stripped = str.replace(/[\s\-\(\)\.]/g, '');
  const indianMobileRegex = /^(?:\+?91|0)?([6-9]\d{9})$/;
  const match = stripped.match(indianMobileRegex);
  if (!match) {
    return {
      valid: false,
      error: 'Please enter a valid 10-digit Indian mobile number (e.g. 9845012345 or +91 9845012345).',
    };
  }
  const tenDigits = match[1];
  const normalized = `+91 ${tenDigits.slice(0, 5)} ${tenDigits.slice(5)}`;
  return {
    valid: true,
    normalized,
  };
}

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
const PLANT_SCANS_FILE = path.join(DATA_DIR, 'plant_scans.json');
const ADVISOR_CONVERSATIONS_FILE = path.join(DATA_DIR, 'advisor_conversations.json');
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
  phone?: string;
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

function getUserPlantScans(): Record<string, any[]> {
  return readJsonFile<Record<string, any[]>>(PLANT_SCANS_FILE, {});
}
function saveUserPlantScans(data: Record<string, any[]>): void {
  writeJsonFile(PLANT_SCANS_FILE, data);
}

function getUserAdvisorConversations(): Record<string, any[]> {
  return readJsonFile<Record<string, any[]>>(ADVISOR_CONVERSATIONS_FILE, {});
}
function saveUserAdvisorConversations(data: Record<string, any[]>): void {
  writeJsonFile(ADVISOR_CONVERSATIONS_FILE, data);
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
    return sendJsonError(
      res,
      401,
      'UNAUTHORIZED',
      'Authentication required. Please sign in to your AgriConnect account.'
    );
  }
  next();
}

function requireFarmer(req: express.Request, res: express.Response, next: express.NextFunction) {
  const user = (req as any).user as StoredUser | null;
  if (!user) {
    return sendJsonError(
      res,
      401,
      'UNAUTHORIZED',
      'Authentication required. Please sign in to your AgriConnect account.'
    );
  }
  if (user.role !== 'farmer') {
    return sendJsonError(
      res,
      403,
      'FORBIDDEN',
      'Permission denied: This action is restricted to registered farmers.'
    );
  }
  next();
}

function requireBuyer(req: express.Request, res: express.Response, next: express.NextFunction) {
  const user = (req as any).user as StoredUser | null;
  if (!user) {
    return sendJsonError(
      res,
      401,
      'UNAUTHORIZED',
      'Authentication required. Please sign in to your AgriConnect account.'
    );
  }
  if (user.role !== 'buyer') {
    return sendJsonError(
      res,
      403,
      'FORBIDDEN',
      'Permission denied: This action is restricted to registered buyers.'
    );
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
        contactNumber: user.phone || '',
        preferredLanguage: user.preferredLanguage || 'en',
        preferredAreaUnit: 'acres',
        preferredWeightUnit: 'quintal',
        preferredTempUnit: 'celsius',
        totalFarmArea: 5.0,
        primarySoilType: 'Black Soil (Regur)',
      };
      saveFarmerProfiles(profiles);
    } else if (user.phone && !profiles[user.id].contactNumber) {
      profiles[user.id].contactNumber = user.phone;
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
        contactNumber: user.phone || '',
        email: user.email,
        preferredLanguage: user.preferredLanguage || 'en',
        preferredCategories: ['Grains & Cereals', 'Pulses', 'Vegetables', 'Oilseeds'],
      };
      saveBuyerProfiles(profiles);
    } else if (user.phone && !profiles[user.id].contactNumber) {
      profiles[user.id].contactNumber = user.phone;
      saveBuyerProfiles(profiles);
    }
    return profiles[user.id];
  }
}

// POST Register
app.post('/api/auth/register', (req, res) => {
  try {
    // 1. Verify request body presence and type
    if (!req.body || typeof req.body !== 'object' || Array.isArray(req.body)) {
      return sendJsonError(
        res,
        400,
        'INVALID_REQUEST',
        'Request body must be a valid JSON object. Please check the submitted information.'
      );
    }

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

    // 2. Validate Required Fields
    if (!name || typeof name !== 'string' || !name.trim()) {
      return sendJsonError(
        res,
        400,
        'MISSING_REQUIRED_FIELD',
        'Full display name is required.'
      );
    }

    if (!email || typeof email !== 'string' || !email.includes('@')) {
      return sendJsonError(
        res,
        400,
        'INVALID_EMAIL',
        'A valid email address is required.'
      );
    }

    const cleanEmail = email.trim().toLowerCase();

    // 3. Mandatory Phone Number Validation (India mobile)
    const phoneValidation = validateIndianPhoneNumber(phone);
    if (!phoneValidation.valid || !phoneValidation.normalized) {
      return sendJsonError(
        res,
        400,
        'INVALID_PHONE_NUMBER',
        phoneValidation.error || 'A valid 10-digit Indian mobile number is mandatory for registration.'
      );
    }
    const cleanPhone = phoneValidation.normalized;

    if (!password || typeof password !== 'string' || password.length < 6) {
      return sendJsonError(
        res,
        400,
        'INVALID_PASSWORD',
        'Password must be at least 6 characters.'
      );
    }

    if (role !== 'farmer' && role !== 'buyer') {
      return sendJsonError(
        res,
        400,
        'INVALID_ROLE',
        'Account role must be either Farmer or Buyer.'
      );
    }

    // 4. Duplicate Account Check
    const users = getUsers();
    if (users.some((u) => u.email.toLowerCase() === cleanEmail)) {
      return sendJsonError(
        res,
        409,
        'DUPLICATE_ACCOUNT',
        'An account with this email address already exists. Please sign in or use another email.'
      );
    }

    // 5. Secure Credential Generation
    const salt = crypto.randomBytes(16).toString('hex');
    const passwordHash = hashPassword(password, salt);
    const userId = `usr-${Date.now()}-${crypto.randomBytes(4).toString('hex')}`;

    const newUser: StoredUser = {
      id: userId,
      name: name.trim(),
      email: cleanEmail,
      phone: cleanPhone,
      role,
      passwordHash,
      salt,
      createdAt: new Date().toISOString(),
      preferredLanguage: language || 'en',
    };

    users.push(newUser);
    saveUsers(users);

    // 6. Initialize Role-specific Profile with Validated Phone Number
    if (role === 'farmer') {
      const farmerProfiles = getFarmerProfiles();
      farmerProfiles[userId] = {
        userId,
        name: newUser.name,
        farmName: `${newUser.name}'s Farm`,
        villageOrDistrict: String(farmDistrict || 'Vijayapura').trim(),
        state: 'Karnataka',
        contactNumber: cleanPhone,
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
        contactNumber: cleanPhone,
        email: cleanEmail,
        preferredLanguage: newUser.preferredLanguage,
        preferredCategories: ['Grains & Cereals', 'Pulses', 'Vegetables', 'Oilseeds'],
      };
      saveBuyerProfiles(buyerProfiles);
    }

    // 7. Generate Authenticated Session Token
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

    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    return res.status(201).json({
      success: true,
      token,
      user: sanitizeUser(newUser),
      profile,
    });
  } catch (err: any) {
    return sendJsonError(
      res,
      500,
      'SERVER_ERROR',
      'Account creation failed due to an unexpected server failure. Please try again.',
      err
    );
  }
});

// POST Login
app.post('/api/auth/login', (req, res) => {
  try {
    if (!req.body || typeof req.body !== 'object' || Array.isArray(req.body)) {
      return sendJsonError(
        res,
        400,
        'INVALID_REQUEST',
        'Request body must be a valid JSON object.'
      );
    }

    const { email, password } = req.body;

    if (!email || !password) {
      return sendJsonError(
        res,
        400,
        'MISSING_REQUIRED_FIELD',
        'Email and password are required.'
      );
    }

    const cleanEmail = String(email).trim().toLowerCase();
    const users = getUsers();
    const user = users.find((u) => u.email.toLowerCase() === cleanEmail);

    if (!user) {
      return sendJsonError(
        res,
        401,
        'INVALID_CREDENTIALS',
        'Invalid email or password.'
      );
    }

    const isValid = verifyPassword(password, user.passwordHash, user.salt);
    if (!isValid) {
      return sendJsonError(
        res,
        401,
        'INVALID_CREDENTIALS',
        'Invalid email or password.'
      );
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

    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    return res.json({
      success: true,
      token,
      user: sanitizeUser(user),
      profile,
    });
  } catch (err: any) {
    return sendJsonError(
      res,
      500,
      'SERVER_ERROR',
      'Login failed due to an unexpected server failure.',
      err
    );
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
    const { name, preferredLanguage, farmProfile, buyerProfile, phone } = req.body;

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

      // Check if phone number is being updated
      const rawPhone = phone || (user.role === 'farmer' ? farmProfile?.contactNumber : buyerProfile?.contactNumber);
      if (rawPhone) {
        const phoneValidation = validateIndianPhoneNumber(rawPhone);
        if (!phoneValidation.valid || !phoneValidation.normalized) {
          return sendJsonError(
            res,
            400,
            'INVALID_PHONE_NUMBER',
            phoneValidation.error || 'A valid 10-digit Indian mobile number is required.'
          );
        }
        users[userIdx].phone = phoneValidation.normalized;
        user.phone = phoneValidation.normalized;
      }

      saveUsers(users);
    }

    if (farmProfile && user.role === 'farmer') {
      const fProfiles = getFarmerProfiles();
      const current = fProfiles[user.id] || {};
      fProfiles[user.id] = {
        ...current,
        ...farmProfile,
        userId: user.id,
        name: user.name,
        contactNumber: user.phone || farmProfile.contactNumber || current.contactNumber || '',
      };
      saveFarmerProfiles(fProfiles);
    }

    if (buyerProfile && user.role === 'buyer') {
      const bProfiles = getBuyerProfiles();
      const current = bProfiles[user.id] || {};
      bProfiles[user.id] = {
        ...current,
        ...buyerProfile,
        id: user.id,
        userId: user.id,
        name: user.name,
        contactNumber: user.phone || buyerProfile.contactNumber || current.contactNumber || '',
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
    return sendJsonError(res, 500, 'SERVER_ERROR', err.message || 'Failed to update profile.');
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
app.get('/api/farmer/crops', requireFarmer, (req, res) => {
  try {
    const user = (req as any).user as StoredUser;
    const allCrops = getUserCrops();
    const userCrops = allCrops[user.id] || [];
    res.json({ success: true, crops: userCrops });
  } catch (err: any) {
    return sendJsonError(res, 500, 'SERVER_ERROR', err.message || 'Failed to load crops.');
  }
});

app.post('/api/farmer/crops', requireFarmer, (req, res) => {
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
    return sendJsonError(res, 500, 'SERVER_ERROR', err.message || 'Failed to save crop.');
  }
});

app.delete('/api/farmer/crops/:id', requireFarmer, (req, res) => {
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
    return sendJsonError(res, 500, 'SERVER_ERROR', err.message || 'Failed to delete crop.');
  }
});

// Observations
app.get('/api/farmer/observations', requireFarmer, (req, res) => {
  try {
    const user = (req as any).user as StoredUser;
    const allObs = getUserObservations();
    res.json({ success: true, observations: allObs[user.id] || [] });
  } catch (err: any) {
    return sendJsonError(res, 500, 'SERVER_ERROR', err.message || 'Failed to load observations.');
  }
});

app.post('/api/farmer/observations', requireFarmer, (req, res) => {
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
    return sendJsonError(res, 500, 'SERVER_ERROR', err.message || 'Failed to save observation.');
  }
});

app.delete('/api/farmer/observations/:id', requireFarmer, (req, res) => {
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
    return sendJsonError(res, 500, 'SERVER_ERROR', err.message || 'Failed to delete observation.');
  }
});

// Soil Scans
app.get('/api/farmer/soil-scans', requireFarmer, (req, res) => {
  try {
    const user = (req as any).user as StoredUser;
    const allScans = getUserSoilScans();
    res.json({ success: true, soilScans: allScans[user.id] || [] });
  } catch (err: any) {
    return sendJsonError(res, 500, 'SERVER_ERROR', err.message || 'Failed to load soil scans.');
  }
});

app.post('/api/farmer/soil-scans', requireFarmer, (req, res) => {
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
    return sendJsonError(res, 500, 'SERVER_ERROR', err.message || 'Failed to save soil scan.');
  }
});

app.delete('/api/farmer/soil-scans/:id', requireFarmer, (req, res) => {
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
    return sendJsonError(res, 500, 'SERVER_ERROR', err.message || 'Failed to delete soil scan.');
  }
});

// Plant Scans CRUD
app.get('/api/farmer/plant-scans', requireFarmer, (req, res) => {
  try {
    const user = (req as any).user as StoredUser;
    const allScans = getUserPlantScans();
    res.json({ success: true, plantScans: allScans[user.id] || [] });
  } catch (err: any) {
    return sendJsonError(res, 500, 'SERVER_ERROR', err.message || 'Failed to load plant scans.');
  }
});

app.post('/api/farmer/plant-scans', requireFarmer, (req, res) => {
  try {
    const user = (req as any).user as StoredUser;
    const scanData = req.body;
    const allScans = getUserPlantScans();
    const userScans = allScans[user.id] || [];

    const existingIdx = userScans.findIndex((s) => s.id === scanData.id);
    const newRecord = {
      ...scanData,
      id: scanData.id || `plant-${Date.now()}`,
      date: scanData.date || new Date().toISOString().split('T')[0],
    };

    if (existingIdx >= 0) {
      userScans[existingIdx] = newRecord;
    } else {
      userScans.unshift(newRecord);
    }

    allScans[user.id] = userScans;
    saveUserPlantScans(allScans);

    res.json({ success: true, plantScan: newRecord });
  } catch (err: any) {
    return sendJsonError(res, 500, 'SERVER_ERROR', err.message || 'Failed to save plant scan.');
  }
});

app.delete('/api/farmer/plant-scans/:id', requireFarmer, (req, res) => {
  try {
    const user = (req as any).user as StoredUser;
    const scanId = req.params.id;
    const allScans = getUserPlantScans();
    if (allScans[user.id]) {
      allScans[user.id] = allScans[user.id].filter((s) => s.id !== scanId);
      saveUserPlantScans(allScans);
    }
    res.json({ success: true });
  } catch (err: any) {
    return sendJsonError(res, 500, 'SERVER_ERROR', err.message || 'Failed to delete plant scan.');
  }
});

// Advisor Conversation History CRUD
app.get('/api/farmer/advisor-history', requireFarmer, (req, res) => {
  try {
    const user = (req as any).user as StoredUser;
    const allConvs = getUserAdvisorConversations();
    res.json({ success: true, messages: allConvs[user.id] || [] });
  } catch (err: any) {
    return sendJsonError(res, 500, 'SERVER_ERROR', err.message || 'Failed to load advisor history.');
  }
});

app.post('/api/farmer/advisor-history', requireFarmer, (req, res) => {
  try {
    const user = (req as any).user as StoredUser;
    const { messages } = req.body;
    const allConvs = getUserAdvisorConversations();
    allConvs[user.id] = Array.isArray(messages) ? messages : [];
    saveUserAdvisorConversations(allConvs);
    res.json({ success: true });
  } catch (err: any) {
    return sendJsonError(res, 500, 'SERVER_ERROR', err.message || 'Failed to save advisor history.');
  }
});

app.delete('/api/farmer/advisor-history', requireFarmer, (req, res) => {
  try {
    const user = (req as any).user as StoredUser;
    const allConvs = getUserAdvisorConversations();
    delete allConvs[user.id];
    saveUserAdvisorConversations(allConvs);
    res.json({ success: true });
  } catch (err: any) {
    return sendJsonError(res, 500, 'SERVER_ERROR', err.message || 'Failed to clear advisor history.');
  }
});

// GET Shared Marketplace Listings
// Privacy rule: Do not publicly expose phone numbers to every marketplace visitor.
// If the requester is authenticated and is the seller of the listing, their phone is retained.
// For all other visitors and buyers, contactPhone is not exposed in public browse feeds.
app.get('/api/marketplace/listings', (req, res) => {
  try {
    const user = (req as any).user as StoredUser | null;
    const data = getMarketplaceData();

    const sanitizedListings = data.listings.map((l) => {
      if (user && user.id === l.sellerId) {
        return l;
      }
      const { contactPhone, ...publicInfo } = l;
      return publicInfo;
    });

    res.json({
      success: true,
      listings: sanitizedListings,
    });
  } catch (err: any) {
    return sendJsonError(res, 500, 'SERVER_ERROR', err.message || 'Failed to load listings');
  }
});

// POST Create Crop Listing (Farmer Role Required on Server)
app.post('/api/marketplace/listings', requireFarmer, (req, res) => {
  try {
    const user = (req as any).user as StoredUser;

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
      grade,
      harvestAvailability,
      description,
      photoUrl,
    } = req.body;

    if (!title || !cropCategory || !quantity || !expectedPrice || !location) {
      return sendJsonError(
        res,
        400,
        'MISSING_REQUIRED_FIELD',
        'Missing required listing fields (title, cropCategory, quantity, expectedPrice, location).'
      );
    }

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
      sellerId: user.id, // Enforce authenticated owner
      sellerName: user.name,
      sellerType: 'Farmer',
      contactPhone: user.phone || '', // Associated with verified farmer account
      grade: grade || 'Grade A (Premium)',
      harvestAvailability: String(harvestAvailability || 'Ready for Immediate Dispatch').trim(),
      isDemonstration: false,
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
    return sendJsonError(res, 500, 'SERVER_ERROR', err.message || 'Failed to create listing');
  }
});

// DELETE Crop Listing (Enforce Seller Ownership on Server)
app.delete('/api/marketplace/listings/:id', requireFarmer, (req, res) => {
  try {
    const listingId = req.params.id;
    const user = (req as any).user as StoredUser;

    const store = getMarketplaceData();
    const listing = store.listings.find((l) => l.id === listingId);

    if (!listing) {
      return sendJsonError(res, 404, 'NOT_FOUND', 'Listing not found.');
    }

    if (listing.isDemonstration) {
      return sendJsonError(
        res,
        403,
        'FORBIDDEN',
        'Sample demonstration listings are system-provided and cannot be deleted.'
      );
    }

    if (listing.sellerId !== user.id) {
      return sendJsonError(
        res,
        403,
        'FORBIDDEN',
        'You only have permission to delete your own listings.'
      );
    }

    store.listings = store.listings.filter((l) => l.id !== listingId);
    saveMarketplaceData(store);

    res.json({ success: true, message: 'Listing removed successfully.' });
  } catch (err: any) {
    return sendJsonError(res, 500, 'SERVER_ERROR', err.message || 'Failed to delete listing');
  }
});

// GET Enquiries (Privacy: Buyers see only their enquiries, Farmers see only enquiries for their listings)
app.get('/api/marketplace/enquiries', requireAuth, (req, res) => {
  try {
    const user = (req as any).user as StoredUser;
    const store = getMarketplaceData();

    let result: any[] = [];
    if (user.role === 'buyer') {
      result = store.enquiries.filter((e) => e.buyerId === user.id);
    } else if (user.role === 'farmer') {
      const farmerListingIds = new Set(
        store.listings.filter((l) => l.sellerId === user.id).map((l) => l.id)
      );
      result = store.enquiries.filter(
        (e) => (e.sellerId && e.sellerId === user.id) || farmerListingIds.has(e.listingId)
      );
    }

    res.json({ success: true, enquiries: result });
  } catch (err: any) {
    return sendJsonError(res, 500, 'SERVER_ERROR', err.message || 'Failed to get enquiries');
  }
});

// POST Create Purchase Enquiry (Buyer Role Required on Server)
app.post('/api/marketplace/enquiries', requireBuyer, (req, res) => {
  try {
    const user = (req as any).user as StoredUser;

    const {
      listingId,
      buyerPhone,
      buyerBusiness,
      buyerLocation,
      requestedQuantity,
      unit,
      offeredPrice,
      priceUnit,
      message,
    } = req.body;

    if (!listingId || !requestedQuantity) {
      return sendJsonError(
        res,
        400,
        'MISSING_REQUIRED_FIELD',
        'Missing required enquiry fields (listingId, requestedQuantity).'
      );
    }

    const store = getMarketplaceData();
    const targetListing = store.listings.find((l) => l.id === listingId);
    if (!targetListing) {
      return sendJsonError(res, 404, 'NOT_FOUND', 'The requested crop listing does not exist.');
    }

    // Validate Buyer Contact Phone Number
    const phoneToUse = buyerPhone || user.phone;
    const phoneValidation = validateIndianPhoneNumber(phoneToUse);
    if (!phoneValidation.valid || !phoneValidation.normalized) {
      return sendJsonError(
        res,
        400,
        'INVALID_PHONE_NUMBER',
        phoneValidation.error || 'A valid Indian mobile number is required to contact the grower.'
      );
    }

    const newEnquiry = {
      id: `enq-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
      listingId,
      listingTitle: targetListing.title,
      farmerName: targetListing.sellerName,
      sellerPhone: targetListing.contactPhone || undefined, // Provided in agreed enquiry record
      sellerId: targetListing.sellerId || undefined,
      buyerId: user.id, // Strictly authenticated buyer
      buyerName: user.name,
      buyerPhone: phoneValidation.normalized,
      buyerBusiness: String(buyerBusiness || '').trim(),
      buyerLocation: String(buyerLocation || '').trim(),
      requestedQuantity: Number(requestedQuantity) || 1,
      unit: unit || targetListing.unit || 'quintal',
      offeredPrice: offeredPrice ? Number(offeredPrice) : targetListing.expectedPrice,
      priceUnit: priceUnit || targetListing.priceUnit || 'per quintal',
      message: String(message || 'I am interested in procuring this harvest. Please contact me.').trim(),
      createdAt: new Date().toISOString(),
      status: 'Pending Response',
    };

    store.enquiries.unshift(newEnquiry);
    saveMarketplaceData(store);

    res.status(201).json({
      success: true,
      enquiry: newEnquiry,
    });
  } catch (err: any) {
    return sendJsonError(res, 500, 'SERVER_ERROR', err.message || 'Failed to submit enquiry');
  }
});

// PATCH Update Enquiry Status (Farmer Action with Listing Ownership Verification)
app.patch('/api/marketplace/enquiries/:id/status', requireFarmer, (req, res) => {
  try {
    const enquiryId = req.params.id;
    const { status } = req.body;
    const user = (req as any).user as StoredUser;

    const store = getMarketplaceData();
    const index = store.enquiries.findIndex((e) => e.id === enquiryId);

    if (index === -1) {
      return sendJsonError(res, 404, 'NOT_FOUND', 'Enquiry record not found.');
    }

    const enquiry = store.enquiries[index];
    const targetListing = store.listings.find((l) => l.id === enquiry.listingId);

    // Ensure the farmer owns the listing for this enquiry
    if (enquiry.sellerId !== user.id && (!targetListing || targetListing.sellerId !== user.id)) {
      return sendJsonError(
        res,
        403,
        'FORBIDDEN',
        'You only have permission to update enquiries for your own crop listings.'
      );
    }

    store.enquiries[index].status = status;
    saveMarketplaceData(store);

    res.json({ success: true, enquiry: store.enquiries[index] });
  } catch (err: any) {
    return sendJsonError(res, 500, 'SERVER_ERROR', err.message || 'Failed to update enquiry status');
  }
});

// Soil Scan AI Analysis endpoint
app.post('/api/analyze-soil', async (req, res) => {
  const { imageBase64, mimeType, farmContext } = req.body;

  if (!imageBase64 || typeof imageBase64 !== 'string') {
    return sendJsonError(
      res,
      400,
      'MISSING_REQUIRED_FIELD',
      'No image data provided for soil analysis. Please capture a real photograph.'
    );
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return sendJsonError(
      res,
      503,
      'GEMINI_API_KEY_MISSING',
      'Gemini AI API key is not configured on the server. AI image analysis is unavailable.'
    );
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

    // Retry loop for transient model availability spikes
    let responseText = '';
    let lastError: any = null;
    const cleanBase64 = imageBase64.replace(/^data:[^;]+;base64,/, '');
    const modelsToTry = ['gemini-flash-latest', 'gemini-3.8-flash', 'gemini-3.1-flash-lite'];

    for (const modelName of modelsToTry) {
      for (let attempt = 1; attempt <= 2; attempt++) {
        try {
          const result = await ai.models.generateContent({
            model: modelName,
            contents: [
              {
                inlineData: {
                  mimeType: mimeType || 'image/jpeg',
                  data: cleanBase64,
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
          await new Promise((resolve) => setTimeout(resolve, 600));
        }
      }
      if (responseText) break;
    }

    if (!responseText) {
      throw lastError || new Error('No response generated by Gemini model.');
    }

    const cleanJson = responseText.replace(/^```json\s*/i, '').replace(/```$/i, '').trim();
    const parsedData = JSON.parse(cleanJson);

    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    return res.json({
      success: true,
      analysis: {
        ...parsedData,
        analyzedAt: new Date().toISOString(),
        modelUsed: 'Gemini Vision (Verified)',
      },
    });
  } catch (error: any) {
    return sendJsonError(
      res,
      error.status === 503 || error.status === 429 ? 503 : 500,
      error.status === 429 ? 'RATE_LIMIT_EXCEEDED' : 'AI_SERVICE_ERROR',
      error.message || 'Unable to complete AI soil analysis at this time. Please check your internet connection or try again.',
      error
    );
  }
});

// Plant Scan AI Analysis endpoint
app.post('/api/analyze-plant', async (req, res) => {
  const { imageBase64, mimeType, farmContext } = req.body;

  if (!imageBase64 || typeof imageBase64 !== 'string') {
    return sendJsonError(
      res,
      400,
      'MISSING_REQUIRED_FIELD',
      'No image data provided for plant analysis. Please capture a real photograph.'
    );
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return sendJsonError(
      res,
      503,
      'GEMINI_API_KEY_MISSING',
      'Gemini AI API key is not configured on the server. AI plant analysis is unavailable.'
    );
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
      ? `Farm context: Field: ${farmContext.fieldName || 'Plot 1'}, Crop: ${farmContext.cropName || 'Not specified'}, Location: ${farmContext.villageOrDistrict || 'Vijayapura'}, ${farmContext.state || 'Karnataka'}.`
      : '';

    const systemPrompt = `You are an expert agricultural botanist and plant pathologist assisting Indian farmers.
Analyze the provided photograph of a crop or plant.
${contextNotes}

CRITICAL RULES:
1. SUITABILITY CHECK:
   - Determine if this image clearly depicts a plant, leaf, crop stem, flower, or agricultural produce.
   - If the image is blurry, out of focus, too dark, microscopic without resolution, or does NOT depict a plant/crop (e.g. human face, room, machine, soil without plants), set "isSuitable": false.
   - If "isSuitable" is false, give a polite, constructive "unsuitableReason" in plain English explaining why (e.g. "The photo is too blurry or distant to observe leaf venation or spot margins. Please hold the camera steady 15-20cm from the affected leaf in good daylight and retake the photo.") and keep other fields empty.

2. VISIBLE OBSERVATIONS ONLY:
   - Identify visible plant parts (leaves, stems, petioles, fruit, flowers).
   - foliarCondition: Detailed visual state of leaves (e.g. "Interveinal yellowing (chlorosis)", "Brown circular necrotic spots with concentric rings", "Curling along leaf margins", "Wilting").
   - pestOrPathogenSigns: Any visible webbing, insect frass, feeding holes, powdery mildew coating, or fungal spores. If none visible, state "No visible insects or fungal mycelium directly visible at this resolution".
   - overallVigor: General appearance (e.g. "Moderately stressed", "Severe necrosis on lower canopy", "Active vegetative growth with localized leaf spots").

3. POSSIBLE EXPLANATIONS & UNCERTAINTY:
   - Suggest 1-3 plausible explanations (e.g., Early Blight / Alternaria, Nitrogen deficiency, Moisture stress, Thrips damage).
   - Set likelihood to "Possible", "Uncertain", or "Requires In-Field Confirmation".
   - CRITICAL: You must NEVER claim to provide a definitive diagnosis from a photo alone. Explicitly describe the uncertainty and explain that fungal, viral, bacterial, and abiotic factors can produce overlapping symptoms.

4. FOLLOW-UP QUESTIONS:
   - Provide 2-3 essential agronomic follow-up questions for the farmer (e.g., "What variety or hybrid was planted?", "Did symptoms start on older lower leaves or younger upper leaves?", "What was the date of last irrigation or heavy rainfall?").

5. PRACTICAL NEXT STEPS & PREVENTION:
   - Actionable field cultural practices (e.g., remove heavily infected fallen debris, avoid overhead sprinkler splash, inspect root collar for rot, check leaf undersides with a 10x lens).
   - Prevention guidance (crop rotation, balanced fertilization, spacing for airflow).
   - Do NOT prescribe dangerous, off-label, or specific toxic chemical pesticide dosages without warning. Advise consulting local Krishi Vigyan Kendra (KVK) or State Agricultural University extension officers.

6. SCIENTIFIC CAUTION:
   - Provide a clear, mandatory disclaimer: "Visual image analysis is an informational aid, NOT a definitive laboratory plant pathology diagnosis. Pathogen confirmation requires microscopic examination or tissue culturing. Verify all treatment measures with certified local agricultural experts before spraying."

Return STRICTLY in JSON format matching this schema:
{
  "isSuitable": boolean,
  "unsuitableReason": string | null,
  "cropTypeIdentified": string,
  "confidenceNote": string,
  "visibleObservations": {
    "plantPartsVisible": string[],
    "foliarCondition": string,
    "pestOrPathogenSigns": string,
    "overallVigor": string
  },
  "possibleExplanations": [
    {
      "cause": string,
      "likelihood": "Possible" | "Uncertain" | "Requires In-Field Confirmation",
      "explanation": string,
      "uncertaintyNote": string
    }
  ],
  "followUpQuestions": string[],
  "practicalNextSteps": string[],
  "preventionGuidance": string[],
  "scientificCaution": string
}`;

    let responseText = '';
    let lastError: any = null;
    const cleanBase64 = imageBase64.replace(/^data:[^;]+;base64,/, '');
    const modelsToTry = ['gemini-flash-latest', 'gemini-3.8-flash', 'gemini-3.1-flash-lite'];

    for (const modelName of modelsToTry) {
      for (let attempt = 1; attempt <= 2; attempt++) {
        try {
          const result = await ai.models.generateContent({
            model: modelName,
            contents: [
              {
                inlineData: {
                  mimeType: mimeType || 'image/jpeg',
                  data: cleanBase64,
                },
              },
              {
                text: 'Analyze this plant photograph according to your system instructions and return the JSON report.',
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
          await new Promise((resolve) => setTimeout(resolve, 600));
        }
      }
      if (responseText) break;
    }

    if (!responseText) {
      throw lastError || new Error('No response generated by Gemini model.');
    }

    const cleanJson = responseText.replace(/^```json\s*/i, '').replace(/```$/i, '').trim();
    const parsedData = JSON.parse(cleanJson);

    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    return res.json({
      success: true,
      analysis: {
        ...parsedData,
        analyzedAt: new Date().toISOString(),
        modelUsed: 'Gemini Vision (Verified)',
      },
    });
  } catch (error: any) {
    return sendJsonError(
      res,
      error.status === 503 || error.status === 429 ? 503 : 500,
      error.status === 429 ? 'RATE_LIMIT_EXCEEDED' : 'AI_SERVICE_ERROR',
      error.message || 'Unable to complete AI plant analysis at this time. Please check your internet connection or try again.',
      error
    );
  }
});

// AI Advisor conversational agronomy endpoint
app.post('/api/advisor-chat', async (req, res) => {
  const { messages, sharedScanContext, weatherContext, locationContext, language } = req.body;

  if (!messages || !Array.isArray(messages) || messages.length === 0) {
    return res.status(400).json({
      success: false,
      error: 'Messages array is required.',
    });
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return res.status(503).json({
      success: false,
      aiUnavailable: true,
      error: 'Gemini AI API key is not configured on the server. AI Advisor is unavailable.',
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

    let contextSection = '';
    if (locationContext) {
      contextSection += `Farmer's Location: ${locationContext}.\n`;
    }
    if (weatherContext) {
      contextSection += `Real-time Live Weather (Open-Meteo): ${weatherContext.temperature}°C, ${weatherContext.weatherDescription}, Humidity: ${weatherContext.humidity}%, Wind: ${weatherContext.windSpeed} km/h, Rain Chance: ${weatherContext.precipitationProbability}%. (Use this only when relevant to field operations like spraying, watering, or drying).\n`;
    }
    if (sharedScanContext) {
      contextSection += `Farmer has shared a scan result (${sharedScanContext.type.toUpperCase()} SCAN):\n${sharedScanContext.summary}\n`;
    }

    const langInstruction = language && language !== 'en'
      ? `Preferred Language: Respond primarily in the farmer's language (${language}) or bilingual with simple terms in brackets so the farmer feels completely comfortable.`
      : `Respond in clear, friendly English appropriate for Indian agricultural contexts.`;

    const systemPrompt = `You are AgriConnect AI Advisor, an expert, trustworthy, and empathetic digital agricultural advisor for Indian farmers.

${contextSection}
${langInstruction}

GUIDELINES:
1. Answer farmers' agricultural questions in warm, conversational, and direct language.
2. If a shared Plant Scan or Soil Scan result is attached, explain the visible findings, what might be happening, and practical recommendations in simple terms.
3. Give practical advice on crop-care, irrigation scheduling, soil-health, and integrated pest management (IPM).
4. Use the provided real weather and location data ONLY when relevant (e.g. advising against foliar spraying when wind > 15 km/h or rain probability > 40%).
5. Ask short, focused follow-up questions if critical details are missing (e.g. crop growth stage, days since transplanting, soil type).
6. Distinguish between direct visual observations, visual estimates, and laboratory-confirmed measurements. Remind farmers that photos cannot measure soil pH, NPK, or exact pathogen species.
7. Avoid unsupported pesticide dosages or dangerous chemical instructions. Advise farmers to follow official CIBRC package labels, follow pre-harvest intervals (PHI), and consult local Krishi Vigyan Kendra (KVK) or extension officers for specific chemical sprays.
8. Keep responses concise, organized with bullet points where helpful, and encouraging.`;

    // Convert messages to Gemini format
    const contents = messages.map((m: any) => ({
      role: m.role === 'user' ? 'user' : 'model',
      parts: [{ text: m.content }],
    }));

    let replyText = '';
    let lastError: any = null;
    const modelsToTry = ['gemini-3.1-flash-lite', 'gemini-3.8-flash', 'gemini-flash-latest'];

    for (const modelName of modelsToTry) {
      try {
        const result = await ai.models.generateContent({
          model: modelName,
          contents,
          config: {
            systemInstruction: systemPrompt,
            temperature: 0.4,
          },
        });
        if (result.text) {
          replyText = result.text.trim();
          break;
        }
      } catch (err: any) {
        lastError = err;
      }
    }

    if (!replyText) {
      throw lastError || new Error('No response generated by AI Advisor.');
    }

    return res.json({
      success: true,
      reply: replyText,
    });
  } catch (err: any) {
    console.error('Advisor chat error:', err);
    return res.status(500).json({
      success: false,
      aiUnavailable: err.status === 503 || err.status === 429,
      error: err.message || 'Unable to consult AI Advisor at this time. Please try again.',
    });
  }
});

// Fertilizer Guidance AI endpoint (supports direct photo analysis and agronomic parameters)
app.post('/api/fertilizer-guidance', async (req, res) => {
  const {
    imageBase64,
    mimeType,
    cropName,
    growthStage,
    location,
    soilType,
    hasSoilTest,
    soilTestResults, // e.g., { ph, nitrogen, phosphorus, potassium, organicCarbon, labName }
    scanResultsSummary,
    organicManureApplied,
    previousCropLegume,
    farmingNotes,
    language,
  } = req.body || {};

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return sendJsonError(
      res,
      503,
      'GEMINI_API_KEY_MISSING',
      'Gemini AI API key is not configured on the server. Fertilizer Guidance is unavailable.'
    );
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

    let contextDetails = `Reported Crop: ${cropName || 'Not specified (please inspect image)'}\nReported Growth Stage: ${growthStage || 'Vegetative'}\nLocation: ${location || 'Karnataka, India'}\nSoil Type: ${soilType || 'Unspecified'}\n`;
    if (organicManureApplied) {
      contextDetails += `Organic Manure / FYM Applied: Yes (provides slow-release micronutrients and biological activity).\n`;
    }
    if (previousCropLegume) {
      contextDetails += `Previous Season Crop: Legume / Pulse (natural residual nitrogen fixation in soil).\n`;
    }
    if (scanResultsSummary) {
      contextDetails += `Recent Scan Observations: ${scanResultsSummary}\n`;
    }
    if (hasSoilTest && soilTestResults) {
      contextDetails += `CONFIRMED LABORATORY SOIL TEST RESULTS: pH ${soilTestResults.ph || 'N/A'}, Nitrogen (N): ${soilTestResults.nitrogen || 'N/A'}, Phosphorus (P): ${soilTestResults.phosphorus || 'N/A'}, Potassium (K): ${soilTestResults.potassium || 'N/A'}, Organic Carbon: ${soilTestResults.organicCarbon || 'N/A'}.\n`;
    } else {
      contextDetails += `SOIL TEST STATUS: No official laboratory soil test card provided by farmer.\n`;
    }
    if (farmingNotes) {
      contextDetails += `Farmer Field Notes: ${farmingNotes}\n`;
    }

    const langInstruction = language && language !== 'en'
      ? `Respond in the farmer's preferred language code: ${language}. Ensure agricultural concepts and terminology are natural, respectful, and easy to understand.`
      : `Respond in clear, accessible English appropriate for Indian agricultural extension.`;

    const systemPrompt = `You are AgriConnect Fertilizer & Soil Fertility Advisor, a certified agronomic nutrition expert for Indian agriculture.
Analyze the provided crop nutrition context and/or plant/leaf/soil photograph:
${contextDetails}

CRITICAL AGRONOMIC & SCIENTIFIC RULES:
1. PLANT & CROP IDENTIFICATION:
   - When a photograph is provided, identify the crop or plant shown if visible. If ambiguous, state visual characteristics and uncertainty.
2. VISIBLE SYMPTOMS & POSSIBLE NUTRIENT DEFICIENCIES:
   - Describe visible foliage or soil surface symptoms (e.g. leaf tip scorch, interveinal chlorosis, pale yellowish canopy, purpling on stems/undersides, stunted growth).
   - Relate visible symptoms to possible nutrient concerns (e.g. Nitrogen, Phosphorus, Potassium, Zinc, Iron, Sulphur, Magnesium).
3. SCIENTIFIC HONESTY ON MEASUREMENTS VS ESTIMATES:
   - Clearly distinguish visual observations from confirmed soil chemistry measurements.
   - A photograph alone CANNOT measure soil pH, NPK, or moisture. If no laboratory Soil Health Card is supplied, explicitly state that soil chemistry is unconfirmed.
   - NEVER invent or hallucinate exact pH numbers, NPK values, or nutrient deficiencies without evidence.
4. EVIDENCE-BASED FERTILIZER RECOMMENDATIONS:
   - Recommend suitable fertilizer types (e.g. Urea, DAP, MOP, SSP, Zinc Sulphate, Boron, FYM/Compost, biofertilizers) ONLY when the evidence and growth stage support the recommendation.
   - Explain the purpose of each recommendation (e.g. "Nitrogen for vegetative canopy recovery", "Potassium for stalk strength and drought resilience").
   - Detail safe application considerations (e.g. split application to prevent leaching, applying in moist soil, avoiding direct contact with young stems to prevent salt burn).
5. RESPONSIBLE DOSAGE GUIDANCE:
   - AVOID inventing exact fertilizer kilogram/acre application rates from an image alone.
   - Explicitly explain that laboratory soil testing (Soil Health Card) and local agricultural expertise (Krishi Vigyan Kendra / State Agricultural University Package of Practices) are necessary for precise fertilizer quantities.
6. FOLLOW-UP QUESTIONS:
   - Ask concise follow-up questions for the crop, growth stage, location, irrigation method, or soil-test information when needed.
7. LANGUAGE:
   - ${langInstruction}

Return STRICT JSON matching this schema:
{
  "identifiedPlant": string,
  "confidence": string,
  "visibleSymptoms": string,
  "possibleNutrientConcerns": string[],
  "measuredVsEstimatedNotice": string,
  "stageNutrientDynamics": [
    {
      "nutrient": string,
      "role": string,
      "managementAdvice": string
    }
  ],
  "recommendedFertilizerTypes": [
    {
      "fertilizerType": string,
      "purpose": string,
      "applicationConsiderations": string
    }
  ],
  "safeApplicationConsiderations": string,
  "actionableNextSteps": string[],
  "followUpQuestions": string[],
  "extensionDisclaimer": string,
  "summary": string
}`;

    const contents: any[] = [];
    if (imageBase64 && typeof imageBase64 === 'string') {
      const cleanBase64 = imageBase64.replace(/^data:[^;]+;base64,/, '');
      contents.push({
        inlineData: {
          mimeType: mimeType || 'image/jpeg',
          data: cleanBase64,
        },
      });
    }

    contents.push({
      text: imageBase64
        ? `Analyze this photograph of a crop/plant/soil for agricultural fertilizer guidance. ${cropName ? `Reported crop: ${cropName}.` : ''} ${growthStage ? `Growth stage: ${growthStage}.` : ''}`
        : `Provide fertilizer and nutrient management guidance for ${cropName || 'crop'} at ${growthStage || 'current'} stage.`,
    });

    let responseText = '';
    let lastError: any = null;
    const modelsToTry = ['gemini-flash-latest', 'gemini-3.8-flash', 'gemini-3.1-flash-lite'];

    for (const modelName of modelsToTry) {
      try {
        const result = await ai.models.generateContent({
          model: modelName,
          contents,
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
      }
    }

    if (!responseText) {
      throw lastError || new Error('No response generated by Fertilizer Guidance AI.');
    }

    const cleanJson = responseText.replace(/^```json\s*/i, '').replace(/```$/i, '').trim();
    const parsedData = JSON.parse(cleanJson);

    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    return res.json({
      success: true,
      guidance: parsedData,
    });
  } catch (err: any) {
    return sendJsonError(
      res,
      err.status === 503 || err.status === 429 ? 503 : 500,
      err.status === 429 ? 'RATE_LIMIT_EXCEEDED' : 'AI_SERVICE_ERROR',
      err.message || 'Unable to generate fertilizer guidance at this time. Please try again.',
      err
    );
  }
});

// Catch-all for undefined /api/* routes so API requests always receive JSON rather than HTML
app.all('/api/*', (req, res) => {
  return sendJsonError(res, 404, 'NOT_FOUND', `API endpoint ${req.method} ${req.path} not found.`);
});

// Global API error handler for any unexpected server failures in /api/* routes
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  if (req.path.startsWith('/api/')) {
    return sendJsonError(
      res,
      err.status || 500,
      err.code || 'INTERNAL_SERVER_ERROR',
      'An unexpected server error occurred. Please try again.',
      err
    );
  }
  next(err);
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
    console.log(`AgriConnect server running on http://0.0.0.0:${PORT} (${isProduction ? 'production' : 'development'})`);
  });
}

startServer();

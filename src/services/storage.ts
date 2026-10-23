import {
  CropRecord,
  FarmerProfile,
  BuyerProfile,
  CropEnquiry,
  UserRole,
  FarmObservation,
  MarketListing,
  SoilScanRecord,
  PlantScanRecord,
  AdvisorMessage,
  CropDoctorInquiry,
  TextSize,
  CropTimelineProfile,
  CropTimelineReminder
} from '../types';
import { authService } from './authService';

function getRequestHeaders(_userRole?: UserRole, _userId?: string): Record<string, string> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  const token = authService.getToken();
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  return headers;
}

const STORAGE_KEYS = {
  USER_ROLE: 'agriconnect_user_role_v1',
  HAS_ONBOARDED: 'agriconnect_has_onboarded_v1',
  MARKET_LISTINGS: 'agriconnect_market_listings_v1',
  INITIALIZED: 'agriconnect_initialized_v1',
  PROFILE: 'agriconnect_profile_v1',
  BUYER_PROFILE: 'agriconnect_buyer_profile_v1',
  CROPS: 'agriconnect_crops_v1',
  OBSERVATIONS: 'agriconnect_observations_v1',
  SOIL_SCANS: 'agriconnect_soil_scans_v1',
  PLANT_SCANS: 'agriconnect_plant_scans_v1',
  ADVISOR_MESSAGES: 'agriconnect_advisor_messages_v1',
  ENQUIRIES: 'agriconnect_enquiries_v1',
  CROP_INQUIRIES: 'agriconnect_crop_inquiries_v1',
  TEXT_SIZE: 'agriconnect_text_size_v1',
};

const GUEST_FARMER_PROFILE: FarmerProfile = {
  name: 'Guest Farmer',
  farmName: 'My Farm',
  villageOrDistrict: 'Vijayapura',
  state: 'Karnataka',
  contactNumber: '',
  preferredLanguage: 'en',
  preferredAreaUnit: 'acres',
  preferredWeightUnit: 'quintal',
  preferredTempUnit: 'celsius',
  totalFarmArea: 0,
  primarySoilType: 'Black Soil (Regur)',
};

const GUEST_BUYER_PROFILE: BuyerProfile = {
  id: 'guest-buyer',
  name: 'Guest Buyer',
  businessName: 'Procurement Buyer',
  businessType: 'Wholesale Trader',
  location: 'Vijayapura APMC',
  state: 'Karnataka',
  contactNumber: '',
  email: '',
  preferredLanguage: 'en',
  preferredCategories: ['Grains & Cereals', 'Pulses', 'Vegetables', 'Oilseeds'],
};

// Aliases for backwards compatibility
const DEFAULT_PROFILE = GUEST_FARMER_PROFILE;
const DEFAULT_BUYER_PROFILE = GUEST_BUYER_PROFILE;

const DEFAULT_CROPS: CropRecord[] = [
  {
    id: 'crop-1',
    name: 'Wheat (Sharbati Golden)',
    variety: 'HD-2967 High Yield',
    fieldName: 'North Plot A (Canal Side)',
    area: 5.5,
    areaUnit: 'acres',
    sowingDate: '2026-11-15',
    currentStage: 'Flowering / Booting',
    estimatedHarvestDate: '2027-03-20',
    soilType: 'Alluvial Soil',
    notes: 'First top dressing with neem-coated urea completed. Good vegetative vigor.',
    healthStatus: 'healthy',
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'crop-2',
    name: 'Red Onion (Vijayapura Special)',
    variety: 'Pusa Red F1',
    fieldName: 'Central Garden Plot B',
    area: 4.0,
    areaUnit: 'acres',
    sowingDate: '2026-12-05',
    currentStage: 'Tillering / Vegetative',
    estimatedHarvestDate: '2027-04-10',
    soilType: 'Black Soil (Regur)',
    notes: 'Drip fertigation scheduled every Tuesday. Regular weed inspection.',
    healthStatus: 'healthy',
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'crop-3',
    name: 'Mustard (Sarson)',
    variety: 'Pusa Bold High Oil',
    fieldName: 'East Ridge Plot C',
    area: 5.0,
    areaUnit: 'acres',
    sowingDate: '2026-10-28',
    currentStage: 'Grain / Fruit Formation',
    estimatedHarvestDate: '2027-02-28',
    soilType: 'Sandy Loam',
    notes: 'Slight aphid spotting on border rows. Monitored yellow sticky traps.',
    healthStatus: 'attention',
    updatedAt: new Date().toISOString(),
  },
];

const DEFAULT_OBSERVATIONS: FarmObservation[] = [
  {
    id: 'obs-1',
    date: '2026-10-08',
    cropName: 'Wheat (Sharbati Golden)',
    fieldName: 'North Plot A (Canal Side)',
    category: 'Irrigation',
    notes: 'Canal water received; applied 4 hours flood irrigation. Soil moisture optimal.',
  },
  {
    id: 'obs-2',
    date: '2026-10-04',
    cropName: 'Mustard (Sarson)',
    fieldName: 'East Ridge Plot C',
    category: 'Pest & Disease',
    notes: 'Observed mild aphid movement on southern border. Handled with organic neem oil spray.',
  },
  {
    id: 'obs-3',
    date: '2026-09-25',
    cropName: 'Red Onion (Vijayapura Special)',
    fieldName: 'Central Garden Plot B',
    category: 'Fertilizer',
    notes: 'Applied well-decomposed FYM (Farmyard Manure) 2 tractor trolleys before ridge formation.',
  },
];

const DEFAULT_SOIL_SCANS: SoilScanRecord[] = [
  {
    id: 'soil-1',
    date: '2026-10-02',
    fieldName: 'North Plot A (Canal Side)',
    knownSoilType: 'Alluvial Soil',
    soilMoisture: 'Moist / Optimal',
    fieldDrainage: 'Well-Drained',
    observations: 'Good crumb structure, dark loam appearance, rich earthworm activity.',
    isLabVerified: true,
    labResults: {
      pH: 6.8,
      nitrogenKgHa: 280, // Medium
      phosphorusKgHa: 22, // Medium-High
      potassiumKgHa: 310, // High
      organicCarbonPercent: 0.65, // Medium
      electricalConductivity: 0.42, // Normal
    },
    notes: 'Official Soil Health Card reference #SHC-2026-NSK-4412. Balanced soil foundation.',
  },
  {
    id: 'soil-2',
    date: '2026-09-18',
    fieldName: 'East Ridge Plot C',
    knownSoilType: 'Sandy Loam',
    soilMoisture: 'Dry',
    fieldDrainage: 'Well-Drained',
    observations: 'Light brown sandy loam. Fast drainage, requires organic mulch to retain moisture.',
    isLabVerified: false,
    labResults: {
      pH: 7.2,
      nitrogenKgHa: 195, // Low
      phosphorusKgHa: 16, // Medium
      potassiumKgHa: 240, // Medium
    },
    notes: 'Visual scan and farmer test strip. Recommended green manuring with Dhaincha.',
  },
];

export const DEFAULT_PLANT_SCANS: PlantScanRecord[] = [
  {
    id: 'plant-seed-1',
    date: '2026-10-12',
    cropName: 'Wheat',
    fieldName: 'Main Plot North',
    photoUrl: 'https://images.unsplash.com/photo-1574323347407-f5e1ad6d020b?w=600&auto=format&fit=crop&q=80',
    observations: 'Healthy vegetative wheat foliage, vibrant emerald green coloration, no signs of rust or fungal spots.',
    aiAnalysis: {
      isSuitable: true,
      cropTypeIdentified: 'Wheat (Triticum aestivum)',
      confidenceNote: 'High confidence based on leaf blade venation and tillering stage',
      visibleObservations: {
        plantPartsVisible: ['Leaves', 'Canopy'],
        foliarCondition: 'Healthy green leaf blade, robust cellular turgor, no chlorosis or necrosis',
        overallVigor: 'Excellent',
        pestOrPathogenSigns: 'None observed',
      },
      possibleExplanations: [
        {
          cause: 'Healthy crop vegetative vigor',
          likelihood: 'Possible',
          explanation: 'Uniform leaf color and lack of chlorosis indicate balanced nitrogen and moisture.',
          uncertaintyNote: 'Visual assessment indicates healthy vegetative canopy. Soil testing needed for exact nutrient levels.',
        },
      ],
      followUpQuestions: ['Has standard basal fertilizer been applied?'],
      practicalNextSteps: [
        'Maintain scheduled irrigation interval',
        'Inspect lower crown leaves in 7 days for early aphid presence',
      ],
      preventionGuidance: ['Follow local university Package of Practices for timely top-dressing.'],
      scientificCaution: 'Visual observation only, not a laboratory pathology report.',
      analyzedAt: '2026-10-10T10:00:00.000Z',
    },
    isAiAnalyzed: true,
    farmContext: {
      cropName: 'Wheat',
      fieldName: 'Main Plot North',
      villageOrDistrict: 'Vijayapura',
      state: 'Karnataka',
    },
  },
];

const DEFAULT_MARKET_LISTINGS: MarketListing[] = [
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
    sellerName: 'Narmada Valley Farmers Producer Co.',
    sellerType: 'FPO (Farmer Producer Org)',
    contactPhone: '+91 94250 11223',
    grade: 'Grade A (Premium)',
    isDemonstration: true,
    datePosted: '2026-10-10',
    description: 'Sun-dried golden grain, 11.5% moisture, machine cleaned, 50kg new gunny bags.',
    cropHealthAssessment: {
      score: 96,
      grade: 'A+',
      evaluatedAt: '2026-10-10',
      notes: 'AgriConnect scan assessment: 96% (Grade A+) from 3 verified leaf scans. Robust canopy vigor, zero foliar necrosis.',
    },
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
    sellerName: 'Kishore Patil',
    sellerType: 'Farmer',
    contactPhone: '+91 98451 99887',
    grade: 'Grade A (Premium)',
    isDemonstration: true,
    datePosted: '2026-10-09',
    description: 'Direct field harvest, tight skin, storage-ready for 3-4 months, sorted size 45mm-60mm.',
    cropHealthAssessment: {
      score: 88,
      grade: 'A',
      evaluatedAt: '2026-10-09',
      notes: 'AgriConnect scan assessment: 88% (Grade A) from 2 verified leaf scans. Mild thrip pressure noted, foliage clear.',
    },
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
    sellerName: 'Green Earth Krishi FPO',
    sellerType: 'FPO (Farmer Producer Org)',
    contactPhone: '+91 98120 44556',
    grade: 'Organic Certified',
    isDemonstration: true,
    datePosted: '2026-10-08',
    description: 'Certified organic, aged 1 year, extra-long grain with authentic aroma. Lab tested pesticide-free.',
    cropHealthAssessment: {
      score: 82,
      grade: 'B',
      evaluatedAt: '2026-10-08',
      notes: 'AgriConnect scan assessment: 82% (Grade B) from 2 verified leaf scans. Moderate leaf yellowing during ripening.',
    },
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
    sellerName: 'Vidarbha Organic Collective',
    sellerType: 'Farmer',
    contactPhone: '+91 97650 33221',
    grade: 'Grade A (Premium)',
    isDemonstration: true,
    datePosted: '2026-10-07',
    description: 'High protein desi chana, dried to 9% moisture, zero chemical fumigation.',
    cropHealthAssessment: null,
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
    sellerName: 'Malwa Agri Traders',
    sellerType: 'Buyer / Trader',
    contactPhone: '+91 94066 77889',
    grade: 'Grade B (Standard)',
    isDemonstration: true,
    datePosted: '2026-10-06',
    description: 'High oil yield soybean, 18-20% oil content, suitable for solvent extraction or seed.',
    cropHealthAssessment: {
      score: 95,
      grade: 'A+',
      evaluatedAt: '2026-10-06',
      notes: 'AgriConnect scan assessment: 95% (Grade A+) from 4 verified leaf scans. Vigorous canopy, zero defoliation.',
    },
  },
];

export const storageService = {
  getUserKey(baseKey: string): string {
    const user = authService.getUser();
    if (user && user.id) {
      return `agriconnect_${baseKey}_${user.id}`;
    }
    return `agriconnect_${baseKey}_guest`;
  },

  clearUserSessionData(): void {
    if (typeof window === 'undefined') return;
    try {
      const user = authService.getUser();
      if (user && user.id) {
        [
          `agriconnect_crops_${user.id}`,
          `agriconnect_observations_${user.id}`,
          `agriconnect_soil_scans_${user.id}`,
          `agriconnect_plant_scans_${user.id}`,
          `agriconnect_advisor_messages_${user.id}`,
          `agriconnect_enquiries_${user.id}`,
          `agriconnect_crop_inquiries_${user.id}`,
          `agriconnect_profile_${user.id}`,
          `agriconnect_buyer_profile_${user.id}`,
        ].forEach((k) => localStorage.removeItem(k));
      }
      [
        'agriconnect_crops_guest',
        'agriconnect_observations_guest',
        'agriconnect_soil_scans_guest',
        'agriconnect_plant_scans_guest',
        'agriconnect_advisor_messages_guest',
        'agriconnect_enquiries_guest',
        'agriconnect_crop_inquiries_guest',
        'agriconnect_profile_guest',
        'agriconnect_buyer_profile_guest',
        'agriconnect_enquiries_v1',
        'agriconnect_crop_inquiries_v1',
        'agrova_crops_v1',
        'agrova_observations_v1',
        'agrova_soil_scans_v1',
        'agrova_plant_scans_v1',
        'agrova_advisor_messages_v1',
        'agrova_enquiries_v1',
        'agrova_profile_v1',
        'agrova_buyer_profile_v1',
      ].forEach((k) => localStorage.removeItem(k));
    } catch (e) {
      console.warn('Failed to clear user session data', e);
    }
  },

  initializeDefaults(): void {
    if (typeof window === 'undefined') return;
    const isInitialized = localStorage.getItem(STORAGE_KEYS.INITIALIZED);
    if (!isInitialized) {
      localStorage.setItem(STORAGE_KEYS.MARKET_LISTINGS, JSON.stringify(DEFAULT_MARKET_LISTINGS));
      localStorage.setItem(STORAGE_KEYS.INITIALIZED, 'true');
    }
  },

  getUserRole(): UserRole {
    try {
      const user = authService.getUser();
      if (user?.role) return user.role;
      const role = localStorage.getItem(STORAGE_KEYS.USER_ROLE);
      if (role === 'buyer' || role === 'farmer') return role;
      return 'farmer';
    } catch {
      return 'farmer';
    }
  },

  hasCompletedOnboarding(): boolean {
    try {
      return localStorage.getItem(STORAGE_KEYS.HAS_ONBOARDED) === 'true';
    } catch {
      return false;
    }
  },

  setUserRole(role: UserRole): void {
    try {
      localStorage.setItem(STORAGE_KEYS.USER_ROLE, role);
      localStorage.setItem(STORAGE_KEYS.HAS_ONBOARDED, 'true');
    } catch (e) {
      console.error('Failed to set user role', e);
    }
  },

  setOnboardingCompleted(val: boolean): void {
    try {
      localStorage.setItem(STORAGE_KEYS.HAS_ONBOARDED, val ? 'true' : 'false');
    } catch (e) {
      console.error('Failed to set onboarding state', e);
    }
  },

  getTextSize(): TextSize {
    try {
      const size = localStorage.getItem(STORAGE_KEYS.TEXT_SIZE);
      if (size === 'standard' || size === 'large' || size === 'xlarge') return size;
      return 'standard';
    } catch {
      return 'standard';
    }
  },

  saveTextSize(size: TextSize): void {
    try {
      localStorage.setItem(STORAGE_KEYS.TEXT_SIZE, size);
      if (typeof document !== 'undefined') {
        document.documentElement.setAttribute('data-text-size', size);
      }
    } catch (e) {
      console.error('Failed to save text size', e);
    }
  },

  getBuyerProfile(): BuyerProfile {
    try {
      const user = authService.getUser();
      if (!user) return GUEST_BUYER_PROFILE;

      const data = localStorage.getItem(this.getUserKey('buyer_profile'));
      if (data) {
        const parsed = JSON.parse(data);
        if (parsed && (!parsed.userId || parsed.userId === user.id || parsed.id === user.id)) {
          return {
            ...parsed,
            id: user.id,
            userId: user.id,
            contactNumber: user.phone || parsed.contactNumber || '',
          };
        }
      }

      if (user.role === 'buyer' || user.roles?.includes('buyer')) {
        return {
          id: user.id,
          userId: user.id,
          name: user.name,
          businessName: `${user.name} Agri Procurement`,
          businessType: 'Wholesale Trader',
          location: 'Vijayapura APMC',
          state: 'Karnataka',
          contactNumber: user.phone || '',
          email: user.email,
          preferredLanguage: (user.preferredLanguage as any) || 'en',
          preferredCategories: ['Grains & Cereals', 'Pulses', 'Vegetables', 'Oilseeds'],
        };
      }
      return GUEST_BUYER_PROFILE;
    } catch {
      return GUEST_BUYER_PROFILE;
    }
  },

  saveBuyerProfile(profile: BuyerProfile): void {
    try {
      localStorage.setItem(this.getUserKey('buyer_profile'), JSON.stringify(profile));
    } catch (e) {
      console.error('Failed to save buyer profile', e);
    }
  },

  getProfile(): FarmerProfile {
    try {
      const user = authService.getUser();
      if (!user) return GUEST_FARMER_PROFILE;

      const data = localStorage.getItem(this.getUserKey('profile'));
      if (data) {
        const parsed = JSON.parse(data);
        if (parsed && (!parsed.userId || parsed.userId === user.id)) {
          return {
            ...parsed,
            userId: user.id,
            contactNumber: user.phone || parsed.contactNumber || '',
          };
        }
      }

      if (user.role === 'farmer' || user.roles?.includes('farmer')) {
        return {
          userId: user.id,
          name: user.name,
          farmName: `${user.name}'s Farm`,
          villageOrDistrict: 'Vijayapura',
          state: 'Karnataka',
          contactNumber: user.phone || '',
          preferredLanguage: (user.preferredLanguage as any) || 'en',
          preferredAreaUnit: 'acres',
          preferredWeightUnit: 'quintal',
          preferredTempUnit: 'celsius',
          totalFarmArea: 5.0,
          primarySoilType: 'Black Soil (Regur)',
        };
      }
      return GUEST_FARMER_PROFILE;
    } catch {
      return GUEST_FARMER_PROFILE;
    }
  },

  saveProfile(profile: FarmerProfile): void {
    try {
      localStorage.setItem(this.getUserKey('profile'), JSON.stringify(profile));
    } catch (e) {
      console.error('Failed to save profile', e);
    }
  },

  getCrops(): CropRecord[] {
    try {
      const data = localStorage.getItem(this.getUserKey('crops'));
      if (data) return JSON.parse(data);
      return [];
    } catch {
      return [];
    }
  },

  async fetchCrops(): Promise<CropRecord[]> {
    const token = authService.getToken();
    if (token) {
      try {
        const res = await fetch('/api/farmer/crops', {
          headers: getRequestHeaders(),
        });
        if (res.ok) {
          const data = await res.json();
          if (data.success && Array.isArray(data.crops)) {
            localStorage.setItem(this.getUserKey('crops'), JSON.stringify(data.crops));
            return data.crops;
          }
        }
      } catch (e) {
        console.warn('Backend crops sync failed, using local cache:', e);
      }
    }
    return this.getCrops();
  },

  saveCrop(crop: CropRecord): void {
    const crops = this.getCrops();
    const index = crops.findIndex((c) => c.id === crop.id);
    const updated = { ...crop, updatedAt: new Date().toISOString() };
    if (index >= 0) {
      crops[index] = updated;
    } else {
      crops.unshift(updated);
    }
    localStorage.setItem(this.getUserKey('crops'), JSON.stringify(crops));

    const token = authService.getToken();
    if (token) {
      fetch('/api/farmer/crops', {
        method: 'POST',
        headers: getRequestHeaders(),
        body: JSON.stringify(updated),
      }).catch((e) => console.warn('Background crop save failed:', e));
    }
  },

  async deleteCrop(id: string): Promise<boolean> {
    try {
      const crops = this.getCrops().filter((c) => c.id !== id);
      localStorage.setItem(this.getUserKey('crops'), JSON.stringify(crops));

      const token = authService.getToken();
      if (token) {
        await fetch(`/api/farmer/crops/${id}`, {
          method: 'DELETE',
          headers: getRequestHeaders(),
        });
      }
      return true;
    } catch (err) {
      console.error('Failed to delete crop:', err);
      return false;
    }
  },

  getObservations(): FarmObservation[] {
    try {
      const data = localStorage.getItem(this.getUserKey('observations'));
      if (data) return JSON.parse(data);
      return [];
    } catch {
      return [];
    }
  },

  async fetchObservations(): Promise<FarmObservation[]> {
    const token = authService.getToken();
    if (token) {
      try {
        const res = await fetch('/api/farmer/observations', {
          headers: getRequestHeaders(),
        });
        if (res.ok) {
          const data = await res.json();
          if (data.success && Array.isArray(data.observations)) {
            localStorage.setItem(this.getUserKey('observations'), JSON.stringify(data.observations));
            return data.observations;
          }
        }
      } catch (e) {
        console.warn('Backend observations sync failed, using local cache:', e);
      }
    }
    return this.getObservations();
  },

  saveObservation(observation: FarmObservation): void {
    const obs = this.getObservations();
    const index = obs.findIndex((o) => o.id === observation.id);
    if (index >= 0) {
      obs[index] = observation;
    } else {
      obs.unshift(observation);
    }
    localStorage.setItem(this.getUserKey('observations'), JSON.stringify(obs));

    const token = authService.getToken();
    if (token) {
      fetch('/api/farmer/observations', {
        method: 'POST',
        headers: getRequestHeaders(),
        body: JSON.stringify(observation),
      }).catch((e) => console.warn('Background observation save failed:', e));
    }
  },

  async deleteObservation(id: string): Promise<boolean> {
    try {
      const obs = this.getObservations().filter((o) => o.id !== id);
      localStorage.setItem(this.getUserKey('observations'), JSON.stringify(obs));

      const token = authService.getToken();
      if (token) {
        await fetch(`/api/farmer/observations/${id}`, {
          method: 'DELETE',
          headers: getRequestHeaders(),
        });
      }
      return true;
    } catch (err) {
      console.error('Failed to delete observation:', err);
      return false;
    }
  },

  getSoilScans(): SoilScanRecord[] {
    try {
      const data = localStorage.getItem(this.getUserKey('soil_scans'));
      if (data) return JSON.parse(data);
      return [];
    } catch {
      return [];
    }
  },

  async fetchSoilScans(): Promise<SoilScanRecord[]> {
    const token = authService.getToken();
    if (token) {
      try {
        const res = await fetch('/api/farmer/soil-scans', {
          headers: getRequestHeaders(),
        });
        if (res.ok) {
          const data = await res.json();
          if (data.success && Array.isArray(data.soilScans)) {
            localStorage.setItem(this.getUserKey('soil_scans'), JSON.stringify(data.soilScans));
            return data.soilScans;
          }
        }
      } catch (e) {
        console.warn('Backend soil scans sync failed, using local cache:', e);
      }
    }
    return this.getSoilScans();
  },

  saveSoilScan(scan: SoilScanRecord): boolean {
    try {
      const scans = this.getSoilScans();
      const existingIdx = scans.findIndex((s) => s.id === scan.id);
      if (existingIdx >= 0) {
        scans[existingIdx] = scan;
      } else {
        scans.unshift(scan);
      }
      localStorage.setItem(this.getUserKey('soil_scans'), JSON.stringify(scans));

      const token = authService.getToken();
      if (token) {
        fetch('/api/farmer/soil-scans', {
          method: 'POST',
          headers: getRequestHeaders(),
          body: JSON.stringify(scan),
        }).catch((e) => console.warn('Background soil scan save failed:', e));
      }

      return true;
    } catch (err) {
      console.error('Failed to save soil scan to storage:', err);
      try {
        const scans = this.getSoilScans();
        const fallbackScan = { ...scan };
        if (fallbackScan.soilPhotoUrl && fallbackScan.soilPhotoUrl.length > 100000) {
          fallbackScan.soilPhotoUrl = undefined;
        }
        const existingIdx = scans.findIndex((s) => s.id === scan.id);
        if (existingIdx >= 0) {
          scans[existingIdx] = fallbackScan;
        } else {
          scans.unshift(fallbackScan);
        }
        localStorage.setItem(this.getUserKey('soil_scans'), JSON.stringify(scans));
        return true;
      } catch (fallbackErr) {
        console.error('Fallback soil scan save failed:', fallbackErr);
        return false;
      }
    }
  },

  async deleteSoilScan(id: string): Promise<boolean> {
    try {
      const scans = this.getSoilScans().filter((s) => s.id !== id);
      localStorage.setItem(this.getUserKey('soil_scans'), JSON.stringify(scans));

      const token = authService.getToken();
      if (token) {
        await fetch(`/api/farmer/soil-scans/${id}`, {
          method: 'DELETE',
          headers: getRequestHeaders(),
        });
      }
      return true;
    } catch (err) {
      console.error('Failed to delete soil scan:', err);
      return false;
    }
  },

  getPlantScans(): PlantScanRecord[] {
    try {
      const data = localStorage.getItem(this.getUserKey('plant_scans'));
      if (data) return JSON.parse(data);
      return [];
    } catch {
      return [];
    }
  },

  async fetchPlantScans(): Promise<PlantScanRecord[]> {
    const token = authService.getToken();
    if (token) {
      try {
        const res = await fetch('/api/farmer/plant-scans', {
          headers: getRequestHeaders(),
        });
        if (res.ok) {
          const data = await res.json();
          if (data.success && Array.isArray(data.plantScans)) {
            localStorage.setItem(this.getUserKey('plant_scans'), JSON.stringify(data.plantScans));
            return data.plantScans;
          }
        }
      } catch (e) {
        console.warn('Backend plant scans sync failed, using local cache:', e);
      }
    }
    return this.getPlantScans();
  },

  savePlantScan(scan: PlantScanRecord): boolean {
    try {
      const scans = this.getPlantScans();
      const existingIdx = scans.findIndex((s) => s.id === scan.id);
      if (existingIdx >= 0) {
        scans[existingIdx] = scan;
      } else {
        scans.unshift(scan);
      }
      localStorage.setItem(this.getUserKey('plant_scans'), JSON.stringify(scans));

      const token = authService.getToken();
      if (token) {
        fetch('/api/farmer/plant-scans', {
          method: 'POST',
          headers: getRequestHeaders(),
          body: JSON.stringify(scan),
        }).catch((e) => console.warn('Background plant scan save failed:', e));
      }
      return true;
    } catch (err) {
      console.error('Failed to save plant scan to storage:', err);
      return false;
    }
  },

  async deletePlantScan(id: string): Promise<boolean> {
    try {
      const scans = this.getPlantScans().filter((s) => s.id !== id);
      localStorage.setItem(this.getUserKey('plant_scans'), JSON.stringify(scans));

      const token = authService.getToken();
      if (token) {
        await fetch(`/api/farmer/plant-scans/${id}`, {
          method: 'DELETE',
          headers: getRequestHeaders(),
        });
      }
      return true;
    } catch (err) {
      console.error('Failed to delete plant scan:', err);
      return false;
    }
  },

  getAdvisorMessages(): AdvisorMessage[] {
    try {
      const data = localStorage.getItem(this.getUserKey('advisor_messages'));
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  },

  async fetchAdvisorMessages(): Promise<AdvisorMessage[]> {
    const token = authService.getToken();
    if (token) {
      try {
        const res = await fetch('/api/farmer/advisor-history', {
          headers: getRequestHeaders(),
        });
        if (res.ok) {
          const data = await res.json();
          if (data.success && Array.isArray(data.messages)) {
            localStorage.setItem(this.getUserKey('advisor_messages'), JSON.stringify(data.messages));
            return data.messages;
          }
        }
      } catch (e) {
        console.warn('Backend advisor history sync failed, using local cache:', e);
      }
    }
    return this.getAdvisorMessages();
  },

  saveAdvisorMessages(messages: AdvisorMessage[]): void {
    localStorage.setItem(this.getUserKey('advisor_messages'), JSON.stringify(messages));
    const token = authService.getToken();
    if (token) {
      fetch('/api/farmer/advisor-history', {
        method: 'POST',
        headers: getRequestHeaders(),
        body: JSON.stringify({ messages }),
      }).catch((e) => console.warn('Background advisor history save failed:', e));
    }
  },

  clearAdvisorMessages(): void {
    localStorage.removeItem(STORAGE_KEYS.ADVISOR_MESSAGES);
    const token = authService.getToken();
    if (token) {
      fetch('/api/farmer/advisor-history', {
        method: 'DELETE',
        headers: getRequestHeaders(),
      }).catch((e) => console.warn('Background advisor history clear failed:', e));
    }
  },

  getCropInquiries(): CropDoctorInquiry[] {
    try {
      const data = localStorage.getItem(this.getUserKey('crop_inquiries'));
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  },

  saveCropInquiry(inquiry: CropDoctorInquiry): void {
    const inquiries = this.getCropInquiries();
    inquiries.unshift(inquiry);
    localStorage.setItem(this.getUserKey('crop_inquiries'), JSON.stringify(inquiries));
  },

  getMarketListings(): MarketListing[] {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.MARKET_LISTINGS);
      return data ? JSON.parse(data) : DEFAULT_MARKET_LISTINGS;
    } catch {
      return DEFAULT_MARKET_LISTINGS;
    }
  },

  async fetchMarketListings(): Promise<MarketListing[]> {
    try {
      const res = await fetch('/api/marketplace/listings');
      if (res.ok) {
        const json = await res.json();
        if (json.success && Array.isArray(json.listings)) {
          localStorage.setItem(STORAGE_KEYS.MARKET_LISTINGS, JSON.stringify(json.listings));
          return json.listings;
        }
      }
    } catch (e) {
      console.warn('API fetchMarketListings failed, using local storage cache:', e);
    }
    return this.getMarketListings();
  },

  async saveMarketListing(
    listing: Partial<MarketListing>,
    userRole: UserRole = 'farmer',
    userId?: string
  ): Promise<{ success: boolean; listing?: MarketListing; error?: string }> {
    const effectiveUserId = userId || authService.getUser()?.id || 'guest-farmer';
    try {
      const headers = getRequestHeaders(userRole, effectiveUserId);
      const res = await fetch('/api/marketplace/listings', {
        method: 'POST',
        headers,
        body: JSON.stringify(listing),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        const current = this.getMarketListings();
        current.unshift(data.listing);
        localStorage.setItem(STORAGE_KEYS.MARKET_LISTINGS, JSON.stringify(current));
        return { success: true, listing: data.listing };
      }
      return { success: false, error: data.error || 'Failed to create listing' };
    } catch {
      // Local fallback
      const fallbackListing: MarketListing = {
        id: `mkt-${Date.now()}`,
        title: listing.title || 'Produce',
        cropCategory: listing.cropCategory || 'Grains & Cereals',
        variety: listing.variety || 'Standard',
        quantity: listing.quantity || 1,
        unit: listing.unit || 'quintal',
        expectedPrice: listing.expectedPrice || 0,
        priceUnit: listing.priceUnit || 'per quintal',
        location: listing.location || 'Local Mandi',
        state: listing.state || 'Karnataka',
        sellerId: effectiveUserId,
        sellerName: listing.sellerName || 'Farmer',
        sellerType: listing.sellerType || 'Farmer',
        contactPhone: listing.contactPhone,
        grade: listing.grade || 'Grade A (Premium)',
        harvestAvailability: listing.harvestAvailability || 'Ready for Immediate Dispatch',
        isDemonstration: false,
        datePosted: new Date().toISOString().split('T')[0],
        description: listing.description || '',
        photoUrl: listing.photoUrl,
      };
      const current = this.getMarketListings();
      current.unshift(fallbackListing);
      localStorage.setItem(STORAGE_KEYS.MARKET_LISTINGS, JSON.stringify(current));
      return { success: true, listing: fallbackListing };
    }
  },

  async deleteMarketListing(
    id: string,
    _userRole?: string,
    _userId?: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const headers = getRequestHeaders();
      const res = await fetch(`/api/marketplace/listings/${id}`, {
        method: 'DELETE',
        headers,
      });
      const data = await res.json();
      if (res.ok && data.success) {
        const current = this.getMarketListings().filter((l) => l.id !== id);
        localStorage.setItem(STORAGE_KEYS.MARKET_LISTINGS, JSON.stringify(current));
        return { success: true };
      }
      return { success: false, error: data.error || 'Failed to delete listing' };
    } catch {
      const current = this.getMarketListings().filter((l) => l.id !== id);
      localStorage.setItem(STORAGE_KEYS.MARKET_LISTINGS, JSON.stringify(current));
      return { success: true };
    }
  },

  getEnquiries(): CropEnquiry[] {
    try {
      const data = localStorage.getItem(this.getUserKey('enquiries'));
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  },

  saveEnquiryLocally(enquiry: CropEnquiry): void {
    const list = this.getEnquiries();
    const existing = list.findIndex((e) => e.id === enquiry.id);
    if (existing >= 0) {
      list[existing] = enquiry;
    } else {
      list.unshift(enquiry);
    }
    localStorage.setItem(this.getUserKey('enquiries'), JSON.stringify(list));
  },

  async fetchEnquiries(userRole?: UserRole, userId?: string): Promise<CropEnquiry[]> {
    const token = authService.getToken();
    if (!token) return [];

    try {
      const headers = getRequestHeaders(userRole, userId);
      const res = await fetch('/api/marketplace/enquiries', {
        headers,
      });
      if (res.ok) {
        const data = await res.json();
        if (data.success && Array.isArray(data.enquiries)) {
          localStorage.setItem(this.getUserKey('enquiries'), JSON.stringify(data.enquiries));
          return data.enquiries;
        }
      }
    } catch (e) {
      console.warn('API fetchEnquiries failed, using local cache:', e);
    }
    return this.getEnquiries();
  },

  async sendBuyerEnquiry(
    enquiry: Partial<CropEnquiry>,
    buyerId: string
  ): Promise<{ success: boolean; enquiry?: CropEnquiry; error?: string }> {
    try {
      const headers = getRequestHeaders('buyer', buyerId);
      const res = await fetch('/api/marketplace/enquiries', {
        method: 'POST',
        headers,
        body: JSON.stringify(enquiry),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        this.saveEnquiryLocally(data.enquiry);
        return { success: true, enquiry: data.enquiry };
      }
      return { success: false, error: data.error || 'Failed to submit enquiry' };
    } catch {
      const fallbackEnquiry: CropEnquiry = {
        id: `enq-${Date.now()}`,
        listingId: enquiry.listingId || '',
        listingTitle: enquiry.listingTitle || 'Produce',
        farmerName: enquiry.farmerName || 'Farmer',
        sellerPhone: enquiry.sellerPhone,
        sellerId: enquiry.sellerId,
        buyerId,
        buyerName: enquiry.buyerName || 'Buyer',
        buyerPhone: enquiry.buyerPhone || '',
        buyerBusiness: enquiry.buyerBusiness,
        buyerLocation: enquiry.buyerLocation,
        requestedQuantity: enquiry.requestedQuantity || 1,
        unit: enquiry.unit || 'quintal',
        offeredPrice: enquiry.offeredPrice,
        priceUnit: enquiry.priceUnit || 'per quintal',
        message: enquiry.message || 'I am interested in procuring this crop.',
        createdAt: new Date().toISOString(),
        status: 'Pending Response',
      };
      this.saveEnquiryLocally(fallbackEnquiry);
      return { success: true, enquiry: fallbackEnquiry };
    }
  },

  async updateEnquiryStatus(
    enquiryId: string,
    status: CropEnquiry['status']
  ): Promise<boolean> {
    try {
      const res = await fetch(`/api/marketplace/enquiries/${enquiryId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });
      if (res.ok) {
        const enquiries = this.getEnquiries();
        const item = enquiries.find((e) => e.id === enquiryId);
        if (item) {
          item.status = status;
          localStorage.setItem(STORAGE_KEYS.ENQUIRIES, JSON.stringify(enquiries));
        }
        return true;
      }
    } catch (e) {
      console.warn('API updateEnquiryStatus failed, updating local state:', e);
    }
    const enquiries = this.getEnquiries();
    const item = enquiries.find((e) => e.id === enquiryId);
    if (item) {
      item.status = status;
      localStorage.setItem(STORAGE_KEYS.ENQUIRIES, JSON.stringify(enquiries));
      return true;
    }
    return false;
  },

  resetDemonstrationData(): void {
    localStorage.setItem(STORAGE_KEYS.PROFILE, JSON.stringify(DEFAULT_PROFILE));
    localStorage.setItem(STORAGE_KEYS.BUYER_PROFILE, JSON.stringify(DEFAULT_BUYER_PROFILE));
    localStorage.setItem(STORAGE_KEYS.CROPS, JSON.stringify(DEFAULT_CROPS));
    localStorage.setItem(STORAGE_KEYS.OBSERVATIONS, JSON.stringify(DEFAULT_OBSERVATIONS));
    localStorage.setItem(STORAGE_KEYS.SOIL_SCANS, JSON.stringify(DEFAULT_SOIL_SCANS));
    localStorage.setItem(STORAGE_KEYS.MARKET_LISTINGS, JSON.stringify(DEFAULT_MARKET_LISTINGS));
    localStorage.setItem(STORAGE_KEYS.ENQUIRIES, JSON.stringify([]));
    localStorage.setItem(STORAGE_KEYS.CROP_INQUIRIES, JSON.stringify([]));
    localStorage.setItem(STORAGE_KEYS.INITIALIZED, 'true');
  },

  clearAllData(): void {
    localStorage.removeItem(STORAGE_KEYS.USER_ROLE);
    localStorage.removeItem(STORAGE_KEYS.HAS_ONBOARDED);
    localStorage.removeItem(STORAGE_KEYS.PROFILE);
    localStorage.removeItem(STORAGE_KEYS.BUYER_PROFILE);
    localStorage.removeItem(STORAGE_KEYS.CROPS);
    localStorage.removeItem(STORAGE_KEYS.OBSERVATIONS);
    localStorage.removeItem(STORAGE_KEYS.SOIL_SCANS);
    localStorage.removeItem(STORAGE_KEYS.CROP_INQUIRIES);
    localStorage.removeItem(STORAGE_KEYS.MARKET_LISTINGS);
    localStorage.removeItem(STORAGE_KEYS.ENQUIRIES);
    localStorage.removeItem(STORAGE_KEYS.INITIALIZED);
  },

  exportBackup(): string {
    const backup = {
      version: '1.1',
      exportedAt: new Date().toISOString(),
      userRole: this.getUserRole(),
      profile: this.getProfile(),
      buyerProfile: this.getBuyerProfile(),
      crops: this.getCrops(),
      observations: this.getObservations(),
      soilScans: this.getSoilScans(),
      cropInquiries: this.getCropInquiries(),
      marketListings: this.getMarketListings(),
      enquiries: this.getEnquiries(),
    };
    return JSON.stringify(backup, null, 2);
  },

  importBackup(jsonString: string): boolean {
    try {
      const parsed = JSON.parse(jsonString);
      if (parsed.userRole) localStorage.setItem(STORAGE_KEYS.USER_ROLE, parsed.userRole);
      if (parsed.profile) localStorage.setItem(STORAGE_KEYS.PROFILE, JSON.stringify(parsed.profile));
      if (parsed.buyerProfile) localStorage.setItem(STORAGE_KEYS.BUYER_PROFILE, JSON.stringify(parsed.buyerProfile));
      if (parsed.crops) localStorage.setItem(STORAGE_KEYS.CROPS, JSON.stringify(parsed.crops));
      if (parsed.observations) localStorage.setItem(STORAGE_KEYS.OBSERVATIONS, JSON.stringify(parsed.observations));
      if (parsed.soilScans) localStorage.setItem(STORAGE_KEYS.SOIL_SCANS, JSON.stringify(parsed.soilScans));
      if (parsed.cropInquiries) localStorage.setItem(STORAGE_KEYS.CROP_INQUIRIES, JSON.stringify(parsed.cropInquiries));
      if (parsed.marketListings) localStorage.setItem(STORAGE_KEYS.MARKET_LISTINGS, JSON.stringify(parsed.marketListings));
      if (parsed.enquiries) localStorage.setItem(STORAGE_KEYS.ENQUIRIES, JSON.stringify(parsed.enquiries));
      localStorage.setItem(STORAGE_KEYS.INITIALIZED, 'true');
      return true;
    } catch (e) {
      console.error('Import failed', e);
      return false;
    }
  },

  // ==================== CROP TIMELINE PERSISTENCE ====================
  getAllCropTimelines(): CropTimelineProfile[] {
    try {
      const data = localStorage.getItem(this.getUserKey('crop_timelines'));
      if (data) return JSON.parse(data);
      return [];
    } catch {
      return [];
    }
  },

  getCropTimeline(cropNameOrId: string): CropTimelineProfile | null {
    try {
      const all = this.getAllCropTimelines();
      const cleanTarget = cropNameOrId.trim().toLowerCase();
      const found = all.find(
        (t) =>
          t.id === cropNameOrId ||
          t.cropId === cropNameOrId ||
          t.cropName.toLowerCase() === cleanTarget ||
          cleanTarget.includes(t.cropName.toLowerCase())
      );
      return found || null;
    } catch {
      return null;
    }
  },

  saveCropTimeline(timeline: CropTimelineProfile): void {
    try {
      const all = this.getAllCropTimelines();
      const index = all.findIndex((t) => t.id === timeline.id || t.cropName.toLowerCase() === timeline.cropName.toLowerCase());
      const updated = { ...timeline, lastUpdated: new Date().toISOString() };
      if (index >= 0) {
        all[index] = updated;
      } else {
        all.unshift(updated);
      }
      localStorage.setItem(this.getUserKey('crop_timelines'), JSON.stringify(all));

      // Also sync to backend if user is authenticated
      const token = authService.getToken();
      if (token) {
        fetch('/api/crop-timeline', {
          method: 'POST',
          headers: getRequestHeaders(),
          body: JSON.stringify(updated),
        }).catch((err) => console.warn('Background timeline sync failed:', err));
      }
    } catch (err) {
      console.error('Failed to save crop timeline:', err);
    }
  },

  toggleTimelineActivity(timelineId: string, activityId: string): CropTimelineProfile | null {
    try {
      const all = this.getAllCropTimelines();
      const timeline = all.find((t) => t.id === timelineId);
      if (!timeline) return null;

      let found = false;
      timeline.stages.forEach((st) => {
        st.activities.forEach((act) => {
          if (act.id === activityId) {
            act.completed = !act.completed;
            act.completedAt = act.completed ? new Date().toISOString() : undefined;
            found = true;
          }
        });
      });

      if (!found) return null;

      this.saveCropTimeline(timeline);
      return timeline;
    } catch (err) {
      console.error('Failed to toggle timeline activity:', err);
      return null;
    }
  },

  updateTimelineStage(timelineId: string, newStageIndex: number): CropTimelineProfile | null {
    try {
      const all = this.getAllCropTimelines();
      const timeline = all.find((t) => t.id === timelineId);
      if (!timeline || newStageIndex < 0 || newStageIndex >= timeline.stages.length) return null;

      timeline.currentStageIndex = newStageIndex;
      timeline.currentStageName = timeline.stages[newStageIndex].stageName;

      // Update stage statuses: completed for past, current for active, upcoming for future
      timeline.stages.forEach((st, idx) => {
        if (idx < newStageIndex) {
          st.status = 'completed';
        } else if (idx === newStageIndex) {
          st.status = 'current';
        } else {
          st.status = 'upcoming';
        }
      });

      // Update next recommended action
      const currentStage = timeline.stages[newStageIndex];
      const pendingActivity = currentStage.activities.find((a) => !a.completed) || currentStage.activities[0];
      if (pendingActivity) {
        timeline.nextRecommendedAction = {
          title: pendingActivity.title,
          advice: pendingActivity.importanceReason,
          reasoning: `Recommended for ${timeline.cropName} during ${currentStage.stageName}.`,
          category: pendingActivity.category,
          urgency: 'action_required',
          timing: pendingActivity.timingDescription,
          safetyWarning: pendingActivity.safetyNote || 'Check actual field conditions and product label instructions.',
        };
      }

      this.saveCropTimeline(timeline);
      return timeline;
    } catch (err) {
      console.error('Failed to update timeline stage:', err);
      return null;
    }
  },

  // ==================== TIMELINE REMINDERS ====================
  getTimelineReminders(): CropTimelineReminder[] {
    try {
      const data = localStorage.getItem(this.getUserKey('timeline_reminders'));
      if (data) return JSON.parse(data);
      return [];
    } catch {
      return [];
    }
  },

  saveTimelineReminder(reminder: CropTimelineReminder): void {
    try {
      const all = this.getTimelineReminders();
      const exists = all.some((r) => r.id === reminder.id || (r.timelineId === reminder.timelineId && r.activityId === reminder.activityId));
      if (!exists) {
        all.unshift(reminder);
        localStorage.setItem(this.getUserKey('timeline_reminders'), JSON.stringify(all));
      }
    } catch (err) {
      console.error('Failed to save timeline reminder:', err);
    }
  },

  deleteTimelineReminder(reminderId: string): void {
    try {
      const all = this.getTimelineReminders().filter((r) => r.id !== reminderId);
      localStorage.setItem(this.getUserKey('timeline_reminders'), JSON.stringify(all));
    } catch (err) {
      console.error('Failed to delete timeline reminder:', err);
    }
  },
};

export type UserRole = 'farmer' | 'buyer';

export type NavigationTab = 
  | 'home' 
  | 'my-farm' 
  | 'soil-scan' 
  | 'marketplace' 
  | 'profile-settings'
  | 'browse-crops'
  | 'my-enquiries';

export type SupportedLanguage = 
  | 'en' // English
  | 'hi' // Hindi (हिंदी)
  | 'pa' // Punjabi (ਪੰਜਾਬੀ)
  | 'mr' // Marathi (मराठी)
  | 'te' // Telugu (తెలుగు)
  | 'ta' // Tamil (தமிழ்)
  | 'kn' // Kannada (ಕನ್ನಡ)
  | 'gu' // Gujarati (ગુજરાતી)
  | 'bn'; // Bengali (বাংলা)

export type TextSize = 'standard' | 'large' | 'xlarge';
export type VoiceStatus = 'idle' | 'listening' | 'processing' | 'success' | 'error';

export type AreaUnit = 'acres' | 'hectares' | 'bigha' | 'guntha';
export type WeightUnit = 'quintal' | 'kg' | 'ton';
export type TemperatureUnit = 'celsius' | 'fahrenheit';

export type GrowthStage = 
  | 'Sowing / Germination'
  | 'Tillering / Vegetative'
  | 'Flowering / Booting'
  | 'Grain / Fruit Formation'
  | 'Ripening / Maturity'
  | 'Harvest Ready';

export type SoilType = 
  | 'Alluvial Soil'
  | 'Black Soil (Regur)'
  | 'Red and Yellow Soil'
  | 'Laterite Soil'
  | 'Sandy Loam'
  | 'Clay Loam'
  | 'Mountain / Forest Soil';

export interface CropRecord {
  id: string;
  name: string;
  variety: string;
  fieldName: string;
  area: number;
  areaUnit: AreaUnit;
  sowingDate: string;
  currentStage: GrowthStage;
  estimatedHarvestDate: string;
  soilType: SoilType;
  notes: string;
  healthStatus: 'healthy' | 'attention' | 'critical';
  updatedAt: string;
}

export interface FarmObservation {
  id: string;
  date: string;
  cropName?: string;
  fieldName: string;
  category: 'Irrigation' | 'Weeding' | 'Pest & Disease' | 'Fertilizer' | 'Weather' | 'General';
  notes: string;
}

export interface SoilLabResults {
  pH?: number;
  nitrogenKgHa?: number; // Available N in kg/ha
  phosphorusKgHa?: number; // Available P in kg/ha
  potassiumKgHa?: number; // Available K in kg/ha
  organicCarbonPercent?: number; // OC %
  electricalConductivity?: number; // EC dS/m
}

export interface SoilAiAnalysis {
  isSuitable: boolean;
  unsuitableReason?: string | null;
  visibleObservations: {
    apparentColor: string;
    visibleTextureParticles: string;
    coarseFragmentsStones: string;
    visibleOrganicResidue: string;
    surfaceMoistureAppearance: string;
  };
  possibleCharacteristics: {
    characteristic: string;
    explanation: string;
    uncertaintyNote: string;
  }[];
  limitationsAndConfidence: {
    confidenceLevel: string;
    limitations: string[];
  };
  recommendedNextSteps: string[];
  soilTestNeededReminder: string;
  analyzedAt: string;
  modelUsed?: string;
}

export interface PlantAiAnalysis {
  isSuitable: boolean;
  unsuitableReason?: string | null;
  cropTypeIdentified?: string;
  confidenceNote: string;
  visibleObservations: {
    plantPartsVisible: string[];
    foliarCondition: string;
    pestOrPathogenSigns: string;
    overallVigor: string;
  };
  possibleExplanations: {
    cause: string;
    likelihood: 'Possible' | 'Uncertain' | 'Requires In-Field Confirmation';
    explanation: string;
    uncertaintyNote: string;
  }[];
  followUpQuestions: string[];
  practicalNextSteps: string[];
  preventionGuidance: string[];
  scientificCaution: string;
  analyzedAt: string;
  modelUsed?: string;
}

export interface PlantScanRecord {
  id: string;
  date: string;
  fieldName: string;
  cropName?: string;
  growthStage?: GrowthStage;
  photoUrl?: string;
  observations: string;
  aiAnalysis?: PlantAiAnalysis;
  isAiAnalyzed?: boolean;
  farmContext?: {
    fieldName?: string;
    cropName?: string;
    villageOrDistrict?: string;
    state?: string;
  };
}

export interface AdvisorMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
  sharedScanContext?: {
    type: 'plant' | 'soil';
    summary: string;
    scanRecordId?: string;
    photoUrl?: string;
  };
}

export interface SoilScanRecord {
  id: string;
  date: string;
  fieldName: string;
  soilPhotoUrl?: string;
  knownSoilType?: SoilType;
  soilMoisture?: 'Dry' | 'Moist / Optimal' | 'Wet / Saturated';
  fieldDrainage?: 'Well-Drained' | 'Moderate' | 'Poor / Waterlogged';
  observations: string;
  aiAnalysis?: SoilAiAnalysis;
  isAiAnalyzed?: boolean;
  farmContext?: {
    villageOrDistrict?: string;
    state?: string;
    primarySoilType?: string;
  };
  labResults?: SoilLabResults;
  isLabVerified: boolean;
  notes?: string;
}

export interface CropDoctorInquiry {
  id: string;
  date: string;
  cropName: string;
  growthStage: GrowthStage;
  symptoms: string[];
  affectedParts: ('Leaves' | 'Stem' | 'Roots' | 'Flowers' | 'Fruit / Grain')[];
  description: string;
  photoUrl?: string;
  soilMoistureContext?: string;
  farmerNotes?: string;
}

export interface FertilizerPlanQuery {
  id: string;
  date: string;
  cropName: string;
  growthStage: GrowthStage;
  targetYieldQuintals?: number;
  soilTestReportAvailable: boolean;
  organicManureUsed: boolean;
  soilType?: SoilType;
  notes?: string;
}

export interface MarketListing {
  id: string;
  title: string;
  cropCategory: 'Grains & Cereals' | 'Pulses' | 'Vegetables' | 'Fruits' | 'Oilseeds' | 'Spices' | 'Seeds';
  variety: string;
  quantity: number;
  unit: WeightUnit;
  expectedPrice: number; // in INR
  priceUnit: string; // e.g., 'per quintal' or 'per kg'
  location: string;
  state: string;
  sellerId?: string; // ID of the farmer who created the listing
  sellerName: string;
  sellerType: 'Farmer' | 'FPO (Farmer Producer Org)' | 'Buyer / Trader';
  contactPhone?: string;
  grade: 'Grade A (Premium)' | 'Grade B (Standard)' | 'Organic Certified';
  harvestAvailability?: string; // e.g., 'Ready for Immediate Dispatch', 'Harvest in 7 Days'
  isDemonstration: boolean;
  datePosted: string;
  description: string;
  photoUrl?: string;
  cropHealthAssessment?: {
    score: number;
    grade: 'A+' | 'A' | 'B' | 'C' | 'D';
    evaluatedAt: string;
    notes?: string;
  } | null;
}

export interface BuyerProfile {
  id: string;
  userId?: string;
  name: string;
  businessName: string;
  businessType: 'Wholesale Trader' | 'Retailer' | 'Food Processor / Miller' | 'Exporter' | 'Commission Agent / Mandi Trader';
  location: string;
  state: string;
  contactNumber: string;
  email?: string;
  preferredLanguage: SupportedLanguage;
  preferredCategories: string[];
}

export interface CropEnquiry {
  id: string;
  listingId: string;
  listingTitle: string;
  farmerName: string;
  sellerPhone?: string;
  sellerId?: string;
  buyerId: string;
  buyerName: string;
  buyerPhone: string;
  buyerBusiness?: string;
  buyerLocation?: string;
  requestedQuantity: number;
  unit: WeightUnit;
  offeredPrice?: number;
  priceUnit?: string;
  message: string;
  createdAt: string;
  status: 'Pending Response' | 'Accepted' | 'Declined' | 'Contacted';
}

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  roles?: UserRole[];
  phone?: string;
  createdAt: string;
  preferredLanguage: SupportedLanguage;
}

export interface AuthSession {
  token: string;
  user: AuthUser;
  profile: FarmerProfile | BuyerProfile;
}

export interface FarmerProfile {
  userId?: string;
  email?: string;
  name: string;
  farmName: string;
  villageOrDistrict: string;
  state: string;
  contactNumber: string;
  preferredLanguage: SupportedLanguage;
  preferredAreaUnit: AreaUnit;
  preferredWeightUnit: WeightUnit;
  preferredTempUnit: TemperatureUnit;
  totalFarmArea: number;
  primarySoilType: SoilType;
}

export interface CurrentWeatherReport {
  time: string;
  temperature: number;
  humidity: number;
  dewPoint: number;
  windSpeed: number;
  precipitationProbability: number;
  weatherCode: number;
  weatherDescription: string;
  soilTemperature0cm?: number;
  soilTemperature6cm?: number;
  soilMoisture0to1cm?: number; // m³/m³
  soilMoisture1to3cm?: number; // m³/m³
}

export interface HourlyForecastPoint {
  time: string;
  hourLabel: string;
  temperature: number;
  humidity: number;
  windSpeed: number;
  precipitationProbability: number;
  weatherCode: number;
}

export interface WeatherDataState {
  current: CurrentWeatherReport;
  hourly: HourlyForecastPoint[];
  lastUpdatedIST: string; // Preserved for backwards compatibility
  dataFetchTime: string; // Timestamp when the application fetched the data from Open-Meteo
  weatherObservationTime: string; // Timestamp when Open-Meteo recorded/modeled the weather values
  timezone: string; // e.g., 'Asia/Kolkata', 'Asia/Tokyo'
  timezoneAbbreviation: string; // e.g., 'GMT+5:30', 'GMT+9'
  utcOffsetSeconds?: number;
  dataSource: string; // e.g., 'Open-Meteo Weather API (open-meteo.com)'
  latitude: number;
  longitude: number;
  locationName: string;
  city?: string;
  region?: string;
  country?: string;
  isStale?: boolean;
}

export interface AdvisoryRecommendation {
  id: string;
  title: string;
  category: 'irrigation' | 'spraying' | 'growth_stage' | 'field_work' | 'crop_care';
  urgency: 'action_required' | 'favorable' | 'caution' | 'monitoring';
  advice: string;
  reasoning: string;
  caution: string;
}

export interface FarmingAdvisoryReport {
  overallAssessment: string;
  sprayingDisclaimer: string;
  spokenSummary: string;
  recommendations: AdvisoryRecommendation[];
  cropName?: string;
  growthStage?: string;
  location?: string;
  generatedAt: string;
  modelUsed?: string;
}

// ==================== CROP TIMELINE INTERFACES ====================
export type FarmingMethod = 
  | 'Drip Irrigated'
  | 'Rainfed'
  | 'Canal / Flood Irrigated'
  | 'Sprinkler Irrigated'
  | 'Organic / Natural Farming'
  | 'Integrated Pest Management (IPM)';

export type TimelineActivityCategory = 
  | 'irrigation'
  | 'nutrient'
  | 'weed'
  | 'pest_disease'
  | 'field_inspection'
  | 'harvest';

export interface CropTimelineActivity {
  id: string;
  title: string;
  category: TimelineActivityCategory;
  timingDescription: string;
  importanceReason: string;
  weatherAdjustment?: string;
  completed: boolean;
  completedAt?: string;
  safetyNote?: string;
}

export interface CropTimelineStage {
  id: string;
  stageName: string;
  stageOrder: number;
  status: 'completed' | 'current' | 'upcoming';
  startDayOffset?: number; // Days after sowing/transplanting (min)
  endDayOffset?: number;   // Days after sowing/transplanting (max)
  estimatedStartDate?: string; // Formatted date string (e.g. "2026-11-15")
  estimatedEndDate?: string;   // Formatted date string (e.g. "2026-12-05")
  isDateEstimated: boolean;    // true when derived from models vs confirmed
  description: string;
  keyFocus: string;
  activities: CropTimelineActivity[];
}

export interface NextRecommendedAction {
  title: string;
  advice: string;
  reasoning: string;
  category: TimelineActivityCategory | 'spraying' | 'growth_stage';
  urgency: 'action_required' | 'favorable' | 'caution' | 'monitoring';
  timing: string;
  weatherContext?: string;
  safetyWarning?: string;
}

export interface CropTimelineProfile {
  id: string;
  cropId?: string; // Optional link to CropRecord
  cropName: string;
  variety?: string;
  sowingDate?: string; // YYYY-MM-DD
  growingRegion?: string;
  farmingMethod: FarmingMethod;
  currentStageIndex: number;
  currentStageName: string;
  totalDurationDays?: number; // Total expected crop cycle days
  daysAfterSowing?: number;
  progressPercentage?: number; // Only present when reliably calculable, otherwise undefined
  stages: CropTimelineStage[];
  nextRecommendedAction: NextRecommendedAction;
  spokenSummary: string;
  lastUpdated: string;
  dataSource: string; // e.g. "ICAR / State Agricultural Universities Package of Practices"
  aiEnhanced?: boolean;
}

export interface CropTimelineReminder {
  id: string;
  timelineId: string;
  cropName: string;
  activityId: string;
  activityTitle: string;
  stageName: string;
  scheduledDate: string;
  notified: boolean;
  createdAt: string;
}

export interface CropTimelineSetupInput {
  cropName: string;
  variety?: string;
  sowingDate?: string;
  growingRegion?: string;
  farmingMethod?: FarmingMethod;
  manualStageIndex?: number;
}


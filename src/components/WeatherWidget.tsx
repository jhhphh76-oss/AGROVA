import React, { useState, useEffect, useRef } from 'react';
import { 
  CloudSun, 
  CloudRain, 
  Wind, 
  Droplets, 
  AlertCircle, 
  RefreshCw, 
  Thermometer, 
  ShieldAlert, 
  Layers, 
  CloudLightning,
  CloudFog,
  Sun,
  Cloud,
  CheckCircle2,
  ExternalLink,
  MapPin,
  Search,
  Navigation,
  X,
  Clock,
  Compass,
  Sprout,
  Sparkles,
  AlertTriangle,
  HelpCircle,
  Mic,
  Info
} from 'lucide-react';
import { 
  SupportedLanguage, 
  WeatherDataState, 
  CropRecord, 
  GrowthStage, 
  FarmingAdvisoryReport, 
  AdvisoryRecommendation 
} from '../types';
import { TRANSLATIONS } from '../constants/translations';
import { 
  weatherService, 
  POPULAR_KARNATAKA_CITIES, 
  GeocodedLocation 
} from '../services/weatherService';
import { advisorService } from '../services/advisorService';
import { VoiceSpeakerButton } from './VoiceSpeakerButton';
import { CropTimelineSection } from './CropTimelineSection';

export const SELECTED_CITY_STORAGE_KEY = 'agrova_selected_weather_city';

const COMMON_CROPS = [
  'Wheat',
  'Paddy / Rice',
  'Cotton',
  'Red Onion',
  'Tomato',
  'Chilli',
  'Mustard / Sarson',
  'Soybean',
  'Bengal Gram (Chana)',
  'Sugarcane',
  'Maize / Corn',
  'Groundnut / Peanut',
  'General / All Crops'
];

const GROWTH_STAGES: GrowthStage[] = [
  'Sowing / Germination',
  'Tillering / Vegetative',
  'Flowering / Booting',
  'Grain / Fruit Formation',
  'Ripening / Maturity',
  'Harvest Ready'
];

interface WeatherWidgetProps {
  locationName?: string;
  language?: SupportedLanguage;
  crops?: CropRecord[];
  onLocationChange?: (newCity: string) => void;
  onOpenVoiceAssistant?: () => void;
}

export const WeatherWidget: React.FC<WeatherWidgetProps> = ({
  locationName,
  language = 'en',
  crops = [],
  onLocationChange,
  onOpenVoiceAssistant,
}) => {
  const t = TRANSLATIONS[language]?.home || TRANSLATIONS.en.home;

  // Selected city state persisted in localStorage so it stays consistent across refreshes
  const [selectedCity, setSelectedCity] = useState<string>(() => {
    if (typeof localStorage !== 'undefined') {
      const saved = localStorage.getItem(SELECTED_CITY_STORAGE_KEY);
      if (saved && saved.trim()) return saved.trim();
    }
    if (locationName && locationName.trim()) {
      return locationName.split(',')[0].trim();
    }
    return 'Vijayapura';
  });

  const [isCustomSearchOpen, setIsCustomSearchOpen] = useState<boolean>(false);
  const [customSearchInput, setCustomSearchInput] = useState<string>('');
  const [weatherData, setWeatherData] = useState<WeatherDataState | null>(null);
  const [resolvedLocation, setResolvedLocation] = useState<GeocodedLocation | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'timeline' | 'hourly' | 'soilModel'>('overview');

  // Geolocation detection & permission states
  const [isLocating, setIsLocating] = useState<boolean>(false);
  const [locationPermissionError, setLocationPermissionError] = useState<string | null>(null);

  // Crop & Growth Stage context for Farming Advisory
  const [selectedCrop, setSelectedCrop] = useState<string>(() => {
    if (crops.length > 0) return crops[0].name;
    return 'Wheat';
  });

  const [selectedGrowthStage, setSelectedGrowthStage] = useState<GrowthStage | string>(() => {
    if (crops.length > 0 && crops[0].currentStage) return crops[0].currentStage;
    return 'Tillering / Vegetative';
  });

  // Farming Advisory State
  const [advisoryReport, setAdvisoryReport] = useState<FarmingAdvisoryReport | null>(null);
  const [advisoryLoading, setAdvisoryLoading] = useState<boolean>(false);
  const [advisoryError, setAdvisoryError] = useState<string | null>(null);
  const [advisoryWarning, setAdvisoryWarning] = useState<string | null>(null);

  // Track active requests to prevent race conditions & stale responses
  const requestSeqRef = useRef<number>(0);
  const abortControllerRef = useRef<AbortController | null>(null);

  // Sync default crop when crops prop updates
  useEffect(() => {
    if (crops.length > 0 && !crops.some(c => c.name === selectedCrop) && selectedCrop === 'Wheat') {
      setSelectedCrop(crops[0].name);
      if (crops[0].currentStage) {
        setSelectedGrowthStage(crops[0].currentStage);
      }
    }
  }, [crops]);

  // Sync with prop only if no explicit city was previously saved by user
  useEffect(() => {
    if (locationName) {
      const cleanProp = locationName.split(',')[0].trim();
      const saved = typeof localStorage !== 'undefined' ? localStorage.getItem(SELECTED_CITY_STORAGE_KEY) : null;
      if (!saved && cleanProp && cleanProp !== selectedCity) {
        setSelectedCity(cleanProp);
      }
    }
  }, [locationName]);

  const loadWeatherForCity = async (cityToFetch: string) => {
    const currentSeq = ++requestSeqRef.current;

    // Abort previous in-flight request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    const controller = new AbortController();
    abortControllerRef.current = controller;

    setLoading(true);
    setError(null);
    setLocationPermissionError(null);
    setWeatherData(null);

    try {
      // 1. Resolve city to latitude, longitude, and geographic region
      const geo = await weatherService.geocodeCity(cityToFetch);
      if (currentSeq !== requestSeqRef.current) return;
      setResolvedLocation(geo);

      // 2. Fetch live weather & forecast from Open-Meteo for exact coordinates
      const data = await weatherService.fetchLiveWeather(
        geo.latitude,
        geo.longitude,
        geo.locationName,
        controller.signal,
        { city: geo.city, region: geo.region, country: geo.country }
      );
      if (currentSeq !== requestSeqRef.current) return;

      setWeatherData(data);
      setError(null);
    } catch (err: any) {
      if (err.name === 'AbortError' || currentSeq !== requestSeqRef.current) {
        return;
      }
      const errMsg = err.message || `Failed to fetch weather for "${cityToFetch}".`;
      setError(errMsg);
      setWeatherData(null);
    } finally {
      if (currentSeq === requestSeqRef.current) {
        setLoading(false);
      }
    }
  };

  // Trigger weather refresh whenever selectedCity changes
  useEffect(() => {
    if (selectedCity) {
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem(SELECTED_CITY_STORAGE_KEY, selectedCity);
      }
      loadWeatherForCity(selectedCity);
    }
  }, [selectedCity]);

  // Generate / Fetch Farming Advisory whenever weatherData, selectedCrop, growthStage, or language changes
  useEffect(() => {
    if (!weatherData?.current) {
      setAdvisoryReport(null);
      return;
    }

    let isMounted = true;
    const loadAdvisory = async () => {
      setAdvisoryLoading(true);
      setAdvisoryError(null);
      setAdvisoryWarning(null);

      try {
        const result = await advisorService.fetchFarmingAdvisory({
          weather: weatherData.current,
          cropName: selectedCrop,
          growthStage: selectedGrowthStage,
          location: weatherData.locationName || selectedCity,
          language,
        });

        if (!isMounted) return;

        if (result.success && result.advisory) {
          setAdvisoryReport(result.advisory);
          if (result.warning) {
            setAdvisoryWarning(result.warning);
          }
        } else {
          setAdvisoryError(result.error || 'Unable to generate advisory at this moment.');
        }
      } catch (err: any) {
        if (!isMounted) return;
        setAdvisoryError(err.message || 'Failed to connect to advisory service.');
      } finally {
        if (isMounted) {
          setAdvisoryLoading(false);
        }
      }
    };

    loadAdvisory();

    return () => {
      isMounted = false;
    };
  }, [weatherData, selectedCrop, selectedGrowthStage, language]);

  // Request browser GPS location
  const handleUseCurrentLocation = () => {
    if (typeof navigator === 'undefined' || !navigator.geolocation) {
      setLocationPermissionError('Geolocation is not supported by your browser.');
      return;
    }

    setIsLocating(true);
    setLocationPermissionError(null);

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        setIsLocating(false);
        const { latitude, longitude } = pos.coords;
        try {
          setLoading(true);
          const geo = await weatherService.reverseGeocode(latitude, longitude);
          setSelectedCity(geo.city);
          setResolvedLocation(geo);
          if (typeof localStorage !== 'undefined') {
            localStorage.setItem(SELECTED_CITY_STORAGE_KEY, geo.city);
          }
          if (onLocationChange) {
            onLocationChange(geo.city);
          }
          await loadWeatherForCity(geo.city);
        } catch (revErr: any) {
          setError(revErr.message || 'Failed to resolve current location coordinates.');
          setLoading(false);
        }
      },
      (geoErr) => {
        setIsLocating(false);
        switch (geoErr.code) {
          case geoErr.PERMISSION_DENIED:
            setLocationPermissionError(
              'Location permission was denied. Please allow location access in your browser or select your city from the list.'
            );
            break;
          case geoErr.POSITION_UNAVAILABLE:
            setLocationPermissionError(
              'Location information is unavailable from your device. Please select your city from the list.'
            );
            break;
          case geoErr.TIMEOUT:
            setLocationPermissionError(
              'Location request timed out. Please try again or select your city from the list.'
            );
            break;
          default:
            setLocationPermissionError('An unknown error occurred while requesting device location.');
            break;
        }
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 60000,
      }
    );
  };

  const handleCitySelectChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value;
    if (val === '__custom__') {
      setIsCustomSearchOpen(true);
      return;
    }
    setIsCustomSearchOpen(false);
    setSelectedCity(val);
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(SELECTED_CITY_STORAGE_KEY, val);
    }
    if (onLocationChange) {
      onLocationChange(val);
    }
  };

  const handleCustomSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const clean = customSearchInput.trim();
    if (!clean) return;

    setSelectedCity(clean);
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(SELECTED_CITY_STORAGE_KEY, clean);
    }
    if (onLocationChange) {
      onLocationChange(clean);
    }
    setIsCustomSearchOpen(false);
    setCustomSearchInput('');
  };

  const getWeatherIcon = (code: number, sizeClass = 'w-8 h-8') => {
    if (code === 0 || code === 1) {
      return <Sun className={`${sizeClass} text-amber-400 drop-shadow-xs`} />;
    }
    if (code === 2 || code === 3) {
      return <CloudSun className={`${sizeClass} text-amber-300 drop-shadow-xs`} />;
    }
    if (code === 45 || code === 48) {
      return <CloudFog className={`${sizeClass} text-slate-300 drop-shadow-xs`} />;
    }
    if (code >= 51 && code <= 67) {
      return <CloudRain className={`${sizeClass} text-sky-300 drop-shadow-xs`} />;
    }
    if (code >= 80 && code <= 82) {
      return <CloudRain className={`${sizeClass} text-blue-300 drop-shadow-xs`} />;
    }
    if (code >= 95) {
      return <CloudLightning className={`${sizeClass} text-yellow-300 drop-shadow-xs`} />;
    }
    return <Cloud className={`${sizeClass} text-slate-200 drop-shadow-xs`} />;
  };

  const isPredefinedCity = POPULAR_KARNATAKA_CITIES.some(
    (c) => c.name.toLowerCase() === selectedCity.toLowerCase()
  );

  const displayLocation = weatherData?.locationName || resolvedLocation?.locationName || selectedCity;
  const currentLat = weatherData?.latitude ?? resolvedLocation?.latitude;
  const currentLon = weatherData?.longitude ?? resolvedLocation?.longitude;

  const displayCoordinates = currentLat !== undefined && currentLon !== undefined
    ? `${Math.abs(currentLat).toFixed(2)}°${currentLat >= 0 ? 'N' : 'S'}, ${Math.abs(currentLon).toFixed(2)}°${currentLon >= 0 ? 'E' : 'W'}`
    : 'Resolving coordinates...';

  // Wind safety evaluation
  const getWindSafetyTier = (windSpeed: number) => {
    if (windSpeed < 10) return { label: 'Low Drift Risk', color: 'text-emerald-300' };
    if (windSpeed <= 15) return { label: 'Moderate Wind', color: 'text-amber-300' };
    return { label: 'High Drift Risk', color: 'text-rose-300' };
  };

  return (
    <div className="bg-white rounded-3xl border border-[#dce8d5] shadow-xs overflow-hidden transition-all">
      {/* Top Header Bar with City Selector & GPS */}
      <div className="px-3.5 sm:px-4 py-3 bg-[#f5f9f3] border-b border-[#e2ebd9] flex flex-wrap items-center justify-between gap-2.5">
        <div className="flex items-center gap-2 min-w-0 flex-1">
          <CloudSun className="w-5 h-5 text-emerald-700 shrink-0" aria-hidden="true" />
          <div className="min-w-0">
            <h3 className="text-xs sm:text-sm font-bold text-[#144225] font-display truncate">
              Live Weather & Farming Advisory
            </h3>
            <span className="text-[10px] text-slate-500 block truncate font-medium">
              {displayLocation} ({displayCoordinates})
            </span>
          </div>
        </div>

        {/* Location Selector Controls & Actions */}
        <div className="flex items-center gap-1.5 shrink-0 flex-wrap">
          {!isCustomSearchOpen ? (
            <div className="flex items-center gap-1">
              <div className="relative">
                <MapPin className="w-3.5 h-3.5 text-emerald-700 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" aria-hidden="true" />
                <select
                  value={isPredefinedCity ? selectedCity : '__custom__'}
                  onChange={handleCitySelectChange}
                  aria-label="Select City for Weather"
                  className="pl-7 pr-3 py-1.5 text-xs font-semibold rounded-xl bg-white border border-[#d2e2cb] text-[#1c4d29] hover:bg-[#edf5e9] transition cursor-pointer shadow-2xs focus:outline-none focus:ring-2 focus:ring-emerald-600/30 min-h-[38px]"
                >
                  {POPULAR_KARNATAKA_CITIES.map((c) => (
                    <option key={c.name} value={c.name}>
                      {c.name}
                    </option>
                  ))}
                  <option value="__custom__">
                    {!isPredefinedCity ? `📍 ${selectedCity}` : '🔍 Search other city...'}
                  </option>
                </select>
              </div>

              {/* Custom Search Toggle Button */}
              <button
                type="button"
                onClick={() => setIsCustomSearchOpen(true)}
                className="w-9 h-9 min-w-[36px] min-h-[36px] flex items-center justify-center rounded-xl bg-white border border-[#d2e2cb] text-[#1c4d29] hover:bg-[#edf5e9] transition shadow-2xs cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600"
                title="Search any city or district"
                aria-label="Search custom city"
              >
                <Search className="w-3.5 h-3.5" />
              </button>

              {/* Device GPS Location Button */}
              <button
                type="button"
                onClick={handleUseCurrentLocation}
                disabled={isLocating || loading}
                className="w-9 h-9 min-w-[36px] min-h-[36px] flex items-center justify-center rounded-xl bg-white border border-[#d2e2cb] text-[#1c4d29] hover:bg-[#edf5e9] transition shadow-2xs disabled:opacity-60 cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600"
                title="Use current device GPS location"
                aria-label="Use current device location"
              >
                <Navigation className={`w-3.5 h-3.5 text-emerald-700 ${isLocating ? 'animate-spin' : ''}`} />
              </button>
            </div>
          ) : (
            /* Custom City Input Form */
            <form onSubmit={handleCustomSearchSubmit} className="flex items-center gap-1">
              <input
                type="text"
                value={customSearchInput}
                onChange={(e) => setCustomSearchInput(e.target.value)}
                placeholder="Enter city (e.g. Bengaluru, Mysuru)..."
                autoFocus
                className="px-2.5 py-1.5 text-xs rounded-xl bg-white border border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-600/30 w-36 sm:w-48 text-slate-800 font-medium min-h-[38px]"
              />
              <button
                type="submit"
                className="px-2.5 py-1.5 min-h-[38px] bg-[#14492a] hover:bg-[#0f3820] text-white text-xs font-bold rounded-xl transition cursor-pointer"
              >
                Go
              </button>
              <button
                type="button"
                onClick={() => setIsCustomSearchOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg"
                aria-label="Cancel search"
              >
                <X className="w-4 h-4" />
              </button>
            </form>
          )}

          {/* Refresh Action Button */}
          <button
            onClick={() => loadWeatherForCity(selectedCity)}
            disabled={loading}
            className="flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1.5 min-h-[38px] rounded-xl bg-white border border-[#d2e2cb] text-[#1c4d29] hover:bg-[#edf5e9] transition active:scale-95 shrink-0 disabled:opacity-60 shadow-2xs cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600"
            title={`Refresh Open-Meteo live data for ${selectedCity}`}
            aria-label="Refresh live weather data"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-emerald-600 shrink-0 ${loading ? 'animate-spin' : ''}`} />
            <span className="text-[11px] sm:text-xs">{loading ? 'Updating...' : 'Refresh'}</span>
          </button>
        </div>
      </div>

      {/* Location Permission / GPS Error State */}
      {locationPermissionError && (
        <div className="p-3 bg-amber-50 border-b border-amber-200 text-amber-900 text-xs flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <Compass className="w-4 h-4 text-amber-700 shrink-0" aria-hidden="true" />
            <span className="leading-snug">{locationPermissionError}</span>
          </div>
          <button
            onClick={() => setLocationPermissionError(null)}
            className="p-1 text-amber-700 hover:text-amber-900 rounded-md"
            title="Dismiss notice"
            aria-label="Dismiss location warning"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Loading Skeleton State */}
      {loading && !weatherData && (
        <div className="p-6 text-center space-y-3">
          <div className="w-10 h-10 border-3 border-emerald-600 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-xs font-bold text-slate-700">
            Fetching real-time weather from Open-Meteo for {selectedCity}...
          </p>
          <p className="text-[11px] text-slate-400">
            {resolvedLocation
              ? `Connecting to grid coordinates ${displayCoordinates}`
              : `Resolving geographical coordinates for ${selectedCity}...`}
          </p>
        </div>
      )}

      {/* Error & Retry State */}
      {error && !weatherData && (
        <div className="p-5 space-y-3">
          <div className="flex items-start gap-3 p-3.5 rounded-2xl bg-red-50 border border-red-200 text-xs text-red-800" role="alert">
            <AlertCircle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" aria-hidden="true" />
            <div className="space-y-1">
              <span className="font-bold text-red-900 block">
                Weather Connection Failed for {selectedCity}
              </span>
              <p className="leading-relaxed">{error}</p>
            </div>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={() => loadWeatherForCity(selectedCity)}
              className="flex-1 py-2.5 min-h-[44px] rounded-xl bg-[#14492a] hover:bg-[#0e3a20] text-white text-xs font-bold transition flex items-center justify-center gap-2 min-w-[140px] cursor-pointer"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Retry Connection for {selectedCity}</span>
            </button>
            {selectedCity !== 'Vijayapura' && (
              <button
                onClick={() => {
                  setSelectedCity('Vijayapura');
                  if (typeof localStorage !== 'undefined') {
                    localStorage.setItem(SELECTED_CITY_STORAGE_KEY, 'Vijayapura');
                  }
                }}
                className="px-3.5 py-2.5 min-h-[44px] rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition cursor-pointer"
              >
                Reset to Vijayapura
              </button>
            )}
          </div>
        </div>
      )}

      {/* Real Live Weather Data Display */}
      {weatherData && (
        <div className="divide-y divide-[#edf3ea]">
          {/* Stale Warning Banner if Refresh Failed */}
          {(weatherData.isStale || (error && weatherData)) && (
            <div className="p-3 bg-amber-50 border-b border-amber-200 text-amber-900 text-xs flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 min-w-0">
                <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
                <span className="leading-snug">
                  <strong>Stale Data Warning:</strong> Live refresh failed{error ? ` (${error})` : ''}. Displaying cached Open-Meteo readings for {weatherData.locationName} from {weatherData.weatherObservationTime}.
                </span>
              </div>
              <button
                onClick={() => loadWeatherForCity(selectedCity)}
                disabled={loading}
                className="text-[11px] font-bold text-amber-900 underline shrink-0 hover:text-amber-950 disabled:opacity-50"
              >
                Retry
              </button>
            </div>
          )}

          {/* Real Live Weather Hero Block */}
          <div className="p-4 sm:p-5 bg-gradient-to-br from-[#124429] via-[#0f3e25] to-[#0a2c19] text-white space-y-4">
            {/* Metadata Bar: Source & Timestamps */}
            <div className="space-y-1.5 text-xs">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5 text-xs">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="px-2 py-0.5 rounded-md bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[10px] font-bold uppercase tracking-wider flex items-center gap-1 shrink-0">
                    <CheckCircle2 className="w-3 h-3 text-emerald-300 shrink-0" aria-hidden="true" />
                    <span>Real Open-Meteo Data</span>
                  </span>
                  <a
                    href="https://open-meteo.com"
                    target="_blank"
                    rel="noreferrer"
                    className="text-[11px] text-emerald-300 hover:text-emerald-100 flex items-center gap-1 underline underline-offset-2 shrink-0"
                  >
                    <span>Source: {weatherData.dataSource}</span>
                    <ExternalLink className="w-2.5 h-2.5" />
                  </a>
                </div>

                <div className="text-[10px] text-emerald-300/80 font-mono">
                  Timezone: {weatherData.timezone} ({weatherData.timezoneAbbreviation})
                </div>
              </div>

              {/* Explicit Dual Timestamps: Observation Time vs. App Fetch Time */}
              <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-emerald-200/90 pt-0.5 border-t border-white/10">
                <span className="flex items-center gap-1">
                  <Clock className="w-3 h-3 text-emerald-300 shrink-0" aria-hidden="true" />
                  <span>Recorded: <strong className="text-white">{weatherData.weatherObservationTime}</strong></span>
                </span>
                <span className="text-emerald-300/40 hidden sm:inline">•</span>
                <span className="text-emerald-200/80">
                  Fetched: {weatherData.dataFetchTime}
                </span>
              </div>
            </div>

            {/* Current Conditions Block */}
            <div className="flex items-center justify-between gap-3">
              <div>
                <div className="flex items-baseline gap-2">
                  <span className="text-4xl sm:text-5xl font-extrabold tracking-tight font-display tabular-nums">
                    {weatherData.current.temperature}°C
                  </span>
                  <span className="text-sm sm:text-base text-emerald-200 font-semibold">
                    {weatherData.current.weatherDescription}
                  </span>
                </div>
                <p className="text-xs text-emerald-200 mt-1">
                  Dew Point: <strong className="text-white">{weatherData.current.dewPoint}°C</strong>
                </p>
              </div>

              <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-white/10 backdrop-blur-sm flex items-center justify-center border border-white/15 shrink-0">
                {getWeatherIcon(weatherData.current.weatherCode, 'w-9 h-9 sm:w-10 sm:h-10')}
              </div>
            </div>

            {/* COMPACT WEATHER INDICATORS GRID (Requirement 2: Present available weather indicators in compact cards) */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2 pt-2 border-t border-white/10">
              {/* Card 1: Temperature & Condition */}
              <div className="bg-white/10 backdrop-blur-xs rounded-xl p-2.5 border border-white/10 min-w-0">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[10px] text-emerald-200 uppercase font-bold tracking-wide">Temp</span>
                  <Thermometer className="w-3.5 h-3.5 text-amber-300 shrink-0" aria-hidden="true" />
                </div>
                <div className="text-base font-extrabold text-white tabular-nums">
                  {weatherData.current.temperature}°C
                </div>
                <div className="text-[10px] text-emerald-200/80 truncate mt-0.5">
                  Dew: {weatherData.current.dewPoint}°C
                </div>
              </div>

              {/* Card 2: Relative Humidity */}
              <div className="bg-white/10 backdrop-blur-xs rounded-xl p-2.5 border border-white/10 min-w-0">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[10px] text-emerald-200 uppercase font-bold tracking-wide">Humidity</span>
                  <Droplets className="w-3.5 h-3.5 text-blue-300 shrink-0" aria-hidden="true" />
                </div>
                <div className="text-base font-extrabold text-white tabular-nums">
                  {weatherData.current.humidity}%
                </div>
                <div className="text-[10px] text-emerald-200/80 truncate mt-0.5">
                  {weatherData.current.humidity > 70 ? 'High moisture' : weatherData.current.humidity < 40 ? 'Dry air' : 'Optimal'}
                </div>
              </div>

              {/* Card 3: Wind Speed & Drift Risk */}
              <div className="bg-white/10 backdrop-blur-xs rounded-xl p-2.5 border border-white/10 min-w-0">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[10px] text-emerald-200 uppercase font-bold tracking-wide">Wind (10m)</span>
                  <Wind className="w-3.5 h-3.5 text-teal-300 shrink-0" aria-hidden="true" />
                </div>
                <div className="text-base font-extrabold text-white tabular-nums">
                  {weatherData.current.windSpeed} <span className="text-xs font-normal">km/h</span>
                </div>
                <div className={`text-[10px] font-semibold truncate mt-0.5 ${getWindSafetyTier(weatherData.current.windSpeed).color}`}>
                  {getWindSafetyTier(weatherData.current.windSpeed).label}
                </div>
              </div>

              {/* Card 4: Rain Probability */}
              <div className="bg-white/10 backdrop-blur-xs rounded-xl p-2.5 border border-white/10 min-w-0">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[10px] text-emerald-200 uppercase font-bold tracking-wide">Rain Prob</span>
                  <CloudRain className="w-3.5 h-3.5 text-sky-300 shrink-0" aria-hidden="true" />
                </div>
                <div className="text-base font-extrabold text-white tabular-nums">
                  {weatherData.current.precipitationProbability}%
                </div>
                <div className="text-[10px] text-emerald-200/80 truncate mt-0.5">
                  {weatherData.current.precipitationProbability >= 40 ? 'Rain likely' : 'Low rain chance'}
                </div>
              </div>

              {/* Card 5: Surface Soil Temp (Model-Estimated) */}
              <div className="bg-white/10 backdrop-blur-xs rounded-xl p-2.5 border border-white/10 min-w-0">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[10px] text-emerald-200 uppercase font-bold tracking-wide">Soil Temp</span>
                  <span className="text-[8px] px-1 py-0.2 rounded bg-white/15 text-amber-200 font-mono">0cm</span>
                </div>
                <div className="text-base font-extrabold text-white tabular-nums">
                  {weatherData.current.soilTemperature0cm !== undefined ? `${weatherData.current.soilTemperature0cm}°C` : 'N/A'}
                </div>
                <div className="text-[9px] text-amber-200/90 font-medium truncate mt-0.5">
                  Modelled (ECMWF)
                </div>
              </div>

              {/* Card 6: Root Soil Moisture (Model-Estimated) */}
              <div className="bg-white/10 backdrop-blur-xs rounded-xl p-2.5 border border-white/10 min-w-0">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[10px] text-emerald-200 uppercase font-bold tracking-wide">Moisture</span>
                  <Layers className="w-3.5 h-3.5 text-emerald-300 shrink-0" aria-hidden="true" />
                </div>
                <div className="text-base font-extrabold text-white tabular-nums">
                  {weatherData.current.soilMoisture0to1cm !== undefined ? `${weatherData.current.soilMoisture0to1cm}` : 'N/A'}
                  {weatherData.current.soilMoisture0to1cm !== undefined && <span className="text-[9px] font-normal ml-0.5">m³/m³</span>}
                </div>
                <div className="text-[9px] text-amber-200/90 font-medium truncate mt-0.5">
                  Modelled 0-1cm
                </div>
              </div>
            </div>
          </div>

          {/* Sub-view Navigation Controls: Farming Advisory vs 24h Hourly Timeline vs Modelled Soil Data */}
          <div className="px-4 py-2.5 bg-[#f8faf6] flex items-center gap-1.5 overflow-x-auto no-scrollbar" role="tablist" aria-label="Weather sub-tabs">
            <button
              role="tab"
              aria-selected={activeTab === 'overview'}
              onClick={() => setActiveTab('overview')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition whitespace-nowrap min-h-[38px] cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600 ${
                activeTab === 'overview'
                  ? 'bg-[#14492a] text-white shadow-2xs'
                  : 'bg-white border border-[#dbe7d5] text-[#2c4734] hover:bg-[#edf5e9]'
              }`}
            >
              Farming Advisory
            </button>

            <button
              role="tab"
              aria-selected={activeTab === 'timeline'}
              onClick={() => setActiveTab('timeline')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition whitespace-nowrap min-h-[38px] cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600 flex items-center gap-1.5 ${
                activeTab === 'timeline'
                  ? 'bg-[#14492a] text-white shadow-2xs'
                  : 'bg-white border border-[#dbe7d5] text-[#2c4734] hover:bg-[#edf5e9]'
              }`}
            >
              <Sprout className="w-3.5 h-3.5 text-emerald-500" />
              <span>Crop Timeline</span>
            </button>

            <button
              role="tab"
              aria-selected={activeTab === 'hourly'}
              onClick={() => setActiveTab('hourly')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition whitespace-nowrap min-h-[38px] cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600 ${
                activeTab === 'hourly'
                  ? 'bg-[#14492a] text-white shadow-2xs'
                  : 'bg-white border border-[#dbe7d5] text-[#2c4734] hover:bg-[#edf5e9]'
              }`}
            >
              Hourly Forecast (24h)
            </button>

            <button
              role="tab"
              aria-selected={activeTab === 'soilModel'}
              onClick={() => setActiveTab('soilModel')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition whitespace-nowrap min-h-[38px] cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600 ${
                activeTab === 'soilModel'
                  ? 'bg-[#14492a] text-white shadow-2xs'
                  : 'bg-white border border-[#dbe7d5] text-[#2c4734] hover:bg-[#edf5e9]'
              }`}
            >
              Modelled Soil Data
            </button>
          </div>

          {/* ==================== SUB-VIEW 1: FARMING ADVISORY ==================== */}
          {activeTab === 'overview' && (
            <div className="p-4 sm:p-5 space-y-4">
              {/* Crop & Growth Stage Filter Bar */}
              <div className="p-3 sm:p-3.5 rounded-2xl bg-[#f4f8f1] border border-[#dce8d5] space-y-2">
                <div className="flex items-center justify-between gap-2 flex-wrap">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-[#144225]">
                    <Sprout className="w-4 h-4 text-emerald-700 shrink-0" aria-hidden="true" />
                    <span>Personalize Advisory for Your Field:</span>
                  </div>
                  {advisoryReport?.modelUsed && (
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-bold border border-emerald-200">
                      ✨ {advisoryReport.modelUsed}
                    </span>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                  {/* Crop Selector */}
                  <div>
                    <label htmlFor="advisory-crop-select" className="text-[11px] font-semibold text-slate-600 block mb-1">
                      Target Crop:
                    </label>
                    <select
                      id="advisory-crop-select"
                      value={selectedCrop}
                      onChange={(e) => setSelectedCrop(e.target.value)}
                      className="w-full px-2.5 py-1.5 rounded-xl bg-white border border-[#cde0cb] text-[#14492a] font-bold text-xs focus:outline-none focus:ring-2 focus:ring-emerald-600/30 cursor-pointer min-h-[38px]"
                    >
                      {crops.length > 0 && (
                        <optgroup label="Your Farm Registered Crops">
                          {crops.map((c) => (
                            <option key={c.id} value={c.name}>
                              🌾 {c.name} ({c.fieldName})
                            </option>
                          ))}
                        </optgroup>
                      )}
                      <optgroup label="Common Indian Crops">
                        {COMMON_CROPS.map((c) => (
                          <option key={c} value={c}>
                            {c}
                          </option>
                        ))}
                      </optgroup>
                    </select>
                  </div>

                  {/* Growth Stage Selector */}
                  <div>
                    <label htmlFor="advisory-stage-select" className="text-[11px] font-semibold text-slate-600 block mb-1">
                      Current Growth Stage:
                    </label>
                    <select
                      id="advisory-stage-select"
                      value={selectedGrowthStage}
                      onChange={(e) => setSelectedGrowthStage(e.target.value as GrowthStage)}
                      className="w-full px-2.5 py-1.5 rounded-xl bg-white border border-[#cde0cb] text-[#14492a] font-bold text-xs focus:outline-none focus:ring-2 focus:ring-emerald-600/30 cursor-pointer min-h-[38px]"
                    >
                      {GROWTH_STAGES.map((s) => (
                        <option key={s} value={s}>
                          🌱 {s}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              {/* Advisory Audio Readout & Action Bar */}
              {advisoryReport && (
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 p-3 rounded-2xl bg-[#edf6ea] border border-[#d2e4cb]">
                  <div className="flex items-center gap-2 min-w-0">
                    <Sparkles className="w-4 h-4 text-emerald-700 shrink-0" aria-hidden="true" />
                    <span className="text-xs text-[#14492a] font-semibold truncate">
                      Advisory for <strong>{selectedCrop}</strong> ({selectedGrowthStage})
                    </span>
                  </div>

                  <div className="flex items-center gap-2 shrink-0 flex-wrap">
                    {/* Spoken Advisory Readout in Selected Language (Web Speech TTS) */}
                    {advisoryReport.spokenSummary && (
                      <VoiceSpeakerButton
                        text={advisoryReport.spokenSummary}
                        language={language}
                        utteranceId={`advisory-${selectedCrop}-${Date.now().toString().slice(0, 7)}`}
                        variant="button"
                        customLabel="Listen to Advisory"
                      />
                    )}

                    {onOpenVoiceAssistant && (
                      <button
                        type="button"
                        onClick={onOpenVoiceAssistant}
                        className="px-2.5 py-1.5 min-h-[36px] rounded-xl bg-white border border-[#d2e2cb] text-[#14492a] hover:bg-[#e4f0e0] transition text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-2xs"
                        title="Ask the Voice Assistant about this advisory"
                      >
                        <Mic className="w-3.5 h-3.5 text-emerald-700" />
                        <span>Ask Assistant</span>
                      </button>
                    )}
                  </div>
                </div>
              )}

              {/* Advisory Loading State */}
              {advisoryLoading && (
                <div className="p-6 rounded-2xl bg-slate-50 border border-slate-200 text-center space-y-2">
                  <div className="w-8 h-8 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin mx-auto" />
                  <p className="text-xs font-bold text-slate-700">
                    Generating actionable agronomic recommendations for {selectedCrop}...
                  </p>
                  <p className="text-[11px] text-slate-500">
                    Correlating {weatherData.current.temperature}°C, {weatherData.current.windSpeed} km/h wind, and {weatherData.current.precipitationProbability}% precipitation probability with {selectedGrowthStage} physiological needs.
                  </p>
                </div>
              )}

              {/* Advisory Error State with Retry Button */}
              {advisoryError && !advisoryLoading && (
                <div className="p-4 rounded-2xl bg-red-50 border border-red-200 text-xs text-red-800 space-y-2" role="alert">
                  <div className="flex items-center gap-2 font-bold text-red-900">
                    <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
                    <span>Unable to Load Farming Advisory</span>
                  </div>
                  <p className="leading-relaxed">{advisoryError}</p>
                  <button
                    type="button"
                    onClick={() => {
                      setAdvisoryError(null);
                      loadWeatherForCity(selectedCity);
                    }}
                    className="px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl text-xs transition cursor-pointer min-h-[36px]"
                  >
                    Retry Advisory
                  </button>
                </div>
              )}

              {/* Transient AI warning if rule fallback was used */}
              {advisoryWarning && !advisoryLoading && (
                <div className="p-2.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-[11px] flex items-center gap-2">
                  <Info className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                  <span>{advisoryWarning}</span>
                </div>
              )}

              {/* Advisory Report Content */}
              {advisoryReport && !advisoryLoading && (
                <div className="space-y-3.5">
                  {/* Overall Assessment Summary */}
                  {advisoryReport.overallAssessment && (
                    <div className="p-3.5 rounded-2xl bg-[#f8faf6] border border-[#dce8d5] text-xs text-slate-800 leading-relaxed space-y-1">
                      <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">
                        Current Farm Conditions Overview:
                      </span>
                      <p className="font-medium">{advisoryReport.overallAssessment}</p>
                    </div>
                  )}

                  {/* MANDATORY SPRAYING & SAFETY WARNING (Requirement: Do not label weather as guaranteed safe spraying window) */}
                  <div className="p-3.5 rounded-2xl bg-amber-50 border border-amber-300 text-amber-950 text-xs space-y-1">
                    <div className="flex items-center gap-2 font-bold text-amber-900">
                      <ShieldAlert className="w-4 h-4 text-amber-700 shrink-0" aria-hidden="true" />
                      <span>Spraying & Field Safety Warning</span>
                    </div>
                    <p className="leading-relaxed text-[11px]">
                      {advisoryReport.sprayingDisclaimer ||
                        'Meteorological data is an informational aid, NOT a guaranteed spraying window. In-field wind gusts, ambient temperature, morning dew, and pesticide label instructions must strictly be confirmed before spraying.'}
                    </p>
                  </div>

                  {/* Structured Actionable Recommendations with REASONING (Requirement 2) */}
                  <div className="space-y-2.5">
                    <h4 className="text-xs font-bold text-[#144225] uppercase tracking-wider font-display flex items-center gap-1.5">
                      <span>Actionable Recommendations ({advisoryReport.recommendations?.length || 0})</span>
                    </h4>

                    {advisoryReport.recommendations?.map((rec: AdvisoryRecommendation, idx: number) => {
                      const urgencyStyles: Record<string, { bg: string; border: string; text: string; badge: string }> = {
                        action_required: {
                          bg: 'bg-rose-50/60',
                          border: 'border-rose-200',
                          text: 'text-rose-950',
                          badge: 'bg-rose-100 text-rose-800 border-rose-300',
                        },
                        caution: {
                          bg: 'bg-amber-50/60',
                          border: 'border-amber-200',
                          text: 'text-amber-950',
                          badge: 'bg-amber-100 text-amber-800 border-amber-300',
                        },
                        favorable: {
                          bg: 'bg-emerald-50/60',
                          border: 'border-emerald-200',
                          text: 'text-emerald-950',
                          badge: 'bg-emerald-100 text-emerald-800 border-emerald-300',
                        },
                        monitoring: {
                          bg: 'bg-sky-50/60',
                          border: 'border-sky-200',
                          text: 'text-sky-950',
                          badge: 'bg-sky-100 text-sky-800 border-sky-300',
                        },
                      };

                      const currentStyle = urgencyStyles[rec.urgency] || urgencyStyles.monitoring;

                      const categoryLabels: Record<string, string> = {
                        irrigation: '💧 Irrigation Management',
                        spraying: '🛡️ Crop Protection & Spraying',
                        growth_stage: '🌱 Growth Stage Care',
                        field_work: '🚜 Field Operations',
                        crop_care: '🌿 Crop Care',
                      };

                      return (
                        <div
                          key={rec.id || `rec-${idx}`}
                          className={`p-3.5 sm:p-4 rounded-2xl border transition-all space-y-2.5 ${currentStyle.bg} ${currentStyle.border}`}
                        >
                          {/* Top Badges: Category & Urgency */}
                          <div className="flex items-center justify-between gap-2 flex-wrap text-[11px]">
                            <span className="font-bold text-slate-700">
                              {categoryLabels[rec.category] || rec.category}
                            </span>
                            <span className={`px-2 py-0.5 rounded-full font-bold text-[10px] uppercase border ${currentStyle.badge}`}>
                              {rec.urgency.replace('_', ' ')}
                            </span>
                          </div>

                          {/* Recommendation Title */}
                          <h5 className="text-xs sm:text-sm font-bold text-[#144225] font-display">
                            {rec.title}
                          </h5>

                          {/* Actionable Advice */}
                          <p className="text-xs text-slate-800 leading-relaxed font-medium">
                            {rec.advice}
                          </p>

                          {/* EXPLANATION OF REASONING (Requirement 2: Explain the reasoning behind each recommendation) */}
                          {rec.reasoning && (
                            <div className="p-2.5 rounded-xl bg-white/80 border border-slate-200/80 text-[11px] space-y-0.5">
                              <span className="font-bold text-slate-700 block">
                                💡 Why this advice is given (Agronomic Reasoning):
                              </span>
                              <p className="text-slate-600 leading-relaxed">
                                {rec.reasoning}
                              </p>
                            </div>
                          )}

                          {/* Caution Note */}
                          {rec.caution && (
                            <div className="flex items-start gap-1.5 text-[10px] text-amber-900/90 leading-tight">
                              <AlertTriangle className="w-3 h-3 text-amber-700 shrink-0 mt-0.5" aria-hidden="true" />
                              <span>{rec.caution}</span>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Integrated Crop Timeline Section inside Farming Advisory (Requirement 1) */}
              <div className="pt-4 border-t border-[#dce8d5]">
                <CropTimelineSection
                  cropName={selectedCrop}
                  crops={crops}
                  weather={weatherData?.current}
                  language={language}
                  farmLocation={displayLocation}
                  onSelectCrop={(newCrop) => setSelectedCrop(newCrop)}
                  onOpenVoiceAssistant={onOpenVoiceAssistant}
                />
              </div>
            </div>
          )}

          {/* ==================== SUB-VIEW: DEDICATED CROP TIMELINE ==================== */}
          {activeTab === 'timeline' && (
            <div className="p-4 sm:p-5">
              <CropTimelineSection
                cropName={selectedCrop}
                crops={crops}
                weather={weatherData?.current}
                language={language}
                farmLocation={displayLocation}
                onSelectCrop={(newCrop) => setSelectedCrop(newCrop)}
                onOpenVoiceAssistant={onOpenVoiceAssistant}
              />
            </div>
          )}

          {/* ==================== SUB-VIEW 2: 24-HOUR HOURLY TIMELINE ==================== */}
          {activeTab === 'hourly' && (
            <div className="p-4 space-y-2.5">
              <div className="flex items-center justify-between text-xs text-slate-500">
                <span className="font-semibold text-slate-700">Next 24-Hour Progression ({displayLocation})</span>
                <span>Coordinates: {displayCoordinates}</span>
              </div>

              <div className="flex items-center gap-2 overflow-x-auto pb-2 -mx-2 px-2 no-scrollbar">
                {weatherData.hourly.map((pt, idx) => (
                  <div
                    key={`${pt.time}-${idx}`}
                    className="flex flex-col items-center justify-between p-2.5 rounded-2xl bg-[#f8faf6] border border-[#dce8d5] min-w-[76px] text-center shrink-0 space-y-1.5"
                  >
                    <span className="text-[10px] font-bold text-slate-500">{pt.hourLabel}</span>
                    <div className="my-0.5">
                      {getWeatherIcon(pt.weatherCode, 'w-5 h-5')}
                    </div>
                    <span className="text-xs font-black text-slate-800 tabular-nums">
                      {pt.temperature}°C
                    </span>
                    <div className="pt-1 border-t border-slate-200 w-full space-y-0.5">
                      <div className="text-[9px] text-sky-700 font-semibold tabular-nums">
                        {pt.precipitationProbability}% rain
                      </div>
                      <div className="text-[9px] text-slate-500 tabular-nums">
                        {pt.windSpeed} km/h
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ==================== SUB-VIEW 3: MODELLED SOIL DATA ==================== */}
          {activeTab === 'soilModel' && (
            <div className="p-4 sm:p-5 space-y-3.5">
              {/* Mandatory Scientific Transparency Notice */}
              <div className="p-3.5 rounded-2xl bg-amber-50 border border-amber-200 text-xs text-amber-900 space-y-1">
                <div className="flex items-center gap-1.5 font-bold text-amber-950">
                  <Layers className="w-4 h-4 text-amber-700 shrink-0" aria-hidden="true" />
                  <span>Model-Estimated Surface & Subsurface Soil Variables</span>
                </div>
                <p className="leading-relaxed">
                  These soil temperature and volumetric moisture readings are derived from numerical land-surface models (ECMWF / Open-Meteo) for the <strong>{displayLocation}</strong> grid cell ({displayCoordinates}). They are <strong>model-estimated calculations, not physical in-field probe measurements</strong> of your specific plot.
                </p>
                <p className="text-[11px] text-amber-800 pt-1 font-medium">
                  Notice: Chemical attributes (soil pH, Nitrogen, Phosphorus, Potassium, Organic Carbon) cannot be measured by satellite or weather models and strictly require laboratory soil testing (e.g. Soil Health Card).
                </p>
              </div>

              {/* Data Grid with explicit model-estimated labels */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                <div className="p-3 rounded-2xl bg-[#f8faf6] border border-[#dce8d5] text-center">
                  <span className="text-[10px] text-slate-500 font-bold block uppercase leading-tight">
                    Model-Estimated Surface Soil Temp
                  </span>
                  <span className="text-base font-extrabold text-[#113d23] tabular-nums block mt-1">
                    {weatherData.current.soilTemperature0cm !== undefined
                      ? `${weatherData.current.soilTemperature0cm}°C`
                      : 'Unavailable'}
                  </span>
                  <span className="text-[10px] text-slate-400 block mt-0.5">Depth: 0 cm (Modelled)</span>
                </div>

                <div className="p-3 rounded-2xl bg-[#f8faf6] border border-[#dce8d5] text-center">
                  <span className="text-[10px] text-slate-500 font-bold block uppercase leading-tight">
                    Model-Estimated Subsurface Soil Temp
                  </span>
                  <span className="text-base font-extrabold text-[#113d23] tabular-nums block mt-1">
                    {weatherData.current.soilTemperature6cm !== undefined
                      ? `${weatherData.current.soilTemperature6cm}°C`
                      : 'Unavailable'}
                  </span>
                  <span className="text-[10px] text-slate-400 block mt-0.5">Depth: 6 cm (Modelled)</span>
                </div>

                <div className="p-3 rounded-2xl bg-[#f8faf6] border border-[#dce8d5] text-center">
                  <span className="text-[10px] text-slate-500 font-bold block uppercase leading-tight">
                    Modelled Soil Moisture
                  </span>
                  <span className="text-base font-extrabold text-slate-800 tabular-nums block mt-1">
                    {weatherData.current.soilMoisture0to1cm !== undefined
                      ? `${weatherData.current.soilMoisture0to1cm} m³/m³`
                      : 'Unavailable'}
                  </span>
                  <span className="text-[10px] text-slate-400 block mt-0.5">Depth: 0–1 cm (Modelled)</span>
                </div>

                <div className="p-3 rounded-2xl bg-[#f8faf6] border border-[#dce8d5] text-center">
                  <span className="text-[10px] text-slate-500 font-bold block uppercase leading-tight">
                    Modelled Root Moisture
                  </span>
                  <span className="text-base font-extrabold text-slate-800 tabular-nums block mt-1">
                    {weatherData.current.soilMoisture1to3cm !== undefined
                      ? `${weatherData.current.soilMoisture1to3cm} m³/m³`
                      : 'Unavailable'}
                  </span>
                  <span className="text-[10px] text-slate-400 block mt-0.5">Depth: 1–3 cm (Modelled)</span>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

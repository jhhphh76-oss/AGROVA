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
  Compass
} from 'lucide-react';
import { SupportedLanguage, WeatherDataState } from '../types';
import { TRANSLATIONS } from '../constants/translations';
import { 
  weatherService, 
  POPULAR_KARNATAKA_CITIES, 
  GeocodedLocation 
} from '../services/weatherService';

export const SELECTED_CITY_STORAGE_KEY = 'agrova_selected_weather_city';

interface WeatherWidgetProps {
  locationName?: string;
  language?: SupportedLanguage;
  onLocationChange?: (newCity: string) => void;
}

export const WeatherWidget: React.FC<WeatherWidgetProps> = ({
  locationName,
  language = 'en',
  onLocationChange,
}) => {
  const t = TRANSLATIONS[language]?.home || TRANSLATIONS.en.home;

  // Selected city state persisted in localStorage so it stays consistent after refresh
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
  const [activeTab, setActiveTab] = useState<'overview' | 'hourly' | 'soilModel'>('overview');

  // Geolocation detection & permission states
  const [isLocating, setIsLocating] = useState<boolean>(false);
  const [locationPermissionError, setLocationPermissionError] = useState<string | null>(null);

  // Track active request to prevent race conditions & stale responses
  const requestSeqRef = useRef<number>(0);
  const abortControllerRef = useRef<AbortController | null>(null);

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
    // Clear old city's weather data so stale city weather is NEVER displayed
    setWeatherData(null);

    try {
      // 1. Resolve city to its accurate latitude, longitude, and geographic region/country
      const geo = await weatherService.geocodeCity(cityToFetch);
      if (currentSeq !== requestSeqRef.current) return;
      setResolvedLocation(geo);

      // 2. Fetch live weather & forecast from Open-Meteo for those exact coordinates
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

  const advisory = weatherData?.current
    ? weatherService.generateWeatherAdvisory(weatherData.current)
    : null;

  const isPredefinedCity = POPULAR_KARNATAKA_CITIES.some(
    (c) => c.name.toLowerCase() === selectedCity.toLowerCase()
  );

  const displayLocation = weatherData?.locationName || resolvedLocation?.locationName || selectedCity;
  const currentLat = weatherData?.latitude ?? resolvedLocation?.latitude;
  const currentLon = weatherData?.longitude ?? resolvedLocation?.longitude;

  const displayCoordinates = currentLat !== undefined && currentLon !== undefined
    ? `${Math.abs(currentLat).toFixed(2)}°${currentLat >= 0 ? 'N' : 'S'}, ${Math.abs(currentLon).toFixed(2)}°${currentLon >= 0 ? 'E' : 'W'}`
    : 'Resolving coordinates...';

  return (
    <div className="bg-white rounded-3xl border border-[#dce8d5] shadow-xs overflow-hidden transition-all">
      {/* Top Header Bar with Source of Truth City Selector */}
      <div className="px-4 py-3 bg-[#f5f9f3] border-b border-[#e2ebd9] flex flex-wrap items-center justify-between gap-2.5">
        <div className="flex items-center gap-2 min-w-0 flex-1">
          <CloudSun className="w-5 h-5 text-emerald-700 shrink-0" />
          <div className="min-w-0">
            <h3 className="text-xs sm:text-sm font-bold text-[#144225] font-display truncate">
              Live Weather • Open-Meteo
            </h3>
            <span className="text-[10px] text-slate-500 block truncate font-medium">
              {displayLocation} ({displayCoordinates})
            </span>
          </div>
        </div>

        {/* Location Selector Controls & Actions */}
        <div className="flex items-center gap-1.5 shrink-0 flex-wrap">
          {/* City Selection Dropdown */}
          {!isCustomSearchOpen ? (
            <div className="flex items-center gap-1">
              <div className="relative">
                <MapPin className="w-3.5 h-3.5 text-emerald-700 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <select
                  value={isPredefinedCity ? selectedCity : '__custom__'}
                  onChange={handleCitySelectChange}
                  aria-label="Select City for Weather"
                  className="pl-7 pr-3 py-1.5 text-xs font-semibold rounded-xl bg-white border border-[#d2e2cb] text-[#1c4d29] hover:bg-[#edf5e9] transition cursor-pointer shadow-2xs focus:outline-none focus:ring-2 focus:ring-emerald-600/30"
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
                className="p-1.5 rounded-xl bg-white border border-[#d2e2cb] text-[#1c4d29] hover:bg-[#edf5e9] transition shadow-2xs"
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
                className="p-1.5 rounded-xl bg-white border border-[#d2e2cb] text-[#1c4d29] hover:bg-[#edf5e9] transition shadow-2xs disabled:opacity-60"
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
                placeholder="Enter city (e.g. Bengaluru, Mysuru, Tokyo)..."
                autoFocus
                className="px-2.5 py-1 text-xs rounded-xl bg-white border border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-600/30 w-36 sm:w-48 text-slate-800 font-medium"
              />
              <button
                type="submit"
                className="px-2.5 py-1 bg-[#14492a] hover:bg-[#0f3820] text-white text-xs font-bold rounded-xl transition"
              >
                Go
              </button>
              <button
                type="button"
                onClick={() => setIsCustomSearchOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </form>
          )}

          {/* Refresh Action Button */}
          <button
            onClick={() => loadWeatherForCity(selectedCity)}
            disabled={loading}
            className="flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1.5 rounded-xl bg-white border border-[#d2e2cb] text-[#1c4d29] hover:bg-[#edf5e9] transition active:scale-95 shrink-0 disabled:opacity-60 shadow-2xs"
            title={`Refresh Open-Meteo live data for ${selectedCity}`}
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
            <Compass className="w-4 h-4 text-amber-700 shrink-0" />
            <span className="leading-snug">{locationPermissionError}</span>
          </div>
          <button
            onClick={() => setLocationPermissionError(null)}
            className="p-1 text-amber-700 hover:text-amber-900 rounded-md"
            title="Dismiss notice"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Loading Skeleton State with Specific Selected City Context */}
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

      {/* Clear Error & Retry State - Never silently displays another city as fallback */}
      {error && !weatherData && (
        <div className="p-5 space-y-3">
          <div className="flex items-start gap-3 p-3.5 rounded-2xl bg-red-50 border border-red-200 text-xs text-red-800">
            <AlertCircle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
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
              className="flex-1 py-2.5 rounded-xl bg-[#14492a] hover:bg-[#0e3a20] text-white text-xs font-bold transition flex items-center justify-center gap-2 min-w-[140px]"
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
                className="px-3.5 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition"
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

          {/* Real Live Hero Header */}
          <div className="p-4 sm:p-5 bg-gradient-to-br from-[#124429] via-[#0f3e25] to-[#0a2c19] text-white space-y-4">
            {/* Source & Verified Indicator, Distinguishing Observation Time & Fetch Time */}
            <div className="space-y-1.5 text-xs">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5 text-xs">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="px-2 py-0.5 rounded-md bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[10px] font-bold uppercase tracking-wider flex items-center gap-1 shrink-0">
                    <CheckCircle2 className="w-3 h-3 text-emerald-300 shrink-0" />
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

                {/* Local Timezone Badge */}
                <div className="text-[10px] text-emerald-300/80 font-mono">
                  Timezone: {weatherData.timezone} ({weatherData.timezoneAbbreviation})
                </div>
              </div>

              {/* Explicit Dual Timestamps: Observation Time vs. App Fetch Time */}
              <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-emerald-200/90 pt-0.5 border-t border-white/10">
                <span className="flex items-center gap-1">
                  <Clock className="w-3 h-3 text-emerald-300 shrink-0" />
                  <span>Weather Values Recorded: <strong className="text-white">{weatherData.weatherObservationTime}</strong></span>
                </span>
                <span className="text-emerald-300/40 hidden sm:inline">•</span>
                <span className="text-emerald-200/80">
                  Data Fetched: {weatherData.dataFetchTime}
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

            {/* 4 Core Meteorological Metrics Grid */}
            <div className="grid grid-cols-4 gap-1.5 sm:gap-2 pt-2 border-t border-white/10">
              <div className="bg-white/5 rounded-xl p-2 text-center border border-white/5 min-w-0">
                <Droplets className="w-3.5 h-3.5 text-blue-300 mx-auto mb-0.5 shrink-0" />
                <div className="text-[9px] sm:text-[10px] text-emerald-200 truncate">Humidity</div>
                <div className="text-xs sm:text-sm font-bold tabular-nums">
                  {weatherData.current.humidity}%
                </div>
              </div>

              <div className="bg-white/5 rounded-xl p-2 text-center border border-white/5 min-w-0">
                <Wind className="w-3.5 h-3.5 text-teal-300 mx-auto mb-0.5 shrink-0" />
                <div className="text-[9px] sm:text-[10px] text-emerald-200 truncate">Wind (10m)</div>
                <div className="text-xs sm:text-sm font-bold tabular-nums">
                  {weatherData.current.windSpeed} km/h
                </div>
              </div>

              <div className="bg-white/5 rounded-xl p-2 text-center border border-white/5 min-w-0">
                <CloudRain className="w-3.5 h-3.5 text-sky-300 mx-auto mb-0.5 shrink-0" />
                <div className="text-[9px] sm:text-[10px] text-emerald-200 truncate">Rain Prob.</div>
                <div className="text-xs sm:text-sm font-bold tabular-nums">
                  {weatherData.current.precipitationProbability}%
                </div>
              </div>

              {/* Accurately labeled model-estimated surface soil temperature */}
              <div className="bg-white/5 rounded-xl p-2 text-center border border-white/5 min-w-0 relative group">
                <Thermometer className="w-3.5 h-3.5 text-amber-300 mx-auto mb-0.5 shrink-0" />
                <div className="text-[9px] sm:text-[10px] text-emerald-200 truncate">
                  Surface Temp (0cm)
                </div>
                <div className="text-[8px] text-amber-300/80 font-medium">Model-Estimated</div>
                <div className="text-xs sm:text-sm font-bold tabular-nums">
                  {weatherData.current.soilTemperature0cm !== undefined
                    ? `${weatherData.current.soilTemperature0cm}°C`
                    : 'N/A'}
                </div>
              </div>
            </div>
          </div>

          {/* Sub-view Navigation Controls: Overview vs Hourly Timeline vs Modelled Soil Data */}
          <div className="px-4 py-2 bg-[#f8faf6] flex items-center gap-1.5 overflow-x-auto no-scrollbar">
            <button
              onClick={() => setActiveTab('overview')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition whitespace-nowrap min-h-[36px] ${
                activeTab === 'overview'
                  ? 'bg-[#14492a] text-white shadow-2xs'
                  : 'bg-white border border-[#dbe7d5] text-[#2c4734] hover:bg-[#edf5e9]'
              }`}
            >
              Farming Advisory
            </button>

            <button
              onClick={() => setActiveTab('hourly')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition whitespace-nowrap min-h-[36px] ${
                activeTab === 'hourly'
                  ? 'bg-[#14492a] text-white shadow-2xs'
                  : 'bg-white border border-[#dbe7d5] text-[#2c4734] hover:bg-[#edf5e9]'
              }`}
            >
              Hourly Forecast (24h)
            </button>

            <button
              onClick={() => setActiveTab('soilModel')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition whitespace-nowrap min-h-[36px] ${
                activeTab === 'soilModel'
                  ? 'bg-[#14492a] text-white shadow-2xs'
                  : 'bg-white border border-[#dbe7d5] text-[#2c4734] hover:bg-[#edf5e9]'
              }`}
            >
              Modelled Soil Data
            </button>
          </div>

          {/* Sub-view 1: Weather-Based Farming Advisory */}
          {activeTab === 'overview' && advisory && (
            <div className="p-4 sm:p-5 space-y-3">
              <div
                className={`p-3.5 rounded-2xl border text-xs space-y-1.5 ${
                  advisory.isCaution
                    ? 'bg-amber-50 border-amber-200 text-amber-900'
                    : 'bg-[#f4f9f2] border-[#cfe2ca] text-[#124429]'
                }`}
              >
                <div className="flex items-center gap-2 font-bold text-xs">
                  {advisory.isCaution ? (
                    <ShieldAlert className="w-4 h-4 text-amber-600 shrink-0" />
                  ) : (
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  )}
                  <span>Weather Operational Observation</span>
                </div>
                <p className="leading-relaxed">{advisory.advisory}</p>
              </div>

              {/* Strict Disclaimer per prompt rules */}
              <div className="flex items-start gap-2 p-3 rounded-xl bg-slate-50 border border-slate-200 text-[11px] text-slate-600 leading-relaxed">
                <AlertCircle className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
                <p>{advisory.cautionNote}</p>
              </div>
            </div>
          )}

          {/* Sub-view 2: Hourly Forecast Strip (Next 24h) with Dynamic Coordinates */}
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

          {/* Sub-view 3: Modelled Soil Estimates with Dynamic Grid Cell */}
          {activeTab === 'soilModel' && (
            <div className="p-4 sm:p-5 space-y-3.5">
              {/* Mandatory Scientific Transparency Notice */}
              <div className="p-3.5 rounded-2xl bg-amber-50 border border-amber-200 text-xs text-amber-900 space-y-1">
                <div className="flex items-center gap-1.5 font-bold text-amber-950">
                  <Layers className="w-4 h-4 text-amber-700 shrink-0" />
                  <span>Model-Estimated Surface & Subsurface Soil Variables</span>
                </div>
                <p className="leading-relaxed">
                  These soil temperature and volumetric moisture readings are derived from numerical land-surface models (ECMWF / Open-Meteo) for the <strong>{displayLocation}</strong> grid cell ({displayCoordinates}). They are <strong>model-estimated calculations, not physical in-field probe measurements</strong> of your specific plot.
                </p>
                <p className="text-[11px] text-amber-800 pt-1 font-medium">
                  Notice: Chemical attributes (soil pH, Nitrogen, Phosphorus, Potassium, Organic Carbon) cannot be measured by satellite or weather models and require laboratory soil testing (e.g. Soil Health Card).
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

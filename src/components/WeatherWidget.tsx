import React, { useState, useEffect } from 'react';
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
  ExternalLink
} from 'lucide-react';
import { SupportedLanguage, WeatherDataState } from '../types';
import { TRANSLATIONS } from '../constants/translations';
import { weatherService, VIJAYAPURA_COORDS } from '../services/weatherService';

interface WeatherWidgetProps {
  locationName?: string;
  language?: SupportedLanguage;
}

export const WeatherWidget: React.FC<WeatherWidgetProps> = ({
  locationName = VIJAYAPURA_COORDS.locationName,
  language = 'en',
}) => {
  const t = TRANSLATIONS[language]?.home || TRANSLATIONS.en.home;

  const [weatherData, setWeatherData] = useState<WeatherDataState | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'hourly' | 'soilModel'>('overview');

  const loadWeather = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await weatherService.fetchLiveWeather(
        VIJAYAPURA_COORDS.latitude,
        VIJAYAPURA_COORDS.longitude,
        locationName
      );
      setWeatherData(data);
    } catch (err: any) {
      const errMsg = err.message || 'Failed to connect to Open-Meteo Weather API.';
      setError(errMsg);
      setWeatherData((prev) => (prev ? { ...prev, isStale: true } : null));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadWeather();
  }, [locationName]);

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

  return (
    <div className="bg-white rounded-3xl border border-[#dce8d5] shadow-xs overflow-hidden transition-all">
      {/* Top Header Bar */}
      <div className="px-4 py-3 bg-[#f5f9f3] border-b border-[#e2ebd9] flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <CloudSun className="w-5 h-5 text-emerald-700 shrink-0" />
          <div className="min-w-0">
            <h3 className="text-xs sm:text-sm font-bold text-[#144225] font-display truncate">
              Live Weather • Open-Meteo
            </h3>
            <span className="text-[10px] text-slate-500 block truncate">
              {VIJAYAPURA_COORDS.locationName} (16.83°N, 75.72°E)
            </span>
          </div>
        </div>

        {/* Refresh Action Button */}
        <button
          onClick={loadWeather}
          disabled={loading}
          className="flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1.5 rounded-xl bg-white border border-[#d2e2cb] text-[#1c4d29] hover:bg-[#edf5e9] transition active:scale-95 shrink-0 disabled:opacity-60 shadow-2xs"
          title="Refresh Open-Meteo live data"
        >
          <RefreshCw className={`w-3.5 h-3.5 text-emerald-600 shrink-0 ${loading ? 'animate-spin' : ''}`} />
          <span className="text-[11px] sm:text-xs">{loading ? 'Updating...' : 'Refresh'}</span>
        </button>
      </div>

      {/* Loading Skeleton State */}
      {loading && !weatherData && (
        <div className="p-6 text-center space-y-3">
          <div className="w-10 h-10 border-3 border-emerald-600 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-xs font-bold text-slate-700">
            Fetching real-time weather from Open-Meteo...
          </p>
          <p className="text-[11px] text-slate-400">
            Connecting to grid coordinates 16.83°N, 75.72°E (Asia/Kolkata)
          </p>
        </div>
      )}

      {/* Error & Retry State */}
      {error && !weatherData && (
        <div className="p-5 space-y-3">
          <div className="flex items-start gap-3 p-3.5 rounded-2xl bg-red-50 border border-red-200 text-xs text-red-800">
            <AlertCircle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <span className="font-bold text-red-900 block">Weather Connection Failed</span>
              <p className="leading-relaxed">{error}</p>
            </div>
          </div>
          <button
            onClick={loadWeather}
            className="w-full py-2.5 rounded-xl bg-[#14492a] hover:bg-[#0e3a20] text-white text-xs font-bold transition flex items-center justify-center gap-2"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Retry Connection to Open-Meteo</span>
          </button>
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
                  <strong>Stale Data Warning:</strong> Live refresh failed{error ? ` (${error})` : ''}. Displaying cached Open-Meteo readings from {weatherData.lastUpdatedIST}.
                </span>
              </div>
              <button
                onClick={loadWeather}
                disabled={loading}
                className="text-[11px] font-bold text-amber-900 underline shrink-0 hover:text-amber-950 disabled:opacity-50"
              >
                Retry
              </button>
            </div>
          )}

          {/* Real Live Hero Header */}
          <div className="p-4 sm:p-5 bg-gradient-to-br from-[#124429] via-[#0f3e25] to-[#0a2c19] text-white space-y-4">
            {/* Source & Verified Indicator */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5 text-xs">
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="px-2 py-0.5 rounded-md bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[10px] font-bold uppercase tracking-wider flex items-center gap-1 shrink-0">
                  <CheckCircle2 className="w-3 h-3 text-emerald-300 shrink-0" />
                  <span>Real Open-Meteo Data</span>
                </span>
                <span className="text-[11px] text-emerald-200/90 truncate">
                  Updated: {weatherData.lastUpdatedIST}
                </span>
              </div>

              <a
                href="https://open-meteo.com"
                target="_blank"
                rel="noreferrer"
                className="text-[10px] text-emerald-300 hover:text-emerald-100 flex items-center gap-1 underline underline-offset-2 self-start sm:self-auto"
              >
                <span>Data Source: Open-Meteo.com</span>
                <ExternalLink className="w-2.5 h-2.5" />
              </a>
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

              <div className="bg-white/5 rounded-xl p-2 text-center border border-white/5 min-w-0">
                <Thermometer className="w-3.5 h-3.5 text-amber-300 mx-auto mb-0.5 shrink-0" />
                <div className="text-[9px] sm:text-[10px] text-emerald-200 truncate">Soil Temp (0cm)</div>
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

          {/* Sub-view 2: Hourly Forecast Strip (Next 24h) */}
          {activeTab === 'hourly' && (
            <div className="p-4 space-y-2.5">
              <div className="flex items-center justify-between text-xs text-slate-500">
                <span className="font-semibold text-slate-700">Next 24-Hour Progression</span>
                <span>Coordinates: 16.83°N, 75.72°E</span>
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

          {/* Sub-view 3: Modelled Soil Estimates */}
          {activeTab === 'soilModel' && (
            <div className="p-4 sm:p-5 space-y-3.5">
              {/* Mandatory Scientific Transparency Notice */}
              <div className="p-3.5 rounded-2xl bg-amber-50 border border-amber-200 text-xs text-amber-900 space-y-1">
                <div className="flex items-center gap-1.5 font-bold text-amber-950">
                  <Layers className="w-4 h-4 text-amber-700 shrink-0" />
                  <span>Modelled Estimates Only — Not In-Field Laboratory Results</span>
                </div>
                <p className="leading-relaxed">
                  These soil temperature and volumetric moisture readings are derived from numerical land-surface models for the Vijayapura grid cell (16.83°N, 75.72°E) from Open-Meteo. They are <strong>not physical sensor readings of your specific plot</strong>.
                </p>
                <p className="text-[11px] text-amber-800 pt-1 font-medium">
                  Notice: Chemical attributes (soil pH, Nitrogen, Phosphorus, Potassium, Organic Carbon) cannot be measured by satellite or weather models and require laboratory soil testing (e.g. Soil Health Card).
                </p>
              </div>

              {/* Data Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                <div className="p-3 rounded-2xl bg-[#f8faf6] border border-[#dce8d5] text-center">
                  <span className="text-[10px] text-slate-400 font-bold block uppercase">
                    Surface Soil Temp
                  </span>
                  <span className="text-base font-extrabold text-[#113d23] tabular-nums block mt-1">
                    {weatherData.current.soilTemperature0cm !== undefined
                      ? `${weatherData.current.soilTemperature0cm}°C`
                      : 'Unavailable'}
                  </span>
                  <span className="text-[10px] text-slate-500">Depth: 0 cm</span>
                </div>

                <div className="p-3 rounded-2xl bg-[#f8faf6] border border-[#dce8d5] text-center">
                  <span className="text-[10px] text-slate-400 font-bold block uppercase">
                    Subsurface Soil Temp
                  </span>
                  <span className="text-base font-extrabold text-[#113d23] tabular-nums block mt-1">
                    {weatherData.current.soilTemperature6cm !== undefined
                      ? `${weatherData.current.soilTemperature6cm}°C`
                      : 'Unavailable'}
                  </span>
                  <span className="text-[10px] text-slate-500">Depth: 6 cm</span>
                </div>

                <div className="p-3 rounded-2xl bg-[#f8faf6] border border-[#dce8d5] text-center">
                  <span className="text-[10px] text-slate-400 font-bold block uppercase">
                    Modelled Soil Moisture
                  </span>
                  <span className="text-base font-extrabold text-slate-800 tabular-nums block mt-1">
                    {weatherData.current.soilMoisture0to1cm !== undefined
                      ? `${weatherData.current.soilMoisture0to1cm} m³/m³`
                      : 'Unavailable'}
                  </span>
                  <span className="text-[10px] text-slate-500">Depth: 0–1 cm</span>
                </div>

                <div className="p-3 rounded-2xl bg-[#f8faf6] border border-[#dce8d5] text-center">
                  <span className="text-[10px] text-slate-400 font-bold block uppercase">
                    Modelled Root Moisture
                  </span>
                  <span className="text-base font-extrabold text-slate-800 tabular-nums block mt-1">
                    {weatherData.current.soilMoisture1to3cm !== undefined
                      ? `${weatherData.current.soilMoisture1to3cm} m³/m³`
                      : 'Unavailable'}
                  </span>
                  <span className="text-[10px] text-slate-500">Depth: 1–3 cm</span>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

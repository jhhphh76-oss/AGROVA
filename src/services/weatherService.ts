import { CurrentWeatherReport, HourlyForecastPoint, WeatherDataState } from '../types';

const OPEN_METEO_BASE_URL = 'https://api.open-meteo.com/v1/forecast';
const GEOCODING_BASE_URL = 'https://geocoding-api.open-meteo.com/v1/search';

export interface GeocodedLocation {
  latitude: number;
  longitude: number;
  locationName: string;
  city: string;
  region: string;
  country: string;
}

export const POPULAR_KARNATAKA_CITIES: {
  name: string;
  latitude: number;
  longitude: number;
  city: string;
  region: string;
  country: string;
  label: string;
}[] = [
  { name: 'Vijayapura', latitude: 16.83, longitude: 75.72, city: 'Vijayapura', region: 'Karnataka', country: 'India', label: 'Vijayapura, Karnataka, India' },
  { name: 'Bengaluru', latitude: 12.97, longitude: 77.59, city: 'Bengaluru', region: 'Karnataka', country: 'India', label: 'Bengaluru, Karnataka, India' },
  { name: 'Mysuru', latitude: 12.30, longitude: 76.64, city: 'Mysuru', region: 'Karnataka', country: 'India', label: 'Mysuru, Karnataka, India' },
  { name: 'Hubballi-Dharwad', latitude: 15.36, longitude: 75.12, city: 'Hubballi-Dharwad', region: 'Karnataka', country: 'India', label: 'Hubballi-Dharwad, Karnataka, India' },
  { name: 'Belagavi', latitude: 15.85, longitude: 74.50, city: 'Belagavi', region: 'Karnataka', country: 'India', label: 'Belagavi, Karnataka, India' },
  { name: 'Kalaburagi', latitude: 17.33, longitude: 76.83, city: 'Kalaburagi', region: 'Karnataka', country: 'India', label: 'Kalaburagi, Karnataka, India' },
  { name: 'Shivamogga', latitude: 13.93, longitude: 75.57, city: 'Shivamogga', region: 'Karnataka', country: 'India', label: 'Shivamogga, Karnataka, India' },
  { name: 'Ballari', latitude: 15.14, longitude: 76.92, city: 'Ballari', region: 'Karnataka', country: 'India', label: 'Ballari, Karnataka, India' },
  { name: 'Davanagere', latitude: 14.46, longitude: 75.92, city: 'Davanagere', region: 'Karnataka', country: 'India', label: 'Davanagere, Karnataka, India' },
  { name: 'Mangaluru', latitude: 12.91, longitude: 74.86, city: 'Mangaluru', region: 'Karnataka', country: 'India', label: 'Mangaluru, Karnataka, India' },
];

// Preserved fallback coordinates for backwards compatibility
export const VIJAYAPURA_COORDS = {
  latitude: 16.83,
  longitude: 75.72,
  city: 'Vijayapura',
  region: 'Karnataka',
  country: 'India',
  locationName: 'Vijayapura, Karnataka, India',
};

// Official WMO Weather interpretation codes
export function interpretWmoCode(code: number): { description: string; iconType: 'sun' | 'cloud' | 'rain' | 'storm' | 'fog' } {
  switch (code) {
    case 0:
      return { description: 'Clear sky', iconType: 'sun' };
    case 1:
      return { description: 'Mainly clear', iconType: 'sun' };
    case 2:
      return { description: 'Partly cloudy', iconType: 'cloud' };
    case 3:
      return { description: 'Overcast', iconType: 'cloud' };
    case 45:
    case 48:
      return { description: 'Fog / Rime fog', iconType: 'fog' };
    case 51:
      return { description: 'Light drizzle', iconType: 'rain' };
    case 53:
      return { description: 'Moderate drizzle', iconType: 'rain' };
    case 55:
      return { description: 'Dense drizzle', iconType: 'rain' };
    case 61:
      return { description: 'Slight rain', iconType: 'rain' };
    case 63:
      return { description: 'Moderate rain', iconType: 'rain' };
    case 65:
      return { description: 'Heavy rain', iconType: 'rain' };
    case 80:
      return { description: 'Light rain showers', iconType: 'rain' };
    case 81:
      return { description: 'Moderate rain showers', iconType: 'rain' };
    case 82:
      return { description: 'Violent rain showers', iconType: 'rain' };
    case 95:
      return { description: 'Thunderstorm', iconType: 'storm' };
    case 96:
    case 99:
      return { description: 'Thunderstorm with hail', iconType: 'storm' };
    default:
      return { description: 'Partly cloudy', iconType: 'cloud' };
  }
}

/**
 * Formats Open-Meteo's observation timestamp (ISO like '2026-10-13T15:45')
 * into a clear readable format that includes the location's local timezone.
 */
export function formatObservationTime(rawIsoTime: string, tzAbbrev?: string, tzName?: string): string {
  try {
    if (!rawIsoTime) return 'Current';
    const parts = rawIsoTime.split('T');
    const datePart = parts[0];
    const timePart = parts[1] || '';
    const [year, month, day] = datePart.split('-').map(Number);
    const [hour, minute] = timePart.split(':').map(Number);
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const monthName = months[month - 1] || '';
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const hour12 = hour % 12 === 0 ? 12 : hour % 12;
    const minuteStr = String(minute).padStart(2, '0');
    const tzLabel = tzAbbrev || tzName || '';
    return `${day} ${monthName} ${year}, ${hour12}:${minuteStr} ${ampm}${tzLabel ? ` (${tzLabel})` : ''}`;
  } catch {
    return rawIsoTime;
  }
}

/**
 * Formats the timestamp when the client application fetched or refreshed the data.
 */
export function formatFetchTime(date: Date): string {
  try {
    const formatter = new Intl.DateTimeFormat('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    });
    return formatter.format(date);
  } catch {
    return date.toLocaleString();
  }
}

// Format timestamp specifically in India Standard Time (IST, GMT+5:30) for backwards compatibility
export function formatToIST(dateObj: Date): string {
  try {
    const formatter = new Intl.DateTimeFormat('en-IN', {
      timeZone: 'Asia/Kolkata',
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    });
    return `${formatter.format(dateObj)} IST`;
  } catch {
    return `${dateObj.toLocaleString()} (IST)`;
  }
}

export function getWeatherCacheKey(latitude: number, longitude: number): string {
  return `agrova_weather_cache_${latitude.toFixed(2)}_${longitude.toFixed(2)}`;
}

export const weatherService = {
  /**
   * Geocodes a city name to its verified latitude, longitude, and formatted name.
   * Resolves city, region, and country accurately.
   */
  async geocodeCity(query: string): Promise<GeocodedLocation> {
    const raw = (query || '').trim();
    if (!raw) {
      throw new Error('City name cannot be empty.');
    }

    // Strip trailing state/country suffixes for normalized lookup
    const clean = raw
      .replace(/,\s*karnataka.*$/i, '')
      .replace(/,\s*india.*$/i, '')
      .trim();

    const normalizedKey = clean.toLowerCase().replace(/[^a-z0-9]/g, '');

    // 1. Check verified popular cities list
    const found = POPULAR_KARNATAKA_CITIES.find(
      (c) =>
        c.name.toLowerCase().replace(/[^a-z0-9]/g, '') === normalizedKey ||
        c.label.toLowerCase().includes(normalizedKey)
    );
    if (found) {
      return {
        latitude: found.latitude,
        longitude: found.longitude,
        city: found.city,
        region: found.region,
        country: found.country,
        locationName: found.label,
      };
    }

    // 2. Check common spelling aliases
    const aliases: Record<string, { lat: number; lon: number; city: string; region: string; country: string; label: string }> = {
      bijapur: { lat: 16.83, lon: 75.72, city: 'Vijayapura', region: 'Karnataka', country: 'India', label: 'Vijayapura, Karnataka, India' },
      bangalore: { lat: 12.97, lon: 77.59, city: 'Bengaluru', region: 'Karnataka', country: 'India', label: 'Bengaluru, Karnataka, India' },
      mysore: { lat: 12.30, lon: 76.64, city: 'Mysuru', region: 'Karnataka', country: 'India', label: 'Mysuru, Karnataka, India' },
      gulbarga: { lat: 17.33, lon: 76.83, city: 'Kalaburagi', region: 'Karnataka', country: 'India', label: 'Kalaburagi, Karnataka, India' },
      belgaum: { lat: 15.85, lon: 74.50, city: 'Belagavi', region: 'Karnataka', country: 'India', label: 'Belagavi, Karnataka, India' },
      shimoga: { lat: 13.93, lon: 75.57, city: 'Shivamogga', region: 'Karnataka', country: 'India', label: 'Shivamogga, Karnataka, India' },
      bellary: { lat: 15.14, lon: 76.92, city: 'Ballari', region: 'Karnataka', country: 'India', label: 'Ballari, Karnataka, India' },
      mangalore: { lat: 12.91, lon: 74.86, city: 'Mangaluru', region: 'Karnataka', country: 'India', label: 'Mangaluru, Karnataka, India' },
      hubli: { lat: 15.36, lon: 75.12, city: 'Hubballi-Dharwad', region: 'Karnataka', country: 'India', label: 'Hubballi-Dharwad, Karnataka, India' },
      dharwad: { lat: 15.46, lon: 75.01, city: 'Dharwad', region: 'Karnataka', country: 'India', label: 'Dharwad, Karnataka, India' },
    };
    if (aliases[normalizedKey]) {
      const a = aliases[normalizedKey];
      return {
        latitude: a.lat,
        longitude: a.lon,
        city: a.city,
        region: a.region,
        country: a.country,
        locationName: a.label,
      };
    }

    // 3. Dynamic lookup using Open-Meteo Geocoding API
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 8000);
      const geoUrl = `${GEOCODING_BASE_URL}?name=${encodeURIComponent(clean)}&count=10&language=en&format=json`;
      const res = await fetch(geoUrl, { signal: controller.signal });
      clearTimeout(timeoutId);

      if (!res.ok) {
        throw new Error(`Geocoding HTTP error ${res.status}`);
      }

      const data = await res.json();
      if (Array.isArray(data.results) && data.results.length > 0) {
        // If searching a query without explicit country, prefer Indian city if available
        const indianMatch = data.results.find((r: any) => r.country_code === 'IN');
        const match = indianMatch || data.results[0];

        const city = match.name || clean;
        const region = match.admin1 || '';
        const country = match.country || '';
        const locationName = [city, region, country].filter(Boolean).join(', ');

        return {
          latitude: Math.round(match.latitude * 100) / 100,
          longitude: Math.round(match.longitude * 100) / 100,
          city,
          region,
          country,
          locationName,
        };
      }
    } catch (apiErr: any) {
      if (apiErr.name === 'AbortError') {
        throw new Error(`Geocoding request for "${query}" timed out.`);
      }
      console.warn('Geocoding API request failed:', apiErr);
      throw new Error(`Could not resolve location coordinates for "${query}": ${apiErr.message}`);
    }

    throw new Error(`Location "${query}" was not found. Please select or enter a valid city.`);
  },

  /**
   * Reverse geocodes coordinates to a real city, region, and country name.
   */
  async reverseGeocode(latitude: number, longitude: number): Promise<GeocodedLocation> {
    // 1. Check if coordinates are close to one of our popular cities (< 0.15 deg ~= 15 km)
    const nearby = POPULAR_KARNATAKA_CITIES.find(
      (c) => Math.hypot(c.latitude - latitude, c.longitude - longitude) < 0.15
    );
    if (nearby) {
      return {
        latitude: nearby.latitude,
        longitude: nearby.longitude,
        city: nearby.city,
        region: nearby.region,
        country: nearby.country,
        locationName: nearby.label,
      };
    }

    // 2. Try OpenStreetMap Nominatim reverse geocode with proper User-Agent
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 6000);
      const res = await fetch(
        `https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json`,
        {
          headers: { 'User-Agent': 'AGROVA-Agri-Weather/1.0' },
          signal: controller.signal,
        }
      );
      clearTimeout(timeout);
      if (res.ok) {
        const data = await res.json();
        const addr = data.address || {};
        const city = addr.city || addr.town || addr.village || addr.county || addr.suburb || 'Detected Location';
        const region = addr.state || addr.region || '';
        const country = addr.country || '';
        const locationName = [city, region, country].filter(Boolean).join(', ');
        return {
          latitude: Math.round(latitude * 100) / 100,
          longitude: Math.round(longitude * 100) / 100,
          city,
          region,
          country,
          locationName,
        };
      }
    } catch (err) {
      console.warn('Reverse geocode lookup error:', err);
    }

    // 3. Fallback to precise coordinate representation
    const latStr = `${Math.abs(latitude).toFixed(2)}°${latitude >= 0 ? 'N' : 'S'}`;
    const lonStr = `${Math.abs(longitude).toFixed(2)}°${longitude >= 0 ? 'E' : 'W'}`;
    return {
      latitude: Math.round(latitude * 100) / 100,
      longitude: Math.round(longitude * 100) / 100,
      city: `Coordinates (${latStr}, ${lonStr})`,
      region: '',
      country: '',
      locationName: `Coordinates (${latStr}, ${lonStr})`,
    };
  },

  /**
   * Fetches real current weather and hourly forecasts from Open-Meteo for the specified coordinates.
   * Uses timezone='auto' for accurate timezone resolution worldwide.
   * Stored in a coordinate-specific cache key to prevent cross-city cache corruption.
   */
  async fetchLiveWeather(
    latitude: number,
    longitude: number,
    locationName: string,
    signal?: AbortSignal,
    extraLocation?: { city?: string; region?: string; country?: string }
  ): Promise<WeatherDataState> {
    const latFixed = latitude.toFixed(2);
    const lonFixed = longitude.toFixed(2);
    const cacheKey = getWeatherCacheKey(latitude, longitude);

    const params = new URLSearchParams({
      latitude: latFixed,
      longitude: lonFixed,
      current: [
        'temperature_2m',
        'relative_humidity_2m',
        'dew_point_2m',
        'precipitation_probability',
        'weather_code',
        'wind_speed_10m',
        'soil_temperature_0cm',
        'soil_temperature_6cm',
        'soil_moisture_0_to_1cm',
        'soil_moisture_1_to_3cm',
      ].join(','),
      hourly: [
        'temperature_2m',
        'relative_humidity_2m',
        'precipitation_probability',
        'wind_speed_10m',
        'weather_code',
      ].join(','),
      timezone: 'auto', // Automatically resolves the exact timezone of the target coordinates
      forecast_days: '2',
    });

    const apiUrl = `${OPEN_METEO_BASE_URL}?${params.toString()}`;

    try {
      const controller = new AbortController();
      const internalTimeout = setTimeout(() => controller.abort(), 12000); // 12 second timeout

      // Combine caller signal with timeout
      const effectiveSignal = signal || controller.signal;
      if (signal) {
        signal.addEventListener('abort', () => controller.abort(), { once: true });
      }

      const response = await fetch(apiUrl, { signal: effectiveSignal });
      clearTimeout(internalTimeout);

      if (!response.ok) {
        throw new Error(`Open-Meteo HTTP error ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();

      if (!data.current) {
        throw new Error('Open-Meteo API response missing current weather block.');
      }

      const currentRaw = data.current;
      const weatherCode = typeof currentRaw.weather_code === 'number' ? currentRaw.weather_code : 0;
      const weatherInterpretation = interpretWmoCode(weatherCode);

      const resolvedTimezone: string = data.timezone || 'UTC';
      const resolvedTzAbbrev: string = data.timezone_abbreviation || '';
      const utcOffsetSeconds: number = data.utc_offset_seconds || 0;

      // Format distinct timestamps:
      // 1. Observation timestamp of the recorded/modeled weather values
      const weatherObservationTime = formatObservationTime(
        currentRaw.time,
        resolvedTzAbbrev,
        resolvedTimezone
      );

      // 2. Client fetch/update timestamp
      const dataFetchTime = formatFetchTime(new Date());

      // Build current report safely with fallbacks for optional fields
      const currentReport: CurrentWeatherReport = {
        time: currentRaw.time || new Date().toISOString(),
        temperature: Math.round((currentRaw.temperature_2m ?? 0) * 10) / 10,
        humidity: Math.round(currentRaw.relative_humidity_2m ?? 0),
        dewPoint: Math.round((currentRaw.dew_point_2m ?? 0) * 10) / 10,
        windSpeed: Math.round((currentRaw.wind_speed_10m ?? 0) * 10) / 10,
        precipitationProbability: Math.round(currentRaw.precipitation_probability ?? 0),
        weatherCode,
        weatherDescription: weatherInterpretation.description,
        soilTemperature0cm:
          typeof currentRaw.soil_temperature_0cm === 'number'
            ? Math.round(currentRaw.soil_temperature_0cm * 10) / 10
            : undefined,
        soilTemperature6cm:
          typeof currentRaw.soil_temperature_6cm === 'number'
            ? Math.round(currentRaw.soil_temperature_6cm * 10) / 10
            : undefined,
        soilMoisture0to1cm:
          typeof currentRaw.soil_moisture_0_to_1cm === 'number'
            ? Math.round(currentRaw.soil_moisture_0_to_1cm * 1000) / 1000
            : undefined,
        soilMoisture1to3cm:
          typeof currentRaw.soil_moisture_1_to_3cm === 'number'
            ? Math.round(currentRaw.soil_moisture_1_to_3cm * 1000) / 1000
            : undefined,
      };

      // Process hourly forecast points (next 24 hourly periods)
      const hourlyList: HourlyForecastPoint[] = [];
      if (data.hourly && Array.isArray(data.hourly.time)) {
        const times: string[] = data.hourly.time;
        const temps: number[] = data.hourly.temperature_2m || [];
        const humids: number[] = data.hourly.relative_humidity_2m || [];
        const winds: number[] = data.hourly.wind_speed_10m || [];
        const rainProbs: number[] = data.hourly.precipitation_probability || [];
        const codes: number[] = data.hourly.weather_code || [];

        // Find current time index or start from now
        const nowHourStr = currentRaw.time ? currentRaw.time.substring(0, 13) : '';
        let startIndex = times.findIndex((t) => t.startsWith(nowHourStr));
        if (startIndex < 0) startIndex = 0;

        for (let i = startIndex; i < Math.min(times.length, startIndex + 24); i++) {
          const rawTime = times[i];
          const hourPart = rawTime ? rawTime.split('T')[1] || '' : '';
          const hourNum = parseInt(hourPart.split(':')[0], 10);
          const ampm = hourNum >= 12 ? 'PM' : 'AM';
          const hour12 = hourNum % 12 === 0 ? 12 : hourNum % 12;
          const label = i === startIndex ? 'Now' : `${hour12} ${ampm}`;

          hourlyList.push({
            time: rawTime,
            hourLabel: label,
            temperature: Math.round(temps[i] ?? 0),
            humidity: Math.round(humids[i] ?? 0),
            windSpeed: Math.round((winds[i] ?? 0) * 10) / 10,
            precipitationProbability: Math.round(rainProbs[i] ?? 0),
            weatherCode: codes[i] ?? 0,
          });
        }
      }

      const weatherResult: WeatherDataState = {
        current: currentReport,
        hourly: hourlyList,
        lastUpdatedIST: formatToIST(new Date()),
        dataFetchTime,
        weatherObservationTime,
        timezone: resolvedTimezone,
        timezoneAbbreviation: resolvedTzAbbrev,
        utcOffsetSeconds,
        dataSource: 'Open-Meteo Weather API (open-meteo.com)',
        latitude,
        longitude,
        locationName,
        city: extraLocation?.city,
        region: extraLocation?.region,
        country: extraLocation?.country,
        isStale: false,
      };

      // Cache valid result in localStorage under specific city/coordinate key
      try {
        if (typeof localStorage !== 'undefined') {
          localStorage.setItem(cacheKey, JSON.stringify(weatherResult));
        }
      } catch (cacheErr) {
        console.warn('Unable to persist weather cache to localStorage', cacheErr);
      }

      return weatherResult;
    } catch (err: any) {
      if (err.name === 'AbortError') {
        throw err;
      }
      console.error(`Open-Meteo live request failed for ${locationName} (${latFixed}, ${lonFixed}):`, err);

      // Attempt to load previously cached data ONLY for THIS EXACT location
      try {
        if (typeof localStorage !== 'undefined') {
          const cachedStr = localStorage.getItem(cacheKey);
          if (cachedStr) {
            const cached: WeatherDataState = JSON.parse(cachedStr);
            // Strictly verify cache coordinates match requested coordinates to prevent wrong city display
            if (
              Math.abs(cached.latitude - latitude) < 0.05 &&
              Math.abs(cached.longitude - longitude) < 0.05
            ) {
              return {
                ...cached,
                isStale: true,
              };
            }
          }
        }
      } catch {
        // cache parse failed
      }

      // If no valid cache for THIS city, throw clear error (never silently display another city!)
      throw new Error(
        err.message || `Unable to connect to Open-Meteo Weather API for ${locationName}. Please check internet connection.`
      );
    }
  },

  // Generate responsible, weather-only agronomic observations
  generateWeatherAdvisory(current: CurrentWeatherReport): {
    advisory: string;
    cautionNote: string;
    isCaution: boolean;
  } {
    const { windSpeed, precipitationProbability, temperature } = current;

    let advisory = '';
    let isCaution = false;

    if (windSpeed > 16) {
      advisory = `Elevated wind speed (${windSpeed} km/h). Increased risk of foliar spray drift. Avoid spraying high-potency chemicals during strong gust periods.`;
      isCaution = true;
    } else if (precipitationProbability > 40) {
      advisory = `High precipitation probability (${precipitationProbability}%). Rain could wash off applied foliar sprays before rainfast period. Monitor sky conditions before mixing tanks.`;
      isCaution = true;
    } else if (temperature > 34) {
      advisory = `High ambient temperature (${temperature}°C). Spray droplets evaporate rapidly in midday heat. Early morning or late evening operations reduce evaporation and crop burn.`;
      isCaution = true;
    } else if (windSpeed <= 14 && precipitationProbability <= 20) {
      advisory = `Wind speeds (${windSpeed} km/h) and rain probability (${precipitationProbability}%) are within standard operational ranges for field work.`;
      isCaution = false;
    } else {
      advisory = `Current conditions: ${temperature}°C, ${windSpeed} km/h wind, ${precipitationProbability}% precipitation chance. Plan field operations in accordance with local farm observations.`;
      isCaution = false;
    }

    const cautionNote =
      'Weather-based guidance only. Do not treat as a guaranteed spraying window. In-field wind gusts, crop growth stage, specific pesticide label directions, and Krishi Vigyan Kendra (KVK) recommendations must always be verified.';

    return { advisory, cautionNote, isCaution };
  },
};

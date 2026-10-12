import { CurrentWeatherReport, HourlyForecastPoint, WeatherDataState } from '../types';

const OPEN_METEO_BASE_URL = 'https://api.open-meteo.com/v1/forecast';
const WEATHER_CACHE_KEY = 'agrova_weather_open_meteo_cache_v1';

export const VIJAYAPURA_COORDS = {
  latitude: 16.83,
  longitude: 75.72,
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

// Format timestamp specifically in India Standard Time (IST, GMT+5:30)
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

export const weatherService = {
  async fetchLiveWeather(
    latitude: number = VIJAYAPURA_COORDS.latitude,
    longitude: number = VIJAYAPURA_COORDS.longitude,
    locationName: string = VIJAYAPURA_COORDS.locationName
  ): Promise<WeatherDataState> {
    const params = new URLSearchParams({
      latitude: latitude.toFixed(2),
      longitude: longitude.toFixed(2),
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
      timezone: 'Asia/Kolkata',
      forecast_days: '2',
    });

    const apiUrl = `${OPEN_METEO_BASE_URL}?${params.toString()}`;

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 12000); // 12 second timeout

      const response = await fetch(apiUrl, { signal: controller.signal });
      clearTimeout(timeoutId);

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
        latitude,
        longitude,
        locationName,
        isStale: false,
      };

      // Cache valid result in localStorage
      try {
        localStorage.setItem(WEATHER_CACHE_KEY, JSON.stringify(weatherResult));
      } catch (cacheErr) {
        console.warn('Unable to persist weather cache to localStorage', cacheErr);
      }

      return weatherResult;
    } catch (err: any) {
      console.error('Open-Meteo live request failed:', err);

      // Attempt to load previously cached data with stale warning
      try {
        const cachedStr = localStorage.getItem(WEATHER_CACHE_KEY);
        if (cachedStr) {
          const cached: WeatherDataState = JSON.parse(cachedStr);
          return {
            ...cached,
            isStale: true,
          };
        }
      } catch {
        // cache parse failed
      }

      // If no cached data exists, rethrow error for the UI error/retry state
      throw new Error(
        err.message || 'Unable to connect to Open-Meteo Weather API. Please check internet connection.'
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

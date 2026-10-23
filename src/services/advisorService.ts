import { AdvisorMessage, WeatherDataState, FarmingAdvisoryReport, SupportedLanguage } from '../types';

export interface ConsultAdvisorParams {
  messages: { role: 'user' | 'assistant'; content: string }[];
  sharedScanContext?: {
    type: 'plant' | 'soil';
    summary: string;
    scanRecordId?: string;
    photoUrl?: string;
  };
  weatherContext?: {
    temperature: number;
    weatherDescription: string;
    humidity: number;
    windSpeed: number;
    precipitationProbability: number;
  };
  locationContext?: string;
  language?: string;
}

export interface FetchFarmingAdvisoryParams {
  weather: any;
  cropName?: string;
  variety?: string;
  growthStage?: string;
  location?: string;
  language?: SupportedLanguage;
}

export const advisorService = {
  async consultAdvisor(
    params: ConsultAdvisorParams
  ): Promise<{ success: boolean; reply?: string; error?: string; aiUnavailable?: boolean }> {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 35000);

      const response = await fetch('/api/advisor-chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(params),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);
      let data: any = null;
      const contentType = response.headers.get('content-type') || '';
      if (contentType.includes('application/json')) {
        try {
          data = await response.json();
        } catch (e) {
          console.warn('Failed to parse advisor response as JSON:', e);
        }
      }

      if (!response.ok) {
        const errMessage = data?.error?.message || (typeof data?.error === 'string' ? data.error : null) || `Server returned error (${response.status})`;
        return {
          success: false,
          error: errMessage,
          aiUnavailable: Boolean(data?.aiUnavailable || response.status === 503),
        };
      }

      if (!data?.success || !data?.reply) {
        const errMessage = data?.error?.message || (typeof data?.error === 'string' ? data.error : null) || 'No response returned by AI advisor.';
        return {
          success: false,
          error: errMessage,
          aiUnavailable: Boolean(data?.aiUnavailable),
        };
      }

      return {
        success: true,
        reply: data.reply,
      };
    } catch (err: any) {
      if (err.name === 'AbortError') {
        return {
          success: false,
          error: 'AI Advisor request timed out. Please check your internet connection.',
        };
      }
      return {
        success: false,
        error: err.message || 'Unable to connect to AI Advisor service.',
      };
    }
  },

  async fetchFarmingAdvisory(
    params: FetchFarmingAdvisoryParams
  ): Promise<{ success: boolean; advisory?: FarmingAdvisoryReport; error?: string; warning?: string }> {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 20000);

      const response = await fetch('/api/farming-advisory', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(params),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);
      const data = await response.json();

      if (!response.ok || !data?.success) {
        return {
          success: false,
          error: data?.error || `Server error (${response.status})`,
        };
      }

      return {
        success: true,
        advisory: data.advisory,
        warning: data.warning,
      };
    } catch (err: any) {
      if (err.name === 'AbortError') {
        return {
          success: false,
          error: 'Farming Advisory request timed out. Please check your connection.',
        };
      }
      return {
        success: false,
        error: err.message || 'Unable to connect to Farming Advisory service.',
      };
    }
  },
};

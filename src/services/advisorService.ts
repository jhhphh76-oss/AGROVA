import { AdvisorMessage, WeatherDataState } from '../types';

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
      const data = await response.json();

      if (!response.ok) {
        return {
          success: false,
          error: data.error || `Server returned error (${response.status})`,
          aiUnavailable: Boolean(data.aiUnavailable),
        };
      }

      if (!data.success || !data.reply) {
        return {
          success: false,
          error: data.error || 'No response returned by AI advisor.',
          aiUnavailable: Boolean(data.aiUnavailable),
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
};

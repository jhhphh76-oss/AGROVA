import { SoilAiAnalysis } from '../types';

export interface ImageProcessResult {
  base64: string;
  mimeType: string;
  dataUrl: string;
  width: number;
  height: number;
  sizeBytes: number;
  fileName: string;
}

export const soilScanService = {
  validateImageFile(file: File): { valid: boolean; error?: string } {
    const validMimes = ['image/jpeg', 'image/png', 'image/webp'];
    const validExts = ['.jpg', '.jpeg', '.png', '.webp'];

    const hasValidMime = validMimes.includes(file.type.toLowerCase());
    const hasValidExt = validExts.some((ext) => file.name.toLowerCase().endsWith(ext));

    if (!hasValidMime && !hasValidExt) {
      return {
        valid: false,
        error: 'Unsupported image format. Please select or take a JPEG, PNG, or WebP photo.',
      };
    }

    // 10 MB maximum limit
    const MAX_BYTES = 10 * 1024 * 1024;
    if (file.size > MAX_BYTES) {
      const sizeMb = (file.size / (1024 * 1024)).toFixed(1);
      return {
        valid: false,
        error: `File is too large (${sizeMb} MB). Maximum allowed size is 10 MB.`,
      };
    }

    if (file.size === 0) {
      return {
        valid: false,
        error: 'The selected image file is empty (0 bytes). Please choose another photo.',
      };
    }

    return { valid: true };
  },

  async processImageFile(file: File, maxDimension = 1600, quality = 0.85): Promise<ImageProcessResult> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onerror = () => reject(new Error('Failed to read image file from device.'));
      reader.onload = () => {
        const rawDataUrl = reader.result as string;
        const img = new Image();
        img.onerror = () => reject(new Error('Unable to decode the image. The file may be corrupted.'));
        img.onload = () => {
          let { width, height } = img;

          // Scale down if larger than maxDimension
          if (width > maxDimension || height > maxDimension) {
            if (width > height) {
              height = Math.round((height * maxDimension) / width);
              width = maxDimension;
            } else {
              width = Math.round((width * maxDimension) / height);
              height = maxDimension;
            }
          }

          const canvas = document.createElement('canvas');
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          if (!ctx) {
            reject(new Error('Canvas 2D context not available.'));
            return;
          }

          // Draw image to canvas
          ctx.drawImage(img, 0, 0, width, height);

          // Use image/jpeg for optimized compressed payload, or webp if original is webp
          const targetMime = file.type === 'image/webp' ? 'image/webp' : 'image/jpeg';
          const optimizedDataUrl = canvas.toDataURL(targetMime, quality);
          const base64Data = optimizedDataUrl.split(',')[1] || '';

          resolve({
            base64: base64Data,
            mimeType: targetMime,
            dataUrl: optimizedDataUrl,
            width,
            height,
            sizeBytes: Math.round((base64Data.length * 3) / 4),
            fileName: file.name,
          });
        };
        img.src = rawDataUrl;
      };
      reader.readAsDataURL(file);
    });
  },

  async analyzeSoilPhoto(
    imageBase64: string,
    mimeType: string,
    farmContext?: {
      fieldName?: string;
      villageOrDistrict?: string;
      state?: string;
      primarySoilType?: string;
    }
  ): Promise<{ success: boolean; analysis?: SoilAiAnalysis; error?: string; aiUnavailable?: boolean }> {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 35000); // 35s timeout for AI vision

      const response = await fetch('/api/analyze-soil', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          imageBase64,
          mimeType,
          farmContext,
        }),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      let data: any = null;
      const contentType = response.headers.get('content-type') || '';
      if (contentType.includes('application/json')) {
        try {
          data = await response.json();
        } catch (e) {
          console.warn('Failed to parse soil analysis JSON response:', e);
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

      if (!data?.success || !data?.analysis) {
        const errMessage = data?.error?.message || (typeof data?.error === 'string' ? data.error : null) || 'Invalid analysis response structure received from server.';
        return {
          success: false,
          error: errMessage,
          aiUnavailable: Boolean(data?.aiUnavailable),
        };
      }

      return {
        success: true,
        analysis: data.analysis,
      };
    } catch (err: any) {
      if (err.name === 'AbortError') {
        return {
          success: false,
          error: 'Soil analysis request timed out. Please check your internet connection and try again.',
        };
      }
      return {
        success: false,
        error: err.message || 'Unable to connect to analysis server. Please check your connection.',
      };
    }
  },

  async createStorageThumbnail(dataUrl: string, maxDim = 320): Promise<string> {
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => {
        let { width, height } = img;
        if (width > maxDim || height > maxDim) {
          if (width > height) {
            height = Math.round((height * maxDim) / width);
            width = maxDim;
          } else {
            width = Math.round((width * maxDim) / height);
            height = maxDim;
          }
        }
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(dataUrl);
          return;
        }
        ctx.drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL('image/jpeg', 0.75));
      };
      img.onerror = () => resolve(dataUrl);
      img.src = dataUrl;
    });
  },
};

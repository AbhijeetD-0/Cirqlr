/**
 * Strict Automated Government ID Verification Engine for Cirqlr
 * Validates:
 * 1. Document Format & Registration Number (PAN, Voter ID EPIC, Indian Driving License)
 * 2. Automated Image Validation (Aspect ratio, contrast/luminance variance, text density, selfie rejection)
 */

export interface IdValidationResult {
  isValid: boolean;
  error?: string;
  cleanNumber?: string;
}

export interface ImageValidationResult {
  isValid: boolean;
  error?: string;
  width?: number;
  height?: number;
  aspectRatio?: number;
}

export const EXACT_IMAGE_ERROR =
  'Verification Failed: Please upload a clear, valid photo of your original PAN Card, Voter ID, or Driving License.';

/**
 * Validates document registration number against official Indian government regex formats:
 * - PAN Card: [A-Z]{5}[0-9]{4}[A-Z]{1}
 * - Voter ID (EPIC): [A-Z]{3}[0-9]{7}
 * - Indian Driving License: [A-Z]{2}[0-9]{2}\s?[0-9]{11}
 */
export function validateIdNumber(docType: string, idNumber: string): IdValidationResult {
  const clean = (idNumber || '').trim().toUpperCase();
  const normalizedType = (docType || '').trim().toLowerCase();

  if (!clean) {
    return { isValid: false, error: 'Government ID number is required.', cleanNumber: '' };
  }

  // 1. PAN Card
  if (normalizedType.includes('pan')) {
    const panRegex = /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/;
    if (!panRegex.test(clean)) {
      return {
        isValid: false,
        error: 'Invalid PAN Card format. Must be 5 uppercase letters, 4 digits, and 1 uppercase letter (e.g., ABCDE1234F).',
        cleanNumber: clean,
      };
    }
    return { isValid: true, cleanNumber: clean };
  }

  // 2. Voter ID (EPIC)
  if (normalizedType.includes('voter') || normalizedType.includes('epic')) {
    const voterRegex = /^[A-Z]{3}[0-9]{7}$/;
    if (!voterRegex.test(clean)) {
      return {
        isValid: false,
        error: 'Invalid Voter ID (EPIC) format. Must be 3 uppercase letters followed by 7 digits (e.g., ABC1234567).',
        cleanNumber: clean,
      };
    }
    return { isValid: true, cleanNumber: clean };
  }

  // 3. Indian Driving License
  if (normalizedType.includes('driv') || normalizedType.includes('license') || normalizedType.includes('dl')) {
    const dlRegex = /^[A-Z]{2}[0-9]{2}\s?[0-9]{11}$/;
    if (!dlRegex.test(clean)) {
      return {
        isValid: false,
        error: 'Invalid Driving License format. Must be 2-letter state code, 2-digit RTO, and 11 digits (e.g., WB01 20180012345).',
        cleanNumber: clean,
      };
    }
    return { isValid: true, cleanNumber: clean };
  }

  // Fallback for custom or unrecognized document type
  if (clean.length < 8) {
    return {
      isValid: false,
      error: 'Invalid ID Number format. Please enter a valid registration ID number.',
      cleanNumber: clean,
    };
  }

  return { isValid: true, cleanNumber: clean };
}

/**
 * Client-side canvas image inspection:
 * - Checks image dimensions and aspect ratio (standard ID card standard vs selfie/banner)
 * - Checks luminance variance (rejects blank, solid, or washed-out images)
 * - Checks high-frequency edge & contrast density (IDs require printed text lines, emblems & micro-patterns)
 * - Detects centered selfie skin clusters
 */
export async function validateIdDocumentImage(fileOrDataUrl: File | string): Promise<ImageValidationResult> {
  return new Promise((resolve) => {
    let objectUrlToRevoke: string | null = null;
    let imageSrc = '';

    if (typeof fileOrDataUrl === 'string') {
      imageSrc = fileOrDataUrl;
    } else if (fileOrDataUrl && typeof (fileOrDataUrl as any).slice === 'function') {
      objectUrlToRevoke = URL.createObjectURL(fileOrDataUrl as unknown as Blob);
      imageSrc = objectUrlToRevoke;
    } else {
      resolve({ isValid: false, error: EXACT_IMAGE_ERROR });
      return;
    }

    const img = new Image();
    img.crossOrigin = 'anonymous';

    img.onload = () => {
      if (objectUrlToRevoke) {
        URL.revokeObjectURL(objectUrlToRevoke);
      }

      const width = img.naturalWidth || img.width;
      const height = img.naturalHeight || img.height;

      // 1. Minimum readable dimensions check
      if (width < 240 || height < 160) {
        resolve({
          isValid: false,
          error: EXACT_IMAGE_ERROR,
          width,
          height,
        });
        return;
      }

      // 2. Aspect ratio check
      // ISO/IEC 7810 ID-1 cards have an aspect ratio of ~1.586 landscape or ~0.63 portrait.
      // Allowing generous cropping margins:
      // Landscape: 1.15 to 2.10
      // Portrait: 0.48 to 0.88
      const aspectRatio = width / height;
      const isLandscapeCard = aspectRatio >= 1.15 && aspectRatio <= 2.15;
      const isPortraitCard = aspectRatio >= 0.48 && aspectRatio <= 0.88;

      if (!isLandscapeCard && !isPortraitCard) {
        resolve({
          isValid: false,
          error: EXACT_IMAGE_ERROR,
          width,
          height,
          aspectRatio,
        });
        return;
      }

      // 3. Offscreen Canvas Pixel Analysis for document structure
      try {
        const sampleWidth = 160;
        const sampleHeight = Math.round(160 / aspectRatio);
        const canvas = document.createElement('canvas');
        canvas.width = sampleWidth;
        canvas.height = sampleHeight;
        const ctx = canvas.getContext('2d', { willReadFrequently: true });

        if (!ctx) {
          // If 2D context fails, fallback gracefully to dimensions pass
          resolve({ isValid: true, width, height, aspectRatio });
          return;
        }

        ctx.drawImage(img, 0, 0, sampleWidth, sampleHeight);
        const imageData = ctx.getImageData(0, 0, sampleWidth, sampleHeight);
        const data = imageData.data;
        const totalPixels = sampleWidth * sampleHeight;

        let luminanceSum = 0;
        let luminanceSqSum = 0;
        let minLum = 255;
        let maxLum = 0;
        let highContrastEdges = 0;
        let skinTonePixelsInCenter = 0;
        let centerPixelsCount = 0;

        const centerLeft = Math.floor(sampleWidth * 0.25);
        const centerRight = Math.floor(sampleWidth * 0.75);
        const centerTop = Math.floor(sampleHeight * 0.2);
        const centerBottom = Math.floor(sampleHeight * 0.8);

        // Pre-allocate luminance buffer for horizontal edge gradient check
        const lumBuffer = new Float32Array(totalPixels);

        for (let i = 0; i < totalPixels; i++) {
          const idx = i * 4;
          const r = data[idx];
          const g = data[idx + 1];
          const b = data[idx + 2];

          // Perceived luminance (ITU-R BT.601)
          const lum = 0.299 * r + 0.587 * g + 0.114 * b;
          lumBuffer[i] = lum;

          luminanceSum += lum;
          luminanceSqSum += lum * lum;
          if (lum < minLum) minLum = lum;
          if (lum > maxLum) maxLum = lum;

          // Check if pixel is within center 50%
          const x = i % sampleWidth;
          const y = Math.floor(i / sampleWidth);
          if (x >= centerLeft && x <= centerRight && y >= centerTop && y <= centerBottom) {
            centerPixelsCount++;
            // Skin tone detection in RGB
            const isSkin =
              r > 95 &&
              g > 40 &&
              b > 20 &&
              Math.max(r, g, b) - Math.min(r, g, b) > 15 &&
              Math.abs(r - g) > 15 &&
              r > g &&
              r > b;
            if (isSkin) skinTonePixelsInCenter++;
          }
        }

        // Test A: Standard deviation of luminance (detects blank, solid, or flat images)
        const meanLum = luminanceSum / totalPixels;
        const variance = Math.max(0, luminanceSqSum / totalPixels - meanLum * meanLum);
        const stdDev = Math.sqrt(variance);

        if (stdDev < 15) {
          // Nearly solid or blank image
          resolve({
            isValid: false,
            error: EXACT_IMAGE_ERROR,
            width,
            height,
            aspectRatio,
          });
          return;
        }

        // Test B: Dynamic range
        if (maxLum - minLum < 60) {
          // Low contrast, washed-out image
          resolve({
            isValid: false,
            error: EXACT_IMAGE_ERROR,
            width,
            height,
            aspectRatio,
          });
          return;
        }

        // Test C: High-frequency edge transitions (printed text lines on cards)
        for (let y = 0; y < sampleHeight; y++) {
          for (let x = 0; x < sampleWidth - 1; x++) {
            const idx = y * sampleWidth + x;
            const diff = Math.abs(lumBuffer[idx + 1] - lumBuffer[idx]);
            if (diff > 28) {
              highContrastEdges++;
            }
          }
        }

        const edgeDensityPercent = (highContrastEdges / totalPixels) * 100;
        if (edgeDensityPercent < 2.0) {
          // Lacks printed text density and card structure
          resolve({
            isValid: false,
            error: EXACT_IMAGE_ERROR,
            width,
            height,
            aspectRatio,
          });
          return;
        }

        // Test D: Reject prominent centered selfies (portrait or square with >45% skin in center and lower text density)
        if (centerPixelsCount > 0) {
          const skinPercent = (skinTonePixelsInCenter / centerPixelsCount) * 100;
          if (skinPercent > 45 && edgeDensityPercent < 6.0) {
            // Predominant facial selfie
            resolve({
              isValid: false,
              error: EXACT_IMAGE_ERROR,
              width,
              height,
              aspectRatio,
            });
            return;
          }
        }

        resolve({ isValid: true, width, height, aspectRatio });
      } catch (err) {
        console.warn('[validateIdDocumentImage] Pixel inspection warning:', err);
        // If canvas extraction is restricted (e.g. cross-origin), allow pass if dimensions match standard ratio
        resolve({ isValid: true, width, height, aspectRatio });
      }
    };

    img.onerror = () => {
      if (objectUrlToRevoke) {
        URL.revokeObjectURL(objectUrlToRevoke);
      }
      resolve({ isValid: false, error: EXACT_IMAGE_ERROR });
    };

    img.src = imageSrc;
  });
}

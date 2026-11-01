/**
 * Strict Automated Government ID Verification Engine for Cirqlr
 * Validates:
 * 1. Document Format & Registration Number (PAN, Voter ID EPIC, Indian Driving License)
 * 2. Automated Image Validation (Aspect ratio, contrast/luminance variance, text density, selfie rejection)
 */

import Tesseract from 'tesseract.js';

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
  extractedText?: string;
}

export const EXACT_IMAGE_ERROR =
  'Verification Failed: Document must be an official PAN, Voter ID, or Driving License/DigiLocker certificate and the name on the ID must match your Profile Legal Name.';

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
/**
 * Extracts and verifies text from ID document using OCR (Tesseract.js).
 * Validates:
 * 1. Official Government ID keywords based on docType:
 *    - DL: DRIVING LICENCE, DRIVING LICENSE, UNION OF INDIA, DIGILOCKER, TRANSPORT, MOTOR VEHICLES, FORM SEVEN, LICENCE TO DRIVE
 *    - PAN: INCOME TAX DEPARTMENT, PERMANENT ACCOUNT NUMBER, GOVT. OF INDIA, INCOMETAX, PAN
 *    - Voter: ELECTION COMMISSION OF INDIA, ELECTORAL, EPIC, BHARAT NIRVACHAN, IDENTITY CARD
 * 2. User's Full Legal Name match against recognized OCR text.
 */
async function verifyDocumentOcr(
  imageSrc: string,
  docType?: string,
  userLegalName?: string
): Promise<{ isValid: boolean; error?: string; extractedText?: string }> {
  try {
    // 12-second timeout guard to ensure smooth UI responsiveness
    const ocrPromise = Tesseract.recognize(imageSrc, 'eng', {
      logger: () => {},
    });

    const timeoutPromise = new Promise<{ data: { text: string } }>((_, reject) =>
      setTimeout(() => reject(new Error('OCR Timeout')), 12000)
    );

    const result = await Promise.race([ocrPromise, timeoutPromise]);
    const rawText = (result.data?.text || '').toUpperCase();

    const normalizedDoc = (docType || '').toUpperCase();

    // 1. Keyword check based on document type
    const isDl = normalizedDoc.includes('DRIV') || normalizedDoc.includes('LICENSE') || normalizedDoc.includes('DL');
    const isPan = normalizedDoc.includes('PAN');
    const isVoter = normalizedDoc.includes('VOTER') || normalizedDoc.includes('EPIC');

    let hasGovtKeywords = false;

    if (isDl) {
      const dlKeywords = [
        'DRIVING LICENCE',
        'DRIVING LICENSE',
        'UNION OF INDIA',
        'DIGILOCKER',
        'TRANSPORT',
        'MOTOR VEHICLE',
        'MOTOR VEHICLES',
        'FORM SEVEN',
        'LICENCE TO DRIVE',
        'AUTHORISATION TO DRIVE',
        'VALID TILL',
      ];
      hasGovtKeywords = dlKeywords.some((kw) => rawText.includes(kw));
    } else if (isPan) {
      const panKeywords = [
        'INCOME TAX',
        'INCOMETAX',
        'PERMANENT ACCOUNT NUMBER',
        'GOVT. OF INDIA',
        'GOVT OF INDIA',
        'FATHER',
        'SIGNATURE',
      ];
      hasGovtKeywords = panKeywords.some((kw) => rawText.includes(kw));
    } else if (isVoter) {
      const voterKeywords = [
        'ELECTION COMMISSION',
        'ELECTORAL',
        'EPIC',
        'BHARAT NIRVACHAN',
        'IDENTITY CARD',
        'ELECTOR',
      ];
      hasGovtKeywords = voterKeywords.some((kw) => rawText.includes(kw));
    } else {
      // General government keywords fallback
      const generalKeywords = [
        'GOVT',
        'GOVERNMENT OF INDIA',
        'BHARAT',
        'INDIA',
        'DIGILOCKER',
        'INCOME TAX',
        'DRIVING',
        'ELECTION',
        'EPIC',
      ];
      hasGovtKeywords = generalKeywords.some((kw) => rawText.includes(kw));
    }

    if (!hasGovtKeywords) {
      return {
        isValid: false,
        error: EXACT_IMAGE_ERROR,
        extractedText: rawText,
      };
    }

    // 2. User's Full Legal Name match against recognized OCR text
    if (userLegalName && userLegalName.trim()) {
      const cleanName = userLegalName.trim().toUpperCase();
      const rawTokens = cleanName
        .split(/[\s,.-]+/)
        .map((t) => t.trim())
        .filter((t) => t.length > 2 && !['MR', 'MRS', 'MS', 'DR', 'SHRI', 'SMT'].includes(t));

      if (rawTokens.length > 0) {
        // Check if primary name tokens appear in rawText
        const matchedTokens = rawTokens.filter((token) => rawText.includes(token));
        // Require at least one significant non-trivial name token (e.g. first name or surname)
        const isNameMatched = matchedTokens.length >= Math.min(1, rawTokens.length);

        if (!isNameMatched) {
          return {
            isValid: false,
            error: EXACT_IMAGE_ERROR,
            extractedText: rawText,
          };
        }
      }
    }

    return { isValid: true, extractedText: rawText };
  } catch (err) {
    console.warn('[verifyDocumentOcr] OCR notice:', err);
    // If OCR engine encounters an unresolvable network timeout or worker error in offline sandbox,
    // ensure clear error if text cannot be validated
    return {
      isValid: false,
      error: EXACT_IMAGE_ERROR,
    };
  }
}

/**
 * Client-side canvas image inspection & OCR verification:
 * - Checks image dimensions and aspect ratio (standard ID card standard vs selfie/banner)
 * - Checks luminance variance (rejects blank, solid, or washed-out images)
 * - Checks high-frequency edge & contrast density (IDs require printed text lines, emblems & micro-patterns)
 * - Detects centered selfie skin clusters
 * - Executes strict OCR verification for government keywords and profile legal name
 */
export async function validateIdDocumentImage(
  fileOrDataUrl: File | string,
  userLegalName?: string,
  docType?: string
): Promise<ImageValidationResult> {
  return new Promise(async (resolve) => {
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

    img.onload = async () => {
      const width = img.naturalWidth || img.width;
      const height = img.naturalHeight || img.height;

      // 1. Minimum readable dimensions check
      if (width < 240 || height < 160) {
        if (objectUrlToRevoke) URL.revokeObjectURL(objectUrlToRevoke);
        resolve({
          isValid: false,
          error: EXACT_IMAGE_ERROR,
          width,
          height,
        });
        return;
      }

      // 2. Aspect ratio check
      const aspectRatio = width / height;
      const isAllowedAspectRatio = aspectRatio >= 0.35 && aspectRatio <= 3.20;

      if (!isAllowedAspectRatio) {
        if (objectUrlToRevoke) URL.revokeObjectURL(objectUrlToRevoke);
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
        const sampleHeight = Math.max(50, Math.round(160 / Math.max(0.2, aspectRatio)));
        const canvas = document.createElement('canvas');
        canvas.width = sampleWidth;
        canvas.height = sampleHeight;
        const ctx = canvas.getContext('2d', { willReadFrequently: true });

        if (!ctx) {
          if (objectUrlToRevoke) URL.revokeObjectURL(objectUrlToRevoke);
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

        const lumBuffer = new Float32Array(totalPixels);

        for (let i = 0; i < totalPixels; i++) {
          const idx = i * 4;
          const r = data[idx];
          const g = data[idx + 1];
          const b = data[idx + 2];

          const lum = 0.299 * r + 0.587 * g + 0.114 * b;
          lumBuffer[i] = lum;

          luminanceSum += lum;
          luminanceSqSum += lum * lum;
          if (lum < minLum) minLum = lum;
          if (lum > maxLum) maxLum = lum;

          const x = i % sampleWidth;
          const y = Math.floor(i / sampleWidth);
          if (x >= centerLeft && x <= centerRight && y >= centerTop && y <= centerBottom) {
            centerPixelsCount++;
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

        const meanLum = luminanceSum / totalPixels;
        const variance = Math.max(0, luminanceSqSum / totalPixels - meanLum * meanLum);
        const stdDev = Math.sqrt(variance);

        if (stdDev < 6 || maxLum - minLum < 20) {
          if (objectUrlToRevoke) URL.revokeObjectURL(objectUrlToRevoke);
          resolve({
            isValid: false,
            error: EXACT_IMAGE_ERROR,
            width,
            height,
            aspectRatio,
          });
          return;
        }

        for (let y = 0; y < sampleHeight; y++) {
          for (let x = 0; x < sampleWidth - 1; x++) {
            const idx = y * sampleWidth + x;
            const diff = Math.abs(lumBuffer[idx + 1] - lumBuffer[idx]);
            if (diff > 25) {
              highContrastEdges++;
            }
          }
        }

        const edgeDensityPercent = (highContrastEdges / totalPixels) * 100;
        if (edgeDensityPercent < 0.6) {
          if (objectUrlToRevoke) URL.revokeObjectURL(objectUrlToRevoke);
          resolve({
            isValid: false,
            error: EXACT_IMAGE_ERROR,
            width,
            height,
            aspectRatio,
          });
          return;
        }

        if (centerPixelsCount > 0) {
          const skinPercent = (skinTonePixelsInCenter / centerPixelsCount) * 100;
          if (skinPercent > 65 && edgeDensityPercent < 2.0) {
            if (objectUrlToRevoke) URL.revokeObjectURL(objectUrlToRevoke);
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
      } catch (err) {
        console.warn('[validateIdDocumentImage] Pixel inspection note:', err);
      }

      // 4. Strict OCR Text & Name Matching Inspection
      const ocrResult = await verifyDocumentOcr(imageSrc, docType, userLegalName);
      if (objectUrlToRevoke) URL.revokeObjectURL(objectUrlToRevoke);

      if (!ocrResult.isValid) {
        resolve({
          isValid: false,
          error: ocrResult.error || EXACT_IMAGE_ERROR,
          width,
          height,
          aspectRatio,
          extractedText: ocrResult.extractedText,
        });
        return;
      }

      resolve({
        isValid: true,
        width,
        height,
        aspectRatio,
        extractedText: ocrResult.extractedText,
      });
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

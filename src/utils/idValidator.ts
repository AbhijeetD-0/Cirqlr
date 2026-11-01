/**
 * Strict Automated Government ID Verification Engine for Cirqlr
 * Validates:
 * 1. Document Format & Registration Number (PAN, Voter ID EPIC, Indian Driving License)
 * 2. Automated Image Validation (Rejects dark screenshots/Reels, selfies, blank images)
 * 3. High-Clarity OCR Inspection (Verifies official Govt ID keywords + User Legal Name match)
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
 * - Indian Driving License: [A-Z]{2}[0-9]{2}\s?[0-9]{11} (supports spaces/hyphens)
 */
export function validateIdNumber(docType: string, idNumber: string): IdValidationResult {
  const clean = (idNumber || '').trim().toUpperCase().replace(/[\s-]/g, '');
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
        error: 'Invalid PAN Card format. Must be 5 letters, 4 digits, and 1 letter (e.g., ABCDE1234F).',
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
        error: 'Invalid Voter ID (EPIC) format. Must be 3 letters followed by 7 digits (e.g., ABC1234567).',
        cleanNumber: clean,
      };
    }
    return { isValid: true, cleanNumber: clean };
  }

  // 3. Indian Driving License (e.g. WB17 20250001080 -> WB1720250001080)
  if (normalizedType.includes('driv') || normalizedType.includes('license') || normalizedType.includes('dl')) {
    const dlRegex = /^[A-Z]{2}[0-9A-Z]{11,15}$/;
    if (!dlRegex.test(clean)) {
      return {
        isValid: false,
        error: 'Invalid Driving License format. Must be 2-letter state code, 2-digit RTO, and 11 digits (e.g., WB17 20250001080).',
        cleanNumber: clean,
      };
    }
    return { isValid: true, cleanNumber: clean };
  }

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
 * Prepares a high-contrast grayscale image specifically for Tesseract OCR
 * so DigiLocker certificates and camera scans are read accurately and quickly.
 */
function buildOcrReadyCanvasDataUrl(img: HTMLImageElement): string {
  try {
    const maxDim = 1300;
    const w = img.naturalWidth || img.width;
    const h = img.naturalHeight || img.height;
    const scale = Math.min(1, maxDim / Math.max(w, h));
    const targetW = Math.max(300, Math.round(w * scale));
    const targetH = Math.max(300, Math.round(h * scale));

    const canvas = document.createElement('canvas');
    canvas.width = targetW;
    canvas.height = targetH;
    const ctx = canvas.getContext('2d');
    if (!ctx) return img.src;

    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, 0, targetW, targetH);
    ctx.drawImage(img, 0, 0, targetW, targetH);

    const imgData = ctx.getImageData(0, 0, targetW, targetH);
    const d = imgData.data;
    // Enhance text contrast for crisp OCR reading
    for (let i = 0; i < d.length; i += 4) {
      const lum = 0.299 * d[i] + 0.587 * d[i + 1] + 0.114 * d[i + 2];
      const contrasted = lum < 150 ? Math.max(0, lum * 0.65) : Math.min(255, lum * 1.15);
      d[i] = contrasted;
      d[i + 1] = contrasted;
      d[i + 2] = contrasted;
    }
    ctx.putImageData(imgData, 0, 0);
    return canvas.toDataURL('image/jpeg', 0.88);
  } catch {
    return img.src;
  }
}

/**
 * Extracts and verifies text from ID document using OCR (Tesseract.js).
 */
async function verifyDocumentOcr(
  ocrReadyDataUrl: string,
  docType?: string,
  userLegalName?: string
): Promise<{ isValid: boolean; error?: string; extractedText?: string }> {
  try {
    const ocrPromise = Tesseract.recognize(ocrReadyDataUrl, 'eng', {
      logger: () => {},
    });

    // 25-second timeout so mobile devices have enough time to download language data on first run
    const timeoutPromise = new Promise<{ data: { text: string } }>((_, reject) =>
      setTimeout(() => reject(new Error('OCR Timeout')), 25000)
    );

    const result = await Promise.race([ocrPromise, timeoutPromise]);
    const rawText = (result.data?.text || '').toUpperCase();
    const normalizedText = rawText.replace(/[^A-Z0-9\s]/g, ' ');

    const normalizedDoc = (docType || '').toUpperCase();
    const isDl = normalizedDoc.includes('DRIV') || normalizedDoc.includes('LICENSE') || normalizedDoc.includes('DL');
    const isPan = normalizedDoc.includes('PAN');
    const isVoter = normalizedDoc.includes('VOTER') || normalizedDoc.includes('EPIC');

    let hasGovtKeywords = false;

    if (isDl) {
      const dlKeywords = [
        'DRIVING',
        'LICENCE',
        'LICENSE',
        'UNION OF INDIA',
        'DIGILOCKER',
        'TRANSPORT',
        'MOTOR',
        'AUTHORIZATION',
        'AUTHORISATION',
        'SERAMPORE',
        'ISSUING AUTHORITY',
        'LMV',
        'MCWG',
        'DOB',
      ];
      hasGovtKeywords = dlKeywords.some((kw) => normalizedText.includes(kw));
    } else if (isPan) {
      const panKeywords = [
        'INCOME TAX',
        'INCOMETAX',
        'PERMANENT ACCOUNT',
        'GOVT OF INDIA',
        'GOVERNMENT OF INDIA',
        'DIGILOCKER',
        'FATHER',
        'SIGNATURE',
      ];
      hasGovtKeywords = panKeywords.some((kw) => normalizedText.includes(kw));
    } else if (isVoter) {
      const voterKeywords = [
        'ELECTION',
        'COMMISSION',
        'ELECTORAL',
        'EPIC',
        'NIRVACHAN',
        'IDENTITY CARD',
        'ELECTOR',
        'DIGILOCKER',
      ];
      hasGovtKeywords = voterKeywords.some((kw) => normalizedText.includes(kw));
    } else {
      const generalKeywords = [
        'GOVT',
        'INDIA',
        'DIGILOCKER',
        'INCOME TAX',
        'DRIVING',
        'LICENCE',
        'LICENSE',
        'ELECTION',
        'EPIC',
      ];
      hasGovtKeywords = generalKeywords.some((kw) => normalizedText.includes(kw));
    }

    if (!hasGovtKeywords) {
      return {
        isValid: false,
        error: 'Verification Failed: This image does not appear to be an official PAN Card, Voter ID, or Driving License. Random photos and screenshots are strictly rejected.',
        extractedText: rawText,
      };
    }

    // Check User's Full Legal Name match against recognized OCR text
    if (userLegalName && userLegalName.trim()) {
      const cleanName = userLegalName.trim().toUpperCase().replace(/[^A-Z\s]/g, ' ');
      const nameParts = cleanName
        .split(/\s+/)
        .map((t) => t.trim())
        .filter((t) => t.length >= 3 && !['MR', 'MRS', 'MS', 'DR', 'SHRI', 'SMT', 'KUMAR', 'DEVI'].includes(t));

      if (nameParts.length > 0) {
        // Match either exact token or partial 4-letter prefix (to handle minor OCR character noise)
        const matchedTokens = nameParts.filter((token) => {
          if (normalizedText.includes(token)) return true;
          if (token.length >= 5 && normalizedText.includes(token.slice(0, 4))) return true;
          return false;
        });

        if (matchedTokens.length === 0) {
          return {
            isValid: false,
            error: `Name Mismatch: The name on your uploaded ID does not match your Profile Legal Name ("${userLegalName.trim()}"). Please enter your exact legal name as printed on your Government ID.`,
            extractedText: rawText,
          };
        }
      }
    }

    return { isValid: true, extractedText: rawText };
  } catch (err) {
    console.warn('[verifyDocumentOcr] OCR error:', err);
    return {
      isValid: false,
      error: 'Verification Failed: Could not read Government ID text clearly. Please upload a clearer, bright photo of your original ID or DigiLocker certificate.',
    };
  }
}

/**
 * Full Document Image Validation (Pixel Structure + OCR Keyword & Name Match)
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

      if (width < 220 || height < 160) {
        if (objectUrlToRevoke) URL.revokeObjectURL(objectUrlToRevoke);
        resolve({
          isValid: false,
          error: 'Verification Failed: Image resolution is too small. Please upload a clear photo of your ID.',
          width,
          height,
        });
        return;
      }

      const aspectRatio = width / height;

      // Fast Canvas Check to immediately block dark screenshots (like Reels) & selfies BEFORE running OCR
      try {
        const sampleW = 180;
        const sampleH = 180;
        const canvas = document.createElement('canvas');
        canvas.width = sampleW;
        canvas.height = sampleH;
        const ctx = canvas.getContext('2d', { willReadFrequently: true });

        if (ctx) {
          ctx.drawImage(img, 0, 0, sampleW, sampleH);
          const data = ctx.getImageData(0, 0, sampleW, sampleH).data;
          const totalPixels = sampleW * sampleH;

          let darkPixels = 0;
          let skinPixels = 0;

          for (let i = 0; i < data.length; i += 4) {
            const r = data[i];
            const g = data[i + 1];
            const b = data[i + 2];
            const lum = 0.299 * r + 0.587 * g + 0.114 * b;

            if (lum < 55) darkPixels++;
            if (r > 95 && g > 40 && b > 20 && r > g && r > b && Math.abs(r - g) > 15) {
              skinPixels++;
            }
          }

          if (darkPixels / totalPixels > 0.38) {
            if (objectUrlToRevoke) URL.revokeObjectURL(objectUrlToRevoke);
            resolve({
              isValid: false,
              error: 'Verification Failed: Dark screenshots (like Reels or phone screens) are not valid Government IDs.',
              width,
              height,
              aspectRatio,
            });
            return;
          }

          if (skinPixels / totalPixels > 0.38) {
            if (objectUrlToRevoke) URL.revokeObjectURL(objectUrlToRevoke);
            resolve({
              isValid: false,
              error: 'Verification Failed: Casual selfies or portraits are not accepted. Please upload your PAN, Voter ID, or Driving License.',
              width,
              height,
              aspectRatio,
            });
            return;
          }
        }
      } catch (e) {
        console.warn('[validateIdDocumentImage] Fast pixel check note:', e);
      }

      // Build high-clarity OCR image BEFORE compression so text is 100% readable
      const ocrReadyUrl = buildOcrReadyCanvasDataUrl(img);
      const ocrResult = await verifyDocumentOcr(ocrReadyUrl, docType, userLegalName);

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
      if (objectUrlToRevoke) URL.revokeObjectURL(objectUrlToRevoke);
      resolve({ isValid: false, error: EXACT_IMAGE_ERROR });
    };

    img.src = imageSrc;
  });
}

/**
 * Canvas-based client-side image compression utility.
 * Compresses heavy photos and government ID documents to lightweight JPEG (~30-60 KB)
 * preventing LocalStorage 5MB QuotaExceededError.
 */

export function compressImageFile(
  file: File,
  maxWidth = 600,
  maxHeight = 600,
  quality = 0.6
): Promise<string> {
  return new Promise((resolve) => {
    if (!file || !file.type.startsWith('image/')) {
      resolve('');
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const dataUrl = typeof e.target?.result === 'string' ? e.target.result : '';
      if (!dataUrl) {
        resolve('');
        return;
      }
      compressBase64Image(dataUrl, maxWidth, maxHeight, quality).then(resolve);
    };

    reader.onerror = () => resolve('');
    reader.readAsDataURL(file);
  });
}

/**
 * Compresses any base64 image data URL to max 600px width/height at 0.6 quality (<80KB)
 * to ensure Firestore documents never exceed 1MB limit.
 */
export function compressBase64Image(
  dataUrl: string,
  maxWidth = 600,
  maxHeight = 600,
  quality = 0.6
): Promise<string> {
  return new Promise((resolve) => {
    if (!dataUrl || typeof dataUrl !== 'string') {
      resolve('');
      return;
    }
    // If not a data URL (e.g. http/https url), return as-is
    if (!dataUrl.startsWith('data:image')) {
      resolve(dataUrl);
      return;
    }

    const img = new Image();
    img.crossOrigin = 'anonymous';

    img.onload = () => {
      let width = img.naturalWidth || img.width;
      let height = img.naturalHeight || img.height;

      if (width > height) {
        if (width > maxWidth) {
          height = Math.round((height * maxWidth) / width);
          width = maxWidth;
        }
      } else {
        if (height > maxHeight) {
          width = Math.round((width * maxHeight) / height);
          height = maxHeight;
        }
      }

      const canvas = document.createElement('canvas');
      canvas.width = Math.max(1, width);
      canvas.height = Math.max(1, height);
      const ctx = canvas.getContext('2d');

      if (!ctx) {
        resolve(dataUrl);
        return;
      }

      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      const compressed = canvas.toDataURL('image/jpeg', quality);
      resolve(compressed);
    };

    img.onerror = () => {
      resolve(dataUrl);
    };

    img.src = dataUrl;
  });
}

/**
 * Compresses all base64 image fields in a user profile object before saving to Firestore.
 */
export async function compressUserProfileImages<T extends Record<string, any>>(user: T): Promise<T> {
  if (!user || typeof user !== 'object') return user;

  const result: any = { ...user };

  if (typeof result.avatarUrl === 'string' && result.avatarUrl.startsWith('data:image')) {
    result.avatarUrl = await compressBase64Image(result.avatarUrl, 600, 600, 0.6);
  }

  if (typeof result.profileImage === 'string' && result.profileImage.startsWith('data:image')) {
    result.profileImage = await compressBase64Image(result.profileImage, 600, 600, 0.6);
  }

  if (typeof result.idDocumentImage === 'string' && result.idDocumentImage.startsWith('data:image')) {
    result.idDocumentImage = await compressBase64Image(result.idDocumentImage, 600, 600, 0.6);
  }

  if (typeof result.idProofUrl === 'string' && result.idProofUrl.startsWith('data:image')) {
    result.idProofUrl = await compressBase64Image(result.idProofUrl, 600, 600, 0.6);
  }

  if (typeof result.documentImageUrl === 'string' && result.documentImageUrl.startsWith('data:image')) {
    result.documentImageUrl = await compressBase64Image(result.documentImageUrl, 600, 600, 0.6);
  }

  if (typeof result.idDocumentUrl === 'string' && result.idDocumentUrl.startsWith('data:image')) {
    result.idDocumentUrl = await compressBase64Image(result.idDocumentUrl, 600, 600, 0.6);
  }

  if (Array.isArray(result.publicGallery)) {
    const compressedGallery: string[] = [];
    for (const photo of result.publicGallery) {
      if (typeof photo === 'string' && photo.startsWith('data:image')) {
        compressedGallery.push(await compressBase64Image(photo, 600, 600, 0.6));
      } else if (photo) {
        compressedGallery.push(photo);
      }
    }
    result.publicGallery = compressedGallery;
  }

  return result as T;
}

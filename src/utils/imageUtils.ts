import { launchImageLibrary, ImageLibraryOptions } from 'react-native-image-picker';

/**
 * Pick an image from device gallery and convert to base64
 * @returns Promise with base64 image string or null if cancelled
 */
export async function pickImage(): Promise<string | null> {
  return new Promise((resolve) => {
    const options: ImageLibraryOptions = {
      mediaType: 'photo',
      maxWidth: 1024,
      maxHeight: 1024,
      includeBase64: true,
    };

    launchImageLibrary(options, (response) => {
      if (response.didCancel) {
        console.log('User cancelled image picker');
        resolve(null);
        return;
      }

      if (response.errorCode) {
        console.error('Image picker error:', response.errorCode);
        resolve(null);
        return;
      }

      if (response.assets && response.assets[0]) {
        const asset = response.assets[0];
        if (asset.base64) {
          const type = asset.type || 'image/jpeg';
          const base64Image = `data:${type};base64,${asset.base64}`;
          console.log('Image picked successfully, size:', base64Image.length);
          resolve(base64Image);
          return;
        }
      }

      resolve(null);
    });
  });
}

/**
 * Validate image size
 * @param base64Image - Base64 encoded image
 * @param maxSizeMB - Maximum size in MB (default: 5)
 * @returns true if valid, false otherwise
 */
export function validateImageSize(base64Image: string, maxSizeMB: number = 5): boolean {
  try {
    // Base64 string length is roughly 4/3 of binary size
    const sizeInBytes = (base64Image.length * 3) / 4;
    const sizeInMB = sizeInBytes / (1024 * 1024);
    return sizeInMB <= maxSizeMB;
  } catch (error) {
    console.error('Error validating image size:', error);
    return false;
  }
}


/**
 * Format file size for display
 * @param bytes - Size in bytes
 * @returns Formatted string (e.g., "2.5 MB")
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';

  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
}

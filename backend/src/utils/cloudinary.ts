import axios from 'axios';

const CLOUDINARY_CLOUD_NAME = process.env.CLOUDINARY_CLOUD_NAME || 'tndlf2lt';
const CLOUDINARY_UPLOAD_PRESET = process.env.CLOUDINARY_UPLOAD_PRESET || 'ml_default';

/**
 * Upload image to Cloudinary
 * @param base64Image - Base64 encoded image string (e.g., "data:image/jpeg;base64,...")
 * @returns Promise with secure URL of uploaded image
 */
export async function uploadToCloudinary(base64Image: string): Promise<string> {
  try {
    if (!base64Image) {
      throw new Error('No image provided');
    }

    // Validate base64 format
    if (!base64Image.startsWith('data:')) {
      throw new Error('Invalid image format. Expected base64 data URL.');
    }

    console.log('Uploading image to Cloudinary...');
    console.log('Cloud Name:', CLOUDINARY_CLOUD_NAME);
    console.log('Upload Preset:', CLOUDINARY_UPLOAD_PRESET);

    const response = await axios.post(
      `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`,
      {
        file: base64Image,
        upload_preset: CLOUDINARY_UPLOAD_PRESET,
        folder: 'profsale/products',
        resource_type: 'auto',
      },
      {
        timeout: 30000,
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );

    if (!response.data.secure_url) {
      throw new Error('No secure URL returned from Cloudinary');
    }

    console.log('Image uploaded successfully:', response.data.secure_url);
    return response.data.secure_url;
  } catch (error: any) {
    console.error('Cloudinary upload error:', error.message);
    if (error.response?.data) {
      console.error('Cloudinary response:', error.response.data);
    }
    throw new Error(`Failed to upload image to Cloudinary: ${error.message}`);
  }
}

/**
 * Delete image from Cloudinary
 * @param publicId - Public ID of the image to delete
 */
export async function deleteFromCloudinary(publicId: string): Promise<void> {
  try {
    if (!publicId) {
      console.warn('No public ID provided for deletion');
      return;
    }

    console.log('Deleting image from Cloudinary:', publicId);

    await axios.post(
      `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/destroy`,
      {
        public_id: publicId,
      },
      {
        auth: {
          username: process.env.CLOUDINARY_API_KEY || '251857125698757',
          password: process.env.CLOUDINARY_API_SECRET || '',
        },
        timeout: 30000,
      }
    );

    console.log('Image deleted successfully');
  } catch (error: any) {
    console.error('Cloudinary delete error:', error.message);
    // Don't throw - deletion failure shouldn't block product updates
  }
}

/**
 * Extract public ID from Cloudinary URL
 * @param url - Cloudinary image URL
 * @returns Public ID
 */
export function extractPublicId(url: string): string {
  try {
    // URL format: https://res.cloudinary.com/{cloud}/image/upload/v{version}/{public_id}.{format}
    const match = url.match(/\/upload\/(?:v\d+\/)?(.+)\.\w+$/);
    return match ? match[1] : '';
  } catch (error) {
    console.error('Error extracting public ID:', error);
    return '';
  }
}

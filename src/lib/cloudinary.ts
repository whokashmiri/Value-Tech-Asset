import { v2 as cloudinary } from 'cloudinary';
import { v4 as uuidv4 } from 'uuid';

export interface CloudinaryUploadResponse {
  success: boolean;
  url?: string;
  error?: string;
}

const cloudinaryConfig = {
  cloud_name: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true,
};

if (cloudinaryConfig.cloud_name && cloudinaryConfig.api_key && cloudinaryConfig.api_secret) {
  cloudinary.config(cloudinaryConfig);
} else {
  console.warn('Cloudinary credentials are not fully configured. Media uploads will fail.');
}

export async function uploadToCloudinary(fileDataUrl: string, projectId: string, assetId: string): Promise<CloudinaryUploadResponse> {
  if (!cloudinaryConfig.cloud_name || !cloudinaryConfig.api_key || !cloudinaryConfig.api_secret) {
    return {
      success: false,
      error: 'Missing Cloudinary configuration. Please set CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET, and NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME.',
    };
  }

  const mimeType = fileDataUrl.substring(fileDataUrl.indexOf(':') + 1, fileDataUrl.indexOf(';'));
  const resourceType = mimeType.startsWith('image/')
    ? 'image'
    : mimeType.startsWith('video/')
      ? 'video'
      : 'raw';

  if (resourceType === 'raw') {
    return {
      success: false,
      error: `Invalid file type: ${mimeType}. Only images and videos are accepted.`,
    };
  }

  try {
    const result = await cloudinary.uploader.upload(fileDataUrl, {
      resource_type: resourceType,
      folder: `${projectId}/${assetId}`,
      public_id: uuidv4(),
    });
    return { success: true, url: result.secure_url };
  } catch (error: any) {
    return { success: false, error: error?.message || 'Cloudinary upload failed.' };
  }
}

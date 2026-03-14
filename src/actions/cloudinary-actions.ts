'use server';

import { uploadToCloudinary } from '@/lib/cloudinary';

export async function uploadMedia(fileDataUrl: string, projectId: string, assetId: string) {
  return uploadToCloudinary(fileDataUrl, projectId, assetId);
}

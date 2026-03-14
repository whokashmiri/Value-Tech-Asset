import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { uploadToCloudinary } from '@/lib/cloudinary';

export const config = {
  api: {
    bodyParser: {
      sizeLimit: '20mb',
    },
  },
};

export async function POST(request: NextRequest) {
  try {
    const { fileDataUrl, projectId, assetId } = await request.json();

    if (!fileDataUrl || !projectId || !assetId) {
      return NextResponse.json(
        { success: false, error: 'fileDataUrl, projectId, and assetId are required.' },
        { status: 400 }
      );
    }

    const result = await uploadToCloudinary(fileDataUrl, projectId, assetId);

    return NextResponse.json(result, { status: result.success ? 200 : 500 });
  } catch (error) {
    console.error('Upload media API error:', error);
    return NextResponse.json(
      { success: false, error: 'Unexpected error while uploading media.' },
      { status: 500 }
    );
  }
}

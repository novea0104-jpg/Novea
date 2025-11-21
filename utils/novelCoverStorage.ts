import { supabase } from './supabase';
import * as ImageManipulator from 'expo-image-manipulator';

const COVER_BUCKET = 'novel-covers';
const MAX_WIDTH = 800;
const MAX_HEIGHT = 1200;
const JPEG_QUALITY = 0.85;

export async function uploadNovelCoverAsync(imageUri: string, userId: string): Promise<string> {
  try {
    console.log('Starting cover upload for user:', userId);
    
    // Step 1: Compress and resize image (portrait aspect ratio for book covers)
    const manipResult = await ImageManipulator.manipulateAsync(
      imageUri,
      [{ resize: { width: MAX_WIDTH, height: MAX_HEIGHT } }],
      { compress: JPEG_QUALITY, format: ImageManipulator.SaveFormat.JPEG }
    );

    console.log('Image resized:', manipResult.uri);

    // Step 2: Convert to ArrayBuffer for React Native (blob() doesn't exist!)
    const response = await fetch(manipResult.uri);
    const arrayBuffer = await response.arrayBuffer();

    console.log('Image converted to ArrayBuffer, size:', arrayBuffer.byteLength);

    // Step 3: Generate unique filename with timestamp
    const timestamp = Date.now();
    const fileName = `cover-${timestamp}.jpg`;
    const filePath = `${userId}/${fileName}`;

    console.log('Uploading to path:', filePath);

    // Step 4: Upload to Supabase Storage (ArrayBuffer works on all platforms)
    const { data, error } = await supabase.storage
      .from(COVER_BUCKET)
      .upload(filePath, arrayBuffer, {
        contentType: 'image/jpeg',
        upsert: true,
      });

    if (error) {
      console.error('Upload error:', error);
      throw new Error(`Gagal upload cover: ${error.message}`);
    }

    console.log('Upload success:', data);

    // Step 5: Get public URL
    const { data: publicUrlData } = supabase.storage
      .from(COVER_BUCKET)
      .getPublicUrl(filePath);

    console.log('Public URL:', publicUrlData.publicUrl);

    return publicUrlData.publicUrl;
  } catch (error) {
    console.error('Novel cover upload failed:', error);
    throw error;
  }
}

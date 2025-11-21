import { supabase } from './supabase';
import * as ImageManipulator from 'expo-image-manipulator';

const COVER_BUCKET = 'novel-covers';
const MAX_WIDTH = 800;
const MAX_HEIGHT = 1200;
const JPEG_QUALITY = 0.85;

export async function uploadNovelCoverAsync(imageUri: string, userId: string): Promise<string> {
  try {
    // Step 1: Compress and resize image (portrait aspect ratio for book covers)
    const manipResult = await ImageManipulator.manipulateAsync(
      imageUri,
      [{ resize: { width: MAX_WIDTH, height: MAX_HEIGHT } }],
      { compress: JPEG_QUALITY, format: ImageManipulator.SaveFormat.JPEG }
    );

    // Step 2: Convert to blob for upload
    const response = await fetch(manipResult.uri);
    const blob = await response.blob();

    // Step 3: Generate unique filename with timestamp
    const timestamp = Date.now();
    const fileName = `cover-${timestamp}.jpg`;
    const filePath = `${userId}/${fileName}`;

    // Step 4: Upload to Supabase Storage
    const { data, error } = await supabase.storage
      .from(COVER_BUCKET)
      .upload(filePath, blob, {
        contentType: 'image/jpeg',
        upsert: true,
      });

    if (error) {
      console.error('Upload error:', error);
      throw new Error(`Failed to upload cover: ${error.message}`);
    }

    // Step 5: Get public URL
    const { data: publicUrlData } = supabase.storage
      .from(COVER_BUCKET)
      .getPublicUrl(filePath);

    return publicUrlData.publicUrl;
  } catch (error) {
    console.error('Novel cover upload failed:', error);
    throw error;
  }
}

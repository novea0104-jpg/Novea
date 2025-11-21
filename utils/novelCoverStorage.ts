import { supabase } from './supabase';
import * as ImageManipulator from 'expo-image-manipulator';
import * as FileSystem from 'expo-file-system';

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

    // Step 2: Read file as base64 using Expo FileSystem (works on all platforms!)
    const base64 = await FileSystem.readAsStringAsync(manipResult.uri, {
      encoding: 'base64',
    });

    // Step 3: Convert base64 to ArrayBuffer for Supabase upload
    const arrayBuffer = base64ToArrayBuffer(base64);

    console.log('Image converted to ArrayBuffer, size:', arrayBuffer.byteLength);

    // Step 4: Generate unique filename with timestamp
    const timestamp = Date.now();
    const fileName = `cover-${timestamp}.jpg`;
    const filePath = `${userId}/${fileName}`;

    console.log('Uploading to path:', filePath);

    // Step 5: Upload to Supabase Storage
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

    // Step 6: Get public URL
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

// Helper: Convert base64 string to ArrayBuffer
function base64ToArrayBuffer(base64: string): ArrayBuffer {
  const binaryString = atob(base64);
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes.buffer;
}

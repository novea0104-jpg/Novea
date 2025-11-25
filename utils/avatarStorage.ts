import { supabase } from './supabase';
import * as ImageManipulator from 'expo-image-manipulator';
import * as FileSystem from 'expo-file-system/legacy';

const AVATAR_BUCKET = 'avatars';
const MAX_SIZE = 512;
const JPEG_QUALITY = 0.8;

/**
 * Uploads an avatar to Supabase Storage with compression
 * Uses base64 approach for React Native compatibility
 * @param imageUri Local file URI from image picker
 * @param userId User's Supabase Auth ID
 * @returns Public URL of uploaded avatar
 */
export async function uploadAvatarAsync(imageUri: string, userId: string): Promise<string> {
  try {
    console.log('Starting avatar upload for user:', userId);
    
    // Step 1: Compress and resize image
    const manipResult = await ImageManipulator.manipulateAsync(
      imageUri,
      [{ resize: { width: MAX_SIZE, height: MAX_SIZE } }],
      { compress: JPEG_QUALITY, format: ImageManipulator.SaveFormat.JPEG }
    );

    console.log('Image resized:', manipResult.uri);

    // Step 2: Read file as base64 (React Native compatible)
    const base64 = await FileSystem.readAsStringAsync(manipResult.uri, {
      encoding: 'base64',
    });

    // Step 3: Convert base64 to ArrayBuffer for Supabase upload
    const arrayBuffer = base64ToArrayBuffer(base64);

    console.log('Image converted to ArrayBuffer, size:', arrayBuffer.byteLength);

    // Step 4: Generate unique filename with timestamp
    const timestamp = Date.now();
    const fileName = `avatar-${timestamp}.jpg`;
    const filePath = `${userId}/${fileName}`;

    console.log('Uploading to path:', filePath);

    // Step 5: Upload to Supabase Storage
    const { data, error } = await supabase.storage
      .from(AVATAR_BUCKET)
      .upload(filePath, arrayBuffer, {
        contentType: 'image/jpeg',
        upsert: true,
      });

    if (error) {
      console.error('Upload error:', error);
      throw new Error(`Gagal upload avatar: ${error.message}`);
    }

    console.log('Upload success:', data);

    // Step 6: Get public URL
    const { data: publicUrlData } = supabase.storage
      .from(AVATAR_BUCKET)
      .getPublicUrl(filePath);

    console.log('Public URL:', publicUrlData.publicUrl);

    return publicUrlData.publicUrl;
  } catch (error) {
    console.error('Avatar upload failed:', error);
    throw error;
  }
}

/**
 * Deletes an avatar from Supabase Storage
 * @param avatarUrl Full public URL of the avatar
 * @param userId User's Supabase Auth ID
 */
export async function deleteAvatarAsync(avatarUrl: string, userId: string): Promise<void> {
  try {
    // Extract file path from URL
    const urlParts = avatarUrl.split(`${AVATAR_BUCKET}/`);
    if (urlParts.length < 2) {
      throw new Error('Invalid avatar URL format');
    }
    
    const filePath = urlParts[1];

    // Delete from storage
    const { error } = await supabase.storage
      .from(AVATAR_BUCKET)
      .remove([filePath]);

    if (error) {
      console.error('Delete error:', error);
      throw new Error(`Gagal hapus avatar: ${error.message}`);
    }
  } catch (error) {
    console.error('Avatar deletion failed:', error);
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

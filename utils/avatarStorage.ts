import { supabase } from './supabase';
import * as ImageManipulator from 'expo-image-manipulator';

const AVATAR_BUCKET = 'avatars';
const MAX_SIZE = 512; // Max width/height in pixels
const JPEG_QUALITY = 0.8; // Compression quality

/**
 * Uploads an avatar to Supabase Storage with compression
 * @param imageUri Local file URI from image picker
 * @param userId User's Supabase Auth ID
 * @returns Public URL of uploaded avatar
 */
export async function uploadAvatarAsync(imageUri: string, userId: string): Promise<string> {
  try {
    // Step 1: Compress and resize image
    const manipResult = await ImageManipulator.manipulateAsync(
      imageUri,
      [{ resize: { width: MAX_SIZE, height: MAX_SIZE } }],
      { compress: JPEG_QUALITY, format: ImageManipulator.SaveFormat.JPEG }
    );

    // Step 2: Convert to blob for upload
    const response = await fetch(manipResult.uri);
    const blob = await response.blob();

    // Step 3: Generate unique filename with timestamp
    const timestamp = Date.now();
    const fileName = `avatar-${timestamp}.jpg`;
    const filePath = `${userId}/${fileName}`;

    // Step 4: Upload to Supabase Storage
    const { data, error } = await supabase.storage
      .from(AVATAR_BUCKET)
      .upload(filePath, blob, {
        contentType: 'image/jpeg',
        upsert: true, // Replace existing file if any
      });

    if (error) {
      console.error('Upload error:', error);
      throw new Error(`Failed to upload avatar: ${error.message}`);
    }

    // Step 5: Get public URL
    const { data: publicUrlData } = supabase.storage
      .from(AVATAR_BUCKET)
      .getPublicUrl(filePath);

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
      throw new Error(`Failed to delete avatar: ${error.message}`);
    }
  } catch (error) {
    console.error('Avatar deletion failed:', error);
    throw error;
  }
}

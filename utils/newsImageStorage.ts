import { supabase } from './supabase';
import * as ImageManipulator from 'expo-image-manipulator';
import * as FileSystem from 'expo-file-system/legacy';

const NEWS_BUCKET = 'news-images';
const MAX_WIDTH = 800;
const MAX_HEIGHT = 450;
const JPEG_QUALITY = 0.85;

export async function uploadNewsImageAsync(imageUri: string, userId: string): Promise<string> {
  try {
    console.log('Starting news image upload for user:', userId);
    
    const manipResult = await ImageManipulator.manipulateAsync(
      imageUri,
      [{ resize: { width: MAX_WIDTH, height: MAX_HEIGHT } }],
      { compress: JPEG_QUALITY, format: ImageManipulator.SaveFormat.JPEG }
    );

    console.log('Image resized:', manipResult.uri);

    const base64 = await FileSystem.readAsStringAsync(manipResult.uri, {
      encoding: 'base64',
    });

    const arrayBuffer = base64ToArrayBuffer(base64);

    console.log('Image converted to ArrayBuffer, size:', arrayBuffer.byteLength);

    const timestamp = Date.now();
    const fileName = `news-${timestamp}.jpg`;
    const filePath = `${userId}/${fileName}`;

    console.log('Uploading to path:', filePath);

    const { data, error } = await supabase.storage
      .from(NEWS_BUCKET)
      .upload(filePath, arrayBuffer, {
        contentType: 'image/jpeg',
        upsert: true,
      });

    if (error) {
      console.error('Upload error:', error);
      throw new Error(`Gagal upload gambar news: ${error.message}`);
    }

    console.log('Upload success:', data);

    const { data: publicUrlData } = supabase.storage
      .from(NEWS_BUCKET)
      .getPublicUrl(filePath);

    console.log('Public URL:', publicUrlData.publicUrl);

    return publicUrlData.publicUrl;
  } catch (error) {
    console.error('News image upload failed:', error);
    throw error;
  }
}

function base64ToArrayBuffer(base64: string): ArrayBuffer {
  const binaryString = atob(base64);
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes.buffer;
}

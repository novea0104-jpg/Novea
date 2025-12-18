import React, { useState } from 'react';
import { View, StyleSheet, Pressable, TextInput, Image, Alert, ActivityIndicator } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import * as ImagePicker from 'expo-image-picker';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Path, Circle, Rect } from 'react-native-svg';
import { ScreenKeyboardAwareScrollView } from '@/components/ScreenKeyboardAwareScrollView';
import { ThemedText } from '@/components/ThemedText';
import { Card } from '@/components/Card';
import { UserIcon } from '@/components/icons/UserIcon';
import { CameraIcon } from '@/components/icons/CameraIcon';
import { CheckIcon } from '@/components/icons/CheckIcon';
import { useTheme } from '@/hooks/useTheme';
import { useAuth } from '@/contexts/AuthContext';
import { uploadAvatarAsync } from '@/utils/avatarStorage';
import { supabase } from '@/utils/supabase';
import { Spacing, BorderRadius, Typography } from '@/constants/theme';
import { SocialLinks, SocialPlatform } from '@/types/models';

const SOCIAL_PLATFORMS: { key: SocialPlatform; label: string; placeholder: string; color: string; prefix: string }[] = [
  { key: 'instagram', label: 'Instagram', placeholder: 'username', color: '#E4405F', prefix: 'instagram.com/' },
  { key: 'tiktok', label: 'TikTok', placeholder: 'username', color: '#000000', prefix: 'tiktok.com/@' },
  { key: 'facebook', label: 'Facebook', placeholder: 'username', color: '#1877F2', prefix: 'facebook.com/' },
  { key: 'twitter', label: 'X (Twitter)', placeholder: 'username', color: '#1DA1F2', prefix: 'x.com/' },
  { key: 'youtube', label: 'YouTube', placeholder: 'channel', color: '#FF0000', prefix: 'youtube.com/@' },
  { key: 'telegram', label: 'Telegram', placeholder: 'username', color: '#0088CC', prefix: 't.me/' },
];

const SocialIcon = ({ platform, size = 20, color }: { platform: SocialPlatform; size?: number; color: string }) => {
  switch (platform) {
    case 'instagram':
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
          <Rect x="2" y="2" width="20" height="20" rx="5" stroke={color} strokeWidth="2" />
          <Circle cx="12" cy="12" r="4" stroke={color} strokeWidth="2" />
          <Circle cx="18" cy="6" r="1.5" fill={color} />
        </Svg>
      );
    case 'tiktok':
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
          <Path d="M9 12a4 4 0 1 0 4 4V4a5 5 0 0 0 5 5" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </Svg>
      );
    case 'facebook':
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
          <Path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </Svg>
      );
    case 'twitter':
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
          <Path d="M4 4l11.733 16h4.267l-11.733-16zm12.267 0l-8.267 8.667m-2.533 3.333l8.267-8.667" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </Svg>
      );
    case 'youtube':
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
          <Path d="M22.54 6.42a2.78 2.78 0 0 0-1.94-2C18.88 4 12 4 12 4s-6.88 0-8.6.46a2.78 2.78 0 0 0-1.94 2A29 29 0 0 0 1 11.75a29 29 0 0 0 .46 5.33A2.78 2.78 0 0 0 3.4 19c1.72.46 8.6.46 8.6.46s6.88 0 8.6-.46a2.78 2.78 0 0 0 1.94-2 29 29 0 0 0 .46-5.25 29 29 0 0 0-.46-5.33z" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          <Path d="M9.75 15.02l5.75-3.27-5.75-3.27v6.54z" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </Svg>
      );
    case 'telegram':
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
          <Path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </Svg>
      );
    default:
      return null;
  }
};

export default function EditProfileScreen() {
  const navigation = useNavigation();
  const { theme } = useTheme();
  const { user, updateProfile } = useAuth();

  const [name, setName] = useState(user?.name || '');
  const [bio, setBio] = useState(user?.bio || '');
  const [avatarUri, setAvatarUri] = useState<string | null>(user?.avatarUrl || null);
  const [isLoading, setIsLoading] = useState(false);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [socialLinks, setSocialLinks] = useState<Record<SocialPlatform, string>>({
    instagram: user?.socialLinks?.instagram?.handle || '',
    tiktok: user?.socialLinks?.tiktok?.handle || '',
    facebook: user?.socialLinks?.facebook?.handle || '',
    twitter: user?.socialLinks?.twitter?.handle || '',
    youtube: user?.socialLinks?.youtube?.handle || '',
    telegram: user?.socialLinks?.telegram?.handle || '',
  });

  const updateSocialLink = (platform: SocialPlatform, value: string) => {
    setSocialLinks(prev => ({ ...prev, [platform]: value.replace('@', '') }));
  };

  const buildSocialLinksPayload = (): SocialLinks => {
    const payload: SocialLinks = {};
    SOCIAL_PLATFORMS.forEach(platform => {
      const handle = socialLinks[platform.key].trim();
      if (handle) {
        payload[platform.key] = {
          handle,
          url: `https://${platform.prefix}${handle}`,
        };
      }
    });
    return payload;
  };

  const pickImage = async (useCamera: boolean) => {
    try {
      // Request permissions
      const permissionResult = useCamera
        ? await ImagePicker.requestCameraPermissionsAsync()
        : await ImagePicker.requestMediaLibraryPermissionsAsync();

      if (!permissionResult.granted) {
        Alert.alert('Izin Diperlukan', `Mohon izinkan akses ${useCamera ? 'kamera' : 'galeri foto'} untuk mengganti avatar.`);
        return;
      }

      // Launch picker
      const result = useCamera
        ? await ImagePicker.launchCameraAsync({
            allowsEditing: true,
            aspect: [1, 1],
            quality: 0.8,
          })
        : await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsEditing: true,
            aspect: [1, 1],
            quality: 0.8,
          });

      if (!result.canceled && result.assets[0]) {
        setAvatarUri(result.assets[0].uri);
      }
    } catch (error) {
      console.error('Error picking image:', error);
      Alert.alert('Gagal', 'Gagal memilih gambar. Silakan coba lagi.');
    }
  };

  const showImagePickerOptions = () => {
    Alert.alert(
      'Ganti Avatar',
      'Pilih foto dari:',
      [
        {
          text: 'Kamera',
          onPress: () => pickImage(true),
        },
        {
          text: 'Galeri Foto',
          onPress: () => pickImage(false),
        },
        {
          text: 'Batal',
          style: 'cancel',
        },
      ],
      { cancelable: true }
    );
  };

  const handleSave = async () => {
    if (!user) return;

    try {
      setIsLoading(true);

      let finalAvatarUrl = user.avatarUrl;

      // Upload new avatar if changed
      if (avatarUri && avatarUri !== user.avatarUrl) {
        setIsUploadingImage(true);
        
        // Get Supabase Auth user ID for storage path
        const { data: { session } } = await supabase.auth.getSession();
        if (!session?.user?.id) {
          throw new Error('Not authenticated');
        }

        finalAvatarUrl = await uploadAvatarAsync(avatarUri, session.user.id);
        setIsUploadingImage(false);
      }

      // Update profile
      await updateProfile({
        name: name.trim(),
        bio: bio.trim(),
        avatarUrl: finalAvatarUrl,
        socialLinks: buildSocialLinksPayload(),
      });

      Alert.alert('Berhasil', 'Profil berhasil diperbarui!', [
        { text: 'OK', onPress: () => navigation.goBack() },
      ]);
    } catch (error) {
      console.error('Error saving profile:', error);
      Alert.alert('Gagal', 'Gagal memperbarui profil. Silakan coba lagi.');
    } finally {
      setIsLoading(false);
      setIsUploadingImage(false);
    }
  };

  return (
    <ScreenKeyboardAwareScrollView>
      <Card elevation={1} style={styles.card}>
        <ThemedText style={[Typography.h2, styles.sectionTitle]}>Foto Profil</ThemedText>
        
        <View style={styles.avatarSection}>
          <Pressable
            onPress={showImagePickerOptions}
            style={({ pressed }) => [
              styles.avatarContainer,
              { opacity: pressed ? 0.7 : 1 },
            ]}
          >
            {avatarUri ? (
              <Image source={{ uri: avatarUri }} style={styles.avatar} />
            ) : (
              <View style={[styles.avatarPlaceholder, { backgroundColor: theme.backgroundSecondary }]}>
                <UserIcon size={48} color={theme.text} />
              </View>
            )}
            <View style={styles.cameraIcon}>
              <LinearGradient
                colors={['#A855F7', '#EC4899']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.cameraIconGradient}
              >
                <CameraIcon size={16} color="#FFFFFF" />
              </LinearGradient>
            </View>
          </Pressable>
          
          {isUploadingImage ? (
            <ThemedText style={[styles.uploadingText, { color: theme.textSecondary }]}>
              Mengunggah gambar...
            </ThemedText>
          ) : null}
        </View>
      </Card>

      <Card elevation={1} style={styles.card}>
        <ThemedText style={[Typography.h2, styles.sectionTitle]}>Informasi Pribadi</ThemedText>
        
        <View style={styles.inputGroup}>
          <ThemedText style={[styles.label, styles.inputLabel, { color: theme.text }]}>Nama</ThemedText>
          <TextInput
            value={name}
            onChangeText={setName}
            placeholder="Masukkan nama kamu"
            placeholderTextColor={theme.textMuted}
            style={[
              styles.input,
              {
                backgroundColor: theme.backgroundDefault,
                color: theme.text,
                borderColor: theme.backgroundSecondary,
              },
            ]}
          />
        </View>

        <View style={styles.inputGroup}>
          <ThemedText style={[styles.label, styles.inputLabel, { color: theme.text }]}>Bio</ThemedText>
          <TextInput
            value={bio}
            onChangeText={setBio}
            placeholder="Ceritakan tentang dirimu..."
            placeholderTextColor={theme.textMuted}
            multiline
            numberOfLines={4}
            textAlignVertical="top"
            style={[
              styles.input,
              styles.bioInput,
              {
                backgroundColor: theme.backgroundDefault,
                color: theme.text,
                borderColor: theme.backgroundSecondary,
              },
            ]}
          />
        </View>

        <View style={styles.inputGroup}>
          <ThemedText style={[styles.label, styles.inputLabel, { color: theme.text }]}>Email</ThemedText>
          <TextInput
            value={user?.email || ''}
            editable={false}
            style={[
              styles.input,
              {
                backgroundColor: theme.backgroundSecondary,
                color: theme.textMuted,
                borderColor: theme.backgroundSecondary,
              },
            ]}
          />
          <ThemedText style={[styles.helperText, { color: theme.textMuted }]}>
            Email tidak dapat diubah
          </ThemedText>
        </View>
      </Card>

      <Card elevation={1} style={styles.card}>
        <ThemedText style={[Typography.h2, styles.sectionTitle]}>Media Sosial</ThemedText>
        <ThemedText style={[styles.socialSubtitle, { color: theme.textSecondary }]}>
          Tambahkan akun sosial media kamu agar pengikut bisa terhubung
        </ThemedText>
        
        {SOCIAL_PLATFORMS.map((platform) => (
          <View key={platform.key} style={styles.socialInputGroup}>
            <View style={styles.socialLabelRow}>
              <View style={[styles.socialIconContainer, { backgroundColor: platform.color + '15' }]}>
                <SocialIcon platform={platform.key} size={18} color={platform.color} />
              </View>
              <ThemedText style={[styles.label, { color: theme.text }]}>{platform.label}</ThemedText>
            </View>
            <View style={styles.socialInputWrapper}>
              <ThemedText style={[styles.socialPrefix, { color: theme.textMuted }]}>@</ThemedText>
              <TextInput
                value={socialLinks[platform.key]}
                onChangeText={(value) => updateSocialLink(platform.key, value)}
                placeholder={platform.placeholder}
                placeholderTextColor={theme.textMuted}
                autoCapitalize="none"
                autoCorrect={false}
                style={[
                  styles.socialInput,
                  {
                    backgroundColor: theme.backgroundDefault,
                    color: theme.text,
                    borderColor: theme.backgroundSecondary,
                  },
                ]}
              />
            </View>
          </View>
        ))}
      </Card>

      <View style={styles.buttonContainer}>
        <LinearGradient
          colors={['#FACC15', '#84CC16']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.saveButton}
        >
          <Pressable
            onPress={handleSave}
            disabled={isLoading}
            style={({ pressed }) => [
              styles.saveButtonInner,
              { opacity: pressed || isLoading ? 0.7 : 1 },
            ]}
          >
            {isLoading ? (
              <ActivityIndicator color="#000000" />
            ) : (
              <>
                <CheckIcon size={20} color="#000000" />
                <ThemedText style={styles.saveButtonText}>Simpan Perubahan</ThemedText>
              </>
            )}
          </Pressable>
        </LinearGradient>

        <Pressable
          onPress={() => navigation.goBack()}
          disabled={isLoading}
          style={({ pressed }) => [
            styles.cancelButton,
            { opacity: pressed || isLoading ? 0.7 : 1, backgroundColor: theme.backgroundSecondary },
          ]}
        >
          <ThemedText style={[styles.cancelButtonText, { color: theme.text }]}>Batal</ThemedText>
        </Pressable>
      </View>
    </ScreenKeyboardAwareScrollView>
  );
}

const styles = StyleSheet.create({
  card: {
    marginBottom: Spacing.md,
  },
  sectionTitle: {
    marginBottom: Spacing.lg,
  },
  avatarSection: {
    alignItems: 'center',
  },
  avatarContainer: {
    position: 'relative',
  },
  avatar: {
    width: 120,
    height: 120,
    borderRadius: 60,
  },
  avatarPlaceholder: {
    width: 120,
    height: 120,
    borderRadius: 60,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cameraIcon: {
    position: 'absolute',
    bottom: 0,
    right: 0,
  },
  cameraIconGradient: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: '#000000',
  },
  uploadingText: {
    marginTop: Spacing.sm,
    fontSize: 13,
  },
  inputGroup: {
    marginBottom: Spacing.lg,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
  },
  inputLabel: {
    marginBottom: Spacing.xs,
  },
  input: {
    borderWidth: 1,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    fontSize: 15,
  },
  bioInput: {
    minHeight: 100,
    paddingTop: Spacing.md,
  },
  helperText: {
    fontSize: 12,
    marginTop: Spacing.xs,
  },
  socialSubtitle: {
    fontSize: 13,
    marginBottom: Spacing.lg,
    marginTop: -Spacing.sm,
  },
  socialInputGroup: {
    marginBottom: Spacing.md,
  },
  socialLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginBottom: Spacing.xs,
  },
  socialIconContainer: {
    width: 32,
    height: 32,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  socialInputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  socialPrefix: {
    fontSize: 15,
    marginRight: Spacing.xs,
    fontWeight: '500',
  },
  socialInput: {
    flex: 1,
    borderWidth: 1,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    fontSize: 15,
  },
  buttonContainer: {
    marginTop: Spacing.md,
    gap: Spacing.md,
  },
  saveButton: {
    borderRadius: BorderRadius.lg,
  },
  saveButtonInner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.md,
    gap: Spacing.sm,
  },
  saveButtonText: {
    color: '#000000',
    fontSize: 16,
    fontWeight: '700',
  },
  cancelButton: {
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
});

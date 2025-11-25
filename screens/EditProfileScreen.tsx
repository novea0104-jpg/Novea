import React, { useState } from 'react';
import { View, StyleSheet, Pressable, TextInput, Image, Alert, ActivityIndicator } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import * as ImagePicker from 'expo-image-picker';
import { LinearGradient } from 'expo-linear-gradient';
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

export default function EditProfileScreen() {
  const navigation = useNavigation();
  const { theme } = useTheme();
  const { user, updateProfile } = useAuth();

  const [name, setName] = useState(user?.name || '');
  const [bio, setBio] = useState(user?.bio || '');
  const [avatarUri, setAvatarUri] = useState<string | null>(user?.avatarUrl || null);
  const [isLoading, setIsLoading] = useState(false);
  const [isUploadingImage, setIsUploadingImage] = useState(false);

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
          <ThemedText style={[styles.label, { color: theme.text }]}>Nama</ThemedText>
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
          <ThemedText style={[styles.label, { color: theme.text }]}>Bio</ThemedText>
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
          <ThemedText style={[styles.label, { color: theme.text }]}>Email</ThemedText>
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

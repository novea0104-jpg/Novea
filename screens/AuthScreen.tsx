import React, { useState, useEffect } from "react";
import { View, StyleSheet, TextInput, Alert, Pressable, ScrollView, Image, Platform } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import * as SecureStore from "expo-secure-store";
import { ThemedText } from "@/components/ThemedText";
import { UserIcon } from "@/components/icons/UserIcon";
import { MailIcon } from "@/components/icons/MailIcon";
import { LockIcon } from "@/components/icons/LockIcon";
import { EyeIcon } from "@/components/icons/EyeIcon";
import { EyeOffIcon } from "@/components/icons/EyeOffIcon";
import { ArrowRightIcon } from "@/components/icons/ArrowRightIcon";
import { GiftIcon } from "@/components/icons/GiftIcon";
import { XIcon } from "@/components/icons/XIcon";
import { useAuth } from "@/contexts/AuthContext";
import { useTheme } from "@/hooks/useTheme";
import { Colors, Spacing, BorderRadius, Typography, GradientColors } from "@/constants/theme";

const SAVED_EMAIL_KEY = "novea_saved_email";

interface AuthScreenProps {
  onClose?: () => void;
}

export default function AuthScreen({ onClose }: AuthScreenProps) {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [name, setName] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [rememberEmail, setRememberEmail] = useState(false);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [forgotPasswordEmail, setForgotPasswordEmail] = useState("");
  const [isSendingReset, setIsSendingReset] = useState(false);

  const { login, signup, resetPassword } = useAuth();
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();

  useEffect(() => {
    loadSavedEmail();
  }, []);

  const loadSavedEmail = async () => {
    try {
      if (Platform.OS === "web") {
        const savedEmail = localStorage.getItem(SAVED_EMAIL_KEY);
        if (savedEmail) {
          setEmail(savedEmail);
          setRememberEmail(true);
        }
      } else {
        const savedEmail = await SecureStore.getItemAsync(SAVED_EMAIL_KEY);
        if (savedEmail) {
          setEmail(savedEmail);
          setRememberEmail(true);
        }
      }
    } catch (error) {
      console.log("Error loading saved email:", error);
    }
  };

  const saveEmail = async (emailToSave: string) => {
    try {
      if (Platform.OS === "web") {
        localStorage.setItem(SAVED_EMAIL_KEY, emailToSave);
      } else {
        await SecureStore.setItemAsync(SAVED_EMAIL_KEY, emailToSave);
      }
    } catch (error) {
      console.log("Error saving email:", error);
    }
  };

  const clearSavedEmail = async () => {
    try {
      if (Platform.OS === "web") {
        localStorage.removeItem(SAVED_EMAIL_KEY);
      } else {
        await SecureStore.deleteItemAsync(SAVED_EMAIL_KEY);
      }
    } catch (error) {
      console.log("Error clearing saved email:", error);
    }
  };

  const validateEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const handleSubmit = async () => {
    // Validation
    if (!email.trim()) {
      Alert.alert("Kesalahan", "Email harus diisi");
      return;
    }

    if (!validateEmail(email)) {
      Alert.alert("Kesalahan", "Masukkan alamat email yang valid");
      return;
    }

    if (!password.trim()) {
      Alert.alert("Kesalahan", "Kata sandi harus diisi");
      return;
    }

    if (password.length < 6) {
      Alert.alert("Kesalahan", "Kata sandi minimal 6 karakter");
      return;
    }

    if (!isLogin) {
      if (!name.trim()) {
        Alert.alert("Kesalahan", "Nama harus diisi");
        return;
      }

      if (password !== confirmPassword) {
        Alert.alert("Kesalahan", "Kata sandi tidak cocok");
        return;
      }
    }

    setIsLoading(true);

    try {
      if (isLogin) {
        await login(email.trim(), password);
        if (rememberEmail) {
          await saveEmail(email.trim());
        } else {
          await clearSavedEmail();
        }
        onClose?.();
      } else {
        await signup(email.trim(), password, name.trim());
        if (rememberEmail) {
          await saveEmail(email.trim());
        }
        Alert.alert(
          "Berhasil",
          "Akun berhasil dibuat! Selamat datang di Novea.",
          [{ text: "OK", onPress: () => onClose?.() }]
        );
      }
    } catch (error: any) {
      Alert.alert("Kesalahan", error.message || "Terjadi kesalahan");
    } finally {
      setIsLoading(false);
    }
  };

  const handleForgotPassword = async () => {
    if (!forgotPasswordEmail.trim()) {
      Alert.alert("Kesalahan", "Masukkan alamat email kamu");
      return;
    }

    if (!validateEmail(forgotPasswordEmail)) {
      Alert.alert("Kesalahan", "Masukkan alamat email yang valid");
      return;
    }

    setIsSendingReset(true);

    try {
      await resetPassword(forgotPasswordEmail.trim());
      Alert.alert(
        "Email Terkirim",
        "Kami telah mengirimkan link reset password ke email kamu. Silakan cek inbox atau folder spam.",
        [{ text: "OK", onPress: () => setShowForgotPassword(false) }]
      );
      setForgotPasswordEmail("");
    } catch (error: any) {
      Alert.alert("Kesalahan", error.message || "Gagal mengirim email reset password");
    } finally {
      setIsSendingReset(false);
    }
  };

  const switchMode = () => {
    setIsLogin(!isLogin);
    setEmail("");
    setPassword("");
    setConfirmPassword("");
    setName("");
    setShowPassword(false);
  };

  return (
    <ScrollView
      contentContainerStyle={[
        styles.container,
        {
          paddingTop: insets.top + Spacing.xl,
          paddingBottom: insets.bottom + Spacing.xl,
        },
      ]}
      style={{ backgroundColor: theme.backgroundRoot }}
      keyboardShouldPersistTaps="handled"
    >
      {onClose ? (
        <Pressable onPress={onClose} style={styles.closeButton}>
          <XIcon size={24} color={theme.text} />
        </Pressable>
      ) : null}
      
      {/* Logo Section */}
      <View style={styles.logoContainer}>
        <Image
          source={require("@/assets/images/novea-logo.png")}
          style={styles.logoImage}
          resizeMode="contain"
        />
        <ThemedText style={styles.appName}>Novea</ThemedText>
        <ThemedText style={[styles.tagline, { color: theme.textSecondary }]}>
          Teman Baca Novel Digitalmu
        </ThemedText>
      </View>

      {/* Auth Card */}
      <View style={[styles.card, { backgroundColor: theme.backgroundDefault }]}>
        {/* Mode Switcher */}
        <View style={styles.modeSwitcher}>
          <Pressable
            style={[
              styles.modeButton,
              isLogin && styles.modeButtonActive,
            ]}
            onPress={() => !isLogin && switchMode()}
          >
            {isLogin ? (
              <LinearGradient
                colors={GradientColors.purplePink.colors}
                start={GradientColors.purplePink.start}
                end={GradientColors.purplePink.end}
                style={styles.modeButtonGradient}
              >
                <ThemedText style={styles.modeButtonTextActive}>
                  Masuk
                </ThemedText>
              </LinearGradient>
            ) : (
              <ThemedText style={[styles.modeButtonText, { color: theme.textSecondary }]}>
                Masuk
              </ThemedText>
            )}
          </Pressable>

          <Pressable
            style={[
              styles.modeButton,
              !isLogin && styles.modeButtonActive,
            ]}
            onPress={() => isLogin && switchMode()}
          >
            {!isLogin ? (
              <LinearGradient
                colors={GradientColors.purplePink.colors}
                start={GradientColors.purplePink.start}
                end={GradientColors.purplePink.end}
                style={styles.modeButtonGradient}
              >
                <ThemedText style={styles.modeButtonTextActive}>
                  Daftar
                </ThemedText>
              </LinearGradient>
            ) : (
              <ThemedText style={[styles.modeButtonText, { color: theme.textSecondary }]}>
                Daftar
              </ThemedText>
            )}
          </Pressable>
        </View>

        {/* Form */}
        <View style={styles.form}>
          {!isLogin && (
            <View style={styles.inputContainer}>
              <ThemedText style={styles.label}>Nama Lengkap</ThemedText>
              <View style={[styles.inputWrapper, { backgroundColor: theme.backgroundRoot, borderColor: theme.cardBorder }]}>
                <View style={styles.inputIcon}>
                  <UserIcon size={20} color={theme.textSecondary} />
                </View>
                <TextInput
                  style={[styles.input, { color: theme.text }]}
                  placeholder="Masukkan nama kamu"
                  placeholderTextColor={theme.textMuted}
                  value={name}
                  onChangeText={setName}
                  autoCapitalize="words"
                  editable={!isLoading}
                />
              </View>
            </View>
          )}

          <View style={styles.inputContainer}>
            <ThemedText style={styles.label}>Email</ThemedText>
            <View style={[styles.inputWrapper, { backgroundColor: theme.backgroundRoot, borderColor: theme.cardBorder }]}>
              <View style={styles.inputIcon}>
                <MailIcon size={20} color={theme.textSecondary} />
              </View>
              <TextInput
                style={[styles.input, { color: theme.text }]}
                placeholder="Masukkan email kamu"
                placeholderTextColor={theme.textMuted}
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
                editable={!isLoading}
              />
            </View>
          </View>

          <View style={styles.inputContainer}>
            <ThemedText style={styles.label}>Kata Sandi</ThemedText>
            <View style={[styles.inputWrapper, { backgroundColor: theme.backgroundRoot, borderColor: theme.cardBorder }]}>
              <View style={styles.inputIcon}>
                <LockIcon size={20} color={theme.textSecondary} />
              </View>
              <TextInput
                style={[styles.input, { color: theme.text }]}
                placeholder="Masukkan kata sandi"
                placeholderTextColor={theme.textMuted}
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!showPassword}
                autoCapitalize="none"
                autoCorrect={false}
                editable={!isLoading}
              />
              <Pressable onPress={() => setShowPassword(!showPassword)} style={styles.eyeButton}>
                {showPassword ? (
                  <EyeIcon size={20} color={theme.textSecondary} />
                ) : (
                  <EyeOffIcon size={20} color={theme.textSecondary} />
                )}
              </Pressable>
            </View>
          </View>

          {!isLogin && (
            <View style={styles.inputContainer}>
              <ThemedText style={styles.label}>Konfirmasi Kata Sandi</ThemedText>
              <View style={[styles.inputWrapper, { backgroundColor: theme.backgroundRoot, borderColor: theme.cardBorder }]}>
                <View style={styles.inputIcon}>
                  <LockIcon size={20} color={theme.textSecondary} />
                </View>
                <TextInput
                  style={[styles.input, { color: theme.text }]}
                  placeholder="Konfirmasi kata sandi"
                  placeholderTextColor={theme.textMuted}
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                  secureTextEntry={!showPassword}
                  autoCapitalize="none"
                  autoCorrect={false}
                  editable={!isLoading}
                />
              </View>
            </View>
          )}

          {/* Remember Email and Forgot Password Row */}
          <View style={styles.optionsRow}>
            <Pressable 
              style={styles.rememberMeRow}
              onPress={() => setRememberEmail(!rememberEmail)}
            >
              <View style={[
                styles.checkbox,
                { borderColor: rememberEmail ? GradientColors.purplePink.colors[0] : theme.textSecondary },
                rememberEmail && { backgroundColor: GradientColors.purplePink.colors[0] }
              ]}>
                {rememberEmail ? (
                  <ThemedText style={styles.checkmark}>✓</ThemedText>
                ) : null}
              </View>
              <ThemedText style={[styles.rememberMeText, { color: theme.textSecondary }]}>
                Ingat email
              </ThemedText>
            </Pressable>

            {isLogin ? (
              <Pressable onPress={() => {
                setForgotPasswordEmail(email);
                setShowForgotPassword(true);
              }}>
                <ThemedText style={[styles.forgotPasswordText, { color: GradientColors.purplePink.colors[0] }]}>
                  Lupa kata sandi?
                </ThemedText>
              </Pressable>
            ) : null}
          </View>

          {/* Submit Button */}
          <Pressable
            onPress={handleSubmit}
            disabled={isLoading}
            style={({ pressed }) => [
              styles.submitButton,
              pressed && styles.submitButtonPressed,
            ]}
          >
            <LinearGradient
              colors={GradientColors.purplePink.colors}
              start={GradientColors.purplePink.start}
              end={GradientColors.purplePink.end}
              style={styles.submitButtonGradient}
            >
              {isLoading ? (
                <ThemedText style={styles.submitButtonText}>
                  Tunggu sebentar...
                </ThemedText>
              ) : (
                <>
                  <ThemedText style={styles.submitButtonText}>
                    {isLogin ? "Masuk" : "Buat Akun"}
                  </ThemedText>
                  <ArrowRightIcon size={20} color="#FFFFFF" />
                </>
              )}
            </LinearGradient>
          </Pressable>

          {/* Additional Info */}
          {!isLogin && (
            <View style={styles.infoBox}>
              <GiftIcon size={16} color={GradientColors.yellowGreen.colors[0]} />
              <ThemedText style={[styles.infoText, { color: theme.textSecondary }]}>
                Dapatkan 10 koin gratis saat mendaftar!
              </ThemedText>
            </View>
          )}
        </View>
      </View>

      {/* Footer */}
      <ThemedText style={[styles.footer, { color: theme.textMuted }]}>
        Dengan melanjutkan, kamu menyetujui Ketentuan Layanan dan Kebijakan Privasi Novea
      </ThemedText>

      {/* Forgot Password Modal */}
      {showForgotPassword ? (
        <Pressable 
          style={styles.modalOverlay}
          onPress={() => setShowForgotPassword(false)}
        >
          <Pressable 
            style={[styles.modalContent, { backgroundColor: theme.backgroundDefault }]}
            onPress={(e) => e.stopPropagation()}
          >
            <View style={styles.modalHeader}>
              <ThemedText style={styles.modalTitle}>Lupa Kata Sandi</ThemedText>
              <Pressable onPress={() => setShowForgotPassword(false)}>
                <XIcon size={24} color={theme.text} />
              </Pressable>
            </View>

            <ThemedText style={[styles.modalDescription, { color: theme.textSecondary }]}>
              Masukkan alamat email yang terdaftar. Kami akan mengirimkan link untuk mengatur ulang kata sandi kamu.
            </ThemedText>

            <View style={styles.inputContainer}>
              <ThemedText style={styles.label}>Email</ThemedText>
              <View style={[styles.inputWrapper, { backgroundColor: theme.backgroundRoot, borderColor: theme.cardBorder }]}>
                <View style={styles.inputIcon}>
                  <MailIcon size={20} color={theme.textSecondary} />
                </View>
                <TextInput
                  style={[styles.input, { color: theme.text }]}
                  placeholder="Masukkan email kamu"
                  placeholderTextColor={theme.textMuted}
                  value={forgotPasswordEmail}
                  onChangeText={setForgotPasswordEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                  editable={!isSendingReset}
                />
              </View>
            </View>

            <Pressable
              onPress={handleForgotPassword}
              disabled={isSendingReset}
              style={({ pressed }) => [
                styles.submitButton,
                pressed && styles.submitButtonPressed,
                { marginTop: Spacing.lg }
              ]}
            >
              <LinearGradient
                colors={GradientColors.purplePink.colors}
                start={GradientColors.purplePink.start}
                end={GradientColors.purplePink.end}
                style={styles.submitButtonGradient}
              >
                <ThemedText style={styles.submitButtonText}>
                  {isSendingReset ? "Mengirim..." : "Kirim Link Reset"}
                </ThemedText>
              </LinearGradient>
            </Pressable>
          </Pressable>
        </Pressable>
      ) : null}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing["3xl"],
  },
  logoContainer: {
    alignItems: "center",
    marginBottom: Spacing["3xl"],
  },
  logoImage: {
    width: 80,
    height: 80,
    borderRadius: BorderRadius.xl,
    marginBottom: Spacing.lg,
  },
  appName: {
    fontSize: 32,
    fontWeight: "700",
    marginBottom: Spacing.xs,
  },
  tagline: {
    fontSize: 14,
  },
  card: {
    borderRadius: BorderRadius.xl,
    padding: Spacing.xl,
    marginBottom: Spacing.xl,
  },
  modeSwitcher: {
    flexDirection: "row",
    gap: Spacing.sm,
    marginBottom: Spacing.xl,
  },
  modeButton: {
    flex: 1,
    overflow: "hidden",
    borderRadius: BorderRadius.lg,
  },
  modeButtonActive: {},
  modeButtonGradient: {
    paddingVertical: Spacing.md,
    alignItems: "center",
    justifyContent: "center",
  },
  modeButtonText: {
    fontSize: 15,
    fontWeight: "600",
    paddingVertical: Spacing.md,
    textAlign: "center",
  },
  modeButtonTextActive: {
    fontSize: 15,
    fontWeight: "700",
    color: "#FFFFFF",
  },
  form: {
    gap: Spacing.lg,
  },
  inputContainer: {
    gap: Spacing.sm,
  },
  label: {
    fontSize: 14,
    fontWeight: "600",
  },
  inputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    paddingHorizontal: Spacing.md,
    height: Spacing.inputHeight,
  },
  inputIcon: {
    marginRight: Spacing.sm,
  },
  input: {
    flex: 1,
    fontSize: 15,
  },
  eyeButton: {
    padding: Spacing.xs,
  },
  submitButton: {
    borderRadius: BorderRadius.lg,
    overflow: "hidden",
    marginTop: Spacing.md,
  },
  submitButtonPressed: {
    opacity: 0.8,
  },
  submitButtonGradient: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing.sm,
    height: Spacing.buttonHeight,
    paddingHorizontal: Spacing.xl,
  },
  submitButtonText: {
    fontSize: 16,
    fontWeight: "700",
    color: "#FFFFFF",
  },
  infoBox: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
    borderRadius: BorderRadius.md,
    backgroundColor: "rgba(250, 204, 21, 0.1)",
  },
  infoText: {
    fontSize: 13,
    flex: 1,
  },
  footer: {
    fontSize: 11,
    textAlign: "center",
    lineHeight: 16,
    paddingBottom: Spacing.xl,
  },
  closeButton: {
    position: "absolute",
    top: Spacing.xl,
    right: Spacing.lg,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 10,
  },
  optionsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: Spacing.xs,
  },
  rememberMeRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 4,
    borderWidth: 2,
    justifyContent: "center",
    alignItems: "center",
  },
  checkmark: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "700",
  },
  rememberMeText: {
    fontSize: 14,
  },
  forgotPasswordText: {
    fontSize: 14,
    fontWeight: "600",
  },
  modalOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0, 0, 0, 0.7)",
    justifyContent: "center",
    alignItems: "center",
    padding: Spacing.xl,
  },
  modalContent: {
    width: "100%",
    borderRadius: BorderRadius.xl,
    padding: Spacing.xl,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: Spacing.lg,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "700",
  },
  modalDescription: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: Spacing.xl,
  },
});

import React, { useState } from "react";
import { View, StyleSheet, TextInput, Alert, Pressable, ScrollView, Image } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { ThemedText } from "@/components/ThemedText";
import { UserIcon } from "@/components/icons/UserIcon";
import { MailIcon } from "@/components/icons/MailIcon";
import { LockIcon } from "@/components/icons/LockIcon";
import { EyeIcon } from "@/components/icons/EyeIcon";
import { EyeOffIcon } from "@/components/icons/EyeOffIcon";
import { ArrowRightIcon } from "@/components/icons/ArrowRightIcon";
import { GiftIcon } from "@/components/icons/GiftIcon";
import { useAuth } from "@/contexts/AuthContext";
import { useTheme } from "@/hooks/useTheme";
import { Colors, Spacing, BorderRadius, Typography, GradientColors } from "@/constants/theme";

export default function AuthScreen() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [name, setName] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const { login, signup } = useAuth();
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();

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
      } else {
        await signup(email.trim(), password, name.trim());
        Alert.alert(
          "Berhasil",
          "Akun berhasil dibuat! Selamat datang di Novea.",
          [{ text: "OK" }]
        );
      }
    } catch (error: any) {
      Alert.alert("Kesalahan", error.message || "Terjadi kesalahan");
    } finally {
      setIsLoading(false);
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
});

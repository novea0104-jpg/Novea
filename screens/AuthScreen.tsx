import React, { useState } from "react";
import { View, StyleSheet, TextInput, Alert, Pressable, ScrollView } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { Feather } from "@expo/vector-icons";
import { ThemedText } from "@/components/ThemedText";
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
      Alert.alert("Error", "Email is required");
      return;
    }

    if (!validateEmail(email)) {
      Alert.alert("Error", "Please enter a valid email address");
      return;
    }

    if (!password.trim()) {
      Alert.alert("Error", "Password is required");
      return;
    }

    if (password.length < 6) {
      Alert.alert("Error", "Password must be at least 6 characters");
      return;
    }

    if (!isLogin) {
      if (!name.trim()) {
        Alert.alert("Error", "Name is required");
        return;
      }

      if (password !== confirmPassword) {
        Alert.alert("Error", "Passwords do not match");
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
          "Success",
          "Account created successfully! Welcome to Novea.",
          [{ text: "OK" }]
        );
      }
    } catch (error: any) {
      // Check if it's a backend connection error
      const errorMessage = error.message || "Something went wrong";
      
      if (errorMessage.includes("fetch") || errorMessage.includes("Network") || errorMessage.includes("Failed to fetch")) {
        Alert.alert(
          "⚠️ Backend Server Not Running",
          "Backend API is not responding. Please start it first:\n\n1. Open NEW terminal in Replit\n2. Run: bash start-backend.sh\n3. Wait for success message\n4. Try signup again",
          [{ text: "Got it" }]
        );
      } else {
        Alert.alert("Error", errorMessage);
      }
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
        <LinearGradient
          colors={GradientColors.purplePink.colors}
          start={GradientColors.purplePink.start}
          end={GradientColors.purplePink.end}
          style={styles.logoGradient}
        >
          <Feather name="book-open" size={40} color="#FFFFFF" />
        </LinearGradient>
        <ThemedText style={styles.appName}>Novea</ThemedText>
        <ThemedText style={[styles.tagline, { color: theme.textSecondary }]}>
          Your Digital Novel Companion
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
                  Login
                </ThemedText>
              </LinearGradient>
            ) : (
              <ThemedText style={[styles.modeButtonText, { color: theme.textSecondary }]}>
                Login
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
                  Sign Up
                </ThemedText>
              </LinearGradient>
            ) : (
              <ThemedText style={[styles.modeButtonText, { color: theme.textSecondary }]}>
                Sign Up
              </ThemedText>
            )}
          </Pressable>
        </View>

        {/* Form */}
        <View style={styles.form}>
          {!isLogin && (
            <View style={styles.inputContainer}>
              <ThemedText style={styles.label}>Full Name</ThemedText>
              <View style={[styles.inputWrapper, { backgroundColor: theme.backgroundRoot, borderColor: theme.cardBorder }]}>
                <Feather name="user" size={20} color={theme.textSecondary} style={styles.inputIcon} />
                <TextInput
                  style={[styles.input, { color: theme.text }]}
                  placeholder="Enter your name"
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
              <Feather name="mail" size={20} color={theme.textSecondary} style={styles.inputIcon} />
              <TextInput
                style={[styles.input, { color: theme.text }]}
                placeholder="Enter your email"
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
            <ThemedText style={styles.label}>Password</ThemedText>
            <View style={[styles.inputWrapper, { backgroundColor: theme.backgroundRoot, borderColor: theme.cardBorder }]}>
              <Feather name="lock" size={20} color={theme.textSecondary} style={styles.inputIcon} />
              <TextInput
                style={[styles.input, { color: theme.text }]}
                placeholder="Enter your password"
                placeholderTextColor={theme.textMuted}
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!showPassword}
                autoCapitalize="none"
                autoCorrect={false}
                editable={!isLoading}
              />
              <Pressable onPress={() => setShowPassword(!showPassword)} style={styles.eyeIcon}>
                <Feather 
                  name={showPassword ? "eye" : "eye-off"} 
                  size={20} 
                  color={theme.textSecondary} 
                />
              </Pressable>
            </View>
          </View>

          {!isLogin && (
            <View style={styles.inputContainer}>
              <ThemedText style={styles.label}>Confirm Password</ThemedText>
              <View style={[styles.inputWrapper, { backgroundColor: theme.backgroundRoot, borderColor: theme.cardBorder }]}>
                <Feather name="lock" size={20} color={theme.textSecondary} style={styles.inputIcon} />
                <TextInput
                  style={[styles.input, { color: theme.text }]}
                  placeholder="Confirm your password"
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
                  Please wait...
                </ThemedText>
              ) : (
                <>
                  <ThemedText style={styles.submitButtonText}>
                    {isLogin ? "Login" : "Create Account"}
                  </ThemedText>
                  <Feather name="arrow-right" size={20} color="#FFFFFF" />
                </>
              )}
            </LinearGradient>
          </Pressable>

          {/* Additional Info */}
          {!isLogin && (
            <View style={styles.infoBox}>
              <Feather name="gift" size={16} color={GradientColors.yellowGreen.colors[0]} />
              <ThemedText style={[styles.infoText, { color: theme.textSecondary }]}>
                Get 100 free coins when you sign up!
              </ThemedText>
            </View>
          )}
        </View>
      </View>

      {/* Footer */}
      <ThemedText style={[styles.footer, { color: theme.textMuted }]}>
        By continuing, you agree to Novea's Terms of Service and Privacy Policy
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
  logoGradient: {
    width: 80,
    height: 80,
    borderRadius: BorderRadius.xl,
    alignItems: "center",
    justifyContent: "center",
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
  eyeIcon: {
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

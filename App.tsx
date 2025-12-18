import React from "react";
import { StyleSheet, View, ActivityIndicator, Modal, Pressable } from "react-native";
import { NavigationContainer } from "@react-navigation/native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { KeyboardProvider } from "react-native-keyboard-controller";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import { LinearGradient } from "expo-linear-gradient";

import MainTabNavigator from "@/navigation/MainTabNavigator";
import AuthScreen from "@/screens/AuthScreen";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { AppProvider } from "@/contexts/AppContext";
import { AdMobProvider } from "@/contexts/AdMobContext";
import { ThemedText } from "@/components/ThemedText";
import { Colors, Spacing, BorderRadius, GradientColors } from "@/constants/theme";

function AuthPromptModal() {
  const { isAuthPromptVisible, authPromptMessage, hideAuthPrompt } = useAuth();
  const [showAuth, setShowAuth] = React.useState(false);

  if (showAuth) {
    return (
      <Modal
        visible={true}
        animationType="slide"
        onRequestClose={() => {
          setShowAuth(false);
          hideAuthPrompt();
        }}
      >
        <AuthScreen onClose={() => {
          setShowAuth(false);
          hideAuthPrompt();
        }} />
      </Modal>
    );
  }

  return (
    <Modal
      visible={isAuthPromptVisible}
      transparent
      animationType="fade"
      onRequestClose={hideAuthPrompt}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <ThemedText style={styles.modalTitle}>Masuk Diperlukan</ThemedText>
          <ThemedText style={styles.modalMessage}>{authPromptMessage}</ThemedText>
          
          <Pressable onPress={() => setShowAuth(true)} style={styles.loginButton}>
            <LinearGradient
              colors={GradientColors.purplePink.colors}
              start={GradientColors.purplePink.start}
              end={GradientColors.purplePink.end}
              style={styles.loginButtonGradient}
            >
              <ThemedText style={styles.loginButtonText}>Masuk / Daftar</ThemedText>
            </LinearGradient>
          </Pressable>
          
          <Pressable onPress={hideAuthPrompt} style={styles.cancelButton}>
            <ThemedText style={styles.cancelButtonText}>Nanti Saja</ThemedText>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

function AppContent() {
  const { isLoading } = useAuth();

  if (isLoading) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: Colors.dark.backgroundRoot }]}>
        <ActivityIndicator size="large" color={Colors.dark.primary} />
      </View>
    );
  }

  return (
    <AppProvider>
      <AdMobProvider>
        <NavigationContainer>
          <MainTabNavigator />
        </NavigationContainer>
        <AuthPromptModal />
      </AdMobProvider>
    </AppProvider>
  );
}

export default function App() {
  return (
    <ErrorBoundary>
      <SafeAreaProvider>
        <GestureHandlerRootView style={styles.root}>
          <KeyboardProvider>
            <AuthProvider>
              <AppContent />
              <StatusBar style="light" />
            </AuthProvider>
          </KeyboardProvider>
        </GestureHandlerRootView>
      </SafeAreaProvider>
    </ErrorBoundary>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.8)",
    justifyContent: "center",
    alignItems: "center",
    padding: Spacing.xl,
  },
  modalContent: {
    backgroundColor: Colors.dark.backgroundDefault,
    borderRadius: BorderRadius.xl,
    padding: Spacing.xl,
    width: "100%",
    maxWidth: 340,
    alignItems: "center",
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: Colors.dark.text,
    marginBottom: Spacing.sm,
    textAlign: "center",
  },
  modalMessage: {
    fontSize: 15,
    color: Colors.dark.textSecondary,
    textAlign: "center",
    marginBottom: Spacing.xl,
    lineHeight: 22,
  },
  loginButton: {
    width: "100%",
    borderRadius: BorderRadius.full,
    overflow: "hidden",
    marginBottom: Spacing.md,
  },
  loginButtonGradient: {
    paddingVertical: Spacing.md,
    alignItems: "center",
  },
  loginButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
  },
  cancelButton: {
    paddingVertical: Spacing.sm,
  },
  cancelButtonText: {
    color: Colors.dark.textSecondary,
    fontSize: 14,
  },
});

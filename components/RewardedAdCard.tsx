import React, { useState, useEffect } from "react";
import { View, StyleSheet, Pressable, ActivityIndicator, Alert, Platform } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Feather } from "@expo/vector-icons";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withSequence,
} from "react-native-reanimated";
import { ThemedText } from "@/components/ThemedText";
import { Card } from "@/components/Card";
import { CoinIcon } from "@/components/icons/CoinIcon";
import { useTheme } from "@/hooks/useTheme";
import { useAuth } from "@/contexts/AuthContext";
import { useRewardedAd } from "@/hooks/useAds";
import { Spacing, BorderRadius, Typography } from "@/constants/theme";

export function RewardedAdCard() {
  const { theme } = useTheme();
  const { user, addSilverFromAd, getAdWatchesRemaining } = useAuth();
  const { show: showRewardedAd, isLoaded, reload: reloadAd, isShowing } = useRewardedAd();
  
  const [isWatching, setIsWatching] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [earnedAmount, setEarnedAmount] = useState(0);
  const [remainingAds, setRemainingAds] = useState(5);

  const buttonScale = useSharedValue(1);
  const successScale = useSharedValue(0);
  const successOpacity = useSharedValue(0);

  useEffect(() => {
    loadRemainingAds();
  }, [user]);

  const loadRemainingAds = async () => {
    const remaining = await getAdWatchesRemaining();
    setRemainingAds(remaining);
  };

  const animatedButtonStyle = useAnimatedStyle(() => ({
    transform: [{ scale: buttonScale.value }],
  }));

  const animatedSuccessStyle = useAnimatedStyle(() => ({
    transform: [{ scale: successScale.value }],
    opacity: successOpacity.value,
  }));

  const handleWatchAd = async () => {
    if (isWatching || isShowing || !user) return;
    
    if (remainingAds <= 0) {
      Alert.alert(
        "Batas Tercapai", 
        "Kamu sudah menonton 5 iklan hari ini. Kembali lagi besok untuk mendapatkan lebih banyak Silver!"
      );
      return;
    }

    setIsWatching(true);
    buttonScale.value = withSequence(
      withSpring(0.95),
      withSpring(1)
    );

    try {
      const handleRewardSuccess = async () => {
        const result = await addSilverFromAd();
        
        if (result.success && result.amount) {
          setEarnedAmount(result.amount);
          const freshRemaining = await getAdWatchesRemaining();
          setRemainingAds(freshRemaining);
          setShowSuccess(true);
          
          successScale.value = withSequence(
            withSpring(1.2, { damping: 8 }),
            withSpring(1)
          );
          successOpacity.value = withSpring(1);

          setTimeout(() => {
            successOpacity.value = withSpring(0);
            successScale.value = withSpring(0);
            setTimeout(() => setShowSuccess(false), 300);
          }, 2000);
        } else if (result.error) {
          Alert.alert("Gagal", result.error);
        }
      };

      const adShown = await showRewardedAd(async (reward) => {
        await handleRewardSuccess();
      });

      if (!adShown) {
        if (Platform.OS === 'web') {
          await handleRewardSuccess();
        } else {
          Alert.alert(
            "Iklan Tidak Tersedia",
            "Iklan belum siap. Fitur ini memerlukan build produksi dengan EAS Build."
          );
        }
      }
      
      reloadAd();
    } catch (error) {
      console.error("Watch ad error:", error);
      Alert.alert("Error", "Terjadi kesalahan saat memuat iklan.");
    } finally {
      setIsWatching(false);
    }
  };

  const canWatch = remainingAds > 0 && user;

  return (
    <Card elevation={2} style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <LinearGradient
            colors={["#10B981", "#059669"]}
            style={styles.iconContainer}
          >
            <Feather name="play-circle" size={20} color="#FFFFFF" />
          </LinearGradient>
          <View style={{ flex: 1 }}>
            <ThemedText style={[Typography.h3, styles.title]}>Tonton Iklan</ThemedText>
            <ThemedText style={[styles.subtitle, { color: theme.textSecondary }]}>
              Dapatkan 5-10 Silver gratis per iklan!
            </ThemedText>
          </View>
        </View>
      </View>

      <View style={styles.infoRow}>
        <View style={[styles.infoBox, { backgroundColor: theme.backgroundSecondary }]}>
          <ThemedText style={[styles.infoValue, { color: theme.primary }]}>
            {remainingAds}
          </ThemedText>
          <ThemedText style={[styles.infoLabel, { color: theme.textSecondary }]}>
            Iklan tersisa
          </ThemedText>
        </View>
        <View style={[styles.infoBox, { backgroundColor: theme.backgroundSecondary }]}>
          <ThemedText style={[styles.infoValue, { color: "#10B981" }]}>
            5-10
          </ThemedText>
          <ThemedText style={[styles.infoLabel, { color: theme.textSecondary }]}>
            Silver per iklan
          </ThemedText>
        </View>
        <View style={[styles.infoBox, { backgroundColor: theme.backgroundSecondary }]}>
          <ThemedText style={[styles.infoValue, { color: "#F59E0B" }]}>
            5x
          </ThemedText>
          <ThemedText style={[styles.infoLabel, { color: theme.textSecondary }]}>
            Maks per hari
          </ThemedText>
        </View>
      </View>

      <Animated.View style={animatedButtonStyle}>
        <Pressable
          onPress={handleWatchAd}
          disabled={isWatching || !canWatch}
          style={({ pressed }) => ({ opacity: pressed ? 0.8 : 1 })}
        >
          <LinearGradient
            colors={
              !canWatch
                ? [theme.backgroundSecondary, theme.backgroundSecondary]
                : ["#10B981", "#059669"]
            }
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.watchButton}
          >
            {isWatching ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : !canWatch ? (
              <>
                <Feather name="clock" size={16} color={theme.textMuted} />
                <ThemedText style={[styles.watchButtonText, { color: theme.textMuted }]}>
                  {!user ? "Masuk untuk menonton" : "Kembali besok"}
                </ThemedText>
              </>
            ) : (
              <>
                <Feather name="play" size={16} color="#FFFFFF" />
                <ThemedText style={[styles.watchButtonText, { color: "#FFFFFF" }]}>
                  Tonton Iklan
                </ThemedText>
              </>
            )}
          </LinearGradient>
        </Pressable>
      </Animated.View>

      {showSuccess ? (
        <Animated.View style={[styles.successOverlay, animatedSuccessStyle]}>
          <LinearGradient
            colors={["#C0C0C0", "#A8A8A8"]}
            style={styles.successBadge}
          >
            <CoinIcon size={32} color="#FFFFFF" />
            <ThemedText style={styles.successText}>+{earnedAmount}</ThemedText>
            <ThemedText style={styles.successLabel}>Silver Novoin!</ThemedText>
          </LinearGradient>
        </Animated.View>
      ) : null}
    </Card>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: Spacing.lg,
    marginBottom: Spacing.lg,
    overflow: "hidden",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: Spacing.lg,
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.md,
    flex: 1,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
  },
  title: {
    marginBottom: 2,
  },
  subtitle: {
    fontSize: 12,
  },
  infoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: Spacing.sm,
    marginBottom: Spacing.lg,
  },
  infoBox: {
    flex: 1,
    alignItems: "center",
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.xs,
    borderRadius: BorderRadius.sm,
  },
  infoValue: {
    fontSize: 18,
    fontWeight: "700",
  },
  infoLabel: {
    fontSize: 10,
    marginTop: 2,
    textAlign: "center",
  },
  watchButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing.sm,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
    borderRadius: BorderRadius.md,
  },
  watchButtonText: {
    fontSize: 14,
    fontWeight: "700",
  },
  successOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.7)",
    borderRadius: BorderRadius.md,
  },
  successBadge: {
    alignItems: "center",
    padding: Spacing.xl,
    borderRadius: BorderRadius.lg,
  },
  successText: {
    fontSize: 36,
    fontWeight: "800",
    color: "#FFFFFF",
    marginTop: Spacing.sm,
  },
  successLabel: {
    fontSize: 14,
    color: "#FFFFFF",
    opacity: 0.9,
  },
});

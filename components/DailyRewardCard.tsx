import React, { useState, useEffect } from "react";
import { View, StyleSheet, Pressable, ActivityIndicator } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withSequence,
  withDelay,
  runOnJS,
} from "react-native-reanimated";
import { ThemedText } from "@/components/ThemedText";
import { Card } from "@/components/Card";
import { CoinIcon } from "@/components/icons/CoinIcon";
import { CheckIcon } from "@/components/icons/CheckIcon";
import { GiftIcon } from "@/components/icons/GiftIcon";
import { useTheme } from "@/hooks/useTheme";
import { useAuth } from "@/contexts/AuthContext";
import { Spacing, BorderRadius, Typography } from "@/constants/theme";

const DAILY_REWARDS = [
  { day: 1, silver: 1 },
  { day: 2, silver: 1 },
  { day: 3, silver: 1 },
  { day: 4, silver: 10 },
  { day: 5, silver: 10 },
  { day: 6, silver: 10 },
  { day: 7, silver: 20 },
];

function getRewardForDay(day: number): number {
  if (day <= 0) return DAILY_REWARDS[0].silver;
  if (day > 7) return DAILY_REWARDS[6].silver;
  return DAILY_REWARDS[day - 1].silver;
}

function isSameDay(date1: Date, date2: Date): boolean {
  return (
    date1.getFullYear() === date2.getFullYear() &&
    date1.getMonth() === date2.getMonth() &&
    date1.getDate() === date2.getDate()
  );
}

function isYesterday(date: Date, today: Date): boolean {
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  return isSameDay(date, yesterday);
}

export function DailyRewardCard() {
  const { theme } = useTheme();
  const { user, claimDailyReward } = useAuth();
  const [isClaiming, setIsClaiming] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [claimedAmount, setClaimedAmount] = useState(0);

  const buttonScale = useSharedValue(1);
  const successScale = useSharedValue(0);
  const successOpacity = useSharedValue(0);

  const today = new Date();
  const lastClaimDate = user?.lastClaimDate ? new Date(user.lastClaimDate) : null;
  const currentStreak = user?.claimStreak || 0;
  
  const alreadyClaimedToday = lastClaimDate ? isSameDay(lastClaimDate, today) : false;
  
  const streakBroken = lastClaimDate 
    ? !isSameDay(lastClaimDate, today) && !isYesterday(lastClaimDate, today)
    : false;
  
  const displayStreak = streakBroken ? 0 : currentStreak;
  const nextDay = alreadyClaimedToday ? displayStreak : (displayStreak % 7) + 1;
  const nextReward = getRewardForDay(nextDay);

  const animatedButtonStyle = useAnimatedStyle(() => ({
    transform: [{ scale: buttonScale.value }],
  }));

  const animatedSuccessStyle = useAnimatedStyle(() => ({
    transform: [{ scale: successScale.value }],
    opacity: successOpacity.value,
  }));

  const handleClaim = async () => {
    if (isClaiming || alreadyClaimedToday || !user) return;

    setIsClaiming(true);
    buttonScale.value = withSequence(
      withSpring(0.95),
      withSpring(1)
    );

    try {
      const result = await claimDailyReward();
      if (result.success && result.amount) {
        setClaimedAmount(result.amount);
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
      }
    } catch (error) {
      console.error("Claim error:", error);
    } finally {
      setIsClaiming(false);
    }
  };

  return (
    <Card elevation={2} style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <LinearGradient
            colors={["#C0C0C0", "#A8A8A8"]}
            style={styles.iconContainer}
          >
            <GiftIcon size={20} color="#FFFFFF" />
          </LinearGradient>
          <View>
            <ThemedText style={[Typography.h3, styles.title]}>Hadiah Harian</ThemedText>
            <ThemedText style={[styles.subtitle, { color: theme.textSecondary }]}>
              Klaim setiap hari untuk bonus lebih besar!
            </ThemedText>
          </View>
        </View>
      </View>

      <View style={styles.daysContainer}>
        {DAILY_REWARDS.map((reward, index) => {
          const dayNumber = index + 1;
          const isClaimed = dayNumber <= displayStreak && !streakBroken;
          const isToday = dayNumber === nextDay && !alreadyClaimedToday;
          const isSpecialDay = dayNumber === 4 || dayNumber === 7;

          return (
            <View
              key={dayNumber}
              style={[
                styles.dayItem,
                isClaimed && styles.dayItemClaimed,
                isToday && styles.dayItemToday,
                isSpecialDay && styles.dayItemSpecial,
                { 
                  backgroundColor: isClaimed 
                    ? theme.success + "20" 
                    : isToday 
                      ? theme.primary + "20"
                      : theme.backgroundSecondary 
                },
              ]}
            >
              {isClaimed ? (
                <View style={[styles.claimedCheck, { backgroundColor: theme.success }]}>
                  <CheckIcon size={12} color="#FFFFFF" />
                </View>
              ) : (
                <LinearGradient
                  colors={isSpecialDay ? ["#FFD700", "#FFA500"] : ["#C0C0C0", "#A8A8A8"]}
                  style={styles.dayCoinIcon}
                >
                  <CoinIcon size={isSpecialDay ? 14 : 12} color="#FFFFFF" />
                </LinearGradient>
              )}
              <ThemedText 
                style={[
                  styles.dayReward, 
                  isClaimed && { color: theme.success },
                  isToday && { color: theme.primary, fontWeight: "700" },
                  isSpecialDay && !isClaimed && { color: "#FFD700", fontWeight: "700" },
                ]}
              >
                +{reward.silver}
              </ThemedText>
              <ThemedText 
                style={[
                  styles.dayLabel, 
                  { color: theme.textMuted },
                  isToday && { color: theme.primary },
                ]}
              >
                Hari {dayNumber}
              </ThemedText>
            </View>
          );
        })}
      </View>

      <View style={styles.footer}>
        <View style={styles.streakInfo}>
          <ThemedText style={[styles.streakLabel, { color: theme.textSecondary }]}>
            Streak saat ini
          </ThemedText>
          <ThemedText style={[styles.streakValue, { color: theme.primary }]}>
            {displayStreak} hari
          </ThemedText>
        </View>

        <Animated.View style={animatedButtonStyle}>
          <Pressable
            onPress={handleClaim}
            disabled={isClaiming || alreadyClaimedToday}
            style={({ pressed }) => ({ opacity: pressed ? 0.8 : 1 })}
          >
            <LinearGradient
              colors={
                alreadyClaimedToday
                  ? [theme.backgroundSecondary, theme.backgroundSecondary]
                  : ["#C0C0C0", "#A8A8A8"]
              }
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.claimButton}
            >
              {isClaiming ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : alreadyClaimedToday ? (
                <>
                  <CheckIcon size={16} color={theme.textMuted} />
                  <ThemedText style={[styles.claimButtonText, { color: theme.textMuted }]}>
                    Sudah Diklaim
                  </ThemedText>
                </>
              ) : (
                <>
                  <CoinIcon size={16} color="#FFFFFF" />
                  <ThemedText style={[styles.claimButtonText, { color: "#FFFFFF" }]}>
                    Klaim +{nextReward} Silver
                  </ThemedText>
                </>
              )}
            </LinearGradient>
          </Pressable>
        </Animated.View>
      </View>

      {showSuccess ? (
        <Animated.View style={[styles.successOverlay, animatedSuccessStyle]}>
          <LinearGradient
            colors={["#C0C0C0", "#A8A8A8"]}
            style={styles.successBadge}
          >
            <CoinIcon size={32} color="#FFFFFF" />
            <ThemedText style={styles.successText}>+{claimedAmount}</ThemedText>
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
  daysContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: Spacing.xs,
    marginBottom: Spacing.lg,
  },
  dayItem: {
    flex: 1,
    alignItems: "center",
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.xs,
    borderRadius: BorderRadius.sm,
    minWidth: 40,
  },
  dayItemClaimed: {
    borderWidth: 1,
    borderColor: "rgba(34, 197, 94, 0.3)",
  },
  dayItemToday: {
    borderWidth: 2,
    borderColor: "rgba(147, 51, 234, 0.5)",
  },
  dayItemSpecial: {
    borderWidth: 1,
    borderColor: "rgba(255, 215, 0, 0.3)",
  },
  claimedCheck: {
    width: 20,
    height: 20,
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 2,
  },
  dayCoinIcon: {
    width: 20,
    height: 20,
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 2,
  },
  dayReward: {
    fontSize: 11,
    fontWeight: "600",
  },
  dayLabel: {
    fontSize: 8,
    marginTop: 2,
  },
  footer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  streakInfo: {
    flex: 1,
  },
  streakLabel: {
    fontSize: 11,
  },
  streakValue: {
    fontSize: 18,
    fontWeight: "700",
  },
  claimButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing.xs,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.lg,
    borderRadius: BorderRadius.md,
    minWidth: 140,
  },
  claimButtonText: {
    fontSize: 13,
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

import React from "react";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { Feather } from "@expo/vector-icons";
import { BlurView } from "expo-blur";
import { View, Pressable, Platform, StyleSheet } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import BrowseStackNavigator from "@/navigation/BrowseStackNavigator";
import LibraryStackNavigator from "@/navigation/LibraryStackNavigator";
import NotificationsStackNavigator from "@/navigation/NotificationsStackNavigator";
import ProfileStackNavigator from "@/navigation/ProfileStackNavigator";
import { ThemedText } from "@/components/ThemedText";
import { useTheme } from "@/hooks/useTheme";
import { Spacing, BorderRadius, GradientColors } from "@/constants/theme";

export type MainTabParamList = {
  BrowseTab: undefined;
  LibraryTab: undefined;
  NotificationsTab: undefined;
  ProfileTab: undefined;
};

const Tab = createBottomTabNavigator<MainTabParamList>();

function CustomTabBar({ state, descriptors, navigation }: any) {
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.tabBarContainer, { paddingBottom: insets.bottom + Spacing.md }]}>
      {Platform.OS === "ios" ? (
        <BlurView intensity={100} tint="dark" style={styles.blurContainer}>
          <LinearGradient
            colors={["rgba(168, 85, 247, 0.1)", "rgba(236, 72, 153, 0.1)"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.gradientBorder}
          >
            <View style={[styles.tabBarContent, { backgroundColor: "rgba(0, 0, 0, 0.4)" }]}>
              {state.routes.map((route: any, index: number) => {
                const { options } = descriptors[route.key];
                const label = options.title || route.name;
                const isFocused = state.index === index;

                const onPress = () => {
                  const event = navigation.emit({
                    type: "tabPress",
                    target: route.key,
                    canPreventDefault: true,
                  });

                  if (!isFocused && !event.defaultPrevented) {
                    navigation.navigate(route.name);
                  }
                };

                return (
                  <Pressable
                    key={route.key}
                    onPress={onPress}
                    style={styles.tabItem}
                  >
                    {isFocused ? (
                      <LinearGradient
                        colors={GradientColors.purplePink.colors}
                        start={GradientColors.purplePink.start}
                        end={GradientColors.purplePink.end}
                        style={styles.activeTabPill}
                      >
                        <Feather 
                          name={options.tabBarIcon({ color: "#FFFFFF", size: 20 }).props.name} 
                          size={20} 
                          color="#FFFFFF" 
                        />
                        <ThemedText style={styles.activeTabLabel}>{label}</ThemedText>
                      </LinearGradient>
                    ) : (
                      <View style={styles.inactiveTab}>
                        <Feather 
                          name={options.tabBarIcon({ color: theme.tabIconDefault, size: 20 }).props.name} 
                          size={20} 
                          color={theme.tabIconDefault} 
                          style={{ opacity: 0.6 }}
                        />
                        <ThemedText style={[styles.inactiveTabLabel, { color: theme.tabIconDefault }]}>
                          {label}
                        </ThemedText>
                      </View>
                    )}
                  </Pressable>
                );
              })}
            </View>
          </LinearGradient>
        </BlurView>
      ) : (
        <LinearGradient
          colors={["rgba(26, 26, 26, 0.95)", "rgba(0, 0, 0, 0.98)"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 0, y: 1 }}
          style={styles.androidContainer}
        >
          <LinearGradient
            colors={["rgba(168, 85, 247, 0.2)", "rgba(236, 72, 153, 0.2)"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.gradientBorder}
          >
            <View style={[styles.tabBarContent, { backgroundColor: theme.backgroundRoot }]}>
              {state.routes.map((route: any, index: number) => {
                const { options } = descriptors[route.key];
                const label = options.title || route.name;
                const isFocused = state.index === index;

                const onPress = () => {
                  const event = navigation.emit({
                    type: "tabPress",
                    target: route.key,
                    canPreventDefault: true,
                  });

                  if (!isFocused && !event.defaultPrevented) {
                    navigation.navigate(route.name);
                  }
                };

                return (
                  <Pressable
                    key={route.key}
                    onPress={onPress}
                    style={styles.tabItem}
                  >
                    {isFocused ? (
                      <LinearGradient
                        colors={GradientColors.purplePink.colors}
                        start={GradientColors.purplePink.start}
                        end={GradientColors.purplePink.end}
                        style={styles.activeTabPill}
                      >
                        <Feather 
                          name={options.tabBarIcon({ color: "#FFFFFF", size: 20 }).props.name} 
                          size={20} 
                          color="#FFFFFF" 
                        />
                        <ThemedText style={styles.activeTabLabel}>{label}</ThemedText>
                      </LinearGradient>
                    ) : (
                      <View style={styles.inactiveTab}>
                        <Feather 
                          name={options.tabBarIcon({ color: theme.tabIconDefault, size: 20 }).props.name} 
                          size={20} 
                          color={theme.tabIconDefault} 
                          style={{ opacity: 0.6 }}
                        />
                        <ThemedText style={[styles.inactiveTabLabel, { color: theme.tabIconDefault }]}>
                          {label}
                        </ThemedText>
                      </View>
                    )}
                  </Pressable>
                );
              })}
            </View>
          </LinearGradient>
        </LinearGradient>
      )}
    </View>
  );
}

export default function MainTabNavigator() {
  const { theme } = useTheme();

  return (
    <Tab.Navigator
      initialRouteName="BrowseTab"
      tabBar={(props) => <CustomTabBar {...props} />}
      screenOptions={{
        headerShown: false,
      }}
    >
      <Tab.Screen
        name="BrowseTab"
        component={BrowseStackNavigator}
        options={{
          title: "Browse",
          tabBarIcon: ({ color, size }) => (
            <Feather name="compass" size={size} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="LibraryTab"
        component={LibraryStackNavigator}
        options={{
          title: "Library",
          tabBarIcon: ({ color, size }) => (
            <Feather name="book-open" size={size} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="NotificationsTab"
        component={NotificationsStackNavigator}
        options={{
          title: "Notifications",
          tabBarIcon: ({ color, size }) => (
            <Feather name="bell" size={size} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="ProfileTab"
        component={ProfileStackNavigator}
        options={{
          title: "Profile",
          tabBarIcon: ({ color, size }) => (
            <Feather name="user" size={size} color={color} />
          ),
        }}
      />
    </Tab.Navigator>
  );
}

const styles = StyleSheet.create({
  tabBarContainer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.md,
  },
  blurContainer: {
    borderRadius: BorderRadius.xl,
    overflow: "hidden",
  },
  androidContainer: {
    borderRadius: BorderRadius.xl,
    overflow: "hidden",
  },
  gradientBorder: {
    padding: 2,
    borderRadius: BorderRadius.xl,
  },
  tabBarContent: {
    flexDirection: "row",
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.sm,
    borderRadius: BorderRadius.xl,
    gap: Spacing.xs,
  },
  tabItem: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  activeTabPill: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing.xs,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    borderRadius: BorderRadius.lg,
    minHeight: 44,
  },
  activeTabLabel: {
    fontSize: 12,
    fontWeight: "700",
    color: "#FFFFFF",
  },
  inactiveTab: {
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
    paddingVertical: Spacing.sm,
    minHeight: 44,
  },
  inactiveTabLabel: {
    fontSize: 10,
    fontWeight: "600",
    opacity: 0.7,
  },
});

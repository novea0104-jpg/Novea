import React, { useState, useCallback } from "react";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { getFocusedRouteNameFromRoute, useFocusEffect } from "@react-navigation/native";
import { View, Pressable, StyleSheet, Image } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import BrowseStackNavigator from "@/navigation/BrowseStackNavigator";
import LibraryStackNavigator from "@/navigation/LibraryStackNavigator";
import TimelineStackNavigator from "@/navigation/TimelineStackNavigator";
import NotificationsStackNavigator from "@/navigation/NotificationsStackNavigator";
import ProfileStackNavigator from "@/navigation/ProfileStackNavigator";
import { ThemedText } from "@/components/ThemedText";
import { useTheme } from "@/hooks/useTheme";
import { useAuth } from "@/contexts/AuthContext";
import { useResponsive } from "@/hooks/useResponsive";
import { Spacing, BorderRadius } from "@/constants/theme";
import { BrowseIcon } from "@/components/icons/BrowseIcon";
import { LibraryIcon } from "@/components/icons/LibraryIcon";
import { TimelineIcon } from "@/components/icons/TimelineIcon";
import { NotificationsIcon } from "@/components/icons/NotificationsIcon";
import { ProfileIcon } from "@/components/icons/ProfileIcon";
import { getUnreadNotificationCount } from "@/utils/supabase";

const HIDDEN_TAB_BAR_ROUTES = ['Messages', 'MessageThread', 'NewMessage', 'NovelDetail', 'Reader', 'WriterCenter', 'AdminDashboard'];

const PROTECTED_TABS = ["LibraryTab", "NotificationsTab", "ProfileTab"];

export type MainTabParamList = {
  BrowseTab: undefined;
  LibraryTab: undefined;
  TimelineTab: undefined;
  NotificationsTab: undefined;
  ProfileTab: undefined;
};

const Tab = createBottomTabNavigator<MainTabParamList>();

function DesktopSidebar({ state, descriptors, navigation }: any) {
  const { theme } = useTheme();
  const { user, requireAuth } = useAuth();
  const insets = useSafeAreaInsets();
  const [notificationBadge, setNotificationBadge] = useState(0);

  const AUTH_MESSAGES: { [key: string]: string } = {
    LibraryTab: "Masuk untuk melihat koleksi novel kamu",
    NotificationsTab: "Masuk untuk melihat notifikasi",
    ProfileTab: "Masuk untuk mengakses profil kamu",
  };

  useFocusEffect(
    useCallback(() => {
      const loadBadge = async () => {
        if (user) {
          const count = await getUnreadNotificationCount(parseInt(user.id));
          setNotificationBadge(count);
        } else {
          setNotificationBadge(0);
        }
      };
      loadBadge();
    }, [user])
  );

  const currentRoute = state.routes[state.index];
  const focusedRouteName = getFocusedRouteNameFromRoute(currentRoute);
  
  if (focusedRouteName && HIDDEN_TAB_BAR_ROUTES.includes(focusedRouteName)) {
    return null;
  }

  return (
    <View 
      style={[
        styles.sidebarContainer, 
        { 
          paddingTop: insets.top + Spacing.lg,
          backgroundColor: theme.backgroundRoot,
          borderRightColor: theme.cardBorder,
        }
      ]}
    >
      <View style={styles.sidebarLogo}>
        <Image
          source={require("@/assets/images/novea-logo.png")}
          style={styles.sidebarLogoImage}
          resizeMode="contain"
        />
        <ThemedText style={styles.sidebarLogoText}>ovea</ThemedText>
      </View>
      
      <View style={styles.sidebarNav}>
        {state.routes.map((route: any, index: number) => {
          const { options } = descriptors[route.key];
          const label = options.title || route.name;
          const isFocused = state.index === index;

          const onPress = () => {
            if (!user && PROTECTED_TABS.includes(route.name)) {
              requireAuth(AUTH_MESSAGES[route.name]);
              return;
            }

            const event = navigation.emit({
              type: "tabPress",
              target: route.key,
              canPreventDefault: true,
            });

            if (!isFocused && !event.defaultPrevented) {
              navigation.navigate(route.name);
            }
          };

          const iconColor = isFocused ? "#A855F7" : theme.tabIconDefault;
          const textColor = isFocused ? "#A855F7" : theme.tabIconDefault;
          const IconComponent = options.tabBarIcon({ color: iconColor, size: 22 });
          const showBadge = route.name === "NotificationsTab" && notificationBadge > 0;
          
          return (
            <Pressable
              key={route.key}
              onPress={onPress}
              style={({ pressed }) => [
                styles.sidebarItem,
                isFocused && styles.sidebarItemActive,
                { opacity: pressed ? 0.7 : 1, backgroundColor: isFocused ? "rgba(168, 85, 247, 0.1)" : "transparent" }
              ]}
            >
              <View style={styles.sidebarIconWrapper}>
                {IconComponent}
                {showBadge ? (
                  <View style={styles.sidebarBadge}>
                    <ThemedText style={styles.badgeText} lightColor="#FFFFFF" darkColor="#FFFFFF">
                      {notificationBadge > 99 ? "99+" : notificationBadge}
                    </ThemedText>
                  </View>
                ) : null}
              </View>
              <ThemedText 
                lightColor={textColor}
                darkColor={textColor}
                style={[
                  styles.sidebarLabel,
                  { fontWeight: isFocused ? "700" : "500" }
                ]}
              >
                {label}
              </ThemedText>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

function CustomTabBar({ state, descriptors, navigation }: any) {
  const { theme } = useTheme();
  const { user, requireAuth } = useAuth();
  const insets = useSafeAreaInsets();
  const { isDesktop, isTablet } = useResponsive();
  const [notificationBadge, setNotificationBadge] = useState(0);

  const AUTH_MESSAGES: { [key: string]: string } = {
    LibraryTab: "Masuk untuk melihat koleksi novel kamu",
    NotificationsTab: "Masuk untuk melihat notifikasi",
    ProfileTab: "Masuk untuk mengakses profil kamu",
  };

  useFocusEffect(
    useCallback(() => {
      const loadBadge = async () => {
        if (user) {
          const count = await getUnreadNotificationCount(parseInt(user.id));
          setNotificationBadge(count);
        } else {
          setNotificationBadge(0);
        }
      };
      loadBadge();
    }, [user])
  );

  const currentRoute = state.routes[state.index];
  const focusedRouteName = getFocusedRouteNameFromRoute(currentRoute);
  
  if (focusedRouteName && HIDDEN_TAB_BAR_ROUTES.includes(focusedRouteName)) {
    return null;
  }

  if (isDesktop || isTablet) {
    return <DesktopSidebar state={state} descriptors={descriptors} navigation={navigation} />;
  }

  return (
    <View 
      style={[
        styles.tabBarContainer, 
        { 
          paddingBottom: insets.bottom,
          backgroundColor: theme.backgroundRoot,
        }
      ]}
    >
      {state.routes.map((route: any, index: number) => {
        const { options } = descriptors[route.key];
        const label = options.title || route.name;
        const isFocused = state.index === index;

        const onPress = () => {
          if (!user && PROTECTED_TABS.includes(route.name)) {
            requireAuth(AUTH_MESSAGES[route.name]);
            return;
          }

          const event = navigation.emit({
            type: "tabPress",
            target: route.key,
            canPreventDefault: true,
          });

          if (!isFocused && !event.defaultPrevented) {
            navigation.navigate(route.name);
          }
        };

        const iconColor = isFocused ? "#A855F7" : theme.tabIconDefault;
        const textColor = isFocused ? "#A855F7" : theme.tabIconDefault;

        const IconComponent = options.tabBarIcon({ color: iconColor, size: 24 });

        const showBadge = route.name === "NotificationsTab" && notificationBadge > 0;
        
        return (
          <Pressable
            key={route.key}
            onPress={onPress}
            style={styles.tabItem}
          >
            <View style={styles.iconWrapper}>
              {IconComponent}
              {showBadge ? (
                <View style={styles.badge}>
                  <ThemedText style={styles.badgeText} lightColor="#FFFFFF" darkColor="#FFFFFF">
                    {notificationBadge > 99 ? "99+" : notificationBadge}
                  </ThemedText>
                </View>
              ) : null}
            </View>
            <ThemedText 
              lightColor={textColor}
              darkColor={textColor}
              style={[
                styles.tabLabel,
                { fontWeight: isFocused ? "700" : "500" }
              ]}
            >
              {label}
            </ThemedText>
          </Pressable>
        );
      })}
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
          title: "Beranda",
          tabBarIcon: ({ color, size }) => (
            <BrowseIcon size={size} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="LibraryTab"
        component={LibraryStackNavigator}
        options={{
          title: "Library",
          tabBarIcon: ({ color, size }) => (
            <LibraryIcon size={size} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="TimelineTab"
        component={TimelineStackNavigator}
        options={{
          title: "Linimasa",
          tabBarIcon: ({ color, size }) => (
            <TimelineIcon size={size} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="NotificationsTab"
        component={NotificationsStackNavigator}
        options={{
          title: "Notifications",
          tabBarIcon: ({ color, size }) => (
            <NotificationsIcon size={size} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="ProfileTab"
        component={ProfileStackNavigator}
        options={{
          title: "Profile",
          tabBarIcon: ({ color, size }) => (
            <ProfileIcon size={size} color={color} />
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
    flexDirection: "row",
    paddingTop: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: "rgba(255, 255, 255, 0.1)",
  },
  tabItem: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: Spacing.sm,
    gap: 4,
  },
  iconWrapper: {
    position: "relative",
  },
  badge: {
    position: "absolute",
    top: -6,
    right: -10,
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: "#EF4444",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 4,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: "700",
  },
  tabLabel: {
    fontSize: 11,
    marginTop: 2,
  },
  sidebarContainer: {
    position: "absolute",
    top: 0,
    left: 0,
    bottom: 0,
    width: 220,
    borderRightWidth: 1,
    paddingHorizontal: Spacing.md,
  },
  sidebarLogo: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: Spacing.sm,
    marginBottom: Spacing.xl,
    gap: 4,
  },
  sidebarLogoImage: {
    width: 32,
    height: 32,
  },
  sidebarLogoText: {
    fontSize: 22,
    fontWeight: "700",
  },
  sidebarNav: {
    flex: 1,
    gap: Spacing.xs,
  },
  sidebarItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.sm,
    borderRadius: BorderRadius.md,
    gap: Spacing.md,
  },
  sidebarItemActive: {
    borderLeftWidth: 3,
    borderLeftColor: "#A855F7",
  },
  sidebarIconWrapper: {
    position: "relative",
  },
  sidebarBadge: {
    position: "absolute",
    top: -6,
    right: -10,
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: "#EF4444",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 4,
  },
  sidebarLabel: {
    fontSize: 14,
  },
});

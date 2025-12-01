import React from "react";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { getFocusedRouteNameFromRoute } from "@react-navigation/native";
import { View, Pressable, StyleSheet } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import BrowseStackNavigator from "@/navigation/BrowseStackNavigator";
import LibraryStackNavigator from "@/navigation/LibraryStackNavigator";
import TimelineStackNavigator from "@/navigation/TimelineStackNavigator";
import NotificationsStackNavigator from "@/navigation/NotificationsStackNavigator";
import ProfileStackNavigator from "@/navigation/ProfileStackNavigator";
import { ThemedText } from "@/components/ThemedText";
import { useTheme } from "@/hooks/useTheme";
import { useAuth } from "@/contexts/AuthContext";
import { Spacing } from "@/constants/theme";
import { BrowseIcon } from "@/components/icons/BrowseIcon";
import { LibraryIcon } from "@/components/icons/LibraryIcon";
import { TimelineIcon } from "@/components/icons/TimelineIcon";
import { NotificationsIcon } from "@/components/icons/NotificationsIcon";
import { ProfileIcon } from "@/components/icons/ProfileIcon";

const HIDDEN_TAB_BAR_ROUTES = ['Messages', 'MessageThread', 'NewMessage', 'NovelDetail', 'Reader'];

const PROTECTED_TABS = ["LibraryTab", "NotificationsTab", "ProfileTab"];

export type MainTabParamList = {
  BrowseTab: undefined;
  LibraryTab: undefined;
  TimelineTab: undefined;
  NotificationsTab: undefined;
  ProfileTab: undefined;
};

const Tab = createBottomTabNavigator<MainTabParamList>();

function CustomTabBar({ state, descriptors, navigation }: any) {
  const { theme } = useTheme();
  const { user, requireAuth } = useAuth();
  const insets = useSafeAreaInsets();

  const AUTH_MESSAGES: { [key: string]: string } = {
    LibraryTab: "Masuk untuk melihat koleksi novel kamu",
    NotificationsTab: "Masuk untuk melihat notifikasi",
    ProfileTab: "Masuk untuk mengakses profil kamu",
  };

  const currentRoute = state.routes[state.index];
  const focusedRouteName = getFocusedRouteNameFromRoute(currentRoute);
  
  if (focusedRouteName && HIDDEN_TAB_BAR_ROUTES.includes(focusedRouteName)) {
    return null;
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

        return (
          <Pressable
            key={route.key}
            onPress={onPress}
            style={styles.tabItem}
          >
            {IconComponent}
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
  tabLabel: {
    fontSize: 11,
    marginTop: 2,
  },
});

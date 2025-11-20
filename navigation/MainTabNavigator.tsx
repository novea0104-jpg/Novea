import React from "react";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { Feather } from "@expo/vector-icons";
import { BlurView } from "expo-blur";
import { Platform, StyleSheet } from "react-native";
import BrowseStackNavigator from "@/navigation/BrowseStackNavigator";
import LibraryStackNavigator from "@/navigation/LibraryStackNavigator";
import NotificationsStackNavigator from "@/navigation/NotificationsStackNavigator";
import ProfileStackNavigator from "@/navigation/ProfileStackNavigator";
import { useTheme } from "@/hooks/useTheme";

export type MainTabParamList = {
  BrowseTab: undefined;
  LibraryTab: undefined;
  NotificationsTab: undefined;
  ProfileTab: undefined;
};

const Tab = createBottomTabNavigator<MainTabParamList>();

export default function MainTabNavigator() {
  const { theme, isDark } = useTheme();

  return (
    <Tab.Navigator
      initialRouteName="BrowseTab"
      screenOptions={{
        tabBarActiveTintColor: theme.tabIconSelected,
        tabBarInactiveTintColor: theme.tabIconDefault,
        tabBarStyle: {
          position: "absolute",
          backgroundColor: Platform.select({
            ios: "transparent",
            android: theme.backgroundRoot,
          }),
          borderTopWidth: 1,
          borderTopColor: theme.cardBorder,
          elevation: 0,
          height: 60,
          paddingBottom: 8,
        },
        tabBarBackground: () =>
          Platform.OS === "ios" ? (
            <BlurView
              intensity={80}
              tint="dark"
              style={StyleSheet.absoluteFill}
            />
          ) : null,
        headerShown: false,
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: "600",
        },
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

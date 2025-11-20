import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";

import ProfileScreen from "@/screens/ProfileScreen";
import CoinStoreScreen from "@/screens/CoinStoreScreen";
import WriterDashboardScreen from "@/screens/WriterDashboardScreen";
import ManageNovelScreen from "@/screens/ManageNovelScreen";
import EditChapterScreen from "@/screens/EditChapterScreen";
import { getCommonScreenOptions } from "@/navigation/screenOptions";
import { useTheme } from "@/hooks/useTheme";

export type ProfileStackParamList = {
  Profile: undefined;
  CoinStore: undefined;
  WriterDashboard: undefined;
  ManageNovel: { novelId: string };
  EditChapter: { novelId: string; chapterId?: string };
};

const Stack = createNativeStackNavigator<ProfileStackParamList>();

export default function ProfileStackNavigator() {
  const { theme, isDark } = useTheme();

  return (
    <Stack.Navigator screenOptions={getCommonScreenOptions({ theme, isDark })}>
      <Stack.Screen
        name="Profile"
        component={ProfileScreen}
        options={{ title: "Profile" }}
      />
      <Stack.Screen
        name="CoinStore"
        component={CoinStoreScreen}
        options={{ title: "Buy Coins", presentation: "modal" }}
      />
      <Stack.Screen
        name="WriterDashboard"
        component={WriterDashboardScreen}
        options={{ title: "My Novels" }}
      />
      <Stack.Screen
        name="ManageNovel"
        component={ManageNovelScreen}
        options={{ title: "Manage Novel" }}
      />
      <Stack.Screen
        name="EditChapter"
        component={EditChapterScreen}
        options={{ title: "Edit Chapter" }}
      />
    </Stack.Navigator>
  );
}

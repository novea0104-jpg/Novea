import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import NotificationsScreen from "@/screens/NotificationsScreen";
import NovelDetailScreen from "@/screens/NovelDetailScreen";
import ReaderScreen from "@/screens/ReaderScreen";
import UserProfileScreen from "@/screens/UserProfileScreen";
import { getCommonScreenOptions } from "@/navigation/screenOptions";
import { useTheme } from "@/hooks/useTheme";

export type NotificationsStackParamList = {
  NotificationsHome: undefined;
  NovelDetail: { novelId: number };
  Reader: { chapterId: string; novelId: string };
  UserProfile: { userId: number };
};

const Stack = createNativeStackNavigator<NotificationsStackParamList>();

export default function NotificationsStackNavigator() {
  const { theme, isDark } = useTheme();

  return (
    <Stack.Navigator screenOptions={getCommonScreenOptions({ theme, isDark })}>
      <Stack.Screen
        name="NotificationsHome"
        component={NotificationsScreen}
        options={{ title: "Notifications" }}
      />
      <Stack.Screen
        name="NovelDetail"
        component={NovelDetailScreen}
        options={{ title: "Novel Detail" }}
      />
      <Stack.Screen
        name="Reader"
        component={ReaderScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="UserProfile"
        component={UserProfileScreen}
        options={{ title: "Profil Pengguna" }}
      />
    </Stack.Navigator>
  );
}

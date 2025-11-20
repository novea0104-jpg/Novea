import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import NotificationsScreen from "@/screens/NotificationsScreen";
import NovelDetailScreen from "@/screens/NovelDetailScreen";
import { getCommonScreenOptions } from "@/navigation/screenOptions";
import { useTheme } from "@/hooks/useTheme";

export type NotificationsStackParamList = {
  NotificationsHome: undefined;
  NovelDetail: { novelId: string };
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
    </Stack.Navigator>
  );
}

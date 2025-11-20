import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import BrowseHomeScreen from "@/screens/BrowseHomeScreen";
import NovelDetailScreen from "@/screens/NovelDetailScreen";
import ReaderScreen from "@/screens/ReaderScreen";
import SearchScreen from "@/screens/SearchScreen";
import { getCommonScreenOptions } from "@/navigation/screenOptions";
import { useTheme } from "@/hooks/useTheme";

export type BrowseStackParamList = {
  BrowseHome: undefined;
  NovelDetail: { novelId: string };
  Reader: { novelId: string; chapterId: string };
  Search: undefined;
};

const Stack = createNativeStackNavigator<BrowseStackParamList>();

export default function BrowseStackNavigator() {
  const { theme, isDark } = useTheme();

  return (
    <Stack.Navigator screenOptions={getCommonScreenOptions({ theme, isDark })}>
      <Stack.Screen
        name="BrowseHome"
        component={BrowseHomeScreen}
        options={{ headerShown: false }}
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
        name="Search"
        component={SearchScreen}
        options={{ title: "Search", presentation: "modal" }}
      />
    </Stack.Navigator>
  );
}

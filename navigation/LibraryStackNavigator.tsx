import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import LibraryScreen from "@/screens/LibraryScreen";
import NovelDetailScreen from "@/screens/NovelDetailScreen";
import ReaderScreen from "@/screens/ReaderScreen";
import { getCommonScreenOptions } from "@/navigation/screenOptions";
import { useTheme } from "@/hooks/useTheme";

export type LibraryStackParamList = {
  LibraryHome: undefined;
  NovelDetail: { novelId: string };
  Reader: { novelId: string; chapterId: string };
};

const Stack = createNativeStackNavigator<LibraryStackParamList>();

export default function LibraryStackNavigator() {
  const { theme, isDark } = useTheme();

  return (
    <Stack.Navigator screenOptions={getCommonScreenOptions({ theme, isDark })}>
      <Stack.Screen
        name="LibraryHome"
        component={LibraryScreen}
        options={{ title: "Library" }}
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
    </Stack.Navigator>
  );
}

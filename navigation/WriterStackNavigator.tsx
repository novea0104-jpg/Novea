import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { useTheme } from "@/hooks/useTheme";
import { getCommonScreenOptions } from "@/navigation/screenOptions";

import WriterCenterScreen from "@/screens/WriterCenterScreen";
import CreateNovelScreen from "@/screens/CreateNovelScreen";
import CreateChapterScreen from "@/screens/CreateChapterScreen";
import ManageChaptersScreen from "@/screens/ManageChaptersScreen";

const Stack = createNativeStackNavigator();

export default function WriterStackNavigator() {
  const { theme, isDark } = useTheme();

  return (
    <Stack.Navigator
      screenOptions={getCommonScreenOptions({ theme, isDark })}
    >
      <Stack.Screen
        name="WriterCenter"
        component={WriterCenterScreen}
        options={{
          title: "Pusat Penulis",
        }}
      />
      <Stack.Screen
        name="CreateNovel"
        component={CreateNovelScreen}
        options={{
          title: "Buat Novel Baru",
        }}
      />
      <Stack.Screen
        name="ManageChapters"
        component={ManageChaptersScreen}
        options={{
          title: "Kelola Chapter",
        }}
      />
      <Stack.Screen
        name="CreateChapter"
        component={CreateChapterScreen}
        options={{
          title: "Tulis Chapter",
        }}
      />
    </Stack.Navigator>
  );
}

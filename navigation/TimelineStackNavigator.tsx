import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import TimelineScreen from "@/screens/TimelineScreen";
import { getCommonScreenOptions } from "@/navigation/screenOptions";
import { useTheme } from "@/hooks/useTheme";

export type TimelineStackParamList = {
  TimelineHome: undefined;
};

const Stack = createNativeStackNavigator<TimelineStackParamList>();

export default function TimelineStackNavigator() {
  const { theme, isDark } = useTheme();

  return (
    <Stack.Navigator screenOptions={getCommonScreenOptions({ theme, isDark })}>
      <Stack.Screen
        name="TimelineHome"
        component={TimelineScreen}
        options={{
          title: "Linimasa",
        }}
      />
    </Stack.Navigator>
  );
}

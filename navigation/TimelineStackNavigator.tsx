import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import TimelineScreen from "@/screens/TimelineScreen";
import { getCommonScreenOptions } from "@/navigation/screenOptions";

export type TimelineStackParamList = {
  TimelineHome: undefined;
};

const Stack = createNativeStackNavigator<TimelineStackParamList>();

export default function TimelineStackNavigator() {
  return (
    <Stack.Navigator screenOptions={getCommonScreenOptions({})}>
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

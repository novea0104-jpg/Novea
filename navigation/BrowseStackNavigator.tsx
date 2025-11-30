import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import BrowseHomeScreen from "@/screens/BrowseHomeScreen";
import NovelDetailScreen from "@/screens/NovelDetailScreen";
import ReaderScreen from "@/screens/ReaderScreen";
import SearchScreen from "@/screens/SearchScreen";
import GenreScreen from "@/screens/GenreScreen";
import UserProfileScreen from "@/screens/UserProfileScreen";
import FollowListScreen from "@/screens/FollowListScreen";
import ManageNovelScreen from "@/screens/ManageNovelScreen";
import EditNovelScreen from "@/screens/EditNovelScreen";
import EditChapterScreen from "@/screens/EditChapterScreen";
import CreateChapterScreen from "@/screens/CreateChapterScreen";
import { getCommonScreenOptions } from "@/navigation/screenOptions";
import { useTheme } from "@/hooks/useTheme";

export type BrowseStackParamList = {
  BrowseHome: undefined;
  NovelDetail: { novelId: string };
  Reader: { novelId: string; chapterId: string };
  Search: undefined;
  Genre: { genreId: string; genreName: string };
  UserProfile: { userId: string };
  FollowList: { userId: string; type: "followers" | "following"; userName: string };
  ManageNovel: { novelId: string };
  EditNovel: { novelId: string };
  EditChapter: { novelId: string; chapterId?: string };
  CreateChapter: { novelId: string };
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
      <Stack.Screen
        name="Genre"
        component={GenreScreen}
        options={{ title: "Genre" }}
      />
      <Stack.Screen
        name="UserProfile"
        component={UserProfileScreen}
        options={{ title: "Profil" }}
      />
      <Stack.Screen
        name="FollowList"
        component={FollowListScreen}
        options={{ title: "Pengikut" }}
      />
      <Stack.Screen
        name="ManageNovel"
        component={ManageNovelScreen}
        options={{ title: "Kelola Novel" }}
      />
      <Stack.Screen
        name="EditNovel"
        component={EditNovelScreen}
        options={{ title: "Edit Novel" }}
      />
      <Stack.Screen
        name="EditChapter"
        component={EditChapterScreen}
        options={{ title: "Edit Chapter" }}
      />
      <Stack.Screen
        name="CreateChapter"
        component={CreateChapterScreen}
        options={{ title: "Tulis Chapter" }}
      />
    </Stack.Navigator>
  );
}

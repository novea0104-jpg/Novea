import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";

import ProfileScreen from "@/screens/ProfileScreen";
import EditProfileScreen from "@/screens/EditProfileScreen";
import CoinStoreScreen from "@/screens/CoinStoreScreen";
import WriterDashboardScreen from "@/screens/WriterDashboardScreen";
import WriterCenterScreen from "@/screens/WriterCenterScreen";
import CreateNovelScreen from "@/screens/CreateNovelScreen";
import ManageChaptersScreen from "@/screens/ManageChaptersScreen";
import CreateChapterScreen from "@/screens/CreateChapterScreen";
import AdminDashboardScreen from "@/screens/AdminDashboardScreen";
import ManageNovelScreen from "@/screens/ManageNovelScreen";
import EditChapterScreen from "@/screens/EditChapterScreen";
import EditNovelScreen from "@/screens/EditNovelScreen";
import FollowListScreen from "@/screens/FollowListScreen";
import UserProfileScreen from "@/screens/UserProfileScreen";
import MessagesHomeScreen from "@/screens/MessagesHomeScreen";
import MessageThreadScreen from "@/screens/MessageThreadScreen";
import NewMessageScreen from "@/screens/NewMessageScreen";
import { getCommonScreenOptions } from "@/navigation/screenOptions";
import { useTheme } from "@/hooks/useTheme";

export type ProfileStackParamList = {
  Profile: undefined;
  EditProfile: undefined;
  CoinStore: undefined;
  WriterDashboard: { initialTab?: "analytics" | "earnings" | "withdrawal" } | undefined;
  WriterCenter: undefined;
  CreateNovel: undefined;
  ManageChapters: { novelId: string };
  CreateChapter: { novelId: string; chapterNumber: number };
  AdminDashboard: undefined;
  ManageNovel: { novelId: string };
  EditChapter: { novelId: string; chapterId?: string };
  EditNovel: { novelId: string };
  FollowList: { userId: string; type: "followers" | "following"; userName: string };
  UserProfile: { userId: string };
  Messages: undefined;
  MessageThread: { conversationId: string; recipientName: string; recipientAvatar?: string; recipientRole: string };
  NewMessage: undefined;
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
        name="EditProfile"
        component={EditProfileScreen}
        options={{ title: "Edit Profile" }}
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
        name="WriterCenter"
        component={WriterCenterScreen}
        options={{ title: "Pusat Penulis" }}
      />
      <Stack.Screen
        name="CreateNovel"
        component={CreateNovelScreen}
        options={{ title: "Buat Novel Baru" }}
      />
      <Stack.Screen
        name="ManageChapters"
        component={ManageChaptersScreen}
        options={{ title: "Kelola Chapter" }}
      />
      <Stack.Screen
        name="CreateChapter"
        component={CreateChapterScreen}
        options={{ title: "Tulis Chapter" }}
      />
      <Stack.Screen
        name="AdminDashboard"
        component={AdminDashboardScreen}
        options={{ title: "Dashboard Admin" }}
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
      <Stack.Screen
        name="EditNovel"
        component={EditNovelScreen}
        options={{ title: "Edit Novel" }}
      />
      <Stack.Screen
        name="FollowList"
        component={FollowListScreen}
        options={{ title: "Pengikut" }}
      />
      <Stack.Screen
        name="UserProfile"
        component={UserProfileScreen}
        options={{ title: "Profil" }}
      />
      <Stack.Screen
        name="Messages"
        component={MessagesHomeScreen}
        options={{ title: "Pesan" }}
      />
      <Stack.Screen
        name="MessageThread"
        component={MessageThreadScreen}
        options={({ route }) => ({ title: route.params.recipientName })}
      />
      <Stack.Screen
        name="NewMessage"
        component={NewMessageScreen}
        options={{ title: "Pesan Baru" }}
      />
    </Stack.Navigator>
  );
}

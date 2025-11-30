import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  StyleSheet,
  Pressable,
  TextInput,
  Alert,
  ActivityIndicator,
  RefreshControl,
  FlatList,
  Modal,
  ScrollView,
} from "react-native";
import { useHeaderHeight } from "@react-navigation/elements";
import { ScreenScrollView } from "@/components/ScreenScrollView";
import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { Card } from "@/components/Card";
import { Button } from "@/components/Button";
import { ShieldIcon } from "@/components/icons/ShieldIcon";
import { UsersIcon } from "@/components/icons/UsersIcon";
import { BookIcon } from "@/components/icons/BookIcon";
import { SearchIcon } from "@/components/icons/SearchIcon";
import { TrashIcon } from "@/components/icons/TrashIcon";
import { EyeIcon } from "@/components/icons/EyeIcon";
import { HeartIcon } from "@/components/icons/HeartIcon";
import { XIcon } from "@/components/icons/XIcon";
import { BarChartIcon } from "@/components/icons/BarChartIcon";
import { useTheme } from "@/hooks/useTheme";
import { useAuth } from "@/contexts/AuthContext";
import { Spacing, Typography, BorderRadius } from "@/constants/theme";
import { RoleBadge } from "@/components/RoleBadge";
import { Avatar } from "@/components/Avatar";
import {
  getAllUsersAdmin,
  getAllNovelsAdmin,
  getAdminStats,
  toggleUserBan,
  deleteUser,
  changeUserRole,
  deleteNovelAdmin,
  toggleNovelPublishAdmin,
  AdminUser,
  AdminNovel,
  AdminStats,
} from "@/utils/supabase";

type TabType = 'stats' | 'users' | 'novels';
type UserRole = 'pembaca' | 'penulis' | 'editor' | 'co_admin' | 'super_admin';

const ROLE_OPTIONS: { value: UserRole; label: string }[] = [
  { value: 'pembaca', label: 'Pembaca' },
  { value: 'penulis', label: 'Penulis' },
  { value: 'editor', label: 'Editor' },
  { value: 'co_admin', label: 'Co Admin' },
  { value: 'super_admin', label: 'Super Admin' },
];

export default function AdminDashboardScreen() {
  const { theme } = useTheme();
  const { user } = useAuth();
  const headerHeight = useHeaderHeight();
  
  const adminRole = user?.role || 'pembaca';
  const isEditor = adminRole === 'editor';
  const isCoAdmin = adminRole === 'co_admin';
  const isSuperAdmin = adminRole === 'super_admin';
  const canManageUsers = isSuperAdmin || isCoAdmin;
  
  const [activeTab, setActiveTab] = useState<TabType>('stats');
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [novels, setNovels] = useState<AdminNovel[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [userPage, setUserPage] = useState(1);
  const [novelPage, setNovelPage] = useState(1);
  const [totalUsers, setTotalUsers] = useState(0);
  const [totalNovels, setTotalNovels] = useState(0);
  const [selectedUser, setSelectedUser] = useState<AdminUser | null>(null);
  const [selectedNovel, setSelectedNovel] = useState<AdminNovel | null>(null);
  const [showUserModal, setShowUserModal] = useState(false);
  const [showNovelModal, setShowNovelModal] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  
  const handleTabChange = (tab: TabType) => {
    if (tab === 'users' && !canManageUsers) {
      return;
    }
    setSearchQuery('');
    setActiveTab(tab);
  };

  const loadStats = useCallback(async () => {
    const data = await getAdminStats();
    setStats(data);
  }, []);

  const loadUsers = useCallback(async (page: number = 1, search?: string) => {
    if (!canManageUsers) return;
    const { users: data, total } = await getAllUsersAdmin(adminRole, page, 20, search);
    if (page === 1) {
      setUsers(data);
    } else {
      setUsers(prev => [...prev, ...data]);
    }
    setTotalUsers(total);
    setUserPage(page);
  }, [adminRole, canManageUsers]);

  const loadNovels = useCallback(async (page: number = 1, search?: string) => {
    const { novels: data, total } = await getAllNovelsAdmin(page, 20, search);
    if (page === 1) {
      setNovels(data);
    } else {
      setNovels(prev => [...prev, ...data]);
    }
    setTotalNovels(total);
    setNovelPage(page);
  }, []);

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      await loadStats();
      if (canManageUsers) {
        await loadUsers(1);
      }
      await loadNovels(1);
      setLoading(false);
    };
    loadData();
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    setSearchQuery('');
    await loadStats();
    if (activeTab === 'users' && canManageUsers) {
      await loadUsers(1);
    } else if (activeTab === 'novels') {
      await loadNovels(1);
    }
    setRefreshing(false);
  };

  const handleSearch = () => {
    if (activeTab === 'users') {
      loadUsers(1, searchQuery);
    } else if (activeTab === 'novels') {
      loadNovels(1, searchQuery);
    }
  };

  const handleBanUser = async (userId: string, ban: boolean) => {
    if (!user) return;
    setActionLoading(true);
    const result = await toggleUserBan(user.id, adminRole, userId, ban);
    setActionLoading(false);
    if (result.success) {
      setUsers(prev => prev.map(u => u.id === userId ? { ...u, isBanned: ban } : u));
      if (selectedUser?.id === userId) {
        setSelectedUser({ ...selectedUser, isBanned: ban });
      }
      Alert.alert('Berhasil', ban ? 'User telah dibanned' : 'User telah di-unbanned');
    } else {
      Alert.alert('Gagal', result.error || 'Terjadi kesalahan');
    }
  };

  const handleDeleteUser = async (userId: string) => {
    if (!isSuperAdmin) {
      Alert.alert('Tidak Diizinkan', 'Hanya Super Admin yang dapat menghapus user');
      return;
    }
    Alert.alert(
      'Konfirmasi Hapus',
      'Apakah Anda yakin ingin menghapus user ini? Tindakan ini tidak dapat dibatalkan.',
      [
        { text: 'Batal', style: 'cancel' },
        {
          text: 'Hapus',
          style: 'destructive',
          onPress: async () => {
            setActionLoading(true);
            const result = await deleteUser(adminRole, userId);
            setActionLoading(false);
            if (result.success) {
              setUsers(prev => prev.filter(u => u.id !== userId));
              setShowUserModal(false);
              Alert.alert('Berhasil', 'User telah dihapus');
            } else {
              Alert.alert('Gagal', result.error || 'Terjadi kesalahan');
            }
          },
        },
      ]
    );
  };

  const handleChangeRole = async (userId: string, newRole: string) => {
    if (!user) return;
    setActionLoading(true);
    const result = await changeUserRole(user.id, adminRole, userId, newRole);
    setActionLoading(false);
    if (result.success) {
      setUsers(prev => prev.map(u => u.id === userId ? { ...u, role: newRole } : u));
      if (selectedUser?.id === userId) {
        setSelectedUser({ ...selectedUser, role: newRole });
      }
      Alert.alert('Berhasil', 'Role user telah diubah');
    } else {
      Alert.alert('Gagal', result.error || 'Terjadi kesalahan');
    }
  };

  const handleDeleteNovel = async (novelId: number) => {
    Alert.alert(
      'Konfirmasi Hapus',
      'Apakah Anda yakin ingin menghapus novel ini beserta semua chapter-nya? Tindakan ini tidak dapat dibatalkan.',
      [
        { text: 'Batal', style: 'cancel' },
        {
          text: 'Hapus',
          style: 'destructive',
          onPress: async () => {
            setActionLoading(true);
            const result = await deleteNovelAdmin(novelId);
            setActionLoading(false);
            if (result.success) {
              setNovels(prev => prev.filter(n => n.id !== novelId));
              setShowNovelModal(false);
              Alert.alert('Berhasil', 'Novel telah dihapus');
            } else {
              Alert.alert('Gagal', result.error || 'Terjadi kesalahan');
            }
          },
        },
      ]
    );
  };

  const handleTogglePublish = async (novelId: number, isPublished: boolean) => {
    setActionLoading(true);
    const result = await toggleNovelPublishAdmin(novelId, !isPublished);
    setActionLoading(false);
    if (result.success) {
      setNovels(prev => prev.map(n => n.id === novelId ? { ...n, isPublished: !isPublished } : n));
      if (selectedNovel?.id === novelId) {
        setSelectedNovel({ ...selectedNovel, isPublished: !isPublished });
      }
    } else {
      Alert.alert('Gagal', result.error || 'Terjadi kesalahan');
    }
  };

  const canModifyUser = (targetRole: string): boolean => {
    if (isSuperAdmin) return true;
    if (isCoAdmin && targetRole !== 'super_admin') return true;
    return false;
  };

  const getAvailableRoles = (): typeof ROLE_OPTIONS => {
    if (isSuperAdmin) return ROLE_OPTIONS;
    if (isCoAdmin) {
      return ROLE_OPTIONS.filter(r => r.value !== 'super_admin' && r.value !== 'co_admin');
    }
    return [];
  };

  const handleLoadMoreUsers = async () => {
    if (loadingMore || users.length >= totalUsers) return;
    setLoadingMore(true);
    await loadUsers(userPage + 1, searchQuery);
    setLoadingMore(false);
  };

  const handleLoadMoreNovels = async () => {
    if (loadingMore || novels.length >= totalNovels) return;
    setLoadingMore(true);
    await loadNovels(novelPage + 1, searchQuery);
    setLoadingMore(false);
  };

  const renderTabButton = (tab: TabType, label: string, icon: React.ReactNode) => {
    if (tab === 'users' && !canManageUsers) return null;
    const isActive = activeTab === tab;
    return (
      <Pressable
        onPress={() => handleTabChange(tab)}
        android_ripple={{ color: 'rgba(255,255,255,0.2)', borderless: false }}
        style={[
          styles.tabButton,
          { backgroundColor: isActive ? theme.primary : theme.backgroundSecondary },
        ]}
      >
        {icon}
        <ThemedText style={[styles.tabLabel, { color: isActive ? '#FFFFFF' : theme.text }]}>
          {label}
        </ThemedText>
      </Pressable>
    );
  };

  const renderStatsTab = () => (
    <View style={styles.statsGrid}>
      <Card elevation={1} style={styles.statCard}>
        <UsersIcon size={28} color={theme.primary} />
        <ThemedText style={[Typography.h2, styles.statValue]}>{stats?.totalUsers || 0}</ThemedText>
        <ThemedText style={[styles.statLabel, { color: theme.textSecondary }]}>Total User</ThemedText>
        {(stats?.newUsersToday ?? 0) > 0 ? (
          <ThemedText style={[styles.statBadge, { color: theme.success }]}>
            +{stats?.newUsersToday} hari ini
          </ThemedText>
        ) : null}
      </Card>
      <Card elevation={1} style={styles.statCard}>
        <BookIcon size={28} color={theme.secondary} />
        <ThemedText style={[Typography.h2, styles.statValue]}>{stats?.totalNovels || 0}</ThemedText>
        <ThemedText style={[styles.statLabel, { color: theme.textSecondary }]}>Total Novel</ThemedText>
        {(stats?.newNovelsToday ?? 0) > 0 ? (
          <ThemedText style={[styles.statBadge, { color: theme.success }]}>
            +{stats?.newNovelsToday} hari ini
          </ThemedText>
        ) : null}
      </Card>
      <Card elevation={1} style={styles.statCard}>
        <BarChartIcon size={28} color={theme.link} />
        <ThemedText style={[Typography.h2, styles.statValue]}>{stats?.totalChapters || 0}</ThemedText>
        <ThemedText style={[styles.statLabel, { color: theme.textSecondary }]}>Total Chapter</ThemedText>
      </Card>
      <Card elevation={1} style={styles.statCard}>
        <EyeIcon size={28} color={theme.tabIconSelected} />
        <ThemedText style={[Typography.h2, styles.statValue]}>{stats?.totalViews || 0}</ThemedText>
        <ThemedText style={[styles.statLabel, { color: theme.textSecondary }]}>Total Views</ThemedText>
      </Card>
    </View>
  );

  const renderUserItem = ({ item }: { item: AdminUser }) => (
    <Pressable 
      onPress={() => { setSelectedUser(item); setShowUserModal(true); }}
      android_ripple={{ color: 'rgba(255,255,255,0.1)', borderless: false }}
    >
      <Card elevation={1} style={styles.listItem}>
        <Avatar
          uri={item.avatarUrl}
          name={item.name}
          size={48}
        />
        <View style={styles.listItemContent}>
          <View style={styles.listItemHeader}>
            <ThemedText style={styles.listItemTitle} numberOfLines={1}>
              {item.name}
            </ThemedText>
            <RoleBadge role={item.role as UserRole} size="small" />
          </View>
          <ThemedText style={[styles.listItemSubtitle, { color: theme.textSecondary }]} numberOfLines={1}>
            {item.email}
          </ThemedText>
          <View style={styles.listItemMeta}>
            <ThemedText style={[styles.coinText, { color: theme.warning }]}>
              {item.coinBalance} koin
            </ThemedText>
            {item.isBanned ? (
              <View style={[styles.bannedBadge, { backgroundColor: theme.error }]}>
                <ThemedText style={styles.bannedText}>BANNED</ThemedText>
              </View>
            ) : null}
          </View>
        </View>
      </Card>
    </Pressable>
  );

  const renderNovelItem = ({ item }: { item: AdminNovel }) => (
    <Pressable 
      onPress={() => { setSelectedNovel(item); setShowNovelModal(true); }}
      android_ripple={{ color: 'rgba(255,255,255,0.1)', borderless: false }}
    >
      <Card elevation={1} style={styles.listItem}>
        <View style={[styles.novelIcon, { backgroundColor: theme.backgroundSecondary }]}>
          <BookIcon size={24} color={theme.text} />
        </View>
        <View style={styles.listItemContent}>
          <ThemedText style={styles.listItemTitle} numberOfLines={1}>
            {item.title}
          </ThemedText>
          <ThemedText style={[styles.listItemSubtitle, { color: theme.textSecondary }]} numberOfLines={1}>
            oleh {item.authorName}
          </ThemedText>
          <View style={styles.novelStats}>
            <View style={styles.novelStat}>
              <EyeIcon size={14} color={theme.textMuted} />
              <ThemedText style={[styles.novelStatText, { color: theme.textMuted }]}>
                {item.viewCount}
              </ThemedText>
            </View>
            <View style={styles.novelStat}>
              <HeartIcon size={14} color={theme.textMuted} />
              <ThemedText style={[styles.novelStatText, { color: theme.textMuted }]}>
                {item.likesCount}
              </ThemedText>
            </View>
            <ThemedText style={[styles.novelStatText, { color: theme.textMuted }]}>
              {item.chaptersCount} chapter
            </ThemedText>
            {!item.isPublished ? (
              <View style={[styles.unpublishedBadge, { backgroundColor: theme.warning }]}>
                <ThemedText style={styles.unpublishedText}>Draft</ThemedText>
              </View>
            ) : null}
          </View>
        </View>
      </Card>
    </Pressable>
  );

  const renderUserModal = () => {
    if (!selectedUser) return null;
    const canModify = canModifyUser(selectedUser.role);
    const availableRoles = getAvailableRoles();

    return (
      <Modal
        visible={showUserModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowUserModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: theme.backgroundDefault }]}>
            <View style={styles.modalHeader}>
              <ThemedText style={Typography.h3}>Detail User</ThemedText>
              <Pressable 
                onPress={() => setShowUserModal(false)}
                android_ripple={{ color: 'rgba(255,255,255,0.2)', borderless: true }}
              >
                <XIcon size={24} color={theme.text} />
              </Pressable>
            </View>

            <ScrollView style={styles.modalBody}>
              <View style={styles.userDetailHeader}>
                <Avatar uri={selectedUser.avatarUrl} name={selectedUser.name} size={80} />
                <ThemedText style={[Typography.h2, styles.userDetailName]}>
                  {selectedUser.name}
                </ThemedText>
                <RoleBadge role={selectedUser.role as UserRole} size="medium" />
              </View>

              <View style={styles.userDetailInfo}>
                <View style={styles.detailRow}>
                  <ThemedText style={[styles.detailLabel, { color: theme.textSecondary }]}>Email</ThemedText>
                  <ThemedText style={styles.detailValue}>{selectedUser.email}</ThemedText>
                </View>
                <View style={styles.detailRow}>
                  <ThemedText style={[styles.detailLabel, { color: theme.textSecondary }]}>Koin</ThemedText>
                  <ThemedText style={[styles.detailValue, { color: theme.warning }]}>
                    {selectedUser.coinBalance}
                  </ThemedText>
                </View>
                <View style={styles.detailRow}>
                  <ThemedText style={[styles.detailLabel, { color: theme.textSecondary }]}>Status</ThemedText>
                  <ThemedText style={[styles.detailValue, { color: selectedUser.isBanned ? theme.error : theme.success }]}>
                    {selectedUser.isBanned ? 'Banned' : 'Aktif'}
                  </ThemedText>
                </View>
              </View>

              {canModify ? (
                <View style={styles.userActions}>
                  <ThemedText style={[styles.sectionTitle, { color: theme.textSecondary }]}>
                    Ubah Role
                  </ThemedText>
                  <View style={styles.roleOptions}>
                    {availableRoles.map(role => (
                      <Pressable
                        key={role.value}
                        onPress={() => handleChangeRole(selectedUser.id, role.value)}
                        disabled={actionLoading || selectedUser.role === role.value}
                        android_ripple={{ color: 'rgba(255,255,255,0.2)', borderless: false }}
                        style={[
                          styles.roleOption,
                          {
                            backgroundColor: selectedUser.role === role.value
                              ? theme.primary
                              : theme.backgroundSecondary,
                            opacity: selectedUser.role === role.value ? 0.6 : 1,
                          },
                        ]}
                      >
                        <ThemedText
                          style={[
                            styles.roleOptionText,
                            { color: selectedUser.role === role.value ? '#FFFFFF' : theme.text },
                          ]}
                        >
                          {role.label}
                        </ThemedText>
                      </Pressable>
                    ))}
                  </View>

                  <View style={styles.actionButtons}>
                    <Button
                      onPress={() => handleBanUser(selectedUser.id, !selectedUser.isBanned)}
                      disabled={actionLoading}
                      style={styles.actionButton}
                    >
                      {selectedUser.isBanned ? 'Unban User' : 'Ban User'}
                    </Button>
                    {isSuperAdmin ? (
                      <Button
                        onPress={() => handleDeleteUser(selectedUser.id)}
                        disabled={actionLoading}
                        style={styles.actionButton}
                      >
                        Hapus User
                      </Button>
                    ) : null}
                  </View>
                </View>
              ) : (
                <View style={styles.noPermission}>
                  <ThemedText style={[styles.noPermissionText, { color: theme.textMuted }]}>
                    Anda tidak memiliki izin untuk mengubah user ini
                  </ThemedText>
                </View>
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>
    );
  };

  const renderNovelModal = () => {
    if (!selectedNovel) return null;

    return (
      <Modal
        visible={showNovelModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowNovelModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: theme.backgroundDefault }]}>
            <View style={styles.modalHeader}>
              <ThemedText style={Typography.h3}>Detail Novel</ThemedText>
              <Pressable 
                onPress={() => setShowNovelModal(false)}
                android_ripple={{ color: 'rgba(255,255,255,0.2)', borderless: true }}
              >
                <XIcon size={24} color={theme.text} />
              </Pressable>
            </View>

            <ScrollView style={styles.modalBody}>
              <ThemedText style={[Typography.h2, styles.novelDetailTitle]}>
                {selectedNovel.title}
              </ThemedText>
              
              <View style={styles.userDetailInfo}>
                <View style={styles.detailRow}>
                  <ThemedText style={[styles.detailLabel, { color: theme.textSecondary }]}>Penulis</ThemedText>
                  <ThemedText style={styles.detailValue}>{selectedNovel.authorName}</ThemedText>
                </View>
                <View style={styles.detailRow}>
                  <ThemedText style={[styles.detailLabel, { color: theme.textSecondary }]}>Genre</ThemedText>
                  <ThemedText style={styles.detailValue}>{selectedNovel.genre || '-'}</ThemedText>
                </View>
                <View style={styles.detailRow}>
                  <ThemedText style={[styles.detailLabel, { color: theme.textSecondary }]}>Status</ThemedText>
                  <ThemedText style={styles.detailValue}>{selectedNovel.status}</ThemedText>
                </View>
                <View style={styles.detailRow}>
                  <ThemedText style={[styles.detailLabel, { color: theme.textSecondary }]}>Chapters</ThemedText>
                  <ThemedText style={styles.detailValue}>{selectedNovel.chaptersCount}</ThemedText>
                </View>
                <View style={styles.detailRow}>
                  <ThemedText style={[styles.detailLabel, { color: theme.textSecondary }]}>Views</ThemedText>
                  <ThemedText style={styles.detailValue}>{selectedNovel.viewCount}</ThemedText>
                </View>
                <View style={styles.detailRow}>
                  <ThemedText style={[styles.detailLabel, { color: theme.textSecondary }]}>Likes</ThemedText>
                  <ThemedText style={styles.detailValue}>{selectedNovel.likesCount}</ThemedText>
                </View>
                <View style={styles.detailRow}>
                  <ThemedText style={[styles.detailLabel, { color: theme.textSecondary }]}>Published</ThemedText>
                  <ThemedText style={[styles.detailValue, { color: selectedNovel.isPublished ? theme.success : theme.warning }]}>
                    {selectedNovel.isPublished ? 'Ya' : 'Tidak'}
                  </ThemedText>
                </View>
              </View>

              <View style={styles.actionButtons}>
                <Button
                  onPress={() => handleTogglePublish(selectedNovel.id, selectedNovel.isPublished)}
                  disabled={actionLoading}
                  style={styles.actionButton}
                >
                  {selectedNovel.isPublished ? 'Unpublish' : 'Publish'}
                </Button>
                <Button
                  onPress={() => handleDeleteNovel(selectedNovel.id)}
                  disabled={actionLoading}
                  style={styles.actionButton}
                >
                  Hapus Novel
                </Button>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>
    );
  };

  if (loading) {
    return (
      <ThemedView style={[styles.loadingContainer, { paddingTop: headerHeight }]}>
        <ActivityIndicator size="large" color={theme.primary} />
        <ThemedText style={[styles.loadingText, { color: theme.textSecondary }]}>
          Memuat dashboard...
        </ThemedText>
      </ThemedView>
    );
  }

  return (
    <ThemedView style={[styles.container, { paddingTop: headerHeight + Spacing.md }]}>
      <View style={styles.tabsContainer}>
        {renderTabButton('stats', 'Statistik', <BarChartIcon size={18} color={activeTab === 'stats' ? '#FFFFFF' : theme.text} />)}
        {renderTabButton('users', 'Users', <UsersIcon size={18} color={activeTab === 'users' ? '#FFFFFF' : theme.text} />)}
        {renderTabButton('novels', 'Novel', <BookIcon size={18} color={activeTab === 'novels' ? '#FFFFFF' : theme.text} />)}
      </View>

      {activeTab === 'stats' ? (
        <ScreenScrollView
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.primary} />
          }
        >
          <View style={styles.content}>
            <ThemedText style={[Typography.h2, styles.sectionHeader]}>
              Dashboard Admin
            </ThemedText>
            <ThemedText style={[styles.roleInfo, { color: theme.textSecondary }]}>
              Login sebagai {adminRole === 'super_admin' ? 'Super Admin' : adminRole === 'co_admin' ? 'Co Admin' : 'Editor'}
            </ThemedText>
            {renderStatsTab()}
          </View>
        </ScreenScrollView>
      ) : activeTab === 'users' && canManageUsers ? (
        <View style={styles.listContainer}>
          <View style={[styles.searchContainer, { backgroundColor: theme.backgroundSecondary }]}>
            <SearchIcon size={20} color={theme.textMuted} />
            <TextInput
              style={[styles.searchInput, { color: theme.text }]}
              placeholder="Cari user..."
              placeholderTextColor={theme.textMuted}
              value={searchQuery}
              onChangeText={setSearchQuery}
              onSubmitEditing={handleSearch}
              returnKeyType="search"
            />
          </View>
          <FlatList
            data={users}
            renderItem={renderUserItem}
            keyExtractor={(item) => item.id.toString()}
            contentContainerStyle={styles.listContent}
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.primary} />
            }
            onEndReached={handleLoadMoreUsers}
            onEndReachedThreshold={0.5}
            ListFooterComponent={
              loadingMore ? (
                <View style={styles.loadingMore}>
                  <ActivityIndicator size="small" color={theme.primary} />
                </View>
              ) : null
            }
            ListEmptyComponent={
              <View style={styles.emptyState}>
                <UsersIcon size={48} color={theme.textMuted} />
                <ThemedText style={[styles.emptyText, { color: theme.textMuted }]}>
                  Tidak ada user ditemukan
                </ThemedText>
              </View>
            }
          />
        </View>
      ) : (
        <View style={styles.listContainer}>
          <View style={[styles.searchContainer, { backgroundColor: theme.backgroundSecondary }]}>
            <SearchIcon size={20} color={theme.textMuted} />
            <TextInput
              style={[styles.searchInput, { color: theme.text }]}
              placeholder="Cari novel..."
              placeholderTextColor={theme.textMuted}
              value={searchQuery}
              onChangeText={setSearchQuery}
              onSubmitEditing={handleSearch}
              returnKeyType="search"
            />
          </View>
          <FlatList
            data={novels}
            renderItem={renderNovelItem}
            keyExtractor={(item) => item.id.toString()}
            contentContainerStyle={styles.listContent}
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.primary} />
            }
            onEndReached={handleLoadMoreNovels}
            onEndReachedThreshold={0.5}
            ListFooterComponent={
              loadingMore ? (
                <View style={styles.loadingMore}>
                  <ActivityIndicator size="small" color={theme.primary} />
                </View>
              ) : null
            }
            ListEmptyComponent={
              <View style={styles.emptyState}>
                <BookIcon size={48} color={theme.textMuted} />
                <ThemedText style={[styles.emptyText, { color: theme.textMuted }]}>
                  Tidak ada novel ditemukan
                </ThemedText>
              </View>
            }
          />
        </View>
      )}

      {renderUserModal()}
      {renderNovelModal()}
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: Spacing.md,
  },
  loadingText: {
    fontSize: 16,
  },
  tabsContainer: {
    flexDirection: 'row',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    gap: Spacing.sm,
  },
  tabButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    borderRadius: BorderRadius.lg,
    gap: Spacing.xs,
  },
  tabLabel: {
    fontSize: 14,
    fontWeight: '600',
  },
  content: {
    paddingHorizontal: Spacing.md,
    paddingTop: Spacing.md,
  },
  sectionHeader: {
    marginBottom: Spacing.xs,
  },
  roleInfo: {
    fontSize: 14,
    marginBottom: Spacing.lg,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.md,
    marginBottom: Spacing.xl,
  },
  statCard: {
    width: '47%',
    alignItems: 'center',
    paddingVertical: Spacing.lg,
    paddingHorizontal: Spacing.md,
  },
  statValue: {
    marginTop: Spacing.sm,
  },
  statLabel: {
    fontSize: 13,
    marginTop: Spacing.xs,
  },
  statBadge: {
    fontSize: 12,
    fontWeight: '600',
    marginTop: Spacing.xs,
  },
  listContainer: {
    flex: 1,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: Spacing.md,
    marginVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    borderRadius: BorderRadius.lg,
    gap: Spacing.sm,
  },
  searchInput: {
    flex: 1,
    paddingVertical: Spacing.sm,
    fontSize: 16,
  },
  listContent: {
    paddingHorizontal: Spacing.md,
    paddingBottom: Spacing.xl,
    gap: Spacing.sm,
  },
  listItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.md,
    gap: Spacing.md,
  },
  listItemContent: {
    flex: 1,
  },
  listItemHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginBottom: 2,
  },
  listItemTitle: {
    fontSize: 16,
    fontWeight: '600',
    flex: 1,
  },
  listItemSubtitle: {
    fontSize: 13,
    marginBottom: 4,
  },
  listItemMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  coinText: {
    fontSize: 13,
    fontWeight: '600',
  },
  bannedBadge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: BorderRadius.sm,
  },
  bannedText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '700',
  },
  novelIcon: {
    width: 48,
    height: 48,
    borderRadius: BorderRadius.md,
    justifyContent: 'center',
    alignItems: 'center',
  },
  novelStats: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    marginTop: 4,
  },
  novelStat: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  novelStatText: {
    fontSize: 12,
  },
  unpublishedBadge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: BorderRadius.sm,
  },
  unpublishedText: {
    color: '#000000',
    fontSize: 10,
    fontWeight: '700',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing["3xl"],
    gap: Spacing.md,
  },
  emptyText: {
    fontSize: 16,
  },
  loadingMore: {
    paddingVertical: Spacing.lg,
    alignItems: 'center',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.xl,
  },
  modalContent: {
    width: '100%',
    maxHeight: '80%',
    borderRadius: BorderRadius.xl,
    overflow: 'hidden',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  modalBody: {
    padding: Spacing.lg,
  },
  userDetailHeader: {
    alignItems: 'center',
    marginBottom: Spacing.xl,
  },
  userDetailName: {
    marginTop: Spacing.md,
    marginBottom: Spacing.sm,
  },
  userDetailInfo: {
    gap: Spacing.md,
    marginBottom: Spacing.xl,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  detailLabel: {
    fontSize: 14,
  },
  detailValue: {
    fontSize: 14,
    fontWeight: '600',
  },
  userActions: {
    marginTop: Spacing.md,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: Spacing.md,
  },
  roleOptions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
    marginBottom: Spacing.xl,
  },
  roleOption: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.md,
  },
  roleOptionText: {
    fontSize: 13,
    fontWeight: '600',
  },
  actionButtons: {
    gap: Spacing.md,
    marginTop: Spacing.md,
  },
  actionButton: {
    width: '100%',
  },
  noPermission: {
    alignItems: 'center',
    paddingVertical: Spacing.xl,
  },
  noPermissionText: {
    fontSize: 14,
    textAlign: 'center',
  },
  novelDetailTitle: {
    marginBottom: Spacing.xl,
    textAlign: 'center',
  },
});

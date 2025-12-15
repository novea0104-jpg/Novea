import React, { useState, useEffect, useCallback, useLayoutEffect } from "react";
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
import { Image } from "expo-image";
import * as ImagePicker from "expo-image-picker";
import { useNavigation } from "@react-navigation/native";
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
import { CoinIcon } from "@/components/icons/CoinIcon";
import { EditIcon } from "@/components/icons/EditIcon";
import { LockIcon } from "@/components/icons/LockIcon";
import { AwardIcon } from "@/components/icons/AwardIcon";
import { PlusIcon } from "@/components/icons/PlusIcon";
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
  updateNovelAdmin,
  getChaptersAdmin,
  updateChapterAdmin,
  deleteChapterAdmin,
  AdminUser,
  AdminNovel,
  AdminStats,
  AdminChapter,
  getEditorsChoiceNovels,
  addToEditorsChoice,
  removeFromEditorsChoice,
  searchNovelsForEditorsChoice,
  EditorsChoiceNovel,
  getFeaturedAuthors,
  addToFeaturedAuthors,
  removeFromFeaturedAuthors,
  searchAuthorsForFeatured,
  FeaturedAuthor,
} from "@/utils/supabase";
import { getAdminGoldWithdrawals, updateGoldWithdrawalStatus } from "@/hooks/useGoldWithdrawal";
import { DollarSignIcon } from "@/components/icons/DollarSignIcon";
import { UserIcon } from "@/components/icons/UserIcon";
import { uploadNovelCoverAsync } from "@/utils/novelCoverStorage";
import { CameraIcon } from "@/components/icons/CameraIcon";

type TabType = 'stats' | 'users' | 'novels' | 'featured' | 'authors' | 'gold_wd';
type UserRole = 'pembaca' | 'penulis' | 'editor' | 'co_admin' | 'super_admin';

const ROLE_OPTIONS: { value: UserRole; label: string }[] = [
  { value: 'pembaca', label: 'Pembaca' },
  { value: 'penulis', label: 'Penulis' },
  { value: 'editor', label: 'Editor' },
  { value: 'co_admin', label: 'Co Admin' },
];

export default function AdminDashboardScreen() {
  const { theme } = useTheme();
  const { user } = useAuth();
  const navigation = useNavigation();
  const headerHeight = useHeaderHeight();
  
  useLayoutEffect(() => {
    const parent = navigation.getParent();
    parent?.setOptions({ tabBarStyle: { display: 'none' } });
    
    return () => {
      parent?.setOptions({ tabBarStyle: undefined });
    };
  }, [navigation]);
  
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
  
  // Chapter management states
  const [chapters, setChapters] = useState<AdminChapter[]>([]);
  const [chaptersLoading, setChaptersLoading] = useState(false);
  const [selectedChapter, setSelectedChapter] = useState<AdminChapter | null>(null);
  const [showChapterModal, setShowChapterModal] = useState(false);
  const [showEditNovelModal, setShowEditNovelModal] = useState(false);
  const [editNovelTitle, setEditNovelTitle] = useState('');
  const [editNovelSynopsis, setEditNovelSynopsis] = useState('');
  const [editNovelCoverUri, setEditNovelCoverUri] = useState<string | null>(null);
  const [isUploadingCover, setIsUploadingCover] = useState(false);
  const [editChapterTitle, setEditChapterTitle] = useState('');
  const [editChapterContent, setEditChapterContent] = useState('');
  const [editChapterIsFree, setEditChapterIsFree] = useState(false);
  
  // Editors Choice states
  const [editorsChoice, setEditorsChoice] = useState<EditorsChoiceNovel[]>([]);
  const [editorsChoiceLoading, setEditorsChoiceLoading] = useState(false);
  const [searchNovelQuery, setSearchNovelQuery] = useState('');
  const [searchResults, setSearchResults] = useState<{id: number; title: string; authorName: string; coverUrl: string | null}[]>([]);
  const [showAddNovelModal, setShowAddNovelModal] = useState(false);
  const [searchingNovels, setSearchingNovels] = useState(false);
  
  // Featured Authors states
  const [featuredAuthors, setFeaturedAuthors] = useState<FeaturedAuthor[]>([]);
  const [featuredAuthorsLoading, setFeaturedAuthorsLoading] = useState(false);
  const [searchAuthorQuery, setSearchAuthorQuery] = useState('');
  const [authorSearchResults, setAuthorSearchResults] = useState<{id: number; name: string; avatarUrl: string | null; novelCount: number}[]>([]);
  const [showAddAuthorModal, setShowAddAuthorModal] = useState(false);
  
  // Gold Withdrawals states
  const [goldWithdrawals, setGoldWithdrawals] = useState<any[]>([]);
  const [goldWithdrawalsLoading, setGoldWithdrawalsLoading] = useState(false);
  const [goldWdFilter, setGoldWdFilter] = useState<string>('');
  const [searchingAuthors, setSearchingAuthors] = useState(false);
  
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

  const loadEditorsChoice = useCallback(async () => {
    setEditorsChoiceLoading(true);
    const data = await getEditorsChoiceNovels();
    setEditorsChoice(data);
    setEditorsChoiceLoading(false);
  }, []);

  const loadFeaturedAuthors = useCallback(async () => {
    setFeaturedAuthorsLoading(true);
    const data = await getFeaturedAuthors();
    setFeaturedAuthors(data);
    setFeaturedAuthorsLoading(false);
  }, []);

  const loadGoldWithdrawals = useCallback(async (status?: string) => {
    setGoldWithdrawalsLoading(true);
    const data = await getAdminGoldWithdrawals(status);
    setGoldWithdrawals(data);
    setGoldWithdrawalsLoading(false);
  }, []);

  const handleUpdateGoldWdStatus = async (wdId: number, status: string, note?: string) => {
    const result = await updateGoldWithdrawalStatus(wdId, status, note);
    if (result.success) {
      Alert.alert('Berhasil', 'Status penarikan berhasil diubah');
      loadGoldWithdrawals(goldWdFilter);
    } else {
      Alert.alert('Error', result.error || 'Gagal mengubah status');
    }
  };

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      await Promise.all([
        loadStats(),
        canManageUsers ? loadUsers(1) : Promise.resolve(),
        loadNovels(1),
        loadEditorsChoice(),
        loadFeaturedAuthors(),
        loadGoldWithdrawals(),
      ]);
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
    } else if (activeTab === 'featured') {
      await loadEditorsChoice();
    } else if (activeTab === 'authors') {
      await loadFeaturedAuthors();
    } else if (activeTab === 'gold_wd') {
      await loadGoldWithdrawals(goldWdFilter);
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
    if (isSuperAdmin) return ROLE_OPTIONS; // super_admin already removed from ROLE_OPTIONS
    if (isCoAdmin) {
      return ROLE_OPTIONS.filter(r => r.value !== 'co_admin'); // Co Admin can't promote to Co Admin
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

  // Load chapters for a novel
  const loadChapters = async (novelId: number) => {
    setChaptersLoading(true);
    const data = await getChaptersAdmin(novelId);
    setChapters(data);
    setChaptersLoading(false);
  };

  // Open edit novel modal
  const handleOpenEditNovel = () => {
    if (!selectedNovel) return;
    setShowNovelModal(false);
    setEditNovelTitle(selectedNovel.title);
    setEditNovelSynopsis('');
    setEditNovelCoverUri(null);
    setShowEditNovelModal(true);
  };

  // Pick cover image for admin edit
  const handlePickCoverImage = async () => {
    try {
      const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permissionResult.granted) {
        Alert.alert('Izin Diperlukan', 'Mohon izinkan akses galeri untuk upload cover.');
        return;
      }
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [2, 3],
        quality: 0.85,
      });
      if (!result.canceled && result.assets[0]) {
        setEditNovelCoverUri(result.assets[0].uri);
      }
    } catch (error) {
      console.error('Error picking image:', error);
      Alert.alert('Error', 'Gagal memilih gambar. Coba lagi.');
    }
  };

  // Save novel edit
  const handleSaveNovel = async () => {
    if (!selectedNovel) return;
    setActionLoading(true);

    let newCoverUrl: string | undefined = undefined;

    // Upload cover if changed
    if (editNovelCoverUri) {
      try {
        setIsUploadingCover(true);
        newCoverUrl = await uploadNovelCoverAsync(editNovelCoverUri, `admin-${selectedNovel.authorId}`);
        setIsUploadingCover(false);
      } catch (error) {
        setIsUploadingCover(false);
        setActionLoading(false);
        console.error('Error uploading cover:', error);
        Alert.alert('Gagal', 'Gagal mengupload cover. Coba lagi.');
        return;
      }
    }

    const result = await updateNovelAdmin(selectedNovel.id, {
      title: editNovelTitle,
      ...(newCoverUrl && { coverUrl: newCoverUrl }),
    });
    setActionLoading(false);
    if (result.success) {
      const updatedCover = newCoverUrl || selectedNovel.coverUrl;
      setNovels(prev => prev.map(n => n.id === selectedNovel.id ? { ...n, title: editNovelTitle, coverUrl: updatedCover } : n));
      setSelectedNovel({ ...selectedNovel, title: editNovelTitle, coverUrl: updatedCover });
      setShowEditNovelModal(false);
      Alert.alert('Berhasil', 'Novel telah diupdate');
    } else {
      Alert.alert('Gagal', result.error || 'Terjadi kesalahan');
    }
  };

  // Open chapter for editing
  const handleOpenChapter = (chapter: AdminChapter) => {
    setSelectedChapter(chapter);
    setEditChapterTitle(chapter.title);
    setEditChapterContent(chapter.content);
    setEditChapterIsFree(chapter.isFree);
    setShowChapterModal(true);
  };

  // Save chapter edit
  const handleSaveChapter = async () => {
    if (!selectedChapter || !selectedNovel) return;
    setActionLoading(true);
    const result = await updateChapterAdmin(selectedChapter.id, {
      title: editChapterTitle,
      content: editChapterContent,
      isFree: editChapterIsFree,
    });
    setActionLoading(false);
    if (result.success) {
      setChapters(prev => prev.map(c => c.id === selectedChapter.id ? { 
        ...c, 
        title: editChapterTitle, 
        content: editChapterContent,
        isFree: editChapterIsFree 
      } : c));
      setShowChapterModal(false);
      Alert.alert('Berhasil', 'Chapter telah diupdate');
    } else {
      Alert.alert('Gagal', result.error || 'Terjadi kesalahan');
    }
  };

  // Delete chapter
  const handleDeleteChapter = async (chapterId: number) => {
    Alert.alert(
      'Konfirmasi Hapus',
      'Apakah Anda yakin ingin menghapus chapter ini?',
      [
        { text: 'Batal', style: 'cancel' },
        {
          text: 'Hapus',
          style: 'destructive',
          onPress: async () => {
            setActionLoading(true);
            const result = await deleteChapterAdmin(chapterId);
            setActionLoading(false);
            if (result.success) {
              setChapters(prev => prev.filter(c => c.id !== chapterId));
              setShowChapterModal(false);
              Alert.alert('Berhasil', 'Chapter telah dihapus');
            } else {
              Alert.alert('Gagal', result.error || 'Terjadi kesalahan');
            }
          },
        },
      ]
    );
  };

  // Format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const MAX_EDITORS_CHOICE = 20;

  const handleSearchNovels = async () => {
    if (!searchNovelQuery.trim()) return;
    setSearchingNovels(true);
    const results = await searchNovelsForEditorsChoice(searchNovelQuery.trim());
    setSearchResults(results);
    setSearchingNovels(false);
  };

  const handleAddToEditorsChoice = async (novelId: number) => {
    if (!user) return;
    
    if (editorsChoice.length >= MAX_EDITORS_CHOICE) {
      Alert.alert(
        'Pilihan Editor Penuh',
        `Kamu sudah memilih ${MAX_EDITORS_CHOICE} novel favorit! Untuk menambahkan novel baru, hapus salah satu novel dari daftar Pilihan Editor terlebih dahulu.`,
        [{ text: 'Mengerti', style: 'default' }]
      );
      return;
    }
    
    setActionLoading(true);
    const displayOrder = editorsChoice.length + 1;
    const result = await addToEditorsChoice(parseInt(user.id), novelId, displayOrder);
    setActionLoading(false);
    if (result.success) {
      await loadEditorsChoice();
      setShowAddNovelModal(false);
      setSearchNovelQuery('');
      setSearchResults([]);
      Alert.alert('Berhasil', 'Novel telah ditambahkan ke Pilihan Editor');
    } else {
      Alert.alert('Gagal', result.error || 'Terjadi kesalahan');
    }
  };

  const handleRemoveFromEditorsChoice = async (novelId: number) => {
    Alert.alert(
      'Konfirmasi Hapus',
      'Apakah Anda yakin ingin menghapus novel ini dari Pilihan Editor?',
      [
        { text: 'Batal', style: 'cancel' },
        {
          text: 'Hapus',
          style: 'destructive',
          onPress: async () => {
            setActionLoading(true);
            const result = await removeFromEditorsChoice(novelId);
            setActionLoading(false);
            if (result.success) {
              await loadEditorsChoice();
              Alert.alert('Berhasil', 'Novel telah dihapus dari Pilihan Editor');
            } else {
              Alert.alert('Gagal', result.error || 'Terjadi kesalahan');
            }
          },
        },
      ]
    );
  };

  const MAX_FEATURED_AUTHORS = 20;

  const handleSearchAuthors = async () => {
    if (!searchAuthorQuery.trim()) return;
    setSearchingAuthors(true);
    const results = await searchAuthorsForFeatured(searchAuthorQuery.trim());
    setAuthorSearchResults(results);
    setSearchingAuthors(false);
  };

  const handleAddToFeaturedAuthors = async (authorId: number) => {
    if (!user) return;
    
    if (featuredAuthors.length >= MAX_FEATURED_AUTHORS) {
      Alert.alert(
        'Author Terfavorit Penuh',
        `Kamu sudah memilih ${MAX_FEATURED_AUTHORS} author! Untuk menambahkan author baru, hapus salah satu dari daftar terlebih dahulu.`,
        [{ text: 'Mengerti', style: 'default' }]
      );
      return;
    }
    
    setActionLoading(true);
    const displayOrder = featuredAuthors.length + 1;
    const result = await addToFeaturedAuthors(parseInt(user.id), authorId, displayOrder);
    setActionLoading(false);
    if (result.success) {
      await loadFeaturedAuthors();
      setShowAddAuthorModal(false);
      setSearchAuthorQuery('');
      setAuthorSearchResults([]);
      Alert.alert('Berhasil', 'Author telah ditambahkan ke Author Terfavorit');
    } else {
      Alert.alert('Gagal', result.error || 'Terjadi kesalahan');
    }
  };

  const handleRemoveFromFeaturedAuthors = async (authorId: number) => {
    Alert.alert(
      'Konfirmasi Hapus',
      'Apakah Anda yakin ingin menghapus author ini dari Author Terfavorit?',
      [
        { text: 'Batal', style: 'cancel' },
        {
          text: 'Hapus',
          style: 'destructive',
          onPress: async () => {
            setActionLoading(true);
            const result = await removeFromFeaturedAuthors(authorId);
            setActionLoading(false);
            if (result.success) {
              await loadFeaturedAuthors();
              Alert.alert('Berhasil', 'Author telah dihapus dari Author Terfavorit');
            } else {
              Alert.alert('Gagal', result.error || 'Terjadi kesalahan');
            }
          },
        },
      ]
    );
  };

  const renderTabButton = (tab: TabType, label: string, IconComponent: React.ComponentType<{ size: number; color: string }>) => {
    if (tab === 'users' && !canManageUsers) return null;
    const isActive = activeTab === tab;
    const iconColor = isActive ? '#FFFFFF' : theme.text;
    const bgColor = isActive ? theme.primary : theme.backgroundSecondary;
    const textColor = isActive ? '#FFFFFF' : theme.text;
    
    return (
      <Pressable
        key={`tab-${tab}-${isActive}`}
        onPress={() => handleTabChange(tab)}
        android_ripple={{ color: 'rgba(255,255,255,0.2)', borderless: false }}
        style={[
          styles.tabButton,
          { backgroundColor: bgColor },
        ]}
      >
        <IconComponent size={18} color={iconColor} />
        <ThemedText style={[styles.tabLabel, { color: textColor }]}>
          {label}
        </ThemedText>
      </Pressable>
    );
  };

  const renderStatsTab = () => (
    <View>
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

      <ThemedText style={[Typography.h3, styles.revenueHeader]}>
        Statistik Pendapatan
      </ThemedText>
      <Card elevation={1} style={styles.revenueCard}>
        <View style={styles.revenueRow}>
          <View style={styles.revenueItem}>
            <CoinIcon size={24} color={theme.warning} />
            <View style={styles.revenueItemContent}>
              <ThemedText style={[styles.revenueLabel, { color: theme.textSecondary }]}>
                Total Koin Terjual
              </ThemedText>
              <ThemedText style={[Typography.h3, { color: theme.warning }]}>
                {stats?.totalCoinsPurchased || 0} Novoin
              </ThemedText>
            </View>
          </View>
          <View style={styles.revenueItem}>
            <CoinIcon size={24} color={theme.success} />
            <View style={styles.revenueItemContent}>
              <ThemedText style={[styles.revenueLabel, { color: theme.textSecondary }]}>
                Chapter Terbeli
              </ThemedText>
              <ThemedText style={[Typography.h3, { color: theme.success }]}>
                {stats?.totalChapterSales || 0} Novoin
              </ThemedText>
            </View>
          </View>
        </View>
        <View style={[styles.revenueTotalRow, { borderTopColor: theme.backgroundSecondary }]}>
          <ThemedText style={[styles.revenueTotalLabel, { color: theme.textSecondary }]}>
            Pendapatan Platform
          </ThemedText>
          <ThemedText style={[Typography.h2, { color: theme.success }]}>
            {formatCurrency(stats?.platformRevenue || 0)}
          </ThemedText>
        </View>
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
        {item.coverUrl ? (
          <Image
            source={{ uri: item.coverUrl }}
            style={styles.novelCover}
            contentFit="cover"
          />
        ) : (
          <View style={[styles.novelCoverPlaceholder, { backgroundColor: theme.backgroundSecondary }]}>
            <BookIcon size={24} color={theme.textMuted} />
          </View>
        )}
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
        onRequestClose={() => { setShowNovelModal(false); setChapters([]); }}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: theme.backgroundDefault, maxHeight: '90%' }]}>
            <View style={styles.modalHeader}>
              <ThemedText style={Typography.h3}>Detail Novel</ThemedText>
              <Pressable 
                onPress={() => { setShowNovelModal(false); setChapters([]); }}
                android_ripple={{ color: 'rgba(255,255,255,0.2)', borderless: true }}
              >
                <XIcon size={24} color={theme.text} />
              </Pressable>
            </View>

            <ScrollView style={styles.modalBody}>
              <View style={styles.novelTitleRow}>
                <ThemedText style={[Typography.h2, styles.novelDetailTitle]} numberOfLines={2}>
                  {selectedNovel.title}
                </ThemedText>
                <Pressable 
                  onPress={handleOpenEditNovel}
                  style={styles.editIconButton}
                  android_ripple={{ color: 'rgba(255,255,255,0.2)', borderless: true }}
                >
                  <EditIcon size={20} color={theme.primary} />
                </Pressable>
              </View>
              
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

              <View style={styles.chapterSection}>
                <View style={styles.chapterSectionHeader}>
                  <ThemedText style={Typography.h3}>
                    Daftar Chapter ({selectedNovel.chaptersCount})
                  </ThemedText>
                  <Button
                    onPress={() => loadChapters(selectedNovel.id)}
                    disabled={chaptersLoading}
                    style={styles.loadChaptersButton}
                  >
                    {chaptersLoading ? 'Memuat...' : chapters.length > 0 ? 'Refresh' : 'Muat Chapter'}
                  </Button>
                </View>

                {chaptersLoading ? (
                  <ActivityIndicator size="small" color={theme.primary} style={styles.chapterLoading} />
                ) : chapters.length > 0 ? (
                  <View style={styles.chapterList}>
                    {chapters.map((chapter) => (
                      <Pressable
                        key={chapter.id}
                        onPress={() => handleOpenChapter(chapter)}
                        android_ripple={{ color: 'rgba(255,255,255,0.1)', borderless: false }}
                        style={[styles.chapterItem, { backgroundColor: theme.backgroundSecondary }]}
                      >
                        <View style={styles.chapterItemContent}>
                          <ThemedText style={styles.chapterItemTitle} numberOfLines={1}>
                            Ch. {chapter.chapterNumber}: {chapter.title}
                          </ThemedText>
                          <View style={styles.chapterItemMeta}>
                            {chapter.isFree ? (
                              <ThemedText style={[styles.chapterFreeTag, { color: theme.success }]}>Gratis</ThemedText>
                            ) : (
                              <View style={styles.chapterLockedTag}>
                                <LockIcon size={12} color={theme.warning} />
                                <ThemedText style={[styles.chapterLockedText, { color: theme.warning }]}>Berbayar</ThemedText>
                              </View>
                            )}
                          </View>
                        </View>
                        <EditIcon size={18} color={theme.textMuted} />
                      </Pressable>
                    ))}
                  </View>
                ) : null}
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>
    );
  };

  const renderEditNovelModal = () => {
    const currentCoverUrl = editNovelCoverUri || selectedNovel?.coverUrl;
    
    return (
      <Modal
        visible={showEditNovelModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowEditNovelModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: theme.backgroundDefault }]}>
            <View style={styles.modalHeader}>
              <ThemedText style={Typography.h3}>Edit Novel</ThemedText>
              <Pressable 
                onPress={() => setShowEditNovelModal(false)}
                android_ripple={{ color: 'rgba(255,255,255,0.2)', borderless: true }}
              >
                <XIcon size={24} color={theme.text} />
              </Pressable>
            </View>

            <ScrollView style={styles.modalBody}>
              <ThemedText style={[styles.inputLabel, { color: theme.textSecondary }]}>Cover Novel</ThemedText>
              <Pressable onPress={handlePickCoverImage} style={styles.coverPickerContainer}>
                {currentCoverUrl ? (
                  <View style={styles.coverPreviewWrapper}>
                    <Image
                      source={{ uri: currentCoverUrl }}
                      style={styles.coverPreviewImage}
                      contentFit="cover"
                    />
                    <View style={styles.coverEditOverlay}>
                      <CameraIcon size={24} color="#fff" />
                      <ThemedText style={styles.coverEditText}>Ganti Cover</ThemedText>
                    </View>
                  </View>
                ) : (
                  <View style={[styles.coverPlaceholder, { backgroundColor: theme.backgroundSecondary, borderColor: theme.backgroundTertiary }]}>
                    <CameraIcon size={32} color={theme.textMuted} />
                    <ThemedText style={[styles.coverPlaceholderText, { color: theme.textMuted }]}>
                      Pilih Cover
                    </ThemedText>
                  </View>
                )}
              </Pressable>

              <ThemedText style={[styles.inputLabel, { color: theme.textSecondary, marginTop: Spacing.md }]}>Judul Novel</ThemedText>
              <TextInput
                style={[styles.textInput, { color: theme.text, backgroundColor: theme.backgroundSecondary, borderColor: theme.backgroundTertiary }]}
                value={editNovelTitle}
                onChangeText={setEditNovelTitle}
                placeholder="Judul novel"
                placeholderTextColor={theme.textMuted}
              />

              <View style={styles.actionButtons}>
                <Button
                  onPress={handleSaveNovel}
                  disabled={actionLoading || isUploadingCover}
                  style={styles.actionButton}
                >
                  {isUploadingCover ? 'Mengupload Cover...' : actionLoading ? 'Menyimpan...' : 'Simpan'}
                </Button>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>
    );
  };

  const renderChapterModal = () => {
    if (!selectedChapter) return null;

    return (
      <Modal
        visible={showChapterModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowChapterModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: theme.backgroundDefault, maxHeight: '90%' }]}>
            <View style={styles.modalHeader}>
              <ThemedText style={Typography.h3}>Edit Chapter {selectedChapter.chapterNumber}</ThemedText>
              <Pressable 
                onPress={() => setShowChapterModal(false)}
                android_ripple={{ color: 'rgba(255,255,255,0.2)', borderless: true }}
              >
                <XIcon size={24} color={theme.text} />
              </Pressable>
            </View>

            <ScrollView style={styles.modalBody}>
              <ThemedText style={[styles.inputLabel, { color: theme.textSecondary }]}>Judul Chapter</ThemedText>
              <TextInput
                style={[styles.textInput, { color: theme.text, backgroundColor: theme.backgroundSecondary, borderColor: theme.backgroundTertiary }]}
                value={editChapterTitle}
                onChangeText={setEditChapterTitle}
                placeholder="Judul chapter"
                placeholderTextColor={theme.textMuted}
              />

              <ThemedText style={[styles.inputLabel, { color: theme.textSecondary, marginTop: Spacing.md }]}>Konten</ThemedText>
              <TextInput
                style={[styles.textInputMultiline, { color: theme.text, backgroundColor: theme.backgroundSecondary, borderColor: theme.backgroundTertiary }]}
                value={editChapterContent}
                onChangeText={setEditChapterContent}
                placeholder="Konten chapter"
                placeholderTextColor={theme.textMuted}
                multiline
                numberOfLines={10}
                textAlignVertical="top"
              />

              <Pressable
                onPress={() => setEditChapterIsFree(!editChapterIsFree)}
                style={styles.checkboxRow}
              >
                <View style={[styles.checkbox, { borderColor: theme.primary, backgroundColor: editChapterIsFree ? theme.primary : 'transparent' }]}>
                  {editChapterIsFree ? <ThemedText style={styles.checkmark}>✓</ThemedText> : null}
                </View>
                <ThemedText style={styles.checkboxLabel}>Chapter Gratis</ThemedText>
              </Pressable>

              <View style={styles.actionButtons}>
                <Button
                  onPress={handleSaveChapter}
                  disabled={actionLoading}
                  style={styles.actionButton}
                >
                  {actionLoading ? 'Menyimpan...' : 'Simpan Chapter'}
                </Button>
                <Button
                  onPress={() => handleDeleteChapter(selectedChapter.id)}
                  disabled={actionLoading}
                  style={styles.actionButton}
                >
                  Hapus Chapter
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
      <View style={styles.tabsWrapper}>
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.tabsContainer}
        >
          {renderTabButton('stats', 'Statistik', BarChartIcon)}
          {renderTabButton('users', 'Users', UsersIcon)}
          {renderTabButton('novels', 'Novel', BookIcon)}
          {renderTabButton('featured', 'Pilihan Editor', AwardIcon)}
          {renderTabButton('authors', 'Author Terfavorit', UserIcon)}
          {renderTabButton('gold_wd', 'Penarikan Gold', DollarSignIcon)}
        </ScrollView>
      </View>

      {activeTab === 'stats' ? (
        <ScreenScrollView
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.primary} />
          }
        >
          <View style={styles.content}>
            <ThemedText style={[Typography.h2, styles.sectionHeader]}>
              Statistik Novea
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
      ) : activeTab === 'novels' ? (
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
      ) : activeTab === 'featured' ? (
        <View style={styles.listContainer}>
          <View style={styles.featuredHeader}>
            <View style={{ flex: 1 }}>
              <ThemedText style={Typography.h3}>Pilihan Editor</ThemedText>
              <ThemedText style={[styles.featuredCounter, { color: editorsChoice.length >= MAX_EDITORS_CHOICE ? theme.error : theme.textSecondary }]}>
                {editorsChoice.length}/{MAX_EDITORS_CHOICE} novel dipilih
              </ThemedText>
            </View>
            <Pressable
              onPress={() => {
                if (editorsChoice.length >= MAX_EDITORS_CHOICE) {
                  Alert.alert(
                    'Pilihan Editor Penuh',
                    `Kamu sudah memilih ${MAX_EDITORS_CHOICE} novel favorit! Untuk menambahkan novel baru, hapus salah satu novel dari daftar Pilihan Editor terlebih dahulu.`,
                    [{ text: 'Mengerti', style: 'default' }]
                  );
                } else {
                  setShowAddNovelModal(true);
                }
              }}
              style={[
                styles.addButton, 
                { backgroundColor: editorsChoice.length >= MAX_EDITORS_CHOICE ? theme.textMuted : theme.primary }
              ]}
            >
              <PlusIcon size={18} color="#FFFFFF" />
              <ThemedText style={styles.addButtonText}>Tambah</ThemedText>
            </Pressable>
          </View>
          {editorsChoiceLoading ? (
            <View style={styles.emptyState}>
              <ActivityIndicator size="large" color={theme.primary} />
            </View>
          ) : (
            <FlatList
              data={editorsChoice}
              renderItem={({ item }) => (
                <Card elevation={1} style={styles.listItem}>
                  {item.coverUrl ? (
                    <Image
                      source={{ uri: item.coverUrl }}
                      style={styles.novelCover}
                      contentFit="cover"
                    />
                  ) : (
                    <View style={[styles.novelCoverPlaceholder, { backgroundColor: theme.backgroundSecondary }]}>
                      <AwardIcon size={24} color={theme.warning} />
                    </View>
                  )}
                  <View style={styles.listItemContent}>
                    <ThemedText style={styles.listItemTitle} numberOfLines={1}>
                      {item.title}
                    </ThemedText>
                    <ThemedText style={[styles.listItemSubtitle, { color: theme.textSecondary }]} numberOfLines={1}>
                      oleh {item.authorName}
                    </ThemedText>
                    <ThemedText style={[styles.novelStatText, { color: theme.textMuted }]}>
                      Ditambahkan oleh {item.addedByName}
                    </ThemedText>
                  </View>
                  <Pressable
                    onPress={() => handleRemoveFromEditorsChoice(item.novelId)}
                    style={[styles.removeButton, { backgroundColor: theme.error }]}
                  >
                    <TrashIcon size={16} color="#FFFFFF" />
                  </Pressable>
                </Card>
              )}
              keyExtractor={(item) => item.id.toString()}
              contentContainerStyle={styles.listContent}
              refreshControl={
                <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.primary} />
              }
              ListEmptyComponent={
                <View style={styles.emptyState}>
                  <AwardIcon size={48} color={theme.textMuted} />
                  <ThemedText style={[styles.emptyText, { color: theme.textMuted }]}>
                    Belum ada novel pilihan editor
                  </ThemedText>
                  <ThemedText style={[styles.emptySubtext, { color: theme.textMuted }]}>
                    Klik tombol Tambah untuk menambahkan novel
                  </ThemedText>
                </View>
              }
            />
          )}
        </View>
      ) : activeTab === 'authors' ? (
        <View style={styles.listContainer}>
          <View style={styles.featuredHeader}>
            <ThemedText style={[styles.featuredCounter, { color: featuredAuthors.length >= MAX_FEATURED_AUTHORS ? theme.error : theme.textSecondary }]}>
              {featuredAuthors.length}/{MAX_FEATURED_AUTHORS} author dipilih
            </ThemedText>
            <Pressable
              onPress={() => {
                if (featuredAuthors.length >= MAX_FEATURED_AUTHORS) {
                  Alert.alert(
                    'Author Terfavorit Penuh',
                    `Kamu sudah memilih ${MAX_FEATURED_AUTHORS} author! Untuk menambahkan author baru, hapus salah satu dari daftar terlebih dahulu.`,
                    [{ text: 'Mengerti', style: 'default' }]
                  );
                  return;
                }
                setShowAddAuthorModal(true);
              }}
              style={[
                styles.addFeaturedButton,
                { backgroundColor: featuredAuthors.length >= MAX_FEATURED_AUTHORS ? theme.textMuted : theme.primary }
              ]}
            >
              <PlusIcon size={16} color="#FFFFFF" />
              <ThemedText style={styles.addFeaturedText}>Tambah</ThemedText>
            </Pressable>
          </View>
          {featuredAuthorsLoading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={theme.primary} />
            </View>
          ) : (
            <FlatList
              data={featuredAuthors}
              renderItem={({ item }) => (
                <Card elevation={1} style={[styles.listItem, { marginHorizontal: Spacing.md }]}>
                  <Avatar uri={item.avatarUrl} name={item.name} size={48} />
                  <View style={styles.listItemContent}>
                    <ThemedText style={styles.listItemTitle} numberOfLines={1}>
                      {item.name}
                    </ThemedText>
                    <View style={styles.listItemMeta}>
                      <ThemedText style={[styles.listItemSubtitle, { color: theme.textSecondary }]}>
                        {item.novelCount} novel
                      </ThemedText>
                      <ThemedText style={[styles.listItemSubtitle, { color: theme.textSecondary }]}>
                        {item.followersCount} pengikut
                      </ThemedText>
                    </View>
                  </View>
                  <Pressable
                    onPress={() => handleRemoveFromFeaturedAuthors(item.authorId)}
                    style={[styles.removeButton, { backgroundColor: theme.error }]}
                  >
                    <TrashIcon size={16} color="#FFFFFF" />
                  </Pressable>
                </Card>
              )}
              keyExtractor={(item) => item.id.toString()}
              contentContainerStyle={styles.listContent}
              refreshControl={
                <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.primary} />
              }
              ListEmptyComponent={
                <View style={styles.emptyState}>
                  <UserIcon size={48} color={theme.textMuted} />
                  <ThemedText style={[styles.emptyText, { color: theme.textMuted }]}>
                    Belum ada author terfavorit
                  </ThemedText>
                  <ThemedText style={[styles.emptySubtext, { color: theme.textMuted }]}>
                    Klik tombol Tambah untuk menambahkan author
                  </ThemedText>
                </View>
              }
            />
          )}
        </View>
      ) : activeTab === 'gold_wd' ? (
        <View style={styles.listContainer}>
          <View style={styles.featuredHeader}>
            <ThemedText style={Typography.h3}>Penarikan Gold Novoin</ThemedText>
          </View>
          <View style={[styles.filterContainer, { marginHorizontal: Spacing.md }]}>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              {[
                { value: '', label: 'Semua' },
                { value: 'pending', label: 'Pending' },
                { value: 'processing', label: 'Diproses' },
                { value: 'approved', label: 'Disetujui' },
                { value: 'paid', label: 'Dibayar' },
                { value: 'rejected', label: 'Ditolak' },
              ].map((filter) => (
                <Pressable
                  key={filter.value}
                  onPress={() => {
                    setGoldWdFilter(filter.value);
                    loadGoldWithdrawals(filter.value);
                  }}
                  style={[
                    styles.filterChip,
                    { 
                      backgroundColor: goldWdFilter === filter.value ? theme.primary : theme.backgroundSecondary,
                      borderColor: goldWdFilter === filter.value ? theme.primary : theme.backgroundTertiary,
                    },
                  ]}
                >
                  <ThemedText style={[
                    styles.filterChipText,
                    { color: goldWdFilter === filter.value ? '#FFFFFF' : theme.text },
                  ]}>
                    {filter.label}
                  </ThemedText>
                </Pressable>
              ))}
            </ScrollView>
          </View>
          {goldWithdrawalsLoading ? (
            <View style={styles.emptyState}>
              <ActivityIndicator size="large" color={theme.primary} />
            </View>
          ) : (
            <FlatList
              data={goldWithdrawals}
              renderItem={({ item }) => {
                const statusColors: Record<string, string> = {
                  pending: theme.warning,
                  processing: theme.link,
                  approved: theme.success,
                  paid: theme.success,
                  rejected: theme.error,
                  cancelled: theme.textMuted,
                };
                const statusLabels: Record<string, string> = {
                  pending: 'Menunggu',
                  processing: 'Diproses',
                  approved: 'Disetujui',
                  paid: 'Dibayar',
                  rejected: 'Ditolak',
                  cancelled: 'Dibatalkan',
                };
                return (
                  <Card elevation={1} style={[styles.listItem, { marginHorizontal: Spacing.md, flexDirection: 'column', alignItems: 'stretch' }]}>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <View style={{ flex: 1 }}>
                        <ThemedText style={styles.listItemTitle} numberOfLines={1}>
                          {item.userName}
                        </ThemedText>
                        <ThemedText style={[styles.listItemSubtitle, { color: theme.textSecondary }]} numberOfLines={1}>
                          {item.userEmail}
                        </ThemedText>
                      </View>
                      <View style={[styles.statusBadge, { backgroundColor: statusColors[item.status] + '20' }]}>
                        <ThemedText style={[styles.statusBadgeText, { color: statusColors[item.status] }]}>
                          {statusLabels[item.status] || item.status}
                        </ThemedText>
                      </View>
                    </View>
                    <View style={[styles.goldWdDetails, { borderTopColor: theme.backgroundSecondary }]}>
                      <View style={styles.goldWdRow}>
                        <ThemedText style={[styles.goldWdLabel, { color: theme.textSecondary }]}>Gold</ThemedText>
                        <ThemedText style={[styles.goldWdValue, { color: theme.warning }]}>{item.goldAmount} Gold</ThemedText>
                      </View>
                      <View style={styles.goldWdRow}>
                        <ThemedText style={[styles.goldWdLabel, { color: theme.textSecondary }]}>Rupiah</ThemedText>
                        <ThemedText style={styles.goldWdValue}>{formatCurrency(item.rupiahAmount)}</ThemedText>
                      </View>
                      <View style={styles.goldWdRow}>
                        <ThemedText style={[styles.goldWdLabel, { color: theme.textSecondary }]}>Biaya</ThemedText>
                        <ThemedText style={[styles.goldWdValue, { color: theme.error }]}>-{formatCurrency(item.fee)}</ThemedText>
                      </View>
                      <View style={styles.goldWdRow}>
                        <ThemedText style={[styles.goldWdLabel, { color: theme.textSecondary }]}>Diterima</ThemedText>
                        <ThemedText style={[styles.goldWdValue, { color: theme.success }]}>{formatCurrency(item.netAmount)}</ThemedText>
                      </View>
                      <View style={[styles.goldWdRow, { marginTop: Spacing.xs }]}>
                        <ThemedText style={[styles.goldWdLabel, { color: theme.textSecondary }]}>Bank</ThemedText>
                        <ThemedText style={styles.goldWdValue}>{item.bankName}</ThemedText>
                      </View>
                      <View style={styles.goldWdRow}>
                        <ThemedText style={[styles.goldWdLabel, { color: theme.textSecondary }]}>No. Rekening</ThemedText>
                        <ThemedText style={styles.goldWdValue}>{item.accountNumber}</ThemedText>
                      </View>
                      <View style={styles.goldWdRow}>
                        <ThemedText style={[styles.goldWdLabel, { color: theme.textSecondary }]}>Nama</ThemedText>
                        <ThemedText style={styles.goldWdValue}>{item.accountHolderName}</ThemedText>
                      </View>
                      <View style={styles.goldWdRow}>
                        <ThemedText style={[styles.goldWdLabel, { color: theme.textSecondary }]}>Tanggal</ThemedText>
                        <ThemedText style={styles.goldWdValue}>{new Date(item.createdAt).toLocaleDateString('id-ID')}</ThemedText>
                      </View>
                    </View>
                    {item.status === 'pending' || item.status === 'processing' || item.status === 'approved' ? (
                      <View style={styles.goldWdActions}>
                        {item.status === 'pending' ? (
                          <>
                            <Pressable
                              onPress={() => handleUpdateGoldWdStatus(item.id, 'processing')}
                              style={[styles.goldWdActionBtn, { backgroundColor: theme.link }]}
                            >
                              <ThemedText style={styles.goldWdActionText}>Proses</ThemedText>
                            </Pressable>
                            <Pressable
                              onPress={() => {
                                Alert.prompt ? Alert.prompt(
                                  'Tolak Penarikan',
                                  'Masukkan alasan penolakan:',
                                  (note) => handleUpdateGoldWdStatus(item.id, 'rejected', note),
                                  'plain-text'
                                ) : handleUpdateGoldWdStatus(item.id, 'rejected', 'Ditolak oleh admin');
                              }}
                              style={[styles.goldWdActionBtn, { backgroundColor: theme.error }]}
                            >
                              <ThemedText style={styles.goldWdActionText}>Tolak</ThemedText>
                            </Pressable>
                          </>
                        ) : item.status === 'processing' ? (
                          <>
                            <Pressable
                              onPress={() => handleUpdateGoldWdStatus(item.id, 'approved')}
                              style={[styles.goldWdActionBtn, { backgroundColor: theme.success }]}
                            >
                              <ThemedText style={styles.goldWdActionText}>Setujui</ThemedText>
                            </Pressable>
                            <Pressable
                              onPress={() => {
                                Alert.prompt ? Alert.prompt(
                                  'Tolak Penarikan',
                                  'Masukkan alasan penolakan:',
                                  (note) => handleUpdateGoldWdStatus(item.id, 'rejected', note),
                                  'plain-text'
                                ) : handleUpdateGoldWdStatus(item.id, 'rejected', 'Ditolak oleh admin');
                              }}
                              style={[styles.goldWdActionBtn, { backgroundColor: theme.error }]}
                            >
                              <ThemedText style={styles.goldWdActionText}>Tolak</ThemedText>
                            </Pressable>
                          </>
                        ) : item.status === 'approved' ? (
                          <Pressable
                            onPress={() => handleUpdateGoldWdStatus(item.id, 'paid')}
                            style={[styles.goldWdActionBtn, { backgroundColor: theme.success, flex: 1 }]}
                          >
                            <ThemedText style={styles.goldWdActionText}>Tandai Sudah Dibayar</ThemedText>
                          </Pressable>
                        ) : null}
                      </View>
                    ) : null}
                    {item.adminNote ? (
                      <View style={[styles.adminNoteContainer, { backgroundColor: theme.backgroundSecondary }]}>
                        <ThemedText style={[styles.adminNoteLabel, { color: theme.textSecondary }]}>Catatan Admin:</ThemedText>
                        <ThemedText style={styles.adminNoteText}>{item.adminNote}</ThemedText>
                      </View>
                    ) : null}
                  </Card>
                );
              }}
              keyExtractor={(item) => item.id.toString()}
              contentContainerStyle={styles.listContent}
              refreshControl={
                <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.primary} />
              }
              ListEmptyComponent={
                <View style={styles.emptyState}>
                  <DollarSignIcon size={48} color={theme.textMuted} />
                  <ThemedText style={[styles.emptyText, { color: theme.textMuted }]}>
                    Tidak ada permintaan penarikan
                  </ThemedText>
                </View>
              }
            />
          )}
        </View>
      ) : null}

      {/* Add Author to Featured Authors Modal */}
      <Modal
        visible={showAddAuthorModal}
        transparent
        animationType="fade"
        onRequestClose={() => {
          setShowAddAuthorModal(false);
          setSearchAuthorQuery('');
          setAuthorSearchResults([]);
        }}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: theme.backgroundDefault }]}>
            <View style={styles.modalHeader}>
              <ThemedText style={Typography.h3}>Tambah Author Terfavorit</ThemedText>
              <Pressable 
                onPress={() => {
                  setShowAddAuthorModal(false);
                  setSearchAuthorQuery('');
                  setAuthorSearchResults([]);
                }}
              >
                <XIcon size={24} color={theme.text} />
              </Pressable>
            </View>
            <ScrollView style={styles.modalBody}>
              <View style={[styles.searchContainer, { backgroundColor: theme.backgroundSecondary, marginHorizontal: 0 }]}>
                <SearchIcon size={20} color={theme.textMuted} />
                <TextInput
                  style={[styles.searchInput, { color: theme.text }]}
                  placeholder="Cari author untuk ditambahkan..."
                  placeholderTextColor={theme.textMuted}
                  value={searchAuthorQuery}
                  onChangeText={setSearchAuthorQuery}
                  onSubmitEditing={handleSearchAuthors}
                  returnKeyType="search"
                />
              </View>
              <Button onPress={handleSearchAuthors} disabled={searchingAuthors} style={{ marginTop: Spacing.sm }}>
                {searchingAuthors ? 'Mencari...' : 'Cari Author'}
              </Button>
              
              {authorSearchResults.length > 0 ? (
                <View style={{ marginTop: Spacing.lg }}>
                  <ThemedText style={[Typography.body, { marginBottom: Spacing.sm, color: theme.textSecondary }]}>
                    Hasil Pencarian ({authorSearchResults.length})
                  </ThemedText>
                  {authorSearchResults.map((author) => (
                    <Pressable
                      key={author.id}
                      onPress={() => handleAddToFeaturedAuthors(author.id)}
                      disabled={actionLoading}
                    >
                      <Card elevation={1} style={[styles.listItem, { marginBottom: Spacing.sm }]}>
                        <Avatar uri={author.avatarUrl} name={author.name} size={40} />
                        <View style={styles.listItemContent}>
                          <ThemedText style={styles.listItemTitle} numberOfLines={1}>
                            {author.name}
                          </ThemedText>
                          <ThemedText style={[styles.listItemSubtitle, { color: theme.textSecondary }]} numberOfLines={1}>
                            {author.novelCount} novel
                          </ThemedText>
                        </View>
                        <PlusIcon size={20} color={theme.primary} />
                      </Card>
                    </Pressable>
                  ))}
                </View>
              ) : searchAuthorQuery && !searchingAuthors ? (
                <ThemedText style={[styles.emptyText, { color: theme.textMuted, marginTop: Spacing.lg, textAlign: 'center' }]}>
                  Tidak ada author ditemukan
                </ThemedText>
              ) : null}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Add Novel to Editors Choice Modal */}
      <Modal
        visible={showAddNovelModal}
        transparent
        animationType="fade"
        onRequestClose={() => {
          setShowAddNovelModal(false);
          setSearchNovelQuery('');
          setSearchResults([]);
        }}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: theme.backgroundDefault }]}>
            <View style={styles.modalHeader}>
              <ThemedText style={Typography.h3}>Tambah Pilihan Editor</ThemedText>
              <Pressable 
                onPress={() => {
                  setShowAddNovelModal(false);
                  setSearchNovelQuery('');
                  setSearchResults([]);
                }}
              >
                <XIcon size={24} color={theme.text} />
              </Pressable>
            </View>
            <ScrollView style={styles.modalBody}>
              <View style={[styles.searchContainer, { backgroundColor: theme.backgroundSecondary, marginHorizontal: 0 }]}>
                <SearchIcon size={20} color={theme.textMuted} />
                <TextInput
                  style={[styles.searchInput, { color: theme.text }]}
                  placeholder="Cari novel untuk ditambahkan..."
                  placeholderTextColor={theme.textMuted}
                  value={searchNovelQuery}
                  onChangeText={setSearchNovelQuery}
                  onSubmitEditing={handleSearchNovels}
                  returnKeyType="search"
                />
              </View>
              <Button onPress={handleSearchNovels} disabled={searchingNovels} style={{ marginTop: Spacing.sm }}>
                {searchingNovels ? 'Mencari...' : 'Cari Novel'}
              </Button>
              
              {searchResults.length > 0 ? (
                <View style={{ marginTop: Spacing.lg }}>
                  <ThemedText style={[Typography.body, { marginBottom: Spacing.sm, color: theme.textSecondary }]}>
                    Hasil Pencarian ({searchResults.length})
                  </ThemedText>
                  {searchResults.map((novel) => (
                    <Pressable
                      key={novel.id}
                      onPress={() => handleAddToEditorsChoice(novel.id)}
                      disabled={actionLoading}
                    >
                      <Card elevation={1} style={[styles.listItem, { marginBottom: Spacing.sm }]}>
                        <View style={[styles.novelIcon, { backgroundColor: theme.backgroundSecondary }]}>
                          <BookIcon size={24} color={theme.text} />
                        </View>
                        <View style={styles.listItemContent}>
                          <ThemedText style={styles.listItemTitle} numberOfLines={1}>
                            {novel.title}
                          </ThemedText>
                          <ThemedText style={[styles.listItemSubtitle, { color: theme.textSecondary }]} numberOfLines={1}>
                            oleh {novel.authorName}
                          </ThemedText>
                        </View>
                        <PlusIcon size={20} color={theme.primary} />
                      </Card>
                    </Pressable>
                  ))}
                </View>
              ) : searchNovelQuery && !searchingNovels ? (
                <ThemedText style={[styles.emptyText, { color: theme.textMuted, marginTop: Spacing.lg, textAlign: 'center' }]}>
                  Tidak ada novel ditemukan
                </ThemedText>
              ) : null}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {renderUserModal()}
      {renderNovelModal()}
      {renderEditNovelModal()}
      {renderChapterModal()}
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
  tabsWrapper: {
    flexShrink: 0,
  },
  tabsContainer: {
    flexDirection: 'row',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    gap: Spacing.xs,
    alignItems: 'center',
  },
  tabButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: BorderRadius.md,
    gap: 4,
    height: 36,
  },
  tabLabel: {
    fontSize: 13,
    fontWeight: '600',
  },
  content: {
    paddingHorizontal: Spacing.md,
    paddingTop: Spacing.xs,
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
  novelCover: {
    width: 50,
    height: 70,
    borderRadius: BorderRadius.sm,
  },
  novelCoverPlaceholder: {
    width: 50,
    height: 70,
    borderRadius: BorderRadius.sm,
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
    flex: 1,
  },
  revenueHeader: {
    marginBottom: Spacing.md,
  },
  revenueCard: {
    padding: Spacing.lg,
    marginBottom: Spacing.xl,
  },
  revenueRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: Spacing.md,
  },
  revenueItem: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  revenueItemContent: {
    flex: 1,
  },
  revenueLabel: {
    fontSize: 12,
    marginBottom: Spacing.xs,
  },
  revenueTotalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: Spacing.lg,
    paddingTop: Spacing.lg,
    borderTopWidth: 1,
  },
  revenueTotalLabel: {
    fontSize: 14,
  },
  revenueNote: {
    fontSize: 11,
    marginTop: Spacing.md,
    fontStyle: 'italic',
  },
  novelTitleRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.sm,
    marginBottom: Spacing.xl,
  },
  editIconButton: {
    padding: Spacing.sm,
  },
  chapterSection: {
    marginTop: Spacing.xl,
    paddingTop: Spacing.lg,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.1)',
  },
  chapterSectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  loadChaptersButton: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
  },
  chapterLoading: {
    padding: Spacing.lg,
  },
  chapterList: {
    gap: Spacing.sm,
  },
  chapterItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
  },
  chapterItemContent: {
    flex: 1,
    marginRight: Spacing.md,
  },
  chapterItemTitle: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: Spacing.xs,
  },
  chapterItemMeta: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  chapterFreeTag: {
    fontSize: 12,
    fontWeight: '600',
  },
  chapterLockedTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  chapterLockedText: {
    fontSize: 12,
    fontWeight: '600',
  },
  inputLabel: {
    fontSize: 14,
    marginBottom: Spacing.sm,
  },
  textInput: {
    fontSize: 16,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
  },
  textInputMultiline: {
    fontSize: 16,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    minHeight: 150,
    textAlignVertical: 'top',
  },
  checkboxRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: Spacing.lg,
    gap: Spacing.md,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: BorderRadius.sm,
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkmark: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: 'bold',
  },
  checkboxLabel: {
    fontSize: 16,
  },
  featuredHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
    marginBottom: Spacing.sm,
  },
  featuredCounter: {
    fontSize: 14,
    fontWeight: '500',
  },
  addFeaturedButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm + 2,
    borderRadius: BorderRadius.lg,
    gap: Spacing.sm,
  },
  addFeaturedText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.md,
    gap: Spacing.xs,
  },
  addButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  removeButton: {
    padding: Spacing.sm,
    borderRadius: BorderRadius.md,
  },
  emptySubtext: {
    fontSize: 14,
    textAlign: 'center',
  },
  filterContainer: {
    marginBottom: Spacing.md,
  },
  filterChip: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.lg,
    marginRight: Spacing.sm,
    borderWidth: 1,
  },
  filterChipText: {
    fontSize: 13,
    fontWeight: '500',
  },
  statusBadge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderRadius: BorderRadius.md,
  },
  statusBadgeText: {
    fontSize: 12,
    fontWeight: '600',
  },
  goldWdDetails: {
    marginTop: Spacing.md,
    paddingTop: Spacing.md,
    borderTopWidth: 1,
  },
  goldWdRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 4,
  },
  goldWdLabel: {
    fontSize: 13,
  },
  goldWdValue: {
    fontSize: 13,
    fontWeight: '600',
  },
  goldWdActions: {
    flexDirection: 'row',
    gap: Spacing.sm,
    marginTop: Spacing.md,
    paddingTop: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.1)',
  },
  goldWdActionBtn: {
    flex: 1,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.md,
    alignItems: 'center',
  },
  goldWdActionText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '600',
  },
  adminNoteContainer: {
    marginTop: Spacing.md,
    padding: Spacing.sm,
    borderRadius: BorderRadius.md,
  },
  adminNoteLabel: {
    fontSize: 12,
    marginBottom: Spacing.xs,
  },
  adminNoteText: {
    fontSize: 13,
  },
  coverPickerContainer: {
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  coverPreviewWrapper: {
    width: 120,
    height: 180,
    borderRadius: BorderRadius.md,
    overflow: 'hidden',
    position: 'relative',
  },
  coverPreviewImage: {
    width: '100%',
    height: '100%',
  },
  coverEditOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    paddingVertical: Spacing.sm,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: Spacing.xs,
  },
  coverEditText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
  coverPlaceholder: {
    width: 120,
    height: 180,
    borderRadius: BorderRadius.md,
    borderWidth: 2,
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
  },
  coverPlaceholderText: {
    fontSize: 12,
    marginTop: Spacing.sm,
  },
});

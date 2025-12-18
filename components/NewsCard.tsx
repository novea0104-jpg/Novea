import React from "react";
import { View, StyleSheet, Image, Pressable } from "react-native";
import { ThemedText } from "@/components/ThemedText";
import { Card } from "@/components/Card";
import { useTheme } from "@/hooks/useTheme";
import { Spacing, BorderRadius } from "@/constants/theme";
import { TrashIcon } from "@/components/icons/TrashIcon";
import { EditIcon } from "@/components/icons/EditIcon";

interface NewsCardProps {
  id: number;
  title: string;
  content: string;
  imageUrl: string | null;
  createdAt: string;
  isOwner: boolean;
  onEdit?: (id: number) => void;
  onDelete?: (id: number) => void;
}

function formatNewsDate(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return "Baru saja";
  if (diffMins < 60) return `${diffMins} menit lalu`;
  if (diffHours < 24) return `${diffHours} jam lalu`;
  if (diffDays < 7) return `${diffDays} hari lalu`;
  
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
  return `${date.getDate()} ${months[date.getMonth()]} ${date.getFullYear()}`;
}

export function NewsCard({
  id,
  title,
  content,
  imageUrl,
  createdAt,
  isOwner,
  onEdit,
  onDelete,
}: NewsCardProps) {
  const { theme } = useTheme();

  return (
    <Card elevation={1} style={styles.card}>
      {imageUrl ? (
        <Image source={{ uri: imageUrl }} style={styles.image} resizeMode="cover" />
      ) : null}
      
      <View style={styles.content}>
        <View style={styles.header}>
          <View style={styles.titleContainer}>
            <Image 
              source={require('@/assets/images/novea-logo.png')} 
              style={styles.nIcon} 
            />
            <ThemedText style={styles.newsLabel}>News</ThemedText>
          </View>
          
          {isOwner ? (
            <View style={styles.actions}>
              <Pressable
                onPress={() => onEdit?.(id)}
                style={({ pressed }) => [
                  styles.actionButton,
                  { backgroundColor: theme.backgroundSecondary, opacity: pressed ? 0.7 : 1 }
                ]}
              >
                <EditIcon size={16} color={theme.textSecondary} />
              </Pressable>
              <Pressable
                onPress={() => onDelete?.(id)}
                style={({ pressed }) => [
                  styles.actionButton,
                  { backgroundColor: '#EF444420', opacity: pressed ? 0.7 : 1 }
                ]}
              >
                <TrashIcon size={16} color="#EF4444" />
              </Pressable>
            </View>
          ) : null}
        </View>

        <ThemedText style={styles.title} numberOfLines={2}>
          {title}
        </ThemedText>
        
        <ThemedText style={[styles.contentText, { color: theme.textSecondary }]} numberOfLines={4}>
          {content}
        </ThemedText>

        <ThemedText style={[styles.date, { color: theme.textMuted }]}>
          {formatNewsDate(createdAt)}
        </ThemedText>
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    marginBottom: Spacing.md,
    overflow: 'hidden',
  },
  image: {
    width: '100%',
    height: 160,
  },
  content: {
    padding: Spacing.md,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  nIcon: {
    width: 24,
    height: 24,
    borderRadius: 4,
  },
  newsLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6C5CE7',
  },
  actions: {
    flexDirection: 'row',
    gap: Spacing.xs,
  },
  actionButton: {
    width: 32,
    height: 32,
    borderRadius: BorderRadius.sm,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: Spacing.xs,
    lineHeight: 24,
  },
  contentText: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: Spacing.sm,
  },
  date: {
    fontSize: 12,
  },
});

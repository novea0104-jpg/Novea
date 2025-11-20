import React from 'react';
import { View, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Feather } from '@expo/vector-icons';
import { ThemedText } from './ThemedText';
import { BorderRadius } from '@/constants/theme';

export type UserRole = 'pembaca' | 'penulis' | 'editor' | 'co_admin' | 'super_admin';

interface RoleBadgeProps {
  role: UserRole;
  size?: 'small' | 'medium' | 'large';
}

const ROLE_CONFIG = {
  pembaca: {
    label: 'Pembaca',
    icon: 'book-open' as const,
    gradient: ['#10B981', '#059669'] as const,
  },
  penulis: {
    label: 'Penulis',
    icon: 'feather' as const,
    gradient: ['#A855F7', '#EC4899'] as const,
  },
  editor: {
    label: 'Editor',
    icon: 'edit-3' as const,
    gradient: ['#FACC15', '#F59E0B'] as const,
  },
  co_admin: {
    label: 'Co Admin',
    icon: 'shield' as const,
    gradient: ['#F59E0B', '#FB923C'] as const,
  },
  super_admin: {
    label: 'Super Admin',
    icon: 'award' as const,
    gradient: ['#EF4444', '#DC2626'] as const,
  },
};

const SIZE_CONFIG = {
  small: {
    height: 22,
    paddingHorizontal: 8,
    fontSize: 11,
    iconSize: 10,
    gap: 4,
  },
  medium: {
    height: 28,
    paddingHorizontal: 12,
    fontSize: 13,
    iconSize: 12,
    gap: 6,
  },
  large: {
    height: 36,
    paddingHorizontal: 16,
    fontSize: 15,
    iconSize: 14,
    gap: 8,
  },
};

export function RoleBadge({ role, size = 'medium' }: RoleBadgeProps) {
  const config = ROLE_CONFIG[role];
  const sizeConfig = SIZE_CONFIG[size];

  return (
    <LinearGradient
      colors={config.gradient}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 0 }}
      style={[
        styles.badge,
        {
          height: sizeConfig.height,
          paddingHorizontal: sizeConfig.paddingHorizontal,
        },
      ]}
    >
      <Feather name={config.icon} size={sizeConfig.iconSize} color="#FFFFFF" />
      <ThemedText
        lightColor="#FFFFFF"
        darkColor="#FFFFFF"
        style={{
          fontSize: sizeConfig.fontSize,
          marginLeft: sizeConfig.gap,
          fontWeight: '700',
          letterSpacing: 0.3,
        }}
      >
        {config.label}
      </ThemedText>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: BorderRadius.xs,
    alignSelf: 'flex-start',
  },
  label: {
    color: '#FFFFFF',
    fontWeight: '700',
    letterSpacing: 0.3,
  },
});

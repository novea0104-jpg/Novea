import React, { useState, useCallback, useRef, useEffect, useLayoutEffect } from "react";
import { 
  View, 
  StyleSheet, 
  Pressable, 
  Image, 
  TextInput, 
  FlatList,
  ActivityIndicator,
  Platform,
  Keyboard,
} from "react-native";
import { useNavigation, useRoute, RouteProp, useFocusEffect } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useHeaderHeight } from "@react-navigation/elements";
import { KeyboardAvoidingView, useReanimatedKeyboardAnimation } from "react-native-keyboard-controller";
import Animated, { useAnimatedStyle } from "react-native-reanimated";
import { ProfileStackParamList } from "@/navigation/ProfileStackNavigator";
import { ThemedView } from "@/components/ThemedView";
import { ThemedText } from "@/components/ThemedText";
import { UserIcon } from "@/components/icons/UserIcon";
import { SendIcon } from "@/components/icons/SendIcon";
import { useTheme } from "@/hooks/useTheme";
import { useAuth } from "@/contexts/AuthContext";
import { getMessages, sendMessage, markConversationRead, PMMessage } from "@/utils/supabase";
import { Spacing, BorderRadius } from "@/constants/theme";
import { useSafeAreaInsets } from "react-native-safe-area-context";

type NavigationProp = NativeStackNavigationProp<ProfileStackParamList, 'MessageThread'>;
type RouteProps = RouteProp<ProfileStackParamList, 'MessageThread'>;

function formatMessageTime(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  
  if (days === 0) {
    return date.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
  } else if (days === 1) {
    return 'Kemarin ' + date.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
  } else {
    return date.toLocaleDateString('id-ID', { day: 'numeric', month: 'short' }) + 
           ' ' + date.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
  }
}

export default function MessageThreadScreen() {
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute<RouteProps>();
  const { theme } = useTheme();
  const { user } = useAuth();
  const insets = useSafeAreaInsets();
  const headerHeight = useHeaderHeight();
  const flatListRef = useRef<FlatList>(null);
  
  const { conversationId, recipientName, recipientAvatar, recipientRole } = route.params;

  useLayoutEffect(() => {
    const parent = navigation.getParent();
    parent?.setOptions({ tabBarStyle: { display: 'none' } });
    
    return () => {
      parent?.setOptions({ tabBarStyle: undefined });
    };
  }, [navigation]);
  
  const [messages, setMessages] = useState<PMMessage[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [messageText, setMessageText] = useState('');

  const loadMessages = useCallback(async () => {
    if (!user || !conversationId) return;
    setIsLoading(true);
    try {
      const data = await getMessages(conversationId, parseInt(user.id));
      setMessages(data);
      await markConversationRead(conversationId, parseInt(user.id));
    } catch (error) {
      console.error('Error loading messages:', error);
    } finally {
      setIsLoading(false);
    }
  }, [user, conversationId]);

  useFocusEffect(
    useCallback(() => {
      loadMessages();
    }, [loadMessages])
  );

  useEffect(() => {
    if (messages.length > 0) {
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: false });
      }, 100);
    }
  }, [messages.length]);

  const handleSend = async () => {
    if (!user || !messageText.trim() || isSending) return;
    
    const text = messageText.trim();
    setMessageText('');
    setIsSending(true);
    
    try {
      const result = await sendMessage(conversationId, parseInt(user.id), text);
      if (result.success && result.message) {
        setMessages(prev => [...prev, result.message!]);
        setTimeout(() => {
          flatListRef.current?.scrollToEnd({ animated: true });
        }, 50);
      }
    } catch (error) {
      console.error('Error sending message:', error);
      setMessageText(text);
    } finally {
      setIsSending(false);
    }
  };

  const renderMessage = ({ item, index }: { item: PMMessage; index: number }) => {
    const isOwn = item.isOwn;
    const showAvatar = !isOwn && (index === 0 || messages[index - 1]?.isOwn);
    const showTime = index === messages.length - 1 || 
                     messages[index + 1]?.isOwn !== item.isOwn ||
                     new Date(messages[index + 1]?.createdAt).getTime() - new Date(item.createdAt).getTime() > 5 * 60 * 1000;
    
    return (
      <View style={[styles.messageRow, isOwn && styles.messageRowOwn]}>
        {!isOwn && showAvatar ? (
          <View style={styles.messageAvatarContainer}>
            {recipientAvatar ? (
              <Image source={{ uri: recipientAvatar }} style={styles.messageAvatar} />
            ) : (
              <View style={[styles.messageAvatar, { backgroundColor: theme.backgroundSecondary }]}>
                <UserIcon size={16} color={theme.textMuted} />
              </View>
            )}
          </View>
        ) : !isOwn ? (
          <View style={styles.messageAvatarPlaceholder} />
        ) : null}
        
        <View style={[styles.messageContainer, isOwn && styles.messageContainerOwn]}>
          <View 
            style={[
              styles.messageBubble, 
              isOwn 
                ? { backgroundColor: theme.primary } 
                : { backgroundColor: theme.backgroundSecondary }
            ]}
          >
            <ThemedText 
              style={[
                styles.messageText, 
                { color: isOwn ? '#FFFFFF' : theme.text }
              ]}
            >
              {item.content}
            </ThemedText>
          </View>
          {showTime ? (
            <ThemedText style={[styles.messageTime, { color: theme.textMuted }, isOwn && styles.messageTimeOwn]}>
              {formatMessageTime(item.createdAt)}
            </ThemedText>
          ) : null}
        </View>
      </View>
    );
  };

  const renderEmpty = () => (
    <View style={styles.emptyContainer}>
      <ThemedText style={[styles.emptyText, { color: theme.textMuted }]}>
        Mulai percakapan dengan {recipientName}
      </ThemedText>
    </View>
  );

  if (!user) {
    return (
      <ThemedView style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ThemedText>Masuk diperlukan</ThemedText>
      </ThemedView>
    );
  }

  const { height: keyboardHeight } = useReanimatedKeyboardAnimation();
  
  const inputContainerStyle = useAnimatedStyle(() => {
    return {
      paddingBottom: Math.max(insets.bottom + Spacing.sm, -keyboardHeight.value + Spacing.sm),
    };
  });

  return (
    <View style={{ flex: 1, backgroundColor: theme.backgroundDefault, paddingTop: headerHeight }}>
      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.primary} />
        </View>
      ) : (
        <FlatList
          ref={flatListRef}
          data={messages}
          renderItem={renderMessage}
          keyExtractor={(item) => item.id.toString()}
          contentContainerStyle={[
            styles.messagesList,
            messages.length === 0 && { flex: 1 },
          ]}
          ListEmptyComponent={renderEmpty}
          keyboardShouldPersistTaps="handled"
          onContentSizeChange={() => {
            if (messages.length > 0) {
              flatListRef.current?.scrollToEnd({ animated: false });
            }
          }}
        />
      )}
      
      <Animated.View style={[styles.inputContainer, { backgroundColor: theme.backgroundSecondary }, inputContainerStyle]}>
        <TextInput
          style={[styles.textInput, { backgroundColor: theme.backgroundDefault, color: theme.text }]}
          placeholder="Tulis pesan..."
          placeholderTextColor={theme.textMuted}
          value={messageText}
          onChangeText={setMessageText}
          multiline
          maxLength={2000}
        />
        <Pressable
          onPress={handleSend}
          disabled={!messageText.trim() || isSending}
          style={({ pressed }) => [
            styles.sendButton,
            { 
              backgroundColor: messageText.trim() ? theme.primary : theme.backgroundTertiary,
              opacity: pressed ? 0.7 : 1,
            },
          ]}
        >
          {isSending ? (
            <ActivityIndicator size="small" color="#FFFFFF" />
          ) : (
            <SendIcon size={20} color={messageText.trim() ? '#FFFFFF' : theme.textMuted} />
          )}
        </Pressable>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  messagesList: {
    padding: Spacing.md,
    paddingBottom: Spacing.lg,
  },
  messageRow: {
    flexDirection: 'row',
    marginBottom: Spacing.xs,
    alignItems: 'flex-end',
  },
  messageRowOwn: {
    justifyContent: 'flex-end',
  },
  messageAvatarContainer: {
    marginRight: Spacing.xs,
    marginBottom: 18,
  },
  messageAvatar: {
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  messageAvatarPlaceholder: {
    width: 28,
    marginRight: Spacing.xs,
  },
  messageContainer: {
    maxWidth: '75%',
  },
  messageContainerOwn: {
    alignItems: 'flex-end',
  },
  messageBubble: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.lg,
    maxWidth: '100%',
  },
  messageText: {
    fontSize: 16,
    lineHeight: 22,
  },
  messageTime: {
    fontSize: 12,
    marginTop: 4,
    marginLeft: 4,
  },
  messageTimeOwn: {
    marginRight: 4,
    marginLeft: 0,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.xl,
  },
  emptyText: {
    fontSize: 14,
    textAlign: 'center',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: Spacing.md,
    paddingTop: Spacing.sm,
    gap: Spacing.sm,
  },
  textInput: {
    flex: 1,
    minHeight: 40,
    maxHeight: 120,
    borderRadius: BorderRadius.lg,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    fontSize: 16,
  },
  sendButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

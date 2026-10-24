import {
  Ionicons,
} from '@expo/vector-icons';

import {
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import {
  Card,
} from '@/components/ui/Card';

import type {
  Client,
} from '@/features/auth/clients/types/client';

import {
  colors,
  radius,
  spacing,
  typography,
} from '@/theme';

type Props = {
  client: Client;
  onPress: () => void;
};

export function ClientCard({
  client,
  onPress,
}: Props) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={
        `Abrir cliente ${client.full_name}`
      }
      onPress={onPress}
      style={({
        pressed,
      }) =>
        pressed
          ? styles.pressed
          : undefined
      }
    >
      <Card style={styles.card}>
        <View
          style={styles.avatar}
        >
          <Ionicons
            name="person-outline"
            size={22}
            color={
              colors.primary
            }
          />
        </View>

        <View
          style={styles.content}
        >
          <Text
            style={styles.name}
            numberOfLines={1}
          >
            {client.full_name}
          </Text>

          <Text
            style={styles.detail}
          >
            {client.phone}
          </Text>

          {client.email ? (
            <Text
              style={
                styles.detail
              }
              numberOfLines={1}
            >
              {client.email}
            </Text>
          ) : null}
        </View>

        <Ionicons
          name="chevron-forward"
          size={20}
          color={
            colors.textMuted
          }
        />
      </Card>
    </Pressable>
  );
}

const styles =
  StyleSheet.create({
    pressed: {
      opacity: 0.86,
    },

    card: {
      padding: spacing.lg,

      flexDirection:
        'row',

      alignItems:
        'center',

      gap: spacing.md,
    },

    avatar: {
      width: 46,
      height: 46,

      borderRadius:
        radius.full,

      alignItems:
        'center',

      justifyContent:
        'center',

      backgroundColor:
        colors.lightBlue,
    },

    content: {
      flex: 1,
      gap: 2,
    },

    name: {
      color:
        colors.navy,

      fontSize:
        typography.size.md,

      fontWeight: '700',
    },

    detail: {
      color:
        colors.textSecondary,

      fontSize:
        typography.size.sm,
    },
  });
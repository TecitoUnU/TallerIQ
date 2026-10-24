import {
  Ionicons,
} from '@expo/vector-icons';

import {
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import type {
  UserProfile,
} from '@/features/users/types/user';

import {
  colors,
  radius,
  spacing,
} from '@/theme';

type Props = {
  user: UserProfile;

  onPress:
    () => void;
};

function getRoleLabel(
  role: string,
) {
  switch (role) {

    case 'ADMIN':
      return 'Administrador';

    case 'MECANICO':
      return 'Mecánico';

    case 'RECEPCIONISTA':
      return 'Recepcionista';

    default:
      return role;
  }
}

export function UserCard({
  user,
  onPress,
}: Props) {

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.card,

        pressed &&
          styles.pressed,
      ]}
    >

      <View
        style={styles.avatar}
      >
        <Ionicons
          name="person-outline"
          size={24}
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
        >
          {user.full_name ||
            'Sin nombre'}
        </Text>

        <Text
          style={styles.email}
        >
          {user.email}
        </Text>

        <Text
          style={styles.role}
        >
          {getRoleLabel(
            user.role,
          )}
        </Text>

      </View>

      <Ionicons
        name="chevron-forward"
        size={20}
        color={
          colors.textMuted
        }
      />

    </Pressable>
  );
}

const styles =
  StyleSheet.create({

    card: {
      flexDirection:
        'row',

      alignItems:
        'center',

      gap: spacing.md,

      backgroundColor:
        colors.white,

      padding:
        spacing.lg,

      borderRadius:
        radius.md,

      borderWidth: 1,

      borderColor:
        colors.border,
    },

    pressed: {
      opacity: 0.8,
    },

    avatar: {
      width: 46,

      height: 46,

      borderRadius: 23,

      backgroundColor:
        colors.lightBlue,

      alignItems:
        'center',

      justifyContent:
        'center',
    },

    content: {
      flex: 1,
    },

    name: {
      fontSize: 16,

      fontWeight: '700',

      color:
        colors.navy,
    },

    email: {
      marginTop: 2,

      fontSize: 13,

      color:
        colors.textMuted,
    },

    role: {
      marginTop:
        spacing.xs,

      fontSize: 13,

      fontWeight: '600',

      color:
        colors.primary,
    },

  });
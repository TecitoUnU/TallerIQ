import { Platform, ViewStyle } from 'react-native';

import { colors } from './colors';

export const shadows = {
  card: Platform.select<ViewStyle>({
    ios: {
      shadowColor: colors.navy,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.08,
      shadowRadius: 12,
    },
    android: {
      elevation: 3,
    },
    default: {},
  }),
} as const;

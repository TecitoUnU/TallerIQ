import { ScrollView, StyleSheet, View, type ViewProps } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { colors, spacing } from '@/theme';

type Props = ViewProps & {
  scroll?: boolean;
  padded?: boolean;
};

export function Screen({ children, scroll = false, padded = true, style, ...rest }: Props) {
  const content = (
    <View style={[padded ? styles.padded : null, styles.content, style]} {...rest}>
      {children}
    </View>
  );

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
      {scroll ? (
        <ScrollView
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {content}
        </ScrollView>
      ) : (
        content
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: colors.background,
  },

  content: {
    flex: 1,
  },

  padded: {
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.lg,
  },

  scrollContent: {
    flexGrow: 1,
  },
});

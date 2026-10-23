import type { ReactNode } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Colors, Sizes } from '@/constants/theme';

export type AuthScreenProps = {
  children: ReactNode;
  footer?: ReactNode;
  withHeader?: boolean;
};

export function AuthScreen({ children, footer, withHeader = true }: AuthScreenProps) {
  const insets = useSafeAreaInsets();
  const top = Math.max(insets.top, Sizes.statusBar);
  const paddingTop = withHeader ? top + Sizes.headerOffset - Sizes.headerHeight / 2 : top;

  return (
    <KeyboardAvoidingView
      style={styles.root}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}>
        <View style={[styles.column, { paddingTop }]}>
          {children}
          {footer ? (
            <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, 0) + 40 }]}>
              {footer}
            </View>
          ) : null}
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  scrollContent: {
    flexGrow: 1,
    alignItems: 'center',
  },
  column: {
    flexGrow: 1,
    width: '100%',
    maxWidth: Sizes.maxContentWidth,
    paddingHorizontal: Sizes.screenPadding,
  },
  footer: {
    marginTop: 'auto',
    paddingTop: 24,
    alignItems: 'center',
  },
});

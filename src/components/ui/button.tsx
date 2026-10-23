import { ActivityIndicator, Pressable, StyleSheet, type PressableProps } from 'react-native';

import { Colors, Radii, Sizes } from '@/constants/theme';

import { AppText } from './app-text';

export type ButtonProps = Omit<PressableProps, 'children' | 'style'> & {
  title: string;
  variant?: 'primary' | 'secondary';
  loading?: boolean;
};

export function Button({
  title,
  variant = 'primary',
  loading = false,
  disabled,
  ...rest
}: ButtonProps) {
  const isDisabled = disabled || loading;
  const secondary = variant === 'secondary';

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled: !!isDisabled, busy: loading }}
      disabled={isDisabled}
      style={({ pressed }) => [
        styles.base,
        { backgroundColor: secondary ? Colors.cardOuter : Colors.primary },
        pressed && styles.pressed,
        disabled && !loading && styles.disabled,
      ]}
      {...rest}>
      {loading ? (
        <ActivityIndicator color={secondary ? Colors.primary : Colors.white} />
      ) : (
        <AppText
          variant="button"
          numberOfLines={1}
          style={secondary ? styles.secondaryText : undefined}>
          {title}
        </AppText>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    width: Sizes.buttonWidth,
    height: Sizes.buttonHeight,
    borderRadius: Radii.button,
    alignSelf: 'center',
    alignItems: 'center',
    justifyContent: 'center',
  },
  secondaryText: {
    color: Colors.primary,
  },
  pressed: {
    opacity: 0.85,
  },
  disabled: {
    opacity: 0.6,
  },
});

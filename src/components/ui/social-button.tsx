import type { ReactNode } from 'react';
import { Pressable, StyleSheet } from 'react-native';

import { Colors, Radii, Sizes } from '@/constants/theme';

export type SocialButtonProps = {
  icon: ReactNode;
  label: string;
  onPress: () => void;
  disabled?: boolean;
};

export function SocialButton({ icon, label, onPress, disabled }: SocialButtonProps) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled: !!disabled }}
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [styles.circle, pressed && styles.pressed, disabled && styles.disabled]}>
      {icon}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  circle: {
    width: Sizes.socialCircle,
    height: Sizes.socialCircle,
    borderRadius: Radii.socialCircle,
    backgroundColor: Colors.cardOuter,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  pressed: {
    opacity: 0.8,
  },
  disabled: {
    opacity: 0.6,
  },
});

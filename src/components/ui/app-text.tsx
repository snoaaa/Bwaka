import { StyleSheet, Text, type TextStyle, type TextProps } from 'react-native';

import { Typography } from '@/constants/theme';

export type AppTextVariant = keyof typeof Typography;

export type AppTextProps = TextProps & {
  variant?: AppTextVariant;
};

export function AppText({ variant = 'body', style, ...rest }: AppTextProps) {
  const variantStyle = Typography[variant];
  const flattened = StyleSheet.flatten(style) as TextStyle | undefined;

  let safeLineHeight: number | undefined = variantStyle.lineHeight;

  if (flattened?.lineHeight !== undefined) {
    safeLineHeight = flattened.lineHeight;
  } else if (flattened?.fontSize && flattened.fontSize !== variantStyle.fontSize) {
   
    safeLineHeight = Math.ceil(flattened.fontSize * 1.35);
  }

  return (
    <Text
      style={[
        variantStyle,
        style,
        safeLineHeight !== undefined ? { lineHeight: safeLineHeight } : null,
      ]}
      {...rest}
    />
  );
}

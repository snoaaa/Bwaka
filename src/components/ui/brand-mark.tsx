import Svg, { Circle, Rect, Text as SvgText } from 'react-native-svg';

import { Colors, FontFamily } from '@/constants/theme';

export type BrandMarkProps = {
  /** Rendered width/height of the square logo frame. */
  size?: number;
  /** Optional stroke/fill color (defaults to brand primary blue #2260FF). */
  color?: string;
};

/**
 * Authentic He'i brand mark vector:
 * - Square outer boundary frame
 * - Top-right notification dot
 * - Signature "He’i" typography
 */
export function BrandMark({ size = 134, color = Colors.primary }: BrandMarkProps) {
  return (
    <Svg
      width={size}
      height={size}
      viewBox="0 0 1000 1000"
      fill="none"
      accessibilityRole="image"
      accessibilityLabel="He'i logo">
      {/* Square Outer Frame */}
      <Rect x={50} y={50} width={900} height={900} stroke={color} strokeWidth={28} />

      {/* Top Right Dot */}
      <Circle cx={842} cy={156} r={66} fill={color} />

      {/* He'i Wordmark */}
      <SvgText
        x={100}
        y={870}
        fill={color}
        fontFamily={FontFamily.bold}
        fontSize={240}
        fontWeight="700"
        letterSpacing={-4}>
        He’i
      </SvgText>
    </Svg>
  );
}

import { Pressable, StyleSheet, View } from 'react-native';

import { Sizes } from '@/constants/theme';

import { AppText } from './app-text';
import { BackChevron } from './icons';

export type ScreenHeaderProps = {
  title: string;
  onBack?: () => void;
};

export function ScreenHeader({ title, onBack }: ScreenHeaderProps) {
  return (
    <View style={styles.row}>
      <View style={styles.titleWrap} pointerEvents="none">
        <AppText variant="title" numberOfLines={1}>
          {title}
        </AppText>
      </View>
      {onBack ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Go back"
          onPress={onBack}
          style={styles.back}>
          <BackChevron />
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    height: Sizes.headerHeight,
  },
  titleWrap: {
    ...StyleSheet.absoluteFill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  back: {
    position: 'absolute',
    left: 12 - Sizes.screenPadding,
    top: (Sizes.headerHeight - 44) / 2,
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

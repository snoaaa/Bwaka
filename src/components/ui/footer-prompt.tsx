import { Pressable, View } from 'react-native';

import { AppText } from './app-text';

export type FooterPromptProps = {
  text: string;
  linkLabel: string;
  onPress: () => void;
};

export function FooterPrompt({ text, linkLabel, onPress }: FooterPromptProps) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
      <AppText variant="body">{text}</AppText>
      <Pressable accessibilityRole="link" onPress={onPress} hitSlop={10}>
        <AppText variant="link">{linkLabel}</AppText>
      </Pressable>
    </View>
  );
}

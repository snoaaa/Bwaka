import { StyleSheet, View } from 'react-native';

import { AppText } from './app-text';
import { FacebookIcon, GoogleIcon } from './icons';
import { SocialButton } from './social-button';

export type SocialRowProps = {
  /** "or sign up with" / "or log in with". */
  caption: string;
  onGoogle: () => void;
  onFacebook: () => void;
  disabled?: boolean;
};

export function SocialRow({ caption, onGoogle, onFacebook, disabled }: SocialRowProps) {
  return (
    <View style={styles.container}>
      <AppText variant="body">{caption}</AppText>
      <View style={styles.circles}>
        <SocialButton
          label="Continue with Google"
          icon={<GoogleIcon />}
          onPress={onGoogle}
          disabled={disabled}
        />
        <SocialButton
          label="Continue with Facebook"
          icon={<FacebookIcon />}
          onPress={onFacebook}
          disabled={disabled}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    marginTop: 16,
  },
  circles: {
    flexDirection: 'row',
    gap: 9,
    marginTop: 11,
  },
});

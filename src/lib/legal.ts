import { Linking } from 'react-native';

/**
 * Legal pages. Set EXPO_PUBLIC_TERMS_URL / EXPO_PUBLIC_PRIVACY_URL (https only)
 * once the documents are published.
 */
const TERMS_URL = process.env.EXPO_PUBLIC_TERMS_URL;
const PRIVACY_URL = process.env.EXPO_PUBLIC_PRIVACY_URL;

function open(url: string | undefined) {
  if (url && /^https:\/\//i.test(url)) {
    void Linking.openURL(url);
  }
}

export const openTerms = () => open(TERMS_URL);
export const openPrivacy = () => open(PRIVACY_URL);

import * as Linking from 'expo-linking';
import { Redirect, useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Platform, StyleSheet, View } from 'react-native';

import { AppText, AuthScreen, Button, ScreenHeader } from '@/components/ui';
import { Colors } from '@/constants/theme';
import { useAuth } from '@/context/auth-context';
import { completeFromUrl, exchangeCode } from '@/lib/auth/auth-service';

type Params = {
  code?: string;
  error?: string;
  error_code?: string;
  error_description?: string;
};

export default function AuthCallbackScreen() {
  const router = useRouter();
  const { session } = useAuth();
  const params = useLocalSearchParams<Params>();
  const handled = useRef(false);
  const [asyncErrorMessage, setAsyncErrorMessage] = useState<string>();

  const code = typeof params.code === 'string' ? params.code : undefined;
  const hasError = !!params.error || !!params.error_description;

  const paramErrorMessage = hasError
    ? params.error_code === 'otp_expired'
      ? 'This authorization has expired. Please try again.'
      : params.error_description || 'Sign-in could not be completed. Please try again.'
    : undefined;

  useEffect(() => {
    if (handled.current || hasError) return;

    if (code) {
      handled.current = true;
      void exchangeCode(code).then((result) => {
        if (!result.ok) setAsyncErrorMessage(result.message);
      });
      return;
    }

    // Check for fragment parameters (#access_token=... or deep-link full URL)
    let checkUrl = '';
    if (Platform.OS === 'web' && typeof window !== 'undefined') {
      checkUrl = window.location.href;
    }

    if (checkUrl && (checkUrl.includes('#') || checkUrl.includes('code='))) {
      handled.current = true;
      void completeFromUrl(checkUrl).then((result) => {
        if (!result.ok) setAsyncErrorMessage(result.message);
      });
      return;
    }

    // On native, check initial URL if code wasn't parsed in search params
    if (Platform.OS !== 'web') {
      void Linking.getInitialURL().then((initialUrl) => {
        if (handled.current) return;
        if (initialUrl && (initialUrl.includes('code=') || initialUrl.includes('#'))) {
          handled.current = true;
          void completeFromUrl(initialUrl).then((result) => {
            if (!result.ok) setAsyncErrorMessage(result.message);
          });
        }
      });
    }

    // Timeout safety: prevent hanging forever on a spinner if opened without credentials
    const timeout = setTimeout(() => {
      if (!handled.current && !session) {
        setAsyncErrorMessage('Sign-in session timed out or was incomplete. Please try again.');
      }
    }, 4500);

    return () => clearTimeout(timeout);
  }, [code, hasError, session]);

  if (session) return <Redirect href="/" />;

  const displayError = paramErrorMessage ?? asyncErrorMessage;

  if (displayError) {
    return (
      <AuthScreen>
        <ScreenHeader title="Sign In" onBack={() => router.replace('/login')} />
        <AppText variant="body" style={styles.message}>
          {displayError}
        </AppText>
        <View style={styles.button}>
          <Button title="Back to Log In" onPress={() => router.replace('/login')} />
        </View>
      </AuthScreen>
    );
  }

  return (
    <View style={styles.loading}>
      <ActivityIndicator color={Colors.primary} size="large" />
    </View>
  );
}

const styles = StyleSheet.create({
  loading: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.background,
  },
  message: {
    marginTop: 20,
    minHeight: 22,
  },
  button: {
    marginTop: 40,
  },
});

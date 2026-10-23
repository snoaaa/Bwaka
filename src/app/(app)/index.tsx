import { useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { AppText, AuthScreen, Button, ScreenHeader } from '@/components/ui';
import { useAuth } from '@/context/auth-context';
import { fetchMyProfile, type Profile } from '@/lib/profile';

export default function HomeScreen() {
  const { signOut } = useAuth();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loggingOut, setLoggingOut] = useState(false);

  useEffect(() => {
    let active = true;
    void fetchMyProfile().then((value) => {
      if (active) setProfile(value);
    });
    return () => {
      active = false;
    };
  }, []);

  async function onLogOut() {
    setLoggingOut(true);
    await signOut();
    setLoggingOut(false);
  }

  const firstName = profile?.full_name.split(/\s+/)[0];

  return (
    <AuthScreen>
      <ScreenHeader title="Hello!" />
      <AppText variant="title" style={styles.welcome}>
        {firstName ? `Welcome, ${firstName}` : 'Welcome'}
      </AppText>
      <AppText variant="body" style={styles.subtitle}>
        You&apos;re signed in to He&apos;i.
      </AppText>
      <View style={styles.button}>
        <Button title="Log Out" onPress={onLogOut} loading={loggingOut} />
      </View>
    </AuthScreen>
  );
}

const styles = StyleSheet.create({
  welcome: {
    marginTop: 20,
  },
  subtitle: {
    marginTop: 4,
  },
  button: {
    marginTop: 40,
  },
});

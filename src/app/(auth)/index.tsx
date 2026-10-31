import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useRef, useState } from 'react';
import { Animated, Pressable, StyleSheet } from 'react-native';

import { BrandMark } from '@/components/ui';
import { Colors } from '@/constants/theme';

export default function FirstScreen() {
  const router = useRouter();
  const [fadeAnim] = useState(() => new Animated.Value(0));
  const [scaleAnim] = useState(() => new Animated.Value(0.95));
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const navigatedRef = useRef(false);

  useEffect(() => {
    function proceed() {
      if (navigatedRef.current) return;
      navigatedRef.current = true;
      if (timerRef.current) clearTimeout(timerRef.current);
      router.replace('/login');
    }

    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 700,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        tension: 35,
        friction: 8,
        useNativeDriver: true,
      }),
    ]).start();

    timerRef.current = setTimeout(() => {
      proceed();
    }, 3800);

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [fadeAnim, router, scaleAnim]);

  function handlePress() {
    if (navigatedRef.current) return;
    navigatedRef.current = true;
    if (timerRef.current) clearTimeout(timerRef.current);
    router.replace('/login');
  }

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel="Welcome to Bwaka. Tap to continue."
      onPress={handlePress}
      style={styles.container}>
      <StatusBar style="light" />

      <Animated.View
        style={[
          styles.centerContent,
          {
            opacity: fadeAnim,
            transform: [{ scale: scaleAnim }],
          },
        ]}>
        <BrandMark size={180} color={Colors.white} />
      </Animated.View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  centerContent: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});

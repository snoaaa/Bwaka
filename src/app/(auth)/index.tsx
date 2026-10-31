import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useRef, useState } from 'react';
import { Animated, Pressable, StyleSheet, View } from 'react-native';

import { AppText, BrandMark } from '@/components/ui';
import { Colors, FontFamily } from '@/constants/theme';

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
      router.push('/login');
    }

    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        tension: 40,
        friction: 7,
        useNativeDriver: true,
      }),
    ]).start();

    timerRef.current = setTimeout(() => {
      proceed();
    }, 2400);

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [fadeAnim, router, scaleAnim]);

  function handlePress() {
    if (navigatedRef.current) return;
    navigatedRef.current = true;
    if (timerRef.current) clearTimeout(timerRef.current);
    router.push('/login');
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
        <BrandMark size={148} color={Colors.white} />
        <AppText style={styles.slogan}>It&apos;s here!</AppText>
      </Animated.View>

      <View style={styles.bottomPrompt}>
        <AppText style={styles.tapPrompt}>Tap anywhere to continue</AppText>
      </View>
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
  slogan: {
    marginTop: 24,
    fontFamily: FontFamily.bold,
    fontSize: 32,
    lineHeight: 38,
    color: Colors.white,
    letterSpacing: 0.5,
    textAlign: 'center',
  },
  bottomPrompt: {
    position: 'absolute',
    bottom: 50,
  },
  tapPrompt: {
    fontFamily: FontFamily.medium,
    fontSize: 13,
    lineHeight: 18,
    color: 'rgba(255, 255, 255, 0.7)',
    letterSpacing: 0.3,
  },
});

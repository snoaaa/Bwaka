import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useRef, useState, type ComponentRef } from 'react';
import {
  Keyboard,
  Pressable,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';

import {
  AppText,
  AuthScreen,
  Button,
  FooterPrompt,
  ScreenHeader,
} from '@/components/ui';
import { sendOtp, verifyOtp, type AuthTarget } from '@/lib/auth/auth-service';
import { Colors, FontFamily, Radii } from '@/constants/theme';

const RESEND_COOLDOWN_SECONDS = 60;
const CODE_LENGTH = 6;

export default function VerifyOtpScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{
    destination?: string;
    type?: 'email' | 'phone';
    isSignUp?: string;
    fullName?: string;
  }>();

  const destination = params.destination ?? '';
  const authType = params.type === 'phone' ? 'phone' : 'email';
  const isSignUp = params.isSignUp === 'true';
  const fullName = params.fullName;

  const inputRef = useRef<ComponentRef<typeof TextInput>>(null);
  const [code, setCode] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [resending, setResending] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string>();
  const [infoMessage, setInfoMessage] = useState<string>();
  const [secondsLeft, setSecondsLeft] = useState(RESEND_COOLDOWN_SECONDS);

  useEffect(() => {
    if (secondsLeft <= 0) return;
    const timer = setTimeout(() => setSecondsLeft((val) => val - 1), 1000);
    return () => clearTimeout(timer);
  }, [secondsLeft]);

  useEffect(() => {
    const t = setTimeout(() => inputRef.current?.focus(), 300);
    return () => clearTimeout(t);
  }, []);

  function handleBack() {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace(isSignUp ? '/sign-up' : '/login');
    }
  }

  const target: AuthTarget =
    authType === 'phone'
      ? { type: 'phone', phone: destination }
      : { type: 'email', email: destination };

  async function handleVerify(otpToVerify?: string) {
    const token = otpToVerify ?? code;
    if (token.length !== CODE_LENGTH || submitting) return;

    Keyboard.dismiss();
    setErrorMessage(undefined);
    setInfoMessage(undefined);
    setSubmitting(true);

    const result = await verifyOtp(target, token);

    if (!result.ok) {
      setSubmitting(false);
      setErrorMessage(result.message);
    }
  }

  async function handleResend() {
    if (resending || secondsLeft > 0 || !destination) return;
    setErrorMessage(undefined);
    setInfoMessage(undefined);
    setResending(true);

    const result = await sendOtp(target, { isSignUp, fullName });
    setResending(false);

    if (result.ok) {
      setSecondsLeft(RESEND_COOLDOWN_SECONDS);
      setCode('');
      setInfoMessage('A new verification code has been sent.');
      inputRef.current?.focus();
    } else {
      setErrorMessage(result.message);
    }
  }

  function handleCodeChange(value: string) {
    const numeric = value.replace(/\D/g, '').slice(0, CODE_LENGTH);
    setCode(numeric);
    if (errorMessage) setErrorMessage(undefined);

    if (numeric.length === CODE_LENGTH) {
      void handleVerify(numeric);
    }
  }

  return (
    <AuthScreen
      footer={
        <FooterPrompt
          text={`Wrong ${authType === 'phone' ? 'phone number' : 'email'}?`}
          linkLabel="Change"
          onPress={handleBack}
        />
      }>
      <ScreenHeader title="Enter Code" onBack={handleBack} />

      <AppText variant="title" style={styles.title}>
        Verification Code
      </AppText>
      <AppText variant="body" style={styles.subtitle}>
        We sent a 6-digit code to{' '}
        <AppText style={styles.highlight}>{destination || 'your device'}</AppText>.
        Enter the code below.
      </AppText>

      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Enter verification code"
        onPress={() => inputRef.current?.focus()}
        style={styles.otpContainer}>
        {Array.from({ length: CODE_LENGTH }).map((_, index) => {
          const digit = code[index] ?? '';
          const isCurrent = index === code.length;
          const isFocused = isCurrent || (index === CODE_LENGTH - 1 && code.length === CODE_LENGTH);

          return (
            <View
              key={index}
              style={[
                styles.otpCell,
                isFocused && styles.otpCellFocused,
                digit ? styles.otpCellFilled : null,
              ]}>
              <AppText style={styles.otpDigit}>{digit}</AppText>
            </View>
          );
        })}

        <TextInput
          ref={inputRef}
          value={code}
          onChangeText={handleCodeChange}
          maxLength={CODE_LENGTH}
          keyboardType="number-pad"
          textContentType="oneTimeCode"
          autoFocus
          style={styles.hiddenInput}
        />
      </Pressable>

      {infoMessage ? (
        <AppText variant="link" accessibilityRole="alert" style={styles.infoMessage}>
          {infoMessage}
        </AppText>
      ) : null}

      {errorMessage ? (
        <AppText variant="error" accessibilityRole="alert" style={styles.errorMessage}>
          {errorMessage}
        </AppText>
      ) : null}

      <View style={styles.buttonWrapper}>
        <Button
          title="Verify & Continue"
          onPress={() => handleVerify()}
          loading={submitting}
          disabled={code.length !== CODE_LENGTH || submitting}
        />
      </View>

      <View style={styles.resendRow}>
        <AppText variant="body">Didn&apos;t receive a code? </AppText>
        {secondsLeft > 0 ? (
          <AppText style={styles.timerText}>Resend in {secondsLeft}s</AppText>
        ) : (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Resend code"
            disabled={resending}
            onPress={handleResend}>
            <AppText variant="link" style={styles.resendLink}>
              {resending ? 'Sending...' : 'Resend code'}
            </AppText>
          </Pressable>
        )}
      </View>
    </AuthScreen>
  );
}

const styles = StyleSheet.create({
  title: {
    marginTop: 20,
  },
  subtitle: {
    marginTop: 6,
    minHeight: 22,
  },
  highlight: {
    fontFamily: FontFamily.semiBold,
    color: Colors.text,
  },
  otpContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 36,
    position: 'relative',
  },
  otpCell: {
    width: 44,
    height: 52,
    borderRadius: Radii.input,
    backgroundColor: Colors.inputBg,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: 'transparent',
  },
  otpCellFocused: {
    borderColor: Colors.primary,
    backgroundColor: Colors.background,
  },
  otpCellFilled: {
    borderColor: Colors.cardOuter,
    backgroundColor: Colors.background,
  },
  otpDigit: {
    fontSize: 24,
    fontFamily: FontFamily.bold,
    color: Colors.text,
  },
  hiddenInput: {
    position: 'absolute',
    width: 1,
    height: 1,
    opacity: 0,
  },
  infoMessage: {
    marginTop: 14,
    textAlign: 'center',
  },
  errorMessage: {
    marginTop: 14,
    textAlign: 'center',
  },
  buttonWrapper: {
    marginTop: 32,
  },
  resendRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 24,
  },
  timerText: {
    fontSize: 12,
    fontFamily: FontFamily.medium,
    color: Colors.mutedBlue,
  },
  resendLink: {
    fontFamily: FontFamily.bold,
  },
});

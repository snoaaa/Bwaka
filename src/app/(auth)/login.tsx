import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import {
  AppText,
  AuthScreen,
  Button,
  FooterPrompt,
  PhoneInput,
  ScreenHeader,
  SocialRow,
  TextField,
} from '@/components/ui';
import { DEFAULT_COUNTRY, formatE164, type Country } from '@/constants/countries';
import { Colors, FontFamily, Radii } from '@/constants/theme';
import { sendOtp, signInWithProvider, type OAuthProvider } from '@/lib/auth/auth-service';
import {
  emailLoginSchema,
  normalizePhone,
  phoneLoginSchema,
  validate,
} from '@/lib/auth/schemas';

type LoginMode = 'email' | 'phone';

export default function LoginScreen() {
  const router = useRouter();
  const [mode, setMode] = useState<LoginMode>('email');

  // Email form state
  const [email, setEmail] = useState('');
  const [emailError, setEmailError] = useState<string>();

  // Phone form state
  const [selectedCountry, setSelectedCountry] = useState<Country>(DEFAULT_COUNTRY);
  const [phoneNational, setPhoneNational] = useState('');
  const [phoneError, setPhoneError] = useState<string>();

  const [formError, setFormError] = useState<string>();
  const [submitting, setSubmitting] = useState(false);
  const [socialBusy, setSocialBusy] = useState(false);

  const busy = submitting || socialBusy;

  async function onSubmit() {
    if (busy) return;
    setFormError(undefined);

    if (mode === 'email') {
      const result = validate(emailLoginSchema, { email });
      if (!result.success) {
        setEmailError(result.errors.email);
        return;
      }
      setEmailError(undefined);

      setSubmitting(true);
      const response = await sendOtp(
        { type: 'email', email: result.data.email },
        { isSignUp: false }
      );
      setSubmitting(false);

      if (!response.ok) {
        setFormError(response.message);
        return;
      }

      router.push({
        pathname: '/verify-otp',
        params: {
          destination: result.data.email,
          type: 'email',
          isSignUp: 'false',
        },
      });
    } else {
      const rawDigits = phoneNational.replace(/\D/g, '');
      if (!rawDigits) {
        setPhoneError('Please enter your mobile number.');
        return;
      }
      if (rawDigits.length !== selectedCountry.digitCount) {
        setPhoneError(
          `${selectedCountry.name} mobile numbers must be ${selectedCountry.digitCount} digits.`
        );
        return;
      }

      const fullPhone = formatE164(selectedCountry.dialCode, phoneNational);
      const normalized = normalizePhone(fullPhone);

      const result = validate(phoneLoginSchema, { phone: normalized ?? fullPhone });
      if (!result.success) {
        setPhoneError(result.errors.phone);
        return;
      }
      setPhoneError(undefined);

      setSubmitting(true);
      const response = await sendOtp(
        { type: 'phone', phone: result.data.phone },
        { isSignUp: false }
      );
      setSubmitting(false);

      if (!response.ok) {
        setFormError(response.message);
        return;
      }

      router.push({
        pathname: '/verify-otp',
        params: {
          destination: result.data.phone,
          type: 'phone',
          isSignUp: 'false',
        },
      });
    }
  }

  async function onProvider(provider: OAuthProvider) {
    if (busy) return;
    setFormError(undefined);
    setSocialBusy(true);
    const response = await signInWithProvider(provider);
    setSocialBusy(false);
    if (!response.ok && response.message !== 'Sign-in was cancelled.') {
      setFormError(response.message);
    }
  }

  return (
    <AuthScreen
      footer={
        <FooterPrompt
          text="Don't have an account?"
          linkLabel="Sign Up"
          onPress={() => router.replace('/sign-up')}
        />
      }>
      <ScreenHeader title="Log In" />

      <AppText variant="title" style={styles.welcome}>
        Welcome
      </AppText>
      <AppText variant="body" style={styles.subtitle}>
        Sign in to your account with a one-time verification code.
      </AppText>

      {/* Mode Switcher Tabs */}
      <View style={styles.tabContainer}>
        <Pressable
          accessibilityRole="tab"
          accessibilityState={{ selected: mode === 'email' }}
          onPress={() => {
            setMode('email');
            setFormError(undefined);
          }}
          style={[styles.tabButton, mode === 'email' && styles.tabButtonActive]}>
          <AppText style={[styles.tabText, mode === 'email' && styles.tabTextActive]}>
            Email
          </AppText>
        </Pressable>
        <Pressable
          accessibilityRole="tab"
          accessibilityState={{ selected: mode === 'phone' }}
          onPress={() => {
            setMode('phone');
            setFormError(undefined);
          }}
          style={[styles.tabButton, mode === 'phone' && styles.tabButtonActive]}>
          <AppText style={[styles.tabText, mode === 'phone' && styles.tabTextActive]}>
            Phone Number
          </AppText>
        </Pressable>
      </View>

      <View style={styles.form}>
        {mode === 'email' ? (
          <TextField
            label="Email"
            placeholder="example@example.com"
            value={email}
            onChangeText={(value) => {
              setEmail(value);
              if (emailError) setEmailError(undefined);
            }}
            error={emailError}
            autoCapitalize="none"
            autoComplete="email"
            autoCorrect={false}
            keyboardType="email-address"
            inputMode="email"
            textContentType="emailAddress"
            returnKeyType="go"
            onSubmitEditing={onSubmit}
            editable={!busy}
            maxLength={254}
          />
        ) : (
          <PhoneInput
            label="Mobile Number"
            value={phoneNational}
            onChangeText={(value) => {
              setPhoneNational(value);
              if (phoneError) setPhoneError(undefined);
            }}
            selectedCountry={selectedCountry}
            onSelectCountry={setSelectedCountry}
            error={phoneError}
            returnKeyType="go"
            onSubmitEditing={onSubmit}
            editable={!busy}
          />
        )}
      </View>

      {formError ? (
        <AppText variant="error" accessibilityRole="alert" style={styles.formError}>
          {formError}
        </AppText>
      ) : null}

      <View style={styles.button}>
        <Button
          title="Send Code"
          onPress={onSubmit}
          loading={submitting}
          disabled={socialBusy}
        />
      </View>

      <SocialRow
        caption="or log in with"
        onGoogle={() => onProvider('google')}
        onFacebook={() => onProvider('facebook')}
        disabled={busy}
      />
    </AuthScreen>
  );
}

const styles = StyleSheet.create({
  welcome: {
    marginTop: 20,
  },
  subtitle: {
    marginTop: 4,
    minHeight: 22,
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: Colors.inputBg,
    borderRadius: Radii.input,
    padding: 4,
    marginTop: 28,
  },
  tabButton: {
    flex: 1,
    height: 40,
    borderRadius: Radii.input - 3,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
  },
  tabButtonActive: {
    backgroundColor: Colors.primary,
  },
  tabText: {
    fontFamily: FontFamily.medium,
    fontSize: 14,
    lineHeight: 20,
    color: Colors.primary,
    textAlign: 'center',
  },
  tabTextActive: {
    color: Colors.white,
  },
  form: {
    marginTop: 24,
  },
  formError: {
    marginTop: 10,
    textAlign: 'center',
  },
  button: {
    marginTop: 32,
  },
});

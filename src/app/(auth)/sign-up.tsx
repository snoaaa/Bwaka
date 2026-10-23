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
  emailSignUpSchema,
  normalizePhone,
  phoneSignUpSchema,
  validate,
} from '@/lib/auth/schemas';
import { openPrivacy, openTerms } from '@/lib/legal';

type SignUpMode = 'email' | 'phone';

export default function SignUpScreen() {
  const router = useRouter();
  const [mode, setMode] = useState<SignUpMode>('email');

  const [fullName, setFullName] = useState('');
  const [nameError, setNameError] = useState<string>();

  // Email state
  const [email, setEmail] = useState('');
  const [emailError, setEmailError] = useState<string>();

  // Phone state
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
      const result = validate(emailSignUpSchema, { fullName, email });
      if (!result.success) {
        setNameError(result.errors.fullName);
        setEmailError(result.errors.email);
        return;
      }
      setNameError(undefined);
      setEmailError(undefined);

      setSubmitting(true);
      const response = await sendOtp(
        { type: 'email', email: result.data.email },
        { isSignUp: true, fullName: result.data.fullName }
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
          isSignUp: 'true',
          fullName: result.data.fullName,
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

      const result = validate(phoneSignUpSchema, {
        fullName,
        phone: normalized ?? fullPhone,
      });

      if (!result.success) {
        setNameError(result.errors.fullName);
        setPhoneError(result.errors.phone);
        return;
      }
      setNameError(undefined);
      setPhoneError(undefined);

      setSubmitting(true);
      const response = await sendOtp(
        { type: 'phone', phone: result.data.phone },
        { isSignUp: true, fullName: result.data.fullName }
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
          isSignUp: 'true',
          fullName: result.data.fullName,
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

  function onBack() {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace('/login');
    }
  }

  return (
    <AuthScreen
      footer={
        <FooterPrompt
          text="already have an account?"
          linkLabel="Log in"
          onPress={() => router.replace('/login')}
        />
      }>
      <ScreenHeader title="New Account" onBack={onBack} />

      <View style={styles.fields}>
        <TextField
          label="Full name"
          placeholder="Your full name"
          value={fullName}
          onChangeText={(value) => {
            setFullName(value);
            if (nameError) setNameError(undefined);
          }}
          error={nameError}
          autoCapitalize="words"
          autoComplete="name"
          textContentType="name"
          returnKeyType="next"
          editable={!busy}
          maxLength={80}
        />

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

      <View style={styles.terms}>
        <AppText variant="body" style={styles.termsText}>
          By continuing, you agree to
        </AppText>
        <View style={styles.termsLine}>
          <AppText variant="link" accessibilityRole="link" onPress={openTerms}>
            Terms of Use
          </AppText>
          <AppText variant="body"> and </AppText>
          <AppText variant="link" accessibilityRole="link" onPress={openPrivacy}>
            Privacy Policy.
          </AppText>
        </View>
      </View>

      {formError ? (
        <AppText variant="error" accessibilityRole="alert" style={styles.formError}>
          {formError}
        </AppText>
      ) : null}

      <View style={styles.button}>
        <Button
          title="Sign Up"
          onPress={onSubmit}
          loading={submitting}
          disabled={socialBusy}
        />
      </View>

      <SocialRow
        caption="or sign up with"
        onGoogle={() => onProvider('google')}
        onFacebook={() => onProvider('facebook')}
        disabled={busy}
      />
    </AuthScreen>
  );
}

const styles = StyleSheet.create({
  fields: {
    marginTop: 26,
    gap: 15,
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: Colors.inputBg,
    borderRadius: Radii.input,
    padding: 4,
    marginTop: 2,
    marginBottom: 4,
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
  terms: {
    marginTop: 18,
    alignItems: 'center',
  },
  termsText: {
    textAlign: 'center',
  },
  termsLine: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  formError: {
    marginTop: 10,
    textAlign: 'center',
  },
  button: {
    marginTop: 14,
  },
});

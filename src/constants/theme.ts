import { Platform } from 'react-native';

export const Colors = {
  primary: '#2260FF',
  cardOuter: '#CAD6FF',
  inputBg: '#ECF1FF',
  background: '#FFFFFF',
  headerTint: '#E2EAFF',
  text: '#070707',
  label: '#000000',
  placeholder: '#809CFF',
  mutedBlue: '#7080FF',
  avatarPlaceholder: '#D9D9D9',
  navy: '#00278C',
  white: '#FFFFFF',
} as const;

export const Radii = {
  input: 13,
  button: 22.5,
  socialCircle: 20,
  cardInner: 13,
  cardOuter: 17,
  screen: 30,
} as const;

export const Sizes = {
  frameWidth: 360,
  frameHeight: 800,
  screenPadding: 30,
  inputHeight: 45,
  buttonHeight: 45,
  buttonWidth: 207,
  socialCircle: 40,
  statusBar: 28,
  headerOffset: 42,
  headerHeight: 28,
  maxContentWidth: 480,
} as const;

export const FontFamily = {
  light: 'LeagueSpartan_300Light',
  regular: 'LeagueSpartan_400Regular',
  medium: 'LeagueSpartan_500Medium',
  semiBold: 'LeagueSpartan_600SemiBold',
  bold: 'LeagueSpartan_700Bold',
} as const;

export const Typography = {
  title: { fontFamily: FontFamily.semiBold, fontSize: 24, lineHeight: 32, color: Colors.primary },
  label: { fontFamily: FontFamily.medium, fontSize: 18, lineHeight: 24, color: Colors.label },
  input: { fontFamily: FontFamily.regular, fontSize: 18, lineHeight: 24, color: Colors.text },
  button: { fontFamily: FontFamily.medium, fontSize: 22, lineHeight: 28, color: Colors.white },
  body: { fontFamily: FontFamily.light, fontSize: 14, lineHeight: 20, color: Colors.text },
  link: { fontFamily: FontFamily.medium, fontSize: 14, lineHeight: 20, color: Colors.primary },
  caption: { fontFamily: FontFamily.semiBold, fontSize: 13, lineHeight: 18, color: Colors.primary },
  error: { fontFamily: FontFamily.medium, fontSize: 13, lineHeight: 18, color: Colors.navy },
} as const;

export const FallbackFont = Platform.select({ web: 'system-ui, sans-serif', default: undefined });

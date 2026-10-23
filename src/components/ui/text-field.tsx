import type { ComponentRef, Ref } from 'react';
import { Platform, StyleSheet, TextInput, View, type TextInputProps } from 'react-native';

import { Colors, Radii, Sizes, Typography } from '@/constants/theme';

import { AppText } from './app-text';

export type TextFieldProps = TextInputProps & {
  label: string;
  error?: string;
  ref?: Ref<ComponentRef<typeof TextInput>>;
};

export function TextField({ label, error, style, ref, ...rest }: TextFieldProps) {
  return (
    <View style={styles.container}>
      <AppText variant="label" style={styles.label}>
        {label}
      </AppText>
      <TextInput
        ref={ref}
        accessibilityLabel={label}
        placeholderTextColor={Colors.placeholder}
        selectionColor={Colors.primary}
        cursorColor={Colors.primary}
        underlineColorAndroid="transparent"
        style={[styles.input, style]}
        {...rest}
      />
      {error ? (
        <AppText variant="error" accessibilityRole="alert" style={styles.error}>
          {error}
        </AppText>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignSelf: 'stretch',
  },
  label: {
    marginBottom: 9,
  },
  input: {
    ...Typography.input,
    height: Sizes.inputHeight,
    borderRadius: Radii.input,
    backgroundColor: Colors.inputBg,
    paddingHorizontal: 13,
    paddingVertical: Platform.OS === 'ios' ? 10 : 6,
    outlineStyle: 'none',
  } as object,
  error: {
    marginTop: 6,
  },
});

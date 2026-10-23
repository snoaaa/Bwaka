import { useMemo, useState } from 'react';
import {
  FlatList,
  Modal,
  Platform,
  Pressable,
  SafeAreaView,
  StyleSheet,
  TextInput,
  View,
  type TextInputProps,
} from 'react-native';

import {
  type Country,
  formatPhoneNumber,
  searchCountries,
} from '@/constants/countries';
import { Colors, FontFamily, Radii, Sizes, Typography } from '@/constants/theme';

import { AppText } from './app-text';
import { CheckIcon, ChevronDown } from './icons';

export type PhoneInputProps = Omit<TextInputProps, 'value' | 'onChangeText' | 'maxLength'> & {
  label?: string;
  value: string;
  onChangeText: (value: string) => void;
  selectedCountry: Country;
  onSelectCountry: (country: Country) => void;
  error?: string;
};

export function PhoneInput({
  label = 'Mobile Number',
  value,
  onChangeText,
  selectedCountry,
  onSelectCountry,
  error,
  editable = true,
  ...rest
}: PhoneInputProps) {
  const [modalVisible, setModalVisible] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const filteredCountries = useMemo(() => {
    return searchCountries(searchQuery);
  }, [searchQuery]);

  function handleSelect(country: Country) {
    onSelectCountry(country);
    setModalVisible(false);
    setSearchQuery('');
    if (value) {
      onChangeText(formatPhoneNumber(value, country));
    }
  }

  function handleTextChange(input: string) {
    let cleanInput = input;
    if (value.length > input.length && value.endsWith(' ') && !input.endsWith(' ')) {
      cleanInput = input.trimEnd().slice(0, -1);
    }
    const formatted = formatPhoneNumber(cleanInput, selectedCountry);
    onChangeText(formatted);
  }

  const maxInputLength = selectedCountry.format ? selectedCountry.format.length : selectedCountry.digitCount;

  return (
    <View style={styles.container}>
      {label ? (
        <AppText variant="label" style={styles.label}>
          {label}
        </AppText>
      ) : null}

      <View style={styles.row}>
        {/* Country Flag & Indicative Button */}
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`Selected country: ${selectedCountry.name}, phone code ${selectedCountry.dialCode}. Tap to change.`}
          onPress={() => editable && setModalVisible(true)}
          disabled={!editable}
          style={({ pressed }) => [
            styles.countryButton,
            pressed && styles.pressed,
            !editable && styles.disabled,
          ]}>
          <AppText style={styles.flagEmoji}>{selectedCountry.flag}</AppText>
          <AppText style={styles.indicativeText}>{selectedCountry.dialCode}</AppText>
          <ChevronDown color={Colors.mutedBlue} size={10} />
        </Pressable>

        {/* National Number Input */}
        <TextInput
          accessibilityLabel={label}
          placeholder={selectedCountry.placeholder}
          placeholderTextColor={Colors.placeholder}
          selectionColor={Colors.primary}
          cursorColor={Colors.primary}
          underlineColorAndroid="transparent"
          keyboardType="phone-pad"
          inputMode="tel"
          textContentType="telephoneNumber"
          autoCorrect={false}
          editable={editable}
          value={value}
          onChangeText={handleTextChange}
          {...rest}
          maxLength={maxInputLength}
          style={[styles.input, !editable && styles.disabled]}
        />
      </View>

      {error ? (
        <AppText variant="error" accessibilityRole="alert" style={styles.error}>
          {error}
        </AppText>
      ) : null}

      {/* Country Selection Modal */}
      <Modal
        visible={modalVisible}
        animationType="slide"
        presentationStyle={Platform.OS === 'ios' ? 'pageSheet' : 'fullScreen'}
        onRequestClose={() => {
          setModalVisible(false);
          setSearchQuery('');
        }}>
        <SafeAreaView style={styles.modalRoot}>
          {/* Modal Header */}
          <View style={styles.modalHeader}>
            <View style={styles.modalHeaderLeft}>
              <AppText variant="title" style={styles.modalTitle}>
                Select Country
              </AppText>
              <AppText variant="body" style={styles.modalSubtitle}>
                Choose your country for the phone code
              </AppText>
            </View>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Close country selection"
              onPress={() => {
                setModalVisible(false);
                setSearchQuery('');
              }}
              style={({ pressed }) => [styles.closeButton, pressed && styles.pressed]}>
              <AppText style={styles.closeButtonText}>✕</AppText>
            </Pressable>
          </View>

          {/* Search Box */}
          <View style={styles.searchContainer}>
            <TextInput
              accessibilityLabel="Search country or dial code"
              placeholder="Search by country or +dial code..."
              placeholderTextColor={Colors.placeholder}
              selectionColor={Colors.primary}
              value={searchQuery}
              onChangeText={setSearchQuery}
              autoCorrect={false}
              autoCapitalize="none"
              clearButtonMode="while-editing"
              style={styles.searchInput}
            />
          </View>

          {/* Country List */}
          <FlatList
            data={filteredCountries}
            keyExtractor={(item) => `${item.code}-${item.dialCode}`}
            keyboardShouldPersistTaps="handled"
            contentContainerStyle={styles.listContent}
            renderItem={({ item }) => {
              const isSelected = item.code === selectedCountry.code;
              return (
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={`${item.name}, ${item.dialCode}`}
                  onPress={() => handleSelect(item)}
                  style={({ pressed }) => [
                    styles.countryItem,
                    isSelected && styles.selectedCountryItem,
                    pressed && styles.countryItemPressed,
                  ]}>
                  <AppText style={styles.itemFlag}>{item.flag}</AppText>
                  <View style={styles.itemInfo}>
                    <AppText style={styles.itemName} numberOfLines={1}>
                      {item.name}
                    </AppText>
                    <AppText style={styles.itemCode}>{item.code}</AppText>
                  </View>
                  <AppText style={styles.itemDialCode}>{item.dialCode}</AppText>
                  {isSelected ? (
                    <View style={styles.checkIconWrapper}>
                      <CheckIcon color={Colors.primary} size={16} />
                    </View>
                  ) : null}
                </Pressable>
              );
            }}
          />
        </SafeAreaView>
      </Modal>
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
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  countryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: Sizes.inputHeight,
    paddingHorizontal: 12,
    gap: 6,
    borderRadius: Radii.input,
    backgroundColor: Colors.inputBg,
  },
  flagEmoji: {
    fontSize: 20,
    lineHeight: 24,
  },
  indicativeText: {
    fontFamily: FontFamily.medium,
    fontSize: 16,
    lineHeight: 22,
    color: Colors.text,
  },
  input: {
    ...Typography.input,
    flex: 1,
    height: Sizes.inputHeight,
    borderRadius: Radii.input,
    backgroundColor: Colors.inputBg,
    paddingHorizontal: 13,
    paddingVertical: Platform.OS === 'ios' ? 10 : 6,
    outlineStyle: 'none',
  } as object,
  disabled: {
    opacity: 0.6,
  },
  pressed: {
    opacity: 0.8,
  },
  error: {
    marginTop: 6,
  },
  modalRoot: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 12,
  },
  modalHeaderLeft: {
    flex: 1,
  },
  modalTitle: {
    fontSize: 22,
    lineHeight: 28,
    color: Colors.primary,
  },
  modalSubtitle: {
    marginTop: 2,
    fontSize: 13,
    lineHeight: 18,
    color: Colors.mutedBlue,
  },
  closeButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.inputBg,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 12,
  },
  closeButtonText: {
    fontSize: 16,
    lineHeight: 20,
    fontFamily: FontFamily.bold,
    color: Colors.primary,
  },
  searchContainer: {
    paddingHorizontal: 20,
    paddingVertical: 8,
  },
  searchInput: {
    height: 44,
    borderRadius: Radii.input,
    backgroundColor: Colors.inputBg,
    paddingHorizontal: 14,
    fontSize: 15,
    fontFamily: FontFamily.regular,
    color: Colors.text,
    outlineStyle: 'none',
  } as object,
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 30,
  },
  countryItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 12,
    gap: 12,
  },
  selectedCountryItem: {
    backgroundColor: Colors.inputBg,
  },
  countryItemPressed: {
    backgroundColor: Colors.headerTint,
  },
  itemFlag: {
    fontSize: 24,
    lineHeight: 28,
  },
  itemInfo: {
    flex: 1,
  },
  itemName: {
    fontSize: 16,
    lineHeight: 22,
    fontFamily: FontFamily.medium,
    color: Colors.text,
  },
  itemCode: {
    fontSize: 12,
    lineHeight: 16,
    fontFamily: FontFamily.regular,
    color: Colors.mutedBlue,
    marginTop: 2,
  },
  itemDialCode: {
    fontSize: 15,
    lineHeight: 20,
    fontFamily: FontFamily.semiBold,
    color: Colors.primary,
  },
  checkIconWrapper: {
    marginLeft: 6,
  },
});

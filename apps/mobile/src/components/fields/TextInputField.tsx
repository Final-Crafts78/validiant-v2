import React from 'react';
import { TextInput, StyleSheet, KeyboardTypeOptions } from 'react-native';
import { theme } from '../../lib/theme';

interface Props {
  value?: string;
  onChange: (value: string) => void;
  keyboardType?: KeyboardTypeOptions;
  placeholder?: string;
  secureTextEntry?: boolean;
}

export function TextInputField({
  value,
  onChange,
  keyboardType,
  placeholder,
  secureTextEntry,
}: Props) {
  return (
    <TextInput
      style={styles.input}
      value={value || ''}
      onChangeText={onChange}
      keyboardType={keyboardType}
      placeholder={placeholder}
      placeholderTextColor={theme.colors.slate[400]}
      secureTextEntry={secureTextEntry}
    />
  );
}

const styles = StyleSheet.create({
  input: {
    height: 48,
    backgroundColor: theme.colors.slate[50],
    borderWidth: 1,
    borderColor: theme.colors.slate[200],
    borderRadius: theme.borderRadius.md,
    paddingHorizontal: 12,
    fontSize: theme.typography.size.sm,
    color: theme.colors.slate[900],
    fontWeight: theme.typography.weight.medium,
  },
});

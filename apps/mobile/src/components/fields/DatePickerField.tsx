import React, { useState } from 'react';
import { TouchableOpacity, Text, StyleSheet, Platform, View } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { theme } from '../../lib/theme';
import { Calendar } from 'lucide-react-native';
import { format } from 'date-fns';

interface Props {
  value?: string; // ISO string
  onChange: (value: string) => void;
}

export function DatePickerField({ value, onChange }: Props) {
  const [show, setShow] = useState(false);
  const dateValue = value ? new Date(value) : new Date();

  const handleDateChange = (event: any, selectedDate?: Date) => {
    setShow(Platform.OS === 'ios');
    if (selectedDate) {
      onChange(selectedDate.toISOString());
    }
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity 
        style={styles.pickerButton} 
        onPress={() => setShow(true)}
      >
        <Calendar size={18} color={theme.colors.slate[400]} />
        <Text style={[styles.dateText, !value && { color: theme.colors.slate[400] }]}>
          {value ? format(dateValue, 'PPP') : 'Select Date'}
        </Text>
      </TouchableOpacity>

      {show && (
        <DateTimePicker
          value={dateValue}
          mode="date"
          display={Platform.OS === 'ios' ? 'spinner' : 'default'}
          onChange={handleDateChange}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    height: 48,
    justifyContent: 'center',
  },
  pickerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: theme.colors.slate[50],
    borderWidth: 1,
    borderColor: theme.colors.slate[200],
    borderRadius: theme.borderRadius.md,
    paddingHorizontal: 12,
    height: 44,
  },
  dateText: {
    fontSize: theme.typography.size.sm,
    color: theme.colors.slate[700],
    fontWeight: theme.typography.weight.medium,
  },
});

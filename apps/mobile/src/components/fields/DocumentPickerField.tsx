import React from 'react';
import { TouchableOpacity, Text, StyleSheet, View } from 'react-native';
import * as DocumentPicker from 'expo-document-picker';
import { theme } from '../../lib/theme';
import { FileText, Upload, X } from 'lucide-react-native';

interface Props {
  value?: string;
  onChange: (uri: string, name: string, type: string) => void;
}

export function DocumentPickerField({ value, onChange }: Props) {
  const handlePick = async () => {
    const result = await DocumentPicker.getDocumentAsync({
      type: ['application/pdf', 'image/*'],
      copyToCacheDirectory: true,
    });

    if (!result.canceled && result.assets[0].uri) {
      const asset = result.assets[0];
      onChange(
        asset.uri,
        asset.name,
        asset.mimeType || 'application/octet-stream'
      );
    }
  };

  return (
    <View style={styles.container}>
      {value ? (
        <View style={styles.fileCard}>
          <FileText size={18} color={theme.colors.slate[400]} />
          <Text style={styles.fileName} numberOfLines={1}>
            {value.split('/').pop()}
          </Text>
          <TouchableOpacity onPress={() => onChange('', '', '')}>
            <X size={16} color={theme.colors.rose[500]} />
          </TouchableOpacity>
        </View>
      ) : (
        <TouchableOpacity style={styles.uploadButton} onPress={handlePick}>
          <Upload size={18} color={theme.colors.primary} />
          <Text style={styles.uploadText}>Select Document (PDF/Image)</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    height: 48,
    justifyContent: 'center',
  },
  uploadButton: {
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
  uploadText: {
    fontSize: theme.typography.size.sm,
    color: theme.colors.slate[600],
    fontWeight: theme.typography.weight.medium,
  },
  fileCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: theme.colors.emerald[50],
    paddingHorizontal: 12,
    height: 44,
    borderRadius: theme.borderRadius.md,
    borderWidth: 1,
    borderColor: theme.colors.emerald[100],
  },
  fileName: {
    flex: 1,
    fontSize: theme.typography.size.xs,
    color: theme.colors.slate[700],
    fontWeight: theme.typography.weight.semibold,
  },
});
